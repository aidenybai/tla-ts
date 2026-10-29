// Times the built prove on each recorded module against the time tlapm's provers reported using on
// it, as conformance:record-proofs recorded it. tlapm's time leaves out its own Prep and counts only
// the provers. Modules run one at a time unless --jobs says otherwise.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CORPORA_DIRECTORY } from "./corpora";
import { runModuleWorkers } from "./module-workers";
import { getModuleLoader, readProofRecords, type ModuleProofRecord } from "./proof-records";

interface Timing {
  module: string;
  obligations: number;
  tlaTs: number;
  tlapm: number;
}

const DIST_PATH = join(import.meta.dirname, "../dist/index.js");

if (!existsSync(DIST_PATH)) {
  console.error("Build the package first with pnpm build");
  process.exit(1);
}

const tlaTs: typeof import("../src") = await import(DIST_PATH);

const formatSeconds = (milliseconds: number) => `${(milliseconds / 1000).toFixed(2)} s`;

const getMedian = (values: number[]) => {
  const sorted = values.toSorted((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

// The time prove takes on a module, or undefined when tla-ts can't load it.
const timeModule = async (record: ModuleProofRecord) => {
  const path = join(CORPORA_DIRECTORY, record.id);
  const startedAt = performance.now();
  return tlaTs
    .prove({ source: readFileSync(path, "utf8"), loadModule: getModuleLoader(path) })
    .then(
      () => performance.now() - startedAt,
      (error: unknown) => {
        if (!(error instanceof tlaTs.TlaError)) throw error;
        return undefined;
      },
    );
};

const records = readProofRecords();
const byModule = await runModuleWorkers(records, timeModule, 1);
const timings = records.flatMap((record, index): Timing[] => {
  const time = byModule.get(index);
  if (time === undefined) return [];
  const tlapm = record.obligations.reduce(
    (total, obligation) => total + ("timeUsed" in obligation ? (obligation.timeUsed ?? 0) : 0),
    0,
  );
  return [
    { module: record.id, obligations: record.obligations.length, tlaTs: time, tlapm: tlapm * 1000 },
  ];
});

const describe = (timing: Timing) =>
  `  ${timing.module} (${timing.obligations} obligations): ${formatSeconds(timing.tlaTs)}, tlapm ${formatSeconds(timing.tlapm)}`;
console.log(`modules: ${timings.length}`);
console.log(
  `total: ${formatSeconds(timings.reduce((total, timing) => total + timing.tlaTs, 0))}, tlapm ${formatSeconds(timings.reduce((total, timing) => total + timing.tlapm, 0))}`,
);
console.log(
  `median per module: ${formatSeconds(getMedian(timings.map((timing) => timing.tlaTs)))}`,
);
// tlapm prints a tenth of a second, so the ratio leaves out the modules it reported as 0 s.
const timed = timings.filter((timing) => timing.tlapm > 0);
console.log(
  `median ratio to tlapm: ${getMedian(timed.map((timing) => timing.tlaTs / timing.tlapm)).toFixed(2)} over ${timed.length} modules`,
);
console.log("slowest:");
timings
  .toSorted((left, right) => right.tlaTs - left.tlaTs)
  .slice(0, 10)
  .forEach((timing) => console.log(describe(timing)));
console.log("furthest behind tlapm:");
timings
  .toSorted((left, right) => right.tlaTs - right.tlapm - (left.tlaTs - left.tlapm))
  .slice(0, 10)
  .forEach((timing) => console.log(describe(timing)));
