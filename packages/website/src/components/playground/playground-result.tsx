import { usePlaygroundView } from "@/lib/playground-view";
import { getStateNames, type SearchState } from "@/lib/search";
import { useSearchPath } from "@/hooks/use-search-path";
import { usePlayground } from "./playground-context";
import { Result } from "./result";
import { StateGraph } from "@/components/state-graph";
import { Verdict } from "@/components/verdict";

// The sidebar a run opens: its verdict, then the states it reached or the steps to the failure.
export const PlaygroundResult = () => {
  const playground = usePlayground();
  const isResultShown = usePlaygroundView((view) => view.isResultShown);
  const setIsResultShown = usePlaygroundView((view) => view.setIsResultShown);
  const hoverState = usePlaygroundView((view) => view.hoverState);
  const result = playground.result;
  const search = result?.search;
  const path = useSearchPath(
    search,
    usePlaygroundView((view) => view.hoveredStateId),
  );
  // Selecting a state brings the code it came from into view in both panes.
  const reveal = (state: SearchState) => {
    const workspace = playground.workspaceRef.current;
    const name = getStateNames(state).at(0) ?? "";
    for (const target of [
      workspace?.querySelector(`[data-pane="source"] [data-region="${CSS.escape(name)}"]`),
      workspace?.querySelector(`[data-pane="output"] [data-line="${state.line}"]`),
    ])
      target?.scrollIntoView({ block: "center", inline: "nearest" });
    if (!playground.isWide) setIsResultShown(false);
  };
  return (
    <Result.Root isOpen={isResultShown && (playground.isRunning || result !== undefined)}>
      <Result.Header
        onClose={() => {
          setIsResultShown(false);
          playground.runButtonRef.current?.focus({ preventScroll: true });
        }}
      />
      <Result.Body>
        {playground.isRunning ? (
          <Result.Skeleton>
            <StateGraph.Skeleton />
          </Result.Skeleton>
        ) : (
          result && (
            <>
              <Result.Section title={result.isPassed ? "Verdict" : "Issue"}>
                <Verdict result={result} />
              </Result.Section>
              {result.graphOmittedPast !== undefined && (
                <Result.Section title="States">
                  <p className="text-muted-foreground">
                    Graph omitted past {result.graphOmittedPast.toLocaleString()} states
                  </p>
                </Result.Section>
              )}
              {search && search.listedStates.length > 0 && (
                <Result.Section
                  title={result.isPassed ? "States" : "Steps to the failing state"}
                  count={search.listedStates.length}
                  className="min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]"
                >
                  <StateGraph.Root
                    search={search}
                    className="-mx-2 px-2 pb-2"
                    path={path}
                    onHover={hoverState}
                    onSelect={reveal}
                  />
                </Result.Section>
              )}
            </>
          )
        )}
      </Result.Body>
    </Result.Root>
  );
};
