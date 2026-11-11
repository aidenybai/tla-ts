// Ported from Z3 (src/ast/rewriter/th_rewriter.cpp, bool_rewriter.cpp, arith_rewriter.cpp), MIT license, see z3-license.txt.
import { ArithRewriter, KERNEL_ARITH_OPTIONS, TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import type { ArithRewriterOptions } from "./poly-rewriter";
import { isAstLess } from "./ast-lt";
import { Der } from "./der";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ABS,
  OP_ADD,
  OP_AND,
  OP_DISTINCT,
  OP_DIV,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IMPLIES,
  OP_IS_INT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
  OP_UNINTERPRETED,
  OP_XOR,
  SORT_BOOL,
  isArithSort,
} from "./ast";
import { getRewriteDepth, type Rewrite, RewriterTpl } from "./rewriter-tpl";
import { sortByKey } from "./sort";
import { UnusedVarsEliminator } from "./var-subst";

interface RewriterOptions {
  readonly isEliminatingAnd: boolean;
  readonly arith: ArithRewriterOptions;
  readonly isRewritingPatterns: boolean;
  readonly isPullingCheapIte?: boolean;
}

export const KERNEL_REWRITER_OPTIONS: RewriterOptions = {
  isEliminatingAnd: false,
  arith: KERNEL_ARITH_OPTIONS,
  isRewritingPatterns: true,
};

export const TACTIC_REWRITER_OPTIONS: RewriterOptions = {
  isEliminatingAnd: false,
  arith: TACTIC_ARITH_OPTIONS,
  isRewritingPatterns: false,
};

interface ReduceFrame {
  expr: number;
  depth: number;
  childIndex: number;
  spos: number;
}

export class Rewriter extends RewriterTpl {
  private arith: ArithRewriter;
  private substitution = new Map<number, number>();
  private unusedVarsEliminator: UnusedVarsEliminator;
  private der: Der;
  releaseResult = () => this.setLastResult(-1);

  constructor(
    manager: AstManager,
    private options: RewriterOptions,
    private isNestedDer = false,
  ) {
    super(manager);
    this.arith = new ArithRewriter(manager, options.arith);
    this.unusedVarsEliminator = new UnusedVarsEliminator(manager);
    this.der = new Der(manager);
  }

  release() {
    this.unusedVarsEliminator.release();
    this.der.release();
    super.release();
  }

