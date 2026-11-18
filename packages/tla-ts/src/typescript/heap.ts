import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type Construction,
  type HeapClass,
  type CalledMethod,
  type Closure,
  type Context,
  isSteady,
  share,
  type FunctionNode,
  findNodes,
  getConstruction,
  getCallee,
  getFunctionOfKind,
  getNewClass,
  isHeldError,
  isInertValue,
  getParameters,
  getObjectMethod,
  getRunConstructor,
  getSettableSupers,
  getRunFields,
  getFieldsAfterSuper,
  getSymbol,
  getUndefined,
  getClassKey,
  getFieldKey,
  getPrivateKey,
  isComputedField,
  isOnceField,
  isPlain,
  isPlainAccessor,
  isPrivateMember,
  isStatic,
  isFunctionObject,
  isHeapClass,
  isHeapEnum,
  translateString,
  isHeapFunction,
  isOnce,
  isStatementNew,
  isMethodCall,
  type MethodCall,
  getBinding,
  getBaseClass,
  getBuiltInBase,
  getLiteralName,
  isAmbient,
  isInlineBase,
  isNullBased,
  getLiveMaker,
  isNestedFunction,
  isClosure,
  getCaptures,
  getSharedDeclaration,
  getCapturedArguments,
  skipCasts,
  getGivenValue,
  isAssigned,
  getFunctionValue,
  isAnyGenerator,
  isAsyncFunction,
  isAsyncGenerator,
  isStrictCode,
  getValueDeclaration,
  getRunMembers,
} from "./context";
import { getPosition } from "./program-nodes";
import { TlaTypeScriptError } from "../errors";
import {
  ARRAY_ITERATOR_REPLACED,
  ARRAY_LIKE_METHODS,
  holdsArrayIteration,
  translateMapped,
  IN_PLACE_METHODS,
  isSelfReturning,
  isUnheldSplice,
  translateSpliced,
  translateNew,
  translateNewKeys,
} from "./collections";
import { isParsedObject, translateParsedObjects } from "./json";
import { getCalledError, getConstructor, getErrorClass, isNativeErrorName } from "./exceptions";
import {
  getThisValue,
  isGlobalObjectVar,
  translateElements,
  translateCondition,
  translateCall,
  SET_METHODS,
  translateExpression,
  translateNode,
  translateOrderedValues,
  translateToString,
} from "./expressions";
import {
  getBuiltIn,
  getBuiltInPath,
  getBuiltInBinding,
  getGeneratorPrototypeRef,
  translateBoundBuiltIn,
  isBuiltInObject,
  translateBuiltInObject,
  translateBuiltInValue,
  getMadeRegExp,
  isUndefinedValue,
  translateRegExpValue,
} from "./intrinsics";
import { getTemporalCall } from "./temporal";
import {
  getTypeNames,
  translateNumberString,
  translateToNumber,
  useJavaScript,
} from "./javascript";
import { isDescriptorsRead, isProxyOperation } from "./protocols";
import { getReached } from "./aliasing";
import { isObjectOperand } from "./conversions";
import { createStateScope, type Scope } from "./scope";
import { getIntlOutcome, getLocalesOutcome, getResolvedOptions } from "./locales";
import { BUILT_INS } from "./built-ins";
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
  getValueTypeNode,
  getKind,
  getRegExpIndicesPart,
  isEvery,
  hasHeapType,
  isHeapType,
  isNumberLike,
  isSequenceType,
  mayBeSequenceType,
  mayBeSetOrMapType,
  TYPED_ARRAYS,
  type BufferName,
  isBufferName,
  isWeakHolderName,
  type WeakHolderName,
  isCollectionName,
  isAnyPlace,
  isHoleyNewArray,
  isNewArrayOfElements,
  getArraySource,
  getIteratedArray,
  getKeptIterator,
  isBigIntLike,
  getWrappedThis,
  getCollection,
  isHeapArray,
  isHeapSetOrMap,
  isOrderedCollection,
  isSetOrMapType,
  REORDER_METHODS,
  getReorderedArray,
  isUntold,
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

// A read of a property of a value of type any or unknown, which may be an array or a string, which
// read their other properties from their prototypes.
export const getAnyProperty = (
  heap: Expression,
  value: Expression,
  key: Expression,
  context: Context,
) => {
  context.builtIns.add("Array.prototype");
  context.builtIns.add("String.prototype");
  return useJavaScript("GetAny", [heap, value, key, boolean(context.isEveryMapHeld)], context);
};

// A value that TypeScript types as a function, or undefined, such as a descriptor's get, which is
// an object where the heap or the built-in objects hold it, as they hold %ThrowTypeError%. A
// function that a script makes is another, which tla-ts reads where it knows the function.
export const isFunctionValue = (node: ts.Expression, context: Context) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(node), context.checker);
  return (
    context.heap !== undefined &&
    getFunctionValue(skipCasts(node), context) === undefined &&
    getKind(node, context) !== "object" &&
    names?.includes("function") === true &&
    names.every((name) => name === "function" || name === "undefined")
  );
};

// The own keys of a function that a script makes where the heap doesn't hold it, besides the
// arguments and caller of a sloppy function.
export const getOwnFunctionKeys = (node: ts.Expression, context: Context) => {
  const made = getFunctionValue(skipCasts(node), context);
  return made === undefined || isAnyGenerator(made) || isAsyncFunction(made)
    ? undefined
    : ts.isArrowFunction(made)
      ? ["length", "name"]
      : ["length", "name", "prototype"];
};

// An object, which may be a built-in one such as Math or Array.prototype.
export const translateObjectValue = (node: ts.Expression, scope: Scope, context: Context) =>
  translateBuiltInObject(node, scope, context) ?? translateExpression(node, scope, context);

// Object's functions read a function value as an object where the heap or the built-in objects
// hold it, and stop on another.
export const translateFunctionObject = (node: ts.Expression, scope: Scope, context: Context) => {
  const builtIn = translateBuiltInObject(node, scope, context);
  if (builtIn !== undefined) return builtIn;
  if (!isFunctionValue(node, context)) return translateExpression(node, scope, context);
  context.builtIns.add("get Function.prototype.arguments");
  return share(translateExpression(node, scope, context), "function", context, (value) =>
    ifExpression(
      useJavaScript("IsHeldObject", [value], context),
      value,
      apply("Assert", [boolean(false), string("tla-ts can't read this function as an object")]),
    ),
  );
};

// The bind of a built-in method that initializes the const that a callee names.
export const getBoundBuiltIn = (callee: ts.Expression, context: Context) => {
  const symbol = ts.isIdentifier(callee) ? getSymbol(callee, context.checker) : undefined;
  const declaration = getValueDeclaration(symbol, context);
  return declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    (ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) !== 0 &&
    declaration.initializer !== undefined
    ? getBuiltInBinding(skipCasts(declaration.initializer), context)
    : undefined;
};

// A call of what a const holds, where a bind of a built-in method initializes it, which runs the
// method with the receiver and the arguments that the bind took first. Only an own-key check runs,
// where the bind's values read the same at the call.
export const translateBoundBuiltInCall = (
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
) => {
  const binding = getBoundBuiltIn(skipCasts(node.expression), context);
  if (binding === undefined) return undefined;
  const method = /^Object\.prototype\.(hasOwnProperty|propertyIsEnumerable)$/.exec(
    binding.path,
  )?.[1];
  const [receiver, ...bound] = binding.arguments;
  const key = [...bound, ...node.arguments].at(0);
  if (
    method === undefined ||
    receiver === undefined ||
    key === undefined ||
    node.arguments.some(ts.isSpreadElement) ||
    !binding.arguments.every((argument) => isSteady(argument, node, context))
  ) {
    return apply("Assert", [
      boolean(false),
      string(`tla-ts can't call the function that ${binding.path}'s bind gives here`),
    ]);
  }
  return useJavaScript(
    method === "hasOwnProperty" ? "HasOwn" : "IsEnumerableOwn",
    [
      getHeap(scope, node, context),
      translateObjectValue(receiver, scope, context),
      translatePropertyKey(key, scope, context),
    ],
    context,
  );
};

const getNumericKey = (node: ts.NumericLiteral) => string(String(Number(node.text)));

export const translatePropertyKey = (node: ts.Expression, scope: Scope, context: Context) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return string(node.text);
  }
  // An object key that a statement converted first gives the primitive it converted to.
  const converted = scope.results.get(node) ?? scope.results.get(skipCasts(node));
  if (converted !== undefined) return useJavaScript("PropertyKey", [converted], context);
  if (ts.isNumericLiteral(node)) return getNumericKey(node);
  const value = translateExpression(node, scope, context);
  if (getKind(node, context) === "string") return value;
  if (isNumberLike(node, context)) return translateNumberString(value, context);
  const names = getTypeNames(context.checker.getTypeAtLocation(node), context.checker);
  if (names?.length === 1 && names[0] === "symbol") return value;
  // Any other key converts as ToPropertyKey converts a primitive, as a type parameter's or a
  // JavaScript var's type may not tell what it holds, and stops as an object, whose conversion runs
  // code.
  return useJavaScript("PropertyKey", [value], context);
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
  return holdObject(node, getModelValue(node, symbol, `${name}Function`, context), context);
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
  return holdObject(method, getModelValue(method, symbol, `${name}Method`, context), context);
};

// The heap holds the object of a function that a model value stands for, where it knows its name,
// with the object that its prototype property starts with, where the heap doesn't hold that yet: a
// generator's objects inherit from it, and a plain function's new would make them.
const holdObject = (node: FunctionNode, value: Expression, context: Context) => {
  const name = getHeldName(node, context);
  if (name === undefined || value.kind !== "Identifier") return value;
  const isGenerator = isAnyGenerator(node);
  const isConstructor =
    (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && isPlain(node);
  const key = `${value.name}.prototype`;
  const kept = getGeneratorPrototypeRef(node, context);
  const prototype = isGenerator
    ? useJavaScript(
        "GeneratorPrototypeObject",
        [
          translateBuiltInValue(
            isAsyncGenerator(node)
              ? "%AsyncGeneratorFunction%.prototype.prototype"
              : "%GeneratorFunction%.prototype.prototype",
            node,
            context,
          ),
        ],
        context,
      )
    : isConstructor
      ? useJavaScript(
          "Define",
          [
            identifier("EmptyObject"),
            string("constructor"),
            value,
            ...[true, false, true].map(boolean),
          ],
          context,
        )
      : undefined;
  context.functionObjects.set(value.name, {
    object: useJavaScript(
      isGenerator
        ? "GeneratorFunctionObject"
        : isConstructor
          ? "PlainFunctionObject"
          : "ArrowObject",
      [
        translateBuiltInValue(
          isAsyncGenerator(node)
            ? "%AsyncGeneratorFunction%.prototype"
            : isGenerator
              ? "%GeneratorFunction%.prototype"
              : isAsyncFunction(node)
                ? "%AsyncFunction%.prototype"
                : "Function.prototype",
          node,
          context,
        ),
        string(name),
        number(getFunctionLength(getParameters(node))),
        ...(prototype === undefined
          ? []
          : [kept ?? useJavaScript(":>", [identifier("Ref"), string(key)], context)]),
      ],
      context,
    ),
    prototype:
      prototype === undefined || kept !== undefined ? undefined : { key, object: prototype },
  });
  return value;
};

// The name that a key gives a function, where a symbol that a variable holds gives its description
// in brackets, or no name where it has none.
const getKeyName = (key: ts.PropertyName, context: Context) => {
  if (ts.isIdentifier(key) || ts.isPrivateIdentifier(key) || ts.isStringLiteral(key))
    return key.text;
  if (ts.isNumericLiteral(key)) return String(Number(key.text));
  if (!ts.isComputedPropertyName(key) || !ts.isIdentifier(key.expression)) return undefined;
  const symbol = getSymbol(key.expression, context.checker);
  const declaration = getValueDeclaration(symbol, context);
  const made =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : undefined;
  if (
    symbol === undefined ||
    made === undefined ||
    !ts.isCallExpression(made) ||
    getBuiltIn(made.expression, context) !== "Symbol" ||
    isAssigned(symbol, key.getSourceFile(), context)
  ) {
    return undefined;
  }
  const description = made.arguments.at(0);
  if (description === undefined) return "";
  return made.arguments.length === 1 && ts.isStringLiteral(description)
    ? `[${description.text}]`
    : undefined;
};

// The name of an anonymous function, which the binding, the assignment to a name, the default of a
// shorthand property that an assignment destructures, or the property or static field that it
// initializes gives, and which is empty where it's an argument, an element, an operand of in or of
// a comma, or what an assignment to anything else assigns.
export const getAnonymousName = (node: ts.ArrowFunction | HeapClass, context: Context) => {
  const named = ts.findAncestor(node.parent, (parent) => !ts.isParenthesizedExpression(parent));
  if (named === undefined) return undefined;
  if (ts.isVariableDeclaration(named)) {
    return ts.isIdentifier(named.name) ? named.name.text : undefined;
  }
  if (ts.isPropertyAssignment(named) && ts.isObjectLiteralExpression(named.parent)) {
    return getKeyName(named.name, context);
  }
  if (ts.isShorthandPropertyAssignment(named)) return named.name.text;
  if (
    ts.isPropertyDeclaration(named) &&
    named.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword)
  ) {
    return getKeyName(named.name, context);
  }
  if (ts.isBinaryExpression(named) && NAMING_ASSIGNMENTS.has(named.operatorToken.kind)) {
    return ts.isIdentifier(named.left) ? named.left.text : "";
  }
  return ts.isCallExpression(named) ||
    ts.isArrayLiteralExpression(named) ||
    (ts.isBinaryExpression(named) &&
      (named.operatorToken.kind === ts.SyntaxKind.InKeyword ||
        named.operatorToken.kind === ts.SyntaxKind.CommaToken))
    ? ""
    : undefined;
};

// The name of a function or a method that the script makes once and holds as a model value, which
// stands for one function object whose properties the heap holds. A function in sloppy code also
// has its own arguments and caller, which the heap doesn't hold.
export const getHeldName = (node: FunctionNode, context: Context) => {
  if (context.heap === undefined || node.body === undefined || !isOnce(node.parent, context)) {
    return undefined;
  }
  if (ts.isMethodDeclaration(node)) {
    return ts.isObjectLiteralExpression(node.parent) ||
      (ts.isClassLike(node.parent) && !isFunctionObject(node.parent, context))
      ? getKeyName(node.name, context)
      : undefined;
  }
  if (
    !(
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node) ||
      ts.isFunctionDeclaration(node)
    ) ||
    [isFunctionObject, isHeapFunction, isNestedFunction, isClosure].some((isMade) =>
      isMade(node, context),
    ) ||
    (!ts.isArrowFunction(node) && isPlain(node) && !isStrictCode(node))
  ) {
    return undefined;
  }
  return ts.isArrowFunction(node) || (ts.isFunctionExpression(node) && node.name === undefined)
    ? getAnonymousName(node, context)
    : node.name?.text;
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
            called.symbol === undefined
              ? string(called.key)
              : useJavaScript("WellKnownSymbol", [string(called.symbol)], context),
          ],
          context,
        ),
        getMethodValue(called.method, context),
      ]);
};

// The object that TypeScript makes of an enum: each member's name gives its value, and a number's
// value gives the name back.
const translateEnumObject = (node: ts.EnumDeclaration, context: Context) => {
  context.prelude.add("JavaScript");
  return node.members.reduce<Expression>((object, member) => {
    const value = context.checker.getConstantValue(member);
    const name = ts.isComputedPropertyName(member.name) ? undefined : member.name.text;
    if (
      name === undefined ||
      value === undefined ||
      !(typeof value === "string" || Number.isInteger(value))
    ) {
      throw new TlaTypeScriptError(
        "tla-ts can't make the object of an enum whose member's value isn't a string or an integer",
        member,
      );
    }
    const named = useJavaScript(
      "Put",
      [
        object,
        string(name),
        typeof value === "string" ? translateString(value, context) : number(value),
      ],
      context,
    );
    return typeof value === "string"
      ? named
      : useJavaScript(
          "Put",
          [named, string(String(value)), translateString(name, context)],
          context,
        );
  }, identifier("EmptyObject"));
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
    if (isPlainAccessor(property) && isOnce(node, context)) {
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
    if (isNestedFunction(property, context) || isClosure(property, context)) {
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
    throw new TlaTypeScriptError(getMemberStop(property, node, context), property);
  }, identifier("EmptyObject"));
};

// Why tla-ts can't make a member of an object literal: a method or an accessor of a literal that
// runs more than once is an object of its own each time, which tla-ts makes only where it reads
// none of the locals of the function around it and isn't a generator.
const getMemberStop = (
  property: ts.ObjectLiteralElementLike,
  literal: ts.ObjectLiteralExpression,
  context: Context,
) => {
  if (
    !(ts.isMethodDeclaration(property) || ts.isAccessor(property)) ||
    property.body === undefined ||
    isOnce(literal, context)
  ) {
    return "Unsupported object member";
  }
  if (ts.isMethodDeclaration(property) && property.asteriskToken !== undefined) {
    return "tla-ts can't make a generator method in an object literal that runs more than once";
  }
  return ts.findAncestor(literal, ts.isFunctionLike) === undefined
    ? "tla-ts can't make a method or an accessor in an object literal that a loop runs again"
    : "tla-ts can't make a method or an accessor that reads the locals of its function in an object literal that runs more than once";
};

// A function's or a class's name: its own, or that of the binding its definition initializes,
// through parentheses but not through a comma.
// The assignments that name an anonymous function or class that they assign to a name.
const NAMING_ASSIGNMENTS = new Set([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
]);

const getFunctionName = (node: HeapClass | ts.ArrowFunction, context: Context) => {
  const named = ts.findAncestor(node.parent, (parent) => !ts.isParenthesizedExpression(parent));
  const ownName = ts.isArrowFunction(node) ? undefined : node.name?.text;
  if (ownName !== undefined) return ownName;
  if (
    named !== undefined &&
    (ts.isBindingElement(named) || ts.isParameter(named)) &&
    ts.isIdentifier(named.name)
  ) {
    return named.name.text;
  }
  const anonymousName = getAnonymousName(node, context);
  if (anonymousName === undefined && named !== undefined && ts.isPropertyAssignment(named)) {
    throw new TlaTypeScriptError("Give this function a key whose name tla-ts can tell", named);
  }
  return anonymousName ?? "";
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
      receiver: getThisValue(method, receiver.value, context),
      prototype: start,
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

// The key of a field that its class computed as the script defined it, which the class's object
// holds.
export const translateComputedKey = (
  member: ts.PropertyDeclaration,
  owner: Expression,
  heap: Expression,
  context: Context,
) => useJavaScript("PrivateGet", [heap, owner, string(getFieldKey(member, context))], context);

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
  const members = ts.isClassLike(node) ? getRunMembers(node) : [];
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
                ? (getRunMembers(node).find(ts.isConstructorDeclaration)?.parameters ?? [])
                : getParameters(node),
            ),
          ),
          [false, false, true],
        ),
        string("name"),
        string(getFunctionName(node, context)),
        [false, false, true],
      ),
      string("prototype"),
      getRef(1),
      [!ts.isClassLike(node), false, false],
    ),
    true,
  );
  const keyed = members
    .flatMap((member) =>
      ts.isPropertyDeclaration(member) && isComputedField(member) ? [member] : [],
    )
    .reduce(
      (current, member) =>
        useJavaScript(
          "PrivateAdd",
          [
            current,
            string(getFieldKey(member, context)),
            translateMemberKey(member.name, scope, context),
          ],
          context,
        ),
      methods,
    );
  const branded =
    staticBranded === undefined
      ? keyed
      : useJavaScript(
          "PrivateAdd",
          [keyed, string(getPrivateKey(staticBranded, context)), boolean(true)],
          context,
        );
  // A function holds the model value of its code, so that a call of a value can tell which it is.
  const object = ts.isClassLike(node)
    ? isOnceField(node, context)
      ? useJavaScript(
          "PrivateAdd",
          [branded, string(getClassKey(node, context)), boolean(true)],
          context,
        )
      : branded
    : useJavaScript("WithCode", [branded, translateFunctionValue(node, context)], context);
  return useJavaScript(
    "Allocate",
    [useJavaScript("Allocate", [heap, prototype], context), object],
    context,
  );
};

// A class that a default makes, after its methods, each a function that a script can only read,
// and its prototype.
const translateClassObject = (node: ts.ClassExpression, heap: Expression, context: Context) => {
  const methods = getRunMembers(node).filter(ts.isMethodDeclaration);
  const getName = (method: ts.MethodDeclaration) =>
    ts.isIdentifier(method.name) || ts.isStringLiteral(method.name) ? method.name.text : "";
  const getRef = (offset: number) => useJavaScript("NextRef", [heap, number(offset)], context);
  const define = (object: Expression, key: string, value: Expression, flags: boolean[]) =>
    useJavaScript("Define", [object, string(key), value, ...flags.map(boolean)], context);
  // Each method takes the next object, after the prototype that a generator method makes first.
  const refs = methods.reduce<number[]>(
    (taken, method) => [
      ...taken,
      (taken.at(-1) ?? 0) + (method.asteriskToken === undefined ? 1 : 2),
    ],
    [],
  );
  const count = refs.at(-1) ?? 0;
  const defineMethods = (object: Expression, isStaticObject: boolean) =>
    methods.reduce(
      (current, method, position) =>
        isStatic(method) === isStaticObject
          ? define(current, getName(method), getRef(refs[position]), [true, false, true])
          : current,
      object,
    );
  const functionPrototype = translateBuiltInValue("Function.prototype", node, context);
  const withMethods = methods.reduce((current, method, position) => {
    const name = string(getName(method));
    const length = number(getFunctionLength(getParameters(method)));
    return method.asteriskToken === undefined
      ? useJavaScript(
          "Allocate",
          [current, useJavaScript("ArrowObject", [functionPrototype, name, length], context)],
          context,
        )
      : useJavaScript(
          "Allocate",
          [
            useJavaScript(
              "Allocate",
              [
                current,
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
                name,
                length,
                getRef(refs[position] - 1),
              ],
              context,
            ),
          ],
          context,
        );
  }, heap);
  const prototype = defineMethods(
    define(identifier("EmptyObject"), "constructor", getRef(count + 2), [true, false, true]),
    false,
  );
  const length = getFunctionLength(
    getRunMembers(node).find(ts.isConstructorDeclaration)?.parameters ?? [],
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
        string(getFunctionName(node, context)),
        [false, false, true],
      ),
      "prototype",
      getRef(count + 1),
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
      : argument === undefined
        ? wrapper === "Number"
          ? number(0)
          : string("")
        : translateConverted(
            argument,
            wrapper === "Number"
              ? translateToNumber(argument, node, scope, context)
              : translateToString(argument, scope, context),
            wrapper === "Number" ? "number" : "string",
            scope,
            context,
          );
  return useJavaScript("WrapperObject", [prototype, primitive], context);
};

