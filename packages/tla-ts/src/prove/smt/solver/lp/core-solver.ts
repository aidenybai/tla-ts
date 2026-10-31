// Ported from Z3 (src/math/lp/lar_core_solver.h, src/math/lp/lp_core_solver_base.h,
// src/math/lp/lp_primal_core_solver.h, src/math/lp/lp_primal_core_solver_tableau_def.h), MIT
// license, see z3-license.txt. The tableau, the column values and bounds, and the primal simplex
// that lar_solver runs with the tableau_rows strategy: the smallest infeasible basic column
// leaves, and the entering column is the one in its row that frees the fewest bounded basics.
import { Rational } from "../rational";
import { IndexedUintSet, StackedVector, VarHeap } from "./containers";
import type { LpSettings } from "./lp-settings";
import { Impq } from "./numeric-pair";
import { RowCell, StaticMatrix } from "./static-matrix";

export const COLUMN_FREE = 0;
export const COLUMN_LOWER = 1;
export const COLUMN_UPPER = 2;
export const COLUMN_BOXED = 3;
export const COLUMN_FIXED = 4;

export const LP_UNKNOWN = 0;
export const LP_INFEASIBLE = 1;
export const LP_OPTIMAL = 2;
export const LP_FEASIBLE = 3;
export const LP_CANCELLED = 4;
export const LP_UNBOUNDED = 5;

const BLAND_MODE_THRESHOLD = 1000;

export class CoreSolver {
  readonly matrix = new StaticMatrix();
  readonly columnTypes = new StackedVector<number>();
  lowerBounds: Impq[] = [];
  upperBounds: Impq[] = [];
  x: Impq[] = [];
  basis: number[] = [];
  nbasis: number[] = [];
  heading: number[] = [];
  readonly infHeap = new VarHeap();
  touchedRows: IndexedUintSet | null = null;
  status = LP_FEASIBLE;
  infRowIndex = -1;
  infeasibleSumSign = 0;
  infeasibleCombination: [Rational, number][] = [];
  // m_d: the reduced costs while maximize_term runs the tableau_costs strategy, kept on pivots.
  reducedCosts: Rational[] | undefined;
  private isBlandMode = false;
  private leftBasis = new IndexedUintSet();
  private leftBasisRepeated = 0;

  constructor(readonly settings: LpSettings) {}

  getColumnCount() {
    return this.matrix.getColumnCount();
  }

  // add_new_var_to_core_fields_for_mpq: a column at zero, basic in a new row or nonbasic.
  addColumn(isBasic: boolean) {
    const column = this.matrix.getColumnCount();
    this.matrix.addColumn();
    this.x.push(Impq.zero);
    this.lowerBounds[column] = Impq.zero;
    this.upperBounds[column] = Impq.zero;
    if (isBasic) {
      this.matrix.addRow();
      this.heading.push(this.basis.length);
      this.basis.push(column);
      return;
    }
    this.heading.push(-this.nbasis.length - 1);
    this.nbasis.push(column);
  }

  // remove_last_column_from_basis_tableau: the last column out of the basis or the nonbasic
  // columns, once the tableau no longer holds it.
  removeLastColumn(column: number) {
    this.x.length = this.matrix.getColumnCount();
    const position = this.heading[column];
    if (position >= 0) {
      const lastPosition = this.basis.length - 1;
      if (position !== lastPosition) {
        const moved = this.basis[lastPosition];
        this.basis[position] = moved;
        this.heading[moved] = position;
      }
      this.basis.pop();
    } else {
      const index = -1 - position;
      const lastPosition = this.nbasis.length - 1;
      if (index !== lastPosition) {
        const moved = this.nbasis[lastPosition];
        this.nbasis[index] = moved;
        this.heading[moved] = -index - 1;
      }
      this.nbasis.pop();
    }
    this.heading.pop();
  }

  // The action, with pivots not recording the rows they touch.
  withoutTouchedRows<T>(action: () => T) {
    const savedTouchedRows = this.touchedRows;
    this.touchedRows = null;
    const result = action();
    this.touchedRows = savedTouchedRows;
    return result;
  }

  getColumnType(column: number) {
    return this.columnTypes.get(column);
  }

  isBase(column: number) {
    return this.heading[column] >= 0;
  }

  isFixed(column: number) {
    return this.columnTypes.get(column) === COLUMN_FIXED;
  }

  hasLowerBound(column: number) {
    const type = this.columnTypes.get(column);
    return type !== COLUMN_FREE && type !== COLUMN_UPPER;
  }

