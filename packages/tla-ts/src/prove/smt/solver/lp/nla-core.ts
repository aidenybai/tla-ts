// Ported from Z3 (src/math/lp/nla_core.h, src/math/lp/nla_core.cpp, src/math/lp/nla_common.cpp,
// src/math/lp/nla_explanations.cpp, src/math/lp/factorization.cpp,
// src/math/lp/factorization_factory_imp.cpp, src/math/lp/nla_solver.cpp), MIT license, see
// z3-license.txt. The nonlinear core over lar_solver: the monomials whose values disagree with the
// products of their factors' values are refined by lemmas, which the passes below generate, and
// by literals to split on, and by nlsat's search on what they leave open, see nra-solver.ts.
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import type { ResourceLimit } from "../rlimit";
import { Rational } from "../rational";
import { IndexedUintSet } from "./containers";
import {
  COLUMN_BOXED,
  COLUMN_FIXED,
  COLUMN_FREE,
  COLUMN_LOWER,
  COLUMN_UPPER,
  LP_FEASIBLE,
  LP_OPTIMAL,
} from "./core-solver";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LE, KIND_LT, KIND_NE } from "./constraints";
import type { Dependency } from "./dependency";
import { Explanation } from "./explanation";
import type { LarSolver } from "./lar-solver";
import { LarTerm } from "./lar-term";
import { Impq } from "./numeric-pair";
import { Backoff, SqueezeSchedule } from "./nla-backoff";
import { Basics } from "./nla-basics";
import { Divisions } from "./nla-divisions";
import { Emonics, Monic } from "./nla-emonics";
import { type Factor, type Factorization, mkFactor, mkMonFactorization } from "./nla-factorization";
import { Grobner } from "./nla-grobner";
import { Horner } from "./nla-horner";
import { Intervals } from "./nla-intervals";
import { MonomialBounds } from "./nla-monomial-bounds";
import { Monotone } from "./nla-monotone";
import { Order } from "./nla-order";
import { Patcher } from "./nla-patcher";
import { Tangents } from "./nla-tangents";
import { NlaThrottle } from "./nla-throttle";
import {
  type Ineq,
  isConflictLemma,
  type Lemma,
  LemmaBuilder,
  mkIneq,
  negateKind,
} from "./nla-types";
import { NraSolver } from "./nra-solver";
import { getSignedVarVar, isSignedVarNegated, mkSignedVar, VarEqs } from "./nla-var-eqs";

const SMALL_RANGE = new Impq(Rational.of(4n));

interface NlaParams {
  horner: boolean;
  hornerSubsFixed: number;
  hornerFrequency: number;
  hornerRowLengthLimit: number;
  grobner: boolean;
  grobnerRowLengthLimit: number;
  grobnerFrequency: number;
  grobnerEqsGrowth: number;
  grobnerExprSizeGrowth: number;
  grobnerExprDegreeGrowth: number;
  grobnerMaxSimplified: number;
  grobnerCnflToReport: number;
  grobnerPropagateQuotients: boolean;
  grobnerGcdTest: boolean;
  grobnerExpDelay: boolean;
  grobnerAdaptive: boolean;
  grQ: number;
  grobnerSubsFixed: number;
  grobnerExpandTerms: boolean;
  grobnerPerfectSquares: boolean;
  branching: boolean;
  nra: boolean;
  nraCheckAssignment: boolean;
  nraCheckAssignmentMaxFail: number;
  order: boolean;
  orderBinomialSign: boolean;
  tangents: boolean;
  tangentsBoxCorners: boolean;
  expensivePatching: boolean;
  expp: boolean;
  monomialSandwich: boolean;
  monomialSandwichMaxFanout: number;
  monomialBinomialSign: boolean;
  reducePseudoLinear: boolean;
  delay: number;
  propagateLinearMonomials: boolean;
  linearizeViolatedMonomials: boolean;
  optimizeBounds: boolean;
  optimizeBoundsLpMaxVars: number;
  crossNested: boolean;
}

