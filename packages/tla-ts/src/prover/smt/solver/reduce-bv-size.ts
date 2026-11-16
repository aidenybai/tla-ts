// Ported from Z3 (src/tactic/bv/bv_size_reduction_tactic.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import { type AstManager, OP_CONCAT, OP_SIGN_EXT, OP_SLEQ } from "./ast";
import { mkBvApp } from "./bv-decl-plugin";
import type { Definition, Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { SubstReplacer } from "./solve-eqs";

const getSigned = (value: bigint, size: number) => {
  const modulus = 1n << BigInt(size);
  const reduced = ((value % modulus) + modulus) % modulus;
  return reduced >= modulus >> 1n ? reduced - modulus : reduced;
};

const getNumBits = (value: bigint) => value.toString(2).length;

const collectBounds = (manager: AstManager, goal: Goal) => {
  const getHash = (expr: number) => manager.hashes[expr];
  const lowers = new ObjMap<bigint>(getHash);
  const uppers = new ObjMap<bigint>(getHash);
  const setLower = (variable: number, value: bigint) => {
    const old = lowers.get(variable);
    lowers.set(variable, old === undefined || old < value ? value : old);
  };
  const setUpper = (variable: number, value: bigint) => {
    const old = uppers.get(variable);
    uppers.set(variable, old === undefined || value < old ? value : old);
  };
  for (const form of goal.forms.items) {
    const isNegated = manager.isNot(form);
    const atom = isNegated ? manager.getArg(form, 0) : form;
    if (manager.getOp(atom) !== OP_SLEQ) continue;
    const lhs = manager.getArg(atom, 0);
    const rhs = manager.getArg(atom, 1);
    const size = manager.getBvSize(manager.sorts[lhs]);
    if (manager.isUninterpretedConst(lhs) && manager.isBvNumeral(rhs)) {
      const value = getSigned(manager.getBvNumeralValue(rhs), size);
      if (!isNegated) setUpper(lhs, value);
      else if (getSigned(value + 1n, size) === value + 1n) setLower(lhs, value + 1n);
    } else if (manager.isUninterpretedConst(rhs) && manager.isBvNumeral(lhs)) {
      const value = getSigned(manager.getBvNumeralValue(lhs), size);
      if (!isNegated) setLower(rhs, value);
      else if (getSigned(value - 1n, size) === value - 1n) setUpper(rhs, value - 1n);
    }
  }
  return { lowers, uppers };
};

// Z3 also keeps unsigned bounds, but only code it compiles out collects them.
export const runReduceBvSize = (manager: AstManager) => (goal: Goal) => {
  if (goal.isProofsEnabled)
    throw new SmtTacticError("bv-size-reduction does not support proof production");
  if (goal.isCoresEnabled)
    throw new SmtTacticError("bv-size-reduction does not support unsat core production");
  goal.depth++;
  if (goal.isInconsistent) return [goal];
  const bounds = collectBounds(manager, goal);
  const substitution = new ObjMap<number>((expr) => manager.hashes[expr]);
  const definitions: Definition[] = [];
  const hidden: Definition[] = [];
  const replacer = new SubstReplacer(manager, substitution);
  let isInfeasible = false;
  if (bounds.lowers.size > 0 && bounds.uppers.size > 0)
    for (const [variable, lower] of bounds.lowers) {
      const upper = bounds.uppers.get(variable);
      if (upper === undefined) continue;
      if (lower > upper) {
        isInfeasible = true;
        break;
      }
      const size = manager.getBvSize(manager.sorts[variable]);
      const width =
        lower >= 0n
          ? getNumBits(upper)
          : upper < 0n
            ? getNumBits(-lower)
            : Math.max(getNumBits(-lower), getNumBits(upper)) + 1;
      const fresh =
        lower === upper || width >= size ? -1 : manager.mkFreshConst(null, manager.mkBvSort(width));
      if (fresh !== -1) hidden.push({ decl: manager.decls[fresh], def: -1 });
      const def =
        lower === upper
          ? manager.mkBvNumeral(lower, size)
          : fresh === -1
            ? -1
            : lower < 0n && upper >= 0n
              ? mkBvApp(manager, OP_SIGN_EXT, [fresh], [size - width])
              : mkBvApp(manager, OP_CONCAT, [
                  manager.mkBvNumeral(lower < 0n ? -1n : 0n, size - width),
                  fresh,
                ]);
      if (def === -1) continue;
      manager.incRef(variable);
      manager.incRef(def);
      substitution.set(variable, def);
      definitions.push({ decl: manager.decls[variable], def });
    }
  if (isInfeasible) goal.assert(manager.falseExpr);
  else if (substitution.size > 0) {
    let rewritten = -1;
    const size = goal.forms.size;
    for (let index = 0; index < size && !goal.isInconsistent; index++) {
      const next = replacer.rewrite(goal.forms.items[index]);
      if (rewritten !== -1) manager.decRef(rewritten);
      rewritten = next;
      goal.update(index, rewritten);
    }
    if (!goal.isInconsistent) {
      if (hidden.length > 0) goal.addDefinitions(hidden);
      goal.addDefinitions(definitions);
    }
    if (rewritten !== -1) manager.decRef(rewritten);
  }
  for (const [variable, def] of substitution) {
    manager.decRef(variable);
    manager.decRef(def);
  }
  replacer.release();
  return [goal];
};
