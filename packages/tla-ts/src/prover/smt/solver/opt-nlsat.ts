import { SmtCanceledError, SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  FAMILY_USER,
  KIND_APP,
  OP_ADD,
  OP_AND,
  OP_EQ,
  OP_GE,
  OP_LE,
  OP_MUL,
  OP_TO_INT,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { Goal } from "./goal";
import { goal2nlsat } from "./goal2nlsat";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import type { AlgebraicManager, Anum } from "./nlsat/algebraic";
import { PolynomialManager, PolynomialRef } from "./nlsat/polynomial";
import { NlsatSolver } from "./nlsat/solver";
import { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { compileInternalTactic, convertModel, type TacticEnvironment } from "./tactic";

const PREPROCESSOR =
  "(and-then (using-params simplify :elim_and true :blast_distinct true) " +
  "(using-params purify-arith :complete false) propagate-values elim-term-ite " +
  "(using-params purify-arith :complete false) " +
  "(using-params simplify :elim_and true :blast_distinct true) tseitin-cnf-core " +
  "(using-params simplify :elim_and true :blast_distinct true))";

interface NlsatSupremum {
  value: Anum;
  lower: Rational;
  upper: Rational;
  isOpen: boolean;
}

interface NlsatNoModel {
  hasModel: false;
}

interface NlsatOptimum {
  hasModel: true;
  model: ProtoModel;
  value: Anum;
  lower: Rational;
  upper: Rational;
  isUnbounded: boolean;
  sup: NlsatSupremum | null;
}

interface NlsatOptOutcome {
  status: number;
  result: NlsatNoModel | NlsatOptimum;
}

interface PreprocessedGoal {
  status: typeof L_TRUE;
  goal: Goal;
  objective: number;
}

interface PreprocessedNothing {
  status: typeof L_FALSE | typeof L_UNDEF;
}

const NO_MODEL: NlsatNoModel = { hasModel: false };

interface Loaded {
  solver: NlsatSolver;
  variable: number;
  x2t: Map<number, number>;
  a2b: Map<number, number>;
}

export const isInNraFragment = (manager: AstManager, exprs: readonly number[]) => {
  const seen = new Set<number>();
  const todo = [...exprs];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (seen.has(expr)) continue;
    seen.add(expr);
    if (manager.kinds[expr] !== KIND_APP) return false;
    const family = manager.getFamily(expr);
    const isAllowed =
      family === FAMILY_BASIC ||
      family === FAMILY_ARITH ||
      (family === FAMILY_USER && manager.getNumArgs(expr) === 0);
    const sort = manager.sorts[expr];
    if (!isAllowed || (sort !== SORT_BOOL && sort !== SORT_INT && sort !== SORT_REAL)) return false;
    manager.pushArgs(expr, todo);
  }
  return true;
};

const getCoarseInterval = (
  manager: AstManager,
  am: AlgebraicManager,
  value: Anum,
): [Rational, Rational] => {
  const pm = new PolynomialManager(manager.limit);
  const p = new PolynomialRef(pm);
  p.set(pm.toPolynomial(am.getPolynomial(value), 0));
  const roots = am.isolateRoots(pm, p.get(), []);
  p.reset();
  const index = roots.findIndex((root) => am.compare(root, value) === 0);
  const lower = index === 0 ? am.intLt(value) : am.select(roots[index - 1], value);
  const upper = index + 1 === roots.length ? am.intGt(value) : am.select(value, roots[index + 1]);
  return [am.toRational(lower), am.toRational(upper)];
};

export const mkAlgebraicEq = (manager: AstManager, term: number, value: Anum) => {
  const am = manager.am;
  if (am.isRational(value))
    return manager.mkApp(OP_EQ, [term, manager.mkRealNumeral(am.toRational(value))], SORT_BOOL);
  const coeffs = am.getPolynomial(value);
  let polynomial = -1;
  for (let index = coeffs.length - 1; index >= 0; index--) {
    const coeff = manager.mkRealNumeral(Rational.of(coeffs[index]));
    polynomial =
      polynomial === -1
        ? coeff
        : manager.mkApp(
            OP_ADD,
            [manager.mkApp(OP_MUL, [polynomial, term], SORT_REAL), coeff],
            SORT_REAL,
          );
  }
  const [lower, upper] = getCoarseInterval(manager, am, value);
  return manager.mkApp(
    OP_AND,
    [
      manager.mkApp(OP_EQ, [polynomial, manager.mkRealNumeral(Rational.zero)], SORT_BOOL),
      manager.mkApp(OP_GE, [term, manager.mkRealNumeral(lower)], SORT_BOOL),
      manager.mkApp(OP_LE, [term, manager.mkRealNumeral(upper)], SORT_BOOL),
    ],
    SORT_BOOL,
  );
};

const isOccurring = (manager: AstManager, target: number, expr: number) => {
  const seen = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (current === target) return true;
    if (seen.has(current) || manager.kinds[current] !== KIND_APP) continue;
    seen.add(current);
    manager.pushArgs(current, todo);
  }
  return false;
};

