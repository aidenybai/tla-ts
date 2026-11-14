// Ported from Z3 (src/ast/substitution/substitution.cpp, src/ast/substitution/unifier.cpp), MIT
// license, see z3-license.txt.
import { type AstManager, KIND_APP, KIND_VAR } from "../ast";

interface Binding {
  expr: number;
  offset: number;
}

const getKey = (index: number, offset: number) => `${offset}:${index}`;

// Bindings of variables at offsets to expressions at offsets. Applying it renames each unbound
// variable at offset i by deltas[i].
export class Substitution {
  private bindings = new Map<string, Binding>();

  constructor(private manager: AstManager) {}

  reset() {
    this.bindings.clear();
  }

  // unifier::operator(): a union-find over the (expression, offset) pairs, seeded with the
  // bindings of variables to variables, where the larger class becomes the root.
  unify(first: number, firstOffset: number, second: number, secondOffset: number) {
    const manager = this.manager;
    const parents = new Map<string, Binding>();
    const sizes = new Map<string, number>();
    const getNodeKey = (node: Binding) => `${node.expr}@${node.offset}`;
    for (const [key, root] of [...this.bindings].reverse()) {
      if (manager.kinds[root.expr] !== KIND_VAR) continue;
      const [offset, index] = key.split(":").map(Number);
      const child = { expr: manager.mkVar(index, manager.sorts[root.expr]), offset };
      const childSize = sizes.get(getNodeKey(child)) ?? 1;
      const rootSize = sizes.get(getNodeKey(root)) ?? 1;
      parents.set(getNodeKey(child), root);
      sizes.set(getNodeKey(root), childSize + rootSize);
    }
    const find = (start: Binding) => {
      const path: Binding[] = [];
      let node = start;
      for (
        let next = parents.get(getNodeKey(node));
        next !== undefined;
        next = parents.get(getNodeKey(node))
      ) {
        path.push(node);
        node = next;
      }
      for (const visited of path) parents.set(getNodeKey(visited), node);
      return node;
    };
    const union = (child: Binding, root: Binding, isBalancing: boolean) => {
      const childSize = sizes.get(getNodeKey(child)) ?? 1;
      const rootSize = sizes.get(getNodeKey(root)) ?? 1;
      if (isBalancing && childSize > rootSize) [child, root] = [root, child];
      parents.set(getNodeKey(child), root);
      sizes.set(getNodeKey(root), childSize + rootSize);
      if (manager.kinds[child.expr] === KIND_VAR)
        this.bindings.set(getKey(manager.values[child.expr], child.offset), root);
    };
    const todo: [Binding, Binding][] = [
      [
        { expr: first, offset: firstOffset },
        { expr: second, offset: secondOffset },
      ],
    ];
    for (let pair = todo.pop(); pair !== undefined; pair = todo.pop()) {
      const left = find(pair[0]);
      const right = find(pair[1]);
      if (left.expr === right.expr && left.offset === right.offset) continue;
      const isLeftVar = manager.kinds[left.expr] === KIND_VAR;
      const isRightVar = manager.kinds[right.expr] === KIND_VAR;
      if (isLeftVar && isRightVar) union(left, right, true);
      else if (isLeftVar) union(left, right, false);
      else if (isRightVar) union(right, left, false);
      else {
        const numArgs = manager.getNumArgs(left.expr);
        if (
          manager.decls[left.expr] !== manager.decls[right.expr] ||
          numArgs !== manager.getNumArgs(right.expr) ||
          (numArgs === 0 && left.expr !== right.expr)
        )
          return false;
        union(left, right, true);
        for (let index = numArgs - 1; index >= 0; index--)
          todo.push([
            { expr: manager.getArg(left.expr, index), offset: left.offset },
            { expr: manager.getArg(right.expr, index), offset: right.offset },
          ]);
      }
    }
    return this.isAcyclic();
  }

  private isAcyclic() {
    const manager = this.manager;
    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (expr: number, offset: number): boolean => {
      if (manager.isGround(expr)) return true;
      if (manager.kinds[expr] === KIND_VAR) {
        const key = getKey(manager.values[expr], offset);
        const binding = this.bindings.get(key);
        if (binding === undefined || done.has(key)) return true;
        if (visiting.has(key)) return false;
        visiting.add(key);
        const isOk = visit(binding.expr, binding.offset);
        visiting.delete(key);
        done.add(key);
        return isOk;
      }
      if (manager.kinds[expr] !== KIND_APP) return true;
      return manager.getArgs(expr).every((arg) => visit(arg, offset));
    };
    for (const key of this.bindings.keys()) {
      const [offset, index] = key.split(":").map(Number);
      const binding = this.bindings.get(key) as Binding;
      visiting.clear();
      visiting.add(getKey(index, offset));
      if (!visit(binding.expr, binding.offset)) return false;
    }
    return true;
  }

  apply(expr: number, offset: number, deltas: readonly number[] = [0]) {
    const manager = this.manager;
    const cache = new Map<string, number>();
    const visit = (current: number, currentOffset: number): number => {
      if (manager.isGround(current)) return current;
      const key = getKey(current, currentOffset);
      const cached = cache.get(key);
      if (cached !== undefined) return cached;
      const result = (() => {
        if (manager.kinds[current] === KIND_VAR) {
          const binding = this.bindings.get(getKey(manager.values[current], currentOffset));
          if (binding !== undefined) return visit(binding.expr, binding.offset);
          const delta = deltas[currentOffset] ?? 0;
          return delta === 0
            ? current
            : manager.mkVar(manager.values[current] + delta, manager.sorts[current]);
        }
        if (manager.kinds[current] !== KIND_APP) return current;
        const args = manager.getArgs(current).map((arg) => visit(arg, currentOffset));
        return args.every((arg, index) => arg === manager.getArg(current, index))
          ? current
          : manager.mkApp(manager.decls[current], args, manager.sorts[current]);
      })();
      cache.set(key, result);
      return result;
    };
    return visit(expr, offset);
  }
}
