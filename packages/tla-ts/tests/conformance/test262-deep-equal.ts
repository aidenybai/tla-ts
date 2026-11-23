// test262's harness/deepEqual.js, typed so that tla-ts can compile it. Its comparison is the
// original's. Its message formats neither value, as assert.js's here format none, and format, which
// runs only where the assertion fails, is left out.
/* oxlint-disable typescript/no-explicit-any */

namespace assert {
  const EQUAL = 1;
  const NOT_EQUAL = -1;
  const UNKNOWN = 0;

  type Comparison = typeof EQUAL | typeof NOT_EQUAL | typeof UNKNOWN;
  type Cache = Map<any, Map<any, Comparison>>;

  export function deepEqual(actual: unknown, expected: unknown, message?: unknown) {
    const mustBeTrue = compareEquality(actual, expected) === EQUAL;
    if (mustBeTrue !== true) {
      message = `Expected the values to be structurally equal. ${message || ""}`;
    }
    assert(mustBeTrue, message);
  }

  function compareEquality(a: any, b: any, cache?: Cache): Comparison {
    return (
      compareIf(a, b, isOptional, compareOptionality) ||
      compareIf(a, b, isPrimitiveEquatable, comparePrimitiveEquality) ||
      compareIf(a, b, isObjectEquatable, compareObjectEquality, cache) ||
      NOT_EQUAL
    );
  }

  function compareIf(
    a: any,
    b: any,
    test: (value: any) => boolean,
    compare: (a: any, b: any, cache?: Cache) => Comparison,
    cache?: Cache,
  ): Comparison {
    return !test(a)
      ? !test(b)
        ? UNKNOWN
        : NOT_EQUAL
      : !test(b)
        ? NOT_EQUAL
        : cacheComparison(a, b, compare, cache);
  }

  function tryCompareStrictEquality(a: any, b: any): Comparison {
    return a === b ? EQUAL : UNKNOWN;
  }

  function tryCompareTypeOfEquality(a: any, b: any): Comparison {
    return typeof a !== typeof b ? NOT_EQUAL : UNKNOWN;
  }

  function tryCompareToStringTagEquality(a: any, b: any): Comparison {
    const aTag = Symbol.toStringTag in a ? a[Symbol.toStringTag] : undefined;
    const bTag = Symbol.toStringTag in b ? b[Symbol.toStringTag] : undefined;
    return aTag !== bTag ? NOT_EQUAL : UNKNOWN;
  }

  function isOptional(value: any) {
    return value === undefined || value === null;
  }

  function compareOptionality(a: any, b: any): Comparison {
    return tryCompareStrictEquality(a, b) || NOT_EQUAL;
  }

  function isPrimitiveEquatable(value: any) {
    switch (typeof value) {
      case "string":
      case "number":
      case "bigint":
      case "boolean":
      case "symbol":
        return true;
      default:
        return isBoxed(value);
    }
  }

  function comparePrimitiveEquality(a: any, b: any): Comparison {
    if (isBoxed(a)) a = a.valueOf();
    if (isBoxed(b)) b = b.valueOf();
    return (
      tryCompareStrictEquality(a, b) ||
      tryCompareTypeOfEquality(a, b) ||
      compareIf(a, b, isNaNEquatable, compareNaNEquality) ||
      NOT_EQUAL
    );
  }

  function isNaNEquatable(value: any) {
    return typeof value === "number";
  }

  function compareNaNEquality(a: any, b: any): Comparison {
    return isNaN(a) && isNaN(b) ? EQUAL : NOT_EQUAL;
  }

  function isObjectEquatable(value: any) {
    return typeof value === "object" || typeof value === "function";
  }

  function compareObjectEquality(a: any, b: any, cache?: Cache): Comparison {
    if (!cache) cache = new Map();
    return (
      getCache(cache, a, b) ||
      setCache(cache, a, b, EQUAL) || // consider equal for now
      cacheComparison(a, b, tryCompareStrictEquality, cache) ||
      cacheComparison(a, b, tryCompareToStringTagEquality, cache) ||
      compareIf(a, b, isValueOfEquatable, compareValueOfEquality) ||
      compareIf(a, b, isToStringEquatable, compareToStringEquality) ||
      compareIf(a, b, isArrayLikeEquatable, compareArrayLikeEquality, cache) ||
      compareIf(a, b, isStructurallyEquatable, compareStructuralEquality, cache) ||
      compareIf(a, b, isIterableEquatable, compareIterableEquality, cache) ||
      cacheComparison(a, b, fail, cache)
    );
  }

  function isBoxed(value: any) {
    return (
      value instanceof String ||
      value instanceof Number ||
      value instanceof Boolean ||
      (typeof Symbol === "function" && value instanceof Symbol) ||
      (typeof BigInt === "function" && value instanceof BigInt)
    );
  }

  function isValueOfEquatable(value: any) {
    return value instanceof Date;
  }

  function compareValueOfEquality(a: any, b: any): Comparison {
    return (
      compareIf(a.valueOf(), b.valueOf(), isPrimitiveEquatable, comparePrimitiveEquality) ||
      NOT_EQUAL
    );
  }

  function isToStringEquatable(value: any) {
    return value instanceof RegExp;
  }

