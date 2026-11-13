import ts from "@typescript/typescript6";
import {
  type Bound,
  type ExceptPathStep,
  type Expression,
  getChildren,
  type OperatorDefinition,
  type OperatorParam,
  type SourceLocation,
} from "../ast";

export const UNLOCATED: SourceLocation = { line: 0, column: 0 };

export const getModuleName = (fileName: string) =>
  fileName
    .slice(fileName.lastIndexOf("/") + 1)
    .replace(/\.ts$/, "")
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

export const getLocation = (node: ts.Node): SourceLocation => {
  const sourceFile = node.getSourceFile();
  const getPosition = (position: number) => {
    const point = sourceFile.getLineAndCharacterOfPosition(position);
    return { line: point.line + 1, column: point.character + 1 };
  };
  const start = getPosition(node.getStart());
  return {
    ...start,
    range: {
      module: getModuleName(sourceFile.fileName),
      start,
      end: getPosition(Math.max(node.getStart(), node.getEnd() - 1)),
    },
  };
};

export const locate = <T extends Expression>(expression: T, location: SourceLocation): T => {
  if (expression.location !== UNLOCATED) return expression;
  expression.location = location;
  if (expression.kind === "Let") {
    expression.definitions.forEach((definition) => {
      if (definition.location === UNLOCATED) definition.location = location;
    });
  }
  if (expression.kind === "Record" || expression.kind === "RecordSet") {
    expression.fields.forEach((field) => {
      field.location = location;
    });
  }
  getChildren(expression).forEach((child) => locate(child, location));
  return expression;
};

export const identifier = (name: string, location = UNLOCATED): Expression => ({
  kind: "Identifier",
  name,
  location,
});

export const boolean = (value: boolean) => identifier(value ? "TRUE" : "FALSE");

export const number = (value: number): Expression =>
  value < 0
    ? apply("-.", [number(-value)])
    : { kind: "Number", value, text: String(value), location: UNLOCATED };

export const string = (value: string): Expression => ({
  kind: "String",
  value,
  location: UNLOCATED,
});

// The parser reads /\ and \/ as junctions, which short-circuit, as TLC's do.
export const apply = (operator: string, args: Expression[]): Expression =>
  operator === "/\\" || operator === "\\/"
    ? junction(operator === "/\\" ? "And" : "Or", args)
    : { kind: "Apply", operator, args, location: UNLOCATED };

export const not = (expression: Expression) => apply("~", [expression]);

export const junction = (
  kind: "And" | "Or",
  operands: Expression[],
  isBulleted = false,
): Expression => ({ kind, operands, isBulleted, location: UNLOCATED });

export const tuple = (elements: Expression[]): Expression => ({
  kind: "Tuple",
  elements,
  location: UNLOCATED,
});

// The function that maps each entry's key to its value, which is <<>> without entries.
export const functionFrom = (entries: [Expression, Expression][]) =>
  entries.length === 0
    ? tuple([])
    : entries
        .map((entry) => apply(":>", [entry[0], entry[1]]))
        .reduce((left, right) => apply("@@", [left, right]));

export const set = (elements: Expression[]): Expression => ({
  kind: "SetEnumeration",
  elements,
  location: UNLOCATED,
});

export const record = (
  kind: "Record" | "RecordSet",
  fields: { name: string; value: Expression }[],
): Expression => ({
  kind,
  fields: fields.map((field) => ({ ...field, location: UNLOCATED })),
  location: UNLOCATED,
});

export const except = (
  value: Expression,
  updates: { path: ExceptPathStep[]; value: Expression }[],
): Expression => ({ kind: "Except", function: value, updates, location: UNLOCATED });

export const exceptAt = (): Expression => ({ kind: "ExceptAt", location: UNLOCATED });

export const index = (value: Expression, args: Expression[]): Expression => ({
  kind: "FunctionApplication",
  function: value,
  args,
  location: UNLOCATED,
});

export const field = (value: Expression, name: string): Expression => ({
  kind: "FieldAccess",
  record: value,
  field: name,
  location: UNLOCATED,
});

export const ifExpression = (
  condition: Expression,
  consequent: Expression,
  alternative: Expression,
): Expression => ({ kind: "If", condition, consequent, alternative, location: UNLOCATED });

export const letExpression = (definitions: OperatorDefinition[], body: Expression): Expression => ({
  kind: "Let",
  definitions,
  body,
  location: UNLOCATED,
});

export const bound = (name: string, values: Expression): Bound => ({
  pattern: { kind: "Name", name },
  set: values,
});

export const quantify = (
  kind: "Forall" | "Exists",
  bounds: Bound[],
  body: Expression,
): Expression => (bounds.length === 0 ? body : { kind, bounds, body, location: UNLOCATED });

export const choose = (name: string, values: Expression, body: Expression): Expression => ({
  kind: "Choose",
  pattern: { kind: "Name", name },
  set: values,
  body,
  location: UNLOCATED,
});

export const filter = (variable: Bound, predicate: Expression): Expression => ({
  kind: "SetFilter",
  bound: variable,
  predicate,
  location: UNLOCATED,
});

export const map = (expression: Expression, bounds: Bound[]): Expression => ({
  kind: "SetMap",
  expression,
  bounds,
  location: UNLOCATED,
});

export const functionOf = (bounds: Bound[], body: Expression): Expression => ({
  kind: "FunctionConstruction",
  bounds,
  body,
  location: UNLOCATED,
});

export const functionSet = (domain: Expression, range: Expression): Expression => ({
  kind: "FunctionSet",
  domain,
  range,
  location: UNLOCATED,
});

export const product = (factors: Expression[]): Expression => ({
  kind: "Product",
  factors,
  location: UNLOCATED,
});

export const lambda = (params: string[], body: Expression): Expression => ({
  kind: "Lambda",
  params,
  body,
  location: UNLOCATED,
});

export const prime = (expression: Expression): Expression => ({
  kind: "Prime",
  expression,
  location: UNLOCATED,
});

export const unchanged = (expression: Expression): Expression => ({
  kind: "Unchanged",
  expression,
  location: UNLOCATED,
});

export const temporal = (kind: "Always" | "Eventually", expression: Expression): Expression => ({
  kind,
  expression,
  location: UNLOCATED,
});

export const boxAction = (action: Expression, subscript: Expression): Expression => ({
  kind: "BoxAction",
  action,
  subscript,
  location: UNLOCATED,
});

export const fairness = (
  kind: "WeakFairness" | "StrongFairness",
  subscript: Expression,
  action: Expression,
): Expression => ({ kind, subscript, action, location: UNLOCATED });

export const define = (
  name: string,
  params: OperatorParam[],
  body: Expression,
): OperatorDefinition => ({
  kind: "Operator",
  name,
  params,
  body,
  isLocal: false,
  isRecursive: false,
  location: UNLOCATED,
});

export const defineAt = (
  node: ts.Node,
  name: string,
  params: OperatorParam[],
  body: Expression,
): OperatorDefinition => {
  const location = getLocation(node);
  return { ...define(name, params, locate(body, location)), location };
};

export const call = (operator: string, args: Expression[]) =>
  args.length === 0 ? identifier(operator) : apply(operator, args);
