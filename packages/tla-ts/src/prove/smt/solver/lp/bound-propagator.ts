// Ported from Z3 (src/math/lp/bound_analyzer_on_row.h, src/math/lp/lp_bound_propagator.h,
// src/math/lp/implied_bound.h, and propagate_bounds_for_touched_rows in src/math/lp/lar_solver.h),
// MIT license, see z3-license.txt. Bounds that a row implies on its columns from the bounds of the
// others, and equalities between columns that rows with fixed columns imply.
import { Rational } from "../rational";
import { COLUMN_FIXED, COLUMN_FREE, COLUMN_LOWER, COLUMN_UPPER } from "./core-solver";
import { KIND_GE, KIND_LE } from "./constraints";
import { Dependency, linearize } from "./dependency";
import { Explanation } from "./explanation";
import type { LarSolver } from "./lar-solver";
import type { RowCell } from "./static-matrix";

// The theory side of lp_bound_propagator.
export interface BoundPropagatorHost {
  columnIsInteresting(column: number): boolean;
  boundIsInteresting(column: number, kind: number, value: Rational): boolean;
  isEqual(first: number, second: number): boolean;
  addEq(first: number, second: number, explanation: Explanation, isFixed: boolean): boolean;
}

// implied_bound: the explanation is a weighted list of the witnesses of the other columns.
export interface ImpliedBound {
  column: number;
  bound: Rational;
  isLower: boolean;
  isStrict: boolean;
  explain: () => [Rational, Dependency][];
}

// bound_kind: the kind of a lower or upper bound, halved when strict.
export const getImpliedKind = (bound: ImpliedBound) => {
  const kind = bound.isLower ? KIND_GE : KIND_LE;
  return bound.isStrict ? kind / 2 : kind;
};

export class BoundPropagator {
  ibounds: ImpliedBound[] = [];
  private improvedLower = new Map<number, number>();
  private improvedUpper = new Map<number, number>();
  private visitedRows = new Set<number>();
  private val2fixedRow = new Map<string, number>();
  private row2indexPos = new Map<string, number>();
  private row2indexNeg = new Map<string, number>();

  constructor(
    private solver: LarSolver,
    private host: BoundPropagatorHost,
  ) {}

  init() {
    this.improvedLower.clear();
    this.improvedUpper.clear();
    this.ibounds = [];
  }

  // propagate_bounds_for_touched_rows.
  propagateBoundsForTouchedRows() {
    const solver = this.solver;
    const settings = solver.settings;
    if (settings.isPropagatingEqs) {
      if (settings.getRandomNext() % 10 === 0) solver.removeFixedVarsFromBase();
      this.visitedRows.clear();
      for (const rowIndex of solver.touchedRows.elems.slice()) {
        const offsetEqs = settings.stats.offsetEqs;
        this.cheapEqOnNbase(rowIndex);
        if (settings.isCanceled()) return;
        if (settings.stats.offsetEqs > offsetEqs) solver.rowBoundsToReplay.push(rowIndex);
      }
    }
    for (const rowIndex of solver.touchedRows.elems.slice()) {
      const row = solver.getRow(rowIndex);
      if (row.length <= settings.maxRowLengthForBoundPropagation) {
        settings.stats.bpRowsAnalyzed++;
        this.analyzeRow(row);
      }
      if (settings.isCanceled()) return;
    }
    solver.touchedRows.clear();
  }

  // Bound analysis of a row whose sum is zero.

  private analyzeRow(row: RowCell[]) {
    const core = this.solver.core;
    let columnOfU = -1;
    let columnOfL = -1;
    const advanceU = (column: number) => {
      columnOfU = columnOfU === -1 ? column : -2;
    };
    const advanceL = (column: number) => {
      columnOfL = columnOfL === -1 ? column : -2;
    };
    for (const cell of row) {
      if (columnOfL === -2 && columnOfU === -2) return;
      if (cell.coeff.isBig()) return;
      switch (core.getColumnType(cell.column)) {
        case COLUMN_LOWER:
          if (cell.coeff.isPositive()) advanceU(cell.column);
          else advanceL(cell.column);
          break;
        case COLUMN_UPPER:
          if (cell.coeff.isNegative()) advanceU(cell.column);
          else advanceL(cell.column);
          break;
        case COLUMN_FREE:
          advanceU(cell.column);
          advanceL(cell.column);
          break;
      }
    }
    let someIsInteresting: boolean | undefined;
    const isSomeInteresting = () => {
      someIsInteresting ??= row.some((cell) => this.host.columnIsInteresting(cell.column));
      return someIsInteresting;
    };
    if (columnOfU >= 0) {
      if (this.host.columnIsInteresting(columnOfU)) this.limitMonoidFromOne(row, columnOfU, true);
    } else if (columnOfU === -1 && isSomeInteresting()) this.limitAllMonoids(row, true);
    if (columnOfL >= 0) {
      if (this.host.columnIsInteresting(columnOfL)) this.limitMonoidFromOne(row, columnOfL, false);
    } else if (columnOfL === -1 && isSomeInteresting()) this.limitAllMonoids(row, false);
  }

