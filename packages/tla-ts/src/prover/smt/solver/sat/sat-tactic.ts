// Ported from Z3 (src/sat/tactic/sat_tactic.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../../errors";
import type { AstManager } from "../ast";
import { OVER, type Goal } from "../goal";
import { L_FALSE, L_TRUE } from "../lbool";
import { ProtoModel } from "../proto-model";
import type { SatParams } from "./config";
import { Goal2Sat } from "./goal2sat";
import { sat2goal } from "./sat2goal";
import { Solver } from "./solver";

export const createSatTactic = (manager: AstManager, params: SatParams) => (goal: Goal) => {
  if (goal.isProofsEnabled) throw new SmtTacticError("sat does not support proof production");
  goal.elimRedundancies();
  const solver = new Solver(params, manager.limit);
  const goal2sat = new Goal2Sat(manager, solver, params.get("ite_extra") !== false);
  goal2sat.run(goal.forms.items);
  goal.reset();
  const result = solver.check();
  if (result === L_FALSE) goal.assert(manager.falseExpr);
  else if (result === L_TRUE && goal2sat.unhandledFuns.length === 0) {
    const model = new ProtoModel(manager);
    for (const [expr, boolVar] of goal2sat.atoms) {
      if (!manager.isUninterpretedConst(expr)) continue;
      const value = solver.model[boolVar];
      if (value === L_TRUE) model.registerConst(manager.decls[expr], manager.trueExpr);
      else if (value === L_FALSE) model.registerConst(manager.decls[expr], manager.falseExpr);
    }
    goal.model = model.mkModel();
  } else {
    solver.popToBaseLevel();
    sat2goal(manager, solver, goal2sat.atoms, goal);
    if (goal2sat.unhandledFuns.length > 0) goal.updatePrecision(OVER);
  }
  goal.depth++;
  return [goal];
};
