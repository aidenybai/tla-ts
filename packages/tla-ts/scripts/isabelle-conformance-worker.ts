import { parentPort } from "node:worker_threads";
import { decideIsabelle } from "../src/prove/isabelle/decide";

// Decides each theory isabelle-conformance.ts sends, timing it by this thread's own CPU time.
// The main thread enforces the time limit: it terminates this worker once the limit has passed.
parentPort?.on("message", (text: string) => {
  const started = performance.now();
  const startedCpu = process.threadCpuUsage();
  const verdict = decideIsabelle(text, { timeLimitMs: Number.POSITIVE_INFINITY });
  const cpu = process.threadCpuUsage(startedCpu);
  parentPort?.postMessage({
    verdict,
    wallMilliseconds: Math.round(performance.now() - started),
    cpuMilliseconds: Math.round((cpu.user + cpu.system) / 1000),
  });
});
