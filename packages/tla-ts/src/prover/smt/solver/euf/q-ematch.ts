// Ported from Z3 (src/sat/smt/q_clause.h, src/sat/smt/q_eval.cpp, src/sat/smt/q_queue.cpp,
// src/sat/smt/q_ematch.cpp, src/smt/smt_quantifier_stat.h, src/util/dlist.h), MIT license, see
// z3-license.txt.
import { KIND_VAR, OP_DISTINCT, OP_EQ, QUANTIFIER_EXISTS, QUANTIFIER_FORALL } from "../ast";
import { flattenOrVector, mkNot } from "../ast-util";
import { PatternInferenceRw } from "../asserted-formulas";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { DefinedNames, Nnf } from "../nnf";
import { PatternInference } from "../pattern-inference";
import { pullQuant } from "../pull-quant";
import { RefVector } from "../ref-vector";
import { VarSubst } from "../var-subst";
import { type Enode, getClass, NULL_THEORY_VAR } from "./egraph";
import type { EufSolver } from "./euf-solver";
import { getGroundSubterms, Mam } from "./mam";
import type { QSolver } from "./q-solver";

// q::lit: lhs = rhs, or lhs != rhs when sign is set.
export interface QLit {
  readonly lhs: number;
  readonly rhs: number;
  readonly sign: boolean;
}

// q::quantifier_stat, with the fields the default cost function reads.
interface QuantifierStat {
  readonly generation: number;
  maxGeneration: number;
  maxCost: number;
}

// q::binding: a match of a clause's quantifier, in a circular list of the clause's bindings.
export class Binding {
  next: Binding = this;
  prev: Binding = this;

  constructor(
    readonly clause: Clause,
    readonly pattern: number,
    readonly maxGeneration: number,
    readonly minTopGeneration: number,
    readonly maxTopGeneration: number,
    readonly nodes: readonly Enode[],
  ) {}
}

export class Clause {
  watch = 0;
  bindings: Binding | null = null;

  constructor(
    readonly index: number,
    readonly literal: number,
    readonly lits: readonly QLit[],
    readonly q: number,
    readonly numDecls: number,
    readonly stat: QuantifierStat,
  ) {}
}

// q::justification: the evidence for a propagation from a binding.
interface Justification {
  readonly lhs: number;
  readonly rhs: number;
  readonly sign: boolean;
  readonly generation: number;
  readonly explain: readonly number[];
  readonly clause: Clause;
  readonly binding: readonly Enode[];
}

const pushToFront = (clause: Clause, binding: Binding) => {
  const list = clause.bindings;
  if (list === null) {
    clause.bindings = binding;
    binding.next = binding;
    binding.prev = binding;
    return;
  }
  if (list === binding) return;
  binding.prev.next = binding.next;
  binding.next.prev = binding.prev;
  list.prev.next = binding;
  binding.prev = list.prev;
  binding.next = list;
  list.prev = binding;
  clause.bindings = binding;
};

const removeFrom = (clause: Clause, binding: Binding) => {
  const list = clause.bindings as Binding;
  if (list.next === list) {
    clause.bindings = null;
    return;
  }
  if (list === binding) clause.bindings = binding.next;
  binding.prev.next = binding.next;
  binding.next.prev = binding.prev;
};

const detach = (binding: Binding) => {
  binding.next = binding;
  binding.prev = binding;
};

type EnodePair = readonly [Enode, Enode];

class Eval {
  private evals = new Map<number, Enode | null>();
  private indirectNodes: Enode[] = [];
  private isFreezingSwap = false;
  private diseqUndef: EnodePair | null = null;

  constructor(private ctx: EufSolver) {}

  get watch(): readonly Enode[] {
    return this.indirectNodes;
  }

  evalClause(binding: readonly Enode[], clause: Clause, evidence: EnodePair[]) {
    const result = this.evalClauseCore(binding, clause, evidence);
    this.evals.clear();
    this.diseqUndef = null;
    return result;
  }

