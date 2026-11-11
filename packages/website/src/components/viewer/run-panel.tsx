import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useViewerStore } from "@/store/viewer";
import type { RunResult } from "../../run-worker";
import { TraceTable } from "../trace-table";
import { Chip } from "./chip";
import { useViewer } from "./context";

// TLC labels a step `Announce(1)`, and the action's region is named `Announce`.
const getActionName = (label: string) => label.split("(")[0];

const Stats = ({ result }: { result: RunResult }) =>
  result.stats && (
    <span className="hidden min-w-0 items-center gap-3 truncate tabular-nums sm:flex">
      <span>{result.stats.distinctStates.toLocaleString()} distinct states</span>
      <span>{result.stats.totalStates.toLocaleString()} total</span>
      <span>{Math.round(result.stats.elapsedMs).toLocaleString()} ms</span>
    </span>
  );

// A trace from the model checker. Selecting a step focuses the action that took it, in the
// TypeScript and the TLA+.
const Trace = ({ result }: { result: RunResult }) => {
  const { view } = useViewer();
  const select = useViewerStore((state) => state.select);
  const lastIndex = result.trace.length - 1;
  const [activeIndex, setActiveIndex] = useState(lastIndex);
  return (
    <div data-drawer-scroll className="min-h-0 flex-1 overflow-auto overscroll-contain">
      <TraceTable
        trace={result.trace}
        loopStart={result.loopStart}
        failingIndex={result.isPassed ? undefined : lastIndex}
        activeIndex={activeIndex}
        onSelect={(index) => {
          const action = result.trace[index]?.action;
          const nodeId = action === undefined ? undefined : `code:action:${getActionName(action)}`;
          setActiveIndex(index);
          select(view.nodes.some((node) => node.id === nodeId) ? (nodeId ?? null) : null);
        }}
      />
      {result.loopStart !== undefined && (
        <p className="px-4 py-3 text-muted-foreground">
          {result.loopStart === lastIndex
            ? "The last state stutters forever."
            : `After the last state, the behavior loops back to state ${result.loopStart + 1} forever.`}
        </p>
      )}
    </div>
  );
};

export const RunPanel = () => {
  const { runner, isResultOpen, setResultOpen, view } = useViewer();
  const result = runner.result;
  if (result === undefined || !isResultOpen) return null;
  const checkId = `code:predicate:${result.name}`;
  return (
    <section aria-label="Check result" className="flex max-h-[45%] min-h-0 flex-col border-t">
      <header className="flex h-9 shrink-0 items-center gap-3 pr-1.5 pl-3 whitespace-nowrap text-muted-foreground">
        {result.isPassed ? (
          <CircleCheck className="size-3.5 shrink-0 text-[rgb(115,192,88)]" />
        ) : (
          <CircleAlert className="size-3.5 shrink-0 text-destructive" />
        )}
        <span
          className={cn("font-medium", result.isPassed ? "text-foreground" : "text-destructive")}
        >
          {result.title}
        </span>
        {result.name !== undefined && (
          <Chip
            nodeIds={view.nodes.some((node) => node.id === checkId) ? [checkId] : []}
            canDim={false}
          >
            {result.name}
          </Chip>
        )}
        <Stats result={result} />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close result"
          className="ml-auto"
          onClick={() => setResultOpen(false)}
        >
          <X />
        </Button>
      </header>
      {result.trace.length > 0 ? (
        <Trace key={runner.runCount} result={result} />
      ) : (
        result.rows.length > 0 && (
          <pre className="min-h-0 overflow-auto border-t px-3 py-2 font-mono whitespace-pre-wrap text-destructive">
            {result.rows.map((row) => row.title).join("\n")}
          </pre>
        )
      )}
    </section>
  );
};