  private reduceTo(expr: number, depth: number): number {
    const manager = this.manager;
    const frames: ReduceFrame[] = [];
    const results: number[] = [];
    const visit = (term: number, termDepth: number) => {
      if (termDepth === 0 || manager.kinds[term] !== KIND_APP || manager.getNumArgs(term) === 0)
        results.push(term);
      else frames.push({ expr: term, depth: termDepth - 1, childIndex: 0, spos: results.length });
    };
    visit(expr, depth);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      if (frame.childIndex < manager.getNumArgs(frame.expr)) {
        visit(manager.getArg(frame.expr, frame.childIndex++), frame.depth);
        continue;
      }
      frames.pop();
      const decl = manager.decls[frame.expr];
      const newArgs = results.splice(frame.spos);
      const reduced = this.reduceAppTop(decl, newArgs, manager.sorts[frame.expr]);
      if (reduced === -1) results.push(manager.mkApp(decl, newArgs, manager.sorts[frame.expr]));
      else if (typeof reduced === "number") results.push(reduced);
      else visit(reduced.expr, getRewriteDepth(reduced));
    }
    return results[0];
  }

  setEliminatingAnd(isEliminatingAnd: boolean) {
    this.options = { ...this.options, isEliminatingAnd };
  }

  setSubstitution(substitution: Map<number, number>) {
    this.substitution = substitution;
    this.reset();
  }

  getSubst(expr: number) {
    return this.substitution.size === 0 ? undefined : this.substitution.get(expr);
  }

  isFlatAssoc(decl: number) {
    const op = this.manager.funcDecls[decl].op;
    return op === OP_AND || op === OP_OR || op === OP_ADD;
  }

  isRewritingPatterns() {
    return this.options.isRewritingPatterns;
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    if (
      manager.funcDecls[decl].op === OP_UNINTERPRETED &&
      (args.length !== 2 || this.options.isPullingCheapIte !== true)
    )
      return -1;
    const outer = manager.beginTemporaries();
    const result = this.reduceAppTop(decl, args, sort);
    if (result !== -1) manager.incRef(typeof result === "number" ? result : result.expr);
    manager.endTemporaries(outer);
    return result;
  }

  reduceQuantifier(expr: number, body: number, patterns: number[]) {
    return this.manager.withTemporaries(() => this.reduceQuantifierCore(expr, body, patterns));
  }

  private reduceQuantifierCore(expr: number, body: number, newPatterns: number[]) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const isNegated = manager.isNot(body);
    const junction = isNegated ? manager.getArg(body, 0) : body;
    if (
      manager.getOp(junction) === (data.isForall !== isNegated ? OP_AND : OP_OR) &&
      manager.someArg(junction, (arg) => {
        const atom = manager.isNot(arg) ? manager.getArg(arg, 0) : arg;
        return manager.kinds[atom] === KIND_VAR && manager.values[atom] < data.sorts.length;
      })
    )
      return data.isForall ? manager.falseExpr : manager.trueExpr;
    const nested =
      manager.kinds[body] === KIND_QUANTIFIER ? manager.getQuantifier(body) : undefined;
    const patterns = newPatterns.filter((pattern, index) => newPatterns.indexOf(pattern) === index);
    const merged =
      nested !== undefined &&
      nested.isForall === data.isForall &&
      data.patterns.length === 0 &&
      nested.patterns.length === 0
        ? manager.mkQuantifier({
            ...data,
            sorts: [...data.sorts, ...nested.sorts],
            names: [...data.names, ...nested.names],
            body: nested.body,
            patterns: [],
            weight: Math.min(data.weight, nested.weight),
          })
        : manager.mkQuantifier({ ...data, body, patterns: this.substitutePatterns(patterns) });
    const reduced = this.unusedVarsEliminator.apply(merged);
    manager.releaseLater(reduced);
    if (
      manager.kinds[reduced] !== KIND_QUANTIFIER ||
      manager.getQuantifier(reduced).patterns.length > 0
    )
      return reduced;
    const eliminated = this.der.apply(reduced);
    if (eliminated === reduced || this.isNestedDer) return eliminated;
    const nestedRewriter = new Rewriter(manager, this.options, true);
    const rewritten = nestedRewriter.rewrite(eliminated);
    nestedRewriter.release();
    manager.releaseLater(rewritten);
    return rewritten;
  }

  private substitutePatterns(patterns: number[]) {
    const manager = this.manager;
    if (this.substitution.size === 0) return patterns;
    const cache = new Map<number, number>();
    const replace = (expr: number): number => {
      const replacement = this.substitution.get(expr);
      if (replacement !== undefined) return replacement;
      if (manager.kinds[expr] !== KIND_APP || manager.getNumArgs(expr) === 0) return expr;
      const cached = cache.get(expr);
      if (cached !== undefined) return cached;
      const result = manager.mkApp(
        manager.decls[expr],
        manager.mapArgs(expr, replace),
        manager.sorts[expr],
      );
      cache.set(expr, result);
      return result;
    };
    return patterns.map((pattern) => manager.mkPattern(manager.mapArgs(pattern, replace)));
  }

  mkApp(decl: number, args: number[], sort: number) {
    const reduced = this.reduceAppTop(decl, args, sort);
    return reduced === -1
      ? this.manager.mkApp(decl, args, sort)
      : typeof reduced === "number"
        ? reduced
        : reduced.expr;
  }

  mkAppCore(decl: number, args: number[], sort: number): number {
    const reduced = this.reduceAppTop(decl, args, sort);
    return reduced === -1
      ? this.manager.mkApp(decl, args, sort)
      : typeof reduced === "number"
        ? reduced
        : this.reduceTo(reduced.expr, getRewriteDepth(reduced));
  }

  private reduceAppTop(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const reduced = this.reduceAppCore(decl, args);
    if (typeof reduced !== "number" || this.options.isPullingCheapIte !== true) return reduced;
    if (reduced === -1)
      return (args.length === 2 ? this.pullIte(decl, args[0], args[1], sort) : undefined) ?? -1;
    return manager.kinds[reduced] === KIND_APP && manager.getNumArgs(reduced) === 2
      ? (this.pullIte(
          manager.decls[reduced],
          manager.getArg(reduced, 0),
          manager.getArg(reduced, 1),
          manager.sorts[reduced],
        ) ?? reduced)
      : reduced;
  }

  private pullIte(decl: number, first: number, second: number, sort: number): Rewrite | undefined {
    const manager = this.manager;
    if (sort === SORT_BOOL && manager.sorts[first] !== SORT_BOOL) {
      if (this.isIte(first)) {
        if (manager.isUniqueValue(second) && manager.getRefCount(first) === 1)
          return this.pullIteCore(decl, first, second, sort, false);
        if (this.isIte(second) && manager.getArg(first, 0) === manager.getArg(second, 0)) {
          const branches = [1, 2].map((index) =>
            manager.mkApp(
              decl,
              [manager.getArg(first, index), manager.getArg(second, index)],
              sort,
            ),
          );
          return {
            expr: manager.mkApp(OP_ITE, [manager.getArg(first, 0), ...branches], SORT_BOOL),
            depth: 2,
          };
        }
      }
      if (this.isIte(second) && manager.isUniqueValue(first) && manager.getRefCount(second) === 1)
        return this.pullIteCore(decl, second, first, sort, true);
    }
    const family = manager.funcDecls[decl].family;
    if (family !== FAMILY_BASIC && family !== FAMILY_ARITH) return undefined;
    if (manager.isUniqueValue(first) && this.isIteValueTree(second))
      return this.pullIteCore(decl, second, first, sort, true);
    if (manager.isUniqueValue(second) && this.isIteValueTree(first))
      return this.pullIteCore(decl, first, second, sort, false);
    return undefined;
  }

  private pullIteCore(
    decl: number,
    ite: number,
    value: number,
    sort: number,
    isSwapped: boolean,
  ): Rewrite {
    const manager = this.manager;
    const branches = [manager.getArg(ite, 1), manager.getArg(ite, 2)].map((branch) =>
      manager.funcDecls[decl].op === OP_EQ
        ? branch === value
          ? manager.trueExpr
          : this.areDistinct(branch, value)
            ? manager.falseExpr
            : manager.mkEq(branch, value)
        : manager.mkApp(decl, isSwapped ? [value, branch] : [branch, value], sort),
    );
    return { expr: manager.mkApp(OP_ITE, [manager.getArg(ite, 0), ...branches], sort), depth: 2 };
  }

  private isIteValueTree(expr: number) {
    const manager = this.manager;
    if (!this.isIte(expr) || manager.getRefCount(expr) !== 1) return false;
    const todo = [expr];
    for (let ite = todo.pop(); ite !== undefined; ite = todo.pop()) {
      for (const branch of [manager.getArg(ite, 1), manager.getArg(ite, 2)]) {
        if (this.isIte(branch) && manager.getRefCount(branch) === 1) todo.push(branch);
        else if (!manager.isUniqueValue(branch)) return false;
      }
    }
    return true;
  }

  reduceAppCore(decl: number, args: number[]): number | Rewrite {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    switch (op) {
      case OP_AND:
        return this.mkAndCore(args);
      case OP_OR:
        return this.mkOr(args);
      case OP_NOT:
        return this.mkNot(args[0]);
      case OP_IMPLIES:
        return this.mkOr([this.mkNot(args[0]), args[1]]);
      case OP_XOR:
        return this.mkEq(this.mkNot(args[0]), args[1]);
      case OP_EQ:
        return (
          (isArithSort(manager.sorts[args[0]]) ? this.arith.mkEq(args[0], args[1]) : undefined) ??
          this.mkEqCore(args[0], args[1]) ??
          -1
        );
      case OP_DISTINCT:
        return this.mkDistinct(args);
      case OP_ITE:
        return this.mkIte(args[0], args[1], args[2]);
      case OP_LE:
        return this.arith.mkLe(args[0], args[1]) ?? -1;
      case OP_GE:
        return this.arith.mkGe(args[0], args[1]) ?? -1;
      case OP_LT:
        return this.arith.mkLt(args[0], args[1]);
      case OP_GT:
        return this.arith.mkGt(args[0], args[1]);
      case OP_ADD:
        return this.arith.mkAdd(args) ?? -1;
      case OP_SUB:
        return this.arith.mkSub(args);
      case OP_UMINUS:
        return this.arith.mkUminus(args[0]);
      case OP_MUL:
        return this.arith.mkMul(args) ?? -1;
      case OP_IDIV:
        return this.arith.mkIdiv(args[0], args[1]) ?? -1;
      case OP_MOD:
        return this.arith.mkMod(args[0], args[1]) ?? -1;
      case OP_ABS:
        return this.arith.mkAbs(args[0]);
      case OP_DIV:
        return this.arith.mkDiv(args[0], args[1]) ?? -1;
      case OP_TO_REAL:
        return this.arith.mkToReal(args[0]) ?? -1;
      case OP_TO_INT:
        return this.arith.mkToInt(args[0]) ?? -1;
      case OP_IS_INT:
        return this.arith.mkIsInt(args[0]);
      default:
        return -1;
    }
  }

  mkNot(arg: number): number {
    const manager = this.manager;
    if (manager.isNot(arg)) return manager.getArg(arg, 0);
    if (manager.getOp(arg) === OP_EQ && manager.sorts[manager.getArg(arg, 0)] === SORT_BOOL)
      return this.mkEq(this.mkNot(manager.getArg(arg, 0)), manager.getArg(arg, 1));
    return manager.mkNot(arg);
  }

  mkOr(args: number[]): number {
    const manager = this.manager;
    const isNested = args.some((arg) => manager.getOp(arg) === OP_OR);
    const flatArgs = isNested ? this.flattenArgs(args, OP_OR) : args;
    const literals = manager.flatLiterals;
    literals.clear();
    for (const arg of flatArgs) {
      if (manager.isTrue(arg)) return manager.trueExpr;
      if (manager.isFalse(arg)) continue;
      if (literals.add(arg)) return manager.trueExpr;
    }
    const result = literals.list;
    const isOutOfOrder = result.some(
      (arg, index) => index > 0 && isAstLess(manager, arg, result[index - 1]),
    );
    if (isNested || result.length !== flatArgs.length || isOutOfOrder)
      sortByKey(result, (arg) => manager.ids[arg]);
    return manager.mkOr(result);
  }

  private mkAndCore(args: number[]): number | Rewrite {
    const manager = this.manager;
    if (this.options.isEliminatingAnd) return this.mkAndAsOr(args);
    if (!args.some((arg) => manager.getOp(arg) === OP_AND)) return this.mkNflatAnd(args);
    return { expr: this.mkNflatAnd(this.flattenArgs(args, OP_AND)), depth: 1 };
  }

  private flattenArgs(args: number[], op: number) {
    const manager = this.manager;
    const flatArgs: number[] = [];
    for (const arg of args)
      if (manager.getOp(arg) === op) manager.pushArgs(arg, flatArgs);
      else flatArgs.push(arg);
    return flatArgs;
  }

  mkAnd(args: number[]): number {
    const result = this.mkAndCore(args);
    return typeof result === "number" ? result : result.expr;
  }

  private mkNflatAnd(args: number[]) {
    const manager = this.manager;
    const literals = manager.flatLiterals;
    literals.clear();
    for (const arg of args) {
      if (manager.isTrue(arg)) continue;
      if (manager.isFalse(arg) || literals.add(arg)) return manager.falseExpr;
    }
    const result = literals.list;
    if (result.length === 0) return manager.trueExpr;
    return result.length === 1 ? result[0] : manager.mkAnd(result);
  }

  private mkAndAsOr(args: number[]) {
    const manager = this.manager;
    const negations = args.map((arg) => manager.withTemporaries(() => this.mkNot(arg)));
    const result = manager.withTemporaries(() => this.mkNot(this.mkOr(negations)));
    for (const negation of negations) manager.decRef(negation);
    manager.releaseLater(result);
    return result;
  }

  private tryIteEq(ite: number, other: number): Rewrite | undefined {
    const manager = this.manager;
    if (!this.isIte(ite)) return undefined;
    if (manager.getArg(ite, 1) === other && this.areDistinct(manager.getArg(ite, 2), other))
      return { expr: manager.getArg(ite, 0), depth: 1 };
    if (manager.getArg(ite, 2) === other && this.areDistinct(manager.getArg(ite, 1), other))
      return { expr: manager.mkNot(manager.getArg(ite, 0)), depth: 1 };
    return undefined;
  }

  private isIte(expr: number) {
    return this.manager.getOp(expr) === OP_ITE;
  }

  private areDistinct(first: number, second: number) {
    const manager = this.manager;
    return first !== second && manager.isUniqueValue(first) && manager.isUniqueValue(second);
  }

  private mkIteValueEq(left: number, right: number): number | Rewrite | undefined {
    const manager = this.manager;
    if (this.isIte(left) && manager.isUniqueValue(right)) return this.tryIteValue(left, right);
    if (this.isIte(right) && manager.isUniqueValue(left)) return this.tryIteValue(right, left);
    if (
      !this.isIte(left) ||
      !this.isIte(right) ||
      ![
        manager.getArg(left, 1),
        manager.getArg(left, 2),
        manager.getArg(right, 1),
        manager.getArg(right, 2),
      ].every((arg) => manager.isUniqueValue(arg))
    )
      return undefined;
    const mkOr = (args: number[]) => manager.mkApp(OP_OR, args, SORT_BOOL);
    const clauses = [
      mkOr([
        manager.getArg(left, 0),
        manager.getArg(right, 0),
        manager.mkEq(manager.getArg(left, 2), manager.getArg(right, 2)),
      ]),
    ];
    const leftNot = manager.mkNot(manager.getArg(left, 0));
    const rightNot = manager.mkNot(manager.getArg(right, 0));
    clauses.push(
      mkOr([leftNot, rightNot, manager.mkEq(manager.getArg(left, 1), manager.getArg(right, 1))]),
      mkOr([
        leftNot,
        manager.getArg(right, 0),
        manager.mkEq(manager.getArg(left, 1), manager.getArg(right, 2)),
      ]),
      mkOr([
        manager.getArg(left, 0),
        rightNot,
        manager.mkEq(manager.getArg(left, 2), manager.getArg(right, 1)),
      ]),
    );
    return { expr: manager.mkApp(OP_AND, clauses, SORT_BOOL), depth: Infinity };
  }

  private tryIteValue(ite: number, value: number): number | Rewrite | undefined {
    const manager = this.manager;
    const condition = manager.getArg(ite, 0);
    const thenExpr = manager.getArg(ite, 1);
    const elseExpr = manager.getArg(ite, 2);
    const write = (result: number) => {
      this.releaseResult();
      return result;
    };
    const mkBranchEq = (branch: number) =>
      write(manager.depths[branch] < 500 ? this.mkEq(branch, value) : manager.mkEq(branch, value));
    const mkPlainEq = (branch: number) =>
      branch === value
        ? manager.trueExpr
        : this.areDistinct(branch, value)
          ? manager.falseExpr
          : manager.mkEq(branch, value);
    const mkAnd = (first: number, second: number) =>
      manager.mkApp(OP_AND, [first, second], SORT_BOOL);
    const mkOr = (first: number, second: number) =>
      manager.mkApp(OP_OR, [first, second], SORT_BOOL);
    if (this.areDistinct(value, elseExpr))
      return { expr: mkAnd(mkBranchEq(thenExpr), condition), depth: 2 };
    if (this.areDistinct(value, thenExpr))
      return { expr: mkAnd(mkBranchEq(elseExpr), manager.mkNot(condition)), depth: 2 };
    if (value === thenExpr)
      return value === elseExpr
        ? manager.trueExpr
        : { expr: mkOr(write(this.mkEq(elseExpr, value)), condition), depth: 2 };
    if (value === elseExpr)
      return { expr: mkOr(write(this.mkEq(thenExpr, value)), manager.mkNot(condition)), depth: 2 };
    const isValueIte = (expr: number) =>
      this.isIte(expr) &&
      manager.isUniqueValue(manager.getArg(expr, 1)) &&
      manager.isUniqueValue(manager.getArg(expr, 2));
    const getExpr = (result: number | Rewrite) =>
      typeof result === "number" ? result : result.expr;
    const thenEq = isValueIte(thenExpr) ? this.tryIteValue(thenExpr, value) : undefined;
    if (thenEq !== undefined) {
      const branches = [getExpr(thenEq), mkPlainEq(elseExpr)];
      return { expr: manager.mkApp(OP_ITE, [condition, ...branches], SORT_BOOL), depth: 2 };
    }
    const elseEq = isValueIte(elseExpr) ? this.tryIteValue(elseExpr, value) : undefined;
    if (elseEq !== undefined) {
      const branches = [mkPlainEq(thenExpr), getExpr(elseEq)];
      return { expr: manager.mkApp(OP_ITE, [condition, ...branches], SORT_BOOL), depth: 2 };
    }
    this.releaseResult();
    return this.isDisjointFrom(ite, value) ? manager.falseExpr : undefined;
  }

  private isDisjointFrom(ite: number, value: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    const todo = [ite];
    while (todo.length > 0) {
      const expr = todo.pop() ?? ite;
      if (visited.has(expr)) continue;
      visited.add(expr);
      if (this.areDistinct(expr, value)) continue;
      if (!this.isIte(expr)) return false;
      todo.push(manager.getArg(expr, 1), manager.getArg(expr, 2));
    }
    return true;
  }

  mkEq(left: number, right: number): number {
    const result = this.mkEqCore(left, right);
    return result === undefined
      ? this.manager.mkEq(left, right)
      : typeof result === "number"
        ? result
        : result.expr;
  }

  private mkEqCore(inputLeft: number, inputRight: number): number | Rewrite | undefined {
    const manager = this.manager;
    if (inputLeft === inputRight) return manager.trueExpr;
    if (manager.isUniqueValue(inputLeft) && manager.isUniqueValue(inputRight))
      return manager.falseExpr;
    const iteEq = this.tryIteEq(inputLeft, inputRight) ?? this.tryIteEq(inputRight, inputLeft);
    if (iteEq !== undefined) return iteEq;
    const iteValueEq = this.mkIteValueEq(inputLeft, inputRight);
    if (iteValueEq !== undefined) return iteValueEq;
    if (manager.sorts[inputLeft] !== SORT_BOOL) return undefined;
    const isUnfolded = manager.isNot(inputLeft) && manager.isNot(inputRight);
    const left = isUnfolded ? manager.getArg(inputLeft, 0) : inputLeft;
    const right = isUnfolded ? manager.getArg(inputRight, 0) : inputRight;
    if (manager.isTrue(left)) return right;
    if (manager.isFalse(left)) return this.mkNot(right);
    if (manager.isTrue(right)) return left;
    if (manager.isFalse(right)) return this.mkNot(left);
    if (manager.isComplement(left, right)) return manager.falseExpr;
    const isSwapped = manager.isNot(right);
    const lhs = isSwapped ? right : left;
    const rhs = isSwapped ? left : right;
    if (manager.isNot(lhs))
      return { expr: manager.mkNot(manager.mkEq(manager.getArg(lhs, 0), rhs)), depth: 2 };
    if (isUnfolded) return { expr: manager.mkEq(lhs, rhs), depth: 1 };
    if (manager.getOp(lhs) === OP_EQ && manager.getOp(rhs) === OP_EQ) {
      const isNegationOf = (expr: number, other: number) =>
        manager.isNot(expr) && manager.getArg(expr, 0) === other;
      if (
        (manager.getArg(lhs, 0) === manager.getArg(rhs, 0) &&
          (isNegationOf(manager.getArg(rhs, 1), manager.getArg(lhs, 1)) ||
            isNegationOf(manager.getArg(lhs, 1), manager.getArg(rhs, 1)))) ||
        (manager.getArg(lhs, 1) === manager.getArg(rhs, 1) &&
          (isNegationOf(manager.getArg(rhs, 0), manager.getArg(lhs, 0)) ||
            isNegationOf(manager.getArg(lhs, 0), manager.getArg(rhs, 0))))
      )
        return manager.falseExpr;
    }
    return undefined;
  }

  // Z3 keeps a distinct of more than two arguments, which tlapm does not send, where this expands it into disequalities.
  private mkDistinct(args: number[]): number | Rewrite {
    if (args.length === 2) return { expr: this.mkNot(this.mkEq(args[0], args[1])), depth: 2 };
    const pairs: number[] = [];
    for (let left = 0; left < args.length; left++)
      for (let right = left + 1; right < args.length; right++)
        pairs.push(this.mkNot(this.mkEq(args[left], args[right])));
    return this.mkAnd(pairs);
  }

  private mkIte(inputCondition: number, inputThen: number, inputElse: number): number | Rewrite {
    const manager = this.manager;
    const isNegated = manager.isNot(inputCondition);
    const condition = isNegated ? manager.getArg(inputCondition, 0) : inputCondition;
    const elseCandidate = isNegated ? inputThen : inputElse;
    const thenCandidate = isNegated ? inputElse : inputThen;
    const thenExpr =
      this.isIte(thenCandidate) && manager.getArg(thenCandidate, 0) === condition
        ? manager.getArg(thenCandidate, 1)
        : thenCandidate;
    const sort = manager.sorts[thenExpr];
    if (this.isIte(elseCandidate) && manager.getArg(elseCandidate, 1) === thenExpr) {
      const disjunction = manager.mkApp(
        OP_OR,
        [condition, manager.getArg(elseCandidate, 0)],
        SORT_BOOL,
      );
      return {
        expr: manager.mkApp(
          OP_ITE,
          [disjunction, thenExpr, manager.getArg(elseCandidate, 2)],
          sort,
        ),
        depth: 3,
      };
    }
    const elseExpr =
      this.isIte(elseCandidate) && manager.getArg(elseCandidate, 0) === condition
        ? manager.getArg(elseCandidate, 2)
        : elseCandidate;
    if (manager.isTrue(condition)) return thenExpr;
    if (manager.isFalse(condition)) return elseExpr;
    if (thenExpr === elseExpr) return thenExpr;
    if (sort === SORT_BOOL) {
      if (manager.isTrue(thenExpr))
        return manager.isFalse(elseExpr) ? condition : this.mkOr([condition, elseExpr]);
      if (manager.isFalse(thenExpr))
        return manager.isTrue(elseExpr)
          ? this.mkNot(condition)
          : { expr: this.mkAnd([this.mkNot(condition), elseExpr]), depth: 1 };
      if (manager.isTrue(elseExpr)) return this.mkOr([this.mkNot(condition), thenExpr]);
      if (manager.isFalse(elseExpr) || elseExpr === condition)
        return { expr: this.mkAnd([condition, thenExpr]), depth: 1 };
      if (thenExpr === condition) return this.mkOr([condition, elseExpr]);
      if (
        (manager.isNot(thenExpr) && manager.getArg(thenExpr, 0) === elseExpr) ||
        (manager.isNot(elseExpr) && manager.getArg(elseExpr, 0) === thenExpr)
      )
        return this.mkEq(condition, thenExpr);
    }
    const isElseIte = this.isIte(elseExpr);
    if (this.isIte(thenExpr)) {
      if (elseExpr === manager.getArg(thenExpr, 1)) {
        const conjunction = this.mkAnd([condition, this.mkNot(manager.getArg(thenExpr, 0))]);
        return {
          expr: manager.mkApp(OP_ITE, [conjunction, manager.getArg(thenExpr, 2), elseExpr], sort),
          depth: 2,
        };
      }
      if (elseExpr === manager.getArg(thenExpr, 2)) {
        const conjunction = this.mkAnd([condition, manager.getArg(thenExpr, 0)]);
        return {
          expr: manager.mkApp(OP_ITE, [conjunction, manager.getArg(thenExpr, 1), elseExpr], sort),
          depth: 2,
        };
      }
      const isSameBranches =
        isElseIte &&
        manager.getArg(thenExpr, 1) === manager.getArg(elseExpr, 1) &&
        manager.getArg(thenExpr, 2) === manager.getArg(elseExpr, 2);
      const isSwappedBranches =
        isElseIte &&
        manager.getArg(thenExpr, 1) === manager.getArg(elseExpr, 2) &&
        manager.getArg(thenExpr, 2) === manager.getArg(elseExpr, 1);
      if (isSameBranches || isSwappedBranches) {
        const first = this.mkAnd([condition, manager.getArg(thenExpr, 0)]);
        const negation = this.mkNot(condition);
        const second = this.mkAnd([
          negation,
          isSameBranches ? manager.getArg(elseExpr, 0) : this.mkNot(manager.getArg(elseExpr, 0)),
        ]);
        const disjunction = this.mkOr([first, second]);
        return {
          expr: manager.mkApp(
            OP_ITE,
            [disjunction, manager.getArg(thenExpr, 1), manager.getArg(thenExpr, 2)],
            sort,
          ),
          depth: 3,
        };
      }
    }
    if (isElseIte) {
      if (thenExpr === manager.getArg(elseExpr, 1)) {
        const disjunction = this.mkOr([condition, manager.getArg(elseExpr, 0)]);
        return {
          expr: manager.mkApp(OP_ITE, [disjunction, thenExpr, manager.getArg(elseExpr, 2)], sort),
          depth: 1,
        };
      }
      if (thenExpr === manager.getArg(elseExpr, 2)) {
        const disjunction = this.mkOr([condition, this.mkNot(manager.getArg(elseExpr, 0))]);
        return {
          expr: manager.mkApp(OP_ITE, [disjunction, thenExpr, manager.getArg(elseExpr, 1)], sort),
          depth: 1,
        };
      }
    }
    return manager.mkApp(OP_ITE, [condition, thenExpr, elseExpr], sort);
  }

  mkAdd(args: number[]) {
    return this.arith.mkAdd(args) ?? this.arith.mkAddApp(args);
  }

  mkSub(first: number, second: number) {
    const result = this.arith.mkSub([first, second]);
    return typeof result === "number" ? result : result.expr;
  }
}