  private evalClauseCore(binding: readonly Enode[], clause: Clause, evidence: EnodePair[]) {
    let idx = -1;
    const size = clause.lits.length;
    const numDecls = clause.numDecls;
    this.indirectNodes = [];
    for (let index = 0; index < size; index++) {
      const litIndex = (index + clause.watch) % size;
      const limit = this.indirectNodes.length;
      const lit = clause.lits[litIndex];
      const cmp = this.compare(numDecls, binding, lit.lhs, lit.rhs, evidence);
      if (cmp === L_FALSE) {
        this.indirectNodes.length = limit;
        if (!lit.sign) continue;
        clause.watch = litIndex;
        return { value: L_TRUE, idx: -1 };
      }
      if (cmp === L_TRUE) {
        this.indirectNodes.length = limit;
        if (lit.sign) continue;
        clause.watch = litIndex;
        return { value: L_TRUE, idx: -1 };
      }
      if (idx !== -1) return { value: L_UNDEF, idx: -1 };
      idx = litIndex;
    }
    if (idx === -1) return { value: L_FALSE, idx: -1 };
    clause.watch = idx;
    return { value: L_UNDEF, idx };
  }

  private compare(
    numDecls: number,
    binding: readonly Enode[],
    inputS: number,
    inputT: number,
    evidence: EnodePair[],
  ): number {
    const manager = this.ctx.manager;
    if (inputS === inputT) return L_TRUE;
    if (manager.areDistinct(inputS, inputT)) return L_FALSE;
    let sn = this.evalExpr(numDecls, binding, inputS, evidence);
    let tn = this.evalExpr(numDecls, binding, inputT, evidence);
    if (sn !== null && sn !== sn.root) {
      evidence.push([sn, sn.root]);
      sn = sn.root;
    }
    if (tn !== null && tn !== tn.root) {
      evidence.push([tn, tn.root]);
      tn = tn.root;
    }
    if (sn !== null && sn === tn) return L_TRUE;
    const diseqUndef = this.diseqUndef;
    if (sn !== null && diseqUndef !== null && sn === diseqUndef[0] && tn === diseqUndef[1])
      return L_UNDEF;
    if (sn !== null && tn !== null && this.ctx.egraph.areDiseq(sn, tn)) {
      evidence.push([sn, tn]);
      return L_FALSE;
    }
    if (sn !== null && tn !== null) {
      this.diseqUndef = [sn, tn];
      return L_UNDEF;
    }
    if (sn === null && tn === null)
      return this.compareRec(numDecls, binding, inputS, inputT, evidence);
    if (tn === null && this.isFreezingSwap) return L_UNDEF;
    const wasFreezingSwap = this.isFreezingSwap;
    this.isFreezingSwap = true;
    const isSwapped = tn === null;
    const node = (isSwapped ? sn : tn) as Enode;
    const s = isSwapped ? inputT : inputS;
    const size = evidence.length;
    for (const member of getClass(node)) {
      if (!member.isCgr) continue;
      const cmp = this.compareRec(numDecls, binding, s, member.owner, evidence);
      if (cmp !== L_UNDEF) {
        evidence.push([member, node]);
        this.isFreezingSwap = wasFreezingSwap;
        return cmp;
      }
      evidence.length = size;
    }
    this.isFreezingSwap = wasFreezingSwap;
    return L_UNDEF;
  }

  private compareRec(
    numDecls: number,
    binding: readonly Enode[],
    s: number,
    t: number,
    evidence: EnodePair[],
  ) {
    const manager = this.ctx.manager;
    if (s === t) return L_TRUE;
    if (manager.areDistinct(s, t)) return L_FALSE;
    if (!manager.isApp(s) || !manager.isApp(t)) return L_UNDEF;
    if (manager.decls[s] !== manager.decls[t]) return L_UNDEF;
    if (manager.getNumArgs(s) !== manager.getNumArgs(t)) return L_UNDEF;
    // No SMT-LIB declaration is injective in Z3, so a differing argument leaves the comparison open.
    for (let index = manager.getNumArgs(s); index-- > 0;) {
      const cmp = this.compare(
        numDecls,
        binding,
        manager.getArg(s, index),
        manager.getArg(t, index),
        evidence,
      );
      if (cmp !== L_TRUE) return L_UNDEF;
    }
    return L_TRUE;
  }

