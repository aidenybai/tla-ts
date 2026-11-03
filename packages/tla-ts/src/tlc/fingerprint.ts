import {
  getStringRank,
  isFunctionValue,
  isModelValue,
  toFiniteFunction,
  toFiniteSet,
  type ModelValue,
  type Value,
} from "../values";

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

const BYTE_MOD_HIGH = Int32Array.from(BYTE_MOD_TABLE, (entry) =>
  Number(BigInt.asIntN(32, entry >> 32n)),
);
const BYTE_MOD_LOW = Int32Array.from(BYTE_MOD_TABLE, (entry) => Number(BigInt.asIntN(32, entry)));

// The fingerprint being extended, as its high and low 32 bits, which avoids a BigInt operation
// for every byte.
const INITIAL_HIGH = Number(BigInt.asIntN(32, IRREDUCIBLE_POLYNOMIAL >> 32n));
const INITIAL_LOW = Number(BigInt.asIntN(32, IRREDUCIBLE_POLYNOMIAL));
let high = INITIAL_HIGH;
let low = INITIAL_LOW;

const extendByte = (byte: number) => {
  const index = (byte ^ low) & 0xff;
  low = ((low >>> 8) | (high << 24)) ^ BYTE_MOD_LOW[index];
  high = (high >>> 8) ^ BYTE_MOD_HIGH[index];
};

const extendInt = (value: number) => {
  for (let shift = 0; shift < 32; shift += 8) extendByte(value >>> shift);
};

const BOOL_VALUE = 0;
const INT_VALUE = 1;
const STRING_VALUE = 3;
const SET_ENUM_VALUE = 5;
const FCN_RCD_VALUE = 9;
const MODEL_VALUE = 21;

// Value#fingerPrint for TLC's booleans, integers, strings, and model values, which returns how
// many bytes it extends the fingerprint by. A model value extends the fingerprint with its
// UniqueString token, and TLC numbers tokens from 1 in intern order.
const extendScalar = (value: boolean | number | string | ModelValue) => {
  if (typeof value === "boolean") {
    extendByte(BOOL_VALUE);
    extendByte(value ? 116 : 102);
    return 2;
  }
  if (typeof value === "number") {
    extendByte(INT_VALUE);
    extendInt(value);
    return 5;
  }
  if (typeof value === "string") {
    extendByte(STRING_VALUE);
    extendInt(value.length);
    for (let index = 0; index < value.length; index++) {
      extendByte(value.charCodeAt(index));
    }
    return 5 + value.length;
  }
  extendByte(MODEL_VALUE);
  extendInt(getStringRank(value.name) + 1);
  return 5;
};

// Value#fingerPrint for each of TLC's value classes.
const extendValue = (value: Value) => {
  if (typeof value !== "object" || isModelValue(value)) {
    extendScalar(value);
  } else if (isFunctionValue(value)) {
    const functionValue = toFiniteFunction(value);
    extendByte(FCN_RCD_VALUE);
    extendInt(functionValue.domain.length);
    for (let index = 0; index < functionValue.domain.length; index++) {
      extendValue(functionValue.domain[index]);
      extendValue(functionValue.range[index]);
    }
  } else {
    const elements = toFiniteSet(value).elements;
    extendByte(SET_ENUM_VALUE);
    extendInt(elements.length);
    for (const element of elements) extendValue(element);
  }
};

// TLCStateMut#fingerPrint of variable values in TLC's variable order. Evaluating a lazy value can
// fingerprint another, so this restores the fingerprint it interrupts.
export const getTlcFingerprint = (state: Value[]) => {
  const outer = { high, low };
  high = INITIAL_HIGH;
  low = INITIAL_LOW;
  for (const value of state) extendValue(value);
  const fingerprint = (BigInt(high >>> 0) << 32n) | BigInt(low >>> 0);
  high = outer.high;
  low = outer.low;
  return fingerprint;
};

