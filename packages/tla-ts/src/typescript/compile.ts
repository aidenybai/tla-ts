import ts from "@typescript/typescript6";
import {
  findDispatchedCallees,
  findEffects,
  getWritten,
  getWrittenRoots,
  summarizeEffects,
  translateScript,
  writesState,
} from "./actions";
import { findSharing, getReached, isMakingNode, isMakingObjects, rejectSharing } from "./aliasing";
import { findMakers } from "./reach-graph";
import {
  type Closure,
  type Context,
  type FunctionNode,
  createContext,
  createDispatch,
  findCalleeRuns,
  findNodes,
  findFunctionCandidates,
  findFileAccessors,
  findHeapCode,
  findObjectTargets,
  findSharedFunctionCandidates,
  findOnlyCalled,
  isReached,
  findOnceFunctions,
  findValueEnums,
  findOnceLocals,
  getCallee,
  getFunction,
  getRunStatements,
  getSymbol,
  getTopLevelDeclaration,
  hasObjectMembers,
  isClosure,
  isOutliving,
  isInertValue,
  isImportCall,
  isScript,
  isTopLevel,
  rejectArgumentsVarReads,
  rejectSloppyGlobalWrites,
  isVarFunction,
  getValueDeclaration,
} from "./context";
import { type CompiledSpec, createSections, emit, type Sections } from "./emit";
import { getBinary, getNumberValue, isRawTemplate, MATH_OPERATORS } from "./expressions";
import { render } from "./formula";
import { translateBody } from "./functions";
import {
  findChangedArrays,
  findMadeCollections,
  findCollectionProxies,
  findHeapArrays,
  isArrayLengthening,
  isHoleyArray,
  isThrownArray,
  isPrototypeArray,
  rejectRegExpIndicesUses,
  translateConstantFunctions,
} from "./heap";
import {
  findCheckedGlobals,
  findGeneratorPrototypes,
  getBuiltIn,
  getCodePoint,
  getStoredBuiltIn,
  translateBuiltIns,
  translateSearches,
} from "./intrinsics";
import { WELL_KNOWN_SYMBOLS } from "./javascript";
import { type Exported, isDeclaration, type Model, readModel, type Variable } from "./model";
import {
  findNamespaces,
  getDynamicImports,
  isLiteralValue,
  rejectRunningModules,
} from "./namespaces";
import { createProgram, isTypeImport, type Library } from "./program";
import { findResolverHolders } from "./promises";
import {
  getJsonPath,
  getRequires,
  hasSpecialJsonNumbers,
  isCommonJsFile,
  isNodeModule,
  rejectCommonJsImport,
  rejectJsonImport,
  rejectWrapperUses,
} from "./common-js";
import { link } from "./regions";
import { translateCall, translateInvariant, translateProperty, VALUE_TAGS } from "./properties";
import { createStateScope } from "./scope";
import { translateSourceTexts } from "./source-text";
import { classifySharedHelpers } from "./shared-calls";
import { TlaTypeScriptError } from "../errors";
import { getUnlistedParameter, translateStep } from "./steps";
import { TIME_ZONES } from "./time-zones";
import { DATE_FORMATS } from "./date-formats";
import {
  apply,
  boolean,
  define,
  getLocation,
  getModuleName,
  identifier,
  locate,
  number,
  record,
  string,
  tuple,
} from "./tla";
import { BUILT_INS } from "./built-ins";
import { isEsModule, NATIVE_ERRORS } from "./exceptions";
import {
  getDomain,
  getKeptIterator,
  getKind,
  getWrappedThis,
  isBufferName,
  isCollectionName,
  isFractionKey,
  isHeapSetOrMap,
  isRegExpArray,
  isSetOrMapType,
  isUntold,
  TYPED_ARRAYS,
} from "./types";

const NORMAL_FORMS = ["NFC", "NFD", "NFKC", "NFKD"];

// The most code units of a literal whose escapes tla-ts tells the codes of. A longer one, such as a
// string of every code point in a range, may hold more than the module can list.
const LONG_LITERAL = 1024;

// The symbols that a call of Symbol which may run again makes at most.
const REPEATED_SYMBOLS = 128;

// The fewest digits that give a number back, without its sign, and the power of 10 of the first,
// as Number::toString finds them, which toExponential writes where a call gives no digits.
const getShortestFields = (value: number) => {
  const shortest = /^(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(Math.abs(value).toExponential());
  return [
    { name: "shortest", value: string(`${shortest?.[1]}${shortest?.[2] ?? ""}`) },
    { name: "shortestExponent", value: number(Number(shortest?.[3])) },
  ];
};

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

const getTag = (definition: Exported) =>
  [...definition.tags.keys()].find((candidate) => VALUE_TAGS.has(candidate));

// Whether an exported function is an action: one that changes state or returns nothing.
const isStepExport = (definition: Exported, context: Context) => {
  if (writesState(definition.body, context)) return true;
  const returnType = context.checker.getSignatureFromDeclaration(definition.node)?.getReturnType();
  return (
    returnType === undefined ||
    (returnType.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)) !== 0
  );
};

// Whether every call of a function throws, or never returns: a function that isn't async or a
// generator, whose body returns nowhere and ends in a throw.
const isAlwaysThrowing = (node: FunctionNode) => {
  const body = node.body;
  const isReturning = (inner: ts.Node): boolean =>
    ts.isReturnStatement(inner) ||
    (!ts.isFunctionLike(inner) && (ts.forEachChild(inner, isReturning) ?? false));
  return (
    body !== undefined &&
    ts.isBlock(body) &&
    node.asteriskToken === undefined &&
    !(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) &&
    body.statements.length > 0 &&
    ts.isThrowStatement(body.statements[body.statements.length - 1]) &&
    !isReturning(body)
  );
};

// Why the model calls no exported function: Node runs only a module's top level, so an export runs
// only where TLC can choose its arguments, which it can't where a parameter takes values that
// tla-ts can't list, and where a call of it may return.
const getUncalledReason = (definition: Exported, context: Context) => {
  if (getTag(definition) !== undefined) return undefined;
  const parameter = getUnlistedParameter(definition, isStepExport(definition, context), context);
  if (parameter !== undefined) {
    return `its parameter ${parameter.name.getText()} takes values it can't list`;
  }
  return definition.node.parameters.length === 0 && isAlwaysThrowing(definition.node)
    ? "every call of it throws"
    : undefined;
};

// An exported function is a property if a tag says so, an action if it changes state, and an
// invariant if it returns a boolean.
const translateExported = (
  definition: Exported,
  model: Model,
  sections: Sections,
  context: Context,
) => {
  const tag = getTag(definition);
  if (tag !== undefined) return translateProperty(definition, tag, model, sections, context);
  if (isStepExport(definition, context)) return translateStep(definition, sections, context);
  const returnType = context.checker.getSignatureFromDeclaration(definition.node)?.getReturnType();
  return returnType !== undefined && returnType.flags & ts.TypeFlags.BooleanLike
    ? translateInvariant(definition, sections, context)
    : translateCall(definition, sections, context);
};

