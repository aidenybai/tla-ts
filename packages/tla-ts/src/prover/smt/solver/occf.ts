// Ported from Z3 (src/tactic/core/occf_tactic.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import { type AstManager, OP_OR, SORT_BOOL } from "./ast";
import type { Goal } from "./goal";
import { RefVector } from "./ref-vector";

interface BvarInfo {
  bvar: number;
  isGenPos: boolean;
  isGenNeg: boolean;
}

export const occf = (manager: AstManager, goal: Goal) => {
  if (goal.isProofsEnabled) throw new SmtTacticError("occf does not support proof production");
  const pinned = new RefVector(manager);
  const pin = (expr: number) => {
    pinned.push(expr);
    return expr;
  };
  const isLiteral = (expr: number) =>
    manager.isUninterpretedConst(expr) ||
    (manager.isNot(expr) && manager.isUninterpretedConst(manager.getArg(expr, 0)));
  const isConstraint = (expr: number) => !isLiteral(expr);
  const isTarget = (clause: number) => {
    let isFound = false;
    for (const arg of manager.getArgs(clause)) {
      if (!isConstraint(arg)) continue;
      if (isFound) return true;
      isFound = true;
    }
    return false;
  };
  const constraintToBvar = new Map<number, BvarInfo>();
  const getAtom = (constraint: number) => {
    let atom = constraint;
    let isSign = false;
    while (manager.isNot(atom)) {
      atom = manager.getArg(atom, 0);
      isSign = !isSign;
    }
    return { atom, isSign };
  };
  const getAuxLit = (constraint: number) => {
    const literal = getAtom(constraint);
    const info = constraintToBvar.get(literal.atom);
    if (info === undefined) return undefined;
    if (literal.isSign) {
      if (!info.isGenNeg) {
        info.isGenNeg = true;
        goal.assert(pin(manager.mkOr([info.bvar, pin(manager.mkNot(literal.atom))])));
      }
      return pin(manager.mkNot(info.bvar));
    }
    if (!info.isGenPos) {
      info.isGenPos = true;
      goal.assert(pin(manager.mkOr([pin(manager.mkNot(info.bvar)), literal.atom])));
    }
    return info.bvar;
  };
  const mkAuxLit = (constraint: number) => {
    const literal = getAtom(constraint);
    const bvar = pin(manager.mkFreshConst(null, SORT_BOOL));
    goal.addConverter(manager.decls[bvar]);
    constraintToBvar.set(literal.atom, {
      bvar,
      isGenPos: !literal.isSign,
      isGenNeg: literal.isSign,
    });
    if (literal.isSign) {
      goal.assert(pin(manager.mkOr([bvar, pin(manager.mkNot(literal.atom))])));
      return pin(manager.mkNot(bvar));
    }
    goal.assert(pin(manager.mkOr([pin(manager.mkNot(bvar)), literal.atom])));
    return bvar;
  };
  const size = goal.forms.size;
  for (let index = 0; index < size; index++) {
    manager.limit.checkpoint();
    const clause = goal.forms.items[index];
    if (manager.getOp(clause) !== OP_OR || !isTarget(clause)) continue;
    let keep: number | undefined;
    const literals: number[] = [];
    for (const literal of manager.getArgs(clause)) {
      if (!isConstraint(literal)) {
        literals.push(literal);
        continue;
      }
      const aux = getAuxLit(literal);
      if (aux !== undefined) literals.push(aux);
      else if (keep === undefined) keep = literal;
      else literals.push(mkAuxLit(literal));
    }
    if (keep !== undefined) literals.push(keep);
    goal.update(index, pin(manager.mkOr(literals)));
  }
  pinned.reset();
  goal.depth++;
};
