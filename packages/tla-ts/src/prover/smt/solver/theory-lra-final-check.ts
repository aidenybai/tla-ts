// Ported from Z3 (src/smt/theory_lra.cpp), MIT license, see z3-license.txt.
import { OP_POWER, OP_POWER0 } from "./ast";
import { FC_CONTINUE, FC_DONE, FC_GIVEUP } from "./theory";
import { TheoryJustification } from "./enode";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { getVar, Literal, negate } from "./literal";
import { Rational } from "./rational";
import { mkBoundAtom, mkTermEqSides } from "./arith-terms";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LT, KIND_NE } from "./lp/constraints";
import type { Explanation } from "./lp/explanation";
import { IntSolver } from "./lp/int-solver";
import type { LarTerm } from "./lp/lar-term";
import type { NlaCore } from "./lp/nla-core";
import type { Ineq, Lemma } from "./lp/nla-types";
import { TheoryLraModel } from "./theory-lra-model";

export abstract class TheoryLraFinalCheck extends TheoryLraModel {
  private lia = new IntSolver(this.solver);

  // Level 2 also runs nlsat's full check.
  override numFinalCheckLevels() {
    return 2;
  }

  override finalCheckEh(level: number) {
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
    if (nlaStatus === FC_DONE && !this.nla?.isUsingNraModel && solver.hasInfInt())
      return FC_CONTINUE;
    if (nlaStatus === FC_GIVEUP) result = FC_GIVEUP;
    if (this.assumeEqs()) return FC_CONTINUE;
    if (this.unsupportedTerms.length > 0) this.initVariableValues();
    for (const term of this.unsupportedTerms) {
      if (!context.isRelevant(term)) continue;
      const status = this.evalUnsupported(term);
      if (status === FC_CONTINUE) return FC_CONTINUE;
      if (status === FC_GIVEUP) result = FC_GIVEUP;
    }
    return result;
  }

  private evalUnsupported(term: number) {
    const manager = this.manager;
    const op = manager.getOp(term);
    if (op === OP_POWER0) return FC_DONE;
    if (op !== OP_POWER) return FC_GIVEUP;
    const base = manager.getArg(term, 0);
    const exponent = manager.getArg(term, 1);
    const isZero = (expr: number) =>
      manager.isNumeral(expr) && manager.getRationalValue(expr).isZero();
    if (isZero(base) && isZero(exponent)) return FC_DONE;
    const nla = this.nla;
    if (nla === undefined) return FC_GIVEUP;
    const status = nla.checkPower(
      this.getLpVar(term),
      this.getLpVar(base),
      this.getLpVar(exponent),
    );
    if (status === L_TRUE) return FC_DONE;
    if (status === L_FALSE) {
      this.addLemmas(nla);
      return FC_CONTINUE;
    }
    return FC_GIVEUP;
  }

  private getLpVar(expr: number) {
    const thVar = this.mkVar(expr);
    this.solver.registerExistingTerms();
    return this.registerVar(thVar);
  }

  protected checkNla(level: number) {
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

  private checkIdivBounds() {
    const nla = this.nla;
    if (nla === undefined) return true;
    nla.checkBoundedDivisions();
    this.addLemmas(nla);
    return nla.lemmas.length === 0;
  }

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

  private addEquality(column: number, value: Rational, explanation: Explanation) {
    const thVar = value.equals(Rational.one)
      ? this.oneVar
      : value.isZero()
        ? this.zeroVar
        : (this.value2var.get(`true:${value}`) ?? this.value2var.get(`false:${value}`));
    if (thVar === undefined || this.solver.getExternal(column) < 0) return;
    this.addEq(this.registerVar(thVar), column, explanation, true);
  }

  private mkNlaLiteral(ineq: Ineq) {
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

  private mkTermEq(term: LarTerm, offset: Rational) {
    const manager = this.manager;
    const sides = mkTermEqSides(manager, this.solver, term, offset, (thVar) => this.getExpr(thVar));
    if (sides[0] === sides[1]) return manager.trueExpr;
    const atom = manager.mkEq(sides[0], sides[1]);
    this.context.internalize(atom, true);
    this.context.markAsRelevant(atom);
    return atom;
  }

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
        new TheoryJustification(this.id, this.coreLiterals, []),
      );
    } else if (move.kind === "conflict") {
      this.explanation.clear();
      this.explanation.addExplanation(this.lia.explanation);
      this.setConflict();
    }
    return move.kind === "sat";
  }

  private mkBound(lpTerm: LarTerm, offset: Rational, isLower: boolean) {
    const context = this.context;
    const atom = mkBoundAtom(this.manager, this.solver, lpTerm, offset, isLower, (thVar) =>
      this.getExpr(thVar),
    );
    context.internalize(atom, true);
    context.markAsRelevant(atom);
    return atom;
  }
}
