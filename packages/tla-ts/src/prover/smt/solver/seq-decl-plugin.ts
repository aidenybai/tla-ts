// Ported from Z3 (src/ast/seq_decl_plugin.cpp, src/ast/char_decl_plugin.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import {
  type AstManager,
  OP_CHAR_CONST,
  OP_CHAR_FROM_BV,
  OP_CHAR_IS_DIGIT,
  OP_CHAR_LE,
  OP_CHAR_TO_BV,
  OP_CHAR_TO_INT,
  OP_INTERNAL_REGEXP_EMPTY,
  OP_INTERNAL_REGEXP_FULL_CHAR,
  OP_INTERNAL_STRING_CHARAT,
  OP_INTERNAL_STRING_CONCAT,
  OP_INTERNAL_STRING_FROM_CHAR,
  OP_INTERNAL_STRING_IN_REGEXP,
  OP_INTERNAL_STRING_LENGTH,
  OP_INTERNAL_STRING_POWER,
  OP_INTERNAL_STRING_PREFIX,
  OP_INTERNAL_STRING_STRCTN,
  OP_INTERNAL_STRING_STRIDOF,
  OP_INTERNAL_STRING_STRREPL,
  OP_INTERNAL_STRING_SUBSTR,
  OP_INTERNAL_STRING_SUFFIX,
  OP_INTERNAL_STRING_TO_REGEXP,
  OP_RE_COMPLEMENT,
  OP_RE_CONCAT,
  OP_RE_DERIVATIVE,
  OP_RE_DIFF,
  OP_RE_EMPTY_SET,
  OP_RE_FULL_CHAR_SET,
  OP_RE_FULL_SEQ_SET,
  OP_RE_INTERSECT,
  OP_RE_LOOP,
  OP_RE_OF_PRED,
  OP_RE_OPTION,
  OP_RE_PLUS,
  OP_RE_POWER,
  OP_RE_RANGE,
  OP_RE_REVERSE,
  OP_RE_STAR,
  OP_RE_UNION,
  OP_RE_XOR,
  OP_SEQ_AT,
  OP_SEQ_CONCAT,
  OP_SEQ_CONTAINS,
  OP_SEQ_EMPTY,
  OP_SEQ_EXTRACT,
  OP_SEQ_FOLDL,
  OP_SEQ_FOLDLI,
  OP_SEQ_IN_RE,
  OP_SEQ_INDEX,
  OP_SEQ_LAST_INDEX,
  OP_SEQ_LENGTH,
  OP_SEQ_MAP,
  OP_SEQ_MAPI,
  OP_SEQ_NTH,
  OP_SEQ_NTH_I,
  OP_SEQ_NTH_U,
  OP_SEQ_POWER,
  OP_SEQ_PREFIX,
  OP_SEQ_REPLACE,
  OP_SEQ_REPLACE_ALL,
  OP_SEQ_REPLACE_RE,
  OP_SEQ_REPLACE_RE_ALL,
  OP_SEQ_SUFFIX,
  OP_SEQ_TO_RE,
  OP_SEQ_UNIT,
  OP_STRING_CONST,
  OP_STRING_FROM_CODE,
  OP_STRING_IS_DIGIT,
  OP_STRING_ITOS,
  OP_STRING_LE,
  OP_STRING_LT,
  OP_STRING_SBVTOS,
  OP_STRING_STOI,
  OP_STRING_TO_CODE,
  OP_STRING_UBVTOS,
  SORT_BOOL,
  SORT_INT,
} from "./ast";

export const MAX_CHAR = 196607;
export const CHAR_BITS = 18;

const P_VAR = 0;
const P_INT = 1;
const P_BOOL = 2;
const P_STRING = 3;
const P_REGLAN = 4;
const P_SEQ = 5;
const P_RE = 6;
const P_ARRAY = 7;

interface SortPattern {
  kind: number;
  index: number;
  children: SortPattern[];
}

interface Psig {
  name: string;
  numParams: number;
  domain: SortPattern[];
  range: SortPattern;
}

export interface SeqSignature {
  op: number;
  name: string;
  parameters: number[];
  parameterHashes: number[];
  domain: number[];
  range: number;
  associativity: number;
}

