// Ported from Z3 (src/smt/theory_lra.cpp), MIT license, see z3-license.txt. The final check of
// theory_lra: the integer solver and its branches and cuts, then nla on nonlinear terms, whose
// lemmas become clauses.
import { OP_ADD, OP_GE, OP_LE, OP_MUL, OP_TO_REAL, SORT_BOOL, SORT_INT, SORT_REAL } from "./ast";
import { FC_CONTINUE, FC_DONE, FC_GIVEUP } from "./context";
import { TheoryJustification } from "./enode";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { getVar, Literal, negate } from "./literal";
import { getGcd, getLcm, Rational } from "./rational";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LT } from "./lp/constraints";
import { Explanation } from "./lp/explanation";
import { IntSolver } from "./lp/int-solver";
import type { LarTerm } from "./lp/lar-term";
import { Ineq, KIND_NE, Lemma, NlaCore } from "./lp/nla-core";
import { TheoryLraModel } from "./theory-lra-model";

export abstract class TheoryLraFinalCheck extends TheoryLraModel {
  private lia = new IntSolver(this.solver);

  finalCheckEh(level: number) {
    const context = this.context;
    if (this.propagateCore()) return FC_CONTINUE;
    this.isModelInitialized = false;
    const solver = this.solver;
    this.propagateNla(false);
    const status =
      !solver.isFeasible() || solver.columnsWithChangedBounds.size > 0
        ? this.makeFeasible()
        : L_TRUE;
    if (status === L_FALSE) {
      this.setInfeasibilityConflict();
      return FC_CONTINUE;
    }
    if (status === L_UNDEF) return context.checkCanceled() ? FC_GIVEUP : FC_CONTINUE;
    if (!this.isLiaSat() || !this.checkIdivBounds()) return FC_CONTINUE;
    let result = FC_DONE;
    const nlaStatus = this.checkNla(level);
    if (nlaStatus === FC_CONTINUE) return FC_CONTINUE;
    // Nonlinear bound optimization may invalidate integer feasibility.
    if (nlaStatus === FC_DONE && !this.nla?.isUsingNraModel && solver.hasInfInt())
      return FC_CONTINUE;
    if (nlaStatus === FC_GIVEUP) result = FC_GIVEUP;
    if (this.assumeEqs()) return FC_CONTINUE;
    if (this.unsupportedTerms.length > 0) this.initVariableValues();
    // eval_unsupported gives up on every term but powers, which are not supported here.
    return this.unsupportedTerms.some((term) => context.isRelevant(term)) ? FC_GIVEUP : result;
  }

  // check_nla: whether the values of the monomials agree with their factors', or the lemmas that
  // refine them.
  private checkNla(level: number) {
    if (this.context.checkCanceled()) return FC_GIVEUP;
    const nla = this.nla;
    if (nla === undefined || !nla.hasRelevantMonomial()) return FC_DONE;
    const status = nla.check(level);
    if (status === L_FALSE) {
      this.addLemmas(nla);
      return FC_CONTINUE;
    }
    return status === L_TRUE ? FC_DONE : FC_GIVEUP;
  }

  // check_idiv_bounds: the lemmas of the bounded divisions.
  private checkIdivBounds() {
    const nla = this.nla;
    if (nla === undefined) return true;
    nla.checkBoundedDivisions();
    this.addLemmas(nla);
    return nla.lemmas.length === 0;
  }

  // propagate_nla and incremental_propagate_nla: the bounds nla derives for monomials.
  protected propagateNla(isIncremental: boolean) {
    const nla = this.nla;
    if (nla === undefined) return;
    if (isIncremental) nla.incrementalPropagate();
    else nla.propagate();
    this.addLemmas(nla);
    this.solver.collectMoreRowsForLpPropagation();
  }

  private addLemmas(nla: NlaCore) {
    if (nla.isCheckFeasible && this.makeFeasible() === L_FALSE) {
      this.setInfeasibilityConflict();
      return;
    }
    for (const ineq of nla.literals) {
      const literal = this.mkNlaLiteral(ineq);
      this.context.markLiteralAsRelevant(literal);
      this.context.setTrueFirstFlag(getVar(literal));
    }
    for (const lemma of nla.lemmas) this.falseCaseOfCheckNla(lemma);
    for (const equality of nla.fixedEqualities)
      this.addEquality(equality.lpVar, equality.value, equality.explanation);
    for (const equality of nla.equalities)
      this.addEq(equality.first, equality.second, equality.explanation, false);
  }

  // add_equality: a column fixed to a value, equal to the variable of the value's numeral.
  private addEquality(column: number, value: Rational, explanation: Explanation) {
    const thVar = value.equals(Rational.one)
      ? this.oneVar
      : value.isZero()
        ? this.zeroVar
        : (this.value2var.get(`true:${value}`) ?? this.value2var.get(`false:${value}`));
    if (thVar === undefined || this.solver.getExternal(column) < 0) return;
    this.addEq(this.registerVar(thVar), column, explanation, true);
  }

  // mk_literal: the literal of an inequality of nla, over a bound or equality atom.
  private mkNlaLiteral(ineq: Ineq) {
    // scoped_auxiliary: the bounds of the atom are auxiliary constraints.
    const constraints = this.solver.constraints;
    constraints.isAuxiliaryMode = true;
    const literal = this.mkNlaLiteralCore(ineq);
    constraints.isAuxiliaryMode = false;
    return literal;
  }

