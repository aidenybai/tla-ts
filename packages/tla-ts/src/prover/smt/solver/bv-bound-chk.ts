// Ported from Z3 (src/tactic/bv/bv_bound_chk_tactic.cpp, src/ast/rewriter/bv_bounds.h,
// src/ast/rewriter/bv_bounds.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_BASIC,
  KIND_APP,
  OP_ADD,
  OP_AND,
  OP_ARRAY_MAP,
  OP_BADD,
  OP_EQ,
  OP_EXTRACT,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_SEQ_CONCAT,
  OP_SLEQ,
  OP_ULEQ,
  OP_XOR,
  SORT_BOOL,
} from "./ast";
import { isAssociativeBvOp } from "./bv-decl-plugin";
import { release } from "./expr-ref";
import type { Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { RewriterTpl } from "./rewriter-tpl";

const CONVERTED = 0;
const UNSAT = 1;
const UNDEF = 2;

const ASSOCIATIVE_OPS = new Set([OP_AND, OP_OR, OP_XOR, OP_ADD, OP_MUL, OP_SEQ_CONCAT]);

interface Interval {
  lo: bigint;
  hi: bigint;
}

interface NegatableInterval {
  variable: number;
  lo: bigint;
  hi: bigint;
  isNegated: boolean;
}

interface Constant {
  variable: number;
  value: bigint;
}

class BvBounds {
  private unsignedLowers: ObjMap<bigint>;
  private unsignedUppers: ObjMap<bigint>;
  private negativeIntervals: ObjMap<Interval[]>;
  private singletons: ObjMap<bigint>;
  private isOkay = true;

  constructor(private manager: AstManager) {
    const getHash = (expr: number) => manager.hashes[expr];
    this.unsignedLowers = new ObjMap(getHash);
    this.unsignedUppers = new ObjMap(getHash);
    this.negativeIntervals = new ObjMap(getHash);
    this.singletons = new ObjMap(getHash);
  }

  // The result comes with a reference, and -1 is Z3's BR_FAILED.
  rewrite(limit: number, decl: number, args: number[]) {
    const manager = this.manager;
    const funcDecl = manager.funcDecls[decl];
    if (funcDecl.range !== SORT_BOOL) return -1;
    if ((funcDecl.op !== OP_OR && funcDecl.op !== OP_AND) || args.length > limit) return -1;
    const isNegated = funcDecl.op === OP_OR;
    const intervals: NegatableInterval[] = [];
    const lengths: number[] = [];
    const isIgnored: boolean[] = [];
    let head = 0;
    for (let index = 0; index < args.length && this.isOkay; index++) {
      const converted = this.convert(args[index], intervals, isNegated);
      isIgnored.push(converted === UNDEF);
      if (converted === UNSAT) this.isOkay = false;
      if (converted !== CONVERTED) continue;
      for (const interval of intervals.slice(head))
        this.isOkay =
          this.isOkay &&
          this.addBoundUnsigned(interval.variable, interval.lo, interval.hi, interval.isNegated);
      lengths.push(intervals.length);
      head = intervals.length;
    }
    if (!this.isOkay || !this.isSat()) {
      const result = isNegated ? manager.trueExpr : manager.falseExpr;
      manager.incRef(result);
      return result;
    }
    head = 0;
    let count = 0;
    const newArgs: number[] = [];
    let hasSingletons = false;
    for (const [index, arg] of args.entries()) {
      if (isIgnored[index]) {
        newArgs.push(arg);
        continue;
      }
      const isRedundant = head === lengths[count];
      let isSingleton = false;
      if (head < lengths[count]) {
        const variable = intervals[head].variable;
        isSingleton = this.getLower(variable) === this.getUpper(variable);
        head = lengths[count];
      }
      if (!isRedundant && !isSingleton) newArgs.push(arg);
      hasSingletons ||= isSingleton;
      count++;
    }
    if (newArgs.length === args.length && !hasSingletons) return -1;
    for (const entry of this.singletons) {
      const eq = manager.mkEq(
        entry[0],
        manager.mkBvNumeral(entry[1], manager.getBvSize(manager.sorts[entry[0]])),
      );
      newArgs.push(isNegated ? manager.mkApp(OP_NOT, [eq], SORT_BOOL) : eq);
    }
    const result =
      newArgs.length === 0
        ? isNegated
          ? manager.falseExpr
          : manager.trueExpr
        : newArgs.length === 1
          ? newArgs[0]
          : manager.mkApp(isNegated ? OP_OR : OP_AND, newArgs, SORT_BOOL);
    manager.incRef(result);
    return result;
  }

  private getSize(expr: number) {
    return this.manager.getBvSize(this.manager.sorts[expr]);
  }

  private getLower(variable: number) {
    return this.unsignedLowers.get(variable) ?? 0n;
  }

  private getUpper(variable: number) {
    return this.unsignedUppers.get(variable) ?? (1n << BigInt(this.getSize(variable))) - 1n;
  }

  private getNumeral(expr: number) {
    return this.manager.isBvNumeral(expr) ? this.manager.getBvNumeralValue(expr) : undefined;
  }

  private isOp(expr: number, op: number, numArgs: number) {
    const manager = this.manager;
    return (
      manager.kinds[expr] === KIND_APP &&
      manager.getOp(expr) === op &&
      manager.getNumArgs(expr) === numArgs
    );
  }

  private isBound(expr: number) {
    const manager = this.manager;
    return (
      manager.kinds[expr] === KIND_APP &&
      manager.isBvSort(manager.sorts[expr]) &&
      manager.getOp(expr) !== OP_BADD &&
      !manager.isBvNumeral(expr)
    );
  }

  private getExtract(expr: number) {
    const parameters = this.manager.funcDecls[this.manager.decls[expr]].parameters;
    return { high: parameters[0], low: parameters[1] };
  }

  private getConstantAdd(expr: number): Constant | undefined {
    const manager = this.manager;
    if (!this.isOp(expr, OP_BADD, 2)) return { variable: expr, value: 0n };
    const lhs = manager.getArg(expr, 0);
    const rhs = manager.getArg(expr, 1);
    const rhsValue = this.getNumeral(rhs);
    if (this.isBound(lhs) && rhsValue !== undefined) return { variable: lhs, value: rhsValue };
    const lhsValue = this.getNumeral(lhs);
    if (this.isBound(rhs) && lhsValue !== undefined) return { variable: rhs, value: lhsValue };
    return undefined;
  }

  private record(
    variable: number,
    lo: bigint,
    hi: bigint,
    isNegated: boolean,
    intervals: NegatableInterval[],
  ) {
    const vmin = this.getLower(variable);
    const vmax = this.getUpper(variable);
    let isLoMin = lo <= vmin;
    let isHiMax = hi >= vmax;
    let isStillNegated = isNegated;
    let newLo = lo;
    let newHi = hi;
    if (isNegated) {
      if (isLoMin && isHiMax) return UNSAT;
      if (lo > vmax || hi < vmin) return CONVERTED;
      if (isLoMin) {
        isStillNegated = false;
        newLo = hi + 1n;
        newHi = vmax;
        isLoMin = newLo <= vmin;
        isHiMax = true;
      } else if (isHiMax) {
        isStillNegated = false;
        newHi = lo - 1n;
        newLo = vmin;
        isHiMax = newHi >= vmax;
        isLoMin = true;
      }
    }
    if (isLoMin) newLo = vmin;
    if (isHiMax) newHi = vmax;
    if (newLo > newHi) return isStillNegated ? CONVERTED : UNSAT;
    if (isLoMin && isHiMax) return isStillNegated ? UNSAT : CONVERTED;
    intervals.push({ variable, lo: newLo, hi: newHi, isNegated: isStillNegated });
    return CONVERTED;
  }

  // Matches bv_rewriter's (and (= ((_ extract n k) a) #b0..) (bvule ((_ extract k-1 0) a) c)).
  private getUleq(expr: number): Constant | undefined {
    const manager = this.manager;
    if (!this.isOp(expr, OP_AND, 2)) return undefined;
    const eq = manager.getArg(expr, 0);
    const ule = manager.getArg(expr, 1);
    if (!this.isOp(eq, OP_EQ, 2) || !this.isOp(ule, OP_ULEQ, 2)) return undefined;
    const eqLhs = manager.getArg(eq, 0);
    const uleLhs = manager.getArg(ule, 0);
    if (!this.isOp(eqLhs, OP_EXTRACT, 1)) return undefined;
    const target = manager.getArg(eqLhs, 0);
    const eqExtract = this.getExtract(eqLhs);
    if (eqExtract.high !== this.getSize(target) - 1) return undefined;
    if (this.getNumeral(manager.getArg(eq, 1)) !== 0n) return undefined;
    if (!this.isOp(uleLhs, OP_EXTRACT, 1) || manager.getArg(uleLhs, 0) !== target) return undefined;
    const uleExtract = this.getExtract(uleLhs);
    if (uleExtract.high + 1 !== eqExtract.low || uleExtract.low !== 0) return undefined;
    const value = this.getNumeral(manager.getArg(ule, 1));
    return value === undefined ? undefined : { variable: target, value };
  }

  private convert(expr: number, intervals: NegatableInterval[], isNegatedOuter: boolean) {
    const manager = this.manager;
    const isNot = this.isOp(expr, OP_NOT, 1);
    const isNegated = isNot ? !isNegatedOuter : isNegatedOuter;
    const constraint = isNot ? manager.getArg(expr, 0) : expr;
    const uleq = this.getUleq(constraint);
    if (uleq !== undefined && this.isBound(uleq.variable))
      return this.record(uleq.variable, 0n, uleq.value, isNegated, intervals);
    if (this.isOp(constraint, OP_EQ, 2)) {
      const lhs = manager.getArg(constraint, 0);
      if (this.getNumeral(manager.getArg(constraint, 1)) === 0n && this.isOp(lhs, OP_EXTRACT, 1)) {
        const target = manager.getArg(lhs, 0);
        const extract = this.getExtract(lhs);
        if (extract.high + 1 === this.getSize(target))
          return this.record(target, 0n, (1n << BigInt(extract.low)) - 1n, isNegated, intervals);
      }
    }
    if (this.isOp(constraint, OP_ULEQ, 2)) {
      const lhs = manager.getArg(constraint, 0);
      const rhs = manager.getArg(constraint, 1);
      const mod = 1n << BigInt(this.getSize(lhs));
      const lhsValue = this.getNumeral(lhs);
      const rhsValue = this.getNumeral(rhs);
      if (this.isBound(lhs) && rhsValue !== undefined)
        return this.record(lhs, 0n, rhsValue, isNegated, intervals);
      if (this.isBound(rhs) && lhsValue !== undefined)
        return this.record(rhs, lhsValue, mod - 1n, isNegated, intervals);
      const lhsAdd = this.isOp(lhs, OP_BADD, 2)
        ? { value: this.getNumeral(manager.getArg(lhs, 0)), variable: manager.getArg(lhs, 1) }
        : undefined;
      const rhsAdd = this.isOp(rhs, OP_BADD, 2)
        ? { value: this.getNumeral(manager.getArg(rhs, 0)), variable: manager.getArg(rhs, 1) }
        : undefined;
      // val + v <= v
      if (lhsAdd?.value !== undefined && this.isBound(lhsAdd.variable) && lhsAdd.variable === rhs) {
        if (lhsAdd.value === 0n) return isNegated ? UNSAT : CONVERTED;
        return this.record(rhs, mod - lhsAdd.value, mod - 1n, isNegated, intervals);
      }
      // val1 <= val + v
      if (rhsAdd?.value !== undefined && this.isBound(rhsAdd.variable) && lhsValue !== undefined) {
        if (lhsValue === 0n) return isNegated ? UNSAT : CONVERTED;
        if (lhsValue < rhsAdd.value) {
          const lo = mod - rhsAdd.value;
          const hi = mod + lhsValue - rhsAdd.value - 1n;
          return lo <= hi
            ? this.record(rhsAdd.variable, lo, hi, !isNegated, intervals)
            : isNegated
              ? UNSAT
              : CONVERTED;
        }
        const lo = lhsValue - rhsAdd.value;
        const hi = mod - rhsAdd.value - 1n;
        return lo <= hi
          ? this.record(rhsAdd.variable, lo, hi, isNegated, intervals)
          : isNegated
            ? CONVERTED
            : UNSAT;
      }
      // val + v <= val1
      if (lhsAdd?.value !== undefined && this.isBound(lhsAdd.variable) && rhsValue !== undefined) {
        if (lhsAdd.value <= 0n || rhsValue <= 0n) return UNDEF;
        if (lhsAdd.value <= rhsValue) {
          const lo = rhsValue - lhsAdd.value + 1n;
          const hi = mod - lhsAdd.value - 1n;
          return lo <= hi
            ? this.record(lhsAdd.variable, lo, hi, !isNegated, intervals)
            : isNegated
              ? UNSAT
              : CONVERTED;
        }
        const lo = mod - lhsAdd.value;
        return this.record(lhsAdd.variable, lo, lo + rhsValue, isNegated, intervals);
      }
      // v + c1 <= v + c2
      const first = this.getConstantAdd(lhs);
      const second = this.getConstantAdd(rhs);
      if (first !== undefined && second !== undefined && first.variable === second.variable) {
        if (first.value === second.value) return isNegated ? UNSAT : CONVERTED;
        return first.value < second.value
          ? this.record(
              first.variable,
              mod - second.value,
              mod - first.value - 1n,
              !isNegated,
              intervals,
            )
          : this.record(
              first.variable,
              mod - first.value,
              mod - second.value - 1n,
              isNegated,
              intervals,
            );
      }
    }
    if (this.isOp(constraint, OP_SLEQ, 2)) {
      const lhs = manager.getArg(constraint, 0);
      const rhs = manager.getArg(constraint, 1);
      const size = this.getSize(lhs);
      const half = 1n << BigInt(size - 1);
      const getSigned = (value: bigint) => (value >= half ? value - (half << 1n) : value);
      const lhsValue = this.getNumeral(lhs);
      const rhsValue = this.getNumeral(rhs);
      if (this.isBound(lhs) && rhsValue !== undefined)
        return this.convertSigned(lhs, -half, getSigned(rhsValue), isNegated, intervals);
      if (this.isBound(rhs) && lhsValue !== undefined)
        return this.convertSigned(rhs, getSigned(lhsValue), half - 1n, isNegated, intervals);
    }
    return UNDEF;
  }

  private convertSigned(
    variable: number,
    lo: bigint,
    hi: bigint,
    isNegated: boolean,
    intervals: NegatableInterval[],
  ) {
    if (lo >= 0n && hi >= 0n) return this.record(variable, lo, hi, isNegated, intervals);
    const mod = 1n << BigInt(this.getSize(variable));
    if (lo < 0n && hi < 0n) return this.record(variable, mod + lo, mod + hi, isNegated, intervals);
    if (isNegated) {
      const first = this.record(variable, mod + lo, mod - 1n, true, intervals);
      const second = this.record(variable, 0n, hi, true, intervals);
      return first === UNSAT || second === UNSAT ? UNSAT : CONVERTED;
    }
    const newLo = hi + 1n;
    const newHi = mod + lo - 1n;
    return newLo <= newHi ? this.record(variable, newLo, newHi, true, intervals) : CONVERTED;
  }

  private addBoundUnsigned(variable: number, lo: bigint, hi: bigint, isNegated: boolean) {
    const isLoMin = lo === 0n;
    const isHiMax = hi === (1n << BigInt(this.getSize(variable))) - 1n;
    if (isNegated) {
      if (isLoMin && isHiMax) {
        this.isOkay = false;
        return false;
      }
      if (isLoMin) return this.boundLo(variable, hi + 1n);
      if (isHiMax) return this.boundUp(variable, lo - 1n);
      const existing = this.negativeIntervals.get(variable);
      if (existing === undefined) this.negativeIntervals.set(variable, [{ lo, hi }]);
      else existing.push({ lo, hi });
      return this.isOkay;
    }
    if (!isLoMin) this.isOkay = this.boundLo(variable, lo) && this.isOkay;
    if (!isHiMax) this.isOkay = this.boundUp(variable, hi) && this.isOkay;
    return this.isOkay;
  }

  private boundLo(variable: number, lo: bigint) {
    const existing = this.unsignedLowers.get(variable);
    this.unsignedLowers.set(variable, existing !== undefined && existing >= lo ? existing : lo);
    return this.isOkay;
  }

  private boundUp(variable: number, hi: bigint) {
    const existing = this.unsignedUppers.get(variable);
    this.unsignedUppers.set(variable, existing !== undefined && existing <= hi ? existing : hi);
    return this.isOkay;
  }

  private isSat() {
    if (!this.isOkay) return false;
    const seen = new Set<number>();
    // Z3 iterates the bound maps while is_sat(v) inserts into them, which can free the table it
    // iterates. Each map's keys are taken when its loop starts instead.
    for (const bounds of [this.unsignedLowers, this.unsignedUppers, this.negativeIntervals])
      for (const variable of Array.from(bounds.keys())) {
        if (seen.has(variable)) continue;
        seen.add(variable);
        if (!this.isSatVariable(variable)) return false;
      }
    return true;
  }

  private isSatVariable(variable: number) {
    if (!this.isOkay) return false;
    const lower = this.getLower(variable);
    const upper = this.getUpper(variable);
    if (lower > upper) return false;
    let isSat = false;
    let newLo = lower;
    let newHi = lower - 1n;
    let pointer = lower;
    const negatives = this.negativeIntervals.get(variable) ?? [];
    negatives.sort((first, second) => (first.lo < second.lo ? -1 : first.lo > second.lo ? 1 : 0));
    for (const negative of negatives) {
      if (pointer > negative.hi) continue;
      if (pointer < negative.lo) {
        if (!isSat) newLo = pointer;
        newHi = negative.lo - 1n > upper ? upper : negative.lo - 1n;
        isSat = true;
      }
      pointer = negative.hi + 1n;
      if (pointer > upper) break;
    }
    if (pointer <= upper) {
      if (!isSat) newLo = pointer;
      newHi = upper;
      isSat = true;
    }
    if (newHi < upper) this.boundUp(variable, newHi);
    if (newLo > lower) this.boundLo(variable, newLo);
    if (isSat && newHi === newLo) this.singletons.set(variable, newLo);
    return isSat;
  }
}

class BvBoundChkRewriter extends RewriterTpl {
  constructor(
    manager: AstManager,
    private limit: number,
  ) {
    super(manager);
  }

  isFlatAssoc(decl: number): boolean {
    const funcDecl = this.manager.funcDecls[decl];
    return funcDecl.op === OP_ARRAY_MAP
      ? this.isFlatAssoc(funcDecl.parameters[0])
      : ASSOCIATIVE_OPS.has(funcDecl.op) || isAssociativeBvOp(funcDecl.op);
  }

  isRewritingPatterns() {
    return false;
  }

  reduceApp(decl: number, args: number[]) {
    if (this.manager.funcDecls[decl].family !== FAMILY_BASIC) return -1;
    return new BvBounds(this.manager).rewrite(this.limit, decl, args);
  }
}

export const runBvBoundChk = (manager: AstManager, limit: number) => (goal: Goal) => {
  if (goal.isProofsEnabled)
    throw new SmtTacticError("bv-bound-chk does not support proof production");
  if (goal.isCoresEnabled)
    throw new SmtTacticError("bv-bound-chk does not support unsat core production");
  const rewriter = new BvBoundChkRewriter(manager, limit);
  let rewritten = -1;
  const size = goal.forms.size;
  for (let index = 0; index < size && !goal.isInconsistent; index++) {
    const next = rewriter.rewrite(goal.forms.items[index]);
    release(manager, rewritten);
    rewritten = next;
    goal.update(index, rewritten);
  }
  release(manager, rewritten);
  rewriter.release();
  goal.depth++;
  return [goal];
};
