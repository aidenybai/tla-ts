// Ported from Z3 (src/model/model_evaluator.cpp), MIT license, see z3-license.txt. Evaluates an
// expression in a model: uninterpreted symbols take their interpretations and the rewriter folds
// the interpreted operators. With model completion, a symbol without an interpretation gets some
// value, so a ground expression always evaluates to a value.
import { FAMILY_USER, KIND_QUANTIFIER, KIND_VAR, type AstManager } from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import type { ProtoModel } from "./proto-model";
import { FuncInterp } from "./proto-model";
import { Rewriter } from "./rewriter";

export class ModelEvaluator {
  private rewriter: Rewriter;
  private isModelCompletion = false;

  constructor(
    private manager: AstManager,
    private model: ProtoModel,
  ) {
    this.rewriter = new Rewriter(manager, {
      isEliminatingAnd: false,
      arith: TACTIC_ARITH_OPTIONS,
      isRewritingPatterns: false,
    });
  }

  evaluate(expr: number, isModelCompletion: boolean) {
    this.isModelCompletion = isModelCompletion;
    return this.visit(expr, new Map(), []);
  }

  // Rewrites expr, where the variable (:var i) below the binders stands for bindings[i] when
  // bindings is not empty, as when a macro is expanded.
  private visit(expr: number, cache: Map<number, number>, bindings: number[]): number {
    const cached = cache.get(expr);
    if (cached !== undefined) return cached;
    const manager = this.manager;
    const kind = manager.kinds[expr];
    let result = expr;
    if (kind === KIND_VAR) {
      const index = manager.values[expr];
      result = index < bindings.length ? bindings[index] : expr;
    } else if (kind === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(expr);
      result = manager.mkQuantifier({ ...data, body: this.visit(data.body, new Map(), []) });
    } else if (manager.args[expr].length > 0 || manager.isUninterpreted(expr))
      result = this.mkApp(
        manager.decls[expr],
        manager.args[expr].map((arg) => this.visit(arg, cache, bindings)),
        manager.sorts[expr],
      );
    cache.set(expr, result);
    return result;
  }

  // evaluator_cfg::reduce_app on arguments that are already evaluated.
  mkApp(decl: number, args: number[], sort: number): number {
    const manager = this.manager;
    const model = this.model;
    const family = manager.funcDecls[decl].family;
    if (family !== FAMILY_USER) return this.rewriter.mkAppCore(decl, args, sort);
    if (args.length === 0) {
      const value = model.constInterps.get(decl);
      if (value !== undefined)
        return manager.isUniqueValue(value) ? value : this.evaluate(value, this.isModelCompletion);
      if (!this.isModelCompletion) return manager.mkApp(decl, args, sort);
      const some = model.getSomeValue(sort);
      model.registerConst(decl, some);
      return some;
    }
    const interp = model.funcInterps.get(decl);
    if (
      interp !== undefined &&
      interp.entries.length > 0 &&
      args.every((arg) => manager.isUniqueValue(arg))
    ) {
      const entry = interp.getEntry(args);
      if (entry !== undefined) return entry.result;
    }
    // get_macro: the interpretation, instantiated with the arguments.
    if (interp !== undefined) {
      if (interp.isPartial()) {
        if (!this.isModelCompletion) return manager.mkApp(decl, args, sort);
        interp.setElse(model.getSomeValue(sort));
      }
      const definition = interp.getInterp();
      if (definition === null) return manager.mkApp(decl, args, sort);
      return this.visit(definition, new Map(), args);
    }
    if (!this.isModelCompletion) return manager.mkApp(decl, args, sort);
    const some = model.getSomeValue(sort);
    const created = new FuncInterp(manager, args.length);
    created.setElse(some);
    model.registerFunc(decl, created);
    return some;
  }
}
