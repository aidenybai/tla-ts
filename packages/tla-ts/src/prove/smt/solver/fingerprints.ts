// Ported from Z3 (src/smt/fingerprints.cpp), MIT license, see z3-license.txt. The set of
// quantifier instances already found, so a match on equal terms is not instantiated twice. Scopes
// undo the insertions.
import type { AstManager } from "./ast";
import type { Enode } from "./enode";
import { getCompositeHash } from "./hash";

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

  constructor(private manager: AstManager) {}

  // fingerprint_set::insert: returns false when the instance is already in the set. The hash comes
  // from the bindings themselves, and the set is searched with the bindings and then with their
  // roots, which a new fingerprint keeps.
  insert(quantifier: number, bindings: Enode[]) {
    const manager = this.manager;
    const hash = getCompositeHash(
      bindings.map((binding) => manager.hashes[binding.owner]),
      manager.ids[quantifier],
    );
    if (this.find(quantifier, hash, bindings) === -1) return false;
    const roots = bindings.map((binding) => binding.root);
    const slot = this.find(quantifier, hash, roots);
    if (slot === -1) return false;
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

  // The empty slot that ends the probe for the fingerprint, or -1 when the set has it.
  private find(quantifier: number, hash: number, args: Enode[]) {
    const mask = this.slots.length - 1;
    let slot = hash & mask;
    for (; this.slots[slot] !== -1; slot = (slot + 1) & mask) {
      const index = this.slots[slot];
      if (this.hashes[index] !== hash || this.quantifiers[index] !== quantifier) continue;
      const existing = this.roots[index];
      if (args.every((arg, position) => existing[position] === arg)) return -1;
    }
    return slot;
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
