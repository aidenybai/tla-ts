import { pathToFileURL } from "node:url";
import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type Context,
  findNodes,
  getHasInstanceReceiver,
  getHeapClass,
  getLiteralName,
  getSymbol,
  getUndefined,
  isModuleFile,
  isOnce,
  share,
  skipCasts,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import { getEngineErrors, getHeap, translateObjectValue } from "./heap";
import { getGeneratorPrototypeRef, translateBuiltInInstanceOf } from "./intrinsics";
import { getTypeNames, useJavaScript } from "./javascript";
import type { Scope } from "./scope";
import { getKind, isGeneratorType } from "./types";
import { apply, boolean, field, identifier, ifExpression, record, set, string } from "./tla";

export const NATIVE_ERRORS = new Set([
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "ReferenceError",
  "EvalError",
  "URIError",
  "SuppressedError",
  "AggregateError",
]);

export const isNativeErrorName = (name: string): name is `${string}Error` =>
  NATIVE_ERRORS.has(name);

const isNative = (symbol: ts.Symbol) =>
  NATIVE_ERRORS.has(symbol.name) &&
  (symbol.declarations ?? []).length > 0 &&
  (symbol.declarations ?? []).every((declaration) => declaration.getSourceFile().isDeclarationFile);

const getBase = (symbol: ts.Symbol, checker: ts.TypeChecker) => {
  const expression = (symbol.declarations ?? [])
    .flatMap((declaration) =>
      ts.isClassLike(declaration) || ts.isInterfaceDeclaration(declaration)
        ? (declaration.heritageClauses ?? [])
        : [],
    )
    .find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression;
  return expression === undefined ? undefined : getSymbol(expression, checker);
};

// A class expression that a const holds, which the script evaluates once, so the const names it.
const isConstClass = (node: ts.Node): node is ts.ClassExpression =>
  ts.isClassExpression(node) &&
  ts.isVariableDeclaration(node.parent) &&
  node.parent.initializer === node &&
  (ts.getCombinedNodeFlags(node.parent) & ts.NodeFlags.Const) !== 0 &&
  isOnce(node.parent);

// Whether a script reads a class's prototype, which an error that's a record can't inherit from, so
// the class makes objects on the heap.
export const isPrototypeRead = (symbol: ts.Symbol, checker: ts.TypeChecker) => {
  const declaration = symbol.valueDeclaration;
  return (
    declaration !== undefined &&
    findNodes(
      declaration.getSourceFile(),
      (node): node is ts.PropertyAccessExpression =>
        ts.isPropertyAccessExpression(node) &&
        node.name.text === "prototype" &&
        getSymbol(node.expression, checker) === symbol,
    ).length > 0
  );
};

export const getErrorClass = (
  symbol: ts.Symbol | undefined,
  checker: ts.TypeChecker,
): ts.Symbol[] | undefined => {
  if (symbol === undefined) return undefined;
  const base = getBase(symbol, checker);
  if (isNative(symbol)) return [symbol, ...(base === undefined ? [] : [base])];
  const declaration = symbol.valueDeclaration;
  const held =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : undefined;
  if (held !== undefined && ts.isClassExpression(held)) {
    return getErrorClass(checker.getTypeAtLocation(held).getSymbol(), checker);
  }
  if (
    declaration === undefined ||
    !(ts.isClassDeclaration(declaration) || isConstClass(declaration)) ||
    declaration.members.length > 0 ||
    isPrototypeRead(symbol, checker)
  ) {
    return undefined;
  }
  const inherited = getErrorClass(base, checker);
  return inherited === undefined ? undefined : [symbol, ...inherited];
};

// Whether Node runs a TypeScript file as an ES module: by its extension or package.json, or as
// its syntax needs one.
export const isEsModule = (sourceFile: ts.SourceFile) =>
  ts.getImpliedNodeFormatForFile(sourceFile.fileName, undefined, ts.sys, {
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  }) === ts.ModuleKind.ESNext || isModuleFile(sourceFile);

// Where Node says a script failed: the file's real path, or its URL in an ES module, and the line,
// then the line with a caret under the node.
export const getNodeLocation = (node: ts.Node, isUrl: boolean) => {
  const sourceFile = node.getSourceFile();
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const lineStarts = sourceFile.getLineStarts();
  const line = sourceFile.text
    .slice(lineStarts[start.line], lineStarts[start.line + 1])
    .replace(/\r?\n$/, "");
  const path = ts.sys.realpath?.(ts.sys.resolvePath(sourceFile.fileName)) ?? sourceFile.fileName;
  return `${isUrl ? pathToFileURL(path).href : path}:${start.line + 1}\n${line}\n${" ".repeat(start.character)}^`;
};

