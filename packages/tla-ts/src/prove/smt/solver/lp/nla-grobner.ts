// Ported from Z3 (src/math/lp/nla_grobner.h, src/math/lp/nla_grobner.cpp), MIT license, see
// z3-license.txt. nla's Grobner pass: the rows around the monomials to refine become polynomial
// equations, which dd::solver saturates, and the equations then yield lemmas: interval conflicts,
// quotient and residue bounds, failed gcd tests, fixed variables, factorizations, and new linear
// rows. Z3's nlsat conflict check (is_nla_conflict) is not ported, nor are the statistics.
import { getEuclideanMod, getGcd, getLcm, Rational } from "../rational";
import { KIND_EQ, KIND_GE, KIND_LE, KIND_LT } from "./constraints";
import { COLUMN_BOXED, COLUMN_FIXED, COLUMN_LOWER, COLUMN_UPPER } from "./core-solver";
import {
  add,
  checkIntervalForConflictOnZero,
  type DepsMode,
  mkDepInterval,
  mul,
  power,
  separatedFromZero,
  set,
  setValue,
} from "./dep-intervals";
import { type Dependency, mkJoin } from "./dependency";
import { Explanation } from "./explanation";
import { IndexedUintSet } from "./containers";
import { NULL_LPVAR } from "./lar-solver";
import { LarTerm } from "./lar-term";
import { CrossNested } from "./cross-nested";
import { type Nex, getDegree } from "./nex";
import { NexCreator } from "./nex-creator";
import { Impq } from "./numeric-pair";
import type { RowCell } from "./static-matrix";
import { type Ineq, KIND_NE, LemmaBuilder, mkIneq, NLA_PARAMS, type NlaCore } from "./nla-core";
import { evaluatePdd, type Pdd, PddManager, PddMemoryOut } from "./pdd";
import { getPddInterval } from "./pdd-interval";
import { type Equation, getDefaultPddSolverConfig, PddSolver } from "./pdd-solver";

const UINT_MAX = 0xffffffff;
const ADAPTIVE_UNIT = 16;
const ADAPTIVE_MAX = 4 * 16;
const ADAPTIVE_BUMP_AFTER = 2;
const DELAY_CAP = 1000000;

// A dependency that pdd_expr and val_of_fixed_var_with_deps extend, where Z3 passes a reference.
interface DepRef {
  dep: Dependency;
}

interface LinearTerm {
  term: LarTerm;
  offset: Rational;
}

interface SortedMonomial {
  coeff: Rational;
  vars: number[];
}

const getRationalGcd = (first: Rational, second: Rational) =>
  Rational.of(getGcd(first.num, second.num));

const getRationalLcm = (first: Rational, second: Rational) =>
  Rational.of(getLcm(first.num, second.num));

const getDenominator = (value: Rational) => Rational.of(value.den);

// divides: whether the integer a divides the integer b, where 0 divides only 0.
const divides = (divisor: Rational, value: Rational) =>
  divisor.isZero() ? value.isZero() : value.num % divisor.num === 0n;

// ps_root: the root a of a^2 * M^2, a perfect square with every variable of even multiplicity.
const getPerfectSquareRoot = (coeff: Rational, vars: number[]) => {
  if (vars.length % 2 === 1) return undefined;
  const root = coeff.root(2);
  if (root === undefined) return undefined;
  for (let index = 0; index < vars.length;) {
    const start = index;
    while (index < vars.length && vars[index] === vars[start]) index++;
    if ((index - start) % 2 === 1) return undefined;
  }
  return root;
};

// ps_cross: whether (c12, v12) is the cross term -2ab*M1*M2 of the perfect squares a^2*M1^2 and
// b^2*M2^2.
const isPerfectSquareCross = (
  first: Rational,
  firstVars: number[],
  second: Rational,
  secondVars: number[],
  crossCoeff: Rational,
  crossVars: number[],
) => {
  if (!crossCoeff.isNegative()) return false;
  if (!crossCoeff.equals(Rational.fromNumber(-2).mul(first).mul(second))) return false;
  if (firstVars.length + secondVars.length !== crossVars.length * 2) return false;
  let firstIndex = 0;
  let secondIndex = 0;
  for (const crossVar of crossVars) {
    if (firstIndex < firstVars.length && firstVars[firstIndex] === crossVar) firstIndex += 2;
    else if (secondIndex < secondVars.length && secondVars[secondIndex] === crossVar)
      secondIndex += 2;
    else return false;
  }
  return firstIndex >= firstVars.length && secondIndex >= secondVars.length;
};