// The state variable that a statement counts up or down by one, from a whole number that its
// declaration gives, which never fails and gives a new value at each step until TLC's integers
// overflow.
const getCounted = (statement: ts.Statement, context: Context) => {
  const expression = ts.isExpressionStatement(statement) ? statement.expression : undefined;
  const target =
    expression !== undefined &&
    (ts.isPrefixUnaryExpression(expression) || ts.isPostfixUnaryExpression(expression)) &&
    (expression.operator === ts.SyntaxKind.PlusPlusToken ||
      expression.operator === ts.SyntaxKind.MinusMinusToken)
      ? expression.operand
      : expression !== undefined &&
          ts.isBinaryExpression(expression) &&
          (expression.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken ||
            expression.operatorToken.kind === ts.SyntaxKind.MinusEqualsToken) &&
          ts.isNumericLiteral(expression.right) &&
          Number(expression.right.text) === 1
        ? expression.left
        : undefined;
  const symbol =
    target !== undefined && ts.isIdentifier(target)
      ? getSymbol(target, context.checker)
      : undefined;
  const declaration = getValueDeclaration(symbol, context);
  const initializer =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : undefined;
  const start =
    initializer !== undefined &&
    ts.isPrefixUnaryExpression(initializer) &&
    initializer.operator === ts.SyntaxKind.MinusToken
      ? initializer.operand
      : initializer;
  return symbol !== undefined &&
    context.variables.has(symbol) &&
    start !== undefined &&
    ts.isNumericLiteral(start) &&
    Number.isSafeInteger(Number(start.text))
    ? target
    : undefined;
};

// Where every action only counts state variables, and the model checks nothing, nothing can fail,
// and an action that counts reaches a new state at each step, so the check would visit states until
// memory runs out, or as TLC does, until its integers overflow.
const rejectEndlessCount = (model: Model, sections: Sections, context: Context) => {
  const checks = [
    sections.invariants,
    sections.properties,
    sections.constraints,
    sections.actionConstraints,
    sections.views,
    sections.postconditions,
    sections.assumptions,
  ];
  const isInertStatement = (statement: ts.Statement) =>
    (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) ||
    (ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.every(
        (declaration) =>
          declaration.initializer === undefined || isInertValue(declaration.initializer),
      ));
  if (checks.some((check) => check.length > 0) || !model.script.every(isInertStatement)) return;
  // An action with parameters may have none to take, which leaves it disabled.
  const counts = model.exported.map((definition) =>
    definition.node.parameters.length > 0
      ? [undefined]
      : ts.isBlock(definition.body)
        ? definition.body.statements.map((statement) => getCounted(statement, context))
        : [getCounted(ts.factory.createExpressionStatement(definition.body), context)],
  );
  const counted = counts.flat().at(0);
  if (counted === undefined || counts.some((count) => count.includes(undefined))) return;
  throw new TlaTypeScriptError(
    `tla-ts can't check a model whose states never end: an action counts ${counted.getText()} on at each step, and the model checks nothing that could stop it`,
    counted,
  );
};

// Compiles a TypeScript file into a TLA+ spec and the config that checks it. Imports resolve
// relative to fileName, and the module takes its name, so die-hard.ts is the module DieHard.
// Without a file system, as in a browser, library holds TypeScript's declaration files, which
// createLibrary parses once.
// Where the CLI runs a script in Node's place, isNodeScript has the script report a throw or a
// rejection that nothing handles with the text Node prints.
// The operators that convert their operands to numbers, which may give NaN.
const NAN_OPERATORS = new Set([
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.PercentToken,
  ts.SyntaxKind.LessThanLessThanToken,
  ts.SyntaxKind.GreaterThanGreaterThanToken,
  ts.SyntaxKind.AmpersandToken,
  ts.SyntaxKind.BarToken,
  ts.SyntaxKind.CaretToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
]);

// An argument that a built-in takes as a value, such as a Set's key or an array's element, rather
// than as a callback that it calls, whose declared type has call signatures.
const isBuiltInValueArgument = (node: ts.Expression, checker: ts.TypeChecker) => {
  const call = node.parent;
  if (!ts.isCallExpression(call) && !ts.isNewExpression(call)) return false;
  const position = call.arguments?.indexOf(node) ?? -1;
  const declaration =
    position < 0 ? undefined : checker.getResolvedSignature(call)?.getDeclaration();
  const parameters = declaration?.parameters ?? [];
  const parameter = parameters[position] ?? parameters.at(-1);
  const type =
    parameter?.type === undefined ? undefined : checker.getTypeFromTypeNode(parameter.type);
  const members = type === undefined ? [] : type.isUnion() ? type.types : [type];
  return (
    declaration !== undefined &&
    declaration.getSourceFile().isDeclarationFile &&
    type !== undefined &&
    members.every((member) => member.getCallSignatures().length === 0)
  );
};

