// Parses Isabelle's inner syntax as far as tlapm's theory printer uses it. The translations of the
// Isabelle/TLA+ theories apply while parsing, so a term comes out as constants, names, applications
// and abstractions only.

import { TlaIsabelleError } from "../../../errors";
import { funT, mkType, propT, type Typ } from "../pure/term";

const TLA_TYPE = mkType("PredicateLogic.c");

export type Ast =
  | { readonly kind: "name"; readonly name: string }
  | { readonly kind: "const"; readonly name: string }
  | { readonly kind: "var"; readonly name: string; readonly index: number }
  | { readonly kind: "dummy" }
  | { readonly kind: "app"; readonly fun: Ast; readonly arg: Ast }
  | {
      readonly kind: "abs";
      readonly name: string;
      readonly type: Typ | undefined;
      readonly body: Ast;
    }
  | { readonly kind: "constrain"; readonly term: Ast; readonly type: Typ };

type Token =
  | { readonly kind: "id"; readonly text: string }
  | { readonly kind: "delimiter"; readonly text: string }
  | { readonly kind: "string"; readonly text: string }
  | { readonly kind: "var"; readonly text: string }
  | { readonly kind: "end" };

// The ASCII notations of the Isabelle/TLA+ theories, as the symbols they share a constant with.
const ASCII_DELIMITERS = new Map([
  ["\\subseteq", "\\<subseteq>"],
  ["\\notin", "\\<notin>"],
  ["\\inter", "\\<inter>"],
  ["\\union", "\\<union>"],
  ["\\cup", "\\cup"],
  ["\\in", "\\<in>"],
  ["\\A", "\\<forall>"],
  ["\\E", "\\<exists>"],
  ["<=>", "\\<Leftrightarrow>"],
  ["==", "\\<equiv>"],
  ["~=", "~="],
]);

const DELIMITERS = [
  "::",
  ":>",
  "<<",
  ">>",
  "@@",
  "=>",
  "\\",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  ",",
  ":",
  ".",
  "%",
  "=",
  "&",
  "|",
  "~",
  "!",
  "0",
];

const KEYWORDS = new Set(["EXCEPT", "DOMAIN", "SUBSET", "UNION", "PROP", "CHOOSE"]);

