import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONFORMANCE_DIRECTORY,
  CORPORA_DIRECTORY,
  formatSeconds,
  getMedian,
  getOption,
  writeResults,
} from "./corpora";
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

const workers = Number(getOption("--workers") ?? 1);

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

writeResults(RESULTS_PATH, timings);

const describe = (timing: Timing) =>
  `  ${timing.module} (${timing.obligations} obligations): ${formatSeconds(timing.wall)}, CPU ${formatSeconds(timing.cpu)}, tlapm ${formatSeconds(timing.tlapm)}`;
console.log(`modules: ${timings.length}`);
const getTotal = (key: "wall" | "cpu" | "tlapm") =>
  formatSeconds(timings.reduce((total, timing) => total + timing[key], 0));
console.log(`total: ${getTotal("wall")}, CPU ${getTotal("cpu")}, tlapm ${getTotal("tlapm")}`);
console.log(
  `median per module: ${formatSeconds(getMedian(timings.map((timing) => timing.wall)))}, CPU ${formatSeconds(getMedian(timings.map((timing) => timing.cpu)))}`,
);
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