  evalExpr(numDecls: number, binding: readonly Enode[], expr: number, evidence: EnodePair[]) {
    const ctx = this.ctx;
    const manager = ctx.manager;
    const evals = this.evals;
    const cached = evals.get(expr);
    if (cached !== undefined) return cached;
    if (manager.isGroundApp(expr)) return ctx.egraph.find(expr) ?? null;
    const todo = [expr];
    while (todo.length > 0) {
      const term = todo[todo.length - 1];
      if (evals.has(term)) {
        todo.pop();
        continue;
      }
      if (
        manager.isGroundApp(term) ||
        (manager.hasQuantifierFlags[term] && manager.isGround(term))
      ) {
        const node = ctx.egraph.find(term) ?? null;
        if (node === null) return null;
        evals.set(term, node);
        todo.pop();
        continue;
      }
      if (manager.kinds[term] === KIND_VAR) {
        const index = manager.values[term];
        if (index >= numDecls) return null;
        evals.set(term, binding[numDecls - 1 - index]);
        todo.pop();
        continue;
      }
      if (!manager.isApp(term)) return null;
      const args: Enode[] = [];
      for (const arg of manager.getArgs(term)) {
        const evaluated = evals.get(arg);
        if (evaluated !== undefined) args.push(evaluated as Enode);
        else todo.push(arg);
      }
      if (args.length !== manager.getNumArgs(term)) continue;
      const node = ctx.egraph.findCongruent(
        manager.decls[term],
        args,
        args.length === 2 && manager.getOp(term) === OP_EQ,
      );
      if (node === undefined) return null;
      for (let index = args.length; index-- > 0;) {
        const first = args[index];
        const second = node.getArg(index);
        if (first === second) continue;
        if (first.root !== second.root) return null;
        evidence.push([first, second]);
      }
      this.indirectNodes.push(node);
      evals.set(term, node);
      todo.pop();
    }
    return evals.get(expr) ?? null;
  }
}

const EAGER_COST_THRESHOLD = 10;
const LAZY_COST_THRESHOLD = 20;

interface QueueEntry {
  readonly binding: Binding;
  readonly cost: number;
  isInstantiated: boolean;
}

// q::queue, with the default cost "(+ weight generation)" and new generation "cost".
class Queue {
  private newEntries: QueueEntry[] = [];
  private delayedEntries: QueueEntry[] = [];
  private subst: VarSubst;

  constructor(
    private ematch: Ematch,
    private ctx: EufSolver,
  ) {
    this.subst = new VarSubst(ctx.manager, true);
  }

  private getCost(binding: Binding) {
    const cost = this.ctx.manager.getQuantifier(binding.clause.q).weight + binding.maxGeneration;
    binding.clause.stat.maxCost = Math.max(binding.clause.stat.maxCost, cost);
    return cost;
  }

  insert(binding: Binding) {
    const cost = this.getCost(binding);
    if (this.newEntries.length === 0) this.ctx.trail.push(() => (this.newEntries = []));
    this.newEntries.push({ binding, cost, isInstantiated: false });
  }

  private instantiate(entry: QueueEntry) {
    const ctx = this.ctx;
    const manager = ctx.manager;
    const binding = entry.binding;
    entry.isInstantiated = true;
    const generation = Math.max(binding.maxGeneration + 1, Math.trunc(entry.cost));
    if (this.ematch.propagate(true, binding.nodes, generation, binding.clause).isDone) return;
    const substituted = this.subst.apply(
      manager.getQuantifier(binding.clause.q).body,
      binding.nodes.map((node) => node.owner),
    );
    const instance = ctx.rewrite(substituted);
    manager.decRef(substituted);
    if (manager.isTrue(instance)) {
      manager.decRef(instance);
      return;
    }
    const outer = ctx.generation;
    ctx.generation = generation;
    const lit = ctx.mkLiteral(instance);
    ctx.generation = outer;
    manager.decRef(instance);
    this.ematch.addInstantiation(binding.clause, binding, lit);
  }