export class Grobner {
  private readonly propagatesQuotients = NLA_PARAMS.grobnerPropagateQuotients;
  private readonly hasGcdTest = NLA_PARAMS.grobnerGcdTest;
  private readonly expandsTerms = NLA_PARAMS.grobnerExpandTerms;
  private readonly manager: PddManager;
  private readonly solver: PddSolver;
  private readonly nexCreator = new NexCreator();
  private readonly rows = new IndexedUintSet();
  private quota: number = NLA_PARAMS.grQ;
  private delayBase = 0;
  private delay = 0;
  private growthBoost = ADAPTIVE_UNIT;
  private hitStreak = 0;
  private readonly isAddingAllEqs = false;
  private mon2var = new Map<string, number>();

  constructor(private core: NlaCore) {
    this.manager = new PddManager(core.lra.getColumnCount());
    this.solver = new PddSolver(this.manager, () => core.isCanceled());
  }

  // operator(): runs the pass, unless the quota of misses delays it.
  run() {
    if (this.core.lra.getColumnCount() > 5000) return;
    if (this.quota === 0) this.quota = NLA_PARAMS.grQ;
    if (this.quota === 1) {
      if (NLA_PARAMS.grobnerExpDelay) {
        if (this.delayBase === 0) this.delayBase = 1;
        else if (this.delayBase < DELAY_CAP)
          this.delayBase = Math.min(this.delayBase * 2, DELAY_CAP);
        this.delay = this.delayBase;
      } else {
        this.delay = ++this.delayBase;
      }
      this.quota = NLA_PARAMS.grQ;
    }
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    this.findNlCluster();
    if (!this.configure()) return;
    let isProductive = this.catchMemoryOut(() => this.propagateGcdTest());
    if (!isProductive) {
      this.solver.saturate();
      if (this.delayBase > 0) this.delayBase--;
      isProductive = this.catchMemoryOut(
        () =>
          this.isConflicting() ||
          this.propagateQuotients() ||
          this.propagateGcdTest() ||
          this.propagateEqs() ||
          this.propagateFactorization() ||
          this.propagateLinearEquations(),
      );
    }
    if (NLA_PARAMS.grobnerAdaptive) this.updateGrowthBoost(isProductive);
    if (isProductive) return;
    this.delayBase++;
    if (this.quota > 0) this.quota--;
  }

  // Z3 catches every exception here, of which a failed pdd allocation is the one that can occur.
  private catchMemoryOut(propagate: () => boolean) {
    try {
      return propagate();
    } catch (error) {
      if (!(error instanceof PddMemoryOut)) throw error;
      return false;
    }
  }

  // update_growth_boost: two productive runs in a row raise the boost by half, up to the cap, and a
  // miss takes back a quarter of the excess over the unit.
  private updateGrowthBoost(isProductive: boolean) {
    if (isProductive) {
      if (++this.hitStreak < ADAPTIVE_BUMP_AFTER) return;
      this.growthBoost = Math.min(this.growthBoost + (this.growthBoost >> 1), ADAPTIVE_MAX);
      this.hitStreak = 0;
      return;
    }
    this.hitStreak = 0;
    if (this.growthBoost <= ADAPTIVE_UNIT) return;
    const excess = this.growthBoost - ADAPTIVE_UNIT;
    this.growthBoost = Math.max(this.growthBoost - Math.floor((excess + 3) / 4), ADAPTIVE_UNIT);
  }

  private countPropagations(propagate: (equation: Equation) => boolean) {
    let changed = 0;
    for (const equation of this.solver.equations()) {
      if (propagate(equation) && ++changed >= this.solver.config.numberOfConflictsToReport)
        return true;
    }
    return changed > 0;
  }

  private isConflicting() {
    return this.solver.equations().some((equation) => this.isEquationConflicting(equation));
  }

  private propagateEqs() {
    return this.countPropagations((equation) => this.propagateFixed(equation));
  }

  private propagateFactorization() {
    return this.countPropagations((equation) => this.propagateFactorizationOf(equation));
  }

  private propagateGcdTest() {
    if (!this.hasGcdTest) return false;
    return this.countPropagations((equation) => this.propagateGcdTestOf(equation));
  }

  private propagateQuotients() {
    if (!this.propagatesQuotients) return false;
    return this.countPropagations((equation) => this.propagateQuotientsOf(equation));
  }

  // propagate_fixed: k*x = 0 gives x = 0, and x + b = 0 gives x = -b.
  private propagateFixed(equation: Equation) {
    const poly = equation.poly;
    if (poly.isUnary()) {
      const variable = poly.var();
      if (this.core.varIsFixed(variable)) return false;
      return this.addLemmaUnlessHolds(equation, mkIneq(variable, KIND_EQ, 0));
    }
    if (!poly.isOffset()) return false;
    const variable = poly.var();
    if (this.core.varIsFixed(variable)) return false;
    const coeff = poly.hi().val();
    const offset = poly.lo().val().neg();
    const lcm = getRationalLcm(getDenominator(coeff), getDenominator(offset));
    const ineq = mkIneq(new LarTerm([[variable, coeff.mul(lcm)]]), KIND_EQ, offset.mul(lcm));
    return this.addLemmaUnlessHolds(equation, ineq);
  }

