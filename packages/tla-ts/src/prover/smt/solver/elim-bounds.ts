import {
  type AstManager,
  KIND_VAR,
  OP_ADD,
  OP_GE,
  OP_LE,
  OP_MUL,
  OP_NOT,
  OP_OR,
  QUANTIFIER_FORALL,
} from "./ast";
import { Rational } from "./rational";
import { RewriterTpl } from "./rewriter-tpl";
import { collectUsedVars, elimUnusedVars } from "./var-subst";

interface Bound {
  lower: number;
  upper: number;
}

const getBound = (manager: AstManager, atom: number): Bound | undefined => {
  const isNegated = manager.getOp(atom) === OP_NOT;
  const inequality = isNegated ? manager.getArg(atom, 0) : atom;
  const op = manager.getOp(inequality);
  if ((op !== OP_LE && op !== OP_GE) || !manager.isNumeral(manager.getArg(inequality, 1)))
    return undefined;
  const isLe = (op === OP_LE) !== isNegated;
  const term = manager.getArg(inequality, 0);
  const bound = { lower: -1, upper: -1 };
  if (manager.kinds[term] === KIND_VAR) bound.upper = term;
  else if (manager.getOp(term) === OP_ADD && manager.getNumArgs(term) === 2) {
    const first = manager.getArg(term, 0);
    if (manager.kinds[first] === KIND_VAR) bound.upper = first;
    else if (!manager.isGroundApp(first)) return undefined;
    const second = manager.getArg(term, 1);
    if (
      manager.getOp(second) !== OP_MUL ||
      !manager.isNumeral(manager.getArg(second, 0)) ||
      !manager.getRationalValue(manager.getArg(second, 0)).equals(Rational.minusOne)
    )
      return undefined;
    const negated = manager.getArg(second, 1);
    if (manager.kinds[negated] === KIND_VAR) bound.lower = negated;
    else if (!manager.isGroundApp(negated)) return undefined;
  } else return undefined;
  return isLe ? bound : { lower: bound.upper, upper: bound.lower };
};

export class ElimBoundsRw extends RewriterTpl {
  reduceQuantifier(expr: number, body: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    if (data.kind !== QUANTIFIER_FORALL) return -1;
    const numVars = data.sorts.length;
    const atoms = manager.getOp(body) === OP_OR ? manager.getArgs(body) : [body];
    const isUsed = Array.from({ length: numVars }, () => false);
    for (const atom of atoms)
      if (getBound(manager, atom) === undefined)
        for (const [index, isVarUsed] of collectUsedVars(manager, atom, numVars).entries())
          if (isVarUsed) isUsed[index] = true;
    if (isUsed.every((isVarUsed) => isVarUsed)) return -1;
    const isCandidate = (variable: number) =>
      variable !== -1 && manager.values[variable] < numVars && !isUsed[manager.values[variable]];
    const lowers = new Set<number>();
    const uppers = new Set<number>();
    for (const atom of atoms) {
      const bound = getBound(manager, atom);
      if (bound === undefined) continue;
      if (isCandidate(bound.lower)) lowers.add(bound.lower);
      if (isCandidate(bound.upper)) uppers.add(bound.upper);
    }
    const candidates = new Set(
      [...lowers, ...uppers].filter((variable) => !lowers.has(variable) || !uppers.has(variable)),
    );
    if (candidates.size === 0) return -1;
    const kept = atoms.filter((atom) => {
      const bound = getBound(manager, atom);
      return bound === undefined || (!candidates.has(bound.lower) && !candidates.has(bound.upper));
    });
    if (kept.length === atoms.length) return -1;
    if (kept.length === 0) {
      manager.incRef(manager.falseExpr);
      return manager.falseExpr;
    }
    return manager.withTemporaries(() =>
      elimUnusedVars(manager, manager.mkQuantifier({ ...data, body: manager.mkOr(kept) })),
    );
  }
}
