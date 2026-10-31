// Ported from Z3 (src/math/lp/int_solver.cpp, src/math/lp/int_gcd_test.cpp,
// src/math/lp/int_branch.cpp), MIT license, see z3-license.txt. The integer check of the final
// check: the GCD test on rows, patching fractional basic columns through integer non-basic ones,
// the cube and largest cube tests, HNF cuts, the Diophantine solver, Gomory cuts, and a branch on a
// fractional basic column.
import { getGcd, getLcm, Rational } from "../rational";
import { COLUMN_BOXED, COLUMN_FIXED, COLUMN_FREE, COLUMN_LOWER, COLUMN_UPPER } from "./core-solver";
import { DiophantineSolver } from "./dioph-eq";
import { Explanation } from "./explanation";
import { getGomoryCuts } from "./gomory";
import { makeHnfCut } from "./hnf-cutter";
import { findCube, findLargestCube } from "./int-cube";
import type { LarSolver } from "./lar-solver";
import { LarTerm } from "./lar-term";
import { Impq } from "./numeric-pair";
import type { RowCell } from "./static-matrix";

export type LiaMove =
  | { kind: "sat" }
  | { kind: "undef" }
  | { kind: "conflict" }
  | { kind: "continue" }
  | { kind: "cut"; offset: Rational; isUpper: boolean }
  | { kind: "branch"; isUpper: boolean; offset: Rational };

const getFractionalPart = (value: Rational) => value.sub(value.floor());

// gcd(a, b, u, v): the gcd of a and b, with a * u + b * v equal to it.
const getExtendedGcd = (first: bigint, second: bigint) => {
  let previous = [first, 1n, 0n];
  let current = [second, 0n, 1n];
  while (current[0] !== 0n) {
    const quotient = previous[0] / current[0];
    const next = [
      previous[0] - quotient * current[0],
      previous[1] - quotient * current[1],
      previous[2] - quotient * current[2],
    ];
    previous = current;
    current = next;
  }
  return previous[0] < 0n ? previous.map((value) => -value) : previous;
};

// get_patching_deltas: the moves of a column with coefficient alpha that make x integral.
const getPatchingDeltas = (x: Rational, alpha: Rational) => {
  if (alpha.den % x.den !== 0n) return undefined;
  const scale = alpha.den / x.den;
  const coeff = getExtendedGcd(alpha.num, x.den)[1];
  const product = coeff * scale * x.num;
  const remainder = ((product % alpha.den) + alpha.den) % alpha.den;
  const plus = Rational.of(remainder);
  return { plus, minus: plus.sub(Rational.of(alpha.den)) };
};

interface Parity {
  offset: bigint;
  modulus: bigint;
  row: RowCell[];
}

export class IntSolver {
  private numberOfCalls = 0;
  // m_parities and m_inserted_vars of the GCD test, for one test.
  private parities = new Map<number, Parity[]>();
  private parityColumns: number[] = [];
  private lcubePeriod: number;
  readonly explanation = new Explanation();
  // m_t: the term of a branch or a cut, kept across calls as Z3 keeps its table.
  readonly term = new LarTerm();

  private dio: DiophantineSolver;
  private initialDioCallsPeriod: number;
  // m_dio_undef_in_a_row: the Diophantine solver's calls in a row that found nothing.
  private dioUndefInARow = 0;

  constructor(readonly solver: LarSolver) {
    this.lcubePeriod = solver.settings.intFindCubePeriod;
    this.initialDioCallsPeriod = solver.settings.dioCallsPeriod;
    this.dio = new DiophantineSolver(this);
  }

  isColumnIntInf(column: number) {
    return this.solver.isInt(column) && !this.solver.getValue(column).isInt();
  }

  atBound(column: number) {
    const core = this.solver.core;
    const value = core.x[column];
    switch (core.getColumnType(column)) {
      case COLUMN_FIXED:
      case COLUMN_BOXED:
        return core.lowerBounds[column].equals(value) || core.upperBounds[column].equals(value);
      case COLUMN_LOWER:
        return core.lowerBounds[column].equals(value);
      case COLUMN_UPPER:
        return core.upperBounds[column].equals(value);
      default:
        return false;
    }
  }

