export interface SearchState {
  id: string;
  parentId: string | undefined;
  call: string | undefined;
  line: number | undefined;
  text: string;
  isFailing: boolean;
}

export interface Search {
  states: SearchState[];
  stateCount: number;
}

const SHOWN_STATES = 8;
const EDGE = /^(-?\d+) -> (-?\d+) \[label="((?:[^"\\]|\\.)*)"/;
const NODE = /^(-?\d+) \[label="((?:[^"\\]|\\.)*)"/;

const getText = (label: string) => label.replaceAll("\\n", "\n").replaceAll(/\\(.)/g, "$1");

// Reads the state graph TLC dumps as DOT, where each state follows the step that found it.
export const getSearch = (
  graph: string,
  failingState: string | undefined,
  getLine: (call: string | undefined) => number | undefined,
): Search => {
  const steps = new Map<string, { parentId: string; call: string }>();
  const states = new Map<string, SearchState>();
  for (const line of graph.split("\n")) {
    const edge = EDGE.exec(line);
    if (edge && !states.has(edge[2]) && !steps.has(edge[2])) {
      steps.set(edge[2], { parentId: edge[1], call: getText(edge[3]) });
    }
    const node = edge ? null : NODE.exec(line);
    if (!node || states.has(node[1])) continue;
    const text = getText(node[2]).replaceAll("/\\ ", "").replaceAll("\n", ", ");
    states.set(node[1], {
      id: node[1],
      parentId: steps.get(node[1])?.parentId,
      call: steps.get(node[1])?.call,
      line: getLine(steps.get(node[1])?.call),
      text,
      isFailing: text === failingState,
    });
  }
  const shown = new Set([...states.keys()].slice(0, SHOWN_STATES));
  let failing = [...states.values()].find((state) => state.isFailing);
  while (failing) {
    shown.add(failing.id);
    failing = failing.parentId === undefined ? undefined : states.get(failing.parentId);
  }
  return {
    states: [...states.values()].filter((state) => shown.has(state.id)),
    stateCount: states.size,
  };
};
