// Ported from Z3 (src/math/lp/nla_order_lemmas.h, src/math/lp/nla_order_lemmas.cpp), MIT
// license, see z3-license.txt. The order lemmas of nla: a > b and c > 0 imply ac > bc, over the
// binary factorizations of the monomials to refine, and the sign lemmas of binomials.
import { Rational } from "../rational";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./constraints";
import { LarTerm } from "./lar-term";
import {
  type Factor,
  type Factorization,
  getFactorSign,
  getRatSign,
  KIND_NE,
  LemmaBuilder,
  mkFactor,
  mkIneq,
  negateKind,
  NLA_PARAMS,
  type NlaCore,
  signToRat,
} from "./nla-core";
import type { Monic } from "./nla-emonics";
import { getSignedVarVar } from "./nla-var-eqs";
import { THROTTLE_BINOMIAL_SIGN_LEMMA, THROTTLE_ORDER_LEMMA } from "./nla-throttle";

export class Order {
  constructor(private core: NlaCore) {}

  orderLemma() {
    if (!NLA_PARAMS.order) return;
    const core = this.core;
    const toRefine = core.toRefine;
    const offset = core.random();
    const size = toRefine.size;
    for (let index = 0; index < size && !core.done(); index++)
      this.orderLemmaOnMonic(core.emons.get(toRefine.elems[(index + offset) % size]));
  }

  private orderLemmaOnMonic(monic: Monic) {
    const core = this.core;
    for (const factorization of core.getFactorizations(monic)) {
      if (factorization.factors.length !== 2) continue;
      if (factorization.mon !== null) this.orderLemmaOnBinomial(factorization.mon);
      else this.orderLemmaOnFactorization(monic, factorization);
      if (core.done()) break;
    }
  }

  // Either variable of the binomial plays the role of c.
  private orderLemmaOnBinomial(ac: Monic) {
    const core = this.core;
    const isGt = core.varVal(ac).compare(core.mulVal(ac)) > 0;
    for (const k of [0, 1]) {
      this.orderLemmaOnBinomialSign(ac, ac.vars[k], ac.vars[1 - k], isGt ? 1 : -1);
      this.orderLemmaOnFactorBinomialExplore(ac, k);
    }
  }

