// Ported from Z3 (src/tactic/core/ctx_simplify_tactic.cpp, src/ast/num_occurs.cpp,
// src/tactic/goal_num_occurs.cpp), MIT license, see z3-license.txt. The ctx-simplify tactic with
// ctx_propagate_assertions: in the context of a formula or a branch, a shared term that the context
// asserts becomes true, false or the value it equals.
import { KIND_APP, OP_AND, OP_EQ, OP_ITE, OP_OR, type AstManager } from "./ast";
import type { Goal } from "./goal";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { shrink } from "./array";

// The max_depth and max_steps that mk_quant_preprocessor gives ctx-simplify.
const MAX_DEPTH = 30;
const MAX_STEPS = 5000000;

interface CachedResult {
  to: number;
  level: number;
}

class CtxSimplifier {
  // goal_num_occurs: how often each term with more than one reference occurs outside quantifiers.
  // m_pinned holds the formulas it counted.
  private occs = new Map<number, number>();
  private pinned: RefVector;
  // ctx_propagate_assertions: the value of each shared term in the current context, and the terms
  // given one, which the trail holds.
  private assertions = new Map<number, number>();
  private trail: RefVector;
  private scopes: number[] = [];
  // m_cache: the results of a shared term, the innermost level last, and the terms cached at each
  // level. A cached term and its results are held.
  private cache = new Map<number, CachedResult[]>();
  private cacheUndo: number[][] = [];
  private depth = 0;
  private numSteps = 0;
  // m_mk_app: mk_simplified_app, one reduction of the theory rewriters.
  private rewriter: Rewriter;

  constructor(private manager: AstManager) {
    this.pinned = new RefVector(manager);
    this.trail = new RefVector(manager);
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
  }

  // operator(): a forward pass over the formulas, then a backward pass that also counts the
  // occurrences of the forward pass's results.
  apply(goal: Goal) {
    const manager = this.manager;
    if (goal.isInconsistent) return;
    this.countOccurrences(goal);
    const size = goal.forms.size;
    for (let index = 0; !goal.isInconsistent && index < size; index++) {
      this.depth = 0;
      const result = this.simplify(goal.forms.items[index]);
      if (index < size - 1 && !manager.isTrue(result) && !manager.isFalse(result))
        this.assertExpr(result, false);
      goal.update(index, result);
      manager.decRef(result);
    }
    this.pop(this.scopes.length);
    this.countOccurrences(goal);
    for (let index = goal.forms.size; !goal.isInconsistent && index > 0;) {
      this.depth = 0;
      index--;
      const result = this.simplify(goal.forms.items[index]);
      if (index > 0 && !manager.isTrue(result) && !manager.isFalse(result))
        this.assertExpr(result, false);
      goal.update(index, result);
      manager.decRef(result);
    }
    this.pop(this.scopes.length);
  }

  // cleanup: ~imp releases the cache, and then goal_num_occurs its formulas.
  release() {
    this.restoreCache(0);
    this.pinned.reset();
  }

  // goal_num_occurs::operator() with ignore_ref_count1 and ignore_quantifiers.
  private countOccurrences(goal: Goal) {
    const manager = this.manager;
    const visited = new Set<number>();
    const stack: number[] = [];
    const visit = (expr: number) => {
      if (manager.getRefCount(expr) > 1) this.occs.set(expr, (this.occs.get(expr) ?? 0) + 1);
      if (visited.has(expr)) return;
      visited.add(expr);
      stack.push(expr);
    };
    for (const form of goal.forms.items) {
      this.pinned.push(form);
      visit(form);
      while (stack.length > 0) {
        const expr = stack.pop() as number;
        if (manager.kinds[expr] !== KIND_APP) continue;
        const args = manager.args[expr];
        for (let index = args.length - 1; index >= 0; index--) visit(args[index]);
      }
    }
  }

  private isShared(expr: number) {
    return this.manager.getRefCount(expr) > 1 && (this.occs.get(expr) ?? 0) > 1;
  }

