import ts from "@typescript/typescript6";
import type { ExceptPathStep, Expression, OperatorDefinition, OperatorParam } from "../ast";
import { type Context, getUndefined, isHeapClass, translateString, type Unknown } from "./context";
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
const isTypeReference = (type: ts.Type): type is ts.TypeReference =>
  (type.flags & ts.TypeFlags.Object) !== 0 &&
  ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) !== 0;

const getTypeName = (type: ts.Type) => type.getSymbol()?.getName() ?? "";

const isSetType = (type: ts.Type) => ["Set", "ReadonlySet"].includes(getTypeName(type));

const isMapType = (type: ts.Type) => ["Map", "ReadonlyMap"].includes(getTypeName(type));

// Arrays, tuples, and unions of them, such as [] | [number] | [number, number].
export const isSequenceType = (type: ts.Type, checker: ts.TypeChecker): boolean =>
  type.isUnion()
    ? type.types.every((member) => isSequenceType(member, checker))
    : checker.isArrayType(type) || checker.isTupleType(type);

// Whether every member of a type, such as each literal in a union, has the given flags.
const isEvery = (type: ts.Type, flags: ts.TypeFlags): boolean =>
  type.isUnion()
    ? type.types.every((member) => isEvery(member, flags))
    : (type.flags & flags) !== 0;

// The plain objects that built-in functions take or give.
const LIBRARY_OBJECTS = new Set(["PropertyDescriptor", "PropertyDescriptorMap"]);

// An object type, or the object type, which any object may have.
const isPlainObject = (type: ts.Type, context: Context) => {
  const checker = context.checker;
  const symbol = type.getSymbol();
  if ((type.flags & ts.TypeFlags.NonPrimitive) !== 0) return true;
  const declaration = symbol?.valueDeclaration;
  if (
    declaration !== undefined &&
    ts.isClassLike(declaration) &&
    isHeapClass(declaration, context)
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

export const getKind = (node: ts.Expression, context: Context): Kind => {
  const checker = context.checker;
  const type = checker.getNonNullableType(checker.getTypeAtLocation(node));
  if (isSequenceType(type, checker)) return "sequence";
  if (isSetType(type)) return "set";
  if (isMapType(type)) return "map";
  if (isEvery(type, ts.TypeFlags.StringLike)) return "string";
  return isHeapType(type, node, context) ? "object" : "other";
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
