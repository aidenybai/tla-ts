// Ported from Z3 (src/math/simplex/model_based_opt.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import { getEuclideanDiv, getEuclideanMod, getGcd, getLcm, Rational } from "./rational";

export const T_EQ = 0;
export const T_LT = 1;
export const T_LE = 2;
export const T_DIVIDES = 3;
export const T_MOD = 4;
export const T_DIV = 5;

export interface MboVar {
  id: number;
  coeff: Rational;
}

export interface MboRow {
  vars: MboVar[];
  coeff: Rational;
  mod: Rational;
  type: number;
  value: Rational;
  isAlive: boolean;
  // The variable a mod or div row defines.
  id: number;
}

const NONE = -1;
const OBJECTIVE_ID = 0;

const mkRow = (): MboRow => ({
  vars: [],
  coeff: Rational.zero,
  mod: Rational.zero,
  type: T_LE,
  value: Rational.zero,
  isAlive: false,
  id: NONE,
});

// rational's gcd and lcm, which on fractions combine the numerators and the denominators.
const getRationalGcd = (first: Rational, second: Rational) =>
  Rational.of(getGcd(first.num, second.num), getLcm(first.den, second.den));

const getRationalLcm = (first: Rational, second: Rational) =>
  Rational.of(getLcm(first.num, second.num), getGcd(first.den, second.den));

const getMod = (value: Rational, divisor: Rational) =>
  Rational.of(getEuclideanMod(value.num, divisor.num));

const getDiv = (value: Rational, divisor: Rational) =>
  Rational.of(getEuclideanDiv(value.num, divisor.num));

const getNSign = (value: Rational) => (value.isPositive() ? Rational.minusOne : Rational.one);

const getRowCoefficient = (row: MboRow, varId: number) => {
  const vars = row.vars;
  if (vars.length === 0) return Rational.zero;
  let low = 0;
  let high = vars.length;
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    const id = vars[mid].id;
    if (id === varId) {
      low = mid;
      break;
    }
    if (id < varId) low = mid + 1;
    else high = mid;
  }
  if (low === vars.length) return Rational.zero;
  return vars[low].id === varId ? vars[low].coeff : Rational.zero;
};

const sortVars = (vars: MboVar[]) => vars.sort((left, right) => left.id - right.id);

const areVarsEqual = (left: MboVar[], right: MboVar[]) =>
  left.length === right.length &&
  left.every(
    (innerVar, index) =>
      innerVar.id === right[index].id && innerVar.coeff.equals(right[index].coeff),
  );

export class ModelBasedOpt {
  private rows: MboRow[] = [mkRow()];
  private var2RowIds: number[][] = [];
  private var2Value: Rational[] = [];
  private var2IsInt: boolean[] = [];
  private retiredRows: number[] = [];

  addVar(value: Rational, isInt: boolean) {
    const id = this.var2Value.length;
    this.var2Value.push(value);
    this.var2IsInt.push(isInt);
    this.var2RowIds.push([]);
    return id;
  }

  getValue(id: number) {
    return this.var2Value[id];
  }

  addConstraint(coeffs: MboVar[], coeff: Rational, type: number) {
    this.addRow(coeffs, coeff, Rational.zero, type, 0);
  }

  addDivides(coeffs: MboVar[], coeff: Rational, mod: Rational) {
    let gcd = coeff;
    for (const innerVar of coeffs) gcd = getRationalGcd(innerVar.coeff, gcd);
    if (gcd.div(mod).isInt()) return;
    this.addRow(coeffs, coeff, mod, T_DIVIDES, 0);
  }

  addMod(coeffs: MboVar[], coeff: Rational, mod: Rational) {
    const id = this.addVar(getMod(this.evalTerm(coeffs, coeff), mod), true);
    this.addRow(coeffs, coeff, mod, T_MOD, id);
    return id;
  }

  addDiv(coeffs: MboVar[], coeff: Rational, mod: Rational) {
    const id = this.addVar(getDiv(this.evalTerm(coeffs, coeff), mod), true);
    this.addRow(coeffs, coeff, mod, T_DIV, id);
    return id;
  }

