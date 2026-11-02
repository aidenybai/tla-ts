// Ported from Z3 (src/math/lp/gomory.cpp), MIT license, see z3-license.txt. Gomory cuts: from the
// row of a fractional basic column whose non-basic columns sit at bounds, the inequality that every
// integer solution meets and the current solution violates.
import { Rational } from "../rational";
import { KIND_GE, KIND_LE } from "./constraints";
import { LP_CANCELLED } from "./core-solver";
import { type Dependency, mkJoin, mkLeaf } from "./dependency";
import type { IntSolver, LiaMove } from "./int-solver";
import { Impq } from "./numeric-pair";
import type { RowCell } from "./static-matrix";

const POLARITY_UNDEF = 0;
const POLARITY_MIN = 1;
const POLARITY_MAX = 2;
const POLARITY_MIXED = 3;

const HALF = Rational.of(1n, 2n);

const getFractionalPart = (value: Rational) => value.sub(value.floor());

interface Cut {
  coeffs: [number, Rational][];
  offset: Rational;
  dep: Dependency;
}

// create_cut: the cut of one row, in the term and the offset of the integer solver.
class CutBuilder {
  polarity = POLARITY_UNDEF;
  offset = Rational.one;
  dep: Dependency = null;
  private f: Rational;
  private oneMinusF: Rational;
  private bigNumber = Rational.zero;
  private isBigFound = false;

  constructor(
    private lia: IntSolver,
    private infColumn: number,
    private row: RowCell[],
  ) {
    this.f = getFractionalPart(lia.solver.getValue(infColumn).x);
    this.oneMinusF = Rational.one.sub(this.f);
  }

  private setPolarity(polarity: number) {
    if (this.polarity === POLARITY_MIXED) return;
    if (this.polarity === POLARITY_UNDEF) this.polarity = polarity;
    else if (this.polarity !== polarity) this.polarity = POLARITY_MIXED;
  }

  private setPolarityForInt(coeff: Rational, column: number) {
    const isLower = this.lia.atLower(column);
    const isUpper = !isLower && this.lia.atUpper(column);
    const towardMax = coeff.isPositive() ? isLower : isUpper;
    const towardMin = coeff.isPositive() ? isUpper : isLower;
    this.setPolarity(towardMax ? POLARITY_MAX : towardMin ? POLARITY_MIN : POLARITY_MIXED);
  }

  private addMonomial(newA: Rational, column: number) {
    this.lia.term.addMonomial(newA, column);
    if (Rational.of(newA.num).compare(this.bigNumber) > 0) this.isBigFound = true;
  }

  // int_case_in_gomory_cut, with fj the fractional part of the negated coefficient.
  private addIntCase(column: number, fj: Rational) {
    const solver = this.lia.solver;
    const oneMinusFj = Rational.one.sub(fj);
    if (this.lia.atLower(column)) {
      const newA =
        fj.compare(this.oneMinusF) <= 0 ? fj.div(this.oneMinusF) : oneMinusFj.div(this.f);
      this.offset = this.offset.add(newA.mul(solver.getLowerBound(column).x));
      this.lia.explanation.pushDependency(solver.getLowerWitness(column));
      this.addMonomial(newA, column);
      return;
    }
    const newA = (fj.compare(this.f) <= 0 ? fj.div(this.f) : oneMinusFj.div(this.oneMinusF)).neg();
    this.offset = this.offset.add(newA.mul(solver.getUpperBound(column).x));
    this.lia.explanation.pushDependency(solver.getUpperWitness(column));
    this.addMonomial(newA, column);
  }

  // real_case_in_gomory_cut, with a the negated coefficient.
  private addRealCase(a: Rational, column: number) {
    const solver = this.lia.solver;
    const isLower = this.lia.atLower(column);
    const isGrowing = a.isPositive() === isLower;
    const newA = isGrowing ? a.div(this.oneMinusF) : a.neg().div(this.f);
    this.setPolarity(isGrowing ? POLARITY_MIN : POLARITY_MAX);
    const bound = isLower ? solver.getLowerBound(column) : solver.getUpperBound(column);
    this.offset = this.offset.add(newA.mul(bound.x));
    this.lia.explanation.pushDependency(
      isLower ? solver.getLowerWitness(column) : solver.getUpperWitness(column),
    );
    this.addMonomial(newA, column);
  }

  cut(): LiaMove["kind"] | "cut" {
    const lia = this.lia;
    const solver = lia.solver;
    lia.term.clear();
    lia.explanation.clear();
    let absMax = Rational.zero;
    for (const cell of this.row) {
      const value = cell.coeff.ceil().abs();
      if (value.compare(absMax) > 0) absMax = value;
    }
    this.bigNumber = absMax.mul(absMax);
    for (const cell of this.row) {
      const column = cell.column;
      if (column === this.infColumn) continue;
      if (solver.isFixed(column)) {
        this.lia.explanation.pushDependency(solver.getLowerWitness(column));
        this.lia.explanation.pushDependency(solver.getUpperWitness(column));
        continue;
      }
      if (!solver.isInt(column)) this.addRealCase(cell.coeff.neg(), column);
      else {
        if (!cell.coeff.isInt()) this.addIntCase(column, getFractionalPart(cell.coeff.neg()));
        if (this.polarity !== POLARITY_MIXED) this.setPolarityForInt(cell.coeff, column);
      }
      if (this.isBigFound) return "undef";
    }
    if (lia.term.size === 0) return "conflict";
    for (const constraint of lia.explanation) this.dep = mkJoin(mkLeaf(constraint), this.dep);
    return "cut";
  }
}

