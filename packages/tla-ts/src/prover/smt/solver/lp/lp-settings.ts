// Ported from Z3 (src/math/lp/lp_settings.h, src/math/lp/lp_settings.cpp), MIT license, see
// z3-license.txt. The settings that theory_lra's UFNIA configuration gives the lp solver, its
// random generator and its statistics.
import { RandomGen } from "../random-gen";

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
  dioCalls: number;
  dioTightenConflicts: number;
  dioRewriteConflicts: number;
  dioStateResets: number;
  lcubeCalls: number;
  lcubeSuccess: number;
  lcubeFlipSuccess: number;
  nlaCalls: number;
  nlaAddBounds: number;
  nlaPropagateBounds: number;
  nlaPropagateEq: number;
  nlaLemmas: number;
  nlaBoundsImprovements: number;
  nlaThrottledLemmas: number;
  nraCalls: number;
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
    dioCalls: 0,
    dioTightenConflicts: 0,
    dioRewriteConflicts: 0,
    dioStateResets: 0,
    lcubeCalls: 0,
    lcubeSuccess: 0,
    lcubeFlipSuccess: 0,
    nlaCalls: 0,
    nlaAddBounds: 0,
    nlaPropagateBounds: 0,
    nlaPropagateEq: 0,
    nlaLemmas: 0,
    nlaBoundsImprovements: 0,
    nlaThrottledLemmas: 0,
    nraCalls: 0,
  };
  readonly maxRowLengthForBoundPropagation = 300;
  readonly maxIterationsWithNoImprovements = 2000000;
  readonly isPropagatingEqs = true;
  readonly intFindCubePeriod = 4;
  // lp.lcube_flips: the most flips that repair a rounded cube center.
  readonly lcubeFlips = 16;
  readonly hnfCutPeriod = 4;
  readonly limitOnRowsForHnfCutter = 75;
  readonly limitOnColumnsForHnfCutter = 150;
  readonly intGomoryCutPeriod = 4;
  // lp.dio_calls_period, which the Diophantine solver's results move, its decrease, and
  // lp.dio_gomory_enable_period.
  dioCallsPeriod = 1;
  readonly dioCallsPeriodDecrease = 2;
  readonly dioGomoryEnablePeriod = 16;
  // m_run_gomory_with_dio: Gomory cuts run once the Diophantine solver keeps failing.
  isRunningGomoryWithDio = false;
  // lp.dio_ignore_big_nums and lp.dio_undo_max_work.
  readonly isDioIgnoringBigNums = true;
  readonly dioUndoMaxWork = 1000000;

  constructor(readonly isCanceled: () => boolean) {}

  // random_next: random_gen's next value, or that value modulo a bound.
  getRandomNext(bound?: number) {
    const value = this.random.next();
    return bound === undefined ? value : value % bound;
  }
}
