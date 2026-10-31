// Ported from Z3 (src/smt/smt_context.cpp), MIT license, see z3-license.txt.
// m_sticky_generation_updates: the generations that update_generation lowered, by node. Only a node
// of the same declaration can be congruent to another, so the updates are grouped by declaration.
// Each group keeps its updates in the order of insertion, as a Map does, in arrays that iterate
// without allocating. A deleted update leaves a hole until holes are half of its group.
import { shrink } from "./array";
import type { Enode } from "./enode";

interface Group {
  nodes: (Enode | null)[];
  generations: number[];
  indices: Map<Enode, number>;
  numHoles: number;
}

export class StickyGenerations {
  private groups = new Map<number, Group>();

  set(node: Enode, generation: number) {
    const group = this.groups.get(node.decl);
    if (group === undefined) {
      this.groups.set(node.decl, {
        nodes: [node],
        generations: [generation],
        indices: new Map([[node, 0]]),
        numHoles: 0,
      });
      return;
    }
    const index = group.indices.get(node);
    if (index !== undefined) {
      group.generations[index] = generation;
      return;
    }
    group.indices.set(node, group.nodes.length);
    group.nodes.push(node);
    group.generations.push(generation);
  }

  delete(node: Enode) {
    const group = this.groups.get(node.decl);
    const index = group?.indices.get(node);
    if (group === undefined || index === undefined) return;
    group.indices.delete(node);
    group.nodes[index] = null;
    group.numHoles++;
    if (2 * group.numHoles > group.nodes.length) compact(group);
  }

  // Calls visit with each update of the declaration, in the order of insertion.
  forEach(decl: number, visit: (node: Enode, generation: number) => void) {
    const group = this.groups.get(decl);
    if (group === undefined) return;
    for (let index = 0; index < group.nodes.length; index++) {
      const node = group.nodes[index];
      if (node !== null) visit(node, group.generations[index]);
    }
  }
}

const compact = (group: Group) => {
  let size = 0;
  for (let index = 0; index < group.nodes.length; index++) {
    const node = group.nodes[index];
    if (node === null) continue;
    group.nodes[size] = node;
    group.generations[size] = group.generations[index];
    group.indices.set(node, size);
    size++;
  }
  shrink(group.nodes, size);
  shrink(group.generations, size);
  group.numHoles = 0;
};
