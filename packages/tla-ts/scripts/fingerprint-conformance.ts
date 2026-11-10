import { join } from "node:path";
import { TlaError } from "../src";
import { getFingerprint } from "../src/prover/prep/fingerprint";
import { CORPORA_DIRECTORY } from "./corpora";
import { getObligationsById, readProofRecords } from "./proof-records";

const counts = { reused: 0, unmatched: 0, shared: 0, unloaded: 0 };
for (const record of readProofRecords()) {
  const byId = (() => {
    try {
      return getObligationsById(join(CORPORA_DIRECTORY, record.id));
    } catch (error) {
      if (!(error instanceof TlaError)) throw error;
      return undefined;
    }
  })();
  if (!byId) {
    counts.unloaded++;
    continue;
  }
  const seen = new Map<string, { id: number; provers: Set<string> }>();
  record.obligations.forEach((expected) => {
    const obligation = byId.get(expected.id);
    if (!obligation || (expected.status !== "proved" && expected.status !== "failed")) return;
    const fingerprint = getFingerprint(obligation.sequent);
    const prior = seen.get(fingerprint);
    const isShared = prior?.provers.has(expected.prover) ?? false;
    if (expected.status === "proved" && expected.timeUsed === undefined) {
      if (isShared) counts.reused++;
      else {
        counts.unmatched++;
        console.log(`unmatched ${record.id} #${expected.id}: ${expected.prover}`);
      }
    } else if (isShared) {
      counts.shared++;
      console.log(`shared    ${record.id} #${expected.id}: ${expected.prover} with #${prior?.id}`);
    }
    const entry = prior ?? { id: expected.id, provers: new Set<string>() };
    entry.provers.add(expected.prover);
    seen.set(fingerprint, entry);
  });
}
console.log(
  `${counts.reused} reused, ${counts.unmatched} unmatched, ${counts.shared} shared, ${counts.unloaded} modules unloaded`,
);
if (counts.unmatched > 0) process.exitCode = 1;
