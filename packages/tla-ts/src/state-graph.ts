// A port of TLC's -dump writers, tlc2.util.StateWriter and tlc2.util.DotStateWriter.

export interface StateDump {
  path: string;
  dot?: boolean;
  colorize?: boolean;
  actionLabels?: boolean;
  snapshot?: boolean;
}

export interface GraphState {
  fingerprint: bigint;
  level: number;
  // The state as TLC prints it after evaluating the alias, and as it prints it without the alias.
  getLabel: () => string;
  getText: () => string;
}

export interface GraphAction {
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
  close: () => void;
}

type WriteFile = ((path: string, content: string) => void) | undefined;

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

const escape = (text: string) => text.replaceAll("\\", "\\\\").replaceAll('"', '\\"').trim();

const toDot = (text: string) => escape(text).replaceAll("\n", "\\n");

const createPlainWriter = (dump: StateDump, writeFile: WriteFile): StateWriter => {
  const states: string[] = [];
  const writeState = (state: GraphState) =>
    states.push(`State ${states.length + 1}:\n${state.getText()}\n`);
  return {
    writeInitialState: writeState,
    writeSuccessor: (_state, successor, isSeen) => {
      if (!isSeen) writeState(successor);
    },
    close: () => writeFile?.(dump.path, states.join("")),
  };
};

const createDotWriter = (dump: StateDump, writeFile: WriteFile): StateWriter => {
  const lines = [
    "strict digraph DiskGraph {\n",
    "node [shape=box,style=rounded]\n",
    dump.colorize ? `edge [colorscheme="${COLOR_SCHEME}"]\n` : "",
    "nodesep=0.35;\n",
    "subgraph cluster_graph {\n",
    'color="white";\n',
  ];
  const ranks = new Map<number, Set<bigint>>();
  const colors = new Map<string, number>();
  const addRank = (state: GraphState) => {
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
      lines.push(`${state.fingerprint} [label="${toDot(state.getLabel())}",style = filled]\n`);
      addRank(state);
      writeSnapshot();
    },
    writeSuccessor: (state, successor, isSeen, action) => {
      const color = dump.colorize ? String(getColor(action)) : "black";
      const label = dump.actionLabels && action ? escape(action.signature) : "";
      lines.push(
        `${state.fingerprint} -> ${successor.fingerprint} [label="${label}",color="${color}",fontcolor="${color}"];\n`,
      );
      if (!isSeen) {
        lines.push(
          `${successor.fingerprint} [label="${toDot(successor.getLabel())}",tooltip="${toDot(successor.getText())}"];\n`,
        );
      }
      addRank(state);
      writeSnapshot();
    },
    close: () => writeFile?.(dump.path, lines.join("") + getEnding()),
  };
};

export const createStateWriter = (dump: StateDump, writeFile: WriteFile) =>
  dump.dot ? createDotWriter(dump, writeFile) : createPlainWriter(dump, writeFile);
