// Ported from Z3 (maximize_term and its helpers in src/math/lp/lar_solver.cpp, and the tableau
// part of src/math/lp/lp_primal_core_solver.h, src/math/lp/lp_primal_core_solver_def.h,
// src/math/lp/lp_primal_core_solver_tableau_def.h), MIT license, see z3-license.txt. The primal
// simplex with the tableau_costs strategy: from a feasible solution, a non-basic column whose
// reduced cost improves the objective enters, the ratio test picks the basic column that leaves,
// and the reduced costs follow every pivot.
import { Rational } from "../rational";
import {
  COLUMN_BOXED,
  COLUMN_FIXED,
  COLUMN_FREE,
  COLUMN_LOWER,
  COLUMN_UPPER,
  type CoreSolver,
  LP_CANCELLED,
  LP_FEASIBLE,
  LP_INFEASIBLE,
  LP_OPTIMAL,
  LP_UNBOUNDED,
} from "./core-solver";
import type { LarSolver } from "./lar-solver";
import { LarTerm } from "./lar-term";
import { Impq } from "./numeric-pair";

// m_nbasis_sort_counter: the non-basic columns are sorted again after this many choices.
const NBASIS_SORT_PERIOD = 20;
// percent_of_entering_to_check, for more than 300 non-basic columns.
const PERCENT_OF_ENTERING_TO_CHECK = 5;

// The theta of a ratio test, and whether a bound limits it yet.
interface ThetaLimit {
  theta: Impq;
  isUnlimited: boolean;
}

const limitTheta = (limit: ThetaLimit, value: Impq) => {
  if (limit.isUnlimited) {
    limit.theta = value;
    limit.isUnlimited = false;
  } else if (value.compare(limit.theta) < 0) limit.theta = value;
};

const clampTheta = (limit: ThetaLimit) => {
  if (limit.theta.compare(Impq.zero) < 0) limit.theta = Impq.zero;
};

const stopAtZero = (limit: ThetaLimit) => {
  limit.theta = Impq.zero;
  limit.isUnlimited = false;
};

class CostsSimplex {
  private sortCounter = 0;
  private nonBasisList: number[] = [];
  private signOfEnteringDelta = 1;

  constructor(
    private readonly core: CoreSolver,
    private readonly reducedCosts: Rational[],
  ) {}

  // lar_core_solver::solve and lp_primal_core_solver::solve, not only looking for a feasible
  // solution.
  solve() {
    const core = this.core;
    const settings = core.settings;
    core.status = LP_FEASIBLE;
    do {
      if (settings.isCanceled()) {
        core.status = LP_CANCELLED;
        return;
      }
      this.oneIteration();
      if (settings.isCanceled()) {
        core.status = LP_CANCELLED;
        return;
      }
    } while (
      core.status !== LP_UNBOUNDED &&
      core.status !== LP_OPTIMAL &&
      core.status !== LP_INFEASIBLE
    );
  }

  // one_iteration_tableau.
  private oneIteration() {
    const core = this.core;
    const entering = this.chooseEntering();
    if (entering === -1) {
      core.status = core.isFeasible() ? LP_OPTIMAL : LP_INFEASIBLE;
      return;
    }
    const limit: ThetaLimit = { theta: Impq.zero, isUnlimited: true };
    const leaving = this.findLeaving(entering, limit);
    if (leaving === -1) {
      core.status = LP_UNBOUNDED;
      return;
    }
    this.advance(entering, leaving, limit.theta);
  }

  // sort_non_basis: the non-basic columns by the size of their columns, the empty ones last.
  private sortNonBasis() {
    const core = this.core;
    const columns = core.matrix.columns;
    core.nbasis.sort((first, second) => {
      const firstSize = columns[first].length;
      const secondSize = columns[second].length;
      if (firstSize === 0 && secondSize !== 0) return 1;
      if (firstSize !== 0 && secondSize === 0) return -1;
      return firstSize !== secondSize ? firstSize - secondSize : first - second;
    });
    this.nonBasisList = core.nbasis.slice();
    for (let index = 0; index < core.nbasis.length; index++)
      core.heading[core.nbasis[index]] = -index - 1;
  }

  // get_number_of_non_basic_column_to_try_for_enter.
  private getNumberToTry() {
    const count = this.core.nbasis.length;
    const scaled = count > 300 ? Math.floor((count * PERCENT_OF_ENTERING_TO_CHECK) / 100) : count;
    if (scaled === 0) return 0;
    return Math.max(this.core.settings.getRandomNext() % scaled, 1);
  }

