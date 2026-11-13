// Ported from Z3 (src/sat/sat_solver.h, src/sat/sat_solver.cpp, src/sat/sat_gc.cpp,
// src/sat/sat_justification.h, src/util/ema.h), MIT license, see z3-license.txt.
import { SmtCanceledError } from "../../../../errors";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { RandomGen } from "../random-gen";
import type { ResourceLimit } from "../rlimit";
import { AsymmBranch } from "./asymm-branch";
import { Cleaner } from "./cleaner";
import { ClauseArena, NULL_LITERAL } from "./clause";
import {
  GC_DYN_PSM,
  GC_GLUE,
  GC_GLUE_PSM,
  GC_PSM,
  GC_PSM_GLUE,
  getSatConfig,
  PS_ALWAYS_FALSE,
  PS_ALWAYS_TRUE,
  PS_BASIC_CACHING,
  PS_FROZEN,
  PS_RANDOM,
  PS_SAT_CACHING,
  RS_EMA,
  RS_GEOMETRIC,
  RS_LUBY,
  type SatConfig,
  type SatParams,
} from "./config";
import { MaxCliques } from "../max-cliques";
import { ModelConverter } from "./model-converter";
import { Probing } from "./probing";
import { Scc } from "./scc";
import { Simplifier } from "./simplifier";
import { VarQueue } from "./var-queue";
import { WATCH_BINARY, WATCH_EXT_CONSTRAINT, WatchList, mkClauseWatch } from "./watch-list";

export const JUSTIFICATION_NONE = 0;
export const JUSTIFICATION_BINARY = 1;
export const JUSTIFICATION_CLAUSE = 2;
export const JUSTIFICATION_EXT = 3;

export const CR_DONE = 0;
export const CR_CONTINUE = 1;
export const CR_GIVEUP = 2;

export interface SatExtension {
  propagated(lit: number, index: number): boolean;
  unitPropagate?(): boolean;
  canPropagate?(): boolean;
  asserted?(lit: number): void;
  check?(): number;
  getReasonUnknown?(): string;
  getPhase?(boolVar: number): number;
  initSearch?(): void;
  preSimplify?(): void;
  isExternal?(boolVar: number): boolean;
  setEliminated?(boolVar: number): void;
  getAntecedents(lit: number, index: number, antecedents: number[]): void;
  resolveConflict(): number;
  push(): void;
  pop(numScopes: number): void;
  popReinit(): void;
  simplify(): void;
  gc(): void;
  setRoot(lit: number, root: number): boolean;
  flushRoots(): void;
  initUseList(useVars: Set<number>): void;
  findMutexes(lits: number[], mutexes: number[][]): void;
}

const UINT_MAX = 4294967295;
const RANDOM_MAX_VALUE = 0x7fff;

const S_SAT = 0;
const S_UNSAT = 1;

export class Ema {
  private beta = 1;
  value = 0;
  private period = 0;
  private wait = 0;

  constructor(private alpha = 0) {}

  setAlpha(alpha: number) {
    this.alpha = alpha;
  }

  update(sample: number) {
    this.value += this.beta * (sample - this.value);
    if (this.beta <= this.alpha || this.wait-- !== 0) return;
    this.period = 2 * (this.period + 1) - 1;
    this.wait = this.period;
    this.beta *= 0.5;
    if (this.beta < this.alpha) this.beta = this.alpha;
  }
}

interface Scope {
  trailLim: number;
  clausesToReinitLim: number;
}

const getLuby = (index: number) => {
  let size = 1;
  let sequence = 0;
  while (size < index + 1) {
    sequence++;
    size = 2 * size + 1;
  }
  let remaining = index;
  while (size - 1 !== remaining) {
    size = (size - 1) >> 1;
    sequence--;
    remaining %= size;
  }
  return 2 ** sequence;
};

const sortClauses = (clauses: number[], isLess: (first: number, second: number) => boolean) =>
  clauses.sort((first, second) => (isLess(first, second) ? -1 : isLess(second, first) ? 1 : 0));

export class Solver {
  config: SatConfig;
  rand = new RandomGen(0);
  arena = new ClauseArena();
  cleaner: Cleaner;
  mc = new ModelConverter();
  simplifier: Simplifier;
  scc: Scc;
  asymmBranch: AsymmBranch;
  probing: Probing;
  ext: SatExtension | null = null;
  isProbing = false;
  private isGivenUp = false;
  private activeVars: number[] = [];
  private varsLim: number[] = [];
  varsToReinit: number[] = [];
  model = new Int8Array(0);
  isModelCurrent = false;
  isInconsistent = false;
  isSearching = false;
  conflictJustLevel = 0;
  conflictLevel = 0;
  conflictVal = 0;
  conflictKind = JUSTIFICATION_NONE;
  notL = NULL_LITERAL;
  clauses: number[] = [];
  learned: number[] = [];
  numFrozen = 0;
  watches: WatchList[] = [];
  assignment = new Int8Array(16);
  justLevel = new Uint32Array(8);
  private varCount = 0;
  justVal: number[] = [];
  justKind: number[] = [];
  decision: boolean[] = [];
  mark: boolean[] = [];
  litMark: boolean[] = [];
  eliminated: boolean[] = [];
  external: boolean[] = [];
  varScope: number[] = [];
  touched: number[] = [];
  touchIndex = 0;
  replayAssign: number[] = [];
  activity: number[] = [];
  activityInc = 128;
  phase: boolean[] = [];
  bestPhase: boolean[] = [];
  prevPhase: boolean[] = [];
  phaseBirthdate: number[] = [];
  bestPhaseBirthdate: number[] = [];
  assignedSinceGc: boolean[] = [];
  searchState = S_UNSAT;
  searchUnsatConflicts = 0;
  searchSatConflicts = 0;
  searchNextToggle = 0;
  phaseCounter = 0;
  bestPhaseSize = 0;
  rephaseLim = 0;
  rephaseInc = 0;
  rephaseCount = 0;
  caseSplitQueue: VarQueue;
  qhead = 0;
  scopeLvl = 0;
  searchLvl = 0;
  fastGlueAvg = new Ema();
  slowGlueAvg = new Ema();
  fastGlueBackup = new Ema();
  slowGlueBackup = new Ema();
  trailAvg = new Ema();
  trail: number[] = [];
  clausesToReinit: number[] = [];
  reasonUnknown = "";
  visited: number[] = [];
  visitedTimestamp = 0;
  scopes: Scope[] = [];
  core: number[] = [];
  conflicts = 0;
  decisions = 0;
  conflictsSinceInit = 0;
  restarts = 0;
  conflictsSinceRestart = 0;
  isForcingConflictAnalysis = false;
  simplifications = 0;
  restartThreshold = 0;
  lubyIndex = 0;
  conflictsSinceGc = 0;
  gcThreshold = 0;
  defragThreshold = 0;
  gcClauses = 0;
  minDTk = 0;
  nextSimplify = 0;
  isSimplifyEnabled = true;
  isRestartEnabled = true;
  lemma: number[] = [];
  private incremental = false;
  private assumptions: number[] = [];
  private assumptionSet = new Set<number>();
  private diffLevels: boolean[] = [];
  private unmark: number[] = [];
  private lvlSet = 0;
  private lemmaMinStack: number[] = [];

  constructor(
    params: SatParams,
    readonly limit: ResourceLimit,
    isIncremental = false,
  ) {
    this.incremental = isIncremental;
    this.config = getSatConfig(params);
    this.rand = new RandomGen(this.config.randomSeed);
    this.caseSplitQueue = new VarQueue(this.activity);
    this.cleaner = new Cleaner(this);
    this.simplifier = new Simplifier(this, params);
    this.scc = new Scc(this, this.config);
    this.asymmBranch = new AsymmBranch(this, params);
    this.probing = new Probing(this, params);
    this.updateParams();
    this.mkVar(false, false);
  }

  private updateParams() {
    this.fastGlueAvg.setAlpha(this.config.fastGlueAvg);
    this.slowGlueAvg.setAlpha(this.config.slowGlueAvg);
    this.fastGlueBackup.setAlpha(this.config.fastGlueAvg);
    this.slowGlueBackup.setAlpha(this.config.slowGlueAvg);
    this.trailAvg.setAlpha(this.config.slowGlueAvg);
  }

  numVars() {
    return this.varCount;
  }

  value(lit: number) {
    return this.assignment[lit];
  }

  valueVar(boolVar: number) {
    return this.assignment[2 * boolVar];
  }

  lvl(lit: number) {
    return this.justLevel[lit >> 1];
  }

  lvlVar(boolVar: number) {
    return this.justLevel[boolVar];
  }

  atBaseLvl() {
    return this.scopeLvl === 0;
  }

  isExternal(boolVar: number) {
    return this.external[boolVar];
  }

