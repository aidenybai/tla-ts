// Ported from Z3 (src/model/model_evaluator.cpp), MIT license, see z3-license.txt. Evaluates an
// expression in a model with rewriter_tpl and evaluator_cfg: uninterpreted symbols take their
// interpretations, the interpretation of a function is expanded like a macro, and the rewriters fold
// the interpreted operators. With model completion, a symbol without an interpretation gets some
// value, so a ground expression always evaluates to a value. The cache persists between evaluations
// until the model completion flag changes.
import {
  FAMILY_ARITH,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_AND,
  OP_DIV,
  OP_DIV0,
  OP_EQ,
  OP_IDIV,
  OP_IDIV0,
  OP_ITE,
  OP_LE,
  OP_MOD,
  OP_MOD0,
  SORT_BOOL,
} from "./ast";
import type { AstManager } from "./ast";
import { FuncInterp } from "./proto-model";
import type { ProtoModel } from "./proto-model";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";
import type { Rewrite } from "./rewriter-tpl";
import { Rational } from "./rational";
import { VarSubst } from "./var-subst";

// The division by zero that a division stands for when its divisor is zero.
const BY_ZERO_OPS = new Map([
  [OP_DIV, OP_DIV0],
  [OP_IDIV, OP_IDIV0],
  [OP_MOD, OP_MOD0],
]);

// A th_rewriter with the default parameters.
export class ModelEvaluator extends RewriterTpl {
  // m_b_rw and m_a_rw, whose reductions evaluator_cfg applies.
  private rewriter: Rewriter;
  private isModelCompletion = false;

  constructor(
    manager: AstManager,
    private model: ProtoModel,
  ) {
    super(manager);
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    this.rewriter.releaseResult = () => this.setLastResult(-1);
  }

  // set_model_completion: the cache is reset when the flag changes.
  setModelCompletion(isModelCompletion: boolean) {
    if (this.isModelCompletion === isModelCompletion) return;
    this.reset();
    this.isModelCompletion = isModelCompletion;
  }

  mkNested() {
    const nested = new ModelEvaluator(this.manager, this.model);
    nested.isModelCompletion = this.isModelCompletion;
    return nested;
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    const outer = manager.beginTemporaries();
    const result = this.reduceAppCore(decl, args, sort);
    if (result !== -1) manager.incRef(typeof result === "number" ? result : result.expr);
    manager.endTemporaries(outer);
    return result;
  }

  // evaluator_cfg::reduce_app_core. -1 is BR_FAILED.
  private reduceAppCore(decl: number, args: number[], sort: number): number | Rewrite {
    const manager = this.manager;
    const model = this.model;
    const family = manager.funcDecls[decl].family;
    if (family === FAMILY_USER) {
      if (args.length > 0) {
        const result = this.evaluate(decl, args);
        return result === undefined ? -1 : { expr: result, depth: 1 };
      }
      const value = model.constInterps.get(decl);
      if (value !== undefined)
        return this.containsRedex(value) ? { expr: value, depth: Infinity } : value;
      if (!this.isModelCompletion) return -1;
      const some = model.getSomeValue(sort);
      model.registerConst(decl, some);
      return some;
    }
    if (manager.funcDecls[decl].op === OP_AND) {
      const reduced = this.mkArithAndCore(args);
      if (reduced !== undefined) return reduced;
    }
    const rewritten = this.rewriter.reduceAppCore(decl, args);
    const reduced =
      rewritten === -1 && family === FAMILY_ARITH
        ? this.evaluatePartialTheoryFunc(decl, args, sort)
        : rewritten;
    if (
      family !== FAMILY_ARITH ||
      typeof reduced !== "number" ||
      reduced === -1 ||
      manager.kinds[reduced] !== KIND_APP
    )
      return reduced;
    const result = this.evaluate(manager.decls[reduced], manager.args[reduced]);
    return result === undefined ? reduced : { expr: result, depth: 1 };
  }

  // evaluate and eval_fi: the result of the entry for the arguments when they are values. Otherwise
  // get_macro expands the interpretation.
  private evaluate(decl: number, args: number[]) {
    const manager = this.manager;
    const interp = this.model.funcInterps.get(decl);
    if (
      interp === undefined ||
      interp.entries.length === 0 ||
      !args.every((arg) => manager.isUniqueValue(arg))
    )
      return undefined;
    return interp.getEntry(args)?.result;
  }

