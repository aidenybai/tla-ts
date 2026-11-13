export interface SearchStep {
  calls: string[];
  state: string;
  isFailing: boolean;
}

export interface Search {
  steps: SearchStep[];
  stateCount: number;
}

const SHOWN_STEPS = 8;
const EDGE = /^(-?\d+) -> (-?\d+) \[label="((?:[^"\\]|\\.)*)"/;
const NODE = /^(-?\d+) \[label="((?:[^"\\]|\\.)*)"/;

const getText = (label: string) => label.replaceAll("\\n", "\n").replaceAll(/\\(.)/g, "$1");

// Reads the state graph TLC dumps as DOT, where each state follows the step that found it.
export const getSearch = (graph: string, failingState: string | undefined): Search => {
  const calls = new Map<string, string[]>();
  const found = new Map<string, string[]>();
  const steps = graph.split("\n").flatMap((line): SearchStep[] => {
    const edge = EDGE.exec(line);
    if (edge) {
      if (!calls.has(edge[2]) && !found.has(edge[2])) {
        found.set(edge[2], [...(calls.get(edge[1]) ?? []), getText(edge[3])]);
      }
      return [];
    }
    const node = NODE.exec(line);
    if (!node || calls.has(node[1])) return [];
    calls.set(node[1], found.get(node[1]) ?? []);
    const state = getText(node[2]).replaceAll("/\\ ", "").replaceAll("\n", ", ");
    return [{ calls: calls.get(node[1]) ?? [], state, isFailing: state === failingState }];
  });
  return {
    steps: steps.filter((step, index) => index < SHOWN_STEPS || step.isFailing),
    stateCount: steps.length,
  };
};