  propagate() {
    if (this.newEntries.length === 0) return false;
    const manager = this.ctx.manager;
    for (const entry of this.newEntries) {
      if (!manager.limit.inc()) break;
      const binding = entry.binding;
      if (entry.cost <= EAGER_COST_THRESHOLD) this.instantiate(entry);
      else if (this.ematch.evaluate(binding.nodes, binding.clause) === L_FALSE)
        this.instantiate(entry);
      else {
        this.delayedEntries.push(entry);
        this.ctx.trail.push(() => this.delayedEntries.pop());
      }
    }
    this.newEntries = [];
    return true;
  }

  lazyPropagate() {
    if (this.delayedEntries.length === 0) return false;
    let isInstantiated = false;
    for (let index = 0; index < this.delayedEntries.length; index++) {
      const entry = this.delayedEntries[index];
      if (entry.isInstantiated || entry.cost > LAZY_COST_THRESHOLD) continue;
      isInstantiated = true;
      this.ctx.trail.push(() => (this.delayedEntries[index].isInstantiated = false));
      this.instantiate(entry);
    }
    return isInstantiated;
  }
}

interface Prop {
  readonly isConflict: boolean;
  readonly idx: number;
  readonly justification: number;
}

const GENERATION_PROPAGATION_THRESHOLD = 3;

export class Ematch {
  private eval: Eval;
  private bindings = new Set<string>();
  private queue: Queue;
  private props: Prop[] = [];
  private inferPatterns: PatternInferenceRw;
  private mam: Mam;
  private lazyMam: Mam | null = null;
  readonly clauses: Clause[] = [];
  private q2clauses = new Map<number, number>();
  private watches = new Map<number, number[]>();
  private isInQueueSet = false;
  private nodeInQueue = new Set<number>();
  private clauseInQueue = new Set<number>();
  private qhead = 0;
  private clauseQueue: number[] = [];
  private evidence: EnodePair[] = [];
  private names: DefinedNames;
  private nnf: Nnf;
  private numInstantiations = 0;
  private subst: VarSubst;

  constructor(
    private ctx: EufSolver,
    private qs: QSolver,
  ) {
    const manager = ctx.manager;
    this.eval = new Eval(ctx);
    this.queue = new Queue(this, ctx);
    this.inferPatterns = new PatternInferenceRw(manager, new PatternInference(manager));
    this.names = new DefinedNames(manager);
    this.nnf = new Nnf(manager, this.names);
    this.subst = new VarSubst(manager, true);
    ctx.egraph.onMerge.push((root, other) => this.onMerge(root, other));
    ctx.egraph.onMake = (node) => this.mam.addNode(node, false);
    this.mam = new Mam(ctx, this.onBinding);
  }

  private ensureGroundEnodes(expr: number) {
    for (const ground of getGroundSubterms(this.ctx.manager, expr)) this.qs.eInternalize(ground);
  }

  private ensureClauseGroundEnodes(clause: Clause) {
    const manager = this.ctx.manager;
    for (const pattern of manager.getQuantifier(clause.q).patterns)
      this.ensureGroundEnodes(pattern);
    for (const lit of clause.lits) {
      this.ensureGroundEnodes(lit.lhs);
      this.ensureGroundEnodes(lit.rhs);
    }
  }

  // mk_justification: the explanation of the evidence, taken while it is created.
  private mkJustification(
    idx: number,
    generation: number,
    clause: Clause,
    binding: readonly Enode[],
  ) {
    const ctx = this.ctx;
    const lit = idx === -1 ? null : clause.lits[idx];
    const explain: number[] = [];
    ctx.egraph.beginExplain();
    for (const pair of this.evidence) {
      if (pair[0].root === pair[1].root) ctx.egraph.explainEq(explain, pair[0], pair[1]);
      else ctx.explainDiseq(explain, pair[0], pair[1]);
    }
    ctx.egraph.endExplain();
    const justification: Justification = {
      lhs: lit === null ? -1 : lit.lhs,
      rhs: lit === null ? -1 : lit.rhs,
      sign: lit === null ? false : lit.sign,
      generation,
      explain,
      clause,
      binding,
    };
    return ctx.mkConstraint(this.qs, justification);
  }

