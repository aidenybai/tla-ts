// Ported from Z3 (src/ast/rewriter/th_rewriter.cpp, bool_rewriter.cpp, arith_rewriter.cpp), MIT
// license, see z3-license.txt. Only the rewrites that tlapm's encoding exercises are ported.
import { ArithRewriter } from "./arith-rewriter";
import type { ArithRewriterOptions } from "./poly-rewriter";
import { isAstLess } from "./ast-lt";
import { applyDer } from "./der";
import {
  AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ABS,
  OP_ADD,
  OP_AND,
  OP_DISTINCT,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_SUB,
  OP_UMINUS,
  OP_XOR,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { type Rewrite, RewriterTpl } from "./rewriter-tpl";
import { elimUnusedVars } from "./var-subst";

export interface RewriterOptions {
  // Replaces (and a b) with (not (or (not a) (not b))), as Z3's asserted_formulas does after NNF.
  isEliminatingAnd: boolean;
  arith: ArithRewriterOptions;
  // rewrite_patterns: the patterns of a quantifier are rewritten like its body. The kernel's rewriters
  // set it, and the tactics' leave it off.
  isRewritingPatterns: boolean;
}

// The distinct literals of a flat conjunction or disjunction. It finds a complementary pair through
// the atoms of the negated literals, without creating each negation.
class FlatLiterals {
  readonly list: number[] = [];
  private seen = new Set<number>();
  private negatedAtoms = new Set<number>();

  constructor(private manager: AstManager) {}

  // Adds a literal, and returns whether its complement is already there.
  add(literal: number) {
    const manager = this.manager;
    if (this.seen.has(literal)) return false;
    const isNegated = manager.isNot(literal);
    if (isNegated ? this.seen.has(manager.args[literal][0]) : this.negatedAtoms.has(literal))
      return true;
    this.seen.add(literal);
    if (isNegated) this.negatedAtoms.add(manager.args[literal][0]);
    this.list.push(literal);
    return false;
  }
}

// rewriter_tpl with th_rewriter_cfg.
export class Rewriter extends RewriterTpl {
  private arith: ArithRewriter;
  private substitution = new Map<number, number>();

  constructor(
    manager: AstManager,
    private options: RewriterOptions,
    private isNestedDer = false,
  ) {
    super(manager);
    this.arith = new ArithRewriter(manager, options.arith);
  }

  // Rewrites the top depth levels of a term, outside the main loop.
  private reduceTo(expr: number, depth: number): number {
    const manager = this.manager;
    if (depth === 0 || manager.kinds[expr] !== KIND_APP || manager.args[expr].length === 0)
      return expr;
    return this.mkAppCore(
      manager.decls[expr],
      manager.args[expr].map((arg) => this.reduceTo(arg, depth - 1)),
      manager.sorts[expr],
    );
  }

  // updt_params with elim_and, which asserted_formulas turns on after NNF. The caller resets the
  // rewriter.
  setEliminatingAnd(isEliminatingAnd: boolean) {
    this.options = { ...this.options, isEliminatingAnd };
  }

  // th_rewriter::set_substitution: rewrites replace each key of the substitution with its value, and
  // the rewriter is reset. The caller may extend the substitution between rewrites without a reset.
  setSubstitution(substitution: Map<number, number>) {
    this.substitution = substitution;
    this.reset();
  }

  protected getSubst(expr: number) {
    return this.substitution.get(expr);
  }

  // flat_assoc: th_rewriter flattens and, or and + into an enclosing application of the same
  // operator.
  protected isFlatAssoc(decl: number) {
    const op = this.manager.funcDecls[decl].op;
    return op === OP_AND || op === OP_OR || op === OP_ADD;
  }

  protected isRewritingPatterns() {
    return this.options.isRewritingPatterns;
  }

  protected reduceApp(decl: number, args: number[], sort: number) {
    return this.manager.withTemporaries(
      () => this.reduceAppCore(decl, args, sort),
      (result) => [typeof result === "number" ? result : result.expr],
    );
  }

  protected reduceQuantifier(expr: number, body: number, patterns: number[]) {
    return this.manager.withTemporaries(() => this.reduceQuantifierCore(expr, body, patterns));
  }

  // th_rewriter_cfg::reduce_quantifier: a bound Boolean variable among the conjuncts of a universal
  // body or the disjuncts of an existential one decides the quantifier. Otherwise it merges a
  // directly nested quantifier of the same kind when neither has patterns, eliminates unused
  // variables, and applies der to pattern-free quantifiers.
  private reduceQuantifierCore(expr: number, body: number, newPatterns: number[]) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const isNegated = manager.isNot(body);
    const junction = isNegated ? manager.args[body][0] : body;
    if (
      manager.getOp(junction) === (data.isForall !== isNegated ? OP_AND : OP_OR) &&
      manager.args[junction].some((arg) => {
        const atom = manager.isNot(arg) ? manager.args[arg][0] : arg;
        return manager.kinds[atom] === KIND_VAR && manager.values[atom] < data.sorts.length;
      })
    )
      return data.isForall ? manager.falseExpr : manager.trueExpr;
    const nested =
      manager.kinds[body] === KIND_QUANTIFIER ? manager.getQuantifier(body) : undefined;
    // remove_duplicates.
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
    const reduced = elimUnusedVars(manager, merged);
    if (
      manager.kinds[reduced] !== KIND_QUANTIFIER ||
      manager.getQuantifier(reduced).patterns.length > 0
    )
      return reduced;
    const eliminated = applyDer(manager, reduced);
    if (eliminated === reduced || this.isNestedDer) return eliminated;
    const nestedRewriter = new Rewriter(manager, this.options, true);
    const rewritten = nestedRewriter.rewrite(eliminated);
    nestedRewriter.release();
    manager.releaseLater(rewritten);
    return rewritten;
  }

  // th_rewriter_cfg::apply_subst: the substitution replaces terms in the patterns without rewriting
  // them, like expr_safe_replace.
  private substitutePatterns(patterns: number[]) {
    const manager = this.manager;
    if (this.substitution.size === 0) return patterns;
    const cache = new Map<number, number>();
    const replace = (expr: number): number => {
      const replacement = this.substitution.get(expr);
      if (replacement !== undefined) return replacement;
      if (manager.kinds[expr] !== KIND_APP || manager.args[expr].length === 0) return expr;
      const cached = cache.get(expr);
      if (cached !== undefined) return cached;
      const result = manager.mkApp(
        manager.decls[expr],
        manager.args[expr].map(replace),
        manager.sorts[expr],
      );
      cache.set(expr, result);
      return result;
    };
    return patterns.map((pattern) => manager.mkPattern(manager.args[pattern].map(replace)));
  }

  // th_rewriter's mk_app, with the result of a Rewrite rewritten again.
  mkAppCore(decl: number, args: number[], sort: number): number {
    const reduced = this.reduceAppCore(decl, args, sort);
    return typeof reduced === "number" ? reduced : this.reduceTo(reduced.expr, reduced.depth);
  }

  private reduceAppCore(decl: number, args: number[], sort: number): number | Rewrite {
    const manager = this.manager;
    this.checkLimit();
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
          (manager.sorts[args[0]] === SORT_INT ? this.arith.mkEq(args[0], args[1]) : undefined) ??
          this.mkEqCore(args[0], args[1]) ??
          manager.mkEq(args[0], args[1])
        );
      case OP_DISTINCT:
        return this.mkDistinct(args);
      case OP_ITE:
        return this.mkIte(args[0], args[1], args[2]);
      case OP_LE:
        return this.arith.mkLe(args[0], args[1]) ?? manager.mkApp(decl, args, sort);
      case OP_GE:
        return this.arith.mkGe(args[0], args[1]) ?? manager.mkApp(decl, args, sort);
      case OP_LT:
        return this.arith.mkLt(args[0], args[1]);
      case OP_GT:
        return this.arith.mkGt(args[0], args[1]);
      case OP_ADD:
        return this.arith.mkAdd(args) ?? manager.mkApp(decl, args, sort);
      case OP_SUB:
        return this.arith.mkSub(args);
      case OP_UMINUS:
        return this.arith.mkUminus(args[0]);
      case OP_MUL:
        return this.arith.mkMul(args) ?? manager.mkApp(decl, args, sort);
      case OP_IDIV:
        return this.arith.mkIdiv(args[0], args[1]) ?? manager.mkApp(decl, args, sort);
      case OP_MOD:
        return this.arith.mkMod(args[0], args[1]) ?? manager.mkApp(decl, args, sort);
      case OP_ABS:
        return this.arith.mkAbs(args[0]);
      default:
        return manager.mkApp(decl, args, sort);
    }
  }

  // bool_rewriter::mk_not: (not (= a b)) of Booleans is (= (not a) b).
  mkNot(arg: number): number {
    const manager = this.manager;
    if (manager.isNot(arg)) return manager.args[arg][0];
    if (manager.getOp(arg) === OP_EQ && manager.sorts[manager.args[arg][0]] === SORT_BOOL)
      return this.mkEq(this.mkNot(manager.args[arg][0]), manager.args[arg][1]);
    return manager.mkNot(arg);
  }

  // bool_rewriter::mk_flat_or_core and mk_nflat_or_core: lifts the disjuncts of nested disjunctions
  // one level, drops false and duplicates, and detects true or a complementary pair. With
  // sort_disjunctions, a disjunction that changed or is out of ast_lt's order is stably sorted by id.
  mkOr(args: number[]): number {
    const manager = this.manager;
    const isNested = args.some((arg) => manager.getOp(arg) === OP_OR);
    const flatArgs = isNested
      ? args.flatMap((arg) => (manager.getOp(arg) === OP_OR ? manager.args[arg] : [arg]))
      : args;
    const literals = new FlatLiterals(manager);
    let numCandidates = 0;
    for (const arg of flatArgs) {
      if (manager.isTrue(arg)) return manager.trueExpr;
      if (manager.isFalse(arg)) continue;
      numCandidates++;
      if (literals.add(arg)) return manager.trueExpr;
    }
    const result = literals.list;
    const isOutOfOrder = result.some(
      (arg, index) => index > 0 && isAstLess(manager, arg, result[index - 1]),
    );
    if (isNested || numCandidates !== flatArgs.length || isOutOfOrder)
      result.sort((first, second) => manager.ids[first] - manager.ids[second]);
    return manager.mkOr(result);
  }

  // bool_rewriter::mk_and_core: with elim_and, mk_and_as_or. Otherwise mk_flat_and_core lifts the
  // conjuncts of nested conjunctions one level, and has the result rewritten again.
  private mkAndCore(args: number[]): number | Rewrite {
    const manager = this.manager;
    if (this.options.isEliminatingAnd) return this.mkAndAsOr(args);
    if (!args.some((arg) => manager.getOp(arg) === OP_AND)) return this.mkNflatAnd(args);
    const flatArgs = args.flatMap((arg) =>
      manager.getOp(arg) === OP_AND ? manager.args[arg] : [arg],
    );
    return { expr: this.mkNflatAnd(flatArgs), depth: 1 };
  }

  // bool_rewriter::mk_and, which takes the result of mk_and_core as it is.
  mkAnd(args: number[]): number {
    const result = this.mkAndCore(args);
    return typeof result === "number" ? result : result.expr;
  }

  // bool_rewriter::mk_nflat_and_core: drops true and duplicates, and detects false or a complementary
  // pair.
  private mkNflatAnd(args: number[]) {
    const manager = this.manager;
    const literals = new FlatLiterals(manager);
    for (const arg of args) {
      if (manager.isTrue(arg)) continue;
      if (manager.isFalse(arg) || literals.add(arg)) return manager.falseExpr;
    }
    const result = literals.list;
    if (result.length === 0) return manager.trueExpr;
    return result.length === 1 ? result[0] : manager.mkAnd(result);
  }

  // bool_rewriter::mk_and_as_or: the negation of the disjunction of the negated conjuncts. Each
  // negation is built with its own temporaries, and the negations outlive the disjunction.
  private mkAndAsOr(args: number[]) {
    const manager = this.manager;
    const negations = args.map((arg) => manager.withTemporaries(() => this.mkNot(arg)));
    const result = manager.withTemporaries(() => this.mkNot(this.mkOr(negations)));
    for (const negation of negations) manager.decRef(negation);
    manager.releaseLater(result);
    return result;
  }

  // try_ite_eq: (ite c t e) = t is c when e is a value distinct from t, and likewise for e.
  private tryIteEq(ite: number, other: number) {
    const manager = this.manager;
    if (manager.getOp(ite) !== OP_ITE) return undefined;
    const args = manager.args[ite];
    if (args[1] === other && this.areDistinct(args[2], other)) return args[0];
    if (args[2] === other && this.areDistinct(args[1], other)) return this.mkNot(args[0]);
    return undefined;
  }

  private isIte(expr: number) {
    return this.manager.getOp(expr) === OP_ITE;
  }

  private areDistinct(first: number, second: number) {
    const manager = this.manager;
    return first !== second && manager.isUniqueValue(first) && manager.isUniqueValue(second);
  }

  // The ite_extra_rules of mk_eq_core: an ite against a value, or two ites of values.
  private mkIteValueEq(left: number, right: number) {
    const manager = this.manager;
    if (this.isIte(left) && manager.isUniqueValue(right)) return this.tryIteValue(left, right);
    if (this.isIte(right) && manager.isUniqueValue(left)) return this.tryIteValue(right, left);
    const leftArgs = manager.args[left];
    const rightArgs = manager.args[right];
    if (
      !this.isIte(left) ||
      !this.isIte(right) ||
      ![leftArgs[1], leftArgs[2], rightArgs[1], rightArgs[2]].every((arg) =>
        manager.isUniqueValue(arg),
      )
    )
      return undefined;
    const leftNot = this.mkNot(leftArgs[0]);
    const rightNot = this.mkNot(rightArgs[0]);
    return this.mkAnd([
      this.mkOr([leftArgs[0], rightArgs[0], this.mkEq(leftArgs[2], rightArgs[2])]),
      this.mkOr([leftNot, rightNot, this.mkEq(leftArgs[1], rightArgs[1])]),
      this.mkOr([leftNot, rightArgs[0], this.mkEq(leftArgs[1], rightArgs[2])]),
      this.mkOr([leftArgs[0], rightNot, this.mkEq(leftArgs[2], rightArgs[1])]),
    ]);
  }

  // try_ite_value: (ite c t e) = v for a value v.
  private tryIteValue(ite: number, value: number): number | undefined {
    const manager = this.manager;
    const args = manager.args[ite];
    const condition = args[0];
    const thenExpr = args[1];
    const elseExpr = args[2];
    // Z3 rewrites the equality of a branch only below depth 500.
    const mkBranchEq = (branch: number) =>
      manager.depths[branch] < 500 ? this.mkEq(branch, value) : manager.mkEq(branch, value);
    if (this.areDistinct(value, elseExpr)) return this.mkAnd([mkBranchEq(thenExpr), condition]);
    if (this.areDistinct(value, thenExpr))
      return this.mkAnd([mkBranchEq(elseExpr), this.mkNot(condition)]);
    if (value === thenExpr)
      return value === elseExpr
        ? manager.trueExpr
        : this.mkOr([this.mkEq(elseExpr, value), condition]);
    if (value === elseExpr) return this.mkOr([this.mkEq(thenExpr, value), this.mkNot(condition)]);
    const isValueIte = (expr: number) =>
      this.isIte(expr) &&
      manager.isUniqueValue(manager.args[expr][1]) &&
      manager.isUniqueValue(manager.args[expr][2]);
    const thenEq = isValueIte(thenExpr) ? this.tryIteValue(thenExpr, value) : undefined;
    if (thenEq !== undefined) return this.mkIte(condition, thenEq, this.mkEq(elseExpr, value));
    const elseEq = isValueIte(elseExpr) ? this.tryIteValue(elseExpr, value) : undefined;
    if (elseEq !== undefined) return this.mkIte(condition, this.mkEq(thenExpr, value), elseEq);
    return this.isDisjointFrom(ite, value) ? manager.falseExpr : undefined;
  }

  // simplify_eq_ite: whether every leaf of a tree of ites is a value distinct from the value.
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
      todo.push(manager.args[expr][1], manager.args[expr][2]);
    }
    return true;
  }

  // bool_rewriter::mk_eq, which does not rewrite the result of mk_eq_core again.
  mkEq(left: number, right: number): number {
    const result = this.mkEqCore(left, right);
    return result === undefined
      ? this.manager.mkEq(left, right)
      : typeof result === "number"
        ? result
        : result.expr;
  }

  // bool_rewriter::mk_eq_core, after arith_rewriter::mk_eq_core folds numerals.
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
    const left = isUnfolded ? manager.args[inputLeft][0] : inputLeft;
    const right = isUnfolded ? manager.args[inputRight][0] : inputRight;
    if (manager.isTrue(left)) return right;
    if (manager.isFalse(left)) return this.mkNot(right);
    if (manager.isTrue(right)) return left;
    if (manager.isFalse(right)) return this.mkNot(left);
    if (manager.isComplement(left, right)) return manager.falseExpr;
    const isSwapped = manager.isNot(right);
    const lhs = isSwapped ? right : left;
    const rhs = isSwapped ? left : right;
    if (manager.isNot(lhs))
      return { expr: manager.mkNot(manager.mkEq(manager.args[lhs][0], rhs)), depth: 2 };
    if (isUnfolded) return { expr: manager.mkEq(lhs, rhs), depth: 1 };
    // (= (= a b) (= a (not b))) is false.
    if (manager.getOp(lhs) === OP_EQ && manager.getOp(rhs) === OP_EQ) {
      const leftArgs = manager.args[lhs];
      const rightArgs = manager.args[rhs];
      const isNegationOf = (expr: number, other: number) =>
        manager.isNot(expr) && manager.args[expr][0] === other;
      if (
        (leftArgs[0] === rightArgs[0] &&
          (isNegationOf(rightArgs[1], leftArgs[1]) || isNegationOf(leftArgs[1], rightArgs[1]))) ||
        (leftArgs[1] === rightArgs[1] &&
          (isNegationOf(rightArgs[0], leftArgs[0]) || isNegationOf(leftArgs[0], rightArgs[0])))
      )
        return manager.falseExpr;
    }
    return undefined;
  }

  // bool_rewriter::mk_distinct_core: two arguments become a disequality, which the main loop rewrites
  // again, since mk_eq may dispatch to other rewriters. Z3 keeps a longer distinct, which tlapm does
  // not send, and this port expands it into disequalities.
  private mkDistinct(args: number[]): number | Rewrite {
    if (args.length === 2) return { expr: this.mkNot(this.mkEq(args[0], args[1])), depth: 2 };
    const pairs: number[] = [];
    for (let left = 0; left < args.length; left++)
      for (let right = left + 1; right < args.length; right++)
        pairs.push(this.mkNot(this.mkEq(args[left], args[right])));
    return this.mkAnd(pairs);
  }

  // bool_rewriter::mk_ite_core, with elim_ite and ite_extra_rules.
  mkIte(condition: number, thenExpr: number, elseExpr: number): number {
    const manager = this.manager;
    // (ite (not c) a b) is (ite c b a).
    if (manager.isNot(condition)) return this.mkIte(manager.args[condition][0], elseExpr, thenExpr);
    const isThenIte = manager.getOp(thenExpr) === OP_ITE;
    const isElseIte = manager.getOp(elseExpr) === OP_ITE;
    const thenArgs = manager.args[thenExpr];
    const elseArgs = manager.args[elseExpr];
    // (ite c (ite c t1 t2) t3) is (ite c t1 t3).
    if (isThenIte && thenArgs[0] === condition) return this.mkIte(condition, thenArgs[1], elseExpr);
    // (ite c t1 (ite c2 t1 t2)) is (ite (or c c2) t1 t2).
    if (isElseIte && elseArgs[1] === thenExpr)
      return this.mkIte(this.mkOr([condition, elseArgs[0]]), thenExpr, elseArgs[2]);
    // (ite c t1 (ite c t2 t3)) is (ite c t1 t3).
    if (isElseIte && elseArgs[0] === condition) return this.mkIte(condition, thenExpr, elseArgs[2]);
    if (manager.isTrue(condition)) return thenExpr;
    if (manager.isFalse(condition)) return elseExpr;
    if (thenExpr === elseExpr) return thenExpr;
    if (manager.sorts[thenExpr] === SORT_BOOL) {
      if (manager.isTrue(thenExpr))
        return manager.isFalse(elseExpr) ? condition : this.mkOr([condition, elseExpr]);
      if (manager.isFalse(thenExpr))
        return manager.isTrue(elseExpr)
          ? this.mkNot(condition)
          : this.mkAnd([this.mkNot(condition), elseExpr]);
      if (manager.isTrue(elseExpr)) return this.mkOr([this.mkNot(condition), thenExpr]);
      if (manager.isFalse(elseExpr)) return this.mkAnd([condition, thenExpr]);
      if (elseExpr === condition) return this.mkAnd([condition, thenExpr]);
      if (thenExpr === condition) return this.mkOr([condition, elseExpr]);
      if (manager.isComplement(thenExpr, elseExpr)) return this.mkEq(condition, thenExpr);
    }
    if (isThenIte) {
      // (ite c1 (ite c2 t1 t2) t1) is (ite (and c1 (not c2)) t2 t1).
      if (elseExpr === thenArgs[1])
        return this.mkIte(this.mkAnd([condition, this.mkNot(thenArgs[0])]), thenArgs[2], elseExpr);
      // (ite c1 (ite c2 t1 t2) t2) is (ite (and c1 c2) t1 t2).
      if (elseExpr === thenArgs[2])
        return this.mkIte(this.mkAnd([condition, thenArgs[0]]), thenArgs[1], elseExpr);
      // (ite c1 (ite c2 t1 t2) (ite c3 t1 t2)) is (ite (or (and c1 c2) (and (not c1) c3)) t1 t2),
      // and with (ite c3 t2 t1) the last conjunct is (not c3).
      const isSameBranches =
        isElseIte && thenArgs[1] === elseArgs[1] && thenArgs[2] === elseArgs[2];
      const isSwappedBranches =
        isElseIte && thenArgs[1] === elseArgs[2] && thenArgs[2] === elseArgs[1];
      if (isSameBranches || isSwappedBranches)
        return this.mkIte(
          this.mkOr([
            this.mkAnd([condition, thenArgs[0]]),
            this.mkAnd([
              this.mkNot(condition),
              isSameBranches ? elseArgs[0] : this.mkNot(elseArgs[0]),
            ]),
          ]),
          thenArgs[1],
          thenArgs[2],
        );
    }
    // (ite c1 t1 (ite c2 t2 t1)) is (ite (or c1 (not c2)) t1 t2).
    if (isElseIte && thenExpr === elseArgs[2])
      return this.mkIte(this.mkOr([condition, this.mkNot(elseArgs[0])]), thenExpr, elseArgs[1]);
    return manager.mkApp(OP_ITE, [condition, thenExpr, elseExpr], manager.sorts[thenExpr]);
  }

  mkAdd(args: number[]) {
    return this.arith.mkAdd(args) ?? this.arith.mkAddApp(args);
  }
}
