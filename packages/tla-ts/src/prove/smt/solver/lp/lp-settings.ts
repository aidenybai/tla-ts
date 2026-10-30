// Ported from Z3 (src/math/lp/lp_settings.h, src/math/lp/lp_settings.cpp), MIT license, see
// z3-license.txt. The settings that theory_lra's UFNIA configuration gives the lp solver, its
// random generator and its statistics.
import { RandomGen } from "../proto-model";

export interface LpStats {
  makeFeasible: number;
  pivots: number;
  patches: number;
  patchesSuccess: number;
  gcdCalls: number;
  gcdConflicts: number;
  branches: number;
  bpRowsAnalyzed: number;
  offsetEqs: number;
  fixedEqs: number;
}

export class LpSettings {
  private random = new RandomGen(0);
  readonly stats: LpStats = {
    makeFeasible: 0,
    pivots: 0,
    patches: 0,
    patchesSuccess: 0,
    gcdCalls: 0,
    gcdConflicts: 0,
    branches: 0,
    bpRowsAnalyzed: 0,
    offsetEqs: 0,
    fixedEqs: 0,
  };
  readonly maxRowLengthForBoundPropagation = 300;
  readonly maxIterationsWithNoImprovements = 2000000;
  readonly isPropagatingEqs = true;
  readonly intFindCubePeriod = 4;
  readonly hnfCutPeriod = 4;
  readonly intGomoryCutPeriod = 4;
  // lp.dio_calls_period, which the Diophantine solver's results move, its decrease, and
  // lp.dio_gomory_enable_period.
  dioCallsPeriod = 4;
  readonly dioCallsPeriodDecrease = 2;
  readonly dioGomoryEnablePeriod = 16;
  // lp.dio_cuts_enable_gomory, which turns on when the Diophantine solver keeps failing.
  isDioEnablingGomoryCuts = false;
  // lp.dio is on, so the GCD test runs when dio_run_gcd is on.
  isRunningGcdTest = true;

  constructor(readonly isCanceled: () => boolean) {}

  // random_next: random_gen's next value, or that value modulo a bound.
  getRandomNext(bound?: number) {
    const value = this.random.next();
    return bound === undefined ? value : value % bound;
  }
}
