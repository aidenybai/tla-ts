// Ported from Z3 (src/tactic/arith/diff_neq_tactic.cpp), MIT license, see z3-license.txt.
import { SmtCanceledError, SmtTacticError } from "../../../errors";
import { type AstManager, OP_ADD, OP_EQ, OP_GE, OP_LE, SORT_INT } from "./ast";
import type { Goal } from "./goal";
import { ProtoModel } from "./proto-model";
import { Rational } from "./rational";

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

interface Diseq {
  other: number;
  offset: number;
}

const throwNotSupported = (): never => {
  throw new SmtTacticError("goal is not diff neq");
};

class DiffNeq {
  private var2expr: number[] = [];
  private expr2var = new Map<number, number>();
  private lowers: number[] = [];
  private uppers: number[] = [];
  private diseqs: Diseq[][] = [];
  private stack: number[] = [];
  private forbidden: boolean[] = [];
  private maxK: Rational;
  private maxNegK: Rational;

  constructor(
    private manager: AstManager,
    maxK: number,
  ) {
    this.maxK = Rational.fromNumber(Math.min(maxK, Math.trunc(INT_MAX / 2)));
    this.maxNegK = Rational.fromNumber(-maxK);
  }

  private mkVar(expr: number) {
    const existing = this.expr2var.get(expr);
    if (existing !== undefined) return existing;
    const variable = this.uppers.length;
    this.expr2var.set(expr, variable);
    this.var2expr.push(expr);
    this.lowers.push(INT_MIN);
    this.uppers.push(INT_MAX);
    this.diseqs.push([]);
    return variable;
  }

  private getSmallNumeral(expr: number) {
    const manager = this.manager;
    if (!manager.isNumeral(expr)) return undefined;
    const value = manager.getRationalValue(expr);
    return this.maxNegK.compare(value) <= 0 && value.compare(this.maxK) <= 0
      ? Number(value.num)
      : undefined;
  }

  private processLe(lhs: number, rhs: number) {
    const manager = this.manager;
    if (manager.sorts[lhs] !== SORT_INT) throwNotSupported();
    const rhsValue = manager.isUninterpretedConst(lhs) ? this.getSmallNumeral(rhs) : undefined;
    if (rhsValue !== undefined) {
      const variable = this.mkVar(lhs);
      this.uppers[variable] = Math.min(this.uppers[variable], rhsValue);
      return;
    }
    const lhsValue = manager.isUninterpretedConst(rhs) ? this.getSmallNumeral(lhs) : undefined;
    if (lhsValue === undefined) return throwNotSupported();
    const variable = this.mkVar(rhs);
    this.lowers[variable] = Math.max(this.lowers[variable], lhsValue);
  }

  private processNeqCore(first: number, second: number, offset: number) {
    const firstVar = this.mkVar(first);
    const secondVar = this.mkVar(second);
    if (firstVar === secondVar) throwNotSupported();
    if (firstVar < secondVar) this.diseqs[secondVar].push({ other: firstVar, offset: -offset });
    else this.diseqs[firstVar].push({ other: secondVar, offset });
  }

  private processNeq(inputLhs: number, inputRhs: number) {
    const manager = this.manager;
    if (manager.sorts[inputLhs] !== SORT_INT) throwNotSupported();
    if (manager.isUninterpretedConst(inputLhs) && manager.isUninterpretedConst(inputRhs))
      return this.processNeqCore(inputLhs, inputRhs, 0);
    const [lhs, rhs] = manager.isNumeral(inputLhs) ? [inputRhs, inputLhs] : [inputLhs, inputRhs];
    if (!manager.isNumeral(rhs)) throwNotSupported();
    const offset = this.getSmallNumeral(rhs);
    if (offset === undefined) return throwNotSupported();
    if (manager.getOp(lhs) !== OP_ADD || manager.getNumArgs(lhs) !== 2) return throwNotSupported();
    const [first, second] = manager.getArgs(lhs);
    const negatedSecond = manager.getTimesMinusOneArg(second);
    if (
      manager.isUninterpretedConst(first) &&
      negatedSecond !== undefined &&
      manager.isUninterpretedConst(negatedSecond)
    )
      return this.processNeqCore(first, negatedSecond, offset);
    const negatedFirst = manager.getTimesMinusOneArg(first);
    if (
      manager.isUninterpretedConst(second) &&
      negatedFirst !== undefined &&
      manager.isUninterpretedConst(negatedFirst)
    )
      return this.processNeqCore(second, negatedFirst, offset);
    throwNotSupported();
  }

