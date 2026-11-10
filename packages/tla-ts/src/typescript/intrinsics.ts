import ts from "@typescript/typescript6";
import { type Context, getSymbol, getUndefined } from "./context";
import { TlaTypeScriptError } from "../errors";
import { getConstructor, getErrorClass, NATIVE_ERRORS } from "./exceptions";
import { translateExpression } from "./expressions";
import { getHeap } from "./heap";
import { useJavaScript, WELL_KNOWN_SYMBOLS } from "./javascript";
import type { Scope } from "./scope";
import type { Expression } from "../ast";
import { BUILT_INS } from "./built-ins";
import { boolean, functionFrom, identifier, number, record, string, tuple } from "./tla";
import { getKind } from "./types";

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

const isPlainFunction = (type: ts.Type) => {
  const declarations = type.getCallSignatures().map((signature) => signature.getDeclaration());
  return (
    declarations.length > 0 &&
    type.getConstructSignatures().length === 0 &&
    declarations.every(
      (declaration) =>
        !declaration.getSourceFile().isDeclarationFile &&
        (ts.isArrowFunction(declaration) ||
          ts.isFunctionExpression(declaration) ||
          ts.isFunctionDeclaration(declaration)) &&
        declaration.asteriskToken === undefined &&
        !(ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Async),
    )
  );
};

// The built-in object that a node is, by its path in BUILT_INS, such as "Array.prototype".
const getName = (node: ts.Expression, context: Context): string | undefined => {
  if (ts.isParenthesizedExpression(node)) return getName(node.expression, context);
  const builtIn = getBuiltIn(node, context);
  if (builtIn !== undefined) return builtIn;
  if (ts.isPropertyAccessExpression(node)) {
    const owner = getName(node.expression, context);
    const property =
      owner === undefined
        ? undefined
        : BUILT_INS[owner]?.[3].find((entry) => entry[0] === node.name.text && entry.length === 3);
    return property?.[2].startsWith("o") ? property[2].slice(1) : undefined;
  }
  if (isPrototypeCall(node, context)) {
    const parent = getPrototype(node.arguments[0], context);
    return parent === "null" ? undefined : parent;
  }
  return undefined;
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
  const kind = getKind(node, context);
  if (kind === "object") return undefined;
  if (kind === "sequence") return "Array.prototype";
  if (kind === "set") return "Set.prototype";
  if (kind === "map") return "Map.prototype";
  const classes = getErrorClass(type.getSymbol(), checker);
  if (classes !== undefined) {
    return NATIVE_ERRORS.has(classes[0].name) && isLibrary(classes[0])
      ? `${classes[0].name}.prototype`
      : undefined;
  }
  if (isPlainFunction(type)) return "Function.prototype";
  return (type.getSymbol()?.flags ?? 0) & ts.SymbolFlags.ObjectLiteral
    ? "Object.prototype"
    : undefined;
};

export const isBuiltInObject = (node: ts.Expression, context: Context) =>
  getName(node, context) !== undefined;

// A built-in object that a built-in function takes, such as the prototype Object.create takes.
export const translateBuiltInObject = (node: ts.Expression, scope: Scope, context: Context) => {
  const name = getName(node, context);
  return name === undefined ? undefined : translateBuiltIn(name, node, scope, context);
};

const isPrototypeCall = (node: ts.Node, context: Context): node is ts.CallExpression =>
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  getBuiltIn(node.expression.expression, context) === "Object" &&
  node.expression.name.text === "getPrototypeOf" &&
  node.arguments.length === 1;

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
    | "Array.prototype"
    | "Object.prototype"
    | "Array"
    | "get Function.prototype.arguments"
    | "Boolean.prototype"
    | "Number.prototype"
    | "String.prototype"
    | "Symbol.prototype"
    | "Promise"
    | "Promise.prototype"
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
  const path = ts.isParenthesizedExpression(node) ? node.expression : node;
  if (!ts.isPropertyAccessExpression(path) || !scope.bindings.has(context.heap)) {
    return getBuiltInValue(name, node, context);
  }
  const owner = getName(path.expression, context);
  const flags =
    owner === undefined
      ? undefined
      : BUILT_INS[owner][3].find((property) => property[0] === path.name.text)?.[1];
  if (owner === undefined || flags === undefined || !/[wc]/.test(flags)) {
    return getBuiltInValue(name, node, context);
  }
  return useJavaScript(
    "Get",
    [
      getHeap(scope, node, context),
      translateBuiltIn(owner, path.expression, scope, context),
      string(path.name.text),
    ],
    context,
  );
};

const MAX_INTEGER = 2 ** 31 - 1;

const SPECIAL_NUMBER_NAMES = new Map([
  ["NaN", "NaN"],
  ["Infinity", "Infinity"],
  ["-Infinity", "NegativeInfinity"],
  ["-0", "NegativeZero"],
]);

// A property's value from BUILT_INS, or undefined for one TLA+ can't represent.
const translateBuiltInProperty = (value: string, node: ts.Node, context: Context) => {
  const payload = value.slice(1);
  if (value.startsWith("o")) return getBuiltInValue(payload, node, context);
  if (value.startsWith("s")) return string(payload);
  if (value.startsWith("b")) return boolean(payload === "true");
  if (value === "u") return getUndefined(context);
  if (value === "l") return identifier("Null");
  const special = SPECIAL_NUMBER_NAMES.get(payload);
  if (value.startsWith("n") && special !== undefined && context.hasSpecialNumbers) {
    return identifier(special);
  }
  const parsed = Number(payload);
  return value.startsWith("n") &&
    Number.isInteger(parsed) &&
    Math.abs(parsed) <= MAX_INTEGER &&
    payload !== "-0"
    ? number(parsed)
    : undefined;
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
        const key = string(property[0]);
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
      (ts.isCallExpression(child) && !isPrototypeCall(child, context)) ||
      (ts.isNewExpression(child) && !isBuiltInNew)
    ) {
      throw new TlaTypeScriptError("Pass getPrototypeOf a value without calls", child);
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  if (!ts.isFunctionLike(node)) translateExpression(node, scope, context);
};

// A built-in object, or Object.getPrototypeOf or isPrototypeOf on built-in objects, or undefined
// for any other node.
export const translateIntrinsic = (node: ts.Expression, scope: Scope, context: Context) => {
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
    if (!isCompared(node, context)) {
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
  // getPrototypeOf's answer here doesn't read the heap.
  const isOnHeap = !isCall && context.heap !== undefined && scope.bindings.has(context.heap);
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
