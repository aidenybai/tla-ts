// Ported from Z3 (src/ast/rewriter/th_rewriter.cpp, bool_rewriter.cpp, arith_rewriter.cpp), MIT
// license, see z3-license.txt. Only the rewrites that tlapm's encoding exercises are ported.
import { SmtCanceledError } from "../../../errors";
import { ActCache } from "./act-cache";
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

// rewriter_tpl's frame states.
const PROCESS_CHILDREN = 0;
const REWRITE_BUILTIN = 1;

// A rewrite still to finish: its expression, state, next child, the depth left to rewrite, where
// its children's results start on the result stack, whether to cache its result, and whether a
// child changed.
interface Frame {
  curr: number;
  state: number;
  childIndex: number;
  maxDepth: number;
  spos: number;
  isCaching: boolean;
  hasNewChild: boolean;
}

// rewriter_tpl with th_rewriter_cfg. The loop is ported step for step, with Z3's references: the
// result stack, the caches and m_r hold their expressions, so that expressions are created and
// deleted in Z3's order.
export class Rewriter {
  private frames: Frame[] = [];
  private resultStack: number[] = [];
  // m_cache_stack: one cache per quantifier scope, the outermost first, reset on entry.
  private caches: ActCache[];
  private scopeRoots: number[] = [];
  private root = -1;
  // m_r: the last result, which Z3 holds until it assigns the next one.
  private lastResult = -1;
  private arith: ArithRewriter;
  private numSteps = 0;
  private substitution = new Map<number, number>();

  constructor(
    private manager: AstManager,
    private options: RewriterOptions,
    private isNestedDer = false,
  ) {
    this.caches = [new ActCache(manager, manager.getNumAsts())];
    this.arith = new ArithRewriter(manager, options.arith, (expr, depth) =>
      this.reduceTo(expr, depth),
    );
  }

  private get cache() {
    return this.caches[this.scopeRoots.length];
  }

  // Rewrites the top depth levels of a term that a rewrite returned, like BR_REWRITE1 and
  // BR_REWRITE2.
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

  // th_rewriter::set_substitution: rewrites replace each key of the substitution with its value, and
  // the rewriter is reset. The caller may extend the substitution between rewrites without a reset.
  setSubstitution(substitution: Map<number, number>) {
    this.substitution = substitution;
    this.reset();
  }

  // rewriter_core::reset: releases the cached results.
  reset() {
    this.caches[0].reset();
  }

  // ~rewriter_core: releases every cache, the outermost first.
  cleanup() {
    for (const cache of this.caches) cache.reset();
  }

  private setLastResult(expr: number) {
    if (expr !== -1) this.manager.incRef(expr);
    if (this.lastResult !== -1) this.manager.decRef(this.lastResult);
    this.lastResult = expr;
  }

  private pushResult(expr: number) {
    this.manager.incRef(expr);
    this.resultStack.push(expr);
  }

  private popResult() {
    const expr = this.resultStack.pop() as number;
    this.manager.decRef(expr);
  }

  private shrinkResults(size: number) {
    const removed = this.resultStack.splice(size);
    for (const expr of removed) this.manager.decRef(expr);
  }

  private setNewChildFlag(oldExpr: number, newExpr: number) {
    if (oldExpr !== newExpr && this.frames.length > 0)
      this.frames[this.frames.length - 1].hasNewChild = true;
  }

  // must_cache: the result of a shared application with arguments or quantifier.
  private isCaching(expr: number) {
    const manager = this.manager;
    return (
      manager.getRefCount(expr) > 1 &&
      expr !== this.root &&
      (manager.kinds[expr] === KIND_QUANTIFIER ||
        (manager.kinds[expr] === KIND_APP && manager.args[expr].length > 0))
    );
  }

  private cacheResult(expr: number, result: number, isCaching: boolean) {
    if (isCaching) this.cache.insert(expr, 0, result);
  }

