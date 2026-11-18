import ts from "@typescript/typescript6";
import type { ExceptPathStep, Expression, OperatorDefinition, OperatorParam } from "../ast";
import {
  getAssignedValues,
  type Context,
  findNodes,
  getCallee,
  getHeapClass,
  getSymbol,
  isAssigned,
  getUndefined,
  isHeapClass,
  getBuiltInBase,
  isFunctionObject,
  isHeapFunction,
  translateString,
  type Unknown,
  getBound,
  isHeldErrorName,
  isNestedFunction,
  isRestOnly,
  isMadeOnly,
  isMethodCall,
  isStatic,
  skipCasts,
  PRIMITIVE_FLAGS,
  getValueDeclaration,
} from "./context";
import { getTemporalConstructorKind, getTemporalKind } from "./temporal";
import {
  type Collection,
  getBuiltIn,
  isBuiltInObject,
  isBuiltInObjectType,
  isHeldBuiltInObject,
} from "./intrinsics";
import { KEYWORDS } from "../lexer";
import { TlaTypeScriptError } from "../errors";
import { BUILT_INS } from "./built-ins";
import {
  apply,
  bound,
  boolean,
  defineAt,
  field,
  functionSet,
  identifier,
  index,
  map,
  number,
  product,
  quantify,
  record,
  set,
  string,
  tuple,
} from "./tla";

export type Kind = "sequence" | "set" | "map" | "string" | "object" | "other";

// TLC needs a finite set of values for every type, so number, string, and arrays take these small
// bounds.
const getIntegers = () => apply("..", [number(-3), number(3)]);

const getStrings = () => set(["", "a", "b"].map(string));

const MAX_ARRAY_LENGTH = 3;

// Why a type has no finite set of values.
interface Infinite {
  message: string;
  // Whether TLC can't compare the values, which tla-ts could list.
  isIncomparable?: boolean;
}

// The checker only gives type arguments of type references, which the public API can't detect.
export const isTypeReference = (type: ts.Type): type is ts.TypeReference =>
  (type.flags & ts.TypeFlags.Object) !== 0 &&
  ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) !== 0;

const getTypeName = (type: ts.Type) => type.getSymbol()?.getName() ?? "";

export const isCollectionName = (name: string): name is Collection =>
  name === "Set" || name === "Map" || name === "WeakSet" || name === "WeakMap";

// The collection's type of a class that extends one and adds only static members, whose instances
// are the collection's, or the type itself.
export const getCollectionType = (type: ts.Type) => {
  const declaration = type.getSymbol()?.valueDeclaration;
  const base =
    declaration !== undefined && ts.isClassLike(declaration) && declaration.members.every(isStatic)
      ? type.getBaseTypes()?.at(0)
      : undefined;
  return base !== undefined && isCollectionName(getTypeName(base)) ? base : type;
};

// A weak collection holds its keys as a collection does, as nothing can list or count them.
const isSetType = (type: ts.Type) =>
  ["Set", "ReadonlySet", "WeakSet"].includes(getTypeName(getCollectionType(type)));

const isMapType = (type: ts.Type) =>
  ["Map", "ReadonlyMap", "WeakMap"].includes(getTypeName(getCollectionType(type)));

// Arrays, tuples, and unions of them, such as [] | [number] | [number, number].
export const isSequenceType = (type: ts.Type, checker: ts.TypeChecker): boolean =>
  type.isUnion()
    ? type.types.every((member) => isSequenceType(member, checker))
    : checker.isArrayType(type) || checker.isTupleType(type);

// Whether any member of a type is a set or a map, weak or not.
export const mayBeSetOrMapType = (type: ts.Type) =>
  (type.isUnion() ? type.types : [type]).some((member) => isSetType(member) || isMapType(member));

// Whether any member of a type is an array or a tuple, which a sequence holds without its identity.
export const mayBeSequenceType = (type: ts.Type, checker: ts.TypeChecker) =>
  (type.isUnion() ? type.types : [type]).some((member) => isSequenceType(member, checker));

// Whether every member of a type, such as each literal in a union, has the given flags.
export const isEvery = (type: ts.Type, flags: ts.TypeFlags): boolean =>
  type.isUnion()
    ? type.types.every((member) => isEvery(member, flags))
    : (type.flags & flags) !== 0;

// The plain objects that built-in functions take or give.
// The type of each typed array's elements.
export const TYPED_ARRAYS = new Map(
  [
    "Int8",
    "Uint8",
    "Uint8Clamped",
    "Int16",
    "Uint16",
    "Int32",
    "Uint32",
    "Float16",
    "Float32",
    "Float64",
    "BigInt64",
    "BigUint64",
  ].map((type) => [`${type}Array`, type]),
);

// A string that is how JavaScript writes a number that isn't an integer, which a typed array reads as
// a number that is no index.
export const isFractionKey = (text: string) =>
  Number.isFinite(Number(text)) && !Number.isInteger(Number(text)) && String(Number(text)) === text;

export type BufferName = "ArrayBuffer" | "SharedArrayBuffer" | "DataView" | `${string}Array`;

export const isBufferName = (name: string): name is BufferName =>
  name === "ArrayBuffer" ||
  name === "SharedArrayBuffer" ||
  name === "DataView" ||
  TYPED_ARRAYS.has(name);

// The built-ins that hold a value weakly, whose new makes an object that the heap holds.
export type WeakHolderName = "WeakRef" | "FinalizationRegistry";

export const isWeakHolderName = (name: string): name is WeakHolderName =>
  name === "WeakRef" || name === "FinalizationRegistry";

const LIBRARY_OBJECTS = new Set([
  "Promise",
  "PromiseFulfilledResult",
  "PromiseRejectedResult",
  "PromiseWithResolvers",
  "PropertyDescriptor",
  "TypedPropertyDescriptor",
  "PropertyDescriptorMap",
  "ProxyHandler",
  "IteratorYieldResult",
  "IteratorReturnResult",
  "ArrayIterator",
  "StringIterator",
  "IArguments",
  "ArrayLike",
  "Date",
  "ArrayBuffer",
  "SharedArrayBuffer",
  "DataView",
  "WeakRef",
  "FinalizationRegistry",
  "DisposableStack",
  "AsyncDisposableStack",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float16Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
  "Boolean",
  "Number",
  "String",
  "Symbol",
  "BigInt",
  // The objects that the resolvedOptions of Intl's objects give.
  "ResolvedCollatorOptions",
  "ResolvedDateTimeFormatOptions",
  "ResolvedDisplayNamesOptions",
  "ResolvedDurationFormatOptions",
  "ResolvedListFormatOptions",
  "ResolvedNumberFormatOptions",
  "ResolvedPluralRulesOptions",
  "ResolvedRelativeTimeFormatOptions",
  "ResolvedSegmenterOptions",
]);

export const isLibraryIterable = (type: ts.Type) =>
  type.getSymbol()?.name === "Iterable" &&
  (type.getSymbol()?.declarations ?? []).every(
    (declaration) => declaration.getSourceFile().isDeclarationFile,
  );

// An object type, or the object type, which any object may have.
const isPlainObject = (type: ts.Type, context: Context): boolean => {
  const checker = context.checker;
  const symbol = type.getSymbol();
  const readonly = type.aliasSymbol?.name === "Readonly" ? type.aliasTypeArguments?.[0] : undefined;
  if (readonly !== undefined) return isPlainObject(readonly, context);
  // An object that a script types as iterable too, as it gives it a Symbol.iterator method.
  if (type.isIntersection()) {
    return (
      type.types.some((member) => isPlainObject(member, context)) &&
      type.types.every((member) => isPlainObject(member, context) || isLibraryIterable(member))
    );
  }
  if ((type.flags & ts.TypeFlags.NonPrimitive) !== 0) return true;
  // The global object, which typeof globalThis types, and whose properties a script reads from
  // the heap.
  if (symbol?.name === "globalThis" && (symbol.flags & ts.SymbolFlags.ValueModule) !== 0) {
    return true;
  }
  const declaration = getValueDeclaration(symbol, context);
  if (
    declaration !== undefined &&
    ((ts.isClassLike(declaration) &&
      isHeapClass(declaration, context) &&
      getCollectionType(type) === type) ||
      isHeapFunction(declaration, context) ||
      isFunctionObject(declaration, context) ||
      isNestedFunction(declaration, context))
  ) {
    return true;
  }
  // A typed array's constructor, which a variable may hold where a script picks one, and whose
  // properties a script reads from the heap.
  const constructed = symbol?.name.match(/^(.+Array)Constructor$/)?.[1];
  if (
    constructed !== undefined &&
    TYPED_ARRAYS.has(constructed) &&
    (symbol?.declarations ?? []).every((inner) => inner.getSourceFile().isDeclarationFile)
  ) {
    return true;
  }
  // An object that a Temporal constructor makes, or the constructor, which a variable may hold
  // where a script destructures Temporal, and whose properties a script reads from the heap.
  if (getTemporalKind(type) !== undefined || getTemporalConstructorKind(type) !== undefined) {
    return true;
  }
  // An object that an Intl constructor makes.
  if (
    symbol !== undefined &&
    BUILT_INS[`Intl.${symbol.name}`]?.[4] === true &&
    (symbol.declarations ?? []).every(
      (declaration) =>
        declaration.getSourceFile().isDeclarationFile &&
        ts.findAncestor(declaration, ts.isModuleDeclaration)?.name.getText() === "Intl",
    )
  ) {
    return true;
  }
  return (
    (type.flags & ts.TypeFlags.Object) !== 0 &&
    !checker.isArrayType(type) &&
    !checker.isTupleType(type) &&
    !isSetType(type) &&
    !isMapType(type) &&
    type.getCallSignatures().length === 0 &&
    type.getConstructSignatures().length === 0 &&
    // A destructuring pattern without a type annotation implies an object literal type without
    // a symbol.
    (symbol === undefined
      ? ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.ObjectLiteral) !== 0
      : (symbol.flags & ts.SymbolFlags.Class) === 0 &&
        (symbol.declarations ?? []).length > 0 &&
        (LIBRARY_OBJECTS.has(symbol.name) ||
          // A mapped type, such as Record or Partial, whose declaration the library writes.
          ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Mapped) !== 0 ||
          // The objects that Proxy.revocable, Object.getOwnPropertyDescriptors,
          // Object.fromEntries, and Atomics.waitAsync give, whose types their declarations write
          // in place.
          (symbol.declarations ?? []).some((declaration) => {
            if (!ts.isTypeLiteralNode(declaration)) return false;
            const signature =
              ts.isIntersectionTypeNode(declaration.parent) ||
              ts.isUnionTypeNode(declaration.parent)
                ? declaration.parent.parent
                : declaration.parent;
            return (
              ts.isMethodSignature(signature) &&
              ["revocable", "getOwnPropertyDescriptors", "fromEntries", "waitAsync"].includes(
                signature.name.getText(),
              )
            );
          }) ||
          // A type that the script's code or its own declaration files write, rather than
          // TypeScript's library.
          (symbol.declarations ?? []).every(
            (declaration) => !context.defaultLibraries.has(declaration.getSourceFile()),
          )))
  );
};

