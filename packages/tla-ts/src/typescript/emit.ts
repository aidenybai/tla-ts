import ts from "@typescript/typescript6";
import { getAssignedRoot } from "./actions";
import { type Context, getSymbol } from "./context";
import { TlaTypeScriptError } from "../errors";
import type { Model } from "./model";

export interface Emitted {
  name: string;
  text: string;
  node: ts.Node;
}

// The parts of a spec and its config, in the order that the model declares them.
export interface Sections {
  init: Emitted[];
  actions: Emitted[];
  next: Emitted[];
  fairness: string[];
  predicates: Emitted[];
  temporal: Emitted[];
  invariants: string[];
  properties: string[];
  constraints: string[];
  actionConstraints: string[];
  views: string[];
  postconditions: string[];
  assumptions: string[];
}

export interface Span {
  start: number;
  end: number;
}

export type RegionKind =
  | "variable"
  | "read"
  | "write"
  | "init"
  | "action"
  | "next"
  | "predicate"
  | "property"
  | "definition";

// A span of the TypeScript and the span of the module it compiles to. Regions with the same name
// belong to one state variable or definition.
export interface Region {
  kind: RegionKind;
  name: string;
  source: Span;
  output: Span;
}

export interface CompiledSpec {
  name: string;
  source: string;
  config: string;
  regions: Region[];
}

interface Linked extends Emitted {
  kind: RegionKind;
}

type Part = string | Linked;

const REM =
  "Rem(a, b) ==\n  LET m == IF b < 0 THEN -b ELSE b\n  IN  IF a >= 0 THEN a % m ELSE -((-a) % m)";

const QUOT =
  "Quot(a, b) ==\n  LET q == (IF a < 0 THEN -a ELSE a) \\div (IF b < 0 THEN -b ELSE b)\n  IN  IF (a < 0) = (b < 0) THEN q ELSE -q";

export const createSections = (): Sections => ({
  init: [],
  actions: [],
  next: [],
  fairness: [],
  predicates: [],
  temporal: [],
  invariants: [],
  properties: [],
  constraints: [],
  actionConstraints: [],
  views: [],
  postconditions: [],
  assumptions: [],
});

const link = (kind: RegionKind, items: Emitted[]) =>
  items.map((item): Linked => ({ ...item, kind }));

const formatConjunction = (items: Part[]) =>
  items.length === 1 ? [" ", items[0]] : items.flatMap((item) => ["\n  /\\ ", item]);

const formatDisjunction = (items: Part[]) =>
  items.length === 0
    ? [" FALSE"]
    : items.length === 1
      ? [" ", items[0]]
      : items.flatMap((item) => ["\n  \\/ ", item]);

const formatConfigSection = (keyword: string, values: string[]) =>
  values.length > 0 ? [`${keyword} ${values.join(" ")}`] : [];

const getText = (part: Part) => (typeof part === "string" ? part : part.text);

// A top-level declaration's region covers its statement, as in `export const step = ...;`.
const getSpan = (node: ts.Node): Span => {
  const statement =
    ts.isVariableDeclaration(node) &&
    ts.isVariableDeclarationList(node.parent) &&
    node.parent.declarations.length === 1 &&
    ts.isVariableStatement(node.parent.parent)
      ? node.parent.parent
      : node;
  return { start: statement.getStart(), end: statement.end };
};

const getRegions = (parts: Part[]) => {
  const regions: Region[] = [];
  let offset = 0;
  for (const part of parts) {
    const end = offset + getText(part).length;
    if (typeof part !== "string") {
      regions.push({
        kind: part.kind,
        name: part.name,
        source: getSpan(part.node),
        output: { start: offset, end },
      });
    }
    offset = end;
  }
  return regions;
};

const isAssigned = (node: ts.Node, ancestor: ts.Node | undefined): boolean =>
  ancestor !== undefined &&
  (getAssignedRoot(ancestor) === node || isAssigned(node, ancestor.parent));

// Each use of a state variable in the TypeScript, linked to where the module declares it.
const getReferences = (node: ts.Node, declared: Map<string, Span>, context: Context): Region[] => {
  const isReference =
    ts.isIdentifier(node) && !(ts.isVariableDeclaration(node.parent) && node.parent.name === node);
  const symbol = isReference ? getSymbol(node, context.checker) : undefined;
  const name = symbol === undefined ? undefined : context.variables.get(symbol);
  const output = name === undefined ? undefined : declared.get(name);
  if (name === undefined || output === undefined) {
    return node.getChildren().flatMap((child) => getReferences(child, declared, context));
  }
  return [
    {
      kind: isAssigned(node, node.parent) ? "write" : "read",
      name,
      source: { start: node.getStart(), end: node.end },
      output,
    },
  ];
};

