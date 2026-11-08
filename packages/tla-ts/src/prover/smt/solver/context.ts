// Ported from Z3 (src/smt/smt_context.cpp), MIT license, see z3-license.txt.
import type { AssertedFormulas } from "./asserted-formulas";
import { AstManager, FAMILY_BASIC, KIND_APP, KIND_QUANTIFIER, KIND_VAR, OP_ITE } from "./ast";
import { getCongruenceJustification, isCongruent } from "./cg-table";
import { BJustification, type Clause, CLS_LEARNED, CLS_TH_LEMMA, HEADER_SIZE } from "./clause";
import { ConflictResolution } from "./conflict-resolution";
import { DynAckManager } from "./dyn-ack";
import { FingerprintSet } from "./fingerprints";
import {
  Enode,
  EqConflictJustification,
  EqJustification,
  EqPropagationJustification,
  EqRootPropagationJustification,
  MpIffJustification,
} from "./enode";
import {
  BV_ENODE,
  BV_EQ,
  BV_PHASE,
  BV_PHASE_AVAILABLE,
  BV_QUANTIFIER,
  BV_THEORY,
  BV_TRUE_FIRST,
  Internalizer,
  UNDO_ADD_EQ,
  UNDO_TH_VAR,
} from "./internalizer";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { BoolVar, getVar, isNegated, Literal, mkLiteral, negate } from "./literal";
import { mkModel } from "./model-generator";
import type { GeneratedModel } from "./model-generator";
import type { ProtoModel } from "./proto-model";
import { DefaultQuantifierManager } from "./quantifier-manager";
import { FC_CONTINUE, FC_DONE, FC_GIVEUP, Theory } from "./theory";
import { TheoryArray } from "./theory-array";
import { TheoryBv } from "./theory-bv";
import { TheoryFiniteSet } from "./theory-finite-set";
import { TheoryLra } from "./theory-lra";
import { shrink } from "./array";

const ACTIVITY_LIMIT = 1e100;
const INV_ACTIVITY_LIMIT = 1e-100;
const INV_DECAY = 1.052;
const RESTART_INITIAL = 100;
const RESTART_FACTOR = 1.1;
const PHASE_CACHING_ON = 400;
const PHASE_CACHING_OFF = 100;
const AGILITY_FACTOR = 0.9999;
const LEMMA_GC_INITIAL = 5000;
const NEW_OLD_RATIO = 16;
const OLD_CLAUSE_ACTIVITY = 500;
const NEW_CLAUSE_RELEVANCY = 45;
const OLD_CLAUSE_RELEVANCY = 6;
const RESTART_AGILITY_THRESHOLD = 0.18;

export const CHECK_MODEL_SAT = 0;
export const CHECK_MODEL_UNKNOWN = 1;
export const CHECK_MODEL_RESTART = 2;

const FAILURE_OK = 0;
const FAILURE_THEORY = 1;
const FAILURE_QUANTIFIERS = 2;
const FAILURE_CANCELED = 3;

type SearchFailure =
  | typeof FAILURE_OK
  | typeof FAILURE_THEORY
  | typeof FAILURE_QUANTIFIERS
  | typeof FAILURE_CANCELED;

type ModelState =
  | { kind: "none" }
  | { kind: "generated"; generated: GeneratedModel }
  | { kind: "proto"; generated: GeneratedModel }
  | { kind: "final"; generated: GeneratedModel; model: ProtoModel };

interface SmtParams {
  isMbqi: boolean;
  relevancyLevel: 0 | 2;
}

