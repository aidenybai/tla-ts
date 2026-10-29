// Encodes a proof obligation in SMT-LIB as tlapm's SMT backend does (encode/ and
// backend/smtlib.ml): TLA+ values share one sort Idv, set membership is the predicate TLA__Mem,
// and each symbol the obligation uses brings the symbols and axioms encode/n_data.ml lists for it.

import { TlaUnsupportedError } from "./errors";
import { getMd5 } from "./md5";
import {
  adjoin,
  applyBuiltin,
  bumpBy,
  consSubstitution,
  isEqualExpr,
  mapAccumulate,
  mapChildren,
  normalizeApply,
  shift,
  shiftExpr,
  substituteExpr,
  substituteHyp,
  substituteSequent,
  type Bound,
  type Builtin,
  type Expr,
  type Hyp,
  type Scope,
  type Sequent,
  type Substitution,
} from "./obligation-expression";
import { getLevelInfo } from "./obligation-levels";
import type { ObligationKind } from "./obligation-proof";

// Method.default_smt2_timeout.
const DEFAULT_TIME_LIMIT_MS = 5000;

export type Encoding =
  | { kind: "trivial" }
  | { kind: "unsupported"; reason: string }
  | { kind: "smt"; script: string; omitted: string | undefined };

export interface ObligationEncoding {
  encoding: Encoding;
  timeLimitMs: number;
}

// The provers that TLAPS.tla's pragmas select. SMT and Z3 run Z3, as tlapm does by default.
// Only the definitions with a pragma comment in TLAPS.tla select a prover.
const PRAGMA_PROVERS: Record<string, string> = {
  SMT: "smt",
  SMTT: "smt",
  SimpleArithmetic: "smt",
  Z3: "smt",
  Z3T: "smt",
  AllSMT: "smt",
  AllSMTT: "smt",
  AllProvers: "smt",
  AllProversT: "smt",
  CVC3: "cvc33",
  CVC3T: "cvc33",
  CVC4: "cvc33",
  CVC4T: "cvc33",
  Yices: "yices3",
  YicesT: "yices3",
  veriT: "verit",
  veriTT: "verit",
  Zipper: "zipper",
  ZipperT: "zipper",
  Spass: "spass",
  SpassT: "spass",
  LS4: "ls4",
  LS4T: "ls4",
  PTL: "ls4",
  Zenon: "zenon",
  ZenonT: "zenon",
  SlowZenon: "zenon",
  SlowerZenon: "zenon",
  VerySlowZenon: "zenon",
  SlowestZenon: "zenon",
  Isa: "isabelle",
  IsaT: "isabelle",
  IsaM: "isabelle",
  IsaMT: "isabelle",
  IsaWithSetExtensionality: "isabelle",
  Auto: "isabelle",
  SlowAuto: "isabelle",
  SlowerAuto: "isabelle",
  SlowestAuto: "isabelle",
  Force: "isabelle",
  SlowForce: "isabelle",
  SlowerForce: "isabelle",
  SlowestForce: "isabelle",
  SimplifyAndSolve: "isabelle",
  SlowSimplifyAndSolve: "isabelle",
  SlowerSimplifyAndSolve: "isabelle",
  SlowestSimplifyAndSolve: "isabelle",
  Simplification: "isabelle",
  SlowSimplification: "isabelle",
  SlowerSimplification: "isabelle",
  SlowestSimplification: "isabelle",
  Blast: "isabelle",
  SlowBlast: "isabelle",
  SlowerBlast: "isabelle",
  SlowestBlast: "isabelle",
  AutoBlast: "isabelle",
  AllIsa: "isabelle",
  AllIsaT: "isabelle",
  ExpandENABLED: "expandenabled",
  ExpandCdot: "expandcdot",
  AutoUSE: "autouse",
  Lambdify: "lambdify",
  ENABLEDaxioms: "enabledaxioms",
  LevelComparison: "levelcomparison",
  Trivial: "trivial",
};

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
const TYPED_SYMBOLS = [
  "TIntPlus",
  "TIntUminus",
  "TIntMinus",
  "TIntTimes",
  "TIntQuotient",
  "TIntRemainder",
  "TIntLteq",
];

type AxiomArgument = number | string | string[];

// An axiom without a formula belongs to a second-order symbol. Flattening instantiates it for
// each use of the symbol, and otherwise it isn't printed.
interface Axiom {
  name: string;
  args: AxiomArgument[];
  label: string;
  formula: string | undefined;
}

interface SymbolSpec {
  declaration: string | undefined;
  deps: string[];
  axioms: Axiom[];
}

// N_data.s: what the symbols collected so far change about the axioms of the next ones.
interface CollectState {
  strings: string[];
  isFunConstr: boolean;
  isFunSet: boolean;
  isExcept: boolean;
  tuples: number[];
  records: string[][];
  anonymous: Map<string, number>;
}

interface Method {
  prover: string;
  argument: Expr | undefined;
}

interface Term {
  isBool: boolean;
  text: string;
  // Type.Synthesize: the Int-sorted form of a term that is an integer before it's cast to Idv.
  integer?: string;
}

// What tlapm keeps across the obligations of one run.
export interface EncodingSession {
  caseErrors: number;
}

type Polarity = "Positive" | "Negative" | "Neither";

interface Mode {
  isPrimed: boolean;
  polarity: Polarity;
  at: string | undefined;
  depth: number;
}

type Binding =
  | { kind: "constant"; symbol: string }
  | { kind: "variable"; symbol: string; primed: string }
  | { kind: "operator"; symbol: string; arity: number; opaque: string | undefined }
  | { kind: "secondOrder"; name: string; shapes: number[] }
  | { kind: "unsupported"; reason: string };

interface Env {
  binding: Binding;
  rest: Env | undefined;
}

// A symbol that Flatten introduces for a second-order construct, with the text tlapm's collect
// pass visits for its higher-order arguments.
interface Flattened {
  symbol: string;
  kind: string;
  visit: string;
  getLines: (axioms: Set<string>) => string[];
}

type Entry = string | Flattened;

// A quantifier's variables, in scope until the quantifier's closing parenthesis.
interface QuantifierScope {
  depth: number;
  exits: (() => void)[];
}

interface Identifier {
  base: string;
  salt: number;
  name: string;
}

const getPragmaProver = (hyp: Hyp | undefined) => {
  if (hyp?.kind !== "Defn" || hyp.definition.kind !== "Operator") return undefined;
  // TLAPS's pragmas keep their meaning through an INSTANCE, as in C!SMT, and when tla-ts renames
  // a second copy of one, as in SMT$41.
  const prover = PRAGMA_PROVERS[hyp.definition.name.replace(/^.*!/, "").replace(/\$\d+$/, "")];
  const body = hyp.definition.body;
  const value = body.kind === "Lambda" ? body.body : body;
  return value.kind === "Internal" && value.builtin === "TRUE" ? prover : undefined;
};

const getPragmaMethod = (context: Hyp[], index: number, expression: Expr): Method | undefined => {
  const operator = expression.kind === "Apply" ? expression.operator : expression;
  if (operator.kind !== "Ix") return undefined;
  const prover = getPragmaProver(context[index - operator.index]);
  if (prover === undefined) return undefined;
  return { prover, argument: expression.kind === "Apply" ? expression.args.at(-1) : undefined };
};

// Prep.find_meth takes the provers from the pragmas the obligation cites. tla-ts doesn't record
// which BY or USE cited a fact, so the last run of adjacent pragma facts stands for the latest.
const findMethods = (context: Hyp[]) => {
  const runs = context.reduce<Method[][]>(
    (found, hyp, index) => {
      const method =
        hyp.kind === "Fact" && hyp.visibility === "Visible"
          ? getPragmaMethod(context, index, hyp.expression)
          : undefined;
      if (!method) return found.at(-1)?.length === 0 ? found : [...found, []];
      found.at(-1)?.push(method);
      return found;
    },
    [[]],
  );
  return runs.findLast((run) => run.length > 0) ?? [];
};

// Prep.compute_meth: SMTT(n) gives the solver n seconds. tla-ts's solver has no resource limit,
// so SMTT("rN") keeps the default time.
const getTimeLimit = (argument: Expr | undefined) =>
  argument?.kind === "Num"
    ? Number(`${argument.integer}.${argument.fraction || "0"}`) * 1000
    : DEFAULT_TIME_LIMIT_MS;

// Prep.expand_defs: substitutes each visible definition, and each pragma, into the hypotheses
// after it. tla-ts parses TLAPS's pragmas as definitions of TRUE.
const expandDefinitions = (sequent: Sequent): Sequent => {
  const [substitution, context] = mapAccumulate(
    shift(0),
    sequent.context,
    (current, hyp): [Substitution, Hyp[]] => {
      const isExpanded =
        hyp.kind === "Defn" &&
        hyp.definition.kind === "Operator" &&
        (hyp.visibility === "Visible" || getPragmaProver(hyp) !== undefined);
      if (isExpanded && hyp.definition.kind === "Operator")
        return [consSubstitution(substituteExpr(current, hyp.definition.body), current), []];
      return [bumpBy(1, current), [substituteHyp(current, hyp)]];
    },
  );
  return { context: context.flat(), active: substituteExpr(substitution, sequent.active) };
};

// Prep.trivial: the goal is TRUE, or alpha-equivalent to a hypothesis, visible or not.
const isTrivial = (sequent: Sequent) =>
  (sequent.active.kind === "Internal" && sequent.active.builtin === "TRUE") ||
  sequent.context.some(
    (hyp, index) =>
      hyp.kind === "Fact" &&
      isEqualExpr(hyp.expression, shiftExpr(index - sequent.context.length, sequent.active)),
  );

const getUnchanged = (expression: Expr): Expr =>
  applyBuiltin("Eq", [applyBuiltin("Prime", [expression], expression), expression], expression);

const flattenTuple = (expression: Expr): Expr[] =>
  expression.kind === "Tuple" ? expression.elements.flatMap(flattenTuple) : [expression];

// Tla_norm.expand_unchanged: UNCHANGED <<a, b>> is a' = a /\ b' = b.
const expandUnchanged = (expression: Expr): Expr => {
  const items = flattenTuple(expression);
  if (items.length === 0) return { kind: "Internal", builtin: "TRUE" };
  return items.length === 1
    ? getUnchanged(items[0])
    : { kind: "List", bullet: "And", items: items.map(getUnchanged) };
};

// Tla_norm.expand_action: [A]_v is A \/ UNCHANGED v, and <<A>>_v is A /\ ~UNCHANGED v.
const expandActions = (expression: Expr): Expr => {
  const inner = mapChildren(expression, expandActions);
  if (inner.kind === "Sub")
    return inner.modal === "Box"
      ? applyBuiltin("Disj", [inner.action, expandUnchanged(inner.subscript)], inner)
      : applyBuiltin(
          "Conj",
          [inner.action, applyBuiltin("Neg", [expandUnchanged(inner.subscript)], inner)],
          inner,
        );
  const isUnchanged =
    inner.kind === "Apply" &&
    inner.operator.kind === "Internal" &&
    inner.operator.builtin === "UNCHANGED";
  return isUnchanged ? expandUnchanged(inner.args[0]) : inner;
};

interface Extracted {
  equalities: Expr[];
  rest: Expr | undefined;
}

const combineExtracted = (parts: Extracted[], rebuild: (rests: Expr[]) => Expr): Extracted => {
  const rests = parts.flatMap((part) => (part.rest ? [part.rest] : []));
  return {
    equalities: parts.flatMap((part) => part.equalities),
    rest: rests.length === 0 ? undefined : rests.length === 1 ? rests[0] : rebuild(rests),
  };
};

// Prep.extract_equalities: the equalities among a fact's conjuncts, and what remains.
// Elab.let_normalize: each LET definition is substituted into the rest.
const expandLet = (expression: Extract<Expr, { kind: "Let" }>): Expr => {
  const [definition, ...rest] = expression.definitions;
  if (!definition) return expression.body;
  if (definition.kind !== "Operator")
    throw new TlaUnsupportedError(`a LET ${definition.kind} definition`);
  const remaining: Expr =
    rest.length === 0 ? expression.body : { ...expression, definitions: rest };
  return substituteExpr(consSubstitution(definition.body, shift(0)), remaining);
};