  private addLemmaUnlessHolds(equation: Equation, ineq: Ineq) {
    if (this.core.ineqHolds(ineq)) return false;
    this.addDependencies(new LemmaBuilder(this.core), equation).addIneq(ineq);
    return true;
  }

  // propagate_factorization: x*q = 0 gives x = 0 or q = 0, for a linear q.
  private propagateFactorizationOf(equation: Equation) {
    const factors = equation.poly.varFactors();
    if (factors.vars.length === 0 || !factors.poly.isLinear()) return false;
    const linear = this.linearToTerm(factors.poly);
    const ineqs = factors.vars.map((variable) => mkIneq(variable, KIND_EQ, 0));
    ineqs.push(mkIneq(linear.term, KIND_EQ, linear.offset.neg()));
    if (ineqs.some((ineq) => this.core.ineqHolds(ineq))) return false;
    const lemma = this.addDependencies(new LemmaBuilder(this.core), equation);
    for (const ineq of ineqs) lemma.addIneq(ineq);
    return true;
  }

  // linear_to_term: the linear polynomial times the lcm of its denominators, as a term and an
  // offset.
  private linearToTerm(poly: Pdd): LinearTerm {
    let lcm = Rational.one;
    let current = poly;
    while (!current.isVal()) {
      lcm = getRationalLcm(lcm, getDenominator(current.hi().val()));
      current = current.lo();
    }
    lcm = getRationalLcm(getDenominator(current.val()), lcm);
    const term = new LarTerm();
    current = poly;
    while (!current.isVal()) {
      term.addMonomial(lcm.mul(current.hi().val()), current.var());
      current = current.lo();
    }
    return { term, offset: lcm.mul(current.val()) };
  }

  private getValue(poly: Pdd) {
    return evaluatePdd(poly, (variable) => this.core.val(variable));
  }

  private isIntPoly(poly: Pdd) {
    return (
      this.core.varIsInt(poly.var()) &&
      poly.freeVars().every((variable) => this.core.varIsInt(variable))
    );
  }

  // propagate_gcd_test: x^k - y = 0 limits y modulo k^2. For each residue r of x modulo k, the
  // gcd of the coefficients of p with k*x + r for x must divide its constant term.
  private propagateGcdTestOf(equation: Equation) {
    let poly = equation.poly;
    if (poly.isLinear() || poly.isVal() || !this.isIntPoly(poly)) return false;
    if (this.getValue(poly).isZero()) return false;
    const powers = poly.getPowers();
    if (powers.length === 0) return false;
    let lcm = Rational.one;
    for (const value of poly.coefficients()) lcm = getRationalLcm(lcm, getDenominator(value.coeff));
    if (!lcm.equals(Rational.one)) poly = poly.mul(lcm);
    const manager = this.manager;
    const failsGcdTest = (substituted: Pdd) => {
      let gcd = Rational.zero;
      let constant = Rational.zero;
      for (const value of substituted.coefficients()) {
        if (value.isConstant) {
          constant = constant.add(value.coeff);
          continue;
        }
        gcd = getRationalGcd(gcd, value.coeff);
        if (gcd.equals(Rational.one)) return false;
      }
      return !constant.isZero() && !divides(gcd, constant);
    };
    for (const entry of powers) {
      if (entry.degree > 4) continue;
      const scaled = manager.mkVar(entry.var).mul(manager.mkVal(Rational.fromNumber(entry.degree)));
      let isGcdFailing = true;
      for (let residue = 0; isGcdFailing && residue < entry.degree; residue++) {
        const replacement = scaled.add(manager.mkVal(Rational.fromNumber(residue)));
        if (!failsGcdTest(poly.substPdd(entry.var, replacement))) isGcdFailing = false;
      }
      if (isGcdFailing) {
        this.addDependencies(new LemmaBuilder(this.core), equation);
        return true;
      }
    }
    return false;
  }

  // propagate_quotients: for x*y + z = 0 over the integers, the residue of a linear variable and
  // bounds that relate a factor to the rest.
  private propagateQuotientsOf(equation: Equation) {
    const poly = equation.poly;
    if (poly.isLinear() || poly.isVal() || !this.isIntPoly(poly)) return false;
    if (this.getValue(poly).isZero()) return false;
    const nlVars = new Set<number>();
    let lcm = Rational.one;
    for (const monomial of poly) {
      lcm = getRationalLcm(lcm, getDenominator(monomial.coeff));
      if (monomial.vars.length === 1) continue;
      for (const variable of monomial.vars) nlVars.add(variable);
    }
    if (this.propagateModResidue(equation)) return true;
    let isLemmaFound = false;
    for (const variable of nlVars) {
      const factor = poly.factor(variable, 1);
      if (!factor.rest.isLinear()) continue;
      const lc = lcm.equals(Rational.one) ? factor.lc : factor.lc.mul(lcm);
      const rest = lcm.equals(Rational.one) ? factor.rest : factor.rest.mul(lcm);
      if (this.addQuotientLemma(equation, variable, lc, rest)) isLemmaFound = true;
    }
    return isLemmaFound;
  }

