// Ported from Z3 (src/util/ref_vector.h), MIT license, see z3-license.txt.
// -1 stands for Z3's null pointer.
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

  pushOwned(expr: number) {
    this.items.push(expr);
  }

  set(index: number, expr: number) {
    this.incRef(expr);
    this.decRef(this.items[index]);
    this.items[index] = expr;
  }

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

  resize(size: number) {
    if (size < this.items.length) this.shrink(size);
    while (this.items.length < size) this.items.push(-1);
  }

  reset() {
    this.shrink(0);
  }
}
