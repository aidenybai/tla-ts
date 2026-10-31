// Ported from Z3 (src/smt/smt_context.cpp), MIT license, see z3-license.txt. The SMT kernel's
// search: a CDCL loop over Boolean variables combined with an E-graph for congruence closure,
// relevancy propagation, the arithmetic theory and quantifier instantiation, with Z3's default
// parameters for UFNIA.
import type { AssertedFormulas } from "./asserted-formulas";
import { AstManager, FAMILY_ARITH, KIND_APP, KIND_QUANTIFIER, KIND_VAR } from "./ast";
import { getCongruenceJustification } from "./cg-table";
import { BJustification, Clause, CLS_LEARNED } from "./clause";
import { ConflictResolution } from "./conflict-resolution";
import {
  Enode,
  EqConflictJustification,
  EqJustification,
  EqPropagationJustification,
  EqRootPropagationJustification,
  MpIffJustification,
} from "./enode";
import { Internalizer, UNDO_ADD_EQ, UNDO_TH_VAR } from "./internalizer";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { BoolVar, getVar, isNegated, Literal, mkLiteral, negate } from "./literal";
import { mkModel } from "./model-generator";
import type { GeneratedModel } from "./model-generator";
import type { ProtoModel } from "./proto-model";
import { DefaultQuantifierManager } from "./quantifier-manager";
import { TheoryLra } from "./theory-lra";

export const FC_DONE = 0;
export const FC_CONTINUE = 1;
export const FC_GIVEUP = 2;

const ACTIVITY_LIMIT = 1e100;
const INV_ACTIVITY_LIMIT = 1e-100;
const INV_DECAY = 1.052;
const RESTART_INITIAL = 100;
const RESTART_FACTOR = 1.1;
// phase_caching_on and phase_caching_off: the numbers of conflicts while phase caching is on and off.
const PHASE_CACHING_ON = 400;
const PHASE_CACHING_OFF = 100;
const AGILITY_FACTOR = 0.9999;
// The LGC_FIXED lemma garbage collection: lemma_gc_initial conflicts between collections, and the
// activity and unassigned literal thresholds of del_inactive_lemmas2.
const LEMMA_GC_INITIAL = 5000;
// theory_lra::num_final_check_levels: level 2 also runs nlsat's full check.
const NUM_ARITH_FINAL_CHECK_LEVELS = 2;
const NEW_OLD_RATIO = 16;
const OLD_CLAUSE_ACTIVITY = 500;
const NEW_CLAUSE_RELEVANCY = 45;
const OLD_CLAUSE_RELEVANCY = 6;
const RESTART_AGILITY_THRESHOLD = 0.18;

export const CHECK_MODEL_SAT = 0;
export const CHECK_MODEL_UNKNOWN = 1;
export const CHECK_MODEL_RESTART = 2;

// The reasons a search may stop without an answer that MBQI cares about.
export const FAILURE_OK = 0;
export const FAILURE_THEORY = 1;
export const FAILURE_QUANTIFIERS = 2;
const FAILURE_CANCELED = 3;

// smt_params: the kernel runs model-based quantifier instantiation with relevancy level 2 and the
// CS_ACTIVITY_DELAY_NEW case split queue. The model checker's auxiliary context runs neither, as Z3
// sets its relevancy level to 0 and its case split strategy to CS_ACTIVITY.
export interface SmtParams {
  isMbqi: boolean;
  relevancyLevel: 0 | 2;
}

export class Context extends Internalizer {
  // setup_context makes the theories after the first formulas are asserted.
  theory!: TheoryLra;
  readonly qmanager: DefaultQuantifierManager;
  readonly conflictResolution: ConflictResolution = new ConflictResolution(this);
  private qhead = 0;
  private scopeAssignedLimits: number[] = [];
  private scopeAuxClauseLimits: number[] = [];
  private scopeTrailLimits: number[] = [];
  // The number of lemmas when each user scope began.
  private baseScopeLemmaLimits: number[] = [];
  private atomPropagationQueue: Literal[] = [];
  private thEqQueue: number[] = [];
  private thDiseqQueue: number[] = [];
  private bvarInc = 1;
  private agility = 0;
  private numConflicts = 0;
  private numConflictsSinceRestart = 0;
  private numConflictsSinceLemmaGc = 0;
  private restartThreshold = RESTART_INITIAL;
  private restartOuterThreshold = RESTART_INITIAL;
  private isPhaseCacheOn = true;
  private phaseCounter = 0;
  private finalCheckIndex = 0;
  private r1ParentGenerations = new Map<Enode, number>();
  private erasedGenerations = new Map<Enode, number>();
  private lastSearchFailure = FAILURE_OK;
  // m_model_generator's model, m_proto_model and m_model.
  private generatedModel: GeneratedModel | null = null;
  private protoModel: ProtoModel | null = null;
  private model: ProtoModel | null = null;

  constructor(manager: AstManager, params: SmtParams) {
    super(manager, params.relevancyLevel > 0, params.relevancyLevel > 0);
    this.qmanager = new DefaultQuantifierManager(this, params.isMbqi);
  }

  // register_plugin initializes each theory it registers.
  setupContext() {
    this.theory = new TheoryLra(this);
    this.theory.init();
  }

  // The search stops with unknown when the manager's resource limit cancels it.
  checkCanceled() {
    return !this.manager.limit.inc();
  }

  // Assignment and propagation.

  assign(literal: Literal, justification: BJustification, isDecision = false) {
    const value = this.assignment[literal];
    if (value === L_FALSE) this.setConflict(justification, negate(literal));
    else if (value === L_UNDEF) this.assignCore(literal, justification, isDecision);
  }

