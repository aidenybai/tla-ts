// Ported from Z3 (src/sat/sat_simplifier.h, src/sat/sat_simplifier.cpp,
// src/sat/sat_simplifier_params.pyg, src/sat/sat_clause_set.h, src/sat/sat_clause_set.cpp,
// src/util/heap.h, src/util/util.h), MIT license, see z3-license.txt.
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import type { RandomGen } from "../random-gen";
import { type ClauseArena, NULL_LITERAL } from "./clause";
import { UseList } from "./clause-use-list";
import { getBool, getNumber, type SatParams } from "./config";
import { MC_ABCE, MC_ACCE, MC_BCE, MC_CCE, MC_ELIM_VAR } from "./model-converter";
import type { Solver } from "./solver";
import { WATCH_CLAUSE, type WatchList } from "./watch-list";

const BCE_T = 0;
const CCE_T = 1;
const ACCE_T = 2;
const ABCE_T = 3;
const ATE_T = 4;
const NO_T = 5;

const UINT_MAX = 4294967295;

const isApproxSubset = (first: number, second: number) => (first | second) === second;

const shuffle = (lits: number[], rand: RandomGen) => {
  let size = lits.length;
  while (size-- > 0) {
    const position = rand.next() % (size + 1);
    const lit = lits[size];
    lits[size] = lits[position];
    lits[position] = lit;
  }
};

class ClauseSet {
  private idToPos = new Int32Array(0);
  private clauses: number[] = [];

  isEmpty() {
    return this.clauses.length === 0;
  }

  insert(clause: number) {
    if (clause >= this.idToPos.length) {
      const idToPos = new Int32Array(Math.max(clause + 1, 2 * this.idToPos.length)).fill(-1);
      idToPos.set(this.idToPos);
      this.idToPos = idToPos;
    }
    if (this.idToPos[clause] !== -1) return;
    this.idToPos[clause] = this.clauses.length;
    this.clauses.push(clause);
  }

  erase(clause: number) {
    if (clause >= this.idToPos.length || this.clauses.length === 0) return;
    const position = this.idToPos[clause];
    if (position === -1) return;
    this.idToPos[clause] = -1;
    const lastPosition = this.clauses.length - 1;
    if (position !== lastPosition) {
      const last = this.clauses[lastPosition];
      this.clauses[position] = last;
      this.idToPos[last] = position;
    }
    this.clauses.length = lastPosition;
  }

  eraseLast() {
    const clause = this.clauses[this.clauses.length - 1];
    this.idToPos[clause] = -1;
    this.clauses.length--;
    return clause;
  }

  reset() {
    this.idToPos = new Int32Array(0);
    this.clauses = [];
  }
}

class LiteralQueue {
  private values = [-1];
  private indices = new Int32Array(128);

  constructor(
    private useList: UseList,
    private watches: WatchList[],
  ) {}

  private getWeight(lit: number) {
    return 2 * this.useList.size[lit ^ 1] + this.watches[lit].size;
  }

  private isLess(first: number, second: number) {
    return this.getWeight(first) < this.getWeight(second);
  }

  private moveUp(start: number) {
    const values = this.values;
    const lit = values[start];
    let index = start;
    for (;;) {
      const parentIndex = index >> 1;
      if (parentIndex === 0 || !this.isLess(lit, values[parentIndex])) break;
      values[index] = values[parentIndex];
      this.indices[values[index]] = index;
      index = parentIndex;
    }
    values[index] = lit;
    this.indices[lit] = index;
  }

  private moveDown(start: number) {
    const values = this.values;
    const lit = values[start];
    const size = values.length;
    let index = start;
    for (;;) {
      const leftIndex = index << 1;
      if (leftIndex >= size) break;
      const rightIndex = leftIndex + 1;
      const minIndex =
        rightIndex < size && this.isLess(values[rightIndex], values[leftIndex])
          ? rightIndex
          : leftIndex;
      const minValue = values[minIndex];
      if (!this.isLess(minValue, lit)) break;
      values[index] = minValue;
      this.indices[minValue] = index;
      index = minIndex;
    }
    values[index] = lit;
    this.indices[lit] = index;
  }

  private reserve(size: number) {
    if (size <= this.indices.length) return;
    const indices = new Int32Array(size);
    indices.set(this.indices);
    this.indices = indices;
  }

  private contains(lit: number) {
    return lit < this.indices.length && this.indices[lit] !== 0;
  }

  private heapInsert(lit: number) {
    const index = this.values.length;
    this.indices[lit] = index;
    this.values.push(lit);
    this.moveUp(index);
  }

  isEmpty() {
    return this.values.length === 1;
  }

  insert(lit: number) {
    this.reserve(lit + 1);
    this.heapInsert(lit);
  }

  decreased(lit: number) {
    if (this.contains(lit)) this.moveUp(this.indices[lit]);
    else this.insert(lit);
  }

  next() {
    const values = this.values;
    const result = values[1];
    if (values.length === 2) {
      this.indices[result] = 0;
      values.pop();
      return result;
    }
    const last = values[values.length - 1];
    values[1] = last;
    this.indices[last] = 1;
    this.indices[result] = 0;
    values.pop();
    this.moveDown(1);
    return result;
  }

  reset() {
    if (this.isEmpty()) return;
    this.indices.fill(0);
    this.values = [-1];
  }
}

class BlockedClauseElim {
  private counter: number;
  private queue: LiteralQueue;
  private coveredClause: number[] = [];
  private anteLit: number[] = [];
  private anteClause: number[] = [];
  private isAnteFromRi: boolean[] = [];
  private intersection: number[] = [];
  private tautology: number[] = [];
  private newIntersection: number[] = [];
  private isInIntersection: Uint8Array;
  private alaQhead = 0;
  private clauseFirst = NULL_LITERAL;
  private clauseSecond = NULL_LITERAL;
  private alaCost = 0;
  private alaBenefit = 0;
  private alaMaxCost: number;
  private blocked = NULL_LITERAL;
  private kind = MC_BCE;

  constructor(
    private simplifier: Simplifier,
    limit: number,
  ) {
    const solver = simplifier.solver;
    this.counter = limit;
    this.queue = new LiteralQueue(simplifier.useList, solver.watches);
    this.isInIntersection = new Uint8Array(2 * solver.numVars());
    this.alaMaxCost = Math.trunc((solver.clauses.length * simplifier.numCalls) / 5);
  }

  private isProcessVar(boolVar: number) {
    const solver = this.simplifier.solver;
    return (
      !solver.isAssumption(boolVar) &&
      !solver.wasEliminated(boolVar) &&
      !this.simplifier.isExternal(boolVar) &&
      solver.valueVar(boolVar) === L_UNDEF
    );
  }

  private isReachedMaxCost() {
    return this.alaBenefit <= this.alaCost * 100 && this.alaCost > this.alaMaxCost;
  }

  run() {
    const simplifier = this.simplifier;
    if (simplifier.isAcceEnabled()) this.cce(ACCE_T);
    if (simplifier.isAteEnabled() && !simplifier.isAbceEnabled() && !simplifier.isAcceEnabled())
      this.cce(ATE_T);
    if (simplifier.isCceEnabled() && !simplifier.isAcceEnabled()) this.cce(CCE_T);
    if (simplifier.isAbceEnabled() && !simplifier.isAcceEnabled()) this.cce(ABCE_T);
    if (simplifier.isBceEnabled() && !simplifier.isCceEnabled() && !simplifier.isAbceEnabled())
      this.cce(BCE_T);
  }

