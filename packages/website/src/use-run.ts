import { useEffect, useRef, useState } from "react";
import type { RunRequest, RunResult } from "./run-worker";

// Runs tla-ts in a worker, so a long check or proof never blocks the page. Stopping or unmounting
// terminates the worker.
export const useRun = () => {
  const [result, setResult] = useState<RunResult | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const stop = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsRunning(false);
  };

  const run = (request: RunRequest) => {
    workerRef.current?.terminate();
    const worker = new Worker(new URL("./run-worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    const finish = (nextResult: RunResult) => {
      setResult(nextResult);
      setRunCount((count) => count + 1);
      setIsRunning(false);
      worker.terminate();
      workerRef.current = null;
    };
    worker.onmessage = (event: MessageEvent<RunResult>) => finish(event.data);
    worker.onerror = (event) =>
      finish({
        isPassed: false,
        title: "Error",
        stats: undefined,
        name: undefined,
        summary: "",
        trace: [],
        loopStart: undefined,
        rows: [{ title: event.message, detail: "", isFailed: true }],
      });
    setIsRunning(true);
    worker.postMessage(request);
  };

  return { result, isRunning, runCount, run, stop };
};
