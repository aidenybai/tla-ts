// Ported from Z3 (src/math/lp/dioph_eq.cpp, src/math/lp/var_register.h), MIT license, see
// z3-license.txt. The Diophantine solver of Griggio's "A Practical Approach to Satisfiability
// Modulo Linear Integer Arithmetic": every integer term t with column j gives the equation
// t - j = 0 over the columns that are not fixed. The equations are normalized by the gcd of their
// coefficients, which finds a conflict when the gcd does not divide the constant, and solved for a
// column with a unit coefficient, or rewritten with a fresh column until one appears. The bounds of
// the term columns are then tightened modulo the gcd of their terms after the substitutions.
import { SmtUnsupportedError } from "../../../../errors";
import { getGcd, getLcm, Rational } from "../rational";
import { IndexedUintSet, UnorderedUintMap } from "./containers";
import { KIND_GE, KIND_LE } from "./constraints";
import { LP_CANCELLED, LP_FEASIBLE, LP_OPTIMAL } from "./core-solver";
import { type Dependency, linearize, mkJoin } from "./dependency";
import { Explanation } from "./explanation";
import type { IntSolver } from "./int-solver";
import type { LarSolver } from "./lar-solver";
import { LarTerm } from "./lar-term";
import { Impq } from "./numeric-pair";
import { StaticMatrix } from "./static-matrix";

type DioMove = "undef" | "conflict" | "continue";

interface Monomial {
  readonly coeff: Rational;
  readonly column: number;
}

interface FreshDefinition {
  readonly term: LarTerm;
  readonly row: number;
}

const NO_VAR = -1;
// m_tighten_size_max: a longer term likely has gcd one.
const TIGHTEN_SIZE_MAX = 10;

// join of lia_move, for the moves the Diophantine solver makes.
const joinMoves = (first: DioMove, second: DioMove): DioMove => {
  if (first === second || second === "undef") return first;
  if (first === "undef") return second;
  return first === "conflict" || second === "conflict" ? "conflict" : "continue";
};

const getTermMonomials = (term: LarTerm): Monomial[] =>
  [...term.coeffs].map((entry) => ({ coeff: entry[1], column: entry[0] }));

// ext_coeffs: the monomials of the term and then the term column with coefficient -1.
const getExtendedMonomials = (term: LarTerm) => [
  ...getTermMonomials(term),
  { coeff: Rational.minusOne, column: term.column },
];

const isUnit = (value: Rational) => value.equals(Rational.one) || value.equals(Rational.minusOne);

// rem and machine_div_rem of integers: truncating, so the remainder has the sign of the dividend.
const getRemainder = (left: Rational, right: Rational) => Rational.of(left.num % right.num);

const getTruncatedQuotient = (left: Rational, right: Rational) => Rational.of(left.num / right.num);

// bitsize of an mpq: the bits of the numerator, and of the denominator when it is not one.
const getBitsize = (value: Rational) => {
  const getIntBitsize = (part: bigint) =>
    part === 0n ? 1 : (part < 0n ? -part : part).toString(2).length;
  return value.isInt()
    ? getIntBitsize(value.num)
    : getIntBitsize(value.num) + getIntBitsize(value.den);
};

// gcd_of_coeffs: one as soon as a unit coefficient shows up when asked to look for one.
const getGcdOfCoeffs = (monomials: Iterable<{ coeff: Rational }>, isCheckingForOne: boolean) => {
  if (isCheckingForOne)
    for (const monomial of monomials) if (isUnit(monomial.coeff)) return Rational.one;
  let gcd = Rational.zero;
  for (const monomial of monomials) {
    gcd = gcd.isZero() ? monomial.coeff.abs() : Rational.of(getGcd(gcd.num, monomial.coeff.num));
    if (gcd.equals(Rational.one)) break;
  }
  return gcd;
};

// term_with_index: the monomials in a vector with the position of every column, and a removal
// that moves the last monomial into the gap.
class TermWithIndex {
  readonly data: Monomial[] = [];
  private positions: number[] = [];

  get size() {
    return this.data.length;
  }

  has(column: number) {
    return (this.positions[column] ?? -1) >= 0;
  }

  get(column: number) {
    return this.data[this.positions[column]].coeff;
  }

  erase(column: number) {
    const position = this.positions[column] ?? -1;
    if (position === -1) return;
    const last = this.data.length - 1;
    if (position !== last) {
      this.data[position] = this.data[last];
      this.positions[this.data[position].column] = position;
    }
    this.data.pop();
    this.positions[column] = -1;
  }

  add(coeff: Rational, column: number) {
    const position = this.positions[column] ?? -1;
    if (position === -1) {
      this.data.push({ coeff, column });
      this.positions[column] = this.data.length - 1;
      return;
    }
    const sum = this.data[position].coeff.add(coeff);
    if (sum.isZero()) this.erase(column);
    else this.data[position] = { coeff: sum, column };
  }

  clear() {
    for (const monomial of this.data) this.positions[monomial.column] = -1;
    this.data.length = 0;
  }
}

// protected_queue: a queue of distinct columns that can also lose a column in the middle.
class ProtectedQueue {
  readonly items: number[] = [];
  private members = new Set<number>();

  get isEmpty() {
    return this.items.length === 0;
  }

  push(column: number) {
    if (this.members.has(column)) return;
    this.items.push(column);
    this.members.add(column);
  }

  popFront() {
    const column = this.items.shift() ?? NO_VAR;
    this.members.delete(column);
    return column;
  }

  remove(column: number) {
    if (!this.members.delete(column)) return;
    this.items.splice(this.items.indexOf(column), 1);
  }

  reset() {
    this.items.length = 0;
    this.members.clear();
  }
}

// var_register: the local columns of the equations, and the lar_solver column of each, or none
// for a fresh column.
class VarRegister {
  private localToExternal: number[] = [];
  private externalToLocal = new Map<number, number>();

  addVar(external: number) {
    const existing = external === NO_VAR ? undefined : this.externalToLocal.get(external);
    if (existing !== undefined) return existing;
    const local = this.localToExternal.length;
    this.localToExternal.push(external);
    if (external !== NO_VAR) this.externalToLocal.set(external, local);
    return local;
  }

