// Ported from Z3 (src/smt/theory_lra.cpp, src/smt/arith_eq_adapter.cpp, src/math/lp/lp_api.h), MIT
// license, see z3-license.txt. This class adds the scopes to the chain that theory-lra-state.ts
// starts.
import { SmtUnsupportedError } from "../../../errors";
import { shrink } from "./array";
import { OP_GE, OP_GT, OP_LE, SORT_BOOL, SORT_INT, SORT_REAL } from "./ast";
import type { Enode } from "./enode";
import { InfEps } from "./inf-eps";
import { LP_FEASIBLE, LP_OPTIMAL, LP_UNBOUNDED } from "./lp/core-solver";
import { NULL_LPVAR } from "./lp/lar-solver";
import { maximizeTerm } from "./lp/maximize-term";
import { Impq } from "./lp/numeric-pair";
import { Rational } from "./rational";
import { TheoryLraFinalCheck } from "./theory-lra-final-check";

export interface ArithBound {
  value: Rational;
  isStrict: boolean;
}

export class TheoryLra extends TheoryLraFinalCheck {
  private getColumnOf(node: Enode) {
    const thVar = node.getThVar(this.id);
    return thVar < 0 ? NULL_LPVAR : this.solver.externalToLocalColumn(thVar);
  }

  getLower(node: Enode): ArithBound | undefined {
    const column = this.getColumnOf(node);
    const bound = column === NULL_LPVAR ? undefined : this.solver.getLowerBoundOf(column);
    return bound === undefined ? undefined : { value: bound.x, isStrict: bound.y.isPositive() };
  }

  getUpper(node: Enode): ArithBound | undefined {
    const column = this.getColumnOf(node);
    const bound = column === NULL_LPVAR ? undefined : this.solver.getUpperBoundOf(column);
    return bound === undefined ? undefined : { value: bound.x, isStrict: bound.y.isNegative() };
  }

  getValueOf(node: Enode) {
    const column = this.getColumnOf(node);
    const value = column === NULL_LPVAR ? undefined : this.solver.getExactValue(column);
    if (value === undefined) return undefined;
    return this.isIntVar(node.getThVar(this.id)) && !value.isInt() ? undefined : value;
  }

  addObjective(term: number) {
    const thVar = this.internalizeDef(term);
    this.registerVar(thVar);
    return thVar;
  }

  getObjectiveValue(thVar: number) {
    const value = this.solver.getValue(this.solver.externalToLocalColumn(thVar));
    return InfEps.of(value.x, value.y);
  }

  maximize(thVar: number) {
    const solver = this.solver;
    if (solver.hasIntVar()) solver.core.backupX();
    const column = solver.externalToLocalColumn(thVar);
    const isMaximizing = column !== NULL_LPVAR && this.manager.limit.inc();
    const maximum = isMaximizing
      ? this.maximizeWithLp(column)
      : { status: LP_UNBOUNDED, value: Impq.zero };
    if (
      isMaximizing &&
      this.nla !== undefined &&
      (maximum.status === LP_OPTIMAL || maximum.status === LP_UNBOUNDED)
    )
      throw new SmtUnsupportedError("optimization of nonlinear arithmetic");
    if (maximum.status === LP_UNBOUNDED)
      return { value: InfEps.infinity, blocker: this.manager.falseExpr };
    if (maximum.status === LP_OPTIMAL) this.initVariableValues();
    return {
      value: InfEps.of(maximum.value.x, maximum.value.y),
      blocker: this.mkGt(thVar, maximum.value),
    };
  }

  private maximizeWithLp(column: number) {
    const solver = this.solver;
    if (!solver.isFeasible() || solver.columnsWithChangedBounds.size > 0) this.makeFeasible();
    const maximum = maximizeTerm(solver, column, true);
    if (!solver.hasIntVar() || !solver.hasInfInt()) return maximum;
    solver.restoreX();
    return { status: LP_FEASIBLE, value: maximum.value };
  }

  private mkGt(thVar: number, value: Impq) {
    const manager = this.manager;
    const term = this.getExpr(thVar);
    if (manager.isInt(term)) {
      const bound = value.x.isInt() ? value.x.add(Rational.one) : value.x.ceil();
      return manager.mkApp(OP_GE, [term, manager.mkNumeralOfSort(bound, SORT_INT)], SORT_BOOL);
    }
    const bound = manager.mkNumeralOfSort(value.x, SORT_REAL);
    return manager.mkApp(value.y.isNegative() ? OP_GE : OP_GT, [term, bound], SORT_BOOL);
  }

  // The objective as a sum over the variables of its term, so the bound reads as the objective.
  private mkObjective(thVar: number) {
    const column = this.solver.externalToLocalColumn(thVar);
    const term = this.getExpr(thVar);
    if (!this.solver.hasTerm(column)) return term;
    return this.coeffsToApp(
      this.getTermCoeffs(this.solver.getTerm(column)),
      this.manager.isInt(term),
    );
  }

  mkGe(thVar: number, bound: InfEps) {
    const manager = this.manager;
    if (bound.epsilon.isNegative())
      throw new SmtUnsupportedError("a lower bound below an objective's strict supremum");
    const isStrict = bound.epsilon.isPositive();
    const isInt = manager.isInt(this.getExpr(thVar));
    const numeral = manager.mkNumeralOfSort(bound.value, isInt ? SORT_INT : SORT_REAL);
    const atom = manager.mkApp(
      isStrict ? OP_LE : OP_GE,
      [this.mkObjective(thVar), numeral],
      SORT_BOOL,
    );
    this.mkObjectiveBound(atom, thVar, !isStrict, bound.value);
    return isStrict ? manager.mkNot(atom) : atom;
  }

  pushScopeEh() {
    this.scopes.push({
      boundsLimit: this.boundsTrail.length,
      assertedQhead: this.assertedQhead,
      assertedAtomsLimit: this.assertedAtoms.length,
      numVars: this.getNumVars(),
    });
    this.solver.push();
    this.nla?.push();
  }

  popScopeEh(numScopes = 1) {
    if (numScopes === 0) return;
    const oldSize = this.scopes.length - numScopes;
    const scope = this.scopes[oldSize];
    for (let index = this.boundsTrail.length; index-- > scope.boundsLimit;)
      this.bounds[this.boundsTrail[index]].pop();
    shrink(this.boundsTrail, scope.boundsLimit);
    shrink(this.assertedAtoms, scope.assertedAtomsLimit);
    this.assertedQhead = scope.assertedQhead;
    shrink(this.scopes, oldSize);
    this.solver.pop(numScopes);
    const numConstraints = this.solver.constraints.constraints.length;
    if (this.constraintSources.length > numConstraints)
      shrink(this.constraintSources, numConstraints);
    this.newBounds = [];
    this.nla?.pop(numScopes);
    shrink(this.varEnodes, scope.numVars);
  }

  restartEh() {
    const pairs = this.restartPairs;
    this.restartPairs = [];
    for (const pair of pairs) {
      if (this.context.isInconsistent()) break;
      this.mkEqAxioms(pair[0], pair[1]);
    }
  }

  initSearchEh() {
    this.numConflicts = 0;
    this.restartPairs = [];
  }
}
