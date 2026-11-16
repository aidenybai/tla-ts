// Ported from Z3 (src/tactic/arith/normalize_bounds_tactic.cpp), MIT license, see z3-license.txt.
import { type AstManager, OP_ADD, SORT_INT } from "./ast";
import { BoundManager } from "./bound-manager";
import type { Definition, Goal } from "./goal";
import { RefVector } from "./ref-vector";
import { Rewriter, type RewriterOptions } from "./rewriter";

export const normalizeBounds = (
  manager: AstManager,
  goal: Goal,
  options: RewriterOptions,
  isIntOnly: boolean,
) => {
  const bounds = new BoundManager(manager);
  if (!goal.isProofsEnabled) for (const form of goal.forms.items) bounds.add(form);
  const getLower = (variable: number) => {
    const lower = bounds.lowers.get(variable);
    return manager.isUninterpretedConst(variable) &&
      (!isIntOnly || manager.sorts[variable] === SORT_INT) &&
      lower !== undefined &&
      !lower.value.isZero()
      ? lower.value
      : undefined;
  };
  if (!bounds.boundedVars.some((variable) => getLower(variable) !== undefined)) return;
  const terms = new RefVector(manager);
  const definitions: Definition[] = [];
  const substitution = new Map<number, number>();
  for (const variable of bounds.boundedVars) {
    const lower = getLower(variable);
    if (lower === undefined) continue;
    const sort = manager.sorts[variable];
    const fresh = manager.mkFreshConst(null, sort);
    terms.push(fresh);
    const def = manager.mkApp(OP_ADD, [fresh, manager.mkNumeralOfSort(lower, sort)], sort);
    terms.push(def);
    substitution.set(variable, def);
    definitions.push(
      { decl: manager.decls[fresh], def: -1 },
      { decl: manager.decls[variable], def },
    );
  }
  const rewriter = new Rewriter(manager, options);
  rewriter.setSubstitution(substitution);
  for (let index = 0; !goal.isInconsistent && index < goal.forms.size; index++) {
    const rewritten = rewriter.rewrite(goal.forms.items[index]);
    goal.update(index, rewritten);
    manager.decRef(rewritten);
  }
  rewriter.release();
  goal.addDefinitions(definitions);
  terms.reset();
  goal.depth++;
};
