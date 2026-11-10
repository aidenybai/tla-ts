// Ported from Z3 (src/ast/rewriter/guard_set.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  OP_AND,
  OP_EQ,
  OP_NOT,
  OP_OR,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { assign, release } from "./expr-ref";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import {
  type RangePredicate,
  guardToRangePredicate,
  intersectRanges,
  mkTopRange,
} from "./seq-range-predicate";

export interface GuardSetEval {
  status: number;
  witness: number;
}

export class GuardSetCache {
  private ranges = new Map<number, RangePredicate | undefined>();
  private trail: RefVector;

  constructor(manager: AstManager) {
    this.trail = new RefVector(manager);
  }

  reset() {
    this.ranges.clear();
    this.trail.reset();
  }

  maybeReset(cap: number) {
    if (this.ranges.size > cap) this.reset();
  }

  has(guard: number) {
    return this.ranges.has(guard);
  }

  get(guard: number) {
    return this.ranges.get(guard);
  }

  insert(guard: number, ranges: RangePredicate | undefined) {
    this.trail.push(guard);
    this.ranges.set(guard, ranges);
  }
}

export class GuardSet {
  private isChar: boolean;
  private isOk = true;
  private ranges: RangePredicate;
  private guard = -1;

  constructor(
    private manager: AstManager,
    private sort: number,
    private variable: number,
    private cache?: GuardSetCache,
  ) {
    this.isChar = manager.isCharSort(sort);
    this.ranges = this.isChar ? mkTopRange(manager) : [];
    if (!this.isChar) this.guard = assign(manager, -1, manager.trueExpr);
  }

  release() {
    release(this.manager, this.guard);
    this.guard = -1;
  }

  conjoin(guard: number) {
    const manager = this.manager;
    if (!this.isOk) return;
    if (!this.isChar) {
      this.guard = assign(
        manager,
        this.guard,
        manager.mkApp(OP_AND, [this.guard, guard], SORT_BOOL),
      );
      return;
    }
    const cache = this.cache;
    if (cache !== undefined) {
      if (!cache.has(guard))
        cache.insert(guard, guardToRangePredicate(manager, this.variable, guard));
      const cached = cache.get(guard);
      if (cached === undefined) {
        this.isOk = false;
        return;
      }
      this.ranges = intersectRanges(this.ranges, cached);
      return;
    }
    const ranges = guardToRangePredicate(manager, this.variable, guard);
    if (ranges === undefined) this.isOk = false;
    else this.ranges = intersectRanges(this.ranges, ranges);
  }

  eval(isWitnessWanted: boolean): GuardSetEval {
    if (!this.isOk) return { status: L_UNDEF, witness: -1 };
    if (!this.isChar) return this.evalGeneric(isWitnessWanted);
    if (this.ranges.length === 0) return { status: L_FALSE, witness: -1 };
    return {
      status: L_TRUE,
      witness: isWitnessWanted ? this.manager.mkChar(this.ranges[0]) : -1,
    };
  }

  private collectConsts(guard: number, consts: number[]) {
    const manager = this.manager;
    const op = manager.getOp(guard);
    if (op === OP_AND || op === OP_OR) {
      for (const arg of manager.getArgs(guard)) this.collectConsts(arg, consts);
      return;
    }
    if (op === OP_NOT) {
      this.collectConsts(manager.getArg(guard, 0), consts);
      return;
    }
    if (op !== OP_EQ) return;
    const first = manager.getArg(guard, 0);
    const second = manager.getArg(guard, 1);
    if (first === this.variable && second !== this.variable) consts.push(second);
    else if (second === this.variable && first !== this.variable) consts.push(first);
  }

  private evalAt(guard: number, candidate: number): number {
    const manager = this.manager;
    if (manager.isTrue(guard)) return L_TRUE;
    if (manager.isFalse(guard)) return L_FALSE;
    const op = manager.getOp(guard);
    if (op === OP_NOT) return -this.evalAt(manager.getArg(guard, 0), candidate);
    if (op === OP_AND || op === OP_OR) {
      const absorbing = op === OP_AND ? L_FALSE : L_TRUE;
      let result = -absorbing;
      for (const arg of manager.getArgs(guard)) {
        const value = this.evalAt(arg, candidate);
        if (value === absorbing) return absorbing;
        if (value === L_UNDEF) result = L_UNDEF;
      }
      return result;
    }
    if (op !== OP_EQ) return L_UNDEF;
    const first = manager.getArg(guard, 0);
    const second = manager.getArg(guard, 1);
    const other = first === this.variable ? second : second === this.variable ? first : -1;
    if (other === -1) return L_UNDEF;
    if (other === this.variable) return L_TRUE;
    return candidate === other ? L_TRUE : L_FALSE;
  }

  private mkFresh(consts: number[]) {
    const manager = this.manager;
    const sort = this.sort;
    if (sort === SORT_BOOL) {
      if (!consts.some((expr) => manager.isTrue(expr))) return manager.trueExpr;
      if (!consts.some((expr) => manager.isFalse(expr))) return manager.falseExpr;
      return -1;
    }
    if (sort === SORT_INT || sort === SORT_REAL) {
      let max: Rational | undefined;
      for (const expr of consts) {
        if (!manager.isNumeral(expr)) continue;
        const value = manager.getRationalValue(expr);
        if (max === undefined || value.compare(max) > 0) max = value;
      }
      return manager.mkNumeralOfSort(
        max === undefined ? Rational.zero : max.add(Rational.one),
        sort,
      );
    }
    if (!manager.isBvSort(sort)) return -1;
    const width = manager.getBvSize(sort);
    for (let candidate = 0n; candidate <= BigInt(consts.length); candidate++)
      if (
        !consts.some(
          (expr) => manager.isBvNumeral(expr) && manager.getBvNumeralValue(expr) === candidate,
        )
      )
        return manager.mkBvNumeral(candidate, width);
    return -1;
  }

  private evalGeneric(isWitnessWanted: boolean): GuardSetEval {
    const consts: number[] = [];
    this.collectConsts(this.guard, consts);
    let isUndefined = false;
    for (const candidate of consts) {
      const value = this.evalAt(this.guard, candidate);
      if (value === L_TRUE) return { status: L_TRUE, witness: isWitnessWanted ? candidate : -1 };
      if (value === L_UNDEF) isUndefined = true;
    }
    const fresh = this.mkFresh(consts);
    if (fresh === -1) isUndefined = true;
    else {
      const value = this.evalAt(this.guard, fresh);
      if (value === L_TRUE) return { status: L_TRUE, witness: isWitnessWanted ? fresh : -1 };
      if (value === L_UNDEF) isUndefined = true;
    }
    return { status: isUndefined ? L_UNDEF : L_FALSE, witness: -1 };
  }
}
