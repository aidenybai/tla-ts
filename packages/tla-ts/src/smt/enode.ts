// Ported from Z3 (src/smt/smt_enode.h, src/smt/smt_eq_justification.h, src/smt/smt_justification.h),
// MIT license, see z3-license.txt. E-graph nodes and the justifications for their equalities.

export const EQ_AXIOM = 0;
export const EQ_CONGRUENCE = 1;
export const EQ_EQUATION = 2;
export const EQ_JUSTIFICATION = 3;

export interface Antecedents {
  markLiteral(literal: number): void;
  markEq(first: Enode, second: Enode): void;
  markJustification(justification: Justification): void;
  markJustifiedEq(first: Enode, second: Enode, justification: EqJustification): void;
}

export abstract class Justification {
  isMarked = false;
  abstract getAntecedents(antecedents: Antecedents): void;
}

// eq_justification: why two nodes on a transitivity branch are equal.
export interface EqJustification {
  kind: number;
  literal: number;
  isCommutative: boolean;
  justification: Justification | null;
}

export const AXIOM_EQ_JUSTIFICATION: EqJustification = {
  kind: EQ_AXIOM,
  literal: -1,
  isCommutative: false,
  justification: null,
};

export const mkLiteralEqJustification = (literal: number): EqJustification => ({
  kind: EQ_EQUATION,
  literal,
  isCommutative: false,
  justification: null,
});

export const mkCongruenceEqJustification = (isCommutative: boolean): EqJustification => ({
  kind: EQ_CONGRUENCE,
  literal: -1,
  isCommutative,
  justification: null,
});

export const mkJustificationEqJustification = (justification: Justification): EqJustification => ({
  kind: EQ_JUSTIFICATION,
  literal: -1,
  isCommutative: false,
  justification,
});

export class Enode {
  root: Enode = this;
  next: Enode = this;
  cg: Enode = this;
  classSize = 1;
  parents: Enode[] = [];
  transTarget: Enode | null = null;
  transJustification: EqJustification = AXIOM_EQ_JUSTIFICATION;
  boolVar = -1;
  thVar = -1;
  lbls = 0;
  plbls = 0;
  lblHash = -1;
  isMarked = false;
  isMarked2 = false;
  isInterpreted = false;

  constructor(
    readonly owner: number,
    readonly decl: number,
    readonly args: Enode[],
    public generation: number,
    readonly isEq: boolean,
    readonly isBool: boolean,
    public isMergeTf: boolean,
    readonly isCgcEnabled: boolean,
    readonly iscopeLevel: number,
  ) {}

  isCgr() {
    return this.cg === this;
  }

  isTrueEq() {
    return this.isEq && this.args[0].root === this.args[1].root;
  }

  usesCgTable() {
    return this.args.length > 0 && this.isCgcEnabled;
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
    private getLiteral: (node: Enode) => number,
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
    private literals: number[],
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
    private literals: number[],
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
