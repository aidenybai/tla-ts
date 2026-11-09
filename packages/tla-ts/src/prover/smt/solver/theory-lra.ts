// Ported from Z3 (src/smt/theory_lra.cpp, src/smt/arith_eq_adapter.cpp, src/math/lp/lp_api.h), MIT
// license, see z3-license.txt. This class adds the scopes to the chain that theory-lra-state.ts
// starts.
import { shrink } from "./array";
import type { Enode } from "./enode";
import { NULL_LPVAR } from "./lp/lar-solver";
import type { Rational } from "./rational";
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
