import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { RunResult } from "../run-worker";
import { usePlayback } from "../use-playback";
import { TraceTable } from "./trace-table";

const SPINNER = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
const SPINNER_INTERVAL_MS = 80;
const DRAWER_EASING = "duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";
const CONTROL_CLASS_NAME =
  "flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-sm text-gray-1100 hover:bg-gray-300 hover:text-gray-1200";

export const RunProgress = () => {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = performance.now();
    const interval = setInterval(
      () => setElapsedMs(performance.now() - startedAt),
      SPINNER_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="px-2 text-sm text-gray-1000 tabular-nums">
      {SPINNER[Math.floor(elapsedMs / SPINNER_INTERVAL_MS) % SPINNER.length]}{" "}
      {(elapsedMs / 1000).toFixed(1)} s
    </span>
  );
};

interface RunStatusProps {
  result: RunResult;
  onOpen: () => void;
}

export const RunStatus = (props: RunStatusProps) => (
  <button
    type="button"
    onClick={props.onOpen}
    className={cn(
      "mr-1 flex h-8 min-w-0 items-center gap-1.5 self-center rounded-full px-3 text-sm",
      props.result.isPassed
        ? "bg-success-soft text-success hover:bg-success-tint"
        : "bg-danger-soft text-danger hover:bg-danger-tint",
    )}
  >
    <span aria-hidden>{props.result.isPassed ? "✓" : "✕"}</span>
    <span className="truncate max-[400px]:sr-only">
      {props.result.isPassed ? "Passed" : (props.result.name ?? props.result.title)}
    </span>
  </button>
);

interface RunDrawerProps {
  result: RunResult | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export const RunDrawer = (props: RunDrawerProps) => {
  const result = props.result;
  const stepCount = result ? Math.max(result.trace.length, result.rows.length) : 0;
  const playback = usePlayback(stepCount);
  if (result === undefined) return null;
  const trace = result.trace;
  return (
    <>
      <div
        aria-hidden
        onClick={props.onClose}
        className={cn(
          "absolute inset-0 z-10 bg-overlay transition-opacity starting:opacity-0",
          DRAWER_EASING,
          !props.isOpen && "pointer-events-none opacity-0",
        )}
      />
      <section
        inert={!props.isOpen}
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 flex max-h-full flex-col rounded-t-xl bg-surface shadow-drawer transition-transform starting:translate-y-full",
          DRAWER_EASING,
          !props.isOpen && "translate-y-full",
        )}
      >
        <header className="flex items-start gap-3 py-2 pr-2 pl-4">
          <h3 className={cn("mr-auto pt-1 text-sm", !result.isPassed && "text-danger")}>
            <span>{result.title}</span>
            {result.name && (
              <code className="ml-2 rounded-md border bg-surface px-1 py-0.5 text-sm text-gray-1200">
                {result.name}
              </code>
            )}
            {result.summary && (
              <span className="ml-2 hidden text-gray-1000 tabular-nums whitespace-nowrap sm:inline">
                {result.summary}
              </span>
            )}
          </h3>
          {stepCount > 1 && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Previous state"
                className={CONTROL_CLASS_NAME}
                onClick={() => playback.select(playback.stepIndex - 1)}
              >
                ←
              </button>
              <button type="button" className={CONTROL_CLASS_NAME} onClick={playback.toggle}>
                {playback.isPlaying
                  ? "Pause"
                  : playback.stepIndex >= playback.lastIndex
                    ? "Replay"
                    : "Play"}
              </button>
              <button
                type="button"
                aria-label="Next state"
                className={CONTROL_CLASS_NAME}
                onClick={() => playback.select(playback.stepIndex + 1)}
              >
                →
              </button>
              <span className="ml-1 w-12 text-right text-sm text-gray-1000 tabular-nums">
                {playback.stepIndex + 1} / {stepCount}
              </span>
            </div>
          )}
          <button
            type="button"
            aria-label="Close results"
            onClick={props.onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-gray-1000 hover:bg-gray-300 hover:text-gray-1200 active:scale-[0.94]"
          >
            <X className="size-4" />
          </button>
        </header>
        {trace.length > 0 ? (
          <div
            data-drawer-scroll
            className="min-h-0 flex-1 overflow-auto overscroll-contain border-t"
          >
            <TraceTable
              trace={trace}
              loopStart={result.loopStart}
              failingIndex={result.isPassed ? undefined : playback.lastIndex}
              activeIndex={playback.stepIndex}
              onSelect={playback.select}
            />
            {result.loopStart !== undefined && (
              <p className="px-4 py-3 text-sm text-gray-1000">
                {result.loopStart === trace.length - 1
                  ? "The last state stutters forever."
                  : `After the last state, the behavior loops back to state ${String(result.loopStart + 1).padStart(2, "0")} forever.`}
              </p>
            )}
          </div>
        ) : (
          <ol className="min-h-0 overflow-auto border-t font-mono text-sm">
            {result.rows.map((row, index) => (
              <li
                key={index}
                className={cn(
                  "flex gap-4 border-b border-gray-300 px-4 py-1.5 transition-[opacity,background-color] duration-200",
                  index > playback.stepIndex && "opacity-30",
                  index === playback.stepIndex && (row.isFailed ? "bg-danger-soft" : "bg-gray-200"),
                )}
              >
                <span
                  className={cn(
                    "tabular-nums",
                    row.isFailed ? "text-danger-muted" : "text-gray-900",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => playback.select(index)}
                  className="min-w-0 text-left whitespace-pre-wrap"
                >
                  <span className={row.isFailed ? "text-danger" : "text-gray-1200"}>
                    {row.title}
                  </span>
                  {index === playback.stepIndex && row.detail && (
                    <span className="mt-1 block text-gray-1000">{row.detail}</span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
};
