import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type CalledMethod,
  type Context,
  type FunctionNode,
  getNewClass,
  getObjectMethod,
  getRunConstructor,
  getSymbol,
  getUndefined,
  isHeapClass,
  isStatementNew,
  isMethodCall,
  type MethodCall,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { getConstructor } from "./exceptions";
import { translateExpression } from "./expressions";
import {
  getBuiltIn,
  isBuiltInObject,
  translateBuiltInObject,
  translateFunctionPrototype,
} from "./intrinsics";
import { useJavaScript } from "./javascript";
import { createStateScope, type Scope } from "./scope";
import { apply, boolean, functionFrom, identifier, number, record, string } from "./tla";
import { getKind, isEvery, isHeapType, isNumberLike } from "./types";

const SHORT_CIRCUITS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

export const getHeap = (scope: Scope, node: ts.Node, context: Context) => {
  const heap = context.heap === undefined ? undefined : scope.bindings.get(context.heap);
  if (heap === undefined) throw new TlaTypeScriptError("Use objects only in statements", node);
  return heap;
};

// An object, which may be a built-in one such as Math or Array.prototype.
export const translateObjectValue = (node: ts.Expression, scope: Scope, context: Context) =>
  translateBuiltInObject(node, scope, context) ?? translateExpression(node, scope, context);

const getNumericKey = (node: ts.NumericLiteral) => string(String(Number(node.text)));

export const translatePropertyKey = (node: ts.Expression, scope: Scope, context: Context) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return string(node.text);
  }
  if (ts.isNumericLiteral(node)) return getNumericKey(node);
  const value = translateExpression(node, scope, context);
  if (getKind(node, context) === "string") return value;
  if (isNumberLike(node, context)) return apply("ToString", [value]);
  throw new TlaTypeScriptError("Use a string or a number as a key", node);
};

const translateMemberKey = (name: ts.PropertyName, scope: Scope, context: Context) => {
  if (ts.isComputedPropertyName(name)) return translatePropertyKey(name.expression, scope, context);
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return string(name.text);
  if (ts.isNumericLiteral(name)) return getNumericKey(name);
  throw new TlaTypeScriptError("Unsupported key", name);
};

// The literal that a function returns, when its body returns only that, so that the JavaScript
// module can call it as a getter or a setter.
const getConstantResult = (node: FunctionNode, context: Context) => {
  const translateLiteral = (returned: ts.Expression) =>
    ts.isStringLiteral(returned) ||
    ts.isNoSubstitutionTemplateLiteral(returned) ||
    returned.kind === ts.SyntaxKind.TrueKeyword ||
    returned.kind === ts.SyntaxKind.FalseKeyword ||
    returned.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isIdentifier(returned) && returned.text === "undefined") ||
    (ts.isNumericLiteral(returned) && /^\d{1,9}$/.test(returned.text))
      ? translateExpression(returned, createStateScope(context), context)
      : undefined;
  const body = node.body;
  if (body === undefined) return undefined;
  if (!ts.isBlock(body)) return translateLiteral(body);
  const statement = body.statements.at(0);
  if (statement === undefined) return getUndefined(context);
  if (body.statements.length > 1 || !ts.isReturnStatement(statement)) return undefined;
  return statement.expression === undefined
    ? getUndefined(context)
    : translateLiteral(statement.expression);
};

// A model value that names a function, which records what the function returns if that's a
// literal.
const getModelValue = (
  node: FunctionNode,
  symbol: ts.Symbol,
  preferred: string,
  context: Context,
) => {
  const value = getConstructor(symbol, context, preferred);
  const result = value.kind === "Identifier" ? getConstantResult(node, context) : undefined;
  if (value.kind === "Identifier" && result !== undefined) {
    context.constantFunctions.set(value.name, result);
  }
  return value;
};