  atLower(column: number) {
    const core = this.solver.core;
    const type = core.getColumnType(column);
    const hasLower = type === COLUMN_FIXED || type === COLUMN_BOXED || type === COLUMN_LOWER;
    return hasLower && core.lowerBounds[column].equals(core.x[column]);
  }

  atUpper(column: number) {
    const core = this.solver.core;
    const type = core.getColumnType(column);
    const hasUpper = type === COLUMN_FIXED || type === COLUMN_BOXED || type === COLUMN_UPPER;
    return hasUpper && core.upperBounds[column].equals(core.x[column]);
  }

  private hitPeriod(period: number) {
    return period <= 1 || this.solver.settings.getRandomNext(period) === 0;
  }

  check(): LiaMove {
    const solver = this.solver;
    if (!solver.hasInfInt()) return { kind: "sat" };
    this.term.clear();
    this.explanation.clear();
    // lp.dio_run_gcd is off, so the GCD test runs only when the Diophantine solver ignores terms.
    const move: LiaMove = this.dio.hasIgnoredTerms ? this.gcdTest() : { kind: "undef" };
    const core = solver.core;
    const savedTouchedRows = core.touchedRows;
    core.touchedRows = null;
    const result = this.checkAfterGcd(move);
    core.touchedRows = savedTouchedRows;
    return result;
  }

  private checkAfterGcd(gcdMove: LiaMove): LiaMove {
    const settings = this.solver.settings;
    if (settings.isCanceled()) return { kind: "undef" };
    this.numberOfCalls++;
    const move = gcdMove.kind === "undef" ? this.getMoveAfterGcd() : gcdMove;
    return settings.isCanceled() ? { kind: "undef" } : move;
  }

  private getMoveAfterGcd(): LiaMove {
    const solver = this.solver;
    const settings = solver.settings;
    if (this.patchBasicColumns()) return { kind: "sat" };
    if (this.hitPeriod(settings.intFindCubePeriod) && findCube(solver)) return { kind: "sat" };
    if (this.hitPeriod(this.lcubePeriod) && this.findLcube()) return { kind: "sat" };
    solver.moveNonBasicColumnsToBounds();
    if (this.hitPeriod(settings.hnfCutPeriod)) {
      const move = makeHnfCut(this);
      if (move.kind !== "undef") return move;
    }
    if (this.shouldSolveDiophantineEquations()) {
      const move = this.solveDiophantineEquations();
      if (move.kind !== "undef") return move;
    }
    const isGomoryAllowed = settings.isRunningGomoryWithDio || this.dio.hasIgnoredTerms;
    if (isGomoryAllowed && this.hitPeriod(settings.intGomoryCutPeriod)) {
      const move = getGomoryCuts(this, 2);
      if (move.kind !== "undef") return move;
    }
    return this.branch();
  }

  // find_lcube: the period doubles while the largest cube finds nothing, and resets when it finds a
  // solution.
  private findLcube() {
    const isSat = findLargestCube(this.solver);
    if (isSat) this.lcubePeriod = this.solver.settings.intFindCubePeriod;
    else if (this.lcubePeriod < 1 << 30) this.lcubePeriod *= 2;
    return isSat;
  }

  // should_solve_dioph_eq: a draw with the current period, which relaxes toward the initial one
  // when it misses.
  private shouldSolveDiophantineEquations() {
    const settings = this.solver.settings;
    const isHit = this.hitPeriod(settings.dioCallsPeriod);
    if (!isHit && settings.dioCallsPeriod > this.initialDioCallsPeriod) {
      const decrease = settings.dioCallsPeriodDecrease;
      settings.dioCallsPeriod =
        settings.dioCallsPeriod > this.initialDioCallsPeriod + decrease
          ? settings.dioCallsPeriod - decrease
          : this.initialDioCallsPeriod;
    }
    return isHit;
  }

  // solve_dioph_eq: a conflict resets the period and stops Gomory cuts, and nothing found doubles
  // the period and starts Gomory cuts after enough failures in a row. Z3 also sets the GCD test's
  // flag, which it does not read while the Diophantine solver is on.
  private solveDiophantineEquations(): LiaMove {
    const settings = this.solver.settings;
    if (this.dio.check() === "conflict") {
      this.dio.explain(this.explanation);
      settings.dioCallsPeriod = this.initialDioCallsPeriod;
      this.dioUndefInARow = 0;
      settings.isRunningGomoryWithDio = false;
      return { kind: "conflict" };
    }
    settings.dioCallsPeriod *= 2;
    this.dioUndefInARow++;
    if (this.dioUndefInARow >= settings.dioGomoryEnablePeriod)
      settings.isRunningGomoryWithDio = true;
    return { kind: "undef" };
  }

