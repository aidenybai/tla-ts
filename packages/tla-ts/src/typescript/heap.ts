import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type HeapClass,
  type CalledMethod,
  type Context,
  type FunctionNode,
  getNewClass,
  getParameters,
  getObjectMethod,
  getRunConstructor,
  getSymbol,
  getUndefined,
  getPrivateKey,
  isPlainAccessor,
  isPrivateMember,
  isHeapClass,
  isHeapFunction,
  isOnce,
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
  translatePrototype,
} from "./intrinsics";
import { useJavaScript } from "./javascript";
import { createStateScope, type Scope } from "./scope";
import {
  apply,
  boolean,
  functionFrom,
  identifier,
  junction,
  number,
  record,
  string,
  tuple,
} from "./tla";
import {
  getArrayLiteral,
  getKind,
  isEvery,
  isHeapType,
  isNumberLike,
  isSequenceType,
} from "./types";

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
  if (isNumberLike(node, context)) {
    return context.hasSpecialNumbers
      ? useJavaScript("StringOf", [value], context)
      : apply("ToString", [value]);
  }
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
  symbol: ts.Symbol | ts.Node,
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
export const getMethodValue = (
  method: ts.MethodDeclaration | ts.GetAccessorDeclaration,
  context: Context,
) => {
  if (ts.isGetAccessorDeclaration(method)) return getAccessorValue(method, context);
  const symbol = getSymbol(method.name, context.checker);
  if (symbol === undefined) throw new TlaTypeScriptError("Name this method", method);
  return getModelValue(method, symbol, `${method.name.getText()}Method`, context);
};

