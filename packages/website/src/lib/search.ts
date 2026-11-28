export interface StateVariable {
  name: string;
  value: string;
  isChanged: boolean;
}

export interface SearchState {
  id: string;
  parentId: string | undefined;
  call: string | undefined;
  line: number | undefined;
  text: string;
  change: string;
  variables: StateVariable[];
  isFailing: boolean;
}

export interface SearchEdge {
  fromId: string;
  toId: string;
}

export interface Search {
  states: SearchState[];
  listedStates: SearchState[];
  // Every state the search reached before it stopped.
  checkedStates: SearchState[];
  edges: SearchEdge[];
}

const SHOWN_STATES = 4;
const WHOLE_STATE_LENGTH = 24;
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
    if (edge && edge[1] !== edge[2]) {
      edges.set(`${edge[1]} ${edge[2]}`, { fromId: edge[1], toId: edge[2] });
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
      // A short state is shown whole, because two states can share a change.
      change:
        text.length <= WHOLE_STATE_LENGTH
          ? text
          : (changed.length > 0 ? changed : variables).join(", "),
      variables: variables.map((variable) => ({
        name: variable.slice(0, variable.indexOf(" = ")),
        value: variable.slice(variable.indexOf(" = ") + 3),
        isChanged: changed.includes(variable),
      })),
      isFailing: text === failingState,
    });
  }
  const failing = [...states.values()].find((state) => state.isFailing);
  const failingIds = getPath(states, failing?.id).map((state) => state.id);
  // A failing run shows only the steps to the failing state.
  const shown = new Set(
    failingIds.length > 0 ? failingIds : [...states.keys()].slice(0, SHOWN_STATES),
  );
  const shownStates = [...states.values()].filter((state) => shown.has(state.id));
  return {
    states: shownStates,
    listedStates: failingIds.length > 0 ? shownStates : [...states.values()],
    checkedStates: [...states.values()],
    edges: [...edges.values()],
  };
};

// The names of the code a state came from: its step, or its variables when it is a first state.
export const getStateNames = (state: SearchState) =>
  state.call === undefined
    ? state.variables.map((variable) => variable.name)
    : [state.call.replace(/\(.*/, "")];

export const getPath = (
  states: Map<string, SearchState>,
  stateId: string | undefined,
): SearchState[] => {
  const path: SearchState[] = [];
  for (
    let state = states.get(stateId ?? "");
    state !== undefined;
    state = states.get(state.parentId ?? "")
  ) {
    path.push(state);
  }
  return path;
};
