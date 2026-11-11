import type { PrintedRegion, Span } from "../../../tla-ts/src/typescript/regions";
import type { PrintedSpec } from "../compile-worker";
import type { GraphEdge, GraphNode, ViewFile, ViewLocation } from "@/model";
import { getPreviewCount } from "./domain";

const CONFIG_ROLES = new Map([
  ["INVARIANTS", "invariant"],
  ["PROPERTIES", "property"],
  ["CONSTRAINTS", "constraint"],
  ["ACTION_CONSTRAINTS", "action constraint"],
  ["VIEW", "view"],
  ["POSTCONDITIONS", "postcondition"],
]);

const NODE_KINDS = new Map<PrintedRegion["kind"], GraphNode["kind"]>([
  ["init", "init"],
  ["action", "action"],
  ["next", "next"],
  ["predicate", "check"],
  ["property", "check"],
  ["definition", "definition"],
]);

const createLocator = (text: string) => {
  const lineStarts = [0, ...[...text.matchAll(/\n/g)].map((match) => match.index + 1)];
  const getPosition = (index: number) => {
    const line = lineStarts.findLastIndex((start) => start <= index);
    return { line: line + 1, column: index - (lineStarts[line] ?? 0), index };
  };
  return (span: Span): ViewLocation => ({
    start: getPosition(span.start),
    end: getPosition(span.end),
  });
};

const contains = (outer: Span, inner: Span) => outer.start <= inner.start && inner.end <= outer.end;

const getText = (text: string, span: Span) => text.slice(span.start, span.end);

const getNameSpan = (text: string, span: Span, name: string): Span | undefined => {
  const match = new RegExp(`\\b${name}\\b`).exec(getText(text, span));
  return match === null
    ? undefined
    : { start: span.start + match.index, end: span.start + match.index + name.length };
};

const getRoles = (config: string) =>
  new Map(
    config.split("\n").flatMap((line) => {
      const [keyword = "", ...names] = line.split(" ");
      const role = CONFIG_ROLES.get(keyword);
      return role === undefined ? [] : names.map((name) => [name, role] as const);
    }),
  );

// A check's region covers `export const name = () => test;`, and its test is the arrow's body.
const getTestSpan = (source: string, span: Span): Span => {
  const arrow = getText(source, span).indexOf("=>");
  if (arrow === -1) return span;
  const body = getText(source, span).slice(arrow + 2);
  const start = span.start + arrow + 2 + (body.length - body.trimStart().length);
  return { start, end: source[span.end - 1] === ";" ? span.end - 1 : span.end };
};

const summarizeTypes = (types: string[]) => {
  const count = getPreviewCount(types);
  const shown = types.slice(0, count).join(" | ");
  return count < types.length ? `${shown} … +${types.length - count}` : shown;
};

const getUnique = <Value>(values: Value[]) => [...new Set(values)];

const formatList = (verb: string, names: string[]) =>
  names.length === 0 ? [] : [`${verb} ${names.join(", ")}`];

// Uses of each state variable in the module, except record fields such as `.name` and `name |->`.
const getModuleUses = (module: string, names: Set<string>) =>
  [...module.matchAll(/"(?:[^"\\]|\\.)*"|\\\*.*|\(\*[\s\S]*?\*\)|[A-Za-z_]\w*/g)].flatMap(
    (match) =>
      names.has(match[0]) &&
      module[match.index - 1] !== "." &&
      !/^\s*\|->/.test(module.slice(match.index + match[0].length))
        ? [{ name: match[0], span: { start: match.index, end: match.index + match[0].length } }]
        : [],
  );

