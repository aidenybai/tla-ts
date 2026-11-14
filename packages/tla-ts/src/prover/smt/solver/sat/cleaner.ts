// Ported from Z3 (src/sat/sat_cleaner.h, src/sat/sat_cleaner.cpp), MIT license, see
// z3-license.txt.
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import type { Solver } from "./solver";
import { WATCH_EXT_CONSTRAINT } from "./watch-list";

export class Cleaner {
  private lastNumUnits = 0;
  private cleanupCounter = 0;

  constructor(private solver: Solver) {}

  dec() {
    this.cleanupCounter--;
  }

  private cleanupWatches() {
    const solver = this.solver;
    for (let lit = 0; lit < solver.watches.length; lit++) {
      const wlist = solver.watches[lit];
      if (solver.value(lit) !== L_UNDEF) {
        wlist.finalize();
        continue;
      }
      let next = 0;
      for (let index = 0; index < wlist.size; index++)
        if (
          wlist.getKind(index) === WATCH_EXT_CONSTRAINT ||
          (wlist.isBinary(index) && solver.value(wlist.getLiteral(index)) === L_UNDEF)
        )
          wlist.copy(next++, index);
      wlist.setEnd(next);
    }
  }

  private cleanupClauses(clauses: number[]) {
    const solver = this.solver;
    const arena = solver.arena;
    let target = 0;
    for (const clause of clauses) {
      const size = arena.size[clause];
      let index = 0;
      let next = 0;
      this.cleanupCounter += size;
      for (; index < size; index++) {
        const value = solver.value(arena.get(clause, index));
        if (value === L_TRUE) break;
        if (value === L_FALSE) continue;
        if (index !== next) arena.swap(clause, next, index);
        next++;
      }
      if (index < size) {
        solver.delClause(clause);
        continue;
      }
      switch (next) {
        case 0:
          solver.setConflict();
          solver.delClause(clause);
          break;
        case 1:
          solver.assignUnit(arena.get(clause, 0));
          solver.delClause(clause);
          break;
        case 2:
          solver.mkBinClause(arena.get(clause, 0), arena.get(clause, 1), arena.isLearned(clause));
          solver.delClause(clause);
          break;
        default:
          solver.shrink(clause, size, next);
          clauses[target++] = clause;
          if (!arena.isFrozen(clause)) solver.attachClause(clause);
      }
    }
    clauses.length = target;
  }

  run(isForced: boolean) {
    const solver = this.solver;
    let trailSize = solver.trail.length;
    solver.propagate(false);
    if (solver.isInconsistent) return false;
    if (this.lastNumUnits === trailSize) return false;
    if (!isForced && this.cleanupCounter > 0) return false;
    this.lastNumUnits = trailSize;
    this.cleanupCounter = 0;
    do {
      trailSize = solver.trail.length;
      this.cleanupWatches();
      this.cleanupClauses(solver.clauses);
      this.cleanupClauses(solver.learned);
      solver.propagate(false);
    } while (trailSize < solver.trail.length && !solver.isInconsistent);
    return true;
  }
}