const mkLowerBound = (solver: NlsatSolver, variable: number, value: Anum, isStrict: boolean) => {
  const am = solver.am;
  const pm = solver.pm;
  const p = new PolynomialRef(pm);
  if (am.isRational(value)) {
    const rational = am.toRational(value);
    p.set(pm.mkLinear([rational.den], [variable], -rational.num));
    const literal = isStrict
      ? solver.mkIneqLiteral("GT", [p.get()], [false])
      : solver.mkIneqLiteral("LT", [p.get()], [false]) ^ 1;
    p.reset();
    return literal;
  }
  p.set(pm.toPolynomial(am.getPolynomial(value), variable));
  const index = am.isolateRoots(pm, p.get(), []).findIndex((root) => am.compare(root, value) === 0);
  const literal =
    index === -1
      ? null
      : 2 * solver.mkRootAtom(isStrict ? "ROOT_GT" : "ROOT_GE", variable, index + 1, p.get());
  p.reset();
  return literal;
};

const getBracket = (solver: NlsatSolver, value: Anum): [Rational, Rational] => {
  const am = solver.am;
  if (!am.isRational(value)) return am.getInterval(value, 40);
  const rational = am.toRational(value);
  return [rational, rational];
};

export class NlsatOpt {
  constructor(
    private manager: AstManager,
    private environment: TacticEnvironment,
  ) {}

  // hard, T = objective, lower <= T <= upper, normalized for goal2nlsat. T only occurs in these
  // assertions, so preprocessing can only lose it by eliminating the objective.
  private preprocess(
    hard: readonly number[],
    objective: number,
    lower: Rational,
    upper: Rational | null,
  ): PreprocessedGoal | PreprocessedNothing {
    const manager = this.manager;
    const pinned = new RefVector(manager);
    const pin = (expr: number) => {
      pinned.push(expr);
      return expr;
    };
    const target = pin(manager.mkFreshConst("opt.nlsat.obj", SORT_REAL));
    const goal = new Goal(manager);
    for (const form of hard) goal.assert(form);
    goal.assert(pin(manager.mkApp(OP_EQ, [target, objective], SORT_BOOL)));
    goal.assert(pin(manager.mkApp(OP_GE, [target, manager.mkRealNumeral(lower)], SORT_BOOL)));
    if (upper !== null)
      goal.assert(pin(manager.mkApp(OP_LE, [target, manager.mkRealNumeral(upper)], SORT_BOOL)));
    const goals = (() => {
      try {
        return compileInternalTactic(this.environment, PREPROCESSOR)(goal);
      } catch (error) {
        if (!(error instanceof SmtTacticError)) throw error;
        return null;
      }
    })();
    pinned.reset();
    const result = goals?.length === 1 ? goals[0] : null;
    if (result === null) return { status: L_UNDEF };
    if (result.isInconsistent) return { status: L_FALSE };
    return result.forms.items.some((form) => isOccurring(manager, target, form))
      ? { status: L_TRUE, goal: result, objective: target }
      : { status: L_UNDEF };
  }

  // The objective is nlsat's first variable and its maximization target.
  private load(goal: Goal, objective: number): Loaded | null {
    const solver = new NlsatSolver(this.manager.limit);
    const variable = solver.mkVar(false);
    const x2t = new Map([[objective, variable]]);
    const a2b = new Map<number, number>();
    try {
      goal2nlsat(this.manager, goal.forms.items, solver, x2t, a2b, null);
    } catch (error) {
      if (!(error instanceof SmtTacticError)) throw error;
      return null;
    }
    solver.setMaxVar(variable);
    return { solver, variable, x2t, a2b };
  }

  private extractModel(loaded: Loaded, goal: Goal, objective: number) {
    const manager = this.manager;
    const model = new ProtoModel(manager);
    for (const [term, variable] of loaded.x2t) {
      if (term === objective || !manager.isUninterpretedConst(term)) continue;
      const value = loaded.solver.getValue(variable);
      const isInt = manager.sorts[term] === SORT_INT;
      const numeral =
        isInt && !loaded.solver.am.isInt(value)
          ? manager.mkApp(OP_TO_INT, [manager.mkAlgebraicNumeral(value)], SORT_INT)
          : manager.mkAlgebraicNumeral(value, isInt ? SORT_INT : SORT_REAL);
      model.registerConst(manager.decls[term], numeral);
    }
    for (const [atom, boolVar] of loaded.a2b) {
      if (!manager.isUninterpretedConst(atom)) continue;
      const value = loaded.solver.getBoolValue(boolVar);
      if (value === L_UNDEF) continue;
      model.registerConst(
        manager.decls[atom],
        value === L_TRUE ? manager.trueExpr : manager.falseExpr,
      );
    }
    return convertModel(goal, model);
  }

