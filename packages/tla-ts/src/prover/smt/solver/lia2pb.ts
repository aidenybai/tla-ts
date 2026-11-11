// Ported from Z3 (src/tactic/arith/lia2pb_tactic.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_APP,
  OP_ADD,
  OP_GE,
  OP_GT,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_NUM,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
  isArithSort,
} from "./ast";
import { BoundManager } from "./bound-manager";
import type { Definition, Goal } from "./goal";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { Rewriter, type RewriterOptions } from "./rewriter";

const LINEAR_OPS = [OP_LE, OP_GE, OP_LT, OP_GT, OP_ADD, OP_NUM];

const getNumBits = (value: Rational) => value.num.toString(2).length;

export interface Lia2PbOptions {
  isPartial: boolean;
  maxBits: number;
  totalBits: number;
  rewriter: RewriterOptions;
}

export const lia2pb = (manager: AstManager, goal: Goal, options: Lia2PbOptions) => {
  if (goal.isProofsEnabled) throw new SmtTacticError("lia2pb does not support proof production");
  if (goal.isInconsistent) return;
  const bounds = new BoundManager(manager);
  for (const form of goal.forms.items) bounds.add(form);
  const getTargetUpper = (expr: number) => {
    if (!manager.isUninterpretedConst(expr)) return undefined;
    const lower = bounds.lowers.get(expr);
    const upper = bounds.uppers.get(expr)?.value;
    return lower !== undefined &&
      upper !== undefined &&
      lower.value.isZero() &&
      !upper.isNegative() &&
      upper.isInt() &&
      getNumBits(upper) <= options.maxBits
      ? upper
      : undefined;
  };
  const isTarget = (expr: number) => {
    const upper = getTargetUpper(expr);
    return upper !== undefined && upper.compare(Rational.one) > 0;
  };
  if (!bounds.boundedVars.some(isTarget)) {
    goal.depth++;
    return;
  }
  const isSupported = (expr: number) => {
    if (manager.kinds[expr] !== KIND_APP) return false;
    const family = manager.getFamily(expr);
    if (family === FAMILY_BASIC) return true;
    if (family === FAMILY_ARITH) {
      const op = manager.getOp(expr);
      if (LINEAR_OPS.includes(op)) return true;
      return (
        op === OP_MUL &&
        manager.getNumArgs(expr) === 2 &&
        manager.isNumeral(manager.getArg(expr, 0))
      );
    }
    if (manager.isUninterpretedConst(expr)) {
      if (manager.sorts[expr] === SORT_REAL) return options.isPartial;
      if (manager.sorts[expr] === SORT_INT)
        return options.isPartial || getTargetUpper(expr) !== undefined;
      return true;
    }
    return !isArithSort(manager.sorts[expr]);
  };
  const visited = new Set<number>();
  const todo = [...goal.forms.items];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (visited.has(expr)) continue;
    visited.add(expr);
    if (!isSupported(expr)) throw new SmtTacticError("goal is in a fragment unsupported by lia2pb");
    manager.pushArgs(expr, todo);
  }
  let numBits = 0;
  for (const variable of bounds.boundedVars) {
    if (!isTarget(variable)) continue;
    numBits += getNumBits(getTargetUpper(variable) as Rational);
    if (numBits > options.totalBits)
      throw new SmtTacticError(
        "lia2pb failed, number of necessary bits exceeds specified threshold (use option :lia2pb-total-bits to increase threshold)",
      );
  }
  const terms = new RefVector(manager);
  const definitions: Definition[] = [];
  const substitution = new Map<number, number>();
  const zero = manager.mkNumeral(0n);
  const one = manager.mkNumeral(1n);
  terms.push(zero);
  terms.push(one);
  for (const variable of bounds.boundedVars) {
    if (!isTarget(variable)) continue;
    const args: number[] = [];
    let coeff = 1n;
    const bits = getNumBits(getTargetUpper(variable) as Rational);
    for (let index = 0; index < bits; index++) {
      const bit = manager.mkFreshConst(null, SORT_INT);
      terms.push(bit);
      goal.assert(manager.mkApp(OP_LE, [zero, bit], SORT_BOOL));
      goal.assert(manager.mkApp(OP_LE, [bit, one], SORT_BOOL));
      args.push(
        coeff === 1n ? bit : manager.mkApp(OP_MUL, [manager.mkNumeral(coeff), bit], SORT_INT),
      );
      definitions.push({ decl: manager.decls[bit], def: -1 });
      coeff *= 2n;
    }
    const def = manager.mkApp(OP_ADD, args, SORT_INT);
    terms.push(def);
    substitution.set(variable, def);
    definitions.push({ decl: manager.decls[variable], def });
  }
  const rewriter = new Rewriter(manager, options.rewriter);
  rewriter.setSubstitution(substitution);
  const size = goal.forms.size;
  for (let index = 0; !goal.isInconsistent && index < size; index++) {
    const rewritten = rewriter.rewrite(goal.forms.items[index]);
    goal.update(index, rewritten);
    manager.decRef(rewritten);
  }
  rewriter.release();
  goal.depth++;
  goal.addDefinitions(definitions);
  terms.reset();
};