  // y <= 0 or x < a or xy >= ay, and the like for the sign of val(xy) - val(x) * val(y).
  private orderLemmaOnBinomialSign(xy: Monic, x: number, y: number, sign: number) {
    if (!NLA_PARAMS.orderBinomialSign) return;
    const core = this.core;
    if (!core.varIsInt(x) && core.val(x).isBig()) return;
    const ySign = getRatSign(core.val(y));
    if (
      core.throttle.insertBinomialSign(THROTTLE_BINOMIAL_SIGN_LEMMA, xy.variable, x, y, sign, ySign)
    )
      return;
    const lemma = new LemmaBuilder(core);
    lemma.addIneq(mkIneq(y, ySign === 1 ? KIND_LE : KIND_GE, 0));
    lemma.addIneq(mkIneq(x, ySign * sign === 1 ? KIND_GT : KIND_LT, core.val(x)));
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [xy.variable, Rational.one],
          [y, core.val(x).neg()],
        ]),
        sign === 1 ? KIND_LE : KIND_GE,
        0,
      ),
    );
  }

  // The monics bd with d equivalent to ac[k].
  private orderLemmaOnFactorBinomialExplore(ac: Monic, k: number) {
    const core = this.core;
    for (const bd of core.emons.getProductsOf(ac.vars[k])) {
      if (bd.variable === ac.variable) continue;
      this.orderLemmaOnFactorBinomialRm(ac, k, bd);
      if (core.done()) break;
    }
  }

  private orderLemmaOnFactorBinomialRm(ac: Monic, k: number, bd: Monic) {
    const d = mkFactor(getSignedVarVar(this.core.varEqs.findVar(ac.vars[k])), false);
    const b = this.core.divide(bd, d);
    if (b !== undefined) this.orderLemmaOnBinomialAcBd(ac, k, bd, b, d.variable);
  }

  // ac >= bd && |c| = |d| => ac/|c| >= bd/|d|
  private orderLemmaOnBinomialAcBd(ac: Monic, k: number, bd: Monic, b: Factor, d: number) {
    const core = this.core;
    const a = ac.vars[1 - k];
    const c = ac.vars[k];
    const acValue = core.varVal(ac);
    const cSign = Rational.fromNumber(getRatSign(core.val(c)));
    const dSign = Rational.fromNumber(getRatSign(core.val(d)));
    const bdValue = core.varVal(bd);
    const aTimesCSign = core.val(a).mul(cSign);
    const bTimesDSign = core.valFactor(b).mul(dSign);
    if (acValue.compare(bdValue) >= 0 && aTimesCSign.compare(bTimesDSign) < 0)
      this.generateMonOl(ac, a, cSign, c, bd, b, dSign, d, KIND_LT);
    else if (acValue.compare(bdValue) <= 0 && aTimesCSign.compare(bTimesDSign) > 0)
      this.generateMonOl(ac, a, cSign, c, bd, b, dSign, d, KIND_GT);
  }

  // ac > bd => ac/|c| > bd/|d| => a*c_sign > b*d_sign, whose last inequality does not hold.
  private generateMonOl(
    ac: Monic,
    a: number,
    cSign: Rational,
    c: number,
    bd: Monic,
    b: Factor,
    dSign: Rational,
    d: number,
    abCmp: number,
  ) {
    const core = this.core;
    if (
      core.throttle.insertOrder(
        THROTTLE_ORDER_LEMMA,
        ac.variable,
        a,
        cSign,
        c,
        bd.variable,
        b.variable,
        dSign,
        d,
        abCmp,
      )
    )
      return;
    const lemma = new LemmaBuilder(core);
    lemma.addIneq(mkIneq(new LarTerm([[c, cSign]]), KIND_LE, 0));
    lemma.explainVar(c);
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [a, cSign],
          [b.variable, dSign.mul(getFactorSign(b)).neg()],
        ]),
        negateKind(abCmp),
        0,
      ),
    );
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [ac.variable, Rational.one],
          [bd.variable, Rational.minusOne],
        ]),
        abCmp,
        0,
      ),
    );
    lemma.explainMonic(bd);
    lemma.explainFactor(b);
    lemma.explainVar(d);
  }

  // ac_f[k] plays the role of c.
  private orderLemmaOnAcAndBc(ac: Monic, acFactorization: Factorization, k: number, bd: Monic) {
    const factors = acFactorization.factors;
    const b = this.core.divide(bd, factors[k]);
    return (
      b !== undefined && this.orderLemmaOnAcAndBcAndFactors(ac, factors[1 - k], factors[k], bd, b)
    );
  }

  // m = ab: a monic n = cd with |b| = |d| gives m R n & |b| = |d| => ab/|b| R cd/|d|.
  private orderLemmaOnFactorization(monic: Monic, ab: Factorization) {
    const core = this.core;
    let isNegated = false;
    for (const factor of ab.factors) isNegated = isNegated !== factor.isNegated;
    const sign = signToRat(isNegated);
    const factorsValue = core.val(ab.factors[0].variable).mul(core.val(ab.factors[1].variable));
    const monicValue = sign.mul(core.varVal(monic));
    if (!monicValue.equals(factorsValue) && !core.hasReal(monic)) {
      const isGt = monicValue.compare(factorsValue) > 0;
      for (let j = 0, k = 1; j < 2; j++, k--) {
        const lemma = new LemmaBuilder(core);
        this.orderLemmaOnAb(
          lemma,
          monic,
          sign,
          ab.factors[k].variable,
          ab.factors[j].variable,
          isGt,
        );
        lemma.explainFactorization(ab);
        lemma.explainMonic(monic);
      }
    }
    for (const k of [0, 1]) this.orderLemmaOnAcExplore(monic, ab, k);
  }

  private orderLemmaOnAcExplore(rooted: Monic, ac: Factorization, k: number) {
    const c = ac.factors[k];
    const emons = this.core.emons;
    const candidates = c.isMon ? emons.getProductsOf(c.variable) : emons.getUseList(c.variable);
    for (const bc of candidates) if (this.orderLemmaOnAcAndBc(rooted, ac, k, bc)) return;
  }

  private generateOlEq(ac: Monic, a: Factor, c: Factor, bc: Monic, b: Factor) {
    const lemma = new LemmaBuilder(this.core);
    lemma.addIneq(mkIneq(c.variable, KIND_EQ, 0));
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [ac.variable, Rational.one],
          [bc.variable, Rational.minusOne],
        ]),
        KIND_NE,
        0,
      ),
    );
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [a.variable, getFactorSign(a)],
          [b.variable, getFactorSign(b).neg()],
        ]),
        KIND_EQ,
        0,
      ),
    );
    this.explainOl(lemma, ac, a, bc, b, c);
  }

  // c > 0 and ac >= bc => a >= b, and the like for the other signs and relations.
  private generateOl(ac: Monic, a: Factor, c: Factor, bc: Monic, b: Factor) {
    const core = this.core;
    const lemma = new LemmaBuilder(core);
    lemma.addIneq(mkIneq(c.variable, core.val(c.variable).isNegative() ? KIND_GE : KIND_LE, 0));
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [ac.variable, Rational.one],
          [bc.variable, Rational.minusOne],
        ]),
        core.varVal(ac).compare(core.varVal(bc)) < 0 ? KIND_GT : KIND_LT,
        0,
      ),
    );
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [a.variable, getFactorSign(a)],
          [b.variable, getFactorSign(b).neg()],
        ]),
        core.valFactor(a).compare(core.valFactor(b)) < 0 ? KIND_GE : KIND_LE,
        0,
      ),
    );
    this.explainOl(lemma, ac, a, bc, b, c);
  }

  private explainOl(lemma: LemmaBuilder, ac: Monic, a: Factor, bc: Monic, b: Factor, c: Factor) {
    lemma.explainMonic(ac);
    lemma.explainFactor(a);
    lemma.explainMonic(bc);
    lemma.explainFactor(b);
    lemma.explainFactor(c);
  }

  // ac = a*c and bc = b*c: ac >= bc implies ac/|c| >= bc/|c|.
  private orderLemmaOnAcAndBcAndFactors(ac: Monic, a: Factor, c: Factor, bc: Monic, b: Factor) {
    const core = this.core;
    const cSign = Rational.fromNumber(getRatSign(core.valFactor(c)));
    const aTimesCSign = core.valFactor(a).mul(cSign);
    const bTimesCSign = core.valFactor(b).mul(cSign);
    const comparison = core.varVal(ac).compare(core.varVal(bc));
    const factorComparison = aTimesCSign.compare(bTimesCSign);
    if ((comparison > 0 && factorComparison < 0) || (comparison < 0 && factorComparison > 0)) {
      this.generateOl(ac, a, c, bc, b);
      return true;
    }
    if (comparison === 0 && factorComparison !== 0) {
      this.generateOlEq(ac, a, c, bc, b);
      return true;
    }
    return false;
  }

  // sign * m = ab: b != val(b) or sign*m <= a*val(b), or >= when not gt.
  private orderLemmaOnAb(
    lemma: LemmaBuilder,
    monic: Monic,
    sign: Rational,
    a: number,
    b: number,
    isGt: boolean,
  ) {
    const core = this.core;
    lemma.addIneq(mkIneq(b, KIND_NE, core.val(b)));
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [monic.variable, sign],
          [a, core.val(b).neg()],
        ]),
        isGt ? KIND_LE : KIND_GE,
        0,
      ),
    );
  }
}