  // choose_entering_column_tableau: among the first beneficial columns, the one with the fewest
  // cells, and a random one among ties. It moves to the end of the list.
  private chooseEntering() {
    const core = this.core;
    if (this.sortCounter === 0) {
      this.sortNonBasis();
      this.sortCounter = NBASIS_SORT_PERIOD;
    } else this.sortCounter--;
    let numToGoOver = this.getNumberToTry();
    if (numToGoOver === 0) return -1;
    let minCells = core.matrix.getRowCount() + 1;
    let enteringIndex = -1;
    let numTies = 0;
    const list = this.nonBasisList;
    for (let index = 0; numToGoOver > 0 && index < list.length; index++) {
      const column = list[index];
      if (!this.isBeneficial(column)) continue;
      const cells = core.matrix.columns[column].length;
      if (cells < minCells) {
        minCells = cells;
        enteringIndex = index;
        numToGoOver--;
        numTies = 1;
      } else if (cells === minCells && core.settings.getRandomNext(++numTies) === 0)
        enteringIndex = index;
    }
    if (enteringIndex === -1) return -1;
    const entering = list[enteringIndex];
    this.signOfEnteringDelta = this.reducedCosts[entering].isPositive() ? 1 : -1;
    list.splice(enteringIndex, 1);
    list.push(entering);
    return entering;
  }

  // column_is_benefitial_for_entering_basis.
  private isBeneficial(column: number) {
    const core = this.core;
    const reducedCost = this.reducedCosts[column];
    if (reducedCost.isZero()) return false;
    switch (core.getColumnType(column)) {
      case COLUMN_FREE:
        return true;
      case COLUMN_LOWER:
        return reducedCost.isPositive();
      case COLUMN_UPPER:
        return reducedCost.isNegative();
      case COLUMN_BOXED:
        return reducedCost.isPositive()
          ? core.x[column].equals(core.lowerBounds[column])
          : core.x[column].equals(core.upperBounds[column]);
      default:
        return false;
    }
  }

  // find_leaving_and_t_tableau: the basic column that the ratio test stops first, with ties
  // broken by the shortest row and then at random, or the entering column itself when it reaches
  // its other bound first.
  private findLeaving(entering: number, limit: ThetaLimit) {
    const core = this.core;
    const matrix = core.matrix;
    const column = matrix.columns[entering];
    const sign = Rational.fromNumber(this.signOfEnteringDelta);
    let candidates: number[] = [];
    let minRowCells = matrix.getColumnCount() + 1;
    let index = 0;
    for (; index < column.length && limit.isUnlimited; index++) {
      const cell = column[index];
      const basic = core.basis[cell.row];
      this.limitThetaOnBasisColumn(basic, matrix.getVal(cell).neg().mul(sign), limit);
      if (limit.isUnlimited) continue;
      candidates.push(basic);
      minRowCells = matrix.rows[cell.row].length;
    }
    if (limit.isUnlimited) {
      if (core.getColumnType(entering) !== COLUMN_BOXED) return -1;
      limit.theta =
        this.signOfEnteringDelta > 0
          ? core.upperBounds[entering].sub(core.x[entering])
          : core.x[entering].sub(core.lowerBounds[entering]);
      return entering;
    }
    for (; index < column.length; index++) {
      const cell = column[index];
      const basic = core.basis[cell.row];
      const ratio: ThetaLimit = { theta: Impq.zero, isUnlimited: true };
      this.limitThetaOnBasisColumn(basic, matrix.getVal(cell).neg().mul(sign), ratio);
      if (ratio.isUnlimited) continue;
      const rowCells = matrix.rows[cell.row].length;
      const comparison = ratio.theta.compare(limit.theta);
      if (comparison < 0) {
        limit.theta = ratio.theta;
        candidates = [basic];
        minRowCells = rowCells;
      } else if (comparison === 0 && rowCells < minRowCells) {
        candidates = [basic];
        minRowCells = rowCells;
      } else if (comparison === 0 && rowCells === minRowCells) candidates.push(basic);
    }
    if (core.getColumnType(entering) === COLUMN_BOXED) {
      const span = core.upperBounds[entering].sub(core.lowerBounds[entering]);
      if (span.compare(limit.theta) <= 0) {
        limit.theta = span;
        return entering;
      }
    }
    if (candidates.length === 1) return candidates[0];
    return candidates[core.settings.getRandomNext() % candidates.length];
  }

