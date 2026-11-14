// Ported from Z3 (src/opt/maxlex.cpp), MIT license, see z3-license.txt.
import { OP_NOT, SORT_BOOL } from "./ast";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { type MaxsatContext, MaxsmtSolverBase, type Soft } from "./maxsmt-base";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";

export const isMaxlex = (soft: readonly Soft[]) => {
  const weights = soft.map((entry) => entry.weight).sort((first, second) => second.compare(first));
  let sum = weights.reduce((total, weight) => total.add(weight), Rational.zero);
  for (const weight of weights) {
    if (sum.compare(weight.add(weight)) > 0) return false;
    sum = sum.sub(weight);
  }
  return true;
};

export class Maxlex extends MaxsmtSolverBase {
  constructor(context: MaxsatContext, index: number, soft: Soft[]) {
    super(context, soft, index);
    const ids = context.manager.ids;
    soft.sort(
      (first, second) => second.weight.compare(first.weight) || ids[second.expr] - ids[first.expr],
    );
  }

  private isTrueIn(model: ProtoModel, expr: number) {
    const value = model.eval(expr, true);
    const isTrue = value === this.manager.trueExpr;
    this.manager.decRef(value);
    return isTrue;
  }

  private assertValue(soft: Soft) {
    if (soft.value === L_TRUE) this.solver.assertExpr(soft.expr);
    else if (soft.value === L_FALSE) {
      const negated = this.manager.mkApp(OP_NOT, [soft.expr], SORT_BOOL);
      this.trail.push(negated);
      this.solver.assertExpr(negated);
    }
  }

  private updateFromSolver() {
    const model = this.solver.getModel();
    if (model === null) return false;
    this.model = model;
    this.context.modelUpdated(model);
    this.updateAssignment(model);
    return true;
  }

  private updateAssignment(model: ProtoModel) {
    let isFirstUndef = true;
    let isSecondUndef = false;
    for (const soft of this.soft) {
      if (isFirstUndef && soft.value !== L_UNDEF) continue;
      if (isFirstUndef) {
        soft.value = L_TRUE;
        this.assertValue(soft);
        isFirstUndef = false;
        continue;
      }
      if (soft.value === L_FALSE) continue;
      const value = this.isTrueIn(model, soft.expr) ? L_TRUE : L_UNDEF;
      if (value === L_UNDEF) isSecondUndef = true;
      soft.value = value;
      if (!isSecondUndef) this.assertValue(soft);
    }
    this.updateBounds();
  }

  private updateBounds() {
    this.lower = Rational.zero;
    this.upper = Rational.zero;
    for (const soft of this.soft) {
      if (soft.value === L_TRUE) continue;
      this.upper = this.upper.add(soft.weight);
      if (soft.value === L_FALSE) this.lower = this.lower.add(soft.weight);
    }
  }

  private initLex() {
    for (const soft of this.soft) soft.value = L_UNDEF;
    const model = this.solver.getModel();
    if (model === null) return;
    for (const soft of this.soft) {
      if (!this.isTrueIn(model, soft.expr)) {
        this.updateBounds();
        return;
      }
      soft.value = L_TRUE;
      this.assertValue(soft);
    }
    this.updateFromSolver();
  }

  run() {
    this.initLex();
    for (let index = 0; index < this.soft.length; index++) {
      const soft = this.soft[index];
      if (soft.value !== L_UNDEF) continue;
      const status = this.solver.checkSat([soft.expr]);
      if (status === L_UNDEF) return L_UNDEF;
      if (status === L_TRUE) {
        if (!this.updateFromSolver()) return L_UNDEF;
        continue;
      }
      soft.value = L_FALSE;
      this.assertValue(soft);
      for (let later = index + 1; later < this.soft.length; later++) {
        if (this.soft[later].value !== L_TRUE) break;
        this.assertValue(this.soft[later]);
      }
      this.updateBounds();
    }
    return L_TRUE;
  }

  commitAssignment() {
    if (this.soft.some((soft) => soft.value === L_UNDEF)) return;
    for (const soft of this.soft) this.assertValue(soft);
  }
}
