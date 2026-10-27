import { useEffect, useState } from "react";

const STEP_INTERVAL_MS = 600;

// Steps through a trace one state at a time. Mount it once per trace, so a new trace starts over.
export const usePlayback = (stepCount: number) => {
  const lastIndex = stepCount - 1;
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlayRequested, setIsPlayRequested] = useState(stepCount > 1);
  const isPlaying = isPlayRequested && stepIndex < lastIndex;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => setStepIndex((index) => index + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex]);

  const select = (index: number) => {
    setIsPlayRequested(false);
    setStepIndex(Math.max(0, Math.min(lastIndex, index)));
  };

  const toggle = () => {
    if (stepIndex >= lastIndex) setStepIndex(0);
    setIsPlayRequested(!isPlaying);
  };

  return { stepIndex, lastIndex, isPlaying, select, toggle };
};
