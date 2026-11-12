// Ported from Z3 (src/tactic/fd_solver/fd_solver.cpp, src/tactic/fd_solver/fd_simplifier.cpp,
// src/solver/simplifier_solver.cpp, src/solver/solver2tactic.cpp), MIT license, see
// z3-license.txt.
import { SmtCanceledError } from "../../../errors";
import { type AstManager, OP_ADD, OP_AND, OP_UBV2INT, OP_ULEQ, SORT_INT } from "./ast";
import { BoundManager } from "./bound-manager";
import { mkBvApp } from "./bv-decl-plugin";
import { Bv2IntContext, Bv2IntRewriter } from "./bv2int-rewriter";
import { card2bv } from "./card2bv";
import { runEnum2Bv } from "./dt2bv-tactic";
import { type Definition, Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { L_FALSE, L_TRUE } from "./lbool";
import { RefVector } from "./ref-vector";
import { getRewriterOptions } from "./tactic";
import type { SatParams } from "./sat/config";
import { IncSatSolver } from "./sat/inc-sat-solver";
import { SubstReplacer } from "./solve-eqs";

const UINT_MAX = 4294967295;

const getNumBits = (value: bigint) => {
  let bound = 1n;
  let numBits = 1;
  while (bound <= value) {
    numBits++;
    bound *= 2n;
  }
  return numBits;
};

const collectBounds = (manager: AstManager, bounds: BoundManager, form: number) => {
  if (manager.getOp(form) !== OP_AND) {
    bounds.add(form);
    return;
  }
  for (const arg of manager.getArgs(form)) collectBounds(manager, bounds, arg);
};

// bounded_int2bv_simplifier: an integer constant between two bounds becomes an unsigned
// bit-vector plus the lower bound.
const runBoundedInt2Bv = (manager: AstManager, goal: Goal) => {
  const bounds = new BoundManager(manager);
  for (const form of goal.forms.items) collectBounds(manager, bounds, form);
  const substitution = new ObjMap<number>((expr) => manager.hashes[expr]);
  const trail = new RefVector(manager);
  const sideConditions = new RefVector(manager);
  const definitions: Definition[] = [];
  for (const expr of bounds.boundedVars) {
    const lower = bounds.lowers.get(expr);
    const upper = bounds.uppers.get(expr);
    if (
      lower === undefined ||
      upper === undefined ||
      lower.value.compare(upper.value) > 0 ||
      lower.isStrict ||
      upper.isStrict ||
      manager.sorts[expr] !== SORT_INT
    )
      continue;
    const domainSize = upper.value.sub(lower.value).num + 1n;
    const numBits = getNumBits(domainSize);
    const bits = manager.mkFreshConst("b", manager.mkBvSort(numBits));
    trail.push(bits);
    const offset = lower.value;
    const unsigned = mkBvApp(manager, OP_UBV2INT, [bits]);
    const replacement = offset.isZero()
      ? unsigned
      : manager.mkApp(OP_ADD, [unsigned, manager.mkNumeral(offset.num)], SORT_INT);
    trail.push(replacement);
    definitions.push(
      { decl: manager.decls[bits], def: -1 },
      { decl: manager.decls[expr], def: replacement },
    );
    if (!offset.isZero() && (domainSize & (domainSize - 1n)) !== 0n)
      sideConditions.push(
        mkBvApp(manager, OP_ULEQ, [bits, manager.mkBvNumeral(domainSize - 1n, numBits)]),
      );
    substitution.set(expr, replacement);
  }
  if (substitution.size > 0) {
    const replacer = new SubstReplacer(manager, substitution);
    const context = new Bv2IntContext(manager, UINT_MAX);
    const rewriter = new Bv2IntRewriter(manager, context);
    for (let index = 0; index < goal.forms.size; index++) {
      const form = goal.forms.items[index];
      const replaced = replacer.rewrite(form);
      const result = rewriter.rewrite(replaced);
      manager.decRef(replaced);
      if (result !== form) goal.update(index, result);
      manager.decRef(result);
    }
    rewriter.release();
    context.release();
    replacer.release();
  }
  for (const condition of sideConditions.items) goal.assert(condition);
  if (definitions.length > 0) goal.addDefinitions(definitions);
  sideConditions.reset();
  trail.reset();
};

// qffd without parallel.enable: solver2tactic over simplifier_solver(inc_sat_solver, fd_simplifier).
export const createFdTactic = (manager: AstManager, params: SatParams) => (goal: Goal) => {
  const fmls = new Goal(manager);
  for (const form of goal.forms.items) fmls.assert(form);
  runBoundedInt2Bv(manager, fmls);
  card2bv(manager, fmls, getRewriterOptions(manager, new Map()));
  runEnum2Bv(manager, fmls);
  const solver = new IncSatSolver(manager, params, false);
  try {
    for (const form of fmls.forms.items) solver.assertExpr(form);
    const result = fmls.isInconsistent ? L_FALSE : solver.check();
    goal.reset();
    if (result === L_TRUE) {
      const model = solver.getModel();
      model?.incRef();
      if (model !== null) {
        goal.converters = [...goal.converters, ...fmls.converters];
        goal.model = model;
      }
    } else if (result === L_FALSE) goal.assert(manager.falseExpr);
    else {
      if (!manager.limit.inc()) throw new SmtCanceledError();
      for (const form of solver.getAssertions()) goal.assert(form);
      goal.converters = [...goal.converters, ...fmls.converters, ...solver.getConverters()];
    }
    goal.depth++;
    return [goal];
  } finally {
    solver.release();
  }
};
