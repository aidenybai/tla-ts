import { type AstManager, KIND_APP, KIND_VAR } from "../ast";
import { assign } from "../expr-ref";
import { VarShifter } from "../rewriter-tpl";

export interface Binding {
  expr: number;
  offset: number;
}

const NUM_OFFSETS = 3;

const getKey = (index: number, offset: number) => NUM_OFFSETS * index + offset;

// Bindings of variables at offsets to expressions at offsets. Applying it renames each unbound
// variable at offset i by deltas[i].
export class Substitution {
  private bindings = new Map<number, Binding>();
  private vars: number[] = [];
  private refs: number[] = [];
  private scopes: number[] = [];
  private applyCache = new Map<number, number>();
  private newExprs: number[] = [];
  private isInserted = false;

  constructor(private manager: AstManager) {}

  reset() {
    this.bindings.clear();
    this.vars = [];
    const manager = this.manager;
    for (const expr of this.refs) manager.decRef(expr);
    this.refs = [];
    this.scopes = [];
    this.resetCache();
  }

  pushScope() {
    this.scopes.push(this.vars.length);
  }

  popScope() {
    const level = this.scopes.length - 1;
    const oldSize = this.scopes[level];
    for (let index = oldSize; index < this.vars.length; index++)
      this.bindings.delete(this.vars[index]);
    this.vars.length = oldSize;
    const manager = this.manager;
    for (let index = oldSize; index < this.refs.length; index++) manager.decRef(this.refs[index]);
    this.refs.length = oldSize;
    this.scopes.length = level;
    this.resetCache();
  }

  insertBinding(index: number, offset: number, binding: Binding) {
    this.insert(getKey(index, offset), binding);
  }

  find(index: number, offset: number) {
    return this.bindings.get(getKey(index, offset));
  }

  resetCache() {
    this.applyCache.clear();
    const manager = this.manager;
    for (const expr of this.newExprs) manager.decRef(expr);
    this.newExprs = [];
    this.isInserted = false;
  }

  private insert(key: number, binding: Binding) {
    this.bindings.set(key, binding);
    this.vars.push(key);
    this.manager.incRef(binding.expr);
    this.refs.push(binding.expr);
    this.isInserted = true;
  }

  private keepNew(expr: number) {
    this.manager.incRef(expr);
    this.newExprs.push(expr);
    return expr;
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
        expr: manager.mkVar(Math.floor(key / NUM_OFFSETS), manager.sorts[root.expr]),
        offset: key % NUM_OFFSETS,
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
        this.insert(getKey(manager.values[child.expr], child.offset), root);
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

  isAcyclic() {
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
    if (this.isInserted) this.resetCache();
    const cache = this.applyCache;
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
              : this.keepNew(
                  manager.mkVar(manager.values[node.expr] + delta, manager.sorts[node.expr]),
                )),
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
            : this.keepNew(manager.mkApp(manager.decls[node.expr], args, manager.sorts[node.expr])),
        );
      } else cache.set(key, this.keepNew(this.applyQuantifier(node.expr, node.offset, deltas)));
      todo.pop();
    }
    return this.keepNew(cache.get(getKey(expr, offset)) ?? expr);
  }

  // The bindings move under the bound variables, by offset and then by variable.
  private applyQuantifier(expr: number, offset: number, deltas: readonly number[]) {
    const manager = this.manager;
    const quantifier = manager.getQuantifier(expr);
    const numVars = quantifier.sorts.length;
    const nested = new Substitution(manager);
    const shifter = new VarShifter(manager);
    for (const [key, binding] of [...this.bindings].sort(
      (first, second) =>
        (first[0] % NUM_OFFSETS) - (second[0] % NUM_OFFSETS) || first[0] - second[0],
    )) {
      const moved = shifter.shift(binding.expr, 0, numVars, 0);
      nested.insert(key + NUM_OFFSETS * numVars, { expr: moved, offset: binding.offset });
      manager.decRef(moved);
    }
    const patterns = quantifier.patterns.map((pattern) =>
      assign(manager, -1, nested.apply(pattern, offset, deltas)),
    );
    const noPatterns = quantifier.noPatterns.map((pattern) =>
      assign(manager, -1, nested.apply(pattern, offset, deltas)),
    );
    const body = nested.apply(quantifier.body, offset, deltas);
    const result = manager.mkQuantifier({ ...quantifier, patterns, noPatterns, body });
    for (const pattern of noPatterns) manager.decRef(pattern);
    for (const pattern of patterns) manager.decRef(pattern);
    shifter.release();
    nested.reset();
    return result;
  }
}
