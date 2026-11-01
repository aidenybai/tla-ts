// Ported from Z3 (src/smt/theory_lra.cpp, src/smt/arith_eq_adapter.cpp, src/math/lp/lp_api.h), MIT
// license, see z3-license.txt. Linear integer and real arithmetic, as the theory_lra solver that
// Z3's default configuration uses for UFNIA. Terms become columns of the lp solver, integer or not
// by their sort, atoms become bounds on them, propagation makes the tableau feasible and propagates
// implied bounds and equalities, and the final check runs the integer solver and assumes equalities
// between shared terms with equal values. Nonlinear products and divisions go to nla
// (src/math/lp/nla_core.cpp), which refines the model with lemmas, and runs nlsat on what they
// leave open. This class adds the scopes to the chain of classes that theory-lra-state.ts starts.
import { shrink } from "./array";
import { TheoryLraFinalCheck } from "./theory-lra-final-check";

export class TheoryLra extends TheoryLraFinalCheck {
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
