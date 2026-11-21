import {
  SmtDefaultError,
  SmtParseError,
  type SmtPosition,
  SmtUnsupportedError,
} from "../../../errors";
import {
  type AstManager,
  getSymbolHash,
  FAMILY_ARITH,
  FAMILY_BASIC,
  FAMILY_RECFUN,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ABS,
  OP_ADD,
  OP_AND,
  OP_AT_LEAST_K,
  OP_AT_MOST_K,
  OP_PB_EQ,
  OP_PB_GE,
  OP_PB_LE,
  OP_ARRAY_DEFAULT,
  OP_ARRAY_MAP,
  OP_CONST_ARRAY,
  OP_DISTINCT,
  OP_DIV,
  OP_DT_ACCESSOR,
  OP_DT_CONSTRUCTOR,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IMPLIES,
  OP_INT2BV,
  OP_IS_INT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MKBV,
  OP_MOD,
  OP_REM,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_PATTERN,
  OP_POWER,
  OP_POWER0,
  OP_SIN,
  OP_COS,
  OP_TAN,
  OP_ASIN,
  OP_ACOS,
  OP_ATAN,
  OP_SINH,
  OP_COSH,
  OP_TANH,
  OP_ASINH,
  OP_ACOSH,
  OP_ATANH,
  OP_EXP,
  OP_ATAN2,
  OP_LOG,
  OP_SELECT,
  OP_STORE,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_TRUE,
  OP_FALSE,
  OP_UMINUS,
  OP_XOR,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
  isArithSort,
  QUANTIFIER_EXISTS,
  QUANTIFIER_FORALL,
  QUANTIFIER_LAMBDA,
} from "./ast";
import { getArraySignature, getMapSignature, mkAsArray } from "./array-decl-plugin";
import { BV_OP_NAMES, getBvSignature, getMismatchedArgument } from "./bv-decl-plugin";
import {
  type ConstructorDef,
  type DatatypeDef,
  getConstructorAccessors,
  getConstructorIs,
  getConstructorRecognizer,
  getDatatypeConstructors,
  getDatatypeDef,
  instantiateAccessor,
  instantiateConstructor,
  mkDatatypeDef,
  mkDatatypeSort,
  mkDatatypes,
  mkUpdateField,
  removeDatatype,
  resetDatatypePlugin,
  substituteSort,
} from "./datatype-decl-plugin";
import {
  FPA_OP_NAMES,
  FPA_SORT_NAMES,
  getFloatSortError,
  getFpaSignature,
  mkFpaAppOf,
} from "./fpa-decl-plugin";
import { createLogicChecker } from "./check-logic";
import { shrink } from "./array";
import { ObjMap } from "./hashtable";
import {
  CHAR_OP_NAMES,
  getSeqSignature,
  mkSeqAppOf,
  parseZstring,
  SEQ_OP_NAMES,
  SEQ_SORT_NAMES,
} from "./seq-decl-plugin";
import { Rational } from "./rational";
import {
  logicHasArith,
  logicHasArray,
  logicHasBv,
  logicHasFpa,
  logicHasRealsOnly,
  logicHasSeq,
  isSupportedLogic,
} from "./smt-logics";
import { setRecFunDefinition } from "./recfun-decl-plugin";
import { DEFAULT_PRINT_OPTIONS, printExpr } from "./smt2-printer";
import { InvVarShifter } from "./rewriter-tpl";
import { replaceFreeVars, VarSubst } from "./var-subst";
import { UpolynomialManager } from "./nlsat/upolynomial";

export interface ParserOptions {
  isIgnoringBadPatterns: boolean;
  isGlobalDecls: boolean;
}

const DEFAULT_PARSER_OPTIONS: ParserOptions = { isIgnoringBadPatterns: true, isGlobalDecls: false };

// Z3 counts the columns of the first line from 1 and of the others from 0.
export interface SmtToken {
  kind: "(" | ")" | "symbol" | "keyword" | "string" | "numeral" | "decimal" | "bitvector" | "eof";
  text: string;
  line: number;
  column: number;
  offset: number;
  endOffset: number;
  lastId: string;
}

export interface SmtList {
  kind: "list";
  items: SExpr[];
  line: number;
  column: number;
  offset: number;
  lastId: string;
  // Z3 reports an error in making an application at its closing parenthesis.
  end: SmtToken;
  // The token after a root-obj or an indexed or qualified identifier, where Z3 reports an error in
  // making it.
  follower?: SmtToken;
  // The command that a list a command reader read is part of.
  root?: SmtList;
}

export type SExpr = SmtToken | SmtList;

// smt2parser's local: a term, and the number of binders around it where it was bound.
interface Local {
  expr: number;
  level: number;
}

interface ParsedTerm {
  expr: number;
  isOwned: boolean;
  root: SmtList | undefined;
}

interface Macro {
  domain: number[];
  range: number;
  body: number;
}

interface ConstantSortDecl {
  kind: "sort";
  sort: number;
}

interface UserSortDecl {
  kind: "user";
  name: string;
  arity: number;
}

interface DatatypeSortDecl {
  kind: "datatype";
  name: string;
  arity: number;
  siblings: string[];
  instances: Map<string, number>;
}

interface DefinedSortDecl {
  kind: "definition";
  parameters: string[];
  body: SExpr;
}

// Z3's List datatype, which exists when no logic is set, declared here at its first use.
interface ListSortDecl {
  kind: "list";
}

type SortDecl = ConstantSortDecl | UserSortDecl | DatatypeSortDecl | DefinedSortDecl | ListSortDecl;

const NO_BINDINGS: ReadonlyMap<string, number> = new Map();

interface SmtProblem {
  assertions: number[];
  hasCheckSat: boolean;
  rlimit: number;
}

interface QualifiedHead {
  head: SmtToken;
  indices: number[];
  build?: (args: number[]) => number;
}

interface ApplicationFrame extends QualifiedHead {
  kind: "application";
  list: SmtList;
  isTail: boolean;
  start: number;
  next: number;
}

// An application whose head is a term, which selects from the array it stands for.
interface SelectionFrame {
  kind: "selection";
  list: SmtList;
  isTail: boolean;
  start: number;
  next: number;
}

interface LetFrame {
  kind: "let";
  list: SmtList;
  bindings: SmtList;
  names: string[];
  isInDecls: boolean;
  isTail: boolean;
  start: number;
  next: number;
}

interface LetDeclFrame {
  kind: "let-decl";
  list: SmtList;
  next: number;
}

interface QuantifierFrame {
  kind: "quantifier";
  list: SmtList;
  quantifierKind: number;
  names: string[];
  varSorts: number[];
  weight: number;
  qid: string;
  skid: string | undefined;
  isTail: boolean;
  start: number;
  patternStart: number;
  noPatternStart: number;
  next: number;
}

interface AttributeFrame {
  kind: "attribute";
  list: SmtList;
  quantifier: QuantifierFrame | undefined;
  lastKeyword: string;
  isTail: boolean;
  start: number;
  next: number;
}

interface PatternFrame {
  kind: "pattern";
  list: SmtList;
  start: number;
  next: number;
}

interface MatchFrame {
  kind: "match";
  list: SmtList;
  cases: SExpr[];
  isCaseForm: boolean;
  depth: number;
  isTail: boolean;
  start: number;
  next: number;
}

// smt2parser.cpp's expr_frame.
type TermFrame =
  | ApplicationFrame
  | SelectionFrame
  | LetFrame
  | LetDeclFrame
  | QuantifierFrame
  | AttributeFrame
  | PatternFrame
  | MatchFrame;

const QUANTIFIER_KINDS = new Map([
  ["forall", QUANTIFIER_FORALL],
  ["exists", QUANTIFIER_EXISTS],
  ["lambda", QUANTIFIER_LAMBDA],
]);

const LET_MESSAGE = "invalid let declaration, symbol expected";

// The attributes that consume_attributes takes only in the body of a quantifier.
const QUANTIFIER_ATTRIBUTES = new Set([":weight", ":skolemid", ":qid", ":pattern", ":no-pattern"]);

const IS_PARAMETER_MESSAGE =
  "invalid parameter to datatype function arity == 1 && num_parameters == 1 && parameters[0].is_ast() && is_func_decl(parameters[0].get_ast())";

const BUILTIN_OPS = new Map<string, number>([
  ["and", OP_AND],
  ["-", OP_SUB],
  ["or", OP_OR],
  ["not", OP_NOT],
  ["=>", OP_IMPLIES],
  ["xor", OP_XOR],
  ["ite", OP_ITE],
  ["if", OP_ITE],
  ["distinct", OP_DISTINCT],
  ["+", OP_ADD],
  ["*", OP_MUL],
  ["/", OP_DIV],
  ["div", OP_IDIV],
  ["mod", OP_MOD],
  ["rem", OP_REM],
  ["abs", OP_ABS],
  ["to_real", OP_TO_REAL],
  ["to_int", OP_TO_INT],
  ["is_int", OP_IS_INT],
]);

// basic_decl_plugin's aliases, which Z3 knows only when the script sets no logic.
const LOGIC_FREE_ALIASES = new Map([
  ["implies", "=>"],
  ["iff", "="],
  ["if_then_else", "ite"],
  ["&&", "and"],
  ["||", "or"],
  ["equals", "="],
  ["equiv", "="],
]);

// Z3 declares these only without a logic, in ALL or in QF_NTA.
const TRANSCENDENTAL_OPS = new Map([
  ["^", OP_POWER],
  ["^0", OP_POWER0],
  ["sin", OP_SIN],
  ["cos", OP_COS],
  ["tan", OP_TAN],
  ["asin", OP_ASIN],
  ["acos", OP_ACOS],
  ["atan", OP_ATAN],
  ["sinh", OP_SINH],
  ["cosh", OP_COSH],
  ["tanh", OP_TANH],
  ["asinh", OP_ASINH],
  ["acosh", OP_ACOSH],
  ["atanh", OP_ATANH],
  ["exp", OP_EXP],
  ["atan2", OP_ATAN2],
  ["arctan2", OP_ATAN2],
  ["log", OP_LOG],
  ["ln", OP_LOG],
]);
const TRANSCENDENTALS = new Set([
  ...TRANSCENDENTAL_OPS.keys(),
  "pi",
  "euler",
  "/0",
  "div0",
  "mod0",
  "complex.make",
  "complex.real",
  "complex.imag",
]);

const hasTranscendentals = (logic: string | undefined) =>
  logic === undefined || logic === "ALL" || logic === "QF_NTA";

const THEORY_SORTS = new Set([
  "BitVec",
  "Array",
  "Set",
  "Seq",
  "String",
  "StringSequence",
  "RegEx",
  "RegLan",
  "Unicode",
  "FloatingPoint",
  "RoundingMode",
  "Float16",
  "Float32",
  "Float64",
  "Float128",
  "FiniteSet",
  "FiniteField",
  "Complex",
]);
const PB_OP_NAMES = new Map([
  ["at-most", OP_AT_MOST_K],
  ["at-least", OP_AT_LEAST_K],
  ["pble", OP_PB_LE],
  ["pbge", OP_PB_GE],
  ["pbeq", OP_PB_EQ],
]);
const THEORY_OPERATOR = /^(bv|fp\.|str\.|seq\.|re\.|char\.|ff\.)/;
const THEORY_OPERATORS = new Set([
  "bit0",
  "bit1",
  "concat",
  "sign_extend",
  "zero_extend",
  "extract",
  "repeat",
  "rotate_left",
  "rotate_right",
  "ext_rotate_left",
  "ext_rotate_right",
  "bit2bool",
  "ubv_to_int",
  "sbv_to_int",
  "int_to_bv",
  "int2bv",
  "mkbv",
  "store",
  "select",
  "const",
  "map",
  "default",
  "union",
  "intersection",
  "setminus",
  "complement",
  "subset",
  "as-array",
  "choice",
  "array-ext",
  "set-has-size",
  "card",
  "is",
  "update-field",
  "int.to.str",
  "char",
  "fp",
  "to_fp",
  "to_fp_unsigned",
  "to_ieee_bv",
  "+oo",
  "-oo",
  "+zero",
  "-zero",
  "NaN",
  "roundNearestTiesToEven",
  "roundNearestTiesToAway",
  "roundTowardPositive",
  "roundTowardNegative",
  "roundTowardZero",
  "RNE",
  "RNA",
  "RTP",
  "RTN",
  "RTZ",
  "at-most",
  "at-least",
  "pble",
  "pbge",
  "pbeq",
  "linear-order",
  "partial-order",
  "piecewise-linear-order",
  "tree-order",
  "transitive-closure",
]);

// func_decl_info of the builtin declarations: associative to both sides, flat, and associative to
// the left only. => alone is associative to the right only.
const ASSOCIATIVE_OPS = new Set([OP_AND, OP_OR, OP_XOR, OP_ADD, OP_MUL]);
const FLAT_OPS = new Set([OP_AND, OP_OR, OP_ADD, OP_MUL]);
const LEFT_ASSOCIATIVE_OPS = new Set([OP_SUB, OP_DIV, OP_IDIV]);

// arith_decl_plugin's use_coercion.
const COERCING_OPS = new Set([
  OP_ADD,
  OP_SUB,
  OP_UMINUS,
  OP_MUL,
  OP_POWER,
  OP_LE,
  OP_GE,
  OP_LT,
  OP_GT,
]);

const REAL_FUNCTION_OPS = new Set([
  OP_SIN,
  OP_COS,
  OP_TAN,
  OP_ASIN,
  OP_ACOS,
  OP_ATAN,
  OP_SINH,
  OP_COSH,
  OP_TANH,
  OP_ASINH,
  OP_ACOSH,
  OP_ATANH,
  OP_EXP,
  OP_ATAN2,
  OP_LOG,
]);

// The arity of each builtin declaration but distinct, which takes the arguments it is given.
const ARITIES = new Map<number, number>([
  [OP_TRUE, 0],
  [OP_FALSE, 0],
  [OP_ITE, 3],
  ...[OP_NOT, OP_UMINUS, OP_ABS, OP_TO_REAL, OP_TO_INT, OP_IS_INT, ...REAL_FUNCTION_OPS]
    .filter((op) => op !== OP_ATAN2)
    .map((op): [number, number] => [op, 1]),
]);

const RANGES = new Map<number, number>([
  [OP_TO_REAL, SORT_REAL],
  [OP_POWER, SORT_REAL],
  [OP_POWER0, SORT_REAL],
  ...[...REAL_FUNCTION_OPS].map((op): [number, number] => [op, SORT_REAL]),
  [OP_DIV, SORT_REAL],
  [OP_TO_INT, SORT_INT],
  [OP_IDIV, SORT_INT],
  [OP_MOD, SORT_INT],
  [OP_REM, SORT_INT],
  ...[
    OP_EQ,
    OP_DISTINCT,
    OP_AND,
    OP_OR,
    OP_XOR,
    OP_NOT,
    OP_IMPLIES,
    OP_LE,
    OP_GE,
    OP_LT,
    OP_GT,
  ].map((op): [number, number] => [op, SORT_BOOL]),
  [OP_IS_INT, SORT_BOOL],
]);

const CHAINABLE_OPS = new Map<string, number>([
  ["=", OP_EQ],
  ["<=", OP_LE],
  [">=", OP_GE],
  ["<", OP_LT],
  [">", OP_GT],
]);
const CHAINABLE_DECLS = new Set(CHAINABLE_OPS.values());

const BV_EXTENSION_NAMES = new Set([
  "bvumul_noovfl",
  "bvsmul_noovfl",
  "bvsmul_noudfl",
  "bvsdiv0",
  "bvudiv0",
  "bvsrem0",
  "bvurem0",
  "bvsmod0",
  "ext_rotate_left",
  "ext_rotate_right",
  "int2bv",
  "bv2int",
  "bv2nat",
  "mkbv",
]);

const BV_EXTENSION_LOGICS = new Set(["ALL", "QF_FD", "HORN"]);

const ARRAY_SORT_NAMES = new Set(["Array", "=>", "->"]);

// array_decl_plugin::get_op_names: select and store in every logic with arrays, the others only
// without a logic or in HORN and ALL.
const ARRAY_OPS = new Map([
  ["select", OP_SELECT],
  ["store", OP_STORE],
]);
const ARRAY_EXTENSION_OPS = new Map([["default", OP_ARRAY_DEFAULT]]);

const isPortedTheoryOperator = (name: string) =>
  BV_OP_NAMES.has(name) ||
  FPA_OP_NAMES.has(name) ||
  SEQ_OP_NAMES.has(name) ||
  CHAR_OP_NAMES.has(name) ||
  ARRAY_OPS.has(name) ||
  ARRAY_EXTENSION_OPS.has(name);

const UNARY_BOOL_REFS = new Map([["not", OP_NOT]]);
const BINARY_BOOL_REFS = new Map([
  ["and", OP_AND],
  ["or", OP_OR],
  ["=>", OP_IMPLIES],
  ["xor", OP_XOR],
]);

const REAL_RANGE_OPS = new Set([OP_DIV, OP_TO_REAL]);
const INT_RANGE_OPS = new Set([OP_IDIV, OP_MOD, OP_REM, OP_TO_INT]);
const DOMAIN_RANGE_OPS = new Set([OP_ADD, OP_SUB, OP_MUL, OP_ABS]);