// Whether a key that a script reads or writes is one that the value tla-ts makes of a built-in
// object, such as a RegExp or a Map, doesn't hold: a key that neither the library nor an index
// signature declares, or one that a type that joins the object with its own properties adds.
export const isAddedToBuiltIn = (
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  context: Context,
) => {
  const checker = context.checker;
  const type = checker.getNonNullableType(checker.getTypeAtLocation(node.expression));
  const argument = ts.isElementAccessExpression(node) ? node.argumentExpression : undefined;
  const key = ts.isPropertyAccessExpression(node)
    ? node.name.text
    : argument !== undefined && (ts.isStringLiteralLike(argument) || ts.isNumericLiteral(argument))
      ? argument.text
      : undefined;
  const isBuiltIn = (type.isUnion() ? type.types : [type])
    .flatMap((member) => (member.isIntersection() ? member.types : [member]))
    .some(
      (member) =>
        (member.flags & ts.TypeFlags.Object) !== 0 &&
        !isPlainObject(member, context) &&
        (member.getSymbol()?.declarations ?? []).some(
          (declaration) => declaration.getSourceFile().isDeclarationFile,
        ),
    );
  const property = key === undefined ? undefined : checker.getPropertyOfType(type, key);
  return (
    isBuiltIn &&
    (property === undefined
      ? checker.getIndexInfosOfType(type).length === 0
      : (property.declarations ?? []).every(
          (declaration) => !declaration.getSourceFile().isDeclarationFile,
        ))
  );
};

// Whether a value of a type may be an object in the heap.
export const hasHeapType = (type: ts.Type, context: Context) =>
  context.heap !== undefined &&
  (type.isUnion() ? type.types : [type]).some((member) => isPlainObject(member, context));

// Whether every value of a type is an object in the heap. A union that mixes objects with other
// values holds references beside them, which TypeOf tells apart, and which a script narrows to
// read a property.
export const isHeapType = (type: ts.Type, context: Context) =>
  context.heap !== undefined &&
  (type.isUnion() ? type.types : [type]).every((member) => isPlainObject(member, context));

// Whether a pattern reads the properties of an object in the heap rather than the fields of a
// value, which it can't tell where the value may be either.
export const isHeapPattern = (type: ts.Type, pattern: ts.Node, context: Context) => {
  if (hasHeapType(type, context) && !isHeapType(type, context)) {
    throw new TlaTypeScriptError(
      "tla-ts can't destructure a value that may be an object or another value",
      pattern,
    );
  }
  return isHeapType(type, context);
};

// Whether a value's type doesn't tell what it is, such as any, unknown, object, or {}, so it may be
// an array or a map.
export const isUntold = (node: ts.Expression, checker: ts.TypeChecker) =>
  [checker.getTypeAtLocation(node)]
    .flatMap((type) => (type.isUnion() ? type.types : [type]))
    .some(
      (member) =>
        (member.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.NonPrimitive)) !==
          0 ||
        ((member.flags & ts.TypeFlags.Object) !== 0 &&
          member.getProperties().length === 0 &&
          member.getCallSignatures().length === 0),
    );

