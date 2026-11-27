import { Check, X } from "@phosphor-icons/react";
import { useMemo } from "react";
import { cn } from "cn";
import type { Search, SearchState } from "@/lib/search";

const STATE_DELAY_MS = 90;
const TEST_DELAY_MS = 160;

interface Step {
  depth: number;
  states: { state: SearchState; order: number }[];
}

// The states in the order the search reached them, grouped by how many calls each is from the
// start.
const getSteps = (states: SearchState[]) => {
  const depths = new Map<string, number>();
  const steps: Step[] = [];
  states.forEach((state, order) => {
    const depth = state.parentId === undefined ? 0 : (depths.get(state.parentId) ?? -1) + 1;
    depths.set(state.id, depth);
    const step = steps.find((found) => found.depth === depth);
    if (step) step.states.push({ state, order });
    else steps.push({ depth, states: [{ state, order }] });
  });
  return steps.toSorted((first, second) => first.depth - second.depth);
};

interface StateClonesProps {
  search: Search;
  path: SearchState[];
  onHover: (stateId: string | undefined) => void;
}

export const StateClones = (props: StateClonesProps) => {
  const steps = useMemo(() => getSteps(props.search.checkedStates), [props.search]);
  const pathIds = new Set(props.path.map((state) => state.id));
  return (
    <ol onPointerLeave={() => props.onHover(undefined)} className="flex flex-col gap-3">
      {steps.map((step) => (
        <li key={step.depth} className="flex flex-col gap-1.5">
          <span
            style={{ animationDelay: `${step.states[0].order * STATE_DELAY_MS}ms` }}
            className="text-xs text-faint motion-safe:animate-chip-in"
          >
            {step.depth === 0
              ? "Start"
              : `After ${step.depth} ${step.depth === 1 ? "call" : "calls"}`}
          </span>
          <ul className="flex flex-wrap gap-1.5">
            {step.states.map((item) => (
              <li
                key={item.state.id}
                style={{ animationDelay: `${item.order * STATE_DELAY_MS + TEST_DELAY_MS}ms` }}
                className={cn("max-w-full", item.state.isFailing && "motion-safe:animate-shake")}
              >
                <span
                  title={[item.state.call, item.state.text]
                    .filter((part) => part !== undefined)
                    .join(": ")}
                  onPointerEnter={() => props.onHover(item.state.id)}
                  style={{ animationDelay: `${item.order * STATE_DELAY_MS}ms` }}
                  className={cn(
                    "flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-xs transition-opacity duration-150 ease-out motion-safe:animate-chip-in",
                    item.state.isFailing
                      ? "border-transparent bg-destructive/15 text-destructive"
                      : "bg-card text-foreground",
                    pathIds.size > 0 && !pathIds.has(item.state.id) && "opacity-50",
                  )}
                >
                  <span className="truncate">{item.state.change}</span>
                  <span
                    style={{
                      animationDelay: `${item.order * STATE_DELAY_MS + TEST_DELAY_MS}ms`,
                    }}
                    className="flex shrink-0 motion-safe:animate-chip-in"
                  >
                    {item.state.isFailing ? (
                      <X weight="bold" className="size-3" />
                    ) : (
                      <Check weight="bold" className="size-3 text-success" />
                    )}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
};
