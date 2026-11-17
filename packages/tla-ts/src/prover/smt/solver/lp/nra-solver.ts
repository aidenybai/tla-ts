import { NlsatUnsupportedError, SmtCanceledError, SmtInvariantError } from "../../../../errors";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { Rational, getLcm } from "../rational";
import { Anum } from "../nlsat/algebraic";
import { NlsatSolver } from "../nlsat/solver";
import { type Polynomial, PolynomialRef, PolynomialRefVector } from "../nlsat/polynomial";
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
import { type LarSolver, NULL_LPVAR } from "./lar-solver";
import { LarTerm } from "./lar-term";
import type { NlaCore } from "./nla-core";
import { LemmaBuilder, mkIneq } from "./nla-types";

interface Occurrences {
  constraints: number[];
  monics: number[];
  terms: number[];
}

const getConstraintCoeffs = (lra: LarSolver, constraint: LarConstraint): [number, Rational][] =>
  lra.hasTerm(constraint.column)
    ? [...lra.getTerm(constraint.column).coeffs]
    : [[constraint.column, Rational.one]];

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
  // The applications of transcendental functions are neither monomials nor terms.
  const todo = [
    ...core.transcendentals.apps.flatMap((app) => [app.arg, app.val]),
    ...core.transcendentals.atan2Apps.flatMap((app) => [app.y, app.x, app.val]),
    ...core.toRefine.elems,
  ];
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

const hasLargeDyadicDenominator = (value: Rational) => {
  const den = value.den;
  return den >= 1n << 24n && (den & (den - 1n)) === 0n;
};

const getSortedVars = (vars: readonly number[]) =>
  [...vars].sort((first, second) => first - second);

const isDyadicArtifact = (lra: LarSolver, constraint: LarConstraint) =>
  constraint.isAuxiliary &&
  (hasLargeDyadicDenominator(constraint.rhs.x) ||
    getConstraintCoeffs(lra, constraint).some((entry) => hasLargeDyadicDenominator(entry[1])));

export class NraSolver {
  private solver = new NlsatSolver();
  private values: Anum[] = [];
  private lp2nl = new Map<number, number>();
  private literal2constraint = new Map<number, number>();
  private vars2mon = new Map<string, number>();

  constructor(private core: NlaCore) {}

  get am() {
    return this.solver.am;
  }

  private reset() {
    this.solver = new NlsatSolver(this.core.nraLimit);
    this.values = [];
    this.lp2nl.clear();
  }

  private mkDefinitions(isIncluded: (lpVar: number) => boolean) {
    const core = this.core;
    const lra = core.lra;
    const solver = this.solver;
    const pm = solver.pm;
    const definitions = new PolynomialRefVector(pm);
    const denominators: bigint[] = [];
    const p = new PolynomialRef(pm);
    const constant = new PolynomialRef(pm);
    const product = new PolynomialRef(pm);
    for (let lpVar = 0; lpVar < lra.columns.length; lpVar++) {
      if (!isIncluded(lpVar)) {
        definitions.push(pm.zero);
        denominators.push(0n);
        continue;
      }
      const variable = solver.mkVar(lra.isInt(lpVar));
      this.lp2nl.set(lpVar, variable);
      let denominator = 1n;
      if (core.emons.isMonicVar(lpVar)) {
        for (const [index, factor] of core.emons.get(lpVar).vars.entries()) {
          denominator = denominators[factor] * denominator;
          p.set(index === 0 ? definitions.get(factor) : pm.mul(p.get(), definitions.get(factor)));
        }
      } else if (lra.hasTerm(lpVar)) {
        const term = [...lra.getTerm(lpVar).coeffs];
        for (const entry of term)
          denominator = getLcm(entry[1].div(Rational.of(denominators[entry[0]])).den, denominator);
        for (const [index, entry] of term.entries()) {
          const coeff = entry[1].mul(Rational.of(denominator, denominators[entry[0]]));
          constant.set(pm.mkConst(coeff.num));
          product.set(pm.mul(constant.get(), definitions.get(entry[0])));
          p.set(index === 0 ? product.get() : pm.add(p.get(), product.get()));
          product.reset();
          constant.reset();
        }
      } else p.set(pm.mkVar(variable));
      definitions.push(p.getOrNull() ?? pm.zero);
      denominators.push(denominator);
      p.reset();
    }
    return { definitions, denominators };
  }

  private addConstraint(
    constraintIndex: number,
    definitions: PolynomialRefVector,
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
    const p = new PolynomialRef(pm);
    const poly = new PolynomialRef(pm);
    const constant = new PolynomialRef(pm);
    p.set(pm.mkConst(-(rhs.num * denominator) / rhs.den));
    for (const entry of coeffs) {
      const coeff = entry[1].mul(Rational.of(denominator, denominators[entry[0]]));
      poly.set(definitions.get(entry[0]));
      constant.set(pm.mkConst(coeff.num));
      poly.set(pm.mul(poly.get(), constant.get()));
      constant.reset();
      p.set(pm.add(p.get(), poly.get()));
      poly.reset();
    }
    const kind = constraint.kind;
    const literal =
      kind === KIND_LE
        ? solver.mkIneqLiteral("GT", [p.get()], [false]) ^ 1
        : kind === KIND_GE
          ? solver.mkIneqLiteral("LT", [p.get()], [false]) ^ 1
          : solver.mkIneqLiteral(
              kind === KIND_LT ? "LT" : kind === KIND_GT ? "GT" : "EQ",
              [p.get()],
              [false],
            );
    solver.mkExternalClause([literal], constraintIndex);
    p.reset();
    return literal;
  }