  getExternal(local: number) {
    return local < this.localToExternal.length ? this.localToExternal[local] : NO_VAR;
  }

  isUsed(external: number) {
    return this.externalToLocal.has(external);
  }

  // external_to_local, which Z3 asserts finds the column.
  getLocal(external: number) {
    const local = this.externalToLocal.get(external);
    if (local === undefined)
      throw new SmtUnsupportedError(`the Diophantine solver has no column for ${external}`);
    return local;
  }

  shrink(size: number) {
    for (let local = this.localToExternal.length; local-- > size;)
      this.externalToLocal.delete(this.localToExternal[local]);
    this.localToExternal.length = size;
  }

  clear() {
    this.localToExternal = [];
    this.externalToLocal.clear();
  }
}

// m_fresh_k2xt_terms: the definition of a substituted column k by a fresh column xt, reachable
// from both. The map from k to xt is an unordered_map whose order Z3 iterates.
class FreshDefinitions {
  readonly keyToFresh = new UnorderedUintMap<number>();
  private freshToKey = new Map<number, number>();
  private definitions = new Map<number, FreshDefinition>();

  add(key: number, fresh: number, definition: FreshDefinition) {
    this.keyToFresh.insert(key, fresh);
    this.freshToKey.set(fresh, key);
    this.definitions.set(fresh, definition);
  }

  hasKey(key: number) {
    return this.keyToFresh.has(key);
  }

  hasFresh(fresh: number) {
    return this.definitions.has(fresh);
  }

  getByKey(key: number) {
    return this.getByFresh(this.keyToFresh.get(key) ?? NO_VAR);
  }

  getByFresh(fresh: number) {
    const definition = this.definitions.get(fresh);
    if (definition === undefined)
      throw new SmtUnsupportedError(`the Diophantine solver has no definition for ${fresh}`);
    return definition;
  }

  eraseByFresh(fresh: number) {
    this.keyToFresh.delete(this.freshToKey.get(fresh) ?? NO_VAR);
    this.freshToKey.delete(fresh);
    this.definitions.delete(fresh);
  }

  clear() {
    this.keyToFresh.clear();
    this.freshToKey.clear();
    this.definitions.clear();
  }
}

export class DiophantineSolver {
  // m_some_terms_are_ignored: a term was not integral or had a big number, so the GCD test and
  // Gomory cuts run.
  hasIgnoredTerms = false;
  private readonly solver: LarSolver;
  private sumOfFixed: Rational[] = [];
  private varRegister = new VarRegister();
  // m_e_matrix: the equations over local columns. m_l_matrix: each as a combination of the term
  // definitions, which explains it.
  private eMatrix = new StaticMatrix();
  private lMatrix = new StaticMatrix();
  private infeasExplanation = new Explanation();
  // m_c, the constant of m_espace.
  private constant = Rational.zero;
  private lspace = new TermWithIndex();
  private espace = new TermWithIndex();
  // m_k2s: the column each equation of S is solved for, and back.
  private keyToRow = new Map<number, number>();
  private rowToKey = new Map<number, number>();
  private freshDefinitions = new FreshDefinitions();
  private rowToFreshDefs = new Map<number, number[]>();
  private changedRows = new IndexedUintSet();
  private changedFixedColumns = new IndexedUintSet();
  private changedTerms = new IndexedUintSet();
  private termsToTighten = new IndexedUintSet();
  private columnsToTerms = new Map<number, Set<number>>();
  private conflictRow = NO_VAR;
  private conflictGcd = Rational.zero;
  private undoWork = 0;
  private addedTerms: LarTerm[] = [];
  private activeTerms = new Set<LarTerm>();
  private queue = new ProtectedQueue();

  constructor(private readonly lia: IntSolver) {
    this.solver = lia.solver;
    this.solver.onAddTerm = (term) => this.addTermCallback(term);
    this.solver.onColumnBoundUpdate = (column) => this.updateColumnBoundCallback(column);
  }

  check() {
    const settings = this.solver.settings;
    settings.stats.dioCalls++;
    const fVector: number[] = [];
    let move: DioMove;
    do {
      this.init(fVector);
      move = this.processFAndTightenTerms(fVector);
    } while (move === "continue");
    return move;
  }

  explain(explanation: Explanation) {
    explanation.clear();
    if (this.conflictRow === NO_VAR) {
      for (const constraint of this.infeasExplanation) explanation.push(constraint);
      return;
    }
    const dep = this.explainFixedInMetaTerm(
      this.getRowMonomials(this.lMatrix, this.conflictRow),
      this.conflictGcd,
    );
    for (const constraint of linearize([dep])) explanation.push(constraint);
  }

  // Callbacks of lar_solver.

  private addTermCallback(term: LarTerm) {
    if (!this.solver.isInt(term.column)) {
      this.hasIgnoredTerms = true;
      return;
    }
    this.addedTerms.push(term);
    this.changedTerms.add(term.column);
    this.solver.pushTrail(() => this.undoAddTerm(term));
  }

  private updateColumnBoundCallback(column: number) {
    const solver = this.solver;
    if (!solver.isInt(column)) return;
    if (solver.hasTerm(column)) this.termsToTighten.add(column);
    if (!solver.isFixed(column)) return;
    this.changedFixedColumns.add(column);
    solver.pushTrail(() => this.changedFixedColumns.add(column));
  }

  private undoAddTerm(term: LarTerm) {
    if (!this.activeTerms.has(term)) {
      const index = this.addedTerms.lastIndexOf(term);
      if (index !== -1) {
        this.addedTerms[index] = this.addedTerms[this.addedTerms.length - 1];
        this.addedTerms.pop();
      }
      return;
    }
    this.deregisterColumnsOfTerm(term);
    this.activeTerms.delete(term);
    const settings = this.solver.settings;
    this.undoWork += 1 + this.getEliminationWorkEstimate();
    if (this.undoWork > settings.dioUndoMaxWork || settings.isCanceled()) {
      this.resetState();
      return;
    }
    this.shrinkMatrices();
  }

