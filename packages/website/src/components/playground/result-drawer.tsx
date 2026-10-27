import { X } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import type { CheckSummary } from "../../check-worker";
import { usePlayback } from "../../hooks/use-playback";
import { TraceTable } from "../trace-table";
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

const CONTROL_CLASS_NAME =
  "flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-sm font-medium text-gray-1100 hover:bg-gray-300 hover:text-gray-1200";

const TraceResult = (props: TraceResultProps) => {
  const result = props.result;
  const trace = result.trace;
  const playback = usePlayback(trace.length);
  const isFailure = result.status !== "success";
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3">
        <Drawer.Title className={cn("mr-auto text-sm font-medium", isFailure && "text-red-600")}>
          {STATUS_LABELS[result.status]}
          {result.violation !== undefined && result.status !== "deadlock" && (
            <code className="ml-2 rounded-md border bg-white px-1 py-0.5 text-[13px] font-normal">
              {result.violation}
            </code>
          )}
          <span className="ml-2 font-normal whitespace-nowrap text-gray-1000 tabular-nums">
            {result.distinctStates.toLocaleString()} states, depth {result.depth},{" "}
            {Math.round(result.milliseconds).toLocaleString()} ms
          </span>
        </Drawer.Title>
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
        <pre className="border-t px-4 py-3 font-mono text-[13px] whitespace-pre-wrap select-text">
          {result.output.join("\n")}
        </pre>
      )}
      {trace.length > 0 && (
        <div data-drawer-scroll className="min-h-0 flex-1 overflow-auto border-t">
          <TraceTable
            trace={trace}
            loopStart={result.loopStart}
            failingIndex={isFailure ? playback.lastIndex : undefined}
            activeIndex={playback.stepIndex}
            onSelect={playback.select}
          />
          {result.loopStart !== undefined && (
            <p className="px-4 py-3 text-sm text-gray-1000">
              {result.loopStart === playback.lastIndex
                ? "The last state stutters forever."
                : `After the last state, the behavior loops back to state ${String(result.loopStart + 1).padStart(2, "0")} forever.`}
            </p>
          )}
        </div>
      )}
    </>
  );
};

// A drawer that slides up inside the playground, so the code stays in view above the results.
export const ResultDrawer = () => {
  const playground = usePlayground();
  const response = playground.check.response;
  return (
    <Drawer.Root
      open={playground.isDrawerOpen && response !== undefined}
      onOpenChange={playground.setIsDrawerOpen}
      container={playground.container}
      handleOnly
      noBodyStyles
    >
      <Drawer.Portal>
        <Drawer.Overlay className="absolute inset-0 z-10 bg-gray-1200/5" />
        <Drawer.Content
          aria-describedby={undefined}
          className="absolute inset-x-0 bottom-0 z-20 flex max-h-[75%] flex-col rounded-t-2xl bg-white shadow-[0_0_0_1px_#0000000f,0_-8px_24px_-12px_#00000029] outline-none"
        >
          <div className="flex items-center justify-between px-2 pt-2">
            <span className="size-7" />
            <Drawer.Handle className="w-10!" />
            <Drawer.Close
              aria-label="Close results"
              className="flex size-7 items-center justify-center rounded-full text-gray-1000 hover:bg-gray-300 hover:text-gray-1200"
            >
              <X className="size-4" />
            </Drawer.Close>
          </div>
          {response?.kind === "error" && (
            <div className="min-h-0 overflow-auto px-4 pb-4">
              <Drawer.Title className="text-sm font-medium text-red-600">
                {response.name}
              </Drawer.Title>
              <pre className="mt-2 font-mono text-[13px] whitespace-pre-wrap text-gray-1100 select-text">
                {response.message}
              </pre>
            </div>
          )}
          {response?.kind === "result" && (
            <TraceResult key={playground.check.runCount} result={response} />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