  private insertQueue() {
    this.queue.reset();
    const numVars = this.simplifier.solver.numVars();
    for (let boolVar = 0; boolVar < numVars; boolVar++)
      if (this.isProcessVar(boolVar)) {
        this.queue.insert(2 * boolVar);
        this.queue.insert(2 * boolVar + 1);
      }
  }

  private resetIntersection() {
    for (const lit of this.intersection) this.isInIntersection[lit] = 0;
    this.intersection.length = 0;
  }

  private addIntersection(lit: number) {
    this.intersection.push(lit);
    this.isInIntersection[lit] = 1;
  }

  private resolutionIntersection(lit: number) {
    const simplifier = this.simplifier;
    const arena = simplifier.solver.arena;
    const visited = simplifier.visited;
    const notLit = lit ^ 1;
    const tautologySize = this.tautology.length;
    this.resetIntersection();
    if (!this.isProcessVar(lit >> 1)) return false;
    let isFirst = true;
    const wlist = simplifier.solver.watches[lit];
    for (let index = 0; index < wlist.size; index++) {
      if (!wlist.isBinary(index) || wlist.isLearned(index)) continue;
      const other = wlist.getLiteral(index);
      if (visited[other ^ 1] && other !== notLit) {
        this.tautology.push(other ^ 1);
        continue;
      }
      if (!isFirst || visited[other]) {
        this.resetIntersection();
        this.tautology.length = tautologySize;
        return false;
      }
      isFirst = false;
      this.addIntersection(other);
    }
    for (const clause of simplifier.useList.get(notLit)) {
      if (arena.isLearned(clause) || arena.wasRemoved(clause)) continue;
      const size = arena.size[clause];
      let isTautology = false;
      for (let index = 0; index < size; index++) {
        const other = arena.get(clause, index);
        if (visited[other ^ 1] && other !== notLit) {
          this.tautology.push(other ^ 1);
          isTautology = true;
          break;
        }
      }
      if (isTautology) continue;
      if (isFirst) {
        for (let index = 0; index < size; index++) {
          const other = arena.get(clause, index);
          if (other !== notLit && !visited[other]) this.addIntersection(other);
        }
        isFirst = false;
      } else {
        this.newIntersection.length = 0;
        for (let index = 0; index < size; index++) {
          const other = arena.get(clause, index);
          if (this.isInIntersection[other]) this.newIntersection.push(other);
        }
        this.resetIntersection();
        for (const other of this.newIntersection) this.addIntersection(other);
      }
      if (this.intersection.length === 0) {
        this.tautology.length = tautologySize;
        return false;
      }
    }
    if (this.intersection.length === 0 && !isFirst) this.tautology.length = tautologySize;
    return isFirst;
  }

  private checkAbceTautology(lit: number) {
    const simplifier = this.simplifier;
    const arena = simplifier.solver.arena;
    const visited = simplifier.visited;
    const notLit = lit ^ 1;
    const tautologySize = this.tautology.length;
    if (!this.isProcessVar(lit >> 1)) return false;
    const wlist = simplifier.solver.watches[lit];
    for (let index = 0; index < wlist.size; index++) {
      if (!wlist.isBinary(index) || wlist.isLearned(index)) continue;
      const other = wlist.getLiteral(index);
      if (!visited[other ^ 1]) {
        this.tautology.length = tautologySize;
        return false;
      }
      this.tautology.push(other ^ 1);
    }
    for (const clause of simplifier.useList.get(notLit)) {
      if (arena.isLearned(clause) || arena.wasRemoved(clause)) continue;
      let isTautology = false;
      for (let index = 0; index < arena.size[clause]; index++) {
        const other = arena.get(clause, index);
        if (visited[other ^ 1] && other !== notLit) {
          isTautology = true;
          this.tautology.push(other ^ 1);
          break;
        }
      }
      if (!isTautology) {
        this.tautology.length = tautologySize;
        return false;
      }
    }
    return true;
  }

  private isRevisitBinary(first: number, second: number) {
    return (
      this.clauseSecond !== NULL_LITERAL &&
      ((this.clauseFirst === first && this.clauseSecond === second) ||
        (this.clauseFirst === second && this.clauseSecond === first))
    );
  }

  private isRevisitClause(clause: number) {
    return this.clauseSecond === NULL_LITERAL && this.clauseFirst === clause;
  }

  private minimizeCoveredClause(start: number) {
    const simplifier = this.simplifier;
    const arena = simplifier.solver.arena;
    const visited = simplifier.visited;
    const covered = this.coveredClause;
    let last = start;
    for (const lit of covered) visited[lit] = 0;
    for (const lit of this.tautology) visited[lit] = 1;
    visited[covered[last]] = 1;
    for (let index = 0; index < covered.length; index++) {
      const lit = covered[index];
      if (this.anteLit[index] === NULL_LITERAL && this.anteClause[index] === -1) visited[lit] = 1;
      if (visited[lit]) last = index;
    }
    for (let index = last; index > 0; index--) {
      const lit = covered[index];
      if (!visited[lit]) continue;
      const clause = this.anteClause[index];
      if (clause !== -1)
        for (let position = 0; position < arena.size[clause]; position++) {
          const other = arena.get(clause, position);
          if (other !== (lit ^ 1)) visited[other] = 1;
        }
      if (this.anteLit[index] !== NULL_LITERAL) visited[this.anteLit[index]] = 1;
    }
    let next = 0;
    let blocked = NULL_LITERAL;
    const elimStack = simplifier.solver.mc.elimStack;
    for (let index = 0; index <= last; index++) {
      const lit = covered[index];
      if (!visited[lit]) continue;
      if (this.isAnteFromRi[index] && blocked !== this.anteLit[index]) {
        blocked = this.anteLit[index];
        elimStack.push(next, blocked);
      }
      covered[next++] = lit;
      visited[lit] = 0;
    }
    covered.length = next;
  }

  private pushCovered(lit: number, anteLit: number, anteClause: number, isFromRi: boolean) {
    this.coveredClause.push(lit);
    this.anteLit.push(anteLit);
    this.anteClause.push(anteClause);
    this.isAnteFromRi.push(isFromRi);
  }

