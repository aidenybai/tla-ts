// Ported from Z3 (src/ast/seq/seq_eq_solver.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  OP_ADD,
  OP_EQ,
  OP_ITE,
  OP_MUL,
  OP_SEQ_CONCAT,
  OP_SEQ_FOLDL,
  OP_SEQ_FOLDLI,
  OP_SEQ_LENGTH,
  OP_SEQ_MAP,
  OP_SEQ_MAPI,
  OP_SEQ_NTH_I,
  OP_SEQ_UNIT,
  OP_STRING_ITOS,
  OP_STRING_UBVTOS,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { Rational } from "./rational";
import { isEmptySeq, mkConcatOf, mkSeqApp } from "./seq-decl-plugin";
import type { SeqAxioms } from "./seq-axioms";

export interface SeqLength {
  isKnown: boolean;
  value: Rational;
}

export interface SeqEqSolverHost {
  addConsequence(isUsingDeps: boolean, clause: number[]): void;
  addSolution(variable: number, term: number): void;
  expr2rep(expr: number): number;
  getLength(expr: number): SeqLength;
}

export interface BinaryEq {
  x: number;
  xs: number[];
  ys: number[];
  y: number;
}

export interface TernaryEq {
  x: number;
  xs: number[];
  y1: number;
  ys: number[];
  y2: number;
}

export interface QuatEq {
  x1: number;
  xs: number[];
  x2: number;
  y1: number;
  ys: number[];
  y2: number;
}

const isSameList = (first: readonly number[], second: readonly number[]) =>
  first.length === second.length && first.every((expr, index) => expr === second[index]);

export class SeqEqSolver {
  constructor(
    private manager: AstManager,
    private host: SeqEqSolverHost,
    private axioms: SeqAxioms,
  ) {}

  private isOp(expr: number, op: number) {
    return this.manager.getOp(expr) === op;
  }

  private isUnit(expr: number) {
    return this.isOp(expr, OP_SEQ_UNIT);
  }

  private mkEq(first: number, second: number) {
    return this.manager.mkApp(OP_EQ, [first, second], SORT_BOOL);
  }

  private mkConcat(exprs: readonly number[], sort: number) {
    return mkConcatOf(this.manager, exprs, sort);
  }

  reduce(ls: readonly number[], rs: readonly number[]) {
    return (
      this.reduceUnit(ls, rs) ||
      this.reduceItos1(ls, rs) ||
      this.reduceItos2(ls, rs) ||
      this.reduceItos3(ls, rs) ||
      this.reduceUbv2s(ls, rs) ||
      this.reduceBinaryEq(ls, rs) ||
      this.reduceNthSolved(ls, rs)
    );
  }

  private addConsequence(...clause: number[]) {
    this.host.addConsequence(true, clause);
  }

  private reduceItos1(ls: readonly number[], rs: readonly number[]) {
    if (ls.length !== 1 || rs.length !== 1) return false;
    if (!this.isOp(ls[0], OP_STRING_ITOS) || !this.isOp(rs[0], OP_STRING_ITOS)) return false;
    const first = this.manager.getArg(ls[0], 0);
    const second = this.manager.getArg(rs[0], 0);
    const eq = this.mkEq(first, second);
    this.addConsequence(eq, this.axioms.mkLe(first, -1));
    this.addConsequence(eq, this.axioms.mkLe(second, -1));
    return true;
  }

  private reduceItos2(ls: readonly number[], rs: readonly number[]) {
    const itos =
      ls.length === 1 && rs.length === 0 && this.isOp(ls[0], OP_STRING_ITOS)
        ? ls[0]
        : rs.length === 1 && ls.length === 0 && this.isOp(rs[0], OP_STRING_ITOS)
          ? rs[0]
          : undefined;
    if (itos === undefined) return false;
    this.addConsequence(this.axioms.mkLe(this.manager.getArg(itos, 0), -1));
    return true;
  }