export const buildViewFile = (file: string, source: string, spec: PrintedSpec): ViewFile => {
  const getSourceLocation = createLocator(source);
  const getModuleLocation = createLocator(spec.source);
  const references = spec.regions.filter(
    (region) => region.kind === "read" || region.kind === "write",
  );
  const roles = getRoles(spec.config);
  const getNames = (span: Span, kind: PrintedRegion["kind"]) =>
    getUnique(
      references
        .filter((reference) => reference.kind === kind && contains(span, reference.source))
        .map((reference) => reference.name),
    );

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const addNode = (node: Omit<GraphNode, "loc" | "anchor">, span: Span, anchor?: Span) => {
    const getLocation = node.pane === "code" ? getSourceLocation : getModuleLocation;
    nodes.push({
      ...node,
      loc: getLocation(span),
      anchor: anchor === undefined ? undefined : getLocation(anchor),
    });
  };

  // Each use of a state variable links to the uses with the same name and priming in the TLA+ of
  // the declaration around it. Uses come first, so the pointer finds them before their region.
  const enclosingRegions = spec.regions.filter(
    (region) => NODE_KINDS.has(region.kind) && region.kind !== "next",
  );
  const uses = getModuleUses(spec.source, new Set(spec.variables.map((variable) => variable.name)));
  const useLabels = new Map<number, string>();
  references.forEach((reference, index) => {
    const region = enclosingRegions
      .filter((candidate) => contains(candidate.source, reference.source))
      .toSorted(
        (left, right) =>
          left.source.end - left.source.start - (right.source.end - right.source.start),
      )[0];
    if (region === undefined) return;
    const isWrite = reference.kind === "write";
    const label = `${isWrite ? "writes" : "reads"} ${reference.name} in ${region.name}`;
    const targets = uses.filter(
      (use) =>
        use.name === reference.name &&
        contains(region.output, use.span) &&
        (spec.source[use.span.end] === "'") === isWrite &&
        !/UNCHANGED\s*(<<[^>]*)?$/.test(spec.source.slice(region.output.start, use.span.start)),
    );
    if (targets.length === 0) return;
    const id = `code:${reference.kind}:${index}`;
    addNode(
      { id, pane: "code", kind: isWrite ? "write" : "read", name: reference.name, label },
      reference.source,
    );
    for (const target of targets) {
      if (!useLabels.has(target.span.start)) useLabels.set(target.span.start, label);
      edges.push({ from: id, to: `module:use:${target.span.start}` });
    }
  });
  for (const use of uses) {
    const label = useLabels.get(use.span.start);
    if (label === undefined) continue;
    const isWrite = spec.source[use.span.end] === "'";
    addNode(
      {
        id: `module:use:${use.span.start}`,
        pane: "module",
        kind: isWrite ? "write" : "read",
        name: use.name,
        label,
      },
      use.span,
    );
  }

  const getLabel = (region: PrintedRegion): string => {
    const variable = spec.variables.find((candidate) => candidate.name === region.name);
    if (region.kind === "variable" && variable !== undefined) {
      const writers = spec.regions.filter(
        (candidate) =>
          candidate.kind === "action" && getNames(candidate.source, "write").includes(region.name),
      ).length;
      return [
        `${region.name}: ${summarizeTypes(variable.types)}`,
        ...(variable.initial === undefined ? [] : [`starts at ${variable.initial}`]),
        writers === 0 ? "never written" : `written by ${writers} action${writers === 1 ? "" : "s"}`,
      ].join(" · ");
    }
    if (region.kind === "action") {
      return [
        `action ${getText(spec.source, region.output).split(" ==")[0]}`,
        ...formatList("writes", getNames(region.source, "write")),
      ].join(" · ");
    }
    if (region.kind === "init") return `initial value of ${region.name}`;
    if (region.kind === "next") return `${region.name} is a step of Next`;
    const role = roles.get(region.name);
    return role === undefined
      ? `definition ${region.name}`
      : [`${role} ${region.name}`, ...formatList("reads", getNames(region.source, "read"))].join(
          " · ",
        );
  };

  // Each declaration in the TypeScript links to the TLA+ it compiles to. Next has no TypeScript of
  // its own, so each of its steps links from the action it names.
  spec.regions.forEach((region, index) => {
    const kind = region.kind === "variable" ? "variable" : NODE_KINDS.get(region.kind);
    if (kind === undefined) return;
    const shared = { kind, name: region.name, label: getLabel(region) };
    const id = `code:${region.kind}:${region.name}`;
    const moduleId = `module:${region.kind}:${index}`;
    addNode(
      { ...shared, id: moduleId, pane: "module" },
      region.output,
      getNameSpan(spec.source, region.output, region.name),
    );
    if (region.kind === "next") {
      edges.push({ from: `code:action:${region.name}`, to: moduleId });
      return;
    }
    addNode(
      { ...shared, id, pane: "code" },
      kind === "check" ? getTestSpan(source, region.source) : region.source,
      getNameSpan(source, region.source, region.name),
    );
    edges.push({ from: id, to: moduleId });
  });

  return {
    file,
    source,
    module: { file: `${spec.name}.tla`, source: spec.source },
    config: spec.config,
    modules: spec.modules,
    nodes,
    edges,
  };
};