  private pushFrame(expr: number, isCaching: boolean, maxDepth: number) {
    this.frames.push({
      curr: expr,
      state: PROCESS_CHILDREN,
      childIndex: 0,
      maxDepth,
      spos: this.resultStack.length,
      isCaching,
      hasNewChild: false,
    });
  }

  // rewriter_tpl::operator() and main_loop: the result comes with a reference, which the caller
  // releases. Throws SmtCanceledError when the resource limit cancels the rewrite; the check runs
  // every 256 steps rather than on each step.
  rewrite(expr: number): number {
    const manager = this.manager;
    return manager.withoutTemporaries(() => {
      this.root = expr;
      if (!this.visit(expr, Infinity))
        while (this.frames.length > 0) {
          if ((++this.numSteps & 255) === 0 && !manager.limit.inc()) throw new SmtCanceledError();
          const frame = this.frames[this.frames.length - 1];
          const curr = frame.curr;
          if (frame.childIndex === 0 && frame.state === PROCESS_CHILDREN && frame.isCaching) {
            const cached = this.cache.find(curr, 0);
            if (cached !== undefined) {
              this.pushResult(cached);
              this.frames.pop();
              this.setNewChildFlag(curr, cached);
              continue;
            }
          }
          if (manager.kinds[curr] === KIND_APP) this.processApp(curr, frame);
          else this.processQuantifier(curr, frame);
        }
      const result = this.resultStack.pop() as number;
      return result;
    });
  }

  // visit: whether expr is rewritten and its result is on the result stack. Otherwise it pushes a
  // frame for expr.
  private visit(expr: number, maxDepth: number) {
    const manager = this.manager;
    const replacement = this.substitution.get(expr);
    if (replacement !== undefined) {
      this.pushResult(replacement);
      this.setNewChildFlag(expr, replacement);
      return true;
    }
    if (maxDepth === 0) {
      this.pushResult(expr);
      return true;
    }
    const isCaching = this.isCaching(expr);
    if (isCaching) {
      const cached = this.cache.find(expr, 0);
      if (cached !== undefined) {
        this.pushResult(cached);
        this.setNewChildFlag(expr, cached);
        return true;
      }
    }
    const kind = manager.kinds[expr];
    if (kind === KIND_VAR || (kind === KIND_APP && manager.args[expr].length === 0)) {
      this.pushResult(expr);
      return true;
    }
    this.pushFrame(expr, isCaching, maxDepth === Infinity ? maxDepth : maxDepth - 1);
    return false;
  }

  // flat_assoc: th_rewriter flattens and, or and + into an enclosing application of the same
  // operator.
  private isFlatAssoc(decl: number) {
    const op = this.manager.funcDecls[decl].op;
    return op === OP_AND || op === OP_OR || op === OP_ADD;
  }

  private processApp(expr: number, frame: Frame) {
    const manager = this.manager;
    if (frame.state === REWRITE_BUILTIN) {
      const result = this.resultStack[this.resultStack.length - 1];
      this.setLastResult(result);
      this.popResult();
      this.popResult();
      this.pushResult(result);
      this.cacheResult(expr, result, frame.isCaching);
      this.frames.pop();
      this.setNewChildFlag(expr, -1);
      return;
    }
    const args = manager.args[expr];
    while (frame.childIndex < args.length) {
      if (this.isConstantFolded(expr, frame)) return;
      const arg = args[frame.childIndex];
      frame.childIndex++;
      if (!this.visit(arg, frame.maxDepth)) return;
    }
    const decl = manager.decls[expr];
    if (this.isFlatAssoc(decl) && manager.getRefCount(expr) <= 1 && this.frames.length > 1) {
      const previous = this.frames[this.frames.length - 2];
      if (
        manager.kinds[previous.curr] === KIND_APP &&
        manager.decls[previous.curr] === decl &&
        previous.state === PROCESS_CHILDREN
      ) {
        this.frames.pop();
        this.setNewChildFlag(expr, -1);
        return;
      }
    }
    const newArgs = this.resultStack.slice(frame.spos);
    const result = manager.withTemporaries(() =>
      this.mkAppCore(decl, newArgs, manager.sorts[expr]),
    );
    this.setLastResult(result);
    manager.decRef(result);
    this.shrinkResults(frame.spos);
    this.pushResult(result);
    this.cacheResult(expr, result, frame.isCaching);
    this.frames.pop();
    this.setNewChildFlag(expr, -1);
    this.setLastResult(-1);
  }

