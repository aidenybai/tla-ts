import { once } from "node:events";
import { join } from "node:path";
import { scheduler } from "node:timers/promises";
import { Worker } from "node:worker_threads";
import type { DecideResponse } from "../src/prover/decide-pool";
import type { Verdict } from "../src/prover/verdict";
import { DIST_DIRECTORY } from "./dist";

interface CpuLimitedRun {
  verdict: Verdict;
  wallMilliseconds: number;
  cpuMilliseconds: number;
}

const POLL_MS = 100;

let warmWorker: Worker | undefined;

const startWorker = async () => {
  // Node keeps 192 KB of a worker's stack in reserve, so this matches the main thread's stack.
  const worker = new Worker(join(DIST_DIRECTORY, "prove-worker.js"), {
    resourceLimits: { stackSizeMb: 1.15 },
  });
  worker.postMessage({ prover: "smt", text: "", timeLimitMs: Number.POSITIVE_INFINITY });
  await once(worker, "message");
  return worker;
};

export const runWithCpuLimit = async (
  limitMs: number,
  prover: string,
  text: string,
): Promise<CpuLimitedRun> => {
  const worker = warmWorker ?? (await startWorker());
  warmWorker = undefined;
  worker.ref();
  const started = performance.now();
  const startedCpu = await worker.cpuUsage();
  const decided = once(worker, "message").then((message: DecideResponse[]) =>
    "verdict" in message[0] ? message[0].verdict : "unknown",
  );
  worker.postMessage({ prover, text, timeLimitMs: Number.POSITIVE_INFINITY });
  for (;;) {
    const verdict = await Promise.race([decided, scheduler.wait(POLL_MS)]);
    const wallMilliseconds = Math.round(performance.now() - started);
    const cpu = await worker.cpuUsage(startedCpu);
    const cpuMilliseconds = Math.round((cpu.user + cpu.system) / 1000);
    if (verdict !== undefined) {
      worker.unref();
      warmWorker = worker;
      return { verdict, wallMilliseconds, cpuMilliseconds };
    }
    if (wallMilliseconds > limitMs && cpuMilliseconds > limitMs) {
      await worker.terminate();
      return { verdict: "unknown", wallMilliseconds, cpuMilliseconds };
    }
  }
};
