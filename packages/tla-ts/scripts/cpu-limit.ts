// Runs a backend until it has used its time limit in both wall-clock and CPU time. A loaded machine
// stretches wall-clock time, so the CPU time of the thread that runs it estimates a run on an idle
// core. The backends run synchronously, so the runs go to a thread of the built package's decide
// pool worker, which this terminates once a limit has passed. Until then the thread stays warm for
// the next run, so its compiled code carries over as it does in prove.

import { once } from "node:events";
import { join } from "node:path";
import { scheduler } from "node:timers/promises";
import { Worker } from "node:worker_threads";
import type { DecideResponse } from "../src/prove/decide-pool";
import type { Verdict } from "../src/prove/verdict";
import { DIST_DIRECTORY } from "./dist";

export interface CpuLimitedRun {
  verdict: Verdict;
  wallMilliseconds: number;
  cpuMilliseconds: number;
}

const POLL_MS = 100;

// A backend that rejects its input answers unknown, as tlapm counts that as a failure.
const getVerdict = (response: DecideResponse) =>
  "verdict" in response ? response.verdict : "unknown";

// The thread that the last run left, if its limit didn't pass.
const state: { warm: Worker | undefined } = { warm: undefined };

const startWorker = async () => {
  // Node keeps 192 KB of a worker's stack in reserve, so this gives the backend the stack it has on
  // the main thread.
  const worker = new Worker(join(DIST_DIRECTORY, "prove-worker.js"), {
    resourceLimits: { stackSizeMb: 1.15 },
  });
  // The thread's CPU time counts from the moment it has loaded the backends, which its answer to an
  // empty SMT input shows.
  worker.postMessage({ prover: "smt", text: "", timeLimitMs: Number.POSITIVE_INFINITY });
  await once(worker, "message");
  return worker;
};

export const runWithCpuLimit = async (
  limitMs: number,
  prover: string,
  text: string,
): Promise<CpuLimitedRun> => {
  const worker = state.warm ?? (await startWorker());
  state.warm = undefined;
  worker.ref();
  const started = performance.now();
  const startedCpu = await worker.cpuUsage();
  const getCpuMilliseconds = async () => {
    const cpu = await worker.cpuUsage(startedCpu);
    return Math.round((cpu.user + cpu.system) / 1000);
  };
  const decided = once(worker, "message").then((message: DecideResponse[]) =>
    getVerdict(message[0]),
  );
  // The backend gets no time limit of its own, as this terminates the thread once the limit passes.
  worker.postMessage({ prover, text, timeLimitMs: Number.POSITIVE_INFINITY });
  for (;;) {
    const verdict = await Promise.race([decided, scheduler.wait(POLL_MS)]);
    const wallMilliseconds = Math.round(performance.now() - started);
    const cpuMilliseconds = await getCpuMilliseconds();
    if (verdict !== undefined) {
      // A thread waiting for the next run doesn't keep the process alive.
      worker.unref();
      state.warm = worker;
      return { verdict, wallMilliseconds, cpuMilliseconds };
    }
    if (wallMilliseconds > limitMs && cpuMilliseconds > limitMs) {
      await worker.terminate();
      return { verdict: "unknown", wallMilliseconds, cpuMilliseconds };
    }
  }
};