export const translateFunctionValue = (
  node: ts.FunctionExpression | ts.ArrowFunction | ts.FunctionDeclaration,
  context: Context,
) => {
  const symbol = context.checker.getTypeAtLocation(node).getSymbol();
  if (symbol === undefined) throw new TlaTypeScriptError("Unsupported function", node);
  const declared = node.parent;
  const name = ts.isFunctionDeclaration(node)
    ? (node.name?.text ?? "anonymous")
    : ts.isVariableDeclaration(declared) && ts.isIdentifier(declared.name)
      ? declared.name.text
      : "anonymous";
  return getModelValue(node, symbol, `${name}Function`, context);
};

// A model value that names a method of an object literal.
export const getMethodValue = (method: ts.MethodDeclaration, context: Context) => {
  const symbol = getSymbol(method.name, context.checker);
  if (symbol === undefined) throw new TlaTypeScriptError("Name this method", method);
  return getModelValue(method, symbol, `${method.name.getText()}Method`, context);
};

// The table of the constant functions that a script holds, which the JavaScript module calls as
// getters and setters.
export const translateConstantFunctions = (context: Context) =>
  functionFrom(
    [...context.constantFunctions].map((entry): [Expression, Expression] => [
      identifier(entry[0]),
      entry[1],
    ]),
  );

// Whether the object a call's receiver names still holds the method the call inlines, since a
// script may replace it.
export const translateHoldsMethod = (called: CalledMethod, scope: Scope, context: Context) =>
  apply("=", [
    useJavaScript(
      "Get",
      [
        getHeap(scope, called.receiver, context),
        translateObjectValue(called.receiver, scope, context),
        string(called.key),
      ],
      context,
    ),
    getMethodValue(called.method, context),
  ]);

export const translateObject = (
  node: ts.ObjectLiteralExpression,
  scope: Scope,
  context: Context,
) => {
  context.prelude.add("JavaScript");
  return node.properties.reduce((object, property) => {
    const isPrototype =
      ts.isPropertyAssignment(property) &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === "__proto__";
    if (isPrototype) {
      return useJavaScript(
        "WithPrototype",
        [object, translateExpression(property.initializer, scope, context)],
        context,
      );
    }
    if (ts.isPropertyAssignment(property)) {
      return useJavaScript(
        "Put",
        [
          object,
          translateMemberKey(property.name, scope, context),
          translateExpression(property.initializer, scope, context),
        ],
        context,
      );
    }
    if (ts.isShorthandPropertyAssignment(property)) {
      return useJavaScript(
        "Put",
        [object, string(property.name.text), translateExpression(property.name, scope, context)],
        context,
      );
    }
    const method = getObjectMethod(property, context);
    if (method !== undefined) {
      return useJavaScript(
        "Put",
        [object, translateMemberKey(method.name, scope, context), getMethodValue(method, context)],
        context,
      );
    }
    if (ts.isSpreadAssignment(property) && getKind(property.expression, context) === "object") {
      return useJavaScript(
        "Spread",
        [
          object,
          getHeap(scope, property, context),
          translateExpression(property.expression, scope, context),
        ],
        context,
      );
    }
    throw new TlaTypeScriptError("Unsupported object member", property);
  }, identifier("EmptyObject"));
};

