// Ported from Z3 (src/smt/smt_enode.h, src/smt/smt_eq_justification.h, src/smt/smt_justification.h),
// MIT license, see z3-license.txt. E-graph nodes and the justifications for their equalities.
import type { Literal } from "./literal";

export interface Antecedents {
  markLiteral(literal: Literal): void;
  markEq(first: Enode, second: Enode): void;
  markJustification(justification: Justification): void;
  markJustifiedEq(first: Enode, second: Enode, justification: EqJustification): void;
}

export abstract class Justification {
  isMarked = false;
  abstract getAntecedents(antecedents: Antecedents): void;
}

// eq_justification: why two nodes on a transitivity branch are equal.
export type EqJustification =
  | { kind: "axiom" }
  | { kind: "congruence"; isCommutative: boolean }
  | { kind: "equation"; literal: Literal }
  | { kind: "justification"; justification: Justification };

export const AXIOM_EQ_JUSTIFICATION: EqJustification = { kind: "axiom" };

// The congruence justifications, which carry no data of their own and so are shared.
export const CONGRUENCE_JUSTIFICATIONS: readonly EqJustification[] = [
  { kind: "congruence", isCommutative: false },
  { kind: "congruence", isCommutative: true },
];

// An empty list of nodes, which nothing adds to.
export const NO_ENODES: Enode[] = [];

const IS_EQ = 1;
const IS_BOOL = 2;
const IS_MERGE_TF = 4;
const IS_CGC_ENABLED = 8;
const IS_MARKED = 16;
const IS_MARKED2 = 32;
const IS_INTERPRETED = 64;
// The number of arguments, in the bits of flags above the Boolean fields.
const NUM_ARGS_SHIFT = 7;

// The e-graph's nodes by id, a node's place in the stack of nodes, which pops a node when its
// scope is popped. The per-node data are columns indexed by id, so that a node's id reaches its
// data with no object.
export class EnodeStore {
  readonly nodes: Enode[] = [];
  // The expression and declaration of each node.
  owner = new Int32Array(1024);
  decl = new Int32Array(1024);
  root = new Int32Array(1024);
  next = new Int32Array(1024);
  classSize = new Int32Array(1024);
  cg = new Int32Array(1024);
  // The Boolean fields of each node, one bit each, and its number of arguments in the bits above.
  flags = new Int32Array(1024);
  generation = new Int32Array(1024);
  // The theory variable of each node, or -1.
  thVar = new Int32Array(1024);
  // The scope level at which each node was made.
  iscopeLevel = new Int32Array(1024);
  // The approximate label sets of each class, 64 bits each in two words, four words a node from
  // 4 * id: the labels' low and high words, then the parent labels'.
  labels = new Int32Array(4 * 1024);
  // The hash of each node's label, or -1 before the matcher sets it.
  lblHash = new Int32Array(1024);
  // The arguments of each node from argStart, in one stack that a popped node releases.
  argStart = new Int32Array(1024);
  argPool = new Int32Array(1024);
  private argTop = 0;
  // The parents of each node, parentCount of them from parentStart in one pool, where the node's
  // block has room for parentCapacity. A full block moves to the top of the pool with twice the
  // room, and the pool packs its blocks when it fills. An id keeps its block when it is reused.
  parentStart = new Int32Array(1024);
  parentCount = new Int32Array(1024);
  parentCapacity = new Int32Array(1024);
  parentPool = new Int32Array(4096);
  private parentTop = 0;

  // The id of a new node, which goes on the stack, with columns of room for it.
  allocate(node: Enode) {
    const id = this.nodes.length;
    this.nodes.push(node);
    if (id === this.root.length) {
      this.owner = growColumn(this.owner);
      this.decl = growColumn(this.decl);
      this.root = growColumn(this.root);
      this.next = growColumn(this.next);
      this.classSize = growColumn(this.classSize);
      this.cg = growColumn(this.cg);
      this.flags = growColumn(this.flags);
      this.generation = growColumn(this.generation);
      this.thVar = growColumn(this.thVar);
      this.iscopeLevel = growColumn(this.iscopeLevel);
      this.labels = growColumn(this.labels);
      this.lblHash = growColumn(this.lblHash);
      this.argStart = growColumn(this.argStart);
      this.parentStart = growColumn(this.parentStart);
      this.parentCount = growColumn(this.parentCount);
      this.parentCapacity = growColumn(this.parentCapacity);
    }
    this.argStart[id] = this.argTop;
    this.parentCount[id] = 0;
    this.root[id] = id;
    this.next[id] = id;
    this.classSize[id] = 1;
    this.cg[id] = id;
    this.thVar[id] = -1;
    this.labels.fill(0, 4 * id, 4 * id + 4);
    this.lblHash[id] = -1;
    return id;
  }

  // Appends an argument to the node allocated last.
  pushArg(arg: number) {
    if (this.argTop === this.argPool.length) this.argPool = growColumn(this.argPool);
    this.argPool[this.argTop++] = arg;
  }

