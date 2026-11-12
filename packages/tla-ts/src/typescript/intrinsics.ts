import ts from "@typescript/typescript6";
import { type Context, findNodes, getSymbol, getUndefined, isAssigned, share } from "./context";
import { TlaTypeScriptError } from "../errors";
import {
  getArrayIteratorCall,
  translateArrayIteratorPrototype,
  translateHoldsIteratorMethod,
} from "./collections";
import { getConstructor, getErrorClass, NATIVE_ERRORS } from "./exceptions";
import { getNumberValue, translateExpression } from "./expressions";
import { getHeap } from "./heap";
import { useJavaScript, WELL_KNOWN_SYMBOLS } from "./javascript";
import type { Scope } from "./scope";
import type { Expression } from "../ast";
import { BUILT_INS } from "./built-ins";
import {
  apply,
  boolean,
  functionFrom,
  identifier,
  ifExpression,
  number,
  record,
  set,
  string,
  tuple,
} from "./tla";
import { getCollection, getKind } from "./types";

// Built-in constructors, besides the errors, whose prototype objects tla-ts compiles to
// constants, which compare by identity.
// A global that names a built-in object, such as Math or Array.
const isGlobal = (name: string) => !/[.%\s]/.test(name) && Object.hasOwn(BUILT_INS, name);

const isLibrary = (symbol: ts.Symbol) =>
  (symbol.declarations ?? []).length > 0 &&
  (symbol.declarations ?? []).every((declaration) => declaration.getSourceFile().isDeclarationFile);

export const getBuiltIn = (node: ts.Expression, context: Context) => {
  const symbol = getSymbol(node, context.checker);
  return ts.isIdentifier(node) && isGlobal(node.text) && symbol !== undefined && isLibrary(symbol)
    ? node.text
    : undefined;
};

// The prototype of a built-in object, which "null" names.
const getParent = (name: string) => {
  const entry = BUILT_INS[name];
  if (entry === undefined) throw new TlaTypeScriptError(`Unknown built-in: ${name}`);
  return entry[0] ?? "null";
};

// The prototype of the functions that a script declares with a type, by their kind: plain, a
// generator, async, or an async generator. Methods and accessors aren't among them.
const getFunctionPrototype = (type: ts.Type) => {
  const prototypes = new Set(
    type.getCallSignatures().map((signature) => {
      const declaration = signature.getDeclaration();
      if (
        declaration.getSourceFile().isDeclarationFile ||
        !(
          ts.isArrowFunction(declaration) ||
          ts.isFunctionExpression(declaration) ||
          ts.isFunctionDeclaration(declaration)
        )
      ) {
        return undefined;
      }
      const isAsync = (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Async) !== 0;
      if (declaration.asteriskToken !== undefined) {
        return isAsync ? "%AsyncGeneratorFunction%.prototype" : "%GeneratorFunction%.prototype";
      }
      return isAsync ? "%AsyncFunction%.prototype" : "Function.prototype";
    }),
  );
  return prototypes.size === 1 && type.getConstructSignatures().length === 0
    ? [...prototypes][0]
    : undefined;
};

// The object and the key that a read names, as BUILT_INS writes it: a property's name, or a
// well-known symbol's, as "@@iterator".
const getBuiltInKey = (node: ts.Expression, context: Context) => {
  if (ts.isPropertyAccessExpression(node) && !ts.isPrivateIdentifier(node.name)) {
    return { owner: node.expression, name: node.name.text };
  }
  const symbol =
    ts.isElementAccessExpression(node) && ts.isPropertyAccessExpression(node.argumentExpression)
      ? node.argumentExpression
      : undefined;
  return symbol !== undefined &&
    ts.isElementAccessExpression(node) &&
    getBuiltIn(symbol.expression, context) === "Symbol" &&
    WELL_KNOWN_SYMBOLS.includes(symbol.name.text)
    ? { owner: node.expression, name: `@@${symbol.name.text}` }
    : undefined;
};

// The built-in object that a node is, by its path in BUILT_INS, such as "Array.prototype".
const getName = (node: ts.Expression, context: Context): string | undefined => {
  if (ts.isParenthesizedExpression(node)) return getName(node.expression, context);
  const builtIn = getBuiltIn(node, context);
  if (builtIn !== undefined) return builtIn;
  // A read in the block that declares the variable, outside any function there, runs after the
  // declaration.
  const held = getHeldBuiltIn(node, context);
  const statement = held?.parent.parent.parent;
  if (
    held !== undefined &&
    statement !== undefined &&
    ts.isVariableStatement(statement) &&
    ts.findAncestor(node, (ancestor) => ancestor === statement.parent) !== undefined &&
    ts.findAncestor(node, ts.isFunctionLike) === ts.findAncestor(held, ts.isFunctionLike)
  ) {
    return getName(held, context);
  }
  const key = getBuiltInKey(node, context);
  if (key !== undefined) {
    const owner = getName(key.owner, context);
    const property =
      owner === undefined
        ? undefined
        : BUILT_INS[owner]?.[3].find((entry) => entry[0] === key.name && entry.length === 3);
    return property?.[2].startsWith("o") ? property[2].slice(1) : undefined;
  }
  if (isPrototypeCall(node, context)) {
    const parent = getPrototype(node.arguments[0], context);
    return parent === "null" ? undefined : parent;
  }
  return undefined;
};

// A call that makes one of the built-in iterators that no global reaches, from a receiver written
// in place, which holds no method of its own: the iterator's prototype, and the built-in object and
// the key that the call reads its method from.
const getIteratorCall = (node: ts.Expression, context: Context) => {
  if (context.heap === undefined || !ts.isCallExpression(node)) return undefined;
  const read = getBuiltInKey(node.expression, context);
  if (read === undefined) return undefined;
  const key = read.name;
  const receiver = read.owner;
  const constructed =
    ts.isNewExpression(receiver) && (receiver.arguments ?? []).length === 0
      ? getBuiltIn(receiver.expression, context)
      : undefined;
  const isEmpty = node.arguments.length === 0;
  const owner =
    (ts.isStringLiteralLike(receiver) || constructed === "String") &&
    key === "@@iterator" &&
    isEmpty
      ? "String"
      : (constructed === "Map" || constructed === "Set") &&
          ["@@iterator", "keys", "values", "entries"].includes(key) &&
          isEmpty
        ? constructed
        : ts.isRegularExpressionLiteral(receiver) &&
            key === "@@matchAll" &&
            node.arguments.length === 1 &&
            ts.isStringLiteralLike(node.arguments[0])
          ? "RegExp"
          : undefined;
  return owner === undefined
    ? undefined
    : {
        prototype: `%${owner === "RegExp" ? "RegExpString" : owner}IteratorPrototype%`,
        owner,
        key,
      };
};

