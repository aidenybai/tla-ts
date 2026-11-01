// Ported from Z3 (src/ast/act_cache.cpp, src/util/chashtable.h), MIT license, see z3-license.txt.
// The rewriter's cache from an expression and a shift to its result. It holds a reference to each
// key and value, and keeps at most maxUnused entries that were never looked up. Z3 releases the
// entries in the order of its chained hash table, so the table is ported cell for cell.
import type { AstManager } from "./ast";

const INIT_SLOTS = 8;
const INIT_CELLAR = 2;
const MIN_MAX_UNUSED = 1024;
const NO_CELL = -1;
// m_next of a free cell, which Z3 tags.
const FREE_CELL = -2;
const MAX_SPARE_CAPACITY = 1024;

interface Cells {
  keys: Int32Array<ArrayBuffer>;
  offsets: Int32Array<ArrayBuffer>;
  values: Int32Array<ArrayBuffer>;
  isUsed: Uint8Array<ArrayBuffer>;
  nexts: Int32Array<ArrayBuffer>;
}

export class ActCache {
  private slots = INIT_SLOTS;
  private capacity = INIT_SLOTS + INIT_CELLAR;
  private keys = new Int32Array(0);
  private offsets = new Int32Array(0);
  private values = new Int32Array(0);
  // Whether client code looked the entry up, the tag of Z3's value pointer.
  private isUsed = new Uint8Array(0);
  private nexts = new Int32Array(0);
  private nextCell = INIT_SLOTS;
  private freeCell = NO_CELL;
  private size = 0;
  // The entries in insertion order from qhead on, where the oldest unused entry is searched.
  private queueKeys: number[] = [];
  private queueOffsets: number[] = [];
  private qhead = 0;
  private numUnused = 0;
  private maxUnused: number;
  // The cells of the small tables that reset and expand_table let go, by capacity. Z3 frees them and
  // takes the next table from its small-object allocator, which is cheap, where V8 allocates each
  // typed array slowly, so the next table of the same capacity reuses them.
  private spares = new Map<number, Cells>();

  constructor(
    private manager: AstManager,
    maxUnused: number,
  ) {
    this.maxUnused = Math.max(maxUnused, MIN_MAX_UNUSED);
    this.initTable(INIT_SLOTS, INIT_CELLAR);
  }

  private initTable(slots: number, cellar: number) {
    this.slots = slots;
    this.capacity = slots + cellar;
    const spare = this.spares.get(this.capacity);
    if (spare !== undefined) this.spares.delete(this.capacity);
    this.keys = spare?.keys ?? new Int32Array(this.capacity);
    this.offsets = spare?.offsets ?? new Int32Array(this.capacity);
    this.values = spare?.values ?? new Int32Array(this.capacity);
    this.isUsed = spare?.isUsed ?? new Uint8Array(this.capacity);
    this.nexts = (spare?.nexts ?? new Int32Array(this.capacity)).fill(FREE_CELL);
    this.nextCell = slots;
    this.freeCell = NO_CELL;
    this.size = 0;
  }

  private retireTable() {
    if (this.capacity > MAX_SPARE_CAPACITY) return;
    this.spares.set(this.capacity, {
      keys: this.keys,
      offsets: this.offsets,
      values: this.values,
      isUsed: this.isUsed,
      nexts: this.nexts,
    });
  }

  private getHash(key: number, offset: number) {
    return (this.manager.hashes[key] + offset) >>> 0;
  }

  private findCell(key: number, offset: number) {
    let cell = this.getHash(key, offset) & (this.slots - 1);
    if (this.nexts[cell] === FREE_CELL) return NO_CELL;
    while (cell !== NO_CELL) {
      if (this.keys[cell] === key && this.offsets[cell] === offset) return cell;
      cell = this.nexts[cell];
    }
    return NO_CELL;
  }

  private getFreeCell() {
    if (this.freeCell !== NO_CELL) {
      const cell = this.freeCell;
      this.freeCell = this.nexts[cell];
      return cell;
    }
    return this.nextCell++;
  }

  private copyCell(target: number, source: number) {
    this.keys[target] = this.keys[source];
    this.offsets[target] = this.offsets[source];
    this.values[target] = this.values[source];
    this.isUsed[target] = this.isUsed[source];
    this.nexts[target] = this.nexts[source];
  }

