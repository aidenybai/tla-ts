// Ported from Zenon's main.ml, as shipped in tlapm. Copyright 1997 INRIA, see LICENSE.
//
// Runs Zenon as tlapm does on a .znn file. A proof counts only once the independent checker
// accepts it.
//
// tlapm passes -max-time 1d, so Zenon's own clock never stops it. The time limit is tlapm's
// timeout instead: Schedule.run kills Zenon once the wall clock passes its launch time plus the
// timeout, whether Zenon is still reading the file or searching.

import { TlaZenonError } from "../../errors";
import type { DecideOptions, Verdict } from "../verdict";
import { checkProof } from "./check/check";
import { createRelations } from "./eqrel";
import { createExpressions } from "./expr";
import { createIndex } from "./index-table";
import { parseZenon } from "./parse";
import { separate } from "./phrase";
import type { Proof } from "./proof";
import { search, type SearchFailure } from "./search";
import { getBuiltInDefinitions, PREDEFINED_SYMBOLS } from "./tla/tla";

export interface ZenonRun {
  proof: Proof | undefined;
  // Why the search gave up. "zenon error" stands for the exceptions that stop Zenon mid-search.
  failure: SearchFailure | "zenon error" | undefined;
  isChecked: boolean;
  nodesSearched: number;
  maxBranchFormulas: number;
  proofNodes: number;
  formulasCreated: number;
}

// The search and its statistics, which match the -stats output of the OCaml Zenon. Throws
// TlaZenonError when the text isn't a valid .znn file.
export const runZenon = (text: string, options: DecideOptions): ZenonRun => {
  const deadline = Date.now() + options.timeLimitMs;
  const exprs = createExpressions();
  const phrases = [...getBuiltInDefinitions(exprs), ...parseZenon(exprs, text)];
  const separated = separate(PREDEFINED_SYMBOLS, phrases);
  const relations = createRelations(exprs);
  for (const hypothesis of separated.hypotheses) relations.analyse(hypothesis.formula);
  const hypotheses = separated.hypotheses.filter(
    (hypothesis) => !relations.isSubsumed(hypothesis.formula),
  );
  const index = createIndex(exprs);
  const statistics = { inferences: 0, proofNodes: 0 };
  const outcome = (() => {
    try {
      return search(
        { index, relations, exprs },
        separated.definitions,
        hypotheses,
        { deadline, signal: options.signal },
        statistics,
      );
    } catch (error) {
      if (error instanceof TlaZenonError) return "zenon error";
      throw error;
    }
  })();
  const proof = typeof outcome === "string" ? undefined : outcome;
  return {
    proof,
    failure: typeof outcome === "string" ? outcome : undefined,
    isChecked:
      proof !== undefined &&
      checkProof(proof, {
        hypotheses: phrases.flatMap((phrase) => (phrase.kind === "hyp" ? [phrase.formula] : [])),
        definitions: separated.definitions,
      }),
    nodesSearched: statistics.inferences,
    maxBranchFormulas: index.getTopFormulaCount(),
    proofNodes: statistics.proofNodes,
    formulasCreated: exprs.getCreatedCount(),
  };
};

// Zenon's verdict on a .znn file: "unsat" when it refutes the hypotheses with a proof that the
// checker accepts, within the time limit.
export const decideZenon = (text: string, options: DecideOptions): Exclude<Verdict, "sat"> =>
  runZenon(text, options).isChecked ? "unsat" : "unknown";
