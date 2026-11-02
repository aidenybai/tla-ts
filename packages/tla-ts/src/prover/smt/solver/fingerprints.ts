// Ported from Z3 (src/smt/fingerprints.cpp), MIT license, see z3-license.txt. The set of
// quantifier instances already found, so a match on equal terms is not instantiated twice. Scopes
// undo the insertions.
import type { AstManager } from "./ast";
import type { Enode } from "./enode";
import { getCompositeHash } from "./hash";
import { shrink } from "./array";

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
  // The hashes and the roots of the bindings of the instance being inserted.
  private bindingHashes: number[] = [];
  private bindingRoots: Enode[] = [];

  constructor(private manager: AstManager) {}

  // fingerprint_set::insert: the roots of the bindings, which a new fingerprint keeps, or null when
  // the instance is already in the set. The hash comes from the bindings themselves, and the set is
  // searched with the bindings and then with their roots.
  insert(quantifier: number, bindings: Enode[]) {
    const manager = this.manager;
    const bindingHashes = this.bindingHashes;
    shrink(bindingHashes, 0);
    for (const binding of bindings) bindingHashes.push(manager.hashes[binding.owner]);
    const hash = getCompositeHash(bindingHashes, manager.ids[quantifier]);
    if (this.find(quantifier, hash, bindings) === -1) return null;
    const bindingRoots = this.bindingRoots;
    shrink(bindingRoots, 0);
    for (const binding of bindings) bindingRoots.push(binding.root);
    const slot = this.find(quantifier, hash, bindingRoots);
    if (slot === -1) return null;
    const roots = bindingRoots.slice();
    this.quantifiers.push(quantifier);
    this.hashes.push(hash);
    this.roots.push(roots);
    if (2 * this.quantifiers.length <= this.slots.length)
      this.slots[slot] = this.quantifiers.length - 1;
    else {
      this.slots = new Int32Array(2 * this.slots.length).fill(-1);
      for (let index = 0; index < this.quantifiers.length; index++) this.place(index);
    }
    return roots;
  }

  // The empty slot that ends the probe for the fingerprint, or -1 when the set has it.
  private find(quantifier: number, hash: number, args: Enode[]) {
    const mask = this.slots.length - 1;
    let slot = hash & mask;
    for (; this.slots[slot] !== -1; slot = (slot + 1) & mask) {
      const index = this.slots[slot];
      if (this.hashes[index] !== hash || this.quantifiers[index] !== quantifier) continue;
      const existing = this.roots[index];
      let position = 0;
      while (position < args.length && existing[position] === args[position]) position++;
      if (position === args.length) return -1;
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
    shrink(this.quantifiers, limit);
    shrink(this.hashes, limit);
    shrink(this.roots, limit);
    shrink(this.scopes, this.scopes.length - numScopes);
  }
}
