// Ported from Z3 (src/ast/rewriter/bool_rewriter.cpp), MIT license, see z3-license.txt.
import { shrink } from "./array";
import type { AstManager } from "./ast";

export class FlatLiterals {
  readonly list: number[] = [];
  private stamp = 0;
  private literalStamps = new Int32Array(1024);
  private negatedAtomStamps = new Int32Array(1024);

  constructor(private manager: AstManager) {}

  clear() {
    shrink(this.list, 0);
    this.stamp++;
  }

  add(literal: number) {
    const manager = this.manager;
    if (literal >= this.literalStamps.length) {
      const size = Math.max(2 * this.literalStamps.length, literal + 1);
      const literalStamps = new Int32Array(size);
      literalStamps.set(this.literalStamps);
      this.literalStamps = literalStamps;
      const negatedAtomStamps = new Int32Array(size);
      negatedAtomStamps.set(this.negatedAtomStamps);
      this.negatedAtomStamps = negatedAtomStamps;
    }
    if (this.literalStamps[literal] === this.stamp) return false;
    const isNegated = manager.isNot(literal);
    const atom = isNegated ? manager.getArg(literal, 0) : literal;
    if (
      isNegated
        ? this.literalStamps[atom] === this.stamp
        : this.negatedAtomStamps[atom] === this.stamp
    )
      return true;
    this.list.push(literal);
    this.literalStamps[literal] = this.stamp;
    if (isNegated) this.negatedAtomStamps[atom] = this.stamp;
    return false;
  }
}