  // mod_residue: when every monomial but c_v*v is a multiple of M*c_v and the constant term is
  // K*c_v, then v = -K modulo M, so 0 <= v < M forces v to the residue.
  private propagateModResidue(equation: Equation) {
    const poly = equation.poly;
    for (const linear of poly) {
      if (linear.vars.length !== 1) continue;
      const variable = linear.vars[0];
      if (!this.core.varIsInt(variable)) continue;
      const coeff = linear.coeff;
      let modulus = Rational.zero;
      let constant = Rational.zero;
      let isOk = true;
      for (const monomial of poly) {
        if (monomial.vars.length === 1 && monomial.vars[0] === variable) continue;
        if (monomial.vars.length === 0) {
          constant = monomial.coeff;
          continue;
        }
        const quotient = monomial.coeff.div(coeff);
        if (!quotient.isInt()) {
          isOk = false;
          break;
        }
        modulus = modulus.isZero() ? quotient.abs() : getRationalGcd(modulus, quotient.abs());
        if (modulus.equals(Rational.one)) {
          isOk = false;
          break;
        }
      }
      if (!isOk || modulus.isZero()) continue;
      const offset = constant.div(coeff);
      if (!offset.isInt()) continue;
      const target = Rational.of(getEuclideanMod(offset.neg().num, modulus.num));
      const value = this.core.val(variable);
      if (value.isNegative() || value.compare(modulus) >= 0 || value.equals(target)) continue;
      this.addDependencies(new LemmaBuilder(this.core), equation)
        .addIneq(mkIneq(variable, KIND_LT, 0))
        .addIneq(mkIneq(variable, KIND_GE, modulus))
        .addIneq(mkIneq(variable, KIND_EQ, target));
      return true;
    }
    return false;
  }

  // The lemmas of p = v*lc + r for a linear r, by the values of v, lc and r.
  private addQuotientLemma(equation: Equation, variable: number, lc: Pdd, rest: Pdd) {
    const variableValue = this.core.val(variable);
    const restValue = this.getValue(rest);
    const lcValue = this.getValue(lc);
    if (restValue.isZero()) {
      if (variableValue.isZero() || lcValue.isZero() || !lc.isLinear()) return false;
      // v = 0 or lc = 0 or r != 0
      const lcTerm = this.linearToTerm(lc);
      const restTerm = this.linearToTerm(rest);
      this.addDependencies(new LemmaBuilder(this.core), equation)
        .addIneq(mkIneq(variable, KIND_EQ, 0))
        .addIneq(mkIneq(lcTerm.term, KIND_EQ, lcTerm.offset.neg()))
        .addIneq(mkIneq(restTerm.term, KIND_NE, restTerm.offset.neg()));
      return true;
    }
    if (variableValue.isZero()) {
      // v = 0 => r = 0
      const lemma = this.addDependencies(new LemmaBuilder(this.core), equation);
      const restTerm = this.linearToTerm(rest);
      lemma
        .addIneq(mkIneq(variable, KIND_NE, 0))
        .addIneq(mkIneq(restTerm.term, KIND_EQ, restTerm.offset.neg()));
      return true;
    }
    if (lcValue.isZero()) {
      if (!lc.isLinear()) return false;
      // lc = 0 => r = 0
      const lemma = this.addDependencies(new LemmaBuilder(this.core), equation);
      const lcTerm = this.linearToTerm(lc);
      const restTerm = this.linearToTerm(rest);
      lemma
        .addIneq(mkIneq(lcTerm.term, KIND_NE, lcTerm.offset.neg()))
        .addIneq(mkIneq(restTerm.term, KIND_EQ, restTerm.offset.neg()));
      return true;
    }
    if (divides(variableValue, restValue)) return false;
    const isVariablePositive = variableValue.isPositive();
    const isRestPositive = restValue.isPositive();
    if (variableValue.abs().compare(restValue.abs()) > 0) {
      // v*c + t = 0 with |v| > |t| != 0: v changes sign, t changes sign, or |v| <= |t|
      const lemma = new LemmaBuilder(this.core);
      const restTerm = this.linearToTerm(rest);
      this.addDependencies(lemma, equation);
      const offset = restTerm.offset.neg();
      lemma.addIneq(mkIneq(variable, isVariablePositive ? KIND_LE : KIND_GE, 0));
      lemma.addIneq(mkIneq(restTerm.term, isRestPositive ? KIND_LE : KIND_GE, offset));
      const shifted = this.linearToTerm(rest).term;
      shifted.addMonomial(
        Rational.fromNumber(isVariablePositive === isRestPositive ? -1 : 1),
        variable,
      );
      lemma.addIneq(mkIneq(shifted, isRestPositive ? KIND_GE : KIND_LE, offset));
      return true;
    }
    const one = Rational.one;
    if (
      lcValue.abs().compare(one) > 0 &&
      variableValue.abs().compare(one) > 0 &&
      variableValue.abs().compare(restValue.abs()) >= 0
    ) {
      // v*c + t = 0 & |c| > 1, |v| > 1 => |v| < |t|
      const lemma = new LemmaBuilder(this.core);
      const restTerm = this.linearToTerm(rest);
      const lcTerm = this.linearToTerm(lc);
      this.addDependencies(lemma, equation);
      if (lcValue.compare(one) > 0) {
        lemma.addIneq(mkIneq(lcTerm.term, KIND_LE, one.sub(lcTerm.offset)));
      } else {
        lemma.addIneq(mkIneq(lcTerm.term, KIND_GE, Rational.minusOne.sub(lcTerm.offset)));
      }
      lemma.addIneq(
        isVariablePositive
          ? mkIneq(variable, KIND_LE, one)
          : mkIneq(variable, KIND_GE, Rational.minusOne),
      );
      restTerm.term.addMonomial(
        Rational.fromNumber(isVariablePositive === isRestPositive ? -1 : 1),
        variable,
      );
      lemma.addIneq(
        isRestPositive
          ? mkIneq(restTerm.term, KIND_GE, one.sub(restTerm.offset))
          : mkIneq(restTerm.term, KIND_LE, Rational.minusOne.sub(restTerm.offset)),
      );
      return true;
    }
    return false;
  }

