import ts from "typescript";
import { type Context, getTypeArguments, isMapType, isSetType } from "./context";
import { TsproverError } from "./errors";
import { wrap } from "./formula";

export const translateString = (value: string, context: Context) =>
  context.modelValues.get(value) ?? JSON.stringify(value);

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

// TLA+ records only have identifier fields, so an object with numeric keys becomes a function.
export const isNumericKey = (key: string) => /^-?\d+$/.test(key);

// The set of every value that a finite type allows, which TLC enumerates.
export const getDomain = (type: ts.Type, node: ts.Node, context: Context): string => {
  const checker = context.checker;
  const typeName = checker.typeToString(type);
  if (type.flags & ts.TypeFlags.Boolean) return "BOOLEAN";
  if (type.isUnion()) {
    const literals = type.types.map((member) => getLiteral(member, context));
    const others = type.types
      .filter((_, index) => literals[index] === undefined)
      .map((member) => getDomain(member, node, context));
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
  if (isSetType(type)) {
    return `SUBSET ${wrap(getDomain(getTypeArguments(type, checker)[0], node, context))}`;
  }
  if (isMapType(type)) {
    const typeArguments = getTypeArguments(type, checker);
    const keys = context.names.getFresh("keys");
    return `UNION {[${keys} -> ${getDomain(typeArguments[1], node, context)}] : ${keys} \\in SUBSET ${wrap(getDomain(typeArguments[0], node, context))}}`;
  }
  if (checker.isTupleType(type)) {
    const target = (type as ts.TypeReference).target as ts.TupleType;
    if (target.elementFlags.some((flags) => !(flags & ts.ElementFlags.Required))) {
      throw new TsproverError(
        `${typeName} isn't finite: tuples with optional or rest elements can have any length`,
        node,
      );
    }
    const elements = getTypeArguments(type, checker).map((element) =>
      getDomain(element, node, context),
    );
    if (elements.length === 0) return "{<<>>}";
    if (elements.length > 1) return elements.map(wrap).join(" \\X ");
    const element = context.names.getFresh("element");
    return `{<<${element}>> : ${element} \\in ${elements[0]}}`;
  }
  if (checker.isArrayType(type))
    throw new TsproverError(
      `${typeName} isn't finite: arrays can have any length, so use a tuple`,
      node,
    );
  const properties = type.getProperties();
  const isRecord =
    type.flags & ts.TypeFlags.Object &&
    type.getCallSignatures().length === 0 &&
    checker.getIndexInfosOfType(type).length === 0 &&
    properties.length > 0;
  if (!isRecord)
    throw new TsproverError(
      `${typeName} isn't finite: use a union of literals, or records, tuples, and sets of them`,
      node,
    );
  const fields = properties.map((property) => {
    if (property.flags & ts.SymbolFlags.Optional) {
      throw new TsproverError(
        `${typeName} isn't finite: the optional field ${property.name} may be missing`,
        node,
      );
    }
    return {
      key: property.name,
      domain: getDomain(checker.getTypeOfSymbol(property), node, context),
    };
  });
  if (!fields.some((field) => isNumericKey(field.key))) {
    return `[${fields.map((field) => `${field.key} : ${field.domain}`).join(", ")}]`;
  }
  if (!fields.every((field) => isNumericKey(field.key) && field.domain === fields[0].domain)) {
    throw new TsproverError(
      `${typeName} has numeric keys, so every key must be a number with the same value type`,
      node,
    );
  }
  const keys = fields.map((field) => Number(field.key)).sort((left, right) => left - right);
  return `[{${keys.join(", ")}} -> ${fields[0].domain}]`;
};
