import { Fragment, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CheckSummary, TraceStepSummary } from "../../check-worker";
import { usePlayback } from "../../hooks/use-playback";
import { TraceDiagram } from "../trace-diagram/trace-diagram";
import { usePlayground } from "./playground-context";

interface TraceResultProps {
  result: CheckSummary;
}

const STATUS_LABELS: Record<CheckSummary["status"], string> = {
  success: "No error found",
  "assumption-violation": "Assumption is false",
  "invariant-violation": "Invariant violated",
  "property-violation": "Property violated",
  "liveness-violation": "Temporal property violated",
  "postcondition-violation": "Postcondition is false",
  deadlock: "Deadlock reached",
  error: "Error",
};

const SPINNER = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
const SPINNER_INTERVAL_MS = 80;
const CONTROL_CLASS_NAME =
  "flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-sm font-medium text-gray-1100 hover:bg-gray-300 hover:text-gray-1200";

// Mounts only while a check runs, so the timer starts from zero each time.
const CheckProgress = () => {
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
    <p className="p-4 text-sm text-gray-1000 tabular-nums">
      {SPINNER[Math.floor(elapsedMs / SPINNER_INTERVAL_MS) % SPINNER.length]} Checking every
      reachable state… {(elapsedMs / 1000).toFixed(1)}s
    </p>
  );
};

const TraceResult = (props: TraceResultProps) => {
  const result = props.result;
  const trace = result.trace;
  const playback = usePlayback(trace.length);
  const isFailure = result.status !== "success";
  const actions = [...new Set(trace.flatMap((step) => step.action ?? []))];
  const loopStart = result.loopStart ?? trace.length;

  const renderEdge = (step: TraceStepSummary) =>
    step.action !== undefined && (
      <TraceDiagram.Edge
        action={step.action}
        glyphIndex={actions.indexOf(step.action)}
        isDimmed={step.number - 1 > playback.stepIndex}
      />
    );

  const renderNode = (step: TraceStepSummary, index: number) => (
    <TraceDiagram.Node
      number={step.number}
      variables={step.variables}
      previousVariables={trace[index - 1]?.variables}
      glyphIndex={step.action === undefined ? undefined : actions.indexOf(step.action)}
      failure={
        isFailure && index === playback.lastIndex
          ? result.status === "deadlock"
            ? "deadlock"
            : result.violation
          : undefined
      }
      isActive={index === playback.stepIndex}
      isDimmed={index > playback.stepIndex}
      onSelect={() => playback.select(index)}
    />
  );

  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-white/90 px-4 py-2 backdrop-blur">
        <p className={cn("mr-auto text-sm font-medium", isFailure && "text-red-600")}>
          {STATUS_LABELS[result.status]}
          {result.violation !== undefined && result.status !== "deadlock" && (
            <code className="ml-2 rounded-md border bg-white px-1 py-0.5 text-[13px] font-normal">
              {result.violation}
            </code>
          )}
          <span className="ml-2 font-normal whitespace-nowrap text-gray-1000 tabular-nums">
            {result.distinctStates.toLocaleString()} states in{" "}
            {Math.round(result.milliseconds).toLocaleString()} ms
          </span>
        </p>
        {trace.length > 1 && (
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
            <span className="ml-1 w-14 text-right text-sm text-gray-1000 tabular-nums">
              {playback.stepIndex + 1} / {trace.length}
            </span>
          </div>
        )}
      </div>
      {result.output.length > 0 && (
        <pre className="border-b px-4 py-3 font-mono text-[13px] whitespace-pre-wrap">
          {result.output.join("\n")}
        </pre>
      )}
      {trace.length > 0 && (
        <TraceDiagram.Root>
          {trace.slice(0, loopStart).map((step, index) => (
            <Fragment key={step.number}>
              {renderEdge(step)}
              {renderNode(step, index)}
            </Fragment>
          ))}
          {loopStart < trace.length && (
            <>
              {renderEdge(trace[loopStart])}
              <TraceDiagram.Loop
                label={
                  loopStart === playback.lastIndex
                    ? "stutters here forever"
                    : `repeats forever from ${String(loopStart + 1).padStart(2, "0")}`
                }
              >
                {trace.slice(loopStart).map((step, offset) => (
                  <Fragment key={step.number}>
                    {offset > 0 && renderEdge(step)}
                    {renderNode(step, loopStart + offset)}
                  </Fragment>
                ))}
              </TraceDiagram.Loop>
            </>
          )}
        </TraceDiagram.Root>
      )}
    </>
  );
};

export const ResultPane = () => {
  const playground = usePlayground();
  const check = playground.check;
  const response = check.response;
  return (
    <div
      data-result-pane
      className={cn(
        "relative min-h-0 flex-1 overflow-auto border-t",
        !playground.isResultShown && "hidden",
      )}
    >
      {check.isRunning && <CheckProgress />}
      {!check.isRunning && response === undefined && (
        <p className="p-4 text-sm text-pretty text-gray-1000">
          Press Check to explore every reachable state. If one breaks the spec, the steps that reach
          it are drawn here.
        </p>
      )}
      {response?.kind === "error" && (
        <div className="p-4">
          <p className="text-sm font-medium text-red-600">{response.name}</p>
          <pre className="mt-2 font-mono text-[13px] whitespace-pre-wrap text-gray-1100">
            {response.message}
          </pre>
        </div>
      )}
      {response?.kind === "result" && <TraceResult key={check.runCount} result={response} />}
    </div>
  );
};
