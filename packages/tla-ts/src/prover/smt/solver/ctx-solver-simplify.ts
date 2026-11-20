import { type AstManager, SORT_BOOL, SORT_INT } from "./ast";
import type { Goal } from "./goal";
import { L_FALSE } from "./lbool";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { SmtKernel } from "./smt-kernel";
import type { KernelParams } from "./solver";

const FRESH_SYMBOL = 0xbeef101;

interface ExprPos {
  parent: number;
  self: number;
  index: number;
  expr: number;
}

// The first kernel reads some parameters before using_params updates them.
export const createCtxSolverSimplify = (
  manager: AstManager,
  frontParams: KernelParams,
  params: KernelParams,
) => {
  let kernel = new SmtKernel(manager, frontParams);
  kernel.updateParams(params);
  const boolFn = manager.mkFuncDecl(FRESH_SYMBOL, [SORT_INT], SORT_BOOL);
  const fns = new Map<number, number>();
  const reduceGoal = (goal: Goal) => {
    if (goal.isProofsEnabled || goal.isInconsistent) {
      goal.depth++;
      return;
    }
    const rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    const trail = new RefVector(manager);
    const pin = (expr: number) => {
      trail.push(expr);
      return expr;
    };
    let id = 1;
    const mkFresh = (sort: number) => {
      let fn = sort === SORT_BOOL ? boolFn : fns.get(sort);
      if (fn === undefined) {
        fn = manager.mkFuncDecl(FRESH_SYMBOL + id, [SORT_INT], sort);
        fns.set(sort, fn);
      }
      return pin(manager.mkApp(fn, [manager.mkNumeral(BigInt(id++))], sort));
    };
    const simplifyBool = (name: number) => {
      kernel.push();
      kernel.assertExpr(name);
      let result = kernel.check();
      kernel.pop(1);
      if (result === L_FALSE) return manager.trueExpr;
      kernel.push();
      const negation = manager.mkNot(name);
      manager.incRef(negation);
      kernel.assertExpr(negation);
      result = kernel.check();
      kernel.pop(1);
      manager.decRef(negation);
      return result === L_FALSE ? manager.falseExpr : undefined;
    };
    const getLeaf = (expr: number, name: number) => {
      if (manager.isTrue(expr) || manager.isFalse(expr)) return expr;
      const simplified = manager.isBool(expr) ? simplifyBool(name) : undefined;
      if (simplified !== undefined) return simplified;
      return manager.isApp(expr) ? undefined : expr;
    };
    const reduce = (fml: number) => {
      const names: number[] = [];
      const todo: ExprPos[] = [];
      const cache = new Map<number, ExprPos>();
      let childId = 0;
      const top = mkFresh(SORT_BOOL);
      let assumption = manager.mkNot(manager.mkEq(fml, top));
      manager.incRef(assumption);
      kernel.assertExpr(assumption);
      todo.push({ parent: 0, self: 0, index: 0, expr: fml });
      names.push(top);
      kernel.push();
      while (todo.length > 0 && manager.limit.inc()) {
        const pos = todo[todo.length - 1];
        const expr = pos.expr;
        const name = names[names.length - 1];
        const isCached = cache.has(expr);
        let result = isCached ? undefined : getLeaf(expr, name);
        if (!isCached && result === undefined) {
          const args: number[] = [];
          let isFound = false;
          manager.pushArgs(expr, args);
          for (const [index, arg] of args.entries()) {
            const cached = cache.get(arg);
            if (cached !== undefined && cached.parent === pos.self && cached.index === index) {
              args[index] = cached.expr;
              isFound = true;
            }
          }
          let child: number | undefined;
          if (!isFound)
            for (const [index, arg] of args.entries()) {
              if (child !== undefined || manager.isValue(arg)) continue;
              child = mkFresh(manager.sorts[arg]);
              todo.push({ parent: pos.self, self: ++childId, index, expr: arg });
              names.push(child);
              args[index] = child;
            }
          result = pin(rewriter.mkApp(manager.decls[expr], args, manager.sorts[expr]));
          if (child !== undefined) {
            kernel.push();
            const equation = manager.mkEq(result, name);
            manager.incRef(equation);
            manager.decRef(assumption);
            assumption = equation;
            kernel.assertExpr(assumption);
            continue;
          }
        }
        if (result !== undefined) cache.set(expr, { ...pos, expr: result });
        todo.pop();
        names.pop();
        kernel.pop(1);
      }
      const result = manager.limit.inc() ? cache.get(fml)?.expr : undefined;
      if (result !== undefined) {
        manager.incRef(result);
        manager.decRef(fml);
      }
      manager.decRef(assumption);
      trail.reset();
      return result ?? fml;
    };
    const fml = manager.mkAnd([...goal.forms.items]);
    manager.incRef(fml);
    kernel.push();
    const result = reduce(fml);
    kernel.pop(1);
    rewriter.release();
    if (manager.limit.inc()) {
      goal.reset();
      goal.assert(result);
    }
    manager.decRef(result);
    goal.depth++;
  };
  return {
    run: (goal: Goal) => {
      reduceGoal(goal);
      kernel.release();
      kernel = new SmtKernel(manager, params);
    },
    release: () => kernel.release(),
  };
};