  private getBoundedLimit(ticks: number, query: () => number) {
    const limit = this.manager.limit;
    if (ticks === 0 || !limit.inc()) return L_UNDEF;
    limit.push(ticks);
    try {
      return query();
    } catch (error) {
      if (!(error instanceof SmtTacticError || error instanceof SmtCanceledError)) throw error;
      return L_UNDEF;
    } finally {
      limit.pop();
    }
  }

  private checkLimit(goal: Goal, objective: number, bound: Anum | null) {
    const loaded = this.load(goal, objective);
    if (loaded === null) return L_UNDEF;
    return loaded.solver.checkLimit(loaded.variable, bound);
  }

  // Whether the objective is unbounded above over the assertions with objective >= lower.
  proveUnbounded(hard: readonly number[], objective: number, lower: Rational) {
    if (!isInNraFragment(this.manager, [...hard, objective])) return L_UNDEF;
    const preprocessed = this.preprocess(hard, objective, lower, null);
    if (preprocessed.status !== L_TRUE) return preprocessed.status;
    return this.checkLimit(preprocessed.goal, preprocessed.objective, null);
  }

  // Refuting T >= sup, at a model below an open candidate supremum, proves a strict upper bound,
  // but not that feasible values approach it.
  private proveStrictUpperBound(loaded: Loaded, sup: Anum, best: Anum): NlsatSupremum | null {
    const solver = loaded.solver;
    if (solver.am.compare(sup, best) <= 0) return null;
    const literal = mkLowerBound(solver, loaded.variable, sup, false);
    if (literal === null) return null;
    solver.mkExternalClause([literal], null);
    if (solver.check() !== L_FALSE) return null;
    const value = solver.am.copy(sup);
    const bracket = getBracket(solver, value);
    return { value, lower: bracket[0], upper: bracket[1], isOpen: false };
  }

  maximize(
    hard: readonly number[],
    objective: number,
    lower: Rational,
    upper: Rational | null,
    maxRounds: number,
    supremumRlimit: number,
  ): NlsatOptOutcome {
    if (!isInNraFragment(this.manager, [...hard, objective]))
      return { status: L_UNDEF, result: NO_MODEL };
    const preprocessed = this.preprocess(hard, objective, lower, upper);
    if (preprocessed.status !== L_TRUE) return { status: preprocessed.status, result: NO_MODEL };
    const goal = preprocessed.goal;
    const loaded = this.load(goal, preprocessed.objective);
    if (loaded === null) return { status: L_UNDEF, result: NO_MODEL };
    const solver = loaded.solver;
    const am = solver.am;
    let status = L_UNDEF;
    let best: Anum | null = null;
    let sup: Anum | null = null;
    let model: ProtoModel | null = null;
    let isUnbounded = false;
    let unboundedRounds = 0;
    // A round without a candidate supremum is inconclusive, since bounds through later variables
    // reach the objective only through conflicts, so five in a row probe for a feasible ray.
    for (let round = 0; round < maxRounds && this.manager.limit.inc(); round++) {
      status = solver.check();
      if (status !== L_TRUE) break;
      best = am.copy(solver.getValue(loaded.variable));
      const found = solver.getMaxVarSup();
      sup = found === null ? null : found.sup;
      model?.decRef();
      model = this.extractModel(loaded, goal, preprocessed.objective);
      model.incRef();
      if (sup === null) {
        if (++unboundedRounds > 4) {
          if (upper === null && this.checkLimit(goal, preprocessed.objective, null) === L_TRUE)
            isUnbounded = true;
          break;
        }
      } else unboundedRounds = 0;
      const literal = mkLowerBound(solver, loaded.variable, best, true);
      if (literal === null) {
        status = L_UNDEF;
        break;
      }
      solver.mkExternalClause([literal], null);
    }
    if (best === null || model === null)
      return { status: status === L_FALSE ? L_FALSE : L_UNDEF, result: NO_MODEL };
    const bracket = getBracket(solver, best);
    const certified =
      status === L_TRUE && sup !== null ? this.proveStrictUpperBound(loaded, sup, best) : null;
    if (certified !== null)
      certified.isOpen =
        this.getBoundedLimit(supremumRlimit, () =>
          this.checkLimit(goal, preprocessed.objective, certified.value),
        ) === L_TRUE;
    return {
      status: status === L_FALSE || isUnbounded || certified?.isOpen === true ? L_TRUE : L_UNDEF,
      result: {
        hasModel: true,
        model,
        value: best,
        lower: bracket[0],
        upper: bracket[1],
        isUnbounded,
        sup: certified,
      },
    };
  }
}
