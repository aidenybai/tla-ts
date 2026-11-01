// Ported from Z3 (src/ast/rewriter/bool_rewriter.cpp), MIT license, see z3-license.txt. The
// literals of a flattened conjunction or disjunction, without duplicates. Like the expr_fast_mark1
// and expr_fast_mark2 of mk_nflat_and_core, it marks the literals and the negated atoms it holds,
// here with a stamp for each use, so it finds a complementary pair without creating each negation.
// Its manager owns the one instance that its rewriters share: a list is filled and read before any
// other starts, so like Z3's ptr_buffer it reuses one array.
import { shrink } from "./array";
import type { AstManager } from "./ast";

export class FlatLiterals {
  readonly list: number[] = [];
  private stamp = 0;
  private literalStamps = new Int32Array(1024);
  private negatedAtomStamps = new Int32Array(1024);

  constructor(private manager: AstManager) {}

  // Starts a new, empty list.
  clear() {
    shrink(this.list, 0);
    this.stamp++;
  }

  // Adds a literal, and returns whether its complement is already there. An expression's arguments
  // are older than it, so their ids are smaller.
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
    const atom = isNegated ? manager.args[literal][0] : literal;
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
