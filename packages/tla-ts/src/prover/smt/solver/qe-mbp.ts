import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_CHAR,
  FAMILY_DATATYPE,
  FAMILY_SEQ,
  KIND_APP,
  OP_CONST_ARRAY,
  OP_DT_CONSTRUCTOR,
  OP_EQ,
  SORT_BOOL,
} from "./ast";
import { mkArrayApp } from "./array-decl-plugin";
import { flattenAndVector, isAppOf } from "./ast-util";
import { getConstructorAccessors } from "./datatype-decl-plugin";
import { ExprSafeReplace } from "./expr-safe-replace";
import { ArithProjectPlugin } from "./mbp/mbp-arith";
import { markRec, MbpContext, ProjectPlugin } from "./mbp/mbp-plugin";
import { MbpQel } from "./mbp/mbp-qel";
import { filterRefVector } from "./mbp/mbp-term-graph";
import { ModelEvaluator } from "./model-evaluator";
import type { ProtoModel } from "./proto-model";
import { applyQel } from "./qel";
import { hasSubterm } from "./recfun-decl-plugin";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";

class AppConstArrRewriter extends RewriterTpl {
  private evaluator: ModelEvaluator;

  constructor(manager: AstManager, model: ProtoModel) {
    super(manager);
    this.evaluator = new ModelEvaluator(manager, model);
  }

  reduceApp(decl: number, args: number[]) {
    const manager = this.manager;
    const funcDecl = manager.funcDecls[decl];
    if (funcDecl.op === OP_CONST_ARRAY && !manager.isValue(args[0])) {
      const value = this.evaluator.rewrite(args[0]);
      const result = mkArrayApp(manager, OP_CONST_ARRAY, [value], [funcDecl.range]);
      manager.incRef(result);
      manager.decRef(value);
      return result;
    }
    if (funcDecl.op !== OP_DT_CONSTRUCTOR) return -1;
    const accessors = getConstructorAccessors(manager, decl);
    for (let index = 0; index < accessors.length; index++)
      if (manager.funcDecls[accessors[index]].domain.length !== 1) return -1;
    if (args.length === 0 || manager.kinds[args[0]] !== KIND_APP) return -1;
    if (manager.decls[args[0]] !== accessors[0]) return -1;
    const term = manager.getArg(args[0], 0);
    for (let index = 1; index < args.length; index++) {
      const arg = args[index];
      if (
        manager.kinds[arg] !== KIND_APP ||
        manager.decls[arg] !== accessors[index] ||
        manager.getArg(arg, 0) !== term
      )
        return -1;
    }
    manager.incRef(term);
    return term;
  }

  release() {
    super.release();
    this.evaluator.release();
  }
}

const hasSortFamily = (manager: AstManager, expr: number, families: readonly number[]) =>
  families.includes(manager.getSortFamily(manager.sorts[expr])) ||
  (manager.kinds[expr] === KIND_APP && families.includes(manager.getFamily(expr)));

export class Mbproj {
  private rewriter: Rewriter;

  constructor(private manager: AstManager) {
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
  }

  release() {
    this.rewriter.release();
  }

  // Projects the variables out of the literals, which hold in the model. With isForceElim, the
  // variables that remain get their values; without, they stay in vars.
  apply(isForceElim: boolean, vars: RefVector, model: ProtoModel, fmls: RefVector) {
    const manager = this.manager;
    const context = new MbpContext(manager, model);
    const isUnsupportedTh = hasSubterm(manager, fmls.items, (expr) =>
      hasSortFamily(manager, expr, [FAMILY_SEQ, FAMILY_CHAR]),
    );
    if (isUnsupportedTh) this.mbp(context, isForceElim, vars, fmls);
    else {
      const formula = context.pin(manager.mkAnd(fmls.items));
      fmls.reset();
      fmls.push(this.spacerQel(context, vars, formula, !isForceElim));
      flattenAndVector(manager, fmls);
    }
    context.release();
  }

  private rewrite(context: MbpContext, expr: number) {
    const result = this.rewriter.rewrite(expr);
    context.pinned.pushOwned(result);
    return result;
  }

  private doQel(context: MbpContext, vars: RefVector, formula: number) {
    const result = applyQel(this.manager, vars, formula);
    context.pinned.pushOwned(result);
    return this.rewrite(context, result);
  }