// The arith.nl parameters of Z3's defaults that nla reads.
export const NLA_PARAMS: Readonly<NlaParams> = {
  horner: true,
  hornerSubsFixed: 2,
  hornerFrequency: 4,
  hornerRowLengthLimit: 10,
  grobner: true,
  grobnerRowLengthLimit: 10,
  grobnerFrequency: 4,
  grobnerEqsGrowth: 10,
  grobnerExprSizeGrowth: 2,
  grobnerExprDegreeGrowth: 2,
  grobnerMaxSimplified: 10000,
  grobnerCnflToReport: 1,
  grobnerPropagateQuotients: true,
  grobnerGcdTest: true,
  grobnerExpDelay: true,
  grobnerAdaptive: false,
  grQ: 10,
  grobnerSubsFixed: 1,
  grobnerExpandTerms: true,
  grobnerPerfectSquares: true,
  branching: true,
  nra: true,
  nraCheckAssignment: true,
  nraCheckAssignmentMaxFail: 7,
  order: true,
  orderBinomialSign: true,
  tangents: true,
  tangentsBoxCorners: false,
  expensivePatching: false,
  expp: false,
  monomialSandwich: false,
  monomialSandwichMaxFanout: 0,
  monomialBinomialSign: false,
  reducePseudoLinear: true,
  delay: 10,
  propagateLinearMonomials: true,
  linearizeViolatedMonomials: true,
  optimizeBounds: true,
  optimizeBoundsLpMaxVars: 120,
  crossNested: true,
};

interface NlaEquality {
  readonly first: number;
  readonly second: number;
  readonly explanation: Explanation;
}

interface NlaFixedEquality {
  readonly lpVar: number;
  readonly value: Rational;
  readonly explanation: Explanation;
}

type WeightedCheck = [weight: number, check: () => void];

export class NlaCore {
  readonly varEqs = new VarEqs();
  readonly emons = new Emonics(this.varEqs);
  lemmas: Lemma[] = [];
  literals: Ineq[] = [];
  equalities: NlaEquality[] = [];
  fixedEqualities: NlaFixedEquality[] = [];
  readonly toRefine = new IndexedUintSet();
  readonly monicsWithChangedBounds = new IndexedUintSet();
  readonly activeVarSet = new IndexedUintSet();
  isCheckFeasible = false;
  isNlaSatisfied = false;
  readonly throttle: NlaThrottle;
  readonly tangents: Tangents;
  readonly basics: Basics;
  readonly order: Order;
  readonly monotone: Monotone;
  readonly divisions: Divisions;
  readonly intervals: Intervals;
  readonly monomialBounds: MonomialBounds;
  readonly patcher: Patcher;
  readonly horner: Horner;
  readonly grobner: Grobner;
  readonly nra = new NraSolver(this);
  // m_use_nra_model: whether the values of the last nra check stand for lar_solver's.
  isUsingNraModel = false;
  private nlsatBackoff: Backoff;
  private checkAssignmentFailCount = 0;
  private squeezeSchedule = new SqueezeSchedule();
  isRelevant: (lpVar: number) => boolean = () => true;

  constructor(
    readonly lra: LarSolver,
    readonly limit: ResourceLimit,
  ) {
    this.nlsatBackoff = new Backoff(NLA_PARAMS.delay);
    this.throttle = new NlaThrottle(lra, lra.settings.stats);
    this.tangents = new Tangents(this);
    this.basics = new Basics(this);
    this.order = new Order(this);
    this.monotone = new Monotone(this);
    this.divisions = new Divisions(this);
    this.intervals = new Intervals(this);
    this.monomialBounds = new MonomialBounds(this);
    this.patcher = new Patcher(this);
    this.horner = new Horner(this);
    this.grobner = new Grobner(this);
    lra.onChangedBounds = (columns) => {
      for (const column of columns.elems) {
        if (this.isMonicVar(column)) this.monicsWithChangedBounds.add(column);
        for (const monic of this.emons.getUseList(column))
          this.monicsWithChangedBounds.add(monic.variable);
      }
    };
  }

  get settings() {
    return this.lra.settings;
  }

  get stats() {
    return this.lra.settings.stats;
  }

  // Values and bounds.

  val(lpVar: number) {
    return this.lra.getValue(lpVar).x;
  }

  varVal(monic: Monic) {
    return this.val(monic.variable);
  }

  mulVal(monic: Monic) {
    let product = Rational.one;
    for (const lpVar of monic.vars) product = product.mul(this.val(lpVar));
    return product;
  }

  valFactor(factor: Factor) {
    const value = this.val(factor.variable);
    return factor.isNegated ? value.neg() : value;
  }

