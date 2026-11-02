import {
  getStringRank,
  isFunctionValue,
  isModelValue,
  toFiniteFunction,
  toFiniteSet,
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

// Value#fingerPrint for each of TLC's value classes. A model value extends the fingerprint with
// its UniqueString token, and TLC numbers tokens from 1 in intern order.
const extendValue = (value: Value) => {
  if (typeof value === "boolean") {
    extendByte(BOOL_VALUE);
    extendByte(value ? 116 : 102);
  } else if (typeof value === "number") {
    extendByte(INT_VALUE);
    extendInt(value);
  } else if (typeof value === "string") {
    extendByte(STRING_VALUE);
    extendInt(value.length);
    for (let index = 0; index < value.length; index++) {
      extendByte(value.charCodeAt(index));
    }
  } else if (isModelValue(value)) {
    extendByte(MODEL_VALUE);
    extendInt(getStringRank(value.name) + 1);
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

const getFingerprintLength = (value: Value): number => {
  if (typeof value === "boolean") return 2;
  if (typeof value === "number" || isModelValue(value)) return 5;
  if (typeof value === "string") return 5 + value.length;
  if (isFunctionValue(value)) {
    const functionValue = toFiniteFunction(value);
    return functionValue.domain.reduce<number>(
      (length, key, index) =>
        length + getFingerprintLength(key) + getFingerprintLength(functionValue.range[index]),
      5,
    );
  }
  return toFiniteSet(value).elements.reduce<number>(
    (length, element) => length + getFingerprintLength(element),
    5,
  );
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

// Extending a fingerprint by a byte is linear over GF(2), so extending it by a value's bytes
// XORs the value's own fingerprint from zero into the fingerprint shifted by their length.
// The fingerprinter caches each distinct function or set it meets, nested ones included, for one
// pass over the stored states, as states share most of their values. It reads a state's variables
// in `order` and writes each fingerprint's low and high words into `words`, an Int32Array over a
// little-endian BigInt64Array.
export const createTlcFingerprinter = (order: number[], words: Int32Array) => {
  const shiftTables = new Map<number, Int32Array>();
  const indices = new Map<Value, number>();
  const contributions: number[] = [];
  const getShiftTable = (length: number) => {
    const cached = shiftTables.get(length);
    if (cached) return cached;
    const table = createShiftTable(length);
    shiftTables.set(length, table);
    return table;
  };
  // Extends the fingerprint by a value's bytes and returns how many there are.
  const extendElement = (value: Value): number => {
    if (typeof value !== "object" || isModelValue(value)) {
      extendValue(value);
      return getFingerprintLength(value);
    }
    const contribution = getContribution(value);
    const shifted = { high, low };
    const table = getShiftTable(contributions[contribution]);
    high = contributions[contribution + 1];
    low = contributions[contribution + 2];
    for (let position = 0; position < 8; position++) {
      const word = position < 4 ? shifted.low : shifted.high;
      const entry = (position * 256 + ((word >>> ((position & 3) * 8)) & 0xff)) * 2;
      high ^= table[entry];
      low ^= table[entry + 1];
    }
    return contributions[contribution];
  };
  const getContribution = (value: Value) => {
    const cached = indices.get(value);
    if (cached !== undefined) return cached;
    const outer = { high, low };
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
    const contribution = contributions.length;
    indices.set(value, contribution);
    contributions.push(length.value, high, low);
    high = outer.high;
    low = outer.low;
    return contribution;
  };
  return (state: Value[], position: number) => {
    const outer = { high, low };
    high = INITIAL_HIGH;
    low = INITIAL_LOW;
    for (const index of order) extendElement(state[index]);
    words[2 * position] = low;
    words[2 * position + 1] = high;
    high = outer.high;
    low = outer.low;
  };
};
