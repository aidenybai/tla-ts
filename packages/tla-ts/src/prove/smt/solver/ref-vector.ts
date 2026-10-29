// Ported from Z3 (src/util/ref_vector.h), MIT license, see z3-license.txt. expr_ref_vector: a vector
// that holds a reference to each expression in it, with -1 for Z3's null pointer.
import type { AstManager } from "./ast";

export class RefVector {
  items: number[] = [];

  constructor(private manager: AstManager) {}

  get size() {
    return this.items.length;
  }

  private incRef(expr: number) {
    if (expr !== -1) this.manager.incRef(expr);
  }

  private decRef(expr: number) {
    if (expr !== -1) this.manager.decRef(expr);
  }

  push(expr: number) {
    this.incRef(expr);
    this.items.push(expr);
  }

  // push_back(expr_ref&&): takes over a reference the caller owns.
  pushOwned(expr: number) {
    this.items.push(expr);
  }

  set(index: number, expr: number) {
    this.incRef(expr);
    this.decRef(this.items[index]);
    this.items[index] = expr;
  }

  // operator=(expr_ref&&): takes over a reference the caller owns.
  setOwned(index: number, expr: number) {
    this.decRef(this.items[index]);
    this.items[index] = expr;
  }

  pop() {
    this.decRef(this.items.pop() as number);
  }

  // shrink: releases the removed expressions in order.
  shrink(size: number) {
    for (const expr of this.items.splice(size)) this.decRef(expr);
  }

  // resize: a larger vector is filled with null pointers.
  resize(size: number) {
    if (size < this.items.length) this.shrink(size);
    while (this.items.length < size) this.items.push(-1);
  }

  reset() {
    this.shrink(0);
  }
}