  wasEliminated(boolVar: number) {
    return this.eliminated[boolVar];
  }

  getWlist(lit: number) {
    return this.watches[lit];
  }

  initTrailSize() {
    return this.atBaseLvl() ? this.trail.length : this.scopes[0].trailLim;
  }

  isAssumption(boolVar: number) {
    return this.isAssumptionLit(2 * boolVar) || this.isAssumptionLit(2 * boolVar + 1);
  }

  private isAssumptionLit(lit: number) {
    return this.trackingAssumptions() && this.assumptionSet.has(lit);
  }

  isIncremental() {
    return this.incremental;
  }

  trackingAssumptions() {
    return this.assumptions.length > 0;
  }

  setExternal(boolVar: number) {
    this.external[boolVar] = true;
  }

  initVisited() {
    const size = 2 * this.numVars();
    while (this.visited.length < size) this.visited.push(0);
    this.visitedTimestamp++;
  }

  isVisited(lit: number) {
    return this.visited[lit] === this.visitedTimestamp;
  }

  markVisited(lit: number) {
    this.visited[lit] = this.visitedTimestamp;
  }

  checkpoint() {
    if (!this.limit.inc()) {
      this.isModelCurrent = false;
      this.reasonUnknown = "sat.canceled";
      throw new SmtCanceledError();
    }
  }

  mkVar(isExternal: boolean, isDecision: boolean) {
    this.isModelCurrent = false;
    const boolVar = this.varCount++;
    this.activeVars.push(boolVar);
    if (boolVar === this.justLevel.length) {
      const assignment = new Int8Array(4 * boolVar);
      assignment.set(this.assignment);
      this.assignment = assignment;
      const justLevel = new Uint32Array(2 * boolVar);
      justLevel.set(this.justLevel);
      this.justLevel = justLevel;
    }
    this.watches.push(new WatchList(), new WatchList());
    this.justLevel[boolVar] = UINT_MAX;
    this.justVal.push(0);
    this.justKind.push(JUSTIFICATION_NONE);
    this.decision.push(isDecision);
    this.eliminated.push(false);
    this.external.push(isExternal);
    this.varScope.push(this.scopeLvl);
    this.touched.push(0);
    this.activity.push(0);
    this.mark.push(false);
    this.litMark.push(false, false);
    this.phase.push(false);
    this.bestPhase.push(false);
    this.prevPhase.push(false);
    this.phaseBirthdate.push(0);
    this.bestPhaseBirthdate.push(0);
    this.assignedSinceGc.push(false);
    this.caseSplitQueue.mkVar(boolVar);
    this.simplifier.insertElimTodo(boolVar);
    return boolVar;
  }

  setEliminated(boolVar: number, isEliminated: boolean) {
    if (this.eliminated[boolVar] === isEliminated) return;
    this.eliminated[boolVar] = isEliminated;
    if (isEliminated) this.ext?.setEliminated?.(boolVar);
  }

  setNonExternal(boolVar: number) {
    this.external[boolVar] = false;
  }

  private isExtPropagating() {
    return this.ext !== null && (!this.isProbing || this.atBaseLvl());
  }

  mkClause(lits: number[], isLearned = false) {
    this.isModelCurrent = false;
    return this.mkClauseCore(lits, isLearned);
  }

  delClause(clause: number) {
    if (this.arena.isFrozen(clause)) this.numFrozen--;
    this.arena.delClause(clause);
  }

  mkClauseCore(lits: number[], isRedundant: boolean): number {
    if (!isRedundant) {
      if (!this.simplifyClause(lits)) return -1;
      if (!this.isSearching) this.mc.addClause(lits);
    }
    switch (lits.length) {
      case 0:
        this.setConflict();
        return -1;
      case 1:
        this.assign(lits[0], 0, JUSTIFICATION_NONE, 0);
        return -1;
      case 2:
        this.mkBinClause(lits[0], lits[1], isRedundant);
        return -1;
      default:
        return this.mkNaryClause(lits, isRedundant);
    }
  }

  mkBinClause(first: number, second: number, isRedundant: boolean) {
    this.touched[first >> 1] = this.touchIndex;
    this.touched[second >> 1] = this.touchIndex;
    if (
      isRedundant &&
      this.getWlist(first ^ 1).findBinary(second ^ 1) !== -1 &&
      this.value(first) === L_UNDEF
    ) {
      this.assignUnit(first);
      return;
    }
    if (
      isRedundant &&
      this.getWlist(second ^ 1).findBinary(first ^ 1) !== -1 &&
      this.value(second) === L_UNDEF
    ) {
      this.assignUnit(second);
      return;
    }
    const found = isRedundant ? this.getWlist(first ^ 1).findBinary(second) : -1;
    if (found !== -1) {
      if (this.propagateBinClause(first, second) && !this.atBaseLvl() && !isRedundant)
        this.pushReinitBinary(first, second);
      else if (this.hasVariablesToReinitBinary(first, second)) this.pushReinitBinary(first, second);
      return;
    }
    if (this.propagateBinClause(first, second)) {
      if (!this.atBaseLvl()) this.pushReinitBinary(first, second);
      else return;
    } else if (this.hasVariablesToReinitBinary(first, second)) this.pushReinitBinary(first, second);
    this.getWlist(first ^ 1).pushBinary(second, isRedundant);
    this.getWlist(second ^ 1).pushBinary(first, isRedundant);
  }

  private hasVariablesToReinit(clause: number) {
    const arena = this.arena;
    for (let index = 0; index < arena.size[clause]; index++)
      if (this.varScope[arena.get(clause, index) >> 1] > 0) return true;
    return false;
  }

  private hasVariablesToReinitBinary(first: number, second: number) {
    if (this.atBaseLvl()) return false;
    return this.varScope[first >> 1] > 0 || this.varScope[second >> 1] > 0;
  }

  propagateBinClause(first: number, second: number) {
    if (this.value(second) === L_FALSE && this.value(first) !== L_TRUE) {
      this.assign(first, this.lvl(second), JUSTIFICATION_BINARY, second);
      return true;
    }
    if (this.value(first) === L_FALSE && this.value(second) !== L_TRUE) {
      this.assign(second, this.lvl(first), JUSTIFICATION_BINARY, first);
      return true;
    }
    return false;
  }

  pushReinitStack(clause: number) {
    this.clausesToReinit.push(clause, NULL_LITERAL);
    this.arena.setReinitStack(clause, true);
  }

  private pushReinitBinary(first: number, second: number) {
    this.clausesToReinit.push(first, second);
  }

  private mkNaryClause(lits: number[], isRedundant: boolean) {
    const clause = this.arena.mkClause(lits, lits.length, isRedundant);
    const isReinit = this.attachNaryClause(clause, isRedundant);
    if (isReinit || this.hasVariablesToReinit(clause)) this.pushReinitStack(clause);
    if (isRedundant) this.learned.push(clause);
    else this.clauses.push(clause);
    for (const lit of lits) this.touched[lit >> 1] = this.touchIndex;
    return clause;
  }

  private attachNaryClause(clause: number, isAsserting: boolean) {
    const arena = this.arena;
    let isReinit = false;
    if (!this.atBaseLvl()) {
      if (isAsserting) arena.swap(clause, 1, this.selectLearnedWatchLit(clause));
      else {
        arena.swap(clause, 0, this.selectWatchLit(clause, 0));
        arena.swap(clause, 1, this.selectWatchLit(clause, 1));
      }
      const size = arena.size[clause];
      if (this.value(arena.get(clause, 0)) === L_FALSE) {
        let level = this.lvl(arena.get(clause, 0));
        for (let index = size; index-- > 2;)
          level = Math.max(level, this.lvl(arena.get(clause, index)));
        this.assign(arena.get(clause, 1), level, JUSTIFICATION_CLAUSE, clause);
        isReinit ||= !arena.isLearned(clause);
      } else if (this.value(arena.get(clause, 1)) === L_FALSE) {
        let level = this.lvl(arena.get(clause, 1));
        for (let index = size; index-- > 2;)
          level = Math.max(level, this.lvl(arena.get(clause, index)));
        this.assign(arena.get(clause, 0), level, JUSTIFICATION_CLAUSE, clause);
        isReinit ||= !arena.isLearned(clause);
      }
    }
    const blockedLit = arena.get(clause, arena.size[clause] >> 1);
    this.watches[arena.get(clause, 0) ^ 1].pushClause(blockedLit, clause);
    this.watches[arena.get(clause, 1) ^ 1].pushClause(blockedLit, clause);
    return isReinit;
  }

  attachClause(clause: number) {
    return this.attachNaryClause(
      clause,
      this.arena.isLearned(clause) && !this.arena.isOnReinitStack(clause),
    );
  }

  shrink(clause: number, oldSize: number, newSize: number) {
    if (oldSize === newSize) return;
    this.arena.shrink(clause, newSize);
    for (let index = 0; index < newSize; index++)
      this.touched[this.arena.get(clause, index) >> 1] = this.touchIndex;
  }

