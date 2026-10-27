import ts from "typescript";
import { createNames, type Names } from "./names";

export interface Definition {
  name: string;
  // The operator's parameters as TLA+ declares them, such as "x" or "F(_)".
  parameters: string[];
  readsState: boolean;
}

export interface Context {
  checker: ts.TypeChecker;
  names: Names;
  variables: Map<ts.Symbol, string>;
  // Helper functions and constants, compiled when first referenced.
  definitions: Map<ts.Declaration, Definition>;
  // Helpers being compiled or inlined, to detect recursion.
  inProgress: Set<ts.Node>;
  recursive: Set<ts.Declaration>;
  // Rendered definitions, each after the definitions it uses.
  output: string[];
  // String literals of @symmetric types, which become model values.
  modelValues: Map<string, string>;
  // Model values and helper operators that the spec uses.
  prelude: Set<"Null" | "Undefined" | "Rem" | "Quot">;
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

// The declaration of a constant or function at the top level of a module, which becomes a TLA+
// definition.
export const getTopLevelDeclaration = (symbol: ts.Symbol | undefined) => {
  const declaration = symbol?.valueDeclaration;
  if (declaration === undefined) return undefined;
  if (ts.isFunctionDeclaration(declaration) && ts.isSourceFile(declaration.parent)) {
    return declaration;
  }
  const isTopLevelConst =
    ts.isVariableDeclaration(declaration) &&
    ts.isVariableStatement(declaration.parent.parent) &&
    ts.isSourceFile(declaration.parent.parent.parent) &&
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

export const translateString = (value: string, context: Context) =>
  context.modelValues.get(value) ?? JSON.stringify(value);
