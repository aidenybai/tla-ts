// Ported from Z3 (src/smt/smt_context.cpp, src/smt/smt_internalizer.cpp, src/smt/smt_clause.h),
// MIT license, see z3-license.txt. The SMT kernel: a CDCL search over Boolean variables combined
// with an E-graph for congruence closure, relevancy propagation, theory solvers and quantifier
// instantiation, with Z3's default parameters for UFNIA.
import {
  AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_AND,
  OP_DISTINCT,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_NOT,
  OP_OR,
  OP_XOR,
  SORT_BOOL,
} from "./ast";
import { SmtUnsupportedError } from "../errors";
import { CaseSplitQueue } from "./case-split-queue";
import { CgTable } from "./cg-table";
import { ConflictResolution } from "./conflict-resolution";
import {
  AXIOM_EQ_JUSTIFICATION,
  EQ_JUSTIFICATION,
  Enode,
  EqConflictJustification,
  EqJustification,
  EqPropagationJustification,
  EqRootPropagationJustification,
  Justification,
  MpIffJustification,
  UnitResolutionJustification,
  mkCongruenceEqJustification,
  mkLiteralEqJustification,
} from "./enode";
import { RelevancyPropagator } from "./relevancy";
import { KERNEL_ARITH_OPTIONS } from "./arith-rewriter";
import { Rewriter } from "./rewriter";

export const L_TRUE = 1;
export const L_FALSE = -1;
export const L_UNDEF = 0;

export const FC_DONE = 0;
export const FC_CONTINUE = 1;
export const FC_GIVEUP = 2;

const CLS_AUX = 0;
const CLS_LEARNED = 1;
const CLS_TH_AXIOM = 2;

const ACTIVITY_LIMIT = 1e100;
const INV_ACTIVITY_LIMIT = 1e-100;
const INV_DECAY = 1.052;
const RESTART_INITIAL = 100;
const RESTART_FACTOR = 1.1;
// phase_caching_on and phase_caching_off: the numbers of conflicts while phase caching is on and off.
const PHASE_CACHING_ON = 400;
const PHASE_CACHING_OFF = 100;
const AGILITY_FACTOR = 0.9999;
const RESTART_AGILITY_THRESHOLD = 0.18;

export type BJustification = Clause | Justification | "axiom" | null;

export class Clause {
  isDeleted = false;
  activity = 1;
  isReinit = false;
  isReinternalizeAtoms = false;

  constructor(
    public literals: number[],
    readonly kind: number,
    readonly justification: Justification | null,
    // The atoms of the literals, kept so the clause survives backtracking past their creation.
    public atoms: number[] | null,
  ) {}

  isLemma() {
    return this.kind === CLS_LEARNED;
  }
}

export interface Theory {
  internalizeAtom(expr: number, isGateContext: boolean): boolean;
  internalizeTerm(expr: number): boolean;
  internalizeEqEh(expr: number, boolVar: number): void;
  assignEh(boolVar: number, isTrue: boolean): void;
  newEqEh(first: number, second: number): void;
  newDiseqEh(first: number, second: number): void;
  relevantEh(expr: number): void;
  canPropagate(): boolean;
  propagate(): void;
  finalCheckEh(): number;
  pushScopeEh(): void;
  popScopeEh(numScopes: number): void;
  restartEh(): void;
  initSearchEh(): void;
  getEnode(thVar: number): Enode;
}

export interface QuantifierManager {
  add(quantifier: number, generation: number): void;
  del(quantifier: number): void;
  assignEh(quantifier: number): void;
  addEqEh(first: Enode, second: Enode): void;
  relevantEh(node: Enode): void;
  push(): void;
  pop(numScopes: number): void;
  canPropagate(): boolean;
  propagate(): void;
  finalCheckEh(isFull: boolean): number;
  initSearchEh(): void;
  restartEh(): void;
  hasQuantifiers(): boolean;
  getGeneration(quantifier: number): number;
}

interface NewEq {
  lhs: Enode;
  rhs: Enode;
  justification: EqJustification;
}

export class Context {
  readonly trueLiteral = 0;
  readonly falseLiteral = 1;
  readonly rewriter: Rewriter;
  readonly conflictResolution: ConflictResolution;
  readonly relevancy: RelevancyPropagator;
  readonly caseSplitQueue: CaseSplitQueue;
  readonly cgTable = new CgTable();
  theory: Theory | null = null;
  qmanager: QuantifierManager | null = null;

  // Per Boolean variable.
  boolVar2Expr: number[] = [];
  levels: number[] = [];
  internLevels: number[] = [];
  justifications: BJustification[] = [];
  marks: boolean[] = [];
  activity: number[] = [];
  private phaseAvailable: boolean[] = [];
  private phases: boolean[] = [];
  private isEqFlags: boolean[] = [];
  private isEnodeFlags: boolean[] = [];
  private isTheoryFlags: boolean[] = [];
  private isQuantifierFlags: boolean[] = [];
  private isTrueFirstFlags: boolean[] = [];
  // Per literal.
  private assignment: number[] = [];
  private watches: Clause[][] = [];
  // Per expression.
  private exprToBoolVar: number[] = [];
  private exprToEnode: (Enode | undefined)[] = [];

  assignedLiterals: number[] = [];
  private qhead = 0;
  scopeLevel = 0;
  baseLevel = 0;
  searchLevel = 0;
  private trail: (() => void)[] = [];
  private scopeAssignedLimits: number[] = [];
  private scopeAuxClauseLimits: number[] = [];
  private scopeTrailLimits: number[] = [];
  private auxClauses: Clause[] = [];
  private lemmas: Clause[] = [];
  private clausesToReinit: Clause[][] = [];
  private conflict: BJustification | undefined = undefined;
  private notLiteral = -1;
  private atomPropagationQueue: number[] = [];
  private eqPropagationQueue: NewEq[] = [];
  private thEqQueue: number[] = [];
  private thDiseqQueue: number[] = [];
  enodes: Enode[] = [];
  private decl2enodes = new Map<number, Enode[]>();
  trueEnode: Enode;
  falseEnode: Enode;
  private generation = 0;
  private cachedGeneration = new Map<number, number>();
  private randomSeed = 0;
  isSearching = false;
  private bvarInc = 1;
  private agility = 0;
  private numConflicts = 0;
  private numConflictsSinceRestart = 0;
  private restartThreshold = RESTART_INITIAL;
  private restartOuterThreshold = RESTART_INITIAL;
  private isPhaseCacheOn = true;
  private phaseCounter = 0;
  private finalCheckIndex = 0;
  private r1ParentGenerations = new Map<Enode, number>();
  private isCanceled = false;

  constructor(
    readonly manager: AstManager,
    private deadline: number,
  ) {
    this.rewriter = new Rewriter(manager, { isEliminatingAnd: false, arith: KERNEL_ARITH_OPTIONS });
    this.conflictResolution = new ConflictResolution(this);
    this.relevancy = new RelevancyPropagator({
      manager,
      findAssignment: (expr) => this.findAssignment(expr),
      findEnode: (expr) => this.exprToEnode[expr],
      relevantEh: (expr) => this.relevantEh(expr),
    });
    this.caseSplitQueue = new CaseSplitQueue({
      activity: this.activity,
      getIsSearching: () => this.isSearching,
      getRandomValue: () => this.getRandomValue(),
      getNumBoolVars: () => this.boolVar2Expr.length,
      isUnassigned: (boolVar) => this.assignment[boolVar * 2] === L_UNDEF,
    });
    this.mkBoolVar(manager.trueExpr);
    this.assignment[0] = L_TRUE;
    this.assignment[1] = L_FALSE;
    this.justifications[0] = "axiom";
    this.trueEnode = this.mkEnode(manager.trueExpr, true, true, false);
    this.exprToBoolVar[manager.falseExpr] = 0;
    this.falseEnode = this.mkEnode(manager.falseExpr, true, true, false);
  }

