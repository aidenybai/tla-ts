// A port of TLC's -dump writers, tlc2.util.StateWriter and tlc2.util.DotStateWriter.

import type { TlcVersion } from "./tlc/version";

export interface StateDump {
  path: string;
  dot?: boolean;
  colorize?: boolean;
  actionLabels?: boolean;
  snapshot?: boolean;
  constrained?: boolean;
  stuttering?: boolean;
  strict?: boolean;
}

export interface GraphState {
  fingerprint: bigint;
  level: number;
  getLabel: () => string;
  getText: () => string;
}

interface GraphAction {
  name: string;
  signature: string;
}

export interface StateWriter {
  writeInitialState: (state: GraphState) => void;
  writeSuccessor: (
    state: GraphState,
    successor: GraphState,
    isSeen: boolean,
    action: GraphAction | undefined,
  ) => void;
  writeConstrained: (
    state: GraphState,
    successor: GraphState,
    action: GraphAction | undefined,
    constraint: string,
  ) => void;
  writeStuttering: (state: GraphState) => void;
  close: () => void;
}

type WriteFile = ((path: string, content: string) => void) | undefined;

const COLOR_SCHEME = "paired12";
const LOAD_FACTOR = 0.75;
const INITIAL_CAPACITY = 16;

const getCapacity = (size: number, capacity = INITIAL_CAPACITY): number =>
  size <= capacity * LOAD_FACTOR ? capacity : getCapacity(size, capacity * 2);

const getJavaHashOrder = <Key>(keys: Key[], getHash: (key: Key) => number) => {
  const mask = getCapacity(keys.length) - 1;
  const getBucket = (key: Key) => {
    const hash = getHash(key);
    return (hash ^ (hash >>> 16)) & mask;
  };
  return keys
    .map((key, position) => ({ key, position, bucket: getBucket(key) }))
    .sort((left, right) => left.bucket - right.bucket || left.position - right.position)
    .map((entry) => entry.key);
};

const getLongHash = (value: bigint) =>
  Number(BigInt.asIntN(32, value ^ (BigInt.asUintN(64, value) >> 32n)));

const getStringHash = (text: string) =>
  [...Array(text.length).keys()].reduce(
    (hash, index) => (Math.imul(31, hash) + text.charCodeAt(index)) | 0,
    0,
  );

const escapeDotString = (text: string) =>
  text.replaceAll("\\", "\\\\").replaceAll('"', '\\"').trim();

const toDotLabel = (text: string) => escapeDotString(text).replaceAll("\n", "\\n");

const createPlainWriter = (dump: StateDump, writeFile: WriteFile): StateWriter => {
  const states: string[] = [];
  const writeState = (state: GraphState) =>
    states.push(`State ${states.length + 1}:\n${state.getText()}\n`);
  return {
    writeInitialState: writeState,
    writeSuccessor: (_state, successor, isSeen) => {
      if (!isSeen) writeState(successor);
    },
    writeConstrained: () => {},
    writeStuttering: writeState,
    close: () => writeFile?.(dump.path, states.join("")),
  };
};

const createDotWriter = (
  dump: StateDump,
  writeFile: WriteFile,
  version: TlcVersion | undefined,
): StateWriter => {
  const is174 = version === "1.7.4";
  const lines = [
    "strict digraph DiskGraph {\n",
    is174 ? "" : "node [shape=box,style=rounded]\n",
    dump.colorize ? `edge [colorscheme="${COLOR_SCHEME}"]\n` : "",
    "nodesep=0.35;\n",
    "subgraph cluster_graph {\n",
    'color="white";\n',
  ];
  const ranks = new Map<number, Set<bigint>>();
  const colors = new Map<string, number>();
  // Deviation from TLC: it keys an edge by the XOR of its fingerprints, which merges distinct edges.
  const edges = new Set<string>();
  const isDuplicate = (state: GraphState, successor: GraphState) => {
    if (!dump.strict) return false;
    const key = `${state.fingerprint} ${successor.fingerprint}`;
    if (edges.has(key)) return true;
    edges.add(key);
    return false;
  };
  const addRank = (state: GraphState) => {
    const rank = ranks.get(state.level) ?? new Set();
    ranks.set(state.level, rank.add(state.fingerprint));
  };
  const getColor = (action: GraphAction | undefined) => {
    if (!action) return 1;
    const color = colors.get(action.name) ?? colors.size + 2;
    colors.set(action.name, color);
    return color;
  };
  const getLegend = () =>
    [
      `subgraph cluster_legend {graph[style=bold];label = "Next State Actions" style="solid"\n`,
      `node [ labeljust="l",colorscheme="${COLOR_SCHEME}",style=filled,shape=record ]\n`,
      ...getJavaHashOrder([...colors.keys()], getStringHash).map(
        (name) => `${name.replaceAll("!", ":")} [label="${name}",fillcolor=${colors.get(name)}]\n`,
      ),
      "}",
    ].join("");
  const getEnding = () =>
    [
      ...getJavaHashOrder([...ranks], (rank) => rank[0]).map(
        (rank) =>
          `{rank = same; ${getJavaHashOrder([...rank[1]], getLongHash)
            .map((fingerprint) => `${fingerprint};`)
            .join("")}}\n`,
      ),
      "}\n",
      dump.colorize && colors.size > 1 ? getLegend() : "",
      "}",
    ].join("");
  const writeSnapshot = () => {
    if (dump.snapshot) {
      writeFile?.(dump.path.replaceAll(".dot", "_snapshot.dot"), lines.join("") + getEnding());
    }
  };
  const writeEdge = (
    state: GraphState,
    successor: GraphState,
    isSeen: boolean,
    action: GraphAction | undefined,
    constraint?: string,
  ) => {
    if (isDuplicate(state, successor)) return;
    const color = dump.colorize ? String(getColor(action)) : "black";
    const name =
      dump.actionLabels && action ? escapeDotString(is174 ? action.name : action.signature) : "";
    const label = constraint === undefined ? name : `${name}\n${constraint}`;
    lines.push(
      `${state.fingerprint} -> ${successor.fingerprint} [label="${label}",color="${color}",fontcolor="${color}"];\n`,
    );
    if (!isSeen) {
      const tooltip = is174 ? "" : `,tooltip="${toDotLabel(successor.getText())}"`;
      const fill = constraint === undefined ? "" : ",style = filled, fillcolor=lightyellow";
      lines.push(
        `${successor.fingerprint} [label="${toDotLabel(successor.getLabel())}"${tooltip}${fill}];\n`,
      );
    }
    addRank(state);
    writeSnapshot();
  };
  return {
    writeInitialState: (state) => {
      lines.push(`${state.fingerprint} [label="${toDotLabel(state.getLabel())}",style = filled]\n`);
      addRank(state);
      writeSnapshot();
    },
    writeSuccessor: writeEdge,
    writeConstrained: (state, successor, action, constraint) =>
      writeEdge(state, successor, false, action, constraint),
    writeStuttering: (state) => {
      if (isDuplicate(state, state)) return;
      lines.push(
        `${state.fingerprint} -> ${state.fingerprint} [style="dashed"${is174 ? "" : ',color="lightgray"'}];\n`,
      );
      addRank(state);
      writeSnapshot();
    },
    close: () => writeFile?.(dump.path, lines.join("") + getEnding()),
  };
};

export const createStateWriter = (
  dump: StateDump,
  writeFile: WriteFile,
  version: TlcVersion | undefined,
) => (dump.dot ? createDotWriter(dump, writeFile, version) : createPlainWriter(dump, writeFile));
