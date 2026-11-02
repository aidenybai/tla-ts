// Ported from Z3 (src/math/lp/horner.h, src/math/lp/horner.cpp, and nexvar, create_sum_from_row,
// and add_deps_of_fixed from src/math/lp/nla_common.cpp), MIT license, see z3-license.txt. Horner
// lemmas: a tableau row is a sum that equals zero. Each cross-nested form of the row that
// intervals proves nonzero yields a conflict.
import { Rational } from "../rational";
import { CrossNested } from "./cross-nested";
import { type Dependency, mkJoin } from "./dependency";
import { type Nex, getDegree } from "./nex";
import { NexCreator } from "./nex-creator";
import { NLA_PARAMS, type NlaCore } from "./nla-core";
import type { RowCell } from "./static-matrix";

export class Horner {
  private readonly nexCreator = new NexCreator();
  // The joined bounds of the fixed variables that the row's sum replaced by their values.
  private fixedDep: Dependency = null;

  constructor(private readonly core: NlaCore) {}

  hornerLemmas() {
    if (!NLA_PARAMS.horner) return false;
    const core = this.core;
    if (core.toRefine.size === 0) {
      core.isNlaSatisfied = true;
      return false;
    }
    const matrix = core.lra.core.matrix;
    const rowsToCheck = new Set<number>();
    for (const lpVar of core.toRefine.elems)
      for (const cell of matrix.columns[lpVar]) rowsToCheck.add(cell.row);
    core.activeVarSet.clear();
    const rows = [...rowsToCheck]
      .sort((first, second) => first - second)
      .filter((rowIndex) => this.rowIsInteresting(matrix.rows[rowIndex]));
    const offset = core.random();
    for (let index = 0; index < rows.length; index++)
      if (this.lemmasOnRow(matrix.rows[rows[(index + offset) % rows.length]])) return true;
    return false;
  }

  // row_is_interesting: whether two monomials of the row share a variable.
  private rowIsInteresting(row: RowCell[]) {
    if (row.length > NLA_PARAMS.hornerRowLengthLimit) return false;
    const core = this.core;
    core.activeVarSet.clear();
    for (const cell of row) {
      if (!core.isMonicVar(cell.column)) {
        if (core.activeVarSet.has(cell.column)) return true;
        core.activeVarSet.add(cell.column);
        continue;
      }
      const vars = core.emons.get(cell.column).vars;
      if (vars.some((lpVar) => core.activeVarSet.has(lpVar))) return true;
      for (const lpVar of vars) core.activeVarSet.add(lpVar);
    }
    return false;
  }

  private lemmasOnRow(row: RowCell[]) {
    const core = this.core;
    core.activeVarSet.clear();
    this.fixedDep = null;
    const summands = row.map((cell) => this.nexvar(cell.coeff, cell.column));
    const fixedDep = this.fixedDep;
    this.setActiveVarsWeights();
    const expr = this.nexCreator.simplify(this.nexCreator.mkSum(summands));
    if (getDegree(expr) < 2 || expr.kind !== "sum") return false;
    const crossNested = new CrossNested(
      (form) => core.intervals.checkNex(form, fixedDep),
      (lpVar) => core.varIsFixed(lpVar),
      { inc: () => !core.isCanceled() },
      core.random(),
      this.nexCreator,
    );
    crossNested.run(expr);
    return crossNested.done();
  }

  // set_active_vars_weights: without the weights the comparisons of nex_creator are wrong.
  private setActiveVarsWeights() {
    this.nexCreator.setNumberOfVars(this.core.lra.getColumnCount());
    for (const lpVar of this.core.activeVarSet.elems)
      this.nexCreator.setVarWeight(lpVar, this.core.getVarWeight(lpVar));
  }

  // add_deps_of_fixed.
  private addDepsOfFixed(lpVar: number) {
    this.fixedDep = mkJoin(this.fixedDep, this.core.lra.getBoundWitnesses(lpVar));
  }

  // nexvar: coeff times the column, a product for a monic, where hornerSubsFixed replaces fixed
  // variables by their values (1) or only those fixed to zero (2).
  private nexvar(coeff: Rational, lpVar: number): Nex {
    const core = this.core;
    const creator = this.nexCreator;
    const subsFixed: number = NLA_PARAMS.hornerSubsFixed;
    if (subsFixed === 1 && core.varIsFixed(lpVar)) {
      this.addDepsOfFixed(lpVar);
      return creator.mkScalar(coeff.mul(core.lra.core.lowerBounds[lpVar].x));
    }
    if (subsFixed === 2 && core.varIsFixedToZero(lpVar)) {
      this.addDepsOfFixed(lpVar);
      return creator.mkScalar(Rational.zero);
    }
    if (!core.isMonicVar(lpVar)) {
      core.activeVarSet.add(lpVar);
      return creator.mkMul(creator.mkScalar(coeff), creator.mkVar(lpVar));
    }
    const factors: (Nex | Rational)[] = [coeff];
    const initialDep = this.fixedDep;
    for (const factorVar of core.emons.get(lpVar).vars) {
      if (subsFixed === 1 && core.varIsFixed(factorVar)) {
        this.addDepsOfFixed(factorVar);
        factors.push(core.lra.core.lowerBounds[factorVar].x);
      } else if (subsFixed === 2 && core.varIsFixedToZero(factorVar)) {
        this.fixedDep = initialDep;
        this.addDepsOfFixed(factorVar);
        return creator.mkScalar(Rational.zero);
      } else {
        core.activeVarSet.add(factorVar);
        factors.push(creator.mkVar(factorVar));
      }
    }
    return creator.mkMul(...factors);
  }
}