  setPhase(boolVar: number, isPositive: boolean) {
    if (this.phase[boolVar] !== isPositive) this.phaseBirthdate[boolVar] = this.conflicts;
    this.phase[boolVar] = isPositive;
  }

  setBestPhase(boolVar: number, isPositive: boolean) {
    if (this.bestPhase[boolVar] !== isPositive) this.bestPhaseBirthdate[boolVar] = this.conflicts;
    this.bestPhase[boolVar] = isPositive;
  }

  setPhaseLiteral(lit: number) {
    if (lit >> 1 >= this.numVars()) return;
    this.setPhase(lit >> 1, (lit & 1) === 0);
    this.setBestPhase(lit >> 1, (lit & 1) === 0);
  }

  private shouldDefrag() {
    if (this.defragThreshold > 0) this.defragThreshold--;
    return this.defragThreshold === 0 && this.config.isGcDefrag;
  }

  private defragClauses() {
    this.defragThreshold = 2;
    this.pop(this.scopeLvl);
    const source = this.arena;
    const target = new ClauseArena();
    const newClauses: number[] = [];
    const newLearned: number[] = [];
    const newIds = new Map<number, number>();
    for (const clause of this.clauses) source.unmarkUsed(clause);
    for (const clause of this.learned) source.unmarkUsed(clause);
    const vars: number[] = [];
    for (let boolVar = 0; boolVar < this.numVars(); boolVar++) vars.push(boolVar);
    vars.sort((first, second) => this.activity[second] - this.activity[first]);
    const copy = (clause: number) => {
      const id = target.copyClause(source, clause);
      (source.isLearned(clause) ? newLearned : newClauses).push(id);
      return id;
    };
    for (const boolVar of vars)
      for (const lit of [2 * boolVar, 2 * boolVar + 1]) {
        const wlist = this.watches[lit];
        for (let index = 0; index < wlist.size; index++) {
          if (!wlist.isClause(index)) continue;
          const clause = wlist.getClause(index);
          const id = newIds.get(clause) ?? copy(clause);
          newIds.set(clause, id);
          wlist.setClause(index, wlist.getBlockedLiteral(index), id);
        }
      }
    for (const clause of this.clauses) if (!newIds.has(clause)) copy(clause);
    for (const clause of this.learned) if (!newIds.has(clause)) copy(clause);
    this.clauses = newClauses;
    this.learned = newLearned;
    this.arena = target;
    this.reinitAssumptions();
  }

  private selectWatchLit(clause: number, startingAt: number) {
    const arena = this.arena;
    let minTrueIndex = -1;
    let maxFalseIndex = -1;
    let unknownIndex = -1;
    for (let index = startingAt; index < arena.size[clause]; index++) {
      const lit = arena.get(clause, index);
      switch (this.value(lit)) {
        case L_FALSE:
          if (maxFalseIndex === -1 || this.lvl(lit) > this.lvl(arena.get(clause, maxFalseIndex)))
            maxFalseIndex = index;
          break;
        case L_UNDEF:
          unknownIndex = index;
          break;
        case L_TRUE:
          if (minTrueIndex === -1 || this.lvl(lit) < this.lvl(arena.get(clause, minTrueIndex)))
            minTrueIndex = index;
          break;
      }
    }
    if (minTrueIndex !== -1) return minTrueIndex;
    if (unknownIndex !== -1) return unknownIndex;
    return maxFalseIndex;
  }

  private selectLearnedWatchLit(clause: number) {
    const arena = this.arena;
    let maxFalseIndex = -1;
    for (let index = 1; index < arena.size[clause]; index++)
      if (
        maxFalseIndex === -1 ||
        this.lvl(arena.get(clause, index)) > this.lvl(arena.get(clause, maxFalseIndex))
      )
        maxFalseIndex = index;
    return maxFalseIndex;
  }

  private simplifyClause(lits: number[]) {
    const isLvl0 = this.atBaseLvl();
    lits.sort((first, second) => first - second);
    let previous = NULL_LITERAL;
    let next = 0;
    for (let index = 0; index < lits.length; index++) {
      const current = lits[index];
      const value = !isLvl0 && this.lvl(current) > 0 ? L_UNDEF : this.value(current);
      if (value === L_TRUE) return false;
      if (value === L_FALSE) continue;
      if (current === (previous ^ 1)) return false;
      if (current !== previous) {
        previous = current;
        if (index !== next) {
          lits[index] = lits[next];
          lits[next] = current;
        }
        next++;
      }
    }
    lits.length = next;
    return true;
  }

  setLearned1(first: number, second: number, isRedundant: boolean) {
    const wlist = this.getWlist(first ^ 1);
    for (let index = 0; index < wlist.size; index++)
      if (wlist.isBinary(index) && wlist.getLiteral(index) === second && !wlist.isLearned(index)) {
        wlist.setLearned(index, isRedundant);
        return;
      }
  }

  detachClause(clause: number) {
    this.getWlist(this.arena.get(clause, 0) ^ 1).eraseClause(clause);
    this.getWlist(this.arena.get(clause, 1) ^ 1).eraseClause(clause);
  }

  setConflict(level = 0, kind = JUSTIFICATION_NONE, val = 0, notL = NULL_LITERAL) {
    if (this.isInconsistent) return;
    this.isInconsistent = true;
    this.conflictJustLevel = level;
    this.conflictKind = kind;
    this.conflictVal = val;
    this.notL = notL;
  }

  assign(lit: number, level: number, kind: number, val: number) {
    switch (this.value(lit)) {
      case L_FALSE:
        this.setConflict(level, kind, val, lit ^ 1);
        break;
      case L_UNDEF:
        this.assignCore(lit, level, kind, val);
        break;
      case L_TRUE:
        if (level === 0 && this.lvl(lit) !== 0) {
          this.justLevel[lit >> 1] = 0;
          this.justKind[lit >> 1] = kind;
          this.justVal[lit >> 1] = val;
        }
        break;
    }
  }

  assignUnit(lit: number) {
    this.assign(lit, 0, JUSTIFICATION_NONE, 0);
  }

  assignScoped(lit: number) {
    this.assign(lit, this.scopeLvl, JUSTIFICATION_NONE, 0);
  }

  assignCore(lit: number, level: number, kind: number, val: number) {
    const boolVar = lit >> 1;
    this.assignment[lit] = L_TRUE;
    this.assignment[lit ^ 1] = L_FALSE;
    this.justLevel[boolVar] = level;
    this.justKind[boolVar] = level === 0 ? JUSTIFICATION_NONE : kind;
    this.justVal[boolVar] = level === 0 ? 0 : val;
    this.setPhase(boolVar, (lit & 1) === 0);
    this.assignedSinceGc[boolVar] = true;
    this.trail.push(lit);
  }

  propagateCore(isUpdating: boolean) {
    if (this.isExtPropagating()) this.ext?.unitPropagate?.();
    while (this.qhead < this.trail.length && !this.isInconsistent) {
      do {
        this.checkpoint();
        this.cleaner.dec();
        const lit = this.trail[this.qhead];
        this.qhead++;
        if (!this.propagateLiteral(lit, isUpdating)) return false;
      } while (this.qhead < this.trail.length);
      if (this.isExtPropagating()) this.ext?.unitPropagate?.();
    }
    return !this.isInconsistent;
  }

  propagate(isUpdating: boolean) {
    return this.propagateCore(isUpdating);
  }

  private propagateClause(clause: number, isUpdating: boolean, assignLevel: number, first: number) {
    const arena = this.arena;
    arena.markUsed(clause);
    this.assignCore(first, assignLevel, JUSTIFICATION_CLAUSE, clause);
    if (isUpdating && arena.isLearned(clause) && arena.glue[clause] > 2) {
      const glue = this.numDiffLevelsBelow(clause, arena.glue[clause] - 1);
      if (glue !== -1) arena.setGlue(clause, glue);
    }
  }