  compareHolds(left: Rational, cmp: number, right: Rational) {
    const comparison = left.compare(right);
    switch (cmp) {
      case KIND_LE:
        return comparison <= 0;
      case KIND_LT:
        return comparison < 0;
      case KIND_GE:
        return comparison >= 0;
      case KIND_GT:
        return comparison > 0;
      case KIND_EQ:
        return comparison === 0;
      default:
        return comparison !== 0;
    }
  }

  value(term: LarTerm) {
    let result = Rational.zero;
    for (const entry of term.coeffs) result = result.add(entry[1].mul(this.val(entry[0])));
    return result;
  }

  ineqHolds(ineq: Ineq) {
    return this.compareHolds(this.value(ineq.term), ineq.cmp, ineq.rs);
  }

  hasUpperBound(lpVar: number) {
    return this.lra.core.hasUpperBound(lpVar);
  }

  hasLowerBound(lpVar: number) {
    return this.lra.core.hasLowerBound(lpVar);
  }

  getUpperBound(lpVar: number) {
    return this.lra.getUpperBound(lpVar).x;
  }

  getLowerBound(lpVar: number) {
    return this.lra.getLowerBound(lpVar).x;
  }

  noBounds(lpVar: number) {
    return !this.hasUpperBound(lpVar) && !this.hasLowerBound(lpVar);
  }

  zeroIsAnInnerPointOfBounds(lpVar: number) {
    if (this.hasUpperBound(lpVar) && !this.getUpperBound(lpVar).isPositive()) return false;
    return !(this.hasLowerBound(lpVar) && !this.getLowerBound(lpVar).isNegative());
  }

  varIsInt(lpVar: number) {
    return this.lra.isInt(lpVar);
  }

  varIsFixedToZero(lpVar: number) {
    return this.lra.isFixed(lpVar) && this.lra.getLowerBound(lpVar).isZero();
  }

  varIsFixed(lpVar: number) {
    return this.lra.isFixed(lpVar);
  }

  varIsFree(lpVar: number) {
    return this.lra.isFree(lpVar);
  }

  varHasPositiveLowerBound(lpVar: number) {
    const lower = this.lra.getLowerBound(lpVar);
    return (
      this.hasLowerBound(lpVar) &&
      (lower.x.isPositive() || (lower.x.isZero() && lower.y.isPositive()))
    );
  }

  varHasNegativeUpperBound(lpVar: number) {
    const upper = this.lra.getUpperBound(lpVar);
    return (
      this.hasUpperBound(lpVar) &&
      (upper.x.isNegative() || (upper.x.isZero() && upper.y.isNegative()))
    );
  }

  varIsBig(lpVar: number) {
    return !this.varIsInt(lpVar) && this.val(lpVar).isBig();
  }

  hasBigNum(monic: Monic) {
    return this.varIsBig(monic.variable) || monic.vars.some((lpVar) => this.varIsBig(lpVar));
  }

  hasReal(monic: Monic) {
    return monic.vars.some((lpVar) => !this.varIsInt(lpVar));
  }

  hasRealFactorization(factorization: Factorization) {
    return factorization.factors.some((factor) => !this.varIsInt(factor.variable));
  }

  monHasZero(vars: number[]) {
    return vars.some((lpVar) => this.val(lpVar).isZero());
  }

  // Monomials and their canonization.

  isMonicVar(lpVar: number) {
    return this.emons.isMonicVar(lpVar);
  }

  emon(lpVar: number) {
    return this.emons.get(lpVar);
  }

  mapToRoot(lpVar: number) {
    return getSignedVarVar(this.varEqs.findVar(lpVar));
  }

  sortedRvars(factor: Factor) {
    return factor.isMon ? this.emons.get(factor.variable).rvars : [this.mapToRoot(factor.variable)];
  }

  canonizeSignVar(lpVar: number) {
    return isSignedVarNegated(this.varEqs.findVar(lpVar));
  }

  canonizeSignFactor(factor: Factor) {
    return (
      factor.isNegated !==
      (factor.isMon ? this.emons.get(factor.variable).rsign : this.canonizeSignVar(factor.variable))
    );
  }

  canonizeSignFactorization(factorization: Factorization) {
    let sign = false;
    for (const factor of factorization.factors) sign = sign !== this.canonizeSignFactor(factor);
    return sign;
  }

