import ts from "@typescript/typescript6";
import {
  type Context,
  type FunctionNode,
  getFunction,
  getSymbol,
  type HelperDeclaration,
} from "./context";
import type { Expression } from "../ast";
import { TlaTypeScriptError } from "../errors";
import { VALUE_TAGS } from "./properties";
import { getLocation, identifier, set } from "./tla";

export interface Variable {
  name: string;
  symbol: ts.Symbol;
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
  identifier: ts.Identifier;
}

export interface Model {
  variables: Variable[];
  script: ts.Statement[];
  exported: Exported[];
  // Top-level functions and constants by their TypeScript names, which @leadsTo refers to.
  topLevel: Map<string, HelperDeclaration>;
  // The model values of each @symmetric type, as a TLA+ set.
  symmetrySets: Expression[];
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

const isExported = (node: HelperDeclaration) =>
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 &&
  ts.isSourceFile(ts.isVariableDeclaration(node) ? node.parent.parent.parent : node.parent);

const isLet = (declared: Declared) =>
  ts.isVariableDeclaration(declared.declaration) &&
  ((declared.declaration.parent.flags & ts.NodeFlags.Const) === 0 ||
    !ts.isIdentifier(declared.declaration.name)) &&
  getFunction(declared.declaration) === undefined;

// The string literals of a @symmetric type become model values, which TLC can permute.
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
    return identifier(name);
  });
  return set(names);
};

const isName = (node: ts.Expression): boolean =>
  ts.isIdentifier(node) || (ts.isPropertyAccessExpression(node) && isName(node.expression));

const isInertClass = (statement: ts.Statement) =>
  ts.isClassDeclaration(statement) &&
  (statement.heritageClauses ?? []).every((clause) =>
    clause.types.every((type) => isName(type.expression)),
  ) &&
  !statement.members.some(
    (member) =>
      ts.isClassStaticBlockDeclaration(member) ||
      (member.name !== undefined && ts.isComputedPropertyName(member.name)) ||
      (ts.isPropertyDeclaration(member) &&
        member.initializer !== undefined &&
        (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static) !== 0),
  );

const isDeclaration = (statement: ts.Statement) =>
  isInertClass(statement) ||
  ts.isModuleDeclaration(statement) ||
  ts.isImportDeclaration(statement) ||
  ts.isTypeAliasDeclaration(statement) ||
  ts.isInterfaceDeclaration(statement) ||
  ts.isEnumDeclaration(statement) ||
  (ts.isExportDeclaration(statement) && statement.isTypeOnly) ||
  (ts.isFunctionDeclaration(statement) && statement.body !== undefined);

// The functions and constants a statement declares.
const getDeclarations = (statement: ts.Statement): Declared[] => {
  if (ts.isModuleDeclaration(statement)) {
    const body = statement.body;
    if (body === undefined) return [];
    if (ts.isModuleDeclaration(body)) return getDeclarations(body);
    if (!ts.isModuleBlock(body)) return [];
    return body.statements.flatMap((inner) => {
      const isConst =
        ts.isVariableStatement(inner) && (inner.declarationList.flags & ts.NodeFlags.Const) !== 0;
      if (!isDeclaration(inner) && !isConst) {
        throw new TlaTypeScriptError(`Unsupported statement: ${inner.getText()}`, inner);
      }
      return getDeclarations(inner);
    });
  }
  if (ts.isFunctionDeclaration(statement) && statement.body !== undefined) {
    if (statement.name === undefined) throw new TlaTypeScriptError("Name this function", statement);
    return [{ name: statement.name.text, declaration: statement, identifier: statement.name }];
  }
  if (!ts.isVariableStatement(statement)) return [];
  return statement.declarationList.declarations.flatMap((declaration) =>
    getBoundNames(declaration.name).map((identifier) => ({
      name: identifier.text,
      declaration,
      identifier,
    })),
  );
};

const getBoundNames = (name: ts.BindingName): ts.Identifier[] =>
  ts.isIdentifier(name)
    ? [name]
    : name.elements.flatMap((element) =>
        ts.isOmittedExpression(element) ? [] : getBoundNames(element.name),
      );

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
    const symbol = getSymbol(declared.identifier, context.checker);
    if (isExported(declaration) || symbol === undefined) {
      throw new TlaTypeScriptError("State variables can't be exported", declaration);
    }
    if (context.variables.has(symbol)) return [];
    const name = context.names.getFresh(declared.name);
    context.variables.set(symbol, identifier(name, getLocation(declared.identifier)));
    return [{ name, symbol, declaration }];
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
    script: statements.filter((statement) => !isDeclaration(statement)),
    exported: exported.map((definition) => ({
      ...definition,
      name: context.names.getFresh(definition.name),
    })),
    topLevel: new Map(helpers.map((declared) => [declared.name, declared.declaration])),
    symmetrySets,
    isDeadlockChecked: ![...tags.values()].some((statementTags) => statementTags.has("noDeadlock")),
  };
};
