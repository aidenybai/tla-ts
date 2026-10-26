import { getValueFingerprint, getValueHash, type Value } from "./values";

const EMPTY = 0;
const TOMBSTONE = 1;
const INITIAL_CAPACITY = 1 << 12;

export interface FingerprintTable {
  insert: (first: number, second: number) => boolean;
  remove: (first: number, second: number) => void;
}

const mix = (hash: number) => {
  const first = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
  const second = Math.imul(first ^ (first >>> 15), 0x846ca68b);
  return second ^ (second >>> 16);
};

export const getStateFingerprint = (state: Value[], fingerprint: Int32Array) => {
  let first = 0x811c9dc5;
  let second = 0x6a09e667;
  for (let index = 0; index < state.length; index++) {
    first = Math.imul(first ^ getValueHash(state[index]), 0x01000193);
    second = Math.imul(second ^ getValueFingerprint(state[index]), 0x5bd1e995);
  }
  fingerprint[0] = mix(first) || 1;
  fingerprint[1] = mix(second);
};

export const getFingerprintOwner = (second: number, count: number) => (second >>> 0) % count;

export const createFingerprintTable = (): FingerprintTable => {
  const table = { slots: new Int32Array(INITIAL_CAPACITY * 2), used: 0 };
  const findSlot = (slots: Int32Array, first: number, second: number) => {
    const mask = slots.length / 2 - 1;
    for (let index = first & mask; ; index = (index + 1) & mask) {
      const stored = slots[index * 2];
      if (stored === EMPTY && slots[index * 2 + 1] === EMPTY) return index;
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
    remove: (first, second) => {
      const slot = findSlot(table.slots, first, second);
      if (table.slots[slot * 2] !== first) return;
      table.slots[slot * 2] = EMPTY;
      table.slots[slot * 2 + 1] = TOMBSTONE;
    },
  };
};