  private assignCore(literal: Literal, justification: BJustification, isDecision: boolean) {
    const boolVar = getVar(literal);
    this.assignedLiterals.push(literal);
    this.assignment[literal] = L_TRUE;
    this.assignment[negate(literal)] = L_FALSE;
    this.justifications[boolVar] = justification;
    this.levels[boolVar] = this.scopeLevel;
    const isNegative = isNegated(literal);
    if (this.phaseAvailable[boolVar]) {
      this.agility *= AGILITY_FACTOR;
      if (!isDecision && this.phases[boolVar] === isNegative) this.agility += 1 - AGILITY_FACTOR;
    }
    this.phaseAvailable[boolVar] = true;
    this.phases[boolVar] = !isNegative;
    if (this.isAtom(boolVar) && this.isRelevant(this.boolVar2Expr[boolVar]))
      this.atomPropagationQueue.push(literal);
  }

  private bcp() {
    while (this.qhead < this.assignedLiterals.length) {
      if (this.checkCanceled()) return true;
      const literal = this.assignedLiterals[this.qhead];
      this.qhead++;
      const notLiteral = negate(literal);
      const binary = this.binaryWatches[literal];
      if (binary !== undefined && binary.length > 0) {
        const justification = this.getBinJustification(literal);
        for (let index = binary.length - 1; index >= 0; index--) {
          const other = binary[index];
          const value = this.assignment[other];
          if (value === L_FALSE) {
            this.setConflict(justification, negate(other));
            return false;
          }
          if (value === L_UNDEF) this.assignCore(other, justification, false);
        }
      }
      const list = this.watches[literal];
      if (list === undefined) continue;
      let kept = 0;
      let index = 0;
      for (; index < list.length; index++) {
        const clause: Clause = list[index];
        const literals = clause.literals;
        if (literals[0] === notLiteral) {
          literals[0] = literals[1];
          literals[1] = notLiteral;
        }
        const firstLiteral = literals[0];
        const firstValue = this.assignment[firstLiteral];
        if (firstValue === L_TRUE) {
          list[kept++] = clause;
          continue;
        }
        let isFound = false;
        for (let position = 2; position < literals.length; position++) {
          const candidate = literals[position];
          if (this.assignment[candidate] !== L_FALSE) {
            this.addWatch(negate(candidate), clause);
            literals[1] = candidate;
            literals[position] = notLiteral;
            isFound = true;
            break;
          }
        }
        if (isFound) continue;
        list[kept++] = clause;
        if (firstValue === L_FALSE) {
          for (index++; index < list.length; index++) list[kept++] = list[index];
          list.length = kept;
          this.setConflict(clause, null);
          return false;
        }
        this.assignCore(firstLiteral, clause, false);
      }
      list.length = kept;
    }
    return true;
  }

  private propagateEqs() {
    for (let index = 0; index < this.eqPropagationQueue.length && !this.checkCanceled(); index++) {
      const entry = this.eqPropagationQueue[index];
      this.addEq(entry.lhs, entry.rhs, entry.justification);
      if (this.isInconsistent()) {
        this.eqPropagationQueue = [];
        return false;
      }
    }
    this.eqPropagationQueue = [];
    return true;
  }

  private propagateAtoms() {
    const queue = this.atomPropagationQueue;
    for (let index = 0; index < queue.length && !this.checkCanceled(); index++) {
      const literal = queue[index];
      const boolVar = getVar(literal);
      const value = this.assignment[mkLiteral(boolVar)];
      if (this.isEnodeFlags[boolVar]) this.propagateBoolVarEnode(boolVar);
      if (this.isInconsistent()) return false;
      if (this.isEqFlags[boolVar]) {
        const args = this.manager.args[this.boolVar2Expr[boolVar]];
        if (!this.manager.isBool(args[0])) {
          const lhs = this.exprToEnode[args[0]];
          const rhs = this.exprToEnode[args[1]];
          if (lhs !== undefined && rhs !== undefined) {
            if (value === L_TRUE) this.addEq(lhs, rhs, { kind: "equation", literal: literal });
            else if (!this.addDiseq(lhs, rhs) && !this.isInconsistent())
              this.setConflict(new EqPropagationJustification(lhs, rhs), mkLiteral(boolVar, true));
          }
        }
      } else if (this.isTheoryFlags[boolVar]) this.theory.assignEh(boolVar, value === L_TRUE);
      else if (this.isQuantifierFlags[boolVar] && value === L_TRUE)
        this.qmanager.assignEh(this.boolVar2Expr[boolVar]);
      if (this.isInconsistent()) return false;
    }
    this.atomPropagationQueue = [];
    return true;
  }

  protected propagateBoolVarEnode(boolVar: BoolVar) {
    const value = this.assignment[mkLiteral(boolVar)];
    let node = this.exprToEnode[this.boolVar2Expr[boolVar]];
    if (node === undefined) return;
    const isNegative = value === L_FALSE;
    if (node.isMergeTf)
      this.addEq(node, isNegative ? this.falseEnode : this.trueEnode, {
        kind: "equation",
        literal: mkLiteral(boolVar, isNegative),
      });
    const root = node.root;
    if (root === this.trueEnode || root === this.falseEnode) return;
    if (
      node === root ||
      !this.isRelevant(root.owner) ||
      this.assignment[mkLiteral(this.getBoolVar(root.owner))] !== value
    ) {
      const first = node;
      node = node.next;
      while (node !== first) {
        const otherVar = this.getBoolVar(node.owner);
        if (this.assignment[mkLiteral(otherVar)] !== value)
          this.assign(mkLiteral(otherVar, isNegative), this.mkMpIff(first, node));
        node = node.next;
      }
    }
  }

  private mkMpIff(first: Enode, second: Enode) {
    return new MpIffJustification(first, second, (node) => this.enodeToLiteral(node));
  }

  relevantEh(expr: number) {
    const boolVar = this.findBoolVar(expr);
    if (boolVar !== undefined && this.isAtom(boolVar)) {
      const value = this.assignment[mkLiteral(boolVar)];
      if (value !== L_UNDEF) this.atomPropagationQueue.push(mkLiteral(boolVar, value === L_FALSE));
    }
    if (this.manager.kinds[expr] !== KIND_APP) return;
    const node = this.exprToEnode[expr];
    if (node !== undefined) this.qmanager.relevantEh(node);
    if (this.manager.getFamily(expr) === FAMILY_ARITH || (node !== undefined && node.thVar >= 0))
      this.theory.relevantEh(expr);
  }

