// Ported from Z3 (src/tactic/goal.cpp), MIT license, see z3-license.txt. The formulas that a tactic
// transforms, kept split into conjuncts.
import { OP_AND, OP_OR, type AstManager } from "./ast";

interface Polarized {
  expr: number;
  isPositive: boolean;
}

export class Goal {
  forms: number[] = [];
  isInconsistent = false;

  constructor(private manager: AstManager) {}

  // push_back: a false formula replaces the whole goal.
  private pushBack(form: number) {
    const manager = this.manager;
    if (manager.isTrue(form)) return;
    if (manager.isFalse(form)) {
      this.forms = [form];
      this.isInconsistent = true;
      return;
    }
    this.forms.push(form);
  }

  // quick_process: splits conjunctions and negated disjunctions in order. With isSavingFirst, the
  // first conjunct is returned instead of added.
  private quickProcess(form: number, isSavingFirst: boolean) {
    const manager = this.manager;
    const op = manager.getOp(form);
    if (op !== OP_AND && !(manager.isNot(form) && manager.getOp(manager.args[form][0]) === OP_OR)) {
      if (!isSavingFirst) this.pushBack(form);
      return form;
    }
    let first = form;
    let isSaving = isSavingFirst;
    const todo: Polarized[] = [{ expr: form, isPositive: true }];
    for (let item = todo.pop(); item !== undefined; item = todo.pop()) {
      if (this.isInconsistent) return first;
      const itemOp = manager.getOp(item.expr);
      const args = manager.args[item.expr];
      if ((item.isPositive && itemOp === OP_AND) || (!item.isPositive && itemOp === OP_OR))
        for (let index = args.length - 1; index >= 0; index--)
          todo.push({ expr: args[index], isPositive: item.isPositive });
      else if (manager.isNot(item.expr)) todo.push({ expr: args[0], isPositive: !item.isPositive });
      else {
        const leaf = item.isPositive ? item.expr : manager.mkNot(item.expr);
        if (isSaving) {
          first = leaf;
          isSaving = false;
        } else this.pushBack(leaf);
      }
    }
    return first;
  }

  // assert_expr.
  assert(form: number) {
    if (!this.isInconsistent) this.quickProcess(form, false);
  }

  // update: the first conjunct replaces the formula and the others are added at the end. When the
  // first conjunct is false, Z3 adds the whole formula instead of false, and this port adds false.
  update(index: number, form: number) {
    if (this.isInconsistent) return;
    const first = this.quickProcess(form, true);
    if (this.isInconsistent) return;
    if (this.manager.isFalse(first)) this.pushBack(first);
    else this.forms[index] = first;
  }

  // elim_true.
  elimTrue() {
    this.forms = this.forms.filter((form) => !this.manager.isTrue(form));
  }

  // elim_redundancies: drops true and repeated literals, and finds a complementary pair.
  elimRedundancies() {
    const manager = this.manager;
    if (this.isInconsistent) return;
    const positives = new Set<number>();
    const negatives = new Set<number>();
    const kept: number[] = [];
    for (const form of this.forms) {
      if (manager.isTrue(form)) continue;
      const isNegated = manager.isNot(form);
      const atom = isNegated ? manager.args[form][0] : form;
      const same = isNegated ? negatives : positives;
      if (same.has(atom)) continue;
      if ((isNegated ? positives : negatives).has(atom)) {
        this.forms = kept;
        this.pushBack(manager.falseExpr);
        return;
      }
      same.add(atom);
      kept.push(form);
    }
    this.forms = kept;
  }
}