  private propagateLiteral(lit: number, isUpdating: boolean) {
    const arena = this.arena;
    const lits = arena.lits;
    const starts = arena.start;
    const sizes = arena.size;
    const assignment = this.assignment;
    const justLevel = this.justLevel;
    const currLevel = justLevel[lit >> 1];
    const notL = lit ^ 1;
    const wlist = this.watches[lit];
    let data = wlist.data;
    this.asymmBranch.dec(wlist.size);
    this.probing.dec(wlist.size);
    const end = wlist.size;
    let target = 0;
    for (let index = 0; index < end; index++) {
      const val1 = data[2 * index];
      const val2 = data[2 * index + 1];
      if ((val2 & 3) === WATCH_BINARY) {
        const value = assignment[val1];
        if (value === L_FALSE) {
          for (; index < end; index++, target++) wlist.copy(target, index);
          wlist.setEnd(target);
          this.setConflict(currLevel, JUSTIFICATION_BINARY, notL, val1 ^ 1);
          return false;
        }
        if (value === L_UNDEF) this.assignCore(val1, currLevel, JUSTIFICATION_BINARY, notL);
        data[2 * target] = val1;
        data[2 * target + 1] = val2;
        target++;
        continue;
      }
      if ((val2 & 3) === WATCH_EXT_CONSTRAINT) {
        const isKept = (this.ext as SatExtension).propagated(lit, val1);
        data = wlist.data;
        if (this.isInconsistent) {
          if (!isKept) index++;
          for (; index < end; index++, target++) wlist.copy(target, index);
          wlist.setEnd(target);
          return false;
        }
        if (isKept) {
          data[2 * target] = val1;
          data[2 * target + 1] = val2;
          target++;
        }
        continue;
      }
      if (assignment[val2 >> 2] === L_TRUE) {
        data[2 * target] = val1;
        data[2 * target + 1] = val2;
        target++;
        continue;
      }
      const clause = val1;
      const base = starts[clause];
      if (lits[base] === notL) {
        lits[base] = lits[base + 1];
        lits[base + 1] = notL;
      }
      const size = sizes[clause];
      if (arena.wasRemoved(clause) || size === 1 || lits[base + 1] !== notL) {
        data[2 * target] = val1;
        data[2 * target + 1] = val2;
        target++;
        continue;
      }
      const first = lits[base];
      const firstValue = assignment[first];
      if (firstValue === L_TRUE) {
        data[2 * target] = clause;
        data[2 * target + 1] = mkClauseWatch(first);
        target++;
        continue;
      }
      let undefIndex = 0;
      let assignLevel = currLevel;
      let maxIndex = 1;
      let numUndef = 0;
      let isSatisfied = false;
      for (let position = 2; position < size && numUndef <= 1; position++) {
        const other = lits[base + position];
        const value = assignment[other];
        if (value === L_TRUE) {
          data[2 * target] = clause;
          data[2 * target + 1] = mkClauseWatch(other);
          target++;
          isSatisfied = true;
          break;
        }
        if (value === L_UNDEF) {
          undefIndex = position;
          numUndef++;
          continue;
        }
        const level = justLevel[other >> 1];
        if (level > assignLevel) {
          assignLevel = level;
          maxIndex = position;
        }
      }
      if (isSatisfied) continue;
      if (firstValue === L_FALSE) assignLevel = Math.max(assignLevel, justLevel[first >> 1]);
      if (undefIndex !== 0) {
        this.setWatch(clause, undefIndex);
        if (firstValue === L_FALSE && numUndef === 1) {
          arena.swap(clause, 0, 1);
          this.propagateClause(clause, isUpdating, assignLevel, lits[base]);
        }
        continue;
      }
      if (firstValue === L_FALSE) {
        arena.markUsed(clause);
        for (; index < end; index++, target++) wlist.copy(target, index);
        wlist.setEnd(target);
        this.setConflict(assignLevel, JUSTIFICATION_CLAUSE, clause);
        return false;
      }
      if (maxIndex !== 1) this.setWatch(clause, maxIndex);
      else {
        data[2 * target] = val1;
        data[2 * target + 1] = val2;
        target++;
      }
      this.propagateClause(clause, isUpdating, assignLevel, first);
    }
    wlist.setEnd(target);
    if (this.external[lit >> 1] && this.isExtPropagating()) this.ext?.asserted?.(lit);
    return true;
  }

  private setWatch(clause: number, index: number) {
    this.arena.swap(clause, 1, index);
    this.watches[this.arena.get(clause, 1) ^ 1].pushClause(this.arena.get(clause, 0), clause);
  }

  check(assumptions: readonly number[] = []) {
    this.reasonUnknown = "no reason given";
    this.popToBaseLevel();
    this.isSearching = true;
    this.isGivenUp = false;
    try {
      this.initSearch();
      if (this.checkInconsistent()) return L_FALSE;
      this.propagate(false);
      if (this.checkInconsistent()) return L_FALSE;
      this.initAssumptions(assumptions);
      this.propagate(false);
      if (this.checkInconsistent()) return L_FALSE;
      if (this.config.isForcingCleanup) this.doCleanup(true);
      if (this.config.isGcBurst) {
        this.conflictsSinceGc = this.gcThreshold + 1;
        this.doGc();
      }
      if (this.config.isEnablingPreSimplify) {
        this.doSimplify();
        if (this.checkInconsistent()) return L_FALSE;
      }
      if (this.config.maxConflicts === 0) return L_UNDEF;
      if (this.config.maxConflicts > 0 && this.config.burstSearch > 0) {
        this.restartThreshold = this.config.burstSearch;
        const result = this.boundedSearch();
        if (result !== L_UNDEF || this.isGivenUp) return result;
        this.popReinit(this.scopeLvl);
        this.conflictsSinceRestart = 0;
        this.restartThreshold = this.config.restartInitial;
      }
      return this.basicSearch();
    } finally {
      this.isSearching = false;
    }
  }

  checkInconsistent() {
    if (!this.isInconsistent) return false;
    if (this.trackingAssumptions() && this.scopeLvl === this.searchLvl) this.resolveConflict();
    return true;
  }

  resolveConflict() {
    for (;;) {
      if (this.resolveConflictCore() === L_FALSE) return false;
      if (!this.isInconsistent) return true;
    }
  }

  initAssumptions(lits: readonly number[]) {
    if (lits.length === 0) return;
    this.resetAssumptions();
    this.push();
    this.propagate(false);
    if (this.isInconsistent) return;
    for (let index = 0; !this.isInconsistent && index < lits.length; index++) {
      const lit = lits[index];
      this.setExternal(lit >> 1);
      this.addAssumption(lit);
      this.assignScoped(lit);
    }
    this.searchLvl = this.scopeLvl;
  }

  private resetAssumptions() {
    this.assumptions = [];
    this.assumptionSet.clear();
  }

  addAssumption(lit: number) {
    this.assumptionSet.add(lit);
    this.assumptions.push(lit);
    this.setExternal(lit >> 1);
  }

  private reinitAssumptions() {
    if (!this.trackingAssumptions() || !this.atBaseLvl() || this.isInconsistent) return;
    if (!this.propagate(false)) return;
    this.push();
    for (const lit of this.assumptions) {
      if (this.isInconsistent) break;
      this.assignScoped(lit);
    }
    if (!this.isInconsistent) this.propagate(false);
  }

  private processAntecedentForUnsatCore(antecedent: number) {
    const boolVar = antecedent >> 1;
    if (this.mark[boolVar]) return;
    this.mark[boolVar] = true;
    this.unmark.push(boolVar);
    if (this.isAssumptionLit(antecedent)) this.core.push(antecedent);
  }

  private processConsequentForUnsatCore(consequent: number, kind: number, val: number) {
    if (kind === JUSTIFICATION_BINARY) {
      this.processAntecedentForUnsatCore(val ^ 1);
      return;
    }
    if (kind === JUSTIFICATION_EXT) {
      for (const lit of this.getExtAntecedents(consequent, val))
        this.processAntecedentForUnsatCore(lit);
      return;
    }
    if (kind !== JUSTIFICATION_CLAUSE) return;
    const arena = this.arena;
    let position = 0;
    if (consequent !== NULL_LITERAL) {
      if (arena.get(val, 0) === consequent) position = 1;
      else {
        this.processAntecedentForUnsatCore(arena.get(val, 0) ^ 1);
        position = 2;
      }
    }
    for (; position < arena.size[val]; position++)
      this.processAntecedentForUnsatCore(arena.get(val, position) ^ 1);
  }

  private resolveConflictForUnsatCore() {
    this.core = [];
    if (this.conflictLevel === 0) return;
    const oldSize = this.unmark.length;
    let index = this.skipLiteralsAboveConflictLevel();
    let consequent = this.notL;
    if (this.notL !== NULL_LITERAL) {
      const boolVar = this.notL >> 1;
      this.processAntecedentForUnsatCore(this.notL);
      if (this.isAssumptionLit(this.notL ^ 1)) this.core.push(this.notL ^ 1);
      else
        this.processConsequentForUnsatCore(
          this.notL,
          this.justKind[boolVar],
          this.justVal[boolVar],
        );
      consequent = this.notL ^ 1;
    }
    let kind = this.conflictKind;
    let val = this.conflictVal;
    const initSize = this.initTrailSize();
    for (;;) {
      this.processConsequentForUnsatCore(consequent, kind, val);
      while (index >= initSize) {
        consequent = this.trail[index];
        if (this.mark[consequent >> 1] && this.lvl(consequent) === this.conflictLevel) break;
        index--;
      }
      if (index < initSize) break;
      kind = this.justKind[consequent >> 1];
      val = this.justVal[consequent >> 1];
      index--;
    }
    this.resetUnmark(oldSize);
    if (this.core.length > 1) this.core = this.core.filter((lit) => this.lvl(lit) > 0);
  }