  private deregisterColumnsOfTerm(term: LarTerm) {
    for (const monomial of getExtendedMonomials(term)) {
      const terms = this.columnsToTerms.get(monomial.column);
      if (terms === undefined) continue;
      terms.delete(term.column);
      if (terms.size === 0) this.columnsToTerms.delete(monomial.column);
    }
  }

  // elimination_work_estimate: the words that eliminating the column of the retired term from
  // m_l_matrix touches.
  private getEliminationWorkEstimate() {
    const lMatrix = this.lMatrix;
    if (lMatrix.getColumnCount() === 0 || lMatrix.getRowCount() === 0) return 0;
    const columnSize = lMatrix.columns[lMatrix.getColumnCount() - 1].length;
    if (columnSize <= 1) return 0;
    let words = 0;
    for (const cell of lMatrix.rows[lMatrix.getRowCount() - 1])
      words += 1 + Math.floor(getBitsize(cell.coeff) / 32);
    return (columnSize - 1) * words;
  }

  // reset_state: drops what was derived, and puts the active terms back to be added again in the
  // order of their columns.
  private resetState() {
    for (const term of this.activeTerms) {
      this.deregisterColumnsOfTerm(term);
      this.addedTerms.push(term);
    }
    this.activeTerms.clear();
    this.addedTerms.sort((first, second) => first.column - second.column);
    this.eMatrix.clear();
    this.lMatrix.clear();
    this.sumOfFixed = [];
    this.varRegister.clear();
    this.keyToRow.clear();
    this.rowToKey.clear();
    this.freshDefinitions.clear();
    this.rowToFreshDefs.clear();
    this.changedRows.clear();
    this.changedFixedColumns.clear();
    this.changedTerms.clear();
    this.termsToTighten.clear();
    this.espace.clear();
    this.lspace.clear();
    this.queue.reset();
    this.infeasExplanation.clear();
    this.conflictRow = NO_VAR;
    this.undoWork = 0;
    this.solver.settings.stats.dioStateResets++;
  }

  // shrink_matrices: removes the equation of the retired term, the last one.
  private shrinkMatrices() {
    const lastRow = this.lMatrix.getRowCount() - 1;
    this.eliminateLastTermColumn();
    removeLastRow(this.lMatrix);
    removeLastRow(this.eMatrix);
    for (const fresh of this.rowToFreshDefs.get(lastRow) ?? [])
      if (fresh < this.eMatrix.getColumnCount())
        for (const cell of this.eMatrix.columns[fresh]) this.changedRows.add(cell.row);
    popEmptyColumns(this.lMatrix);
    popEmptyColumns(this.eMatrix);
    this.varRegister.shrink(this.eMatrix.getColumnCount());
    this.removeOutOfBoundsFreshDefs();
    this.removeIrrelevantFreshDefsForRow(lastRow);
    if (this.rowToKey.has(lastRow)) this.removeFromS(lastRow);
    this.sumOfFixed.pop();
  }

  // eliminate_last_term_column: pivots the last column of m_l_matrix into its last row, and marks
  // the rows that change, whose equations are recalculated later.
  private eliminateLastTermColumn() {
    const lMatrix = this.lMatrix;
    const termColumn = lMatrix.getColumnCount() - 1;
    const lastRowIndex = lMatrix.getRowCount() - 1;
    if (!lMatrix.rows[lastRowIndex].some((cell) => cell.column === termColumn))
      lMatrix.addRows(Rational.one, lMatrix.columns[termColumn][0].row, lastRowIndex);
    const alpha = lMatrix.rows[lastRowIndex].find((cell) => cell.column === termColumn)?.coeff;
    if (alpha === undefined) return;
    lMatrix.divideRow(lastRowIndex, alpha);
    const column = lMatrix.columns[termColumn];
    const pivotIndex = column.findIndex((cell) => cell.row === lastRowIndex);
    if (pivotIndex > 0) moveCellToFront(lMatrix, column, pivotIndex);
    while (column.length > 1) {
      const cell = column[column.length - 1];
      this.changedRows.add(cell.row);
      lMatrix.pivotRowToRowGivenCell(lastRowIndex, cell, termColumn);
    }
  }

  // Filling the equations.

  private init(fVector: number[]) {
    this.infeasExplanation.clear();
    this.lia.term.clear();
    this.conflictRow = NO_VAR;
    this.undoWork = 0;
    this.processChangedFixedColumns(fVector);
    for (const term of this.addedTerms) {
      this.activeTerms.add(term);
      fVector.push(this.eMatrix.getRowCount());
      this.fillEntry(term);
      this.registerColumnsToTerm(term);
    }
    this.addedTerms = [];
  }

  private registerColumnsToTerm(term: LarTerm) {
    for (const monomial of getExtendedMonomials(term)) {
      const terms = this.columnsToTerms.get(monomial.column);
      if (terms === undefined) this.columnsToTerms.set(monomial.column, new Set([term.column]));
      else terms.add(term.column);
    }
  }

  // fill_entry: the equation t - j = 0 with the fixed columns in the constant, explained by j.
  private fillEntry(term: LarTerm) {
    const solver = this.solver;
    const row = this.eMatrix.getRowCount();
    this.lMatrix.addRow();
    this.lMatrix.addColumnsUpTo(term.column);
    this.lMatrix.addNewElement(row, term.column, Rational.one);
    this.eMatrix.addRow();
    let fixedSum = Rational.zero;
    for (const monomial of getExtendedMonomials(term)) {
      if (solver.isFixed(monomial.column)) {
        fixedSum = fixedSum.add(monomial.coeff.mul(solver.getLowerBound(monomial.column).x));
        continue;
      }
      const local = this.varRegister.addVar(monomial.column);
      this.eMatrix.addColumnsUpTo(local);
      this.eMatrix.addNewElement(row, local, monomial.coeff);
    }
    this.sumOfFixed.push(fixedSum);
    this.subsEntry(row);
  }

