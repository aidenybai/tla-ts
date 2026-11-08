// Ported from Z3 (src/math/lp/lp_settings.h, src/math/lp/lp_settings.cpp), MIT license, see
// z3-license.txt.
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
  readonly lcubeFlips = 16;
  readonly hnfCutPeriod = 4;
  readonly limitOnRowsForHnfCutter = 75;
  readonly limitOnColumnsForHnfCutter = 150;
  readonly intGomoryCutPeriod = 4;
  dioCallsPeriod = 1;
  readonly dioCallsPeriodDecrease = 2;
  readonly dioGomoryEnablePeriod = 16;
  isRunningGomoryWithDio = false;
  readonly isDioIgnoringBigNums = true;
  readonly dioUndoMaxWork = 1000000;

  constructor(readonly isCanceled: () => boolean) {}

  getRandomNext(bound?: number) {
    const value = this.random.next();
    return bound === undefined ? value : value % bound;
  }
}
