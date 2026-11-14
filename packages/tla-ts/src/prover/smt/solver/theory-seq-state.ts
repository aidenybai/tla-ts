// Ported from Z3 (src/smt/theory_seq.cpp, src/smt/theory_seq.h, src/smt/smt_arith_value.cpp,
// src/util/scoped_vector.h), MIT license, see z3-license.txt.
import {
  type AstManager,
  OP_ADD,
  OP_GE,
  OP_LE,
  OP_SEQ_CONCAT,
  OP_SEQ_LENGTH,
  OP_SEQ_MAP,
  OP_SEQ_MAPI,
  OP_SEQ_NTH_U,
  OP_SEQ_UNIT,
  OP_SUB,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import type { Context } from "./context";
import { type Enode, TheoryJustification } from "./enode";
import { L_TRUE, L_UNDEF } from "./lbool";
import { FALSE_LITERAL, type Literal, mkLiteral, negate, TRUE_LITERAL } from "./literal";
import { type Dependency, linearize, mkJoin, mkLeaf } from "./lp/dependency";
import { Rational } from "./rational";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { SeqAxioms } from "./seq-axioms";
import { getConcatUnits, isEmptySeq, mkConcatOf, mkEmptySeq, mkSeqApp } from "./seq-decl-plugin";
import { SeqEqSolver } from "./seq-eq-solver";
import { SeqRewriter } from "./seq-rewriter";
import type { SeqSkolem } from "./seq-skolem";
import { Theory } from "./theory";

interface Assumption {
  first: Enode | undefined;
  second: Enode | undefined;
  literal: Literal | undefined;
}

export interface DepEq {
  id: number;
  ls: number[];
  rs: number[];
  dep: Dependency;
}

export interface DecomposedEq {
  ls: number[];
  rs: number[];
}

export interface Ne {
  left: number;
  right: number;
  eqs: DecomposedEq[];
  literals: Literal[];
  dep: Dependency;
}

export interface Nc {
  contains: number;
  lengthGreater: Literal;
  dep: Dependency;
}

interface ExprDep {
  expr: number;
  dep: Dependency;
}

export class ScopedVector<T> {
  items: T[] = [];
  private undoIndexes: number[] = [];
  private undoValues: T[] = [];
  private sizes: number[] = [];
  private undoLimits: number[] = [];

  get size() {
    return this.items.length;
  }

  push(item: T) {
    this.items.push(item);
  }

  set(index: number, item: T) {
    this.undoIndexes.push(index);
    this.undoValues.push(this.items[index]);
    this.items[index] = item;
  }

  eraseAndSwap(index: number) {
    const last = this.items.length - 1;
    if (index !== last) this.set(index, this.items[last]);
    this.undoIndexes.push(last);
    this.undoValues.push(this.items[last]);
    this.items.pop();
  }

  pushScope() {
    this.sizes.push(this.items.length);
    this.undoLimits.push(this.undoIndexes.length);
  }

  popScope(numScopes: number) {
    if (numScopes === 0) return;
    const level = this.sizes.length - numScopes;
    const limit = this.undoLimits[level];
    for (let index = this.undoIndexes.length - 1; index >= limit; index--)
      this.items[this.undoIndexes[index]] = this.undoValues[index];
    this.undoIndexes.length = limit;
    this.undoValues.length = limit;
    this.items.length = this.sizes[level];
    this.sizes.length = level;
    this.undoLimits.length = level;
  }
}

class TrailStack {
  private undos: (() => void)[] = [];
  private limits: number[] = [];

  push(undo: () => void) {
    this.undos.push(undo);
  }

  pushScope() {
    this.limits.push(this.undos.length);
  }

  popScope(numScopes: number) {
    if (numScopes === 0) return;
    const level = this.limits.length - numScopes;
    const limit = this.limits[level];
    for (let index = this.undos.length - 1; index >= limit; index--) this.undos[index]();
    this.undos.length = limit;
    this.limits.length = level;
  }
}

const INSERT = 0;
const DELETE = 1;

class SolutionMap {
  private map = new Map<number, ExprDep>();
  private cache = new Map<number, ExprDep>();
  private updates: number[] = [];
  private lefts: number[] = [];
  private rights: number[] = [];
  private deps: Dependency[] = [];
  private limits: number[] = [];

  get isEmpty() {
    return this.map.size === 0;
  }

  private reducesTo(input: number, expr: number) {
    let current = input;
    while (current !== expr) {
      const value = this.map.get(current);
      if (value === undefined) return false;
      current = value.expr;
    }
    return true;
  }

  update(expr: number, rep: number, dep: Dependency) {
    if (expr === rep || this.reducesTo(rep, expr)) return;
    this.cache.clear();
    const value = this.map.get(expr);
    if (value !== undefined) this.addTrail(DELETE, expr, value.expr, value.dep);
    this.map.set(expr, { expr: rep, dep });
    this.addTrail(INSERT, expr, rep, dep);
  }

  private addTrail(op: number, left: number, right: number, dep: Dependency) {
    this.updates.push(op);
    this.lefts.push(left);
    this.rights.push(right);
    this.deps.push(dep);
  }

  addCache(expr: number, rep: number, dep: Dependency) {
    this.cache.set(expr, { expr: rep, dep });
  }

  findCache(expr: number) {
    return this.cache.get(expr);
  }

  findWithDep(input: number) {
    let dep: Dependency = null;
    let expr = input;
    for (let value = this.map.get(expr); value !== undefined; value = this.map.get(expr)) {
      dep = mkJoin(dep, value.dep);
      expr = value.expr;
    }
    return { expr, dep };
  }

  find(input: number) {
    let expr = input;
    for (let value = this.map.get(expr); value !== undefined; value = this.map.get(expr))
      expr = value.expr;
    return expr;
  }

  find1(expr: number) {
    return this.map.get(expr);
  }

  isRoot(expr: number) {
    return !this.map.has(expr);
  }

  pushScope() {
    this.limits.push(this.updates.length);
  }

  popScope(numScopes: number) {
    if (numScopes === 0) return;
    this.cache.clear();
    const start = this.limits[this.limits.length - numScopes];
    for (let index = this.updates.length - 1; index >= start; index--) {
      if (this.updates[index] === INSERT) this.map.delete(this.lefts[index]);
      else this.map.set(this.lefts[index], { expr: this.rights[index], dep: this.deps[index] });
    }
    this.updates.length = start;
    this.lefts.length = start;
    this.rights.length = start;
    this.deps.length = start;
    this.limits.length -= numScopes;
  }
}

class ExclusionTable {
  private table = new Set<string>();
  private lefts: number[] = [];
  private rights: number[] = [];
  private limits: number[] = [];

  constructor(private manager: AstManager) {}

  get isEmpty() {
    return this.table.size === 0;
  }

  private getKey(first: number, second: number) {
    return this.manager.ids[first] > this.manager.ids[second]
      ? `${second},${first}`
      : `${first},${second}`;
  }

  contains(first: number, second: number) {
    return this.table.has(this.getKey(first, second));
  }

  update(first: number, second: number) {
    const key = this.getKey(first, second);
    if (first === second || this.table.has(key)) return;
    this.lefts.push(first);
    this.rights.push(second);
    this.table.add(key);
  }

  pushScope() {
    this.limits.push(this.lefts.length);
  }

  popScope(numScopes: number) {
    if (numScopes === 0) return;
    const start = this.limits[this.limits.length - numScopes];
    for (let index = start; index < this.lefts.length; index++)
      this.table.delete(this.getKey(this.lefts[index], this.rights[index]));
    this.lefts.length = start;
    this.rights.length = start;
    this.limits.length -= numScopes;
  }
}

class UnionFind {
  private finds: number[] = [];
  private sizes: number[] = [];
  private nexts: number[] = [];

  constructor(private trail: TrailStack) {}

  mkVar() {
    const thVar = this.finds.length;
    this.finds.push(thVar);
    this.sizes.push(1);
    this.nexts.push(thVar);
    this.trail.push(() => {
      this.finds.pop();
      this.sizes.pop();
      this.nexts.pop();
    });
  }

  find(input: number) {
    let thVar = input;
    while (this.finds[thVar] !== thVar) thVar = this.finds[thVar];
    return thVar;
  }

  merge(first: number, second: number) {
    let firstRoot = this.find(first);
    let secondRoot = this.find(second);
    if (firstRoot === secondRoot) return;
    if (this.sizes[firstRoot] > this.sizes[secondRoot]) {
      const swapped = firstRoot;
      firstRoot = secondRoot;
      secondRoot = swapped;
    }
    this.finds[firstRoot] = secondRoot;
    this.sizes[secondRoot] += this.sizes[firstRoot];
    const next = this.nexts[firstRoot];
    this.nexts[firstRoot] = this.nexts[secondRoot];
    this.nexts[secondRoot] = next;
    const root = firstRoot;
    const other = secondRoot;
    this.trail.push(() => {
      const restored = this.nexts[root];
      this.nexts[root] = this.nexts[other];
      this.nexts[other] = restored;
      this.sizes[other] -= this.sizes[root];
      this.finds[root] = root;
    });
  }
}

export abstract class TheorySeqState extends Theory {
  protected assumptions: Assumption[] = [];
  private assumptionLimits: number[] = [];
  protected rep = new SolutionMap();
  protected eqs = new ScopedVector<DepEq>();
  protected nqs = new ScopedVector<Ne>();
  protected ncs = new ScopedVector<Nc>();
  protected lts = new ScopedVector<number>();
  protected recfuns = new ScopedVector<number>();
  protected isLtsChecked = false;
  protected eqId = 0;
  protected unionFind: UnionFind;
  protected overlapLeft = new Map<number, boolean>();
  protected overlapRight = new Map<number, boolean>();
  protected exclude: ExclusionTable;
  protected axioms: number[] = [];
  protected axiomSet = new Set<number>();
  protected axiomsHead = 0;
  protected intStrings: number[] = [];
  protected hasLengthSet = new Set<number>();
  protected lengths: number[] = [];
  protected lengthLimitMap = new Map<number, number>();
  protected lengthLimits: number[] = [];
  protected replay: (() => void)[] = [];
  protected strRewriter: Rewriter;
  protected rewriter: Rewriter;
  protected seqRewriter: SeqRewriter;
  protected ax: SeqAxioms;
  protected sk: SeqSkolem;
  protected eqSolver: SeqEqSolver;
  protected trailStack = new TrailStack();
  protected maxUnfoldingDepth = 1;
  protected maxUnfoldingLiteral: Literal | undefined;
  protected unhandledExpr: number | undefined;
  protected hasSeq: boolean;
  protected isNewSolution = false;
  protected isNewPropagation = false;
  protected fixed = new Set<number>();
  protected expandTodo: number[] = [];
  protected eqDeps: Dependency = null;
  protected nthEq2Cache = new Set<string>();
  protected branchStart = new Map<number, number>();

  constructor(context: Context, family: number) {
    super(context, family);
    const manager = context.manager;
    this.unionFind = new UnionFind(this.trailStack);
    this.exclude = new ExclusionTable(manager);
    this.rewriter = new Rewriter(manager, { ...TACTIC_REWRITER_OPTIONS, isCoalescingChars: false });
    this.strRewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    this.seqRewriter = new SeqRewriter(manager);
    this.ax = new SeqAxioms(manager, {
      rewrite: (expr) => this.rewrite(expr),
      mkEqLiteral: (first, second) => this.mkEqLiteral(first, second, false),
      ensureEnode: (expr) => this.ensureEnodeOf(expr),
      getLiteral: (expr) => context.getLiteral(expr),
      forcePhase: (literal) => context.forcePhase(literal),
      addAxiom: (literals) => this.addAxiom(literals),
      pushTrail: (undo) => context.pushTrail(undo),
    });
    this.sk = this.ax.skolem;
    this.eqSolver = new SeqEqSolver(
      manager,
      {
        addConsequence: (isUsingDeps, clause) => this.addConsequence(isUsingDeps, clause),
        addSolution: (variable, term) => {
          this.addSolution(variable, term, this.eqDeps);
        },
        expr2rep: (expr) => this.expr2rep(expr),
        getLength: (expr) => {
          const value = this.getLengthValue(expr);
          return { isKnown: value !== undefined, value: value ?? Rational.zero };
        },
      },
      this.ax,
    );
    this.hasSeq = manager.isSeqUsed;
  }

  protected keep(expr: number) {
    this.manager.incRef(expr);
    return expr;
  }

  protected rewrite(expr: number) {
    return this.rewriter.rewrite(expr);
  }

  protected isSeq(expr: number) {
    return this.manager.isSeqSort(this.manager.sorts[expr]);
  }

  protected isRe(expr: number) {
    return this.manager.isReSort(this.manager.sorts[expr]);
  }

  protected isOp(expr: number, op: number) {
    return this.manager.getOp(expr) === op;
  }

  protected isConcat(expr: number) {
    return this.isOp(expr, OP_SEQ_CONCAT) && this.manager.getNumArgs(expr) === 2;
  }

  protected isEmpty(expr: number) {
    return isEmptySeq(this.manager, expr);
  }

  protected isUnit(expr: number) {
    return this.isOp(expr, OP_SEQ_UNIT);
  }

  protected isString(expr: number) {
    return this.manager.getString(expr) !== undefined;
  }

  protected isNthU(expr: number) {
    return this.isOp(expr, OP_SEQ_NTH_U);
  }

  protected mkInt(value: number | bigint) {
    return this.manager.mkNumeral(BigInt(value));
  }

  protected mkArith(op: number, args: number[]) {
    return this.manager.mkApp(op, args, op === OP_GE || op === OP_LE ? SORT_BOOL : SORT_INT);
  }

  protected mkConcat(args: readonly number[], sort?: number) {
    return mkConcatOf(this.manager, args, sort ?? this.manager.sorts[args[0]]);
  }

  protected mkConcat2(first: number, second: number) {
    return mkSeqApp(this.manager, OP_SEQ_CONCAT, [first, second]);
  }

  protected mkEmpty(sort: number) {
    return mkEmptySeq(this.manager, sort);
  }

  protected mkLen(seq: number) {
    return this.seqRewriter.mkLengthOf(seq);
  }

  protected mkSub(first: number, second: number) {
    return this.rewrite(this.mkArith(OP_SUB, [first, second]));
  }

  protected mkAdd(first: number, second: number) {
    return this.rewrite(this.mkArith(OP_ADD, [first, second]));
  }

  protected mkLength(seq: number) {
    return mkSeqApp(this.manager, OP_SEQ_LENGTH, [seq]);
  }

  protected getConcatUnits(expr: number, result: number[]) {
    return getConcatUnits(this.manager, expr, result);
  }

  protected mkEqDep(left: number, right: number, dep: Dependency): DepEq {
    const ls = this.getConcatUnits(left, []).map((expr) => this.keep(expr));
    const rs = this.getConcatUnits(right, []).map((expr) => this.keep(expr));
    return { id: this.eqId++, ls, rs, dep };
  }

  protected mkDepEq(id: number, ls: readonly number[], rs: readonly number[], dep: Dependency) {
    return {
      id,
      ls: ls.map((expr) => this.keep(expr)),
      rs: rs.map((expr) => this.keep(expr)),
      dep,
    };
  }

  protected mkAssumption(assumption: Assumption) {
    this.assumptions.push(assumption);
    return mkLeaf(this.assumptions.length - 1);
  }

  protected mkLiteralLeaf(literal: Literal) {
    return this.mkAssumption({ first: undefined, second: undefined, literal });
  }

  protected mkJoinLiteral(dep: Dependency, literal: Literal) {
    return mkJoin(dep, this.mkLiteralLeaf(literal));
  }

  protected mkJoinLiterals(input: Dependency, literals: readonly Literal[]) {
    let dep = input;
    for (const literal of literals) dep = this.mkJoinLiteral(dep, literal);
    return dep;
  }

  protected addDependency(dep: Dependency, first: Enode, second: Enode) {
    return first === second
      ? dep
      : mkJoin(dep, this.mkAssumption({ first, second, literal: undefined }));
  }

  protected linearizeOf(dep: Dependency, eqs: Enode[], literals: Literal[]) {
    for (const index of linearize([dep])) {
      const assumption = this.assumptions[index];
      if (assumption.literal !== undefined && assumption.literal !== TRUE_LITERAL)
        literals.push(assumption.literal);
      if (assumption.first !== undefined) eqs.push(assumption.first, assumption.second!);
    }
  }

  protected pushScopeDeps() {
    this.assumptionLimits.push(this.assumptions.length);
  }

  protected popScopeDeps(numScopes: number) {
    const level = this.assumptionLimits.length - numScopes;
    this.assumptions.length = this.assumptionLimits[level];
    this.assumptionLimits.length = level;
  }

  private getEnodeOf(expr: number) {
    return this.context.isEInternalized(expr) ? this.context.getEnode(expr) : undefined;
  }

  protected getNumValue(expr: number) {
    const node = this.getEnodeOf(expr);
    if (node === undefined) return undefined;
    let next = node;
    do {
      const value = this.context.arith?.getValueOf(next);
      if (value !== undefined) return value.isInt() ? value : undefined;
      next = next.next;
    } while (next !== node);
    return undefined;
  }

  protected lowerBound(expr: number) {
    const node = this.getEnodeOf(expr);
    const bound = node === undefined ? undefined : this.context.arith?.getLower(node);
    return bound !== undefined && !bound.isStrict && bound.value.isInt() ? bound.value : undefined;
  }

  protected upperBound(expr: number) {
    const node = this.getEnodeOf(expr);
    const bound = node === undefined ? undefined : this.context.arith?.getUpper(node);
    return bound !== undefined && !bound.isStrict && bound.value.isInt() ? bound.value : undefined;
  }

  protected lowerBound2(seq: number) {
    const node = this.getEnodeOf(this.mkLen(seq));
    if (node === undefined) return undefined;
    let lower: Rational | undefined;
    let isStrict = false;
    let next = node;
    do {
      const bound = this.context.arith?.getLower(next);
      if (
        bound !== undefined &&
        (lower === undefined ||
          bound.value.compare(lower) > 0 ||
          (bound.value.equals(lower) && bound.isStrict))
      ) {
        lower = bound.value;
        isStrict = bound.isStrict;
      }
      next = next.next;
    } while (next !== node);
    return isStrict ? undefined : lower;
  }

  protected getLengthValue(input: number) {
    const manager = this.manager;
    let value = Rational.zero;
    const todo = [input];
    while (todo.length > 0) {
      const expr = todo.pop()!;
      const op = manager.getOp(expr);
      const chars = manager.getString(expr);
      if (this.isConcat(expr)) todo.push(manager.getArg(expr, 0), manager.getArg(expr, 1));
      else if (op === OP_SEQ_UNIT) value = value.add(Rational.one);
      else if (this.isEmpty(expr)) continue;
      else if (this.isOp(expr, OP_SEQ_MAP)) todo.push(manager.getArg(expr, 1));
      else if (this.isOp(expr, OP_SEQ_MAPI)) todo.push(manager.getArg(expr, 2));
      else if (chars !== undefined) value = value.add(Rational.of(BigInt(chars.length)));
      else {
        const length = this.mkLen(expr);
        if (!this.hasLength(expr)) {
          this.addAxiomOf(this.mkLiteralOf(this.mkArith(OP_GE, [length, this.mkInt(0)])));
          return undefined;
        }
        const node = this.getEnodeOf(length);
        const lengthValue = node === undefined ? undefined : this.context.arith?.getValueOf(node);
        if (lengthValue === undefined || lengthValue.isNegative()) return undefined;
        value = value.add(lengthValue);
      }
    }
    return value.isInt() ? value : undefined;
  }

  protected hasLength(expr: number) {
    return this.hasLengthSet.has(expr);
  }

  protected expr2rep(expr: number) {
    const context = this.context;
    const manager = this.manager;
    if (manager.isBool(expr) && context.isBInternalized(expr)) {
      const value = context.getAssignment(mkLiteral(context.getBoolVar(expr)));
      if (value === L_TRUE) return manager.trueExpr;
      if (value !== L_UNDEF) return manager.falseExpr;
    }
    if (!context.isEInternalized(expr)) return expr;
    return context.getEnode(expr)!.root.owner;
  }

  protected mkEqEmpty(expr: number, isPositive = true) {
    const manager = this.manager;
    if (this.isEmpty(expr)) return TRUE_LITERAL;
    for (const unit of this.getConcatUnits(expr, [])) {
      if (this.isUnit(unit)) return FALSE_LITERAL;
      const chars = manager.getString(unit);
      if (chars !== undefined && chars.length > 0) return FALSE_LITERAL;
    }
    const literal = this.mkEqLiteral(expr, this.mkEmpty(manager.sorts[expr]), false);
    this.context.forcePhase(isPositive ? literal : negate(literal));
    this.context.markLiteralAsRelevant(literal);
    return literal;
  }

  protected mkSeqEq(first: number, second: number) {
    return this.mkLiteralOf(this.sk.mkEq(first, second));
  }

  protected mkSimplifiedLiteral(expr: number) {
    return this.mkLiteralOf(this.rewrite(expr));
  }

  protected mkGeLiteral(expr: number, bound: number | bigint) {
    return this.mkLiteralOf(this.mkArith(OP_GE, [expr, this.mkInt(bound)]));
  }

  protected mkLeLiteral(expr: number, bound: number | bigint) {
    return this.mkLiteralOf(this.mkArith(OP_LE, [expr, this.mkInt(bound)]));
  }

  protected addAxiomOf(...inputs: Literal[]) {
    if (inputs.includes(TRUE_LITERAL)) return;
    this.addAxiom(inputs.filter((literal) => literal !== FALSE_LITERAL));
  }

  protected addAxiom(literals: Literal[]) {
    const context = this.context;
    for (const literal of literals)
      if (context.getAssignment(literal) === L_TRUE && context.getAssignLevel(literal) === 0)
        return;
    for (const literal of literals) context.markLiteralAsRelevant(literal);
    this.isNewPropagation = true;
    context.mkThAxiom(literals);
  }

  protected propagateLit(dep: Dependency, antecedents: readonly Literal[], literal: Literal) {
    const context = this.context;
    if (literal === TRUE_LITERAL || context.getAssignment(literal) === L_TRUE) return false;
    const literals = [...antecedents];
    if (literal === FALSE_LITERAL) {
      this.setConflict(dep, literals);
      return true;
    }
    context.markLiteralAsRelevant(literal);
    const eqs: Enode[] = [];
    this.linearizeOf(dep, eqs, literals);
    this.isNewPropagation = true;
    context.assign(literal, new TheoryJustification(this.id, literals, eqs));
    return true;
  }

  protected setConflict(dep: Dependency, antecedents: readonly Literal[] = []) {
    const eqs: Enode[] = [];
    const literals = [...antecedents];
    this.linearizeOf(dep, eqs, literals);
    this.isNewPropagation = true;
    this.context.setConflict(new TheoryJustification(this.id, literals, eqs), null);
  }

  protected conflictOrAxiom(literals: Literal[], dep: Dependency) {
    const context = this.context;
    if (literals.every((literal) => context.getAssignment(literal) === L_TRUE)) {
      this.setConflict(dep, literals);
      return;
    }
    const clause = literals.map((literal) => negate(literal));
    const eqs: Enode[] = [];
    const depLiterals: Literal[] = [];
    this.linearizeOf(dep, eqs, depLiterals);
    for (const literal of depLiterals) clause.push(negate(literal));
    for (let index = 0; index < eqs.length; index += 2)
      clause.push(negate(this.mkEqLiteral(eqs[index].owner, eqs[index + 1].owner, false)));
    this.addAxiom(clause);
  }

  protected propagateEqNodes(dep: Dependency, first: Enode, second: Enode) {
    if (first.root === second.root) return false;
    const literals: Literal[] = [];
    const eqs: Enode[] = [];
    this.linearizeOf(dep, eqs, literals);
    this.context.pushEq(first, second, {
      kind: "justification",
      justification: new TheoryJustification(this.id, literals, eqs),
    });
    this.isNewPropagation = true;
    this.enforceLengthCoherence(first, second);
    return true;
  }

  protected propagateEq(
    inputDep: Dependency,
    antecedents: readonly Literal[],
    firstExpr: number,
    secondExpr: number,
    isAddingToEqs = true,
  ) {
    const context = this.context;
    const first = this.ensureEnodeOf(firstExpr);
    const second = this.ensureEnodeOf(secondExpr);
    if (first.root === second.root) return false;
    context.markAsRelevant(first.owner);
    context.markAsRelevant(second.owner);
    const literals = [...antecedents];
    const eqs: Enode[] = [];
    this.linearizeOf(inputDep, eqs, literals);
    if (isAddingToEqs) this.newEqEhOf(this.mkJoinLiterals(inputDep, antecedents), first, second);
    this.isNewPropagation = true;
    context.pushEq(first, second, {
      kind: "justification",
      justification: new TheoryJustification(this.id, literals, eqs),
    });
    return true;
  }

  protected enforceLengthCoherence(first: Enode, second: Enode) {
    const firstExpr = first.owner;
    const secondExpr = second.owner;
    if (this.isOp(firstExpr, OP_SEQ_CONCAT) && this.isOp(secondExpr, OP_SEQ_CONCAT)) return;
    if (this.hasLength(firstExpr) && !this.hasLength(secondExpr)) this.addLengthToEqc(secondExpr);
    else if (this.hasLength(secondExpr) && !this.hasLength(firstExpr))
      this.addLengthToEqc(firstExpr);
  }

  protected addLength(length: number) {
    const expr = this.manager.getArg(length, 0);
    if (this.hasLength(expr)) return;
    this.lengths.push(this.keep(length));
    this.hasLengthSet.add(expr);
    this.trailStack.push(() => {
      this.lengths.pop();
    });
    this.trailStack.push(() => {
      this.hasLengthSet.delete(expr);
    });
  }

  protected addLengthToEqc(expr: number) {
    const first = this.ensureEnodeOf(expr);
    let node = first;
    let isChanged = false;
    do {
      const owner = node.owner;
      if (!this.hasLength(owner)) {
        const length = this.mkLength(owner);
        this.addLength(length);
        this.ensureEnodeOf(length);
        isChanged = true;
      }
      node = node.next;
    } while (node !== first);
    return isChanged;
  }

  protected addConsequence(isUsingDeps: boolean, clause: number[]) {
    const dep = isUsingDeps ? this.eqDeps : null;
    this.isNewPropagation = true;
    if (clause.length === 1) {
      this.propagateLit(dep, [], this.mkLiteralOf(clause[0]));
      return;
    }
    const eqs: Enode[] = [];
    const literals: Literal[] = [];
    this.linearizeOf(dep, eqs, literals);
    const axiom = literals.map((literal) => negate(literal));
    for (let index = 0; index < eqs.length; index += 2)
      axiom.push(negate(this.mkEqLiteral(eqs[index].owner, eqs[index + 1].owner, false)));
    for (const expr of clause) axiom.push(this.mkLiteralOf(expr));
    this.addAxiom(axiom);
  }

  protected addSolution(left: number, right: number, dep: Dependency) {
    if (left === right) return false;
    this.isNewSolution = true;
    this.rep.update(this.keep(left), this.keep(right), dep);
    const first = this.ensureEnodeOf(left);
    const second = this.ensureEnodeOf(right);
    const lengthParents: number[] = [];
    const isSeq = this.isSeq(right);
    if (isSeq)
      for (const node of [first, second])
        for (const parent of node.parents)
          if (this.isOp(parent.owner, OP_SEQ_LENGTH)) lengthParents.push(parent.owner);
    this.propagateEqNodes(dep, first, second);
    if (isSeq) {
      const length = this.rewrite(this.mkLength(right));
      for (const parent of lengthParents) this.propagateEq(dep, [], parent, length, false);
    }
    return true;
  }

  protected isVar(expr: number) {
    return this.eqSolver.isVar(expr);
  }

  protected setEmpty(expr: number) {
    const isZeroLength = this.mkEqLiteral(this.mkInt(0), this.mkLen(expr), false);
    this.addAxiomOf(negate(isZeroLength), this.mkEqEmpty(expr));
    return true;
  }

  protected decompose(expr: number) {
    return this.sk.decompose(expr);
  }

  protected mkDecompose(expr: number) {
    const decomposition = this.decompose(expr);
    const isEmpty = this.mkEqEmpty(expr);
    this.addAxiomOf(negate(isEmpty), this.mkEqEmpty(decomposition.tail));
    this.addAxiomOf(
      isEmpty,
      this.mkEqLiteral(expr, this.mkConcat2(decomposition.head, decomposition.tail), false),
    );
    return decomposition;
  }

  protected abstract newEqEhOf(dep: Dependency, first: Enode, second: Enode): void;
}