  // constant_fold: an ite whose condition rewrote to true or false becomes the chosen branch.
  private isConstantFolded(expr: number, frame: Frame) {
    const manager = this.manager;
    if (frame.childIndex !== 1 || manager.getOp(expr) !== OP_ITE) return false;
    const condition = this.resultStack[frame.spos];
    const arg = manager.isTrue(condition)
      ? manager.args[expr][1]
      : manager.isFalse(condition)
        ? manager.args[expr][2]
        : -1;
    if (arg === -1) return false;
    this.shrinkResults(frame.spos);
    this.pushResult(arg);
    frame.state = REWRITE_BUILTIN;
    if (this.visit(arg, frame.maxDepth)) {
      const result = this.resultStack[this.resultStack.length - 1];
      this.setLastResult(result);
      this.popResult();
      this.popResult();
      this.pushResult(result);
      this.cacheResult(expr, result, frame.isCaching);
      this.frames.pop();
      this.setNewChildFlag(expr, -1);
    }
    this.setLastResult(-1);
    return true;
  }

  private processQuantifier(expr: number, frame: Frame) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    if (frame.childIndex === 0) this.beginScope(data.body);
    const children = this.options.isRewritingPatterns ? [data.body, ...data.patterns] : [data.body];
    while (frame.childIndex < children.length) {
      const child = children[frame.childIndex];
      frame.childIndex++;
      if (!this.visit(child, frame.maxDepth)) return;
    }
    const body = this.resultStack[frame.spos];
    const patterns = this.options.isRewritingPatterns
      ? this.resultStack.slice(frame.spos + 1)
      : data.patterns;
    const result = manager.withTemporaries(() => this.reduceQuantifier(expr, body, patterns));
    this.setLastResult(result);
    manager.decRef(result);
    this.shrinkResults(frame.spos);
    this.pushResult(result);
    this.endScope();
    this.cacheResult(expr, result, frame.isCaching);
    this.setLastResult(-1);
    this.frames.pop();
    this.setNewChildFlag(expr, result);
  }

  // begin_scope: the body of a quantifier gets a fresh cache, and becomes the root.
  private beginScope(body: number) {
    this.scopeRoots.push(this.root);
    this.root = body;
    if (this.scopeRoots.length === this.caches.length)
      this.caches.push(new ActCache(this.manager, this.manager.getNumAsts()));
    this.cache.reset();
  }

  private endScope() {
    this.cache.reset();
    this.root = this.scopeRoots.pop() as number;
  }

  // th_rewriter_cfg::reduce_quantifier: a bound Boolean variable among the conjuncts of a universal
  // body or the disjuncts of an existential one decides the quantifier. Otherwise it merges a
  // directly nested quantifier of the same kind when neither has patterns, eliminates unused
  // variables, and applies der to pattern-free quantifiers.
  private reduceQuantifier(expr: number, body: number, newPatterns: number[]) {
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
    nestedRewriter.cleanup();
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

  // Throws SmtCanceledError when the resource limit cancels the rewrite, like rewriter_tpl's
  // main_loop. The check runs every 256 steps rather than once per rewrite.
  mkAppCore(decl: number, args: number[], sort: number): number {
    const manager = this.manager;
    if ((++this.numSteps & 255) === 0 && !manager.limit.inc()) throw new SmtCanceledError();
    const op = manager.funcDecls[decl].op;
    switch (op) {
      case OP_AND:
        return this.mkAnd(args);
      case OP_OR:
        return this.mkOr(args);
      case OP_NOT:
        return this.mkNot(args[0]);
      case OP_IMPLIES:
        return this.mkOr([this.mkNot(args[0]), args[1]]);
      case OP_XOR:
        return this.mkNot(this.mkEq(args[0], args[1]));
      case OP_EQ:
        return (
          (manager.sorts[args[0]] === SORT_INT ? this.arith.mkEq(args[0], args[1]) : undefined) ??
          this.mkEq(args[0], args[1])
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

  mkNot(arg: number) {
    const manager = this.manager;
    if (manager.isNot(arg)) return manager.args[arg][0];
    return manager.mkNot(arg);
  }

  // bool_rewriter::mk_flat_or_core and mk_nflat_or_core: flattens, drops false and duplicates, and
  // detects true or a complementary pair. With sort_disjunctions, a disjunction that changed or is
  // out of ast_lt's order is stably sorted by id.
  mkOr(args: number[]): number {
    const manager = this.manager;
    const literals = new FlatLiterals(manager);
    let isChanged = false;
    let numCandidates = 0;
    const add = (arg: number): boolean => {
      if (manager.getOp(arg) === OP_OR) {
        isChanged = true;
        for (const innerArg of manager.args[arg]) if (add(innerArg)) return true;
        return false;
      }
      if (manager.isTrue(arg)) return true;
      if (manager.isFalse(arg)) {
        isChanged = true;
        return false;
      }
      numCandidates++;
      return literals.add(arg);
    };
    for (const arg of args) if (add(arg)) return manager.trueExpr;
    const result = literals.list;
    const isOutOfOrder = result.some(
      (arg, index) => index > 0 && isAstLess(manager, arg, result[index - 1]),
    );
    if (isChanged || numCandidates !== result.length || isOutOfOrder)
      result.sort((first, second) => first - second);
    return manager.mkOr(result);
  }

  mkAnd(args: number[]): number {
    const manager = this.manager;
    const literals = new FlatLiterals(manager);
    const add = (arg: number): boolean => {
      if (manager.getOp(arg) === OP_AND) {
        for (const innerArg of manager.args[arg]) if (add(innerArg)) return true;
        return false;
      }
      if (
        this.options.isEliminatingAnd &&
        manager.isNot(arg) &&
        manager.getOp(manager.args[arg][0]) === OP_OR
      ) {
        for (const innerArg of manager.args[manager.args[arg][0]])
          if (add(this.mkNot(innerArg))) return true;
        return false;
      }
      if (manager.isFalse(arg)) return true;
      return !manager.isTrue(arg) && literals.add(arg);
    };
    for (const arg of args) if (add(arg)) return manager.falseExpr;
    const result = literals.list;
    if (result.length <= 1 || !this.options.isEliminatingAnd) return manager.mkAnd(result);
    return this.mkNot(this.mkOr(result.map((innerArg) => this.mkNot(innerArg))));
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

  // bool_rewriter::mk_eq_core, after arith_rewriter::mk_eq_core folds numerals.
  mkEq(inputLeft: number, inputRight: number): number {
    const manager = this.manager;
    if (inputLeft === inputRight) return manager.trueExpr;
    if (manager.isUniqueValue(inputLeft) && manager.isUniqueValue(inputRight))
      return manager.falseExpr;
    const iteEq = this.tryIteEq(inputLeft, inputRight) ?? this.tryIteEq(inputRight, inputLeft);
    if (iteEq !== undefined) return iteEq;
    const iteValueEq = this.mkIteValueEq(inputLeft, inputRight);
    if (iteValueEq !== undefined) return iteValueEq;
    if (manager.sorts[inputLeft] !== SORT_BOOL) return manager.mkEq(inputLeft, inputRight);
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
    if (manager.isNot(lhs)) return this.mkNot(this.mkEq(manager.args[lhs][0], rhs));
    if (isUnfolded) return this.mkEq(lhs, rhs);
    return manager.mkEq(lhs, rhs);
  }

  mkDistinct(args: number[]) {
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