const PRIMITIVE_TYPES = new Set(["string", "number", "boolean", "bigint", "undefined", "null"]);

const TRACE_UNCAUGHT = "\n(Use `node --trace-uncaught ...` to show where the exception was thrown)";

// The name that Node gives an error of a class as it prints the error: the class's name, or that
// and the native class's in brackets where the class's name doesn't hold it.
const getErrorHeader = (classes: ts.Symbol[]) => {
  const native = classes.find(isNative)?.name;
  const declaration = classes[0].valueDeclaration;
  const name =
    declaration === undefined || !ts.isClassLike(declaration)
      ? classes[0].name
      : (declaration.name?.text ??
        (ts.isVariableDeclaration(declaration.parent) && ts.isIdentifier(declaration.parent.name)
          ? declaration.parent.name.text
          : undefined));
  if (native === undefined || name === undefined) return undefined;
  return name === native || name.includes(native) ? name : `${name} [${native}]`;
};

// What Node prints, but for the stack frames, for a value that a script throws and doesn't
// catch: an error that new makes, or a primitive. Node points at the throw, but at the new in an
// ES module as it runs, and an ES module's thrown primitive at Node's own code. A function that an
// ES module calls might run from a timer instead, so only its body's throws get Node's text.
export const getUncaughtText = (statement: ts.ThrowStatement, scope: Scope, context: Context) => {
  const thrown = skipCasts(statement.expression);
  const script = context.script;
  if (
    script === undefined ||
    statement.getSourceFile() !== script.sourceFile ||
    (script.isEsModule && ts.findAncestor(statement, ts.isFunctionLike) !== undefined)
  ) {
    return undefined;
  }
  const isModule = script.isEsModule;
  if (ts.isNewExpression(thrown)) {
    const classes = getErrorClass(getSymbol(thrown.expression, context.checker), context.checker);
    const header = classes === undefined ? undefined : getErrorHeader(classes);
    const argumentNodes = thrown.arguments ?? [];
    const message = argumentNodes.at(0);
    if (
      header === undefined ||
      argumentNodes.length > 1 ||
      header.includes("AggregateError") ||
      header.includes("SuppressedError") ||
      (message !== undefined &&
        getTypeNames(context.checker.getTypeAtLocation(message), context.checker)?.every(
          (name) => name === "string",
        ) !== true)
    ) {
      return undefined;
    }
    const prefix = `${getNodeLocation(isModule ? thrown : statement, isModule)}\n\n${header}`;
    return message === undefined
      ? string(prefix)
      : share(translateExpression(message, scope, context), "message", context, (shared) =>
          ifExpression(
            apply("=", [shared, string("")]),
            string(prefix),
            apply("\\o", [string(`${prefix}: `), shared]),
          ),
        );
  }
  const names = getTypeNames(context.checker.getTypeAtLocation(thrown), context.checker);
  if (
    names === undefined ||
    names.length === 0 ||
    !names.every((name) => PRIMITIVE_TYPES.has(name))
  ) {
    return undefined;
  }
  return apply("\\o", [
    apply("\\o", [
      string(
        isModule
          ? "\nnode:internal/modules/run_main:107\n    triggerUncaughtException(\n    ^\n"
          : `\n${getNodeLocation(statement, false)}\n`,
      ),
      useJavaScript("StringOf", [translateExpression(thrown, scope, context)], context),
    ]),
    string(TRACE_UNCAUGHT),
  ]);
};

export const getConstructor = (
  key: ts.Symbol | ts.Node,
  context: Context,
  preferred = "name" in key && typeof key.name === "string" ? key.name : "function",
) => {
  const existing = context.constructors.get(key);
  if (existing !== undefined) return identifier(existing);
  // TLC types a model value whose name has _ second, and such a value can't meet a string.
  const fresh = context.names.getFresh(preferred);
  const name = fresh[1] === "_" ? context.names.getFresh(`fn${preferred}`) : fresh;
  context.constructors.set(key, name);
  return identifier(name);
};

