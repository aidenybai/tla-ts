import { useEffect, useRef, useState } from "react";
import { runOnEscore, startEscoreWorker, stopEscoreRun } from "./escore-worker";
import { getErrorResult } from "./run-error";
import type { RunRequest, RunResult } from "./run-worker";

const createWorker = () =>
  new Worker(new URL("./run-worker.ts", import.meta.url), { type: "module" });

export const useRun = (isWarm = false) => {
  const [result, setResult] = useState<RunResult | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | undefined>(undefined);

  const stop = () => {
    if (__TLA_TS_ESCORE__) stopEscoreRun();
    workerRef.current?.terminate();
    workerRef.current = undefined;
    setIsRunning(false);
  };

  // A warm runner loads the checker ahead of the first run, which then starts at once.
  useEffect(() => {
    if (__TLA_TS_ESCORE__) {
      if (isWarm) startEscoreWorker();
      return;
    }
    if (isWarm) workerRef.current = createWorker();
    return () => workerRef.current?.terminate();
  }, [isWarm]);

  const run = (request: RunRequest) => {
    if (__TLA_TS_ESCORE__) {
      stopEscoreRun();
      setIsRunning(true);
      runOnEscore(request, (nextResult) => {
        setResult(nextResult);
        setIsRunning(false);
      });
      return;
    }
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