  // random_gen from Z3's util/util.h with the default seed 0.
  getRandomValue() {
    this.randomSeed = (Math.imul(this.randomSeed, 214013) + 2531011) >>> 0;
    return (this.randomSeed >>> 16) & 0x7fff;
  }

  checkCanceled() {
    if (!this.isCanceled && Date.now() > this.deadline) this.isCanceled = true;
    return this.isCanceled;
  }

  pushTrail(undo: () => void) {
    this.trail.push(undo);
  }

  // Assignment queries.

  getAssignment(literal: number) {
    return this.assignment[literal];
  }

  getBoolVarAssignment(boolVar: number) {
    return this.assignment[boolVar * 2];
  }

  getAssignLevel(literal: number) {
    return this.levels[literal >> 1];
  }

  isBInternalized(expr: number) {
    return (this.exprToBoolVar[expr] ?? -1) >= 0;
  }

  getBoolVar(expr: number) {
    return this.exprToBoolVar[expr] ?? -1;
  }

  getEnode(expr: number) {
    return this.exprToEnode[expr];
  }

  isEInternalized(expr: number) {
    return this.exprToEnode[expr] !== undefined;
  }

  findCongruent(decl: number, args: Enode[]) {
    return this.cgTable.findFor(decl, args, decl === OP_EQ);
  }

  // is_diseq: an equality between the two classes is false.
  isDiseq(first: Enode, second: Enode) {
    return this.cgTable.findFor(OP_EQ, [first, second], true)?.root === this.falseEnode;
  }

  enodesOf(decl: number) {
    return this.decl2enodes.get(decl) ?? [];
  }

  getLiteral(expr: number): number {
    const manager = this.manager;
    if (manager.isNot(expr)) return this.getLiteral(manager.args[expr][0]) ^ 1;
    if (expr === manager.trueExpr) return this.trueLiteral;
    if (expr === manager.falseExpr) return this.falseLiteral;
    return this.getBoolVar(expr) * 2;
  }

  private getAssignmentOfExpr(expr: number) {
    return this.assignment[this.getBoolVar(expr) * 2];
  }

  findAssignment(expr: number) {
    const manager = this.manager;
    if (manager.isNot(expr)) {
      const arg = manager.args[expr][0];
      if (this.isBInternalized(arg)) return -this.getAssignmentOfExpr(arg);
      if (arg === manager.falseExpr) return L_TRUE;
      if (arg === manager.trueExpr) return L_FALSE;
      return L_UNDEF;
    }
    if (this.isBInternalized(expr)) return this.getAssignmentOfExpr(expr);
    if (expr === manager.falseExpr) return L_FALSE;
    if (expr === manager.trueExpr) return L_TRUE;
    return L_UNDEF;
  }

  enodeToLiteral(node: Enode) {
    const boolVar = this.getBoolVar(node.owner);
    return boolVar * 2 + (this.assignment[boolVar * 2] === L_FALSE ? 1 : 0);
  }

  isRelevant(expr: number) {
    return this.relevancy.isRelevant(expr);
  }

  markAsRelevant(expr: number) {
    this.relevancy.markAsRelevant(expr);
  }

  markLiteralAsRelevant(literal: number) {
    this.relevancy.markAsRelevant(this.boolVar2Expr[literal >> 1]);
  }

  isInconsistent() {
    return this.conflict !== undefined;
  }

  getGeneration(node: Enode) {
    return node.cg.generation;
  }

  // Boolean variables and enodes.

  mkBoolVar(expr: number) {
    const boolVar = this.boolVar2Expr.length;
    this.exprToBoolVar[expr] = boolVar;
    this.boolVar2Expr.push(expr);
    this.levels.push(0);
    this.internLevels.push(this.scopeLevel);
    this.justifications.push(null);
    this.marks.push(false);
    this.activity.push(this.isSearching ? -((this.getRandomValue() % 1000) / 1000) : 0);
    this.phaseAvailable.push(false);
    this.phases.push(false);
    this.isEqFlags.push(false);
    this.isEnodeFlags.push(false);
    this.isTheoryFlags.push(false);
    this.isQuantifierFlags.push(false);
    this.isTrueFirstFlags.push(false);
    this.assignment.push(L_UNDEF, L_UNDEF);
    this.watches.push([], []);
    this.caseSplitQueue.mkVar(boolVar);
    this.trail.push(() => this.undoMkBoolVar());
    return boolVar;
  }

  private undoMkBoolVar() {
    const boolVar = this.boolVar2Expr.length - 1;
    const expr = this.boolVar2Expr[boolVar];
    this.caseSplitQueue.delVar(boolVar);
    if (this.isQuantifierFlags[boolVar]) this.qmanager?.del(expr);
    this.exprToBoolVar[expr] = -1;
    this.boolVar2Expr.pop();
    this.levels.pop();
    this.internLevels.pop();
    this.justifications.pop();
    this.marks.pop();
    this.activity.pop();
    this.phaseAvailable.pop();
    this.phases.pop();
    this.isEqFlags.pop();
    this.isEnodeFlags.pop();
    this.isTheoryFlags.pop();
    this.isQuantifierFlags.pop();
    this.isTrueFirstFlags.pop();
    this.assignment.length -= 2;
    this.watches.length -= 2;
  }

  private isAtom(boolVar: number) {
    return (
      this.isEqFlags[boolVar] ||
      this.isEnodeFlags[boolVar] ||
      this.isTheoryFlags[boolVar] ||
      this.isQuantifierFlags[boolVar]
    );
  }

  setVarTheory(boolVar: number) {
    if (this.scopeLevel > this.internLevels[boolVar])
      this.trail.push(() => {
        this.isTheoryFlags[boolVar] = false;
      });
    this.isTheoryFlags[boolVar] = true;
  }

  setTrueFirstFlag(boolVar: number) {
    this.trail.push(() => {
      this.isTrueFirstFlags[boolVar] = false;
    });
    this.isTrueFirstFlags[boolVar] = true;
  }

  isTrueFirst(boolVar: number) {
    return this.isTrueFirstFlags[boolVar];
  }