export const emit = (
  moduleName: string,
  sourceFile: ts.SourceFile,
  model: Model,
  sections: Sections,
  context: Context,
): CompiledSpec => {
  if (sections.views.length > 1) throw new TlaTypeScriptError("Tag only one function @view");
  const recursive = [...context.recursive].map((declaration) => {
    const definition = context.definitions.get(declaration);
    if (definition === undefined || definition.parameters.length === 0) {
      throw new TlaTypeScriptError("A constant can't refer to itself", declaration);
    }
    return `${definition.name}(${definition.parameters.map(() => "_").join(", ")})`;
  });
  const prelude = context.prelude;
  const constants = [
    ...(prelude.has("Null") ? ["Null"] : []),
    ...(prelude.has("Undefined") ? ["Undefined"] : []),
    ...context.modelValues.values(),
  ];
  const variables = link(
    "variable",
    model.variables.map((variable) => ({
      name: variable.name,
      text: variable.name,
      node: variable.declaration.name,
    })),
  );
  const symmetrySets = model.symmetrySets;
  const lines: Part[][] = [
    [`---- MODULE ${moduleName} ----`],
    ["EXTENDS Integers, Sequences, FiniteSets, TLC"],
    ...(constants.length > 0 ? [[`CONSTANTS ${constants.join(", ")}`]] : []),
    ...(variables.length > 0
      ? [
          [
            "VARIABLES ",
            ...variables.flatMap((variable, index) => [index > 0 ? ", " : "", variable]),
          ],
        ]
      : []),
    [`vars == <<${variables.map(getText).join(", ")}>>`],
    ...(recursive.length > 0 ? [[`RECURSIVE ${recursive.join(", ")}`]] : []),
    ...(prelude.has("Rem") ? [[REM]] : []),
    ...(prelude.has("Quot") ? [[QUOT]] : []),
    ...link("definition", context.output).map((definition) => [definition]),
    [
      "Init ==",
      ...formatConjunction(sections.init.length > 0 ? link("init", sections.init) : ["TRUE"]),
    ],
    ...link("action", sections.actions).map((action) => [action]),
    ["Next ==", ...formatDisjunction(link("next", sections.next))],
    ["Spec ==", ...formatConjunction(["Init", "[][Next]_vars", ...sections.fairness])],
    ...link("predicate", sections.predicates).map((predicate) => [predicate]),
    ...link("property", sections.temporal).map((property) => [property]),
    ...sections.assumptions.map((assumption) => [`ASSUME ${assumption}`]),
    ...(symmetrySets.length > 0
      ? [[`Perms == ${symmetrySets.map((set) => `Permutations(${set})`).join(" \\cup ")}`]]
      : []),
    ["===="],
  ];
  const parts = lines.flatMap((line, index) => (index === 0 ? line : ["\n", ...line]));
  const regions = getRegions(parts);
  const declared = new Map(
    regions
      .filter((region) => region.kind === "variable")
      .map((region) => [region.name, region.output]),
  );
  const config = [
    "SPECIFICATION Spec",
    ...(constants.length > 0
      ? ["CONSTANTS", ...constants.map((constant) => `  ${constant} = ${constant}`)]
      : []),
    ...formatConfigSection("INVARIANTS", sections.invariants),
    ...formatConfigSection("PROPERTIES", sections.properties),
    ...formatConfigSection("CONSTRAINTS", sections.constraints),
    ...formatConfigSection("ACTION_CONSTRAINTS", sections.actionConstraints),
    ...formatConfigSection("VIEW", sections.views),
    ...formatConfigSection("POSTCONDITIONS", sections.postconditions),
    ...(symmetrySets.length > 0 ? ["SYMMETRY Perms"] : []),
    ...(model.isDeadlockChecked ? [] : ["CHECK_DEADLOCK FALSE"]),
  ].join("\n");
  return {
    name: moduleName,
    source: parts.map(getText).join(""),
    config,
    regions: [...regions, ...getReferences(sourceFile, declared, context)],
  };
};
