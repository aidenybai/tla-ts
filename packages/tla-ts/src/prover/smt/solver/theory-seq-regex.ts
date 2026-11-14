// Ported from Z3 (src/smt/seq_regex.cpp, src/smt/seq_regex.h), MIT license, see z3-license.txt.
import {
  KIND_APP,
  OP_ITE,
  OP_MOD,
  OP_RE_COMPLEMENT,
  OP_RE_CONCAT,
  OP_RE_DIFF,
  OP_RE_INTERSECT,
  OP_RE_UNION,
  OP_SEQ_CONCAT,
  OP_SEQ_IN_RE,
  OP_SEQ_NTH_I,
  SORT_BOOL,
} from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import { assign } from "./expr-ref";
import { ExprSafeReplace } from "./expr-safe-replace";
import { ObjMap } from "./hashtable";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { FALSE_LITERAL, getVar, isNegated, type Literal, negate } from "./literal";
import { type Dependency, mkJoin } from "./lp/dependency";
import type { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { getConcat, mkConcatOf, mkSeqApp } from "./seq-decl-plugin";
import { TRANSITION_BRZOZOWSKI, TRANSITION_LIGHT_ANTIMIROV } from "./seq-derive";
import { SeqEqApprox } from "./seq-eq-approx";
import { Monadic, ORIENTATION_RETRY } from "./seq-monadic";
import { LiveStates } from "./seq-regex-live";
import { RegexBisim } from "./seq-regex-bisim";
import {
  addTruncate,
  canBeMember,
  getStrMinLength,
  isDotPlus,
  isEpsilon,
  isFullSeq,
  isReBinary,
  isReEmpty,
  isReGround,
  mkEpsilon,
  mkFullSeq,
  mkRe,
  mkReEmpty,
  mkToRe,
  UINT_MAX,
} from "./seq-re-util";
import { TheorySeqSolve } from "./theory-seq-solve";

const BOUND_LO = 0;
const BOUND_HI = 1;
const BOUND_LEN = 2;
const MAX_BOUND = 1000;
const EQ_APPROX_STATES = 1 << 12;
const LIVE_STATES = 10000;
const EMPTINESS_STEPS = 100000;
const EXPANSION_DEPTH = 40;

interface Expansion {
  expr: number;
  dep: Dependency;
}

interface MonadicMembership {
  literal: Literal;
  seq: number;
  regex: number;
  expanded: number;
  dep: Dependency;
}

interface MonadicAssumption {
  generation: number;
  variable: Enode;
  witness: Enode;
}

interface BoundConstraint {
  length: number;
  kind: number;
  value: number;
}

interface CandidateBound extends BoundConstraint {
  term: number;
}

const isUnsigned = (value: Rational) =>
  value.isInt() && !value.isNegative() && value.num <= 0xffffffffn;

const getMembershipDep = (index: number) => 2 * (index + 1);

const getBoundDep = (index: number) => 2 * index + 1;

export abstract class TheorySeqRegex extends TheorySeqSolve {
  private monadic: Monadic;
  private monadicMemberships: MonadicMembership[] = [];
  private monadicModel: ObjMap<number>;
  private monadicAssumptions: MonadicAssumption[] = [];
  private monadicBounds: BoundConstraint[] = [];
  private monadicGeneration = 0;
  private assumptionGeneration = -1;
  private fallbackGeneration = -1;
  private eqApprox: SeqEqApprox;
  private liveStates: LiveStates;

  constructor(context: Context, family: number) {
    super(context, family);
    const manager = context.manager;
    this.monadic = new Monadic(
      manager,
      this.seqRewriter,
      (undo) => context.pushTrail(undo),
      (expr) => this.isVar(expr),
      TRANSITION_LIGHT_ANTIMIROV,
    );
    this.monadic.orientation = ORIENTATION_RETRY;
    this.monadic.splitRounds = 10;
    this.monadicModel = new ObjMap((key) => manager.hashes[key]);
    this.eqApprox = new SeqEqApprox(manager, this.seqRewriter.re, EQ_APPROX_STATES);
    this.liveStates = new LiveStates(
      manager,
      this.seqRewriter.re,
      TRANSITION_BRZOZOWSKI,
      LIVE_STATES,
    );
  }

  private get re() {
    return this.seqRewriter.re;
  }

  protected addUnhandledExpr(expr: number) {
    if (this.unhandledExpr !== undefined) return;
    this.context.pushTrail(() => {
      this.unhandledExpr = undefined;
    });
    this.unhandledExpr = this.keep(expr);
  }

  private pushBack<T>(items: T[], item: T, release: (item: T) => void = () => {}) {
    items.push(item);
    this.context.pushTrail(() => {
      release(items.pop()!);
    });
  }

  private expandShallow(expr: number, state: { dep: Dependency }, depth: number): number {
    const manager = this.manager;
    if (depth > EXPANSION_DEPTH) return expr;
    if (manager.getOp(expr) === OP_SEQ_CONCAT)
      return mkConcatOf(
        manager,
        manager.getArgs(expr).map((arg) => this.expandShallow(arg, state, depth + 1)),
        manager.sorts[expr],
      );
    if (this.isEmpty(expr) || this.isString(expr)) return expr;
    if (this.isUnit(expr) && manager.isValue(manager.getArg(expr, 0))) return expr;
    const found = this.rep.findWithDep(expr);
    if (found.expr === expr) return expr;
    const sub = { dep: found.dep };
    const expanded = this.expandShallow(found.expr, sub, depth + 1);
    if (!this.monadic.canDecideTerm(expanded)) return expr;
    state.dep = mkJoin(state.dep, sub.dep);
    return expanded;
  }

  private computeExpansion(seq: number): Expansion {
    const state = { dep: null, isChanged: false };
    const full = this.canonize(seq, state);
    if (full !== undefined && this.monadic.canDecideTerm(full))
      return { expr: full, dep: state.dep };
    const shallow = { dep: null };
    const expanded = this.expandShallow(seq, shallow, 0);
    if (this.monadic.canDecideTerm(expanded)) return { expr: expanded, dep: shallow.dep };
    return { expr: seq, dep: null };
  }

  private addMonadicMembership(literal: Literal, seq: number, regex: number) {
    if (this.monadicMemberships.some((membership) => membership.literal === literal)) return;
    const expansion = this.computeExpansion(seq);
    const index = this.monadicMemberships.length;
    const manager = this.manager;
    this.pushBack(
      this.monadicMemberships,
      {
        literal,
        seq: this.keep(seq),
        regex: this.keep(regex),
        expanded: this.keep(expansion.expr),
        dep: expansion.dep,
      },
      (membership) => {
        manager.decRef(membership.expanded);
        manager.decRef(membership.regex);
        manager.decRef(membership.seq);
      },
    );
    this.monadic.add(expansion.expr, regex, getMembershipDep(index));
    const generation = this.monadicGeneration;
    this.context.pushTrail(() => {
      this.monadicGeneration = generation;
    });
    this.monadicGeneration++;
  }

  private refreshExpansions() {
    for (let index = 0; index < this.monadicMemberships.length; index++) {
      const membership = this.monadicMemberships[index];
      const expansion = this.computeExpansion(membership.seq);
      membership.expanded = assign(this.manager, membership.expanded, expansion.expr);
      membership.dep = expansion.dep;
      this.monadic.setTerm(getMembershipDep(index), expansion.expr);
    }
  }

  private collectVars(seq: number, vars: number[]) {
    const manager = this.manager;
    const todo = [seq];
    while (todo.length > 0) {
      const expr = todo.pop()!;
      if (manager.getOp(expr) === OP_SEQ_CONCAT) {
        todo.push(...manager.getArgs(expr));
        continue;
      }
      if (this.isVar(expr) && !vars.includes(expr)) vars.push(expr);
    }
  }

  private collectCandidateBounds(candidates: CandidateBound[]) {
    const addTerm = (term: number) => {
      const length = this.mkLen(term);
      const lo = this.lowerBound(length);
      const hi = this.upperBound(length);
      const hasLo = lo !== undefined && isUnsigned(lo) && lo.num > 0n;
      const hasHi = hi !== undefined && isUnsigned(hi);
      if (hasLo && hasHi && lo.equals(hi)) {
        if (lo.num <= MAX_BOUND)
          candidates.push({ term, length, kind: BOUND_LEN, value: Number(lo.num) });
        return;
      }
      if (hasLo && lo.num <= MAX_BOUND)
        candidates.push({ term, length, kind: BOUND_LO, value: Number(lo.num) });
      if (hasHi && hi.num <= MAX_BOUND)
        candidates.push({ term, length, kind: BOUND_HI, value: Number(hi.num) });
    };
    for (const membership of this.monadicMemberships) {
      addTerm(membership.expanded);
      const vars: number[] = [];
      this.collectVars(membership.expanded, vars);
      for (const variable of vars) addTerm(variable);
    }
  }

  private getModelLength(term: number) {
    const manager = this.manager;
    const todo = [term];
    let length = 0;
    while (todo.length > 0) {
      const expr = todo.pop()!;
      if (this.isConcat(expr)) {
        todo.push(manager.getArg(expr, 0), manager.getArg(expr, 1));
        continue;
      }
      if (this.isEmpty(expr)) continue;
      if (this.isUnit(expr)) {
        length++;
        continue;
      }
      const chars = manager.getString(expr);
      if (chars !== undefined) {
        length += chars.length;
        continue;
      }
      const witness = this.monadicModel.get(expr);
      if (witness === undefined || witness === expr) return undefined;
      todo.push(witness);
    }
    return length;
  }

  private isBoundSatisfied(candidate: CandidateBound) {
    const length = this.getModelLength(candidate.term);
    if (length === undefined) return true;
    if (candidate.kind === BOUND_LO) return length >= candidate.value;
    if (candidate.kind === BOUND_HI) return length <= candidate.value;
    return length === candidate.value;
  }

  private recordBound(candidate: CandidateBound) {
    if (
      this.monadicBounds.some(
        (bound) =>
          bound.length === candidate.length &&
          bound.kind === candidate.kind &&
          bound.value === candidate.value,
      )
    )
      return;
    const dep = getBoundDep(this.monadicBounds.length);
    this.pushBack(
      this.monadicBounds,
      { length: this.keep(candidate.length), kind: candidate.kind, value: candidate.value },
      (bound) => this.manager.decRef(bound.length),
    );
    if (candidate.kind === BOUND_LO) this.monadic.addLo(candidate.term, candidate.value, dep);
    else if (candidate.kind === BOUND_HI) this.monadic.addHi(candidate.term, candidate.value, dep);
    else this.monadic.addLen(candidate.term, candidate.value, dep);
  }

  private addCoreLiteral(dep: number, literals: Literal[], state: { dep: Dependency }) {
    if (dep % 2 === 0) {
      const membership = this.monadicMemberships[dep / 2 - 1];
      literals.push(membership.literal);
      if (membership.dep !== null) state.dep = mkJoin(state.dep, membership.dep);
      return;
    }
    const bound = this.monadicBounds[(dep - 1) / 2];
    if (bound.kind !== BOUND_HI) literals.push(this.mkGeLiteral(bound.length, bound.value));
    if (bound.kind !== BOUND_LO) literals.push(this.mkLeLiteral(bound.length, bound.value));
  }

  private propagateAcceptLegacy(literal: Literal, seq: number, inputRegex: number) {
    const manager = this.manager;
    if (this.isStringEquality(literal)) return;
    let regex = inputRegex;
    if (!manager.isValue(seq)) {
      const approximation = this.getOverapproxRegex(seq);
      if (!isFullSeq(manager, approximation))
        regex = mkRe(manager, OP_RE_INTERSECT, [regex, approximation]);
    }
    const accept = this.sk.mkAccept(seq, this.mkInt(0), regex);
    this.addAxiomOf(negate(literal), this.mkLiteralOf(accept));
  }

  private enableLegacyFallback() {
    if (this.fallbackGeneration === this.monadicGeneration) return;
    for (const membership of this.monadicMemberships)
      this.propagateAcceptLegacy(membership.literal, membership.seq, membership.regex);
    const generation = this.fallbackGeneration;
    this.context.pushTrail(() => {
      this.fallbackGeneration = generation;
    });
    this.fallbackGeneration = this.monadicGeneration;
  }

  protected checkEquationConflict() {
    const manager = this.manager;
    const context = this.context;
    if (this.monadicMemberships.length === 0 || this.eqs.size === 0) return false;
    const outer = manager.beginTemporaries();
    this.eqApprox.resetViews();
    const owners = new Map<number, number[]>();
    for (let index = 0; index < this.monadicMemberships.length; index++) {
      const membership = this.monadicMemberships[index];
      if (context.getAssignment(membership.literal) !== L_TRUE) continue;
      const owned = owners.get(membership.seq) ?? [];
      owned.push(index);
      owners.set(membership.seq, owned);
      this.eqApprox.addView(membership.seq, membership.regex, -1);
    }
    let conflict: { literals: Literal[]; dep: Dependency } | undefined;
    for (const eq of owners.size === 0 ? [] : this.eqs.items) {
      if (eq.ls.length === 0 || eq.rs.length === 0) continue;
      const lhs = mkConcatOf(manager, eq.ls, manager.sorts[eq.ls[0]]);
      const rhs = mkConcatOf(manager, eq.rs, manager.sorts[eq.rs[0]]);
      if (this.eqApprox.check(lhs, rhs) !== L_FALSE) continue;
      const literals: Literal[] = [];
      for (const term of this.eqApprox.used)
        for (const index of owners.get(term) ?? [])
          literals.push(this.monadicMemberships[index].literal);
      if (eq.dep === null && literals.length === 0) continue;
      conflict = { literals, dep: eq.dep };
      break;
    }
    manager.endTemporaries(outer);
    if (conflict === undefined) return false;
    this.conflictOrAxiom(conflict.literals, conflict.dep);
    return true;
  }

  private solveMonadic() {
    const manager = this.manager;
    this.refreshExpansions();
    const candidates: CandidateBound[] = [];
    this.collectCandidateBounds(candidates);
    let result = L_UNDEF;
    let guard = candidates.length + 1;
    this.monadicModel.clear();
    const outer = manager.beginTemporaries();
    for (;;) {
      result = this.monadic.check();
      if (result !== L_TRUE) break;
      this.monadicModel.clear();
      if (this.monadic.materializeAll(this.monadicModel) !== L_TRUE) {
        result = L_UNDEF;
        break;
      }
      let isProgressing = false;
      for (const candidate of candidates) {
        if (this.isBoundSatisfied(candidate)) continue;
        this.recordBound(candidate);
        isProgressing = true;
      }
      if (!isProgressing || guard-- === 0) break;
    }
    manager.endTemporaries(outer);
    return result;
  }

  protected finalCheckRegex() {
    if (this.monadicMemberships.length === 0) return false;
    if (this.fallbackGeneration === this.monadicGeneration) return false;
    if (this.assumptionGeneration === this.monadicGeneration) {
      for (const assumption of this.monadicAssumptions) {
        if (assumption.generation !== this.monadicGeneration) continue;
        if (assumption.variable.root !== assumption.witness.root) {
          this.enableLegacyFallback();
          return true;
        }
      }
      return false;
    }
    const result = this.solveMonadic();
    if (result === L_FALSE) {
      const literals: Literal[] = [];
      const state = { dep: null };
      for (const dep of this.monadic.core) this.addCoreLiteral(dep, literals, state);
      this.conflictOrAxiom(literals, state.dep);
      return true;
    }
    if (result === L_UNDEF) {
      this.enableLegacyFallback();
      return true;
    }
    const generation = this.assumptionGeneration;
    this.context.pushTrail(() => {
      this.assumptionGeneration = generation;
    });
    this.assumptionGeneration = this.monadicGeneration;
    for (const [variable, witness] of this.monadicModel) {
      const variableNode = this.ensureEnodeOf(variable);
      const witnessNode = this.ensureEnodeOf(witness);
      if (variableNode.root === witnessNode.root) continue;
      this.context.assumeEq(variableNode, witnessNode);
      this.pushBack(this.monadicAssumptions, {
        generation: this.monadicGeneration,
        variable: variableNode,
        witness: witnessNode,
      });
    }
    return true;
  }

  private isStringEquality(literal: Literal) {
    const manager = this.manager;
    const expr = this.context.boolVar2Expr[getVar(literal)];
    const id = this.mkInt(manager.ids[expr]);
    const seq = manager.getArg(expr, 0);
    const seqSort = manager.sorts[seq];
    const patterns = this.re.isReContainsPattern(manager.getArg(expr, 1));
    if (patterns === undefined) return false;
    const mkCont = (index: number) => this.sk.mk("seq.cont", [id, this.mkInt(index)], seqSort);
    let index = 0;
    const parts = [mkCont(index)];
    for (const pattern of patterns) {
      parts.push(...pattern);
      parts.push(mkCont(++index));
    }
    this.propagateEq(null, [literal], seq, mkConcatOf(manager, parts, seqSort), true);
    return true;
  }

  protected propagateInRe(literal: Literal) {
    const manager = this.manager;
    const expr = this.context.boolVar2Expr[getVar(literal)];
    const seq = manager.getArg(expr, 0);
    const regex = manager.getArg(expr, 1);
    if (this.unfoldComplement(literal, seq, regex)) return;
    if (this.unfoldPrefix(literal, seq, regex)) return;
    if (this.factorIte(literal, seq, regex)) return;
    this.propagateLengthResidue(literal, seq, regex);
    this.addMonadicMembership(literal, seq, regex);
  }

  private propagateLengthResidue(literal: Literal, seq: number, regex: number) {
    if (isNegated(literal)) return;
    if (!canBeMember(this.re.info, seq, regex)) {
      this.addAxiomOf(negate(literal));
      return;
    }
    const info = this.re.info.getInfo(regex);
    if (!info.isKnown || info.period <= 1 || !this.areLengthsLive(seq)) return;
    const residues: number[] = [];
    for (let residue = 0; residue < info.period; residue++)
      if ((info.residues >> BigInt(residue)) & 1n) residues.push(residue);
    if (residues.length === 0 || residues.length > 4) return;
    const mod = this.mkArith(OP_MOD, [this.mkLen(seq), this.mkInt(info.period)]);
    const literals = [negate(literal)];
    for (const residue of residues)
      literals.push(this.mkEqLiteral(mod, this.mkInt(residue), false));
    this.addAxiom(literals);
  }

  private areLengthsLive(seq: number) {
    const manager = this.manager;
    if (this.hasLength(seq)) return true;
    const todo = [seq];
    let hasVar = false;
    while (todo.length > 0) {
      const expr = todo.pop()!;
      if (this.isConcat(expr)) {
        todo.push(manager.getArg(expr, 0), manager.getArg(expr, 1));
        continue;
      }
      if (this.isEmpty(expr) || this.isUnit(expr) || this.isString(expr)) continue;
      if (!this.hasLength(expr)) return false;
      hasVar = true;
    }
    return hasVar;
  }

  private mkInRe(seq: number, regex: number) {
    return mkSeqApp(this.manager, OP_SEQ_IN_RE, [seq, regex]);
  }

  private unfoldComplement(literal: Literal, seq: number, regex: number) {
    if (!isNegated(literal)) return false;
    const formula = this.rewrite(this.mkInRe(seq, mkRe(this.manager, OP_RE_COMPLEMENT, [regex])));
    const complemented = this.mkLiteralOf(formula);
    if (literal === complemented) this.addUnhandledExpr(formula);
    this.propagateLit(null, [literal], complemented);
    return true;
  }

  private unfoldPrefix(literal: Literal, seq: number, regex: number) {
    const manager = this.manager;
    const prefix: number[] = [];
    let tail = seq;
    while (this.isConcat(tail) && this.isUnit(manager.getArg(tail, 0))) {
      prefix.push(manager.getArg(manager.getArg(tail, 0), 0));
      tail = manager.getArg(tail, 1);
    }
    if (prefix.length === 0) return false;
    let derivative = regex;
    for (const element of prefix) {
      derivative = this.re.mkDerivative(element, derivative);
      if (isReEmpty(manager, derivative)) {
        this.setConflict(null, [literal]);
        return true;
      }
    }
    this.propagateLit(
      null,
      [literal],
      this.mkLiteralOf(this.rewrite(this.mkInRe(tail, derivative))),
    );
    return true;
  }

  private decomposeIte(regex: number) {
    const manager = this.manager;
    if (manager.getOp(regex) === OP_ITE) return manager.getArgs(regex);
    const visited = new Set<number>();
    const todo = [regex];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visited.has(current)) continue;
      visited.add(current);
      if (manager.kinds[current] !== KIND_APP) continue;
      if (manager.getOp(current) === OP_ITE) {
        const getReplaced = (branch: number) => {
          const replace = new ExprSafeReplace(manager);
          replace.insert(current, branch);
          return replace.apply(regex);
        };
        return [
          manager.getArg(current, 0),
          getReplaced(manager.getArg(current, 1)),
          getReplaced(manager.getArg(current, 2)),
        ];
      }
      manager.pushArgs(current, todo);
    }
    return undefined;
  }

  private factorIte(literal: Literal, seq: number, regex: number) {
    const context = this.context;
    const decomposed = this.decomposeIte(regex);
    if (decomposed === undefined) return false;
    const condition = this.mkLiteralOf(decomposed[0]);
    const value = context.getAssignment(condition);
    if (value === L_TRUE)
      this.propagateLit(
        null,
        [literal, condition],
        this.mkLiteralOf(this.mkInRe(seq, decomposed[1])),
      );
    else if (value === L_FALSE)
      this.propagateLit(
        null,
        [literal, negate(condition)],
        this.mkLiteralOf(this.mkInRe(seq, decomposed[2])),
      );
    else {
      context.markLiteralAsRelevant(condition);
      const inThen = this.mkLiteralOf(this.mkInRe(seq, decomposed[1]));
      const inElse = this.mkLiteralOf(this.mkInRe(seq, decomposed[2]));
      this.addAxiomOf(negate(literal), negate(condition), inThen);
      this.addAxiomOf(negate(literal), condition, inElse);
    }
    return true;
  }

  private getOverapproxRegex(seq: number): number {
    const manager = this.manager;
    const toRe = mkToRe(manager, seq);
    const dotStar = mkFullSeq(manager, manager.sorts[toRe]);
    if (manager.isValue(seq)) return toRe;
    if (manager.getOp(seq) === OP_SEQ_CONCAT) {
      let approximation = -1;
      let last = -1;
      for (const part of getConcat(manager, seq, [])) {
        const partApproximation = this.getOverapproxRegex(part);
        if (approximation === -1) approximation = partApproximation;
        else if (last !== dotStar || partApproximation !== dotStar)
          approximation = mkRe(manager, OP_RE_CONCAT, [approximation, partApproximation]);
        last = partApproximation;
      }
      return approximation === -1 ? mkEpsilon(manager, manager.sorts[seq]) : approximation;
    }
    if (manager.getOp(seq) === OP_ITE) {
      const thenApproximation = this.getOverapproxRegex(manager.getArg(seq, 1));
      if (isFullSeq(manager, thenApproximation)) return thenApproximation;
      const elseApproximation = this.getOverapproxRegex(manager.getArg(seq, 2));
      if (isFullSeq(manager, elseApproximation)) return elseApproximation;
      return mkRe(manager, OP_RE_UNION, [thenApproximation, elseApproximation]);
    }
    return dotStar;
  }

  private isBlockedAsEmpty(regex: number, literal: Literal) {
    const manager = this.manager;
    const info = this.re.info.getInfo(regex);
    if (isReEmpty(manager, regex) || info.lo === UINT_MAX) {
      this.addAxiomOf(negate(literal));
      return true;
    }
    if (!info.isInterpreted) return false;
    const outer = manager.beginTemporaries();
    const isEmpty =
      this.liveStates.isDead(this.liveStates.getSearch(regex, -1)) ||
      this.isReEmptyLanguage(regex) === L_TRUE;
    manager.endTemporaries(outer);
    if (isEmpty) this.addAxiomOf(negate(literal));
    return isEmpty;
  }

  protected propagateAccept(literal: Literal) {
    const manager = this.manager;
    const expr = this.context.boolVar2Expr[getVar(literal)];
    const accept = this.sk.getAccept(expr);
    if (accept === undefined) return;
    const seq = accept.seq;
    const regex = accept.regex;
    const position = accept.position;
    if (this.isBlockedAsEmpty(regex, literal)) return;
    if (this.isBlockingUnfolding(literal, position)) return;
    const minLength = this.re.info.getInfo(regex).lo;
    this.propagateLit(
      null,
      [literal],
      this.mkGeLiteral(this.mkLen(seq), addTruncate(minLength, position)),
    );
    const isShort = this.mkLeLiteral(this.mkLen(seq), position);
    if (minLength === 0) {
      const nullable = this.rewrite(this.re.isNullable(regex));
      if (manager.isFalse(nullable)) this.propagateLit(null, [literal], negate(isShort));
      else if (!manager.isTrue(nullable)) {
        const nullableLiteral = this.mkLiteralOf(nullable);
        this.context.markLiteralAsRelevant(nullableLiteral);
        this.addAxiomOf(negate(literal), negate(isShort), nullableLiteral);
        if (manager.getOp(nullable) === OP_SEQ_IN_RE) this.addUnhandledExpr(nullable);
      }
    }
    const derivative = this.mkDerivativeOf(
      mkSeqApp(manager, OP_SEQ_NTH_I, [seq, accept.index]),
      regex,
    );
    const next = this.mkDerivAccept(seq, position + 1, derivative);
    this.addAxiom([negate(literal), isShort, this.mkLiteralOf(next)]);
  }

  private isBlockingUnfolding(literal: Literal, position: number) {
    const context = this.context;
    const maxUnfolding = this.maxUnfoldingLiteral;
    if (position <= this.maxUnfoldingDepth || maxUnfolding === undefined) return false;
    if (context.getAssignment(maxUnfolding) !== L_TRUE) return false;
    if (context.scopeLevel === context.baseLevel) return false;
    this.propagateLit(null, [literal], negate(maxUnfolding));
    return true;
  }

  private symmetricDiff(first: number, second: number) {
    const manager = this.manager;
    const diff =
      first === second
        ? mkReEmpty(manager, manager.sorts[first])
        : isReEmpty(manager, first)
          ? second
          : isReEmpty(manager, second)
            ? first
            : mkRe(manager, OP_RE_UNION, [
                mkRe(manager, OP_RE_DIFF, [first, second]),
                mkRe(manager, OP_RE_DIFF, [second, first]),
              ]);
    const result = this.rewrite(diff);
    manager.releaseLater(result);
    return result;
  }

  private mkDerivativeOf(element: number, regex: number) {
    const manager = this.manager;
    const derivative = this.re.mkSymbolicDerivative(regex);
    const elementSort = manager.getSeqElementSort(manager.getReSeqSort(manager.sorts[regex]));
    const replace = new ExprSafeReplace(manager);
    replace.insert(manager.mkVar(0, elementSort), element);
    return replace.apply(derivative);
  }

  protected propagateReEq(first: number, second: number) {
    const manager = this.manager;
    const outer = manager.beginTemporaries();
    const diff = this.symmetricDiff(first, second);
    let status = isReEmpty(manager, diff) ? L_TRUE : L_UNDEF;
    if (
      status === L_UNDEF &&
      (isReEmpty(manager, first) || isReEmpty(manager, second)) &&
      isReGround(this.re.info, diff)
    )
      status = this.isReEmptyLanguage(diff);
    if (status === L_UNDEF && isReGround(this.re.info, first) && isReGround(this.re.info, second))
      status = this.areEquivalent(first, second);
    manager.endTemporaries(outer);
    if (status === L_TRUE) return;
    if (status === L_FALSE) {
      this.addAxiomOf(negate(this.mkEqLiteral(first, second, false)), FALSE_LITERAL);
      return;
    }
    this.addUnhandledExpr(first);
    this.addUnhandledExpr(second);
  }

  protected propagateReNe(first: number, second: number) {
    const manager = this.manager;
    const outer = manager.beginTemporaries();
    // Z3 computes the symmetric difference here without using it.
    this.symmetricDiff(first, second);
    const status =
      isReGround(this.re.info, first) && isReGround(this.re.info, second)
        ? this.areEquivalent(first, second)
        : L_UNDEF;
    manager.endTemporaries(outer);
    if (status === L_FALSE) return;
    if (status === L_TRUE) {
      this.addAxiomOf(this.mkEqLiteral(first, second, false), FALSE_LITERAL);
      return;
    }
    this.addUnhandledExpr(first);
    this.addUnhandledExpr(second);
  }

  private areEquivalent(first: number, second: number) {
    const bisim = new RegexBisim(this.manager, this.re);
    const status = bisim.areEquivalent(first, second);
    bisim.release();
    return status;
  }

  private mkDerivAccept(seq: number, position: number, regex: number) {
    const manager = this.manager;
    const toVisit = [regex];
    const accepts = new Map<number, number>();
    const isLonger = getStrMinLength(manager, seq) > position;
    const index = this.mkInt(position);
    while (toVisit.length > 0) {
      const expr = toVisit[toVisit.length - 1];
      const isIte = manager.getOp(expr) === OP_ITE;
      const isUnion = isReBinary(manager, expr, OP_RE_UNION);
      const first = isIte ? manager.getArg(expr, 1) : isUnion ? manager.getArg(expr, 0) : -1;
      const second = isIte ? manager.getArg(expr, 2) : isUnion ? manager.getArg(expr, 1) : -1;
      if (!accepts.has(expr)) {
        if (first !== -1) toVisit.push(first, second);
        accepts.set(expr, -1);
        continue;
      }
      toVisit.pop();
      if (accepts.get(expr) !== -1) continue;
      if (isIte) {
        const condition = manager.getArg(expr, 0);
        const thenAccept = accepts.get(first)!;
        const elseAccept = accepts.get(second)!;
        accepts.set(
          expr,
          manager.isTrue(condition) || thenAccept === elseAccept
            ? thenAccept
            : manager.isFalse(condition)
              ? elseAccept
              : manager.mkApp(OP_ITE, [condition, thenAccept, elseAccept], SORT_BOOL),
        );
      } else if (isReEmpty(manager, expr) || (isLonger && isEpsilon(manager, expr)))
        accepts.set(expr, manager.falseExpr);
      else if (isFullSeq(manager, expr) || (isLonger && isDotPlus(manager, expr)))
        accepts.set(expr, manager.trueExpr);
      else if (isUnion) {
        const firstAccept = accepts.get(first)!;
        const secondAccept = accepts.get(second)!;
        accepts.set(
          expr,
          manager.isFalse(firstAccept) || firstAccept === secondAccept
            ? secondAccept
            : manager.isFalse(secondAccept)
              ? firstAccept
              : manager.mkOr([firstAccept, secondAccept]),
        );
      } else accepts.set(expr, this.sk.mkAccept(seq, index, expr));
    }
    return this.rewrite(accepts.get(regex)!);
  }

  private isReEmptyLanguage(regex: number) {
    const manager = this.manager;
    if (isReEmpty(manager, regex)) return L_TRUE;
    const pinned = new RefVector(manager);
    const visited = new Set([regex]);
    const work = [regex];
    pinned.push(regex);
    const derive = this.re.getDerive();
    let result = L_TRUE;
    for (let steps = 1; work.length > 0; steps++) {
      if (steps > EMPTINESS_STEPS) {
        result = L_UNDEF;
        break;
      }
      const state = work.pop()!;
      const info = this.re.info.getInfo(state);
      if (!info.isKnown) {
        result = L_UNDEF;
        break;
      }
      if (info.nullable === L_TRUE || info.isClassical) {
        result = L_FALSE;
        break;
      }
      if (info.lo === UINT_MAX) continue;
      const cofactors = new RefVector(manager);
      derive.derivativeCofactors(state, cofactors);
      for (let pair = 0; pair < cofactors.size; pair += 2) {
        const target = cofactors.items[pair + 1];
        if (isReEmpty(manager, target) || visited.has(target)) continue;
        visited.add(target);
        pinned.push(target);
        work.push(target);
      }
      cofactors.reset();
    }
    pinned.reset();
    return result;
  }
}