  mkEnode(expr: number, isSuppressingArgs: boolean, isMergeTf: boolean, isCgcEnabled: boolean) {
    const manager = this.manager;
    const generation = this.cachedGeneration.get(expr) ?? this.generation;
    const args: Enode[] = [];
    if (!isSuppressingArgs)
      for (const arg of manager.args[expr]) {
        const argNode = this.exprToEnode[arg];
        if (argNode === undefined)
          throw new SmtUnsupportedError("an argument was not internalized");
        args.push(argNode);
      }
    const isEq = !isSuppressingArgs && manager.getOp(expr) === OP_EQ;
    const node = new Enode(
      expr,
      manager.decls[expr],
      args,
      generation,
      isEq,
      manager.sorts[expr] === SORT_BOOL,
      isMergeTf,
      isCgcEnabled,
      this.scopeLevel,
    );
    for (const arg of args) arg.root.parents.push(node);
    if (manager.isUniqueValue(expr)) node.isInterpreted = true;
    this.exprToEnode[expr] = node;
    this.trail.push(() => this.undoMkEnode());
    this.enodes.push(node);
    if (args.length > 0) {
      if (node.isTrueEq()) {
        this.assign(this.getBoolVar(expr) * 2, new EqPropagationJustification(args[0], args[1]));
        this.pushEq(node, this.trueEnode, AXIOM_EQ_JUSTIFICATION);
      } else if (isCgcEnabled) {
        const result = this.cgTable.insert(node);
        if (result.node !== node) {
          node.cg = result.node;
          if (!isEq) this.mergeCgcGenerations(node, generation, result.node);
          this.pushEq(node, result.node, mkCongruenceEqJustification(result.isCommutative));
        }
      }
      if (!isEq) {
        const list = this.decl2enodes.get(node.decl);
        if (list === undefined) this.decl2enodes.set(node.decl, [node]);
        else list.push(node);
      }
    }
    return node;
  }

  private undoMkEnode() {
    const node = this.enodes.pop();
    if (node === undefined) return;
    this.exprToEnode[node.owner] = undefined;
    if (node.isCgr() && node.usesCgTable()) this.cgTable.erase(node);
    if (node.args.length > 0 && !node.isEq) this.decl2enodes.get(node.decl)?.pop();
    for (const arg of node.args) arg.root.parents.pop();
  }

  private mergeCgcGenerations(first: Enode, firstGeneration: number, second: Enode) {
    const secondGeneration = second.generation;
    this.trail.push(() => {
      first.generation = firstGeneration;
      second.generation = secondGeneration;
    });
    if (firstGeneration < second.generation) second.generation = firstGeneration;
  }

  private setMergeTf(node: Enode, boolVar: number, isNewVar: boolean) {
    if (node.isMergeTf) return;
    if (!isNewVar)
      this.trail.push(() => {
        node.isMergeTf = false;
      });
    node.isMergeTf = true;
    const value = this.assignment[boolVar * 2];
    if (value === L_TRUE && node.root !== this.trueEnode.root)
      this.pushEq(node, this.trueEnode, mkLiteralEqJustification(boolVar * 2));
    else if (value === L_FALSE && node.root !== this.falseEnode.root)
      this.pushEq(node, this.falseEnode, mkLiteralEqJustification(boolVar * 2 + 1));
  }

  private setEnodeFlag(boolVar: number, isNewVar: boolean) {
    if (this.isEnodeFlags[boolVar]) return;
    if (!isNewVar)
      this.trail.push(() => {
        this.isEnodeFlags[boolVar] = false;
      });
    this.isEnodeFlags[boolVar] = true;
  }

  private updateGeneration(node: Enode) {
    if (node.isEq) return;
    if (this.generation > 0 && this.generation < this.getGeneration(node))
      node.cg.generation = this.generation;
  }

  // Internalization.

  private isGate(expr: number) {
    const op = this.manager.getOp(expr);
    if (op === OP_AND || op === OP_OR || op === OP_ITE) return true;
    return op === OP_EQ && this.manager.isBool(this.manager.args[expr][0]);
  }

  internalizeAssertion(expr: number, generation: number) {
    const savedGeneration = this.generation;
    this.generation = generation;
    const manager = this.manager;
    if (this.isGate(expr)) {
      const args = manager.args[expr];
      switch (manager.getOp(expr)) {
        case OP_AND:
          for (const arg of args) {
            this.internalizeRec(arg, true);
            this.mkClause([this.getLiteral(arg)], null, CLS_AUX);
          }
          break;
        case OP_OR: {
          for (const arg of args) this.internalizeRec(arg, true);
          this.mkClause(
            args.map((innerArg) => this.getLiteral(innerArg)),
            null,
            CLS_AUX,
          );
          this.addOrRelWatches(expr);
          break;
        }
        case OP_EQ: {
          this.internalizeRec(args[0], true);
          this.internalizeRec(args[1], true);
          const first = this.getLiteral(args[0]);
          const second = this.getLiteral(args[1]);
          this.mkClause([first, second ^ 1], null, CLS_AUX);
          this.mkClause([first ^ 1, second], null, CLS_AUX);
          break;
        }
        default: {
          for (const arg of args) this.internalizeRec(arg, true);
          const condition = this.getLiteral(args[0]);
          this.mkClause([condition ^ 1, this.getLiteral(args[1])], null, CLS_AUX);
          this.mkClause([condition, this.getLiteral(args[2])], null, CLS_AUX);
          this.addIteRelWatches(expr);
        }
      }
      this.markAsRelevant(expr);
    } else {
      this.internalizeRec(expr, true);
      const literal = this.getLiteral(expr);
      if (literal === this.falseLiteral) this.setConflict("axiom", -1);
      else if (literal !== this.trueLiteral) {
        this.assign(literal, "axiom");
        this.markLiteralAsRelevant(literal);
      }
    }
    this.generation = savedGeneration;
  }

  internalize(expr: number, isGateContext: boolean, generation = this.generation) {
    const savedGeneration = this.generation;
    this.generation = generation;
    this.internalizeRec(expr, isGateContext);
    this.generation = savedGeneration;
  }

  private internalizeRec(expr: number, isGateContext: boolean) {
    const manager = this.manager;
    if (manager.kinds[expr] === KIND_VAR)
      throw new SmtUnsupportedError("formulas should not contain unbound variables");
    if (manager.sorts[expr] === SORT_BOOL) this.internalizeFormula(expr, isGateContext);
    else this.internalizeTerm(expr);
  }

  private internalizeFormula(expr: number, isGateContext: boolean) {
    const manager = this.manager;
    if (expr === manager.trueExpr || expr === manager.falseExpr) return;
    if (manager.isNot(expr) && isGateContext) {
      this.internalizeRec(manager.args[expr][0], true);
      return;
    }
    if (this.isBInternalized(expr)) {
      const boolVar = this.getBoolVar(expr);
      const node = this.exprToEnode[expr];
      if (node !== undefined) this.updateGeneration(node);
      if (!isGateContext && manager.kinds[expr] === KIND_APP) {
        if (node !== undefined) this.setMergeTf(node, boolVar, false);
        else {
          this.mkEnode(expr, true, true, false);
          this.setEnodeFlag(boolVar, false);
          if (this.assignment[boolVar * 2] !== L_UNDEF) this.propagateBoolVarEnode(boolVar);
        }
      }
      return;
    }
    const op = manager.getOp(expr);
    if (op === OP_EQ && !manager.isBool(manager.args[expr][0]))
      this.internalizeEq(expr, isGateContext);
    else if (op === OP_DISTINCT)
      throw new SmtUnsupportedError("distinct should have been simplified");
    else if (manager.kinds[expr] === KIND_APP && this.internalizeTheoryAtom(expr, isGateContext))
      return;
    else if (manager.kinds[expr] === KIND_QUANTIFIER) this.internalizeQuantifier(expr);
    else this.internalizeFormulaCore(expr, isGateContext);
  }