// mk_func_decl of a builtin ignores the range of the reference and gives its own.
const getBuiltinRange = (op: number, domain: number[]) =>
  op === OP_ITE
    ? domain[1]
    : REAL_RANGE_OPS.has(op)
      ? SORT_REAL
      : INT_RANGE_OPS.has(op)
        ? SORT_INT
        : DOMAIN_RANGE_OPS.has(op)
          ? domain[0]
          : SORT_BOOL;

interface MappedDecl {
  decl: number;
  domain: readonly number[];
  range: number;
}
const ARRAY_EXTENSION_LOGICS = new Set(["HORN", "ALL"]);

// arith_decl_plugin::get_sort_names gives these logics no Int.
const INT_FREE_LOGICS = new Set(["NRA", "QF_NRA", "QF_NTA", "QF_UFNRA"]);

const BUILTIN_NAMES = new Set([
  "true",
  "false",
  "~",
  ...BV_OP_NAMES.keys(),
  ...CHAINABLE_OPS.keys(),
  ...BUILTIN_OPS.keys(),
  ...LOGIC_FREE_ALIASES.keys(),
  ...TRANSCENDENTALS,
  ...THEORY_OPERATORS,
  ...SEQ_OP_NAMES.keys(),
  ...CHAR_OP_NAMES.keys(),
]);

const FOLLOWED_HEADS = new Set(["root-obj", "_", "as"]);

const FF_LITERAL = /^#f-?[0-9]+m[0-9]+$/;
const FF_LOGICS = new Set(["QF_FF", "QF_FFA", "ALL", "HO_ALL"]);

// rational::is_unsigned of a numeral token.
export const isUnsigned = (numeral: string) =>
  BigInt(numeral) >= 0n && BigInt(numeral) <= 0xffffffffn;

const SYMBOL_CHARACTER = /[A-Za-z0-9~!@$%^&*_\-+=<>.?/,]/;

const createScanner = (text: string) => {
  // Z3 prints the null symbol its scanner starts with as null.
  const state = { index: 0, line: 1, lineStart: -1, lastId: "null", tokenColumn: 0 };
  const getColumn = () => state.index - state.lineStart - (state.line === 1 ? 0 : 1);
  const advance = () => {
    if (text[state.index] === "\n") {
      state.line++;
      state.lineStart = state.index;
    }
    state.index++;
  };
  const readWhile = (pattern: RegExp) => {
    while (state.index < text.length && pattern.test(text[state.index])) advance();
  };
  const next = (): SmtToken | undefined => {
    for (;;) {
      state.tokenColumn = getColumn();
      const character = text[state.index];
      if (character === undefined) return undefined;
      if (character === ";") {
        while (state.index < text.length && text[state.index] !== "\n") advance();
        continue;
      }
      if (character === " " || character === "\t" || character === "\r" || character === "\n") {
        advance();
        continue;
      }
      const start = state.index;
      const position = { line: state.line, column: state.tokenColumn };
      const getToken = (kind: SmtToken["kind"], tokenText = text.slice(start, state.index)) => {
        if (kind === "symbol" || kind === "keyword") state.lastId = tokenText;
        return {
          kind,
          text: tokenText,
          ...position,
          offset: start,
          endOffset: state.index,
          lastId: state.lastId,
        };
      };
      if (character === "(" || character === ")") {
        advance();
        return getToken(character);
      }
      if (character === "|" || character === '"') {
        advance();
        for (;;) {
          if (state.index >= text.length)
            throw new SmtParseError(
              character === "|" ? "unexpected end of quoted symbol" : "unexpected end of string",
              { line: state.line, column: getColumn() },
            );
          const current = text[state.index];
          if (character === "|" && current === "\\")
            throw new SmtParseError("invalid character '\\' in quoted symbol", {
              line: state.line,
              column: getColumn(),
            });
          advance();
          // Z3's scanner starts the line before it reads past a newline in a quoted symbol or a
          // string, so the columns of the rest of the line count one more.
          if (current === "\n") state.lineStart--;
          if (current !== character) continue;
          // Z3's scanner rereads the last character at the end of the file, as if the quote were doubled.
          if (character === '"' && state.index === text.length)
            throw new SmtParseError("unexpected end of file", position);
          if (character !== '"' || text[state.index] !== '"') break;
          advance();
        }
        const inner = text.slice(start + 1, state.index - 1);
        return character === "|"
          ? getToken("symbol", inner)
          : getToken("string", inner.replaceAll('""', '"'));
      }
      if (/[0-9]/.test(character) || (character === "-" && /[0-9]/.test(text[start + 1] ?? ""))) {
        advance();
        readWhile(/[0-9]/);
        if (text[state.index] !== ".") return getToken("numeral");
        advance();
        readWhile(/[0-9]/);
        return getToken("decimal");
      }
      if (character === "#") {
        advance();
        const radix = text[state.index];
        if (radix === "|") {
          advance();
          while (state.index < text.length) {
            const current = text[state.index];
            advance();
            if (current !== "|" || text[state.index] !== "#") continue;
            advance();
            break;
          }
          continue;
        }
        if (radix !== "f" && radix !== "x" && radix !== "b")
          throw new SmtParseError("invalid bit-vector literal, expecting 'x' or 'b'", {
            line: state.line,
            column: getColumn(),
          });
        advance();
        const digitsStart = state.index;
        readWhile(radix === "f" ? /[0-9m-]/ : radix === "x" ? /[0-9a-fA-F]/ : /[01]/);
        if (state.index === digitsStart && radix !== "f")
          throw new SmtParseError("invalid empty bit-vector literal", {
            line: state.line,
            column: getColumn(),
          });
        // Z3's scanner rereads the last digit at the end of the file.
        if (state.index === text.length && state.index !== digitsStart)
          throw new SmtParseError("unexpected end of file", position);
        return getToken(radix === "f" ? "symbol" : "bitvector");
      }
      if (character === ":" || SYMBOL_CHARACTER.test(character)) {
        advance();
        readWhile(SYMBOL_CHARACTER);
        return getToken(character === ":" ? "keyword" : "symbol");
      }
      advance();
      throw new SmtParseError("unexpected character", position);
    }
  };
  return {
    next,
    getPosition: () => ({ line: state.line, column: getColumn() }),
    getTokenPosition: () => ({ line: state.line, column: state.tokenColumn }),
    getLastId: () => state.lastId,
  };
};

export const createCommandReader = (text: string) => {
  const scanner = createScanner(text);
  const state: { lookahead: SmtToken | undefined; depth: number } = {
    lookahead: undefined,
    depth: 0,
  };
  const take = () => {
    const token = state.lookahead ?? scanner.next();
    state.lookahead = undefined;
    return token;
  };
  const readList = (open: SmtToken): SmtList => {
    const stack: SmtList[] = [];
    const root: SmtList = {
      kind: "list",
      items: [],
      line: open.line,
      column: open.column,
      offset: open.offset,
      lastId: open.lastId,
      end: open,
    };
    let followed: SmtList | undefined;
    for (let current = root; ;) {
      const token = take();
      if (token === undefined) {
        // Z3 parses a command as it reads it, and sees the end of the file where it wants a token.
        const eof: SmtToken = {
          kind: "eof",
          text: "",
          ...scanner.getPosition(),
          offset: text.length,
          endOffset: text.length,
          lastId: scanner.getLastId(),
        };
        if (followed !== undefined) followed.follower = eof;
        current.items.push(eof);
        const end = { ...eof };
        current.end = end;
        for (const list of stack) list.end = end;
        return root;
      }
      if (followed !== undefined) followed.follower = token;
      followed = undefined;
      if (token.kind === "(") {
        const list: SmtList = {
          kind: "list",
          items: [],
          line: token.line,
          column: token.column,
          offset: token.offset,
          lastId: token.lastId,
          end: token,
          root,
        };
        current.items.push(list);
        stack.push(current);
        state.depth++;
        current = list;
        continue;
      }
      if (token.kind !== ")") {
        current.items.push(token);
        continue;
      }
      current.end = token;
      if (isSymbol(current.items[0]) && FOLLOWED_HEADS.has(current.items[0].text))
        followed = current;
      state.depth--;
      const parent = stack.pop();
      if (parent === undefined) return root;
      current = parent;
    }
  };
  const readOpen = () => {
    const token = take();
    if (token === undefined) return undefined;
    if (token.kind !== "(") throw new SmtParseError("invalid command, '(' expected", token);
    state.depth = 1;
    return token;
  };
  const read = () => {
    const open = readOpen();
    return open === undefined ? undefined : readList(open);
  };
  const readSExpr = () => {
    const token = take();
    if (token === undefined)
      throw new SmtParseError(
        "invalid s-expression, unexpected end of file",
        scanner.getPosition(),
      );
    if (token.kind === ")") throw new SmtParseError("invalid s-expression, unexpected ')'", token);
    const sexpr = token.kind === "(" ? readList(token) : token;
    expectClosed(sexpr);
    // Z3 scans one token past the s-expression.
    state.lookahead = take();
    return sexpr;
  };
  // parse_cmd checks the head of a command before it reads the rest.
  const readCommand = () => {
    const open = readOpen();
    if (open === undefined) return undefined;
    state.lookahead = take();
    if (!isSymbol(state.lookahead))
      throw new SmtParseError(
        "invalid command, symbol expected",
        state.lookahead ?? scanner.getPosition(),
      );
    return readList(open);
  };
  const skip = (report: (error: SmtParseError) => void) => {
    for (;;) {
      try {
        const token = take();
        if (token === undefined) return;
        if (token.kind === "(" && state.depth === 0) {
          state.lookahead = token;
          return;
        }
        if (token.kind === "(") state.depth++;
        if (token.kind === ")") state.depth = Math.max(0, state.depth - 1);
      } catch (error) {
        if (!(error instanceof SmtParseError)) throw error;
        report(error);
      }
    }
  };
  return { read, readCommand, readSExpr, skip, getTokenPosition: scanner.getTokenPosition };
};

export const expectClosed = (sexpr: SExpr) => {
  const end = sexpr.kind === "list" ? sexpr.end : sexpr;
  if (end.kind === "eof")
    throw new SmtParseError("invalid s-expression, unexpected end of file", end);
};

export const isSymbol = (sexpr: SExpr | undefined, text?: string): sexpr is SmtToken =>
  sexpr !== undefined && sexpr.kind === "symbol" && (text === undefined || sexpr.text === text);

const isSimpleIndex = (index: SExpr) =>
  index.kind === "numeral" ||
  index.kind === "bitvector" ||
  index.kind === "decimal" ||
  index.kind === "keyword";

const expectList = (sexpr: SExpr | undefined, message: string, at: SExpr): SmtList => {
  if (sexpr?.kind !== "list") throw new SmtParseError(message, sexpr ?? at);
  return sexpr;
};

const expectListNext = (sexpr: SExpr, message: string) => {
  if (sexpr.kind !== "list") throw new SmtParseError(`${message} got ${sexpr.lastId}`, sexpr);
  return sexpr;
};

const expectSymbol = (sexpr: SExpr | undefined, message: string, at: SExpr): SmtToken => {
  if (!isSymbol(sexpr)) throw new SmtParseError(message, sexpr ?? at);
  return sexpr;
};

const expectEnd = (extra: SExpr | undefined, message: string) => {
  if (extra !== undefined) throw new SmtParseError(message, extra);
};

