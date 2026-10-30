// Ported from Z3 (src/smt/smt_context.h, src/smt/smt_internalizer.cpp), MIT license, see
// z3-license.txt. The state of the SMT kernel and the translation of formulas into it: Boolean
// variables, enodes, clauses and relevancy watches. The search lives in context.ts.
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
import { KERNEL_ARITH_OPTIONS } from "./arith-rewriter";
import { CaseSplitQueue } from "./case-split-queue";
import { CgTable, getCongruenceJustification } from "./cg-table";
import {
  BinJustification,
  BJustification,
  CLS_AUX,
  CLS_LEARNED,
  CLS_TH_AXIOM,
  Clause,
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
import { Rewriter } from "./rewriter";
import { sortByKey } from "./sort";
import type { TheoryLra } from "./theory-lra";

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
export const UNDO_ADD_EQ = 8;
export const UNDO_LBLS = 9;
export const UNDO_TH_VAR = 10;

interface NewEq {
  lhs: Enode;
  rhs: Enode;
  justification: EqJustification;
}

export abstract class Internalizer {
  readonly trueLiteral = TRUE_LITERAL;
  readonly falseLiteral = FALSE_LITERAL;
  readonly rewriter: Rewriter;
  readonly relevancy: RelevancyPropagator;
  readonly caseSplitQueue: CaseSplitQueue;
  readonly cgTable = new CgTable();
  abstract readonly theory: TheoryLra;
  abstract readonly qmanager: DefaultQuantifierManager;

  // Per Boolean variable. Like Z3's vectors, the arrays keep their size when a variable is deleted,
  // since V8 shrinks an array's storage when it pops and copies it again when it grows. Only the
  // first numBoolVars entries are live.
  numBoolVars = 0;
  boolVar2Expr: number[] = [];
  levels: number[] = [];
  internLevels: number[] = [];
  justifications: BJustification[] = [];
  marks: boolean[] = [];
  activity: number[] = [];
  protected phaseAvailable: boolean[] = [];
  protected phases: boolean[] = [];
  protected isEqFlags: boolean[] = [];
  protected isEnodeFlags: boolean[] = [];
  protected isTheoryFlags: boolean[] = [];
  protected isQuantifierFlags: boolean[] = [];
  protected isTrueFirstFlags: boolean[] = [];
  // Per literal.
  protected assignment: number[] = [];
  // Like Z3's watch lists, a literal's lists are created when the first clause is added.
  protected watches: (Clause[] | undefined)[] = [];
  // The binary clauses of the binary clause optimization: the literals each literal propagates when it
  // becomes true, which Z3 visits newest first and before the clauses.
  protected binaryWatches: (Literal[] | undefined)[] = [];
  private binJustifications: (BinJustification | undefined)[] = [];
  // Per expression.
  protected exprToBoolVar: (BoolVar | undefined)[] = [];
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
  protected conflict: BJustification | undefined = undefined;
  protected notLiteral: Literal | null = null;
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

  constructor(
    readonly manager: AstManager,
    isRelevancyEnabled: boolean,
    isDelayingNewCaseSplits: boolean,
  ) {
    this.rewriter = new Rewriter(manager, {
      isEliminatingAnd: false,
      arith: KERNEL_ARITH_OPTIONS,
      isRewritingPatterns: true,
    });
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
    this.exprToBoolVar[manager.falseExpr] = TRUE_BOOL_VAR;
    this.falseEnode = this.mkEnode(manager.falseExpr, true, true, false);
  }

  abstract assign(literal: Literal, justification: BJustification, isDecision?: boolean): void;

  abstract relevantEh(expr: number): void;

  protected abstract propagateBoolVarEnode(boolVar: BoolVar): void;

  setConflict(justification: BJustification, notLiteral: Literal | null) {
    if (this.conflict !== undefined) return;
    this.conflict = justification;
    this.notLiteral = notLiteral;
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
    kinds.length = limit;
  }

  protected popTrailNode() {
    const nodes = this.trailNodes;
    const node = nodes[nodes.length - 1];
    nodes.length--;
    return node;
  }

  protected popTrailInt() {
    const ints = this.trailInts;
    const value = ints[ints.length - 1];
    ints.length--;
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
        this.isTheoryFlags[this.popTrailInt()] = false;
        return;
      case UNDO_TRUE_FIRST:
        this.isTrueFirstFlags[this.popTrailInt()] = false;
        return;
      case UNDO_CGC_GENERATIONS: {
        const second = this.popTrailNode();
        const first = this.popTrailNode();
        second.generation = this.popTrailInt();
        first.generation = this.popTrailInt();
        return;
      }
      case UNDO_MERGE_TF:
        this.popTrailNode().isMergeTf = false;
        return;
      case UNDO_ENODE_FLAG:
        this.isEnodeFlags[this.popTrailInt()] = false;
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
    return this.levels[getVar(literal)];
  }

  isBInternalized(expr: number) {
    return this.exprToBoolVar[expr] !== undefined;
  }

  findBoolVar(expr: number) {
    return this.exprToBoolVar[expr];
  }

  getBoolVar(expr: number) {
    const boolVar = this.exprToBoolVar[expr];
    if (boolVar === undefined) throw new Error("the formula has no Boolean variable");
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

  // is_diseq_core: the roots are distinct values, or an equality between the two classes is false.
  // The congruence table is searched with m_is_diseq_tmp, an equality of the sort, which holds a
  // reference until an equality of another sort replaces it.
  isDiseq(first: Enode, second: Enode) {
    const manager = this.manager;
    if (manager.areDistinct(first.root.owner, second.root.owner)) return true;
    const tmp = this.isDiseqTmp;
    if (tmp === -1 || manager.sorts[manager.args[tmp][0]] !== manager.sorts[first.owner]) {
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
    if (manager.isNot(expr)) return negate(this.getLiteral(manager.args[expr][0]));
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
    return this.conflict !== undefined;
  }

  getGeneration(node: Enode) {
    return node.cg.generation;
  }

  // Boolean variables and enodes.

  // mk_bool_var: m_b_internalized_stack holds a reference to the expression until the variable is
  // deleted.
  mkBoolVar(expr: number) {
    const boolVar = toBoolVar(this.numBoolVars++);
    const literal = mkLiteral(boolVar);
    this.manager.incRef(expr);
    this.exprToBoolVar[expr] = boolVar;
    this.boolVar2Expr[boolVar] = expr;
    this.levels[boolVar] = 0;
    this.internLevels[boolVar] = this.scopeLevel;
    this.justifications[boolVar] = null;
    this.marks[boolVar] = false;
    this.activity[boolVar] = this.isSearching ? -((this.getRandomValue() % 1000) / 1000) : 0;
    this.phaseAvailable[boolVar] = false;
    this.phases[boolVar] = false;
    this.isEqFlags[boolVar] = false;
    this.isEnodeFlags[boolVar] = false;
    this.isTheoryFlags[boolVar] = false;
    this.isQuantifierFlags[boolVar] = false;
    this.isTrueFirstFlags[boolVar] = false;
    this.assignment[literal] = L_UNDEF;
    this.assignment[literal + 1] = L_UNDEF;
    this.watches[literal] = undefined;
    this.watches[literal + 1] = undefined;
    this.binaryWatches[literal] = undefined;
    this.binaryWatches[literal + 1] = undefined;
    this.caseSplitQueue.mkVar(boolVar);
    this.trailKinds.push(UNDO_MK_BOOL_VAR);
    return boolVar;
  }

  // The arrays keep the deleted variable's entries, which mkBoolVar overwrites. Those that hold
  // objects are cleared, so the objects can be collected.
  private undoMkBoolVar() {
    const boolVar = toBoolVar(--this.numBoolVars);
    const literal = mkLiteral(boolVar);
    const expr = this.boolVar2Expr[boolVar];
    this.caseSplitQueue.delVar(boolVar);
    if (this.isQuantifierFlags[boolVar]) this.qmanager.del(expr);
    this.exprToBoolVar[expr] = undefined;
    this.justifications[boolVar] = null;
    this.watches[literal] = undefined;
    this.watches[literal + 1] = undefined;
    this.binaryWatches[literal] = undefined;
    this.binaryWatches[literal + 1] = undefined;
    this.binJustifications[literal] = undefined;
    this.binJustifications[literal + 1] = undefined;
    this.manager.decRef(expr);
  }

  protected isAtom(boolVar: BoolVar) {
    return (
      this.isEqFlags[boolVar] ||
      this.isEnodeFlags[boolVar] ||
      this.isTheoryFlags[boolVar] ||
      this.isQuantifierFlags[boolVar]
    );
  }

  setVarTheory(boolVar: BoolVar) {
    if (this.scopeLevel > this.internLevels[boolVar]) {
      this.trailInts.push(boolVar);
      this.trailKinds.push(UNDO_VAR_THEORY);
    }
    this.isTheoryFlags[boolVar] = true;
  }

  setTrueFirstFlag(boolVar: BoolVar) {
    this.trailInts.push(boolVar);
    this.trailKinds.push(UNDO_TRUE_FIRST);
    this.isTrueFirstFlags[boolVar] = true;
  }

  isTrueFirst(boolVar: BoolVar) {
    return this.isTrueFirstFlags[boolVar];
  }

  mkEnode(expr: number, isSuppressingArgs: boolean, isMergeTf: boolean, isCgcEnabled: boolean) {
    const manager = this.manager;
    const generation = this.cachedGeneration.get(expr) ?? this.generation;
    const args =
      isSuppressingArgs || manager.args[expr].length === 0
        ? NO_ENODES
        : manager.args[expr].map((arg) => {
            const argNode = this.exprToEnode[arg];
            if (argNode === undefined) throw new Error("an argument was not internalized");
            return argNode;
          });
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
    for (const arg of args) arg.root.addParent(node);
    if (manager.isUniqueValue(expr)) node.isInterpreted = true;
    this.exprToEnode[expr] = node;
    // m_e_internalized_stack holds a reference to the expression until the enode is deleted.
    manager.incRef(expr);
    this.trailKinds.push(UNDO_MK_ENODE);
    this.enodes.push(node);
    if (args.length > 0) {
      if (node.isTrueEq()) {
        this.assign(
          mkLiteral(this.getBoolVar(expr)),
          new EqPropagationJustification(args[0], args[1]),
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

  private undoMkEnode() {
    const node = this.enodes.pop();
    if (node === undefined) return;
    this.exprToEnode[node.owner] = undefined;
    if (node.isCgr() && node.usesCgTable()) this.cgTable.erase(node);
    if (node.args.length > 0 && !node.isEq) this.decl2enodes.get(node.decl)?.pop();
    for (const arg of node.args) arg.root.parents.pop();
    this.manager.decRef(node.owner);
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
    if (this.isEnodeFlags[boolVar]) return;
    if (!isNewVar) {
      this.trailInts.push(boolVar);
      this.trailKinds.push(UNDO_ENODE_FLAG);
    }
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
      const args = manager.args[current];
      if (manager.getOp(current) === OP_ITE && manager.sorts[current] !== SORT_BOOL) {
        visitChild(args[0], true);
        visitChild(args[1], false);
        visitChild(args[2], false);
        return;
      }
      const isNewGate =
        manager.sorts[current] === SORT_BOOL && (this.isGate(current) || manager.isNot(current));
      for (let index = args.length - 1; index >= 0; index--) visitChild(args[index], isNewGate);
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
          this.mkClause([first, negate(second)], null, CLS_AUX);
          this.mkClause([negate(first), second], null, CLS_AUX);
          break;
        }
        default: {
          for (const arg of args) this.internalizeRec(arg, true);
          const condition = this.getLiteral(args[0]);
          this.mkClause([negate(condition), this.getLiteral(args[1])], null, CLS_AUX);
          this.mkClause([condition, this.getLiteral(args[2])], null, CLS_AUX);
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
          if (this.assignment[mkLiteral(boolVar)] !== L_UNDEF) this.propagateBoolVarEnode(boolVar);
        }
      }
      return;
    }
    const op = manager.getOp(expr);
    if (op === OP_EQ && !manager.isBool(manager.args[expr][0]))
      this.internalizeEq(expr, isGateContext);
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
      this.theory.internalizeEqEh(expr);
  }

  private isArithSort(eq: number) {
    return isArithSort(this.manager.sorts[this.manager.args[eq][0]]);
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
    this.isQuantifierFlags[boolVar] = true;
    this.qmanager.add(expr, generation);
  }

  protected internalizeFormulaCore(expr: number, isGateContext: boolean) {
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
    const literal = mkLiteral(boolVar);
    const args = manager.args[expr];
    switch (op) {
      case OP_NOT: {
        const child = this.getLiteral(args[0]);
        this.mkClause([negate(literal), negate(child)], null, CLS_AUX);
        this.mkClause([literal, child], null, CLS_AUX);
        break;
      }
      case OP_AND: {
        const buffer = [literal];
        for (const arg of args) {
          const argLiteral = this.getLiteral(arg);
          this.mkClause([negate(literal), argLiteral], null, CLS_AUX);
          buffer.push(negate(argLiteral));
        }
        this.mkClause(buffer, null, CLS_AUX);
        this.addAndRelWatches(expr);
        break;
      }
      case OP_OR: {
        const buffer = [negate(literal)];
        for (const arg of args) {
          const argLiteral = this.getLiteral(arg);
          this.mkClause([literal, negate(argLiteral)], null, CLS_AUX);
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
        this.mkClause([literal, negate(second)], null, CLS_AUX);
        this.mkClause([negate(literal), negate(first), second], null, CLS_AUX);
        break;
      }
      case OP_EQ:
      case OP_XOR: {
        if (op === OP_EQ && !manager.isBool(args[0])) break;
        const gate = op === OP_XOR ? negate(literal) : literal;
        const first = this.getLiteral(args[0]);
        const second = this.getLiteral(args[1]);
        this.mkClause([negate(gate), first, negate(second)], null, CLS_AUX);
        this.mkClause([negate(gate), negate(first), second], null, CLS_AUX);
        this.mkClause([gate, first, second], null, CLS_AUX);
        this.mkClause([gate, negate(first), negate(second)], null, CLS_AUX);
        break;
      }
      case OP_ITE: {
        const condition = this.getLiteral(args[0]);
        const thenLiteral = this.getLiteral(args[1]);
        const elseLiteral = this.getLiteral(args[2]);
        this.mkClause([negate(literal), negate(condition), thenLiteral], null, CLS_AUX);
        this.mkClause([negate(literal), condition, elseLiteral], null, CLS_AUX);
        this.mkClause([literal, negate(condition), negate(thenLiteral)], null, CLS_AUX);
        this.mkClause([literal, condition, negate(elseLiteral)], null, CLS_AUX);
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
      // The theory may have made a nested term, such as the 2 of (* 2 x), without a variable, which
      // it needs once the term occurs elsewhere.
      if (manager.getFamily(expr) === FAMILY_ARITH) this.theory.internalizeTerm(expr);
      return;
    }
    if (manager.getOp(expr) === OP_ITE) {
      this.internalizeIteTerm(expr);
      return;
    }
    if (manager.getFamily(expr) === FAMILY_ARITH && this.theory.internalizeTerm(expr)) return;
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
    this.mkClause([negate(condition), this.getLiteral(thenEq)], null, CLS_AUX);
    this.mkClause([condition, this.getLiteral(elseEq)], null, CLS_AUX);
    // ite_term_relevancy_eh: it marks the terms for the propagator, which propagates them later.
    const handler = () => {
      if (!this.isRelevant(expr)) return;
      this.relevancy.markAsRelevant(args[0]);
      const value = this.findAssignment(args[0]);
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
    for (const arg of this.manager.args[expr]) {
      const literal = this.getLiteral(arg);
      if (literal > 1) this.addRelWatch(negate(literal), handler);
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
    this.addRelWatch(negate(literal), handler);
  }

  // Clauses.

  mkThAxiom(literals: Literal[]) {
    this.mkClause(literals, null, CLS_TH_AXIOM);
  }

  private simplifyAuxClauseLiterals(literals: Literal[], removed: Literal[]) {
    sortByKey(literals, (literal) => literal);
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
    literals.length = kept;
    return true;
  }

  protected selectWatchLiteral(clause: Clause, startingAt: number) {
    let minTrue = -1;
    let maxFalse = -1;
    let unknown = -1;
    const literals = clause.literals;
    for (let index = startingAt; index < literals.length; index++) {
      const literal = literals[index];
      const value = this.assignment[literal];
      if (value === L_FALSE) {
        if (
          maxFalse === -1 ||
          this.levels[getVar(literal)] > this.levels[getVar(literals[maxFalse])]
        )
          maxFalse = index;
      } else if (value === L_UNDEF) unknown = index;
      else if (
        minTrue === -1 ||
        this.levels[getVar(literal)] < this.levels[getVar(literals[minTrue])]
      )
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
        this.assignment[literal] === L_FALSE ? this.levels[getVar(literal)] : this.scopeLevel;
      if (maxFalse === -1 || level > maxLevel) {
        maxFalse = index;
        maxLevel = level;
      }
    }
    return maxFalse;
  }

  protected swapLiterals(clause: Clause, first: number, second: number) {
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

  protected addWatchLiteral(clause: Clause, index: number) {
    this.addWatch(negate(clause.literals[index]), clause);
  }

  // A literal's first watch gets a list of its own size, since growing an empty list allocates room
  // for many.
  protected addWatch(literal: Literal, clause: Clause) {
    const list = this.watches[literal];
    if (list === undefined) this.watches[literal] = [clause];
    else list.push(clause);
  }

  protected removeWatchLiteral(clause: Clause, index: number) {
    const list = this.watches[negate(clause.literals[index])];
    if (list === undefined) return;
    const position = list.indexOf(clause);
    if (position === -1) return;
    list.copyWithin(position, position + 1);
    list.length--;
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
    return this.internLevels[getVar(first)] === 0 && this.internLevels[getVar(second)] === 0;
  }

  private getMaxIscopeLevel(literals: Literal[]) {
    let result = 0;
    for (const literal of literals) result = Math.max(result, this.internLevels[getVar(literal)]);
    return result;
  }

  private markForReinit(clause: Clause, level: number, isReinternalizingAtoms: boolean) {
    clause.isReinit = true;
    clause.isReinternalizeAtoms = isReinternalizingAtoms;
    while (this.clausesToReinit.length <= level) this.clausesToReinit.push([]);
    this.clausesToReinit[level].push(clause);
  }

  mkClause(input: Literal[], inputJustification: Justification | null, kind: number) {
    let literals = input;
    let justification = inputJustification;
    if (kind !== CLS_LEARNED) {
      literals = [...input];
      const removed: Literal[] = [];
      if (!this.simplifyAuxClauseLiterals(literals, removed)) return null;
      if (removed.length > 0)
        justification = new UnitResolutionJustification(justification, [...removed]);
    }
    if (literals.length === 0) {
      this.setConflict(justification ?? "axiom", null);
      return null;
    }
    if (literals.length === 1) {
      this.assign(literals[0], justification ?? "axiom");
      return null;
    }
    const isLemma = kind === CLS_LEARNED;
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
    const clause = new Clause(literals, kind, justification, atoms);
    if (isLemma) {
      this.swapLiterals(clause, 1, this.selectLearnedWatchLiteral(clause));
      this.lemmas.push(clause);
      this.addWatchLiteral(clause, 0);
      this.addWatchLiteral(clause, 1);
      if (this.assignment[literals[0]] === L_FALSE) this.setConflict(clause, null);
      else if (this.assignment[literals[1]] === L_FALSE) this.assign(literals[0], clause);
      if (isSavingAtoms) this.markForReinit(clause, iscopeLevel, true);
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
    if (clause.isDeleted) return;
    this.removeWatchLiteral(clause, 0);
    this.removeWatchLiteral(clause, 1);
    clause.isDeleted = true;
    if (clause.isReinternalizeAtoms) this.releaseAtoms(clause);
  }

  // release_atoms: the clause no longer holds its atoms.
  protected releaseAtoms(clause: Clause) {
    for (const atom of clause.atoms ?? []) this.manager.decRef(atom);
    clause.atoms = null;
  }

  protected deleteClauses(clauses: Clause[], oldSize: number) {
    for (let index = clauses.length - 1; index >= oldSize; index--)
      this.deleteClause(clauses[index]);
    clauses.length = oldSize;
  }
}