  getLiveRows() {
    return this.rows.filter((row) => row.isAlive);
  }

  project(vars: readonly number[]) {
    for (const id of vars) this.projectVar(id);
  }

  private evalTerm(coeffs: readonly MboVar[], coeff: Rational) {
    let value = coeff;
    for (const innerVar of coeffs)
      value = value.add(innerVar.coeff.mul(this.var2Value[innerVar.id]));
    return value;
  }

  private getCoefficient(rowId: number, varId: number) {
    return getRowCoefficient(this.rows[rowId], varId);
  }

  private retireRow(rowId: number) {
    this.rows[rowId].isAlive = false;
    this.retiredRows.push(rowId);
  }

  private setRow(
    rowId: number,
    coeffs: readonly MboVar[],
    coeff: Rational,
    mod: Rational,
    type: number,
  ) {
    const row = this.rows[rowId];
    let value = coeff;
    for (const innerVar of coeffs) row.vars.push({ ...innerVar });
    let isIntRow = coeffs.length > 0;
    sortVars(row.vars);
    for (const innerVar of coeffs) {
      value = value.add(this.var2Value[innerVar.id].mul(innerVar.coeff));
      isIntRow &&= this.var2IsInt[innerVar.id];
    }
    row.isAlive = true;
    row.coeff = coeff;
    row.value = value;
    row.type = type;
    row.mod = mod;
    if (isIntRow && type === T_LT) {
      row.type = T_LE;
      row.coeff = row.coeff.add(Rational.one);
      row.value = row.value.add(Rational.one);
    }
  }

  private newRow() {
    const retired = this.retiredRows.pop();
    if (retired === undefined) {
      this.rows.push(mkRow());
      return this.rows.length - 1;
    }
    const row = this.rows[retired];
    row.vars = [];
    row.coeff = Rational.zero;
    row.value = Rational.zero;
    row.isAlive = true;
    return retired;
  }

  private copyRow(source: number) {
    const target = this.newRow();
    const row = this.rows[source];
    this.setRow(target, row.vars, row.coeff, row.mod, row.type);
    for (const innerVar of row.vars) this.var2RowIds[innerVar.id].push(target);
    return target;
  }

  // -x + lo <= 0
  private addLowerBound(id: number, lower: Rational) {
    this.addConstraint([{ id, coeff: Rational.minusOne }], lower, T_LE);
  }

  // x - hi <= 0
  private addUpperBound(id: number, upper: Rational) {
    this.addConstraint([{ id, coeff: Rational.one }], upper.neg(), T_LE);
  }

  private addRow(coeffs: MboVar[], coeff: Rational, mod: Rational, type: number, id: number) {
    const last = this.rows[this.rows.length - 1];
    if (
      areVarsEqual(last.vars, coeffs) &&
      last.coeff.equals(coeff) &&
      last.mod.equals(mod) &&
      last.type === type &&
      last.id === id &&
      last.isAlive
    )
      return this.rows.length - 1;
    const rowId = this.newRow();
    this.setRow(rowId, coeffs, coeff, mod, type);
    this.rows[rowId].id = id;
    for (const innerVar of coeffs) this.var2RowIds[innerVar.id].push(rowId);
    this.normalize(rowId);
    return rowId;
  }

  private mul(rowId: number, factor: Rational) {
    if (factor.equals(Rational.one)) return;
    const row = this.rows[rowId];
    for (const innerVar of row.vars) innerVar.coeff = innerVar.coeff.mul(factor);
    row.mod = row.mod.mul(factor);
    row.coeff = row.coeff.mul(factor);
    if (row.type !== T_DIV && row.type !== T_MOD) row.value = row.value.mul(factor);
  }

  private add(rowId: number, value: Rational) {
    const row = this.rows[rowId];
    row.coeff = row.coeff.add(value);
    row.value = row.value.add(value);
  }