  private addAla() {
    const simplifier = this.simplifier;
    const solver = simplifier.solver;
    const arena = solver.arena;
    const visited = simplifier.visited;
    const covered = this.coveredClause;
    const initSize = covered.length;
    for (
      ;
      this.alaQhead < covered.length && this.alaQhead < 5 * initSize && !this.isReachedMaxCost();
      this.alaQhead++
    ) {
      this.alaCost++;
      const lit = covered[this.alaQhead];
      const wlist = solver.watches[lit ^ 1];
      for (let index = 0; index < wlist.size; index++) {
        if (!wlist.isBinary(index) || wlist.isLearned(index)) continue;
        const other = wlist.getLiteral(index);
        if (this.isRevisitBinary(lit, other)) continue;
        if (visited[other]) {
          this.alaBenefit++;
          return true;
        }
        if (!visited[other ^ 1]) {
          this.pushCovered(other ^ 1, lit, -1, false);
          visited[other ^ 1] = 1;
        }
      }
      for (const clause of simplifier.useList.get(lit)) {
        if (arena.isLearned(clause) || arena.wasRemoved(clause)) continue;
        if (this.isRevisitClause(clause)) continue;
        let lit1 = NULL_LITERAL;
        let isOk = true;
        for (let index = 0; index < arena.size[clause]; index++) {
          const other = arena.get(clause, index);
          if (other === lit || visited[other]) continue;
          if (!visited[other ^ 1] && lit1 === NULL_LITERAL) lit1 = other;
          else {
            isOk = false;
            break;
          }
        }
        if (!isOk) continue;
        if (lit1 === NULL_LITERAL) {
          this.alaBenefit++;
          return true;
        }
        this.pushCovered(lit1 ^ 1, NULL_LITERAL, clause, false);
        visited[lit1 ^ 1] = 1;
      }
    }
    return false;
  }

  private addCla() {
    const visited = this.simplifier.visited;
    const covered = this.coveredClause;
    for (let index = 0; index < covered.length; index++) {
      const lit = covered[index];
      if (this.resolutionIntersection(lit)) {
        this.blocked = covered[index];
        this.minimizeCoveredClause(index);
        return true;
      }
      for (const other of this.intersection)
        if (!visited[other]) {
          visited[other] = 1;
          this.pushCovered(other, lit, -1, true);
        }
    }
    return false;
  }

  private resetMark() {
    const visited = this.simplifier.visited;
    for (const lit of this.coveredClause) visited[lit] = 0;
  }

  private cceCore(elimType: number) {
    const simplifier = this.simplifier;
    const solver = simplifier.solver;
    const visited = simplifier.visited;
    const covered = this.coveredClause;
    let isFirst = true;
    let size = 0;
    const size0 = covered.length;
    for (const lit of covered) visited[lit] = 1;
    shuffle(covered, solver.rand);
    this.tautology.length = 0;
    solver.mc.elimStack.length = 0;
    this.alaQhead = 0;
    this.kind = elimType === CCE_T ? MC_CCE : elimType === ACCE_T ? MC_ACCE : MC_BCE;
    if (elimType === ATE_T) {
      const isAla = this.addAla();
      this.resetMark();
      covered.length = size0;
      return isAla ? ATE_T : NO_T;
    }
    while (covered.length > size && size0 * 400 >= covered.length) {
      if ((elimType === ABCE_T || elimType === ACCE_T) && this.addAla()) {
        this.resetMark();
        if (isFirst) covered.length = size0;
        else {
          for (const lit of covered) {
            this.tautology.push(lit);
            visited[lit] = 1;
          }
          this.minimizeCoveredClause(covered.length - 1);
        }
        return ATE_T;
      }
      if (isFirst)
        for (let index = 0; index < size0; index++)
          if (this.checkAbceTautology(covered[index])) {
            this.blocked = covered[index];
            this.resetMark();
            covered.length = size0;
            if (elimType === BCE_T) return BCE_T;
            this.kind = MC_ABCE;
            return ABCE_T;
          }
      isFirst = false;
      if (elimType === ABCE_T || elimType === BCE_T) break;
      size = covered.length;
      if ((elimType === CCE_T || elimType === ACCE_T) && this.addCla()) {
        this.resetMark();
        return elimType;
      }
    }
    this.resetMark();
    return NO_T;
  }

  private resetCovered() {
    this.coveredClause.length = 0;
    this.anteLit.length = 0;
    this.anteClause.length = 0;
    this.isAnteFromRi.length = 0;
  }

  private cceClause(clause: number, elimType: number) {
    const arena = this.simplifier.solver.arena;
    this.clauseFirst = clause;
    this.clauseSecond = NULL_LITERAL;
    this.resetCovered();
    for (let index = 0; index < arena.size[clause]; index++)
      this.pushCovered(arena.get(clause, index), NULL_LITERAL, -1, false);
    return this.cceCore(elimType);
  }

  private cceBinary(first: number, second: number, elimType: number) {
    this.clauseFirst = first;
    this.clauseSecond = second;
    this.resetCovered();
    this.pushCovered(first, NULL_LITERAL, -1, false);
    this.pushCovered(second, NULL_LITERAL, -1, false);
    return this.cceCore(elimType);
  }

  private cce(elimType: number) {
    this.insertQueue();
    this.cceClauses(elimType);
    this.cceBinaries(elimType);
  }

  private cceBinaries(elimType: number) {
    this.alaCost = 0;
    this.alaBenefit = 0;
    while (!this.queue.isEmpty() && this.counter >= 0 && !this.isReachedMaxCost()) {
      this.simplifier.solver.checkpoint();
      this.processCceBinary(this.queue.next(), elimType);
    }
  }

  private processCceBinary(lit: number, elimType: number) {
    const solver = this.simplifier.solver;
    const wlist = solver.watches[lit ^ 1];
    const size = wlist.size;
    this.counter -= size;
    for (let index = 0; index < size; index++) {
      if (!wlist.isBinary(index) || wlist.isLearned(index)) continue;
      if (!this.isSelectClause(2)) continue;
      const other = wlist.getLiteral(index);
      const result = this.cceBinary(lit, other, elimType);
      this.incBc(result);
      if (result === ATE_T) {
        wlist.setLearned(index, true);
        solver.setLearned1(other, lit, true);
        solver.mc.addAte(this.coveredClause);
      } else if (result !== NO_T) {
        wlist.setLearned(index, true);
        solver.setLearned1(other, lit, true);
        this.blockCoveredBinary(other, lit);
      }
      solver.checkpoint();
    }
  }

  private cceClauses(elimType: number) {
    const simplifier = this.simplifier;
    const solver = simplifier.solver;
    const arena = solver.arena;
    this.alaCost = 0;
    this.alaBenefit = 0;
    const start = solver.rand.next();
    const size = solver.clauses.length;
    for (let index = 0; index < size; index++) {
      const clause = solver.clauses[(index + start) % size];
      if (arena.wasRemoved(clause) || arena.isLearned(clause)) continue;
      if (!this.isSelectClause(arena.size[clause])) continue;
      const result = this.cceClause(clause, elimType);
      this.incBc(result);
      if (result === ATE_T) {
        solver.mc.addAte(this.coveredClause);
        simplifier.setLearnedClause(clause);
      } else if (result !== NO_T) {
        this.blockCoveredClause(clause);
        simplifier.setLearnedClause(clause);
      }
      solver.checkpoint();
      if (this.isReachedMaxCost()) break;
    }
  }

  private incBc(elimType: number) {
    const simplifier = this.simplifier;
    if (elimType === CCE_T) simplifier.numCce++;
    else if (elimType === ACCE_T) simplifier.numAcce++;
    else if (elimType === ABCE_T) simplifier.numAbce++;
    else if (elimType === ATE_T) simplifier.numAte++;
    else if (elimType === BCE_T) simplifier.numBce++;
  }

  private isSelectClause(size: number) {
    return size > 3 || this.simplifier.solver.rand.next() % 4 === 0;
  }

