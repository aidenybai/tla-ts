import { SmtTacticError } from "../../../errors";
import type { AstManager } from "./ast";
import { convertAckrModel } from "./ackr-model-converter";
import type { Goal } from "./goal";
import { type AckrSolver, Lackr } from "./lackr";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import type { RewriterOptions } from "./rewriter";

const checkGoal = (goal: Goal, name: string) => {
  if (goal.isCoresEnabled)
    throw new SmtTacticError(`${name} does not support unsat core production`);
  if (goal.isProofsEnabled) throw new SmtTacticError(`${name} does not support proof production`);
};

const getEmptyCopy = (goal: Goal) => {
  const copied = goal.copy();
  copied.reset();
  return copied;
};

export const runAckermannizeBv =
  (manager: AstManager, rewriterOptions: RewriterOptions, lemmaLimit: number) => (goal: Goal) => {
    checkGoal(goal, "ackermannize");
    const lackr = new Lackr(manager, [...goal.forms.items], rewriterOptions, true);
    const result = getEmptyCopy(goal);
    if (!lackr.mkAckermann(result, lemmaLimit)) {
      result.reset();
      result.releaseConverters();
      lackr.release(false);
      return [goal];
    }
    const info = lackr.info;
    if (goal.isModelsEnabled)
      result.addModelConversion(
        (model) => convertAckrModel(info, undefined, model),
        () => info.release(),
      );
    result.depth++;
    lackr.release(goal.isModelsEnabled);
    return [result];
  };

export const createQfufbvAckrTactic =
  (
    manager: AstManager,
    rewriterOptions: RewriterOptions,
    isEager: boolean,
    createSolver: () => AckrSolver,
  ) =>
  (goal: Goal) => {
    checkGoal(goal, "qfufbv_ackr");
    const solver = createSolver();
    const lackr = new Lackr(manager, [...goal.forms.items], rewriterOptions, isEager, solver);
    const status = lackr.solve();
    const result = getEmptyCopy(goal);
    if (status === L_FALSE) result.assert(manager.falseExpr);
    if (status === L_UNDEF) goal.depth++;
    const model = lackr.model;
    const isConverted = goal.isModelsEnabled && status === L_TRUE && model !== undefined;
    if (isConverted) {
      model.incRef();
      const info = lackr.info;
      // ackr_model_converter frees its abstract model before its info.
      result.addModelConversion(
        (converted) => convertAckrModel(info, model, converted),
        () => {
          model.decRef();
          info.release();
        },
      );
    }
    if (status === L_UNDEF) result.releaseConverters();
    lackr.release(isConverted);
    solver.release();
    return [status === L_UNDEF ? goal : result];
  };
