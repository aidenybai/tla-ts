// Ported from Z3 (src/sat/sat_probing.h, src/sat/sat_probing.cpp,
// src/sat/sat_simplifier_params.pyg), MIT license, see z3-license.txt.
import { L_UNDEF } from "../lbool";
import { Big } from "./big";
import { getBool, getNumber, type SatParams } from "./config";
import type { Solver } from "./solver";

export class Probing {
  private stoppedAt = 0;
  private assigned = new Uint8Array(0);
  private assignedLits: number[] = [];
  private toAssert: number[] = [];
  private counter = 0;
  private isEnabled: boolean;
  private limit: number;
  private isCaching: boolean;
  private isBinary: boolean;
  private numAssigned = 0;
  private cachedBins: (number[] | undefined)[] = [];
  private big: Big;

  constructor(
    private solver: Solver,
    params: SatParams,
  ) {
    this.big = new Big(solver.rand);
    this.isEnabled = getBool(params, "probing", true);
    this.limit = getNumber(params, "probing_limit", 5000000);
    this.isCaching = getBool(params, "probing_cache", true);
    this.isBinary = getBool(params, "probing_binary", true);
  }

  dec(count: number) {
    this.counter -= count;
  }

  cachedImpliedLits(lit: number) {
    return this.isCaching ? this.cachedBins[lit] : undefined;
  }

  resetCache(lit: number) {
    if (lit < this.cachedBins.length) this.cachedBins[lit] = undefined;
  }

  private cacheBins(lit: number, oldTrailSize: number) {
    if (!this.isCaching) return;
    this.cachedBins[lit] = this.solver.trail.slice(oldTrailSize);
  }

  private isAssigned(lit: number) {
    return this.assigned[lit] === 1;
  }

  private tryLit(lit: number, isUpdatingCache: boolean) {
    const solver = this.solver;
    const impliedLits = isUpdatingCache ? undefined : this.cachedImpliedLits(lit);
    if (impliedLits !== undefined) {
      for (const other of impliedLits)
        if (this.isAssigned(other)) {
          solver.assignScoped(other);
          this.numAssigned++;
        }
    } else {
      this.toAssert.length = 0;
      solver.push();
      solver.assignScoped(lit);
      this.counter--;
      const oldTrailSize = solver.trail.length;
      solver.propagate(false);
      if (solver.isInconsistent) {
        solver.pop(1);
        solver.assignScoped(lit ^ 1);
        solver.propagate(false);
        return false;
      }
      for (let index = oldTrailSize; index < solver.trail.length; index++)
        if (this.isAssigned(solver.trail[index])) this.toAssert.push(solver.trail[index]);
      if (isUpdatingCache) this.cacheBins(lit, oldTrailSize);
      solver.pop(1);
      for (const other of this.toAssert) {
        solver.assignScoped(other);
        this.numAssigned++;
      }
    }
    solver.propagate(false);
    return !solver.isInconsistent;
  }

  private processCore(boolVar: number) {
    const solver = this.solver;
    this.counter--;
    solver.push();
    const lit = 2 * boolVar;
    solver.assignScoped(lit);
    const oldTrailSize = solver.trail.length;
    solver.propagate(false);
    if (solver.isInconsistent) {
      solver.pop(1);
      solver.assignScoped(lit ^ 1);
      solver.propagate(false);
      this.numAssigned++;
      return;
    }
    for (const other of this.assignedLits) this.assigned[other] = 0;
    this.assignedLits.length = 0;
    for (let index = oldTrailSize; index < solver.trail.length; index++) {
      this.assigned[solver.trail[index]] = 1;
      this.assignedLits.push(solver.trail[index]);
    }
    this.cacheBins(lit, oldTrailSize);
    solver.pop(1);
    if (!this.tryLit(lit ^ 1, true) || !this.isBinary) return;
    let size = solver.getWlist(lit ^ 1).size;
    for (let index = 0; index < size; index++) {
      const wlist = solver.getWlist(lit ^ 1);
      if (!wlist.isBinary(index)) continue;
      const other = wlist.getLiteral(index);
      if (lit > other || solver.value(other) !== L_UNDEF) continue;
      if (!this.tryLit(other, false) || solver.isInconsistent) return;
      size = wlist.size;
    }
  }

  run(isForced: boolean) {
    const solver = this.solver;
    if (!this.isEnabled) return true;
    solver.propagate(false);
    if (solver.isInconsistent) return true;
    if (!isForced && this.counter > 0) return true;
    const wasProbing = solver.isProbing;
    solver.isProbing = true;
    const numAssigned = this.numAssigned;
    let isComplete = true;
    this.counter = 0;
    this.big.init(solver, true);
    const numVars = solver.numVars();
    this.assigned = new Uint8Array(2 * numVars);
    for (let index = 0; index < numVars; index++) {
      const boolVar = (this.stoppedAt + index) % numVars;
      if (this.counter < -this.limit) {
        this.stoppedAt = boolVar;
        isComplete = false;
        break;
      }
      if (solver.isInconsistent) break;
      if (solver.valueVar(boolVar) !== L_UNDEF || solver.wasEliminated(boolVar)) {
        if (this.isCaching) {
          this.resetCache(2 * boolVar);
          this.resetCache(2 * boolVar + 1);
        }
        continue;
      }
      solver.checkpoint();
      const oldCounter = this.counter;
      const oldNumAssigned = this.numAssigned;
      this.processCore(boolVar);
      if (this.numAssigned > oldNumAssigned) this.counter = oldCounter;
    }
    if (isComplete) this.stoppedAt = 0;
    this.counter = -this.counter;
    if (numAssigned === this.numAssigned) this.counter *= 2;
    this.assigned = new Uint8Array(0);
    this.assignedLits.length = 0;
    this.toAssert.length = 0;
    this.cachedBins = [];
    solver.isProbing = wasProbing;
    return isComplete;
  }
}
