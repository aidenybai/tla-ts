// Ported from Z3 (src/util/max_cliques.h), MIT license, see z3-license.txt.

const getSortedSet = (set: Set<number>) => [...set].sort((left, right) => left - right);

export class MaxCliques {
  private next: number[][] = [];
  private tc: number[][] = [];
  private seen1 = new Set<number>();
  private seen2 = new Set<number>();

  constructor(private negate: (vertex: number) => number) {}

  private getNext(vertex: number) {
    return this.next[vertex] ?? [];
  }

  private getTc(vertex: number) {
    this.tc[vertex] ??= [];
    return this.tc[vertex];
  }

  private getReachable(start: number, goal: Set<number>, reachable: Set<number>) {
    this.seen1.clear();
    const todo = [start];
    for (let index = 0; index < todo.length; index++) {
      const vertex = todo[index];
      if (this.seen1.has(vertex)) continue;
      this.seen1.add(vertex);
      if (this.seen2.has(vertex)) {
        for (const next of this.getTc(vertex)) if (goal.has(next)) reachable.add(next);
        continue;
      }
      const negated = this.negate(vertex);
      if (goal.has(negated)) reachable.add(negated);
      todo.push(...this.getNext(negated));
    }
    for (let index = todo.length; index-- > 0;) {
      const vertex = todo[index];
      if (this.seen2.has(vertex)) continue;
      this.seen2.add(vertex);
      const negated = this.negate(vertex);
      const tc = this.getTc(vertex);
      if (goal.has(negated)) tc.push(negated);
      else for (const next of this.getNext(negated)) tc.push(...this.getTc(next));
    }
  }

  addEdge(source: number, target: number) {
    (this.next[source] ??= []).push(target);
    (this.next[target] ??= []).push(source);
  }

  cliques2(vertices: readonly number[]) {
    const goal = new Set(vertices);
    const conns = new Map<number, Set<number>>();
    for (const vertex of vertices) {
      const reach = new Set<number>();
      this.getReachable(vertex, goal, reach);
      conns.set(vertex, reach);
    }
    return this.cliques(vertices, conns);
  }

  cliques(vertices: readonly number[], conns: Map<number, Set<number>>) {
    const getConns = (vertex: number) => {
      const set = conns.get(vertex);
      if (set !== undefined) return set;
      const created = new Set<number>();
      conns.set(vertex, created);
      return created;
    };
    const isLess = (first: number, second: number) => {
      const firstSize = getConns(first).size;
      const secondSize = getConns(second).size;
      return firstSize < secondSize || (firstSize === secondSize && first < second);
    };
    const todo = new Set(vertices);
    const heap = new Set(vertices);
    const result: number[][] = [];
    while (todo.size > 0) {
      let vertex = -1;
      for (const candidate of heap)
        if (vertex === -1 || isLess(candidate, vertex)) vertex = candidate;
      const atMostOne = new Set<number>();
      const next = getSortedSet(getConns(vertex))
        .filter((neighbor) => todo.has(neighbor))
        .sort((first, second) => (isLess(first, second) ? -1 : isLess(second, first) ? 1 : 0));
      for (const neighbor of next) {
        const isAll =
          heap.has(neighbor) &&
          getSortedSet(atMostOne).every((member) => getConns(neighbor).has(member));
        if (isAll) atMostOne.add(neighbor);
      }
      atMostOne.add(vertex);
      const members = getSortedSet(atMostOne);
      for (const member of members) {
        todo.delete(member);
        for (const neighbor of getSortedSet(getConns(member))) getConns(neighbor).delete(member);
      }
      for (const member of members) heap.delete(member);
      if (members.length <= 1) continue;
      if (members.length === 2 && members[0] === this.negate(members[1])) continue;
      result.push(members);
    }
    return result;
  }
}