  getMonicSign(monic: Monic) {
    let sign = 1;
    for (const lpVar of monic.vars) {
      const value = this.val(lpVar);
      if (value.isNegative()) sign = -sign;
      else if (!value.isPositive()) return 0;
    }
    return sign;
  }

  findCanonicalMonicOfVars(vars: number[]) {
    return this.emons.findCanonical(vars)?.variable;
  }

  isCanonicalMonic(lpVar: number) {
    return this.emons.isCanonicalMonic(lpVar);
  }

  addMonic(lpVar: number, vars: number[]) {
    this.emons.add(lpVar, vars);
    this.monicsWithChangedBounds.add(lpVar);
  }

  productValue(monic: Monic) {
    return this.mulVal(monic);
  }

  // check_monic: whether the value of the monic is the product of its factors' values.
  checkMonic(monic: Monic) {
    const value = this.lra.getValue(monic.variable);
    if (this.lra.isInt(monic.variable) && !value.x.isInt()) return true;
    return this.productValue(monic).equals(value.x);
  }

  hasRelevantMonomial() {
    return this.emons.monics.some((monic) => this.isRelevant(monic.variable));
  }

  getVarWeight(lpVar: number) {
    const type = this.lra.core.getColumnType(lpVar);
    let weight =
      type === COLUMN_FIXED
        ? 0
        : type === COLUMN_BOXED
          ? 3
          : type === COLUMN_LOWER || type === COLUMN_UPPER
            ? 6
            : type === COLUMN_FREE
              ? 9
              : 0;
    if (this.isMonicVar(lpVar)) {
      weight++;
      if (this.toRefine.has(lpVar)) weight++;
    }
    return weight;
  }

  // divide: the factor b with bc = b * c, up to sign.
  divide(product: Monic, divisor: Factor): Factor | undefined {
    const divisorVars = this.sortedRvars(divisor);
    const quotientVars = getVectorDiv(product.rvars, divisorVars);
    if (quotientVars === undefined) return undefined;
    let quotient: Factor;
    if (quotientVars.length === 1) quotient = mkFactor(quotientVars[0], false);
    else {
      const monic = this.emons.findCanonical(quotientVars);
      if (monic === undefined) return undefined;
      quotient = mkFactor(monic.variable, true);
    }
    quotient.isNegated =
      (this.canonizeSignFactor(quotient) !== this.canonizeSignFactor(divisor)) !== product.rsign;
    return quotient;
  }

  // The factorizations of a monic: into its variables first, then into two canonical factors.
  *getFactorizations(rooted: Monic): Generator<Factorization> {
    const vars = rooted.rvars;
    const monic = this.emons.get(rooted.variable);
    const mask: boolean[] =
      vars.length !== 2 ? Array.from({ length: vars.length - 1 }, () => false) : [true];
    let isFullReturned = false;
    let numFailures = 0;
    const getFactor = (factorVars: number[]): Factor | undefined => {
      if (factorVars.length === 1) return mkFactor(factorVars[0], false);
      const variable = this.findCanonicalMonicOfVars(factorVars);
      if (variable === undefined) {
        numFailures++;
        return undefined;
      }
      return mkFactor(variable, true);
    };
    const getBinary = (): Factorization => {
      const kVars = [vars[vars.length - 1]];
      const jVars: number[] = [];
      mask.forEach((isSet, index) => (isSet ? kVars : jVars).push(vars[index]));
      kVars.sort((first, second) => first - second);
      jVars.sort((first, second) => first - second);
      if (numFailures > 1000) {
        mask.fill(true);
        mask[0] = false;
        isFullReturned = true;
        return { factors: [], mon: null };
      }
      const first = getFactor(kVars);
      if (first === undefined) return { factors: [], mon: null };
      numFailures = 0;
      const second = getFactor(jVars);
      if (second === undefined) return { factors: [], mon: null };
      const factorization: Factorization = { factors: [first, second], mon: null };
      first.isNegated =
        first.isNegated !== (this.canonizeSignFactorization(factorization) !== monic.rsign);
      return factorization;
    };
    for (;;) {
      if (isFullReturned && mask.every(Boolean)) return;
      yield isFullReturned ? getBinary() : mkMonFactorization(monic);
      if (!isFullReturned) {
        isFullReturned = true;
        continue;
      }
      const index = mask.indexOf(false);
      mask.fill(false, 0, index === -1 ? mask.length : index);
      if (index !== -1) mask[index] = true;
    }
  }