const isLetter = (char: string) => /[A-Za-z]/.test(char);
const isIdChar = (char: string) => /[A-Za-z0-9_']/.test(char);

const tokenize = (text: string): Token[] => {
  const tokens: Token[] = [];
  let position = 0;
  while (position < text.length) {
    const char = text[position];
    if (/\s/.test(char)) {
      position += 1;
      continue;
    }
    if (text.startsWith("''", position)) {
      const end = text.indexOf("''", position + 2);
      if (end < 0) throw new TlaIsabelleError("ERROR", "Inner lexical error: unterminated string");
      tokens.push({ kind: "string", text: text.slice(position + 2, end) });
      position = end + 2;
      continue;
    }
    if (text.startsWith("\\<", position) && isLetter(text[position + 2] ?? "")) {
      const end = text.indexOf(">", position);
      tokens.push({ kind: "delimiter", text: text.slice(position, end + 1) });
      position = end + 1;
      continue;
    }
    if (char === "?" && isLetter(text[position + 1] ?? "")) {
      let end = position + 2;
      while (end < text.length && isIdChar(text[end])) end += 1;
      tokens.push({ kind: "var", text: text.slice(position + 1, end) });
      position = end;
      continue;
    }
    if (char === "_" && !isIdChar(text[position + 1] ?? "")) {
      tokens.push({ kind: "delimiter", text: "_" });
      position += 1;
      continue;
    }
    const ascii = [...ASCII_DELIMITERS.keys()].find((candidate) =>
      text.startsWith(candidate, position),
    );
    if (ascii !== undefined) {
      tokens.push({ kind: "delimiter", text: ASCII_DELIMITERS.get(ascii) ?? ascii });
      position += ascii.length;
      continue;
    }
    if (isLetter(char)) {
      let end = position + 1;
      while (
        end < text.length &&
        (isIdChar(text[end]) || (text[end] === "." && isLetter(text[end + 1] ?? "")))
      )
        end += 1;
      const word = text.slice(position, end);
      tokens.push(
        KEYWORDS.has(word) ? { kind: "delimiter", text: word } : { kind: "id", text: word },
      );
      position = end;
      continue;
    }
    const delimiter = DELIMITERS.find((candidate) => text.startsWith(candidate, position));
    if (delimiter === undefined)
      throw new TlaIsabelleError(
        "ERROR",
        `Inner lexical error at: ${text.slice(position, position + 20)}`,
      );
    tokens.push({ kind: "delimiter", text: delimiter });
    position += delimiter.length;
  }
  tokens.push({ kind: "end" });
  return tokens;
};

// Lexicon.read_indexname: trailing digits are the index.
const readIndexname = (text: string) => {
  const digits = /\d*$/.exec(text)?.[0] ?? "";
  return { name: text.slice(0, text.length - digits.length), index: Number(digits || 0) };
};

const constant = (name: string): Ast => ({ kind: "const", name });
const apply = (fun: Ast, ...args: Ast[]) =>
  args.reduce<Ast>((result, arg) => ({ kind: "app", fun: result, arg }), fun);

// Strings.thy: a string is the tuple of its characters, each a pair of nibbles.
const nibble = (value: number): Ast =>
  value === 0
    ? constant("Integers.zero")
    : apply(constant("Functions.fapply"), constant("Integers.succ"), nibble(value - 1));

const stringTerm = (text: string) =>
  [...text].reduce((tuple, char) => {
    const code = char.charCodeAt(0);
    if (code >= 128) throw new TlaIsabelleError("ERROR", `Non-ASCII symbol: ${char}`);
    return apply(
      constant("Tuples.Append"),
      tuple,
      apply(constant("Strings.char"), nibble(code >> 4), nibble(code & 15)),
    );
  }, constant("Tuples.emptySeq"));

const tuple = (elements: readonly Ast[]) =>
  elements.reduce(
    (result, element) => apply(constant("Tuples.Append"), result, element),
    constant("Tuples.emptySeq"),
  );

interface Infix {
  readonly constant: string;
  readonly left: number;
  readonly right: number;
  readonly priority: number;
}

const infixl = (name: string, priority: number): Infix => ({
  constant: name,
  left: priority,
  right: priority + 1,
  priority,
});
const infixr = (name: string, priority: number): Infix => ({
  constant: name,
  left: priority + 1,
  right: priority,
  priority,
});

const INFIXES = new Map<string, Infix>([
  ["\\<Rightarrow>", infixr("PredicateLogic.imp", 25)],
  ["=>", infixr("PredicateLogic.imp", 25)],
  ["\\<Leftrightarrow>", infixr("PredicateLogic.iff", 25)],
  ["~=", { constant: "PredicateLogic.not_equal", left: 51, right: 51, priority: 50 }],
  ["\\<or>", infixr("PredicateLogic.disj", 30)],
  ["|", infixr("PredicateLogic.disj", 30)],
  ["\\<and>", infixr("PredicateLogic.conj", 35)],
  ["&", infixr("PredicateLogic.conj", 35)],
  ["=", infixl("PredicateLogic.eq", 50)],
  ["\\<noteq>", infixl("PredicateLogic.not_equal", 50)],
  ["\\<in>", infixl("SetTheory.in", 50)],
  ["\\<notin>", infixl("SetTheory.notin", 50)],
  ["\\<subseteq>", infixl("SetTheory.subset", 50)],
  ["\\<union>", infixl("SetTheory.union", 65)],
  ["\\cup", infixl("Zenon.cup", 65)],
  ["\\", infixl("SetTheory.setminus", 65)],
  ["\\<inter>", infixl("SetTheory.inter", 70)],
  ["@@", infixl("Functions.extend", 70)],
  [":>", infixl("Functions.oneArg", 75)],
  ["\\<times>", infixr("Tuples.prod", 100)],
]);

const PREFIXES = new Map<
  string,
  { readonly constant: string; readonly argument: number; readonly priority: number }
>([
  ["~", { constant: "PredicateLogic.not", argument: 40, priority: 40 }],
  ["\\<not>", { constant: "PredicateLogic.not", argument: 40, priority: 40 }],
  ["SUBSET", { constant: "SetTheory.SUBSET", argument: 100, priority: 90 }],
  ["UNION", { constant: "SetTheory.UNION", argument: 100, priority: 90 }],
  ["DOMAIN", { constant: "Functions.DOMAIN", argument: 100, priority: 90 }],
]);

interface Parsed {
  readonly ast: Ast;
  readonly priority: number;
  readonly isProp: boolean;
}

const MAX_PRIORITY = 1000;

class Parser {
  private position = 0;

  constructor(private readonly tokens: readonly Token[]) {}

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.position + offset, this.tokens.length - 1)];
  }

  private isDelimiter(text: string, offset = 0) {
    const token = this.peek(offset);
    return token.kind === "delimiter" && token.text === text;
  }

  private next(): Token {
    const token = this.peek();
    this.position += 1;
    return token;
  }

  private expect(text: string) {
    if (!this.isDelimiter(text)) throw this.syntaxError();
    this.position += 1;
  }

  private syntaxError() {
    const token = this.peek();
    return new TlaIsabelleError(
      "ERROR",
      `Inner syntax error at: ${token.kind === "end" ? "end of input" : token.kind === "string" ? `''${token.text}''` : token.text}`,
    );
  }

  private identifier(): string {
    const token = this.next();
    if (token.kind !== "id") throw this.syntaxError();
    return token.text;
  }

  atEnd() {
    return this.peek().kind === "end";
  }

  type(): Typ {
    const domains = this.isDelimiter("[") ? this.typeList() : undefined;
    const atom = domains === undefined ? this.typeAtom() : undefined;
    if (this.isDelimiter("=>") || this.isDelimiter("\\<Rightarrow>")) {
      this.position += 1;
      const range = this.type();
      return (domains ?? [atom ?? TLA_TYPE]).reduceRight(
        (result, domain) => funT(domain, result),
        range,
      );
    }
    if (atom === undefined) throw this.syntaxError();
    return atom;
  }

  private typeList(): Typ[] {
    this.expect("[");
    const types = [this.type()];
    while (this.isDelimiter(",")) {
      this.position += 1;
      types.push(this.type());
    }
    this.expect("]");
    return types;
  }

  private typeAtom(): Typ {
    if (this.isDelimiter("(")) {
      this.position += 1;
      const type = this.type();
      this.expect(")");
      return type;
    }
    const name = this.identifier();
    if (name === "c") return TLA_TYPE;
    if (name === "prop") return propT;
    throw new TlaIsabelleError("ERROR", `Undefined type name: ${name}`);
  }

  private binders(isConstrainable: boolean): { name: string; type: Typ | undefined }[] {
    const binders: { name: string; type: Typ | undefined }[] = [];
    while (this.peek().kind === "id") {
      const name = this.identifier();
      if (isConstrainable && this.isDelimiter("::")) {
        this.position += 1;
        binders.push({ name, type: this.type() });
      } else binders.push({ name, type: undefined });
    }
    if (binders.length === 0) throw this.syntaxError();
    return binders;
  }

  private commaList(close: string): Ast[] {
    if (this.isDelimiter(close)) {
      this.position += 1;
      return [];
    }
    const items = [this.logic(0)];
    while (this.isDelimiter(",")) {
      this.position += 1;
      items.push(this.logic(0));
    }
    this.expect(close);
    return items;
  }

  logic(minimum: number): Ast {
    const parsed = this.expression(minimum);
    if (parsed.isProp)
      throw new TlaIsabelleError("ERROR", "Inner syntax error: proposition in term position");
    return parsed.ast;
  }

  // An object-logic term becomes a proposition through Trueprop, as PredicateLogic's "(_)" 5 mixfix
  // declares.
  prop(minimum: number): Ast {
    const parsed = this.expression(minimum);
    return parsed.isProp ? parsed.ast : apply(constant("PredicateLogic.Trueprop"), parsed.ast);
  }

  private expression(minimum: number): Parsed {
    let left = this.prefix(minimum);
    for (;;) {
      const token = this.peek();
      if (token.kind !== "delimiter") return left;
      if (token.text === "\\<Longrightarrow>") {
        if (minimum > 1 || (left.isProp && left.priority < 2)) return left;
        this.position += 1;
        const premise = left.isProp
          ? left.ast
          : apply(constant("PredicateLogic.Trueprop"), left.ast);
        left = {
          ast: apply(constant("Pure.imp"), premise, this.prop(1)),
          priority: 1,
          isProp: true,
        };
        continue;
      }
      if (token.text === "\\<equiv>") {
        if (minimum > 2 || left.priority < 3) return left;
        this.position += 1;
        const right = this.expression(3);
        left = {
          ast: apply(constant("Pure.eq"), left.ast, right.ast),
          priority: 2,
          isProp: true,
        };
        continue;
      }
      if (left.isProp) return left;
      if (token.text === "::") {
        if (minimum > 3 || left.priority < 4) return left;
        this.position += 1;
        left = {
          ast: { kind: "constrain", term: left.ast, type: this.type() },
          priority: 3,
          isProp: false,
        };
        continue;
      }
      if (token.text === "(") {
        if (left.priority < MAX_PRIORITY) return left;
        this.position += 1;
        const args = this.commaList(")");
        if (args.length === 0) throw this.syntaxError();
        left = { ast: apply(left.ast, ...args), priority: MAX_PRIORITY, isProp: false };
        continue;
      }
      if (token.text === "[") {
        if (minimum > 90 || left.priority < 89) return left;
        this.position += 1;
        const index = this.logic(0);
        this.expect("]");
        left = {
          ast: apply(constant("Functions.fapply"), left.ast, index),
          priority: 90,
          isProp: false,
        };
        continue;
      }
      const infix = INFIXES.get(token.text);
      if (infix === undefined || infix.priority < minimum || left.priority < infix.left)
        return left;
      this.position += 1;
      left = {
        ast: apply(constant(infix.constant), left.ast, this.logic(infix.right)),
        priority: infix.priority,
        isProp: false,
      };
    }
  }

  private prefix(minimum: number): Parsed {
    const token = this.next();
    const term = (ast: Ast, priority = MAX_PRIORITY): Parsed => ({ ast, priority, isProp: false });
    if (token.kind === "end") {
      this.position -= 1;
      throw this.syntaxError();
    }
    if (token.kind === "id") return term({ kind: "name", name: token.text });
    if (token.kind === "var") return term({ kind: "var", ...readIndexname(token.text) });
    if (token.kind === "string") return term(stringTerm(token.text));
    switch (token.text) {
      case "(": {
        const inner = this.expression(0);
        this.expect(")");
        return { ...inner, priority: MAX_PRIORITY };
      }
      case "0":
        return term(constant("Integers.zero"));
      case "_":
        return term({ kind: "dummy" });
      case "PROP": {
        if (minimum > 1000) throw this.syntaxError();
        const next = this.next();
        if (next.kind === "id")
          return { ast: { kind: "name", name: next.text }, priority: 1000, isProp: true };
        if (next.kind === "var")
          return {
            ast: { kind: "var", ...readIndexname(next.text) },
            priority: 1000,
            isProp: true,
          };
        this.position -= 1;
        throw this.syntaxError();
      }
      case "CHOOSE": {
        if (minimum > 10) throw this.syntaxError();
        const name = this.identifier();
        if (this.isDelimiter("\\<in>")) {
          this.position += 1;
          const domain = this.logic(0);
          this.expect(":");
          const body = this.logic(0);
          return term(
            apply(constant("SetTheory.bChoose"), domain, {
              kind: "abs",
              name,
              type: undefined,
              body,
            }),
            10,
          );
        }
        this.expect(":");
        const body = this.logic(10);
        return term(
          apply(constant("PredicateLogic.Choice"), { kind: "abs", name, type: undefined, body }),
          10,
        );
      }
      case "{":
        if (this.isDelimiter("}")) {
          this.position += 1;
          return term(constant("SetTheory.emptyset"), 100);
        }
        return term(
          this.commaList("}").reduceRight(
            (set, element) => apply(constant("SetTheory.addElt"), element, set),
            constant("SetTheory.emptyset"),
          ),
        );
      case "<<":
        return term(
          this.isDelimiter(">>")
            ? (this.next(), constant("Tuples.emptySeq"))
            : tuple(this.commaList(">>")),
        );
      case "\\<langle>":
        return term(tuple(this.commaList("\\<rangle>")));
      case "[":
        return this.bracket();
      case "\\<forall>":
      case "\\<exists>":
        return term(this.quantifier(token.text === "\\<forall>"), 10);
      case "%":
      case "\\<lambda>": {
        if (minimum > 3) throw this.syntaxError();
        const binders = this.binders(true);
        this.expect(".");
        const body = this.logic(3);
        return term(
          binders.reduceRight<Ast>(
            (result, binder) => ({
              kind: "abs",
              name: binder.name,
              type: binder.type,
              body: result,
            }),
            body,
          ),
          3,
        );
      }
      case "\\<And>": {
        if (minimum > 0) throw this.syntaxError();
        const binders = this.binders(true);
        this.expect(".");
        const body = this.prop(0);
        return {
          ast: binders.reduceRight<Ast>(
            (result, binder) =>
              apply(constant("Pure.all"), {
                kind: "abs",
                name: binder.name,
                type: binder.type,
                body: result,
              }),
            body,
          ),
          priority: 0,
          isProp: true,
        };
      }
    }
    const prefix = PREFIXES.get(token.text);
    if (prefix === undefined || prefix.priority < minimum) {
      this.position -= 1;
      throw this.syntaxError();
    }
    return term(apply(constant(prefix.constant), this.logic(prefix.argument)), prefix.priority);
  }

  private quantifier(isForall: boolean): Ast {
    const names = [this.identifier()];
    while (this.isDelimiter(",")) {
      this.position += 1;
      names.push(this.identifier());
    }
    if (this.isDelimiter(":")) {
      this.position += 1;
      const body = this.logic(10);
      const quantifier = constant(isForall ? "PredicateLogic.All" : "PredicateLogic.Ex");
      return names.reduceRight(
        (result, name) => apply(quantifier, { kind: "abs", name, type: undefined, body: result }),
        body,
      );
    }
    this.expect("\\<in>");
    const domain = this.logic(0);
    this.expect(":");
    const body = this.logic(0);
    const quantifier = constant(isForall ? "SetTheory.bAll" : "SetTheory.bEx");
    return names.reduceRight(
      (result, name) =>
        apply(quantifier, domain, { kind: "abs", name, type: undefined, body: result }),
      body,
    );
  }

  private bracket(): Parsed {
    if (this.peek().kind === "id" && this.isDelimiter("\\<in>", 1)) {
      const name = this.identifier();
      this.position += 1;
      const domain = this.logic(0);
      this.expect("\\<mapsto>");
      const body = this.logic(0);
      this.expect("]");
      return {
        ast: apply(constant("Functions.Fcn"), domain, { kind: "abs", name, type: undefined, body }),
        priority: 900,
        isProp: false,
      };
    }
    const first = this.logic(0);
    if (this.isDelimiter("\\<rightarrow>")) {
      this.position += 1;
      const range = this.logic(0);
      this.expect("]");
      return {
        ast: apply(constant("Functions.FuncSet"), first, range),
        priority: 900,
        isProp: false,
      };
    }
    if (this.isDelimiter("EXCEPT")) {
      this.position += 1;
      let result = first;
      for (;;) {
        this.expect("!");
        this.expect("[");
        const index = this.logic(0);
        this.expect("]");
        this.expect("=");
        result = apply(constant("Functions.except"), result, index, this.logic(0));
        if (!this.isDelimiter(",")) break;
        this.position += 1;
      }
      this.expect("]");
      return { ast: result, priority: 900, isProp: false };
    }
    this.expect(":");
    const domains = [first];
    const ranges = [this.logic(0)];
    while (this.isDelimiter(",")) {
      this.position += 1;
      domains.push(this.logic(0));
      this.expect(":");
      ranges.push(this.logic(0));
    }
    this.expect("]");
    return {
      ast: apply(constant("Tuples.EnumFuncSet"), tuple(domains), tuple(ranges)),
      priority: MAX_PRIORITY,
      isProp: false,
    };
  }
}

const parseWith = <Result>(text: string, parse: (parser: Parser) => Result): Result => {
  const parser = new Parser(tokenize(text));
  const result = parse(parser);
  if (!parser.atEnd())
    throw new TlaIsabelleError(
      "ERROR",
      `Inner syntax error: trailing input in ${text.slice(0, 40)}`,
    );
  return result;
};

export const parseProp = (text: string) => parseWith(text, (parser) => parser.prop(0));

export const parseTerm = (text: string) => parseWith(text, (parser) => parser.logic(0));

export const parseType = (text: string) => parseWith(text, (parser) => parser.type());
