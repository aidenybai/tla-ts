import {
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_AND,
  OP_OR,
  QUANTIFIER_EXISTS,
  SORT_BOOL,
} from "../ast";
import { L_FALSE, L_TRUE } from "../lbool";
import { FuncInterp, type ProtoModel } from "../proto-model";
import { VarSubst } from "../var-subst";
import type { DatalogContext } from "./dl-context";
import { getUsedVars, type Rule } from "./dl-rule";

export class HornSubsumeModelConverter {
  private delayHeads: number[] = [];
  private delayBodies: number[] = [];
  private funcs: number[] = [];
  private bodies: number[] = [];

  constructor(private context: DatalogContext) {}

  insert(head: number, body: readonly number[]) {
    const manager = this.context.manager;
    const conjunction = this.context.rewriter.mkAnd([...body]);
    manager.incRef(head);
    manager.incRef(conjunction);
    this.delayHeads.push(head);
    this.delayBodies.push(conjunction);
  }

  // The predicate of the head is the body with the head's arguments as the variables above the
  // existentially bound ones. The result comes with a reference.
  mkHorn(head: number, body: number) {
    const manager = this.context.manager;
    const args = manager.getArgs(head);
    const sorts = getUsedVars(manager, [head, body]).map((sort) => sort ?? SORT_BOOL);
    if (args.length === 0 && sorts.length === 0) {
      manager.incRef(body);
      return body;
    }
    const conjs = [body];
    const subst: number[] = [];
    args.forEach((arg, index) => {
      const variable = manager.mkVar(sorts.length + index, manager.sorts[arg]);
      if (manager.kinds[arg] !== KIND_VAR) {
        conjs.push(manager.mkEq(variable, arg));
        return;
      }
      const argIndex = manager.values[arg];
      while (subst.length <= argIndex) subst.push(-1);
      if (subst[argIndex] === -1) subst[argIndex] = variable;
      else conjs.push(manager.mkEq(variable, subst[argIndex]));
    });
    const conjunction = manager.mkApp(OP_AND, conjs, SORT_BOOL);
    manager.incRef(conjunction);
    const varSubst = new VarSubst(manager, false);
    const substituted = varSubst.apply(conjunction, subst);
    varSubst.release();
    manager.decRef(conjunction);
    if (sorts.length === 0) return substituted;
    const quantified = manager.mkQuantifier({
      kind: QUANTIFIER_EXISTS,
      sorts: sorts.reverse(),
      names: sorts.map((_value, index) => sorts.length - index - 1),
      body: substituted,
      patterns: [],
      noPatterns: [],
      weight: 0,
      qid: "",
    });
    manager.incRef(quantified);
    manager.decRef(substituted);
    const result = this.context.simplify(quantified);
    manager.decRef(quantified);
    return result;
  }

  // add_default_proc under for_each_expr: the predicates the model leaves open are false.
  private addDefaultFalseInterpretation(root: number, model: ProtoModel) {
    const manager = this.context.manager;
    const visited = new Set<number>([root]);
    const exprs = [root];
    const positions = [0];
    while (exprs.length > 0) {
      const current = exprs[exprs.length - 1];
      const quantifier =
        manager.kinds[current] === KIND_QUANTIFIER ? manager.getQuantifier(current) : undefined;
      const children =
        quantifier !== undefined
          ? [quantifier.body, ...quantifier.patterns, ...quantifier.noPatterns]
          : manager.kinds[current] === KIND_APP
            ? manager.getArgs(current)
            : [];
      const position = positions[positions.length - 1];
      if (position < children.length) {
        positions[positions.length - 1]++;
        const child = children[position];
        if (visited.has(child)) continue;
        visited.add(child);
        exprs.push(child);
        positions.push(0);
        continue;
      }
      exprs.pop();
      positions.pop();
      if (manager.kinds[current] !== KIND_APP || manager.sorts[current] !== SORT_BOOL) continue;
      const decl = manager.decls[current];
      const info = manager.funcDecls[decl];
      if (
        info.family !== FAMILY_USER ||
        model.constInterps.has(decl) ||
        model.funcInterps.has(decl)
      )
        continue;
      if (info.domain.length === 0) {
        model.registerConst(decl, manager.falseExpr);
        continue;
      }
      const interp = new FuncInterp(manager, info.domain.length);
      interp.setElse(manager.falseExpr);
      model.registerFunc(decl, interp);
    }
  }

  apply(model: ProtoModel) {
    const manager = this.context.manager;
    this.delayHeads.forEach((head, index) => {
      this.funcs.push(manager.decls[head]);
      this.bodies.push(this.mkHorn(head, this.delayBodies[index]));
    });
    this.delayHeads = [];
    this.delayBodies = [];
    for (let index = this.funcs.length - 1; index >= 0; index--) {
      const decl = this.funcs[index];
      this.addDefaultFalseInterpretation(this.bodies[index], model);
      const body = model.eval(this.bodies[index], false);
      if (manager.funcDecls[decl].domain.length === 0) {
        const old = model.constInterps.get(decl);
        const merged = old === undefined ? body : manager.mkApp(OP_OR, [old, body], SORT_BOOL);
        const simplified = this.context.simplify(merged);
        model.registerConst(decl, simplified);
        manager.decRef(simplified);
        manager.decRef(body);
        continue;
      }
      const old = model.funcInterps.get(decl);
      const interp = old ?? new FuncInterp(manager, manager.funcDecls[decl].domain.length);
      if (old === undefined) model.registerFunc(decl, interp);
      const oldElse = old === undefined ? null : old.elseExpr;
      const merged = oldElse === null ? body : manager.mkApp(OP_OR, [oldElse, body], SORT_BOOL);
      const simplified = this.context.simplify(merged);
      interp.setElse(simplified);
      manager.decRef(simplified);
      manager.decRef(body);
    }
    return model;
  }

  // del_rule of dl_util.cpp.
  delRule(rule: Rule, unreachable: number) {
    const manager = this.context.manager;
    this.insert(
      rule.head,
      unreachable === L_TRUE
        ? [manager.trueExpr]
        : unreachable === L_FALSE
          ? [manager.falseExpr]
          : rule.tail.map((literal, index) =>
              rule.isNegated[index] ? manager.mkNot(literal) : literal,
            ),
    );
  }
}
