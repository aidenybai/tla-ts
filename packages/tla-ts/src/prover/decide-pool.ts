// Worker threads that decide the obligations prove sends them, the earliest obligation first.

import { TlaProverError } from "../errors";
import { spawnWorker, type WorkerHandle } from "../worker";
import type { DecideOptions, Decision } from "./verdict";

export interface DecideRequest {
  prover: string;
  text: string;
  timeLimitMs: number;
}

// A backend's decision, or the message of the TlaProverError it threw, which prove turns into a
// result.
export type DecideResponse = Decision | { error: string };

interface PendingDecision {
  request: DecideRequest;
  priority: number;
  resolve: (decision: Decision) => void;
  reject: (error: unknown) => void;
}

export interface DecidePool {
  decide: (
    prover: string,
    text: string,
    options: DecideOptions,
    priority: number,
  ) => Promise<Decision>;
  // Rejects every decision not yet made with reason, and stops the workers.
  terminate: (reason: unknown) => void;
}

export const createDecidePool = async (workerCount: number): Promise<DecidePool> => {
  const workers: WorkerHandle[] = [];
  const queue: PendingDecision[] = [];
  const running = new Map<number, PendingDecision>();
  const idle: number[] = [];
  const state: { failure: { reason: unknown } | undefined } = { failure: undefined };
  const dispatch = () => {
    while (idle.length > 0 && queue.length > 0) {
      const earliest = queue.reduce(
        (best, decision, position) => (decision.priority < queue[best].priority ? position : best),
        0,
      );
      const [decision] = queue.splice(earliest, 1);
      const index = idle.pop() ?? 0;
      running.set(index, decision);
      workers[index].postMessage(decision.request);
    }
  };
  const onResponse = (index: number, message: unknown) => {
    const response = message as DecideResponse;
    const decision = running.get(index);
    running.delete(index);
    idle.push(index);
    if ("verdict" in response) decision?.resolve(response);
    if ("error" in response) decision?.reject(new TlaProverError(response.error));
    dispatch();
  };
  const terminate = (reason: unknown) => {
    if (state.failure) return;
    state.failure = { reason };
    [...queue.splice(0), ...running.values()].forEach((decision) => decision.reject(reason));
    running.clear();
    workers.forEach((worker) => worker.terminate());
  };
  workers.push(
    ...(await Promise.all(
      Array.from({ length: workerCount }, (_, index) =>
        spawnWorker(
          new URL("./prove-worker.js", import.meta.url),
          (message) => onResponse(index, message),
          terminate,
        ),
      ),
    )),
  );
  idle.push(...workers.keys());
  return {
    decide: (prover, text, options, priority) =>
      new Promise((resolve, reject) => {
        if (state.failure) return reject(state.failure.reason);
        queue.push({
          request: { prover, text, timeLimitMs: options.timeLimitMs },
          priority,
          resolve,
          reject,
        });
        dispatch();
      }),
    terminate,
  };
};
