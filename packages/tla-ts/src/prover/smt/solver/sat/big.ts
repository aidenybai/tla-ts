// Ported from Z3 (src/sat/sat_big.h, src/sat/sat_big.cpp), MIT license, see z3-license.txt.
import type { RandomGen } from "../random-gen";
import { NULL_LITERAL } from "./clause";
import type { Solver } from "./solver";
import { mkBinaryWatch } from "./watch-list";

export class Big {
  private isLearned = false;
  left = new Int32Array(0);
  right = new Int32Array(0);
  parent = new Int32Array(0);
  private dagStart = new Int32Array(1);
  private dag = new Int32Array(0);
  private delBin: number[][] = [];

  constructor(private rand: RandomGen) {}

  private shuffle(array: Int32Array, start: number, end: number) {
    for (let count = end - start; count-- > 0;) {
      const other = start + (this.rand.next() % (count + 1));
      const value = array[start + count];
      array[start + count] = array[other];
      array[other] = value;
    }
  }

  init(solver: Solver, isLearned: boolean) {
    this.isLearned = isLearned;
    const numLits = 2 * solver.numVars();
    const isEdge = (lit: number, index: number) =>
      solver.getWlist(lit).isBinary(index) && (isLearned || !solver.getWlist(lit).isLearned(index));
    const dagStart = new Int32Array(numLits + 1);
    for (let lit = 0; lit < numLits; lit++) {
      dagStart[lit + 1] = dagStart[lit];
      if (solver.wasEliminated(lit >> 1)) continue;
      for (let index = 0; index < solver.getWlist(lit).size; index++)
        if (isEdge(lit, index)) dagStart[lit + 1]++;
    }
    const dag = new Int32Array(dagStart[numLits]);
    const isRoot = new Uint8Array(numLits).fill(1);
    for (let lit = 0; lit < numLits; lit++) {
      if (solver.wasEliminated(lit >> 1)) continue;
      const wlist = solver.getWlist(lit);
      let next = dagStart[lit];
      for (let index = 0; index < wlist.size; index++) {
        if (!isEdge(lit, index)) continue;
        const other = wlist.getLiteral(index);
        isRoot[other] = 0;
        dag[next++] = other;
      }
    }
    for (let lit = 0; lit < numLits; lit++) this.shuffle(dag, dagStart[lit], dagStart[lit + 1]);
    this.dagStart = dagStart;
    this.dag = dag;
    this.initDfsNum(numLits, isRoot);
  }

  private initDfsNum(numLits: number, isRoot: Uint8Array) {
    const left = new Int32Array(numLits);
    const right = new Int32Array(numLits).fill(-1);
    const parent = new Int32Array(numLits);
    for (let lit = 0; lit < numLits; lit++) parent[lit] = lit;
    const todo = new Int32Array(numLits + this.dag.length + 1);
    const todoParents = new Int32Array(todo.length);
    let top = 0;
    for (let lit = 0; lit < numLits; lit++)
      if (isRoot[lit] === 1) {
        todoParents[top] = NULL_LITERAL;
        todo[top++] = lit;
      }
    for (let count = top; count-- > 0;) {
      const other = this.rand.next() % (count + 1);
      const child = todo[count];
      const childParent = todoParents[count];
      todo[count] = todo[other];
      todoParents[count] = todoParents[other];
      todo[other] = child;
      todoParents[other] = childParent;
    }
    let dfsNum = 0;
    while (top > 0) {
      const lit = todo[top - 1];
      if (left[lit] > 0) {
        if (right[lit] < 0) right[lit] = ++dfsNum;
        top--;
        continue;
      }
      left[lit] = ++dfsNum;
      if (todoParents[top - 1] !== NULL_LITERAL) parent[lit] = todoParents[top - 1];
      for (let index = this.dagStart[lit]; index < this.dagStart[lit + 1]; index++) {
        const other = this.dag[index];
        if (left[other] !== 0) continue;
        todoParents[top] = lit;
        todo[top++] = other;
      }
    }
    for (let lit = 0; lit < numLits; lit++)
      if (right[lit] < 0) {
        left[lit] = ++dfsNum;
        right[lit] = ++dfsNum;
      }
    this.left = left;
    this.right = right;
    this.parent = parent;
  }

  private isInDel(first: number, second: number) {
    return first > second
      ? this.delBin[second].includes(first)
      : this.delBin[first].includes(second);
  }

  private addDel(first: number, second: number) {
    if (first > second) this.delBin[second].push(first);
    else this.delBin[first].push(second);
  }

  reduceTr(solver: Solver) {
    let numElim = 0;
    this.delBin = Array.from({ length: solver.watches.length }, () => []);
    for (let lit = 0; lit < solver.watches.length; lit++) {
      if (solver.isInconsistent) break;
      const wlist = solver.watches[lit];
      const size = wlist.size;
      let next = 0;
      for (let index = 0; index < size; index++) {
        if (wlist.isBinary(index) && (!this.isLearned || wlist.isLearned(index))) {
          const other = wlist.getLiteral(index);
          const otherParent = this.parent[other];
          if (lit !== otherParent && (lit ^ 1) !== otherParent && this.isSafeReach(lit, other)) {
            numElim++;
            this.addDel(lit ^ 1, other);
            solver.mc.elimStack = [];
            if (wlist.findBinary(other ^ 1) !== -1) solver.assignUnit(lit ^ 1);
            solver.getWlist(other ^ 1).erase(lit ^ 1, mkBinaryWatch(wlist.isLearned(index)));
            continue;
          }
        }
        wlist.copy(next++, index);
      }
      wlist.setEnd(next);
    }
    solver.propagate(false);
    return numElim;
  }

  private isReaching(from: number, to: number) {
    return this.left[from] < this.left[to] && this.right[to] < this.right[from];
  }

  private isSafeReach(from: number, to: number) {
    if (!this.isReaching(from, to)) return false;
    for (let lit = from; lit !== to;) {
      const next = this.next(lit, to);
      if (this.isInDel(lit ^ 1, next)) return false;
      if (next === (to ^ 1)) return false;
      lit = next;
    }
    return true;
  }

  private next(from: number, to: number) {
    let result = NULL_LITERAL;
    let left = this.right[from];
    for (let index = this.dagStart[from]; index < this.dagStart[from + 1]; index++) {
      const lit = this.dag[index];
      if (
        this.isReaching(from, lit) &&
        (lit === to || this.isReaching(lit, to)) &&
        this.left[lit] < left
      ) {
        left = this.left[lit];
        result = lit;
      }
    }
    return result;
  }
}
