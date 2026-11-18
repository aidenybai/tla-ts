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
  nlaPropagateEq: number;
  nlaLemmas: number;
  nlaThrottledLemmas: number;
  nraCalls: number;
}

export const DEFAULT_HAMMER_PERIOD = 4;

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
    nlaPropagateEq: 0,
    nlaLemmas: 0,
    nlaThrottledLemmas: 0,
    nraCalls: 0,
  };
  readonly maxRowLengthForBoundPropagation = 300;
  isPropagatingEqs = true;
  intFindCubePeriod = DEFAULT_HAMMER_PERIOD;
  readonly lcubeFlips = 16;
  hnfCutPeriod = DEFAULT_HAMMER_PERIOD;
  readonly limitOnRowsForHnfCutter = 75;
  readonly limitOnColumnsForHnfCutter = 150;
  intGomoryCutPeriod = DEFAULT_HAMMER_PERIOD;
  dioCallsPeriod = 1;
  readonly dioCallsPeriodDecrease = 2;
  readonly dioGomoryEnablePeriod = 16;
  isRunningGomoryWithDio = false;
  readonly isDioIgnoringBigNums = true;
  readonly dioUndoMaxWork = 1000000;

  constructor(readonly isCanceled: (cost?: number) => boolean) {}

  // lp_settings::updt_params gives the cube, Gomory and hnf heuristics lp.int_hammer_period.
  updateParams(hammerPeriod: number) {
    this.intFindCubePeriod = hammerPeriod;
    this.intGomoryCutPeriod = hammerPeriod;
    this.hnfCutPeriod = hammerPeriod;
  }

  setRandomSeed(seed: number) {
    this.random = new RandomGen(seed);
  }

  getRandomNext(bound?: number) {
    const value = this.random.next();
    return bound === undefined ? value : value % bound;
  }
}
