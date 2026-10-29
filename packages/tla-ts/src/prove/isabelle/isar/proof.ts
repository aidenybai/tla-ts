// Ported from Isabelle2025's Pure/goal.ML (init), Pure/Isar/method.ML (insert_tac, finish) and the
// terminal proof of Pure/Isar/proof.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Runs show "C" using assms by METHOD: the goal C ==> #C gets the assumptions as premises, the
// method runs, and qed closes the remaining goals by assumption. Goal.conjunction_tac, which
// METHOD runs first, changes nothing here: tlapm's goals have no Pure conjunctions.

import { compIncr, forallIntrVars, protectI, revcutRl } from "../pure/drule";
import { normHhf } from "../pure/simplifier";
import { filterSeq, mapsSeq, type Seq } from "../pure/seq";
import { mkVar, propT } from "../pure/term";
import { every, type Tactic } from "../pure/tactical";
import { flexflexTac, resolveTac, type Limits } from "../pure/tactic";
import { assume, instantiate, nprems, type Thm } from "../pure/thm";
import type { Statement } from "./statement";

// Goal.init: C ==> #C.
export const initGoal = (statement: Statement) =>
  instantiate([{ variable: mkVar("A", 0, propT), term: statement.conclusion }], protectI);

// Assumption.assume: an assumption in hhf normal form.
export const getFacts = (limits: Limits, statement: Statement) =>
  statement.assumptions.map((assumption) => normHhf(limits, assume(assumption)));

// Method.insert_tac: each fact becomes a premise of the goal, in order.
export const insertTac = (limits: Limits, facts: readonly Thm[], index: number): Tactic =>
  every(facts.map((fact) => resolveTac(limits, [compIncr(forallIntrVars(fact), revcutRl)])(index)));

// Proof.local_terminal_proof: the first result of the method that qed can finish. Method.finish
// closes goals by assumption, and the proof is done once no goal is left.
export const terminalProof = (method: Tactic, finish: Tactic, state: Thm): Seq<Thm> =>
  filterSeq(
    (result) => nprems(result) === 0,
    mapsSeq((result) => finish(result), method(state)),
  );

export const finishTac =
  (assmTac: Tactic): Tactic =>
  (state) =>
    mapsSeq(flexflexTac, assmTac(state));
