export interface SearchState {
  id: string;
  parentId: string | undefined;
  call: string | undefined;
  line: number | undefined;
  text: string;
  change: string;
  isFailing: boolean;
}

export interface SearchEdge {
  fromId: string;
  toId: string;
  call: string;
}

export interface SearchChart {
  states: SearchState[];
  edges: SearchEdge[];
}

export interface Search {
  states: SearchState[];
  chart: SearchChart;
  stateCount: number;
}

const SHOWN_STATES = 8;
const CHART_STATES = 24;
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
  const changes = new Map<string, string[]>();
  const edges = new Map<string, SearchEdge>();
  for (const line of graph.split("\n")) {
    const edge = EDGE.exec(line);
    if (edge && edge[1] !== edge[2] && !edges.has(`${edge[1]} ${edge[2]}`)) {
      edges.set(`${edge[1]} ${edge[2]}`, {
        fromId: edge[1],
        toId: edge[2],
        call: getText(edge[3]),
      });
    }
    if (edge && !states.has(edge[2]) && !steps.has(edge[2])) {
      steps.set(edge[2], { parentId: edge[1], call: getText(edge[3]) });
    }
    const node = edge ? null : NODE.exec(line);
    if (!node || states.has(node[1])) continue;
    const variables = getText(node[2]).replaceAll("/\\ ", "").trim().split("\n");
    const text = variables.join(", ");
    const parentId = steps.get(node[1])?.parentId;
    const changed = variables.filter(
      (variable) => !changes.get(parentId ?? "")?.includes(variable),
    );
    changes.set(node[1], variables);
    states.set(node[1], {
      id: node[1],
      parentId,
      call: steps.get(node[1])?.call,
      line: getLine(steps.get(node[1])?.call),
      text,
      change: (changed.length > 0 ? changed : variables).join(", "),
      isFailing: text === failingState,
    });
  }
  const failing = [...states.values()].find((state) => state.isFailing);
  const failingIds = getPath([...states.values()], failing?.id).map((state) => state.id);
  const getShown = (count: number) => {
    const shown = new Set([...[...states.keys()].slice(0, count), ...failingIds]);
    return [...states.values()].filter((state) => shown.has(state.id));
  };
  const chartStates = getShown(CHART_STATES);
  return {
    states: getShown(SHOWN_STATES),
    chart: {
      states: chartStates,
      edges: [...edges.values()].filter(
        (edge) =>
          chartStates.some((state) => state.id === edge.fromId) &&
          chartStates.some((state) => state.id === edge.toId),
      ),
    },
    stateCount: states.size,
  };
};

export const getPath = (states: SearchState[], stateId: string | undefined): SearchState[] => {
  const state = states.find((innerState) => innerState.id === stateId);
  return state ? [state, ...getPath(states, state.parentId)] : [];
};
