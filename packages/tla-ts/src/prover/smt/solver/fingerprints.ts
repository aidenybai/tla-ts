// Ported from Z3 (src/smt/fingerprints.cpp), MIT license, see z3-license.txt.
import type { AstManager } from "./ast";
import type { Enode } from "./enode";
import { getCompositeHash } from "./hash";
import { shrink } from "./array";

export class FingerprintSet {
  private datas: number[] = [];
  private hashes: number[] = [];
  private roots: Enode[][] = [];
  // Scopes remove the newest fingerprints first, and the table grows by inserting them in order,
  // so emptying the slot of a removed fingerprint never cuts the probe of one that remains.
  private slots = new Int32Array(1024).fill(-1);
  private scopes: number[] = [];
  private bindingHashes: number[] = [];
  private bindingRoots: Enode[] = [];

  constructor(private manager: AstManager) {}

  // The hash comes from the bindings themselves, and the set is searched with the bindings and
  // then with their roots.
  insert(data: number, dataHash: number, bindings: Enode[]) {
    const manager = this.manager;
    const bindingHashes = this.bindingHashes;
    shrink(bindingHashes, 0);
    for (const binding of bindings) bindingHashes.push(manager.hashes[binding.owner]);
    const hash = getCompositeHash(bindingHashes, dataHash);
    if (this.find(data, hash, bindings) === -1) return null;
    const bindingRoots = this.bindingRoots;
    shrink(bindingRoots, 0);
    for (const binding of bindings) bindingRoots.push(binding.root);
    const slot = this.find(data, hash, bindingRoots);
    if (slot === -1) return null;
    const roots = bindingRoots.slice();
    this.datas.push(data);
    this.hashes.push(hash);
    this.roots.push(roots);
    if (2 * this.datas.length <= this.slots.length) this.slots[slot] = this.datas.length - 1;
    else {
      this.slots = new Int32Array(2 * this.slots.length).fill(-1);
      for (let index = 0; index < this.datas.length; index++) this.place(index);
    }
    return roots;
  }

  private find(data: number, hash: number, args: Enode[]) {
    const mask = this.slots.length - 1;
    let slot = hash & mask;
    for (; this.slots[slot] !== -1; slot = (slot + 1) & mask) {
      const index = this.slots[slot];
      if (this.hashes[index] !== hash || this.datas[index] !== data) continue;
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
    this.scopes.push(this.datas.length);
  }

  pop(numScopes: number) {
    const limit = this.scopes[this.scopes.length - numScopes];
    const mask = this.slots.length - 1;
    for (let index = this.datas.length - 1; index >= limit; index--) {
      let slot = this.hashes[index] & mask;
      while (this.slots[slot] !== index) slot = (slot + 1) & mask;
      this.slots[slot] = -1;
    }
    shrink(this.datas, limit);
    shrink(this.hashes, limit);
    shrink(this.roots, limit);
    shrink(this.scopes, this.scopes.length - numScopes);
  }
}