  // max_cliques over the binary clauses, the largest mutexes first.
  findMutexes(lits: readonly number[]) {
    const remaining = [...lits];
    const extMutexes: number[][] = [];
    this.ext?.findMutexes(remaining, extMutexes);
    const cliques = new MaxCliques((index) => index ^ 1);
    const seen = new Set<string>();
    for (let index = 0; index < this.watches.length; index++) {
      const first = index ^ 1;
      const wlist = this.watches[index];
      for (let position = 0; position < wlist.size; position++) {
        if (!wlist.isBinary(position)) continue;
        const second = wlist.getLiteral(position);
        const key = `${first},${second}`;
        if (first > second || seen.has(key)) continue;
        seen.add(key);
        cliques.addEdge(first, second);
      }
    }
    const mutexes = cliques.cliques2(remaining);
    const sorted: number[][][] = [];
    for (const mutex of mutexes) (sorted[mutex.length] ??= []).push(mutex);
    const result = extMutexes;
    for (let size = sorted.length; size-- > 0;) result.push(...(sorted[size] ?? []));
    return result;
  }

  private shouldCancel() {
    if (!this.limit.inc()) {
      this.isModelCurrent = false;
      this.reasonUnknown = "sat.canceled";
      return true;
    }
    return this.reachedMaxConflicts();
  }

  private reachedMaxConflicts() {
    if (this.config.maxConflicts === 0 || this.conflictsSinceInit > this.config.maxConflicts) {
      this.reasonUnknown = "sat.max.conflicts";
      return !this.isInconsistent;
    }
    return false;
  }

  private nextVar() {
    if (this.rand.next() < Math.trunc(this.config.randomFreq * RANDOM_MAX_VALUE)) {
      if (this.numVars() === 0) return -1;
      const next = this.rand.next() % this.numVars();
      if (this.valueVar(next) === L_UNDEF && !this.wasEliminated(next)) return next;
    }
    while (!this.caseSplitQueue.isEmpty()) {
      const next = this.caseSplitQueue.nextVar();
      if (this.valueVar(next) === L_UNDEF && !this.wasEliminated(next)) return next;
    }
    return -1;
  }

  private guess(next: number) {
    const extPhase = this.ext?.getPhase?.(next) ?? L_UNDEF;
    if (extPhase !== L_UNDEF) return extPhase === L_TRUE;
    switch (this.config.phase) {
      case PS_ALWAYS_TRUE:
        return true;
      case PS_ALWAYS_FALSE:
        return false;
      case PS_BASIC_CACHING:
        return this.phase[next];
      case PS_FROZEN:
        return this.bestPhase[next];
      case PS_SAT_CACHING:
        return this.searchState === S_UNSAT ? this.phase[next] : this.bestPhase[next];
      default:
        return this.rand.next() % 2 === 0;
    }
  }

  private decide() {
    const next = this.nextVar();
    if (next === -1) return false;
    this.push();
    this.decisions++;
    this.assignScoped(2 * next + (this.guess(next) ? 0 : 1));
    return true;
  }

  boundedSearch() {
    this.isSimplifyEnabled = false;
    this.isRestartEnabled = false;
    try {
      return this.basicSearch();
    } finally {
      this.isSimplifyEnabled = true;
      this.isRestartEnabled = true;
    }
  }

  private basicSearch() {
    let result = L_UNDEF;
    while (result === L_UNDEF && !this.isGivenUp && !this.shouldCancel()) {
      if (this.isInconsistent) result = this.resolveConflictCore();
      else if (this.qhead < this.trail.length || this.ext?.canPropagate?.() === true)
        this.propagate(true);
      else if (this.doCleanup(false)) continue;
      else if (this.shouldGc()) this.doGc();
      else if (this.shouldRephase()) this.doRephase();
      else if (this.shouldRestart()) {
        if (!this.isRestartEnabled) return L_UNDEF;
        this.doRestart(!this.config.isRestartFast);
      } else if (this.shouldSimplify()) this.doSimplify();
      else if (!this.decide()) result = this.finalCheck();
    }
    return result;
  }

  private finalCheck() {
    const ext = this.ext;
    if (ext?.check === undefined) {
      this.mkModel();
      return L_TRUE;
    }
    switch (ext.check()) {
      case CR_DONE:
        this.mkModel();
        return L_TRUE;
      case CR_GIVEUP:
        this.reasonUnknown = ext.getReasonUnknown?.() ?? "unknown";
        this.isGivenUp = true;
        return L_UNDEF;
      default:
        return L_UNDEF;
    }
  }

  initSearch() {
    this.isModelCurrent = false;
    this.phaseCounter = 0;
    this.searchState = S_UNSAT;
    this.searchUnsatConflicts = this.config.searchUnsatConflicts;
    this.searchSatConflicts = this.config.searchSatConflicts;
    this.searchNextToggle = this.searchUnsatConflicts;
    this.bestPhaseSize = 0;
    this.rephaseLim = 0;
    this.rephaseInc = 0;
    this.conflictsSinceRestart = 0;
    this.isForcingConflictAnalysis = false;
    this.restartThreshold = this.config.restartInitial;
    this.lubyIndex = 1;
    this.gcThreshold = this.config.gcInitial;
    this.defragThreshold = 2;
    this.restarts = 0;
    this.simplifications = 0;
    this.conflictsSinceInit = 0;
    this.nextSimplify = this.config.simplifyDelay;
    this.minDTk = 1;
    this.searchLvl = 0;
    if (this.learned.length <= 2 * this.clauses.length) this.conflictsSinceGc = 0;
    this.asymmBranch.initSearch();
    this.core = [];
    this.simplifier.initSearch();
    this.ext?.initSearch?.();
  }

  private shouldSimplify() {
    return this.conflictsSinceInit >= this.nextSimplify && this.isSimplifyEnabled;
  }

  doSimplify() {
    if (!this.shouldSimplify()) return;
    this.simplifications++;
    this.pop(this.scopeLvl);
    this.cleaner.run(this.config.isForcingCleanup);
    this.scc.run();
    this.ext?.preSimplify?.();
    this.simplifier.run(false);
    if (this.learned.length > 0) this.simplifier.run(true);
    this.sortWatchLits();
    this.ext?.simplify();
    this.probing.run(false);
    this.asymmBranch.run(false);
    this.reinitAssumptions();
    if (this.isInconsistent) return;
    if (this.nextSimplify === 0) this.nextSimplify = this.config.nextSimplify1;
    else {
      this.nextSimplify = Math.trunc(this.conflictsSinceInit * this.config.simplifyMult2);
      if (this.nextSimplify > this.conflictsSinceInit + this.config.simplifyMax)
        this.nextSimplify = this.conflictsSinceInit + this.config.simplifyMax;
    }
  }

  private sortWatchLits() {
    for (const wlist of this.watches) wlist.sortBinariesFirst();
  }

  private mkModel() {
    this.isModelCurrent = true;
    const numVars = this.numVars();
    this.model = new Int8Array(numVars);
    for (let boolVar = 0; boolVar < numVars; boolVar++) {
      if (this.wasEliminated(boolVar)) continue;
      this.model[boolVar] = this.valueVar(boolVar);
      const isTrue = this.valueVar(boolVar) === L_TRUE;
      this.setPhase(boolVar, isTrue);
      this.setBestPhase(boolVar, isTrue);
    }
    this.mc.apply(this.model);
  }

  private shouldRestart() {
    if (this.conflictsSinceRestart <= this.restartThreshold) return false;
    if (this.scopeLvl < 2 + this.searchLvl) return false;
    if (this.caseSplitQueue.isEmpty()) return false;
    if (this.config.restart !== RS_EMA) return true;
    return (
      this.fastGlueAvg.value + this.searchLvl <= this.scopeLvl &&
      this.config.restartMargin * this.slowGlueAvg.value <= this.fastGlueAvg.value
    );
  }

  doRestart(isToBase: boolean) {
    this.restarts++;
    this.popReinit(this.restartLevel(isToBase));
    this.setNextRestart();
  }

  private restartLevel(isToBase: boolean) {
    if (isToBase || this.scopeLvl === this.searchLvl) return this.scopeLvl - this.searchLvl;
    const next = this.caseSplitQueue.minVar();
    let level = this.searchLvl;
    while (
      level < this.scopeLvl &&
      this.caseSplitQueue.isMoreActive(this.trail[this.scopes[level].trailLim] >> 1, next)
    )
      level++;
    return level - this.searchLvl;
  }

