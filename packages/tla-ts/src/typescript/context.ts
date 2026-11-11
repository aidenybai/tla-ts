import ts from "@typescript/typescript6";
import { createNames, type Names } from "./names";

export interface Definition {
  name: string;
  parameters: string[];
  readsState: boolean;
}

export interface Context {
  checker: ts.TypeChecker;
  names: Names;
  variables: Map<ts.Symbol, string>;
  definitions: Map<ts.Declaration, Definition>;
  inProgress: Set<ts.Node>;
  recursive: Set<ts.Declaration>;
  output: string[];
  modelValues: Map<string, string>;
  prelude: Set<"Null" | "Undefined" | "Rem" | "Quot">;
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

export const getFunction = (node: ts.Node | undefined): FunctionNode | undefined => {
  if (node === undefined) return undefined;
  if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    return node;
  }
  return ts.isVariableDeclaration(node) ? getFunction(node.initializer) : undefined;
};

export const getCallee = (node: ts.Expression, context: Context) =>
  getFunction(node) ?? getFunction(getSymbol(node, context.checker)?.valueDeclaration);

export const translateString = (value: string, context: Context) =>
  context.modelValues.get(value) ?? JSON.stringify(value);

const isTrivial = (value: string) => /^(@|[A-Za-z_]\w*'?|-?\d+|"[^"\\]*")$/.test(value);

export const share = (
  value: string,
  base: string,
  context: Context,
  use: (shared: string) => string,
) => {
  if (isTrivial(value)) return use(value);
  const name = context.names.getFresh(base);
  return `(LET ${name} == ${value} IN ${use(name)})`;
};