  private propagateRelevancy(qhead: number) {
    for (let index = qhead; index < this.assignedLiterals.length; index++) {
      const literal = this.assignedLiterals[index];
      this.relevancy.assignEh(this.boolVar2Expr[getVar(literal)], !isNegated(literal));
    }
    this.relevancy.propagate();
  }

  private propagateThEqs() {
    const queue = this.thEqQueue;
    for (let index = 0; index < queue.length && !this.isInconsistent(); index += 2)
      this.theory.newEqEh(queue[index], queue[index + 1]);
    this.thEqQueue = [];
  }

  private propagateThDiseqs() {
    const queue = this.thDiseqQueue;
    for (let index = 0; index < queue.length && !this.isInconsistent(); index += 2)
      this.theory.newDiseqEh(queue[index], queue[index + 1]);
    this.thDiseqQueue = [];
  }

  canPropagate() {
    return (
      this.qhead !== this.assignedLiterals.length ||
      this.relevancy.canPropagate() ||
      this.atomPropagationQueue.length > 0 ||
      this.qmanager.canPropagate() ||
      this.theory.canPropagate() ||
      this.eqPropagationQueue.length > 0 ||
      this.thEqQueue.length > 0 ||
      this.thDiseqQueue.length > 0
    );
  }

  propagate() {
    for (;;) {
      if (this.isInconsistent()) return false;
      const qhead = this.qhead;
      if (!this.bcp()) return false;
      this.propagateRelevancy(qhead);
      if (this.isInconsistent()) return false;
      if (!this.propagateAtoms()) return false;
      if (!this.propagateEqs()) return false;
      this.propagateThEqs();
      this.propagateThDiseqs();
      if (this.isInconsistent()) return false;
      this.theory.propagate();
      if (this.isInconsistent()) return false;
      if (!this.checkCanceled()) this.qmanager.propagate();
      if (this.isInconsistent()) return false;
      if (this.isResourceLimitExceeded()) {
        this.qhead = qhead;
        return true;
      }
      if (!this.canPropagate()) return true;
    }
  }

  // Equalities.

  private getClosestVar(start: Enode) {
    for (let node: Enode | null = start; node !== null; node = node.transTarget)
      if (node.thVar >= 0) return node.thVar;
    return -1;
  }

  private invertTrans(start: Enode) {
    let current = start.transTarget;
    let justification = start.transJustification;
    let previous = start;
    start.transTarget = null;
    while (current !== null) {
      const next = current.transTarget;
      const nextJustification = current.transJustification;
      current.transTarget = previous;
      current.transJustification = justification;
      previous = current;
      current = next;
      justification = nextJustification;
    }
  }

  private pushNewThEq(first: number, second: number) {
    this.thEqQueue.push(first, second);
  }

  private pushNewThDiseq(first: number, second: number) {
    const theory = this.theory;
    if (theory.getEnode(first).isInterpreted && theory.getEnode(second).isInterpreted) return;
    this.thDiseqQueue.push(first, second);
  }

  private pushNewThDiseqs(root: Enode, thVar: number) {
    for (const parent of root.parents) {
      if (!parent.isEq) continue;
      if (this.assignment[mkLiteral(this.getBoolVar(parent.owner))] !== L_FALSE) continue;
      let lhs = parent.args[0];
      let rhs = parent.args[1];
      if (rhs.root === root.root) {
        const saved = lhs;
        lhs = rhs;
        rhs = saved;
      }
      const rhsVar = this.getClosestVar(rhs);
      const lhsVar = this.getClosestVar(lhs);
      const finalVar = lhsVar >= 0 ? lhsVar : thVar;
      if (rhsVar >= 0 && finalVar !== rhsVar) this.pushNewThDiseq(finalVar, rhsVar);
    }
  }

  private mergeTheoryVars(n2: Enode, n1: Enode, justification: EqJustification) {
    const r2 = n2.root;
    const r1 = n1.root;
    if (r1.thVar < 0 && r2.thVar < 0) return;
    const isFromTheory = justification.kind === "justification";
    const v2 = this.getClosestVar(n2);
    const v1 = this.getClosestVar(n1);
    if (v2 >= 0 && v1 >= 0) {
      if (!isFromTheory) this.pushNewThEq(v2, v1);
    } else if (v1 < 0 && v2 >= 0) this.pushNewThDiseqs(r1, v2);
    else if (v1 >= 0 && v2 < 0) {
      r2.thVar = v1;
      this.pushNewThDiseqs(r2, v1);
    }
  }

  attachThVar(node: Enode, thVar: number) {
    const oldVar = node.thVar;
    // A variable that an equality moved to the node's list, which the node's own replaces.
    if (oldVar >= 0) {
      node.thVar = thVar;
      this.pushTrail(() => {
        node.thVar = oldVar;
      });
      this.pushNewThEq(thVar, oldVar);
      return;
    }
    const root = node.root;
    const rootVar = root.thVar;
    node.thVar = thVar;
    this.trailInts.push(thVar);
    this.trailNodes.push(node);
    this.trailKinds.push(UNDO_TH_VAR);
    if (rootVar < 0) {
      if (root !== node) root.thVar = thVar;
      this.pushNewThDiseqs(root, thVar);
    } else if (root !== node) this.pushNewThEq(rootVar, thVar);
  }

  private isCongruent(first: Enode, second: Enode) {
    if (first.decl !== second.decl || first.args.length !== second.args.length) return false;
    let isSame = true;
    for (let index = 0; index < first.args.length && isSame; index++)
      isSame = first.args[index].root === second.args[index].root;
    if (isSame) return true;
    return (
      first.isEq &&
      first.args[0].root === second.args[1].root &&
      first.args[1].root === second.args[0].root
    );
  }

