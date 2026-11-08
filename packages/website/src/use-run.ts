import { useState } from "react";
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
    worker.onerror = (event) =>
      finish({
        isPassed: false,
        title: "Error",
        name: undefined,
        summary: "",
        trace: [],
        loopStart: undefined,
        rows: [{ title: event.message, detail: "", isFailed: true }],
      });
    setIsRunning(true);
    worker.postMessage(request);
  };

  return { result, isRunning, runCount, run };
};
