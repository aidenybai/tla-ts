import ts from "@typescript/typescript6";
import {
  type Context,
  type FunctionNode,
  getFunction,
  getSymbol,
  type HelperDeclaration,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { VALUE_TAGS } from "./properties";

export interface Variable {
  name: string;
  declaration: ts.VariableDeclaration;
}

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
  topLevel: Map<string, HelperDeclaration>;
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
        throw new TlaTypeScriptError(`Unknown tag: @${tag.tagName.text}`, tag);
      }
      return [tag.tagName.text, ts.getTextOfJSDocComment(tag.comment)?.trim() ?? ""];
    }),
  );

const isExported = (node: ts.Declaration) =>
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;

const isLet = (declared: Declared) =>
  ts.isVariableDeclaration(declared.declaration) &&
  (declared.declaration.parent.flags & ts.NodeFlags.Let) !== 0;

const declareModelValues = (statement: ts.TypeAliasDeclaration, context: Context) => {
  const type = context.checker.getTypeAtLocation(statement.name);
  const names = (type.isUnion() ? type.types : [type]).map((member) => {
    if (!member.isStringLiteral()) {
      throw new TlaTypeScriptError("A @symmetric type must be a union of strings", statement);
    }
    const name = context.names.getFresh(member.value);
    if (name !== member.value) {
      throw new TlaTypeScriptError(`"${member.value}" can't name a TLA+ model value`, statement);
    }
    context.modelValues.set(member.value, name);
    return name;
  });
  return `{${names.join(", ")}}`;
};

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
    throw new TlaTypeScriptError(`Unsupported statement: ${statement.getText()}`, statement);
  }
  const flags = statement.declarationList.flags;
  return statement.declarationList.declarations.map((declaration) => {
    if (!ts.isIdentifier(declaration.name)) {
      throw new TlaTypeScriptError("Declare one name at a time", declaration);
    }
    if ((flags & (ts.NodeFlags.Let | ts.NodeFlags.Const)) === 0) {
      throw new TlaTypeScriptError("Use let for state and const for everything else", declaration);
    }
    return { name: declaration.name.text, declaration };
  });
};

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
      throw new TlaTypeScriptError("State variables can't be exported", declaration);
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
    return [
      {
        name: context.names.getFresh(declared.name),
        declaration,
        node,
        body: node.body,
        tags: tags.get(statement) ?? new Map(),
      },
    ];
  });
  return {
    variables,
    exported,
    topLevel: new Map(helpers.map((declared) => [declared.name, declared.declaration])),
    symmetrySets,
    isDeadlockChecked: ![...tags.values()].some((statementTags) => statementTags.has("noDeadlock")),
  };
};
