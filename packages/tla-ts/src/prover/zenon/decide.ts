// Ported from Zenon's main.ml, as shipped in tlapm. Copyright 1997 INRIA, see LICENSE.
//
// Runs Zenon on a .znn file as tlapm does, with -oisar. A proof counts only once the independent
// checker accepts it. tlapm passes -max-time 1d and kills Zenon at its own timeout instead, whether
// Zenon is still reading, searching or printing the proof.

import { TlaZenonError } from "../../errors";
import type { DecideOptions } from "../verdict";
import { checkProof } from "./check/check";
import { createRelations } from "./eqrel";
import { createExpressions } from "./expr";
import { createIndex } from "./index-table";
import { getLimitFailure } from "./limits";
import { printIsar } from "./isar";
import { parseZenon } from "./parse";
import { separate } from "./phrase";
import type { Proof } from "./proof";
import { search, type SearchFailure } from "./search";
import { getBuiltInDefinitions, PREDEFINED_SYMBOLS } from "./tla/tla";

interface ZenonRun {
  proof: Proof | undefined;
  // Why Zenon gave up: in the search, or at the limits while it checked or printed the proof.
  // "zenon error" stands for the exceptions that stop Zenon mid-search.
  failure: SearchFailure | "zenon error" | undefined;
  // Zenon's -oisar output, once the checker accepts the proof and the printer ends within the
  // limits.
  isar: string | undefined;
  nodesSearched: number;
  maxBranchFormulas: number;
  proofNodes: number;
  formulasCreated: number;
}

// The search and its statistics, which match the -stats output of the OCaml Zenon. Throws
// TlaZenonError when the text isn't a valid .znn file.
export const runZenon = (text: string, options: DecideOptions): ZenonRun => {
  const limits = { deadline: Date.now() + options.timeLimitMs, signal: options.signal };
  const exprs = createExpressions();
  const parsed = parseZenon(exprs, text);
  const phrases = [...getBuiltInDefinitions(exprs), ...parsed];
  const separated = separate(PREDEFINED_SYMBOLS, phrases);
  const relations = createRelations(exprs);
  for (const hypothesis of separated.hypotheses) relations.analyse(hypothesis.formula);
  const hypotheses = separated.hypotheses.filter(
    (hypothesis) => !relations.isSubsumed(hypothesis.formula),
  );
  const index = createIndex(exprs);
  const statistics = { inferences: 0, proofNodes: 0, reusedProofs: new Set<Proof>() };
  const outcome = (() => {
    try {
      return search(
        { index, relations, exprs },
        separated.definitions,
        hypotheses,
        limits,
        statistics,
      );
    } catch (error) {
      if (error instanceof TlaZenonError) return "zenon error";
      throw error;
    }
  })();
  const proof = typeof outcome === "string" ? undefined : outcome;
  const isChecked =
    proof !== undefined &&
    checkProof(
      proof,
      {
        hypotheses: phrases.flatMap((phrase) => (phrase.kind === "hyp" ? [phrase.formula] : [])),
        definitions: separated.definitions,
      },
      limits,
    );
  const isar = isChecked
    ? printIsar(proof, {
        exprs,
        phrases: parsed,
        sharedProofs: statistics.reusedProofs,
        relations,
        limits,
      })
    : undefined;
  return {
    proof,
    failure:
      typeof outcome === "string"
        ? outcome
        : isar === undefined
          ? getLimitFailure(limits)
          : undefined,
    isar,
    nodesSearched: statistics.inferences,
    maxBranchFormulas: index.getTopFormulaCount(),
    proofNodes: statistics.proofNodes,
    formulasCreated: exprs.getCreatedCount(),
  };
};

type ZenonDecision = { verdict: "unsat"; proof: string } | { verdict: "unknown"; error?: string };

// What Prove.prove prints on stderr when it gives up. Zenon never reaches the time limit tlapm
// gives it, since tlapm stops it first.
const FAILURE_ERRORS: Partial<Record<SearchFailure | "zenon error", string>> = {
  exhausted: "Zenon error: exhausted search space without finding a proof\n",
  "memory limit": "Zenon error: could not find a proof within the memory size limit\n",
};

// Zenon's verdict on a .znn file: "unsat" with the Isar proof that tlapm writes, when Zenon refutes
// the hypotheses with a proof that the checker accepts and prints it within the time limit.
export const decideZenon = (text: string, options: DecideOptions): ZenonDecision => {
  const run = runZenon(text, options);
  if (run.isar !== undefined) return { verdict: "unsat", proof: run.isar };
  const error = run.failure && FAILURE_ERRORS[run.failure];
  return { verdict: "unknown", ...(error !== undefined && { error }) };
};
