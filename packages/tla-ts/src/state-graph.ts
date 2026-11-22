import { getHashMapOrder, getJavaHashCode } from "./java-hash";
import type { TlcVersion } from "./tlc/version";
import { formatState, type Value } from "./values";

export interface StateDump {
  path: string;
  dot?: boolean;
  colorize?: boolean;
  actionLabels?: boolean;
  snapshot?: boolean;
  constrained?: boolean;
  stuttering?: boolean;
  strict?: boolean;
  /** TLC's -difftrace, which labels a successor with the variables its step changes. */
  isDiffTrace?: boolean;
}

export interface GraphState {
  fingerprint: bigint;
  level: number;
  getRecord: () => Record<string, Value>;
  getAlias: () => Record<string, Value> | undefined;
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
  writeUnlabeledSuccessor: (state: GraphState, successor: GraphState, isSeen: boolean) => void;
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

const getLongHash = (value: bigint) =>
  Number(BigInt.asIntN(32, value ^ (BigInt.asUintN(64, value) >> 32n)));

const escapeDotString = (text: string) =>
  text.replaceAll("\\", "\\\\").replaceAll('"', '\\"').trim();

const getLabelRecord = (state: GraphState) => state.getAlias() ?? state.getRecord();

const toDotLabel = (text: string) => escapeDotString(text).replaceAll("\n", "\\n");

const createPlainWriter = (dump: StateDump, writeFile: WriteFile): StateWriter => {
  const states: string[] = [];
  const writeState = (state: GraphState) =>
    states.push(`State ${states.length + 1}:\n${formatState(state.getRecord())}\n`);
  const writeSuccessor = (_state: GraphState, successor: GraphState, isSeen: boolean) => {
    if (!isSeen) writeState(successor);
  };
  return {
    writeInitialState: writeState,
    writeSuccessor,
    writeUnlabeledSuccessor: writeSuccessor,
    writeConstrained: () => {},
    writeStuttering: writeState,
    close: () => writeFile?.(dump.path, states.join("")),
  };
};

const getGraphHeader = (
  prefix: string,
  isColorized: boolean | undefined,
  version: TlcVersion | undefined,
) =>
  [
    `${prefix}digraph DiskGraph {\n`,
    version === "1.7.4" ? "" : "node [shape=box,style=rounded]\n",
    isColorized ? `edge [colorscheme="${COLOR_SCHEME}"]\n` : "",
    "nodesep=0.35;\n",
    "subgraph cluster_graph {\n",
    'color="white";\n',
  ].join("");

export const getDotHeader = (dump: StateDump, version: TlcVersion | undefined) =>
  getGraphHeader("strict ", dump.colorize, version);

const createDotWriter = (
  dump: StateDump,
  writeFile: WriteFile,
  version: TlcVersion | undefined,
  header: string,
): StateWriter => {
  const is174 = version === "1.7.4";
  const lines = [header];
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
      ...getHashMapOrder([...colors.keys()], getJavaHashCode).map(
        (name) => `${name.replaceAll("!", ":")} [label="${name}",fillcolor=${colors.get(name)}]\n`,
      ),
      "}",
    ].join("");
  const getEnding = () =>
    [
      ...getHashMapOrder([...ranks], (rank) => rank[0]).map(
        (rank) =>
          `{rank = same; ${getHashMapOrder([...rank[1]], getLongHash)
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
    isLabeled: boolean,
    action?: GraphAction,
    constraint?: string,
  ) => {
    if (isDuplicate(state, successor)) return;
    const color = dump.colorize ? String(getColor(action)) : "black";
    const name =
      dump.actionLabels && action ? escapeDotString(is174 ? action.name : action.signature) : "";
    const label = constraint === undefined ? name : `${name}\n${constraint}`;
    const attributes = isLabeled ? ` [label="${label}",color="${color}",fontcolor="${color}"]` : "";
    lines.push(`${state.fingerprint} -> ${successor.fingerprint}${attributes};\n`);
    if (!isSeen) {
      const tooltip = is174 ? "" : `,tooltip="${toDotLabel(formatState(successor.getRecord()))}"`;
      const alias = successor.getAlias();
      const isDiffed = dump.isDiffTrace && !is174;
      // TLC diffs a successor that its ALIAS leaves as it is against the predecessor as it is.
      const previous = !isDiffed
        ? undefined
        : alias === undefined
          ? state.getRecord()
          : getLabelRecord(state);
      const label = formatState(alias ?? successor.getRecord(), previous);
      const fill = constraint === undefined ? "" : ",style = filled, fillcolor=lightyellow";
      lines.push(`${successor.fingerprint} [label="${toDotLabel(label)}"${tooltip}${fill}];\n`);
    }
    addRank(state);
    writeSnapshot();
  };
  return {
    writeInitialState: (state) => {
      lines.push(
        `${state.fingerprint} [label="${toDotLabel(formatState(getLabelRecord(state)))}",style = filled]\n`,
      );
      addRank(state);
      writeSnapshot();
    },
    writeSuccessor: (state, successor, isSeen, action) =>
      writeEdge(state, successor, isSeen, true, action),
    writeUnlabeledSuccessor: (state, successor, isSeen) =>
      writeEdge(state, successor, isSeen, false),
    writeConstrained: (state, successor, action, constraint) =>
      writeEdge(state, successor, false, true, action, constraint),
    writeStuttering: (state) => {
      if (!(is174 || dump.stuttering) || isDuplicate(state, state)) return;
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
) =>
  dump.dot
    ? createDotWriter(dump, writeFile, version, getDotHeader(dump, version))
    : createPlainWriter(dump, writeFile);

export interface LivenessWriter {
  writeInitialState: (state: GraphState, tableauNode: number) => void;
  writeSuccessor: (
    state: GraphState,
    tableauNode: number,
    successor: GraphState,
    successorNode: number,
    actionChecks: string,
    isSeen: boolean,
    isDotted: boolean,
  ) => void;
}

export interface LivenessDump {
  createWriter: (isTableau: boolean) => LivenessWriter;
  close: () => void;
}

export const createLivenessDump = (
  dump: StateDump,
  writeFile: WriteFile,
  version: TlcVersion | undefined,
): LivenessDump => {
  const path = dump.path.replaceAll(".dot", "_liveness.dot");
  const header = getGraphHeader("", false, version);
  const graphs: string[] = [];
  const closers: (() => void)[] = [];
  const createWriter = (isTableau: boolean): LivenessWriter => {
    const position = graphs.push(header) - 1;
    writeFile?.(path, header);
    const setGraph = (_path: string, graph: string) => {
      graphs[position] = graph;
    };
    if (!isTableau) {
      const writer = createDotWriter(
        { path, isDiffTrace: dump.isDiffTrace },
        setGraph,
        version,
        header,
      );
      closers.push(writer.close);
      return {
        writeInitialState: writer.writeInitialState,
        writeSuccessor: (state, _tableauNode, successor, _successorNode, _actionChecks, isSeen) =>
          writer.writeUnlabeledSuccessor(state, successor, isSeen),
      };
    }
    const lines = [header];
    closers.push(() => setGraph(path, `${lines.join("")}}\n}`));
    const getNode = (state: GraphState, tableauNode: number) =>
      `"${state.fingerprint}.${tableauNode}"`;
    const getLabel = (state: GraphState, tableauNode: number) =>
      `${toDotLabel(formatState(state.getRecord()))}\n#${state.fingerprint}.${tableauNode}#`;
    return {
      writeInitialState: (state, tableauNode) =>
        lines.push(
          `${getNode(state, tableauNode)} [style = filled] [label="${getLabel(state, tableauNode)}"]\n`,
        ),
      writeSuccessor: (
        state,
        tableauNode,
        successor,
        successorNode,
        actionChecks,
        isSeen,
        isDotted,
      ) => {
        const target = getNode(successor, successorNode);
        lines.push(
          `${getNode(state, tableauNode)} -> ${target}${isDotted ? ' [style="dotted"]' : ""}${actionChecks === "" ? "" : ` [label="${actionChecks}"]`};\n`,
        );
        if (!isSeen) lines.push(`${target} [label="${getLabel(successor, successorNode)}"];\n`);
      },
    };
  };
  return {
    createWriter,
    close: () => {
      if (graphs.length === 0) return;
      closers.forEach((close) => close());
      // Deviation from TLC: the writers of its branches overwrite one another in the file, which leaves the tail of an earlier branch's graph past the end of a later one's.
      writeFile?.(path, graphs.join("\n"));
    },
  };
};