const mkPattern = (kind: number, children: SortPattern[] = [], index = 0): SortPattern => ({
  kind,
  index,
  children,
});
const A = mkPattern(P_VAR, [], 0);
const B = mkPattern(P_VAR, [], 1);
const INT = mkPattern(P_INT);
const BOOL = mkPattern(P_BOOL);
const STR = mkPattern(P_STRING);
const RE_T = mkPattern(P_REGLAN);
const SEQ_A = mkPattern(P_SEQ, [A]);
const SEQ_B = mkPattern(P_SEQ, [B]);
const RE_A = mkPattern(P_RE, [SEQ_A]);
const arrayOf = (...children: SortPattern[]) => mkPattern(P_ARRAY, children);

const psig = (
  name: string,
  numParams: number,
  domain: SortPattern[],
  range: SortPattern,
): Psig => ({
  name,
  numParams,
  domain,
  range,
});

const SIGS = new Map<number, Psig>([
  [OP_SEQ_UNIT, psig("seq.unit", 1, [A], SEQ_A)],
  [OP_SEQ_EMPTY, psig("seq.empty", 1, [], SEQ_A)],
  [OP_SEQ_CONCAT, psig("seq.++", 1, [SEQ_A, SEQ_A], SEQ_A)],
  [OP_SEQ_PREFIX, psig("seq.prefixof", 1, [SEQ_A, SEQ_A], BOOL)],
  [OP_SEQ_SUFFIX, psig("seq.suffixof", 1, [SEQ_A, SEQ_A], BOOL)],
  [OP_SEQ_CONTAINS, psig("seq.contains", 1, [SEQ_A, SEQ_A], BOOL)],
  [OP_SEQ_EXTRACT, psig("seq.extract", 1, [SEQ_A, INT, INT], SEQ_A)],
  [OP_SEQ_REPLACE, psig("seq.replace", 1, [SEQ_A, SEQ_A, SEQ_A], SEQ_A)],
  [OP_SEQ_INDEX, psig("seq.indexof", 1, [SEQ_A, SEQ_A, INT], INT)],
  [OP_SEQ_LAST_INDEX, psig("seq.last_indexof", 1, [SEQ_A, SEQ_A], INT)],
  [OP_SEQ_AT, psig("seq.at", 1, [SEQ_A, INT], SEQ_A)],
  [OP_SEQ_NTH, psig("seq.nth", 1, [SEQ_A, INT], A)],
  [OP_SEQ_NTH_I, psig("seq.nth_i", 1, [SEQ_A, INT], A)],
  [OP_SEQ_NTH_U, psig("seq.nth_u", 1, [SEQ_A, INT], A)],
  [OP_SEQ_LENGTH, psig("seq.len", 1, [SEQ_A], INT)],
  [OP_SEQ_POWER, psig("seq.power", 1, [SEQ_A, INT], SEQ_A)],
  [OP_RE_PLUS, psig("re.+", 1, [RE_A], RE_A)],
  [OP_RE_STAR, psig("re.*", 1, [RE_A], RE_A)],
  [OP_RE_OPTION, psig("re.opt", 1, [RE_A], RE_A)],
  [OP_RE_RANGE, psig("re.range", 1, [SEQ_A, SEQ_A], RE_A)],
  [OP_RE_CONCAT, psig("re.++", 1, [RE_A, RE_A], RE_A)],
  [OP_RE_UNION, psig("re.union", 1, [RE_A, RE_A], RE_A)],
  [OP_RE_INTERSECT, psig("re.inter", 1, [RE_A, RE_A], RE_A)],
  [OP_RE_DIFF, psig("re.diff", 1, [RE_A, RE_A], RE_A)],
  [OP_RE_XOR, psig("re.xor", 1, [RE_A, RE_A], RE_A)],
  [OP_RE_LOOP, psig("re.loop", 1, [RE_A], RE_A)],
  [OP_RE_POWER, psig("re.^", 1, [RE_A], RE_A)],
  [OP_RE_COMPLEMENT, psig("re.comp", 1, [RE_A], RE_A)],
  [OP_RE_EMPTY_SET, psig("re.empty", 1, [], RE_A)],
  [OP_RE_FULL_SEQ_SET, psig("re.all", 1, [], RE_A)],
  [OP_RE_FULL_CHAR_SET, psig("re.allchar", 1, [], RE_A)],
  [OP_RE_OF_PRED, psig("re.of.pred", 1, [arrayOf(A, BOOL)], RE_A)],
  [OP_RE_REVERSE, psig("re.reverse", 1, [RE_A], RE_A)],
  [OP_RE_DERIVATIVE, psig("re.derivative", 1, [A, RE_A], RE_A)],
  [OP_SEQ_TO_RE, psig("seq.to.re", 1, [SEQ_A], RE_A)],
  [OP_SEQ_IN_RE, psig("seq.in.re", 1, [SEQ_A, RE_A], BOOL)],
  [OP_SEQ_REPLACE_RE_ALL, psig("str.replace_re_all", 1, [SEQ_A, RE_A, SEQ_A], SEQ_A)],
  [OP_SEQ_REPLACE_RE, psig("str.replace_re", 1, [SEQ_A, RE_A, SEQ_A], SEQ_A)],
  [OP_SEQ_REPLACE_ALL, psig("str.replace_all", 1, [SEQ_A, SEQ_A, SEQ_A], SEQ_A)],
  [OP_INTERNAL_STRING_STRIDOF, psig("str.indexof", 0, [STR, STR, INT], INT)],
  [OP_INTERNAL_STRING_STRREPL, psig("str.replace", 0, [STR, STR, STR], STR)],
  [OP_INTERNAL_STRING_FROM_CHAR, psig("char", 1, [], STR)],
  [OP_STRING_ITOS, psig("str.from_int", 0, [INT], STR)],
  [OP_STRING_STOI, psig("str.to_int", 0, [STR], INT)],
  [OP_STRING_LT, psig("str.<", 0, [STR, STR], BOOL)],
  [OP_STRING_LE, psig("str.<=", 0, [STR, STR], BOOL)],
  [OP_STRING_IS_DIGIT, psig("str.is_digit", 0, [STR], BOOL)],
  [OP_STRING_TO_CODE, psig("str.to_code", 0, [STR], INT)],
  [OP_STRING_FROM_CODE, psig("str.from_code", 0, [INT], STR)],
  [OP_INTERNAL_STRING_CONCAT, psig("str.++", 1, [STR, STR], STR)],
  [OP_INTERNAL_STRING_LENGTH, psig("str.len", 0, [STR], INT)],
  [OP_INTERNAL_STRING_STRCTN, psig("str.contains", 0, [STR, STR], BOOL)],
  [OP_INTERNAL_STRING_CHARAT, psig("str.at", 0, [STR, INT], STR)],
  [OP_INTERNAL_STRING_PREFIX, psig("str.prefixof", 0, [STR, STR], BOOL)],
  [OP_INTERNAL_STRING_SUFFIX, psig("str.suffixof", 0, [STR, STR], BOOL)],
  [OP_INTERNAL_STRING_IN_REGEXP, psig("str.in_re", 0, [STR, RE_T], BOOL)],
  [OP_INTERNAL_STRING_TO_REGEXP, psig("str.to_re", 0, [STR], RE_T)],
  [OP_INTERNAL_REGEXP_EMPTY, psig("re.none", 0, [], RE_T)],
  [OP_INTERNAL_REGEXP_FULL_CHAR, psig("re.allchar", 0, [], RE_T)],
  [OP_INTERNAL_STRING_SUBSTR, psig("str.substr", 0, [STR, INT, INT], STR)],
  [OP_INTERNAL_STRING_POWER, psig("str.power", 0, [STR, INT], STR)],
  [OP_SEQ_MAP, psig("seq.map", 2, [arrayOf(A, B), SEQ_A], SEQ_B)],
  [OP_SEQ_MAPI, psig("seq.mapi", 2, [arrayOf(INT, A, B), INT, SEQ_A], SEQ_B)],
  [OP_SEQ_FOLDL, psig("seq.fold_left", 2, [arrayOf(B, A, B), B, SEQ_A], B)],
  [OP_SEQ_FOLDLI, psig("seq.fold_lefti", 2, [arrayOf(INT, B, A, B), INT, B, SEQ_A], B)],
]);

