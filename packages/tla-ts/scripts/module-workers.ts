import { fork } from "node:child_process";
import { getOption } from "./corpora";
import type { ModuleProofRecord } from "./proof-records";

export const runModuleWorkers = async <Result>(
  records: ModuleProofRecord[],
  work: (record: ModuleProofRecord) => Promise<Result>,
  defaultJobs: number,
): Promise<Map<number, Result>> => {
  if (process.argv.includes("--worker")) {
    // A worker wraps each result, as a process can't send undefined.
    process.on("message", (index: number) => {
      void work(records[index]).then((result) => process.send?.({ result }));
    });
    // Node exits with code 13 when the event loop empties under a pending top-level await.
    process.once("disconnect", () => process.exit(0));
    return new Promise(() => {});
  }
  const jobs = Number(getOption("--jobs") ?? defaultJobs);
  const queue = records
    .map((record, index) => ({ index, size: record.obligations.length }))
    .toSorted((left, right) => right.size - left.size)
    .map((entry) => entry.index);
  const byModule = new Map<number, Result>();
  await Promise.all(
    Array.from({ length: Math.min(jobs, queue.length) }, async () => {
      while (queue.length > 0) {
        const worker = fork(process.argv[1], [...process.argv.slice(2), "--worker"]);
        const sendNext = () => {
          const index = queue.shift();
          if (index === undefined) return worker.disconnect();
          worker.send(index);
          worker.once("message", (message: { result: Result }) => {
            byModule.set(index, message.result);
            console.error(`${byModule.size}/${records.length} ${records[index].id}`);
            sendNext();
          });
        };
        sendNext();
        await new Promise((resolve) => worker.on("exit", resolve));
      }
    }),
  );
  return byModule;
};
