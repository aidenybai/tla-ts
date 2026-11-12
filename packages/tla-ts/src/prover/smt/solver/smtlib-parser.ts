// Ported from Z3 (src/parsers/smt2/smt2scanner.cpp, src/parsers/smt2/smt2parser.cpp,
// src/cmd_context/cmd_context.cpp), MIT license, see z3-license.txt.
import { SmtParseError, SmtUnsupportedError } from "../../../errors";
import {
  AstManager,
  getSymbolHash,
  FAMILY_ARITH,
  FAMILY_BASIC,
  FAMILY_DATATYPE,
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
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IMPLIES,
  OP_IS_INT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_REM,
  OP_MUL,
  OP_NOT,
  OP_OR,
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
  OP_UNINTERPRETED,
  OP_XOR,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
  isArithSort,
} from "./ast";
import { getArraySignature, getMapSignature, mkAsArray } from "./array-decl-plugin";
import { BV_OP_NAMES, getBvSignature } from "./bv-decl-plugin";
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
import { replaceFreeVars } from "./var-subst";
import { UpolynomialManager } from "./nlsat/upolynomial";

export interface ParserOptions {
  isIgnoringBadPatterns: boolean;
}

const DEFAULT_PARSER_OPTIONS: ParserOptions = { isIgnoringBadPatterns: true };

// Z3 counts the columns of the first line from 1 and of the others from 0.
export interface SmtToken {
  kind: "(" | ")" | "symbol" | "keyword" | "string" | "numeral" | "decimal" | "bitvector";
  text: string;
  line: number;
  column: number;
  offset: number;
  endOffset: number;
}

export interface SmtList {
  kind: "list";
  items: SExpr[];
  line: number;
  column: number;
  offset: number;
  // Z3 reports an error in making an application at its closing parenthesis.
  end: SmtToken;
  follower?: SmtToken;
}

export type SExpr = SmtToken | SmtList;

interface VarBinding {
  kind: "var";
  depth: number;
  sort: number;
}

interface LetBinding {
  kind: "let";
  depth: number;
  expr: number;
}

type Binding = VarBinding | LetBinding;

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

const UPOLYNOMIALS = new UpolynomialManager();

interface SmtProblem {
  assertions: number[];
  hasCheckSat: boolean;
  rlimit: number;
}

interface ApplicationFrame {
  head: SmtToken;
  indices: number[];
  build?: (args: number[]) => number;
  list: SmtList;
  start: number;
  next: number;
}

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

// The operators that are associative but not flat: xor and => nest to the right, the others to the
// left.
const NESTED_OPS = new Set([OP_XOR, OP_IMPLIES, OP_SUB, OP_DIV, OP_IDIV]);

