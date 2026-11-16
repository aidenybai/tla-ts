// Ported from Z3 (src/opt/opt_preprocess.cpp), MIT license, see z3-license.txt.
import { type AstManager, OP_OR, SORT_BOOL } from "./ast";
import { mkNot } from "./ast-util";
import { ObjMap } from "./hashtable";
import { L_FALSE, L_UNDEF } from "./lbool";
import type { MaxsatSolver, Soft } from "./maxsmt-base";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";

export class Preprocess {
  private trail: RefVector;

  constructor(
    private manager: AstManager,
    private solver: MaxsatSolver,
  ) {
    this.trail = new RefVector(manager);
  }

  private mkMap() {
    const manager = this.manager;
    return new ObjMap<Rational>((expr) => manager.hashes[expr]);
  }

  private soft2map(softs: readonly Soft[], fmls: number[]) {
    const result = this.mkMap();
    for (const soft of softs) {
      this.trail.push(soft.expr);
      const weight = result.get(soft.expr);
      if (weight !== undefined) result.set(soft.expr, weight.add(soft.weight));
      else {
        result.set(soft.expr, soft.weight);
        fmls.push(soft.expr);
      }
    }
    return result;
  }

  private dualize(soft: ObjMap<Rational>, fmls: number[]) {
    const result = this.mkMap();
    for (const [key, value] of soft) {
      const negated = mkNot(this.manager, key);
      this.trail.push(negated);
      result.set(negated, value);
    }
    for (let index = 0; index < fmls.length; index++) {
      fmls[index] = mkNot(this.manager, fmls[index]);
      this.trail.push(fmls[index]);
    }
    return result;
  }

  private processMutex(mutex: number[], soft: ObjMap<Rational>, lower: { value: Rational }) {
    if (mutex.length <= 1) return;
    const manager = this.manager;
    const getWeight = (expr: number) => soft.get(expr) ?? Rational.zero;
    mutex.sort(
      (first, second) =>
        getWeight(second).compare(getWeight(first)) || manager.ids[second] - manager.ids[first],
    );
    const weights = mutex.map(getWeight);
    for (const expr of mutex) soft.delete(expr);
    let weight = Rational.zero;
    for (let index = mutex.length; index-- > 0;) {
      const disjunction = manager.mkApp(OP_OR, mutex.slice(0, index + 1), SORT_BOOL);
      this.trail.push(disjunction);
      const current = weights[index];
      weight = current.sub(weight);
      lower.value = lower.value.add(weight.mul(Rational.of(BigInt(index))));
      soft.set(disjunction, weight);
      while (index > 0 && weights[index - 1].equals(current)) index--;
      weight = current;
    }
  }

  run(softs: readonly Soft[]) {
    const fmls: number[] = [];
    let soft = this.soft2map(softs, fmls);
    const lower = { value: Rational.zero };
    const found = this.solver.findMutexes(fmls);
    if (found.status === L_FALSE) return { soft: [...softs], lower: lower.value };
    if (found.status === L_UNDEF) return undefined;
    for (const mutex of found.mutexes) this.processMutex(mutex, soft, lower);
    if (found.mutexes.length === 0) {
      const dual = this.dualize(soft, fmls);
      const dualFound = this.solver.findMutexes(fmls);
      if (dualFound.status === L_FALSE) return { soft: [...softs], lower: lower.value };
      if (dualFound.status === L_UNDEF) return undefined;
      const dualLower = { value: Rational.zero };
      for (const mutex of dualFound.mutexes) this.processMutex(mutex, dual, dualLower);
      if (dual.size !== soft.size) soft = this.dualize(dual, fmls);
    }
    return {
      soft: [...soft].map(([expr, weight]) => ({ expr, weight, value: L_UNDEF })),
      lower: lower.value,
    };
  }

  release() {
    this.trail.reset();
  }
}