  addEq(inputN1: Enode, inputN2: Enode, justification: EqJustification) {
    let n1 = inputN1;
    let n2 = inputN2;
    let r1 = n1.root;
    let r2 = n2.root;
    if (r1 === r2) return;
    if (r1.isInterpreted && r2.isInterpreted) {
      this.setConflict(new EqConflictJustification(n1, n2, justification), null);
      return;
    }
    if ((r1.classSize > r2.classSize && !r2.isInterpreted) || r1.isInterpreted) {
      const savedNode = n1;
      n1 = n2;
      n2 = savedNode;
      const savedRoot = r1;
      r1 = r2;
      r2 = savedRoot;
    }
    if (this.isRelevant(r1.owner)) this.markAsRelevant(r2.owner);
    else if (this.isRelevant(r2.owner)) this.markAsRelevant(r1.owner);
    const r2NumParents = r2.parents.length;
    this.qmanager.addEqEh(r1, r2);
    this.mergeTheoryVars(n2, n1, justification);
    this.invertTrans(n1);
    n1.transTarget = n2;
    n1.transJustification = justification;
    this.removeParentsFromCgTable(r1);
    let current = r1;
    do {
      current.root = r2;
      current = current.next;
    } while (current !== r1);
    this.reinsertParentsIntoCgTable(r1, r2);
    this.trailInts.push(r2NumParents);
    this.trailNodes.push(r1, n1);
    this.trailKinds.push(UNDO_ADD_EQ);
    if (n2.isBool) this.propagateBoolEnodeAssignment(r1, r2, n1, n2);
    const savedNext = r1.next;
    r1.next = r2.next;
    r2.next = savedNext;
    r2.classSize += r1.classSize;
  }

  private removeParentsFromCgTable(r1: Enode) {
    for (const parent of r1.parents) {
      if (parent.isMarked || !parent.isCgr() || parent.isTrueEq()) continue;
      parent.isMarked = true;
      if (parent.isCgcEnabled) {
        if (!parent.isEq) this.r1ParentGenerations.set(parent, parent.generation);
        this.cgTable.erase(parent);
      }
    }
  }

  private reinsertParentsIntoCgTable(r1: Enode, r2: Enode) {
    const r1Parents = r1.parents;
    for (let index = 0; index < r1Parents.length; index++) {
      const parent = r1Parents[index];
      if (!parent.isMarked) continue;
      parent.isMarked = false;
      if (parent.isEq) {
        const lhs = parent.args[0];
        const rhs = parent.args[1];
        if (lhs.root === rhs.root) {
          const boolVar = this.getBoolVar(parent.owner);
          if (this.assignment[mkLiteral(boolVar)] !== L_TRUE)
            this.assign(mkLiteral(boolVar), new EqPropagationJustification(lhs, rhs));
          continue;
        }
      }
      if (!parent.isCgcEnabled) {
        r2.addParent(parent);
        continue;
      }
      const parentGeneration = parent.isEq
        ? 0
        : (this.r1ParentGenerations.get(parent) ?? this.getGeneration(parent));
      const congruent = this.cgTable.insert(parent);
      if (congruent === parent) {
        parent.generation = parentGeneration;
        r2.addParent(parent);
        continue;
      }
      parent.cg = congruent;
      this.mergeCgcGenerations(parent, parentGeneration, congruent);
      if (congruent.root !== parent.root)
        this.pushEq(parent, congruent, getCongruenceJustification(parent, congruent));
    }
    this.r1ParentGenerations.clear();
  }

  protected override undoTrailEntry(kind: number) {
    switch (kind) {
      case UNDO_ADD_EQ: {
        const n1 = this.popTrailNode();
        this.undoAddEq(this.popTrailNode(), n1, this.popTrailInt());
        return;
      }
      case UNDO_TH_VAR: {
        const node = this.popTrailNode();
        const thVar = this.popTrailInt();
        node.thVar = -1;
        if (node.root !== node && node.root.thVar === thVar) node.root.thVar = -1;
        return;
      }
      default:
        super.undoTrailEntry(kind);
    }
  }

  private undoAddEq(r1: Enode, n1: Enode, r2NumParents: number) {
    const r2 = r1.root;
    r2.classSize -= r1.classSize;
    const savedNext = r1.next;
    r1.next = r2.next;
    r2.next = savedNext;
    const erasedGenerations = this.erasedGenerations;
    erasedGenerations.clear();
    for (let index = r2NumParents; index < r2.parents.length; index++) {
      const parent = r2.parents[index];
      if (parent.isCgcEnabled) {
        if (!parent.isEq) erasedGenerations.set(parent, parent.generation);
        this.cgTable.erase(parent);
      }
    }
    let current = r1;
    do {
      current.root = r1;
      current = current.next;
    } while (current !== r1);
    r2.parents.length = r2NumParents;
    for (const parent of r1.parents) {
      if (!parent.isCgcEnabled) continue;
      const cg = parent.cg;
      if (parent.isTrueEq() || (parent !== cg && this.isCongruent(parent, cg))) continue;
      let generation = 100000;
      if (parent.isEq) generation = 0;
      else if (parent === cg) {
        const cached = erasedGenerations.get(parent);
        if (cached === undefined) continue;
        generation = cached;
      }
      const congruent = this.cgTable.insert(parent);
      parent.cg = congruent;
      if (congruent === parent) parent.generation = generation;
    }
    if (r2.thVar >= 0 && this.theory.getEnode(r2.thVar).root !== r2) r2.thVar = -1;
    n1.transTarget = null;
    this.invertTrans(r1);
  }

  private propagateBoolEnodeAssignment(r1: Enode, r2: Enode, n1: Enode, n2: Enode) {
    if (r2 === this.falseEnode || r2 === this.trueEnode) {
      const isFalse = r2 === this.falseEnode;
      let current = r1;
      do {
        const literal = mkLiteral(this.getBoolVar(current.owner), isFalse);
        if (this.assignment[literal] !== L_TRUE)
          this.assign(literal, new EqRootPropagationJustification(current));
        current = current.next;
      } while (current !== r1);
      return;
    }
    const first = this.assignment[mkLiteral(this.getBoolVar(n1.owner))];
    const second = this.assignment[mkLiteral(this.getBoolVar(n2.owner))];
    if (first === second) return;
    if (second === L_UNDEF) this.propagateBoolEnodeAssignmentCore(n1, n2);
    else this.propagateBoolEnodeAssignmentCore(n2, n1);
  }

