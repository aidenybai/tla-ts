// Ported from Z3 (src/math/lp/int_cube.cpp, and tighten_term_bounds_by_delta and
// round_to_integer_solution in src/math/lp/lar_solver.cpp), MIT license, see z3-license.txt. The
// cube test: when the bounds of every term shrunk by half the sum of its integer coefficients still
// admit a solution, rounding that solution gives an integer one.
import { Rational } from "../rational";
import { KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./constraints";
import { LP_FEASIBLE, LP_OPTIMAL } from "./core-solver";
import type { LarSolver } from "./lar-solver";
import type { LarTerm } from "./lar-term";
import { Impq } from "./numeric-pair";

const HALF = Rational.of(1n, 2n);

// get_cube_delta_for_term: an infinitesimal for x - y over integers, nothing for x + y, and
// otherwise half the sum of the integer coefficients.
const getCubeDelta = (solver: LarSolver, term: LarTerm) => {
  const entries = [...term.coeffs];
  if (entries.length === 2) {
    let isPlusSeen = false;
    let isMinusSeen = false;
    const isUnit = entries.every((entry) => {
      if (!solver.isInt(entry[0])) return false;
      if (entry[1].equals(Rational.one)) isPlusSeen = true;
      else if (entry[1].equals(Rational.minusOne)) isMinusSeen = true;
      else return false;
      return true;
    });
    if (isUnit)
      return isPlusSeen && isMinusSeen ? Impq.zero : new Impq(Rational.zero, Rational.one);
  }
  let delta = Rational.zero;
  for (const entry of entries) if (solver.isInt(entry[0])) delta = delta.add(entry[1].abs());
  return new Impq(delta.mul(HALF));
};

const addVarBound = (solver: LarSolver, column: number, kind: number, rhs: Rational) =>
  solver.activate(solver.mkVarBound(column, kind, rhs));

// tighten_term_bounds_by_delta: whether the bounds of the column stay apart when each moves inward
// by delta.
const tightenTermBounds = (solver: LarSolver, column: number, delta: Impq) => {
  const core = solver.core;
  const hasUpper = core.hasUpperBound(column);
  const hasLower = core.hasLowerBound(column);
  if (
    hasUpper &&
    hasLower &&
    solver.getUpperBound(column).sub(delta).compare(solver.getLowerBound(column).add(delta)) < 0
  )
    return false;
  if (hasUpper) {
    const upper = solver.getUpperBound(column);
    const isStrict = !delta.y.isZero() || !upper.y.isZero();
    addVarBound(solver, column, isStrict ? KIND_LT : KIND_LE, upper.x.sub(delta.x));
  }
  if (hasLower) {
    const lower = solver.getLowerBound(column);
    const isStrict = !delta.y.isZero() || !lower.y.isZero();
    addVarBound(solver, column, isStrict ? KIND_GT : KIND_GE, lower.x.add(delta.x));
  }
  return true;
};

const getTermValue = (solver: LarSolver, term: LarTerm) => {
  let value = Impq.zero;
  for (const entry of term.coeffs) value = value.add(solver.getValue(entry[0]).mul(entry[1]));
  return value;
};

// round_to_integer_solution: integer columns without terms round to the nearest integer, and the
// terms that use them take their new values.
const roundToIntegerSolution = (solver: LarSolver) => {
  const x = solver.core.x;
  const rounded = new Set<number>();
  for (let column = 0; column < solver.getColumnCount(); column++) {
    if (!solver.isInt(column) || solver.hasTerm(column)) continue;
    const value = x[column];
    if (value.isInt()) continue;
    const floor = new Impq(value.floor());
    x[column] = floor.sub(value).compare(new Impq(HALF.neg())) < 0 ? new Impq(value.ceil()) : floor;
    rounded.add(column);
  }
  if (rounded.size === 0) return;
  for (const term of solver.terms)
    if ([...term.coeffs].some((entry) => rounded.has(entry[0])))
      x[term.column] = getTermValue(solver, term);
};

// int_cube::operator(): whether the cube test found an integer solution.
export const findCube = (solver: LarSolver) => {
  solver.push();
  for (const term of solver.terms) {
    const delta = getCubeDelta(solver, term);
    if (delta.isZero() || tightenTermBounds(solver, term.column, delta)) continue;
    solver.pop(1);
    solver.status = LP_OPTIMAL;
    return false;
  }
  const status = solver.findFeasibleSolution();
  if (status !== LP_FEASIBLE && status !== LP_OPTIMAL) {
    solver.pop(1);
    solver.moveNonBasicColumnsToBounds();
    return !solver.core.basis.some(
      (column) => solver.isInt(column) && !solver.getValue(column).isInt(),
    );
  }
  solver.pop(1);
  roundToIntegerSolution(solver);
  solver.status = LP_FEASIBLE;
  return true;
};
