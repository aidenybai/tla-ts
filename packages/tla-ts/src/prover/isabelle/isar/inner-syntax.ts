import { TlaIsabelleError } from "../../../errors";
import { funT, mkType, propT, type Typ } from "../pure/term";

const TLA_TYPE = mkType("PredicateLogic.c");

export type Ast =
  | { readonly kind: "name"; readonly name: string }
  | { readonly kind: "const"; readonly name: string }
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
  | { readonly kind: "end" };

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

const KEYWORDS = new Set(["EXCEPT", "DOMAIN", "SUBSET", "UNION", "PROP"]);

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

const toConstant = (name: string): Ast => ({ kind: "const", name });
const apply = (fun: Ast, ...args: Ast[]) =>
  args.reduce<Ast>((result, arg) => ({ kind: "app", fun: result, arg }), fun);

const toNibble = (value: number): Ast =>
  value === 0
    ? toConstant("Integers.zero")
    : apply(toConstant("Functions.fapply"), toConstant("Integers.succ"), toNibble(value - 1));

const toStringTerm = (text: string) =>
  [...text].reduce((tuple, char) => {
    const code = char.charCodeAt(0);
    if (code >= 128) throw new TlaIsabelleError("ERROR", `Non-ASCII symbol: ${char}`);
    return apply(
      toConstant("Tuples.Append"),
      tuple,
      apply(toConstant("Strings.char"), toNibble(code >> 4), toNibble(code & 15)),
    );
  }, toConstant("Tuples.emptySeq"));

