// Ported from Z3 (src/tactic/goal.cpp), MIT license, see z3-license.txt.
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

  private pushBack(form: number) {
    const manager = this.manager;
    if (manager.isTrue(form)) return;
    if (manager.isFalse(form)) {
      this.forms.reset();
      this.isInconsistent = true;
    }
    this.forms.push(form);
  }

  private quickProcess(form: number, isSavingFirst: boolean) {
    const manager = this.manager;
    const op = manager.getOp(form);
    if (
      op !== OP_AND &&
      !(manager.isNot(form) && manager.getOp(manager.getArg(form, 0)) === OP_OR)
    ) {
      if (!isSavingFirst) this.pushBack(form);
      return form;
    }
    let first = form;
    let isSaving = isSavingFirst;
    const created = new RefVector(manager);
    const todo: Polarized[] = [{ expr: form, isPositive: true }];
    for (let item = todo.pop(); item !== undefined && !this.isInconsistent; item = todo.pop()) {
      const itemOp = manager.getOp(item.expr);
      if ((item.isPositive && itemOp === OP_AND) || (!item.isPositive && itemOp === OP_OR))
        for (let index = manager.getNumArgs(item.expr) - 1; index >= 0; index--)
          todo.push({ expr: manager.getArg(item.expr, index), isPositive: item.isPositive });
      else if (manager.isNot(item.expr))
        todo.push({ expr: manager.getArg(item.expr, 0), isPositive: !item.isPositive });
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

  assert(form: number) {
    const manager = this.manager;
    manager.incRef(form);
    if (!this.isInconsistent) {
      manager.incRef(form);
      manager.decRef(this.quickProcess(form, false));
    }
    manager.decRef(form);
  }

  // When the first conjunct is false, Z3 adds the whole formula (goal.cpp:312), where this adds false.
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

  private shrink(size: number) {
    while (this.forms.size > size) this.forms.pop();
  }

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

  elimRedundancies() {
    const manager = this.manager;
    if (this.isInconsistent) return;
    const negatives = new RefVector(manager);
    const positives = new RefVector(manager);
    let kept = 0;
    for (const [index, form] of [...this.forms.items].entries()) {
      if (manager.isTrue(form)) continue;
      const isNegated = manager.isNot(form);
      const atom = isNegated ? manager.getArg(form, 0) : form;
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