export const compile = (
  source: string,
  fileName = "spec.ts",
  library?: Library,
  isNodeScript = false,
  // The paths of the scripts that run before the model, in order, with which it shares its global
  // scope as a page's scripts do.
  scripts: readonly string[] = [],
): CompiledSpec => {
  const path = fileName.replaceAll("\\", "/");
  const program = createProgram(source, path, library, scripts);
  const context = createContext(
    program.checker,
    program.files,
    program.implicitGlobals,
    program.defaultLibraries,
    program.nodes,
  );
  context.resolverHolders = program.files.map((file) => findResolverHolders(file, context));
  // Only a model that imports files asks which of their declarations make objects before the
  // heap is known.
  context.makers =
    program.files.length > 1
      ? findMakers(context.nodes, context.reachGraph, (node) => isMakingNode(node, context))
      : undefined;
  if (isScript(program.sourceFile)) {
    const onceFunctions = findOnceFunctions(program.files, context);
    context.onceFunctions = new Set(onceFunctions);
    context.onceLocals = findOnceLocals(onceFunctions, program.checker);
  }
  program.files.forEach((file) => {
    rejectSloppyGlobalWrites(file, context);
    rejectArgumentsVarReads(file, context);
  });
  const sourceFile = program.sourceFile;
  // The files that the model loads, each once it has run, and the statements of them all, with the
  // model's own, in the order they run: an ES module's after those of the modules it imports, and a
  // CommonJS module's each after those of the modules that its requires load as it starts. A
  // require that may run later only reads the exports of a module that has started: one that
  // started before the require, or, in a function that its module declares, before the module.
  const visited = new Set<ts.SourceFile>();
  const jsonModules = new Map<string, ts.Node>();
  const files: ts.SourceFile[] = [];
  const statements: ts.Statement[] = [];
  const getImportedFile = (statement: ts.Statement) => {
    // TypeScript erases a declaration that imports or exports only types.
    const specifier =
      (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly !== true) ||
      (ts.isExportDeclaration(statement) && !statement.isTypeOnly)
        ? statement.moduleSpecifier
        : undefined;
    const imported = specifier && program.checker.getSymbolAtLocation(specifier)?.valueDeclaration;
    return imported !== undefined && ts.isSourceFile(imported) && !imported.isDeclarationFile
      ? imported
      : undefined;
  };
  const load = (file: ts.SourceFile) => {
    if (visited.has(file)) return;
    const started = new Set(visited);
    visited.add(file);
    if (isCommonJsFile(file)) {
      rejectWrapperUses(file, program.checker);
      getRequires(file, program.checker).forEach((entry) => {
        entry.requires.forEach((required) => {
          // JSON runs no code, so it loads the same wherever it does.
          if (typeof required.file === "string") {
            jsonModules.set(required.file, required.call);
            return;
          }
          if (!isCommonJsFile(required.file)) {
            throw new TlaTypeScriptError(
              "tla-ts can't require an ES module, which Node gives as an object of its exports",
              required.call,
            );
          }
          if (required.isCertain) {
            load(required.file);
            return;
          }
          const isStarted = required.isHoisted
            ? started.has(required.file) || required.file === file
            : visited.has(required.file);
          if (!isStarted) {
            throw new TlaTypeScriptError(
              "tla-ts can't tell when this require loads its module, which nothing loaded before",
              required.call,
            );
          }
        });
        statements.push(entry.statement);
      });
    } else {
      file.statements.forEach((statement) => {
        const specifier =
          ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)
            ? statement.moduleSpecifier
            : undefined;
        if (
          specifier !== undefined &&
          ts.isStringLiteral(specifier) &&
          isNodeModule(specifier.text) &&
          !isTypeImport(specifier)
        ) {
          throw new TlaTypeScriptError(
            `tla-ts can't load Node's built-in module ${specifier.text}`,
            specifier,
          );
        }
        const imported = getImportedFile(statement);
        const json =
          imported === undefined && specifier !== undefined ? getJsonPath(specifier) : undefined;
        if (json !== undefined) {
          rejectJsonImport(statement);
          jsonModules.set(json, statement);
        }
        if (imported !== undefined && isCommonJsFile(imported)) {
          rejectCommonJsImport(statement, imported);
        }
        if (imported !== undefined) load(imported);
      });
      statements.push(...getRunStatements(file));
    }
    if (file !== sourceFile) files.push(file);
  };
  // The scripts run in order before the model, as a page runs its scripts.
  scripts.forEach((script) => {
    const file = program.files.find((inner) => inner.fileName === script);
    if (file !== undefined) load(file);
  });
  load(sourceFile);
  // The modules that only an import() of a string loads, which run after those the model imports.
  const loaded = files.length;
  getDynamicImports(sourceFile, program.checker).forEach(load);
  rejectRunningModules(files.slice(loaded));
  context.commonJsModules = [...visited].filter(isCommonJsFile);
  context.jsonModules = jsonModules;
  // A CommonJS model's statements run where its requires run the modules, and an ES module's after
  // the statements of all the modules it loads.
  const positions = new Map(
    (isCommonJsFile(sourceFile)
      ? statements
      : [
          ...statements.filter((statement) => statement.getSourceFile() !== sourceFile),
          ...getRunStatements(sourceFile),
        ]
    ).map((statement, position) => [statement, position]),
  );
  // The files in the order they run, the model's last.
  const order = [...files, sourceFile];
  const getDeclaration = (node: ts.Node) => {
    const symbol = program.checker.getSymbolAtLocation(node);
    return symbol === undefined
      ? undefined
      : getValueDeclaration(
          symbol.flags & ts.SymbolFlags.Alias ? program.checker.getAliasedSymbol(symbol) : symbol,
          context,
        );
  };
  context.namespaces = findNamespaces(sourceFile, files, context);
  context.valueEnums = findValueEnums(order, program.checker);
  // A file that imports reads an export through a module's namespace object as the module's
  // binding where tla-ts makes no namespace object for the module. It reads a default export of an
  // expression or of a class with no name, whose binding tla-ts doesn't make uninitialized, only
  // where the module that declares it ran first.
  const rejectModuleReads = (node: ts.Node, file: ts.SourceFile): void => {
    const declaration = ts.isIdentifier(node) ? getDeclaration(node) : undefined;
    if (
      declaration !== undefined &&
      !ts.isNamespaceImport(node.parent) &&
      !ts.isNamespaceExport(node.parent) &&
      !ts.isImportSpecifier(node.parent) &&
      !ts.isImportClause(node.parent) &&
      !ts.isExportSpecifier(node.parent) &&
      ts.findAncestor(node, ts.isTypeNode) === undefined
    ) {
      const parent = node.parent;
      const namespace =
        ts.isPropertyAccessExpression(parent) && parent.name === node
          ? getDeclaration(parent.expression)
          : undefined;
      const isImported =
        ((program.checker.getSymbolAtLocation(node)?.flags ?? 0) & ts.SymbolFlags.Alias) !== 0 ||
        (namespace !== undefined &&
          ts.isSourceFile(namespace) &&
          !context.namespaces.has(namespace.getSourceFile()));
      if (
        isImported &&
        (ts.isExportAssignment(declaration) ||
          (ts.isClassDeclaration(declaration) && declaration.name === undefined)) &&
        order.indexOf(declaration.getSourceFile()) >= order.indexOf(file)
      ) {
        throw new TlaTypeScriptError(
          `tla-ts can't read the default export ${node.getText()} before its module runs`,
          node,
        );
      }
    }
    ts.forEachChild(node, (child) => rejectModuleReads(child, file));
  };
  order
    .filter((file) => file.statements.some(ts.isImportDeclaration))
    .forEach((file) => rejectModuleReads(file, file));
  // The bindings that the namespace objects take, which their modules make as they run.
  const exported = [...context.namespaces.values()].flatMap((namespace) =>
    namespace.exports.flatMap((entry) => (ts.isSourceFile(entry.value) ? [] : [entry.value])),
  );
  // The code units outside ASCII that the script's text holds, or that the escapes of its literals
  // other than long ones and of its names write, whose codes the module tells. A lone surrogate is
  // half of a pair, as a module's text holds only whole characters.
  const texts = [sourceFile, ...files].map((file) => file.text);
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteralLike(node) && node.text.length > LONG_LITERAL) {
      context.longLiterals.add(node.text);
      return;
    }
    if (
      ts.isLiteralExpression(node) ||
      ts.isTemplateLiteralToken(node) ||
      ts.isIdentifier(node) ||
      ts.isPrivateIdentifier(node)
    ) {
      texts.push(node.text);
    }
    // The characters that decodeURI, decodeURIComponent, and unescape may make of a string's
    // escapes: each %uXXXX, each %XX, and the UTF-8 that a run of %XX encodes.
    if (ts.isStringLiteralLike(node)) {
      const runs = [...node.text.matchAll(/(?:%[0-9a-f]{2})+/gi)].map((match) =>
        match[0]
          .slice(1)
          .split("%")
          .map((byte) => Number.parseInt(byte, 16)),
      );
      texts.push(
        ...[...node.text.matchAll(/%u([0-9a-f]{4})/gi)].map((match) =>
          String.fromCharCode(Number.parseInt(match[1], 16)),
        ),
        ...runs.map((bytes) => String.fromCharCode(...bytes)),
        ...runs.map((bytes) => new TextDecoder().decode(Uint8Array.from(bytes))),
      );
    }
    // String.fromCharCode and String.fromCodePoint of numbers that the text writes make the code
    // units of those numbers, where fromCodePoint throws no RangeError.
    const method =
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText() === "String"
        ? node.expression.name.text
        : undefined;
    const numbers =
      ts.isCallExpression(node) && node.arguments.length > 0
        ? node.arguments.map((argument) =>
            ts.isNumericLiteral(argument)
              ? Number(argument.text)
              : ts.isPrefixUnaryExpression(argument) &&
                  argument.operator === ts.SyntaxKind.MinusToken &&
                  ts.isNumericLiteral(argument.operand)
                ? -Number(argument.operand.text)
                : Number.NaN,
          )
        : [Number.NaN];
    if (method === "fromCharCode" && numbers.every(Number.isFinite)) {
      texts.push(String.fromCharCode(...numbers));
    }
    if (
      method === "fromCodePoint" &&
      numbers.every((value) => Number.isInteger(value) && value >= 0 && value <= 0x10ffff)
    ) {
      texts.push(String.fromCodePoint(...numbers));
    }
    ts.forEachChild(node, visit);
  };
  [sourceFile, ...files].forEach(visit);
  // The forms of each string literal outside ASCII that normalize gives, and of those forms, where
  // the script calls normalize, which the module reads by the text.
  const isNormalized = (node: ts.Node): boolean =>
    (ts.isPropertyAccessExpression(node) && node.name.text === "normalize") ||
    (ts.forEachChild(node, isNormalized) ?? false);
  const getLiterals = (node: ts.Node): string[] => [
    ...(ts.isStringLiteralLike(node) &&
    node.text.length <= LONG_LITERAL &&
    /[^\0-\x7f]/.test(node.text)
      ? [node.text]
      : []),
    ...node.getChildren().flatMap(getLiterals),
  ];
  const getForms = (text: string) =>
    NORMAL_FORMS.map((form) => text.normalize(form)).filter((form) => form !== text);
  const literals = [sourceFile, ...files].some(isNormalized)
    ? [sourceFile, ...files].flatMap(getLiterals)
    : [];
  const normals = [...new Set([...literals, ...literals.flatMap(getForms)])];
  // The named time zones whose tables the module reads: in a script that reaches Temporal, those
  // that a string literal names, itself or in an ISO string's annotation, in any case.
  const getZoneNames = (node: ts.Node): string[] => [
    ...(ts.isStringLiteralLike(node) && node.text.length <= LONG_LITERAL
      ? [node.text, ...[...node.text.matchAll(/\[!?([^\]=]+)\]/g)].map((match) => match[1])]
      : []),
    ...node.getChildren().flatMap(getZoneNames),
  ];
  const timeZones = [
    ...new Set(
      ([sourceFile, ...files].some((file) => /\bTemporal\b/.test(file.text))
        ? [sourceFile, ...files]
        : []
      )
        .flatMap(getZoneNames)
        .map((name) => name.toLowerCase())
        .filter((name) => Object.hasOwn(TIME_ZONES, name)),
    ),
  ].sort();
  texts.push(...normals.flatMap(getForms));
  const getCodes = (text: string) =>
    Array.from({ length: text.length }, (_, position) => text.charCodeAt(position)).filter(
      (code) => code >= 128,
    );
  // The code points that the code units make, where a high surrogate before a low one makes one.
  const getPoints = (units: Set<number>) => {
    const all = [...units];
    const isHigh = (code: number) => code >= 0xd800 && code <= 0xdbff;
    const isLow = (code: number) => code >= 0xdc00 && code <= 0xdfff;
    return [
      ...all
        .filter((code) => !isHigh(code) && !isLow(code))
        .map((code) => String.fromCharCode(code)),
      ...all
        .filter(isHigh)
        .flatMap((high) => all.filter(isLow).map((low) => String.fromCharCode(high, low))),
    ];
  };
  // The code units that the script's text holds, with those of each case of the code points they
  // make, as a script may change the case of what it reads.
  const getClosed = (units: Set<number>): Set<number> => {
    const closed = new Set([
      ...units,
      ...getPoints(units).flatMap((point) => [
        ...getCodes(point.toUpperCase()),
        ...getCodes(point.toLowerCase()),
      ]),
    ]);
    return closed.size === units.size ? units : getClosed(closed);
  };
  context.characters = getClosed(new Set(texts.flatMap(getCodes)));
  // An imported file's top-level statements that change what the model reads run before the
  // model's own, with the variables of imported files that the model reaches and that change.
  const hasEffect = (node: ts.Node): boolean =>
    getWritten(node) !== undefined ||
    ((ts.isCallExpression(node) || ts.isNewExpression(node)) &&
      getCallee(node.expression, context)?.body !== undefined) ||
    (ts.forEachChild(node, hasEffect) ?? false);
  const effects = files.flatMap((file) =>
    getRunStatements(file).filter((statement) =>
      ts.isVariableStatement(statement)
        ? statement.declarationList.declarations.some(
            (declaration) =>
              declaration.initializer !== undefined &&
              !ts.isFunctionLike(declaration.initializer) &&
              hasEffect(declaration.initializer),
          )
        : !isDeclaration(statement) &&
          !ts.isExportDeclaration(statement) &&
          !(ts.isExportAssignment(statement) && isLiteralValue(statement.expression)),
    ),
  );
  const getWrittenSymbols = (reachedNodes: readonly ts.Node[]) =>
    new Set(
      reachedNodes.flatMap((reached) =>
        findNodes(reached, (node): node is ts.Node => getWritten(node) !== undefined).flatMap(
          (node) => {
            const target = getWritten(node);
            return target === undefined
              ? []
              : getWrittenRoots(target).flatMap((root) => getSymbol(root, context.checker) ?? []);
          },
        ),
      ),
    );
  const getImported = (run: readonly ts.Statement[]): ts.Statement[] => {
    const reachedNodes = getReached([sourceFile, ...exported, ...run], context);
    const written = getWrittenSymbols(reachedNodes);
    // Where any of them changes, every variable that the model reaches runs where its file
    // declares it, as its value may read one that changes.
    const declared = reachedNodes.flatMap((node) => {
      const statement = node.parent?.parent;
      const symbol = ts.isVariableDeclaration(node)
        ? getSymbol(node.name, context.checker)
        : undefined;
      return symbol !== undefined &&
        ts.isVariableDeclaration(node) &&
        !(node.initializer !== undefined && ts.isFunctionLike(node.initializer)) &&
        ts.isVariableStatement(statement) &&
        isTopLevel(statement) &&
        files.includes(statement.getSourceFile())
        ? [
            {
              statement,
              symbol,
              isChanged:
                (statement.declarationList.flags & ts.NodeFlags.Const) === 0 || written.has(symbol),
            },
          ]
        : [];
    });
    // An object that a variable makes, itself or through a function that it calls, keeps its
    // identity, so its file makes it once.
    const states =
      declared.some((state) => state.isChanged) || run.length > 0
        ? declared
        : declared.filter((state) => isMakingObjects(state.statement, context));
    // A class of an imported file that the model reaches, which its file makes where it declares
    // it, as it does an enum that code reads as an object.
    const classes = reachedNodes.filter(
      (node): node is ts.ClassDeclaration | ts.EnumDeclaration =>
        (ts.isClassDeclaration(node) ||
          (ts.isEnumDeclaration(node) && context.valueEnums.has(node))) &&
        ts.isSourceFile(node.parent) &&
        node.parent !== sourceFile &&
        files.includes(node.parent),
    );
    const next = [
      ...run,
      ...effects.filter(
        (statement) =>
          !run.includes(statement) &&
          [...getWrittenSymbols(getReached([statement], context))].some((symbol) =>
            declared.some((state) => state.isChanged && state.symbol === symbol),
          ),
      ),
    ];
    return next.length > run.length
      ? getImported(next)
      : [...new Set([...run, ...states.map((state) => state.statement), ...classes])].toSorted(
          (left, right) => (positions.get(left) ?? 0) - (positions.get(right) ?? 0),
        );
  };
  // A let, a const, or a class at a file's top level, whose binding is uninitialized until its
  // declaration runs.
  const isLexical = (node: ts.Node) =>
    (ts.isClassDeclaration(node) && ts.isSourceFile(node.parent)) ||
    (ts.isVariableDeclaration(node) &&
      ts.isVariableDeclarationList(node.parent) &&
      (node.parent.flags & ts.NodeFlags.BlockScoped) !== 0 &&
      ts.isSourceFile(node.parent.parent.parent));
  // An imported file's statement that reads, itself or through a function that it names, a binding
  // that a module later in an import cycle declares, or a later statement of its own file, which
  // throws a ReferenceError as the binding is uninitialized, runs where its file runs.
  const early = files.flatMap((file) =>
    getRunStatements(file).filter((statement) =>
      (ts.isVariableStatement(statement)
        ? statement.declarationList.declarations.flatMap((declaration) =>
            declaration.initializer === undefined || ts.isFunctionLike(declaration.initializer)
              ? []
              : [declaration.initializer],
          )
        : isDeclaration(statement) || ts.isExportDeclaration(statement)
          ? []
          : [statement]
      ).some((root) =>
        getReached([root], context).some((reached) => {
          const later = order.indexOf(reached.getSourceFile()) - order.indexOf(file);
          return isLexical(reached) && (later > 0 || (later === 0 && reached.pos >= statement.end));
        }),
      ),
    ),
  );
  const imported = getImported([
    ...new Set([...effects.filter((statement) => !ts.isVariableStatement(statement)), ...early]),
  ]);
  const roots = [sourceFile, ...imported];
  // A script, with no exported functions, gives the objects and classes it makes, or reads through
  // Object or hasOwnProperty, identity with a heap. The heap binds to the symbol of lib's PropertyKey type,
  // which no value can have.
  const heap = program.checker
    .getSymbolsInScope(sourceFile, ts.SymbolFlags.TypeAlias)
    .find((symbol) => symbol.name === "PropertyKey");
  // A class that the script declares, whose prototype only an object can hold.
  const isScriptClass = (node: ts.Node | undefined) =>
    node !== undefined && ts.isClassLike(node) && !node.getSourceFile().isDeclarationFile;
  const usesObjects = (node: ts.Node): boolean =>
    ts.isObjectLiteralExpression(node) ||
    (ts.isEnumDeclaration(node) && context.valueEnums.has(node)) ||
    // A tagged template's template object.
    (ts.isTaggedTemplateExpression(node) && !isRawTemplate(node, context)) ||
    (ts.isClassLike(node) &&
      (node.heritageClauses ?? []).every((clause) =>
        clause.types.every(
          (type) =>
            type.expression.kind === ts.SyntaxKind.NullKeyword ||
            (ts.isIdentifier(type.expression) &&
              (["Object", "Boolean", "Number", "String", "Date"].includes(type.expression.text) ||
                isCollectionName(type.expression.text))),
        ),
      )) ||
    (ts.isPropertyAccessExpression(node) &&
      ((ts.isIdentifier(node.expression) && node.expression.text === "Object") ||
        node.name.text === "hasOwnProperty")) ||
    (ts.isPropertyAccessExpression(node) &&
      node.name.text === "prototype" &&
      isScriptClass(getValueDeclaration(getSymbol(node.expression, context.checker), context))) ||
    // A class with members that extends a native error, whose errors only objects can be.
    (ts.isClassLike(node) &&
      hasObjectMembers(node) &&
      (node.heritageClauses ?? []).some((clause) =>
        clause.types.some(
          (type) => ts.isIdentifier(type.expression) && NATIVE_ERRORS.has(type.expression.text),
        ),
      )) ||
    (ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ["Boolean", "Number", "String", "Date"].includes(node.expression.text)) ||
    (ts.isIdentifier(node) &&
      [
        "arguments",
        "Reflect",
        "Symbol",
        "Promise",
        "setTimeout",
        "JSON",
        "Proxy",
        "ArrayBuffer",
        "SharedArrayBuffer",
        "DataView",
        "DisposableStack",
        "AsyncDisposableStack",
        "Temporal",
        ...TYPED_ARRAYS.keys(),
      ].includes(node.text)) ||
    (ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.Using) !== 0) ||
    node.kind === ts.SyntaxKind.AsyncKeyword ||
    isImportCall(node) ||
    isHoleyArray(node, context) ||
    isThrownArray(node) ||
    isArrayLengthening(node, context) ||
    // The indices of a match, which are arrays inside an array.
    (ts.isPropertyAccessExpression(node) &&
      node.name.text === "indices" &&
      isRegExpArray(
        context.checker.getNonNullableType(context.checker.getTypeAtLocation(node.expression)),
      )) ||
    // A function that a script holds as a value, such as an array's element, an operand, a cast's
    // operand, or a value that a built-in takes, which only a model value on the heap can be.
    (ts.isIdentifier(node) &&
      (ts.isArrayLiteralExpression(node.parent) ||
        ts.isBinaryExpression(node.parent) ||
        ts.isPrefixUnaryExpression(node.parent) ||
        ts.isConditionalExpression(node.parent) ||
        ts.isAsExpression(node.parent) ||
        ts.isTypeAssertionExpression(node.parent) ||
        ts.isSatisfiesExpression(node.parent) ||
        (ts.isVariableDeclaration(node.parent) && node.parent.initializer === node) ||
        isBuiltInValueArgument(node, context.checker)) &&
      getFunction(getTopLevelDeclaration(getSymbol(node, context.checker), context)) !==
        undefined) ||
    // A function that a block declares outside strict mode, which its var holds as a value.
    isVarFunction(node) ||
    isPrototypeArray(node, context) ||
    getKeptIterator(node, context) !== undefined ||
    getWrappedThis(node, context) !== undefined ||
    // An array that a script gives a named property, which only an object can hold.
    (ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      node.left.name.text !== "length" &&
      [context.checker.getTypeAtLocation(node.left.expression)]
        .flatMap((type) => (type.isIntersection() ? type.types : [type]))
        .some((type) => context.checker.isArrayType(type) || context.checker.isTupleType(type))) ||
    // A read of a property of a value of type any or unknown, which only the heap tells the kind
    // of. A write to a primitive's property throws or does nothing without one.
    ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      !(
        ts.isBinaryExpression(node.parent) &&
        node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        node.parent.left === node
      ) &&
      (context.checker.getTypeAtLocation(node.expression).flags &
        (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
        0) ||
    // An in that tests a key of a value whose type doesn't tell what it is, which reads its
    // prototypes too.
    (ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.InKeyword &&
      !ts.isPrivateIdentifier(node.left) &&
      isUntold(node.right, context.checker)) ||
    // A pattern that reads the properties of a value of type any or unknown, as a read does.
    (ts.isObjectBindingPattern(node) &&
      (context.checker.getTypeAtLocation(node).flags &
        (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
        0) ||
    // An array whose element a script deletes, which leaves a hole that only an object can hold.
    (ts.isDeleteExpression(node) &&
      ts.isElementAccessExpression(node.expression) &&
      context.checker.isArrayType(context.checker.getTypeAtLocation(node.expression.expression))) ||
    (ts.forEachChild(node, usesObjects) ?? false);
  const reached = getReached([...roots, ...exported], context);
  context.reached = new Set(reached);
  // A set or a map that a script iterates, spreads, copies, or calls forEach, keys, values, or entries
  // on, whose order every set and map then keeps.
  const usesOrder = (node: ts.Node): boolean => {
    const parent = node.parent;
    const isIterated =
      ts.isExpression(node) &&
      parent !== undefined &&
      ((ts.isForOfStatement(parent) && parent.expression === node) ||
        ts.isSpreadElement(parent) ||
        (ts.isPropertyAccessExpression(parent) &&
          parent.expression === node &&
          ["forEach", "keys", "values", "entries"].includes(parent.name.text)) ||
        ((ts.isCallExpression(parent) || ts.isNewExpression(parent)) &&
          parent.arguments?.[0] === node &&
          (ts.isNewExpression(parent)
            ? ["Set", "Map"].includes(getBuiltIn(parent.expression, context) ?? "")
            : ts.isPropertyAccessExpression(parent.expression) &&
              parent.expression.name.text === "from" &&
              getBuiltIn(parent.expression.expression, context) === "Array")));
    return (
      (isIterated && isSetOrMapType(node, context)) || (ts.forEachChild(node, usesOrder) ?? false)
    );
  };
  // A function that outlives the call that made it and reads that call's locals is an object that
  // the heap holds with the environment that holds them.
  const isMakingClosure = (node: ts.Node): boolean =>
    ((ts.isFunctionExpression(node) || ts.isArrowFunction(node)) && isOutliving(node, context)) ||
    (ts.forEachChild(node, isMakingClosure) ?? false);
  const isClosing = reached.some(isMakingClosure);
  const isUsingHeap =
    isClosing ||
    reached.some(usesObjects) ||
    context.namespaces.size > 0 ||
    context.commonJsModules.length > 0 ||
    context.jsonModules.size > 0;
  const shareable = getReached(roots, context);
  // Where a TLA+ value would copy an object that JavaScript shares and that changes in place, the
  // heap holds the file's objects, as JavaScript does.
  const isSharing =
    heap !== undefined &&
    !(isScript(sourceFile) && isUsingHeap) &&
    findSharing(shareable, context) !== undefined;
  // A description of a property is an object that only the heap makes, as a script's is.
  const isDescribing = (node: ts.Node): boolean =>
    (ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ["getOwnPropertyDescriptor", "getOwnPropertyDescriptors"].includes(
        node.expression.name.text,
      ) &&
      ["Object", "Reflect"].includes(getBuiltIn(node.expression.expression, context) ?? "")) ||
    (ts.forEachChild(node, isDescribing) ?? false);
  // A buffer, a view of one, or a typed array is an object that only the heap makes, and the
  // constructor of one is an object that only the heap holds.
  const isMakingBuffer = (node: ts.Node): boolean =>
    !ts.isTypeNode(node) &&
    ((ts.isIdentifier(node) && isBufferName(getBuiltIn(node, context) ?? "")) ||
      (ts.forEachChild(node, isMakingBuffer) ?? false));
  // A module whose code reads a module's namespace object holds it on the heap, as a script does.
  const isHeapFile =
    isScript(sourceFile) ||
    isSharing ||
    isClosing ||
    context.namespaces.size > 0 ||
    (heap !== undefined && (reached.some(isDescribing) || reached.some(isMakingBuffer)));
  context.hasOrderedCollections = isHeapFile && reached.some(usesOrder);
  const changedArrays = isHeapFile ? findChangedArrays(reached, context) : [];
  if (heap !== undefined && isHeapFile && (isSharing || changedArrays.length > 0 || isUsingHeap)) {
    context.heap = heap;
    context.objectTargets = findObjectTargets(program.files, context);
    findHeapCode(context);
    context.makers = findMakers(context.nodes, context.reachGraph, (node) =>
      isMakingNode(node, context),
    );
    findFileAccessors(context);
    context.variables.set(heap, identifier(context.names.getFresh("heap")));
    context.storedBuiltIns = new Map(
      program.files.map((file) => [
        file,
        new Set(
          findNodes(file, ts.isPropertyAccessExpression).flatMap(
            (inner) => getStoredBuiltIn(inner, context) ?? [],
          ),
        ),
      ]),
    );
    // The functions that a call through a value may run, found once for every call: those of
    // each file that the model reaches.
    context.closures = new Map(
      program.files.map((file) => [
        file,
        findNodes(
          file,
          (inner): inner is Closure => isClosure(inner, context) && isReached(inner, context),
        ),
      ]),
    );
    context.functionCandidates = new Map(
      program.files.map((file) => [
        file,
        findFunctionCandidates(file, context).filter((candidate) => isReached(candidate, context)),
      ]),
    );
    context.sharedFunctionCandidates = findSharedFunctionCandidates(
      context.functionCandidates,
      context,
    );
    context.onlyCalled = findOnlyCalled(context);
    // A name, or a string that keys a property by it, as in Object.getOwnPropertyDescriptor.
    const isTyped = (node: ts.Expression, flags: ts.TypeFlags) => {
      const type = context.checker.getTypeAtLocation(node);
      return (type.isUnion() ? type.types : [type]).every((member) => (member.flags & flags) !== 0);
    };
    const isNumeric = (node: ts.Expression) =>
      isTyped(node, ts.TypeFlags.NumberLike | ts.TypeFlags.BigIntLike);
    const usesSpecialNumbers = (node: ts.Node): boolean =>
      ((ts.isIdentifier(node) || ts.isStringLiteral(node)) &&
        [
          "NaN",
          "isNaN",
          "Infinity",
          "POSITIVE_INFINITY",
          "NEGATIVE_INFINITY",
          // The properties of Number and Math that hold fractions or integers beyond 32 bits.
          "EPSILON",
          "MIN_VALUE",
          "MAX_VALUE",
          "MAX_SAFE_INTEGER",
          "MIN_SAFE_INTEGER",
          "E",
          "LN10",
          "LN2",
          "LOG10E",
          "LOG2E",
          "PI",
          "SQRT1_2",
          "SQRT2",
          // A float's bytes may hold any of them.
          "DataView",
          "Float16Array",
          "Float32Array",
          "Float64Array",
          // A time value may be NaN or an integer beyond 32 bits, as may a power, and a Temporal
          // object's field an integer beyond 32 bits or a fraction.
          "Date",
          "pow",
          "Temporal",
        ].includes(node.text)) ||
      (ts.isPrefixUnaryExpression(node) &&
        node.operator === ts.SyntaxKind.MinusToken &&
        ts.isNumericLiteral(node.operand) &&
        Number(node.operand.text) === 0) ||
      // Division may give an infinity or -0, and ** and >>> an integer beyond 32 bits.
      (ts.isBinaryExpression(node) &&
        [
          ts.SyntaxKind.SlashToken,
          ts.SyntaxKind.AsteriskAsteriskToken,
          ts.SyntaxKind.AsteriskAsteriskEqualsToken,
          ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
          ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
        ].includes(node.operatorToken.kind)) ||
      // Converting a value that isn't a number, as arithmetic or a call does, may give NaN.
      (ts.isBinaryExpression(node) &&
        (NAN_OPERATORS.has(node.operatorToken.kind) ||
          ((node.operatorToken.kind === ts.SyntaxKind.PlusToken ||
            node.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken) &&
            !isTyped(node.left, ts.TypeFlags.StringLike) &&
            !isTyped(node.right, ts.TypeFlags.StringLike))) &&
        !(isNumeric(node.left) && isNumeric(node.right))) ||
      ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
        node.operator !== ts.SyntaxKind.ExclamationToken &&
        !isNumeric(node.operand)) ||
      ((ts.isCallExpression(node) || ts.isNewExpression(node)) &&
        (node.arguments ?? []).some((argument) => {
          // A parameter that takes a number, or leaves it out.
          const expected = context.checker.getContextualType(argument);
          const members =
            expected === undefined ? [] : expected.isUnion() ? expected.types : [expected];
          return (
            members.some((member) => (member.flags & ts.TypeFlags.Number) !== 0) &&
            members.every(
              (member) => (member.flags & (ts.TypeFlags.Number | ts.TypeFlags.Undefined)) !== 0,
            ) &&
            !isNumeric(argument)
          );
        })) ||
      // Math's functions that may give a fraction or NaN.
      (ts.isPropertyAccessExpression(node) &&
        node.expression.getText() === "Math" &&
        MATH_OPERATORS.has(node.name.text)) ||
      // A literal may give a fraction or an integer beyond 32 bits, and a string may key a typed
      // array by a fraction.
      (ts.isNumericLiteral(node) &&
        (!Number.isInteger(Number(node.text)) || Number(node.text) > 2 ** 31 - 1)) ||
      (ts.isStringLiteral(node) && isFractionKey(node.text)) ||
      (ts.forEachChild(node, usesSpecialNumbers) ?? false);
    context.hasSpecialNumbers = roots.some(usesSpecialNumbers) || hasSpecialJsonNumbers(context);
    // TypedKey finds a number that a string gives in Fractions by its text.
    const addFractionKeys = (node: ts.Node) => {
      if (ts.isStringLiteral(node) && isFractionKey(node.text)) {
        getNumberValue(Number(node.text), context);
      }
      ts.forEachChild(node, addFractionKeys);
    };
    roots.forEach(addFractionKeys);

    // A variable may hold any typed array's constructor, so the heap holds them all, their
    // prototypes, and the methods that they share.
    const usesTypedArrays = (node: ts.Node): boolean =>
      (ts.isIdentifier(node) && TYPED_ARRAYS.has(node.text)) ||
      (ts.forEachChild(node, usesTypedArrays) ?? false);
    if (roots.some(usesTypedArrays)) {
      const shared = ["%Int8Array.[[Prototype]]%", "%Int8Array.prototype.[[Prototype]]%"];
      [
        ...[...TYPED_ARRAYS.keys()].flatMap((name) => [name, `${name}.prototype`]),
        ...shared,
        ...shared.flatMap((name) =>
          BUILT_INS[name][3].flatMap((property) =>
            property
              .slice(2)
              .filter((value) => value.startsWith("o"))
              .map((value) => value.slice(1)),
          ),
        ),
      ].forEach((name) => context.builtIns.add(name));
    }
    context.heapCollections = findHeapArrays(roots, changedArrays, context);
    context.collectionProxies = findCollectionProxies(roots, context);
    context.checkedGlobals = findCheckedGlobals(sourceFile, context);
    context.generatorPrototypes = findGeneratorPrototypes(sourceFile, context);
    context.templateSites = roots.flatMap((root) =>
      findNodes(
        root,
        (node): node is ts.TaggedTemplateExpression =>
          ts.isTaggedTemplateExpression(node) && !isRawTemplate(node, context),
      ),
    );
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
    context.hasInheritedElements = roots.some(changesPrototype);
    // Each call of Symbol makes a symbol each time it runs: once at the top level outside loops,
    // and many times where a function, a class, or a loop runs it again, as a test runs its
    // function for each typed array and each way of making one.
    const getSymbolCalls = (node: ts.Node, isRepeated: boolean): number =>
      node
        .getChildren()
        .reduce(
          (count, child) =>
            count +
            getSymbolCalls(
              child,
              isRepeated ||
                ts.isFunctionLike(node) ||
                ts.isClassLike(node) ||
                ts.isIterationStatement(node, false),
            ),
          ts.isCallExpression(node) && ["Symbol", "Symbol.for"].includes(node.expression.getText())
            ? isRepeated
              ? REPEATED_SYMBOLS
              : 1
            : 0,
        );
    // The built-in objects hold properties that the well-known symbols key.
    context.symbols = [
      ...WELL_KNOWN_SYMBOLS,
      ...Array.from(
        { length: roots.reduce((count, root) => count + getSymbolCalls(root, false), 0) },
        () => "",
      ),
    ].map((name) =>
      context.names.getFresh(`Symbol${name.charAt(0).toUpperCase()}${name.slice(1)}`),
    );
    // Where the heap's arrays, sets, and maps would still share one that a value holds, the heap
    // holds every one.
    if (findSharing(shareable, context) !== undefined) {
      findMadeCollections(roots, context).forEach((node) => context.heapCollections.add(node));
      context.isEveryCollectionHeld = true;
      context.collectionProxies = findCollectionProxies(roots, context);
    }
  }
  // A map that the heap doesn't hold is a TLA+ function, which may be the same value as an array.
  const makesMapValue = (node: ts.Node): boolean =>
    ((ts.isNewExpression(node) || ts.isCallExpression(node)) &&
      getKind(node, context) === "map" &&
      !isHeapSetOrMap(node, context)) ||
    (ts.forEachChild(node, makesMapValue) ?? false);
  context.isEveryMapHeld = !roots.some(makesMapValue);
  const read = readModel(sourceFile, imported, positions, context);
  const uncalled = read.exported.flatMap((definition) => {
    const reason = getUncalledReason(definition, context);
    return reason === undefined ? [] : [{ definition, reason }];
  });
  const model = {
    ...read,
    exported: read.exported.filter((definition) =>
      uncalled.every((entry) => entry.definition !== definition),
    ),
  };
  context.script =
    isNodeScript && model.exported.length === 0
      ? { sourceFile, isEsModule: isEsModule(sourceFile) }
      : undefined;
  // Only where the heap holds every array, set, and map may an object that a value holds still be
  // shared, as the heap decided above found none otherwise.
  if (context.isEveryCollectionHeld) rejectSharing(shareable, context);
  rejectRegExpIndicesUses(roots, context);
  if (context.heap !== undefined) {
    const callees = findDispatchedCallees(reached, context);
    context.dispatch = createDispatch(callees, context, program.isStrictFunctionTypes);
    context.calleeRuns = findCalleeRuns(callees, context);
    context.effects = findEffects(reached, context);
    context.changes = summarizeEffects(context);
  }
  classifySharedHelpers(reached, context);
  // A using declaration disposes nothing where it holds only null or undefined.
  const isNothing = (node: ts.Expression | undefined) =>
    node !== undefined &&
    (node.kind === ts.SyntaxKind.NullKeyword ||
      (ts.isIdentifier(node) && node.text === "undefined") ||
      (ts.isArrayLiteralExpression(node) && node.elements.length === 0));
  // A script disposes the resources of a using declaration that a block, a for, or a for-of
  // holds.
  const isDisposed = (node: ts.VariableDeclarationList) =>
    context.heap !== undefined &&
    ((ts.isVariableStatement(node.parent) &&
      (ts.isBlock(node.parent.parent) || ts.isSourceFile(node.parent.parent))) ||
      ((ts.isForStatement(node.parent) || ts.isForOfStatement(node.parent)) &&
        node.parent.initializer === node));
  const findUsing = (node: ts.Node): ts.Node | undefined =>
    ts.isVariableDeclarationList(node) &&
    (node.flags & ts.NodeFlags.Using) !== 0 &&
    !isDisposed(node) &&
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
        // A string as a statement, such as a "use strict" directive, does nothing as it runs.
        (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) ||
        (ts.isVariableStatement(statement) &&
          statement.declarationList.declarations.every(
            (declaration) =>
              ts.isIdentifier(declaration.name) &&
              // Only a script runs a declaration that nothing reads, which may throw.
              (!isScript(sourceFile) ||
                declaration.initializer === undefined ||
                (statement.declarationList.flags & ts.NodeFlags.Const) === 0 ||
                isInertValue(declaration.initializer)),
          )),
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
            render(translateScript(model.script, sourceFile, model.exported.length === 0, context)),
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
      define("UsedSourceTexts", [], translateSourceTexts(context)),
      define("UsedSymbols", [], tuple(context.symbols.map((name) => identifier(name)))),
      define(
        "UsedFractions",
        [],
        tuple(
          [...context.fractions]
            .sort((left, right) => left[0] - right[0])
            .map((fraction) =>
              record("Record", [
                { name: "value", value: identifier(fraction[1]) },
                { name: "text", value: string(String(fraction[0])) },
                { name: "floor", value: number(Math.floor(fraction[0])) },

                { name: "binary", value: getBinary(fraction[0]) },
                ...getShortestFields(fraction[0]),
                {
                  name: "round",
                  value: Object.is(Math.round(fraction[0]), -0)
                    ? identifier("NegativeZero")
                    : number(Math.round(fraction[0])),
                },
              ]),
            ),
        ),
      ),
      define(
        "UsedDoubles",
        [],
        tuple(
          [...context.doubles].map((value) =>
            record("Record", [
              { name: "binary", value: getBinary(value) },
              { name: "text", value: string(String(value)) },
              ...getShortestFields(value),
            ]),
          ),
        ),
      ),
      define(
        "UsedCases",
        [],
        tuple(
          getPoints(context.characters)
            .filter((point) => point.toUpperCase() !== point || point.toLowerCase() !== point)
            .sort()
            .map((point) =>
              record("Record", [
                { name: "point", value: string(point) },
                { name: "upper", value: string(point.toUpperCase()) },
                { name: "lower", value: string(point.toLowerCase()) },
              ]),
            ),
        ),
      ),
      define(
        "UsedNormals",
        [],
        tuple(
          normals.map((text) =>
            record("Record", [
              { name: "text", value: string(text) },
              ...NORMAL_FORMS.map((form) => ({ name: form, value: string(text.normalize(form)) })),
            ]),
          ),
        ),
      ),
      define("UsedSearches", [], translateSearches(context)),
      // The patterns of toLocaleString, which a script that formats a Temporal object reads.
      define(
        "UsedDateFormats",
        [],
        tuple(
          /\btoLocaleString\b/.test(sourceFile.text) && /\bTemporal\b/.test(sourceFile.text)
            ? Object.entries(DATE_FORMATS).map(([key, format]) =>
                record("Record", [
                  { name: "key", value: string(key) },
                  ...(format.error === undefined
                    ? [
                        { name: "fields", value: tuple((format.fields ?? []).map(string)) },
                        { name: "styles", value: tuple((format.styles ?? []).map(string)) },
                        { name: "isZoned", value: boolean(format.isZoned === true) },
                      ]
                    : [{ name: "error", value: string(format.error) }]),
                ]),
              )
            : [],
        ),
      ),
      define(
        "UsedTimeZones",
        [],
        tuple(
          timeZones.map((key) => {
            const table = TIME_ZONES[key];
            const days = table.times.map((time) => Math.floor(time / 86400));
            return record("Record", [
              { name: "key", value: string(key) },
              { name: "id", value: string(table.id) },
              { name: "primary", value: string(table.primary) },
              { name: "offsets", value: tuple(table.offsets.map(number)) },
              { name: "days", value: tuple(days.map(number)) },
              {
                name: "seconds",
                value: tuple(
                  table.times.map((time, position) => number(time - days[position] * 86400)),
                ),
              },
              { name: "isFinal", value: boolean(table.isFinal) },
              { name: "rule", value: tuple(table.rule.map(number)) },
            ]);
          }),
        ),
      ),
      define(
        "UsedCharacters",
        [],
        tuple(
          [...context.characters]
            .sort((left, right) => left - right)
            .map((code) =>
              record("Record", [
                { name: "code", value: number(code) },
                { name: "character", value: getCodePoint(code) },
              ]),
            ),
        ),
      ),
    );
  }
  rejectEndlessCount(model, sections, context);
  return emit(
    getModuleName(path),
    program.sourceFile,
    model,
    sections,
    context,
    uncalled.map(
      (entry) =>
        `tla-ts calls no ${ts.getNameOfDeclaration(entry.definition.declaration)?.getText()}: ${entry.reason}`,
    ),
  );
};