// The heap after a node from getAllocated adds the object it makes.
// The constructor object and the prototype that a class makes, prototype first, so the
// constructor object is the last on the heap.
const translateClass = (
  node: ts.ClassLikeDeclaration,
  heap: Expression,
  scope: Scope,
  context: Context,
) => {
  const getRef = (offset: number) => useJavaScript("NextRef", [heap, number(offset)], context);
  const define = (object: Expression, key: Expression, value: Expression, flags: boolean[]) =>
    useJavaScript("Define", [object, key, value, ...flags.map(boolean)], context);
  const defineMethods = (object: Expression, isStatic: boolean) =>
    node.members.reduce((current, member) => {
      const method = getObjectMethod(member, context);
      const isStaticMethod = (method === undefined ? [] : (ts.getModifiers(method) ?? [])).some(
        (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
      );
      return method === undefined || isStaticMethod !== isStatic
        ? current
        : define(
            current,
            translateMemberKey(method.name, scope, context),
            getMethodValue(method, context),
            [true, false, true],
          );
    }, object);
  const constructor = node.members.find(ts.isConstructorDeclaration);
  const parameters = constructor?.parameters ?? [];
  const length = parameters.findIndex(
    (parameter) =>
      parameter.initializer !== undefined ||
      parameter.dotDotDotToken !== undefined ||
      parameter.questionToken !== undefined,
  );
  const named = ts.isClassExpression(node) ? node.parent : node;
  const name =
    node.name?.text ??
    (ts.isVariableDeclaration(named) && ts.isIdentifier(named.name) ? named.name.text : "");
  const prototype = defineMethods(
    define(identifier("EmptyObject"), string("constructor"), getRef(2), [true, false, true]),
    false,
  );
  const object = defineMethods(
    define(
      define(
        define(
          useJavaScript("ClassObject", [translateFunctionPrototype(node, context)], context),
          string("length"),
          number(length === -1 ? parameters.length : length),
          [false, false, true],
        ),
        string("name"),
        string(name),
        [false, false, true],
      ),
      string("prototype"),
      getRef(1),
      [false, false, false],
    ),
    true,
  );
  return useJavaScript(
    "Allocate",
    [useJavaScript("Allocate", [heap, prototype], context), object],
    context,
  );
};

// An instance of a heap class with its fields, before the constructor runs.
const translateInstance = (
  node: ts.NewExpression,
  created: ts.ClassLikeDeclaration,
  heap: Expression,
  scope: Scope,
  context: Context,
) =>
  created.members.reduce(
    (object, member) =>
      ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)
        ? useJavaScript(
            "Put",
            [
              object,
              string(member.name.text),
              member.initializer === undefined
                ? getUndefined(context)
                : translateExpression(member.initializer, scope, context),
            ],
            context,
          )
        : object,
    useJavaScript(
      "WithPrototype",
      [
        identifier("EmptyObject"),
        useJavaScript(
          "Get",
          [heap, translateExpression(node.expression, scope, context), string("prototype")],
          context,
        ),
      ],
      context,
    ),
  );

export const translateAllocated = (node: ts.Node, scope: Scope, context: Context) => {
  const heap = getHeap(scope, node, context);
  if (ts.isClassLike(node)) return translateClass(node, heap, scope, context);
  const created = getNewClass(node, context);
  if (created !== undefined && ts.isNewExpression(node)) {
    return useJavaScript(
      "Allocate",
      [heap, translateInstance(node, created, heap, scope, context)],
      context,
    );
  }
  if (ts.isObjectLiteralExpression(node)) {
    return useJavaScript("Allocate", [heap, translateObject(node, scope, context)], context);
  }
  if (isNewObject(node, context)) {
    return useJavaScript("Allocate", [heap, identifier("EmptyObject")], context);
  }
  if (ts.isCallExpression(node) && isDescription(node, context)) {
    const described = useJavaScript(
      "Describe",
      [
        heap,
        translateObjectValue(node.arguments[0], scope, context),
        translatePropertyKey(node.arguments[1], scope, context),
      ],
      context,
    );
    return useJavaScript("Allocate", [heap, described], context);
  }
  if (!ts.isCallExpression(node) || !isCreation(node, context)) {
    throw new TlaTypeScriptError("Unsupported object", node);
  }
  const prototype = node.arguments[0];
  const properties = node.arguments.at(1);
  return useJavaScript(
    "Create",
    [
      heap,
      translateObjectValue(prototype, scope, context),
      properties === undefined
        ? getUndefined(context)
        : translateExpression(properties, scope, context),
    ],
    context,
  );
};

// Whether an object literal becomes a heap object. One that a built-in function takes, such as
// Array.from({ length: 2 }), does too, whatever type the function asks for.
const isObjectValue = (node: ts.ObjectLiteralExpression, context: Context) => {
  const checker = context.checker;
  const contextual = checker.getContextualType(node);
  const parent = node.parent;
  const isBuiltInArgument =
    ts.isCallExpression(parent) &&
    (checker.getResolvedSignature(parent)?.getDeclaration()?.getSourceFile().isDeclarationFile ??
      false);
  return (
    getKind(node, context) === "object" ||
    isBuiltInArgument ||
    contextual === undefined ||
    (contextual.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any)) !== 0 ||
    checker.isTypeAssignableTo(checker.getNumberType(), contextual) ||
    isHeapType(checker.getNonNullableType(contextual), node, context)
  );
};