  // limit_theta_on_basis_column: x[basic] + theta * m stays within the bounds of the column, or
  // moves toward them when it is outside.
  private limitThetaOnBasisColumn(basic: number, m: Rational, limit: ThetaLimit) {
    const core = this.core;
    const x = core.x[basic];
    const lower = core.lowerBounds[basic];
    const upper = core.upperBounds[basic];
    const isFeasible = core.isFeasible();
    const limitBy = (bound: Impq) => limitTheta(limit, bound.sub(x).div(m));
    const limitFeasibly = (bound: Impq) => {
      limitBy(bound);
      clampTheta(limit);
    };
    switch (core.getColumnType(basic)) {
      case COLUMN_FREE:
        break;
      case COLUMN_UPPER:
        if (isFeasible) {
          if (m.isPositive()) limitFeasibly(upper);
        } else if (m.isPositive()) {
          if (x.compare(upper) < 0) limitBy(upper);
          else if (x.compare(upper) === 0) stopAtZero(limit);
        } else if (x.compare(upper) > 0) limitBy(upper);
        break;
      case COLUMN_LOWER:
        if (isFeasible) {
          if (m.isNegative()) limitFeasibly(lower);
        } else if (m.isNegative()) {
          if (x.compare(lower) > 0) limitBy(lower);
          else if (x.compare(lower) === 0) stopAtZero(limit);
        } else if (x.compare(lower) < 0) limitBy(lower);
        break;
      case COLUMN_FIXED:
      case COLUMN_BOXED:
        if (isFeasible) limitFeasibly(m.isPositive() ? upper : lower);
        else if (m.isPositive()) {
          if (x.compare(lower) < 0) limitBy(lower);
          else if (x.compare(upper) < 0) limitBy(upper);
          else if (x.compare(upper) <= 0) stopAtZero(limit);
        } else if (x.compare(upper) > 0) limitBy(upper);
        else if (x.compare(lower) > 0) limitBy(lower);
        else if (x.compare(lower) >= 0) stopAtZero(limit);
        break;
    }
    if (!limit.isUnlimited) clampTheta(limit);
  }

  // advance_on_entering_and_leaving_tableau.
  private advance(entering: number, leaving: number, theta: Impq) {
    const core = this.core;
    const sign = Rational.fromNumber(this.signOfEnteringDelta);
    if (entering === leaving) {
      this.updateX(entering, theta.mul(sign));
      return;
    }
    if (!theta.isZero()) this.updateX(entering, core.isFeasible() ? theta.mul(sign) : theta);
    core.pivot(entering, leaving);
    this.nonBasisList[this.nonBasisList.length - 1] = leaving;
  }

  // update_x_tableau.
  private updateX(entering: number, delta: Impq) {
    const core = this.core;
    core.x[entering] = core.x[entering].add(delta);
    for (const cell of core.matrix.columns[entering])
      core.addDeltaToXAndTrackFeasibility(
        core.basis[cell.row],
        delta.mul(core.matrix.getVal(cell)).neg(),
      );
  }
}

const getTermValue = (solver: LarSolver, term: LarTerm) => {
  let value = Impq.zero;
  for (const entry of term.coeffs) value = value.add(solver.getValue(entry[0]).mul(entry[1]));
  return value;
};

// maximize_term_on_feasible_r_solver: the costs of the term and their reduced costs, the simplex,
// and the term's value at the optimum, or undefined when it is unbounded or cancelled.
const maximizeOnFeasibleSolver = (solver: LarSolver, term: LarTerm) => {
  const core = solver.core;
  solver.moveNonBasicColumnsToBounds();
  const reducedCosts = core.x.map(() => Rational.zero);
  for (const entry of term.coeffs) {
    const column = entry[0];
    const rowIndex = core.heading[column];
    if (rowIndex < 0) {
      reducedCosts[column] = reducedCosts[column].add(entry[1]);
      continue;
    }
    for (const cell of core.matrix.rows[rowIndex])
      if (cell.column !== column)
        reducedCosts[cell.column] = reducedCosts[cell.column].sub(entry[1].mul(cell.coeff));
  }
  core.reducedCosts = reducedCosts;
  new CostsSimplex(core, reducedCosts).solve();
  core.reducedCosts = undefined;
  const status = core.status;
  core.status = LP_OPTIMAL;
  return status === LP_UNBOUNDED || status === LP_CANCELLED
    ? undefined
    : getTermValue(solver, term);
};

// maximize_term without fixing the integer columns: the maximum of the column or of its term, or
// undefined, with the values restored, when it is unbounded.
export const maximizeTerm = (solver: LarSolver, column: number) => {
  const term = solver.hasTerm(column)
    ? solver.getTerm(column)
    : new LarTerm([[column, Rational.one]]);
  const backup = solver.core.x.slice();
  const maximum = maximizeOnFeasibleSolver(solver, term);
  if (maximum === undefined) {
    solver.core.x.splice(0, backup.length, ...backup);
    return undefined;
  }
  solver.status = LP_OPTIMAL;
  return maximum;
};
