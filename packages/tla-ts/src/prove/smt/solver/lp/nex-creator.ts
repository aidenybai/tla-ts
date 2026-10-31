// Ported from Z3 (src/math/lp/nex_creator.h, src/math/lp/nex_creator.cpp), MIT license, see
// z3-license.txt. Builds, orders, and simplifies nex expressions. The order compares variables by
// weight, then by index, and simplification sorts products and sums by it and merges like terms.
// Z3 keeps every expression it allocates so that it can free them; here the collector does.
import { Rational } from "../rational";
import { getPower } from "./dep-intervals";
import {
  type Nex,
  type NexMul,
  type NexPow,
  type NexSum,
  type NexVar,
  containsVar,
  getDegree,
  getPowersFromMul,
  getVarsOfExpr,
  isElementary,
  isZeroScalar,
} from "./nex";

// occ: how many summands a variable divides, and its smallest power among them.
interface Occ {
  occs: number;
  power: number;
}

interface MapEntry<Value> {
  readonly key: Nex;
  value: Value;
}

export class NexCreator {
  readonly occurencesMap = new Map<number, Occ>();
  readonly powers = new Map<number, number>();
  private activeVarsWeights: number[] = [];

  // Assumes every variable is below k. Growing keeps the weights already set.
  setNumberOfVars(count: number) {
    const previousCount = this.activeVarsWeights.length;
    this.activeVarsWeights.length = count;
    this.activeVarsWeights.fill(0, previousCount);
  }

  setVarWeight(variable: number, weight: number) {
    this.activeVarsWeights[variable] = weight;
  }

  mkVar(variable: number): Nex {
    return { kind: "var", variable };
  }

  mkScalar(value: Rational): Nex {
    return { kind: "scalar", value };
  }

  mkSum(children: Nex[]): NexSum {
    return { kind: "sum", children: [...children] };
  }

  // mk_mul(e, es...): a rational multiplies the coefficient, an expression is a factor.
  mkMul(...factors: (Nex | Rational)[]): NexMul {
    const children: NexPow[] = [];
    let coeff = Rational.one;
    for (const factor of factors) {
      if (factor instanceof Rational) coeff = coeff.mul(factor);
      else children.push({ expr: factor, power: 1 });
    }
    return this.mkMulWithPowers(coeff, children);
  }

  mkMulWithPowers(coeff: Rational, children: NexPow[]): NexMul {
    return { kind: "mul", coeff, children: [...children] };
  }

  // mul_factory::mk_reduced.
  private mkReducedMul(coeff: Rational, children: NexPow[]) {
    if (children.length === 0) return this.mkScalar(coeff);
    if (coeff.equals(Rational.one) && children.length === 1 && children[0].power === 1)
      return children[0].expr;
    return this.mkMulWithPowers(coeff, children);
  }

  gtVar(first: number, second: number) {
    const firstWeight = this.activeVarsWeights[first];
    const secondWeight = this.activeVarsWeights[second];
    return firstWeight !== secondWeight ? firstWeight > secondWeight : first > second;
  }

  // Scalars are the smallest, and the coefficient of a product does not count. Z3's
  // gt_for_sort_join_sum is the same order.
  gt(first: Nex, second: Nex): boolean {
    if (first === second) return false;
    if (first.kind === "var") return this.gtOnVarNex(first, second);
    if (first.kind === "scalar")
      return second.kind === "scalar" && first.value.compare(second.value) > 0;
    if (first.kind === "mul") return this.gtOnMulNex(first, second);
    if (second.kind === "sum") return this.gtOnSumSum(first, second);
    return this.gt(first.children[0], second);
  }

  private gtOnVarNex(first: NexVar, second: Nex): boolean {
    if (second.kind === "scalar") return true;
    if (second.kind === "var") return this.gtVar(first.variable, second.variable);
    if (second.kind === "mul")
      return getDegree(second) <= 1 && this.gtOnVarNex(first, second.children[0].expr);
    if (this.gt(first, second.children[0])) return true;
    return !this.gt(second.children[0], first);
  }

