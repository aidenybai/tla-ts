// Ported from Z3 (src/parsers/smt2/smt2scanner.cpp, src/parsers/smt2/smt2parser.cpp,
// src/cmd_context/cmd_context.cpp), MIT license, see z3-license.txt.
import { SmtParseError, SmtUnsupportedError } from "../../../errors";
import {
  AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ABS,
  OP_ADD,
  OP_AND,
  OP_DISTINCT,
  OP_DIV,
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
  OP_MUL,
  OP_NOT,
  OP_OR,
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
import { BV_OP_NAMES, getBvSignature } from "./bv-decl-plugin";
import { Rational } from "./rational";
import { replaceFreeVars } from "./var-subst";

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
}

export interface SmtList {
  kind: "list";
  items: SExpr[];
  line: number;
  column: number;
  // Z3 reports an error in making an application at its closing parenthesis.
  end: SmtToken;
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

interface SmtProblem {
  assertions: number[];
  hasCheckSat: boolean;
  // The option rlimit: the steps that check-sat may take, or 0 for no bound.
  rlimit: number;
}

interface ApplicationFrame {
  head: SmtToken;
  // The indices of an indexed identifier, such as the bounds of an extract.
  indices: number[];
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

// Z3 knows these only when the script sets no logic.
const TRANSCENDENTALS = new Set([
  "^",
  "^0",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "asinh",
  "acosh",
  "atanh",
  "exp",
  "atan2",
  "arctan2",
  "log",
  "ln",
  "pi",
  "euler",
  "/0",
  "div0",
  "mod0",
  "complex.make",
  "complex.real",
  "complex.imag",
]);

const THEORY_SORTS = new Set([
  "BitVec",
  "Array",
  "Set",
  "Seq",
  "String",
  "StringSequence",
  "RegEx",
  "RegLan",
  "Char",
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

const COERCING_OPS = new Set([OP_ADD, OP_SUB, OP_UMINUS, OP_MUL, OP_LE, OP_GE, OP_LT, OP_GT]);

const ARITIES = new Map<number, [number, number]>([
  [OP_AND, [0, Infinity]],
  [OP_OR, [0, Infinity]],
  [OP_ITE, [3, 3]],
  [OP_EQ, [2, Infinity]],
  [OP_DISTINCT, [2, Infinity]],
  ...[OP_NOT, OP_UMINUS, OP_ABS, OP_TO_REAL, OP_TO_INT, OP_IS_INT].map(
    (op): [number, [number, number]] => [op, [1, 1]],
  ),
  ...[OP_IMPLIES, OP_XOR, OP_IDIV, OP_MOD, OP_DIV, OP_LE, OP_GE, OP_LT, OP_GT].map(
    (op): [number, [number, number]] => [op, [2, 2]],
  ),
]);

const RANGES = new Map<number, number>([
  [OP_TO_REAL, SORT_REAL],
  [OP_DIV, SORT_REAL],
  [OP_TO_INT, SORT_INT],
  [OP_IDIV, SORT_INT],
  [OP_MOD, SORT_INT],
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

// The bit-vector operators that Z3 adds to the logics it names.
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
      end: open,
    };
    for (let current = root; ;) {
      const token = take();
      if (token === undefined)
        throw new SmtParseError("unexpected end of file", scanner.getPosition());
      if (token.kind === "(") {
        const list: SmtList = {
          kind: "list",
          items: [],
          line: token.line,
          column: token.column,
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
  const sorts = new Map<string, number>([
    ["Bool", SORT_BOOL],
    ["Int", SORT_INT],
    ["Real", SORT_REAL],
  ]);
  const funcs = new Map<string, number>();
  const macros = new Map<string, Macro>();
  const undo: { names: Map<string, unknown>; name: string; previous: unknown }[] = [];
  const scopeStarts: number[] = [];
  const scopes: Map<string, Binding>[] = [];
  const binders = { depth: 0 };

  const declare = <Value>(names: Map<string, Value>, name: string, value: Value) => {
    undo.push({ names, name, previous: names.get(name) });
    names.set(name, value);
  };

  const parseSort = (sexpr: SExpr, context: string) => {
    if (sexpr.kind === "list") {
      if (!isSymbol(sexpr.items[0], "_")) throw new SmtUnsupportedError("parametric sorts");
      const width = sexpr.items[2];
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
    const sort = sorts.get(sexpr.text);
    if (sort === undefined) {
      if (THEORY_SORTS.has(sexpr.text)) throw new SmtUnsupportedError(`the sort ${sexpr.text}`);
      throw new SmtParseError(
        `${context === "" ? "" : `${context}: `}unknown sort '${sexpr.text}'`,
        sexpr,
      );
    }
    return sort;
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
    if (op === OP_IDIV || op === OP_MOD) return SORT_INT;
    if (op === OP_DIV || op === OP_IS_INT) return SORT_REAL;
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
    const isUninterpreted = op === OP_UNINTERPRETED;
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
    if (sexpr.kind !== "list") return rejectPattern("invalid pattern, '(' expected", sexpr);
    if (sexpr.items.length === 0) return rejectPattern("invalid empty pattern", at);
    const head = sexpr.items[0];
    if (head.kind === "list") return manager.mkPattern(sexpr.items.map(parseTerm));
    const decl = head.text === "true" || head.text === "false" ? -1 : funcs.get(head.text);
    if (decl === -1 || (decl !== undefined && manager.funcDecls[decl].domain.length === 0))
      return rejectPattern("invalid constant pattern", head);
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
    const body = parseTerm(isAnnotated ? annotations[1] : bodySExpr);
    if (manager.sorts[body] !== SORT_BOOL) throw new SmtParseError("expected a formula", bodySExpr);
    const attributes = Array.from(
      { length: Math.ceil((annotations.length - 2) / 2) },
      (_unused, index) => ({
        keyword: annotations[2 + 2 * index],
        value: annotations[3 + 2 * index],
      }),
    );
    const patterns: number[] = [];
    for (const attribute of attributes) {
      if (attribute.keyword.kind !== "keyword" || attribute.keyword.text !== ":pattern") continue;
      const pattern = parsePattern(attribute.value ?? list.end, list.end);
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
    const quantifier = manager.mkQuantifier({
      isForall,
      sorts: varSorts,
      names: bound.names,
      body,
      patterns,
      weight,
      qid,
    });
    for (const pattern of patterns) manager.decRef(pattern);
    for (const boundVar of boundVars) manager.decRef(boundVar);
    return quantifier;
  };

  const parseLet = (list: SmtList) => {
    const message = "invalid let declaration, symbol expected";
    const scope = new Map<string, Binding>();
    for (const binding of expectList(list.items[1], message, list).items) {
      const pair = expectList(binding, message, binding);
      const name = expectSymbol(pair.items[0], message, pair);
      const expr = parseTerm(pair.items[1] ?? pair.end);
      scope.set(name.text, { kind: "let", depth: binders.depth, expr });
    }
    scopes.push(scope);
    const body = parseTerm(list.items[2] ?? list.end);
    scopes.pop();
    return body;
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

  // parse_qualified_name for (_ bvN w).
  const parseBvNumeral = (list: SmtList) => {
    const name = list.items[1];
    const value = isSymbol(name) ? /^bv([0-9]+)$/.exec(name.text) : null;
    if (value === null) throw new SmtUnsupportedError("indexed identifiers");
    const width = list.items[2];
    if (list.items.length !== 3 || width.kind !== "numeral")
      throw new SmtParseError("invalid bit-vector constant, index expected", list.end);
    if (BigInt(width.text) === 0n)
      throw new SmtParseError("bit-vector size must be greater than zero", list.end);
    return manager.mkBvNumeral(BigInt(value[1]), Number(width.text));
  };

  const parseApp = (head: SmtToken, args: number[], at: SExpr, indices: number[] = []) => {
    const name = head.text;
    if (indices.length > 0) return mkBvApp(name, args, indices, at);
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
    const decl = funcs.get(name);
    if (decl !== undefined) return mkApp(decl, args, at);
    if (isBvOpName(name)) return mkBvApp(name, args, indices, at);
    const builtin = (logic === undefined ? LOGIC_FREE_ALIASES.get(name) : undefined) ?? name;
    if (builtin === "rem" || (TRANSCENDENTALS.has(builtin) && logic === undefined))
      throw new SmtUnsupportedError(`the operator ${name}`);
    const chainable = CHAINABLE_OPS.get(builtin);
    if (chainable !== undefined) return mkChain(chainable, args, at);
    if (builtin === "~") return mkApp(OP_UMINUS, args, at);
    if (builtin === "-" && args.length === 1) return mkApp(OP_UMINUS, args, at);
    const op = BUILTIN_OPS.get(builtin);
    if (op === undefined) {
      if (THEORY_OPERATOR.test(name) || THEORY_OPERATORS.has(name))
        throw new SmtUnsupportedError(`the operator ${name}`);
      if (args.length === 0) throw new SmtParseError(`unknown constant ${name}`, head);
      const argSorts = args.map((arg) => getSortName(manager.sorts[arg])).join(" ");
      throw new SmtParseError(`unknown constant ${name} (${argSorts}) `, at);
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

  const getSortName = (sort: number) =>
    manager.isBvSort(sort) ? `(_ BitVec ${manager.getBvSize(sort)})` : manager.sortNames[sort];

  const parseLeaf = (sexpr: SExpr): number => {
    if (sexpr.kind === "numeral") return manager.mkNumeral(BigInt(sexpr.text));
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
    if (sexpr.kind === "string") throw new SmtUnsupportedError("string literals");
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
    const named = parseTerm(sexpr.items[1] ?? sexpr.end);
    const nameIndex = sexpr.items.findIndex(
      (item) => item.kind === "keyword" && item.text === ":named",
    );
    if (nameIndex !== -1) {
      const name = expectSymbol(
        sexpr.items[nameIndex + 1],
        "invalid attribute value, symbol expected",
        sexpr,
      ).text;
      manager.incRef(named);
      manager.mkMacro(name, named);
      declare(macros, name, { domain: [], range: manager.sorts[named], body: named });
    }
    return named;
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
          !isSymbol(head.items[0], "_") ||
          !isSymbol(name) ||
          !isBvOpName(name.text) ||
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
      if (
        head.text === "as" ||
        head.text === "lambda" ||
        head.text === "match" ||
        head.text === "root-obj"
      )
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
      results.push(
        parseApp(frame.head, results.splice(frame.start), frame.list.end, frame.indices),
      );
    }
    return results[0];
  };

  const parseDomain = (sexpr: SExpr | undefined, at: SExpr) => {
    const context = "Parsing function declaration. Expecting sort list '('";
    return expectList(sexpr, context, at).items.map((item) => parseSort(item, context));
  };

  const declareCommand = (list: SmtList) => {
    const name = list.items[0].kind === "list" ? "" : list.items[0].text;
    const symbol = expectSymbol(list.items[1], "invalid declaration, symbol expected", list);
    if (name === "declare-sort") {
      const arity = list.items[2];
      if (arity !== undefined && (arity.kind === "list" || arity.text !== "0"))
        throw new SmtUnsupportedError("parametric sorts are not supported");
      declare(sorts, symbol.text, manager.mkSort(symbol.text));
      return;
    }
    if (name === "define-sort") {
      if (expectList(list.items[2], "invalid sort definition, '(' expected", list).items.length > 0)
        throw new SmtUnsupportedError("parametric sorts are not supported");
      declare(sorts, symbol.text, parseSort(list.items[3] ?? list.end, "invalid sort definition"));
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
          `invalid function definition, sort mismatch. Expcected ${getSortName(range)} but function body has sort ${getSortName(manager.sorts[body])}`,
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
    const existing = funcs.get(symbol.text);
    if (macros.has(symbol.text) || existing !== undefined) {
      const previous = existing === undefined ? undefined : manager.funcDecls[existing];
      // func_decls::insert: one name can declare functions of different signatures, which this
      // port does not keep apart.
      if (
        previous === undefined ||
        previous.range !== range ||
        previous.domain.length !== domain.length ||
        previous.domain.some((sort, index) => sort !== domain[index])
      )
        throw new SmtUnsupportedError(`the overloaded symbol ${symbol.text}`);
      throw new SmtParseError(
        `invalid declaration, ${domain.length === 0 ? "constant" : "function"} '${symbol.text}' (with the given signature) already declared`,
        list.end,
      );
    }
    declare(funcs, symbol.text, manager.mkFuncDecl(symbol.text, domain, range));
  };

  const parseFormula = (sexpr: SExpr) => {
    const assertion = parseTerm(sexpr);
    if (manager.sorts[assertion] !== SORT_BOOL)
      throw new SmtParseError("invalid assert command, term is not Boolean", sexpr);
    manager.incRef(assertion);
    return assertion;
  };

  const push = () => scopeStarts.push(undo.length);

  const pop = () => {
    const start = scopeStarts.pop() ?? 0;
    for (const entry of undo.splice(start).reverse()) {
      if (entry.previous === undefined) entry.names.delete(entry.name);
      else entry.names.set(entry.name, entry.previous);
    }
  };

  const isUsed = (name: string) => funcs.has(name) || BUILTIN_NAMES.has(name);

  return { declareCommand, parseTerm, parseFormula, push, pop, isUsed };
};

export type SmtlibReader = ReturnType<typeof createSmtlibReader>;

export const DECLARATIONS = new Set([
  "declare-sort",
  "declare-fun",
  "declare-const",
  "define-fun",
  "define-const",
  "define-sort",
]);

export const parseSmtlib = (
  text: string,
  manager: AstManager,
  assertExpr: (assertion: number) => void,
): SmtProblem => {
  const commands = createCommandReader(text);
  const reader = createSmtlibReader(manager);
  const assertions: number[] = [];
  let rlimit = 0;
  for (let list = commands.read(); list !== undefined; list = commands.read()) {
    const name = expectSymbol(list.items[0], "invalid command, symbol expected", list).text;
    if (name === "check-sat") return { assertions, hasCheckSat: true, rlimit };
    const option = list.items[1];
    const value = list.items[2];
    if (
      name === "set-option" &&
      option?.kind === "keyword" &&
      option.text === ":rlimit" &&
      value?.kind === "numeral"
    )
      rlimit = Number(value.text);
    if (DECLARATIONS.has(name)) {
      if (name === "define-fun" || name === "define-sort" || name === "define-const")
        throw new SmtUnsupportedError(`the command ${name} is not supported`);
      reader.declareCommand(list);
    } else if (name === "assert") {
      const assertion = reader.parseFormula(list.items[1] ?? list.end);
      assertions.push(assertion);
      assertExpr(assertion);
    } else if (name === "push" || name === "pop")
      throw new SmtUnsupportedError(`the command ${name} is not supported`);
  }
  return { assertions, hasCheckSat: false, rlimit };
};
