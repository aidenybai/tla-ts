// Ported from Z3 (src/sat/sat_clause_use_list.h, src/sat/sat_clause_use_list.cpp,
// src/sat/sat_simplifier.h, src/sat/sat_simplifier.cpp), MIT license, see z3-license.txt.
import { type ClauseArena, NULL_LITERAL } from "./clause";

export class UseList {
  private clauses: number[][];
  size: Int32Array;
  private numRedundant: Int32Array;

  constructor(
    private arena: ClauseArena,
    numVars: number,
  ) {
    this.clauses = Array.from({ length: 2 * numVars }, () => []);
    this.size = new Int32Array(2 * numVars);
    this.numRedundant = new Int32Array(2 * numVars);
  }

  numIrredundant(lit: number) {
    return this.size[lit] - this.numRedundant[lit];
  }

  get(lit: number) {
    const arena = this.arena;
    const list = this.clauses[lit];
    let next = 0;
    for (const clause of list) if (!arena.wasRemoved(clause)) list[next++] = clause;
    list.length = next;
    return list;
  }

  insert(clause: number) {
    const arena = this.arena;
    const isLearned = arena.isLearned(clause);
    for (let index = 0; index < arena.size[clause]; index++) {
      const lit = arena.get(clause, index);
      this.clauses[lit].push(clause);
      this.size[lit]++;
      if (isLearned) this.numRedundant[lit]++;
    }
  }

  block(clause: number) {
    const arena = this.arena;
    for (let index = 0; index < arena.size[clause]; index++)
      this.numRedundant[arena.get(clause, index)]++;
  }

  unblock(clause: number) {
    const arena = this.arena;
    for (let index = 0; index < arena.size[clause]; index++)
      this.numRedundant[arena.get(clause, index)]--;
  }

  erase(clause: number, exceptLit = NULL_LITERAL) {
    const arena = this.arena;
    const isLearned = arena.isLearned(clause);
    for (let index = 0; index < arena.size[clause]; index++) {
      const lit = arena.get(clause, index);
      if (lit === exceptLit) continue;
      this.size[lit]--;
      if (isLearned) this.numRedundant[lit]--;
    }
  }

  eraseNotRemoved(lit: number, clause: number) {
    const list = this.clauses[lit];
    const position = list.indexOf(clause);
    if (position !== -1) list.splice(position, 1);
    this.size[lit]--;
    if (this.arena.isLearned(clause)) this.numRedundant[lit]--;
  }

  reset(lit: number) {
    this.clauses[lit] = [];
    this.size[lit] = 0;
    this.numRedundant[lit] = 0;
  }
}
