// Ported from Z3 (src/model/model_evaluator.cpp), MIT license, see z3-license.txt. Evaluates an
// expression in a model: uninterpreted symbols take their interpretations and the rewriter folds
// the interpreted operators. With model completion, a symbol without an interpretation gets some
// value, so a ground expression always evaluates to a value.
import { FAMILY_USER, KIND_QUANTIFIER, KIND_VAR, type AstManager } from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import type { ProtoModel } from "./proto-model";
import { FuncInterp } from "./proto-model";
import { Rewriter } from "./rewriter";

// An expression whose children visit is evaluating: the cache and bindings it is evaluated with,
// where its children's results start on the result stack, and the next child to visit.
interface EvalFrame {
  expr: number;
  cache: Map<number, number>;
  bindings: number[];
  start: number;
  next: number;
}

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
  // bindings is not empty, as when a macro is expanded. Like Z3's rewriter_tpl, it keeps its own
  // stack, so deep terms do not exhaust the call stack.
  private visit(expr: number, cache: Map<number, number>, bindings: number[]) {
    const manager = this.manager;
    const frames: EvalFrame[] = [];
    const results: number[] = [];
    const enter = (
      current: number,
      currentCache: Map<number, number>,
      currentBindings: number[],
    ) => {
      const cached = currentCache.get(current);
      if (cached !== undefined) results.push(cached);
      else if (manager.kinds[current] === KIND_VAR) {
        const index = manager.values[current];
        const result = index < currentBindings.length ? currentBindings[index] : current;
        currentCache.set(current, result);
        results.push(result);
      } else if (
        manager.kinds[current] === KIND_QUANTIFIER ||
        manager.args[current].length > 0 ||
        manager.isUninterpreted(current)
      )
        frames.push({
          expr: current,
          cache: currentCache,
          bindings: currentBindings,
          start: results.length,
          next: 0,
        });
      else {
        currentCache.set(current, current);
        results.push(current);
      }
    };
    enter(expr, cache, bindings);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      const current = frame.expr;
      // A quantifier's body is evaluated on its own, without the bindings.
      const children =
        manager.kinds[current] === KIND_QUANTIFIER
          ? [manager.getQuantifier(current).body]
          : manager.args[current];
      if (frame.next < children.length) {
        const isBody = manager.kinds[current] === KIND_QUANTIFIER;
        enter(
          children[frame.next++],
          isBody ? new Map() : frame.cache,
          isBody ? [] : frame.bindings,
        );
        continue;
      }
      const evaluated = results.splice(frame.start);
      const result =
        manager.kinds[current] === KIND_QUANTIFIER
          ? manager.mkQuantifier({ ...manager.getQuantifier(current), body: evaluated[0] })
          : this.mkApp(manager.decls[current], evaluated, manager.sorts[current]);
      frames.pop();
      frame.cache.set(current, result);
      results.push(result);
    }
    return results[0];
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
