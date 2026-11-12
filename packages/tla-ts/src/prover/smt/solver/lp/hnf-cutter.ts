// Ported from Z3 (src/math/lp/hnf_cutter.cpp, and get_equality_and_right_side_for_term_on_current_x in src/math/lp/lar_solver.cpp), MIT license, see z3-license.txt.
import { Rational } from "../rational";
import type { Dependency } from "./dependency";
import { GeneralMatrix, getDeterminantOfRectangularMatrix, getHermiteNormalForm } from "./hnf";
import type { IntSolver, LiaMove } from "./int-solver";
import type { LarTerm } from "./lar-term";

interface TightTerm {
  term: LarTerm;
  isUpper: boolean;
  rightSide: Rational;
  dep: Dependency;
}

const getTightTerm = (lia: IntSolver, term: LarTerm): TightTerm | undefined => {
  const solver = lia.solver;
  const column = term.column;
  if (!solver.isInt(column)) return undefined;
  let rightSide = Rational.zero;
  for (const entry of term.coeffs) {
    const value = solver.getValue(entry[0]);
    if (!value.y.isZero()) return undefined;
    rightSide = rightSide.add(value.x.mul(entry[1]));
  }
  const upperWitness = solver.getUpperWitness(column);
  const upper = solver.getUpperBound(column);
  if (upperWitness !== null && !upper.y.isNegative() && rightSide.equals(upper.x))
    return { term, isUpper: true, rightSide, dep: upperWitness };
  const lowerWitness = solver.getLowerWitness(column);
  const lower = solver.getLowerBound(column);
  if (lowerWitness !== null && !lower.y.isPositive() && rightSide.equals(lower.x))
    return { term, isUpper: false, rightSide: rightSide.neg(), dep: lowerWitness };
  return undefined;
};

const findCutRowIndex = (lia: IntSolver, values: Rational[]) => {
  let result = -1;
  let count = 0;
  for (let index = 0; index < values.length; index++) {
    if (values[index].isInt()) continue;
    if (count === 0) {
      count = 1;
      result = index;
    } else if (lia.solver.settings.getRandomNext() % ++count === 0) result = index;
  }
  return result;
};

export const makeHnfCut = (lia: IntSolver): LiaMove => {
  const solver = lia.solver;
  const settings = solver.settings;
  const tightTerms: TightTerm[] = [];
  const columns: number[] = [];
  const localColumns = new Map<number, number>();
  let absMax = Rational.zero;
  for (const term of solver.terms) {
    if (
      tightTerms.length >= settings.limitOnRowsForHnfCutter ||
      columns.length >= settings.limitOnColumnsForHnfCutter
    )
      continue;
    const tight = getTightTerm(lia, term);
    if (tight === undefined) continue;
    tightTerms.push(tight);
    for (const entry of term.coeffs) {
      if (!localColumns.has(entry[0])) {
        localColumns.set(entry[0], columns.length);
        columns.push(entry[0]);
      }
      const magnitude = entry[1].ceil().abs();
      if (magnitude.compare(absMax) > 0) absMax = magnitude;
    }
  }
  if (columns.every((column) => solver.getValue(column).isInt())) return { kind: "undef" };
  const matrix = new GeneralMatrix(tightTerms.length, columns.length);
  tightTerms.forEach((tight, row) => {
    const sign = tight.isUpper ? Rational.one : Rational.minusOne;
    for (const entry of tight.term.coeffs)
      matrix.data[row][localColumns.get(entry[0]) ?? 0] = sign.mul(entry[1]);
  });
  const basisRows: number[] = [];
  const bigNumber = absMax.mul(absMax).mul(absMax);
  const determinant = getDeterminantOfRectangularMatrix(matrix, basisRows, bigNumber);
  if (determinant.compare(bigNumber) >= 0 || settings.isCanceled()) return { kind: "undef" };
  const isFullRank = basisRows.length === tightTerms.length;
  matrix.shrinkToRank(basisRows);
  const deps = isFullRank
    ? tightTerms.map((tight) => tight.dep)
    : basisRows.map((row) => tightTerms[row].dep);
  const hermite = getHermiteNormalForm(matrix, determinant, settings.isCanceled);
  if (hermite === undefined) return { kind: "undef" };
  const rightSides = isFullRank
    ? tightTerms.map((tight) => tight.rightSide)
    : basisRows.map((row) => tightTerms[row].rightSide);
  for (let row = 0; row < hermite.length; row++) {
    for (let column = 0; column < row; column++)
      rightSides[row] = rightSides[row].sub(hermite[row][column].mul(rightSides[column]));
    rightSides[row] = rightSides[row].div(hermite[row][row]);
  }
  const cutRow = findCutRowIndex(lia, rightSides);
  if (cutRow === -1) return { kind: "undef" };
  const inverseRow = Array.from({ length: matrix.getColumnCount() }, () => Rational.zero);
  inverseRow[cutRow] = Rational.one.div(hermite[cutRow][cutRow]);
  for (let column = cutRow - 1; column >= 0; column--) {
    let sum = Rational.zero;
    for (let row = column + 1; row <= cutRow; row++)
      sum = sum.add(hermite[row][column].mul(inverseRow[row]));
    inverseRow[column] = sum.neg().div(hermite[column][column]);
  }
  for (let column = 0; column < matrix.getColumnCount(); column++) {
    let coeff = Rational.zero;
    for (let row = 0; row < matrix.getRowCount(); row++)
      coeff = coeff.add(inverseRow[row].mul(matrix.get(row, column)));
    if (!coeff.isZero()) lia.term.addMonomial(coeff, columns[column]);
  }
  lia.explanation.clear();
  for (const dep of deps) lia.explanation.pushDependency(dep);
  return { kind: "cut", offset: rightSides[cutRow].floor(), isUpper: true };
};
