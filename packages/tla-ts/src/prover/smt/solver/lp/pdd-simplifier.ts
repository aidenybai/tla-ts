import { mkJoin } from "./dependency";
import type { Pdd } from "./pdd";
import { type Equation, type PddSolver, SetUpdate, SOLVED, TO_SIMPLIFY } from "./pdd-solver";
import { shrink } from "../array";

export class PddSimplifier {
  constructor(private solver: PddSolver) {}

  run() {
    while (
      !this.solver.isDone() &&
      (this.simplifyLinearStep(true) ||
        this.simplifyElimPureStep() ||
        this.simplifyCcStep() ||
        this.simplifyLeafStep() ||
        this.simplifyLinearStep(false))
    );
  }

  private simplifyLinearStep(isBinary: boolean) {
    const linear: Equation[] = [];
    for (const equation of this.solver.toSimplify) {
      const poly = equation.poly.copy();
      if (isBinary ? poly.isBinary() : poly.isLinear()) linear.push(equation);
      poly.release();
    }
    if (linear.length === 0) return false;
    return this.simplifyLinear(linear);
  }

  private simplifyLinear(linear: Equation[]) {
    const solver = this.solver;
    const useList = this.getUseList();
    linear.sort((first, second) => first.poly.var() - second.poly.var());
    const trivial: Equation[] = [];
    let kept = 0;
    let hasConflict = false;
    for (const source of linear) {
      if (hasConflict) break;
      if (solver.isTrivial(source)) continue;
      const variable = source.poly.var();
      const uses = useList[variable];
      let isAllReduced = true;
      for (let index = 0, length = uses.length; index < length; index++) {
        const target = uses[index];
        if (source === target || solver.isTrivial(target)) continue;
        const targetPoly = target.poly.copy();
        if (!source.poly.isBinary() && !targetPoly.isLinear()) {
          isAllReduced = false;
          targetPoly.release();
          continue;
        }
        this.removeFromUse(target, useList, variable);
        const isLeadingTermChanged = solver.simplifyUsing(target, source);
        if (solver.isTrivial(target)) {
          trivial.push(target);
        } else if (solver.isConflict(target)) {
          solver.popEquation(target);
          solver.setConflict(target);
          hasConflict = true;
        } else if (isLeadingTermChanged) {
          solver.popEquation(target);
          solver.pushEquation(TO_SIMPLIFY, target);
        }
        this.addToUse(target, useList);
        targetPoly.release();
      }
      if (isAllReduced) linear[kept++] = source;
    }
    if (!hasConflict) {
      shrink(linear, kept);
      for (const source of linear) {
        solver.popEquation(source);
        solver.pushEquation(SOLVED, source);
      }
    }
    for (const equation of trivial) solver.delEquation(equation);
    return kept > 0 || hasConflict;
  }

  private simplifyCcStep() {
    const solver = this.solver;
    const los = new Map<number, Equation>();
    let isReduced = false;
    const update = new SetUpdate(solver.toSimplify);
    for (; update.i < update.size; update.i++) {
      const first = update.get();
      const poly = first.poly.copy();
      const lo = poly.lo();
      const second = los.get(lo.root) ?? first;
      if (second === first) los.set(lo.root, first);
      lo.release();
      const secondPoly = second.poly.copy();
      if (second !== first && this.isCcReducible(poly, secondPoly)) {
        const difference = poly.sub(second.poly);
        first.poly.assign(difference);
        difference.release();
        first.dep = mkJoin(first.dep, second.dep);
        isReduced = true;
        const isTrivial = solver.isTrivial(first);
        if (isTrivial) solver.retire(first);
        if (isTrivial || solver.checkConflict(first)) {
          secondPoly.release();
          poly.release();
          continue;
        }
      }
      update.nextj();
      secondPoly.release();
      poly.release();
    }
    update.finish();
    return isReduced;
  }

  private isCcReducible(poly: Pdd, secondPoly: Pdd) {
    const hi = poly.hi();
    const secondHi = hi.isVal() ? null : secondPoly.hi();
    const lo = secondHi === null || secondHi.isVal() ? poly.lo() : null;
    const isReducible = lo !== null && !lo.isVal();
    lo?.release();
    secondHi?.release();
    hi.release();
    return isReducible;
  }

  private simplifyLeafStep() {
    const solver = this.solver;
    const useList = this.getUseList();
    for (let index = 0; index < solver.toSimplify.length; index++) {
      const source = solver.toSimplify[index];
      const poly = source.poly.copy();
      if (poly.isVal() || !this.isHiVal(poly)) {
        poly.release();
        continue;
      }
      const leaves = useList[poly.var()].filter(
        (target) => target !== source && target.poly.varIsLeaf(poly.var()),
      );
      for (const target of leaves) {
        this.removeFromUse(target, useList);
        const isLeadingTermChanged = solver.simplifyUsing(target, source);
        this.addToUse(target, useList);
        if (solver.isTrivial(target)) {
          solver.delEquation(target);
        } else if (target.poly.isVal()) {
          solver.popEquation(target);
          solver.setConflict(target);
          poly.release();
          return true;
        } else if (isLeadingTermChanged) {
          solver.popEquation(target);
          solver.pushEquation(TO_SIMPLIFY, target);
        }
      }
      poly.release();
    }
    return false;
  }

  private simplifyElimPureStep() {
    const solver = this.solver;
    const useList = this.getUseList();
    const update = new SetUpdate(solver.toSimplify);
    let hasSolved = false;
    for (; update.i < update.size; update.i++) {
      const equation = update.get();
      const poly = equation.poly.copy();
      if (!poly.isVal() && this.isHiVal(poly) && useList[poly.var()].length === 1) {
        solver.pushEquation(SOLVED, equation);
        hasSolved = true;
      } else {
        update.nextj();
      }
      poly.release();
    }
    update.finish();
    return hasSolved;
  }

  private isHiVal(poly: Pdd) {
    const hi = poly.hi();
    const isVal = hi.isVal();
    hi.release();
    return isVal;
  }

  private addToUse(equation: Equation, useList: Equation[][]) {
    for (const variable of equation.poly.freeVars()) {
      while (useList.length <= variable) useList.push([]);
      useList[variable].push(equation);
    }
  }

  private removeFromUse(equation: Equation, useList: Equation[][], exceptVar = -1) {
    for (const variable of equation.poly.freeVars()) {
      if (variable === exceptVar) continue;
      while (useList.length <= variable) useList.push([]);
      const uses = useList[variable];
      const index = uses.indexOf(equation);
      if (index !== -1) uses.splice(index, 1);
    }
  }

  private getUseList() {
    const useList: Equation[][] = [];
    for (const equation of this.solver.toSimplify) this.addToUse(equation, useList);
    for (const equation of this.solver.processed) this.addToUse(equation, useList);
    return useList;
  }
}
