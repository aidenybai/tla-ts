// Ported from Z3 (src/math/lp/nra_solver.cpp, src/math/lp/nla_coi.cpp), MIT license, see
// z3-license.txt. nla's bridge to nlsat. The constraints in the cone of influence of the monomials
// to refine go to nlsat, with every monomial and term column replaced by its polynomial. check runs
// nlsat's search on them: a model becomes nla's, and a refutation a lemma over the constraints of
// its core. check_assignment instead hands nlsat the current values, and when they violate a
// constraint, nlsat's linear cell around them becomes a lemma.
// Deviations from Z3:
// - nlsat input it does not implement (NlsatUnsupportedError) answers unknown. That is a linear
//   cell around an irrational section, where Z3 exits the process (levelwise.cpp,
//   add_linear_approximations).
// - nlsat's check(rvalues) never answers satisfied, because its solver starts with the clause
//   [true], whose literal is unassigned outside search. So the satisfied branch of
//   check_assignment, which switches nla to nlsat's model, is left out.
// - A lemma literal of check_assignment is always linear, because the cell bounds are, so
//   add_mul_def, which defines a fresh monomial column, is left out. A nonlinear literal would
//   answer unknown.
// - nlsat counts against the budget of a check only its own steps, not those of the polynomial and
//   algebraic number managers, so a long search stops at a different point than Z3's. Like Z3's,
//   it then throws, which ends the whole check as unknown.
// - Transcendental functions are not supported, so none are registered with nlsat.
import { NlsatUnsupportedError, SmtInvariantError } from "../../../../errors";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { Rational, getLcm } from "../rational";
import { Anum } from "../nlsat/algebraic";
import { NlsatSolver } from "../nlsat/solver";
import type { Polynomial } from "../nlsat/polynomial";
import { isIneqAtom } from "../nlsat/types";
import {
  KIND_EQ,
  KIND_GE,
  KIND_GT,
  KIND_LE,
  KIND_LT,
  KIND_NE,
  type LarConstraint,
} from "./constraints";
import { Explanation } from "./explanation";
import type { LarSolver } from "./lar-solver";
import { LarTerm } from "./lar-term";
import { LemmaBuilder, mkIneq, type NlaCore } from "./nla-core";

interface Occurrences {
  constraints: number[];
  monics: number[];
  terms: number[];
}

// lar_base_constraint::coeffs: the term of a term column, else the column itself.
const getConstraintCoeffs = (lra: LarSolver, constraint: LarConstraint): [number, Rational][] =>
  lra.hasTerm(constraint.column)
    ? [...lra.getTerm(constraint.column).coeffs]
    : [[constraint.column, Rational.one]];

// coi::init: the constraints reachable from the monomials to refine through shared variables,
// monomials and terms, in the order the search reaches them.
const getConeOfInfluence = (core: NlaCore) => {
  const lra = core.lra;
  const occurrences: Occurrences[] = [];
  const getOccurrences = (lpVar: number) =>
    (occurrences[lpVar] ??= { constraints: [], monics: [], terms: [] });
  lra.constraints.constraints.forEach((constraint, index) => {
    if (!constraint.isActive) return;
    for (const entry of getConstraintCoeffs(lra, constraint))
      getOccurrences(entry[0]).constraints.push(index);
  });
  for (const monic of core.emons.monics)
    for (const lpVar of monic.vars) getOccurrences(lpVar).monics.push(monic.variable);
  for (const term of lra.terms)
    for (const entry of term.coeffs) getOccurrences(entry[0]).terms.push(term.column);
  const todo = [...core.toRefine.elems];
  const vars = new Set<number>();
  const constraints = new Set<number>();
  const monics = new Set<number>();
  for (let index = 0; index < todo.length; index++) {
    const lpVar = todo[index];
    if (vars.has(lpVar)) continue;
    vars.add(lpVar);
    const occurring = getOccurrences(lpVar);
    for (const constraintIndex of occurring.constraints) {
      constraints.add(constraintIndex);
      for (const entry of getConstraintCoeffs(lra, lra.constraints.constraints[constraintIndex]))
        todo.push(entry[0]);
    }
    todo.push(...occurring.monics);
    for (const termColumn of occurring.terms) {
      for (const entry of lra.getTerm(termColumn).coeffs) todo.push(entry[0]);
      todo.push(termColumn);
    }
    if (lra.hasTerm(lpVar)) for (const entry of lra.getTerm(lpVar).coeffs) todo.push(entry[0]);
    if (core.emons.isMonicVar(lpVar)) {
      monics.add(lpVar);
      todo.push(...core.emons.get(lpVar).vars);
    }
  }
  return { vars, constraints, monics };
};

