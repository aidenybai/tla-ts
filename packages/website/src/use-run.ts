import { useState } from "react";
import { getErrorResult } from "./run-error";
import type { RunRequest, RunResult } from "./run-worker";

export const useRun = () => {
  const [result, setResult] = useState<RunResult | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [runCount, setRunCount] = useState(0);

  const run = (request: RunRequest) => {
    const worker = new Worker(new URL("./run-worker.ts", import.meta.url), { type: "module" });
    const finish = (nextResult: RunResult) => {
      setResult(nextResult);
      setRunCount((count) => count + 1);
      setIsRunning(false);
      worker.terminate();
    };
    worker.onmessage = (event: MessageEvent<RunResult>) => finish(event.data);
    worker.onerror = (event) => finish(getErrorResult("Error", event.message));
    setIsRunning(true);
    worker.postMessage(request);
  };

  return { result, isRunning, runCount, run };
};
