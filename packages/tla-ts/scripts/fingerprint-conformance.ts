// Checks the fingerprints tla-ts computes against the proofs tlapm reused. tlapm reports a proof
// it reuses from an earlier obligation with the same fingerprint without a time, so each such
// obligation must share its fingerprint with an earlier one in its module that the same prover
// concluded about. A freshly decided obligation that shares one is reported too, as a fingerprint
// that may be too coarse or a module recorded without fingerprints.

import { join } from "node:path";
import { TlaError } from "../src";
import { getFingerprint } from "../src/prove/prep/fingerprint";
import { CORPORA_DIRECTORY, getLibraryModules, getModuleObligations } from "./corpora";
import { readProofRecords } from "./proof-records";

const libraryModules = getLibraryModules();
const counts = { reused: 0, unmatched: 0, shared: 0, unloaded: 0 };
for (const record of readProofRecords()) {
  const obligations = (() => {
    try {
      return getModuleObligations(join(CORPORA_DIRECTORY, record.id), libraryModules);
    } catch (error) {
      if (!(error instanceof TlaError)) throw error;
      return undefined;
    }
  })();
  if (!obligations) {
    counts.unloaded++;
    continue;
  }
  const byId = new Map(obligations.map((obligation) => [obligation.id, obligation]));
  // The first obligation with each fingerprint, and the provers that concluded about one.
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