  private reduceItos3(ls: readonly number[], rs: readonly number[]) {
    const manager = this.manager;
    const isLeft = ls.length === 1 && this.isOp(ls[0], OP_STRING_ITOS);
    if (!isLeft && !(rs.length === 1 && this.isOp(rs[0], OP_STRING_ITOS))) return false;
    const number = manager.getArg(isLeft ? ls[0] : rs[0], 0);
    const digits = isLeft ? rs : ls;
    if (digits.length === 0) {
      this.addConsequence(this.axioms.mkLe(number, -1));
      return true;
    }
    for (const digit of digits) {
      if (!this.isUnit(digit)) continue;
      const isDigit = this.axioms.isDigit(manager.getArg(digit, 0));
      if (this.host.expr2rep(isDigit) !== manager.trueExpr) this.addConsequence(isDigit);
    }
    if (!digits.every((digit) => this.isUnit(digit))) return false;
    let num = -1;
    for (const digit of digits) {
      const value = this.axioms.skolem.mkDigit2int(manager.getArg(digit, 0));
      num =
        num === -1
          ? value
          : manager.mkApp(
              OP_ADD,
              [manager.mkApp(OP_MUL, [manager.mkNumeral(10n), num], SORT_INT), value],
              SORT_INT,
            );
    }
    this.addConsequence(this.axioms.rewrite(this.mkEq(number, num)));
    if (digits.length > 1) {
      const value = this.axioms.skolem.mkDigit2int(manager.getArg(digits[0], 0));
      this.addConsequence(this.axioms.mkGe(value, 1));
    }
    const term = this.mkConcat(digits, manager.sorts[digits[0]]);
    this.host.addSolution(mkSeqApp(manager, OP_STRING_ITOS, [number]), term);
    return true;
  }

  private reduceUnit(ls: readonly number[], rs: readonly number[]) {
    if (isSameList(ls, rs)) return true;
    const manager = this.manager;
    if (ls.length === 1 && this.isVar(ls[0]) && !this.occurs(ls[0], rs)) {
      this.host.addSolution(ls[0], this.mkConcat(rs, manager.sorts[ls[0]]));
      return true;
    }
    if (rs.length === 1 && this.isVar(rs[0]) && !this.occurs(rs[0], ls)) {
      this.host.addSolution(rs[0], this.mkConcat(ls, manager.sorts[rs[0]]));
      return true;
    }
    return false;
  }

  private reduceUbv2s(ls: readonly number[], rs: readonly number[]) {
    if (
      (ls.length === 1 && this.isOp(ls[0], OP_STRING_UBVTOS)) ||
      (rs.length === 1 && this.isOp(rs[0], OP_STRING_UBVTOS))
    )
      throw new SmtUnsupportedError("str.from_ubv in the theory of sequences");
    return false;
  }

  private reduceBinaryEq(ls: readonly number[], rs: readonly number[]) {
    const match = this.matchSelfBinaryEq(ls, rs);
    if (match === undefined) return false;
    if (match.xs.length !== match.ys.length) {
      this.host.addConsequence(true, []);
      return true;
    }
    if (match.xs.length === 0) return true;
    if (match.xs.length !== 1) return false;
    const host = this.host;
    if (host.expr2rep(match.xs[0]) === host.expr2rep(match.ys[0])) return false;
    const eq = this.mkEq(match.xs[0], match.ys[0]);
    const value = host.expr2rep(eq);
    if (value === this.manager.trueExpr) return false;
    this.addConsequence(eq);
    return value === this.manager.falseExpr;
  }

  private reduceNthSolved(ls: readonly number[], rs: readonly number[]) {
    const solved = this.matchNthSolved(ls, rs) ?? this.matchNthSolved(rs, ls);
    if (solved === undefined) return false;
    this.host.addSolution(solved.x, solved.y);
    return true;
  }

  private matchNthSolved(ls: readonly number[], rs: readonly number[]) {
    const manager = this.manager;
    if (ls.length !== 1 || !this.isVar(ls[0])) return undefined;
    let next = 0n;
    for (const element of rs) {
      const inner = this.isUnit(element) ? manager.getArg(element, 0) : -1;
      if (
        inner === -1 ||
        !this.isOp(inner, OP_SEQ_NTH_I) ||
        manager.getNumeral(manager.getArg(inner, 1)) !== next ||
        manager.getArg(inner, 0) !== ls[0]
      )
        return undefined;
      next++;
    }
    return { x: ls[0], y: this.mkConcat(rs, manager.sorts[ls[0]]) };
  }

  branchUnitVariableOf(variable: number, units: readonly number[]) {
    const manager = this.manager;
    const length = this.host.getLength(variable).value;
    const count = Rational.of(BigInt(units.length));
    if (length.compare(count) > 0) {
      this.addConsequence(
        this.axioms.mkLe(mkSeqApp(manager, OP_SEQ_LENGTH, [variable]), units.length),
      );
      return true;
    }
    const lengthValue = manager.mkNumeral(length.num);
    const lengthTerm = mkSeqApp(manager, OP_SEQ_LENGTH, [variable]);
    const isLength = this.mkEq(lengthValue, lengthTerm);
    if (this.host.expr2rep(isLength) === manager.falseExpr) return false;
    const prefix = this.mkConcat(units.slice(0, Number(length.num)), manager.sorts[variable]);
    const eq = this.axioms.skolem.mkEq(variable, prefix);
    this.addConsequence(this.axioms.mkNot(isLength), eq);
    return true;
  }