export const createSmtlibReader = (
  manager: AstManager,
  logic?: string,
  options: ParserOptions = DEFAULT_PARSER_OPTIONS,
) => {
  const hasArith = logic === undefined || logicHasArith(logic);
  const hasBv = logic === undefined || logicHasBv(logic);
  const logicChecker = createLogicChecker(manager, logic);
  const sortDecls = new Map<string, SortDecl>([
    ["Bool", { kind: "sort", sort: SORT_BOOL }],
    ...(hasArith && !(logic !== undefined && INT_FREE_LOGICS.has(logic))
      ? [["Int", { kind: "sort", sort: SORT_INT }] as const]
      : []),
    ...(hasArith ? [["Real", { kind: "sort", sort: SORT_REAL }] as const] : []),
    ...(logic === undefined ? [["List", { kind: "list" }] as const] : []),
  ]);
  const funcs = new Map<string, readonly number[]>();
  const macros = new Map<string, Macro>();
  // A pop empties the macros of a name but keeps the name in the dictionary.
  const macroNames: string[] = [];
  const dictionaryNames = new Set<string>();
  const macroDictionary = new ObjMap<string>((index) => getSymbolHash(macroNames[index]));
  const lastNamed = { name: "", expr: -1 };
  const notifiedSorts = new Set<number>();
  const undo: (() => void)[] = [];
  const scopeStarts: number[] = [];
  // smt2parser's m_env, a scoped symbol table: one map, and the trail of what each scope shadowed.
  const locals = new Map<string, Local>();
  const shadowedNames: string[] = [];
  const shadowedLocals: (Local | undefined)[] = [];
  const localScopes: number[] = [];
  const binders = { depth: 0 };
  // smt2parser's expr_stack, pattern_stack and nopattern_stack, which hold a reference to each term.
  // -1 on the first stands for a pattern that Z3 ignores.
  const exprStack: number[] = [];
  const patternStack: number[] = [];
  const noPatternStack: number[] = [];
  // The term that parseTerm returns leaves the stack before its caller takes a reference. One that
  // only the stack held keeps a reference in pending until a term of another command is parsed, and
  // one that nothing held, in floating or, where its command is not known, in unrooted, gets one
  // there when another term is parsed while its caller may still read it.
  const parsed: ParsedTerm = { expr: -1, isOwned: false, root: undefined };
  const floating: number[] = [];
  const unrooted: number[] = [];
  const pending: number[] = [];

  const scopedFuncs: number[] = [];
  const scopedFuncStarts: number[] = [];
  const scopedMacros: number[] = [];
  const scopedMacroStarts: number[] = [];
  // cmd_context's std_subst and rev_subst, whose caches live until their next substitution.
  const stdSubst = new VarSubst(manager, true);
  const revSubst = new VarSubst(manager, false);
  let macroAppExpr = -1;

  const pushUndo = (restore: () => void) => {
    if (!options.isGlobalDecls) undo.push(restore);
  };

  const declare = <Value>(names: Map<string, Value>, name: string, value: Value) => {
    const previous = names.get(name);
    pushUndo(() => {
      if (previous === undefined) names.delete(name);
      else names.set(name, previous);
    });
    names.set(name, value);
  };

  const declareFunc = (name: string, decls: readonly number[], decl: number) => {
    declare(funcs, name, [...decls, decl]);
    if (!options.isGlobalDecls) scopedFuncs.push(decl);
  };

  const insertMacro = (name: string, macro: Macro) => {
    if (!dictionaryNames.has(name)) {
      dictionaryNames.add(name);
      macroDictionary.set(macroNames.push(name) - 1, name);
    }
    declare(macros, name, macro);
  };

  const hasArrays = logic === undefined || logicHasArray(logic);
  const hasFpa = logic === undefined || logicHasFpa(logic);
  const hasArrayExtensions = logic === undefined || ARRAY_EXTENSION_LOGICS.has(logic);
  const hasSeq = logic === undefined || logicHasSeq(logic);
  const restricted = {
    isNumeralAsReal: logic !== undefined && logicHasRealsOnly(logic),
    hasSetSort: hasArrayExtensions,
    hasFf: logic === undefined || FF_LOGICS.has(logic),
  };

  const getFirstFunc = (name: string) => funcs.get(name)?.[0];

  // func_decls::signatures_collide: the domain, and the range unless it is -1.
  const hasSignature = (decl: number, domain: readonly number[], range: number) =>
    (range === -1 || manager.funcDecls[decl].range === range) &&
    manager.funcDecls[decl].domain.length === domain.length &&
    manager.funcDecls[decl].domain.every((sort, index) => sort === domain[index]);

  const checkDecl = (decl: number, at: SExpr) => {
    const error = logicChecker.checkDecl(decl);
    if (error !== undefined) throw new SmtParseError(error, at);
  };

  const insertFunc = (decl: number, at: SExpr) => {
    checkDecl(decl, at);
    const funcDecl = manager.funcDecls[decl];
    const name = String(funcDecl.name);
    if (macros.has(name))
      throw new SmtParseError(
        `invalid declaration, named expression already defined with this name ${name}`,
        at,
      );
    const existing = funcs.get(name) ?? [];
    if (existing.includes(decl))
      throw new SmtParseError(
        `invalid declaration, ${funcDecl.domain.length === 0 ? "constant" : "function"} '${name}' (with the given signature) already declared`,
        at,
      );
    declareFunc(name, existing, decl);
  };

  const insertDatatypeDecls = (sort: number, at: SExpr) => {
    for (const constructor of getDatatypeConstructors(manager, sort)) {
      insertFunc(constructor, at);
      insertFunc(getConstructorRecognizer(manager, constructor), at);
      for (const accessor of getConstructorAccessors(manager, constructor))
        insertFunc(accessor, at);
    }
  };

  const notifyDatatype = (sort: number, at: SExpr) => {
    const parameters = manager.getSortParameters(sort);
    if (parameters.length === 0 || notifiedSorts.has(sort)) return;
    if (getDatatypeDef(manager, sort) === undefined) return;
    if (parameters.every((parameter) => manager.getTypeParameterIndex(parameter) === -1))
      insertDatatypeDecls(sort, at);
    notifiedSorts.add(sort);
    pushUndo(() => notifiedSorts.delete(sort));
  };

  const getDatatypeInstance = (decl: DatatypeSortDecl, parameters: number[], at: SExpr) => {
    const key = parameters.join(",");
    const sort = decl.instances.get(key) ?? mkDatatypeSort(manager, decl.name, parameters);
    decl.instances.set(key, sort);
    notifyDatatype(sort, at);
    return sort;
  };

  const instantiateDatatype = (decl: DatatypeSortDecl, parameters: number[], at: SExpr) => {
    const sort = getDatatypeInstance(decl, parameters, at);
    const def = getDatatypeDef(manager, sort);
    if (def === undefined || parameters.length === 0 || decl.siblings.length === 0) return sort;
    const marked = new Set([sort]);
    for (const constructor of def.constructors)
      for (const accessor of constructor.accessors) {
        const range = accessor.range;
        if (!manager.isDatatypeSort(range) || marked.has(range)) continue;
        marked.add(range);
        const sibling = sortDecls.get(manager.sortNames[range]);
        if (sibling?.kind !== "datatype" || !decl.siblings.includes(sibling.name)) continue;
        const instance = substituteSort(manager, range, def.parameters, parameters);
        getDatatypeInstance(sibling, [...manager.getSortParameters(instance)], at);
      }
    return sort;
  };

  const getSortDeclArity = (decl: SortDecl) =>
    decl.kind === "sort"
      ? 0
      : decl.kind === "list"
        ? 1
        : decl.kind === "definition"
          ? decl.parameters.length
          : decl.arity;

  const registerList = () => {
    const element = manager.mkTypeParameter(0);
    mkDatatypes(manager, [
      mkDatatypeDef(
        manager,
        "List",
        [element],
        [
          { name: "nil", recognizer: "is-nil", accessors: [] },
          {
            name: "insert",
            recognizer: "is-insert",
            accessors: [
              { name: "head", range: element },
              { name: "tail", range: -1 },
            ],
          },
        ],
      ),
    ]);
    const list: DatatypeSortDecl = {
      kind: "datatype",
      name: "List",
      arity: 1,
      siblings: [],
      instances: new Map(),
    };
    sortDecls.set("List", list);
    return list;
  };

  const instantiateSort = (decl: SortDecl, parameters: number[], at: SExpr): number => {
    if (decl.kind === "sort") return decl.sort;
    if (decl.kind === "list") return instantiateSort(registerList(), parameters, at);
    if (decl.kind === "user") return manager.mkUninterpretedSort(decl.name, parameters);
    if (decl.kind === "datatype") return instantiateDatatype(decl, parameters, at);
    return parseSort(
      decl.body,
      "",
      new Map(decl.parameters.map((name, index) => [name, parameters[index]])),
    );
  };

  const parseParametricSort = (
    sexpr: SmtList,
    context: string,
    bindings: ReadonlyMap<string, number>,
  ): number => {
    const head = sexpr.items[0];
    if (!isSymbol(head))
      throw new SmtParseError(
        `${context === "" ? "" : `${context} `}invalid sort, symbol or '_' expected`,
        head ?? sexpr.end,
      );
    const isArray =
      ARRAY_SORT_NAMES.has(head.text) || (head.text === "Set" && restricted.hasSetSort);
    if (isArray && hasArrays) {
      const parameters = sexpr.items.slice(1).map((item) => parseSort(item, context, bindings));
      if (head.text === "Set" ? parameters.length !== 1 : parameters.length < 2)
        throw new SmtParseError(
          "invalid array sort definition, invalid number of parameters",
          sexpr.end,
        );
      return manager.mkArraySort(head.text === "Set" ? [parameters[0], SORT_BOOL] : parameters);
    }
    const decl = sortDecls.get(head.text);
    if (decl === undefined && hasSeq && (head.text === "Seq" || head.text === "RegEx")) {
      const parameters = sexpr.items.slice(1).map((item) => parseSort(item, context, bindings));
      if (parameters.length !== 1)
        throw new SmtParseError(
          head.text === "Seq"
            ? "Invalid sequence sort, expecting one parameter"
            : "Invalid regex sort, expecting one parameter",
          sexpr.end,
        );
      return head.text === "Seq"
        ? manager.mkSeqSort(parameters[0])
        : manager.mkReSort(parameters[0]);
    }
    if (decl === undefined && hasFpa && FPA_SORT_NAMES.has(head.text)) {
      const parameters = sexpr.items.slice(1).map((item) => parseSort(item, context, bindings));
      if (head.text === "FloatingPoint") return mkFloatSort([], sexpr);
      if (parameters.length > 0)
        throw new SmtUnsupportedError("parameters on a floating-point sort");
      return parseSort(head, context, bindings);
    }
    if (decl === undefined) {
      if (THEORY_SORTS.has(head.text) && !isLackingSort(head.text))
        throw new SmtUnsupportedError(`the sort ${head.text}`);
      throw new SmtParseError(`unknown sort '${head.text}'`, head);
    }
    const parameters = sexpr.items.slice(1).map((item) => parseSort(item, context, bindings));
    if (parameters.length !== getSortDeclArity(decl))
      throw new SmtParseError("invalid number of parameters to sort constructor", sexpr.end);
    return instantiateSort(decl, parameters, sexpr);
  };

  // parse_psort: Z3 makes the leaves and the indexed sorts of a sort definition, and an application
  // of a builtin sort, which takes any number of parameters, only when the definition is used.
  const checkPsort = (sexpr: SExpr, bindings: ReadonlyMap<string, number>) => {
    const head = sexpr.kind === "list" ? sexpr.items[0] : undefined;
    if (
      head === undefined ||
      !isSymbol(head) ||
      head.text === "_" ||
      sortDecls.has(head.text) ||
      !isBuiltinParametricSort(head.text)
    ) {
      parseSort(sexpr, "", bindings);
      return;
    }
    for (const item of (sexpr as SmtList).items.slice(1)) checkPsort(item, bindings);
  };

  // Z3 does not know the sorts of a theory that the logic lacks.
  const isLackingSort = (name: string) =>
    name === "Set"
      ? !hasArrays || !restricted.hasSetSort
      : ARRAY_SORT_NAMES.has(name)
        ? !hasArrays
        : name === "BitVec"
          ? !hasBv
          : SEQ_SORT_NAMES.has(name) || name === "Unicode"
            ? !hasSeq
            : FPA_SORT_NAMES.has(name) && !hasFpa;

  const isBuiltinParametricSort = (name: string) =>
    (hasArrays && (ARRAY_SORT_NAMES.has(name) || (name === "Set" && restricted.hasSetSort))) ||
    (hasSeq && (name === "Seq" || name === "RegEx")) ||
    (hasFpa && FPA_SORT_NAMES.has(name));

  const mkFloatSort = (indices: SExpr[], at: SExpr) => {
    const ebitsIndex = indices[0];
    const sbitsIndex = indices[1];
    if (indices.length !== 2 || ebitsIndex.kind !== "numeral" || sbitsIndex.kind !== "numeral")
      throw new SmtParseError(
        "expecting two integer parameters to floating point sort (ebits, sbits)",
        at.kind === "list" ? at.end : at,
      );
    const ebits = Number(ebitsIndex.text);
    const sbits = Number(sbitsIndex.text);
    const error = getFloatSortError(ebits, sbits);
    if (error !== undefined) throw new SmtParseError(error, at.kind === "list" ? at.end : at);
    return manager.mkFpSort(ebits, sbits);
  };

  const parseSort = (
    sexpr: SExpr,
    context: string,
    bindings: ReadonlyMap<string, number> = NO_BINDINGS,
  ): number => {
    if (sexpr.kind === ")")
      throw new SmtParseError(`${context} invalid sort, unexpected ')'`, sexpr);
    if (sexpr.kind === "list") {
      if (!isSymbol(sexpr.items[0], "_")) return parseParametricSort(sexpr, context, bindings);
      // parse_indexed_sort.
      const name = sexpr.items[1];
      if (!isSymbol(name))
        throw new SmtParseError("invalid indexed sort, symbol expected", name ?? sexpr.end);
      if (hasFpa && name.text === "FloatingPoint") return mkFloatSort(sexpr.items.slice(2), sexpr);
      const indices = sexpr.items.slice(2);
      if (isLackingSort(name.text) || !(THEORY_SORTS.has(name.text) || sortDecls.has(name.text)))
        throw new SmtParseError(`unknown sort '${name.text}'`, indices[0] ?? sexpr.end);
      if (name.text !== "BitVec") throw new SmtUnsupportedError("indexed sorts");
      for (const index of indices) {
        if (index.kind !== "numeral")
          throw new SmtParseError("invalid indexed sort, integer or ')' expected", index);
        if (!isUnsigned(index.text))
          throw new SmtParseError(
            "invalid indexed identifier, index is too big to fit in an unsigned machine integer",
            index,
          );
      }
      const width = indices[0];
      if (indices.length !== 1 || width.kind !== "numeral")
        throw new SmtParseError("expecting one integer parameter to bit-vector sort", sexpr.end);
      if (BigInt(width.text) === 0n)
        throw new SmtParseError("bit-vector size must be greater than zero", sexpr.end);
      return manager.mkBvSort(Number(width.text));
    }
    if (sexpr.kind !== "symbol")
      throw new SmtParseError(
        `invalid sort, symbol, '_' or '(' expected got ${sexpr.lastId}`,
        sexpr,
      );
    const decl = sortDecls.get(sexpr.text);
    if (decl !== undefined) {
      if (getSortDeclArity(decl) !== 0)
        throw new SmtParseError("sort constructor expects parameters", sexpr);
      return instantiateSort(decl, [], sexpr);
    }
    const bound = bindings.get(sexpr.text);
    if (bound !== undefined) return bound;
    if (hasSeq && (SEQ_SORT_NAMES.has(sexpr.text) || sexpr.text === "Unicode")) {
      if (sexpr.text === "String" || sexpr.text === "StringSequence") return manager.mkStringSort();
      if (sexpr.text === "RegLan") return manager.mkReSort(manager.mkStringSort());
      if (sexpr.text === "Unicode") return manager.mkCharSort();
      throw new SmtParseError(
        sexpr.text === "Seq"
          ? "Invalid sequence sort, expecting one parameter"
          : "Invalid regex sort, expecting one parameter",
        sexpr,
      );
    }
    if (hasFpa && FPA_SORT_NAMES.has(sexpr.text)) {
      if (sexpr.text === "RoundingMode") return manager.mkRmSort();
      const bits = FPA_SORT_NAMES.get(sexpr.text);
      return bits === undefined ? mkFloatSort([], sexpr) : manager.mkFpSort(bits[0], bits[1]);
    }
    if (THEORY_SORTS.has(sexpr.text) && !isLackingSort(sexpr.text))
      throw new SmtUnsupportedError(`the sort ${sexpr.text}`);
    throw new SmtParseError(
      `${context === "" ? "" : `${context}: `}unknown sort '${sexpr.text}'`,
      sexpr,
    );
  };

  const beginScope = () => localScopes.push(shadowedNames.length);

  const insertLocal = (name: string, expr: number) => {
    shadowedNames.push(name);
    shadowedLocals.push(locals.get(name));
    locals.set(name, { expr, level: binders.depth });
  };

  const endScope = () => {
    const start = localScopes.pop() ?? 0;
    for (let index = shadowedNames.length - 1; index >= start; index--) {
      const shadowed = shadowedLocals[index];
      if (shadowed === undefined) locals.delete(shadowedNames[index]);
      else locals.set(shadowedNames[index], shadowed);
    }
    shrink(shadowedNames, start);
    shrink(shadowedLocals, start);
  };

  const pushRef = (stack: number[], expr: number) => {
    if (expr !== -1) manager.incRef(expr);
    stack.push(expr);
  };

  // ref_vector::shrink, which releases from the new end on.
  const shrinkRefs = (stack: number[], size: number) => {
    for (let index = size; index < stack.length; index++)
      if (stack[index] !== -1) manager.decRef(stack[index]);
    shrink(stack, size);
  };

  const releasePending = () => {
    for (const expr of pending) manager.decRef(expr);
    shrink(pending, 0);
  };

  const protect = (exprs: number[]) => {
    for (const expr of exprs)
      if (manager.ids[expr] !== -1 && manager.getRefCount(expr) === 0) pushRef(pending, expr);
    shrink(exprs, 0);
  };

  // The parser's var_shifter, whose cache holds the terms it makes, which replaceFreeVars rebuilds.
  const shiftFreeVars = (expr: number, amount: number) =>
    manager.kinds[expr] === KIND_VAR
      ? manager.mkVar(manager.values[expr] + amount, manager.sorts[expr])
      : replaceFreeVars(manager, expr, (variable, index, shift) =>
          manager.mkVar(index + shift + amount, manager.sorts[variable]),
        );

  const getLocalTerm = (local: Local) =>
    local.level === binders.depth
      ? local.expr
      : shiftFreeVars(local.expr, binders.depth - local.level);

  // basic_decl_plugin::join.
  const getJoin = (left: number, right: number, at: SExpr) => {
    if (left === right) return left;
    if (isArithSort(left) && isArithSort(right)) return left === SORT_REAL ? left : right;
    if (left === SORT_BOOL && isArithSort(right)) return right;
    if (right === SORT_BOOL && isArithSort(left)) return left;
    throw new SmtParseError(
      `Sorts ${manager.getSortName(left)} and ${manager.getSortName(right)} are incompatible`,
      at,
    );
  };

  const getJoinOfArgs = (args: number[], at: SExpr) =>
    args.reduce((join, arg) => getJoin(join, manager.sorts[arg], at), manager.sorts[args[0]]);

  // basic_decl_plugin::mk_func_decl and arith_decl_plugin::mk_func_decl: the sort of the arguments
  // that the declaration takes, the condition of ite aside, or -1 where the plugin makes none.
  const getDomainSort = (op: number, args: number[], at: SExpr) => {
    if (op === OP_ITE)
      return args.length === 3 ? getJoin(manager.sorts[args[1]], manager.sorts[args[2]], at) : -1;
    if (op === OP_EQ) return args.length >= 2 ? getJoinOfArgs(args, at) : -1;
    if (op === OP_DISTINCT) return args.length === 0 ? SORT_BOOL : getJoinOfArgs(args, at);
    if (manager.funcDecls[op].family === FAMILY_BASIC) return SORT_BOOL;
    if (COERCING_OPS.has(op))
      return args.some((arg) => manager.sorts[arg] === SORT_REAL) ? SORT_REAL : SORT_INT;
    if (op === OP_DIV || op === OP_IS_INT || REAL_FUNCTION_OPS.has(op)) return SORT_REAL;
    if (op === OP_IDIV || op === OP_MOD || op === OP_REM) return SORT_INT;
    return manager.sorts[args[0]] === SORT_REAL ? SORT_REAL : SORT_INT;
  };

  // ast_manager::coerce_to.
  const coerce = (arg: number, sort: number) => {
    const argSort = manager.sorts[arg];
    if (argSort === sort || !isArithSort(sort)) return arg;
    if (isArithSort(argSort))
      return sort === SORT_REAL
        ? manager.mkApp(OP_TO_REAL, [arg], SORT_REAL)
        : manager.mkApp(OP_TO_INT, [arg], SORT_INT);
    if (argSort !== SORT_BOOL) return arg;
    const one = manager.mkNumeralOfSort(Rational.of(1n), sort);
    return manager.mkApp(OP_ITE, [arg, one, manager.mkNumeralOfSort(Rational.of(0n), sort)], sort);
  };

  // A declaration of the script has its own domain, and a builtin one takes domainSort.
  const getArity = (decl: number, numArgs: number, domainSort: number) =>
    domainSort === -1
      ? manager.funcDecls[decl].domain.length
      : decl === OP_DISTINCT
        ? numArgs
        : (ARITIES.get(decl) ?? 2);

  const getExpectedSort = (decl: number, index: number, domainSort: number) =>
    domainSort === -1
      ? manager.funcDecls[decl].domain[index]
      : decl === OP_ITE && index === 0
        ? SORT_BOOL
        : domainSort;

  const formatDecl = (decl: number, numArgs: number, domainSort: number) => {
    const domain = Array.from({ length: getArity(decl, numArgs, domainSort) }, (_unused, index) =>
      manager.getSortName(getExpectedSort(decl, index, domainSort)),
    );
    const range =
      domainSort === -1 ? manager.funcDecls[decl].range : (RANGES.get(decl) ?? domainSort);
    return `(declare-fun ${String(manager.funcDecls[decl].name)} (${domain.join(" ")}) ${manager.getSortName(range)})`;
  };

  // ast_manager::mk_app_core: coercion_needed, coerce_to and check_args.
  const mkAppCore = (decl: number, args: number[], at: SExpr, domainSort: number) => {
    const isAssociative = domainSort !== -1 && ASSOCIATIVE_OPS.has(decl);
    const isCoercing =
      (isAssociative || getArity(decl, args.length, domainSort) === args.length) &&
      args.some((arg, index) => {
        const expected = getExpectedSort(decl, index, domainSort);
        return isArithSort(expected) && expected !== manager.sorts[arg];
      });
    const coerced = isCoercing
      ? args.map((arg, index) => coerce(arg, getExpectedSort(decl, index, domainSort)))
      : args;
    for (let index = 0; index < coerced.length; index++) {
      const sort = manager.sorts[coerced[index]];
      if (sort !== getExpectedSort(decl, index, domainSort))
        throw new SmtParseError(
          `Sort mismatch at argument #${index + 1} for function ${formatDecl(decl, args.length, domainSort)} supplied sort is ${manager.getSortName(sort)}`,
          at,
        );
    }
    // Z3 keeps xor, / and div of fewer than two arguments until its rewriters make false or the
    // argument of them, which those of this port do not.
    if (
      coerced.length < 2 &&
      domainSort !== -1 &&
      (decl === OP_XOR || LEFT_ASSOCIATIVE_OPS.has(decl))
    )
      return coerced[0] ?? manager.falseExpr;
    return manager.mkApp(
      decl,
      coerced,
      domainSort === -1 ? manager.funcDecls[decl].range : (RANGES.get(decl) ?? domainSort),
    );
  };

  // ast_manager::mk_app.
  const mkApp = (decl: number, args: number[], at: SExpr, domainSort = -1): number => {
    const isBuiltin = domainSort !== -1;
    const isAssociative = isBuiltin && ASSOCIATIVE_OPS.has(decl);
    const isLeftAssociative = isAssociative || (isBuiltin && LEFT_ASSOCIATIVE_OPS.has(decl));
    const isRightAssociative = isAssociative || (isBuiltin && decl === OP_IMPLIES);
    const isChainable = isBuiltin && CHAINABLE_DECLS.has(decl);
    if (
      getArity(decl, args.length, domainSort) !== args.length &&
      ((!isLeftAssociative && !isRightAssociative && !isChainable) ||
        (args.length < 2 && manager.funcDecls[decl].family === FAMILY_BASIC && !isAssociative))
    ) {
      const environment = { options: DEFAULT_PRINT_OPTIONS, isUsed, isClashing };
      // Z3 prints an error without the newlines that end it.
      throw new SmtParseError(
        `Wrong number of arguments (${args.length}) passed to function ${formatDecl(decl, args.length, domainSort)} ${args
          .map((arg) => `\narg: ${printExpr(manager, environment, arg)}\n`)
          .join("")}`.replace(/\n+$/, ""),
        at,
      );
    }
    if (args.length === 1 && isChainable) return manager.trueExpr;
    if (args.length <= 2 || (isBuiltin && FLAT_OPS.has(decl)))
      return mkAppCore(decl, args, at, domainSort);
    if (isRightAssociative)
      return args
        .slice(0, -2)
        .reduceRight(
          (right, left) => mkAppCore(decl, [left, right], at, domainSort),
          mkAppCore(decl, args.slice(-2), at, domainSort),
        );
    if (isLeftAssociative)
      return args
        .slice(2)
        .reduce(
          (left, right) => mkAppCore(decl, [left, right], at, domainSort),
          mkAppCore(decl, args.slice(0, 2), at, domainSort),
        );
    if (!isChainable) return mkAppCore(decl, args, at, domainSort);
    const pairs: number[] = [];
    for (let index = 1; index < args.length; index++)
      pairs.push(mkAppCore(decl, [args[index - 1], args[index]], at, domainSort));
    return mkApp(OP_AND, pairs, at, SORT_BOOL);
  };

  // ast_manager::mk_pattern.
  const mkPattern = (terms: number[], at: SExpr) => {
    if (terms.some((term) => manager.kinds[term] !== KIND_APP))
      throw new SmtParseError("patterns cannot be variables or quantifiers", at);
    return manager.mkPattern(terms);
  };

  const isValidPattern = (pattern: number, numDecls: number) => {
    const found = new Set<number>();
    const isValid = (expr: number): boolean => {
      const kind = manager.kinds[expr];
      if (kind === KIND_QUANTIFIER) return false;
      if (kind === KIND_VAR) {
        if (manager.values[expr] < numDecls) found.add(manager.values[expr]);
        return true;
      }
      const funcDecl = manager.funcDecls[manager.decls[expr]];
      if (
        funcDecl.family === FAMILY_BASIC &&
        funcDecl.op !== OP_EQ &&
        funcDecl.op !== OP_TRUE &&
        funcDecl.op !== OP_FALSE
      )
        return false;
      return manager.everyArg(expr, isValid);
    };
    return manager.everyArg(pattern, isValid) && found.size === numDecls;
  };

  // parse_sorted_vars: the variables are created the first declared with the largest index, and
  // the stack holds them.
  const bindSortedVars = (sexpr: SExpr | undefined, at: SExpr) => {
    if (sexpr?.kind !== "list")
      throw new SmtParseError(
        `invalid list of sorted variables, '(' expected got ${(sexpr ?? at).lastId}`,
        sexpr ?? at,
      );
    const names: string[] = [];
    const varSorts: number[] = [];
    for (const declaration of sexpr.items) {
      if (declaration.kind !== "list")
        throw new SmtParseError(
          `invalid sorted variable, '(' expected got ${declaration.lastId}`,
          declaration,
        );
      const name = declaration.items[0];
      if (!isSymbol(name))
        throw new SmtParseError(
          "invalid sorted variable, symbol expected",
          name ?? declaration.end,
        );
      names.push(name.text);
      varSorts.push(parseSort(declaration.items[1] ?? declaration.end, "invalid sorted variables"));
      const extra = declaration.items[2];
      if (extra !== undefined)
        throw new SmtParseError(`invalid sorted variable, ')' expected got ${extra.lastId}`, extra);
    }
    beginScope();
    binders.depth += varSorts.length;
    for (const [index, sort] of varSorts.entries()) {
      const boundVar = manager.mkVar(varSorts.length - 1 - index, sort);
      pushRef(exprStack, boundVar);
      insertLocal(names[index], boundVar);
    }
    return { names, varSorts };
  };

  const unbindSortedVars = (count: number) => {
    endScope();
    binders.depth -= count;
  };

  // pop_quant_frame, up to the quantifier.
  const mkParsedQuantifier = (frame: QuantifierFrame) => {
    const list = frame.list;
    const numDecls = frame.varSorts.length;
    if (exprStack.length - frame.start !== numDecls + 1)
      throw new SmtParseError(
        "invalid quantified expression, syntax error: (forall|exists ((<symbol> <sort>)*) <expr>) expected",
        list.end,
      );
    let numKept = frame.patternStart;
    for (let index = frame.patternStart; index < patternStack.length; index++) {
      const pattern = patternStack[index];
      if (!isValidPattern(pattern, numDecls)) {
        if (!options.isIgnoringBadPatterns) throw new SmtParseError("invalid pattern", list.end);
        continue;
      }
      manager.incRef(pattern);
      manager.decRef(patternStack[numKept]);
      patternStack[numKept] = pattern;
      numKept++;
    }
    shrinkRefs(patternStack, numKept);
    const body = exprStack[exprStack.length - 1];
    if (frame.quantifierKind !== QUANTIFIER_LAMBDA && manager.sorts[body] !== SORT_BOOL)
      throw new SmtParseError("quantifier body must be a Boolean expression", list.end);
    if (patternStack.length > frame.patternStart && noPatternStack.length > frame.noPatternStart)
      throw new SmtParseError("simultaneous patterns and no-patterns not supported", list.end);
    return manager.mkQuantifier({
      kind: frame.quantifierKind,
      sorts: frame.varSorts,
      names: frame.names,
      body,
      patterns: patternStack.slice(frame.patternStart),
      noPatterns: noPatternStack.slice(frame.noPatternStart),
      weight: frame.weight,
      qid: frame.qid,
      ...(frame.skid === undefined ? {} : { skid: frame.skid }),
    });
  };

  const isBvOpName = (name: string) =>
    hasBv &&
    BV_OP_NAMES.has(name) &&
    (!BV_EXTENSION_NAMES.has(name) || logic === undefined || BV_EXTENSION_LOGICS.has(logic));

  const mkBvApp = (name: string, args: number[], indices: number[], at: SExpr) => {
    const op = BV_OP_NAMES.get(name) ?? -1;
    const argSorts = args.map((arg) => manager.sorts[arg]);
    if (op !== OP_INT2BV && op !== OP_MKBV && (args.length === 0 || !manager.isBvSort(argSorts[0])))
      throw new SmtParseError("operator is applied to arguments of the wrong sort", at);
    const signature = getBvSignature(manager, op, argSorts, indices);
    if (typeof signature === "string") throw new SmtParseError(signature, at);
    const mismatched = getMismatchedArgument(signature, argSorts);
    if (mismatched !== -1)
      throw new SmtParseError(
        `Argument ${printExpr(manager, { options: DEFAULT_PRINT_OPTIONS, isUsed, isClashing }, args[mismatched])} at position ${mismatched} has sort ${manager.getSortName(argSorts[mismatched])} it does not match declaration (declare-fun ${signature.name} (${signature.domain.map((sort) => manager.getSortName(sort)).join(" ")}) ${manager.getSortName(signature.range)})`,
        at,
      );
    const decl = manager.mkBvDecl(op, signature.name, indices, signature.domain, signature.range);
    return manager.mkApp(decl, args, signature.range);
  };

  const isFpaOpName = (name: string) => hasFpa && FPA_OP_NAMES.has(name);

  // pb_decl_plugin::get_op_names and mk_func_decl.
  const isPbOpName = (name: string) =>
    PB_OP_NAMES.has(name) &&
    (logic === undefined || logic === "QF_FD" || logic === "ALL" || logic === "HORN");

  const mkPbTerm = (name: string, args: number[], parameters: Rational[], at: SExpr) => {
    const op = PB_OP_NAMES.get(name) ?? -1;
    if (args.some((arg) => manager.sorts[arg] !== SORT_BOOL))
      throw new SmtParseError("invalid non-Boolean sort applied to Pseudo-Boolean relation", at);
    const isCardinality = op === OP_AT_MOST_K || op === OP_AT_LEAST_K;
    if (isCardinality && parameters.length !== 1)
      throw new SmtParseError("function expects one non-negative integer parameter", at);
    if (!isCardinality && parameters.length !== 1 + args.length)
      throw new SmtParseError("function expects arity+1 rational parameters", at);
    const decl = manager.mkPbDecl(
      op,
      parameters,
      args.map(() => SORT_BOOL),
    );
    return manager.mkApp(decl, args, SORT_BOOL);
  };

  const mkFpaTerm = (name: string, args: number[], indices: number[], at: SExpr) => {
    const op = FPA_OP_NAMES.get(name) ?? -1;
    const getSignature = (innerArgs: number[]) => {
      const signature = getFpaSignature(
        manager,
        op,
        indices,
        innerArgs.map((arg) => manager.sorts[arg]),
      );
      if (typeof signature === "string") throw new SmtParseError(signature, at);
      return signature;
    };
    const signature = getSignature(args);
    if (signature.domain.length === args.length) return mkFpaAppOf(manager, signature, args);
    const pairs: number[] = [];
    for (let index = 0; index + 1 < args.length; index++) {
      const pair = [args[index], args[index + 1]];
      pairs.push(mkFpaAppOf(manager, getSignature(pair), pair));
    }
    return mkApp(OP_AND, pairs, at, SORT_BOOL);
  };

  const isSeqOpName = (name: string) =>
    hasSeq && (SEQ_OP_NAMES.has(name) || CHAR_OP_NAMES.has(name));

  const mkSeqTerm = (
    name: string,
    args: number[],
    indices: number[],
    at: SExpr,
    range?: number,
  ) => {
    const signature = getSeqSignature(
      manager,
      SEQ_OP_NAMES.get(name) ?? CHAR_OP_NAMES.get(name) ?? -1,
      indices,
      args.map((arg) => manager.sorts[arg]),
      range,
    );
    if (typeof signature === "string") throw new SmtParseError(signature, at);
    return mkSeqAppOf(manager, signature, args);
  };

  const upolynomials = new UpolynomialManager(manager.limit);

  const parseUpolynomial = (sexpr: SExpr): bigint[] => {
    if (sexpr.kind === "numeral") return upolynomials.set([BigInt(sexpr.text)]);
    if (sexpr.kind === "decimal") {
      const value = Rational.fromDecimal(sexpr.text);
      if (!value.isInt())
        throw new SmtParseError(
          "invalid univariate polynomial, integer coefficient expected",
          sexpr,
        );
      return upolynomials.set([value.num]);
    }
    if (sexpr.kind === "symbol") {
      if (sexpr.text !== "x")
        throw new SmtParseError("invalid univariate polynomial, variable 'x' expected", sexpr);
      return [0n, 1n];
    }
    if (sexpr.kind !== "list")
      throw new SmtParseError("invalid univariate polynomial, unexpected ", sexpr);
    const head = sexpr.items[0];
    if (!isSymbol(head))
      throw new SmtParseError("invalid univariate polynomial, symbol expected", sexpr);
    const operands = sexpr.items.slice(1);
    if (head.text === "^") {
      if (operands.length !== 2)
        throw new SmtParseError(
          "invalid univariate polynomial, '^' operator expects two arguments",
          sexpr,
        );
      const exponent = operands[1];
      if (exponent.kind !== "numeral" || BigInt(exponent.text) > 0xffffffffn)
        throw new SmtParseError(
          "invalid univariate polynomial, exponent must be an unsigned integer",
          exponent,
        );
      return upolynomials.pw(parseUpolynomial(operands[0]), Number(exponent.text));
    }
    const combine =
      head.text === "+"
        ? upolynomials.add
        : head.text === "-"
          ? upolynomials.sub
          : head.text === "*"
            ? upolynomials.mul
            : undefined;
    if (combine === undefined)
      throw new SmtParseError(
        "invalid univariate polynomial, '+', '-', '^' or '*' expected",
        sexpr,
      );
    if (operands.length === 0)
      throw new SmtParseError(
        `invalid univariate polynomial, '${head.text}' operator expects at least one argument`,
        sexpr,
      );
    const first = parseUpolynomial(operands[0]);
    if (head.text === "-" && operands.length === 1) return upolynomials.neg(first);
    return operands
      .slice(1)
      .reduce(
        (result, operand) => combine.call(upolynomials, result, parseUpolynomial(operand)),
        first,
      );
  };

  const parseRootObj = (list: SmtList) => {
    const polynomial = list.items[1] ?? list.end;
    const index = list.items[2] ?? list.end;
    if (index.kind !== "numeral")
      throw new SmtParseError("invalid root-obj, (unsigned) integer expected", index);
    if (BigInt(index.text) > 0xffffffffn)
      throw new SmtParseError(
        "invalid root-obj, index must fit in an unsigned machine integer",
        index,
      );
    if (BigInt(index.text) === 0n)
      throw new SmtParseError("invalid root-obj, index must be >= 1", index);
    if (list.items.length > 3)
      throw new SmtParseError(
        `invalid root-obj, ')' expected got ${list.items[3].lastId}`,
        list.items[3],
      );
    const coeffs = parseUpolynomial(polynomial);
    const follower = list.follower ?? list.end;
    if (coeffs.length === 0)
      throw new SmtParseError(
        "invalid root object, polynomial must not be the zero polynomial",
        follower,
      );
    const roots = manager.am.isolateUnivariateRoots(coeffs);
    const root = roots[Number(index.text) - 1];
    if (root === undefined)
      throw new SmtParseError(
        "invalid root object, polynomial does have sufficient roots",
        follower,
      );
    return manager.mkAlgebraicNumeral(root);
  };

  const isKnownOperator = (name: string) => BUILTIN_NAMES.has(name) || THEORY_OPERATOR.test(name);

  // parse_indexed_identifier_core.
  const getIndexedName = (list: SmtList) => {
    const name = list.items[1];
    if (!isSymbol(name))
      throw new SmtParseError("invalid indexed identifier, symbol expected", name ?? list.end);
    for (const index of list.items.slice(2)) {
      if (index.kind === "string" || index.kind === "eof")
        throw new SmtParseError(
          "invalid indexed identifier, integer, identifier or '(' expected",
          index,
        );
      // parse_func_decl_ref of an index that is a symbol.
      if (
        index.kind === "symbol" &&
        name.text !== "is" &&
        !isUsed(index.text) &&
        !macros.has(index.text)
      )
        throw new SmtParseError(
          `invalid function declaration reference, unknown function ${index.text}`,
          index,
        );
    }
    return name;
  };

  // parse_qualified_identifier_core on (as <identifier> <sort>), up to the sort.
  const parseQualifierSort = (list: SmtList) => {
    const target = list.items[1];
    if (target === undefined || (target.kind !== "symbol" && target.kind !== "list"))
      throw new SmtParseError(
        `invalid (indexed) identifier, '(_' or symbol expected got ${(target ?? list.end).lastId}`,
        target ?? list.end,
      );
    if (target.kind === "list") {
      if (!isSymbol(target.items[0], "_"))
        throw new SmtParseError(
          "invalid indexed identifier, '_' expected",
          target.items[0] ?? target.end,
        );
      getIndexedName(target);
    }
    const sort = parseSort(list.items[2] ?? list.end, "Invalid qualified identifier");
    const extra = list.items[3];
    if (extra !== undefined)
      throw new SmtParseError(
        `invalid qualified identifier, ')' expected got ${extra.lastId}`,
        extra,
      );
    return sort;
  };

  // parse_qualified_name on (_ <symbol> <index>*). Z3 makes the term once it has read past the
  // closing parenthesis, where at is.
  const parseIndexedTerm = (list: SmtList, at: SExpr, range?: number) => {
    const name = getIndexedName(list);
    const indices = list.items.slice(2);
    const local = locals.get(name.text);
    if (local !== undefined) {
      if (indices.length > 0)
        throw new SmtParseError("invalid indexed identifier, symbol is a local declaration", at);
      return getLocalTerm(local);
    }
    const value = /^bv([0-9]+)$/.exec(name.text);
    if (value !== null) {
      const width = indices[0];
      const digits =
        indices.length !== 1
          ? "-1"
          : width.kind === "bitvector"
            ? `0${width.text.slice(1)}`
            : width.kind === "numeral"
              ? width.text
              : "-1";
      if (!isUnsigned(digits))
        throw new SmtParseError("invalid bit-vector constant, index expected", at);
      if (BigInt(digits) === 0n)
        throw new SmtParseError("bit-vector size must be greater than zero", at);
      return manager.mkBvNumeral(BigInt(value[1]), Number(BigInt(digits)));
    }
    const isNumbered = indices.every((index) => index.kind === "numeral");
    if (isNumbered && isSeqOpName(name.text))
      return mkSeqTerm(
        name.text,
        [],
        indices.map((index) => (index.kind === "list" ? 0 : Number(index.text))),
        at,
      );
    if (isNumbered && isFpaOpName(name.text)) {
      const signature = getFpaSignature(
        manager,
        FPA_OP_NAMES.get(name.text) ?? -1,
        indices.map((index) => (index.kind === "list" ? 0 : Number(index.text))),
        [],
      );
      if (typeof signature === "string") throw new SmtParseError(signature, at);
      return mkFpaAppOf(manager, signature, []);
    }
    if (isKnownOperator(name.text) || !indices.every(isSimpleIndex))
      throw new SmtUnsupportedError("indexed identifiers");
    return parseApp(name, [], at, [], range);
  };

  // parse_qualified_name.
  const parseQualifiedName = (list: SmtList) => {
    const at = list.follower ?? list.end;
    if (isSymbol(list.items[0], "_")) return parseIndexedTerm(list, at);
    const sort = parseQualifierSort(list);
    const target = list.items[1];
    const local = isSymbol(target) ? locals.get(target.text) : undefined;
    if (isSymbol(target) && local === undefined && hasArrays && target.text === "const")
      return mkArrayTerm(OP_CONST_ARRAY, [], [sort], at);
    // A macro takes no range, so check_qualifier catches the sort of the term it stands for.
    const term =
      local !== undefined
        ? getLocalTerm(local)
        : isSymbol(target)
          ? parseApp(target, [], at, [], sort)
          : parseIndexedTerm(
              expectList(target, "invalid indexed identifier, '_' expected", list),
              at,
              sort,
            );
    if (manager.sorts[term] !== sort)
      throw new SmtParseError(
        `sort mismatch in qualified identifier, expected: ${manager.getSortName(sort)}, got: ${manager.getSortName(manager.sorts[term])}`,
        at,
      );
    return term;
  };

  const mkArrayTerm = (op: number, inputArgs: number[], parameters: number[], at: SExpr) => {
    const signature = getArraySignature(
      manager,
      op,
      inputArgs.map((arg) => manager.sorts[arg]),
      parameters,
    );
    if (typeof signature === "string") throw new SmtParseError(signature, at);
    const args = inputArgs.map((arg, index) => coerce(arg, signature.domain[index]));
    const decl = manager.mkArrayDecl(
      op,
      signature.name,
      parameters,
      signature.domain,
      signature.range,
    );
    return manager.mkApp(decl, args, signature.range);
  };

  const findFuncDecl = (sexpr: SmtToken) => {
    const decls = funcs.get(sexpr.text);
    if (decls !== undefined && decls.length > 1)
      throw new SmtParseError(
        `ambiguous function declaration reference, provide full signature to disambiguate (<symbol> (<sort>*) <sort>) ${sexpr.text}`,
        sexpr,
      );
    return decls?.[0];
  };

  const throwAmbiguousConstant = (name: string, at: SExpr) => {
    throw new SmtParseError(
      `ambiguous constant reference, more than one constant with the same sort, use a qualified expression (as <symbol> <sort>) to disambiguate ${name}`,
      at,
    );
  };

  // An exact signature wins, else the last one that matches once Int and Real coerce.
  const mkDeclaredApp = (
    name: string,
    decls: readonly number[],
    args: number[],
    range: number | undefined,
    at: SExpr,
  ) => {
    if (args.length === 0 && range === undefined) {
      if (decls.length > 1) throwAmbiguousConstant(name, at);
      return manager.funcDecls[decls[0]].domain.length > 0
        ? mkAsArray(manager, decls[0])
        : mkApp(decls[0], args, at);
    }
    const argSorts = args.map((arg) => manager.sorts[arg]);
    const candidates = decls.filter(
      (decl) =>
        (range === undefined || manager.funcDecls[decl].range === range) &&
        manager.funcDecls[decl].domain.length === args.length &&
        manager.funcDecls[decl].domain.every(
          (sort, index) =>
            sort === argSorts[index] || (isArithSort(sort) && isArithSort(argSorts[index])),
        ),
    );
    const found = candidates.find((decl) => hasSignature(decl, argSorts, -1)) ?? candidates.at(-1);
    if (found !== undefined) return mkApp(found, args, at);
    if (args.length === 0 || range !== undefined) return undefined;
    if (decls.length > 1) throwAmbiguousConstant(name, at);
    const array = manager.funcDecls[decls[0]];
    if (array.domain.length > 0 || !manager.isArraySort(array.range)) return undefined;
    const parameters = manager.getSortParameters(array.range);
    if (
      parameters.length !== args.length + 1 ||
      argSorts.some((sort, index) => sort !== parameters[index])
    )
      return undefined;
    return mkArrayTerm(OP_SELECT, [mkApp(decls[0], [], at), ...args], [], at);
  };

  const mkDatatypeInstanceApp = (name: string, args: number[], at: SExpr) => {
    const argSorts = args.map((arg) => manager.sorts[arg]);
    for (const def of manager.datatypeDefs.values())
      for (const [index, constructor] of def.constructors.entries()) {
        if (constructor.name !== name || constructor.accessors.length !== args.length) continue;
        const binding: number[] = [];
        const isMatch = constructor.accessors.every((accessor, position) => {
          if (accessor.range === argSorts[position]) return true;
          const parameter = manager.getTypeParameterIndex(accessor.range);
          if (parameter === -1) return false;
          if (binding[parameter] !== undefined && binding[parameter] !== argSorts[position])
            return false;
          binding[parameter] = argSorts[position];
          return true;
        });
        if (
          !isMatch ||
          binding.length !== def.parameters.length ||
          !def.parameters.every((_parameter, parameter) => binding[parameter] !== undefined)
        )
          continue;
        return mkApp(instantiateConstructor(manager, def, index, binding), args, at);
      }
    if (args.length !== 1 || !manager.isDatatypeSort(argSorts[0])) return undefined;
    for (const def of manager.datatypeDefs.values())
      for (const [index, constructor] of def.constructors.entries()) {
        const position = constructor.accessors.findIndex((accessor) => accessor.name === name);
        if (position === -1) continue;
        const sort = mkDatatypeSort(manager, def.name, [...manager.getSortParameters(argSorts[0])]);
        return mkApp(instantiateAccessor(manager, sort, index, position), args, at);
      }
    return undefined;
  };

  const mkIsApp = (constructorName: SmtToken, args: number[], at: SExpr) => {
    const declared = findFuncDecl(constructorName);
    // datatype::decl::plugin::mk_is.
    if (declared !== undefined) {
      if (args.length !== 1) throw new SmtParseError(IS_PARAMETER_MESSAGE, at);
      if (!manager.isDatatypeSort(manager.sorts[args[0]]))
        throw new SmtParseError(
          "invalid parameter to datatype function u().is_datatype(domain[0])",
          at,
        );
      if (manager.sorts[args[0]] !== manager.funcDecls[declared].range)
        throw new SmtParseError("invalid sort argument passed to recognizer", at);
      if (manager.funcDecls[declared].op !== OP_DT_CONSTRUCTOR)
        throw new SmtParseError("expecting constructor argument to recognizer", at);
      return manager.mkApp(getConstructorIs(manager, declared), args, SORT_BOOL);
    }
    const argSort = args.length === 1 ? manager.sorts[args[0]] : -1;
    if (argSort === -1 || !manager.isDatatypeSort(argSort))
      throw new SmtParseError(IS_PARAMETER_MESSAGE, at);
    const constructors = (() => {
      try {
        return getDatatypeConstructors(manager, argSort);
      } catch (error) {
        if (!(error instanceof SmtDefaultError)) throw error;
        throw new SmtParseError(error.message, at);
      }
    })();
    const constructor = constructors.find(
      (decl) => manager.funcDecls[decl].name === constructorName.text,
    );
    if (constructor === undefined)
      throw new SmtParseError(
        `invalid datatype recognizer, unknown constructor ${constructorName.text}`,
        at,
      );
    return mkApp(getConstructorIs(manager, constructor), args, at);
  };

  const mkUpdateFieldApp = (accessorName: SmtToken, args: number[], at: SExpr) => {
    const accessor = findFuncDecl(accessorName);
    if (accessor === undefined)
      throw new SmtParseError(
        `invalid function declaration reference, unknown function ${accessorName.text}`,
        accessorName,
      );
    // datatype::decl::plugin::mk_update_field.
    if (args.length !== 2)
      throw new SmtParseError("invalid number of arguments for datatype field update", at);
    const funcDecl = manager.funcDecls[accessor];
    if (funcDecl.op !== OP_DT_ACCESSOR)
      throw new SmtParseError(
        "datatype field update requires a datatype accessor as the second argument",
        at,
      );
    if (funcDecl.domain[0] !== manager.sorts[args[0]])
      throw new SmtParseError("first argument to field update should be a data-type", at);
    if (funcDecl.range !== manager.sorts[args[1]])
      throw new SmtParseError(
        `second argument to field update should be ${manager.getSortName(funcDecl.range)} instead of ${manager.getSortName(manager.sorts[args[1]])}`,
        at,
      );
    return manager.mkApp(mkUpdateField(manager, accessor), args, funcDecl.domain[0]);
  };

  const getUnknownConstantMessage = (name: string, args: number[], range: number | undefined) => {
    const argSorts =
      args.length === 0
        ? ""
        : ` (${args.map((arg) => manager.getSortName(manager.sorts[arg])).join(" ")}) `;
    const declared = (funcs.get(name) ?? []).map((decl) => {
      const domain = manager.funcDecls[decl].domain.map((sort) => manager.getSortName(sort));
      return `\ndeclared: (declare-fun ${name} (${domain.join(" ")}) ${manager.getSortName(manager.funcDecls[decl].range)}) `;
    });
    return `unknown constant ${name}${argSorts}${range === undefined ? "" : `${manager.getSortName(range)} `}${declared.join("")}`;
  };

  const parseFuncDeclRef = (sexpr: SExpr): MappedDecl => {
    if (sexpr.kind === "symbol") {
      const decl = findFuncDecl(sexpr);
      if (decl !== undefined) return { decl, ...manager.funcDecls[decl] };
      const unary = UNARY_BOOL_REFS.get(sexpr.text);
      if (unary !== undefined) return { decl: unary, domain: [SORT_BOOL], range: SORT_BOOL };
      const binary = BINARY_BOOL_REFS.get(sexpr.text);
      if (binary !== undefined)
        return { decl: binary, domain: [SORT_BOOL, SORT_BOOL], range: SORT_BOOL };
      throw new SmtUnsupportedError(`the declaration reference ${sexpr.text}`);
    }
    const name = sexpr.kind === "list" ? sexpr.items[0] : undefined;
    const domainList = sexpr.kind === "list" ? sexpr.items[1] : undefined;
    const rangeSort = sexpr.kind === "list" ? sexpr.items[2] : undefined;
    if (!isSymbol(name) || domainList?.kind !== "list" || rangeSort === undefined)
      throw new SmtUnsupportedError("the declaration reference");
    const domain = domainList.items.map((item) => parseSort(item, "Invalid function name"));
    const range = parseSort(rangeSort, "Invalid function name");
    const declared = funcs.get(name.text)?.find((decl) => hasSignature(decl, domain, range));
    if (declared !== undefined) return { decl: declared, domain, range };
    const builtin = CHAINABLE_OPS.get(name.text) ?? BUILTIN_OPS.get(name.text);
    if (builtin === undefined)
      throw new SmtUnsupportedError(`the declaration reference ${name.text}`);
    return { decl: builtin, domain, range: getBuiltinRange(builtin, domain) };
  };

  const mkMapTerm = (mapped: MappedDecl, args: number[], at: SExpr) => {
    const signature = getMapSignature(
      manager,
      mapped,
      args.map((arg) => manager.sorts[arg]),
    );
    if (typeof signature === "string") throw new SmtParseError(signature, at);
    const decl = manager.mkArrayDecl(
      OP_ARRAY_MAP,
      signature.name,
      [mapped.decl],
      signature.domain,
      signature.range,
    );
    return manager.mkApp(decl, args, signature.range);
  };

  const getArrayOp = (name: string) =>
    hasArrays
      ? (ARRAY_OPS.get(name) ?? (hasArrayExtensions ? ARRAY_EXTENSION_OPS.get(name) : undefined))
      : undefined;

  const parseApp = (
    head: SmtToken,
    args: number[],
    at: SExpr,
    indices: number[] = [],
    range?: number,
  ) => {
    const name = head.text;
    // A bound variable applied to arguments selects from the array it stands for, one at a time.
    const local = locals.get(name);
    if (args.length > 0 && local !== undefined)
      return args.reduce(
        (array, arg) => mkArrayTerm(OP_SELECT, [array, arg], [], at),
        getLocalTerm(local),
      );
    if (indices.length > 0)
      return isFpaOpName(name)
        ? mkFpaTerm(name, args, indices, at)
        : isSeqOpName(name)
          ? mkSeqTerm(name, args, indices, at)
          : mkBvApp(name, args, indices, at);
    const macro = macros.get(name);
    // macros_find: a macro takes its own sorts, and Int for Real or Real for Int. Any other
    // application leaves the name to a declaration.
    if (
      macro !== undefined &&
      macro.domain.length === args.length &&
      args.every(
        (arg, index) =>
          manager.sorts[arg] === macro.domain[index] ||
          (isArithSort(manager.sorts[arg]) && isArithSort(macro.domain[index])),
      )
    ) {
      if (args.length === 0) return macro.body;
      // try_mk_macro_app holds the term until pop_app_frame pushes it.
      macroAppExpr = revSubst.apply(
        macro.body,
        args.map((arg, index) => coerce(arg, macro.domain[index])),
      );
      return macroAppExpr;
    }
    const decls = funcs.get(name);
    const declared = decls === undefined ? undefined : mkDeclaredApp(name, decls, args, range, at);
    if (declared !== undefined) return declared;
    // cmd_context::mk_app: a constant that starts with #f is a finite-field literal.
    if (args.length === 0 && name.startsWith("#f")) {
      if (!FF_LITERAL.test(name))
        throw new SmtParseError("invalid finite-field literal, expected #f<integer>m<prime>", at);
      if (!restricted.hasFf) throw new SmtParseError("logic does not support finite fields", at);
      throw new SmtUnsupportedError("finite-field literals");
    }
    if (isSeqOpName(name)) return mkSeqTerm(name, args, indices, at, range);
    if (range !== undefined)
      throw new SmtParseError(getUnknownConstantMessage(name, args, range), at);
    if (isBvOpName(name)) return mkBvApp(name, args, indices, at);
    if (isFpaOpName(name)) return mkFpaTerm(name, args, indices, at);
    const arrayOp = getArrayOp(name);
    if (arrayOp !== undefined) return mkArrayTerm(arrayOp, args, [], at);
    const builtin = (logic === undefined ? LOGIC_FREE_ALIASES.get(name) : undefined) ?? name;
    const isTranscendental = TRANSCENDENTALS.has(builtin) && hasTranscendentals(logic);
    if (isTranscendental && args.length === 0 && builtin === "pi") return manager.piExpr;
    if (isTranscendental && args.length === 0 && builtin === "euler") return manager.eulerExpr;
    const transcendentalOp = isTranscendental ? TRANSCENDENTAL_OPS.get(builtin) : undefined;
    if (isTranscendental && transcendentalOp === undefined)
      throw new SmtUnsupportedError(`the operator ${name}`);
    const builtinOp =
      builtin === "~"
        ? OP_UMINUS
        : builtin === "true"
          ? OP_TRUE
          : builtin === "false"
            ? OP_FALSE
            : (CHAINABLE_OPS.get(builtin) ?? BUILTIN_OPS.get(builtin) ?? transcendentalOp);
    // load_plugin registers the operators of arithmetic only for a logic that has it.
    const named =
      builtinOp !== undefined && manager.funcDecls[builtinOp].family === FAMILY_ARITH && !hasArith
        ? undefined
        : builtinOp;
    if (
      args.length === 0 &&
      named !== undefined &&
      manager.funcDecls[named].family === FAMILY_ARITH
    )
      throw new SmtParseError("no arguments supplied to arithmetical operator", head);
    // arith_decl_plugin::fix_kind.
    const op = named === OP_SUB && args.length === 1 ? OP_UMINUS : named;
    const domainSort = op === undefined ? -1 : getDomainSort(op, args, at);
    if (op !== undefined && domainSort !== -1) return mkApp(op, args, at, domainSort);
    if (
      op === undefined &&
      !isPortedTheoryOperator(name) &&
      ((THEORY_OPERATOR.test(name) &&
        (name.startsWith("bv")
          ? hasBv
          : name.startsWith("fp.")
            ? hasFpa
            : name.startsWith("ff.") || hasSeq)) ||
        THEORY_OPERATORS.has(name))
    )
      throw new SmtUnsupportedError(`the operator ${name}`);
    const instance = mkDatatypeInstanceApp(name, args, at);
    if (instance !== undefined) return instance;
    throw new SmtParseError(getUnknownConstantMessage(name, args, undefined), at);
  };

  const parseLeaf = (sexpr: SmtToken): number => {
    if (sexpr.kind === "numeral")
      return restricted.isNumeralAsReal
        ? manager.mkRealNumeral(Rational.of(BigInt(sexpr.text), 1n))
        : manager.mkNumeral(BigInt(sexpr.text));
    if (sexpr.kind === "decimal") return manager.mkRealNumeral(Rational.fromDecimal(sexpr.text));
    if (sexpr.kind === "bitvector") {
      const isBinary = sexpr.text[1] === "b";
      const digits = sexpr.text.slice(2);
      return manager.mkBvNumeral(
        BigInt(`0${isBinary ? "b" : "x"}${digits}`),
        digits.length * (isBinary ? 1 : 4),
      );
    }
    if (sexpr.kind === "string") return manager.mkString(parseZstring(sexpr.text, manager.maxChar));
    if (sexpr.kind === "symbol") {
      const local = locals.get(sexpr.text);
      if (local !== undefined) return getLocalTerm(local);
      if (sexpr.text === "true") return manager.trueExpr;
      if (sexpr.text === "false") return manager.falseExpr;
      return parseApp(sexpr, [], sexpr);
    }
    throw new SmtParseError(
      sexpr.kind === "keyword"
        ? "invalid expression, unexpected keyword"
        : sexpr.kind === "eof"
          ? "invalid expression, unexpected input"
          : "invalid expression, unexpected ')'",
      sexpr,
    );
  };

  // name_expr and cmd_context::insert of a named term. Z3 reports an error at the token after the
  // name.
  const nameExpr = (expr: number, name: string, at: SExpr) => {
    if (manager.freeVarBounds[expr] > 0)
      throw new SmtParseError("invalid named expression, expression contains free variables", at);
    if (macros.get(name)?.domain.length === 0)
      throw new SmtParseError("named expression already defined", at);
    if ((funcs.get(name) ?? []).some((decl) => hasSignature(decl, [], manager.sorts[expr])))
      throw new SmtParseError(
        `invalid named expression, declaration already defined with this name ${name}`,
        at,
      );
    lastNamed.name = name;
    lastNamed.expr = expr;
    defineMacroFunc(name, [], expr);
  };

  // push_app_frame's parse_qualified_identifier_core, on a head that is (_ <symbol> <index>*) or
  // (as <identifier> <sort>).
  const parseQualifiedHead = (list: SmtList, head: SmtList): QualifiedHead => {
    if (isSymbol(head.items[0], "as")) {
      const range = parseQualifierSort(head);
      const target = head.items[1];
      if (!isSymbol(target)) throw new SmtUnsupportedError("indexed and qualified identifiers");
      return {
        head: target,
        indices: [],
        build:
          hasArrays && target.text === "const"
            ? (args) => mkArrayTerm(OP_CONST_ARRAY, args, [range], list.end)
            : (args) => parseApp(target, args, list.end, [], range),
      };
    }
    const name = getIndexedName(head);
    const indices = head.items.slice(2);
    const indexed = indices[0];
    if (hasArrays && hasArrayExtensions && name.text === "map" && indices.length === 1) {
      const mapped = parseFuncDeclRef(indexed);
      return { head: name, indices: [], build: (args) => mkMapTerm(mapped, args, list.end) };
    }
    if ((name.text === "is" || name.text === "update-field") && indices.length === 1) {
      if (!isSymbol(indexed)) throw new SmtUnsupportedError("indexed and qualified identifiers");
      return {
        head: name,
        indices: [],
        build: (args) =>
          name.text === "is"
            ? mkIsApp(indexed, args, list.end)
            : mkUpdateFieldApp(indexed, args, list.end),
      };
    }
    const isNumbered = indices.every((index) => index.kind === "numeral");
    if (isNumbered && isPbOpName(name.text)) {
      const parameters = indices.map((index) =>
        Rational.of(BigInt(index.kind === "list" ? 0 : index.text)),
      );
      return {
        head: name,
        indices: [],
        build: (args) => mkPbTerm(name.text, args, parameters, list.end),
      };
    }
    if (isNumbered && (isBvOpName(name.text) || isFpaOpName(name.text) || isSeqOpName(name.text)))
      return {
        head: name,
        indices: indices.map((index) => (index.kind === "list" ? 0 : Number(index.text))),
      };
    // cmd_context::mk_app finds a name that no theory knows among the declarations, whatever its
    // indices are.
    if (isKnownOperator(name.text) || !indices.every(isSimpleIndex))
      throw new SmtUnsupportedError("indexed and qualified identifiers");
    return { head: name, indices: [] };
  };

  const parseMatchPattern = (sexpr: SExpr, sort: number, after: SExpr) => {
    if (sexpr.kind !== "list" && sexpr.kind !== "symbol")
      throw new SmtParseError(
        "expecting a constructor, _, variable or constructor application",
        sexpr,
      );
    const name = sexpr.kind === "list" ? (sexpr.items[0] ?? sexpr.end) : sexpr;
    if (!isSymbol(name)) throw new SmtParseError("constructor symbol expected", name);
    const vars: string[] = [];
    if (sexpr.kind === "list")
      for (const [index, item] of sexpr.items.slice(1).entries()) {
        if (!isSymbol(item)) throw new SmtParseError("variable symbol expected", item);
        if (item.text !== "_" && vars.includes(item.text))
          throw new SmtParseError(
            "unexpected repeated variable in pattern expression",
            sexpr.items[index + 2] ?? sexpr.end,
          );
        vars.push(item.text);
      }
    const decl = funcs
      .get(name.text)
      ?.find(
        (candidate) =>
          manager.funcDecls[candidate].range === sort &&
          manager.funcDecls[candidate].domain.length === vars.length,
      );
    if (decl === undefined && vars.length > 0)
      throw new SmtParseError(
        `invalid function declaration reference, unknown indexed function ${name.text}`,
        after,
      );
    if (decl === undefined && (name.text === "true" || name.text === "false"))
      throw new SmtParseError("expecting a constructor", after);
    if (decl === undefined && BUILTIN_NAMES.has(name.text))
      throw new SmtUnsupportedError("a builtin name as a pattern of match");
    if (decl === undefined) {
      binders.depth++;
      const variable = manager.mkVar(0, sort);
      if (name.text !== "_") insertLocal(name.text, variable);
      return variable;
    }
    if (manager.funcDecls[decl].op !== OP_DT_CONSTRUCTOR)
      throw new SmtParseError("expecting a constructor", after);
    binders.depth += vars.length;
    const args = vars.map((variable, index) => {
      const boundVar = manager.mkVar(index, manager.funcDecls[decl].domain[index]);
      if (variable !== "_") insertLocal(variable, boundVar);
      return boundVar;
    });
    return manager.mkApp(decl, args, sort);
  };

  const compileMatch = (term: number, patterns: number[], bodies: number[], at: SExpr) => {
    const sort = manager.sorts[term];
    if (!manager.isDatatypeSort(sort))
      throw new SmtParseError("pattern matching is only supported for algebraic datatypes", at);
    const constructors = getDatatypeConstructors(manager, sort);
    if (!patterns.some((pattern) => manager.kinds[pattern] === KIND_VAR)) {
      if (patterns.length < constructors.length)
        throw new SmtParseError("non-exhaustive pattern match", at);
      const marked = new Set(patterns.map((pattern) => manager.decls[pattern]));
      if (constructors.some((constructor) => !marked.has(constructor)))
        throw new SmtParseError("a constructor is missing from pattern match", at);
    }
    const subst = new VarSubst(manager, false);
    let result = -1;
    for (let index = patterns.length - 1; index >= 0; index--) {
      const pattern = patterns[index];
      const isVar = manager.kinds[pattern] === KIND_VAR;
      const recognizer = isVar ? -1 : getConstructorIs(manager, manager.decls[pattern]);
      const accessors = isVar ? [] : getConstructorAccessors(manager, manager.decls[pattern]);
      const shifted = shiftFreeVars(term, isVar ? 1 : accessors.length);
      manager.incRef(shifted);
      const substitution = isVar
        ? [shifted]
        : accessors.map((accessor) =>
            manager.mkApp(accessor, [shifted], manager.funcDecls[accessor].range),
          );
      for (const expr of substitution) manager.incRef(expr);
      const condition = isVar ? manager.trueExpr : manager.mkApp(recognizer, [term], SORT_BOOL);
      manager.incRef(condition);
      manager.decRef(shifted);
      const substituted = subst.apply(bodies[index], substitution);
      const shifter = new InvVarShifter(manager);
      const body = shifter.shift(substituted, substitution.length);
      manager.decRef(substituted);
      shifter.release();
      const args = [condition, body, result];
      const next = result === -1 ? body : mkApp(OP_ITE, args, at, getDomainSort(OP_ITE, args, at));
      manager.incRef(next);
      if (result !== -1) manager.decRef(result);
      result = next;
      manager.decRef(body);
      manager.decRef(condition);
      for (const expr of substitution) manager.decRef(expr);
    }
    subst.release();
    return result;
  };

  // parse_expr. Z3 leaves the term on its stack until the command ends. A tail term is one whose
  // value is the value of the whole: it stays off the stack, in parsed, so that the caller of
  // parseTerm can have a term that nothing else holds without a reference of the parser's.
  const runTerm = (sexpr: SExpr, isRootTail: boolean) => {
    const root = sexpr.kind === "list" ? sexpr.root : undefined;
    if (root === undefined || root === parsed.root) protect(floating);
    else {
      releasePending();
      shrink(floating, 0);
      parsed.root = root;
    }
    protect(unrooted);
    const frames: TermFrame[] = [];
    // The value of a frame replaces what the frame left on the stack. Z3 holds it in an expr_ref
    // meanwhile.
    const deliver = (expr: number, isTail: boolean, start: number) => {
      const isOwned = !isTail || manager.getRefCount(expr) > 0;
      if (isOwned) manager.incRef(expr);
      shrinkRefs(exprStack, start);
      if (!isTail) {
        exprStack.push(expr);
        return;
      }
      parsed.expr = expr;
      parsed.isOwned = isOwned;
    };
    // push_pattern_frame.
    const enterPattern = (value: SExpr, frame: AttributeFrame) => {
      if (value.kind !== "list") {
        if (!options.isIgnoringBadPatterns)
          throw new SmtParseError("invalid pattern, '(' expected", value);
        // Z3 skips a bad pattern as an s-expression, which cannot start with ')'.
        if (value.kind === ")")
          throw new SmtParseError("invalid s-expression, unexpected ')'", value);
        expectClosed(value);
        frame.next++;
        exprStack.push(-1);
        return;
      }
      frame.next++;
      const first = value.items[0];
      if (first === undefined) {
        exprStack.push(-1);
        return;
      }
      if (first.kind === "list") {
        frames.push({ kind: "pattern", list: value, start: exprStack.length, next: 0 });
        return;
      }
      const decl = first.text === "true" || first.text === "false" ? -1 : getFirstFunc(first.text);
      if (decl === -1 || (decl !== undefined && manager.funcDecls[decl].domain.length === 0)) {
        if (!options.isIgnoringBadPatterns)
          throw new SmtParseError("invalid constant pattern", first);
        exprStack.push(-1);
        return;
      }
      if (first.kind !== "symbol")
        throw new SmtParseError("invalid pattern, '(' or identifier expected", first);
      frames.push({
        kind: "application",
        list: value,
        head: first,
        indices: [],
        isTail: false,
        start: exprStack.length,
        next: 1,
      });
    };
    const enter = (current: SExpr, isTail: boolean) => {
      if (current.kind !== "list") {
        deliver(parseLeaf(current), isTail, exprStack.length);
        return;
      }
      const head = current.items[0];
      if (head === undefined || (head.kind !== "symbol" && head.kind !== "list"))
        throw new SmtParseError("invalid expression, '(' or symbol expected", head ?? current.end);
      if (head.kind === "list") {
        // push_app_frame: Z3 reads a head that is neither indexed nor qualified as a term.
        if (isSymbol(head.items[0], "lambda"))
          throw new SmtUnsupportedError("indexed and qualified identifiers");
        frames.push(
          isSymbol(head.items[0], "_") || isSymbol(head.items[0], "as")
            ? {
                kind: "application",
                list: current,
                ...parseQualifiedHead(current, head),
                isTail,
                start: exprStack.length,
                next: 1,
              }
            : { kind: "selection", list: current, isTail, start: exprStack.length, next: 0 },
        );
        return;
      }
      if (head.text === "_" || head.text === "as") {
        deliver(parseQualifiedName(current), isTail, exprStack.length);
        return;
      }
      if (head.text === "root-obj") {
        deliver(parseRootObj(current), isTail, exprStack.length);
        return;
      }
      if (head.text === "match") {
        frames.push({
          kind: "match",
          list: current,
          cases: [],
          isCaseForm: false,
          depth: -1,
          isTail,
          start: exprStack.length,
          next: -1,
        });
        enter(current.items[1] ?? current.end, false);
        return;
      }
      if (head.text === "let") {
        const bindings = current.items[1];
        if (bindings?.kind !== "list")
          throw new SmtParseError(
            `invalid let declaration, '(' expected got ${(bindings ?? current.end).lastId}`,
            bindings ?? current.end,
          );
        frames.push({
          kind: "let",
          list: current,
          bindings,
          names: [],
          isInDecls: true,
          isTail,
          start: exprStack.length,
          next: 0,
        });
        return;
      }
      if (head.text === "!") {
        const parent = frames[frames.length - 1];
        frames.push({
          kind: "attribute",
          list: current,
          quantifier: parent?.kind === "quantifier" ? parent : undefined,
          lastKeyword: "",
          isTail,
          start: exprStack.length,
          next: 1,
        });
        return;
      }
      const quantifierKind = QUANTIFIER_KINDS.get(head.text);
      if (quantifierKind === undefined) {
        frames.push({
          kind: "application",
          list: current,
          head,
          indices: [],
          isTail,
          start: exprStack.length,
          next: 1,
        });
        return;
      }
      // push_quant_frame.
      const start = exprStack.length;
      const bound = bindSortedVars(current.items[1], current.end);
      if (bound.varSorts.length === 0)
        throw new SmtParseError(
          "invalid quantifier, list of sorted variables is empty",
          current.items[2] ?? current.end,
        );
      frames.push({
        kind: "quantifier",
        list: current,
        quantifierKind,
        names: bound.names,
        varSorts: bound.varSorts,
        weight: 1,
        qid: "",
        skid: undefined,
        isTail,
        start,
        patternStart: patternStack.length,
        noPatternStart: noPatternStack.length,
        next: 2,
      });
    };
    enter(sexpr, isRootTail);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      if (frame.kind === "let") {
        if (frame.isInDecls) {
          const declaration = frame.bindings.items[frame.next];
          if (declaration !== undefined) {
            // push_let_decl_frame.
            if (declaration.kind !== "list")
              throw new SmtParseError(
                `invalid let declaration, '(' expected got ${declaration.lastId}`,
                declaration,
              );
            const name = declaration.items[0];
            if (!isSymbol(name)) throw new SmtParseError(LET_MESSAGE, name ?? declaration.end);
            frame.names.push(name.text);
            frame.next++;
            frames.push({ kind: "let-decl", list: declaration, next: 1 });
            continue;
          }
          // pop_let_frame at the end of the declarations.
          if (frame.names.length !== exprStack.length - frame.start)
            throw new SmtParseError("malformed let expression", frame.bindings.end);
          beginScope();
          for (const [index, name] of frame.names.entries())
            insertLocal(name, exprStack[frame.start + index]);
          frame.isInDecls = false;
          frame.next = 2;
          continue;
        }
        const body = frame.list.items[frame.next];
        if (body !== undefined) {
          frame.next++;
          enter(body, frame.isTail && frame.next === frame.list.items.length);
          continue;
        }
        frames.pop();
        // Z3 takes the last expression on its stack, so a let without a body is its last binding.
        if (frame.isTail && frame.list.items.length > 2) shrinkRefs(exprStack, frame.start);
        else if (exprStack.length === frame.start)
          throw new SmtParseError("invalid let expression", frame.list.end);
        else deliver(exprStack[exprStack.length - 1], frame.isTail, frame.start);
        endScope();
        continue;
      }
      const items = frame.list.items;
      if (frame.kind === "match") {
        if (frame.next === -1) {
          const bindings = items[2] ?? frame.list.end;
          if (bindings.kind !== "list")
            throw new SmtParseError(
              `pattern bindings should be enclosed in a parenthesis got ${bindings.lastId}`,
              bindings,
            );
          // curr_id_is_case reads the last identifier, which a '(' leaves as it was.
          frame.isCaseForm = (bindings.items[0] ?? bindings.end).lastId === "case";
          frame.cases = frame.isCaseForm ? items.slice(2) : bindings.items;
          frame.next = 0;
        } else if (frame.depth !== -1) {
          binders.depth = frame.depth;
          frame.depth = -1;
          endScope();
          const binding = frame.cases[frame.next - 1];
          const extra =
            binding.kind === "list" ? binding.items[frame.isCaseForm ? 3 : 2] : undefined;
          if (extra !== undefined)
            throw new SmtParseError(
              `invalid pattern binding, ')' expected got ${extra.lastId}`,
              extra,
            );
        }
        const binding = frame.cases[frame.next];
        if (binding !== undefined) {
          if (frame.isCaseForm && !(binding.kind === "list" && isSymbol(binding.items[0], "case")))
            throw new SmtUnsupportedError("the terms after the cases of match");
          if (binding.kind !== "list")
            throw new SmtParseError(
              `invalid pattern binding, '(' expected got ${binding.lastId}`,
              binding,
            );
          frame.next++;
          beginScope();
          frame.depth = binders.depth;
          const offset = frame.isCaseForm ? 1 : 0;
          const body = binding.items[offset + 1] ?? binding.end;
          const sort = manager.sorts[exprStack[frame.start]];
          pushRef(exprStack, parseMatchPattern(binding.items[offset] ?? binding.end, sort, body));
          enter(body, false);
          continue;
        }
        if (!frame.isCaseForm && items.length > 3)
          throw new SmtUnsupportedError("the terms after the cases of match");
        frames.pop();
        const term = exprStack[frame.start];
        const cases = exprStack.slice(frame.start + 1);
        const patterns = cases.filter((_expr, index) => index % 2 === 0);
        const bodies = cases.filter((_expr, index) => index % 2 === 1);
        const result = compileMatch(term, patterns, bodies, frame.list.end);
        // push_match_frame releases the bodies, then the patterns, then the term.
        exprStack.splice(frame.start, cases.length + 1, ...bodies, ...patterns, term);
        deliver(result, frame.isTail, frame.start);
        manager.decRef(result);
        continue;
      }
      if (frame.kind === "attribute") {
        // consume_attributes.
        if (exprStack.length === frame.start) {
          if (frame.next >= items.length)
            throw new SmtParseError("invalid expression", frame.list.end);
          enter(items[frame.next++], false);
          continue;
        }
        // process_last_symbol.
        const last = exprStack[exprStack.length - 1];
        if (frame.lastKeyword === ":pattern") {
          const at = items[frame.next] ?? frame.list.end;
          if (last === -1 && !options.isIgnoringBadPatterns)
            throw new SmtParseError("invalid empty pattern", at);
          if (last !== -1)
            pushRef(
              patternStack,
              manager.kinds[last] === KIND_APP && manager.decls[last] === OP_PATTERN
                ? last
                : mkPattern([last], at),
            );
          shrinkRefs(exprStack, exprStack.length - 1);
        } else if (frame.lastKeyword === ":no-pattern") {
          pushRef(noPatternStack, last);
          shrinkRefs(exprStack, exprStack.length - 1);
        }
        frame.lastKeyword = "";
        if (frame.next >= items.length) {
          frames.pop();
          if (frame.isTail) deliver(exprStack[exprStack.length - 1], true, frame.start);
          continue;
        }
        while (frame.next < items.length && frame.lastKeyword === "") {
          const keyword = items[frame.next];
          if (keyword.kind !== "keyword")
            throw new SmtParseError("invalid attributed expression, keyword expected", keyword);
          const value = items[frame.next + 1] ?? frame.list.end;
          const annotated = exprStack[exprStack.length - 1];
          const quantifier = frame.quantifier;
          if (keyword.text === ":named") {
            if (!isSymbol(value))
              throw new SmtParseError("invalid attribute value, symbol expected", value);
            nameExpr(annotated, value.text, items[frame.next + 2] ?? frame.list.end);
            frame.next += 2;
          } else if (keyword.text === ":lblpos" || keyword.text === ":lblneg") {
            if (!isSymbol(value))
              throw new SmtParseError("invalid attribute value, symbol expected", value);
            if (manager.sorts[annotated] !== SORT_BOOL)
              throw new SmtParseError(
                "invalid labeled expression, expression must have Bool sort",
                value,
              );
            deliver(
              manager.mkLabel(keyword.text === ":lblpos", [value.text], annotated),
              false,
              exprStack.length - 1,
            );
            frame.next += 2;
          } else if (!QUANTIFIER_ATTRIBUTES.has(keyword.text)) {
            // Z3 warns of an unknown attribute and skips its value as an s-expression.
            if (value.kind === ")")
              throw new SmtParseError("invalid s-expression, unexpected ')'", value);
            expectClosed(value);
            frame.next += 2;
          } else if (quantifier === undefined)
            throw new SmtParseError("invalid attribute, not in the scope of a quantifier", keyword);
          else if (keyword.text === ":weight") {
            // check_int, and curr_unsigned.
            if (value.kind !== "numeral")
              throw new SmtParseError("invalid weight attribute, integer expected", value);
            if (!isUnsigned(value.text))
              throw new SmtParseError(
                "invalid indexed identifier, index is too big to fit in an unsigned machine integer",
                value,
              );
            quantifier.weight = Number(value.text);
            frame.next += 2;
          } else if (keyword.text === ":skolemid" || keyword.text === ":qid") {
            if (!isSymbol(value))
              throw new SmtParseError("invalid attribute value, symbol expected", value);
            if (keyword.text === ":qid") quantifier.qid = value.text;
            else quantifier.skid = value.text;
            frame.next += 2;
          } else {
            frame.lastKeyword = keyword.text;
            frame.next++;
            if (keyword.text === ":pattern") enterPattern(value, frame);
            else if (value.kind === ")")
              throw new SmtParseError("invalid expression, unexpected input", value);
            else enter(items[frame.next++], false);
          }
        }
        continue;
      }
      if (frame.next < items.length) {
        enter(items[frame.next++], false);
        continue;
      }
      frames.pop();
      if (frame.kind === "let-decl") continue;
      if (frame.kind === "pattern") {
        deliver(mkPattern(exprStack.slice(frame.start), frame.list.end), false, frame.start);
        continue;
      }
      if (frame.kind === "quantifier") {
        // pop_quant_frame.
        deliver(mkParsedQuantifier(frame), frame.isTail, frame.start);
        shrinkRefs(patternStack, frame.patternStart);
        shrinkRefs(noPatternStack, frame.noPatternStart);
        unbindSortedVars(frame.varSorts.length);
        continue;
      }
      // pop_app_frame.
      const args = exprStack.slice(frame.start);
      if (args.length < (frame.kind === "selection" ? 2 : 1))
        throw new SmtParseError("invalid function application, arguments missing", frame.list.end);
      deliver(
        frame.kind === "selection"
          ? args
              .slice(1)
              .reduce(
                (array, arg) => mkArrayTerm(OP_SELECT, [array, arg], [], frame.list.end),
                args[0],
              )
          : (frame.build?.(args) ?? parseApp(frame.head, args, frame.list.end, frame.indices)),
        frame.isTail,
        frame.start,
      );
      if (macroAppExpr === -1) continue;
      manager.decRef(macroAppExpr);
      macroAppExpr = -1;
    }
  };

  const parseTerm = (sexpr: SExpr) => {
    runTerm(sexpr, true);
    const expr = parsed.expr;
    parsed.expr = -1;
    if (!parsed.isOwned)
      (sexpr.kind === "list" && sexpr.root !== undefined ? floating : unrooted).push(expr);
    else if (manager.getRefCount(expr) > 1) manager.decRef(expr);
    else pending.push(expr);
    return expr;
  };

  const parseDomain = (sexpr: SExpr) => {
    const context = "Parsing function declaration. Expecting sort list '('";
    return expectListNext(sexpr, context).items.map((item) => parseSort(item, context));
  };

  const parseSortParameters = (sexpr: SExpr, message: string) =>
    expectListNext(sexpr, "invalid sort declaration, parameters missing").items.map(
      (item) => expectSymbol(item, message, item).text,
    );

  const bindTypeParameters = (names: string[]) =>
    new Map(names.map((name, index) => [name, manager.mkTypeParameter(index)]));

  const parseAccessorSort = (
    sexpr: SExpr,
    bindings: ReadonlyMap<string, number>,
    datatypeIndexes: ReadonlyMap<string, number>,
    missing: string[],
  ) => {
    if (sexpr.kind === "list") return parseSort(sexpr, "", bindings);
    if (sexpr.kind === ")") throw new SmtParseError("invalid sort, unexpected ')'", sexpr);
    if (sexpr.kind !== "symbol")
      throw new SmtParseError(
        `invalid sort, symbol, '_' or '(' expected got ${sexpr.lastId}`,
        sexpr,
      );
    if (sortDecls.has(sexpr.text) || bindings.has(sexpr.text))
      return parseSort(sexpr, "", bindings);
    const index = datatypeIndexes.get(sexpr.text);
    if (index !== undefined) return -1 - index;
    missing.push(sexpr.text);
    return SORT_BOOL;
  };

  const parseConstructors = (
    items: SExpr[],
    bindings: ReadonlyMap<string, number>,
    datatypeIndexes: ReadonlyMap<string, number>,
    missing: string[],
    at: SExpr,
  ): ConstructorDef[] => {
    if (items.length === 0)
      throw new SmtParseError(
        "invalid datatype declaration, datatype does not have any constructors",
        at,
      );
    return items.map((item) => {
      if (isSymbol(item)) return { name: item.text, recognizer: `is-${item.text}`, accessors: [] };
      const constructor = expectListNext(item, "invalid datatype declaration, '(' or ')' expected");
      const name = expectSymbol(
        constructor.items[0],
        "invalid constructor declaration, symbol (constructor name) expected",
        constructor,
      ).text;
      const accessors = constructor.items.slice(1).map((accessorItem) => {
        const accessor = expectListNext(
          accessorItem,
          "invalid datatype declaration, '(' or ')' expected",
        );
        const accessorName = expectSymbol(
          accessor.items[0],
          "invalid accessor declaration, symbol (accessor name) expected",
          accessor,
        ).text;
        const range = parseAccessorSort(
          accessor.items[1] ?? accessor.end,
          bindings,
          datatypeIndexes,
          missing,
        );
        if (accessor.items.length > 2)
          throw new SmtParseError(
            `invalid accessor declaration, ')' expected got ${accessor.items[2].lastId}`,
            accessor.items[2],
          );
        return { name: accessorName, range };
      });
      return { name, recognizer: `is-${name}`, accessors };
    });
  };

  const parseDatatypeBody = (
    sexpr: SExpr,
    datatypeIndexes: ReadonlyMap<string, number>,
    missing: string[],
    name?: string,
  ) => {
    const body = expectListNext(sexpr, "invalid datatype declaration, '(' expected");
    if (!isSymbol(body.items[0], "par")) {
      if (name !== undefined) declareDatatypeSort(name, 0, body.items[0] ?? body.end);
      return {
        parameters: [],
        constructors: parseConstructors(body.items, NO_BINDINGS, datatypeIndexes, missing, body),
      };
    }
    const parameters = parseSortParameters(
      body.items[1] ?? body.end,
      "invalid sort parameter, symbol or ')' expected",
    );
    const constructors = expectListNext(
      body.items[2] ?? body.end,
      "invalid constructor declaration after par, '(' expected",
    );
    if (name !== undefined && parameters.length > 0)
      declareDatatypeSort(name, parameters.length, constructors.items[0] ?? constructors.end);
    return {
      parameters: parameters.map((_name, index) => manager.mkTypeParameter(index)),
      constructors: parseConstructors(
        constructors.items,
        bindTypeParameters(parameters),
        datatypeIndexes,
        missing,
        constructors,
      ),
    };
  };

  const checkMissingSorts = (missing: string[], at: SExpr) => {
    if (missing.length > 0)
      throw new SmtParseError(`invalid datatype declaration, unknown sort '${missing[0]}'`, at);
  };

  const checkDuplicateAccessors = (def: DatatypeDef, at: SExpr) => {
    const names = def.constructors.flatMap((constructor) =>
      constructor.accessors.map((accessor) => accessor.name),
    );
    const duplicated = names.find((name, index) => names.indexOf(name) !== index);
    if (duplicated !== undefined)
      throw new SmtParseError(
        `invalid datatype declaration, repeated accessor identifier '${duplicated}'`,
        at,
      );
  };

  const commitDatatypes = (defs: DatatypeDef[], end: SExpr) => {
    const sorts = mkDatatypes(manager, defs);
    if (typeof sorts === "string") throw new SmtParseError(sorts, end);
    for (const def of defs) pushUndo(() => removeDatatype(manager, def.name));
    defs.forEach((def, index) => {
      if (def.parameters.length === 0) insertDatatypeDecls(sorts[index], end);
    });
  };

  const declareSortDecl = (name: string, decl: SortDecl, at: SExpr) => {
    if (sortDecls.has(name)) throw new SmtParseError(`sort already defined ${name}`, at);
    declare(sortDecls, name, decl);
  };

  const declareDatatypeSort = (name: string, arity: number, at: SExpr) =>
    declareSortDecl(
      name,
      { kind: "datatype", name, arity, siblings: [], instances: new Map() },
      at,
    );

  const declareDatatypes = (list: SmtList) => {
    const declaration = expectListNext(
      list.items[1] ?? list.end,
      "invalid sort declaration, parameters missing",
    );
    const isSmt26 = declaration.items[0]?.kind === "list";
    const datatypeIndexes = new Map<string, number>();
    const names: string[] = [];
    const arities: number[] = [];
    const parameterNames: string[] = [];
    declaration.items.forEach((item, index) => {
      if (!isSmt26) {
        parameterNames.push(
          expectSymbol(item, "invalid sort parameter, symbol or ')' expected", item).text,
        );
        return;
      }
      const sortDeclaration = expectListNext(item, "invalid sort declaration, '(' expected");
      const name = expectSymbol(
        sortDeclaration.items[0],
        "invalid sort name, identified expected",
        sortDeclaration.end,
      ).text;
      const arity = sortDeclaration.items[1];
      if (arity?.kind !== "numeral")
        throw new SmtParseError(
          "invalid sort declaration, arity expected",
          arity ?? sortDeclaration.end,
        );
      datatypeIndexes.set(name, index);
      names.push(name);
      arities.push(Number(arity.text));
      declareDatatypeSort(
        name,
        Number(arity.text),
        sortDeclaration.items[2] ?? sortDeclaration.end,
      );
      if (sortDeclaration.items.length > 2)
        throw new SmtParseError("invalid sort declaration, ')' expected", sortDeclaration.items[2]);
    });
    const bodies = expectListNext(
      list.items[2] ?? list.end,
      "invalid datatype declaration, '(' expected",
    );
    // A datatype of the older syntax may refer to any datatype of its declaration.
    if (!isSmt26)
      bodies.items.forEach((item, index) => {
        const datatype = expectListNext(item, "invalid datatype declaration, '(' or ')' expected");
        const name = expectSymbol(
          datatype.items[0],
          "invalid datatype declaration, symbol (datatype name) expected",
          datatype,
        ).text;
        datatypeIndexes.set(name, index);
        names.push(name);
      });
    const missing: string[] = [];
    const typeParameters = parameterNames.map((_name, index) => manager.mkTypeParameter(index));
    const bindings = bindTypeParameters(parameterNames);
    const defs = bodies.items.map((item, index) => {
      if (isSmt26) {
        if (index >= names.length)
          throw new SmtParseError(
            "invalid datatype declaration, too many data-type bodies defined",
            item,
          );
        return mkDatatypeDef(
          manager,
          names[index],
          Array.from({ length: arities[index] }, (_unused, parameter) =>
            manager.mkTypeParameter(parameter),
          ),
          parseDatatypeBody(item, datatypeIndexes, missing).constructors,
        );
      }
      const datatype = expectListNext(item, "invalid datatype declaration, '(' or ')' expected");
      return mkDatatypeDef(
        manager,
        names[index],
        typeParameters,
        parseConstructors(datatype.items.slice(1), bindings, datatypeIndexes, missing, datatype),
      );
    });
    if (defs.length < arities.length)
      throw new SmtParseError(
        "invalid datatype declaration, too few datatype definitions compared to declared sorts",
        bodies.end,
      );
    if (list.items.length > 3)
      throw new SmtParseError("invalid datatype declaration", list.items[3]);
    if (defs.length === 0) return;
    checkMissingSorts(missing, declaration);
    commitDatatypes(defs, list.end);
    for (const def of defs) {
      checkDuplicateAccessors(def, declaration);
      if (!isSmt26)
        declareSortDecl(
          def.name,
          {
            kind: "datatype",
            name: def.name,
            arity: def.parameters.length,
            siblings: defs.length > 1 ? names : [],
            instances: new Map(),
          },
          list.end,
        );
    }
  };

  const declareDatatype = (list: SmtList) => {
    const name = expectSymbol(list.items[1], "unexpected token used as datatype name", list.end);
    const missing: string[] = [];
    const body = parseDatatypeBody(
      list.items[2] ?? list.end,
      new Map([[name.text, 0]]),
      missing,
      name.text,
    );
    const def = mkDatatypeDef(manager, name.text, body.parameters, body.constructors);
    checkMissingSorts(missing, name);
    checkDuplicateAccessors(def, name);
    commitDatatypes([def], list.items[3] ?? list.end);
    expectEnd(list.items[3], "invalid end of datatype declaration, ')' expected");
  };

  // parse_rec_fun_decl: the variables are bound only while the range is parsed, and Z3 holds them
  // until the command ends, as the stack does here.
  const declareRecFun = (items: SExpr[], at: SExpr) => {
    const symbol = expectSymbol(
      items[0],
      "invalid function/constant definition, symbol expected",
      at,
    );
    const bound = bindSortedVars(items[1], at);
    const range = parseSort(items[2] ?? at, "Invalid recursive function definition");
    unbindSortedVars(bound.varSorts.length);
    return manager.mkRecFuncDecl(symbol.text, bound.varSorts, range);
  };

  // parse_rec_fun_body: Z3 reports a body of another sort at the token after it.
  const defineRecFun = (decl: number, variables: SExpr, body: SExpr, next: SExpr) => {
    const start = exprStack.length;
    const bound = bindSortedVars(variables, body);
    runTerm(body, false);
    const parsedBody = exprStack[exprStack.length - 1];
    unbindSortedVars(bound.varSorts.length);
    const range = manager.funcDecls[decl].range;
    if (manager.sorts[parsedBody] !== range)
      throw new SmtParseError(
        `invalid function definition, sort mismatch. Expcected ${manager.getSortName(range)} but function body has sort ${manager.getSortName(manager.sorts[parsedBody])}`,
        next,
      );
    const vars = bound.varSorts.map((sort, index) =>
      manager.mkVar(bound.varSorts.length - 1 - index, sort),
    );
    setRecFunDefinition(manager, manager.recFunDefs.get(decl)!, false, vars, parsedBody);
    shrinkRefs(exprStack, start);
  };

  const defineMacroFunc = (name: string, domain: number[], body: number) => {
    const count = domain.length;
    const mkHeldVar = (index: number, sort: number) => {
      const variable = manager.mkVar(index, sort);
      manager.incRef(variable);
      return variable;
    };
    let macroBody = body;
    manager.incRef(body);
    if (count > 1) {
      const subst = new VarSubst(manager, true);
      const parsedVars = domain.map((sort, index) => mkHeldVar(index, sort));
      macroBody = subst.apply(body, parsedVars);
      manager.decRef(body);
      for (const variable of parsedVars) manager.decRef(variable);
      subst.release();
    }
    insertMacro(name, { domain, range: manager.sorts[body], body: macroBody });
    if (!options.isGlobalDecls) scopedMacros.push(macroBody);
    const vars: number[] = [];
    const reversedVars: number[] = [];
    for (let index = 0; index < count; index++) {
      vars.push(mkHeldVar(index, domain[index]));
      reversedVars.push(mkHeldVar(index, domain[count - index - 1]));
    }
    const decl = manager.mkRecFuncDecl(name, domain, manager.sorts[body]);
    const definition = stdSubst.apply(macroBody, reversedVars);
    setRecFunDefinition(manager, manager.recFunDefs.get(decl)!, true, vars, definition);
    declareFunc(name, funcs.get(name) ?? [], decl);
    manager.decRef(definition);
    for (const variable of [...reversedVars, ...vars]) manager.decRef(variable);
  };

  const declareCommand = (list: SmtList) => {
    releasePending();
    const name = list.items[0].kind === "list" ? "" : list.items[0].text;
    if (name === "define-fun-rec") {
      const decl = declareRecFun(list.items.slice(1), list.end);
      insertFunc(decl, list.items[4] ?? list.end);
      defineRecFun(decl, list.items[2], list.items[4] ?? list.end, list.items[5] ?? list.end);
      expectEnd(list.items[5], "invalid function/constant definition, ')' expected");
      shrinkRefs(exprStack, 0);
      return;
    }
    if (name === "define-funs-rec") {
      const message = "invalid recursive function definition, '(' expected";
      const signatures = expectList(list.items[1], message, list.end).items.map((signature) => {
        const declaration = expectList(signature, message, signature);
        const items = declaration.items;
        if (items.length > 3)
          throw new SmtParseError("invalid recursive function definition, ')' expected", items[3]);
        return { items, decl: declareRecFun(items, declaration.end) };
      });
      for (const signature of signatures) insertFunc(signature.decl, list.items[2] ?? list.end);
      const bodies = expectList(list.items[2], message, list.end);
      signatures.forEach((signature, index) => {
        const body = bodies.items[index];
        if (body === undefined)
          throw new SmtParseError(
            "the number of declarations does not match number of supplied definitions",
            bodies.end,
          );
        defineRecFun(
          signature.decl,
          signature.items[1],
          body,
          bodies.items[index + 1] ?? bodies.end,
        );
      });
      expectEnd(
        bodies.items[signatures.length],
        "invalid recursive function definition, ')' expected",
      );
      expectEnd(list.items[3], "invalid function/constant definition, ')' expected");
      shrinkRefs(exprStack, 0);
      return;
    }
    if (name === "declare-datatypes") {
      declareDatatypes(list);
      return;
    }
    if (name === "declare-datatype") {
      declareDatatype(list);
      return;
    }
    const symbol = list.items[1];
    // check_nonreserved_identifier rejects _ and as, which define-const's check_identifier takes.
    if (
      !isSymbol(symbol) ||
      (name !== "define-const" && (symbol.text === "_" || symbol.text === "as"))
    )
      throw new SmtParseError(
        name === "declare-sort"
          ? "invalid sort declaration, symbol expected"
          : name === "define-sort"
            ? "invalid sort definition, symbol expected"
            : name === "define-fun"
              ? "invalid function/constant definition, symbol expected"
              : name === "define-const"
                ? "invalid constant definition, symbol expected"
                : name === "declare-fun"
                  ? "invalid function declaration, symbol expected"
                  : "invalid constant declaration, symbol expected",
        symbol ?? list.end,
      );
    if (name === "declare-sort") {
      if (sortDecls.has(symbol.text))
        throw new SmtParseError("invalid sort declaration, sort already declared/defined", symbol);
      const arity = list.items[2];
      if (arity !== undefined && arity.kind !== "numeral")
        throw new SmtParseError(
          "invalid sort declaration, arity (<numeral>) or ')' expected",
          arity,
        );
      declare(sortDecls, symbol.text, {
        kind: "user",
        name: symbol.text,
        arity: arity === undefined ? 0 : Number(arity.text),
      });
      expectEnd(list.items[3], "invalid sort declaration, ')' expected");
      return;
    }
    if (name === "define-sort") {
      if (sortDecls.has(symbol.text))
        throw new SmtParseError("invalid sort definition, sort already declared/defined", symbol);
      const parameters = parseSortParameters(
        list.items[2] ?? list.end,
        "invalid sort parameter, symbol or ')' expected",
      );
      const body = list.items[3] ?? list.end;
      checkPsort(body, bindTypeParameters(parameters));
      declare(sortDecls, symbol.text, { kind: "definition", parameters, body });
      expectEnd(list.items[4], "invalid sort definition, ')' expected");
      return;
    }
    if (name === "define-fun" || name === "define-const") {
      const isConst = name === "define-const";
      const bound = isConst ? { names: [], varSorts: [] } : bindSortedVars(list.items[2], list.end);
      const range = parseSort(
        list.items[isConst ? 2 : 3] ?? list.end,
        isConst ? "Invalid constant definition" : "Invalid function definition",
      );
      runTerm(list.items[isConst ? 3 : 4] ?? list.end, false);
      const body = exprStack[exprStack.length - 1];
      if (!isConst) unbindSortedVars(bound.varSorts.length);
      const extra = list.items[isConst ? 4 : 5];
      if (manager.sorts[body] !== range)
        throw new SmtParseError(
          isConst
            ? "invalid constant definition, sort mismatch"
            : "invalid function/constant definition, sort mismatch",
          extra ?? list.end,
        );
      defineMacroFunc(symbol.text, bound.varSorts, body);
      expectEnd(
        extra,
        isConst
          ? "invalid constant definition, ')' expected"
          : "invalid function/constant definition, ')' expected",
      );
      shrinkRefs(exprStack, 0);
      return;
    }
    const domain = name === "declare-fun" ? parseDomain(list.items[2] ?? list.end) : [];
    const range = parseSort(
      list.items[name === "declare-fun" ? 3 : 2] ?? list.end,
      name === "declare-fun" ? "Invalid function declaration" : "Invalid constant declaration",
    );
    // Z3's builtin_signature_collides and is_transcendental_shadow_decl each make and release fresh variables of the domain.
    for (let round = 0; round < 2; round++) {
      const vars = domain.map((sort, index) => manager.mkVar(index, sort));
      for (const domainVar of vars) manager.incRef(domainVar);
      for (const domainVar of vars) manager.decRef(domainVar);
    }
    const decl = manager.mkFuncDecl(symbol.text, domain, range);
    const extra = list.items[name === "declare-fun" ? 4 : 3];
    const logicError = logicChecker.checkDecl(decl);
    if (logicError !== undefined) {
      manager.decDeclRef(decl);
      throw new SmtParseError(logicError, extra ?? list.end);
    }
    if (macros.has(symbol.text))
      throw new SmtUnsupportedError(`the overloaded symbol ${symbol.text}`);
    const existing = funcs.get(symbol.text) ?? [];
    if (existing.some((other) => hasSignature(other, domain, range))) {
      manager.decDeclRef(decl);
      throw new SmtParseError(
        `invalid declaration, ${domain.length === 0 ? "constant" : "function"} '${symbol.text}' (with the given signature) already declared`,
        extra ?? list.end,
      );
    }
    declareFunc(symbol.text, existing, decl);
    expectEnd(
      extra,
      name === "declare-fun"
        ? "invalid function declaration, ')' expected"
        : "invalid constant declaration, ')' expected",
    );
  };

  // The caller takes the stack's reference. Z3 reports a non-Boolean term at the token after it.
  const parseFormula = (
    sexpr: SExpr,
    follower: SmtPosition,
    message = "invalid assert command, term is not Boolean",
  ) => {
    runTerm(sexpr, false);
    const assertion = exprStack[exprStack.length - 1];
    if (manager.sorts[assertion] !== SORT_BOOL) throw new SmtParseError(message, follower);
    exprStack.pop();
    return assertion;
  };

  // An assertion is named when the last name of its term is its own.
  const parseAssertion = (sexpr: SExpr, follower: SmtPosition) => {
    releasePending();
    lastNamed.expr = -1;
    const formula = parseFormula(sexpr, follower);
    return { formula, name: lastNamed.expr === formula ? lastNamed.name : undefined };
  };

  const push = () => {
    releasePending();
    scopeStarts.push(undo.length);
    scopedFuncStarts.push(scopedFuncs.length);
    scopedMacroStarts.push(scopedMacros.length);
  };

  const pop = (count: number) => {
    releasePending();
    const funcStart = scopedFuncStarts.splice(scopedFuncStarts.length - count)[0];
    // Z3 frees a popped scope's declarations in the order they were made, not in reverse.
    for (const decl of scopedFuncs.splice(funcStart)) {
      manager.eraseRecFunDef(decl);
      const family = manager.funcDecls[decl].family;
      if (family === FAMILY_USER || family === FAMILY_RECFUN) manager.decDeclRef(decl);
    }
    const macroStart = scopedMacroStarts.splice(scopedMacroStarts.length - count)[0];
    for (const macroBody of scopedMacros.splice(macroStart)) manager.decRef(macroBody);
    const start = scopeStarts.splice(scopeStarts.length - count)[0];
    for (const restore of undo.splice(start).reverse()) restore();
    // cmd_context::pop resets the plugin through its datatype handler.
    resetDatatypePlugin(manager);
  };

  // parser::reset, after an error: Z3 frees its stacks, and with them the terms that only the
  // command that failed held.
  const reset = () => {
    protect(floating);
    protect(unrooted);
    releasePending();
    shrinkRefs(exprStack, 0);
    if (parsed.expr !== -1) {
      if (!parsed.isOwned) manager.incRef(parsed.expr);
      manager.decRef(parsed.expr);
      parsed.expr = -1;
    }
    shrinkRefs(patternStack, 0);
    shrinkRefs(noPatternStack, 0);
    locals.clear();
    shrink(shadowedNames, 0);
    shrink(shadowedLocals, 0);
    shrink(localScopes, 0);
    binders.depth = 0;
  };

  // cmd_context::set_logic on a manager that is in use: restrict_builtin_sorts takes the sorts the
  // logic lacks, and the declarations and the operators stay.
  const restrictSorts = (name: string) => {
    releasePending();
    if (logicHasRealsOnly(name)) restricted.isNumeralAsReal = true;
    if (!ARRAY_EXTENSION_LOGICS.has(name)) restricted.hasSetSort = false;
    if (INT_FREE_LOGICS.has(name)) sortDecls.delete("Int");
    restricted.hasFf = FF_LOGICS.has(name);
  };

  const isUsed = (name: string) => funcs.has(name) || BUILTIN_NAMES.has(name);

  const isClashing = (decl: number) => {
    const domain = manager.funcDecls[decl].domain;
    const decls = funcs.get(String(manager.funcDecls[decl].name)) ?? [];
    return (
      decls.includes(decl) &&
      decls.some((other) => other !== decl && hasSignature(other, domain, -1))
    );
  };

  // The first declaration of each name, in the slot order of cmd_context's dictionary.
  const getDeclaredFuncs = () => {
    const table = new ObjMap<true>((decl) => getSymbolHash(manager.funcDecls[decl].name));
    for (const decls of funcs.values()) table.set(decls[0], true);
    return [...table.keys()];
  };

  // Z3 registers each named term and defined function as a recursive function definition.
  const hasDefinitions = () =>
    macros.size > 0 ||
    [...funcs.values()].some((decls) => decls.some((decl) => manager.recFunDefs.has(decl)));

  return {
    declareCommand,
    insertFunc,
    getFuncs: (name: string) => funcs.get(name) ?? [],
    hasDefinitions,
    parseTerm,
    releaseTerms: () => {
      protect(floating);
      protect(unrooted);
      releasePending();
    },
    parseSort: (sexpr: SExpr, context: string) => parseSort(sexpr, context),
    parseFormula,
    parseAssertion,
    getLogicError: logicChecker.checkExpr,
    push,
    pop,
    reset,
    restrictSorts,
    registerList,
    isUsed,
    isClashing,
    getDeclaredFuncs,
    getConstantMacros: () =>
      [...macroDictionary.values()].flatMap((name) => {
        const macro = macros.get(name);
        return macro?.domain.length === 0 ? [{ name, body: macro.body }] : [];
      }),
  };
};

