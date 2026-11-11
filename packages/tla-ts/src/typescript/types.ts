import ts from "@typescript/typescript6";
import type { ExceptPathStep, Expression, OperatorDefinition, OperatorParam } from "../ast";
import {
  type Context,
  getHeapClass,
  getSymbol,
  getUndefined,
  isHeapClass,
  isFunctionObject,
  isHeapFunction,
  translateString,
  type Unknown,
  getBound,
  isNestedFunction,
} from "./context";
import { KEYWORDS } from "../lexer";
import { TlaTypeScriptError } from "../errors";
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
}

// The checker only gives type arguments of type references, which the public API can't detect.
export const isTypeReference = (type: ts.Type): type is ts.TypeReference =>
  (type.flags & ts.TypeFlags.Object) !== 0 &&
  ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) !== 0;

const getTypeName = (type: ts.Type) => type.getSymbol()?.getName() ?? "";

// A weak collection holds its keys as a collection does, as nothing can list or count them.
const isSetType = (type: ts.Type) => ["Set", "ReadonlySet", "WeakSet"].includes(getTypeName(type));

const isMapType = (type: ts.Type) => ["Map", "ReadonlyMap", "WeakMap"].includes(getTypeName(type));

// Arrays, tuples, and unions of them, such as [] | [number] | [number, number].
export const isSequenceType = (type: ts.Type, checker: ts.TypeChecker): boolean =>
  type.isUnion()
    ? type.types.every((member) => isSequenceType(member, checker))
    : checker.isArrayType(type) || checker.isTupleType(type);

// Whether every member of a type, such as each literal in a union, has the given flags.
export const isEvery = (type: ts.Type, flags: ts.TypeFlags): boolean =>
  type.isUnion()
    ? type.types.every((member) => isEvery(member, flags))
    : (type.flags & flags) !== 0;

// The plain objects that built-in functions take or give.
const LIBRARY_OBJECTS = new Set([
  "Promise",
  "PromiseFulfilledResult",
  "PromiseRejectedResult",
  "PropertyDescriptor",
  "TypedPropertyDescriptor",
  "PropertyDescriptorMap",
  "IteratorYieldResult",
  "IteratorReturnResult",
  "IArguments",
  "Date",
  "ArrayBuffer",
  "SharedArrayBuffer",
  "DataView",
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
  "Boolean",
  "Number",
  "String",
]);

// An object type, or the object type, which any object may have.
const isPlainObject = (type: ts.Type, context: Context): boolean => {
  const checker = context.checker;
  const symbol = type.getSymbol();
  const readonly = type.aliasSymbol?.name === "Readonly" ? type.aliasTypeArguments?.[0] : undefined;
  if (readonly !== undefined) return isPlainObject(readonly, context);
  if (type.isIntersection()) return type.types.every((member) => isPlainObject(member, context));
  if ((type.flags & ts.TypeFlags.NonPrimitive) !== 0) return true;
  const declaration = symbol?.valueDeclaration;
  if (
    declaration !== undefined &&
    ((ts.isClassLike(declaration) && isHeapClass(declaration, context)) ||
      isHeapFunction(declaration, context) ||
      isFunctionObject(declaration, context) ||
      isNestedFunction(declaration, context))
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
          // The object that Proxy.revocable gives, whose type its declaration writes in place.
          (symbol.declarations ?? []).some(
            (declaration) =>
              ts.isTypeLiteralNode(declaration) &&
              ts.isMethodSignature(declaration.parent) &&
              declaration.parent.name.getText() === "revocable",
          ) ||
          (symbol.declarations ?? []).every(
            (declaration) => !declaration.getSourceFile().isDeclarationFile,
          )))
  );
};

// Whether a value of a type may be an object in the heap.
export const hasHeapType = (type: ts.Type, context: Context) =>
  context.heap !== undefined &&
  (type.isUnion() ? type.types : [type]).some((member) => isPlainObject(member, context));

export const isHeapType = (type: ts.Type, node: ts.Node | undefined, context: Context) => {
  if (context.heap === undefined) return false;
  const members = type.isUnion() ? type.types : [type];
  const objects = members.filter((member) => isPlainObject(member, context));
  if (objects.length > 0 && objects.length < members.length) {
    throw new TlaTypeScriptError("Give this either objects or other values", node);
  }
  return objects.length > 0;
};