  hasUpperBound(column: number) {
    const type = this.columnTypes.get(column);
    return type !== COLUMN_FREE && type !== COLUMN_LOWER;
  }

  isFeasible() {
    return this.infHeap.size === 0;
  }

  columnIsFeasible(column: number) {
    const value = this.x[column];
    switch (this.columnTypes.get(column)) {
      case COLUMN_FIXED:
      case COLUMN_BOXED:
        return (
          value.compare(this.upperBounds[column]) <= 0 &&
          value.compare(this.lowerBounds[column]) >= 0
        );
      case COLUMN_LOWER:
        return value.compare(this.lowerBounds[column]) >= 0;
      case COLUMN_UPPER:
        return value.compare(this.upperBounds[column]) <= 0;
      default:
        return true;
    }
  }

  trackColumnFeasibility(column: number) {
    if (this.columnIsFeasible(column)) {
      if (this.infHeap.has(column)) this.infHeap.erase(column);
    } else if (!this.infHeap.has(column)) this.infHeap.insert(column);
  }

  addDeltaToXAndTrackFeasibility(column: number, delta: Impq) {
    this.x[column] = this.x[column].add(delta);
    this.trackColumnFeasibility(column);
  }

  submulFromXAndTrackFeasibility(column: number, delta: Impq, coeff: Rational) {
    this.x[column] = this.x[column].sub(delta.mul(coeff));
    this.trackColumnFeasibility(column);
  }

  // make_column_feasible: moves the value of a column into its bounds, and returns the move.
  makeColumnFeasible(column: number) {
    const value = this.x[column];
    const lower = this.lowerBounds[column];
    const upper = this.upperBounds[column];
    let target: Impq | undefined;
    switch (this.columnTypes.get(column)) {
      case COLUMN_FIXED:
        if (!value.equals(lower)) target = lower;
        break;
      case COLUMN_BOXED:
        if (value.compare(lower) < 0) target = lower;
        else if (value.compare(upper) > 0) target = upper;
        break;
      case COLUMN_LOWER:
        if (value.compare(lower) < 0) target = lower;
        break;
      case COLUMN_UPPER:
        if (value.compare(upper) > 0) target = upper;
        break;
    }
    if (target === undefined) return undefined;
    const delta = target.sub(value);
    this.x[column] = target;
    return delta;
  }

  changeBasis(entering: number, leaving: number) {
    const placeInBasis = this.heading[leaving];
    const placeInNonBasis = -this.heading[entering] - 1;
    this.heading[entering] = placeInBasis;
    this.basis[placeInBasis] = entering;
    this.heading[leaving] = -placeInNonBasis - 1;
    this.nbasis[placeInNonBasis] = leaving;
  }

  changeBasisUnconditionally(entering: number, leaving: number) {
    let placeInNonBasis = -1 - this.heading[entering];
    if (placeInNonBasis >= this.nbasis.length) {
      placeInNonBasis = this.nbasis.length;
      this.heading[entering] = placeInNonBasis;
      this.nbasis.push(entering);
    }
    const placeInBasis = this.heading[leaving];
    this.heading[entering] = placeInBasis;
    this.basis[placeInBasis] = entering;
    this.heading[leaving] = -placeInNonBasis - 1;
    this.nbasis[placeInNonBasis] = leaving;
  }

  private divideRowByPivot(pivotRow: number, pivotColumn: number) {
    const row = this.matrix.rows[pivotRow];
    const pivotCell = row.find((cell) => cell.column === pivotColumn);
    if (pivotCell === undefined || pivotCell.coeff.isZero()) return false;
    const coeff = pivotCell.coeff;
    for (const cell of row) if (cell.column !== pivotColumn) cell.coeff = cell.coeff.div(coeff);
    pivotCell.coeff = coeff.div(coeff);
    return true;
  }

  // pivot_column_tableau: makes the column a unit column with its one in the pivot row.
  pivotColumnTableau(column: number, pivotRow: number) {
    if (!this.divideRowByPivot(pivotRow, column)) return false;
    this.settings.stats.pivots++;
    const matrix = this.matrix;
    const columnCells = matrix.columns[column];
    const pivotIndex = columnCells.findIndex((cell) => cell.row === pivotRow);
    if (pivotIndex < 0) return false;
    if (pivotIndex !== 0) {
      const first = columnCells[0];
      columnCells[0] = columnCells[pivotIndex];
      columnCells[pivotIndex] = first;
      matrix.rows[pivotRow][columnCells[0].offset].offset = 0;
      matrix.rows[first.row][first.offset].offset = pivotIndex;
    }
    while (columnCells.length > 1) {
      const cell = columnCells[columnCells.length - 1];
      this.touchedRows?.add(cell.row);
      matrix.pivotRowToRowGivenCell(pivotRow, cell, column);
    }
    if (this.reducedCosts !== undefined)
      this.pivotToReducedCosts(this.reducedCosts, pivotRow, column);
    return true;
  }