export type SmtlibReader = ReturnType<typeof createSmtlibReader>;

export const DECLARATIONS = new Set([
  "declare-sort",
  "declare-datatypes",
  "declare-datatype",
  "declare-fun",
  "declare-const",
  "define-fun",
  "define-const",
  "define-sort",
  "define-fun-rec",
  "define-funs-rec",
]);

// Z3 reports an error in a command, skips the command and goes on.
export const parseSmtlib = (
  text: string,
  manager: AstManager,
  assertExpr: (assertion: number) => void,
  report: (error: SmtParseError) => void,
): SmtProblem => {
  const commands = createCommandReader(text);
  const state = { reader: createSmtlibReader(manager), logic: "", rlimit: 0, isInUse: false };
  const assertions: number[] = [];
  const runCommand = (list: SmtList) => {
    const name = expectSymbol(list.items[0], "invalid command, symbol expected", list).text;
    const option = list.items[1];
    const value = list.items[2];
    if (
      name === "set-option" &&
      option?.kind === "keyword" &&
      option.text === ":rlimit" &&
      value?.kind === "numeral"
    )
      state.rlimit = Number(value.text);
    if (name === "set-logic") {
      if (option === undefined)
        throw new SmtParseError("invalid command, argument(s) missing", list.end);
      if (!isSymbol(option))
        throw new SmtParseError("invalid command argument, symbol expected", option);
      if (value !== undefined)
        throw new SmtParseError("invalid command, too many arguments", value);
      if (state.logic !== "") throw new SmtParseError("the logic has already been set", option);
      if (assertions.length > 0)
        throw new SmtParseError("logic must be set before initialization", option);
      if (!isSupportedLogic(option.text)) return;
      state.logic = option.text;
      if (state.isInUse) state.reader.restrictSorts(option.text);
      else state.reader = createSmtlibReader(manager, option.text);
    } else if (DECLARATIONS.has(name)) {
      state.isInUse = true;
      if (name.startsWith("define-"))
        throw new SmtUnsupportedError(`the command ${name} is not supported`);
      state.reader.declareCommand(list);
    } else if (name === "assert") {
      state.isInUse = true;
      const assertion = state.reader.parseFormula(
        list.items[1] ?? list.end,
        list.items[2] ?? list.end,
      );
      const logicError = state.reader.getLogicError(assertion);
      if (logicError !== undefined) {
        manager.decRef(assertion);
        throw new SmtParseError(logicError, list.end);
      }
      assertions.push(assertion);
      assertExpr(assertion);
    } else if (name === "push" || name === "pop")
      throw new SmtUnsupportedError(`the command ${name} is not supported`);
  };
  for (;;) {
    try {
      const list = commands.readCommand();
      if (list === undefined) return { assertions, hasCheckSat: false, rlimit: state.rlimit };
      if (isSymbol(list.items[0], "check-sat"))
        return { assertions, hasCheckSat: true, rlimit: state.rlimit };
      runCommand(list);
    } catch (error) {
      if (!(error instanceof SmtParseError)) throw error;
      report(error);
      state.reader.reset();
      commands.skip(report);
    }
  }
};
