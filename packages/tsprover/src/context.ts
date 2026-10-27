import ts from "typescript";
import type { Names } from "./names";

export interface Definition {
  name: string;
  // The operator's parameters, written as TLA+ declares them, such as "x" or "F(_)".
  parameters: string[];
  readsState: boolean;
}

export interface Context {
  checker: ts.TypeChecker;
  names: Names;
  variables: Map<ts.Symbol, string>;
  // Helper functions and constants, compiled when first referenced.
  definitions: Map<ts.Declaration, Definition>;
  inProgress: Set<ts.Declaration>;
  recursive: Set<ts.Declaration>;
  // Rendered definitions, each after the definitions it uses.
  output: string[];
  // String literals of @symmetric types, which become model values.
  modelValues: Map<string, string>;
  // Model values and helper operators that the spec uses.
  prelude: Set<"Null" | "Undefined" | "Rem" | "Quot">;
}

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

export const getTypeName = (type: ts.Type) => type.getSymbol()?.getName();

export const isSetType = (type: ts.Type) =>
  ["Set", "ReadonlySet"].includes(getTypeName(type) ?? "");

export const isMapType = (type: ts.Type) =>
  ["Map", "ReadonlyMap"].includes(getTypeName(type) ?? "");

// Arrays, tuples, and unions of them, such as [] | [number] | [number, number].
export const isSequenceType = (type: ts.Type, checker: ts.TypeChecker): boolean =>
  type.isUnion()
    ? type.types.every((member) => isSequenceType(member, checker))
    : checker.isArrayType(type) || checker.isTupleType(type);

export const getTypeArguments = (type: ts.Type, checker: ts.TypeChecker) =>
  type.flags & ts.TypeFlags.Object && (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference
    ? checker.getTypeArguments(type as ts.TypeReference)
    : [];
