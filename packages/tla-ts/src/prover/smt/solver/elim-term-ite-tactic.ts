import { type AstManager, OP_ITE, SORT_BOOL } from "./ast";
import type { Definition, Goal } from "./goal";
import { DefinedNames } from "./nnf";
import { RewriterTpl } from "./rewriter-tpl";

class ElimTermIteRw extends RewriterTpl {
  readonly hidden: Definition[] = [];

  constructor(
    manager: AstManager,
    private names: DefinedNames,
    private goal: Goal,
  ) {
    super(manager);
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    if (decl !== OP_ITE || sort === SORT_BOOL) return -1;
    const ite = manager.mkApp(OP_ITE, args, sort);
    manager.incRef(ite);
    const named = this.names.mkName(ite);
    if (named.definition !== -1) {
      this.goal.assert(named.definition);
      if (this.goal.isModelsEnabled) this.hidden.push({ decl: manager.decls[named.name], def: -1 });
    }
    manager.incRef(named.name);
    if (named.definition !== -1) manager.decRef(named.definition);
    manager.decRef(ite);
    return named.name;
  }
}

export const runElimTermIte = (manager: AstManager) => (goal: Goal) => {
  const names = new DefinedNames(manager, null);
  const rewriter = new ElimTermIteRw(manager, names, goal);
  const size = goal.forms.size;
  for (let index = 0; index < size && !goal.isInconsistent; index++) {
    const result = rewriter.rewrite(goal.forms.items[index]);
    goal.update(index, result, goal.getDependency(index));
    manager.decRef(result);
  }
  if (rewriter.hidden.length > 0) goal.addDefinitions(rewriter.hidden);
  goal.depth++;
  names.release();
  rewriter.release();
  return [goal];
};