const extractEqualities = (expression: Expr): Extracted => {
  if (
    expression.kind === "Let" &&
    expression.definitions.every((definition) => definition.kind === "Operator")
  )
    return extractEqualities(expandLet(expression));
  if (expression.kind === "List" && expression.bullet !== "Or")
    return combineExtracted(expression.items.map(extractEqualities), (items) => ({
      ...expression,
      bullet: "And",
      items,
    }));
  if (expression.kind === "Internal" && expression.builtin === "TRUE")
    return { equalities: [], rest: undefined };
  const isUnbounded =
    expression.kind === "Quant" &&
    expression.quantifier === "Forall" &&
    expression.bounds.every((bound) => bound.domain.kind === "NoDomain");
  if (isUnbounded) {
    const inner = extractEqualities(expression.body);
    return {
      equalities: inner.equalities.map((equality) => ({ ...expression, body: equality })),
      rest: inner.rest && { ...expression, body: inner.rest },
    };
  }
  if (expression.kind !== "Apply" || expression.operator.kind !== "Internal")
    return { equalities: [], rest: expression };
  if (expression.operator.builtin === "Eq") return { equalities: [expression], rest: undefined };
  if (expression.operator.builtin !== "Conj") return { equalities: [], rest: expression };
  return combineExtracted(expression.args.map(extractEqualities), (args) => ({
    ...expression,
    args,
  }));
};

// Prep.flatten: each visible fact becomes what remains of it, then each of its equalities.
const splitFacts = (sequent: Sequent, start = 0): Sequent => {
  const index = sequent.context.findIndex(
    (hyp, position) => position >= start && hyp.kind === "Fact" && hyp.visibility === "Visible",
  );
  const hyp = sequent.context[index];
  if (index === -1 || hyp.kind !== "Fact") return sequent;
  const extracted = extractEqualities(hyp.expression);
  const pieces = [...(extracted.rest ? [extracted.rest] : []), ...extracted.equalities];
  const facts = pieces.map((piece, position): Hyp => ({
    ...hyp,
    expression: shiftExpr(position, piece),
  }));
  const after = { context: sequent.context.slice(index + 1), active: sequent.active };
  const rest = facts.length === 1 ? after : substituteSequent(shift(facts.length - 1), after);
  return splitFacts(
    {
      context: [...sequent.context.slice(0, index), ...facts, ...rest.context],
      active: rest.active,
    },
    index + facts.length,
  );
};

// Smtlib.format_smt: spells out each special character, then doubles each underscore.
const SPELLED: Record<string, string> = {
  "\\": "backslash_",
  "+": "plussign_",
  "-": "hyphen_",
  "*": "asterisk_",
  "/": "slash_",
  "%": "percentsign_",
  "^": "circumflexaccent_",
  "&": "ampersand_",
  "@": "atsign_",
  "#": "pound_",
  $: "dollarsign_",
  "(": "leftparenthesis_",
  ")": "rightparenthesis_",
  "|": "verticalbar_",
  ".": "period_",
  ":": "colon_",
  "?": "questionmark_",
  "!": "exclamationmark_",
  "<": "lessthansign_",
  ">": "greaterthansign_",
  "=": "equalsign_",
  " ": "space_",
};

const formatName = (name: string) =>
  `smt__${name.replace(/[\\+\-*/%^&@#$()|.:?!<>= ]/g, (character) => SPELLED[character]).replaceAll("_", "__")}`;

// The name of each builtin symbol tlapm calls TLA__name, mapped back to the name.
const BUILTIN_NAMES = new Map<string, string>();
// The fields of each record symbol.
const RECORD_FIELDS = new Map<string, string[]>();

const tla = (name: string) => {
  const symbol = formatName(`TLA__${name}`);
  BUILTIN_NAMES.set(symbol, name);
  return symbol;
};

const MEM = tla("Mem");
const SET_EXT_TRIGGER = tla("SetExtTrigger");
const SUBSET_EQ = tla("SubsetEq");
const CUP = tla("Cup");
const CAP = tla("Cap");
const SET_MINUS = tla("SetMinus");
const SUBSET = tla("Subset");
const UNION = tla("Union");
const TT_IDV = tla("Tt_Idv");
const CAST_BOOL = tla("Cast_Bool");
const BOOL_SET = tla("BoolSet");
const STR_SET = tla("StrSet");
const INT_SET = tla("IntSet");
const NAT_SET = tla("NatSet");
const CAST_INT = tla("Cast_Int");
const PROJ_INT = tla("Proj_Int");
const INT_LTEQ = tla("IntLteq");
const INT_RANGE = tla("IntRange");
const FUN_APP = tla("FunApp");
const FUN_DOM = tla("FunDom");
const FUN_ISAFCN = tla("FunIsafcn");
const FUN_SET = tla("FunSet");
const FUN_EXCEPT = tla("FunExcept");
const TRIG_EQ = tla("TrigEq_Set$Idv$");
const IS_SET_OF = tla("IsSetOf");
const SEQ = tla("Seq");
const LEN = tla("Len");
const CAT = tla("Cat");
const APPEND = tla("Append");
const HEAD = tla("Head");
const TAIL = tla("Tail");
const SUB_SEQ = tla("SubSeq");

const BUILTIN_SYMBOLS: Partial<Record<Builtin, string>> = {
  Cup: CUP,
  Cap: CAP,
  Setminus: SET_MINUS,
  SUBSET,
  UNION,
  DOMAIN: FUN_DOM,
  Plus: tla("IntPlus"),
  Minus: tla("IntMinus"),
  Times: tla("IntTimes"),
  Quotient: tla("IntQuotient"),
  Remainder: tla("IntRemainder"),
  Uminus: tla("IntUminus"),
  Range: INT_RANGE,
  Seq: SEQ,
  Len: LEN,
  BSeq: tla("BSeq"),
  Cat: CAT,
  Append: APPEND,
  Head: HEAD,
  Tail: TAIL,
  SubSeq: SUB_SEQ,
};

const unsupported = (reason: string) => new TlaUnsupportedError(reason);

const getNames = (prefix: string, count: number) =>
  Array.from({ length: count }, (_value, index) => `${prefix}${index + 1}`);

const getSortedBinders = (variables: [string, string][]) =>
  variables.map((variable) => `(${variable[0]} ${variable[1]})`).join(" ");

const forall = (variables: string[], body: string, patterns: string[][] = [], sort = "Idv") =>
  variables.length === 0
    ? body
    : `(forall (${getSortedBinders(variables.map((variable) => [variable, sort]))}) ${
        patterns.length === 0
          ? body
          : `(! ${body} ${patterns.map((pattern) => `:pattern (${pattern.join(" ")})`).join(" ")})`
      })`;

const conjoin = (items: string[]) =>
  items.length === 0 ? "true" : items.length === 1 ? items[0] : `(and ${items.join(" ")})`;

const disjoin = (items: string[]) =>
  items.length === 0 ? "false" : items.length === 1 ? items[0] : `(or ${items.join(" ")})`;

const call = (symbol: string, args: string[]) =>
  args.length === 0 ? symbol : `(${symbol} ${args.join(" ")})`;

const declare = (symbol: string, arity: number, sort = "Idv", argSort = "Idv") =>
  `(declare-fun ${symbol} (${Array.from({ length: arity }, () => argSort).join(" ")}) ${sort})`;

const replaceToken = (text: string, token: string, replacement: string) =>
  text.replace(/[^\s()]+/g, (found) => (found === token ? replacement : found));

const axiom = (
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

const getAxiomKey = (entry: Axiom) => `${entry.name} ${JSON.stringify(entry.args)}`;

const getAxiomRank = (entry: Axiom) => {
  const constant = CONSTANT_AXIOMS.indexOf(entry.name);
  return constant === -1 ? CONSTANT_AXIOMS.length + BLOCK_AXIOMS.indexOf(entry.name) : constant;
};

const compareArgument = (left: AxiomArgument, right: AxiomArgument): number => {
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "string" && typeof right === "string")
    return left < right ? -1 : left > right ? 1 : 0;
  if (!Array.isArray(left) || !Array.isArray(right)) return 0;
  const index = left.findIndex((item, position) => item !== right[position]);
  if (index === -1) return left.length - right.length;
  if (index >= right.length) return 1;
  return compareArgument(left[index], right[index]);
};

// N_axiomatize.TlaAxmSet orders axioms as OCaml's compare does.
const compareAxioms = (left: Axiom, right: Axiom) => {
  const rank = getAxiomRank(left) - getAxiomRank(right);
  if (rank !== 0) return rank;
  const index = left.args.findIndex(
    (arg, position) => compareArgument(arg, right.args[position]) !== 0,
  );
  return index === -1 ? 0 : compareArgument(left.args[index], right.args[index]);
};

const getTyping = (name: string, operator: string, arity: number, isGuarded = false) => {
  const symbol = tla(name);
  const variables = arity === 1 ? ["x1"] : isGuarded ? ["x", "y"] : ["x1", "x2"];
  const left = call(
    symbol,
    variables.map((variable) => `(${CAST_INT} ${variable})`),
  );
  const right =
    operator === "<="
      ? `(<= ${variables.join(" ")})`
      : `(${CAST_INT} (${operator} ${variables.join(" ")}))`;
  const equality = `(= ${left} ${right})`;
  return axiom(
    "Typing",
    [TYPED_SYMBOLS.indexOf(`T${name}`)],
    forall(variables, isGuarded ? `(=> (> y 0) ${equality})` : equality, [[left]], "Int"),
    `Typing T${name}`,
  );
};

const TYPINGS: Record<string, () => Axiom> = {
  IntPlus: () => getTyping("IntPlus", "+", 2),
  IntMinus: () => getTyping("IntMinus", "-", 2),
  IntTimes: () => getTyping("IntTimes", "*", 2),
  IntUminus: () => getTyping("IntUminus", "-", 1),
  IntQuotient: () => getTyping("IntQuotient", "div", 2, true),
  IntRemainder: () => getTyping("IntRemainder", "mod", 2, true),
  IntLteq: () => getTyping("IntLteq", "<=", 2),
};

const getEnumeration = (count: number) => {
  const symbol = tla(`SetEnum_${count}`);
  const elements = getNames("a", count);
  const set = call(symbol, elements);
  const elim = axiom(
    "EnumDefElim",
    [count],
    forall(
      [...elements, "x"],
      count === 0
        ? `(not (${MEM} x ${set}))`
        : `(=> (${MEM} x ${set}) ${disjoin(elements.map((element) => `(= x ${element})`))})`,
      [[`(${MEM} x ${set})`]],
    ),
  );
  if (count === 0) return [elim];
  const intro = axiom(
    "EnumDefIntro",
    [count],
    forall(elements, conjoin(elements.map((element) => `(${MEM} ${element} ${set})`)), [[set]]),
  );
  return [intro, elim];
};

const getIntegers = (count: number) =>
  Array.from({ length: count }, (_value, index) => `(${CAST_INT} ${index + 1})`);

// TupExcept and RecExcept: updating one component of a tuple or record.
const getComponentExcept = (
  name: string,
  args: AxiomArgument[],
  symbol: string,
  keys: string[],
  index: number,
) => {
  const elements = getNames("x", keys.length);
  const updated = `(${FUN_EXCEPT} ${call(symbol, elements)} ${keys[index]} x)`;
  const replaced = elements.map((element, position) => (position === index ? "x" : element));
  return axiom(
    name,
    [...args, index + 1],
    forall([...elements, "x"], `(= ${updated} ${call(symbol, replaced)})`, [[updated]]),
  );
};