  function compareToStringEquality(a: any, b: any): Comparison {
    return (
      compareIf(a.toString(), b.toString(), isPrimitiveEquatable, comparePrimitiveEquality) ||
      NOT_EQUAL
    );
  }

  function isArrayLikeEquatable(value: any) {
    return (
      (Array.isArray ? Array.isArray(value) : value instanceof Array) ||
      (typeof Uint8Array === "function" && value instanceof Uint8Array) ||
      (typeof Uint8ClampedArray === "function" && value instanceof Uint8ClampedArray) ||
      (typeof Uint16Array === "function" && value instanceof Uint16Array) ||
      (typeof Uint32Array === "function" && value instanceof Uint32Array) ||
      (typeof Int8Array === "function" && value instanceof Int8Array) ||
      (typeof Int16Array === "function" && value instanceof Int16Array) ||
      (typeof Int32Array === "function" && value instanceof Int32Array) ||
      (typeof Float32Array === "function" && value instanceof Float32Array) ||
      (typeof Float64Array === "function" && value instanceof Float64Array) ||
      (typeof BigUint64Array === "function" && value instanceof BigUint64Array) ||
      (typeof BigInt64Array === "function" && value instanceof BigInt64Array)
    );
  }

  function compareArrayLikeEquality(a: any, b: any, cache?: Cache): Comparison {
    if (a.length !== b.length) return NOT_EQUAL;
    for (let i = 0; i < a.length; i++) {
      if (compareEquality(a[i], b[i], cache) === NOT_EQUAL) {
        return NOT_EQUAL;
      }
    }
    return EQUAL;
  }

  function isStructurallyEquatable(value: any) {
    return !(
      (typeof Promise === "function" && value instanceof Promise) || // only comparable by reference
      (typeof WeakMap === "function" && value instanceof WeakMap) || // only comparable by reference
      (typeof WeakSet === "function" && value instanceof WeakSet) || // only comparable by reference
      (typeof Map === "function" && value instanceof Map) || // comparable via @@iterator
      (typeof Set === "function" && value instanceof Set) // comparable via @@iterator
    );
  }

  function compareStructuralEquality(a: any, b: any, cache?: Cache): Comparison {
    const aKeys: string[] = [];
    for (const key in a) aKeys.push(key);

    const bKeys: string[] = [];
    for (const key in b) bKeys.push(key);

    if (aKeys.length !== bKeys.length) {
      return NOT_EQUAL;
    }

    aKeys.sort();
    bKeys.sort();

    for (let i = 0; i < aKeys.length; i++) {
      const aKey = aKeys[i];
      const bKey = bKeys[i];
      if (compareEquality(aKey, bKey, cache) === NOT_EQUAL) {
        return NOT_EQUAL;
      }
      if (compareEquality(a[aKey], b[bKey], cache) === NOT_EQUAL) {
        return NOT_EQUAL;
      }
    }

    return compareIf(a, b, isIterableEquatable, compareIterableEquality, cache) || EQUAL;
  }

  function isIterableEquatable(value: any) {
    return typeof Symbol === "function" && typeof value[Symbol.iterator] === "function";
  }

  function compareIteratorEquality(a: any, b: any, cache?: Cache): Comparison {
    if (
      (typeof Map === "function" && a instanceof Map && b instanceof Map) ||
      (typeof Set === "function" && a instanceof Set && b instanceof Set)
    ) {
      if (a.size !== b.size) return NOT_EQUAL; // exit early if we detect a difference in size
    }

    let ar;
    let br;
    while (true) {
      ar = a.next();
      br = b.next();
      if (ar.done) {
        if (br.done) return EQUAL;
        if (b.return) b.return();
        return NOT_EQUAL;
      }
      if (br.done) {
        if (a.return) a.return();
        return NOT_EQUAL;
      }
      if (compareEquality(ar.value, br.value, cache) === NOT_EQUAL) {
        if (a.return) a.return();
        if (b.return) b.return();
        return NOT_EQUAL;
      }
    }
  }

  function compareIterableEquality(a: any, b: any, cache?: Cache): Comparison {
    return compareIteratorEquality(a[Symbol.iterator](), b[Symbol.iterator](), cache);
  }

  function cacheComparison(
    a: any,
    b: any,
    compare: (a: any, b: any, cache?: Cache) => Comparison,
    cache?: Cache,
  ): Comparison {
    const result = compare(a, b, cache);
    if (cache && (result === EQUAL || result === NOT_EQUAL)) {
      setCache(cache, a, b, result);
    }
    return result;
  }

  function fail(): Comparison {
    return NOT_EQUAL;
  }

  // Returns undefined, as the original's does, so that compareObjectEquality goes on past it.
  function setCache(cache: Cache, left: any, right: any, result: Comparison): undefined {
    let otherCache;

    otherCache = cache.get(left);
    if (!otherCache) cache.set(left, (otherCache = new Map()));
    otherCache.set(right, result);

    otherCache = cache.get(right);
    if (!otherCache) cache.set(right, (otherCache = new Map()));
    otherCache.set(left, result);
    return undefined;
  }

  function getCache(cache: Cache, left: any, right: any): Comparison {
    let otherCache;
    let result;

    otherCache = cache.get(left);
    result = otherCache && otherCache.get(right);
    if (result) return result;

    otherCache = cache.get(right);
    result = otherCache && otherCache.get(left);
    if (result) return result;

    return UNKNOWN;
  }
}
