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

// The parents of a node without any, and the arguments past the second of a node with at most two.
// Nothing adds to it: addParent gives a node its own list, so that a node with one parent holds one
// entry instead of V8's sixteen.
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

export class Enode {
  root: Enode = this;
  next: Enode = this;
  cg: Enode = this;
  classSize = 1;
  parents: Enode[] = NO_ENODES;
  // m_trans: the next node on the transitivity branch toward the root of the proof tree, and why the
  // two are equal.
  transTarget: Enode | null = null;
  transJustification: EqJustification = AXIOM_EQ_JUSTIFICATION;
  thVar = -1;
  // The approximate label sets of the class, 64 bits in two words: the low 32 bits, then the high.
  lbls = 0;
  lblsHigh = 0;
  plbls = 0;
  plblsHigh = 0;
  lblHash = -1;
  // The Boolean fields, one bit each, so a node takes 48 bytes less, and the number of arguments.
  private flags: number;
  // m_args: the first two arguments inline, like Z3's arguments after the node, and the rest in an
  // array. A missing argument is the node itself.
  private readonly arg0: Enode;
  private readonly arg1: Enode;
  private readonly moreArgs: Enode[];

  // moreArgs are the arguments past the second, and arg0 and arg1 are null when there are fewer.
  constructor(
    readonly owner: number,
    readonly decl: number,
    numArgs: number,
    arg0: Enode | null,
    arg1: Enode | null,
    moreArgs: Enode[],
    public generation: number,
    isEq: boolean,
    isBool: boolean,
    isMergeTf: boolean,
    isCgcEnabled: boolean,
    readonly iscopeLevel: number,
  ) {
    this.arg0 = arg0 ?? this;
    this.arg1 = arg1 ?? this;
    this.moreArgs = moreArgs;
    this.flags =
      (numArgs << NUM_ARGS_SHIFT) |
      (isEq ? IS_EQ : 0) |
      (isBool ? IS_BOOL : 0) |
      (isMergeTf ? IS_MERGE_TF : 0) |
      (isCgcEnabled ? IS_CGC_ENABLED : 0);
  }

  private setFlag(flag: number, value: boolean) {
    this.flags = value ? this.flags | flag : this.flags & ~flag;
  }

  get numArgs() {
    return this.flags >>> NUM_ARGS_SHIFT;
  }

  getArg(index: number) {
    return index === 0 ? this.arg0 : index === 1 ? this.arg1 : this.moreArgs[index - 2];
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

  addParent(parent: Enode) {
    if (this.parents.length === 0) this.parents = [parent];
    else this.parents.push(parent);
  }

  isCgr() {
    return this.cg === this;
  }

  isTrueEq() {
    return this.isEq && this.arg0.root === this.arg1.root;
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
