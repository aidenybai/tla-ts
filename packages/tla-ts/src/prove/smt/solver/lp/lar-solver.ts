// Ported from Z3 (src/math/lp/lar_solver.h, src/math/lp/lar_solver.cpp, src/math/lp/column.h,
// src/math/lp/var_register.h), MIT license, see z3-license.txt. Columns for theory variables and
// for terms, whose rows the tableau keeps, bounds with dependencies on the constraints that set
// them, and the push and pop of all of it.
import { SmtInvariantError } from "../../../../errors";
import { Rational } from "../rational";
import { IndexedUintSet, StackedVector } from "./containers";
import { ConstraintSet, KIND_EQ, KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./constraints";
import {
  COLUMN_BOXED,
  COLUMN_FIXED,
  COLUMN_FREE,
  COLUMN_LOWER,
  COLUMN_UPPER,
  CoreSolver,
  LP_CANCELLED,
  LP_FEASIBLE,
  LP_INFEASIBLE,
  LP_OPTIMAL,
  LP_UNKNOWN,
  type ColumnType,
} from "./core-solver";
import { Dependency, linearize, mkJoin } from "./dependency";
import type { Explanation } from "./explanation";
import { LarTerm } from "./lar-term";
import { LpSettings } from "./lp-settings";
import { Impq } from "./numeric-pair";
import { shrink } from "../array";

export const NULL_LPVAR = -1;

interface Column {
  lowerWitness: Dependency;
  upperWitness: Dependency;
  readonly term: LarTerm | null;
}

const getTermKey = (term: LarTerm) =>
  [...term.coeffs]
    .map((entry) => `${entry[0]}:${entry[1]}`)
    .sort()
    .join(",");

export class LarSolver {
  readonly settings: LpSettings;
  readonly core: CoreSolver;
  readonly constraints = new ConstraintSet();
  readonly columns: Column[] = [];
  readonly terms: LarTerm[] = [];
  readonly touchedRows = new IndexedUintSet();
  readonly columnsWithChangedBounds = new IndexedUintSet();
  rowBoundsToReplay: number[] = [];
  status = LP_UNKNOWN;
  crossedBoundsColumn = NULL_LPVAR;
  crossedBoundsDeps: Dependency = null;
  private externalToLocal = new Map<number, number>();
  private localToExternal: number[] = [];
  private localIsInt: boolean[] = [];
  private trail: (() => void)[] = [];
  private trailScopes: number[] = [];
  private usageInTerms = new StackedVector<number>();
  private fixedVarTableInt = new Map<string, number>();
  private fixedVarTableReal = new Map<string, number>();
  private fixedBaseVarSet = new IndexedUintSet();
  private normalizedTermsToColumns = new Map<string, { coeff: Rational; column: number }>();
  private isRegisteringTerms = false;
  // m_delta: zero until init_model sets it.
  private delta = Rational.zero;
  // The callback of nla for the columns whose bounds changed.
  onChangedBounds: ((columns: IndexedUintSet) => void) | undefined;
  // m_add_term_callback and m_update_column_bound_callback, which the Diophantine solver sets.
  onAddTerm: ((term: LarTerm) => void) | undefined;
  onColumnBoundUpdate: ((column: number) => void) | undefined;

  constructor(isCanceled: () => boolean) {
    this.settings = new LpSettings(isCanceled);
    this.core = new CoreSolver(this.settings);
    this.core.touchedRows = this.touchedRows;
  }

  getColumnCount() {
    return this.core.matrix.getColumnCount();
  }

  getRowCount() {
    return this.core.matrix.getRowCount();
  }

  getValue(column: number) {
    return this.core.x[column];
  }

  getLowerBound(column: number) {
    return this.core.lowerBounds[column];
  }

  getUpperBound(column: number) {
    return this.core.upperBounds[column];
  }

  isInt(column: number) {
    return this.localIsInt[column];
  }

  isBase(column: number) {
    return this.core.isBase(column);
  }

  isFixed(column: number) {
    return this.core.isFixed(column);
  }

  isFree(column: number) {
    return this.core.getColumnType(column) === COLUMN_FREE;
  }

  hasTerm(column: number) {
    return this.columns[column].term !== null;
  }

  getTerm(column: number) {
    const term = this.columns[column].term;
    if (term === null) throw new SmtInvariantError(`column ${column} has no term`);
    return term;
  }

  externalToLocalColumn(external: number) {
    return this.externalToLocal.get(external) ?? NULL_LPVAR;
  }

  getExternal(column: number) {
    return this.localToExternal[column];
  }

  isFeasible() {
    return this.status === LP_OPTIMAL || this.status === LP_FEASIBLE;
  }

  getRow(rowIndex: number) {
    return this.core.matrix.rows[rowIndex];
  }

  getUsageInTerms(column: number) {
    return column < this.usageInTerms.values.length ? this.usageInTerms.get(column) : 0;
  }

  // Columns.

  private registerExternal(external: number, isInt: boolean) {
    const local = this.localToExternal.length;
    this.localToExternal.push(external);
    this.localIsInt.push(isInt);
    if (external !== NULL_LPVAR) this.externalToLocal.set(external, local);
  }

  private addNewVarToCoreFields(isBasic: boolean) {
    this.core.addColumn(isBasic);
    if (isBasic) this.addTouchedRow(this.getRowCount() - 1);
  }

  private pushUndoAddColumn() {
    this.trail.push(() => {
      const column = this.columns[this.columns.length - 1];
      if (column.term !== null) {
        if (this.isRegisteringTerms) this.deregisterNormalizedTerm(column.term);
        this.terms.pop();
      }
      this.removeLastColumnFromTableau();
      this.columns.pop();
      const index = this.columns.length;
      if (this.columnsWithChangedBounds.has(index)) this.columnsWithChangedBounds.delete(index);
    });
  }

  addVar(external: number, isInt: boolean) {
    const existing = this.externalToLocal.get(external);
    if (existing !== undefined) return existing;
    const column = this.getColumnCount();
    this.columns.push({ lowerWitness: null, upperWitness: null, term: null });
    this.pushUndoAddColumn();
    while (this.usageInTerms.values.length <= column) this.usageInTerms.push(0);
    this.registerExternal(external, isInt);
    this.core.columnTypes.push(COLUMN_FREE);
    this.addNewVarToCoreFields(false);
    return column;
  }

  private isTermInt(term: LarTerm) {
    for (const entry of term.coeffs) if (!this.isInt(entry[0]) || !entry[1].isInt()) return false;
    return true;
  }

  // subst_known_terms: replaces term columns by their terms, the smallest column first.
  private substKnownTerms(term: LarTerm) {
    const seen = new Set<number>();
    for (const entry of term.coeffs) if (this.hasTerm(entry[0])) seen.add(entry[0]);
    while (seen.size > 0) {
      const column = Math.min(...seen);
      seen.delete(column);
      const other = this.getTerm(column);
      for (const entry of other.coeffs) if (this.hasTerm(entry[0])) seen.add(entry[0]);
      term.substByTerm(other, column);
    }
  }

  addTerm(coeffs: [number, Rational][], external: number) {
    const term = new LarTerm(coeffs);
    this.substKnownTerms(term);
    this.terms.push(term);
    const column = this.getColumnCount();
    this.registerExternal(external, this.isTermInt(term));
    term.column = column;
    this.columns.push({ lowerWitness: null, upperWitness: null, term });
    this.pushUndoAddColumn();
    this.core.columnTypes.push(COLUMN_FREE);
    this.addNewVarToCoreFields(true);
    this.core.matrix.fillLastRowWithPivoting(term, column, this.core.heading);
    this.core.x[column] = this.getBasicVarValueFromRow(this.getRowCount() - 1);
    for (const entry of term.coeffs) {
      while (this.usageInTerms.values.length <= entry[0]) this.usageInTerms.push(0);
      this.usageInTerms.set(entry[0], this.usageInTerms.get(entry[0]) + 1);
    }
    if (this.isRegisteringTerms) this.registerNormalizedTerm(term, column);
    this.onAddTerm?.(term);
    return column;
  }

  private getBasicVarValueFromRow(rowIndex: number) {
    const basic = this.core.basis[rowIndex];
    let result = Impq.zero;
    for (const cell of this.core.matrix.rows[rowIndex]) {
      if (cell.column === basic) continue;
      const value = this.core.x[cell.column];
      if (!value.isZero()) result = result.sub(value.mul(cell.coeff));
    }
    return result;
  }

  private registerNormalizedTerm(term: LarTerm, column: number) {
    const normalized = term.getNormalized();
    const key = getTermKey(normalized.term);
    if (!this.normalizedTermsToColumns.has(key))
      this.normalizedTermsToColumns.set(key, { coeff: normalized.coeff, column });
  }

  private deregisterNormalizedTerm(term: LarTerm) {
    this.normalizedTermsToColumns.delete(getTermKey(term.getNormalized().term));
  }

  registerExistingTerms() {
    if (!this.isRegisteringTerms)
      for (const term of this.terms) this.registerNormalizedTerm(term, term.column);
    this.isRegisteringTerms = true;
  }

  fetchNormalizedTermColumn(term: LarTerm) {
    return this.normalizedTermsToColumns.get(getTermKey(term));
  }

  // Removing the last column on pop.

  private removeLastColumnFromTableau() {
    const core = this.core;
    const matrix = core.matrix;
    const column = matrix.getColumnCount() - 1;
    if (this.columns[column].term !== null) {
      const rowIndex = matrix.getRowCount() - 1;
      const lastColumn = matrix.columns[column];
      let nonZeroIndex = -1;
      let isInRow = false;
      for (let index = lastColumn.length; index-- > 0;) {
        if (lastColumn[index].row === rowIndex) {
          isInRow = true;
          break;
        }
        nonZeroIndex = index;
      }
      if (!isInRow) core.transposeRows(lastColumn[nonZeroIndex].row, rowIndex);
      if (core.heading[column] < 0) core.pivotColumnTableau(column, rowIndex);
      const lastRow = matrix.rows[rowIndex];
      for (let index = lastRow.length; index-- > 0;) matrix.removeElement(lastRow, lastRow[index]);
      matrix.rows.pop();
      matrix.popColumn();
      if (core.heading[column] < 0)
        core.changeBasisUnconditionally(column, core.basis[matrix.getRowCount()]);
    } else matrix.popColumn();
    core.removeLastColumn(column);
  }

  // Bounds.

  private setUpperBoundWitness(column: number, dep: Dependency, bound: Impq) {
    const info = this.columns[column];
    const savedBound = this.core.upperBounds[column];
    const savedWitness = info.upperWitness;
    this.trail.push(() => {
      this.core.upperBounds[column] = savedBound;
      info.upperWitness = savedWitness;
    });
    info.upperWitness = dep;
    this.core.upperBounds[column] = bound;
    this.columnsWithChangedBounds.add(column);
  }

  private setLowerBoundWitness(column: number, dep: Dependency, bound: Impq) {
    const info = this.columns[column];
    const savedBound = this.core.lowerBounds[column];
    const savedWitness = info.lowerWitness;
    this.trail.push(() => {
      this.core.lowerBounds[column] = savedBound;
      info.lowerWitness = savedWitness;
    });
    info.lowerWitness = dep;
    this.core.lowerBounds[column] = bound;
    this.columnsWithChangedBounds.add(column);
  }

  private setCrossedBounds(column: number, isLower: boolean, dep: Dependency) {
    if (this.crossedBoundsColumn !== NULL_LPVAR) return;
    this.status = LP_INFEASIBLE;
    this.crossedBoundsColumn = column;
    const info = this.columns[column];
    this.crossedBoundsDeps = mkJoin(isLower ? info.lowerWitness : info.upperWitness, dep);
  }

  // adjust_bound_for_int: a strict or fractional bound on an integer column, rounded.
  private adjustBoundForInt(column: number, kind: number, bound: Rational) {
    if (!this.isInt(column) || bound.isInt()) return { kind, bound };
    if (kind === KIND_LT || kind === KIND_LE) return { kind: KIND_LE, bound: bound.floor() };
    if (kind === KIND_GT || kind === KIND_GE) return { kind: KIND_GE, bound: bound.ceil() };
    return { kind, bound };
  }

  mkVarBound(column: number, kind: number, rhs: Rational) {
    const adjusted = this.adjustBoundForInt(column, kind, rhs);
    return this.constraints.add(column, adjusted.kind, new Impq(adjusted.bound));
  }

  // constraint_is_redundant: the current bound of the column is at least as strong.
  constraintIsRedundant(index: number) {
    const constraint = this.constraints.constraints[index];
    const column = constraint.column;
    const rhs = constraint.rhs;
    if (this.isInt(column) && !rhs.x.isInt()) return false;
    const kind = constraint.kind;
    if (kind === KIND_LE || kind === KIND_LT) {
      if (!this.core.hasUpperBound(column)) return false;
      const upper = this.getUpperBound(column);
      if (!upper.x.equals(rhs.x)) return upper.x.compare(rhs.x) < 0;
      const shifted = kind === KIND_LT ? upper.y.add(Rational.one) : upper.y;
      return shifted.compare(rhs.y) <= 0;
    }
    if (kind === KIND_GE || kind === KIND_GT) {
      if (!this.core.hasLowerBound(column)) return false;
      const lower = this.getLowerBound(column);
      if (!lower.x.equals(rhs.x)) return lower.x.compare(rhs.x) > 0;
      const shifted = kind === KIND_GT ? rhs.y.add(Rational.one) : rhs.y;
      return shifted.compare(lower.y) <= 0;
    }
    return false;
  }

  activate(index: number) {
    this.constraints.activate(index);
    const constraint = this.constraints.constraints[index];
    this.updateColumnTypeAndBound(
      constraint.column,
      constraint.kind,
      constraint.rhs,
      constraint.dep,
    );
  }

  // activate_check_on_equal: also the other column fixed to the same value, if there is one.
  activateCheckOnEqual(index: number) {
    this.activate(index);
    const column = this.constraints.constraints[index].column;
    if (!this.isFixed(column)) return NULL_LPVAR;
    const bound = this.getLowerBound(column);
    if (!bound.y.isZero()) return NULL_LPVAR;
    const key = bound.x.toString();
    const table = this.isInt(column) ? this.fixedVarTableInt : this.fixedVarTableReal;
    const other = table.get(key);
    if (other === undefined) {
      table.set(key, column);
      return NULL_LPVAR;
    }
    return other !== column && this.isFixed(other) ? other : NULL_LPVAR;
  }

  findInFixedTables(value: Rational, isInt: boolean) {
    return (isInt ? this.fixedVarTableInt : this.fixedVarTableReal).get(value.toString());
  }

  updateColumnTypeAndBound(column: number, inputKind: number, rhs: Impq, dep: Dependency) {
    const adjusted = this.adjustBoundForInt(column, inputKind, rhs.x);
    const kind = adjusted.kind;
    const core = this.core;
    const hasUpper = core.hasUpperBound(column);
    const hasLower = core.hasLowerBound(column);
    const setType = (type: ColumnType) => core.columnTypes.set(column, type);
    const isUpperKind = kind === KIND_LE || kind === KIND_LT;
    const isLowerKind = kind === KIND_GE || kind === KIND_GT;
    const y =
      kind === KIND_LT
        ? rhs.y.sub(Rational.one)
        : kind === KIND_GT
          ? rhs.y.add(Rational.one)
          : rhs.y;
    const bound = new Impq(adjusted.bound, kind === KIND_EQ ? Rational.zero : y);
    const lower = this.getLowerBound(column);
    const upper = this.getUpperBound(column);
    if (isUpperKind) {
      if (hasLower && bound.compare(lower) < 0) this.setCrossedBounds(column, true, dep);
      else if (!hasUpper || bound.compare(upper) < 0) {
        this.setUpperBoundWitness(column, dep, bound);
        if (!hasUpper)
          setType(hasLower ? (bound.equals(lower) ? COLUMN_FIXED : COLUMN_BOXED) : COLUMN_UPPER);
      }
    } else if (isLowerKind) {
      if (hasUpper && bound.compare(upper) > 0) this.setCrossedBounds(column, false, dep);
      else if (!hasLower || bound.compare(lower) >= 0) {
        this.setLowerBoundWitness(column, dep, bound);
        if (hasUpper) setType(bound.equals(upper) ? COLUMN_FIXED : COLUMN_BOXED);
        else if (!hasLower) setType(COLUMN_LOWER);
      }
    } else if (kind === KIND_EQ) {
      if (hasUpper && bound.compare(upper) > 0) this.setCrossedBounds(column, false, dep);
      else if (hasLower && bound.compare(lower) < 0) this.setCrossedBounds(column, true, dep);
      else {
        this.setUpperBoundWitness(column, dep, bound);
        this.setLowerBoundWitness(column, dep, bound);
        setType(COLUMN_FIXED);
      }
    }
    if (hasUpper && hasLower && this.getLowerBound(column).equals(this.getUpperBound(column)))
      setType(COLUMN_FIXED);
    if (this.isBase(column) && this.isFixed(column)) this.fixedBaseVarSet.add(column);
    this.onColumnBoundUpdate?.(column);
  }

  addTouchedRow(rowIndex: number) {
    this.touchedRows.add(rowIndex);
  }

  addColumnRowsToTouchedRows(column: number) {
    for (const cell of this.core.matrix.columns[column]) this.addTouchedRow(cell.row);
  }

  // Solving.

  private changeBasicColumnsDependingOn(column: number, delta: Impq) {
    const core = this.core;
    for (const cell of core.matrix.columns[column])
      core.submulFromXAndTrackFeasibility(core.basis[cell.row], delta, core.matrix.getVal(cell));
  }

  setValueForNbasicColumn(column: number, value: Impq) {
    const delta = value.sub(this.core.x[column]);
    this.core.x[column] = value;
    this.changeBasicColumnsDependingOn(column, delta);
  }

  findFeasibleSolution() {
    this.settings.stats.makeFeasible++;
    if (this.status === LP_INFEASIBLE) return this.status;
    const core = this.core;
    for (const column of this.columnsWithChangedBounds.elems) {
      if (core.isBase(column)) {
        core.trackColumnFeasibility(column);
        continue;
      }
      const delta = core.makeColumnFeasible(column);
      if (delta !== undefined) this.changeBasicColumnsDependingOn(column, delta);
    }
    core.solve();
    this.status = core.status;
    if (this.status === LP_INFEASIBLE || this.status === LP_CANCELLED) return this.status;
    for (const column of this.columnsWithChangedBounds.elems) {
      if (core.isBase(column)) this.addTouchedRow(core.heading[column]);
      else this.addColumnRowsToTouchedRows(column);
    }
    this.onChangedBounds?.(this.columnsWithChangedBounds);
    this.columnsWithChangedBounds.clear();
    return this.status;
  }

  // get_infeasibility_explanation: the crossed bounds, or the bounds of the infeasible row.
  getInfeasibilityExplanation(explanation: Explanation) {
    explanation.clear();
    if (this.crossedBoundsColumn !== NULL_LPVAR) {
      for (const constraint of linearize([this.crossedBoundsDeps]))
        explanation.addPair(constraint, Rational.minusOne);
      return;
    }
    const core = this.core;
    const sign = core.infeasibleSumSign;
    if (sign === 0) return;
    for (const entry of core.infeasibleCombination) {
      const adjustedSign = entry[0].isPositive() ? sign : -sign;
      const info = this.columns[entry[1]];
      const dep = adjustedSign < 0 ? info.upperWitness : info.lowerWitness;
      for (const constraint of linearize([dep])) explanation.addPair(constraint, entry[0]);
    }
  }

  // remove_fixed_vars_from_base: pivots fixed basic columns out of the basis.
  removeFixedVarsFromBase() {
    const core = this.core;
    const columnCount = this.getColumnCount();
    const toRemove: number[] = [];
    core.withoutTouchedRows(() => {
      for (const column of this.fixedBaseVarSet.elems) {
        if (column >= columnCount || !this.isBase(column) || !this.isFixed(column)) {
          toRemove.push(column);
          continue;
        }
        for (const cell of core.matrix.rows[core.heading[column]]) {
          if (this.isFixed(cell.column)) continue;
          core.pivot(cell.column, column);
          toRemove.push(column);
          break;
        }
      }
    });
    for (const column of toRemove) this.fixedBaseVarSet.delete(column);
  }

  // remove_from_basis: pivots a basic column with the first non-fixed column of its row.
  removeFromBasis(column: number) {
    const core = this.core;
    for (const cell of core.matrix.rows[core.heading[column]]) {
      if (cell.column === column || this.isFixed(cell.column)) continue;
      core.pivot(cell.column, column);
      return true;
    }
    return false;
  }

  insideBounds(column: number, value: Impq) {
    const core = this.core;
    if (core.hasUpperBound(column) && value.compare(core.upperBounds[column]) > 0) return false;
    return !(core.hasLowerBound(column) && value.compare(core.lowerBounds[column]) < 0);
  }

  // try_to_patch: sets a column to a value unless the column or a basic column it moves is blocked,
  // reporting each changed column.
  tryToPatch(
    column: number,
    value: Rational,
    isBlocked: (column: number, value: Impq) => boolean,
    changeReport: (column: number) => void,
  ) {
    const core = this.core;
    if (this.isBase(column) && !this.removeFromBasis(column)) return false;
    const target = new Impq(value);
    if (isBlocked(column, target)) return false;
    const delta = core.x[column].sub(target);
    for (const cell of core.matrix.columns[column]) {
      const basic = core.basis[cell.row];
      if (isBlocked(basic, delta.mul(core.matrix.getVal(cell)).add(core.x[basic]))) return false;
    }
    const change = target.sub(core.x[column]);
    core.x[column] = target;
    changeReport(column);
    for (const cell of core.matrix.columns[column]) {
      const basic = core.basis[cell.row];
      core.addDeltaToXAndTrackFeasibility(basic, change.mul(core.matrix.getVal(cell).neg()));
      changeReport(basic);
    }
    return true;
  }

  moveNonBasicColumnsToBounds() {
    const core = this.core;
    let isChanged = false;
    for (const column of core.nbasis) if (this.moveNonBasicColumnToBounds(column)) isChanged = true;
    if (isChanged) this.findFeasibleSolution();
  }

  private moveNonBasicColumnToBounds(column: number) {
    const core = this.core;
    const value = core.x[column];
    const lower = core.lowerBounds[column];
    const upper = core.upperBounds[column];
    switch (core.getColumnType(column)) {
      case COLUMN_BOXED:
        if (value.equals(lower) || value.equals(upper)) return false;
        this.setValueForNbasicColumn(column, lower);
        return true;
      case COLUMN_LOWER:
        if (value.equals(lower)) return false;
        this.setValueForNbasicColumn(column, lower);
        return true;
      case COLUMN_FIXED:
      case COLUMN_UPPER:
        if (value.equals(upper)) return false;
        this.setValueForNbasicColumn(column, upper);
        return true;
      default:
        if (!this.isInt(column) || value.isInt()) return false;
        this.setValueForNbasicColumn(column, new Impq(value.floor()));
        return true;
    }
  }

  hasInfInt() {
    for (let column = 0; column < this.getColumnCount(); column++)
      if (this.isInt(column) && !this.core.x[column].isInt()) return true;
    return false;
  }

  // The model.

  // init_model: a δ that keeps strict bounds strict and distinct values distinct.
  initModel() {
    if (this.status !== LP_OPTIMAL && this.status !== LP_FEASIBLE) return false;
    if (this.columnsWithChangedBounds.size > 0) return false;
    const core = this.core;
    let delta = Rational.one;
    const updateDelta = (low: Impq, high: Impq) => {
      if (low.x.compare(high.x) < 0 && low.y.compare(high.y) > 0) {
        const candidate = high.x.sub(low.x).div(low.y.sub(high.y));
        if (candidate.compare(delta) < 0) delta = candidate;
      }
    };
    for (let column = 0; column < this.getColumnCount(); column++) {
      if (core.hasLowerBound(column)) updateDelta(core.lowerBounds[column], core.x[column]);
      if (core.hasUpperBound(column)) updateDelta(core.x[column], core.upperBounds[column]);
    }
    const pairs = new Map<string, Impq>();
    for (const value of core.x) pairs.set(value.toString(), value);
    for (;;) {
      const singles = new Set<string>();
      for (const value of pairs.values()) singles.add(value.x.add(delta.mul(value.y)).toString());
      if (singles.size === pairs.size) break;
      delta = delta.div(Rational.of(2n));
    }
    this.delta = delta;
    return true;
  }

  getModelValue(column: number) {
    const value = this.core.x[column];
    return value.x.add(this.delta.mul(value.y));
  }

  // has_value: the value of a column, or of the term of a column, when δ does not occur in it.
  getExactValue(column: number) {
    const term = this.columns[column].term;
    if (term === null) {
      const value = this.core.x[column];
      return value.y.isZero() ? value.x : undefined;
    }
    let result = Rational.zero;
    for (const entry of term.coeffs) {
      const value = this.core.x[entry[0]];
      if (!value.y.isZero()) return undefined;
      result = result.add(value.x.mul(entry[1]));
    }
    return result;
  }

  // has_lower_bound and has_upper_bound: the witness, value and strictness of a bound.
  getBound(column: number, isUpper: boolean) {
    if (column >= this.columns.length) return undefined;
    const info = this.columns[column];
    const dep = isUpper ? info.upperWitness : info.lowerWitness;
    if (dep === null) return undefined;
    const bound = isUpper ? this.core.upperBounds[column] : this.core.lowerBounds[column];
    return {
      dep,
      value: bound.x,
      isStrict: isUpper ? bound.y.isNegative() : bound.y.isPositive(),
    };
  }

  // get_rid_of_inf_eps: the values with δ instantiated small enough to keep strict bounds strict.
  getRidOfInfEps() {
    const core = this.core;
    const columnCount = this.getColumnCount();
    if (core.x.slice(0, columnCount).every((value) => value.y.isZero())) return;
    let delta = Rational.one;
    const updateDelta = (low: Impq, high: Impq) => {
      if (low.x.compare(high.x) < 0 && low.y.compare(high.y) > 0) {
        const candidate = high.x.sub(low.x).div(low.y.sub(high.y));
        if (candidate.compare(delta) < 0) delta = candidate;
      }
    };
    for (let column = 0; column < columnCount; column++) {
      if (core.hasLowerBound(column)) updateDelta(core.lowerBounds[column], core.x[column]);
      if (core.hasUpperBound(column)) updateDelta(core.x[column], core.upperBounds[column]);
    }
    for (let column = 0; column < columnCount; column++) {
      const value = core.x[column];
      if (!value.y.isZero()) core.x[column] = new Impq(value.x.add(delta.mul(value.y)));
    }
  }

  // get_bound_constraint_witnesses_for_column: the witnesses of both bounds.
  getBoundWitnesses(column: number) {
    return mkJoin(this.columns[column].lowerWitness, this.columns[column].upperWitness);
  }

  // collect_more_rows_for_lp_propagation: the rows of the columns whose bounds nla changed.
  collectMoreRowsForLpPropagation() {
    for (const column of this.columnsWithChangedBounds.elems) {
      if (this.core.isBase(column)) this.addTouchedRow(this.core.heading[column]);
      else this.addColumnRowsToTouchedRows(column);
    }
  }

  getLowerWitness(column: number) {
    return this.columns[column].lowerWitness;
  }

  getUpperWitness(column: number) {
    return this.columns[column].upperWitness;
  }

  // Scopes.

  pushTrail(undo: () => void) {
    this.trail.push(undo);
  }

  push() {
    this.trailScopes.push(this.trail.length);
    this.crossedBoundsColumn = NULL_LPVAR;
    this.crossedBoundsDeps = null;
    this.core.pushScope();
    this.constraints.pushScope();
    this.usageInTerms.pushScope();
  }

  pop(count: number) {
    this.crossedBoundsColumn = NULL_LPVAR;
    this.crossedBoundsDeps = null;
    const trailSize = this.trailScopes[this.trailScopes.length - count];
    shrink(this.trailScopes, this.trailScopes.length - count);
    while (this.trail.length > trailSize) this.trail.pop()?.();
    const columnCount = this.columns.length;
    for (let column = this.localToExternal.length; column-- > columnCount;) {
      const external = this.localToExternal[column];
      if (external !== NULL_LPVAR) this.externalToLocal.delete(external);
    }
    shrink(this.localToExternal, columnCount);
    shrink(this.localIsInt, columnCount);
    this.core.popScope(count);
    for (const table of [this.fixedVarTableInt, this.fixedVarTableReal])
      for (const entry of table)
        if (entry[1] >= columnCount || !this.isFixed(entry[1])) table.delete(entry[0]);
    for (const rowIndex of this.rowBoundsToReplay) this.addTouchedRow(rowIndex);
    this.rowBoundsToReplay = [];
    const rowCount = this.getRowCount();
    for (const rowIndex of this.touchedRows.elems.filter((row) => row >= rowCount))
      this.touchedRows.delete(rowIndex);
    this.cleanInfHeapAfterPop();
    this.constraints.popScope(count);
    this.usageInTerms.popScope(count);
    this.status = LP_UNKNOWN;
  }

  private cleanInfHeapAfterPop() {
    const core = this.core;
    const columnCount = this.getColumnCount();
    for (const column of [...core.infHeap].filter((value) => value >= columnCount))
      core.infHeap.erase(column);
    const becameFeasible: number[] = [];
    for (const column of Array.from(core.infHeap)) {
      if (core.isBase(column)) continue;
      const delta = core.makeColumnFeasible(column);
      if (delta !== undefined) this.changeBasicColumnsDependingOn(column, delta);
      becameFeasible.push(column);
    }
    for (const column of becameFeasible) if (core.infHeap.has(column)) core.infHeap.erase(column);
    for (const column of Array.from(core.infHeap))
      if (core.columnIsFeasible(column)) core.infHeap.erase(column);
  }

  // add_equality: the term j - k bounded above and below by 0.
  addEquality(first: number, second: number) {
    const column = this.addTerm(
      [
        [first, Rational.one],
        [second, Rational.minusOne],
      ],
      NULL_LPVAR,
    );
    if (!this.getValue(first).equals(this.getValue(second))) this.status = LP_UNKNOWN;
    const le = this.mkVarBound(column, KIND_LE, Rational.zero);
    this.activate(le);
    const ge = this.mkVarBound(column, KIND_GE, Rational.zero);
    this.activate(ge);
    return [le, ge];
  }
}