  private blockCoveredClause(clause: number) {
    const solver = this.simplifier.solver;
    const arena = solver.arena;
    const entry = solver.mc.mk(this.kind, this.blocked >> 1);
    for (let index = 0; index < arena.size[clause]; index++) {
      const lit = arena.get(clause, index);
      if (lit !== this.blocked && this.isProcessVar(lit >> 1)) this.queue.decreased(lit ^ 1);
    }
    solver.mc.insert(entry, this.coveredClause);
    solver.mc.setClause(entry, arena.getLits(clause));
  }

  private blockCoveredBinary(other: number, lit: number) {
    const solver = this.simplifier.solver;
    const entry = solver.mc.mk(this.kind, this.blocked >> 1);
    this.simplifier.setLearnedBinary(lit, other);
    solver.mc.insert(entry, this.coveredClause);
    solver.mc.setClause(entry, [lit, other]);
    if (this.isProcessVar(other >> 1)) this.queue.decreased(other ^ 1);
  }
}

export class Simplifier {
  numCalls = 0;
  useList: UseList;
  private readonly extUseVars = new Set<number>();
  private subTodo = new ClauseSet();
  private subBinTodo: number[] = [];
  private lastSubTrailSize = 0;
  private elimTodo: number[] = [];
  private isInElimTodo = new Uint8Array(0);
  private isNeedingCleanup = false;
  private dummy = -1;
  private dummyArena: ClauseArena | undefined;
  visited = new Uint8Array(0);
  private subCounter = 0;
  private elimCounter = 0;
  private resolventLit = NULL_LITERAL;
  private isAbce: boolean;
  private isCce: boolean;
  private isAcce: boolean;
  private bceDelay: number;
  private isBce: boolean;
  private isAte: boolean;
  private bceAt: number;
  private blockedClauseLimit: number;
  readonly isIncrementalMode: boolean;
  private resLimit: number;
  private resOccCutoff: number;
  private resOccCutoff1: number;
  private resOccCutoff2: number;
  private resOccCutoff3: number;
  private resLitCutoff1: number;
  private resLitCutoff2: number;
  private resLitCutoff3: number;
  private resClsCutoff1: number;
  private resClsCutoff2: number;
  private isSubsumption: boolean;
  private subsumptionLimit: number;
  readonly isElimVars: boolean;
  numBce = 0;
  numCce = 0;
  numAcce = 0;
  numAbce = 0;
  numAte = 0;
  numSubsumed = 0;
  numElimVars = 0;
  numSubRes = 0;
  numElimLits = 0;
  private isLearnedInUseLists = false;
  private oldNumElimVars = 0;
  private bsClauses: number[] = [];
  private bsLits: number[] = [];
  private posClauses: number[] = [];
  private negClauses: number[] = [];
  private newClause: number[] = [];

  constructor(
    readonly solver: Solver,
    params: SatParams,
  ) {
    this.useList = new UseList(solver.arena, 0);
    this.isCce = getBool(params, "cce", false);
    this.isAcce = getBool(params, "acce", false);
    this.isAbce = getBool(params, "abce", false);
    this.isAte = getBool(params, "ate", true);
    this.bceDelay = getNumber(params, "bce_delay", 2);
    this.isBce = getBool(params, "bce", false);
    this.bceAt = getNumber(params, "bce_at", 2);
    this.blockedClauseLimit = getNumber(params, "blocked_clause_limit", 100000000);
    this.resLimit = getNumber(params, "resolution.limit", 500000000);
    this.resOccCutoff = getNumber(params, "resolution.occ_cutoff", 10);
    this.resOccCutoff1 = getNumber(params, "resolution.occ_cutoff_range1", 8);
    this.resOccCutoff2 = getNumber(params, "resolution.occ_cutoff_range2", 5);
    this.resOccCutoff3 = getNumber(params, "resolution.occ_cutoff_range3", 3);
    this.resLitCutoff1 = getNumber(params, "resolution.lit_cutoff_range1", 700);
    this.resLitCutoff2 = getNumber(params, "resolution.lit_cutoff_range2", 400);
    this.resLitCutoff3 = getNumber(params, "resolution.lit_cutoff_range3", 300);
    this.resClsCutoff1 = getNumber(params, "resolution.cls_cutoff1", 100000000);
    this.resClsCutoff2 = getNumber(params, "resolution.cls_cutoff2", 700000000);
    this.isSubsumption = getBool(params, "subsumption", true);
    this.subsumptionLimit = getNumber(params, "subsumption.limit", 100000000);
    this.isElimVars = getBool(params, "elim_vars", true);
    this.isIncrementalMode =
      solver.isIncremental() && !getBool(params, "override_incremental", false);
  }

  isExternal(boolVar: number) {
    const solver = this.solver;
    if (!solver.isExternal(boolVar)) return solver.isAssumption(boolVar);
    return (
      solver.isIncremental() ||
      solver.ext?.isExternal?.(boolVar) === true ||
      this.extUseVars.has(boolVar)
    );
  }

  private isBceEnabledBase() {
    return (
      !this.isIncrementalMode &&
      !this.solver.trackingAssumptions() &&
      !this.isLearnedInUseLists &&
      this.numCalls >= this.bceDelay
    );
  }

  isAteEnabled() {
    return this.numCalls >= this.bceDelay && this.isAte;
  }

  isBceEnabled() {
    return (
      this.isBceEnabledBase() &&
      (this.isBce || this.bceAt === this.numCalls || this.isAcce || this.isAbce || this.isCce)
    );
  }

  isAcceEnabled() {
    return this.isBceEnabledBase() && this.isAcce;
  }

  isCceEnabled() {
    return this.isBceEnabledBase() && (this.isCce || this.isAcce);
  }

  isAbceEnabled() {
    return this.isBceEnabledBase() && this.isAbce;
  }

  private isElimVarsEnabled() {
    return !this.isIncrementalMode && !this.solver.trackingAssumptions() && this.isElimVars;
  }

  insertElimTodo(boolVar: number) {
    if (boolVar >= this.isInElimTodo.length) {
      const isInElimTodo = new Uint8Array(Math.max(boolVar + 1, 2 * this.isInElimTodo.length));
      isInElimTodo.set(this.isInElimTodo);
      this.isInElimTodo = isInElimTodo;
    }
    if (this.isInElimTodo[boolVar]) return;
    this.isInElimTodo[boolVar] = 1;
    this.elimTodo.push(boolVar);
  }

  resetTodos() {
    this.resetElimTodo();
    this.subTodo.reset();
    this.subBinTodo = [];
  }

  private resetElimTodo() {
    for (const boolVar of this.elimTodo) this.isInElimTodo[boolVar] = 0;
    this.elimTodo.length = 0;
  }

  initSearch() {
    this.numCalls = 0;
  }

  private registerClauses(clauses: number[]) {
    const arena = this.solver.arena;
    clauses.sort((first, second) => arena.size[second] - arena.size[first]);
    for (const clause of clauses) {
      if (arena.isFrozen(clause)) continue;
      this.useList.insert(clause);
      if (arena.isStrengthened(clause)) this.subTodo.insert(clause);
    }
  }

