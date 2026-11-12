import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type Construction,
  type HeapClass,
  type CalledMethod,
  type Context,
  type FunctionNode,
  getConstruction,
  getCallee,
  getFunctionOfKind,
  getNewClass,
  isHeldError,
  isInertValue,
  getParameters,
  getObjectMethod,
  getRunConstructor,
  getRunFields,
  getSymbol,
  getUndefined,
  getPrivateKey,
  isPlain,
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
  isNestedFunction,
  skipCasts,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import {
  ARRAY_LIKE_METHODS,
  getHeapRegExpCall,
  IN_PLACE_METHODS,
  isSpliceStatement,
  translateSpliced,
  translateNew,
} from "./collections";
import { getJsonText, parseJson } from "./json";
import { getCalledError, getConstructor, getErrorClass } from "./exceptions";
import {
  translateElements,
  translateCondition,
  translateCall,
  translateExpression,
  translateToString,
} from "./expressions";
import {
  getBuiltIn,
  isBuiltInObject,
  translateBuiltInObject,
  translateBuiltInValue,
  getMadeRegExp,
  isInvalidRegExp,
  translateRegExpValue,
} from "./intrinsics";
import {
  getTypeNames,
  getURICall,
  translateNumberString,
  translateToNumber,
  useJavaScript,
} from "./javascript";
import {
  getDefinedGetters,
  getElementGetters,
  isDescriptorsRead,
  isProxyOperation,
} from "./protocols";
import { getReached } from "./aliasing";
import { createStateScope, type Scope } from "./scope";
import { getStackCall } from "./stacks";
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
  getAccessedFields,
  getArrayLiteral,
  getCalledFunction,
  getElementTypeNode,
  getHolders,
  getKind,
  isEvery,
  hasHeapType,
  isHeapType,
  isNumberLike,
  isSequenceType,
  TYPED_ARRAYS,
  isHoleyNewArray,
  getArraySource,
  getKeptIterator,
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
  if (isNumberLike(node, context)) return translateNumberString(value, context);
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
  ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)
    ? getAccessorValue(node, context)
    : ts.isMethodDeclaration(node)
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
      const key = translateMemberKey(property.name, scope, context);
      return ts.isMethodDeclaration(property)
        ? useJavaScript("Put", [object, key, allocated], context)
        : useJavaScript(
            "DefineAccessor",
            [
              object,
              key,
              string(ts.isGetAccessorDeclaration(property) ? "get" : "set"),
              allocated,
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
    // A spread of a condition and an object literal of names and literals spreads the object only
    // where the condition holds, as spreading false or another primitive adds nothing.
    const spread = ts.isSpreadAssignment(property) ? skipCasts(property.expression) : undefined;
    const literal =
      spread !== undefined &&
      ts.isBinaryExpression(spread) &&
      spread.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
        ? skipCasts(spread.right)
        : undefined;
    if (
      spread !== undefined &&
      ts.isBinaryExpression(spread) &&
      literal !== undefined &&
      ts.isObjectLiteralExpression(literal) &&
      literal.properties.every(
        (member) =>
          ts.isShorthandPropertyAssignment(member) ||
          (ts.isPropertyAssignment(member) &&
            !ts.isComputedPropertyName(member.name) &&
            (ts.isIdentifier(member.initializer) || ts.isLiteralExpression(member.initializer))),
      ) &&
      getKind(spread.left, context) !== "object"
    ) {
      return ifExpression(
        translateCondition(spread.left, scope, context),
        useJavaScript(
          "Spread",
          [object, getHeap(scope, property, context), translateExpression(literal, scope, context)],
          context,
        ),
        object,
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
  node: ts.NewExpression | ts.CallExpression,
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

// A heap class with the classes it derives from, the base first.
const getChain = (current: HeapClass, context: Context): HeapClass[] => {
  const base = ts.isClassLike(current) ? getBaseClass(current, context) : undefined;
  return base === undefined ? [current] : [...getChain(base, context), current];
};

// An instance of a heap class with its fields, before the constructor runs. An instance of a class
// with private methods or accessors has the class's key in its private names first.
const translateInstance = (
  node: ts.Node,
  construction: Construction,
  created: HeapClass,
  heap: Expression,
  scope: Scope,
  context: Context,
) => {
  const builtInBase = ts.isClassLike(created) ? getBuiltInBase(created, context) : undefined;
  const isWrapped = builtInBase !== undefined && builtInBase !== "Object";
  if (isWrapped && !ts.isNewExpression(node)) {
    throw new TlaTypeScriptError("Unsupported Reflect.construct of a wrapper's subclass", node);
  }
  // No constructor body runs, so the arguments and the parameters' defaults are only evaluated
  // where evaluating them can't throw or change anything. A wrapper base reads its first argument.
  const dropped = isWrapped ? construction.arguments.slice(1) : construction.arguments;
  const defaults = getChain(created, context).flatMap((current) =>
    (ts.isClassLike(current)
      ? (current.members.find(ts.isConstructorDeclaration)?.parameters ?? [])
      : current.parameters
    ).flatMap((parameter) => (parameter.initializer === undefined ? [] : [parameter.initializer])),
  );
  const run = getRunConstructor(created, context);
  if (
    (run === undefined || ts.isClassLike(run)) &&
    ![...dropped, ...defaults].every(isInertValue)
  ) {
    throw new TlaTypeScriptError("Unsupported arguments to a constructor that runs no code", node);
  }
  const members = getChain(created, context).flatMap((current) =>
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
    isWrapped && ts.isNewExpression(node)
      ? translateWrapperObject(node, builtInBase, identifier("Null"), scope, context)
      : identifier("EmptyObject"),
  );
  // TypeScript defines a class's parameter properties before its other fields. The construction
  // defines the fields that run a constructor, and those after them.
  const fields = getChain(created, context).flatMap((current) =>
    ts.isClassLike(current)
      ? [
          ...(current.members.find(ts.isConstructorDeclaration)?.parameters ?? []).filter(
            (parameter) => ts.isParameterPropertyDeclaration(parameter, parameter.parent),
          ),
          ...current.members.filter(
            (member) =>
              !ts.isPropertyDeclaration(member) || !getRunFields(current, context).includes(member),
          ),
        ]
      : [],
  );
  return fields.reduce<Expression>(
    (object, member) => {
      if (ts.isParameter(member)) {
        return ts.isIdentifier(member.name)
          ? useJavaScript("Put", [object, string(member.name.text), getUndefined(context)], context)
          : object;
      }
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
        : useJavaScript(
            "Put",
            [object, translateMemberKey(member.name, scope, context), value],
            context,
          );
    },
    useJavaScript(
      "WithPrototype",
      [
        empty,
        useJavaScript(
          "Get",
          [heap, translateExpression(construction.newTarget, scope, context), string("prototype")],
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

// A script's error outside the heap, which takes an empty object on the heap as its identity.
export const isNewError = (node: ts.Node, context: Context) =>
  (ts.isNewExpression(node) &&
    getErrorClass(getSymbol(node.expression, context.checker), context.checker) !== undefined) ||
  getCalledError(node, context) !== undefined;

export const translateAllocated = (node: ts.Node, scope: Scope, context: Context) => {
  const heap = getHeap(scope, node, context);
  if (isNewError(node, context) && !isHeldError(node, context)) {
    return useJavaScript("Allocate", [heap, identifier("EmptyObject")], context);
  }
  if (ts.isRegularExpressionLiteral(node) || getMadeRegExp(node, context) !== undefined) {
    // The constructor, which the prototype's constructor property holds.
    context.builtIns.add("RegExp");
    return useJavaScript(
      "Allocate",
      [
        heap,
        useJavaScript(
          "RegExpObject",
          [
            translateBuiltInValue("RegExp.prototype", node, context),
            translateRegExpValue(node, context),
          ],
          context,
        ),
      ],
      context,
    );
  }
  if (isNestedFunction(node, context)) {
    const isFunction = ts.isFunctionExpression(node);
    return useJavaScript(
      "Allocate",
      [
        heap,
        useJavaScript(
          isFunction ? "FunctionObject" : "MethodObject",
          [
            translateBuiltInValue("Function.prototype", node, context),
            isFunction
              ? translateFunctionValue(node, context)
              : ts.isMethodDeclaration(node)
                ? getMethodValue(node, context)
                : getAccessorValue(node, context),
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
        useJavaScript(
          "Allocate",
          [
            heap,
            useJavaScript(
              "GeneratorPrototypeObject",
              [translateBuiltInValue("%GeneratorFunction%.prototype.prototype", node, context)],
              context,
            ),
          ],
          context,
        ),
        useJavaScript(
          "GeneratorFunctionObject",
          [
            translateBuiltInValue("%GeneratorFunction%.prototype", node, context),
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
  // A message is an own property that isn't enumerable.
  if (isHeldError(node, context)) {
    // The prototype's properties, which the error inherits.
    context.builtIns.add(`${node.expression.getText()}.prototype`);
    const error = useJavaScript(
      "ErrorObject",
      [
        useJavaScript(
          "Get",
          [heap, translateExpression(node.expression, scope, context), string("prototype")],
          context,
        ),
      ],
      context,
    );
    const message = node.arguments?.at(0);
    return useJavaScript(
      "Allocate",
      [
        heap,
        message === undefined
          ? error
          : useJavaScript(
              "Define",
              [
                error,
                string("message"),
                translateExpression(message, scope, context),
                boolean(true),
                boolean(false),
                boolean(true),
              ],
              context,
            ),
      ],
      context,
    );
  }
  if (
    ts.isNewExpression(node) &&
    context.heapCollections.has(node) &&
    isFreshCollection(node, context)
  ) {
    return useJavaScript(
      "Allocate",
      [
        heap,
        useJavaScript(
          "CollectionObject",
          [
            translateBuiltInValue(
              getBuiltIn(node.expression, context) === "Map" ? "Map.prototype" : "Set.prototype",
              node,
              context,
            ),
            translateNew(node, scope, context),
          ],
          context,
        ),
      ],
      context,
    );
  }
  const created = getNewClass(node, context);
  const construction = getConstruction(node, context);
  if (created !== undefined && construction !== undefined) {
    return useJavaScript(
      "Allocate",
      [heap, translateInstance(node, construction, created, heap, scope, context)],
      context,
    );
  }
  if (ts.isObjectLiteralExpression(node)) {
    return useJavaScript("Allocate", [heap, translateObject(node, scope, context)], context);
  }
  if (isHoleyNewArray(node)) {
    const length = Number(node.arguments?.[0]?.getText());
    const positions = Array.from({ length }, (_, offset) => number(offset + 1));
    return useJavaScript(
      "Allocate",
      [
        heap,
        useJavaScript(
          "ArrayObjectWithHoles",
          [
            translateBuiltInValue("Array.prototype", node, context),
            tuple(positions.map(() => getUndefined(context))),
            set(positions),
          ],
          context,
        ),
      ],
      context,
    );
  }
  // A new array that a built-in call makes, as the call's sequence.
  if (ts.isCallExpression(node) && context.heapCollections.has(node)) {
    const prototype = translateBuiltInValue("Array.prototype", node, context);
    // A splice gives the elements that it removes, which its statement then removes.
    const elements =
      isMethodCall(node) && node.expression.name.text === "splice"
        ? translateSpliced(
            translateExpression(node.expression.expression, scope, context),
            node.arguments,
            true,
            scope,
            context,
          )
        : translateCall(node, scope, context, false);
    return useJavaScript(
      "Allocate",
      [heap, useJavaScript("ArrayObject", [prototype, elements], context)],
      context,
    );
  }
  if (ts.isArrayLiteralExpression(node)) {
    // An elision is a hole, which the array has no element for, though its length counts it.
    const holes = node.elements.flatMap((element, position) =>
      ts.isOmittedExpression(element) ? [number(position + 1)] : [],
    );
    const elements = node.elements.some(ts.isSpreadElement)
      ? translateElements(node.elements, scope, context)
      : tuple(
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
  if (
    (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
    (isNewProxy(node, context) || isRevocable(node, context))
  ) {
    const [target, handler] = node.arguments ?? [];
    const values = [target, handler].map((argument) =>
      translateExpression(argument, scope, context),
    );
    const isConstructor = getIsConstructor(target, values[0], heap, context);
    return isRevocable(node, context)
      ? useJavaScript(
          "Revocable",
          [
            heap,
            translateBuiltInValue("Function.prototype", node, context),
            ...values,
            isConstructor,
          ],
          context,
        )
      : useJavaScript(
          "Allocate",
          [heap, useJavaScript("ProxyObject", [heap, ...values, isConstructor], context)],
          context,
        );
  }
  if (getNewBuffer(node, context) !== undefined && ts.isNewExpression(node)) {
    const values = tuple(
      (node.arguments ?? []).map((value) => translateExpression(value, scope, context)),
    );
    return translateNewBufferOf(node, heap, values, scope, context);
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
  if (wrapper !== undefined && (ts.isNewExpression(node) || ts.isCallExpression(node))) {
    // The wrapper's constructor, which its prototype's constructor property holds.
    context.builtIns.add(wrapper);
    return useJavaScript(
      "Allocate",
      [
        heap,
        wrapper === "Symbol"
          ? useJavaScript(
              "SymbolObject",
              [
                translateBuiltInValue("Symbol.prototype", node, context),
                translateExpression((node.arguments ?? [])[0], scope, context),
              ],
              context,
            )
          : translateWrapperObject(
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
    const describedValue = getDescribedValue(node, context);
    const described =
      describedValue === undefined
        ? useJavaScript(
            "Describe",
            [heap, translateObjectValue(node.arguments[0], scope, context), key],
            context,
          )
        : useJavaScript(
            `Describe${describedValue}`,
            [translateExpression(node.arguments[0], scope, context), key],
            context,
          );
    return useJavaScript("Allocate", [heap, described], context);
  }
  if (ts.isCallExpression(node) && isDescriptionOfAll(node, context)) {
    const described = node.arguments[0];
    const primitive = getDescribedPrimitive(described, context);
    if (primitive === "string") context.prelude.add("Null");
    return useJavaScript(
      "DescribeAll",
      [
        heap,
        primitive === "empty"
          ? identifier("EmptyObject")
          : primitive === "string"
            ? useJavaScript(
                "WrapperObject",
                [identifier("Null"), translateExpression(described, scope, context)],
                context,
              )
            : useJavaScript(
                "Lookup",
                [heap, translateObjectValue(described, scope, context)],
                context,
              ),
      ],
      context,
    );
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
    hasHeapType(checker.getNonNullableType(contextual), context)
  );
};

// What a description describes a property of where it isn't an object on the heap: an array that
// a sequence holds, or the String object that Object.getOwnPropertyDescriptor converts a string to.
export const getDescribedValue = (node: ts.CallExpression, context: Context) => {
  const kind = isBuiltInObject(node.arguments[0], context)
    ? "object"
    : getKind(node.arguments[0], context);
  return kind === "sequence" ? "Element" : kind === "string" ? "String" : undefined;
};

// Object.getOwnPropertyDescriptor, or Reflect's, which only differs where the target isn't an
// object.
export const isDescription = (node: ts.Node, context: Context) =>
  isMethodCall(node) &&
  ["Object", "Reflect"].includes(node.expression.expression.getText()) &&
  node.expression.name.text === "getOwnPropertyDescriptor" &&
  node.arguments.length >= 2 &&
  !isProxyValue(node.arguments[0], context) &&
  (["object", "sequence"].includes(getKind(node.arguments[0], context)) ||
    isBuiltInObject(node.arguments[0], context) ||
    (node.expression.expression.getText() === "Object" &&
      getKind(node.arguments[0], context) === "string"));

// The kind of primitive that a description converts to an object: a string, whose object holds
// its characters, or a number, a boolean, or a symbol, whose object holds no properties.
const getDescribedPrimitive = (node: ts.Expression, context: Context) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(node), context.checker);
  const isInert = isInertValue(node) || isSymbolCall(node, context);
  return !isInert || names === undefined || names.length !== 1
    ? undefined
    : names[0] === "string"
      ? "string"
      : ["number", "boolean", "symbol"].includes(names[0])
        ? "empty"
        : undefined;
};

// Object.getOwnPropertyDescriptors of an object, or of a primitive that it converts to one, which
// makes a description of each own property.
export const isDescriptionOfAll = (node: ts.Node, context: Context): boolean =>
  isMethodCall(node) &&
  getBuiltIn(node.expression.expression, context) === "Object" &&
  node.expression.name.text === "getOwnPropertyDescriptors" &&
  node.arguments.length === 1 &&
  (getKind(node.arguments[0], context) === "object" ||
    isBuiltInObject(node.arguments[0], context) ||
    getDescribedPrimitive(node.arguments[0], context) !== undefined) &&
  !isProxyOperation(node, context);

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
      isDescriptionOfAll(node, context) ||
      isCreation(node, context) ||
      isFromEntries(node, context) ||
      isSymbolCall(node, context))) ||
  isNewObject(node, context) ||
  isNewDate(node, context) ||
  isNewProxy(node, context) ||
  getNewBuffer(node, context) !== undefined ||
  isRevocable(node, context) ||
  getNewWrapper(node, context) !== undefined;

// The primitive that new Boolean, new Number, or new String wraps in an object, or that Object
// wraps in a Symbol object.
export const getNewWrapper = (node: ts.Node, context: Context) => {
  const called =
    context.heap !== undefined && ts.isNewExpression(node)
      ? getBuiltIn(node.expression, context)
      : isObjectConversion(node, context)
        ? "Object"
        : undefined;
  // new Object, or Object, of a primitive wraps it as its own constructor would.
  const argument = isObjectConversion(node, context) ? node.arguments?.at(0) : undefined;
  const names =
    called === "Object" &&
    argument !== undefined &&
    isHeapType(context.checker.getTypeAtLocation(node), context)
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
          : primitive === "symbol"
            ? "Symbol"
            : called;
  return (name === "Boolean" ||
    name === "Number" ||
    name === "String" ||
    (name === "Symbol" && primitive === "symbol")) &&
    (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
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
  const method = isCall ? getPrototypeMethod(callee, "Date", context) : node.expression.name.text;
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

// The method of a built-in's prototype, such as Date.prototype, that a value is, or that a variable
// holds from its declaration.
export const getPrototypeMethod = (node: ts.Expression, owner: string, context: Context) => {
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
    getBuiltIn(value.expression.expression, context) === owner
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

// new of an ArrayBuffer, a SharedArrayBuffer, a DataView, or a typed array, which a statement makes
// on the heap, with the constructors that it may call. A callee that isn't the global may hold any
// typed array constructor that its type allows.
export const getNewBuffer = (node: ts.Node, context: Context) => {
  if (
    context.heap === undefined ||
    !ts.isNewExpression(node) ||
    (node.arguments ?? []).some(ts.isSpreadElement)
  ) {
    return undefined;
  }
  const name = getBuiltIn(node.expression, context);
  if (name !== undefined) return isBufferName(name) ? [name] : undefined;
  // A constructor typed only by what it makes, such as an array's constructor, may be the
  // constructor of each typed array that its instance's type allows.
  const type = context.checker.getTypeAtLocation(node.expression);
  const made =
    type.getSymbol()?.name === "__type" ? type.getConstructSignatures().at(0) : undefined;
  const instance =
    made === undefined
      ? undefined
      : (context.checker.getBaseConstraintOfType(made.getReturnType()) ?? made.getReturnType());
  const names =
    instance === undefined
      ? (type.isUnion() ? type.types : [type]).map(
          (inner) => inner.getSymbol()?.name.replace(/Constructor$/, "") ?? "",
        )
      : (instance.isUnion() ? instance.types : [instance]).map(
          (inner) => inner.getSymbol()?.name ?? "",
        );
  const candidates = names.filter(isBufferName).filter((inner) => TYPED_ARRAYS.has(inner));
  return candidates.length === names.length ? candidates : undefined;
};

// The heap after new of a buffer, a DataView, or a typed array, of the values of its arguments,
// which branches on the constructor that its callee holds where it isn't the global.
export const translateNewBufferOf = (
  node: ts.NewExpression,
  heap: Expression,
  values: Expression,
  scope: Scope,
  context: Context,
) => {
  const buffers = getNewBuffer(node, context) ?? [];
  const callee = translateExpression(node.expression, scope, context);
  return getBuiltIn(node.expression, context) === undefined
    ? buffers.reduceRight<Expression>(
        (rest, buffer) =>
          ifExpression(
            useJavaScript(
              "SameValue",
              [callee, translateBuiltInValue(buffer, node, context)],
              context,
            ),
            translateNewBuffer(buffer, heap, values, node, context),
            rest,
          ),
        apply("Assert", [boolean(false), string("tla-ts can't call this constructor")]),
      )
    : translateNewBuffer(buffers[0], heap, values, node, context);
};

const translateNewBuffer = (
  buffer: BufferName,
  heap: Expression,
  values: Expression,
  node: ts.NewExpression,
  context: Context,
) => {
  // The constructor, which the prototype's constructor property holds.
  context.builtIns.add(buffer);
  const prototype = translateBuiltInValue(`${buffer}.prototype`, node, context);
  const type = TYPED_ARRAYS.get(buffer);
  return type !== undefined
    ? useJavaScript(
        "NewTypedArray",
        [
          heap,
          string(type),
          prototype,
          translateBuiltInValue("ArrayBuffer.prototype", node, context),
          values,
        ],
        context,
      )
    : buffer === "DataView"
      ? useJavaScript("NewDataView", [heap, prototype, values], context)
      : useJavaScript(
          "NewBuffer",
          [heap, prototype, values, boolean(buffer === "SharedArrayBuffer")],
          context,
        );
};

type BufferName = "ArrayBuffer" | "SharedArrayBuffer" | "DataView" | `${string}Array`;

const isBufferName = (name: string): name is BufferName =>
  name === "ArrayBuffer" ||
  name === "SharedArrayBuffer" ||
  name === "DataView" ||
  TYPED_ARRAYS.has(name);

// The methods of %TypedArray%.prototype that tla-ts runs.
const TYPED_ARRAY_METHODS = new Set([
  "at",
  "includes",
  "indexOf",
  "lastIndexOf",
  "join",
  "fill",
  "reverse",
  "slice",
  "subarray",
  "set",
]);

const VIEW_ACCESSOR = /^[gs]et(?:Int8|Uint8|Int16|Uint16|Int32|Uint32|Float16|Float32|Float64)$/;

// A DataView's get or set method, a buffer's resize, grow, or slice, or a typed array's method,
// which a statement runs, as each may throw. A typed array's method may also run through call, on
// any receiver, where the callee must hold the built-in method.
export const getViewCall = (node: ts.Node, context: Context) => {
  if (context.heap === undefined || !isMethodCall(node)) return undefined;
  const receiver = node.expression.expression;
  const method = node.expression.name.text;
  const declaration = context.checker
    .getTypeAtLocation(receiver)
    .getCallSignatures()
    .at(0)?.declaration;
  if (
    method === "call" &&
    declaration !== undefined &&
    ts.isMethodSignature(declaration) &&
    ts.isInterfaceDeclaration(declaration.parent) &&
    TYPED_ARRAYS.has(declaration.parent.name.text) &&
    declaration.getSourceFile().isDeclarationFile &&
    node.arguments.length > 0 &&
    !node.arguments.some(ts.isSpreadElement)
  ) {
    return {
      owner: "TypedArray",
      method: declaration.name.getText(),
      receiver: node.arguments[0],
      values: node.arguments.slice(1),
      callee: receiver,
    };
  }
  const type = context.checker.getTypeAtLocation(receiver);
  const isTypedArray = (type.isUnion() ? type.types : [type]).every((member) =>
    TYPED_ARRAYS.has(member.getSymbol()?.name ?? ""),
  );
  const owner = isTypedArray ? "TypedArray" : type.getSymbol()?.name;
  const isKnown =
    (owner === "TypedArray" && TYPED_ARRAY_METHODS.has(method)) ||
    (owner === "DataView" && VIEW_ACCESSOR.test(method)) ||
    (owner === "ArrayBuffer" && method === "resize") ||
    (owner === "SharedArrayBuffer" && method === "grow") ||
    ((owner === "ArrayBuffer" || owner === "SharedArrayBuffer") && method === "slice");
  return isKnown && !node.arguments.some(ts.isSpreadElement)
    ? { owner, method, receiver, values: node.arguments }
    : undefined;
};

// The built-in getters that GetterCall runs, by their owner's prototype.
const GETTERS = new Map([
  [
    "RegExp",
    new Set([
      "flags",
      "source",
      "hasIndices",
      "global",
      "ignoreCase",
      "multiline",
      "dotAll",
      "unicode",
      "unicodeSets",
      "sticky",
    ]),
  ],
  ["Symbol", new Set(["description"])],
  ["Object", new Set(["__proto__"])],
  ["ArrayBuffer", new Set(["byteLength", "maxByteLength", "resizable", "detached"])],
  ["SharedArrayBuffer", new Set(["byteLength", "maxByteLength", "growable"])],
  ["DataView", new Set(["buffer", "byteLength", "byteOffset"])],
  ["Map", new Set(["size"])],
  ["Set", new Set(["size"])],
]);

// The constructors whose @@species getter gives its receiver.
const SPECIES_OWNERS = new Set([
  "Array",
  "RegExp",
  "Map",
  "Set",
  "Promise",
  "ArrayBuffer",
  "SharedArrayBuffer",
]);

// A call of a built-in getter that a variable holds from a descriptor, as in
// Object.getOwnPropertyDescriptor(RegExp.prototype, "global").get, directly or through call, which
// a statement runs, as it may throw.
export const getGetterCall = (node: ts.Node, context: Context) => {
  if (context.heap === undefined || !ts.isCallExpression(node)) return undefined;
  const callee = skipCasts(node.expression);
  const isCall = ts.isPropertyAccessExpression(callee) && callee.name.text === "call";
  const getter = isCall ? callee.expression : callee;
  const origin = getOrigin(getter, context);
  const descriptor = ts.isPropertyAccessExpression(origin)
    ? getOrigin(origin.expression, context)
    : origin;
  const owner =
    ts.isCallExpression(descriptor) && descriptor.arguments.length === 2
      ? skipCasts(descriptor.arguments[0])
      : undefined;
  const key = ts.isCallExpression(descriptor) ? descriptor.arguments.at(1) : undefined;
  const builtIn =
    owner !== undefined && ts.isPropertyAccessExpression(owner) && owner.name.text === "prototype"
      ? getBuiltIn(owner.expression, context)
      : undefined;
  const speciesOwner =
    owner !== undefined &&
    key !== undefined &&
    ts.isPropertyAccessExpression(key) &&
    key.name.text === "species" &&
    getBuiltIn(key.expression, context) === "Symbol"
      ? getBuiltIn(owner, context)
      : undefined;
  const path =
    key !== undefined && ts.isStringLiteral(key) && GETTERS.get(builtIn ?? "")?.has(key.text)
      ? (`get ${builtIn}.prototype.${key.text}` as const)
      : speciesOwner !== undefined && SPECIES_OWNERS.has(speciesOwner)
        ? (`get ${speciesOwner}.@@species` as const)
        : undefined;
  return ts.isPropertyAccessExpression(origin) &&
    origin.name.text === "get" &&
    ts.isCallExpression(descriptor) &&
    descriptor.expression.getText() === "Object.getOwnPropertyDescriptor" &&
    path !== undefined &&
    !node.arguments.some(ts.isSpreadElement)
    ? {
        path,
        getter,
        isCall,
        receiver: isCall ? node.arguments.at(0) : undefined,
      }
    : undefined;
};

// new Proxy of a target and a handler.
export const isNewProxy = (node: ts.Node, context: Context): node is ts.NewExpression =>
  context.heap !== undefined &&
  ts.isNewExpression(node) &&
  getBuiltIn(node.expression, context) === "Proxy" &&
  node.arguments?.length === 2 &&
  !node.arguments.some(ts.isSpreadElement);

// Proxy.revocable of a target and a handler.
export const isRevocable = (node: ts.Node, context: Context) =>
  context.heap !== undefined &&
  isMethodCall(node) &&
  getBuiltIn(node.expression.expression, context) === "Proxy" &&
  node.expression.name.text === "revocable" &&
  node.arguments.length === 2 &&
  !node.arguments.some(ts.isSpreadElement);

// What a variable holds where its declaration gives its value, or else the expression itself.
const getOrigin = (node: ts.Expression, context: Context): ts.Expression => {
  const inner = skipCasts(node);
  const declaration = ts.isIdentifier(inner)
    ? getSymbol(inner, context.checker)?.valueDeclaration
    : undefined;
  return declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer !== undefined
    ? getOrigin(declaration.initializer, context)
    : inner;
};

// A read of the proxy or the revoke function that Proxy.revocable gives, as TypeScript declares it.
const isRevocableMember = (node: ts.Expression, name: string, context: Context) => {
  const method = getSymbol(node, context.checker)?.declarations?.at(0)?.parent.parent;
  return (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === name &&
    method !== undefined &&
    ts.isMethodSignature(method) &&
    method.name.getText() === "revocable" &&
    method.getSourceFile().isDeclarationFile
  );
};

// A value that is a proxy that the script makes, where a statement that reads it runs its traps.
export const isProxyValue = (node: ts.Expression, context: Context) => {
  const origin = getOrigin(node, context);
  return isNewProxy(origin, context) || isRevocableMember(origin, "proxy", context);
};

// Whether new can call a value, where a function that the script writes constructs where it isn't
// an arrow, a method, a generator, or async.
export const getIsConstructor = (
  node: ts.Expression,
  value: Expression,
  heap: Expression,
  context: Context,
) => {
  const callee = getFunctionOfKind(node, context, () => true);
  return callee === undefined
    ? useJavaScript("IsConstructor", [heap, value], context)
    : boolean(
        (ts.isFunctionExpression(callee) || ts.isFunctionDeclaration(callee)) && isPlain(callee),
      );
};

// The target that a proxy the script makes holds, where new Proxy or Proxy.revocable writes it.
export const getProxyTarget = (node: ts.Expression, context: Context) => {
  const origin = getOrigin(node, context);
  const made =
    isRevocableMember(origin, "proxy", context) && ts.isPropertyAccessExpression(origin)
      ? getOrigin(origin.expression, context)
      : origin;
  return (isNewProxy(made, context) || isRevocable(made, context)) &&
    (ts.isNewExpression(made) || ts.isCallExpression(made))
    ? made.arguments?.at(0)
    : undefined;
};

// A call of the function that revokes a proxy, which Proxy.revocable gives.
export const isRevoke = (node: ts.Node, context: Context) =>
  context.heap !== undefined &&
  ts.isCallExpression(node) &&
  node.arguments.length === 0 &&
  isRevocableMember(getOrigin(node.expression, context), "revoke", context);

// new Object(value), or Object(value), which converts the value to an object as new does.
export const isObjectConversion = (
  node: ts.Node,
  context: Context,
): node is ts.NewExpression | ts.CallExpression =>
  context.heap !== undefined &&
  (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
  getBuiltIn(node.expression, context) === "Object";

// new Object() with no value, or Object(), which makes an empty object as {} does.
export const isNewObject = (node: ts.Node, context: Context) => {
  if (!isObjectConversion(node, context)) return false;
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
  if (context.heap === undefined || ts.isFunctionLike(node) || ts.isClassLike(node)) {
    return isMade(node, context, isSometimes) ? [node] : [];
  }
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
  const isNewInstance =
    !isSometimes &&
    created !== undefined &&
    ts.isExpression(node) &&
    (getRunConstructor(created, context) === undefined || isStatementNew(node));
  // The objects that the fields of a new's instance make, before the instance that holds them.
  const fields =
    created !== undefined && isNewInstance
      ? getChain(created, context).flatMap((current) =>
          ts.isClassLike(current)
            ? current.members.flatMap((member) =>
                ts.isPropertyDeclaration(member) &&
                !isStatic(member) &&
                member.initializer !== undefined &&
                !getRunFields(current, context).includes(member)
                  ? getAllocated(member.initializer, context)
                  : [],
              )
            : [],
        )
      : [];
  return isMade(node, context, isSometimes) ? [...nested, ...fields, node] : [...nested, ...fields];
};

// Whether a node itself makes an object, as getAllocated(node).includes(node) tells, without
// collecting what its operands make.
export const isMade = (node: ts.Node, context: Context, isSometimes = false): boolean => {
  if (context.heap === undefined) return false;
  if (
    isHeapFunction(node, context) ||
    isFunctionObject(node, context) ||
    isNestedFunction(node, context)
  ) {
    return !isSometimes;
  }
  if (ts.isFunctionLike(node)) return false;
  if (ts.isClassLike(node)) return isHeapClass(node, context) && !isSometimes;
  if (ts.isOptionalChain(node) || ts.isConditionalExpression(node) || ts.isBinaryExpression(node)) {
    return false;
  }
  const created = getNewClass(node, context);
  const isNewInstance =
    !isSometimes &&
    created !== undefined &&
    ts.isExpression(node) &&
    (getRunConstructor(created, context) === undefined || isStatementNew(node));
  return (
    (ts.isObjectLiteralExpression(node) &&
      isObjectValue(node, context) &&
      !isProxyOperation(node, context)) ||
    // map makes its array as it runs, after it visits each element.
    ((ts.isArrayLiteralExpression(node) ||
      isHoleyNewArray(node) ||
      (ts.isCallExpression(node) && getMapCall(node, context) === undefined) ||
      ts.isNewExpression(node)) &&
      context.heapCollections.has(node)) ||
    ts.isRegularExpressionLiteral(node) ||
    getMadeRegExp(node, context) !== undefined ||
    isNewObject(node, context) ||
    isNewDate(node, context) ||
    isNewProxy(node, context) ||
    getNewBuffer(node, context) !== undefined ||
    getNewWrapper(node, context) !== undefined ||
    isHeldError(node, context) ||
    (!isSometimes && isAllocation(node, context)) ||
    (!isSometimes && isNewError(node, context)) ||
    isNewInstance
  );
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
const isArrayObjectUse = (node: ts.Expression, context: Context): boolean => {
  const parent = node.parent;
  if (
    ts.isParenthesizedExpression(parent) ||
    ts.isAsExpression(parent) ||
    ts.isNonNullExpression(parent) ||
    ts.isSatisfiesExpression(parent)
  ) {
    return isArrayObjectUse(parent, context);
  }
  if (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) {
    return parent.expression === node;
  }
  if (ts.isTypeOfExpression(parent)) return true;
  // A for-of or a spread runs the array's iterator, which reads its elements as an object's, and a
  // for-in reads its keys.
  if ((ts.isForOfStatement(parent) || ts.isForInStatement(parent)) && parent.expression === node) {
    return true;
  }
  if (ts.isSpreadElement(parent)) return true;
  if (ts.isVariableDeclaration(parent)) return ts.isArrayBindingPattern(parent.name);
  if (ts.isBinaryExpression(parent)) {
    const kind = parent.operatorToken.kind;
    return (
      (kind === ts.SyntaxKind.EqualsToken &&
        parent.right === node &&
        ts.isArrayLiteralExpression(parent.left)) ||
      kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
      kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
      kind === ts.SyntaxKind.EqualsEqualsToken ||
      kind === ts.SyntaxKind.ExclamationEqualsToken ||
      (kind === ts.SyntaxKind.InKeyword && parent.right === node) ||
      (kind === ts.SyntaxKind.InstanceOfKeyword && parent.left === node)
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
export const isHoleyArray = (node: ts.Node) => {
  const isHeld =
    node.parent !== undefined &&
    ts.isVariableDeclaration(node.parent) &&
    node.parent.initializer === node &&
    ts.isIdentifier(node.parent.name);
  // new Array(length) that a method reads at once, as in new Array(2).fill(0), stays a sequence.
  return (
    (isHoleyNewArray(node) && isHeld) ||
    (ts.isArrayLiteralExpression(node) &&
      node.elements.some(ts.isOmittedExpression) &&
      !node.elements.some(ts.isSpreadElement) &&
      (isHeld || (ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node)))
  );
};

const isAssigned = (node: ts.Node) =>
  ts.isBinaryExpression(node.parent) &&
  node.parent.left === node &&
  node.parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
  node.parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment;

// A use of an array that changes it in place: a method that changes it, or a write to its length
// or an element.
const isArrayChange = (use: ts.Expression) => {
  const parent = use.parent;
  return (
    (ts.isPropertyAccessExpression(parent) &&
      (IN_PLACE_METHODS.has(parent.name.text) || parent.name.text === "splice") &&
      ts.isCallExpression(parent.parent) &&
      parent.parent.expression === parent) ||
    (ts.isPropertyAccessExpression(parent) &&
      parent.name.text === "length" &&
      isAssigned(parent)) ||
    (ts.isElementAccessExpression(parent) && parent.expression === use && isAssigned(parent))
  );
};

// The name that a script calls a function by, where it declares it or binds it to a constant.
const getCalledName = (owner: ts.SignatureDeclaration) => {
  if (ts.isFunctionDeclaration(owner)) return owner.name;
  // A method of a class that neither extends nor is extended, which a call runs by its name.
  if (
    ts.isMethodDeclaration(owner) &&
    ts.isIdentifier(owner.name) &&
    ts.isClassDeclaration(owner.parent) &&
    owner.parent.heritageClauses === undefined
  ) {
    return owner.name;
  }
  const holder = owner.parent;
  return (ts.isArrowFunction(owner) || ts.isFunctionExpression(owner)) &&
    ts.isVariableDeclaration(holder) &&
    holder.initializer === owner &&
    (holder.parent.flags & ts.NodeFlags.Const) !== 0 &&
    ts.isIdentifier(holder.name)
    ? holder.name
    : undefined;
};

// A new collection that the heap may hold: an array literal, or a new set or map.
const isFreshCollection = (node: ts.Node | undefined, context: Context) =>
  node !== undefined &&
  (ts.isArrayLiteralExpression(node) ||
    (ts.isNewExpression(node) &&
      ["Set", "Map"].includes(getBuiltIn(node.expression, context) ?? "")));

// The built-in methods that give the array they change rather than a new one.
const SELF_RETURNING_METHODS = new Set(["sort", "reverse", "fill", "copyWithin"]);

// A built-in call that makes a new array, such as Array.from(...) or a map, whose sequence the
// heap can hold.
const isFreshArrayCall = (node: ts.CallExpression, context: Context) => {
  const declaration = getSymbol(node.expression, context.checker)?.valueDeclaration;
  return (
    declaration !== undefined &&
    declaration.getSourceFile().isDeclarationFile &&
    getKind(node, context) === "sequence" &&
    !(
      ts.isPropertyAccessExpression(node.expression) &&
      SELF_RETURNING_METHODS.has(node.expression.name.text)
    )
  );
};

// The methods that change a set or a map in place, and those that only read one.
const SET_OR_MAP_CHANGES = new Set(["add", "set", "delete", "clear"]);
const SET_OR_MAP_READS = new Set(["has", "get", "forEach", "keys", "values", "entries"]);

// The array methods that look for an element by identity.
const ELEMENT_SEARCH_METHODS = new Set(["includes", "indexOf", "lastIndexOf"]);

// The array methods whose callback takes each element, and whose result holds none of them.
const ELEMENT_CALLBACK_METHODS = new Set([
  "some",
  "every",
  "forEach",
  "findIndex",
  "findLastIndex",
]);

// The arrays, sets, and maps that a script changes in place where another name may see them, which
// JavaScript shares, live in the heap, with every variable, parameter, and field that may hold
// one, across the files that the script reaches. Each must start new, each use must read the heap,
// and each object with such a field must go only where the field keeps its name. Where any
// doesn't, the collections stay values.
export const findChangedArrays = (reached: readonly ts.Node[], context: Context) => {
  const checker = context.checker;
  const isReached = new Set(reached);
  const references = new Map<ts.Symbol, ts.Identifier[]>();
  const accesses: (ts.PropertyAccessExpression | ts.ElementAccessExpression)[] = [];
  const objects: ts.ObjectLiteralExpression[] = [];
  const expressions: ts.Expression[] = [];
  const visit = (node: ts.Node) => {
    const symbol = ts.isIdentifier(node) ? getSymbol(node, checker) : undefined;
    if (ts.isIdentifier(node) && symbol !== undefined) {
      references.set(symbol, [...(references.get(symbol) ?? []), node]);
    }
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      accesses.push(node);
    }
    if (ts.isObjectLiteralExpression(node)) objects.push(node);
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    if (
      ts.isExpression(node) &&
      !(
        ts.isIdentifier(node) &&
        getSymbol(node, checker)?.declarations?.some(
          (declaration) => ts.getNameOfDeclaration(declaration) === node,
        )
      )
    ) {
      expressions.push(node);
    }
    if (!ts.isTypeNode(node)) ts.forEachChild(node, visit);
  };
  new Set(reached.map((node) => node.getSourceFile())).forEach(visit);
  const getFields = (type: ts.Type, name: string) =>
    (type.isUnion() || type.isIntersection() ? type.types : [type]).flatMap(
      (member) => checker.getPropertyOfType(member, name) ?? [],
    );
  const isInPlace = (use: ts.Expression) => isArrayChange(use) || isSetOrMapChange(use);
  const isSetOrMap = (node: ts.Expression) => ["set", "map"].includes(getKind(node, context));
  // A call that changes a set or a map in place, whose receiver is the use.
  const isSetOrMapChange = (use: ts.Expression) => {
    const parent = use.parent;
    return (
      ts.isPropertyAccessExpression(parent) &&
      parent.expression === use &&
      SET_OR_MAP_CHANGES.has(parent.name.text) &&
      ts.isCallExpression(parent.parent) &&
      parent.parent.expression === parent &&
      isSetOrMap(use)
    );
  };
  // Whether nothing reads what a call gives: a statement makes it, or an arrow function's body that
  // only statements and forEach call.
  const isDiscarded = (call: ts.Expression) => {
    const parent = call.parent;
    if (ts.isExpressionStatement(parent)) return true;
    if (!ts.isArrowFunction(parent) || parent.body !== call) return false;
    const isForEachCallback = (node: ts.Expression) =>
      ts.isCallExpression(node.parent) &&
      node.parent.arguments[0] === node &&
      ts.isPropertyAccessExpression(node.parent.expression) &&
      node.parent.expression.name.text === "forEach";
    const holder = parent.parent;
    const symbol =
      ts.isVariableDeclaration(holder) &&
      holder.initializer === parent &&
      (holder.parent.flags & ts.NodeFlags.Const) !== 0 &&
      ts.isIdentifier(holder.name)
        ? getSymbol(holder.name, checker)
        : undefined;
    return (
      isForEachCallback(parent) ||
      (symbol !== undefined &&
        (references.get(symbol) ?? [])
          .filter((reference) => reference.parent !== holder)
          .every(
            (reference) =>
              isForEachCallback(reference) ||
              (ts.isCallExpression(reference.parent) &&
                reference.parent.expression === reference &&
                ts.isExpressionStatement(reference.parent.parent)),
          ))
    );
  };
  const grow = (start: ts.Symbol[], startOuters: ts.Symbol[] = []) => {
    const group = new Set<ts.Node>();
    const names = new Set<string>();
    const nodes: ts.Node[] = [];
    const pending = [...start];
    // The functions whose results, and the holders whose arrays' elements, are the group's.
    const returns: ts.SignatureDeclaration[] = [];
    const outers = [...startOuters];
    const outerKeys = new Set<ts.Node>();
    // The parameters of callbacks that take each element of an outer holder.
    const elementParameters = new Set<ts.Node>();
    const isInGroup = (symbol: ts.Symbol) =>
      (symbol.declarations ?? []).some((declaration) => group.has(declaration));
    const isSame = (symbol: ts.Symbol, other: ts.Symbol) =>
      (symbol.declarations ?? []).some((declaration) => other.declarations?.includes(declaration));
    // Adds what an expression that holds one of the group's arrays names, where it names any.
    const addHolder = (node: ts.Expression): boolean => {
      if (ts.isParenthesizedExpression(node)) return addHolder(node.expression);
      if (ts.isCallExpression(node)) {
        const called = getCalledFunction(node, checker);
        if (called !== undefined) returns.push(called);
        return (
          called !== undefined ||
          (ts.isPropertyAccessExpression(node.expression) &&
            node.expression.name.text === "at" &&
            addOuter(node.expression.expression))
        );
      }
      if (
        ts.isElementAccessExpression(node) &&
        getAccessedFields(node, checker) === undefined &&
        isNumberLike(node.argumentExpression, context)
      ) {
        return addOuter(node.expression);
      }
      const found = getHolders(node, checker);
      pending.push(...found);
      return found.length > 0;
    };
    // Adds the holders whose arrays' elements are the group's arrays.
    const addOuter = (node: ts.Expression) => {
      const found = getHolders(node, checker);
      outers.push(...found);
      return found.length > 0;
    };
    // Adds where a value that goes into one of the group's holders comes from: an array literal,
    // which the heap holds, or another holder.
    // The references to what a declaration declares. TypeScript may give a reference through an
    // instance another symbol for the same declaration.
    const getReferences = (declaration: ts.Node) =>
      [...references.entries()].flatMap((entry) =>
        (entry[0].declarations ?? []).includes(declaration as ts.Declaration) ? entry[1] : [],
      );
    // A class's method that a class that extends its class may override.
    const isExtended = (owner: ts.SignatureDeclaration) => {
      return (
        ts.isMethodDeclaration(owner) &&
        ts.isClassDeclaration(owner.parent) &&
        getReferences(owner.parent).some((reference) =>
          ts.isExpressionWithTypeArguments(reference.parent),
        )
      );
    };
    // The call that a reference to a function's name makes, as f(...) or this.f(...).
    const getCall = (reference: ts.Identifier) => {
      const callee =
        ts.isPropertyAccessExpression(reference.parent) && reference.parent.name === reference
          ? reference.parent
          : reference;
      return ts.isCallExpression(callee.parent) && callee.parent.expression === callee
        ? callee.parent
        : undefined;
    };
    // A function that returns one of the group's arrays, whose every call gives the array.
    const results = new Set<ts.Node>();
    const addResult = (owner: ts.SignatureDeclaration): boolean => {
      if (results.has(owner)) return true;
      results.add(owner);
      nodes.push(owner);
      const name = getCalledName(owner);
      const called = name === undefined ? undefined : getSymbol(name, checker);
      const body =
        ts.isFunctionDeclaration(owner) ||
        ts.isMethodDeclaration(owner) ||
        ts.isArrowFunction(owner) ||
        ts.isFunctionExpression(owner)
          ? owner.body
          : undefined;
      const returned: ts.Expression[] = [];
      const findReturned = (node: ts.Node) => {
        if (ts.isReturnStatement(node) && node.expression !== undefined) {
          returned.push(node.expression);
        }
        if (!ts.isFunctionLike(node)) ts.forEachChild(node, findReturned);
      };
      if (body !== undefined && ts.isBlock(body)) ts.forEachChild(body, findReturned);
      return (
        called !== undefined &&
        body !== undefined &&
        !isExtended(owner) &&
        (ts.isBlock(body) ? returned : [body]).every(addSource) &&
        (name === undefined ? [] : getReferences(name.parent))
          .filter((reference) => reference !== name)
          .every((reference) => {
            const call = getCall(reference);
            return call !== undefined && isUse(call);
          })
      );
    };
    const addSource = (node: ts.Expression): boolean => {
      if (isFreshCollection(node, context)) {
        nodes.push(node);
        return true;
      }
      if (
        ts.isParenthesizedExpression(node) ||
        ts.isAsExpression(node) ||
        ts.isSatisfiesExpression(node)
      ) {
        return addSource(node.expression);
      }
      // A holder may also hold undefined, which only an optional chain or a check reads.
      if (ts.isIdentifier(node) && node.text === "undefined") {
        return (checker.getTypeAtLocation(node).flags & ts.TypeFlags.Undefined) !== 0;
      }
      if (ts.isConditionalExpression(node)) {
        return addSource(node.whenTrue) && addSource(node.whenFalse);
      }
      if (ts.isCallExpression(node) && isFreshArrayCall(node, context)) {
        nodes.push(node);
        return true;
      }
      // An element that at() reads, which addHolder takes, or what a function returns.
      if (
        ts.isCallExpression(node) &&
        !(ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "at")
      ) {
        const callee = getSymbol(node.expression, checker)?.valueDeclaration;
        const owner =
          callee !== undefined && ts.isVariableDeclaration(callee) ? callee.initializer : callee;
        return owner !== undefined && ts.isFunctionLike(owner) && addResult(owner);
      }
      return addHolder(node);
    };
    // The fields that an object literal's property may be, by its own name and by its type.
    const getPropertyFields = (property: ts.ObjectLiteralElementLike) => {
      const own =
        property.name === undefined ? undefined : checker.getSymbolAtLocation(property.name);
      const contextual = ts.isObjectLiteralExpression(property.parent)
        ? checker.getContextualType(property.parent)
        : undefined;
      return own === undefined
        ? []
        : [own, ...(contextual === undefined ? [] : getFields(contextual, own.name))];
    };
    const isUse = (use: ts.Expression): boolean => {
      const parent = use.parent;
      if (ts.isParenthesizedExpression(parent)) return isUse(parent);
      // A function that returns one of the group's arrays makes its result a holder.
      if (ts.isReturnStatement(parent) || (ts.isArrowFunction(parent) && parent.body === use)) {
        const owner = ts.isReturnStatement(parent)
          ? ts.findAncestor(parent, ts.isFunctionLike)
          : parent;
        if (owner !== undefined) returns.push(owner);
        return owner !== undefined;
      }
      if (ts.isConditionalExpression(parent) && parent.condition !== use) {
        return (
          addSource(parent.whenTrue === use ? parent.whenFalse : parent.whenTrue) && isUse(parent)
        );
      }
      if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        return addHolder(parent.name);
      }
      if (ts.isPropertyAssignment(parent) || ts.isShorthandPropertyAssignment(parent)) {
        const fields = getPropertyFields(parent);
        pending.push(...fields);
        return fields.length > 0;
      }
      if (
        ts.isBinaryExpression(parent) &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ) {
        return parent.left === use ? addSource(parent.right) : addHolder(parent.left);
      }
      if (ts.isNonNullExpression(parent)) return isUse(parent);
      // A new set or map that copies one.
      if (isFreshCollection(parent, context) && ts.isNewExpression(parent)) {
        return parent.arguments?.[0] === use;
      }
      if (ts.isPropertyAccessExpression(parent) && isSetOrMap(use)) {
        const call = parent.parent;
        const method = parent.name.text;
        return (
          method === "size" ||
          (ts.isCallExpression(call) &&
            call.expression === parent &&
            !call.arguments.some(ts.isSpreadElement) &&
            (SET_OR_MAP_READS.has(method) ||
              ["delete", "clear"].includes(method) ||
              (["add", "set"].includes(method) && isDiscarded(call))))
        );
      }
      if (ts.isPropertyAccessExpression(parent)) {
        const call = parent.parent;
        return (
          parent.name.text === "length" ||
          (ts.isCallExpression(call) && isSpliceStatement(call, context)) ||
          ((IN_PLACE_METHODS.has(parent.name.text) || ARRAY_LIKE_METHODS.has(parent.name.text)) &&
            ts.isCallExpression(call) &&
            call.expression === parent &&
            (["push", "unshift"].includes(parent.name.text) ||
              !call.arguments.some(ts.isSpreadElement)))
        );
      }
      if (ts.isElementAccessExpression(parent) && parent.expression === use) {
        return isNumberLike(parent.argumentExpression, context);
      }
      if (ts.isForOfStatement(parent)) return parent.expression === use;
      if (ts.isReturnStatement(parent) || (ts.isArrowFunction(parent) && parent.body === use)) {
        const owner = ts.isArrowFunction(parent)
          ? parent
          : ts.findAncestor(parent, ts.isFunctionLike);
        return owner !== undefined && addResult(owner);
      }
      // A check of whether a holder holds an array reads only the reference.
      if (
        (ts.isIfStatement(parent) && parent.expression === use) ||
        (ts.isPrefixUnaryExpression(parent) &&
          parent.operator === ts.SyntaxKind.ExclamationToken) ||
        (ts.isBinaryExpression(parent) &&
          parent.left === use &&
          parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken)
      ) {
        return true;
      }
      if (ts.isSpreadElement(parent)) {
        const owner = parent.parent;
        return (
          ts.isArrayLiteralExpression(owner) ||
          (ts.isCallExpression(owner) &&
            ts.isPropertyAccessExpression(owner.expression) &&
            ["push", "unshift"].includes(owner.expression.name.text))
        );
      }
      if (ts.isBinaryExpression(parent)) {
        const kind = parent.operatorToken.kind;
        return (
          kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
          kind === ts.SyntaxKind.ExclamationEqualsEqualsToken
        );
      }
      if (!ts.isCallExpression(parent) || parent.arguments.some(ts.isSpreadElement)) return false;
      // An element that an outer holder takes, or looks for.
      if (
        ts.isPropertyAccessExpression(parent.expression) &&
        (["push", "unshift"].includes(parent.expression.name.text) ||
          (ELEMENT_SEARCH_METHODS.has(parent.expression.name.text) && parent.arguments[0] === use))
      ) {
        return addOuter(parent.expression.expression);
      }
      const callee =
        ts.isIdentifier(parent.expression) || ts.isPropertyAccessExpression(parent.expression)
          ? getSymbol(parent.expression, checker)?.valueDeclaration
          : undefined;
      const owner =
        callee !== undefined && ts.isVariableDeclaration(callee) ? callee.initializer : callee;
      const parameter =
        owner !== undefined && ts.isFunctionLike(owner)
          ? owner.parameters.at(parent.arguments.indexOf(use))
          : undefined;
      return (
        parameter !== undefined && ts.isIdentifier(parameter.name) && addHolder(parameter.name)
      );
    };
    const isHolder = (symbol: ts.Symbol): boolean => {
      const declaration = symbol.valueDeclaration;
      if (declaration !== undefined && ts.isParameter(declaration)) {
        nodes.push(declaration);
        if (elementParameters.has(declaration)) return true;
        const owner = declaration.parent;
        const position = owner.parameters.indexOf(declaration);
        const name = getCalledName(owner);
        const called = name === undefined ? undefined : getSymbol(name, checker);
        return (
          called !== undefined &&
          !isExtended(owner) &&
          declaration.initializer === undefined &&
          declaration.dotDotDotToken === undefined &&
          (name === undefined ? [] : getReferences(name.parent))
            .filter((reference) => reference !== name)
            .every((reference) => {
              const call = getCall(reference);
              const argument = call?.arguments.at(position);
              return call !== undefined && argument !== undefined && addSource(argument);
            })
        );
      }
      if (declaration !== undefined && ts.isVariableDeclaration(declaration)) {
        const initializer = declaration.initializer;
        nodes.push(declaration);
        return (
          (declaration.parent.flags & ts.NodeFlags.Const) !== 0 &&
          ts.isIdentifier(declaration.name) &&
          initializer !== undefined &&
          addSource(initializer)
        );
      }
      // A field, which object literals and its class's initializer give its arrays.
      const fieldDeclarations = symbol.declarations ?? [];
      nodes.push(...fieldDeclarations);
      names.add(symbol.name);
      return (
        fieldDeclarations.length > 0 &&
        fieldDeclarations.every(
          (fieldDeclaration) =>
            (ts.isPropertySignature(fieldDeclaration) &&
              fieldDeclaration.questionToken === undefined) ||
            ts.isPropertyAssignment(fieldDeclaration) ||
            ts.isShorthandPropertyAssignment(fieldDeclaration) ||
            (ts.isPropertyDeclaration(fieldDeclaration) &&
              !isStatic(fieldDeclaration) &&
              fieldDeclaration.questionToken === undefined &&
              fieldDeclaration.initializer !== undefined &&
              addSource(fieldDeclaration.initializer)),
        ) &&
        objects.every((object) =>
          object.properties.every((property) => {
            const fields = getPropertyFields(property);
            if (!fields.some((field) => isSame(field, symbol))) return true;
            pending.push(...fields);
            if (ts.isShorthandPropertyAssignment(property)) {
              const value = checker.getShorthandAssignmentValueSymbol(property);
              if (value !== undefined) pending.push(value);
              return value !== undefined;
            }
            return ts.isPropertyAssignment(property) && addSource(property.initializer);
          }),
        )
      );
    };
    const getUses = (symbol: ts.Symbol): ts.Expression[] => {
      const declaration = symbol.valueDeclaration;
      return declaration !== undefined &&
        (ts.isParameter(declaration) || ts.isVariableDeclaration(declaration))
        ? (references.get(symbol) ?? []).filter((reference) => reference !== declaration.name)
        : accesses.filter((access) =>
            getAccessedFields(access, checker)?.some((field) => isSame(field, symbol)),
          );
    };
    // A function's result, where each return gives one of the group's arrays, and each reference
    // calls it.
    const isReturned = (owner: ts.SignatureDeclaration) => {
      const name = getCalledName(owner);
      const called = name === undefined ? undefined : getSymbol(name, checker);
      const body = "body" in owner ? owner.body : undefined;
      const findReturns = (node: ts.Node): ts.ReturnStatement[] =>
        ts.isFunctionLike(node)
          ? []
          : [
              ...(ts.isReturnStatement(node) ? [node] : []),
              ...node.getChildren().flatMap(findReturns),
            ];
      nodes.push(owner);
      return (
        called !== undefined &&
        body !== undefined &&
        (ts.isBlock(body)
          ? body.statements
              .flatMap(findReturns)
              .every(
                (returned) => returned.expression !== undefined && addSource(returned.expression),
              )
          : addSource(body)) &&
        (references.get(called) ?? [])
          .filter((reference) => reference !== name)
          .every(
            (reference) =>
              ts.isCallExpression(reference.parent) &&
              reference.parent.expression === reference &&
              isUse(reference.parent),
          )
      );
    };
    // A holder whose arrays' elements are the group's arrays: each array that it holds starts as a
    // literal, and each use reads, adds, or drops an element, or reads the length.
    const isOuter = (outer: ts.Symbol) => {
      const declarations = outer.declarations ?? [];
      const elements = declarations.map(getElementTypeNode);
      nodes.push(...elements.filter((element) => element !== undefined));
      const isElementSource = (value: ts.Expression | undefined) =>
        value !== undefined &&
        ts.isArrayLiteralExpression(value) &&
        value.elements.every((element) => !ts.isSpreadElement(element) && addSource(element));
      const isElementUse = (use: ts.Expression) => {
        const parent = use.parent;
        if (ts.isPropertyAccessExpression(parent) && parent.expression === use) {
          const call = parent.parent;
          const method = parent.name.text;
          if (method === "length") return true;
          if (
            !ts.isCallExpression(call) ||
            call.expression !== parent ||
            call.arguments.some(ts.isSpreadElement)
          ) {
            return false;
          }
          if (method === "push" || method === "unshift") return call.arguments.every(addSource);
          // A search compares each element with the one it looks for by identity.
          if (ELEMENT_SEARCH_METHODS.has(method)) {
            return call.arguments[0] !== undefined && addSource(call.arguments[0]);
          }
          if (method === "pop" || method === "shift") return ts.isExpressionStatement(call.parent);
          const callback = call.arguments[0];
          const parameter =
            callback !== undefined &&
            (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
              ? callback.parameters[0]
              : undefined;
          if (ELEMENT_CALLBACK_METHODS.has(method)) {
            const symbol =
              parameter !== undefined &&
              ts.isIdentifier(parameter.name) &&
              parameter.initializer === undefined &&
              parameter.dotDotDotToken === undefined
                ? getSymbol(parameter.name, checker)
                : undefined;
            if (parameter !== undefined) elementParameters.add(parameter);
            if (symbol !== undefined) pending.push(symbol);
            return symbol !== undefined && parameter?.parent.parameters.length === 1;
          }
          return method === "at" && isUse(call);
        }
        if (
          !ts.isElementAccessExpression(parent) ||
          parent.expression !== use ||
          !isNumberLike(parent.argumentExpression, context)
        ) {
          return false;
        }
        const assignment = parent.parent;
        return ts.isBinaryExpression(assignment) &&
          assignment.left === parent &&
          assignment.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          assignment.operatorToken.kind <= ts.SyntaxKind.LastAssignment
          ? assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
              addSource(assignment.right)
          : isUse(parent);
      };
      const declaration = outer.valueDeclaration;
      return (
        elements.every((element) => element !== undefined) &&
        (declaration !== undefined && ts.isVariableDeclaration(declaration)
          ? (declaration.parent.flags & ts.NodeFlags.Const) !== 0 &&
            isElementSource(declaration.initializer)
          : declarations.every(
              (fieldDeclaration) =>
                ts.isPropertySignature(fieldDeclaration) &&
                fieldDeclaration.questionToken === undefined,
            ) &&
            objects.every((object) =>
              object.properties.every((property) => {
                const fields = getPropertyFields(property);
                return (
                  !fields.some((field) => isSame(field, outer)) ||
                  (ts.isPropertyAssignment(property) && isElementSource(property.initializer))
                );
              }),
            )) &&
        getUses(outer).every(isElementUse)
      );
    };
    const isGrown = () => {
      while (pending.length > 0 || returns.length > 0 || outers.length > 0) {
        const owner = returns.pop();
        if (owner !== undefined) {
          if (group.has(owner)) continue;
          group.add(owner);
          if (!isReturned(owner)) return false;
          continue;
        }
        const outer = outers.pop();
        if (outer !== undefined) {
          const key = outer.declarations?.[0];
          if (key === undefined || outerKeys.has(key)) continue;
          outerKeys.add(key);
          if (!isOuter(outer)) return false;
          continue;
        }
        const symbol = pending.pop();
        if (symbol === undefined || (symbol.declarations ?? []).every((node) => group.has(node))) {
          continue;
        }
        (symbol.declarations ?? []).forEach((node) => group.add(node));
        if (!isHolder(symbol) || !getUses(symbol).every((use) => addHolder(use) && isUse(use))) {
          return false;
        }
      }
      return true;
    };
    const holdsField = (type: ts.Type) =>
      [...names].some((name) => getFields(type, name).some(isInGroup));
    // Whether an object of one type keeps the group's fields where it goes as another type, whose
    // fields of the same names then join the group.
    const keepsFields = (from: ts.Type, to: ts.Type) =>
      [...names].every((name) => {
        const fields = getFields(to, name);
        const isHeld = getFields(from, name).some(isInGroup);
        if (isHeld) pending.push(...fields.filter((field) => !isInGroup(field)));
        return !isHeld || fields.length > 0;
      });
    // An object that holds one of the group's fields goes only where its fields keep their names,
    // as an operation that reads every field, such as a spread, would read an array as a value.
    const isKept = (node: ts.Expression): boolean => {
      const parent = node.parent;
      const type = checker.getTypeAtLocation(node);
      if (ts.isTypeOfExpression(parent)) return true;
      if (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) {
        return parent.expression !== node || getAccessedFields(parent, checker) !== undefined;
      }
      if (ts.isVariableDeclaration(parent)) {
        return (
          ts.isIdentifier(parent.name) && keepsFields(type, checker.getTypeAtLocation(parent.name))
        );
      }
      if (ts.isPropertyDeclaration(parent) && parent.initializer === node) {
        return keepsFields(type, checker.getTypeAtLocation(parent.name));
      }
      if (
        ts.isParenthesizedExpression(parent) ||
        ts.isAsExpression(parent) ||
        ts.isSatisfiesExpression(parent) ||
        ts.isNonNullExpression(parent)
      ) {
        return keepsFields(type, checker.getTypeAtLocation(parent));
      }
      if (ts.isReturnStatement(parent) || (ts.isArrowFunction(parent) && parent.body === node)) {
        const owner = ts.findAncestor(parent, ts.isFunctionLike);
        const signature =
          owner === undefined ? undefined : checker.getSignatureFromDeclaration(owner);
        return signature !== undefined && keepsFields(type, signature.getReturnType());
      }
      // An element of an array literal goes where the array's elements go.
      if (ts.isArrayLiteralExpression(parent)) {
        const element = checker.getIndexTypeOfType(
          checker.getTypeAtLocation(parent),
          ts.IndexKind.Number,
        );
        return element !== undefined && keepsFields(type, element);
      }
      if (
        ((ts.isCallExpression(parent) || ts.isNewExpression(parent)) &&
          parent.arguments?.includes(node) === true) ||
        (ts.isPropertyAssignment(parent) && parent.initializer === node) ||
        ts.isShorthandPropertyAssignment(parent)
      ) {
        // A property of a literal that nothing types takes the type of its value.
        const property =
          ts.isPropertyAssignment(parent) || ts.isShorthandPropertyAssignment(parent)
            ? checker.getSymbolAtLocation(parent.name)
            : undefined;
        const contextual =
          checker.getContextualType(node) ??
          (property === undefined ? undefined : checker.getTypeOfSymbol(property));
        return contextual !== undefined && keepsFields(type, contextual);
      }
      // A spread copies each field, which keeps the array that the field holds.
      if (ts.isSpreadAssignment(parent)) {
        return keepsFields(type, checker.getTypeAtLocation(parent.parent));
      }
      // A check reads only whether the object is there, as && gives its left side only where
      // that is falsy.
      if (
        ts.isIfStatement(parent) ||
        ts.isPrefixUnaryExpression(parent) ||
        (ts.isBinaryExpression(parent) &&
          parent.left === node &&
          parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) ||
        (ts.isBinaryExpression(parent) &&
          [
            ts.SyntaxKind.EqualsEqualsEqualsToken,
            ts.SyntaxKind.ExclamationEqualsEqualsToken,
          ].includes(parent.operatorToken.kind))
      ) {
        return true;
      }
      if (
        ts.isConditionalExpression(parent) ||
        (ts.isBinaryExpression(parent) &&
          [
            ts.SyntaxKind.AmpersandAmpersandToken,
            ts.SyntaxKind.BarBarToken,
            ts.SyntaxKind.QuestionQuestionToken,
          ].includes(parent.operatorToken.kind))
      ) {
        return keepsFields(type, checker.getTypeAtLocation(parent));
      }
      if (ts.isBinaryExpression(parent) && parent.right === node && isAssigned(parent.left)) {
        return keepsFields(type, checker.getTypeAtLocation(parent.left));
      }
      // A target that an assignment writes, which reads none of its fields.
      if (
        ts.isBinaryExpression(parent) &&
        parent.left === node &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ) {
        return true;
      }
      return ts.isExpressionStatement(parent);
    };
    const isSettled = (): boolean =>
      isGrown() &&
      expressions.every((node) => !holdsField(checker.getTypeAtLocation(node)) || isKept(node)) &&
      (pending.length === 0 || isSettled());
    return isSettled() ? [...nodes, ...group] : [];
  };
  const isReachedNode = (node: ts.Node) =>
    ts.findAncestor(node, (ancestor) => isReached.has(ancestor)) !== undefined;
  // A parameter or a field whose array a function changes in place starts a group.
  const starts = [
    ...[...references.entries()].flatMap((entry) => {
      const declaration = entry[0].valueDeclaration;
      return declaration !== undefined &&
        ts.isParameter(declaration) &&
        isReachedNode(declaration) &&
        entry[1].some(isInPlace)
        ? [[entry[0]]]
        : [];
    }),
    // A constant that names another's array, whose changes JavaScript shares.
    ...[...references.entries()].flatMap((entry) => {
      const declaration = entry[0].valueDeclaration;
      return declaration !== undefined &&
        ts.isVariableDeclaration(declaration) &&
        declaration.initializer !== undefined &&
        !isFreshCollection(declaration.initializer, context) &&
        isReachedNode(declaration) &&
        entry[1].some(isInPlace)
        ? [[entry[0]]]
        : [];
    }),
    ...accesses.flatMap((access) => {
      const fields =
        isReachedNode(access) && isInPlace(access) ? getAccessedFields(access, checker) : undefined;
      return fields === undefined || fields.length === 0 ? [] : [fields];
    }),
  ];
  const found = new Set<ts.Node>();
  starts.forEach((start) => {
    if (start.every((symbol) => (symbol.declarations ?? []).some((node) => found.has(node))))
      return;
    grow(start).forEach((node) => found.add(node));
  });
  // The holders whose arrays' elements are sets or maps that change in place.
  accesses.forEach((access) => {
    const outers =
      ts.isElementAccessExpression(access) &&
      isReachedNode(access) &&
      getAccessedFields(access, checker) === undefined &&
      isNumberLike(access.argumentExpression, context) &&
      isSetOrMapChange(access)
        ? getHolders(access.expression, checker)
        : [];
    const isFound = outers.every((outer) =>
      (outer.declarations ?? []).some((declaration) => {
        const element = getElementTypeNode(declaration);
        return element !== undefined && found.has(element);
      }),
    );
    if (outers.length > 0 && !isFound) grow([], outers).forEach((node) => found.add(node));
  });
  return [...found];
};

// A call of map with a function that the script writes: the array or array-like object that it
// visits, and the function.
export const getMapCall = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  const isCall =
    ts.isPropertyAccessExpression(callee) && callee.getText() === "Array.prototype.map.call";
  const argument = node.arguments.at(isCall ? 1 : 0);
  const callback = argument === undefined ? undefined : getCallee(argument, context);
  const receiver = !ts.isPropertyAccessExpression(callee)
    ? undefined
    : isCall
      ? getKind(node.arguments[0], context) === "object"
        ? node.arguments[0]
        : undefined
      : callee.name.text === "map"
        ? callee.expression
        : undefined;
  return receiver === undefined || callback?.body === undefined
    ? undefined
    : { receiver, callback, isCall };
};

export const findHeapArrays = (
  roots: readonly ts.Node[],
  changed: readonly ts.Node[],
  context: Context,
) => {
  const arrays = new Set<ts.Node>();
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
  roots.forEach(find);
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
  if (context.heap !== undefined) roots.forEach(collect);
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
  // An array literal that a variable holds, where the script gives the array a property that isn't
  // its length or an index, as a test of exec builds the array it expects, keeps an iterator of it,
  // which sees the array change, or takes it from a pattern assignment. The script must read it
  // only as an object.
  const isNamedWrite = (use: ts.Identifier) =>
    ts.isPropertyAccessExpression(use.parent) &&
    use.parent.expression === use &&
    use.parent.name.text !== "length" &&
    ts.isBinaryExpression(use.parent.parent) &&
    use.parent.parent.left === use.parent &&
    use.parent.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken;
  // A pattern assignment gives the array that it destructures to a variable, which a script that
  // only compares the variable or passes it on can tell apart from a copy.
  const isPatternResult = (use: ts.Identifier) => {
    const assignment = use.parent;
    const holder = assignment.parent;
    if (
      !ts.isBinaryExpression(assignment) ||
      assignment.right !== use ||
      assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
      !ts.isArrayLiteralExpression(assignment.left) ||
      !ts.isBinaryExpression(holder) ||
      holder.right !== assignment ||
      holder.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
      !ts.isIdentifier(holder.left) ||
      isSequenceType(context.checker.getTypeAtLocation(holder.left), context.checker)
    ) {
      return false;
    }
    const symbol = getSymbol(holder.left, context.checker);
    return (symbol === undefined ? [] : (references.get(symbol) ?? [])).every(
      (reference) =>
        (ts.isBinaryExpression(reference.parent) &&
          reference.parent.left === reference &&
          reference.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) ||
        (ts.isVariableDeclaration(reference.parent) && reference.parent.name === reference) ||
        (!ts.isPropertyAccessExpression(reference.parent) &&
          !ts.isElementAccessExpression(reference.parent) &&
          isArrayObjectUse(reference, context)),
    );
  };
  references.forEach((uses, symbol) => {
    const declaration = symbol.valueDeclaration;
    const literal =
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer !== undefined &&
      ts.isArrayLiteralExpression(declaration.initializer)
        ? declaration.initializer
        : undefined;
    const reads = uses.filter((use) => use.parent !== declaration);
    if (
      literal !== undefined &&
      literal.elements.every(
        (element) => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element),
      ) &&
      reads.some(
        (use) =>
          isNamedWrite(use) ||
          isPatternResult(use) ||
          getKeptIterator(use.parent.parent, context) !== undefined,
      ) &&
      reads.every((use) => isArrayObjectUse(use, context))
    ) {
      arrays.add(literal);
    }
    // So is the new array that a built-in method makes, as slice() or splice() gives it.
    const initializer =
      declaration !== undefined && ts.isVariableDeclaration(declaration)
        ? declaration.initializer
        : undefined;
    if (
      declaration !== undefined &&
      initializer !== undefined &&
      ts.isCallExpression(initializer) &&
      isFreshArrayCall(initializer, context) &&
      reads.some(isNamedWrite) &&
      reads.every((use) => isArrayObjectUse(use, context))
    ) {
      arrays.add(initializer);
      arrays.add(declaration);
    }
  });
  changed.forEach((node) => arrays.add(node));
  // The array that map makes, which lacks an element where the array that it visits does: an
  // array-like object whose getters may run, or an array or an array-like object that the callback,
  // or what it calls, changes in place. The script must read it only as an object.
  references.forEach((uses, symbol) => {
    const declaration = symbol.valueDeclaration;
    if (declaration === undefined || !ts.isVariableDeclaration(declaration)) return;
    const call = declaration.initializer;
    if (call === undefined || !ts.isCallExpression(call)) return;
    const map = getMapCall(call, context);
    const reads = uses.filter((use) => use.parent !== declaration);
    if (map === undefined || reads.length === 0) return;
    const receiver = map.receiver;
    const held = ts.isIdentifier(receiver) ? getSymbol(receiver, context.checker) : undefined;
    const heldDeclaration = held?.valueDeclaration;
    const isArrayLike =
      map.isCall ||
      (heldDeclaration !== undefined &&
        (arrays.has(heldDeclaration) ||
          (ts.isVariableDeclaration(heldDeclaration) &&
            heldDeclaration.initializer !== undefined &&
            arrays.has(heldDeclaration.initializer))));
    const hasGetters =
      getElementGetters(receiver, context) !== undefined ||
      ["length", "constructor"].some((key) => getDefinedGetters(receiver, key, context).length > 0);
    const reached = new Set(getReached([map.callback], context));
    const isChangedByCallback =
      held !== undefined &&
      (references.get(held) ?? []).some(
        (use) =>
          ts.findAncestor(
            use,
            (ancestor) => ts.isFunctionLike(ancestor) && reached.has(ancestor),
          ) !== undefined &&
          (isArrayChange(use) ||
            (ts.isElementAccessExpression(use.parent) &&
              use.parent.expression === use &&
              ts.isDeleteExpression(use.parent.parent))),
      );
    if (
      ((isArrayLike && hasGetters) || isChangedByCallback) &&
      reads.every((use) => isArrayObjectUse(use, context))
    ) {
      arrays.add(call);
      arrays.add(declaration);
    }
  });
  const check = (node: ts.Node) => {
    if (
      ts.isIdentifier(node) &&
      !(ts.isVariableDeclaration(node.parent) && node.parent.name === node) &&
      !isArrayObjectUse(node, context)
    ) {
      const literal = getArraySource(node, context);
      if (literal !== undefined && arrays.has(literal) && !changed.includes(literal)) {
        throw new TlaTypeScriptError(
          "Use an array that tla-ts holds as an object only through its properties",
          node,
        );
      }
    }
    ts.forEachChild(node, check);
  };
  if (arrays.size > 0) roots.forEach(check);
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

// Reflect.defineProperty, which gives whether it defined the key rather than throwing where it
// can't.
export const isReflectDefinition = (node: MethodCall) =>
  node.expression.expression.getText() === "Reflect" &&
  node.expression.name.text === "defineProperty";

// Object.create runs as a change only where nothing reads the object it makes, so that it can
// throw.
export const isObjectChange = (node: ts.Node, context: Context): node is MethodCall =>
  isMethodCall(node) &&
  ((node.expression.expression.getText() === "Object" &&
    OBJECT_CHANGES.has(node.expression.name.text) &&
    (node.expression.name.text !== "create" ||
      ts.isExpressionStatement(node.parent) ||
      isDescriptorsRead(node, context)) &&
    !isProxyOperation(node, context)) ||
    (isConstruct(node) && getNewClass(node, context) === undefined) ||
    (isReflectDefinition(node) && !isProxyOperation(node, context)));

// The Object functions that convert their first argument to an object, which throws a TypeError for
// null and undefined, and those that give a primitive back, or test it, without converting it.
const COERCING_READS = new Set([
  "getOwnPropertyDescriptor",
  "getOwnPropertyDescriptors",
  "getOwnPropertyNames",
  "getOwnPropertySymbols",
  "keys",
  "values",
  "entries",
  "getPrototypeOf",
]);
const PRIMITIVE_PASSES = new Set([
  "freeze",
  "seal",
  "preventExtensions",
  "isExtensible",
  "isFrozen",
  "isSealed",
]);

// A call of an Object function on a primitive whose value nothing reads, such as
// Object.getOwnPropertyNames(0), with arguments that can't run code.
export const getPrimitiveObjectCall = (node: ts.Node, context: Context) => {
  if (!isMethodCall(node) || getBuiltIn(node.expression.expression, context) !== "Object") {
    return undefined;
  }
  const method = node.expression.name.text;
  const argument = node.arguments.at(0);
  const names =
    argument === undefined
      ? undefined
      : getTypeNames(context.checker.getTypeAtLocation(argument), context.checker);
  return argument !== undefined &&
    (COERCING_READS.has(method) || PRIMITIVE_PASSES.has(method)) &&
    node.arguments.every(isInertValue) &&
    names?.every((name) => name !== "object" && name !== "function")
    ? { argument, method, isCoercing: COERCING_READS.has(method) }
    : undefined;
};

// The built-in constructors whose new, without arguments, makes an object and does nothing else.
const QUIET_CONSTRUCTORS = new Set([
  "Error",
  "EvalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "ArrayBuffer",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
]);

// A new of a built-in constructor that makes an object and does nothing else, such as new Map()
// or new DataView(new ArrayBuffer(4)), so that nothing else can reach what it makes.
const isQuietNew = (node: ts.Expression, context: Context): boolean => {
  if (!ts.isNewExpression(node)) return false;
  const name = getBuiltIn(node.expression, context);
  const argumentList = node.arguments ?? [];
  const argument = argumentList.at(0);
  if (name === undefined || argumentList.length > 1) return false;
  if (argument === undefined) return QUIET_CONSTRUCTORS.has(name);
  return (
    ((name === "ArrayBuffer" || name === "SharedArrayBuffer") &&
      ts.isNumericLiteral(argument) &&
      Number(argument.text) <= 1024) ||
    (name === "DataView" &&
      ts.isNewExpression(argument) &&
      getBuiltIn(argument.expression, context)?.endsWith("ArrayBuffer") === true &&
      isQuietNew(argument, context)) ||
    (name === "WeakRef" &&
      ts.isObjectLiteralExpression(argument) &&
      argument.properties.length === 0) ||
    (name === "FinalizationRegistry" &&
      (ts.isArrowFunction(argument) || ts.isFunctionExpression(argument))) ||
    (name === "AggregateError" &&
      ts.isArrayLiteralExpression(argument) &&
      argument.elements.length === 0)
  );
};

// freeze, seal, or preventExtensions of what a quiet new makes, which nothing else can reach, so
// that the statement changes nothing that anything reads.
export const isUnreachableChange = (node: ts.Node, context: Context) =>
  isMethodCall(node) &&
  getBuiltIn(node.expression.expression, context) === "Object" &&
  ["freeze", "seal", "preventExtensions"].includes(node.expression.name.text) &&
  node.arguments.length === 1 &&
  isQuietNew(node.arguments[0], context);

// The errors that JavaScript itself may throw where a node runs, which instanceof checks for: a
// failed definition or Reflect.construct, a new of a value that isn't a constructor, or a reduce
// of an empty array, the RangeError of an array's invalid length, and a Date method's TypeError
// on another receiver and toISOString's RangeError of an invalid date, replaceAll's TypeError of a
// regexp that isn't global, the SyntaxError of a pattern that isn't valid, and the URIError of a
// malformed URI.
export const getEngineErrors = (node: ts.Node, context: Context) => {
  const isDefinition =
    isObjectChange(node, context) && node.expression.name.text.startsWith("define");
  const isFallible =
    isObjectChange(node, context) && FALLIBLE_CHANGES.has(node.expression.name.text);
  if (
    isDefinition &&
    context.heapCollections.size > 0 &&
    getArrayLiteral(node.arguments[0], context) !== undefined
  ) {
    return ["TypeError", "RangeError"];
  }
  if (isUnresolved(node, context)) return ["ReferenceError"];
  // A using declaration throws a TypeError for a value that isn't disposable, and a SuppressedError
  // where disposing throws after an error.
  if (ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.Using) !== 0) {
    return ["TypeError", "SuppressedError"];
  }
  if (getStackCall(node, context) !== undefined) {
    return ["TypeError", "ReferenceError", "SuppressedError"];
  }
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "any" &&
    getBuiltIn(node.expression.expression, context) === "Promise"
  ) {
    return ["AggregateError"];
  }
  const jsonText = getJsonText(node, context);
  if (jsonText !== undefined) return "error" in parseJson(jsonText) ? ["SyntaxError"] : [];
  const dateCall = getDateCall(node, context);
  if (dateCall !== undefined) {
    return [
      ...(dateCall.callee === undefined ? [] : ["TypeError"]),
      ...(dateCall.method === "toISOString" ? ["RangeError"] : []),
    ];
  }
  if (getHeapRegExpCall(node, context)?.method === "replaceAll") {
    return ["TypeError"];
  }
  if (getViewCall(node, context) !== undefined) return ["TypeError", "RangeError"];
  if (getURICall(node, context)?.isDecode === true) return ["URIError"];
  if (getGetterCall(node, context) !== undefined) return ["TypeError"];
  if (isInvalidRegExp(node, context)) return ["SyntaxError"];
  const created = getNewClass(node, context);
  if (created !== undefined && ts.isClassLike(created) && isNullBased(created)) {
    return ["ReferenceError"];
  }
  return isFallible ||
    getPrimitiveObjectCall(node, context)?.isCoercing === true ||
    (isObjectChange(node, context) && isConstruct(node)) ||
    isRevocable(node, context) ||
    ts.isNewExpression(node) ||
    created !== undefined ||
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
      isReflectDefinition(node) ? "ReflectDefineProperty" : change.operator,
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