export const SEQ_OP_NAMES = new Map<string, number>();
for (const [op, sig] of SIGS)
  if (op !== OP_SEQ_MAP && op !== OP_SEQ_MAPI && op !== OP_SEQ_FOLDL && op !== OP_SEQ_FOLDLI)
    if (!SEQ_OP_NAMES.has(sig.name)) SEQ_OP_NAMES.set(sig.name, op);
for (const [name, op] of [
  ["seq.map", OP_SEQ_MAP],
  ["seq.mapi", OP_SEQ_MAPI],
  ["seq.foldl", OP_SEQ_FOLDL],
  ["seq.foldli", OP_SEQ_FOLDLI],
  ["seq.fold_lefti", OP_SEQ_FOLDLI],
  ["seq.fold_left", OP_SEQ_FOLDL],
  ["str.in.re", OP_INTERNAL_STRING_IN_REGEXP],
  ["str.in-re", OP_INTERNAL_STRING_IN_REGEXP],
  ["str.to.re", OP_INTERNAL_STRING_TO_REGEXP],
  ["str.to-re", OP_INTERNAL_STRING_TO_REGEXP],
  ["str.to-int", OP_STRING_STOI],
  ["str.to.int", OP_STRING_STOI],
  ["str.from-int", OP_STRING_ITOS],
  ["int.to.str", OP_STRING_ITOS],
  ["re.nostr", OP_INTERNAL_REGEXP_EMPTY],
  ["re.complement", OP_RE_COMPLEMENT],
  ["str.from_ubv", OP_STRING_UBVTOS],
  ["str.from_sbv", OP_STRING_SBVTOS],
  ["seq.replace_all", OP_SEQ_REPLACE_ALL],
  ["seq.replace_re", OP_SEQ_REPLACE_RE],
  ["seq.replace_re_all", OP_SEQ_REPLACE_RE_ALL],
] as const)
  if (!SEQ_OP_NAMES.has(name)) SEQ_OP_NAMES.set(name, op);