  private mkNlaLiteralCore(ineq: Ineq) {
    const kind = ineq.cmp;
    if (kind === KIND_EQ || kind === KIND_NE) {
      const atom = this.mkTermEq(ineq.term, ineq.rs);
      const literal = this.context.getLiteral(atom);
      return kind === KIND_NE ? negate(literal) : literal;
    }
    const isLower = kind === KIND_LT || kind === KIND_GE;
    const literal = this.context.getLiteral(this.mkBound(ineq.term, ineq.rs, isLower));
    return kind === KIND_LT || kind === KIND_GT ? negate(literal) : literal;
  }

  // mk_eq: the atom term = offset.
  private mkTermEq(term: LarTerm, offset: Rational) {
    const manager = this.manager;
    const coeffs = this.getTermCoeffs(term);
    const isInt =
      offset.isInt() && coeffs.every((entry) => this.isIntVar(entry[0]) && entry[1].isInt());
    const left = this.coeffsToApp(coeffs, isInt);
    const right = manager.mkNumeralOfSort(offset, isInt ? SORT_INT : SORT_REAL);
    if (left === right) return manager.trueExpr;
    const atom = manager.mkEq(left, right);
    this.context.internalize(atom, true);
    this.context.markAsRelevant(atom);
    return atom;
  }

  // false_case_of_check_nla and set_conflict_or_lemma: the lemma as a theory axiom, unless one of
  // its literals is already true.
  private falseCaseOfCheckNla(lemma: Lemma) {
    const context = this.context;
    const literals = lemma.ineqs.map((ineq) => negate(this.mkNlaLiteral(ineq)));
    this.resetEvidence();
    this.coreLiterals.push(...literals);
    this.numConflicts++;
    for (const constraint of lemma.expl) this.setEvidence(constraint);
    const clause: Literal[] = [];
    for (const literal of this.coreLiterals) {
      const negated = negate(literal);
      clause.push(negated);
      context.markLiteralAsRelevant(negated);
      if (context.getAssignment(negated) === L_TRUE) return;
    }
    context.mkThAxiom(clause);
  }

  // check_lia: whether the integer solver found the integer columns integral.
  private isLiaSat() {
    if (this.context.checkCanceled()) return false;
    const move = this.lia.check();
    if (move.kind === "branch") this.mkBound(this.lia.term, move.offset, !move.isUpper);
    else if (move.kind === "cut") {
      this.resetEvidence();
      for (const constraint of this.lia.explanation) this.setEvidence(constraint);
      const atom = this.mkBound(this.lia.term, move.offset, !move.isUpper);
      this.context.assign(
        this.context.getLiteral(atom),
        new TheoryJustification(this.coreLiterals, []),
      );
    } else if (move.kind === "conflict") {
      this.explanation.clear();
      this.explanation.addExplanation(this.lia.explanation);
      this.setConflict();
    }
    return move.kind === "sat";
  }

  // mk_bound: the atom of a bound on an lp term, over the theory variables of its columns.
  private mkBound(lpTerm: LarTerm, inputOffset: Rational, inputIsLower: boolean) {
    const manager = this.manager;
    const context = this.context;
    let coeffs = this.getTermCoeffs(lpTerm);
    let offset = inputOffset;
    let isLower = inputIsLower;
    let lcm = offset.den;
    const isInt = coeffs.every((entry) => this.isIntVar(entry[0]));
    if (isInt) {
      for (const entry of coeffs) lcm = getLcm(lcm, entry[1].den);
      if (lcm !== 1n) {
        const scale = Rational.of(lcm);
        offset = offset.mul(scale);
        coeffs = coeffs.map((entry) => [entry[0], entry[1].mul(scale)]);
      }
      let gcd = 0n;
      for (const entry of coeffs) gcd = getGcd(gcd, entry[1].num);
      if (gcd !== 0n && gcd !== 1n) {
        const divisor = Rational.of(gcd);
        coeffs = coeffs.map((entry) => [entry[0], entry[1].div(divisor)]);
        offset = isLower ? offset.div(divisor).ceil() : offset.div(divisor).floor();
      }
    }
    if (coeffs.length > 0 && coeffs[0][1].isNegative()) {
      offset = offset.neg();
      isLower = !isLower;
      coeffs = coeffs.map((entry) => [entry[0], entry[1].neg()]);
    }
    const sort = isInt ? SORT_INT : SORT_REAL;
    const term = this.coeffsToApp(coeffs, isInt);
    const atom = manager.mkApp(
      isLower ? OP_GE : OP_LE,
      [term, manager.mkNumeralOfSort(offset, sort)],
      SORT_BOOL,
    );
    context.internalize(atom, true);
    context.markAsRelevant(atom);
    return atom;
  }

  // coeffs2app: the sum of the expressions of theory variables times coefficients, with Int
  // expressions of a Real sum coerced to Real.
  private coeffsToApp(coeffs: [number, Rational][], isInt: boolean) {
    const manager = this.manager;
    const sort = isInt ? SORT_INT : SORT_REAL;
    const summands = coeffs
      .filter((entry) => !entry[1].isZero())
      .map((entry) => {
        const original = this.getExpr(entry[0]);
        const expr =
          !isInt && manager.isInt(original)
            ? manager.mkApp(OP_TO_REAL, [original], SORT_REAL)
            : original;
        return entry[1].equals(Rational.one)
          ? expr
          : manager.mkApp(OP_MUL, [manager.mkNumeralOfSort(entry[1], sort), expr], sort);
      });
    return summands.length === 0
      ? manager.mkNumeralOfSort(Rational.zero, sort)
      : summands.length === 1
        ? summands[0]
        : manager.mkApp(OP_ADD, summands, sort);
  }
}
