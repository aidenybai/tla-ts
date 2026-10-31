// Ported from Z3 (src/ast/rewriter/expr_safe_replace.cpp), MIT license, see z3-license.txt.
// Replaces subterms by terms, under quantifiers too, without rewriting. Like Z3, it visits the
// arguments of an application from the last one, and holds the expressions it creates.
import { SmtInvariantError } from "../../../errors";
import { KIND_APP, KIND_VAR, type AstManager } from "./ast";
import { RefVector } from "./ref-vector";
import { VarShifter } from "./rewriter-tpl";
import { VarSubst } from "./var-subst";

export class ExprSafeReplace {
  readonly sources: RefVector;
  readonly targets: RefVector;
  private refs: RefVector;
  private cache = new Map<number, number>();

  constructor(private manager: AstManager) {
    this.sources = new RefVector(manager);
    this.targets = new RefVector(manager);
    this.refs = new RefVector(manager);
  }

  insert(source: number, target: number) {
    this.sources.push(source);
    this.targets.push(target);
    this.cache.clear();
  }

  // operator(): the result comes with a reference, which the caller releases.
  apply(expr: number) {
    const manager = this.manager;
    if (this.sources.size === 0) {
      manager.incRef(expr);
      return expr;
    }
    if (this.cache.size === 0)
      this.sources.items.forEach((source, index) => {
        if (!this.cache.has(source)) this.cache.set(source, this.targets.items[index]);
      });
    const todo = [expr];
    this.refs.push(expr);
    while (todo.length > 0) {
      const current = todo[todo.length - 1];
      if (this.cache.get(current) !== undefined) todo.pop();
      else if (manager.kinds[current] === KIND_VAR) {
        this.cache.set(current, current);
        todo.pop();
      } else if (manager.kinds[current] === KIND_APP) {
        const args: number[] = [];
        let isDifferent = false;
        let hasAllArgs = true;
        for (const arg of manager.args[current]) {
          const replaced = hasAllArgs ? this.cache.get(arg) : undefined;
          if (replaced !== undefined) {
            args.push(replaced);
            isDifferent ||= arg !== replaced;
            continue;
          }
          todo.push(arg);
          hasAllArgs = false;
        }
        if (hasAllArgs) {
          const result = isDifferent
            ? manager.mkApp(manager.decls[current], args, manager.sorts[current])
            : current;
          if (isDifferent) this.refs.push(result);
          this.cache.set(current, result);
          todo.pop();
        }
      } else this.applyQuantifier(current, todo);
    }
    const result = this.cache.get(expr);
    if (result === undefined) throw new SmtInvariantError("the replaced expression has no result");
    manager.incRef(result);
    if (this.refs.size > 1 << 20) {
      this.cache.clear();
      this.refs.reset();
    }
    return result;
  }

  // Replaces the quantifier, or pushes the children it still needs.
  private applyQuantifier(quantifier: number, todo: number[]) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const patterns = new RefVector(manager);
    let body = -1;
    const isAllGround =
      this.sources.items.every((source) => manager.isGroundApp(source)) &&
      this.targets.items.every((target) => manager.isGroundApp(target));
    if (isAllGround) {
      let hasAllData = true;
      const cachedBody = this.cache.get(data.body);
      if (cachedBody === undefined) {
        todo.push(data.body);
        hasAllData = false;
      } else {
        body = cachedBody;
        manager.incRef(body);
      }
      for (const pattern of data.patterns) {
        const replaced = hasAllData ? this.cache.get(pattern) : undefined;
        if (replaced !== undefined) {
          patterns.push(replaced);
          continue;
        }
        todo.push(pattern);
        hasAllData = false;
      }
      if (!hasAllData) {
        patterns.reset();
        if (body !== -1) manager.decRef(body);
        return;
      }
    } else {
      const replace = new ExprSafeReplace(manager);
      const shifter = new VarShifter(manager);
      const numDecls = data.sorts.length;
      let source = -1;
      let target = -1;
      let pattern = -1;
      this.sources.items.forEach((original, index) => {
        const shiftedSource = shifter.shift(original, 0, numDecls, 0);
        if (source !== -1) manager.decRef(source);
        source = shiftedSource;
        const shiftedTarget = shifter.shift(this.targets.items[index], 0, numDecls, 0);
        if (target !== -1) manager.decRef(target);
        target = shiftedTarget;
        replace.insert(source, target);
      });
      for (const original of data.patterns) {
        const replaced = replace.apply(original);
        if (pattern !== -1) manager.decRef(pattern);
        pattern = replaced;
        patterns.push(pattern);
      }
      const isAllVars = replace.sources.items.every(
        (replaced) => manager.kinds[replaced] === KIND_VAR,
      );
      if (isAllVars) {
        const maxIndex = Math.max(
          0,
          ...replace.sources.items.map((replaced) => manager.values[replaced]),
        );
        const args = Array.from({ length: maxIndex + 1 }, () => -1);
        replace.sources.items.forEach((replaced, index) => {
          args[manager.values[replaced]] = replace.targets.items[index];
        });
        const subst = new VarSubst(manager, false);
        body = subst.apply(data.body, args);
        subst.release();
      } else body = replace.apply(data.body);
      for (const expr of [pattern, target, source]) if (expr !== -1) manager.decRef(expr);
      shifter.release();
      replace.release();
    }
    const result = manager.mkQuantifier({ ...data, body, patterns: [...patterns.items] });
    this.refs.push(result);
    this.cache.set(quantifier, result);
    todo.pop();
    patterns.reset();
    manager.decRef(body);
  }

  // ~expr_safe_replace.
  release() {
    this.cache.clear();
    this.refs.reset();
    this.targets.reset();
    this.sources.reset();
  }
}