  // The bound of a monoid a * x at its maximum, or its minimum, and whether it is strict.
  private getMonoidBound(coeff: Rational, column: number, isMax: boolean) {
    const solver = this.solver;
    const isUpper = coeff.isPositive() === isMax;
    const bound = isUpper ? solver.getUpperBound(column) : solver.getLowerBound(column);
    return { value: bound.x, isStrict: !bound.y.isZero() };
  }

  // limit_all_monoids_from_below (isFromBelow) and limit_all_monoids_from_above.
  private limitAllMonoids(row: RowCell[], isFromBelow: boolean) {
    let numStrict = 0;
    let total = Rational.zero;
    for (const cell of row) {
      const bound = this.getMonoidBound(cell.coeff, cell.column, isFromBelow);
      total = total.sub(cell.coeff.mul(bound.value));
      if (bound.isStrict) numStrict++;
    }
    for (const cell of row) {
      if (!this.host.columnIsInteresting(cell.column)) continue;
      const own = this.getMonoidBound(cell.coeff, cell.column, isFromBelow);
      const bound = total.div(cell.coeff).add(own.value);
      const isPositive = cell.coeff.isPositive();
      const isStrict = numStrict - (own.isStrict ? 1 : 0) > 0;
      this.limitJ(row, cell.column, bound, isPositive, isPositive === isFromBelow, isStrict);
    }
  }

  // limit_monoid_u_from_below (isFromBelow) and limit_monoid_l_from_above.
  private limitMonoidFromOne(row: RowCell[], target: number, isFromBelow: boolean) {
    let bound = Rational.zero;
    let targetCoeff = Rational.zero;
    let isStrict = false;
    for (const cell of row) {
      if (cell.column === target) {
        targetCoeff = cell.coeff;
        continue;
      }
      const monoid = this.getMonoidBound(cell.coeff, cell.column, isFromBelow);
      bound = bound.sub(cell.coeff.mul(monoid.value));
      if (monoid.isStrict) isStrict = true;
    }
    bound = bound.div(targetCoeff);
    const isPositive = targetCoeff.isPositive();
    this.limitJ(row, target, bound, isPositive, isPositive === isFromBelow, isStrict);
  }

  private limitJ(
    row: RowCell[],
    column: number,
    value: Rational,
    isCoeffPositive: boolean,
    isLower: boolean,
    isStrict: boolean,
  ) {
    const baseKind = isLower ? KIND_GE : KIND_LE;
    if (!this.host.boundIsInteresting(column, isStrict ? baseKind / 2 : baseKind, value)) return;
    const solver = this.solver;
    const explain = () => {
      const jSign = (isCoeffPositive ? 1 : -1) * (isLower ? 1 : -1);
      const own = row.find((cell) => cell.column === column)?.coeff.abs() ?? Rational.one;
      const result: [Rational, Dependency][] = [];
      for (const cell of row) {
        if (cell.column === column) continue;
        const sign = jSign * (cell.coeff.isPositive() ? 1 : -1);
        const witness =
          sign > 0 ? solver.getUpperWitness(cell.column) : solver.getLowerWitness(cell.column);
        result.push([cell.coeff.abs().div(own), witness]);
      }
      return result;
    };
    this.addBound(value, column, isLower, isStrict, explain);
  }

  private addBound(
    value: Rational,
    column: number,
    isLower: boolean,
    isStrict: boolean,
    explain: ImpliedBound["explain"],
  ) {
    const improved = isLower ? this.improvedLower : this.improvedUpper;
    const index = improved.get(column);
    if (index === undefined) {
      improved.set(column, this.ibounds.length);
      this.ibounds.push({ column, bound: value, isLower, isStrict, explain });
      return;
    }
    const found = this.ibounds[index];
    const comparison = value.compare(found.bound);
    if (
      (isLower ? comparison > 0 : comparison < 0) ||
      (comparison === 0 && !found.isStrict && isStrict)
    ) {
      found.bound = value;
      found.isStrict = isStrict;
      found.explain = explain;
    }
  }

  // Equalities from rows.

  // column_is_fixed: fixed, without an infinitesimal.
  private isFixed(column: number) {
    const solver = this.solver;
    return (
      solver.core.getColumnType(column) === COLUMN_FIXED && solver.getLowerBound(column).y.isZero()
    );
  }

  private getVal(column: number) {
    return this.solver.getValue(column).x.toString();
  }

  private isEqNew(first: number, second: number) {
    const external1 = this.solver.getExternal(first);
    const external2 = this.solver.getExternal(second);
    return external1 !== -1 && external2 !== -1 && !this.host.isEqual(external1, external2);
  }

  private explainFixedInRow(rowIndex: number, explanation: Explanation) {
    const solver = this.solver;
    const witnesses: Dependency[] = [];
    for (const cell of solver.getRow(rowIndex)) {
      if (!solver.isFixed(cell.column)) continue;
      witnesses.push(solver.getLowerWitness(cell.column), solver.getUpperWitness(cell.column));
    }
    for (const constraint of linearize(witnesses)) explanation.push(constraint);
  }