  // subs_entry: substitutes the solved and the freshly defined columns in the equation.
  private subsEntry(row: number) {
    if (row >= this.eMatrix.getRowCount()) return;
    const queue = this.queue;
    queue.reset();
    for (const cell of this.eMatrix.rows[row])
      if (this.canSubstitute(cell.column)) queue.push(cell.column);
    while (!queue.isEmpty) {
      const column = queue.popFront();
      const alpha = this.getCoeffInERow(row, column);
      if (alpha.isZero()) continue;
      const solvedRow = this.keyToRow.get(column);
      if (solvedRow === undefined)
        this.eMatrix.addTermToRow(alpha.neg(), this.freshDefinitions.getByKey(column).term, row);
      else
        this.addTwoEntries(
          alpha.neg().mul(Rational.fromNumber(this.getSignInERow(solvedRow, column))),
          solvedRow,
          row,
        );
      for (const cell of this.eMatrix.rows[row])
        if (this.canSubstitute(cell.column)) queue.push(cell.column);
    }
  }

  // add_two_entries: adds an equation times coeff to another.
  private addTwoEntries(coeff: Rational, from: number, to: number) {
    this.eMatrix.addRows(coeff, from, to);
    this.lMatrix.addRows(coeff, from, to);
    this.sumOfFixed[to] = this.sumOfFixed[to].add(coeff.mul(this.sumOfFixed[from]));
  }

  // recalculate_entry: the equation again from its explanation, scaled to integers.
  private recalculateEntry(row: number) {
    let fixedSum = this.openLTermToEspace(row);
    const eRow = this.eMatrix.rows[row];
    while (eRow.length > 0) this.eMatrix.removeElement(eRow, eRow[eRow.length - 1]);
    let denominator = 1n;
    for (const monomial of this.espace.data) {
      const local = this.varRegister.addVar(monomial.column);
      this.eMatrix.addColumnsUpTo(local);
      this.eMatrix.addNewElement(row, local, monomial.coeff);
      if (monomial.coeff.den !== 1n) denominator = getLcm(denominator, monomial.coeff.den);
    }
    if (denominator !== 1n) {
      const scale = Rational.of(denominator);
      fixedSum = fixedSum.mul(scale);
      this.lMatrix.multiplyRow(row, scale);
      this.eMatrix.multiplyRow(row, scale);
    }
    this.sumOfFixed[row] = fixedSum;
    if (this.rowToKey.has(row)) this.removeFromS(row);
  }

  // open_l_term_to_espace: the combination of term definitions of the row, over lar_solver
  // columns, with the fixed ones in the returned constant.
  private openLTermToEspace(row: number) {
    const solver = this.solver;
    this.espace.clear();
    let constant = Rational.zero;
    for (const cell of this.lMatrix.rows[row])
      for (const monomial of getExtendedMonomials(solver.getTerm(cell.column))) {
        const coeff = cell.coeff.mul(monomial.coeff);
        if (solver.isFixed(monomial.column))
          constant = constant.add(coeff.mul(solver.getLowerBound(monomial.column).x));
        else this.espace.add(coeff, monomial.column);
      }
    return constant;
  }

  // process_m_changed_f_columns: recalculates the equations that the columns that became fixed or
  // stopped being fixed, and the changed terms, touch.
  private processChangedFixedColumns(fVector: number[]) {
    for (const column of this.changedFixedColumns.elems.slice()) {
      const terms = this.columnsToTerms.get(column);
      if (terms !== undefined)
        for (const termColumn of [...terms].sort((first, second) => first - second))
          this.changedTerms.add(termColumn);
      if (!this.varRegister.isUsed(column)) continue;
      for (const cell of this.eMatrix.columns[this.varRegister.getLocal(column)])
        this.changedRows.add(cell.row);
    }
    for (const column of this.changedTerms.elems.slice()) {
      if (!this.isBigTermOrNoTerm(column)) this.termsToTighten.add(column);
      if (column < this.lMatrix.getColumnCount())
        for (const cell of this.lMatrix.columns[column]) this.changedRows.add(cell.row);
    }
    const moreChangedRows: number[] = [];
    for (const row of this.changedRows.elems)
      for (const fresh of this.rowToFreshDefs.get(row) ?? [])
        for (const cell of this.eMatrix.columns[fresh]) moreChangedRows.push(cell.row);
    for (const row of moreChangedRows) this.changedRows.add(row);
    this.removeOutOfBoundsFreshDefs();
    for (const row of this.changedRows.elems.slice()) this.removeIrrelevantFreshDefsForRow(row);
    for (const row of this.changedRows.elems.slice()) {
      if (row >= this.eMatrix.getRowCount()) continue;
      if (this.rowToKey.has(row)) fVector.push(row);
      this.recalculateEntry(row);
      const eMatrix = this.eMatrix;
      if (
        eMatrix.getColumnCount() > 0 &&
        eMatrix.columns[eMatrix.getColumnCount() - 1].length === 0
      ) {
        eMatrix.popColumn();
        this.varRegister.shrink(eMatrix.getColumnCount());
        this.removeOutOfBoundsFreshDefs();
      }
      const lMatrix = this.lMatrix;
      if (
        lMatrix.getColumnCount() > 0 &&
        lMatrix.columns[lMatrix.getColumnCount() - 1].length === 0
      )
        lMatrix.popColumn();
    }
    for (const row of this.changedRows.elems.slice()) this.subsEntry(row);
    this.changedFixedColumns.clear();
    this.changedRows.clear();
    this.changedTerms.clear();
  }

  // is_big_term_or_no_term: also marks the terms ignored for their big numbers.
  private isBigTermOrNoTerm(column: number) {
    const solver = this.solver;
    if (column >= solver.getColumnCount() || !solver.hasTerm(column)) return true;
    if (!solver.settings.isDioIgnoringBigNums) return false;
    for (const entry of solver.getTerm(column).coeffs) {
      const isBigFixed = solver.isFixed(entry[0]) && solver.getLowerBound(entry[0]).x.isBig();
      if (!entry[1].isBig() && !isBigFixed) continue;
      this.hasIgnoredTerms = true;
      return true;
    }
    return false;
  }

