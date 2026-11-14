// Ported from Z3 (src/ast/seq/seq_monadic.cpp, src/ast/seq/seq_monadic.h), MIT license, see
// z3-license.txt.
import {
  type AstManager,
  KIND_APP,
  OP_RE_CONCAT,
  OP_RE_INTERSECT,
  OP_RE_REVERSE,
  OP_SEQ_CONCAT,
  OP_SEQ_UNIT,
} from "./ast";
import { ObjMap } from "./hashtable";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { isEmptySeq, mkEmptySeq } from "./seq-decl-plugin";
import { LIVE_FAILURE_NONE, LiveStates } from "./seq-regex-live";
import {
  getLoopBounds,
  isReEmpty,
  isReGround,
  isReOp,
  mkEpsilon,
  mkFullChar,
  mkFullSeq,
  mkRe,
  mkReLoop,
} from "./seq-re-util";
import type { SeqRewriter } from "./seq-rewriter";
import {
  dedupViews,
  getViewsKey,
  VIEW_FAILURE_BUDGET,
  VIEW_FAILURE_NONE,
  VIEW_FAILURE_RESOURCE,
  VIEW_FAILURE_STATE_EXPANSION,
  ViewWitness,
} from "./seq-view-witness";

export const ORIENTATION_FORWARD = 0;
export const ORIENTATION_REVERSED = 1;
export const ORIENTATION_RETRY = 2;

const LIVE_STATE_CAP = 1 << 12;
const COFACTOR_CACHE_CAP = 1 << 16;
const LENGTH_CONSTRAINING_KEY = 2 ** 40;

export interface Memberships {
  terms: number[];
  regexes: number[];
  deps: number[];
}

interface Frame {
  membership: number;
  atom: number;
  regex: number;
  variable: number;
  isFinal: boolean;
  isLastAtom: boolean;
  next: number;
  isUndef: boolean;
}

interface Materialized {
  status: number;
  word: number;
}

const mkMemberships = (): Memberships => ({ terms: [], regexes: [], deps: [] });

const copyMemberships = (memberships: Memberships): Memberships => ({
  terms: [...memberships.terms],
  regexes: [...memberships.regexes],
  deps: [...memberships.deps],
});

export class Monadic {
  private thRewriter: Rewriter;
  private pins: RefVector;
  private budget = 0;
  private isGivingUp = false;
  private workBails = 0;
  private solution: ObjMap<number[]>;
  private splitWords = new Map<number, number>();
  private derivativeCache = new Map<number, Map<number, number>>();
  private memberships = mkMemberships();
  readonly core: number[] = [];
  private lastResult = L_UNDEF;
  private isReversed = false;
  private isRetryDisabled = false;
  private isSplitDisabled = false;
  private atomExprs: number[][] = [];
  private atomIsVars: boolean[][] = [];
  private regexes: number[] = [];
  private vars: number[] = [];
  private varIndexes = new Map<number, number>();
  private groups: number[][] = [];
  private lastOccurrences = new Map<number, number>();
  private numUndefVars = 0;
  private stack: Frame[] = [];
  private positionMembership = 0;
  private positionAtom = 0;
  private positionRegex = -1;
  private isAnyUndef = false;
  private groupCache = new Map<string, number>();
  private liveStates: LiveStates;
  private viewWitness: ViewWitness;
  private reverseDecl = -1;
  budgetLimit = 1000000;
  orientation = ORIENTATION_FORWARD;
  splitRounds = 0;

  constructor(
    private manager: AstManager,
    private seq: SeqRewriter,
    private pushTrail: (undo: () => void) => void,
    private isVar: (expr: number) => boolean,
    mode: number,
  ) {
    this.thRewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    this.pins = new RefVector(manager);
    this.solution = new ObjMap((key) => manager.hashes[key]);
    this.liveStates = new LiveStates(manager, seq.re, mode, LIVE_STATE_CAP);
    this.viewWitness = new ViewWitness(manager, seq.re, mode, () => {
      if (!this.isOutOfBudget()) return VIEW_FAILURE_NONE;
      return this.budget === 0 ? VIEW_FAILURE_BUDGET : VIEW_FAILURE_RESOURCE;
    });
  }