  private propagateBoolEnodeAssignmentCore(source: Enode, start: Enode) {
    const value = this.assignment[mkLiteral(this.getBoolVar(source.owner))];
    let target = start;
    do {
      const boolVar = this.getBoolVar(target.owner);
      if (this.assignment[mkLiteral(boolVar)] !== value)
        this.assign(mkLiteral(boolVar, value === L_FALSE), this.mkMpIff(source, target));
      target = target.next;
    } while (target !== start);
  }

  private addDiseq(n1: Enode, n2: Enode) {
    const r1 = n1.root;
    const r2 = n2.root;
    if (r1 === r2) return r1.thVar >= 0;
    const v1 = this.getClosestVar(n1);
    const v2 = this.getClosestVar(n2);
    if (v1 >= 0 && v2 >= 0) this.pushNewThDiseq(v1, v2);
    return true;
  }

  // Theory combination: assume that two shared terms are equal.
  assumeEq(lhs: Enode, rhs: Enode) {
    if (lhs.root === rhs.root) return false;
    const eq = this.mkEqAtom(lhs.owner, rhs.owner);
    let isNew = false;
    if (!this.isBInternalized(eq)) {
      this.internalizeFormulaCore(eq, true);
      const boolVar = this.getBoolVar(eq);
      this.isEqFlags[boolVar] = true;
      this.setTrueFirstFlag(boolVar);
      this.theory.internalizeEqEh(eq);
      isNew = true;
    }
    const boolVar = this.getBoolVar(eq);
    if (!this.isTrueFirstFlags[boolVar]) {
      this.setTrueFirstFlag(boolVar);
      isNew = true;
    }
    if (this.assignment[mkLiteral(boolVar)] === L_UNDEF) isNew = true;
    if (!this.isRelevant(eq)) {
      this.markAsRelevant(eq);
      isNew = true;
    }
    return isNew;
  }

  // Search.

  incBvarActivity(boolVar: BoolVar) {
    this.activity[boolVar] += this.bvarInc;
    if (this.activity[boolVar] > ACTIVITY_LIMIT) {
      for (let index = 0; index < this.numBoolVars; index++)
        this.activity[index] *= INV_ACTIVITY_LIMIT;
      this.bvarInc *= INV_ACTIVITY_LIMIT;
    }
    this.caseSplitQueue.activityIncreased(boolVar);
  }

  private pushScope() {
    this.scopeLevel++;
    this.scopeAssignedLimits.push(this.assignedLiterals.length);
    this.scopeAuxClauseLimits.push(this.auxClauses.length);
    this.scopeTrailLimits.push(this.trailKinds.length);
    this.relevancy.push();
    this.qmanager.push();
    this.theory.pushScopeEh();
  }

  private cacheGenerationOfExpr(expr: number, newLevel: number, visited: Set<number>) {
    const manager = this.manager;
    const todo = [expr];
    while (todo.length > 0) {
      const current = todo.pop() ?? -1;
      if (visited.has(current)) continue;
      visited.add(current);
      if (manager.kinds[current] === KIND_APP) {
        const node = this.exprToEnode[current];
        if (node !== undefined) {
          if (node.iscopeLevel <= newLevel) continue;
          this.cachedGeneration.set(current, this.getGeneration(node));
        }
        for (const arg of manager.args[current])
          if (manager.kinds[arg] !== KIND_VAR) todo.push(arg);
      } else if (manager.kinds[current] === KIND_QUANTIFIER && this.isBInternalized(current)) {
        this.cachedGeneration.set(current, this.qmanager.getGeneration(current));
        todo.push(manager.getQuantifier(current).body);
      }
    }
  }

  private cacheGenerationOfLiterals(literals: Literal[], newLevel: number, visited: Set<number>) {
    for (const literal of literals) {
      const boolVar = getVar(literal);
      if (this.internLevels[boolVar] > newLevel)
        this.cacheGenerationOfExpr(this.boolVar2Expr[boolVar], newLevel, visited);
    }
  }

  private cacheGeneration(newLevel: number, visited: Set<number>) {
    const limit = Math.min(this.scopeLevel, this.clausesToReinit.length - 1);
    for (let level = newLevel; level <= limit; level++)
      for (const clause of this.clausesToReinit[level])
        this.cacheGenerationOfLiterals(clause.literals, newLevel, visited);
  }

  private unassignVars(oldLimit: number) {
    for (let index = this.assignedLiterals.length - 1; index >= oldLimit; index--) {
      const literal = this.assignedLiterals[index];
      this.assignment[literal] = L_UNDEF;
      this.assignment[negate(literal)] = L_UNDEF;
      this.justifications[getVar(literal)] = null;
      this.caseSplitQueue.unassignVar(getVar(literal));
    }
    this.assignedLiterals.length = oldLimit;
    this.qhead = oldLimit;
  }

  private popScopeCore(numScopes: number, visited: Set<number>) {
    const newLevel = this.scopeLevel - numScopes;
    this.cacheGeneration(newLevel, visited);
    this.qmanager.pop(numScopes);
    if (newLevel < this.baseLevel) {
      this.deleteClauses(this.lemmas, this.baseScopeLemmaLimits[newLevel]);
      this.baseScopeLemmaLimits.length = newLevel;
    }
    this.conflict = undefined;
    this.notLiteral = null;
    this.deleteClauses(this.auxClauses, this.scopeAuxClauseLimits[newLevel]);
    this.relevancy.pop(numScopes);
    this.unassignVars(this.scopeAssignedLimits[newLevel]);
    this.popTrail(this.scopeTrailLimits[newLevel]);
    this.theory.popScopeEh(numScopes);
    this.eqPropagationQueue = [];
    this.thEqQueue = [];
    this.thDiseqQueue = [];
    this.atomPropagationQueue = [];
    this.scopeAssignedLimits.length = newLevel;
    this.scopeAuxClauseLimits.length = newLevel;
    this.scopeTrailLimits.length = newLevel;
    this.scopeLevel = newLevel;
    if (newLevel < this.baseLevel) {
      this.baseLevel = newLevel;
      this.searchLevel = newLevel;
    }
    const numBoolVars = this.numBoolVars;
    this.reinitClauses(numScopes, numBoolVars);
    return numBoolVars;
  }

