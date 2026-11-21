import { FAMILY_BASIC, FAMILY_USER, SORT_BOOL } from "./ast";
import type { Context } from "./context";
import { Enode } from "./enode";
import { FuncInterp, ProtoModel } from "./proto-model";
import type { DependentValue, ExtraFreshValue } from "./theory";

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

const GREY = 1;
const BLACK = 2;

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
  const roots: Enode[] = [];
  const procs = new Map<Enode, number | DependentValue>();
  const freshRoots = new Set<Enode>();
  const extraFreshValues = new Set<ExtraFreshValue>();
  for (const node of context.enodes) {
    if (node.root !== node) continue;
    const expr = node.owner;
    if (!context.isRelevant(expr) && !manager.isValue(expr)) continue;
    roots.push(node);
    const sort = manager.sorts[expr];
    const theory = context.getTheory(manager.getSortFamily(sort));
    if (sort === SORT_BOOL)
      procs.set(node, context.findAssignment(expr) > 0 ? manager.trueExpr : manager.falseExpr);
    else if (manager.isModelValue(expr)) procs.set(node, expr);
    else if (theory !== undefined && theory.buildModels()) {
      const proc = node.getThVar(theory.id) < 0 ? undefined : theory.mkValue(node);
      if (proc === undefined) {
        const freshValue: ExtraFreshValue = { sort, value: undefined };
        freshRoots.add(node);
        extraFreshValues.add(freshValue);
        procs.set(node, { dependencies: [freshValue], mkValue: (values) => values[0] });
      } else {
        if (typeof proc !== "number")
          for (const dependency of proc.dependencies)
            if (!(dependency instanceof Enode)) extraFreshValues.add(dependency);
        procs.set(node, proc);
      }
    } else procs.set(node, model.getFreshValue(sort) ?? model.getSomeValue(sort));
  }
  const colors = new Map<Enode | ExtraFreshValue, number>();
  const traversedSorts = new Set<number>();
  const sortedSources: (Enode | ExtraFreshValue)[] = [];
  const todo: (Enode | ExtraFreshValue)[] = [];
  const visitChild = (source: Enode | ExtraFreshValue) => {
    if (!colors.has(source)) todo.push(source);
  };
  const processSource = (source: Enode | ExtraFreshValue) => {
    if (colors.get(source) === BLACK) return;
    todo.push(source);
    while (todo.length > 0) {
      const current = todo[todo.length - 1];
      const color = colors.get(current);
      if (color === BLACK) todo.pop();
      else if (color === GREY) {
        colors.set(current, BLACK);
        sortedSources.push(current);
      } else {
        colors.set(current, GREY);
        if (current instanceof Enode) {
          const proc = procs.get(current);
          if (proc !== undefined && typeof proc !== "number")
            for (const dependency of proc.dependencies)
              visitChild(dependency instanceof Enode ? dependency.root : dependency);
        } else if (!traversedSorts.has(current.sort)) {
          for (const root of roots)
            if (manager.sorts[root.owner] === current.sort && !freshRoots.has(root))
              visitChild(root);
          traversedSorts.add(current.sort);
        }
      }
    }
  };
  for (const freshValue of extraFreshValues) processSource(freshValue);
  for (const root of freshRoots) processSource(root);
  for (const root of roots) processSource(root);
  const root2value = new Map<Enode, number>();
  for (const source of sortedSources) {
    if (!(source instanceof Enode)) {
      source.value = model.getFreshValue(source.sort) ?? undefined;
      continue;
    }
    const expr = source.owner;
    const sort = manager.sorts[expr];
    const proc = procs.get(source) ?? model.getFreshValue(sort) ?? model.getSomeValue(sort);
    const value = manager.isValue(expr)
      ? expr
      : typeof proc === "number"
        ? proc
        : proc.mkValue(
            proc.dependencies.map((dependency) =>
              dependency instanceof Enode
                ? (root2value.get(dependency.root) ??
                  model.getSomeValue(manager.sorts[dependency.owner]))
                : (dependency.value ?? model.getSomeValue(dependency.sort)),
            ),
          );
    model.registerValue(value);
    root2value.set(source, value);
  }
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
    const args = Array.from({ length: node.numArgs }, (_value, index) =>
      getValue(node.getArg(index)),
    );
    if (interp.getEntry(args) === undefined) interp.insertNewEntry(args, getValue(node));
  }
  for (const theory of context.theories) theory.finalizeModel();
  context.macros?.registerInterpretations(model);
  return { model, root2value };
};