  private setNextRestart() {
    this.conflictsSinceRestart = 0;
    switch (this.config.restart) {
      case RS_GEOMETRIC:
        this.restartThreshold = Math.trunc(this.restartThreshold * this.config.restartFactor);
        break;
      case RS_LUBY:
        this.lubyIndex++;
        this.restartThreshold = this.config.restartInitial * getLuby(this.lubyIndex);
        break;
      case RS_EMA:
        this.restartThreshold = this.config.restartInitial;
        break;
    }
  }

  private resolveConflictCore() {
    this.conflictsSinceInit++;
    this.conflictsSinceRestart++;
    this.conflictsSinceGc++;
    this.conflicts++;
    const conflict = this.getMaxLvl(this.notL, this.conflictKind, this.conflictVal);
    this.conflictLevel = conflict.level;
    if (this.conflictLevel <= 1 && this.assumptions.length > 0) {
      this.resolveConflictForUnsatCore();
      return L_FALSE;
    }
    if (this.conflictLevel === 0) return L_FALSE;
    if (this.allowBacktracking() && conflict.isUniqueMax && !this.isForcingConflictAnalysis) {
      this.popReinit(this.scopeLvl - this.conflictLevel + 1);
      this.isForcingConflictAnalysis = true;
      return L_UNDEF;
    }
    this.isForcingConflictAnalysis = false;
    this.updatePhaseOfVars();
    if (this.ext !== null) {
      const result = this.ext.resolveConflict();
      if (result === L_TRUE) {
        this.learnLemmaAndBackjump();
        return L_UNDEF;
      }
      if (result === L_FALSE) return L_UNDEF;
    }
    this.lemma = [NULL_LITERAL];
    let index = this.skipLiteralsAboveConflictLevel();
    let numMarks = 0;
    let consequent = NULL_LITERAL;
    let kind = this.conflictKind;
    let val = this.conflictVal;
    if (this.notL !== NULL_LITERAL) {
      numMarks = this.processAntecedent(this.notL, numMarks);
      consequent = this.notL ^ 1;
    }
    do {
      if (kind === JUSTIFICATION_BINARY) numMarks = this.processAntecedent(val ^ 1, numMarks);
      else if (kind === JUSTIFICATION_CLAUSE) {
        const arena = this.arena;
        let position = 0;
        if (consequent !== NULL_LITERAL) {
          if (arena.get(val, 0) === consequent) position = 1;
          else {
            numMarks = this.processAntecedent(arena.get(val, 0) ^ 1, numMarks);
            position = 2;
          }
        }
        for (; position < arena.size[val]; position++)
          numMarks = this.processAntecedent(arena.get(val, position) ^ 1, numMarks);
      } else if (kind === JUSTIFICATION_EXT)
        for (const lit of this.getExtAntecedents(consequent, val))
          numMarks = this.processAntecedent(lit, numMarks);
      let boolVar: number;
      for (;;) {
        consequent = this.trail[index];
        boolVar = consequent >> 1;
        if (this.mark[boolVar] && this.lvlVar(boolVar) === this.conflictLevel) break;
        index--;
      }
      kind = this.justKind[boolVar];
      val = this.justVal[boolVar];
      index--;
      numMarks--;
      this.mark[boolVar] = false;
    } while (numMarks > 0);
    this.lemma[0] = consequent ^ 1;
    this.learnLemmaAndBackjump();
    return L_UNDEF;
  }

  private learnLemmaAndBackjump() {
    if (this.config.isMinimizingLemmas) {
      this.minimizeLemma();
      this.resetLemmaVarMarks();
      if (this.config.isDynSubRes) this.dynSubRes();
    } else this.resetLemmaVarMarks();
    const lemma = this.lemma;
    let backtrackLvl = this.lvl(lemma[0]);
    let backjumpLvl = 0;
    for (let index = lemma.length; index-- > 1;)
      backjumpLvl = Math.max(this.lvl(lemma[index]), backjumpLvl);
    if (backtrackLvl < backjumpLvl) {
      backtrackLvl = backjumpLvl;
      for (let index = lemma.length; index-- > 1;)
        if (this.lvl(lemma[index]) === backjumpLvl) {
          const lit = lemma[index];
          lemma[index] = lemma[0];
          lemma[0] = lit;
          break;
        }
    }
    const glue = this.numDiffLevels(lemma);
    this.fastGlueAvg.update(glue);
    this.slowGlueAvg.update(glue);
    const numScopes = this.scopeLvl - backjumpLvl;
    if (this.useBackjumping(numScopes)) this.popReinit(numScopes);
    else this.popReinit(this.scopeLvl - backtrackLvl + 1);
    const clause = this.mkClauseCore(lemma, true);
    if (clause !== -1) this.arena.setGlue(clause, glue);
    this.lemma = [];
    this.activityInc = Math.trunc(((this.activityInc * this.config.variableDecay) % 2 ** 32) / 100);
    this.updatePhaseCounters();
  }

  private useBackjumping(numScopes: number) {
    return numScopes > 0 && (numScopes <= this.config.backtrackScopes || !this.allowBacktracking());
  }

  private allowBacktracking() {
    return this.conflictsSinceInit > this.config.backtrackInitConflicts;
  }

  getMaxLvl(notL: number, kind: number, val: number) {
    let isUniqueMax = true;
    let level = notL !== NULL_LITERAL ? this.lvl(notL) : 0;
    const update = (lit: number) => {
      const litLevel = this.lvl(lit);
      if (litLevel < level) return;
      isUniqueMax = litLevel > level;
      level = litLevel;
    };
    if (kind === JUSTIFICATION_NONE) level = Math.max(level, this.conflictJustLevel);
    else if (kind === JUSTIFICATION_BINARY) update(val);
    else if (kind === JUSTIFICATION_EXT)
      for (const lit of this.getExtAntecedents(notL === NULL_LITERAL ? notL : notL ^ 1, val))
        update(lit);
    else
      for (let index = 0; index < this.arena.size[val]; index++) update(this.arena.get(val, index));
    return { level, isUniqueMax };
  }

  private getExtAntecedents(consequent: number, index: number) {
    const antecedents: number[] = [];
    (this.ext as SatExtension).getAntecedents(consequent, index, antecedents);
    return antecedents;
  }

  private skipLiteralsAboveConflictLevel() {
    let index = this.trail.length;
    if (index === 0) return index;
    index--;
    while (this.lvl(this.trail[index]) > this.conflictLevel) index--;
    return index;
  }

  private processAntecedent(antecedent: number, numMarks: number) {
    const boolVar = antecedent >> 1;
    const varLvl = this.lvlVar(boolVar);
    if (this.mark[boolVar] || varLvl <= 0) return numMarks;
    this.mark[boolVar] = true;
    this.incActivity(boolVar);
    if (varLvl === this.conflictLevel) return numMarks + 1;
    this.lemma.push(antecedent ^ 1);
    return numMarks;
  }

  private isTwoPhase() {
    return this.config.phase === PS_SAT_CACHING;
  }

  private isSatPhase() {
    return this.isTwoPhase() && this.searchState === S_SAT;
  }

  private updatePhaseOfVars() {
    if (this.config.phase === PS_FROZEN) return;
    const fromLvl = this.conflictLevel;
    const head = fromLvl === 0 ? 0 : this.scopes[fromLvl - 1].trailLim;
    for (let index = head; index < this.trail.length; index++)
      this.setPhase(this.trail[index] >> 1, this.rand.next() % 2 === 0);
    if (this.isSatPhase() && head >= this.bestPhaseSize) {
      this.bestPhaseSize = head;
      for (let index = 0; index < head; index++) {
        const boolVar = this.trail[index] >> 1;
        this.setBestPhase(boolVar, this.phase[boolVar]);
      }
    }
  }

  private shouldToggleSearchState() {
    if (this.searchState === S_UNSAT) this.trailAvg.update(this.trail.length);
    return (
      this.phaseCounter >= this.searchNextToggle &&
      (this.searchState === S_SAT || this.trail.length > 0.5 * this.trailAvg.value)
    );
  }

  private doToggleSearchState() {
    if (this.isTwoPhase()) {
      this.bestPhaseSize = 0;
      [this.fastGlueBackup, this.fastGlueAvg] = [this.fastGlueAvg, this.fastGlueBackup];
      [this.slowGlueBackup, this.slowGlueAvg] = [this.slowGlueAvg, this.slowGlueBackup];
      if (this.searchState === S_SAT) this.searchUnsatConflicts += this.config.searchUnsatConflicts;
      else this.searchSatConflicts += this.config.searchSatConflicts;
    }
    if (this.searchState === S_UNSAT) {
      this.searchState = S_SAT;
      this.searchNextToggle = this.searchSatConflicts;
    } else {
      this.searchState = S_UNSAT;
      this.searchNextToggle = this.searchUnsatConflicts;
    }
    this.phaseCounter = 0;
  }

  private shouldRephase() {
    return this.conflictsSinceInit > this.rephaseLim;
  }