  // ctx_propagate_assertions::assert_expr: a shared atom gets its truth value, and a shared term
  // that a positive equality equates with a value gets the value.
  private assertExpr(expr: number, isNegated: boolean) {
    const manager = this.manager;
    let atom = expr;
    let isFalse = isNegated;
    while (manager.isNot(atom)) {
      atom = manager.args[atom][0];
      isFalse = !isFalse;
    }
    let isMakingScope = true;
    if (this.isShared(atom) || this.isShared(expr)) {
      this.scopes.push(this.trail.size);
      isMakingScope = false;
      this.assertEqCore(atom, isFalse ? manager.falseExpr : manager.trueExpr);
    }
    if (isFalse || manager.getOp(atom) !== OP_EQ) return;
    const [lhs, rhs] = manager.args[atom];
    const isRhsValue = manager.isUniqueValue(rhs);
    if (!isRhsValue && !manager.isUniqueValue(lhs)) return;
    const term = isRhsValue ? lhs : rhs;
    if (!this.isShared(term)) return;
    if (isMakingScope) this.scopes.push(this.trail.size);
    this.assertEqCore(term, isRhsValue ? rhs : lhs);
  }

  private assertEqCore(term: number, value: number) {
    if (this.assertions.has(term)) return;
    this.assertions.set(term, value);
    this.trail.push(term);
  }

  // pop: the assertions of the scopes, and then the results cached in them, the innermost first.
  private pop(numScopes: number) {
    if (numScopes === 0) return;
    let level = this.scopes.length;
    const size = this.scopes[level - numScopes];
    while (this.trail.size > size) {
      this.assertions.delete(this.trail.items[this.trail.size - 1]);
      this.trail.pop();
    }
    shrink(this.scopes, this.scopes.length - numScopes);
    for (let index = 0; index < numScopes; index++) this.restoreCache(level--);
  }

  private restoreCache(level: number) {
    const manager = this.manager;
    const keys = this.cacheUndo[level];
    if (keys === undefined) return;
    for (let index = keys.length - 1; index >= 0; index--) {
      const results = this.cache.get(keys[index]) as CachedResult[];
      manager.decRef((results.pop() as CachedResult).to);
      if (results.length > 0) continue;
      this.cache.delete(keys[index]);
      manager.decRef(keys[index]);
    }
    keys.length = 0;
  }

  private cacheResult(from: number, to: number) {
    const manager = this.manager;
    if (!this.isShared(from)) return;
    const level = this.scopes.length;
    const results = this.cache.get(from);
    if (results === undefined) {
      this.cache.set(from, [{ to, level }]);
      manager.incRef(from);
    } else results.push({ to, level });
    manager.incRef(to);
    (this.cacheUndo[level] ??= []).push(from);
  }

  private getCached(expr: number) {
    const top = this.cache.get(expr)?.at(-1);
    return top !== undefined && top.level === this.scopes.length ? top.to : undefined;
  }

  // m_mk_app, with a reference to the result.
  private mkApp(decl: number, args: number[], sort: number) {
    return this.manager.withTemporaries(() => this.rewriter.mkApp(decl, args, sort));
  }

  // The result comes with a reference, which the caller releases.
  private simplify(expr: number): number {
    const manager = this.manager;
    if (this.depth >= MAX_DEPTH || this.numSteps >= MAX_STEPS || manager.kinds[expr] !== KIND_APP) {
      manager.incRef(expr);
      return expr;
    }
    // tactic::checkpoint.
    manager.limit.checkpoint();
    const known = this.getCached(expr) ?? this.assertions.get(expr);
    if (known !== undefined) {
      manager.incRef(known);
      return known;
    }
    this.numSteps++;
    this.depth++;
    const op = manager.getOp(expr);
    const result =
      op === OP_OR || op === OP_AND
        ? this.simplifyOrAnd(expr, op === OP_OR)
        : op === OP_ITE
          ? this.simplifyIte(expr)
          : this.simplifyApp(expr);
    this.depth--;
    return result;
  }