export const isDescription = (node: ts.Node, context: Context) =>
  isMethodCall(node) &&
  node.expression.expression.getText() === "Object" &&
  node.expression.name.text === "getOwnPropertyDescriptor" &&
  node.arguments.length >= 2 &&
  (getKind(node.arguments[0], context) === "object" || isBuiltInObject(node.arguments[0], context));

// Object.create, with a prototype that tla-ts can tell is an object or null.
export const isCreation = (node: ts.Node, context: Context) => {
  if (
    !isMethodCall(node) ||
    node.expression.expression.getText() !== "Object" ||
    node.expression.name.text !== "create" ||
    node.arguments.length === 0
  ) {
    return false;
  }
  const prototype = node.arguments[0];
  const properties = node.arguments.at(1);
  return (
    (prototype.kind === ts.SyntaxKind.NullKeyword ||
      getKind(prototype, context) === "object" ||
      isBuiltInObject(prototype, context)) &&
    (properties === undefined || getKind(properties, context) === "object")
  );
};

export const isAllocation = (node: ts.Node, context: Context) =>
  (ts.isCallExpression(node) && (isDescription(node, context) || isCreation(node, context))) ||
  isNewObject(node, context);

// new Object() with no value, which makes an empty object as {} does.
export const isNewObject = (node: ts.Node, context: Context) => {
  if (
    context.heap === undefined ||
    !ts.isNewExpression(node) ||
    getBuiltIn(node.expression, context) !== "Object"
  ) {
    return false;
  }
  // The argument is dropped, so it must be one that can't do anything.
  const argument = node.arguments?.at(0);
  return (
    (node.arguments?.length ?? 0) <= 1 &&
    (argument === undefined ||
      argument.kind === ts.SyntaxKind.NullKeyword ||
      (ts.isVoidExpression(argument) && ts.isLiteralExpression(argument.expression)) ||
      (ts.isIdentifier(argument) &&
        isEvery(
          context.checker.getTypeAtLocation(argument),
          ts.TypeFlags.Undefined | ts.TypeFlags.Null,
        )))
  );
};

// The object literals, descriptions, and creations that evaluating a node makes, innermost first.
// Functions make none. An operand that only sometimes runs makes its object literals anyway, as
// making an object that nothing reads can't be seen, but not its descriptions and creations,
// which may stop the run.
export const getAllocated = (node: ts.Node, context: Context, isSometimes = false): ts.Node[] => {
  if (context.heap === undefined || ts.isFunctionLike(node)) return [];
  if (ts.isClassLike(node)) return isHeapClass(node, context) && !isSometimes ? [node] : [];
  if (ts.isOptionalChain(node)) return [];
  if (ts.isConditionalExpression(node)) {
    return [
      ...getAllocated(node.condition, context, isSometimes),
      ...getAllocated(node.whenTrue, context, true),
      ...getAllocated(node.whenFalse, context, true),
    ];
  }
  if (ts.isBinaryExpression(node)) {
    const kind = node.operatorToken.kind;
    if (SHORT_CIRCUITS.has(kind)) {
      return [
        ...getAllocated(node.left, context, isSometimes),
        ...getAllocated(node.right, context, true),
      ];
    }
    const isPattern =
      kind === ts.SyntaxKind.EqualsToken &&
      (ts.isObjectLiteralExpression(node.left) || ts.isArrayLiteralExpression(node.left));
    return [
      ...(isPattern ? [] : getAllocated(node.left, context, isSometimes)),
      ...getAllocated(node.right, context, isSometimes),
    ];
  }
  const nested: ts.Node[] = [];
  ts.forEachChild(node, (child) => {
    nested.push(...getAllocated(child, context, isSometimes));
  });
  const created = getNewClass(node, context);
  const isAllocated =
    (ts.isObjectLiteralExpression(node) && isObjectValue(node, context)) ||
    isNewObject(node, context) ||
    (!isSometimes && isAllocation(node, context)) ||
    (!isSometimes &&
      created !== undefined &&
      ts.isNewExpression(node) &&
      (getRunConstructor(created) === undefined || isStatementNew(node)));
  return isAllocated ? [...nested, node] : nested;
};