  private getDerivativeOfElement(regex: number, element: number) {
    const cached = this.derivativeCache.get(regex)?.get(element);
    if (cached !== undefined) return cached;
    const derivative = this.thRewriter.rewrite(this.seq.re.mkDerivative(element, regex));
    this.pins.push(regex);
    this.pins.push(element);
    this.pins.pushOwned(derivative);
    if (!this.derivativeCache.has(regex)) this.derivativeCache.set(regex, new Map());
    this.derivativeCache.get(regex)!.set(element, derivative);
    return derivative;
  }

  private isOutOfBudget() {
    if (this.budget === 0) {
      this.workBails++;
      this.isGivingUp = true;
      return true;
    }
    if (!this.manager.limit.inc()) {
      this.isGivingUp = true;
      return true;
    }
    this.budget--;
    return false;
  }

  private parseTerm(term: number, exprs: number[], isVars: boolean[]): boolean {
    const manager = this.manager;
    if (manager.getOp(term) === OP_SEQ_CONCAT)
      return manager.getArgs(term).every((arg) => this.parseTerm(arg, exprs, isVars));
    if (isEmptySeq(manager, term)) return true;
    const chars = manager.getString(term);
    if (chars !== undefined) {
      for (const code of chars) {
        exprs.push(manager.mkChar(code));
        isVars.push(false);
      }
      return true;
    }
    if (manager.getOp(term) === OP_SEQ_UNIT && manager.isValue(manager.getArg(term, 0))) {
      exprs.push(manager.getArg(term, 0));
      isVars.push(false);
      return true;
    }
    if (!this.isVar(term)) return false;
    exprs.push(term);
    isVars.push(true);
    return true;
  }

  private getVarIndex(variable: number) {
    const existing = this.varIndexes.get(variable);
    if (existing !== undefined) return existing;
    const index = this.vars.length;
    this.varIndexes.set(variable, index);
    this.vars.push(variable);
    this.groups.push([]);
    return index;
  }

  private resetSearch() {
    this.atomExprs = [];
    this.atomIsVars = [];
    this.regexes = [];
    this.vars = [];
    this.varIndexes.clear();
    this.groups = [];
    this.lastOccurrences.clear();
    this.groupCache.clear();
    this.derivativeCache.clear();
    this.viewWitness.resetCache();
    this.numUndefVars = 0;
    this.isAnyUndef = false;
    this.liveStates.reset();
    this.stack = [];
    this.positionMembership = 0;
    this.positionAtom = 0;
    this.positionRegex = -1;
  }