  private normalize(rowId: number) {
    const row = this.rows[rowId];
    if (!row.isAlive) return;
    if (row.vars.length === 0) {
      this.retireRow(rowId);
      return;
    }
    if (row.type === T_DIVIDES || row.type === T_MOD || row.type === T_DIV) return;
    let gcd = row.vars[0].coeff.abs();
    let isAllInt = gcd.isInt();
    for (let index = 1; isAllInt && !gcd.equals(Rational.one) && index < row.vars.length; index++) {
      const coeff = row.vars[index].coeff;
      if (coeff.isInt()) gcd = getRationalGcd(gcd, coeff.abs());
      else isAllInt = false;
    }
    if (isAllInt && !row.coeff.isZero()) {
      if (row.coeff.isInt()) gcd = getRationalGcd(gcd, row.coeff.abs());
      else isAllInt = false;
    }
    if (isAllInt && !gcd.equals(Rational.one)) this.mul(rowId, Rational.one.div(gcd));
  }

  // row1 <- row1 + factor*row2
  private mulAddRows(isSameSign: boolean, rowId1: number, factor: Rational, rowId2: number) {
    if (factor.isZero()) return;
    const newVars: MboVar[] = [];
    const row1 = this.rows[rowId1];
    const row2 = this.rows[rowId2];
    let first = 0;
    let second = 0;
    const pushScaled = (innerVar: MboVar) => {
      newVars.push({ id: innerVar.id, coeff: innerVar.coeff.mul(factor) });
      if (rowId1 !== OBJECTIVE_ID) this.var2RowIds[innerVar.id].push(rowId1);
    };
    while (first < row1.vars.length || second < row2.vars.length) {
      if (second === row2.vars.length) {
        newVars.push(...row1.vars.slice(first));
        break;
      }
      if (first === row1.vars.length) {
        for (; second < row2.vars.length; second++) pushScaled(row2.vars[second]);
        break;
      }
      const var1 = row1.vars[first];
      const var2 = row2.vars[second];
      if (var1.id === var2.id) {
        const coeff = var1.coeff.add(factor.mul(var2.coeff));
        first++;
        second++;
        if (!coeff.isZero()) newVars.push({ id: var1.id, coeff });
      } else if (var1.id < var2.id) {
        newVars.push(var1);
        first++;
      } else {
        pushScaled(var2);
        second++;
      }
    }
    row1.coeff = row1.coeff.add(factor.mul(row2.coeff));
    row1.vars = newVars;
    row1.value = row1.value.add(factor.mul(row2.value));
    if (!isSameSign && row2.type === T_LT) row1.type = T_LT;
    else if (isSameSign && row1.type === T_LT && row2.type === T_LT) row1.type = T_LE;
  }

  // Resolution for integer rows.
  private mulAddInt(
    id: number,
    sourceCoeff: Rational,
    rowSource: number,
    targetCoeff: Rational,
    rowTarget: number,
  ) {
    const target = this.rows[rowTarget];
    const source = this.rows[rowSource];
    const absSource = sourceCoeff.abs();
    const absTarget = targetCoeff.abs();
    const value = this.var2Value[id];
    const slack = absSource.sub(Rational.one).mul(absTarget.sub(Rational.one));
    const targetValue = target.value.sub(value.mul(targetCoeff));
    const sourceValue = source.value.sub(value.mul(sourceCoeff));
    const distance = absSource.mul(targetValue).add(absTarget.mul(sourceValue)).add(slack);
    if (
      !distance.isPositive() ||
      absSource.equals(Rational.one) ||
      absTarget.equals(Rational.one)
    ) {
      this.mul(rowTarget, absSource);
      this.add(rowTarget, slack);
      this.mulAddRows(false, rowTarget, absTarget, rowSource);
      return;
    }
    // A finite disjunction for |b|: exists z in [0 .. |b|-2] . |b| | (z + s) && a*n_sign(b)(s + z) + |b|t <= 0.
    if (absTarget.compare(absSource) <= 0) {
      let slackValue = getMod(targetValue, absTarget);
      if (!slackValue.isZero()) slackValue = absTarget.sub(slackValue);
      const coeffs = target.vars.filter((innerVar) => innerVar.id !== id);
      this.addDivides(coeffs, target.coeff.add(slackValue), absTarget);
      this.add(rowTarget, slackValue);
      this.mul(rowTarget, sourceCoeff.mul(getNSign(targetCoeff)));
      this.mulAddRows(false, rowTarget, absTarget, rowSource);
      return;
    }
    let slackValue = getMod(sourceValue, absSource);
    if (!slackValue.isZero()) slackValue = absSource.sub(slackValue);
    const coeffs = source.vars.filter((innerVar) => innerVar.id !== id);
    this.addDivides(coeffs, source.coeff.add(slackValue), absSource);
    this.mul(rowTarget, absSource);
    this.add(rowTarget, slackValue.mul(targetCoeff).mul(getNSign(sourceCoeff)));
    this.mulAddRows(false, rowTarget, targetCoeff.mul(getNSign(sourceCoeff)), rowSource);
  }

