import { getStateNames, type SearchState } from "../search";
import { usePlayground } from "./playground";
import { ResultBody, ResultHeader, ResultRoot, ResultSection, ResultSkeleton } from "./result";
import { StateGraph, StateGraphSkeleton } from "./state-graph";
import { Verdict } from "./verdict";

// The sidebar a run opens: its verdict, then the states it reached or the steps to the failure.
export const PlaygroundResult = () => {
  const playground = usePlayground();
  const result = playground.result;
  const search = result?.search;
  // Selecting a state brings the code it came from into view in both panes.
  const reveal = (state: SearchState) => {
    const workspace = playground.workspaceRef.current;
    const name = getStateNames(state).at(0) ?? "";
    for (const target of [
      workspace?.querySelector(`[data-pane="source"] [data-region="${CSS.escape(name)}"]`),
      workspace?.querySelector(`[data-pane="output"] [data-line="${state.line}"]`),
    ])
      target?.scrollIntoView({ block: "center", inline: "nearest" });
    if (!playground.isWide) playground.setIsResultShown(false);
  };
  return (
    <ResultRoot isOpen={playground.isResultShown && (playground.isRunning || result !== undefined)}>
      <ResultHeader
        onClose={() => {
          playground.setIsResultShown(false);
          playground.runButtonRef.current?.focus({ preventScroll: true });
        }}
      />
      <ResultBody>
        {playground.isRunning ? (
          <ResultSkeleton>
            <StateGraphSkeleton />
          </ResultSkeleton>
        ) : (
          result && (
            <>
              <ResultSection title={result.isPassed ? "Verdict" : "Issue"}>
                <Verdict result={result} />
              </ResultSection>
              {search && search.listedStates.length > 0 && (
                <ResultSection
                  title={result.isPassed ? "States" : "Steps to the failing state"}
                  count={search.listedStates.length}
                  className="min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]"
                >
                  <StateGraph
                    search={search}
                    className="-mx-2 px-2 pb-2"
                    path={playground.trace.states}
                    onHover={playground.trace.hover}
                    onSelect={reveal}
                  />
                </ResultSection>
              )}
            </>
          )
        )}
      </ResultBody>
    </ResultRoot>
  );
};
