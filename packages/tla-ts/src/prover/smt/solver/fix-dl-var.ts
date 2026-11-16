// Ported from Z3 (src/tactic/arith/fix_dl_var_tactic.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_USER,
  KIND_APP,
  OP_ADD,
  OP_EQ,
  isArithSort,
} from "./ast";
import type { Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { Rational } from "./rational";
import { Rewriter, type RewriterOptions } from "./rewriter";

class TargetFinder {
  private visited = new Set<number>();
  private todo: number[] = [];
  readonly occs: ObjMap<number>;
  readonly nonNestedOccs: ObjMap<number>;

  constructor(private manager: AstManager) {
    this.occs = new ObjMap((expr) => manager.hashes[expr]);
    this.nonNestedOccs = new ObjMap((expr) => manager.hashes[expr]);
  }

  private isUninterp(expr: number) {
    const manager = this.manager;
    return manager.kinds[expr] === KIND_APP && manager.getFamily(expr) === FAMILY_USER;
  }

  private isArith(expr: number) {
    return isArithSort(this.manager.sorts[expr]);
  }

  private visit(expr: number, isNested: boolean) {
    if (this.isUninterp(expr) && this.manager.getNumArgs(expr) === 0 && this.isArith(expr)) {
      this.occs.set(expr, (this.occs.get(expr) ?? 0) + 1);
      if (!isNested) this.nonNestedOccs.set(expr, (this.nonNestedOccs.get(expr) ?? 0) + 1);
    }
    if (this.visited.has(expr)) return;
    this.visited.add(expr);
    this.todo.push(expr);
  }

  private processApp(expr: number) {
    if (!this.isUninterp(expr) && !this.isArith(expr)) return false;
    for (const arg of this.manager.getArgs(expr)) this.visit(arg, false);
    return true;
  }

  private processAtom(first: number, second: number, isNested: boolean) {
    const manager = this.manager;
    if (this.isUninterp(first) && this.isUninterp(second)) {
      this.visit(first, isNested);
      this.visit(second, isNested);
      return true;
    }
    const [lhs, rhs] = manager.isNumeral(first) ? [second, first] : [first, second];
    if (!manager.isNumeral(rhs) || manager.getOp(lhs) !== OP_ADD || manager.getNumArgs(lhs) !== 2)
      return false;
    const term = manager.getArg(lhs, 0);
    const subtracted = manager.getTimesMinusOneArg(manager.getArg(lhs, 1));
    if (subtracted === undefined || !this.isUninterp(term) || !this.isUninterp(subtracted))
      return false;
    this.visit(term, isNested);
    this.visit(subtracted, isNested);
    return true;
  }

  private processArith(expr: number, isNested: boolean) {
    const manager = this.manager;
    const args = manager.getArgs(expr);
    if (!this.isArith(expr) && args.length === 2)
      return this.processAtom(args[0], args[1], isNested);
    if (
      manager.getOp(expr) !== OP_ADD ||
      args.length !== 2 ||
      !this.isUninterp(args[1]) ||
      !manager.isNumeral(args[0])
    )
      return false;
    this.visit(args[1], isNested);
    return true;
  }

  private isArithApp(expr: number) {
    const manager = this.manager;
    return manager.kinds[expr] === KIND_APP && manager.getFamily(expr) === FAMILY_ARITH;
  }

  // Constants visited at the top stay on the work list until a later formula drains it.
  process(form: number) {
    const manager = this.manager;
    if (this.visited.has(form)) return true;
    let expr = form;
    while (manager.isNot(expr)) expr = manager.getArg(expr, 0);
    if (this.isArithApp(expr)) return this.processArith(expr, false);
    this.todo.push(expr);
    this.visited.add(expr);
    while (this.todo.length > 0) {
      const current = this.todo.pop() as number;
      const isProcessed =
        manager.kinds[current] !== KIND_APP
          ? false
          : manager.getOp(current) === OP_EQ && this.isArith(manager.getArg(current, 0))
            ? this.processAtom(manager.getArg(current, 0), manager.getArg(current, 1), true)
            : manager.getOp(current) !== OP_EQ && this.isArithApp(current)
              ? this.processArith(current, true)
              : this.processApp(current);
      if (!isProcessed) return false;
    }
    return true;
  }
}

const getMostOccs = (occs: ObjMap<number>) => {
  let best = 0;
  let found = -1;
  for (const [expr, count] of occs.entries())
    if (count > best) {
      best = count;
      found = expr;
    }
  return { found, best };
};

export const fixDlVar = (manager: AstManager, goal: Goal, options: RewriterOptions) => {
  const finder = new TargetFinder(manager);
  if (!goal.forms.items.every((form) => finder.process(form))) return;
  const nonNested = getMostOccs(finder.nonNestedOccs);
  const all = getMostOccs(finder.occs);
  const variable = all.best > 10 * nonNested.best ? all.found : nonNested.found;
  if (variable === -1) return;
  const zero = manager.mkNumeralOfSort(Rational.zero, manager.sorts[variable]);
  manager.incRef(zero);
  goal.addDefinitions([{ decl: manager.decls[variable], def: zero }]);
  const rewriter = new Rewriter(manager, options);
  rewriter.setSubstitution(new Map([[variable, zero]]));
  const size = goal.forms.size;
  for (let index = 0; index < size && !goal.isInconsistent; index++) {
    const rewritten = rewriter.rewrite(goal.forms.items[index]);
    goal.update(index, rewritten, goal.getDependency(index));
    manager.decRef(rewritten);
  }
  rewriter.release();
  manager.decRef(zero);
  goal.depth++;
};
