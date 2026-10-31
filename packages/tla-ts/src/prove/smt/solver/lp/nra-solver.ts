// Ported from Z3 (src/math/lp/nra_solver.cpp, src/math/lp/nla_coi.cpp), MIT license, see
// z3-license.txt. check_assignment: the constraints in the cone of influence of the monomials to
// refine, with every monomial and term column replaced by its polynomial, go to nlsat with the
// current values. When the values violate one, nlsat's linear cell around them becomes a lemma.
// Deviations from Z3:
// - nlsat input out of scope (NlsatOutOfScope) answers unknown, as Z3 does for its own unsupported
//   cases. That is a polynomial of degree 2 or more in the variable nlsat projects.
// - nlsat's check never answers satisfied, because its solver starts with the clause [true],
//   whose literal is unassigned outside search. So the satisfied branch of check_assignment,
//   which switches nla to nlsat's model, is left out.
// - A lemma literal is always linear, because the cell bounds are, so add_mul_def, which defines a
//   fresh monomial column, is left out. A nonlinear literal would answer unknown.
import { L_FALSE, L_UNDEF } from "../lbool";
import { Rational, getLcm } from "../rational";
import { NlsatSolver } from "../nlsat/solver";
import { NlsatOutOfScope, type Polynomial } from "../nlsat/polynomial";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LE, KIND_LT, type LarConstraint } from "./constraints";
import { Explanation } from "./explanation";
import type { LarSolver } from "./lar-solver";
import { LarTerm } from "./lar-term";
import { KIND_NE, LemmaBuilder, mkIneq, type NlaCore } from "./nla-core";

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
  const visited = new Set<number>();
  const constraints = new Set<number>();
  for (let index = 0; index < todo.length; index++) {
    const lpVar = todo[index];
    if (visited.has(lpVar)) continue;
    visited.add(lpVar);
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
    if (core.emons.isMonicVar(lpVar)) todo.push(...core.emons.get(lpVar).vars);
  }
  return constraints;
};

export class NraSolver {
  constructor(private core: NlaCore) {}

  // setup_assignment_solver and nlsat's check: the lemma clause, with the constraint each literal
  // came from, or null when nlsat finds no violated constraint.
  private getClause() {
    const core = this.core;
    const lra = core.lra;
    const solver = new NlsatSolver();
    const pm = solver.pm;
    const constraints = getConeOfInfluence(core);
    // mk_definition: every column as a polynomial in the columns that are neither monomials nor
    // terms, scaled by an integer denominator to keep the coefficients integral.
    const definitions: Polynomial[] = [];
    const denominators: bigint[] = [];
    const values: Rational[] = [];
    for (let lpVar = 0; lpVar < lra.columns.length; lpVar++) {
      values.push(core.val(lpVar));
      if (core.emons.isMonicVar(lpVar)) {
        let definition: Polynomial | null = null;
        let denominator = 1n;
        for (const factor of core.emons.get(lpVar).vars) {
          denominator = denominators[factor] * denominator;
          definition =
            definition === null ? definitions[factor] : pm.mul(definition, definitions[factor]);
        }
        definitions.push(definition ?? pm.mkVar(lpVar));
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
          const scaled = pm.mul(pm.mkConst(coeff.num), definitions[entry[0]]);
          definition = definition === null ? scaled : pm.add(definition, scaled);
        }
        definitions.push(definition ?? pm.zero);
        denominators.push(denominator);
        continue;
      }
      definitions.push(pm.mkVar(lpVar));
      denominators.push(1n);
    }
    // Each constraint sum(coeff * v) kind rhs becomes den * (sum(coeff / den[v] * def[v]) - rhs)
    // kind 0, where den clears every denominator.
    const literalConstraints = new Map<number, number>();
    for (const constraintIndex of constraints) {
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
        polynomial = pm.add(polynomial, pm.mul(definitions[entry[0]], pm.mkConst(coeff.num)));
      }
      const kind = constraint.kind;
      const literal =
        kind === KIND_LE
          ? solver.mkIneqLiteral("GT", polynomial) ^ 1
          : kind === KIND_GE
            ? solver.mkIneqLiteral("LT", polynomial) ^ 1
            : solver.mkIneqLiteral(
                kind === KIND_LT ? "LT" : kind === KIND_GT ? "GT" : "EQ",
                polynomial,
              );
      solver.addUnitClause(literal);
      literalConstraints.set(literal, constraintIndex);
    }
    const result = solver.check(values);
    if (result.status === "undef") return null;
    return { solver, clause: result.clause, literalConstraints };
  }

  // check_assignment
  checkAssignment() {
    const clause = (() => {
      try {
        return this.getClause();
      } catch (error) {
        if (error instanceof NlsatOutOfScope) return null;
        throw error;
      }
    })();
    if (clause === null) return L_UNDEF;
    return this.addLemma(clause.solver, clause.clause, clause.literalConstraints);
  }

  // add_lemma: a literal whose negation is a constraint's literal becomes that constraint in the
  // explanation, and any other literal an inequality over the columns. Unknown, without the lemma,
  // when such an inequality already holds.
  private addLemma(
    solver: NlsatSolver,
    clause: number[],
    literalConstraints: ReadonlyMap<number, number>,
  ) {
    const core = this.core;
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
      if (atom === null) throw new Error(`nlsat literal ${literal} has no atom`);
      if (pm.totalDegree(atom.polynomial) > 1) {
        core.lemmas.pop();
        return L_UNDEF;
      }
      // process_polynomial_check_assignment, for a linear polynomial.
      const term = new LarTerm();
      let bound = Rational.zero;
      for (let index = 0; index < atom.polynomial.size; index++) {
        const monomial = atom.polynomial.ms[index];
        const coeff = Rational.of(atom.polynomial.as[index]);
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
