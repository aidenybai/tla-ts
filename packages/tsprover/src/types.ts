import ts from "typescript";
import { type Context, translateString } from "./context";
import { TsproverError } from "./errors";
import { wrap } from "./formula";

export type Kind = "sequence" | "set" | "map" | "string" | "other";

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
const isSequenceType = (type: ts.Type, checker: ts.TypeChecker): boolean =>
  type.isUnion()
    ? type.types.every((member) => isSequenceType(member, checker))
    : checker.isArrayType(type) || checker.isTupleType(type);

// Whether every member of a type, such as each literal in a union, has the given flags.
const isEvery = (type: ts.Type, flags: ts.TypeFlags): boolean =>
  type.isUnion()
    ? type.types.every((member) => isEvery(member, flags))
    : (type.flags & flags) !== 0;

export const getKind = (node: ts.Expression, context: Context): Kind => {
  const checker = context.checker;
  const type = checker.getNonNullableType(checker.getTypeAtLocation(node));
  if (isSequenceType(type, checker)) return "sequence";
  if (isSetType(type)) return "set";
  if (isMapType(type)) return "map";
  if (isEvery(type, ts.TypeFlags.StringLike)) return "string";
  return "other";
};

export const isBooleanLike = (node: ts.Expression, context: Context) =>
  isEvery(context.checker.getTypeAtLocation(node), ts.TypeFlags.BooleanLike);

export const isSet = (node: ts.Expression, context: Context) =>
  isSetType(context.checker.getTypeAtLocation(node));

// TLA+ records only have identifier fields, so an object with numeric keys becomes a function.
export const isNumericKey = (key: string) => /^-?\d+$/.test(key);

const getLiteral = (type: ts.Type, context: Context) => {
  if (type.isStringLiteral()) return translateString(type.value, context);
  if (type.isNumberLiteral()) return Number.isInteger(type.value) ? String(type.value) : undefined;
  if (type.flags & ts.TypeFlags.BooleanLiteral) {
    return context.checker.typeToString(type) === "true" ? "TRUE" : "FALSE";
  }
  if (type.flags & ts.TypeFlags.Null) {
    context.prelude.add("Null");
    return "Null";
  }
  if (type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) {
    context.prelude.add("Undefined");
    return "Undefined";
  }
  return undefined;
};

const getInfinite = (type: ts.Type, reason: string, context: Context): Infinite => ({
  message: `${context.checker.typeToString(type)} isn't finite: ${reason}`,
});

// The first type that has no end, or the domains of every type.
const findDomains = (types: readonly ts.Type[], context: Context) =>
  types.reduce<string[] | Infinite>((domains, type) => {
    if (!Array.isArray(domains)) return domains;
    const domain = findDomain(type, context);
    return typeof domain === "string" ? [...domains, domain] : domain;
  }, []);

// The set of every value that a finite type allows, which TLC enumerates.
export const findDomain = (type: ts.Type, context: Context): string | Infinite => {
  const checker = context.checker;
  if (type.flags & ts.TypeFlags.Boolean) return "BOOLEAN";
  if (type.isUnion()) {
    const literals = type.types.map((member) => getLiteral(member, context));
    const others = findDomains(
      type.types.filter((_, index) => literals[index] === undefined),
      context,
    );
    if (!Array.isArray(others)) return others;
    const enumerated = literals
      .filter((literal) => literal !== undefined)
      .sort((left, right) =>
        /^-?\d+$/.test(left) && /^-?\d+$/.test(right) ? Number(left) - Number(right) : 0,
      );
    return [...(enumerated.length > 0 ? [`{${enumerated.join(", ")}}`] : []), ...others]
      .map((domain, _, domains) => (domains.length > 1 ? wrap(domain) : domain))
      .join(" \\cup ");
  }
  const literal = getLiteral(type, context);
  if (literal !== undefined) return `{${literal}}`;
  if (isSetType(type) || isMapType(type) || checker.isTupleType(type)) {
    const elements = findDomains(
      isTypeReference(type) ? checker.getTypeArguments(type) : [],
      context,
    );
    if (!Array.isArray(elements)) return elements;
    if (isSetType(type)) return `SUBSET ${wrap(elements[0])}`;
    if (isMapType(type)) {
      const keys = context.names.getFresh("keys");
      return `UNION {[${keys} -> ${elements[1]}] : ${keys} \\in SUBSET ${wrap(elements[0])}}`;
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
    if (elements.length === 0) return "{<<>>}";
    if (elements.length > 1) return elements.map(wrap).join(" \\X ");
    const element = context.names.getFresh("element");
    return `{<<${element}>> : ${element} \\in ${elements[0]}}`;
  }
  if (checker.isArrayType(type)) {
    return getInfinite(type, "arrays can have any length, so use a tuple", context);
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
  if (!keys.some(isNumericKey)) {
    return `[${keys.map((key, index) => `${key} : ${fields[index]}`).join(", ")}]`;
  }
  if (!keys.every(isNumericKey) || fields.some((field) => field !== fields[0])) {
    return {
      message: `${checker.typeToString(type)} has numeric keys, so every key must be a number with the same value type`,
    };
  }
  return `[{${keys
    .map(Number)
    .sort((left, right) => left - right)
    .join(", ")}} -> ${fields[0]}]`;
};

export const getDomain = (type: ts.Type, node: ts.Node, context: Context) => {
  const domain = findDomain(type, context);
  if (typeof domain !== "string") throw new TsproverError(domain.message, node);
  return domain;
};