  // Lemma helpers.

  negateRelation(lemma: LemmaBuilder, lpVar: number, value: Rational) {
    lemma.addIneq(mkIneq(lpVar, this.val(lpVar).compare(value) < 0 ? KIND_GE : KIND_LE, value));
  }

  // Explanations of inequalities by bounds.

  private explainCoeffBound(
    column: number,
    coeff: Rational,
    isUpper: boolean,
    explanation: Explanation,
  ) {
    const useUpper = isUpper ? !coeff.isNegative() : coeff.isNegative();
    const dep = useUpper ? this.lra.getUpperWitness(column) : this.lra.getLowerWitness(column);
    if (dep === null) return undefined;
    const bound = useUpper ? this.lra.getUpperBound(column) : this.lra.getLowerBound(column);
    explanation.pushDependency(dep);
    return coeff.mul(bound.x);
  }

  private explainBound(term: LarTerm, rs: Rational, isUpper: boolean, explanation: Explanation) {
    let bound = Rational.zero;
    for (const entry of term.coeffs) {
      const coeffBound = this.explainCoeffBound(entry[0], entry[1], isUpper, explanation);
      if (coeffBound === undefined) {
        explanation.clear();
        return false;
      }
      bound = bound.add(coeffBound);
    }
    if (isUpper ? bound.compare(rs) > 0 : bound.compare(rs) < 0) {
      explanation.clear();
      return false;
    }
    return true;
  }

  // explain_ineq: whether the bounds imply the negation of term cmp rs, added to the lemma.
  explainIneq(lemma: LemmaBuilder, term: LarTerm, cmp: number, rs: Rational) {
    if (term.size === 0 && rs.isZero() && (cmp === KIND_LT || cmp === KIND_GT || cmp === KIND_NE))
      return true;
    const explanation = new Explanation();
    const one = Rational.one;
    const isExplained = (() => {
      switch (negateKind(cmp)) {
        case KIND_LE:
          return this.explainBound(term, rs, true, explanation);
        case KIND_LT:
          return this.explainBound(term, rs.sub(one), true, explanation);
        case KIND_GE:
          return this.explainBound(term, rs, false, explanation);
        case KIND_GT:
          return this.explainBound(term, rs.add(one), false, explanation);
        case KIND_EQ:
          return (
            (this.explainBound(term, rs, false, explanation) &&
              this.explainBound(term, rs, true, explanation)) ||
            (rs.isZero() && this.explainByEquiv(term, explanation))
          );
        default:
          return (
            this.explainBound(term, rs.add(one), false, explanation) ||
            this.explainBound(term, rs.sub(one), true, explanation)
          );
      }
    })();
    if (!isExplained) return false;
    lemma.addExplanation(explanation);
    return true;
  }

  // is_octagon_term: whether the term is +-x +-y, and whether its signs agree.
  private getOctagonTerm(term: LarTerm) {
    if (term.size !== 2) return undefined;
    let isMinusSeen = false;
    let isPlusSeen = false;
    const vars: number[] = [];
    for (const entry of term.coeffs) {
      if (entry[1].equals(Rational.one)) isPlusSeen = true;
      else if (entry[1].equals(Rational.minusOne)) isMinusSeen = true;
      else return undefined;
      vars.push(entry[0]);
    }
    return { first: vars[0], second: vars[1], isNegated: !(isMinusSeen && isPlusSeen) };
  }

  explainByEquiv(term: LarTerm, explanation: Explanation) {
    const octagon = this.getOctagonTerm(term);
    if (octagon === undefined) return false;
    const first = mkSignedVar(octagon.first, false);
    const second = mkSignedVar(octagon.second, octagon.isNegated);
    if (this.varEqs.find(first) !== this.varEqs.find(second)) return false;
    this.varEqs.explain(first, second, explanation);
    return true;
  }