// Whether a script with objects reads a value's properties through the heap as it runs, as its type
// any or unknown, or a union of objects in the heap with arrays and primitives, doesn't tell what
// it is.
export const isReadAsAny = (node: ts.Expression, context: Context) => {
  if (context.heap === undefined) return false;
  const checker = context.checker;
  const type = checker.getTypeAtLocation(node);
  return (
    (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0 ||
    (type.isUnion() &&
      hasHeapType(type, context) &&
      type.types.every(
        (member) =>
          isPlainObject(member, context) ||
          isSequenceType(member, checker) ||
          (member.flags & PRIMITIVE_FLAGS) !== 0,
      ))
  );
};

// Whether a script with objects keeps a value in a place that any types: a variable, a return, or a
// parameter of the script's own function, where code may keep it, change it in place, or compare it
// by identity without its type telling, so the heap holds every object that lands there. A cast, a
// branch of a conditional, and the operand that a short circuit or a comma gives only pass the
// value on to the place around them.
export const isAnyPlace = (node: ts.Expression, context: Context) => {
  if (context.heap === undefined) return false;
  const isPassed = (inner: ts.Node) => {
    const parent = inner.parent;
    return (
      ts.isParenthesizedExpression(parent) ||
      ts.isAsExpression(parent) ||
      ts.isTypeAssertionExpression(parent) ||
      ts.isSatisfiesExpression(parent) ||
      ts.isNonNullExpression(parent) ||
      (ts.isConditionalExpression(parent) && parent.condition !== inner) ||
      (ts.isBinaryExpression(parent) &&
        (parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
          parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken ||
          (parent.operatorToken.kind === ts.SyntaxKind.CommaToken && parent.right === inner)))
    );
  };
  const outer = ts.findAncestor(node, (ancestor) => !isPassed(ancestor));
  const parent = outer?.parent;
  if (outer === undefined || parent === undefined || !ts.isExpression(outer)) return false;
  const declaration =
    ts.isCallExpression(parent) && parent.arguments.some((argument) => argument === outer)
      ? context.checker.getResolvedSignature(parent)?.getDeclaration()
      : undefined;
  const isKept =
    (ts.isVariableDeclaration(parent) && parent.initializer === outer) ||
    (ts.isBinaryExpression(parent) &&
      parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      parent.right === outer) ||
    ts.isReturnStatement(parent) ||
    (ts.isArrowFunction(parent) && parent.body === outer) ||
    (declaration !== undefined && !declaration.getSourceFile().isDeclarationFile);
  const type = context.checker.getContextualType(outer);
  return isKept && type !== undefined && (type.flags & ts.TypeFlags.Any) !== 0;
};

// Whether a value that any, unknown, {}, Object, or a union with an object types may be an object
// in the heap or another value.
export const mayBeHeapObject = (node: ts.Expression, context: Context) => {
  const type = context.checker.getNonNullableType(context.checker.getTypeAtLocation(node));
  return (
    context.heap !== undefined &&
    (hasHeapType(type, context) ||
      (type.isUnion() ? type.types : [type]).some(
        (member) =>
          (member.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0 ||
          member.getSymbol()?.name === "Object" ||
          ((member.flags & ts.TypeFlags.Object) !== 0 &&
            member.getProperties().length === 0 &&
            member.getCallSignatures().length === 0),
      ))
  );
};

// The methods of Object that list the keys of a value whose type doesn't tell what it is as it runs.
export const OWN_KEYS_ANY = new Set(["keys", "values", "entries", "getOwnPropertyNames"]);

// In a script with objects, a value of type any may be an object, so its properties are unknown,
// as are those of a value that a union types as an object or another value.
export const rejectAnyReceiver = (node: ts.Expression, context: Context) => {
  if (context.heap === undefined || getKind(node, context) === "object") return;
  const type = context.checker.getTypeAtLocation(node);
  if ((type.flags & ts.TypeFlags.Any) !== 0) {
    throw new TlaTypeScriptError("Give this value a type to use its properties", node);
  }
  if (hasHeapType(type, context)) {
    throw new TlaTypeScriptError(
      "tla-ts can't read a property of a value that may be an object or another value",
      node,
    );
  }
};

// new Array(...) or Array(...), which make the same fresh array.
export const isArrayConstruction = (
  node: ts.Node,
  context: Context,
): node is ts.NewExpression | ts.CallExpression =>
  (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
  getBuiltIn(node.expression, context) === "Array";

// new Array(length), which makes an array of holes, for a length short enough to list them.
export const isHoleyNewArray = (
  node: ts.Node,
  context: Context,
): node is ts.NewExpression | ts.CallExpression => {
  const length = isArrayConstruction(node, context) ? node.arguments?.at(0) : undefined;
  return (
    isArrayConstruction(node, context) &&
    node.arguments?.length === 1 &&
    length !== undefined &&
    ts.isNumericLiteral(length) &&
    Number.isInteger(Number(length.text)) &&
    Number(length.text) > 0 &&
    Number(length.text) <= 64
  );
};

// new Array of no elements, or of two or more, which makes an array of them, as new Array(1, 2, 3)
// does. One argument is a length instead.
export const isNewArrayOfElements = (
  node: ts.Node,
  context: Context,
): node is ts.NewExpression | ts.CallExpression =>
  isArrayConstruction(node, context) &&
  (node.arguments?.length ?? 0) !== 1 &&
  node.arguments?.some(ts.isSpreadElement) === false;

// The array literal, or the new Array of holes, that an expression or the variable it names holds.
export const getArraySource = (node: ts.Expression, context: Context) => {
  const declaration = ts.isIdentifier(node)
    ? getValueDeclaration(getSymbol(node, context.checker), context)
    : undefined;
  const initializer =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : undefined;
  return (
    getArrayLiteral(node, context) ??
    (isHoleyNewArray(node, context) ? node : undefined) ??
    (initializer !== undefined && isHoleyNewArray(initializer, context) ? initializer : undefined)
  );
};

export const getArrayLiteral = (node: ts.Expression, context: Context) => {
  if (ts.isArrayLiteralExpression(node)) return node;
  const declaration = ts.isIdentifier(node)
    ? getValueDeclaration(getSymbol(node, context.checker), context)
    : undefined;
  return declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer !== undefined &&
    ts.isArrayLiteralExpression(declaration.initializer)
    ? declaration.initializer
    : undefined;
};

// The fields that a property access or an element access reads, where its key names them: a
// literal, or a union of literals. It's undefined where tla-ts can't tell.
export const getAccessedFields = (node: ts.Node, checker: ts.TypeChecker) => {
  if (ts.isPropertyAccessExpression(node) && !ts.isPrivateIdentifier(node.name)) {
    const symbol = checker.getSymbolAtLocation(node.name);
    return symbol === undefined ? undefined : [symbol];
  }
  if (!ts.isElementAccessExpression(node)) return undefined;
  const keyType = checker.getTypeAtLocation(node.argumentExpression);
  const keys = keyType.isUnion() ? keyType.types : [keyType];
  const objectType = checker.getNonNullableType(checker.getTypeAtLocation(node.expression));
  const fields = keys.map((key) =>
    key.isStringLiteral() ? checker.getPropertyOfType(objectType, key.value) : undefined,
  );
  return fields.every((field) => field !== undefined)
    ? fields.filter((field) => field !== undefined)
    : undefined;
};

// The function that a call names, where a script declares it or binds it to a constant, and that
// gives what it returns as it is.
export const getCalledFunction = (node: ts.CallExpression, context: Context) => {
  const declaration = ts.isIdentifier(node.expression)
    ? getValueDeclaration(getSymbol(node.expression, context.checker), context)
    : undefined;
  const owner =
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    (declaration.parent.flags & ts.NodeFlags.Const) !== 0
      ? declaration.initializer
      : declaration;
  return owner !== undefined &&
    (ts.isFunctionDeclaration(owner) ||
      ts.isArrowFunction(owner) ||
      ts.isFunctionExpression(owner)) &&
    owner.asteriskToken === undefined &&
    !(ts.getCombinedModifierFlags(owner) & ts.ModifierFlags.Async)
    ? owner
    : undefined;
};

// The type that a declaration writes for the elements of the arrays it holds.
export const getElementTypeNode = (declaration: ts.Declaration) =>
  (ts.isPropertySignature(declaration) || ts.isVariableDeclaration(declaration)) &&
  declaration.type !== undefined &&
  ts.isArrayTypeNode(declaration.type)
    ? declaration.type.elementType
    : undefined;

// The type that a declaration writes for the values of the maps it holds, as Map<K, V> or a new
// Map<K, V>() that it starts with gives V.
export const getValueTypeNode = (declaration: ts.Declaration, checker: ts.TypeChecker) => {
  if (!ts.isPropertySignature(declaration) && !ts.isVariableDeclaration(declaration)) {
    return undefined;
  }
  const initializer = ts.isVariableDeclaration(declaration) ? declaration.initializer : undefined;
  const typeArguments =
    declaration.type !== undefined
      ? ts.isTypeReferenceNode(declaration.type)
        ? declaration.type.typeArguments
        : undefined
      : initializer !== undefined && ts.isNewExpression(initializer)
        ? initializer.typeArguments
        : undefined;
  const type = checker.getTypeAtLocation(declaration.name);
  return isMapType(type) && getCollectionType(type) === type && typeArguments?.length === 2
    ? typeArguments[1]
    : undefined;
};

// The variables and fields that an expression names, which hold what it gives.
export const getHolders = (node: ts.Expression, checker: ts.TypeChecker) => {
  const symbol = ts.isIdentifier(node) ? getSymbol(node, checker) : undefined;
  return getAccessedFields(node, checker) ?? (symbol === undefined ? [] : [symbol]);
};

// Whether every value of a type is an array, a set, or a map where the heap holds every one.
export const isHeldCollectionType = (type: ts.Type, context: Context) =>
  context.isEveryCollectionHeld &&
  (type.isUnion() ? type.types : [type]).every(
    (member) => isSequenceType(member, context.checker) || isSetType(member) || isMapType(member),
  );

// Whether an expression gives a set or a map that the heap holds, which keeps its identity as a
// script changes it in place.
export const isHeapSetOrMap = (node: ts.Expression, context: Context) => {
  if (context.heapCollections.size === 0) return false;
  const type = context.checker.getNonNullableType(context.checker.getTypeAtLocation(node));
  // A set that a set method makes, which the heap holds as it makes it.
  return (
    (isSetType(type) || isMapType(type)) &&
    (context.heapCollections.has(node) || isHeld(node, context))
  );
};

// Whether an expression gives a proxy of an array, a set, or a map, which the heap holds as an
// object.
const isCollectionProxy = (node: ts.Expression, context: Context): boolean => {
  if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) {
    return isCollectionProxy(node.expression, context);
  }
  const declaration = ts.isIdentifier(node)
    ? getValueDeclaration(getSymbol(node, context.checker), context)
    : undefined;
  return (
    context.collectionProxies.has(node) ||
    (declaration !== undefined && context.collectionProxies.has(declaration))
  );
};

// An array that the heap holds, or an arguments object, which spread and apply read as one.
export const isHeapArrayLike = (node: ts.Expression, context: Context) =>
  isHeapArray(node, context) ||
  (context.heap !== undefined &&
    context.checker.getTypeAtLocation(skipCasts(node)).getSymbol()?.name === "IArguments");

export const isHeapArray = (node: ts.Expression, context: Context) => {
  if (context.heap === undefined) return false;
  const type = context.checker.getNonNullableType(context.checker.getTypeAtLocation(node));
  // The heap holds the arrays that a match gives, with their indices.
  return (
    isRegExpArray(type) ||
    (context.heapCollections.size > 0 &&
      !isSetType(type) &&
      !isMapType(type) &&
      isHeld(node, context)) ||
    isRegExpIndicesPair(node, context)
  );
};

// The methods that reorder or overwrite an array in place, and give the array.
export const REORDER_METHODS = new Set(["sort", "reverse", "fill", "copyWithin"]);

// The array that a constant names where sort, reverse, fill, or copyWithin gave it, as
// const sorted = list.sort() names list.
export const getReorderedArray = (node: ts.Expression, context: Context) => {
  const declaration = ts.isIdentifier(node)
    ? getValueDeclaration(getSymbol(node, context.checker), context)
    : undefined;
  const call =
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    (declaration.parent.flags & ts.NodeFlags.Const) !== 0
      ? declaration.initializer
      : undefined;
  return call !== undefined && isMethodCall(call) && REORDER_METHODS.has(call.expression.name.text)
    ? skipCasts(call.expression.expression)
    : undefined;
};

// Whether an expression gives a collection that the heap holds: a literal or a new set or map that
// it holds, or what a holder of them gives.
const isHeld = (node: ts.Expression, context: Context): boolean => {
  if (
    isHeldCollectionType(
      context.checker.getNonNullableType(context.checker.getTypeAtLocation(node)),
      context,
    )
  ) {
    return true;
  }
  // A cast gives the same collection whatever type it gives it.
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isSatisfiesExpression(node)
  ) {
    return isHeld(node.expression, context);
  }
  const reordered = getReorderedArray(node, context);
  if (reordered !== undefined && isHeld(reordered, context)) return true;
  // An element of the arrays that a holder holds, where the heap holds those elements.
  const isElementHeld = (outer: ts.Expression) => {
    const holders = getHolders(outer, context.checker);
    return (
      holders.length > 0 &&
      holders.every((holder) =>
        (holder.declarations ?? []).every((declaration) => {
          const element = getElementTypeNode(declaration);
          return element !== undefined && context.heapCollections.has(element);
        }),
      )
    );
  };
  // A value of the maps that a holder holds, where the heap holds those values.
  const isValueHeld = (outer: ts.Expression) => {
    const holders = getHolders(outer, context.checker);
    return (
      holders.length > 0 &&
      holders.every((holder) =>
        (holder.declarations ?? []).every((declaration) => {
          const value = getValueTypeNode(declaration, context.checker);
          return value !== undefined && context.heapCollections.has(value);
        }),
      )
    );
  };
  if (
    ts.isBinaryExpression(node) &&
    (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken ||
      node.operatorToken.kind === ts.SyntaxKind.BarBarToken)
  ) {
    return isHeld(node.left, context) && isHeld(node.right, context);
  }
  if (ts.isCallExpression(node)) {
    const called = getCalledFunction(node, context);
    // A call through a field whose functions give what the heap holds, which the names of the
    // field's declarations mark.
    const fields = getAccessedFields(node.expression, context.checker);
    if (
      fields !== undefined &&
      fields.length > 0 &&
      fields.every((field) =>
        (field.declarations ?? []).every((declaration) => {
          const name = ts.getNameOfDeclaration(declaration);
          return name !== undefined && context.heapCollections.has(name);
        }),
      )
    ) {
      return true;
    }
    // A set's add, a map's set, and an array's sort, reverse, fill, and copyWithin give the
    // collection that they change.
    return called !== undefined
      ? context.heapCollections.has(called)
      : ts.isPropertyAccessExpression(node.expression) &&
          ((node.expression.name.text === "at" && isElementHeld(node.expression.expression)) ||
            (node.expression.name.text === "get" &&
              isSetOrMapType(node.expression.expression, context) &&
              isValueHeld(node.expression.expression)) ||
            (["add", "set"].includes(node.expression.name.text) &&
              isSetOrMapType(node.expression.expression, context) &&
              isHeld(node.expression.expression, context)) ||
            (REORDER_METHODS.has(node.expression.name.text) &&
              isHeld(node.expression.expression, context)));
  }
  if (
    ts.isElementAccessExpression(node) &&
    getAccessedFields(node, context.checker) === undefined &&
    isNumberLike(node.argumentExpression, context)
  ) {
    return isElementHeld(node.expression);
  }
  if (ts.isConditionalExpression(node)) {
    return isHeld(node.whenTrue, context) && isHeld(node.whenFalse, context);
  }
  const literal = getArraySource(node, context);
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const declaration = getValueDeclaration(symbol, context);
  // A variable that a declaration without a type or a value types by what it's assigned holds what
  // the heap holds where each assignment gives it an array literal that the heap holds.
  const assigned =
    symbol !== undefined && ts.isIdentifier(node) && isAutoTyped(node, context)
      ? getAssignedValues(symbol, context)
      : undefined;
  if (
    assigned !== undefined &&
    assigned.length > 0 &&
    assigned.every(
      (value) => ts.isArrayLiteralExpression(value) && context.heapCollections.has(value),
    )
  ) {
    return true;
  }
  const fields = getAccessedFields(node, context.checker);
  const called = ts.isCallExpression(node)
    ? getValueDeclaration(getSymbol(node.expression, context.checker), context)
    : undefined;
  const returning =
    called !== undefined && ts.isVariableDeclaration(called) ? called.initializer : called;
  return (
    (returning !== undefined && context.heapCollections.has(returning)) ||
    (literal !== undefined && context.heapCollections.has(literal)) ||
    (ts.isNewExpression(node) && context.heapCollections.has(node)) ||
    (declaration !== undefined &&
      (ts.isBindingElement(declaration) ||
        ts.isParameter(declaration) ||
        ts.isVariableDeclaration(declaration)) &&
      context.heapCollections.has(declaration)) ||
    (fields !== undefined &&
      fields.length > 0 &&
      fields.every((field) =>
        (field.declarations ?? []).some((fieldDeclaration) =>
          context.heapCollections.has(fieldDeclaration),
        ),
      ))
  );
};

// Whether a value's type is a set's or a map's, rather than a weak one's or an iterable's.
export const isSetOrMapType = (node: ts.Expression, context: Context) => {
  const type = context.checker.getNonNullableType(context.checker.getTypeAtLocation(node));
  return (
    ["Set", "Map"].includes(getCollection(node, context) ?? "") &&
    (isSetType(type) || isMapType(type))
  );
};

// Whether a set or a map keeps the order of its keys, as a script that iterates one needs. A weak
// one has no order to keep.
export const isOrderedCollection = (node: ts.Expression, context: Context) =>
  context.hasOrderedCollections && isSetOrMapType(node, context);

export interface OrderedIteration {
  receiver: ts.Expression;
  method: string;
}

// What a for-of, a spread, or Array.from iterates where it's a set or a map that keeps its order on
// the heap, or a call of its keys, values, or entries: the collection, and the method that gives
// the iterator, which is @@iterator for the collection itself.
export const getOrderedIteration = (
  node: ts.Expression,
  context: Context,
): OrderedIteration | undefined => {
  const iterated = skipCasts(node);
  const call =
    ts.isCallExpression(iterated) &&
    iterated.arguments.length === 0 &&
    ts.isPropertyAccessExpression(iterated.expression) &&
    ["keys", "values", "entries"].includes(iterated.expression.name.text)
      ? iterated.expression
      : undefined;
  const receiver = call?.expression ?? iterated;
  return isOrderedCollection(receiver, context) && isHeapSetOrMap(receiver, context)
    ? {
        receiver,
        method: call?.name.text ?? "@@iterator",
      }
    : undefined;
};

// The built-in collection that a set or a map is, which a weak one's type names.
export const getCollection = (node: ts.Expression, context: Context) => {
  const kind = getKind(node, context);
  const isWeak = getTypeName(getCollectionType(context.checker.getTypeAtLocation(node))).startsWith(
    "Weak",
  );
  return kind === "set"
    ? isWeak
      ? "WeakSet"
      : "Set"
    : kind === "map"
      ? isWeak
        ? "WeakMap"
        : "Map"
      : undefined;
};

// The array that a RegExp's exec or a string's match gives, which is an object on the heap, or
// without objects a function from its keys rather than a sequence.
export const isRegExpArray = (type: ts.Type) =>
  ["RegExpExecArray", "RegExpMatchArray", "RegExpIndicesArray"].includes(
    type.getSymbol()?.name ?? "",
  );

// The groups of the array that exec or match gives.
const isRegExpGroups = (node: ts.Expression, context: Context): boolean => {
  const inner =
    ts.isNonNullExpression(node) || ts.isParenthesizedExpression(node) ? node.expression : node;
  return inner !== node
    ? isRegExpGroups(inner, context)
    : ts.isPropertyAccessExpression(node) &&
        node.name.text === "groups" &&
        isRegExpArray(
          context.checker.getNonNullableType(context.checker.getTypeAtLocation(node.expression)),
        );
};

// The part of the indices of a match that an expression's type tells: the array of them, or the
// object of their groups.
const getRegExpIndicesKind = (node: ts.Expression, context: Context) => {
  const type = context.checker.getNonNullableType(context.checker.getTypeAtLocation(node));
  if (type.getSymbol()?.name === "RegExpIndicesArray") return "indices";
  const member = type.getSymbol()?.declarations?.at(0)?.parent;
  return member !== undefined &&
    ts.isPropertySignature(member) &&
    ts.isInterfaceDeclaration(member.parent) &&
    member.parent.name.text === "RegExpIndicesArray"
    ? "groups"
    : undefined;
};

// Whether an expression gives a pair of a start and an end, which TypeScript types as any pair of
// numbers: an element of the indices, a group of them, or a constant that holds one. Only the
// expression that it reads a pair from needs its type.
const isRegExpIndicesPair = (node: ts.Expression, context: Context): boolean => {
  if (ts.isNonNullExpression(node) || ts.isParenthesizedExpression(node)) {
    return isRegExpIndicesPair(node.expression, context);
  }
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    const owner = getRegExpIndicesKind(node.expression, context);
    return owner === "groups" || (owner === "indices" && ts.isElementAccessExpression(node));
  }
  const declaration = ts.isIdentifier(node)
    ? getValueDeclaration(getSymbol(node, context.checker), context)
    : undefined;
  return (
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer !== undefined &&
    (ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) !== 0 &&
    isRegExpIndicesPair(declaration.initializer, context)
  );
};

