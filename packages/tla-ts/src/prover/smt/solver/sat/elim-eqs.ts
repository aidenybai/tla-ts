// Ported from Z3 (src/sat/sat_elim_eqs.h, src/sat/sat_elim_eqs.cpp), MIT license, see
// z3-license.txt.
import { L_FALSE, L_TRUE } from "../lbool";
import { NULL_LITERAL } from "./clause";
import { MC_ELIM_VAR } from "./model-converter";
import type { Solver } from "./solver";

const norm = (roots: number[], lit: number) => roots[lit >> 1] ^ (lit & 1);

export class ElimEqs {
  constructor(private solver: Solver) {}

  private cleanupBinWatches(roots: number[]) {
    const solver = this.solver;
    const newBins: number[] = [];
    for (let index = 0; index < solver.watches.length; index++) {
      const wlist = solver.watches[index];
      const first = index ^ 1;
      const firstRoot = norm(roots, first);
      let next = 0;
      for (let position = 0; position < wlist.size; position++) {
        if (wlist.isBinary(position)) {
          const second = wlist.getLiteral(position);
          const secondRoot = norm(roots, second);
          if (firstRoot === secondRoot) {
            solver.assignUnit(firstRoot);
            if (solver.isInconsistent) {
              for (position++; position < wlist.size; position++) wlist.copy(next++, position);
              wlist.setEnd(next);
              return;
            }
            continue;
          }
          if (firstRoot === (secondRoot ^ 1)) continue;
          if (first !== firstRoot || second !== secondRoot) {
            if (firstRoot < secondRoot)
              newBins.push(firstRoot, secondRoot, wlist.isLearned(position) ? 1 : 0);
            continue;
          }
        }
        wlist.copy(next++, position);
      }
      wlist.setEnd(next);
    }
    for (let index = 0; index < newBins.length; index += 3)
      solver.mkBinClause(newBins[index], newBins[index + 1], newBins[index + 2] === 1);
  }

  private cleanupClauses(roots: number[], clauses: number[]) {
    const solver = this.solver;
    const arena = solver.arena;
    let target = 0;
    for (let clauseIndex = 0; clauseIndex < clauses.length; clauseIndex++) {
      const clause = clauses[clauseIndex];
      const size = arena.size[clause];
      let index = 0;
      while (index < size && arena.get(clause, index) === norm(roots, arena.get(clause, index)))
        index++;
      if (index === size) {
        clauses[target++] = clause;
        continue;
      }
      if (!arena.isFrozen(clause)) solver.detachClause(clause);
      for (index = 0; index < size; index++)
        arena.set(clause, index, norm(roots, arena.get(clause, index)));
      const start = arena.start[clause];
      arena.lits.subarray(start, start + size).sort();
      let next = 0;
      let previous = NULL_LITERAL;
      for (index = 0; index < size; index++) {
        const lit = arena.get(clause, index);
        if (lit === (previous ^ 1)) break;
        if (lit === previous) continue;
        previous = lit;
        const value = solver.value(lit);
        if (value === L_TRUE) break;
        if (value === L_FALSE) continue;
        arena.set(clause, next++, lit);
      }
      if (index < size) {
        arena.setRemoved(clause, true);
        solver.delClause(clause);
        continue;
      }
      switch (next) {
        case 0:
          solver.setConflict();
          for (; clauseIndex < clauses.length; clauseIndex++)
            clauses[target++] = clauses[clauseIndex];
          clauses.length = target;
          return;
        case 1:
          solver.assignUnit(arena.get(clause, 0));
          arena.setRemoved(clause, true);
          solver.delClause(clause);
          break;
        case 2:
          solver.mkBinClause(arena.get(clause, 0), arena.get(clause, 1), arena.isLearned(clause));
          arena.setRemoved(clause, true);
          solver.delClause(clause);
          break;
        default:
          if (next < size) arena.shrink(clause, next);
          else arena.updateApprox(clause);
          clauses[target++] = clause;
          if (!arena.isFrozen(clause)) solver.attachClause(clause);
      }
    }
    clauses.length = target;
  }

  private saveElim(roots: number[], toElim: number[]) {
    const solver = this.solver;
    for (const boolVar of toElim) {
      const lit = 2 * boolVar;
      const root = roots[boolVar];
      const isRootSet = solver.ext === null || solver.ext.setRoot(lit, root);
      if (
        solver.isAssumption(boolVar) ||
        (solver.isExternal(boolVar) && (solver.isIncremental() || !isRootSet))
      ) {
        solver.mkBinClause(lit ^ 1, root, false);
        solver.mkBinClause(lit, root ^ 1, false);
        continue;
      }
      const entry = solver.mc.mk(MC_ELIM_VAR, boolVar);
      solver.setEliminated(boolVar, true);
      solver.mc.insert(entry, [lit ^ 1, root]);
      solver.mc.insert(entry, [lit, root ^ 1]);
    }
    solver.ext?.flushRoots();
  }

  run(roots: number[], toElim: number[]) {
    const solver = this.solver;
    this.cleanupBinWatches(roots);
    this.cleanupClauses(roots, solver.clauses);
    if (solver.isInconsistent) return;
    this.cleanupClauses(roots, solver.learned);
    if (solver.isInconsistent) return;
    this.saveElim(roots, toElim);
    solver.propagate(false);
  }
}