  private doRephase() {
    const size = this.phase.length;
    switch (this.config.phase) {
      case PS_ALWAYS_TRUE:
        for (let index = 0; index < size; index++) this.setPhase(index, true);
        break;
      case PS_ALWAYS_FALSE:
        for (let index = 0; index < size; index++) this.setPhase(index, false);
        break;
      case PS_BASIC_CACHING:
        switch (this.rephaseCount % 4) {
          case 0:
            for (let index = 0; index < size; index++)
              this.setPhase(index, this.rand.next() % 2 === 0);
            break;
          case 1:
            for (let index = 0; index < size; index++) this.setPhase(index, false);
            break;
          case 2:
            for (let index = 0; index < size; index++) this.setPhase(index, !this.phase[index]);
            break;
        }
        break;
      case PS_SAT_CACHING:
        if (this.searchState === S_SAT)
          for (let index = 0; index < size; index++) this.setPhase(index, this.bestPhase[index]);
        break;
      case PS_RANDOM:
        for (let index = 0; index < size; index++) this.setPhase(index, this.rand.next() % 2 === 0);
        break;
    }
    this.rephaseInc += this.config.rephaseBase;
    this.rephaseLim += this.rephaseInc;
    this.rephaseCount++;
  }

  private updatePhaseCounters() {
    this.phaseCounter++;
    if (this.shouldToggleSearchState()) this.doToggleSearchState();
  }

  numDiffLevels(lits: number[]) {
    let result = 0;
    for (const lit of lits) {
      const litLvl = this.lvl(lit);
      if (!this.diffLevels[litLvl]) {
        this.diffLevels[litLvl] = true;
        result++;
      }
    }
    for (const lit of lits) this.diffLevels[this.lvl(lit)] = false;
    return result;
  }

  numDiffFalseLevelsBelow(lits: number[], maxGlue: number) {
    let glue = 0;
    let index = 0;
    for (; index < lits.length && glue < maxGlue; index++) {
      if (this.value(lits[index]) !== L_FALSE) continue;
      const litLvl = this.lvl(lits[index]);
      if (!this.diffLevels[litLvl]) {
        this.diffLevels[litLvl] = true;
        glue++;
      }
    }
    while (index-- > 0)
      if (this.value(lits[index]) === L_FALSE) this.diffLevels[this.lvl(lits[index])] = false;
    return glue < maxGlue ? glue : -1;
  }

  private numDiffLevelsBelow(clause: number, maxGlue: number) {
    const arena = this.arena;
    let glue = 0;
    let index = 0;
    for (; index < arena.size[clause] && glue < maxGlue; index++) {
      const litLvl = this.lvl(arena.get(clause, index));
      if (!this.diffLevels[litLvl]) {
        this.diffLevels[litLvl] = true;
        glue++;
      }
    }
    while (index-- > 0) this.diffLevels[this.lvl(arena.get(clause, index))] = false;
    return glue < maxGlue ? glue : -1;
  }

  private processAntecedentForMinimization(antecedent: number) {
    const boolVar = antecedent >> 1;
    const varLvl = this.lvlVar(boolVar);
    if (!this.mark[boolVar] && varLvl > 0) {
      if ((this.lvlSet & (1 << (varLvl & 31))) === 0) return false;
      this.mark[boolVar] = true;
      this.unmark.push(boolVar);
      this.lemmaMinStack.push(antecedent);
    }
    return true;
  }

  private impliedByMarked(start: number) {
    this.lemmaMinStack = [start];
    const oldSize = this.unmark.length;
    while (this.lemmaMinStack.length > 0) {
      const boolVar = (this.lemmaMinStack.pop() as number) >> 1;
      const kind = this.justKind[boolVar];
      const val = this.justVal[boolVar];
      let isImplied = true;
      if (kind === JUSTIFICATION_NONE) isImplied = this.lvlVar(boolVar) <= 0;
      else if (kind === JUSTIFICATION_BINARY)
        isImplied = this.processAntecedentForMinimization(val ^ 1);
      else if (kind === JUSTIFICATION_EXT) {
        const consequent = 2 * boolVar + (this.valueVar(boolVar) === L_FALSE ? 1 : 0);
        for (const lit of this.getExtAntecedents(consequent, val))
          if (!(isImplied = this.processAntecedentForMinimization(lit))) break;
      } else {
        const arena = this.arena;
        let position = 1;
        if (arena.get(val, 0) >> 1 !== boolVar) {
          isImplied = this.processAntecedentForMinimization(arena.get(val, 0) ^ 1);
          position = 2;
        }
        for (; isImplied && position < arena.size[val]; position++)
          isImplied = this.processAntecedentForMinimization(arena.get(val, position) ^ 1);
      }
      if (!isImplied) {
        this.resetUnmark(oldSize);
        return false;
      }
    }
    return true;
  }

  private resetUnmark(oldSize: number) {
    for (let index = oldSize; index < this.unmark.length; index++)
      this.mark[this.unmark[index]] = false;
    this.unmark.length = oldSize;
  }

  private minimizeLemma() {
    this.lvlSet = 0;
    for (const lit of this.lemma) this.lvlSet |= 1 << (this.lvl(lit) & 31);
    const size = this.lemma.length;
    let next = 1;
    for (let index = 1; index < size; index++) {
      const lit = this.lemma[index];
      if (this.impliedByMarked(lit)) this.unmark.push(lit >> 1);
      else this.lemma[next++] = lit;
    }
    this.resetUnmark(0);
    this.lemma.length = next;
  }

  private resetLemmaVarMarks() {
    this.updateLrbReasoned();
    for (let index = 1; index < this.lemma.length; index++)
      this.mark[this.lemma[index] >> 1] = false;
  }

  private updateLrbReasoned() {
    const lemma = this.lemma;
    const size = lemma.length;
    this.mark[lemma[0] >> 1] = true;
    const reason = (lit: number) => {
      const boolVar = lit >> 1;
      if (this.mark[boolVar]) return;
      this.mark[boolVar] = true;
      this.incActivity(boolVar);
      lemma.push(lit);
    };
    for (let index = lemma.length; index-- > 0;) {
      const boolVar = lemma[index] >> 1;
      const kind = this.justKind[boolVar];
      const val = this.justVal[boolVar];
      if (kind === JUSTIFICATION_BINARY) reason(val);
      else if (kind === JUSTIFICATION_CLAUSE)
        for (let position = 0; position < this.arena.size[val]; position++)
          reason(this.arena.get(val, position));
      else if (kind === JUSTIFICATION_EXT)
        for (const lit of this.getExtAntecedents(lemma[index] ^ 1, val)) reason(lit);
    }
    this.mark[lemma[0] >> 1] = false;
    for (let index = lemma.length; index-- > size;) this.mark[lemma[index] >> 1] = false;
    lemma.length = size;
  }

  private dynSubRes() {
    const lemma = this.lemma;
    const size = lemma.length;
    for (const lit of lemma) this.litMark[lit] = true;
    const first = lemma[0];
    for (let index = 0; index < size; index++) {
      const lit = lemma[index];
      if (!this.litMark[lit]) continue;
      const wlist = this.getWlist(lit ^ 1);
      for (let position = 0; position < wlist.size && wlist.isBinary(position); position++) {
        const other = wlist.getLiteral(position);
        if (this.litMark[other ^ 1] && first !== (other ^ 1)) this.litMark[other ^ 1] = false;
      }
      const impliedLits = this.probing.cachedImpliedLits(lit ^ 1);
      if (impliedLits !== undefined)
        for (const other of impliedLits)
          if (this.litMark[other ^ 1] && first !== (other ^ 1)) this.litMark[other ^ 1] = false;
    }
    let next = 0;
    for (let index = 0; index < size; index++) {
      const lit = lemma[index];
      if (this.litMark[lit]) {
        this.litMark[lit] = false;
        lemma[next++] = lit;
      }
    }
    lemma.length = next;
  }

  push() {
    this.scopes.push({
      trailLim: this.trail.length,
      clausesToReinitLim: this.clausesToReinit.length,
    });
    this.scopeLvl++;
    if (this.ext !== null) {
      this.varsLim.push(this.activeVars.length);
      this.ext.push();
    }
  }

  popReinit(numScopes: number) {
    this.pop(numScopes);
    this.reinitAssumptions();
  }

  // pop_vars keeps every variable made in the popped scopes: no variable is freed for reuse.
  private popVars(numScopes: number) {
    this.varsToReinit = [];
    const oldNumVars = this.varsLim[this.varsLim.length - numScopes];
    this.varsLim.length -= numScopes;
    const newLvl = this.scopes.length - numScopes;
    for (let index = oldNumVars; index < this.activeVars.length; index++) {
      const boolVar = this.activeVars[index];
      this.varsToReinit.push(boolVar);
      this.varScope[boolVar] = newLvl;
    }
  }

