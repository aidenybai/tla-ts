// Ported from Z3 (src/math/lp/int_cube.cpp, and tighten_term_bounds_by_delta and
// round_to_integer_solution in src/math/lp/lar_solver.cpp), MIT license, see z3-license.txt. The
// cube test: when the bounds of every term shrunk by half the sum of its integer coefficients still
// admit a solution, rounding that solution gives an integer one. The largest cube test maximizes
// the edge of that cube instead, and when the edge is below 1 it rounds the center and flips
// rounded columns to repair the bounds the rounding broke.
import { Rational } from "../rational";
import { type ConstraintKind, KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./constraints";
import { LP_FEASIBLE, LP_OPTIMAL } from "./core-solver";
import { type LarSolver, NULL_LPVAR } from "./lar-solver";
import type { LarTerm } from "./lar-term";
import { maximizeTerm } from "./maximize-term";
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

const addVarBound = (solver: LarSolver, column: number, kind: ConstraintKind, rhs: Rational) =>
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
    if ([...term.coeffs].some((entry) => rounded.has(entry[0]))) x[term.column] = term.apply(x);
};

// r_basis_has_inf_int.
const hasBasicInfInt = (solver: LarSolver) =>
  solver.core.basis.some((column) => solver.isInt(column) && !solver.getValue(column).isInt());

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
    return !hasBasicInfInt(solver);
  }
  solver.pop(1);
  roundToIntegerSolution(solver);
  solver.status = LP_FEASIBLE;
  return true;
};

// add_edge_rows_for_term: the term column moved inward by the edge times delta stays within its
// bounds, through a new term for each bound.
const addEdgeRows = (solver: LarSolver, column: number, edge: number) => {
  const delta = getCubeDelta(solver, solver.getTerm(column));
  if (delta.isZero()) return true;
  if (!delta.y.isZero()) return tightenTermBounds(solver, column, delta);
  const core = solver.core;
  if (core.hasUpperBound(column)) {
    const upper = solver.getUpperBound(column);
    const sum = solver.addTerm(
      [
        [column, Rational.one],
        [edge, delta.x],
      ],
      NULL_LPVAR,
    );
    addVarBound(solver, sum, upper.y.isZero() ? KIND_LE : KIND_LT, upper.x);
  }
  if (core.hasLowerBound(column)) {
    const lower = solver.getLowerBound(column);
    const difference = solver.addTerm(
      [
        [column, Rational.one],
        [edge, delta.x.neg()],
      ],
      NULL_LPVAR,
    );
    addVarBound(solver, difference, lower.y.isZero() ? KIND_GE : KIND_GT, lower.x);
  }
  return true;
};

// sat_after_rounding.
const roundCenter = (solver: LarSolver) => {
  roundToIntegerSolution(solver);
  solver.status = LP_FEASIBLE;
  solver.settings.stats.lcubeSuccess++;
  return true;
};

// A rounded column, its floor, and whether it sits at its floor plus one.
interface FlipCandidate {
  column: number;
  floor: Rational;
  isAtHigh: boolean;
}

// A term column with a bound, and its value while the repair flips columns.
interface BoundedRow {
  column: number;
  value: Impq;
}