  private addDependencies(lemma: LemmaBuilder, equation: Equation) {
    const explanation = new Explanation();
    explanation.pushDependency(equation.dep);
    return lemma.addExplanation(explanation);
  }

  private configure() {
    this.solver.reset();
    try {
      this.setLevel2var();
      for (const lpVar of this.core.activeVarSet.elems) {
        if (this.core.lra.isBase(lpVar)) {
          this.addRow(this.core.lra.getRow(this.core.lra.core.heading[lpVar]));
        }
        if (this.core.isMonicVar(lpVar) && this.core.varIsFixed(lpVar)) this.addFixedMonic(lpVar);
      }
    } catch (error) {
      if (!(error instanceof PddMemoryOut)) throw error;
      return false;
    }
    const config = getDefaultPddSolverConfig();
    config.maxSteps = this.solver.equations().length;
    config.maxSimplified = NLA_PARAMS.grobnerMaxSimplified;
    config.eqsGrowth = NLA_PARAMS.grobnerEqsGrowth;
    config.exprSizeGrowth = NLA_PARAMS.grobnerExprSizeGrowth;
    config.exprDegreeGrowth = NLA_PARAMS.grobnerExprDegreeGrowth;
    if (NLA_PARAMS.grobnerAdaptive && this.growthBoost !== ADAPTIVE_UNIT) {
      const scale = (value: number) =>
        Math.min(Math.floor((value * this.growthBoost) / ADAPTIVE_UNIT), UINT_MAX);
      config.eqsGrowth = scale(config.eqsGrowth);
      config.exprSizeGrowth = scale(config.exprSizeGrowth);
      config.exprDegreeGrowth = scale(config.exprDegreeGrowth);
      config.maxSimplified = scale(config.maxSimplified);
    }
    config.numberOfConflictsToReport = NLA_PARAMS.grobnerCnflToReport;
    this.solver.config = config;
    this.solver.adjustConfig();
    this.manager.setMaxNumNodes(10000);
    return true;
  }

  // equation_is_true: the equation holds at the values, or a free column can make it hold.
  private isEquationTrue(equation: Equation) {
    if (equation.poly.freeVars().some((variable) => this.core.lra.isFree(variable))) return true;
    return this.getValue(equation.poly).isZero();
  }

  private getVarInterval = (variable: number, mode: DepsMode) => {
    const interval = mkDepInterval();
    this.core.intervals.setVarInterval(variable, interval, mode);
    return interval;
  };

  // is_conflicting: the interval of the polynomial excludes 0, or a cross-nested form or a
  // perfect square shows that it does.
  private isEquationConflicting(equation: Equation) {
    if (this.isEquationTrue(equation)) return false;
    const interval = getPddInterval(equation.poly, "without-deps", this.getVarInterval);
    if (!separatedFromZero(interval)) {
      if (this.addHornerConflict(equation)) return true;
      return NLA_PARAMS.grobnerPerfectSquares && this.addPerfectSquareConflict(equation);
    }
    const intervalWithDeps = getPddInterval(equation.poly, "with-deps", this.getVarInterval);
    return checkIntervalForConflictOnZero(intervalWithDeps, equation.dep, (constraints) =>
      this.addConflict(constraints),
    );
  }

