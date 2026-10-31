// Reads the outer syntax of the theories tlapm writes (Isabelle.thy_temp in isabelle.ml): the
// header, the constants it declares, and one lemma with its proof.
//
//   theory NAME imports Constant Zenon begin
//   consts "name" :: type ...
//   lemma NAME: fixes ... assumes NAME: "prop" ... shows "prop" (is "PROP ?NAME")
//   proof - show "PROP ?NAME" [using assms] by METHOD [METHOD] qed
//   end

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
  // The method of by, then the terminal method if there is one, as outer tokens.
  readonly method: readonly OuterToken[];
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
  const name = () => {
    const token = peek();
    if (token?.kind !== "word" || KEYWORDS.has(token.text)) throw syntaxError();
    position += 1;
    return token.text;
  };
  const string = () => {
    const token = peek();
    if (token?.kind !== "string") throw syntaxError();
    position += 1;
    return token.text;
  };
  const nameOrString = () => (peek()?.kind === "string" ? string() : name());

  expectWord("theory");
  const theoryName = name();
  expectWord("imports");
  while (!isWord("begin")) name();
  expectWord("begin");
  const consts: { name: string; type: string }[] = [];
  if (isWord("consts")) {
    position += 1;
    while (peek()?.kind === "string") {
      const constName = string();
      expectSymbol(":");
      expectSymbol(":");
      consts.push({ name: constName, type: nameOrString() });
    }
  }
  expectWord("lemma");
  name();
  expectSymbol(":");
  const elements: StatementElement[] = [];
  while (isWord("fixes") || isWord("assumes")) {
    if (isWord("fixes")) {
      position += 1;
      const names = [name()];
      while (peek()?.kind === "word" && !KEYWORDS.has(peek().text)) names.push(name());
      elements.push({ kind: "fixes", names });
    } else {
      position += 1;
      const assumption = name();
      expectSymbol(":");
      elements.push({ kind: "assumes", name: assumption, prop: string() });
    }
  }
  expectWord("shows");
  const shows = string();
  expectSymbol("(");
  expectWord("is");
  string();
  expectSymbol(")");
  expectWord("proof");
  expectSymbol("-");
  expectWord("show");
  string();
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