  pop(numScopes: number) {
    if (numScopes === 0) return;
    if (this.ext !== null) {
      this.popVars(numScopes);
      this.ext.pop(numScopes);
    }
    const newLvl = this.scopeLvl - numScopes;
    const scope = this.scopes[newLvl];
    this.isInconsistent = false;
    this.unassignVars(scope.trailLim, newLvl);
    this.scopeLvl -= numScopes;
    this.reinitClauses(scope.clausesToReinitLim);
    this.scopes.length = newLvl;
    this.ext?.popReinit();
  }

  private unassignVars(oldSize: number, newLvl: number) {
    for (let index = this.trail.length; index-- > oldSize;) {
      const lit = this.trail[index];
      const boolVar = lit >> 1;
      if (this.lvlVar(boolVar) <= newLvl) {
        this.replayAssign.push(lit);
        continue;
      }
      this.assignment[lit] = L_UNDEF;
      this.assignment[lit ^ 1] = L_UNDEF;
      this.caseSplitQueue.unassignVar(boolVar);
    }
    this.trail.length = oldSize;
    this.qhead = oldSize;
    for (let index = this.replayAssign.length; index-- > 0;)
      this.trail.push(this.replayAssign[index]);
    this.replayAssign.length = 0;
  }

  private reinitClauses(oldSize: number) {
    const stack = this.clausesToReinit;
    let next = oldSize;
    for (let index = oldSize; index < stack.length; index += 2) {
      const first = stack[index];
      const second = stack[index + 1];
      if (second !== NULL_LITERAL) {
        if (
          (this.propagateBinClause(first, second) && !this.atBaseLvl()) ||
          (this.hasVariablesToReinitBinary(first, second) && !this.atBaseLvl())
        ) {
          stack[next++] = first;
          stack[next++] = second;
        }
        continue;
      }
      this.detachClause(first);
      const isReinit = this.attachClause(first);
      if (
        (isReinit && !this.atBaseLvl()) ||
        (this.hasVariablesToReinit(first) && !this.atBaseLvl())
      ) {
        stack[next++] = first;
        stack[next++] = second;
      } else this.arena.setReinitStack(first, false);
    }
    stack.length = next;
  }

  popToBaseLevel() {
    this.resetAssumptions();
    this.pop(this.scopeLvl);
    this.isModelCurrent = false;
  }

  incActivity(boolVar: number) {
    this.activity[boolVar] += this.activityInc;
    this.caseSplitQueue.activityIncreased(boolVar);
    if (this.activity[boolVar] > 1 << 24) this.rescaleActivity();
  }

  private rescaleActivity() {
    for (let index = 0; index < this.activity.length; index++) this.activity[index] >>>= 14;
    this.activityInc >>>= 14;
  }

  numClauses() {
    let numClauses = this.trail.length;
    for (let lit = 0; lit < this.watches.length; lit++) {
      const wlist = this.watches[lit];
      for (let index = 0; index < wlist.size; index++)
        if (wlist.isBinary(index) && (lit ^ 1) < wlist.getLiteral(index)) numClauses++;
    }
    return numClauses + this.clauses.length + this.learned.length;
  }

  doCleanup(isForced: boolean) {
    if (this.conflictsSinceInit === 0 && !isForced) return false;
    return this.atBaseLvl() && !this.isInconsistent && this.cleaner.run(isForced);
  }

  private shouldGc() {
    return (
      this.conflictsSinceGc > this.gcThreshold &&
      (this.config.gcStrategy !== GC_DYN_PSM || this.atBaseLvl())
    );
  }

  private doGc() {
    if (!this.shouldGc()) return;
    const gc = this.gcClauses;
    this.conflictsSinceGc = 0;
    this.gcThreshold += this.config.gcIncrement;
    const arena = this.arena;
    const glue = (clause: number) => arena.glue[clause];
    const psm = (clause: number) => arena.psm[clause];
    const size = (clause: number) => arena.size[clause];
    const lex =
      (...keys: ((clause: number) => number)[]) =>
      (first: number, second: number) => {
        for (const key of keys) {
          if (key(first) < key(second)) return true;
          if (key(first) > key(second)) return false;
        }
        return false;
      };
    switch (this.config.gcStrategy) {
      case GC_GLUE:
        sortClauses(this.learned, lex(glue, size));
        this.gcHalf();
        break;
      case GC_PSM:
        this.savePsm();
        sortClauses(this.learned, lex(psm, size));
        this.gcHalf();
        break;
      case GC_GLUE_PSM:
        this.savePsm();
        sortClauses(this.learned, lex(glue, psm, size));
        this.gcHalf();
        break;
      case GC_PSM_GLUE:
        this.savePsm();
        sortClauses(this.learned, lex(psm, glue, size));
        this.gcHalf();
        break;
      case GC_DYN_PSM:
        if (!this.atBaseLvl()) return;
        this.gcDynPsm();
        break;
    }
    this.ext?.gc();
    if (gc > 0 && this.shouldDefrag()) this.defragClauses();
  }

  private savePsm() {
    for (const clause of this.learned) this.arena.setPsm(clause, this.psm(clause));
  }

  private gcHalf() {
    const size = this.learned.length;
    let next = size >>> 1;
    for (let index = size >>> 1; index < size; index++) {
      const clause = this.learned[index];
      if (this.canDelete(clause)) {
        this.detachClause(clause);
        this.delClause(clause);
      } else this.learned[next++] = clause;
    }
    this.gcClauses += size - next;
    this.learned.length = next;
  }

  canDelete(clause: number) {
    if (this.arena.isOnReinitStack(clause)) return false;
    const first = this.arena.get(clause, 0);
    if (this.value(first) !== L_TRUE) return true;
    return (
      this.justKind[first >> 1] !== JUSTIFICATION_CLAUSE || this.justVal[first >> 1] !== clause
    );
  }

  private gcDynPsm() {
    let flips = 0;
    let assigned = 0;
    for (let boolVar = 0; boolVar < this.numVars(); boolVar++) {
      if (this.assignedSinceGc[boolVar]) {
        assigned++;
        this.assignedSinceGc[boolVar] = false;
      }
      if (this.phase[boolVar] !== this.prevPhase[boolVar]) {
        flips++;
        this.prevPhase[boolVar] = this.phase[boolVar];
      }
    }
    const dTk = assigned === 0 ? this.numVars() + 1 : flips / assigned;
    if (dTk < this.minDTk) this.minDTk = dTk;
    const arena = this.arena;
    let next = 0;
    for (const clause of this.learned) {
      if (!arena.isFrozen(clause)) {
        if (arena.glue[clause] > this.config.gcSmallLbd) {
          if (arena.wasUsed(clause)) arena.inactRounds[clause] = 0;
          else {
            arena.incInactRounds(clause);
            if (arena.inactRounds[clause] > this.config.gcK) {
              this.detachClause(clause);
              this.delClause(clause);
              this.gcClauses++;
              continue;
            }
          }
          arena.unmarkUsed(clause);
          if (this.psm(clause) > Math.trunc(arena.size[clause] * this.minDTk)) {
            this.detachClause(clause);
            arena.inactRounds[clause] = 0;
            arena.setFrozen(clause, true);
            this.numFrozen++;
          }
        }
      } else if (this.psm(clause) <= Math.trunc(arena.size[clause] * this.minDTk)) {
        arena.setFrozen(clause, false);
        this.numFrozen--;
        if (!this.activateFrozenClause(clause)) {
          this.delClause(clause);
          continue;
        }
      } else {
        arena.incInactRounds(clause);
        if (arena.inactRounds[clause] > this.config.gcK) {
          this.delClause(clause);
          this.gcClauses++;
          continue;
        }
      }
      this.learned[next++] = clause;
    }
    this.learned.length = next;
  }

  private activateFrozenClause(clause: number) {
    const arena = this.arena;
    const size = arena.size[clause];
    let next = 0;
    for (let index = 0; index < size; index++) {
      const value = this.value(arena.get(clause, index));
      if (value === L_TRUE) return false;
      if (value === L_UNDEF) {
        if (index !== next) arena.swap(clause, index, next);
        next++;
      }
    }
    switch (next) {
      case 0:
        this.setConflict();
        return false;
      case 1:
        this.assignUnit(arena.get(clause, 0));
        return false;
      case 2:
        this.mkBinClause(arena.get(clause, 0), arena.get(clause, 1), true);
        return false;
      default:
        this.shrink(clause, size, next);
        this.attachClause(clause);
        return true;
    }
  }

  private psm(clause: number) {
    const arena = this.arena;
    let result = 0;
    for (let index = 0; index < arena.size[clause]; index++) {
      const lit = arena.get(clause, index);
      if (((lit & 1) === 1) !== this.phase[lit >> 1]) result++;
    }
    return result;
  }
}