  addParent(id: number, parent: number) {
    const count = this.parentCount[id];
    if (count === this.parentCapacity[id]) this.moveParents(id, Math.max(2, 2 * count));
    this.parentPool[this.parentStart[id] + count] = parent;
    this.parentCount[id] = count + 1;
  }

  // Gives the node's parents a block with room for capacity at the top of the pool.
  private moveParents(id: number, capacity: number) {
    if (this.parentTop + capacity > this.parentPool.length) this.packParents(capacity);
    const start = this.parentTop;
    this.parentPool.copyWithin(
      start,
      this.parentStart[id],
      this.parentStart[id] + this.parentCount[id],
    );
    this.parentStart[id] = start;
    this.parentCapacity[id] = capacity;
    this.parentTop = start + capacity;
  }

  // Copies the blocks of the ids that have one to the start of a pool with room for need more,
  // which is twice as long when they fill more than half of it.
  private packParents(need: number) {
    const numIds = this.parentStart.length;
    let used = need;
    for (let id = 0; id < numIds; id++) used += this.parentCapacity[id];
    const pool = new Int32Array(
      2 * used > this.parentPool.length
        ? 2 * Math.max(used, this.parentPool.length)
        : this.parentPool.length,
    );
    let top = 0;
    for (let id = 0; id < numIds; id++) {
      const capacity = this.parentCapacity[id];
      if (capacity === 0) continue;
      const start = this.parentStart[id];
      pool.set(this.parentPool.subarray(start, start + this.parentCount[id]), top);
      this.parentStart[id] = top;
      top += capacity;
    }
    this.parentPool = pool;
    this.parentTop = top;
  }

  // Pops the node on top of the stack, and releases its arguments.
  pop() {
    const id = this.nodes.length - 1;
    this.argTop = this.argStart[id];
    this.nodes.pop();
  }
}

const growColumn = (column: Int32Array) => {
  const grown = new Int32Array(2 * column.length);
  grown.set(column);
  return grown;
};

export class Enode {
  readonly id: number;
  // m_trans: the next node on the transitivity branch toward the root of the proof tree, and why the
  // two are equal.
  transTarget: Enode | null = null;
  transJustification: EqJustification = AXIOM_EQ_JUSTIFICATION;

  // moreArgs are the arguments past the second, and arg0 and arg1 are null when there are fewer.
  constructor(
    readonly store: EnodeStore,
    owner: number,
    decl: number,
    numArgs: number,
    arg0: Enode | null,
    arg1: Enode | null,
    moreArgs: Enode[],
    generation: number,
    isEq: boolean,
    isBool: boolean,
    isMergeTf: boolean,
    isCgcEnabled: boolean,
    iscopeLevel: number,
  ) {
    this.id = store.allocate(this);
    store.owner[this.id] = owner;
    store.decl[this.id] = decl;
    store.generation[this.id] = generation;
    store.iscopeLevel[this.id] = iscopeLevel;
    if (arg0 !== null) store.pushArg(arg0.id);
    if (arg1 !== null) store.pushArg(arg1.id);
    for (const arg of moreArgs) store.pushArg(arg.id);
    store.flags[this.id] =
      (numArgs << NUM_ARGS_SHIFT) |
      (isEq ? IS_EQ : 0) |
      (isBool ? IS_BOOL : 0) |
      (isMergeTf ? IS_MERGE_TF : 0) |
      (isCgcEnabled ? IS_CGC_ENABLED : 0);
  }

  get root() {
    return this.store.nodes[this.store.root[this.id]];
  }

  set root(value: Enode) {
    this.store.root[this.id] = value.id;
  }

  get next() {
    return this.store.nodes[this.store.next[this.id]];
  }

  set next(value: Enode) {
    this.store.next[this.id] = value.id;
  }

  get classSize() {
    return this.store.classSize[this.id];
  }

  set classSize(value: number) {
    this.store.classSize[this.id] = value;
  }

  get cg() {
    return this.store.nodes[this.store.cg[this.id]];
  }

  set cg(value: Enode) {
    this.store.cg[this.id] = value.id;
  }

  get owner() {
    return this.store.owner[this.id];
  }

  get decl() {
    return this.store.decl[this.id];
  }

  get generation() {
    return this.store.generation[this.id];
  }

  set generation(value: number) {
    this.store.generation[this.id] = value;
  }

  get thVar() {
    return this.store.thVar[this.id];
  }

  set thVar(value: number) {
    this.store.thVar[this.id] = value;
  }

  get lbls() {
    return this.store.labels[4 * this.id];
  }

  set lbls(value: number) {
    this.store.labels[4 * this.id] = value;
  }

  get lblsHigh() {
    return this.store.labels[4 * this.id + 1];
  }

  set lblsHigh(value: number) {
    this.store.labels[4 * this.id + 1] = value;
  }

  get plbls() {
    return this.store.labels[4 * this.id + 2];
  }

  set plbls(value: number) {
    this.store.labels[4 * this.id + 2] = value;
  }

  get plblsHigh() {
    return this.store.labels[4 * this.id + 3];
  }

  set plblsHigh(value: number) {
    this.store.labels[4 * this.id + 3] = value;
  }