  private resolve(rowSource: number, coeff1: Rational, rowTarget: number, id: number) {
    if (!this.rows[rowTarget].isAlive) return;
    const coeff2 = this.getCoefficient(rowTarget, id);
    if (this.var2IsInt[id]) {
      if (coeff1.isPositive() !== coeff2.isPositive() || this.rows[rowSource].type === T_EQ)
        this.mulAddInt(id, coeff1, rowSource, coeff2, rowTarget);
      else {
        this.mul(rowTarget, coeff1.abs());
        this.mulAddRows(false, rowTarget, coeff2.abs().neg(), rowSource);
      }
      this.normalize(rowTarget);
      return;
    }
    this.mulAddRows(
      rowTarget !== OBJECTIVE_ID && coeff1.isPositive() === coeff2.isPositive(),
      rowTarget,
      coeff2.neg().div(coeff1),
      rowSource,
    );
  }

  private solve(rowSource: number, coeff1: Rational, rowTarget: number, id: number) {
    if (!this.rows[rowTarget].isAlive) return;
    const coeff2 = this.getCoefficient(rowTarget, id);
    this.mul(rowTarget, coeff1);
    this.mulAddRows(false, rowTarget, coeff2.neg(), rowSource);
    this.normalize(rowTarget);
  }

  // Picks the glb or lub that represents the fewest inequalities.
  private projectVar(id: number) {
    const lubRows: number[] = [];
    const glbRows: number[] = [];
    const divideRows: number[] = [];
    const modRows: number[] = [];
    const divRows: number[] = [];
    let lubIndex = NONE;
    let glbIndex = NONE;
    let isLubStrict = false;
    let isGlbStrict = false;
    let lubValue = Rational.zero;
    let glbValue = Rational.zero;
    const value = this.var2Value[id];
    const visited = new Set<number>();
    let isLubUnit = true;
    let isGlbUnit = true;
    let eqRow = NONE;
    for (const rowId of this.var2RowIds[id]) {
      if (visited.has(rowId)) continue;
      visited.add(rowId);
      const row = this.rows[rowId];
      if (!row.isAlive) continue;
      const coeff = this.getCoefficient(rowId, id);
      if (coeff.isZero()) continue;
      if (row.type === T_EQ) eqRow = rowId;
      else if (row.type === T_MOD) modRows.push(rowId);
      else if (row.type === T_DIV) divRows.push(rowId);
      else if (row.type === T_DIVIDES) divideRows.push(rowId);
      else if (coeff.isPositive()) {
        const bound = value.sub(row.value.div(coeff));
        if (
          lubRows.length === 0 ||
          bound.compare(lubValue) < 0 ||
          (bound.equals(lubValue) && row.type === T_LT && !isLubStrict)
        ) {
          lubValue = bound;
          lubIndex = rowId;
          isLubStrict = row.type === T_LT;
        }
        lubRows.push(rowId);
        isLubUnit &&= coeff.equals(Rational.one);
      } else {
        const bound = value.sub(row.value.div(coeff));
        if (
          glbRows.length === 0 ||
          bound.compare(glbValue) > 0 ||
          (bound.equals(glbValue) && row.type === T_LT && !isGlbStrict)
        ) {
          glbValue = bound;
          glbIndex = rowId;
          isGlbStrict = row.type === T_LT;
        }
        glbRows.push(rowId);
        isGlbUnit &&= coeff.equals(Rational.minusOne);
      }
    }
    if (divideRows.length > 0) {
      this.solveDivides(id, divideRows);
      return;
    }
    if (divRows.length > 0 || modRows.length > 0) {
      this.solveModDiv(id, modRows, divRows);
      return;
    }
    if (eqRow !== NONE) {
      this.solveFor(eqRow, id);
      return;
    }
    const lubSize = lubRows.length;
    const glbSize = glbRows.length;
    const rowIndex = lubSize <= glbSize ? lubIndex : glbIndex;
    if (rowIndex === NONE) {
      for (const rowId of lubRows) this.retireRow(rowId);
      for (const rowId of glbRows) this.retireRow(rowId);
      return;
    }
    if (
      (lubSize <= 2 || glbSize <= 2) &&
      lubSize <= 3 &&
      glbSize <= 3 &&
      (!this.var2IsInt[id] || isLubUnit || isGlbUnit)
    ) {
      for (const [index, rowId1] of lubRows.entries()) {
        const isLast = index + 1 === lubSize;
        const coeff = this.getCoefficient(rowId1, id);
        for (const rowId2 of glbRows) {
          if (isLast) this.resolve(rowId1, coeff, rowId2, id);
          else this.resolve(rowId1, coeff, this.copyRow(rowId2), id);
        }
      }
      for (const rowId of lubRows) this.retireRow(rowId);
      return;
    }
    const coeff = this.getCoefficient(rowIndex, id);
    for (const rowId of lubRows) if (rowId !== rowIndex) this.resolve(rowIndex, coeff, rowId, id);
    for (const rowId of glbRows) if (rowId !== rowIndex) this.resolve(rowIndex, coeff, rowId, id);
    this.retireRow(rowIndex);
  }