  // simplify_or_and: each argument is simplified in the context of the others before it, then of
  // those after it. A disjunct is asserted false and a conjunct true.
  private simplifyOrAnd(expr: number, isOr: boolean) {
    const manager = this.manager;
    const level = this.scopes.length;
    const isNeutral = (arg: number) => (isOr ? manager.isFalse(arg) : manager.isTrue(arg));
    const isAbsorbing = (arg: number) => (isOr ? manager.isTrue(arg) : manager.isFalse(arg));
    let isModified = false;
    const passes = [new RefVector(manager), new RefVector(manager)];
    const releasePasses = () => {
      passes[1].reset();
      passes[0].reset();
    };
    for (const [pass, newArgs] of passes.entries()) {
      const args = pass === 0 ? manager.args[expr] : [...passes[0].items].reverse();
      for (const [index, arg] of args.entries()) {
        const newArg = this.simplify(arg);
        if (newArg !== arg) isModified = true;
        if (index < args.length - 1 && !manager.isTrue(newArg) && !manager.isFalse(newArg))
          this.assertExpr(newArg, isOr);
        if (isNeutral(newArg)) {
          isModified = true;
          manager.decRef(newArg);
          continue;
        }
        if (isAbsorbing(newArg)) {
          this.pop(this.scopes.length - level);
          this.cacheResult(expr, newArg);
          releasePasses();
          return newArg;
        }
        newArgs.pushOwned(newArg);
      }
      this.pop(this.scopes.length - level);
    }
    const newArgs = passes[1].items;
    const result = !isModified
      ? expr
      : newArgs.length === 0
        ? isOr
          ? manager.falseExpr
          : manager.trueExpr
        : newArgs.length === 1
          ? newArgs[0]
          : -1;
    if (result !== -1) manager.incRef(result);
    const simplified =
      result === -1
        ? this.mkApp(manager.decls[expr], [...newArgs].reverse(), manager.sorts[expr])
        : result;
    this.cacheResult(expr, simplified);
    releasePasses();
    return simplified;
  }

  // simplify_ite: the branches are simplified in the context of the condition and its negation.
  private simplifyIte(expr: number) {
    const manager = this.manager;
    const [condition, thenBranch, elseBranch] = manager.args[expr];
    const level = this.scopes.length;
    const newCondition = this.simplify(condition);
    let result: number;
    if (manager.isTrue(newCondition)) result = this.simplify(thenBranch);
    else if (manager.isFalse(newCondition)) result = this.simplify(elseBranch);
    else {
      this.assertExpr(newCondition, false);
      const newThen = this.simplify(thenBranch);
      this.pop(this.scopes.length - level);
      this.assertExpr(newCondition, true);
      const newElse = this.simplify(elseBranch);
      this.pop(this.scopes.length - level);
      if (condition === newCondition && thenBranch === newThen && elseBranch === newElse) {
        manager.incRef(expr);
        result = expr;
      } else if (newThen === newElse) {
        manager.incRef(newThen);
        result = newThen;
      } else
        result = this.mkApp(
          manager.decls[expr],
          [newCondition, newThen, newElse],
          manager.sorts[expr],
        );
      manager.decRef(newElse);
      manager.decRef(newThen);
    }
    this.cacheResult(expr, result);
    manager.decRef(newCondition);
    return result;
  }

  private simplifyApp(expr: number) {
    const manager = this.manager;
    const args = manager.args[expr];
    const newArgs = new RefVector(manager);
    let isModified = false;
    for (const arg of args) {
      const newArg = this.simplify(arg);
      if (newArg !== arg) isModified = true;
      newArgs.pushOwned(newArg);
    }
    if (!isModified) manager.incRef(expr);
    const result = isModified
      ? this.mkApp(manager.decls[expr], newArgs.items, manager.sorts[expr])
      : expr;
    newArgs.reset();
    return result;
  }
}

// The ctx-simplify tactic, which the clean tactical resets when it is done.
export const ctxSimplify = (manager: AstManager, goal: Goal) => {
  const simplifier = new CtxSimplifier(manager);
  simplifier.apply(goal);
  simplifier.release();
};