export const CHAR_OP_NAMES = new Map([
  ["char.<=", OP_CHAR_LE],
  ["Char", OP_CHAR_CONST],
  ["char.to_int", OP_CHAR_TO_INT],
  ["char.is_digit", OP_CHAR_IS_DIGIT],
  ["char.to_bv", OP_CHAR_TO_BV],
  ["char.from_bv", OP_CHAR_FROM_BV],
]);

export const SEQ_SORT_NAMES = new Set(["Seq", "RegEx", "RegLan", "String", "StringSequence"]);

const SEQ_VARIANTS = new Map([
  [OP_INTERNAL_STRING_STRREPL, OP_SEQ_REPLACE],
  [OP_INTERNAL_STRING_STRIDOF, OP_SEQ_INDEX],
  [OP_INTERNAL_STRING_PREFIX, OP_SEQ_PREFIX],
  [OP_INTERNAL_STRING_SUFFIX, OP_SEQ_SUFFIX],
  [OP_INTERNAL_STRING_LENGTH, OP_SEQ_LENGTH],
  [OP_INTERNAL_STRING_POWER, OP_SEQ_POWER],
  [OP_INTERNAL_STRING_STRCTN, OP_SEQ_CONTAINS],
  [OP_INTERNAL_STRING_TO_REGEXP, OP_SEQ_TO_RE],
  [OP_INTERNAL_STRING_IN_REGEXP, OP_SEQ_IN_RE],
  [OP_INTERNAL_STRING_CHARAT, OP_SEQ_AT],
  [OP_INTERNAL_STRING_SUBSTR, OP_SEQ_EXTRACT],
]);

const STRING_VARIANTS = new Map([...SEQ_VARIANTS].map(([variant, op]) => [op, variant]));

const getPsig = (op: number) => {
  const sig = SIGS.get(op);
  if (sig === undefined) throw new SmtInvariantError(`the kind ${op} has no signature`);
  return sig;
};

const CHAR_KINDS = new Set(CHAR_OP_NAMES.values());

const formatPattern = (pattern: SortPattern): string => {
  if (pattern.kind === P_VAR) return `k!${pattern.index}`;
  if (pattern.kind === P_INT) return "Int";
  if (pattern.kind === P_BOOL) return "Bool";
  if (pattern.kind === P_STRING) return "String";
  if (pattern.kind === P_REGLAN) return "(RegEx String)";
  const children = pattern.children.map((child) => formatPattern(child)).join(" ");
  return `(${pattern.kind === P_SEQ ? "Seq" : pattern.kind === P_RE ? "RegEx" : "Array"} ${children})`;
};

