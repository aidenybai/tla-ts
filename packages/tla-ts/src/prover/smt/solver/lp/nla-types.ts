// Ported from Z3 (src/math/lp/nla_types.h, src/math/lp/nla_defs.h, src/math/lp/nla_common.h, and
// lemma_builder of src/math/lp/nla_core.cpp), MIT license, see z3-license.txt. The inequalities and
// lemmas that the nla passes make, and the builder that adds a lemma to the core.
import { Rational } from "../rational";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LE, KIND_LT, KIND_NE } from "./constraints";
import { Explanation } from "./explanation";
import { LarTerm } from "./lar-term";
import type { NlaCore } from "./nla-core";
import type { Monic } from "./nla-emonics";
import type { Factor, Factorization } from "./nla-factorization";

export const negateKind = (kind: number) => {
  switch (kind) {
    case KIND_LE:
      return KIND_GT;
    case KIND_LT:
      return KIND_GE;
    case KIND_GE:
      return KIND_LT;
    case KIND_GT:
      return KIND_LE;
    case KIND_EQ:
      return KIND_NE;
    default:
      return KIND_EQ;
  }
};

export const getRatSign = (value: Rational) =>
  value.isPositive() ? 1 : value.isNegative() ? -1 : 0;

export const signToRat = (isNegated: boolean) => (isNegated ? Rational.minusOne : Rational.one);

// An ineq: term cmp rs.
export interface Ineq {
  readonly cmp: number;
  readonly term: LarTerm;
  readonly rs: Rational;
}

export const mkIneq = (term: LarTerm | number, cmp: number, rs: Rational | number): Ineq => ({
  cmp,
  term: typeof term === "number" ? new LarTerm([[term, Rational.one]]) : term,
  rs: typeof rs === "number" ? Rational.fromNumber(rs) : rs,
});

// A lemma: its explanation implies one of its inequalities, or false when it has none.
export interface Lemma {
  readonly ineqs: Ineq[];
  readonly expl: Explanation;
}

export const isConflictLemma = (lemma: Lemma) => lemma.ineqs.length === 0 && !lemma.expl.isEmpty;

// lemma_builder: adds a lemma to the core and builds it in place.
export class LemmaBuilder {
  private readonly lemma: Lemma = { ineqs: [], expl: new Explanation() };

  constructor(private core: NlaCore) {
    core.lemmas.push(this.lemma);
  }

  get expl() {
    return this.lemma.expl;
  }

  // |=: an inequality, unless the bounds already explain its negation away.
  addIneq(ineq: Ineq) {
    if (!this.core.explainIneq(this, ineq.term, ineq.cmp, ineq.rs)) this.lemma.ineqs.push(ineq);
    return this;
  }

  addExplanation(explanation: Explanation) {
    this.lemma.expl.addExplanation(explanation);
    return this;
  }

  // &= on a monic: the equivalences of its variables.
  explainMonic(monic: Monic) {
    for (const lpVar of monic.vars) this.explainVar(lpVar);
    return this;
  }

  explainFactor(factor: Factor) {
    if (factor.isMon) this.explainMonic(this.core.emons.get(factor.variable));
    else this.explainVar(factor.variable);
    return this;
  }

  explainFactorization(factorization: Factorization) {
    if (factorization.mon !== null) return this;
    for (const factor of factorization.factors) this.explainFactor(factor);
    return this;
  }

  explainVar(lpVar: number) {
    this.core.varEqs.explainVar(lpVar, this.lemma.expl);
    return this;
  }

  explainFixed(lpVar: number) {
    this.explainExistingLowerBound(lpVar);
    this.explainExistingUpperBound(lpVar);
    return this;
  }

  explainVarSeparatedFromZero(lpVar: number) {
    if (this.core.varHasNegativeUpperBound(lpVar)) this.explainExistingUpperBound(lpVar);
    else this.explainExistingLowerBound(lpVar);
    return this;
  }

  explainExistingLowerBound(lpVar: number) {
    const explanation = new Explanation();
    explanation.pushDependency(this.core.lra.getLowerWitness(lpVar));
    return this.addExplanation(explanation);
  }

  explainExistingUpperBound(lpVar: number) {
    const explanation = new Explanation();
    explanation.pushDependency(this.core.lra.getUpperWitness(lpVar));
    return this.addExplanation(explanation);
  }
}