// The prototype object of a generator function that a script writes in place, or declares and only
// calls and asks for its prototype and for the prototype of that object, so that the object is the
// one the function starts with, which inherits from the built-in one.
const getGeneratorObjectPrototype = (node: ts.Expression, context: Context) => {
  if (!ts.isPropertyAccessExpression(node) || node.name.text !== "prototype") return undefined;
  const owner = ts.isParenthesizedExpression(node.expression)
    ? node.expression.expression
    : node.expression;
  const checker = context.checker;
  const prototype = getFunctionPrototype(checker.getTypeAtLocation(owner));
  const symbol = ts.isIdentifier(owner) ? getSymbol(owner, checker) : undefined;
  const isUntouched =
    ts.isFunctionExpression(owner) ||
    (symbol !== undefined &&
      findNodes(node.getSourceFile(), ts.isIdentifier).every((reference) => {
        const parent = reference.parent;
        return (
          getSymbol(reference, checker) !== symbol ||
          ((ts.isFunctionDeclaration(parent) || ts.isVariableDeclaration(parent)) &&
            parent.name === reference) ||
          (ts.isCallExpression(parent) && parent.expression === reference) ||
          (isPrototypeCall(parent, context) && parent.arguments[0] === reference) ||
          (ts.isPropertyAccessExpression(parent) &&
            parent.name.text === "prototype" &&
            isPrototypeCall(parent.parent, context) &&
            parent.parent.arguments[0] === parent)
        );
      }));
  return isUntouched &&
    (prototype === "%GeneratorFunction%.prototype" ||
      prototype === "%AsyncGeneratorFunction%.prototype")
    ? `${prototype}.prototype`
    : undefined;
};

// The built-in object that is the prototype of a node's value, or "null".
const getPrototype = (node: ts.Expression, context: Context): string | undefined => {
  const name = getName(node, context);
  if (name !== undefined) return getParent(name);
  const checker = context.checker;
  const type = checker.getTypeAtLocation(node);
  if (type.isUnion()) return undefined;
  if (type.flags & ts.TypeFlags.NumberLike) return "Number.prototype";
  if (type.flags & ts.TypeFlags.StringLike) return "String.prototype";
  if (type.flags & ts.TypeFlags.BooleanLike) return "Boolean.prototype";
  if (type.flags & ts.TypeFlags.BigIntLike) return "BigInt.prototype";
  if (getArrayIteratorCall(node, context)?.kind !== undefined && !context.hasInheritedElements) {
    return "%ArrayIteratorPrototype%";
  }
  const iteratorCall = getIteratorCall(node, context);
  if (iteratorCall !== undefined) return iteratorCall.prototype;
  const generatorPrototype = getGeneratorObjectPrototype(node, context);
  if (generatorPrototype !== undefined) return generatorPrototype;
  const kind = getKind(node, context);
  if (kind === "object") return undefined;
  if (kind === "sequence") return "Array.prototype";
  const collection = getCollection(node, context);
  if (collection !== undefined) return `${collection}.prototype`;
  const classes = getErrorClass(type.getSymbol(), checker);
  if (classes !== undefined) {
    return NATIVE_ERRORS.has(classes[0].name) && isLibrary(classes[0])
      ? `${classes[0].name}.prototype`
      : undefined;
  }
  const functionPrototype = getFunctionPrototype(type);
  if (functionPrototype !== undefined) return functionPrototype;
  return (type.getSymbol()?.flags ?? 0) & ts.SymbolFlags.ObjectLiteral
    ? "Object.prototype"
    : undefined;
};

// left instanceof C, where C is a built-in constructor other than an error, while C keeps
// Function.prototype's @@hasInstance. A value off the heap has the prototype its type tells.
export const translateBuiltInInstanceOf = (
  node: ts.BinaryExpression,
  scope: Scope,
  context: Context,
) => {
  const name = getBuiltIn(node.right, context);
  if (name === undefined || context.heap === undefined || BUILT_INS[name]?.[4] !== true) {
    return undefined;
  }
  const left = node.left;
  const type = context.checker.getTypeAtLocation(left);
  const isPrimitive =
    !type.isUnion() &&
    (type.flags &
      (ts.TypeFlags.NumberLike |
        ts.TypeFlags.StringLike |
        ts.TypeFlags.BooleanLike |
        ts.TypeFlags.BigIntLike |
        ts.TypeFlags.ESSymbolLike |
        ts.TypeFlags.Undefined |
        ts.TypeFlags.Null)) !==
      0;
  const isObject = getKind(left, context) === "object";
  const parent = isPrimitive || isObject ? undefined : getPrototype(left, context);
  // A value of type unknown or any may be anything, which only the run can tell.
  const isUnknown =
    !isPrimitive && !isObject && (type.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any)) !== 0;
  if (!isPrimitive && !isObject && !isUnknown && (parent === undefined || parent === "null")) {
    return undefined;
  }
  const heap = getHeap(scope, node, context);
  const constructor = translateBuiltIn(name, node.right, scope, context);
  const prototype = useJavaScript("Get", [heap, constructor, string("prototype")], context);
  const found = (value: Expression) => {
    if (isPrimitive) return boolean(false);
    if (isObject) return useJavaScript("IsPrototypeOf", [heap, prototype, value], context);
    if (isUnknown) return useJavaScript("InheritsFrom", [heap, prototype, value], context);
    const inherited = translateBuiltIn(parent ?? "null", left, scope, context);
    return apply("\\/", [
      useJavaScript("SameValue", [inherited, prototype], context),
      useJavaScript("IsPrototypeOf", [heap, prototype, inherited], context),
    ]);
  };
  return share(translateExpression(left, scope, context), "value", context, (value) =>
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
      ifExpression(apply("=", [value, value]), found(value), boolean(false)),
      apply("Assert", [
        boolean(false),
        string("tla-ts can't call a Symbol.hasInstance that a script defined"),
      ]),
    ),
  );
};

export const isBuiltInObject = (node: ts.Expression, context: Context) =>
  getName(node, context) !== undefined;

// The built-in object that a variable only ever holds, where TypeScript types it as any, such as
// the prototype of a generator function that getPrototypeOf gives, for a read after the variable's
// declaration.
const getHeldBuiltIn = (node: ts.Expression, context: Context) => {
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  const initializer =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : undefined;
  return context.heap !== undefined &&
    symbol !== undefined &&
    initializer !== undefined &&
    node.pos > initializer.end &&
    (context.checker.getTypeAtLocation(initializer).flags & ts.TypeFlags.Any) !== 0 &&
    isBuiltInObject(initializer, context) &&
    !isAssigned(symbol, node.getSourceFile(), context)
    ? initializer
    : undefined;
};

export const isHeldBuiltInObject = (node: ts.Expression, context: Context) =>
  getHeldBuiltIn(node, context) !== undefined;

// A built-in object that a built-in function takes, such as the prototype Object.create takes.
export const translateBuiltInObject = (node: ts.Expression, scope: Scope, context: Context) => {
  const name = getName(node, context);
  return name === undefined ? undefined : translateBuiltIn(name, node, scope, context);
};