  private getNlVar(lpVar: number) {
    const variable = this.lp2nl.get(lpVar) ?? this.solver.mkVar(this.core.lra.isInt(lpVar));
    this.lp2nl.set(lpVar, variable);
    return variable;
  }

  private registerTranscendentals() {
    const transcendentals = this.core.transcendentals;
    const solver = this.solver.transcendentals;
    for (const app of transcendentals.apps)
      solver.add(app.op, this.getNlVar(app.arg), this.getNlVar(app.val));
    for (const app of transcendentals.atan2Apps)
      solver.addAtan2(this.getNlVar(app.y), this.getNlVar(app.x), this.getNlVar(app.val));
    if (transcendentals.piVar !== NULL_LPVAR) solver.addPi(this.getNlVar(transcendentals.piVar));
  }

  check(maxConflicts: number) {
    try {
      return this.checkCore(maxConflicts);
    } catch (error) {
      if (error instanceof SmtCanceledError && this.core.nraLimit.isExhausted()) return L_UNDEF;
      throw error;
    }
  }

  private checkCore(maxConflicts: number) {
    const core = this.core;
    const lra = core.lra;
    this.reset();
    this.solver.maxConflicts = maxConflicts;
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
    definitions.definitions.reset();
    this.registerTranscendentals();
    const result = this.solver.check();
    if (result === L_TRUE) {
      this.solver.restoreOrder();
      core.setUseNraModel(true);
      lra.initModel();
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

  private isMonicSatisfied(lpVar: number, vars: readonly number[]) {
    const am = this.solver.am;
    const product = vars.reduce(
      (result, factor) => am.mul(result, this.value(factor)),
      new Anum(Rational.one),
    );
    return am.compare(this.value(lpVar), product) === 0;
  }

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

  private setupAssignmentSolver() {
    const core = this.core;
    const lra = core.lra;
    this.reset();
    this.literal2constraint.clear();
    this.vars2mon.clear();
    const cone = getConeOfInfluence(core);
    const definitions = this.mkDefinitions(() => true);
    for (let lpVar = 0; lpVar < lra.columns.length; lpVar++) {
      this.values.push(new Anum(core.val(lpVar)));
      if (core.emons.isMonicVar(lpVar))
        this.vars2mon.set(getSortedVars(core.emons.get(lpVar).vars).join(","), lpVar);
    }
    for (const constraintIndex of cone.constraints) {
      const literal = this.addConstraint(
        constraintIndex,
        definitions.definitions,
        definitions.denominators,
      );
      this.literal2constraint.set(literal, constraintIndex);
    }
    definitions.definitions.reset();
    this.registerTranscendentals();
  }

  private processPolynomialCheckAssignment(
    polynomial: Polynomial,
    nl2lp: readonly number[],
    term: LarTerm,
  ) {
    let bound = Rational.zero;
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      const coeff = Rational.of(polynomial.as[index]);
      // A linear cell leaves every new lemma polynomial linear, so like Z3 this ignores degrees.
      if (monomial.size === 0) bound = bound.sub(coeff);
      else if (monomial.size === 1) term.addMonomial(coeff, nl2lp[monomial.vars[0]]);
      else {
        const vars = getSortedVars(monomial.vars.map((variable) => nl2lp[variable]));
        term.addMonomial(coeff, this.vars2mon.get(vars.join(",")) ?? this.core.addMulDef(vars));
      }
    }
    return bound;
  }

  private reverseLp2nl() {
    const nl2lp: number[] = [];
    for (const entry of this.lp2nl) nl2lp[entry[1]] = entry[0];
    return nl2lp;
  }

  checkAssignment() {
    try {
      return this.checkAssignmentCore();
    } catch (error) {
      // Deviation from Z3: a linear cell around an irrational section answers unknown, where Z3 exits.
      if (error instanceof NlsatUnsupportedError) return L_UNDEF;
      if (error instanceof SmtCanceledError && this.core.nraLimit.isExhausted()) return L_UNDEF;
      throw error;
    }
  }

  private checkAssignmentCore() {
    const core = this.core;
    const lra = core.lra;
    this.setupAssignmentSolver();
    const result = this.solver.checkAssignment(this.values);
    if (result.result === L_TRUE) {
      core.setUseNraModel(true);
      lra.initModel();
      for (const constraint of lra.constraints.constraints)
        if (constraint.isActive && !this.isConstraintSatisfied(constraint)) return L_UNDEF;
      for (const monic of core.emons.monics)
        if (!this.isMonicSatisfied(monic.variable, monic.vars)) return L_UNDEF;
      core.setUseNraModel(true);
    }
    if (result.result === L_FALSE) return this.addLemma(result.clause);
    return result.result;
  }

  private addLemma(clause: readonly number[]) {
    const core = this.core;
    const solver = this.solver;
    const nl2lp = this.reverseLp2nl();
    let result = L_FALSE;
    const lemma = new LemmaBuilder(core);
    for (const literal of clause) {
      const constraintIndex = this.literal2constraint.get(literal ^ 1);
      if (constraintIndex !== undefined) {
        const explanation = new Explanation();
        explanation.push(constraintIndex);
        lemma.addExplanation(explanation);
        continue;
      }
      const atom = solver.getAtom(literal);
      if (atom === null) throw new SmtInvariantError(`nlsat literal ${literal} has no atom`);
      if (!isIneqAtom(atom) || atom.polynomials.length !== 1) {
        result = L_UNDEF;
        break;
      }
      const term = new LarTerm();
      const bound = this.processPolynomialCheckAssignment(atom.polynomials[0], nl2lp, term);
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
        result = L_UNDEF;
        break;
      }
      lemma.addIneq(ineq);
    }
    if (result === L_FALSE) core.isCheckFeasible = true;
    if (result === L_UNDEF) core.lemmas.pop();
    return result;
  }
}