  // qel_project rewrites the projection while mbp_qel still holds its term graph.
  private qelProject(context: MbpContext, vars: RefVector, formula: number) {
    const projection = new MbpQel(context);
    const result = this.rewrite(context, projection.apply(vars, this.flattenAnd(context, formula)));
    projection.release();
    return result;
  }

  private rewriteAsConstArr(context: MbpContext, formula: number) {
    const rewriter = new AppConstArrRewriter(this.manager, context.model);
    const result = rewriter.rewrite(formula);
    context.pinned.pushOwned(result);
    rewriter.release();
    return result;
  }

  private flattenAnd(context: MbpContext, formula: number) {
    const fmls = new RefVector(this.manager);
    fmls.push(formula);
    flattenAndVector(this.manager, fmls);
    const result = context.pin(this.manager.mkAnd(fmls.items));
    fmls.reset();
    return result;
  }

  private spacerQel(context: MbpContext, vars: RefVector, formula: number, isDontSub: boolean) {
    const manager = this.manager;
    // The term graph's rules for arrays and datatypes, and spacer_qe_lite, are not ported.
    if (
      hasSubterm(manager, [formula], (expr) =>
        hasSortFamily(manager, expr, [FAMILY_ARRAY, FAMILY_DATATYPE]),
      )
    )
      throw new SmtUnsupportedError("model-based projection over arrays or datatypes");
    const origVars = [...vars.items];
    let result = this.doQel(context, vars, formula);
    result = this.qelProject(context, vars, result);
    result = this.flattenAnd(context, result);
    result = this.rewrite(context, result);
    result = this.rewriteAsConstArr(context, result);
    if (context.isFalse(result, true))
      throw new SmtUnsupportedError("model-based projection falling back to qe_lite");
    const otherVars = new RefVector(manager);
    for (const innerVar of vars.items) otherVars.push(innerVar);
    // A variable reported eliminated may still occur after a simplification.
    for (const innerVar of origVars)
      if (
        !vars.items.includes(innerVar) &&
        !otherVars.items.includes(innerVar) &&
        hasSubterm(manager, [result], (expr) => expr === innerVar)
      )
        otherVars.push(innerVar);
    if (otherVars.size > 0) {
      const fmls = new RefVector(manager);
      fmls.push(result);
      flattenAndVector(manager, fmls);
      this.mbp(context, false, otherVars, fmls);
      result = this.rewrite(context, context.pin(manager.mkAnd(fmls.items)));
      fmls.reset();
    }
    if (otherVars.size > 0)
      result = this.rewrite(context, this.projectVars(context, otherVars, result));
    if (!isDontSub && otherVars.size > 0) {
      const subst = new ExprSafeReplace(manager);
      for (const innerVar of otherVars.items) subst.insert(innerVar, context.eval(innerVar, true));
      const substituted = subst.apply(result);
      context.pinned.pushOwned(substituted);
      subst.release();
      result = this.rewrite(context, substituted);
      otherVars.reset();
    }
    vars.reset();
    for (const innerVar of otherVars.items) vars.push(innerVar);
    otherVars.reset();
    return result;
  }

  // Replaces a variable by a term it equals in the model, from an equality of the formula.
  private projectVars(context: MbpContext, vars: RefVector, formula: number) {
    const manager = this.manager;
    let result = formula;
    let kept = 0;
    for (const innerVar of vars.items) {
      const value = context.eval(innerVar, false);
      const terms: number[] = [];
      for (const expr of getPostOrder(manager, result)) {
        if (!isAppOf(manager, expr, OP_EQ)) continue;
        const [first, second] = manager.getArgs(expr);
        if (first === innerVar) terms.push(second);
        else if (second === innerVar) terms.push(first);
      }
      const term = terms.find(
        (candidate) =>
          context.eval(candidate, false) === value &&
          !hasSubterm(manager, [candidate], (expr) => expr === innerVar),
      );
      if (term === undefined) {
        vars.set(kept++, innerVar);
        continue;
      }
      const subst = new ExprSafeReplace(manager);
      subst.insert(innerVar, term);
      result = subst.apply(result);
      context.pinned.pushOwned(result);
      subst.release();
    }
    vars.shrink(kept);
    return result;
  }

