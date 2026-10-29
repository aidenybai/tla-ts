// Ported from Z3 (src/smt/smt_clause.h, src/smt/smt_b_justification.h), MIT license, see
// z3-license.txt. A disjunction of literals, and the reasons a literal is assigned.
import type { Justification } from "./enode";
import type { Literal } from "./literal";

export const CLS_AUX = 0;
export const CLS_LEARNED = 1;
export const CLS_TH_AXIOM = 2;

// b_justification(l) of BIN_CLAUSE kind: a binary clause propagated because the literal l became true.
export class BinJustification {
  constructor(readonly literal: Literal) {}
}

// b_justification: a clause, a binary clause, a theory justification, an axiom, or a decision (null).
export type BJustification = Clause | BinJustification | Justification | "axiom" | null;

export class Clause {
  isDeleted = false;
  activity = 1;
  isReinit = false;
  isReinternalizeAtoms = false;

  constructor(
    public literals: Literal[],
    readonly kind: number,
    readonly justification: Justification | null,
    // The atoms of the literals, kept so the clause survives backtracking past their creation.
    public atoms: number[] | null,
  ) {}

  isLemma() {
    return this.kind === CLS_LEARNED;
  }
}