  get lblHash() {
    return this.store.lblHash[this.id];
  }

  set lblHash(value: number) {
    this.store.lblHash[this.id] = value;
  }

  get iscopeLevel() {
    return this.store.iscopeLevel[this.id];
  }

  private get flags() {
    return this.store.flags[this.id];
  }

  private setFlag(flag: number, value: boolean) {
    const flags = this.store.flags;
    flags[this.id] = value ? flags[this.id] | flag : flags[this.id] & ~flag;
  }

  get numArgs() {
    return this.flags >>> NUM_ARGS_SHIFT;
  }

  // The argument, and for a missing first or second argument the node itself, like Z3's m_args.
  getArg(index: number) {
    const store = this.store;
    if (index < this.numArgs) return store.nodes[store.argPool[store.argStart[this.id] + index]];
    return this;
  }

  get isEq() {
    return (this.flags & IS_EQ) !== 0;
  }

  get isBool() {
    return (this.flags & IS_BOOL) !== 0;
  }

  get isCgcEnabled() {
    return (this.flags & IS_CGC_ENABLED) !== 0;
  }

  get isMergeTf() {
    return (this.flags & IS_MERGE_TF) !== 0;
  }

  set isMergeTf(value: boolean) {
    this.setFlag(IS_MERGE_TF, value);
  }

  get isMarked() {
    return (this.flags & IS_MARKED) !== 0;
  }

  set isMarked(value: boolean) {
    this.setFlag(IS_MARKED, value);
  }

  get isMarked2() {
    return (this.flags & IS_MARKED2) !== 0;
  }

  set isMarked2(value: boolean) {
    this.setFlag(IS_MARKED2, value);
  }

  get isInterpreted() {
    return (this.flags & IS_INTERPRETED) !== 0;
  }

  set isInterpreted(value: boolean) {
    this.setFlag(IS_INTERPRETED, value);
  }

  get numParents() {
    return this.store.parentCount[this.id];
  }

  getParent(index: number) {
    const store = this.store;
    return store.nodes[store.parentPool[store.parentStart[this.id] + index]];
  }

  addParent(parent: Enode) {
    this.store.addParent(this.id, parent.id);
  }

  popParent() {
    this.store.parentCount[this.id]--;
  }

  shrinkParents(count: number) {
    this.store.parentCount[this.id] = count;
  }

  isCgr() {
    return this.cg === this;
  }

  isTrueEq() {
    return this.isEq && this.getArg(0).root === this.getArg(1).root;
  }

  usesCgTable() {
    return this.numArgs > 0 && this.isCgcEnabled && !this.isTrueEq();
  }
}

// eq_propagation_justification: the equality atom is true because its sides are in one class.
export class EqPropagationJustification extends Justification {
  constructor(
    private first: Enode,
    private second: Enode,
  ) {
    super();
  }

  getAntecedents(antecedents: Antecedents) {
    antecedents.markEq(this.first, this.second);
  }
}

// eq_root_propagation_justification: a Boolean node merged with true or false.
export class EqRootPropagationJustification extends Justification {
  constructor(private node: Enode) {
    super();
  }

  getAntecedents(antecedents: Antecedents) {
    antecedents.markEq(this.node, this.node.root);
  }
}

// eq_conflict_justification: two interpreted roots, such as two numerals, were merged.
export class EqConflictJustification extends Justification {
  constructor(
    private first: Enode,
    private second: Enode,
    private justification: EqJustification,
  ) {
    super();
  }

  getAntecedents(antecedents: Antecedents) {
    antecedents.markEq(this.first, this.first.root);
    antecedents.markEq(this.second, this.second.root);
    antecedents.markJustifiedEq(this.first, this.second, this.justification);
  }
}

// mp_iff_justification: a Boolean node takes the value of an equal node.
export class MpIffJustification extends Justification {
  constructor(
    private first: Enode,
    private second: Enode,
    private getLiteral: (node: Enode) => Literal,
  ) {
    super();
  }

  getAntecedents(antecedents: Antecedents) {
    antecedents.markEq(this.first, this.second);
    antecedents.markLiteral(this.getLiteral(this.first));
  }
}

// unit_resolution_justification: a clause simplified with literals that were false.
export class UnitResolutionJustification extends Justification {
  constructor(
    private justification: Justification | null,
    private literals: Literal[],
  ) {
    super();
  }

  getAntecedents(antecedents: Antecedents) {
    if (this.justification !== null) antecedents.markJustification(this.justification);
    for (const literal of this.literals) antecedents.markLiteral(literal);
  }
}

// ext_theory_propagation_justification: theory reasoning from literals and equalities.
export class TheoryJustification extends Justification {
  constructor(
    private literals: Literal[],
    private eqs: Enode[],
  ) {
    super();
  }

  getAntecedents(antecedents: Antecedents) {
    for (const literal of this.literals) antecedents.markLiteral(literal);
    for (let index = 0; index < this.eqs.length; index += 2)
      antecedents.markEq(this.eqs[index], this.eqs[index + 1]);
  }
}
