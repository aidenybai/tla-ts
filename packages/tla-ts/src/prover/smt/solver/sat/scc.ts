// Ported from Z3 (src/sat/sat_scc.h, src/sat/sat_scc.cpp), MIT license, see z3-license.txt.
import { Big } from "./big";
import { NULL_LITERAL } from "./clause";
import type { SatConfig } from "./config";
import { ElimEqs } from "./elim-eqs";
import type { Solver } from "./solver";

const UNVISITED = -1;

export class Scc {
  private big: Big;

  constructor(
    private solver: Solver,
    private config: SatConfig,
  ) {
    this.big = new Big(solver.rand);
  }

  private extractRoots(roots: number[], toElim: number[]) {
    const solver = this.solver;
    const numLits = 2 * solver.numVars();
    const index = new Int32Array(numLits).fill(UNVISITED);
    const lowlink = new Int32Array(numLits).fill(UNVISITED);
    const inStack = new Uint8Array(numLits);
    const stack: number[] = [];
    const frameLits: number[] = [];
    const framePositions: number[] = [];
    const frameIsFirst: boolean[] = [];
    for (let boolVar = 0; boolVar < solver.numVars(); boolVar++) roots.push(NULL_LITERAL);
    let nextIndex = 0;
    const newNode = (lit: number) => {
      index[lit] = nextIndex;
      lowlink[lit] = nextIndex;
      nextIndex++;
      stack.push(lit);
      inStack[lit] = 1;
      frameLits.push(lit);
      framePositions.push(0);
      frameIsFirst.push(true);
    };
    for (let start = 0; start < numLits; start++) {
      if (index[start] !== UNVISITED) continue;
      if (solver.wasEliminated(start >> 1)) continue;
      solver.checkpoint();
      newNode(start);
      frames: while (frameLits.length > 0) {
        const top = frameLits.length - 1;
        const lit = frameLits[top];
        const wlist = solver.getWlist(lit);
        if (!frameIsFirst[top]) {
          const other = wlist.getLiteral(framePositions[top]);
          if (lowlink[other] < lowlink[lit]) lowlink[lit] = lowlink[other];
          framePositions[top]++;
        }
        frameIsFirst[top] = false;
        while (framePositions[top] < wlist.size) {
          const position = framePositions[top];
          if (!wlist.isBinary(position)) {
            framePositions[top]++;
            continue;
          }
          const other = wlist.getLiteral(position);
          if (index[other] === UNVISITED) {
            newNode(other);
            continue frames;
          }
          if (inStack[other] === 1 && index[other] < lowlink[lit]) lowlink[lit] = index[other];
          framePositions[top]++;
        }
        if (lowlink[lit] === index[lit]) {
          const boolVar = lit >> 1;
          if (roots[boolVar] !== NULL_LITERAL) {
            let popped: number;
            do {
              popped = stack.pop() as number;
              inStack[popped] = 0;
            } while (popped !== lit);
          } else {
            let root = NULL_LITERAL;
            for (let position = stack.length - 1; ; position--) {
              const member = stack[position];
              if (member === (lit ^ 1)) {
                solver.setConflict();
                return false;
              }
              if (solver.isExternal(member >> 1)) {
                root = member;
                break;
              }
              if (member === lit) break;
            }
            if (root === NULL_LITERAL) root = lit;
            let popped: number;
            do {
              popped = stack.pop() as number;
              inStack[popped] = 0;
              const memberVar = popped >> 1;
              if (roots[memberVar] === NULL_LITERAL) {
                roots[memberVar] = root ^ (popped & 1);
                if (memberVar !== root >> 1) toElim.push(memberVar);
              }
            } while (popped !== lit);
          }
        }
        frameLits.pop();
        framePositions.pop();
        frameIsFirst.pop();
      }
    }
    for (let boolVar = 0; boolVar < solver.numVars(); boolVar++)
      if (roots[boolVar] === NULL_LITERAL) roots[boolVar] = 2 * boolVar;
    return true;
  }

  run() {
    const solver = this.solver;
    if (solver.isInconsistent || !this.config.isScc) return 0;
    const roots: number[] = [];
    const toElim: number[] = [];
    if (!this.extractRoots(roots, toElim)) return 0;
    new ElimEqs(solver).run(roots, toElim);
    if (this.config.isSccTr) this.reduceTr();
    return toElim.length;
  }

  private reduceTrLearned(isLearned: boolean) {
    this.big.init(this.solver, isLearned);
    return this.big.reduceTr(this.solver);
  }

  private reduceTr() {
    let quota = 0;
    let count = 0;
    let numReduced = 0;
    while ((numReduced = this.reduceTrLearned(false)) > quota && count++ < 10)
      quota = Math.max(100, numReduced >>> 1);
    quota = 0;
    count = 0;
    while ((numReduced = this.reduceTrLearned(true)) > quota && count++ < 10)
      quota = Math.max(100, numReduced >>> 1);
  }
}