  getAntecedents(data: unknown, antecedents: number[]) {
    const justification = data as Justification;
    for (const payload of justification.explain) this.ctx.addExplain(payload);
    antecedents.push(justification.clause.literal);
  }

  private nnfSkolem(quantifier: number) {
    const manager = this.ctx.manager;
    const definitions = new RefVector(manager);
    const normalized = this.nnf.apply(quantifier, definitions);
    const pulled = pullQuant(manager, normalized);
    manager.decRef(normalized);
    for (const definition of definitions.items) this.qs.addUnit(this.qs.mkLiteral(definition));
    definitions.reset();
    return pulled;
  }

  private onMerge(root: Enode, other: Enode) {
    this.insertToPropagate(root.owner);
    this.insertToPropagate(other.owner);
    const otherWatches = this.watches.get(other.owner);
    if (otherWatches !== undefined && otherWatches.length > 0) {
      const rootWatches = this.getWatches(root.owner);
      const size = rootWatches.length;
      this.ctx.trail.push(() => (rootWatches.length = size));
      rootWatches.push(...otherWatches);
    }
    this.mam.onMerge(root, other);
    this.lazyMam?.onMerge(root, other);
  }

  private getWatches(expr: number) {
    const existing = this.watches.get(expr);
    if (existing !== undefined) return existing;
    const created: number[] = [];
    this.watches.set(expr, created);
    return created;
  }

  private addWatch(node: Enode, clauseIndex: number) {
    const watches = this.getWatches(node.root.owner);
    const size = watches.length;
    this.ctx.trail.push(() => (watches.length = size));
    watches.push(clauseIndex);
  }

  private initWatch(expr: number, clauseIndex: number) {
    const manager = this.ctx.manager;
    const todo = [expr];
    const marked = new Set<number>();
    while (todo.length > 0) {
      const term = todo.pop() as number;
      if (marked.has(term)) continue;
      marked.add(term);
      if (manager.isGroundApp(term)) {
        this.addWatch(this.ctx.egraph.find(term) as Enode, clauseIndex);
        continue;
      }
      if (!manager.isApp(term)) continue;
      todo.push(...manager.getArgs(term));
    }
  }

  private initClauseWatch(clause: Clause) {
    const manager = this.ctx.manager;
    for (const lit of clause.lits) {
      if (!manager.isGroundApp(lit.lhs)) this.initWatch(lit.lhs, clause.index);
      if (!manager.isGroundApp(lit.rhs)) this.initWatch(lit.rhs, clause.index);
    }
  }

  private getBindingKey(clause: Clause, nodes: readonly Enode[]) {
    return `${clause.q}:${nodes.map((node) => node.owner).join(",")}`;
  }

  private allocBinding(
    clause: Clause,
    pattern: number,
    nodes: readonly Enode[],
    maxGeneration: number,
    minTopGeneration: number,
    maxTopGeneration: number,
  ) {
    if (this.bindings.has(this.getBindingKey(clause, nodes))) return null;
    if (
      this.bindings.has(
        this.getBindingKey(
          clause,
          nodes.map((node) => node.root),
        ),
      )
    )
      return null;
    const binding = new Binding(
      clause,
      pattern,
      maxGeneration,
      minTopGeneration,
      maxTopGeneration,
      [...nodes],
    );
    const key = this.getBindingKey(clause, binding.nodes);
    this.bindings.add(key);
    this.ctx.trail.push(() => this.bindings.delete(key));
    return binding;
  }