  private removeClause(clause: number) {
    const arena = this.solver.arena;
    if (arena.wasRemoved(clause)) return;
    for (let index = 0; index < arena.size[clause]; index++)
      this.insertElimTodo(arena.get(clause, index) >> 1);
    this.subTodo.erase(clause);
    arena.setRemoved(clause, true);
    this.isNeedingCleanup = true;
    this.useList.erase(clause);
  }

  setLearnedClause(clause: number) {
    this.isNeedingCleanup = true;
    this.solver.arena.setLearned(clause, true);
    this.useList.block(clause);
  }

  setLearnedBinary(first: number, second: number) {
    this.eraseSubBin(first, second, false);
    this.eraseSubBin(second, first, false);
    this.subBinTodo.push(first, (second << 1) | 1, second, (first << 1) | 1);
  }

  private eraseSubBin(first: number, second: number, isLearned: boolean) {
    const todo = this.subBinTodo;
    const encoded = (second << 1) | (isLearned ? 1 : 0);
    const swapped = (first << 1) | (isLearned ? 1 : 0);
    for (let index = 0; index < todo.length; index += 2) {
      const isEqual =
        (todo[index] === first && todo[index + 1] === encoded) ||
        (todo[index] === second && todo[index + 1] === swapped);
      if (!isEqual) continue;
      todo.splice(index, 2);
      return;
    }
  }

  private initVisited() {
    this.visited = new Uint8Array(2 * this.solver.numVars());
  }

  private finalize() {
    this.useList = new UseList(this.solver.arena, 0);
    this.extUseVars.clear();
    this.subTodo.reset();
    this.subBinTodo = [];
    this.resetElimTodo();
    this.visited = new Uint8Array(0);
    this.bsClauses = [];
    this.bsLits = [];
  }

  private initialize() {
    const solver = this.solver;
    this.isNeedingCleanup = false;
    solver.cleaner.run(true);
    this.lastSubTrailSize = solver.trail.length;
    this.useList = new UseList(solver.arena, solver.numVars());
    solver.ext?.initUseList(this.extUseVars);
    this.subTodo.reset();
    this.subBinTodo.length = 0;
    this.resetElimTodo();
    this.initVisited();
  }

  run(isLearned: boolean) {
    const solver = this.solver;
    if (solver.isInconsistent) return;
    if (!this.isSubsumption && !this.isBceEnabled() && !this.isElimVarsEnabled()) return;
    this.initialize();
    solver.cleaner.run(true);
    this.isNeedingCleanup = false;
    this.useList = new UseList(solver.arena, solver.numVars());
    this.isLearnedInUseLists = isLearned;
    if (isLearned) this.registerClauses(solver.learned);
    this.registerClauses(solver.clauses);
    if (!isLearned && (this.isBceEnabled() || this.isAteEnabled()))
      new BlockedClauseElim(this, this.blockedClauseLimit).run();
    if (!isLearned) this.numCalls++;
    this.subCounter = this.subsumptionLimit;
    this.elimCounter = this.resLimit;
    this.oldNumElimVars = this.numElimVars;
    for (let boolVar = 0; boolVar < solver.numVars(); boolVar++)
      if (!solver.eliminated[boolVar] && !this.isExternal(boolVar)) this.insertElimTodo(boolVar);
    let count = 0;
    do {
      if (this.isSubsumption) this.subsume();
      if (solver.isInconsistent) return;
      if (!isLearned && this.isElimVarsEnabled()) this.elimVars();
      if (solver.isInconsistent) return;
      if (!this.isSubsumption || this.subCounter < 0) break;
      count++;
    } while (!this.subTodo.isEmpty() && count < 20);
    const isVarsEliminated = this.numElimVars > this.oldNumElimVars;
    if (this.isNeedingCleanup || isVarsEliminated) {
      this.cleanupWatches();
      this.moveClauses(solver.learned, true);
      this.moveClauses(solver.clauses, false);
      this.cleanupClauses(solver.learned, true, isVarsEliminated);
      this.cleanupClauses(solver.clauses, false, isVarsEliminated);
    }
    this.finalize();
  }

  private cleanupWatches() {
    for (const wlist of this.solver.watches) {
      let next = 0;
      for (let index = 0; index < wlist.size; index++)
        if (wlist.getKind(index) !== WATCH_CLAUSE) wlist.copy(next++, index);
      wlist.setEnd(next);
    }
  }

  private moveClauses(clauses: number[], isLearned: boolean) {
    const solver = this.solver;
    const arena = solver.arena;
    const size = clauses.length;
    let next = 0;
    for (let index = 0; index < size; index++) {
      const clause = clauses[index];
      if (isLearned && !arena.isLearned(clause)) solver.clauses.push(clause);
      else if (!isLearned && arena.isLearned(clause)) solver.learned.push(clause);
      else clauses[next++] = clause;
    }
    clauses.length = next;
  }

  private cleanupClauses(clauses: number[], isLearned: boolean, isVarsEliminated: boolean) {
    const solver = this.solver;
    const arena = solver.arena;
    let next = 0;
    for (let index = 0; index < clauses.length; index++) {
      const clause = clauses[index];
      if (arena.wasRemoved(clause)) {
        solver.delClause(clause);
        continue;
      }
      if (isLearned && isVarsEliminated) {
        let isEliminated = false;
        for (let position = 0; position < arena.size[clause] && !isEliminated; position++)
          isEliminated = solver.wasEliminated(arena.get(clause, position) >> 1);
        if (isEliminated) {
          solver.delClause(clause);
          continue;
        }
      }
      const size0 = arena.size[clause];
      if (this.cleanupClause(clause)) {
        solver.delClause(clause);
        continue;
      }
      switch (arena.size[clause]) {
        case 0:
          solver.setConflict();
          for (; index < clauses.length; index++, next++) clauses[next] = clauses[index];
          clauses.length = next;
          return;
        case 1:
          solver.assignUnit(arena.get(clause, 0));
          arena.restore(clause, size0);
          solver.delClause(clause);
          break;
        case 2:
          solver.mkBinClause(arena.get(clause, 0), arena.get(clause, 1), arena.isLearned(clause));
          arena.restore(clause, size0);
          solver.delClause(clause);
          break;
        default:
          solver.shrink(clause, size0, arena.size[clause]);
          clauses[next++] = clause;
          if (!arena.isFrozen(clause)) solver.attachClause(clause);
      }
    }
    clauses.length = next;
  }

  private getMinOccVar(clause: number) {
    const arena = this.solver.arena;
    const sizes = this.useList.size;
    let bestLit = NULL_LITERAL;
    let best = UINT_MAX;
    for (let index = 0; index < arena.size[clause]; index++) {
      const lit = arena.get(clause, index);
      const count = sizes[lit] + sizes[lit ^ 1];
      if (count < best) {
        bestLit = lit;
        best = count;
      }
    }
    return bestLit >> 1;
  }

  private isSubsumes1(first: number, second: number) {
    const arena = this.solver.arena;
    const visited = this.visited;
    const secondSize = arena.size[second];
    for (let index = 0; index < secondSize; index++) visited[arena.get(second, index)] = 1;
    let isSubsumed = true;
    let resolventLit = NULL_LITERAL;
    for (let index = 0; index < arena.size[first]; index++) {
      const lit = arena.get(first, index);
      if (visited[lit]) continue;
      if (resolventLit === NULL_LITERAL && visited[lit ^ 1]) resolventLit = lit ^ 1;
      else {
        resolventLit = NULL_LITERAL;
        isSubsumed = false;
        break;
      }
    }
    for (let index = 0; index < secondSize; index++) visited[arena.get(second, index)] = 0;
    this.resolventLit = resolventLit;
    return isSubsumed;
  }