  private internalizeEq(expr: number, isGateContext: boolean) {
    this.internalizeFormulaCore(expr, isGateContext);
    const boolVar = this.getBoolVar(expr);
    this.isEqFlags[boolVar] = true;
    if (this.manager.sorts[this.manager.args[expr][0]] !== SORT_BOOL && this.isArithSort(expr))
      this.theory?.internalizeEqEh(expr, boolVar);
  }

  private isArithSort(eq: number) {
    return this.manager.sorts[this.manager.args[eq][0]] === 1;
  }

  private internalizeTheoryAtom(expr: number, isGateContext: boolean) {
    if (this.manager.getFamily(expr) !== FAMILY_ARITH || this.theory === null) return false;
    if (!this.theory.internalizeAtom(expr, isGateContext)) return false;
    const boolVar = this.getBoolVar(expr);
    if (!isGateContext) {
      const node = this.exprToEnode[expr];
      if (node === undefined) this.mkEnode(expr, true, true, false);
      else {
        this.setEnodeFlag(boolVar, true);
        this.setMergeTf(node, boolVar, true);
      }
    }
    if (this.exprToEnode[expr] !== undefined) {
      this.setEnodeFlag(boolVar, true);
      if (this.assignment[boolVar * 2] !== L_UNDEF) this.propagateBoolVarEnode(boolVar);
    }
    return true;
  }

  private internalizeQuantifier(expr: number) {
    const data = this.manager.getQuantifier(expr);
    if (!data.isForall) throw new SmtUnsupportedError("internalization of exists is not supported");
    const boolVar = this.mkBoolVar(expr);
    const generation = this.cachedGeneration.get(expr) ?? this.generation;
    this.isQuantifierFlags[boolVar] = true;
    this.qmanager?.add(expr, generation);
  }

