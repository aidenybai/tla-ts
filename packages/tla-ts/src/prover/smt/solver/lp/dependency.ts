// Ported from Z3 (src/util/dependency.h), MIT license, see z3-license.txt. The witnesses of bounds:
// a DAG whose leaves are constraint indices. Without proofs, lar_solver's evidence_manager is the
// plain u_dependency_manager.

export interface DependencyLeaf {
  readonly isLeaf: true;
  readonly value: number;
  isMarked: boolean;
}

export interface DependencyJoin {
  readonly isLeaf: false;
  readonly first: Dependency;
  readonly second: Dependency;
  isMarked: boolean;
}

export type Dependency = DependencyLeaf | DependencyJoin | null;

export const mkLeaf = (value: number): Dependency => ({ isLeaf: true, value, isMarked: false });

export const mkJoin = (first: Dependency, second: Dependency): Dependency => {
  if (first === null) return second;
  if (second === null || first === second) return first;
  return { isLeaf: false, first, second, isMarked: false };
};

// linearize: the leaves in breadth-first order, each once, from the given roots.
export const linearize = (roots: Dependency[]) => {
  const todo: (DependencyLeaf | DependencyJoin)[] = [];
  for (const root of roots) {
    if (root === null || root.isMarked) continue;
    root.isMarked = true;
    todo.push(root);
  }
  const values: number[] = [];
  for (let head = 0; head < todo.length; head++) {
    const node = todo[head];
    if (node.isLeaf) {
      values.push(node.value);
      continue;
    }
    for (const child of [node.first, node.second]) {
      if (child === null || child.isMarked) continue;
      child.isMarked = true;
      todo.push(child);
    }
  }
  for (const node of todo) node.isMarked = false;
  return values;
};
