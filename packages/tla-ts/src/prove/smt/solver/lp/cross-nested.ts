// Ported from Z3 (src/math/lp/cross_nested.h), MIT license, see z3-license.txt. Enumerates the
// cross-nested forms of a sum, such as x*(y + z) + w for x*y + x*z + w, and calls back on each
// until the callback returns true or 100 forms are reported. A form is built by rewriting the
// expression in place: the front holds the slots of the subsums still to split.
//
// The occurrence map is a Map in insertion order, where Z3 has an unordered_map. So when several
// variables divide every summand, the extracted common factor may list them in another order.
import { Rational } from "../rational";
import {
  type Nex,
  type NexMul,
  type NexSum,
  containsVar,
  getPowersFromMul,
  getVarsOfExpr,
  isLinear,
} from "./nex";
import type { NexCreator } from "./nex-creator";

// A place that holds an expression, where Z3 has a nex**.
interface NexSlot {
  get(): Nex;
  set(value: Nex): void;
}

interface Limit {
  inc(): boolean;
}

const getMulChildSlot = (mul: NexMul, index: number): NexSlot => ({
  get: () => mul.children[index].expr,
  set: (value) => {
    mul.children[index] = { expr: value, power: mul.children[index].power };
  },
});

const getSumChildSlot = (sum: NexSum, index: number): NexSlot => ({
  get: () => sum.children[index],
  set: (value) => {
    sum.children[index] = value;
  },
});

const isDivisibleByVar = (expr: Nex, variable: number) =>
  (expr.kind === "mul" && containsVar(expr, variable)) ||
  (expr.kind === "var" && expr.variable === variable);

// has_common_factor: whether a variable of the first summand divides the rest. A sum that
// simplified to one term counts as a sum of that term.
const hasCommonFactor = (expr: Nex) => {
  const children = expr.kind === "sum" ? expr.children : [expr];
  for (const variable of getVarsOfExpr(children[0]))
    if (children.slice(1).every((child) => containsVar(child, variable))) return true;
  return false;
};

export class CrossNested {
  private root: Nex = { kind: "sum", children: [] };
  private isDone = false;
  private isLimitExceeded = false;
  private reported = 0;
  private isRandomBit = false;

  constructor(
    private readonly callOnResult: (expr: Nex) => boolean,
    private readonly varIsFixed: (variable: number) => boolean,
    private readonly limit: Limit,
    private randomSeed: number,
    readonly nexCreator: NexCreator,
  ) {}

  run(expr: Nex) {
    this.root = expr;
    const rootSlot: NexSlot = {
      get: () => this.root,
      set: (value) => {
        this.root = value;
      },
    };
    this.exploreExprOnFrontElem(rootSlot, []);
  }

  done() {
    return this.isDone;
  }

  private nextRandom() {
    this.randomSeed = (Math.imul(this.randomSeed, 214013) + 2531011) >>> 0;
    return (this.randomSeed >>> 16) & 0x7fff;
  }

  private report() {
    this.isDone = this.callOnResult(this.root) || ++this.reported > 100;
  }

  private extractCommonFactor(sum: NexSum) {
    const size = sum.children.length;
    const factors = [...this.nexCreator.occurencesMap]
      .filter((entry) => entry[1].occs === size)
      .map((entry) => ({ expr: this.nexCreator.mkVar(entry[0]), power: entry[1].power }));
    if (factors.length === 0) return null;
    return this.nexCreator.mkMulWithPowers(Rational.one, factors);
  }

  private proceedWithCommonFactor(slot: NexSlot, expr: NexSum, front: NexSlot[]) {
    const factor = this.extractCommonFactor(expr);
    if (factor === null) return false;
    const quotient = this.nexCreator.simplify(this.nexCreator.mkDiv(expr, factor));
    const product = this.nexCreator.mkMul(factor, quotient);
    slot.set(product);
    this.exploreExprOnFrontElem(getMulChildSlot(product, 1), front);
    return true;
  }

  private exploreExprOnFrontElemVars(slot: NexSlot, front: NexSlot[], vars: number[]) {
    const copyOfExpr = slot.get();
    const copyOfFront = front.map((frontSlot) => frontSlot.get());
    for (const variable of vars) {
      if (this.isDone || this.isLimitExceeded) return;
      if (this.varIsFixed(variable)) continue;
      this.exploreOfExprOnSumAndVar(slot, variable, [...front]);
      if (this.isDone || this.isLimitExceeded) return;
      slot.set(copyOfExpr);
      front.forEach((frontSlot, index) => frontSlot.set(copyOfFront[index]));
    }
  }