  // collect_equivs: the term columns fixed to zero that equate or negate two variables.
  private collectEquivs() {
    const lra = this.lra;
    for (const term of lra.terms) {
      const column = term.column;
      if (!lra.hasTerm(column) || !this.varIsFixedToZero(column)) continue;
      const octagon = this.getOctagonTerm(term);
      if (octagon === undefined) continue;
      const justification: Dependency[] = [
        lra.getUpperWitness(column),
        lra.getLowerWitness(column),
      ];
      if (octagon.isNegated) this.varEqs.mergeMinus(octagon.first, octagon.second, justification);
      else this.varEqs.mergePlus(octagon.first, octagon.second, justification);
    }
    this.emons.ensureCanonized();
  }

  // The search.

  random() {
    return this.settings.getRandomNext();
  }

  isCanceled() {
    return this.settings.isCanceled();
  }

  // check_bounded_divisions: the lemmas of the divisions of bounded terms by numerals.
  checkBoundedDivisions() {
    this.clear();
    this.divisions.checkBoundedDivisions();
  }

  clear() {
    this.lemmas = [];
    this.literals = [];
    this.fixedEqualities = [];
    this.equalities = [];
    this.isCheckFeasible = false;
  }

  private initSearch() {
    this.clear();
    this.collectEquivs();
  }

  insertToRefine(lpVar: number) {
    this.toRefine.add(lpVar);
  }

  eraseFromToRefine(lpVar: number) {
    if (this.toRefine.has(lpVar)) this.toRefine.delete(lpVar);
  }

  initToRefine() {
    if (this.lra.isFeasible()) this.lra.getRidOfInfEps();
    this.toRefine.clear();
    const offset = this.random();
    const size = this.emons.numMonics;
    for (let index = 0; index < size; index++) {
      const monic = this.emons.monics[(index + offset) % size];
      if (!this.checkMonic(monic)) this.insertToRefine(monic.variable);
    }
  }

  conflictFound() {
    return this.lemmas.some(isConflictLemma);
  }

  done() {
    return this.lemmas.length >= 10 || this.conflictFound() || this.isCanceled();
  }

  findBfcToRefineOnMonic(monic: Monic) {
    for (const factorization of this.getFactorizations(monic)) {
      if (factorization.factors.length !== 2) continue;
      const product = this.valFactor(factorization.factors[0]).mul(
        this.valFactor(factorization.factors[1]),
      );
      if (!this.varVal(monic).equals(product)) return factorization;
    }
    return undefined;
  }

  // find_bfc_to_refine: a monic to refine, with a binary factorization of it.
  findBfcToRefine() {
    const offset = this.random();
    const size = this.toRefine.size;
    for (let index = 0; index < size; index++) {
      const monic = this.emons.get(this.toRefine.elems[(index + offset) % size]);
      if (this.hasReal(monic)) continue;
      if (monic.size === 2) {
        const factorization: Factorization = {
          factors: [mkFactor(monic.vars[0], false), mkFactor(monic.vars[1], false)],
          mon: monic,
        };
        return { monic, factorization };
      }
      const factorization = this.findBfcToRefineOnMonic(monic);
      if (factorization !== undefined) return { monic, factorization };
    }
    return undefined;
  }

  // check_weighted: runs the checks in a random order weighted by their weights, until one yields.
  private checkWeighted(checks: WeightedCheck[]) {
    let bound = 0;
    for (const check of checks) bound += check[0];
    const seen = new Set<number>();
    while (bound > 0 && !this.done() && this.lemmas.length === 0) {
      let draw = this.random() % bound;
      for (let index = 0; index < checks.length; index++) {
        if (seen.has(index)) continue;
        if (draw < checks[index][0]) {
          seen.add(index);
          checks[index][1]();
          bound -= checks[index][0];
          break;
        }
        draw -= checks[index][0];
      }
    }
  }

  // add_bounds: a split on a free variable of a monic to refine.
  private addBounds() {
    const offset = this.random();
    const size = this.toRefine.size;
    for (let index = 0; index < size; index++) {
      const monic = this.emons.get(this.toRefine.elems[(index + offset) % size]);
      for (const lpVar of monic.vars) {
        if (!this.varIsFree(lpVar) || monic.isBoundPropagated) continue;
        this.emons.setBoundPropagated(monic);
        this.literals.push(mkIneq(lpVar, KIND_EQ, 0));
        this.stats.nlaAddBounds++;
        return;
      }
    }
  }

  private onToRefineEmpty() {
    this.squeezeSchedule.onNothingToRefine();
    return L_TRUE;
  }

