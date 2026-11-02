// Ported from Isabelle2025's Pure/Isar/object_logic.ML, atomize_prems_tac, and the CONVERSION of
// Pure/tactic.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet
// Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { gconvRule, paramsConv, premsConv } from "./conv";
import { hasMetaPrems } from "./logic";
import { addSimps, emptySimpset } from "./raw-simplifier";
import { rewriteCterm, simpleProver } from "./rewriter";
import { emptySeq, singleSeq } from "./seq";
import type { Limits } from "./interrupt";
import type { GoalTactic } from "./tactical";
import { reflexive, type Thm } from "./thm";

// Object_Logic.atomize_prems_tac: rewrites the premises of a goal with the atomize rules, newest
// first as Object_Logic keeps them, which turns meta-level premises into object-level formulas.
export const atomizePremsTac = (limits: Limits, rules: readonly Thm[]): GoalTactic => {
  const empty = { limits, simpset: emptySimpset, bounds: 0 };
  const context = { ...empty, simpset: addSimps(empty, rules) };
  // Raw_Simplifier.rewrite ctxt true: full rewriting, with a prover that proves no premises.
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
      // CONVERSION fails on THM, CTERM, TERM and TYPE.
      if (
        error instanceof TlaIsabelleError &&
        (error.exception === "THM" || error.exception === "TERM" || error.exception === "TYPE")
      )
        return emptySeq;
      throw error;
    }
  };
};
