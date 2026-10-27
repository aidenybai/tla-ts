import { useEffect, useRef, useState } from "react";
import type { CheckRequest, CheckResponse } from "../check-worker";

// Runs a check in a worker, so a long search never blocks the page and Stop can end it.
export const useCheck = () => {
  const [response, setResponse] = useState<CheckResponse | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const workerRef = useRef<Worker | undefined>(undefined);

  const stop = () => {
    workerRef.current?.terminate();
    workerRef.current = undefined;
    setIsRunning(false);
  };

  const run = (request: CheckRequest, onResponse: (response: CheckResponse) => void) => {
    stop();
    const worker = new Worker(new URL("../check-worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    setIsRunning(true);
    setResponse(undefined);
    setRunCount((count) => count + 1);
    worker.onmessage = (event: MessageEvent<CheckResponse>) => {
      setResponse(event.data);
      stop();
      onResponse(event.data);
    };
    worker.postMessage(request);
  };

  const reset = () => {
    stop();
    setResponse(undefined);
  };

  useEffect(() => () => workerRef.current?.terminate(), []);

  return { response, isRunning, runCount, run, stop, reset };
};
