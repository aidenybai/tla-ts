import ts from "@typescript/typescript6";
import { translateScript, writesState } from "./actions";
import { rejectSharing } from "./aliasing";
import { type Context, createContext } from "./context";
import { type CompiledSpec, createSections, emit, type Sections } from "./emit";
import { render } from "./formula";
import { translateBody } from "./functions";
import { findHeapArrays, translateConstantFunctions } from "./heap";
import { translateBuiltIns } from "./intrinsics";
import { WELL_KNOWN_SYMBOLS } from "./javascript";
import { type Exported, type Model, readModel, type Variable } from "./model";
import { createProgram } from "./program";
import { link } from "./regions";
import { translateCall, translateInvariant, translateProperty, VALUE_TAGS } from "./properties";
import { createStateScope } from "./scope";
import { TlaTypeScriptError } from "../errors";
import { translateStep } from "./steps";
import { apply, define, getLocation, getModuleName, identifier, locate, tuple } from "./tla";
import { getDomain } from "./types";

const isScript = (sourceFile: ts.SourceFile) =>
  sourceFile.statements.every(
    (statement) =>
      !ts.canHaveModifiers(statement) ||
      !(ts.getModifiers(statement) ?? []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ),
  );

// A state variable starts at its initializer, or at every value of its type without one.
const translateInitial = (variable: Variable, context: Context) => {
  const declaration = variable.declaration;
  const name = context.variables.get(variable.symbol);
  if (name === undefined || !ts.isVariableDeclaration(declaration)) {
    throw new TlaTypeScriptError("Unknown variable", declaration);
  }
  const initializer = declaration.initializer;
  if (initializer === undefined) {
    const type = context.checker.getTypeAtLocation(declaration.name);
    return locate(
      apply("\\in", [name, getDomain(type, declaration, context)]),
      getLocation(declaration),
    );
  }
  const value = translateBody(initializer, createStateScope(context), context);
  return locate(apply("=", [name, value]), getLocation(declaration));
};

// An exported function is a property if a tag says so, an action if it changes state, and an
// invariant if it returns a boolean.
const translateExported = (
  definition: Exported,
  model: Model,
  sections: Sections,
  context: Context,
) => {
  const tag = [...definition.tags.keys()].find((candidate) => VALUE_TAGS.has(candidate));
  if (tag !== undefined) return translateProperty(definition, tag, model, sections, context);
  if (writesState(definition.body, context)) {
    return translateStep(definition, sections, context);
  }
  const returnType = context.checker.getSignatureFromDeclaration(definition.node)?.getReturnType();
  if (
    returnType === undefined ||
    (returnType.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)) !== 0
  ) {
    return translateStep(definition, sections, context);
  }
  return returnType.flags & ts.TypeFlags.BooleanLike
    ? translateInvariant(definition, sections, context)
    : translateCall(definition, sections, context);
};