  check(level: number) {
    const stats = this.stats;
    stats.nlaCalls++;
    this.lra.getRidOfInfEps();
    if (this.lra.status !== LP_OPTIMAL && this.lra.status !== LP_FEASIBLE) return L_UNDEF;
    this.initToRefine();
    this.patcher.patchMonomials();
    this.setUseNraModel(false);
    if (this.toRefine.size === 0) return this.onToRefineEmpty();
    this.initSearch();
    this.isNlaSatisfied = false;
    let result = L_UNDEF;
    const isRunningGrobner = NLA_PARAMS.grobner;
    const isRunningHorner = NLA_PARAMS.horner && stats.nlaCalls % NLA_PARAMS.hornerFrequency === 0;
    const isRunningBounds = NLA_PARAMS.branching;
    // Model-based basic lemmas are effective on small systems, and branching on larger ones.
    const isDelayingBounds = isRunningBounds && this.emons.numMonics <= 8;
    const hasNoEffect = () =>
      result === L_UNDEF &&
      !this.done() &&
      !this.isNlaSatisfied &&
      this.lemmas.length === 0 &&
      this.literals.length === 0 &&
      !this.isCheckFeasible;
    if (hasNoEffect()) this.monomialBounds.generateLemmas();
    if (hasNoEffect() && this.refinePseudoLinear()) return L_FALSE;
    const isSqueezeCadence = stats.nlaCalls % NLA_PARAMS.hornerFrequency === 0;
    if (
      hasNoEffect() &&
      this.squeezeSchedule.isEnabled &&
      (isRunningHorner || isRunningGrobner) &&
      (this.squeezeSchedule.isEager || isSqueezeCadence)
    ) {
      this.squeezeSchedule.onSqueeze(this.monomialBounds.optimizeNlBounds());
      if (this.toRefine.size === 0) return this.onToRefineEmpty();
    }
    const runHorner = () => {
      if (hasNoEffect() && isRunningHorner) this.horner.hornerLemmas();
    };
    const runGrobner = () => {
      if (hasNoEffect() && isRunningGrobner) this.grobner.run();
    };
    const runBounds = () => {
      if (hasNoEffect() && isRunningBounds) this.addBounds();
    };
    this.checkWeighted(
      isDelayingBounds
        ? [
            [1, runHorner],
            [1, runGrobner],
          ]
        : [
            [1, runHorner],
            [1, runGrobner],
            [1, runBounds],
          ],
    );
    if (this.isCanceled()) return L_UNDEF;
    if (this.lemmas.length > 0 || this.literals.length > 0 || this.isCheckFeasible) return L_FALSE;
    if (this.isNlaSatisfied) return L_TRUE;
    if (
      hasNoEffect() &&
      NLA_PARAMS.nraCheckAssignment &&
      this.checkAssignmentFailCount < NLA_PARAMS.nraCheckAssignmentMaxFail
    ) {
      result = this.nra.checkAssignment();
      if (result !== L_TRUE) this.checkAssignmentFailCount++;
    }
    if (hasNoEffect() && this.shouldRunBoundedNlsat()) result = this.boundedNlsat();
    if (hasNoEffect()) this.basics.basicLemma(true);
    if (hasNoEffect() && isDelayingBounds) this.basics.basicLemma(false);
    if (hasNoEffect() && isDelayingBounds) this.addBounds();
    if (hasNoEffect() && !isDelayingBounds) this.basics.basicLemma(false);
    if (hasNoEffect()) this.divisions.check();
    if (hasNoEffect()) {
      this.checkWeighted([
        [6, () => this.order.orderLemma()],
        [2, () => this.monotone.monotonicityLemma()],
        [1, () => this.tangents.tangentLemma()],
      ]);
      const numCalls = stats.nlaCalls;
      if (!this.conflictFound() && NLA_PARAMS.nra && numCalls % 50 === 0 && numCalls > 500)
        result = this.boundedNlsat();
    }
    if (hasNoEffect() && NLA_PARAMS.nra && level >= 2) {
      result = this.nra.check(Infinity, Infinity);
      stats.nraCalls++;
    }
    if (result === L_UNDEF && !hasNoEffect()) result = L_FALSE;
    stats.nlaLemmas += this.lemmas.length;
    return result;
  }