  private collectSubsumed1Core(first: number, target: number) {
    const arena = this.solver.arena;
    for (const second of this.useList.get(target)) {
      if (arena.wasRemoved(second)) continue;
      if (
        second !== first &&
        arena.size[first] <= arena.size[second] &&
        isApproxSubset(arena.approx[first], arena.approx[second])
      ) {
        this.subCounter -= arena.size[first] + arena.size[second];
        if (this.isSubsumes1(first, second)) {
          this.bsClauses.push(second);
          this.bsLits.push(this.resolventLit);
        }
      }
    }
  }

  private backSubsumption1(first: number) {
    const solver = this.solver;
    const arena = solver.arena;
    this.bsClauses.length = 0;
    this.bsLits.length = 0;
    const boolVar = this.getMinOccVar(first);
    this.collectSubsumed1Core(first, 2 * boolVar);
    this.collectSubsumed1Core(first, 2 * boolVar + 1);
    for (let index = 0; index < this.bsClauses.length; index++) {
      const second = this.bsClauses[index];
      const lit = this.bsLits[index];
      if (!arena.wasRemoved(second) && lit === NULL_LITERAL) {
        if (arena.isLearned(first) && !arena.isLearned(second)) this.setNotLearned(first);
        this.removeClause(second);
        this.numSubsumed++;
      } else if (!arena.wasRemoved(second)) {
        this.elimLit(second, lit);
        this.numSubRes++;
      }
      if (solver.isInconsistent) break;
    }
  }

  private setNotLearned(clause: number) {
    this.solver.arena.setLearned(clause, false);
    if (clause !== this.dummy) this.useList.unblock(clause);
  }

  private setDummy(first: number, second: number, isLearned: boolean) {
    const arena = this.solver.arena;
    if (this.dummyArena !== arena) {
      this.dummyArena = arena;
      this.dummy = arena.mkClause([first, second], 2, isLearned);
      return this.dummy;
    }
    arena.set(this.dummy, 0, first);
    arena.set(this.dummy, 1, second);
    arena.setLearned(this.dummy, isLearned);
    arena.updateApprox(this.dummy);
    return this.dummy;
  }

  private getMinOccVar0(clause: number) {
    const arena = this.solver.arena;
    const sizes = this.useList.size;
    let bestLit = NULL_LITERAL;
    let best = UINT_MAX;
    for (let index = 0; index < arena.size[clause]; index++) {
      const lit = arena.get(clause, index);
      if (sizes[lit] < best) {
        bestLit = lit;
        best = sizes[lit];
      }
    }
    return bestLit;
  }

  private isSubsumes0(first: number, second: number) {
    const arena = this.solver.arena;
    const visited = this.visited;
    const secondSize = arena.size[second];
    for (let index = 0; index < secondSize; index++) visited[arena.get(second, index)] = 1;
    let isSubsumed = true;
    for (let index = 0; index < arena.size[first] && isSubsumed; index++)
      isSubsumed = visited[arena.get(first, index)] === 1;
    for (let index = 0; index < secondSize; index++) visited[arena.get(second, index)] = 0;
    return isSubsumed;
  }

  private backSubsumption0(first: number) {
    const arena = this.solver.arena;
    this.bsClauses.length = 0;
    for (const second of this.useList.get(this.getMinOccVar0(first))) {
      if (arena.wasRemoved(second)) continue;
      if (
        second !== first &&
        arena.size[first] <= arena.size[second] &&
        isApproxSubset(arena.approx[first], arena.approx[second])
      ) {
        this.subCounter -= arena.size[first] + arena.size[second];
        if (this.isSubsumes0(first, second)) this.bsClauses.push(second);
      }
    }
    for (const second of this.bsClauses) {
      if (arena.isLearned(first) && !arena.isLearned(second)) this.setNotLearned(first);
      this.removeClause(second);
      this.numSubsumed++;
    }
  }

  private cleanupClause(clause: number) {
    const solver = this.solver;
    const arena = solver.arena;
    let isSatisfied = false;
    const size = arena.size[clause];
    let next = 0;
    for (let index = 0; index < size; index++) {
      const value = solver.value(arena.get(clause, index));
      if (value === L_FALSE) {
        this.isNeedingCleanup = true;
        continue;
      }
      if (value === L_TRUE) isSatisfied = true;
      if (index !== next) arena.swap(clause, next, index);
      next++;
    }
    if (next < size && !isSatisfied) {
      if (next > 2) solver.shrink(clause, size, next);
      else arena.shrink(clause, next);
    }
    return isSatisfied;
  }

  private cleanupLits(lits: number[]) {
    const solver = this.solver;
    let next = 0;
    for (let index = 0; index < lits.length; index++) {
      const lit = lits[index];
      const value = solver.value(lit);
      if (value === L_TRUE) return true;
      if (value === L_FALSE) continue;
      if (index !== next) {
        lits[index] = lits[next];
        lits[next] = lit;
      }
      next++;
    }
    lits.length = next;
    return false;
  }

  private propagateUnit(lit: number) {
    const solver = this.solver;
    const arena = solver.arena;
    const oldTrailSize = solver.trail.length;
    const numClauses = solver.clauses.length;
    solver.assignScoped(lit);
    solver.propagateCore(false);
    if (solver.isInconsistent) return;
    const newTrailSize = solver.trail.length;
    for (let index = oldTrailSize; index < newTrailSize; index++) {
      const trueLit = solver.trail[index];
      for (const clause of this.useList.get(trueLit ^ 1))
        if (!arena.wasRemoved(clause)) this.subTodo.insert(clause);
      for (const clause of this.useList.get(trueLit))
        if (!arena.wasRemoved(clause)) this.removeClause(clause);
      this.useList.reset(trueLit);
    }
    for (let index = numClauses; index < solver.clauses.length; index++)
      this.useList.insert(solver.clauses[index]);
  }

  private elimLit(clause: number, lit: number) {
    const solver = this.solver;
    const arena = solver.arena;
    this.isNeedingCleanup = true;
    this.numElimLits++;
    this.insertElimTodo(lit >> 1);
    arena.elim(clause, lit);
    this.useList.eraseNotRemoved(lit, clause);
    this.subCounter -= Math.trunc(this.useList.size[lit] / 2);
    const size0 = arena.size[clause];
    if (this.cleanupClause(clause)) {
      this.removeClause(clause);
      return;
    }
    switch (arena.size[clause]) {
      case 0:
        solver.setConflict();
        break;
      case 1:
        arena.restore(clause, size0);
        this.propagateUnit(arena.get(clause, 0));
        break;
      case 2: {
        arena.restore(clause, size0);
        const first = arena.get(clause, 0);
        const second = arena.get(clause, 1);
        const isLearned = arena.isLearned(clause);
        solver.mkBinClause(first, second, isLearned);
        this.subBinTodo.push(first, (second << 1) | (isLearned ? 1 : 0));
        this.removeClause(clause);
        break;
      }
      default:
        this.subTodo.insert(clause);
    }
  }