// Object.getPrototypeOf, or Reflect's of an object, which only differs where the value isn't one.
const isPrototypeCall = (node: ts.Node, context: Context): node is ts.CallExpression =>
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "getPrototypeOf" &&
  node.arguments.length === 1 &&
  (getBuiltIn(node.expression.expression, context) === "Object" ||
    (getBuiltIn(node.expression.expression, context) === "Reflect" &&
      (getKind(node.arguments[0], context) === "object" ||
        isBuiltInObject(node.arguments[0], context))));

const isPrototypeOfCall = (node: ts.Node): node is ts.CallExpression =>
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "isPrototypeOf" &&
  node.arguments.length === 1;

// Whether a value is only compared where it appears, so a built-in object's constant can stand for
// it, since TLA+ can't read its properties.
const isCompared = (node: ts.Expression, context: Context): boolean => {
  const parent = node.parent;
  if (ts.isParenthesizedExpression(parent)) return isCompared(parent, context);
  if (ts.isBinaryExpression(parent)) {
    return [
      ts.SyntaxKind.EqualsEqualsEqualsToken,
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ts.SyntaxKind.EqualsEqualsToken,
      ts.SyntaxKind.ExclamationEqualsToken,
    ].includes(parent.operatorToken.kind);
  }
  if (ts.isVariableDeclaration(parent) && parent.initializer === node) {
    const name = parent.name;
    if (!ts.isIdentifier(name)) return false;
    const symbol = getSymbol(name, context.checker);
    const references: ts.Identifier[] = [];
    const visit = (child: ts.Node) => {
      if (
        ts.isIdentifier(child) &&
        child !== name &&
        getSymbol(child, context.checker) === symbol
      ) {
        references.push(child);
      }
      ts.forEachChild(child, visit);
    };
    visit(node.getSourceFile());
    return references.every(
      (reference) =>
        (ts.isBinaryExpression(reference.parent) &&
          reference.parent.left === reference &&
          reference.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) ||
        isCompared(reference, context),
    );
  }
  if (isPrototypeCall(parent, context)) return true;
  if (isPrototypeOfCall(parent)) return true;
  if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
    return isPrototypeOfCall(parent.parent) && parent.parent.expression === parent;
  }
  if (ts.isCallExpression(parent) && parent.arguments.includes(node)) {
    const signature = context.checker.getResolvedSignature(parent);
    const position = parent.arguments.indexOf(node);
    const parameter = signature?.getParameters()[position];
    const parameterType =
      parameter === undefined ? undefined : context.checker.getTypeOfSymbol(parameter);
    return (
      ((parameterType?.flags ?? 0) & ts.TypeFlags.Unknown ||
        (ts.isPropertyAccessExpression(parent.expression) &&
          getBuiltIn(parent.expression.expression, context) === "Object" &&
          parent.expression.name.text === "is")) !== 0
    );
  }
  return false;
};

const getGlobal = (name: string, node: ts.Node, context: Context) => {
  const symbol = context.checker
    .getSymbolsInScope(node.getSourceFile(), ts.SymbolFlags.Value)
    .find((candidate) => candidate.name === name && isLibrary(candidate));
  if (symbol === undefined) throw new TlaTypeScriptError(`Unknown built-in: ${name}`, node);
  return symbol;
};

const isGlobalFunction = (name: string) => isGlobal(name) && BUILT_INS[name][1];

// A built-in constructor is a model value, as error constructors are. Function.prototype is one
// too, as it's a function, and other built-in objects are references by their paths, which no
// object a program makes has.
const getBuiltInValue = (name: string, node: ts.Node, context: Context) => {
  if (isGlobalFunction(name)) return getConstructor(getGlobal(name, node, context), context);
  if (name === "Function.prototype") {
    const prototype = context.checker
      .getTypeOfSymbol(getGlobal("Function", node, context))
      .getProperty("prototype");
    if (prototype === undefined) throw new TlaTypeScriptError("Unknown built-in", node);
    return getConstructor(prototype, context, "FunctionPrototype");
  }
  return useJavaScript(":>", [identifier("Ref"), string(name)], context);
};

export type Collection = "Set" | "Map" | "WeakMap" | "WeakSet";

// A built-in that the compiler names itself: Function.prototype, which the constructor object of a
// class inherits from, Array.prototype, which an array that the heap holds inherits from, Array,
// which the methods that make arrays expect as the constructor of the array they copy, or
// %ThrowTypeError%, the callee of an arguments object, which Node records as a getter's path, or
// the prototype of a wrapper object.
export const translateBuiltInValue = (
  name:
    | "Function.prototype"
    | "Function.prototype.bind"
    | "Array.prototype"
    | "Object.prototype"
    | "Array"
    | `get ${string}`
    | "Object"
    | "Boolean"
    | "Number"
    | "String"
    | "Boolean.prototype"
    | "BigInt.prototype"
    | "Number.prototype"
    | "String.prototype"
    | `String.prototype.${string}`
    | "Date.prototype"
    | "DisposableStack.prototype"
    | "AsyncDisposableStack.prototype"
    | "RegExp.prototype"
    | "ArrayBuffer"
    | "SharedArrayBuffer"
    | "DataView"
    | `${string}Array`
    | `${string}Buffer.prototype`
    | `${string}Array.prototype`
    | "DataView.prototype"
    | "Symbol.prototype"
    | "Iterator.prototype"
    | "%ArrayIteratorPrototype%"
    | "%GeneratorFunction%.prototype"
    | "%GeneratorFunction%.prototype.prototype"
    | "Promise"
    | "Promise.prototype"
    | "JSON"
    | `${Collection}.prototype${string}`,
  node: ts.Node,
  context: Context,
) => {
  context.builtIns.add(name);
  return getBuiltInValue(name, node, context);
};

// A symbol's toString(), valueOf(), or description, which the heap's Symbol.prototype must still
// hold the built-in of.
export const translateSymbolProperty = (
  receiver: ts.Expression,
  name: "toString" | "valueOf" | "description",
  node: ts.Node,
  scope: Scope,
  context: Context,
) =>
  useJavaScript(
    "SymbolProperty",
    [
      getHeap(scope, node, context),
      translateExpression(receiver, scope, context),
      translateBuiltInValue("Symbol.prototype", node, context),
      string(name),
    ],
    context,
  );

// A built-in object. A script may change a property that a path to one reads, so a script reads
// the path from its heap, unless the property can't change.
const translateBuiltIn = (
  name: string,
  node: ts.Expression,
  scope: Scope,
  context: Context,
): Expression => {
  if (name === "null") {
    context.prelude.add("Null");
    return identifier("Null");
  }
  if (context.heap === undefined) return getBuiltInValue(name, node, context);
  context.builtIns.add(name);
  const iteratorCall = getStartingIteratorCall(node, context);
  if (iteratorCall !== undefined) {
    const prototype = `${iteratorCall.owner}.prototype`;
    context.builtIns.add(prototype);
    const method = BUILT_INS[prototype][3]
      .find((property) => property[0] === iteratorCall.key)?.[2]
      .slice(1);
    const heap = getHeap(scope, node, context);
    // A regexp's @@matchAll also reads RegExp's @@species and RegExp.prototype's flags.
    const holds =
      iteratorCall.owner === "RegExp"
        ? useJavaScript(
            "RegExpFresh",
            [
              heap,
              boolean(true),
              set([getBuiltInValue("RegExp", node, context), string(prototype)]),
            ],
            context,
          )
        : useJavaScript(
            "HoldsBuiltIn",
            [
              heap,
              getBuiltInValue(prototype, node, context),
              iteratorCall.key.startsWith("@@")
                ? useJavaScript("WellKnownSymbol", [string(iteratorCall.key.slice(2))], context)
                : string(iteratorCall.key),
              string(method ?? iteratorCall.key),
            ],
            context,
          );
    return ifExpression(
      holds,
      translateBuiltInPath(name, node, scope, context),
      apply("Assert", [
        boolean(false),
        string(`tla-ts can't make an iterator where a script replaced ${prototype}'s method`),
      ]),
    );
  }
  return translateBuiltInPath(name, node, scope, context);
};