const getNative = (name: string, node: ts.Node, context: Context) => {
  const symbol = context.checker
    .getSymbolsInScope(node.getSourceFile(), ts.SymbolFlags.Value)
    .find((candidate) => candidate.name === name && isNative(candidate));
  if (symbol === undefined) throw new TlaTypeScriptError(`Unknown built-in: ${name}`, node);
  return symbol;
};

// A script's heap reads an error's properties through its constructor's prototype.
const includeError = (name: string, context: Context) => {
  context.builtIns.add(name);
  context.builtIns.add(`${name}.prototype`);
};

// An error that JavaScript itself throws, such as the TypeError of a failed defineProperty.
// An AggregateError also holds its errors.
export const translateEngineError = (
  name: string,
  node: ts.Node,
  context: Context,
  errors?: Expression,
) => {
  const symbol = getNative(name, node, context);
  includeError(name, context);
  return record("Record", [
    { name: "constructor", value: getConstructor(symbol, context) },
    ...(errors === undefined ? [] : [{ name: "errors", value: errors }]),
    { name: "message", value: string("") },
    { name: "name", value: string(name) },
  ]);
};

// The SuppressedError that disposing a resource throws where an error already completed the
// statements, which holds both.
export const translateSuppressedError = (
  error: Expression,
  suppressed: Expression,
  node: ts.Node,
  context: Context,
) => {
  const symbol = getNative("SuppressedError", node, context);
  includeError("SuppressedError", context);
  return record("Record", [
    { name: "constructor", value: getConstructor(symbol, context) },
    { name: "message", value: string("") },
    { name: "name", value: string("SuppressedError") },
    { name: "error", value: error },
    { name: "suppressed", value: suppressed },
  ]);
};

// The native error class that a call constructs an error of, as new does.
export const getCalledError = (node: ts.Node, context: Context) => {
  const classes = ts.isCallExpression(node)
    ? getErrorClass(getSymbol(node.expression, context.checker), context.checker)
    : undefined;
  return classes !== undefined && isNative(classes[0]) ? classes : undefined;
};

export const translateNewError = (
  node: ts.NewExpression | ts.CallExpression,
  classes: ts.Symbol[],
  scope: Scope,
  context: Context,
) => {
  const native = classes.find(isNative);
  if (native === undefined) throw new TlaTypeScriptError("Unknown error class", node);
  // A SuppressedError takes the error and the suppressed error before its message.
  const held = native.name === "SuppressedError" ? ["error", "suppressed"] : [];
  const argumentNodes = node.arguments ?? [];
  if (classes.some((symbol) => isNative(symbol) && symbol.name === "AggregateError")) {
    throw new TlaTypeScriptError("Unsupported constructor: new AggregateError", node);
  }
  if (argumentNodes.length > held.length + 1) {
    throw new TlaTypeScriptError("Error options aren't supported", node);
  }
  const message = argumentNodes.at(held.length);
  const value =
    message === undefined
      ? string("")
      : getTypeNames(context.checker.getTypeAtLocation(message), context.checker)?.includes(
            "undefined",
          ) !== false
        ? share(translateExpression(message, scope, context), "message", context, (shared) =>
            ifExpression(apply("=", [shared, getUndefined(context)]), string(""), shared),
          )
        : translateExpression(message, scope, context);
  if (native === classes[0]) includeError(native.name, context);
  const identity = scope.allocated.get(node);
  return record("Record", [
    { name: "constructor", value: getConstructor(classes[0], context) },
    ...(identity === undefined ? [] : [{ name: "identity", value: identity }]),
    { name: "message", value },
    { name: "name", value: string(native.name) },
    ...held.map((name, position) => {
      const argument = argumentNodes.at(position);
      return {
        name,
        value:
          argument === undefined
            ? getUndefined(context)
            : translateExpression(argument, scope, context),
      };
    }),
  ]);
};

