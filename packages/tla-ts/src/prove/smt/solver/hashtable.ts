// Ported from Z3 (src/util/hashtable.h, src/util/obj_hashtable.h), MIT license, see
// z3-license.txt. Z3's open-addressing table with linear probing. Its iteration order is the slot
// order, which the model finder depends on, so the AST maps that Z3 iterates use this table.
import { SmtInvariantError } from "../../../errors";

const INITIAL_CAPACITY = 8;
const SMALL_TABLE_CAPACITY = 64;
const FREE = 0;
const DELETED = 1;
const USED = 2;

// u_hash: an unsigned key is its own hash.
export const getIdentityHash = (key: number) => key;

export class ObjMap<V> {
  private capacity = INITIAL_CAPACITY;
  private states = new Uint8Array(INITIAL_CAPACITY);
  private slotKeys: number[] = [];
  private values: V[] = [];
  private numDeleted = 0;
  size = 0;

  constructor(private getHash: (key: number) => number) {}

  private findSlot(key: number) {
    const mask = this.capacity - 1;
    const begin = this.getHash(key) & mask;
    for (let offset = 0; offset < this.capacity; offset++) {
      const slot = (begin + offset) & mask;
      if (this.states[slot] === FREE) return -1;
      if (this.states[slot] === USED && this.slotKeys[slot] === key) return slot;
    }
    return -1;
  }

  // move_table: reinserts the used slots, in slot order, into a table of the new capacity.
  private moveTable(capacity: number) {
    const states = this.states;
    const keys = this.slotKeys;
    const values = this.values;
    this.capacity = capacity;
    this.states = new Uint8Array(capacity);
    this.slotKeys = [];
    this.values = [];
    this.numDeleted = 0;
    const mask = capacity - 1;
    for (let slot = 0; slot < states.length; slot++) {
      if (states[slot] !== USED) continue;
      let target = this.getHash(keys[slot]) & mask;
      while (this.states[target] !== FREE) target = (target + 1) & mask;
      this.states[target] = USED;
      this.slotKeys[target] = keys[slot];
      this.values[target] = values[slot];
    }
  }

  has(key: number) {
    return this.findSlot(key) !== -1;
  }

  get(key: number) {
    const slot = this.findSlot(key);
    return slot === -1 ? undefined : this.values[slot];
  }

  // find_core and an assignment to the entry: unlike insert, never grows the table.
  replace(key: number, value: V) {
    const slot = this.findSlot(key);
    if (slot !== -1) this.values[slot] = value;
  }

  set(key: number, value: V) {
    if ((this.size + this.numDeleted) << 2 > this.capacity * 3) this.moveTable(this.capacity << 1);
    const mask = this.capacity - 1;
    const begin = this.getHash(key) & mask;
    let deletedSlot = -1;
    for (let offset = 0; offset < this.capacity; offset++) {
      const slot = (begin + offset) & mask;
      if (this.states[slot] === USED) {
        if (this.slotKeys[slot] === key) {
          this.values[slot] = value;
          return;
        }
      } else if (this.states[slot] === FREE) {
        const target = deletedSlot === -1 ? slot : deletedSlot;
        if (deletedSlot !== -1) this.numDeleted--;
        this.states[target] = USED;
        this.slotKeys[target] = key;
        this.values[target] = value;
        this.size++;
        return;
      } else deletedSlot = slot;
    }
    throw new SmtInvariantError("the hash table is full");
  }

  delete(key: number) {
    const slot = this.findSlot(key);
    if (slot === -1) return;
    this.size--;
    if (this.states[(slot + 1) & (this.capacity - 1)] === FREE) {
      this.states[slot] = FREE;
      return;
    }
    this.states[slot] = DELETED;
    this.numDeleted++;
    if (this.numDeleted > this.size && this.numDeleted > SMALL_TABLE_CAPACITY)
      this.moveTable(this.capacity);
  }

  // reset: empties the table, halving it when most slots were in use.
  clear() {
    if (this.size === 0 && this.numDeleted === 0) return;
    let overhead = 0;
    for (let slot = 0; slot < this.capacity; slot++) if (this.states[slot] === FREE) overhead++;
    if (this.capacity > 16 && overhead << 2 > this.capacity * 3) this.capacity >>= 1;
    this.states = new Uint8Array(this.capacity);
    this.slotKeys = [];
    this.values = [];
    this.size = 0;
    this.numDeleted = 0;
  }

  *entries(): IterableIterator<[number, V]> {
    for (let slot = 0; slot < this.capacity; slot++)
      if (this.states[slot] === USED) yield [this.slotKeys[slot], this.values[slot]];
  }

  *keys(): IterableIterator<number> {
    for (let slot = 0; slot < this.capacity; slot++)
      if (this.states[slot] === USED) yield this.slotKeys[slot];
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}

// obj_hashtable: a set of ASTs in Z3's slot order.
export class ObjHashtable {
  private map: ObjMap<true>;

  constructor(getHash: (key: number) => number) {
    this.map = new ObjMap(getHash);
  }

  get size() {
    return this.map.size;
  }

  has(key: number) {
    return this.map.has(key);
  }

  add(key: number) {
    this.map.set(key, true);
  }

  delete(key: number) {
    this.map.delete(key);
  }

  [Symbol.iterator]() {
    return this.map.keys();
  }
}
