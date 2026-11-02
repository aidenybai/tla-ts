// Ported from Z3 (src/smt/smt_context.h, src/smt/smt_internalizer.cpp), MIT license, see
// z3-license.txt. The state of the SMT kernel and the translation of formulas into it: Boolean
// variables, enodes, clauses and relevancy watches. The search lives in context.ts.
import { SmtInvariantError } from "../../../errors";
import {
  AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_AND,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_NOT,
  OP_OR,
  OP_XOR,
  SORT_BOOL,
  isArithSort,
} from "./ast";
import { CaseSplitQueue } from "./case-split-queue";
import { CgTable, getCongruenceJustification, isCongruent } from "./cg-table";
import {
  BinJustification,
  BJustification,
  CLS_AUX,
  CLS_LEARNED,
  CLS_TH_AXIOM,
  CLS_TH_LEMMA,
  type Clause,
  ClauseStore,
} from "./clause";
import {
  AXIOM_EQ_JUSTIFICATION,
  Enode,
  EnodeStore,
  EqJustification,
  EqPropagationJustification,
  Justification,
  NO_ENODES,
  UnitResolutionJustification,
} from "./enode";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import {
  BoolVar,
  FALSE_LITERAL,
  getVar,
  isNegated,
  Literal,
  mkLiteral,
  negate,
  TRUE_BOOL_VAR,
  TRUE_LITERAL,
  toBoolVar,
} from "./literal";
import type { DefaultQuantifierManager } from "./quantifier-manager";
import {
  mkPropagation,
  PROPAGATE_AND,
  PROPAGATE_ITE,
  PROPAGATE_OR,
  RelevancyPropagator,
  type RelevancyHandler,
} from "./relevancy";
import { KERNEL_REWRITER_OPTIONS, Rewriter } from "./rewriter";
import { sortNumbers } from "./sort";
import type { TheoryLra } from "./theory-lra";
import { setAt, shrink } from "./array";
import { StickyGenerations } from "./sticky-generations";

// DEEP_EXPR_THRESHOLD: the depth above which internalize_deep sorts an expression's subterms.
const DEEP_EXPR_THRESHOLD = 1024;
const WHITE = 0;
const GREY = 1;
const BLACK = 2;

// The kinds of undo trail entries. Z3 allocates its trail objects in a region. Here an entry is its
// kind on trailKinds, with its operands on trailNodes and trailInts, so recording one allocates
// nothing. pushTrail's closures are one more kind.
const UNDO_CLOSURE = 0;
const UNDO_MK_BOOL_VAR = 1;
const UNDO_MK_ENODE = 2;
const UNDO_VAR_THEORY = 3;
const UNDO_TRUE_FIRST = 4;
const UNDO_CGC_GENERATIONS = 5;
const UNDO_MERGE_TF = 6;
const UNDO_ENODE_FLAG = 7;

// The first word of bool_var_data: the level of the assignment in the low 24 bits, then m_mark,
// m_phase_available, m_phase, m_eq, m_true_first, m_enode, m_quantifier and whether a theory is
// notified.
const LEVEL_MASK = 0xffffff;
const BV_MARK = 1 << 24;
export const BV_PHASE_AVAILABLE = 1 << 25;
export const BV_PHASE = 1 << 26;
export const BV_EQ = 1 << 27;
export const BV_TRUE_FIRST = 1 << 28;
export const BV_ENODE = 1 << 29;
export const BV_QUANTIFIER = 1 << 30;
export const BV_THEORY = 1 << 31;
export const UNDO_ADD_EQ = 8;
export const UNDO_TH_VAR = 9;

interface NewEq {
  lhs: Enode;
  rhs: Enode;
  justification: EqJustification;
}

// m_conflict and m_not_l: the justification of the conflict, and the literal it falsifies, if any.
interface Conflict {
  justification: BJustification;
  notLiteral: Literal | null;
}

export abstract class Internalizer {
  readonly trueLiteral = TRUE_LITERAL;
  readonly falseLiteral = FALSE_LITERAL;
  readonly rewriter: Rewriter;
  readonly relevancy: RelevancyPropagator;
  readonly caseSplitQueue: CaseSplitQueue;
  private stickyGenerations = new StickyGenerations();
  abstract readonly theory: TheoryLra;
  abstract readonly qmanager: DefaultQuantifierManager;

  // Per Boolean variable. Like Z3's vectors, the arrays keep their size when a variable is deleted,
  // since V8 shrinks an array's storage when it pops and copies it again when it grows. Only the
  // first numBoolVars entries are live.
  numBoolVars = 0;
  boolVar2Expr: number[] = [];
  // bool_var_data: two words per variable. The first holds the level of its assignment and the BV_
  // flags, the second the level of its internalization.
  private boolVarData = new Int32Array(2048);
  justifications: BJustification[] = [];
  activity: number[] = [];
  // Per literal.
  protected assignment: number[] = [];
  readonly clauses = new ClauseStore();
  // Like Z3's watch lists, a literal's lists are created when the first clause is added.
  protected watches: (Clause[] | undefined)[] = [];
  // del_clauses' uint_set of the watch lists to filter, by literal, all 0 between calls.
  private watchMarks = new Uint8Array(1024);
  // The false literals that simplify_aux_clause_literals removes from the clause mkClause makes.
  private removedLiterals: Literal[] = [];
  // The literal_buffer of mk_and_cnstr and mk_or_cnstr, and the array that mk_gate_clause keeps on
  // the stack. mkClause neither keeps them nor makes a gate, so the gates reuse them.
  private gateBuffer: Literal[] = [];
  private atomBuffer: number[] = [];
  private watchedLiterals: Literal[] = [];
  private gateLiterals: Literal[] = [];
  // The binary clauses of the binary clause optimization: the literals each literal propagates when it
  // becomes true, which Z3 visits newest first and before the clauses.
  protected binaryWatches: (Literal[] | undefined)[] = [];
  // A binary justification holds only its literal, so undoMkBoolVar keeps it for the next variable
  // with that literal. Clearing it would write past the end of this sparse array, which V8 then
  // turns into a dictionary.
  private binJustifications: (BinJustification | undefined)[] = [];
  // Per expression.
  // The Boolean variable of each expression, or -1. A typed array keeps the element loads of every
  // context monomorphic, where the holes of a growing array give each its own elements kind.
  private exprToBoolVar = new Int32Array(1024).fill(-1);
  protected exprToEnode: (Enode | undefined)[] = [];

