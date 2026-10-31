// Ported from Z3 (src/model/model_evaluator.cpp), MIT license, see z3-license.txt. Evaluates an
// expression in a model: uninterpreted symbols take their interpretations and the rewriter folds
// the interpreted operators. With model completion, a symbol without an interpretation gets some
// value, so a ground expression always evaluates to a value.
import {
  FAMILY_ARITH,
  FAMILY_USER,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_DIV,
  OP_DIV0,
  OP_IDIV,
  OP_IDIV0,
  OP_ITE,
  OP_MOD,
  OP_MOD0,
  type AstManager,
} from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import type { ProtoModel } from "./proto-model";
import { FuncInterp } from "./proto-model";
import { Rational } from "./rational";
import { Rewriter } from "./rewriter";
import { substitute } from "./var-subst";

// The division by zero that a division stands for when its divisor is zero.
const BY_ZERO_OPS = new Map([
  [OP_DIV, OP_DIV0],
  [OP_IDIV, OP_IDIV0],
  [OP_MOD, OP_MOD0],
]);

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
    if (family !== FAMILY_USER) {
      const result = this.rewriter.mkAppCore(decl, args, sort);
      const isFailed =
        manager.decls[result] === decl &&
        manager.args[result].every((arg, index) => arg === args[index]);
      return (
        (isFailed && family === FAMILY_ARITH
          ? this.evaluatePartialTheoryFunc(decl, args, sort)
          : undefined) ?? result
      );
    }
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

  // evaluate_partial_theory_func: div0, idiv0 and mod0 take their interpretations, or 0 without
  // one, and so does a division by zero. A division by a term is its interpretation when the term
  // is zero.
  private evaluatePartialTheoryFunc(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const model = this.model;
    const op = manager.funcDecls[decl].op;
    const byZero = BY_ZERO_OPS.get(op);
    const isByZeroOp = op === OP_DIV0 || op === OP_IDIV0 || op === OP_MOD0;
    let interp = model.funcInterps.get(decl);
    if (interp === undefined && byZero !== undefined && !manager.isNumeral(args[1])) {
      const definition = model.funcInterps.get(byZero)?.getInterp();
      if (definition === undefined || definition === null) return undefined;
      const zero = manager.mkNumeralOfSort(Rational.zero, manager.sorts[args[1]]);
      return manager.mkApp(
        OP_ITE,
        [
          manager.mkEq(zero, args[1]),
          substitute(manager, definition, [...args].reverse()),
          manager.mkApp(decl, args, sort),
        ],
        sort,
      );
    }
    if (interp === undefined) {
      const isByZero = byZero !== undefined && manager.getRationalValue(args[1]).isZero();
      if (!isByZeroOp && !isByZero) return undefined;
      interp = isByZero ? model.funcInterps.get(byZero) : undefined;
      if (interp === undefined) return manager.mkNumeralOfSort(Rational.zero, sort);
    }
    if (interp.isPartial()) interp.setElse(model.getSomeValue(sort));
    const definition = interp.getInterp();
    return definition === null ? undefined : this.visit(definition, new Map(), args);
  }
}
