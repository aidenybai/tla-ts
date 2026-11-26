import { useEffect, useState } from "react";
import { clearCrashNote, runOnJsTla, startJsTlaWorker, stopJsTlaRun } from "@/lib/js-tla-worker";
import type { RunRequest, RunResult } from "@/lib/run-worker";

export const useRun = (isWarm = false) => {
  const [result, setResult] = useState<RunResult | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);

  const stop = () => {
    stopJsTlaRun();
    setIsRunning(false);
  };

  // The page showed the run's result, so the tab outlived the run.
  useEffect(() => {
    if (result !== undefined) clearCrashNote("run");
  }, [result]);

  // A warm runner loads the checker ahead of the first run, which then starts at once.
  useEffect(() => {
    if (isWarm) startJsTlaWorker();
  }, [isWarm]);

  const run = (request: RunRequest) => {
    stopJsTlaRun();
    setIsRunning(true);
    runOnJsTla(request, (nextResult) => {
      setResult(nextResult);
      setIsRunning(false);
    });
  };

  return { result, isRunning, run, stop, show: setResult, reset: () => setResult(undefined) };
};
