import { SmtCanceledError, SmtTacticError } from "../../../errors";
import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ADD,
  OP_AND,
  OP_EQ,
  OP_IMPLIES,
  OP_OR,
  OP_UBV2INT,
  OP_ULEQ,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { mkNot } from "./ast-util";
import { BoundManager } from "./bound-manager";
import { mkBvApp } from "./bv-decl-plugin";
import { Bv2IntContext, Bv2IntRewriter } from "./bv2int-rewriter";
import { createCard2Bv } from "./card2bv";
import { DependentExprState } from "./dependent-expr-state";
import { runEnum2Bv } from "./dt2bv-tactic";
import { release } from "./expr-ref";
import { ExprSafeReplace } from "./expr-safe-replace";
import { type Definition, Goal } from "./goal";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { RefVector } from "./ref-vector";
import { Rewriter } from "./rewriter";
import { convertModel, getRewriterOptions } from "./tactic";
import { UINT_MAX } from "./sat/clause";
import type { SatParams } from "./sat/config";
import { IncSatSolver } from "./sat/inc-sat-solver";

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
  const state = new DependentExprState(manager, goal);
  const bounds = new BoundManager(manager);
  state.forEachIndex((index) => collectBounds(manager, bounds, goal.forms.items[index]));
  const substitution = new ExprSafeReplace(manager);
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
    definitions.push(
      { decl: manager.decls[bits], def: -1 },
      { decl: manager.decls[expr], def: replacement },
    );
    if (!offset.isZero() && (domainSize & (domainSize - 1n)) !== 0n)
      sideConditions.push(
        mkBvApp(manager, OP_ULEQ, [bits, manager.mkBvNumeral(domainSize - 1n, numBits)]),
      );
    substitution.insert(expr, replacement);
  }
  try {
    if (substitution.sources.size > 0) {
      const context = new Bv2IntContext(manager, UINT_MAX);
      const rewriter = new Bv2IntRewriter(manager, context);
      let replaced = -1;
      let result = -1;
      try {
        state.forEachIndex((index) => {
          const form = goal.forms.items[index];
          const nextReplaced = substitution.apply(form);
          release(manager, replaced);
          replaced = nextReplaced;
          const nextResult = rewriter.rewrite(replaced);
          release(manager, result);
          result = nextResult;
          if (result !== form) goal.update(index, result);
        });
      } finally {
        release(manager, result);
        release(manager, replaced);
        rewriter.release();
        context.release();
      }
    }
    for (const condition of sideConditions.items) goal.assert(condition);
    if (definitions.length > 0) goal.addDefinitions(definitions);
  } finally {
    substitution.release();
    sideConditions.reset();
    trail.reset();
  }
};

// The formulas of simplifier_solver. Unlike a goal, it keeps a formula as it comes, and
// flatten_suffix moves the conjuncts of a formula to the end after each simplifier.
class SolverFormulas extends Goal {
  override assert(form: number) {
    if (this.manager.isFalse(form)) this.isInconsistent = true;
    this.forms.push(form);
  }

  override update(index: number, form: number) {
    if (this.manager.isFalse(form)) this.isInconsistent = true;
    this.forms.set(index, form);
  }

  flattenSuffix() {
    const manager = this.manager;
    const forms = this.forms;
    const seen = new Set<number>();
    const pinned = new RefVector(manager);
    let kept = 0;
    for (let index = 0; index < forms.size; index++) {
      const form = forms.items[index];
      pinned.push(form);
      if (seen.has(form)) continue;
      seen.add(form);
      if (manager.isTrue(form)) continue;
      if (manager.getOp(form) === OP_AND) {
        for (const arg of manager.getArgs(form)) this.assert(arg);
        continue;
      }
      if (manager.isNot(form) && manager.getOp(manager.getArg(form, 0)) === OP_OR) {
        for (const arg of manager.getArgs(manager.getArg(form, 0)))
          this.assert(mkNot(manager, arg));
        continue;
      }
      if (index !== kept) forms.set(kept, form);
      kept++;
    }
    while (forms.size > kept) forms.pop();
    pinned.reset();
  }
}

// simplifier_solver runs mk_fd_simplifier, a then_simplifier, as the one simplifier of its own
// then_simplifier. Each checks the limit before a simplifier and stops at one that the limit
// stopped, and simplifier_solver::flush then leaves the formulas out of the solver.
const runFdSimplifier = (manager: AstManager, forms: readonly number[]) => {
  const fmls = new SolverFormulas(manager);
  for (const form of forms) fmls.assert(form);
  const state = new DependentExprState(manager, fmls);
  const simplifiers = [
    () => runBoundedInt2Bv(manager, fmls),
    () => {
      const simplifier = createCard2Bv(manager, getRewriterOptions(manager, new Map()))(state);
      try {
        simplifier.reduce();
      } finally {
        simplifier.release();
      }
    },
    () => runEnum2Bv(manager, fmls, (visit) => state.forEachIndex(visit)),
  ];
  try {
    if (!fmls.isInconsistent && manager.limit.inc())
      for (const simplify of simplifiers) {
        if (fmls.isInconsistent || !manager.limit.inc()) break;
        try {
          simplify();
        } catch (error) {
          if (!(error instanceof SmtCanceledError)) throw error;
          break;
        }
        fmls.flattenSuffix();
      }
  } finally {
    state.release();
  }
  if (!manager.limit.inc()) fmls.reset();
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
      core: solver.getUnsatCore().map((dep) => assumptions[asms1.indexOf(dep)] ?? dep),
      reasonUnknown: solver.reasonUnknown,
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
    const result = solver.check();
    goal.reset();
    if (result === L_TRUE) {
      const model = solver.getModel();
      // simplifier_solver::get_model_core converts the model of its solver within the tactic.
      const converted = model === null ? null : convertModel(fmls, model);
      converted?.incRef();
      if (converted !== null) goal.model = converted;
    } else if (result === L_FALSE) goal.assert(manager.falseExpr);
    else {
      if (!manager.limit.inc()) throw new SmtTacticError("canceled");
      for (const form of solver.getAssertions()) goal.assert(form);
      goal.converters = [...goal.converters, ...fmls.converters, ...solver.getConverters()];
    }
    goal.depth++;
    return [goal];
  } finally {
    solver.release();
  }
};

// mk_fd_solver, which check-sat runs for QF_FD. It keeps the reason of inc_sat_solver, also past an
// exception, and get-model converts its model outside the limit of the check.
export const checkFdSolver = (manager: AstManager, params: SatParams, forms: readonly number[]) => {
  const fmls = runFdSimplifier(manager, forms);
  const solver = new IncSatSolver(manager, params);
  const limit = manager.limit;
  const wasSuspended = limit.isSuspended;
  try {
    for (const form of fmls.forms.items) solver.assertExpr(form);
    const result = (() => {
      try {
        return solver.check();
      } catch (error) {
        if (!(error instanceof SmtCanceledError)) throw error;
        return L_UNDEF;
      }
    })();
    const model = result === L_TRUE ? solver.getModel() : null;
    limit.isSuspended = true;
    return {
      result,
      model: model === null ? undefined : convertModel(fmls, model.copy()),
      reasonUnknown: solver.reasonUnknown,
    };
  } finally {
    limit.isSuspended = wasSuspended;
    solver.release();
  }
};
