import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type HeapClass,
  type CalledMethod,
  type Context,
  type FunctionNode,
  getNewClass,
  isInertValue,
  getParameters,
  getObjectMethod,
  getRunConstructor,
  getSymbol,
  getUndefined,
  getPrivateKey,
  isPlainAccessor,
  isPrivateMember,
  isStatic,
  isFunctionObject,
  isHeapClass,
  isHeapFunction,
  isOnce,
  isStatementNew,
  isMethodCall,
  type MethodCall,
  isUnresolved,
  getBinding,
  getBaseClass,
  getBuiltInBase,
  getLiteralName,
  isAmbient,
  isInlineBase,
  isNullBased,
  getHeapClass,
  isNestedFunction,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { getJsonText, parseJson } from "./json";
import { getConstructor } from "./exceptions";
import { translateExpression, translateToString } from "./expressions";
import {
  getBuiltIn,
  isBuiltInObject,
  translateBuiltInObject,
  translateBuiltInValue,
} from "./intrinsics";
import { getTypeNames, translateToNumber, useJavaScript } from "./javascript";
import { isDescriptorsRead } from "./protocols";
import { createStateScope, type Scope } from "./scope";
import {
  apply,
  ifExpression,
  boolean,
  functionFrom,
  identifier,
  junction,
  number,
  record,
  set,
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
  const names = getTypeNames(context.checker.getTypeAtLocation(node), context.checker);
  if (names?.length === 1 && names[0] === "symbol") return value;
  if (names?.every((name) => ["string", "number", "symbol"].includes(name))) {
    return useJavaScript("PropertyKey", [value], context);
  }
  throw new TlaTypeScriptError("Use a string, a number, or a symbol as a key", node);
};

export const translateMemberKey = (name: ts.PropertyName, scope: Scope, context: Context) => {
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
  const symbol = ts.isComputedPropertyName(method.name)
    ? context.checker.getTypeAtLocation(method).getSymbol()
    : getSymbol(method.name, context.checker);
  if (symbol === undefined) throw new TlaTypeScriptError("Name this method", method);
  const name = ts.isComputedPropertyName(method.name) ? "computed" : method.name.getText();
  return getModelValue(method, symbol, `${name}Method`, context);
};

