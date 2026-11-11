import { compareValues } from "../ocaml";

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

export const compareAxioms = (left: Axiom, right: Axiom) =>
  getAxiomRank(left) - getAxiomRank(right) || compareValues(left.args, right.args);