// The iterator call that a chain of reads and getPrototypeOf calls starts from.
const getStartingIteratorCall = (
  node: ts.Expression,
  context: Context,
): ReturnType<typeof getIteratorCall> => {
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node)
  ) {
    return getStartingIteratorCall(node.expression, context);
  }
  return isPrototypeCall(node, context)
    ? (getIteratorCall(node.arguments[0], context) ??
        getStartingIteratorCall(node.arguments[0], context))
    : undefined;
};

const translateBuiltInPath = (
  name: string,
  node: ts.Expression,
  scope: Scope,
  context: Context,
): Expression => {
  const key = getBuiltInKey(ts.isParenthesizedExpression(node) ? node.expression : node, context);
  if (key === undefined || context.heap === undefined || !scope.bindings.has(context.heap)) {
    return getBuiltInValue(name, node, context);
  }
  const owner = getName(key.owner, context);
  const flags =
    owner === undefined
      ? undefined
      : BUILT_INS[owner][3].find((property) => property[0] === key.name)?.[1];
  if (owner === undefined || flags === undefined || !/[wc]/.test(flags)) {
    return getBuiltInValue(name, node, context);
  }
  return useJavaScript(
    "Get",
    [
      getHeap(scope, node, context),
      translateBuiltIn(owner, key.owner, scope, context),
      key.name.startsWith("@@")
        ? useJavaScript("WellKnownSymbol", [string(key.name.slice(2))], context)
        : string(key.name),
    ],
    context,
  );
};

// A property's value from BUILT_INS, or undefined for one TLA+ can't represent.
const translateBuiltInProperty = (value: string, node: ts.Node, context: Context) => {
  const payload = value.slice(1);
  if (value.startsWith("o")) return getBuiltInValue(payload, node, context);
  if (value.startsWith("s")) return string(payload);
  if (value.startsWith("b")) return boolean(payload === "true");
  if (value === "u") return getUndefined(context);
  if (value === "l") return identifier("Null");
  return value.startsWith("n") ? getNumberValue(Number(payload), context) : undefined;
};

// The built-in objects that a script's heap holds: those the script names, and their prototypes.
export const translateBuiltIns = (node: ts.Node, context: Context) => {
  const included = new Set<string>();
  const include = (name: string | null) => {
    const entry = name === null ? undefined : BUILT_INS[name];
    if (name === null || entry === undefined || included.has(name)) return;
    included.add(name);
    include(entry[0]);
  };
  ["Object.prototype", ...context.builtIns].forEach(include);
  // The objects that the included objects' properties hold, which typeof needs to tell apart.
  const referenced = new Set(
    [...included].flatMap((name) =>
      BUILT_INS[name][3].flatMap((property) =>
        property
          .slice(2)
          .filter((value) => value.startsWith("o") && !included.has(value.slice(1)))
          .map((value) => value.slice(1)),
      ),
    ),
  );
  const getKey = (name: string) => {
    const value = getBuiltInValue(name, node, context);
    return value.kind === "Identifier" ? value : string(name);
  };
  const stubs = [...referenced].map((name): [Expression, Expression] => [
    getKey(name),
    record("Record", [
      { name: "isCallable", value: boolean(BUILT_INS[name][1]) },
      { name: "isConstructor", value: boolean(BUILT_INS[name][4]) },
      { name: "isOpaque", value: boolean(true) },
    ]),
  ]);
  return functionFrom([
    ...stubs,
    ...[...included].map((name): [Expression, Expression] => {
      const entry = BUILT_INS[name];
      const properties = entry[3];
      const getAttributes = (flags: string, kind: string) =>
        record("Record", [
          { name: "writable", value: boolean(flags.includes("w")) },
          { name: "enumerable", value: boolean(flags.includes("e")) },
          { name: "configurable", value: boolean(flags.includes("c")) },
          { name: "kind", value: string(kind) },
        ]);
      const translated = properties.map((property) => {
        const key = property[0].startsWith("@@")
          ? useJavaScript("WellKnownSymbol", [string(property[0].slice(2))], context)
          : string(property[0]);
        const flags = property[1];
        if (property.length === 4) {
          const accessor = record("Record", [
            {
              name: "get",
              value: translateBuiltInProperty(property[2], node, context) ?? getUndefined(context),
            },
            {
              name: "set",
              value: translateBuiltInProperty(property[3], node, context) ?? getUndefined(context),
            },
          ]);
          return { key, value: accessor, attributes: getAttributes(flags, "accessor") };
        }
        const value =
          name === "Symbol" && WELL_KNOWN_SYMBOLS.includes(property[0])
            ? useJavaScript("WellKnownSymbol", [string(property[0])], context)
            : translateBuiltInProperty(property[2], node, context);
        return {
          key,
          value: value ?? getUndefined(context),
          attributes: getAttributes(flags, value === undefined ? "opaque" : "data"),
        };
      });
      const prototype = entry[0];
      const object = record("Record", [
        { name: "keys", value: tuple(translated.map((property) => property.key)) },
        {
          name: "values",
          value: functionFrom(translated.map((property) => [property.key, property.value])),
        },
        {
          name: "attributes",
          value: functionFrom(translated.map((property) => [property.key, property.attributes])),
        },
        { name: "extensible", value: boolean(entry[2]) },
        {
          name: "prototype",
          value:
            prototype === null ? identifier("Null") : getBuiltInValue(prototype, node, context),
        },
        { name: "isCallable", value: boolean(entry[1]) },
        { name: "isConstructor", value: boolean(entry[4]) },
        { name: "isOpaque", value: boolean(false) },
      ]);
      return [getKey(name), object];
    }),
  ]);
};