  private popScope(numScopes: number) {
    this.popScopeCore(numScopes, new Set());
    this.cachedGeneration.clear();
  }

  private reinitClauses(numScopes: number, numBoolVars: number) {
    if (this.clausesToReinit.length === 0) return;
    const limit = Math.min(this.scopeLevel + numScopes, this.clausesToReinit.length - 1);
    for (let level = this.scopeLevel + 1; level <= limit; level++) {
      const clauses = this.clausesToReinit[level];
      for (const clause of clauses) {
        if (clause.isDeleted) {
          clause.isReinit = false;
          clause.isReinternalizeAtoms = false;
          continue;
        }
        let isKept = false;
        const atoms = clause.atoms;
        const atomSigns = clause.atomSigns;
        if (clause.isReinternalizeAtoms && atoms !== null && atomSigns !== null) {
          for (let index = 0; index < 2; index++)
            if (getVar(clause.literals[index]) < numBoolVars)
              this.removeWatchLiteral(clause, index);
          for (let index = 0; index < clause.literals.length; index++) {
            const atom = atoms[index];
            this.internalize(atom, !this.manager.isNot(atom));
            clause.literals[index] = mkLiteral(this.getBoolVar(atom), atomSigns[index]);
          }
          this.swapLiterals(clause, 0, this.selectWatchLiteral(clause, 0));
          this.swapLiterals(clause, 1, this.selectWatchLiteral(clause, 1));
          this.addWatchLiteral(clause, 0);
          this.addWatchLiteral(clause, 1);
          if (this.assignment[clause.literals[0]] === L_FALSE) this.setConflict(clause, null);
          else if (this.assignment[clause.literals[1]] === L_FALSE)
            this.assign(clause.literals[0], clause);
          isKept = true;
        }
        if (isKept && this.scopeLevel > this.baseLevel) {
          while (this.clausesToReinit.length <= this.scopeLevel) this.clausesToReinit.push([]);
          this.clausesToReinit[this.scopeLevel].push(clause);
        } else {
          if (clause.isReinternalizeAtoms) this.releaseAtoms(clause);
          clause.isReinit = false;
          clause.isReinternalizeAtoms = false;
        }
      }
      this.clausesToReinit[level] = [];
    }
  }

  // guess with PS_CACHING_CONSERVATIVE: the cached phase while phase caching is on, else false.
  private guess(boolVar: BoolVar) {
    if (this.manager.kinds[this.boolVar2Expr[boolVar]] === KIND_QUANTIFIER) return false;
    if (this.isTrueFirstFlags[boolVar]) return true;
    return this.isPhaseCacheOn && this.phaseAvailable[boolVar] && this.phases[boolVar];
  }

  private updatePhaseCacheCounter() {
    this.phaseCounter++;
    if (this.phaseCounter < (this.isPhaseCacheOn ? PHASE_CACHING_ON : PHASE_CACHING_OFF)) return;
    this.phaseCounter = 0;
    this.isPhaseCacheOn = !this.isPhaseCacheOn;
  }

  private decide() {
    const boolVar = this.caseSplitQueue.nextCaseSplit();
    if (boolVar === undefined) return false;
    const isPositive = this.guess(boolVar);
    this.pushScope();
    this.assign(mkLiteral(boolVar, !isPositive), "axiom", true);
    return true;
  }

  private resolveConflict() {
    this.numConflicts++;
    this.numConflictsSinceRestart++;
    this.numConflictsSinceLemmaGc++;
    this.atomPropagationQueue = [];
    this.eqPropagationQueue = [];
    this.thEqQueue = [];
    this.thDiseqQueue = [];
    const head = this.scopeLevel === 0 ? 0 : this.scopeAssignedLimits[this.scopeLevel - 1];
    for (let index = head; index < this.assignedLiterals.length; index++)
      this.phaseAvailable[getVar(this.assignedLiterals[index])] = false;
    const resolution = this.conflictResolution;
    if (this.conflict === undefined || !resolution.resolve(this.conflict, this.notLiteral))
      return false;
    const newLevel = resolution.newScopeLevel;
    const literals = resolution.lemma;
    const atoms = resolution.lemmaAtoms.items;
    const visited = new Set<number>();
    if (resolution.lemmaIscopeLevel > newLevel)
      this.cacheGenerationOfLiterals(literals, newLevel, visited);
    const wasRelevant = literals.map((literal) =>
      this.isRelevant(this.boolVar2Expr[getVar(literal)]),
    );
    const numBoolVars = this.popScopeCore(this.scopeLevel - newLevel, visited);
    if (resolution.lemmaIscopeLevel > this.scopeLevel)
      for (let index = 0; index < literals.length; index++) {
        const literal = literals[index];
        if (getVar(literal) < numBoolVars) continue;
        this.internalize(atoms[index], true);
        literals[index] = isNegated(literal)
          ? negate(this.getLiteral(atoms[index]))
          : this.getLiteral(atoms[index]);
      }
    // restore_relevancy: marking propagates, so it only marks the literals that lost relevancy.
    for (let index = 0; index < literals.length; index++)
      if (wasRelevant[index] && !this.isRelevant(this.boolVar2Expr[getVar(literals[index])]))
        this.markLiteralAsRelevant(literals[index]);
    this.cachedGeneration.clear();
    this.mkClause([...literals], null, CLS_LEARNED);
    resolution.lemmaAtoms.reset();
    this.bvarInc *= INV_DECAY;
    this.updatePhaseCacheCounter();
    return true;
  }

