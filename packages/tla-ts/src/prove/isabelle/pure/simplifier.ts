// Ported from Isabelle2025's Pure/simplifier.ML and the PREFER_GOAL of Pure/goal.ML, the
// simplification tactics. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet
// Muenchen, and contributors, see LICENSE.

import { type SimpContext, type Solver } from "./raw-simplifier";
import { fconvRule, genericRewriteGoalTac, rewriteCterm, type Prover, type RewriteMode } from "./rewriter";
import { emptySeq } from "./seq";
import {
  depthSolve,
  firstGoal,
  noTac,
  orElse,
  primitive,
  thenAllNew,
  thenTac,
  tryTac,
  type GoalTactic,
  type Tactic,
} from "./tactical";
import { nprems, permutePrems, type Thm } from "./thm";

const withSolvers = (context: SimpContext, solvers: readonly Solver[]): SimpContext => ({
  ...context,
  simpset: { ...context.simpset, unsafeSolvers: solvers, safeSolvers: solvers },
});

// solve_all_tac: solves goal 1 completely with the subgoaler.
const solveAllTac = (solvers: readonly Solver[], context: SimpContext): Tactic => {
  const inner = withSolvers(context, solvers);
  const solveTac = thenAllNew(inner.simpset.subgoalTac(inner), () => noTac);
  return depthSolve(solveTac(1));
};

const loopTac = (context: SimpContext): GoalTactic =>
  firstGoal([...context.simpset.loopTacs].reverse().map((loop) => loop.tactic(context)));

const preferGoal =
  (tactic: Tactic, index: number): Tactic =>
  (state) => {
    if (index < 1 || index > nprems(state)) return emptySeq;
    return thenTac(
      thenTac(
        primitive((current) => permutePrems(0, index - 1, current)),
        tactic,
      ),
      primitive((current) => permutePrems(0, 1 - index, current)),
    )(state);
  };

const singleProver =
  (solvers: readonly Solver[]): Prover =>
  (context, thm) =>
    solveAllTac(solvers, context)(thm).pull()?.[0];

// generic_simp_tac
export const genericSimpTac =
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
    return preferGoal(simpLoopTac(1), index);
  };

export const simpTac = genericSimpTac(false, { simprem: false, useprem: false, mutsimp: false });
export const asmSimpTac = genericSimpTac(false, { simprem: false, useprem: true, mutsimp: false });
export const fullSimpTac = genericSimpTac(false, { simprem: true, useprem: false, mutsimp: false });
export const asmLrSimpTac = genericSimpTac(false, { simprem: true, useprem: true, mutsimp: false });
export const asmFullSimpTac = genericSimpTac(false, { simprem: true, useprem: true, mutsimp: true });
export const safeAsmFullSimpTac = genericSimpTac(true, { simprem: true, useprem: true, mutsimp: true });

// Simplifier.simp_thm: simplifies a theorem's proposition.
export const simpThm = (mode: RewriteMode, context: SimpContext, thm: Thm): Thm => {
  const prover = singleProver([...context.simpset.unsafeSolvers].reverse());
  return fconvRule((term) => rewriteCterm(mode, prover, context, term), thm);
};

export const simplify = (context: SimpContext, thm: Thm) =>
  simpThm({ simprem: false, useprem: false, mutsimp: false }, context, thm);

export const fullSimplify = (context: SimpContext, thm: Thm) =>
  simpThm({ simprem: true, useprem: false, mutsimp: false }, context, thm);