// The part of the indices of a match that an expression gives, which the heap holds: the array of
// them, the object of their groups, or a pair of a start and an end.
export const getRegExpIndicesPart = (
  node: ts.Expression,
  context: Context,
): "indices" | "groups" | "pair" | undefined =>
  getRegExpIndicesKind(node, context) ?? (isRegExpIndicesPair(node, context) ? "pair" : undefined);

export const ITERATOR_METHODS = ["keys", "values", "entries"];

// The value that Iterator.from takes.
export const getIteratorFromArgument = (node: ts.Node) =>
  ts.isCallExpression(node) &&
  node.expression.getText() === "Iterator.from" &&
  node.arguments.length === 1 &&
  !ts.isSpreadElement(node.arguments[0])
    ? node.arguments[0]
    : undefined;

// The array that Iterator.from takes, whose Symbol.iterator method makes the iterator it gives, as
// an array's iterator inherits from Iterator.prototype.
export const getIteratedArray = (node: ts.Node, context: Context) => {
  const argument = getIteratorFromArgument(node);
  return argument !== undefined &&
    isSequenceType(context.checker.getTypeAtLocation(argument), context.checker)
    ? argument
    : undefined;
};

// The string, or String object, whose iterator Iterator.from or a call of its [Symbol.iterator]()
// makes, where no for-of or spread reads it at once.
export const getIteratedString = (node: ts.Node, context: Context) => {
  const iterated =
    getIteratorFromArgument(node) ??
    (ts.isCallExpression(node) &&
    node.arguments.length === 0 &&
    ts.isElementAccessExpression(node.expression) &&
    node.expression.questionDotToken === undefined &&
    node.expression.argumentExpression.getText() === "Symbol.iterator" &&
    !(ts.isForOfStatement(node.parent) && node.parent.expression === node) &&
    !ts.isSpreadElement(node.parent)
      ? node.expression.expression
      : undefined);
  const type = iterated && context.checker.getTypeAtLocation(iterated);
  return type !== undefined &&
    ((type.flags & ts.TypeFlags.StringLike) !== 0 ||
      ((type.flags & ts.TypeFlags.Object) !== 0 && type.getSymbol()?.name === "String"))
    ? iterated
    : undefined;
};

// The kind of iterator that a call of an array's keys(), values(), entries(), or [Symbol.iterator]()
// makes, where no for-of or spread reads it at once, so that the iterator is an object.
export const getKeptIterator = (node: ts.Node, context: Context) => {
  if (getIteratedArray(node, context) !== undefined) return "values";
  if (getIteratedString(node, context) !== undefined) return "string";
  if (
    !ts.isCallExpression(node) ||
    node.arguments.length > 0 ||
    !(
      ts.isPropertyAccessExpression(node.expression) ||
      ts.isElementAccessExpression(node.expression)
    ) ||
    !isSequenceType(
      context.checker.getTypeAtLocation(node.expression.expression),
      context.checker,
    ) ||
    (ts.isForOfStatement(node.parent) && node.parent.expression === node) ||
    ts.isSpreadElement(node.parent)
  ) {
    return undefined;
  }
  const callee = node.expression;
  if (ts.isPropertyAccessExpression(callee) && ITERATOR_METHODS.includes(callee.name.text)) {
    return callee.name.text;
  }
  return ts.isElementAccessExpression(callee) &&
    callee.argumentExpression.getText() === "Symbol.iterator"
    ? "values"
    : undefined;
};

// A parameter that takes any iterable, which its function only makes a Set of. A call passes it
// the set of the elements of the array or the set that it passes, as their order is lost.
export const isSetSource = (parameter: ts.ParameterDeclaration, context: Context) => {
  const type = parameter.type;
  if (
    !ts.isIdentifier(parameter.name) ||
    parameter.dotDotDotToken !== undefined ||
    type === undefined ||
    !ts.isTypeReferenceNode(type) ||
    !["Iterable", "IterableIterator"].includes(type.typeName.getText())
  ) {
    return false;
  }
  const symbol = getSymbol(parameter.name, context.checker);
  const uses = findNodes(parameter.parent, ts.isIdentifier).filter(
    (name) => name !== parameter.name && getSymbol(name, context.checker) === symbol,
  );
  return (
    uses.length > 0 &&
    uses.every(
      (use) =>
        ts.isNewExpression(use.parent) &&
        use.parent.arguments?.length === 1 &&
        use.parent.arguments[0] === use &&
        getBuiltIn(use.parent.expression, context) === "Set",
    )
  );
};

// The name of Array.prototype's method that a call runs through call, as
// Array.prototype.method.call(value, ...arguments) or [].method.call(value, ...arguments) does.
export const getArrayMethodCall = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  const target = ts.isPropertyAccessExpression(callee) ? callee.expression : undefined;
  return ts.isPropertyAccessExpression(callee) &&
    callee.name.text === "call" &&
    target !== undefined &&
    ts.isPropertyAccessExpression(target) &&
    (target.expression.getText() === "Array.prototype" ||
      (ts.isArrayLiteralExpression(target.expression) &&
        target.expression.elements.length === 0)) &&
    getSymbol(target.name, context.checker)
      ?.getDeclarations()
      ?.some(
        (declaration) =>
          ts.isInterfaceDeclaration(declaration.parent) && declaration.parent.name.text === "Array",
      ) === true
    ? target.name.text
    : undefined;
};