  private preprocessSolve(context: MbpContext, vars: RefVector, fmls: RefVector) {
    const manager = this.manager;
    new ProjectPlugin(context).extractLiterals(fmls);
    if (vars.size > 0) {
      const formula = this.doQel(context, vars, context.pin(manager.mkAnd(fmls.items)));
      fmls.reset();
      fmls.push(formula);
      flattenAndVector(manager, fmls);
    }
    // Z3 appends the rewritten conjunction to the literals, and flatten_and drops the duplicates.
    fmls.push(this.rewriteAsConstArr(context, context.pin(manager.mkAnd(fmls.items))));
    flattenAndVector(manager, fmls);
  }

  private projectBools(context: MbpContext, vars: RefVector, fmls: RefVector) {
    const manager = this.manager;
    const subst = new ExprSafeReplace(manager);
    let kept = 0;
    for (const innerVar of vars.items) {
      if (manager.sorts[innerVar] === SORT_BOOL)
        subst.insert(innerVar, context.eval(innerVar, true));
      else vars.set(kept++, innerVar);
    }
    if (kept === vars.size) {
      subst.release();
      return;
    }
    vars.shrink(kept);
    kept = 0;
    for (const formula of fmls.items) {
      const substituted = subst.apply(formula);
      context.pinned.pushOwned(substituted);
      const value = this.rewrite(context, substituted);
      if (!manager.isTrue(value)) fmls.set(kept++, value);
    }
    fmls.shrink(kept);
    subst.release();
  }

  private mbp(context: MbpContext, isForceElim: boolean, vars: RefVector, fmls: RefVector) {
    const manager = this.manager;
    const arith = new ArithProjectPlugin(context);
    this.preprocessSolve(context, vars, fmls);
    const visited = new Set<number>();
    for (const formula of fmls.items) markRec(manager, visited, formula);
    filterRefVector(vars, (innerVar) => visited.has(innerVar));
    this.projectBools(context, vars, fmls);
    let isProgress = true;
    while (isProgress && vars.size > 0 && fmls.size > 0 && manager.limit.inc()) {
      const newVars = new RefVector(manager);
      isProgress = false;
      const remaining = [...vars.items];
      arith.project(remaining, fmls);
      filterRefVector(vars, (innerVar) => remaining.includes(innerVar));
      while (vars.size > 0 && fmls.size > 0 && manager.limit.inc()) {
        const innerVar = vars.items[vars.size - 1];
        manager.incRef(innerVar);
        vars.pop();
        const isArith = manager.getSortFamily(manager.sorts[innerVar]) === FAMILY_ARITH;
        if (isArith && arith.project1(innerVar, fmls)) isProgress = true;
        else newVars.push(innerVar);
        manager.decRef(innerVar);
      }
      if (!isProgress && newVars.size > 0 && fmls.size > 0 && isForceElim && manager.limit.inc()) {
        const innerVar = newVars.items[newVars.size - 1];
        const subst = new ExprSafeReplace(manager);
        subst.insert(innerVar, context.eval(innerVar));
        newVars.pop();
        let kept = 0;
        for (const formula of fmls.items) {
          const substituted = subst.apply(formula);
          context.pinned.pushOwned(substituted);
          const value = this.rewrite(context, substituted);
          if (!manager.isTrue(value)) fmls.set(kept++, value);
        }
        fmls.shrink(kept);
        subst.release();
        isProgress = true;
      }
      if (!manager.limit.inc()) {
        newVars.reset();
        return;
      }
      for (const innerVar of newVars.items) vars.push(innerVar);
      newVars.reset();
      if (isProgress) this.preprocessSolve(context, vars, fmls);
    }
    if (fmls.size === 0) vars.reset();
  }
}

// for_each_expr's order: each subterm after its arguments.
const getPostOrder = (manager: AstManager, root: number) => {
  const order: number[] = [];
  const visited = new Set<number>();
  const todo: { expr: number; isExpanded: boolean }[] = [{ expr: root, isExpanded: false }];
  for (let frame = todo.pop(); frame !== undefined; frame = todo.pop()) {
    if (frame.isExpanded) {
      order.push(frame.expr);
      continue;
    }
    if (visited.has(frame.expr)) continue;
    visited.add(frame.expr);
    todo.push({ expr: frame.expr, isExpanded: true });
    if (manager.kinds[frame.expr] === KIND_APP)
      for (const arg of manager.getArgs(frame.expr).reverse())
        todo.push({ expr: arg, isExpanded: false });
  }
  return order;
};
