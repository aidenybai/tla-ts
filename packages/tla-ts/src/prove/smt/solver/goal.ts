// Ported from Z3 (src/tactic/goal.cpp), MIT license, see z3-license.txt. The formulas that a tactic
// transforms, kept split into conjuncts. Like Z3's goal, it holds a reference to each formula.
import { OP_AND, OP_NOT, OP_OR, SORT_BOOL, type AstManager } from "./ast";
import { RefVector } from "./ref-vector";

interface Polarized {
  expr: number;
  isPositive: boolean;
}

export class Goal {
  readonly forms: RefVector;
  isInconsistent = false;

  constructor(private manager: AstManager) {
    this.forms = new RefVector(manager);
  }

  // push_back: a false formula replaces the whole goal.
  private pushBack(form: number) {
    const manager = this.manager;
    if (manager.isTrue(form)) return;
    if (manager.isFalse(form)) {
      this.forms.reset();
      this.isInconsistent = true;
    }
    this.forms.push(form);
  }

  // quick_process: splits conjunctions and negated disjunctions in order. With isSavingFirst, the
  // first conjunct is returned instead of added. The formula comes with a reference, and so does
  // the result. The negations it creates are held until it returns.
  private quickProcess(form: number, isSavingFirst: boolean) {
    const manager = this.manager;
    const op = manager.getOp(form);
    if (op !== OP_AND && !(manager.isNot(form) && manager.getOp(manager.args[form][0]) === OP_OR)) {
      if (!isSavingFirst) this.pushBack(form);
      return form;
    }
    let first = form;
    let isSaving = isSavingFirst;
    const created = new RefVector(manager);
    const todo: Polarized[] = [{ expr: form, isPositive: true }];
    for (let item = todo.pop(); item !== undefined && !this.isInconsistent; item = todo.pop()) {
      const itemOp = manager.getOp(item.expr);
      const args = manager.args[item.expr];
      if ((item.isPositive && itemOp === OP_AND) || (!item.isPositive && itemOp === OP_OR))
        for (let index = args.length - 1; index >= 0; index--)
          todo.push({ expr: args[index], isPositive: item.isPositive });
      else if (manager.isNot(item.expr)) todo.push({ expr: args[0], isPositive: !item.isPositive });
      else {
        const leaf = item.isPositive ? item.expr : manager.mkApp(OP_NOT, [item.expr], SORT_BOOL);
        if (!item.isPositive) created.push(leaf);
        if (isSaving) {
          manager.incRef(leaf);
          manager.decRef(first);
          first = leaf;
          isSaving = false;
        } else this.pushBack(leaf);
      }
    }
    created.reset();
    return first;
  }

  // assert_expr.
  assert(form: number) {
    const manager = this.manager;
    manager.incRef(form);
    if (!this.isInconsistent) {
      manager.incRef(form);
      manager.decRef(this.quickProcess(form, false));
    }
    manager.decRef(form);
  }

  // update: the first conjunct replaces the formula and the others are added at the end. When the
  // first conjunct is false, Z3 adds the whole formula (goal.cpp:312), and this adds false, so the
  // goal becomes inconsistent.
  update(index: number, form: number) {
    const manager = this.manager;
    if (this.isInconsistent) return;
    manager.incRef(form);
    const first = this.quickProcess(form, true);
    if (!this.isInconsistent) {
      if (manager.isFalse(first)) this.pushBack(first);
      else this.forms.set(index, first);
    }
    manager.decRef(first);
  }

  // shrink: drops the formulas from size on, the last one first.
  private shrink(size: number) {
    while (this.forms.size > size) this.forms.pop();
  }

  // elim_true.
  elimTrue() {
    const manager = this.manager;
    let kept = 0;
    for (const [index, form] of [...this.forms.items].entries()) {
      if (manager.isTrue(form)) continue;
      if (index !== kept) this.forms.set(kept, form);
      kept++;
    }
    this.shrink(kept);
  }

  // elim_redundancies: drops true and repeated literals, and finds a complementary pair. The marks
  // hold the literals until it returns.
  elimRedundancies() {
    const manager = this.manager;
    if (this.isInconsistent) return;
    const negatives = new RefVector(manager);
    const positives = new RefVector(manager);
    let kept = 0;
    for (const [index, form] of [...this.forms.items].entries()) {
      if (manager.isTrue(form)) continue;
      const isNegated = manager.isNot(form);
      const atom = isNegated ? manager.args[form][0] : form;
      const same = isNegated ? negatives : positives;
      if (same.items.includes(atom)) continue;
      if ((isNegated ? positives : negatives).items.includes(atom)) {
        this.pushBack(manager.falseExpr);
        break;
      }
      same.push(atom);
      if (index !== kept) this.forms.set(kept, form);
      kept++;
    }
    if (!this.isInconsistent) this.shrink(kept);
    positives.reset();
    negatives.reset();
  }
}