  // GCD test.

  private gcdTest(): LiaMove {
    const solver = this.solver;
    solver.settings.stats.gcdCalls++;
    if (this.isGcdTestFeasible()) return { kind: "undef" };
    solver.settings.stats.gcdConflicts++;
    return { kind: "conflict" };
  }

  // gcd_test: the rows of fractional basic columns, then the other rows of the columns whose
  // parity a row fixed.
  private isGcdTestFeasible() {
    const solver = this.solver;
    this.parities.clear();
    this.parityColumns = [];
    const visited = new Set<number>();
    for (let rowIndex = 0; rowIndex < solver.getRowCount(); rowIndex++) {
      const basic = solver.core.basis[rowIndex];
      if (!solver.isInt(basic) || solver.getValue(basic).isInt()) continue;
      if (!this.gcdTestForRow(rowIndex)) return false;
      visited.add(rowIndex);
    }
    for (let index = this.parityColumns.length; index-- > 0;)
      for (const cell of solver.core.matrix.columns[this.parityColumns[index]]) {
        if (visited.has(cell.row)) continue;
        visited.add(cell.row);
        if (!this.gcdTestForRow(cell.row)) return false;
      }
    return true;
  }

  private gcdTestForRow(rowIndex: number) {
    const solver = this.solver;
    const basic = solver.core.basis[rowIndex];
    if (!solver.isInt(basic)) return true;
    const row = solver.getRow(rowIndex);
    let lcmDen = 1n;
    for (const cell of row) lcmDen = getLcm(lcmDen, cell.coeff.den);
    const lcm = Rational.of(lcmDen);
    let consts = Rational.zero;
    let gcds = Rational.zero;
    let leastCoeff = Rational.zero;
    let isLeastCoeffBounded = false;
    let isLeastCoeffUnique = false;
    let leastCoeffColumn = 0;
    for (const cell of row) {
      const column = cell.column;
      const scaled = lcm.mul(cell.coeff);
      if (solver.isFixed(column)) {
        consts = consts.add(scaled.mul(solver.getLowerBound(column).x));
        continue;
      }
      if (!solver.isInt(column)) return true;
      const magnitude = scaled.abs();
      const isBounded = this.isBounded(column);
      if (gcds.isZero()) {
        gcds = magnitude;
        leastCoeff = magnitude;
        isLeastCoeffBounded = isBounded;
        isLeastCoeffUnique = true;
        leastCoeffColumn = column;
        continue;
      }
      gcds = Rational.of(getGcd(gcds.num, magnitude.num));
      const comparison = magnitude.compare(leastCoeff);
      if (comparison < 0) {
        leastCoeff = magnitude;
        isLeastCoeffBounded = isBounded;
        isLeastCoeffUnique = true;
        leastCoeffColumn = column;
      } else if (comparison === 0) {
        isLeastCoeffBounded = isLeastCoeffBounded && isBounded;
        isLeastCoeffUnique = false;
      }
    }
    if (gcds.isZero()) return true;
    if (!consts.div(gcds).isInt()) {
      this.fillExplanationFromFixedColumns(row);
      return false;
    }
    if (
      isLeastCoeffBounded &&
      !leastCoeff.equals(Rational.one) &&
      !solver.getValue(basic).isInt() &&
      !this.extGcdTest(row, lcm, consts, leastCoeff)
    )
      return false;
    if (!isLeastCoeffUnique) return true;
    return this.accumulateParity(row, leastCoeffColumn, lcm, consts, leastCoeff);
  }