  private reverseRegex(regex: number) {
    const manager = this.manager;
    const result = this.thRewriter.rewrite(mkRe(manager, OP_RE_REVERSE, [regex]));
    this.pins.pushOwned(result);
    const visited = new Set<number>();
    const todo = [result];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visited.has(current)) continue;
      visited.add(current);
      if (isReOp(manager, current, OP_RE_REVERSE)) return -1;
      if (manager.kinds[current] === KIND_APP) manager.pushArgs(current, todo);
    }
    return result;
  }

  private mkRevVar(variable: number) {
    const manager = this.manager;
    const sort = manager.sorts[variable];
    if (this.reverseDecl === -1 || manager.funcDecls[this.reverseDecl].range !== sort) {
      if (this.reverseDecl !== -1) manager.decDeclRef(this.reverseDecl);
      this.reverseDecl = manager.mkFreshFuncDecl("rev", [sort], sort);
      manager.incDeclRef(this.reverseDecl);
    }
    return manager.mkApp(this.reverseDecl, [variable], sort);
  }

  private stripRevVar(variable: number) {
    const manager = this.manager;
    return this.reverseDecl !== -1 &&
      manager.kinds[variable] === KIND_APP &&
      manager.decls[variable] === this.reverseDecl
      ? manager.getArg(variable, 0)
      : variable;
  }

  private prepare(memberships: Memberships, isReversing: boolean) {
    this.resetSearch();
    this.isReversed = isReversing;
    const reversedRegexes: number[] = [];
    if (this.isReversed)
      for (const regex of memberships.regexes) {
        const reversed = this.reverseRegex(regex);
        if (reversed === -1) {
          this.isReversed = false;
          break;
        }
        reversedRegexes.push(reversed);
      }
    for (let index = 0; index < memberships.terms.length; index++) {
      if (!isReGround(this.seq.re.info, memberships.regexes[index])) return false;
      const exprs: number[] = [];
      const isVars: boolean[] = [];
      if (!this.parseTerm(memberships.terms[index], exprs, isVars)) return false;
      const regex = this.isReversed ? reversedRegexes[index] : memberships.regexes[index];
      if (this.isReversed) {
        exprs.reverse();
        isVars.reverse();
        for (let atom = 0; atom < exprs.length; atom++) {
          if (!isVars[atom]) continue;
          exprs[atom] = this.mkRevVar(exprs[atom]);
          this.pins.push(exprs[atom]);
        }
      }
      this.regexes.push(regex);
      this.atomExprs.push(exprs);
      this.atomIsVars.push(isVars);
      this.pins.push(regex);
    }
    for (let membership = 0; membership < this.atomExprs.length; membership++) {
      const isVars = this.atomIsVars[membership];
      for (let atom = 0; atom < isVars.length; atom++) {
        if (!isVars[atom]) continue;
        const variable = this.atomExprs[membership][atom];
        this.getVarIndex(variable);
        this.lastOccurrences.set(variable, membership * 2 ** 32 + atom);
      }
    }
    return true;
  }

  private isGroupNonempty(index: number) {
    const group = this.groups[index];
    const key = getViewsKey(this.manager, group);
    const cached = this.groupCache.get(key);
    if (cached !== undefined) return cached;
    const result = this.viewWitness.productNonempty(this.vars[index], dedupViews(group), false);
    if (result.status === L_UNDEF && this.viewWitness.failure === VIEW_FAILURE_STATE_EXPANSION) {
      this.workBails++;
      this.isGivingUp = true;
    }
    this.groupCache.set(key, result.status);
    return result.status;
  }

  private leaf() {
    if (this.isGivingUp) return L_UNDEF;
    if (this.numUndefVars > 0) {
      this.isAnyUndef = true;
      return L_UNDEF;
    }
    this.solution.clear();
    for (let index = 0; index < this.groups.length; index++) {
      const group = this.groups[index];
      if (group.length === 0) continue;
      for (const expr of group) if (expr !== -1) this.pins.push(expr);
      this.solution.set(this.vars[index], [...group]);
    }
    return L_TRUE;
  }

  private materializeRecorded(variable: number, isAllowingUnconstrained = true): Materialized {
    const manager = this.manager;
    const views =
      this.solution.get(variable) ??
      (this.isReversed ? this.solution.get(this.mkRevVar(variable)) : undefined);
    if (views === undefined)
      return isAllowingUnconstrained
        ? { status: L_TRUE, word: mkEmptySeq(manager, manager.sorts[variable]) }
        : { status: L_UNDEF, word: -1 };
    const result = this.viewWitness.productNonempty(variable, dedupViews(views), true);
    if (result.status !== L_TRUE) return result;
    const word = this.isReversed ? this.seq.mkSeqReverse(result.word) : result.word;
    if (word === undefined) return { status: L_UNDEF, word: -1 };
    this.pins.push(word);
    return { status: L_TRUE, word };
  }

  materializeAll(model: ObjMap<number>) {
    model.clear();
    if (this.lastResult !== L_TRUE) return L_UNDEF;
    for (const [key] of this.solution) {
      const variable = this.stripRevVar(key);
      const result = this.materializeRecorded(variable);
      if (result.status !== L_TRUE) return result.status;
      model.set(variable, result.word);
    }
    return L_TRUE;
  }

  private startMembership(membership: number) {
    this.positionMembership = membership;
    this.positionAtom = 0;
    this.positionRegex = membership === this.atomExprs.length ? -1 : this.regexes[membership];
  }

  private advancePosition() {
    for (;;) {
      if (this.positionMembership === this.atomExprs.length) return L_TRUE;
      if (this.isOutOfBudget()) return L_UNDEF;
      const exprs = this.atomExprs[this.positionMembership];
      if (this.positionAtom === exprs.length) {
        const nullable = this.viewWitness.nullable(this.positionRegex);
        if (nullable !== L_TRUE) return nullable;
        this.startMembership(this.positionMembership + 1);
        continue;
      }
      if (this.atomIsVars[this.positionMembership][this.positionAtom]) return L_TRUE;
      const derivative = this.getDerivativeOfElement(this.positionRegex, exprs[this.positionAtom]);
      if (isReEmpty(this.manager, derivative)) return L_FALSE;
      this.pins.push(derivative);
      this.positionRegex = derivative;
      this.positionAtom++;
    }
  }

  private pushFrame() {
    if (this.positionMembership === this.atomExprs.length) return false;
    const exprs = this.atomExprs[this.positionMembership];
    const variable = exprs[this.positionAtom];
    const position = this.positionMembership * 2 ** 32 + this.positionAtom;
    this.stack.push({
      membership: this.positionMembership,
      atom: this.positionAtom,
      regex: this.positionRegex,
      variable: this.getVarIndex(variable),
      isFinal: this.lastOccurrences.get(variable) === position,
      isLastAtom: this.positionAtom + 1 === exprs.length,
      next: 0,
      isUndef: false,
    });
    return true;
  }

  private commitNext(frame: Frame) {
    const group = this.groups[frame.variable];
    for (;;) {
      let target = -1;
      if (frame.isLastAtom) {
        if (frame.next++ > 0) return false;
      } else {
        const search = this.liveStates.getSearch(frame.regex, -1);
        target = this.liveStates.at(search, frame.next++);
        if (target === -1) {
          if (search.failure !== LIVE_FAILURE_NONE) this.isAnyUndef = true;
          return false;
        }
      }
      group.push(frame.regex, target);
      const status = isReEmpty(this.manager, frame.regex)
        ? L_FALSE
        : frame.isFinal || group.length > 2
          ? this.isGroupNonempty(frame.variable)
          : L_TRUE;
      if (status === L_FALSE) {
        group.length -= 2;
        continue;
      }
      if (frame.isLastAtom) this.startMembership(frame.membership + 1);
      else {
        this.positionMembership = frame.membership;
        this.positionAtom = frame.atom + 1;
        this.positionRegex = target;
      }
      const advanced = this.advancePosition();
      if (advanced !== L_TRUE) {
        if (advanced === L_UNDEF) this.isAnyUndef = true;
        group.length -= 2;
        if (this.isGivingUp) return false;
        continue;
      }
      frame.isUndef = status === L_UNDEF;
      if (frame.isUndef) this.numUndefVars++;
      return true;
    }
  }

  private runSearch() {
    let isBacktracking = false;
    for (;;) {
      if (this.isGivingUp) return L_UNDEF;
      if (isBacktracking) {
        if (this.stack.length === 0) return this.isAnyUndef ? L_UNDEF : L_FALSE;
        const frame = this.stack[this.stack.length - 1];
        if (frame.isUndef) this.numUndefVars--;
        frame.isUndef = false;
        this.groups[frame.variable].length -= 2;
        isBacktracking = false;
      } else if (!this.pushFrame()) {
        if (this.leaf() === L_TRUE) return L_TRUE;
        isBacktracking = true;
        continue;
      }
      if (!this.commitNext(this.stack[this.stack.length - 1])) {
        this.stack.pop();
        isBacktracking = true;
      }
    }
  }

  private decideOriented(memberships: Memberships, isReversing: boolean, budget: number) {
    this.solution.clear();
    this.resetSearch();
    this.pins.reset();
    this.viewWitness.resetCache();
    this.seq.re.getDerive().maybeResetCachedCofactors(COFACTOR_CACHE_CAP);
    this.budget = budget;
    this.isGivingUp = false;
    if (memberships.terms.length === 0) return L_TRUE;
    let result = L_TRUE;
    if (!this.prepare(memberships, isReversing)) result = L_UNDEF;
    else if (isReversing && !this.isReversed && this.orientation === ORIENTATION_RETRY)
      result = L_UNDEF;
    else {
      this.startMembership(0);
      result = this.advancePosition();
      if (result === L_TRUE) result = this.runSearch();
    }
    if (result !== L_TRUE) this.solution.clear();
    return result;
  }

  private isConstrainingLength(regex: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    const todo = [regex];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visited.has(current)) continue;
      visited.add(current);
      const bounds = getLoopBounds(manager, current);
      if (bounds !== undefined && bounds.lo === bounds.hi && bounds.lo > 1) return true;
      if (manager.kinds[current] === KIND_APP) manager.pushArgs(current, todo);
    }
    return false;
  }

  private splitConjuncts(regex: number, result: number[]) {
    const manager = this.manager;
    if (isReOp(manager, regex, OP_RE_INTERSECT)) {
      for (const arg of manager.getArgs(regex)) this.splitConjuncts(arg, result);
      return;
    }
    result.push(regex);
  }

  private instantiateWord(term: number, elements: number[], isSubstituting = true): boolean {
    const manager = this.manager;
    if (manager.getOp(term) === OP_SEQ_CONCAT)
      return manager
        .getArgs(term)
        .every((arg) => this.instantiateWord(arg, elements, isSubstituting));
    if (isEmptySeq(manager, term)) return true;
    const chars = manager.getString(term);
    if (chars !== undefined) {
      for (const code of chars) {
        const element = manager.mkChar(code);
        this.pins.push(element);
        elements.push(element);
      }
      return true;
    }
    if (manager.getOp(term) === OP_SEQ_UNIT && manager.isValue(manager.getArg(term, 0))) {
      elements.push(manager.getArg(term, 0));
      return true;
    }
    if (!isSubstituting || !this.isVar(term)) return false;
    const cached = this.splitWords.get(term);
    if (cached !== undefined) return cached !== -1 && this.instantiateWord(cached, elements, false);
    const result = this.materializeRecorded(term, false);
    if (result.status !== L_TRUE) {
      this.splitWords.set(term, -1);
      return false;
    }
    this.pins.push(result.word);
    this.splitWords.set(term, result.word);
    return this.instantiateWord(result.word, elements, false);
  }

  private isAcceptedByModel(term: number, regex: number) {
    const elements: number[] = [];
    if (!this.instantiateWord(term, elements)) return L_UNDEF;
    let state = regex;
    for (const element of elements) {
      if (isReEmpty(this.manager, state)) return L_FALSE;
      state = this.getDerivativeOfElement(state, element);
    }
    return this.viewWitness.nullable(state);
  }

  private decideSplit(memberships: Memberships, budget: number, inputAllowance: number) {
    const conjuncts = mkMemberships();
    for (let index = 0; index < memberships.terms.length; index++) {
      const regexes: number[] = [];
      this.splitConjuncts(memberships.regexes[index], regexes);
      for (const regex of regexes) {
        conjuncts.terms.push(memberships.terms[index]);
        conjuncts.regexes.push(regex);
        conjuncts.deps.push(memberships.deps[index]);
      }
    }
    const size = conjuncts.terms.length;
    if (size === memberships.terms.length) return L_UNDEF;
    const isSelected: boolean[] = Array.from({ length: size }, () => false);
    const probeBudget = Math.max(1000, Math.floor(budget / 8));
    const isReversing = this.orientation === ORIENTATION_REVERSED;
    const isLengthConstraining = conjuncts.regexes.map((regex) => this.isConstrainingLength(regex));
    const getRelaxation = () => {
      const relaxed = mkMemberships();
      for (let index = 0; index < size; index++) {
        if (!isSelected[index]) continue;
        relaxed.terms.push(conjuncts.terms[index]);
        relaxed.regexes.push(conjuncts.regexes[index]);
        relaxed.deps.push(conjuncts.deps[index]);
      }
      return relaxed;
    };
    let allowance = inputAllowance;
    const isSpendable = (granted: number) => {
      const used = granted - Math.min(granted, this.budget);
      allowance -= Math.min(allowance, used);
      return allowance > 0;
    };
    for (let round = 0; round < this.splitRounds && allowance > 0; round++) {
      const result = this.decideOriented(getRelaxation(), isReversing, budget);
      if (result !== L_TRUE) return result;
      if (!isSpendable(budget)) return L_UNDEF;
      const violated: number[] = [];
      this.splitWords.clear();
      for (let index = 0; index < size; index++)
        if (
          !isSelected[index] &&
          this.isAcceptedByModel(conjuncts.terms[index], conjuncts.regexes[index]) !== L_TRUE
        )
          violated.push(index);
      if (violated.length === 0) return L_TRUE;
      let best = 0;
      let bestKey = 0;
      for (let position = 0; position < violated.length; position++) {
        const index = violated[position];
        isSelected[index] = true;
        const probe = this.decideOriented(getRelaxation(), isReversing, probeBudget);
        isSelected[index] = false;
        if (probe === L_FALSE) return L_FALSE;
        const isAffordable = isSpendable(probeBudget);
        if (probe === L_UNDEF) {
          if (!isAffordable) return L_UNDEF;
          continue;
        }
        const key = this.budget + (isLengthConstraining[index] ? LENGTH_CONSTRAINING_KEY : 0);
        if (key >= bestKey) {
          best = position;
          bestKey = key;
        }
        if (!isAffordable) break;
      }
      isSelected[violated[best]] = true;
    }
    return L_UNDEF;
  }

  private decidePolicy(memberships: Memberships, budget: number, isSticky: boolean) {
    if (this.orientation !== ORIENTATION_RETRY)
      return this.decideOriented(memberships, this.orientation === ORIENTATION_REVERSED, budget);
    const before = this.workBails;
    const forward = this.decideOriented(memberships, false, budget);
    if (forward !== L_UNDEF || this.isRetryDisabled || this.workBails === before) return forward;
    const backward = this.decideOriented(memberships, true, budget);
    if (backward === L_UNDEF && isSticky) this.isRetryDisabled = true;
    return backward;
  }

  private decide(memberships: Memberships) {
    const limit = this.budgetLimit;
    let result = L_UNDEF;
    if (this.splitRounds > 0 && !this.isSplitDisabled) {
      const before = this.workBails;
      result = this.decidePolicy(memberships, Math.max(1000, Math.floor(limit / 128)), false);
      if (result === L_UNDEF && this.workBails > before)
        result = this.decideSplit(memberships, Math.max(1000, Math.floor(limit / 16)), limit);
    }
    return result === L_UNDEF ? this.decidePolicy(memberships, limit, true) : result;
  }

  add(term: number, regex: number, dep: number) {
    const manager = this.manager;
    const memberships = this.memberships;
    manager.incRef(term);
    manager.incRef(regex);
    memberships.terms.push(term);
    memberships.regexes.push(regex);
    memberships.deps.push(dep);
    this.pushTrail(() => {
      manager.decRef(memberships.terms.pop()!);
      manager.decRef(memberships.regexes.pop()!);
      memberships.deps.pop();
    });
  }

  setTerm(dep: number, term: number) {
    const manager = this.manager;
    const terms = this.memberships.terms;
    const index = this.memberships.deps.indexOf(dep);
    if (index === -1 || terms[index] === term) return;
    const previous = terms[index];
    manager.incRef(term);
    terms[index] = term;
    this.pushTrail(() => {
      manager.decRef(terms[index]);
      terms[index] = previous;
    });
  }

  canDecideTerm(term: number) {
    return this.parseTerm(term, [], []);
  }

  private mkFullCharOf(term: number) {
    return mkFullChar(this.manager, this.manager.mkReSort(this.manager.sorts[term]));
  }

  private mkLoopProper(regex: number, lo: number, hi: number) {
    if (lo === 0 && hi === 0)
      return mkEpsilon(this.manager, this.manager.getReSeqSort(this.manager.sorts[regex]));
    if (lo === 1 && hi === 1) return regex;
    return mkReLoop(this.manager, regex, lo, hi);
  }

  addLo(term: number, lo: number, dep: number) {
    if (lo === 0) return;
    const manager = this.manager;
    const prefix = this.mkLoopProper(this.mkFullCharOf(term), lo, lo);
    const all = mkFullSeq(manager, manager.mkReSort(manager.sorts[term]));
    this.add(term, mkRe(manager, OP_RE_CONCAT, [prefix, all]), dep);
  }

  addHi(term: number, hi: number, dep: number) {
    this.add(term, this.mkLoopProper(this.mkFullCharOf(term), 0, hi), dep);
  }

  addLen(term: number, length: number, dep: number) {
    this.add(term, this.mkLoopProper(this.mkFullCharOf(term), length, length), dep);
  }

  private minimizeCore(memberships: Memberships) {
    this.core.length = 0;
    this.isSplitDisabled = true;
    let kept = copyMemberships(memberships);
    for (let index = 0; index < kept.terms.length;) {
      const trial = copyMemberships(kept);
      trial.terms.splice(index, 1);
      trial.regexes.splice(index, 1);
      trial.deps.splice(index, 1);
      if (this.decide(trial) === L_FALSE) kept = trial;
      else index++;
    }
    this.isSplitDisabled = false;
    for (const dep of kept.deps) if (dep !== 0) this.core.push(dep);
  }

  check() {
    this.core.length = 0;
    this.isRetryDisabled = false;
    const result = this.decide(this.memberships);
    if (result === L_FALSE) {
      this.minimizeCore(this.memberships);
      this.solution.clear();
    }
    this.lastResult = result;
    return result;
  }
}
