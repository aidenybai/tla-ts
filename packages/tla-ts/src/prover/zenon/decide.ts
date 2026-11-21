import { TlaZenonError } from "../../errors";
import type { DecideOptions, Decision } from "../verdict";
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
  failure: SearchFailure | "zenon error" | undefined;
  isar: string | undefined;
  nodesSearched: number;
  maxBranchFormulas: number;
  proofNodes: number;
  formulasCreated: number;
}

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

const FAILURE_ERRORS = new Map<ZenonRun["failure"], string>([
  ["exhausted", "Zenon error: exhausted search space without finding a proof\n"],
  ["memory limit", "Zenon error: could not find a proof within the memory size limit\n"],
]);

export const decideZenon = (text: string, options: DecideOptions): Omit<Decision, "timeUsedMs"> => {
  const run = runZenon(text, options);
  return run.isar === undefined
    ? { verdict: "unknown", errorOutput: FAILURE_ERRORS.get(run.failure) }
    : { verdict: "unsat", output: run.isar };
};