  // accumulate_parity: the row fixes the residue of its unique least column modulo the gcd of the
  // others, and two rows that fix different residues for the same modulus conflict.
  private accumulateParity(
    row: RowCell[],
    leastColumn: number,
    lcm: Rational,
    consts: Rational,
    leastCoeff: Rational,
  ) {
    const solver = this.solver;
    let modulus = 0n;
    let isLeastNegative = false;
    for (const cell of row) {
      if (cell.column === leastColumn) isLeastNegative = cell.coeff.isNegative();
      else if (!solver.isFixed(cell.column)) {
        const magnitude = lcm.mul(cell.coeff).abs().num;
        if (getGcd(leastCoeff.num, magnitude) !== leastCoeff.num) return true;
        modulus = modulus === 0n ? magnitude : getGcd(modulus, magnitude);
        if (modulus === 1n) return true;
      }
    }
    modulus /= leastCoeff.num;
    if (modulus === 0n) return true;
    const quotient = consts.div(leastCoeff);
    if (!quotient.isInt()) return true;
    let offset = ((quotient.num % modulus) + modulus) % modulus;
    if (!isLeastNegative && offset !== 0n) offset = modulus - offset;
    return this.insertParity(leastColumn, row, offset, modulus);
  }

  private insertParity(column: number, row: RowCell[], offset: bigint, modulus: bigint) {
    const parities = this.parities.get(column) ?? [];
    for (const parity of parities) {
      if (parity.modulus !== modulus) continue;
      if (parity.offset === offset) return true;
      this.fillExplanationFromFixedColumns(row);
      this.fillExplanationFromFixedColumns(parity.row);
      return false;
    }
    this.parityColumns.push(column);
    parities.push({ offset, modulus, row });
    this.parities.set(column, parities);
    return true;
  }

  private isBounded(column: number) {
    const type = this.solver.core.getColumnType(column);
    return type === COLUMN_BOXED || type === COLUMN_FIXED;
  }

  private extGcdTest(row: RowCell[], lcm: Rational, consts: Rational, leastCoeff: Rational) {
    const solver = this.solver;
    let gcds = Rational.zero;
    let lower = consts;
    let upper = consts;
    const boxed: number[] = [];
    for (const cell of row) {
      const column = cell.column;
      if (solver.isFixed(column)) continue;
      const scaled = lcm.mul(cell.coeff);
      const magnitude = scaled.abs();
      if (magnitude.equals(leastCoeff)) {
        const low = solver.getLowerBound(column).x;
        const high = solver.getUpperBound(column).x;
        lower = lower.add(scaled.mul(scaled.isPositive() ? low : high));
        upper = upper.add(scaled.mul(scaled.isPositive() ? high : low));
        boxed.push(column);
      } else gcds = gcds.isZero() ? magnitude : Rational.of(getGcd(gcds.num, magnitude.num));
    }
    if (gcds.isZero()) return true;
    if (upper.div(gcds).floor().compare(lower.div(gcds).ceil()) >= 0) return true;
    for (const column of boxed) this.addBoundWitnesses(column);
    this.fillExplanationFromFixedColumns(row);
    return false;
  }

  private addBoundWitnesses(column: number) {
    this.explanation.pushDependency(this.solver.getBoundWitnesses(column));
  }

  private fillExplanationFromFixedColumns(row: RowCell[]) {
    for (const cell of row)
      if (this.solver.isFixed(cell.column)) this.addBoundWitnesses(cell.column);
  }

  // Patching.

  private patchBasicColumns() {
    const solver = this.solver;
    solver.settings.stats.patches++;
    solver.removeFixedVarsFromBase();
    for (const column of solver.core.basis)
      if (!solver.getModelValue(column).isInt() && solver.isInt(column) && !solver.isFixed(column))
        this.patchBasicColumn(column);
    if (solver.hasInfInt()) return false;
    solver.settings.stats.patchesSuccess++;
    return true;
  }

  private patchBasicColumn(basic: number) {
    const solver = this.solver;
    for (const cell of solver.getRow(solver.core.heading[basic])) {
      if (cell.column === basic || !solver.isInt(cell.column) || cell.coeff.isInt()) continue;
      const deltas = getPatchingDeltas(
        getFractionalPart(solver.getModelValue(basic)),
        getFractionalPart(cell.coeff),
      );
      if (deltas === undefined) continue;
      const isPlusFirst = solver.settings.getRandomNext() % 2 !== 0;
      const first = isPlusFirst ? deltas.plus : deltas.minus;
      const second = isPlusFirst ? deltas.minus : deltas.plus;
      if (this.tryPatchColumn(cell.column, first) || this.tryPatchColumn(cell.column, second))
        return;
    }
  }

