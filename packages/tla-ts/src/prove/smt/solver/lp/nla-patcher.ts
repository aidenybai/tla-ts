// Ported from Z3 (src/math/lp/nla_patcher.{h,cpp}, src/util/mpz.cpp is_perfect_square), MIT
// license, see z3-license.txt. Moves the values of monic variables, or of one of their factors, to
// agree with the products, without breaking monics that are already correct.
import { Rational } from "../rational";
import type { Impq } from "./numeric-pair";
import type { NlaCore } from "./nla-core";
import type { Monic } from "./nla-emonics";

// The square root of a non-negative integer when it is a perfect square.
const getIntSqrt = (value: bigint) => {
  if (value < 0n) return undefined;
  if (value < 2n) return value;
  let root = value;
  let next = (root + 1n) / 2n;
  while (next < root) {
    root = next;
    next = (root + value / root) / 2n;
  }
  return root * root === value ? root : undefined;
};

const getPerfectSquareRoot = (value: Rational) => {
  const num = getIntSqrt(value.num);
  if (num === undefined) return undefined;
  if (value.den === 1n) return Rational.of(num);
  const den = getIntSqrt(value.den);
  return den === undefined ? undefined : Rational.of(num, den);
};

// in_power: whether the variable at an index occurs next to an equal one.
const isInPower = (vars: number[], index: number) => {
  const lpVar = vars[index];
  return (
    (index !== 0 && vars[index - 1] === lpVar) ||
    (index + 1 < vars.length && lpVar === vars[index + 1])
  );
};

export class Patcher {
  private patchedVar = 0;
  private patchedMonic: Monic | undefined;

  constructor(private core: NlaCore) {}

  private varBreaksCorrectMonicAsFactor(lpVar: number, monic: Monic) {
    const core = this.core;
    if (!core.varVal(monic).isZero()) return true;
    if (!core.val(lpVar).isZero()) return false;
    return !monic.vars.some((other) => other !== lpVar && core.val(other).isZero());
  }

  private varBreaksCorrectMonic(lpVar: number) {
    const core = this.core;
    if (core.isMonicVar(lpVar) && !core.toRefine.has(lpVar)) return true;
    for (const monic of core.emons.getUseList(lpVar)) {
      if (core.toRefine.has(monic.variable)) continue;
      if (this.varBreaksCorrectMonicAsFactor(lpVar, monic)) return true;
    }
    return false;
  }

  private updateToRefineOfVar(lpVar: number) {
    const core = this.core;
    const update = (monic: Monic) => {
      if (core.varVal(monic).equals(core.mulVal(monic))) core.eraseFromToRefine(monic.variable);
      else core.insertToRefine(monic.variable);
    };
    for (const monic of core.emons.getUseList(lpVar)) update(monic);
    if (core.isMonicVar(lpVar)) update(core.emon(lpVar));
  }

  private isPatchBlocked(lpVar: number, value: Impq) {
    const core = this.core;
    if (!core.lra.insideBounds(lpVar, value) || (core.varIsInt(lpVar) && !value.isInt()))
      return true;
    if (lpVar === this.patchedVar) return false;
    const monic = this.patchedMonic;
    if (monic !== undefined && (monic.containsVar(lpVar) || lpVar === monic.variable)) return true;
    return this.varBreaksCorrectMonic(lpVar);
  }

  private tryToPatch(value: Rational) {
    return this.core.lra.tryToPatch(
      this.patchedVar,
      value,
      (lpVar, target) => this.isPatchBlocked(lpVar, target),
      (lpVar) => this.updateToRefineOfVar(lpVar),
    );
  }

  private patchMonomial(lpVar: number) {
    const core = this.core;
    const monic = core.emon(lpVar);
    this.patchedMonic = monic;
    this.patchedVar = lpVar;
    const product = core.mulVal(monic);
    if (core.val(lpVar).equals(product)) {
      core.eraseFromToRefine(lpVar);
      return;
    }
    if (!this.varBreaksCorrectMonic(lpVar) && this.tryToPatch(product)) return;
    if (monic.vars.length === 2 && monic.vars[0] === monic.vars[1]) {
      const root = getPerfectSquareRoot(product);
      if (root === undefined) return;
      this.patchedVar = monic.vars[0];
      if (!this.varBreaksCorrectMonic(this.patchedVar))
        if (this.tryToPatch(root) || this.tryToPatch(root.neg())) return;
      return;
    }
    if (product.isZero()) return;
    const ratio = core.val(lpVar).div(product);
    for (let index = 0; index < monic.size; index++) {
      this.patchedVar = monic.vars[index];
      if (
        !isInPower(monic.vars, index) &&
        !this.varBreaksCorrectMonic(this.patchedVar) &&
        this.tryToPatch(ratio.mul(core.val(this.patchedVar)))
      ) {
        core.eraseFromToRefine(lpVar);
        break;
      }
    }
  }

  patchMonomials() {
    const core = this.core;
    const toRefine = [...core.toRefine.elems];
    const size = toRefine.length;
    const start = core.random();
    for (let index = 0; index < size && core.toRefine.size > 0; index++)
      this.patchMonomial(toRefine[(start + index) % size]);
  }
}
