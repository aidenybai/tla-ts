// Times the built prove on each recorded module against the time tlapm's provers reported using on
// it, as conformance:record-proofs recorded it. tlapm's time leaves out its own Prep and counts only
// the provers. Modules run one at a time unless --jobs says otherwise, and prove runs on one thread
// unless --workers says otherwise. The CPU time counts every thread of the module's process, and
// stays fair on a busy machine where the wall time doesn't. Each module's times go to
// .prove-benchmark.json.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY } from "./corpora";
import { tlaTs } from "./dist";
import { runModuleWorkers } from "./module-workers";
import { getModuleLoader, readProofRecords, type ModuleProofRecord } from "./proof-records";

interface ModuleTime {
  wall: number;
  cpu: number;
}

interface Timing extends ModuleTime {
  module: string;
  obligations: number;
  tlapm: number;
}

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".prove-benchmark.json");

const workersIndex = process.argv.indexOf("--workers");
const workers = workersIndex === -1 ? 1 : Number(process.argv[workersIndex + 1]);

const formatSeconds = (milliseconds: number) => `${(milliseconds / 1000).toFixed(2)} s`;

const getMedian = (values: number[]) => {
  const sorted = values.toSorted((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

// The time prove takes on a module, or undefined when tla-ts can't load it.
const timeModule = async (record: ModuleProofRecord): Promise<ModuleTime | undefined> => {
  const path = join(CORPORA_DIRECTORY, record.id);
  const startedAt = performance.now();
  const cpuBefore = process.cpuUsage();
  return tlaTs
    .prove({ source: readFileSync(path, "utf8"), loadModule: getModuleLoader(path), workers })
    .then(
      () => {
        const cpu = process.cpuUsage(cpuBefore);
        return { wall: performance.now() - startedAt, cpu: (cpu.user + cpu.system) / 1000 };
      },
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
    { module: record.id, obligations: record.obligations.length, ...time, tlapm: tlapm * 1000 },
  ];
});

writeFileSync(RESULTS_PATH, `${JSON.stringify(timings, null, 2)}\n`);

const describe = (timing: Timing) =>
  `  ${timing.module} (${timing.obligations} obligations): ${formatSeconds(timing.wall)}, CPU ${formatSeconds(timing.cpu)}, tlapm ${formatSeconds(timing.tlapm)}`;
console.log(`modules: ${timings.length}`);
const getTotal = (key: "wall" | "cpu" | "tlapm") =>
  formatSeconds(timings.reduce((total, timing) => total + timing[key], 0));
console.log(`total: ${getTotal("wall")}, CPU ${getTotal("cpu")}, tlapm ${getTotal("tlapm")}`);
console.log(
  `median per module: ${formatSeconds(getMedian(timings.map((timing) => timing.wall)))}, CPU ${formatSeconds(getMedian(timings.map((timing) => timing.cpu)))}`,
);
// tlapm prints a tenth of a second, so the ratio leaves out the modules it reported as 0 s.
const timed = timings.filter((timing) => timing.tlapm > 0);
console.log(
  `median ratio to tlapm: ${getMedian(timed.map((timing) => timing.wall / timing.tlapm)).toFixed(2)}, CPU ${getMedian(timed.map((timing) => timing.cpu / timing.tlapm)).toFixed(2)}, over ${timed.length} modules`,
);
console.log("slowest:");
timings
  .toSorted((left, right) => right.wall - left.wall)
  .slice(0, 10)
  .forEach((timing) => console.log(describe(timing)));
console.log("furthest behind tlapm:");
timings
  .toSorted((left, right) => right.wall - right.tlapm - (left.wall - left.tlapm))
  .slice(0, 10)
  .forEach((timing) => console.log(describe(timing)));
