// Ported from Z3 (src/math/lp/nla_throttle.h, src/math/lp/nla_throttle.cpp), MIT license, see
// z3-license.txt. The signatures of the lemmas nla has generated in the current scope, so that a
// pass does not generate the same lemma twice.
import type { Rational } from "../rational";
import type { LarSolver } from "./lar-solver";
import type { LpStats } from "./lp-settings";

export const THROTTLE_ORDER_LEMMA = 0;
export const THROTTLE_BINOMIAL_SIGN_LEMMA = 1;
export const THROTTLE_MONOTONE_LEMMA = 2;
export const THROTTLE_TANGENT_LEMMA = 3;

const packRationalSign = (value: Rational) =>
  value.isPositive() ? 1 : value.isNegative() ? 255 : 0;

const normalizeSign = (sign: number) => (sign + 127) >>> 0;

export class NlaThrottle {
  private seen = new Set<string>();

  constructor(
    private lra: LarSolver,
    private stats: LpStats,
  ) {}

  // insert_new: whether the signature, its 8 values padded with zeros, was seen, recording it when
  // not.
  private insertNew(values: number[]) {
    const key = [...values, ...Array.from({ length: 8 - values.length }, () => 0)].join(",");
    if (this.seen.has(key)) {
      this.stats.nlaThrottledLemmas++;
      return true;
    }
    this.seen.add(key);
    this.lra.pushTrail(() => this.seen.delete(key));
    return false;
  }

  insertMonotone(kind: number, monicVar: number, isLt: boolean) {
    return this.insertNew([kind, monicVar, isLt ? 1 : 0]);
  }

  insertBinomialSign(kind: number, xyVar: number, x: number, y: number, sign: number, sy: number) {
    return this.insertNew([kind, xyVar, x, y, normalizeSign(sign), normalizeSign(sy)]);
  }

  insertOrder(
    kind: number,
    acVar: number,
    a: number,
    cSign: Rational,
    c: number,
    bdVar: number,
    bVar: number,
    dSign: Rational,
    d: number,
    abCmp: number,
  ) {
    const last =
      ((packRationalSign(dSign) << 24) | ((d & 0xffff) << 8) | ((abCmp >>> 0) & 0xff)) >>> 0;
    return this.insertNew([kind, acVar, a, packRationalSign(cSign), c, bdVar, bVar, last]);
  }

  insertTangent(
    kind: number,
    monicVar: number,
    xVar: number,
    yVar: number,
    isBelow: boolean,
    planeType: number,
  ) {
    return this.insertNew([kind, monicVar, xVar, yVar, isBelow ? 1 : 0, planeType]);
  }

  insertMonomialBinomialSign(
    kind: number,
    monicVar: number,
    xVar: number,
    yVar: number,
    isBelow: boolean,
  ) {
    return this.insertNew([kind, monicVar, xVar, yVar, isBelow ? 1 : 0]);
  }
}
