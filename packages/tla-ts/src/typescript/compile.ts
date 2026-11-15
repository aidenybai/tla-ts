import ts from "@typescript/typescript6";
import { getWritten, getWrittenRoots, translateScript, writesState } from "./actions";
import { getReached, isMakingObjects, rejectSharing } from "./aliasing";
import {
  type Context,
  createContext,
  findNodes,
  getCallee,
  getFunction,
  getSymbol,
  getTopLevelDeclaration,
  hasObjectMembers,
  isInertValue,
  isImportCall,
  isScript,
  rejectSloppyGlobalWrites,
  isVarFunction,
} from "./context";
import { type CompiledSpec, createSections, emit, type Sections } from "./emit";
import { getBinary, getNumberValue, MATH_OPERATORS } from "./expressions";
import { render } from "./formula";
import { translateBody } from "./functions";
import {
  findChangedArrays,
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
import { createProgram } from "./program";
import { link } from "./regions";
import { translateCall, translateInvariant, translateProperty, VALUE_TAGS } from "./properties";
import { createStateScope } from "./scope";
import { classifySharedHelpers } from "./shared-calls";
import { TlaTypeScriptError } from "../errors";
import { translateStep } from "./steps";
import {
  apply,
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
  getWrappedThis,
  isCollectionName,
  isFractionKey,
  isRegExpArray,
  isSetOrMapType,
  TYPED_ARRAYS,
} from "./types";

const NORMAL_FORMS = ["NFC", "NFD", "NFKC", "NFKD"];

// The most code units of a literal whose escapes tla-ts tells the codes of. A longer one, such as a
// string of every code point in a range, may hold more than the module can list.
const LONG_LITERAL = 1024;

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

export const compile = (
  source: string,
  fileName = "spec.ts",
  libraries?: ReadonlyMap<string, string>,
  isNodeScript = false,
): CompiledSpec => {
  const path = fileName.replaceAll("\\", "/");
  const program = createProgram(source, path, libraries);
  const context = createContext(program.checker, program.files, program.implicitGlobals);
  program.files.forEach((file) => rejectSloppyGlobalWrites(file, context));
  const sourceFile = program.sourceFile;
  // The files that the model imports, each after the files it imports, as they run.
  const visited = new Set([sourceFile]);
  const files: ts.SourceFile[] = [];
  const visitImports = (file: ts.SourceFile) =>
    file.statements.forEach((statement) => {
      // TypeScript erases a declaration that imports or exports only types.
      const specifier =
        (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly !== true) ||
        (ts.isExportDeclaration(statement) && !statement.isTypeOnly)
          ? statement.moduleSpecifier
          : undefined;
      const imported =
        specifier && program.checker.getSymbolAtLocation(specifier)?.valueDeclaration;
      if (
        imported === undefined ||
        !ts.isSourceFile(imported) ||
        imported.isDeclarationFile ||
        visited.has(imported)
      ) {
        return;
      }
      visited.add(imported);
      visitImports(imported);
      files.push(imported);
    });
  visitImports(sourceFile);
  // The modules that only an import() of a string loads, which run after those the model imports.
  const loaded = files.length;
  getDynamicImports(sourceFile, program.checker).forEach((file) => {
    if (visited.has(file)) return;
    visited.add(file);
    visitImports(file);
    files.push(file);
  });
  rejectRunningModules(files.slice(loaded));
  // The files in the order they run, the model's last.
  const order = [...files, sourceFile];
  const getDeclaration = (node: ts.Node) => {
    const symbol = program.checker.getSymbolAtLocation(node);
    return symbol === undefined
      ? undefined
      : (symbol.flags & ts.SymbolFlags.Alias ? program.checker.getAliasedSymbol(symbol) : symbol)
          .valueDeclaration;
  };
  context.namespaces = findNamespaces(sourceFile, files, context);
  // A file that imports reads an export through a module's namespace object as the module's
  // binding where tla-ts makes no namespace object for the module, and then other than a var's or
  // a let's, whose binding tla-ts keeps as state. It reads a default export of an expression or of
  // a class with no name, whose binding tla-ts doesn't make uninitialized, only where the module
  // that declares it ran first.
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
      const member =
        ts.isSourceFile(declaration) && ts.isPropertyAccessExpression(parent)
          ? getDeclaration(parent.name)
          : undefined;
      if (
        member !== undefined &&
        !context.namespaces.has(declaration.getSourceFile()) &&
        ts.isVariableDeclaration(member) &&
        (ts.getCombinedNodeFlags(member) & ts.NodeFlags.Const) === 0
      ) {
        throw new TlaTypeScriptError(
          `tla-ts can't read the variable ${parent.getText()} through a module's namespace object`,
          parent,
        );
      }
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
    file.statements.filter((statement) =>
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
        ts.isSourceFile(statement.parent) &&
        files.includes(statement.parent)
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
    // A class of an imported file that the model reaches, which its file makes where it declares it.
    const classes = reachedNodes.filter(
      (node): node is ts.ClassDeclaration =>
        ts.isClassDeclaration(node) &&
        ts.isSourceFile(node.parent) &&
        node.parent !== sourceFile &&
        files.includes(node.parent),
    );
    const next = effects.filter(
      (statement) =>
        run.includes(statement) ||
        [...getWrittenSymbols(getReached([statement], context))].some((symbol) =>
          declared.some((state) => state.isChanged && state.symbol === symbol),
        ),
    );
    return next.length > run.length
      ? getImported(next)
      : [...new Set([...run, ...states.map((state) => state.statement), ...classes])].toSorted(
          (left, right) =>
            files.indexOf(left.getSourceFile()) - files.indexOf(right.getSourceFile()) ||
            left.pos - right.pos,
        );
  };
  const imported = getImported(effects.filter((statement) => !ts.isVariableStatement(statement)));
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
      isScriptClass(getSymbol(node.expression, context.checker)?.valueDeclaration)) ||
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
    // A function that a script holds as a value, such as an array's element or an operand, which
    // only a model value on the heap can be.
    (ts.isIdentifier(node) &&
      (ts.isArrayLiteralExpression(node.parent) ||
        ts.isBinaryExpression(node.parent) ||
        ts.isPrefixUnaryExpression(node.parent) ||
        ts.isConditionalExpression(node.parent) ||
        (ts.isVariableDeclaration(node.parent) && node.parent.initializer === node)) &&
      getFunction(getTopLevelDeclaration(getSymbol(node, context.checker))) !== undefined) ||
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
  context.hasOrderedCollections = isScript(sourceFile) && reached.some(usesOrder);
  const changedArrays = isScript(sourceFile) ? findChangedArrays(reached, context) : [];
  if (
    heap !== undefined &&
    isScript(sourceFile) &&
    (changedArrays.length > 0 || reached.some(usesObjects) || context.namespaces.size > 0)
  ) {
    context.heap = heap;
    context.variables.set(heap, identifier(context.names.getFresh("heap")));
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
          // A time value may be NaN or an integer beyond 32 bits, as may a power.
          "Date",
          "pow",
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
    context.hasSpecialNumbers = roots.some(usesSpecialNumbers);
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
      ...Array.from(
        { length: 4 * roots.reduce((count, root) => count + getSymbolCalls(root), 0) },
        () => "",
      ),
    ].map((name) =>
      context.names.getFresh(`Symbol${name.charAt(0).toUpperCase()}${name.slice(1)}`),
    );
  }
  const model = readModel(sourceFile, imported, context);
  context.script =
    isNodeScript && model.exported.length === 0
      ? { sourceFile, isEsModule: isEsModule(sourceFile) }
      : undefined;
  rejectSharing(roots, context);
  rejectRegExpIndicesUses(roots, context);
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
  return emit(getModuleName(path), program.sourceFile, model, sections, context);
};
