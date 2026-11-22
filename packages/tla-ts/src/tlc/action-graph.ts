import { formatRange } from "../errors";
import { getHashMapOrder, getJavaHashCode } from "../java-hash";
import { getActionLabel, isNamedAction, type SpecAction } from "../spec-description";
import { formatValue, type Value } from "../values";
import { toJavaString } from "./summary";

export type ActionStatistics = "basic" | "full";

export interface ActionFlow {
  statistics: ActionStatistics;
  actions: SpecAction[];
  initCount: number;
  actionStats: Float64Array;
}

interface ActionVertex {
  action: SpecAction;
  isInitPredicate: boolean;
}

interface ActionFlowGraphSnapshot {
  vertices: ActionVertex[];
  actionStats: Float64Array;
}

// TLC's DotActionWriter declares p0 twice and never p1.
const DOT_HEADER =
  'digraph ActionGraph {\nnodesep=0.35;\nsubgraph cluster_legend {\nlabel = "Coverage";\nnode [shape=point] {\nd0 [style = invis];\nd1 [style = invis];\np0 [style = invis];\np0 [style = invis];\n}\nd0 -> d1 [label=unseen, color="green", style=dotted]\np0 -> p1 [label=seen]\n}\n';

const getNameOfDefault = (action: SpecAction) =>
  isNamedAction(action) ? action.name : `<${getActionLabel(action)}>`;

const writeAction = (vertex: ActionVertex, id: number) =>
  `${id} [shape=box,label="${getNameOfDefault(vertex.action)}${vertex.isInitPredicate ? '",style = filled]' : '"]'}\n`;

// BigDecimal#valueOf rounds the shortest decimal form of a double, not its binary value.
const roundHalfUp = (weight: number) => {
  const [whole, fraction = ""] = String(weight).split(".");
  const hundredths = Number(fraction.slice(0, 2).padEnd(2, "0"));
  return (Number(whole) * 100 + hundredths + (fraction.charAt(2) >= "5" ? 1 : 0)) / 100;
};

const writeEdges = (snapshot: ActionFlowGraphSnapshot) => {
  const length = snapshot.vertices.length;
  let text = "";
  for (let from = 0; from < length; from++) {
    for (let to = 0; to < length; to++) {
      const count = snapshot.actionStats[from * length + to];
      if (count > 0) {
        const weight = roundHalfUp(Math.log10(Math.log10(count + 1) + 1));
        text += `${from} -> ${to}[penwidth=${toJavaString(weight)}];\n`;
      } else if (!snapshot.vertices[to].isInitPredicate) {
        text += `${from} -> ${to}[color="green",style=dotted];\n`;
      }
    }
  }
  return text;
};

const getContextLabel = (context: [string, Value][]) =>
  `[${context
    .toReversed()
    .map((binding) => `${binding[0]}->${formatValue(binding[1])}`)
    .join(", ")}]`;

const getActionFlowGraphSnapshot = (
  flow: ActionFlow,
  contexts: "keep" | "reduce",
): ActionFlowGraphSnapshot => {
  const vertices = flow.actions.map((action, id) => ({
    action,
    // SpecProcessor#processConfigSpec marks an initial predicate as one only when it has a name.
    isInitPredicate: id < flow.initCount && isNamedAction(action),
  }));
  if (contexts === "keep") return { vertices, actionStats: flow.actionStats };
  const reduced: ActionVertex[] = [];
  const definitions = new Map<string | undefined, number>();
  const distinctIds = vertices.map((vertex) => {
    const range = vertex.action.location.range;
    const definition = range && formatRange(range);
    const known = definitions.get(definition);
    if (known !== undefined) return known;
    definitions.set(definition, reduced.length);
    reduced.push(vertex);
    return reduced.length - 1;
  });
  const length = vertices.length;
  const actionStats = new Float64Array(reduced.length ** 2);
  for (let origin = 0; origin < length; origin++) {
    for (let next = 0; next < length; next++) {
      actionStats[distinctIds[origin] * reduced.length + distinctIds[next]] +=
        flow.actionStats[origin * length + next];
    }
  }
  return { vertices: reduced, actionStats };
};

const getActionFlowGraphFull = (flow: ActionFlow) => {
  const snapshot = getActionFlowGraphSnapshot(flow, "keep");
  const clusters = new Map<string, number[]>();
  snapshot.vertices.forEach((vertex, id) => {
    const context = getContextLabel(vertex.action.context);
    const cluster = clusters.get(context);
    if (cluster) cluster.push(id);
    else clusters.set(context, [id]);
  });
  let text = DOT_HEADER;
  for (const [context, ids] of getHashMapOrder([...clusters], (cluster) =>
    getJavaHashCode(cluster[0]),
  )) {
    // Java's Math#abs leaves Integer.MIN_VALUE negative.
    text += `subgraph cluster_${Math.abs(getJavaHashCode(context)) | 0} {\ncolor="white"\nlabel="${context}"\n`;
    for (const id of getHashMapOrder(ids, (innerId) => innerId)) {
      text += writeAction(snapshot.vertices[id], id);
    }
    text += "}\n";
  }
  return `${text}${writeEdges(snapshot)}}`;
};

const getActionFlowGraphBasic = (flow: ActionFlow) => {
  const snapshot = getActionFlowGraphSnapshot(flow, "reduce");
  const vertices = snapshot.vertices.map((vertex, id) => writeAction(vertex, id)).join("");
  return `${DOT_HEADER}${vertices}${writeEdges(snapshot)}}`;
};

export const getActionFlowGraph = (flow: ActionFlow) =>
  flow.statistics === "basic" ? getActionFlowGraphBasic(flow) : getActionFlowGraphFull(flow);