  // evaluate_partial_theory_func: div0, idiv0 and mod0 take their interpretations, or 0 without
  // one, and so does a division by zero. A division by a term is its interpretation when the term
  // is zero.
  private evaluatePartialTheoryFunc(decl: number, args: number[], sort: number): number | Rewrite {
    const manager = this.manager;
    const model = this.model;
    const op = manager.funcDecls[decl].op;
    const byZero = BY_ZERO_OPS.get(op);
    let interp = model.funcInterps.get(decl);
    if (interp === undefined && byZero !== undefined && !manager.isNumeral(args[1])) {
      const definition = model.funcInterps.get(byZero)?.getInterp();
      if (definition === undefined || definition === null) return -1;
      const result = this.substitute(definition, args);
      const zero = manager.mkNumeralOfSort(Rational.zero, manager.sorts[args[1]]);
      return manager.mkApp(
        OP_ITE,
        [manager.mkEq(zero, args[1]), result, manager.mkApp(decl, args, sort)],
        sort,
      );
    }
    if (interp === undefined) {
      const isByZero = byZero !== undefined && manager.getRationalValue(args[1]).isZero();
      if (!isByZero && op !== OP_DIV0 && op !== OP_IDIV0 && op !== OP_MOD0) return -1;
      interp = isByZero ? model.funcInterps.get(byZero) : undefined;
      if (interp === undefined) return manager.mkNumeralOfSort(Rational.zero, sort);
    }
    if (interp.isPartial()) interp.setElse(model.getSomeValue(sort));
    return { expr: this.substitute(interp.getInterp() as number, args), depth: Infinity };
  }

  // var_subst without the standard order, whose result the temporaries hold.
  private substitute(expr: number, args: number[]) {
    const subst = new VarSubst(this.manager, false);
    const result = subst.apply(expr, args);
    subst.release();
    this.manager.releaseLater(result);
    return result;
  }

  // contains_redex: whether a constant's value has an equality to evaluate.
  private containsRedex(expr: number) {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_APP || manager.args[expr].length === 0) return false;
    const visited = new Set<number>();
    const todo = [expr];
    while (todo.length > 0) {
      const current = todo.pop() as number;
      if (visited.has(current)) continue;
      visited.add(current);
      if (manager.getOp(current) === OP_EQ) return true;
      if (manager.kinds[current] === KIND_APP) todo.push(...manager.args[current]);
      else if (manager.kinds[current] === KIND_QUANTIFIER) {
        const data = manager.getQuantifier(current);
        todo.push(data.body, ...data.patterns);
      }
    }
    return false;
  }

  // arith_rewriter::mk_and_core: of lower bounds (<= a y) and (<= b y) on the same term, the
  // conjunction keeps the greatest. Z3 compares each bound with the first rather than with the
  // greatest so far, which drops the greatest when a smaller one follows it. This port keeps the
  // greatest.
  private mkArithAndCore(args: number[]): Rewrite | undefined {
    const manager = this.manager;
    if (args.length <= 1 || manager.getOp(args[0]) !== OP_LE) return undefined;
    const [lower, term] = manager.args[args[0]];
    if (!manager.isNumeral(lower)) return undefined;
    let bound = args[0];
    const rest: number[] = [];
    for (const arg of args.slice(1)) {
      const isBound =
        manager.getOp(arg) === OP_LE &&
        manager.args[arg][1] === term &&
        manager.isNumeral(manager.args[arg][0]);
      if (!isBound) rest.push(arg);
      else if (
        manager
          .getRationalValue(manager.args[arg][0])
          .compare(manager.getRationalValue(manager.args[bound][0])) > 0
      )
        bound = arg;
    }
    if (rest.length === args.length - 1) return undefined;
    rest.push(bound);
    return { expr: manager.mkApp(OP_AND, rest, SORT_BOOL), depth: 1 };
  }

  // get_macro: the interpretation of an uninterpreted function. With model completion, a partial
  // interpretation gets an else value, and a function without one gets a constant interpretation.
  getMacro(decl: number) {
    const manager = this.manager;
    const model = this.model;
    const info = manager.funcDecls[decl];
    const interp = model.funcInterps.get(decl);
    if (interp !== undefined) {
      if (interp.isPartial()) {
        if (!this.isModelCompletion) return -1;
        interp.setElse(model.getSomeValue(info.range));
      }
      return interp.getInterp() as number;
    }
    if (!this.isModelCompletion || info.family !== FAMILY_USER) return -1;
    const some = model.getSomeValue(info.range);
    const created = new FuncInterp(manager, info.domain.length);
    created.setElse(some);
    model.registerFunc(decl, created);
    return some;
  }

  isReducingMacro() {
    return true;
  }

  // evaluator_cfg::reduce_quantifier: a th_rewriter of its own reduces the quantifier.
  reduceQuantifier(expr: number, body: number, patterns: number[]) {
    const rewriter = new Rewriter(this.manager, TACTIC_REWRITER_OPTIONS);
    const result = rewriter.reduceQuantifier(expr, body, patterns);
    rewriter.release();
    return result;
  }

  // ~imp: evaluator_cfg goes before the caches of rewriter_tpl.
  release() {
    this.rewriter.release();
    super.release();
  }
}
