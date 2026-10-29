// Runs a script's work on each recorded module in worker processes, --jobs of them at once, each
// taking one module at a time, largest first. The script forks itself with --worker, and a worker
// does the work on each module the parent sends it, by index.

import { fork } from "node:child_process";
import type { ModuleProofRecord } from "./proof-records";

// The results by module index. A module whose worker exits mid-module has none. In a worker, it
// never resolves.
export const runModuleWorkers = async <Result>(
  records: ModuleProofRecord[],
  work: (record: ModuleProofRecord) => Promise<Result>,
  defaultJobs: number,
): Promise<Map<number, Result>> => {
  if (process.argv.includes("--worker")) {
    process.on("message", (index: number) => {
      void work(records[index]).then((result) => process.send?.(result));
    });
    return new Promise(() => {});
  }
  const jobsIndex = process.argv.indexOf("--jobs");
  const jobs = jobsIndex === -1 ? defaultJobs : Number(process.argv[jobsIndex + 1]);
  const queue = records
    .map((record, index) => ({ index, size: record.obligations.length }))
    .toSorted((left, right) => right.size - left.size)
    .map((entry) => entry.index);
  const byModule = new Map<number, Result>();
  await Promise.all(
    Array.from({ length: Math.min(jobs, queue.length) }, async () => {
      const worker = fork(process.argv[1], [...process.argv.slice(2), "--worker"]);
      const next = () => {
        const index = queue.shift();
        if (index === undefined) return worker.disconnect();
        worker.send(index);
        worker.once("message", (result: Result) => {
          byModule.set(index, result);
          console.error(`${byModule.size}/${records.length} ${records[index].id}`);
          next();
        });
      };
      next();
      await new Promise((resolve) => worker.on("exit", resolve));
    }),
  );
  return byModule;
};
