import { TlaEvaluationError } from "./errors";
import {
  createRecord,
  createSortedFunction,
  createTuple,
  getFunctionDomain,
  getStringRank,
  isEmptySet,
  isFunctionValue,
  isModelValue,
  toFiniteFunction,
  toFiniteSet,
  type Value,
} from "./values";

export interface JavaRandom {
  setSeed: (seed: bigint) => void;
  nextInt: (bound: number) => number;
  nextLong: () => bigint;
  nextDouble: () => number;
}

const MULTIPLIER = 0x5deece66dn;
const SEED_MASK = (1n << 48n) - 1n;
const MAXIMUM_INT = 2147483647;

// java.util.Random, which TLC's RandomEnumerableValues extends.
export const createJavaRandom = (seed: bigint): JavaRandom => {
  const state = { value: (BigInt.asUintN(64, seed) ^ MULTIPLIER) & SEED_MASK };
  const next = (bits: number) => {
    state.value = (state.value * MULTIPLIER + 0xbn) & SEED_MASK;
    return Number(BigInt.asIntN(32, state.value >> BigInt(48 - bits)));
  };
  return {
    setSeed: (value) => {
      state.value = (BigInt.asUintN(64, value) ^ MULTIPLIER) & SEED_MASK;
    },
    nextInt: (bound) => {
      const first = next(31);
      const mask = bound - 1;
      if ((bound & mask) === 0) return Number((BigInt(bound) * BigInt(first)) >> 31n);
      for (let candidate = first; ; candidate = next(31)) {
        const value = candidate % bound;
        if (candidate - value + mask <= MAXIMUM_INT) return value;
      }
    },
    nextLong: () => BigInt.asIntN(64, (BigInt(next(32)) << 32n) + BigInt(next(32))),
    nextDouble: () => (next(26) * 2 ** 27 + next(27)) * 2 ** -53,
  };
};

// FP64 with TLC's first irreducible polynomial, FP64.Polys[0], which `-fp 0` selects.
const IRREDUCIBLE_POLYNOMIAL = 0x911498ae0e66bad6n;

const BYTE_MOD_TABLE = (() => {
  const powers: bigint[] = [];
  for (let power = 1n << 63n; powers.length < 72;) {
    powers.push(power);
    power = (power >> 1n) ^ ((power & 1n) === 0n ? 0n : IRREDUCIBLE_POLYNOMIAL);
  }
  return Array.from({ length: 256 }, (_, byte) =>
    powers
      .slice(64, 72)
      .reverse()
      .reduce((value, power, bit) => ((byte >> bit) & 1 ? value ^ power : value), 0n),
  );
})();

const extendByte = (fingerprint: bigint, byte: number) =>
  (fingerprint >> 8n) ^ BYTE_MOD_TABLE[(byte ^ Number(fingerprint & 0xffn)) & 0xff];

const extendInt = (fingerprint: bigint, value: number) =>
  [0, 8, 16, 24].reduce((current, shift) => extendByte(current, value >>> shift), fingerprint);

const extendString = (fingerprint: bigint, text: string) =>
  Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).reduce(
    extendByte,
    fingerprint,
  );

const BOOL_VALUE = 0;
const INT_VALUE = 1;
const STRING_VALUE = 3;
const SET_ENUM_VALUE = 5;
const FCN_RCD_VALUE = 9;
const MODEL_VALUE = 21;

// Value#fingerPrint for each of TLC's value classes. A model value extends the fingerprint with
// its UniqueString token, and TLC numbers tokens from 1 in intern order.
const extendValue = (fingerprint: bigint, value: Value): bigint => {
  if (typeof value === "boolean") {
    return extendByte(extendByte(fingerprint, BOOL_VALUE), value ? 116 : 102);
  }
  if (typeof value === "number") return extendInt(extendByte(fingerprint, INT_VALUE), value);
  if (typeof value === "string") {
    return extendString(extendInt(extendByte(fingerprint, STRING_VALUE), value.length), value);
  }
  if (isModelValue(value)) {
    return extendInt(extendByte(fingerprint, MODEL_VALUE), getStringRank(value.name) + 1);
  }
  if (isFunctionValue(value)) {
    const fn = toFiniteFunction(value);
    return fn.domain.reduce(
      (current, key, index) => extendValue(extendValue(current, key), fn.range[index]),
      extendInt(extendByte(fingerprint, FCN_RCD_VALUE), fn.domain.length),
    );
  }
  const elements = toFiniteSet(value).elements;
  return elements.reduce(
    extendValue,
    extendInt(extendByte(fingerprint, SET_ENUM_VALUE), elements.length),
  );
};

// TLCStateMut#fingerPrint of variable values in TLC's variable order.
export const getTlcFingerprint = (state: Value[]) =>
  state.reduce(extendValue, IRREDUCIBLE_POLYNOMIAL);

// RandomGenerator.primes holds the 1341 consecutive primes from 1277011 to 1295953.
const PRIMES: number[] = [];

const isPrime = (candidate: number) => {
  for (let divisor = 2; divisor * divisor <= candidate; divisor++) {
    if (candidate % divisor === 0) return false;
  }
  return true;
};

const getPrimes = () => {
  for (let candidate = 1277011; PRIMES.length < 1341; candidate++) {
    if (isPrime(candidate)) PRIMES.push(candidate);
  }
  return PRIMES;
};

const nextPrime = (random: JavaRandom) => {
  const primes = getPrimes();
  const choice = { index: primes.length };
  while (choice.index === primes.length) {
    choice.index = Math.floor(random.nextDouble() * primes.length);
  }
  return primes[choice.index];
};