  private shouldRunBoundedNlsat() {
    return NLA_PARAMS.nra && this.nlsatBackoff.shouldRun();
  }

  // bounded_nlsat: a run of nlsat capped at 100 conflicts and 100000 steps. A refutation, or a run
  // that took less than a tenth of the steps, makes the backoff run it again sooner.
  private boundedNlsat() {
    const budget = 100000;
    const result = this.nra.check(100, budget);
    this.stats.nraCalls++;
    this.nlsatBackoff.update(result === L_FALSE || this.nra.steps < budget / 10);
    if (result === L_TRUE) this.clear();
    return result;
  }

  // set_use_nra_model, undone on pop.
  setUseNraModel(isUsing: boolean) {
    if (isUsing === this.isUsingNraModel) return;
    this.emons.trail.push(() => {
      this.isUsingNraModel = !isUsing;
    });
    this.isUsingNraModel = isUsing;
  }

  // Propagation.

  propagate() {
    this.clear();
    let isPropagated = false;
    if (this.monomialBounds.tightenLpBounds()) isPropagated = true;
    if (this.monomialBounds.propagateChangedBounds()) isPropagated = true;
    if (this.monomialBounds.propagateViolatedLinearMonomials()) isPropagated = true;
    this.monicsWithChangedBounds.clear();
    if (isPropagated) this.isCheckFeasible = true;
    return isPropagated;
  }

  incrementalPropagate() {
    this.clear();
    const isPropagated = this.monomialBounds.propagateChangedBounds();
    this.monicsWithChangedBounds.clear();
    if (isPropagated) this.isCheckFeasible = true;
    return isPropagated;
  }

  // Pseudo-linear monomials: all but one factor are integers in a range of at most 4.

  private isPseudoLinear(monic: Monic) {
    let hasUnbounded = false;
    for (const lpVar of monic.vars) {
      if (this.isSmallIntRange(lpVar)) continue;
      if (hasUnbounded) return false;
      hasUnbounded = true;
    }
    return true;
  }

  private isSmallIntRange(lpVar: number) {
    const lra = this.lra;
    const type = lra.core.getColumnType(lpVar);
    if ((type !== COLUMN_BOXED && type !== COLUMN_FIXED) || !lra.isInt(lpVar)) return false;
    return lra.getUpperBound(lpVar).sub(lra.getLowerBound(lpVar)).compare(SMALL_RANGE) <= 0;
  }

  private refinePseudoLinear() {
    if (!NLA_PARAMS.reducePseudoLinear) return false;
    for (const lpVar of this.toRefine.elems) {
      const monic = this.emons.get(lpVar);
      if (!this.isPseudoLinear(monic)) continue;
      this.refinePseudoLinearMonic(monic);
      return true;
    }
    return false;
  }

  private refinePseudoLinearMonic(monic: Monic) {
    const lemma = new LemmaBuilder(this);
    let nlVar = -1;
    let product = Rational.one;
    for (let index = 0; index < monic.vars.length; index++) {
      const lpVar = monic.vars[index];
      if (index === monic.vars.length - 1 && nlVar === -1) {
        nlVar = lpVar;
        break;
      }
      if (this.isSmallIntRange(lpVar)) {
        lemma.addIneq(mkIneq(lpVar, KIND_NE, this.val(lpVar)));
        product = product.mul(this.val(lpVar));
        continue;
      }
      nlVar = lpVar;
    }
    lemma.addIneq(
      mkIneq(
        new LarTerm([
          [monic.variable, Rational.one],
          [nlVar, product.neg()],
        ]),
        KIND_EQ,
        0,
      ),
    );
  }

  // Scopes.

  push() {
    this.emons.push();
  }

  pop(count: number) {
    this.emons.pop(count);
  }
}

// vector_div: the multiset difference of sorted vectors, when the divisor is a proper factor.
const getVectorDiv = (product: number[], divisor: number[]) => {
  if (divisor.length >= product.length) return undefined;
  const quotient: number[] = [];
  let divisorIndex = 0;
  for (const lpVar of product) {
    if (divisorIndex < divisor.length && divisor[divisorIndex] === lpVar) divisorIndex++;
    else if (divisorIndex < divisor.length && divisor[divisorIndex] < lpVar) return undefined;
    else quotient.push(lpVar);
  }
  return divisorIndex === divisor.length ? quotient : undefined;
};
