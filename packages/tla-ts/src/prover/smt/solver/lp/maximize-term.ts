// Ported from Z3 (maximize_term and its helpers in src/math/lp/lar_solver.cpp, and the tableau part
// of src/math/lp/lp_primal_core_solver.h, src/math/lp/lp_primal_core_solver_def.h,
// src/math/lp/lp_primal_core_solver_tableau_def.h), MIT license, see z3-license.txt.
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
import { type Dependency, mkJoin } from "./dependency";
import type { LarSolver } from "./lar-solver";
import { LarTerm } from "./lar-term";
import { Impq } from "./numeric-pair";

const NBASIS_SORT_PERIOD = 20;
const PERCENT_OF_ENTERING_TO_CHECK = 5;

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

  solve() {
    const core = this.core;
    const settings = core.settings;
    core.status = LP_FEASIBLE;
    do {
      if (settings.isCanceled()) {
        core.status = LP_CANCELLED;
        return;
      }
      this.oneIterationTableau();
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

  private oneIterationTableau() {
    const core = this.core;
    const entering = this.chooseEnteringColumnTableau();
    if (entering === -1) {
      core.status = core.isFeasible() ? LP_OPTIMAL : LP_INFEASIBLE;
      return;
    }
    const limit: ThetaLimit = { theta: Impq.zero, isUnlimited: true };
    const leaving = this.findLeavingAndTTableau(entering, limit);
    if (leaving === -1) {
      core.status = LP_UNBOUNDED;
      return;
    }
    this.advanceOnEnteringAndLeavingTableau(entering, leaving, limit.theta);
  }

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

  private getNumberOfNonBasicColumnToTryForEnter() {
    const count = this.core.nbasis.length;
    const scaled = count > 300 ? Math.floor((count * PERCENT_OF_ENTERING_TO_CHECK) / 100) : count;
    if (scaled === 0) return 0;
    return Math.max(this.core.settings.getRandomNext() % scaled, 1);
  }

  private chooseEnteringColumnTableau() {
    const core = this.core;
    if (this.sortCounter === 0) {
      this.sortNonBasis();
      this.sortCounter = NBASIS_SORT_PERIOD;
    } else this.sortCounter--;
    let numToGoOver = this.getNumberOfNonBasicColumnToTryForEnter();
    if (numToGoOver === 0) return -1;
    let minCells = core.matrix.getRowCount() + 1;
    let enteringIndex = -1;
    let numTies = 0;
    const list = this.nonBasisList;
    for (let index = 0; numToGoOver > 0 && index < list.length; index++) {
      const column = list[index];
      if (!this.isColumnBeneficialForEnteringBasis(column)) continue;
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

  private isColumnBeneficialForEnteringBasis(column: number) {
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

  private findLeavingAndTTableau(entering: number, limit: ThetaLimit) {
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

  private advanceOnEnteringAndLeavingTableau(entering: number, leaving: number, theta: Impq) {
    const core = this.core;
    const sign = Rational.fromNumber(this.signOfEnteringDelta);
    if (entering === leaving) {
      this.updateXTableau(entering, theta.mul(sign));
      return;
    }
    if (!theta.isZero()) this.updateXTableau(entering, core.isFeasible() ? theta.mul(sign) : theta);
    core.pivot(entering, leaving);
    this.nonBasisList[this.nonBasisList.length - 1] = leaving;
  }

  private updateXTableau(entering: number, delta: Impq) {
    const core = this.core;
    core.x[entering] = core.x[entering].add(delta);
    for (const cell of core.matrix.columns[entering])
      core.addDeltaToXAndTrackFeasibility(
        core.basis[cell.row],
        delta.mul(core.matrix.getVal(cell)).neg(),
      );
  }
}

const maximizeTermOnFeasibleRSolver = (solver: LarSolver, term: LarTerm) => {
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
    : { value: term.apply(core.x), reducedCosts };
};

// Every column with a positive reduced cost sits at its upper bound, and every column with a
// negative one at its lower bound, so those bounds prove the maximum.
const getDependenciesOfMaximum = (solver: LarSolver, reducedCosts: readonly Rational[]) => {
  let dependency: Dependency = null;
  for (const [column, reducedCost] of reducedCosts.entries()) {
    if (reducedCost.isZero()) continue;
    dependency = mkJoin(
      dependency,
      reducedCost.isPositive() ? solver.getUpperWitness(column) : solver.getLowerWitness(column),
    );
  }
  return dependency;
};

// Integer columns that maximization left fractional move out of the basis, if they can.
const adjustIntegerColumns = (solver: LarSolver, term: LarTerm, previous: Impq, maximum: Impq) => {
  const core = solver.core;
  const restore = () => {
    core.restoreX();
    return { status: LP_FEASIBLE, value: previous };
  };
  let isChanged = false;
  for (let column = 0; column < core.x.length; column++) {
    if (!solver.isInt(column) || core.x[column].isInt()) continue;
    if (solver.isBase(column) && !solver.removeFromBasis(column)) return restore();
    if (!core.x[column].isInt()) return restore();
    isChanged = true;
  }
  const changed = isChanged ? term.apply(core.x) : maximum;
  const isWorse = changed.compare(previous) < 0;
  if (isWorse) core.restoreX();
  const value = isWorse ? previous : changed;
  if (!value.equals(maximum)) return { status: LP_FEASIBLE, value };
  solver.status = LP_OPTIMAL;
  return { status: LP_OPTIMAL, value };
};

export const maximizeTerm = (
  solver: LarSolver,
  column: number,
  isFixingIntCols = false,
  isComputingDependencies = false,
) => {
  const term = solver.hasTerm(column)
    ? solver.getTerm(column)
    : new LarTerm([[column, Rational.one]]);
  solver.core.backupX();
  const previous = term.apply(solver.core.x);
  const maximum = maximizeTermOnFeasibleRSolver(solver, term);
  if (maximum === undefined) {
    solver.core.restoreX();
    return { status: LP_UNBOUNDED, value: Impq.zero, dependency: null };
  }
  const dependency = isComputingDependencies
    ? getDependenciesOfMaximum(solver, maximum.reducedCosts)
    : null;
  if (!isFixingIntCols) {
    solver.status = LP_OPTIMAL;
    return { status: LP_OPTIMAL, value: maximum.value, dependency };
  }
  return { ...adjustIntegerColumns(solver, term, previous, maximum.value), dependency };
};