  // Fresh definitions.

  // collect_dependent_fresh_vars: the fresh columns whose definitions use a removed one.
  private collectDependentFreshVars(removed: number, toRemove: number[]) {
    const newlyFound: number[] = [];
    for (const entry of this.freshDefinitions.keyToFresh) {
      const fresh = entry[1];
      if (fresh === removed || toRemove.includes(fresh)) continue;
      const coeffs = this.freshDefinitions.getByFresh(fresh).term.coeffs;
      if (coeffs.has(removed) || toRemove.some((marked) => coeffs.has(marked)))
        newlyFound.push(fresh);
    }
    toRemove.push(...newlyFound);
    for (const fresh of newlyFound) this.collectDependentFreshVars(fresh, toRemove);
  }

  // deep_remove_fresh_var: removes the fresh column and those that depend on it, and marks the
  // rows that use them.
  private deepRemoveFreshVar(removed: number) {
    if (!this.freshDefinitions.hasFresh(removed)) return;
    const toRemove = [removed];
    this.collectDependentFreshVars(removed, toRemove);
    for (const fresh of toRemove) {
      if (!this.freshDefinitions.hasFresh(fresh)) continue;
      const row = this.freshDefinitions.getByFresh(fresh).row;
      this.freshDefinitions.eraseByFresh(fresh);
      const defs = this.rowToFreshDefs.get(row);
      if (defs !== undefined) {
        const kept = defs.filter((def) => def !== fresh);
        if (kept.length === 0) this.rowToFreshDefs.delete(row);
        else this.rowToFreshDefs.set(row, kept);
      }
      if (fresh < this.eMatrix.getColumnCount())
        for (const cell of this.eMatrix.columns[fresh]) this.changedRows.add(cell.row);
    }
  }

  private removeIrrelevantFreshDefsForRow(row: number) {
    const defs = this.rowToFreshDefs.get(row);
    if (defs === undefined) return;
    for (const fresh of defs.slice()) this.deepRemoveFreshVar(fresh);
    this.rowToFreshDefs.delete(row);
  }

  private removeOutOfBoundsFreshDefs() {
    const freshToRemove: number[] = [];
    const rows: number[] = [];
    for (const entry of this.freshDefinitions.keyToFresh) {
      if (entry[1] < this.eMatrix.getColumnCount()) continue;
      freshToRemove.push(entry[1]);
      rows.push(this.freshDefinitions.getByFresh(entry[1]).row);
    }
    for (const fresh of freshToRemove) this.deepRemoveFreshVar(fresh);
    for (const row of rows) this.removeIrrelevantFreshDefsForRow(row);
  }

  // fresh_var_step: step 7 of the paper. With the smallest coefficient a of k in row h, the fresh
  // column xt = k + sum (a_i div a) x_i replaces k in the equations of F.
  private freshVarStep(row: number, key: number, ahk: Rational) {
    const fresh = this.varRegister.addVar(NO_VAR);
    while (fresh >= this.eMatrix.getColumnCount()) this.eMatrix.addColumn();
    const freshTerm = new LarTerm();
    freshTerm.addMonomial(Rational.minusOne, fresh);
    freshTerm.addMonomial(Rational.one, key);
    for (const cell of this.eMatrix.rows[row]) {
      if (cell.column === key) continue;
      const quotient = getTruncatedQuotient(cell.coeff, ahk);
      if (!quotient.isZero()) freshTerm.addMonomial(quotient, cell.column);
    }
    // std::make_pair copies the term with lar_term's copy constructor, and the bij_map assigns
    // it, so the stored term is reinserted twice in iteration order.
    const stored = new LarTerm(new LarTerm(freshTerm.coeffs).coeffs);
    this.freshDefinitions.add(key, fresh, { term: stored, row });
    const defs = this.rowToFreshDefs.get(row);
    if (defs === undefined) this.rowToFreshDefs.set(row, [fresh]);
    else defs.push(fresh);
    const column = this.eMatrix.columns[key];
    for (let index = column.length; index-- > 0;) {
      const cell = column[index];
      if (this.rowToKey.has(cell.row)) continue;
      this.eMatrix.pivotTermToRowGivenCell(freshTerm, cell, key, 1);
    }
  }

  // Solving F.

  private processFAndTightenTerms(fVector: number[]): DioMove {
    const move = this.processF(fVector);
    if (move !== "undef") return move;
    const tightened = this.tightenTermsWithS();
    if (tightened === "conflict") this.solver.settings.stats.dioTightenConflicts++;
    return tightened;
  }

  private processF(fVector: number[]): DioMove {
    if (this.conflictRow !== NO_VAR) return "conflict";
    let move: DioMove;
    do {
      move = this.rewriteEqs(fVector);
      if (this.solver.settings.isCanceled()) return "undef";
      if (move !== "continue") break;
    } while (fVector.length > 0);
    return move === "conflict" ? "conflict" : "undef";
  }

  private setRewriteConflict(row: number, gcd: Rational) {
    this.conflictRow = row;
    this.conflictGcd = gcd;
    this.solver.settings.stats.dioRewriteConflicts++;
  }

