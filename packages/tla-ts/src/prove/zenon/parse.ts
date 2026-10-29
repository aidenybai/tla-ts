// Ported from Zenon's lexzen.mll and parsezen.mly, as shipped in tlapm. Copyright 2005 INRIA, see
// LICENSE.
//
// Reads Zenon's native input format, the .znn files that tlapm writes.

import { TlaZenonError } from "../../errors";
import { FALSE, GOAL_NAME, TRUE, UNIVERSE, type Expr, type Expressions } from "./expr";

export type Definition =
  | { kind: "real"; symbol: string; params: Expr[]; body: Expr }
  | { kind: "pseudo"; origin: Expr; goalness: number; symbol: string; params: Expr[]; body: Expr };

export type Phrase =
  | { kind: "hyp"; name: string; formula: Expr; goalness: number }
  | { kind: "def"; definition: Definition };

type TokenKind = "open" | "close" | "ident" | "string" | "int" | "keyword" | "operator" | "end";

interface Token {
  kind: TokenKind;
  text: string;
  line: number;
}

const OPERATORS = ["<=>", "-.", "/\\", "\\/", "=>", "<=", "="];

const DOTTED_KEYWORDS = new Set(["T.", "F.", "A.", "E.", "t."]);

const KEYWORDS = [
  "$fixpoint",
  "$include",
  "$indprop",
  "$indset",
  "$match",
  "$goal",
  "$self",
  "$def",
  "$fix",
  "$hyp",
  "$let",
  "$sig",
];

