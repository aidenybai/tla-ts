// Ported from Zenon's main.ml, as shipped in tlapm. Copyright 1997 INRIA, see LICENSE.
//
// Runs Zenon with tlapm's options, -x tla -max-time 1d, on a .znn file. A proof counts only once
// the independent checker accepts it.

import { TlaZenonError } from "../errors";
import { checkProof } from "./check";
import { createRelations } from "./eqrel";
import { getCreatedCount, resetExpressions } from "./expr";
import { getBuiltInDefinitions, PREDEFINED_SYMBOLS } from "./ext-tla";
import { createIndex } from "./index-table";
import type { Proof } from "./node";
import { parseZenon } from "./parse";
import { separate } from "./phrase";
import { search } from "./prove";

export interface ZenonOptions {
  timeLimitMs: number;
}

export interface ZenonRun {
  proof: Proof | undefined;
  isChecked: boolean;
  nodesSearched: number;
  maxBranchFormulas: number;
  proofNodes: number;
  formulasCreated: number;
}

// The search and its statistics, which match the -stats output of the OCaml Zenon.
export const runZenon = (text: string, options: ZenonOptions): ZenonRun => {
  const deadline = Date.now() + options.timeLimitMs;
  resetExpressions();
  const builtIns = getBuiltInDefinitions();
  const phrases = [...builtIns, ...parseZenon(text)];
  const separated = separate(PREDEFINED_SYMBOLS, phrases);
  const relations = createRelations();
  for (const hypothesis of separated.hypotheses) relations.analyse(hypothesis.formula);
  const hypotheses = separated.hypotheses.filter(
    (hypothesis) => !relations.isSubsumed(hypothesis.formula),
  );
  const index = createIndex();
  const statistics = { inferences: 0, proofNodes: 0 };
  const proof = search(
    { index, relations },
    separated.definitions,
    hypotheses,
    deadline,
    statistics,
  );
  return {
    proof,
    isChecked:
      proof !== undefined &&
      checkProof(proof, {
        hypotheses: phrases.flatMap((phrase) => (phrase.kind === "hyp" ? [phrase.formula] : [])),
        definitions: separated.definitions,
      }),
    nodesSearched: statistics.inferences,
    maxBranchFormulas: index.getTopFormulaCount(),
    proofNodes: statistics.proofNodes,
    formulasCreated: getCreatedCount(),
  };
};

// Zenon's verdict on a .znn file: "proved" when it finds a proof that the checker accepts within
// the time limit.
export const proveZenon = (text: string, options: ZenonOptions): "proved" | "unknown" => {
  const run = (() => {
    try {
      return runZenon(text, options);
    } catch (error) {
      if (error instanceof TlaZenonError) return undefined;
      throw error;
    }
  })();
  return run?.isChecked ? "proved" : "unknown";
};
