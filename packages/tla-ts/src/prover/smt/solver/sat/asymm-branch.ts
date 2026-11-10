// Ported from Z3 (src/sat/sat_asymm_branch.h, src/sat/sat_asymm_branch.cpp,
// src/sat/sat_asymm_branch_params.pyg), MIT license, see z3-license.txt.
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { RandomGen } from "../random-gen";
import { Big } from "./big";
import { getBool, getNumber, type SatParams } from "./config";
import type { Solver } from "./solver";

const UINT_MAX = 4294967295;

export class AsymmBranch {
  private counter = 0;
  private rand = new RandomGen(0);
  private calls = 0;
  private touchIndex = 0;
  private isEnabled: boolean;
  private rounds: number;
  private delay: number;
  private isSampled: boolean;
  private isAll: boolean;
  private limit: number;
  private elimLiterals = 0;
  private tr = 0;
  private pos: number[] = [];
  private neg: number[] = [];
  private toDelete: number[] = [];
  private isScopedDeleted = false;

  constructor(
    private solver: Solver,
    params: SatParams,
  ) {
    this.isEnabled = getBool(params, "asymm_branch", true);
    this.rounds = getNumber(params, "asymm_branch.rounds", 2);
    this.delay = getNumber(params, "asymm_branch.delay", 1);
    this.isSampled = getBool(params, "asymm_branch.sampled", true);
    this.limit = Math.min(getNumber(params, "asymm_branch.limit", 100000000), UINT_MAX);
    this.isAll = getBool(params, "asymm_branch.all", false);
  }

  initSearch() {
    this.calls = 0;
  }

  dec(count: number) {
    this.counter -= count;
  }

  private processBig(big: Big, isLearned: boolean) {
    const solver = this.solver;
    const elim0 = this.elimLiterals;
    for (let round = 0; round < this.rounds; round++) {
      const elim = this.elimLiterals + this.tr;
      big.init(solver, isLearned);
      this.processClauses(big, solver.clauses);
      this.processClauses(big, solver.learned);
      this.tr += big.reduceTr(solver);
      solver.propagate(false);
      if (solver.isInconsistent) break;
      if (this.elimLiterals + this.tr - elim === 0) break;
    }
    return this.elimLiterals > elim0;
  }

  private processClauses(big: Big | undefined, clauses: number[]) {
    const solver = this.solver;
    const limit = -this.limit;
    clauses.sort((first, second) => solver.arena.size[second] - solver.arena.size[first]);
    this.counter -= clauses.length;
    let next = 0;
    for (let index = 0; index < clauses.length; index++) {
      const clause = clauses[index];
      if (solver.isInconsistent) {
        for (; index < clauses.length; index++) clauses[next++] = clauses[index];
        break;
      }
      if (this.counter < limit || solver.arena.wasRemoved(clause)) {
        clauses[next++] = clause;
        continue;
      }
      solver.checkpoint();
      if (big === undefined ? !this.processClause(clause) : !this.processSampled(big, clause))
        continue;
      clauses[next++] = clause;
    }
    clauses.length = next;
  }

  run(isForced: boolean) {
    const solver = this.solver;
    this.calls++;
    if (this.calls <= this.delay) return;
    if (!this.isEnabled && !this.isAll && !this.isSampled) return;
    solver.propagate(false);
    if (solver.isInconsistent) return;
    if (!isForced && this.counter > 0) {
      this.counter = Math.trunc(this.counter / 100);
      return;
    }
    const savedPhase = solver.phase.slice();
    const wasProbing = solver.isProbing;
    solver.isProbing = true;
    let isChanged = true;
    for (let count = 0; isChanged && count < 2; count++) {
      isChanged = false;
      solver.touchIndex++;
      if (this.isSampled && this.processBig(new Big(solver.rand), true)) isChanged = true;
      if (this.isSampled && this.processBig(new Big(solver.rand), false)) isChanged = true;
      if (this.isEnabled) {
        this.counter = 0;
        const elim = this.elimLiterals;
        this.processClauses(undefined, solver.clauses);
        solver.propagate(false);
        if (this.elimLiterals > elim) isChanged = true;
        this.counter = -this.counter;
      }
      this.touchIndex = solver.touchIndex;
    }
    for (let index = 0; index < savedPhase.length; index++) solver.phase[index] = savedPhase[index];
    solver.isProbing = wasProbing;
    this.limit = Math.min(2 * this.limit, UINT_MAX);
  }

  private processAll(clause: number) {
    this.detachScoped(clause);
    let result = true;
    for (let index = this.solver.arena.size[clause]; index-- > 0;) {
      const newSize = this.flipLiteralAt(clause, index);
      if (newSize !== -1) {
        result = this.cleanup(clause, index, newSize);
        break;
      }
    }
    this.attachScoped(clause);
    return result;
  }

  private sort(big: Big, clause: number) {
    const arena = this.solver.arena;
    this.pos.length = 0;
    this.neg.length = 0;
    for (let index = 0; index < arena.size[clause]; index++) {
      const lit = arena.get(clause, index);
      this.pos.push(lit);
      this.neg.push(lit ^ 1);
    }
    this.pos.sort((first, second) => big.left[first] - big.left[second]);
    this.neg.sort((first, second) => big.left[first] - big.left[second]);
  }

