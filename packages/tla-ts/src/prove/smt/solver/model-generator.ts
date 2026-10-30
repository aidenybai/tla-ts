// Ported from Z3 (src/smt/smt_model_generator.cpp), MIT license, see z3-license.txt. Builds a
// model from the current assignment: every relevant equivalence class gets a value, Booleans from
// the assignment, integers from the arithmetic theory and other sorts from fresh model values, and
// each congruence root of an uninterpreted function becomes an entry of its interpretation.
import { FAMILY_USER, SORT_BOOL, isArithSort } from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import { FuncInterp, ProtoModel } from "./proto-model";

export interface GeneratedModel {
  model: ProtoModel;
  root2value: Map<Enode, number>;
}

export const mkModel = (context: Context): GeneratedModel => {
  const manager = context.manager;
  const model = new ProtoModel(manager);
  context.theory?.initModel(model);
  // register_existing_model_values.
  for (const node of context.enodes)
    if (node.root === node && context.isRelevant(node.owner) && manager.isModelValue(node.owner))
      model.registerValue(node.owner);
  // mk_bool_model.
  for (let boolVar = 0; boolVar < context.numBoolVars; boolVar++) {
    const expr = context.boolVar2Expr[boolVar];
    if (manager.isUninterpretedConst(expr) && context.isRelevant(expr))
      model.registerConst(
        manager.decls[expr],
        context.findAssignment(expr) > 0 ? manager.trueExpr : manager.falseExpr,
      );
  }
  // mk_values: the values of the arithmetic classes that the theory does not know are fresh, so
  // they come after all the other values.
  const root2value = new Map<Enode, number>();
  const freshRoots: Enode[] = [];
  for (const node of context.enodes) {
    if (node.root !== node) continue;
    const expr = node.owner;
    if (!context.isRelevant(expr) && !manager.isUniqueValue(expr)) continue;
    const sort = manager.sorts[expr];
    if (manager.isUniqueValue(expr)) root2value.set(node, expr);
    else if (sort === SORT_BOOL)
      root2value.set(node, context.findAssignment(expr) > 0 ? manager.trueExpr : manager.falseExpr);
    else if (isArithSort(sort)) {
      const value = context.theory?.mkValue(node);
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
  // mk_func_interps.
  for (const node of context.enodes) {
    const expr = node.owner;
    if (!context.isRelevant(expr) || manager.funcDecls[node.decl].family !== FAMILY_USER) continue;
    if (node.args.length === 0) {
      model.registerConst(node.decl, getValue(node));
      continue;
    }
    if (node.cg !== node) continue;
    let interp = model.funcInterps.get(node.decl);
    if (interp === undefined) {
      interp = new FuncInterp(manager, node.args.length);
      model.registerFunc(node.decl, interp);
    }
    const args = node.args.map((arg) => getValue(arg));
    if (interp.getEntry(args) === undefined) interp.insertNewEntry(args, getValue(node));
  }
  return { model, root2value };
};