// has_large_dyadic_denominator: a denominator 2^k with k >= 24.
const hasLargeDyadicDenominator = (value: Rational) => {
  const den = value.den;
  return den >= 1n << 24n && (den & (den - 1n)) === 0n;
};

// is_dyadic_artifact: a constraint of an nla lemma's atom with a constant whose denominator is a
// large power of two, the value of a column at an LP vertex. nlsat leaves it out, since clearing
// such denominators blows up its resultants.
const isDyadicArtifact = (lra: LarSolver, constraint: LarConstraint) =>
  constraint.isAuxiliary &&
  (hasLargeDyadicDenominator(constraint.rhs.x) ||
    getConstraintCoeffs(lra, constraint).some((entry) => hasLargeDyadicDenominator(entry[1])));

export class NraSolver {
  // m_nlsat and m_values: the solver of the last check, and the values of its model.
  private solver = new NlsatSolver();
  private values: Anum[] = [];
  // m_lp2nl: the nlsat variable of each column the solver has.
  private lp2nl = new Map<number, number>();

  constructor(private core: NlaCore) {}

  get am() {
    return this.solver.am;
  }

  // The steps of the last check.
  get steps() {
    return this.solver.steps;
  }

  // mk_definition: each included column as a polynomial in the included columns that are neither
  // monomials nor terms, scaled by an integer denominator to keep the coefficients integral.
  // Excluded columns have no definition.
  private mkDefinitions(isIncluded: (lpVar: number) => boolean) {
    const core = this.core;
    const lra = core.lra;
    const solver = this.solver;
    const pm = solver.pm;
    const definitions: (Polynomial | null)[] = [];
    const denominators: bigint[] = [];
    for (let lpVar = 0; lpVar < lra.columns.length; lpVar++) {
      if (!isIncluded(lpVar)) {
        definitions.push(null);
        denominators.push(0n);
        continue;
      }
      const variable = solver.mkVar(lra.isInt(lpVar));
      this.lp2nl.set(lpVar, variable);
      if (core.emons.isMonicVar(lpVar)) {
        let definition: Polynomial | null = null;
        let denominator = 1n;
        for (const factor of core.emons.get(lpVar).vars) {
          denominator = denominators[factor] * denominator;
          definition =
            definition === null ? definitions[factor] : pm.mul(definition, definitions[factor]!);
        }
        definitions.push(definition ?? pm.mkVar(variable));
        denominators.push(denominator);
        continue;
      }
      if (lra.hasTerm(lpVar)) {
        const term = [...lra.getTerm(lpVar).coeffs];
        const denominator = term.reduce(
          (result, entry) => getLcm(entry[1].div(Rational.of(denominators[entry[0]])).den, result),
          1n,
        );
        let definition: Polynomial | null = null;
        for (const entry of term) {
          const coeff = entry[1].mul(Rational.of(denominator, denominators[entry[0]]));
          const scaled = pm.mul(pm.mkConst(coeff.num), definitions[entry[0]]!);
          definition = definition === null ? scaled : pm.add(definition, scaled);
        }
        definitions.push(definition ?? pm.zero);
        denominators.push(denominator);
        continue;
      }
      definitions.push(pm.mkVar(variable));
      denominators.push(1n);
    }
    return { definitions, denominators };
  }

  // add_constraint: the constraint sum(coeff * v) kind rhs as den * (sum(coeff / den[v] * def[v]) -
  // rhs) kind 0, where den clears every denominator, in a unit clause that assumes the constraint.
  private addConstraint(
    constraintIndex: number,
    definitions: readonly (Polynomial | null)[],
    denominators: readonly bigint[],
  ) {
    const lra = this.core.lra;
    const solver = this.solver;
    const pm = solver.pm;
    const constraint = lra.constraints.constraints[constraintIndex];
    const rhs = constraint.rhs.x;
    const coeffs = getConstraintCoeffs(lra, constraint);
    const denominator = coeffs.reduce(
      (result, entry) => getLcm(result, entry[1].div(Rational.of(denominators[entry[0]])).den),
      rhs.den,
    );
    let polynomial = pm.mkConst(-(rhs.num * denominator) / rhs.den);
    for (const entry of coeffs) {
      const coeff = entry[1].mul(Rational.of(denominator, denominators[entry[0]]));
      polynomial = pm.add(polynomial, pm.mul(definitions[entry[0]]!, pm.mkConst(coeff.num)));
    }
    const kind = constraint.kind;
    const literal =
      kind === KIND_LE
        ? solver.mkIneqLiteral("GT", [polynomial], [false]) ^ 1
        : kind === KIND_GE
          ? solver.mkIneqLiteral("LT", [polynomial], [false]) ^ 1
          : solver.mkIneqLiteral(
              kind === KIND_LT ? "LT" : kind === KIND_GT ? "GT" : "EQ",
              [polynomial],
              [false],
            );
    solver.mkExternalClause([literal], constraintIndex);
    return literal;
  }

