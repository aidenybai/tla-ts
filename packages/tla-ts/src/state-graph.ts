// A port of TLC's -dump writers, tlc2.util.StateWriter and tlc2.util.DotStateWriter.

import type { TlcVersion } from "./tlc/version";
import { formatState, type Value } from "./values";

export interface StateDump {
  path: string;
  dot?: boolean;
  colorize?: boolean;
  actionLabels?: boolean;
  snapshot?: boolean;
}

// A distinct state of the graph -dump writes, numbered from 0 in the order onState receives it.
export interface GraphState {
  // The state, or the record its ALIAS evaluates to, which -dump labels the state with.
  state: Record<string, Value>;
  // The state and the action of the step that first reached this state, or undefined for an
  // initial state.
  parent: number | undefined;
  action: string | undefined;
}

// A step between two states of the graph -dump writes, in the order -dump writes it.
export interface GraphStep {
  from: number;
  to: number;
  // Undefined for the stuttering step of a state that TLC 1.7.4 adds to the behavior graph.
  action: string | undefined;
}

export interface WrittenState {
  fingerprint: bigint;
  level: number;
  // The state after TLC evaluates the alias, and the state without the alias.
  getAliased: () => Record<string, Value>;
  getState: () => Record<string, Value>;
}

interface GraphAction {
  name: string;
  signature: string;
}

export interface StateWriter {
  writeInitialState: (state: WrittenState) => void;
  writeSuccessor: (
    state: WrittenState,
    successor: WrittenState,
    isSeen: boolean,
    action: GraphAction | undefined,
  ) => void;
  // The stuttering step of a state that TLC 1.7.4 adds to the behavior graph.
  writeStuttering: (state: WrittenState) => void;
  close: () => void;
}

interface StateWriterOptions {
  dump?: StateDump;
  writeFile?: (path: string, content: string) => void;
  version?: TlcVersion;
  onState?: (state: GraphState) => void;
  onStep?: (step: GraphStep) => void;
}

type WriteFile = StateWriterOptions["writeFile"];

const COLOR_SCHEME = "paired12";
const LOAD_FACTOR = 0.75;
const INITIAL_CAPACITY = 16;

const getCapacity = (size: number, capacity = INITIAL_CAPACITY): number =>
  size <= capacity * LOAD_FACTOR ? capacity : getCapacity(size, capacity * 2);

// The order in which a java.util.HashMap iterates over keys put in this order: by bucket, and in
// insertion order within a bucket. A bucket only becomes a tree once 8 keys collide in it.
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
  const writeState = (state: WrittenState) =>
    states.push(`State ${states.length + 1}:\n${formatState(state.getState())}\n`);
  return {
    writeInitialState: writeState,
    writeSuccessor: (_state, successor, isSeen) => {
      if (!isSeen) writeState(successor);
    },
    // TLC 1.7.4 writes the state again, as it takes the stuttering step for one to a new state.
    writeStuttering: writeState,
    close: () => writeFile?.(dump.path, states.join("")),
  };
};

// TLC 1.7.4 draws its nodes as ellipses, gives them no tooltip, and labels an edge with the name
// of its action alone.
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
  const addRank = (state: WrittenState) => {
    const rank = ranks.get(state.level) ?? new Set();
    ranks.set(state.level, rank.add(state.fingerprint));
  };
  // TLC colors an edge by the name of its action, numbering the names from 2 as it finds them.
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
  return {
    writeInitialState: (state) => {
      lines.push(
        `${state.fingerprint} [label="${toDotLabel(formatState(state.getAliased()))}",style = filled]\n`,
      );
      addRank(state);
      writeSnapshot();
    },
    writeSuccessor: (state, successor, isSeen, action) => {
      const color = dump.colorize ? String(getColor(action)) : "black";
      const label =
        dump.actionLabels && action ? escapeDotString(is174 ? action.name : action.signature) : "";
      lines.push(
        `${state.fingerprint} -> ${successor.fingerprint} [label="${label}",color="${color}",fontcolor="${color}"];\n`,
      );
      if (!isSeen) {
        const tooltip = is174 ? "" : `,tooltip="${toDotLabel(formatState(successor.getState()))}"`;
        lines.push(
          `${successor.fingerprint} [label="${toDotLabel(formatState(successor.getAliased()))}"${tooltip}];\n`,
        );
      }
      addRank(state);
      writeSnapshot();
    },
    writeStuttering: (state) => {
      lines.push(`${state.fingerprint} -> ${state.fingerprint} [style="dashed"];\n`);
      addRank(state);
      writeSnapshot();
    },
    close: () => writeFile?.(dump.path, lines.join("") + getEnding()),
  };
};

// The graph -dump writes, as data: a state the first time a step reaches its fingerprint, as -dump
// writes a node, and every step -dump writes as an edge.
const createGraphWriter = (options: StateWriterOptions): StateWriter => {
  const indexes = new Map<bigint, number>();
  const getIndex = (state: WrittenState) => indexes.get(state.fingerprint) ?? -1;
  const addState = (
    state: WrittenState,
    parent: number | undefined,
    action: string | undefined,
  ) => {
    indexes.set(state.fingerprint, indexes.size);
    options.onState?.({ state: state.getAliased(), parent, action });
  };
  return {
    writeInitialState: (state) => addState(state, undefined, undefined),
    writeSuccessor: (state, successor, _isSeen, action) => {
      const from = getIndex(state);
      if (!indexes.has(successor.fingerprint)) addState(successor, from, action?.name);
      options.onStep?.({ from, to: getIndex(successor), action: action?.name });
    },
    writeStuttering: (state) => {
      const index = getIndex(state);
      options.onStep?.({ from: index, to: index, action: undefined });
    },
    close: () => {},
  };
};

export const createStateWriter = (options: StateWriterOptions): StateWriter | undefined => {
  const dump = options.dump;
  const writers = [
    ...(dump
      ? [
          dump.dot
            ? createDotWriter(dump, options.writeFile, options.version)
            : createPlainWriter(dump, options.writeFile),
        ]
      : []),
    ...(options.onState || options.onStep ? [createGraphWriter(options)] : []),
  ];
  if (writers.length < 2) return writers[0];
  return {
    writeInitialState: (state) => writers.forEach((writer) => writer.writeInitialState(state)),
    writeSuccessor: (state, successor, isSeen, action) =>
      writers.forEach((writer) => writer.writeSuccessor(state, successor, isSeen, action)),
    writeStuttering: (state) => writers.forEach((writer) => writer.writeStuttering(state)),
    close: () => writers.forEach((writer) => writer.close()),
  };
};
