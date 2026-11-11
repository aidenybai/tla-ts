// Reads the theories tlapm writes (Isabelle.thy_temp in isabelle.ml):
//
//   theory NAME imports Constant Zenon begin
//   consts "name" :: type ...
//   lemma NAME: fixes ... assumes NAME: "prop" ... shows "prop" (is "PROP ?NAME")
//   proof - show "PROP ?NAME" [using assms] by METHOD [METHOD] qed
//   end
//
// and theories of lemmas proved by a method, such as tlapm's isabelle/tests/Tests.thy, with text
// between them:
//
//   lemma [NAME:] fixes x y :: "type" and z assumes [NAME:] "prop" and "prop" shows "prop"
//   [using assms] by METHOD [METHOD]

import { TlaIsabelleError } from "../../../errors";

export type OuterToken =
  | { readonly kind: "word"; readonly text: string }
  | { readonly kind: "string"; readonly text: string }
  | { readonly kind: "cartouche"; readonly text: string }
  | { readonly kind: "symbol"; readonly text: string };

export interface FixedVariable {
  readonly name: string;
  readonly type: string | undefined;
}

export type StatementElement =
  | { readonly kind: "fixes"; readonly variables: readonly FixedVariable[] }
  | { readonly kind: "assumes"; readonly props: readonly string[] };

export interface LemmaText {
  readonly elements: readonly StatementElement[];
  readonly shows: string;
  readonly isUsingAssms: boolean;
  readonly method: readonly OuterToken[];
}

export interface TheoryText {
  readonly name: string;
  readonly consts: readonly { readonly name: string; readonly type: string }[];
  readonly lemmas: readonly LemmaText[];
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
  "text_raw",
]);

const KEYWORDS = new Set([
  "fixes",
  "assumes",
  "shows",
  "and",
  "is",
  "lemma",
  "proof",
  "show",
  "using",
  "by",
  "qed",
  "end",
  "consts",
  ...DOCUMENT_COMMANDS,
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
  const isSymbol = (symbol: string) => peek()?.kind === "symbol" && peek().text === symbol;
  const isName = () => peek()?.kind === "word" && !KEYWORDS.has(peek().text);
  const andList = <T>(read: () => T) => {
    const items = [read()];
    while (isWord("and")) {
      position += 1;
      items.push(read());
    }
    return items;
  };
  // Parse.vars: names that share an optional type.
  const variables = () => {
    const names = [name()];
    while (isName()) names.push(name());
    if (!isSymbol(":")) return names.map((variable) => ({ name: variable, type: undefined }));
    expectSymbol(":");
    expectSymbol(":");
    const type = nameOrString();
    return names.map((variable) => ({ name: variable, type }));
  };
  // Parse_Spec.opt_thm_name ":" followed by the propositions it names.
  const props = () => {
    if (isName() && tokens[position + 1]?.kind === "symbol" && tokens[position + 1].text === ":")
      position += 2;
    const found = [string()];
    while (peek()?.kind === "string") found.push(string());
    return found;
  };
  const isDocument = () => peek()?.kind === "word" && DOCUMENT_COMMANDS.has(peek().text);
  // A method runs to the next command.
  const method = () => {
    const methodStart = position;
    let depth = 0;
    while (
      position < tokens.length &&
      !(depth === 0 && (isWord("qed") || isWord("lemma") || isWord("end") || isDocument()))
    ) {
      if (isSymbol("(")) depth += 1;
      if (isSymbol(")")) depth -= 1;
      position += 1;
    }
    return tokens.slice(methodStart, position);
  };
  const proof = () => {
    const isUsingAssms = isWord("using");
    if (isUsingAssms) {
      position += 1;
      expectWord("assms");
    }
    expectWord("by");
    return { isUsingAssms, method: method() };
  };
  const lemma = (): LemmaText => {
    expectWord("lemma");
    if (isName()) {
      name();
      expectSymbol(":");
    }
    const elements: StatementElement[] = [];
    while (isWord("fixes") || isWord("assumes")) {
      const isFixes = isWord("fixes");
      position += 1;
      elements.push(
        isFixes
          ? { kind: "fixes", variables: andList(variables).flat() }
          : { kind: "assumes", props: andList(props).flat() },
      );
    }
    expectWord("shows");
    const shows = string();
    if (!isSymbol("(")) return { elements, shows, ...proof() };
    expectSymbol("(");
    expectWord("is");
    string();
    expectSymbol(")");
    expectWord("proof");
    expectSymbol("-");
    expectWord("show");
    string();
    const found = proof();
    expectWord("qed");
    return { elements, shows, ...found };
  };
  const lemmas: LemmaText[] = [];
  while (!isWord("end")) {
    if (isDocument()) {
      position += 1;
      if (peek()?.kind !== "cartouche" && peek()?.kind !== "string") throw syntaxError();
      position += 1;
    } else lemmas.push(lemma());
  }
  expectWord("end");
  if (position !== tokens.length) throw syntaxError();
  return { name: theoryName, consts, lemmas };
};
