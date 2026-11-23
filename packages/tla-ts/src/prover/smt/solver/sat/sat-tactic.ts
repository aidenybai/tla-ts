import { SmtSatCanceledError, SmtTacticError, SmtUnsupportedError } from "../../../../errors";
import type { AstManager } from "../ast";
import type { ThSolverFactory } from "../euf/euf-solver";
import { joinDependencies, mkDependencyLeaf, OVER, type Dependency, type Goal } from "../goal";
import { ObjMap } from "../hashtable";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { ProtoModel } from "../proto-model";
import type { SatParams } from "./config";
import { Goal2Sat } from "./goal2sat";
import { Sat2GoalConverter, sat2goal } from "./sat2goal";
import { Solver } from "./solver";

// With a theory factory, the sat solver runs the euf solver of sat.euf as its extension.
export const createSatTactic =
  (
    manager: AstManager,
    params: SatParams,
    isModelValidating: boolean,
    isArithIgnoringInt: boolean,
    mkThSolver: ThSolverFactory | null = null,
  ) =>
  (goal: Goal) => {
    if (goal.isProofsEnabled) throw new SmtTacticError("sat does not support proof production");
    goal.elimRedundancies();
    const solver = new Solver(params, manager.limit);
    const goal2sat = new Goal2Sat(
      manager,
      solver,
      params.get("ite_extra") !== false,
      isArithIgnoringInt,
      mkThSolver,
    );
    const formsToValidate = isModelValidating ? [...goal.forms.items] : [];
    for (const form of formsToValidate) manager.incRef(form);
    try {
      const dep2asm = new ObjMap<number>((expr) => manager.hashes[expr]);
      goal2sat.runGoal(goal, dep2asm);
      goal.reset();
      const result = (() => {
        try {
          return solver.check([...dep2asm.values()]);
        } catch (error) {
          if (error instanceof SmtSatCanceledError) throw new SmtTacticError("canceled");
          throw error;
        }
      })();
      if (result === L_UNDEF) goal.reasonUnknown = solver.reasonUnknown;
      const unhandledFuns = goal2sat.euf?.unhandledFunctions ?? goal2sat.unhandledFuns;
      if (result === L_FALSE) {
        const asm2dep = new Map<number, number>();
        for (const [dep, lit] of dep2asm) asm2dep.set(lit, dep);
        goal.assert(
          manager.falseExpr,
          goal.isCoresEnabled
            ? solver.core.reduce<Dependency | undefined>(
                (core, lit) => joinDependencies(core, mkDependencyLeaf(asm2dep.get(lit) as number)),
                undefined,
              )
            : undefined,
        );
      } else if (result === L_TRUE && unhandledFuns.length === 0) {
        if (goal.isModelsEnabled) {
          const model = new ProtoModel(manager).mkModel();
          for (const [expr, boolVar] of goal2sat.atoms) {
            if (!manager.isUninterpretedConst(expr)) continue;
            const value = solver.model[boolVar];
            if (value === L_TRUE) model.registerConst(manager.decls[expr], manager.trueExpr);
            else if (value === L_FALSE) model.registerConst(manager.decls[expr], manager.falseExpr);
          }
          if (mkThSolver === null)
            for (const form of formsToValidate) {
              const value = model.eval(form, false);
              manager.decRef(value);
              if (value === manager.falseExpr)
                throw new SmtUnsupportedError("a sat model that fails validation");
            }
          goal.model = goal2sat.euf?.updateModel(model, true) ?? model;
        }
      } else {
        solver.popToBaseLevel();
        const converter = new Sat2GoalConverter(manager);
        sat2goal(manager, solver, goal2sat.atoms, goal, converter);
        if (goal.isModelsEnabled) goal.addDefinitions(converter.entries);
        if (goal.isCoresEnabled || unhandledFuns.length > 0) goal.updatePrecision(OVER);
      }
      goal.depth++;
      return [goal];
    } finally {
      for (const form of formsToValidate) manager.decRef(form);
      goal2sat.release();
    }
  };