  private gtOnMulNex(mul: NexMul, second: Nex): boolean {
    if (second.kind === "scalar") return false;
    if (second.kind === "var") return getDegree(mul) > 1 || this.gt(mul.children[0].expr, second);
    if (second.kind === "mul") return this.gtOnMulMul(mul, second);
    return this.gtOnMulNex(mul, second.children[0]);
  }

  private gtOnMulMul(first: NexMul, second: NexMul) {
    const firstDegree = getDegree(first);
    const secondDegree = getDegree(second);
    return firstDegree === secondDegree
      ? this.gtOnPowersMulSameDegree(first, second)
      : firstDegree > secondDegree;
  }

  private gtOnPowersMulSameDegree(first: NexMul, second: NexMul) {
    let firstPower = first.children[0].power;
    let secondPower = second.children[0].power;
    for (
      let firstIndex = 0, secondIndex = 0;
      firstIndex < first.children.length && secondIndex < second.children.length;
    ) {
      if (this.gt(first.children[firstIndex].expr, second.children[secondIndex].expr)) return true;
      if (this.gt(second.children[secondIndex].expr, first.children[firstIndex].expr)) return false;
      if (firstPower > secondPower) return true;
      if (firstPower < secondPower) return false;
      firstIndex++;
      secondIndex++;
      if (firstIndex < first.children.length) firstPower = first.children[firstIndex].power;
      if (secondIndex < second.children.length) secondPower = second.children[secondIndex].power;
    }
    return false;
  }

  private gtOnSumSum(first: NexSum, second: NexSum) {
    const size = Math.min(first.children.length, second.children.length);
    for (let index = 0; index < size; index++) {
      if (this.gt(first.children[index], second.children[index])) return true;
      if (this.gt(second.children[index], first.children[index])) return false;
    }
    return first.children.length > size;
  }

