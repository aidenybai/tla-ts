// Ported from Z3 (src/smt/theory_lra.cpp), MIT license, see z3-license.txt. How theory_lra
// propagates: asserted bounds go to the lp solver, the tableau is made feasible, and implied bounds
// and equalities of fixed columns come back as literals and equalities.
import { OP_ITE, OP_SUB, SORT_BOOL } from "./ast";
import { TheoryJustification } from "./enode";
import { getIdentityHash, ObjMap } from "./hashtable";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { Literal, negate } from "./literal";
import { Rational } from "./rational";
import { BoundPropagator, getImpliedKind, ImpliedBound } from "./lp/bound-propagator";
import { type ConstraintKind, KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./lp/constraints";
import { LP_INFEASIBLE } from "./lp/core-solver";
import { Dependency, linearize, mkJoin, mkLeaf } from "./lp/dependency";
import { Explanation } from "./lp/explanation";
import type { LarTerm } from "./lp/lar-term";
import { getAtomLiteral, TheoryLraBounds } from "./theory-lra-bounds";
import type { ApiBound } from "./theory-lra-internalize";

const NULL_THEORY_VAR = -1;

interface TermBound {
  constraint: number;
  value: Rational;
}

export abstract class TheoryLraPropagate extends TheoryLraBounds {
  protected abstract propagateNla(isIncremental: boolean): void;

  private bp = new BoundPropagator(this.solver, {
    columnIsInteresting: (column) => this.columnIsInteresting(column),
    boundIsInteresting: (column, kind, value) => this.boundIsInteresting(column, kind, value),
    isEqual: (first, second) => this.isEqual(first, second),
    addEq: (first, second, explanation, isFixed) => this.addEq(first, second, explanation, isFixed),
  });

  protected assertedQhead = 0;
  private delayIneqsQhead = 0;
  protected explanation = new Explanation();
  protected coreLiterals: Literal[] = [];
  protected numConflicts = 0;
  private lowerTerms: (TermBound | undefined)[] = [];
  private upperTerms: (TermBound | undefined)[] = [];
  protected isModelInitialized = false;

  canPropagate() {
    return (
      this.assertedAtoms.length > this.assertedQhead ||
      this.isNewDef ||
      this.solver.columnsWithChangedBounds.size > 0 ||
      this.delayIneqsQhead < this.delayIneqs.length
    );
  }

  propagate() {
    this.propagateCore();
  }

  // propagate_core: whether there was anything to propagate.
  protected propagateCore() {
    const context = this.context;
    this.isModelInitialized = false;
    this.flushBoundAxioms();
    if (context.isInconsistent()) return true;
    if (!this.canPropagate()) return false;
    const manager = this.manager;
    for (
      ;
      this.delayIneqsQhead < this.delayIneqs.length &&
      !context.isInconsistent() &&
      !context.checkCanceled();
      this.delayIneqsQhead++
    ) {
      const saved = this.delayIneqsQhead;
      context.pushTrail(() => {
        this.delayIneqsQhead = saved;
      });
      const atom = this.delayIneqs[this.delayIneqsQhead];
      const args = manager.args[atom];
      const sort = manager.sorts[args[0]];
      const zero = manager.mkNumeralOfSort(Rational.zero, sort);
      const difference = manager.mkApp(OP_SUB, [args[0], args[1]], sort);
      const normalized = manager.mkApp(manager.getOp(atom), [difference, zero], SORT_BOOL);
      const first = this.mkLiteral(atom);
      const second = this.mkLiteral(normalized);
      this.mkAxiom([negate(first), second]);
      this.mkAxiom([first, negate(second)]);
    }
    this.isNewDef = false;
    while (
      this.assertedQhead < this.assertedAtoms.length &&
      !context.isInconsistent() &&
      !context.checkCanceled()
    ) {
      const atom = this.assertedAtoms[this.assertedQhead];
      const bound = this.boolVarToBound[atom.boolVar];
      if (bound !== undefined && !this.assertBound(atom.isTrue, bound)) {
        this.setInfeasibilityConflict();
        return true;
      }
      this.assertedQhead++;
    }
    if (context.isInconsistent()) return true;
    const status = this.makeFeasible();
    if (context.checkCanceled()) return true;
    if (status === L_FALSE) this.setInfeasibilityConflict();
    else if (status === L_TRUE) {
      this.propagateNla(true);
      this.propagateBoundsWithLpSolver();
    }
    return true;
  }

  protected makeFeasible() {
    const status = this.solver.findFeasibleSolution();
    if (this.solver.isFeasible()) return L_TRUE;
    return status === LP_INFEASIBLE ? L_FALSE : L_UNDEF;
  }

  private assertBound(isTrue: boolean, bound: ApiBound) {
    const solver = this.solver;
    const constraint = isTrue ? bound.constraintTrue : bound.constraintFalse;
    if (solver.constraintIsRedundant(constraint)) return solver.status !== LP_INFEASIBLE;
    solver.activate(constraint);
    if (solver.status === LP_INFEASIBLE) return false;
    const kind = this.getBoundKind(bound, isTrue);
    const value = isTrue
      ? bound.value
      : bound.isLower
        ? bound.value.sub(Rational.one)
        : bound.value.add(Rational.one);
    if (bound.isInt || isTrue) this.propagateEqs(bound.column, constraint, kind, bound, value);
    return true;
  }

  // propagate_eqs: a bound that fixes a column, with the opposite bound of the same value.
  private propagateEqs(
    column: number,
    constraint: number,
    kind: ConstraintKind,
    bound: ApiBound,
    value: Rational,
  ) {
    const isLower = kind === KIND_GE;
    if (kind !== KIND_GE && kind !== KIND_LE) return;
    if (!this.setTermBound(column, constraint, value, isLower)) return;
    const opposite = this.getFixingBound(column, value, !isLower);
    if (opposite === undefined) return;
    this.fixedVarEh(bound.thVar, column, mkJoin(mkLeaf(constraint), opposite), value);
  }

  // set_bound: records the bound of a term column, or checks that a column has the bound.
  private setTermBound(column: number, constraint: number, value: Rational, isLower: boolean) {
    const solver = this.solver;
    if (!solver.hasTerm(column)) {
      const bound = solver.getBound(column, !isLower);
      return bound !== undefined && !bound.isStrict && bound.value.equals(value);
    }
    const terms = isLower ? this.lowerTerms : this.upperTerms;
    const existing = terms[column];
    if (
      existing === undefined ||
      (isLower ? existing.value.compare(value) < 0 : existing.value.compare(value) > 0)
    ) {
      this.context.pushTrail(() => {
        terms[column] = existing;
      });
      terms[column] = { constraint, value };
    }
    return true;
  }

  // has_bound: the dependency of a bound of the column with the value, if it has one.
  private getFixingBound(
    column: number,
    value: Rational,
    isLower: boolean,
  ): Dependency | undefined {
    const solver = this.solver;
    if (solver.hasTerm(column)) {
      const thVar = solver.getExternal(column);
      if (thVar !== NULL_THEORY_VAR) {
        const expr = this.getExpr(thVar);
        if (this.manager.isNumeral(expr) && this.manager.getRationalValue(expr).equals(value))
          return null;
      }
      const termBound = (isLower ? this.lowerTerms : this.upperTerms)[column];
      if (termBound === undefined || !termBound.value.equals(value)) return undefined;
      return mkLeaf(termBound.constraint);
    }
    const bound = solver.getBound(column, !isLower);
    if (bound === undefined || !bound.value.equals(value) || bound.isStrict) return undefined;
    return bound.dep;
  }

  protected isEqual(first: number, second: number) {
    return this.getEnode(first).root === this.getEnode(second).root;
  }

  // report_equality_of_fixed_vars: two columns fixed to the same value are equal.
  protected reportEqualityOfFixedVars(first: number, second: number) {
    const solver = this.solver;
    const v1 = solver.getExternal(first);
    const v2 = solver.getExternal(second);
    // Z3 assumes both columns have theory variables, but a cut column has none.
    if (v1 === NULL_THEORY_VAR || v2 === NULL_THEORY_VAR) return;
    if (this.isEqual(v1, v2) || this.isIntVar(v1) !== this.isIntVar(v2)) return;
    const value = Rational.zero;
    const deps = [
      this.getFixingBound(first, value, true),
      this.getFixingBound(first, value, false),
      this.getFixingBound(second, value, true),
      this.getFixingBound(second, value, false),
    ];
    if (deps.some((dep) => dep === undefined)) return;
    this.resetEvidence();
    for (const dep of deps) if (dep !== undefined) this.setEvidenceOfDep(dep);
    this.assignEq(v1, v2);
  }

  // fixed_var_eh: a column fixed to a value is equal to an offset term, or to the variable of the
  // numeral with that value.
  private fixedVarEh(thVar: number, column: number, dep: Dependency, value: Rational) {
    if (this.propagateOffsetEq(column, dep, value)) return;
    const isInt = this.isIntVar(thVar);
    let other = this.value2var.get(`${isInt}:${value}`);
    if (other === undefined) {
      if (value.isZero()) other = this.solver.getExternal(isInt ? this.zeroVar : this.realZeroVar);
      else if (value.equals(Rational.one))
        other = this.solver.getExternal(isInt ? this.oneVar : this.realOneVar);
      else return;
    }
    if (this.isIntVar(other) !== isInt || this.isEqual(thVar, other)) return;
    this.resetEvidence();
    this.setEvidenceOfDep(dep);
    this.assignEq(thVar, other);
  }

  // propagate_offset_eq: x - y fixed to 0 makes x and y equal.
  private propagateOffsetEq(column: number, dep: Dependency, value: Rational) {
    if (!value.isZero() || !this.solver.hasTerm(column)) return false;
    const coeffs = this.getTermCoeffs(this.solver.getTerm(column));
    if (coeffs.length !== 2) return false;
    const first = coeffs[0];
    const second = coeffs[1];
    if (!first[1].add(second[1]).isZero() || first[0] === second[0]) return false;
    if (this.isEqual(first[0], second[0])) return false;
    if (this.isIntVar(first[0]) !== this.isIntVar(second[0])) return false;
    this.resetEvidence();
    this.setEvidenceOfDep(dep);
    this.assignEq(first[0], second[0]);
    return true;
  }

  // term2coeffs: the coefficients of the theory variables of a term, with term columns expanded,
  // in the slot order of Z3's u_map.
  protected getTermCoeffs(term: LarTerm) {
    const coeffs = new ObjMap<Rational>(getIdentityHash);
    const visit = (current: LarTerm, coeff: Rational) => {
      for (const entry of current.coeffs) {
        if (this.solver.hasTerm(entry[0])) {
          visit(this.solver.getTerm(entry[0]), coeff.mul(entry[1]));
          continue;
        }
        const thVar = this.solver.getExternal(entry[0]);
        const sum = (coeffs.get(thVar) ?? Rational.zero).add(entry[1].mul(coeff));
        if (coeffs.has(thVar)) coeffs.replace(thVar, sum);
        else coeffs.set(thVar, sum);
      }
    };
    visit(term, Rational.one);
    return [...coeffs];
  }

  private assignEq(first: number, second: number) {
    this.context.pushEq(this.getEnode(first), this.getEnode(second), {
      kind: "justification",
      justification: new TheoryJustification(this.coreLiterals, []),
    });
  }

  // add_eq: an equality that the lp solver implies, with its explanation.
  protected addEq(first: number, second: number, explanation: Explanation, isFixed: boolean) {
    if (this.context.isInconsistent()) return false;
    const v1 = this.solver.getExternal(first);
    const v2 = this.solver.getExternal(second);
    if (v1 === NULL_THEORY_VAR || v2 === NULL_THEORY_VAR) return false;
    if (this.isEqual(v1, v2) || this.isIntVar(v1) !== this.isIntVar(v2)) return false;
    const manager = this.manager;
    const e1 = this.getExpr(v1);
    const e2 = this.getExpr(v2);
    if (
      !isFixed &&
      !manager.isNumeral(e1) &&
      !manager.isNumeral(e2) &&
      (manager.getOp(e1) === OP_ITE || manager.getOp(e2) === OP_ITE)
    )
      return false;
    this.resetEvidence();
    for (const constraint of explanation) this.setEvidence(constraint);
    this.assignEq(v1, v2);
    return true;
  }

  private columnIsInteresting(column: number) {
    const thVar = this.solver.getExternal(column);
    return (
      thVar !== NULL_THEORY_VAR &&
      thVar < this.unassignedBounds.length &&
      this.unassignedBounds[thVar] > 0
    );
  }

  private boundIsInteresting(column: number, kind: ConstraintKind, value: Rational) {
    const thVar = this.solver.getExternal(column);
    if (thVar === NULL_THEORY_VAR || thVar >= this.bounds.length) return false;
    if (this.unassignedBounds[thVar] === 0) return false;
    const context = this.context;
    return this.bounds[thVar].some(
      (bound) =>
        context.getAssignment(getAtomLiteral(bound)) === L_UNDEF &&
        this.isBoundImplied(kind, value, bound) !== undefined,
    );
  }

  private propagateBoundsWithLpSolver() {
    this.bp.init();
    this.bp.propagateBoundsForTouchedRows();
    if (this.context.checkCanceled()) return;
    if (this.solver.status === LP_INFEASIBLE) {
      this.setInfeasibilityConflict();
      return;
    }
    for (const implied of this.bp.ibounds) {
      if (this.context.isInconsistent()) break;
      this.propagateLpSolverBound(implied);
    }
  }

  private propagateLpSolverBound(implied: ImpliedBound) {
    const thVar = this.solver.getExternal(implied.column);
    if (thVar === NULL_THEORY_VAR || this.unassignedBounds[thVar] === 0) return;
    const context = this.context;
    const kind = getImpliedKind(implied);
    let isFirst = true;
    for (const bound of this.bounds[thVar]) {
      if (context.getAssignment(getAtomLiteral(bound)) !== L_UNDEF) continue;
      const literal = this.isBoundImplied(kind, implied.bound, bound);
      if (literal === undefined) continue;
      if (isFirst) {
        isFirst = false;
        this.resetEvidence();
        this.explanation.clear();
        for (const entry of implied.explain())
          for (const constraint of linearize([entry[1]])) {
            this.setEvidence(constraint);
            this.explanation.addPair(constraint, entry[0]);
          }
      }
      context.assign(literal, new TheoryJustification(this.coreLiterals, []));
    }
  }

  // is_bound_implied: the literal of the bound that the implied bound makes true or false.
  private isBoundImplied(kind: ConstraintKind, value: Rational, bound: ApiBound) {
    const literal = getAtomLiteral(bound);
    const comparison = value.compare(bound.value);
    const isUpperKind = kind === KIND_LE || kind === KIND_LT;
    const isLowerKind = kind === KIND_GE || kind === KIND_GT;
    if (isUpperKind && !bound.isLower && comparison <= 0) return literal;
    if (isLowerKind && bound.isLower && comparison >= 0) return literal;
    if (kind === KIND_LE && bound.isLower && comparison < 0) return negate(literal);
    if (kind === KIND_LT && bound.isLower && comparison <= 0) return negate(literal);
    if (kind === KIND_GE && !bound.isLower && comparison > 0) return negate(literal);
    if (kind === KIND_GT && !bound.isLower && comparison >= 0) return negate(literal);
    return undefined;
  }

  protected resetEvidence() {
    this.coreLiterals = [];
  }

  private setEvidenceOfDep(dep: Dependency) {
    for (const constraint of linearize([dep])) this.setEvidence(constraint);
  }

  protected setEvidence(constraint: number) {
    const literal = this.constraintSources[constraint];
    if (literal !== undefined && literal !== null) this.coreLiterals.push(literal);
  }

  protected setInfeasibilityConflict() {
    this.solver.getInfeasibilityExplanation(this.explanation);
    this.setConflict();
  }

  protected setConflict() {
    this.resetEvidence();
    this.numConflicts++;
    for (const constraint of this.explanation) this.setEvidence(constraint);
    this.context.setConflict(new TheoryJustification(this.coreLiterals, []), null);
  }
}