  private subsumeWithBinaries() {
    const solver = this.solver;
    const init = solver.rand.next();
    const numLits = solver.watches.length;
    for (let index = 0; index < numLits; index++) {
      const litIndex = (index + init) % numLits;
      const wlist = solver.watches[litIndex];
      const lit = litIndex ^ 1;
      for (let position = 0; position < wlist.size; position++) {
        if (!wlist.isBinary(position) || wlist.isLearned(position)) continue;
        const other = wlist.getLiteral(position);
        if (lit >= other) continue;
        this.backSubsumption1(this.setDummy(lit, other, false));
        if (solver.isInconsistent) return;
      }
      if (this.subCounter < 0) break;
    }
  }

  private markAsNotLearnedCore(wlist: WatchList, lit: number) {
    for (let index = 0; index < wlist.size; index++)
      if (wlist.isBinary(index) && wlist.getLiteral(index) === lit && wlist.isLearned(index)) {
        wlist.setLearned(index, false);
        return;
      }
  }

  private elimDupBins() {
    const solver = this.solver;
    let numElim = 0;
    for (const wlist of solver.watches) {
      solver.checkpoint();
      const size = wlist.size;
      const order = Array.from({ length: size }, (_, index) => index);
      const getRank = (index: number) =>
        wlist.isBinary(index)
          ? 2 * wlist.getLiteral(index) + (wlist.isLearned(index) ? 1 : 0)
          : Number.MAX_SAFE_INTEGER;
      order.sort((first, second) => getRank(first) - getRank(second));
      const data = wlist.data.slice(0, 2 * size);
      let next = 0;
      let lastLit = NULL_LITERAL;
      for (const index of order) {
        const val1 = data[2 * index];
        const val2 = data[2 * index + 1];
        if ((val2 & 3) === 0) {
          if (val1 === lastLit) {
            numElim++;
            continue;
          }
          lastLit = val1;
        }
        wlist.data[2 * next] = val1;
        wlist.data[2 * next + 1] = val2;
        next++;
      }
      wlist.setEnd(next);
    }
    this.numSubsumed += Math.trunc(numElim / 2);
  }

  private subsume() {
    const solver = this.solver;
    const arena = solver.arena;
    this.elimDupBins();
    this.subsumeWithBinaries();
    for (;;) {
      this.subCounter -= this.subBinTodo.length / 2;
      while (this.subBinTodo.length > 0) {
        solver.checkpoint();
        const encoded = this.subBinTodo[this.subBinTodo.length - 1];
        const first = this.subBinTodo[this.subBinTodo.length - 2];
        this.subBinTodo.length -= 2;
        const isLearned = (encoded & 1) === 1;
        const dummy = this.setDummy(first, encoded >> 1, isLearned);
        this.backSubsumption1(dummy);
        if (isLearned && !arena.isLearned(dummy)) {
          this.markAsNotLearnedCore(solver.watches[first ^ 1], encoded >> 1);
          this.markAsNotLearnedCore(solver.watches[(encoded >> 1) ^ 1], first);
        }
      }
      solver.checkpoint();
      if (this.subTodo.isEmpty()) {
        this.lastSubTrailSize = solver.trail.length;
        break;
      }
      if (this.subCounter < 0) break;
      const clause = this.subTodo.eraseLast();
      arena.unmarkStrengthened(clause);
      this.subCounter--;
      if (solver.trail.length > this.lastSubTrailSize) {
        const size0 = arena.size[clause];
        if (this.cleanupClause(clause)) {
          this.removeClause(clause);
          continue;
        }
        const size = arena.size[clause];
        if (size === 0) {
          solver.setConflict();
          return;
        }
        if (size === 1) {
          arena.restore(clause, size0);
          this.propagateUnit(arena.get(clause, 0));
          continue;
        }
        if (size === 2) {
          const first = arena.get(clause, 0);
          const second = arena.get(clause, 1);
          const isLearned = arena.isLearned(clause);
          solver.mkBinClause(first, second, isLearned);
          this.subBinTodo.push(first, (second << 1) | (isLearned ? 1 : 0));
          arena.restore(clause, size0);
          this.removeClause(clause);
          continue;
        }
      }
      this.backSubsumption1(clause);
    }
  }

  private numNonlearnedBin(lit: number) {
    const wlist = this.solver.watches[lit ^ 1];
    let count = 0;
    for (let index = 0; index < wlist.size; index++)
      if (wlist.isBinary(index) && !wlist.isLearned(index)) count++;
    return count;
  }

  private orderVarsForElim() {
    const solver = this.solver;
    const sizes = this.useList.size;
    const vars: number[] = [];
    const costs: number[] = [];
    for (const boolVar of this.elimTodo) {
      if (this.isExternal(boolVar)) continue;
      if (solver.wasEliminated(boolVar)) continue;
      if (solver.valueVar(boolVar) !== L_UNDEF) continue;
      const numPos = sizes[2 * boolVar];
      const numNeg = sizes[2 * boolVar + 1];
      const numBinPos = this.numNonlearnedBin(2 * boolVar);
      const numBinNeg = this.numNonlearnedBin(2 * boolVar + 1);
      costs[boolVar] =
        (Math.imul(2 * numPos, numNeg) +
          Math.imul(numPos, numBinNeg) +
          Math.imul(numNeg, numBinPos)) >>>
        0;
      vars.push(boolVar);
    }
    this.resetElimTodo();
    return vars.sort((first, second) => costs[first] - costs[second]);
  }

  private collectClauses(lit: number, wrappers: number[]) {
    const solver = this.solver;
    const arena = solver.arena;
    for (const clause of this.useList.get(lit))
      if (!arena.isLearned(clause) && !arena.wasRemoved(clause))
        wrappers.push(clause, NULL_LITERAL);
    const wlist = solver.watches[lit ^ 1];
    for (let index = 0; index < wlist.size; index++)
      if (wlist.isBinary(index) && !wlist.isLearned(index))
        wrappers.push(lit, wlist.getLiteral(index));
  }

  private getWrapperSize(first: number, second: number) {
    return second === NULL_LITERAL ? this.solver.arena.size[first] : 2;
  }

  private getWrapperLit(first: number, second: number, index: number) {
    if (second === NULL_LITERAL) return this.solver.arena.get(first, index);
    return index === 0 ? first : second;
  }

  private isWrapperRemoved(first: number, second: number) {
    return second === NULL_LITERAL && this.solver.arena.wasRemoved(first);
  }

  private isWrapperContaining(first: number, second: number, lit: number) {
    const size = this.getWrapperSize(first, second);
    for (let index = 0; index < size; index++)
      if (this.getWrapperLit(first, second, index) === lit) return true;
    return false;
  }

  private getWrapperLits(first: number, second: number) {
    return second === NULL_LITERAL ? this.solver.arena.getLits(first) : [first, second];
  }