  // pivot_to_reduced_costs_tableau: eliminates the reduced cost of the column that enters.
  private pivotToReducedCosts(reducedCosts: Rational[], pivotRow: number, column: number) {
    const alpha = reducedCosts[column];
    if (alpha.isZero()) return;
    for (const cell of this.matrix.rows[pivotRow])
      if (cell.column !== column)
        reducedCosts[cell.column] = reducedCosts[cell.column].sub(alpha.mul(cell.coeff));
    reducedCosts[column] = Rational.zero;
  }

  pivot(entering: number, leaving: number) {
    this.pivotColumnTableau(entering, this.heading[leaving]);
    this.changeBasis(entering, leaving);
  }

  transposeRows(first: number, second: number) {
    const basis = this.basis;
    const saved = basis[first];
    basis[first] = basis[second];
    basis[second] = saved;
    const savedHeading = this.heading[basis[first]];
    this.heading[basis[first]] = this.heading[basis[second]];
    this.heading[basis[second]] = savedHeading;
    this.matrix.transposeRows(first, second);
  }

  // The simplex.

  private needsToGrow(basic: number) {
    const type = this.columnTypes.get(basic);
    return (
      (type === COLUMN_FIXED || type === COLUMN_LOWER || type === COLUMN_BOXED) &&
      this.x[basic].compare(this.lowerBounds[basic]) < 0
    );
  }

  infSignOfColumn(basic: number) {
    switch (this.columnTypes.get(basic)) {
      case COLUMN_FREE:
        return 0;
      case COLUMN_LOWER:
        return 1;
      case COLUMN_FIXED:
      case COLUMN_BOXED:
        return this.x[basic].compare(this.upperBounds[basic]) > 0 ? -1 : 1;
      default:
        return -1;
    }
  }

  private isAboveLower(column: number) {
    return this.x[column].compare(this.lowerBounds[column]) > 0;
  }

  private isBelowUpper(column: number) {
    return this.x[column].compare(this.upperBounds[column]) < 0;
  }

  private monoidCanDecrease(cell: RowCell) {
    const column = cell.column;
    switch (this.columnTypes.get(column)) {
      case COLUMN_FREE:
        return true;
      case COLUMN_FIXED:
        return false;
      case COLUMN_LOWER:
        return !cell.coeff.isPositive() || this.isAboveLower(column);
      case COLUMN_UPPER:
        return cell.coeff.isPositive() || this.isBelowUpper(column);
      default:
        return cell.coeff.isPositive() ? this.isAboveLower(column) : this.isBelowUpper(column);
    }
  }

  private monoidCanIncrease(cell: RowCell) {
    const column = cell.column;
    switch (this.columnTypes.get(column)) {
      case COLUMN_FREE:
        return true;
      case COLUMN_FIXED:
        return false;
      case COLUMN_LOWER:
        return cell.coeff.isNegative() ? this.isAboveLower(column) : true;
      case COLUMN_UPPER:
        return cell.coeff.isNegative() ? true : this.isBelowUpper(column);
      default:
        return cell.coeff.isNegative() ? this.isAboveLower(column) : this.isBelowUpper(column);
    }
  }

  private getNumOfNotFreeBasicDependentVars(column: number, bound: number, basic: number) {
    let result = 0;
    for (const cell of this.matrix.columns[column]) {
      const basicForRow = this.basis[cell.row];
      if (basicForRow === basic) continue;
      if (this.columnTypes.get(basicForRow) !== COLUMN_FREE && result++ > bound) return result;
    }
    return result;
  }