  private addConflict(constraints: number[]) {
    const explanation = new Explanation();
    for (const constraint of constraints) explanation.push(constraint);
    new LemmaBuilder(this.core).addExplanation(explanation);
  }

  // monomial_interval: coeff times the product of the variables' intervals.
  private getMonomialInterval(coeff: Rational, vars: number[], mode: DepsMode) {
    const result = mkDepInterval();
    setValue(result, coeff);
    for (let index = 0; index < vars.length;) {
      const variable = vars[index];
      const start = index;
      while (index < vars.length && vars[index] === variable) index++;
      const powered = mkDepInterval();
      power(this.getVarInterval(variable, mode), index - start, powered, mode);
      const product = mkDepInterval();
      mul(result, powered, product, mode);
      set(result, product, mode);
    }
    return result;
  }

  // add_perfect_square_conflict: a triple of monomials a^2*M1^2, b^2*M2^2 and -2ab*M1*M2 is
  // (a*M1 - b*M2)^2, at least 0, which replaces their interval when its lower bound is negative.
  private addPerfectSquareConflict(equation: Equation) {
    const monomials: SortedMonomial[] = [...equation.poly].map((monomial) => ({
      coeff: monomial.coeff,
      vars: monomial.vars.toSorted((first, second) => first - second),
    }));
    const count = monomials.length;
    if (count < 3) return false;
    const isDeleted = Array.from({ length: count }, () => false);
    let isFound = false;
    for (let first = 0; first < count; first++) {
      if (isDeleted[first]) continue;
      const firstRoot = getPerfectSquareRoot(monomials[first].coeff, monomials[first].vars);
      if (firstRoot === undefined) continue;
      for (let second = first + 1; second < count && !isDeleted[first]; second++) {
        if (isDeleted[second]) continue;
        const secondRoot = getPerfectSquareRoot(monomials[second].coeff, monomials[second].vars);
        if (secondRoot === undefined) continue;
        for (let cross = first + 1; cross < count; cross++) {
          if (cross === second || isDeleted[cross]) continue;
          if (
            !isPerfectSquareCross(
              firstRoot,
              monomials[first].vars,
              secondRoot,
              monomials[second].vars,
              monomials[cross].coeff,
              monomials[cross].vars,
            )
          )
            continue;
          const partial = mkDepInterval();
          const sum = mkDepInterval();
          add(
            this.getSortedInterval(monomials[first]),
            this.getSortedInterval(monomials[second]),
            partial,
            "without-deps",
          );
          add(partial, this.getSortedInterval(monomials[cross]), sum, "without-deps");
          if (sum.isLowerInf || sum.lower.isNegative()) {
            isDeleted[first] = true;
            isDeleted[second] = true;
            isDeleted[cross] = true;
            isFound = true;
            break;
          }
        }
      }
    }
    if (!isFound) return false;
    // [0, oo) for the perfect squares is an unconditional bound, without a dependency.
    const sum = mkDepInterval();
    sum.isLowerInf = false;
    sum.lower = Rational.zero;
    sum.isLowerOpen = false;
    for (let index = 0; index < count; index++) {
      if (isDeleted[index]) continue;
      const monomial = monomials[index];
      const next = mkDepInterval();
      add(
        sum,
        this.getMonomialInterval(monomial.coeff, monomial.vars, "with-deps"),
        next,
        "with-deps",
      );
      set(sum, next, "with-deps");
    }
    return checkIntervalForConflictOnZero(sum, equation.dep, (constraints) =>
      this.addConflict(constraints),
    );
  }

  private getSortedInterval(monomial: SortedMonomial) {
    return this.getMonomialInterval(monomial.coeff, monomial.vars, "without-deps");
  }

  // add_horner_conflict: the cross-nested forms of the polynomial, whose intervals may exclude 0.
  private addHornerConflict(equation: Equation) {
    const nexCreator = this.nexCreator;
    const freeVars = equation.poly.freeVars();
    const var2nex: Nex[] = [];
    for (const variable of freeVars) var2nex[variable] = nexCreator.mkVar(variable);
    nexCreator.setNumberOfVars(Math.max(0, ...freeVars) + 1);
    const children: Nex[] = [];
    for (const monomial of equation.poly) {
      if (monomial.vars.length === 0) {
        children.push(nexCreator.mkScalar(monomial.coeff));
        continue;
      }
      const factors = monomial.vars.map((innerVar) => var2nex[innerVar]);
      children.push(nexCreator.mkMul(monomial.coeff, ...factors));
    }
    const expr = nexCreator.simplify(nexCreator.mkSum(children));
    if (getDegree(expr) < 2 || expr.kind !== "sum") return false;
    const dep = equation.dep;
    const crossNested = new CrossNested(
      (nex) => this.core.intervals.checkNex(nex, dep),
      (variable) => this.core.varIsFixed(variable),
      { inc: () => !this.core.isCanceled() },
      this.core.random(),
      nexCreator,
    );
    crossNested.run(expr);
    return crossNested.done();
  }