  private finalCheck() {
    const qmanager = this.qmanager;
    const status = qmanager.finalCheckEh(false);
    if (status !== FC_DONE) return status;
    const oldIndex = this.finalCheckIndex;
    let result = FC_DONE;
    let failure = FAILURE_OK;
    let level = 1;
    let maxLevel = 1;
    for (;;) {
      const isTheory = this.finalCheckIndex === 0;
      // Z3 registers every theory for UFNIA, and only arithmetic acts on tlapm's obligations. Of
      // the theories between arithmetic and the quantifiers, theory_finite_set makes a set.range
      // declaration, and its assume_eqs draws a random value.
      if (!isTheory) {
        this.manager.initFiniteSetPlugin();
        this.getRandomValue();
      }
      const check = isTheory ? this.theory.finalCheckEh(level) : qmanager.finalCheckEh(true);
      if (isTheory) maxLevel = Math.max(maxLevel, NUM_ARITH_FINAL_CHECK_LEVELS);
      // Z3 reads the cancel flag after each theory's final check, and a canceled check gives up.
      const isCanceled = isTheory && this.checkCanceled();
      if (isCanceled) failure = FAILURE_CANCELED;
      else if (isTheory && check === FC_GIVEUP) failure = FAILURE_THEORY;
      this.finalCheckIndex = (this.finalCheckIndex + 1) % 2;
      if (check === FC_CONTINUE) return FC_CONTINUE;
      if (check === FC_GIVEUP || isCanceled) result = FC_GIVEUP;
      if (this.finalCheckIndex !== oldIndex) continue;
      if (level >= maxLevel || result === FC_DONE || this.canPropagate()) break;
      // A higher level reruns every check with the give-up state of the lower one cleared.
      level++;
      result = FC_DONE;
      failure = FAILURE_OK;
    }
    if (this.canPropagate()) return FC_CONTINUE;
    if (result === FC_GIVEUP && failure !== FAILURE_OK) this.lastSearchFailure = failure;
    return result;
  }

  private boundedSearch() {
    for (;;) {
      while (!this.propagate()) {
        if (!this.resolveConflict()) return L_FALSE;
        if (!this.isInconsistent()) {
          if (this.isResourceLimitExceeded() || this.checkCanceled()) return L_UNDEF;
          if (
            this.numConflictsSinceRestart > this.restartThreshold &&
            this.scopeLevel - this.baseLevel > 2
          )
            return L_UNDEF;
        }
        if (this.numConflictsSinceLemmaGc > LEMMA_GC_INITIAL) this.delInactiveLemmas();
      }
      if (this.isResourceLimitExceeded() && !this.isInconsistent()) return L_UNDEF;
      if (this.checkCanceled()) return L_UNDEF;
      if (!this.decide()) {
        if (this.isInconsistent()) return L_FALSE;
        const status = this.finalCheck();
        if (status === FC_DONE) return L_TRUE;
        if (status === FC_GIVEUP) return L_UNDEF;
      }
      if (this.isResourceLimitExceeded() && !this.isInconsistent()) return L_UNDEF;
    }
  }

  // resource_limits_exceeded: while searching, a failure stops the search, and the cancel flag is
  // read twice.
  private isResourceLimitExceeded() {
    if (this.isSearching && (this.lastSearchFailure !== FAILURE_OK || this.checkCanceled()))
      return true;
    return this.checkCanceled();
  }

  // reset_model: the model generator still holds the proto model.
  private resetModel() {
    this.model?.decRef();
    this.model = null;
    this.protoModel?.decRef();
    this.protoModel = null;
  }

  // mk_proto_model: the model of the current assignment, which the quantifier manager adjusts. The
  // model generator releases the last model first.
  mkProtoModel() {
    this.generatedModel?.model.decRef();
    const generated = mkModel(this);
    generated.model.incRef();
    this.generatedModel = generated;
    this.qmanager.adjustModel(generated.model);
    generated.model.completePartialFuncs(false);
    generated.model.cleanup();
    generated.model.incRef();
    this.protoModel = generated.model;
    return generated;
  }

  // get_model: the model that the proto model makes, which the caller holds too.
  getModel() {
    if (this.model !== null) return this.model;
    const model = (this.protoModel ?? this.mkProtoModel().model).mkModel();
    model.incRef();
    this.model = model;
    return model;
  }

  // validate_model: every relevant ground literal of the assignment holds in the model.
  validateModel(model: ProtoModel) {
    const manager = this.manager;
    for (const literal of this.assignedLiterals) {
      const atom = this.boolVar2Expr[getVar(literal)];
      if (!this.isRelevant(atom)) continue;
      // n and res of Z3's loop hold the literal and its value.
      const expr = isNegated(literal) ? manager.mkNot(atom) : atom;
      manager.incRef(expr);
      const value = manager.isGround(expr) ? model.eval(expr, false) : -1;
      if (value !== -1) manager.decRef(value);
      manager.decRef(expr);
      if (value === manager.falseExpr) return false;
    }
    return true;
  }

