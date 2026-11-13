import { CaretRight, X } from "@phosphor-icons/react";
import { Fragment, useState } from "react";
import { cn } from "cn";
import { getPath, type Search, type SearchState } from "../search";

const STEP_DELAY_MS = 80;
const SHOWN_ROWS = 3;
const DEEPEST_INDENT = 2;
const VALUES = /"[^"]*"|\b(?:TRUE|FALSE)\b|-?\b\d+\b|[^"\d\-TF]+|./g;

interface SearchCellProps {
  search: Search;
  line: number;
  path: SearchState[];
  onHover: (stateId: string | undefined) => void;
  className?: string;
}

export const useSearchPath = (search: Search | undefined) => {
  const [hoveredStateId, setHoveredStateId] = useState<string>();
  return { states: search ? getPath(search, hoveredStateId) : [], hover: setHoveredStateId };
};

interface SearchRow {
  state: SearchState;
  indent: number;
  isBranch: boolean;
}

// Nests a state under its parent only when both sit on the same line, so a connector never
// points at a state in another line's cell.
const getBranch = (search: Search, state: SearchState, parent?: SearchRow): SearchRow[] => {
  const row = {
    state,
    indent: parent && parent.state.line === state.line ? parent.indent + 1 : 0,
    isBranch: parent !== undefined,
  };
  return [
    row,
    ...search.states
      .filter((child) => child.parentId === state.id)
      .flatMap((child) => getBranch(search, child, row)),
  ];
};

interface SearchMoreProps {
  count: number;
}

const SearchMore = (props: SearchMoreProps) => (
  <span className="flex h-[22px] items-center pl-8 text-faint">+{props.count} more</span>
);

export const SearchCell = (props: SearchCellProps) => {
  const rows = props.search.states
    .filter((state) => state.parentId === undefined)
    .flatMap((root) => getBranch(props.search, root))
    .filter((row) => row.state.line !== undefined);
  const lines = rows.map((row) => row.state.line ?? 0);
  const firstLine = Math.min(...lines);
  if (props.line < firstLine || props.line > Math.max(...lines)) return null;
  const allLineRows = rows.filter((row) => row.state.line === props.line);
  const lineRows = allLineRows.filter((row, index) => index < SHOWN_ROWS || row.state.isFailing);
  const hiddenCount = allLineRows.length - lineRows.length;
  const isTrunkRow = (row: SearchRow) => row.isBranch && row.indent === 0;
  const lastTrunkLine = Math.max(...rows.filter(isTrunkRow).map((row) => row.state.line ?? 0));
  const lastTrunkIndex = lineRows.findLastIndex(isTrunkRow);
  const isBelowRoot = props.line > firstLine;
  return (
    <span
      className={cn(
        "relative flex w-1/2 shrink-0 flex-col self-stretch text-xs max-sm:w-full",
        lineRows.length === 0 && "pointer-events-none -ml-[calc(50%+1rem)] max-sm:hidden",
        props.className,
      )}
    >
      {isBelowRoot && props.line < lastTrunkLine && (
        <span className="absolute top-0 left-3 h-full w-px bg-input max-sm:hidden" />
      )}
      {lineRows.map((row, index) => (
        <Fragment key={row.state.id}>
          {hiddenCount > 0 && index === SHOWN_ROWS && <SearchMore count={hiddenCount} />}
          <span
            className={cn(
              "relative flex min-h-[22px] items-center py-px transition-opacity duration-150 ease",
              props.path.length > 0 && !props.path.includes(row.state) && "opacity-40",
            )}
          >
            {isBelowRoot && props.line === lastTrunkLine && index <= lastTrunkIndex && (
              <span
                className={cn(
                  "absolute top-0 left-3 w-px bg-input max-sm:hidden",
                  index === lastTrunkIndex ? "h-1/2" : "h-full",
                )}
              />
            )}
            {row.isBranch && (
              <span
                style={{ marginLeft: `${Math.min(row.indent, DEEPEST_INDENT) * 20 + 12}px` }}
                className="flex shrink-0 items-center pr-1 text-input"
              >
                {row.indent > 0 && <span className="-mt-2.5 h-2.5 w-px bg-input" />}
                <span className="h-px w-4 bg-input" />
                <CaretRight weight="fill" className="-ml-1 size-2.5" />
              </span>
            )}
            <span
              title={row.state.text}
              data-state={row.state.isFailing ? "failing" : "reached"}
              onPointerEnter={(event) =>
                props.onHover(
                  event.pointerType === "touch" && props.path.at(0) === row.state
                    ? undefined
                    : row.state.id,
                )
              }
              onPointerLeave={(event) => event.pointerType !== "touch" && props.onHover(undefined)}
              style={{
                transitionDelay: `${props.search.states.indexOf(row.state) * STEP_DELAY_MS}ms`,
              }}
              className={cn(
                "flex min-h-5 min-w-0 items-center gap-1 rounded-sm px-1.5 leading-4 transition-[opacity,scale] duration-200 ease-out starting:scale-95 starting:opacity-0",
                row.state.isFailing
                  ? "bg-destructive/15 text-destructive"
                  : "bg-background text-foreground ring-1 ring-border",
              )}
            >
              {row.state.isFailing && <X weight="bold" className="shrink-0" />}
              <span className="min-w-0 wrap-anywhere">
                {row.state.isFailing
                  ? row.state.change
                  : (row.state.change.match(VALUES) ?? []).map((value, index) => (
                      <span
                        key={index}
                        className={cn(
                          value.startsWith('"') && "text-success",
                          /^-?\d/.test(value) && "text-syntax-number",
                          /^(TRUE|FALSE)$/.test(value) && "text-syntax-keyword",
                        )}
                      >
                        {value}
                      </span>
                    ))}
              </span>
            </span>
          </span>
        </Fragment>
      ))}
      {hiddenCount > 0 && lineRows.length <= SHOWN_ROWS && <SearchMore count={hiddenCount} />}
    </span>
  );
};