  // Replaces x by K*y + z, 0 <= z < K, for the lcm K of the mod and div rows.
  private solveModDiv(id: number, modRowIds: readonly number[], divRowIds: readonly number[]) {
    let modulus = Rational.one;
    for (const rowId of divRowIds) modulus = getRationalLcm(modulus, this.rows[rowId].mod);
    for (const rowId of modRowIds) modulus = getRationalLcm(modulus, this.rows[rowId].mod);
    const value = this.var2Value[id];
    const zValue = getMod(value, modulus);
    const yValue = getDiv(value, modulus);
    const zVar = this.addVar(zValue, true);
    const yVar = this.addVar(yValue, true);
    const visited = new Set<number>();
    const divRows: number[] = [];
    for (const rowId of divRowIds) {
      if (visited.has(rowId)) continue;
      const row = this.rows[rowId];
      this.mul(rowId, modulus.div(row.mod));
      row.isAlive = false;
      visited.add(rowId);
      divRows.push(rowId);
    }
    const modRows: number[] = [];
    for (const rowId of modRowIds) {
      if (visited.has(rowId)) continue;
      this.rows[rowId].isAlive = false;
      visited.add(rowId);
      modRows.push(rowId);
    }
    for (const rowId of this.var2RowIds[id]) {
      if (visited.has(rowId)) continue;
      this.replaceVarByTwo(rowId, id, modulus, yVar, Rational.one, zVar);
      visited.add(rowId);
      this.normalize(rowId);
    }
    this.addLowerBound(zVar, Rational.zero);
    this.addUpperBound(zVar, modulus.sub(Rational.one));
    const defined: number[] = [];
    for (const rowId of divRows) {
      const coeff = this.getCoefficient(rowId, id);
      this.replaceVarByConst(rowId, id, Rational.zero);
      const coeffs = this.rows[rowId].vars.map((innerVar) => ({ ...innerVar }));
      const constant = this.rows[rowId].coeff;
      const isUnitModulus = modulus.equals(Rational.one);
      let divVar = NONE;
      let offset = Rational.zero;
      if (isUnitModulus) offset = constant;
      else if (coeffs.length === 0) offset = getDiv(constant, modulus);
      else divVar = this.addDiv(coeffs, constant, modulus);
      // v = a*y + w + k, k*K <= a*z + b mod K < (k+1)*K, for w = b div K.
      const definedVar = this.rows[rowId].id;
      const bValue = this.evalTerm(coeffs, constant);
      const quotient = getDiv(coeff.mul(zValue).add(getMod(bValue, modulus)), modulus);
      const divCoeffs: MboVar[] = [
        { id: definedVar, coeff: Rational.minusOne },
        { id: yVar, coeff },
      ];
      if (divVar !== NONE) divCoeffs.push({ id: divVar, coeff: Rational.one });
      else if (isUnitModulus) divCoeffs.push(...coeffs);
      this.addConstraint(divCoeffs, quotient.add(offset), T_EQ);
      let modVar = NONE;
      offset = Rational.zero;
      if (isUnitModulus) offset = Rational.zero;
      else if (coeffs.length === 0) offset = getMod(constant, modulus);
      else modVar = this.addMod(coeffs, constant, modulus);
      const boundCoeffs: MboVar[] = [{ id: zVar, coeff }];
      if (modVar !== NONE) boundCoeffs.push({ id: modVar, coeff: Rational.one });
      this.addConstraint(
        boundCoeffs,
        Rational.one.sub(modulus.mul(quotient.add(Rational.one))).add(offset),
        T_LE,
      );
      this.addConstraint(
        boundCoeffs.map((innerVar) => ({ id: innerVar.id, coeff: innerVar.coeff.neg() })),
        quotient.mul(modulus).sub(offset),
        T_LE,
      );
      this.retireRow(rowId);
      defined.push(definedVar);
    }
    for (const rowId of modRows) {
      const coeff = this.getCoefficient(rowId, id);
      this.replaceVarByConst(rowId, id, Rational.zero);
      const rowMod = this.rows[rowId].mod;
      const coeffs = this.rows[rowId].vars.map((innerVar) => ({ ...innerVar }));
      const constant = this.rows[rowId].coeff;
      const definedVar = this.rows[rowId].id;
      const definedValue = this.var2Value[definedVar];
      let modVar = NONE;
      let offset = Rational.zero;
      if (coeffs.length === 0 || rowMod.equals(Rational.one)) offset = getMod(constant, rowMod);
      else modVar = this.addMod(coeffs, constant, rowMod);
      const modValue = modVar === NONE ? offset : this.var2Value[modVar];
      // v = a*z + w - V, for V = v_value - a*z_value - w_value.
      const shift = definedValue.sub(coeff.mul(zValue)).sub(modValue);
      const modCoeffs: MboVar[] = [
        { id: definedVar, coeff: Rational.minusOne },
        { id: zVar, coeff },
      ];
      if (modVar !== NONE) modCoeffs.push({ id: modVar, coeff: Rational.one });
      this.addConstraint(modCoeffs, shift.add(offset), T_EQ);
      this.addLowerBound(definedVar, Rational.zero);
      this.addUpperBound(definedVar, rowMod.sub(Rational.one));
      this.retireRow(rowId);
      defined.push(definedVar);
    }
    for (const definedVar of defined) this.projectVar(definedVar);
    this.projectVar(zVar);
    this.projectVar(yVar);
  }