const matchPattern = (
  manager: AstManager,
  binding: number[],
  sort: number,
  pattern: SortPattern,
): boolean => {
  if (pattern.kind === P_VAR) {
    const bound = binding[pattern.index];
    if (bound !== undefined && bound !== sort) return false;
    binding[pattern.index] = sort;
    return true;
  }
  if (pattern.kind === P_INT) return sort === SORT_INT;
  if (pattern.kind === P_BOOL) return sort === SORT_BOOL;
  if (pattern.kind === P_STRING) return sort === manager.mkStringSort();
  if (pattern.kind === P_REGLAN) return sort === manager.mkReSort(manager.mkStringSort());
  if (pattern.kind === P_SEQ)
    return (
      manager.isSeqSort(sort) &&
      matchPattern(manager, binding, manager.getSeqElementSort(sort), pattern.children[0])
    );
  if (pattern.kind === P_RE)
    return (
      manager.isReSort(sort) &&
      matchPattern(manager, binding, manager.getReSeqSort(sort), pattern.children[0])
    );
  const parameters = manager.isArraySort(sort) ? manager.getSortParameters(sort) : [];
  return (
    parameters.length === pattern.children.length &&
    parameters.every((parameter, index) =>
      matchPattern(manager, binding, parameter, pattern.children[index]),
    )
  );
};

const applyBinding = (
  manager: AstManager,
  binding: number[],
  pattern: SortPattern,
): number | string => {
  if (pattern.kind === P_VAR)
    return binding[pattern.index] ?? "Expecting type parameter to be bound";
  if (pattern.kind === P_INT) return SORT_INT;
  if (pattern.kind === P_BOOL) return SORT_BOOL;
  if (pattern.kind === P_STRING) return manager.mkStringSort();
  if (pattern.kind === P_REGLAN) return manager.mkReSort(manager.mkStringSort());
  const child = applyBinding(manager, binding, pattern.children[0]);
  if (typeof child === "string") return child;
  return pattern.kind === P_SEQ ? manager.mkSeqSort(child) : manager.mkReSort(child);
};

const formatSorts = (manager: AstManager, sorts: readonly number[]) =>
  sorts.map((sort) => `${manager.getSortName(sort)} `).join("");

const formatRange = (manager: AstManager, range: number | undefined) =>
  range === undefined ? "" : ` and range: ${manager.getSortName(range)}`;

const match = (
  manager: AstManager,
  sig: Psig,
  domain: readonly number[],
  range: number | undefined,
): number | string => {
  if (sig.domain.length !== domain.length)
    return `Unexpected number of arguments to '${sig.name}' ${sig.domain.length} arguments expected ${domain.length} given`;
  const binding: number[] = [];
  const isMatch =
    domain.every((sort, index) => matchPattern(manager, binding, sort, sig.domain[index])) &&
    (range === undefined || matchPattern(manager, binding, range, sig.range));
  if (!isMatch)
    return `Sort of polymorphic function '${sig.name}' does not match the declared type. \nGiven domain: ${formatSorts(manager, domain)}${formatRange(manager, range)}\nExpected domain: ${sig.domain
      .map((pattern) => `${formatPattern(pattern)} `)
      .join("")}`;
  if (range === undefined && domain.length === 0)
    return `Sort of polymorphic function '${sig.name}' is ambiguous. Function takes no arguments and sort of range has not been constrained`;
  return applyBinding(manager, binding, sig.range);
};

const matchAssoc = (
  manager: AstManager,
  sig: Psig,
  domain: readonly number[],
  range: number | undefined,
): number | string => {
  if (domain.length === 0)
    return `Unexpected number of arguments to '${sig.name}' at least one argument expected 0 given`;
  const binding: number[] = [];
  const isMatch =
    domain.every((sort) => matchPattern(manager, binding, sort, sig.domain[0])) &&
    (range === undefined || matchPattern(manager, binding, range, sig.range));
  if (!isMatch)
    return `Sort of function '${sig.name}' does not match the declared type. Given domain: ${formatSorts(manager, domain)}${formatRange(manager, range)}`;
  return applyBinding(manager, binding, sig.range);
};

const mkSignature = (
  op: number,
  name: string,
  domain: readonly number[],
  range: number,
  parameters: number[] = [],
  parameterHashes: number[] = parameters,
  associativity = 0,
): SeqSignature => ({
  op,
  name,
  parameters,
  parameterHashes,
  domain: [...domain],
  range,
  associativity,
});