  compile(goal: Goal) {
    const manager = this.manager;
    for (const form of goal.forms.items) {
      const op = manager.getOp(form);
      if (op === OP_LE) this.processLe(manager.getArg(form, 0), manager.getArg(form, 1));
      else if (op === OP_GE) this.processLe(manager.getArg(form, 1), manager.getArg(form, 0));
      else if (manager.isNot(form) && manager.getOp(manager.getArg(form, 0)) === OP_EQ) {
        const atom = manager.getArg(form, 0);
        this.processNeq(manager.getArg(atom, 0), manager.getArg(atom, 1));
      } else throwNotSupported();
    }
    for (let variable = 0; variable < this.uppers.length; variable++) {
      if (this.lowers[variable] === INT_MIN || this.uppers[variable] === INT_MAX)
        throwNotSupported();
      if (this.lowers[variable] !== 0) throwNotSupported();
    }
  }

  private chooseValue(variable: number, startingAt: number) {
    let max = startingAt - 1;
    let value = startingAt;
    const upper = this.uppers[variable];
    if (startingAt > upper) return -1;
    const forbidden = this.forbidden;
    for (const diseq of this.diseqs[variable]) {
      const badValue = this.stack[diseq.other] + diseq.offset;
      if (badValue < value || badValue > upper) continue;
      if (badValue === value) {
        for (;;) {
          value++;
          if (value > upper) return -1;
          if (!forbidden[value]) break;
          forbidden[value] = false;
        }
        continue;
      }
      forbidden[badValue] = true;
      if (badValue > max) max = badValue;
    }
    for (let index = startingAt + 1; index <= max; index++) forbidden[index] = false;
    return value;
  }

  private resolveConflict() {
    while (this.stack.length > 0) {
      const value = this.stack.pop() as number;
      const next = this.chooseValue(this.stack.length, value + 1);
      if (next !== -1) {
        this.stack.push(next);
        return true;
      }
    }
    return false;
  }

  search() {
    const max = Math.max(0, ...this.uppers);
    this.forbidden = Array.from({ length: max + 1 }, () => false);
    while (this.stack.length < this.uppers.length) {
      if (!this.manager.limit.inc()) throw new SmtCanceledError();
      const value = this.chooseValue(this.stack.length, 0);
      if (value !== -1) {
        this.stack.push(value);
        continue;
      }
      if (!this.resolveConflict()) return false;
    }
    return true;
  }

  mkModel() {
    const manager = this.manager;
    const model = new ProtoModel(manager);
    for (const [variable, expr] of this.var2expr.entries())
      model.registerConst(manager.decls[expr], manager.mkNumeral(BigInt(this.stack[variable])));
    return model;
  }
}

export const diffNeq = (manager: AstManager, goal: Goal, maxK: number) => {
  if (goal.isProofsEnabled) throw new SmtTacticError("diff-neq does not support proof production");
  if (goal.isCoresEnabled)
    throw new SmtTacticError("diff-neq does not support unsat core production");
  if (goal.isInconsistent) return;
  const solver = new DiffNeq(manager, maxK);
  solver.compile(goal);
  if (solver.search()) {
    const model = solver.mkModel();
    model.incRef();
    goal.addModelConversion((converted) => {
      for (const [decl, value] of model.constInterps) converted.registerConst(decl, value);
      return converted;
    });
    goal.reset();
  } else goal.assert(manager.falseExpr);
  goal.depth++;
};
