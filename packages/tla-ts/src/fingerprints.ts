import { getValueFingerprint, getValueHash, type Value } from "./values";

const EMPTY = 0;
const INITIAL_CAPACITY = 1 << 12;

interface FingerprintTable {
  insert: (first: number, second: number) => boolean;
}

const mix = (hash: number) => {
  const first = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
  const second = Math.imul(first ^ (first >>> 15), 0x846ca68b);
  return second ^ (second >>> 16);
};

export const writeStateFingerprint = (state: Value[], fingerprint: Int32Array) => {
  let first = 0x811c9dc5;
  let second = 0x6a09e667;
  for (let index = 0; index < state.length; index++) {
    first = Math.imul(first ^ getValueHash(state[index]), 0x01000193);
    second = Math.imul(second ^ getValueFingerprint(state[index]), 0x5bd1e995);
  }
  fingerprint[0] = mix(first) || 1;
  fingerprint[1] = mix(second);
};

export const createFingerprintTable = (): FingerprintTable => {
  const table = { slots: new Int32Array(INITIAL_CAPACITY * 2), used: 0 };
  const findSlot = (slots: Int32Array, first: number, second: number) => {
    const mask = slots.length / 2 - 1;
    for (let index = first & mask; ; index = (index + 1) & mask) {
      const stored = slots[index * 2];
      if (stored === EMPTY) return index;
      if (stored === first && slots[index * 2 + 1] === second) return index;
    }
  };
  const grow = () => {
    const previous = table.slots;
    const slots = new Int32Array(previous.length * 2);
    for (let index = 0; index < previous.length; index += 2) {
      if (previous[index] === EMPTY) continue;
      const slot = findSlot(slots, previous[index], previous[index + 1]);
      slots[slot * 2] = previous[index];
      slots[slot * 2 + 1] = previous[index + 1];
    }
    table.slots = slots;
  };
  return {
    insert: (first, second) => {
      if (table.used * 4 >= table.slots.length) grow();
      const slot = findSlot(table.slots, first, second);
      if (table.slots[slot * 2] === first) return false;
      table.slots[slot * 2] = first;
      table.slots[slot * 2 + 1] = second;
      table.used++;
      return true;
    },
  };
};

// Workers share one table of 64-bit fingerprints. The first word is never 0, so 0 marks an empty slot.
export interface SharedFingerprints {
  slots: BigInt64Array;
  used: Int32Array;
}

const INITIAL_SHARED_CAPACITY = 1 << 10;

const insertSharedKey = (slots: BigInt64Array, key: bigint) => {
  const mask = slots.length - 1;
  for (let index = Number(key >> 32n) & mask; ; index = (index + 1) & mask) {
    const stored = Atomics.load(slots, index);
    if (stored === key) return false;
    if (stored !== 0n) continue;
    const previous = Atomics.compareExchange(slots, index, 0n, key);
    if (previous === 0n) return true;
    if (previous === key) return false;
  }
};

export const createSharedFingerprints = (): SharedFingerprints => ({
  slots: new BigInt64Array(new SharedArrayBuffer(INITIAL_SHARED_CAPACITY * 8)),
  used: new Int32Array(new SharedArrayBuffer(4)),
});

export const insertSharedFingerprint = (
  table: SharedFingerprints,
  first: number,
  second: number,
) => {
  const key = BigInt.asIntN(64, (BigInt(first) << 32n) | BigInt(second >>> 0));
  if (!insertSharedKey(table.slots, key)) return false;
  Atomics.add(table.used, 0, 1);
  return true;
};

export const isSharedFingerprintsFull = (table: SharedFingerprints) =>
  Atomics.load(table.used, 0) * 2 >= table.slots.length;

export const growSharedFingerprints = (table: SharedFingerprints): SharedFingerprints => {
  const slots = new BigInt64Array(new SharedArrayBuffer(table.slots.byteLength * 2));
  for (const key of table.slots) if (key !== 0n) insertSharedKey(slots, key);
  return { slots, used: table.used };
};