const getSeqFun = (
  manager: AstManager,
  kind: number,
  domain: readonly number[],
  range: number | undefined,
) => {
  const op = SEQ_VARIANTS.get(kind) ?? kind;
  const sorts = op === OP_SEQ_INDEX && domain.length === 2 ? [...domain, SORT_INT] : domain;
  const rng = match(manager, getPsig(kind), sorts, range);
  if (typeof rng === "string") return rng;
  const variant = STRING_VARIANTS.get(op);
  const isString = SEQ_VARIANTS.has(kind) || domain[0] === manager.mkStringSort();
  const name = getPsig(isString && variant !== undefined ? variant : op).name;
  return mkSignature(op, name, domain, rng);
};

const getAssocFun = (
  manager: AstManager,
  kind: number,
  op: number,
  domain: readonly number[],
  range: number | undefined,
  associativity: number,
) => {
  if (domain.length === 0) return "Invalid function application. At least one argument expected";
  const rng = matchAssoc(manager, getPsig(kind), domain, range);
  if (typeof rng === "string") return rng;
  const name =
    op === OP_SEQ_CONCAT && rng === manager.mkStringSort()
      ? getPsig(OP_INTERNAL_STRING_CONCAT).name
      : getPsig(op).name;
  return mkSignature(op, name, [rng, rng], rng, [], [], associativity);
};

const getEmptyReSignature = (
  manager: AstManager,
  kind: number,
  op: number,
  reglanName: string,
  range: number | undefined,
) => {
  const reglan = manager.mkReSort(manager.mkStringSort());
  const rng = range ?? reglan;
  if (rng !== reglan) return mkSignature(op, getPsig(op).name, [], rng);
  const matched = match(manager, getPsig(kind), [], rng);
  return typeof matched === "string" ? matched : mkSignature(op, reglanName, [], matched);
};

const getCharSignature = (
  manager: AstManager,
  kind: number,
  parameters: readonly number[],
  domain: readonly number[],
): SeqSignature | string => {
  const charSort = manager.mkCharSort();
  if (kind === OP_CHAR_LE) {
    if (domain.length !== 2)
      return `incorrect number of arguments passed. Expected 2, received ${domain.length}`;
    if (domain[0] !== charSort)
      return `incorrect first argument type ${manager.getSortName(domain[0])}`;
    if (domain[1] !== charSort)
      return `incorrect second argument type ${manager.getSortName(domain[1])}`;
    return mkSignature(kind, "char.<=", domain, SORT_BOOL);
  }
  if (kind === OP_CHAR_CONST) {
    if (parameters.length !== 1)
      return `incorrect number of parameters passed. Expected 1, received ${parameters.length}`;
    if (domain.length !== 0)
      return `incorrect number of arguments passed. Expected 0, received ${domain.length}`;
    if (parameters[0] < 0) return "non-negative parameter expected";
    if (parameters[0] > MAX_CHAR) return "parameter expected within character range";
    return mkSignature(kind, "Char", [], charSort, [...parameters]);
  }
  if (parameters.length !== 0)
    return `incorrect number of parameters passed. Expected 0, received ${parameters.length}`;
  if (domain.length !== 1)
    return `incorrect number of arguments passed. Expected one character, received ${domain.length}`;
  if (kind === OP_CHAR_TO_INT) return mkSignature(kind, "char.to_int", domain, SORT_INT);
  if (kind === OP_CHAR_IS_DIGIT) return mkSignature(kind, "char.is_digit", domain, SORT_BOOL);
  if (kind === OP_CHAR_TO_BV) {
    if (domain[0] !== charSort) return "expected character sort argument";
    return mkSignature(kind, "char.to_bv", domain, manager.mkBvSort(CHAR_BITS));
  }
  if (!manager.isBvSort(domain[0]) || manager.getBvSize(domain[0]) !== CHAR_BITS)
    return `expected bit-vector sort argument with ${CHAR_BITS}`;
  return mkSignature(kind, "char.from_bv", domain, charSort);
};

