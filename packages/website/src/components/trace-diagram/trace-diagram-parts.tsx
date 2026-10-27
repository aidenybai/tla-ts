import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ActionGlyph } from "./action-glyph";

interface RootProps {
  children: ReactNode;
}

interface EdgeProps {
  action: string;
  glyphIndex: number;
  isDimmed: boolean;
}

interface NodeProps {
  number: number;
  variables: [string, string][];
  previousVariables: [string, string][] | undefined;
  glyphIndex: number | undefined;
  failure: string | undefined;
  isActive: boolean;
  isDimmed: boolean;
  onSelect: () => void;
}

interface LoopProps {
  label: string;
  children: ReactNode;
}

export const Root = (props: RootProps) => (
  <ol className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8 font-mono text-[13px]/5">
    {props.children}
  </ol>
);

// An arrow from one state to the next, labeled with the action that takes it.
export const Edge = (props: EdgeProps) => (
  <li
    className={cn(
      "relative flex h-16 w-full items-center justify-center transition-opacity duration-300",
      props.isDimmed && "opacity-20",
    )}
  >
    <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-gray-900" />
    <svg
      aria-hidden
      viewBox="0 0 8 6"
      className="absolute bottom-0 left-1/2 w-2 -translate-x-1/2 fill-gray-900"
    >
      <path d="M0 0H8L4 6Z" />
    </svg>
    <span className="relative flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-0.5 text-xs text-gray-1100 shadow-custom">
      <ActionGlyph index={props.glyphIndex} />
      {props.action}
    </span>
  </li>
);

// A state drawn as a block with a hatched side, so the trace reads as a system diagram.
export const Node = (props: NodeProps) => {
  const previous = new Map(props.previousVariables);
  const isFailing = props.failure !== undefined && props.isActive;
  return (
    <li
      className={cn(
        "relative w-full transition-opacity duration-300",
        props.isDimmed && "opacity-20",
        isFailing && "motion-safe:animate-shake",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 translate-x-1.5 translate-y-1.5 border bg-[repeating-linear-gradient(135deg,currentColor_0_1px,transparent_1px_5px)] transition-colors",
          props.previousVariables === undefined ? "rounded-[18px]" : "rounded-lg",
          isFailing
            ? "border-red-500 text-red-300"
            : props.isActive
              ? "border-gray-1200 text-gray-900"
              : "text-gray-600",
        )}
      />
      <button
        type="button"
        onClick={props.onSelect}
        ref={(element) => {
          // Scrolls the result pane, not the page, so playback never moves the reader.
          const pane = element?.closest("[data-result-pane]");
          if (!props.isActive || element === null || !(pane instanceof HTMLElement)) return;
          const top = element.getBoundingClientRect().top - pane.getBoundingClientRect().top;
          const isVisible = top >= 0 && top + element.offsetHeight <= pane.clientHeight;
          if (!isVisible) pane.scrollBy({ top: top - pane.clientHeight / 3, behavior: "smooth" });
        }}
        className={cn(
          "relative block w-full border bg-white px-3.5 py-3 text-left transition-colors",
          props.previousVariables === undefined ? "rounded-[18px]" : "rounded-lg",
          isFailing
            ? "border-red-500 bg-red-50"
            : props.isActive
              ? "border-gray-1200"
              : "border-gray-700 hover:border-gray-900",
        )}
      >
        <span className="mb-1.5 flex items-center gap-2 font-sans text-xs text-gray-1000">
          <span className="font-mono tabular-nums">{String(props.number).padStart(2, "0")}</span>
          {props.glyphIndex !== undefined && <ActionGlyph index={props.glyphIndex} />}
          {props.previousVariables === undefined && (
            <span className="font-medium text-gray-1200">Init</span>
          )}
          {isFailing && <span className="ml-auto font-medium text-red-600">✕ {props.failure}</span>}
        </span>
        {props.variables.map(([name, value]) => (
          <span
            key={name}
            className={cn(
              "block break-words",
              props.previousVariables !== undefined && previous.get(name) !== value
                ? "text-gray-1200"
                : "text-gray-1000",
            )}
          >
            {name} = {value}
          </span>
        ))}
      </button>
    </li>
  );
};

// Groups the states a lasso-shaped trace repeats forever, like a subgraph in a flowchart.
export const Loop = (props: LoopProps) => (
  <li className="relative w-full rounded-2xl border border-dashed border-gray-800 px-4 pt-6 pb-5">
    <span className="absolute -top-3 left-4 flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-0.5 font-sans text-xs font-medium text-gray-1100">
      ↺ {props.label}
    </span>
    <ol className="flex flex-col items-center">{props.children}</ol>
  </li>
);
