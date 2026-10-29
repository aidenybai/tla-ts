// Ported from Z3 (src/smt/fingerprints.cpp), MIT license, see z3-license.txt. The set of
// quantifier instances already found, keyed by the quantifier and the roots of the bindings, so a
// match on equal terms is not instantiated twice. Scopes undo the insertions.
import type { Enode } from "./enode";

interface Fingerprint {
  hash: number;
  quantifier: number;
  roots: Enode[];
}

export class FingerprintSet {
  private table = new Map<number, Fingerprint[]>();
  private trail: Fingerprint[] = [];
  private scopes: number[] = [];

  // Returns false when the instance is already in the set.
  insert(quantifier: number, roots: Enode[]) {
    let hash = quantifier;
    for (const root of roots) hash = (Math.imul(hash, 0x9e3779b1) + root.owner) | 0;
    const bucket = this.table.get(hash);
    if (
      bucket?.some(
        (fingerprint) =>
          fingerprint.quantifier === quantifier &&
          fingerprint.roots.every((root, index) => root === roots[index]),
      )
    )
      return false;
    const fingerprint = { hash, quantifier, roots };
    if (bucket === undefined) this.table.set(hash, [fingerprint]);
    else bucket.push(fingerprint);
    this.trail.push(fingerprint);
    return true;
  }

  push() {
    this.scopes.push(this.trail.length);
  }

  pop(numScopes: number) {
    const limit = this.scopes[this.scopes.length - numScopes];
    for (let index = this.trail.length - 1; index >= limit; index--) {
      const hash = this.trail[index].hash;
      const bucket = this.table.get(hash);
      bucket?.pop();
      if (bucket?.length === 0) this.table.delete(hash);
    }
    this.trail.length = limit;
    this.scopes.length -= numScopes;
  }
}