  // check: nlsat's search on the constraints in the cone of influence, with every included column
  // replaced by its polynomial, giving up after maxConflicts conflicts or budget steps. A model
  // becomes nla's, when it satisfies every constraint and monomial, and a refutation becomes the
  // lemma that the constraints of its core are inconsistent.
  check(maxConflicts: number, budget: number) {
    const core = this.core;
    const lra = core.lra;
    this.solver = new NlsatSolver(core.limit, budget);
    this.solver.maxConflicts = maxConflicts;
    this.values = [];
    this.lp2nl.clear();
    const cone = getConeOfInfluence(core);
    const definitions = this.mkDefinitions((lpVar) => cone.vars.has(lpVar));
    const skipped = new Set<number>();
    for (const constraintIndex of cone.constraints) {
      if (isDyadicArtifact(lra, lra.constraints.constraints[constraintIndex])) {
        skipped.add(constraintIndex);
        continue;
      }
      this.addConstraint(constraintIndex, definitions.definitions, definitions.denominators);
    }
    const result = (() => {
      try {
        return this.solver.check();
      } catch (error) {
        if (error instanceof NlsatUnsupportedError) return L_UNDEF;
        throw error;
      }
    })();
    if (result === L_TRUE) {
      this.solver.restoreOrder();
      core.setUseNraModel(true);
      lra.initModel();
      // A violated constraint or monomial that nlsat saw would be a bug.
      for (const [constraintIndex, constraint] of lra.constraints.constraints.entries()) {
        if (!constraint.isActive || this.isConstraintSatisfied(constraint)) continue;
        if (cone.constraints.has(constraintIndex) && !skipped.has(constraintIndex))
          throw new SmtInvariantError(`nlsat's model violates constraint ${constraintIndex}`);
        return L_UNDEF;
      }
      for (const monic of core.emons.monics) {
        if (this.isMonicSatisfied(monic.variable, monic.vars)) continue;
        if (cone.monics.has(monic.variable))
          throw new SmtInvariantError(`nlsat's model violates monomial ${monic.variable}`);
        return L_UNDEF;
      }
    }
    if (result === L_FALSE) {
      const explanation = new Explanation();
      for (const constraintIndex of this.solver.getCore()) explanation.push(constraintIndex);
      new LemmaBuilder(core).addExplanation(explanation);
      core.setUseNraModel(true);
    }
    return result;
  }

  // value: the model's value of a column. A monomial or term gets the value of its definition, a
  // column outside the cone of influence its value in lar_solver.
  value(lpVar: number) {
    const core = this.core;
    const lra = core.lra;
    const am = this.solver.am;
    for (let column = this.values.length; column <= lpVar; column++) {
      if (core.emons.isMonicVar(column)) {
        this.values.push(
          core.emons
            .get(column)
            .vars.reduce(
              (product, factor) => am.mul(product, this.values[factor]),
              new Anum(Rational.one),
            ),
        );
        continue;
      }
      if (lra.hasTerm(column)) {
        this.values.push(
          [...lra.getTerm(column).coeffs].reduce(
            (sum, entry) => am.add(sum, am.mul(new Anum(entry[1]), this.values[entry[0]])),
            new Anum(Rational.zero),
          ),
        );
        continue;
      }
      const variable = this.lp2nl.get(column);
      this.values.push(
        variable === undefined ? new Anum(core.val(column)) : this.solver.getValue(variable),
      );
    }
    return this.values[lpVar];
  }

  // check_monic
  private isMonicSatisfied(lpVar: number, vars: readonly number[]) {
    const am = this.solver.am;
    const product = vars.reduce(
      (result, factor) => am.mul(result, this.value(factor)),
      new Anum(Rational.one),
    );
    return am.compare(this.value(lpVar), product) === 0;
  }

