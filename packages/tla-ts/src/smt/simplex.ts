// Ported from Z3 (src/math/lp/lar_solver.cpp, src/math/lp/lp_primal_core_solver.h), MIT license,
// see z3-license.txt. The bounded simplex of Dutertre and de Moura that Z3's lar_solver
// implements: a tableau of basic variables over non-basic ones, values that always satisfy the
// rows, and Bland's rule to repair bound violations. Bounds are undone on backtracking, the
// tableau and the values are kept.
import { Rational } from "./rational";

// Why a bound holds: true literals and equal pairs of terms.
export interface BoundReason {
  literals: number[];
}

export interface SimplexConflict {
  reasons: BoundReason[];
}

interface Row {
  basic: number;
  coeffs: Map<number, Rational>;
}

export class Simplex {
  values: Rational[] = [];
  lowers: (Rational | null)[] = [];
  uppers: (Rational | null)[] = [];
  lowerReasons: (BoundReason | null)[] = [];
  upperReasons: (BoundReason | null)[] = [];
  private basicRows: number[] = [];
  rows: Row[] = [];
  private columns: Set<number>[] = [];

  constructor(private pushTrail: (undo: () => void) => void) {}

  getNumVars() {
    return this.values.length;
  }

  mkVar() {
    const variable = this.values.length;
    this.values.push(Rational.zero);
    this.lowers.push(null);
    this.uppers.push(null);
    this.lowerReasons.push(null);
    this.upperReasons.push(null);
    this.basicRows.push(-1);
    this.columns.push(new Set());
    return variable;
  }

  isBasic(variable: number) {
    return this.basicRows[variable] !== -1;
  }

  // Adds a variable defined as the linear combination of existing ones.
  mkTerm(coeffs: Map<number, Rational>) {
    const variable = this.mkVar();
    const row = new Map<number, Rational>();
    const addTo = (target: number, coeff: Rational) => {
      const sum = (row.get(target) ?? Rational.zero).add(coeff);
      if (sum.isZero()) row.delete(target);
      else row.set(target, sum);
    };
    for (const entry of coeffs) {
      const rowIndex = this.basicRows[entry[0]];
      if (rowIndex === -1) addTo(entry[0], entry[1]);
      else for (const inner of this.rows[rowIndex].coeffs) addTo(inner[0], inner[1].mul(entry[1]));
    }
    let value = Rational.zero;
    for (const entry of row) value = value.add(entry[1].mul(this.values[entry[0]]));
    this.values[variable] = value;
    const rowIndex = this.rows.length;
    this.rows.push({ basic: variable, coeffs: row });
    this.basicRows[variable] = rowIndex;
    for (const entry of row) this.columns[entry[0]].add(rowIndex);
    return variable;
  }

  private update(variable: number, value: Rational) {
    const delta = value.sub(this.values[variable]);
    if (delta.isZero()) return;
    for (const rowIndex of this.columns[variable]) {
      const row = this.rows[rowIndex];
      const coeff = row.coeffs.get(variable);
      if (coeff !== undefined)
        this.values[row.basic] = this.values[row.basic].add(coeff.mul(delta));
    }
    this.values[variable] = value;
  }

  setLower(variable: number, bound: Rational, reason: BoundReason | null, isScoped: boolean) {
    if (isScoped) {
      const saved = this.lowers[variable];
      const savedReason = this.lowerReasons[variable];
      this.pushTrail(() => {
        this.lowers[variable] = saved;
        this.lowerReasons[variable] = savedReason;
      });
    }
    this.lowers[variable] = bound;
    this.lowerReasons[variable] = reason;
    if (!this.isBasic(variable) && this.values[variable].compare(bound) < 0) this.update(variable, bound);
  }

  setUpper(variable: number, bound: Rational, reason: BoundReason | null, isScoped: boolean) {
    if (isScoped) {
      const saved = this.uppers[variable];
      const savedReason = this.upperReasons[variable];
      this.pushTrail(() => {
        this.uppers[variable] = saved;
        this.upperReasons[variable] = savedReason;
      });
    }
    this.uppers[variable] = bound;
    this.upperReasons[variable] = reason;
    if (!this.isBasic(variable) && this.values[variable].compare(bound) > 0) this.update(variable, bound);
  }

  isFixed(variable: number) {
    const lower = this.lowers[variable];
    const upper = this.uppers[variable];
    return lower !== null && upper !== null && lower.equals(upper);
  }

