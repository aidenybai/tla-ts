import { useEffect, useState } from "react";
import { runOnEscore, startEscoreWorker, stopEscoreRun } from "./escore-worker";
import type { RunRequest, RunResult } from "./run-worker";

export const useRun = (isWarm = false) => {
  const [result, setResult] = useState<RunResult | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);

  const stop = () => {
    stopEscoreRun();
    setIsRunning(false);
  };

  // A warm runner loads the checker ahead of the first run, which then starts at once.
  useEffect(() => {
    if (isWarm) startEscoreWorker();
  }, [isWarm]);

  const run = (request: RunRequest) => {
    stopEscoreRun();
    setIsRunning(true);
    runOnEscore(request, (nextResult) => {
      setResult(nextResult);
      setIsRunning(false);
    });
  };

  return { result, isRunning, run, stop, reset: () => setResult(undefined) };
};
