import { cn } from "@/lib/utils";
import type { TraceStepSummary } from "../check-worker";

interface TraceTableProps {
  trace: TraceStepSummary[];
  loopStart: number | undefined;
  failingIndex: number | undefined;
  activeIndex: number;
  onSelect: (index: number) => void;
}

const CELL_CLASS_NAME = "border-b border-gray-300 px-3 py-1.5 align-top";
const HEADER_CLASS_NAME =
  "sticky top-0 z-10 border-b bg-white px-3 py-2 text-left font-sans text-xs font-medium text-gray-1000";

// Lists a trace as TLC's Toolbox does: one row per state, one column per variable, with each
// value that changed from the row above marked.
export const TraceTable = (props: TraceTableProps) => {
  const loopStart = props.loopStart ?? props.trace.length;
  const lastIndex = props.trace.length - 1;
  return (
    <table className="w-full border-separate border-spacing-0 font-mono text-[13px]/5 select-text">
      <thead>
        <tr>
          <th aria-label="Loop" className={cn(HEADER_CLASS_NAME, "w-4 px-0")} />
          <th className={cn(HEADER_CLASS_NAME, "w-0 pl-1")}>#</th>
          <th className={cn(HEADER_CLASS_NAME, "w-0")}>Action</th>
          {props.trace[0].variables.map(([name]) => (
            <th key={name} className={HEADER_CLASS_NAME}>
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.trace.map((step, index) => {
          const previous = new Map(index === 0 ? [] : props.trace[index - 1].variables);
          const isActive = index === props.activeIndex;
          const isFailing = index === props.failingIndex && isActive;
          return (
            <tr
              key={step.number}
              className={cn(
                "transition-[opacity,background-color] duration-200",
                index > props.activeIndex && "opacity-30",
                isFailing ? "bg-red-50 motion-safe:animate-shake" : isActive && "bg-gray-200",
              )}
            >
              <td className="relative w-4 p-0">
                {index >= loopStart && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-2 w-1.5 border-l border-gray-1000",
                      index === loopStart ? "top-1/2 border-t" : "top-0",
                      index === lastIndex ? "bottom-1/2 border-b" : "bottom-0",
                    )}
                  />
                )}
              </td>
              <td
                className={cn(
                  CELL_CLASS_NAME,
                  "pl-1 tabular-nums",
                  isFailing ? "text-red-500" : "text-gray-900",
                )}
              >
                {String(step.number).padStart(2, "0")}
              </td>
              <td className={cn(CELL_CLASS_NAME, "font-sans text-sm whitespace-nowrap")}>
                <button
                  type="button"
                  onClick={() => props.onSelect(index)}
                  ref={(element) => {
                    // Scrolls the drawer, not the page, so playback never moves the reader.
                    const pane = element?.closest("[data-drawer-scroll]");
                    if (!isActive || element === null || !(pane instanceof HTMLElement)) return;
                    const top =
                      element.getBoundingClientRect().top - pane.getBoundingClientRect().top;
                    const isVisible = top >= 40 && top + 40 <= pane.clientHeight;
                    if (!isVisible)
                      pane.scrollBy({ top: top - pane.clientHeight / 3, behavior: "smooth" });
                  }}
                  className={cn(
                    "text-left font-medium hover:underline",
                    isFailing ? "text-red-600" : "text-gray-1200",
                  )}
                >
                  {step.action ?? "Init"}
                </button>
              </td>
              {step.variables.map(([name, value]) => (
                <td key={name} className={CELL_CLASS_NAME}>
                  <div
                    className={cn(
                      "max-w-[48ch]",
                      isActive ? "break-words" : "truncate",
                      index > 0 && previous.get(name) !== value
                        ? isFailing
                          ? "text-red-700"
                          : "text-gray-1200"
                        : "text-gray-1000",
                    )}
                  >
                    <span
                      className={cn(
                        index > 0 &&
                          previous.get(name) !== value &&
                          (isFailing ? "bg-red-100" : "bg-amber-100"),
                        "rounded-sm box-decoration-clone px-0.5",
                      )}
                    >
                      {value}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