const getPrimeFactors = (value: number) => {
  const factors: number[] = [];
  const remaining = { value };
  for (let divisor = 2; divisor * divisor <= remaining.value; divisor++) {
    while (remaining.value % divisor === 0) {
      factors.push(divisor);
      remaining.value /= divisor;
    }
  }
  if (remaining.value > 1) factors.push(remaining.value);
  return factors;
};

// EnumerableValue.computeOptimalMandA: the smallest modulus m >= max(size, 9) that isn't a
// multiple of 4 and has a repeated prime factor, and the multiplier 1 + the product of its
// distinct prime factors.
const getModulusAndMultiplier = (size: number) => {
  for (let modulus = Math.max(size, 9); ; modulus++) {
    const factors = getPrimeFactors(modulus);
    const distinct = new Set(factors);
    if (modulus % 4 !== 0 && distinct.size !== factors.length) {
      return {
        modulus: BigInt(modulus),
        multiplier: BigInt([...distinct].reduce((product, prime) => product * prime, 1) + 1),
      };
    }
  }
};

// EnumerableValue.SubsetEnumerator: count indices below size from a full-period linear
// congruential generator that starts at random.nextInt(size).
const getSubsetIndices = (count: number, size: number, random: JavaRandom) => {
  if (size <= 0) return [];
  const generator = getModulusAndMultiplier(size);
  const state = { index: BigInt(random.nextInt(size)) };
  const increment = BigInt(nextPrime(random));
  return Array.from({ length: count }, () => {
    do {
      state.index = (generator.multiplier * state.index + increment) % generator.modulus;
    } while (state.index >= size);
    return state.index;
  });
};

const LARGE_STRIDE = (1n << 63n) - 1n - 24n;

// SetOfFcnsOrRcdsValue.BigIntegerSubsetEnumerator, for products with more than 2^31 - 1
// elements.
const getLargeSubsetIndices = (count: number, size: bigint, random: JavaRandom) => {
  const signed = random.nextLong();
  const offset = BigInt.asIntN(64, signed < 0n ? -signed : signed);
  return Array.from({ length: count }, (_, index) => {
    const value = (LARGE_STRIDE * BigInt(index) + offset) % size;
    return value < 0n ? value + size : value;
  });
};

const getProductElements = (lists: Value[][], index: bigint) =>
  lists.reduceRight<{ remaining: bigint; elements: Value[] }>(
    (current, list) => ({
      remaining: current.remaining / BigInt(list.length),
      elements: [list[Number(current.remaining % BigInt(list.length))], ...current.elements],
    }),
    { remaining: index, elements: [] },
  ).elements;

interface Product {
  lists: Value[][];
  create: (elements: Value[]) => Value;
}

const getProduct = (set: Value): Product | undefined => {
  if (typeof set !== "object") return undefined;
  if (set.kind === "FunctionSet") {
    const domain = getFunctionDomain(set.domain);
    const range = toFiniteSet(set.range).elements;
    return {
      lists: domain.map(() => range),
      create: (elements) => createSortedFunction(domain, elements),
    };
  }
  if (set.kind === "RecordSet") {
    return {
      lists: set.sets.map((field) => toFiniteSet(field).elements),
      create: (elements) =>
        createRecord(set.names.map((name, index): [string, Value] => [name, elements[index]])),
    };
  }
  if (set.kind === "ProductSet") {
    return {
      lists: set.factors.map((factor) => toFiniteSet(factor).elements),
      create: createTuple,
    };
  }
  return undefined;
};

// Enumerable#getRandomSubset, which Randomization's RandomSubset calls.
export const getRandomSubset = (count: number, set: Value, random: JavaRandom): Value[] => {
  if (isEmptySet(set)) return [];
  if (typeof set === "object" && set.kind === "Interval") {
    return getSubsetIndices(count, Math.max(0, set.high - set.low + 1), random).map(
      (index) => set.low + Number(index),
    );
  }
  const product = getProduct(set);
  if (product) {
    const size = product.lists.reduce((total, list) => total * BigInt(list.length), 1n);
    const indices =
      size > BigInt(MAXIMUM_INT)
        ? getLargeSubsetIndices(count, size, random)
        : getSubsetIndices(count, Number(size), random);
    return indices.map((index) => product.create(getProductElements(product.lists, index)));
  }
  const elements = toFiniteSet(set).elements;
  return getSubsetIndices(count, elements.length, random).map((index) => elements[Number(index)]);
};

const pickElement = (elements: Value[], random: JavaRandom) => {
  const element = elements[Math.floor(random.nextDouble() * elements.length)];
  if (element === undefined) throw new TlaEvaluationError("RandomElement of the empty set");
  return element;
};

// TLC!RandomElement chooses each component of a set of functions, records, or tuples
// separately, and otherwise indexes the enumerated set with nextDouble.
export const getRandomElement = (set: Value, random: JavaRandom): Value => {
  if (typeof set === "object" && set.kind === "FunctionSet") {
    const domain = getFunctionDomain(set.domain);
    return createSortedFunction(
      domain,
      domain.map(() => getRandomElement(set.range, random)),
    );
  }
  if (typeof set === "object" && set.kind === "RecordSet") {
    return createRecord(
      set.names.map((name, index): [string, Value] => [
        name,
        getRandomElement(set.sets[index], random),
      ]),
    );
  }
  if (typeof set === "object" && set.kind === "ProductSet") {
    return createTuple(set.factors.map((factor) => getRandomElement(factor, random)));
  }
  if (typeof set === "object" && set.kind === "Interval") {
    const size = Math.max(0, set.high - set.low + 1);
    const offset = Math.floor(random.nextDouble() * size);
    if (offset >= size) throw new TlaEvaluationError("RandomElement of the empty set");
    return set.low + offset;
  }
  return pickElement(toFiniteSet(set).elements, random);
};
