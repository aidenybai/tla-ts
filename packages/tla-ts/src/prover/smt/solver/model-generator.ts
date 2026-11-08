// Ported from Z3 (src/smt/smt_model_generator.cpp), MIT license, see z3-license.txt.
import { FAMILY_BASIC, FAMILY_USER, type FuncDecl, SORT_BOOL } from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import { FuncInterp, ProtoModel } from "./proto-model";

export interface GeneratedModel {
  model: ProtoModel;
  root2value: Map<Enode, number>;
}

// include_func_interp: the model interprets uninterpreted functions, the decls that their theory
// asks for, such as theory_lra's divisions by zero, and the decls of a family without a theory, such
// as model values, which stand for themselves.
const isIncludedFuncInterp = (context: Context, decl: FuncDecl) => {
  if (decl.family === FAMILY_USER) return true;
  if (decl.family === FAMILY_BASIC) return false;
  return context.getTheory(decl.family)?.includeFuncInterp(decl) ?? true;
};

export const mkModel = (context: Context): GeneratedModel => {
  const manager = context.manager;
  const model = new ProtoModel(manager);
  for (const theory of context.theories) theory.initModel(model);
  for (const node of context.enodes)
    if (node.root === node && context.isRelevant(node.owner) && manager.isModelValue(node.owner))
      model.registerValue(node.owner);
  for (let boolVar = 0; boolVar < context.numBoolVars; boolVar++) {
    const expr = context.boolVar2Expr[boolVar];
    if (manager.isUninterpretedConst(expr) && context.isRelevant(expr))
      model.registerConst(
        manager.decls[expr],
        context.findAssignment(expr) > 0 ? manager.trueExpr : manager.falseExpr,
      );
  }
  // mk_values: the values of the classes of a theory's sort that the theory does not know are
  // fresh, so they come after all the other values. Like Z3, that includes the class of a numeral
  // without a theory variable, such as a coefficient.
  const root2value = new Map<Enode, number>();
  const freshRoots: Enode[] = [];
  for (const node of context.enodes) {
    if (node.root !== node) continue;
    const expr = node.owner;
    if (!context.isRelevant(expr) && !manager.isUniqueValue(expr)) continue;
    const sort = manager.sorts[expr];
    const theory = context.getTheory(manager.getSortFamily(sort));
    if (sort === SORT_BOOL)
      root2value.set(node, context.findAssignment(expr) > 0 ? manager.trueExpr : manager.falseExpr);
    else if (manager.isModelValue(expr)) root2value.set(node, expr);
    else if (theory !== undefined && theory.buildModels()) {
      const value = node.getThVar(theory.id) < 0 ? undefined : theory.mkValue(node);
      if (value === undefined) freshRoots.push(node);
      else root2value.set(node, value);
    } else root2value.set(node, model.getFreshValue(sort) ?? model.getSomeValue(sort));
  }
  for (const value of root2value.values()) model.registerValue(value);
  for (const node of freshRoots) {
    const sort = manager.sorts[node.owner];
    root2value.set(node, model.getFreshValue(sort) ?? model.getSomeValue(sort));
  }
  const getValue = (node: Enode) =>
    root2value.get(node.root) ?? model.getSomeValue(manager.sorts[node.owner]);
  for (const node of context.enodes)
    if (manager.isUninterpretedConst(node.owner) && context.isRelevant(node.owner))
      model.registerConst(manager.decls[node.owner], getValue(node));
  for (const node of context.enodes) {
    const expr = node.owner;
    if (!context.isRelevant(expr) || !isIncludedFuncInterp(context, manager.funcDecls[node.decl]))
      continue;
    if (node.numArgs === 0) {
      model.registerConst(node.decl, getValue(node));
      continue;
    }
    if (node.cg !== node) continue;
    let interp = model.funcInterps.get(node.decl);
    if (interp === undefined) {
      interp = new FuncInterp(manager, node.numArgs);
      model.registerFunc(node.decl, interp);
    }
    const args = Array.from({ length: node.numArgs }, (_, index) => getValue(node.getArg(index)));
    if (interp.getEntry(args) === undefined) interp.insertNewEntry(args, getValue(node));
  }
  return { model, root2value };
};