  private calcOccurences(sum: NexSum) {
    const occurences = this.nexCreator.occurencesMap;
    occurences.clear();
    this.nexCreator.powers.clear();
    for (const child of sum.children) {
      if (child.kind === "mul") {
        getPowersFromMul(child, this.nexCreator.powers);
        for (const [variable, power] of this.nexCreator.powers) {
          const occ = occurences.get(variable);
          if (occ === undefined) occurences.set(variable, { occs: 1, power });
          else {
            occ.occs++;
            occ.power = Math.min(occ.power, power);
          }
        }
      } else if (child.kind === "var") {
        const occ = occurences.get(child.variable);
        if (occ === undefined) occurences.set(child.variable, { occs: 1, power: 1 });
        else {
          occ.occs++;
          occ.power = 1;
        }
      }
    }
    for (const [variable, occ] of occurences) if (occ.occs <= 1) occurences.delete(variable);
  }

  // The variables to factor out, by occurrences, then by power, then by index in the direction
  // of a random bit.
  private getVarsFromOccurencesMap() {
    const occurences = this.nexCreator.occurencesMap;
    this.isRandomBit = this.nextRandom() % 2 === 1;
    return [...occurences.keys()].sort((first, second) => {
      const firstOcc = occurences.get(first);
      const secondOcc = occurences.get(second);
      if (firstOcc === undefined || secondOcc === undefined) return 0;
      if (firstOcc.occs !== secondOcc.occs) return secondOcc.occs - firstOcc.occs;
      if (firstOcc.power !== secondOcc.power) return secondOcc.power - firstOcc.power;
      return this.isRandomBit ? first - second : second - first;
    });
  }

  private exploreExprOnFrontElem(slot: NexSlot, front: NexSlot[]) {
    if (this.isDone || this.isLimitExceeded) return;
    if (!this.limit.inc()) {
      this.isLimitExceeded = true;
      return;
    }
    const expr = slot.get();
    // A front element is a sum, unlike in Z3, which would misread anything else as one.
    if (expr.kind === "sum") {
      this.calcOccurences(expr);
      // Z3 passes a copy of the front here.
      if (this.proceedWithCommonFactor(slot, expr, [...front])) return;
      const vars = this.getVarsFromOccurencesMap();
      if (vars.length > 0) return this.exploreExprOnFrontElemVars(slot, front, vars);
    }
    const next = front.pop();
    if (next === undefined) return this.report();
    this.exploreExprOnFrontElem(next, front);
  }

  private exploreOfExprOnSumAndVar(slot: NexSlot, variable: number, front: NexSlot[]) {
    if (this.isDone || this.isLimitExceeded) return;
    if (!this.limit.inc()) {
      this.isLimitExceeded = true;
      return;
    }
    if (!this.splitWithVar(slot, variable, front)) return;
    const next = front.pop();
    if (next === undefined) return this.report();
    this.exploreExprOnFrontElem(next, front);
  }

  // split_with_var: e = j*a + b, where a sums the summands divisible by j, divided by it, and b
  // sums the rest. It is enough to split on the variables where a has no common factor.
  private splitWithVar(slot: NexSlot, variable: number, front: NexSlot[]) {
    const expr = slot.get();
    if (expr.kind !== "sum") return false;
    const quotients: Nex[] = [];
    const rest: Nex[] = [];
    for (const child of expr.children) {
      if (isDivisibleByVar(child, variable))
        quotients.push(this.nexCreator.mkDivByVar(child, variable));
      else rest.push(child);
    }
    const quotient = this.nexCreator.simplifySum(this.nexCreator.mkSum(quotients));
    const remainder = rest.length === 1 ? rest[0] : this.nexCreator.mkSum(rest);
    if (hasCommonFactor(quotient)) return false;
    const product = this.nexCreator.mkMul(this.nexCreator.mkVar(variable), quotient);
    const split = this.nexCreator.mkSum([product, remainder]);
    slot.set(split);
    if (!isLinear(quotient)) front.push(getMulChildSlot(product, 1));
    if (remainder.kind === "sum" && !isLinear(remainder)) front.push(getSumChildSlot(split, 1));
    return true;
  }
}
