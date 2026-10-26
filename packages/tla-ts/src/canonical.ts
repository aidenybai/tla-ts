import { getValueHash, isSameValue, type Value } from "./values";

export const createCanonicalizer = () => {
  const canonicalValues = new Map<number, Value | Value[]>();
  const canonicalize = (value: Value): Value => {
    if (typeof value !== "object" || (value.kind !== "Set" && value.kind !== "Function")) {
      return value;
    }
    const hash = getValueHash(value);
    const bucket = canonicalValues.get(hash);
    if (bucket === undefined) {
      canonicalValues.set(hash, value);
      return value;
    }
    if (!Array.isArray(bucket)) {
      if (isSameValue(bucket, value)) return bucket;
      canonicalValues.set(hash, [bucket, value]);
      return value;
    }
    for (let index = 0; index < bucket.length; index++) {
      if (isSameValue(bucket[index], value)) return bucket[index];
    }
    bucket.push(value);
    return value;
  };
  return (state: Value[]) => {
    for (let index = 0; index < state.length; index++) state[index] = canonicalize(state[index]);
    return state;
  };
};