// A call of Array.prototype's method on undefined or null, which throws the TypeError of ToObject
// after its arguments, which can't do anything, evaluate.
export const isNullishArrayMethodCall = (node: ts.CallExpression, context: Context) => {
  const thisArgument = node.arguments.at(0);
  return (
    getArrayMethodCall(node, context) !== undefined &&
    (thisArgument === undefined ||
      isEvery(
        context.checker.getTypeAtLocation(thisArgument),
        ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void,
      )) &&
    node.arguments.every(
      (argument) =>
        ts.isLiteralExpression(argument) ||
        argument.kind === ts.SyntaxKind.NullKeyword ||
        (ts.isIdentifier(argument) && argument.text === "undefined") ||
        ts.isFunctionExpression(argument) ||
        ts.isArrowFunction(argument),
    )
  );
};

// The positions of the index arguments that ToIntegerOrInfinity converts, of the methods of each
// kind of receiver where tla-ts converts a primitive there as ToNumber does. test262's runner admits
// such an argument, and each needs a unit test of such a call.
export const INDEX_PARAMETERS = new Map([
  [
    "Array",
    new Map([
      ["at", [0]],
      ["copyWithin", [0, 1, 2]],
      ["fill", [1, 2]],
      ["slice", [0, 1]],
      ["toSpliced", [0, 1]],
      ["with", [0]],
    ]),
  ],
  [
    "TypedArray",
    new Map([
      ["at", [0]],
      ["copyWithin", [0, 1, 2]],
      ["fill", [1, 2]],
      ["includes", [1]],
      ["indexOf", [1]],
      ["lastIndexOf", [1]],
      ["slice", [0, 1]],
      ["subarray", [0, 1]],
    ]),
  ],
  // A DataView's methods convert the index with ToIndex.
  [
    "DataView",
    new Map([
      ["getInt8", [0]],
      ["getUint8", [0]],
      ["getInt16", [0]],
      ["getUint16", [0]],
      ["getInt32", [0]],
      ["getUint32", [0]],
      ["getFloat16", [0]],
      ["getFloat32", [0]],
      ["getFloat64", [0]],
      ["getBigInt64", [0]],
      ["getBigUint64", [0]],
      ["setInt8", [0]],
      ["setUint8", [0]],
      ["setInt16", [0]],
      ["setUint16", [0]],
      ["setInt32", [0]],
      ["setUint32", [0]],
      ["setFloat16", [0]],
      ["setFloat32", [0]],
      ["setFloat64", [0]],
      ["setBigInt64", [0]],
      ["setBigUint64", [0]],
    ]),
  ],
]);

// The kind of receiver of a type that INDEX_PARAMETERS lists methods for.
export const getIndexedKind = (type: ts.Type, checker: ts.TypeChecker) =>
  checker.isArrayType(type)
    ? "Array"
    : (type.isUnion() ? type.types : [type]).every((member) =>
          /^(Big)?(Int|Uint|Float)\d+(Clamped)?Array$/.test(member.getSymbol()?.getName() ?? ""),
        )
      ? "TypedArray"
      : type.getSymbol()?.getName() === "DataView"
        ? "DataView"
        : undefined;

// A call of a method that INDEX_PARAMETERS lists, on an array, a typed array, or a DataView that a
// literal or a new makes, with a symbol for an index, which throws the TypeError of ToNumber. Its
// arguments are literals or variables, and a typed array's fill converts a number or a BigInt
// value first, so nothing runs or throws another error before. A search of an empty typed array
// returns before it converts its index.
export const isSymbolIndexCall = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  if (!ts.isPropertyAccessExpression(callee)) return false;
  const checker = context.checker;
  const receiver = callee.expression;
  const kind = getIndexedKind(checker.getTypeAtLocation(receiver), checker);
  const positions =
    kind === undefined ? undefined : INDEX_PARAMETERS.get(kind)?.get(callee.name.text);
  const getType = (argument: ts.Expression) => checker.getTypeAtLocation(argument);
  const thrown = node.arguments.findIndex(
    (argument, position) =>
      positions?.includes(position) === true &&
      isEvery(getType(argument), ts.TypeFlags.ESSymbolLike),
  );
  if (thrown === -1 || ["includes", "indexOf", "lastIndexOf"].includes(callee.name.text)) {
    return false;
  }
  const isFilled = kind === "TypedArray" && callee.name.text === "fill";
  const symbol = ts.isIdentifier(receiver) ? getSymbol(receiver, checker) : undefined;
  const declaration = getValueDeclaration(symbol, context);
  return (
    node.arguments.every(
      (argument) =>
        ts.isIdentifier(argument) ||
        ts.isLiteralExpression(argument) ||
        [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
          argument.kind,
        ),
    ) &&
    node.arguments
      .slice(0, thrown)
      .every((argument, position) =>
        isFilled && position === 0
          ? isEvery(getType(argument), ts.TypeFlags.NumberLike | ts.TypeFlags.BigIntLike)
          : isEvery(
              getType(argument),
              ts.TypeFlags.NumberLike |
                ts.TypeFlags.StringLike |
                ts.TypeFlags.BooleanLike |
                ts.TypeFlags.Null |
                ts.TypeFlags.Undefined,
            ),
      ) &&
    (ts.isArrayLiteralExpression(receiver) ||
      (symbol !== undefined &&
        declaration !== undefined &&
        ts.isVariableDeclaration(declaration) &&
        declaration.initializer !== undefined &&
        (ts.isArrayLiteralExpression(declaration.initializer) ||
          ts.isNewExpression(declaration.initializer)) &&
        !isAssigned(symbol, node.getSourceFile(), context)))
  );
};

// A call of a Set's method that reads a set-like object, of an array that a literal makes, in a
// script that gives nothing a size, which throws the TypeError of GetSetRecord, as ToNumber makes
// the size it reads NaN.
export const isSizelessSetLikeCall = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  const argument = node.arguments.at(0);
  const symbol =
    argument !== undefined && ts.isIdentifier(argument)
      ? getSymbol(argument, context.checker)
      : undefined;
  const declaration = getValueDeclaration(symbol, context);
  // Any size but a read of one, as set.size reads.
  const isGiven = (inner: ts.Node): inner is ts.Node => {
    const access = inner.parent;
    const user = access?.parent;
    const isRead =
      access !== undefined &&
      ts.isPropertyAccessExpression(access) &&
      access.name === inner &&
      !(
        ts.isBinaryExpression(user) &&
        user.left === access &&
        user.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        user.operatorToken.kind <= ts.SyntaxKind.LastAssignment
      ) &&
      !ts.isDeleteExpression(user) &&
      !ts.isPrefixUnaryExpression(user) &&
      !ts.isPostfixUnaryExpression(user);
    return (
      (ts.isIdentifier(inner) || ts.isPrivateIdentifier(inner) || ts.isStringLiteralLike(inner)) &&
      inner.text === "size" &&
      !isRead
    );
  };
  return (
    ts.isPropertyAccessExpression(callee) &&
    SET_LIKE_METHODS.has(callee.name.text) &&
    ts.isIdentifier(callee.expression) &&
    isSet(callee.expression, context) &&
    node.arguments.length === 1 &&
    symbol !== undefined &&
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer !== undefined &&
    ts.isArrayLiteralExpression(declaration.initializer) &&
    !isAssigned(symbol, node.getSourceFile(), context) &&
    findNodes(node.getSourceFile(), isGiven).length === 0
  );
};

// A Set's methods that read a set-like object through GetSetRecord.
export const SET_LIKE_METHODS = new Set([
  "union",
  "intersection",
  "difference",
  "symmetricDifference",
  "isSubsetOf",
  "isSupersetOf",
  "isDisjointFrom",
]);

// The wrapper that ToObject makes of the boolean, number, or string that a call of
// Array.prototype's method runs on, which the statement makes on the heap before the call runs.
export const getWrappedThis = (node: ts.Node, context: Context) => {
  const parent = node.parent;
  if (
    parent === undefined ||
    !ts.isCallExpression(parent) ||
    parent.arguments.at(0) !== node ||
    getArrayMethodCall(parent, context) === undefined
  ) {
    return undefined;
  }
  const type = context.checker.getTypeAtLocation(node);
  return isEvery(type, ts.TypeFlags.BooleanLike)
    ? "Boolean"
    : isEvery(type, ts.TypeFlags.NumberLike)
      ? "Number"
      : isEvery(type, ts.TypeFlags.StringLike)
        ? "String"
        : undefined;
};

// The array methods that call back for each element.
export const LOOP_METHODS = new Set([
  "forEach",
  "every",
  "some",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "filter",
  "map",
  "reduce",
  "reduceRight",
]);

// The array parameter of a callback without a type, where Array.prototype's method calls it on an
// object, as Array.prototype.every.call(object, callback) does, which holds that object.
const isCalledArrayParameter = (parameter: ts.ParameterDeclaration, context: Context) => {
  const callback = parameter.parent;
  const call = callback.parent;
  if (
    parameter.type !== undefined ||
    !(ts.isFunctionExpression(callback) || ts.isArrowFunction(callback)) ||
    !ts.isCallExpression(call) ||
    call.arguments[1] !== callback
  ) {
    return false;
  }
  const method = getArrayMethodCall(call, context);
  const receiver = call.arguments[0];
  return (
    method !== undefined &&
    LOOP_METHODS.has(method) &&
    callback.parameters.indexOf(parameter) === (method.startsWith("reduce") ? 3 : 2) &&
    getKind(receiver, context) === "object"
  );
};

// A call of Object.create, which makes an object that TypeScript types as any, or a const that
// holds what one makes.
export const isCreatedObject = (node: ts.Expression, context: Context) => {
  const value = skipCasts(node);
  const declaration = ts.isIdentifier(value)
    ? getValueDeclaration(getSymbol(value, context.checker), context)
    : undefined;
  const made = skipCasts(
    declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer !== undefined &&
      (ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) !== 0
      ? declaration.initializer
      : value,
  );
  return (
    context.heap !== undefined &&
    isMethodCall(made) &&
    getBuiltIn(made.expression.expression, context) === "Object" &&
    made.expression.name.text === "create"
  );
};

