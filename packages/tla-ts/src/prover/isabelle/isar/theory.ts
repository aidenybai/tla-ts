// Reads the outer syntax of a theory into its commands, which decide.ts then runs one after the
// other, as Isabelle's toplevel does. It covers the theories tlapm writes (Isabelle.thy_temp in
// isabelle.ml), the structured proofs Zenon writes into them, and theories of lemmas, definitions
// and structured proofs such as tlapm's isabelle/examples.

import { TlaIsabelleError } from "../../../errors";

export type OuterToken =
  | { readonly kind: "word"; readonly text: string }
  | { readonly kind: "string"; readonly text: string }
  | { readonly kind: "cartouche"; readonly text: string }
  | { readonly kind: "var"; readonly text: string }
  | { readonly kind: "symbol"; readonly text: string };

export interface FixedVariable {
  readonly name: string;
  readonly type: string | undefined;
}

export interface AttributeSource {
  readonly name: string;
  readonly args: readonly OuterToken[];
}

export interface FactReference {
  readonly name: string;
  readonly attributes: readonly AttributeSource[];
}

// A proposition with the patterns of its (is ...) term bindings.
export interface Propp {
  readonly text: string;
  readonly patterns: readonly string[];
}

export interface StatementPart {
  readonly name: string | undefined;
  readonly attributes: readonly AttributeSource[];
  readonly props: readonly Propp[];
}

export type StatementElement =
  | { readonly kind: "fixes"; readonly variables: readonly FixedVariable[] }
  | { readonly kind: "assumes"; readonly parts: readonly StatementPart[] };

export type MethodText =
  | { readonly kind: "source"; readonly name: string; readonly args: readonly OuterToken[] }
  | {
      readonly kind: "then" | "thenAllNew" | "orelse" | "try" | "repeat1";
      readonly texts: readonly MethodText[];
    }
  | { readonly kind: "select"; readonly count: number; readonly text: MethodText };

export type Command =
  | {
      readonly kind: "consts";
      readonly consts: readonly { readonly name: string; readonly type: string }[];
    }
  | {
      readonly kind: "definition";
      readonly name: string | undefined;
      readonly type: string | undefined;
      readonly part: StatementPart;
    }
  | { readonly kind: "declare"; readonly facts: readonly FactReference[] }
  | {
      readonly kind: "theorem";
      readonly name: string | undefined;
      readonly attributes: readonly AttributeSource[];
      readonly elements: readonly StatementElement[];
      readonly shows: readonly StatementPart[];
      readonly isLong: boolean;
    }
  | { readonly kind: "proof"; readonly method: MethodText | undefined }
  | { readonly kind: "qed"; readonly method: MethodText | undefined }
  | { readonly kind: "by"; readonly initial: MethodText; readonly terminal: MethodText | undefined }
  | { readonly kind: "next" | "then" | "moreover" | "ultimately" }
  | {
      readonly kind: "goal";
      readonly command: "have" | "show" | "hence" | "thus";
      readonly parts: readonly StatementPart[];
    }
  | { readonly kind: "assume"; readonly parts: readonly StatementPart[] }
  | { readonly kind: "fix"; readonly variables: readonly FixedVariable[] }
  | {
      readonly kind: "facts";
      readonly command: "from" | "with" | "using" | "unfolding";
      readonly facts: readonly FactReference[];
    }
  | {
      readonly kind: "case";
      readonly binding: string | undefined;
      readonly name: string;
      readonly params: readonly (string | undefined)[];
    };

export interface TheoryText {
  readonly name: string;
  readonly commands: readonly Command[];
}

