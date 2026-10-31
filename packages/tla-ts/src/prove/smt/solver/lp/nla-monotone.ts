// Ported from Z3 (src/math/lp/nla_monotone_lemmas.h, src/math/lp/nla_monotone_lemmas.cpp), MIT
// license, see z3-license.txt. The monotonicity lemmas of nla: the absolute value of a monomial is
// at most, or at least, the product of its factors' absolute values when they are.
import { Rational } from "../rational";
import { KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./constraints";
import { LemmaBuilder, mkIneq, type NlaCore } from "./nla-core";
import type { Monic } from "./nla-emonics";
import { THROTTLE_MONOTONE_LEMMA } from "./nla-throttle";

export class Monotone {
  constructor(private core: NlaCore) {}

  monotonicityLemma() {
    const core = this.core;
    const shift = core.random();
    const size = core.toRefine.size;
    for (let index = 0; index < size && !core.done(); index++)
      this.monotonicityLemmaOnMonic(core.emons.get(core.toRefine.elems[(index + shift) % size]));
  }

  private monotonicityLemmaOnMonic(monic: Monic) {
    const core = this.core;
    if (core.monHasZero(monic.vars) || core.hasBigNum(monic)) return;
    const productValue = core.productValue(monic).abs();
    const monicValue = core.varVal(monic).abs();
    const isLt = monicValue.compare(productValue) < 0;
    if (core.throttle.insertMonotone(THROTTLE_MONOTONE_LEMMA, monic.variable, isLt)) return;
    if (isLt) this.monotonicityLemmaLt(monic);
    else if (monicValue.compare(productValue) > 0) this.monotonicityLemmaGt(monic);
  }

  // /\_i |m[i]| <= |val(m[i])| => |m| <= |product_i val(m[i])|
  private monotonicityLemmaGt(monic: Monic) {
    const core = this.core;
    const lemma = new LemmaBuilder(core);
    let product = Rational.one;
    for (const lpVar of monic.vars) {
      const value = core.val(lpVar);
      lemma.addIneq(mkIneq(lpVar, value.isNegative() ? KIND_LT : KIND_GT, value));
      lemma.addIneq(mkIneq(lpVar, value.isNegative() ? KIND_GT : KIND_LT, 0));
      product = product.mul(value);
    }
    lemma.addIneq(mkIneq(monic.variable, product.isNegative() ? KIND_GE : KIND_LE, product));
  }

  // /\_i |m[i]| >= |val(m[i])| => |m| >= |product_i val(m[i])|
  private monotonicityLemmaLt(monic: Monic) {
    const core = this.core;
    const lemma = new LemmaBuilder(core);
    let product = Rational.one;
    for (const lpVar of monic.vars) {
      const value = core.val(lpVar);
      lemma.addIneq(mkIneq(lpVar, value.isNegative() ? KIND_GT : KIND_LT, value));
      product = product.mul(value);
    }
    lemma.addIneq(mkIneq(monic.variable, product.isNegative() ? KIND_LE : KIND_GE, product));
  }
}