export const getKind = (node: ts.Expression, context: Context): Kind => {
  if (context.heap !== undefined && getWrappedThis(node, context) !== undefined) return "object";
  if (isHeapArray(node, context) || getBound(node, context) !== undefined) return "object";
  if (isCollectionProxy(node, context)) return "object";
  const checker = context.checker;
  if (isHeldErrorName(node, context)) return "object";
  // An object stays one where TypeScript narrows its type, as instanceof Object narrows it to the
  // library's Object.
  const symbol = ts.isIdentifier(node) ? getSymbol(node, checker) : undefined;
  const parameter = getValueDeclaration(symbol, context);
  if (parameter !== undefined && ts.isParameter(parameter) && isSetSource(parameter, context)) {
    return "set";
  }
  if (
    parameter !== undefined &&
    ts.isParameter(parameter) &&
    isCalledArrayParameter(parameter, context)
  ) {
    return "object";
  }
  const declared =
    symbol === undefined || context.heap === undefined
      ? undefined
      : checker.getNonNullableType(checker.getTypeOfSymbol(symbol));
  const declaredMembers =
    declared === undefined ? [] : declared.isUnion() ? declared.types : [declared];
  if (
    declaredMembers.length > 0 &&
    declaredMembers.every((member) => isPlainObject(member, context))
  ) {
    return "object";
  }
  // A name of a function that the heap holds, whatever type a cast gives it.
  if (
    symbol !== undefined &&
    context.heap !== undefined &&
    getHeapClass(node, context) !== undefined
  ) {
    return "object";
  }
  if (
    declared !== undefined &&
    symbol !== undefined &&
    (declared.flags & ts.TypeFlags.Any) !== 0 &&
    (isRestOnly(symbol, context) || isMadeOnly(symbol, context))
  ) {
    return "object";
  }
  // A variable that holds the prototype of an array iterator, which getPrototypeOf types as any.
  const declaration = getValueDeclaration(symbol, context);
  const initializer =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : undefined;
  if (
    context.heap !== undefined &&
    initializer !== undefined &&
    ts.isCallExpression(initializer) &&
    initializer.expression.getText() === "Object.getPrototypeOf" &&
    initializer.arguments.length === 1 &&
    ![undefined, "string"].includes(getKeptIterator(initializer.arguments[0], context))
  ) {
    return "object";
  }
  if (isHeldBuiltInObject(node, context) || isCreatedObject(node, context)) return "object";
  const type = checker.getNonNullableType(checker.getTypeAtLocation(node));
  // A value of a built-in object's type, other than the global that names it, holds that object.
  if (
    context.heap !== undefined &&
    isBuiltInObjectType(type, context) &&
    !isBuiltInObject(node, context)
  ) {
    return "object";
  }
  if (isRegExpArray(type)) return context.heap === undefined ? "other" : "object";
  if (
    context.heap !== undefined &&
    (type.getSymbol()?.name === "RegExp" ||
      isRegExpGroups(node, context) ||
      getRegExpIndicesPart(node, context) !== undefined)
  ) {
    return "object";
  }
  if (isSequenceType(type, checker)) return "sequence";
  if (isSetType(type)) return "set";
  if (isMapType(type)) return "map";
  if (isEvery(type, ts.TypeFlags.StringLike)) return "string";
  // TypeScript types the prototype of a function as any.
  const isFunctionPrototype =
    ts.isPropertyAccessExpression(node) &&
    node.name.text === "prototype" &&
    getHeapClass(node.expression, context) !== undefined;
  return isFunctionPrototype || isHeapType(type, context) ? "object" : "other";
};

const getMembers = (node: ts.Node, context: Context) => {
  const type = context.checker.getTypeAtLocation(node);
  return type.isUnion() ? type.types : [type];
};

// An iterator helper, which Iterator.prototype's methods type as an IteratorObject, steps as a
// generator does.
const isGeneratorMember = (type: ts.Type) =>
  ["Generator", "AsyncGenerator", "IteratorObject"].includes(type.getSymbol()?.name ?? "");

// An array's or a string's iterator, whose type tells, which the code that steps generators steps
// through its heap object.
export const isBuiltInIteratorType = (node: ts.Node, context: Context) =>
  context.heap !== undefined &&
  getMembers(node, context).every((type) =>
    ["ArrayIterator", "StringIterator"].includes(type.getSymbol()?.name ?? ""),
  );

// An object of a class that the script writes, which extends Iterator, whose next the code that
// steps generators calls.
export const isScriptIteratorType = (node: ts.Node, context: Context) =>
  context.heap !== undefined &&
  getMembers(node, context).every((type) => {
    const declaration = getValueDeclaration(type.getSymbol(), context);
    return (
      declaration !== undefined &&
      ts.isClassLike(declaration) &&
      isHeapClass(declaration, context) &&
      getBuiltInBase(declaration, context) === "Iterator"
    );
  });

export const isGeneratorType = (node: ts.Node, context: Context) =>
  getMembers(node, context).every(isGeneratorMember);

export const mayBeGeneratorType = (node: ts.Node, context: Context) =>
  getMembers(node, context).some(isGeneratorMember);

// A generator that isn't async, which an async generator's yield* steps through an async-from-sync
// iterator.
export const isSyncGeneratorType = (node: ts.Node, context: Context) =>
  getMembers(node, context).every((type) =>
    ["Generator", "IteratorObject"].includes(type.getSymbol()?.name ?? ""),
  );

// An array written in place that an async generator's yield* yields each element of, which a
// for await that takes a pattern from each follows.
const isAsyncDelegated = (node: ts.ArrayLiteralExpression) => {
  const outer = ts.findAncestor(node.parent, (ancestor) => !ts.isParenthesizedExpression(ancestor));
  const generator = ts.findAncestor(node, ts.isFunctionLike);
  return (
    outer !== undefined &&
    ts.isYieldExpression(outer) &&
    outer.asteriskToken !== undefined &&
    generator !== undefined &&
    (ts.isFunctionExpression(generator) ||
      ts.isFunctionDeclaration(generator) ||
      ts.isMethodDeclaration(generator)) &&
    generator.asteriskToken !== undefined &&
    (ts.getCombinedModifierFlags(generator) & ts.ModifierFlags.Async) !== 0
  );
};

// A variable that a declaration without a type or a value gives a type that follows what it's
// assigned.
const isAutoTyped = (node: ts.Identifier, context: Context) => {
  const declaration = getValueDeclaration(getSymbol(node, context.checker), context);
  return (
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    declaration.type === undefined &&
    declaration.initializer === undefined
  );
};

// A return of a function that an array pattern's default calls in place, whose generator object the
// pattern takes values from.
const isPatternDefaultReturn = (node: ts.ReturnStatement) => {
  const owner = ts.findAncestor(node, ts.isFunctionLike);
  if (owner === undefined || !(ts.isFunctionExpression(owner) || ts.isArrowFunction(owner))) {
    return false;
  }
  const callee = ts.findAncestor(
    owner.parent,
    (ancestor) => !ts.isParenthesizedExpression(ancestor),
  );
  const call = callee !== undefined && ts.isCallExpression(callee) ? callee : undefined;
  const binding =
    call && ts.findAncestor(call.parent, (ancestor) => !ts.isParenthesizedExpression(ancestor));
  return (
    call !== undefined &&
    binding !== undefined &&
    (ts.isBindingElement(binding) || ts.isParameter(binding)) &&
    binding.initializer !== undefined &&
    ts.isArrayBindingPattern(binding.name)
  );
};

// An argument of a call of a function whose parameter only compares it to other values, with
// Object.is, === or !==.
const isComparedArgument = (node: ts.Expression, call: ts.CallExpression, context: Context) => {
  const position = call.arguments.findIndex(
    (argument) => ts.findAncestor(node, (ancestor) => ancestor === argument) !== undefined,
  );
  const callee = getCallee(call.expression, context);
  const parameter = callee?.parameters[position];
  const symbol =
    parameter !== undefined && ts.isIdentifier(parameter.name)
      ? getSymbol(parameter.name, context.checker)
      : undefined;
  const body = callee?.body;
  if (symbol === undefined || body === undefined) return false;
  return findNodes(
    body,
    (inner): inner is ts.Identifier =>
      ts.isIdentifier(inner) && getSymbol(inner, context.checker) === symbol,
  ).every((reference) => {
    const user = ts.findAncestor(
      reference.parent,
      (ancestor) => !ts.isParenthesizedExpression(ancestor),
    );
    return (
      user !== undefined &&
      ((ts.isBinaryExpression(user) &&
        [
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsEqualsToken,
        ].includes(user.operatorToken.kind)) ||
        (ts.isCallExpression(user) &&
          ts.isPropertyAccessExpression(user.expression) &&
          user.expression.name.text === "is" &&
          ts.isIdentifier(user.expression.expression) &&
          user.expression.expression.text === "Object" &&
          (getSymbol(user.expression, context.checker)?.declarations ?? []).every(
            (declaration) => declaration.getSourceFile().isDeclarationFile,
          )))
    );
  });
};

// The methods of Iterator.prototype that consume what an iterator gives.
export const ITERATOR_CONSUMERS = new Set([
  "toArray",
  "forEach",
  "some",
  "every",
  "find",
  "reduce",
]);

// The methods of Iterator.prototype that make an iterator helper, which tla-ts follows.
export const ITERATOR_HELPERS = new Set(["map", "filter", "flatMap", "take", "drop"]);

// The generator object that a call of Iterator.from, or of its call with a this that evaluating
// can't change, gives back: the generator's @@iterator gives itself, which inherits from
// Iterator.prototype.
export const getIteratorFrom = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  const isCall =
    ts.isPropertyAccessExpression(callee) &&
    callee.name.text === "call" &&
    callee.expression.getText() === "Iterator.from";
  const thisArgument = isCall ? node.arguments.at(0) : undefined;
  const value = node.arguments.at(isCall ? 1 : 0);
  return (isCall || callee.getText() === "Iterator.from") &&
    !node.arguments.some(ts.isSpreadElement) &&
    (thisArgument === undefined ||
      ts.isLiteralExpression(thisArgument) ||
      ts.isIdentifier(thisArgument) ||
      thisArgument.kind === ts.SyntaxKind.NullKeyword) &&
    value !== undefined &&
    isGeneratorType(value, context)
    ? value
    : undefined;
};