export const getSeqSignature = (
  manager: AstManager,
  kind: number,
  parameters: readonly number[],
  domain: readonly number[],
  range?: number,
): SeqSignature | string => {
  if (CHAR_KINDS.has(kind)) return getCharSignature(manager, kind, parameters, domain);
  switch (kind) {
    case OP_SEQ_EMPTY: {
      const rng = match(manager, getPsig(kind), domain, range);
      if (typeof rng === "string") return rng;
      if (rng === manager.mkStringSort()) return getStringConstSignature(manager, []);
      return mkSignature(kind, "seq.empty", domain, rng, [rng], [manager.getSortHash(rng)]);
    }
    case OP_RE_PLUS:
    case OP_RE_STAR:
    case OP_RE_OPTION:
    case OP_RE_RANGE:
    case OP_RE_OF_PRED:
    case OP_RE_COMPLEMENT:
    case OP_RE_REVERSE:
    case OP_RE_DERIVATIVE:
    case OP_SEQ_UNIT:
    case OP_STRING_ITOS:
    case OP_STRING_STOI:
    case OP_STRING_LT:
    case OP_STRING_LE:
    case OP_STRING_IS_DIGIT:
    case OP_STRING_TO_CODE:
    case OP_STRING_FROM_CODE:
    case OP_SEQ_NTH:
    case OP_SEQ_NTH_I:
    case OP_SEQ_NTH_U: {
      const rng = match(manager, getPsig(kind), domain, range);
      return typeof rng === "string" ? rng : mkSignature(kind, getPsig(kind).name, domain, rng);
    }
    case OP_STRING_UBVTOS:
    case OP_STRING_SBVTOS: {
      const name = kind === OP_STRING_UBVTOS ? "str.from_ubv" : "str.from_sbv";
      if (domain.length !== 1 || !manager.isBvSort(domain[0]))
        return `Invalid ${name} expects one bit-vector argument`;
      return mkSignature(kind, name, domain, manager.mkStringSort());
    }
    case OP_INTERNAL_REGEXP_FULL_CHAR:
      return getEmptyReSignature(manager, kind, OP_RE_FULL_CHAR_SET, "re.allchar", range);
    case OP_RE_FULL_CHAR_SET:
      return getEmptyReSignature(manager, kind, OP_RE_FULL_CHAR_SET, "re.allchar", range);
    case OP_INTERNAL_REGEXP_EMPTY:
      return getEmptyReSignature(manager, kind, OP_RE_EMPTY_SET, "re.none", range);
    case OP_RE_EMPTY_SET:
      return getEmptyReSignature(manager, kind, OP_RE_EMPTY_SET, "re.none", range);
    case OP_RE_FULL_SEQ_SET:
      return mkSignature(kind, "re.all", domain, range ?? manager.mkReSort(manager.mkStringSort()));
    case OP_RE_LOOP: {
      const reglan = manager.mkReSort(manager.mkStringSort());
      const message =
        "Incorrect type of arguments passed to re.loop. Expecting regular expression and two integer parameters";
      if (domain.length === 1) {
        const rng = match(manager, getPsig(kind), domain, range);
        if (typeof rng === "string") return rng;
        if (parameters.length === 0 || parameters.length > 2)
          return "Expecting two numeral parameters to function re-loop";
        return mkSignature(kind, "re.loop", domain, rng, [...parameters]);
      }
      if (domain.length === 2 || domain.length === 3) {
        if (domain[0] !== reglan || domain.slice(1).some((sort) => sort !== SORT_INT))
          return message;
        return mkSignature(kind, "re.loop", domain, domain[0], [...parameters]);
      }
      return "Incorrect number of arguments passed to loop. Expected 1 regular expression and two integer parameters";
    }
    case OP_RE_POWER:
      if (parameters.length === 1 && parameters[0] >= 0 && domain.length === 1)
        return mkSignature(kind, "re.^", domain, domain[0], [...parameters]);
      return "Incorrect arguments used for re.^. Expected one non-negative integer parameter";
    case OP_RE_UNION:
    case OP_RE_CONCAT:
    case OP_RE_INTERSECT:
    case OP_RE_DIFF:
    case OP_RE_XOR:
      return getAssocFun(manager, kind, kind, domain, range, -1);
    case OP_SEQ_REPLACE_RE_ALL:
    case OP_SEQ_REPLACE_RE:
    case OP_SEQ_REPLACE_ALL:
    case OP_SEQ_MAP:
    case OP_SEQ_MAPI:
    case OP_SEQ_FOLDL:
    case OP_SEQ_FOLDLI: {
      const rng = match(manager, getPsig(kind), domain, range);
      return typeof rng === "string" ? rng : mkSignature(kind, getPsig(kind).name, domain, rng);
    }
    case OP_SEQ_CONCAT:
      return getAssocFun(manager, kind, OP_SEQ_CONCAT, domain, range, 1);
    case OP_INTERNAL_STRING_CONCAT:
      return getAssocFun(manager, kind, OP_SEQ_CONCAT, domain, range, 1);
    case OP_INTERNAL_STRING_FROM_CHAR:
      if (parameters.length !== 1) return "character literal expects integer parameter";
      if (parameters[0] < 0) return "character literal expects a non-negative integer parameter";
      if (parameters[0] > MAX_CHAR) return "character literal is out of bounds";
      return getStringConstSignature(manager, [parameters[0]]);
    case OP_SEQ_LAST_INDEX:
      if (domain.length !== 2) return "two arguments expected tin last_indexof";
      return getSeqFun(manager, kind, domain, range);
    default:
      return getSeqFun(manager, kind, domain, range);
  }
};