// In a script with objects, a value of type any may be an object, so its properties are unknown.
export const rejectAnyReceiver = (node: ts.Expression, context: Context) => {
  if (
    context.heap !== undefined &&
    (context.checker.getTypeAtLocation(node).flags & ts.TypeFlags.Any) !== 0 &&
    getKind(node, context) !== "object"
  ) {
    throw new TlaTypeScriptError("Give this value a type to use its properties", node);
  }
};

// The array literal that an expression is, or that the variable it names holds.
export const getArrayLiteral = (node: ts.Expression, context: Context) => {
  if (ts.isArrayLiteralExpression(node)) return node;
  const declaration = ts.isIdentifier(node)
    ? getSymbol(node, context.checker)?.valueDeclaration
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
    return symbol === undefined || (symbol.flags & ts.SymbolFlags.Transient) !== 0
      ? undefined
      : [symbol];
  }
  if (!ts.isElementAccessExpression(node)) return undefined;
  const keyType = checker.getTypeAtLocation(node.argumentExpression);
  const keys = keyType.isUnion() ? keyType.types : [keyType];
  const objectType = checker.getNonNullableType(checker.getTypeAtLocation(node.expression));
  const fields = keys.map((key) =>
    key.isStringLiteral() ? checker.getPropertyOfType(objectType, key.value) : undefined,
  );
  return fields.every(
    (field) => field !== undefined && (field.flags & ts.SymbolFlags.Transient) === 0,
  )
    ? fields.filter((field) => field !== undefined)
    : undefined;
};

export const isHeapArray = (node: ts.Expression, context: Context) => {
  if (context.heapArrays.size === 0) return false;
  const literal = getArrayLiteral(node, context);
  const declaration = ts.isIdentifier(node)
    ? getSymbol(node, context.checker)?.valueDeclaration
    : undefined;
  const fields = getAccessedFields(node, context.checker);
  return (
    (literal !== undefined && context.heapArrays.has(literal)) ||
    (declaration !== undefined &&
      (ts.isBindingElement(declaration) || ts.isParameter(declaration)) &&
      context.heapArrays.has(declaration)) ||
    (fields !== undefined &&
      fields.length > 0 &&
      fields.every((field) =>
        (field.declarations ?? []).some((fieldDeclaration) =>
          context.heapArrays.has(fieldDeclaration),
        ),
      ))
  );
};

