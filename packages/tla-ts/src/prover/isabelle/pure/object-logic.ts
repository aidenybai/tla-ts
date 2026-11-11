// Ported from Isabelle2025's Pure/Isar/object_logic.ML and Pure/tactic.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { gconvRule, paramsConv, premsConv } from "./conv";
import { hasMetaPrems } from "./logic";
import { makeSimpContext } from "./raw-simplifier";
import { rewriteCterm, simpleProver } from "./rewriter";
import { emptySeq, singleSeq } from "./seq";
import type { Limits } from "./interrupt";
import type { GoalTactic } from "./tactical";
import { reflexive, type Thm } from "./thm";

export const atomizePremsTac = (limits: Limits, rules: readonly Thm[]): GoalTactic => {
  const context = makeSimpContext(limits, rules);
  const atomize = paramsConv(
    premsConv((term) =>
      rewriteCterm({ simprem: true, useprem: false, mutsimp: false }, simpleProver, context, term),
    ),
  );
  return (index) => (state) => {
    try {
      return singleSeq(
        gconvRule((term) => (hasMetaPrems(term) ? atomize(term) : reflexive(term)), index, state),
      );
    } catch (error) {
      if (
        error instanceof TlaIsabelleError &&
        (error.exception === "THM" || error.exception === "TERM" || error.exception === "TYPE")
      )
        return emptySeq;
      throw error;
    }
  };
};
