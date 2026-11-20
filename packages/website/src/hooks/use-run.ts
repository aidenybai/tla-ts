import { useEffect, useRef, useState } from "react";
import { getErrorResult } from "@/lib/run-error";
import type { RunRequest, RunResult } from "@/lib/run-worker";

const createWorker = () =>
  new Worker(new URL("../lib/run-worker.ts", import.meta.url), { type: "module" });

export const useRun = (isWarm = false) => {
  const [result, setResult] = useState<RunResult | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | undefined>(undefined);

  const stop = () => {
    workerRef.current?.terminate();
    workerRef.current = undefined;
    setIsRunning(false);
  };

  // A warm runner loads the checker ahead of the first run, which then starts at once.
  useEffect(() => {
    if (isWarm) workerRef.current = createWorker();
    return () => workerRef.current?.terminate();
  }, [isWarm]);

  const run = (request: RunRequest) => {
    const idle = isRunning ? undefined : workerRef.current;
    if (idle === undefined) stop();
    const worker = idle ?? createWorker();
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
