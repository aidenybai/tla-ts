// encode/n_table.ml: the axioms tlapm's SMT encoding can assert, in the order it prints them.

import { compareValues } from "../ocaml";

// The order of tlapm's Table.tla_axm constructors. OCaml compares constant constructors before
// those with arguments, so the axioms of an obligation print in this order.
const CONSTANT_AXIOMS = [
  "ChooseDef",
  "ChooseExt",
  "SetExt",
  "SubsetEqDef",
  "SubsetEqIntro",
  "SubsetEqElim",
  "UnionDef",
  "UnionIntro",
  "UnionElim",
  "SubsetDef",
  "SubsetDefAlt",
  "SubsetIntro",
  "SubsetElim",
  "CupDef",
  "CapDef",
  "SetMinusDef",
  "SetStDef",
  "NatSetDef",
  "IntPlusTyping",
  "IntUminusTyping",
  "IntMinusTyping",
  "IntTimesTyping",
  "IntQuotientTyping",
  "IntRemainderTyping",
  "IntExpTyping",
  "NatPlusTyping",
  "NatTimesTyping",
  "IntRangeDef",
  "NonNegIsPos",
  "LteqReflexive",
  "LteqTransitive",
  "LteqAntisym",
  "FunExt",
  "FunConstrIsafcn",
  "FunSetDef",
  "FunSetIntro",
  "FunSetElim1",
  "FunSetElim2",
  "FunSetImIntro",
  "FunSetSubs",
  "FunDomDef",
  "FunAppDef",
  "FunTyping",
  "FunExceptIsafcn",
  "FunExceptDomDef",
  "FunExceptAppDef1",
  "FunExceptAppDef2",
  "FunExceptTyping",
  "FunImDef",
  "FunImIntro",
  "FunImElim",
  "SeqSetIntro",
  "SeqSetElim1",
  "SeqSetElim2",
  "SeqLenDef",
  "SeqCatTyping",
  "SeqCatLen",
  "SeqCatApp1",
  "SeqCatApp2",
  "SeqAppendTyping",
  "SeqAppendLen",
  "SeqAppendApp1",
  "SeqAppendApp2",
  "SeqHeadDef",
  "SeqTailTyping",
  "SeqTailLen",
  "SeqTailApp",
  "SeqSubseqTyping",
  "SeqSubseqLen",
  "SeqSubseqApp",
  "SeqSelectseqTyping",
  "SeqSelectseqLen",
  "SeqSelectseqNil",
  "SeqSelectseqApp",
  "SeqSelectseqAppend",
  "DisjointTrigger",
  "EmptyComprehensionTrigger",
  "CompareSetOfTrigger",
];

const BLOCK_AXIOMS = [
  "EnumDef",
  "EnumDefIntro",
  "EnumDefElim",
  "SetOfDef",
  "SetOfIntro",
  "SetOfElim",
  "StrLitIsstr",
  "StrLitDistinct",
  "IntLitIsint",
  "IntLitDistinct",
  "IntLitZeroCmp",
  "TupIsafcn",
  "TupDomDef",
  "TupAppDef",
  "TupExcept",
  "ProductDef",
  "ProductIntro",
  "ProductElim",
  "RecIsafcn",
  "RecDomDef",
  "RecAppDef",
  "RecExcept",
  "RecSetDef",
  "RecSetIntro",
  "RecSetElim",
  "SeqTupTyping",
  "SeqTupLen",
  "CastInj",
  "CastInjAlt",
  "TypeGuard",
  "TypeGuardIntro",
  "TypeGuardElim",
  "Typing",
  "ExtTrigEqDef",
  "ExtTrigEqTrigger",
  "AssertIsSetOf",
];

// Table.tla_smb's typed constant constructors, which Typing takes, in order.
export const TYPED_SYMBOLS = [
  "TIntPlus",
  "TIntUminus",
  "TIntMinus",
  "TIntTimes",
  "TIntQuotient",
  "TIntRemainder",
  "TIntLteq",
];

export type AxiomArgument = number | string | string[];

// An axiom without a formula belongs to a second-order symbol. Flattening instantiates it for
// each use of the symbol, and otherwise it isn't printed.
export interface Axiom {
  name: string;
  args: AxiomArgument[];
  label: string;
  formula: string | undefined;
}

export const axiom = (
  name: string,
  args: AxiomArgument[],
  formula: string | undefined,
  label?: string,
): Axiom => ({
  name,
  args,
  label: label ?? [name, ...args.flat()].join(" "),
  formula,
});

export const getAxiomKey = (entry: Axiom) => `${entry.name} ${JSON.stringify(entry.args)}`;

const getAxiomRank = (entry: Axiom) => {
  const constant = CONSTANT_AXIOMS.indexOf(entry.name);
  return constant === -1 ? CONSTANT_AXIOMS.length + BLOCK_AXIOMS.indexOf(entry.name) : constant;
};

// N_axiomatize.TlaAxmSet orders axioms as OCaml's compare does.
export const compareAxioms = (left: Axiom, right: Axiom) =>
  getAxiomRank(left) - getAxiomRank(right) || compareValues(left.args, right.args);