  private onBinding = (
    quantifier: number,
    pattern: number,
    nodes: readonly Enode[],
    maxGeneration: number,
    minTopGeneration: number,
    maxTopGeneration: number,
  ) => {
    const clause = this.clauses[this.q2clauses.get(quantifier) as number];
    const binding = this.allocBinding(
      clause,
      pattern,
      nodes,
      maxGeneration,
      minTopGeneration,
      maxTopGeneration,
    );
    if (binding === null) return;
    if (this.propagate(false, nodes, maxGeneration, clause).isDone) return;
    pushToFront(clause, binding);
    this.ctx.trail.push(() => {
      removeFrom(clause, binding);
      detach(binding);
    });
  };

  // propagate(is_owned, ...): whether the binding needs no instantiation, and whether it
  // propagated.
  propagate(isOwned: boolean, binding: readonly Enode[], maxGeneration: number, clause: Clause) {
    const ctx = this.ctx;
    if (ctx.s.isInconsistent) return { isDone: true, isPropagated: false };
    this.evidence = [];
    const evaluated = this.eval.evalClause(binding, clause, this.evidence);
    if (evaluated.value === L_TRUE) return { isDone: true, isPropagated: false };
    if (evaluated.value === L_UNDEF && evaluated.idx === -1) {
      for (const node of this.eval.watch) this.addWatch(node, clause.index);
      for (let index = clause.numDecls; index-- > 0;) this.addWatch(binding[index], clause.index);
      return { isDone: false, isPropagated: false };
    }
    if (evaluated.value === L_UNDEF && maxGeneration > GENERATION_PROPAGATION_THRESHOLD)
      return { isDone: false, isPropagated: false };
    const owned = isOwned ? binding : [...binding];
    const justification = this.mkJustification(evaluated.idx, maxGeneration, clause, owned);
    if (isOwned) this.propagateJustification(justification);
    else
      this.props.push({
        isConflict: evaluated.value === L_FALSE,
        idx: evaluated.idx,
        justification,
      });
    return { isDone: true, isPropagated: true };
  }

  private propagateJustification(index: number) {
    const justification = this.ctx.constraintData(index) as Justification;
    const clause = justification.clause;
    const lits = [clause.literal ^ 1];
    for (const lit of clause.lits)
      lits.push(this.instantiateLit(justification.generation, justification.binding, lit));
    this.qs.addClause(lits);
  }

  private flushPropQueue() {
    if (this.props.length === 0) return false;
    for (let index = 0; index < this.props.length; index++)
      this.propagateJustification(this.props[index].justification);
    this.props = [];
    return true;
  }

  private instantiateBinding(binding: Binding) {
    const stat = binding.clause.stat;
    stat.maxGeneration = Math.max(stat.maxGeneration, binding.maxGeneration, stat.generation);
    this.numInstantiations++;
    this.queue.insert(binding);
  }

  addInstantiation(clause: Clause, binding: Binding, lit: number) {
    this.evidence = [];
    this.ctx.propagate(lit, this.mkJustification(-1, binding.maxGeneration, clause, binding.nodes));
  }

  private instantiateLit(generation: number, binding: readonly Enode[], lit: QLit) {
    const ctx = this.ctx;
    const manager = ctx.manager;
    const args = binding.map((node) => node.owner);
    const outer = ctx.generation;
    ctx.generation = generation + 1;
    const sub = (expr: number) => {
      const substituted = this.subst.apply(expr, args);
      const result = ctx.mkLiteral(substituted);
      manager.decRef(substituted);
      return lit.sign ? result ^ 1 : result;
    };
    const result = (() => {
      if (manager.isTrue(lit.rhs)) return sub(lit.lhs);
      if (manager.isFalse(lit.rhs)) return sub(lit.lhs) ^ 1;
      const eq = manager.mkEq(lit.lhs, lit.rhs);
      manager.incRef(eq);
      const eqLit = sub(eq);
      manager.decRef(eq);
      return eqLit;
    })();
    ctx.generation = outer;
    return result;
  }

  private resetInQueue() {
    if (this.isInQueueSet) return;
    this.isInQueueSet = true;
    this.ctx.trail.push(() => {
      this.nodeInQueue.clear();
      this.clauseInQueue.clear();
      this.isInQueueSet = false;
    });
  }