  private resolve(
    first1: number,
    second1: number,
    first2: number,
    second2: number,
    lit: number,
    result: number[],
  ) {
    const visited = this.visited;
    const notLit = lit ^ 1;
    if (this.isWrapperRemoved(first1, second1) && !this.isWrapperContaining(first1, second1, lit))
      return false;
    if (
      this.isWrapperRemoved(first2, second2) &&
      !this.isWrapperContaining(first2, second2, notLit)
    )
      return false;
    let isResolvent = true;
    const size1 = this.getWrapperSize(first1, second1);
    const size2 = this.getWrapperSize(first2, second2);
    this.elimCounter -= size1 + size2;
    for (let index = 0; index < size1; index++) {
      const lit1 = this.getWrapperLit(first1, second1, index);
      if (lit1 === lit) continue;
      visited[lit1] = 1;
      result.push(lit1);
    }
    for (let index = 0; index < size2; index++) {
      const lit2 = this.getWrapperLit(first2, second2, index);
      if (lit2 === notLit) continue;
      if (visited[lit2 ^ 1]) {
        isResolvent = false;
        break;
      }
      if (!visited[lit2]) result.push(lit2);
    }
    for (let index = 0; index < size1; index++)
      visited[this.getWrapperLit(first1, second1, index)] = 0;
    return isResolvent;
  }

  private removeBinClauses(lit: number) {
    const wlist = this.solver.watches[lit ^ 1];
    for (let index = 0; index < wlist.size; index++) {
      if (!wlist.isBinary(index)) continue;
      const other = wlist.getLiteral(index);
      const wlist2 = this.solver.watches[other ^ 1];
      let next = 0;
      for (let position = 0; position < wlist2.size; position++) {
        if (wlist2.isBinary(position) && wlist2.getLiteral(position) === lit) {
          this.eraseSubBin(other, lit, wlist2.isLearned(position));
          continue;
        }
        wlist2.copy(next++, position);
      }
      wlist2.setEnd(next);
      this.eraseSubBin(lit, other, wlist.isLearned(index));
    }
    wlist.finalize();
  }

  private removeClauses(lit: number) {
    const arena = this.solver.arena;
    for (const clause of this.useList.get(lit)) {
      if (arena.wasRemoved(clause)) continue;
      arena.setRemoved(clause, true);
      this.useList.erase(clause, lit);
      this.subTodo.erase(clause);
      this.isNeedingCleanup = true;
    }
  }

  private tryEliminate(boolVar: number) {
    const solver = this.solver;
    const arena = solver.arena;
    if (solver.valueVar(boolVar) !== L_UNDEF) return false;
    const posLit = 2 * boolVar;
    const negLit = 2 * boolVar + 1;
    const numBinPos = this.numNonlearnedBin(posLit);
    const numBinNeg = this.numNonlearnedBin(negLit);
    const numPos = this.useList.numIrredundant(posLit) + numBinPos;
    const numNeg = this.useList.numIrredundant(negLit) + numBinNeg;
    if (numPos >= this.resOccCutoff && numNeg >= this.resOccCutoff) return false;
    let beforeLits = numBinPos * 2 + numBinNeg * 2;
    for (const clause of this.useList.get(posLit))
      if (!arena.wasRemoved(clause) && !arena.isLearned(clause)) beforeLits += arena.size[clause];
    for (const clause of this.useList.get(negLit))
      if (!arena.wasRemoved(clause) && !arena.isLearned(clause)) beforeLits += arena.size[clause];
    const numClauses = solver.clauses.length;
    if (
      numPos >= this.resOccCutoff3 &&
      numNeg >= this.resOccCutoff3 &&
      beforeLits > this.resLitCutoff3 &&
      numClauses > this.resClsCutoff2
    )
      return false;
    if (
      numPos >= this.resOccCutoff2 &&
      numNeg >= this.resOccCutoff2 &&
      beforeLits > this.resLitCutoff2 &&
      numClauses > this.resClsCutoff1 &&
      numClauses <= this.resClsCutoff2
    )
      return false;
    if (
      numPos >= this.resOccCutoff1 &&
      numNeg >= this.resOccCutoff1 &&
      beforeLits > this.resLitCutoff1 &&
      numClauses <= this.resClsCutoff1
    )
      return false;
    const posClauses = this.posClauses;
    const negClauses = this.negClauses;
    const newClause = this.newClause;
    posClauses.length = 0;
    negClauses.length = 0;
    this.collectClauses(posLit, posClauses);
    this.collectClauses(negLit, negClauses);
    const beforeClauses = numPos + numNeg;
    let afterClauses = 0;
    for (let first = 0; first < posClauses.length; first += 2)
      for (let second = 0; second < negClauses.length; second += 2) {
        newClause.length = 0;
        if (
          this.resolve(
            posClauses[first],
            posClauses[first + 1],
            negClauses[second],
            negClauses[second + 1],
            posLit,
            newClause,
          )
        ) {
          afterClauses++;
          if (afterClauses > beforeClauses) return false;
        }
      }
    this.elimCounter -= numPos * numNeg + beforeLits;
    this.elimCounter -= numPos * numNeg + beforeLits;
    const entry = solver.mc.mk(MC_ELIM_VAR, boolVar);
    for (let first = 0; first < posClauses.length; first += 2)
      solver.mc.insert(entry, this.getWrapperLits(posClauses[first], posClauses[first + 1]));
    for (let second = 0; second < negClauses.length; second += 2)
      solver.mc.insert(entry, this.getWrapperLits(negClauses[second], negClauses[second + 1]));
    solver.setEliminated(boolVar, true);
    this.elimCounter -= numPos * numNeg + beforeLits;
    for (let first = 0; first < posClauses.length; first += 2) {
      const first1 = posClauses[first];
      const second1 = posClauses[first + 1];
      if (
        this.isWrapperRemoved(first1, second1) &&
        !this.isWrapperContaining(first1, second1, posLit)
      )
        continue;
      for (let second = 0; second < negClauses.length; second += 2) {
        newClause.length = 0;
        if (
          !this.resolve(
            first1,
            second1,
            negClauses[second],
            negClauses[second + 1],
            posLit,
            newClause,
          )
        )
          continue;
        if (this.cleanupLits(newClause)) continue;
        if (newClause.length === 0) solver.setConflict();
        else if (newClause.length === 1) this.propagateUnit(newClause[0]);
        else if (newClause.length === 2) {
          solver.mkBinClause(newClause[0], newClause[1], false);
          this.backSubsumption1(this.setDummy(newClause[0], newClause[1], false));
        } else {
          const clause = solver.arena.mkClause(newClause, newClause.length, false);
          solver.clauses.push(clause);
          this.useList.insert(clause);
          if (this.subCounter > 0) this.backSubsumption1(clause);
          else this.backSubsumption0(clause);
        }
        if (solver.isInconsistent) return true;
      }
    }
    this.removeBinClauses(posLit);
    this.removeBinClauses(negLit);
    this.removeClauses(posLit);
    this.removeClauses(negLit);
    this.useList.reset(posLit);
    this.useList.reset(negLit);
    return true;
  }

  private elimVars() {
    if (!this.isElimVarsEnabled()) return;
    for (const boolVar of this.orderVarsForElim()) {
      this.solver.checkpoint();
      if (this.elimCounter < 0) break;
      if (this.isExternal(boolVar)) continue;
      if (this.tryEliminate(boolVar)) this.numElimVars++;
    }
  }
}