  private isHiddenTautology(big: Big) {
    const pos = this.pos;
    const neg = this.neg;
    let posIndex = 0;
    let negIndex = 0;
    let posLit = pos[posIndex++];
    let negLit = neg[negIndex++];
    for (;;) {
      if (big.left[negLit] > big.left[posLit]) {
        if (posIndex === pos.length) return false;
        posLit = pos[posIndex++];
      } else if (
        big.right[negLit] < big.right[posLit] ||
        (pos.length === 2 && (posLit === (negLit ^ 1) || big.parent[posLit] === negLit))
      ) {
        if (negIndex === neg.length) return false;
        negLit = neg[negIndex++];
      } else return true;
    }
  }

  private collectHiddenLiterals(big: Big) {
    const toDelete = this.toDelete;
    toDelete.length = 0;
    let right = big.right[this.pos[this.pos.length - 1]];
    for (let index = this.pos.length - 1; index-- > 0;) {
      const lit = this.pos[index];
      const litRight = big.right[lit];
      if (litRight > right) toDelete.push(lit);
      else right = litRight;
    }
    if (toDelete.length > 0) return;
    right = big.right[this.neg[0]];
    for (let index = 1; index < this.neg.length; index++) {
      const lit = this.neg[index];
      const litRight = big.right[lit];
      if (right > litRight) toDelete.push(lit ^ 1);
      else right = litRight;
    }
  }

  private eliminateHiddenLiterals(big: Big, clause: number) {
    const solver = this.solver;
    const arena = solver.arena;
    this.collectHiddenLiterals(big);
    if (this.toDelete.length === 0) return true;
    let next = 0;
    for (let index = 0; index < arena.size[clause]; index++) {
      const lit = arena.get(clause, index);
      const value = solver.value(lit);
      if (value === L_TRUE) {
        this.delScoped(clause);
        return false;
      }
      if (value === L_FALSE || this.toDelete.includes(lit)) continue;
      if (index !== next) arena.swap(clause, index, next);
      next++;
    }
    return this.reAttach(clause, next);
  }

  private propagateLiteral(lit: number) {
    const solver = this.solver;
    if (solver.touched[lit >> 1] < this.touchIndex) return false;
    solver.assignScoped(lit);
    solver.propagate(false);
    return solver.isInconsistent;
  }

  private flipLiteralAt(clause: number, flipIndex: number) {
    const solver = this.solver;
    const size = solver.arena.size[clause];
    let isConflict = false;
    let index = 0;
    solver.push();
    for (; !isConflict && index < size; index++) {
      if (index === flipIndex) continue;
      isConflict = this.propagateLiteral(solver.arena.get(clause, index) ^ 1);
    }
    if (!isConflict) isConflict = this.propagateLiteral(solver.arena.get(clause, flipIndex));
    solver.pop(1);
    return isConflict ? index : -1;
  }

  private cleanup(clause: number, skipIndex: number, newSize: number) {
    const solver = this.solver;
    const arena = solver.arena;
    let next = 0;
    for (let index = 0; index < newSize; index++) {
      if (index === skipIndex || solver.value(arena.get(clause, index)) !== L_UNDEF) continue;
      if (index !== next) arena.swap(clause, index, next);
      next++;
    }
    return this.reAttach(clause, next);
  }

  private reAttach(clause: number, newSize: number) {
    const solver = this.solver;
    const arena = solver.arena;
    this.elimLiterals += arena.size[clause] - newSize;
    switch (newSize) {
      case 0:
        solver.setConflict();
        return false;
      case 1:
        solver.assignUnit(arena.get(clause, 0));
        solver.propagate(false);
        this.delScoped(clause);
        return false;
      case 2:
        solver.mkBinClause(arena.get(clause, 0), arena.get(clause, 1), arena.isLearned(clause));
        if (solver.trail.length > solver.qhead) solver.propagate(false);
        this.delScoped(clause);
        return false;
      default:
        solver.shrink(clause, arena.size[clause], newSize);
        return true;
    }
  }

  private detachScoped(clause: number) {
    this.isScopedDeleted = false;
    if (!this.solver.arena.isFrozen(clause)) this.solver.detachClause(clause);
  }

  private attachScoped(clause: number) {
    if (!this.isScopedDeleted && !this.solver.arena.isFrozen(clause))
      this.solver.attachClause(clause);
  }

  private delScoped(clause: number) {
    if (this.isScopedDeleted) return;
    this.solver.delClause(clause);
    this.isScopedDeleted = true;
  }

  private processSampled(big: Big, clause: number) {
    this.detachScoped(clause);
    this.sort(big, clause);
    const result = this.isHiddenTautology(big) || this.eliminateHiddenLiterals(big, clause);
    this.attachScoped(clause);
    return result;
  }

  private processClause(clause: number) {
    const solver = this.solver;
    const arena = solver.arena;
    const size = arena.size[clause];
    for (let index = 0; index < size; index++)
      if (solver.value(arena.get(clause, index)) === L_TRUE) {
        solver.detachClause(clause);
        solver.delClause(clause);
        return false;
      }
    this.counter -= size;
    if (this.isAll) return this.processAll(clause);
    this.detachScoped(clause);
    const flipIndex = this.rand.next() % size;
    const newSize = this.flipLiteralAt(clause, flipIndex);
    const result = newSize === -1 || this.cleanup(clause, flipIndex, newSize);
    this.attachScoped(clause);
    return result;
  }
}
