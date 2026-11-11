// Ported from Z3 (src/qe/mbp/mbp_plugin.cpp, src/model/model.cpp), MIT license, see
// z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_AND,
  OP_DISTINCT,
  OP_EQ,
  OP_IMPLIES,
  OP_ITE,
  OP_OR,
  OP_XOR,
  SORT_BOOL,
} from "../ast";
import { isAppOf, mkNot } from "../ast-util";
import type { ProtoModel } from "../proto-model";
import { RefVector } from "../ref-vector";

// A model and the expressions an mbp call makes, which live until the call releases them.
export class MbpContext {
  readonly pinned: RefVector;
  isCompletion = false;

  constructor(
    readonly manager: AstManager,
    readonly model: ProtoModel,
  ) {
    this.pinned = new RefVector(manager);
  }

  pin(expr: number) {
    this.pinned.push(expr);
    return expr;
  }

  eval(expr: number, isCompletion = this.isCompletion) {
    this.manager.incRef(expr);
    const value = this.model.eval(expr, isCompletion);
    this.pinned.pushOwned(value);
    this.manager.decRef(expr);
    return value;
  }

  isTrue(expr: number, isCompletion = this.isCompletion) {
    return this.manager.isTrue(this.eval(expr, isCompletion));
  }

  isFalse(expr: number, isCompletion = this.isCompletion) {
    return this.manager.isFalse(this.eval(expr, isCompletion));
  }

  release() {
    this.pinned.reset();
  }
}

const isIff = (manager: AstManager, expr: number) =>
  isAppOf(manager, expr, OP_EQ) && manager.sorts[manager.getArg(expr, 0)] === SORT_BOOL;

export const markRec = (manager: AstManager, visited: Set<number>, expr: number) => {
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    if (manager.kinds[current] === KIND_APP) manager.pushArgs(current, todo);
    else if (manager.kinds[current] === KIND_QUANTIFIER)
      todo.push(manager.getQuantifier(current).body);
  }
};

// Two arguments of a distinct term that is false in the model and are equal in it.
export const pickEquality = (context: MbpContext, distinct: number) => {
  const manager = context.manager;
  const args = manager.getArgs(distinct);
  if (args.length === 2) return context.pin(manager.mkEq(args[0], args[1]));
  const value2Expr = new Map<number, number>();
  for (const arg of args) {
    const value = context.eval(arg);
    const other = value2Expr.get(value);
    if (other !== undefined) return context.pin(manager.mkEq(arg, other));
    value2Expr.set(value, arg);
  }
  for (const [index, first] of args.entries())
    for (const second of args.slice(index + 1)) {
      const eq = context.pin(manager.mkEq(first, second));
      if (!context.isFalse(eq)) return eq;
    }
  throw new SmtUnsupportedError("pick_equality found no equal arguments");
};

// lits[i] := lits.back(), i--
export const eraseLit = (lits: RefVector, index: number) => {
  lits.set(index, lits.items[lits.size - 1]);
  lits.pop();
  return index - 1;
};

export class ProjectPlugin {
  private cache = new Map<number, number>();
  private boolVisited = new Set<number>();
  private toVisit: number[] = [];

  // extract_literals evaluates without model completion.
  constructor(private context: MbpContext) {}

  private pushBack(lits: RefVector, expr: number) {
    if (!this.context.manager.isTrue(expr)) lits.push(expr);
  }

  private reduce(formula: number, lits: RefVector) {
    const context = this.context;
    const manager = context.manager;
    const negated = manager.isNot(formula) ? manager.getArg(formula, 0) : -1;
    const not = (expr: number) => context.pin(mkNot(manager, expr));
    const arg = (expr: number, index: number) => manager.getArg(expr, index);
    if (negated !== -1 && isAppOf(manager, negated, OP_DISTINCT))
      this.pushBack(lits, pickEquality(context, negated));
    else if (isAppOf(manager, formula, OP_OR)) {
      const found = manager.getArgs(formula).find((disjunct) => context.isTrue(disjunct, false));
      if (found !== undefined) lits.push(found);
    } else if (isAppOf(manager, formula, OP_AND))
      for (const conjunct of manager.getArgs(formula)) lits.push(conjunct);
    else if (isIff(manager, formula) || (negated !== -1 && isAppOf(manager, negated, OP_XOR))) {
      const source = isIff(manager, formula) ? formula : negated;
      if (context.isFalse(arg(source, 0), false)) {
        this.pushBack(lits, not(arg(source, 0)));
        this.pushBack(lits, not(arg(source, 1)));
      } else {
        this.pushBack(lits, arg(source, 0));
        this.pushBack(lits, arg(source, 1));
      }
    } else if (isAppOf(manager, formula, OP_IMPLIES)) {
      if (context.isTrue(arg(formula, 1), false)) this.pushBack(lits, arg(formula, 1));
      else this.pushBack(lits, not(arg(formula, 0)));
    } else if (isAppOf(manager, formula, OP_ITE)) {
      if (context.isTrue(arg(formula, 0), false)) {
        this.pushBack(lits, arg(formula, 0));
        this.pushBack(lits, arg(formula, 1));
      } else {
        this.pushBack(lits, not(arg(formula, 0)));
        this.pushBack(lits, arg(formula, 2));
      }
    } else if (negated !== -1 && manager.isNot(negated)) this.pushBack(lits, arg(negated, 0));
    else if (negated !== -1 && isAppOf(manager, negated, OP_AND)) {
      const found = manager.getArgs(negated).find((conjunct) => context.isFalse(conjunct, false));
      if (found !== undefined) this.pushBack(lits, not(found));
    } else if (negated !== -1 && isAppOf(manager, negated, OP_OR))
      for (const disjunct of manager.getArgs(negated)) this.pushBack(lits, not(disjunct));
    else if ((negated !== -1 && isIff(manager, negated)) || isAppOf(manager, formula, OP_XOR)) {
      const source = negated !== -1 && isIff(manager, negated) ? negated : formula;
      let first = arg(source, 0);
      let second = arg(source, 1);
      if (context.isTrue(first, false)) second = not(second);
      else first = not(first);
      this.pushBack(lits, first);
      this.pushBack(lits, second);
    } else if (negated !== -1 && isAppOf(manager, negated, OP_IMPLIES)) {
      this.pushBack(lits, arg(negated, 0));
      this.pushBack(lits, not(arg(negated, 1)));
    } else if (negated !== -1 && isAppOf(manager, negated, OP_ITE)) {
      if (context.isTrue(arg(negated, 0), false)) {
        this.pushBack(lits, arg(negated, 0));
        this.pushBack(lits, not(arg(negated, 1)));
      } else {
        this.pushBack(lits, not(arg(negated, 0)));
        this.pushBack(lits, not(arg(negated, 2)));
      }
    } else return false;
    return true;
  }

