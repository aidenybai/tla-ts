// Ported from Z3 (src/smt/smt_context.cpp), MIT license, see z3-license.txt.
// m_sticky_generation_updates: the generations that update_generation lowered, by node. Only a node
// of the same declaration can be congruent to another, so the updates are grouped by declaration.
// Each group keeps its updates in the order of insertion, as a Map does, in arrays that iterate
// without allocating. A deleted update leaves a hole until holes are half of its group.
import { shrink } from "./array";

// A group's updates, where a deleted node is -1.
interface Group {
  nodes: number[];
  generations: number[];
  numHoles: number;
}

// Nodes are ids, and indices holds each node's place in its group, or -1.
export class StickyGenerations {
  private groups: (Group | undefined)[] = [];
  private indices = new Int32Array(1024).fill(-1);

  set(node: number, decl: number, generation: number) {
    if (node >= this.indices.length) {
      const grown = new Int32Array(Math.max(2 * this.indices.length, node + 1)).fill(-1);
      grown.set(this.indices);
      this.indices = grown;
    }
    const group = this.groups[decl];
    if (group === undefined) {
      this.groups[decl] = { nodes: [node], generations: [generation], numHoles: 0 };
      this.indices[node] = 0;
      return;
    }
    const index = this.indices[node];
    if (index !== -1) {
      group.generations[index] = generation;
      return;
    }
    this.indices[node] = group.nodes.length;
    group.nodes.push(node);
    group.generations.push(generation);
  }

  delete(node: number, decl: number) {
    const group = this.groups[decl];
    const index = node < this.indices.length ? this.indices[node] : -1;
    if (group === undefined || index === -1) return;
    this.indices[node] = -1;
    group.nodes[index] = -1;
    group.numHoles++;
    if (2 * group.numHoles > group.nodes.length) this.compact(group);
  }

  // The updates of the declaration in the order of insertion.
  getGroup(decl: number): Readonly<Pick<Group, "nodes" | "generations">> | undefined {
    return this.groups[decl];
  }

  private compact(group: Group) {
    let size = 0;
    for (let index = 0; index < group.nodes.length; index++) {
      const node = group.nodes[index];
      if (node === -1) continue;
      group.nodes[size] = node;
      group.generations[size] = group.generations[index];
      this.indices[node] = size;
      size++;
    }
    shrink(group.nodes, size);
    shrink(group.generations, size);
    group.numHoles = 0;
  }
}
