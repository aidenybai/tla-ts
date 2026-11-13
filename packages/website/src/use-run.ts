import { useRef, useState } from "react";
import { getErrorResult } from "./run-error";
import type { RunRequest, RunResult } from "./run-worker";

export const useRun = () => {
  const [result, setResult] = useState<RunResult | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | undefined>(undefined);

  const stop = () => {
    workerRef.current?.terminate();
    workerRef.current = undefined;
    setIsRunning(false);
  };

  const run = (request: RunRequest) => {
    stop();
    const worker = new Worker(new URL("./run-worker.ts", import.meta.url), { type: "module" });
    const finish = (nextResult: RunResult) => {
      setResult(nextResult);
      stop();
    };
    worker.onmessage = (event: MessageEvent<RunResult>) => finish(event.data);
    worker.onerror = (event) => finish(getErrorResult(event.message));
    workerRef.current = worker;
    setIsRunning(true);
    worker.postMessage(request);
  };

  return { result, isRunning, run, stop, reset: () => setResult(undefined) };
};
