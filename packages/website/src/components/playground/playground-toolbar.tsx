import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EXAMPLES } from "../../examples";
import { usePlayground } from "./playground-context";

interface ToolbarProps {
  children: ReactNode;
}

const SPINNER = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
const SPINNER_INTERVAL_MS = 80;

export const Toolbar = (props: ToolbarProps) => (
  <header className="flex items-center gap-2 p-3">{props.children}</header>
);

export const SpecSelect = () => {
  const playground = usePlayground();
  return (
    <Select.Root
      items={EXAMPLES.map((example, index) => ({ value: index, label: example.name }))}
      value={playground.exampleIndex}
      onValueChange={(index) => {
        if (index !== null) playground.selectExample(index);
      }}
    >
      <Select.Trigger className="flex h-8 min-w-0 items-center gap-1.5 rounded-full bg-gray-300 pr-2.5 pl-3.5 text-sm font-medium text-gray-1200 outline-none select-none hover:bg-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/40 data-popup-open:bg-gray-400">
        <Select.Value className="truncate" />
        <Select.Icon>
          <ChevronDown className="size-4 text-gray-1100" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          align="start"
          sideOffset={6}
          alignItemWithTrigger={false}
          className="z-50 outline-none"
        >
          <Select.Popup className="min-w-(--anchor-width) origin-(--transform-origin) rounded-xl bg-white p-1 shadow-custom transition-[transform,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Select.List>
              {EXAMPLES.map((example, index) => (
                <Select.Item
                  key={example.name}
                  value={index}
                  className="grid cursor-default grid-cols-[1rem_1fr] gap-x-2 rounded-lg py-1.5 pr-3 pl-2 outline-none select-none data-highlighted:bg-gray-200"
                >
                  <Select.ItemIndicator className="row-span-2 pt-0.5">
                    <Check className="size-4 text-gray-1200" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="col-start-2 text-sm font-medium text-gray-1200">
                    {example.name}
                  </Select.ItemText>
                  <span className="col-start-2 text-xs text-gray-1000">{example.description}</span>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};

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
    <span className="text-sm text-gray-1000 tabular-nums">
      {SPINNER[Math.floor(elapsedMs / SPINNER_INTERVAL_MS) % SPINNER.length]}{" "}
      {(elapsedMs / 1000).toFixed(1)} s
    </span>
  );
};

// Shows the last verdict, and reopens the results drawer after it's dismissed.
export const Status = () => {
  const playground = usePlayground();
  const response = playground.check.response;
  if (playground.check.isRunning) return <CheckProgress />;
  if (response === undefined) return null;
  const isPassing = response.kind === "result" && response.status === "success";
  return (
    <button
      type="button"
      onClick={() => playground.setIsDrawerOpen(true)}
      className={cn(
        "flex h-8 min-w-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium",
        isPassing
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : "bg-red-50 text-red-600 hover:bg-red-100",
      )}
    >
      <span aria-hidden>{isPassing ? "✓" : "✕"}</span>
      <span className="truncate">
        {response.kind === "error"
          ? response.name
          : isPassing
            ? "No error"
            : response.status === "deadlock"
              ? "Deadlock"
              : response.violation}
      </span>
    </button>
  );
};

export const CheckButton = () => {
  const playground = usePlayground();
  return (
    <button
      type="button"
      onClick={playground.check.isRunning ? playground.check.stop : playground.runCheck}
      className="h-8 shrink-0 rounded-full bg-gray-1200 px-3.5 text-sm font-medium text-white select-none hover:bg-black active:scale-[0.97]"
    >
      {playground.check.isRunning ? "Stop" : "Check"}
    </button>
  );
};
