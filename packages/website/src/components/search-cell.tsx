import { CaretRight, X } from "@phosphor-icons/react";
import { cn } from "cn";
import type { Search, SearchState } from "../search";

const STEP_DELAY_MS = 150;

interface SearchCellProps {
  search: Search;
  line: number;
  hoveredStateId: string | undefined;
  onHover: (stateId: string | undefined) => void;
}

const getPath = (search: Search, stateId: string | undefined): string[] => {
  const state = search.states.find((innerState) => innerState.id === stateId);
  return state ? [state.id, ...getPath(search, state.parentId)] : [];
};

const getBranch = (search: Search, state: SearchState, depth: number): SearchRow[] => [
  { state, depth },
  ...search.states
    .filter((child) => child.parentId === state.id)
    .flatMap((child) => getBranch(search, child, depth + 1)),
];

interface SearchRow {
  state: SearchState;
  depth: number;
}

export const SearchCell = (props: SearchCellProps) => {
  const rows = props.search.states
    .filter((state) => state.parentId === undefined)
    .flatMap((root) => getBranch(props.search, root, 0))
    .filter((row) => row.state.line !== undefined);
  const lastTrunkIndex = rows.findLastIndex((row) => row.depth === 1);
  const firstLine = Math.min(...rows.map((row) => row.state.line ?? Infinity));
  const lastLine = Math.max(...rows.map((row) => row.state.line ?? 0));
  if (props.line < firstLine || props.line > lastLine) return null;
  const lineRows = rows.filter((row) => row.state.line === props.line);
  const path = getPath(props.search, props.hoveredStateId);
  return (
    <span className="relative flex w-[45%] shrink-0 flex-col self-stretch text-xs max-sm:hidden">
      {lineRows.length === 0 && props.line < (rows.at(lastTrunkIndex)?.state.line ?? 0) && (
        <span className="absolute top-0 left-3 h-full w-px bg-input" />
      )}
      {lineRows.map((row) => (
        <span
          key={row.state.id}
          className={cn(
            "relative flex h-[22px] items-center transition-opacity duration-150 ease-out",
            path.length > 0 && !path.includes(row.state.id) && "opacity-40",
          )}
        >
          {row.depth > 0 && rows.indexOf(row) <= lastTrunkIndex && (
            <span
              className={cn(
                "absolute top-0 left-3 w-px bg-input",
                rows.indexOf(row) === lastTrunkIndex ? "h-1/2" : "h-full",
              )}
            />
          )}
          {row.depth > 0 && (
            <span
              style={{ marginLeft: `${row.depth * 20 - 8}px` }}
              className="flex shrink-0 items-center pr-1 text-input"
            >
              {row.depth > 1 && <span className="-mt-2.5 h-2.5 w-px bg-input" />}
              <span className="h-px w-4 bg-input" />
              <CaretRight weight="fill" className="-ml-1 size-2.5" />
            </span>
          )}
          <span
            title={row.state.text}
            onPointerEnter={() => props.onHover(row.state.id)}
            onPointerLeave={() => props.onHover(undefined)}
            style={{
              transitionDelay: `${props.search.states.indexOf(row.state) * STEP_DELAY_MS}ms`,
            }}
            className={cn(
              "flex h-5 min-w-0 items-center gap-1 rounded-sm px-1.5 transition-[opacity,scale] duration-200 ease-out starting:scale-95 starting:opacity-0",
              row.state.isFailing
                ? "bg-destructive/15 text-destructive"
                : "bg-background text-foreground ring-1 ring-border",
            )}
          >
            {row.state.isFailing && <X weight="bold" className="shrink-0" />}
            <span className="truncate">{row.state.text}</span>
          </span>
        </span>
      ))}
    </span>
  );
};