  branchUnitVariable(ls: readonly number[], rs: readonly number[]) {
    if (ls.length > 0 && this.isVar(ls[0]) && rs.every((expr) => this.isUnit(expr)))
      return this.branchUnitVariableOf(ls[0], rs);
    if (rs.length > 0 && this.isVar(rs[0]) && ls.every((expr) => this.isUnit(expr)))
      return this.branchUnitVariableOf(rs[0], ls);
    return false;
  }

  isVar(expr: number) {
    const manager = this.manager;
    if (!manager.isSeqSort(manager.sorts[expr])) return false;
    if (isEmptySeq(manager, expr) || manager.getString(expr) !== undefined) return false;
    const op = manager.getOp(expr);
    return (
      op !== OP_SEQ_CONCAT &&
      op !== OP_SEQ_UNIT &&
      op !== OP_STRING_ITOS &&
      op !== OP_SEQ_NTH_I &&
      op !== OP_SEQ_MAP &&
      op !== OP_SEQ_MAPI &&
      op !== OP_SEQ_FOLDL &&
      op !== OP_SEQ_FOLDLI &&
      op !== OP_ITE
    );
  }

  private occurs(variable: number, exprs: readonly number[]) {
    return exprs.some((expr) => expr === variable || this.isOp(expr, OP_ITE));
  }

  private countUnitsL2r(exprs: readonly number[], offset: number) {
    let index = offset;
    while (index < exprs.length && this.isUnit(exprs[index])) index++;
    return index - offset;
  }

  private countUnitsR2l(exprs: readonly number[], offset: number) {
    let count = 0;
    for (let index = offset; index >= 0 && this.isUnit(exprs[index]); index--) count++;
    return count;
  }

  private countNonUnitsL2r(exprs: readonly number[], offset: number) {
    let index = offset;
    while (index < exprs.length && !this.isUnit(exprs[index])) index++;
    return index - offset;
  }

  private countNonUnitsR2l(exprs: readonly number[], offset: number) {
    let count = 0;
    for (let index = offset; index >= 0 && !this.isUnit(exprs[index]); index--) count++;
    return count;
  }

  private getPrefix(exprs: readonly number[], size: number) {
    return this.mkConcat(exprs.slice(0, size), this.manager.sorts[exprs[0]]);
  }

  private getSuffix(exprs: readonly number[], size: number) {
    return this.mkConcat(exprs.slice(exprs.length - size), this.manager.sorts[exprs[0]]);
  }

  private matchTernaryEqR(ls: readonly number[], rs: readonly number[]): TernaryEq | undefined {
    if (ls.length <= 1 || rs.length <= 1 || !this.isVar(rs[0]) || !this.isVar(rs.at(-1)!))
      return undefined;
    const numLsUnits = this.countUnitsR2l(ls, ls.length - 1);
    if (numLsUnits === 0 || numLsUnits === ls.length) return undefined;
    const numRsNonUnits = this.countNonUnitsR2l(rs, rs.length - 1);
    if (numRsNonUnits === rs.length) return undefined;
    const numRsUnits = this.countUnitsR2l(rs, rs.length - 1 - numRsNonUnits);
    if (numRsUnits === 0) return undefined;
    const offset = rs.length - numRsNonUnits - numRsUnits;
    return {
      x: this.getPrefix(ls, ls.length - numLsUnits),
      xs: ls.slice(ls.length - numLsUnits),
      y1: this.getPrefix(rs, offset),
      ys: rs.slice(offset, offset + numRsUnits),
      y2: this.getSuffix(rs, numRsNonUnits),
    };
  }

  matchTernaryEqRhs(ls: readonly number[], rs: readonly number[]) {
    return this.matchTernaryEqR(ls, rs) ?? this.matchTernaryEqR(rs, ls);
  }

