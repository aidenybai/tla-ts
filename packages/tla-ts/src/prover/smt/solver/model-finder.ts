// Ported from Z3 (src/smt/smt_model_finder.cpp), MIT license, see z3-license.txt.
import { OP_OR, SORT_BOOL, type AstManager } from "./ast";
import type { Context } from "./context";
import { L_TRUE } from "./lbool";
import { solveMacros } from "./model-macro-solver";
import type { ProtoModel } from "./proto-model";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { AufSolver } from "./auf-solver";
import { MBQI_FORCE_TEMPLATE, QuantifierAnalyzer, QuantifierInfo } from "./quantifier-analyzer";
import { RefVector } from "./ref-vector";
import { shrink } from "./array";

export class ModelFinder {
  private q2info = new Map<number, QuantifierInfo>();
  private quantifiers: number[] = [];
  private scopes: number[] = [];
  private rewriter: Rewriter;
  // macro_util's rewriter stays apart from the one above, so that its last result is never released early.
  private macroRewriter: Rewriter;
  readonly aufSolver: AufSolver;
  private newConstraints: number[] = [];

  constructor(
    private manager: AstManager,
    private context: Context,
  ) {
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    this.macroRewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    this.aufSolver = new AufSolver(manager, this.rewriter);
  }

  getQuantifierInfo(quantifier: number) {
    return this.q2info.get(quantifier) ?? this.registerQuantifier(quantifier);
  }

  registerQuantifier(quantifier: number) {
    const info = new QuantifierInfo(this.manager, this.context, quantifier, this.macroRewriter);
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
    for (let index = limit; index < this.quantifiers.length; index++) {
      this.q2info.get(this.quantifiers[index])?.release();
      this.q2info.delete(this.quantifiers[index]);
    }
    shrink(this.quantifiers, limit);
    shrink(this.scopes, this.scopes.length - numScopes);
  }

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

  getInv(quantifier: number, index: number, value: number, model: ProtoModel) {
    const set = this.getUvarInstSet(quantifier, index);
    if (set === null) return null;
    const term = set.getInv(value, model);
    if (term !== undefined && this.aufSolver.isDefaultRepresentative(term))
      return { term: value, generation: 0 };
    return term === undefined ? null : { term, generation: set.getGeneration(term) };
  }

  restrictSksToInstSet(quantifier: number, sks: number[], assert: (expr: number) => void) {
    const manager = this.manager;
    const numDecls = manager.getQuantifier(quantifier).sorts.length;
    let isAsserted = false;
    for (let index = 0; index < numDecls; index++) {
      const sk = sks[sks.length - index - 1];
      const set = this.getUvarInstSet(quantifier, index);
      if (set === null || set.inv.size === 0) continue;
      const eqs = new RefVector(manager);
      for (const value of set.inv.keys())
        if (manager.sorts[value] === manager.sorts[sk]) eqs.push(manager.mkEq(sk, value));
      if (eqs.size > 0) {
        // ast_manager::mk_or keeps a single disjunct in an or.
        const constraint = manager.mkApp(OP_OR, eqs.items, SORT_BOOL);
        manager.incRef(constraint);
        assert(constraint);
        manager.decRef(constraint);
        isAsserted = true;
      }
      eqs.reset();
    }
    return isAsserted;
  }

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
