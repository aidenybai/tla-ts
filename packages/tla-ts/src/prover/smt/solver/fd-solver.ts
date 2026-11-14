// Ported from Z3 (src/tactic/fd_solver/fd_solver.cpp, src/tactic/fd_solver/fd_simplifier.cpp,
// src/solver/simplifier_solver.cpp, src/solver/solver2tactic.cpp), MIT license, see
// z3-license.txt.
import { SmtCanceledError } from "../../../errors";
import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ADD,
  OP_AND,
  OP_EQ,
  OP_IMPLIES,
  OP_UBV2INT,
  OP_ULEQ,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { BoundManager } from "./bound-manager";
import { mkBvApp } from "./bv-decl-plugin";
import { Bv2IntContext, Bv2IntRewriter } from "./bv2int-rewriter";
import { card2bv } from "./card2bv";
import { runEnum2Bv } from "./dt2bv-tactic";
import { ExprSafeReplace } from "./expr-safe-replace";
import { type Definition, Goal } from "./goal";
import { ObjMap } from "./hashtable";
import { L_FALSE, L_TRUE } from "./lbool";
import { RefVector } from "./ref-vector";
import { Rewriter } from "./rewriter";
import { convertModel, getRewriterOptions } from "./tactic";
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

const runFdSimplifier = (manager: AstManager, forms: readonly number[]) => {
  const fmls = new Goal(manager);
  for (const form of forms) fmls.assert(form);
  runBoundedInt2Bv(manager, fmls);
  card2bv(manager, fmls, getRewriterOptions(manager, new Map()));
  runEnum2Bv(manager, fmls);
  return fmls;
};

// The sole uninterpreted constant of a term, which stands for it in the SAT solver.
const getRepresentative = (manager: AstManager, expr: number) => {
  const visited = new Set<number>();
  const todo = [expr];
  let result = -1;
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    if (manager.isUninterpretedConst(current)) {
      if (result !== -1 && result !== current) return -1;
      result = current;
    } else if (manager.kinds[current] === KIND_QUANTIFIER)
      todo.push(manager.getQuantifier(current).body);
    else if (manager.kinds[current] === KIND_APP) manager.pushArgs(current, todo);
  }
  return result;
};

// simplifier_solver::get_consequences over the fd solver: a variable the simplifier defines is
// queried through the constant of its definition, and its value is decoded from that constant's.
export const getFdConsequences = (
  manager: AstManager,
  params: SatParams,
  forms: readonly number[],
  assumptions: readonly number[],
  vars: readonly number[],
) => {
  const fmls = runFdSimplifier(manager, forms);
  const trail = new RefVector(manager);
  const definitions = new ExprSafeReplace(manager);
  for (const converter of fmls.converters)
    if ("definitions" in converter)
      for (const definition of converter.definitions) {
        const decl = manager.funcDecls[definition.decl];
        if (definition.def !== -1 && decl.domain.length === 0)
          definitions.insert(manager.mkApp(definition.decl, [], decl.range), definition.def);
      }
  const rewriter = new Rewriter(manager, getRewriterOptions(manager, new Map()));
  const rewrite = (expr: number) => {
    const result = rewriter.rewrite(expr);
    trail.pushOwned(result);
    return result;
  };
  const flush = (expr: number) => {
    const replaced = definitions.apply(expr);
    trail.pushOwned(replaced);
    return rewrite(replaced);
  };
  const asms1 = assumptions.map(flush);
  const vars1 = vars.map(flush);
  const queryVars = vars1.map((expr) => {
    const representative = getRepresentative(manager, expr);
    return representative === -1 ? expr : representative;
  });
  const solver = new IncSatSolver(manager, params);
  try {
    for (const form of fmls.forms.items) solver.assertExpr(form);
    if (fmls.isInconsistent) solver.assertExpr(manager.falseExpr);
    const found = solver.getConsequences(asms1, queryVars);
    const coreReplace = new ExprSafeReplace(manager);
    asms1.forEach((assumption, index) => coreReplace.insert(assumption, assumptions[index]));
    const consequences = new RefVector(manager);
    for (const consequence of found.consequences) {
      const premise = manager.getArg(consequence, 0);
      const conclusion = manager.getArg(consequence, 1);
      const [query, value] = (() => {
        if (manager.decls[conclusion] === OP_EQ) {
          const lhs = manager.getArg(conclusion, 0);
          const rhs = manager.getArg(conclusion, 1);
          for (const queryVar of queryVars) {
            if (lhs === queryVar) return [lhs, rhs];
            if (rhs === queryVar) return [rhs, lhs];
          }
          return [-1, -1];
        }
        if (manager.isUninterpretedConst(conclusion)) return [conclusion, manager.trueExpr];
        if (
          manager.isNot(conclusion) &&
          manager.isUninterpretedConst(manager.getArg(conclusion, 0))
        )
          return [manager.getArg(conclusion, 0), manager.falseExpr];
        return [-1, -1];
      })();
      const index = queryVars.findIndex(
        (queryVar, position) => queryVar === query && vars[position] !== vars1[position],
      );
      const decoded = (() => {
        if (query === -1 || index === -1) return consequence;
        const substitution = new ExprSafeReplace(manager);
        substitution.insert(query, value);
        const replaced = substitution.apply(vars1[index]);
        trail.pushOwned(replaced);
        substitution.release();
        return manager.mkApp(
          OP_IMPLIES,
          [premise, manager.mkEq(vars[index], rewrite(replaced))],
          SORT_BOOL,
        );
      })();
      consequences.pushOwned(coreReplace.apply(decoded));
    }
    coreReplace.release();
    const model = found.result === L_TRUE ? solver.getModel() : null;
    model?.incRef();
    return {
      result: found.result,
      consequences,
      model: model === null ? undefined : convertModel(fmls, model),
    };
  } finally {
    solver.release();
    rewriter.release();
    definitions.release();
    trail.reset();
  }
};

// qffd without parallel.enable: solver2tactic over simplifier_solver(inc_sat_solver, fd_simplifier).
export const createFdTactic = (manager: AstManager, params: SatParams) => (goal: Goal) => {
  const fmls = runFdSimplifier(manager, goal.forms.items);
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