  // propagate_linear_equations: an equation whose monomials all have columns and that the values
  // violate becomes a new row fixed to its constant.
  private propagateLinearEquations() {
    this.mon2var.clear();
    for (const monic of this.core.emons.monics)
      this.mon2var.set(monic.vars.join(","), monic.variable);
    let changed = 0;
    for (const equation of this.solver.equations()) {
      if (this.propagateLinearEquation(equation)) changed++;
    }
    return changed > 0;
  }

  // The monomial's column: Z3 looks up the variables in the pdd's order in the sorted variables of
  // the monics.
  private getMonomialColumn(vars: number[]) {
    return this.mon2var.get(vars.join(","));
  }

  private propagateLinearEquation(equation: Equation) {
    if (this.isEquationTrue(equation)) return false;
    let value = Rational.zero;
    const columns: number[] = [];
    for (const monomial of equation.poly) {
      if (monomial.vars.length === 0) {
        value = value.add(monomial.coeff);
        continue;
      }
      const column =
        monomial.vars.length === 1 ? monomial.vars[0] : this.getMonomialColumn(monomial.vars);
      if (column === undefined) return false;
      columns.push(column);
      value = value.add(monomial.coeff.mul(this.core.val(column)));
    }
    if (value.isZero()) return false;
    let lcm = Rational.one;
    for (const monomial of equation.poly) lcm = getRationalLcm(getDenominator(monomial.coeff), lcm);
    const coeffs: [number, Rational][] = [];
    let offset = Rational.zero;
    for (const monomial of equation.poly) {
      const coeff = lcm.mul(monomial.coeff);
      if (monomial.vars.length === 0) offset = offset.sub(coeff);
      else coeffs.push([columns[coeffs.length], coeff]);
    }
    const lra = this.core.lra;
    const column = lra.addTerm(coeffs, NULL_LPVAR);
    lra.updateColumnTypeAndBound(column, KIND_EQ, new Impq(offset), equation.dep);
    this.core.isCheckFeasible = true;
    return true;
  }

  // find_nl_cluster: the variables and rows reachable from the monomials to refine.
  private findNlCluster() {
    this.rows.clear();
    this.core.activeVarSet.clear();
    const queue = [...this.core.toRefine.elems];
    for (let lpVar = queue.pop(); lpVar !== undefined; lpVar = queue.pop()) {
      this.addVarAndItsFactorsToQueue(lpVar, queue);
    }
  }

  // add_var_and_its_factors_to_q_and_collect_new_rows.
  private addVarAndItsFactorsToQueue(lpVar: number, queue: number[]) {
    const core = this.core;
    const lra = core.lra;
    if (core.activeVarSet.has(lpVar)) return;
    core.activeVarSet.add(lpVar);
    if (core.isMonicVar(lpVar)) {
      for (const factorization of core.getFactorizations(core.emons.get(lpVar))) {
        for (const factor of factorization.factors) queue.push(factor.variable);
      }
    } else if (lra.hasTerm(lpVar)) {
      for (const entry of lra.getTerm(lpVar).coeffs) queue.push(entry[0]);
    } else if (core.varIsFixed(lpVar)) {
      return;
    }
    for (const cell of lra.core.matrix.columns[lpVar]) {
      const row = cell.row;
      if (this.rows.has(row)) continue;
      this.rows.add(row);
      const basic = lra.core.basis[row];
      // A free column over the reals can be assigned.
      if (lra.isFree(basic) && basic !== lpVar) {
        if (!lra.isInt(basic)) continue;
        // Free integer columns count only for the gcd test, the quotients, or all equations.
        if (!this.isAddingAllEqs && !this.hasGcdTest && !this.propagatesQuotients) continue;
        // A free integer column with integer coefficients can be assigned.
        if (!this.isAddingAllEqs && lra.getRow(row).every((rowCell) => rowCell.coeff.isInt()))
          continue;
      }
      if (!this.isAddingAllEqs && lra.getRow(row).length > NLA_PARAMS.hornerRowLengthLimit)
        continue;
      for (const rowCell of lra.getRow(row)) this.addVarAndItsFactorsToQueue(rowCell.column, queue);
    }
  }

  private getValOfFixedVarWithDeps(lpVar: number, ref: DepRef) {
    const witnesses = this.core.lra.getBoundWitnesses(lpVar);
    if (witnesses !== null) ref.dep = mkJoin(ref.dep, witnesses);
    return this.core.lra.getLowerBound(lpVar).x;
  }