  // x := D*x' + u, for the lcm D of the divisors and u = eval(x) mod D.
  private solveDivides(id: number, divideRows: readonly number[]) {
    let modulus = Rational.one;
    for (const rowId of divideRows) modulus = getRationalLcm(modulus, this.rows[rowId].mod);
    if (modulus.isZero()) throw new SmtInvariantError("modulo 0 is not defined");
    modulus = modulus.abs();
    const value = this.var2Value[id];
    const remainder = getMod(value, modulus);
    for (const rowId of divideRows) {
      this.replaceVarByConst(rowId, id, remainder);
      this.normalize(rowId);
    }
    const yVar = this.addVar(value.sub(remainder).div(modulus), true);
    const visited = new Set<number>();
    for (const rowId of this.var2RowIds[id]) {
      if (visited.has(rowId)) continue;
      this.replaceVarByOne(rowId, id, modulus, yVar, remainder);
      visited.add(rowId);
      this.normalize(rowId);
    }
    this.projectVar(yVar);
  }

  // x |-> C
  private replaceVarByConst(rowId: number, id: number, value: Rational) {
    const row = this.rows[rowId];
    let coeff = Rational.zero;
    row.vars = row.vars.filter((innerVar) => {
      if (innerVar.id !== id) return true;
      coeff = innerVar.coeff;
      return false;
    });
    row.coeff = row.coeff.add(coeff.mul(value));
    row.value = row.value.add(coeff.mul(value.sub(this.var2Value[id])));
  }

