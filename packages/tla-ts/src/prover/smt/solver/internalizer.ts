// z3-license.txt.
import { SmtInvariantError, SmtUnsupportedError } from "../../../errors";
import {
  AstManager,
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
import { RelevancyPropagator } from "./relevancy";
import { KERNEL_REWRITER_OPTIONS, Rewriter } from "./rewriter";
import { sortNumbers } from "./sort";
import type { Theory } from "./theory";
import { setAt, shrink } from "./array";
import { DEFAULT_CONFIG, IA_RANDOM, IA_RANDOM_WHEN_SEARCHING } from "./smt-setup";
import { StickyGenerations } from "./sticky-generations";

const DEEP_EXPR_THRESHOLD = 1024;
const WHITE = 0;
const GREY = 1;
const BLACK = 2;

const UNDO_CLOSURE = 0;
const UNDO_MK_BOOL_VAR = 1;
const UNDO_MK_ENODE = 2;
const UNDO_VAR_THEORY = 3;
const UNDO_TRUE_FIRST = 4;
const UNDO_CGC_GENERATIONS = 5;
const UNDO_MERGE_TF = 6;
const UNDO_ENODE_FLAG = 7;

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
  readonly cgTable = new CgTable();
  private stickyGenerations = new StickyGenerations();
  abstract getTheory(family: number): Theory | undefined;
  abstract readonly qmanager: DefaultQuantifierManager;

  numBoolVars = 0;
  boolVar2Expr: number[] = [];
  private boolVarData = new Int32Array(2048);
  private boolVarTheories: number[] = [];
  justifications: BJustification[] = [];
  activity: number[] = [];
  protected assignment: number[] = [];
  readonly clauses = new ClauseStore();
  protected watches: (Clause[] | undefined)[] = [];
  private watchMarks = new Uint8Array(1024);
  private removedLiterals: Literal[] = [];
  private gateBuffer: Literal[] = [];
  private gateLiterals: Literal[] = [];
  protected binaryWatches: (Literal[] | undefined)[] = [];
  private binJustifications: (BinJustification | undefined)[] = [];
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
  enodes: Enode[] = [];
  protected decl2enodes = new Map<number, Enode[]>();
  trueEnode: Enode;
  private isDiseqTmp = -1;
  falseEnode: Enode;
  protected generation = 0;
  protected cachedGeneration = new Map<number, number>();
  private randomSeed = 0;
  isSearching = false;
  config = DEFAULT_CONFIG;

  constructor(
    readonly manager: AstManager,
    isRelevancyEnabled: boolean,
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
      isRelevancyEnabled,
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

  findCongruent(decl: number, args: Enode[]) {
    return this.cgTable.findFor(decl, args, decl === OP_EQ);
  }

  isDiseq(first: Enode, second: Enode, isCheckingValues = true) {
    const manager = this.manager;
    if (isCheckingValues && manager.areDistinct(first.root.owner, second.root.owner)) return true;
    const tmp = this.isDiseqTmp;
    if (tmp === -1 || manager.sorts[manager.getArg(tmp, 0)] !== manager.sorts[first.owner]) {
      if (tmp !== -1) manager.decRef(tmp);
      this.isDiseqTmp = manager.mkEq(first.owner, second.owner);
      manager.incRef(this.isDiseqTmp);
    }
    const root = this.cgTable.findFor(OP_EQ, [first, second], true)?.root;
    if (root === undefined || root === this.trueEnode) return false;
    return (
      root === this.falseEnode ||
      (this.isRelevant(root.owner) && this.getAssignmentOfExpr(root.owner) === L_FALSE)
    );
  }

  enodesOf(decl: number) {
    return this.decl2enodes.get(decl) ?? [];
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
    if (expr === manager.falseExpr) return L_FALSE;
    if (this.isBInternalized(expr)) return this.getAssignmentOfExpr(expr);
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

  getGeneration(node: Enode) {
    return node.isEq ? 0 : this.getCgRoot(node).generation;
  }

  private getCgRoot(node: Enode) {
    if (!node.usesCgTable() || node.isCgr()) return node;
    return this.cgTable.findCongruent(node) ?? node;
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
      if (generation < firstGeneration && root === firstRoot && isCongruent(node, first))
        this.setGeneration(first, generation);
      else if (
        second !== null &&
        generation < secondGeneration &&
        root === secondRoot &&
        isCongruent(node, second)
      )
        this.setGeneration(second, generation);
    }
  }

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
    const initialActivity = this.config.randomInitialActivity;
    this.activity[boolVar] =
      initialActivity === IA_RANDOM ||
      (initialActivity === IA_RANDOM_WHEN_SEARCHING && this.isSearching)
        ? -((this.getRandomValue() % 1000) / 1000)
        : 0;
    this.assignment[literal] = L_UNDEF;
    this.assignment[literal + 1] = L_UNDEF;
    this.resetWatches(literal);
    this.resetWatches(literal + 1);
    this.caseSplitQueue.mkVar(boolVar);
    this.trailKinds.push(UNDO_MK_BOOL_VAR);
    return boolVar;
  }

  private undoMkBoolVar() {
    const boolVar = toBoolVar(--this.numBoolVars);
    const expr = this.boolVar2Expr[boolVar];
    this.caseSplitQueue.delVar(boolVar);
    if (this.hasBoolVarFlag(boolVar, BV_QUANTIFIER)) this.qmanager.del(expr);
    this.exprToBoolVar[expr] = -1;
    this.justifications[boolVar] = null;
    this.manager.decRef(expr);
  }

  getLevel(boolVar: number) {
    return this.boolVarData[2 * boolVar] & LEVEL_MASK;
  }

  protected setLevel(boolVar: number, level: number) {
    const index = 2 * boolVar;
    this.boolVarData[index] = (this.boolVarData[index] & ~LEVEL_MASK) | level;
  }

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

  private resetWatches(literal: number) {
    const list = this.watches[literal];
    // HACK: assigning undefined to a literal past the end keeps V8's arrays without holes.
    if (list === undefined) this.watches[literal] = undefined;
    else shrink(list, 0);
    const binary = this.binaryWatches[literal];
    if (binary === undefined) this.binaryWatches[literal] = undefined;
    else shrink(binary, 0);
  }

  protected isAtom(boolVar: BoolVar) {
    return this.hasBoolVarFlag(boolVar, BV_EQ | BV_ENODE | BV_THEORY | BV_QUANTIFIER);
  }

  getBoolVarTheory(boolVar: BoolVar) {
    return this.hasBoolVarFlag(boolVar, BV_THEORY) ? this.boolVarTheories[boolVar] : -1;
  }

  setVarTheory(boolVar: BoolVar, thId: number) {
    setAt(this.boolVarTheories, boolVar, thId);
    if (this.scopeLevel > this.getInternLevel(boolVar)) {
      this.trailInts.push(boolVar);
      this.trailKinds.push(UNDO_VAR_THEORY);
    }
    this.setBoolVarFlag(boolVar, BV_THEORY, true);
  }

  forcePhase(literal: Literal) {
    const boolVar = getVar(literal);
    this.setBoolVarFlag(boolVar, BV_PHASE_AVAILABLE, true);
    this.setBoolVarFlag(boolVar, BV_PHASE, !isNegated(literal));
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
    manager.incRef(expr);
    this.trailKinds.push(UNDO_MK_ENODE);
    this.enodes.push(node);
    if (numArgs > 0) {
      if (node.isTrueEq()) {
        this.assign(
          mkLiteral(this.getBoolVar(expr)),
          new EqPropagationJustification(node.getArg(0), node.getArg(1)),
        );
        this.pushEq(node, this.trueEnode, AXIOM_EQ_JUSTIFICATION);
      } else if (isCgcEnabled) {
        const congruent = this.cgTable.insert(node);
        if (congruent !== node) {
          node.cg = congruent;
          if (!isEq) this.mergeCgcGenerations(node, generation, congruent);
          this.pushEq(node, congruent, getCongruenceJustification(node, congruent));
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

  private getArgEnode(expr: number, index: number) {
    const node = this.exprToEnode[this.manager.getArg(expr, index)];
    if (node === undefined) throw new SmtInvariantError("an argument was not internalized");
    return node;
  }

  private undoMkEnode() {
    const node = this.enodes.pop();
    if (node === undefined) return;
    this.exprToEnode[node.owner] = undefined;
    if (node.isCgr() && node.usesCgTable()) this.cgTable.erase(node);
    if (node.numArgs > 0 && !node.isEq) this.decl2enodes.get(node.decl)?.pop();
    for (let index = 0; index < node.numArgs; index++) node.getArg(index).root.parents.pop();
    this.manager.decRef(node.owner);
    this.stickyGenerations.delete(node);
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

  private updateGeneration(node: Enode) {
    if (node.isEq) return;
    if (this.generation > 0 && this.generation < this.getGeneration(node)) {
      this.setGeneration(node, this.generation);
      if (node.usesCgTable()) this.stickyGenerations.set(node, this.generation);
    }
  }

  private isGate(expr: number) {
    const op = this.manager.getOp(expr);
    if (op === OP_AND || op === OP_OR || op === OP_ITE) return true;
    return op === OP_EQ && this.manager.isBool(this.manager.getArg(expr, 0));
  }

  private shouldInternalizeRec(expr: number) {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_APP || manager.sorts[expr] !== SORT_BOOL) return true;
    const family = manager.getFamily(expr);
    return family === FAMILY_BASIC || family === FAMILY_USER;
  }

  // Internalizes bottom up in topological order, so the recursion of internalizeRec stays shallow.
  private internalizeDeep(exprs: readonly number[]) {
    const manager = this.manager;
    const isDeep = (expr: number) =>
      !this.isEInternalized(expr) &&
      manager.depths[expr] > DEEP_EXPR_THRESHOLD &&
      this.shouldInternalizeRec(expr);
    if (!exprs.some(isDeep)) return;
    const colors = new Map<number, number>();
    const getColor = (current: number, isGate: boolean) =>
      colors.get(current * 2 + (isGate ? 1 : 0)) ?? WHITE;
    const todo: [number, boolean][] = exprs
      .filter(isDeep)
      .map((innerExpr): [number, boolean] => [innerExpr, true]);
    const sorted: [number, boolean][] = [];
    const visitChild = (child: number, isGate: boolean) => {
      if (getColor(child, isGate) === WHITE) todo.push([child, isGate]);
    };
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
        if (!exprs.includes(top[0]) && !manager.isNot(top[0]) && this.shouldInternalizeRec(top[0]))
          sorted.push(top);
      }
    }
    for (const entry of sorted) this.internalizeRec(entry[0], entry[1]);
  }

  internalizeAssertion(expr: number, generation: number) {
    const savedGeneration = this.generation;
    this.generation = generation;
    this.internalizeDeep([expr]);
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
          this.mkClause(
            manager.mapArgs(expr, (innerArg) => this.getLiteral(innerArg)),
            null,
            CLS_AUX,
          );
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
    this.internalizeDeep([expr]);
    this.internalizeRec(expr, isGateContext);
    this.generation = savedGeneration;
  }

  internalizeAll(exprs: readonly number[], isGateContext: boolean) {
    this.internalizeDeep(exprs);
    for (const expr of exprs) this.internalizeRec(expr, isGateContext);
  }

  private internalizeRec(expr: number, isGateContext: boolean) {
    const manager = this.manager;
    if (manager.isLambda(expr)) throw new SmtUnsupportedError("lambdas in the array theory");
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
    const manager = this.manager;
    this.getTheory(manager.getSortFamily(manager.sorts[manager.getArg(expr, 0)]))?.internalizeEqEh(
      expr,
      boolVar,
    );
  }

  private internalizeTheoryAtom(expr: number, isGateContext: boolean) {
    const theory = this.getTheory(this.manager.getFamily(expr));
    if (theory === undefined || !theory.internalizeAtom(expr, isGateContext)) return false;
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
      const theory = this.getTheory(manager.getFamily(expr));
      if (theory !== undefined && !theory.isAttachedToVar(existing)) theory.internalizeTerm(expr);
      return;
    }
    if (manager.getOp(expr) === OP_ITE) {
      this.internalizeIteTerm(expr);
      return;
    }
    if (!this.getTheory(manager.getFamily(expr))?.internalizeTerm(expr)) {
      for (let index = 0; index < manager.getNumArgs(expr); index++) {
        const arg = manager.getArg(expr, index);
        this.internalizeRec(arg, false);
      }
      if (this.exprToEnode[expr] === undefined) this.mkEnode(expr, false, false, true);
    }
    const node = this.exprToEnode[expr];
    if (node !== undefined) this.applySortCnstr(expr, node);
  }

  private applySortCnstr(expr: number, node: Enode) {
    const sort = this.manager.sorts[expr];
    this.getTheory(this.manager.getSortFamily(sort))?.applySortCnstr(node, sort);
  }

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

  private addRelWatch(literal: Literal, handler: () => void) {
    this.relevancy.addWatch(this.boolVar2Expr[getVar(literal)], !isNegated(literal), handler);
  }

  private addAndRelWatches(expr: number) {
    const handler = () => {
      if (this.isRelevant(expr)) this.relevancy.propagateAnd(expr);
    };
    for (let index = 0; index < this.manager.getNumArgs(expr); index++) {
      const arg = this.manager.getArg(expr, index);
      const literal = this.getLiteral(arg);
      if (literal > 1) this.addRelWatch(negate(literal), handler);
    }
  }

  private addOrRelWatches(expr: number) {
    const handler = () => {
      if (this.isRelevant(expr)) this.relevancy.propagateOr(expr);
    };
    for (let index = 0; index < this.manager.getNumArgs(expr); index++) {
      const arg = this.manager.getArg(expr, index);
      const literal = this.getLiteral(arg);
      if (literal > 1) this.addRelWatch(literal, handler);
    }
  }

  private addIteRelWatches(expr: number) {
    const handler = () => {
      if (this.isRelevant(expr)) this.relevancy.propagateIte(expr);
    };
    const literal = this.getLiteral(this.manager.getArg(expr, 0));
    if (literal <= 1) return;
    this.addRelWatch(literal, handler);
    this.addRelWatch(negate(literal), handler);
  }

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

  protected addWatch(literal: Literal, clause: Clause) {
    const list = this.watches[literal];
    if (list === undefined) this.watches[literal] = [clause];
    else list.push(clause);
  }

  protected removeWatchLiteral(clause: Clause, index: number) {
    const list = this.watches[negate(this.clauses.getLiteral(clause, index))];
    if (list === undefined) return;
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

  mkClause(
    literals: Literal[],
    inputJustification: Justification | null,
    kind: number,
    delEh: (() => void) | null = null,
  ) {
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
    const atoms = isSavingAtoms
      ? literals.map((literal) => this.boolVar2Expr[getVar(literal)])
      : null;
    for (const atom of atoms ?? []) this.manager.incRef(atom);
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

  protected releaseAtoms(clause: Clause) {
    for (const atom of this.clauses.getAtoms(clause)) this.manager.decRef(atom);
    this.clauses.clearAtoms(clause);
  }

  protected deleteClauses(clauses: Clause[], oldSize: number) {
    if (clauses.length - oldSize <= 1000) {
      for (let index = clauses.length - 1; index >= oldSize; index--)
        this.deleteClause(clauses[index]);
      shrink(clauses, oldSize);
      return;
    }
    if (this.watchMarks.length < this.watches.length)
      this.watchMarks = new Uint8Array(Math.max(2 * this.watchMarks.length, this.watches.length));
    const watched: Literal[] = [];
    const markWatch = (literal: Literal) => {
      if (this.watchMarks[literal] === 1) return;
      this.watchMarks[literal] = 1;
      watched.push(literal);
    };
    const store = this.clauses;
    for (let index = clauses.length - 1; index >= oldSize; index--) {
      const clause = clauses[index];
      if (!store.isDeleted(clause)) {
        store.markAsDeleted(clause);
        store.getDelEh(clause)?.();
      }
      markWatch(negate(store.getLiteral(clause, 0)));
      markWatch(negate(store.getLiteral(clause, 1)));
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
    for (let index = clauses.length - 1; index >= oldSize; index--) {
      const clause = clauses[index];
      if (store.isReinternalizeAtoms(clause)) this.releaseAtoms(clause);
      if (!store.isReinit(clause)) store.free(clause);
    }
    shrink(clauses, oldSize);
  }
}
