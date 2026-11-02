// Ported from Z3 (src/math/lp/hnf.h, src/math/lp/general_matrix.h,
// src/math/lp/permutation_matrix.h, and the extended gcd of src/util/mpz.cpp), MIT license, see
// z3-license.txt. The Hermite normal form of an integer matrix, computed modulo a multiple of the
// determinant of its rows, as the HNF cutter needs it.
import { Rational } from "../rational";

// rem of mpq: the remainder of the numerators, truncated toward zero.
const getRem = (first: Rational, second: Rational) => Rational.of(first.num % second.num);

// mpz_manager::gcd(r1, r2, a, b, g): the gcd g of r1 and r2, with a * r1 + b * r2 equal to it.
const getExtendedGcd = (first: Rational, second: Rational) => {
  let left = first.num < 0n ? -first.num : first.num;
  let right = second.num < 0n ? -second.num : second.num;
  let a = 1n;
  let b = 0n;
  let nextA = 0n;
  let nextB = 1n;
  if (left < right) {
    [left, right] = [right, left];
    [a, b] = [b, a];
    [nextA, nextB] = [nextB, nextA];
  }
  while (right > 0n) {
    const quotient = left / right;
    [left, right] = [right, left % right];
    [a, nextA] = [nextA, a - quotient * nextA];
    [b, nextB] = [nextB, b - quotient * nextB];
  }
  return {
    gcd: Rational.of(left),
    u: Rational.of(first.num < 0n ? -a : a),
    v: Rational.of(second.num < 0n ? -b : b),
  };
};

// extended_gcd_minimal_uv: the gcd d of a and b with a * u + b * v = d, where v is the smallest
// coefficient of its residue class with the sign of -b.
const getExtendedGcdMinimalUv = (a: Rational, b: Rational) => {
  if (a.isZero()) return { d: b, u: Rational.zero, v: Rational.one };
  if (b.isZero()) return { d: a, u: Rational.one, v: Rational.zero };
  const result = getExtendedGcd(a, b);
  let d = result.gcd;
  let u = result.u;
  let v = result.v;
  if (d.isNegative()) {
    d = d.neg();
    u = u.neg();
    v = v.neg();
  }
  if (d.equals(a)) return { d, u: Rational.one, v: Rational.zero };
  if (d.equals(a.neg())) return { d, u: Rational.minusOne, v: Rational.zero };
  const aOverD = a.abs().div(d);
  let k = Rational.of(v.num / aOverD.num);
  let r = Rational.of(v.num % aOverD.num);
  if (r.isNegative()) {
    r = r.add(aOverD);
    k = k.sub(Rational.one);
  }
  const bOverD = b.div(d);
  const shift = b.isPositive() ? k.add(Rational.one) : k;
  v = b.isPositive() ? r.sub(aOverD) : r;
  u = a.isPositive() ? u.add(shift.mul(bOverD)) : u.sub(shift.mul(bOverD));
  return { d, u, v };
};

// permutation_matrix: a permutation and its inverse.
class Permutation {
  constructor(
    readonly forward: number[],
    readonly reverse: number[],
  ) {}

  static identity(length: number) {
    const getIndex = (_: unknown, index: number) => index;
    return new Permutation(Array.from({ length }, getIndex), Array.from({ length }, getIndex));
  }

  copy() {
    return new Permutation([...this.forward], [...this.reverse]);
  }

  private setValue(index: number, value: number) {
    this.forward[index] = value;
    this.reverse[value] = index;
  }

  transposeFromLeft(first: number, second: number) {
    const firstIndex = this.reverse[first];
    const secondIndex = this.reverse[second];
    this.setValue(firstIndex, second);
    this.setValue(secondIndex, first);
  }

  transposeFromRight(first: number, second: number) {
    const firstValue = this.forward[first];
    const secondValue = this.forward[second];
    this.setValue(first, secondValue);
    this.setValue(second, firstValue);
  }
}

// general_matrix: dense rows behind a row and a column permutation.
export class GeneralMatrix {
  private rowPermutation: Permutation;
  private columnPermutation: Permutation;
  data: Rational[][];

  constructor(rowCount: number, columnCount: number) {
    this.rowPermutation = Permutation.identity(rowCount);
    this.columnPermutation = Permutation.identity(columnCount);
    this.data = Array.from({ length: rowCount }, () =>
      Array.from({ length: columnCount }, () => Rational.zero),
    );
  }

  copy() {
    const result = new GeneralMatrix(0, 0);
    result.rowPermutation = this.rowPermutation.copy();
    result.columnPermutation = this.columnPermutation.copy();
    result.data = this.data.map((row) => [...row]);
    return result;
  }

  getRowCount() {
    return this.data.length;
  }

  getColumnCount() {
    return this.data.length > 0 ? this.data[0].length : 0;
  }

  adjustRow(row: number) {
    return this.rowPermutation.forward[row];
  }

  get(row: number, column: number) {
    return this.data[this.adjustRow(row)][this.columnPermutation.reverse[column]];
  }

  set(row: number, column: number, value: Rational) {
    this.data[this.adjustRow(row)][this.columnPermutation.reverse[column]] = value;
  }

  transposeRows(first: number, second: number) {
    this.rowPermutation.transposeFromRight(first, second);
  }

  transposeColumns(first: number, second: number) {
    this.columnPermutation.transposeFromLeft(first, second);
  }

  // shrink_to_rank: only the given data rows, leaving the permutations as they are.
  shrinkToRank(basisRows: number[]) {
    if (basisRows.length === this.getRowCount()) return;
    this.data = basisRows.map((row) => this.data[row]);
  }
}