// Compiles a TypeScript file into a TLA+ spec and the config that checks it. Imports resolve
// relative to fileName, and the module takes its name, so die-hard.ts is the module DieHard.
// Without a file system, as in a browser, libraries holds TypeScript's declaration files by name.
export const compile = (
  source: string,
  fileName = "spec.ts",
  libraries?: ReadonlyMap<string, string>,
): CompiledSpec => {
  const path = fileName.replaceAll("\\", "/");
  const program = createProgram(source, path, libraries);
  const context = createContext(program.checker);
  const sourceFile = program.sourceFile;
  // A script, with no exported functions, gives the objects and classes it makes, or reads through
  // Object or hasOwnProperty, identity with a heap. The heap binds to the symbol of lib's PropertyKey type,
  // which no value can have.
  const heap = program.checker
    .getSymbolsInScope(sourceFile, ts.SymbolFlags.TypeAlias)
    .find((symbol) => symbol.name === "PropertyKey");
  const usesObjects = (node: ts.Node): boolean =>
    ts.isObjectLiteralExpression(node) ||
    (ts.isClassLike(node) && node.heritageClauses === undefined) ||
    (ts.isPropertyAccessExpression(node) &&
      ((ts.isIdentifier(node.expression) && node.expression.text === "Object") ||
        node.name.text === "hasOwnProperty")) ||
    (ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ["Boolean", "Number", "String"].includes(node.expression.text)) ||
    (ts.isIdentifier(node) &&
      ["arguments", "Symbol", "Promise", "setTimeout"].includes(node.text)) ||
    node.kind === ts.SyntaxKind.AsyncKeyword ||
    (ts.forEachChild(node, usesObjects) ?? false);
  if (heap !== undefined && isScript(sourceFile) && usesObjects(sourceFile)) {
    context.heap = heap;
    context.variables.set(heap, identifier(context.names.getFresh("heap")));
    const usesSpecialNumbers = (node: ts.Node): boolean =>
      (ts.isIdentifier(node) &&
        ["NaN", "Infinity", "POSITIVE_INFINITY", "NEGATIVE_INFINITY"].includes(node.text)) ||
      (ts.isPrefixUnaryExpression(node) &&
        node.operator === ts.SyntaxKind.MinusToken &&
        ts.isNumericLiteral(node.operand) &&
        Number(node.operand.text) === 0) ||
      // Division may give an infinity or -0.
      (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.SlashToken) ||
      (ts.forEachChild(node, usesSpecialNumbers) ?? false);
    context.hasSpecialNumbers = usesSpecialNumbers(sourceFile);
    context.heapArrays = findHeapArrays(sourceFile, context);
    const prototypes = new Set(["Array.prototype", "Object.prototype"]);
    const changesPrototype = (node: ts.Node): boolean =>
      (ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.getText() === "Object" &&
        node.expression.name.text.startsWith("define") &&
        prototypes.has(node.arguments.at(0)?.getText() ?? "")) ||
      (ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        (ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left)) &&
        prototypes.has(node.left.expression.getText())) ||
      (ts.forEachChild(node, changesPrototype) ?? false);
    context.hasInheritedElements = changesPrototype(sourceFile);
    const getSymbolCalls = (node: ts.Node): number =>
      node
        .getChildren()
        .reduce(
          (count, child) => count + getSymbolCalls(child),
          ts.isCallExpression(node) && ["Symbol", "Symbol.for"].includes(node.expression.getText())
            ? 1
            : 0,
        );
    // The built-in objects hold properties that the well-known symbols key. Each call of Symbol
    // may make a few symbols, as where a loop or a function runs it again.
    context.symbols = [
      ...WELL_KNOWN_SYMBOLS,
      ...Array.from({ length: 4 * getSymbolCalls(sourceFile) }, () => ""),
    ].map((name) =>
      context.names.getFresh(`Symbol${name.charAt(0).toUpperCase()}${name.slice(1)}`),
    );
  }
  const model = readModel(sourceFile, context);
  rejectSharing(program.sourceFile, context);
  // A using declaration disposes nothing where it holds only null or undefined.
  const isNothing = (node: ts.Expression | undefined) =>
    node !== undefined &&
    (node.kind === ts.SyntaxKind.NullKeyword ||
      (ts.isIdentifier(node) && node.text === "undefined") ||
      (ts.isArrayLiteralExpression(node) && node.elements.length === 0));
  const findUsing = (node: ts.Node): ts.Node | undefined =>
    ts.isVariableDeclarationList(node) &&
    (node.flags & ts.NodeFlags.Using) !== 0 &&
    !(ts.isForOfStatement(node.parent)
      ? isNothing(node.parent.expression)
      : node.declarations.every((declaration) => isNothing(declaration.initializer)))
      ? node
      : ts.forEachChild(node, findUsing);
  const using = findUsing(program.sourceFile);
  if (using !== undefined) {
    throw new TlaTypeScriptError("tla-ts can't dispose what a using declaration holds", using);
  }
  const sections = createSections();
  sections.init.push(
    ...(context.heap === undefined &&
    model.script.every(
      (statement) =>
        ts.isVariableStatement(statement) &&
        statement.declarationList.declarations.every((declaration) =>
          ts.isIdentifier(declaration.name),
        ),
    )
      ? model.variables.map((variable) =>
          link(
            context,
            "init",
            variable.name,
            variable.declaration,
            translateInitial(variable, context),
          ),
        )
      : [
          locate(
            render(translateScript(model.script, model.exported.length === 0, context)),
            getLocation(model.script[0] ?? sourceFile),
          ),
        ]),
  );
  for (const definition of model.exported) translateExported(definition, model, sections, context);
  if (context.prelude.has("JavaScript")) {
    context.output.push(
      define(
        "UsedBuiltIns",
        [],
        context.heap === undefined ? tuple([]) : translateBuiltIns(sourceFile, context),
      ),
      define("UsedConstantFunctions", [], translateConstantFunctions(context)),
      define("UsedSymbols", [], tuple(context.symbols.map((name) => identifier(name)))),
    );
  }
  return emit(getModuleName(path), program.sourceFile, model, sections, context);
};