  // find_beneficial_entering_tableau_rows: the cell of the entering column, or undefined.
  private findBeneficialEntering(rowIndex: number) {
    const row = this.matrix.rows[rowIndex];
    const basic = this.basis[rowIndex];
    const isGrowing = this.needsToGrow(basic);
    const canMove = (cell: RowCell) =>
      cell.column !== basic &&
      (isGrowing ? this.monoidCanDecrease(cell) : this.monoidCanIncrease(cell));
    if (this.isBlandMode) {
      let choice: RowCell | undefined;
      for (const cell of row)
        if (canMove(cell) && (choice === undefined || cell.column < choice.column)) choice = cell;
      if (choice === undefined) this.infRowIndex = rowIndex;
      return choice;
    }
    let choice = -1;
    let numChoices = 0;
    let minNonFree = Number.MAX_SAFE_INTEGER;
    let bestColumnSize = Number.MAX_SAFE_INTEGER;
    for (let index = 0; index < row.length; index++) {
      const cell = row[index];
      if (!canMove(cell)) continue;
      const notFree = this.getNumOfNotFreeBasicDependentVars(cell.column, minNonFree, basic);
      const columnSize = this.matrix.columns[cell.column].length;
      if (notFree < minNonFree || (notFree === minNonFree && columnSize < bestColumnSize)) {
        minNonFree = notFree;
        bestColumnSize = columnSize;
        choice = index;
        numChoices = 1;
      } else if (
        notFree === minNonFree &&
        columnSize === bestColumnSize &&
        this.settings.getRandomNext(++numChoices) === 0
      )
        choice = index;
    }
    if (choice === -1) {
      this.infRowIndex = rowIndex;
      return undefined;
    }
    return row[choice];
  }

  private getValForLeaving(column: number) {
    switch (this.columnTypes.get(column)) {
      case COLUMN_FIXED:
      case COLUMN_UPPER:
        return this.upperBounds[column];
      case COLUMN_BOXED:
        return this.x[column].compare(this.upperBounds[column]) > 0
          ? this.upperBounds[column]
          : this.lowerBounds[column];
      default:
        return this.lowerBounds[column];
    }
  }

  private oneIterationTableauRows() {
    if (this.infHeap.size === 0) {
      this.status = LP_OPTIMAL;
      return;
    }
    const leaving = this.infHeap.getMin();
    if (!this.isBlandMode) {
      if (this.leftBasis.has(leaving)) {
        if (++this.leftBasisRepeated > BLAND_MODE_THRESHOLD) this.isBlandMode = true;
      } else this.leftBasis.add(leaving);
    }
    const enteringCell = this.findBeneficialEntering(this.heading[leaving]);
    if (enteringCell === undefined) {
      this.status = LP_INFEASIBLE;
      return;
    }
    if (this.settings.isCanceled()) {
      this.status = LP_CANCELLED;
      return;
    }
    const entering = enteringCell.column;
    const newValue = this.getValForLeaving(leaving);
    const theta = this.x[leaving].sub(newValue).div(enteringCell.coeff);
    this.x[leaving] = newValue;
    this.infHeap.erase(leaving);
    this.x[entering] = this.x[entering].add(theta);
    for (const cell of this.matrix.columns[entering]) {
      const basic = this.basis[cell.row];
      if (basic !== leaving)
        this.submulFromXAndTrackFeasibility(basic, theta, this.matrix.getVal(cell));
    }
    this.pivotColumnTableau(entering, this.heading[leaving]);
    this.changeBasis(entering, leaving);
    this.trackColumnFeasibility(entering);
    if (this.isFeasible()) this.status = LP_OPTIMAL;
  }

  // lp_primal_core_solver::solve, looking only for a feasible solution.
  private solveTableau() {
    if (this.isFeasible()) {
      this.status = LP_FEASIBLE;
      return;
    }
    this.isBlandMode = false;
    this.leftBasis.clear();
    this.leftBasisRepeated = 0;
    do {
      if (this.settings.isCanceled()) {
        this.status = LP_CANCELLED;
        return;
      }
      this.oneIterationTableauRows();
    } while (
      this.status !== LP_OPTIMAL &&
      this.status !== LP_INFEASIBLE &&
      this.status !== LP_CANCELLED &&
      !this.isFeasible()
    );
  }

  // lar_core_solver::solve.
  solve() {
    if (this.isFeasible()) {
      this.status = LP_OPTIMAL;
      return;
    }
    this.status = LP_UNKNOWN;
    this.solveTableau();
    if (this.status === LP_INFEASIBLE) {
      const basic = this.basis[this.infRowIndex];
      this.infeasibleSumSign = this.infSignOfColumn(basic);
      this.infeasibleCombination = this.matrix.rows[this.infRowIndex].map((cell) => [
        cell.coeff,
        cell.column,
      ]);
    } else if (this.status !== LP_CANCELLED) this.status = LP_OPTIMAL;
  }

  pushScope() {
    this.columnTypes.pushScope();
  }

  popScope(count: number) {
    this.columnTypes.popScope(count);
    const columnCount = this.matrix.getColumnCount();
    this.x.length = columnCount;
    this.infeasibleCombination = [];
  }
}
