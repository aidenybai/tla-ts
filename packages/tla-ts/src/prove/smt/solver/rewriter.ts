// Ported from Z3 (src/ast/rewriter/th_rewriter.cpp, bool_rewriter.cpp, arith_rewriter.cpp), MIT
// license, see z3-license.txt. Only the rewrites that tlapm's encoding exercises are ported.
import { ArithRewriter } from "./arith-rewriter";
import type { ArithRewriterOptions } from "./poly-rewriter";
import { isAstLess } from "./ast-lt";
import { Der } from "./der";
import {
  AstManager,
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

export interface RewriterOptions {
  // Replaces (and a b) with (not (or (not a) (not b))), as Z3's asserted_formulas does after NNF.
  isEliminatingAnd: boolean;
  arith: ArithRewriterOptions;
  // rewrite_patterns: the patterns of a quantifier are rewritten like its body. The kernel's rewriters
  // set it, and the tactics' leave it off.
  isRewritingPatterns: boolean;
  // pull_cheap_ite: a binary predicate or a function of an ite with values distributes over the ite.
  isPullingCheapIte?: boolean;
}

// The distinct literals of a flat conjunction or disjunction. It finds a complementary pair through
// the atoms of the negated literals, without creating each negation. A short list is searched
// directly, and a long one through sets.
// The literals of a flattened conjunction or disjunction, without duplicates. Like the
// expr_fast_mark1 and expr_fast_mark2 of mk_nflat_and_core, it marks the literals and the negated
// atoms it holds, here with a stamp for each use.
class FlatLiterals {
  list: number[] = [];
  private stamp = 0;
  private literalStamps = new Int32Array(1024);
  private negatedAtomStamps = new Int32Array(1024);

  constructor(private manager: AstManager) {}

  // Starts a new, empty list.
  clear() {
    this.list = [];
    this.stamp++;
  }

  // Adds a literal, and returns whether its complement is already there. An expression's arguments
  // are older than it, so their ids are smaller.
  add(literal: number) {
    const manager = this.manager;
    if (literal >= this.literalStamps.length) {
      const size = Math.max(2 * this.literalStamps.length, literal + 1);
      const literalStamps = new Int32Array(size);
      literalStamps.set(this.literalStamps);
      this.literalStamps = literalStamps;
      const negatedAtomStamps = new Int32Array(size);
      negatedAtomStamps.set(this.negatedAtomStamps);
      this.negatedAtomStamps = negatedAtomStamps;
    }
    if (this.literalStamps[literal] === this.stamp) return false;
    const isNegated = manager.isNot(literal);
    const atom = isNegated ? manager.args[literal][0] : literal;
    if (
      isNegated
        ? this.literalStamps[atom] === this.stamp
        : this.negatedAtomStamps[atom] === this.stamp
    )
      return true;
    this.list.push(literal);
    this.literalStamps[literal] = this.stamp;
    if (isNegated) this.negatedAtomStamps[atom] = this.stamp;
    return false;
  }
}

// A term that reduceTo is rewriting: the depth left for its arguments, its next argument, and where
// its arguments' results start.
interface ReduceFrame {
  expr: number;
  depth: number;
  childIndex: number;
  spos: number;
}

// rewriter_tpl with th_rewriter_cfg.
export class Rewriter extends RewriterTpl {
  private arith: ArithRewriter;
  private substitution = new Map<number, number>();
  private literals = new FlatLiterals(this.manager);
  private unusedVarsEliminator: UnusedVarsEliminator;
  private der: Der;
  // try_ite_value writes the result of reduce_app, which is the m_r of the rewriter that applies
  // this one, as it goes: the first write releases what m_r held.
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

  // ~imp: the members of th_rewriter_cfg go before the caches of rewriter_tpl.
  release() {
    this.unusedVarsEliminator.release();
    this.der.release();
    super.release();
  }

  // Rewrites the top depth levels of a term, outside the main loop. Like rewriter_tpl, it keeps its
  // frames on an explicit stack, so a deep term or a long chain of rewrites cannot overflow the call
  // stack.
  private reduceTo(expr: number, depth: number): number {
    const manager = this.manager;
    const frames: ReduceFrame[] = [];
    const results: number[] = [];
    const visit = (term: number, termDepth: number) => {
      if (termDepth === 0 || manager.kinds[term] !== KIND_APP || manager.args[term].length === 0)
        results.push(term);
      else frames.push({ expr: term, depth: termDepth - 1, childIndex: 0, spos: results.length });
    };
    visit(expr, depth);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      const args = manager.args[frame.expr];
      if (frame.childIndex < args.length) {
        visit(args[frame.childIndex++], frame.depth);
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

  getSubst(expr: number) {
    return this.substitution.size === 0 ? undefined : this.substitution.get(expr);
  }

  // flat_assoc: th_rewriter flattens and, or and + into an enclosing application of the same
  // operator.
  isFlatAssoc(decl: number) {
    const op = this.manager.funcDecls[decl].op;
    return op === OP_AND || op === OP_OR || op === OP_ADD;
  }

  isRewritingPatterns() {
    return this.options.isRewritingPatterns;
  }

  reduceApp(decl: number, args: number[], sort: number) {
    // An uninterpreted application only reduces by pull_ite, which needs two arguments.
    if (
      this.manager.funcDecls[decl].op === OP_UNINTERPRETED &&
      (args.length !== 2 || this.options.isPullingCheapIte !== true)
    )
      return -1;
    return this.manager.withTemporaries(
      () => this.reduceAppTop(decl, args, sort),
      (result) => (result === -1 ? [] : [typeof result === "number" ? result : result.expr]),
    );
  }

  reduceQuantifier(expr: number, body: number, patterns: number[]) {
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

  // th_rewriter::mk_app: one reduction, without rewriting what it returns.
  mkApp(decl: number, args: number[], sort: number) {
    const reduced = this.reduceAppTop(decl, args, sort);
    return reduced === -1
      ? this.manager.mkApp(decl, args, sort)
      : typeof reduced === "number"
        ? reduced
        : reduced.expr;
  }

  // th_rewriter's mk_app, with the result of a Rewrite rewritten again.
  mkAppCore(decl: number, args: number[], sort: number): number {
    const reduced = this.reduceAppTop(decl, args, sort);
    return reduced === -1
      ? this.manager.mkApp(decl, args, sort)
      : typeof reduced === "number"
        ? reduced
        : this.reduceTo(reduced.expr, getRewriteDepth(reduced));
  }

  // th_rewriter_cfg::reduce_app: reduce_app_core, then pull_ite with pull_cheap_ite. -1 is BR_FAILED.
  private reduceAppTop(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const reduced = this.reduceAppCore(decl, args);
    if (typeof reduced !== "number" || this.options.isPullingCheapIte !== true) return reduced;
    if (reduced === -1) return this.pullIte(decl, args, sort) ?? -1;
    return manager.kinds[reduced] === KIND_APP
      ? (this.pullIte(manager.decls[reduced], manager.args[reduced], manager.sorts[reduced]) ??
          reduced)
      : reduced;
  }

  // pull_ite: (p (ite c a b) v) is (ite c (p a v) (p b v)) for a value v, and likewise for
  // (p (ite c a b) (ite c a' b')) and a value first.
  private pullIte(decl: number, args: number[], sort: number): Rewrite | undefined {
    const manager = this.manager;
    if (args.length !== 2) return undefined;
    const first = args[0];
    const second = args[1];
    if (sort === SORT_BOOL && manager.sorts[first] !== SORT_BOOL) {
      if (this.isIte(first)) {
        if (manager.isUniqueValue(second) && manager.getRefCount(first) === 1)
          return this.pullIteCore(decl, first, second, sort, false);
        if (this.isIte(second) && manager.args[first][0] === manager.args[second][0]) {
          const branches = [1, 2].map((index) =>
            manager.mkApp(decl, [manager.args[first][index], manager.args[second][index]], sort),
          );
          return {
            expr: manager.mkApp(OP_ITE, [manager.args[first][0], ...branches], SORT_BOOL),
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

  // pull_ite_core: the value comes first when isSwapped. An equality of a branch and the value is
  // decided when the branch is a value.
  private pullIteCore(
    decl: number,
    ite: number,
    value: number,
    sort: number,
    isSwapped: boolean,
  ): Rewrite {
    const manager = this.manager;
    const iteArgs = manager.args[ite];
    const branches = [iteArgs[1], iteArgs[2]].map((branch) =>
      manager.funcDecls[decl].op === OP_EQ
        ? branch === value
          ? manager.trueExpr
          : this.areDistinct(branch, value)
            ? manager.falseExpr
            : manager.mkEq(branch, value)
        : manager.mkApp(decl, isSwapped ? [value, branch] : [branch, value], sort),
    );
    return { expr: manager.mkApp(OP_ITE, [iteArgs[0], ...branches], sort), depth: 2 };
  }

  // is_ite_value_tree: an unshared ite whose leaves are values, through unshared ites.
  private isIteValueTree(expr: number) {
    const manager = this.manager;
    if (!this.isIte(expr) || manager.getRefCount(expr) !== 1) return false;
    const todo = [expr];
    while (todo.length > 0) {
      const ite = todo.pop() as number;
      for (const branch of [manager.args[ite][1], manager.args[ite][2]]) {
        if (this.isIte(branch) && manager.getRefCount(branch) === 1) todo.push(branch);
        else if (!manager.isUniqueValue(branch)) return false;
      }
    }
    return true;
  }

  // The reductions of the Boolean and arithmetic rewriters, which the model evaluator applies too.
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
    const literals = this.literals;
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
    // Dropping false or a duplicate disjunct also sets mk_nflat_or_core's s.
    if (isNested || result.length !== flatArgs.length || isOutOfOrder)
      sortByKey(result, (arg) => manager.ids[arg]);
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
    const literals = this.literals;
    literals.clear();
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

  // try_ite_eq: (ite c t e) = t is c when e is a value distinct from t, and likewise for e. The main
  // loop rewrites the result again.
  private tryIteEq(ite: number, other: number): Rewrite | undefined {
    const manager = this.manager;
    if (!this.isIte(ite)) return undefined;
    const args = manager.args[ite];
    if (args[1] === other && this.areDistinct(args[2], other)) return { expr: args[0], depth: 1 };
    if (args[2] === other && this.areDistinct(args[1], other))
      return { expr: manager.mkNot(args[0]), depth: 1 };
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
  private mkIteValueEq(left: number, right: number): number | Rewrite | undefined {
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
    const mkOr = (args: number[]) => manager.mkApp(OP_OR, args, SORT_BOOL);
    const clauses = [mkOr([leftArgs[0], rightArgs[0], manager.mkEq(leftArgs[2], rightArgs[2])])];
    const leftNot = manager.mkNot(leftArgs[0]);
    const rightNot = manager.mkNot(rightArgs[0]);
    clauses.push(
      mkOr([leftNot, rightNot, manager.mkEq(leftArgs[1], rightArgs[1])]),
      mkOr([leftNot, rightArgs[0], manager.mkEq(leftArgs[1], rightArgs[2])]),
      mkOr([leftArgs[0], rightNot, manager.mkEq(leftArgs[2], rightArgs[1])]),
    );
    return { expr: manager.mkApp(OP_AND, clauses, SORT_BOOL), depth: Infinity };
  }

  // try_ite_value: (ite c t e) = v for a value v. It builds its results without rewriting them, and
  // the main loop rewrites them again.
  private tryIteValue(ite: number, value: number): number | Rewrite | undefined {
    const manager = this.manager;
    const args = manager.args[ite];
    const condition = args[0];
    const thenExpr = args[1];
    const elseExpr = args[2];
    // An equality of a branch is the first write to the result.
    const write = (result: number) => {
      this.releaseResult();
      return result;
    };
    // Z3 rewrites the equality of a branch only below depth 500.
    const mkBranchEq = (branch: number) =>
      write(manager.depths[branch] < 500 ? this.mkEq(branch, value) : manager.mkEq(branch, value));
    // mk_eq_plain.
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
      manager.isUniqueValue(manager.args[expr][1]) &&
      manager.isUniqueValue(manager.args[expr][2]);
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
    // simplify_eq_ite's result is written even when it is null.
    this.releaseResult();
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

  // bool_rewriter::mk_ite_core with elim_ite and ite_extra_rules. It applies the rules that change
  // only the condition or a branch in sequence, and a result that it builds from new terms comes as a
  // Rewrite for the main loop.
  private mkIte(inputCondition: number, inputThen: number, inputElse: number): number | Rewrite {
    const manager = this.manager;
    const isNegated = manager.isNot(inputCondition);
    const condition = isNegated ? manager.args[inputCondition][0] : inputCondition;
    const elseCandidate = isNegated ? inputThen : inputElse;
    const thenCandidate = isNegated ? inputElse : inputThen;
    // (ite c (ite c t1 t2) t3) is (ite c t1 t3).
    const thenExpr =
      this.isIte(thenCandidate) && manager.args[thenCandidate][0] === condition
        ? manager.args[thenCandidate][1]
        : thenCandidate;
    const sort = manager.sorts[thenExpr];
    // (ite c t1 (ite c2 t1 t2)) is (ite (or c c2) t1 t2).
    if (this.isIte(elseCandidate) && manager.args[elseCandidate][1] === thenExpr) {
      const elseArgs = manager.args[elseCandidate];
      const disjunction = manager.mkApp(OP_OR, [condition, elseArgs[0]], SORT_BOOL);
      return { expr: manager.mkApp(OP_ITE, [disjunction, thenExpr, elseArgs[2]], sort), depth: 3 };
    }
    // (ite c t1 (ite c t2 t3)) is (ite c t1 t3).
    const elseExpr =
      this.isIte(elseCandidate) && manager.args[elseCandidate][0] === condition
        ? manager.args[elseCandidate][2]
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
      // is_complement_core: one branch is the negation of the other.
      if (
        (manager.isNot(thenExpr) && manager.args[thenExpr][0] === elseExpr) ||
        (manager.isNot(elseExpr) && manager.args[elseExpr][0] === thenExpr)
      )
        return this.mkEq(condition, thenExpr);
    }
    const isElseIte = this.isIte(elseExpr);
    const elseArgs = manager.args[elseExpr];
    if (this.isIte(thenExpr)) {
      const thenArgs = manager.args[thenExpr];
      // (ite c1 (ite c2 t1 t2) t1) is (ite (and c1 (not c2)) t2 t1).
      if (elseExpr === thenArgs[1]) {
        const conjunction = this.mkAnd([condition, this.mkNot(thenArgs[0])]);
        return {
          expr: manager.mkApp(OP_ITE, [conjunction, thenArgs[2], elseExpr], sort),
          depth: 2,
        };
      }
      // (ite c1 (ite c2 t1 t2) t2) is (ite (and c1 c2) t1 t2).
      if (elseExpr === thenArgs[2]) {
        const conjunction = this.mkAnd([condition, thenArgs[0]]);
        return {
          expr: manager.mkApp(OP_ITE, [conjunction, thenArgs[1], elseExpr], sort),
          depth: 2,
        };
      }
      // (ite c1 (ite c2 t1 t2) (ite c3 t1 t2)) is (ite (or (and c1 c2) (and (not c1) c3)) t1 t2),
      // and with (ite c3 t2 t1) the last conjunct is (not c3).
      const isSameBranches =
        isElseIte && thenArgs[1] === elseArgs[1] && thenArgs[2] === elseArgs[2];
      const isSwappedBranches =
        isElseIte && thenArgs[1] === elseArgs[2] && thenArgs[2] === elseArgs[1];
      if (isSameBranches || isSwappedBranches) {
        const first = this.mkAnd([condition, thenArgs[0]]);
        const negation = this.mkNot(condition);
        const second = this.mkAnd([
          negation,
          isSameBranches ? elseArgs[0] : this.mkNot(elseArgs[0]),
        ]);
        const disjunction = this.mkOr([first, second]);
        return {
          expr: manager.mkApp(OP_ITE, [disjunction, thenArgs[1], thenArgs[2]], sort),
          depth: 3,
        };
      }
    }
    if (isElseIte) {
      // (ite c1 t1 (ite c2 t1 t2)) is (ite (or c1 c2) t1 t2).
      if (thenExpr === elseArgs[1]) {
        const disjunction = this.mkOr([condition, elseArgs[0]]);
        return {
          expr: manager.mkApp(OP_ITE, [disjunction, thenExpr, elseArgs[2]], sort),
          depth: 1,
        };
      }
      // (ite c1 t1 (ite c2 t2 t1)) is (ite (or c1 (not c2)) t1 t2).
      if (thenExpr === elseArgs[2]) {
        const disjunction = this.mkOr([condition, this.mkNot(elseArgs[0])]);
        return {
          expr: manager.mkApp(OP_ITE, [disjunction, thenExpr, elseArgs[1]], sort),
          depth: 1,
        };
      }
    }
    return manager.mkApp(OP_ITE, [condition, thenExpr, elseExpr], sort);
  }

  // poly_rewriter::mk_add and mk_sub with a result: arith_rewriter's sum or difference, which is
  // not rewritten again.
  mkAdd(args: number[]) {
    return this.arith.mkAdd(args) ?? this.arith.mkAddApp(args);
  }

  mkSub(first: number, second: number) {
    const result = this.arith.mkSub([first, second]);
    return typeof result === "number" ? result : result.expr;
  }
}