// A caught value, or what a SuppressedError holds, which may be any value.
const isCaught = (node: ts.Expression, context: Context): boolean => {
  const declaration = getSymbol(node, context.checker)?.valueDeclaration;
  if (
    ts.isPropertyAccessExpression(node) &&
    ["error", "suppressed"].includes(node.name.text) &&
    getErrorClass(
      context.checker.getTypeAtLocation(node.expression).getSymbol(),
      context.checker,
    )?.at(-2)?.name === "SuppressedError"
  ) {
    return true;
  }
  if (!ts.isIdentifier(node) || declaration === undefined) return false;
  if (ts.isVariableDeclaration(declaration)) return ts.isCatchClause(declaration.parent);
  // A promise's value or reason, which a handler that then or catch takes gets.
  const handler = declaration.parent;
  const call = ts.findAncestor(
    handler.parent,
    (ancestor) => !ts.isParenthesizedExpression(ancestor) && !ts.isAsExpression(ancestor),
  );
  return (
    ts.isParameter(declaration) &&
    (ts.isArrowFunction(handler) || ts.isFunctionExpression(handler)) &&
    call !== undefined &&
    ts.isCallExpression(call) &&
    ts.isPropertyAccessExpression(call.expression) &&
    ["then", "catch"].includes(call.expression.name.text) &&
    context.checker.getTypeAtLocation(call.expression.expression).getSymbol()?.name === "Promise"
  );
};

// A caught value without a type, or a property of one, whose reads Get runs, as it may be any value.
export const isCaughtRead = (node: ts.Expression, context: Context): boolean =>
  (context.checker.getTypeAtLocation(node).flags & ts.TypeFlags.Any) !== 0 &&
  (isCaught(node, context) ||
    ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      isCaughtRead(node.expression, context)));

// A value of a native error's type, such as a caught one that a cast or a narrowing reads as an
// error, which may be an object that the heap holds as well as an error that stays a record.
export const isNativeErrorValue = (node: ts.Expression, context: Context) => {
  const symbol = context.checker
    .getNonNullableType(context.checker.getTypeAtLocation(node))
    .getSymbol();
  return symbol !== undefined && isNative(symbol);
};

const getSubclasses = (node: ts.Node, symbol: ts.Symbol, context: Context) => {
  const found = new Map<ts.Symbol, Expression>();
  const visit = (child: ts.Node) => {
    [
      ts.isNewExpression(child) ? getSymbol(child.expression, context.checker) : undefined,
      ...getEngineErrors(child, context).map((thrown) => getNative(thrown, child, context)),
    ].forEach((created) => {
      const classes = getErrorClass(created, context.checker);
      if (classes?.includes(symbol)) found.set(classes[0], getConstructor(classes[0], context));
    });
    ts.forEachChild(child, visit);
  };
  visit(node.getSourceFile());
  return [...found.values()];
};

// F[Symbol.hasInstance](value) of a function that the heap holds, which runs Function.prototype's
// @@hasInstance where F keeps it: OrdinaryHasInstance, whose F's prototype must be an object.
export const translateHasInstanceCall = (
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
) => {
  const receiver = getHasInstanceReceiver(node, context);
  const argument = node.arguments.at(0);
  if (
    receiver === undefined ||
    getHeapClass(receiver, context) === undefined ||
    node.arguments.length !== 1 ||
    argument === undefined ||
    ts.isSpreadElement(argument)
  ) {
    return undefined;
  }
  const heap = getHeap(scope, node, context);
  const constructor = translateExpression(receiver, scope, context);
  return share(
    useJavaScript("Get", [heap, constructor, string("prototype")], context),
    "prototype",
    context,
    (prototype) =>
      ifExpression(
        useJavaScript(
          "HoldsBuiltIn",
          [
            heap,
            constructor,
            useJavaScript("WellKnownSymbol", [string("hasInstance")], context),
            string("Function.prototype.@@hasInstance"),
          ],
          context,
        ),
        ifExpression(
          useJavaScript("IsRef", [prototype], context),
          useJavaScript(
            "InheritsFrom",
            [heap, prototype, translateExpression(argument, scope, context)],
            context,
          ),
          apply("Assert", [
            boolean(false),
            string("tla-ts can't throw the TypeError of a prototype that isn't an object"),
          ]),
        ),
        apply("Assert", [
          boolean(false),
          string("tla-ts can't call a Symbol.hasInstance that a script defined"),
        ]),
      ),
  );
};