// prepare_pivot_for_lower_triangle: moves a nonzero entry of the lower right block to (r, r).
const preparePivot = (matrix: GeneralMatrix, r: number) => {
  for (let row = r; row < matrix.getRowCount(); row++)
    for (let column = r; column < matrix.getColumnCount(); column++) {
      if (matrix.get(row, column).isZero()) continue;
      if (row !== r) matrix.transposeRows(row, r);
      if (column !== r) matrix.transposeColumns(column, r);
      return true;
    }
  return false;
};

// pivot_column_non_fractional: a fraction-free elimination step under (r, r); false when an entry
// reaches the big number.
const pivotColumnNonFractional = (matrix: GeneralMatrix, r: number, bigNumber: Rational) => {
  const pivot = matrix.get(r, r);
  const denominator = r > 0 ? matrix.get(r - 1, r - 1) : undefined;
  for (let column = r + 1; column < matrix.getColumnCount(); column++) {
    const top = matrix.get(r, column);
    for (let row = r + 1; row < matrix.getRowCount(); row++) {
      let value = matrix.get(row, column).mul(pivot).sub(matrix.get(row, r).mul(top));
      if (denominator !== undefined) value = value.div(denominator);
      matrix.set(row, column, value);
      if (value.compare(bigNumber) >= 0) return false;
    }
  }
  return true;
};

// determinant_of_rectangular_matrix: the gcd of the last row of the triangulated matrix, a
// multiple of the gcd of its maximal minors, and the data rows of a basis; the big number when an
// entry grows too large.
export const getDeterminantOfRectangularMatrix = (
  matrix: GeneralMatrix,
  basisRows: number[],
  bigNumber: Rational,
) => {
  const triangle = matrix.copy();
  let rank = 0;
  for (; rank < triangle.getRowCount(); rank++) {
    if (!preparePivot(triangle, rank)) break;
    if (!pivotColumnNonFractional(triangle, rank, bigNumber)) return bigNumber;
  }
  if (rank === 0) return Rational.one;
  for (let row = 0; row < rank; row++) basisRows.push(triangle.adjustRow(row));
  const last = rank - 1;
  let gcd = Rational.zero;
  let column = last;
  for (; column < triangle.getColumnCount() && gcd.isZero(); column++) {
    const value = triangle.get(last, column);
    if (!value.isZero()) gcd = value.abs();
  }
  for (; column < triangle.getColumnCount(); column++) {
    const value = triangle.get(last, column);
    if (!value.isZero()) gcd = getExtendedGcd(gcd, value).gcd;
  }
  return gcd;
};

// hnf: W, the Hermite normal form of the rows of the matrix, computed modulo d. Undefined when
// canceled.
export const getHermiteNormalForm = (
  matrix: GeneralMatrix,
  d: Rational,
  isCanceled: () => boolean,
) => {
  const w = matrix.data.map((row) => [...row]);
  const rowCount = matrix.getRowCount();
  const columnCount = matrix.getColumnCount();
  if (rowCount === 0 || columnCount === 0 || d.isZero()) return w;
  const buffer: Rational[] = [];
  let r = d;
  let halfR = r.div(Rational.of(2n)).floor();
  const getModBalanced = (value: Rational) => {
    const rem = getRem(value, r);
    if (rem.compare(halfR) > 0) return rem.sub(r);
    return rem.compare(halfR.neg()) < 0 ? rem.add(r) : rem;
  };
  const getMod = (value: Rational) => {
    const rem = getRem(value, r);
    return rem.isNegative() ? rem.add(r) : rem;
  };
  for (let i = 0; i < rowCount; i++) {
    if (isCanceled()) return undefined;
    for (let j = i + 1; j < columnCount; j++) {
      const result = getExtendedGcdMinimalUv(w[i][i], w[i][j]);
      if (result.d.isZero()) continue;
      const iiOverD = getMod(w[i][i].div(result.d));
      const ijOverD = getMod(w[i][j].div(result.d));
      for (let k = i; k < rowCount; k++)
        buffer[k] = getModBalanced(
          getModBalanced(result.u.mul(w[k][i])).add(getModBalanced(result.v.mul(w[k][j]))),
        );
      w[i][j] = Rational.zero;
      for (let k = i + 1; k < rowCount; k++)
        w[k][j] = getModBalanced(
          getModBalanced(ijOverD.neg().mul(w[k][i])).add(getModBalanced(iiOverD.mul(w[k][j]))),
        );
      for (let k = i; k < rowCount; k++) w[k][i] = buffer[k];
    }
    let gcd = r;
    let u = Rational.one;
    if (w[i][i].isZero()) w[i][i] = r;
    else {
      const result = getExtendedGcdMinimalUv(w[i][i], r);
      gcd = result.d;
      u = result.u;
    }
    w[i][i] = getMod(w[i][i].mul(u));
    if (w[i][i].isZero()) w[i][i] = gcd;
    const diagonal = w[i][i];
    for (let k = i + 1; k < rowCount; k++) w[k][i] = getModBalanced(w[k][i].mul(u));
    for (let j = 0; j < i; j++) {
      const value = w[i][j];
      if (!value.isPositive() && value.neg().compare(diagonal) < 0) continue;
      const quotient = value.div(diagonal).ceil();
      for (let k = i; k < rowCount; k++) w[k][j] = w[k][j].sub(quotient.mul(w[k][i]));
    }
    r = r.div(w[i][i]);
    halfR = r.div(Rational.of(2n)).floor();
  }
  return w;
};