  // A std::map ordered by gt, greatest first: the index of the key, inserting it when absent.
  private findOrInsert<Value>(entries: MapEntry<Value>[], key: Nex, value: Value) {
    let low = 0;
    let high = entries.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (this.gt(entries[middle].key, key)) low = middle + 1;
      else high = middle;
    }
    if (low < entries.length && !this.gt(key, entries[low].key))
      return { index: low, isFound: true };
    entries.splice(low, 0, { key, value });
    return { index: low, isFound: false };
  }

  simplify(expr: Nex): Nex {
    if (expr.kind === "mul") return this.simplifyMul(expr);
    if (expr.kind === "sum") return this.simplifySum(expr);
    return expr;
  }

  // eat_scalar_pow: the coefficient times the factor raised to power when the factor is a
  // constant, else null.
  private eatScalarPow(coeff: Rational, child: NexPow, power: number) {
    if (child.expr.kind === "mul" && child.expr.children.length === 0)
      return child.expr.coeff.equals(Rational.one)
        ? coeff
        : coeff.mul(getPower(child.expr.coeff, child.power * power));
    if (child.expr.kind !== "scalar") return null;
    return child.expr.value.equals(Rational.one)
      ? coeff
      : coeff.mul(getPower(child.expr.value, child.power * power));
  }

  // simplify_mul with simplify_children_of_mul: folds the constant factors into the coefficient,
  // flattens the product factors, and merges equal factors into powers.
  simplifyMul(mul: NexMul): Nex {
    const children: NexPow[] = [];
    const toPromote: NexPow[] = [];
    for (const child of mul.children) {
      const eaten = this.eatScalarPow(mul.coeff, child, 1);
      if (eaten !== null) {
        mul.coeff = eaten;
        continue;
      }
      const simplified = { expr: this.simplify(child.expr), power: child.power };
      if (simplified.expr.kind === "mul") toPromote.push(simplified);
      else children.push(simplified);
    }
    for (const child of toPromote) {
      if (child.expr.kind !== "mul") continue;
      for (const grandchild of child.expr.children) {
        const eaten = this.eatScalarPow(mul.coeff, grandchild, child.power);
        if (eaten !== null) mul.coeff = eaten;
        else children.push({ expr: grandchild.expr, power: grandchild.power * child.power });
      }
      mul.coeff = mul.coeff.mul(getPower(child.expr.coeff, child.power));
    }
    mul.children = this.mulToPowers(children);
    if (mul.children.length === 1 && mul.children[0].power === 1 && mul.coeff.equals(Rational.one))
      return mul.children[0].expr;
    if (mul.children.length === 0 || mul.coeff.isZero()) return this.mkScalar(mul.coeff);
    return mul;
  }

  // The map already orders the factors by gt, so Z3's sort that follows changes nothing.
  private mulToPowers(children: NexPow[]): NexPow[] {
    const entries: MapEntry<number>[] = [];
    for (const child of children) {
      const found = this.findOrInsert(entries, child.expr, child.power);
      if (found.isFound) entries[found.index].value += child.power;
    }
    return entries.map((entry) => ({ expr: entry.key, power: entry.value }));
  }

  simplifySum(sum: NexSum): Nex {
    this.simplifyChildrenOfSum(sum);
    if (sum.children.length === 1) return sum.children[0];
    if (sum.children.length === 0) return this.mkScalar(Rational.zero);
    return sum;
  }

  private simplifyChildrenOfSum(sum: NexSum) {
    const children: Nex[] = [];
    const toPromote: NexSum[] = [];
    for (const child of sum.children) {
      const simplified = this.simplify(child);
      if (simplified.kind === "sum") toPromote.push(simplified);
      else if (isZeroScalar(simplified)) continue;
      else if (simplified.kind === "mul" && simplified.coeff.isZero()) continue;
      else children.push(simplified);
    }
    for (const promoted of toPromote)
      for (const grandchild of promoted.children)
        if (!isZeroScalar(grandchild)) children.push(grandchild);
    sum.children = children;
    this.sortJoinSum(sum);
  }

  // sort_join_sum: merges the summands that differ only in their coefficient, a + 3bc + 2bc into
  // a + 5bc, sorts them by gt, and puts the sum of the scalars last. Like Z3, a merged product
  // takes the new coefficient in place.
  private sortJoinSum(sum: NexSum) {
    const entries: MapEntry<Rational>[] = [];
    let commonScalar = Rational.zero;
    for (const child of sum.children) {
      if (child.kind === "scalar") {
        commonScalar = commonScalar.add(child.value);
        continue;
      }
      const coeff = child.kind === "mul" ? child.coeff : Rational.one;
      const found = this.findOrInsert(entries, child, coeff);
      if (found.isFound) entries[found.index].value = entries[found.index].value.add(coeff);
    }
    sum.children = [];
    for (const entry of entries) {
      if (entry.value.isZero()) continue;
      if (entry.key.kind === "mul") {
        entry.key.coeff = entry.value;
        sum.children.push(this.simplify(entry.key));
      } else if (entry.value.equals(Rational.one)) sum.children.push(entry.key);
      else sum.children.push(this.mkMul(entry.value, entry.key));
    }
    if (!commonScalar.isZero()) sum.children.push(this.mkScalar(commonScalar));
  }

  clone(expr: Nex): Nex {
    if (expr.kind === "var") return this.mkVar(expr.variable);
    if (expr.kind === "scalar") return this.mkScalar(expr.value);
    if (expr.kind === "mul")
      return this.mkMulWithPowers(
        expr.coeff,
        expr.children.map((child) => ({ expr: this.clone(child.expr), power: child.power })),
      );
    return this.mkSum(expr.children.map((child) => this.clone(child)));
  }

  // mk_div(a, j): a, a product or the variable itself, divided by the variable once.
  mkDivByVar(expr: Nex, variable: number): Nex {
    if (expr.kind !== "mul") return this.mkScalar(Rational.one);
    const children: NexPow[] = [];
    let isSeen = false;
    for (const child of expr.children) {
      if (isSeen || !containsVar(child.expr, variable)) {
        children.push({ expr: this.clone(child.expr), power: child.power });
        continue;
      }
      if (child.expr.kind !== "var")
        children.push({ expr: this.mkDivByVar(child.expr, variable), power: 1 });
      if (child.power !== 1)
        children.push({ expr: this.clone(child.expr), power: child.power - 1 });
      isSeen = true;
    }
    return this.mkReducedMul(expr.coeff, children);
  }

  // mk_div_by_mul: each summand, a product or a variable, divided by the product of powers.
  mkDiv(expr: Nex, divisor: NexMul): Nex {
    if (expr.kind === "sum")
      return this.mkSum(expr.children.map((child) => this.mkDiv(child, divisor)));
    if (expr.kind !== "mul") return this.mkScalar(Rational.one);
    getPowersFromMul(divisor, this.powers);
    const children: NexPow[] = [];
    for (const child of expr.children) {
      if (child.expr.kind !== "var") {
        children.push({ expr: this.clone(child.expr), power: child.power });
        continue;
      }
      const variable = child.expr.variable;
      const divisorPower = this.powers.get(variable);
      if (divisorPower === undefined) {
        children.push({ expr: this.clone(child.expr), power: child.power });
        continue;
      }
      if (child.power > divisorPower) {
        children.push({ expr: this.mkVar(variable), power: child.power - divisorPower });
        this.powers.delete(variable);
      } else if (child.power === divisorPower) this.powers.delete(variable);
      // The factor is eaten by the divisor, whose variable keeps the rest of its power.
      else this.powers.set(variable, divisorPower - child.power);
    }
    return this.mkReducedMul(expr.coeff.div(divisor.coeff), children);
  }

  // canonize: a simplified copy with every product of a sum multiplied out. Z3's canonize_mul drops
  // the coefficient of the product; here the summands keep it.
  canonize(expr: Nex): Nex {
    if (isElementary(expr)) return this.clone(expr);
    const simplified = this.simplify(this.clone(expr));
    if (simplified.kind === "sum") {
      simplified.children = simplified.children.map((child) => this.canonize(child));
      return this.simplify(simplified);
    }
    return simplified.kind === "mul" ? this.canonizeMul(simplified) : simplified;
  }

  private canonizeMul(mul: NexMul): Nex {
    const sumIndex = mul.children.findIndex((child) => child.expr.kind === "sum");
    if (sumIndex === -1) return mul;
    const sumPow = mul.children[sumIndex];
    if (sumPow.expr.kind !== "sum") return mul;
    const sumClone = sumPow.power > 1 ? this.clone(sumPow.expr) : null;
    const summands = sumPow.expr.children.map((summand) => {
      const children: NexPow[] = [];
      if (sumClone !== null) children.push({ expr: sumClone, power: sumPow.power - 1 });
      children.push({ expr: summand, power: 1 });
      mul.children.forEach((child, index) => {
        if (index !== sumIndex) children.push({ expr: this.clone(child.expr), power: child.power });
      });
      return this.mkMulWithPowers(mul.coeff, children);
    });
    return this.canonize(this.mkSum(summands));
  }

  // equal: whether the canonical forms agree when each variable weighs its index.
  static equal(first: Nex, second: Nex) {
    const creator = new NexCreator();
    const count = Math.max(
      0,
      ...[...getVarsOfExpr(first), ...getVarsOfExpr(second)].map((variable) => variable + 1),
    );
    creator.setNumberOfVars(count);
    for (let variable = 0; variable < count; variable++) creator.setVarWeight(variable, variable);
    const firstCanonical = creator.canonize(first);
    const secondCanonical = creator.canonize(second);
    return !(
      creator.gt(firstCanonical, secondCanonical) || creator.gt(secondCanonical, firstCanonical)
    );
  }
}