// A getter or setter has its own value, though it shares its property's symbol.
export const getAccessorValue = (
  accessor: ts.GetAccessorDeclaration | ts.SetAccessorDeclaration,
  context: Context,
) =>
  getModelValue(
    accessor,
    accessor,
    `${accessor.name.getText()}${ts.isGetAccessorDeclaration(accessor) ? "Getter" : "Setter"}`,
    context,
  );

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
export const translateHoldsMethod = (
  called: CalledMethod,
  scope: Scope,
  context: Context,
): Expression => {
  const getter = called.getter;
  if (getter !== undefined) {
    return junction("And", [
      apply("=", [
        useJavaScript(
          "GetterOf",
          [
            getHeap(scope, called.receiver, context),
            translateObjectValue(called.receiver, scope, context),
            string(called.key),
          ],
          context,
        ),
        getAccessorValue(getter, context),
      ]),
      translateHoldsMethod(
        {
          ...called,
          key: ts.isComputedPropertyName(called.method.name)
            ? called.method.name.getText()
            : called.method.name.text,
          getter: undefined,
        },
        scope,
        context,
      ),
    ]);
  }
  return isPrivateMember(called.method)
    ? translateHasPrivate(called.method, called.receiver, scope, context)
    : apply("=", [
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
};

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
    if (isPlainAccessor(property) && isOnce(node)) {
      return useJavaScript(
        "DefineAccessor",
        [
          object,
          translateMemberKey(property.name, scope, context),
          string(ts.isGetAccessorDeclaration(property) ? "get" : "set"),
          getAccessorValue(property, context),
          boolean(true),
        ],
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
const translateClass = (node: HeapClass, heap: Expression, scope: Scope, context: Context) => {
  const getRef = (offset: number) => useJavaScript("NextRef", [heap, number(offset)], context);
  const define = (object: Expression, key: Expression, value: Expression, flags: boolean[]) =>
    useJavaScript("Define", [object, key, value, ...flags.map(boolean)], context);
  const defineMethods = (object: Expression, isStatic: boolean) =>
    (ts.isClassLike(node) ? node.members : []).reduce<Expression>((current, member) => {
      const isStaticMember = ((ts.canHaveModifiers(member) && ts.getModifiers(member)) || []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
      );
      if (isPrivateMember(member)) return current;
      if (isPlainAccessor(member)) {
        return isStaticMember === isStatic
          ? useJavaScript(
              "DefineAccessor",
              [
                current,
                translateMemberKey(member.name, scope, context),
                string(ts.isGetAccessorDeclaration(member) ? "get" : "set"),
                getAccessorValue(member, context),
                boolean(false),
              ],
              context,
            )
          : current;
      }
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
  const parameters = ts.isClassLike(node)
    ? (node.members.find(ts.isConstructorDeclaration)?.parameters ?? [])
    : getParameters(node);
  // A parameter that only TypeScript marks optional still counts toward the length.
  const length = parameters.findIndex(
    (parameter) => parameter.initializer !== undefined || parameter.dotDotDotToken !== undefined,
  );
  const named = ts.isClassExpression(node) || ts.isFunctionExpression(node) ? node.parent : node;
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
          useJavaScript(
            "ClassObject",
            [translatePrototype("Function.prototype", node, context)],
            context,
          ),
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
      [!ts.isClassLike(node), false, false],
    ),
    true,
  );
  return useJavaScript(
    "Allocate",
    [useJavaScript("Allocate", [heap, prototype], context), object],
    context,
  );
};

// An instance of a heap class with its fields, before the constructor runs. An instance of a class
// with private methods or accessors has the class's key in its private names first.
const translateInstance = (
  node: ts.NewExpression,
  created: HeapClass,
  heap: Expression,
  scope: Scope,
  context: Context,
) => {
  const members = ts.isClassLike(created) ? created.members : [];
  const branded = members.find(
    (member) => isPrivateMember(member) && !ts.isPropertyDeclaration(member),
  );
  const empty =
    branded === undefined
      ? identifier("EmptyObject")
      : useJavaScript(
          "PrivateAdd",
          [identifier("EmptyObject"), string(getPrivateKey(branded, context)), boolean(true)],
          context,
        );
  return members.reduce<Expression>(
    (object, member) => {
      if (!ts.isPropertyDeclaration(member)) return object;
      const value =
        member.initializer === undefined
          ? getUndefined(context)
          : translateExpression(member.initializer, scope, context);
      return ts.isPrivateIdentifier(member.name)
        ? useJavaScript(
            "PrivateAdd",
            [object, string(getPrivateKey(member, context)), value],
            context,
          )
        : ts.isIdentifier(member.name)
          ? useJavaScript("Put", [object, string(member.name.text), value], context)
          : object;
    },
    useJavaScript(
      "WithPrototype",
      [
        empty,
        useJavaScript(
          "Get",
          [heap, translateExpression(node.expression, scope, context), string("prototype")],
          context,
        ),
      ],
      context,
    ),
  );
};

// Whether an object has the private names of a private member's class, so that it holds the field,
// or a call can run the method or accessor.
export const translateHasPrivate = (
  member: ts.ClassElement,
  receiver: ts.Expression,
  scope: Scope,
  context: Context,
) =>
  useJavaScript(
    "HasPrivate",
    [
      getHeap(scope, receiver, context),
      translateObjectValue(receiver, scope, context),
      string(getPrivateKey(member, context)),
    ],
    context,
  );

export const translateAllocated = (node: ts.Node, scope: Scope, context: Context) => {
  const heap = getHeap(scope, node, context);
  if (ts.isClassLike(node) || isHeapFunction(node, context)) {
    return translateClass(node, heap, scope, context);
  }
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
  if (ts.isArrayLiteralExpression(node)) {
    const array = useJavaScript(
      "ArrayObject",
      [
        translatePrototype("Array.prototype", node, context),
        tuple(node.elements.map((element) => translateExpression(element, scope, context))),
      ],
      context,
    );
    return useJavaScript("Allocate", [heap, array], context);
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
  if (context.heap === undefined) return [];
  if (isHeapFunction(node, context)) return isSometimes ? [] : [node];
  if (ts.isFunctionLike(node)) return [];
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
    (ts.isArrayLiteralExpression(node) && context.heapArrays.has(node)) ||
    isNewObject(node, context) ||
    (!isSometimes && isAllocation(node, context)) ||
    (!isSometimes &&
      created !== undefined &&
      ts.isNewExpression(node) &&
      (getRunConstructor(created) === undefined || isStatementNew(node)));
  return isAllocated ? [...nested, node] : nested;
};

// The Object functions that treat an array as an object, so that the heap holds the array.
const ARRAY_OBJECT_USES = new Set([
  "defineProperty",
  "defineProperties",
  "getOwnPropertyDescriptor",
  "getOwnPropertyDescriptors",
  "freeze",
  "seal",
  "preventExtensions",
  "isExtensible",
  "isFrozen",
  "isSealed",
  "getPrototypeOf",
  "setPrototypeOf",
]);

// Whether an array that the heap holds may appear here, where tla-ts reads it as an object.
const isArrayObjectUse = (node: ts.Identifier, context: Context) => {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) {
    return parent.expression === node;
  }
  if (ts.isTypeOfExpression(parent)) return true;
  if (ts.isBinaryExpression(parent)) {
    const kind = parent.operatorToken.kind;
    return (
      kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
      kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
      (kind === ts.SyntaxKind.InKeyword && parent.right === node)
    );
  }
  if (!ts.isCallExpression(parent) || !parent.arguments.some((argument) => argument === node)) {
    return false;
  }
  const callee = parent.expression.getText();
  const parameter = context.checker.getContextualType(node);
  return (
    /^Object\.\w+$/.test(callee) ||
    callee === "Array.isArray" ||
    /^Array\.prototype\.\w+\.call$/.test(callee) ||
    (parameter !== undefined &&
      (parameter.flags & ts.TypeFlags.Any) === 0 &&
      !isSequenceType(context.checker.getNonNullableType(parameter), context.checker))
  );
};

// The array literals that a script passes to the Object functions that treat arrays as objects.
// Each use of a variable that holds one must read it as an object.
export const findHeapArrays = (sourceFile: ts.SourceFile, context: Context) => {
  const arrays = new Set<ts.ArrayLiteralExpression>();
  const find = (node: ts.Node) => {
    const argument = ts.isCallExpression(node) ? node.arguments.at(0) : undefined;
    const callee = ts.isCallExpression(node) ? node.expression : undefined;
    const literal = argument === undefined ? undefined : getArrayLiteral(argument, context);
    if (
      literal !== undefined &&
      callee !== undefined &&
      ts.isPropertyAccessExpression(callee) &&
      ts.isIdentifier(callee.expression) &&
      callee.expression.text === "Object" &&
      ARRAY_OBJECT_USES.has(callee.name.text) &&
      literal.elements.every(
        (element) => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element),
      )
    ) {
      arrays.add(literal);
    }
    ts.forEachChild(node, find);
  };
  find(sourceFile);
  const check = (node: ts.Node) => {
    if (
      ts.isIdentifier(node) &&
      !(ts.isVariableDeclaration(node.parent) && node.parent.name === node) &&
      !isArrayObjectUse(node, context)
    ) {
      const literal = getArrayLiteral(node, context);
      if (literal !== undefined && arrays.has(literal)) {
        throw new TlaTypeScriptError(
          "Use an array that tla-ts holds as an object only through its properties",
          node,
        );
      }
    }
    ts.forEachChild(node, check);
  };
  if (arrays.size > 0) check(sourceFile);
  return arrays;
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

// The errors that JavaScript itself may throw where a node runs, which instanceof checks for: a
// failed definition or Reflect.construct, a new of a value that isn't a constructor, or a reduce
// of an empty array, and the RangeError of an array's invalid length.
export const getEngineErrors = (node: ts.Node, context: Context) => {
  const isDefinition = isObjectChange(node) && node.expression.name.text.startsWith("define");
  if (
    isDefinition &&
    context.heapArrays.size > 0 &&
    getArrayLiteral(node.arguments[0], context) !== undefined
  ) {
    return ["TypeError", "RangeError"];
  }
  return isDefinition ||
    (isObjectChange(node) && isConstruct(node)) ||
    ts.isNewExpression(node) ||
    (isMethodCall(node) && node.expression.name.text.startsWith("reduce"))
    ? ["TypeError"]
    : [];
};

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
      { name: "isRangeError", value: boolean(false) },
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
