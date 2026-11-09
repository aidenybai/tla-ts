// Ported from Z3 (src/ast/simplifiers/dominator_simplifier.cpp, src/ast/rewriter/dom_simplifier.cpp,
// src/ast/expr_substitution.cpp), MIT license, see z3-license.txt.
import { type AstManager, KIND_APP, OP_AND, OP_EQ, OP_ITE, OP_NOT, OP_OR } from "./ast";
import { mkNot } from "./ast-util";
import { forEachIndex, runSimplifier } from "./dependent-expr-state";
import type { Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { RefVector } from "./ref-vector";

const MAX_DEPTH = 1024;

class ExprDominators {
  private exprToPost = new Map<number, number>();
  private postToExpr: number[] = [];
  private parents = new Map<number, number[]>();
  private doms: ObjMap<number>;
  private tree: ObjMap<number[]>;
  private root: RefVector;

  constructor(private manager: AstManager) {
    this.doms = new ObjMap((expr) => manager.hashes[expr]);
    this.tree = new ObjMap((expr) => manager.hashes[expr]);
    this.root = new RefVector(manager);
  }

  private addEdge(map: Map<number, number[]> | ObjMap<number[]>, source: number, target: number) {
    const edges = map.get(source);
    if (edges === undefined) map.set(source, [target]);
    else edges.push(target);
  }

  private computePostOrder() {
    const manager = this.manager;
    const marked = new Set<number>();
    const todo = [this.root.items[0]];
    while (todo.length > 0) {
      const expr = todo[todo.length - 1];
      if (marked.has(expr)) {
        todo.pop();
        continue;
      }
      if (manager.kinds[expr] !== KIND_APP) {
        marked.add(expr);
        todo.pop();
        continue;
      }
      let isDone = true;
      for (const arg of manager.getArgs(expr))
        if (!marked.has(arg)) {
          todo.push(arg);
          isDone = false;
        }
      if (!isDone) continue;
      marked.add(expr);
      this.exprToPost.set(expr, this.postToExpr.length);
      this.postToExpr.push(expr);
      todo.pop();
      for (const arg of manager.getArgs(expr)) this.addEdge(this.parents, arg, expr);
    }
  }

  private intersect(first: number, second: number) {
    let x = first;
    let y = second;
    let n1 = this.exprToPost.get(x) as number;
    let n2 = this.exprToPost.get(y) as number;
    while (n1 !== n2) {
      if (n1 < n2) {
        x = this.doms.get(x) as number;
        n1 = this.exprToPost.get(x) as number;
      } else {
        y = this.doms.get(y) as number;
        n2 = this.exprToPost.get(y) as number;
      }
    }
    return x;
  }

  private computeDominators() {
    const root = this.root.items[0];
    this.doms.set(root, root);
    let isChanged = true;
    let iterations = 1;
    while (isChanged) {
      isChanged = false;
      for (let index = 0; index + 1 < this.postToExpr.length; index++) {
        const child = this.postToExpr[index];
        const parents = this.parents.get(child) as number[];
        let newIdom: number | undefined;
        for (const parent of parents)
          if (this.doms.has(parent))
            newIdom = newIdom === undefined ? parent : this.intersect(newIdom, parent);
        if (newIdom === undefined) {
          this.doms.set(child, parents[0]);
          isChanged = true;
        } else if (this.doms.get(child) !== newIdom) {
          this.doms.set(child, newIdom);
          isChanged = true;
        }
      }
      iterations *= 2;
      if (isChanged && iterations > this.postToExpr.length) return false;
    }
    return true;
  }

  compile(expr: number) {
    this.reset();
    this.root.push(expr);
    this.computePostOrder();
    if (!this.computeDominators()) return false;
    for (const [key, value] of this.doms.entries()) this.addEdge(this.tree, value, key);
    return true;
  }

  reset() {
    this.exprToPost.clear();
    this.postToExpr = [];
    this.parents.clear();
    this.doms.clear();
    this.tree.clear();
    this.root.reset();
  }

  getTree(expr: number): readonly number[] {
    return this.tree.get(expr) ?? [];
  }

  idom(expr: number) {
    return this.doms.get(expr) as number;
  }
}

class ExprSubstitutionSimplifier {
  private subst = new Map<number, number>();
  private scopedTrail: number[] = [];
  private trailLimits: number[] = [];
  private exprToDepth = new Map<number, number>();
  private trail: RefVector;

  constructor(private manager: AstManager) {
    this.trail = new RefVector(manager);
  }

  private computeDepth(root: number) {
    const manager = this.manager;
    const todo = [root];
    while (todo.length > 0) {
      const expr = todo[todo.length - 1];
      if (this.exprToDepth.has(expr)) {
        todo.pop();
        continue;
      }
      let depth = 0;
      if (manager.kinds[expr] === KIND_APP) {
        let isVisited = true;
        for (const arg of manager.getArgs(expr)) {
          const argDepth = this.exprToDepth.get(arg);
          if (argDepth !== undefined) depth = Math.max(depth, argDepth);
          else {
            isVisited = false;
            todo.push(arg);
          }
        }
        if (!isVisited) continue;
      }
      todo.pop();
      this.exprToDepth.set(expr, depth + 1);
    }
  }

  private isGt(lhs: number, rhs: number): boolean {
    const manager = this.manager;
    if (lhs === rhs) return false;
    if (manager.isValue(rhs)) return true;
    const lhsDepth = this.exprToDepth.get(lhs) ?? 0;
    const rhsDepth = this.exprToDepth.get(rhs) ?? 0;
    if (lhsDepth > rhsDepth) return true;
    if (lhsDepth !== rhsDepth || !manager.isApp(lhs) || !manager.isApp(rhs)) return false;
    const lhsDecl = manager.getDeclId(lhs);
    const rhsDecl = manager.getDeclId(rhs);
    if (lhsDecl !== rhsDecl) return lhsDecl > rhsDecl;
    if (manager.getNumArgs(lhs) !== manager.getNumArgs(rhs))
      return manager.getNumArgs(lhs) > manager.getNumArgs(rhs);
    for (let index = 0; index < manager.getNumArgs(lhs); index++)
      if (manager.getArg(lhs, index) !== manager.getArg(rhs, index))
        return this.isGt(manager.getArg(lhs, index), manager.getArg(rhs, index));
    return false;
  }

  private insert(source: number, def: number) {
    if (this.subst.has(source)) return;
    this.manager.incRef(source);
    this.manager.incRef(def);
    this.subst.set(source, def);
    this.scopedTrail.push(source);
  }

  private updateSubstitution(expr: number) {
    const manager = this.manager;
    if (manager.isGround(expr) && manager.getOp(expr) === OP_EQ) {
      const lhs = manager.getArg(expr, 0);
      const rhs = manager.getArg(expr, 1);
      this.computeDepth(lhs);
      this.computeDepth(rhs);
      this.trail.push(lhs);
      this.trail.push(rhs);
      if (this.isGt(lhs, rhs)) return this.insert(lhs, rhs);
      if (this.isGt(rhs, lhs)) return this.insert(rhs, lhs);
    }
    if (manager.isNot(expr)) this.insert(manager.getArg(expr, 0), manager.falseExpr);
    else this.insert(expr, manager.trueExpr);
  }

  assertExpr(expr: number, isSign: boolean): boolean {
    const manager = this.manager;
    if (manager.isNot(expr)) return this.assertExpr(manager.getArg(expr, 0), !isSign);
    if (manager.isFalse(expr)) return isSign;
    if (manager.isTrue(expr)) return !isSign;
    this.trailLimits.push(this.scopedTrail.length);
    if (!isSign) this.updateSubstitution(expr);
    else {
      const negated = manager.mkNot(expr);
      manager.incRef(negated);
      this.updateSubstitution(negated);
      manager.decRef(negated);
    }
    return true;
  }

  find(expr: number) {
    return this.subst.get(expr) ?? expr;
  }

  pop(numScopes: number) {
    if (numScopes === 0) return;
    const newSize = this.trailLimits.length - numScopes;
    const oldSize = this.trailLimits[newSize];
    for (const source of this.scopedTrail.splice(oldSize)) {
      const def = this.subst.get(source) as number;
      this.subst.delete(source);
      this.manager.decRef(source);
      this.manager.decRef(def);
    }
    this.trailLimits.length = newSize;
  }

  get scopeLevel() {
    return this.trailLimits.length;
  }

  release() {
    this.pop(this.scopeLevel);
    this.trail.reset();
  }
}

class DominatorSimplifier {
  private simplifier: ExprSubstitutionSimplifier;
  private dominators: ExprDominators;
  private trail: RefVector;
  private results = new Map<number, number>();
  private subexprCache = new Map<string, boolean>();
  private depth = 0;
  private isForward = true;

  constructor(
    private manager: AstManager,
    private goal: Goal,
  ) {
    this.simplifier = new ExprSubstitutionSimplifier(manager);
    this.dominators = new ExprDominators(manager);
    this.trail = new RefVector(manager);
  }

  private pin(expr: number) {
    this.trail.push(expr);
    return expr;
  }

  private getCached(expr: number) {
    return this.results.get(expr) ?? expr;
  }

  private cache(expr: number, result: number) {
    this.results.set(expr, result);
    this.trail.push(result);
    this.trail.push(expr);
  }

  private localPop(numScopes: number) {
    this.simplifier.pop(numScopes);
  }

  private isSubexpr(first: number, second: number): boolean {
    if (first === second) return true;
    const key = `${first},${second}`;
    const cached = this.subexprCache.get(key);
    if (cached !== undefined) return cached;
    const depths = this.manager.depths;
    if (depths[first] >= depths[second]) return false;
    const result = this.isSubexpr(this.dominators.idom(first), second);
    this.subexprCache.set(key, result);
    return result;
  }

  private simplifyArg(expr: number) {
    return this.simplifier.find(this.getCached(expr));
  }

  private simplifyIte(ite: number) {
    const manager = this.manager;
    const condition = manager.getArg(ite, 0);
    const thenExpr = manager.getArg(ite, 1);
    const elseExpr = manager.getArg(ite, 2);
    const oldLevel = this.simplifier.scopeLevel;
    const newCondition = this.simplifyArg(condition);
    let result: number;
    if (manager.isTrue(newCondition)) result = this.simplifyArg(thenExpr);
    else if (!this.simplifier.assertExpr(newCondition, false)) result = this.simplifyArg(elseExpr);
    else {
      for (const child of this.dominators.getTree(ite))
        if (this.isSubexpr(child, thenExpr) && !this.isSubexpr(child, elseExpr))
          this.simplifyRec(child);
      this.localPop(this.simplifier.scopeLevel - oldLevel);
      const newThen = this.simplifyArg(thenExpr);
      this.results.clear();
      if (!this.simplifier.assertExpr(newCondition, true)) return newThen;
      for (const child of this.dominators.getTree(ite))
        if (this.isSubexpr(child, elseExpr) && !this.isSubexpr(child, thenExpr))
          this.simplifyRec(child);
      this.localPop(this.simplifier.scopeLevel - oldLevel);
      const newElse = this.simplifyArg(elseExpr);
      if (condition === newCondition && thenExpr === newThen && elseExpr === newElse) result = ite;
      else if (newThen === newElse) result = newThen;
      else
        result = this.pin(
          manager.mkApp(OP_ITE, [newCondition, newThen, newElse], manager.sorts[newThen]),
        );
    }
    this.results.clear();
    return result;
  }

  private simplifyAndOr(isAnd: boolean, expr: number) {
    const manager = this.manager;
    const oldLevel = this.simplifier.scopeLevel;
    const args = manager.getArgs(expr);
    const isSubexprArg = (child: number, except: number) =>
      this.isSubexpr(child, except) &&
      args.every((arg) => arg === except || !this.isSubexpr(child, arg));
    const results: number[] = [];
    const simplifyArgAt = (arg: number) => {
      for (const child of this.dominators.getTree(arg))
        if (isSubexprArg(child, arg)) this.simplifyRec(child);
      const result = this.simplifyArg(arg);
      results.push(result);
      if (this.simplifier.assertExpr(result, !isAnd)) return undefined;
      this.localPop(this.simplifier.scopeLevel - oldLevel);
      this.results.clear();
      return isAnd ? manager.falseExpr : manager.trueExpr;
    };
    const order = this.isForward ? args : args.toReversed();
    for (const arg of order) {
      const decided = simplifyArgAt(arg);
      if (decided !== undefined) return decided;
    }
    if (!this.isForward) results.reverse();
    this.localPop(this.simplifier.scopeLevel - oldLevel);
    this.results.clear();
    return this.pin(isAnd ? manager.mkAnd(results) : manager.mkOr(results));
  }

  private simplifyNot(expr: number) {
    const oldLevel = this.simplifier.scopeLevel;
    const result = this.simplifyRec(this.manager.getArg(expr, 0));
    this.localPop(this.simplifier.scopeLevel - oldLevel);
    this.results.clear();
    return this.pin(mkNot(this.manager, result));
  }

  private simplifyRec(original: number): number {
    const manager = this.manager;
    const expr = this.results.get(original) ?? original;
    this.depth++;
    let result: number;
    const op = manager.getOp(expr);
    if (this.depth > MAX_DEPTH) result = expr;
    else if (op === OP_ITE) result = this.simplifyIte(expr);
    else if (op === OP_AND) result = this.simplifyAndOr(true, expr);
    else if (op === OP_OR) result = this.simplifyAndOr(false, expr);
    else if (op === OP_NOT) result = this.simplifyNot(expr);
    else {
      for (const child of this.dominators.getTree(expr))
        if (child !== expr) this.simplifyRec(child);
      const args =
        manager.kinds[expr] === KIND_APP
          ? manager.mapArgs(expr, (arg) => (manager.isBool(arg) ? arg : this.simplifyArg(arg)))
          : [];
      result = args.every((arg, index) => arg === manager.getArg(expr, index))
        ? expr
        : this.pin(manager.mkApp(manager.decls[expr], args, manager.sorts[expr]));
    }
    result = this.simplifier.find(result);
    this.cache(original, result);
    this.depth--;
    this.subexprCache.clear();
    return result;
  }

  private init() {
    const manager = this.manager;
    const args: number[] = [];
    forEachIndex(manager, this.goal, (index) => args.push(this.goal.forms.items[index]));
    const fml = manager.mkAnd(args);
    manager.incRef(fml);
    this.results.clear();
    this.trail.reset();
    const isCompiled = this.dominators.compile(fml);
    manager.decRef(fml);
    return isCompiled;
  }

  private simplifyAt(index: number) {
    const manager = this.manager;
    const form = this.goal.forms.items[index];
    let result = this.simplifyRec(form);
    if (
      !manager.isTrue(result) &&
      !manager.isFalse(result) &&
      !this.simplifier.assertExpr(result, false)
    )
      result = manager.falseExpr;
    this.goal.update(index, result);
    return result !== form;
  }

  reduce() {
    const goal = this.goal;
    this.trail.reset();
    this.results.clear();
    this.dominators.reset();
    this.depth = 0;
    let isChanged = true;
    for (let round = 0; isChanged && round < 10; round++) {
      isChanged = false;
      this.isForward = true;
      if (!this.init()) return;
      for (let index = 0; index < goal.forms.size && !goal.isInconsistent; index++)
        if (this.simplifyAt(index)) isChanged = true;
      this.localPop(this.simplifier.scopeLevel);
      this.isForward = false;
      if (!this.init()) return;
      for (let index = goal.forms.size; index-- > 0 && !goal.isInconsistent;)
        if (this.simplifyAt(index)) isChanged = true;
      this.localPop(this.simplifier.scopeLevel);
    }
  }

  release() {
    this.simplifier.release();
    this.dominators.reset();
    this.trail.reset();
  }
}

export const domSimplify = (manager: AstManager, goal: Goal) =>
  runSimplifier(goal, true, () => {
    const simplifier = new DominatorSimplifier(manager, goal);
    simplifier.reduce();
    simplifier.release();
  });
