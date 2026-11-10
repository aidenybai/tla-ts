import { TlaIsabelleError } from "../../../errors";

export type OuterToken =
  | { readonly kind: "word"; readonly text: string }
  | { readonly kind: "string"; readonly text: string }
  | { readonly kind: "symbol"; readonly text: string };

export type StatementElement =
  | { readonly kind: "fixes"; readonly names: readonly string[] }
  | { readonly kind: "assumes"; readonly name: string; readonly prop: string };

export interface TheoryText {
  readonly name: string;
  readonly consts: readonly { readonly name: string; readonly type: string }[];
  readonly elements: readonly StatementElement[];
  readonly shows: string;
  readonly isUsingAssms: boolean;
  readonly method: readonly OuterToken[];
}

const isWordChar = (char: string) => /[A-Za-z0-9_'.]/.test(char);

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

const KEYWORDS = new Set([
  "fixes",
  "assumes",
  "shows",
  "lemma",
  "proof",
  "show",
  "using",
  "by",
  "qed",
  "end",
  "consts",
]);

export const parseTheory = (text: string): TheoryText => {
  const tokens = tokenize(text);
  let position = 0;
  const peek = () => tokens[position];
  const isWord = (word: string) => peek()?.kind === "word" && peek().text === word;
  const syntaxError = () =>
    new TlaIsabelleError(
      "ERROR",
      `Outer syntax error at: ${peek() === undefined ? "end of input" : peek().text}`,
    );
  const expectWord = (word: string) => {
    if (!isWord(word)) throw syntaxError();
    position += 1;
  };
  const expectSymbol = (symbol: string) => {
    if (peek()?.kind !== "symbol" || peek().text !== symbol) throw syntaxError();
    position += 1;
  };
  const expectName = () => {
    const token = peek();
    if (token?.kind !== "word" || KEYWORDS.has(token.text)) throw syntaxError();
    position += 1;
    return token.text;
  };
  const expectString = () => {
    const token = peek();
    if (token?.kind !== "string") throw syntaxError();
    position += 1;
    return token.text;
  };
  const expectNameOrString = () => (peek()?.kind === "string" ? expectString() : expectName());

  expectWord("theory");
  const theoryName = expectName();
  expectWord("imports");
  while (!isWord("begin")) expectName();
  expectWord("begin");
  const consts: { name: string; type: string }[] = [];
  if (isWord("consts")) {
    position += 1;
    while (peek()?.kind === "string") {
      const constName = expectString();
      expectSymbol(":");
      expectSymbol(":");
      consts.push({ name: constName, type: expectNameOrString() });
    }
  }
  expectWord("lemma");
  expectName();
  expectSymbol(":");
  const elements: StatementElement[] = [];
  while (isWord("fixes") || isWord("assumes")) {
    if (isWord("fixes")) {
      position += 1;
      const names = [expectName()];
      while (peek()?.kind === "word" && !KEYWORDS.has(peek().text)) names.push(expectName());
      elements.push({ kind: "fixes", names });
    } else {
      position += 1;
      const assumption = expectName();
      expectSymbol(":");
      elements.push({ kind: "assumes", name: assumption, prop: expectString() });
    }
  }
  expectWord("shows");
  const shows = expectString();
  expectSymbol("(");
  expectWord("is");
  expectString();
  expectSymbol(")");
  expectWord("proof");
  expectSymbol("-");
  expectWord("show");
  expectString();
  const isUsingAssms = isWord("using");
  if (isUsingAssms) {
    position += 1;
    expectWord("assms");
  }
  expectWord("by");
  const methodStart = position;
  while (position < tokens.length && !isWord("qed")) position += 1;
  const method = tokens.slice(methodStart, position);
  expectWord("qed");
  expectWord("end");
  if (position !== tokens.length) throw syntaxError();
  return { name: theoryName, consts, elements, shows, isUsingAssms, method };
};