  // Replaces the formulas by literals that are true in the model and imply them.
  extractLiterals(lits: RefVector) {
    const manager = this.context.manager;
    this.cache.clear();
    this.boolVisited.clear();
    for (let index = 0; index < lits.size; index++) {
      const formula = lits.items[index];
      if (this.reduce(formula, lits)) index = eraseLit(lits, index);
      else if (manager.isNot(formula))
        this.extractBools(lits, index, manager.getArg(formula, 0), false);
      else this.extractBools(lits, index, formula, true);
    }
  }

  private extractBools(lits: RefVector, index: number, formula: number, isPositive: boolean) {
    const context = this.context;
    const manager = context.manager;
    if (manager.kinds[formula] !== KIND_APP) return;
    this.toVisit = manager.getArgs(formula);
    while (this.toVisit.length > 0) {
      const expr = this.toVisit[this.toVisit.length - 1];
      if (this.cache.has(expr)) this.toVisit.pop();
      else if (manager.kinds[expr] !== KIND_APP) {
        this.cache.set(expr, expr);
        this.toVisit.pop();
      } else if (this.visitIte(expr, lits)) continue;
      else if (this.visitBool(expr, lits)) continue;
      else this.visitApp(expr);
    }
    this.toVisit.push(formula);
    this.visitApp(formula);
    const result = this.cache.get(formula) as number;
    if (result !== formula)
      lits.set(index, isPositive ? result : context.pin(mkNot(manager, result)));
  }

  private isTrueValue(expr: number) {
    const manager = this.context.manager;
    const value = this.context.eval(expr, false);
    const isTrue = manager.isTrue(value);
    if (!isTrue && !manager.isFalse(value) && containsUninterpreted(manager, value))
      throw new SmtUnsupportedError("could not evaluate Boolean in model");
    return isTrue;
  }

  private visitIte(expr: number, lits: RefVector) {
    const manager = this.context.manager;
    if (!isAppOf(manager, expr, OP_ITE)) return false;
    const condition = manager.getArg(expr, 0);
    const isTrue = this.isTrueValue(condition);
    if (!this.boolVisited.has(condition))
      lits.push(isTrue ? condition : this.context.pin(mkNot(manager, condition)));
    this.boolVisited.add(condition);
    const branch = manager.getArg(expr, isTrue ? 1 : 2);
    const cached = this.cache.get(branch);
    if (cached !== undefined) {
      this.toVisit.pop();
      this.cache.set(expr, cached);
    } else this.toVisit.push(branch);
    return true;
  }

  private visitBool(expr: number, lits: RefVector) {
    const manager = this.context.manager;
    if (manager.sorts[expr] !== SORT_BOOL || manager.isTrue(expr) || manager.isFalse(expr))
      return false;
    const isTrue = this.isTrueValue(expr);
    if (!this.boolVisited.has(expr))
      lits.push(isTrue ? expr : this.context.pin(mkNot(manager, expr)));
    this.boolVisited.add(expr);
    this.cache.set(expr, isTrue ? manager.trueExpr : manager.falseExpr);
    this.toVisit.pop();
    return true;
  }

  private visitApp(expr: number) {
    const manager = this.context.manager;
    const size = this.toVisit.length;
    const args: number[] = [];
    let isDifferent = false;
    for (const arg of manager.getArgs(expr)) {
      const cached = this.cache.get(arg);
      isDifferent ||= cached !== arg;
      if (cached === undefined) this.toVisit.push(arg);
      else args.push(cached);
    }
    if (size !== this.toVisit.length) return;
    this.cache.set(
      expr,
      isDifferent
        ? this.context.pin(manager.mkApp(manager.decls[expr], args, manager.sorts[expr]))
        : expr,
    );
    this.toVisit.pop();
  }
}

const containsUninterpreted = (manager: AstManager, expr: number) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current) || manager.kinds[current] !== KIND_APP) continue;
    visited.add(current);
    if (manager.isUninterpreted(current)) return true;
    manager.pushArgs(current, todo);
  }
  return false;
};