  private insertToPropagate(expr: number) {
    this.resetInQueue();
    if (this.nodeInQueue.has(expr)) return;
    this.nodeInQueue.add(expr);
    for (const index of this.watches.get(expr) ?? []) this.insertClauseInQueue(index);
  }

  private insertClauseInQueue(index: number) {
    this.resetInQueue();
    if (this.clauseInQueue.has(index)) return;
    this.clauseInQueue.add(index);
    this.clauseQueue.push(index);
    this.ctx.trail.push(() => this.clauseQueue.pop());
  }

  // clausify: a basic clausifier, for a normalized quantifier.
  private clausify(quantifier: number) {
    const ctx = this.ctx;
    const manager = ctx.manager;
    const literal = ctx.mkLiteral(quantifier);
    let q = this.qs.flatten(quantifier);
    manager.incRef(q);
    const isExists = manager.getQuantifier(q).kind === QUANTIFIER_EXISTS;
    if (isExists) {
      const data = manager.getQuantifier(q);
      const body = mkNot(manager, data.body);
      manager.incRef(body);
      const updated = manager.mkQuantifier({ ...data, kind: QUANTIFIER_FORALL, body });
      manager.incRef(updated);
      manager.decRef(body);
      manager.decRef(q);
      q = updated;
    }
    const skolemized = this.nnfSkolem(q);
    manager.decRef(q);
    q = skolemized;
    const ors = new RefVector(manager);
    ors.push(manager.getQuantifier(q).body);
    flattenOrVector(manager, ors);
    const lits = ors.items.map((arg) => this.clausifyLiteral(arg));
    ors.reset();
    if (manager.getQuantifier(q).patterns.length === 0) {
      const inferred = this.inferPatterns.rewrite(q);
      manager.decRef(q);
      q = inferred;
    }
    const node = ctx.egraph.find(quantifier);
    const generation = node === undefined ? ctx.generation : node.generation;
    return new Clause(
      this.clauses.length,
      isExists ? literal ^ 1 : literal,
      lits,
      q,
      manager.getQuantifier(q).sorts.length,
      { generation, maxGeneration: 0, maxCost: 0 },
    );
  }

  private clausifyLiteral(input: number): QLit {
    const manager = this.ctx.manager;
    const isNegated = manager.isNot(input);
    const arg = isNegated ? manager.getArg(input, 0) : input;
    const parts = (() => {
      if (manager.getOp(arg) === OP_DISTINCT && manager.getNumArgs(arg) === 2)
        return { lhs: manager.getArg(arg, 0), rhs: manager.getArg(arg, 1), sign: !isNegated };
      if (!manager.isGroundApp(arg) && manager.getOp(arg) === OP_EQ)
        return { lhs: manager.getArg(arg, 0), rhs: manager.getArg(arg, 1), sign: isNegated };
      return { lhs: arg, rhs: isNegated ? manager.falseExpr : manager.trueExpr, sign: false };
    })();
    const isSwapped = manager.isTrue(parts.lhs) || manager.isFalse(parts.lhs);
    const lhs = isSwapped ? parts.rhs : parts.lhs;
    const rhs = isSwapped ? parts.lhs : parts.rhs;
    const lit =
      parts.sign && manager.isFalse(rhs)
        ? { lhs, rhs: manager.trueExpr, sign: false }
        : parts.sign && manager.isTrue(rhs)
          ? { lhs, rhs: manager.falseExpr, sign: false }
          : { lhs, rhs, sign: parts.sign };
    manager.incRef(lit.lhs);
    manager.incRef(lit.rhs);
    return lit;
  }

  // attach_ground_pattern_terms: the ground subterms of patterns appear shared.
  private attachGroundPatternTerms(pattern: number) {
    for (const ground of getGroundSubterms(this.ctx.manager, pattern)) {
      const node = this.ctx.egraph.find(ground) as Enode;
      if (node.getThVar(this.qs.id) === NULL_THEORY_VAR) this.qs.mkVar(node);
    }
  }

