// Ported from Isabelle2025's Pure/goal.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { compNoFlatten, protectD, protectI } from "./drule";
import { emptySeq } from "./seq";
import { primitive, thenTac, type GoalTactic, type Tactic } from "./tactical";
import { nprems, permutePrems, type Thm } from "./thm";

const protect = (count: number, thm: Thm) => compNoFlatten(thm, count, 1, protectI);

const conclude = (thm: Thm) => compNoFlatten(thm, nprems(thm), 1, protectD);

const restrict = (index: number, count: number, state: Thm) => {
  if (index < 1 || count < 1 || index + count - 1 > nprems(state))
    throw new TlaIsabelleError("THM", "Goal.restrict");
  return protect(count, permutePrems(0, index - 1, state));
};

const unrestrict = (index: number, state: Thm) => permutePrems(0, 1 - index, conclude(state));

export const selectGoal =
  (tactic: Tactic): GoalTactic =>
  (index) =>
  (state) => {
    if (nprems(state) === 1 && index === 1) return tactic(state);
    return thenTac(
      thenTac(
        primitive((current) => restrict(index, 1, current)),
        tactic,
      ),
      primitive((current) => unrestrict(index, current)),
    )(state);
  };

export const preferGoal =
  (tactic: Tactic): GoalTactic =>
  (index) =>
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