export const translateInstanceOf = (node: ts.BinaryExpression, scope: Scope, context: Context) => {
  const rightClasses = getErrorClass(getSymbol(node.right, context.checker), context.checker);
  const isHeapClass = getHeapClass(node.right, context) !== undefined;
  const isObject = getKind(node.left, context) === "object";
  // An object on the heap, such as an error that it holds, is an instance where the constructor's
  // prototype is on its chain, and a value that may not be an object is one only where it is.
  if (isHeapClass || (rightClasses !== undefined && isNative(rightClasses[0]) && isObject)) {
    const heap = getHeap(scope, node, context);
    const prototype = useJavaScript(
      "Get",
      [heap, translateExpression(node.right, scope, context), string("prototype")],
      context,
    );
    return isObject
      ? useJavaScript(
          "IsPrototypeOf",
          [heap, prototype, translateObjectValue(node.left, scope, context)],
          context,
        )
      : useJavaScript(
          "InheritsFrom",
          [heap, prototype, translateExpression(node.left, scope, context)],
          context,
        );
  }
  // A generator function whose prototype object the heap holds, and whose @@hasInstance is
  // Function.prototype's, which a script can't change.
  const generatorPrototype = getGeneratorPrototypeRef(node.right, context);
  if (generatorPrototype !== undefined) {
    return useJavaScript(
      isGeneratorType(node.left, context) ? "GeneratorInheritsFrom" : "InheritsFrom",
      [
        getHeap(scope, node, context),
        generatorPrototype,
        translateExpression(node.left, scope, context),
      ],
      context,
    );
  }
  const symbol = getSymbol(node.right, context.checker);
  const classes = getErrorClass(symbol, context.checker);
  const builtIn =
    classes === undefined ? translateBuiltInInstanceOf(node, scope, context) : undefined;
  if (builtIn !== undefined) return builtIn;
  if (symbol === undefined || classes === undefined) {
    throw new TlaTypeScriptError(`Unsupported instanceof: ${node.right.getText()}`, node);
  }
  const value = translateExpression(node.left, scope, context);
  const subclasses = set(getSubclasses(node, classes[0], context));
  if (getErrorClass(context.checker.getTypeAtLocation(node.left).getSymbol(), context.checker)) {
    return apply("\\in", [field(value, "constructor"), subclasses]);
  }
  // A value of type unknown or any, such as a parameter's, may be any value, as a caught one may.
  const isAnyValue =
    (context.checker.getTypeAtLocation(node.left).flags &
      (ts.TypeFlags.Unknown | ts.TypeFlags.Any)) !==
    0;
  if (!isAnyValue && !isCaught(node.left, context)) {
    throw new TlaTypeScriptError("instanceof needs an error or a value of any type", node);
  }
  if (context.heap === undefined) return useJavaScript("IsErrorOf", [value, subclasses], context);
  // An object on the heap is a native error class's instance where its prototype is on the chain.
  if (isNative(classes[0])) {
    const heap = getHeap(scope, node, context);
    return share(value, "caught", context, (caught) =>
      ifExpression(
        useJavaScript("IsRef", [caught], context),
        useJavaScript(
          "IsPrototypeOf",
          [
            heap,
            useJavaScript(
              "Get",
              [heap, translateExpression(node.right, scope, context), string("prototype")],
              context,
            ),
            caught,
          ],
          context,
        ),
        useJavaScript("IsErrorOf", [caught, subclasses], context),
      ),
    );
  }
  // Every error class's prototype inherits from Error.prototype, so an object on the heap that
  // doesn't is no error's instance. tla-ts doesn't tell the class of one that does.
  return share(value, "caught", context, (caught) =>
    useJavaScript(
      "IsInstanceOfError",
      [getHeap(scope, node, context), caught, subclasses, string(node.right.getText())],
      context,
    ),
  );
};

export const translateThrown = (node: ts.Expression, scope: Scope, context: Context) => {
  const type = context.checker.getTypeAtLocation(node);
  const names = getTypeNames(type, context.checker);
  const isPrimitive = names?.every((name) => name !== "object" && name !== "function") === true;
  // An object on the heap keeps its identity as a thrown value, as its ref. A name that only an
  // object literal gives holds one, though its type, such as {}, may fit primitives.
  const declaration = ts.isIdentifier(node)
    ? getSymbol(node, context.checker)?.valueDeclaration
    : undefined;
  const initializer =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : undefined;
  const isHeapObject =
    getKind(node, context) === "object" &&
    (names?.every((name) => name === "object") === true ||
      (initializer !== undefined &&
        ts.isObjectLiteralExpression(initializer) &&
        getLiteralName(initializer, context) !== undefined));
  if (
    !isPrimitive &&
    !isHeapObject &&
    getErrorClass(type.getSymbol(), context.checker) === undefined &&
    !isCaught(node, context)
  ) {
    throw new TlaTypeScriptError("Throw an error or a primitive", node);
  }
  return translateExpression(node, scope, context);
};