  private getTermPdd(term: LarTerm, ref: DepRef) {
    let result = this.manager.mkVal(Rational.zero);
    for (const entry of term.coeffs) result = result.add(this.getPdd(entry[1], entry[0], ref));
    return result;
  }

  // pdd_expr: coeff times the column, with fixed columns as values, terms expanded, and monics as
  // the products of their variables.
  private getPdd(coeff: Rational, lpVar: number, ref: DepRef) {
    const core = this.core;
    let result = this.manager.mkVal(coeff);
    const vars = [lpVar];
    const zeroRef = { dep: ref.dep };
    for (let current = vars.pop(); current !== undefined; current = vars.pop()) {
      if (NLA_PARAMS.grobnerSubsFixed > 0 && core.varIsFixedToZero(current)) {
        result = this.manager.mkVal(this.getValOfFixedVarWithDeps(current, zeroRef));
        ref.dep = zeroRef.dep;
        return result;
      }
      if (NLA_PARAMS.grobnerSubsFixed === 1 && core.varIsFixed(current)) {
        result = result.mul(this.getValOfFixedVarWithDeps(current, ref));
      } else if (this.expandsTerms && core.lra.hasTerm(current)) {
        result = result.mul(this.getTermPdd(core.lra.getTerm(current), ref));
      } else if (!core.isMonicVar(current)) {
        result = result.mul(this.manager.mkVar(current));
      } else {
        vars.push(...core.emons.get(current).vars);
      }
    }
    return result;
  }

  // is_solved: p = 0 as v = r, for a linear p where v is the only variable bounded on one side
  // while several are bounded on the other, so that r has no bound on that side.
  private getSolvedForm(poly: Pdd) {
    if (!poly.isLinear()) return null;
    let numLo = 0;
    let numHi = 0;
    let lo = 0;
    let hi = 0;
    let loCoeff = Rational.zero;
    let hiCoeff = Rational.zero;
    for (let current = poly; !current.isVal(); current = current.lo()) {
      const variable = current.var();
      const value = current.hi().val();
      const type = this.core.lra.core.getColumnType(variable);
      if (type === COLUMN_LOWER || type === COLUMN_UPPER) {
        if (value.isPositive() === (type === COLUMN_LOWER)) {
          numLo++;
          lo = variable;
          loCoeff = value;
        } else {
          numHi++;
          hi = variable;
          hiCoeff = value;
        }
      } else if (type !== COLUMN_FIXED && type !== COLUMN_BOXED) {
        return null;
      }
      if (numLo > 1 && numHi > 1) return null;
    }
    const isLo = numLo === 1 && numHi > 1;
    if (!isLo && !(numHi === 1 && numLo > 1)) return null;
    const variable = isLo ? lo : hi;
    const coeff = isLo ? loCoeff : hiCoeff;
    const solution = this.manager.mkVar(variable).mul(coeff).sub(poly);
    return {
      variable,
      poly: coeff.equals(Rational.one) ? solution : solution.mul(Rational.one.div(coeff)),
    };
  }

  // add_eq: adds the equation in solved form when it has one.
  private addEq(poly: Pdd, dep: Dependency) {
    const simplified = this.solver.simplify(poly, dep);
    const solved = this.getSolvedForm(simplified.poly);
    if (solved === null) this.solver.add(simplified.poly, simplified.dep);
    else this.solver.addSubst(solved.variable, solved.poly, simplified.dep);
  }

  private addFixedMonic(lpVar: number) {
    const ref: DepRef = { dep: null };
    let product = this.manager.mkVal(Rational.one);
    for (const factor of this.core.emons.get(lpVar).vars) {
      product = product.mul(this.getPdd(Rational.one, factor, ref));
    }
    product = product.sub(this.getValOfFixedVarWithDeps(lpVar, ref));
    this.addEq(product, ref.dep);
  }

  private addRow(row: RowCell[]) {
    const ref: DepRef = { dep: null };
    let sum = this.manager.mkVal(Rational.zero);
    for (const cell of row) sum = sum.add(this.getPdd(cell.coeff, cell.column, ref));
    this.addEq(sum, ref.dep);
  }

  // set_level2var: the columns by weight, then index, from the lowest level.
  private setLevel2var() {
    const core = this.core;
    const count = core.lra.getColumnCount();
    const weights = Array.from({ length: count }, (_, lpVar) => core.getVarWeight(lpVar));
    for (let lpVar = 0; lpVar < count; lpVar++) {
      if (!core.isMonicVar(lpVar) || !core.toRefine.has(lpVar)) continue;
      for (const factor of core.emons.get(lpVar).vars) weights[factor] += 6;
    }
    const level2var = Array.from({ length: count }, (_, lpVar) => lpVar).sort(
      (first, second) => weights[first] - weights[second] || first - second,
    );
    this.manager.reset(level2var);
  }
}