const IDENT_START = /[A-Za-z_0-9]/;
const IDENT_CHAR = /[A-Za-z0-9_'.]/;
const STRING_ESCAPE = /^\\([abfnrtv'"\\?]|x[0-9A-Fa-f]{2})/;

const tokenize = (text: string) => {
  const tokens: Token[] = [];
  let line = 1;
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (char === "\n" || char === "\r") {
      line += char === "\r" && text[index + 1] === "\n" ? 0 : 1;
      index++;
    } else if (char === " " || char === "\t" || char === "\f") index++;
    else if (char === "#" || char === ";") {
      while (index < text.length && text[index] !== "\n" && text[index] !== "\r") index++;
    } else if (char === "(" || char === ")") {
      tokens.push({ kind: char === "(" ? "open" : "close", text: char, line });
      index++;
    } else if (char === "$") {
      const digits = /^\$[0-9]+/.exec(text.slice(index, index + 32));
      const keyword = KEYWORDS.find((candidate) => text.startsWith(candidate, index));
      if (digits !== null) {
        tokens.push({ kind: "int", text: digits[0].slice(1), line });
        index += digits[0].length;
      } else if (keyword !== undefined) {
        tokens.push({ kind: "keyword", text: keyword, line });
        index += keyword.length;
      } else throw new TlaZenonError(`Zenon: line ${line}: bad character '$'`);
    } else if (char === '"') {
      let end = index + 1;
      while (end < text.length && text[end] !== '"') {
        const escape = text[end] === "\\" ? STRING_ESCAPE.exec(text.slice(end, end + 4)) : null;
        if (text[end] === "\\" && escape === null)
          throw new TlaZenonError(`Zenon: line ${line}: bad escape in string`);
        if (escape === null && (text.charCodeAt(end) < 32 || text.charCodeAt(end) >= 127))
          throw new TlaZenonError(`Zenon: line ${line}: bad character in string`);
        end += escape === null ? 1 : escape[0].length;
      }
      if (end >= text.length) throw new TlaZenonError(`Zenon: line ${line}: unterminated string`);
      tokens.push({ kind: "string", text: text.slice(index + 1, end), line });
      index = end + 1;
    } else if (IDENT_START.test(char)) {
      let end = index + 1;
      while (end < text.length && IDENT_CHAR.test(text[end])) end++;
      const word = text.slice(index, end);
      tokens.push({ kind: DOTTED_KEYWORDS.has(word) ? "keyword" : "ident", text: word, line });
      index = end;
    } else {
      const operator = OPERATORS.find((candidate) => text.startsWith(candidate, index));
      if (operator === undefined)
        throw new TlaZenonError(`Zenon: line ${line}: bad character '${char}'`);
      tokens.push({ kind: "operator", text: operator, line });
      index += operator.length;
    }
  }
  tokens.push({ kind: "end", text: "", line });
  return tokens;
};

// Zenon's myfold: an n-ary connective nests to the right.
const foldRight = (combine: (left: Expr, right: Expr) => Expr, first: Expr, rest: Expr[]): Expr =>
  rest.length === 0 ? first : combine(first, foldRight(combine, rest[0], rest.slice(1)));

export const parseZenon = (exprs: Expressions, text: string): Phrase[] => {
  const binders: Record<string, (variable: Expr, type: string, body: Expr) => Expr> = {
    "A.": exprs.eall,
    "E.": exprs.eex,
  };
  const connectives: Record<string, (left: Expr, right: Expr) => Expr> = {
    "/\\": exprs.eand,
    "\\/": exprs.eor,
    "=>": exprs.eimply,
    "<=": (left, right) => exprs.eimply(right, left),
    "<=>": exprs.eequiv,
  };
  const tokens = tokenize(text);
  let position = 0;
  const peek = (offset = 0) => tokens[position + offset];
  const next = () => tokens[position++];
  const expect = (kind: TokenKind, value?: string) => {
    const token = next();
    if (token.kind !== kind || (value !== undefined && token.text !== value))
      throw new TlaZenonError(`Zenon: line ${token.line}: syntax error`);
    return token;
  };
  const isAt = (kind: TokenKind, value?: string) =>
    peek().kind === kind && (value === undefined || peek().text === value);

  // A lambda after its first parenthesis: ((x y "type") body).
  const parseLambda = () => {
    expect("open");
    const names: string[] = [];
    while (isAt("ident")) names.push(next().text);
    const type = isAt("string") ? next().text : UNIVERSE;
    expect("close");
    const body = parseExpr();
    expect("close");
    return { names, type, body };
  };

  const bindAll = (
    bind: (variable: Expr, type: string, body: Expr) => Expr,
    lambda: { names: string[]; type: string; body: Expr },
  ) =>
    lambda.names.reduceRight(
      (body, name) => bind(exprs.evar(name), lambda.type, body),
      lambda.body,
    );

  const parseList = () => {
    const expressions: Expr[] = [];
    while (!isAt("close")) expressions.push(parseExpr());
    return expressions;
  };

  const parseExpr = (): Expr => {
    const token = next();
    if (token.kind === "ident") return exprs.evar(token.text);
    if (token.kind === "string") return exprs.eapp("$string", [exprs.evar(`"${token.text}"`)]);
    if (token.kind === "keyword" && token.text === "T.") return TRUE;
    if (token.kind === "keyword" && token.text === "F.") return FALSE;
    if (token.kind !== "open") throw new TlaZenonError(`Zenon: line ${token.line}: syntax error`);
    const head = next();
    if (head.kind === "open") {
      position--;
      return bindAll(exprs.elam, parseLambda());
    }
    if (head.kind === "ident") {
      const args = parseList();
      expect("close");
      return exprs.eapp(head.text, args);
    }
    if (head.kind === "operator" && head.text === "-.") {
      const operand = parseExpr();
      expect("close");
      return exprs.enot(operand);
    }
    if (head.kind === "operator" && head.text === "=") {
      const left = parseExpr();
      const right = parseExpr();
      expect("close");
      return exprs.eapp("=", [left, right]);
    }
    if (head.kind === "operator") {
      const first = parseExpr();
      const rest = parseList();
      expect("close");
      return foldRight(connectives[head.text], first, rest);
    }
    if (head.kind === "keyword" && (head.text === "T." || head.text === "F.")) {
      expect("close");
      return head.text === "T." ? TRUE : FALSE;
    }
    if (head.kind === "keyword" && head.text in binders) {
      expect("open");
      const lambda = parseLambda();
      expect("close");
      return bindAll(binders[head.text], lambda);
    }
    if (head.kind === "keyword" && head.text === "t.") {
      expect("open");
      const lambda = parseLambda();
      expect("close");
      if (lambda.names.length !== 1)
        throw new TlaZenonError(`Zenon: line ${head.line}: syntax error`);
      return exprs.etau(exprs.evar(lambda.names[0]), lambda.type, lambda.body);
    }
    throw new TlaZenonError(`Zenon: line ${head.line}: unsupported construct ${head.text}`);
  };

  const phrases: Phrase[] = [];
  while (!isAt("end")) {
    const token = next();
    if (token.kind === "keyword" && token.text === "$hyp") {
      const goalness = isAt("int") ? Number(next().text) : 1;
      const name = expect("string").text;
      phrases.push({ kind: "hyp", name, formula: parseExpr(), goalness });
    } else if (token.kind === "keyword" && token.text === "$goal") {
      phrases.push({ kind: "hyp", name: GOAL_NAME, formula: exprs.enot(parseExpr()), goalness: 0 });
    } else if (token.kind === "keyword" && token.text === "$def") {
      expect("string");
      expect("open");
      const symbol = expect("ident").text;
      const params: Expr[] = [];
      while (isAt("ident")) params.push(exprs.evar(next().text));
      expect("close");
      const body = parseExpr();
      phrases.push({
        kind: "def",
        definition: { kind: "real", symbol, params, body },
      });
    } else throw new TlaZenonError(`Zenon: line ${token.line}: unsupported phrase ${token.text}`);
  }
  return phrases;
};
