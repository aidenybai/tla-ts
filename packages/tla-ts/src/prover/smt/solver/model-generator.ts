// Ported from Z3 (src/smt/smt_model_generator.cpp), MIT license, see z3-license.txt.
import { FAMILY_BASIC, FAMILY_USER, SORT_BOOL } from "./ast";
import type { Context } from "./context";
import { Enode } from "./enode";
import { FuncInterp, ProtoModel } from "./proto-model";
import type { DependentValue } from "./theory";

export interface GeneratedModel {
  model: ProtoModel;
  root2value: Map<Enode, number>;
}

// include_func_interp: the model interprets uninterpreted functions, the decls that their theory
// asks for, such as theory_lra's divisions by zero, and the decls of a family without a theory, such
// as model values, which stand for themselves.
const isIncludedFuncInterp = (context: Context, decl: number) => {
  const family = context.manager.funcDecls[decl].family;
  if (family === FAMILY_USER) return true;
  if (family === FAMILY_BASIC) return false;
  return context.getTheory(family)?.includeFuncInterp(decl) ?? true;
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
  const root2value = new Map<Enode, number>();
  const freshRoots: Enode[] = [];
  const dependentValues = new Map<Enode, DependentValue>();
  for (const node of context.enodes) {
    if (node.root !== node) continue;
    const expr = node.owner;
    if (!context.isRelevant(expr) && !manager.isValue(expr)) continue;
    const sort = manager.sorts[expr];
    const theory = context.getTheory(manager.getSortFamily(sort));
    if (sort === SORT_BOOL)
      root2value.set(node, context.findAssignment(expr) > 0 ? manager.trueExpr : manager.falseExpr);
    else if (manager.isModelValue(expr)) root2value.set(node, expr);
    else if (theory !== undefined && theory.buildModels()) {
      const value = node.getThVar(theory.id) < 0 ? undefined : theory.mkValue(node);
      if (value === undefined) freshRoots.push(node);
      else if (typeof value === "number")
        root2value.set(node, manager.isValue(expr) ? expr : value);
      else dependentValues.set(node, value);
    } else {
      const value = model.getFreshValue(sort) ?? model.getSomeValue(sort);
      root2value.set(node, manager.isValue(expr) ? expr : value);
    }
  }
  for (const value of root2value.values()) model.registerValue(value);
  // A value that depends on others comes after them, and before the fresh values of its sort.
  const getFreshValue = (node: Enode) => {
    const sort = manager.sorts[node.owner];
    const freshValue = model.getFreshValue(sort) ?? model.getSomeValue(sort);
    const value = manager.isValue(node.owner) ? node.owner : freshValue;
    root2value.set(node, value);
    return value;
  };
  const getDependentValue = (node: Enode): number => {
    const existing = root2value.get(node);
    if (existing !== undefined) return existing;
    const dependent = dependentValues.get(node);
    if (dependent === undefined) return getFreshValue(node);
    dependentValues.delete(node);
    const values = dependent.dependencies.map((dependency) => {
      if (dependency instanceof Enode) return getDependentValue(dependency.root);
      dependency.value ??=
        model.getFreshValue(dependency.sort) ?? model.getSomeValue(dependency.sort);
      return dependency.value;
    });
    // A class whose root is a value, such as a constant array, takes it after its dependencies.
    const value = manager.isValue(node.owner) ? node.owner : dependent.mkValue(values);
    model.registerValue(value);
    root2value.set(node, value);
    return value;
  };
  for (const node of dependentValues.keys()) getDependentValue(node);
  for (const node of freshRoots) if (!root2value.has(node)) getFreshValue(node);
  const getValue = (node: Enode) =>
    root2value.get(node.root) ?? model.getSomeValue(manager.sorts[node.owner]);
  for (const node of context.enodes)
    if (manager.isUninterpretedConst(node.owner) && context.isRelevant(node.owner))
      model.registerConst(manager.decls[node.owner], getValue(node));
  for (const node of context.enodes) {
    const expr = node.owner;
    if (!context.isRelevant(expr) || !isIncludedFuncInterp(context, node.decl)) continue;
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
  for (const theory of context.theories) theory.finalizeModel();
  context.macros?.registerInterpretations(model);
  return { model, root2value };
};
