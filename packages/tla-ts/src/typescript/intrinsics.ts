import ts from "@typescript/typescript6";
import {
  type Context,
  findNodes,
  getAssignedTarget,
  getSymbol,
  getUndefined,
  isAssigned,
  isInertValue,
  isUnresolved,
  isWrittenBy,
  share,
  skipCasts,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import {
  getArrayIteratorCall,
  translateArrayIteratorPrototype,
  translateHoldsIteratorMethod,
} from "./collections";
import { getVarNames } from "./early-errors";
import { getConstructor, getErrorClass, NATIVE_ERRORS } from "./exceptions";
import { getNumberValue, getRawString, isGlobalObject, translateExpression } from "./expressions";
import { getHeap, isFunctionValue, translateFunctionObject } from "./heap";
import { useJavaScript, WELL_KNOWN_SYMBOLS } from "./javascript";
import { getThisOwner, type Scope } from "./scope";
import type { Expression } from "../ast";
import { BUILT_INS, HOST_GLOBAL_KEYS } from "./built-ins";
import {
  apply,
  boolean,
  field,
  functionFrom,
  identifier,
  ifExpression,
  number,
  record,
  set,
  string,
  tuple,
} from "./tla";
import { getCollection, getKind, isGeneratorType } from "./types";

// Built-in constructors, besides the errors, whose prototype objects tla-ts compiles to
// constants, which compare by identity.
// A global that names a built-in object, such as Math or Array.
const isGlobal = (name: string) => !/[.%\s]/.test(name) && Object.hasOwn(BUILT_INS, name);

const isLibrary = (symbol: ts.Symbol) =>
  (symbol.declarations ?? []).length > 0 &&
  (symbol.declarations ?? []).every((declaration) => declaration.getSourceFile().isDeclarationFile);

export const getBuiltIn = (node: ts.Expression, context: Pick<Context, "checker">) => {
  const symbol = getSymbol(node, context.checker);
  return ts.isIdentifier(node) && isGlobal(node.text) && symbol !== undefined && isLibrary(symbol)
    ? node.text
    : undefined;
};

// The reads of the global object's built-ins that a statement at a script's top checks before it
// runs, where the script uses the global object as a value, which may change them: those that the
// statement evaluates once, before anything in it that could run code. A change of a built-in
// that any other read reads stops, as no statement checks that read.
export const findCheckedGlobals = (sourceFile: ts.SourceFile, context: Context) => {
  const isGlobalValue =
    findNodes(
      sourceFile,
      (node): node is ts.Node =>
        (ts.isIdentifier(node) && isGlobalObject(node, context)) ||
        (node.kind === ts.SyntaxKind.ThisKeyword && getThisOwner(node) === undefined),
    ).length > 0;
  const keys = new Set(BUILT_INS.globalThis[3].map((property) => property[0]));
  // A namespace's function, as assert.sameValue, which tla-ts calls as a definition rather than
  // reading it as a property, is inert too.
  const isInert = (node: ts.Node) => {
    const declaration =
      ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)
        ? getSymbol(node, context.checker)?.valueDeclaration
        : undefined;
    return (
      node.kind <= ts.SyntaxKind.LastToken ||
      (declaration !== undefined &&
        ts.isFunctionDeclaration(declaration) &&
        ts.isModuleBlock(declaration.parent)) ||
      ts.isTypeNode(node) ||
      (ts.isExpression(node) && isInertValue(node)) ||
      (ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        (node.initializer === undefined || isInertValue(node.initializer)))
    );
  };
  const isChecked = (node: ts.Node): boolean => {
    const parent = node.parent;
    if (ts.isStatement(parent)) {
      return ts.isForStatement(parent)
        ? node === parent.initializer
        : !ts.isWhileStatement(parent) &&
            !ts.isDoStatement(parent) &&
            !(
              (ts.isForInStatement(parent) || ts.isForOfStatement(parent)) &&
              node === parent.initializer
            );
    }
    const children: ts.Node[] = [];
    ts.forEachChild(parent, (child) => {
      children.push(child);
    });
    // A default runs after what the pattern destructures.
    const isDefault =
      ts.isParameter(parent) ||
      ts.isBindingElement(parent) ||
      ts.isShorthandPropertyAssignment(parent) ||
      (ts.isBinaryExpression(parent) &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        (ts.isArrayLiteralExpression(parent.parent) || ts.isPropertyAssignment(parent.parent)));
    return (
      !isDefault &&
      !ts.isFunctionLike(parent) &&
      !ts.isClassLike(parent) &&
      !ts.isClassElement(parent) &&
      children.slice(0, children.indexOf(node)).every(isInert) &&
      isChecked(parent)
    );
  };
  return new Set(
    isGlobalValue
      ? findNodes(
          sourceFile,
          (node): node is ts.Identifier =>
            ts.isIdentifier(node) &&
            getBuiltIn(node, context) !== undefined &&
            keys.has(node.text) &&
            ts.findAncestor(
              node,
              (ancestor) =>
                ts.isTypeNode(ancestor) || ts.isFunctionLike(ancestor) || ts.isClassLike(ancestor),
            ) === undefined &&
            isChecked(node),
        )
      : [],
  );
};

