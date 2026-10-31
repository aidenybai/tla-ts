// Ported from Z3 (src/math/lp/nla_basics_lemmas.h, src/math/lp/nla_basics_lemmas.cpp), MIT
// license, see z3-license.txt. The basic lemmas of nla on monomials whose values are wrong: signs
// (-ab = (-a)b), zeros (xy = 0 iff x = 0 or y = 0), neutral factors (|xa| = |x| and x != 0 imply
// |a| = 1) and proportions (|xy| >= |y| when x != 0). Only the model-based lemmas are ported: with
// derived = true, basic_lemma returns after the sign lemma, so Z3 never reaches its derived
// zero and neutral lemmas.
import { Rational } from "../rational";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./constraints";
import { LarTerm } from "./lar-term";
import {
  type Factorization,
  getRatSign,
  KIND_NE,
  LemmaBuilder,
  mkIneq,
  type NlaCore,
  signToRat,
} from "./nla-core";
import type { Monic } from "./nla-emonics";

interface FactorValue {
  variable: number;
  value: Rational;
}

export class Basics {
  constructor(private core: NlaCore) {}

  basicLemma(isDerived: boolean) {
    const core = this.core;
    if (this.basicSignLemma(isDerived)) return;
    if (isDerived) return;
    const toRefine = core.toRefine;
    const start = core.random();
    const size = toRefine.size;
    for (let index = 0; index < size; index++)
      this.basicLemmaForMonModelBased(
        core.emons.get(toRefine.elems[(index + start) % toRefine.size]),
      );
  }

  // Signs.

  private basicSignLemmaOnTwoMonics(first: Monic, second: Monic) {
    const sign = signToRat(first.rsign !== second.rsign);
    if (this.core.varVal(first).equals(this.core.varVal(second).mul(sign))) return false;
    this.generateSignLemma(first, second, sign);
    return true;
  }

  private generateZeroLemmas(monic: Monic) {
    let sign = getRatSign(this.core.varVal(monic));
    const fixedZeros: number[] = [];
    const zeroVar = this.findBestZero(monic, fixedZeros);
    let zeroPower = 0;
    for (const lpVar of monic.vars) {
      if (lpVar === zeroVar) {
        zeroPower++;
        continue;
      }
      sign = this.getNonStrictSign(lpVar, sign);
      if (sign === 0) break;
    }
    if (sign !== 0 && zeroPower % 2 === 0) sign = 0;
    if (sign === 0) this.addTrivialZeroLemma(zeroVar, monic);
    else this.generateStrictCaseZeroLemma(monic, zeroVar, sign);
    for (const lpVar of fixedZeros) this.addFixedZeroLemma(monic, lpVar);
  }

  // try_get_non_strict_sign_from_bounds and get_non_strict_sign: the sign times the sign of the
  // variable, from its value or else its bounds, or 0.
  private getNonStrictSign(lpVar: number, sign: number) {
    const core = this.core;
    const value = core.val(lpVar);
    if (!value.isZero()) return sign * getRatSign(value);
    if (core.hasLowerBound(lpVar) && !core.getLowerBound(lpVar).isNegative()) return sign;
    if (core.hasUpperBound(lpVar) && !core.getUpperBound(lpVar).isPositive()) return -sign;
    return 0;
  }

  private basicSignLemmaModelBasedOneMon(monic: Monic, productSign: number) {
    if (productSign === 0) {
      this.generateZeroLemmas(monic);
      return;
    }
    const lemma = new LemmaBuilder(this.core);
    for (const lpVar of monic.vars) this.negateStrictSign(lemma, lpVar);
    lemma.addIneq(mkIneq(monic.variable, productSign === 1 ? KIND_GT : KIND_LT, 0));
  }

  private basicSignLemmaModelBased() {
    const core = this.core;
    const start = core.random();
    const size = core.toRefine.size;
    for (let index = size; index-- > 0;) {
      const monic = core.emons.get(core.toRefine.elems[(start + index) % size]);
      const productSign = core.getMonicSign(monic);
      if (getRatSign(core.varVal(monic)) === productSign) continue;
      this.basicSignLemmaModelBasedOneMon(monic, productSign);
      if (core.done()) return true;
    }
    return core.lemmas.length > 0;
  }