// Whether instanceof or getPrototypeOf reads the prototype of a value, which parentheses may wrap.
export const isPrototypeRead = (outer: ts.Node, node: ts.Expression) => {
  const unwrap = (value: ts.Expression): ts.Expression =>
    ts.isParenthesizedExpression(value) ? unwrap(value.expression) : value;
  return (
    (ts.isBinaryExpression(outer) &&
      outer.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword &&
      unwrap(outer.left) === node) ||
    (ts.isCallExpression(outer) &&
      ts.isPropertyAccessExpression(outer.expression) &&
      outer.expression.name.text === "getPrototypeOf" &&
      outer.arguments.length === 1 &&
      unwrap(outer.arguments[0]) === node)
  );
};

// A throw in a try's block, outside any function there, whose catch takes what it throws with an
// array pattern, which takes a generator object's values through its next.
export const isThrownToArrayPattern = (statement: ts.ThrowStatement) => {
  const block = ts.findAncestor(
    statement,
    (ancestor) =>
      ts.isFunctionLike(ancestor) ||
      (ts.isTryStatement(ancestor.parent) && ancestor.parent.tryBlock === ancestor),
  );
  const name =
    block !== undefined && ts.isTryStatement(block.parent)
      ? block.parent.catchClause?.variableDeclaration?.name
      : undefined;
  return name !== undefined && ts.isArrayBindingPattern(name);
};

// A generator object goes only where tla-ts follows it: into a variable that holds generators, to a
// call of its methods or Iterator.prototype's, into Iterator.from, into a comparison, an instanceof,
// or a getPrototypeOf, into a for-of or a for await, into a generator's yield*, or to a catch's
// array pattern.
// Elsewhere, such as an array pattern, a spread, or a function's parameter, code would iterate it
// in ways that tla-ts doesn't follow.
export const rejectGeneratorUse = (node: ts.Expression, context: Context) => {
  if (!getMembers(node, context).some(isGeneratorMember)) return;
  const outer = ts.findAncestor(node.parent, (ancestor) => !ts.isParenthesizedExpression(ancestor));
  const isHeldBy = (assignment: ts.Node | undefined) =>
    assignment !== undefined &&
    ts.isBinaryExpression(assignment) &&
    assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isIdentifier(assignment.left) &&
    (isGeneratorType(assignment.left, context) || isAutoTyped(assignment.left, context));
  const isHeld =
    outer !== undefined &&
    ((ts.isVariableDeclaration(outer) &&
      ts.isIdentifier(outer.name) &&
      isGeneratorType(outer.name, context)) ||
      isHeldBy(outer) ||
      // A pattern that takes values from the generator, in an assignment whose value a variable
      // then holds.
      (ts.isBinaryExpression(outer) &&
        outer.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isArrayLiteralExpression(outer.left) &&
        isHeldBy(
          ts.findAncestor(outer.parent, (ancestor) => !ts.isParenthesizedExpression(ancestor)),
        )) ||
      (ts.isBinaryExpression(outer) &&
        [
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsEqualsToken,
        ].includes(outer.operatorToken.kind)) ||
      isPrototypeRead(outer, node) ||
      (ts.isPropertyAccessExpression(outer) && isGeneratorType(node, context)) ||
      (ts.isForOfStatement(outer) &&
        outer.expression === node &&
        (outer.awaitModifier !== undefined || isGeneratorType(node, context))) ||
      ts.isExpressionStatement(outer) ||
      (ts.isYieldExpression(outer) &&
        outer.asteriskToken !== undefined &&
        isGeneratorType(node, context)) ||
      (ts.isCallExpression(outer) && isComparedArgument(node, outer, context)) ||
      (ts.isArrayLiteralExpression(outer) && isAsyncDelegated(outer)) ||
      (ts.isReturnStatement(outer) && isPatternDefaultReturn(outer)) ||
      (ts.isCallExpression(outer) &&
        outer.arguments.at(0) === node &&
        ts.isPropertyAccessExpression(outer.expression) &&
        outer.expression.name.text === "call" &&
        ts.isPropertyAccessExpression(outer.expression.expression) &&
        outer.expression.expression.expression.getText() === "Iterator.prototype" &&
        (ITERATOR_CONSUMERS.has(outer.expression.expression.name.text) ||
          ITERATOR_HELPERS.has(outer.expression.expression.name.text))) ||
      (ts.isCallExpression(outer) &&
        outer.arguments.at(0) === node &&
        outer.expression.getText() === "Array.from") ||
      (ts.isCallExpression(outer) && getIteratorFrom(outer, context) === node) ||
      (ts.isSpreadElement(outer) && isGeneratorType(node, context)) ||
      (ts.isThrowStatement(outer) && isThrownToArrayPattern(outer)));
  if (!isHeld) throw new TlaTypeScriptError("tla-ts can't follow a generator here", node);
};

export const isObject = (type: ts.Type): boolean =>
  type.isUnion() ? type.types.some(isObject) : (type.flags & ts.TypeFlags.Object) !== 0;

export const isBooleanType = (type: ts.Type) => isEvery(type, ts.TypeFlags.BooleanLike);

export const isBooleanLike = (node: ts.Expression, context: Context) =>
  isBooleanType(context.checker.getTypeAtLocation(node));

export const isNumberLike = (node: ts.Expression, context: Context) =>
  isEvery(context.checker.getTypeAtLocation(node), ts.TypeFlags.NumberLike | ts.TypeFlags.Never);

// A primitive that ToNumber converts without running a method.
export const isPrimitiveIndex = (node: ts.Expression, context: Context) =>
  isEvery(
    context.checker.getTypeAtLocation(node),
    ts.TypeFlags.NumberLike |
      ts.TypeFlags.StringLike |
      ts.TypeFlags.BooleanLike |
      ts.TypeFlags.Null |
      ts.TypeFlags.Undefined |
      ts.TypeFlags.Never,
  );

export const isBigIntLike = (node: ts.Expression, context: Context) =>
  isEvery(context.checker.getTypeAtLocation(node), ts.TypeFlags.BigIntLike);

export const isSet = (node: ts.Expression, context: Context) =>
  isSetType(context.checker.getTypeAtLocation(node));

// TLA+ records only have identifier fields, so an object with numeric keys becomes a function.
export const isNumericKey = (key: string) => /^-?\d+$/.test(key);

export const isFieldName = (key: string) => /^\w*[A-Za-z]\w*$/.test(key) && !KEYWORDS.has(key);

// A key that can't be a record field, such as a keyword, selects a function by its string.
export const getPathStep = (key: string): ExceptPathStep => {
  if (isNumericKey(key)) return { kind: "Index", args: [number(Number(key))] };
  return isFieldName(key) ? { kind: "Field", name: key } : { kind: "Index", args: [string(key)] };
};

export const getField = (value: Expression, key: string) => {
  const step = getPathStep(key);
  return step.kind === "Field" ? field(value, step.name) : index(value, step.args);
};

export const getPropertyKey = (name: ts.PropertyName) =>
  ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)
    ? name.text
    : undefined;

const getLiteral = (type: ts.Type, context: Context): Expression | undefined => {
  if (type.isStringLiteral()) return translateString(type.value, context);
  if (type.isNumberLiteral()) return Number.isInteger(type.value) ? number(type.value) : undefined;
  if (type.flags & ts.TypeFlags.BooleanLiteral) {
    return boolean(context.checker.typeToString(type) === "true");
  }
  if (type.flags & ts.TypeFlags.Null) {
    context.prelude.add("Null");
    return identifier("Null");
  }
  if (type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) {
    return getUndefined(context);
  }
  return undefined;
};

export const isInfinite = (domain: Expression | Infinite): domain is Infinite =>
  "message" in domain;

const getInfinite = (type: ts.Type, reason: string, context: Context): Infinite => ({
  message: `${context.checker.typeToString(type)} isn't finite: ${reason}`,
});

// The first type that has no end, or the domains of every type.
const findDomains = (types: readonly ts.Type[], context: Context, path: readonly ts.Type[]) =>
  types.reduce<Expression[] | Infinite>((domains, type) => {
    if (!Array.isArray(domains)) return domains;
    const domain = findDomain(type, context, path);
    return isInfinite(domain) ? domain : [...domains, domain];
  }, []);

// What TLC compares in a value of a finite type: a primitive's kind, or a set's elements, or a
// function's keys and values, as a tuple, an array, a record, or a map is a function. Undefined and
// null are model values, which TLC compares with any value.
interface Shape {
  kind: "model" | "boolean" | "number" | "string" | "set" | "function";
  keys?: Shape;
  values?: ReadonlyMap<string, Shape>;
  rest?: Shape;
}

const getShape = (type: ts.Type, context: Context): Shape | undefined => {
  const checker = context.checker;
  if (type.isUnion()) {
    return type.types
      .map((member) => getShape(member, context))
      .reduce((left, right) => left && right && unifyShapes(left, right));
  }
  if (type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void | ts.TypeFlags.Null)) {
    return { kind: "model" };
  }
  if (type.flags & ts.TypeFlags.BooleanLike) return { kind: "boolean" };
  if (type.flags & ts.TypeFlags.NumberLike) return { kind: "number" };
  if (type.flags & ts.TypeFlags.StringLike) return { kind: "string" };
  const typeArguments = isTypeReference(type) ? checker.getTypeArguments(type) : [];
  const getShapes = (types: readonly ts.Type[]) => types.map((inner) => getShape(inner, context));
  if (isSetType(type)) {
    const rest = getShape(typeArguments[0], context);
    return rest && { kind: "set", rest };
  }
  if (isMapType(type)) {
    const [keys, rest] = getShapes(typeArguments);
    return keys && rest && { kind: "function", keys, rest };
  }
  if (checker.isArrayType(type)) {
    const rest = getShape(typeArguments[0], context);
    return rest && { kind: "function", keys: { kind: "number" }, rest };
  }
  const properties = checker.isTupleType(type)
    ? typeArguments.map((inner, position) => ({ key: String(position), type: inner }))
    : type.getProperties().map((property) => ({
        key: property.name,
        type: checker.getTypeOfSymbol(property),
      }));
  const shapes = getShapes(properties.map((property) => property.type));
  if (shapes.some((shape) => shape === undefined)) return undefined;
  return {
    kind: "function",
    keys: {
      kind:
        checker.isTupleType(type) || properties.every((property) => isNumericKey(property.key))
          ? "number"
          : "string",
    },
    values: new Map(
      properties.flatMap((property, position) => {
        const shape = shapes[position];
        return shape === undefined ? [] : [[property.key, shape]];
      }),
    ),
  };
};