  private pivot(rowIndex: number, entering: number) {
    const row = this.rows[rowIndex];
    const leaving = row.basic;
    const coeff = row.coeffs.get(entering);
    if (coeff === undefined) return;
    // leaving = coeff * entering + rest, so entering = (leaving - rest) / coeff.
    const inverse = Rational.one.div(coeff);
    const newCoeffs = new Map<number, Rational>();
    newCoeffs.set(leaving, inverse);
    for (const entry of row.coeffs) {
      if (entry[0] === entering) continue;
      newCoeffs.set(entry[0], entry[1].neg().mul(inverse));
    }
    for (const entry of row.coeffs) this.columns[entry[0]].delete(rowIndex);
    row.coeffs = newCoeffs;
    row.basic = entering;
    for (const entry of newCoeffs) this.columns[entry[0]].add(rowIndex);
    this.basicRows[leaving] = -1;
    this.basicRows[entering] = rowIndex;
    for (const otherIndex of [...this.columns[entering]]) {
      if (otherIndex === rowIndex) continue;
      const other = this.rows[otherIndex];
      const factor = other.coeffs.get(entering);
      if (factor === undefined) continue;
      other.coeffs.delete(entering);
      this.columns[entering].delete(otherIndex);
      for (const entry of newCoeffs) {
        const sum = (other.coeffs.get(entry[0]) ?? Rational.zero).add(entry[1].mul(factor));
        if (sum.isZero()) {
          if (other.coeffs.delete(entry[0])) this.columns[entry[0]].delete(otherIndex);
        } else {
          if (!other.coeffs.has(entry[0])) this.columns[entry[0]].add(otherIndex);
          other.coeffs.set(entry[0], sum);
        }
      }
    }
  }

  private pivotAndUpdate(rowIndex: number, entering: number, value: Rational) {
    const row = this.rows[rowIndex];
    const leaving = row.basic;
    const coeff = row.coeffs.get(entering);
    if (coeff === undefined) return;
    const theta = value.sub(this.values[leaving]).div(coeff);
    this.values[leaving] = value;
    this.values[entering] = this.values[entering].add(theta);
    for (const otherIndex of this.columns[entering]) {
      if (otherIndex === rowIndex) continue;
      const other = this.rows[otherIndex];
      const factor = other.coeffs.get(entering);
      if (factor !== undefined) this.values[other.basic] = this.values[other.basic].add(factor.mul(theta));
    }
    this.pivot(rowIndex, entering);
  }

  private findViolatedRow() {
    let bestRow = -1;
    let bestVar = Number.MAX_SAFE_INTEGER;
    for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
      const basic = this.rows[rowIndex].basic;
      if (basic >= bestVar) continue;
      const value = this.values[basic];
      const lower = this.lowers[basic];
      const upper = this.uppers[basic];
      if ((lower !== null && value.compare(lower) < 0) || (upper !== null && value.compare(upper) > 0)) {
        bestRow = rowIndex;
        bestVar = basic;
      }
    }
    return bestRow;
  }

  // Returns null when the bounds are satisfiable, else the bounds that contradict each other.
  check(isCanceled: () => boolean): SimplexConflict | null | undefined {
    for (let iteration = 0; ; iteration++) {
      if ((iteration & 63) === 63 && isCanceled()) return undefined;
      const rowIndex = this.findViolatedRow();
      if (rowIndex === -1) return null;
      const row = this.rows[rowIndex];
      const basic = row.basic;
      const lower = this.lowers[basic];
      const isBelow = lower !== null && this.values[basic].compare(lower) < 0;
      let entering = -1;
      for (const entry of row.coeffs) {
        const variable = entry[0];
        if (entering !== -1 && variable > entering) continue;
        const isPositive = entry[1].isPositive();
        const canIncrease = this.uppers[variable] === null || this.values[variable].compare(this.uppers[variable] ?? Rational.zero) < 0;
        const canDecrease = this.lowers[variable] === null || this.values[variable].compare(this.lowers[variable] ?? Rational.zero) > 0;
        if (isBelow ? (isPositive ? canIncrease : canDecrease) : isPositive ? canDecrease : canIncrease)
          entering = variable;
      }
      if (entering === -1) {
        const reasons: BoundReason[] = [];
        const pushReason = (reason: BoundReason | null) => {
          if (reason !== null) reasons.push(reason);
        };
        pushReason(isBelow ? this.lowerReasons[basic] : this.upperReasons[basic]);
        for (const entry of row.coeffs) {
          const isUpper = entry[1].isPositive() === isBelow;
          pushReason(isUpper ? this.upperReasons[entry[0]] : this.lowerReasons[entry[0]]);
        }
        return { reasons };
      }
      const target = isBelow ? lower : this.uppers[basic];
      if (target === null) return null;
      this.pivotAndUpdate(rowIndex, entering, target);
    }
  }
}
