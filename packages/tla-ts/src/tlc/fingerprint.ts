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

// Extending is linear over GF(2), so extending by four bytes at once shifts the fingerprint by a
// word and adds, for each of the four, the fingerprint from zero of that byte followed by the zero
// bytes that come after it: SLICE_HIGH[k] and SLICE_LOW[k] hold them for k zero bytes after.
const createSliceTables = () => {
  const highs = [BYTE_MOD_HIGH];
  const lows = [BYTE_MOD_LOW];
  for (let zeros = 1; zeros < 4; zeros++) {
    const previousHigh = highs[zeros - 1];
    const previousLow = lows[zeros - 1];
    const sliceHigh = new Int32Array(256);
    const sliceLow = new Int32Array(256);
    for (let byte = 0; byte < 256; byte++) {
      const index = previousLow[byte] & 0xff;
      sliceLow[byte] =
        ((previousLow[byte] >>> 8) | (previousHigh[byte] << 24)) ^ BYTE_MOD_LOW[index];
      sliceHigh[byte] = (previousHigh[byte] >>> 8) ^ BYTE_MOD_HIGH[index];
    }
    highs.push(sliceHigh);
    lows.push(sliceLow);
  }
  return { highs, lows };
};

const SLICES = createSliceTables();
const SLICE_HIGH_0 = SLICES.highs[0];
const SLICE_HIGH_1 = SLICES.highs[1];
const SLICE_HIGH_2 = SLICES.highs[2];
const SLICE_HIGH_3 = SLICES.highs[3];
const SLICE_LOW_0 = SLICES.lows[0];
const SLICE_LOW_1 = SLICES.lows[1];
const SLICE_LOW_2 = SLICES.lows[2];
const SLICE_LOW_3 = SLICES.lows[3];

// Extends the fingerprint by the four bytes of a word, lowest first.
const extendInt = (word: number) => {
  const mixed = low ^ word;
  const first = mixed & 0xff;
  const second = (mixed >>> 8) & 0xff;
  const third = (mixed >>> 16) & 0xff;
  const fourth = mixed >>> 24;
  low = high ^ SLICE_LOW_3[first] ^ SLICE_LOW_2[second] ^ SLICE_LOW_1[third] ^ SLICE_LOW_0[fourth];
  high = SLICE_HIGH_3[first] ^ SLICE_HIGH_2[second] ^ SLICE_HIGH_1[third] ^ SLICE_HIGH_0[fourth];
};

const BOOL_VALUE = 0;
const INT_VALUE = 1;
const STRING_VALUE = 3;
const SET_ENUM_VALUE = 5;
const FCN_RCD_VALUE = 9;
const MODEL_VALUE = 21;

const writeInt = (word: number, bytes: number[]) => {
  bytes.push(word & 0xff, (word >>> 8) & 0xff, (word >>> 16) & 0xff, word >>> 24);
};

// Value#fingerPrint for each of TLC's value classes, as the bytes it extends a fingerprint by. A
// model value writes its UniqueString token, and TLC numbers tokens from 1 in intern order.
const writeValue = (value: Value, bytes: number[]) => {
  if (typeof value === "boolean") {
    bytes.push(BOOL_VALUE, value ? 116 : 102);
  } else if (typeof value === "number") {
    bytes.push(INT_VALUE);
    writeInt(value, bytes);
  } else if (typeof value === "string") {
    bytes.push(STRING_VALUE);
    writeInt(value.length, bytes);
    for (let index = 0; index < value.length; index++) bytes.push(value.charCodeAt(index) & 0xff);
  } else if (isModelValue(value)) {
    bytes.push(MODEL_VALUE);
    writeInt(getStringRank(value.name) + 1, bytes);
  } else if (isFunctionValue(value)) {
    const functionValue = toFiniteFunction(value);
    bytes.push(FCN_RCD_VALUE);
    writeInt(functionValue.domain.length, bytes);
    for (let index = 0; index < functionValue.domain.length; index++) {
      writeValue(functionValue.domain[index], bytes);
      writeValue(functionValue.range[index], bytes);
    }
  } else {
    const elements = toFiniteSet(value).elements;
    bytes.push(SET_ENUM_VALUE);
    writeInt(elements.length, bytes);
    for (const element of elements) writeValue(element, bytes);
  }
};

const extendBytes = (bytes: number[], start: number, end: number) => {
  const whole = start + ((end - start) & ~3);
  for (let index = start; index < whole; index += 4) {
    extendInt(
      bytes[index] | (bytes[index + 1] << 8) | (bytes[index + 2] << 16) | (bytes[index + 3] << 24),
    );
  }
  for (let index = whole; index < end; index++) extendByte(bytes[index]);
};

// TLCStateMut#fingerPrint of variable values in TLC's variable order. Writing a lazy value can
// evaluate it and fingerprint another value, so every value is written before any is extended.
export const getTlcFingerprint = (state: Value[]) => {
  const bytes: number[] = [];
  for (const value of state) writeValue(value, bytes);
  high = INITIAL_HIGH;
  low = INITIAL_LOW;
  extendBytes(bytes, 0, bytes.length);
  return (BigInt(high >>> 0) << 32n) | BigInt(low >>> 0);
};

export interface StoredCells {
  count: number;
  // Each cell names one value and is below the bound.
  cellBound: number;
  getCells: (index: number) => Int32Array;
  getValue: (cell: number) => Value;
}

// TLCStateMut#fingerPrint of each stored state, whose cells are its variables in the order the
// store keeps them. Extending is linear, so extending by a value's bytes is extending by as many
// zero bytes and adding the value's fingerprint from zero. Stored states share their values, so
// each is written once, and only its length and that fingerprint are kept.
export const getTlcFingerprints = (stored: StoredCells, order: number[]) => {
  const fingerprints = new BigInt64Array(stored.count);
  // Each fingerprint's low and high words, as a BigInt64Array is little-endian.
  const words = new Int32Array(fingerprints.buffer);
  // Each cell's length in bytes, 0 until it is written, and its fingerprint from zero.
  const lengths = new Int32Array(stored.cellBound);
  const highs = new Int32Array(stored.cellBound);
  const lows = new Int32Array(stored.cellBound);
  const bytes: number[] = [];
  for (let position = 0; position < stored.count; position++) {
    const cells = stored.getCells(position);
    high = INITIAL_HIGH;
    low = INITIAL_LOW;
    for (const index of order) {
      const cell = cells[index];
      const value = stored.getValue(cell);
      if (typeof value === "number") {
        extendByte(INT_VALUE);
        extendInt(value);
        continue;
      }
      if (lengths[cell] === 0) {
        // Writing evaluates lazy values, which can fingerprint others.
        const outer = { high, low };
        bytes.length = 0;
        writeValue(value, bytes);
        high = 0;
        low = 0;
        extendBytes(bytes, 0, bytes.length);
        lengths[cell] = bytes.length;
        highs[cell] = high;
        lows[cell] = low;
        high = outer.high;
        low = outer.low;
      }
      const length = lengths[cell];
      for (let step = 4; step <= length; step += 4) extendInt(0);
      for (let step = length & ~3; step < length; step++) extendByte(0);
      high ^= highs[cell];
      low ^= lows[cell];
    }
    words[2 * position] = low;
    words[2 * position + 1] = high;
  }
  return fingerprints;
};
