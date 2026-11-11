import ts from "@typescript/typescript6";
import {
  type Context,
  findNodes,
  type FunctionNode,
  getFunction,
  getSymbol,
  hasObjectLiteral,
  type HelperDeclaration,
  isHeapClass,
  isHeapFunction,
  isInlined,
  isScript,
} from "./context";
import type { Expression } from "../ast";
import { getWritten, getWrittenRoots } from "./actions";
import { TlaTypeScriptError } from "../errors";
import { getAllocated } from "./heap";
import { VALUE_TAGS } from "./properties";
import { getLocation, identifier, set } from "./tla";
import { getKind } from "./types";

export interface Variable {
  name: string;
  symbol: ts.Symbol;
  declaration: ts.VariableDeclaration | ts.ClassDeclaration | ts.FunctionDeclaration;
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

// A let is a state variable, and so is a const in a script with a heap that makes an object, as
// only statements can make objects, and a script's const whose value the script changes in place.
const isLet = (declared: Declared, changed: ReadonlySet<ts.Symbol>, context: Context) => {
  const declaration = declared.declaration;
  const symbol = getSymbol(declared.identifier, context.checker);
  return (
    ts.isVariableDeclaration(declaration) &&
    ((declaration.parent.flags & ts.NodeFlags.Const) === 0 ||
      !ts.isIdentifier(declaration.name) ||
      (symbol !== undefined && changed.has(symbol)) ||
      (context.heap !== undefined &&
        declaration.initializer !== undefined &&
        (hasObjectLiteral(declaration.initializer) ||
          getAllocated(declaration.initializer, context).length > 0))) &&
    !isInlined(declaration.initializer, context)
  );
};

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

export const isDeclaration = (statement: ts.Statement) =>
  isInertClass(statement) ||
  ts.isModuleDeclaration(statement) ||
  ts.isImportDeclaration(statement) ||
  ts.isTypeAliasDeclaration(statement) ||
  ts.isInterfaceDeclaration(statement) ||
  ts.isEnumDeclaration(statement) ||
  // A re-export, like an import, only loads the module it names.
  (ts.isExportDeclaration(statement) &&
    (statement.isTypeOnly || statement.moduleSpecifier !== undefined)) ||
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
// Imported holds the statements of the files that the model imports, which run first.
export const readModel = (
  sourceFile: ts.SourceFile,
  imported: readonly ts.Statement[],
  context: Context,
): Model => {
  const statements = sourceFile.statements;
  const tags = new Map(statements.map((statement) => [statement, getTags(statement)]));
  const symmetrySets = statements
    .filter(
      (statement): statement is ts.TypeAliasDeclaration =>
        ts.isTypeAliasDeclaration(statement) && tags.get(statement)?.has("symmetric") === true,
    )
    .map((statement) => declareModelValues(statement, context));
  const declarations = statements.flatMap(getDeclarations);
  const changed = new Set(
    isScript(sourceFile)
      ? [sourceFile, ...imported]
          .flatMap((root) =>
            findNodes(root, (node): node is ts.Node => getWritten(node) !== undefined),
          )
          .flatMap((node) => {
            const written = getWritten(node);
            return written === undefined ? [] : getWrittenRoots(written);
          })
          .flatMap((root) => {
            const symbol = ts.isIdentifier(root) ? getSymbol(root, context.checker) : undefined;
            return symbol !== undefined && getKind(root, context) !== "object" ? [symbol] : [];
          })
      : [],
  );
  // An imported file's variable that changes is state as the model's own is, which its file may
  // export, as an importer reads the same binding.
  const variables = [...imported.flatMap(getDeclarations), ...declarations].flatMap((declared) => {
    const declaration = declared.declaration;
    if (!isLet(declared, changed, context) || !ts.isVariableDeclaration(declaration)) return [];
    const symbol = getSymbol(declared.identifier, context.checker);
    const isImported = declaration.getSourceFile() !== sourceFile;
    if ((isExported(declaration) && !isImported) || symbol === undefined) {
      throw new TlaTypeScriptError("State variables can't be exported", declaration);
    }
    if (context.variables.has(symbol)) return [];
    const name = context.names.getFresh(declared.name);
    context.variables.set(symbol, identifier(name, getLocation(declared.identifier)));
    return [{ name, symbol, declaration }];
  });
  const isHeapDeclaration = (
    statement: ts.Statement,
  ): statement is ts.ClassDeclaration | ts.FunctionDeclaration =>
    (ts.isClassDeclaration(statement) && isHeapClass(statement, context)) ||
    (ts.isFunctionDeclaration(statement) && isHeapFunction(statement, context));
  const classes = statements.flatMap((statement) => {
    if (!isHeapDeclaration(statement)) return [];
    const symbol = statement.name && getSymbol(statement.name, context.checker);
    if (statement.name === undefined || symbol === undefined) return [];
    const name = context.names.getFresh(statement.name.text);
    context.variables.set(symbol, identifier(name, getLocation(statement.name)));
    return [{ name, symbol, declaration: statement }];
  });
  const helpers = declarations.filter((declared) => !isLet(declared, changed, context));
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
    variables: [...variables, ...classes],
    // A script makes its functions before it runs, so they come first.
    script: [
      ...imported,
      ...statements.filter(
        (statement) => ts.isFunctionDeclaration(statement) && isHeapDeclaration(statement),
      ),
      ...statements.filter(
        (statement) =>
          !isDeclaration(statement) ||
          (ts.isClassDeclaration(statement) && isHeapDeclaration(statement)),
      ),
    ],
    exported: exported.map((definition) => ({
      ...definition,
      name: context.names.getFresh(definition.name),
    })),
    topLevel: new Map(helpers.map((declared) => [declared.name, declared.declaration])),
    symmetrySets,
    isDeadlockChecked: ![...tags.values()].some((statementTags) => statementTags.has("noDeadlock")),
  };
};