export const getStringConstSignature = (manager: AstManager, chars: readonly number[]) => {
  const id = manager.mkStringValueId(chars);
  return mkSignature(
    OP_STRING_CONST,
    "String",
    [],
    manager.mkStringSort(),
    [id],
    [manager.getStringHash(id)],
  );
};

export const mkSeqAppOf = (manager: AstManager, signature: SeqSignature, args: number[]) => {
  const decl = manager.mkSeqDecl(
    signature.op,
    signature.name,
    signature.parameters,
    signature.parameterHashes,
    signature.domain,
    signature.range,
  );
  if (args.length <= 2 || signature.associativity === 0)
    return manager.mkApp(decl, args, signature.range);
  return signature.associativity < 0
    ? args
        .slice(2)
        .reduce(
          (left, right) => manager.mkApp(decl, [left, right], signature.range),
          manager.mkApp(decl, [args[0], args[1]], signature.range),
        )
    : args
        .slice(0, -2)
        .reduceRight(
          (right, left) => manager.mkApp(decl, [left, right], signature.range),
          manager.mkApp(decl, args.slice(-2), signature.range),
        );
};

export const parseZstring = (text: string): number[] => {
  const bytes = new TextEncoder().encode(text);
  const chars: number[] = [];
  const getHexDigit = (byte: number | undefined) =>
    byte === undefined
      ? -1
      : byte >= 48 && byte <= 57
        ? byte - 48
        : byte >= 65 && byte <= 70
          ? byte - 55
          : byte >= 97 && byte <= 102
            ? byte - 87
            : -1;
  for (let index = 0; index < bytes.length;) {
    if (bytes[index] === 0) break;
    const escape =
      bytes[index] === 92 && bytes[index + 1] === 117
        ? readEscape(bytes, index, getHexDigit)
        : undefined;
    if (escape !== undefined) {
      chars.push(escape.char);
      index = escape.next;
      continue;
    }
    chars.push(bytes[index]);
    index++;
  }
  return chars;
};

const readEscape = (
  bytes: Uint8Array,
  index: number,
  getHexDigit: (byte: number | undefined) => number,
) => {
  if (bytes[index + 2] === 123 && bytes[index + 3] !== 125) {
    let result = 0;
    for (let offset = 0; offset < 6; offset++) {
      const byte = bytes[index + 3 + offset];
      const digit = getHexDigit(byte);
      if (digit >= 0) {
        result = 16 * result + digit;
        continue;
      }
      if (byte !== 125 || result > MAX_CHAR) return undefined;
      return { char: result, next: index + 4 + offset };
    }
    return undefined;
  }
  const digits = [2, 3, 4, 5].map((offset) => getHexDigit(bytes[index + offset]));
  if (digits.some((digit) => digit < 0)) return undefined;
  const result = digits.reduce((value, digit) => 16 * value + digit, 0);
  return result > MAX_CHAR ? undefined : { char: result, next: index + 6 };
};

export const formatZstring = (chars: readonly number[]) => {
  const parts: string[] = [];
  chars.forEach((char, index) => {
    if (char < 32 || char >= 127 || (char === 92 && chars[index + 1] === 117))
      parts.push(`\\u{${char.toString(16)}}`);
    else parts.push(char === 34 ? '""' : String.fromCharCode(char));
  });
  return `"${parts.join("")}"`;
};