const getTupleAxioms = (count: number, isExcept: boolean) => {
  const symbol = tla(`Tuple_${count}`);
  const elements = getNames("x", count);
  const value = call(symbol, elements);
  const keys = getIntegers(count);
  return [
    axiom("TupIsafcn", [count], forall(elements, `(${FUN_ISAFCN} ${value})`, [[value]])),
    ...(count === 0
      ? []
      : [
          axiom(
            "TupDomDef",
            [count],
            forall(elements, `(= (${FUN_DOM} ${value}) ${call(tla(`SetEnum_${count}`), keys)})`, [
              [value],
            ]),
          ),
          axiom(
            "TupAppDef",
            [count],
            forall(
              elements,
              conjoin(
                keys.map((key, index) => `(= (${FUN_APP} ${value} ${key}) ${elements[index]})`),
              ),
              [[value]],
            ),
          ),
        ]),
    axiom(
      "SeqTupTyping",
      [count],
      forall(
        ["a", ...elements],
        count === 0
          ? `(${MEM} ${value} (${SEQ} a))`
          : `(=> ${conjoin(elements.map((element) => `(${MEM} ${element} a)`))} (${MEM} ${value} (${SEQ} a)))`,
        [[...elements.map((element) => `(${MEM} ${element} a)`), value]],
      ),
    ),
    axiom(
      "SeqTupLen",
      [count],
      forall(elements, `(= (${LEN} ${value}) (${CAST_INT} ${count}))`, [[value]]),
    ),
    ...(isExcept
      ? keys.map((_key, index) => getComponentExcept("TupExcept", [count], symbol, keys, index))
      : []),
  ];
};

const getRecordAxioms = (fields: string[], isExcept: boolean) => {
  const symbol = tla(`Record_${fields.join("_")}`);
  const keys = fields.map((field) => tla(`StrLit_${field}`));
  const elements = getNames("x", fields.length);
  const value = call(symbol, elements);
  return [
    axiom("RecIsafcn", [fields], forall(elements, `(${FUN_ISAFCN} ${value})`, [[value]])),
    axiom(
      "RecDomDef",
      [fields],
      forall(elements, `(= (${FUN_DOM} ${value}) ${call(tla(`SetEnum_${fields.length}`), keys)})`, [
        [value],
      ]),
    ),
    axiom(
      "RecAppDef",
      [fields],
      forall(
        elements,
        conjoin(keys.map((key, index) => `(= (${FUN_APP} ${value} ${key}) ${elements[index]})`)),
        [[value]],
      ),
    ),
    ...(isExcept
      ? keys.map((_key, index) => getComponentExcept("RecExcept", [fields], symbol, keys, index))
      : []),
  ];
};

// The set of tuples or records whose components are in the given sets.
const getComponentSet = (
  name: string,
  args: AxiomArgument[],
  set: string,
  value: string,
  keys: string[],
  variable: string,
) => {
  const sets = getNames("s", keys.length);
  const elements = getNames("x", keys.length);
  const members = call(set, sets);
  const built = call(value, elements);
  const projections = keys.map((key) => `(${FUN_APP} ${variable} ${key})`);
  return [
    axiom(
      `${name}Intro`,
      args,
      forall(
        [...sets, ...elements],
        `(=> ${conjoin(elements.map((element, index) => `(${MEM} ${element} ${sets[index]})`))} (${MEM} ${built} ${members}))`,
        [[built, members]],
      ),
    ),
    axiom(
      `${name}Elim`,
      args,
      forall(
        [...sets, variable],
        `(=> (${MEM} ${variable} ${members}) ${conjoin([`(= ${variable} ${call(value, projections)})`, ...projections.map((projection, index) => `(${MEM} ${projection} ${sets[index]})`)])})`,
        [[`(${MEM} ${variable} ${members})`]],
      ),
    ),
  ];
};

const SEQUENCE_DEPS = ["Mem", "Seq", "Len", "FunApp", "NatSet", "Cast_Int", "Proj_Int"];

