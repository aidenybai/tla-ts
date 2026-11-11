import ts from "@typescript/typescript6";
import {
  type Declaration,
  type Definition,
  type Expression,
  getChildren,
  type Module,
  type OperatorDefinition,
  type SourceRange,
} from "../ast";
import { parseModule } from "../parser";
import { printModule } from "../printer";
import { type Context, getSymbol } from "./context";
import type { CompiledSpec } from "./emit";
import type { Model } from "./model";

export interface Span {
  start: number;
  end: number;
}

export type RegionKind =
  | "variable"
  | "reference"
  | "init"
  | "action"
  | "next"
  | "predicate"
  | "property"
  | "definition";

// A span of the TypeScript and the part of the module it compiles to. Regions with the same name
// belong to one state variable or definition.
export interface Region {
  kind: RegionKind;
  name: string;
  source: Span;
  output: Declaration | Definition | Expression;
}

export interface PrintedRegion {
  kind: RegionKind;
  name: string;
  source: Span;
  output: Span;
}

export interface Link {
  kind: RegionKind;
  name: string;
  node: ts.Node;
  output: OperatorDefinition | Expression;
}

// Records that output compiles from node, and returns output.
export const link = <Output extends OperatorDefinition | Expression>(
  context: Context,
  kind: RegionKind,
  name: string,
  node: ts.Node,
  output: Output,
) => {
  context.links.push({ kind, name, node, output });
  return output;
};

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

// Each use of a state variable in the TypeScript, linked to where the module declares it.
const getReferences = (
  node: ts.Node,
  declarations: Map<string, Declaration>,
  context: Context,
): Region[] => {
  const isReference =
    ts.isIdentifier(node) && !(ts.isVariableDeclaration(node.parent) && node.parent.name === node);
  const symbol = isReference ? getSymbol(node, context.checker) : undefined;
  const name = symbol === undefined ? undefined : context.variables.get(symbol);
  const output = name?.kind === "Identifier" ? declarations.get(name.name) : undefined;
  if (name?.kind !== "Identifier" || output === undefined) {
    const references: Region[] = [];
    ts.forEachChild(node, (child) => {
      references.push(...getReferences(child, declarations, context));
    });
    return references;
  }
  return [
    {
      kind: "reference",
      name: name.name,
      source: { start: node.getStart(), end: node.end },
      output,
    },
  ];
};

export const getRegions = (
  source: Module,
  sourceFile: ts.SourceFile,
  model: Model,
  context: Context,
) => {
  const definitions = new Map(
    source.definitions.map((definition) => [definition.name, definition]),
  );
  const declarations = new Map(
    source.variables.map((declaration) => [declaration.name, declaration]),
  );
  return [
    ...model.variables.flatMap((variable): Region[] => {
      const output = declarations.get(variable.name);
      return output === undefined
        ? []
        : [
            {
              kind: "variable",
              name: variable.name,
              source: getSpan(variable.declaration.name ?? variable.declaration),
              output,
            },
          ];
    }),
    ...context.links.flatMap((entry): Region[] => {
      // emit copies each definition into the module, which keeps its name.
      const output =
        entry.output.kind === "Operator" ? definitions.get(entry.output.name) : entry.output;
      return output === undefined
        ? []
        : [{ kind: entry.kind, name: entry.name, source: getSpan(entry.node), output }];
    }),
    ...getReferences(sourceFile, declarations, context),
  ];
};

// The range of each expression in the module where the printed module has it. The printer lays
// out the text, and parsing it back gives the same module, now with the ranges of the text.
const locateExpressions = (
  expression: Expression,
  printed: Expression,
  ranges: Map<object, SourceRange>,
) => {
  // An expression can appear twice, as an action's call does in Next and in a fairness condition,
  // so the first place wins.
  if (printed.location.range !== undefined && !ranges.has(expression)) {
    ranges.set(expression, printed.location.range);
  }
  const children = getChildren(printed);
  getChildren(expression).forEach((child, index) => {
    if (index < children.length) locateExpressions(child, children[index], ranges);
  });
};

// The printed module, with the span of the text that each region compiles to.
export const printRegions = (spec: CompiledSpec) => {
  const source = spec.source;
  const text = printModule(source);
  const printed = parseModule(text);
  const ranges = new Map<object, SourceRange>();
  const printedDefinitions = new Map(
    printed.definitions.map((definition) => [definition.name, definition]),
  );
  for (const definition of source.definitions) {
    const match = printedDefinitions.get(definition.name);
    if (match?.location.range === undefined) continue;
    ranges.set(definition, match.location.range);
    if (definition.kind === "Operator" && match.kind === "Operator") {
      locateExpressions(definition.body, match.body, ranges);
    }
  }
  source.variables.forEach((declaration, index) => {
    const range = printed.variables[index]?.location.range;
    if (range !== undefined) ranges.set(declaration, range);
  });
  const lineStarts = [0, ...[...text.matchAll(/\n/g)].map((match) => match.index + 1)];
  const getOffset = (location: { line: number; column: number }) =>
    lineStarts[location.line - 1] + location.column - 1;
  return {
    text,
    regions: spec.regions.flatMap((region): PrintedRegion[] => {
      const range = ranges.get(region.output);
      return range === undefined
        ? []
        : [{ ...region, output: { start: getOffset(range.start), end: getOffset(range.end) + 1 } }];
    }),
  };
};
