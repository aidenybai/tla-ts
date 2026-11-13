// Ported from Isabelle2025's Provers/clasimp.ML and Pure/tactic.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { trivForallEquality } from "../pure/drule";
import { selectGoal } from "../pure/goal";
import { addSimps, emptySimpset, type SimpContext } from "../pure/raw-simplifier";
import { gconvRule } from "../pure/conv";
import { rewriteCterm, simpleProver } from "../pure/rewriter";
import { asmFullSimpTac, safeAsmFullSimpTac } from "../pure/simplifier";
import {
  allGoals,
  allTac,
  appendTac,
  changed,
  depthSolve,
  determ,
  every,
  firstGoalTac,
  noTac,
  orElseGoal,
  primitive,
  repeatDeterm,
  thenAllNew,
  thenElse,
  thenTac,
  tryTac,
  type GoalTactic,
  type Tactic,
} from "../pure/tactical";
import { nprems, type Thm } from "../pure/thm";
import {
  addbefore,
  addSafter,
  appWrappers,
  clarifyTac,
  firstBestTac,
  inst0StepTac,
  instpStepTac,
  safeStepsTac,
  safeTac,
  unsafeStepTac,
  withClaset,
  type ClassicalContext,
} from "./classical";

export interface ClasimpContext {
  readonly classical: ClassicalContext;
  readonly simp: SimpContext;
  readonly blastDepthTac: (context: ClassicalContext, limit: number) => GoalTactic;
}

const addss = (context: ClasimpContext): ClassicalContext =>
  withClaset(
    context.classical,
    addbefore(context.classical.claset, "asm_full_simp_tac", (index) =>
      changed(asmFullSimpTac(context.simp)(index)),
    ),
  );

const addSss = (context: ClasimpContext): ClassicalContext =>
  withClaset(
    context.classical,
    addSafter(context.classical.claset, "safe_asm_full_simp_tac", (index) =>
      changed(safeAsmFullSimpTac(context.simp)(index)),
    ),
  );

export const clarsimpTac = (context: ClasimpContext): GoalTactic =>
  thenAllNew(safeAsmFullSimpTac(context.simp), clarifyTac(addSss(context)));

const nodupDepthTac =
  (context: ClassicalContext, limit: number): GoalTactic =>
  (index) =>
  (state) =>
    selectGoal(
      thenElse(
        safeStepsTac(context)(1),
        depthSolve(nodupDepthTac(context, limit)(1)),
        appendTac(
          inst0StepTac(context)(1),
          limit === 0
            ? noTac
            : thenTac(
                appWrappers(context, (goal) =>
                  appendTac(instpStepTac(context)(goal), unsafeStepTac(context)(goal)),
                )(1),
                depthSolve(nodupDepthTac(context, limit - 1)(1)),
              ),
        ),
      ),
    )(index)(state);

const pruneParamsTac = (simp: SimpContext): Tactic => {
  const empty = { ...simp, simpset: emptySimpset };
  const context = { ...empty, simpset: addSimps(empty, [trivForallEquality]) };
  return primitive((state) =>
    Array.from({ length: nprems(state) }, (_, offset) => offset + 1).reduce(
      (current, index) =>
        gconvRule(
          (term) =>
            rewriteCterm(
              { simprem: true, useprem: true, mutsimp: true },
              simpleProver,
              context,
              term,
            ),
          index,
          current,
        ),
      state,
    ),
  );
};

const mkAutoTac = (context: ClasimpContext, depth: number, nodupDepth: number): Tactic => {
  const mainTac = orElseGoal(context.blastDepthTac(context.classical, depth), (index) =>
    changed(nodupDepthTac(addss(context), nodupDepth)(index)),
  );
  return every([
    determ(allGoals(asmFullSimpTac(context.simp))),
    tryTac(safeTac(context.classical)),
    repeatDeterm(firstGoalTac(mainTac)),
    tryTac(safeTac(addSss(context))),
    pruneParamsTac(context.simp),
  ]);
};

export const autoTac = (context: ClasimpContext) => mkAutoTac(context, 4, 2);

export const forceTac = (context: ClasimpContext, atomizeRules: readonly Thm[]): GoalTactic => {
  const classical = addss(context);
  return selectGoal(
    every([
      clarifyTac(classical)(1),
      (state) => (nprems(state) === 0 ? allTac(state) : asmFullSimpTac(context.simp)(1)(state)),
      allGoals(firstBestTac(classical, atomizeRules)),
    ]),
  );
};
