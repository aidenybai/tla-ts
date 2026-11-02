// Ported from Z3 (src/util/trail.h, src/util/union_find.h), MIT license, see z3-license.txt. A
// scoped undo trail, and the union-find over it whose merges a pop undoes, which nla's variable
// equivalences and monomial congruence classes use.
import { shrink } from "../array";

export class TrailStack {
  private trail: (() => void)[] = [];
  private scopes: number[] = [];

  push(undo: () => void) {
    this.trail.push(undo);
  }

  pushScope() {
    this.scopes.push(this.trail.length);
  }

  popScope(count: number) {
    if (count === 0) return;
    const size = this.scopes[this.scopes.length - count];
    shrink(this.scopes, this.scopes.length - count);
    while (this.trail.length > size) this.trail.pop()?.();
  }
}

// The handlers of union_find's context: r2 becomes the root of r1's class.
export interface UnionFindHandler {
  mergeEh?: (r2: number, r1: number, v2: number, v1: number) => void;
  afterMergeEh?: (r2: number, r1: number, v2: number, v1: number) => void;
  unmergeEh?: (r2: number, r1: number) => void;
}

export class UnionFind {
  private finds: number[] = [];
  private sizes: number[] = [];
  private nexts: number[] = [];

  handler: UnionFindHandler = {};

  constructor(private trail: TrailStack) {}

  get numVars() {
    return this.finds.length;
  }

  mkVar() {
    const value = this.finds.length;
    this.finds.push(value);
    this.sizes.push(1);
    this.nexts.push(value);
    this.trail.push(() => {
      this.finds.pop();
      this.sizes.pop();
      this.nexts.pop();
    });
    return value;
  }

  find(input: number) {
    let value = input;
    while (this.finds[value] !== value) value = this.finds[value];
    return value;
  }

  next(value: number) {
    return this.nexts[value];
  }

  merge(inputV1: number, inputV2: number) {
    const root1 = this.find(inputV1);
    const root2 = this.find(inputV2);
    if (root1 === root2) return;
    const isSwapped = this.sizes[root1] > this.sizes[root2];
    const r1 = isSwapped ? root2 : root1;
    const r2 = isSwapped ? root1 : root2;
    const v1 = isSwapped ? inputV2 : inputV1;
    const v2 = isSwapped ? inputV1 : inputV2;
    this.handler.mergeEh?.(r2, r1, v2, v1);
    this.finds[r1] = r2;
    this.sizes[r2] += this.sizes[r1];
    this.swapNexts(r1, r2);
    this.trail.push(() => {
      this.sizes[r2] -= this.sizes[r1];
      this.finds[r1] = r1;
      this.swapNexts(r1, r2);
      this.handler.unmergeEh?.(r2, r1);
    });
    this.handler.afterMergeEh?.(r2, r1, v2, v1);
  }

  private swapNexts(first: number, second: number) {
    const saved = this.nexts[first];
    this.nexts[first] = this.nexts[second];
    this.nexts[second] = saved;
  }
}
