import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn, createPartsContext } from "@/lib/utils";
import type { RunResult } from "../run-worker";
import { usePlayback } from "../use-playback";
import { useCode } from "./code";
import { TraceTable } from "./trace-table";

const DRAWER_EASING = "duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";
const CONTROL_CLASS_NAME =
  "flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-sm text-gray-1100 hover:bg-gray-300 hover:text-gray-1200";

interface DrawerState {
  result: RunResult;
  stepCount: number;
  playback: ReturnType<typeof usePlayback>;
  close: () => void;
}

const drawerContext = createPartsContext<DrawerState>("RunDrawer.Root");

interface DrawerProps {
  result: RunResult;
  children: ReactNode;
}

const Drawer = (props: DrawerProps) => {
  const code = useCode();
  const stepCount = Math.max(props.result.trace.length, props.result.rows.length);
  const playback = usePlayback(stepCount);
  const isOpen = code.isDrawerOpen && !code.runner.isRunning;
  const close = () => code.setIsDrawerOpen(false);
  return (
    <drawerContext.PartsContext value={{ result: props.result, stepCount, playback, close }}>
      <div
        aria-hidden
        onClick={close}
        className={cn(
          "absolute inset-0 z-10 bg-overlay transition-opacity starting:opacity-0",
          DRAWER_EASING,
          !isOpen && "pointer-events-none opacity-0",
        )}
      />
      <section
        inert={!isOpen}
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 flex max-h-full flex-col rounded-t-xl bg-surface shadow-drawer transition-transform starting:translate-y-full",
          DRAWER_EASING,
          !isOpen && "translate-y-full",
        )}
      >
        {props.children}
      </section>
    </drawerContext.PartsContext>
  );
};

interface RootProps {
  children: ReactNode;
}

export const RunDrawerRoot = (props: RootProps) => {
  const code = useCode();
  const result = code.runner.result;
  if (result === undefined) return null;
  return (
    <Drawer key={code.runner.runCount} result={result}>
      {props.children}
    </Drawer>
  );
};

interface HeaderProps {
  children: ReactNode;
}

export const RunDrawerHeader = (props: HeaderProps) => (
  <header className="flex items-start gap-3 py-2 pr-2 pl-4">{props.children}</header>
);

export const RunDrawerTitle = () => {
  const result = drawerContext.useParts().result;
  return (
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
  );
};

export const RunDrawerControls = () => {
  const drawer = drawerContext.useParts();
  const playback = drawer.playback;
  if (drawer.stepCount <= 1) return null;
  return (
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
        {playback.stepIndex + 1} / {drawer.stepCount}
      </span>
    </div>
  );
};

export const RunDrawerClose = () => {
  const drawer = drawerContext.useParts();
  return (
    <button
      type="button"
      aria-label="Close results"
      onClick={drawer.close}
      className="flex size-7 shrink-0 items-center justify-center rounded-full text-gray-1000 hover:bg-gray-300 hover:text-gray-1200 active:scale-[0.94]"
    >
      <X className="size-4" />
    </button>
  );
};

export const RunDrawerTrace = () => {
  const drawer = drawerContext.useParts();
  const result = drawer.result;
  if (result.trace.length === 0) return null;
  return (
    <div data-drawer-scroll className="min-h-0 flex-1 overflow-auto overscroll-contain border-t">
      <TraceTable
        trace={result.trace}
        loopStart={result.loopStart}
        failingIndex={result.isPassed ? undefined : drawer.playback.lastIndex}
        activeIndex={drawer.playback.stepIndex}
        onSelect={drawer.playback.select}
      />
      {result.loopStart !== undefined && (
        <p className="px-4 py-3 text-sm text-gray-1000">
          {result.loopStart === result.trace.length - 1
            ? "The last state stutters forever."
            : `After the last state, the behavior loops back to state ${String(result.loopStart + 1).padStart(2, "0")} forever.`}
        </p>
      )}
    </div>
  );
};

export const RunDrawerRows = () => {
  const drawer = drawerContext.useParts();
  const playback = drawer.playback;
  if (drawer.result.trace.length > 0) return null;
  return (
    <ol className="min-h-0 overflow-auto border-t font-mono text-sm">
      {drawer.result.rows.map((row, index) => (
        <li
          key={row.id}
          className={cn(
            "flex gap-4 border-b border-gray-300 px-4 py-1.5 transition-[opacity,background-color] duration-200",
            index > playback.stepIndex && "opacity-30",
            index === playback.stepIndex && (row.isFailed ? "bg-danger-soft" : "bg-gray-200"),
          )}
        >
          <span
            className={cn("tabular-nums", row.isFailed ? "text-danger-muted" : "text-gray-900")}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => playback.select(index)}
            className="min-w-0 text-left whitespace-pre-wrap"
          >
            <span className={row.isFailed ? "text-danger" : "text-gray-1200"}>{row.title}</span>
            {index === playback.stepIndex && row.detail && (
              <span className="mt-1 block text-gray-1000">{row.detail}</span>
            )}
          </button>
        </li>
      ))}
    </ol>
  );
};
