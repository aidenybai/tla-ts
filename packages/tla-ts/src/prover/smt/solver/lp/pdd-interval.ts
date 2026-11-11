// Ported from Z3 (src/math/dd/pdd_interval.h), MIT license, see z3-license.txt.
import {
  add,
  type DepInterval,
  type DepsMode,
  mkDepInterval,
  mul,
  setValue,
} from "./dep-intervals";
import type { Pdd } from "./pdd";

export const getPddInterval = (
  poly: Pdd,
  mode: DepsMode,
  getVarInterval: (variable: number, mode: DepsMode) => DepInterval,
): DepInterval => {
  const result = mkDepInterval();
  if (poly.isVal()) {
    setValue(result, poly.val());
    return result;
  }
  const varInterval = getVarInterval(poly.var(), mode);
  const hi = getPddInterval(poly.hi(), mode, getVarInterval);
  const lo = getPddInterval(poly.lo(), mode, getVarInterval);
  const product = mkDepInterval();
  mul(hi, varInterval, product, mode);
  add(product, lo, result, mode);
  return result;
};
