// Ported from Z3 (src/math/lp/random_updater_def.h, and shift_var and
// get_freedom_interval_for_column in src/math/lp/int_solver.cpp), MIT license, see
// z3-license.txt. Moves non-basic columns to random values inside the interval that keeps every
// row feasible, so that columns with equal values, which theory combination would assume equal,
// become different.
import { getLcm, Rational } from "../rational";
import { IndexedUintSet } from "./containers";
import type { LarSolver } from "./lar-solver";
import { Impq } from "./numeric-pair";

const RANGE = 100000;

interface FreedomInterval {
  lower: Impq | undefined;
  upper: Impq | undefined;
  multiple: Rational;
}

// get_freedom_interval_for_column: the values of a non-basic column that keep the basic columns
// that depend on it within their bounds.
const getFreedomInterval = (solver: LarSolver, column: number): FreedomInterval | undefined => {
  const core = solver.core;
  if (core.isBase(column) || solver.isFixed(column)) return undefined;
  const value = solver.getValue(column);
  let lower: Impq | undefined;
  let upper: Impq | undefined;
  let multiple = 1n;
  const setLower = (candidate: Impq) => {
    if (lower === undefined || candidate.compare(lower) > 0) lower = candidate;
  };
  const setUpper = (candidate: Impq) => {
    if (upper === undefined || candidate.compare(upper) < 0) upper = candidate;
  };
  if (core.hasLowerBound(column)) setLower(solver.getLowerBound(column).sub(value));
  if (core.hasUpperBound(column)) setUpper(solver.getUpperBound(column).sub(value));
  const getDelta = (coeff: Rational, first: Impq, second: Impq) => {
    if (coeff.equals(Rational.one)) return first.sub(second);
    if (coeff.equals(Rational.minusOne)) return second.sub(first);
    return first.sub(second).div(coeff);
  };
  for (const cell of core.matrix.columns[column]) {
    const coeff = core.matrix.getVal(cell);
    const basic = core.basis[cell.row];
    const basicValue = solver.getValue(basic);
    if (solver.isInt(basic) && !coeff.isInt() && basicValue.isInt())
      multiple = getLcm(multiple, coeff.den);
    if (lower !== undefined && upper !== undefined && lower.equals(upper)) continue;
    if (coeff.isNegative()) {
      if (core.hasLowerBound(basic))
        setLower(getDelta(coeff, basicValue, solver.getLowerBound(basic)));
      if (core.hasUpperBound(basic))
        setUpper(getDelta(coeff, basicValue, solver.getUpperBound(basic)));
    } else {
      if (core.hasUpperBound(basic))
        setLower(getDelta(coeff, basicValue, solver.getUpperBound(basic)));
      if (core.hasLowerBound(basic))
        setUpper(getDelta(coeff, basicValue, solver.getLowerBound(basic)));
    }
  }
  const shiftedLower = lower?.add(value);
  const shiftedUpper = upper?.add(value);
  if (
    shiftedLower !== undefined &&
    shiftedUpper !== undefined &&
    shiftedLower.compare(shiftedUpper) > 0
  )
    return undefined;
  return { lower: shiftedLower, upper: shiftedUpper, multiple: Rational.of(multiple) };
};

// int_solver::shift_var.
const shiftVar = (solver: LarSolver, column: number) => {
  if (solver.isFixed(column) || solver.isBase(column) || solver.settings.isCanceled()) return false;
  const interval = getFreedomInterval(solver, column);
  if (interval === undefined) return false;
  const settings = solver.settings;
  const value = solver.getValue(column);
  const multiple = interval.multiple;
  const getRandomShift = (range: number) =>
    new Impq(multiple.mul(Rational.fromNumber(settings.getRandomNext() % (range + 1))));
  if (interval.lower === undefined && interval.upper === undefined) {
    solver.setValueForNbasicColumn(column, getRandomShift(RANGE).add(value));
    return true;
  }
  const isInt = solver.isInt(column);
  const lower =
    interval.lower === undefined
      ? undefined
      : isInt
        ? new Impq(interval.lower.ceil())
        : interval.lower;
  const upper =
    interval.upper === undefined
      ? undefined
      : isInt
        ? new Impq(interval.upper.floor())
        : interval.upper;
  if (lower !== undefined && upper !== undefined && lower.compare(upper) >= 0) return false;
  if (upper === undefined) {
    solver.setValueForNbasicColumn(column, value.add(getRandomShift(RANGE)));
    return true;
  }
  if (lower === undefined) {
    solver.setValueForNbasicColumn(column, value.sub(getRandomShift(RANGE)));
    return true;
  }
  const high = upper.sub(value).div(multiple).floor();
  const low = lower.sub(value).div(multiple).ceil();
  const span = high.sub(low);
  if (!span.isPositive()) return false;
  const range = span.compare(Rational.fromNumber(RANGE)) < 0 ? Number(span.num) : RANGE;
  const step = low.add(Rational.fromNumber(settings.getRandomNext() % (range + 1)));
  solver.setValueForNbasicColumn(column, value.add(new Impq(multiple.mul(step))));
  return true;
};

// random_updater::update over the given columns.
export const randomUpdate = (solver: LarSolver, columns: number[]) => {
  const varSet = new IndexedUintSet();
  for (const column of columns) varSet.add(column);
  const shift = (column: number) => {
    if (!shiftVar(solver, column)) return false;
    for (const cell of solver.core.matrix.columns[column]) {
      const basic = solver.core.basis[cell.row];
      if (varSet.has(basic)) varSet.delete(basic);
    }
    return true;
  };
  for (const column of varSet.elems.slice()) {
    if (!varSet.has(column)) continue;
    if (!solver.isBase(column)) {
      shift(column);
      continue;
    }
    for (const cell of solver.getRow(solver.core.heading[column]))
      if (!solver.isBase(cell.column) && !solver.isFixed(cell.column) && shift(cell.column)) break;
  }
};