  // restart: decides whether the search goes on after a bounded search. A candidate model of a
  // problem with quantifiers goes to model-based quantifier instantiation, which may add instances
  // and force a restart.
  private restart(status: number, currentLevel: number): number | undefined {
    const qmanager = this.qmanager;
    this.resetModel();
    let isForcedRestart = false;
    if (this.lastSearchFailure !== FAILURE_OK) {
      if (
        this.lastSearchFailure !== FAILURE_THEORY ||
        status === L_FALSE ||
        this.isInconsistent() ||
        !qmanager.hasQuantifiers() ||
        !qmanager.isModelBased()
      )
        return status;
      const generated = this.mkProtoModel();
      if (qmanager.checkModel(generated.model, generated.root2value) !== CHECK_MODEL_RESTART)
        return status;
      this.lastSearchFailure = FAILURE_OK;
      status = L_UNDEF;
      isForcedRestart = true;
    }
    if (status === L_FALSE) return L_FALSE;
    if (status === L_TRUE && !qmanager.hasQuantifiers()) return L_TRUE;
    if (status === L_TRUE) {
      const generated = this.mkProtoModel();
      const result = qmanager.isModelBased()
        ? qmanager.checkModel(generated.model, generated.root2value)
        : CHECK_MODEL_UNKNOWN;
      if (result === CHECK_MODEL_SAT) return L_TRUE;
      if (result === CHECK_MODEL_UNKNOWN) {
        this.lastSearchFailure = FAILURE_QUANTIFIERS;
        return L_UNDEF;
      }
    }
    // inc_limits with RS_IN_OUT_GEOMETRIC.
    if (this.numConflictsSinceRestart >= this.restartThreshold) {
      this.restartThreshold = Math.trunc(this.restartThreshold * RESTART_FACTOR);
      if (this.restartThreshold > this.restartOuterThreshold) {
        this.restartThreshold = RESTART_INITIAL;
        this.restartOuterThreshold = Math.trunc(this.restartOuterThreshold * RESTART_FACTOR);
      }
    }
    this.numConflictsSinceRestart = 0;
    if (isForcedRestart || status === L_TRUE || this.agility < RESTART_AGILITY_THRESHOLD) {
      if (this.scopeLevel > currentLevel) this.popScope(this.scopeLevel - currentLevel);
      if (!this.isInconsistent()) this.theory.restartEh();
      if (!this.isInconsistent()) qmanager.restartEh();
      if (this.isInconsistent()) {
        this.resolveConflict();
        return L_FALSE;
      }
    }
    return undefined;
  }

  // can_delete: a lemma that justifies neither of its watched literals.
  private isDeletable(clause: Clause) {
    if (clause.isReinit) return false;
    return (
      this.justifications[getVar(clause.literals[0])] !== clause &&
      this.justifications[getVar(clause.literals[1])] !== clause
    );
  }

  private hasMoreThanKUnassignedLiterals(clause: Clause, limit: number) {
    let remaining = limit;
    for (const literal of clause.literals)
      if (this.assignment[literal] === L_UNDEF && --remaining === 0) return true;
    return false;
  }

  // del_inactive_lemmas2: deletes the lemmas of the current user scope with low activity and many
  // unassigned literals. The newest sixteenth of them tolerates more unassigned literals.
  private delInactiveLemmas() {
    const lemmas = this.lemmas;
    const startAt = this.baseLevel === 0 ? 0 : this.baseScopeLemmaLimits[this.baseLevel - 1];
    const realSize = lemmas.length - startAt;
    const newFirstIndex = startAt + Math.trunc(realSize / NEW_OLD_RATIO) * (NEW_OLD_RATIO - 1);
    let kept = startAt;
    for (let index = startAt; index < lemmas.length; index++) {
      const clause = lemmas[index];
      if (
        this.isDeletable(clause) &&
        (clause.isDeleted ||
          (clause.activity < OLD_CLAUSE_ACTIVITY &&
            this.hasMoreThanKUnassignedLiterals(
              clause,
              index >= newFirstIndex ? NEW_CLAUSE_RELEVANCY : OLD_CLAUSE_RELEVANCY,
            )))
      ) {
        this.deleteClause(clause);
        continue;
      }
      lemmas[kept++] = clause;
    }
    lemmas.length = kept;
    this.numConflictsSinceLemmaGc = 0;
  }

  // push: a user scope, which pop removes with everything asserted in it.
  push() {
    this.popToBaseLevel();
    this.pushScope();
    this.baseScopeLemmaLimits.push(this.lemmas.length);
    this.baseLevel++;
    this.searchLevel++;
  }

  pop(numScopes: number) {
    this.popToBaseLevel();
    this.popScope(numScopes);
  }

  // pop_to_base_lvl: undoes the decisions of the last search, before new assertions.
  popToBaseLevel() {
    if (this.scopeLevel > this.baseLevel) this.popScope(this.scopeLevel - this.baseLevel);
  }

  // internalize_assertions: the formulas of the asserted formulas, after preprocessing. When they
  // are inconsistent, none is internalized and the context has an axiom conflict.
  internalizeAssertions(asserted: AssertedFormulas) {
    const formulas = asserted.reduce();
    if (asserted.isInconsistent) {
      this.setConflict("axiom", null);
      return;
    }
    for (const formula of formulas) {
      if (this.isInconsistent()) break;
      this.internalizeAssertion(formula, 0);
    }
  }

  // init_assumptions: the search runs above a scope where the assumptions hold.
  initAssumptions(assumptions: number[]) {
    if (assumptions.length > 0) {
      this.propagate();
      if (this.isInconsistent()) return;
      this.delInactiveLemmas();
      this.pushScope();
      for (const assumption of assumptions) {
        if (this.isInconsistent()) break;
        this.internalizeAssertion(assumption, 0);
      }
    }
    this.searchLevel = this.scopeLevel;
  }

  search() {
    if (this.isInconsistent()) return L_FALSE;
    this.resetModel();
    this.theory.initSearchEh();
    this.qmanager.initSearchEh();
    this.numConflicts = 0;
    this.numConflictsSinceRestart = 0;
    this.numConflictsSinceLemmaGc = 0;
    this.restartThreshold = RESTART_INITIAL;
    this.restartOuterThreshold = RESTART_INITIAL;
    this.agility = 0;
    this.finalCheckIndex = 0;
    this.lastSearchFailure = FAILURE_OK;
    this.isSearching = true;
    const currentLevel = this.scopeLevel;
    let result: number | undefined;
    while (result === undefined) {
      const status = this.boundedSearch();
      result =
        status !== L_FALSE && this.checkCanceled() ? L_UNDEF : this.restart(status, currentLevel);
    }
    this.isSearching = false;
    return result;
  }

  getNumConflicts() {
    return this.numConflicts;
  }
}
