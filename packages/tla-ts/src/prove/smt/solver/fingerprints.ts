// Ported from Z3 (src/smt/fingerprints.cpp), MIT license, see z3-license.txt. The set of
// quantifier instances already found, keyed by the quantifier and the roots of the bindings, so a
// match on equal terms is not instantiated twice. Scopes undo the insertions.
import type { Enode } from "./enode";

export class FingerprintSet {
  // The quantifier, hash and roots of each fingerprint, in the order of insertion.
  private quantifiers: number[] = [];
  private hashes: number[] = [];
  private roots: Enode[][] = [];
  // Open addressing with linear probing over the indices of the fingerprints, -1 for an empty slot.
  // Scopes remove the newest fingerprints first, and the table grows by inserting them in order, so
  // emptying the slot of a removed fingerprint never cuts the probe of one that remains.
  private slots = new Int32Array(1024).fill(-1);
  private scopes: number[] = [];

  // Returns false when the instance is already in the set.
  insert(quantifier: number, roots: Enode[]) {
    let hash = quantifier;
    for (const root of roots) hash = (Math.imul(hash, 0x9e3779b1) + root.owner) | 0;
    const mask = this.slots.length - 1;
    let slot = hash & mask;
    for (; this.slots[slot] !== -1; slot = (slot + 1) & mask) {
      const index = this.slots[slot];
      if (this.hashes[index] !== hash || this.quantifiers[index] !== quantifier) continue;
      const existing = this.roots[index];
      let isSame = true;
      for (let position = 0; position < roots.length && isSame; position++)
        isSame = existing[position] === roots[position];
      if (isSame) return false;
    }
    this.quantifiers.push(quantifier);
    this.hashes.push(hash);
    this.roots.push(roots);
    if (2 * this.quantifiers.length <= this.slots.length)
      this.slots[slot] = this.quantifiers.length - 1;
    else {
      this.slots = new Int32Array(2 * this.slots.length).fill(-1);
      for (let index = 0; index < this.quantifiers.length; index++) this.place(index);
    }
    return true;
  }

  private place(index: number) {
    const mask = this.slots.length - 1;
    let slot = this.hashes[index] & mask;
    while (this.slots[slot] !== -1) slot = (slot + 1) & mask;
    this.slots[slot] = index;
  }

  push() {
    this.scopes.push(this.quantifiers.length);
  }

  pop(numScopes: number) {
    const limit = this.scopes[this.scopes.length - numScopes];
    const mask = this.slots.length - 1;
    for (let index = this.quantifiers.length - 1; index >= limit; index--) {
      let slot = this.hashes[index] & mask;
      while (this.slots[slot] !== index) slot = (slot + 1) & mask;
      this.slots[slot] = -1;
    }
    this.quantifiers.length = limit;
    this.hashes.length = limit;
    this.roots.length = limit;
    this.scopes.length -= numScopes;
  }
}
