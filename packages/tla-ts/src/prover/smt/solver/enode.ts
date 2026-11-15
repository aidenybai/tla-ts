// Ported from Z3 (src/smt/smt_enode.h, src/smt/smt_eq_justification.h, src/smt/smt_justification.h), MIT license, see z3-license.txt.
import type { Literal } from "./literal";

export interface Antecedents {
  markLiteral(literal: Literal): void;
  markEq(first: Enode, second: Enode): void;
  markJustification(justification: Justification): void;
  markJustifiedEq(first: Enode, second: Enode, justification: EqJustification): void;
}

export abstract class Justification {
  isMarked = false;
  readonly fromTheory: number = -1;
  abstract getAntecedents(antecedents: Antecedents): void;
}

export type EqJustification =
  | { kind: "axiom" }
  | { kind: "congruence"; isCommutative: boolean }
  | { kind: "equation"; literal: Literal }
  | { kind: "justification"; justification: Justification };

export const AXIOM_EQ_JUSTIFICATION: EqJustification = { kind: "axiom" };

export const CONGRUENCE_JUSTIFICATIONS: readonly EqJustification[] = [
  { kind: "congruence", isCommutative: false },
  { kind: "congruence", isCommutative: true },
];

export const NO_ENODES: Enode[] = [];

const IS_EQ = 1;
const IS_BOOL = 2;
const IS_MERGE_TF = 4;
const IS_CGC_ENABLED = 8;
const IS_MARKED = 16;
const IS_MARKED2 = 32;
const IS_INTERPRETED = 64;
const NUM_ARGS_SHIFT = 7;

class ThVarCell {
  constructor(
    public thId: number,
    public thVar: number,
    public next: ThVarCell | null,
  ) {}
}

export class Enode {
  root: Enode = this;
  next: Enode = this;
  cg: Enode = this;
  classSize = 1;
  parents: Enode[] = NO_ENODES;
  transTarget: Enode | null = null;
  transJustification: EqJustification = AXIOM_EQ_JUSTIFICATION;
  // The first theory variable inline, -1 when there is none, then the rest in the order added.
  thVar = -1;
  thId = -1;
  thNext: ThVarCell | null = null;
  lbls = 0;
  lblsHigh = 0;
  plbls = 0;
  plblsHigh = 0;
  lblHash = -1;
  private flags: number;
  private readonly arg0: Enode;
  private readonly arg1: Enode;
  private readonly moreArgs: Enode[];

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

  getThVar(thId: number) {
    if (this.thVar < 0) return -1;
    if (this.thId === thId) return this.thVar;
    for (let cell = this.thNext; cell !== null; cell = cell.next)
      if (cell.thId === thId) return cell.thVar;
    return -1;
  }

  forEachThVar(visit: (thId: number, thVar: number) => void) {
    if (this.thVar < 0) return;
    visit(this.thId, this.thVar);
    for (let cell = this.thNext; cell !== null; cell = cell.next) visit(cell.thId, cell.thVar);
  }

  addThVar(thVar: number, thId: number) {
    if (this.thVar < 0) {
      this.thVar = thVar;
      this.thId = thId;
      this.thNext = null;
      return;
    }
    const cell = new ThVarCell(thId, thVar, null);
    if (this.thNext === null) {
      this.thNext = cell;
      return;
    }
    let last = this.thNext;
    while (last.next !== null) last = last.next;
    last.next = cell;
  }

  replaceThVar(thVar: number, thId: number) {
    if (this.thId === thId) {
      this.thVar = thVar;
      return;
    }
    for (let cell = this.thNext; cell !== null; cell = cell.next)
      if (cell.thId === thId) {
        cell.thVar = thVar;
        return;
      }
  }

  delThVar(thId: number) {
    if (this.thId === thId) {
      const next = this.thNext;
      this.thVar = next === null ? -1 : next.thVar;
      this.thId = next === null ? -1 : next.thId;
      this.thNext = next === null ? null : next.next;
      return;
    }
    let previous: ThVarCell | null = null;
    for (let cell = this.thNext; cell !== null; previous = cell, cell = cell.next) {
      if (cell.thId !== thId) continue;
      if (previous === null) this.thNext = cell.next;
      else previous.next = cell.next;
      return;
    }
  }

  restoreThVars(getEnode: (thId: number, thVar: number) => Enode) {
    const kept: [number, number][] = [];
    this.forEachThVar((thId, thVar) => {
      if (getEnode(thId, thVar).root === this) kept.push([thId, thVar]);
    });
    this.thVar = -1;
    this.thId = -1;
    this.thNext = null;
    for (const entry of kept) this.addThVar(entry[1], entry[0]);
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

export class EqRootPropagationJustification extends Justification {
  constructor(private node: Enode) {
    super();
  }

  getAntecedents(antecedents: Antecedents) {
    antecedents.markEq(this.node, this.node.root);
  }
}

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

export class TheoryJustification extends Justification {
  constructor(
    readonly fromTheory: number,
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
