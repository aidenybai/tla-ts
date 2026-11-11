// Ported from Z3 (src/nlsat/tactic/nlsat_tactic.cpp), MIT license, see z3-license.txt.
import { SmtTacticError, SmtUnsupportedError } from "../../../errors";
import { type AstManager, SORT_INT } from "./ast";
import type { Goal } from "./goal";
import { goal2nlsat } from "./goal2nlsat";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { NlsatSolver } from "./nlsat/solver";
import { ProtoModel } from "./proto-model";

// Goal2nlsat rejects transcendental applications, so every other variable term is unsupported.
const containsUnsupported = (
  manager: AstManager,
  t2x: ReadonlyMap<number, number>,
  a2b: ReadonlyMap<number, number>,
) => [...t2x.keys(), ...a2b.keys()].some((term) => !manager.isUninterpretedConst(term));

// Undefined when nlsat assigns a fraction to an integer variable.
const mkModel = (
  manager: AstManager,
  solver: NlsatSolver,
  t2x: ReadonlyMap<number, number>,
  a2b: ReadonlyMap<number, number>,
) => {
  const model = new ProtoModel(manager);
  for (const [term, variable] of t2x) {
    const value = solver.getValue(variable);
    if (manager.sorts[term] === SORT_INT && !solver.am.isInt(value)) return undefined;
    model.registerConst(
      manager.decls[term],
      manager.mkAlgebraicNumeral(value, manager.sorts[term]),
    );
  }
  for (const [atom, boolVar] of a2b) {
    const value = solver.getBoolValue(boolVar);
    if (value === L_UNDEF) continue;
    model.registerConst(
      manager.decls[atom],
      value === L_TRUE ? manager.trueExpr : manager.falseExpr,
    );
  }
  return model;
};

export interface NlsatOptions {
  seed: number;
  isShufflingVars: boolean;
  variableOrderingStrategy: number;
}

export const runNlsat = (manager: AstManager, options: NlsatOptions) => (goal: Goal) => {
  if (goal.isDecided()) return [goal];
  if (goal.isProofsEnabled) throw new SmtTacticError("nlsat does not support proof production");
  const solver = new NlsatSolver(manager.limit);
  solver.setSeed(options.seed);
  const t2x = new Map<number, number>();
  const a2b = new Map<number, number>();
  goal2nlsat(manager, goal.forms.items, solver, t2x, a2b, null);
  if (options.isShufflingVars || options.variableOrderingStrategy !== 0)
    throw new SmtUnsupportedError("nlsat's shuffle_vars and variable_ordering_strategy");
  const status = solver.check();
  if (status === L_TRUE && !containsUnsupported(manager, t2x, a2b)) {
    const model = mkModel(manager, solver, t2x, a2b);
    if (model !== undefined) {
      goal.reset();
      goal.model = model;
    }
  }
  if (status === L_FALSE) goal.assert(manager.falseExpr);
  goal.depth++;
  return [goal];
};