// N_data.get_deps, with arithmetic and set extensionality as tlapm's SMT backend sets them.
const getSymbolSpec = (name: string, state: CollectState): SymbolSpec => {
  const spec = (declaration: string | undefined, deps: string[], axioms: Axiom[]) => ({
    declaration,
    deps,
    axioms,
  });
  const symbol = formatName(`TLA__${name}`);
  const fixed = (arity: number, deps: string[], axioms: Axiom[], sort = "Idv") =>
    spec(declare(symbol, arity, sort), deps, axioms);
  const enumeration = /^SetEnum_(\d+)$/.exec(name);
  if (enumeration)
    return fixed(Number(enumeration[1]), ["Mem"], getEnumeration(Number(enumeration[1])));
  const setOf = /^SetOf_(\d+)$/.exec(name);
  if (setOf) {
    const count = Number(setOf[1]);
    return spec(
      undefined,
      ["Mem", "IsSetOf"],
      [
        axiom("SetOfIntro", [count], undefined),
        axiom("SetOfElim", [count], undefined),
        axiom("AssertIsSetOf", [count], undefined),
        axiom(
          "CompareSetOfTrigger",
          [],
          forall(["a", "b"], `(${SET_EXT_TRIGGER} a b)`, [
            [`(${IS_SET_OF} a)`, `(${IS_SET_OF} b)`],
          ]),
        ),
      ],
    );
  }
  if (name.startsWith("StrLit_")) {
    const value = name.slice("StrLit_".length);
    const distinct = state.strings.map((other) =>
      axiom("StrLitDistinct", [value, other], `(distinct ${symbol} ${tla(`StrLit_${other}`)})`),
    );
    state.strings.push(value);
    return fixed(
      0,
      ["Mem", "StrSet"],
      [axiom("StrLitIsstr", [value], `(${MEM} ${symbol} ${STR_SET})`), ...distinct],
    );
  }
  const tuple = /^Tuple_(\d+)$/.exec(name);
  if (tuple) {
    const count = Number(tuple[1]);
    state.tuples.push(count);
    const deps =
      count === 0
        ? ["FunIsafcn", "Cast_Int", "Seq", "Len"]
        : ["FunIsafcn", "FunDom", "FunApp", `SetEnum_${count}`, "Cast_Int", "Mem", "Seq", "Len"];
    return fixed(count, deps, getTupleAxioms(count, state.isExcept));
  }
  const product = /^Product_(\d+)$/.exec(name);
  if (product) {
    const count = Number(product[1]);
    return fixed(
      count,
      ["Mem", `Tuple_${count}`, "FunApp", "Cast_Int", "Proj_Int"],
      getComponentSet("Product", [count], symbol, tla(`Tuple_${count}`), getIntegers(count), "t"),
    );
  }
  const fields = RECORD_FIELDS.get(name);
  if (fields && name.startsWith("Record_")) {
    state.records.push(fields);
    return fixed(
      fields.length,
      [
        "FunIsafcn",
        "FunDom",
        "FunApp",
        `SetEnum_${fields.length}`,
        ...fields.map((field) => `StrLit_${field}`),
      ],
      getRecordAxioms(fields, state.isExcept),
    );
  }
  if (fields && name.startsWith("RecordSet_")) {
    const record = `Record_${fields.join("_")}`;
    return fixed(
      fields.length,
      ["Mem", record, "FunApp", ...fields.map((field) => `StrLit_${field}`)],
      getComponentSet(
        "RecSet",
        [fields],
        symbol,
        tla(record),
        fields.map((field) => tla(`StrLit_${field}`)),
        "r",
      ),
    );
  }
  const anonymous = state.anonymous.get(name);
  if (anonymous !== undefined) return fixed(anonymous, [], []);
  const typing = TYPINGS[name];
  if (typing)
    return fixed(
      name === "IntUminus" ? 1 : 2,
      ["Cast_Int"],
      [typing()],
      name === "IntLteq" ? "Bool" : "Idv",
    );
  switch (name) {
    case "Choose":
      return spec(undefined, [], [axiom("ChooseDef", [], undefined)]);
    case "Mem":
      return fixed(
        2,
        ["SetExtTrigger"],
        [
          axiom(
            "SetExt",
            [],
            `(forall ((x Idv) (y Idv)) (! (=> (forall ((z Idv)) (= (${MEM} z x) (${MEM} z y))) (= x y)) :pattern ((${SET_EXT_TRIGGER} x y))))`,
          ),
        ],
        "Bool",
      );
    case "SubsetEq":
      return fixed(
        2,
        ["Mem"],
        [
          axiom(
            "SubsetEqIntro",
            [],
            `(forall ((x Idv) (y Idv)) (! (=> (forall ((z Idv)) (=> (${MEM} z x) (${MEM} z y))) (${SUBSET_EQ} x y)) :pattern ((${SUBSET_EQ} x y))))`,
          ),
          axiom(
            "SubsetEqElim",
            [],
            `(forall ((x Idv) (y Idv) (z Idv)) (! (=> (and (${SUBSET_EQ} x y) (${MEM} z x)) (${MEM} z y)) :pattern ((${SUBSET_EQ} x y) (${MEM} z x))))`,
          ),
        ],
        "Bool",
      );
    case "Union":
      return fixed(
        1,
        ["Mem"],
        [
          axiom(
            "UnionIntro",
            [],
            `(forall ((a Idv) (x Idv) (y Idv)) (! (=> (and (${MEM} y a) (${MEM} x y)) (${MEM} x (${UNION} a))) :pattern ((${MEM} y a) (${MEM} x (${UNION} a))) :pattern ((${MEM} x y) (${MEM} x (${UNION} a))) :pattern ((${MEM} y a) (${MEM} x y) (${UNION} a))))`,
          ),
          axiom(
            "UnionElim",
            [],
            `(forall ((a Idv) (x Idv)) (! (=> (${MEM} x (${UNION} a)) (exists ((y Idv)) (and (${MEM} y a) (${MEM} x y)))) :pattern ((${MEM} x (${UNION} a)))))`,
          ),
        ],
      );
    case "Subset":
      return fixed(
        1,
        ["Mem", "SubsetEq"],
        [
          axiom(
            "SubsetDefAlt",
            [],
            `(forall ((a Idv) (x Idv)) (! (= (${MEM} x (${SUBSET} a)) (${SUBSET_EQ} x a)) :pattern ((${MEM} x (${SUBSET} a))) :pattern ((${SUBSET_EQ} x a) (${SUBSET} a))))`,
          ),
        ],
      );
    case "Cup":
    case "Cap":
    case "SetMinus": {
      const condition =
        name === "Cup"
          ? "(or (MEM x a) (MEM x b))"
          : name === "Cap"
            ? "(and (MEM x a) (MEM x b))"
            : "(and (MEM x a) (not (MEM x b)))";
      const definition = axiom(
        `${name}Def`,
        [],
        `(forall ((a Idv) (b Idv) (x Idv)) (! (= (${MEM} x (${symbol} a b)) ${condition.replaceAll("MEM", MEM)}) :pattern ((${MEM} x (${symbol} a b))) :pattern ((${MEM} x a) (${symbol} a b)) :pattern ((${MEM} x b) (${symbol} a b))))`,
      );
      if (name !== "Cap") return fixed(2, ["Mem"], [definition]);
      return fixed(
        2,
        ["Mem", "SetEnum_0", "SetExtTrigger"],
        [
          definition,
          axiom(
            "DisjointTrigger",
            [],
            `(forall ((x Idv) (y Idv)) (! (${SET_EXT_TRIGGER} (${CAP} x y) ${tla("SetEnum_0")}) :pattern ((${CAP} x y))))`,
          ),
        ],
      );
    }
    case "SetSt":
      return spec(
        undefined,
        ["Mem", "SetEnum_0", "SetExtTrigger"],
        [axiom("SetStDef", [], undefined), axiom("EmptyComprehensionTrigger", [], undefined)],
      );
    case "NatSet":
      return fixed(
        0,
        ["IntSet", "TIntLit_0", "Cast_Int", "IntLteq"],
        [
          axiom(
            "NatSetDef",
            [],
            `(forall ((x Idv)) (! (= (${MEM} x ${NAT_SET}) (and (${MEM} x ${INT_SET}) (${INT_LTEQ} (${CAST_INT} 0) x))) :pattern ((${MEM} x ${NAT_SET}))))`,
          ),
        ],
      );
    case "IntRange":
      return fixed(
        2,
        ["Mem", "IntSet", "IntLteq"],
        [
          axiom(
            "IntRangeDef",
            [],
            `(forall ((a Idv) (b Idv) (x Idv)) (! (= (${MEM} x (${INT_RANGE} a b)) (and (${MEM} x ${INT_SET}) (${INT_LTEQ} a x) (${INT_LTEQ} x b))) :pattern ((${MEM} x (${INT_RANGE} a b)))))`,
          ),
        ],
      );
    case "FunIsafcn":
      return fixed(
        1,
        ["Mem", "FunDom", "FunFcn", "FunApp"],
        [
          axiom(
            "FunExt",
            [],
            `(forall ((f Idv) (g Idv)) (! (=> (and (${FUN_ISAFCN} f) (${FUN_ISAFCN} g) (= (${FUN_DOM} f) (${FUN_DOM} g)) (forall ((x Idv)) (=> (${MEM} x (${FUN_DOM} f)) (= (${FUN_APP} f x) (${FUN_APP} g x))))) (= f g)) :pattern ((${FUN_ISAFCN} f) (${FUN_ISAFCN} g))))`,
          ),
        ],
        "Bool",
      );
    case "FunSet":
      state.isFunSet = true;
      return fixed(
        2,
        ["Mem", "FunIsafcn", "FunDom", "FunApp"],
        [
          axiom(
            "FunSetIntro",
            [],
            `(forall ((a Idv) (b Idv) (f Idv)) (! (=> (and (${FUN_ISAFCN} f) (= (${FUN_DOM} f) a) (forall ((x Idv)) (=> (${MEM} x a) (${MEM} (${FUN_APP} f x) b)))) (${MEM} f (${FUN_SET} a b))) :pattern ((${MEM} f (${FUN_SET} a b)))))`,
          ),
          axiom(
            "FunSetElim1",
            [],
            `(forall ((a Idv) (b Idv) (f Idv)) (! (=> (${MEM} f (${FUN_SET} a b)) (and (${FUN_ISAFCN} f) (= (${FUN_DOM} f) a))) :pattern ((${MEM} f (${FUN_SET} a b)))))`,
          ),
          axiom(
            "FunSetElim2",
            [],
            `(forall ((a Idv) (b Idv) (f Idv) (x Idv)) (! (=> (and (${MEM} f (${FUN_SET} a b)) (${MEM} x a)) (${MEM} (${FUN_APP} f x) b)) :pattern ((${MEM} f (${FUN_SET} a b)) (${MEM} x a)) :pattern ((${MEM} f (${FUN_SET} a b)) (${FUN_APP} f x))))`,
          ),
          ...(state.isFunConstr ? [axiom("FunTyping", [], undefined)] : []),
        ],
      );
    case "FunFcn":
      state.isFunConstr = true;
      return spec(
        undefined,
        ["FunIsafcn"],
        [
          axiom("FunConstrIsafcn", [], undefined),
          ...(state.isFunSet ? [axiom("FunTyping", [], undefined)] : []),
        ],
      );
    case "FunDom":
      return fixed(1, ["FunFcn"], [axiom("FunDomDef", [], undefined)]);
    case "FunApp":
      return fixed(2, ["Mem", "FunFcn"], [axiom("FunAppDef", [], undefined)]);
    case "FunExcept": {
      state.isExcept = true;
      const updated = `(${FUN_EXCEPT} f x y)`;
      return fixed(
        3,
        ["Mem", "FunIsafcn", "FunDom", "FunApp"],
        [
          axiom(
            "FunExceptIsafcn",
            [],
            `(forall ((f Idv) (x Idv) (y Idv)) (! (${FUN_ISAFCN} ${updated}) :pattern (${updated})))`,
          ),
          axiom(
            "FunExceptDomDef",
            [],
            `(forall ((f Idv) (x Idv) (y Idv)) (! (= (${FUN_DOM} ${updated}) (${FUN_DOM} f)) :pattern (${updated})))`,
          ),
          axiom(
            "FunExceptAppDef1",
            [],
            `(forall ((f Idv) (x Idv) (y Idv)) (! (=> (${MEM} x (${FUN_DOM} f)) (= (${FUN_APP} ${updated} x) y)) :pattern (${updated})))`,
          ),
          axiom(
            "FunExceptAppDef2",
            [],
            `(forall ((f Idv) (x Idv) (y Idv) (z Idv)) (! (=> (${MEM} z (${FUN_DOM} f)) (and (=> (= z x) (= (${FUN_APP} ${updated} z) y)) (=> (distinct z x) (= (${FUN_APP} ${updated} z) (${FUN_APP} f z))))) :pattern ((${FUN_APP} ${updated} z)) :pattern (${updated} (${FUN_APP} f z))))`,
          ),
          ...state.tuples.flatMap((count) =>
            getIntegers(count).map((_key, index) =>
              getComponentExcept(
                "TupExcept",
                [count],
                tla(`Tuple_${count}`),
                getIntegers(count),
                index,
              ),
            ),
          ),
          ...state.records.flatMap((recordFields) =>
            recordFields.map((_field, index) =>
              getComponentExcept(
                "RecExcept",
                [recordFields],
                tla(`Record_${recordFields.join("_")}`),
                recordFields.map((field) => tla(`StrLit_${field}`)),
                index,
              ),
            ),
          ),
        ],
      );
    }
    case "Seq":
      return fixed(
        1,
        [
          "Mem",
          "Len",
          "FunIsafcn",
          "FunDom",
          "FunApp",
          "IntSet",
          "NatSet",
          "IntRange",
          "Cast_Int",
          "Proj_Int",
        ],
        [
          axiom(
            "SeqSetIntro",
            [],
            `(forall ((a Idv) (s Idv)) (! (=> (and (${FUN_ISAFCN} s) (>= (${PROJ_INT} (${LEN} s)) 0) (forall ((i Idv)) (= (${MEM} i (${FUN_DOM} s)) (and (${MEM} i ${INT_SET}) (<= 1 (${PROJ_INT} i)) (<= (${PROJ_INT} i) (${PROJ_INT} (${LEN} s)))))) (forall ((i Int)) (=> (and (<= 1 i) (<= i (${PROJ_INT} (${LEN} s)))) (${MEM} (${FUN_APP} s (${CAST_INT} i)) a)))) (${MEM} s (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)))))`,
          ),
          axiom(
            "SeqSetElim1",
            [],
            `(forall ((a Idv) (s Idv)) (! (=> (${MEM} s (${SEQ} a)) (and (${FUN_ISAFCN} s) (${MEM} (${LEN} s) ${NAT_SET}) (= (${FUN_DOM} s) (${INT_RANGE} (${CAST_INT} 1) (${LEN} s))))) :pattern ((${MEM} s (${SEQ} a)))))`,
            "SetSetElim1",
          ),
          axiom(
            "SeqSetElim2",
            [],
            `(forall ((a Idv) (s Idv) (i Int)) (! (=> (and (${MEM} s (${SEQ} a)) (<= 1 i) (<= i (${PROJ_INT} (${LEN} s)))) (${MEM} (${FUN_APP} s (${CAST_INT} i)) a)) :pattern ((${MEM} s (${SEQ} a)) (${FUN_APP} s (${CAST_INT} i)))))`,
            "SetSetElim2",
          ),
        ],
      );
    case "Len":
      return fixed(
        1,
        ["FunDom", "IntRange", "Cast_Int"],
        [
          axiom(
            "SeqLenDef",
            [],
            `(forall ((s Idv) (z Int)) (=> (and (>= z 0) (= (${FUN_DOM} s) (${INT_RANGE} (${CAST_INT} 1) (${CAST_INT} z)))) (= (${LEN} s) (${CAST_INT} z))))`,
          ),
        ],
      );
    case "BSeq":
      return fixed(1, [], []);
    case "Cat":
      return fixed(2, SEQUENCE_DEPS, [
        axiom(
          "SeqCatTyping",
          [],
          `(forall ((a Idv) (s Idv) (t Idv)) (! (=> (and (${MEM} s (${SEQ} a)) (${MEM} t (${SEQ} a))) (${MEM} (${CAT} s t) (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) (${CAT} s t)) :pattern ((${MEM} t (${SEQ} a)) (${CAT} s t))))`,
        ),
        axiom(
          "SeqCatLen",
          [],
          `(forall ((s Idv) (t Idv)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (${MEM} (${LEN} t) ${NAT_SET})) (= (${LEN} (${CAT} s t)) (${CAST_INT} (+ (${PROJ_INT} (${LEN} s)) (${PROJ_INT} (${LEN} t)))))) :pattern ((${CAT} s t))))`,
        ),
        axiom(
          "SeqCatApp1",
          [],
          `(forall ((s Idv) (t Idv) (i Int)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (${MEM} (${LEN} t) ${NAT_SET}) (<= 1 i) (<= i (${PROJ_INT} (${LEN} s)))) (= (${FUN_APP} (${CAT} s t) (${CAST_INT} i)) (${FUN_APP} s (${CAST_INT} i)))) :pattern ((${FUN_APP} (${CAT} s t) (${CAST_INT} i))) :pattern ((${CAT} s t) (${FUN_APP} s (${CAST_INT} i)))))`,
        ),
        axiom(
          "SeqCatApp2",
          [],
          `(forall ((s Idv) (t Idv) (i Int)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (${MEM} (${LEN} t) ${NAT_SET}) (<= i (+ (${PROJ_INT} (${LEN} s)) (${PROJ_INT} (${LEN} t)))) (< (${PROJ_INT} (${LEN} s)) i)) (= (${FUN_APP} (${CAT} s t) (${CAST_INT} i)) (${FUN_APP} t (${CAST_INT} (- i (${PROJ_INT} (${LEN} s))))))) :pattern ((${FUN_APP} (${CAT} s t) (${CAST_INT} i)))))`,
        ),
      ]);
    case "Append":
      return fixed(2, SEQUENCE_DEPS, [
        axiom(
          "SeqAppendTyping",
          [],
          `(forall ((a Idv) (s Idv) (x Idv)) (! (=> (and (${MEM} s (${SEQ} a)) (${MEM} x a)) (${MEM} (${APPEND} s x) (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) (${APPEND} s x))))`,
        ),
        axiom(
          "SeqAppendLen",
          [],
          `(forall ((s Idv) (x Idv)) (! (=> (${MEM} (${LEN} s) ${NAT_SET}) (= (${LEN} (${APPEND} s x)) (${CAST_INT} (+ (${PROJ_INT} (${LEN} s)) 1)))) :pattern ((${APPEND} s x))))`,
        ),
        axiom(
          "SeqAppendApp1",
          [],
          `(forall ((s Idv) (x Idv) (i Int)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (<= 1 i) (<= i (${PROJ_INT} (${LEN} s)))) (= (${FUN_APP} (${APPEND} s x) (${CAST_INT} i)) (${FUN_APP} s (${CAST_INT} i)))) :pattern ((${FUN_APP} (${APPEND} s x) (${CAST_INT} i))) :pattern ((${APPEND} s x) (${FUN_APP} s (${CAST_INT} i)))))`,
        ),
        axiom(
          "SeqAppendApp2",
          [],
          `(forall ((s Idv) (x Idv)) (! (=> (${MEM} (${LEN} s) ${NAT_SET}) (= (${FUN_APP} (${APPEND} s x) (${CAST_INT} (+ (${PROJ_INT} (${LEN} s)) 1))) x)) :pattern ((${APPEND} s x))))`,
        ),
      ]);
    case "Head":
      return fixed(
        1,
        ["FunApp", "Cast_Int"],
        [
          axiom(
            "SeqHeadDef",
            [],
            `(forall ((s Idv)) (! (= (${HEAD} s) (${FUN_APP} s (${CAST_INT} 1))) :pattern ((${HEAD} s))))`,
          ),
        ],
      );
    case "Tail":
      return fixed(1, SEQUENCE_DEPS, [
        axiom(
          "SeqTailTyping",
          [],
          `(forall ((a Idv) (s Idv)) (! (=> (and (${MEM} s (${SEQ} a)) (distinct (${PROJ_INT} (${LEN} s)) 0)) (${MEM} (${TAIL} s) (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) (${TAIL} s))))`,
        ),
        axiom(
          "SeqTailLen",
          [],
          `(forall ((s Idv)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (distinct (${PROJ_INT} (${LEN} s)) 0)) (= (${LEN} (${TAIL} s)) (${CAST_INT} (- (${PROJ_INT} (${LEN} s)) 1)))) :pattern ((${TAIL} s))))`,
        ),
        axiom(
          "SeqTailApp",
          [],
          `(forall ((s Idv) (i Int)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (distinct (${PROJ_INT} (${LEN} s)) 0) (<= 1 i) (<= i (- (${PROJ_INT} (${LEN} s)) 1))) (= (${FUN_APP} (${TAIL} s) (${CAST_INT} i)) (${FUN_APP} s (${CAST_INT} (+ i 1))))) :pattern ((${FUN_APP} (${TAIL} s) (${CAST_INT} i)))))`,
        ),
      ]);
    case "SubSeq": {
      const range = `(${SUB_SEQ} s (${CAST_INT} x) (${CAST_INT} y))`;
      return fixed(
        3,
        ["Mem", "Seq", "Len", "FunApp", "IntSet", "Cast_Int", "Proj_Int"],
        [
          axiom(
            "SeqSubseqTyping",
            [],
            `(forall ((a Idv) (s Idv) (x Int) (y Int)) (! (=> (or (< y x) (and (${MEM} s (${SEQ} a)) (<= 1 x) (<= y (${PROJ_INT} (${LEN} s))))) (${MEM} ${range} (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) ${range})))`,
          ),
          axiom(
            "SeqSubseqLen",
            [],
            `(forall ((s Idv) (x Int) (y Int)) (! (and (=> (<= x (+ y 1)) (= (${LEN} ${range}) (${CAST_INT} (- (+ y 1) x)))) (=> (> x (+ y 1)) (= (${LEN} ${range}) (${CAST_INT} 0)))) :pattern (${range})))`,
          ),
          axiom(
            "SeqSubseqApp",
            [],
            `(forall ((s Idv) (x Int) (y Int) (z Int)) (! (=> (and (<= 1 x) (<= 1 z) (<= z (- (+ y 1) x))) (= (${FUN_APP} ${range} (${CAST_INT} z)) (${FUN_APP} s (${CAST_INT} (- (+ z x) 1))))) :pattern ((${FUN_APP} ${range} (${CAST_INT} z)))))`,
          ),
        ],
      );
    }
    case "Cast_Int":
      return spec(
        declare(symbol, 1, "Idv", "Int"),
        ["Mem", "IntSet", "Proj_Int"],
        [
          axiom(
            "CastInjAlt",
            ["Int"],
            `(forall ((x Int)) (! (= x (${PROJ_INT} (${CAST_INT} x))) :pattern ((${CAST_INT} x))))`,
          ),
          axiom(
            "TypeGuardIntro",
            ["Int"],
            `(forall ((z Int)) (! (${MEM} (${CAST_INT} z) ${INT_SET}) :pattern ((${CAST_INT} z))))`,
          ),
          axiom(
            "TypeGuardElim",
            ["Int"],
            `(forall ((x Idv)) (! (=> (${MEM} x ${INT_SET}) (= x (${CAST_INT} (${PROJ_INT} x)))) :pattern ((${MEM} x ${INT_SET}))))`,
          ),
        ],
      );
    case "Cast_Bool":
      return spec(
        declare(symbol, 1, "Idv", "Bool"),
        ["Mem", "BoolSet", "Tt_Idv"],
        [
          axiom(
            "CastInjAlt",
            ["Bool"],
            `(and (= (${CAST_BOOL} true) ${TT_IDV}) (distinct (${CAST_BOOL} false) ${TT_IDV}))`,
          ),
          axiom(
            "TypeGuardIntro",
            ["Bool"],
            `(forall ((z Bool)) (! (${MEM} (${CAST_BOOL} z) ${BOOL_SET}) :pattern ((${CAST_BOOL} z))))`,
          ),
          axiom(
            "TypeGuardElim",
            ["Bool"],
            `(forall ((x Idv)) (! (=> (${MEM} x ${BOOL_SET}) (or (= x (${CAST_BOOL} true)) (= x (${CAST_BOOL} false)))) :pattern ((${MEM} x ${BOOL_SET}))))`,
          ),
        ],
      );
    case "Proj_Int":
      return spec(declare(symbol, 1, "Int"), [], []);
    case "TrigEq_Set$Idv$":
      return fixed(
        2,
        ["SetExtTrigger"],
        [
          axiom(
            "ExtTrigEqDef",
            ["Set$Idv$"],
            `(forall ((x Idv) (y Idv)) (! (= (${TRIG_EQ} x y) (= x y)) :pattern ((${TRIG_EQ} x y))))`,
          ),
          axiom(
            "ExtTrigEqTrigger",
            ["Idv"],
            `(forall ((x Idv) (y Idv)) (! (${SET_EXT_TRIGGER} x y) :pattern ((${TRIG_EQ} x y))))`,
          ),
        ],
        "Bool",
      );
    case "SetExtTrigger":
    case "IsSetOf":
      return fixed(name === "IsSetOf" ? 1 : 2, [], [], "Bool");
    case "BoolSet":
    case "StrSet":
    case "IntSet":
    case "Tt_Idv":
      return fixed(0, [], []);
    case "TIntLteq":
      return spec(undefined, ["IntLteq"], [TYPINGS.IntLteq()]);
    default:
      // The rest are numerals, which SMT-LIB has natively.
      if (name.startsWith("TIntLit_")) return spec(undefined, [], []);
      throw unsupported(`the symbol ${name}`);
  }
};