// The model value of a function that a value may hold.
export const getCandidateValue = (node: FunctionNode, context: Context) =>
  ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node)
    ? getMethodValue(node, context)
    : ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)
      ? translateFunctionValue(node, context)
      : undefined;

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
            called.receiver.kind === ts.SyntaxKind.SuperKeyword
              ? getSuperLookup(called.receiver, scope, context).start
              : translateObjectValue(called.receiver, scope, context),
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
    if (isNestedFunction(property, context)) {
      const allocated = scope.allocated.get(property);
      if (allocated === undefined) {
        throw new TlaTypeScriptError("Make objects only where a statement always runs", property);
      }
      return useJavaScript(
        "Put",
        [object, translateMemberKey(property.name, scope, context), allocated],
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

// A function's or a class's name: its own, or that of the binding its definition initializes,
// through parentheses but not through a comma.
const getFunctionName = (node: HeapClass | ts.ArrowFunction) => {
  const named = ts.findAncestor(node.parent, (parent) => !ts.isParenthesizedExpression(parent));
  return (
    (ts.isArrowFunction(node) ? undefined : node.name?.text) ??
    (named !== undefined &&
    (ts.isVariableDeclaration(named) || ts.isBindingElement(named) || ts.isParameter(named)) &&
    ts.isIdentifier(named.name)
      ? named.name.text
      : "")
  );
};

// A function's length: its parameters before the first with a default or the rest parameter. A
// parameter that only TypeScript marks optional still counts.
export const getFunctionLength = (parameters: readonly ts.ParameterDeclaration[]) => {
  const index = parameters.findIndex(
    (parameter) => parameter.initializer !== undefined || parameter.dotDotDotToken !== undefined,
  );
  return index === -1 ? parameters.length : index;
};

// Where a super property's lookup starts: the prototype of the object that holds the method it's
// in. The method's this receives what the lookup finds.
export const getSuperLookup = (node: ts.Node, scope: Scope, context: Context) => {
  const method = ts.findAncestor(
    node.parent,
    (ancestor) =>
      (ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor)) ||
      ts.isClassStaticBlockDeclaration(ancestor) ||
      ts.isPropertyDeclaration(ancestor),
  );
  const owner = method?.parent;
  const receiver = scope.receiver;
  const literalName =
    owner !== undefined &&
    ts.isObjectLiteralExpression(owner) &&
    method !== undefined &&
    (ts.isMethodDeclaration(method) || ts.isAccessor(method)) &&
    isObjectValue(owner, context)
      ? getLiteralName(owner, context)
      : undefined;
  if (
    method === undefined ||
    owner === undefined ||
    (literalName === undefined &&
      (!ts.isClassLike(owner) ||
        !isHeapClass(owner, context) ||
        (isNullBased(owner) && !isStatic(method)))) ||
    receiver === undefined ||
    receiver.method !== method
  ) {
    throw new TlaTypeScriptError("Unsupported expression: super", node);
  }
  const heap = getHeap(scope, node, context);
  if (literalName !== undefined) {
    const start = useJavaScript(
      "Prototype",
      [heap, translateExpression(literalName, scope, context)],
      context,
    );
    return {
      start: ifExpression(
        apply("=", [start, identifier("Null")]),
        apply("Assert", [
          boolean(false),
          string("tla-ts can't read super of an object without a prototype"),
        ]),
        start,
      ),
      receiver: receiver.value,
    };
  }
  if (!ts.isClassLike(owner)) throw new TlaTypeScriptError("Unsupported expression: super", node);
  const classRef = translateClassRef(owner, scope, context);
  const home = isStatic(method)
    ? classRef
    : useJavaScript("Get", [heap, classRef, string("prototype")], context);
  return { start: useJavaScript("Prototype", [heap, home], context), receiver: receiver.value };
};

// The value of a heap class, by the name its declaration binds.
export const translateClassRef = (
  node: ts.ClassLikeDeclaration,
  scope: Scope,
  context: Context,
) => {
  const name = ts.isVariableDeclaration(node.parent) ? node.parent.name : node.name;
  if (name === undefined || !ts.isIdentifier(name)) {
    throw new TlaTypeScriptError("Name this class", node);
  }
  return translateExpression(name, scope, context);
};

// The heap after a node from getAllocated adds the object it makes.
// The constructor object and the prototype that a class makes, prototype first, so the
// constructor object is the last on the heap.
const translateClass = (
  node: HeapClass,
  start: Expression,
  scope: Scope,
  context: Context,
): Expression => {
  const base = ts.isClassLike(node) ? getBaseClass(node, context) : undefined;
  const inlineBase = base !== undefined && isInlineBase(base) ? base : undefined;
  const heap = inlineBase === undefined ? start : translateClass(inlineBase, start, scope, context);
  const getRef = (offset: number) => useJavaScript("NextRef", [heap, number(offset)], context);
  const define = (object: Expression, key: Expression, value: Expression, flags: boolean[]) =>
    useJavaScript("Define", [object, key, value, ...flags.map(boolean)], context);
  const members = ts.isClassLike(node) ? node.members : [];
  const defineMethods = (object: Expression, isStaticObject: boolean) =>
    members.reduce<Expression>((current, member) => {
      if (isPrivateMember(member)) return current;
      if (isPlainAccessor(member)) {
        return isStatic(member) === isStaticObject
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
      return method === undefined || isStatic(method) !== isStaticObject
        ? current
        : define(
            current,
            translateMemberKey(method.name, scope, context),
            getMethodValue(method, context),
            [true, false, true],
          );
    }, object);
  const builtInBase =
    ts.isClassLike(node) && base === undefined ? getBuiltInBase(node, context) : undefined;
  const baseRef =
    inlineBase !== undefined
      ? useJavaScript("NextRef", [start, number(2)], context)
      : base !== undefined
        ? translateClassRef(base, scope, context)
        : builtInBase === undefined
          ? undefined
          : translateBuiltInValue(builtInBase, node, context);
  const basePrototype =
    builtInBase !== undefined
      ? translateBuiltInValue(`${builtInBase}.prototype`, node, context)
      : baseRef !== undefined
        ? useJavaScript("Get", [heap, baseRef, string("prototype")], context)
        : ts.isClassLike(node) && isNullBased(node)
          ? identifier("Null")
          : undefined;
  const prototype = defineMethods(
    define(
      basePrototype === undefined
        ? identifier("EmptyObject")
        : useJavaScript("WithPrototype", [identifier("EmptyObject"), basePrototype], context),
      string("constructor"),
      getRef(2),
      [true, false, true],
    ),
    false,
  );
  const staticBranded = members.find(
    (member) => isPrivateMember(member) && !ts.isPropertyDeclaration(member) && isStatic(member),
  );
  const methods = defineMethods(
    define(
      define(
        define(
          useJavaScript(
            "ClassObject",
            [baseRef ?? translateBuiltInValue("Function.prototype", node, context)],
            context,
          ),
          string("length"),
          number(
            getFunctionLength(
              ts.isClassLike(node)
                ? (node.members.find(ts.isConstructorDeclaration)?.parameters ?? [])
                : getParameters(node),
            ),
          ),
          [false, false, true],
        ),
        string("name"),
        string(getFunctionName(node)),
        [false, false, true],
      ),
      string("prototype"),
      getRef(1),
      [!ts.isClassLike(node), false, false],
    ),
    true,
  );
  const object =
    staticBranded === undefined
      ? methods
      : useJavaScript(
          "PrivateAdd",
          [methods, string(getPrivateKey(staticBranded, context)), boolean(true)],
          context,
        );
  return useJavaScript(
    "Allocate",
    [useJavaScript("Allocate", [heap, prototype], context), object],
    context,
  );
};

// A class that a default makes, after its methods, each a function that a script can only read,
// and its prototype.
const translateClassObject = (node: ts.ClassExpression, heap: Expression, context: Context) => {
  const methods = node.members.filter(ts.isMethodDeclaration);
  const getName = (method: ts.MethodDeclaration) =>
    ts.isIdentifier(method.name) || ts.isStringLiteral(method.name) ? method.name.text : "";
  const getRef = (offset: number) => useJavaScript("NextRef", [heap, number(offset)], context);
  const define = (object: Expression, key: string, value: Expression, flags: boolean[]) =>
    useJavaScript("Define", [object, string(key), value, ...flags.map(boolean)], context);
  const defineMethods = (object: Expression, isStaticObject: boolean) =>
    methods.reduce(
      (current, method, position) =>
        isStatic(method) === isStaticObject
          ? define(current, getName(method), getRef(position + 1), [true, false, true])
          : current,
      object,
    );
  const functionPrototype = translateBuiltInValue("Function.prototype", node, context);
  const withMethods = methods.reduce(
    (current, method) =>
      useJavaScript(
        "Allocate",
        [
          current,
          useJavaScript(
            "ArrowObject",
            [
              functionPrototype,
              string(getName(method)),
              number(getFunctionLength(getParameters(method))),
            ],
            context,
          ),
        ],
        context,
      ),
    heap,
  );
  const prototype = defineMethods(
    define(identifier("EmptyObject"), "constructor", getRef(methods.length + 2), [
      true,
      false,
      true,
    ]),
    false,
  );
  const length = getFunctionLength(
    node.members.find(ts.isConstructorDeclaration)?.parameters ?? [],
  );
  const object = defineMethods(
    define(
      define(
        define(
          useJavaScript("ClassObject", [functionPrototype], context),
          "length",
          number(length),
          [false, false, true],
        ),
        "name",
        string(getFunctionName(node)),
        [false, false, true],
      ),
      "prototype",
      getRef(methods.length + 1),
      [false, false, false],
    ),
    true,
  );
  return useJavaScript(
    "Allocate",
    [useJavaScript("Allocate", [withMethods, prototype], context), object],
    context,
  );
};

// The object that a new of Boolean, Number, or String makes, or of a class that extends one, from
// the new's first argument.
const translateWrapperObject = (
  node: ts.NewExpression,
  wrapper: "Boolean" | "Number" | "String",
  prototype: Expression,
  scope: Scope,
  context: Context,
) => {
  const argument = node.arguments?.at(0);
  const primitive =
    wrapper === "Boolean"
      ? argument === undefined
        ? boolean(false)
        : useJavaScript("ToBoolean", [translateExpression(argument, scope, context)], context)
      : wrapper === "Number"
        ? argument === undefined
          ? number(0)
          : translateToNumber(argument, node, scope, context)
        : argument === undefined
          ? string("")
          : translateToString(argument, scope, context);
  return useJavaScript("WrapperObject", [prototype, primitive], context);
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
  const getChain = (current: HeapClass): HeapClass[] => {
    const base = ts.isClassLike(current) ? getBaseClass(current, context) : undefined;
    return base === undefined ? [current] : [...getChain(base), current];
  };
  const builtInBase = ts.isClassLike(created) ? getBuiltInBase(created, context) : undefined;
  // No constructor body runs, so the arguments and the parameters' defaults are only evaluated
  // where evaluating them can't throw or change anything. A wrapper base reads its first argument.
  const dropped =
    builtInBase === undefined || builtInBase === "Object"
      ? (node.arguments ?? [])
      : (node.arguments ?? []).slice(1);
  const defaults = getChain(created).flatMap((current) =>
    (ts.isClassLike(current)
      ? (current.members.find(ts.isConstructorDeclaration)?.parameters ?? [])
      : current.parameters
    ).flatMap((parameter) => (parameter.initializer === undefined ? [] : [parameter.initializer])),
  );
  if (
    getRunConstructor(created, context) === undefined &&
    ![...dropped, ...defaults].every(isInertValue)
  ) {
    throw new TlaTypeScriptError("Unsupported arguments to a constructor that runs no code", node);
  }
  const members = getChain(created).flatMap((current) =>
    ts.isClassLike(current) ? [...current.members] : [],
  );
  const empty = members.reduce<Expression>(
    (object, member) =>
      isPrivateMember(member) &&
      !ts.isPropertyDeclaration(member) &&
      !isStatic(member) &&
      members.find(
        (other) =>
          other.parent === member.parent &&
          isPrivateMember(other) &&
          !ts.isPropertyDeclaration(other) &&
          !isStatic(other),
      ) === member
        ? useJavaScript(
            "PrivateAdd",
            [object, string(getPrivateKey(member, context)), boolean(true)],
            context,
          )
        : object,
    builtInBase === undefined || builtInBase === "Object"
      ? identifier("EmptyObject")
      : translateWrapperObject(node, builtInBase, identifier("Null"), scope, context),
  );
  return members.reduce<Expression>(
    (object, member) => {
      if (!ts.isPropertyDeclaration(member) || isStatic(member) || isAmbient(member)) {
        return object;
      }
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
  if (isNestedFunction(node, context)) {
    const isMethod = ts.isMethodDeclaration(node);
    return useJavaScript(
      "Allocate",
      [
        heap,
        useJavaScript(
          isMethod ? "MethodObject" : "FunctionObject",
          [
            translateBuiltInValue("Function.prototype", node, context),
            isMethod ? getMethodValue(node, context) : translateFunctionValue(node, context),
          ],
          context,
        ),
      ],
      context,
    );
  }
  const binding = getBinding(node, context);
  if (binding !== undefined) {
    const length = getFunctionLength(getParameters(binding.target)) - binding.arguments.length;
    const holds = (object: "Function.prototype" | "Function.prototype.bind", key: string) =>
      useJavaScript(
        "HoldsBuiltIn",
        [
          heap,
          translateBuiltInValue(object, node, context),
          string(key),
          string(`Function.prototype.${key}`),
        ],
        context,
      );
    return ifExpression(
      binding.isCall
        ? apply("/\\", [
            holds("Function.prototype", "bind"),
            holds("Function.prototype.bind", "call"),
          ])
        : holds("Function.prototype", "bind"),
      useJavaScript(
        "Allocate",
        [
          heap,
          useJavaScript(
            "BoundFunctionObject",
            [
              translateBuiltInValue("Function.prototype", node, context),
              string(getFunctionName(binding.target)),
              number(Math.max(0, length)),
              boolean(!ts.isArrowFunction(binding.target)),
            ],
            context,
          ),
        ],
        context,
      ),
      apply("Assert", [
        boolean(false),
        string("tla-ts can't bind a function where a script replaced Function.prototype.bind"),
      ]),
    );
  }
  if (ts.isCallExpression(node) && isSymbolCall(node, context)) {
    return useJavaScript(
      isSymbolFor(node, context) ? "RegisterSymbol" : "NewSymbol",
      [heap, translateSymbolArgument(node, scope, context)],
      context,
    );
  }
  if (
    isFunctionObject(node, context) &&
    !ts.isClassExpression(node) &&
    node.asteriskToken !== undefined
  ) {
    return useJavaScript(
      "Allocate",
      [
        useJavaScript("Allocate", [heap, identifier("GeneratorPrototypeObject")], context),
        useJavaScript(
          "GeneratorFunctionObject",
          [
            string(getFunctionName(node)),
            number(getFunctionLength(getParameters(node))),
            useJavaScript("NextRef", [heap, number(1)], context),
          ],
          context,
        ),
      ],
      context,
    );
  }
  if (isFunctionObject(node, context) && ts.isClassExpression(node)) {
    return translateClassObject(node, heap, context);
  }
  if (isFunctionObject(node, context)) {
    return ts.isArrowFunction(node)
      ? useJavaScript(
          "Allocate",
          [
            heap,
            useJavaScript(
              "ArrowObject",
              [
                translateBuiltInValue("Function.prototype", node, context),
                string(getFunctionName(node)),
                number(getFunctionLength(getParameters(node))),
              ],
              context,
            ),
          ],
          context,
        )
      : translateClass(node, heap, scope, context);
  }
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
    // An elision is a hole, which the array has no element for, though its length counts it.
    const holes = node.elements.flatMap((element, position) =>
      ts.isOmittedExpression(element) ? [number(position + 1)] : [],
    );
    const elements = tuple(
      node.elements.map((element) =>
        ts.isOmittedExpression(element)
          ? getUndefined(context)
          : translateExpression(element, scope, context),
      ),
    );
    const prototype = translateBuiltInValue("Array.prototype", node, context);
    const array =
      holes.length === 0
        ? useJavaScript("ArrayObject", [prototype, elements], context)
        : useJavaScript("ArrayObjectWithHoles", [prototype, elements, set(holes)], context);
    return useJavaScript("Allocate", [heap, array], context);
  }
  if (isNewObject(node, context)) {
    return useJavaScript("Allocate", [heap, identifier("EmptyObject")], context);
  }
  if (isNewDate(node, context)) {
    const values = node.arguments ?? [];
    const time = isClockDate(node, context)
      ? identifier("Clock")
      : values.length > 1
        ? translateDateFields(node, values, scope, context)
        : isDateType(values[0], context)
          ? useJavaScript(
              "TimeOfDate",
              [heap, translateExpression(values[0], scope, context)],
              context,
            )
          : (getLiteralTime(values[0]) ??
            useJavaScript(
              "TimeFromNumber",
              [translateToNumber(values[0], node, scope, context)],
              context,
            ));
    // The constructor, which the prototype's constructor property holds.
    context.builtIns.add("Date");
    return useJavaScript(
      "Allocate",
      [
        heap,
        useJavaScript(
          "DateObject",
          [translateBuiltInValue("Date.prototype", node, context), time],
          context,
        ),
      ],
      context,
    );
  }
  const wrapper = getNewWrapper(node, context);
  if (wrapper !== undefined && ts.isNewExpression(node)) {
    // The wrapper's constructor, which its prototype's constructor property holds.
    context.builtIns.add(wrapper);
    return useJavaScript(
      "Allocate",
      [
        heap,
        translateWrapperObject(
          node,
          wrapper,
          translateBuiltInValue(`${wrapper}.prototype`, node, context),
          scope,
          context,
        ),
      ],
      context,
    );
  }
  if (ts.isCallExpression(node) && isDescription(node, context)) {
    const key = translatePropertyKey(node.arguments[1], scope, context);
    const described = isElementDescription(node, context)
      ? useJavaScript(
          "DescribeElement",
          [translateExpression(node.arguments[0], scope, context), key],
          context,
        )
      : useJavaScript(
          "Describe",
          [heap, translateObjectValue(node.arguments[0], scope, context), key],
          context,
        );
    return useJavaScript("Allocate", [heap, described], context);
  }
  if (ts.isCallExpression(node) && isFromEntries(node, context)) {
    return useJavaScript(
      "FromEntries",
      [heap, translateExpression(node.arguments[0], scope, context)],
      context,
    );
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

// A description of a property of an array that a sequence holds, not of a built-in object.
export const isElementDescription = (node: ts.CallExpression, context: Context) =>
  getKind(node.arguments[0], context) === "sequence" &&
  !isBuiltInObject(node.arguments[0], context);

// Object.getOwnPropertyDescriptor, or Reflect's, which only differs where the target isn't an
// object.
export const isDescription = (node: ts.Node, context: Context) =>
  isMethodCall(node) &&
  ["Object", "Reflect"].includes(node.expression.expression.getText()) &&
  node.expression.name.text === "getOwnPropertyDescriptor" &&
  node.arguments.length >= 2 &&
  (["object", "sequence"].includes(getKind(node.arguments[0], context)) ||
    isBuiltInObject(node.arguments[0], context));

// Object.create, with a prototype that tla-ts can tell is an object or null.
export const isCreation = (node: ts.Node, context: Context) => {
  if (
    !isMethodCall(node) ||
    node.expression.expression.getText() !== "Object" ||
    node.expression.name.text !== "create" ||
    node.arguments.length === 0 ||
    ts.isExpressionStatement(node.parent) ||
    isDescriptorsRead(node, context)
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

// Object.fromEntries of an array that tla-ts keeps outside the heap.
export const isFromEntries = (node: ts.Node, context: Context) =>
  isMethodCall(node) &&
  node.expression.expression.getText() === "Object" &&
  node.expression.name.text === "fromEntries" &&
  node.arguments.length > 0 &&
  getKind(node.arguments[0], context) === "sequence";

// A call of Symbol, which changes the heap as an allocation does, to record the symbol it makes.
export const isSymbolCall = (node: ts.Node, context: Context) =>
  ts.isCallExpression(node) &&
  (getBuiltIn(node.expression, context) === "Symbol" || isSymbolFor(node, context));

// Symbol.for(key), which makes a symbol only where the registry holds none for the key.
const isSymbolFor = (node: ts.CallExpression, context: Context) =>
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "for" &&
  getBuiltIn(node.expression.expression, context) === "Symbol";

// The description that Symbol or the key that Symbol.for takes.
const translateSymbolArgument = (node: ts.CallExpression, scope: Scope, context: Context) => {
  const argument = node.arguments.at(0);
  if (argument !== undefined && ts.isSpreadElement(argument)) {
    throw new TlaTypeScriptError("Pass Symbol a description, not a spread", argument);
  }
  return argument === undefined
    ? getUndefined(context)
    : translateExpression(argument, scope, context);
};

// What an allocation gives once the heap it makes is the one that heap names.
export const translateAllocatedValue = (
  node: ts.Node,
  heap: Expression,
  scope: Scope,
  context: Context,
) =>
  ts.isCallExpression(node) && isSymbolCall(node, context)
    ? isSymbolFor(node, context)
      ? useJavaScript(
          "RegisteredSymbol",
          [heap, translateSymbolArgument(node, scope, context)],
          context,
        )
      : useJavaScript("NewestSymbol", [heap], context)
    : useJavaScript("Allocated", [heap], context);

export const isAllocation = (node: ts.Node, context: Context) =>
  getBinding(node, context) !== undefined ||
  (ts.isCallExpression(node) &&
    (isDescription(node, context) ||
      isCreation(node, context) ||
      isFromEntries(node, context) ||
      isSymbolCall(node, context))) ||
  isNewObject(node, context) ||
  isNewDate(node, context) ||
  getNewWrapper(node, context) !== undefined;

// The primitive that new Boolean, new Number, or new String wraps in an object.
export const getNewWrapper = (node: ts.Node, context: Context) => {
  const called =
    context.heap !== undefined && ts.isNewExpression(node)
      ? getBuiltIn(node.expression, context)
      : undefined;
  // new Object of a primitive wraps it as its own constructor would.
  const argument = ts.isNewExpression(node) ? node.arguments?.at(0) : undefined;
  const names =
    called === "Object" &&
    argument !== undefined &&
    isHeapType(context.checker.getTypeAtLocation(node), node, context)
      ? getTypeNames(context.checker.getTypeAtLocation(argument), context.checker)
      : undefined;
  const primitive = names?.length === 1 ? names[0] : undefined;
  const name =
    primitive === "string"
      ? "String"
      : primitive === "number"
        ? "Number"
        : primitive === "boolean"
          ? "Boolean"
          : called;
  return (name === "Boolean" || name === "Number" || name === "String") &&
    ts.isNewExpression(node) &&
    (node.arguments ?? []).length <= 1 &&
    !(node.arguments ?? []).some(ts.isSpreadElement)
    ? name
    : undefined;
};

// Whether a value has the type of a Date.
export const isDateType = (node: ts.Expression, context: Context) =>
  context.checker.getTypeAtLocation(node).getSymbol()?.name === "Date";

// new Date of a time value, of another Date, or of a year and a month and the rest, whose
// arguments convert to numbers without running code. tla-ts doesn't read the clock or parse
// dates.
export const isNewDate = (node: ts.Node, context: Context): node is ts.NewExpression => {
  if (
    context.heap === undefined ||
    !ts.isNewExpression(node) ||
    getBuiltIn(node.expression, context) !== "Date"
  ) {
    return false;
  }
  const values = node.arguments ?? [];
  return values.length === 1
    ? isNumeric(values[0], context) || isDateType(values[0], context)
    : values.length !== 1 && areDateFields(values, context);
};

// Whether new Date reads the clock, as new Date() and new Date(Date.now()) do.
const isClockDate = (node: ts.NewExpression, context: Context) => {
  const values = node.arguments ?? [];
  const value = values.at(0);
  return (
    values.length === 0 ||
    (values.length === 1 &&
      value !== undefined &&
      ts.isCallExpression(value) &&
      value.arguments.length === 0 &&
      ts.isPropertyAccessExpression(value.expression) &&
      value.expression.name.text === "now" &&
      getBuiltIn(value.expression.expression, context) === "Date")
  );
};

// The time value that new Date takes from a number that a literal writes, which may be past what
// TLC's integers hold, as a time value's day and milliseconds, or NaN past what TimeClip allows.
const getLiteralTime = (node: ts.Expression) => {
  const literal =
    ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken
      ? node.operand
      : node;
  if (!ts.isNumericLiteral(literal)) return undefined;
  const value = Math.trunc(Number(literal.text)) * (literal === node ? 1 : -1);
  if (Math.abs(value) > 8.64e15) return identifier("NaN");
  const day = Math.floor(value / 86400000);
  return record("Record", [
    { name: "day", value: number(day + 0) },
    { name: "ms", value: number(value - day * 86400000 + 0) },
  ]);
};

// The fields that a Date's getters give, in local time and in UTC, which tla-ts takes to be the
// same.
export const DATE_FIELDS = new Map<string, string>([
  ...["FullYear", "Month", "Date", "Day", "Hours", "Minutes", "Seconds", "Milliseconds"].flatMap(
    (field) => [[`get${field}`, field] as const, [`getUTC${field}`, field] as const],
  ),
  ["getYear", "Year"],
  ["getTimezoneOffset", "TimezoneOffset"],
]);

// The methods that give a Date's time value.
export const TIME_METHODS = new Set(["getTime", "valueOf"]);

// The Date setters, by the position of the first field each sets, the year at 1 and the
// milliseconds at 7, or 0 for setTime and setYear, and how many numbers each takes.
const DATE_SETTERS = new Map<string, { position: number; arity: number }>([
  ...(
    [
      ["FullYear", 1, 3],
      ["Month", 2, 2],
      ["Date", 3, 1],
      ["Hours", 4, 4],
      ["Minutes", 5, 3],
      ["Seconds", 6, 2],
      ["Milliseconds", 7, 1],
    ] as const
  ).flatMap(([field, position, arity]) => [
    [`set${field}`, { position, arity }] as const,
    [`setUTC${field}`, { position, arity }] as const,
  ]),
  ["setTime", { position: 0, arity: 1 }],
  ["setYear", { position: 0, arity: 1 }],
]);

// A call of a Date's setter or toISOString that a statement runs, or a statement's call of a
// Date.prototype method through call, which throws a TypeError where its receiver isn't a Date.
export const getDateCall = (node: ts.Node, context: Context) => {
  if (context.heap === undefined || !isMethodCall(node)) return undefined;
  const callee = node.expression.expression;
  const isCall = node.expression.name.text === "call";
  const method = isCall ? getDateMethod(callee, context) : node.expression.name.text;
  const isKnown =
    method !== undefined &&
    (DATE_SETTERS.has(method) ||
      method === "toISOString" ||
      (isCall && (DATE_FIELDS.has(method) || TIME_METHODS.has(method))));
  if (!isKnown || (!isCall && !isDateType(callee, context))) return undefined;
  if (isCall && !ts.isExpressionStatement(node.parent)) return undefined;
  return {
    method,
    isSetter: DATE_SETTERS.has(method),
    callee: isCall ? callee : undefined,
    receiver: isCall ? node.arguments.at(0) : callee,
    values: isCall ? node.arguments.slice(1) : node.arguments,
  };
};

// The Date.prototype method that a value is, or that a variable holds from its declaration.
const getDateMethod = (node: ts.Expression, context: Context) => {
  const declaration = ts.isIdentifier(node)
    ? getSymbol(node, context.checker)?.valueDeclaration
    : undefined;
  const value =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : node;
  return value !== undefined &&
    ts.isPropertyAccessExpression(value) &&
    ts.isPropertyAccessExpression(value.expression) &&
    value.expression.name.text === "prototype" &&
    getBuiltIn(value.expression.expression, context) === "Date"
    ? value.name.text
    : undefined;
};

// The position of the first field that a Date setter sets, and how many it takes, where its
// arguments convert to numbers without running code.
export const getDateSetter = (
  method: string,
  values: readonly ts.Expression[],
  context: Context,
) => {
  const setter = DATE_SETTERS.get(method);
  return setter !== undefined &&
    values.length >= 1 &&
    values.length <= setter.arity &&
    values.every((argument) => isNumeric(argument, context))
    ? setter
    : undefined;
};

// Whether ToNumber of a value runs no code and reads no string as a date.
const isNumeric = (argument: ts.Expression, context: Context) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(argument), context.checker);
  return names?.length === 1 && ["number", "boolean", "null"].includes(names[0]);
};

// Whether the arguments of Date.UTC, or of new Date with a year and a month, convert to numbers
// without running code.
export const areDateFields = (values: readonly ts.Expression[], context: Context) =>
  values.length <= 7 &&
  values.every((argument) => isNumeric(argument, context) || ts.isStringLiteral(argument));

// The time value of the year, month, and the rest that Date.UTC or new Date reads, which are NaN,
// 0, 1, and then 0 where a call omits them.
export const translateDateFields = (
  node: ts.Expression,
  values: readonly ts.Expression[],
  scope: Scope,
  context: Context,
) =>
  useJavaScript(
    "TimeFromFields",
    [0, 1, 2, 3, 4, 5, 6].map((position) => {
      const argument = values.at(position);
      if (argument !== undefined) return translateToNumber(argument, node, scope, context);
      return position === 0 ? identifier("NaN") : number(position === 2 ? 1 : 0);
    }),
    context,
  );

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
  if (
    isHeapFunction(node, context) ||
    isFunctionObject(node, context) ||
    isNestedFunction(node, context)
  ) {
    return isSometimes ? [] : [node];
  }
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
    isNewDate(node, context) ||
    getNewWrapper(node, context) !== undefined ||
    (!isSometimes && isAllocation(node, context)) ||
    (!isSometimes &&
      created !== undefined &&
      ts.isNewExpression(node) &&
      (getRunConstructor(created, context) === undefined || isStatementNew(node)));
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
      kind === ts.SyntaxKind.EqualsEqualsToken ||
      kind === ts.SyntaxKind.ExclamationEqualsToken ||
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
// An array literal with holes, which a sequence can't hold, where a variable that only reads it as
// an object holds it, or a method reads it.
export const isHoleyArray = (node: ts.Node): node is ts.ArrayLiteralExpression =>
  ts.isArrayLiteralExpression(node) &&
  node.elements.some(ts.isOmittedExpression) &&
  !node.elements.some(ts.isSpreadElement) &&
  ((ts.isVariableDeclaration(node.parent) &&
    node.parent.initializer === node &&
    ts.isIdentifier(node.parent.name)) ||
    (ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node));

export const findHeapArrays = (sourceFile: ts.SourceFile, context: Context) => {
  const arrays = new Set<ts.ArrayLiteralExpression | ts.BindingElement>();
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
    if (isHoleyArray(node)) arrays.add(node);
    ts.forEachChild(node, find);
  };
  find(sourceFile);
  // A rest element that a script only reads as an object, and whose identity a comparison or a
  // call could see, is an array that the heap holds.
  const references = new Map<ts.Symbol, ts.Identifier[]>();
  const rests: ts.BindingElement[] = [];
  const collect = (node: ts.Node) => {
    if (
      ts.isBindingElement(node) &&
      node.dotDotDotToken !== undefined &&
      ts.isIdentifier(node.name) &&
      ts.isArrayBindingPattern(node.parent)
    ) {
      rests.push(node);
    }
    const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
    if (ts.isIdentifier(node) && symbol !== undefined) {
      references.set(symbol, [...(references.get(symbol) ?? []), node]);
    }
    ts.forEachChild(node, collect);
  };
  if (context.heap !== undefined) collect(sourceFile);
  rests.forEach((rest) => {
    const symbol = getSymbol(rest.name, context.checker);
    const uses = (symbol === undefined ? [] : (references.get(symbol) ?? [])).filter(
      (reference) => reference !== rest.name,
    );
    if (
      uses.every((use) => isArrayObjectUse(use, context)) &&
      uses.some((use) => ts.isCallExpression(use.parent) || ts.isBinaryExpression(use.parent))
    ) {
      arrays.add(rest);
    }
  });
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
// The arguments that must be objects. A definition checks its target and descriptors itself, as
// it throws a TypeError for any other value, but converts the properties it takes to an object.
const OBJECT_CHANGES = new Map([
  ["defineProperty", { operator: "DefineProperty", arity: 3, objects: [] }],
  ["defineProperties", { operator: "DefineProperties", arity: 2, objects: [1] }],
  ["freeze", { operator: "Freeze", arity: 1, objects: [0] }],
  ["seal", { operator: "Seal", arity: 1, objects: [0] }],
  ["preventExtensions", { operator: "PreventExtensions", arity: 1, objects: [0] }],
  ["setPrototypeOf", { operator: "SetPrototypeOf", arity: 2, objects: [0] }],
  ["assign", { operator: "Assign", arity: 1, objects: [0] }],
  ["create", { operator: "CreateChange", arity: 1, objects: [] }],
]);

// The changes that throw a TypeError where they fail.
const FALLIBLE_CHANGES = new Set([
  "defineProperty",
  "defineProperties",
  "setPrototypeOf",
  "assign",
  "create",
]);

const isConstruct = (node: MethodCall) =>
  node.expression.expression.getText() === "Reflect" && node.expression.name.text === "construct";

// Object.create runs as a change only where nothing reads the object it makes, so that it can
// throw.
export const isObjectChange = (node: ts.Node, context: Context): node is MethodCall =>
  isMethodCall(node) &&
  ((node.expression.expression.getText() === "Object" &&
    OBJECT_CHANGES.has(node.expression.name.text) &&
    (node.expression.name.text !== "create" ||
      ts.isExpressionStatement(node.parent) ||
      isDescriptorsRead(node, context))) ||
    isConstruct(node));

// The errors that JavaScript itself may throw where a node runs, which instanceof checks for: a
// failed definition or Reflect.construct, a new of a value that isn't a constructor, or a reduce
// of an empty array, the RangeError of an array's invalid length, and a Date method's TypeError
// on another receiver and toISOString's RangeError of an invalid date.
export const getEngineErrors = (node: ts.Node, context: Context) => {
  const isDefinition =
    isObjectChange(node, context) && node.expression.name.text.startsWith("define");
  const isFallible =
    isObjectChange(node, context) && FALLIBLE_CHANGES.has(node.expression.name.text);
  if (
    isDefinition &&
    context.heapArrays.size > 0 &&
    getArrayLiteral(node.arguments[0], context) !== undefined
  ) {
    return ["TypeError", "RangeError"];
  }
  if (isUnresolved(node, context)) return ["ReferenceError"];
  const jsonText = getJsonText(node, context);
  if (jsonText !== undefined) return "error" in parseJson(jsonText) ? ["SyntaxError"] : [];
  const dateCall = getDateCall(node, context);
  if (dateCall !== undefined) {
    return [
      ...(dateCall.callee === undefined ? [] : ["TypeError"]),
      ...(dateCall.method === "toISOString" ? ["RangeError"] : []),
    ];
  }
  const created = ts.isNewExpression(node) ? getHeapClass(node.expression, context) : undefined;
  if (created !== undefined && ts.isClassLike(created) && isNullBased(created)) {
    return ["ReferenceError"];
  }
  return isFallible ||
    (isObjectChange(node, context) && isConstruct(node)) ||
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
  // Arrays, sets, and maps that tla-ts keeps outside the heap are objects it can't read.
  const isOutside = (argument: ts.Expression) =>
    !isBuiltInObject(argument, context) &&
    ["sequence", "set", "map"].includes(getKind(argument, context));
  const isAssign = method === "assign";
  const isCreate = method === "create";
  const used = isAssign ? node.arguments : node.arguments.slice(0, isCreate ? 2 : change?.arity);
  if (
    change === undefined ||
    node.arguments.length < change.arity ||
    !change.objects.every(isObject) ||
    (isCreate && used.length > 1 && !isObject(1)) ||
    used.some((argument) => ts.isSpreadElement(argument) || isOutside(argument))
  ) {
    throw new TlaTypeScriptError(`Unsupported statement: ${node.getText()}`, node);
  }
  const values = used.map((argument, position) =>
    method === "defineProperty" && position === 1
      ? translatePropertyKey(argument, scope, context)
      : translateObjectValue(argument, scope, context),
  );
  return {
    change: useJavaScript(
      change.operator,
      [
        getHeap(scope, node, context),
        ...(isAssign ? [values[0], tuple(values.slice(1))] : values),
        ...(isCreate && values.length === 1 ? [getUndefined(context)] : []),
      ],
      context,
    ),
    isFallible: FALLIBLE_CHANGES.has(method),
    values,
  };
};