export class Context extends Internalizer {
  // setupContext makes the theories after the first assertions, so arith starts unassigned.
  arith!: TheoryLra;
  readonly theories: Theory[] = [];
  private theoryByFamily: (Theory | undefined)[] = [];
  readonly qmanager: DefaultQuantifierManager;
  readonly fingerprints = new FingerprintSet(this.manager);
  readonly conflictResolution: ConflictResolution = new ConflictResolution(this);
  private readonly dynAck = new DynAckManager(this);
  private qhead = 0;
  private scopeAssignedLimits: number[] = [];
  private scopeAuxClauseLimits: number[] = [];
  private scopeTrailLimits: number[] = [];
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
  private lastSearchFailure: SearchFailure = FAILURE_OK;
  private modelState: ModelState = { kind: "none" };

  constructor(manager: AstManager, params: SmtParams) {
    super(manager, params.relevancyLevel > 0, params.relevancyLevel > 0);
    this.qmanager = new DefaultQuantifierManager(this, params.isMbqi);
  }

  setupContext() {
    this.arith = new TheoryLra(this);
    this.registerPlugin(this.arith);
    this.registerPlugin(new TheoryArray(this));
    this.registerPlugin(new TheoryBv(this));
    this.registerPlugin(new TheoryFiniteSet(this));
  }

  private registerPlugin(theory: Theory) {
    this.theories.push(theory);
    this.theoryByFamily[theory.id] = theory;
    theory.init();
  }

  getTheory(family: number) {
    return family < 0 ? undefined : this.theoryByFamily[family];
  }

