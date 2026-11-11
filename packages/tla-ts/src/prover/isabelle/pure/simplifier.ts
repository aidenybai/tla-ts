// Ported from Isabelle2025's Pure/simplifier.ML and the PREFER_GOAL of Pure/goal.ML. Copyright (c)
// 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see
// LICENSE.

import { genAll, isNormHhf, normHhfEq, protectCong } from "./drule";
import { preferGoal } from "./goal";
import { addSimps, congKey, emptySimpset, type SimpContext, type Solver } from "./raw-simplifier";
import { updateTable } from "./table";
import { fconvRule } from "./conv";
import {
  genericRewriteGoalTac,
  rewriteCterm,
  simpleProver,
  type Prover,
  type RewriteMode,
} from "./rewriter";
import {
  depthSolve,
  firstGoal,
  noTac,
  orElse,
  thenAllNew,
  thenTac,
  tryTac,
  type GoalTactic,
  type Tactic,
} from "./tactical";
import type { Limits } from "./interrupt";
import type { Thm } from "./thm";

const withSolvers = (context: SimpContext, solvers: readonly Solver[]): SimpContext => ({
  ...context,
  simpset: { ...context.simpset, unsafeSolvers: solvers, safeSolvers: solvers },
});

const solveAllTac = (solvers: readonly Solver[], context: SimpContext): Tactic => {
  const inner = withSolvers(context, solvers);
  const solveTac = thenAllNew(inner.simpset.subgoalTac(inner), () => noTac);
  return depthSolve(solveTac(1));
};

const loopTac = (context: SimpContext): GoalTactic =>
  firstGoal([...context.simpset.loopTacs].reverse().map((loop) => loop.tactic(context)));

const singleProver =
  (solvers: readonly Solver[]): Prover =>
  (context, thm) =>
    solveAllTac(solvers, context)(thm).pull()?.[0];

const genericSimpTac =
  (isSafe: boolean, mode: RewriteMode) =>
  (context: SimpContext): GoalTactic =>
  (index) => {
    const loop = loopTac(context);
    const solvers = isSafe ? context.simpset.safeSolvers : context.simpset.unsafeSolvers;
    const solveTac = firstGoal([...solvers].reverse().map((solver) => solver.tactic(context)));
    const simpLoopTac: GoalTactic = (goal) =>
      thenTac(
        genericRewriteGoalTac(mode, singleProver(context.simpset.unsafeSolvers), context, goal),
        orElse(solveTac(goal), tryTac(thenAllNew(loop, simpLoopTac)(goal))),
      );
    return preferGoal(simpLoopTac(1))(index);
  };
export const asmSimpTac = genericSimpTac(false, { simprem: false, useprem: true, mutsimp: false });
export const asmLrSimpTac = genericSimpTac(false, { simprem: true, useprem: true, mutsimp: false });
export const asmFullSimpTac = genericSimpTac(false, {
  simprem: true,
  useprem: true,
  mutsimp: true,
});
export const safeAsmFullSimpTac = genericSimpTac(true, {
  simprem: true,
  useprem: true,
  mutsimp: true,
});

const simpThm = (mode: RewriteMode, context: SimpContext, thm: Thm): Thm => {
  const prover = singleProver([...context.simpset.unsafeSolvers].reverse());
  return fconvRule((term) => rewriteCterm(mode, prover, context, term), thm);
};

export const simplify = (context: SimpContext, thm: Thm) =>
  simpThm({ simprem: false, useprem: false, mutsimp: false }, context, thm);

// Drule.sort_constraint_eq, the other rule of hhf_ss, never applies: tlapm's terms carry no sort
// constraints.
const genNormHhf = (isProtecting: boolean, limits: Limits, thm: Thm): Thm => {
  if (isNormHhf(isProtecting, thm.prop)) return genAll(thm);
  const empty = { limits, simpset: emptySimpset, bounds: 0 };
  const simpset = addSimps(empty, [normHhfEq]);
  const context = {
    ...empty,
    simpset: isProtecting
      ? {
          ...simpset,
          congs: updateTable(
            simpset.congs,
            congKey({ isConst: true, name: "Pure.prop" }),
            protectCong,
          ),
        }
      : simpset,
  };
  return genAll(
    fconvRule(
      (term) =>
        rewriteCterm(
          { simprem: true, useprem: false, mutsimp: false },
          simpleProver,
          context,
          term,
        ),
      thm,
    ),
  );
};

export const normHhf = (limits: Limits, thm: Thm) => genNormHhf(false, limits, thm);

// Raw_Simplifier.norm_hhf_protect leaves protected propositions alone.
export const normHhfProtect = (limits: Limits, thm: Thm) => genNormHhf(true, limits, thm);
