// Ported from Z3 (src/ast/substitution/substitution.cpp, src/ast/substitution/unifier.cpp), MIT
// license, see z3-license.txt.
import { type AstManager, KIND_APP, KIND_VAR } from "../ast";
import { VarShifter } from "../rewriter-tpl";

interface Binding {
  expr: number;
  offset: number;
}

// A variable index or an expression at one of the two offsets.
const getKey = (index: number, offset: number) => 2 * index + offset;

// Bindings of variables at offsets to expressions at offsets. Applying it renames each unbound
// variable at offset i by deltas[i].
export class Substitution {
  private bindings = new Map<number, Binding>();

  constructor(private manager: AstManager) {}

  reset() {
    this.bindings.clear();
  }

  // unifier::operator(): a union-find over the (expression, offset) pairs, seeded with the
  // bindings of variables to variables, where the larger class becomes the root.
  unify(first: number, firstOffset: number, second: number, secondOffset: number) {
    const manager = this.manager;
    const parents = new Map<number, Binding>();
    const sizes = new Map<number, number>();
    const getNodeKey = (node: Binding) => getKey(node.expr, node.offset);
    for (const [key, root] of [...this.bindings].reverse()) {
      if (manager.kinds[root.expr] !== KIND_VAR) continue;
      const child = {
        expr: manager.mkVar(Math.floor(key / 2), manager.sorts[root.expr]),
        offset: key % 2,
      };
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
    const visiting = new Set<number>();
    const done = new Set<number>();
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
    for (const [key, binding] of this.bindings) {
      visiting.clear();
      visiting.add(key);
      if (!visit(binding.expr, binding.offset)) return false;
    }
    return true;
  }

  apply(expr: number, offset: number, deltas: readonly number[] = [0]) {
    const manager = this.manager;
    const cache = new Map<number, number>();
    const todo = [{ expr, offset }];
    while (todo.length > 0) {
      const node = todo[todo.length - 1];
      const key = getKey(node.expr, node.offset);
      if (cache.has(key)) {
        todo.pop();
        continue;
      }
      const kind = manager.kinds[node.expr];
      if (manager.isGround(node.expr)) cache.set(key, node.expr);
      else if (kind === KIND_VAR) {
        const binding = this.bindings.get(getKey(manager.values[node.expr], node.offset));
        const bound =
          binding === undefined ? undefined : cache.get(getKey(binding.expr, binding.offset));
        if (binding !== undefined && bound === undefined) {
          todo.push(binding);
          continue;
        }
        const delta = deltas[node.offset] ?? 0;
        cache.set(
          key,
          bound ??
            (delta === 0
              ? node.expr
              : manager.mkVar(manager.values[node.expr] + delta, manager.sorts[node.expr])),
        );
      } else if (kind === KIND_APP) {
        let isVisited = true;
        for (let index = manager.getNumArgs(node.expr); index > 0; index--) {
          const arg = manager.getArg(node.expr, index - 1);
          if (cache.has(getKey(arg, node.offset))) continue;
          todo.push({ expr: arg, offset: node.offset });
          isVisited = false;
        }
        if (!isVisited) continue;
        const args = manager
          .getArgs(node.expr)
          .map((arg) => cache.get(getKey(arg, node.offset)) ?? arg);
        cache.set(
          key,
          args.every((arg, index) => arg === manager.getArg(node.expr, index))
            ? node.expr
            : manager.mkApp(manager.decls[node.expr], args, manager.sorts[node.expr]),
        );
      } else cache.set(key, this.applyQuantifier(node.expr, node.offset, deltas));
      todo.pop();
    }
    return cache.get(getKey(expr, offset)) ?? expr;
  }

  // The bindings move under the bound variables, by offset and then by variable.
  private applyQuantifier(expr: number, offset: number, deltas: readonly number[]) {
    const manager = this.manager;
    const quantifier = manager.getQuantifier(expr);
    const numVars = quantifier.sorts.length;
    const nested = new Substitution(manager);
    const shifter = new VarShifter(manager);
    const shifted = [...this.bindings]
      .sort((first, second) => (first[0] % 2) - (second[0] % 2) || first[0] - second[0])
      .map((entry) => {
        const moved = shifter.shift(entry[1].expr, 0, numVars, 0);
        nested.bindings.set(entry[0] + 2 * numVars, { expr: moved, offset: entry[1].offset });
        return moved;
      });
    const patterns = quantifier.patterns.map((pattern) => nested.apply(pattern, offset, deltas));
    const noPatterns = quantifier.noPatterns.map((pattern) =>
      nested.apply(pattern, offset, deltas),
    );
    const body = nested.apply(quantifier.body, offset, deltas);
    const result = manager.mkQuantifier({ ...quantifier, patterns, noPatterns, body });
    for (const moved of shifted) manager.decRef(moved);
    shifter.release();
    return result;
  }
}
