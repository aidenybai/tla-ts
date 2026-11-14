// Ported from Z3 (src/ast/seq/seq_regex_live.cpp, src/ast/seq/seq_regex_live.h), MIT license, see
// z3-license.txt.
import type { AstManager } from "./ast";
import { L_FALSE, L_TRUE } from "./lbool";
import { RefVector } from "./ref-vector";
import type { ReRewriter } from "./seq-re-rewriter";
import { isReEmpty } from "./seq-re-util";

export const LIVE_FAILURE_NONE = 0;
export const LIVE_FAILURE_STATE_CAP = 1;
export const LIVE_FAILURE_RESOURCE = 2;

const NULLABLE_UNKNOWN = 2;
const NULLABLE_UNDEF = 3;

export interface LiveSearch {
  toExplore: number[];
  exploreHead: number;
  seen: Set<number>;
  predecessors: number[][];
  live: boolean[];
  liveFrontier: number[];
  rootId: number;
  targetId: number;
  failure: number;
  isComplete: boolean;
}

export class LiveStates {
  private ids = new Map<number, number>();
  private states: RefVector;
  private successors: number[][] = [];
  private nullables: number[] = [];
  private isExpanded: boolean[] = [];
  private membershipSearches = new Map<number, LiveSearch>();
  private reachSearches = new Map<number, Map<number, LiveSearch>>();

  constructor(
    private manager: AstManager,
    private re: ReRewriter,
    private mode: number,
    private maxStates: number,
  ) {
    this.states = new RefVector(manager);
  }

  private intern(regex: number) {
    const existing = this.ids.get(regex);
    if (existing !== undefined) return existing;
    const id = this.states.size;
    this.ids.set(regex, id);
    this.states.push(regex);
    this.successors.push([]);
    this.nullables.push(NULLABLE_UNKNOWN);
    this.isExpanded.push(false);
    return id;
  }

  private getNullable(id: number) {
    if (this.nullables[id] !== NULLABLE_UNKNOWN) return this.nullables[id];
    const manager = this.manager;
    const regex = this.states.items[id];
    let nullable = this.re.info.getInfo(regex).nullable;
    if (nullable !== L_TRUE && nullable !== L_FALSE) {
      const formula = this.re.isNullable(regex);
      nullable = manager.isTrue(formula) ? L_TRUE : manager.isFalse(formula) ? L_FALSE : 0;
    }
    this.nullables[id] = nullable === L_TRUE ? 1 : nullable === L_FALSE ? 0 : NULLABLE_UNDEF;
    return this.nullables[id];
  }

  private isAccepting(search: LiveSearch, id: number) {
    if (search.targetId !== -1) return id === search.targetId;
    return this.getNullable(id) !== 0;
  }

  private markLive(search: LiveSearch, start: number) {
    const todo = [start];
    while (todo.length > 0) {
      const id = todo.pop()!;
      if (!search.seen.has(id) || search.live[id]) continue;
      search.live[id] = true;
      search.liveFrontier.push(id);
      for (const predecessor of search.predecessors[id] ?? []) todo.push(predecessor);
    }
  }

  private addState(search: LiveSearch, id: number) {
    if (search.seen.has(id)) return true;
    if (search.toExplore.length >= this.maxStates) {
      search.failure = LIVE_FAILURE_STATE_CAP;
      return false;
    }
    search.seen.add(id);
    search.toExplore.push(id);
    if (this.isAccepting(search, id)) this.markLive(search, id);
    return true;
  }

  private expandState(search: LiveSearch, id: number) {
    if (this.isExpanded[id]) return true;
    if (!this.manager.limit.inc()) {
      search.failure = LIVE_FAILURE_RESOURCE;
      return false;
    }
    this.isExpanded[id] = true;
    this.getNullable(id);
    const cofactors = this.re.getDerive().getCachedCofactors(this.mode, this.states.items[id]);
    for (let index = 0; index < cofactors.size; index += 2) {
      const target = cofactors.items[index + 1];
      if (isReEmpty(this.manager, target)) continue;
      const targetId = this.intern(target);
      if (!this.successors[id].includes(targetId)) this.successors[id].push(targetId);
    }
    return true;
  }

  private expand(search: LiveSearch) {
    if (search.isComplete || search.failure !== LIVE_FAILURE_NONE) return;
    if (search.exploreHead === search.toExplore.length) {
      search.isComplete = true;
      return;
    }
    const id = search.toExplore[search.exploreHead++];
    if (!this.expandState(search, id)) return;
    for (const target of this.successors[id]) {
      if (!this.addState(search, target)) return;
      search.predecessors[target] ??= [];
      if (!search.predecessors[target].includes(id)) search.predecessors[target].push(id);
      if (search.live[target]) this.markLive(search, id);
    }
  }

  private ensure(search: LiveSearch, index: number) {
    while (
      index >= search.liveFrontier.length &&
      !search.isComplete &&
      search.failure === LIVE_FAILURE_NONE
    )
      this.expand(search);
    return index < search.liveFrontier.length;
  }

  // The root is yielded first: liveness reaches it last, but callers search in this order.
  private getLive(search: LiveSearch, index: number) {
    const root = search.rootId;
    const states = this.states.items;
    if (!search.live[root]) return states[search.liveFrontier[index]];
    if (index === 0) return states[root];
    for (let position = 0, seen = 0; position < search.liveFrontier.length; position++) {
      if (search.liveFrontier[position] === root) continue;
      if (++seen === index) return states[search.liveFrontier[position]];
    }
    return states[search.liveFrontier[index]];
  }

  getSearch(state: number, target: number) {
    const existing =
      target === -1
        ? this.membershipSearches.get(state)
        : this.reachSearches.get(state)?.get(target);
    if (existing !== undefined) return existing;
    const search: LiveSearch = {
      toExplore: [],
      exploreHead: 0,
      seen: new Set(),
      predecessors: [],
      live: [],
      liveFrontier: [],
      rootId: this.intern(state),
      targetId: -1,
      failure: LIVE_FAILURE_NONE,
      isComplete: false,
    };
    if (target === -1) this.membershipSearches.set(state, search);
    else {
      search.targetId = this.intern(target);
      if (!this.reachSearches.has(state)) this.reachSearches.set(state, new Map());
      this.reachSearches.get(state)!.set(target, search);
    }
    this.addState(search, search.rootId);
    return search;
  }

  at(search: LiveSearch, index: number) {
    return this.ensure(search, index) ? this.getLive(search, index) : -1;
  }

  isDead(search: LiveSearch) {
    return !this.ensure(search, 0) && search.failure === LIVE_FAILURE_NONE;
  }

  reset() {
    this.membershipSearches.clear();
    this.reachSearches.clear();
    this.ids.clear();
    this.states.reset();
    this.successors = [];
    this.nullables = [];
    this.isExpanded = [];
  }
}