// What ToNumber or ToString gives an argument, which a cast may type as a primitive though it holds
// an object, whose valueOf or toString an expression can't call.
const translateConverted = (
  argument: ts.Expression,
  converted: Expression,
  primitive: "number" | "string",
  scope: Scope,
  context: Context,
) =>
  ifExpression(
    useJavaScript("IsRef", [translateExpression(argument, scope, context)], context),
    apply("Assert", [boolean(false), string(`tla-ts can't convert this object to a ${primitive}`)]),
    converted,
  );

// An error that the Error constructor gives a message and options to: the message, where it isn't
// undefined, as an own property that isn't enumerable, and so the options' cause where they have
// one.
export const translateErrorFields = (
  error: Expression,
  args: readonly ts.Expression[],
  heap: Expression,
  scope: Scope,
  context: Context,
) => {
  const message = args.at(0);
  const options = args.at(1);
  const define = (object: Expression, key: string, value: Expression) =>
    useJavaScript(
      "Define",
      [object, string(key), value, boolean(true), boolean(false), boolean(true)],
      context,
    );
  const names =
    message === undefined
      ? ["undefined"]
      : getTypeNames(context.checker.getTypeAtLocation(message), context.checker);
  if (names === undefined || names.some((name) => name === "object" || name === "function")) {
    throw new TlaTypeScriptError("tla-ts can't convert this error's message to a string", message);
  }
  const withMessage =
    message === undefined
      ? error
      : names.includes("undefined")
        ? ifExpression(
            apply("=", [translateExpression(message, scope, context), getUndefined(context)]),
            error,
            define(error, "message", translateToString(message, scope, context)),
          )
        : define(error, "message", translateToString(message, scope, context));
  if (options === undefined) return withMessage;
  if (isProxyValue(options, context)) {
    throw new TlaTypeScriptError("tla-ts can't read the cause of a proxy", options);
  }
  const value = translateExpression(options, scope, context);
  return ifExpression(
    junction("And", [
      useJavaScript("IsRef", [value], context),
      useJavaScript("Has", [heap, value, string("cause")], context),
    ]),
    define(withMessage, "cause", useJavaScript("Get", [heap, value, string("cause")], context)),
    withMessage,
  );
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
  const wrapper =
    builtInBase === "Boolean" || builtInBase === "Number" || builtInBase === "String"
      ? builtInBase
      : undefined;
  const isError = builtInBase !== undefined && isNativeErrorName(builtInBase);
  const isWrapped = wrapper !== undefined || isError;
  if (isWrapped && !ts.isNewExpression(node)) {
    throw new TlaTypeScriptError("Unsupported Reflect.construct of a wrapper's subclass", node);
  }
  // No constructor body runs, so the arguments and the parameters' defaults are only evaluated
  // where evaluating them can't throw or change anything. A wrapper base reads its first argument,
  // and an error its message and options.
  const dropped = construction.arguments.slice(wrapper !== undefined ? 1 : isError ? 2 : 0);
  const defaults = getChain(created, context).flatMap((current) =>
    (ts.isClassLike(current)
      ? (getRunMembers(current).find(ts.isConstructorDeclaration)?.parameters ?? [])
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
    ts.isClassLike(current) ? [...getRunMembers(current)] : [],
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
    wrapper !== undefined && ts.isNewExpression(node)
      ? translateWrapperObject(node, wrapper, identifier("Null"), scope, context)
      : isError && ts.isNewExpression(node)
        ? translateErrorFields(
            useJavaScript("ErrorObject", [identifier("Null")], context),
            // A constructor gives the error its message as it calls super(...).
            getChain(created, context).some(
              (current) =>
                ts.isClassLike(current) && getRunMembers(current).some(ts.isConstructorDeclaration),
            )
              ? []
              : construction.arguments,
            heap,
            scope,
            context,
          )
        : identifier("EmptyObject"),
  );
  // TypeScript defines a class's parameter properties before its other fields. The construction
  // defines the fields that run a constructor, and those after them.
  const fields = getChain(created, context).flatMap((current) =>
    ts.isClassLike(current)
      ? [
          ...(getRunMembers(current).find(ts.isConstructorDeclaration)?.parameters ?? []).filter(
            (parameter) => ts.isParameterPropertyDeclaration(parameter, parameter.parent),
          ),
          ...getRunMembers(current).filter(
            (member) =>
              !ts.isPropertyDeclaration(member) ||
              ![
                ...getRunFields(current, context),
                ...getFieldsAfterSuper(current, context),
              ].includes(member),
          ),
        ]
      : [],
  );
  const instance = fields.reduce<Expression>(
    (object, member) => {
      if (ts.isParameter(member)) {
        return ts.isIdentifier(member.name)
          ? useJavaScript("Put", [object, string(member.name.text), getUndefined(context)], context)
          : object;
      }
      if (!ts.isPropertyDeclaration(member) || isStatic(member) || isAmbient(member)) {
        return object;
      }
      // A field that takes this holds the ref that the instance gets as the heap allocates it.
      const value =
        member.initializer === undefined
          ? getUndefined(context)
          : skipCasts(member.initializer).kind === ts.SyntaxKind.ThisKeyword
            ? useJavaScript("NextRef", [heap, number(1)], context)
            : translateExpression(member.initializer, scope, context);
      return ts.isPrivateIdentifier(member.name)
        ? useJavaScript(
            "PrivateAdd",
            [object, string(getPrivateKey(member, context)), value],
            context,
          )
        : useJavaScript(
            "Put",
            [
              object,
              isComputedField(member)
                ? translateComputedKey(
                    member,
                    translateClassRef(member.parent, scope, context),
                    heap,
                    context,
                  )
                : translateMemberKey(member.name, scope, context),
              value,
            ],
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
  return ts.isClassLike(created) && isOnceField(created, context)
    ? ifExpression(
        useJavaScript(
          "HasPrivate",
          [
            heap,
            translateExpression(construction.callee, scope, context),
            string(getClassKey(created, context)),
          ],
          context,
        ),
        instance,
        apply("Assert", [boolean(false), string("tla-ts can't tell which class this value holds")]),
      )
    : instance;
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
    getErrorClass(getSymbol(node.expression, context.checker), context) !== undefined) ||
  getCalledError(node, context) !== undefined;

// Allocates a function that the script makes each time it runs, after the objects that its
// environment needs, if any: the function's object, which holds the model value of its code and the
// environment of the call that made it, where it reads that call's locals. The object has a
// function's own properties, its length and its name, and a constructor's prototype, a new object
// whose constructor is the function. A sloppy function also has its own arguments and caller, and
// tla-ts may not tell a name, so such a function's object is one whose properties a read stops at.
const allocateMadeFunction = (
  heap: Expression,
  node: Closure,
  before: Expression[],
  environment: Expression | undefined,
  context: Context,
) => {
  const getRef = (offset: number) => useJavaScript("NextRef", [heap, number(offset)], context);
  const functionPrototype = translateBuiltInValue("Function.prototype", node, context);
  const code =
    ts.isFunctionExpression(node) || ts.isArrowFunction(node)
      ? translateFunctionValue(node, context)
      : ts.isMethodDeclaration(node)
        ? getMethodValue(node, context)
        : getAccessorValue(node, context);
  // An arrow, a method, or an async function can't construct.
  const isConstructor = ts.isFunctionExpression(node) && isPlain(node);
  const name = ts.isMethodDeclaration(node)
    ? getKeyName(node.name, context)
    : ts.isFunctionExpression(node) || ts.isArrowFunction(node)
      ? (getAnonymousName(node, context) ??
        (ts.isReturnStatement(node.parent) ||
        (ts.isArrowFunction(node.parent) && node.parent.body === node)
          ? ""
          : undefined))
      : undefined;
  const isOwned = name !== undefined && !(isConstructor && !isStrictCode(node));
  const length = number(getFunctionLength(getParameters(node)));
  const prototype =
    isOwned && isConstructor
      ? [
          useJavaScript(
            "Define",
            [
              identifier("EmptyObject"),
              string("constructor"),
              getRef(before.length + 2),
              ...[true, false, true].map(boolean),
            ],
            context,
          ),
        ]
      : [];
  const made = !isOwned
    ? useJavaScript(
        isConstructor ? "FunctionObject" : "MethodObject",
        [functionPrototype, code],
        context,
      )
    : isConstructor
      ? useJavaScript(
          "MadeConstructorObject",
          [functionPrototype, code, string(name), length, getRef(before.length + 1)],
          context,
        )
      : useJavaScript(
          "MadeFunctionObject",
          [functionPrototype, code, string(name), length],
          context,
        );
  return useJavaScript(
    "AllocateEach",
    [
      heap,
      tuple([
        ...before,
        ...prototype,
        environment === undefined
          ? made
          : useJavaScript("ClosureObject", [made, environment], context),
      ]),
    ],
    context,
  );
};

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
            translateRegExpValue(node, scope, context),
          ],
          context,
        ),
      ],
      context,
    );
  }
  if (isClosure(node, context)) {
    const argumentsOwner = getCapturedArguments(node, context);
    const argumentsObject = argumentsOwner?.body && scope.allocated.get(argumentsOwner.body);
    if (argumentsOwner !== undefined && argumentsObject === undefined) {
      throw new TlaTypeScriptError(
        "tla-ts can't follow a function that outlives its call and reads this arguments object",
        node,
      );
    }
    const bindings = [
      ...getCaptures(node, context).map((symbol): [Expression, Expression] => {
        // A local that closures share is in an environment of its own, which this one holds.
        const shared = getSharedDeclaration(symbol, context);
        if (shared !== undefined) {
          const environment = scope.activations?.get(shared);
          // A closure that the declaration's initializer makes shares the environment it made.
          if (
            environment === undefined ||
            (scope.uninitialized.has(symbol) &&
              ts.findAncestor(node, (ancestor) => ancestor === shared) === undefined)
          ) {
            throw new TlaTypeScriptError(
              `tla-ts can't make a closure that shares ${symbol.name} before its declaration runs`,
              node,
            );
          }
          return [string(symbol.name), environment];
        }
        // A parameter that the call binds to a function holds that function.
        const bound = scope.functions.get(symbol);
        const value =
          scope.bindings.get(symbol) ??
          (bound !== undefined &&
          (ts.isFunctionExpression(bound) ||
            ts.isArrowFunction(bound) ||
            ts.isFunctionDeclaration(bound)) &&
          !isClosure(bound, context)
            ? translateFunctionValue(bound, context)
            : undefined);
        if (value === undefined) {
          throw new TlaTypeScriptError(
            `tla-ts can't follow a function that outlives its call and reads ${symbol.name}`,
            node,
          );
        }
        return [string(symbol.name), value];
      }),
      ...(argumentsObject === undefined
        ? []
        : [[string("arguments"), argumentsObject] satisfies [Expression, Expression]]),
    ];
    return allocateMadeFunction(
      heap,
      node,
      [useJavaScript("EnvironmentObject", [functionFrom(bindings)], context)],
      useJavaScript("NextRef", [heap, number(1)], context),
      context,
    );
  }
  if (isNestedFunction(node, context)) {
    const maker = getLiveMaker(node, context);
    const environment = maker === undefined ? undefined : scope.activations?.get(maker);
    if (maker !== undefined && environment === undefined) {
      throw new TlaTypeScriptError(
        "tla-ts can't make a method that reads the locals of a function it can't follow",
        node,
      );
    }
    return allocateMadeFunction(heap, node, [], environment, context);
  }

  const builtInBinding = getBuiltInBinding(node, context);
  if (builtInBinding !== undefined) {
    const properties = BUILT_INS[builtInBinding.path];
    const getProperty = (key: string) =>
      properties[3].find((property) => property[0] === key && property.length === 3)?.[2];
    const length = getProperty("length");
    const name = getProperty("name");
    if (length?.startsWith("n") !== true || name?.startsWith("s") !== true) {
      throw new TlaTypeScriptError(`tla-ts can't bind ${builtInBinding.path}`, node);
    }
    const targetLength = Number(length.slice(1));
    return share(
      translateExpression(builtInBinding.target, scope, context),
      "target",
      context,
      (target) =>
        ifExpression(
          junction("And", [
            useJavaScript(
              "SameValue",
              [target, translateBoundBuiltIn(builtInBinding.path, node, context)],
              context,
            ),
            useJavaScript(
              "HoldsBuiltIn",
              [heap, target, string("bind"), string("Function.prototype.bind")],
              context,
            ),
            useJavaScript(
              "SameValue",
              [
                useJavaScript("Get", [heap, target, string("length")], context),
                number(targetLength),
              ],
              context,
            ),
            useJavaScript(
              "SameValue",
              [
                useJavaScript("Get", [heap, target, string("name")], context),
                string(name.slice(1)),
              ],
              context,
            ),
            // The receiver and the arguments that bind binds run, though only a call reads them.
            ...builtInBinding.arguments.map((argument) => {
              const value = translateExpression(argument, scope, context);
              return apply("=", [value, value]);
            }),
          ]),
          useJavaScript(
            "Allocate",
            [
              heap,
              useJavaScript(
                "BoundFunctionObject",
                [
                  useJavaScript("Prototype", [heap, target], context),
                  string(name.slice(1)),
                  number(
                    Math.max(0, targetLength - Math.max(0, builtInBinding.arguments.length - 1)),
                  ),
                  boolean(properties[4]),
                ],
                context,
              ),
            ],
            context,
          ),
          apply("Assert", [
            boolean(false),
            string("tla-ts can't tell which function this bind binds"),
          ]),
        ),
    );
  }
  const binding = getBinding(node, context);
  if (binding !== undefined) {
    const targetLength = getFunctionLength(getParameters(binding.target));
    const length = targetLength - binding.arguments.length;
    // A function that the heap holds may have a length that a script defined, which bind reads.
    const held =
      scope.allocated.get(binding.target) ??
      (getHeldName(binding.target, context) === undefined
        ? undefined
        : getCandidateValue(binding.target, context));
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
    const bound = ifExpression(
      binding.isCall
        ? apply("/\\", [
            holds("Function.prototype", "bind"),
            holds("Function.prototype.bind", "call"),
          ])
        : holds("Function.prototype", "bind"),
      ifExpression(
        held === undefined
          ? boolean(true)
          : useJavaScript(
              "SameValue",
              [useJavaScript("Get", [heap, held, string("length")], context), number(targetLength)],
              context,
            ),
        useJavaScript(
          "Allocate",
          [
            heap,
            useJavaScript(
              "BoundFunctionObject",
              [
                translateBuiltInValue("Function.prototype", node, context),
                string(
                  ts.isMethodDeclaration(binding.target)
                    ? (binding.method?.key ?? "")
                    : getFunctionName(binding.target, context),
                ),
                number(Math.max(0, length)),
                boolean(
                  !ts.isArrowFunction(binding.target) && !ts.isMethodDeclaration(binding.target),
                ),
              ],
              context,
            ),
          ],
          context,
        ),
        apply("Assert", [
          boolean(false),
          string("tla-ts can't bind a function whose length a script defined"),
        ]),
      ),
      apply("Assert", [
        boolean(false),
        string("tla-ts can't bind a function where a script replaced Function.prototype.bind"),
      ]),
    );
    return binding.method === undefined
      ? bound
      : ifExpression(
          translateHoldsMethod(binding.method, scope, context),
          bound,
          apply("Assert", [
            boolean(false),
            string("tla-ts can't tell which method this bind binds"),
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
            string(getFunctionName(node, context)),
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
                string(getFunctionName(node, context)),
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
  // A message, and a SuppressedError's error and the error that it suppressed, are own properties
  // that aren't enumerable.
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
    const define = (object: Expression, key: string, value: Expression) =>
      useJavaScript(
        "Define",
        [object, string(key), value, boolean(true), boolean(false), boolean(true)],
        context,
      );
    const parts = node.arguments ?? [];
    // An AggregateError defines its message and its cause, and then the array of its errors.
    if (getBuiltIn(node.expression, context) === "AggregateError") {
      return ifExpression(
        holdsArrayIteration(heap, node, context),
        useJavaScript(
          "Allocate",
          [
            heap,
            define(
              translateErrorFields(error, parts.slice(1), heap, scope, context),
              "errors",
              translateExpression(parts[0], scope, context),
            ),
          ],
          context,
        ),
        apply("Assert", [boolean(false), string(ARRAY_ITERATOR_REPLACED)]),
      );
    }
    const isSuppressed = getBuiltIn(node.expression, context) === "SuppressedError";
    const message = parts.at(isSuppressed ? 2 : 0);
    // A message that any or unknown types may be undefined, which leaves the message out, or
    // another value, which converts to a string.
    const isAnyMessage =
      message !== undefined &&
      (context.checker.getTypeAtLocation(message).flags &
        (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
        0;
    const described =
      message === undefined
        ? error
        : isAnyMessage
          ? share(translateExpression(message, scope, context), "message", context, (value) =>
              ifExpression(
                apply("=", [value, getUndefined(context)]),
                error,
                define(error, "message", useJavaScript("StringOf", [value], context)),
              ),
            )
          : define(error, "message", translateExpression(message, scope, context));
    return useJavaScript(
      "Allocate",
      [
        heap,
        isSuppressed
          ? ["error", "suppressed"].reduce((object, key, position) => {
              const part = parts.at(position);
              return define(
                object,
                key,
                part === undefined
                  ? getUndefined(context)
                  : translateExpression(part, scope, context),
              );
            }, described)
          : described,
      ],
      context,
    );
  }
  if (
    ts.isNewExpression(node) &&
    context.heapCollections.has(node) &&
    isFreshCollection(node, context)
  ) {
    const keys = isOrderedCollection(node, context)
      ? translateNewKeys(node, scope, context)
      : undefined;
    // A subclass's instance is the collection's that it extends.
    const collection =
      getBuiltIn(getConstruction(node, context)?.callee ?? node.expression, context) ?? "";
    return useJavaScript(
      "Allocate",
      [
        heap,
        useJavaScript(
          keys === undefined ? "CollectionObject" : "OrderedCollectionObject",
          [
            isNewSubclassCollection(node, context) || !isCollectionName(collection)
              ? useJavaScript(
                  "Get",
                  [heap, translateExpression(node.expression, scope, context), string("prototype")],
                  context,
                )
              : translateBuiltInValue(`${collection}.prototype`, node, context),
            ...(keys === undefined ? [string(collection)] : []),
            translateNew(node, scope, context),
            ...(keys === undefined ? [] : [keys, boolean(getCollection(node, context) === "Map")]),
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
  if (ts.isEnumDeclaration(node)) {
    return useJavaScript("Allocate", [heap, translateEnumObject(node, context)], context);
  }
  if (ts.isCallExpression(node) && isParsedObject(node, context)) {
    return translateParsedObjects(node, heap, context);
  }
  if (isHoleyNewArray(node, context)) {
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
  if (isNewArrayOfElements(node, context) && context.heapCollections.has(node)) {
    const elements = tuple(
      (node.arguments ?? []).map((element) => translateExpression(element, scope, context)),
    );
    const prototype = translateBuiltInValue("Array.prototype", node, context);
    return useJavaScript(
      "Allocate",
      [heap, useJavaScript("ArrayObject", [prototype, elements], context)],
      context,
    );
  }
  // A set that a set method makes keeps the order that the method adds its keys in.
  const setMethod = context.heapCollections.has(node)
    ? getOrderedSetMethod(node, context)
    : undefined;
  if (ts.isCallExpression(node) && setMethod !== undefined) {
    const other = setMethod.other;
    const prototype = translateBuiltInValue("Set.prototype", node, context);
    const made = translateCall(node, scope, context, false);
    return useJavaScript(
      "Allocate",
      [
        heap,
        isHeapSetOrMap(setMethod.receiver, context) && isHeapSetOrMap(other, context)
          ? useJavaScript(
              "SetMethodObject",
              [
                heap,
                prototype,
                made,
                string(setMethod.method),
                translateNode(setMethod.receiver, scope, context, false),
                translateNode(other, scope, context, false),
                translateOrderedValues(
                  { receiver: other, method: "keys" },
                  heap,
                  translateNode(other, scope, context, false),
                  context,
                ),
              ],
              context,
            )
          : useJavaScript("CollectionObject", [prototype, string("Set"), made], context),
      ],
      context,
    );
  }
  // A new array that a built-in call makes, as the call's sequence.
  if (ts.isCallExpression(node) && context.heapCollections.has(node)) {
    const prototype = translateBuiltInValue("Array.prototype", node, context);
    // A splice gives the elements that it removes, which its statement then removes.
    const isSplice = isMethodCall(node) && node.expression.name.text === "splice";
    if (isSplice && isHeapArray(node.expression.expression, context)) {
      throw new TlaTypeScriptError(
        "tla-ts can't hold the elements that a splice removes from an array that the heap holds",
        node,
      );
    }
    const elements = isSplice
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
      [
        heap,
        useJavaScript(
          isConcatParts(node, context) ? "ArrayObjectOfParts" : "ArrayObject",
          [prototype, elements],
          context,
        ),
      ],
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
  const buffered = getNewBuffer(node, context) && getConstruction(node, context);
  if (buffered !== undefined && ts.isExpression(node)) {
    const values = tuple(
      buffered.arguments.map((value) => translateExpression(value, scope, context)),
    );
    return translateNewBufferOf(node, buffered, heap, values, scope, context);
  }
  const temporal = getTemporalCall(node, context);
  if (ts.isNewExpression(node) && temporal !== undefined) {
    return useJavaScript(
      "TemporalAllocate",
      [
        heap,
        string(temporal.kind),
        translateExpression(node.expression, scope, context),
        translateElements(temporal.values, scope, context),
        translateBuiltInValue(`Temporal.${temporal.made}.prototype`, node, context),
      ],
      context,
    );
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
          : isDateText(values[0], context)
            ? useJavaScript("DateParse", [translateExpression(values[0], scope, context)], context)
            : (getLiteralTime(values[0]) ??
              useJavaScript(
                "TimeFromNumber",
                [
                  translateConverted(
                    values[0],
                    translateToNumber(values[0], node, scope, context),
                    "number",
                    scope,
                    context,
                  ),
                ],
                context,
              ));
    // The constructor, which the prototype's constructor property holds.
    context.builtIns.add("Date");
    // A class that extends Date gives its instance the class's prototype.
    const prototype =
      getBuiltIn(node.expression, context) === "Date"
        ? translateBuiltInValue("Date.prototype", node, context)
        : useJavaScript(
            "Get",
            [heap, translateExpression(node.expression, scope, context), string("prototype")],
            context,
          );
    return useJavaScript(
      "Allocate",
      [heap, useJavaScript("DateObject", [prototype, time], context)],
      context,
    );
  }
  const intl = getNewIntl(node, context);
  if (intl !== undefined) {
    // The function that the object's compare or format getter gives, which the object holds.
    const boundLength = BOUND_LENGTHS.get(intl.name);
    // The constructor, which the prototype's constructor property holds.
    context.builtIns.add(`Intl.${intl.name}`);
    return ifExpression(
      translateIntlKept(node, heap, scope, context),
      useJavaScript(
        "Allocate",
        [
          boundLength === undefined
            ? heap
            : useJavaScript(
                "Allocate",
                [
                  heap,
                  useJavaScript(
                    "ArrowObject",
                    [
                      translateBuiltInValue("Function.prototype", node, context),
                      string(""),
                      number(boundLength),
                    ],
                    context,
                  ),
                ],
                context,
              ),
          useJavaScript(
            "IntlObject",
            [
              translateBuiltInValue(`Intl.${intl.name}.prototype`, node, context),
              string(intl.name),
              boundLength === undefined
                ? getUndefined(context)
                : useJavaScript("NextRef", [heap, number(1)], context),
              intl.resolved === undefined
                ? getUndefined(context)
                : tuple(
                    intl.resolved.map(([key, value]) =>
                      tuple([
                        string(key),
                        typeof value === "boolean"
                          ? boolean(value)
                          : typeof value === "number"
                            ? number(value)
                            : string(value),
                      ]),
                    ),
                  ),
            ],
            context,
          ),
        ],
        context,
      ),
      apply("Assert", [
        boolean(false),
        string(`tla-ts can't construct Intl.${intl.name} where a script changed what it reads`),
      ]),
    );
  }
  const wrapped = getWrappedThis(node, context);
  if (wrapped !== undefined && ts.isExpression(node)) {
    context.builtIns.add(wrapped);
    return useJavaScript(
      "Allocate",
      [
        heap,
        useJavaScript(
          "WrapperObject",
          [
            translateBuiltInValue(`${wrapped}.prototype`, node, context),
            translateExpression(node, scope, context),
          ],
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
        wrapper === "Symbol" || wrapper === "BigInt"
          ? useJavaScript(
              "SlotObject",
              [
                translateBuiltInValue(`${wrapper}.prototype`, node, context),
                string(wrapper.toLowerCase()),
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
  if (ts.isCallExpression(node) && isGroupBy(node, context)) {
    return ifExpression(
      holdsArrayIteration(heap, node, context),
      share(
        translateExpression(node.arguments[0], scope, context),
        "elements",
        context,
        (elements) =>
          useJavaScript(
            "GroupBy",
            [heap, elements, translateMapped(node.arguments[1], elements, scope, context)],
            context,
          ),
      ),
      apply("Assert", [boolean(false), string(ARRAY_ITERATOR_REPLACED)]),
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

// The { length: n } options of Array.from(options) or Array.from(options, callback), which Array.from
// reads only the length of and no code can reach, so the heap doesn't hold it.
export const isArrayFromLength = (node: ts.Node, context: Context) =>
  ts.isObjectLiteralExpression(node) &&
  node.properties.length === 1 &&
  (ts.isPropertyAssignment(node.properties[0]) ||
    ts.isShorthandPropertyAssignment(node.properties[0])) &&
  ts.isIdentifier(node.properties[0].name) &&
  node.properties[0].name.text === "length" &&
  ts.isCallExpression(node.parent) &&
  node.parent.arguments.length <= 2 &&
  node.parent.arguments[0] === node &&
  ts.isPropertyAccessExpression(node.parent.expression) &&
  node.parent.expression.name.text === "from" &&
  getBuiltIn(node.parent.expression.expression, context) === "Array";

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
      getKind(node.arguments[0], context) === "string") ||
    isUntypedObject(node.arguments[0], context));

// A global that the global object holds, whose type tells an object though only declarations give
// it, such as the DOM's window, which holds what a script defines there.
const isUntypedObject = (node: ts.Expression, context: Context) => {
  const type = context.checker.getTypeAtLocation(node);
  return (
    ts.isIdentifier(node) &&
    isGlobalObjectVar(node, context) &&
    getKind(node, context) === "other" &&
    type.getCallSignatures().length === 0 &&
    type.getConstructSignatures().length === 0 &&
    isEvery(type, ts.TypeFlags.Object | ts.TypeFlags.NonPrimitive | ts.TypeFlags.Intersection)
  );
};

// A number that reading changes nothing, such as -Infinity or Math.PI.
const isConstantNumber = (node: ts.Expression, context: Context): boolean =>
  ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken
    ? isConstantNumber(node.operand, context)
    : (ts.isIdentifier(node) &&
        ["Infinity", "NaN"].includes(node.text) &&
        (getSymbol(node, context.checker)?.declarations ?? []).every(
          (declaration) => declaration.getSourceFile().isDeclarationFile,
        )) ||
      (ts.isPropertyAccessExpression(node) &&
        getBuiltIn(node.expression, context) === "Math" &&
        /^[A-Z0-9_]+$/.test(node.name.text));

// The kind of primitive that a description converts to an object: a string, whose object holds
// its characters, or a number, a boolean, or a symbol, whose object holds no properties.
const getDescribedPrimitive = (node: ts.Expression, context: Context) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(node), context.checker);
  const isInert =
    isInertValue(node) || isSymbolCall(node, context) || isConstantNumber(node, context);
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

// Object.create, with a prototype that tla-ts can tell is an object or null, or where a script has
// objects, any prototype, which Create tells as it runs.
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
      isBuiltInObject(prototype, context) ||
      context.heap !== undefined) &&
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

// The syntax that may change something, call a function, or throw, which a callback that
// Object.groupBy runs as an expression lacks, as it does this.
const IMPURE_SYNTAX = new Set([
  ts.SyntaxKind.CallExpression,
  ts.SyntaxKind.NewExpression,
  ts.SyntaxKind.TaggedTemplateExpression,
  ts.SyntaxKind.DeleteExpression,
  ts.SyntaxKind.ThrowStatement,
  ts.SyntaxKind.YieldExpression,
  ts.SyntaxKind.AwaitExpression,
  ts.SyntaxKind.PostfixUnaryExpression,
  ts.SyntaxKind.ThisKeyword,
]);

const isPrimitiveType = (node: ts.Node, context: Context) =>
  getTypeNames(context.checker.getTypeAtLocation(node), context.checker)?.every(
    (name) => name !== "object" && name !== "function",
  ) === true;

// Object.groupBy of an array of primitives that tla-ts keeps outside the heap, whose callback
// gives each a primitive key without calling anything or changing anything, and which a script
// reads as an object.
export const isGroupBy = (node: ts.Node, context: Context) => {
  if (
    !isMethodCall(node) ||
    getBuiltIn(node.expression.expression, context) !== "Object" ||
    node.expression.name.text !== "groupBy" ||
    node.arguments.length !== 2
  ) {
    return false;
  }
  const items = node.arguments[0];
  const callback = skipCasts(node.arguments[1]);
  const element = context.checker.getIndexTypeOfType(
    context.checker.getTypeAtLocation(items),
    ts.IndexKind.Number,
  );
  return (
    isHeapType(context.checker.getTypeAtLocation(node), context) &&
    getKind(items, context) === "sequence" &&
    element !== undefined &&
    getTypeNames(element, context.checker)?.every(
      (name) => name !== "object" && name !== "function",
    ) === true &&
    (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) &&
    callback.asteriskToken === undefined &&
    (ts.getModifiers(callback) ?? []).length === 0 &&
    callback.parameters.length <= 2 &&
    callback.parameters.every(
      (parameter) =>
        parameter.dotDotDotToken === undefined &&
        parameter.initializer === undefined &&
        ts.isIdentifier(parameter.name),
    ) &&
    findNodes(
      callback.body,
      (child): child is ts.Node =>
        IMPURE_SYNTAX.has(child.kind) ||
        (ts.isBinaryExpression(child) &&
          child.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          child.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
        (ts.isPrefixUnaryExpression(child) &&
          (child.operator === ts.SyntaxKind.PlusPlusToken ||
            child.operator === ts.SyntaxKind.MinusMinusToken)) ||
        // A value that may be an object, whose conversion or getter may run its methods.
        (ts.isIdentifier(child) &&
          !(ts.isPropertyAccessExpression(child.parent) && child.parent.name === child) &&
          !isPrimitiveType(child, context)),
    ).length === 0 &&
    findNodes(callback.body, ts.isReturnStatement).every(
      (returned) =>
        returned.expression !== undefined && isPrimitiveType(returned.expression, context),
    ) &&
    (ts.isBlock(callback.body) || isPrimitiveType(callback.body, context))
  );
};

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

// A call of Set.prototype's union, intersection, difference, or symmetricDifference that gives a
// set that keeps its order.
const getOrderedSetMethod = (node: ts.Node, context: Context) =>
  isMethodCall(node) &&
  ["union", "intersection", "difference", "symmetricDifference"].includes(
    node.expression.name.text,
  ) &&
  node.arguments.length === 1 &&
  getKind(node.expression.expression, context) === "set" &&
  isOrderedCollection(node, context)
    ? {
        receiver: node.expression.expression,
        method: node.expression.name.text,
        other: node.arguments[0],
      }
    : undefined;

export const isAllocation = (node: ts.Node, context: Context) =>
  getBinding(node, context) !== undefined ||
  getBuiltInBinding(node, context) !== undefined ||
  (ts.isCallExpression(node) &&
    (isDescription(node, context) ||
      isDescriptionOfAll(node, context) ||
      isCreation(node, context) ||
      isFromEntries(node, context) ||
      isSymbolCall(node, context))) ||
  isGroupBy(node, context) ||
  isNewObject(node, context) ||
  isNewDate(node, context) ||
  (ts.isNewExpression(node) && getTemporalCall(node, context) !== undefined) ||
  getNewIntl(node, context) !== undefined ||
  isNewProxy(node, context) ||
  getNewBuffer(node, context) !== undefined ||
  isRevocable(node, context) ||
  getNewWrapper(node, context) !== undefined;

// Object.prototype.valueOf.call of a value, which converts it to an object as Object does.
export const isValueOfCall = (node: ts.Node, context: Context): node is MethodCall =>
  context.heap !== undefined &&
  isMethodCall(node) &&
  node.expression.name.text === "call" &&
  ts.isPropertyAccessExpression(node.expression.expression) &&
  node.expression.expression.name.text === "valueOf" &&
  ts.isPropertyAccessExpression(node.expression.expression.expression) &&
  node.expression.expression.expression.name.text === "prototype" &&
  getBuiltIn(node.expression.expression.expression.expression, context) === "Object";

// The primitive that new Boolean, new Number, or new String wraps in an object, or that Object, or
// Object.prototype.valueOf through call, wraps in an object.
export const getNewWrapper = (node: ts.Node, context: Context) => {
  const called =
    context.heap !== undefined && ts.isNewExpression(node)
      ? getBuiltIn(node.expression, context)
      : isObjectConversion(node, context)
        ? "Object"
        : undefined;
  // new Object, or Object, of a primitive wraps it as its own constructor would.
  const argument =
    isObjectConversion(node, context) || isValueOfCall(node, context)
      ? node.arguments?.at(0)
      : undefined;
  const isWrapped =
    argument !== undefined &&
    (isValueOfCall(node, context) ||
      (called === "Object" && isHeapType(context.checker.getTypeAtLocation(node), context)));
  const names = isWrapped
    ? getTypeNames(context.checker.getTypeAtLocation(argument), context.checker)
    : undefined;
  const primitive =
    names?.length === 1
      ? names[0]
      : isWrapped && isBigIntLike(argument, context)
        ? "bigint"
        : undefined;
  const name =
    primitive === "string"
      ? "String"
      : primitive === "number"
        ? "Number"
        : primitive === "boolean"
          ? "Boolean"
          : primitive === "symbol"
            ? "Symbol"
            : primitive === "bigint"
              ? "BigInt"
              : called;
  return (name === "Boolean" ||
    name === "Number" ||
    name === "String" ||
    (name === "Symbol" && primitive === "symbol") ||
    (name === "BigInt" && primitive === "bigint")) &&
    (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
    (node.arguments ?? []).length <= 1 &&
    !(node.arguments ?? []).some(ts.isSpreadElement)
    ? name
    : undefined;
};

// Whether a value has the type of a Date.
export const isDateType = (node: ts.Expression, context: Context) =>
  context.checker.getTypeAtLocation(node).getSymbol()?.name === "Date";

// new Date of a time value, of another Date, of a string, or of a year and a month and the rest,
// whose arguments convert to numbers without running code. tla-ts doesn't read the clock.
export const isNewDate = (node: ts.Node, context: Context): node is ts.NewExpression => {
  const construction = getConstruction(node, context);
  if (
    context.heap === undefined ||
    !ts.isNewExpression(node) ||
    construction === undefined ||
    getBuiltIn(construction.callee, context) !== "Date"
  ) {
    return false;
  }
  const values = node.arguments ?? [];
  return values.length === 1
    ? isNumeric(values[0], context) ||
        isDateType(values[0], context) ||
        isDateText(values[0], context)
    : values.length !== 1 && areDateFields(values, context);
};

// The lengths of the functions that the compare and format getters of Intl's objects give.
const BOUND_LENGTHS = new Map([
  ["Collator", 2],
  ["NumberFormat", 1],
  ["DateTimeFormat", 1],
]);

// The Intl constructors that make an object when a script calls them without new.
const CALLABLE_INTL_CONSTRUCTORS = new Set(["Collator", "DateTimeFormat", "NumberFormat"]);

// The value that a literal gives.
const getLiteralValue = (node: ts.Expression, context: Context) => {
  const inner = skipCasts(node);
  return ts.isStringLiteralLike(inner)
    ? { value: inner.text }
    : ts.isNumericLiteral(inner)
      ? { value: Number(inner.text) }
      : ts.isPrefixUnaryExpression(inner) &&
          inner.operator === ts.SyntaxKind.MinusToken &&
          ts.isNumericLiteral(inner.operand)
        ? { value: -Number(inner.operand.text) }
        : inner.kind === ts.SyntaxKind.TrueKeyword || inner.kind === ts.SyntaxKind.FalseKeyword
          ? { value: inner.kind === ts.SyntaxKind.TrueKeyword }
          : isUndefinedValue(inner, context)
            ? { value: undefined }
            : undefined;
};

// A new of an Intl constructor, a call of one that may run without new, or a call of a function
// that reads locales, whose locales and options literals write, with what it throws, or "", the
// object literal of its options, and the function that a call of locales runs.
const getIntlConstruction = (node: ts.Node, context: Context) => {
  if (context.heap === undefined || !(ts.isNewExpression(node) || ts.isCallExpression(node))) {
    return undefined;
  }
  const callee = skipCasts(node.expression);
  const isCall =
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(callee) &&
    callee.name.text === "call";
  const method = isCall ? callee.expression : callee;
  const origin = getOrigin(method, context);
  const owner = ts.isPropertyAccessExpression(origin) ? origin.expression : undefined;
  const name = ts.isPropertyAccessExpression(origin) ? origin.name.text : "";
  // Intl.getCanonicalLocales, or a constructor's supportedLocalesOf, which a call may run through
  // call, and which only reads its locales and options.
  const localesPath =
    !ts.isCallExpression(node) || owner === undefined
      ? undefined
      : name === "getCanonicalLocales" && getBuiltIn(owner, context) === "Intl"
        ? ("Intl.getCanonicalLocales" as const)
        : name === "supportedLocalesOf" &&
            ts.isPropertyAccessExpression(owner) &&
            getBuiltIn(owner.expression, context) === "Intl" &&
            BUILT_INS[`Intl.${owner.name.text}.supportedLocalesOf`] !== undefined
          ? (`Intl.${owner.name.text}.supportedLocalesOf` as const)
          : undefined;
  const isConstruction =
    callee === origin &&
    owner !== undefined &&
    getBuiltIn(owner, context) === "Intl" &&
    (ts.isNewExpression(node) || CALLABLE_INTL_CONSTRUCTORS.has(name));
  if (localesPath === undefined && !isConstruction) return undefined;
  const values = (node.arguments ?? []).map(skipCasts);
  const [locales, options, ...rest] = isCall ? values.slice(1) : values;
  const elements =
    locales !== undefined && ts.isArrayLiteralExpression(locales)
      ? locales.elements.map((element) => getLiteralValue(element, context))
      : [locales === undefined ? { value: undefined } : getLiteralValue(locales, context)];
  const isOptionsLiteral = options !== undefined && ts.isObjectLiteralExpression(options);
  const entries = isOptionsLiteral
    ? options.properties.map((property) =>
        ts.isPropertyAssignment(property) &&
        (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
          ? { key: property.name.text, literal: getLiteralValue(property.initializer, context) }
          : undefined,
      )
    : [];
  const isLiteral =
    rest.length === 0 &&
    (!isCall || values.length === 0 || isInertValue(values[0])) &&
    elements.every((element) => element !== undefined) &&
    (options === undefined ||
      (localesPath !== "Intl.getCanonicalLocales" &&
        (isUndefinedValue(options, context) || isOptionsLiteral))) &&
    entries.every((entry) => entry?.literal !== undefined);
  const literals = elements.flatMap((element) => (element === undefined ? [] : [element.value]));
  const tags =
    locales !== undefined && ts.isArrayLiteralExpression(locales) ? literals : literals[0];
  const read = new Map(
    entries.flatMap((entry) =>
      entry?.literal === undefined ? [] : [[entry.key, entry.literal.value] as const],
    ),
  );
  const outcome = !isLiteral
    ? undefined
    : localesPath === undefined
      ? getIntlOutcome(name, tags, read)
      : getLocalesOutcome(tags, read);
  return outcome === undefined
    ? undefined
    : {
        name,
        outcome,
        resolved: localesPath === undefined ? getResolvedOptions(name, tags, read) : undefined,
        options: isOptionsLiteral ? options : undefined,
        locales: localesPath === undefined ? undefined : { path: localesPath, method, isCall },
      };
};

// The Intl constructor whose new, or call where it may run without new, takes literal locales and
// options that it accepts, so that what it makes depends on no locale data until a method reads it.
export const getNewIntl = (node: ts.Node, context: Context) => {
  const construction = getIntlConstruction(node, context);
  return construction?.outcome === "" && construction.locales === undefined
    ? { name: construction.name, resolved: construction.resolved }
    : undefined;
};

// A call of Intl.getCanonicalLocales, or of a constructor's supportedLocalesOf, whose literal
// locales and options name no locales, so that it gives an empty array.
export const isEmptyLocalesCall = (node: ts.Node, context: Context) => {
  const construction = getIntlConstruction(node, context);
  return construction?.outcome === "" && construction.locales !== undefined;
};

// The error that new of an Intl constructor, or a call of a function that reads locales, throws
// where it rejects the literals of its locales or options.
export const getIntlError = (node: ts.Node, context: Context) => {
  const outcome = getIntlConstruction(node, context)?.outcome;
  return outcome === "" ? undefined : outcome;
};

// Whether new of an Intl constructor, or a call of a function that reads locales, reads what
// tla-ts records: the constructor that Intl holds, or the function that the call runs, and
// Object.prototype, through which an options literal reads the options it lacks.
export const translateIntlKept = (
  node: ts.Node,
  heap: Expression,
  scope: Scope,
  context: Context,
) => {
  const construction = getIntlConstruction(node, context);
  if (construction === undefined) {
    throw new TlaTypeScriptError("Unsupported Intl constructor", node);
  }
  const locales = construction.locales;
  const held =
    locales === undefined
      ? useJavaScript(
          "HoldsBuiltIn",
          [
            heap,
            translateBuiltInValue("Intl", node, context),
            string(construction.name),
            string(`Intl.${construction.name}`),
          ],
          context,
        )
      : apply("/\\", [
          useJavaScript(
            "SameValue",
            [
              translateExpression(locales.method, scope, context),
              translateBuiltInValue(locales.path, node, context),
            ],
            context,
          ),
          locales.isCall
            ? useJavaScript(
                "HoldsBuiltIn",
                [
                  heap,
                  translateBuiltInValue(locales.path, node, context),
                  string("call"),
                  string("Function.prototype.call"),
                ],
                context,
              )
            : boolean(true),
        ]);
  return construction.options === undefined
    ? held
    : apply("/\\", [held, useJavaScript("IsKept", [heap, string("Object.prototype")], context)]);
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

// The methods that give a Date's time value as text, which DateText writes.
export const DATE_TEXT_METHODS = new Set([
  "toString",
  "toDateString",
  "toTimeString",
  "toUTCString",
]);

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
      (isCall &&
        (DATE_FIELDS.has(method) || TIME_METHODS.has(method) || DATE_TEXT_METHODS.has(method))));
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
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const declaration =
    symbol !== undefined && !isAssigned(symbol, node.getSourceFile(), context)
      ? getValueDeclaration(symbol, context)
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
// arguments are primitives that ToNumber converts without running code, or objects whose valueOf
// and toString ToPrimitive runs.
export const getDateSetter = (
  method: string,
  values: readonly ts.Expression[],
  context: Context,
) => {
  const setter = DATE_SETTERS.get(method);
  return setter !== undefined &&
    values.length <= setter.arity &&
    values.every(
      (argument) =>
        isNumeric(argument, context) ||
        isEvery(context.checker.getTypeAtLocation(argument), ts.TypeFlags.StringLike) ||
        isObjectOperand(argument, context),
    )
    ? setter
    : undefined;
};

// Whether ToNumber of a value runs no code and reads no string as a date.
const isNumeric = (argument: ts.Expression, context: Context) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(argument), context.checker);
  return (
    names !== undefined &&
    names.length > 0 &&
    names.every((name) => ["number", "boolean", "null", "undefined"].includes(name))
  );
};

// Whether a value is a string, which Date.parse and new Date read as a date.
export const isDateText = (argument: ts.Expression, context: Context) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(argument), context.checker);
  return names !== undefined && names.length > 0 && names.every((name) => name === "string");
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
      if (argument !== undefined) {
        return translateConverted(
          argument,
          translateToNumber(argument, node, scope, context),
          "number",
          scope,
          context,
        );
      }
      return position === 0 ? identifier("NaN") : number(position === 2 ? 1 : 0);
    }),
    context,
  );

// new, or Reflect.construct, of an ArrayBuffer, a SharedArrayBuffer, a DataView, or a typed array,
// which a statement makes on the heap, with the constructors that it may call. A callee that isn't
// the global may hold any typed array constructor that its type allows.
export const getNewBuffer = (node: ts.Node, context: Context) => {
  const construction = getConstruction(node, context);
  if (
    context.heap === undefined ||
    construction === undefined ||
    construction.arguments.some(ts.isSpreadElement)
  ) {
    return undefined;
  }
  const name = getBuiltIn(construction.callee, context);
  if (name !== undefined) {
    return isBufferName(name) || isWeakHolderName(name) ? [name] : undefined;
  }
  // A constructor typed only by what it makes, such as an array's constructor, may be the
  // constructor of each typed array that its instance's type allows.
  const type = context.checker.getTypeAtLocation(construction.callee);
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

type NewBufferResult = "heap" | "error" | "offset error";

// What new of a buffer, a DataView, or a typed array gives, of the values of its arguments: the
// heap after it, the error, if any, that it throws, or the RangeError that a typed array throws for
// a byteOffset before it converts its length. It branches on the constructor that its callee holds
// where it isn't the global. Reflect.construct throws a TypeError where its newTarget isn't a
// constructor, and otherwise gives the instance its newTarget's prototype.
export const translateNewBufferOf = (
  node: ts.Expression,
  construction: Construction,
  heap: Expression,
  values: Expression,
  scope: Scope,
  context: Context,
  result: NewBufferResult = "heap",
  // What a read of newTarget's prototype gave, where a statement read it first.
  prototypeValue?: Expression,
) => {
  const isError = result !== "heap";
  const buffers = getNewBuffer(node, context) ?? [];
  const callee = translateExpression(construction.callee, scope, context);
  const newTarget =
    construction.newTarget === construction.callee
      ? undefined
      : translateExpression(construction.newTarget, scope, context);
  // A class that the script declares, extending one of the typed arrays without a constructor or
  // instance fields, makes the typed array that its base makes, with its own prototype.
  const subclasses = findNodes(node.getSourceFile(), ts.isClassDeclaration).flatMap(
    (declaration) => {
      const base = getBuiltInBase(declaration, context);
      const buffer = buffers.find((inner) => inner === base && TYPED_ARRAYS.has(inner));
      const symbol = declaration.name && getSymbol(declaration.name, context.checker);
      return declaration.name !== undefined &&
        symbol !== undefined &&
        buffer !== undefined &&
        !isAssigned(symbol, node.getSourceFile(), context)
        ? [{ buffer, value: translateExpression(declaration.name, scope, context) }]
        : [];
    },
  );
  const made =
    getBuiltIn(construction.callee, context) === undefined
      ? [
          ...buffers.map((buffer) => ({
            buffer,
            value: translateBuiltInValue(buffer, node, context),
            target: newTarget,
          })),
          ...subclasses.map((subclass) => ({ ...subclass, target: newTarget ?? callee })),
        ].reduceRight<Expression>(
          (rest, candidate) =>
            ifExpression(
              useJavaScript("SameValue", [callee, candidate.value], context),
              translateNewBuffer(
                candidate.buffer,
                heap,
                values,
                candidate.target,
                node,
                context,
                result,
                prototypeValue,
              ),
              rest,
            ),
          isError
            ? string("")
            : apply("Assert", [boolean(false), string("tla-ts can't call this constructor")]),
        )
      : translateNewBuffer(
          buffers[0],
          heap,
          values,
          newTarget,
          node,
          context,
          result,
          prototypeValue,
        );
  return newTarget === undefined || !isError
    ? made
    : ifExpression(
        useJavaScript("IsConstructor", [heap, newTarget], context),
        made,
        string("TypeError"),
      );
};

const translateNewBuffer = (
  buffer: BufferName | WeakHolderName,
  heap: Expression,
  values: Expression,
  newTarget: Expression | undefined,
  node: ts.Expression,
  context: Context,
  result: NewBufferResult,
  prototypeValue: Expression | undefined,
) => {
  // The constructor, which the prototype's constructor property holds.
  context.builtIns.add(buffer);
  const fallback = translateBuiltInValue(`${buffer}.prototype`, node, context);
  const prototype =
    prototypeValue !== undefined
      ? ifExpression(
          useJavaScript("IsObjectIn", [heap, prototypeValue], context),
          prototypeValue,
          fallback,
        )
      : newTarget === undefined
        ? fallback
        : useJavaScript("PrototypeFromConstructor", [heap, newTarget, fallback], context);
  const type = TYPED_ARRAYS.get(buffer);
  // The error that a typed array or a DataView throws once it converts its byteOffset, before it
  // converts its length.
  if (result === "offset error") {
    return buffer === "DataView"
      ? useJavaScript("NewDataViewError", [heap, prototype, values], context)
      : type === undefined
        ? string("")
        : useJavaScript("TypedArrayOffsetError", [string(type), values], context);
  }
  const suffix = result === "error" ? "Error" : "";
  return type !== undefined
    ? useJavaScript(
        `NewTypedArray${suffix}`,
        [
          heap,
          string(type),
          prototype,
          translateBuiltInValue("ArrayBuffer.prototype", node, context),
          values,
          holdsArrayIteration(heap, node, context),
        ],
        context,
      )
    : buffer === "DataView" || isWeakHolderName(buffer)
      ? useJavaScript(`New${buffer}${suffix}`, [heap, prototype, values], context)
      : useJavaScript(
          `NewBuffer${suffix}`,
          [heap, prototype, values, boolean(buffer === "SharedArrayBuffer")],
          context,
        );
};

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
  "copyWithin",
]);

const ATOMICS_FUNCTIONS = new Set([
  "load",
  "store",
  "add",
  "sub",
  "and",
  "or",
  "xor",
  "exchange",
  "compareExchange",
  "isLockFree",
  "notify",
  "wait",
  "waitAsync",
  "pause",
]);

const VIEW_ACCESSOR =
  /^[gs]et(?:Int8|Uint8|Int16|Uint16|Int32|Uint32|Float16|Float32|Float64|BigInt64|BigUint64)$/;

// A DataView's get or set method, a buffer's resize, grow, or slice, a typed array's method, or an
// Atomics function, which a statement runs, as each may throw. A typed array's method may also run through call, on
// any receiver, where the callee must hold the built-in method.
export const getViewCall = (node: ts.Node, context: Context) => {
  if (
    context.heap === undefined ||
    !isMethodCall(node) ||
    node.arguments.some(ts.isSpreadElement)
  ) {
    return undefined;
  }
  const target = node.expression.expression;
  const declaration = context.checker
    .getTypeAtLocation(target)
    .getCallSignatures()
    .at(0)?.declaration;
  // A built-in method that runs through call, by the library interface that declares it.
  const declared =
    node.expression.name.text === "call" &&
    node.arguments.length > 0 &&
    declaration !== undefined &&
    ts.isMethodSignature(declaration) &&
    ts.isInterfaceDeclaration(declaration.parent) &&
    declaration.getSourceFile().isDeclarationFile
      ? { owner: declaration.parent.name.text, method: declaration.name.getText() }
      : undefined;
  const type = context.checker.getTypeAtLocation(target);
  const typeNames =
    declared === undefined
      ? (type.isUnion() ? type.types : [type]).map((member) => member.getSymbol()?.name ?? "")
      : [declared.owner];
  const owner = typeNames.every((name) => TYPED_ARRAYS.has(name))
    ? "TypedArray"
    : typeNames.every((name) => name === typeNames[0])
      ? typeNames[0]
      : undefined;
  const call =
    declared === undefined
      ? { owner, method: node.expression.name.text, receiver: target, values: node.arguments }
      : {
          owner,
          method: declared.method,
          receiver: node.arguments[0],
          values: node.arguments.slice(1),
          callee: target,
        };
  const method = call.method;
  // Through call, any typed array method throws a TypeError for a receiver that isn't one.
  const isKnown =
    (owner === "TypedArray" && (declared !== undefined || TYPED_ARRAY_METHODS.has(method))) ||
    (owner === "DataView" && VIEW_ACCESSOR.test(method)) ||
    (owner === "WeakRef" && method === "deref") ||
    (owner === "FinalizationRegistry" && ["register", "unregister"].includes(method)) ||
    (owner === "ArrayBuffer" &&
      (method === "resize" || method === "transfer" || method === "transferToFixedLength")) ||
    (owner === "SharedArrayBuffer" && method === "grow") ||
    ((owner === "ArrayBuffer" || owner === "SharedArrayBuffer") && method === "slice") ||
    (owner === "Atomics" && ATOMICS_FUNCTIONS.has(method));
  return isKnown ? call : undefined;
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
  ["Intl.Collator", new Set(["compare"])],
  ["Intl.NumberFormat", new Set(["format"])],
  ["Intl.DateTimeFormat", new Set(["format"])],
  [
    "Intl.Locale",
    new Set(
      Object.keys(BUILT_INS).flatMap((name) =>
        name.startsWith("get Intl.Locale.prototype.")
          ? [name.slice("get Intl.Locale.prototype.".length)]
          : [],
      ),
    ),
  ],
  ["Map", new Set(["size"])],
  ["Set", new Set(["size"])],
  // The getters of Temporal's prototypes, which read only their receiver's internal slots.
  ...[
    "Duration",
    "Instant",
    "PlainDate",
    "PlainDateTime",
    "PlainMonthDay",
    "PlainTime",
    "PlainYearMonth",
    "ZonedDateTime",
  ].map(
    (kind) =>
      [
        `Temporal.${kind}`,
        new Set(
          Object.keys(BUILT_INS).flatMap((name) =>
            name.startsWith(`get Temporal.${kind}.prototype.`)
              ? [name.slice(`get Temporal.${kind}.prototype.`.length)]
              : [],
          ),
        ),
      ] as const,
  ),
  [
    "%Int8Array.[[Prototype]]%",
    new Set(["buffer", "byteLength", "byteOffset", "length", "@@toStringTag"]),
  ],
]);

// The constructors whose @@species getter gives its receiver.
const SPECIES_OWNERS = new Set([
  "%Int8Array.[[Prototype]]%",
  "Array",
  "RegExp",
  "Map",
  "Set",
  "Promise",
  "ArrayBuffer",
  "SharedArrayBuffer",
]);

// %TypedArray%, which only Object.getPrototypeOf of a typed array's constructor names.
const isTypedArrayIntrinsic = (node: ts.Expression, context: Context) =>
  ts.isCallExpression(node) &&
  node.expression.getText() === "Object.getPrototypeOf" &&
  node.arguments.length === 1 &&
  TYPED_ARRAYS.has(getBuiltIn(node.arguments[0], context) ?? "");

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
  const prototype = owner === undefined ? undefined : getOrigin(owner, context);
  const constructor =
    prototype !== undefined &&
    ts.isPropertyAccessExpression(prototype) &&
    prototype.name.text === "prototype"
      ? getOrigin(prototype.expression, context)
      : undefined;
  const isTypedArray = constructor !== undefined && isTypedArrayIntrinsic(constructor, context);
  const builtIn = isTypedArray
    ? "%Int8Array.[[Prototype]]%"
    : constructor !== undefined &&
        ts.isPropertyAccessExpression(constructor) &&
        ["Intl", "Temporal"].includes(getBuiltIn(constructor.expression, context) ?? "")
      ? `${getBuiltIn(constructor.expression, context)}.${constructor.name.text}`
      : constructor === undefined
        ? undefined
        : getBuiltIn(constructor, context);
  const keyName =
    key !== undefined && ts.isStringLiteral(key)
      ? key.text
      : key !== undefined &&
          ts.isPropertyAccessExpression(key) &&
          key.name.text === "toStringTag" &&
          getBuiltIn(key.expression, context) === "Symbol"
        ? "@@toStringTag"
        : undefined;
  const prototypePath = isTypedArray
    ? "%Int8Array.prototype.[[Prototype]]%"
    : `${builtIn}.prototype`;
  const speciesOwner =
    prototype !== undefined &&
    key !== undefined &&
    ts.isPropertyAccessExpression(key) &&
    key.name.text === "species" &&
    getBuiltIn(key.expression, context) === "Symbol"
      ? isTypedArrayIntrinsic(prototype, context)
        ? "%Int8Array.[[Prototype]]%"
        : getBuiltIn(prototype, context)
      : undefined;
  const path =
    keyName !== undefined && GETTERS.get(builtIn ?? "")?.has(keyName)
      ? (`get ${prototypePath}.${keyName}` as const)
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

// A call of a method of an Intl constructor's prototype, through call or on a receiver, which
// throws the TypeError of a receiver that isn't the kind of object the method reads.
// Symbol.prototype.valueOf through call on a value that may be neither a symbol nor a Symbol object,
// which throws a TypeError: the value that it reads.
export const getThisSymbolCall = (node: ts.Node, context: Context) => {
  const argument = ts.isCallExpression(node) ? node.arguments.at(0) : undefined;
  return context.heap !== undefined &&
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "call" &&
    node.arguments.length === 1 &&
    argument !== undefined &&
    !ts.isSpreadElement(argument) &&
    !isEvery(context.checker.getTypeAtLocation(argument), ts.TypeFlags.ESSymbolLike) &&
    getPrototypeMethod(node.expression.expression, "Symbol", context) === "valueOf"
    ? argument
    : undefined;
};

// A call of resolvedOptions on a value that TypeScript types as one of Intl's objects, with the kind
// of object that it reads.
export const getResolvedOptionsCall = (node: ts.Node, context: Context) => {
  if (context.heap === undefined || !isMethodCall(node)) return undefined;
  const receiver = node.expression.expression;
  const symbol = context.checker.getTypeAtLocation(receiver).getSymbol();
  const declarations = symbol?.declarations ?? [];
  return node.expression.name.text === "resolvedOptions" &&
    node.arguments.length === 0 &&
    symbol !== undefined &&
    declarations.length > 0 &&
    declarations.every(
      (declaration) =>
        declaration.getSourceFile().isDeclarationFile &&
        ts.findAncestor(declaration, ts.isModuleDeclaration)?.name.getText() === "Intl",
    ) &&
    BUILT_INS[`Intl.${symbol.name}.prototype.resolvedOptions`] !== undefined
    ? { kind: symbol.name, receiver }
    : undefined;
};

export const getIntlMethodCall = (node: ts.Node, context: Context) => {
  if (context.heap === undefined || !ts.isCallExpression(node)) return undefined;
  const callee = skipCasts(node.expression);
  const isCall = ts.isPropertyAccessExpression(callee) && callee.name.text === "call";
  const method = isCall ? callee.expression : callee;
  const origin = getOrigin(method, context);
  const owner = ts.isPropertyAccessExpression(origin) ? skipCasts(origin.expression) : undefined;
  const constructor =
    owner !== undefined && ts.isPropertyAccessExpression(owner) && owner.name.text === "prototype"
      ? owner.expression
      : undefined;
  const kind =
    constructor !== undefined &&
    ts.isPropertyAccessExpression(constructor) &&
    getBuiltIn(constructor.expression, context) === "Intl"
      ? constructor.name.text
      : undefined;
  const name = ts.isPropertyAccessExpression(origin) ? origin.name.text : "";
  const path = `Intl.${kind}.prototype.${name}` as const;
  return kind !== undefined &&
    BUILT_INS[path] !== undefined &&
    !node.arguments.some(ts.isSpreadElement) &&
    node.arguments.slice(isCall ? 1 : 0).every(isInertValue)
    ? {
        kind,
        path,
        method,
        isCall,
        receiver: isCall
          ? node.arguments.at(0)
          : ts.isPropertyAccessExpression(method)
            ? method.expression
            : undefined,
        unwraps:
          (kind === "NumberFormat" || kind === "DateTimeFormat") && name === "resolvedOptions",
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
export const getOrigin = (node: ts.Expression, context: Context): ts.Expression => {
  const inner = skipCasts(node);
  const declaration = ts.isIdentifier(inner)
    ? getValueDeclaration(getSymbol(inner, context.checker), context)
    : undefined;
  return declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer !== undefined
    ? getOrigin(declaration.initializer, context)
    : inner;
};

// A read of the proxy or the revoke function that Proxy.revocable gives, as TypeScript declares it.
const isRevocableMember = (node: ts.Expression, name: string, context: Context) => {
  if (!ts.isPropertyAccessExpression(node) || node.name.text !== name) return false;
  const method = getSymbol(node, context.checker)?.declarations?.at(0)?.parent?.parent;
  return (
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
// The objects that the defaults of an assignment's pattern make, which run only where their part
// is undefined. A default's function or class is made anyway, as making one can't stop the run.
const getDefaultAllocated = (node: ts.Expression, context: Context) => {
  const given = getGivenValue(node);
  return isFunctionObject(given, context)
    ? [...getAllocated(node, context, true), given]
    : getAllocated(node, context, true);
};

export const getPatternAllocated = (node: ts.Expression, context: Context): ts.Node[] => {
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.flatMap((property) =>
      ts.isShorthandPropertyAssignment(property)
        ? property.objectAssignmentInitializer === undefined
          ? []
          : getDefaultAllocated(property.objectAssignmentInitializer, context)
        : ts.isPropertyAssignment(property)
          ? getPatternAllocated(property.initializer, context)
          : ts.isSpreadAssignment(property)
            ? getPatternAllocated(property.expression, context)
            : [],
    );
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.flatMap((element) =>
      getPatternAllocated(ts.isSpreadElement(element) ? element.expression : element, context),
    );
  }
  return ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ? [...getPatternAllocated(node.left, context), ...getDefaultAllocated(node.right, context)]
    : [];
};

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
    return isPattern
      ? [
          ...getAllocated(node.right, context, isSometimes),
          ...getPatternAllocated(node.left, context),
        ]
      : [
          ...getAllocated(node.left, context, isSometimes),
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
    ((getRunConstructor(created, context) === undefined &&
      getSettableSupers(created, context).length === 0) ||
      isStatementNew(node));
  // The objects that the fields of a new's instance make, before the instance that holds them.
  const fields =
    created !== undefined && isNewInstance
      ? getChain(created, context).flatMap((current) =>
          ts.isClassLike(current)
            ? getRunMembers(current).flatMap((member) =>
                ts.isPropertyDeclaration(member) &&
                !isStatic(member) &&
                member.initializer !== undefined &&
                !getRunFields(current, context).includes(member) &&
                !getFieldsAfterSuper(current, context).includes(member)
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
    isNestedFunction(node, context) ||
    isClosure(node, context)
  ) {
    return !isSometimes;
  }
  if (ts.isFunctionLike(node)) return false;
  if (ts.isClassLike(node)) return isHeapClass(node, context) && !isSometimes;
  if (ts.isEnumDeclaration(node)) return isHeapEnum(node, context);
  if (ts.isOptionalChain(node) || ts.isConditionalExpression(node) || ts.isBinaryExpression(node)) {
    return false;
  }
  const created = getNewClass(node, context);
  const isNewInstance =
    !isSometimes &&
    created !== undefined &&
    ts.isExpression(node) &&
    ((getRunConstructor(created, context) === undefined &&
      getSettableSupers(created, context).length === 0) ||
      isStatementNew(node));
  return (
    (ts.isObjectLiteralExpression(node) &&
      isObjectValue(node, context) &&
      !isProxyOperation(node, context) &&
      !isArrayFromLength(node, context)) ||
    // map makes its array as it runs, after it visits each element.
    ((ts.isArrayLiteralExpression(node) ||
      isHoleyNewArray(node, context) ||
      (ts.isCallExpression(node) && getMapCall(node, context) === undefined) ||
      ts.isNewExpression(node)) &&
      context.heapCollections.has(node)) ||
    ts.isRegularExpressionLiteral(node) ||
    getMadeRegExp(node, context) !== undefined ||
    isNewObject(node, context) ||
    isNewDate(node, context) ||
    getNewIntl(node, context) !== undefined ||
    isNewProxy(node, context) ||
    getNewBuffer(node, context) !== undefined ||
    getNewWrapper(node, context) !== undefined ||
    getWrappedThis(node, context) !== undefined ||
    isHeldError(node, context) ||
    isParsedObject(node, context) ||
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
  // A value that any or unknown types reads as whatever it holds.
  if (
    isAnyPlace(node, context) ||
    (context.checker.getTypeAtLocation(node).flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
      0
  ) {
    return true;
  }
  if (
    ts.isParenthesizedExpression(parent) ||
    ts.isAsExpression(parent) ||
    ts.isNonNullExpression(parent) ||
    ts.isSatisfiesExpression(parent)
  ) {
    return isArrayObjectUse(parent, context);
  }
  if (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) {
    // sort, reverse, fill, and copyWithin give the array, which the place that takes it reads, or
    // a constant names, whose reads are the array's.
    const call = parent.parent;
    return (
      parent.expression === node &&
      (!ts.isPropertyAccessExpression(parent) ||
        !REORDER_METHODS.has(parent.name.text) ||
        !ts.isCallExpression(call) ||
        call.expression !== parent ||
        ts.isExpressionStatement(call.parent) ||
        (ts.isVariableDeclaration(call.parent) &&
          ts.isIdentifier(call.parent.name) &&
          getReorderedArray(call.parent.name, context) !== undefined) ||
        isArrayObjectUse(call, context))
    );
  }
  if (ts.isTypeOfExpression(parent)) return true;
  // A for-of or a spread runs the array's iterator, which reads its elements as an object's, and a
  // for-in reads its keys.
  if ((ts.isForOfStatement(parent) || ts.isForInStatement(parent)) && parent.expression === node) {
    return true;
  }
  if (ts.isSpreadElement(parent)) return true;
  // A proxy reads its target as an object.
  if (
    (ts.isNewExpression(parent) || ts.isCallExpression(parent)) &&
    (isNewProxy(parent, context) || isRevocable(parent, context))
  ) {
    return parent.arguments?.[0] === node;
  }
  // Iterator.from runs the array's iterator too.
  if (getIteratedArray(parent, context) === node) return true;
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
  // A place whose type isn't a sequence reads the array as an object, such as a descriptor that
  // Object.create takes from an object literal.
  const parameter = context.checker.getContextualType(node);
  const isObjectPlace =
    parameter !== undefined &&
    (parameter.flags & ts.TypeFlags.Any) === 0 &&
    !isSequenceType(context.checker.getNonNullableType(parameter), context.checker);
  if (ts.isPropertyAssignment(parent)) return parent.initializer === node && isObjectPlace;
  if (!ts.isCallExpression(parent) || !parent.arguments.some((argument) => argument === node)) {
    return false;
  }
  // An array method's callback reads its this argument through this, which a callback that types
  // this as an object reads as one.
  if (
    parent.arguments[1] === node &&
    ts.isPropertyAccessExpression(parent.expression) &&
    THIS_ARGUMENT_METHODS.has(parent.expression.name.text) &&
    getKind(parent.expression.expression, context) === "sequence"
  ) {
    const callback = getCallee(parent.arguments[0], context);
    const thisType = callback?.parameters.find(
      (parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === "this",
    )?.type;
    return (
      thisType !== undefined &&
      !isSequenceType(context.checker.getTypeFromTypeNode(thisType), context.checker)
    );
  }
  const callee = parent.expression.getText();
  return (
    /^(Object|Reflect)\.\w+$/.test(callee) ||
    callee === "Array.isArray" ||
    /^Array\.prototype\.\w+\.call$/.test(callee) ||
    isObjectPlace
  );
};

// The traps that take the proxy as their receiver, by the position of the parameter.
const PROXY_RECEIVERS = new Map([
  ["get", 2],
  ["set", 3],
]);

// The functions of Object and Reflect that read an object's keys or values into a new array.
const FRESH_ARRAY_READS = new Set([
  "Object.keys",
  "Object.values",
  "Object.entries",
  "Object.getOwnPropertyNames",
  "Object.getOwnPropertySymbols",
  "Reflect.ownKeys",
]);

// The calls that read a proxy of a collection only as an object, through its internal methods.
const isProxyObjectCall = (callee: string) =>
  /^(Object|Reflect)\.\w+$/.test(callee) ||
  /^(Array|Object)\.prototype\.\w+\.call$/.test(callee) ||
  ["Array.isArray", "JSON.stringify"].includes(callee);

// The proxies of arrays, sets, and maps that a script makes, and the variables, parameters, calls,
// and reads of Proxy.revocable's proxy that hold them. A proxy is an object that the heap holds, so
// tla-ts reads these as objects, whose reads run the proxy's internal methods, where it would read
// an array as a sequence, or a set or a map by its type. So each place that a proxy reaches must
// read it only as an object: a read or a write of a key, a comparison, a function of Object,
// Reflect, or JSON, a proxy that targets it, or a variable or a script function's parameter whose
// reads do so in turn, and that no cast or narrowing reads as a collection.
export const findCollectionProxies = (roots: readonly ts.Node[], context: Context) => {
  const checker = context.checker;
  const made: (ts.NewExpression | ts.CallExpression)[] = [];
  const find = (node: ts.Node) => {
    if (
      (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
      (isNewProxy(node, context) || isRevocable(node, context)) &&
      node.arguments !== undefined &&
      mayBeCollection(node.arguments[0])
    ) {
      made.push(node);
    }
    ts.forEachChild(node, find);
  };
  const references = new Map<ts.Symbol, ts.Identifier[]>();
  const collect = (node: ts.Node) => {
    const symbol = ts.isIdentifier(node) ? getSymbol(node, checker) : undefined;
    if (ts.isIdentifier(node) && symbol !== undefined) {
      const found = references.get(symbol);
      if (found === undefined) references.set(symbol, [node]);
      else found.push(node);
    }
    ts.forEachChild(node, collect);
  };
  const mayBeCollection = (node: ts.Node) => {
    const type = checker.getNonNullableType(checker.getTypeAtLocation(node));
    return mayBeSequenceType(type, checker) || mayBeSetOrMapType(type);
  };
  const isAny = (node: ts.Node) => (checker.getTypeAtLocation(node).flags & ts.TypeFlags.Any) !== 0;
  const stop = (node: ts.Node): never => {
    throw new TlaTypeScriptError(
      "tla-ts can't make a proxy of an array, a set, or a map that the script may read as one",
      node,
    );
  };
  const usesArguments = (declaration: ts.Node) =>
    findNodes(declaration, ts.isIdentifier).some((name) => name.text === "arguments");
  const proxies = new Set<ts.Node>();
  const visited = new Set<ts.Symbol>();
  // Each read of a variable or a parameter that holds a proxy, where a variable whose type may be
  // an array holds it as an object.
  const hold = (name: ts.Identifier) => {
    const symbol = getSymbol(name, checker);
    if (symbol === undefined) return stop(name);
    if (visited.has(symbol)) return;
    visited.add(symbol);
    (references.get(symbol) ?? [])
      .filter((reference) => reference !== name)
      .forEach((reference) =>
        !proxies.has(name.parent) && mayBeCollection(reference)
          ? stop(reference)
          : visit(reference),
      );
  };
  const visit = (node: ts.Expression): void => {
    const parent = node.parent;
    if (
      ts.isParenthesizedExpression(parent) ||
      ts.isNonNullExpression(parent) ||
      ts.isSatisfiesExpression(parent)
    ) {
      return visit(parent);
    }
    if (ts.isAsExpression(parent) || ts.isTypeAssertionExpression(parent)) {
      return mayBeCollection(parent) || isAny(parent) ? stop(parent) : visit(parent);
    }
    if (
      (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
      parent.expression === node
    ) {
      const user = parent.parent;
      // A collection's method would run where a method call reads a value whose type is one.
      return (ts.isCallExpression(user) || ts.isNewExpression(user)) &&
        user.expression === parent &&
        mayBeCollection(node)
        ? stop(parent)
        : undefined;
    }
    if (
      ts.isExpressionStatement(parent) ||
      ts.isTypeOfExpression(parent) ||
      ts.isVoidExpression(parent) ||
      (ts.isPrefixUnaryExpression(parent) && parent.operator === ts.SyntaxKind.ExclamationToken) ||
      ((ts.isIfStatement(parent) || ts.isWhileStatement(parent) || ts.isDoStatement(parent)) &&
        parent.expression === node) ||
      (ts.isConditionalExpression(parent) && parent.condition === node)
    ) {
      return;
    }
    if (ts.isBinaryExpression(parent)) {
      const kind = parent.operatorToken.kind;
      return [
        ts.SyntaxKind.EqualsEqualsEqualsToken,
        ts.SyntaxKind.ExclamationEqualsEqualsToken,
        ts.SyntaxKind.EqualsEqualsToken,
        ts.SyntaxKind.ExclamationEqualsToken,
      ].includes(kind) ||
        (kind === ts.SyntaxKind.InKeyword && parent.right === node) ||
        (kind === ts.SyntaxKind.InstanceOfKeyword && parent.left === node)
        ? undefined
        : stop(parent);
    }
    if (ts.isVariableDeclaration(parent) && parent.initializer === node) {
      if (!ts.isIdentifier(parent.name) || isAny(parent.name)) return stop(parent);
      if (mayBeCollection(parent.name)) proxies.add(parent);
      return hold(parent.name);
    }
    if (
      (ts.isCallExpression(parent) || ts.isNewExpression(parent)) &&
      parent.arguments?.includes(node) === true
    ) {
      const position = parent.arguments.indexOf(node);
      if ((isNewProxy(parent, context) || isRevocable(parent, context)) && position === 0) return;
      const callee = parent.expression.getText();
      if (ts.isCallExpression(parent) && isProxyObjectCall(callee)) {
        // A call that may give the proxy back, as Object.freeze does, gives a value that holds it,
        // unlike the keys or the values that a call reads into a new array.
        if (mayBeCollection(parent) && !FRESH_ARRAY_READS.has(callee)) {
          proxies.add(parent);
          visit(parent);
        }
        return;
      }
      // A script function's parameter that holds no array, where the function reads it only as an
      // object, and not through arguments.
      const declaration = checker.getResolvedSignature(parent)?.getDeclaration();
      const called = getValueDeclaration(getSymbol(parent.expression, checker), context);
      const parameter =
        declaration !== undefined &&
        ts.isFunctionLike(declaration) &&
        !declaration.getSourceFile().isDeclarationFile &&
        (called === declaration ||
          (called !== undefined &&
            ts.isVariableDeclaration(called) &&
            (called.parent.flags & ts.NodeFlags.Const) !== 0 &&
            called.initializer === declaration)) &&
        !usesArguments(declaration)
          ? declaration.parameters.at(position)
          : undefined;
      return parameter === undefined ||
        parameter.dotDotDotToken !== undefined ||
        !ts.isIdentifier(parameter.name) ||
        isAny(parameter.name) ||
        mayBeCollection(parameter.name)
        ? stop(parent)
        : hold(parameter.name);
    }
    stop(parent);
  };
  // A handler's traps take the proxy's target, which may be an array, and get and set take the
  // proxy too, so the parameters that take them hold proxies. The handler must be an object literal
  // whose traps tla-ts can tell.
  const holdTraps = (handler: ts.Expression) => {
    if (!ts.isObjectLiteralExpression(handler)) return stop(handler);
    handler.properties.forEach((property) => {
      const name =
        property.name !== undefined &&
        (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
          ? property.name.text
          : undefined;
      const value = ts.isPropertyAssignment(property) ? property.initializer : undefined;
      const trap =
        ts.isMethodDeclaration(property) ||
        (value !== undefined && (ts.isFunctionExpression(value) || ts.isArrowFunction(value)))
          ? (value ?? property)
          : undefined;
      // A trap that isn't a function, such as undefined, runs nothing of the script's.
      const isInert =
        value !== undefined &&
        (ts.isLiteralExpression(value) ||
          value.kind === ts.SyntaxKind.NullKeyword ||
          value.kind === ts.SyntaxKind.TrueKeyword ||
          value.kind === ts.SyntaxKind.FalseKeyword ||
          (ts.isIdentifier(value) && value.text === "undefined"));
      if (name === undefined || (trap === undefined && !isInert)) return stop(property);
      if (trap === undefined || !ts.isFunctionLike(trap)) return;
      if (usesArguments(trap)) return stop(trap);
      [0, PROXY_RECEIVERS.get(name)].forEach((position) => {
        const parameter = position === undefined ? undefined : trap.parameters.at(position);
        if (parameter === undefined) return;
        if (parameter.dotDotDotToken !== undefined || !ts.isIdentifier(parameter.name)) {
          return stop(parameter);
        }
        if (mayBeCollection(parameter.name) || isAny(parameter.name)) proxies.add(parameter);
        hold(parameter.name);
      });
    });
  };
  if (context.heap !== undefined) roots.forEach(find);
  if (made.length > 0) roots.forEach(collect);
  made.forEach((proxy) => {
    const handler = proxy.arguments?.[1];
    if (handler === undefined) return stop(proxy);
    holdTraps(handler);
    if (!isRevocable(proxy, context)) {
      proxies.add(proxy);
      return visit(proxy);
    }
    // Proxy.revocable gives the proxy and the function that revokes it.
    const handle = proxy.parent;
    const symbol =
      ts.isVariableDeclaration(handle) && ts.isIdentifier(handle.name)
        ? getSymbol(handle.name, checker)
        : undefined;
    const reads =
      symbol === undefined
        ? [handle]
        : (references.get(symbol) ?? [])
            .filter((reference) => reference.parent !== handle)
            .map((reference) => reference.parent);
    reads.forEach((read) => {
      if (!ts.isPropertyAccessExpression(read)) return stop(read);
      if (read.name.text === "proxy") {
        proxies.add(read);
        return visit(read);
      }
      if (read.name.text !== "revoke") stop(read);
    });
  });
  return proxies;
};

// The Object functions that read an object's keys or prototype but none of its values.
const KEY_READS = new Set([
  "Object.keys",
  "Object.getOwnPropertyNames",
  "Object.getPrototypeOf",
  "Object.hasOwn",
  "Object.isExtensible",
  "Object.isFrozen",
  "Object.isSealed",
  "Array.isArray",
]);

// The indices of a match hold pairs that the heap holds as arrays, which TypeScript types as any
// pair of numbers. A pair reaches only the places that read it as an object, and the indices and
// their groups only places that keep their type or read no pair, so that no sequence holds a pair.
export const rejectRegExpIndicesUses = (roots: readonly ts.Node[], context: Context) => {
  const isKept = (node: ts.Node, part: string) =>
    ts.isExpression(node) && getRegExpIndicesPart(node, context) === part;
  const isUsed = (node: ts.Expression, part: "indices" | "groups" | "pair"): boolean => {
    const parent = node.parent;
    if (ts.isParenthesizedExpression(parent) || ts.isNonNullExpression(parent)) {
      return isUsed(parent, part);
    }
    if (ts.isExpressionStatement(parent) || ts.isTypeOfExpression(parent)) return true;
    if (ts.isVariableDeclaration(parent)) {
      const name = parent.name;
      // A pattern takes the groups of the indices, or their length.
      const isPatternKept =
        part === "indices" &&
        ts.isObjectBindingPattern(name) &&
        name.elements.every(
          (element) =>
            element.dotDotDotToken === undefined &&
            ts.isIdentifier(element.name) &&
            (isKept(element.name, "groups") || isNumberLike(element.name, context)),
        );
      return part === "pair"
        ? ts.isArrayBindingPattern(name) || isKept(name, part)
        : isPatternKept || (ts.isIdentifier(name) && isKept(name, part));
    }
    if (
      ts.isBinaryExpression(parent) &&
      parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      parent.right === node
    ) {
      return part !== "pair" && isKept(parent.left, part);
    }
    if (part === "pair") return isArrayObjectUse(node, context);
    if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
      return part === "groups" || ["length", "groups"].includes(parent.name.text);
    }
    if (ts.isElementAccessExpression(parent) && parent.expression === node) {
      return part === "groups" || isNumberLike(parent.argumentExpression, context);
    }
    if (ts.isBinaryExpression(parent)) {
      return (
        [
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsEqualsToken,
          ts.SyntaxKind.EqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsToken,
        ].includes(parent.operatorToken.kind) ||
        (parent.operatorToken.kind === ts.SyntaxKind.InKeyword && parent.right === node)
      );
    }
    if (!ts.isCallExpression(parent) || !parent.arguments.some((argument) => argument === node)) {
      return false;
    }
    // A function of the script that takes an object reads no pair as a sequence.
    const callee = parent.expression.getText();
    const parameter = context.checker.getContextualType(node);
    return (
      KEY_READS.has(callee) ||
      (!/^(Object|Reflect|Array)\./.test(callee) &&
        parameter !== undefined &&
        (parameter.flags & ts.TypeFlags.Any) === 0 &&
        !isSequenceType(context.checker.getNonNullableType(parameter), context.checker))
    );
  };
  const visit = (node: ts.Node) => {
    const parent = node.parent;
    const isName =
      ts.isIdentifier(node) &&
      ((ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        ((ts.isVariableDeclaration(parent) ||
          ts.isBindingElement(parent) ||
          ts.isParameter(parent) ||
          ts.isPropertyAssignment(parent)) &&
          parent.name === node) ||
        (ts.isBinaryExpression(parent) &&
          parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          parent.left === node));
    const expression =
      (ts.isIdentifier(node) ||
        ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node) ||
        ts.isCallExpression(node) ||
        ts.isParenthesizedExpression(node) ||
        ts.isNonNullExpression(node)) &&
      !isName &&
      !ts.isParenthesizedExpression(parent) &&
      !ts.isNonNullExpression(parent)
        ? node
        : undefined;
    const part = expression === undefined ? undefined : getRegExpIndicesPart(expression, context);
    if (
      expression !== undefined &&
      part !== undefined &&
      (context.heap === undefined || !isUsed(expression, part))
    ) {
      throw new TlaTypeScriptError(
        context.heap === undefined
          ? "tla-ts can't read the indices of a match in a script without objects"
          : "tla-ts can't read the indices of a match here, where a sequence may hold a pair of them",
        expression,
      );
    }
    ts.forEachChild(node, visit);
  };
  roots.forEach(visit);
};

// The array literals that a script passes to the Object functions that treat arrays as objects.
// Each use of a variable that holds one must read it as an object.
// An array literal with holes, which a sequence can't hold, where a variable that only reads it as
// an object holds it, or a method reads it.
// An array that a script makes the prototype of a function's instances, which they share.
export const isPrototypeArray = (node: ts.Node, context: Context) =>
  ((ts.isArrayLiteralExpression(node) && !node.elements.some(ts.isSpreadElement)) ||
    isNewArrayOfElements(node, context)) &&
  ts.isBinaryExpression(node.parent) &&
  node.parent.right === node &&
  node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
  ts.isPropertyAccessExpression(node.parent.left) &&
  node.parent.left.name.text === "prototype";

// Whether a script makes an array a prototype, whose methods an object may then inherit.
export const hasPrototypeArray = (context: Context) =>
  [...context.heapCollections].some((inner) => isPrototypeArray(inner, context));

// An array that a throw makes, which keeps its identity, as an object does, so that what catches it
// sees the same array.
export const isThrownArray = (node: ts.Node) =>
  ts.isArrayLiteralExpression(node) &&
  ts.isThrowStatement(node.parent) &&
  !node.elements.some(ts.isSpreadElement);

export const isHoleyArray = (node: ts.Node, context: Context) => {
  const isHeld =
    node.parent !== undefined &&
    ts.isVariableDeclaration(node.parent) &&
    node.parent.initializer === node &&
    ts.isIdentifier(node.parent.name);
  // new Array(length) that a method reads at once, as in new Array(2).fill(0), stays a sequence.
  return (
    (isHoleyNewArray(node, context) && isHeld) ||
    (ts.isArrayLiteralExpression(node) &&
      node.elements.some(ts.isOmittedExpression) &&
      !node.elements.some(ts.isSpreadElement) &&
      (isHeld || (ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node)))
  );
};

const isAssignmentTarget = (node: ts.Node) =>
  ts.isBinaryExpression(node.parent) &&
  node.parent.left === node &&
  node.parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
  node.parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment;

// A use of an array that changes it in place: a method that changes it, or a write to its length
// or an element.
const isArrayChange = (use: ts.Expression): boolean => {
  const parent = use.parent;
  // A non-null assertion or parentheses give the same array.
  if (ts.isNonNullExpression(parent) || ts.isParenthesizedExpression(parent)) {
    return isArrayChange(parent);
  }
  return (
    (ts.isPropertyAccessExpression(parent) &&
      (IN_PLACE_METHODS.has(parent.name.text) || parent.name.text === "splice") &&
      ts.isCallExpression(parent.parent) &&
      parent.parent.expression === parent) ||
    (ts.isPropertyAccessExpression(parent) &&
      parent.name.text === "length" &&
      isAssignmentTarget(parent)) ||
    (ts.isElementAccessExpression(parent) &&
      parent.expression === use &&
      isAssignmentTarget(parent))
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

const IDENTITY_OPERATORS = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
]);

// Whether an expression is a key of a set's or a map's method, which finds it by identity.
const isKey = (use: ts.Expression, context: Context) => {
  const parent = use.parent;
  return (
    ts.isCallExpression(parent) &&
    parent.arguments[0] === use &&
    ts.isPropertyAccessExpression(parent.expression) &&
    ["set", "get", "has", "add", "delete"].includes(parent.expression.name.text) &&
    ["set", "map"].includes(getKind(parent.expression.expression, context))
  );
};

// Whether === or Object.is compares an expression.
const isComparedByIdentity = (use: ts.Expression) => {
  const parent = use.parent;
  return ts.isBinaryExpression(parent)
    ? IDENTITY_OPERATORS.has(parent.operatorToken.kind)
    : ts.isCallExpression(parent) &&
        parent.arguments.includes(use) &&
        parent.expression.getText() === "Object.is";
};

// Whether the function that a call runs compares its argument at a position by identity.
const isComparedArgument = (call: ts.CallExpression, position: number, context: Context) => {
  const declaration = context.checker.getResolvedSignature(call)?.getDeclaration();
  const name =
    declaration !== undefined && ts.isFunctionLike(declaration)
      ? declaration.parameters.at(position)?.name
      : undefined;
  const parameter =
    name !== undefined && ts.isIdentifier(name) ? getSymbol(name, context.checker) : undefined;
  return (
    declaration !== undefined &&
    parameter !== undefined &&
    findNodes(declaration, ts.isIdentifier).some(
      (reference) =>
        reference !== name &&
        getSymbol(reference, context.checker) === parameter &&
        (isComparedByIdentity(reference) || isKey(reference, context)),
    )
  );
};

// A new collection that the heap may hold: an array literal, or a new set or map.
const isFreshCollection = (node: ts.Node | undefined, context: Context) =>
  node !== undefined &&
  (ts.isArrayLiteralExpression(node) ||
    (ts.isNewExpression(node) && isCollectionName(getBuiltIn(node.expression, context) ?? "")) ||
    isNewSubclassCollection(node, context));

// A new of a class that extends a collection, whose instance the heap always holds, as the class's
// prototype tells it apart from the collection's.
export const isNewSubclassCollection = (node: ts.Node, context: Context) => {
  const callee = getConstruction(node, context)?.callee;
  return (
    ts.isNewExpression(node) &&
    callee !== undefined &&
    callee !== node.expression &&
    isCollectionName(getBuiltIn(callee, context) ?? "")
  );
};

// The built-in methods that tell what a value whose type doesn't tell is as they run.
const KIND_READS = new Set([
  "Array.isArray",
  "Object.getPrototypeOf",
  "Object.keys",
  "Object.values",
  "Object.entries",
  "Object.getOwnPropertyNames",
]);

// The built-in methods that give the array they change rather than a new one.
const SELF_RETURNING_METHODS = new Set(["sort", "reverse", "fill", "copyWithin"]);

// The built-in methods that give a new array, rather than one that something holds, as get or find
// gives.
const FRESH_ARRAY_METHODS = new Set([
  ...SELF_RETURNING_METHODS,
  "from",
  "of",
  "slice",
  "splice",
  "concat",
  "map",
  "filter",
  "flat",
  "flatMap",
  "toSorted",
  "toReversed",
  "toSpliced",
  "with",
  "keys",
  "values",
  "entries",
  "getOwnPropertyNames",
  "getOwnPropertySymbols",
  "ownKeys",
  "split",
  "match",
  "exec",
]);

// A built-in call that makes a new array, such as Array.from(...) or a map, whose sequence the
// heap can hold. A method that gives the array it changes gives a new one where that array is new.
const isFreshArrayCall = (node: ts.CallExpression, context: Context): boolean => {
  const declaration = getValueDeclaration(getSymbol(node.expression, context.checker), context);
  const method = ts.isPropertyAccessExpression(node.expression) ? node.expression : undefined;
  const receiver = method && skipCasts(method.expression);
  return (
    declaration !== undefined &&
    declaration.getSourceFile().isDeclarationFile &&
    getKind(node, context) === "sequence" &&
    (method === undefined || FRESH_ARRAY_METHODS.has(method.name.text)) &&
    (method === undefined ||
      receiver === undefined ||
      !SELF_RETURNING_METHODS.has(method.name.text) ||
      ts.isArrayLiteralExpression(receiver) ||
      (ts.isCallExpression(receiver) && isFreshArrayCall(receiver, context)))
  );
};

// The methods that change a set or a map in place, and those that only read one.
const SET_OR_MAP_CHANGES = new Set(["add", "set", "delete", "clear"]);
const SET_OR_MAP_READS = new Set(["has", "get", "forEach", "keys", "values", "entries"]);

// The methods of a set or a map that find what it holds by a key.
const KEY_METHODS = new Set([
  "add",
  "has",
  "delete",
  "set",
  "get",
  "getOrInsert",
  "getOrInsertComputed",
]);

// The array methods that look for an element by identity.
const ELEMENT_SEARCH_METHODS = new Set(["includes", "indexOf", "lastIndexOf"]);

// The array methods that call their callback with their second argument as this.
const THIS_ARGUMENT_METHODS = new Set([
  "every",
  "filter",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "flatMap",
  "forEach",
  "map",
  "some",
]);

// The array methods whose callback takes each element, and whose result holds none of them.
const ELEMENT_CALLBACK_METHODS = new Set([
  "some",
  "every",
  "forEach",
  "findIndex",
  "findLastIndex",
]);

const CONSTANT_KEYS = new Map([
  ["NaN", NaN],
  ["Infinity", Infinity],
  ["Number.NaN", NaN],
  ["Number.POSITIVE_INFINITY", Infinity],
  ["Number.NEGATIVE_INFINITY", -Infinity],
]);

// The number that an element access's key always is, such as 3, "3", -1, or NaN.
const getConstantKey = (node: ts.Expression): number | undefined => {
  const key = skipCasts(node);
  if (ts.isNumericLiteral(key)) return Number(key.text);
  if (
    ts.isPrefixUnaryExpression(key) &&
    key.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(key.operand)
  ) {
    return -Number(key.operand.text);
  }
  if (ts.isStringLiteral(key))
    return String(Number(key.text)) === key.text ? Number(key.text) : undefined;
  return CONSTANT_KEYS.get(key.getText());
};

// The length of the array that an expression makes, where it's new: a literal, or new Array of no
// elements or several.
const getFreshLength = (node: ts.Expression | undefined, context: Context) => {
  const array = node === undefined ? undefined : skipCasts(node);
  if (array === undefined) return undefined;
  if (ts.isArrayLiteralExpression(array) && !array.elements.some(ts.isSpreadElement)) {
    return array.elements.length;
  }
  return isNewArrayOfElements(array, context) ? (array.arguments ?? []).length : undefined;
};

// Whether a key is below the length of the array that a name holds, or at it: its length, less a
// number, the counter of a for loop that stays below its length, or the index that a callback of
// one of its methods takes.
const isWithinLength = (key: ts.Expression, array: ts.Identifier, checker: ts.TypeChecker) => {
  const symbol = getSymbol(array, checker);
  const isLength = (node: ts.Expression) => {
    const length = skipCasts(node);
    return (
      ts.isPropertyAccessExpression(length) &&
      length.name.text === "length" &&
      ts.isIdentifier(length.expression) &&
      getSymbol(length.expression, checker) === symbol
    );
  };
  const index = skipCasts(key);
  if (isLength(index)) return true;
  if (
    ts.isBinaryExpression(index) &&
    index.operatorToken.kind === ts.SyntaxKind.MinusToken &&
    isLength(index.left) &&
    ts.isNumericLiteral(index.right)
  ) {
    return true;
  }
  const declaration = ts.isIdentifier(index)
    ? getSymbol(index, checker)?.valueDeclaration
    : undefined;
  if (declaration === undefined) return false;
  const loop = declaration.parent.parent;
  const condition = ts.isForStatement(loop) ? loop.condition : undefined;
  if (
    ts.isVariableDeclaration(declaration) &&
    ts.isForStatement(loop) &&
    loop.initializer === declaration.parent &&
    condition !== undefined &&
    ts.isBinaryExpression(condition) &&
    condition.operatorToken.kind === ts.SyntaxKind.LessThanToken &&
    ts.isIdentifier(condition.left) &&
    getSymbol(condition.left, checker) === getSymbol(index, checker) &&
    isLength(condition.right)
  ) {
    return ts.findAncestor(key, (ancestor) => ancestor === loop.statement) !== undefined;
  }
  // The index that forEach, map, or another method that calls back gives its callback.
  const callback = declaration.parent;
  const call = callback.parent;
  return (
    ts.isParameter(declaration) &&
    (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) &&
    callback.parameters.indexOf(declaration) === 1 &&
    ts.isCallExpression(call) &&
    call.arguments[0] === callback &&
    ts.isPropertyAccessExpression(call.expression) &&
    ts.isIdentifier(call.expression.expression) &&
    getSymbol(call.expression.expression, checker) === symbol
  );
};

// Whether a variable's uses, in the order the script gives them, write an element past the end of
// the array that it holds, or a key that isn't an index, as x = []; x[1] = 1 does, which leaves a
// hole that only the heap holds. A use that may change the length some other way ends what it
// knows.
const writesHole = (uses: readonly ts.Identifier[], context: Context) =>
  uses.reduce<{ length: number | undefined; isHole: boolean }>(
    (state, use) => {
      const parent = use.parent;
      if (state.isHole) return state;
      if (ts.isVariableDeclaration(parent) && parent.name === use) {
        return { ...state, length: getFreshLength(parent.initializer, context) };
      }
      if (
        ts.isBinaryExpression(parent) &&
        parent.left === use &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ) {
        return { ...state, length: getFreshLength(parent.right, context) };
      }
      const isElementWrite =
        ts.isElementAccessExpression(parent) &&
        parent.expression === use &&
        ts.isBinaryExpression(parent.parent) &&
        parent.parent.left === parent &&
        parent.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken;
      const key = isElementWrite ? getConstantKey(parent.argumentExpression) : undefined;
      if (
        isElementWrite &&
        key === undefined &&
        !isWithinLength(parent.argumentExpression, use, context.checker)
      ) {
        return { ...state, isHole: true };
      }
      if (isElementWrite && key !== undefined && state.length !== undefined) {
        const isIndex = Number.isInteger(key) && key >= 0 && key < 2 ** 32 - 1;
        return !isIndex || key > state.length
          ? { ...state, isHole: true }
          : { ...state, length: key === state.length ? state.length + 1 : state.length };
      }
      const isRead =
        ts.isElementAccessExpression(parent) ||
        (ts.isPropertyAccessExpression(parent) && !IN_PLACE_METHODS.has(parent.name.text));
      return isRead && !isElementWrite && !isAssignmentTarget(parent)
        ? state
        : { ...state, length: undefined };
    },
    { length: undefined, isHole: false },
  ).isHole;

// The arrays, sets, and maps that a script changes in place where another name may see them, which
// JavaScript shares, live in the heap, with every variable, parameter, and field that may hold
// one, across the files that the script reaches. Each must start new, each use must read the heap,
// and each object with such a field must go only where the field keeps its name. Where any
// doesn't, the collections stay values.
export const findChangedArrays = (reached: readonly ts.Node[], context: Context) => {
  const checker = context.checker;
  const isAnyOrUnknown = (node: ts.Expression) =>
    (checker.getTypeAtLocation(node).flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0;
  // A read that tells as it runs what a value whose type doesn't tell is: of a property of a value
  // of type any or unknown, as a pattern reads it too, or by in, Array.isArray, getPrototypeOf, or a
  // method of Object that lists its keys.
  const isReadByKind = (node: ts.Expression) => {
    const parent = node.parent;
    return (
      (isAnyOrUnknown(node) &&
        (((ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
          parent.expression === node &&
          !isAssignmentTarget(parent)) ||
          (ts.isVariableDeclaration(parent) &&
            parent.initializer === node &&
            ts.isObjectBindingPattern(parent.name)))) ||
      (isUntold(node, checker) &&
        ((ts.isBinaryExpression(parent) &&
          parent.operatorToken.kind === ts.SyntaxKind.InKeyword &&
          parent.right === node) ||
          (isMethodCall(parent) &&
            parent.arguments[0] === node &&
            (KIND_READS.has(
              `${getBuiltIn(parent.expression.expression, context)}.${parent.expression.name.text}`,
            ) ||
              // Object.prototype.toString tells the kind of what it takes as its this.
              (parent.expression.name.text === "call" &&
                parent.expression.expression.getText() === "Object.prototype.toString")))))
    );
  };
  const isReached = new Set(reached);
  const references = new Map<ts.Symbol, ts.Identifier[]>();
  const accesses: (ts.PropertyAccessExpression | ts.ElementAccessExpression)[] = [];
  const objects: ts.ObjectLiteralExpression[] = [];
  const expressions: ts.Expression[] = [];
  // Collects what a node is, and tells whether the walk goes on into its children.
  const collect = (node: ts.Node, symbol: ts.Symbol | undefined) => {
    if (ts.isIdentifier(node) && symbol !== undefined) {
      const found = references.get(symbol);
      if (found === undefined) references.set(symbol, [node]);
      else found.push(node);
    }
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      accesses.push(node);
    }
    if (ts.isObjectLiteralExpression(node)) objects.push(node);
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return false;
    if (ts.isHeritageClause(node) && ts.isInterfaceDeclaration(node.parent)) return false;
    if (
      ts.isExpression(node) &&
      !(
        ts.isIdentifier(node) &&
        symbol?.declarations?.some((declaration) => ts.getNameOfDeclaration(declaration) === node)
      )
    ) {
      expressions.push(node);
    }
    return !ts.isTypeNode(node);
  };
  const visit = (node: ts.Node) => {
    if (collect(node, ts.isIdentifier(node) ? getSymbol(node, checker) : undefined)) {
      ts.forEachChild(node, visit);
    }
  };
  // A file of the program's files is scanned in its table, past the subtrees the walk skips.
  new Set(reached.map((node) => node.getSourceFile())).forEach((file) => {
    const table = context.nodes;
    const start = getPosition(table, file);
    if (start < 0) {
      visit(file);
      return;
    }
    let position = start;
    while (position < table.ends[start]) {
      const isEntered = collect(table.nodes[position], context.references.symbols[position]);
      position = isEntered ? position + 1 : table.ends[position];
    }
  });
  const getFields = (type: ts.Type, name: string) =>
    (type.isUnion() || type.isIntersection() ? type.types : [type]).flatMap(
      (member) => checker.getPropertyOfType(member, name) ?? [],
    );
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
  // Tables that a group looks the uses of its fields and its names up in, made once, as a program
  // may have many groups and many uses: the items of each declaration, in the order the files hold
  // them.
  const getTable = <Item>(items: readonly Item[], getDeclarations: (item: Item) => ts.Node[]) => {
    const order = new Map(items.map((item, position) => [item, position]));
    const table = new Map<ts.Node, Item[]>();
    items.forEach((item) =>
      new Set(getDeclarations(item)).forEach((declaration) => {
        const found = table.get(declaration);
        if (found === undefined) table.set(declaration, [item]);
        else found.push(item);
      }),
    );
    // The items of any of a symbol's declarations.
    return (symbol: ts.Symbol) =>
      [
        ...new Set(
          (symbol.declarations ?? []).flatMap((declaration) => table.get(declaration) ?? []),
        ),
      ].toSorted((left, right) => (order.get(left) ?? 0) - (order.get(right) ?? 0));
  };
  const getDeclarationsOf = (symbols: readonly ts.Symbol[]) =>
    symbols.flatMap((symbol): ts.Node[] => symbol.declarations ?? []);
  // The accesses that read or write a field.
  const getFieldAccesses = getTable(accesses, (access) =>
    getDeclarationsOf(getAccessedFields(access, checker) ?? []),
  );
  const propertyFields = new Map(
    objects.flatMap((object) =>
      object.properties.map((property) => [property, getPropertyFields(property)] as const),
    ),
  );
  // The properties of object literals that give a field.
  const getFieldProperties = getTable([...propertyFields.keys()], (property) =>
    getDeclarationsOf(propertyFields.get(property) ?? []),
  );
  // The references to what a declaration declares. TypeScript may give a reference through an
  // instance another symbol for the same declaration.
  const declarationReferences = new Map<ts.Node, ts.Identifier[]>();
  references.forEach((names, symbol) =>
    (symbol.declarations ?? []).forEach((declaration) => {
      const found = declarationReferences.get(declaration);
      declarationReferences.set(
        declaration,
        found === undefined ? [...names] : found.concat(names),
      );
    }),
  );
  const getReferences = (declaration: ts.Node) => declarationReferences.get(declaration) ?? [];
  // The expressions of each type, and the types that have a property of a name, on the type or on a
  // member of its union or intersection, which a group whose fields have that name follows.
  const typedExpressions = new Map<ts.Type, ts.Expression[]>();
  expressions.forEach((node) => {
    const type = checker.getTypeAtLocation(node);
    const found = typedExpressions.get(type);
    if (found === undefined) typedExpressions.set(type, [node]);
    else found.push(node);
  });
  const namedTypes = new Map<string, ts.Type[]>();
  typedExpressions.forEach((_, type) =>
    new Set(
      (type.isUnion() || type.isIntersection() ? type.types : [type]).flatMap((member) =>
        checker.getPropertiesOfType(member).map((property) => property.name),
      ),
    ).forEach((name) => {
      const found = namedTypes.get(name);
      if (found === undefined) namedTypes.set(name, [type]);
      else found.push(type);
    }),
  );
  // The object types of a type, which a group's field may be carried on.
  const getObjectMembers = (type: ts.Type) =>
    (type.isUnion() ? type.types : [type]).filter(
      (member) => (member.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)) === 0,
    );
  // The types that have an object type of a symbol, which a group whose fields that type carries
  // follows.
  const symbolTypes = new Map<ts.Symbol, ts.Type[]>();
  typedExpressions.forEach((_, type) =>
    new Set(getObjectMembers(type).flatMap((member) => member.getSymbol() ?? [])).forEach(
      (symbol) => {
        const found = symbolTypes.get(symbol);
        if (found === undefined) symbolTypes.set(symbol, [type]);
        else found.push(type);
      },
    ),
  );
  const expressionOrder = new Map(expressions.map((node, position) => [node, position]));
  // The expressions whose types have a property of one of the names, or an object type of one of
  // the symbols.
  const getNamedExpressions = (names: ReadonlySet<string>, symbols: Iterable<ts.Symbol>) =>
    [
      ...new Set(
        [
          ...[...names].flatMap((name) => namedTypes.get(name) ?? []),
          ...[...symbols].flatMap((symbol) => symbolTypes.get(symbol) ?? []),
        ].flatMap((type) => typedExpressions.get(type) ?? []),
      ),
    ].toSorted(
      (left, right) => (expressionOrder.get(left) ?? 0) - (expressionOrder.get(right) ?? 0),
    );
  const isInPlace = (use: ts.Expression) => isArrayChange(use) || isSetOrMapChange(use);
  const isSetOrMap = (node: ts.Expression) => ["set", "map"].includes(getKind(node, context));
  // A call that changes a set or a map in place, whose receiver is the use.
  const isSetOrMapChange = (use: ts.Expression): boolean => {
    const parent = use.parent;
    if (ts.isNonNullExpression(parent) || ts.isParenthesizedExpression(parent)) {
      return isSetOrMapChange(parent);
    }
    return (
      ts.isPropertyAccessExpression(parent) &&
      parent.expression === use &&
      SET_OR_MAP_CHANGES.has(parent.name.text) &&
      ts.isCallExpression(parent.parent) &&
      parent.parent.expression === parent &&
      isSetOrMap(use)
    );
  };
  // A call of get on a map, which gives one of its values.
  const isMapRead = (
    node: ts.Expression,
  ): node is ts.CallExpression & { expression: ts.PropertyAccessExpression } =>
    isMethodCall(node) &&
    node.expression.name.text === "get" &&
    getKind(node.expression.expression, context) === "map";
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
  // The variables whose arrays a write gives a hole, which may hold another new array later.
  const holeHolders = new Set(
    [...references.entries()].flatMap((entry) => {
      const declaration = getValueDeclaration(entry[0], context);
      return declaration !== undefined &&
        ts.isVariableDeclaration(declaration) &&
        ts.findAncestor(declaration, (ancestor) => isReached.has(ancestor)) !== undefined &&
        writesHole(entry[1], context)
        ? [entry[0]]
        : [];
    }),
  );
  const grow = (start: ts.Symbol[], startOuters: ts.Symbol[] = [], seeds: ts.Expression[] = []) => {
    const group = new Set<ts.Node>();
    const names = new Set<string>();
    const nodes: ts.Node[] = [];
    const pending = [...start];
    // The functions whose results, and the holders whose arrays' elements, are the group's.
    const returns: ts.SignatureDeclaration[] = [];
    const outers = [...startOuters];
    // The fields that hold functions whose results are the group's.
    const resultFields: ts.Symbol[] = [];
    const resultFieldKeys = new Set<ts.Node>();
    const outerKeys = new Set<ts.Node>();
    // The parameters of callbacks that take each element of an outer holder.
    const elementParameters = new Set<ts.Node>();
    const isInGroup = (symbol: ts.Symbol) =>
      (symbol.declarations ?? []).some((declaration) => group.has(declaration));
    // Adds what an expression that holds one of the group's arrays names, where it names any.
    const addHolder = (node: ts.Expression): boolean => {
      if (ts.isParenthesizedExpression(node)) return addHolder(node.expression);
      if (ts.isCallExpression(node)) {
        const called = getCalledFunction(node, context);
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
        (called !== undefined || addInlineFields(owner)) &&
        body !== undefined &&
        !isExtended(owner) &&
        (ts.isBlock(body) ? returned : [body]).every(addSource) &&
        (name === undefined ? [] : getReferences(name.parent))
          .filter((reference) => reference !== name)
          .every(isResultReference)
      );
    };
    // A function written in place as the value of an object literal's property or of an
    // assignment, which only the fields that take it name, and which then hold only such functions.
    const addInlineFields = (owner: ts.SignatureDeclaration) => {
      const holder = ts.findAncestor(
        owner.parent,
        (ancestor) =>
          !ts.isParenthesizedExpression(ancestor) &&
          !ts.isAsExpression(ancestor) &&
          !ts.isSatisfiesExpression(ancestor),
      );
      const fields =
        (ts.isArrowFunction(owner) || ts.isFunctionExpression(owner)) && holder !== undefined
          ? ts.isPropertyAssignment(holder)
            ? getPropertyFields(holder)
            : ts.isBinaryExpression(holder) &&
                holder.operatorToken.kind === ts.SyntaxKind.EqualsToken
              ? (getAccessedFields(holder.left, checker) ?? [])
              : []
          : [];
      resultFields.push(...fields);
      return fields.length > 0;
    };
    // A reference to a function whose result is the group's: a call, or the value of an object
    // literal's property, whose fields then hold only such functions.
    const isResultReference = (reference: ts.Identifier) => {
      const call = getCall(reference);
      if (call !== undefined) return isUse(call);
      const property = reference.parent;
      if (
        !(ts.isShorthandPropertyAssignment(property) && property.name === reference) &&
        !(ts.isPropertyAssignment(property) && property.initializer === reference)
      ) {
        return false;
      }
      resultFields.push(...getPropertyFields(property));
      return true;
    };
    // A function that an object literal's property or an assignment gives a field whose functions'
    // results are the group's: one that a name holds, or one written in place.
    const addResultFunction = (node: ts.Expression): boolean => {
      const value = skipCasts(node);
      if (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) {
        return getCalledName(value) === undefined && addResult(value);
      }
      const declaration = ts.isIdentifier(value)
        ? getValueDeclaration(getSymbol(value, checker), context)
        : undefined;
      const owner =
        declaration !== undefined && ts.isVariableDeclaration(declaration)
          ? declaration.initializer
          : declaration;
      return (
        owner !== undefined &&
        ts.isFunctionLike(owner) &&
        getCalledName(owner) !== undefined &&
        addResult(owner)
      );
    };
    // A field whose functions' results are the group's: each value that an object literal or an
    // assignment gives it is such a function, and each use calls it or checks that it's there.
    const isResultField = (field: ts.Symbol) => {
      const declarations = field.declarations ?? [];
      // The name of each declaration marks the field, as its call gives what the heap holds.
      nodes.push(
        ...declarations.flatMap((declaration) => ts.getNameOfDeclaration(declaration) ?? []),
      );
      const isFieldUse = (use: ts.Expression): boolean => {
        const parent = use.parent;
        if (ts.isCallExpression(parent) && parent.expression === use) return isUse(parent);
        if (ts.isBinaryExpression(parent)) {
          const kind = parent.operatorToken.kind;
          return kind === ts.SyntaxKind.EqualsToken
            ? parent.left === use && addResultFunction(parent.right)
            : IDENTITY_OPERATORS.has(kind) ||
                (kind === ts.SyntaxKind.AmpersandAmpersandToken && parent.left === use);
        }
        return (
          ts.isTypeOfExpression(parent) ||
          (ts.isIfStatement(parent) && parent.expression === use) ||
          (ts.isPrefixUnaryExpression(parent) && parent.operator === ts.SyntaxKind.ExclamationToken)
        );
      };
      return (
        declarations.length > 0 &&
        declarations.every(
          (declaration) =>
            ts.isPropertySignature(declaration) ||
            ts.isPropertyAssignment(declaration) ||
            ts.isShorthandPropertyAssignment(declaration),
        ) &&
        getFieldProperties(field).every((property) => {
          resultFields.push(...(propertyFields.get(property) ?? []));
          return ts.isShorthandPropertyAssignment(property)
            ? addResultFunction(property.name)
            : ts.isPropertyAssignment(property) && addResultFunction(property.initializer);
        }) &&
        getFieldAccesses(field).every(isFieldUse)
      );
    };
    const addSource = (node: ts.Expression): boolean => {
      if (
        isFreshCollection(node, context) ||
        isNewArrayOfElements(node, context) ||
        getOrderedSetMethod(node, context) !== undefined
      ) {
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
      if (node.kind === ts.SyntaxKind.NullKeyword) return true;
      if (ts.isNonNullExpression(node)) return addSource(node.expression);
      // An assignment gives what it assigns, whose target its own use adds.
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        return addSource(node.right);
      }
      if (ts.isConditionalExpression(node)) {
        return addSource(node.whenTrue) && addSource(node.whenFalse);
      }
      // ?? and || give one side or the other.
      if (
        ts.isBinaryExpression(node) &&
        (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken ||
          node.operatorToken.kind === ts.SyntaxKind.BarBarToken)
      ) {
        return addSource(node.left) && addSource(node.right);
      }
      // A value that a map holds, whose holder then holds only the group's.
      if (isMapRead(node)) return addOuter(node.expression.expression);
      if (ts.isCallExpression(node) && isFreshArrayCall(node, context)) {
        nodes.push(node);
        return true;
      }
      // sort, reverse, and copyWithin give the array that they change, as a set's add and a map's
      // set give the collection.
      if (isMethodCall(node) && isSelfReturning(node, context)) {
        return addSource(node.expression.expression);
      }
      // An element that at() reads, which addHolder takes, or what a function returns.
      if (
        ts.isCallExpression(node) &&
        !(ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "at")
      ) {
        const callee = getValueDeclaration(getSymbol(node.expression, checker), context);
        const owner =
          callee !== undefined && ts.isVariableDeclaration(callee) ? callee.initializer : callee;
        if (owner !== undefined && ts.isFunctionLike(owner)) return addResult(owner);
        // A call through a field, whose functions then give only the group's.
        const fields = getAccessedFields(node.expression, checker);
        if (fields === undefined || fields.length === 0) return false;
        resultFields.push(...fields);
        return true;
      }
      return addHolder(node);
    };
    // The fields that an object literal's property may be, by its own name and by its type.
    // The array parameter of a callback that a method of one of the group's arrays calls, which
    // takes that array. A function that a declaration names must go only to that array's methods.
    const addCallbackArray = (call: ts.CallExpression, method: string, receiver: ts.Expression) => {
      const argument = call.arguments.at(0);
      const named = argument === undefined ? undefined : skipCasts(argument);
      const declaration =
        named !== undefined && ts.isIdentifier(named)
          ? getValueDeclaration(getSymbol(named, checker), context)
          : undefined;
      const callback =
        declaration !== undefined && ts.isVariableDeclaration(declaration)
          ? declaration.initializer
          : (declaration ?? named);
      const parameter =
        callback !== undefined &&
        (ts.isArrowFunction(callback) ||
          ts.isFunctionExpression(callback) ||
          ts.isFunctionDeclaration(callback))
          ? callback.parameters.at(method.startsWith("reduce") ? 3 : 2)
          : undefined;
      if (parameter === undefined) return true;
      const receiverSymbol = ts.isIdentifier(receiver) ? getSymbol(receiver, checker) : undefined;
      const isOnlyCallback =
        declaration === undefined ||
        getReferences(declaration)
          .filter((reference) => reference !== ts.getNameOfDeclaration(declaration))
          .every((reference) => {
            const passed = ts.findAncestor(
              reference,
              (ancestor) =>
                !ts.isAsExpression(ancestor.parent) &&
                !ts.isParenthesizedExpression(ancestor.parent),
            );
            const outer = passed?.parent;
            return (
              outer !== undefined &&
              ts.isCallExpression(outer) &&
              outer.arguments[0] === passed &&
              ts.isPropertyAccessExpression(outer.expression) &&
              ts.isIdentifier(outer.expression.expression) &&
              getSymbol(outer.expression.expression, checker) === receiverSymbol
            );
          });
      const symbol =
        ts.isIdentifier(parameter.name) &&
        parameter.initializer === undefined &&
        parameter.dotDotDotToken === undefined
          ? getSymbol(parameter.name, checker)
          : undefined;
      if (symbol === undefined || receiverSymbol === undefined || !isOnlyCallback) return false;
      elementParameters.add(parameter);
      pending.push(symbol);
      return true;
    };
    const isUse = (use: ts.Expression): boolean => {
      const parent = use.parent;
      // A cast gives the same object.
      if (
        ts.isParenthesizedExpression(parent) ||
        ts.isAsExpression(parent) ||
        ts.isTypeAssertionExpression(parent) ||
        ts.isSatisfiesExpression(parent)
      ) {
        return isUse(parent);
      }
      // A read by kind reads an object that the heap holds as it runs.
      if (isReadByKind(use)) return true;
      // A statement drops what it gives, as a delete drops the field that holds it.
      if (ts.isExpressionStatement(parent) || ts.isDeleteExpression(parent)) return true;
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
      if (
        ts.isBinaryExpression(parent) &&
        (parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken ||
          parent.operatorToken.kind === ts.SyntaxKind.BarBarToken)
      ) {
        return addSource(parent.left === use ? parent.right : parent.left) && isUse(parent);
      }
      // && gives its right side where its left is truthy.
      if (
        ts.isBinaryExpression(parent) &&
        parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
        parent.right === use
      ) {
        return isUse(parent);
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
      // A set method reads the set or the map that it takes.
      if (
        isMethodCall(parent) &&
        parent.arguments[0] === use &&
        SET_METHODS.has(parent.expression.name.text) &&
        getKind(parent.expression.expression, context) === "set"
      ) {
        return true;
      }
      // Array.from copies what iterating its argument gives.
      if (
        ts.isCallExpression(parent) &&
        parent.arguments.length === 1 &&
        parent.arguments[0] === use &&
        ts.isPropertyAccessExpression(parent.expression) &&
        parent.expression.name.text === "from" &&
        getBuiltIn(parent.expression.expression, context) === "Array"
      ) {
        return true;
      }
      // A new set or map that copies one, or a new typed array of its elements.
      if (
        ts.isNewExpression(parent) &&
        (isFreshCollection(parent, context) ||
          TYPED_ARRAYS.has(getBuiltIn(parent.expression, context) ?? ""))
      ) {
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
            // The forEach of a set or a map that keeps its order passes it to its callback.
            ((SET_OR_MAP_READS.has(method) &&
              (method !== "forEach" ||
                !isOrderedCollection(use, context) ||
                addCallbackArray(call, method, use))) ||
              SET_METHODS.has(method) ||
              ["delete", "clear"].includes(method) ||
              // An add or a set gives the set or the map, which a chain of them changes again.
              (["add", "set"].includes(method) && (isDiscarded(call) || isUse(call)))))
        );
      }
      if (ts.isPropertyAccessExpression(parent)) {
        const call = parent.parent;
        const method = parent.name.text;
        return (
          method === "length" ||
          (ts.isCallExpression(call) && isUnheldSplice(call, context)) ||
          ((IN_PLACE_METHODS.has(method) ||
            ARRAY_LIKE_METHODS.has(method) ||
            method === "forEach") &&
            ts.isCallExpression(call) &&
            call.expression === parent &&
            (["push", "unshift"].includes(method) || !call.arguments.some(ts.isSpreadElement)) &&
            addCallbackArray(call, method, use) &&
            // sort, reverse, and copyWithin give the array that they change.
            (!REORDER_METHODS.has(method) || isUse(call)))
        );
      }
      // A key that isn't a number reads or writes a property, as x["NaN"] does.
      if (ts.isElementAccessExpression(parent) && parent.expression === use) {
        return (
          isNumberLike(parent.argumentExpression, context) ||
          ts.isStringLiteral(parent.argumentExpression)
        );
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
        (ts.isConditionalExpression(parent) && parent.condition === use) ||
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
          kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
          (kind === ts.SyntaxKind.InKeyword && parent.right === use) ||
          (kind === ts.SyntaxKind.InstanceOfKeyword && parent.left === use)
        );
      }
      // An element of the array that an outer holder starts with.
      if (ts.isArrayLiteralExpression(parent)) {
        const holder = parent.parent;
        return (
          ts.isVariableDeclaration(holder) &&
          holder.initializer === parent &&
          ts.isIdentifier(holder.name) &&
          addOuter(holder.name)
        );
      }
      if (!ts.isCallExpression(parent) || parent.arguments.some(ts.isSpreadElement)) return false;
      // A value that a map's set takes, whose holder then holds only the group's.
      if (
        isMethodCall(parent) &&
        parent.expression.name.text === "set" &&
        parent.arguments[1] === use &&
        getKind(parent.expression.expression, context) === "map"
      ) {
        return ts.isExpressionStatement(parent.parent) && addOuter(parent.expression.expression);
      }
      if (isComparedByIdentity(use)) return true;
      if (
        parent.arguments[0] === use &&
        ts.isPropertyAccessExpression(parent.expression) &&
        KEY_METHODS.has(parent.expression.name.text)
      ) {
        return isKeyedOnly(parent.expression.expression);
      }
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
          ? getValueDeclaration(getSymbol(parent.expression, checker), context)
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
    // A set or a map that a constant holds from its start, which only finds what it holds by its
    // key, so that its keys stay in it. Each array that it takes as a key joins the group.
    const isKeyedOnly = (receiver: ts.Expression) => {
      const symbol = ts.isIdentifier(receiver) ? getSymbol(receiver, checker) : undefined;
      const declaration = getValueDeclaration(symbol, context);
      const initializer =
        declaration !== undefined && ts.isVariableDeclaration(declaration)
          ? declaration.initializer
          : undefined;
      return (
        symbol !== undefined &&
        declaration !== undefined &&
        (declaration.parent.flags & ts.NodeFlags.Const) !== 0 &&
        initializer !== undefined &&
        ts.isNewExpression(initializer) &&
        (initializer.arguments ?? []).length === 0 &&
        ["Set", "Map", "WeakSet", "WeakMap"].includes(
          getBuiltIn(initializer.expression, context) ?? "",
        ) &&
        (references.get(symbol) ?? [])
          .filter((reference) => reference !== ts.getNameOfDeclaration(declaration))
          .every((reference) => {
            const access = reference.parent;
            const call = access.parent;
            const key = ts.isCallExpression(call) ? call.arguments[0] : undefined;
            return (
              ts.isPropertyAccessExpression(access) &&
              access.expression === reference &&
              (access.name.text === "size" ||
                (KEY_METHODS.has(access.name.text) &&
                  ts.isCallExpression(call) &&
                  call.expression === access &&
                  key !== undefined &&
                  (getKind(key, context) !== "sequence" || addSource(key))))
            );
          })
      );
    };
    const isHolder = (symbol: ts.Symbol): boolean => {
      const declaration = getValueDeclaration(symbol, context);
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
          ((declaration.parent.flags & ts.NodeFlags.Const) !== 0 ||
            (declaration.parent.flags & ts.NodeFlags.Let) !== 0 ||
            holeHolders.has(symbol) ||
            (ts.isIdentifier(declaration.name) && isSetOrMapType(declaration.name, context))) &&
          ts.isIdentifier(declaration.name) &&
          // A let without an initializer holds undefined until a write gives it an array.
          (initializer === undefined
            ? (declaration.parent.flags & ts.NodeFlags.Let) !== 0 &&
              (checker.getTypeAtLocation(declaration.name).flags & ts.TypeFlags.Union) !== 0 &&
              (checker.getTypeAtLocation(declaration.name) as ts.UnionType).types.some(
                (member) => (member.flags & ts.TypeFlags.Undefined) !== 0,
              )
            : addSource(initializer))
        );
      }
      // A field, which object literals and its class's initializer give its arrays. An object
      // that lacks an optional field holds undefined in it.
      const fieldDeclarations = symbol.declarations ?? [];
      nodes.push(...fieldDeclarations);
      names.add(symbol.name);
      return (
        fieldDeclarations.length > 0 &&
        fieldDeclarations.every(
          (fieldDeclaration) =>
            ts.isPropertySignature(fieldDeclaration) ||
            ts.isPropertyAssignment(fieldDeclaration) ||
            ts.isShorthandPropertyAssignment(fieldDeclaration) ||
            (ts.isPropertyDeclaration(fieldDeclaration) &&
              !isStatic(fieldDeclaration) &&
              fieldDeclaration.questionToken === undefined &&
              fieldDeclaration.initializer !== undefined &&
              addSource(fieldDeclaration.initializer)),
        ) &&
        getFieldProperties(symbol).every((property) => {
          pending.push(...(propertyFields.get(property) ?? []));
          if (ts.isShorthandPropertyAssignment(property)) {
            const value = checker.getShorthandAssignmentValueSymbol(property);
            if (value !== undefined) pending.push(value);
            return value !== undefined;
          }
          return ts.isPropertyAssignment(property) && addSource(property.initializer);
        })
      );
    };
    const getUses = (symbol: ts.Symbol): ts.Expression[] => {
      const declaration = getValueDeclaration(symbol, context);
      return declaration !== undefined &&
        (ts.isParameter(declaration) || ts.isVariableDeclaration(declaration))
        ? (references.get(symbol) ?? []).filter((reference) => reference !== declaration.name)
        : getFieldAccesses(symbol);
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
        (called !== undefined || addInlineFields(owner)) &&
        body !== undefined &&
        (ts.isBlock(body)
          ? body.statements
              .flatMap(findReturns)
              .every(
                (returned) => returned.expression !== undefined && addSource(returned.expression),
              )
          : addSource(body)) &&
        (called === undefined ? [] : (references.get(called) ?? []))
          .filter((reference) => reference !== name)
          .every(isResultReference)
      );
    };
    // A holder whose arrays' elements are the group's arrays: each array that it holds starts as a
    // literal, and each use reads, adds, or drops an element, or reads the length.
    // A holder of maps whose values are the group's sets or maps works the same way: each map that
    // it holds starts empty, and each use reads, sets, or drops a value, or reads the size.
    const isOuter = (outer: ts.Symbol) => {
      const declarations = outer.declarations ?? [];
      const values = declarations.map((declaration) => getValueTypeNode(declaration, checker));
      const isMap = values.length > 0 && values.every((value) => value !== undefined);
      const elements = isMap ? values : declarations.map(getElementTypeNode);
      nodes.push(...elements.filter((element) => element !== undefined));
      const isElementSource = (value: ts.Expression | undefined) =>
        value !== undefined &&
        (isMap
          ? ts.isNewExpression(value) &&
            (value.arguments ?? []).length === 0 &&
            isFreshCollection(value, context)
          : ts.isArrayLiteralExpression(value) &&
            value.elements.every((element) => !ts.isSpreadElement(element) && addSource(element)));
      const isValueUse = (use: ts.Expression) => {
        const parent = use.parent;
        if (!ts.isPropertyAccessExpression(parent) || parent.expression !== use) return false;
        const call = parent.parent;
        const method = parent.name.text;
        if (method === "size") return true;
        if (
          !ts.isCallExpression(call) ||
          call.expression !== parent ||
          call.arguments.some(ts.isSpreadElement)
        ) {
          return false;
        }
        if (method === "get") return isUse(call);
        if (method === "set") {
          return (
            call.arguments[1] !== undefined &&
            addSource(call.arguments[1]) &&
            ts.isExpressionStatement(call.parent)
          );
        }
        return ["has", "delete", "clear"].includes(method);
      };
      const isElementUse = (use: ts.Expression) => {
        if (isMap) return isValueUse(use);
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
      const declaration = getValueDeclaration(outer, context);
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
            getFieldProperties(outer).every(
              (property) =>
                ts.isPropertyAssignment(property) && isElementSource(property.initializer),
            )) &&
        getUses(outer).every(isElementUse)
      );
    };
    const isGrown = () => {
      while (
        pending.length > 0 ||
        returns.length > 0 ||
        outers.length > 0 ||
        resultFields.length > 0
      ) {
        const resultField = resultFields.pop();
        if (resultField !== undefined) {
          const key = resultField.declarations?.[0];
          if (key === undefined || resultFieldKeys.has(key)) continue;
          resultFieldKeys.add(key);
          if (!isResultField(resultField)) return false;
          continue;
        }
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
    // The names of the group's fields that the objects of a script's object type may hold though
    // the type doesn't declare them, as an object goes where a type that lacks them takes it.
    const carried = new Map<ts.Symbol, Set<string>>();
    const isCarried = (type: ts.Type, name: string) =>
      getObjectMembers(type).some((member) => {
        const symbol = member.getSymbol();
        return symbol !== undefined && carried.get(symbol)?.has(name) === true;
      });
    // Whether a type is an object type that a script declares, whose objects the heap holds, so
    // that they keep whatever fields they have.
    const isCarrier = (type: ts.Type) =>
      getObjectMembers(type).every((member) => {
        // A symbol may also name a value, as a variable may share an interface's name.
        const declarations = (member.getSymbol()?.declarations ?? []).filter(
          (declaration) => !ts.isVariableDeclaration(declaration),
        );
        return (
          declarations.length > 0 &&
          declarations.every(
            (declaration) =>
              (ts.isInterfaceDeclaration(declaration) || ts.isTypeLiteralNode(declaration)) &&
              !declaration.getSourceFile().isDeclarationFile,
          )
        );
      });
    const holdsField = (type: ts.Type) =>
      [...names].some((name) => getFields(type, name).some(isInGroup) || isCarried(type, name));
    // Whether an object of one type keeps the group's fields where it goes as another type, whose
    // fields of the same names then join the group. A type that lacks a field carries it.
    const keepsFields = (from: ts.Type, to: ts.Type) =>
      [...names].every((name) => {
        const fields = getFields(to, name);
        const isHeld = getFields(from, name).some(isInGroup) || isCarried(from, name);
        if (isHeld) pending.push(...fields.filter((field) => !isInGroup(field)));
        if (!isHeld || fields.length > 0) return true;
        if (!isCarrier(to)) return false;
        getObjectMembers(to).forEach((member) => {
          const symbol = member.getSymbol();
          if (symbol === undefined || carried.get(symbol)?.has(name) === true) return;
          carried.set(symbol, new Set([...(carried.get(symbol) ?? []), name]));
          isCarriedChanged = true;
        });
        return true;
      });
    let isCarriedChanged = false;
    // An object that holds one of the group's fields goes only where its fields keep their names,
    // as an operation that reads every field, such as a spread, would read an array as a value.
    const isKept = (node: ts.Expression): boolean => {
      const parent = node.parent;
      const type = checker.getTypeAtLocation(node);
      if (ts.isTypeOfExpression(parent)) return true;
      if (ts.isConditionalExpression(parent) && parent.condition === node) return true;
      // A comma drops its left side.
      if (
        ts.isBinaryExpression(parent) &&
        parent.operatorToken.kind === ts.SyntaxKind.CommaToken &&
        parent.left === node
      ) {
        return true;
      }
      // A key of a set or a map, or an element that a search looks for, which a method compares by
      // identity and reads none of its fields.
      if (
        isMethodCall(parent) &&
        parent.arguments[0] === node &&
        ((KEY_METHODS.has(parent.expression.name.text) &&
          ["set", "map"].includes(getKind(parent.expression.expression, context))) ||
          (ELEMENT_SEARCH_METHODS.has(parent.expression.name.text) &&
            getKind(parent.expression.expression, context) === "sequence"))
      ) {
        return true;
      }
      if (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) {
        return parent.expression !== node || getAccessedFields(parent, checker) !== undefined;
      }
      if (ts.isVariableDeclaration(parent)) {
        return (
          ts.isIdentifier(parent.name) && keepsFields(type, checker.getTypeAtLocation(parent.name))
        );
      }
      if (
        (ts.isPropertyDeclaration(parent) || ts.isParameter(parent)) &&
        parent.initializer === node
      ) {
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
        // A script's parameter of type any or unknown takes the object's reference, whose fields a
        // read finds on the heap by name, unlike a built-in's, such as JSON.stringify's, which reads
        // every field.
        const callee = ts.isCallExpression(parent)
          ? getValueDeclaration(getSymbol(parent.expression, checker), context)
          : undefined;
        const isScriptParameter =
          callee !== undefined &&
          !callee.getSourceFile().isDeclarationFile &&
          contextual !== undefined &&
          (contextual.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0;
        return isScriptParameter || (contextual !== undefined && keepsFields(type, contextual));
      }
      // A spread copies each field, which keeps the array that the field holds.
      if (ts.isSpreadAssignment(parent)) {
        return keepsFields(type, checker.getTypeAtLocation(parent.parent));
      }
      // A check reads only whether the object is there, as && gives its left side only where
      // that is falsy, and in reads only its keys.
      if (
        ts.isIfStatement(parent) ||
        (ts.isBinaryExpression(parent) &&
          parent.right === node &&
          parent.operatorToken.kind === ts.SyntaxKind.InKeyword) ||
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
      if (
        ts.isBinaryExpression(parent) &&
        parent.right === node &&
        isAssignmentTarget(parent.left)
      ) {
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
    const isSettled = (): boolean => {
      if (!isGrown()) return false;
      const isKeptEverywhere = getNamedExpressions(names, carried.keys()).every(
        (node) => !holdsField(checker.getTypeAtLocation(node)) || isKept(node),
      );
      // A type that took to carry a field reads its objects again.
      const isChanged = isCarriedChanged;
      isCarriedChanged = false;
      return isKeptEverywhere && ((pending.length === 0 && !isChanged) || isSettled());
    };
    return seeds.every((seed) => addSource(seed) && isUse(seed)) && isSettled()
      ? [...nodes, ...group]
      : [];
  };
  const isReachedNode = (node: ts.Node) =>
    ts.findAncestor(node, (ancestor) => isReached.has(ancestor)) !== undefined;
  // A map off the heap may be the same TLA+ value as an array, and a weak set or map the same as a
  // set or a map, so a script that reads a value by its kind holds them on the heap.
  const readsKinds = expressions.some((node) => isReachedNode(node) && isReadByKind(node));
  // A parameter or a field whose array a function changes in place starts a group, as does a
  // variable whose array a write gives a hole.
  const starts = [
    ...[...holeHolders].map((symbol) => [symbol]),
    ...[...references.entries()].flatMap((entry) => {
      const declaration = getValueDeclaration(entry[0], context);
      return declaration !== undefined &&
        ts.isParameter(declaration) &&
        isReachedNode(declaration) &&
        entry[1].some(isInPlace)
        ? [[entry[0]]]
        : [];
    }),
    // A constant that names another's array, whose changes JavaScript shares.
    ...[...references.entries()].flatMap((entry) => {
      const declaration = getValueDeclaration(entry[0], context);
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
  // The arrays, sets, and maps that a script compares by identity, finds by it as an element, or
  // takes as a key of a set or a map, which a value lacks. Both sides of a comparison join one group,
  // as do the sets and maps that a call passes where its function compares them.
  expressions.forEach((node) => {
    // The heap holds each set and map that keeps its order.
    if (
      isReachedNode(node) &&
      !found.has(node) &&
      (isNewSubclassCollection(node, context) ||
        getOrderedSetMethod(node, context) !== undefined ||
        (ts.isNewExpression(node) &&
          isFreshCollection(node, context) &&
          (isOrderedCollection(node, context) ||
            (readsKinds &&
              ["Map", "WeakSet", "WeakMap"].includes(getCollection(node, context) ?? "")))))
    ) {
      grow([], [], [node]).forEach((inner) => found.add(inner));
    }
    const key =
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      (KEY_METHODS.has(node.expression.name.text) ||
        ELEMENT_SEARCH_METHODS.has(node.expression.name.text))
        ? node.arguments.at(0)
        : undefined;
    const seeds =
      ts.isBinaryExpression(node) && IDENTITY_OPERATORS.has(node.operatorToken.kind)
        ? [node.left, node.right]
        : key !== undefined
          ? [key]
          : ts.isCallExpression(node)
            ? node.arguments.filter(
                (argument, position) =>
                  ["set", "map"].includes(getKind(argument, context)) &&
                  (node.expression.getText() === "Object.is" ||
                    isComparedArgument(node, position, context)),
              )
            : [];
    const isFound = seeds.every((seed) =>
      getHolders(seed, checker).some((symbol) =>
        (symbol.declarations ?? []).some((declaration) => found.has(declaration)),
      ),
    );
    if (
      seeds.length > 0 &&
      !isFound &&
      isReachedNode(node) &&
      seeds.every((seed) => ["sequence", "set", "map"].includes(getKind(seed, context)))
    ) {
      grow([], [], seeds).forEach((inner) => found.add(inner));
    }
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

// A write of an array's length that may lengthen it, which leaves holes that only an object holds.
// Setting it to 0 only empties it.
export const isArrayLengthening = (node: ts.Node, context: Context) =>
  ts.isBinaryExpression(node) &&
  node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
  node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
  ts.isPropertyAccessExpression(node.left) &&
  node.left.name.text === "length" &&
  !(
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isNumericLiteral(node.right) &&
    node.right.text === "0"
  ) &&
  context.checker.isArrayType(context.checker.getTypeAtLocation(node.left.expression));

// A concat that makes an array that the heap holds, which keeps the holes of what it spreads.
export const isConcatParts = (node: ts.Node, context: Context) =>
  isMethodCall(node) && node.expression.name.text === "concat" && context.heapCollections.has(node);

// How many objects the heap holds from the start at places that the code names: the generator
// prototypes, the namespace objects, the template objects with their raw strings, and the
// CommonJS and JSON modules' exports and module objects.
export const getFixedObjectCount = (context: Context) =>
  context.generatorPrototypes.size +
  context.namespaces.size +
  2 * context.templateSites.length +
  2 * (context.commonJsModules.length + context.jsonModules.size);

// The arrays, sets, and maps that a script makes, which the heap holds where it holds every one.
export const findMadeCollections = (roots: readonly ts.Node[], context: Context) =>
  roots.flatMap((root) =>
    findNodes(
      root,
      (node): node is ts.Expression | ts.BindingElement =>
        (ts.isArrayLiteralExpression(node) &&
          !isAssignmentTarget(node) &&
          !(ts.isArrayLiteralExpression(node.parent) && isAssignmentTarget(node.parent))) ||
        isNewArrayOfElements(node, context) ||
        (ts.isNewExpression(node) && isFreshCollection(node, context)) ||
        // A splice whose result nothing holds makes no array that the heap need hold.
        (ts.isCallExpression(node) &&
          isFreshArrayCall(node, context) &&
          !isUnheldSplice(node, context)) ||
        getOrderedSetMethod(node, context) !== undefined ||
        // A rest element's array is a new one.
        (ts.isBindingElement(node) &&
          node.dotDotDotToken !== undefined &&
          ts.isArrayBindingPattern(node.parent)),
    ),
  );

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
      ((callee.expression.text === "Object" && ARRAY_OBJECT_USES.has(callee.name.text)) ||
        (callee.expression.text === "Reflect" && callee.name.text === "set")) &&
      literal.elements.every(
        (element) => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element),
      )
    ) {
      arrays.add(literal);
    }
    // A proxy's target is an object that its internal methods read and change.
    const target =
      (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
      (isNewProxy(node, context) || isRevocable(node, context)) &&
      node.arguments?.[0] !== undefined
        ? getArrayLiteral(node.arguments[0], context)
        : undefined;
    if (
      target !== undefined &&
      target.elements.every(
        (element) => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element),
      )
    ) {
      arrays.add(target);
    }
    if (isHoleyArray(node, context)) arrays.add(node);
    if (isPrototypeArray(node, context)) arrays.add(node);
    if (isThrownArray(node)) arrays.add(node);
    if (
      ((ts.isArrayLiteralExpression(node) &&
        !(node.elements.some(ts.isSpreadElement) && node.elements.some(ts.isOmittedExpression))) ||
        isNewArrayOfElements(node, context) ||
        isHoleyNewArray(node, context)) &&
      isAnyPlace(node, context)
    ) {
      arrays.add(node);
    }
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
      const found = references.get(symbol);
      if (found === undefined) references.set(symbol, [node]);
      else found.push(node);
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
  // its length or an index, as a test of exec builds the array it expects, deletes an element,
  // keeps an iterator of it, which sees the array change, or takes it from a pattern assignment.
  // The script must read it only as an object.
  const isNamedWrite = (use: ts.Identifier) =>
    ts.isPropertyAccessExpression(use.parent) &&
    use.parent.expression === use &&
    use.parent.name.text !== "length" &&
    ts.isBinaryExpression(use.parent.parent) &&
    use.parent.parent.left === use.parent &&
    use.parent.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken;
  // Deleting an element leaves a hole.
  const isElementDelete = (use: ts.Identifier) =>
    ts.isElementAccessExpression(use.parent) &&
    use.parent.expression === use &&
    ts.isDeleteExpression(use.parent.parent);
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
  // A value that may be a sequence, which lacks the identity that a comparison reads, unlike an
  // array that the heap already holds, such as a rest element.
  const mayLackIdentity = (node: ts.Expression) => {
    const value = skipCasts(node);
    const declaration = ts.isIdentifier(value)
      ? getValueDeclaration(getSymbol(value, context.checker), context)
      : undefined;
    return (
      (declaration === undefined || !arrays.has(declaration)) &&
      mayBeSequenceType(
        context.checker.getNonNullableType(context.checker.getTypeAtLocation(value)),
        context.checker,
      )
    );
  };
  // A comparison by identity tells the array apart from an equal copy that may be a sequence, as
  // does a set's or a map's key. A function's comparison compares what its call passes.
  const isIdentityUse = (use: ts.Expression) => {
    const parent = use.parent;
    const isComparedToCopy = () =>
      ts.isBinaryExpression(parent)
        ? mayLackIdentity(parent.left === use ? parent.right : parent.left)
        : ts.isCallExpression(parent) &&
          parent.arguments.some((argument) => argument !== use && mayLackIdentity(argument));
    if (isKey(use, context)) return true;
    if (isComparedByIdentity(use)) return isComparedToCopy();
    return (
      ts.isCallExpression(parent) &&
      parent.arguments.includes(use) &&
      isComparedToCopy() &&
      isComparedArgument(parent, parent.arguments.indexOf(use), context)
    );
  };
  references.forEach((uses, symbol) => {
    const declaration = getValueDeclaration(symbol, context);
    const literal =
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer !== undefined &&
      (ts.isArrayLiteralExpression(declaration.initializer) ||
        isNewArrayOfElements(declaration.initializer, context))
        ? declaration.initializer
        : undefined;
    const reads = uses.filter((use) => use.parent !== declaration);
    if (
      literal !== undefined &&
      (ts.isArrayLiteralExpression(literal) ? literal.elements : (literal.arguments ?? [])).every(
        (element) => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element),
      ) &&
      reads.some(
        (use) =>
          isNamedWrite(use) ||
          isElementDelete(use) ||
          isArrayLengthening(use.parent.parent, context) ||
          isPatternResult(use) ||
          getKeptIterator(use.parent.parent, context) !== undefined ||
          getIteratedArray(use.parent, context) === use ||
          isIdentityUse(use) ||
          isAnyPlace(use, context),
      ) &&
      reads.every((use) => isArrayObjectUse(use, context))
    ) {
      arrays.add(literal);
      if (ts.isNewExpression(literal) && declaration !== undefined) arrays.add(declaration);
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
      reads.some((use) => isNamedWrite(use) || isElementDelete(use)) &&
      reads.every((use) => isArrayObjectUse(use, context))
    ) {
      arrays.add(initializer);
      arrays.add(declaration);
    }
    // So is the array literal that freeze, seal, or preventExtensions gives back, which the
    // script must read only as an object.
    const changedLiteral =
      initializer !== undefined && isInPlaceChange(initializer, context)
        ? initializer.arguments[0]
        : undefined;
    if (declaration !== undefined && changedLiteral !== undefined && arrays.has(changedLiteral)) {
      const misused = reads.find((use) => !isArrayObjectUse(use, context));
      if (misused !== undefined) {
        throw new TlaTypeScriptError(
          "Use an array that tla-ts holds as an object only through its properties",
          misused,
        );
      }
      arrays.add(declaration);
    }
  });
  changed.forEach((node) => arrays.add(node));
  // The array that concat makes from an array that the heap holds and that may have holes, as a
  // script lengthens it, deletes an element, or makes it with holes, which the new array keeps. The
  // script must read it only as an object.
  references.forEach((uses, symbol) => {
    const declaration = getValueDeclaration(symbol, context);
    if (declaration === undefined || !ts.isVariableDeclaration(declaration)) return;
    const call = declaration.initializer;
    if (call === undefined || !isMethodCall(call) || call.expression.name.text !== "concat") return;
    const isHeldArray = (inner: ts.Expression) => {
      const held = ts.isIdentifier(inner) ? getSymbol(inner, context.checker) : undefined;
      const heldDeclaration = getValueDeclaration(held, context);
      return (
        held !== undefined &&
        heldDeclaration !== undefined &&
        ts.isVariableDeclaration(heldDeclaration) &&
        heldDeclaration.initializer !== undefined &&
        arrays.has(heldDeclaration.initializer) &&
        (isHoleyArray(heldDeclaration.initializer, context) ||
          (references.get(held) ?? []).some(
            (use) => isElementDelete(use) || isArrayLengthening(use.parent.parent, context),
          ))
      );
    };
    if (
      [call.expression.expression, ...call.arguments].some(isHeldArray) &&
      uses
        .filter((use) => use.parent !== declaration)
        .every((use) => isArrayObjectUse(use, context))
    ) {
      arrays.add(call);
      arrays.add(declaration);
    }
  });
  // The array that map makes, which lacks an element where the array that it visits does: an
  // array-like object, which may lack any index below its length, or an array that the callback, or
  // what it calls, changes in place. The script must read it only as an object.
  references.forEach((uses, symbol) => {
    const declaration = getValueDeclaration(symbol, context);
    if (declaration === undefined || !ts.isVariableDeclaration(declaration)) return;
    const call = declaration.initializer;
    if (call === undefined || !ts.isCallExpression(call)) return;
    const map = getMapCall(call, context);
    const reads = uses.filter((use) => use.parent !== declaration);
    if (map === undefined || reads.length === 0) return;
    const receiver = map.receiver;
    const held = ts.isIdentifier(receiver) ? getSymbol(receiver, context.checker) : undefined;
    const heldDeclaration = getValueDeclaration(held, context);
    const isArrayLike =
      map.isCall ||
      arrays.has(receiver) ||
      (heldDeclaration !== undefined &&
        (arrays.has(heldDeclaration) ||
          (ts.isVariableDeclaration(heldDeclaration) &&
            heldDeclaration.initializer !== undefined &&
            arrays.has(heldDeclaration.initializer))));
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
      (isArrayLike || isChangedByCallback) &&
      reads.every((use) => isArrayObjectUse(use, context))
    ) {
      arrays.add(call);
      arrays.add(declaration);
    }
  });
  // The source of what an expression holds, through the constants that name what a reorder gives.
  const getSource = (node: ts.Expression): ts.Expression | undefined => {
    const reordered = getReorderedArray(node, context);
    return reordered === undefined ? getArraySource(node, context) : getSource(reordered);
  };
  const check = (node: ts.Node) => {
    if (
      ts.isIdentifier(node) &&
      !(ts.isVariableDeclaration(node.parent) && node.parent.name === node) &&
      !isArrayObjectUse(node, context)
    ) {
      const literal = getSource(node);
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
  ["deleteProperty", { operator: "DeleteProperty", arity: 2, objects: [0] }],
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

// The key of Object's or Reflect's function that a call runs, where its callee denotes one.
const getObjectFunctionKey = (node: ts.Node, owner: "Object" | "Reflect", context: Context) => {
  const path = ts.isCallExpression(node) ? getBuiltInPath(node.expression, context) : undefined;
  return path?.startsWith(`${owner}.`) ? path.slice(owner.length + 1) : undefined;
};

const isConstruct = (node: ts.Node, context: Context) =>
  getObjectFunctionKey(node, "Reflect", context) === "construct";

// Reflect.defineProperty, deleteProperty, preventExtensions, and setPrototypeOf, which give whether
// they made the change rather than throwing where they can't.
export const isReflectChange = (node: ts.Node, context: Context) =>
  ["defineProperty", "deleteProperty", "preventExtensions", "setPrototypeOf"].includes(
    getObjectFunctionKey(node, "Reflect", context) ?? "",
  );

// Reflect.set, which gives whether it set the key rather than throwing where it can't.
export const isReflectSet = (node: ts.Node, context: Context) =>
  getObjectFunctionKey(node, "Reflect", context) === "set";

// The key of the function that a change of an object runs.
export const getObjectChangeKey = (node: ts.Node, context: Context) =>
  getObjectFunctionKey(node, "Object", context) ?? getObjectFunctionKey(node, "Reflect", context);

// Object.create runs as a change only where nothing reads the object it makes, so that it can
// throw. A callee may denote the function through a const that holds it.
export const isObjectChange = (node: ts.Node, context: Context): node is ts.CallExpression => {
  if (!ts.isCallExpression(node)) return false;
  const key = getObjectFunctionKey(node, "Object", context);
  return (
    (key !== undefined &&
      OBJECT_CHANGES.has(key) &&
      (key !== "create" ||
        ts.isExpressionStatement(node.parent) ||
        isDescriptorsRead(node, context)) &&
      !isProxyOperation(node, context)) ||
    (isConstruct(node, context) &&
      isMethodCall(node) &&
      getNewClass(node, context) === undefined) ||
    ((isReflectChange(node, context) || isReflectSet(node, context)) &&
      !isProxyOperation(node, context))
  );
};

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

// The Object.prototype methods that a call on a primitive this runs only to convert this to an
// object, which throws for null and undefined. toLocaleString calls the toString of a primitive
// other than those, and isPrototypeOf converts this only where it takes an object.
const PROTOTYPE_CALLS = new Set([
  "hasOwnProperty",
  "propertyIsEnumerable",
  "isPrototypeOf",
  "valueOf",
  "toLocaleString",
]);

// Object.prototype's method that a call through call names, as Object.prototype.valueOf.call(null).
const getPrototypeCall = (node: MethodCall, context: Context) => {
  const method = node.expression.expression;
  return node.expression.name.text === "call" &&
    ts.isPropertyAccessExpression(method) &&
    ts.isPropertyAccessExpression(method.expression) &&
    method.expression.name.text === "prototype" &&
    getBuiltIn(method.expression.expression, context) === "Object" &&
    PROTOTYPE_CALLS.has(method.name.text)
    ? method.name.text
    : undefined;
};

// A call of an Object function on a primitive whose value nothing reads, such as
// Object.getOwnPropertyNames(0) or Object.prototype.valueOf.call(null), with arguments that can't
// run code.
export const getPrimitiveObjectCall = (node: ts.Node, context: Context) => {
  if (!isMethodCall(node) || !node.arguments.every(isInertValue)) return undefined;
  const getNames = (argument: ts.Expression | undefined) =>
    argument === undefined
      ? undefined
      : getTypeNames(context.checker.getTypeAtLocation(argument), context.checker);
  const isPrimitive = (argument: ts.Expression | undefined) =>
    getNames(argument)?.every((name) => name !== "object" && name !== "function") === true;
  const argument = node.arguments.at(0);
  const prototypeCall = getPrototypeCall(node, context);
  if (prototypeCall !== undefined) {
    const other = node.arguments.at(1);
    const isNullish =
      getNames(argument)?.every((name) => name === "undefined" || name === "null") === true;
    const isObject =
      getNames(other)?.every((name) => name === "object" || name === "function") === true;
    const isSupported =
      prototypeCall === "isPrototypeOf"
        ? node.arguments.length === 2 && (isObject || isPrimitive(other))
        : prototypeCall === "valueOf" || prototypeCall === "toLocaleString"
          ? node.arguments.length === 1 && (prototypeCall === "valueOf" || isNullish)
          : node.arguments.length === 2 && isPrimitive(other);
    return argument !== undefined && isPrimitive(argument) && isSupported
      ? {
          argument,
          method: `prototype.${prototypeCall}`,
          isCoercing: prototypeCall !== "isPrototypeOf" || isObject,
        }
      : undefined;
  }
  if (getBuiltIn(node.expression.expression, context) !== "Object") return undefined;
  const method = node.expression.name.text;
  return argument !== undefined &&
    (COERCING_READS.has(method) || PRIMITIVE_PASSES.has(method)) &&
    isPrimitive(argument)
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

// freeze, seal, or preventExtensions, which gives back the object it changes.
export const isInPlaceChange = (node: ts.Node, context: Context): node is MethodCall =>
  isMethodCall(node) &&
  getBuiltIn(node.expression.expression, context) === "Object" &&
  ["freeze", "seal", "preventExtensions"].includes(node.expression.name.text) &&
  node.arguments.length === 1;

// toFixed, toExponential, or toPrecision of a number and digits that a statement checks before it
// writes the number, as digits outside their range throw a RangeError.
export const getFormatCall = (node: ts.Node, context: Context) =>
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  ["toFixed", "toExponential", "toPrecision"].includes(node.expression.name.text) &&
  isNumberLike(node.expression.expression, context) &&
  isInertValue(
    ts.isParenthesizedExpression(node.expression.expression)
      ? node.expression.expression.expression
      : node.expression.expression,
  ) &&
  node.arguments.length <= 1 &&
  node.arguments.every((argument) => isInertValue(argument) && isNumberLike(argument, context))
    ? {
        method: node.expression.name.text,
        receiver: node.expression.expression,
        digits: node.arguments.at(0),
      }
    : undefined;

// freeze, seal, or preventExtensions of what a quiet new makes, which nothing else can reach, so
// that the statement changes nothing that anything reads.
export const isUnreachableChange = (node: ts.Node, context: Context) =>
  isInPlaceChange(node, context) && isQuietNew(node.arguments[0], context);

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
export const translateObjectChange = (node: ts.CallExpression, scope: Scope, context: Context) => {
  if (isConstruct(node, context) && isMethodCall(node)) {
    return translateConstruct(node, scope, context);
  }
  const method = getObjectChangeKey(node, context) ?? "";
  const change = OBJECT_CHANGES.get(method);
  const isObject = (position: number) => {
    const argument = node.arguments.at(position);
    return (
      argument !== undefined &&
      (getKind(argument, context) === "object" ||
        (position === 0 &&
          (isBuiltInObject(argument, context) || isFunctionValue(argument, context))))
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
  // Object.assign gives its target, an object, which TypeScript types with its sources, so that a
  // source's array, set, or map type would read it as a value outside the heap.
  if (isAssign && !ts.isExpressionStatement(node.parent) && isOutside(node)) {
    throw new TlaTypeScriptError(
      "tla-ts can't read what Object.assign gives as the array, set, or map that its type says",
      node,
    );
  }
  const values = used.map((argument, position) =>
    (method === "defineProperty" || method === "deleteProperty") && position === 1
      ? translatePropertyKey(argument, scope, context)
      : position === 0
        ? translateFunctionObject(argument, scope, context)
        : translateObjectValue(argument, scope, context),
  );
  return {
    change: useJavaScript(
      isReflectChange(node, context) ? `Reflect${change.operator}` : change.operator,
      [
        getHeap(scope, node, context),
        ...(isAssign ? [values[0], tuple(values.slice(1))] : values),
        ...(isCreate && values.length === 1 ? [getUndefined(context)] : []),
      ],
      context,
    ),
    isFallible: FALLIBLE_CHANGES.has(method) || isReflectChange(node, context),
    values,
  };
};