const isWordChar = (char: string) => /[A-Za-z0-9_'.]/.test(char);

// Outer strings unescape \" and \\; symbols such as \<in> stay as they are.
const readString = (text: string, start: number): [string, number] => {
  let result = "";
  let position = start + 1;
  while (position < text.length && text[position] !== '"') {
    if (text[position] === "\\" && (text[position + 1] === '"' || text[position + 1] === "\\")) {
      result += text[position + 1];
      position += 2;
    } else {
      result += text[position];
      position += 1;
    }
  }
  if (position >= text.length)
    throw new TlaIsabelleError("ERROR", "Outer lexical error: unterminated string");
  return [result, position + 1];
};

const skipComment = (text: string, start: number) => {
  let depth = 0;
  let position = start;
  do {
    if (text.startsWith("(*", position)) {
      depth += 1;
      position += 2;
    } else if (text.startsWith("*)", position)) {
      depth -= 1;
      position += 2;
    } else if (position >= text.length)
      throw new TlaIsabelleError("ERROR", "Outer lexical error: unterminated comment");
    else position += 1;
  } while (depth > 0);
  return position;
};

// A cartouche nests \<open> and \<close>.
const skipCartouche = (text: string, start: number) => {
  let depth = 0;
  let position = start;
  do {
    if (text.startsWith("\\<open>", position)) {
      depth += 1;
      position += "\\<open>".length;
    } else if (text.startsWith("\\<close>", position)) {
      depth -= 1;
      position += "\\<close>".length;
    } else if (position >= text.length)
      throw new TlaIsabelleError("ERROR", "Outer lexical error: unclosed text cartouche");
    else position += 1;
  } while (depth > 0);
  return position;
};

const tokenize = (text: string): OuterToken[] => {
  const tokens: OuterToken[] = [];
  let position = 0;
  while (position < text.length) {
    if (/\s/.test(text[position])) position += 1;
    else if (text.startsWith("(*", position)) position = skipComment(text, position);
    else if (text[position] === '"') {
      const [string, end] = readString(text, position);
      tokens.push({ kind: "string", text: string });
      position = end;
    } else if (text.startsWith("\\<comment>", position)) {
      // A formal comment is a cartouche after \<comment>, which the outer syntax ignores.
      const start = position + "\\<comment>".length;
      const cartouche = start + (/^\s*/.exec(text.slice(start))?.[0].length ?? 0);
      if (!text.startsWith("\\<open>", cartouche))
        throw new TlaIsabelleError("ERROR", "Outer lexical error: comment without a cartouche");
      position = skipCartouche(text, cartouche);
    } else if (text.startsWith("\\<open>", position)) {
      const end = skipCartouche(text, position);
      tokens.push({ kind: "cartouche", text: text.slice(position, end) });
      position = end;
    } else if (text[position] === "?" && /[A-Za-z]/.test(text[position + 1] ?? "")) {
      let end = position + 1;
      while (end < text.length && isWordChar(text[end])) end += 1;
      tokens.push({ kind: "var", text: text.slice(position, end) });
      position = end;
    } else if (isWordChar(text[position])) {
      let end = position;
      while (end < text.length && isWordChar(text[end])) end += 1;
      tokens.push({ kind: "word", text: text.slice(position, end) });
      position = end;
    } else {
      tokens.push({ kind: "symbol", text: text[position] });
      position += 1;
    }
  }
  return tokens;
};

const DOCUMENT_COMMANDS = new Set([
  "chapter",
  "section",
  "subsection",
  "subsubsection",
  "paragraph",
  "subparagraph",
  "text",
  "txt",
  "text_raw",
  "ML_command",
]);

const THEOREM_COMMANDS = new Set(["lemma", "theorem", "corollary", "proposition"]);

const COMMANDS = new Set([
  ...DOCUMENT_COMMANDS,
  ...THEOREM_COMMANDS,
  "consts",
  "definition",
  "declare",
  "proof",
  "qed",
  "by",
  "next",
  "then",
  "moreover",
  "ultimately",
  "have",
  "show",
  "hence",
  "thus",
  "assume",
  "fix",
  "from",
  "with",
  "using",
  "unfolding",
  "case",
  "end",
]);

const KEYWORDS = new Set([
  ...COMMANDS,
  "fixes",
  "assumes",
  "shows",
  "and",
  "is",
  "where",
  "imports",
  "begin",
]);

// Method.parser: a method name takes the arguments up to a separator, Parse.args1.
const isArgumentSeparator = (token: OuterToken, isBlock: boolean) =>
  token.kind === "symbol" &&
  (token.text === "|" ||
    token.text === "?" ||
    token.text === "+" ||
    token.text === ";" ||
    token.text === ")" ||
    token.text === "]" ||
    (!isBlock && token.text === ","));

export const parseTheory = (text: string): TheoryText => {
  const tokens = tokenize(text);
  let position = 0;
  const peek = (offset = 0): OuterToken | undefined => tokens[position + offset];
  const isWord = (word: string, offset = 0) =>
    peek(offset)?.kind === "word" && peek(offset)?.text === word;
  const isSymbol = (symbol: string, offset = 0) =>
    peek(offset)?.kind === "symbol" && peek(offset)?.text === symbol;
  const syntaxError = () =>
    new TlaIsabelleError("ERROR", `Outer syntax error at: ${peek()?.text ?? "end of input"}`);
  const expectWord = (word: string) => {
    if (!isWord(word)) throw syntaxError();
    position += 1;
  };
  const expectSymbol = (symbol: string) => {
    if (!isSymbol(symbol)) throw syntaxError();
    position += 1;
  };
  const isName = (offset = 0) => {
    const token = peek(offset);
    return token?.kind === "word" && !KEYWORDS.has(token.text);
  };
  const name = () => {
    if (!isName()) throw syntaxError();
    position += 1;
    return tokens[position - 1].text;
  };
  const string = () => {
    const token = peek();
    if (token?.kind !== "string") throw syntaxError();
    position += 1;
    return token.text;
  };
  // Parse.term and Parse.typ: an inner text is a string, a cartouche or a single name.
  const isInner = () =>
    peek()?.kind === "string" || peek()?.kind === "cartouche" || peek()?.kind === "var" || isName();
  const inner = () => {
    const token = peek();
    if (token?.kind === "cartouche") {
      position += 1;
      return token.text.slice("\\<open>".length, -"\\<close>".length);
    }
    if (token?.kind === "var") {
      position += 1;
      return token.text;
    }
    return token?.kind === "string" ? string() : name();
  };
  const andList = <Item>(read: () => Item) => {
    const items = [read()];
    while (isWord("and")) {
      position += 1;
      items.push(read());
    }
    return items;
  };
  // A balanced group of tokens, as the arguments of a method or an attribute.
  const args = (isBlock: boolean): OuterToken[] => {
    const found: OuterToken[] = [];
    for (;;) {
      const token = peek();
      if (token === undefined || isArgumentSeparator(token, isBlock)) return found;
      if (token.kind === "word" && COMMANDS.has(token.text)) return found;
      position += 1;
      found.push(token);
      if (token.kind === "symbol" && (token.text === "(" || token.text === "[")) {
        found.push(...args(true));
        const close = token.text === "(" ? ")" : "]";
        found.push(tokens[position]);
        expectSymbol(close);
      }
    }
  };
  const attributes = (): AttributeSource[] => {
    if (!isSymbol("[")) return [];
    position += 1;
    if (isSymbol("]")) {
      position += 1;
      return [];
    }
    const found: AttributeSource[] = [];
    for (;;) {
      const attribute = name();
      found.push({ name: attribute, args: args(false) });
      if (isSymbol("]")) break;
      expectSymbol(",");
    }
    position += 1;
    return found;
  };
  const facts = (): FactReference[] => {
    const found: FactReference[] = [];
    while (isName() || (isWord("and") && isName(1))) {
      if (isWord("and")) position += 1;
      found.push({ name: name(), attributes: attributes() });
    }
    return found;
  };
  // Parse_Spec.opt_thm_name ":".
  const thmName = (): { name: string | undefined; attributes: AttributeSource[] } => {
    if (isName() && (isSymbol(":", 1) || isSymbol("[", 1))) {
      const start = position;
      const found = { name: name(), attributes: attributes() };
      if (isSymbol(":") && !isSymbol(":", 1)) {
        position += 1;
        return found;
      }
      position = start;
    }
    if (isSymbol("[")) {
      const start = position;
      const found = attributes();
      if (isSymbol(":")) {
        position += 1;
        return { name: undefined, attributes: found };
      }
      position = start;
    }
    return { name: undefined, attributes: [] };
  };
  const propp = (): Propp => {
    const prop = inner();
    if (!(isSymbol("(") && isWord("is", 1))) return { text: prop, patterns: [] };
    position += 2;
    const patterns = [inner()];
    while (isInner()) patterns.push(inner());
    expectSymbol(")");
    return { text: prop, patterns };
  };
  const statementPart = (): StatementPart => {
    const header = thmName();
    const props = [propp()];
    while (isInner()) props.push(propp());
    return { ...header, props };
  };
  const statement = () => andList(statementPart);
  const variables = (): FixedVariable[] => {
    const names = [name()];
    while (isName() && !isSymbol(":", 1)) names.push(name());
    if (!(isSymbol(":") && isSymbol(":", 1)))
      return names.map((variable) => ({ name: variable, type: undefined }));
    position += 2;
    const type = inner();
    return names.map((variable) => ({ name: variable, type }));
  };
  const fixes = () => andList(variables).flat();

  const methodName = (): string => {
    const token = peek();
    if (token?.kind === "word" && !COMMANDS.has(token.text)) {
      position += 1;
      return token.text;
    }
    if (token?.kind === "symbol" && token.text === "-") {
      position += 1;
      return "-";
    }
    throw syntaxError();
  };
  const method5 = (): MethodText => {
    if (!isSymbol("(")) return { kind: "source", name: methodName(), args: [] };
    position += 1;
    const text = method0();
    expectSymbol(")");
    return text;
  };
  const method4 = (): MethodText => {
    const text = method5();
    if (isSymbol("?")) {
      position += 1;
      return { kind: "try", texts: [text] };
    }
    if (isSymbol("+")) {
      position += 1;
      return { kind: "repeat1", texts: [text] };
    }
    if (isSymbol("[")) {
      position += 1;
      const count = isSymbol("]") ? 1 : Number(name());
      expectSymbol("]");
      return { kind: "select", count, text };
    }
    return text;
  };
  const method3 = (): MethodText => {
    if (isSymbol("(")) return method4();
    const start = position;
    const methodSource = methodName();
    const found = args(false);
    if (found.length === 0) {
      position = start;
      return method4();
    }
    return { kind: "source", name: methodSource, args: found };
  };
  const enumeration = (
    separator: string,
    kind: "then" | "thenAllNew" | "orelse",
    read: () => MethodText,
  ): MethodText => {
    const texts = [read()];
    while (isSymbol(separator)) {
      position += 1;
      texts.push(read());
    }
    return texts.length === 1 ? texts[0] : { kind, texts };
  };
  const method2 = () => enumeration(",", "then", method3);
  const method1 = () => enumeration(";", "thenAllNew", method2);
  const method0 = (): MethodText => enumeration("|", "orelse", method1);
  const isMethodStart = () =>
    isSymbol("(") ||
    isSymbol("-") ||
    (peek()?.kind === "word" && !COMMANDS.has(peek()?.text ?? ""));
  const optionalMethod = () => (isMethodStart() ? method4() : undefined);

  const theoremCommand = (): Command => {
    position += 1;
    const header = thmName();
    const isLong = isWord("fixes") || isWord("assumes") || isWord("shows");
    if (!isLong) return { kind: "theorem", ...header, elements: [], shows: statement(), isLong };
    const elements: StatementElement[] = [];
    while (isWord("fixes") || isWord("assumes")) {
      const isFixes = isWord("fixes");
      position += 1;
      elements.push(
        isFixes ? { kind: "fixes", variables: fixes() } : { kind: "assumes", parts: statement() },
      );
    }
    expectWord("shows");
    return { kind: "theorem", ...header, elements, shows: statement(), isLong };
  };
  const definitionCommand = (): Command => {
    position += 1;
    const isDeclaration =
      isName() && (isWord("where", 1) || (isSymbol(":", 1) && isSymbol(":", 2)));
    const declared = isDeclaration ? name() : undefined;
    const type = declared !== undefined && isSymbol(":") ? ((position += 2), inner()) : undefined;
    if (declared !== undefined) expectWord("where");
    return { kind: "definition", name: declared, type, part: statementPart() };
  };
  // Parse_Spec.opt_thm_name ":", then a case name, alone or with names for its parameters.
  const caseCommand = (): Command => {
    const header = thmName();
    if (header.attributes.length > 0)
      throw new TlaIsabelleError("ERROR", "Unsupported attributes of a case");
    if (!isSymbol("(")) return { kind: "case", binding: header.name, name: name(), params: [] };
    position += 1;
    const caseName = name();
    const params: (string | undefined)[] = [];
    while (!isSymbol(")")) {
      const isDummy = isWord("_");
      params.push(isDummy ? undefined : name());
      if (isDummy) position += 1;
    }
    position += 1;
    return { kind: "case", binding: header.name, name: caseName, params };
  };
  const command = (): Command | undefined => {
    const token = peek();
    if (token?.kind !== "word") throw syntaxError();
    if (DOCUMENT_COMMANDS.has(token.text)) {
      position += 1;
      if (peek()?.kind !== "cartouche" && peek()?.kind !== "string") throw syntaxError();
      position += 1;
      return undefined;
    }
    if (THEOREM_COMMANDS.has(token.text)) return theoremCommand();
    position += 1;
    switch (token.text) {
      case "consts": {
        const consts: { name: string; type: string }[] = [];
        while (isName() || peek()?.kind === "string") {
          const constName = inner();
          expectSymbol(":");
          expectSymbol(":");
          consts.push({ name: constName, type: inner() });
        }
        return { kind: "consts", consts };
      }
      case "definition":
        position -= 1;
        return definitionCommand();
      case "declare":
        return { kind: "declare", facts: facts() };
      case "proof":
        return { kind: "proof", method: optionalMethod() };
      case "qed":
        return { kind: "qed", method: optionalMethod() };
      case "by":
        return { kind: "by", initial: method4(), terminal: optionalMethod() };
      case "next":
      case "then":
      case "moreover":
      case "ultimately":
        return { kind: token.text };
      case "have":
      case "show":
      case "hence":
      case "thus":
        return { kind: "goal", command: token.text, parts: statement() };
      case "assume":
        return { kind: "assume", parts: statement() };
      case "fix":
        return { kind: "fix", variables: fixes() };
      case "from":
      case "with":
      case "using":
      case "unfolding":
        return { kind: "facts", command: token.text, facts: facts() };
      case "case":
        return caseCommand();
      default:
        position -= 1;
        throw syntaxError();
    }
  };

  // Document commands may precede the theory header.
  while (peek()?.kind === "word" && DOCUMENT_COMMANDS.has(peek()?.text ?? "")) command();
  expectWord("theory");
  const theoryName = name();
  expectWord("imports");
  while (!isWord("begin")) name();
  expectWord("begin");
  const commands: Command[] = [];
  while (!isWord("end") || position + 1 < tokens.length) {
    if (isWord("end")) throw syntaxError();
    const parsed = command();
    if (parsed !== undefined) commands.push(parsed);
  }
  expectWord("end");
  return { name: theoryName, commands };
};