// The type of a built-in object that a global holds, such as Math's, which no other value has.
export const isBuiltInObjectType = (type: ts.Type, context: Context) => {
  const symbol = type.getSymbol();
  return (
    symbol !== undefined &&
    isGlobal(symbol.name) &&
    isLibrary(symbol) &&
    (symbol.flags & ts.SymbolFlags.Value) !== 0 &&
    context.checker.getTypeOfSymbol(symbol) === type
  );
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
          ts.isFunctionDeclaration(declaration) ||
          ts.isMethodDeclaration(declaration)
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
export const getBuiltInKey = (node: ts.Expression, context: Context) => {
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
  // A read in the block that declares the variable, outside any function there or in an arrow or a
  // function expression that the block makes after the declaration, runs after the declaration.
  const held = getHeldBuiltIn(node, context);
  const statement = held?.parent.parent.parent;
  const owner = held && ts.findAncestor(held, ts.isFunctionLike);
  const isAfter = (inner: ts.Node): boolean => {
    const function_ = ts.findAncestor(inner.parent, ts.isFunctionLike);
    return (
      function_ === owner ||
      (function_ !== undefined &&
        (ts.isArrowFunction(function_) || ts.isFunctionExpression(function_)) &&
        isAfter(function_))
    );
  };
  if (
    held !== undefined &&
    statement !== undefined &&
    ts.isVariableStatement(statement) &&
    ts.findAncestor(node, (ancestor) => ancestor === statement.parent) !== undefined &&
    isAfter(node)
  ) {
    return getName(held, context);
  }
  const key = getBuiltInKey(node, context);
  if (key !== undefined) {
    // A function that keeps its prototype reads its constructor from there.
    const owner =
      getName(key.owner, context) ??
      (key.name === "constructor" && isUntouchedFunction(skipCasts(key.owner), context)
        ? getFunctionPrototype(context.checker.getTypeAtLocation(key.owner))
        : undefined);
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

// Whether an expression is only read, where a write such as an assignment, a delete, or a pattern
// that a destructuring assignment writes can't reach it.
const isRead = (node: ts.Expression): boolean => {
  const outer = node.parent;
  if (ts.isParenthesizedExpression(outer)) return isRead(outer);
  return !(
    (ts.isBinaryExpression(outer) &&
      outer.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      outer.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
      outer.left === node) ||
    ts.isDeleteExpression(outer) ||
    ((ts.isPrefixUnaryExpression(outer) || ts.isPostfixUnaryExpression(outer)) &&
      (outer.operator === ts.SyntaxKind.PlusPlusToken ||
        outer.operator === ts.SyntaxKind.MinusMinusToken)) ||
    ((ts.isForInStatement(outer) || ts.isForOfStatement(outer)) && outer.initializer === node) ||
    ts.isArrayLiteralExpression(outer) ||
    ts.isObjectLiteralExpression(outer) ||
    ts.isPropertyAssignment(outer) ||
    ts.isSpreadElement(outer) ||
    ts.isSpreadAssignment(outer)
  );
};

interface RegExpTexts {
  pattern: string;
  flags: string;
}

interface NamedGenerator {
  name: ts.Identifier;
  generator: ts.FunctionDeclaration | ts.FunctionExpression;
}

// The generator functions that a script declares at its top, or that a variable there holds, whose
// prototype objects the heap holds from the start, by the place on the heap of each. A script names
// such a function only to call it, read its prototype, check what is an instance of it, or ask for
// its prototype, so that the function's prototype property keeps the object it starts with.
export const findGeneratorPrototypes = (sourceFile: ts.SourceFile, context: Context) => {
  const isGenerator = (node: ts.Node | undefined) =>
    node !== undefined &&
    (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) &&
    node.asteriskToken !== undefined &&
    node.body !== undefined &&
    (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) === 0;
  const named = sourceFile.statements.flatMap<NamedGenerator>((statement) =>
    ts.isFunctionDeclaration(statement) && statement.name !== undefined && isGenerator(statement)
      ? [{ name: statement.name, generator: statement }]
      : ts.isVariableStatement(statement)
        ? statement.declarationList.declarations.flatMap((declaration) =>
            ts.isIdentifier(declaration.name) &&
            declaration.initializer !== undefined &&
            ts.isFunctionExpression(declaration.initializer) &&
            isGenerator(declaration.initializer)
              ? [{ name: declaration.name, generator: declaration.initializer }]
              : [],
          )
        : [],
  );
  const references = findNodes(sourceFile, ts.isIdentifier);
  const isKept = (name: ts.Identifier) => {
    const symbol = getSymbol(name, context.checker);
    return references.every((reference) => {
      const parent = reference.parent;
      return (
        getSymbol(reference, context.checker) !== symbol ||
        reference === name ||
        (ts.isCallExpression(parent) && parent.expression === reference) ||
        (ts.isPropertyAccessExpression(parent) &&
          parent.expression === reference &&
          parent.name.text === "prototype" &&
          isRead(parent)) ||
        (ts.isBinaryExpression(parent) &&
          parent.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword &&
          parent.right === reference) ||
        (isPrototypeCall(parent, context) && parent.arguments[0] === reference)
      );
    });
  };
  return new Map(
    named
      .filter((entry) => isKept(entry.name))
      .map((entry, position) => [entry.generator, position + 1]),
  );
};

// The prototype object that the heap holds for a generator function that a script declares or
// holds in a variable.
export const getGeneratorPrototypeRef = (node: ts.Node | undefined, context: Context) => {
  const declaration =
    node === undefined || ts.isFunctionLike(node)
      ? node
      : getSymbol(node, context.checker)?.valueDeclaration;
  const generator =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : declaration;
  const position =
    generator !== undefined &&
    (ts.isFunctionDeclaration(generator) || ts.isFunctionExpression(generator))
      ? context.generatorPrototypes.get(generator)
      : undefined;
  return position === undefined
    ? undefined
    : useJavaScript(":>", [identifier("Ref"), number(position)], context);
};

// Whether a script writes a function in place, or declares it and only calls it and reads its
// prototype, its constructor, or its own prototype through getPrototypeOf or instanceof, so that the
// function keeps the properties and the prototype it starts with.
const isUntouchedFunction = (owner: ts.Expression, context: Context) => {
  const checker = context.checker;
  const symbol = ts.isIdentifier(owner) ? getSymbol(owner, checker) : undefined;
  return (
    ts.isFunctionExpression(owner) ||
    (symbol !== undefined &&
      findNodes(owner.getSourceFile(), ts.isIdentifier).every((reference) => {
        const parent = reference.parent;
        return (
          getSymbol(reference, checker) !== symbol ||
          ((ts.isFunctionDeclaration(parent) || ts.isVariableDeclaration(parent)) &&
            parent.name === reference) ||
          (ts.isCallExpression(parent) && parent.expression === reference) ||
          (isPrototypeCall(parent, context) && parent.arguments[0] === reference) ||
          (ts.isBinaryExpression(parent) &&
            parent.left === reference &&
            parent.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword) ||
          (ts.isPropertyAccessExpression(parent) &&
            parent.expression === reference &&
            parent.name.text === "constructor" &&
            getAssignedTarget(parent.parent) !== parent) ||
          (ts.isPropertyAccessExpression(parent) &&
            parent.name.text === "prototype" &&
            isPrototypeCall(parent.parent, context) &&
            parent.parent.arguments[0] === parent)
        );
      }))
  );
};

// The prototype object of a generator function that a script writes in place, or declares and only
// calls and asks for its prototype and for the prototype of that object, so that the object is the
// one the function starts with, which inherits from the built-in one.
const getGeneratorObjectPrototype = (node: ts.Expression, context: Context) => {
  // A generator object that a call of a function expression makes inherits from the function's
  // prototype property, which nothing can have changed yet.
  const made = isPrototypeCall(node, context) ? skipCasts(node.arguments[0]) : undefined;
  const callee =
    made !== undefined && ts.isCallExpression(made) ? skipCasts(made.expression) : undefined;
  const owner =
    callee !== undefined && ts.isFunctionExpression(callee)
      ? callee
      : ts.isPropertyAccessExpression(node) && node.name.text === "prototype"
        ? skipCasts(node.expression)
        : undefined;
  if (owner === undefined) return undefined;
  const checker = context.checker;
  const prototype = getFunctionPrototype(checker.getTypeAtLocation(owner));
  return isUntouchedFunction(owner, context) &&
    (prototype === "%GeneratorFunction%.prototype" ||
      prototype === "%AsyncGeneratorFunction%.prototype")
    ? `${prototype}.prototype`
    : undefined;
};

// The types of the values that aren't objects.
const PRIMITIVE_TYPES =
  ts.TypeFlags.NumberLike |
  ts.TypeFlags.StringLike |
  ts.TypeFlags.BooleanLike |
  ts.TypeFlags.BigIntLike |
  ts.TypeFlags.ESSymbolLike |
  ts.TypeFlags.Undefined |
  ts.TypeFlags.Null;

// The primitive that a call of Object wraps where nothing else holds the object it makes, whose
// prototype is the primitive's.
const getWrappedPrimitive = (node: ts.Expression, context: Context) => {
  const call = skipCasts(node);
  const argument = ts.isCallExpression(call) ? call.arguments[0] : undefined;
  return ts.isCallExpression(call) &&
    getBuiltIn(call.expression, context) === "Object" &&
    call.arguments.length === 1 &&
    argument !== undefined &&
    !ts.isSpreadElement(argument) &&
    (context.checker.getTypeAtLocation(argument).flags &
      (PRIMITIVE_TYPES & ~(ts.TypeFlags.Undefined | ts.TypeFlags.Null))) !==
      0 &&
    !context.checker.getTypeAtLocation(argument).isUnion()
    ? argument
    : undefined;
};

// The built-in object that is the prototype of a node's value, or "null".
const getPrototype = (node: ts.Expression, context: Context): string | undefined => {
  const name = getName(node, context);
  if (name !== undefined) return getParent(name);
  const wrapped = getWrappedPrimitive(node, context);
  if (wrapped !== undefined) return getPrototype(wrapped, context);
  const checker = context.checker;
  const type = checker.getTypeAtLocation(node);
  if (type.isUnion()) return undefined;
  if (type.flags & ts.TypeFlags.NumberLike) return "Number.prototype";
  if (type.flags & ts.TypeFlags.StringLike) return "String.prototype";
  if (type.flags & ts.TypeFlags.BooleanLike) return "Boolean.prototype";
  if (type.flags & ts.TypeFlags.BigIntLike) return "BigInt.prototype";
  if (type.flags & ts.TypeFlags.ESSymbolLike) return "Symbol.prototype";
  // Iterator.from's iterator is wrapped where its prototype no longer inherits from
  // Iterator.prototype, and getIteratorCall reads a string's.
  const arrayIteratorCall = getArrayIteratorCall(node, context);
  if (
    arrayIteratorCall?.kind !== undefined &&
    arrayIteratorCall.kind !== "string" &&
    arrayIteratorCall.isFrom !== true &&
    !context.hasInheritedElements
  ) {
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
  const isPrimitive = !type.isUnion() && (type.flags & PRIMITIVE_TYPES) !== 0;
  const isObject = getKind(left, context) === "object";
  const isGenerator = !isPrimitive && !isObject && isGeneratorType(left, context);
  const parent = isPrimitive || isObject || isGenerator ? undefined : getPrototype(left, context);
  // A value of type unknown or any may be anything, which only the run can tell.
  const isUnknown =
    !isPrimitive && !isObject && (type.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any)) !== 0;
  if (
    !isPrimitive &&
    !isObject &&
    !isGenerator &&
    !isUnknown &&
    (parent === undefined || parent === "null")
  ) {
    return undefined;
  }
  const heap = getHeap(scope, node, context);
  const constructor = translateBuiltIn(name, node.right, scope, context);
  const prototype = useJavaScript("Get", [heap, constructor, string("prototype")], context);
  const found = (value: Expression) => {
    if (isPrimitive) return boolean(false);
    if (isObject) return useJavaScript("IsPrototypeOf", [heap, prototype, value], context);
    if (isGenerator) {
      // An iterator helper inherits from %IteratorHelperPrototype%, which Lookup reads.
      context.builtIns.add("%IteratorHelperPrototype%");
      return useJavaScript("GeneratorInheritsFrom", [heap, prototype, value], context);
    }
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
    ((context.checker.getTypeAtLocation(initializer).flags & ts.TypeFlags.Any) !== 0 ||
      getBuiltInKey(initializer, context)?.name === "constructor") &&
    isBuiltInObject(initializer, context) &&
    !isAssigned(symbol, node.getSourceFile(), context)
    ? initializer
    : undefined;
};

export const isHeldBuiltInObject = (node: ts.Expression, context: Context) =>
  getHeldBuiltIn(node, context) !== undefined;

// The built-in that a script uses as a value, rather than reads from or calls, as
// obj.pop = Array.prototype.pop stores Array.prototype.pop.
export const getStoredBuiltIn = (node: ts.Node, context: Context) =>
  ts.isPropertyAccessExpression(node) &&
  !(ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node) &&
  !(ts.isCallExpression(node.parent) && node.parent.expression === node)
    ? getName(node, context)
    : undefined;

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
  const named = context.checker
    .getSymbolsInScope(node.getSourceFile(), ts.SymbolFlags.Value)
    .find((candidate) => candidate.name === name);
  if (named !== undefined && !isLibrary(named)) {
    throw new TlaTypeScriptError(
      `tla-ts can't name the built-in ${name}, which ${name} hides`,
      node,
    );
  }
  if (named === undefined) throw new TlaTypeScriptError(`Unknown built-in: ${name}`, node);
  return named;
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

export const COLLECTIONS: readonly Collection[] = ["Set", "Map", "WeakMap", "WeakSet"];

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
    | `Object.prototype.${string}`
    | `Array.prototype.${string}`
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
    | "Date"
    | Collection
    | "Date.prototype"
    | "DisposableStack.prototype"
    | "AsyncDisposableStack.prototype"
    | "DisposableStack.prototype.dispose"
    | "DisposableStack.prototype.move"
    | "AsyncDisposableStack.prototype.disposeAsync"
    | "AsyncDisposableStack.prototype.move"
    | "RegExp"
    | "RegExp.prototype"
    | `RegExp.prototype.${string}`
    | "ArrayBuffer"
    | "SharedArrayBuffer"
    | "DataView"
    | `${string}Array`
    | `${string}Buffer.prototype`
    | `${string}Array.prototype`
    | `${string}Error`
    | `${string}Error.prototype`
    | "DataView.prototype"
    | "WeakRef.prototype"
    | "FinalizationRegistry.prototype"
    | "WeakRef"
    | "FinalizationRegistry"
    | "Symbol.prototype"
    | "Iterator"
    | "Iterator.prototype"
    | `Iterator.prototype.${string}`
    | "%AsyncIteratorPrototype%.@@asyncDispose"
    | "%ArrayIteratorPrototype%"
    | "%StringIteratorPrototype%"
    | "%MapIteratorPrototype%"
    | "%SetIteratorPrototype%"
    | "%GeneratorFunction%.prototype"
    | "%GeneratorFunction%.prototype.prototype"
    | "%AsyncFunction%.prototype"
    | "%AsyncGeneratorFunction%.prototype"
    | "%AsyncGeneratorFunction%.prototype.prototype"
    | "Promise"
    | "Promise.prototype"
    | "Promise.prototype.catch"
    | "JSON"
    | "Intl"
    | `Intl.${string}`
    | `${Collection}.prototype${string}`,
  node: ts.Node,
  context: Context,
) => {
  context.builtIns.add(name);
  return getBuiltInValue(name, node, context);
};

// The built-in function that a built-in object holds at a key, by its path, such as "Math.max".
const getBuiltInFunction = (owner: string, key: string) => {
  const value = BUILT_INS[owner]?.[3].find(
    (property) => property[0] === key && property.length === 3,
  )?.[2];
  return value?.startsWith("o") ? value.slice(1) : undefined;
};

// The prototype of the interface that declares a library method, such as Map.prototype for get.
const getDeclaringPrototype = (symbol: ts.Symbol) =>
  (symbol.declarations ?? [])
    .map((declaration) => declaration.parent)
    .filter(ts.isInterfaceDeclaration)
    .map(
      (declaration) =>
        `${declaration.name.text.replace(/^Readonly/, "").replace(/^(Callable|Newable)Function$/, "Function")}.prototype`,
    )
    .find((prototype) => Object.hasOwn(BUILT_INS, prototype));

// The built-in object that should hold a library method that the engine tla-ts follows lacks, as one
// that TypeScript declares before Node ships it, where a read finds it undefined unless a script
// defines it.
export const getMissingMethod = (node: ts.Expression, context: Context) => {
  const symbol = ts.isPropertyAccessExpression(node) ? getSymbol(node, context.checker) : undefined;
  if (!ts.isPropertyAccessExpression(node) || symbol === undefined || !isLibrary(symbol)) {
    return undefined;
  }
  // An interface that a subtype extends, as Iterator for an array iterator, may declare a method
  // that the subtype's prototype holds, so the receiver's type must be the declaring one.
  const declared = getDeclaringPrototype(symbol);
  const receiver = context.checker.getTypeAtLocation(node.expression).getSymbol()?.name;
  const owner =
    getName(node.expression, context) ??
    (receiver !== undefined && declared === `${receiver.replace(/^Readonly/, "")}.prototype`
      ? declared
      : undefined);
  const key = node.name.text;
  const isLacked = (name: string): boolean => {
    const entry = BUILT_INS[name];
    return (
      entry !== undefined &&
      !entry[3].some((property) => property[0] === key) &&
      (entry[0] === null || isLacked(entry[0]))
    );
  };
  return owner !== undefined && isLacked(owner) ? owner : undefined;
};

// The read of a method that getMissingMethod finds lacking, from the object that should hold it.
export const translateMissingMethod = (
  owner: string,
  key: string,
  node: ts.Node,
  scope: Scope,
  context: Context,
) => {
  context.builtIns.add(owner);
  return useJavaScript(
    "Get",
    [getHeap(scope, node, context), getBuiltInValue(owner, node, context), string(key)],
    context,
  );
};

// Whether a call that tla-ts runs as a built-in function still calls it, as the object that the call
// reads the function from holds it, or undefined where the call isn't of a built-in function.
export const translateHoldsCallee = (node: ts.CallExpression, scope: Scope, context: Context) => {
  if (context.heap === undefined || !scope.bindings.has(context.heap)) return undefined;
  const include = (name: string) => {
    context.builtIns.add(name);
    return getBuiltInValue(name, node, context);
  };
  const callee = node.expression;
  const symbol = ts.isPropertyAccessExpression(callee)
    ? getSymbol(callee, context.checker)
    : undefined;
  if (!ts.isPropertyAccessExpression(callee) || symbol === undefined || !isLibrary(symbol)) {
    return undefined;
  }
  const receiver = callee.expression;
  const key = callee.name.text;
  const named = getName(receiver, context);
  const prototype = named === undefined ? getPrototype(receiver, context) : undefined;
  const owners = [named, prototype, getDeclaringPrototype(symbol)].flatMap((owner) =>
    owner === undefined || owner === "null" ? [] : [owner],
  );
  const path = owners
    .map((owner) => getBuiltInFunction(owner, key))
    .find((found) => found !== undefined);
  // An object that the heap holds may hold the key itself, where a name reads it with nothing to
  // run first.
  const held = skipCasts(receiver);
  const base =
    named ??
    (getKind(receiver, context) === "object" &&
    (ts.isIdentifier(held) || held.kind === ts.SyntaxKind.ThisKeyword)
      ? undefined
      : (prototype ?? owners.at(-1)));
  if (path === undefined) return undefined;
  const heap = getHeap(scope, node, context);
  const object = base === undefined ? translateExpression(receiver, scope, context) : include(base);
  // Object.prototype's interface declares the methods that other built-in objects override, such as
  // Error.prototype.toString, so the receiver may reach any built-in function at the key.
  const holds =
    named === undefined && path.startsWith("Object.prototype.")
      ? useJavaScript("HoldsOverriddenBuiltIn", [heap, object, string(key)], context)
      : useJavaScript(
          "SameValue",
          [useJavaScript("Get", [heap, object, string(key)], context), include(path)],
          context,
        );
  // A primitive receiver reaches its prototype's function, which tla-ts checks as it calls it, and
  // null or undefined throws.
  return {
    path,
    holds:
      base === undefined
        ? apply("\\/", [apply("~", [useJavaScript("IsObjectIn", [heap, object], context)]), holds])
        : holds,
  };
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

// The built-in objects that a script's heap holds: those the script names, their prototypes, and
// the objects of the functions that model values stand for, with the prototype objects they start
// with.
export const translateBuiltIns = (node: ts.SourceFile, context: Context) => {
  // The global object's keys that tla-ts doesn't read: those that a script's var or function
  // declares, which a script that isn't a module puts on the global object, those that a name
  // that nothing declares reads from it, and those that the host gives it. It reads any other key,
  // which the global object lacks until the script adds it.
  const hidden = new Set([
    ...getVarNames(node),
    ...findNodes(
      node,
      (child): child is ts.FunctionDeclaration =>
        ts.isFunctionDeclaration(child) &&
        ts.findAncestor(child.parent, ts.isFunctionLike) === undefined,
    ).flatMap((declaration) => (declaration.name === undefined ? [] : [declaration.name.text])),
    ...findNodes(
      node,
      (child): child is ts.Identifier =>
        isUnresolved(child, context) &&
        !(ts.isPropertyAccessExpression(child.parent) && child.parent.name === child) &&
        ts.findAncestor(child, ts.isTypeNode) === undefined,
    ).map((name) => name.text),
    ...HOST_GLOBAL_KEYS,
  ]);
  const named = new Set(
    findNodes(
      node,
      (child): child is ts.Identifier =>
        ts.isIdentifier(child) &&
        getBuiltIn(child, context) !== undefined &&
        ts.findAncestor(child, ts.isTypeNode) === undefined &&
        !context.checkedGlobals.has(child),
    ).map((global) => global.text),
  );
  const isHidden = (name: string, property: string[]) =>
    name === "globalThis" && hidden.has(property[0]);
  const included = new Set<string>();
  const include = (name: string | null) => {
    const entry = name === null ? undefined : BUILT_INS[name];
    if (name === null || entry === undefined || included.has(name)) return;
    included.add(name);
    include(entry[0]);
    // The getters and setters of its accessors, which a descriptor gives as functions.
    entry[3]
      .filter((property) => property.length === 4)
      .flatMap((property) => property.slice(2))
      .filter((value) => value.startsWith("o"))
      .forEach((value) => include(value.slice(1)));
  };
  ["Object.prototype", ...context.builtIns].forEach(include);
  if (context.isAccessorRead) {
    [...included].forEach((name) =>
      BUILT_INS[name][3].forEach((property) =>
        property
          .slice(2)
          .filter((value) => value.startsWith("oget ") || value.startsWith("oset "))
          .forEach((value) => include(value.slice(1))),
      ),
    );
  }
  // The objects that the included objects' properties hold, which typeof needs to tell apart.
  const referenced = new Set(
    [...included].flatMap((name) =>
      BUILT_INS[name][3].flatMap((property) =>
        (isHidden(name, property) ? [] : property.slice(2))
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
    ...[...context.functionObjects].map((entry): [Expression, Expression] => [
      identifier(entry[0]),
      entry[1].object,
    ]),
    ...[...context.functionObjects.values()].flatMap((entry): [Expression, Expression][] =>
      entry.prototype === undefined ? [] : [[string(entry.prototype.key), entry.prototype.object]],
    ),
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
        if (isHidden(name, property)) {
          return { key, value: getUndefined(context), attributes: getAttributes(flags, "hidden") };
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
      const standard = new Set(properties.map((property) => property[0]));
      const others =
        name === "globalThis"
          ? [...hidden]
              .filter((key) => !standard.has(key))
              .map((key) => ({
                key: key.startsWith("@@")
                  ? useJavaScript("WellKnownSymbol", [string(key.slice(2))], context)
                  : string(key),
                value: getUndefined(context),
                attributes: getAttributes("", "hidden"),
              }))
          : [];
      const described = [...translated, ...others];
      const prototype = entry[0];
      const object = record("Record", [
        { name: "keys", value: tuple(described.map((property) => property.key)) },
        {
          name: "values",
          value: functionFrom(described.map((property) => [property.key, property.value])),
        },
        {
          name: "attributes",
          value: functionFrom(described.map((property) => [property.key, property.attributes])),
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
        // The globals that the script names, which tla-ts runs as the built-ins they start as.
        ...(name === "globalThis"
          ? [
              {
                name: "named",
                value: set(
                  [...named]
                    .filter((global) => properties.some((property) => property[0] === global))
                    .map((global) => string(global)),
                ),
              },
            ]
          : []),
      ]);
      return [getKey(name), object];
    }),
  ]);
};

// Evaluates the value whose prototype a call asks for, which mustn't call anything that could
// throw, since only its type decides the result. A generator function that takes nothing only makes
// its generator object, and Symbol only converts a description that a literal gives.
const evaluate = (node: ts.Expression, scope: Scope, context: Context) => {
  const visit = (child: ts.Node) => {
    if (ts.isFunctionLike(child)) return;
    const isBuiltInNew =
      ts.isNewExpression(child) && getBuiltIn(child.expression, context) !== undefined;
    const callee = ts.isCallExpression(child) ? skipCasts(child.expression) : undefined;
    const isInertCall =
      ts.isCallExpression(child) &&
      callee !== undefined &&
      ((ts.isFunctionExpression(callee) &&
        callee.asteriskToken !== undefined &&
        callee.parameters.length === 0 &&
        child.arguments.length === 0) ||
        (getBuiltIn(callee, context) === "Symbol" && child.arguments.every(ts.isStringLiteral)));
    if (
      (ts.isCallExpression(child) &&
        !isInertCall &&
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
  // The prototype object of a generator function that the heap holds from the start.
  const generatorPrototype =
    ts.isPropertyAccessExpression(node) && node.name.text === "prototype"
      ? getGeneratorPrototypeRef(node.expression, context)
      : undefined;
  if (generatorPrototype !== undefined) return generatorPrototype;
  // The prototype of a generator object, or of a generator function's prototype object, that the
  // heap holds.
  const argument = isPrototypeCall(node, context) ? node.arguments[0] : undefined;
  const ofGenerator =
    argument !== undefined && context.heap !== undefined && isGeneratorType(argument, context)
      ? "GeneratorPrototype"
      : argument !== undefined &&
          ts.isPropertyAccessExpression(argument) &&
          argument.name.text === "prototype" &&
          getGeneratorPrototypeRef(argument.expression, context) !== undefined
        ? "Prototype"
        : undefined;
  if (argument !== undefined && ofGenerator !== undefined) {
    return useJavaScript(
      ofGenerator,
      [getHeap(scope, node, context), translateExpression(argument, scope, context)],
      context,
    );
  }
  // The prototype of an array iterator that a call makes, which nothing else can read.
  const iteratorCall = isPrototypeCall(node, context)
    ? getArrayIteratorCall(node.arguments[0], context)
    : undefined;
  if (
    iteratorCall?.kind !== undefined &&
    iteratorCall.kind !== "string" &&
    iteratorCall.isFrom !== true
  ) {
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
  // A built-in iterator that a call makes reads its prototype as getIteratorCall tells.
  const isOfObject =
    (isPrototypeOfCall(node) || isPrototypeCall(node, context)) &&
    getIteratorCall(node.arguments[0], context) === undefined &&
    getWrappedPrimitive(node.arguments[0], context) === undefined &&
    (getKind(node.arguments[0], context) === "object" ||
      (context.heap !== undefined &&
        scope.bindings.has(context.heap) &&
        (isBuiltInObject(node.arguments[0], context) ||
          isFunctionValue(node.arguments[0], context))));
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
      [getHeap(scope, node, context), translateFunctionObject(node.arguments[0], scope, context)],
      context,
    );
  }
  if (isPrototypeOfCall(node) && ts.isPropertyAccessExpression(node.expression)) {
    const owner = getName(node.expression.expression, context);
    if (owner === undefined) return undefined;
    const argumentType = context.checker.getTypeAtLocation(node.arguments[0]);
    // isPrototypeOf gives false for a value that isn't an object, before it reads this.
    const isPrimitive = (argumentType.isUnion() ? argumentType.types : [argumentType]).every(
      (type) => (type.flags & PRIMITIVE_TYPES) !== 0,
    );
    const first = getPrototype(node.arguments[0], context);
    if (first === undefined && !isPrimitive) {
      throw new TlaTypeScriptError("isPrototypeOf needs a value whose type tells", node);
    }
    evaluate(node.arguments[0], scope, context);
    if (isPrimitive || first === undefined) return boolean(false);
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
// The matchers of a pattern, where a set, an assertion, and a backreference keep the flags that a
// modifier group gives them.
type Matcher =
  // A set of characters, with the source of the atom that makes it where a term is one.
  | { kind: "set"; set: CharacterSet; isInverted: boolean; source?: string; flags?: string }
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
  | { kind: "start" | "end"; flags: string }
  | { kind: "boundary"; isInverted: boolean; flags: string }
  | { kind: "lookaround"; body: Matcher; isNegative: boolean; isBehind: boolean }
  // A matcher that first asserts that the next count code units are ones whose codes tla-ts tells.
  | { kind: "known"; count: number; body: Matcher }
  | { kind: "backreference"; indices: number[]; flags: string };

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
  // Groups in separate alternatives may share a name.
  const names = new Map<string, number[]>();
  const scan = { position: 0, count: 0, isInClass: false };
  while (scan.position < source.length) {
    const character = source[scan.position];
    const rest = source.slice(scan.position);
    if (character === "[") scan.isInClass = true;
    if (character === "]") scan.isInClass = false;
    if (character === "(" && !scan.isInClass && /^\((?!\?)|^\(\?<(?![=!])/.test(rest)) {
      scan.count += 1;
      const name = /^\(\?<([^>]*)>/.exec(rest)?.[1];
      if (name !== undefined) names.set(name, [...(names.get(name) ?? []), scan.count]);
    }
    scan.position += character === "\\" ? 2 : 1;
  }
  return { count: scan.count, names };
};

// The properties of strings, and those of them whose strings tla-ts can't list from the code points
// that a script's text holds, as an emoji ZWJ or tag sequence may be of any length.
const STRING_PROPERTIES = new Set([
  "Basic_Emoji",
  "Emoji_Keycap_Sequence",
  "RGI_Emoji_Modifier_Sequence",
  "RGI_Emoji_Flag_Sequence",
  "RGI_Emoji_Tag_Sequence",
  "RGI_Emoji_ZWJ_Sequence",
  "RGI_Emoji",
]);

const UNBOUNDED_STRING_PROPERTIES = new Set([
  "RGI_Emoji_Tag_Sequence",
  "RGI_Emoji_ZWJ_Sequence",
  "RGI_Emoji",
]);

const EMOJI_MODIFIERS = [0x1f3fb, 0x1f3fc, 0x1f3fd, 0x1f3fe, 0x1f3ff];

const REGIONAL_INDICATORS = Array.from({ length: 26 }, (_, offset) => 0x1f1e6 + offset);

// The code units of the longest prefix that the strings of a property of strings may share with
// one of its strings that holds a code unit outside the script's text: a keycap, a flag, or a
// modifier sequence, or the first emoji and joiner or tag character of a ZWJ or tag sequence.
const STRING_PROPERTY_REACH = 5;

// Parses a pattern into its matchers, following the spec's grammar with Annex B's extensions for
// patterns without the u or v flag. TypeScript checks a literal's syntax, which tla-ts reads as
// valid.
const parsePattern = (source: string, flags: string, node: ts.Node, characters: Set<number>) => {
  const isUnicodeSets = flags.includes("v");
  const isUnicode = flags.includes("u") || isUnicodeSets;
  const groups = getGroups(source);
  const cursor = { position: 0, captures: 0, flags };
  const peek = (offset = 0) => source.charAt(cursor.position + offset);
  const isAt = (text: string) => source.startsWith(text, cursor.position);
  const getRest = () => source.slice(cursor.position);
  const invalid = () => new TlaTypeScriptError(`Invalid regular expression: /${source}/`, node);
  const close = () => {
    if (peek() !== ")") throw invalid();
    cursor.position += 1;
  };
  // The character that the pattern writes next, which with the u flag is a code point, so a
  // surrogate pair is one.
  const readCode = () => {
    const code = isUnicode ? (source.codePointAt(cursor.position) ?? 0) : peek().charCodeAt(0);
    cursor.position += code > 0xffff ? 2 : 1;
    return code;
  };
  const getCharacter = (code: number): Matcher => ({
    kind: "set",
    set: getCharacterSet(code),
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
      return {
        kind: source.charAt(cursor.position - 1) === "^" ? "start" : "end",
        flags: cursor.flags,
      };
    }
    if (isAt("\\b") || isAt("\\B")) {
      cursor.position += 2;
      return {
        kind: "boundary",
        isInverted: source.charAt(cursor.position - 1) === "B",
        flags: cursor.flags,
      };
    }
    // A lookbehind, which no quantifier may follow.
    if (isAt("(?<=") || isAt("(?<!")) return parseLookaround();
    const start = cursor.position;
    const parsed = isAt("(?=") || isAt("(?!") ? parseLookaround() : parseAtom();
    const atomSource = source.slice(start, cursor.position);
    const atom =
      parsed.kind === "set" && parsed.source === undefined
        ? {
            ...parsed,
            ...(isUnicodeSets ? { set: getEngineSet(atomSource), isInverted: false } : {}),
            source: atomSource,
            flags: cursor.flags,
          }
        : parsed;
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
  const parseLookaround = (): Matcher => {
    const isBehind = peek(2) === "<";
    const isNegative = peek(isBehind ? 3 : 2) === "!";
    cursor.position += isBehind ? 4 : 3;
    const body = parseDisjunction();
    close();
    return { kind: "lookaround", body, isNegative, isBehind };
  };
  const parseAtom = (): Matcher => {
    const character = peek();
    if (character === ".") {
      cursor.position += 1;
      return {
        kind: "set",
        set: cursor.flags.includes("s") ? () => true : (code) => !LINE_TERMINATORS.includes(code),
        isInverted: false,
      };
    }
    if (character === "(") return parseGroup();
    if (character === "[") return isUnicodeSets ? parseClassSet() : parseClass();
    if (character === "\\") return parseAtomEscape();
    if ("*+?)".includes(character) || /^\{\d+(,\d*)?\}/.test(getRest())) throw invalid();
    return getCharacter(readCode());
  };
  const parseGroup = (): Matcher => {
    // A group that adds or removes the i, m, or s flags for its body, which (?: does neither.
    const modifiers = /^\(\?([ims]*)(?:-([ims]*))?:/.exec(getRest());
    if (modifiers !== null) {
      const outer = cursor.flags;
      const removed = modifiers[2] ?? "";
      cursor.position += modifiers[0].length;
      cursor.flags = [
        ...new Set([
          ...[...outer].filter((flag) => !removed.includes(flag)),
          ...(modifiers[1] ?? ""),
        ]),
      ].join("");
      const body = parseDisjunction();
      cursor.flags = outer;
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
    return (code) => matcher.test(String.fromCodePoint(code));
  };
  const parseAtomEscape = (): Matcher => {
    const escaped = peek(1);
    const decimal = /^[1-9]\d*/.exec(source.slice(cursor.position + 1))?.[0];
    if (decimal !== undefined && Number(decimal) <= groups.count) {
      cursor.position += 1 + decimal.length;
      return { kind: "backreference", indices: [Number(decimal)], flags: cursor.flags };
    }
    if (escaped === "k" && (isUnicode || groups.names.size > 0)) {
      const name = /^\\k<([^>]*)>/.exec(getRest())?.[1];
      const indices = name === undefined ? undefined : groups.names.get(name);
      if (name === undefined || indices === undefined) throw invalid();
      cursor.position += name.length + 4;
      return { kind: "backreference", indices, flags: cursor.flags };
    }
    const classEscape = getClassEscape(escaped, isUnicode && cursor.flags.includes("i"));
    if (classEscape !== undefined) {
      cursor.position += 2;
      return { kind: "set", set: classEscape, isInverted: false };
    }
    if (isUnicodeSets && (escaped === "p" || escaped === "P")) return parseClassSet();
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
    // With the u flag, the escapes of a surrogate pair write one code point.
    const pair = isUnicode ? /^u(d[89ab][\da-f]{2})\\u(d[c-f][\da-f]{2})/i.exec(rest) : null;
    const escape =
      control !== undefined
        ? { length: 1, code: control }
        : letter !== null
          ? { length: 2, code: letter[1].charCodeAt(0) % 32 }
          : pair !== null
            ? {
                length: pair[0].length,
                code:
                  String.fromCharCode(
                    Number.parseInt(pair[1], 16),
                    Number.parseInt(pair[2], 16),
                  ).codePointAt(0) ?? 0,
              }
            : octal !== undefined && !(isUnicode && octal !== "0")
              ? { length: octal.length, code: Number.parseInt(octal, 8) }
              : hex !== null && (hex[3] === undefined || point !== undefined)
                ? { length: hex[0].length, code: point ?? Number.parseInt(hex[1] ?? hex[2], 16) }
                : { length: 1, code: rest.charCodeAt(0) };
    cursor.position += 1 + escape.length;
    return escape.code;
  };
  const parseClassAtom = (): number | CharacterSet => {
    const character = peek();
    if (character === "") throw invalid();
    if (character !== "\\") return readCode();
    const classEscape = getClassEscape(peek(1), isUnicode && cursor.flags.includes("i"));
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
  // With the v flag, the code points that an atom matches as the engine that tla-ts runs on tells,
  // which folds case, reads properties, and runs a class's set operations as the spec does.
  const getEngineMatcher = (text: string) =>
    new RegExp(`^(?:${text})$`, cursor.flags.replace(/[dgmy]/g, ""));
  const getEngineSet = (text: string): CharacterSet => {
    const matcher = getEngineMatcher(text);
    return (code) => matcher.test(String.fromCodePoint(code));
  };
  // The strings of a \q{...}, after its {, as the code points of each.
  const parseClassStrings = () => {
    const strings: number[][] = [[]];
    while (peek() !== "}") {
      if (peek() === "") throw invalid();
      if (peek() === "|") {
        cursor.position += 1;
        strings.push([]);
        continue;
      }
      const isBackspace = isAt("\\b");
      if (isBackspace) cursor.position += 2;
      strings[strings.length - 1].push(
        isBackspace ? 0x08 : peek() === "\\" ? parseCharacterEscape(true) : readCode(),
      );
    }
    cursor.position += 1;
    return strings;
  };
  // A class with the v flag, or a property escape outside one, which may hold strings as well as
  // code points. The engine that tla-ts runs on tells which code points it holds, and which of the
  // strings that the class writes or that its properties of strings may hold of the script's code
  // points. CompileAtom matches each string, the longest first, then a code point, then the empty
  // string. A property of strings's strings that hold other code points are left out, so the match
  // first asserts that the text ahead holds only those that tla-ts tells.
  const parseClassSet = (): Matcher => {
    const start = cursor.position;
    const written: number[][] = [];
    const properties: string[] = [];
    const scan = { depth: 0 };
    do {
      const property = /^\\[pP]\{([^}]*)\}/.exec(getRest());
      if (peek() === "") throw invalid();
      if (isAt("\\q{")) {
        cursor.position += 3;
        written.push(...parseClassStrings());
      } else if (property !== null) {
        properties.push(property[1]);
        cursor.position += property[0].length;
      } else if (peek() === "\\") {
        cursor.position += 2;
      } else {
        scan.depth += peek() === "[" ? 1 : peek() === "]" ? -1 : 0;
        cursor.position += 1;
      }
    } while (scan.depth > 0);
    const text = source.slice(start, cursor.position);
    const matcher = getEngineMatcher(text);
    const alphabet = getAlphabet(characters, true);
    const stringProperties = properties.filter((name) => STRING_PROPERTIES.has(name));
    if (
      stringProperties.some((name) => UNBOUNDED_STRING_PROPERTIES.has(name)) &&
      alphabet.some((code) => code === 0x200d || (code >= 0xe0020 && code <= 0xe007f))
    ) {
      throw new TlaTypeScriptError(
        "tla-ts can't match the emoji ZWJ and tag sequences of a property of strings",
        node,
      );
    }
    const candidates = (
      stringProperties.length === 0
        ? written
        : [
            ...written,
            ...[..."0123456789#*"].map((digit) => [digit.charCodeAt(0), 0xfe0f, 0x20e3]),
            ...alphabet.flatMap((code) => [
              [code, 0xfe0f],
              ...EMOJI_MODIFIERS.map((modifier) => [code, modifier]),
            ]),
            ...REGIONAL_INDICATORS.filter((code) => alphabet.includes(code)).flatMap((first) =>
              REGIONAL_INDICATORS.map((second) => [first, second]),
            ),
          ]
    ).filter((points) => points.length > 1);
    const strings = [...new Set(candidates.map((points) => String.fromCodePoint(...points)))]
      .filter((string) => matcher.test(string))
      .map((string) => [...string].map((point) => point.codePointAt(0) ?? 0))
      .sort((left, right) => right.length - left.length);
    const singles: Matcher = {
      kind: "set",
      set: getEngineSet(text),
      isInverted: false,
      source: text,
      flags: cursor.flags,
    };
    const isIgnoringCase = cursor.flags.includes("i");
    const getPoint = (code: number): Matcher => {
      const escape = `\\u{${code.toString(16)}}`;
      return {
        kind: "set",
        set: isIgnoringCase ? getEngineSet(escape) : getCharacterSet(code),
        isInverted: false,
        source: escape,
        flags: cursor.flags,
      };
    };
    const items: Matcher[] = [
      ...strings.map((points): Matcher => ({ kind: "sequence", items: points.map(getPoint) })),
      singles,
      ...(matcher.test("") ? [{ kind: "sequence" as const, items: [] }] : []),
    ];
    const alternation: Matcher = items.length === 1 ? singles : { kind: "alternation", items };
    return stringProperties.length === 0
      ? alternation
      : { kind: "known", count: STRING_PROPERTY_REACH, body: alternation };
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

const isHighSurrogate = (code: number) => code >= 0xd800 && code <= 0xdbff;

const isLowSurrogate = (code: number) => code >= 0xdc00 && code <= 0xdfff;

// The code points that a script's strings may hold: those in ASCII, the code units outside it that
// its text holds, and with the u or v flag the code points that pairs of those make.
const getAlphabet = (characters: Set<number>, isUnicode: boolean) => {
  const units = [...characters];
  return [
    ...CODE_UNITS.slice(0, 128),
    ...units,
    ...(isUnicode
      ? units
          .filter(isHighSurrogate)
          .flatMap((high) =>
            units
              .filter(isLowSurrogate)
              .map((low) => (high - 0xd800) * 0x400 + low - 0xdc00 + 0x10000),
          )
      : []),
  ];
};

// The string of a code point, where TLA+ writes a lone surrogate as a part of a pair, since its
// strings hold only text that UTF-8 can encode.
export const getCodePoint = (code: number) =>
  isHighSurrogate(code)
    ? apply("SubSeq", [string(String.fromCharCode(code, 0xdc00)), number(1), number(1)])
    : isLowSurrogate(code)
      ? apply("SubSeq", [string(String.fromCharCode(0xd800, code)), number(2), number(2)])
      : string(String.fromCodePoint(code));

// A class as the characters that it matches once Canonicalize maps them, among those in ASCII and
// those that the script's strings may hold, which with the u flag are code points. With the u and i
// flags Canonicalize is simple case folding, which tla-ts reads from the engine it runs on, matching
// the atom's source against each character outside ASCII.
const translateCharacters = (
  matcher: { set: CharacterSet; isInverted: boolean; source?: string },
  flags: string,
  characters: Set<number>,
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
  const known = getAlphabet(characters, isUnicode).slice(128);
  const folding =
    isUnicode && fold !== undefined && matcher.source !== undefined
      ? new RegExp(`^(?:${matcher.source})$`, flags.replace(/[gmy]/g, ""))
      : undefined;
  const isKnownMatched = (code: number) =>
    folding === undefined
      ? !(isUnicode && fold !== undefined) && isMatched(code)
      : folding.test(String.fromCodePoint(code));
  return record("Record", [
    { name: "kind", value: string("set") },
    {
      name: "characters",
      value: set(
        [...CODE_UNITS.slice(0, 128).filter(isMatched), ...known.filter(isKnownMatched)].map(
          getCodePoint,
        ),
      ),
    },
  ]);
};

const translateMatcher = (matcher: Matcher, flags: string, characters: Set<number>): Expression => {
  const kind = { name: "kind", value: string(matcher.kind) };
  // With the v flag, a set's own test tells each code point that it matches.
  if (matcher.kind === "set" && flags.includes("v")) {
    return record("Record", [
      kind,
      {
        name: "characters",
        value: set(getAlphabet(characters, true).filter(matcher.set).map(getCodePoint)),
      },
    ]);
  }
  if (matcher.kind === "set") {
    return translateCharacters(matcher, matcher.flags ?? flags, characters);
  }
  if (matcher.kind === "known") {
    return record("Record", [
      kind,
      { name: "count", value: number(matcher.count) },
      { name: "body", value: translateMatcher(matcher.body, flags, characters) },
    ]);
  }
  if ("items" in matcher) {
    return record("Record", [
      kind,
      {
        name: "items",
        value: tuple(matcher.items.map((item) => translateMatcher(item, flags, characters))),
      },
    ]);
  }
  if (matcher.kind === "group") {
    return record("Record", [
      kind,
      { name: "index", value: number(matcher.index) },
      { name: "body", value: translateMatcher(matcher.body, flags, characters) },
    ]);
  }
  if (matcher.kind === "repeat") {
    return record("Record", [
      kind,
      { name: "body", value: translateMatcher(matcher.body, flags, characters) },
      { name: "min", value: number(matcher.min) },
      { name: "max", value: number(matcher.max) },
      { name: "isGreedy", value: boolean(matcher.isGreedy) },
      { name: "parenIndex", value: number(matcher.parenIndex) },
      { name: "parenCount", value: number(matcher.parenCount) },
    ]);
  }
  if (matcher.kind === "boundary") {
    return record("Record", [
      kind,
      { name: "isInverted", value: boolean(matcher.isInverted) },
      { name: "ignoreCase", value: boolean(matcher.flags.includes("i")) },
    ]);
  }
  if (matcher.kind === "lookaround") {
    return record("Record", [
      kind,
      { name: "body", value: translateMatcher(matcher.body, flags, characters) },
      { name: "isNegative", value: boolean(matcher.isNegative) },
      // A lookbehind matches its body backward, from its last atom to its first.
      { name: "direction", value: number(matcher.isBehind ? -1 : 1) },
    ]);
  }
  if (matcher.kind === "backreference") {
    return record("Record", [
      kind,
      { name: "indices", value: tuple(matcher.indices.map(number)) },
      { name: "ignoreCase", value: boolean(matcher.flags.includes("i")) },
    ]);
  }
  return record("Record", [
    kind,
    { name: "multiline", value: boolean(matcher.flags.includes("m")) },
  ]);
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
  const parsed = parsePattern(pattern, flags, node, context.characters);
  context.prelude.add("JavaScript");
  return record("Record", [
    { name: "pattern", value: translateMatcher(parsed.pattern, flags, context.characters) },
    { name: "captures", value: number(parsed.count) },
    {
      name: "names",
      value: functionFrom(
        [...parsed.names].map(([name, indices]) => [string(name), tuple(indices.map(number))]),
      ),
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

// The methods whose callback takes each element of the array that they visit first.
const ELEMENT_METHODS = new Set(["map", "forEach", "flatMap", "filter", "some", "every", "find"]);

// The values that an expression may take that tla-ts finds as it compiles: the strings that
// literals, String.raw and templates write and that + joins, and the regexps that literals and
// RegExp make, through variables that a script never assigns, the elements that an array method
// passes its callback or a for-of over an array literal takes, the elements of the arrays and the
// characters of the strings that a variable that a script only reads by index is ever given, unless
// the values must be exact, and the arguments that each call in its file passes a function. A run
// checks what it makes against them.
const getConstantValues = (
  node: ts.Expression,
  context: Context,
  visited: ReadonlySet<ts.Node>,
  isExact: boolean,
): (string | RegExpTexts)[] | undefined => {
  const expression = skipCasts(node);
  const getStrings = (inner: ts.Expression) => {
    const values = getConstantValues(inner, context, visited, isExact);
    const strings = values?.filter((value) => typeof value === "string");
    return strings?.length === values?.length ? strings : undefined;
  };
  const join = (parts: (string[] | undefined)[]) =>
    parts.reduce<string[] | undefined>(
      (joined, part) =>
        joined === undefined || part === undefined
          ? undefined
          : joined.flatMap((left) => part.map((right) => left + right)),
      [""],
    );
  if (ts.isStringLiteralLike(expression)) return [expression.text];
  if (ts.isRegularExpressionLiteral(expression)) {
    const end = expression.text.lastIndexOf("/");
    return [{ pattern: expression.text.slice(1, end), flags: expression.text.slice(end + 1) }];
  }
  const made = getRegExpTexts(expression, context, visited, isExact);
  if (made !== undefined) return made;
  if (ts.isTemplateExpression(expression)) {
    return join([
      [expression.head.text],
      ...expression.templateSpans.flatMap((span) => [
        getStrings(span.expression),
        [span.literal.text],
      ]),
    ]);
  }
  if (
    ts.isTaggedTemplateExpression(expression) &&
    ts.isPropertyAccessExpression(expression.tag) &&
    expression.tag.name.text === "raw" &&
    getBuiltIn(expression.tag.expression, context) === "String"
  ) {
    const template = expression.template;
    return ts.isNoSubstitutionTemplateLiteral(template)
      ? [getRawString(template)]
      : join([
          [getRawString(template.head)],
          ...template.templateSpans.flatMap((span) => [
            getStrings(span.expression),
            [getRawString(span.literal)],
          ]),
        ]);
  }
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    return join([getStrings(expression.left), getStrings(expression.right)]);
  }
  if (
    ts.isPropertyAccessExpression(expression) &&
    ["source", "flags"].includes(expression.name.text)
  ) {
    const values = getConstantValues(expression.expression, context, visited, isExact);
    const regexps = values?.flatMap((value) => {
      const valid = typeof value === "string" ? undefined : getValidRegExp(value);
      return valid === undefined
        ? []
        : [expression.name.text === "source" ? valid.source : valid.flags];
    });
    return regexps === undefined || regexps.length < (values?.length ?? 0) ? undefined : regexps;
  }
  const called = getCalledFunction(expression);
  if (called !== undefined) {
    const body = called.body;
    const [statement] = ts.isBlock(body) ? body.statements : [];
    const returned = !ts.isBlock(body)
      ? body
      : body.statements.length === 1 && statement !== undefined && ts.isReturnStatement(statement)
        ? statement.expression
        : undefined;
    return returned === undefined
      ? undefined
      : getConstantValues(returned, context, visited, isExact);
  }
  if (ts.isElementAccessExpression(expression)) {
    return isExact ? undefined : getIndexedValues(expression.expression, context, visited);
  }
  const symbol = ts.isIdentifier(expression) ? getSymbol(expression, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  if (symbol === undefined || declaration === undefined || visited.has(declaration)) {
    return undefined;
  }
  const inner = new Set([...visited, declaration]);
  const getUnion = (nodes: readonly ts.Expression[]) => {
    const values = nodes.map((value) => getConstantValues(value, context, inner, isExact));
    return nodes.length === 0 || values.some((value) => value === undefined)
      ? undefined
      : [...new Set(values.flatMap((value) => value ?? []))];
  };
  if (ts.isVariableDeclaration(declaration)) {
    const loop = declaration.parent.parent;
    // The variable of a for-of over an array literal takes each element.
    if (ts.isForOfStatement(loop)) {
      const iterated = skipCasts(loop.expression);
      return ts.isArrayLiteralExpression(iterated) &&
        !iterated.elements.some(ts.isSpreadElement) &&
        !isAssigned(symbol, loop.statement, context)
        ? getUnion(iterated.elements)
        : undefined;
    }
    // A let or a var holds its initializer where a script never assigns it and reads it only after
    // the declaration, in the same function.
    const owner = ts.findAncestor(declaration.parent, ts.isFunctionLike);
    const isReadAfter = findNodes(declaration.getSourceFile(), ts.isIdentifier).every(
      (reference) =>
        reference === declaration.name ||
        getSymbol(reference, context.checker) !== symbol ||
        (reference.pos > declaration.end &&
          ts.findAncestor(reference.parent, ts.isFunctionLike) === owner),
    );
    return declaration.initializer !== undefined &&
      ((declaration.parent.flags & ts.NodeFlags.Const) !== 0 ||
        (isReadAfter && !isAssigned(symbol, declaration.getSourceFile(), context)))
      ? getConstantValues(declaration.initializer, context, inner, isExact)
      : undefined;
  }
  if (
    !ts.isParameter(declaration) ||
    declaration.initializer !== undefined ||
    declaration.dotDotDotToken !== undefined ||
    isAssigned(symbol, declaration.parent, context)
  ) {
    return undefined;
  }
  const owner = declaration.parent;
  const position = owner.parameters.indexOf(declaration);
  const call = owner.parent;
  // The first parameter of an array method's callback takes each element of an array literal.
  if (
    ts.isCallExpression(call) &&
    call.arguments.at(0) === owner &&
    ts.isPropertyAccessExpression(call.expression) &&
    ELEMENT_METHODS.has(call.expression.name.text)
  ) {
    const receiver = skipCasts(call.expression.expression);
    return position === 0 &&
      ts.isArrayLiteralExpression(receiver) &&
      !receiver.elements.some(ts.isSpreadElement)
      ? getUnion(receiver.elements)
      : undefined;
  }
  const name = ts.isFunctionDeclaration(owner)
    ? owner.name
    : ts.isVariableDeclaration(call) && ts.isIdentifier(call.name)
      ? call.name
      : undefined;
  const callee = name && getSymbol(name, context.checker);
  if (callee === undefined) return undefined;
  const calls = findNodes(owner.getSourceFile(), ts.isCallExpression).filter(
    (inner) => getSymbol(inner.expression, context.checker) === callee,
  );
  const values = calls.map((inner) => inner.arguments.at(position));
  return values.every((value) => value !== undefined && !ts.isSpreadElement(value))
    ? getUnion(values.filter((value) => value !== undefined))
    : undefined;
};

// The elements and characters that an index may read of a variable that a script declares once and
// only ever sets to arrays of strings, which it otherwise only reads by index or for their length,
// or to strings. An index past the end reads undefined, which none of them is.
const getIndexedValues = (node: ts.Expression, context: Context, visited: ReadonlySet<ts.Node>) => {
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  if (
    symbol === undefined ||
    declaration === undefined ||
    symbol.declarations?.length !== 1 ||
    !ts.isVariableDeclaration(declaration) ||
    !ts.isIdentifier(declaration.name) ||
    ts.isForInStatement(declaration.parent.parent) ||
    ts.isForOfStatement(declaration.parent.parent) ||
    visited.has(declaration)
  ) {
    return undefined;
  }
  const file = declaration.getSourceFile();
  const writes = findNodes(file, (inner): inner is ts.Node => {
    const target = getAssignedTarget(inner);
    return target !== undefined && isWrittenBy(target, symbol, context);
  });
  const given = writes.map((write) =>
    ts.isBinaryExpression(write) &&
    write.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isIdentifier(write.left)
      ? write.right
      : undefined,
  );
  const sources = [declaration.initializer, ...given].map((source) =>
    source === undefined ? undefined : skipCasts(source),
  );
  if (given.includes(undefined) || sources.every((source) => source === undefined)) {
    return undefined;
  }
  // An array may change in place where a script does more than read it.
  const isRead = (reference: ts.Identifier) => {
    const parent = reference.parent;
    return (
      (ts.isBinaryExpression(parent) && parent.left === reference) ||
      (((ts.isElementAccessExpression(parent) && parent.expression === reference) ||
        (ts.isPropertyAccessExpression(parent) &&
          parent.expression === reference &&
          parent.name.text === "length")) &&
        getAssignedTarget(parent.parent) !== parent &&
        !ts.isDeleteExpression(parent.parent))
    );
  };
  if (
    sources.some((source) => source !== undefined && ts.isArrayLiteralExpression(source)) &&
    !findNodes(file, ts.isIdentifier).every(
      (reference) =>
        reference === declaration.name ||
        getSymbol(reference, context.checker) !== symbol ||
        isRead(reference),
    )
  ) {
    return undefined;
  }
  const inner = new Set([...visited, declaration]);
  const values = sources.map((source) => {
    if (source === undefined) return [];
    const elements = ts.isArrayLiteralExpression(source) ? source.elements : undefined;
    if (elements?.some(ts.isSpreadElement)) return undefined;
    const parts = (elements ?? [source]).map((part) =>
      getConstantValues(part, context, inner, false),
    );
    const strings = parts.flatMap((part) => part ?? [undefined]);
    if (!strings.every((text) => typeof text === "string")) return undefined;
    return elements === undefined ? strings.flatMap((text) => text.split("")) : strings;
  });
  return values.includes(undefined)
    ? undefined
    : [...new Set(values.flatMap((value) => value ?? []))];
};

// The function that a call without arguments makes and runs in place, where it takes no parameters
// and is neither async nor a generator.
const getCalledFunction = (node: ts.Expression) => {
  const callee =
    ts.isCallExpression(node) && node.arguments.length === 0
      ? skipCasts(node.expression)
      : undefined;
  return callee !== undefined &&
    (ts.isFunctionExpression(callee) || ts.isArrowFunction(callee)) &&
    callee.parameters.length === 0 &&
    callee.asteriskToken === undefined &&
    !callee.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
    ? callee
    : undefined;
};

// The patterns and flags that new RegExp or RegExp may make, where its arguments are strings that
// tla-ts finds as it compiles, or the one regexp that a pattern may be and literal flags, without
// which new RegExp copies the regexp's flags and RegExp gives the regexp itself.
const getRegExpTexts = (
  node: ts.Node,
  context: Context,
  visited: ReadonlySet<ts.Node>,
  isExact: boolean,
): RegExpTexts[] | undefined => {
  if (
    (!ts.isNewExpression(node) && !ts.isCallExpression(node)) ||
    getBuiltIn(node.expression, context) !== "RegExp"
  ) {
    return undefined;
  }
  const values = node.arguments ?? [];
  const regexps = values[0] && getRegExpValues(values[0], context, visited, isExact);
  if (regexps !== undefined) {
    const [regexp] = regexps;
    const flags = values[1];
    const isCopied = flags === undefined || isUndefinedValue(flags, context);
    const given =
      flags && (ts.isStringLiteralLike(flags) ? flags.text : getPrimitiveText(flags, context));
    return values.length > 2 ||
      regexp === undefined ||
      regexps.some((other) => other.pattern !== regexp.pattern || other.flags !== regexp.flags) ||
      (isCopied && ts.isCallExpression(node)) ||
      (!isCopied && given === undefined)
      ? undefined
      : [{ pattern: regexp.pattern, flags: isCopied ? regexp.flags : (given ?? "") }];
  }
  const texts = values.map((value) => {
    const primitive = getPrimitiveText(value, context);
    if (primitive !== undefined) return [primitive];
    const constants = getConstantValues(value, context, visited, isExact);
    const strings = constants?.filter((constant) => typeof constant === "string");
    return getKind(value, context) === "string" && strings?.length === constants?.length
      ? strings
      : undefined;
  });
  const patterns = values.length === 0 ? [""] : texts.at(0);
  const flags = values.length < 2 ? [""] : texts.at(1);
  return values.length > 2 || patterns === undefined || flags === undefined
    ? undefined
    : patterns.flatMap((pattern) => flags.map((flag) => ({ pattern, flags: flag })));
};

// The regexps that an expression may be, where tla-ts finds them all as it compiles.
const getRegExpValues = (
  node: ts.Expression,
  context: Context,
  visited: ReadonlySet<ts.Node>,
  isExact: boolean,
) => {
  const values = getConstantValues(node, context, visited, isExact);
  const regexps = values?.filter((value) => typeof value !== "string");
  return regexps?.length === values?.length ? regexps : undefined;
};

// Whether an expression is undefined without effects: undefined itself, void of a literal, or the
// call of a function that runs in place with an empty body.
export const isUndefinedValue = (node: ts.Expression, context: Context) => {
  const inner = skipCasts(node);
  const body = getCalledFunction(inner)?.body;
  return (
    (ts.isIdentifier(inner) &&
      inner.text === "undefined" &&
      (context.checker.getTypeAtLocation(inner).flags & ts.TypeFlags.Undefined) !== 0) ||
    (ts.isVoidExpression(inner) && ts.isLiteralExpression(inner.expression)) ||
    (body !== undefined && ts.isBlock(body) && body.statements.length === 0)
  );
};

// The text that RegExp takes from a primitive literal other than a string: none from undefined, and
// what ToString gives from the others.
const getPrimitiveText = (node: ts.Expression, context: Context) => {
  const inner = skipCasts(node);
  if (isUndefinedValue(inner, context)) return "";
  if (inner.kind === ts.SyntaxKind.TrueKeyword) return "true";
  if (inner.kind === ts.SyntaxKind.FalseKeyword) return "false";
  if (inner.kind === ts.SyntaxKind.NullKeyword) return "null";
  return ts.isNumericLiteral(inner) ? String(Number(inner.text)) : undefined;
};

const getValidRegExp = (texts: RegExpTexts) => {
  try {
    return new RegExp(texts.pattern, texts.flags);
  } catch {
    return undefined;
  }
};

// new RegExp or RegExp of literals that make a valid regexp, whose source the engine that tla-ts
// runs on escapes as the spec's EscapeRegExpPattern does.
export const getMadeRegExp = (node: ts.Node, context: Context) => {
  const made = getRegExpTexts(node, context, new Set(), false)?.map((texts) => {
    const valid = getValidRegExp(texts);
    return valid === undefined ? undefined : { ...texts, source: valid.source };
  });
  return made?.every((texts) => texts !== undefined) ? made : undefined;
};

// new RegExp or RegExp of literals that make no valid regexp, which throws a SyntaxError.
export const isInvalidRegExp = (node: ts.Node, context: Context) => {
  const texts = getRegExpTexts(node, context, new Set(), true);
  return texts?.length === 1 && getValidRegExp(texts[0]) === undefined;
};

// A call of BigInt on a string literal that isn't a StringIntegerLiteral, which throws a
// SyntaxError: an integer with an optional sign in decimal, or one in hex, octal, or binary, between
// white space, which \s matches as StrWhiteSpaceChar does.
export const isInvalidBigIntText = (node: ts.Node, context: Context) => {
  const argument = ts.isCallExpression(node) ? node.arguments.at(0) : undefined;
  return (
    ts.isCallExpression(node) &&
    node.arguments.length === 1 &&
    getBuiltIn(node.expression, context) === "BigInt" &&
    argument !== undefined &&
    ts.isStringLiteral(argument) &&
    !/^\s*(?:[+-]?\d+|0[xX][0-9a-fA-F]+|0[oO][0-7]+|0[bB][01]+)?\s*$/.test(argument.text)
  );
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
// stays 0. A regexp whose arguments aren't all literals is the one of the texts that they give as
// it runs.
export const translateRegExpValue = (node: ts.Node, scope: Scope, context: Context) => {
  const made = getMadeRegExp(node, context);
  if (
    made !== undefined &&
    (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
    !(node.arguments ?? []).every(
      (argument) =>
        ts.isStringLiteralLike(argument) ||
        getPrimitiveText(argument, context) !== undefined ||
        getRegExpValues(argument, context, new Set(), false) !== undefined,
    )
  ) {
    const values = (node.arguments ?? []).map((argument) => {
      const primitive = getPrimitiveText(argument, context);
      return primitive === undefined
        ? translateExpression(argument, scope, context)
        : string(primitive);
    });
    return share(values[0], "pattern", context, (pattern) =>
      share(values.at(1) ?? string(""), "flags", context, (flags) =>
        made.reduceRight<Expression>(
          (otherwise, texts) =>
            ifExpression(
              apply("/\\", [
                apply("=", [pattern, string(texts.pattern)]),
                apply("=", [flags, string(texts.flags)]),
              ]),
              translateRegExp(texts.pattern, texts.flags, texts.source, node, context),
              otherwise,
            ),
          apply("Assert", [
            boolean(false),
            string("tla-ts can't make a regexp of a pattern that it didn't find as it compiled"),
          ]),
        ),
      ),
    );
  }
  const literal = ts.isRegularExpressionLiteral(node)
    ? undefined
    : (made?.[0] ?? getStringRegExp(node));
  const copied = (ts.isNewExpression(node) || ts.isCallExpression(node)) && node.arguments?.[0];
  if (literal !== undefined) {
    const translated = translateRegExp(
      literal.pattern,
      literal.flags,
      literal.source,
      node,
      context,
    );
    // With objects, new RegExp reads IsRegExp of the regexp that it copies, which tla-ts follows
    // only while a script hasn't changed the regexp.
    return copied &&
      !ts.isRegularExpressionLiteral(skipCasts(copied)) &&
      getRegExpValues(copied, context, new Set(), false) !== undefined &&
      context.heap !== undefined
      ? ifExpression(
          apply("=", [
            field(
              useJavaScript(
                "RegExpOf",
                [
                  getHeap(scope, node, context),
                  translateExpression(copied, scope, context),
                  set([string("RegExp.prototype")]),
                ],
                context,
              ),
              "source",
            ),
            string(literal.source),
          ]),
          translated,
          apply("Assert", [
            boolean(false),
            string("tla-ts can't make a regexp of a pattern that it didn't find as it compiled"),
          ]),
        )
      : translated;
  }
  if (!ts.isRegularExpressionLiteral(node))
    throw new TlaTypeScriptError("Unsupported regexp", node);
  const end = node.text.lastIndexOf("/");
  const pattern = node.text.slice(1, end);
  return translateRegExp(pattern, node.text.slice(end + 1), pattern, node, context);
};