  private tryPatchColumn(column: number, delta: Rational) {
    const solver = this.solver;
    const core = solver.core;
    const value = solver.getValue(column).add(new Impq(delta));
    if (delta.isNegative()) {
      if (core.hasLowerBound(column) && value.compare(solver.getLowerBound(column)) < 0)
        return false;
    } else if (core.hasUpperBound(column) && value.compare(solver.getUpperBound(column)) > 0)
      return false;
    for (const cell of core.matrix.columns[column]) {
      const basic = core.basis[cell.row];
      const oldValue = solver.getValue(basic);
      const newValue = new Impq(oldValue.x.sub(core.matrix.getVal(cell).mul(delta)), oldValue.y);
      if (core.hasLowerBound(basic) && newValue.compare(solver.getLowerBound(basic)) < 0)
        return false;
      if (core.hasUpperBound(basic) && newValue.compare(solver.getUpperBound(basic)) > 0)
        return false;
      if (oldValue.isInt() && !newValue.isInt()) return false;
    }
    solver.setValueForNbasicColumn(column, value);
    return true;
  }

  // Branching.

  private branch(): LiaMove {
    const solver = this.solver;
    solver.moveNonBasicColumnsToBounds();
    const column = this.findInfIntBaseColumn();
    if (column === -1) return { kind: "sat" };
    const settings = solver.settings;
    solver.settings.stats.branches++;
    this.term.clear();
    this.term.addMonomial(Rational.one, column);
    const isUpper = settings.getRandomNext() % 2 !== 0;
    const value = solver.getValue(column);
    const isFree = solver.core.getColumnType(column) === COLUMN_FREE;
    const offset = isFree ? Rational.zero : isUpper ? value.floor() : value.ceil();
    return { kind: "branch", isUpper, offset };
  }

  private findInfIntBaseColumn() {
    const solver = this.solver;
    const settings = solver.settings;
    const core = solver.core;
    const smallValue = Rational.of(1024n);
    let smallBox = -1;
    let smallValueColumn = -1;
    let anyValue = -1;
    let numSmallBox = 1;
    let numSmallValue = 1;
    let numAnyValue = 1;
    let range = Rational.zero;
    let minAnyValue = Rational.zero;
    let previousUsage = 0;
    for (const column of core.basis) {
      if (!this.isColumnIntInf(column)) continue;
      if (settings.isCanceled()) return -1;
      const usage = solver.getUsageInTerms(column);
      if (core.getColumnType(column) === COLUMN_BOXED) {
        const newRange = solver
          .getUpperBound(column)
          .x.sub(solver.getLowerBound(column).x)
          .sub(Rational.of(BigInt(2 * usage)));
        if (newRange.compare(smallValue) <= 0) {
          const isImproved = smallBox === -1 || newRange.compare(range) <= 0;
          if (isImproved) range = newRange;
          if (smallBox === -1) smallBox = column;
          else if (isImproved && settings.getRandomNext() % ++numSmallBox === 0) smallBox = column;
          continue;
        }
      }
      const value = solver.getValue(column);
      if (
        value.x.abs().compare(smallValue) < 0 ||
        (core.hasUpperBound(column) &&
          smallValue.compare(solver.getUpperBound(column).x.sub(value.x)) > 0) ||
        (core.hasLowerBound(column) &&
          smallValue.compare(value.x.sub(solver.getLowerBound(column).x)) > 0)
      ) {
        if (smallValueColumn === -1) smallValueColumn = column;
        else if (settings.getRandomNext() % ++numSmallValue === 0) smallValueColumn = column;
        continue;
      }
      const magnitude = value.x.abs();
      if (anyValue === -1 || magnitude.compare(minAnyValue) < 0) {
        anyValue = column;
        minAnyValue = magnitude;
        numAnyValue = 1;
        previousUsage = usage;
      } else if (magnitude.equals(minAnyValue)) {
        if (usage >= previousUsage && settings.getRandomNext() % ++numAnyValue === 0)
          anyValue = column;
        if (usage > previousUsage) previousUsage = usage;
      }
    }
    if (smallBox !== -1 && settings.getRandomNext() % 3 !== 0) return smallBox;
    if (smallValueColumn !== -1 && settings.getRandomNext() % 3 !== 0) return smallValueColumn;
    if (anyValue !== -1) return anyValue;
    return smallBox !== -1 ? smallBox : smallValueColumn;
  }
}
