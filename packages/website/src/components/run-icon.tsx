import { ArrowCounterClockwise, Play } from "@phosphor-icons/react";
import { AnimatePresence, m } from "motion/react";

const LINE_COUNT = 8;
const HIDDEN = { opacity: 0, scale: 0.5, filter: "blur(4px)" };

interface RunIconProps {
  isRunning: boolean;
  isDone: boolean;
}

export const RunIcon = (props: RunIconProps) => (
  <AnimatePresence mode="popLayout" initial={false}>
    <m.span
      key={props.isRunning ? "running" : props.isDone ? "done" : "idle"}
      initial={HIDDEN}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={HIDDEN}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
      className="flex size-4 items-center justify-center"
    >
      {props.isRunning ? (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          className="size-4"
        >
          {Array.from({ length: LINE_COUNT }, (_line, index) => (
            <line
              key={index}
              x1={12}
              y1={3}
              x2={12}
              y2={7}
              transform={`rotate(${(index * 360) / LINE_COUNT} 12 12)`}
              style={{ animationDelay: `${index / LINE_COUNT - 1}s` }}
              className="animate-line-fade"
            />
          ))}
        </svg>
      ) : props.isDone ? (
        <ArrowCounterClockwise weight="bold" className="size-4" />
      ) : (
        <Play weight="fill" className="size-3.5" />
      )}
    </m.span>
  </AnimatePresence>
);
