// Ported from Z3 (src/math/grobner/pdd_simplifier.h, src/math/grobner/pdd_simplifier.cpp), MIT
// license, see z3-license.txt. The extended linear pass works only modulo 2 and the dual
// elimination is disabled in Z3, so neither is ported.
import { mkJoin } from "./dependency";
import { Equation, PddSolver, SetUpdate, SOLVED, TO_SIMPLIFY } from "./pdd-solver";
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
    const linear = this.solver.toSimplify.filter((equation) =>
      isBinary ? equation.poly.isBinary() : equation.poly.isLinear(),
    );
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
      // Equations added to the uses of the variable during the walk are not walked.
      for (let index = 0, length = uses.length; index < length; index++) {
        const target = uses[index];
        if (source === target || solver.isTrivial(target)) continue;
        if (!source.poly.isBinary() && !target.poly.isLinear()) {
          isAllReduced = false;
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
    for (const equation of trivial) solver.popEquation(equation);
    return kept > 0 || hasConflict;
  }

  private simplifyCcStep() {
    const solver = this.solver;
    const los = new Map<number, Equation>();
    let isReduced = false;
    const update = new SetUpdate(solver.toSimplify);
    for (; update.i < update.size; update.i++) {
      const first = update.get();
      const poly = first.poly;
      const second = los.get(poly.lo().root) ?? first;
      if (second === first) los.set(poly.lo().root, first);
      if (
        second !== first &&
        (poly.hi().isVal() || second.poly.hi().isVal()) &&
        !poly.lo().isVal()
      ) {
        first.poly = poly.sub(second.poly);
        first.dep = mkJoin(first.dep, second.dep);
        isReduced = true;
        if (solver.isTrivial(first) || solver.checkConflict(first)) continue;
      }
      update.nextj();
    }
    update.finish();
    return isReduced;
  }

  private simplifyLeafStep() {
    const solver = this.solver;
    const useList = this.getUseList();
    for (let index = 0; index < solver.toSimplify.length; index++) {
      const source = solver.toSimplify[index];
      const poly = source.poly;
      if (poly.isVal() || !poly.hi().isVal()) continue;
      const leaves = useList[poly.var()].filter(
        (target) => target !== source && target.poly.varIsLeaf(poly.var()),
      );
      for (const target of leaves) {
        this.removeFromUse(target, useList);
        const isLeadingTermChanged = solver.simplifyUsing(target, source);
        this.addToUse(target, useList);
        if (solver.isTrivial(target)) {
          solver.popEquation(target);
        } else if (target.poly.isVal()) {
          solver.popEquation(target);
          solver.setConflict(target);
          return true;
        } else if (isLeadingTermChanged) {
          solver.popEquation(target);
          solver.pushEquation(TO_SIMPLIFY, target);
        }
      }
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
      const poly = equation.poly;
      if (!poly.isVal() && poly.hi().isVal() && useList[poly.var()].length === 1) {
        solver.pushEquation(SOLVED, equation);
        hasSolved = true;
      } else {
        update.nextj();
      }
    }
    update.finish();
    return hasSolved;
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
