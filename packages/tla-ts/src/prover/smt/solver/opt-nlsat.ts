// Ported from Z3 (src/opt/opt_nlsat.cpp), MIT license, see z3-license.txt.
import { SmtCanceledError, SmtTacticError, SmtUnsupportedError } from "../../../errors";
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
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { Goal } from "./goal";
import { goal2nlsat } from "./goal2nlsat";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { type Anum } from "./nlsat/algebraic";
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

export interface NlsatOptResult {
  value: Anum | null;
  lower: Rational;
  upper: Rational;
  isAttained: boolean;
  isUnbounded: boolean;
  hasSup: boolean;
  isOpen: boolean;
  sup: Anum | null;
  supLower: Rational;
  supUpper: Rational;
  model: ProtoModel | null;
}

interface NlsatOptOutcome {
  status: number;
  result: NlsatOptResult;
}

interface Preprocessed {
  status: number;
  goal: Goal | null;
  objective: number;
}

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

const getCoarseInterval = (solver: NlsatSolver, value: Anum): [Rational, Rational] => {
  const am = solver.am;
  const polynomial = solver.pm.fromCoeffs(am.getPolynomial(value), 0);
  const roots = am.isolateRoots(solver.pm, polynomial, []);
  const index = roots.findIndex((root) => am.compare(root, value) === 0);
  const lower = index === 0 ? am.intLt(value) : am.select(roots[index - 1], value);
  const upper = index + 1 === roots.length ? am.intGt(value) : am.select(value, roots[index + 1]);
  return [am.toRational(lower), am.toRational(upper)];
};

export const mkAlgebraicEq = (manager: AstManager, term: number, value: Anum) => {
  const solver = new NlsatSolver();
  const am = solver.am;
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
  const [lower, upper] = getCoarseInterval(solver, value);
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
  if (am.isRational(value)) {
    const rational = am.toRational(value);
    const polynomial = pm.mkLinear([rational.den], [variable], -rational.num);
    return isStrict
      ? solver.mkIneqLiteral("GT", [polynomial], [false])
      : solver.mkIneqLiteral("LT", [polynomial], [false]) ^ 1;
  }
  const polynomial = pm.fromCoeffs(am.getPolynomial(value), variable);
  const index = am
    .isolateRoots(pm, polynomial, [])
    .findIndex((root) => am.compare(root, value) === 0);
  if (index === -1) return null;
  return 2 * solver.mkRootAtom(isStrict ? "ROOT_GT" : "ROOT_GE", variable, index + 1, polynomial);
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

  private preprocess(
    hard: readonly number[],
    objective: number,
    lower: Rational | null,
    upper: Rational | null,
  ): Preprocessed {
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
    if (lower !== null)
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
    if (result?.isInconsistent === true) return { status: L_FALSE, goal: null, objective: target };
    const isKept =
      result !== null && result.forms.items.some((form) => isOccurring(manager, target, form));
    return { status: isKept ? L_TRUE : L_UNDEF, goal: isKept ? result : null, objective: target };
  }

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
      if (isInt && !loaded.solver.am.isInt(value))
        throw new SmtUnsupportedError("an integer variable that nlsat assigns a fraction");
      const numeral = manager.mkAlgebraicNumeral(value, isInt ? SORT_INT : SORT_REAL);
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
    if (loaded === null) return { status: L_UNDEF, coverSup: null };
    return loaded.solver.checkLimit(loaded.variable, bound);
  }

  maximize(
    hard: readonly number[],
    objective: number,
    lower: Rational | null,
    upper: Rational | null,
    maxRounds: number,
    supremumRlimit: number,
  ): NlsatOptOutcome {
    const result: NlsatOptResult = {
      value: null,
      lower: Rational.zero,
      upper: Rational.zero,
      isAttained: false,
      isUnbounded: false,
      hasSup: false,
      isOpen: false,
      sup: null,
      supLower: Rational.zero,
      supUpper: Rational.zero,
      model: null,
    };
    if (!isInNraFragment(this.manager, [...hard, objective])) return { status: L_UNDEF, result };
    const preprocessed = this.preprocess(hard, objective, lower, upper);
    const goal = preprocessed.goal;
    if (goal === null) return { status: preprocessed.status, result };
    const loaded = this.load(goal, preprocessed.objective);
    if (loaded === null) return { status: L_UNDEF, result };
    const solver = loaded.solver;
    const am = solver.am;
    let status = L_UNDEF;
    let best: Anum | null = null;
    let sup: Anum | null = null;
    let unboundedRounds = 0;
    for (let round = 0; round < maxRounds && this.manager.limit.inc(); round++) {
      status = solver.check();
      if (status !== L_TRUE) break;
      best = am.copy(solver.getValue(loaded.variable));
      const found = solver.getMaxVarSup();
      sup = found === null ? null : found.sup;
      result.model?.decRef();
      result.model = this.extractModel(loaded, goal, preprocessed.objective);
      result.model.incRef();
      if (sup === null) {
        if (++unboundedRounds > 4) {
          const limit = upper === null ? this.checkLimit(goal, preprocessed.objective, null) : null;
          if (limit?.status === L_TRUE) result.isUnbounded = true;
          // Without the arithmetic climb, the cover's supremum stands in for its upper bound.
          const coverSup = limit?.status === L_FALSE ? limit.coverSup : null;
          if (coverSup !== null) {
            result.model?.decRef();
            const bracket = getBracket(solver, coverSup);
            return this.maximize(hard, objective, lower, bracket[1], maxRounds, supremumRlimit);
          }
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
    if (best === null) return { status: status === L_FALSE ? L_FALSE : L_UNDEF, result };
    result.value = best;
    [result.lower, result.upper] = getBracket(solver, best);
    result.isAttained = status === L_FALSE;
    if (status === L_TRUE && sup !== null && am.compare(sup, best) > 0) {
      const literal = mkLowerBound(solver, loaded.variable, sup, false);
      if (literal !== null) {
        solver.mkExternalClause([literal], null);
        if (solver.check() === L_FALSE) {
          result.sup = am.copy(sup);
          [result.supLower, result.supUpper] = getBracket(solver, result.sup);
          result.hasSup = true;
        }
      }
    }
    const certifiedSup = result.sup;
    if (certifiedSup !== null)
      result.isOpen =
        this.getBoundedLimit(
          supremumRlimit,
          () => this.checkLimit(goal, preprocessed.objective, certifiedSup).status,
        ) === L_TRUE;
    return {
      status: result.isAttained || result.isUnbounded || result.isOpen ? L_TRUE : L_UNDEF,
      result,
    };
  }
}