  // rewrite_eqs: steps 6 and 7 of the paper on the equation of F with the smallest coefficient,
  // and of those the one whose substitution fills the fewest cells.
  private rewriteEqs(fVector: number[]): DioMove {
    if (fVector.length === 0) return "undef";
    let chosenRow = NO_VAR;
    let chosenKey = 0;
    let chosenIndex = NO_VAR;
    let chosenSign = 0;
    let chosenMarkovich = 0;
    let minAhk = Rational.zero;
    let numChoices = 0;
    for (let index = 0; index < fVector.length; index++) {
      const row = fVector[index];
      const eRow = this.eMatrix.rows[row];
      if (eRow.length === 0) {
        if (this.sumOfFixed[row].isZero()) continue;
        this.setRewriteConflict(row, Rational.zero);
        return "conflict";
      }
      if (!this.sumOfFixed[row].isInt()) {
        this.setRewriteConflict(row, Rational.zero);
        return "conflict";
      }
      const minimal = this.findMinimalAbsCoeff(row);
      const gcd = this.normalizeEByGcd(row);
      if (gcd === undefined) return "conflict";
      const ahk = gcd.equals(Rational.one) ? minimal.ahk : minimal.ahk.div(gcd);
      if (numChoices === 0 || minAhk.compare(ahk) > 0) {
        chosenIndex = index;
        numChoices = 1;
        minAhk = ahk;
        chosenRow = row;
        chosenKey = minimal.column;
        chosenSign = minimal.sign;
        chosenMarkovich = minimal.markovich;
        continue;
      }
      if (minAhk.equals(ahk) && chosenMarkovich > minimal.markovich) {
        chosenIndex = index;
        chosenRow = row;
        chosenKey = minimal.column;
        chosenSign = minimal.sign;
        chosenMarkovich = minimal.markovich;
      }
      if (minAhk.equals(Rational.one) && chosenMarkovich === 0) break;
    }
    if (chosenRow === NO_VAR) return "undef";
    if (minAhk.equals(Rational.one)) {
      this.keyToRow.set(chosenKey, chosenRow);
      this.rowToKey.set(chosenRow, chosenKey);
      this.eliminateVarInF(chosenRow, chosenKey, chosenSign);
      fVector[chosenIndex] = fVector[fVector.length - 1];
      fVector.pop();
    } else this.freshVarStep(chosenRow, chosenKey, minAhk.mul(Rational.fromNumber(chosenSign)));
    return "continue";
  }

  // find_minimal_abs_coeff: the first column with the smallest coefficient, its sign, and the
  // Markowitz number of the pivot.
  private findMinimalAbsCoeff(row: number) {
    let ahk = Rational.zero;
    let column = NO_VAR;
    let sign = 0;
    for (const cell of this.eMatrix.rows[row]) {
      const magnitude = cell.coeff.abs();
      if (column !== NO_VAR && magnitude.compare(ahk) >= 0) continue;
      ahk = magnitude;
      sign = cell.coeff.isPositive() ? 1 : -1;
      column = cell.column;
      if (ahk.equals(Rational.one)) break;
    }
    const markovich =
      (this.eMatrix.columns[column].length - 1) * (this.eMatrix.rows[row].length - 1);
    return { ahk, column, sign, markovich };
  }

  // normalize_e_by_gcd: the gcd of the coefficients after dividing the equation by it, or
  // undefined on the conflict of a gcd that does not divide the constant.
  private normalizeEByGcd(row: number) {
    const gcd = getGcdOfCoeffs(this.eMatrix.rows[row], true);
    if (gcd.isZero() || gcd.equals(Rational.one)) return gcd;
    const quotient = this.sumOfFixed[row].div(gcd);
    if (!quotient.isInt()) {
      this.setRewriteConflict(row, gcd);
      return undefined;
    }
    this.eMatrix.divideRow(row, gcd);
    this.sumOfFixed[row] = quotient;
    this.lMatrix.divideRow(row, gcd);
    return gcd;
  }

  // eliminate_var_in_f: substitutes the column solved by the row in the other equations of F.
  private eliminateVarInF(row: number, key: number, sign: number) {
    const constant = this.sumOfFixed[row];
    const column = this.eMatrix.columns[key];
    const pivotIndex = column.findIndex((cell) => cell.row === row);
    if (pivotIndex > 0) moveCellToFront(this.eMatrix, column, pivotIndex);
    const signValue = Rational.fromNumber(sign);
    for (let index = column.length; index-- > 0;) {
      const cell = column[index];
      if (this.rowToKey.has(cell.row)) continue;
      const coeff = this.eMatrix.getVal(cell);
      const target = cell.row;
      this.sumOfFixed[target] = this.sumOfFixed[target].sub(signValue.mul(coeff).mul(constant));
      this.eMatrix.pivotRowToRowGivenCellWithSign(row, cell, key, sign);
      this.lMatrix.addRows(signValue.neg().mul(coeff), row, target);
    }
  }

  private removeFromS(row: number) {
    const key = this.rowToKey.get(row);
    if (key === undefined) return;
    this.rowToKey.delete(row);
    this.keyToRow.delete(key);
  }

  private canSubstitute(column: number) {
    return this.keyToRow.has(column) || this.freshDefinitions.hasKey(column);
  }

  private isFresh(column: number) {
    return this.freshDefinitions.hasFresh(column);
  }

  private getCoeffInERow(row: number, column: number) {
    return this.eMatrix.rows[row].find((cell) => cell.column === column)?.coeff ?? Rational.zero;
  }

  private getSignInERow(row: number, column: number) {
    return this.getCoeffInERow(row, column).isPositive() ? 1 : -1;
  }

  private getRowMonomials(matrix: StaticMatrix, row: number): Monomial[] {
    return matrix.rows[row].map((cell) => ({ coeff: cell.coeff, column: cell.column }));
  }

  // Tightening the bounds of term columns.

  // tighten_terms_with_S: the terms whose bounds changed, the most shared first.
  private tightenTermsWithS(): DioMove {
    const solver = this.solver;
    const sortedTerms: number[] = [];
    const processedTerms: number[] = [];
    for (const column of this.termsToTighten.elems) {
      if (
        column >= solver.getColumnCount() ||
        !solver.hasTerm(column) ||
        solver.isFree(column) ||
        !solver.isInt(column)
      )
        processedTerms.push(column);
      else sortedTerms.push(column);
    }
    const weights = new Map(
      sortedTerms.map((column) => [column, this.getTermWeight(solver.getTerm(column))]),
    );
    sortedTerms.sort(
      (first, second) => (weights.get(second) ?? 0) - (weights.get(first) ?? 0) || first - second,
    );
    let move: DioMove = "undef";
    for (const column of sortedTerms) {
      if (this.isBigTermOrNoTerm(column)) {
        this.termsToTighten.delete(column);
        continue;
      }
      const tightened = this.tightenBoundsForTermColumn(column);
      this.termsToTighten.delete(column);
      move = joinMoves(tightened, move);
      if (move === "conflict") break;
    }
    for (const column of processedTerms) this.termsToTighten.delete(column);
    return move;
  }