// Evaluates the value whose prototype a call asks for, which mustn't call anything that could
// throw, since only its type decides the result.
const evaluate = (node: ts.Expression, scope: Scope, context: Context) => {
  const visit = (child: ts.Node) => {
    if (ts.isFunctionLike(child)) return;
    const isBuiltInNew =
      ts.isNewExpression(child) && getBuiltIn(child.expression, context) !== undefined;
    if (
      (ts.isCallExpression(child) &&
        !isPrototypeCall(child, context) &&
        getIteratorCall(child, context) === undefined) ||
      (ts.isNewExpression(child) && !isBuiltInNew)
    ) {
      throw new TlaTypeScriptError("Pass getPrototypeOf a value without calls", child);
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  if (
    !ts.isFunctionLike(node) &&
    getIteratorCall(node, context) === undefined &&
    getGeneratorObjectPrototype(node, context) === undefined
  ) {
    translateExpression(node, scope, context);
  }
};

// A built-in object, or Object.getPrototypeOf or isPrototypeOf on built-in objects, or undefined
// for any other node.
export const translateIntrinsic = (node: ts.Expression, scope: Scope, context: Context) => {
  // The prototype of an array iterator that a call makes, which nothing else can read.
  const iteratorCall = isPrototypeCall(node, context)
    ? getArrayIteratorCall(node.arguments[0], context)
    : undefined;
  if (iteratorCall?.kind !== undefined) {
    return share(
      translateExpression(iteratorCall.receiver, scope, context),
      "array",
      context,
      (array) =>
        ifExpression(
          translateHoldsIteratorMethod(iteratorCall, getHeap(scope, node, context), array, context),
          translateArrayIteratorPrototype(node, context),
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't call ${iteratorCall.path} where a script replaced it`),
          ]),
        ),
    );
  }
  // A script's heap holds the built-in objects it names, which its statements may change.
  const isOfObject =
    (isPrototypeOfCall(node) || isPrototypeCall(node, context)) &&
    (getKind(node.arguments[0], context) === "object" ||
      (context.heap !== undefined &&
        scope.bindings.has(context.heap) &&
        isBuiltInObject(node.arguments[0], context)));
  if (isOfObject && isPrototypeOfCall(node) && ts.isPropertyAccessExpression(node.expression)) {
    const owner = node.expression.expression;
    const name = getName(owner, context);
    const translatedOwner =
      name !== undefined
        ? translateBuiltIn(name, owner, scope, context)
        : getKind(owner, context) === "object"
          ? translateExpression(owner, scope, context)
          : undefined;
    if (translatedOwner === undefined) return undefined;
    return useJavaScript(
      "IsPrototypeOf",
      [
        getHeap(scope, node, context),
        translatedOwner,
        translateBuiltInObject(node.arguments[0], scope, context) ??
          translateExpression(node.arguments[0], scope, context),
      ],
      context,
    );
  }
  if (isOfObject && isPrototypeCall(node, context)) {
    if (!isCompared(node, context) && !isBuiltInObject(node.arguments[0], context)) {
      throw new TlaTypeScriptError(
        `Compare ${node.getText()} only with === or assert.sameValue`,
        node,
      );
    }
    return useJavaScript(
      "Prototype",
      [
        getHeap(scope, node, context),
        translateBuiltInObject(node.arguments[0], scope, context) ??
          translateExpression(node.arguments[0], scope, context),
      ],
      context,
    );
  }
  if (isPrototypeOfCall(node) && ts.isPropertyAccessExpression(node.expression)) {
    const owner = getName(node.expression.expression, context);
    if (owner === undefined) return undefined;
    const first = getPrototype(node.arguments[0], context);
    if (first === undefined) {
      throw new TlaTypeScriptError("isPrototypeOf needs a value whose type tells", node);
    }
    evaluate(node.arguments[0], scope, context);
    const getChain = (name: string): string[] =>
      name === "null" ? [] : [name, ...getChain(getParent(name))];
    return boolean(getChain(first).includes(owner));
  }
  const isCall = isPrototypeCall(node, context);
  const name = isCall ? getPrototype(node.arguments[0], context) : getName(node, context);
  if (isCall && name === undefined) {
    throw new TlaTypeScriptError("getPrototypeOf needs a value whose type tells", node);
  }
  if (name === undefined || (ts.isIdentifier(node) && !isCompared(node, context))) {
    return undefined;
  }
  // A script's heap holds the built-in objects, so it can read and pass them as values, though
  // getPrototypeOf's answer here doesn't read the heap, which it needn't where nothing in the
  // script changes a prototype.
  const isOnHeap =
    context.heap !== undefined &&
    (isCall
      ? !/setPrototypeOf|__proto__/.test(node.getSourceFile().text)
      : scope.bindings.has(context.heap));
  if (!isOnHeap && !isCompared(node, context)) {
    throw new TlaTypeScriptError(
      `Compare ${node.getText()} only with === or assert.sameValue`,
      node,
    );
  }
  if (isCall) {
    evaluate(node.arguments[0], scope, context);
  }
  return translateBuiltIn(name, node, scope, context);
};

// Whether a class in a pattern holds a code unit.
type CharacterSet = (code: number) => boolean;

// A matcher of a pattern, as the spec's CompilePattern makes it, which matches code units.
type Matcher =
  | { kind: "set"; set: CharacterSet; isInverted: boolean }
  | { kind: "sequence" | "alternation"; items: Matcher[] }
  | { kind: "group"; index: number; body: Matcher }
  | {
      kind: "repeat";
      body: Matcher;
      min: number;
      max: number;
      isGreedy: boolean;
      parenIndex: number;
      parenCount: number;
    }
  | { kind: "start" | "end" }
  | { kind: "boundary"; isInverted: boolean }
  | { kind: "lookahead"; body: Matcher; isNegative: boolean }
  | { kind: "backreference"; index: number };

const LINE_TERMINATORS = [0x0a, 0x0d, 0x2028, 0x2029];

// WhiteSpace and LineTerminator, which \s matches.
const WHITE_SPACE = [
  0x09,
  0x0b,
  0x0c,
  0x20,
  0xa0,
  0xfeff,
  0x1680,
  ...Array.from({ length: 11 }, (_, offset) => 0x2000 + offset),
  0x202f,
  0x205f,
  0x3000,
  ...LINE_TERMINATORS,
];

const isDigitCode = (code: number) => code >= 0x30 && code <= 0x39;

const isWordCode = (code: number) =>
  isDigitCode(code) ||
  (code >= 0x41 && code <= 0x5a) ||
  (code >= 0x61 && code <= 0x7a) ||
  code === 0x5f;

// The characters outside ASCII whose simple case folding is in it, which \w holds with the u and i
// flags, and which Canonicalize maps to their folding.
const UNICODE_FOLDS = new Map([
  [0x17f, 0x73],
  [0x212a, 0x6b],
]);

// The sets that \d, \s, \w, and their uppercase complements match, where \w with the u and i flags
// holds the characters that fold into it.
const getClassEscape = (letter: string, isUnicodeIgnoringCase: boolean) => {
  const has = new Map<string, CharacterSet>([
    ["d", isDigitCode],
    ["s", (code) => WHITE_SPACE.includes(code)],
    ["w", (code) => isWordCode(code) || (isUnicodeIgnoringCase && UNICODE_FOLDS.has(code))],
  ]).get(letter.toLowerCase());
  if (has === undefined) return undefined;
  return letter === letter.toLowerCase() ? has : (code: number) => !has(code);
};