  // check_constraint: the value of the left side against the right side, without δ.
  private isConstraintSatisfied(constraint: LarConstraint) {
    const am = this.solver.am;
    const sum = getConstraintCoeffs(this.core.lra, constraint).reduce(
      (result, entry) => am.add(result, am.mul(new Anum(entry[1]), this.value(entry[0]))),
      new Anum(constraint.rhs.x.neg()),
    );
    const sign = am.compare(sum, new Anum(Rational.zero));
    const kind = constraint.kind;
    return kind === KIND_LE
      ? sign <= 0
      : kind === KIND_GE
        ? sign >= 0
        : kind === KIND_LT
          ? sign < 0
          : kind === KIND_GT
            ? sign > 0
            : sign === 0;
  }

  // setup_assignment_solver and nlsat's check(rvalues, clause): the lemma clause, with the
  // constraint each literal came from, or null when nlsat finds no violated constraint.
  private getClause() {
    const core = this.core;
    const lra = core.lra;
    this.solver = new NlsatSolver(core.limit);
    this.lp2nl.clear();
    const cone = getConeOfInfluence(core);
    const definitions = this.mkDefinitions(() => true);
    const values = lra.columns.map((_column, lpVar) => new Anum(core.val(lpVar)));
    this.values = values;
    const literalConstraints = new Map<number, number>();
    for (const constraintIndex of cone.constraints) {
      const literal = this.addConstraint(
        constraintIndex,
        definitions.definitions,
        definitions.denominators,
      );
      literalConstraints.set(literal, constraintIndex);
    }
    const result = this.solver.checkAssignment(values);
    if (result.result !== L_FALSE) return null;
    return { clause: result.clause, literalConstraints };
  }

  // check_assignment
  checkAssignment() {
    const clause = (() => {
      try {
        return this.getClause();
      } catch (error) {
        if (error instanceof NlsatUnsupportedError) return null;
        throw error;
      }
    })();
    if (clause === null) return L_UNDEF;
    return this.addLemma(clause.clause, clause.literalConstraints);
  }

  // add_lemma: a literal whose negation is a constraint's literal becomes that constraint in the
  // explanation, and any other literal an inequality over the columns. Unknown, without the lemma,
  // when such an inequality already holds.
  private addLemma(clause: number[], literalConstraints: ReadonlyMap<number, number>) {
    const core = this.core;
    const solver = this.solver;
    const pm = solver.pm;
    const lemma = new LemmaBuilder(core);
    for (const literal of clause) {
      const constraintIndex = literalConstraints.get(literal ^ 1);
      if (constraintIndex !== undefined) {
        const explanation = new Explanation();
        explanation.push(constraintIndex);
        lemma.addExplanation(explanation);
        continue;
      }
      const atom = solver.getAtom(literal);
      if (atom === null) throw new SmtInvariantError(`nlsat literal ${literal} has no atom`);
      // A root atom or a product of factors is unknown, and so is a nonlinear polynomial.
      if (
        !isIneqAtom(atom) ||
        atom.polynomials.length !== 1 ||
        pm.totalDegree(atom.polynomials[0]) > 1
      ) {
        core.lemmas.pop();
        return L_UNDEF;
      }
      // process_polynomial_check_assignment, for a linear polynomial.
      const polynomial = atom.polynomials[0];
      const term = new LarTerm();
      let bound = Rational.zero;
      for (let index = 0; index < polynomial.size; index++) {
        const monomial = polynomial.ms[index];
        const coeff = Rational.of(polynomial.as[index]);
        if (monomial.size === 0) bound = bound.sub(coeff);
        else term.addMonomial(coeff, monomial.vars[0]);
      }
      const isNegated = (literal & 1) === 1;
      const kind =
        atom.kind === "EQ"
          ? isNegated
            ? KIND_NE
            : KIND_EQ
          : atom.kind === "LT"
            ? isNegated
              ? KIND_GE
              : KIND_LT
            : isNegated
              ? KIND_LE
              : KIND_GT;
      const ineq = mkIneq(term, kind, bound);
      if (core.ineqHolds(ineq)) {
        core.lemmas.pop();
        return L_UNDEF;
      }
      lemma.addIneq(ineq);
    }
    core.isCheckFeasible = true;
    return L_FALSE;
  }
}