  private getTermWeight(term: LarTerm) {
    let weight = 0;
    for (const entry of term.coeffs)
      weight = Math.max(weight, this.columnsToTerms.get(entry[0])?.size ?? 0);
    return weight;
  }

  private tightenBoundsForTermColumn(column: number): DioMove {
    const queue = new ProtectedQueue();
    if (!this.initSubstitutions(this.solver.getTerm(column), queue)) return "undef";
    if (this.subsWithSAndFresh(queue, column) === "conflict") return "conflict";
    this.processFixedInEspace();
    return this.tightenOnEspace(column);
  }

  // init_substitutions: m_espace is the term over local columns with its fixed part in m_c, and
  // m_lspace explains it. False on a big number.
  private initSubstitutions(term: LarTerm, queue: ProtectedQueue) {
    const solver = this.solver;
    const isIgnoringBigNums = solver.settings.isDioIgnoringBigNums;
    this.espace.clear();
    this.constant = Rational.zero;
    this.lspace.clear();
    this.lspace.add(Rational.one, term.column);
    for (const entry of term.coeffs) {
      const column = entry[0];
      const coeff = entry[1];
      if (solver.isFixed(column)) {
        const bound = solver.getLowerBound(column).x;
        if (isIgnoringBigNums && bound.isBig()) return false;
        this.constant = this.constant.add(coeff.mul(bound));
        continue;
      }
      const local = this.varRegister.getLocal(column);
      if (isIgnoringBigNums && coeff.isBig()) return false;
      this.espace.add(coeff, local);
      if (this.canSubstitute(local)) queue.push(local);
    }
    return true;
  }

  private subsWithSAndFresh(queue: ProtectedQueue, column: number) {
    let move: DioMove = "undef";
    while (!queue.isEmpty && move !== "conflict" && this.espace.size <= TIGHTEN_SIZE_MAX)
      move = joinMoves(this.subsFrontWithSAndFresh(queue, column), move);
    return move;
  }

  private subsFrontWithSAndFresh(queue: ProtectedQueue, column: number): DioMove {
    this.processFixedInEspace();
    const tightened = this.tightenOnEspace(column);
    if (tightened === "conflict") return "conflict";
    const key = this.findVarToSubstituteOnEspace(queue);
    if (key === NO_VAR) return "undef";
    const move = this.freshDefinitions.hasKey(key)
      ? this.subsByFresh(key, queue, column)
      : this.subsByS(key, queue, column);
    return joinMoves(move, tightened);
  }

  // find_var_to_substitute_on_espace: the queued column whose substitution adds the fewest new
  // columns, drawn at random among ties, and the queued columns no longer in m_espace dropped.
  private findVarToSubstituteOnEspace(queue: ProtectedQueue) {
    const espace = this.espace;
    let best = NO_VAR;
    let minNewVars = Number.MAX_SAFE_INTEGER;
    let numCandidates = 0;
    const toRemove: number[] = [];
    for (const column of queue.items) {
      if (!espace.has(column)) {
        toRemove.push(column);
        continue;
      }
      let newVars = 0;
      const solvedRow = this.keyToRow.get(column);
      if (solvedRow !== undefined) {
        for (const cell of this.eMatrix.rows[solvedRow])
          if (cell.column !== column && !espace.has(cell.column)) newVars++;
      } else if (this.freshDefinitions.hasKey(column))
        for (const entry of this.freshDefinitions.getByKey(column).term.coeffs)
          if (entry[0] !== column && !espace.has(entry[0])) newVars++;
      if (newVars < minNewVars) {
        minNewVars = newVars;
        best = column;
        numCandidates = 1;
      } else if (
        newVars === minNewVars &&
        this.solver.settings.getRandomNext() % ++numCandidates === 0
      )
        best = column;
    }
    if (best !== NO_VAR) queue.remove(best);
    for (const column of toRemove) queue.remove(column);
    return best;
  }

  // subs_qfront_by_fresh: replaces k by its fresh definition, which leaves m_lspace as it is.
  private subsByFresh(key: number, queue: ProtectedQueue, column: number) {
    const term = this.freshDefinitions.getByKey(key).term;
    const coeff = this.espace.get(key).neg();
    this.espace.erase(key);
    for (const entry of term.coeffs) {
      if (entry[0] === key) continue;
      this.espace.add(entry[1].mul(coeff), entry[0]);
      if (this.espace.has(entry[0]) && this.canSubstitute(entry[0])) queue.push(entry[0]);
    }
    return this.tightenOnEspace(column);
  }

  // subs_qfront_by_S: replaces k by the equation solved for it, and adds that equation's
  // explanation to m_lspace.
  private subsByS(key: number, queue: ProtectedQueue, column: number) {
    const row = this.keyToRow.get(key) ?? NO_VAR;
    const constant = this.sumOfFixed[row];
    let coeff = this.espace.get(key);
    this.espace.erase(key);
    const eRow = this.eMatrix.rows[row];
    if (this.getCoeffInERow(row, key).equals(Rational.one)) coeff = coeff.neg();
    for (const cell of eRow) {
      if (cell.column === key) continue;
      this.espace.add(cell.coeff.mul(coeff), cell.column);
      if (this.espace.has(cell.column) && this.canSubstitute(cell.column)) queue.push(cell.column);
    }
    this.constant = this.constant.add(coeff.mul(constant));
    for (const cell of this.lMatrix.rows[row]) this.lspace.add(coeff.mul(cell.coeff), cell.column);
    return this.tightenOnEspace(column);
  }

  private processFixedInEspace() {
    const solver = this.solver;
    const fixed: number[] = [];
    for (const monomial of this.espace.data)
      if (
        !this.isFresh(monomial.column) &&
        solver.isFixed(this.varRegister.getExternal(monomial.column))
      )
        fixed.push(monomial.column);
    for (const local of fixed) {
      const bound = solver.getLowerBound(this.varRegister.getExternal(local)).x;
      this.constant = this.constant.add(this.espace.get(local).mul(bound));
      this.espace.erase(local);
    }
  }