// The operators of the built-in functions that change an object's properties, with how many
// arguments each takes and which of them must be objects.
const OBJECT_CHANGES = new Map([
  ["defineProperty", { operator: "DefineProperty", arity: 3, objects: [0, 2] }],
  ["defineProperties", { operator: "DefineProperties", arity: 2, objects: [0, 1] }],
  ["freeze", { operator: "Freeze", arity: 1, objects: [0] }],
  ["seal", { operator: "Seal", arity: 1, objects: [0] }],
  ["preventExtensions", { operator: "PreventExtensions", arity: 1, objects: [0] }],
]);

const isConstruct = (node: MethodCall) =>
  node.expression.expression.getText() === "Reflect" && node.expression.name.text === "construct";

export const isObjectChange = (node: ts.Node): node is MethodCall =>
  isMethodCall(node) &&
  ((node.expression.expression.getText() === "Object" &&
    OBJECT_CHANGES.has(node.expression.name.text)) ||
    isConstruct(node));

// The error that JavaScript itself may throw where a node runs.
export const getEngineError = (node: ts.Node) =>
  isObjectChange(node) && (node.expression.name.text.startsWith("define") || isConstruct(node))
    ? "TypeError"
    : undefined;

// Reflect.construct of a function with an empty body, without arguments, only checks that its
// target and its newTarget are constructors, as harness/isConstructor.js uses it.
const translateConstruct = (node: MethodCall, scope: Scope, context: Context) => {
  const target = node.arguments.at(0);
  const argumentList = node.arguments.at(1);
  const newTarget = node.arguments.at(2) ?? target;
  const isEmptyFunction =
    target !== undefined &&
    ts.isFunctionExpression(target) &&
    target.asteriskToken === undefined &&
    (ts.getModifiers(target) ?? []).length === 0 &&
    target.body.statements.length === 0;
  if (
    !isEmptyFunction ||
    argumentList === undefined ||
    !ts.isArrayLiteralExpression(argumentList) ||
    argumentList.elements.length > 0 ||
    newTarget === undefined ||
    node.arguments.length > 3
  ) {
    throw new TlaTypeScriptError(`Unsupported statement: ${node.getText()}`, node);
  }
  const heap = getHeap(scope, node, context);
  return {
    change: record("Record", [
      { name: "heap", value: heap },
      {
        name: "isDone",
        value:
          newTarget === target
            ? boolean(true)
            : useJavaScript(
                "IsConstructor",
                [heap, translateExpression(newTarget, scope, context)],
                context,
              ),
      },
    ]),
    isFallible: true,
  };
};

// A call that changes an object's properties. A definition gives a record of the heap after it
// and whether it succeeded, since one that fails throws a TypeError, and the others give the heap.
export const translateObjectChange = (node: MethodCall, scope: Scope, context: Context) => {
  if (isConstruct(node)) return translateConstruct(node, scope, context);
  const method = node.expression.name.text;
  const change = OBJECT_CHANGES.get(method);
  const isObject = (position: number) => {
    const argument = node.arguments.at(position);
    return (
      argument !== undefined &&
      (getKind(argument, context) === "object" ||
        (position === 0 && isBuiltInObject(argument, context)))
    );
  };
  if (change === undefined || !change.objects.every(isObject)) {
    throw new TlaTypeScriptError(`Unsupported statement: ${node.getText()}`, node);
  }
  const values = node.arguments
    .slice(0, change.arity)
    .map((argument, position) =>
      method === "defineProperty" && position === 1
        ? translatePropertyKey(argument, scope, context)
        : translateObjectValue(argument, scope, context),
    );
  return {
    change: useJavaScript(change.operator, [getHeap(scope, node, context), ...values], context),
    isFallible: method.startsWith("define"),
  };
};