// N_axiomatize.collect: each symbol the obligation uses, in the order tlapm visits them, brings
// the symbols and axioms it depends on, smallest name first.
const collectSymbols = (
  entries: Entry[],
  flattened: Map<string, Flattened>,
  anonymous: Map<string, number>,
) => {
  const state: CollectState = {
    strings: [],
    isFunConstr: false,
    isFunSet: false,
    isExcept: false,
    tuples: [],
    records: [],
    anonymous,
  };
  const symbols = new Map<string, SymbolSpec>();
  const axioms = new Map<string, Axiom>();
  const add = (name: string) => {
    const work = new Set([name]);
    while (work.size > 0) {
      const next = [...work].sort()[0];
      work.delete(next);
      if (symbols.has(next)) continue;
      const spec = getSymbolSpec(next, state);
      symbols.set(next, spec);
      spec.deps.forEach((dep) => work.add(dep));
      spec.axioms.forEach((entry) => axioms.set(getAxiomKey(entry), entry));
    }
  };
  // A flattened symbol stands for a builtin applied to its first-order arguments and then its
  // higher-order ones, so its higher-order text is visited after its arguments.
  const visit = (text: string) => {
    const tokens = text.match(/[()]|[^\s()]+/g) ?? [];
    const pending: { depth: number; text: string }[] = [];
    tokens.reduce((depth, token, index) => {
      if (token === "(") return depth + 1;
      if (token === ")") {
        if (pending.at(-1)?.depth === depth) visit(pending.pop()?.text ?? "");
        return depth - 1;
      }
      const builtin = BUILTIN_NAMES.get(token);
      if (builtin !== undefined) add(builtin);
      const flat = flattened.get(token);
      if (!flat) return depth;
      if (flat.kind !== "") add(flat.kind);
      if (tokens[index - 1] === "(") pending.push({ depth, text: flat.visit });
      else visit(flat.visit);
      return depth;
    }, 0);
  };
  entries.forEach((entry) => {
    if (typeof entry === "string") visit(entry);
  });
  return { symbols, axioms };
};

const SET_HEADS = new Set([
  UNION,
  SUBSET,
  CUP,
  CAP,
  SET_MINUS,
  BOOL_SET,
  STR_SET,
  INT_SET,
  NAT_SET,
  INT_RANGE,
  FUN_SET,
  SEQ,
]);

