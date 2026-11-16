import { parentPort } from "node:worker_threads";
import { decideIsabelle } from "../src/prover/isabelle/decide";

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