// The fingerprint after `length` zero bytes, as one table per byte of the fingerprint it shifts.
const createShiftTable = (length: number) => {
  const table = new Int32Array(8 * 256 * 2);
  for (let bit = 0; bit < 64; bit++) {
    high = bit < 32 ? 0 : 1 << (bit - 32);
    low = bit < 32 ? 1 << bit : 0;
    for (let step = 0; step < length; step++) extendByte(0);
    const position = bit >> 3;
    const mask = 1 << (bit & 7);
    for (let byte = mask; byte < 2 * mask; byte++) {
      const entry = (position * 256 + byte) * 2;
      const rest = (position * 256 + byte - mask) * 2;
      table[entry] = table[rest] ^ high;
      table[entry + 1] = table[rest + 1] ^ low;
    }
  }
  return table;
};

// The functions and sets a fingerprinter caches before it starts over, which bounds the values it
// keeps alive.
const CACHED_VALUE_LIMIT = 1 << 22;

// Extending a fingerprint by a byte is linear over GF(2), so extending it by a value's bytes
// XORs the value's own fingerprint from zero into the fingerprint shifted by their length.
// The fingerprinter caches each distinct function or set it meets, nested ones included, across
// every batch of states it fingerprints, as states share most of their values, even states of
// different levels. It reads a state's variables in `order`.
export const createTlcFingerprinter = (order: number[], limit = CACHED_VALUE_LIMIT) => {
  const shiftTables = new Map<number, Int32Array>();
  const ids = new Map<Value, number>();
  // The byte count and fingerprint from zero of each cached value, three numbers per id, and the
  // shift table for its byte count.
  const contributions: number[] = [];
  const contributionShiftTables: Int32Array[] = [];
  const getShiftTable = (length: number) => {
    const cached = shiftTables.get(length);
    if (cached) return cached;
    const table = createShiftTable(length);
    shiftTables.set(length, table);
    return table;
  };
  // Extends the fingerprint by a value's bytes and returns how many there are.
  const extendElement = (value: Value): number => {
    if (typeof value !== "object" || isModelValue(value)) return extendScalar(value);
    const id = getId(value);
    const table = contributionShiftTables[id];
    const shiftedHigh = high;
    const shiftedLow = low;
    high = contributions[3 * id + 1];
    low = contributions[3 * id + 2];
    for (let position = 0; position < 8; position++) {
      const word = position < 4 ? shiftedLow : shiftedHigh;
      const entry = (position * 256 + ((word >>> ((position & 3) * 8)) & 0xff)) * 2;
      high ^= table[entry];
      low ^= table[entry + 1];
    }
    return contributions[3 * id];
  };
  const getId = (value: Value) => {
    const cached = ids.get(value);
    if (cached !== undefined) return cached;
    const outerHigh = high;
    const outerLow = low;
    high = 0;
    low = 0;
    const length = { value: 5 };
    if (isFunctionValue(value)) {
      const functionValue = toFiniteFunction(value);
      extendByte(FCN_RCD_VALUE);
      extendInt(functionValue.domain.length);
      for (let index = 0; index < functionValue.domain.length; index++) {
        length.value += extendElement(functionValue.domain[index]);
        length.value += extendElement(functionValue.range[index]);
      }
    } else {
      const elements = toFiniteSet(value).elements;
      extendByte(SET_ENUM_VALUE);
      extendInt(elements.length);
      for (const element of elements) length.value += extendElement(element);
    }
    const id = contributionShiftTables.length;
    ids.set(value, id);
    contributions.push(length.value, high, low);
    contributionShiftTables.push(getShiftTable(length.value));
    high = outerHigh;
    low = outerLow;
    return id;
  };
  return (states: Value[][]) => {
    const fingerprints = new BigInt64Array(states.length);
    // Each fingerprint's low and high words, as a BigInt64Array is little-endian.
    const words = new Int32Array(fingerprints.buffer);
    const outerHigh = high;
    const outerLow = low;
    states.forEach((state, position) => {
      if (ids.size >= limit) {
        shiftTables.clear();
        ids.clear();
        contributions.length = 0;
        contributionShiftTables.length = 0;
      }
      high = INITIAL_HIGH;
      low = INITIAL_LOW;
      for (const index of order) extendElement(state[index]);
      words[2 * position] = low;
      words[2 * position + 1] = high;
    });
    high = outerHigh;
    low = outerLow;
    return fingerprints;
  };
};
