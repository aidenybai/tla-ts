import ts from "typescript";
import {
  type Context,
  type FunctionNode,
  getFunction,
  getSymbol,
  type HelperDeclaration,
} from "./context";
import { TsproverError } from "./errors";
import { VALUE_TAGS } from "./properties";

export interface Variable {
  name: string;
  declaration: ts.VariableDeclaration;
}

// An exported function, which becomes an action, an invariant, or a property its tag names.
export interface Exported {
  name: string;
  declaration: HelperDeclaration;
  node: FunctionNode;
  body: ts.ConciseBody;
  tags: Map<string, string>;
}

interface Declared {
  name: string;
  declaration: HelperDeclaration;
}

export interface Model {
  variables: Variable[];
  exported: Exported[];
  // Top-level functions and constants by their TypeScript names, which @leadsTo refers to.
  topLevel: Map<string, HelperDeclaration>;
  // The model values of each @symmetric type, as a TLA+ set.
  symmetrySets: string[];
  isDeadlockChecked: boolean;
}

const KNOWN_TAGS = new Set([
  ...VALUE_TAGS,
  "fair",
  "strongFair",
  "symmetric",
  "noDeadlock",
  "param",
  "returns",
  "return",
  "example",
  "see",
  "deprecated",
  "remarks",
  "throws",
  "link",
  "description",
]);

const getTags = (node: ts.Node) =>
  new Map(
    ts.getJSDocTags(node).map((tag) => {
      if (!KNOWN_TAGS.has(tag.tagName.text)) {
        throw new TsproverError(`Unknown tag: @${tag.tagName.text}`, tag);
      }
      return [tag.tagName.text, ts.getTextOfJSDocComment(tag.comment)?.trim() ?? ""];
    }),
  );

const isExported = (node: ts.Declaration) =>
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;

const isLet = (declared: Declared) =>
  ts.isVariableDeclaration(declared.declaration) &&
  (declared.declaration.parent.flags & ts.NodeFlags.Let) !== 0;

// The string literals of a @symmetric type become model values, which TLC can permute.
const declareModelValues = (statement: ts.TypeAliasDeclaration, context: Context) => {
  const type = context.checker.getTypeAtLocation(statement.name);
  const names = (type.isUnion() ? type.types : [type]).map((member) => {
    if (!member.isStringLiteral()) {
      throw new TsproverError("A @symmetric type must be a union of strings", statement);
    }
    const name = context.names.getFresh(member.value);
    if (name !== member.value) {
      throw new TsproverError(`"${member.value}" can't name a TLA+ model value`, statement);
    }
    context.modelValues.set(member.value, name);
    return name;
  });
  return `{${names.join(", ")}}`;
};

// The functions and constants a statement declares. Types and imports declare none.
const getDeclarations = (statement: ts.Statement): Declared[] => {
  if (
    ts.isImportDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isEnumDeclaration(statement) ||
    (ts.isExportDeclaration(statement) && statement.isTypeOnly)
  ) {
    return [];
  }
  if (ts.isFunctionDeclaration(statement) && statement.name !== undefined && statement.body) {
    return [{ name: statement.name.text, declaration: statement }];
  }
  if (!ts.isVariableStatement(statement)) {
    throw new TsproverError(`Unsupported statement: ${statement.getText()}`, statement);
  }
  const flags = statement.declarationList.flags;
  return statement.declarationList.declarations.map((declaration) => {
    if (!ts.isIdentifier(declaration.name)) {
      throw new TsproverError("Declare one name at a time", declaration);
    }
    if ((flags & (ts.NodeFlags.Let | ts.NodeFlags.Const)) === 0) {
      throw new TsproverError("Use let for state and const for everything else", declaration);
    }
    return { name: declaration.name.text, declaration };
  });
};

// Reads a model's state variables, exported functions, and tags, and names them in TLA+.
export const readModel = (sourceFile: ts.SourceFile, context: Context): Model => {
  const statements = sourceFile.statements;
  const tags = new Map(statements.map((statement) => [statement, getTags(statement)]));
  const symmetrySets = statements
    .filter(
      (statement): statement is ts.TypeAliasDeclaration =>
        ts.isTypeAliasDeclaration(statement) && tags.get(statement)?.has("symmetric") === true,
    )
    .map((statement) => declareModelValues(statement, context));
  const declarations = statements.flatMap(getDeclarations);
  const variables = declarations.flatMap((declared) => {
    const declaration = declared.declaration;
    if (!isLet(declared) || !ts.isVariableDeclaration(declaration)) return [];
    const symbol = getSymbol(declaration.name, context.checker);
    if (isExported(declaration) || symbol === undefined) {
      throw new TsproverError("State variables can't be exported", declaration);
    }
    const name = context.names.getFresh(declared.name);
    context.variables.set(symbol, name);
    return [{ name, declaration }];
  });
  const helpers = declarations.filter((declared) => !isLet(declared));
  const exported = helpers.flatMap((declared) => {
    const declaration = declared.declaration;
    const node = getFunction(declaration);
    if (!isExported(declaration) || node?.body === undefined) return [];
    const statement = ts.isVariableDeclaration(declaration)
      ? declaration.parent.parent
      : declaration;
    return [{ ...declared, node, body: node.body, tags: tags.get(statement) ?? new Map() }];
  });
  return {
    variables,
    exported: exported.map((definition) => ({
      ...definition,
      name: context.names.getFresh(definition.name),
    })),
    topLevel: new Map(helpers.map((declared) => [declared.name, declared.declaration])),
    symmetrySets,
    isDeadlockChecked: ![...tags.values()].some((statementTags) => statementTags.has("noDeadlock")),
  };
};
