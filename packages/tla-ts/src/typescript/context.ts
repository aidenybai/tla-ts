import ts from "@typescript/typescript6";
import type { Expression, OperatorDefinition, OperatorParam } from "../ast";
import { createNames, type Names } from "./names";
import { apply, define, identifier, ifExpression, index, letExpression, string } from "./tla";

export interface Definition {
  name: string;
  parameters: OperatorParam[];
  readsState: boolean;
}

export interface Context {
  checker: ts.TypeChecker;
  names: Names;
  variables: Map<ts.Symbol, Expression>;
  // Helper functions and constants, compiled when first referenced.
  definitions: Map<ts.Declaration, Definition>;
  // Helpers being compiled or inlined, to detect recursion.
  inProgress: Set<ts.Node>;
  recursive: Set<ts.Declaration>;
  output: OperatorDefinition[];
  // String literals of @symmetric types, which become model values.
  modelValues: Map<string, string>;
  // Model values and helper operators that the spec uses.
  prelude: Set<"Null" | "Undefined" | "Rem" | "Quot">;
  // The calls that the exported function being compiled makes and tla-ts can't compile.
  unknowns: Unknowns | undefined;
}

export interface Unknown {
  name: string;
  domain: Expression;
  node: ts.Node;
}

interface Unknowns {
  owner: ts.Node;
  values: Unknown[];
}

export interface MethodCall extends ts.CallExpression {
  readonly expression: ts.PropertyAccessExpression;
}

export type FunctionNode = ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression;

export type HelperDeclaration = ts.FunctionDeclaration | ts.VariableDeclaration;

export const createContext = (checker: ts.TypeChecker): Context => ({
  checker,
  names: createNames(),
  variables: new Map(),
  definitions: new Map(),
  inProgress: new Set(),
  recursive: new Set(),
  output: [],
  modelValues: new Map(),
  prelude: new Set(),
  unknowns: undefined,
});

export const getSymbol = (node: ts.Node, checker: ts.TypeChecker) => {
  const symbol =
    ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
      ? checker.getShorthandAssignmentValueSymbol(node.parent)
      : checker.getSymbolAtLocation(node);
  return symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
};

export const isMethodCall = (node: ts.Node): node is MethodCall =>
  ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression);

const isTopLevel = (statement: ts.Node): boolean => {
  const parent = statement.parent;
  if (ts.isSourceFile(parent)) return true;
  const namespace = ts.isModuleBlock(parent) ? parent.parent : parent;
  return ts.isModuleDeclaration(namespace) && isTopLevel(namespace);
};

// The declaration of a constant or function at the top level of a module, which becomes a TLA+
// definition.
export const getTopLevelDeclaration = (symbol: ts.Symbol | undefined) => {
  const declaration = symbol?.valueDeclaration;
  if (declaration === undefined) return undefined;
  if (ts.isFunctionDeclaration(declaration) && isTopLevel(declaration)) return declaration;
  const isTopLevelConst =
    ts.isVariableDeclaration(declaration) &&
    ts.isVariableStatement(declaration.parent.parent) &&
    isTopLevel(declaration.parent.parent) &&
    (declaration.parent.flags & ts.NodeFlags.Const) !== 0;
  return isTopLevelConst ? declaration : undefined;
};

// The function a node is, or that a variable declaration initializes.
export const getFunction = (node: ts.Node | undefined): FunctionNode | undefined => {
  if (node === undefined) return undefined;
  if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    return node;
  }
  return ts.isVariableDeclaration(node) ? getFunction(node.initializer) : undefined;
};

// The function that a callee or callback names: one written in place, or one declared elsewhere.
export const getCallee = (node: ts.Expression, context: Context) =>
  getFunction(node) ?? getFunction(getSymbol(node, context.checker)?.valueDeclaration);

export const translateString = (value: string, context: Context) => {
  const modelValue = context.modelValues.get(value);
  return modelValue === undefined ? string(value) : identifier(modelValue);
};

const isTrivial = (value: Expression): boolean =>
  ["Identifier", "Number", "String", "ExceptAt"].includes(value.kind) ||
  (value.kind === "Prime" && isTrivial(value.expression));

export const getUndefined = (context: Context) => {
  context.prelude.add("Undefined");
  return identifier("Undefined");
};

// Binds a value that an expression repeats to a LET definition, so that TLC evaluates it once.
export const share = (
  value: Expression,
  base: string,
  context: Context,
  use: (shared: Expression) => Expression,
) => {
  if (isTrivial(value)) return use(value);
  const name = context.names.getFresh(base);
  return letExpression([define(name, [], value)], use(identifier(name)));
};

export const getElement = (sequence: Expression, position: Expression, context: Context) =>
  share(sequence, "sequence", context, (shared) =>
    share(position, "position", context, (at) =>
      ifExpression(
        apply("\\in", [at, apply("DOMAIN", [shared])]),
        index(shared, [at]),
        getUndefined(context),
      ),
    ),
  );
