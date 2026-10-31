// Runs a backend until it has used its time limit in both wall-clock and CPU time. A loaded machine
// stretches wall-clock time, so the CPU time of the thread that runs it estimates a run on an idle
// core. The backends run synchronously, so each run gets a worker thread of its own, which this
// terminates once the limit has passed.

import { once } from "node:events";
import { scheduler } from "node:timers/promises";
import { Worker } from "node:worker_threads";
import type { Verdict } from "../src/prove/verdict";

export interface CpuLimitedRun {
  verdict: Verdict;
  wallMilliseconds: number;
  cpuMilliseconds: number;
}

const POLL_MS = 100;

export const runWithCpuLimit = async (
  limitMs: number,
  prover: string,
  text: string,
): Promise<CpuLimitedRun> => {
  // Node keeps 192 KB of a worker's stack in reserve, so this gives the backend the stack it has on
  // the main thread.
  const worker = new Worker(new URL("./cpu-limit-worker.ts", import.meta.url), {
    resourceLimits: { stackSizeMb: 1.15 },
  });
  // The thread's CPU time counts from the moment it has loaded the backends.
  await once(worker, "message");
  const started = performance.now();
  const startedCpu = await worker.cpuUsage();
  const getCpuMilliseconds = async () => {
    const cpu = await worker.cpuUsage(startedCpu);
    return Math.round((cpu.user + cpu.system) / 1000);
  };
  const decided = once(worker, "message").then((message: Verdict[]) => message[0]);
  worker.postMessage({ prover, text });
  for (;;) {
    const verdict = await Promise.race([decided, scheduler.wait(POLL_MS)]);
    const wallMilliseconds = Math.round(performance.now() - started);
    const cpuMilliseconds = await getCpuMilliseconds();
    if (verdict !== undefined || (wallMilliseconds > limitMs && cpuMilliseconds > limitMs)) {
      await worker.terminate();
      return { verdict: verdict ?? "unknown", wallMilliseconds, cpuMilliseconds };
    }
  }
};
