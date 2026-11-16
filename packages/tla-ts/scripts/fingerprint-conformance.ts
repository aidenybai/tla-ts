import { join } from "node:path";
import { TlaError } from "../src";
import { getFingerprint } from "../src/prover/prep/fingerprint";
import { CORPORA_DIRECTORY } from "./corpora";
import { getModuleObligations, readProofRecords } from "./proof-records";

let reusedCount = 0;
let unmatchedCount = 0;
let sharedCount = 0;
let unloadedCount = 0;
for (const record of readProofRecords()) {
  const obligations = (() => {
    try {
      return getModuleObligations(join(CORPORA_DIRECTORY, record.id));
    } catch (error) {
      if (!(error instanceof TlaError)) throw error;
      return undefined;
    }
  })();
  if (!obligations) {
    unloadedCount++;
    continue;
  }
  const byId = new Map(obligations.map((obligation) => [obligation.id, obligation]));
  const seen = new Map<string, { id: number; provers: Set<string> }>();
  record.obligations.forEach((expected) => {
    const obligation = byId.get(expected.id);
    if (!obligation || (expected.status !== "proved" && expected.status !== "failed")) return;
    const fingerprint = getFingerprint(obligation.sequent);
    const prior = seen.get(fingerprint);
    const isShared = prior?.provers.has(expected.prover) ?? false;
    if (expected.status === "proved" && expected.timeUsed === undefined) {
      if (isShared) reusedCount++;
      else {
        unmatchedCount++;
        console.log(`unmatched ${record.id} #${expected.id}: ${expected.prover}`);
      }
    } else if (isShared) {
      sharedCount++;
      console.log(`shared    ${record.id} #${expected.id}: ${expected.prover} with #${prior?.id}`);
    }
    const entry = prior ?? { id: expected.id, provers: new Set<string>() };
    entry.provers.add(expected.prover);
    seen.set(fingerprint, entry);
  });
}
console.log(
  `${reusedCount} reused, ${unmatchedCount} unmatched, ${sharedCount} shared, ${unloadedCount} modules unloaded`,
);
if (unmatchedCount > 0) process.exitCode = 1;