  assignedLiterals: Literal[] = [];
  scopeLevel = 0;
  baseLevel = 0;
  searchLevel = 0;
  protected trailKinds: number[] = [];
  protected trailNodes: Enode[] = [];
  protected trailInts: number[] = [];
  private trailClosures: (() => void)[] = [];
  protected auxClauses: Clause[] = [];
  protected lemmas: Clause[] = [];
  protected clausesToReinit: Clause[][] = [];
  protected conflict: Conflict | null = null;
  protected eqPropagationQueue: NewEq[] = [];
  readonly enodeStore = new EnodeStore();
  readonly cgTable = new CgTable(this.enodeStore);
  protected decl2enodes = new Map<number, Enode[]>();
  trueEnode: Enode;
  private isDiseqTmp = -1;
  falseEnode: Enode;
  protected generation = 0;
  protected cachedGeneration = new Map<number, number>();
  private randomSeed = 0;
  isSearching = false;

  constructor(
    readonly manager: AstManager,
    isRelevancyEnabled: boolean,
    isDelayingNewCaseSplits: boolean,
  ) {
    this.rewriter = new Rewriter(manager, KERNEL_REWRITER_OPTIONS);
    this.relevancy = new RelevancyPropagator(
      {
        manager,
        findAssignment: (expr) => this.findAssignment(expr),
        findEnode: (expr) => this.exprToEnode[expr],
        relevantEh: (expr) => this.relevantEh(expr),
      },
      isRelevancyEnabled,
    );
    this.caseSplitQueue = new CaseSplitQueue(
      {
        activity: this.activity,
        getIsSearching: () => this.isSearching,
        getRandomValue: () => this.getRandomValue(),
        getNumBoolVars: () => this.numBoolVars,
        isUnassigned: (boolVar) => this.assignment[mkLiteral(boolVar)] === L_UNDEF,
      },
      isDelayingNewCaseSplits,
    );
    this.mkBoolVar(manager.trueExpr);
    this.assignment[0] = L_TRUE;
    this.assignment[1] = L_FALSE;
    this.justifications[0] = "axiom";
    this.trueEnode = this.mkEnode(manager.trueExpr, true, true, false);
    this.setExprBoolVar(manager.falseExpr, TRUE_BOOL_VAR);
    this.falseEnode = this.mkEnode(manager.falseExpr, true, true, false);
  }

  abstract assign(literal: Literal, justification: BJustification, isDecision?: boolean): void;

  abstract relevantEh(expr: number): void;

  protected abstract propagateBoolVarEnode(boolVar: BoolVar): void;

  setConflict(justification: BJustification, notLiteral: Literal | null) {
    if (this.conflict !== null) return;
    this.conflict = { justification, notLiteral };
  }

  pushEq(lhs: Enode, rhs: Enode, justification: EqJustification) {
    this.eqPropagationQueue.push({ lhs, rhs, justification });
  }

  // random_gen from Z3's util/util.h with the default seed 0.
  getRandomValue() {
    this.randomSeed = (Math.imul(this.randomSeed, 214013) + 2531011) >>> 0;
    return (this.randomSeed >>> 16) & 0x7fff;
  }

  pushTrail(undo: () => void) {
    this.trailClosures.push(undo);
    this.trailKinds.push(UNDO_CLOSURE);
  }

  protected popTrail(limit: number) {
    const kinds = this.trailKinds;
    for (let index = kinds.length - 1; index >= limit; index--) this.undoTrailEntry(kinds[index]);
    shrink(kinds, limit);
  }

  protected popTrailNode() {
    const nodes = this.trailNodes;
    const node = nodes[nodes.length - 1];
    nodes.pop();
    return node;
  }

  protected popTrailInt() {
    const ints = this.trailInts;
    const value = ints[ints.length - 1];
    ints.pop();
    return value;
  }

  protected undoTrailEntry(kind: number) {
    switch (kind) {
      case UNDO_CLOSURE:
        this.trailClosures.pop()?.();
        return;
      case UNDO_MK_BOOL_VAR:
        this.undoMkBoolVar();
        return;
      case UNDO_MK_ENODE:
        this.undoMkEnode();
        return;
      case UNDO_VAR_THEORY:
        this.setBoolVarFlag(this.popTrailInt(), BV_THEORY, false);
        return;
      case UNDO_TRUE_FIRST:
        this.setBoolVarFlag(this.popTrailInt(), BV_TRUE_FIRST, false);
        return;
      case UNDO_CGC_GENERATIONS: {
        const second = this.popTrailNode();
        const first = this.popTrailNode();
        const secondGeneration = this.popTrailInt();
        this.undoMergeCgcGenerations(first, this.popTrailInt(), second, secondGeneration);
        return;
      }
      case UNDO_MERGE_TF:
        this.popTrailNode().isMergeTf = false;
        return;
      case UNDO_ENODE_FLAG:
        this.setBoolVarFlag(this.popTrailInt(), BV_ENODE, false);
        return;
    }
  }

  // Assignment queries.

  getAssignment(literal: Literal) {
    return this.assignment[literal];
  }

  getBoolVarAssignment(boolVar: BoolVar) {
    return this.assignment[mkLiteral(boolVar)];
  }

  getAssignLevel(literal: Literal) {
    return this.getLevel(getVar(literal));
  }

  isBInternalized(expr: number) {
    return this.findBoolVar(expr) !== undefined;
  }

  findBoolVar(expr: number) {
    const boolVar = expr < this.exprToBoolVar.length ? this.exprToBoolVar[expr] : -1;
    return boolVar === -1 ? undefined : toBoolVar(boolVar);
  }

  private setExprBoolVar(expr: number, boolVar: number) {
    if (expr >= this.exprToBoolVar.length) {
      const exprToBoolVar = new Int32Array(Math.max(2 * this.exprToBoolVar.length, expr + 1)).fill(
        -1,
      );
      exprToBoolVar.set(this.exprToBoolVar);
      this.exprToBoolVar = exprToBoolVar;
    }
    this.exprToBoolVar[expr] = boolVar;
  }

  getBoolVar(expr: number) {
    const boolVar = this.findBoolVar(expr);
    if (boolVar === undefined) throw new SmtInvariantError("the formula has no Boolean variable");
    return boolVar;
  }

  getEnode(expr: number) {
    return this.exprToEnode[expr];
  }

  isEInternalized(expr: number) {
    return this.exprToEnode[expr] !== undefined;
  }

  findCongruent(decl: number, args: number[]) {
    const found = this.cgTable.findFor(decl, args, decl === OP_EQ);
    return found === -1 ? undefined : this.enodeStore.nodes[found];
  }

  // is_diseq_core: the roots are distinct values, or an equality between the two classes is false.
  // The congruence table is searched with m_is_diseq_tmp, an equality of the sort, which holds a
  // reference until an equality of another sort replaces it.
  isDiseq(first: Enode, second: Enode) {
    const manager = this.manager;
    if (manager.areDistinct(first.root.owner, second.root.owner)) return true;
    const tmp = this.isDiseqTmp;
    if (tmp === -1 || manager.sorts[manager.getArg(tmp, 0)] !== manager.sorts[first.owner]) {
      if (tmp !== -1) manager.decRef(tmp);
      this.isDiseqTmp = manager.mkEq(first.owner, second.owner);
      manager.incRef(this.isDiseqTmp);
    }
    const found = this.cgTable.findFor(OP_EQ, [first.id, second.id], true);
    if (found === -1) return false;
    const root = this.enodeStore.nodes[found].root;
    if (root === this.trueEnode) return false;
    return (
      root === this.falseEnode ||
      (this.isRelevant(root.owner) && this.getAssignmentOfExpr(root.owner) === L_FALSE)
    );
  }