  // tighten_on_espace: with g the gcd of m_espace, the bounds of the term column move to the
  // nearest values congruent to m_c modulo g, and a constant m_espace is checked against them.
  private tightenOnEspace(column: number): DioMove {
    const gcd = getGcdOfCoeffs(this.espace.data, true);
    if (gcd.equals(Rational.one)) return "undef";
    if (gcd.isZero()) {
      this.handleConstantTerm(column);
      return this.infeasExplanation.isEmpty ? "undef" : "conflict";
    }
    if (this.tightenBoundsForNonTrivialGcd(gcd, column, true)) return "conflict";
    if (this.tightenBoundsForNonTrivialGcd(gcd, column, false)) return "conflict";
    return this.changedFixedColumns.has(column) ? "continue" : "undef";
  }

  private handleConstantTerm(column: number) {
    const solver = this.solver;
    const constant = this.constant;
    if (constant.isZero()) return;
    const upper = solver.getBound(column, true);
    const isAboveUpper =
      upper !== undefined &&
      (constant.compare(upper.value) > 0 || (upper.isStrict && constant.equals(upper.value)));
    const lower = isAboveUpper ? undefined : solver.getBound(column, false);
    const isBelowLower =
      lower !== undefined &&
      (constant.compare(lower.value) < 0 || (lower.isStrict && constant.equals(lower.value)));
    if (!isAboveUpper && !isBelowLower) return;
    const dep = mkJoin(
      mkJoin(
        this.explainFixed(getTermMonomials(solver.getTerm(column)), Rational.zero),
        this.explainFixedInMetaTerm(this.lspace.data, Rational.zero),
      ),
      this.getBoundWitnesses(column),
    );
    for (const constraint of linearize([dep])) this.infeasExplanation.push(constraint);
  }

  // tighten_bounds_for_non_trivial_gcd: whether tightening the bound found a conflict.
  private tightenBoundsForNonTrivialGcd(gcd: Rational, column: number, isUpper: boolean) {
    const bound = this.solver.getBound(column, isUpper);
    if (bound === undefined) return false;
    let remainder = getRemainder(bound.value.sub(this.constant), gcd);
    if (remainder.isNegative()) remainder = remainder.add(gcd);
    return (
      !remainder.isZero() && this.tightenBoundKind(gcd, column, bound.value, remainder, isUpper)
    );
  }

  // tighten_bound_kind: t = g*t' + m_c <= rs gives t <= rs - (rs - m_c) mod g, and a lower bound
  // likewise. The fixed columns whose coefficients g divides do not explain the new bound.
  private tightenBoundKind(
    gcd: Rational,
    column: number,
    rs: Rational,
    remainder: Rational,
    isUpper: boolean,
  ) {
    const solver = this.solver;
    const bound = isUpper ? rs.sub(remainder) : rs.add(gcd).sub(remainder);
    let dep = isUpper ? solver.getUpperWitness(column) : solver.getLowerWitness(column);
    const fixedPart = this.openFixedFromMl(this.lspace.data);
    if (solver.isFixed(column)) fixedPart.add(Rational.one, column);
    for (const monomial of fixedPart.data) {
      if (monomial.coeff.isInt() && getRemainder(monomial.coeff, gcd).isZero()) continue;
      dep = mkJoin(dep, this.getBoundWitnesses(monomial.column));
    }
    if (solver.settings.isCanceled()) return false;
    solver.updateColumnTypeAndBound(column, isUpper ? KIND_LE : KIND_GE, new Impq(bound), dep);
    const status = solver.findFeasibleSolution();
    if (status === LP_FEASIBLE || status === LP_OPTIMAL || status === LP_CANCELLED) return false;
    solver.getInfeasibilityExplanation(this.infeasExplanation);
    return true;
  }

  private getBoundWitnesses(column: number) {
    return mkJoin(this.solver.getLowerWitness(column), this.solver.getUpperWitness(column));
  }

  // open_fixed_from_ml: the fixed columns of a combination of term definitions.
  private openFixedFromMl(monomials: Iterable<Monomial>) {
    const solver = this.solver;
    const result = new TermWithIndex();
    for (const outer of monomials)
      for (const monomial of getExtendedMonomials(solver.getTerm(outer.column)))
        if (solver.isFixed(monomial.column))
          result.add(outer.coeff.mul(monomial.coeff), monomial.column);
    return result;
  }

  private explainFixedInMetaTerm(monomials: Iterable<Monomial>, gcd: Rational) {
    return this.explainFixed(this.openFixedFromMl(monomials).data, gcd);
  }

  // explain_fixed: the bounds of the fixed columns, but those whose coefficients a nonzero gcd
  // divides.
  private explainFixed(monomials: Iterable<Monomial>, gcd: Rational) {
    let dep: Dependency = null;
    for (const monomial of monomials) {
      if (!this.solver.isFixed(monomial.column)) continue;
      if (!gcd.isZero() && monomial.coeff.div(gcd).isInt()) continue;
      dep = mkJoin(dep, this.getBoundWitnesses(monomial.column));
    }
    return dep;
  }
}

const removeLastRow = (matrix: StaticMatrix) => {
  const lastRow = matrix.rows[matrix.getRowCount() - 1];
  for (let index = lastRow.length; index-- > 0;) matrix.removeElement(lastRow, lastRow[index]);
  matrix.rows.pop();
};

const popEmptyColumns = (matrix: StaticMatrix) => {
  while (matrix.getColumnCount() > 0 && matrix.columns[matrix.getColumnCount() - 1].length === 0)
    matrix.popColumn();
};

// Swaps the cell of the pivot row to the head of the column, as the pivots of Z3 do.
const moveCellToFront = (
  matrix: StaticMatrix,
  column: { row: number; offset: number }[],
  index: number,
) => {
  const first = column[0];
  column[0] = column[index];
  column[index] = first;
  matrix.rows[column[0].row][column[0].offset].offset = 0;
  matrix.rows[first.row][first.offset].offset = index;
};