const COERCING_OPS = new Set([
  OP_ADD,
  OP_SUB,
  OP_UMINUS,
  OP_MUL,
  OP_POWER,
  OP_POWER0,
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

const ARITIES = new Map<number, [number, number]>([
  [OP_AND, [0, Infinity]],
  [OP_OR, [0, Infinity]],
  [OP_ITE, [3, 3]],
  [OP_EQ, [2, Infinity]],
  [OP_DISTINCT, [2, Infinity]],
  ...[OP_NOT, OP_UMINUS, OP_ABS, OP_TO_REAL, OP_TO_INT, OP_IS_INT, ...REAL_FUNCTION_OPS]
    .filter((op) => op !== OP_ATAN2)
    .map((op): [number, [number, number]] => [op, [1, 1]]),
  ...[
    OP_IMPLIES,
    OP_XOR,
    OP_IDIV,
    OP_MOD,
    OP_REM,
    OP_DIV,
    OP_LE,
    OP_GE,
    OP_LT,
    OP_GT,
    OP_POWER,
    OP_POWER0,
    OP_ATAN2,
  ].map((op): [number, [number, number]] => [op, [2, 2]]),
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

const SYMBOL_CHARACTER = /[A-Za-z0-9~!@$%^&*_\-+=<>.?/,]/;

const createScanner = (text: string) => {
  const state = { index: 0, line: 1, lineStart: -1 };
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
      const position = { line: state.line, column: getColumn() };
      const getToken = (kind: SmtToken["kind"], tokenText = text.slice(start, state.index)) => ({
        kind,
        text: tokenText,
        ...position,
        offset: start,
        endOffset: state.index,
      });
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
          advance();
          if (current !== character) continue;
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
        readWhile(/[0-9A-Za-z]/);
        return getToken("bitvector");
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
  return { next, getPosition: () => ({ line: state.line, column: getColumn() }) };
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
      end: open,
    };
    let rootObject: SmtList | undefined;
    for (let current = root; ;) {
      const token = take();
      if (token === undefined)
        throw new SmtParseError("unexpected end of file", scanner.getPosition());
      if (rootObject !== undefined) rootObject.follower = token;
      rootObject = undefined;
      if (token.kind === "(") {
        const list: SmtList = {
          kind: "list",
          items: [],
          line: token.line,
          column: token.column,
          offset: token.offset,
          end: token,
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
      if (isSymbol(current.items[0], "root-obj")) rootObject = current;
      state.depth--;
      const parent = stack.pop();
      if (parent === undefined) return root;
      current = parent;
    }
  };
  const read = (): SmtList | undefined => {
    const token = take();
    if (token === undefined) return undefined;
    if (token.kind !== "(") throw new SmtParseError("invalid command, '(' expected", token);
    state.depth = 1;
    return readList(token);
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
  return { read, skip };
};

export const isSymbol = (sexpr: SExpr | undefined, text?: string): sexpr is SmtToken =>
  sexpr !== undefined && sexpr.kind === "symbol" && (text === undefined || sexpr.text === text);

const expectList = (sexpr: SExpr | undefined, message: string, at: SExpr): SmtList => {
  if (sexpr?.kind !== "list") throw new SmtParseError(message, sexpr ?? at);
  return sexpr;
};

const expectSymbol = (sexpr: SExpr | undefined, message: string, at: SExpr): SmtToken => {
  if (!isSymbol(sexpr)) throw new SmtParseError(message, sexpr ?? at);
  return sexpr;
};

export const createSmtlibReader = (
  manager: AstManager,
  logic?: string,
  options: ParserOptions = DEFAULT_PARSER_OPTIONS,
) => {
  const hasArith = logic === undefined || logicHasArith(logic);
  const hasBv = logic === undefined || logicHasBv(logic);
  const isNumeralAsReal = logic !== undefined && logicHasRealsOnly(logic);
  const logicChecker = createLogicChecker(manager, logic);
  const sortDecls = new Map<string, SortDecl>([
    ["Bool", { kind: "sort", sort: SORT_BOOL }],
    ...(hasArith
      ? [
          ["Int", { kind: "sort", sort: SORT_INT }] as const,
          ["Real", { kind: "sort", sort: SORT_REAL }] as const,
        ]
      : []),
    ...(logic === undefined ? [["List", { kind: "list" }] as const] : []),
  ]);
  const funcs = new Map<string, readonly number[]>();
  const macros = new Map<string, Macro>();
  const lastNamed = { name: "", expr: -1 };
  const notifiedSorts = new Set<number>();
  const undo: (() => void)[] = [];
  const scopeStarts: number[] = [];
  const scopes: Map<string, Binding>[] = [];
  const binders = { depth: 0 };

  const declare = <Value>(names: Map<string, Value>, name: string, value: Value) => {
    const previous = names.get(name);
    undo.push(() => {
      if (previous === undefined) names.delete(name);
      else names.set(name, previous);
    });
    names.set(name, value);
  };

  const hasArrays = logic === undefined || logicHasArray(logic);
  const hasFpa = logic === undefined || logicHasFpa(logic);
  const hasArrayExtensions = logic === undefined || ARRAY_EXTENSION_LOGICS.has(logic);
  const hasSeq = logic === undefined || logicHasSeq(logic);

  const getFirstFunc = (name: string) => funcs.get(name)?.[0];

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
    declare(funcs, name, [...existing, decl]);
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
    undo.push(() => notifiedSorts.delete(sort));
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

  const instantiateSort = (decl: SortDecl, parameters: number[], at: SExpr): number => {
    if (decl.kind === "sort") return decl.sort;
    if (decl.kind === "list") {
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
      return instantiateSort(list, parameters, at);
    }
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
    if (!isSymbol(head)) throw new SmtParseError("invalid sort, symbol or '_' expected", head);
    const isArray = ARRAY_SORT_NAMES.has(head.text) || (head.text === "Set" && hasArrayExtensions);
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
      if (THEORY_SORTS.has(head.text) && !isArray)
        throw new SmtUnsupportedError(`the sort ${head.text}`);
      throw new SmtParseError(`unknown sort '${head.text}'`, head);
    }
    const parameters = sexpr.items.slice(1).map((item) => parseSort(item, context, bindings));
    if (parameters.length !== getSortDeclArity(decl))
      throw new SmtParseError("invalid number of parameters to sort constructor", sexpr.end);
    return instantiateSort(decl, parameters, sexpr);
  };

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
    if (sexpr.kind === "list") {
      if (!isSymbol(sexpr.items[0], "_")) return parseParametricSort(sexpr, context, bindings);
      if (hasFpa && isSymbol(sexpr.items[1], "FloatingPoint"))
        return mkFloatSort(sexpr.items.slice(2), sexpr);
      const width = sexpr.items[2];
      if (!hasBv && isSymbol(sexpr.items[1], "BitVec"))
        throw new SmtParseError("unknown sort 'BitVec'", width ?? sexpr.end);
      if (
        !isSymbol(sexpr.items[1], "BitVec") ||
        sexpr.items.length !== 3 ||
        width.kind !== "numeral"
      )
        throw new SmtUnsupportedError("indexed sorts");
      if (BigInt(width.text) === 0n)
        throw new SmtParseError("bit-vector size must be greater than zero", sexpr.end);
      return manager.mkBvSort(Number(width.text));
    }
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
    if (THEORY_SORTS.has(sexpr.text)) throw new SmtUnsupportedError(`the sort ${sexpr.text}`);
    throw new SmtParseError(
      `${context === "" ? "" : `${context}: `}unknown sort '${sexpr.text}'`,
      sexpr,
    );
  };

  const lookup = (name: string) => {
    for (let index = scopes.length - 1; index >= 0; index--) {
      const binding = scopes[index].get(name);
      if (binding !== undefined) return binding;
    }
    return undefined;
  };

  const getJoin = (args: number[]) => {
    const argSorts = args.map((arg) => manager.sorts[arg]);
    if (!argSorts.every(isArithSort)) return argSorts[0];
    return argSorts.includes(SORT_REAL) ? SORT_REAL : SORT_INT;
  };

  const getDomainSort = (op: number, args: number[]) => {
    if (op === OP_ITE) return getJoin(args.slice(1));
    if (op === OP_EQ || op === OP_DISTINCT) return getJoin(args);
    if (COERCING_OPS.has(op)) return getJoin(args) === SORT_REAL ? SORT_REAL : SORT_INT;
    if (op === OP_ABS || op === OP_TO_REAL || op === OP_TO_INT) return manager.sorts[args[0]];
    if (op === OP_IDIV || op === OP_MOD || op === OP_REM) return SORT_INT;
    if (op === OP_DIV || op === OP_IS_INT || REAL_FUNCTION_OPS.has(op)) return SORT_REAL;
    return SORT_BOOL;
  };

  const coerce = (arg: number, sort: number) => {
    const argSort = manager.sorts[arg];
    if (argSort === sort || !isArithSort(argSort) || !isArithSort(sort)) return arg;
    return sort === SORT_REAL
      ? manager.mkApp(OP_TO_REAL, [arg], SORT_REAL)
      : manager.mkApp(OP_TO_INT, [arg], SORT_INT);
  };

  const mkApp = (decl: number, inputArgs: number[], at: SExpr, domainSort?: number) => {
    const op = manager.funcDecls[decl].op;
    const name = manager.funcDecls[decl].name;
    const isUninterpreted =
      op === OP_UNINTERPRETED || manager.funcDecls[decl].family === FAMILY_DATATYPE;
    const domain = manager.funcDecls[decl].domain;
    const builtinSort = isUninterpreted ? -1 : (domainSort ?? getDomainSort(op, inputArgs));
    const getExpected = (index: number) =>
      isUninterpreted ? domain[index] : op === OP_ITE && index === 0 ? SORT_BOOL : builtinSort;
    const args = inputArgs.map((arg, index) =>
      getExpected(index) === undefined ? arg : coerce(arg, getExpected(index)),
    );
    const arity = ARITIES.get(op) ?? [1, Infinity];
    const isArityOk = isUninterpreted
      ? args.length === domain.length
      : args.length >= arity[0] && args.length <= arity[1];
    const isBuiltinArith = manager.funcDecls[decl].family === FAMILY_ARITH;
    const isWellSorted =
      isArityOk &&
      (!isBuiltinArith || isArithSort(builtinSort)) &&
      args.every((arg, index) => manager.sorts[arg] === getExpected(index));
    if (!isWellSorted) throw new SmtParseError(`ill-sorted application of ${name}`, at);
    return manager.mkApp(
      decl,
      args,
      isUninterpreted ? manager.funcDecls[decl].range : (RANGES.get(op) ?? builtinSort),
    );
  };

  const mkChain = (op: number, args: number[], at: SExpr) => {
    const domainSort = getDomainSort(op, args);
    const pairs: number[] = [];
    for (let index = 0; index + 1 < args.length; index++)
      pairs.push(mkApp(op, [args[index], args[index + 1]], at, domainSort));
    return pairs.length === 1 ? pairs[0] : mkApp(OP_AND, pairs, at);
  };

  const rejectPattern = (message: string, at: SExpr) => {
    if (!options.isIgnoringBadPatterns) throw new SmtParseError(message, at);
    return undefined;
  };

  const parsePattern = (sexpr: SExpr, at: SExpr) => {
    if (sexpr.kind === ")") {
      // Z3 skips a bad pattern as an s-expression, which cannot start with ')'.
      if (options.isIgnoringBadPatterns)
        throw new SmtParseError("invalid s-expression, unexpected ')'", sexpr);
      throw new SmtParseError("invalid pattern, '(' expected", sexpr);
    }
    if (sexpr.kind !== "list") return rejectPattern("invalid pattern, '(' expected", sexpr);
    if (sexpr.items.length === 0) return rejectPattern("invalid empty pattern", at);
    const head = sexpr.items[0];
    if (head.kind === "list") return manager.mkPattern(sexpr.items.map(parseTerm));
    const decl = head.text === "true" || head.text === "false" ? -1 : getFirstFunc(head.text);
    if (decl === -1 || (decl !== undefined && manager.funcDecls[decl].domain.length === 0))
      return rejectPattern("invalid constant pattern", head);
    if (head.kind !== "symbol")
      throw new SmtParseError("invalid pattern, '(' or identifier expected", head);
    return manager.mkPattern([parseTerm(sexpr)]);
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

  const bindSortedVars = (sexpr: SExpr | undefined, at: SExpr) => {
    const message = "invalid sorted variables, syntax error: ((<symbol> <sort>)*) expected";
    const declarations = expectList(sexpr, message, at).items.map((declaration) =>
      expectList(declaration, message, declaration),
    );
    const scope = new Map<string, Binding>();
    const names = declarations.map(
      (declaration) => expectSymbol(declaration.items[0], message, declaration).text,
    );
    const varSorts = declarations.map((declaration, index) => {
      if (declaration.items.length !== 2) throw new SmtParseError(message, declaration.end);
      const sort = parseSort(declaration.items[1], "invalid sorted variables");
      scope.set(names[index], { kind: "var", depth: binders.depth + index, sort });
      return sort;
    });
    scopes.push(scope);
    binders.depth += varSorts.length;
    return { names, varSorts };
  };

  const unbindSortedVars = (count: number) => {
    scopes.pop();
    binders.depth -= count;
  };

  const parseQuantifier = (list: SmtList, isForall: boolean) => {
    if (list.items.length !== 3)
      throw new SmtParseError(
        "invalid quantified expression, syntax error: (forall|exists ((<symbol> <sort>)*) <expr>) expected",
        list.end,
      );
    const bound = bindSortedVars(list.items[1], list);
    const varSorts = bound.varSorts;
    // parse_sorted_vars: the variables are created first, the first declared with the largest index,
    // and the parser's stack holds them until the quantifier is created.
    const boundVars = varSorts.map((sort, index) =>
      manager.mkVar(varSorts.length - 1 - index, sort),
    );
    for (const boundVar of boundVars) manager.incRef(boundVar);
    const bodySExpr = list.items[2];
    const isAnnotated = bodySExpr.kind === "list" && isSymbol(bodySExpr.items[0], "!");
    const annotations = bodySExpr.kind === "list" && isAnnotated ? bodySExpr.items : [];
    const parsedBody = parseTerm(isAnnotated ? annotations[1] : bodySExpr);
    if (manager.sorts[parsedBody] !== SORT_BOOL)
      throw new SmtParseError("expected a formula", bodySExpr);
    const attributes = Array.from(
      { length: Math.ceil((annotations.length - 2) / 2) },
      (_unused, index) => ({
        keyword: annotations[2 + 2 * index],
        value: annotations[3 + 2 * index],
      }),
    );
    const body = attributes.reduce(
      (labeled, attribute) =>
        attribute.keyword.kind === "keyword" &&
        (attribute.keyword.text === ":lblpos" || attribute.keyword.text === ":lblneg")
          ? mkLabel(labeled, attribute.keyword.text === ":lblpos", attribute.value, bodySExpr)
          : labeled,
      parsedBody,
    );
    const patterns: number[] = [];
    const noPatterns: number[] = [];
    for (const attribute of attributes) {
      if (attribute.keyword.kind !== "keyword") continue;
      if (attribute.keyword.text === ":no-pattern") {
        const noPattern = parseTerm(attribute.value ?? list.end);
        manager.incRef(noPattern);
        noPatterns.push(noPattern);
        continue;
      }
      if (attribute.keyword.text !== ":pattern") continue;
      const pattern = parsePattern(
        attribute.value ?? (bodySExpr.kind === "list" ? bodySExpr.end : list.end),
        list.end,
      );
      if (pattern === undefined) continue;
      manager.incRef(pattern);
      patterns.push(pattern);
    }
    const getAttribute = (name: string) => {
      const value = attributes
        .filter(
          (attribute) =>
            attribute.keyword.kind === "keyword" &&
            attribute.keyword.text === name &&
            attribute.value?.kind !== "list",
        )
        .at(-1)?.value;
      return value?.kind === "list" ? undefined : value?.text;
    };
    const weight = Number(getAttribute(":weight") ?? 1);
    const qid = getAttribute(":qid") ?? "";
    const skid = getAttribute(":skolemid");
    unbindSortedVars(varSorts.length);
    // pop_quant_frame: the invalid patterns leave the parser's stack before the quantifier is made,
    // and the valid ones after.
    let numKept = 0;
    for (const pattern of patterns) {
      if (!isValidPattern(pattern, varSorts.length)) {
        rejectPattern("invalid pattern", list.end);
        continue;
      }
      manager.incRef(pattern);
      manager.decRef(patterns[numKept]);
      patterns[numKept] = pattern;
      numKept++;
    }
    for (const removed of patterns.splice(numKept)) manager.decRef(removed);
    if (patterns.length > 0 && noPatterns.length > 0)
      throw new SmtParseError("simultaneous patterns and no-patterns not supported", list.end);
    const quantifier = manager.mkQuantifier({
      isForall,
      sorts: varSorts,
      names: bound.names,
      body,
      patterns,
      noPatterns,
      weight,
      qid,
      ...(skid === undefined ? {} : { skid }),
    });
    for (const pattern of patterns) manager.decRef(pattern);
    for (const noPattern of noPatterns) manager.decRef(noPattern);
    for (const boundVar of boundVars) manager.decRef(boundVar);
    return quantifier;
  };

  const parseLet = (list: SmtList) => {
    const message = "invalid let declaration, symbol expected";
    const scope = new Map<string, Binding>();
    const exprs: number[] = [];
    for (const binding of expectList(list.items[1], message, list).items) {
      const pair = expectList(binding, message, binding);
      const name = expectSymbol(pair.items[0], message, pair);
      const expr = parseTerm(pair.items[1] ?? pair.end);
      exprs.push(expr);
      scope.set(name.text, { kind: "let", depth: binders.depth, expr });
    }
    scopes.push(scope);
    // Z3 takes the last expression on its stack, so a let without a body is its last binding.
    for (const body of list.items.slice(2)) exprs.push(parseTerm(body));
    scopes.pop();
    const result = exprs.at(-1);
    if (result === undefined) throw new SmtParseError("invalid let expression", list.end);
    return result;
  };

  const expandMacro = (macro: Macro, args: number[]) =>
    replaceFreeVars(manager, macro.body, (_variable, index, shift) => {
      const arg = args[args.length - 1 - index];
      return shift === 0
        ? arg
        : replaceFreeVars(manager, arg, (inner, innerIndex, innerShift) =>
            manager.mkVar(innerIndex + innerShift + shift, manager.sorts[inner]),
          );
    });

  const isBvOpName = (name: string) =>
    hasBv &&
    BV_OP_NAMES.has(name) &&
    (!BV_EXTENSION_NAMES.has(name) || logic === undefined || BV_EXTENSION_LOGICS.has(logic));

  const mkBvApp = (name: string, args: number[], indices: number[], at: SExpr) => {
    const op = BV_OP_NAMES.get(name) ?? -1;
    const signature = getBvSignature(
      manager,
      op,
      args.map((arg) => manager.sorts[arg]),
      indices,
    );
    if (typeof signature === "string") throw new SmtParseError(signature, at);
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
    return mkApp(OP_AND, pairs, at);
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

  const parseUpolynomial = (sexpr: SExpr): bigint[] => {
    if (sexpr.kind === "numeral") return UPOLYNOMIALS.set([BigInt(sexpr.text)]);
    if (sexpr.kind === "decimal") {
      const parts = sexpr.text.split(".");
      const value = Rational.of(BigInt(parts[0] + parts[1]), 10n ** BigInt(parts[1].length));
      if (!value.isInt())
        throw new SmtParseError(
          "invalid univariate polynomial, integer coefficient expected",
          sexpr,
        );
      return UPOLYNOMIALS.set([value.num]);
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
      return UPOLYNOMIALS.pw(parseUpolynomial(operands[0]), Number(exponent.text));
    }
    const combine =
      head.text === "+"
        ? UPOLYNOMIALS.add
        : head.text === "-"
          ? UPOLYNOMIALS.sub
          : head.text === "*"
            ? UPOLYNOMIALS.mul
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
    if (head.text === "-" && operands.length === 1) return UPOLYNOMIALS.neg(first);
    return operands
      .slice(1)
      .reduce(
        (result, operand) => combine.call(UPOLYNOMIALS, result, parseUpolynomial(operand)),
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
      throw new SmtParseError("invalid root-obj, ')' expected", list.items[3]);
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

  const parseBvNumeral = (list: SmtList) => {
    const name = list.items[1];
    const indices = list.items.slice(2);
    if (
      isSymbol(name) &&
      isSeqOpName(name.text) &&
      indices.every((index) => index.kind === "numeral")
    )
      return mkSeqTerm(
        name.text,
        [],
        indices.map((index) => (index.kind === "list" ? 0 : Number(index.text))),
        list.end,
      );
    if (
      isSymbol(name) &&
      isFpaOpName(name.text) &&
      indices.every((index) => index.kind === "numeral")
    ) {
      const signature = getFpaSignature(
        manager,
        FPA_OP_NAMES.get(name.text) ?? -1,
        indices.map((index) => (index.kind === "list" ? 0 : Number(index.text))),
        [],
      );
      if (typeof signature === "string")
        throw new SmtParseError(signature, { line: list.end.line, column: list.end.column + 1 });
      return mkFpaAppOf(manager, signature, []);
    }
    const value = isSymbol(name) ? /^bv([0-9]+)$/.exec(name.text) : null;
    if (value === null) throw new SmtUnsupportedError("indexed identifiers");
    const width = list.items[2];
    if (list.items.length !== 3 || width.kind !== "numeral")
      throw new SmtParseError("invalid bit-vector constant, index expected", list.end);
    if (BigInt(width.text) === 0n)
      throw new SmtParseError("bit-vector size must be greater than zero", list.end);
    return manager.mkBvNumeral(BigInt(value[1]), Number(width.text));
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
    const found =
      candidates.find((decl) =>
        manager.funcDecls[decl].domain.every((sort, index) => sort === argSorts[index]),
      ) ?? candidates.at(-1);
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
    if (declared !== undefined) return mkApp(getConstructorIs(manager, declared), args, at);
    const argSort = args.length === 1 ? manager.sorts[args[0]] : -1;
    if (argSort === -1 || !manager.isDatatypeSort(argSort))
      throw new SmtUnsupportedError("the operator is");
    const constructor = getDatatypeConstructors(manager, argSort).find(
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
    if (manager.funcDecls[accessor].op !== OP_DT_ACCESSOR)
      throw new SmtUnsupportedError("the operator update-field");
    return mkApp(mkUpdateField(manager, accessor), args, at);
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
    const declared = funcs
      .get(name.text)
      ?.find(
        (decl) =>
          manager.funcDecls[decl].range === range &&
          manager.funcDecls[decl].domain.length === domain.length &&
          manager.funcDecls[decl].domain.every((sort, index) => sort === domain[index]),
      );
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
    if (args.length > 0 && lookup(name) !== undefined)
      return args.reduce(
        (array, arg) => mkArrayTerm(OP_SELECT, [array, arg], [], at),
        parseLeaf(head),
      );
    if (indices.length > 0)
      return isFpaOpName(name)
        ? mkFpaTerm(name, args, indices, at)
        : isSeqOpName(name)
          ? mkSeqTerm(name, args, indices, at)
          : mkBvApp(name, args, indices, at);
    const macro = macros.get(name);
    if (macro !== undefined) {
      const coerced = args.map((arg, index) => coerce(arg, macro.domain[index]));
      if (
        coerced.length !== macro.domain.length ||
        coerced.some((arg, index) => manager.sorts[arg] !== macro.domain[index])
      )
        throw new SmtParseError(`ill-sorted application of ${name}`, at);
      return expandMacro(macro, coerced);
    }
    const decls = funcs.get(name);
    const declared = decls === undefined ? undefined : mkDeclaredApp(name, decls, args, range, at);
    if (declared !== undefined) return declared;
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
    const chainable = CHAINABLE_OPS.get(builtin);
    const arithOp =
      chainable ?? (builtin === "~" ? OP_UMINUS : (BUILTIN_OPS.get(builtin) ?? transcendentalOp));
    if (
      args.length === 0 &&
      arithOp !== undefined &&
      manager.funcDecls[arithOp].family === FAMILY_ARITH
    )
      throw new SmtParseError("no arguments supplied to arithmetical operator", head);
    if (chainable === OP_EQ && args.length < 2)
      throw new SmtParseError(
        getUnknownConstantMessage(name, args, undefined),
        args.length === 0 ? head : at,
      );
    if (chainable !== undefined) return mkChain(chainable, args, at);
    if (builtin === "~") return mkApp(OP_UMINUS, args, at);
    if (builtin === "-" && args.length === 1) return mkApp(OP_UMINUS, args, at);
    const op = BUILTIN_OPS.get(builtin) ?? transcendentalOp;
    if (op === undefined) {
      if (THEORY_OPERATOR.test(name) || THEORY_OPERATORS.has(name))
        throw new SmtUnsupportedError(`the operator ${name}`);
      const instance = mkDatatypeInstanceApp(name, args, at);
      if (instance !== undefined) return instance;
      throw new SmtParseError(
        getUnknownConstantMessage(name, args, undefined),
        args.length === 0 ? head : at,
      );
    }
    // xor is associative, so ast_manager::mk_app takes fewer than two arguments, which
    // bool_rewriter reduces to false or the argument.
    if (op === OP_XOR && args.length < 2) {
      if (args.some((arg) => manager.sorts[arg] !== SORT_BOOL))
        throw new SmtParseError(`ill-sorted application of ${name}`, at);
      return args[0] ?? manager.falseExpr;
    }
    if (args.length <= 2 || !NESTED_OPS.has(op)) return mkApp(op, args, at);
    const domainSort = getDomainSort(op, args);
    return op === OP_XOR || op === OP_IMPLIES
      ? args
          .slice(0, -1)
          .reduceRight(
            (right, left) => mkApp(op, [left, right], at, domainSort),
            args[args.length - 1],
          )
      : args.slice(1).reduce((left, right) => mkApp(op, [left, right], at, domainSort), args[0]);
  };

  const parseLeaf = (sexpr: SExpr): number => {
    if (sexpr.kind === "numeral")
      return isNumeralAsReal
        ? manager.mkRealNumeral(Rational.of(BigInt(sexpr.text), 1n))
        : manager.mkNumeral(BigInt(sexpr.text));
    if (sexpr.kind === "decimal") {
      const parts = sexpr.text.split(".");
      return manager.mkRealNumeral(
        Rational.of(BigInt(parts[0] + parts[1]), 10n ** BigInt(parts[1].length)),
      );
    }
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
      if (sexpr.text === "true") return manager.trueExpr;
      if (sexpr.text === "false") return manager.falseExpr;
      const binding = lookup(sexpr.text);
      if (binding?.kind === "var")
        return manager.mkVar(binders.depth - 1 - binding.depth, binding.sort);
      // Z3's var_shifter moves the free variables of a let binding up by the binders since. Its cache
      // holds the terms it makes, but this parser holds no references, so it rebuilds the binding
      // with replaceFreeVars.
      if (binding !== undefined)
        return binders.depth === binding.depth
          ? binding.expr
          : replaceFreeVars(manager, binding.expr, (variable, index, shift) =>
              manager.mkVar(index + shift + binders.depth - binding.depth, manager.sorts[variable]),
            );
      return parseApp(sexpr, [], sexpr);
    }
    if (sexpr.kind !== "list") throw new SmtParseError("invalid expression", sexpr);
    const head = sexpr.items[0];
    if (isSymbol(head, "forall") || isSymbol(head, "exists"))
      return parseQuantifier(sexpr, head.text === "forall");
    if (isSymbol(head, "let")) return parseLet(sexpr);
    // Each attribute applies to the expression the attributes before it made.
    return sexpr.items.slice(2).reduce(
      (annotated, keyword, index, attributes) => {
        if (keyword.kind !== "keyword") return annotated;
        const value = attributes[index + 1];
        if (keyword.text === ":lblpos" || keyword.text === ":lblneg")
          return mkLabel(annotated, keyword.text === ":lblpos", value, sexpr);
        if (keyword.text !== ":named") return annotated;
        const name = expectSymbol(value, "invalid attribute value, symbol expected", sexpr).text;
        manager.incRef(annotated);
        lastNamed.name = name;
        lastNamed.expr = annotated;
        manager.mkMacro(name, annotated);
        declare(macros, name, { domain: [], range: manager.sorts[annotated], body: annotated });
        return annotated;
      },
      parseTerm(sexpr.items[1] ?? sexpr.end),
    );
  };

  const mkLabel = (expr: number, isPositive: boolean, value: SExpr | undefined, at: SExpr) => {
    const name = expectSymbol(value, "invalid attribute value, symbol expected", at).text;
    if (manager.sorts[expr] !== SORT_BOOL)
      throw new SmtParseError("invalid labeled expression, expression must have Bool sort", at);
    return manager.mkLabel(isPositive, [name], expr);
  };

  const parseTerm = (sexpr: SExpr): number => {
    const frames: ApplicationFrame[] = [];
    const results: number[] = [];
    const enter = (current: SExpr) => {
      if (current.kind !== "list") {
        results.push(parseLeaf(current));
        return;
      }
      const head = current.items[0];
      if (head === undefined)
        throw new SmtParseError("invalid expression, unexpected ')'", current.end);
      if (head.kind === "list") {
        const name = head.items[1];
        const indices = head.items.slice(2);
        if (
          hasArrays &&
          isSymbol(head.items[0], "as") &&
          isSymbol(name, "const") &&
          head.items.length === 3
        ) {
          const sort = parseSort(head.items[2], "");
          frames.push({
            head: name,
            indices: [],
            build: (args) => mkArrayTerm(OP_CONST_ARRAY, args, [sort], current.end),
            list: current,
            start: results.length,
            next: 1,
          });
          return;
        }
        if (
          hasArrays &&
          hasArrayExtensions &&
          isSymbol(head.items[0], "_") &&
          isSymbol(name, "map") &&
          head.items.length === 3
        ) {
          const mapped = parseFuncDeclRef(head.items[2]);
          frames.push({
            head: name,
            indices: [],
            build: (args) => mkMapTerm(mapped, args, current.end),
            list: current,
            start: results.length,
            next: 1,
          });
          return;
        }
        const indexed = head.items[2];
        if (
          isSymbol(head.items[0], "_") &&
          (isSymbol(name, "is") || isSymbol(name, "update-field")) &&
          isSymbol(indexed) &&
          head.items.length === 3
        ) {
          frames.push({
            head: name,
            indices: [],
            build: (args) =>
              name.text === "is"
                ? mkIsApp(indexed, args, current.end)
                : mkUpdateFieldApp(indexed, args, current.end),
            list: current,
            start: results.length,
            next: 1,
          });
          return;
        }
        if (isSymbol(head.items[0], "as") && isSymbol(name) && head.items.length === 3) {
          const range = parseSort(head.items[2], "Invalid qualified identifier");
          frames.push({
            head: name,
            indices: [],
            build: (args) => parseApp(name, args, current.end, [], range),
            list: current,
            start: results.length,
            next: 1,
          });
          return;
        }
        if (
          isSymbol(head.items[0], "_") &&
          isSymbol(name) &&
          isPbOpName(name.text) &&
          indices.every((index) => index.kind === "numeral")
        ) {
          const parameters = indices.map((index) =>
            Rational.of(BigInt(index.kind === "list" ? 0 : index.text)),
          );
          frames.push({
            head: name,
            indices: [],
            build: (args) => mkPbTerm(name.text, args, parameters, current.end),
            list: current,
            start: results.length,
            next: 1,
          });
          return;
        }
        if (
          !isSymbol(head.items[0], "_") ||
          !isSymbol(name) ||
          !(isBvOpName(name.text) || isFpaOpName(name.text) || isSeqOpName(name.text)) ||
          !indices.every((index) => index.kind === "numeral")
        )
          throw new SmtUnsupportedError("indexed and qualified identifiers");
        frames.push({
          head: name,
          indices: indices.map((index) => (index.kind === "list" ? 0 : Number(index.text))),
          list: current,
          start: results.length,
          next: 1,
        });
        return;
      }
      if (head.kind !== "symbol")
        throw new SmtParseError("invalid function application, symbol expected", head);
      if (head.text === "_") {
        results.push(parseBvNumeral(current));
        return;
      }
      const qualified = current.items[1];
      if (head.text === "as" && isSymbol(qualified) && current.items.length === 3) {
        results.push(
          parseApp(
            qualified,
            [],
            qualified,
            [],
            parseSort(current.items[2], "Invalid qualified identifier"),
          ),
        );
        return;
      }
      if (head.text === "root-obj") {
        results.push(parseRootObj(current));
        return;
      }
      if (head.text === "as" || head.text === "lambda" || head.text === "match")
        throw new SmtUnsupportedError(`the expression ${head.text}`);
      if (["forall", "exists", "let", "!"].includes(head.text)) results.push(parseLeaf(current));
      else frames.push({ head, indices: [], list: current, start: results.length, next: 1 });
    };
    enter(sexpr);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      if (frame.next < frame.list.items.length) {
        enter(frame.list.items[frame.next++]);
        continue;
      }
      frames.pop();
      if (frame.list.items.length === 1)
        throw new SmtParseError("invalid function application, arguments missing", frame.list.end);
      const args = results.splice(frame.start);
      results.push(
        frame.build?.(args) ?? parseApp(frame.head, args, frame.list.end, frame.indices),
      );
    }
    return results[0];
  };

  const parseDomain = (sexpr: SExpr | undefined, at: SExpr) => {
    const context = "Parsing function declaration. Expecting sort list '('";
    return expectList(sexpr, context, at).items.map((item) => parseSort(item, context));
  };

  const parseSortParameters = (sexpr: SExpr | undefined, message: string, at: SExpr) =>
    expectList(sexpr, "invalid sort declaration, parameters missing", at).items.map(
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
    if (sexpr.kind !== "symbol")
      throw new SmtParseError("invalid sort, symbol, '_' or '(' expected", sexpr);
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
      const constructor = expectList(
        item,
        "invalid datatype declaration, '(' or ')' expected",
        item,
      );
      const name = expectSymbol(
        constructor.items[0],
        "invalid constructor declaration, symbol (constructor name) expected",
        constructor,
      ).text;
      const accessors = constructor.items.slice(1).map((accessorItem) => {
        const accessor = expectList(
          accessorItem,
          "invalid datatype declaration, '(' or ')' expected",
          accessorItem,
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
          throw new SmtParseError("invalid accessor declaration, ')' expected", accessor.items[2]);
        return { name: accessorName, range };
      });
      return { name, recognizer: `is-${name}`, accessors };
    });
  };

  const parseDatatypeBody = (
    sexpr: SExpr | undefined,
    datatypeIndexes: ReadonlyMap<string, number>,
    missing: string[],
    at: SExpr,
  ) => {
    const body = expectList(sexpr, "invalid datatype declaration, '(' expected", at);
    if (!isSymbol(body.items[0], "par"))
      return {
        parameters: [],
        constructors: parseConstructors(body.items, NO_BINDINGS, datatypeIndexes, missing, body),
      };
    const parameters = parseSortParameters(
      body.items[1],
      "invalid sort parameter, symbol or ')' expected",
      body,
    );
    const constructors = expectList(
      body.items[2],
      "invalid constructor declaration after par, '(' expected",
      body,
    );
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

  const commitDatatypes = (defs: DatatypeDef[], missing: string[], at: SExpr, end: SExpr) => {
    if (missing.length > 0)
      throw new SmtParseError(`invalid datatype declaration, unknown sort '${missing[0]}'`, at);
    const sorts = mkDatatypes(manager, defs);
    if (typeof sorts === "string") throw new SmtParseError(sorts, end);
    for (const def of defs) undo.push(() => removeDatatype(manager, def.name));
    defs.forEach((def, index) => {
      if (def.parameters.length === 0) insertDatatypeDecls(sorts[index], end);
    });
    for (const def of defs) {
      const names = def.constructors.flatMap((constructor) =>
        constructor.accessors.map((accessor) => accessor.name),
      );
      const duplicated = names.find((name, index) => names.indexOf(name) !== index);
      if (duplicated !== undefined)
        throw new SmtParseError(
          `invalid datatype declaration, repeated accessor identifier '${duplicated}'`,
          at,
        );
    }
  };

  const declareSortDecl = (name: string, decl: SortDecl, at: SExpr) => {
    if (sortDecls.has(name)) throw new SmtParseError(`sort already defined ${name}`, at);
    declare(sortDecls, name, decl);
  };

  const declareDatatypes = (list: SmtList) => {
    const declaration = expectList(
      list.items[1],
      "invalid sort declaration, parameters missing",
      list,
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
      const sortDeclaration = expectList(item, "invalid sort declaration, '(' expected", item);
      const name = expectSymbol(
        sortDeclaration.items[0],
        "invalid sort name, identified expected",
        sortDeclaration,
      ).text;
      const arity = sortDeclaration.items[1];
      if (arity?.kind !== "numeral")
        throw new SmtParseError(
          "invalid sort declaration, arity expected",
          arity ?? sortDeclaration.end,
        );
      if (sortDeclaration.items.length > 2)
        throw new SmtParseError("invalid sort declaration, ')' expected", sortDeclaration.items[2]);
      datatypeIndexes.set(name, index);
      names.push(name);
      arities.push(Number(arity.text));
      declareSortDecl(
        name,
        { kind: "datatype", name, arity: Number(arity.text), siblings: [], instances: new Map() },
        sortDeclaration,
      );
    });
    const bodies = expectList(list.items[2], "invalid datatype declaration, '(' expected", list);
    // A datatype of the older syntax may refer to any datatype of its declaration.
    if (!isSmt26)
      bodies.items.forEach((item, index) => {
        const datatype = expectList(
          item,
          "invalid datatype declaration, '(' or ')' expected",
          item,
        );
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
          parseDatatypeBody(item, datatypeIndexes, missing, list).constructors,
        );
      }
      const datatype = expectList(item, "invalid datatype declaration, '(' or ')' expected", item);
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
    commitDatatypes(defs, missing, declaration, list.end);
    if (isSmt26) return;
    for (const def of defs)
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
  };

  const declareDatatype = (list: SmtList) => {
    const name = expectSymbol(list.items[1], "unexpected token used as datatype name", list);
    const missing: string[] = [];
    const bodyList = list.items[2];
    const arity =
      bodyList?.kind === "list" &&
      isSymbol(bodyList.items[0], "par") &&
      bodyList.items[1]?.kind === "list"
        ? bodyList.items[1].items.length
        : 0;
    declareSortDecl(
      name.text,
      { kind: "datatype", name: name.text, arity, siblings: [], instances: new Map() },
      name,
    );
    const body = parseDatatypeBody(bodyList, new Map([[name.text, 0]]), missing, list);
    if (list.items.length > 3)
      throw new SmtParseError("invalid end of datatype declaration, ')' expected", list.items[3]);
    commitDatatypes(
      [mkDatatypeDef(manager, name.text, body.parameters, body.constructors)],
      missing,
      name,
      list.end,
    );
  };

  // parse_rec_fun_decl: the variables are bound only while the range is parsed.
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
    const bound = bindSortedVars(variables, body);
    const parsed = parseTerm(body);
    unbindSortedVars(bound.varSorts.length);
    const range = manager.funcDecls[decl].range;
    if (manager.sorts[parsed] !== range)
      throw new SmtParseError(
        `invalid function definition, sort mismatch. Expcected ${manager.getSortName(range)} but function body has sort ${manager.getSortName(manager.sorts[parsed])}`,
        next,
      );
    manager.setRecFunBody(decl, parsed);
  };

  const declareCommand = (list: SmtList) => {
    const name = list.items[0].kind === "list" ? "" : list.items[0].text;
    if (name === "define-fun-rec") {
      const decl = declareRecFun(list.items.slice(1), list.end);
      insertFunc(decl, list.items[4] ?? list.end);
      defineRecFun(decl, list.items[2], list.items[4] ?? list.end, list.items[5] ?? list.end);
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
      const extra = bodies.items[signatures.length];
      if (extra !== undefined)
        throw new SmtParseError("invalid recursive function definition, ')' expected", extra);
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
    const symbol = expectSymbol(list.items[1], "invalid declaration, symbol expected", list);
    if (name === "declare-sort") {
      if (sortDecls.has(symbol.text))
        throw new SmtParseError("invalid sort declaration, sort already declared/defined", symbol);
      const arity = list.items[2];
      if (arity !== undefined && arity.kind !== "numeral")
        throw new SmtParseError(
          "invalid sort declaration, arity (<numeral>) or ')' expected",
          arity,
        );
      if (list.items.length > 3)
        throw new SmtParseError("invalid sort declaration, ')' expected", list.items[3]);
      declare(
        sortDecls,
        symbol.text,
        arity === undefined || arity.text === "0"
          ? { kind: "sort", sort: manager.mkSort(symbol.text) }
          : { kind: "user", name: symbol.text, arity: Number(arity.text) },
      );
      return;
    }
    if (name === "define-sort") {
      if (sortDecls.has(symbol.text))
        throw new SmtParseError("invalid sort definition, sort already declared/defined", symbol);
      const parameters = parseSortParameters(
        list.items[2],
        "invalid sort parameter, symbol or ')' expected",
        list,
      );
      const body = list.items[3] ?? list.end;
      if (parameters.length === 0) {
        declare(sortDecls, symbol.text, {
          kind: "sort",
          sort: parseSort(body, "invalid sort definition"),
        });
        return;
      }
      parseSort(body, "", bindTypeParameters(parameters));
      declare(sortDecls, symbol.text, { kind: "definition", parameters, body });
      return;
    }
    if (name === "define-fun" || name === "define-const") {
      const isConst = name === "define-const";
      const bound = isConst ? { names: [], varSorts: [] } : bindSortedVars(list.items[2], list);
      const range = parseSort(
        list.items[isConst ? 2 : 3] ?? list.end,
        isConst ? "Invalid constant definition" : "Invalid function definition",
      );
      const body = parseTerm(list.items[isConst ? 3 : 4] ?? list.end);
      if (!isConst) unbindSortedVars(bound.varSorts.length);
      const coerced = coerce(body, range);
      if (manager.sorts[coerced] !== range)
        throw new SmtParseError(
          isConst
            ? "invalid constant definition, sort mismatch"
            : "invalid function/constant definition, sort mismatch",
          list.end,
        );
      manager.incRef(coerced);
      declare(macros, symbol.text, { domain: bound.varSorts, range, body: coerced });
      return;
    }
    const domain = name === "declare-fun" ? parseDomain(list.items[2], list) : [];
    const range = parseSort(
      list.items[name === "declare-fun" ? 3 : 2] ?? list.end,
      name === "declare-fun" ? "Invalid function declaration" : "Invalid constant declaration",
    );
    // builtin_signature_collides and is_transcendental_shadow_decl each apply the builtin of that
    // name to fresh variables, which they then release.
    for (let round = 0; round < 2; round++) {
      const vars = domain.map((sort, index) => manager.mkVar(index, sort));
      for (const domainVar of vars) manager.incRef(domainVar);
      for (const domainVar of vars) manager.decRef(domainVar);
    }
    const decl = manager.mkFuncDecl(symbol.text, domain, range);
    checkDecl(decl, list.end);
    if (macros.has(symbol.text))
      throw new SmtUnsupportedError(`the overloaded symbol ${symbol.text}`);
    const existing = funcs.get(symbol.text) ?? [];
    if (
      existing.some(
        (decl) =>
          manager.funcDecls[decl].range === range &&
          manager.funcDecls[decl].domain.length === domain.length &&
          manager.funcDecls[decl].domain.every((sort, index) => sort === domain[index]),
      )
    )
      throw new SmtParseError(
        `invalid declaration, ${domain.length === 0 ? "constant" : "function"} '${symbol.text}' (with the given signature) already declared`,
        list.end,
      );
    declare(funcs, symbol.text, [...existing, decl]);
  };

  const parseFormula = (sexpr: SExpr) => {
    const assertion = parseTerm(sexpr);
    if (manager.sorts[assertion] !== SORT_BOOL)
      throw new SmtParseError("invalid assert command, term is not Boolean", sexpr);
    manager.incRef(assertion);
    return assertion;
  };

  // An assertion is named when the last name of its term is its own.
  const parseAssertion = (sexpr: SExpr) => {
    lastNamed.expr = -1;
    const formula = parseFormula(sexpr);
    return { formula, name: lastNamed.expr === formula ? lastNamed.name : undefined };
  };

  const push = () => scopeStarts.push(undo.length);

  const pop = () => {
    const start = scopeStarts.pop() ?? 0;
    for (const restore of undo.splice(start).reverse()) restore();
  };

  const isUsed = (name: string) => funcs.has(name) || BUILTIN_NAMES.has(name);

  const isClashing = (decl: number) => {
    const domain = manager.funcDecls[decl].domain;
    const decls = funcs.get(String(manager.funcDecls[decl].name)) ?? [];
    return (
      decls.includes(decl) &&
      decls.some(
        (other) =>
          other !== decl &&
          manager.funcDecls[other].domain.length === domain.length &&
          manager.funcDecls[other].domain.every((sort, index) => sort === domain[index]),
      )
    );
  };

  // The first declaration of each name, in the slot order of cmd_context's dictionary.
  const getDeclaredFuncs = () => {
    const table = new ObjMap<true>((decl) => getSymbolHash(manager.funcDecls[decl].name));
    for (const decls of funcs.values()) table.set(decls[0], true);
    return [...table.keys()];
  };

  return {
    declareCommand,
    insertFunc,
    getFuncs: (name: string) => funcs.get(name) ?? [],
    parseTerm,
    parseSort: (sexpr: SExpr) => parseSort(sexpr, ""),
    parseFormula,
    parseAssertion,
    getLogicError: logicChecker.checkExpr,
    push,
    pop,
    isUsed,
    isClashing,
    getDeclaredFuncs,
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
  const state = { reader: createSmtlibReader(manager), logic: "", rlimit: 0 };
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
      if (!isSymbol(option))
        throw new SmtParseError("invalid logic name, symbol expected", option ?? list.end);
      if (state.logic !== "") throw new SmtParseError("the logic has already been set", list.end);
      if (assertions.length > 0)
        throw new SmtParseError("logic must be set before initialization", list.end);
      if (!isSupportedLogic(option.text)) return;
      state.logic = option.text;
      state.reader = createSmtlibReader(manager, option.text);
    } else if (DECLARATIONS.has(name)) {
      if (name.startsWith("define-"))
        throw new SmtUnsupportedError(`the command ${name} is not supported`);
      state.reader.declareCommand(list);
    } else if (name === "assert") {
      const assertion = state.reader.parseFormula(list.items[1] ?? list.end);
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
      const list = commands.read();
      if (list === undefined) return { assertions, hasCheckSat: false, rlimit: state.rlimit };
      if (isSymbol(list.items[0], "check-sat"))
        return { assertions, hasCheckSat: true, rlimit: state.rlimit };
      runCommand(list);
    } catch (error) {
      if (!(error instanceof SmtParseError)) throw error;
      report(error);
      commands.skip(report);
    }
  }
};