  // x |-> A*y + B
  private replaceVarByOne(
    rowId: number,
    id: number,
    factor: Rational,
    yVar: number,
    constant: Rational,
  ) {
    const row = this.rows[rowId];
    const coeff = this.getCoefficient(rowId, id);
    if (coeff.isZero() || !row.isAlive) return;
    this.replaceVarByConst(rowId, id, constant);
    row.vars.push({ id: yVar, coeff: coeff.mul(factor) });
    row.value = row.value.add(coeff.mul(factor).mul(this.var2Value[yVar]));
    if (row.vars.length > 0 && row.vars[row.vars.length - 1].id > yVar) sortVars(row.vars);
    this.var2RowIds[yVar].push(rowId);
  }

  // x |-> A*y + B*z
  private replaceVarByTwo(
    rowId: number,
    id: number,
    yFactor: Rational,
    yVar: number,
    zFactor: Rational,
    zVar: number,
  ) {
    const row = this.rows[rowId];
    const coeff = this.getCoefficient(rowId, id);
    if (coeff.isZero() || !row.isAlive) return;
    this.replaceVarByConst(rowId, id, Rational.zero);
    if (!yFactor.isZero()) row.vars.push({ id: yVar, coeff: coeff.mul(yFactor) });
    if (!zFactor.isZero()) row.vars.push({ id: zVar, coeff: coeff.mul(zFactor) });
    row.value = row.value.add(coeff.mul(yFactor).mul(this.var2Value[yVar]));
    row.value = row.value.add(coeff.mul(zFactor).mul(this.var2Value[zVar]));
    sortVars(row.vars);
    if (!yFactor.isZero()) this.var2RowIds[yVar].push(rowId);
    if (!zFactor.isZero()) this.var2RowIds[zVar].push(rowId);
  }

  private solveFor(rowId1: number, id: number) {
    let coeff = this.getCoefficient(rowId1, id);
    const row1 = this.rows[rowId1];
    const type = row1.type;
    if (coeff.isNegative()) {
      coeff = coeff.neg();
      for (const innerVar of row1.vars) innerVar.coeff = innerVar.coeff.neg();
      row1.coeff = row1.coeff.neg();
      row1.value = row1.value.neg();
    }
    if (type === T_LT) {
      row1.coeff = row1.coeff.sub(row1.value);
      row1.type = T_LE;
      row1.value = Rational.zero;
    }
    if (this.var2IsInt[id] && !coeff.equals(Rational.one)) {
      row1.coeff = row1.coeff.sub(row1.value);
      row1.value = Rational.zero;
      const coeffs = row1.vars.filter((innerVar) => innerVar.id !== id);
      const remainder = getMod(this.evalTerm(coeffs, Rational.zero).neg(), coeff);
      this.addDivides(coeffs, remainder, coeff);
    }
    const visited = new Set([rowId1]);
    for (const rowId2 of this.var2RowIds[id]) {
      if (visited.has(rowId2)) continue;
      visited.add(rowId2);
      const row = this.rows[rowId2];
      if (!row.isAlive || this.getCoefficient(rowId2, id).isZero()) continue;
      if (row.type === T_EQ || row.type === T_LT || row.type === T_LE)
        this.solve(rowId1, coeff, rowId2, id);
      else throw new SmtInvariantError("model_based_opt: mod reduction left a row");
    }
    this.retireRow(rowId1);
  }
}