  private internalizeFormulaCore(expr: number, isGateContext: boolean) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    const isGateNode = this.isGate(expr) || op === OP_NOT;
    for (const arg of manager.args[expr]) this.internalizeRec(arg, isGateNode);
    const isNewVar = !this.isBInternalized(expr);
    const boolVar = isNewVar ? this.mkBoolVar(expr) : this.getBoolVar(expr);
    const node = this.exprToEnode[expr];
    if (node === undefined && (!isGateContext || (!isGateNode && manager.args[expr].length > 0))) {
      this.mkEnode(expr, isGateNode, !isGateContext, true);
      this.setEnodeFlag(boolVar, isNewVar);
    } else if (!isGateContext && node !== undefined) this.setMergeTf(node, boolVar, isNewVar);
    if (!isNewVar || manager.getFamily(expr) !== FAMILY_BASIC) return;
    const literal = boolVar * 2;
    const args = manager.args[expr];
    switch (op) {
      case OP_NOT: {
        const child = this.getLiteral(args[0]);
        this.mkClause([literal ^ 1, child ^ 1], null, CLS_AUX);
        this.mkClause([literal, child], null, CLS_AUX);
        break;
      }
      case OP_AND: {
        const buffer = [literal];
        for (const arg of args) {
          const argLiteral = this.getLiteral(arg);
          this.mkClause([literal ^ 1, argLiteral], null, CLS_AUX);
          buffer.push(argLiteral ^ 1);
        }
        this.mkClause(buffer, null, CLS_AUX);
        this.addAndRelWatches(expr);
        break;
      }
      case OP_OR: {
        const buffer = [literal ^ 1];
        for (const arg of args) {
          const argLiteral = this.getLiteral(arg);
          this.mkClause([literal, argLiteral ^ 1], null, CLS_AUX);
          buffer.push(argLiteral);
        }
        this.mkClause(buffer, null, CLS_AUX);
        this.addOrRelWatches(expr);
        break;
      }
      case OP_IMPLIES: {
        const first = this.getLiteral(args[0]);
        const second = this.getLiteral(args[1]);
        this.mkClause([literal, first], null, CLS_AUX);
        this.mkClause([literal, second ^ 1], null, CLS_AUX);
        this.mkClause([literal ^ 1, first ^ 1, second], null, CLS_AUX);
        break;
      }
      case OP_EQ:
      case OP_XOR: {
        if (op === OP_EQ && !manager.isBool(args[0])) break;
        const gate = op === OP_XOR ? literal ^ 1 : literal;
        const first = this.getLiteral(args[0]);
        const second = this.getLiteral(args[1]);
        this.mkClause([gate ^ 1, first, second ^ 1], null, CLS_AUX);
        this.mkClause([gate ^ 1, first ^ 1, second], null, CLS_AUX);
        this.mkClause([gate, first, second], null, CLS_AUX);
        this.mkClause([gate, first ^ 1, second ^ 1], null, CLS_AUX);
        break;
      }
      case OP_ITE: {
        const condition = this.getLiteral(args[0]);
        const thenLiteral = this.getLiteral(args[1]);
        const elseLiteral = this.getLiteral(args[2]);
        this.mkClause([literal ^ 1, condition ^ 1, thenLiteral], null, CLS_AUX);
        this.mkClause([literal ^ 1, condition, elseLiteral], null, CLS_AUX);
        this.mkClause([literal, condition ^ 1, thenLiteral ^ 1], null, CLS_AUX);
        this.mkClause([literal, condition, elseLiteral ^ 1], null, CLS_AUX);
        this.addIteRelWatches(expr);
        break;
      }
      default:
        break;
    }
  }

  internalizeTerm(expr: number) {
    const manager = this.manager;
    const existing = this.exprToEnode[expr];
    if (existing !== undefined) {
      this.updateGeneration(existing);
      return;
    }
    if (manager.getOp(expr) === OP_ITE) {
      this.internalizeIteTerm(expr);
      return;
    }
    if (manager.getFamily(expr) === FAMILY_ARITH && this.theory?.internalizeTerm(expr)) return;
    for (const arg of manager.args[expr]) this.internalizeRec(arg, false);
    if (this.exprToEnode[expr] !== undefined) return;
    this.mkEnode(expr, false, false, true);
  }

  mkEqAtom(lhs: number, rhs: number) {
    return lhs < rhs ? this.manager.mkEq(lhs, rhs) : this.manager.mkEq(rhs, lhs);
  }

  private internalizeIteTerm(expr: number) {
    const args = this.manager.args[expr];
    const thenEq = this.mkEqAtom(expr, args[1]);
    const elseEq = this.mkEqAtom(expr, args[2]);
    this.mkEnode(expr, true, false, false);
    this.internalizeRec(args[0], true);
    this.internalizeRec(args[1], false);
    this.internalizeRec(args[2], false);
    this.internalizeRec(thenEq, true);
    this.internalizeRec(elseEq, true);
    const condition = this.getLiteral(args[0]);
    this.mkClause([condition ^ 1, this.getLiteral(thenEq)], null, CLS_AUX);
    this.mkClause([condition, this.getLiteral(elseEq)], null, CLS_AUX);
    const handler = () => {
      if (!this.isRelevant(expr)) return;
      this.markAsRelevant(args[0]);
      const value = this.findAssignment(args[0]);
      if (value < 0) this.markAsRelevant(elseEq);
      else if (value > 0) this.markAsRelevant(thenEq);
    };
    this.addRelWatch(condition, handler);
    this.addRelWatch(condition ^ 1, handler);
    this.relevancy.addHandler(expr, handler);
  }

  private addRelWatch(literal: number, handler: () => void) {
    this.relevancy.addWatch(this.boolVar2Expr[literal >> 1], (literal & 1) === 0, handler);
  }

  private addAndRelWatches(expr: number) {
    const handler = () => {
      if (this.isRelevant(expr)) this.relevancy.propagateAnd(expr);
    };
    for (const arg of this.manager.args[expr]) {
      const literal = this.getLiteral(arg);
      if (literal > 1) this.addRelWatch(literal ^ 1, handler);
    }
  }

  private addOrRelWatches(expr: number) {
    const handler = () => {
      if (this.isRelevant(expr)) this.relevancy.propagateOr(expr);
    };
    for (const arg of this.manager.args[expr]) {
      const literal = this.getLiteral(arg);
      if (literal > 1) this.addRelWatch(literal, handler);
    }
  }

  private addIteRelWatches(expr: number) {
    const handler = () => {
      if (this.isRelevant(expr)) this.relevancy.propagateIte(expr);
    };
    const literal = this.getLiteral(this.manager.args[expr][0]);
    if (literal <= 1) return;
    this.addRelWatch(literal, handler);
    this.addRelWatch(literal ^ 1, handler);
  }

  // Clauses.

  mkThAxiom(literals: number[]) {
    this.mkClause(literals, null, CLS_TH_AXIOM);
  }

  private simplifyAuxClauseLiterals(literals: number[], removed: number[]) {
    literals.sort((first, second) => first - second);
    let previous = -1;
    let kept = 0;
    for (const literal of literals) {
      const value = this.assignment[literal];
      if (value === L_FALSE) {
        if (literal !== previous) {
          previous = literal;
          removed.push(literal ^ 1);
        }
      } else if (value === L_UNDEF) {
        if (literal === (previous ^ 1) && previous !== -1) return false;
        if (literal !== previous) {
          previous = literal;
          literals[kept++] = literal;
        }
      } else return false;
    }
    literals.length = kept;
    return true;
  }

  private selectWatchLiteral(clause: Clause, startingAt: number) {
    let minTrue = -1;
    let maxFalse = -1;
    let unknown = -1;
    const literals = clause.literals;
    for (let index = startingAt; index < literals.length; index++) {
      const literal = literals[index];
      const value = this.assignment[literal];
      if (value === L_FALSE) {
        if (maxFalse === -1 || this.levels[literal >> 1] > this.levels[literals[maxFalse] >> 1])
          maxFalse = index;
      } else if (value === L_UNDEF) unknown = index;
      else if (minTrue === -1 || this.levels[literal >> 1] < this.levels[literals[minTrue] >> 1])
        minTrue = index;
    }
    if (minTrue !== -1) return minTrue;
    if (unknown !== -1) return unknown;
    return maxFalse;
  }

  private selectLearnedWatchLiteral(clause: Clause) {
    let maxFalse = -1;
    let maxLevel = 0;
    const literals = clause.literals;
    for (let index = 1; index < literals.length; index++) {
      const literal = literals[index];
      const level =
        this.assignment[literal] === L_FALSE ? this.levels[literal >> 1] : this.scopeLevel;
      if (maxFalse === -1 || level > maxLevel) {
        maxFalse = index;
        maxLevel = level;
      }
    }
    return maxFalse;
  }

  private swapLiterals(clause: Clause, first: number, second: number) {
    const literals = clause.literals;
    const saved = literals[first];
    literals[first] = literals[second];
    literals[second] = saved;
    if (clause.atoms !== null) {
      const savedAtom = clause.atoms[first];
      clause.atoms[first] = clause.atoms[second];
      clause.atoms[second] = savedAtom;
    }
  }

  private addWatchLiteral(clause: Clause, index: number) {
    this.watches[clause.literals[index] ^ 1].push(clause);
  }

  private removeWatchLiteral(clause: Clause, index: number) {
    const list = this.watches[clause.literals[index] ^ 1];
    const position = list.indexOf(clause);
    if (position !== -1) list.splice(position, 1);
  }

  private getMaxIscopeLevel(literals: number[]) {
    let result = 0;
    for (const literal of literals) result = Math.max(result, this.internLevels[literal >> 1]);
    return result;
  }

  private markForReinit(clause: Clause, level: number, isReinternalizingAtoms: boolean) {
    clause.isReinit = true;
    clause.isReinternalizeAtoms = isReinternalizingAtoms;
    while (this.clausesToReinit.length <= level) this.clausesToReinit.push([]);
    this.clausesToReinit[level].push(clause);
  }

  mkClause(input: number[], inputJustification: Justification | null, kind: number) {
    let literals = input;
    let justification = inputJustification;
    if (kind !== CLS_LEARNED) {
      literals = [...input];
      const removed: number[] = [];
      if (!this.simplifyAuxClauseLiterals(literals, removed)) return null;
      if (removed.length > 0)
        justification = new UnitResolutionJustification(justification, removed);
    }
    if (literals.length === 0) {
      this.setConflict(justification ?? "axiom", -1);
      return null;
    }
    if (literals.length === 1) {
      this.assign(literals[0], justification ?? "axiom");
      return null;
    }
    const isLemma = kind === CLS_LEARNED;
    let iscopeLevel = isLemma ? this.getMaxIscopeLevel(literals) : 0;
    const isSavingAtoms = isLemma && iscopeLevel > this.baseLevel;
    const clause = new Clause(
      literals,
      kind,
      justification,
      isSavingAtoms ? literals.map((literal) => this.boolVar2Expr[literal >> 1]) : null,
    );
    if (isLemma) {
      this.swapLiterals(clause, 1, this.selectLearnedWatchLiteral(clause));
      this.lemmas.push(clause);
      this.addWatchLiteral(clause, 0);
      this.addWatchLiteral(clause, 1);
      if (this.assignment[literals[0]] === L_FALSE) this.setConflict(clause, -1);
      else if (this.assignment[literals[1]] === L_FALSE) this.assign(literals[0], clause);
      if (isSavingAtoms) this.markForReinit(clause, iscopeLevel, true);
      return clause;
    }
    iscopeLevel = 0;
    this.auxClauses.push(clause);
    this.addWatchLiteral(clause, 0);
    this.addWatchLiteral(clause, 1);
    if (this.assignment[literals[0]] === L_FALSE) this.setConflict(clause, -1);
    else if (this.assignment[literals[1]] === L_FALSE) this.assign(literals[0], clause);
    return clause;
  }

  private deleteClauses(clauses: Clause[], oldSize: number) {
    for (let index = clauses.length - 1; index >= oldSize; index--) {
      const clause = clauses[index];
      if (!clause.isDeleted) {
        this.removeWatchLiteral(clause, 0);
        this.removeWatchLiteral(clause, 1);
        clause.isDeleted = true;
      }
    }
    clauses.length = oldSize;
  }

  // Assignment and propagation.

  setConflict(justification: BJustification, notLiteral: number) {
    if (this.conflict !== undefined) return;
    this.conflict = justification;
    this.notLiteral = notLiteral;
  }

  assign(literal: number, justification: BJustification, isDecision = false) {
    const value = this.assignment[literal];
    if (value === L_FALSE) this.setConflict(justification, literal ^ 1);
    else if (value === L_UNDEF) this.assignCore(literal, justification, isDecision);
  }

  private assignCore(literal: number, justification: BJustification, isDecision: boolean) {
    const boolVar = literal >> 1;
    this.assignedLiterals.push(literal);
    this.assignment[literal] = L_TRUE;
    this.assignment[literal ^ 1] = L_FALSE;
    this.justifications[boolVar] = justification;
    this.levels[boolVar] = this.scopeLevel;
    const isNegative = (literal & 1) === 1;
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
      const literal = this.assignedLiterals[this.qhead];
      this.qhead++;
      const notLiteral = literal ^ 1;
      const list = this.watches[literal];
      let kept = 0;
      let index = 0;
      for (; index < list.length; index++) {
        const clause = list[index];
        const literals = clause.literals;
        if (literals[0] === notLiteral) {
          literals[0] = literals[1];
          literals[1] = notLiteral;
          if (clause.atoms !== null) {
            const savedAtom = clause.atoms[0];
            clause.atoms[0] = clause.atoms[1];
            clause.atoms[1] = savedAtom;
          }
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
            this.watches[candidate ^ 1].push(clause);
            literals[1] = candidate;
            literals[position] = notLiteral;
            if (clause.atoms !== null) {
              const savedAtom = clause.atoms[1];
              clause.atoms[1] = clause.atoms[position];
              clause.atoms[position] = savedAtom;
            }
            isFound = true;
            break;
          }
        }
        if (isFound) continue;
        list[kept++] = clause;
        if (firstValue === L_FALSE) {
          for (index++; index < list.length; index++) list[kept++] = list[index];
          list.length = kept;
          this.setConflict(clause, -1);
          return false;
        }
        this.assignCore(firstLiteral, clause, false);
      }
      list.length = kept;
    }
    return true;
  }

  pushEq(lhs: Enode, rhs: Enode, justification: EqJustification) {
    this.eqPropagationQueue.push({ lhs, rhs, justification });
  }

  private propagateEqs() {
    for (let index = 0; index < this.eqPropagationQueue.length; index++) {
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
    for (let index = 0; index < queue.length; index++) {
      const literal = queue[index];
      const boolVar = literal >> 1;
      const value = this.assignment[boolVar * 2];
      if (this.isEnodeFlags[boolVar]) this.propagateBoolVarEnode(boolVar);
      if (this.isInconsistent()) return false;
      if (this.isEqFlags[boolVar]) {
        const args = this.manager.args[this.boolVar2Expr[boolVar]];
        if (!this.manager.isBool(args[0])) {
          const lhs = this.exprToEnode[args[0]];
          const rhs = this.exprToEnode[args[1]];
          if (lhs !== undefined && rhs !== undefined) {
            if (value === L_TRUE) this.addEq(lhs, rhs, mkLiteralEqJustification(literal));
            else if (!this.addDiseq(lhs, rhs) && !this.isInconsistent())
              this.setConflict(new EqPropagationJustification(lhs, rhs), boolVar * 2 + 1);
          }
        }
      } else if (this.isTheoryFlags[boolVar]) this.theory?.assignEh(boolVar, value === L_TRUE);
      else if (this.isQuantifierFlags[boolVar] && value === L_TRUE)
        this.qmanager?.assignEh(this.boolVar2Expr[boolVar]);
      if (this.isInconsistent()) return false;
    }
    this.atomPropagationQueue = [];
    return true;
  }

  private propagateBoolVarEnode(boolVar: number) {
    const value = this.assignment[boolVar * 2];
    let node = this.exprToEnode[this.boolVar2Expr[boolVar]];
    if (node === undefined) return;
    const isNegative = value === L_FALSE;
    if (node.isMergeTf)
      this.addEq(
        node,
        isNegative ? this.falseEnode : this.trueEnode,
        mkLiteralEqJustification(boolVar * 2 + (isNegative ? 1 : 0)),
      );
    const root = node.root;
    if (root === this.trueEnode || root === this.falseEnode) return;
    if (
      node === root ||
      !this.isRelevant(root.owner) ||
      this.assignment[this.getBoolVar(root.owner) * 2] !== value
    ) {
      const first = node;
      node = node.next;
      while (node !== first) {
        const otherVar = this.getBoolVar(node.owner);
        if (this.assignment[otherVar * 2] !== value)
          this.assign(otherVar * 2 + (isNegative ? 1 : 0), this.mkMpIff(first, node));
        node = node.next;
      }
    }
  }

  private mkMpIff(first: Enode, second: Enode) {
    return new MpIffJustification(first, second, (node) => this.enodeToLiteral(node));
  }

  relevantEh(expr: number) {
    const boolVar = this.getBoolVar(expr);
    if (boolVar >= 0 && this.isAtom(boolVar)) {
      const value = this.assignment[boolVar * 2];
      if (value !== L_UNDEF)
        this.atomPropagationQueue.push(boolVar * 2 + (value === L_FALSE ? 1 : 0));
    }
    if (this.manager.kinds[expr] !== KIND_APP) return;
    const node = this.exprToEnode[expr];
    if (node !== undefined) this.qmanager?.relevantEh(node);
    if (this.manager.getFamily(expr) === FAMILY_ARITH || (node !== undefined && node.thVar >= 0))
      this.theory?.relevantEh(expr);
  }

  private propagateRelevancy(qhead: number) {
    for (let index = qhead; index < this.assignedLiterals.length; index++) {
      const literal = this.assignedLiterals[index];
      this.relevancy.assignEh(this.boolVar2Expr[literal >> 1], (literal & 1) === 0);
    }
    this.relevancy.propagate();
  }

  private propagateThEqs() {
    const queue = this.thEqQueue;
    for (let index = 0; index < queue.length && !this.isInconsistent(); index += 2)
      this.theory?.newEqEh(queue[index], queue[index + 1]);
    this.thEqQueue = [];
  }

  private propagateThDiseqs() {
    const queue = this.thDiseqQueue;
    for (let index = 0; index < queue.length && !this.isInconsistent(); index += 2)
      this.theory?.newDiseqEh(queue[index], queue[index + 1]);
    this.thDiseqQueue = [];
  }

  canPropagate() {
    return (
      this.qhead !== this.assignedLiterals.length ||
      this.relevancy.canPropagate() ||
      this.atomPropagationQueue.length > 0 ||
      (this.qmanager?.canPropagate() ?? false) ||
      (this.theory?.canPropagate() ?? false) ||
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
      this.theory?.propagate();
      if (this.isInconsistent()) return false;
      if (!this.checkCanceled()) this.qmanager?.propagate();
      if (this.isInconsistent()) return false;
      if (this.checkCanceled()) {
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
    let previous = start;
    let justification = start.transJustification;
    start.transTarget = null;
    start.transJustification = AXIOM_EQ_JUSTIFICATION;
    while (current !== null) {
      const newCurrent = current.transTarget;
      const newJustification = current.transJustification;
      current.transTarget = previous;
      current.transJustification = justification;
      previous = current;
      justification = newJustification;
      current = newCurrent;
    }
  }

  private pushNewThEq(first: number, second: number) {
    this.thEqQueue.push(first, second);
  }

  private pushNewThDiseq(first: number, second: number) {
    const theory = this.theory;
    if (theory === null) return;
    if (theory.getEnode(first).isInterpreted && theory.getEnode(second).isInterpreted) return;
    this.thDiseqQueue.push(first, second);
  }

  private pushNewThDiseqs(root: Enode, thVar: number) {
    for (const parent of root.parents) {
      if (!parent.isEq) continue;
      if (this.assignment[this.getBoolVar(parent.owner) * 2] !== L_FALSE) continue;
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
    const isFromTheory = justification.kind === EQ_JUSTIFICATION;
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
    const root = node.root;
    const rootVar = root.thVar;
    node.thVar = thVar;
    this.trail.push(() => {
      node.thVar = -1;
      if (node.root !== node && node.root.thVar === thVar) node.root.thVar = -1;
    });
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
      this.setConflict(new EqConflictJustification(n1, n2, justification), -1);
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
    this.qmanager?.addEqEh(r1, r2);
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
    const finalN1 = n1;
    const finalR1 = r1;
    this.trail.push(() => this.undoAddEq(finalR1, finalN1, r2NumParents));
    if (n2.isBool) this.propagateBoolEnodeAssignment(r1, r2, n1, n2);
    const savedNext = r1.next;
    r1.next = r2.next;
    r2.next = savedNext;
    r2.classSize += r1.classSize;
    const r2Lbls = r2.lbls;
    const r2Plbls = r2.plbls;
    if ((r2Lbls | r1.lbls) !== r2Lbls || (r2Plbls | r1.plbls) !== r2Plbls) {
      this.trail.push(() => {
        r2.lbls = r2Lbls;
        r2.plbls = r2Plbls;
      });
      r2.lbls |= r1.lbls;
      r2.plbls |= r1.plbls;
    }
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
          if (this.assignment[boolVar * 2] !== L_TRUE)
            this.assign(boolVar * 2, new EqPropagationJustification(lhs, rhs));
          continue;
        }
      }
      if (!parent.isCgcEnabled) {
        r2.parents.push(parent);
        continue;
      }
      const parentGeneration = parent.isEq
        ? 0
        : (this.r1ParentGenerations.get(parent) ?? this.getGeneration(parent));
      const result = this.cgTable.insert(parent);
      if (result.node === parent) {
        parent.generation = parentGeneration;
        r2.parents.push(parent);
        continue;
      }
      parent.cg = result.node;
      this.mergeCgcGenerations(parent, parentGeneration, result.node);
      if (result.node.root !== parent.root)
        this.pushEq(parent, result.node, mkCongruenceEqJustification(result.isCommutative));
    }
    this.r1ParentGenerations.clear();
  }

  private undoAddEq(r1: Enode, n1: Enode, r2NumParents: number) {
    const r2 = r1.root;
    r2.classSize -= r1.classSize;
    const savedNext = r1.next;
    r1.next = r2.next;
    r2.next = savedNext;
    const erasedGenerations = new Map<Enode, number>();
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
      const result = this.cgTable.insert(parent);
      parent.cg = result.node;
      if (result.node === parent) parent.generation = generation;
    }
    if (r2.thVar >= 0 && this.theory !== null && this.theory.getEnode(r2.thVar).root !== r2)
      r2.thVar = -1;
    n1.transTarget = null;
    n1.transJustification = AXIOM_EQ_JUSTIFICATION;
    this.invertTrans(r1);
  }

  private propagateBoolEnodeAssignment(r1: Enode, r2: Enode, n1: Enode, n2: Enode) {
    if (r2 === this.falseEnode || r2 === this.trueEnode) {
      const sign = r2 === this.falseEnode ? 1 : 0;
      let current = r1;
      do {
        const literal = this.getBoolVar(current.owner) * 2 + sign;
        if (this.assignment[literal] !== L_TRUE)
          this.assign(literal, new EqRootPropagationJustification(current));
        current = current.next;
      } while (current !== r1);
      return;
    }
    const first = this.assignment[this.getBoolVar(n1.owner) * 2];
    const second = this.assignment[this.getBoolVar(n2.owner) * 2];
    if (first === second) return;
    if (second === L_UNDEF) this.propagateBoolEnodeAssignmentCore(n1, n2);
    else this.propagateBoolEnodeAssignmentCore(n2, n1);
  }

  private propagateBoolEnodeAssignmentCore(source: Enode, start: Enode) {
    const value = this.assignment[this.getBoolVar(source.owner) * 2];
    const sign = value === L_FALSE ? 1 : 0;
    let target = start;
    do {
      const boolVar = this.getBoolVar(target.owner);
      if (this.assignment[boolVar * 2] !== value)
        this.assign(boolVar * 2 + sign, this.mkMpIff(source, target));
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
      this.theory?.internalizeEqEh(eq, boolVar);
      isNew = true;
    }
    const boolVar = this.getBoolVar(eq);
    if (!this.isTrueFirstFlags[boolVar]) {
      this.setTrueFirstFlag(boolVar);
      isNew = true;
    }
    if (this.assignment[boolVar * 2] === L_UNDEF) isNew = true;
    if (!this.isRelevant(eq)) {
      this.markAsRelevant(eq);
      isNew = true;
    }
    return isNew;
  }

  // Search.

  incBvarActivity(boolVar: number) {
    this.activity[boolVar] += this.bvarInc;
    if (this.activity[boolVar] > ACTIVITY_LIMIT) {
      for (let index = 0; index < this.activity.length; index++)
        this.activity[index] *= INV_ACTIVITY_LIMIT;
      this.bvarInc *= INV_ACTIVITY_LIMIT;
    }
    this.caseSplitQueue.activityIncreased(boolVar);
  }

  private pushScope() {
    this.scopeLevel++;
    this.scopeAssignedLimits.push(this.assignedLiterals.length);
    this.scopeAuxClauseLimits.push(this.auxClauses.length);
    this.scopeTrailLimits.push(this.trail.length);
    this.relevancy.push();
    this.qmanager?.push();
    this.theory?.pushScopeEh();
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
        this.cachedGeneration.set(current, this.qmanager?.getGeneration(current) ?? 0);
        todo.push(manager.getQuantifier(current).body);
      }
    }
  }

  private cacheGenerationOfLiterals(literals: number[], newLevel: number, visited: Set<number>) {
    for (const literal of literals) {
      const boolVar = literal >> 1;
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
      this.assignment[literal ^ 1] = L_UNDEF;
      this.justifications[literal >> 1] = null;
      this.caseSplitQueue.unassignVar(literal >> 1);
    }
    this.assignedLiterals.length = oldLimit;
    this.qhead = oldLimit;
  }

  private popScopeCore(numScopes: number, visited: Set<number>) {
    const newLevel = this.scopeLevel - numScopes;
    this.cacheGeneration(newLevel, visited);
    this.qmanager?.pop(numScopes);
    this.conflict = undefined;
    this.notLiteral = -1;
    this.deleteClauses(this.auxClauses, this.scopeAuxClauseLimits[newLevel]);
    this.relevancy.pop(numScopes);
    this.unassignVars(this.scopeAssignedLimits[newLevel]);
    const trailLimit = this.scopeTrailLimits[newLevel];
    for (let index = this.trail.length - 1; index >= trailLimit; index--) this.trail[index]();
    this.trail.length = trailLimit;
    this.theory?.popScopeEh(numScopes);
    this.eqPropagationQueue = [];
    this.thEqQueue = [];
    this.thDiseqQueue = [];
    this.atomPropagationQueue = [];
    this.scopeAssignedLimits.length = newLevel;
    this.scopeAuxClauseLimits.length = newLevel;
    this.scopeTrailLimits.length = newLevel;
    this.scopeLevel = newLevel;
    const numBoolVars = this.boolVar2Expr.length;
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
        if (clause.isReinternalizeAtoms && atoms !== null) {
          for (let index = 0; index < 2; index++)
            if (clause.literals[index] >> 1 < numBoolVars) this.removeWatchLiteral(clause, index);
          for (let index = 0; index < clause.literals.length; index++) {
            const atom = atoms[index];
            const sign = clause.literals[index] & 1;
            this.internalize(atom, !this.manager.isNot(atom));
            clause.literals[index] = this.getBoolVar(atom) * 2 + sign;
          }
          this.swapLiterals(clause, 0, this.selectWatchLiteral(clause, 0));
          this.swapLiterals(clause, 1, this.selectWatchLiteral(clause, 1));
          this.addWatchLiteral(clause, 0);
          this.addWatchLiteral(clause, 1);
          if (this.assignment[clause.literals[0]] === L_FALSE) this.setConflict(clause, -1);
          else if (this.assignment[clause.literals[1]] === L_FALSE)
            this.assign(clause.literals[0], clause);
          isKept = true;
        }
        if (isKept && this.scopeLevel > this.baseLevel) {
          while (this.clausesToReinit.length <= this.scopeLevel) this.clausesToReinit.push([]);
          this.clausesToReinit[this.scopeLevel].push(clause);
        } else {
          clause.isReinit = false;
          clause.isReinternalizeAtoms = false;
        }
      }
      this.clausesToReinit[level] = [];
    }
  }

  // guess with PS_CACHING_CONSERVATIVE: the cached phase while phase caching is on, else false.
  private guess(boolVar: number) {
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
    if (boolVar === -1) return false;
    const isPositive = this.guess(boolVar);
    this.pushScope();
    this.assign(boolVar * 2 + (isPositive ? 0 : 1), "axiom", true);
    return true;
  }

  private resolveConflict() {
    this.numConflicts++;
    this.numConflictsSinceRestart++;
    this.atomPropagationQueue = [];
    this.eqPropagationQueue = [];
    this.thEqQueue = [];
    this.thDiseqQueue = [];
    const head = this.scopeLevel === 0 ? 0 : this.scopeAssignedLimits[this.scopeLevel - 1];
    for (let index = head; index < this.assignedLiterals.length; index++)
      this.phaseAvailable[this.assignedLiterals[index] >> 1] = false;
    const resolution = this.conflictResolution;
    if (this.conflict === undefined || !resolution.resolve(this.conflict, this.notLiteral))
      return false;
    const newLevel = resolution.newScopeLevel;
    const literals = resolution.lemma;
    const atoms = resolution.lemmaAtoms;
    const visited = new Set<number>();
    if (resolution.lemmaIscopeLevel > newLevel)
      this.cacheGenerationOfLiterals(literals, newLevel, visited);
    const wasRelevant = literals.map((literal) => this.isRelevant(this.boolVar2Expr[literal >> 1]));
    const numBoolVars = this.popScopeCore(this.scopeLevel - newLevel, visited);
    if (resolution.lemmaIscopeLevel > this.scopeLevel)
      for (let index = 0; index < literals.length; index++) {
        const literal = literals[index];
        if (literal >> 1 < numBoolVars) continue;
        this.internalize(atoms[index], true);
        literals[index] = this.getLiteral(atoms[index]) ^ (literal & 1);
      }
    for (let index = 0; index < literals.length; index++)
      if (wasRelevant[index]) this.markLiteralAsRelevant(literals[index]);
    this.cachedGeneration.clear();
    this.mkClause([...literals], null, CLS_LEARNED);
    this.bvarInc *= INV_DECAY;
    this.updatePhaseCacheCounter();
    return true;
  }

  private finalCheck() {
    const qmanager = this.qmanager;
    const status = qmanager?.finalCheckEh(false) ?? FC_DONE;
    if (status !== FC_DONE) return status;
    const oldIndex = this.finalCheckIndex;
    let result = FC_DONE;
    do {
      const check =
        this.finalCheckIndex === 0
          ? (this.theory?.finalCheckEh() ?? FC_DONE)
          : (qmanager?.finalCheckEh(true) ?? FC_DONE);
      this.finalCheckIndex = (this.finalCheckIndex + 1) % 2;
      if (check === FC_CONTINUE) return FC_CONTINUE;
      if (check === FC_GIVEUP) result = FC_GIVEUP;
    } while (this.finalCheckIndex !== oldIndex);
    if (this.canPropagate()) return FC_CONTINUE;
    return result;
  }

  private boundedSearch() {
    for (;;) {
      while (!this.propagate()) {
        if (!this.resolveConflict()) return L_FALSE;
        if (!this.isInconsistent()) {
          if (this.checkCanceled()) return L_UNDEF;
          if (
            this.numConflictsSinceRestart > this.restartThreshold &&
            this.scopeLevel - this.baseLevel > 2
          )
            return L_UNDEF;
        }
      }
      if (this.checkCanceled()) return L_UNDEF;
      if (!this.decide()) {
        if (this.isInconsistent()) return L_FALSE;
        const status = this.finalCheck();
        if (status === FC_DONE) return L_TRUE;
        if (status === FC_GIVEUP) return L_UNDEF;
      }
    }
  }

  // Returns L_TRUE only when every quantifier is absent and the theories are complete.
  search() {
    if (this.isInconsistent()) return L_FALSE;
    this.theory?.initSearchEh();
    this.qmanager?.initSearchEh();
    this.numConflictsSinceRestart = 0;
    this.restartThreshold = RESTART_INITIAL;
    this.restartOuterThreshold = RESTART_INITIAL;
    this.agility = 0;
    this.finalCheckIndex = 0;
    this.isSearching = true;
    const currentLevel = this.scopeLevel;
    for (;;) {
      const status = this.boundedSearch();
      if (status === L_FALSE) return L_FALSE;
      if (this.checkCanceled()) return L_UNDEF;
      if (status === L_TRUE) return this.qmanager?.hasQuantifiers() ? L_UNDEF : L_TRUE;
      if (status === L_UNDEF && this.numConflictsSinceRestart <= this.restartThreshold)
        return L_UNDEF;
      // inc_limits with RS_IN_OUT_GEOMETRIC.
      if (this.numConflictsSinceRestart >= this.restartThreshold) {
        this.restartThreshold = Math.trunc(this.restartThreshold * RESTART_FACTOR);
        if (this.restartThreshold > this.restartOuterThreshold) {
          this.restartThreshold = RESTART_INITIAL;
          this.restartOuterThreshold = Math.trunc(this.restartOuterThreshold * RESTART_FACTOR);
        }
      }
      this.numConflictsSinceRestart = 0;
      if (this.agility < RESTART_AGILITY_THRESHOLD) {
        if (this.scopeLevel > currentLevel) this.popScope(this.scopeLevel - currentLevel);
        this.theory?.restartEh();
        this.qmanager?.restartEh();
        if (this.isInconsistent()) {
          this.resolveConflict();
          return L_FALSE;
        }
      }
    }
  }

  getNumConflicts() {
    return this.numConflicts;
  }
}