const toTuple = (elements: readonly Ast[]) =>
  elements.reduce(
    (result, element) => apply(toConstant("Tuples.Append"), result, element),
    toConstant("Tuples.emptySeq"),
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

interface TypedName {
  readonly name: string;
  readonly type: Typ | undefined;
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

  private parseIdentifier(): string {
    const token = this.next();
    if (token.kind !== "id") throw this.syntaxError();
    return token.text;
  }

  isAtEnd() {
    return this.peek().kind === "end";
  }

  parseType(): Typ {
    const domains = this.isDelimiter("[") ? this.parseTypeList() : undefined;
    const atom = domains === undefined ? this.parseTypeAtom() : undefined;
    if (this.isDelimiter("=>") || this.isDelimiter("\\<Rightarrow>")) {
      this.position += 1;
      const range = this.parseType();
      return (domains ?? [atom ?? TLA_TYPE]).reduceRight(
        (result, domain) => funT(domain, result),
        range,
      );
    }
    if (atom === undefined) throw this.syntaxError();
    return atom;
  }

  private parseTypeList(): Typ[] {
    this.expect("[");
    const types = [this.parseType()];
    while (this.isDelimiter(",")) {
      this.position += 1;
      types.push(this.parseType());
    }
    this.expect("]");
    return types;
  }

  private parseTypeAtom(): Typ {
    if (this.isDelimiter("(")) {
      this.position += 1;
      const type = this.parseType();
      this.expect(")");
      return type;
    }
    const name = this.parseIdentifier();
    if (name === "c") return TLA_TYPE;
    if (name === "prop") return propT;
    throw new TlaIsabelleError("ERROR", `Undefined type name: ${name}`);
  }

  private parseBinders(isConstrainable: boolean): TypedName[] {
    const binders: TypedName[] = [];
    while (this.peek().kind === "id") {
      const name = this.parseIdentifier();
      if (isConstrainable && this.isDelimiter("::")) {
        this.position += 1;
        binders.push({ name, type: this.parseType() });
      } else binders.push({ name, type: undefined });
    }
    if (binders.length === 0) throw this.syntaxError();
    return binders;
  }

  private parseCommaList(close: string): Ast[] {
    if (this.isDelimiter(close)) {
      this.position += 1;
      return [];
    }
    const items = [this.parseLogic(0)];
    while (this.isDelimiter(",")) {
      this.position += 1;
      items.push(this.parseLogic(0));
    }
    this.expect(close);
    return items;
  }

  parseLogic(minimum: number): Ast {
    const parsed = this.parseExpression(minimum);
    if (parsed.isProp)
      throw new TlaIsabelleError("ERROR", "Inner syntax error: proposition in term position");
    return parsed.ast;
  }

  parseProp(minimum: number): Ast {
    const parsed = this.parseExpression(minimum);
    return parsed.isProp ? parsed.ast : apply(toConstant("PredicateLogic.Trueprop"), parsed.ast);
  }

  private parseExpression(minimum: number): Parsed {
    let left = this.parsePrefix(minimum);
    for (;;) {
      const token = this.peek();
      if (token.kind !== "delimiter") return left;
      if (token.text === "\\<Longrightarrow>") {
        if (minimum > 1 || (left.isProp && left.priority < 2)) return left;
        this.position += 1;
        const premise = left.isProp
          ? left.ast
          : apply(toConstant("PredicateLogic.Trueprop"), left.ast);
        left = {
          ast: apply(toConstant("Pure.imp"), premise, this.parseProp(1)),
          priority: 1,
          isProp: true,
        };
        continue;
      }
      if (left.isProp) return left;
      if (token.text === "::") {
        if (minimum > 3 || left.priority < 4) return left;
        this.position += 1;
        left = {
          ast: { kind: "constrain", term: left.ast, type: this.parseType() },
          priority: 3,
          isProp: false,
        };
        continue;
      }
      if (token.text === "(") {
        if (left.priority < MAX_PRIORITY) return left;
        this.position += 1;
        const args = this.parseCommaList(")");
        if (args.length === 0) throw this.syntaxError();
        left = { ast: apply(left.ast, ...args), priority: MAX_PRIORITY, isProp: false };
        continue;
      }
      if (token.text === "[") {
        if (minimum > 90 || left.priority < 89) return left;
        this.position += 1;
        const index = this.parseLogic(0);
        this.expect("]");
        left = {
          ast: apply(toConstant("Functions.fapply"), left.ast, index),
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
        ast: apply(toConstant(infix.constant), left.ast, this.parseLogic(infix.right)),
        priority: infix.priority,
        isProp: false,
      };
    }
  }

  private parsePrefix(minimum: number): Parsed {
    const token = this.next();
    const toTerm = (ast: Ast, priority = MAX_PRIORITY): Parsed => ({
      ast,
      priority,
      isProp: false,
    });
    if (token.kind === "end") {
      this.position -= 1;
      throw this.syntaxError();
    }
    if (token.kind === "id") return toTerm({ kind: "name", name: token.text });
    if (token.kind === "string") return toTerm(toStringTerm(token.text));
    switch (token.text) {
      case "(": {
        const inner = this.parseExpression(0);
        this.expect(")");
        return { ...inner, priority: MAX_PRIORITY };
      }
      case "0":
        return toTerm(toConstant("Integers.zero"));
      case "{":
        if (this.isDelimiter("}")) {
          this.position += 1;
          return toTerm(toConstant("SetTheory.emptyset"), 100);
        }
        return toTerm(
          this.parseCommaList("}").reduceRight(
            (set, element) => apply(toConstant("SetTheory.addElt"), element, set),
            toConstant("SetTheory.emptyset"),
          ),
        );
      case "<<":
        return toTerm(toTuple(this.parseCommaList(">>")));
      case "\\<langle>":
        return toTerm(toTuple(this.parseCommaList("\\<rangle>")));
      case "[":
        return this.parseBracket();
      case "\\<forall>":
      case "\\<exists>":
        return toTerm(this.parseQuantifier(token.text === "\\<forall>"), 10);
      case "%":
      case "\\<lambda>": {
        if (minimum > 3) throw this.syntaxError();
        const binders = this.parseBinders(true);
        this.expect(".");
        const body = this.parseLogic(3);
        return toTerm(
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
        const binders = this.parseBinders(true);
        this.expect(".");
        const body = this.parseProp(0);
        return {
          ast: binders.reduceRight<Ast>(
            (result, binder) =>
              apply(toConstant("Pure.all"), {
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
    return toTerm(
      apply(toConstant(prefix.constant), this.parseLogic(prefix.argument)),
      prefix.priority,
    );
  }

  private parseQuantifier(isForall: boolean): Ast {
    const names = [this.parseIdentifier()];
    while (this.isDelimiter(",")) {
      this.position += 1;
      names.push(this.parseIdentifier());
    }
    if (this.isDelimiter(":")) {
      this.position += 1;
      const body = this.parseLogic(10);
      const quantifier = toConstant(isForall ? "PredicateLogic.All" : "PredicateLogic.Ex");
      return names.reduceRight(
        (result, name) => apply(quantifier, { kind: "abs", name, type: undefined, body: result }),
        body,
      );
    }
    this.expect("\\<in>");
    const domain = this.parseLogic(0);
    this.expect(":");
    const body = this.parseLogic(0);
    const quantifier = toConstant(isForall ? "SetTheory.bAll" : "SetTheory.bEx");
    return names.reduceRight(
      (result, name) =>
        apply(quantifier, domain, { kind: "abs", name, type: undefined, body: result }),
      body,
    );
  }

  private parseBracket(): Parsed {
    if (this.peek().kind === "id" && this.isDelimiter("\\<in>", 1)) {
      const name = this.parseIdentifier();
      this.position += 1;
      const domain = this.parseLogic(0);
      this.expect("\\<mapsto>");
      const body = this.parseLogic(0);
      this.expect("]");
      return {
        ast: apply(toConstant("Functions.Fcn"), domain, {
          kind: "abs",
          name,
          type: undefined,
          body,
        }),
        priority: 900,
        isProp: false,
      };
    }
    const first = this.parseLogic(0);
    if (this.isDelimiter("\\<rightarrow>")) {
      this.position += 1;
      const range = this.parseLogic(0);
      this.expect("]");
      return {
        ast: apply(toConstant("Functions.FuncSet"), first, range),
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
        const index = this.parseLogic(0);
        this.expect("]");
        this.expect("=");
        result = apply(toConstant("Functions.except"), result, index, this.parseLogic(0));
        if (!this.isDelimiter(",")) break;
        this.position += 1;
      }
      this.expect("]");
      return { ast: result, priority: 900, isProp: false };
    }
    this.expect(":");
    const domains = [first];
    const ranges = [this.parseLogic(0)];
    while (this.isDelimiter(",")) {
      this.position += 1;
      domains.push(this.parseLogic(0));
      this.expect(":");
      ranges.push(this.parseLogic(0));
    }
    this.expect("]");
    return {
      ast: apply(toConstant("Tuples.EnumFuncSet"), toTuple(domains), toTuple(ranges)),
      priority: MAX_PRIORITY,
      isProp: false,
    };
  }
}

const parseWith = <Result>(text: string, parse: (parser: Parser) => Result): Result => {
  const parser = new Parser(tokenize(text));
  const result = parse(parser);
  if (!parser.isAtEnd())
    throw new TlaIsabelleError(
      "ERROR",
      `Inner syntax error: trailing input in ${text.slice(0, 40)}`,
    );
  return result;
};

export const parseProp = (text: string) => parseWith(text, (parser) => parser.parseProp(0));

export const parseType = (text: string) => parseWith(text, (parser) => parser.parseType());