  private addEqOnColumns(
    explanation: Explanation,
    first: number,
    second: number,
    isFixed: boolean,
  ) {
    const isAdded = this.host.addEq(first, second, explanation, isFixed);
    if (!isAdded) return;
    const stats = this.solver.settings.stats;
    if (isFixed) stats.fixedEqs++;
    else stats.offsetEqs++;
  }

  private getOnlyOneNonFixed(rowIndex: number) {
    let result = -1;
    for (const cell of this.solver.getRow(rowIndex)) {
      if (this.isFixed(cell.column)) continue;
      if (result !== -1) return -1;
      result = cell.column;
    }
    return result;
  }

  private tryAddEquationWithInternalFixedTables(row1: number) {
    const solver = this.solver;
    const v1 = this.getOnlyOneNonFixed(row1);
    if (v1 === -1) return;
    const key = this.getVal(v1);
    const row2 = this.val2fixedRow.get(key);
    if (row2 === undefined || row2 >= solver.getRowCount()) {
      this.val2fixedRow.set(key, row1);
      return;
    }
    const v2 = this.getOnlyOneNonFixed(row2);
    if (
      v2 === -1 ||
      !solver.getValue(v1).equals(solver.getValue(v2)) ||
      solver.isInt(v1) !== solver.isInt(v2)
    ) {
      this.val2fixedRow.set(key, row1);
      return;
    }
    if (v1 === v2 || !this.isEqNew(v1, v2)) return;
    const explanation = new Explanation();
    this.explainFixedInRow(row1, explanation);
    this.explainFixedInRow(row2, explanation);
    this.addEqOnColumns(explanation, v1, v2, true);
  }

  private tryAddEquationWithLpFixedTables(rowIndex: number, column: number) {
    const solver = this.solver;
    if (this.isFixed(column)) return;
    const value = solver.getValue(column);
    const other = value.y.isZero()
      ? solver.findInFixedTables(value.x, solver.isInt(column))
      : undefined;
    if (other === undefined) {
      this.tryAddEquationWithInternalFixedTables(rowIndex);
      return;
    }
    if (!this.isEqNew(other, column)) return;
    const explanation = new Explanation();
    this.explainFixedInRow(rowIndex, explanation);
    for (const constraint of linearize([
      solver.getLowerWitness(other),
      solver.getUpperWitness(other),
    ]))
      explanation.push(constraint);
    this.addEqOnColumns(explanation, other, column, true);
  }

  // extract_non_fixed: the basic column, the other non-fixed column and the sign of its unit
  // coefficient, when the row has at most two non-fixed columns.
  private extractNonFixed(rowIndex: number) {
    const solver = this.solver;
    const x = solver.core.basis[rowIndex];
    if (this.isFixed(x)) return { count: 0, x, y: -1, ySign: 0 };
    let count = 1;
    let y = -1;
    let ySign = 0;
    for (const cell of solver.getRow(rowIndex)) {
      if (cell.column === x || this.isFixed(cell.column)) continue;
      if (++count > 2) return { count, x, y, ySign };
      y = cell.column;
      ySign = cell.coeff.equals(Rational.one) ? 1 : cell.coeff.equals(Rational.minusOne) ? -1 : 0;
      if (ySign === 0) return { count, x, y, ySign };
    }
    return { count, x, y, ySign };
  }

  private cheapEqOnNbase(rowIndex: number) {
    this.cheapEqOnNbaseCore(rowIndex);
    this.row2indexPos.clear();
    this.row2indexNeg.clear();
  }

  private cheapEqOnNbaseCore(rowIndex: number) {
    const solver = this.solver;
    if (this.visitedRows.has(rowIndex)) return;
    this.visitedRows.add(rowIndex);
    const extracted = this.extractNonFixed(rowIndex);
    if (extracted.count === 0 || extracted.count > 2) return;
    if (extracted.count === 1) {
      this.tryAddEquationWithLpFixedTables(rowIndex, extracted.x);
      return;
    }
    if (extracted.ySign === 0) return;
    (extracted.ySign === 1 ? this.row2indexPos : this.row2indexNeg).set(
      this.getVal(extracted.x),
      rowIndex,
    );
    for (const cell of solver.core.matrix.columns[extracted.y]) {
      const other = cell.row;
      if (other === rowIndex || this.visitedRows.has(other)) continue;
      this.visitedRows.add(other);
      const next = this.extractNonFixed(other);
      if (next.count !== 2 || next.ySign === 0) continue;
      const table = next.ySign === 1 ? this.row2indexPos : this.row2indexNeg;
      const key = this.getVal(next.x);
      const found = table.get(key);
      if (found === undefined) {
        table.set(key, other);
        continue;
      }
      const baseOfFound = solver.core.basis[found];
      if (
        solver.isInt(next.x) !== solver.isInt(baseOfFound) ||
        !solver.getValue(next.x).y.equals(solver.getValue(baseOfFound).y)
      )
        continue;
      if (!this.isEqNew(next.x, baseOfFound)) continue;
      const explanation = new Explanation();
      this.explainFixedInRow(found, explanation);
      this.explainFixedInRow(other, explanation);
      this.addEqOnColumns(explanation, next.x, baseOfFound, false);
    }
  }
}
