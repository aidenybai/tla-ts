import { type AstManager, OP_ITE, SORT_BOOL } from "./ast";
import type { Goal } from "./goal";
import { DefinedNames } from "./nnf";
import type { ProtoModel } from "./proto-model";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";

// elim_term_ite_tactic::rw_cfg, which also gives a term its earlier name.
class ElimTermIteRw extends RewriterTpl {
  readonly definitions: RefVector;
  readonly fresh: number[] = [];

  constructor(
    manager: AstManager,
    private names: DefinedNames,
  ) {
    super(manager);
    this.definitions = new RefVector(manager);
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    if (decl !== OP_ITE || sort === SORT_BOOL) return -1;
    const ite = manager.mkApp(OP_ITE, args, sort);
    manager.incRef(ite);
    const named = this.names.mkName(ite);
    manager.decRef(ite);
    manager.incRef(named.name);
    if (named.definition === -1) return named.name;
    this.definitions.push(named.definition);
    manager.decRef(named.definition);
    this.fresh.push(manager.decls[named.name]);
    return named.name;
  }
}

// The names and the model converter that hides them outlive a run, so each goal the converter
// was added to hides the names of later runs too.
export const runElimTermIte = (manager: AstManager) => {
  const names = new DefinedNames(manager, null);
  const hidden: number[] = [];
  // generic_model_converter applies its entries from the last.
  const hide = (model: ProtoModel) => {
    for (const decl of hidden.toReversed()) model.unregisterDecl(decl);
    return model;
  };
  return (goal: Goal) => {
    const rewriter = new ElimTermIteRw(manager, names);
    const size = goal.forms.size;
    for (let index = 0; index < size && !goal.isInconsistent; index++) {
      const result = rewriter.rewrite(goal.forms.items[index]);
      for (const definition of rewriter.definitions.items) goal.assert(definition);
      rewriter.definitions.reset();
      if (goal.isModelsEnabled) hidden.push(...rewriter.fresh);
      rewriter.fresh.length = 0;
      goal.update(index, result, goal.getDependency(index));
      manager.decRef(result);
    }
    if (hidden.length > 0) goal.addModelConversion(hide);
    goal.depth++;
    rewriter.release();
    return [goal];
  };
};
