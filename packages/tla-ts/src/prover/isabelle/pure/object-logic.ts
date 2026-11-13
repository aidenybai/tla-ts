// Ported from Isabelle2025's Pure/Isar/object_logic.ML and Pure/tactic.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { fconvRule, gconvRule, paramsConv, premsConv } from "./conv";
import { hasMetaPrems } from "./logic";
import { makeSimpContext } from "./raw-simplifier";
import { rewriteCterm, simpleProver } from "./rewriter";
import { emptySeq, singleSeq } from "./seq";
import type { Limits } from "./interrupt";
import type { GoalTactic } from "./tactical";
import type { Term } from "./term";
import { reflexive, type Thm } from "./thm";

// The atomize rules apply newest first, as Object_Logic keeps them.
const atomizePrems = (limits: Limits, rules: readonly Thm[]) => {
  const context = makeSimpContext(limits, rules);
  const atomize = paramsConv(
    premsConv((term) =>
      rewriteCterm({ simprem: true, useprem: false, mutsimp: false }, simpleProver, context, term),
    ),
  );
  return (term: Term) => (hasMetaPrems(term) ? atomize(term) : reflexive(term));
};

export const flatRule = (limits: Limits, rules: readonly Thm[], rule: Thm) =>
  fconvRule(premsConv(atomizePrems(limits, rules)), rule);

export const atomizePremsTac = (limits: Limits, rules: readonly Thm[]): GoalTactic => {
  const atomize = atomizePrems(limits, rules);
  return (index) => (state) => {
    try {
      return singleSeq(gconvRule(atomize, index, state));
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