  private matchTernaryEqL(ls: readonly number[], rs: readonly number[]): TernaryEq | undefined {
    if (ls.length <= 1 || rs.length <= 1 || !this.isVar(rs[0]) || !this.isVar(rs.at(-1)!))
      return undefined;
    const numLsUnits = this.countUnitsL2r(ls, 0);
    if (numLsUnits === 0 || numLsUnits === ls.length) return undefined;
    const numRsNonUnits = this.countNonUnitsL2r(rs, 0);
    if (numRsNonUnits === rs.length || numRsNonUnits === 0) return undefined;
    const numRsUnits = this.countUnitsL2r(rs, numRsNonUnits);
    if (numRsUnits === 0) return undefined;
    return {
      xs: ls.slice(0, numLsUnits),
      x: this.getSuffix(ls, ls.length - numLsUnits),
      y1: this.getPrefix(rs, numRsNonUnits),
      ys: rs.slice(numRsNonUnits, numRsNonUnits + numRsUnits),
      y2: this.getSuffix(rs, rs.length - numRsNonUnits - numRsUnits),
    };
  }

  matchTernaryEqLhs(ls: readonly number[], rs: readonly number[]) {
    return this.matchTernaryEqL(ls, rs) ?? this.matchTernaryEqL(rs, ls);
  }

  matchBinaryEq(ls: readonly number[], rs: readonly number[]): BinaryEq | undefined {
    if (
      ls.length > 1 &&
      this.isVar(ls[0]) &&
      rs.length > 1 &&
      this.isVar(rs.at(-1)!) &&
      ls.slice(1).every((expr) => this.isUnit(expr)) &&
      rs.slice(0, -1).every((expr) => this.isUnit(expr))
    )
      return { x: ls[0], y: rs.at(-1)!, xs: ls.slice(1), ys: rs.slice(0, -1) };
    return undefined;
  }

  private matchSelfBinaryEq(ls: readonly number[], rs: readonly number[]) {
    const first = this.matchBinaryEq(ls, rs);
    if (first !== undefined && first.x === first.y) return first;
    const second = this.matchBinaryEq(rs, ls);
    if (second !== undefined && second.x === second.y) return second;
    return undefined;
  }

  matchQuatEq(ls: readonly number[], rs: readonly number[]): QuatEq | undefined {
    if (
      ls.length <= 1 ||
      !this.isVar(ls[0]) ||
      !this.isVar(ls.at(-1)!) ||
      rs.length <= 1 ||
      !this.isVar(rs[0]) ||
      !this.isVar(rs.at(-1)!)
    )
      return undefined;
    const lsNonUnit = this.countNonUnitsL2r(ls, 0);
    const rsNonUnit = this.countNonUnitsL2r(rs, 0);
    if (lsNonUnit === ls.length || rsNonUnit === rs.length) return undefined;
    const lsUnit = this.countUnitsL2r(ls, lsNonUnit);
    const rsUnit = this.countUnitsL2r(rs, rsNonUnit);
    if (lsUnit === 0 || rsUnit === 0) return undefined;
    return {
      x1: this.getPrefix(ls, lsNonUnit),
      xs: ls.slice(lsNonUnit, lsNonUnit + lsUnit),
      x2: this.getSuffix(ls, ls.length - lsNonUnit - lsUnit),
      y1: this.getPrefix(rs, rsNonUnit),
      ys: rs.slice(rsNonUnit, rsNonUnit + rsUnit),
      y2: this.getSuffix(rs, rs.length - rsNonUnit - rsUnit),
    };
  }

  canAlignFromLhs(ls: readonly number[], rs: readonly number[]) {
    const manager = this.manager;
    const last = rs.at(-1)!;
    for (let index = 0; index < ls.length; index++) {
      if (manager.areDistinct(ls[index], last)) continue;
      if (index === 0) return true;
      let isSame = true;
      if (rs.length > index) {
        const diff = rs.length - (index + 1);
        for (let inner = 0; isSame && inner < index; inner++)
          isSame = !manager.areDistinct(ls[inner], rs[diff + inner]);
      } else {
        const diff = index + 1 - rs.length;
        for (let inner = 0; isSame && inner + 1 < rs.length; inner++)
          isSame = !manager.areDistinct(ls[diff + inner], rs[inner]);
      }
      if (isSame) return true;
    }
    return false;
  }

  canAlignFromRhs(ls: readonly number[], rs: readonly number[]) {
    const manager = this.manager;
    for (let index = 0; index < ls.length; index++) {
      const diff = ls.length - 1 - index;
      if (manager.areDistinct(ls[diff], rs[0])) continue;
      if (index === 0) return true;
      let isSame = true;
      const bound = rs.length > index ? index : rs.length - 1;
      for (let inner = 1; isSame && inner <= bound; inner++)
        isSame = !manager.areDistinct(ls[diff + inner], rs[inner]);
      if (isSame) return true;
    }
    return false;
  }
}
