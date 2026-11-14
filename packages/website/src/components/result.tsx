import { X } from "@phosphor-icons/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Fragment, useRef, type ReactNode } from "react";
import { cn } from "cn";
import type { SearchState } from "../search";
import { ValueText } from "./search-cell";
import { Button } from "./ui/button";

const ROW_HEIGHT_PX = 52;

interface ResultRootProps {
  isOpen: boolean;
  children: ReactNode;
}

export const ResultRoot = (props: ResultRootProps) => (
  <aside
    aria-label="Result"
    inert={!props.isOpen}
    className={cn(
      "absolute inset-y-0 right-0 z-20 flex w-88 max-w-full flex-col border-l bg-background text-sm transition-[translate,visibility] duration-200 ease-out motion-reduce:transition-none max-sm:w-full max-sm:border-l-0",
      !props.isOpen && "invisible translate-x-full",
    )}
  >
    {props.children}
  </aside>
);

interface ResultHeaderProps {
  onClose: () => void;
}

export const ResultHeader = (props: ResultHeaderProps) => (
  <header className="flex h-11 shrink-0 items-center justify-between border-b pr-1.5 pl-4">
    <h2 className="font-medium text-foreground">Result</h2>
    <Button
      size="icon"
      aria-label="Hide result"
      onClick={props.onClose}
      className="border-transparent"
    >
      <X />
    </Button>
  </header>
);

interface ResultBodyProps {
  children: ReactNode;
}

export const ResultBody = (props: ResultBodyProps) => (
  <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-6 p-4">
    {props.children}
  </div>
);

interface ResultSectionProps {
  title: string;
  count?: number;
  className?: string;
  children: ReactNode;
}

export const ResultSection = (props: ResultSectionProps) => (
  <section className={cn("grid shrink-0 gap-2", props.className)}>
    <header className="flex items-center gap-3">
      <h3 className="font-medium text-foreground">{props.title}</h3>
      <span className="h-px flex-1 bg-border" />
      {props.count !== undefined && (
        <span className="text-muted-foreground tabular-nums">{props.count.toLocaleString()}</span>
      )}
    </header>
    {props.children}
  </section>
);

interface ResultStatesProps {
  states: SearchState[];
  hoveredState: SearchState | undefined;
  onHover: (stateId: string | undefined) => void;
  onSelect: (state: SearchState) => void;
}

export const ResultStates = (props: ResultStatesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: props.states.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    getItemKey: (index) => props.states[index].id,
    overscan: 8,
  });
  return (
    <div ref={scrollRef} className="-mx-2 overflow-auto overscroll-none">
      <ol style={{ height: virtualizer.getTotalSize() }} className="relative">
        {virtualizer
          .getVirtualItems()
          .map((item) => ({ item, state: props.states[item.index] }))
          .map((row) => (
            <li
              key={row.item.key}
              ref={virtualizer.measureElement}
              data-index={row.item.index}
              onPointerEnter={() => props.onHover(row.state.id)}
              onPointerLeave={() => props.onHover(undefined)}
              style={{ translate: `0 ${row.item.start}px` }}
              className="absolute inset-x-0 top-0"
            >
              <button
                type="button"
                onClick={() => props.onSelect(row.state)}
                onFocus={() => props.onHover(row.state.id)}
                onBlur={() => props.onHover(undefined)}
                className={cn(
                  "grid w-full cursor-pointer gap-1 rounded-md px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:bg-foreground/12",
                  props.hoveredState === row.state && "bg-foreground/8",
                )}
              >
                <span
                  className={cn(
                    "flex items-center gap-1",
                    row.state.isFailing ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {row.state.isFailing && <X weight="bold" />}
                  {row.state.call ?? "Start"}
                </span>
                <span className="grid grid-cols-[fit-content(45%)_minmax(0,1fr)] gap-x-3 font-mono">
                  {row.state.variables.map((variable) => (
                    <Fragment key={variable.name}>
                      <span className="truncate text-faint">{variable.name}</span>
                      <span
                        className={cn(
                          "wrap-anywhere text-foreground",
                          !variable.isChanged && "opacity-60",
                        )}
                      >
                        <ValueText text={variable.value} />
                      </span>
                    </Fragment>
                  ))}
                </span>
              </button>
            </li>
          ))}
      </ol>
    </div>
  );
};
