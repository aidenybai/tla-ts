// Ported from Z3 (src/smt/smt_model_finder.cpp), MIT license, see z3-license.txt. Completes the
// model of the ground formulas so that it may satisfy the universal quantifiers, following
// "Complete instantiation for quantified SMT formulas": the quantifier analyzer collects how the
// variables occur, and the AUF solver gives each group of argument positions and variables a
// projection function onto its instantiation set.
import type { AstManager } from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import type { Context } from "./context";
import { L_TRUE } from "./lbool";
import { solveMacros } from "./model-macro-solver";
import type { ProtoModel } from "./proto-model";
import { Rewriter } from "./rewriter";
import { AufSolver } from "./auf-solver";
import { MBQI_FORCE_TEMPLATE, QuantifierAnalyzer, QuantifierInfo } from "./quantifier-analyzer";

export class ModelFinder {
  private q2info = new Map<number, QuantifierInfo>();
  private quantifiers: number[] = [];
  private scopes: number[] = [];
  private rewriter: Rewriter;
  readonly aufSolver: AufSolver;
  private newConstraints: number[] = [];

  constructor(
    private manager: AstManager,
    private context: Context,
  ) {
    this.rewriter = new Rewriter(manager, {
      isEliminatingAnd: false,
      arith: TACTIC_ARITH_OPTIONS,
      isRewritingPatterns: false,
    });
    this.aufSolver = new AufSolver(manager, this.rewriter);
  }

  getQuantifierInfo(quantifier: number) {
    return this.q2info.get(quantifier) ?? this.registerQuantifier(quantifier);
  }

  registerQuantifier(quantifier: number) {
    const info = new QuantifierInfo(this.manager, this.context, quantifier);
    this.q2info.set(quantifier, info);
    this.quantifiers.push(quantifier);
    new QuantifierAnalyzer(this.manager, this.rewriter, info).analyze();
    return info;
  }

  pushScope() {
    this.scopes.push(this.quantifiers.length);
  }

  popScope(numScopes: number) {
    const limit = this.scopes[this.scopes.length - numScopes];
    for (let index = limit; index < this.quantifiers.length; index++)
      this.q2info.delete(this.quantifiers[index]);
    this.quantifiers.length = limit;
    this.scopes.length -= numScopes;
  }

  // fix_model: tries to satisfy the relevant quantifiers by changing the model while keeping the
  // ground formulas satisfied.
  fixModel(model: ProtoModel) {
    const context = this.context;
    if (this.quantifiers.length === 0) return;
    const quantifiers = this.quantifiers.filter(
      (quantifier) =>
        context.isRelevant(quantifier) &&
        context.getAssignment(context.getLiteral(quantifier)) === L_TRUE,
    );
    if (quantifiers.length === 0) return;
    for (const quantifier of quantifiers) this.getQuantifierInfo(quantifier).resetTheOne();
    const residue = solveMacros(
      this.manager,
      model,
      quantifiers,
      (quantifier) => this.getQuantifierInfo(quantifier),
      MBQI_FORCE_TEMPLATE,
    );
    const solver = this.aufSolver;
    solver.reset();
    solver.setModel(model);
    for (const quantifier of residue) this.getQuantifierInfo(quantifier).processAuf(solver);
    solver.mkInstantiationSets();
    for (const quantifier of residue) this.getQuantifierInfo(quantifier).populateInstSets(solver);
    solver.fixModel(this.newConstraints);
  }

  getFlatQuantifier(quantifier: number) {
    return this.getQuantifierInfo(quantifier).flatQ;
  }

  // get_uvar_inst_set: the set of variable index of the quantifier before flattening.
  getUvarInstSet(quantifier: number, index: number) {
    const manager = this.manager;
    const flatQ = this.getFlatQuantifier(quantifier);
    const offset =
      manager.getQuantifier(flatQ).sorts.length - manager.getQuantifier(quantifier).sorts.length;
    const set = this.aufSolver.getUvarInstSet(flatQ, offset + index);
    if (set !== null) return set;
    return this.getQuantifierInfo(quantifier).getMacroBasedInstSet(index, (expr) =>
      this.aufSolver.eval(expr, true),
    );
  }

  // get_inv: a term of the instantiation set whose value is value.
  getInv(quantifier: number, index: number, value: number, model: ProtoModel) {
    const set = this.getUvarInstSet(quantifier, index);
    if (set === null) return null;
    const term = set.getInv(value, model);
    if (term !== undefined && this.aufSolver.isDefaultRepresentative(term))
      return { term: value, generation: 0 };
    return term === undefined ? null : { term, generation: set.getGeneration(term) };
  }

  // restrict_sks_to_inst_set: each Skolem constant must take the value of a term in its set.
  restrictSksToInstSet(quantifier: number, sks: number[], assert: (expr: number) => void) {
    const manager = this.manager;
    const numDecls = manager.getQuantifier(quantifier).sorts.length;
    let isAsserted = false;
    for (let index = 0; index < numDecls; index++) {
      const sk = sks[sks.length - index - 1];
      const set = this.getUvarInstSet(quantifier, index);
      if (set === null || set.inv.size === 0) continue;
      const eqs: number[] = [];
      for (const value of set.inv.keys())
        if (manager.sorts[value] === manager.sorts[sk]) eqs.push(manager.mkEq(sk, value));
      if (eqs.length === 0) continue;
      assert(manager.mkOr(eqs));
      isAsserted = true;
    }
    return isAsserted;
  }

  // restart_eh: the constraints of the last model become axioms.
  restartEh() {
    const context = this.context;
    for (const constraint of this.newConstraints) {
      context.internalize(constraint, true);
      const literal = context.getLiteral(constraint);
      context.markLiteralAsRelevant(literal);
      context.assign(literal, "axiom");
    }
    this.newConstraints = [];
  }
}
