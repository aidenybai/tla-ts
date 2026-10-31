// Ported from Z3 (src/util/hash.h, src/util/hash.cpp), MIT license, see z3-license.txt.
// Bob Jenkins' hash functions, on unsigned 32-bit integers. Z3 hashes every AST with them, and its
// hash tables iterate in hash order, so matching the hashes matches Z3's iteration order.
const GOLDEN_RATIO = 0x9e3779b9;

const mix = (state: Uint32Array) => {
  let a = state[0];
  let b = state[1];
  let c = state[2];
  a = (a - b - c) >>> 0;
  a = (a ^ (c >>> 13)) >>> 0;
  b = (b - c - a) >>> 0;
  b = (b ^ (a << 8)) >>> 0;
  c = (c - a - b) >>> 0;
  c = (c ^ (b >>> 13)) >>> 0;
  a = (a - b - c) >>> 0;
  a = (a ^ (c >>> 12)) >>> 0;
  b = (b - c - a) >>> 0;
  b = (b ^ (a << 16)) >>> 0;
  c = (c - a - b) >>> 0;
  c = (c ^ (b >>> 5)) >>> 0;
  a = (a - b - c) >>> 0;
  a = (a ^ (c >>> 3)) >>> 0;
  b = (b - c - a) >>> 0;
  b = (b ^ (a << 10)) >>> 0;
  c = (c - a - b) >>> 0;
  c = (c ^ (b >>> 15)) >>> 0;
  state[0] = a;
  state[1] = b;
  state[2] = c;
};

// The a, b and c of Z3's mix, which wrap like its unsigned integers. No hash function calls another
// while it uses the state, so they share one rather than allocating one per hash.
const sharedState = new Uint32Array(3);

const mkState = (a: number, b: number, c: number) => {
  sharedState[0] = a;
  sharedState[1] = b;
  sharedState[2] = c;
  return sharedState;
};

export const mkMix = (a: number, b: number, c: number) => {
  const state = mkState(a, b, c);
  mix(state);
  return state[2];
};

export const hashU = (value: number) => {
  let a = value >>> 0;
  a = (a + 0x7ed55d16 + (a << 12)) >>> 0;
  a = (a ^ 0xc761c23c ^ (a >>> 19)) >>> 0;
  a = (a + 0x165667b1 + (a << 5)) >>> 0;
  a = ((a + 0xd3a2646c) ^ (a << 9)) >>> 0;
  a = (a + 0xfd7046c5 + (a << 3)) >>> 0;
  a = (a ^ 0xb55a4f09 ^ (a >>> 16)) >>> 0;
  return a;
};

export const combineHash = (first: number, second: number) =>
  hashU((first ^ (second + GOLDEN_RATIO + (first << 6) + (first >>> 2))) >>> 0);

const encoder = new TextEncoder();

// string_hash, over the bytes of a string or of a number's digits.
export const bytesHash = (data: Uint8Array, initValue: number) => {
  const readUnsigned = (offset: number) =>
    (data[offset] |
      (data[offset + 1] << 8) |
      (data[offset + 2] << 16) |
      (data[offset + 3] << 24)) >>>
    0;
  const state = mkState(GOLDEN_RATIO, GOLDEN_RATIO, initValue);
  let offset = 0;
  let rest = data.length;
  while (rest >= 12) {
    state[0] += readUnsigned(offset);
    state[1] += readUnsigned(offset + 4);
    state[2] += readUnsigned(offset + 8);
    mix(state);
    offset += 12;
    rest -= 12;
  }
  state[2] += data.length;
  // The low byte of c is reserved for the length.
  const shifts = [0, 8, 16, 24, 0, 8, 16, 24, 8, 16, 24];
  for (let index = rest - 1; index >= 0; index--)
    state[index < 4 ? 0 : index < 8 ? 1 : 2] += data[offset + index] << shifts[index];
  mix(state);
  return state[2];
};

export const stringHash = (text: string, initValue: number) =>
  bytesHash(encoder.encode(text), initValue);

// get_composite_hash over child hashes, with the default kind hash of 17.
export const getCompositeHash = (childHashes: number[], kindHash = 17) => {
  const count = childHashes.length;
  const state = mkState(GOLDEN_RATIO, GOLDEN_RATIO, 11);
  switch (count) {
    case 0:
      return state[2];
    case 1:
      state[0] += kindHash;
      state[1] = childHashes[0];
      mix(state);
      return state[2];
    case 2:
      state[0] += kindHash;
      state[1] += childHashes[0];
      state[2] += childHashes[1];
      mix(state);
      return state[2];
    case 3:
      state[0] += childHashes[0];
      state[1] += childHashes[1];
      state[2] += childHashes[2];
      mix(state);
      state[0] += kindHash;
      mix(state);
      return state[2];
    default: {
      let rest = count;
      while (rest >= 3) {
        state[0] += childHashes[--rest];
        state[1] += childHashes[--rest];
        state[2] += childHashes[--rest];
        mix(state);
      }
      state[0] += kindHash;
      if (rest === 2) state[1] += childHashes[1];
      if (rest >= 1) state[2] += childHashes[0];
      mix(state);
      return state[2];
    }
  }
};

// ast_array_hash: the hash of an AST from the hashes of its children.
export const astArrayHash = (hashes: number[], initValue: number) => {
  const count = hashes.length;
  switch (count) {
    case 0:
      return initValue;
    case 1:
      return combineHash(hashes[0], initValue);
    case 2:
      return combineHash(combineHash(hashes[0], hashes[1]), initValue);
    case 3:
      return combineHash(combineHash(hashes[0], hashes[1]), combineHash(hashes[2], initValue));
    default: {
      const state = mkState(GOLDEN_RATIO, GOLDEN_RATIO, initValue);
      let rest = count;
      while (rest >= 3) {
        state[0] += hashes[--rest];
        state[1] += hashes[--rest];
        state[2] += hashes[--rest];
        mix(state);
      }
      if (rest === 2) {
        state[1] += hashes[1];
        state[2] += hashes[0];
      } else if (rest === 1) state[2] += hashes[0];
      mix(state);
      return state[2];
    }
  }
};
