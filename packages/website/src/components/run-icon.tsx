import { ArrowCounterClockwise, Play } from "@phosphor-icons/react";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { Spinner } from "./spinner";

const HIDDEN = { opacity: 0, scale: 0.5, filter: "blur(4px)" };

interface RunIconProps {
  isRunning: boolean;
  isDone: boolean;
}

export const RunIcon = (props: RunIconProps) => {
  const state = props.isRunning ? "running" : props.isDone ? "done" : "idle";
  const [firstState] = useState(state);
  const [hasChanged, setHasChanged] = useState(false);
  if (state !== firstState && !hasChanged) setHasChanged(true);
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <m.span
        key={state}
        // The animation engine loads after the page, and would play the first icon's entrance then.
        initial={hasChanged ? HIDDEN : false}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={HIDDEN}
        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        className="flex size-4 items-center justify-center"
      >
        {props.isRunning ? (
          <Spinner />
        ) : props.isDone ? (
          <ArrowCounterClockwise className="size-4" />
        ) : (
          <Play weight="fill" className="size-3.5" />
        )}
      </m.span>
    </AnimatePresence>
  );
};