  private basicSignLemmaOnMon(lpVar: number, explored: Set<number>) {
    if (explored.has(lpVar)) return false;
    explored.add(lpVar);
    const core = this.core;
    const monic = core.emons.get(lpVar);
    for (const other of core.emons.getSignEquivMonics(monic))
      if (
        monic.variable !== other.variable &&
        this.basicSignLemmaOnTwoMonics(monic, other) &&
        core.done()
      )
        return true;
    return false;
  }

  private basicSignLemma(isDerived: boolean) {
    if (!isDerived) return this.basicSignLemmaModelBased();
    const explored = new Set<number>();
    for (const lpVar of this.core.toRefine.elems)
      if (this.basicSignLemmaOnMon(lpVar, explored)) return true;
    return false;
  }

  private generateSignLemma(first: Monic, second: Monic, sign: Rational) {
    const lemma = new LemmaBuilder(this.core);
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [first.variable, Rational.one],
          [second.variable, sign.neg()],
        ]),
        KIND_EQ,
        0,
      ),
    );
    lemma.explainMonic(first);
    lemma.explainMonic(second);
  }

  // Zeros.

  // find_best_zero: a variable of value 0, preferably with 0 inside its bounds, and the variables
  // fixed to 0.
  private findBestZero(monic: Monic, fixedZeros: number[]) {
    const core = this.core;
    let zeroVar = -1;
    for (const lpVar of monic.vars) {
      if (!core.val(lpVar).isZero()) continue;
      if (core.varIsFixedToZero(lpVar)) fixedZeros.push(lpVar);
      if (zeroVar === -1 || core.zeroIsAnInnerPointOfBounds(lpVar)) zeroVar = lpVar;
    }
    return zeroVar;
  }

  private addTrivialZeroLemma(zeroVar: number, monic: Monic) {
    const lemma = new LemmaBuilder(this.core);
    lemma.addIneq(mkIneq(zeroVar, KIND_NE, 0));
    lemma.addIneq(mkIneq(monic.variable, KIND_EQ, 0));
  }

  private generateStrictCaseZeroLemma(monic: Monic, zeroVar: number, zeroSign: number) {
    const lemma = new LemmaBuilder(this.core);
    lemma.addIneq(mkIneq(zeroVar, zeroSign === 1 ? KIND_GT : KIND_LT, 0));
    for (const lpVar of monic.vars) if (lpVar !== zeroVar) this.negateStrictSign(lemma, lpVar);
    this.negateStrictSign(lemma, monic.variable);
  }

  private addFixedZeroLemma(monic: Monic, lpVar: number) {
    const lemma = new LemmaBuilder(this.core);
    lemma.explainFixed(lpVar);
    lemma.addIneq(mkIneq(monic.variable, KIND_EQ, 0));
  }

  private negateStrictSign(lemma: LemmaBuilder, lpVar: number) {
    const core = this.core;
    const value = core.val(lpVar);
    if (!value.isZero()) {
      lemma.addIneq(mkIneq(lpVar, getRatSign(value) === 1 ? KIND_LE : KIND_GE, 0));
      return;
    }
    if (core.hasLowerBound(lpVar) && !core.getLowerBound(lpVar).isNegative()) {
      lemma.explainExistingLowerBound(lpVar);
      lemma.addIneq(mkIneq(lpVar, KIND_GT, 0));
      return;
    }
    lemma.explainExistingUpperBound(lpVar);
    lemma.addIneq(mkIneq(lpVar, KIND_LT, 0));
  }

  // Model-based lemmas on the factorizations of a monic.

  private basicLemmaForMonModelBased(rooted: Monic) {
    const core = this.core;
    const isZero = core.varVal(rooted).isZero();
    for (const factorization of core.getFactorizations(rooted)) {
      if (factorization.factors.length === 0) continue;
      if (isZero) {
        this.basicLemmaForMonZeroModelBased(rooted, factorization);
        this.basicLemmaForMonNeutralModelBased(rooted, factorization);
        continue;
      }
      this.basicLemmaForMonNonZeroModelBased(factorization);
      this.basicLemmaForMonNeutralModelBased(rooted, factorization);
      this.proportionLemmaModelBased(rooted, factorization);
    }
  }

  // x != 0 or y = 0 => |xy| >= |y|
  private proportionLemmaModelBased(rooted: Monic, factorization: Factorization) {
    const core = this.core;
    if (core.hasRealFactorization(factorization)) return;
    const rootedValue = core.varVal(rooted).abs();
    if (rootedValue.isZero()) return;
    const factorIndex = factorization.factors.findIndex(
      (factor) => core.valFactor(factor).abs().compare(rootedValue) > 0,
    );
    if (factorIndex !== -1) this.generatePl(rooted, factorization, factorIndex);
  }

  // sign_m*m < 0 or \/_{i != k} f_i = 0 or sign_m*m >= sign_k*f_k
  private generatePlOnMon(monic: Monic, factorIndex: number) {
    const core = this.core;
    const lemma = new LemmaBuilder(core);
    const monicVar = monic.variable;
    const monicSign = Rational.fromNumber(getRatSign(core.val(monicVar)));
    lemma.addIneq(mkIneq(new LarTerm([[monicVar, monicSign]]), KIND_LT, 0));
    monic.vars.forEach((lpVar, index) => {
      if (index !== factorIndex) {
        lemma.addIneq(mkIneq(lpVar, KIND_EQ, 0));
        return;
      }
      const varSign = Rational.fromNumber(getRatSign(core.val(lpVar)));
      lemma.addIneq(
        mkIneq(
          new LarTerm([
            [monicVar, monicSign],
            [lpVar, varSign.neg()],
          ]),
          KIND_GE,
          0,
        ),
      );
    });
  }

  private generatePl(monic: Monic, factorization: Factorization, factorIndex: number) {
    if (factorization.mon !== null) {
      this.generatePlOnMon(monic, factorIndex);
      return;
    }
    const core = this.core;
    const lemma = new LemmaBuilder(core);
    const monicSign = Rational.fromNumber(getRatSign(core.varVal(monic)));
    const monicVar = monic.variable;
    lemma.addIneq(mkIneq(new LarTerm([[monicVar, monicSign]]), KIND_LT, 0));
    factorization.factors.forEach((factor, index) => {
      if (index !== factorIndex) {
        lemma.addIneq(mkIneq(factor.variable, KIND_EQ, 0));
        return;
      }
      const varSign = Rational.fromNumber(getRatSign(core.val(factor.variable)));
      lemma.addIneq(
        mkIneq(
          new LarTerm([
            [monicVar, monicSign],
            [factor.variable, varSign.neg()],
          ]),
          KIND_GE,
          0,
        ),
      );
    });
    lemma.explainFactorization(factorization);
    lemma.explainMonic(monic);
  }

  private isSeparatedFromZero(factorization: Factorization) {
    const core = this.core;
    return factorization.factors.every(
      (factor) =>
        core.varHasPositiveLowerBound(factor.variable) ||
        core.varHasNegativeUpperBound(factor.variable),
    );
  }

  // xy = 0 -> x = 0 or y = 0
  private basicLemmaForMonZeroModelBased(rooted: Monic, factorization: Factorization) {
    const lemma = new LemmaBuilder(this.core);
    lemma.addIneq(mkIneq(rooted.variable, KIND_NE, 0));
    if (!this.isSeparatedFromZero(factorization))
      for (const factor of factorization.factors)
        lemma.addIneq(mkIneq(factor.variable, KIND_EQ, 0));
    else
      for (const factor of factorization.factors)
        lemma.explainVarSeparatedFromZero(factor.variable);
    lemma.explainFactorization(factorization);
  }

  // /\_{j != i} f_j = val(f_j) => m = sign * f_i, or /\_j f_j = val(f_j) => m = sign, over the
  // variables of a monic.
  private basicLemmaForMonNeutralFromFactorsToMonicModelBasedFm(monic: Monic) {
    const core = this.core;
    const neutral = this.getNeutralNotOne(
      monic,
      monic.vars.map((lpVar) => ({ variable: lpVar, value: core.val(lpVar) })),
    );
    if (neutral === undefined) return;
    const lemma = new LemmaBuilder(core);
    for (const lpVar of monic.vars)
      if (neutral.notOne !== lpVar) lemma.addIneq(mkIneq(lpVar, KIND_NE, core.val(lpVar)));
    this.addNeutralConclusion(lemma, monic, neutral.notOne, neutral.sign);
  }

  private addNeutralConclusion(lemma: LemmaBuilder, monic: Monic, notOne: number, sign: Rational) {
    if (notOne === -1) {
      lemma.addIneq(mkIneq(monic.variable, KIND_EQ, sign));
      return;
    }
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [monic.variable, Rational.one],
          [notOne, sign.neg()],
        ]),
        KIND_EQ,
        0,
      ),
    );
  }

  // basic_lemma_for_mon_neutral_monic_to_factor_model_based tests `j == null_lpvar` for the factor
  // equal to the monic in absolute value, which no factor's variable is, so it never makes a
  // lemma (nla_basics_lemmas.cpp, the loop over f).
  private basicLemmaForMonNeutralModelBased(rooted: Monic, factorization: Factorization) {
    if (factorization.mon !== null)
      this.basicLemmaForMonNeutralFromFactorsToMonicModelBasedFm(factorization.mon);
    else this.basicLemmaForMonNeutralFromFactorsToMonicModelBased(rooted, factorization);
  }

  // can_create_lemma_for_mon_neutral_from_factors_to_monic_model_based: the one factor whose
  // value is not +-1, or -1 when there is none, and the product of the other values, when the
  // monic's value disagrees with them.
  private getNeutralNotOne(monic: Monic, factors: FactorValue[]) {
    let sign = Rational.one;
    let notOne = -1;
    for (const factor of factors) {
      if (factor.value.equals(Rational.one)) continue;
      if (factor.value.equals(Rational.minusOne)) {
        sign = sign.neg();
        continue;
      }
      if (notOne === -1) {
        notOne = factor.variable;
        continue;
      }
      return undefined;
    }
    const monicValue = this.core.varVal(monic);
    if (notOne === -1 && monicValue.equals(sign)) return undefined;
    if (notOne !== -1 && monicValue.equals(this.core.val(notOne).mul(sign))) return undefined;
    return { notOne, sign };
  }

  private basicLemmaForMonNeutralFromFactorsToMonicModelBased(
    monic: Monic,
    factorization: Factorization,
  ) {
    const core = this.core;
    const neutral = this.getNeutralNotOne(
      monic,
      factorization.factors.map((factor) => ({
        variable: factor.variable,
        value: core.valFactor(factor),
      })),
    );
    if (neutral === undefined) return;
    if (factorization.factors.some((factor) => factor.isNegated)) return;
    const lemma = new LemmaBuilder(core);
    for (const factor of factorization.factors) {
      if (neutral.notOne === factor.variable) continue;
      lemma.addIneq(mkIneq(factor.variable, KIND_NE, core.val(factor.variable)));
    }
    this.addNeutralConclusion(lemma, monic, neutral.notOne, neutral.sign);
    lemma.explainMonic(monic);
    lemma.explainFactorization(factorization);
  }

  // x = 0 or y = 0 -> xy = 0
  private basicLemmaForMonNonZeroModelBased(factorization: Factorization) {
    const monic = factorization.mon;
    if (monic === null) return;
    const core = this.core;
    const zero = factorization.factors.find((factor) => core.valFactor(factor).isZero());
    if (zero === undefined) return;
    const lemma = new LemmaBuilder(core);
    lemma.addIneq(mkIneq(zero.variable, KIND_NE, 0));
    lemma.addIneq(mkIneq(monic.variable, KIND_EQ, 0));
    lemma.explainFactorization(factorization);
  }
}
