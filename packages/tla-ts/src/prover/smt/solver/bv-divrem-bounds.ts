// Ported from Z3 (src/tactic/bv/bv_divrem_bounds_tactic.h, src/ast/simplifiers/bv_divrem_bounds.cpp,
// src/ast/bv_decl_plugin.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  KIND_APP,
  OP_BNEG,
  OP_BSDIV,
  OP_BSDIV_I,
  OP_BSMOD,
  OP_BSMOD_I,
  OP_BSREM,
  OP_BSREM_I,
  OP_BUDIV,
  OP_BUDIV_I,
  OP_BUREM,
  OP_BUREM_I,
  OP_ITE,
  OP_SLEQ,
  OP_ULEQ,
} from "./ast";
import { mkBvApp } from "./bv-decl-plugin";
import { runSimplifier } from "./dependent-expr-state";
import type { Goal } from "./goal";

const DIVREM_OPS = new Set([
  OP_BUREM,
  OP_BUREM_I,
  OP_BSREM,
  OP_BSREM_I,
  OP_BSMOD,
  OP_BSMOD_I,
  OP_BUDIV,
  OP_BUDIV_I,
  OP_BSDIV,
  OP_BSDIV_I,
]);

const mkAbs = (manager: AstManager, arg: number) => {
  const sort = manager.sorts[arg];
  const isNonNegative = mkBvApp(manager, OP_SLEQ, [
    manager.mkBvNumeral(0n, manager.getBvSize(sort)),
    arg,
  ]);
  return manager.mkApp(OP_ITE, [isNonNegative, arg, mkBvApp(manager, OP_BNEG, [arg])], sort);
};

const mkBound = (manager: AstManager, target: number) => {
  const op = manager.getOp(target);
  const dividend = manager.getArg(target, 0);
  const divisor = manager.getArg(target, 1);
  return op === OP_BUREM || op === OP_BUREM_I
    ? manager.mkNot(mkBvApp(manager, OP_ULEQ, [divisor, target]))
    : op === OP_BUDIV || op === OP_BUDIV_I
      ? mkBvApp(manager, OP_ULEQ, [target, dividend])
      : op === OP_BSDIV || op === OP_BSDIV_I
        ? mkBvApp(manager, OP_ULEQ, [mkAbs(manager, target), mkAbs(manager, dividend)])
        : manager.mkNot(
            mkBvApp(manager, OP_ULEQ, [mkAbs(manager, divisor), mkAbs(manager, target)]),
          );
};

export const runBvDivremBounds = (manager: AstManager) => (goal: Goal) => {
  runSimplifier(goal, true, (state) => ({
    reduce: () => {
      const todo: number[] = [];
      state.forEachIndex((index) => todo.push(state.get(index)));
      const visited = new Set<number>();
      const targets: number[] = [];
      for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
        if (visited.has(expr) || manager.kinds[expr] !== KIND_APP) continue;
        visited.add(expr);
        if (DIVREM_OPS.has(manager.getOp(expr))) targets.push(expr);
        manager.pushArgs(expr, todo);
      }
      for (const target of targets) {
        const divisor = manager.getArg(target, 1);
        if (manager.isBvNumeral(divisor)) continue;
        const outer = manager.beginTemporaries();
        const bound = mkBound(manager, target);
        const zero = manager.mkBvNumeral(0n, manager.getBvSize(manager.sorts[divisor]));
        goal.assert(manager.mkOr([manager.mkEq(divisor, zero), bound]));
        manager.endTemporaries(outer);
      }
    },
    release: () => {},
  }));
  return [goal];
};
