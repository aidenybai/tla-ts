import { formatValue, type Value } from "tla-ts";

const isIdentifier = (key: string) => /^[A-Za-z_$][\w$]*$/.test(key);

// Prints a TLA+ value as the TypeScript value it came from.
export const formatJs = (value: Value): string => {
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (value.kind === "ModelValue") {
    if (value.name === "Null") return "null";
    if (value.name === "Undefined") return "undefined";
    return JSON.stringify(value.name);
  }
  if (value.kind === "Set" || value.kind === "MixedSet") {
    return `new Set([${value.elements.map(formatJs).join(", ")}])`;
  }
  if (value.kind === "Interval") {
    const elements = Array.from(
      { length: Math.max(0, value.high - value.low + 1) },
      (_, index) => value.low + index,
    );
    return `new Set([${elements.join(", ")}])`;
  }
  if (value.kind !== "Function") return formatValue(value);
  if (value.domain.every((key, index) => key === index + 1)) {
    return `[${value.range.map(formatJs).join(", ")}]`;
  }
  if (value.domain.every((key) => typeof key === "string")) {
    const fields = value.domain.map(
      (key, index) =>
        `${isIdentifier(String(key)) ? key : JSON.stringify(key)}: ${formatJs(value.range[index])}`,
    );
    return `{ ${fields.join(", ")} }`;
  }
  const entries = value.domain.map(
    (key, index) => `[${formatJs(key)}, ${formatJs(value.range[index])}]`,
  );
  return `new Map([${entries.join(", ")}])`;
};
