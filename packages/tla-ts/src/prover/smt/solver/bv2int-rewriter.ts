// Ported from Z3 (src/tactic/arith/bv2int_rewriter.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  OP_ADD,
  OP_BADD,
  OP_BMUL,
  OP_BNEG,
  OP_BSHL,
  OP_BSMUL_NO_OVFL,
  OP_BSMUL_NO_UDFL,
  OP_BSUB,
  OP_BUMUL_NO_OVFL,
  OP_BUREM,
  OP_DISTINCT,
  OP_EQ,
  OP_EXTRACT,
  OP_GE,
  OP_GT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_OR,
  OP_SIGN_EXT,
  OP_SLEQ,
  OP_SUB,
  OP_UBV2INT,
  OP_ULEQ,
  OP_UMINUS,
  OP_ZERO_EXT,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { mkBvApp } from "./bv-decl-plugin";
import type { Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";

export const getNumBits = (value: bigint) => Math.max(1, value.toString(2).length);

export class Bv2IntContext {
  readonly sideConditions: RefVector;
  readonly power2: ObjMap<number>;
  private trail: RefVector;

  constructor(
    private manager: AstManager,
    readonly maxSize: number,
  ) {
    this.sideConditions = new RefVector(manager);
    this.power2 = new ObjMap((expr) => manager.hashes[expr]);
    this.trail = new RefVector(manager);
  }

  collectPower2(goal: Goal) {
    const manager = this.manager;
    for (const form of goal.forms.items) {
      if (manager.getOp(form) !== OP_OR) continue;
      let variable = -1;
      const bounds: bigint[] = [];
      let isOk = true;
      for (const arg of manager.getArgs(form)) {
        if (manager.getOp(arg) !== OP_EQ) {
          isOk = false;
          break;
        }
        const [left, right] = manager.getArgs(arg);
        const rightValue = manager.getNumeral(right);
        const leftValue = manager.getNumeral(left);
        if (rightValue !== undefined && (left === variable || variable === -1)) {
          variable = left;
          bounds.push(rightValue);
        } else if (leftValue !== undefined && (right === variable || variable === -1)) {
          variable = right;
          bounds.push(leftValue);
        } else {
          isOk = false;
          break;
        }
      }
      if (!isOk || variable === -1) continue;
      bounds.sort((first, second) => (first < second ? -1 : first > second ? 1 : 0));
      let power = 1n;
      let numBits = 0;
      for (const bound of bounds) {
        if (power !== bound) {
          isOk = false;
          break;
        }
        power *= 2n;
        numBits++;
      }
      if (!isOk) continue;
      let log2 = 0;
      for (let index = 1; index <= numBits; index *= 2) log2++;
      if (log2 === 0) continue;
      const logX = mkBvApp(
        manager,
        OP_ZERO_EXT,
        [manager.mkFreshConst("log2_v", manager.mkBvSort(log2))],
        [numBits - log2],
      );
      this.trail.push(logX);
      this.power2.set(variable, logX);
    }
  }

  release() {
    this.sideConditions.reset();
    this.trail.reset();
  }
}

export class Bv2IntRewriter extends RewriterTpl {
  constructor(
    manager: AstManager,
    private context: Bv2IntContext,
  ) {
    super(manager);
  }

  isRewritingPatterns() {
    return false;
  }

  reduceApp(decl: number, args: number[], _sort: number) {
    const manager = this.manager;
    const outer = manager.beginTemporaries();
    const result = this.mkAppCore(decl, args);
    if (result !== -1) manager.incRef(typeof result === "number" ? result : result.expr);
    manager.endTemporaries(outer);
    return result;
  }

  private mkAppCore(decl: number, args: number[]) {
    const manager = this.manager;
    const funcDecl = manager.funcDecls[decl];
    if (funcDecl.family === FAMILY_ARITH)
      switch (funcDecl.op) {
        case OP_LE:
          return this.mkLe(args[0], args[1]);
        case OP_GE:
          return this.mkLe(args[1], args[0]);
        case OP_LT:
          return { expr: manager.mkNot(this.mkArithLe(args[1], args[0])), depth: 2 };
        case OP_GT:
          return { expr: manager.mkNot(this.mkArithLe(args[0], args[1])), depth: 2 };
        case OP_ADD:
          return this.fold(args, (left, right) => this.mkAdd(left, right));
        case OP_MUL:
          return this.fold(args, (left, right) => this.mkMul(left, right));
        case OP_SUB:
          return this.fold(args, (left, right) => this.mkSub(left, right));
        case OP_MOD:
          return this.mkMod(args[0], args[1]);
        case OP_UMINUS:
          return this.mkUminus(args[0]);
        default:
          return -1;
      }
    if (funcDecl.family !== FAMILY_BASIC) return -1;
    if (funcDecl.op === OP_EQ) return this.mkEq(args[0], args[1]);
    if (funcDecl.op === OP_ITE) return this.mkIte(args[0], args[1], args[2]);
    if (funcDecl.op !== OP_DISTINCT || args.length < 2 || manager.sorts[args[0]] !== SORT_INT)
      return -1;
    const eqs: number[] = [];
    for (let first = 0; first < args.length; first++)
      for (let second = first + 1; second < args.length; second++) {
        const eq = this.mkEq(args[first], args[second]);
        if (eq === -1) return -1;
        eqs.push(eq);
      }
    return manager.mkNot(manager.mkOr(eqs));
  }

  private fold(args: number[], combine: (left: number, right: number) => number) {
    let result = args[0];
    for (let index = 1; index < args.length; index++) {
      result = combine(result, args[index]);
      if (result === -1) return -1;
    }
    return result;
  }

  private mkArithLe(left: number, right: number) {
    return this.manager.mkApp(OP_LE, [left, right], SORT_BOOL);
  }

  private mkArithSub(left: number, right: number) {
    return this.manager.mkApp(OP_SUB, [left, right], this.manager.sorts[left]);
  }

  private mkUbv2Int(expr: number) {
    return mkBvApp(this.manager, OP_UBV2INT, [expr]);
  }

  private mkLe(s: number, t: number) {
    const manager = this.manager;
    const sUbv = this.getUbv2Int(s);
    const tUbv = this.getUbv2Int(t);
    if (sUbv !== undefined && tUbv !== undefined) {
      const aligned = this.alignSizes(sUbv, tUbv, false);
      return mkBvApp(manager, OP_ULEQ, aligned);
    }
    const sDiff = this.getUbv2IntDiff(s);
    const tDiff = this.getUbv2IntDiff(t);
    if (sDiff !== undefined && tDiff !== undefined) {
      const aligned = this.alignSizes(
        this.mkBvAdd(sDiff[0], tDiff[1], false),
        this.mkBvAdd(tDiff[0], sDiff[1], false),
        false,
      );
      return mkBvApp(manager, OP_ULEQ, aligned);
    }
    const sSbv = this.getSbv2Int(s);
    const tSbv = this.getSbv2Int(t);
    if (sSbv !== undefined && tSbv !== undefined)
      return mkBvApp(manager, OP_SLEQ, this.alignSizes(sSbv, tSbv, true));
    return -1;
  }

  private mkIte(condition: number, s: number, t: number) {
    const manager = this.manager;
    const sUbv = this.getUbv2Int(s);
    const tUbv = this.getUbv2Int(t);
    if (sUbv !== undefined && tUbv !== undefined) {
      const aligned = this.alignSizes(sUbv, tUbv, false);
      return this.mkUbv2Int(
        manager.mkApp(OP_ITE, [condition, ...aligned], manager.sorts[aligned[0]]),
      );
    }
    const sSbv = this.getSbv2Int(s);
    const tSbv = this.getSbv2Int(t);
    if (sSbv !== undefined && tSbv !== undefined) {
      const aligned = this.alignSizes(sSbv, tSbv, true);
      return this.mkSbv2Int(
        manager.mkApp(OP_ITE, [condition, ...aligned], manager.sorts[aligned[0]]),
      );
    }
    return -1;
  }

  private mkEq(s: number, t: number) {
    const manager = this.manager;
    const sUbv = this.getUbv2Int(s);
    const tUbv = this.getUbv2Int(t);
    if (sUbv !== undefined && tUbv !== undefined) {
      const aligned = this.alignSizes(sUbv, tUbv, false);
      return manager.mkEq(aligned[0], aligned[1]);
    }
    const sDiff = this.getUbv2IntDiff(s);
    const tDiff = this.getUbv2IntDiff(t);
    if (sDiff !== undefined && tDiff !== undefined) {
      const aligned = this.alignSizes(
        this.mkBvAdd(sDiff[0], tDiff[1], false),
        this.mkBvAdd(sDiff[1], tDiff[0], false),
        false,
      );
      return manager.mkEq(aligned[0], aligned[1]);
    }
    const sSbv = this.getSbv2Int(s);
    const tSbv = this.getSbv2Int(t);
    if (sSbv !== undefined && tSbv !== undefined) {
      const aligned = this.alignSizes(sSbv, tSbv, true);
      return manager.mkEq(aligned[0], aligned[1]);
    }
    return -1;
  }

  private mkMod(s: number, t: number) {
    const manager = this.manager;
    const divisor = manager.isNumeral(t) ? manager.getRationalValue(t) : undefined;
    if (divisor === undefined || !divisor.isPositive()) return -1;
    const sUbv = this.getUbv2Int(s);
    const tUbv = this.getUbv2Int(t);
    if (sUbv !== undefined && tUbv !== undefined)
      return this.mkUbv2Int(mkBvApp(manager, OP_BUREM, this.alignSizes(sUbv, tUbv, false)));
    const sDiff = this.getUbv2IntDiff(s);
    if (sDiff !== undefined && tUbv !== undefined) {
      const [s2, t1] = this.alignSizes(sDiff[1], tUbv, false);
      const remainder = mkBvApp(manager, OP_BUREM, [s2, t1]);
      const sum = this.mkBvAdd(sDiff[0], mkBvApp(manager, OP_BSUB, [t1, remainder]), false);
      return this.mkUbv2Int(mkBvApp(manager, OP_BUREM, this.alignSizes(sum, t1, false)));
    }
    return -1;
  }

  private mkUminus(s: number) {
    const diff = this.getUbv2IntDiff(s);
    if (diff !== undefined)
      return this.mkArithSub(this.mkUbv2Int(diff[1]), this.mkUbv2Int(diff[0]));
    const sbv = this.getSbv2Int(s);
    if (sbv !== undefined) return this.mkSbv2Int(mkBvApp(this.manager, OP_BNEG, [sbv]));
    return -1;
  }

  private alignSizes(s: number, t: number, isSigned: boolean): [number, number] {
    const manager = this.manager;
    const sSize = manager.getBvSize(manager.sorts[s]);
    const tSize = manager.getBvSize(manager.sorts[t]);
    if (sSize > tSize) return [s, this.mkExtend(sSize - tSize, t, isSigned)];
    if (sSize < tSize) return [this.mkExtend(tSize - sSize, s, isSigned), t];
    return [s, t];
  }

  private isZero(expr: number) {
    const manager = this.manager;
    return manager.isBvNumeral(expr) && manager.getBvNumeralValue(expr) === 0n;
  }

  private isOne(expr: number) {
    const manager = this.manager;
    return manager.isBvNumeral(expr) && manager.getBvNumeralValue(expr) === 1n;
  }

  private mkBvAdd(s: number, t: number, isSigned: boolean) {
    if (this.isZero(s)) return t;
    if (this.isZero(t)) return s;
    const aligned = this.alignSizes(s, t, isSigned);
    return mkBvApp(this.manager, OP_BADD, [
      this.mkExtend(1, aligned[0], isSigned),
      this.mkExtend(1, aligned[1], isSigned),
    ]);
  }

  private mkAdd(s: number, t: number) {
    const sUbv = this.getUbv2Int(s);
    const tUbv = this.getUbv2Int(t);
    if (sUbv !== undefined && tUbv !== undefined)
      return this.mkUbv2Int(this.mkBvAdd(sUbv, tUbv, false));
    const sDiff = this.getUbv2IntDiff(s);
    const tDiff = this.getUbv2IntDiff(t);
    if (sDiff !== undefined && tDiff !== undefined)
      return this.mkArithSub(
        this.mkUbv2Int(this.mkBvAdd(sDiff[0], tDiff[0], false)),
        this.mkUbv2Int(this.mkBvAdd(sDiff[1], tDiff[1], false)),
      );
    const sSbv = this.getSbv2Int(s);
    const tSbv = this.getSbv2Int(t);
    if (sSbv !== undefined && tSbv !== undefined)
      return this.mkSbv2Int(this.mkBvAdd(sSbv, tSbv, true));
    return -1;
  }

  private mkBvMul(s: number, t: number, isSigned: boolean) {
    const manager = this.manager;
    if (this.isZero(s)) return s;
    if (this.isZero(t)) return t;
    if (this.isOne(s)) return t;
    if (this.isOne(t)) return s;
    let [s1, t1] = this.alignSizes(s, t, isSigned);
    const size = manager.getBvSize(manager.sorts[t1]);
    const maxBits = this.context.maxSize;
    if (size < maxBits) {
      const extension = 2 * size > maxBits ? maxBits - size : size;
      s1 = this.mkExtend(extension, s1, isSigned);
      t1 = this.mkExtend(extension, t1, isSigned);
    }
    if (2 * size > maxBits) {
      const sideConditions = this.context.sideConditions;
      if (isSigned) {
        sideConditions.push(mkBvApp(manager, OP_BSMUL_NO_OVFL, [s1, t1]));
        sideConditions.push(mkBvApp(manager, OP_BSMUL_NO_UDFL, [s1, t1]));
      } else sideConditions.push(mkBvApp(manager, OP_BUMUL_NO_OVFL, [s1, t1]));
    }
    return mkBvApp(manager, OP_BMUL, [s1, t1]);
  }

  private mkMul(s: number, t: number) {
    const manager = this.manager;
    const sShl = this.getShl1(s);
    const tShl = this.getShl1(t);
    const sUbv = this.getUbv2Int(s);
    const tUbv = this.getUbv2Int(t);
    const shifted =
      sShl !== undefined && tUbv !== undefined
        ? [sShl, tUbv]
        : tShl !== undefined && sUbv !== undefined
          ? [tShl, sUbv]
          : undefined;
    if (shifted !== undefined) {
      const shiftSize = manager.getBvSize(manager.sorts[shifted[0]]);
      const valueSize = manager.getBvSize(manager.sorts[shifted[1]]);
      return this.mkUbv2Int(
        mkBvApp(manager, OP_BSHL, [
          this.mkExtend(shiftSize, shifted[1], false),
          this.mkExtend(valueSize, shifted[0], false),
        ]),
      );
    }
    if (sUbv !== undefined && tUbv !== undefined)
      return this.mkUbv2Int(this.mkBvMul(sUbv, tUbv, false));
    const tDiff = this.getUbv2IntDiff(t);
    const sDiff = this.getUbv2IntDiff(s);
    const scaled =
      sUbv !== undefined && tDiff !== undefined
        ? { factor: sUbv, diff: tDiff }
        : tUbv !== undefined && sDiff !== undefined
          ? { factor: tUbv, diff: sDiff }
          : undefined;
    if (scaled !== undefined)
      return this.mkArithSub(
        this.mkUbv2Int(this.mkBvMul(scaled.factor, scaled.diff[0], false)),
        this.mkUbv2Int(this.mkBvMul(scaled.factor, scaled.diff[1], false)),
      );
    const sSbv = this.getSbv2Int(s);
    const tSbv = this.getSbv2Int(t);
    if (sSbv !== undefined && tSbv !== undefined)
      return this.mkSbv2Int(this.mkBvMul(sSbv, tSbv, true));
    return -1;
  }

  private mkSub(s: number, t: number) {
    const manager = this.manager;
    const sDiff = this.getUbv2IntDiff(s);
    const tDiff = this.getUbv2IntDiff(t);
    if (sDiff !== undefined && tDiff !== undefined)
      return this.mkArithSub(
        this.mkUbv2Int(this.mkBvAdd(sDiff[0], tDiff[1], false)),
        this.mkUbv2Int(this.mkBvAdd(sDiff[1], tDiff[0], false)),
      );
    const sSbv = this.getSbv2Int(s);
    const tSbv = this.getSbv2Int(t);
    if (sSbv !== undefined && tSbv !== undefined) {
      const aligned = this.alignSizes(sSbv, tSbv, true);
      return this.mkSbv2Int(
        mkBvApp(manager, OP_BSUB, [
          mkBvApp(manager, OP_SIGN_EXT, [aligned[0]], [1]),
          mkBvApp(manager, OP_SIGN_EXT, [aligned[1]], [1]),
        ]),
      );
    }
    return -1;
  }

  private getUbv2Int(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) === OP_UBV2INT) return manager.getArg(expr, 0);
    const value = manager.getNumeral(expr);
    if (value === undefined || value < 0n) return undefined;
    return manager.mkBvNumeral(value, getNumBits(value));
  }

  private getShl1(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_UBV2INT) return undefined;
    const shift = manager.getArg(expr, 0);
    if (manager.getOp(shift) !== OP_BSHL || !this.isOne(manager.getArg(shift, 0))) return undefined;
    return manager.getArg(shift, 1);
  }

  private getUbv2IntDiff(expr: number): [number, number] | undefined {
    const manager = this.manager;
    const ubv = this.getUbv2Int(expr);
    if (ubv !== undefined) return [ubv, manager.mkBvNumeral(0n, 1)];
    const value = manager.getNumeral(expr);
    if (value !== undefined)
      return [manager.mkBvNumeral(0n, 1), manager.mkBvNumeral(-value, getNumBits(-value))];
    const op = manager.getOp(expr);
    if ((op !== OP_SUB && op !== OP_ADD) || manager.getNumArgs(expr) !== 2) return undefined;
    const [first, second] = manager.getArgs(expr);
    if (op === OP_SUB) {
      const firstUbv = this.getUbv2Int(first);
      const secondUbv = firstUbv === undefined ? undefined : this.getUbv2Int(second);
      return firstUbv !== undefined && secondUbv !== undefined ? [firstUbv, secondUbv] : undefined;
    }
    const firstValue = manager.getNumeral(first);
    if (firstValue !== undefined && firstValue < 0n) {
      const secondUbv = this.getUbv2Int(second);
      if (secondUbv !== undefined)
        return [secondUbv, manager.mkBvNumeral(-firstValue, getNumBits(-firstValue))];
    }
    const secondValue = manager.getNumeral(second);
    if (secondValue !== undefined && secondValue < 0n) {
      const firstUbv = this.getUbv2Int(first);
      if (firstUbv !== undefined)
        return [firstUbv, manager.mkBvNumeral(-secondValue, getNumBits(-secondValue))];
    }
    return undefined;
  }

  private getSbv2Int(expr: number) {
    const manager = this.manager;
    const ubv = this.getUbv2Int(expr);
    if (ubv !== undefined) return mkBvApp(manager, OP_ZERO_EXT, [ubv], [1]);
    const diff = this.getUbv2IntDiff(expr);
    if (diff !== undefined) {
      const aligned = this.alignSizes(diff[0], diff[1], false);
      return mkBvApp(manager, OP_BSUB, [
        this.mkExtend(1, aligned[0], false),
        this.mkExtend(1, aligned[1], false),
      ]);
    }
    // ite(bv1 == b[n-1:n-1], bv2int(b[0:n-2]) - 2^{n-1}, bv2int(b[0:n-2]))
    if (manager.getOp(expr) !== OP_ITE) return undefined;
    const [condition, thenExpr, elseExpr] = manager.getArgs(expr);
    if (manager.getOp(condition) !== OP_EQ || manager.getOp(thenExpr) !== OP_SUB) return undefined;
    const [bit, top] = manager.getArgs(condition);
    if (!this.isOne(bit) || manager.getBvSize(manager.sorts[bit]) !== 1) return undefined;
    if (manager.getOp(top) !== OP_EXTRACT) return undefined;
    const [hi, lo] = manager.funcDecls[manager.decls[top]].parameters;
    const word = manager.getArg(top, 0);
    if (lo !== hi || lo !== manager.getBvSize(manager.sorts[word]) - 1) return undefined;
    if (manager.getNumArgs(thenExpr) !== 2) return undefined;
    const [minuend, subtrahend] = manager.getArgs(thenExpr);
    if (elseExpr !== minuend || manager.getOp(elseExpr) !== OP_UBV2INT) return undefined;
    const low = manager.getArg(elseExpr, 0);
    if (manager.getOp(low) !== OP_EXTRACT) return undefined;
    const [lowHi, lowLo] = manager.funcDecls[manager.decls[low]].parameters;
    if (lowLo !== 0 || lowHi !== hi - 1) return undefined;
    const value = manager.getNumeral(subtrahend);
    if (value !== 2n ** BigInt(hi)) return undefined;
    return manager.getArg(low, 0);
  }

  private mkSbv2Int(word: number) {
    const manager = this.manager;
    const size = manager.getBvSize(manager.sorts[word]);
    const condition = manager.mkEq(
      manager.mkBvNumeral(1n, 1),
      mkBvApp(manager, OP_EXTRACT, [word], [size - 1, size - 1]),
    );
    const low = this.mkUbv2Int(mkBvApp(manager, OP_EXTRACT, [word], [size - 2, 0]));
    const high = this.mkArithSub(low, manager.mkNumeral(2n ** BigInt(size - 1)));
    return manager.mkApp(OP_ITE, [condition, high, low], SORT_INT);
  }

  private mkExtend(size: number, word: number, isSigned: boolean) {
    const manager = this.manager;
    if (size === 0) return word;
    if (size > this.context.maxSize) throw new SmtTacticError("max. memory exceeded");
    if (isSigned) return mkBvApp(manager, OP_SIGN_EXT, [word], [size]);
    if (manager.isBvNumeral(word))
      return manager.mkBvNumeral(
        manager.getBvNumeralValue(word),
        manager.getBvSize(manager.sorts[word]) + size,
      );
    return mkBvApp(manager, OP_ZERO_EXT, [word], [size]);
  }
}
