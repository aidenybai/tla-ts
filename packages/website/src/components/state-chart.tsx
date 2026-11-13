import { mount, register } from "pele/core";
import state from "pele/diagrams/state";
import { useEffect, useRef } from "react";
import { getPath, type Search } from "../search";

register(state);

interface StateChartProps {
  search: Search;
}

const getName = (stateId: string | undefined) =>
  stateId ? `s${stateId.replace("-", "n")}` : "[*]";

// Draws each state under the step that first reached it. Steps back to a state already reached
// are left out, because they bury the chart.
export const StateChart = (props: StateChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const states = props.search.chartStates;
  useEffect(() => {
    const element = chartRef.current;
    if (!element) return;
    const failingPath = getPath(states, states.find((innerState) => innerState.isFailing)?.id);
    const mounted = mount(
      element,
      [
        "stateDiagram-v2",
        ...states.map((innerState) => `${getName(innerState.id)}: ${innerState.text}`),
        ...states.map(
          (innerState) =>
            `${getName(innerState.parentId)} --> ${getName(innerState.id)}${innerState.call ? `: ${innerState.call.replace(/\(.*$/, "")}` : ""}`,
        ),
        ...failingPath.map((innerState) => `class ${getName(innerState.id)} failing`),
      ].join("\n"),
      {
        zoom: false,
        responsive: false,
        fontSize: 12,
        onRender: () => {
          // Pele numbers its arrows in source order, which is the only handle on a single arrow.
          states.forEach((innerState, index) => {
            if (!failingPath.includes(innerState)) return;
            for (const arrow of element.querySelectorAll(`[data-id="edge${index}"]`))
              arrow.classList.add("failing");
          });
          element
            .querySelector(".pele-state-start")
            ?.scrollIntoView({ block: "nearest", inline: "center" });
        },
      },
    );
    return () => mounted.destroy();
  }, [states]);
  const hiddenCount = props.search.stateCount - states.length;
  return (
    <div className="flex w-max min-w-full flex-col items-center gap-4 px-4 pt-14 pb-4 font-mono text-xs">
      <div
        ref={chartRef}
        className="[--pele-bg:var(--background)] [--pele-border:var(--input)] [--pele-fg:var(--foreground)] [--pele-font:var(--font-mono)] [--pele-line:var(--faint)] [--pele-muted:var(--faint)] [--pele-surface:var(--muted)] [&_.pele-edge-label.failing]:fill-destructive [&_.pele-edge.failing]:stroke-destructive [&_.pele-edge.failing]:[--_l:var(--destructive)] [&_.pele-node.failing_rect]:fill-destructive/10 [&_.pele-node.failing_rect]:stroke-destructive [&_.pele-node.failing_text]:fill-destructive"
      />
      {hiddenCount > 0 && (
        <span className="text-center text-faint">
          Showing {states.length} of {props.search.stateCount} states
        </span>
      )}
    </div>
  );
};
