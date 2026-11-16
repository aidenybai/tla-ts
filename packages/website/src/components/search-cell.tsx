import { X } from "@phosphor-icons/react";
import { memo, useState } from "react";
import { cn } from "cn";
import { getPath, type Search, type SearchState } from "../search";

const STEP_DELAY_MS = 80;
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
  return {
    states: search ? getPath(search.listedStates, hoveredStateId) : [],
    hover: setHoveredStateId,
  };
};

interface ValueTextProps {
  text: string;
}

export const ValueText = memo((props: ValueTextProps) =>
  (props.text.match(VALUES) ?? []).map((value, index) => (
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
  )),
);

// States sit at the end of the line that produced them, at their own width, so the code keeps
// the rest of the line.
export const SearchCell = (props: SearchCellProps) => {
  const states = props.search.states.filter((state) => state.line === props.line);
  return (
    states.length > 0 && (
      <span
        className={cn(
          "flex max-w-1/2 shrink-0 flex-wrap justify-end gap-1 self-start py-px text-xs max-sm:w-full max-sm:max-w-none max-sm:justify-start",
          props.className,
        )}
      >
        {states.map((state) => (
          <span
            key={state.id}
            data-state={state.isFailing ? "failing" : "reached"}
            onPointerEnter={(event) =>
              props.onHover(
                event.pointerType === "touch" && props.path.at(0) === state ? undefined : state.id,
              )
            }
            onPointerLeave={(event) => event.pointerType !== "touch" && props.onHover(undefined)}
            style={{ animationDelay: `${props.search.states.indexOf(state) * STEP_DELAY_MS}ms` }}
            className={cn(
              "flex h-5 max-w-full min-w-0 items-center gap-1.5 rounded-sm px-1.5 leading-4 animate-chip-in motion-reduce:animate-none",
              state.isFailing
                ? "bg-destructive/15 text-destructive"
                : "bg-foreground/8 text-foreground",
              props.path.length > 0 && !props.path.includes(state) && "opacity-50",
            )}
          >
            {state.isFailing && <X weight="bold" className="shrink-0" />}
            <span className="truncate">
              {state.isFailing ? state.change : <ValueText text={state.change} />}
            </span>
          </span>
        ))}
      </span>
    )
  );
};