  enodesOf(decl: number) {
    return this.decl2enodes.get(decl) ?? NO_ENODES;
  }

  getLiteral(expr: number): Literal {
    const manager = this.manager;
    if (manager.isNot(expr)) return negate(this.getLiteral(manager.getArg(expr, 0)));
    if (expr === manager.trueExpr) return this.trueLiteral;
    if (expr === manager.falseExpr) return this.falseLiteral;
    return mkLiteral(this.getBoolVar(expr));
  }

  private getAssignmentOfExpr(expr: number) {
    return this.assignment[mkLiteral(this.getBoolVar(expr))];
  }

  findAssignment(expr: number) {
    const manager = this.manager;
    if (manager.isNot(expr)) {
      const arg = manager.getArg(expr, 0);
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
    return mkLiteral(boolVar, this.assignment[mkLiteral(boolVar)] === L_FALSE);
  }

  isRelevant(expr: number) {
    return this.relevancy.isRelevant(expr);
  }

  // context::mark_as_relevant, which propagates the relevancy at once.
  markAsRelevant(expr: number) {
    this.relevancy.markAsRelevant(expr);
    this.relevancy.propagate();
  }

  markLiteralAsRelevant(literal: Literal) {
    this.markAsRelevant(this.boolVar2Expr[getVar(literal)]);
  }

  isInconsistent() {
    return this.conflict !== null;
  }

  // get_generation: the generation of the congruence root. Equalities have generation 0, since
  // patterns have no equalities.
  getGeneration(node: Enode) {
    return node.isEq ? 0 : this.getCgRoot(node).generation;
  }

  // get_cg_root: a node's cg can be stale, so a node that is not a congruence root looks the root up.
  private getCgRoot(node: Enode) {
    if (!node.usesCgTable() || node.isCgr()) return node;
    const found = this.cgTable.findCongruent(node.id);
    return found === -1 ? node : this.enodeStore.nodes[found];
  }

  private setGeneration(node: Enode, generation: number) {
    if (!node.isEq) this.getCgRoot(node).generation = generation;
  }

  private undoMergeCgcGenerations(
    first: Enode,
    firstGeneration: number,
    second: Enode,
    secondGeneration: number,
  ) {
    this.setGeneration(first, firstGeneration);
    this.setGeneration(second, secondGeneration);
    // apply_sticky_updates: a lowered generation outlives the merge that it was made under. Only the
    // updates of the two nodes' declarations can be congruent to them, and a node with an update
    // uses the congruence table, so it has arguments and is no equality.
    this.applyStickyUpdates(first, firstGeneration, second, secondGeneration);
    if (second.decl !== first.decl) this.applyStickyUpdates(second, secondGeneration, null, 0);
  }

  private applyStickyUpdates(
    first: Enode,
    firstGeneration: number,
    second: Enode | null,
    secondGeneration: number,
  ) {
    const group = this.stickyGenerations.getGroup(first.decl);
    if (group === undefined) return;
    const firstRoot = first.getArg(0).root;
    const secondRoot = second !== null && second.decl === first.decl ? second.getArg(0).root : null;
    for (let index = 0; index < group.nodes.length; index++) {
      const node = group.nodes[index];
      if (node === null) continue;
      const generation = group.generations[index];
      const root = node.getArg(0).root;
      if (
        generation < firstGeneration &&
        root === firstRoot &&
        isCongruent(this.enodeStore, node.id, first.id)
      )
        this.setGeneration(first, generation);
      else if (
        second !== null &&
        generation < secondGeneration &&
        root === secondRoot &&
        isCongruent(this.enodeStore, node.id, second.id)
      )
        this.setGeneration(second, generation);
    }
  }

  // Boolean variables and enodes.

  // mk_bool_var: m_b_internalized_stack holds a reference to the expression until the variable is
  // deleted.
  mkBoolVar(expr: number) {
    const boolVar = toBoolVar(this.numBoolVars++);
    const literal = mkLiteral(boolVar);
    this.manager.incRef(expr);
    this.setExprBoolVar(expr, boolVar);
    this.boolVar2Expr[boolVar] = expr;
    if (2 * boolVar + 1 >= this.boolVarData.length) {
      const grown = new Int32Array(2 * this.boolVarData.length);
      grown.set(this.boolVarData);
      this.boolVarData = grown;
    }
    this.boolVarData[2 * boolVar] = 0;
    this.boolVarData[2 * boolVar + 1] = this.scopeLevel;
    this.justifications[boolVar] = null;
    this.activity[boolVar] = this.isSearching ? -((this.getRandomValue() % 1000) / 1000) : 0;
    this.assignment[literal] = L_UNDEF;
    this.assignment[literal + 1] = L_UNDEF;
    this.resetWatches(literal);
    this.resetWatches(literal + 1);
    this.caseSplitQueue.mkVar(boolVar);
    this.trailKinds.push(UNDO_MK_BOOL_VAR);
    return boolVar;
  }

  // The arrays keep the deleted variable's entries, which mkBoolVar overwrites. Those that hold
  // objects are cleared, so the objects can be collected.
  private undoMkBoolVar() {
    const boolVar = toBoolVar(--this.numBoolVars);
    const expr = this.boolVar2Expr[boolVar];
    this.caseSplitQueue.delVar(boolVar);
    if (this.hasBoolVarFlag(boolVar, BV_QUANTIFIER)) this.qmanager.del(expr);
    this.exprToBoolVar[expr] = -1;
    this.justifications[boolVar] = null;
    this.manager.decRef(expr);
  }

  // The level of the variable's assignment.
  getLevel(boolVar: number) {
    return this.boolVarData[2 * boolVar] & LEVEL_MASK;
  }

  protected setLevel(boolVar: number, level: number) {
    const index = 2 * boolVar;
    this.boolVarData[index] = (this.boolVarData[index] & ~LEVEL_MASK) | level;
  }

  // The scope level at which the variable was internalized.
  getInternLevel(boolVar: number) {
    return this.boolVarData[2 * boolVar + 1];
  }

  protected hasBoolVarFlag(boolVar: number, flag: number) {
    return (this.boolVarData[2 * boolVar] & flag) !== 0;
  }

  protected setBoolVarFlag(boolVar: number, flag: number, value: boolean) {
    const index = 2 * boolVar;
    this.boolVarData[index] = value
      ? this.boolVarData[index] | flag
      : this.boolVarData[index] & ~flag;
  }

  isMarked(boolVar: number) {
    return this.hasBoolVarFlag(boolVar, BV_MARK);
  }

  setMark(boolVar: number, value: boolean) {
    this.setBoolVarFlag(boolVar, BV_MARK, value);
  }

  // watch_list::reset: a new variable's lists keep the room of a deleted one's. Assigning undefined to
  // a literal past the end keeps the arrays without holes.
  private resetWatches(literal: number) {
    const list = this.watches[literal];
    if (list === undefined) this.watches[literal] = undefined;
    else shrink(list, 0);
    const binary = this.binaryWatches[literal];
    if (binary === undefined) this.binaryWatches[literal] = undefined;
    else shrink(binary, 0);
  }

  protected isAtom(boolVar: BoolVar) {
    return this.hasBoolVarFlag(boolVar, BV_EQ | BV_ENODE | BV_THEORY | BV_QUANTIFIER);
  }

  setVarTheory(boolVar: BoolVar) {
    if (this.scopeLevel > this.getInternLevel(boolVar)) {
      this.trailInts.push(boolVar);
      this.trailKinds.push(UNDO_VAR_THEORY);
    }
    this.setBoolVarFlag(boolVar, BV_THEORY, true);
  }

  setTrueFirstFlag(boolVar: BoolVar) {
    this.trailInts.push(boolVar);
    this.trailKinds.push(UNDO_TRUE_FIRST);
    this.setBoolVarFlag(boolVar, BV_TRUE_FIRST, true);
  }

  isTrueFirst(boolVar: BoolVar) {
    return this.hasBoolVarFlag(boolVar, BV_TRUE_FIRST);
  }

  mkEnode(expr: number, isSuppressingArgs: boolean, isMergeTf: boolean, isCgcEnabled: boolean) {
    const manager = this.manager;
    const generation = this.cachedGeneration.get(expr) ?? this.generation;
    const numArgs = isSuppressingArgs ? 0 : manager.getNumArgs(expr);
    const moreArgs: Enode[] = numArgs > 2 ? [] : NO_ENODES;
    for (let index = 2; index < numArgs; index++) moreArgs.push(this.getArgEnode(expr, index));
    const isEq = !isSuppressingArgs && manager.getOp(expr) === OP_EQ;
    const node = new Enode(
      this.enodeStore,
      expr,
      manager.decls[expr],
      numArgs,
      numArgs > 0 ? this.getArgEnode(expr, 0) : null,
      numArgs > 1 ? this.getArgEnode(expr, 1) : null,
      moreArgs,
      generation,
      isEq,
      manager.sorts[expr] === SORT_BOOL,
      isMergeTf,
      isCgcEnabled,
      this.scopeLevel,
    );
    for (let index = 0; index < numArgs; index++) node.getArg(index).root.addParent(node);
    if (manager.isUniqueValue(expr)) node.isInterpreted = true;
    setAt(this.exprToEnode, expr, node);
    // m_e_internalized_stack holds a reference to the expression until the enode is deleted.
    manager.incRef(expr);
    this.trailKinds.push(UNDO_MK_ENODE);
    if (numArgs > 0) {
      if (node.isTrueEq()) {
        this.assign(
          mkLiteral(this.getBoolVar(expr)),
          new EqPropagationJustification(node.getArg(0), node.getArg(1)),
        );
        this.pushEq(node, this.trueEnode, AXIOM_EQ_JUSTIFICATION);
      } else if (isCgcEnabled) {
        const congruent = this.enodeStore.nodes[this.cgTable.insert(node.id)];
        if (congruent !== node) {
          node.cg = congruent;
          if (!isEq) this.mergeCgcGenerations(node, generation, congruent);
          this.pushEq(
            node,
            congruent,
            getCongruenceJustification(this.enodeStore, node.id, congruent.id),
          );
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

  // The enode of an argument of expr, which is internalized before expr.
  private getArgEnode(expr: number, index: number) {
    const node = this.exprToEnode[this.manager.getArg(expr, index)];
    if (node === undefined) throw new SmtInvariantError("an argument was not internalized");
    return node;
  }

  private undoMkEnode() {
    const nodes = this.enodeStore.nodes;
    const node = nodes[nodes.length - 1];
    if (node === undefined) return;
    this.exprToEnode[node.owner] = undefined;
    if (node.isCgr() && node.usesCgTable()) this.cgTable.erase(node.id);
    if (node.numArgs > 0 && !node.isEq) this.decl2enodes.get(node.decl)?.pop();
    for (let index = 0; index < node.numArgs; index++) node.getArg(index).root.popParent();
    this.manager.decRef(node.owner);
    this.stickyGenerations.delete(node);
    // The node leaves the stack last, since its data are found through its place there.
    this.enodeStore.pop();
  }

  protected mergeCgcGenerations(first: Enode, firstGeneration: number, second: Enode) {
    this.trailInts.push(firstGeneration, second.generation);
    this.trailNodes.push(first, second);
    this.trailKinds.push(UNDO_CGC_GENERATIONS);
    if (firstGeneration < second.generation) second.generation = firstGeneration;
  }

  private setMergeTf(node: Enode, boolVar: BoolVar, isNewVar: boolean) {
    if (node.isMergeTf) return;
    if (!isNewVar) {
      this.trailNodes.push(node);
      this.trailKinds.push(UNDO_MERGE_TF);
    }
    node.isMergeTf = true;
    const value = this.assignment[mkLiteral(boolVar)];
    if (value === L_TRUE && node.root !== this.trueEnode.root)
      this.pushEq(node, this.trueEnode, { kind: "equation", literal: mkLiteral(boolVar) });
    else if (value === L_FALSE && node.root !== this.falseEnode.root)
      this.pushEq(node, this.falseEnode, { kind: "equation", literal: mkLiteral(boolVar, true) });
  }

  private setEnodeFlag(boolVar: BoolVar, isNewVar: boolean) {
    if (this.hasBoolVarFlag(boolVar, BV_ENODE)) return;
    if (!isNewVar) {
      this.trailInts.push(boolVar);
      this.trailKinds.push(UNDO_ENODE_FLAG);
    }
    this.setBoolVarFlag(boolVar, BV_ENODE, true);
  }

  // update_generation: a node of a congruence class records its lower generation as sticky, so
  // undoing a merge of the class keeps it.
  private updateGeneration(node: Enode) {
    if (node.isEq) return;
    if (this.generation > 0 && this.generation < this.getGeneration(node)) {
      this.setGeneration(node, this.generation);
      if (node.usesCgTable()) this.stickyGenerations.set(node, this.generation);
    }
  }

  // Internalization.

  private isGate(expr: number) {
    const op = this.manager.getOp(expr);
    if (op === OP_AND || op === OP_OR || op === OP_ITE) return true;
    return op === OP_EQ && this.manager.isBool(this.manager.getArg(expr, 0));
  }

  // should_internalize_rec: a term, or a Boolean application of the basic family or an
  // uninterpreted declaration.
  private shouldInternalizeRec(expr: number) {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_APP || manager.sorts[expr] !== SORT_BOOL) return true;
    const family = manager.getFamily(expr);
    return family === FAMILY_BASIC || family === FAMILY_USER;
  }

  // internalize_deep: internalizes the subterms of a deep expression bottom up, in the order of a
  // topological sort, so the recursion of internalizeRec stays shallow.
  private internalizeDeep(expr: number) {
    if (
      this.isEInternalized(expr) ||
      this.manager.depths[expr] <= DEEP_EXPR_THRESHOLD ||
      !this.shouldInternalizeRec(expr)
    )
      return;
    const manager = this.manager;
    // The color of each expression in a gate context and outside one: white while unvisited, grey
    // while its children are visited, and black once it is sorted.
    const colors = new Map<number, number>();
    const getColor = (current: number, isGate: boolean) =>
      colors.get(current * 2 + (isGate ? 1 : 0)) ?? WHITE;
    const todo: [number, boolean][] = [[expr, true]];
    const sorted: [number, boolean][] = [];
    const visitChild = (child: number, isGate: boolean) => {
      if (getColor(child, isGate) === WHITE) todo.push([child, isGate]);
    };
    // ts_visit_children, which Z3 calls again on grey expressions only in its assertions.
    const visitChildren = (current: number) => {
      if (manager.kinds[current] === KIND_QUANTIFIER || !this.shouldInternalizeRec(current)) return;
      const node = this.exprToEnode[current];
      if (node !== undefined) this.updateGeneration(node);
      if (manager.sorts[current] === SORT_BOOL ? this.isBInternalized(current) : node !== undefined)
        return;
      if (manager.getOp(current) === OP_ITE && manager.sorts[current] !== SORT_BOOL) {
        visitChild(manager.getArg(current, 0), true);
        visitChild(manager.getArg(current, 1), false);
        visitChild(manager.getArg(current, 2), false);
        return;
      }
      const isNewGate =
        manager.sorts[current] === SORT_BOOL && (this.isGate(current) || manager.isNot(current));
      for (let index = manager.getNumArgs(current) - 1; index >= 0; index--)
        visitChild(manager.getArg(current, index), isNewGate);
    };
    while (todo.length > 0) {
      const top = todo[todo.length - 1];
      const color = getColor(top[0], top[1]);
      if (color === BLACK) todo.pop();
      else if (color === WHITE) {
        colors.set(top[0] * 2 + (top[1] ? 1 : 0), GREY);
        visitChildren(top[0]);
      } else {
        colors.set(top[0] * 2 + (top[1] ? 1 : 0), BLACK);
        if (top[0] !== expr && !manager.isNot(top[0]) && this.shouldInternalizeRec(top[0]))
          sorted.push(top);
      }
    }
    for (const entry of sorted) this.internalizeRec(entry[0], entry[1]);
  }

  internalizeAssertion(expr: number, generation: number) {
    const savedGeneration = this.generation;
    this.generation = generation;
    this.internalizeDeep(expr);
    const manager = this.manager;
    if (this.isGate(expr)) {
      switch (manager.getOp(expr)) {
        case OP_AND:
          for (let index = 0; index < manager.getNumArgs(expr); index++) {
            const arg = manager.getArg(expr, index);
            this.internalizeRec(arg, true);
            this.mkClause([this.getLiteral(arg)], null, CLS_AUX);
          }
          break;
        case OP_OR: {
          for (let index = 0; index < manager.getNumArgs(expr); index++) {
            const arg = manager.getArg(expr, index);
            this.internalizeRec(arg, true);
          }
          const literals = this.gateBuffer;
          shrink(literals, 0);
          for (let index = 0; index < manager.getNumArgs(expr); index++)
            literals.push(this.getLiteral(manager.getArg(expr, index)));
          this.mkClause(literals, null, CLS_AUX);
          this.addOrRelWatches(expr);
          break;
        }
        case OP_EQ: {
          this.internalizeRec(manager.getArg(expr, 0), true);
          this.internalizeRec(manager.getArg(expr, 1), true);
          const first = this.getLiteral(manager.getArg(expr, 0));
          const second = this.getLiteral(manager.getArg(expr, 1));
          this.mkClause([first, negate(second)], null, CLS_AUX);
          this.mkClause([negate(first), second], null, CLS_AUX);
          break;
        }
        default: {
          for (let index = 0; index < manager.getNumArgs(expr); index++) {
            const arg = manager.getArg(expr, index);
            this.internalizeRec(arg, true);
          }
          const condition = this.getLiteral(manager.getArg(expr, 0));
          this.mkClause(
            [negate(condition), this.getLiteral(manager.getArg(expr, 1))],
            null,
            CLS_AUX,
          );
          this.mkClause([condition, this.getLiteral(manager.getArg(expr, 2))], null, CLS_AUX);
          this.addIteRelWatches(expr);
        }
      }
      this.markAsRelevant(expr);
    } else {
      this.internalizeRec(expr, true);
      const literal = this.getLiteral(expr);
      if (literal === this.falseLiteral) this.setConflict("axiom", null);
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
    this.internalizeDeep(expr);
    this.internalizeRec(expr, isGateContext);
    this.generation = savedGeneration;
  }

  private internalizeRec(expr: number, isGateContext: boolean) {
    const manager = this.manager;
    if (manager.sorts[expr] === SORT_BOOL) this.internalizeFormula(expr, isGateContext);
    else this.internalizeTerm(expr);
  }

  private internalizeFormula(expr: number, isGateContext: boolean) {
    const manager = this.manager;
    if (expr === manager.trueExpr || expr === manager.falseExpr) return;
    if (manager.isNot(expr) && isGateContext) {
      this.internalizeRec(manager.getArg(expr, 0), true);
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
          if (this.assignment[mkLiteral(boolVar)] !== L_UNDEF) this.propagateBoolVarEnode(boolVar);
        }
      }
      return;
    }
    const op = manager.getOp(expr);
    if (op === OP_EQ && !manager.isBool(manager.getArg(expr, 0)))
      this.internalizeEq(expr, isGateContext);
    else if (manager.kinds[expr] === KIND_APP && this.internalizeTheoryAtom(expr, isGateContext))
      return;
    else if (manager.kinds[expr] === KIND_QUANTIFIER) this.internalizeQuantifier(expr);
    else this.internalizeFormulaCore(expr, isGateContext);
  }

  private internalizeEq(expr: number, isGateContext: boolean) {
    this.internalizeFormulaCore(expr, isGateContext);
    const boolVar = this.getBoolVar(expr);
    this.setBoolVarFlag(boolVar, BV_EQ, true);
    if (this.manager.sorts[this.manager.getArg(expr, 0)] !== SORT_BOOL && this.isArithSort(expr))
      this.theory.internalizeEqEh(expr);
  }

  private isArithSort(eq: number) {
    return isArithSort(this.manager.sorts[this.manager.getArg(eq, 0)]);
  }

  private internalizeTheoryAtom(expr: number, isGateContext: boolean) {
    if (this.manager.getFamily(expr) !== FAMILY_ARITH || !this.theory.internalizeAtom(expr))
      return false;
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
      if (this.assignment[mkLiteral(boolVar)] !== L_UNDEF) this.propagateBoolVarEnode(boolVar);
    }
    return true;
  }

  private internalizeQuantifier(expr: number) {
    const boolVar = this.mkBoolVar(expr);
    const generation = this.cachedGeneration.get(expr) ?? this.generation;
    this.setBoolVarFlag(boolVar, BV_QUANTIFIER, true);
    this.qmanager.add(expr, generation);
  }

  protected internalizeFormulaCore(expr: number, isGateContext: boolean) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    const isGateNode = this.isGate(expr) || op === OP_NOT;
    for (let index = 0; index < manager.getNumArgs(expr); index++) {
      const arg = manager.getArg(expr, index);
      this.internalizeRec(arg, isGateNode);
    }
    const isNewVar = !this.isBInternalized(expr);
    const boolVar = isNewVar ? this.mkBoolVar(expr) : this.getBoolVar(expr);
    const node = this.exprToEnode[expr];
    if (node === undefined && (!isGateContext || (!isGateNode && manager.getNumArgs(expr) > 0))) {
      this.mkEnode(expr, isGateNode, !isGateContext, true);
      this.setEnodeFlag(boolVar, isNewVar);
    } else if (!isGateContext && node !== undefined) this.setMergeTf(node, boolVar, isNewVar);
    if (!isNewVar || manager.getFamily(expr) !== FAMILY_BASIC) return;
    const literal = mkLiteral(boolVar);
    switch (op) {
      case OP_NOT: {
        const child = this.getLiteral(manager.getArg(expr, 0));
        this.mkGateClause(negate(literal), negate(child));
        this.mkGateClause(literal, child);
        break;
      }
      case OP_AND: {
        const buffer = this.gateBuffer;
        shrink(buffer, 0);
        buffer.push(literal);
        for (let index = 0; index < manager.getNumArgs(expr); index++) {
          const arg = manager.getArg(expr, index);
          const argLiteral = this.getLiteral(arg);
          this.mkGateClause(negate(literal), argLiteral);
          buffer.push(negate(argLiteral));
        }
        this.mkClause(buffer, null, CLS_AUX);
        this.addAndRelWatches(expr);
        break;
      }
      case OP_OR: {
        const buffer = this.gateBuffer;
        shrink(buffer, 0);
        buffer.push(negate(literal));
        for (let index = 0; index < manager.getNumArgs(expr); index++) {
          const arg = manager.getArg(expr, index);
          const argLiteral = this.getLiteral(arg);
          this.mkGateClause(literal, negate(argLiteral));
          buffer.push(argLiteral);
        }
        this.mkClause(buffer, null, CLS_AUX);
        this.addOrRelWatches(expr);
        break;
      }
      case OP_IMPLIES: {
        const first = this.getLiteral(manager.getArg(expr, 0));
        const second = this.getLiteral(manager.getArg(expr, 1));
        this.mkGateClause(literal, first);
        this.mkGateClause(literal, negate(second));
        this.mkGateClause(negate(literal), negate(first), second);
        break;
      }
      case OP_EQ:
      case OP_XOR: {
        if (op === OP_EQ && !manager.isBool(manager.getArg(expr, 0))) break;
        const gate = op === OP_XOR ? negate(literal) : literal;
        const first = this.getLiteral(manager.getArg(expr, 0));
        const second = this.getLiteral(manager.getArg(expr, 1));
        this.mkGateClause(negate(gate), first, negate(second));
        this.mkGateClause(negate(gate), negate(first), second);
        this.mkGateClause(gate, first, second);
        this.mkGateClause(gate, negate(first), negate(second));
        break;
      }
      case OP_ITE: {
        const condition = this.getLiteral(manager.getArg(expr, 0));
        const thenLiteral = this.getLiteral(manager.getArg(expr, 1));
        const elseLiteral = this.getLiteral(manager.getArg(expr, 2));
        this.mkGateClause(negate(literal), negate(condition), thenLiteral);
        this.mkGateClause(negate(literal), condition, elseLiteral);
        this.mkGateClause(literal, negate(condition), negate(thenLiteral));
        this.mkGateClause(literal, condition, negate(elseLiteral));
        this.addIteRelWatches(expr);
        break;
      }
      default:
        break;
    }
  }

  // mk_gate_clause with two or three literals.
  private mkGateClause(first: Literal, second: Literal, third?: Literal) {
    const literals = this.gateLiterals;
    shrink(literals, 0);
    literals.push(first, second);
    if (third !== undefined) literals.push(third);
    this.mkClause(literals, null, CLS_AUX);
  }

  internalizeTerm(expr: number) {
    const manager = this.manager;
    const existing = this.exprToEnode[expr];
    if (existing !== undefined) {
      this.updateGeneration(existing);
      // The theory may have made a nested term, such as the 2 of (* 2 x), without a variable, which
      // it needs once the term occurs elsewhere.
      if (manager.getFamily(expr) === FAMILY_ARITH && !this.theory.isAttachedToVar(existing)) {
        this.theory.internalizeTerm(expr);
      }
      return;
    }
    if (manager.getOp(expr) === OP_ITE) {
      this.internalizeIteTerm(expr);
      return;
    }
    if (manager.getFamily(expr) === FAMILY_ARITH && this.theory.internalizeTerm(expr)) return;
    for (let index = 0; index < manager.getNumArgs(expr); index++) {
      const arg = manager.getArg(expr, index);
      this.internalizeRec(arg, false);
    }
    if (this.exprToEnode[expr] !== undefined) return;
    this.mkEnode(expr, false, false, true);
  }

  // mk_eq_atom: the side with the smaller id goes first.
  mkEqAtom(lhs: number, rhs: number) {
    const ids = this.manager.ids;
    return ids[lhs] < ids[rhs] ? this.manager.mkEq(lhs, rhs) : this.manager.mkEq(rhs, lhs);
  }

  private internalizeIteTerm(expr: number) {
    const thenEq = this.mkEqAtom(expr, this.manager.getArg(expr, 1));
    const elseEq = this.mkEqAtom(expr, this.manager.getArg(expr, 2));
    this.mkEnode(expr, true, false, false);
    this.internalizeRec(this.manager.getArg(expr, 0), true);
    this.internalizeRec(this.manager.getArg(expr, 1), false);
    this.internalizeRec(this.manager.getArg(expr, 2), false);
    this.internalizeRec(thenEq, true);
    this.internalizeRec(elseEq, true);
    const condition = this.getLiteral(this.manager.getArg(expr, 0));
    this.mkClause([negate(condition), this.getLiteral(thenEq)], null, CLS_AUX);
    this.mkClause([condition, this.getLiteral(elseEq)], null, CLS_AUX);
    // ite_term_relevancy_eh: it marks the terms for the propagator, which propagates them later.
    const handler = () => {
      if (!this.isRelevant(expr)) return;
      this.relevancy.markAsRelevant(this.manager.getArg(expr, 0));
      const value = this.findAssignment(this.manager.getArg(expr, 0));
      if (value < 0) this.relevancy.markAsRelevant(elseEq);
      else if (value > 0) this.relevancy.markAsRelevant(thenEq);
    };
    this.addRelWatch(condition, handler);
    this.addRelWatch(negate(condition), handler);
    this.relevancy.addHandler(expr, handler);
  }

  private addRelWatch(literal: Literal, handler: RelevancyHandler) {
    this.relevancy.addWatch(this.boolVar2Expr[getVar(literal)], !isNegated(literal), handler);
  }

  private addAndRelWatches(expr: number) {
    const handler = mkPropagation(PROPAGATE_AND, expr);
    for (let index = 0; index < this.manager.getNumArgs(expr); index++) {
      const arg = this.manager.getArg(expr, index);
      const literal = this.getLiteral(arg);
      if (literal > 1) this.addRelWatch(negate(literal), handler);
    }
  }

  private addOrRelWatches(expr: number) {
    const handler = mkPropagation(PROPAGATE_OR, expr);
    for (let index = 0; index < this.manager.getNumArgs(expr); index++) {
      const arg = this.manager.getArg(expr, index);
      const literal = this.getLiteral(arg);
      if (literal > 1) this.addRelWatch(literal, handler);
    }
  }

  private addIteRelWatches(expr: number) {
    const handler = mkPropagation(PROPAGATE_ITE, expr);
    const literal = this.getLiteral(this.manager.getArg(expr, 0));
    if (literal <= 1) return;
    this.addRelWatch(literal, handler);
    this.addRelWatch(negate(literal), handler);
  }

  // Clauses.

  mkThAxiom(literals: Literal[]) {
    this.mkClause(literals, null, CLS_TH_AXIOM);
  }

  private simplifyAuxClauseLiterals(literals: Literal[], removed: Literal[]) {
    sortNumbers(literals);
    let previous: Literal | null = null;
    let kept = 0;
    for (const literal of literals) {
      const value = this.assignment[literal];
      if (value === L_FALSE) {
        if (literal !== previous) {
          previous = literal;
          removed.push(negate(literal));
        }
      } else if (value === L_UNDEF) {
        if (previous !== null && literal === negate(previous)) return false;
        if (literal !== previous) {
          previous = literal;
          literals[kept++] = literal;
        }
      } else return false;
    }
    shrink(literals, kept);
    return true;
  }

  // simplify_aux_lemma_literals: unlike an aux clause, a theory lemma keeps its false literals, so it
  // needs no unit resolution justification.
  private simplifyAuxLemmaLiterals(literals: Literal[]) {
    sortNumbers(literals);
    let previous: Literal | null = null;
    let kept = 0;
    for (const literal of literals) {
      if (this.getLevel(getVar(literal)) <= this.baseLevel && this.assignment[literal] === L_TRUE)
        return false;
      if (previous !== null && literal === negate(previous)) return false;
      if (literal !== previous) {
        previous = literal;
        literals[kept++] = literal;
      }
    }
    shrink(literals, kept);
    return true;
  }

  protected selectWatchLiteral(clause: Clause, startingAt: number) {
    const clauses = this.clauses;
    let minTrue = -1;
    let maxFalse = -1;
    let unknown = -1;
    for (let index = startingAt; index < clauses.getNumLiterals(clause); index++) {
      const literal = clauses.getLiteral(clause, index);
      const value = this.assignment[literal];
      if (value === L_FALSE) {
        if (
          maxFalse === -1 ||
          this.getLevel(getVar(literal)) >
            this.getLevel(getVar(clauses.getLiteral(clause, maxFalse)))
        )
          maxFalse = index;
      } else if (value === L_UNDEF) unknown = index;
      else if (
        minTrue === -1 ||
        this.getLevel(getVar(literal)) < this.getLevel(getVar(clauses.getLiteral(clause, minTrue)))
      )
        minTrue = index;
    }
    if (minTrue !== -1) return minTrue;
    if (unknown !== -1) return unknown;
    return maxFalse;
  }

  private selectLearnedWatchLiteral(clause: Clause) {
    const clauses = this.clauses;
    let maxFalse = -1;
    let maxLevel = 0;
    for (let index = 1; index < clauses.getNumLiterals(clause); index++) {
      const literal = clauses.getLiteral(clause, index);
      const level =
        this.assignment[literal] === L_FALSE ? this.getLevel(getVar(literal)) : this.scopeLevel;
      if (maxFalse === -1 || level > maxLevel) {
        maxFalse = index;
        maxLevel = level;
      }
    }
    return maxFalse;
  }

  protected addWatchLiteral(clause: Clause, index: number) {
    this.addWatch(negate(this.clauses.getLiteral(clause, index)), clause);
  }

  // A literal's first watch gets a list of its own size, since growing an empty list allocates room
  // for many.
  protected addWatch(literal: Literal, clause: Clause) {
    const list = this.watches[literal];
    if (list === undefined) this.watches[literal] = [clause];
    else list.push(clause);
  }

  protected removeWatchLiteral(clause: Clause, index: number) {
    const list = this.watches[negate(this.clauses.getLiteral(clause, index))];
    if (list === undefined) return;
    // A clause is deleted when its scope is popped, so it is most often near the end.
    const position = list.lastIndexOf(clause);
    if (position === -1) return;
    list.copyWithin(position, position + 1);
    list.pop();
  }

  protected getBinJustification(literal: Literal) {
    const existing = this.binJustifications[literal];
    if (existing !== undefined) return existing;
    const created = new BinJustification(literal);
    this.binJustifications[literal] = created;
    return created;
  }

  // use_binary_clause_opt: a clause of two literals at the base level of the first scope, over
  // variables created there, becomes a pair of binary watches. With relevancy, lemmas stay clauses so
  // their propagations can mark literals as relevant.
  private isUsingBinaryClauseOpt(first: Literal, second: Literal, isLemma: boolean) {
    if (isLemma && this.relevancy.isEnabled) return false;
    if (this.baseLevel > 0) return false;
    if (!isLemma && this.scopeLevel > 0) return false;
    return this.getInternLevel(getVar(first)) === 0 && this.getInternLevel(getVar(second)) === 0;
  }

  private getMaxIscopeLevel(literals: Literal[]) {
    let result = 0;
    for (const literal of literals) result = Math.max(result, this.getInternLevel(getVar(literal)));
    return result;
  }

  private markForReinit(clause: Clause, level: number, isReinternalizingAtoms: boolean) {
    this.clauses.setReinit(clause, true);
    this.clauses.setReinternalizeAtoms(clause, isReinternalizingAtoms);
    while (this.clausesToReinit.length <= level) this.clausesToReinit.push([]);
    this.clausesToReinit[level].push(clause);
  }

  // mk_clause: like Z3's, it simplifies the literals in the array it is given.
  mkClause(
    input: Literal[],
    inputJustification: Justification | null,
    kind: number,
    delEh: (() => void) | null = null,
  ) {
    const literals = input;
    let justification = inputJustification;
    if (kind === CLS_TH_LEMMA) {
      if (!this.simplifyAuxLemmaLiterals(literals)) return null;
    } else if (kind !== CLS_LEARNED) {
      const removed = this.removedLiterals;
      shrink(removed, 0);
      if (!this.simplifyAuxClauseLiterals(literals, removed)) return null;
      if (removed.length > 0)
        justification = new UnitResolutionJustification(justification, removed.slice());
    }
    if (literals.length === 0) {
      this.setConflict(justification ?? "axiom", null);
      return null;
    }
    if (literals.length === 1) {
      this.assign(literals[0], justification ?? "axiom");
      return null;
    }
    const isLemma = kind === CLS_LEARNED || kind === CLS_TH_LEMMA;
    if (literals.length === 2 && this.isUsingBinaryClauseOpt(literals[0], literals[1], isLemma)) {
      const first = literals[0];
      const second = literals[1];
      (this.binaryWatches[negate(first)] ??= []).push(second);
      (this.binaryWatches[negate(second)] ??= []).push(first);
      if (this.assignment[first] === L_FALSE)
        this.assign(second, this.getBinJustification(negate(first)));
      else if (this.assignment[second] === L_FALSE)
        this.assign(first, this.getBinJustification(negate(second)));
      return null;
    }
    const iscopeLevel = isLemma ? this.getMaxIscopeLevel(literals) : 0;
    const isSavingAtoms = isLemma && iscopeLevel > this.baseLevel;
    const atoms = isSavingAtoms ? this.atomBuffer : null;
    if (atoms !== null) {
      shrink(atoms, 0);
      for (const literal of literals) {
        const atom = this.boolVar2Expr[getVar(literal)];
        atoms.push(atom);
        this.manager.incRef(atom);
      }
    }
    const clauses = this.clauses;
    const clause = clauses.mk(literals, kind, justification, delEh, atoms);
    if (isLemma) {
      if (kind === CLS_LEARNED)
        clauses.swapLiterals(clause, 1, this.selectLearnedWatchLiteral(clause));
      else {
        clauses.swapLiterals(clause, 0, this.selectWatchLiteral(clause, 0));
        clauses.swapLiterals(clause, 1, this.selectWatchLiteral(clause, 1));
      }
      this.lemmas.push(clause);
      this.addWatchLiteral(clause, 0);
      this.addWatchLiteral(clause, 1);
      const first = clauses.getLiteral(clause, 0);
      const second = clauses.getLiteral(clause, 1);
      // A theory lemma that conflicts or propagates above the base level is checked again when the
      // level is backtracked.
      const isPropagating =
        this.assignment[first] === L_FALSE || this.assignment[second] === L_FALSE;
      if (this.assignment[first] === L_FALSE) this.setConflict(clause, null);
      else if (this.assignment[second] === L_FALSE) this.assign(first, clause);
      const isReinit = kind === CLS_TH_LEMMA && isPropagating && this.scopeLevel > this.baseLevel;
      if (isSavingAtoms || isReinit)
        this.markForReinit(clause, isReinit ? this.scopeLevel : iscopeLevel, isSavingAtoms);
      return clause;
    }
    this.auxClauses.push(clause);
    this.addWatchLiteral(clause, 0);
    this.addWatchLiteral(clause, 1);
    if (this.assignment[literals[0]] === L_FALSE) this.setConflict(clause, null);
    else if (this.assignment[literals[1]] === L_FALSE) this.assign(literals[0], clause);
    return clause;
  }

  // del_clause. A clause in the reinit stack is only marked deleted, and reinitClauses frees it.
  protected deleteClause(clause: Clause) {
    const clauses = this.clauses;
    if (clauses.isDeleted(clause)) return;
    this.removeWatchLiteral(clause, 0);
    this.removeWatchLiteral(clause, 1);
    clauses.markAsDeleted(clause);
    clauses.getDelEh(clause)?.();
    if (clauses.isReinternalizeAtoms(clause)) this.releaseAtoms(clause);
    if (!clauses.isReinit(clause)) clauses.free(clause);
  }

  // release_atoms: the clause no longer holds its atoms.
  protected releaseAtoms(clause: Clause) {
    for (const atom of this.clauses.getAtoms(clause)) this.manager.decRef(atom);
    this.clauses.clearAtoms(clause);
  }

  private markWatch(literal: Literal) {
    if (this.watchMarks[literal] === 1) return;
    this.watchMarks[literal] = 1;
    this.watchedLiterals.push(literal);
  }

  // del_clauses: past 1,000 clauses, mark each deleted, filter each of their watch lists once, then
  // release their atoms, instead of searching a watch list per clause.
  protected deleteClauses(clauses: Clause[], oldSize: number) {
    if (clauses.length - oldSize <= 1000) {
      for (let index = clauses.length - 1; index >= oldSize; index--)
        this.deleteClause(clauses[index]);
      shrink(clauses, oldSize);
      return;
    }
    if (this.watchMarks.length < this.watches.length)
      this.watchMarks = new Uint8Array(Math.max(2 * this.watchMarks.length, this.watches.length));
    const watched = this.watchedLiterals;
    const store = this.clauses;
    for (let index = clauses.length - 1; index >= oldSize; index--) {
      const clause = clauses[index];
      if (!store.isDeleted(clause)) {
        store.markAsDeleted(clause);
        store.getDelEh(clause)?.();
      }
      this.markWatch(negate(store.getLiteral(clause, 0)));
      this.markWatch(negate(store.getLiteral(clause, 1)));
    }
    for (const literal of watched) {
      this.watchMarks[literal] = 0;
      const list = this.watches[literal];
      if (list === undefined) continue;
      let kept = 0;
      for (let index = 0; index < list.length; index++)
        if (!store.isDeleted(list[index])) list[kept++] = list[index];
      shrink(list, kept);
    }
    shrink(watched, 0);
    for (let index = clauses.length - 1; index >= oldSize; index--) {
      const clause = clauses[index];
      if (store.isReinternalizeAtoms(clause)) this.releaseAtoms(clause);
      if (!store.isReinit(clause)) store.free(clause);
    }
    shrink(clauses, oldSize);
  }
}
