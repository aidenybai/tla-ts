// Ported from Z3 (src/math/lp/factorization.h), MIT license, see z3-license.txt.
import type { Monic } from "./nla-emonics";
import { signToRat } from "./nla-types";

export interface Factor {
  variable: number;
  isMon: boolean;
  isNegated: boolean;
}

export const mkFactor = (variable: number, isMon: boolean): Factor => ({
  variable,
  isMon,
  isNegated: false,
});

export const getFactorSign = (factor: Factor) => signToRat(factor.isNegated);

export interface Factorization {
  readonly factors: Factor[];
  mon: Monic | null;
}

export const mkMonFactorization = (monic: Monic): Factorization => ({
  factors: monic.vars.map((lpVar) => mkFactor(lpVar, false)),
  mon: monic,
});