const CONTROL_ESCAPES = new Map([
  ["f", 0x0c],
  ["n", 0x0a],
  ["r", 0x0d],
  ["t", 0x09],
  ["v", 0x0b],
]);

const unite =
  (...sets: CharacterSet[]): CharacterSet =>
  (code) =>
    sets.some((has) => has(code));

const getCharacterSet =
  (...codes: number[]): CharacterSet =>
  (code) =>
    codes.includes(code);

// The number of capturing groups that a pattern opens and the indices of its named groups, which a
// backreference before a group may name.
const getGroups = (source: string) => {
  const names = new Map<string, number>();
  const scan = { position: 0, count: 0, isInClass: false };
  while (scan.position < source.length) {
    const character = source[scan.position];
    const rest = source.slice(scan.position);
    if (character === "[") scan.isInClass = true;
    if (character === "]") scan.isInClass = false;
    if (character === "(" && !scan.isInClass && /^\((?!\?)|^\(\?<(?![=!])/.test(rest)) {
      scan.count += 1;
      const name = /^\(\?<([^>]*)>/.exec(rest)?.[1];
      if (name !== undefined) names.set(name, scan.count);
    }
    scan.position += character === "\\" ? 2 : 1;
  }
  return { count: scan.count, names };
};

// Parses a pattern into its matchers, following the spec's grammar with Annex B's extensions for
// patterns without the u flag. TypeScript checks a literal's syntax, which tla-ts reads as valid.
const parsePattern = (source: string, flags: string, node: ts.Node) => {
  const isUnicode = flags.includes("u");
  const groups = getGroups(source);
  const cursor = { position: 0, captures: 0 };
  const peek = (offset = 0) => source.charAt(cursor.position + offset);
  const isAt = (text: string) => source.startsWith(text, cursor.position);
  const getRest = () => source.slice(cursor.position);
  const invalid = () => new TlaTypeScriptError(`Invalid regular expression: /${source}/`, node);
  const close = () => {
    if (peek() !== ")") throw invalid();
    cursor.position += 1;
  };
  // A character that the pattern writes, where tla-ts reads a pattern with the u flag by code units
  // only while it writes no surrogate, as it matches one only on text in ASCII.
  const getCode = (code: number) => {
    if (isUnicode && code >= 0xd800 && code <= 0xdfff) {
      throw new TlaTypeScriptError(
        "tla-ts can't match a character outside the Basic Multilingual Plane with the u flag",
        node,
      );
    }
    return code;
  };
  const getCharacter = (code: number): Matcher => ({
    kind: "set",
    set: getCharacterSet(getCode(code)),
    isInverted: false,
  });
  const parseDisjunction = (): Matcher => {
    const items = [parseAlternative()];
    while (peek() === "|") {
      cursor.position += 1;
      items.push(parseAlternative());
    }
    return items.length === 1 ? items[0] : { kind: "alternation", items };
  };
  const parseAlternative = (): Matcher => {
    const items: Matcher[] = [];
    while (cursor.position < source.length && peek() !== "|" && peek() !== ")") {
      items.push(parseTerm());
    }
    return items.length === 1 ? items[0] : { kind: "sequence", items };
  };
  const parseTerm = (): Matcher => {
    const parenIndex = cursor.captures;
    if (peek() === "^" || peek() === "$") {
      cursor.position += 1;
      return { kind: source.charAt(cursor.position - 1) === "^" ? "start" : "end" };
    }
    if (isAt("\\b") || isAt("\\B")) {
      cursor.position += 2;
      return { kind: "boundary", isInverted: source.charAt(cursor.position - 1) === "B" };
    }
    if (isAt("(?<=") || isAt("(?<!")) {
      throw new TlaTypeScriptError("tla-ts can't match a lookbehind", node);
    }
    const atom = isAt("(?=") || isAt("(?!") ? parseLookahead() : parseAtom();
    const bounds = parseBounds();
    if (bounds === undefined) return atom;
    const isGreedy = peek() !== "?";
    if (!isGreedy) cursor.position += 1;
    return {
      kind: "repeat",
      body: atom,
      ...bounds,
      isGreedy,
      parenIndex,
      parenCount: cursor.captures - parenIndex,
    };
  };
  // A quantifier's bounds, where -1 is no upper bound, or undefined where a { starts no quantifier
  // and so, as Annex B allows, stands for itself.
  const parseBounds = () => {
    const simple = new Map([
      ["*", { min: 0, max: -1 }],
      ["+", { min: 1, max: -1 }],
      ["?", { min: 0, max: 1 }],
    ]).get(peek());
    if (simple !== undefined) {
      cursor.position += 1;
      return simple;
    }
    const braced = /^\{(\d+)(,(\d*))?\}/.exec(getRest());
    if (braced === null) return undefined;
    cursor.position += braced[0].length;
    const min = Number(braced[1]);
    const max = braced[2] === undefined ? min : braced[3] === "" ? Infinity : Number(braced[3]);
    if (max < min) throw invalid();
    if (min > 2 ** 31 - 1) {
      throw new TlaTypeScriptError("tla-ts can't repeat an atom this many times", node);
    }
    return { min, max: max > 2 ** 31 - 1 ? -1 : max };
  };
  const parseLookahead = (): Matcher => {
    const isNegative = peek(2) === "!";
    cursor.position += 3;
    const body = parseDisjunction();
    close();
    return { kind: "lookahead", body, isNegative };
  };
  const parseAtom = (): Matcher => {
    const character = peek();
    if (character === ".") {
      cursor.position += 1;
      return {
        kind: "set",
        set: flags.includes("s") ? () => true : (code) => !LINE_TERMINATORS.includes(code),
        isInverted: false,
      };
    }
    if (character === "(") return parseGroup();
    if (character === "[") return parseClass();
    if (character === "\\") return parseAtomEscape();
    if ("*+?)".includes(character) || /^\{\d+(,\d*)?\}/.test(getRest())) throw invalid();
    cursor.position += 1;
    return getCharacter(character.charCodeAt(0));
  };
  const parseGroup = (): Matcher => {
    if (isAt("(?:")) {
      cursor.position += 3;
      const body = parseDisjunction();
      close();
      return body;
    }
    const name = /^\(\?<([^>]*)>/.exec(getRest())?.[1];
    if (peek(1) === "?" && name === undefined) {
      throw new TlaTypeScriptError(`tla-ts can't match this group: /${source}/`, node);
    }
    if (name?.includes("\\")) {
      throw new TlaTypeScriptError("tla-ts can't read an escape in a group's name", node);
    }
    cursor.position += name === undefined ? 1 : name.length + 4;
    cursor.captures += 1;
    const index = cursor.captures;
    if (name !== undefined && groups.names.get(name) !== index) {
      throw new TlaTypeScriptError("tla-ts can't match groups that share a name", node);
    }
    const body = parseDisjunction();
    close();
    return { kind: "group", index, body };
  };
  // \p or \P with the u flag, whose property tla-ts reads from the engine it runs on.
  const parseProperty = (): CharacterSet | undefined => {
    const property = isUnicode ? /^\\[pP]\{[^}]*\}/.exec(getRest())?.[0] : undefined;
    if (property === undefined) return undefined;
    cursor.position += property.length;
    const matcher = new RegExp(`^${property}$`, "u");
    return (code) => matcher.test(String.fromCharCode(code));
  };
  const parseAtomEscape = (): Matcher => {
    const escaped = peek(1);
    const decimal = /^[1-9]\d*/.exec(source.slice(cursor.position + 1))?.[0];
    if (decimal !== undefined && Number(decimal) <= groups.count) {
      cursor.position += 1 + decimal.length;
      return { kind: "backreference", index: Number(decimal) };
    }
    if (escaped === "k" && (isUnicode || groups.names.size > 0)) {
      const name = /^\\k<([^>]*)>/.exec(getRest())?.[1];
      const index = name === undefined ? undefined : groups.names.get(name);
      if (name === undefined || index === undefined) throw invalid();
      cursor.position += name.length + 4;
      return { kind: "backreference", index };
    }
    const classEscape = getClassEscape(escaped, isUnicode && flags.includes("i"));
    if (classEscape !== undefined) {
      cursor.position += 2;
      return { kind: "set", set: classEscape, isInverted: false };
    }
    const property = parseProperty();
    if (property !== undefined) return { kind: "set", set: property, isInverted: false };
    // A \ that no control letter follows stands for itself, as Annex B allows.
    if (escaped === "c" && !/^[a-zA-Z]$/.test(peek(2))) {
      cursor.position += 1;
      return getCharacter(0x5c);
    }
    return getCharacter(parseCharacterEscape(false));
  };
  // A character escape, with Annex B's legacy octal and identity escapes, as the code it stands
  // for.
  const parseCharacterEscape = (isInClass: boolean) => {
    const rest = source.slice(cursor.position + 1);
    if (rest === "") throw invalid();
    const control = CONTROL_ESCAPES.get(rest[0]);
    const letter = /^c([a-zA-Z])/.exec(rest) ?? (isInClass ? /^c([\d_])/.exec(rest) : null);
    const octal = /^(?:[0-3][0-7]{0,2}|[4-7][0-7]?)/.exec(rest)?.[0];
    const hex = /^x([\da-fA-F]{2})|^u([\da-fA-F]{4})|^u\{([\da-fA-F]+)\}/.exec(rest);
    const point = hex?.[3] === undefined || !isUnicode ? undefined : Number.parseInt(hex[3], 16);
    if (point !== undefined && point > 0xffff) {
      throw new TlaTypeScriptError(
        "tla-ts can't match a character outside the Basic Multilingual Plane with the u flag",
        node,
      );
    }
    const escape =
      control !== undefined
        ? { length: 1, code: control }
        : letter !== null
          ? { length: 2, code: letter[1].charCodeAt(0) % 32 }
          : octal !== undefined && !(isUnicode && octal !== "0")
            ? { length: octal.length, code: Number.parseInt(octal, 8) }
            : hex !== null && (hex[3] === undefined || point !== undefined)
              ? { length: hex[0].length, code: point ?? Number.parseInt(hex[1] ?? hex[2], 16) }
              : { length: 1, code: rest.charCodeAt(0) };
    cursor.position += 1 + escape.length;
    return getCode(escape.code);
  };
  const parseClassAtom = (): number | CharacterSet => {
    const character = peek();
    if (character === "") throw invalid();
    if (character !== "\\") {
      cursor.position += 1;
      return getCode(character.charCodeAt(0));
    }
    const classEscape = getClassEscape(peek(1), isUnicode && flags.includes("i"));
    if (classEscape !== undefined) {
      cursor.position += 2;
      return classEscape;
    }
    const property = parseProperty();
    if (property !== undefined) return property;
    if (peek(1) === "b") {
      cursor.position += 2;
      return 0x08;
    }
    if (peek(1) === "c" && !/^[a-zA-Z\d_]$/.test(peek(2))) {
      cursor.position += 1;
      return 0x5c;
    }
    return parseCharacterEscape(true);
  };
  const parseClass = (): Matcher => {
    cursor.position += 1;
    const isInverted = peek() === "^";
    if (isInverted) cursor.position += 1;
    const sets: CharacterSet[] = [];
    while (peek() !== "]") {
      const from = parseClassAtom();
      const isRange = peek() === "-" && peek(1) !== "]" && peek(1) !== "";
      if (isRange) cursor.position += 1;
      const to = isRange ? parseClassAtom() : undefined;
      const fromSet = typeof from === "number" ? getCharacterSet(from) : from;
      if (to === undefined) {
        sets.push(fromSet);
        continue;
      }
      if (typeof from !== "number" || typeof to !== "number") {
        // Annex B's range of a class escape, which holds both ends and the -.
        sets.push(
          fromSet,
          typeof to === "number" ? getCharacterSet(to) : to,
          getCharacterSet(0x2d),
        );
        continue;
      }
      if (from > to) throw invalid();
      sets.push((code) => code >= from && code <= to);
    }
    cursor.position += 1;
    return { kind: "set", set: unite(...sets), isInverted };
  };
  const pattern = parseDisjunction();
  if (cursor.position < source.length) throw invalid();
  return { pattern, count: groups.count, names: groups.names };
};

// Canonicalize without the u flag, which maps a code unit to its uppercase, unless that is longer
// or would take a character outside ASCII into it.
const canonicalize = (code: number) => {
  const upper = String.fromCharCode(code).toUpperCase();
  return upper.length !== 1 || (code >= 128 && upper.charCodeAt(0) < 128)
    ? code
    : upper.charCodeAt(0);
};

// Canonicalize with the u flag, as simple case folding, of the characters that fold into ASCII,
// since tla-ts matches such a pattern only on text in ASCII.
const foldCase = (code: number) =>
  code >= 0x41 && code <= 0x5a ? code + 32 : (UNICODE_FOLDS.get(code) ?? code);

const CODE_UNITS = Array.from({ length: 0x10000 }, (_, code) => code);

// The characters outside ASCII that a class lists, where it holds most of them or few.
const LISTED_LIMIT = 256;

// A class as the characters in ASCII that it matches once Canonicalize maps them, with those
// outside ASCII listed where it matches few of them or all but a few, or else unknown. A pattern
// with the u flag matches only text in ASCII.
const translateCharacters = (
  matcher: { set: CharacterSet; isInverted: boolean },
  flags: string,
) => {
  const isUnicode = flags.includes("u");
  const fold = flags.includes("i") ? (isUnicode ? foldCase : canonicalize) : undefined;
  const folded =
    fold === undefined
      ? undefined
      : new Set(
          (isUnicode ? [...CODE_UNITS.slice(0, 128), ...UNICODE_FOLDS.keys()] : CODE_UNITS)
            .filter(matcher.set)
            .map(fold),
        );
  const isMatched = (code: number) =>
    (folded === undefined || fold === undefined ? matcher.set(code) : folded.has(fold(code))) !==
    matcher.isInverted;
  const outside = isUnicode ? [] : CODE_UNITS.slice(128);
  const held = outside.filter(isMatched);
  const missed = outside.filter((code) => !isMatched(code));
  const isListable = (codes: number[]) =>
    codes.length <= LISTED_LIMIT && !codes.some((code) => code >= 0xd800 && code <= 0xdfff);
  const others = isUnicode
    ? "unknown"
    : missed.length === 0
      ? "all"
      : isListable(held)
        ? "none"
        : isListable(missed)
          ? "all"
          : "unknown";
  const toStrings = (codes: number[]) =>
    set(codes.map((code) => string(String.fromCharCode(code))));
  return record("Record", [
    { name: "kind", value: string("set") },
    {
      name: "characters",
      value: toStrings([
        ...CODE_UNITS.slice(0, 128).filter(isMatched),
        ...(others === "none" ? held : []),
      ]),
    },
    { name: "excluded", value: toStrings(others === "all" ? missed : []) },
    { name: "others", value: string(others) },
  ]);
};

const translateMatcher = (matcher: Matcher, flags: string): Expression => {
  const kind = { name: "kind", value: string(matcher.kind) };
  if (matcher.kind === "set") return translateCharacters(matcher, flags);
  if (matcher.kind === "sequence" || matcher.kind === "alternation") {
    return record("Record", [
      kind,
      { name: "items", value: tuple(matcher.items.map((item) => translateMatcher(item, flags))) },
    ]);
  }
  if (matcher.kind === "group") {
    return record("Record", [
      kind,
      { name: "index", value: number(matcher.index) },
      { name: "body", value: translateMatcher(matcher.body, flags) },
    ]);
  }
  if (matcher.kind === "repeat") {
    return record("Record", [
      kind,
      { name: "body", value: translateMatcher(matcher.body, flags) },
      { name: "min", value: number(matcher.min) },
      { name: "max", value: number(matcher.max) },
      { name: "isGreedy", value: boolean(matcher.isGreedy) },
      { name: "parenIndex", value: number(matcher.parenIndex) },
      { name: "parenCount", value: number(matcher.parenCount) },
    ]);
  }
  if (matcher.kind === "boundary") {
    return record("Record", [kind, { name: "isInverted", value: boolean(matcher.isInverted) }]);
  }
  if (matcher.kind === "lookahead") {
    return record("Record", [
      kind,
      { name: "body", value: translateMatcher(matcher.body, flags) },
      { name: "isNegative", value: boolean(matcher.isNegative) },
    ]);
  }
  if (matcher.kind === "backreference") {
    return record("Record", [kind, { name: "index", value: number(matcher.index) }]);
  }
  return record("Record", [kind]);
};

// The flags that a regular expression's flags getter gives, in its order, by the property that
// reads each.
const REGEXP_FLAGS = [
  ["d", "hasIndices"],
  ["g", "global"],
  ["i", "ignoreCase"],
  ["m", "multiline"],
  ["s", "dotAll"],
  ["u", "unicode"],
  ["v", "unicodeSets"],
  ["y", "sticky"],
] as const;

// A pattern and its flags as the record that the JavaScript module's RegExp operators read, which
// holds its matchers, its groups, its source, and its flags.
const translateRegExp = (
  pattern: string,
  flags: string,
  source: string,
  node: ts.Node,
  context: Context,
) => {
  if (/[dv]/.test(flags)) {
    throw new TlaTypeScriptError(
      "tla-ts can't match a regular expression with the d or v flag",
      node,
    );
  }
  const parsed = parsePattern(pattern, flags, node);
  context.prelude.add("JavaScript");
  return record("Record", [
    { name: "pattern", value: translateMatcher(parsed.pattern, flags) },
    { name: "captures", value: number(parsed.count) },
    {
      name: "names",
      value: functionFrom([...parsed.names].map(([name, index]) => [string(name), number(index)])),
    },
    { name: "groupNames", value: tuple([...parsed.names.keys()].map(string)) },
    { name: "source", value: string(source) },
    {
      name: "flags",
      value: string(
        REGEXP_FLAGS.filter(([flag]) => flags.includes(flag))
          .map(([flag]) => flag)
          .join(""),
      ),
    },
    ...REGEXP_FLAGS.map(([flag, property]) => ({
      name: property,
      value: boolean(flags.includes(flag)),
    })),
  ]);
};

// The pattern and flags of new RegExp or RegExp, where literals write them.
const getRegExpTexts = (node: ts.Node, context: Context) => {
  if (
    (!ts.isNewExpression(node) && !ts.isCallExpression(node)) ||
    getBuiltIn(node.expression, context) !== "RegExp"
  ) {
    return undefined;
  }
  const values = node.arguments ?? [];
  const texts = values.flatMap((value) => (ts.isStringLiteralLike(value) ? [value.text] : []));
  return values.length > 2 || texts.length < values.length
    ? undefined
    : { pattern: texts.at(0) ?? "", flags: texts.at(1) ?? "" };
};

const getValidRegExp = (texts: { pattern: string; flags: string }) => {
  try {
    return new RegExp(texts.pattern, texts.flags);
  } catch {
    return undefined;
  }
};

// new RegExp or RegExp of literals that make a valid regexp, whose source the engine that tla-ts
// runs on escapes as the spec's EscapeRegExpPattern does.
export const getMadeRegExp = (node: ts.Node, context: Context) => {
  const texts = getRegExpTexts(node, context);
  const made = texts === undefined ? undefined : getValidRegExp(texts);
  return texts === undefined || made === undefined ? undefined : { ...texts, source: made.source };
};

// new RegExp or RegExp of literals that make no valid regexp, which throws a SyntaxError.
export const isInvalidRegExp = (node: ts.Node, context: Context) => {
  const texts = getRegExpTexts(node, context);
  return texts !== undefined && getValidRegExp(texts) === undefined;
};

// The regexp that search or match makes of a string literal, where the literal is a valid pattern.
export const getStringRegExp = (node: ts.Node) => {
  const made = ts.isStringLiteralLike(node)
    ? getValidRegExp({ pattern: node.text, flags: "" })
    : undefined;
  return ts.isStringLiteralLike(node) && made !== undefined
    ? { pattern: node.text, flags: "", source: made.source }
    : undefined;
};

// A regular expression literal, a regexp that getMadeRegExp reads, or one that getStringRegExp
// reads, as the record of its pattern, which without objects is the regexp itself, whose lastIndex
// stays 0.
export const translateRegExpValue = (node: ts.Node, context: Context) => {
  const made = ts.isRegularExpressionLiteral(node)
    ? undefined
    : (getMadeRegExp(node, context) ?? getStringRegExp(node));
  if (made !== undefined) {
    return translateRegExp(made.pattern, made.flags, made.source, node, context);
  }
  if (!ts.isRegularExpressionLiteral(node))
    throw new TlaTypeScriptError("Unsupported regexp", node);
  const end = node.text.lastIndexOf("/");
  const pattern = node.text.slice(1, end);
  return translateRegExp(pattern, node.text.slice(end + 1), pattern, node, context);
};