// get_gomory_score: the distance of the value of the column to the nearest integer.
const getGomoryScore = (lia: IntSolver, column: number) => {
  const value = lia.solver.getValue(column).x;
  const fraction = getFractionalPart(value);
  return fraction.compare(HALF) <= 0 ? fraction : Rational.one.sub(fraction);
};

// is_gomory_cut_target: every other column of the row is integral with an integral coefficient,
// or sits at a bound without an infinitesimal.
const isGomoryCutTarget = (lia: IntSolver, column: number) => {
  const solver = lia.solver;
  for (const cell of solver.getRow(solver.core.heading[column])) {
    if (cell.column === column) continue;
    const value = solver.getValue(cell.column);
    if (cell.coeff.isInt() && solver.isInt(cell.column) && value.isInt()) continue;
    if (!lia.atBound(cell.column) || !value.y.isZero()) return false;
  }
  return true;
};

// gomory_select_int_infeasible_vars: up to the given number of target columns, drawn with a bias
// toward the values closest to integers.
const selectColumns = (lia: IntSolver, cutCount: number) => {
  const solver = lia.solver;
  const scores = new Map<number, Rational>();
  const sorted: number[] = [];
  for (const column of solver.core.basis) {
    if (!lia.isColumnIntInf(column) || !isGomoryCutTarget(lia, column)) continue;
    sorted.push(column);
    scores.set(column, getGomoryScore(lia, column));
  }
  sorted.sort((first, second) => {
    const byScore = (scores.get(first) ?? Rational.zero).compare(
      scores.get(second) ?? Rational.zero,
    );
    if (byScore !== 0) return byScore;
    return solver.getUsageInTerms(second) - solver.getUsageInTerms(first);
  });
  const selected: number[] = [];
  for (let remaining = cutCount; remaining > 0 && sorted.length > 0; remaining--) {
    const count = sorted.length;
    const ratio = (solver.settings.getRandomNext() % count) / count;
    const index = Math.floor(ratio * ratio * ratio * count);
    selected.push(sorted[index]);
    sorted.splice(index, 1);
  }
  return selected;
};

// add_deps: the bounds of the integer columns with integral coefficients, which the cut leaves
// out of its explanation.
const addDeps = (lia: IntSolver, dep: Dependency, row: RowCell[], basic: number) => {
  const solver = lia.solver;
  let result = dep;
  for (const cell of row) {
    const column = cell.column;
    if (column === basic || solver.isFixed(column) || !solver.isInt(column)) continue;
    if (!cell.coeff.isInt()) continue;
    const witness = lia.atLower(column)
      ? solver.getLowerWitness(column)
      : solver.getUpperWitness(column);
    result = mkJoin(witness, result);
  }
  return result;
};

// get_gomory_cuts: cuts for the selected rows. Cuts with big coefficients stay out unless the
// small ones alone leave the problem feasible.
export const getGomoryCuts = (lia: IntSolver, cutCount: number): LiaMove => {
  const solver = lia.solver;
  const bigCuts: Cut[] = [];
  let hasSmallCut = false;
  const addCut = (cut: Cut) => {
    const column = solver.addTerm(cut.coeffs, -1);
    solver.updateColumnTypeAndBound(column, KIND_GE, new Impq(cut.offset), cut.dep);
  };
  const isFeasible = () => {
    solver.findFeasibleSolution();
    if (solver.isFeasible() || solver.settings.isCanceled()) return true;
    solver.getInfeasibilityExplanation(lia.explanation);
    return false;
  };
  for (const column of selectColumns(lia, cutCount)) {
    const row = solver.getRow(solver.core.heading[column]);
    const builder = new CutBuilder(lia, column, row);
    const result = builder.cut();
    if (result === "conflict") return { kind: "conflict" };
    if (result !== "cut") continue;
    const value = solver.getValue(column).x;
    if (builder.polarity === POLARITY_MAX)
      solver.updateColumnTypeAndBound(
        column,
        KIND_LE,
        new Impq(value.floor()),
        addDeps(lia, builder.dep, row, column),
      );
    else if (builder.polarity === POLARITY_MIN)
      solver.updateColumnTypeAndBound(
        column,
        KIND_GE,
        new Impq(value.ceil()),
        addDeps(lia, builder.dep, row, column),
      );
    const cut = { coeffs: [...lia.term.coeffs], offset: builder.offset, dep: builder.dep };
    if (cut.coeffs.some((entry) => entry[1].isBig())) {
      bigCuts.push(cut);
      continue;
    }
    hasSmallCut = true;
    addCut(cut);
    if (solver.settings.isCanceled()) return { kind: "undef" };
  }
  if (bigCuts.length > 0) {
    solver.push();
    for (const cut of bigCuts) addCut(cut);
    const isBigFeasible = isFeasible();
    solver.pop(1);
    if (!isBigFeasible) for (const cut of bigCuts) addCut(cut);
  }
  if (!isFeasible()) return { kind: "conflict" };
  if (solver.status === LP_CANCELLED) return { kind: "undef" };
  if (!solver.hasInfInt()) return { kind: "sat" };
  if (hasSmallCut || bigCuts.length > 0) return { kind: "continue" };
  solver.moveNonBasicColumnsToBounds();
  return { kind: "undef" };
};