// The shape of the values of two shapes, or undefined where TLC would compare values of
// different kinds, such as a string with a number, which it can't.
const unifyShapes = (left: Shape, right: Shape): Shape | undefined => {
  if (left.kind === "model") return right;
  if (right.kind === "model") return left;
  if (left.kind !== right.kind) return undefined;
  if (left.kind !== "set" && left.kind !== "function") return left;
  const unifyPart = (leftPart: Shape | undefined, rightPart: Shape | undefined) =>
    leftPart === undefined || rightPart === undefined
      ? { shape: leftPart ?? rightPart }
      : { shape: unifyShapes(leftPart, rightPart), isConflict: true };
  const keys = unifyPart(left.keys, right.keys);
  const rest = unifyPart(left.rest, right.rest);
  const names = [...new Set([...(left.values?.keys() ?? []), ...(right.values?.keys() ?? [])])];
  const values = names.map((name) => ({
    name,
    ...unifyPart(left.values?.get(name) ?? left.rest, right.values?.get(name) ?? right.rest),
  }));
  return [keys, rest, ...values].some(
    (part) => part.isConflict === true && part.shape === undefined,
  )
    ? undefined
    : {
        kind: left.kind,
        keys: keys.shape,
        rest: rest.shape,
        values: new Map(
          values.flatMap((value): [string, Shape][] =>
            value.shape === undefined ? [] : [[value.name, value.shape]],
          ),
        ),
      };
};

// The set of every value that a finite type allows, which TLC enumerates.
// outer holds the types around this one, so a type that holds itself, such as a tree, has no end.
export const findDomain = (
  type: ts.Type,
  context: Context,
  outer: readonly ts.Type[] = [],
): Expression | Infinite => {
  const checker = context.checker;
  if (outer.includes(type)) {
    return { message: `${checker.typeToString(type)} holds itself, so it has no end` };
  }
  const path = [...outer, type];
  if (type.flags & ts.TypeFlags.Boolean) return identifier("BOOLEAN");
  if (type.isUnion()) {
    const literalTypes = type.types
      .filter((member) => getLiteral(member, context) !== undefined)
      .sort((left, right) =>
        left.isNumberLiteral() && right.isNumberLiteral() ? left.value - right.value : 0,
      );
    const others = findDomains(
      type.types.filter((member) => !literalTypes.includes(member)),
      context,
      path,
    );
    if (!Array.isArray(others)) return others;
    if (getShape(type, context) === undefined) {
      return {
        message: `${checker.typeToString(type)} mixes values that TLC can't compare, such as a string and a number`,
        isIncomparable: true,
      };
    }
    const enumerated = literalTypes.flatMap((member) => getLiteral(member, context) ?? []);
    return [...(enumerated.length > 0 ? [set(enumerated)] : []), ...others].reduce((left, right) =>
      apply("\\cup", [left, right]),
    );
  }
  const literal = getLiteral(type, context);
  if (literal !== undefined) return set([literal]);
  if (type.flags & ts.TypeFlags.Number) return getIntegers();
  if (type.flags & ts.TypeFlags.String) return getStrings();
  // A value can't stand for an object that the heap holds.
  if (isHeldCollectionType(type, context)) {
    return getInfinite(
      type,
      "tla-ts can't list the arrays, sets, and maps that the heap holds",
      context,
    );
  }
  // A subclass's instances are objects, which no domain lists.
  if (
    ((isSetType(type) || isMapType(type)) && getCollectionType(type) === type) ||
    checker.isTupleType(type)
  ) {
    const elements = findDomains(
      isTypeReference(type) ? checker.getTypeArguments(type) : [],
      context,
      path,
    );
    if (!Array.isArray(elements)) return elements;
    if (isSetType(type)) return apply("SUBSET", [elements[0]]);
    if (isMapType(type)) {
      const keys = context.names.getFresh("keys");
      return apply("UNION", [
        map(functionSet(identifier(keys), elements[1]), [
          bound(keys, apply("SUBSET", [elements[0]])),
        ]),
      ]);
    }
    const isFixed =
      isTypeReference(type) &&
      (type.target as ts.TupleType).elementFlags.every(
        (flags) => (flags & ts.ElementFlags.Required) !== 0,
      );
    if (!isFixed) {
      return getInfinite(
        type,
        "tuples with optional or rest elements can have any length",
        context,
      );
    }
    if (elements.length === 0) return set([tuple([])]);
    if (elements.length > 1) return product(elements);
    const element = context.names.getFresh("element");
    return map(tuple([identifier(element)]), [bound(element, elements[0])]);
  }
  if (checker.isArrayType(type) && isTypeReference(type)) {
    const element = findDomain(checker.getTypeArguments(type)[0], context, path);
    if (isInfinite(element)) return element;
    const length = context.names.getFresh("length");
    return apply("UNION", [
      map(functionSet(apply("..", [number(1), identifier(length)]), element), [
        bound(length, apply("..", [number(0), number(MAX_ARRAY_LENGTH)])),
      ]),
    ]);
  }
  const properties = type.getProperties();
  const isRecord =
    type.flags & ts.TypeFlags.Object &&
    type.getCallSignatures().length === 0 &&
    checker.getIndexInfosOfType(type).length === 0 &&
    properties.length > 0;
  if (!isRecord) {
    return getInfinite(
      type,
      "use a union of literals, or records, tuples, and sets of them",
      context,
    );
  }
  if (context.heap !== undefined) {
    return getInfinite(type, "tla-ts can't list the objects that the heap holds", context);
  }
  const optional = properties.find((property) => property.flags & ts.SymbolFlags.Optional);
  if (optional !== undefined) {
    return getInfinite(type, `the optional field ${optional.name} may be missing`, context);
  }
  const fields = findDomains(
    properties.map((property) => checker.getTypeOfSymbol(property)),
    context,
    path,
  );
  if (!Array.isArray(fields)) return fields;
  const keys = properties.map((property) => property.name);
  const unnamed = keys.find((key) => !isNumericKey(key) && !isFieldName(key));
  if (unnamed !== undefined)
    return getInfinite(type, `TLA+ can't name the field ${unnamed}`, context);
  if (!keys.some(isNumericKey)) {
    return record(
      "RecordSet",
      keys.map((key, position) => ({ name: key, value: fields[position] })),
    );
  }
  const fieldTypes = properties.map((property) => checker.getTypeOfSymbol(property));
  if (!keys.every(isNumericKey) || fieldTypes.some((fieldType) => fieldType !== fieldTypes[0])) {
    return {
      message: `${checker.typeToString(type)} has numeric keys, so every key must be a number with the same value type`,
    };
  }
  return functionSet(
    set(
      keys
        .map(Number)
        .sort((left, right) => left - right)
        .map(number),
    ),
    fields[0],
  );
};

// The values that a parameter of an exported function, or a variable with no initializer, ranges
// over, which TLC lists.
export const getDomain = (type: ts.Type, node: ts.Node, context: Context) => {
  const domain = findDomain(type, context);
  if (!isInfinite(domain)) return domain;
  const name =
    (ts.isParameter(node) || ts.isVariableDeclaration(node)) && ts.isIdentifier(node.name)
      ? node.name.text
      : undefined;
  if (name === undefined) throw new TlaTypeScriptError(domain.message, node);
  throw new TlaTypeScriptError(
    ts.isParameter(node)
      ? `tla-ts can't choose every value of the parameter ${name}: ${domain.message}. Give ${name} a finite type, such as a union of literals, or records and tuples of them, or call the function from a script instead`
      : `tla-ts can't start ${name} at every value of its type: ${domain.message}. Give ${name} an initializer`,
    node,
  );
};

// A call that tla-ts can't compile, such as to a package or Math.random(), as any value of its type.
// The exported function that makes the call chooses the value, so a call that may run more than
// once per step, as in a callback or a helper, stays an error. A call that may run the program's
// own code, whose value only that code tells, stays one too.
export const translateUnknown = (
  node: ts.CallExpression | ts.NewExpression,
  message: string,
  context: Context,
) => {
  const unknowns = context.unknowns;
  const domain = findDomain(context.checker.getTypeAtLocation(node), context);
  // The program's own code may run, but for a function that the exported function takes, which
  // tla-ts rejects as it chooses the parameter.
  const declaration = context.checker.getResolvedSignature(node)?.getDeclaration();
  const parameter = getValueDeclaration(getSymbol(node.expression, context.checker), context);
  const isLibrary =
    (declaration !== undefined && declaration.getSourceFile().isDeclarationFile) ||
    (parameter !== undefined && ts.isParameter(parameter) && parameter.parent === unknowns?.owner);
  if (
    !isLibrary ||
    unknowns === undefined ||
    ts.findAncestor(node.parent, ts.isFunctionLike) !== unknowns.owner ||
    isInfinite(domain)
  ) {
    throw new TlaTypeScriptError(message, node);
  }
  const callee = ts.isPropertyAccessExpression(node.expression)
    ? node.expression.name.text
    : node.expression.getText();
  const name = context.names.getFresh(callee);
  unknowns.values.push({ name, domain, node });
  return identifier(name);
};

// Compiles an exported function, and returns the calls in it that tla-ts can't compile.
export const collectUnknowns = <T>(owner: ts.Node, context: Context, translate: () => T) => {
  const values: Unknown[] = [];
  context.unknowns = { owner, values };
  const value = translate();
  context.unknowns = undefined;
  return { value, unknowns: values };
};

// A definition whose body holds for each value, \E in an action and \A in a check, of the calls it
// makes that tla-ts can't compile.
export const defineWithUnknowns = (
  node: ts.Node,
  name: string,
  params: OperatorParam[],
  quantifier: "Exists" | "Forall",
  body: Expression,
  unknowns: Unknown[],
): OperatorDefinition =>
  defineAt(
    node,
    name,
    params,
    quantify(
      quantifier,
      unknowns.map((unknown) => bound(unknown.name, unknown.domain)),
      body,
    ),
  );