// Standardize.is_set: the constructors whose values are sets.
const isSetTerm = (text: string) => {
  const head = /^\(?([^\s()]+)/.exec(text)?.[1] ?? "";
  return (
    SET_HEADS.has(head) ||
    /^smt__TLA____(SetEnum__\d+|SetSt__flatnd__\d+|SetOf__\d+__flatnd__\d+|Product__\d+|RecordSet__)/.test(
      head,
    )
  );
};

const LEVEL_PREFIXES = ["CONSTANT", "STATE", "ACTION", "TEMPORAL"];

const COMMUTED_BUILTINS = new Set<Builtin>(["Prime", "UNCHANGED", "BoxTrue", "Diamond"]);

const sortFields = <Field extends { name: string }>(fields: Field[]) =>
  fields.toSorted((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));

// A bound variable's placeholder: its name and its depth, which the printer names in scope.
const getVariable = (name: string, depth: number) => `${name}#${depth}`;

const getDepth = (variable: string) => Number(variable.slice(variable.lastIndexOf("#") + 1));

// Flatten.compare_expr: an application matches an earlier one with the same higher-order
// arguments, whatever the variables bound outside them. It can't compare quantifiers or
// conditionals, so an argument with one matches nothing.
const getFlatKey = (text: string, depth: number) =>
  /\((forall|exists|ite) /.test(text)
    ? undefined
    : text.replace(/[^\s()]+#(\d+)/g, (_match, found: string) =>
        Number(found) < depth ? "#" : `#${Number(found) - depth}`,
      );

const getSaltedName = (base: string, salt: number) => (salt === 0 ? base : `${base}_${salt}`);

// Ctx.maybe_adj: a name is its formatted base, salted past the last one with that base and past
// every name in scope.
const createContext = () => {
  const salts = new Map<string, number>();
  const names = new Set<string>();
  const adjoin = (raw: string): Identifier => {
    const base = formatName(raw);
    const start = (salts.get(base) ?? -1) + 1;
    const salt =
      Array.from({ length: names.size + 1 }, (_value, index) => start + index).find(
        (candidate) => !names.has(getSaltedName(base, candidate)),
      ) ?? start;
    return { base, salt, name: getSaltedName(base, salt) };
  };
  // Brings an identifier into scope and returns how to take it out again.
  const enter = (identifier: Identifier) => {
    const previous = salts.get(identifier.base);
    salts.set(identifier.base, identifier.salt);
    names.add(identifier.name);
    return () => {
      names.delete(identifier.name);
      if (previous === undefined) salts.delete(identifier.base);
      else salts.set(identifier.base, previous);
    };
  };
  return { names, adjoin, enter };
};

// Smtlib.pp_print_obligation names each declaration for the rest of the obligation, and each
// quantifier's variables within it, so a variable's name depends on the names in scope.
const createPrinter = (declared: Map<string, Identifier>) => {
  const context = createContext();
  const resolve = (line: string) => {
    const declaration = /^\(declare-fun (\S+)/.exec(line)?.[1];
    if (declaration !== undefined) {
      const identifier = declared.get(declaration);
      if (identifier) context.enter(identifier);
      else context.names.add(declaration);
      return line;
    }
    const tokens = [...line.matchAll(/\|[^|]*\||[()]|[^\s()|]+/g)];
    const replacements = new Map<number, string>();
    const renames = new Map<string, string[]>();
    const scopes: QuantifierScope[] = [];
    const state = { index: 0, depth: 0 };
    while (state.index < tokens.length) {
      const token = tokens[state.index][0];
      const isQuantifier =
        token === "(" &&
        (tokens[state.index + 1]?.[0] === "forall" || tokens[state.index + 1]?.[0] === "exists") &&
        tokens[state.index + 2]?.[0] === "(";
      if (isQuantifier) {
        state.depth++;
        const scope: QuantifierScope = { depth: state.depth, exits: [] };
        scopes.push(scope);
        state.index += 3;
        while (tokens[state.index]?.[0] === "(") {
          const raw = tokens[state.index + 1][0];
          const identifier = context.adjoin(raw.replace(/#\d+$/, ""));
          const stack = renames.get(raw) ?? [];
          renames.set(raw, [...stack, identifier.name]);
          scope.exits.push(context.enter(identifier), () => renames.set(raw, stack));
          replacements.set(state.index + 1, identifier.name);
          state.index += 4;
        }
        state.index++;
        continue;
      }
      if (token === "(") state.depth++;
      if (token === ")") {
        if (scopes.at(-1)?.depth === state.depth)
          scopes
            .pop()
            ?.exits.toReversed()
            .forEach((exit) => exit());
        state.depth--;
      }
      const name = renames.get(token)?.at(-1);
      if (name !== undefined) replacements.set(state.index, name);
      state.index++;
    }
    return tokens
      .map((match, index) => {
        const end = tokens[index + 1]?.index ?? line.length;
        return `${replacements.get(index) ?? match[0]}${line.slice(match.index + match[0].length, end)}`;
      })
      .join("");
  };
  return { resolve };
};

const createEncoder = (session: EncodingSession) => {
  const flattened = new Map<string, Flattened>();
  const flatKeys = new Map<string, Flattened>();
  const anonymous = new Map<string, number>();
  const counter = { flat: 0 };
  // The flattened symbols that the hypothesis being encoded introduces.
  const introduced: Flattened[] = [];
  const context = createContext();
  // The salted name of each declared user symbol, for the printer's context.
  const declared = new Map<string, Identifier>();

  // Flatten: a second-order construct becomes a fresh symbol of its first-order arguments and
  // the bound variables it uses, declared with its axioms before the hypothesis that uses it.
  const flatten = (
    kind: string,
    visit: string,
    depth: number | undefined,
    getAxioms: (symbol: string, axioms: Set<string>) => Axiom[],
    arity: number,
    name = `TLA__${kind}`,
  ) => {
    const key = depth === undefined ? undefined : getFlatKey(`${name} ${visit}`, depth);
    // Flatten.new_bp_id counts every application, even one that reuses an earlier symbol.
    counter.flat++;
    const known = key === undefined ? undefined : flatKeys.get(key);
    if (known) return known.symbol;
    const raw = `${name}_flatnd_${counter.flat}`;
    const symbol = formatName(raw);
    const flat: Flattened = {
      symbol,
      kind,
      visit,
      getLines: (axioms) => [
        declare(symbol, arity),
        ...getAxioms(symbol, axioms).map(
          (entry) => `(assert (! ${entry.formula} :named |${entry.label} ${raw}|))`,
        ),
      ],
    };
    if (key !== undefined) flatKeys.set(key, flat);
    flattened.set(symbol, flat);
    introduced.push(flat);
    return symbol;
  };

  const toBool = (term: Term) => (term.isBool ? term.text : `(= ${term.text} ${TT_IDV})`);

  const toIdv = (term: Term) => (term.isBool ? `(${CAST_BOOL} ${term.text})` : term.text);

  const bool = (text: string): Term => ({ isBool: true, text });

  const idv = (text: string): Term => ({ isBool: false, text });

  const getBinding = (env: Env | undefined, index: number): Binding => {
    const found = Array.from({ length: index - 1 }).reduce<Env | undefined>(
      (current) => current?.rest,
      env,
    );
    if (!found) throw unsupported("a reference outside the obligation");
    return found.binding;
  };

  const push = (env: Env | undefined, binding: Binding): Env => ({ binding, rest: env });

  // The variables bound outside depth that text uses, outermost first.
  const getFree = (text: string, depth: number) =>
    [...new Set(text.match(/[^\s()]+#\d+/g))]
      .filter((variable) => getDepth(variable) < depth)
      .toSorted((left, right) => getDepth(left) - getDepth(right));

  // Smtlib.adj: the Action frontend's name, salted while it's taken.
  const getUniqueName = (name: string) => {
    const identifier = context.adjoin(name);
    context.enter(identifier);
    declared.set(identifier.name, identifier);
    return identifier.name;
  };

  const neither = (mode: Mode): Mode => ({ ...mode, polarity: "Neither" });

  const invert = (mode: Mode): Mode => ({
    ...mode,
    polarity:
      mode.polarity === "Positive"
        ? "Negative"
        : mode.polarity === "Negative"
          ? "Positive"
          : "Neither",
  });

  const encodeIdv = (expression: Expr, env: Env | undefined, mode: Mode) =>
    toIdv(encode(expression, env, neither(mode)));

  const encodeBool = (expression: Expr, env: Env | undefined, mode: Mode) =>
    toBool(encode(expression, env, mode));

  // The domains of bounds, each in the scope outside them. A Ditto copies the last domain, and
  // tlapm's Rewrite encodes each copy, so each one flattens again.
  const encodeDomains = (bounds: Bound[], env: Env | undefined, mode: Mode) =>
    bounds
      .reduce<(Expr | undefined)[]>((domains, bound) => {
        if (bound.domain.kind === "Ditto") return [...domains, domains.at(-1)];
        if (bound.domain.kind === "NoDomain") return [...domains, undefined];
        return [...domains, bound.domain.expression];
      }, [])
      .map((domain) => (domain === undefined ? undefined : encodeIdv(domain, env, mode)));

  const getDomains = (bounds: Bound[], env: Env | undefined, mode: Mode, construct: string) =>
    encodeDomains(bounds, env, mode).map((domain) => {
      if (domain === undefined) throw unsupported(`${construct} without a domain`);
      return domain;
    });

  // Coalesce names a bound variable by its kind. Visit gives a LAMBDA's parameters kind Unknown.
  const bindVariables = (
    names: string[],
    env: Env | undefined,
    mode: Mode,
    kind: "CONSTANT" | "Unknown" = "CONSTANT",
  ) => {
    const variables = names.map((name, index) =>
      getVariable(`${kind}_${name}_`, mode.depth + index),
    );
    const inner = variables.reduce<Env | undefined>(
      (current, symbol) => push(current, { kind: "constant", symbol }),
      env,
    );
    return { variables, env: inner, mode: { ...mode, depth: mode.depth + names.length } };
  };

  const binders = (variables: string[]) =>
    variables.map((variable) => `(${variable} Idv)`).join(" ");

  const encodeQuantifier = (
    expression: Extract<Expr, { kind: "Quant" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const domains = encodeDomains(expression.bounds, env, mode);
    const bound = bindVariables(
      expression.bounds.map((innerBound) => innerBound.name),
      env,
      mode,
    );
    const body = encodeBool(expression.body, bound.env, bound.mode);
    const guards = bound.variables.flatMap((variable, index) =>
      domains[index] === undefined ? [] : [`(${MEM} ${variable} ${domains[index]})`],
    );
    return expression.quantifier === "Forall"
      ? `(forall (${binders(bound.variables)}) ${guards.length === 0 ? body : `(=> ${conjoin(guards)} ${body})`})`
      : `(exists (${binders(bound.variables)}) ${conjoin([...guards, body])})`;
  };

  const encodeSetSt = (
    expression: Extract<Expr, { kind: "SetSt" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const domain = encodeIdv(expression.domain, env, mode);
    const bound = bindVariables([expression.name], env, neither(mode));
    const body = encodeBool(expression.body, bound.env, bound.mode);
    const free = getFree(body, mode.depth);
    const symbol = flatten(
      "SetSt",
      body,
      mode.depth,
      (name) => {
        const set = call(name, ["a", ...free]);
        const predicate = replaceToken(body, bound.variables[0], "x");
        return [
          axiom(
            "SetStDef",
            [],
            forall([...free, "a", "x"], `(= (${MEM} x ${set}) (and (${MEM} x a) ${predicate}))`, [
              [`(${MEM} x ${set})`],
              [`(${MEM} x a)`, set],
            ]),
          ),
        ];
      },
      free.length + 1,
    );
    return idv(call(symbol, [domain, ...free]));
  };

  const encodeSetOf = (
    expression: Extract<Expr, { kind: "SetOf" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const domains = getDomains(expression.bounds, env, mode, "a set of values");
    const bound = bindVariables(
      expression.bounds.map((innerBound) => innerBound.name),
      env,
      neither(mode),
    );
    const element = encodeIdv(expression.element, bound.env, bound.mode);
    const free = getFree(element, mode.depth);
    const count = domains.length;
    const symbol = flatten(
      `SetOf_${count}`,
      element,
      mode.depth,
      (name) => {
        const sets = getNames("a", count);
        const variables = getNames("y", count);
        const value = bound.variables.reduce(
          (text, variable, index) => replaceToken(text, variable, variables[index]),
          element,
        );
        const set = call(name, [...sets, ...free]);
        const guards = variables.map((variable, index) => `(${MEM} ${variable} ${sets[index]})`);
        // N_axioms.assert_issetof names its one set a.
        const single = count === 1 ? ["a"] : sets;
        return [
          axiom(
            "SetOfIntro",
            [count],
            forall(
              [...free, ...sets, ...variables],
              `(=> ${conjoin(guards)} (${MEM} ${value} ${set}))`,
              [
                [value, set],
                [set, ...guards],
              ],
            ),
          ),
          axiom(
            "SetOfElim",
            [count],
            forall(
              [...free, ...sets, "x"],
              `(=> (${MEM} x ${set}) (exists (${binders(variables)}) ${conjoin([...guards, `(= x ${value})`])}))`,
              [[`(${MEM} x ${set})`]],
            ),
          ),
          axiom(
            "AssertIsSetOf",
            [count],
            forall([...free, ...single], `(${IS_SET_OF} ${call(name, [...single, ...free])})`, [
              [call(name, [...single, ...free])],
            ]),
          ),
        ];
      },
      count + free.length,
    );
    return idv(call(symbol, [...domains, ...free]));
  };

  // Rewrite.elim_multiarg: a function of several arguments is a function of a tuple.
  const encodeFunction = (
    expression: Extract<Expr, { kind: "Fcn" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const domains = getDomains(expression.bounds, env, mode, "a function");
    const domain =
      domains.length === 1 ? domains[0] : call(tla(`Product_${domains.length}`), domains);
    const variable = getVariable(
      domains.length === 1 ? `CONSTANT_${expression.bounds[0].name}_` : "x",
      mode.depth,
    );
    const inner = { ...neither(mode), depth: mode.depth + 1 };
    const bodyEnv =
      domains.length === 1
        ? push(env, { kind: "constant", symbol: variable })
        : getIntegers(domains.length).reduce<Env | undefined>(
            (current, key) =>
              push(current, { kind: "constant", symbol: `(${FUN_APP} ${variable} ${key})` }),
            env,
          );
    const body = encodeIdv(expression.body, bodyEnv, inner);
    const free = getFree(body, mode.depth);
    const symbol = flatten(
      "FunFcn",
      body,
      mode.depth,
      (name, axioms) => {
        const value = call(name, ["a", ...free]);
        const result = replaceToken(body, variable, "x");
        const typing = axioms.has(getAxiomKey(axiom("FunTyping", [], undefined)))
          ? [
              axiom(
                "FunTyping",
                [],
                forall(
                  [...free, "a", "b"],
                  `(=> (forall ((x Idv)) (=> (${MEM} x a) (${MEM} ${result} b))) (${MEM} ${value} (${FUN_SET} a b)))`,
                  [[value, `(${FUN_SET} a b)`]],
                ),
              ),
            ]
          : [];
        return [
          axiom(
            "FunConstrIsafcn",
            [],
            forall([...free, "a"], `(${FUN_ISAFCN} ${value})`, [[value]]),
          ),
          axiom("FunDomDef", [], forall([...free, "a"], `(= (${FUN_DOM} ${value}) a)`, [[value]])),
          axiom(
            "FunAppDef",
            [],
            forall([...free, "a", "x"], `(=> (${MEM} x a) (= (${FUN_APP} ${value} x) ${result}))`, [
              [`(${FUN_APP} ${value} x)`],
              [`(${MEM} x a)`, value],
            ]),
          ),
          ...typing,
        ];
      },
      free.length + 1,
    );
    return idv(call(symbol, [domain, ...free]));
  };

  // Elab: CHOOSE x \in S : P is CHOOSE x : x \in S /\ P.
  const encodeChoose = (
    expression: Extract<Expr, { kind: "Choose" }>,
    env: Env | undefined,
    mode: Mode,
  ) => {
    const bound = bindVariables([expression.name], env, neither(mode));
    const variable = bound.variables[0];
    const domain =
      expression.domain && `(${MEM} ${variable} ${encodeIdv(expression.domain, env, mode)})`;
    const predicate = encodeBool(expression.body, bound.env, bound.mode);
    const body = domain === undefined ? predicate : conjoin([domain, predicate]);
    const free = getFree(body, mode.depth);
    const symbol = flatten(
      "Choose",
      body,
      mode.depth,
      (name) => [
        axiom(
          "ChooseDef",
          [],
          forall(
            [...free, "x"],
            `(=> ${replaceToken(body, variable, "x")} ${replaceToken(body, variable, call(name, free))})`,
          ),
        ),
      ],
      free.length,
    );
    return idv(call(symbol, free));
  };

  // Standardize.set_extensionality_visitor: an equality of sets where it may need proving
  // triggers the extensionality axiom.
  const encodeEquality = (
    left: Expr,
    right: Expr,
    env: Env | undefined,
    mode: Mode,
    isNegated: boolean,
  ) => {
    const leftTerm = encode(left, env, neither(mode));
    const rightTerm = encode(right, env, neither(mode));
    // Type.Synthesize compares values of the same sort only above type level 1, so two formulas
    // are compared as values.
    const leftText = toIdv(leftTerm);
    const rightText = toIdv(rightTerm);
    const isTriggered =
      (isSetTerm(leftText) || isSetTerm(rightText)) &&
      mode.polarity !== (isNegated ? "Positive" : "Negative");
    const equality = isTriggered
      ? `(${TRIG_EQ} ${leftText} ${rightText})`
      : `(= ${leftText} ${rightText})`;
    if (!isNegated) return equality;
    return isTriggered ? `(not ${equality})` : `(distinct ${leftText} ${rightText})`;
  };

  const encodeBuiltin = (
    builtin: Builtin,
    args: Expr[],
    env: Env | undefined,
    mode: Mode,
  ): Term => {
    const idvs = () => args.map((arg) => encodeIdv(arg, env, mode));
    switch (builtin) {
      case "Conj":
        return bool(conjoin(args.map((arg) => encodeBool(arg, env, mode))));
      case "Disj":
        return bool(disjoin(args.map((arg) => encodeBool(arg, env, mode))));
      case "Implies":
        return bool(
          `(=> ${encodeBool(args[0], env, invert(mode))} ${encodeBool(args[1], env, mode)})`,
        );
      case "Equiv":
        return bool(`(= ${args.map((arg) => encodeBool(arg, env, neither(mode))).join(" ")})`);
      case "Neg":
        return bool(`(not ${encodeBool(args[0], env, invert(mode))})`);
      case "Eq":
        return bool(encodeEquality(args[0], args[1], env, mode, false));
      case "Neq":
        return bool(encodeEquality(args[0], args[1], env, mode, true));
      case "Mem":
        return bool(call(MEM, idvs()));
      // Rewrite.elim_notmem: a \notin S is ~(a \in S).
      case "Notmem":
        return bool(`(not ${call(MEM, idvs())})`);
      case "Subseteq":
        return bool(call(SUBSET_EQ, idvs()));
      // Rewrite.elim_compare: a < b is a <= b /\ a # b, and a > b is b < a.
      case "Lteq":
        return bool(call(INT_LTEQ, idvs()));
      case "Gteq":
        return bool(call(INT_LTEQ, idvs().toReversed()));
      case "Lt":
      case "Gt": {
        const operands = builtin === "Lt" ? idvs() : idvs().toReversed();
        return bool(`(and ${call(INT_LTEQ, operands)} (distinct ${operands.join(" ")}))`);
      }
      case "Prime":
        if (mode.isPrimed) throw unsupported("a doubly primed expression");
        return encode(args[0], env, { ...mode, isPrimed: true });
      case "Unprimable":
        return encode(args[0], env, mode);
      default: {
        const symbol = BUILTIN_SYMBOLS[builtin];
        if (symbol === undefined) throw unsupported(`the operator ${builtin}`);
        return idv(call(symbol, idvs()));
      }
    }
  };

  const encodeReference = (
    binding: Binding,
    args: Expr[],
    env: Env | undefined,
    mode: Mode,
  ): Term => {
    switch (binding.kind) {
      case "constant":
        if (args.length > 0) throw unsupported("an applied constant");
        return idv(binding.symbol);
      case "variable":
        if (args.length > 0) throw unsupported("an applied variable");
        return idv(mode.isPrimed ? binding.primed : binding.symbol);
      case "operator": {
        if (args.length !== binding.arity)
          throw unsupported("an operator applied to the wrong number of arguments");
        const encoded = args.map((arg) => encodeIdv(arg, env, mode));
        if (!mode.isPrimed || binding.opaque === undefined)
          return idv(call(binding.symbol, encoded));
        // Coalesce: a primed hidden definition that isn't constant is an opaque operator of its
        // own, which Standardize names OPAQUE_ when it has no arguments.
        const name =
          binding.arity === 0 ? `Anon_OPAQUE_${binding.opaque}` : `Anon_${binding.opaque}`;
        anonymous.set(name, binding.arity);
        return idv(call(tla(name), encoded));
      }
      // Flatten: an application of a second-order operator, which has no axioms, is a fresh
      // operator of its first-order arguments and the bound variables its others use.
      case "secondOrder": {
        if (args.length !== binding.shapes.length)
          throw unsupported("an operator applied to the wrong number of arguments");
        const operands = args.map((arg, index) => {
          if (binding.shapes[index] === 0)
            return { isFirstOrder: true, text: encodeIdv(arg, env, mode) };
          if (arg.kind !== "Lambda") throw unsupported("an operator argument that isn't a LAMBDA");
          const bound = bindVariables(
            arg.params.map((param) => param.name),
            env,
            neither(mode),
            "Unknown",
          );
          return { isFirstOrder: false, text: encode(arg.body, bound.env, bound.mode).text };
        });
        const firstOrder = operands.flatMap((operand) =>
          operand.isFirstOrder ? [operand.text] : [],
        );
        const higherOrder = operands.flatMap((operand) =>
          operand.isFirstOrder ? [] : [operand.text],
        );
        const free = getFree(higherOrder.join(" "), mode.depth);
        const symbol = flatten(
          "",
          higherOrder.join(" "),
          mode.depth,
          () => [],
          firstOrder.length + free.length,
          binding.name,
        );
        return idv(call(symbol, [...firstOrder, ...free]));
      }
      case "unsupported":
        throw unsupported(binding.reason);
    }
  };

  const encodeExcept = (
    expression: Extract<Expr, { kind: "Except" }>,
    env: Env | undefined,
    mode: Mode,
  ) =>
    expression.specs.reduce(
      (base, spec) => {
        // Elab.desugar: @ is the value at the whole trail.
        const update = (value: string, trail: typeof spec.trail): string => {
          if (trail.length === 0) return encodeIdv(spec.value, env, { ...mode, at: value });
          const point = trail[0];
          const encodeKey = () =>
            point.kind === "Dot"
              ? tla(`StrLit_${point.field}`)
              : encodeIdv(point.expression, env, mode);
          const key = encodeKey();
          // Elab.desugar repeats the key in the value it updates, and Flatten counts both.
          const inner = update(
            `(${FUN_APP} ${value} ${trail.length > 1 ? encodeKey() : key})`,
            trail.slice(1),
          );
          return `(${FUN_EXCEPT} ${value} ${key} ${inner})`;
        };
        return update(base, spec.trail);
      },
      encodeIdv(expression.function, env, mode),
    );

  // Standardize names each CASE with no OTHER by a count that tlapm never resets.
  const getCaseError = () => {
    session.caseErrors++;
    const name = `Anon_incomplete_case_error_${session.caseErrors}`;
    anonymous.set(name, 0);
    return tla(name);
  };

  const encodeCase = (
    expression: Extract<Expr, { kind: "Case" }>,
    env: Env | undefined,
    mode: Mode,
  ): Term => {
    const bodies = expression.arms.map((arm) => encode(arm.body, env, mode));
    // Standardize: a CASE with no OTHER ends in an unknown value.
    const other: Term = expression.other
      ? encode(expression.other, env, mode)
      : idv(getCaseError());
    const isBool = other.isBool && bodies.every((body) => body.isBool);
    const isInteger =
      other.integer !== undefined && bodies.every((body) => body.integer !== undefined);
    if (isInteger) {
      const integer = expression.arms.reduceRight(
        (rest, arm, index) =>
          `(ite ${encodeBool(arm.condition, env, neither(mode))} ${bodies[index].integer} ${rest})`,
        other.integer ?? "",
      );
      return { isBool: false, text: `(${CAST_INT} ${integer})`, integer };
    }
    const convert = (term: Term) => (isBool ? term.text : toIdv(term));
    const text = expression.arms.reduceRight(
      (rest, arm, index) =>
        `(ite ${encodeBool(arm.condition, env, neither(mode))} ${convert(bodies[index])} ${rest})`,
      convert(other),
    );
    return { isBool, text };
  };

  const encodeSequent = (sequent: Sequent, env: Env | undefined, mode: Mode): string => {
    const steps = sequent.context.reduce<{
      env: Env | undefined;
      mode: Mode;
      wrappers: ((body: string) => string)[];
    }>(
      (state, hyp) => {
        switch (hyp.kind) {
          case "Fresh": {
            if (hyp.shape > 0) throw unsupported("a second-order ASSUME");
            if (hyp.level !== "Constant")
              throw unsupported("a NEW declaration that isn't constant");
            const domain = hyp.domain && encodeIdv(hyp.domain, state.env, state.mode);
            const bound = bindVariables([hyp.name], state.env, state.mode);
            const variable = bound.variables[0];
            const guard = domain && `(${MEM} ${variable} ${domain})`;
            return {
              env: bound.env,
              mode: bound.mode,
              wrappers: [
                ...state.wrappers,
                (body: string) =>
                  `(forall ((${variable} Idv)) ${guard ? `(=> ${guard} ${body})` : body})`,
              ],
            };
          }
          case "Fact": {
            const fact =
              hyp.visibility === "Visible"
                ? encodeBool(hyp.expression, state.env, invert(state.mode))
                : undefined;
            return {
              env: push(state.env, { kind: "unsupported", reason: "a reference to a fact" }),
              mode: state.mode,
              wrappers: fact
                ? [...state.wrappers, (body: string) => `(=> ${fact} ${body})`]
                : state.wrappers,
            };
          }
          default:
            throw unsupported(`a ${hyp.kind} in a nested ASSUME`);
        }
      },
      { env, mode, wrappers: [] },
    );
    return steps.wrappers.reduceRight(
      (body, wrap) => wrap(body),
      encodeBool(sequent.active, steps.env, steps.mode),
    );
  };

  const encode = (expression: Expr, env: Env | undefined, mode: Mode): Term => {
    switch (expression.kind) {
      case "Ix":
        return encodeReference(getBinding(env, expression.index), [], env, mode);
      case "Internal":
        switch (expression.builtin) {
          case "TRUE":
            return bool("true");
          case "FALSE":
            return bool("false");
          case "BOOLEAN":
            return idv(BOOL_SET);
          case "STRING":
            return idv(STR_SET);
          case "Nat":
            return idv(NAT_SET);
          case "Int":
            return idv(INT_SET);
          default:
            throw unsupported(`the operator ${expression.builtin}`);
        }
      case "Apply": {
        const operator = expression.operator;
        if (operator.kind === "Internal")
          return encodeBuiltin(operator.builtin, expression.args, env, mode);
        if (operator.kind === "Ix")
          return encodeReference(getBinding(env, operator.index), expression.args, env, mode);
        if (operator.kind === "Lambda")
          return encode({ ...normalizeApply(operator, expression.args) }, env, mode);
        throw unsupported(`an application of ${operator.kind}`);
      }
      case "Sequent":
        return bool(encodeSequent(expression.sequent, env, mode));
      case "With":
      case "Parens":
        return encode(expression.expression, env, mode);
      case "If": {
        const condition = encodeBool(expression.condition, env, neither(mode));
        const consequent = encode(expression.consequent, env, mode);
        const alternative = encode(expression.alternative, env, mode);
        if (consequent.integer !== undefined && alternative.integer !== undefined) {
          const integer = `(ite ${condition} ${consequent.integer} ${alternative.integer})`;
          return { isBool: false, text: `(${CAST_INT} ${integer})`, integer };
        }
        return consequent.isBool && alternative.isBool
          ? bool(`(ite ${condition} ${consequent.text} ${alternative.text})`)
          : idv(`(ite ${condition} ${toIdv(consequent)} ${toIdv(alternative)})`);
      }
      case "List": {
        const items = expression.items.map((item) => encodeBool(item, env, mode));
        return bool(expression.bullet === "Or" ? disjoin(items) : conjoin(items));
      }
      case "Let":
        return encode(expandLet(expression), env, mode);
      case "Quant":
        return bool(encodeQuantifier(expression, env, mode));
      case "Choose":
        return encodeChoose(expression, env, mode);
      case "SetSt":
        return encodeSetSt(expression, env, mode);
      case "SetOf":
        return encodeSetOf(expression, env, mode);
      case "SetEnum":
        return idv(
          call(
            tla(`SetEnum_${expression.elements.length}`),
            expression.elements.map((element) => encodeIdv(element, env, mode)),
          ),
        );
      case "Product":
        return idv(
          call(
            tla(`Product_${expression.factors.length}`),
            expression.factors.map((factor) => encodeIdv(factor, env, mode)),
          ),
        );
      case "Tuple":
        return idv(
          call(
            tla(`Tuple_${expression.elements.length}`),
            expression.elements.map((element) => encodeIdv(element, env, mode)),
          ),
        );
      case "Fcn":
        return encodeFunction(expression, env, mode);
      // Rewrite.elim_multiarg: f[a, b] applies f to the tuple <<a, b>>.
      case "FcnApp": {
        const fn = encodeIdv(expression.function, env, mode);
        const args = expression.args.map((arg) => encodeIdv(arg, env, mode));
        const argument = args.length === 1 ? args[0] : call(tla(`Tuple_${args.length}`), args);
        return idv(`(${FUN_APP} ${fn} ${argument})`);
      }
      case "Arrow":
        return idv(
          call(FUN_SET, [
            encodeIdv(expression.domain, env, mode),
            encodeIdv(expression.range, env, mode),
          ]),
        );
      // Rewrite.sort_recfields: a record's fields in order.
      case "Record":
      case "Rect": {
        const fields = sortFields(expression.fields);
        const names = fields.map((field) => field.name);
        RECORD_FIELDS.set(`Record_${names.join("_")}`, names);
        RECORD_FIELDS.set(`RecordSet_${names.join("_")}`, names);
        const name = `${expression.kind === "Record" ? "Record" : "RecordSet"}_${names.join("_")}`;
        return idv(
          call(
            tla(name),
            fields.map((field) => encodeIdv(field.value, env, mode)),
          ),
        );
      }
      case "Except":
        return idv(encodeExcept(expression, env, mode));
      case "Dot":
        return idv(
          `(${FUN_APP} ${encodeIdv(expression.expression, env, mode)} ${tla(`StrLit_${expression.field}`)})`,
        );
      case "Case":
        return encodeCase(expression, env, mode);
      case "String":
        return idv(tla(`StrLit_${expression.value}`));
      case "Num":
        if (expression.fraction !== "") throw unsupported("a real number");
        return {
          isBool: false,
          text: `(${CAST_INT} ${BigInt(expression.integer)})`,
          integer: String(BigInt(expression.integer)),
        };
      case "At":
        if (mode.at === undefined) throw unsupported("@ outside EXCEPT");
        return idv(mode.at);
      case "Tquant":
      case "Tsub":
      case "Fair":
        throw unsupported("a temporal formula");
      default:
        throw unsupported(`the expression ${expression.kind}`);
    }
  };

  // Encodes one hypothesis or the goal with the flattened symbols it introduces. One the encoding
  // can't express is left out, which only weakens what the solver may assume.
  const attempt = (encodeLine: () => string): { entries: Entry[]; omitted?: string } => {
    const mark = { introduced: introduced.length, flatKeys: new Map(flatKeys) };
    try {
      const line = encodeLine();
      return { entries: [...introduced.splice(mark.introduced), line] };
    } catch (error) {
      if (!(error instanceof TlaUnsupportedError)) throw error;
      introduced.splice(mark.introduced).forEach((flat) => flattened.delete(flat.symbol));
      flatKeys.clear();
      mark.flatKeys.forEach((value, key) => flatKeys.set(key, value));
      return { entries: [], omitted: error.message };
    }
  };

  // Smtlib.pp_print_obligation: the logic, the sort, the builtin symbols by name, their axioms,
  // then the hypotheses in order, the goal last.
  const assemble = (entries: Entry[]) => {
    const printer = createPrinter(declared);
    const collected = collectSymbols(entries, flattened, anonymous);
    const declarations = [...collected.symbols]
      .toSorted((left, right) => (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0))
      .flatMap((symbol) => (symbol[1].declaration === undefined ? [] : [symbol[1].declaration]));
    const axioms = [...collected.axioms.values()]
      .toSorted(compareAxioms)
      .flatMap((entry) =>
        entry.formula === undefined
          ? []
          : [`(assert (! ${entry.formula} :named |${entry.label}|))`],
      );
    const keys = new Set(collected.axioms.keys());
    return [
      "(set-logic UFNIA)",
      "(declare-sort Idv 0)",
      ...declarations,
      ...axioms,
      ...entries.flatMap((entry) => (typeof entry === "string" ? [entry] : entry.getLines(keys))),
    ]
      .map(printer.resolve)
      .concat("(check-sat)", "(exit)")
      .join("\n");
  };

  return { encodeIdv, encodeBool, push, attempt, getUniqueName, assemble };
};

type Encoder = ReturnType<typeof createEncoder>;

const HYPOTHESIS: Mode = { isPrimed: false, polarity: "Negative", at: undefined, depth: 0 };

// Declares each hypothesis's names and asserts its facts, in order, as Smtlib.pp_print_obligation.
// Visible definitions and TLAPS's pragmas are expanded, so they declare nothing.
const encodeContext = (context: Hyp[], encoder: Encoder) =>
  context.reduce<{
    env: Env | undefined;
    scope: Scope | undefined;
    entries: Entry[];
    omitted: string[];
  }>(
    (state, hyp) => {
      const next = (binding: Binding, entries: Entry[] = [], omitted?: string) => ({
        env: encoder.push(state.env, binding),
        scope: adjoin(state.scope, hyp),
        entries: [...state.entries, ...entries],
        omitted: omitted === undefined ? state.omitted : [...state.omitted, omitted],
      });
      switch (hyp.kind) {
        case "Fresh": {
          if (hyp.level === "Temporal" || (hyp.shape > 0 && hyp.level !== "Constant"))
            return next({ kind: "unsupported", reason: "a temporal declaration" });
          const prefix =
            hyp.level === "State" ? "STATE" : hyp.level === "Action" ? "ACTION" : "CONSTANT";
          const symbol = encoder.getUniqueName(`${prefix}_${hyp.name}_`);
          const binding: Binding =
            hyp.shape === 0
              ? { kind: "constant", symbol }
              : { kind: "operator", symbol, arity: hyp.shape, opaque: undefined };
          const declaration = declare(symbol, hyp.shape);
          const domain = hyp.domain;
          if (!domain || hyp.domainVisibility === "Hidden") return next(binding, [declaration]);
          // Rewrite.elim_bounds: NEW x \in S is NEW x and the fact x \in S.
          const fact = encoder.attempt(
            () => `(assert (${MEM} ${symbol} ${encoder.encodeIdv(domain, state.env, HYPOTHESIS)}))`,
          );
          return next(binding, [declaration, ...fact.entries], fact.omitted);
        }
        case "Flex": {
          const symbol = encoder.getUniqueName(`VARIABLE_${hyp.name}_`);
          const primed = `${symbol}__prime`;
          return next({ kind: "variable", symbol, primed }, [
            declare(symbol, 0),
            declare(primed, 0),
          ]);
        }
        case "Defn": {
          const definition = hyp.definition;
          const isExpanded =
            definition.kind === "Bpragma" ||
            getPragmaProver(hyp) !== undefined ||
            (definition.kind === "Operator" && hyp.visibility === "Visible");
          if (isExpanded) return next({ kind: "unsupported", reason: "an expanded definition" });
          if (definition.kind === "Instance")
            return next({ kind: "unsupported", reason: "an instance" });
          if (definition.kind === "Recursive") {
            const symbol = encoder.getUniqueName(`CONSTANT_${definition.name}_`);
            return next({ kind: "operator", symbol, arity: definition.shape, opaque: undefined }, [
              declare(symbol, definition.shape),
            ]);
          }
          if (definition.kind !== "Operator")
            return next({ kind: "unsupported", reason: "a definition" });
          const body = definition.body;
          const params = body.kind === "Lambda" ? body.params : [];
          // Action.process_eob expands an UNCHANGED, and commutes a prime, [] or <>, at the root
          // of a definition into its argument. Levels.compute_level then keeps the level the
          // argument had for the new root.
          const isCommuted =
            body.kind === "Apply" &&
            body.operator.kind === "Internal" &&
            COMMUTED_BUILTINS.has(body.operator.builtin);
          const level = Math.min(
            getLevelInfo(state.scope, isCommuted ? body.args[0] : body).level,
            3,
          );
          const name = `${LEVEL_PREFIXES[level]}_${definition.name}_`;
          if (params.some((param) => param.shape > 0))
            return next({ kind: "secondOrder", name, shapes: params.map((param) => param.shape) });
          const symbol = encoder.getUniqueName(name);
          // Coalesce.crypthash: the digest of the primed name.
          const opaque = level > 0 ? `h${getMd5(`${name}'`).slice(0, 5)}` : undefined;
          return next({ kind: "operator", symbol, arity: params.length, opaque }, [
            declare(symbol, params.length),
          ]);
        }
        case "Fact": {
          const binding: Binding = { kind: "unsupported", reason: "a reference to a fact" };
          if (hyp.visibility === "Hidden") return next(binding);
          const fact = encoder.attempt(
            () => `(assert ${encoder.encodeBool(hyp.expression, state.env, HYPOTHESIS)})`,
          );
          return next(binding, fact.entries, fact.omitted);
        }
      }
    },
    { env: undefined, scope: undefined, entries: [], omitted: [] },
  );

export const encodeObligation = (
  sequent: Sequent,
  kind: ObligationKind,
  session: EncodingSession = { caseErrors: 0 },
): ObligationEncoding => {
  const methods = findMethods(sequent.context);
  const smt = methods.findLast((method) => method.prover === "smt");
  const timeLimitMs = getTimeLimit(smt?.argument);
  const expanded = expandDefinitions(sequent);
  if (kind.kind === "Support" && isTrivial(expanded))
    return { encoding: { kind: "trivial" }, timeLimitMs };
  const prepared = splitFacts({
    context: expanded.context.map((hyp) =>
      hyp.kind === "Fact" ? { ...hyp, expression: expandActions(hyp.expression) } : hyp,
    ),
    active: expandActions(expanded.active),
  });
  if (methods.length > 0 && !smt) {
    const provers = [...new Set(methods.map((method) => method.prover))].join(", ");
    return {
      encoding: { kind: "unsupported", reason: `the step is proved by ${provers}` },
      timeLimitMs,
    };
  }
  const encoder = createEncoder(session);
  const context = encodeContext(prepared.context, encoder);
  const goal = encoder.attempt(
    () =>
      `(assert (! (not ${encoder.encodeBool(prepared.active, context.env, { ...HYPOTHESIS, polarity: "Positive" })}) :named |Goal|))`,
  );
  if (goal.omitted !== undefined)
    return { encoding: { kind: "unsupported", reason: goal.omitted }, timeLimitMs };
  const script = encoder.assemble([...context.entries, ...goal.entries]);
  return { encoding: { kind: "smt", script, omitted: context.omitted[0] }, timeLimitMs };
};