  // expand_table: copy_table into twice the slots and cellar, doubling the cellar again while it is
  // too small.
  private expandTable() {
    const old = {
      slots: this.slots,
      keys: this.keys,
      offsets: this.offsets,
      values: this.values,
      isUsed: this.isUsed,
      nexts: this.nexts,
    };
    const size = this.size;
    this.retireTable();
    for (let cellar = (this.capacity - this.slots) * 2; ; cellar *= 2) {
      this.initTable(old.slots * 2, cellar);
      let isCopied = true;
      for (let slot = 0; slot < old.slots && isCopied; slot++) {
        if (old.nexts[slot] === FREE_CELL) continue;
        for (let cell = slot; cell !== NO_CELL; cell = old.nexts[cell]) {
          const target = this.getHash(old.keys[cell], old.offsets[cell]) & (this.slots - 1);
          if (this.nexts[target] !== FREE_CELL) {
            if (this.nextCell === this.capacity) {
              isCopied = false;
              break;
            }
            this.copyCell(this.nextCell, target);
            this.nexts[target] = this.nextCell++;
          } else this.nexts[target] = NO_CELL;
          this.keys[target] = old.keys[cell];
          this.offsets[target] = old.offsets[cell];
          this.values[target] = old.values[cell];
          this.isUsed[target] = old.isUsed[cell];
        }
      }
      if (isCopied) break;
    }
    this.size = size;
  }

  // del_unused: deletes the oldest entry that was never looked up.
  private delUnused() {
    while (this.qhead < this.queueKeys.length) {
      const key = this.queueKeys[this.qhead];
      const offset = this.queueOffsets[this.qhead];
      this.qhead++;
      const cell = this.findCell(key, offset);
      if (!this.isUsed[cell]) {
        this.numUnused--;
        const value = this.values[cell];
        this.erase(key, offset);
        this.manager.decRef(key);
        this.manager.decRef(value);
        break;
      }
    }
    if (this.qhead === this.queueKeys.length) {
      this.queueKeys = [];
      this.queueOffsets = [];
      this.qhead = 0;
    } else if (this.qhead > this.maxUnused) {
      this.queueKeys = this.queueKeys.slice(this.qhead);
      this.queueOffsets = this.queueOffsets.slice(this.qhead);
      this.qhead = 0;
    }
  }

  private erase(key: number, offset: number) {
    let cell = this.getHash(key, offset) & (this.slots - 1);
    let prev = NO_CELL;
    while (this.keys[cell] !== key || this.offsets[cell] !== offset) {
      prev = cell;
      cell = this.nexts[cell];
    }
    this.size--;
    const next = this.nexts[cell];
    if (prev === NO_CELL) {
      if (next === NO_CELL) this.nexts[cell] = FREE_CELL;
      else {
        this.copyCell(cell, next);
        this.recycleCell(next);
      }
    } else {
      this.nexts[prev] = next;
      this.recycleCell(cell);
    }
  }

  private recycleCell(cell: number) {
    this.nexts[cell] = this.freeCell;
    this.freeCell = cell;
  }

  insert(key: number, offset: number, value: number) {
    if (this.numUnused >= this.maxUnused) this.delUnused();
    if (this.freeCell === NO_CELL && this.nextCell >= this.capacity) this.expandTable();
    const slot = this.getHash(key, offset) & (this.slots - 1);
    if (this.nexts[slot] !== FREE_CELL) {
      for (let cell = slot; cell !== NO_CELL; cell = this.nexts[cell]) {
        if (this.keys[cell] !== key || this.offsets[cell] !== offset) continue;
        // A new value replaces the old one and clears the tag, though it is not counted as unused.
        if (this.values[cell] !== value) {
          this.manager.incRef(value);
          this.manager.decRef(this.values[cell]);
          this.values[cell] = value;
          this.isUsed[cell] = 0;
        }
        return;
      }
      // The new entry takes the slot, and the old head moves to a free cell after it.
      const moved = this.getFreeCell();
      this.copyCell(moved, slot);
      this.nexts[slot] = moved;
    } else this.nexts[slot] = NO_CELL;
    this.manager.incRef(key);
    this.manager.incRef(value);
    this.queueKeys.push(key);
    this.queueOffsets.push(offset);
    this.numUnused++;
    this.size++;
    this.keys[slot] = key;
    this.offsets[slot] = offset;
    this.values[slot] = value;
    this.isUsed[slot] = 0;
  }

  find(key: number, offset: number) {
    const cell = this.findCell(key, offset);
    if (cell === NO_CELL) return undefined;
    if (!this.isUsed[cell]) {
      this.isUsed[cell] = 1;
      this.numUnused--;
    }
    return this.values[cell];
  }

  // reset: releases the entries in the table's order.
  reset() {
    for (let slot = 0; slot < this.slots && this.size > 0; slot++) {
      if (this.nexts[slot] === FREE_CELL) continue;
      for (let cell = slot; cell !== NO_CELL; cell = this.nexts[cell]) {
        this.manager.decRef(this.keys[cell]);
        this.manager.decRef(this.values[cell]);
      }
    }
    if (this.size > 0) {
      this.retireTable();
      this.initTable(INIT_SLOTS, INIT_CELLAR);
    }
    this.queueKeys = [];
    this.queueOffsets = [];
    this.qhead = 0;
    this.numUnused = 0;
  }
}
