// backend/smtlib.ml's names and the SMT-LIB terms the encoding builds.

import type { Builtin } from "../../obligations/expression";

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

export const formatName = (name: string) =>
  `smt__${name.replace(/[\\+\-*/%^&@#$()|.:?!<>= ]/g, (character) => SPELLED[character]).replaceAll("_", "__")}`;

const TLA_PREFIX = formatName("TLA__");

const UNSPELLED = new Map(Object.entries(SPELLED).map((entry) => [entry[1], entry[0]]));

const SPELLED_WORDS = new RegExp(`(${[...UNSPELLED.keys()].join("|")})`, "g");

export const tla = (name: string) => formatName(`TLA__${name}`);

// The builtin a symbol that tla names stands for, or undefined for any other symbol.
export const getTlaName = (symbol: string) =>
  symbol.startsWith(TLA_PREFIX)
    ? symbol
        .slice(TLA_PREFIX.length)
        .replaceAll("__", "_")
        .replace(SPELLED_WORDS, (word) => UNSPELLED.get(word) ?? word)
    : undefined;

export const MEM = tla("Mem");
export const SET_EXT_TRIGGER = tla("SetExtTrigger");
export const SUBSET_EQ = tla("SubsetEq");
export const CUP = tla("Cup");
export const CAP = tla("Cap");
export const SET_MINUS = tla("SetMinus");
export const SUBSET = tla("Subset");
export const UNION = tla("Union");
export const TT_IDV = tla("Tt_Idv");
export const CAST_BOOL = tla("Cast_Bool");
export const BOOL_SET = tla("BoolSet");
export const STR_SET = tla("StrSet");
export const INT_SET = tla("IntSet");
export const NAT_SET = tla("NatSet");
export const CAST_INT = tla("Cast_Int");
export const PROJ_INT = tla("Proj_Int");
export const INT_LTEQ = tla("IntLteq");
export const INT_RANGE = tla("IntRange");
export const FUN_APP = tla("FunApp");
export const FUN_DOM = tla("FunDom");
export const FUN_ISAFCN = tla("FunIsafcn");
export const FUN_SET = tla("FunSet");
export const FUN_EXCEPT = tla("FunExcept");
export const TRIG_EQ = tla("TrigEq_Set$Idv$");
export const IS_SET_OF = tla("IsSetOf");
export const SEQ = tla("Seq");
export const LEN = tla("Len");
export const CAT = tla("Cat");
export const APPEND = tla("Append");
export const HEAD = tla("Head");
export const TAIL = tla("Tail");
export const SUB_SEQ = tla("SubSeq");
export const TUPLE_0 = tla("Tuple_0");

export const BUILTIN_SYMBOLS: Partial<Record<Builtin, string>> = {
  Cup: CUP,
  Cap: CAP,
  Setminus: SET_MINUS,
  SUBSET,
  UNION,
  DOMAIN: FUN_DOM,
  Plus: tla("IntPlus"),
  Minus: tla("IntMinus"),
  Times: tla("IntTimes"),
  Exp: tla("IntExp"),
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

export const getNames = (prefix: string, count: number) =>
  Array.from({ length: count }, (_value, index) => `${prefix}${index + 1}`);

const getSortedBinders = (variables: [string, string][]) =>
  variables.map((variable) => `(${variable[0]} ${variable[1]})`).join(" ");

export const forall = (
  variables: string[],
  body: string,
  patterns: string[][] = [],
  sort = "Idv",
) =>
  variables.length === 0
    ? body
    : `(forall (${getSortedBinders(variables.map((variable) => [variable, sort]))}) ${
        patterns.length === 0
          ? body
          : `(! ${body} ${patterns.map((pattern) => `:pattern (${pattern.join(" ")})`).join(" ")})`
      })`;

export const conjoin = (items: string[]) =>
  items.length === 0 ? "true" : items.length === 1 ? items[0] : `(and ${items.join(" ")})`;

export const disjoin = (items: string[]) =>
  items.length === 0 ? "false" : items.length === 1 ? items[0] : `(or ${items.join(" ")})`;

export const call = (symbol: string, args: string[]) =>
  args.length === 0 ? symbol : `(${symbol} ${args.join(" ")})`;

export const declare = (symbol: string, arity: number, sort = "Idv", argSort = "Idv") =>
  `(declare-fun ${symbol} (${Array.from({ length: arity }, () => argSort).join(" ")}) ${sort})`;

export const replaceToken = (text: string, token: string, replacement: string) =>
  text.replace(/[^\s()]+/g, (found) => (found === token ? replacement : found));
