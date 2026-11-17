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
  const hiPoly = poly.hi();
  const hi = getPddInterval(hiPoly, mode, getVarInterval);
  hiPoly.release();
  const loPoly = poly.lo();
  const lo = getPddInterval(loPoly, mode, getVarInterval);
  loPoly.release();
  const product = mkDepInterval();
  mul(hi, varInterval, product, mode);
  add(product, lo, result, mode);
  return result;
};