  checkCanceled() {
    return !this.manager.limit.inc();
  }

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
    this.setLevel(boolVar, this.scopeLevel);
    const isNegative = isNegated(literal);
    if (this.hasBoolVarFlag(boolVar, BV_PHASE_AVAILABLE)) {
      this.agility *= AGILITY_FACTOR;
      if (!isDecision && this.hasBoolVarFlag(boolVar, BV_PHASE) === isNegative)
        this.agility += 1 - AGILITY_FACTOR;
    }
    this.setBoolVarFlag(boolVar, BV_PHASE_AVAILABLE, true);
    this.setBoolVarFlag(boolVar, BV_PHASE, !isNegative);
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
      // Nothing below makes a clause, so the clause data stays in place.
      const data = this.clauses.data;
      let kept = 0;
      let index = 0;
      for (; index < list.length; index++) {
        const clause: Clause = list[index];
        const first = clause + HEADER_SIZE;
        if (data[first] === notLiteral) {
          data[first] = data[first + 1];
          data[first + 1] = notLiteral;
        }
        const firstLiteral = data[first] as Literal;
        const firstValue = this.assignment[firstLiteral];
        if (firstValue === L_TRUE) {
          list[kept++] = clause;
          continue;
        }
        let isFound = false;
        const end = first + data[clause];
        for (let position = first + 2; position < end; position++) {
          const candidate = data[position] as Literal;
          if (this.assignment[candidate] !== L_FALSE) {
            this.addWatch(negate(candidate), clause);
            data[first + 1] = candidate;
            data[position] = notLiteral;
            isFound = true;
            break;
          }
        }
        if (isFound) continue;
        list[kept++] = clause;
        if (firstValue === L_FALSE) {
          for (index++; index < list.length; index++) list[kept++] = list[index];
          shrink(list, kept);
          this.setConflict(clause, null);
          return false;
        }
        this.assignCore(firstLiteral, clause, false);
      }
      shrink(list, kept);
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
      if (this.hasBoolVarFlag(boolVar, BV_ENODE)) this.propagateBoolVarEnode(boolVar);
      if (this.isInconsistent()) return false;
      if (this.hasBoolVarFlag(boolVar, BV_EQ)) {
        const eq = this.boolVar2Expr[boolVar];
        if (!this.manager.isBool(this.manager.getArg(eq, 0))) {
          const lhs = this.exprToEnode[this.manager.getArg(eq, 0)];
          const rhs = this.exprToEnode[this.manager.getArg(eq, 1)];
          if (lhs !== undefined && rhs !== undefined) {
            if (value === L_TRUE) this.addEq(lhs, rhs, { kind: "equation", literal: literal });
            else if (!this.addDiseq(lhs, rhs) && !this.isInconsistent())
              this.setConflict(new EqPropagationJustification(lhs, rhs), mkLiteral(boolVar, true));
          }
        }
      } else if (this.hasBoolVarFlag(boolVar, BV_THEORY))
        this.getTheory(this.getBoolVarTheory(boolVar))?.assignEh(boolVar, value === L_TRUE);
      else if (this.hasBoolVarFlag(boolVar, BV_QUANTIFIER) && value === L_TRUE)
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
    const propagated = this.getTheory(this.manager.getFamily(expr));
    propagated?.relevantEh(expr);
    if (node === undefined || node.thVar < 0) return;
    if (this.theoryByFamily[node.thId] !== propagated)
      this.theoryByFamily[node.thId]?.relevantEh(expr);
    for (let cell = node.thNext; cell !== null; cell = cell.next)
      if (this.theoryByFamily[cell.thId] !== propagated)
        this.theoryByFamily[cell.thId]?.relevantEh(expr);
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
    for (let index = 0; index < queue.length && !this.isInconsistent(); index += 3)
      this.theoryByFamily[queue[index]]?.newEqEh(queue[index + 1], queue[index + 2]);
    this.thEqQueue = [];
  }

  private propagateThDiseqs() {
    const queue = this.thDiseqQueue;
    for (let index = 0; index < queue.length && !this.isInconsistent(); index += 3)
      this.theoryByFamily[queue[index]]?.newDiseqEh(queue[index + 1], queue[index + 2]);
    this.thDiseqQueue = [];
  }

  private canTheoriesPropagate() {
    for (const theory of this.theories) if (theory.canPropagate()) return true;
    return false;
  }

  private propagateTheories() {
    for (const theory of this.theories) {
      theory.propagate();
      if (this.isInconsistent()) return false;
    }
    return true;
  }

  canPropagate() {
    return (
      this.qhead !== this.assignedLiterals.length ||
      this.relevancy.canPropagate() ||
      this.atomPropagationQueue.length > 0 ||
      this.qmanager.canPropagate() ||
      this.canTheoriesPropagate() ||
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
      if (!this.propagateTheories()) return false;
      if (!this.checkCanceled()) this.qmanager.propagate();
      if (this.isInconsistent()) return false;
      if (this.isResourceLimitExceeded()) {
        this.qhead = qhead;
        return true;
      }
      if (!this.canPropagate()) return true;
    }
  }

  private getClosestVar(start: Enode, thId: number) {
    if (thId < 0) return -1;
    for (let node: Enode | null = start; node !== null; node = node.transTarget) {
      const thVar = node.getThVar(thId);
      if (thVar >= 0) return thVar;
    }
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

  private pushNewThEq(thId: number, first: number, second: number) {
    this.thEqQueue.push(thId, first, second);
  }

  private pushNewThDiseq(thId: number, first: number, second: number) {
    const theory = this.theoryByFamily[thId];
    if (theory === undefined) return;
    if (theory.getEnode(first).isInterpreted && theory.getEnode(second).isInterpreted) return;
    this.thDiseqQueue.push(thId, first, second);
  }

  private pushNewThDiseqs(root: Enode, thVar: number, thId: number) {
    if (!this.theoryByFamily[thId]?.useDiseqs()) return;
    for (const parent of root.parents) {
      if (!parent.isEq) continue;
      if (this.assignment[mkLiteral(this.getBoolVar(parent.owner))] !== L_FALSE) continue;
      let lhs = parent.getArg(0);
      let rhs = parent.getArg(1);
      if (rhs.root === root.root) {
        const saved = lhs;
        lhs = rhs;
        rhs = saved;
      }
      const rhsVar = this.getClosestVar(rhs, thId);
      const lhsVar = this.getClosestVar(lhs, thId);
      const finalVar = lhsVar >= 0 ? lhsVar : thVar;
      if (rhsVar >= 0 && finalVar !== rhsVar) this.pushNewThDiseq(thId, finalVar, rhsVar);
    }
  }

  private mergeTheoryVars(n2: Enode, n1: Enode, justification: EqJustification) {
    const r2 = n2.root;
    const r1 = n1.root;
    if (r1.thVar < 0 && r2.thVar < 0) return;
    const fromTheory =
      justification.kind === "justification" ? justification.justification.fromTheory : -1;
    if (r2.thNext === null && r1.thNext === null) {
      const t2 = r2.thId;
      const t1 = r1.thId;
      const v2 = this.getClosestVar(n2, t2);
      const v1 = this.getClosestVar(n1, t1);
      if (v2 >= 0 && v1 >= 0) {
        if (t1 === t2) {
          if (t1 !== fromTheory) this.pushNewThEq(t1, v2, v1);
          return;
        }
        r2.addThVar(v1, t1);
        this.pushNewThDiseqs(r2, v1, t1);
        this.pushNewThDiseqs(r1, v2, t2);
      } else if (v1 < 0 && v2 >= 0) this.pushNewThDiseqs(r1, v2, t2);
      else if (v1 >= 0 && v2 < 0) {
        r2.thVar = v1;
        r2.thId = t1;
        this.pushNewThDiseqs(r2, v1, t1);
      }
      return;
    }
    r2.forEachThVar((t2) => {
      const v2 = this.getClosestVar(n2, t2);
      const v1 = this.getClosestVar(n1, t2);
      if (v1 >= 0) {
        if (t2 !== fromTheory) this.pushNewThEq(t2, v2, v1);
      } else this.pushNewThDiseqs(r1, v2, t2);
    });
    r1.forEachThVar((t1) => {
      const v1 = this.getClosestVar(n1, t1);
      if (r2.getThVar(t1) >= 0) return;
      r2.addThVar(v1, t1);
      this.pushNewThDiseqs(r2, v1, t1);
    });
  }

  attachThVar(node: Enode, theory: Theory, thVar: number) {
    const thId = theory.id;
    const oldVar = node.getThVar(thId);
    // A variable that an equality moved to the node's list, which the node's own replaces.
    if (oldVar >= 0) {
      node.replaceThVar(thVar, thId);
      this.pushTrail(() => {
        node.replaceThVar(oldVar, thId);
      });
      this.pushNewThEq(thId, thVar, oldVar);
      return;
    }
    const root = node.root;
    const rootVar = root.getThVar(thId);
    node.addThVar(thVar, thId);
    this.trailInts.push(thId);
    this.trailNodes.push(node);
    this.trailKinds.push(UNDO_TH_VAR);
    if (rootVar < 0) {
      if (root !== node) root.addThVar(thVar, thId);
      this.pushNewThDiseqs(root, thVar, thId);
    } else if (root !== node) this.pushNewThEq(thId, rootVar, thVar);
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
    this.reinsertParentsIntoCgTable(r1, r2, n1, n2, justification);
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

  // A congruence that makes a false equality true is the root of a conflict, which dynamic
  // Ackermannization counts.
  private reinsertParentsIntoCgTable(
    r1: Enode,
    r2: Enode,
    n1: Enode,
    n2: Enode,
    justification: EqJustification,
  ) {
    const r1Parents = r1.parents;
    for (let index = 0; index < r1Parents.length; index++) {
      const parent = r1Parents[index];
      if (!parent.isMarked) continue;
      parent.isMarked = false;
      if (parent.isEq) {
        const lhs = parent.getArg(0);
        const rhs = parent.getArg(1);
        if (lhs.root === rhs.root) {
          const literal = mkLiteral(this.getBoolVar(parent.owner));
          const value = this.assignment[literal];
          if (value !== L_TRUE) {
            if (value === L_FALSE && justification.kind === "congruence")
              this.dynAck.cgConflictEh(n1.owner, n2.owner);
            this.assign(literal, new EqPropagationJustification(lhs, rhs));
          }
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
        const thId = this.popTrailInt();
        const thVar = node.getThVar(thId);
        node.delThVar(thId);
        if (node.root !== node && node.root.getThVar(thId) === thVar) node.root.delThVar(thId);
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
    shrink(r2.parents, r2NumParents);
    for (const parent of r1.parents) {
      if (!parent.isCgcEnabled) continue;
      const cg = parent.cg;
      if (parent.isTrueEq() || (parent !== cg && isCongruent(parent, cg))) continue;
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
    if (r2.thNext === null) {
      if (r2.thVar >= 0 && this.theoryByFamily[r2.thId]?.getEnode(r2.thVar).root !== r2) {
        r2.thVar = -1;
        r2.thId = -1;
      }
    } else r2.restoreThVars((thId, thVar) => this.theoryByFamily[thId]?.getEnode(thVar) ?? r2);
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
      const targetValue = this.assignment[mkLiteral(boolVar)];
      if (targetValue !== value) {
        if (targetValue !== L_UNDEF && isCongruent(source, target) && source.numArgs > 0)
          this.dynAck.cgConflictEh(source.owner, target.owner);
        this.assign(mkLiteral(boolVar, value === L_FALSE), this.mkMpIff(source, target));
      }
      target = target.next;
    } while (target !== start);
  }

  private addDiseq(n1: Enode, n2: Enode) {
    const r1 = n1.root;
    const r2 = n2.root;
    if (r1 === r2) return this.theoryByFamily[r1.thId]?.useDiseqs() ?? false;
    if (r1.thNext === null && r2.thNext === null) {
      const t1 = r1.thId;
      const v1 = this.getClosestVar(n1, t1);
      const v2 = this.getClosestVar(n2, t1);
      if (v1 >= 0 && v2 >= 0 && t1 === r2.thId && this.theoryByFamily[t1]?.useDiseqs())
        this.pushNewThDiseq(t1, v1, v2);
      return true;
    }
    r1.forEachThVar((t1) => {
      if (!this.theoryByFamily[t1]?.useDiseqs()) return;
      const v1 = this.getClosestVar(n1, t1);
      const v2 = this.getClosestVar(n2, t1);
      if (v2 >= 0) this.pushNewThDiseq(t1, v1, v2);
    });
    return true;
  }

  isShared(node: Enode) {
    const root = node.root;
    if (this.manager.getOp(root.owner) === OP_ITE) return true;
    if (root.thVar < 0) return false;
    if (root.thNext !== null) return true;
    if (this.qmanager.isShared(root)) return true;
    for (const parent of root.parents) {
      const family = this.manager.getFamily(parent.owner);
      if (family === root.thId || family === FAMILY_BASIC) continue;
      if (!this.getTheory(family)?.isBetaRedex(parent, root)) return true;
    }
    return this.getTheory(root.thId)?.isShared(root.thVar) ?? false;
  }

  assumeEq(lhs: Enode, rhs: Enode) {
    if (lhs.root === rhs.root) return false;
    const eq = this.mkEqAtom(lhs.owner, rhs.owner);
    let isNew = false;
    if (!this.isBInternalized(eq)) {
      this.internalizeFormulaCore(eq, true);
      const boolVar = this.getBoolVar(eq);
      this.setBoolVarFlag(boolVar, BV_EQ, true);
      this.setTrueFirstFlag(boolVar);
      this.getTheory(this.manager.getSortFamily(this.manager.sorts[lhs.owner]))?.internalizeEqEh(
        eq,
        boolVar,
      );
      isNew = true;
    }
    const boolVar = this.getBoolVar(eq);
    if (!this.hasBoolVarFlag(boolVar, BV_TRUE_FIRST)) {
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
    this.fingerprints.push();
    for (const theory of this.theories) theory.pushScopeEh();
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
        for (let index = 0; index < manager.getNumArgs(current); index++) {
          const arg = manager.getArg(current, index);
          if (manager.kinds[arg] !== KIND_VAR) todo.push(arg);
        }
      } else if (manager.kinds[current] === KIND_QUANTIFIER && this.isBInternalized(current)) {
        this.cachedGeneration.set(current, this.qmanager.getGeneration(current));
        todo.push(manager.getQuantifier(current).body);
      }
    }
  }

  private cacheGenerationOfLiterals(literals: Literal[], newLevel: number, visited: Set<number>) {
    for (const literal of literals) {
      const boolVar = getVar(literal);
      if (this.getInternLevel(boolVar) > newLevel)
        this.cacheGenerationOfExpr(this.boolVar2Expr[boolVar], newLevel, visited);
    }
  }

  private cacheGeneration(newLevel: number, visited: Set<number>) {
    const limit = Math.min(this.scopeLevel, this.clausesToReinit.length - 1);
    for (let level = newLevel; level <= limit; level++)
      for (const clause of this.clausesToReinit[level])
        this.cacheGenerationOfLiterals(this.clauses.getLiterals(clause), newLevel, visited);
  }

  private unassignVars(oldLimit: number) {
    for (let index = this.assignedLiterals.length - 1; index >= oldLimit; index--) {
      const literal = this.assignedLiterals[index];
      this.assignment[literal] = L_UNDEF;
      this.assignment[negate(literal)] = L_UNDEF;
      this.justifications[getVar(literal)] = null;
      this.caseSplitQueue.unassignVar(getVar(literal));
    }
    shrink(this.assignedLiterals, oldLimit);
    this.qhead = oldLimit;
  }

  private popScopeCore(numScopes: number, visited: Set<number>) {
    const newLevel = this.scopeLevel - numScopes;
    this.cacheGeneration(newLevel, visited);
    this.qmanager.pop(numScopes);
    this.fingerprints.pop(numScopes);
    if (newLevel < this.baseLevel) {
      this.deleteClauses(this.lemmas, this.baseScopeLemmaLimits[newLevel]);
      shrink(this.baseScopeLemmaLimits, newLevel);
    }
    this.conflict = null;
    this.deleteClauses(this.auxClauses, this.scopeAuxClauseLimits[newLevel]);
    this.relevancy.pop(numScopes);
    this.unassignVars(this.scopeAssignedLimits[newLevel]);
    this.popTrail(this.scopeTrailLimits[newLevel]);
    for (const theory of this.theories) theory.popScopeEh(numScopes);
    this.eqPropagationQueue = [];
    this.thEqQueue = [];
    this.thDiseqQueue = [];
    this.atomPropagationQueue = [];
    shrink(this.scopeAssignedLimits, newLevel);
    shrink(this.scopeAuxClauseLimits, newLevel);
    shrink(this.scopeTrailLimits, newLevel);
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
    const store = this.clauses;
    const limit = Math.min(this.scopeLevel + numScopes, this.clausesToReinit.length - 1);
    for (let level = this.scopeLevel + 1; level <= limit; level++) {
      const clauses = this.clausesToReinit[level];
      for (const clause of clauses) {
        store.checkLive(clause);
        if (store.isDeleted(clause)) {
          store.setReinit(clause, false);
          store.setReinternalizeAtoms(clause, false);
          store.free(clause);
          continue;
        }
        let isKept = false;
        const atoms = store.getAtoms(clause);
        if (store.isReinternalizeAtoms(clause) && atoms.length > 0) {
          for (let index = 0; index < 2; index++)
            if (getVar(store.getLiteral(clause, index)) < numBoolVars)
              this.removeWatchLiteral(clause, index);
          const isThLemma = store.getKind(clause) === CLS_TH_LEMMA;
          for (let index = 0; index < atoms.length; index++) {
            const atom = atoms[index];
            this.internalize(atom, !this.manager.isNot(atom));
            const literal = mkLiteral(this.getBoolVar(atom), store.getAtomSign(clause, index));
            store.setLiteral(clause, index, literal);
            if (isThLemma) this.markLiteralAsRelevant(literal);
          }
          store.swapLiterals(clause, 0, this.selectWatchLiteral(clause, 0));
          store.swapLiterals(clause, 1, this.selectWatchLiteral(clause, 1));
          this.addWatchLiteral(clause, 0);
          this.addWatchLiteral(clause, 1);
          const first = store.getLiteral(clause, 0);
          if (this.assignment[first] === L_FALSE) this.setConflict(clause, null);
          else if (this.assignment[store.getLiteral(clause, 1)] === L_FALSE)
            this.assign(first, clause);
          isKept = true;
        } else {
          const first = store.getLiteral(clause, 0);
          const second = store.getLiteral(clause, 1);
          if (store.getKind(clause) === CLS_TH_LEMMA) {
            this.markLiteralAsRelevant(first);
            this.markLiteralAsRelevant(second);
          }
          if (this.assignment[first] === L_FALSE && this.isEmptyClause(clause)) {
            this.setConflict(clause, null);
            isKept = true;
          } else if (
            this.assignment[second] === L_FALSE &&
            this.assignment[first] === L_UNDEF &&
            this.isUnitClause(clause)
          ) {
            this.assign(first, clause);
            isKept = true;
          }
        }
        if (isKept && this.scopeLevel > this.baseLevel) {
          while (this.clausesToReinit.length <= this.scopeLevel) this.clausesToReinit.push([]);
          this.clausesToReinit[this.scopeLevel].push(clause);
        } else {
          if (store.isReinternalizeAtoms(clause)) this.releaseAtoms(clause);
          store.setReinit(clause, false);
          store.setReinternalizeAtoms(clause, false);
        }
      }
      this.clausesToReinit[level] = [];
    }
  }

  private isEmptyClause(clause: Clause) {
    const store = this.clauses;
    for (let index = 0; index < store.getNumLiterals(clause); index++)
      if (this.assignment[store.getLiteral(clause, index)] !== L_FALSE) return false;
    return true;
  }

  private isUnitClause(clause: Clause) {
    const store = this.clauses;
    let isFound = false;
    for (let index = 0; index < store.getNumLiterals(clause); index++) {
      const value = this.assignment[store.getLiteral(clause, index)];
      if (value === L_TRUE) return false;
      if (value === L_UNDEF) {
        if (isFound) return false;
        isFound = true;
      }
    }
    return isFound;
  }

  private guess(boolVar: BoolVar) {
    if (this.manager.kinds[this.boolVar2Expr[boolVar]] === KIND_QUANTIFIER) return false;
    if (this.hasBoolVarFlag(boolVar, BV_TRUE_FIRST)) return true;
    return (
      this.isPhaseCacheOn &&
      this.hasBoolVarFlag(boolVar, BV_PHASE_AVAILABLE) &&
      this.hasBoolVarFlag(boolVar, BV_PHASE)
    );
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
      this.setBoolVarFlag(getVar(this.assignedLiterals[index]), BV_PHASE_AVAILABLE, false);
    const resolution = this.conflictResolution;
    if (
      this.conflict === null ||
      !resolution.resolve(this.conflict.justification, this.conflict.notLiteral)
    )
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
    let failure: SearchFailure = FAILURE_OK;
    let level = 1;
    let maxLevel = 1;
    for (;;) {
      const theory = this.theories[this.finalCheckIndex];
      const check = theory === undefined ? qmanager.finalCheckEh(true) : theory.finalCheckEh(level);
      if (theory !== undefined) maxLevel = Math.max(maxLevel, theory.numFinalCheckLevels());
      // Z3 reads the cancel flag after each theory's final check, and a canceled check gives up.
      const isCanceled = theory === this.arith && this.checkCanceled();
      if (isCanceled) failure = FAILURE_CANCELED;
      else if (theory !== undefined && check === FC_GIVEUP) failure = FAILURE_THEORY;
      this.finalCheckIndex = (this.finalCheckIndex + 1) % (this.theories.length + 1);
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
        this.dynAck.propagateEh();
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

  // While searching, a failure stops the search, and the cancel flag is read twice.
  private isResourceLimitExceeded() {
    if (this.isSearching && (this.lastSearchFailure !== FAILURE_OK || this.checkCanceled()))
      return true;
    return this.checkCanceled();
  }

  // reset_model: the model generator still holds the proto model.
  private resetModel() {
    const state = this.modelState;
    if (state.kind === "none" || state.kind === "generated") return;
    if (state.kind === "final") state.model.decRef();
    state.generated.model.decRef();
    this.modelState = { kind: "generated", generated: state.generated };
  }

  // The model generator releases the last model first.
  private mkProtoModel() {
    if (this.modelState.kind !== "none") this.modelState.generated.model.decRef();
    const generated = mkModel(this);
    generated.model.incRef();
    this.modelState = { kind: "generated", generated };
    this.qmanager.adjustModel(generated.model);
    generated.model.completePartialFuncs(false);
    generated.model.cleanup();
    generated.model.incRef();
    this.modelState = { kind: "proto", generated };
    return generated;
  }

  // add_rec_funs gives each named expression without an interpretation its expression.
  getModel() {
    if (this.modelState.kind === "final") return this.modelState.model;
    const generated =
      this.modelState.kind === "proto" ? this.modelState.generated : this.mkProtoModel();
    const model = generated.model.mkModel();
    for (const entry of this.manager.macros)
      if (!model.constInterps.has(entry[0])) model.registerConst(entry[0], entry[1]);
    model.incRef();
    this.modelState = { kind: "final", generated, model };
    return model;
  }

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
      for (const theory of this.theories) if (!this.isInconsistent()) theory.restartEh();
      if (!this.isInconsistent()) qmanager.restartEh();
      if (this.isInconsistent()) {
        this.resolveConflict();
        return L_FALSE;
      }
    }
    return undefined;
  }

  private isDeletable(clause: Clause) {
    const store = this.clauses;
    if (store.isReinit(clause)) return false;
    return (
      this.justifications[getVar(store.getLiteral(clause, 0))] !== clause &&
      this.justifications[getVar(store.getLiteral(clause, 1))] !== clause
    );
  }

  private hasMoreThanKUnassignedLiterals(clause: Clause, limit: number) {
    const store = this.clauses;
    let remaining = limit;
    for (let index = 0; index < store.getNumLiterals(clause); index++)
      if (this.assignment[store.getLiteral(clause, index)] === L_UNDEF && --remaining === 0)
        return true;
    return false;
  }

  // The newest sixteenth of the lemmas tolerates more unassigned literals.
  private delInactiveLemmas() {
    const lemmas = this.lemmas;
    const startAt = this.baseLevel === 0 ? 0 : this.baseScopeLemmaLimits[this.baseLevel - 1];
    const realSize = lemmas.length - startAt;
    const newFirstIndex = startAt + Math.trunc(realSize / NEW_OLD_RATIO) * (NEW_OLD_RATIO - 1);
    let kept = startAt;
    for (let index = startAt; index < lemmas.length; index++) {
      const clause = lemmas[index];
      this.clauses.checkLive(clause);
      if (
        this.isDeletable(clause) &&
        (this.clauses.isDeleted(clause) ||
          (this.clauses.getActivity(clause) < OLD_CLAUSE_ACTIVITY &&
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
    shrink(lemmas, kept);
    this.numConflictsSinceLemmaGc = 0;
  }

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

  popToBaseLevel() {
    if (this.scopeLevel > this.baseLevel) this.popScope(this.scopeLevel - this.baseLevel);
  }

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
    for (const theory of this.theories) theory.initSearchEh();
    this.qmanager.initSearchEh();
    this.dynAck.initSearchEh();
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
