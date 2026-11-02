// Ported from Z3 (src/math/lp/explanation.h), MIT license, see z3-license.txt. The constraints
// behind a conflict or a propagation: weighted pairs, or a set of constraint indices whose
// iteration order is the slot order of Z3's hashtable.
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

  // push_explanation: the constraints behind a dependency.
  pushDependency(dep: Dependency) {
    for (const constraint of linearize([dep])) this.push(constraint);
  }

  get isEmpty() {
    return this.pairs.length === 0 && this.indices.size === 0;
  }

  // add_expl: the pairs of the other explanation, or its indices when it has no pairs.
  addExplanation(other: Explanation) {
    if (other.pairs.length === 0)
      for (const constraint of other.indices.keys()) this.push(constraint);
    else for (const pair of other.pairs) this.addPair(pair[0], pair[1]);
  }

  // The constraints, from the pairs when there are any and from the indices otherwise.
  *[Symbol.iterator](): IterableIterator<number> {
    if (this.pairs.length > 0) for (const pair of this.pairs) yield pair[0];
    else yield* this.indices.keys();
  }
}
