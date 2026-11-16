// Ported from Z3 (src/math/lp/explanation.h), MIT license, see z3-license.txt.
import { getIdentityHash, ObjMap } from "../hashtable";
import { Rational } from "../rational";
import { type Dependency, linearize } from "./dependency";

export class Explanation {
  private pairs: [number, Rational][] = [];
  private indices = new ObjMap<true>(getIdentityHash);

  clear() {
    this.pairs = [];
    this.indices.clear();
  }

  addPair(constraint: number, coeff: Rational) {
    this.pairs.push([constraint, coeff]);
  }

  push(constraint: number) {
    this.indices.set(constraint, true);
  }

  pushDependency(dep: Dependency) {
    for (const constraint of linearize([dep])) this.push(constraint);
  }

  get isEmpty() {
    return this.pairs.length === 0 && this.indices.size === 0;
  }

  addExplanation(other: Explanation) {
    if (other.pairs.length === 0)
      for (const constraint of other.indices.keys()) this.push(constraint);
    else for (const pair of other.pairs) this.addPair(pair[0], pair[1]);
  }

  *[Symbol.iterator](): IterableIterator<number> {
    if (this.pairs.length > 0) for (const pair of this.pairs) yield pair[0];
    else yield* this.indices.keys();
  }
}