  private releaseClause(clause: Clause) {
    const manager = this.ctx.manager;
    for (const lit of clause.lits) {
      manager.decRef(lit.lhs);
      manager.decRef(lit.rhs);
    }
    manager.decRef(clause.q);
  }

  add(quantifier: number) {
    const ctx = this.ctx;
    const manager = ctx.manager;
    const clause = this.clausify(quantifier);
    const q = clause.q;
    if (this.q2clauses.has(q)) {
      this.releaseClause(clause);
      return;
    }
    this.ensureClauseGroundEnodes(clause);
    this.clauses.push(clause);
    this.q2clauses.set(q, clause.index);
    ctx.trail.push(() => {
      const last = this.clauses.pop() as Clause;
      this.q2clauses.delete(last.q);
      this.releaseClause(last);
    });
    this.initClauseWatch(clause);
    const patterns = manager.getQuantifier(q).patterns;
    const hasUnaryPattern = patterns.some((pattern) => manager.getNumArgs(pattern) === 1);
    const numEagerMultiPatterns = hasUnaryPattern ? 0 : 1;
    let numMultiPatterns = 0;
    for (const pattern of patterns) {
      const isUnary = manager.getNumArgs(pattern) === 1;
      if (!isUnary && numMultiPatterns >= numEagerMultiPatterns) {
        this.lazyMam ??= new Mam(ctx, this.onBinding);
        this.lazyMam.addPattern(q, pattern);
      } else this.mam.addPattern(q, pattern);
      this.attachGroundPatternTerms(pattern);
      if (!isUnary) numMultiPatterns++;
    }
  }

  unitPropagate() {
    return this.propagateAll(false);
  }

  private propagateClause(clause: Clause, isFlushing: boolean) {
    let isPropagated = false;
    const toRemove: Binding[] = [];
    const head = clause.bindings;
    if (head === null) return false;
    let binding = head;
    do {
      const result = this.propagate(true, binding.nodes, binding.maxGeneration, clause);
      isPropagated ||= result.isPropagated;
      if (result.isDone) toRemove.push(binding);
      else if (isFlushing) {
        this.instantiateBinding(binding);
        toRemove.push(binding);
        isPropagated = true;
      }
      binding = binding.next;
    } while (binding !== clause.bindings);
    for (const removed of toRemove) {
      removeFrom(clause, removed);
      detach(removed);
      this.ctx.trail.push(() => pushToFront(clause, removed));
    }
    return isPropagated;
  }

  private propagateAll(isFlushing: boolean) {
    const manager = this.ctx.manager;
    this.mam.propagate();
    let isPropagated = this.flushPropQueue();
    if (isFlushing) {
      for (const clause of this.clauses)
        if (this.propagateClause(clause, isFlushing)) isPropagated = true;
    } else {
      if (this.qhead >= this.clauseQueue.length) return this.queue.propagate() || isPropagated;
      const qhead = this.qhead;
      this.ctx.trail.push(() => (this.qhead = qhead));
      for (; this.qhead < this.clauseQueue.length && manager.limit.inc(); this.qhead++)
        if (this.propagateClause(this.clauses[this.clauseQueue[this.qhead]], isFlushing))
          isPropagated = true;
    }
    this.clauseInQueue.clear();
    this.nodeInQueue.clear();
    this.isInQueueSet = true;
    if (this.queue.propagate()) isPropagated = true;
    return isPropagated;
  }

  evaluate(binding: readonly Enode[], clause: Clause) {
    this.evidence = [];
    return this.eval.evalClause(binding, clause, this.evidence).value;
  }

  run() {
    if (this.propagateAll(false)) return true;
    this.lazyMam?.propagate();
    if (this.propagateAll(false)) return true;
    for (let index = 0; index < this.clauses.length; index++)
      if (this.clauses[index].bindings !== null) this.insertClauseInQueue(index);
    if (this.propagateAll(true)) return true;
    return this.queue.lazyPropagate();
  }
}