// repair_rounded_candidate: while the bounded terms are violated, flips the rounded column that
// decreases the total violation most, within a budget, and keeps the values when none is left.
const repairRoundedCandidate = (solver: LarSolver, flips: FlipCandidate[]) => {
  const core = solver.core;
  const rows: BoundedRow[] = [];
  for (const term of solver.terms)
    if (core.hasUpperBound(term.column) || core.hasLowerBound(term.column))
      rows.push({ column: term.column, value: term.apply(core.x) });
  const getRowViolation = (rowIndex: number, value: Impq) => {
    const column = rows[rowIndex].column;
    let violation = Impq.zero;
    if (core.hasUpperBound(column) && value.compare(core.upperBounds[column]) > 0)
      violation = violation.add(value.sub(core.upperBounds[column]));
    if (core.hasLowerBound(column) && value.compare(core.lowerBounds[column]) < 0)
      violation = violation.add(core.lowerBounds[column].sub(value));
    return violation;
  };
  let violation = Impq.zero;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++)
    violation = violation.add(getRowViolation(rowIndex, rows[rowIndex].value));
  if (violation.isZero()) return true;
  if (flips.length === 0) return false;
  const flipOfColumn = new Map(flips.map((flip, flipIndex) => [flip.column, flipIndex]));
  const occurrences: [number, Rational][][] = flips.map(() => []);
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++)
    for (const entry of solver.getTerm(rows[rowIndex].column).coeffs) {
      const flipIndex = flipOfColumn.get(entry[0]);
      if (flipIndex !== undefined) occurrences[flipIndex].push([rowIndex, entry[1]]);
    }
  let budget = Math.min(2 * flips.length, solver.settings.lcubeFlips);
  let isFlipped = false;
  const getStep = (flip: FlipCandidate) => (flip.isAtHigh ? Rational.minusOne : Rational.one);
  while (!violation.isZero() && budget-- > 0) {
    let bestFlip = -1;
    let bestGain = Impq.zero;
    for (let flipIndex = 0; flipIndex < flips.length; flipIndex++) {
      if (occurrences[flipIndex].length === 0) continue;
      const step = getStep(flips[flipIndex]);
      let gain = Impq.zero;
      for (const occurrence of occurrences[flipIndex]) {
        const value = rows[occurrence[0]].value;
        const flipped = value.add(new Impq(step.mul(occurrence[1])));
        gain = gain.add(
          getRowViolation(occurrence[0], flipped).sub(getRowViolation(occurrence[0], value)),
        );
      }
      if (gain.compare(bestGain) < 0) {
        bestGain = gain;
        bestFlip = flipIndex;
      }
    }
    if (bestFlip === -1) return false;
    const step = getStep(flips[bestFlip]);
    for (const occurrence of occurrences[bestFlip]) {
      const row = rows[occurrence[0]];
      row.value = row.value.add(new Impq(step.mul(occurrence[1])));
    }
    flips[bestFlip].isAtHigh = !flips[bestFlip].isAtHigh;
    violation = violation.add(bestGain);
    isFlipped = true;
  }
  if (!violation.isZero()) return false;
  for (const flip of flips)
    core.x[flip.column] = new Impq(flip.isAtHigh ? flip.floor.add(Rational.one) : flip.floor);
  for (const term of solver.terms) core.x[term.column] = term.apply(core.x);
  if (isFlipped) solver.settings.stats.lcubeFlipSuccess++;
  return true;
};

// round_and_repair: rounds the center of the cube and repairs it, or restores the center.
const roundAndRepair = (solver: LarSolver) => {
  const core = solver.core;
  const backup = core.x.slice();
  const flips: FlipCandidate[] = [];
  for (let column = 0; column < solver.getColumnCount(); column++) {
    if (!solver.isInt(column) || solver.hasTerm(column)) continue;
    const value = core.x[column];
    if (!value.isInt()) flips.push({ column, floor: value.floor(), isAtHigh: false });
  }
  roundToIntegerSolution(solver);
  for (const flip of flips) flip.isAtHigh = core.x[flip.column].x.compare(flip.floor) > 0;
  solver.status = LP_FEASIBLE;
  if (repairRoundedCandidate(solver, flips)) {
    solver.settings.stats.lcubeSuccess++;
    return true;
  }
  core.x.splice(0, backup.length, ...backup);
  return false;
};

// find_largest_cube: whether an integer solution comes from the largest cube that fits in the
// bounds of the terms, with its edge as a new column that the optimizing simplex maximizes.
export const findLargestCube = (solver: LarSolver) => {
  solver.settings.stats.lcubeCalls++;
  solver.push();
  const onAddTerm = solver.onAddTerm;
  solver.onAddTerm = undefined;
  const edge = solver.addVar(NULL_LPVAR, false);
  addVarBound(solver, edge, KIND_GE, Rational.zero);
  const isAdded = solver.terms
    .map((term) => term.column)
    .every((column) => addEdgeRows(solver, column, edge));
  solver.onAddTerm = onAddTerm;
  if (!isAdded) {
    solver.pop(1);
    solver.status = LP_OPTIMAL;
    return false;
  }
  const status = solver.findFeasibleSolution();
  if (status !== LP_FEASIBLE && status !== LP_OPTIMAL) {
    solver.pop(1);
    solver.moveNonBasicColumnsToBounds();
    return !hasBasicInfInt(solver);
  }
  const maximum = maximizeTerm(solver, edge);
  if (solver.settings.isCanceled()) {
    solver.pop(1);
    return false;
  }
  if (maximum === undefined) {
    addVarBound(solver, edge, KIND_GE, Rational.one);
    const boundedStatus = solver.findFeasibleSolution();
    solver.pop(1);
    return boundedStatus === LP_FEASIBLE || boundedStatus === LP_OPTIMAL
      ? roundCenter(solver)
      : false;
  }
  solver.pop(1);
  return maximum.compare(new Impq(Rational.one)) >= 0
    ? roundCenter(solver)
    : roundAndRepair(solver);
};