// The built-in collection that a set or a map is, which a weak one's type names.
export const getCollection = (node: ts.Expression, context: Context) => {
  const kind = getKind(node, context);
  const isWeak = getTypeName(context.checker.getTypeAtLocation(node)).startsWith("Weak");
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
  ["RegExpExecArray", "RegExpMatchArray"].includes(type.getSymbol()?.name ?? "");

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

export const getKind = (node: ts.Expression, context: Context): Kind => {
  if (isHeapArray(node, context) || getBound(node, context) !== undefined) return "object";
  const checker = context.checker;
  // An object stays one where TypeScript narrows its type, as instanceof Object narrows it to the
  // library's Object.
  const symbol = ts.isIdentifier(node) ? getSymbol(node, checker) : undefined;
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
  const type = checker.getNonNullableType(checker.getTypeAtLocation(node));
  if (isRegExpArray(type)) return context.heap === undefined ? "other" : "object";
  if (
    context.heap !== undefined &&
    (type.getSymbol()?.name === "RegExp" || isRegExpGroups(node, context))
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
  return isFunctionPrototype || isHeapType(type, node, context) ? "object" : "other";
};

const getMembers = (node: ts.Node, context: Context) => {
  const type = context.checker.getTypeAtLocation(node);
  return type.isUnion() ? type.types : [type];
};

const isGeneratorMember = (type: ts.Type) =>
  ["Generator", "AsyncGenerator"].includes(type.getSymbol()?.name ?? "");

export const isGeneratorType = (node: ts.Node, context: Context) =>
  getMembers(node, context).every(isGeneratorMember);

// A variable that a declaration without a type or a value gives a type that follows what it's
// assigned.
const isAutoTyped = (node: ts.Identifier, context: Context) => {
  const declaration = getSymbol(node, context.checker)?.valueDeclaration;
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

// A generator object goes only where tla-ts follows it: into a variable that holds generators, to a
// call of its methods, into a comparison, or into a for await. Elsewhere, such as an array pattern, a spread, or a
// function's parameter, code would iterate it in ways that tla-ts doesn't follow.
export const rejectGeneratorUse = (node: ts.Expression, context: Context) => {
  if (!getMembers(node, context).some(isGeneratorMember)) return;
  const outer = ts.findAncestor(node.parent, (ancestor) => !ts.isParenthesizedExpression(ancestor));
  const isHeld =
    outer !== undefined &&
    ((ts.isVariableDeclaration(outer) &&
      ts.isIdentifier(outer.name) &&
      isGeneratorType(outer.name, context)) ||
      (ts.isBinaryExpression(outer) &&
        outer.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isIdentifier(outer.left) &&
        (isGeneratorType(outer.left, context) || isAutoTyped(outer.left, context))) ||
      (ts.isBinaryExpression(outer) &&
        [
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsEqualsToken,
        ].includes(outer.operatorToken.kind)) ||
      (ts.isPropertyAccessExpression(outer) && isGeneratorType(node, context)) ||
      (ts.isForOfStatement(outer) &&
        outer.awaitModifier !== undefined &&
        outer.expression === node) ||
      ts.isExpressionStatement(outer) ||
      (ts.isReturnStatement(outer) && isPatternDefaultReturn(outer)));
  if (!isHeld) throw new TlaTypeScriptError("tla-ts can't follow a generator here", node);
};

export const isObject = (type: ts.Type): boolean =>
  type.isUnion() ? type.types.some(isObject) : (type.flags & ts.TypeFlags.Object) !== 0;

export const isBooleanType = (type: ts.Type) => isEvery(type, ts.TypeFlags.BooleanLike);

export const isBooleanLike = (node: ts.Expression, context: Context) =>
  isBooleanType(context.checker.getTypeAtLocation(node));

export const isNumberLike = (node: ts.Expression, context: Context) =>
  isEvery(context.checker.getTypeAtLocation(node), ts.TypeFlags.NumberLike | ts.TypeFlags.Never);

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
const findDomains = (types: readonly ts.Type[], context: Context) =>
  types.reduce<Expression[] | Infinite>((domains, type) => {
    if (!Array.isArray(domains)) return domains;
    const domain = findDomain(type, context);
    return isInfinite(domain) ? domain : [...domains, domain];
  }, []);

// The set of every value that a finite type allows, which TLC enumerates.
export const findDomain = (type: ts.Type, context: Context): Expression | Infinite => {
  const checker = context.checker;
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
    );
    if (!Array.isArray(others)) return others;
    const enumerated = literalTypes.flatMap((member) => getLiteral(member, context) ?? []);
    return [...(enumerated.length > 0 ? [set(enumerated)] : []), ...others].reduce((left, right) =>
      apply("\\cup", [left, right]),
    );
  }
  const literal = getLiteral(type, context);
  if (literal !== undefined) return set([literal]);
  if (type.flags & ts.TypeFlags.Number) return getIntegers();
  if (type.flags & ts.TypeFlags.String) return getStrings();
  if (isSetType(type) || isMapType(type) || checker.isTupleType(type)) {
    const elements = findDomains(
      isTypeReference(type) ? checker.getTypeArguments(type) : [],
      context,
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
    const element = findDomain(checker.getTypeArguments(type)[0], context);
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
  const optional = properties.find((property) => property.flags & ts.SymbolFlags.Optional);
  if (optional !== undefined) {
    return getInfinite(type, `the optional field ${optional.name} may be missing`, context);
  }
  const fields = findDomains(
    properties.map((property) => checker.getTypeOfSymbol(property)),
    context,
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

export const getDomain = (type: ts.Type, node: ts.Node, context: Context) => {
  const domain = findDomain(type, context);
  if (isInfinite(domain)) throw new TlaTypeScriptError(domain.message, node);
  return domain;
};

// A call that tla-ts can't compile, such as to a package or Math.random(), as any value of its type.
// The exported function that makes the call chooses the value, so a call that may run more than
// once per step, as in a callback or a helper, stays an error.
export const translateUnknown = (
  node: ts.CallExpression | ts.NewExpression,
  message: string,
  context: Context,
) => {
  const unknowns = context.unknowns;
  const domain = findDomain(context.checker.getTypeAtLocation(node), context);
  if (
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
