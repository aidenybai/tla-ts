import { getValueHash, isSameValue, type Value } from "./values";

const canonicalizeElements = (elements: Value[], canonicalize: (value: Value) => Value) => {
  for (let index = 0; index < elements.length; index++) {
    elements[index] = canonicalize(elements[index]);
  }
};

export const createCanonicalizer = () => {
  const canonicalValues = new Map<number, Value | Value[]>();
  const canonicalize = (value: Value): Value => {
    if (typeof value !== "object" || (value.kind !== "Set" && value.kind !== "Function")) {
      return value;
    }
    const hash = getValueHash(value);
    const bucket = canonicalValues.get(hash);
    if (bucket !== undefined && !Array.isArray(bucket)) {
      if (bucket === value || isSameValue(bucket, value)) return bucket;
    }
    if (Array.isArray(bucket)) {
      for (let index = 0; index < bucket.length; index++) {
        if (bucket[index] === value || isSameValue(bucket[index], value)) return bucket[index];
      }
    }
    if (value.kind === "Set") canonicalizeElements(value.elements, canonicalize);
    else {
      canonicalizeElements(value.domain, canonicalize);
      canonicalizeElements(value.range, canonicalize);
    }
    if (bucket === undefined) canonicalValues.set(hash, value);
    else if (Array.isArray(bucket)) bucket.push(value);
    else canonicalValues.set(hash, [bucket, value]);
    return value;
  };
  return (state: Value[]) => {
    for (let index = 0; index < state.length; index++) state[index] = canonicalize(state[index]);
    return state;
  };
};
