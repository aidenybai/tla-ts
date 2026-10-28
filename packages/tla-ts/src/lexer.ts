import { TlaSyntaxError } from "./errors";

type TokenKind =
  | "Identifier"
  | "Number"
  | "Decimal"
  | "String"
  | "Operator"
  | "Keyword"
  | "Step"
  | "Separator"
  | "ModuleEnd"
  | "End";

export interface Token {
  kind: TokenKind;
  text: string;
  line: number;
  column: number;
  endColumn: number;
}

const KEYWORDS = new Set([
  "ACTION",
  "ACTIONS",
  "ASSUME",
  "ASSUMPTION",
  "AXIOM",
  "BY",
  "CASE",
  "CHOOSE",
  "CONSTANT",
  "CONSTANTS",
  "COROLLARY",
  "DEF",
  "DEFINE",
  "DEFS",
  "DOMAIN",
  "ELSE",
  "ENABLED",
  "EXCEPT",
  "EXTENDS",
  "HAVE",
  "HIDE",
  "IF",
  "IN",
  "INSTANCE",
  "LAMBDA",
  "LEMMA",
  "LET",
  "LOCAL",
  "MODULE",
  "NEW",
  "OBVIOUS",
  "OMITTED",
  "ONLY",
  "OTHER",
  "PICK",
  "PROOF",
  "PROPOSITION",
  "PROVE",
  "QED",
  "RECURSIVE",
  "STATE",
  "SUBSET",
  "SUFFICES",
  "TAKE",
  "TEMPORAL",
  "TEMPORALS",
  "THEN",
  "THEOREM",
  "UNCHANGED",
  "UNION",
  "USE",
  "VARIABLE",
  "VARIABLES",
  "WITH",
  "WITNESS",
]);

const BACKSLASH_OPERATORS = new Map([
  ["in", "\\in"],
  ["notin", "\\notin"],
  ["subseteq", "\\subseteq"],
  ["subset", "\\subset"],
  ["supseteq", "\\supseteq"],
  ["supset", "\\supset"],
  ["cup", "\\cup"],
  ["union", "\\cup"],
  ["cap", "\\cap"],
  ["intersect", "\\cap"],
  ["X", "\\X"],
  ["times", "\\X"],
  ["o", "\\o"],
  ["circ", "\\o"],
  ["div", "\\div"],
  ["land", "/\\"],
  ["lor", "\\/"],
  ["lnot", "~"],
  ["neg", "~"],
  ["equiv", "<=>"],
  ["leq", "<="],
  ["geq", ">="],
  ["A", "\\A"],
  ["forall", "\\A"],
  ["E", "\\E"],
  ["exists", "\\E"],
  ["AA", "\\AA"],
  ["EE", "\\EE"],
  ["cdot", "\\cdot"],
  ["sqsubseteq", "\\sqsubseteq"],
  ["sqsupseteq", "\\sqsupseteq"],
  ["sqsubset", "\\sqsubset"],
  ["sqsupset", "\\sqsupset"],
  ["sqcap", "\\sqcap"],
  ["sqcup", "\\sqcup"],
  ["oplus", "\\oplus"],
  ["ominus", "\\ominus"],
  ["otimes", "\\otimes"],
  ["oslash", "\\oslash"],
  ["odot", "\\odot"],
  ["uplus", "\\uplus"],
  ["prec", "\\prec"],
  ["preceq", "\\preceq"],
  ["succ", "\\succ"],
  ["succeq", "\\succeq"],
  ["sim", "\\sim"],
  ["simeq", "\\simeq"],
  ["approx", "\\approx"],
  ["cong", "\\cong"],
  ["asymp", "\\asymp"],
  ["doteq", "\\doteq"],
  ["propto", "\\propto"],
  ["wr", "\\wr"],
  ["star", "\\star"],
  ["bullet", "\\bullet"],
  ["bigcirc", "\\bigcirc"],
  ["ll", "\\ll"],
  ["gg", "\\gg"],
]);

const SYMBOL_ALIASES = new Map([
  ["/=", "#"],
  ["=<", "<="],
  ["(+)", "\\oplus"],
  ["(-)", "\\ominus"],
  ["(.)", "\\odot"],
  ["(/)", "\\oslash"],
  ["(\\X)", "\\otimes"],
]);

const SYMBOL_OPERATORS = [
  "-+->",
  "(\\X)",
  "<=>",
  "|->",
  "...",
  "::=",
  ">>_",
  "(+)",
  "(-)",
  "(.)",
  "(/)",
  "==",
  "=>",
  "=<",
  "=|",
  "<<",
  "<=",
  "<>",
  "<-",
  ">>",
  ">=",
  "/\\",
  "\\/",
  "/=",
  "[]",
  "]_",
  "|-",
  "|=",
  "||",
  "->",
  "-|",
  "~>",
  "..",
  "::",
  ":=",
  ":>",
  "<:",
  "@@",
  "++",
  "--",
  "-.",
  "**",
  "//",
  "^^",
  "^+",
  "^*",
  "^#",
  "%%",
  "##",
  "&&",
  "$$",
  "??",
  "!!",
  "=",
  "<",
  ">",
  "/",
  "[",
  "]",
  "(",
  ")",
  "{",
  "}",
  "|",
  "-",
  "~",
  ".",
  ":",
  "@",
  ",",
  "'",
  "!",
  "#",
  "%",
  "+",
  "*",
  "^",
  "&",
  "$",
  "?",
];

const UNICODE_OPERATORS = new Map([
  ["∧", "/\\"],
  ["∨", "\\/"],
  ["¬", "~"],
  ["⇒", "=>"],
  ["⟹", "=>"],
  ["≡", "<=>"],
  ["⇔", "<=>"],
  ["∈", "\\in"],
  ["∉", "\\notin"],
  ["⊆", "\\subseteq"],
  ["⊂", "\\subset"],
  ["⊇", "\\supseteq"],
  ["⊃", "\\supset"],
  ["∪", "\\cup"],
  ["∩", "\\cap"],
  ["×", "\\X"],
  ["∀", "\\A"],
  ["∃", "\\E"],
  ["≠", "#"],
  ["≤", "<="],
  ["≥", ">="],
  ["↦", "|->"],
  ["→", "->"],
  ["⟨", "<<"],
  ["⟩", ">>"],
  ["□", "[]"],
  ["◇", "<>"],
  ["≜", "=="],
  ["′", "'"],
  ["∘", "\\o"],
  ["⋅", "\\cdot"],
]);

const BASED_NUMBER = /^\\([bB][01]+|[oO][0-7]+|[hH][0-9a-fA-F]+)/;

const NUMBER_BASES = new Map([
  ["b", 2],
  ["o", 8],
  ["h", 16],
]);

// A numeral token keeps its text as typed, such as \hFF, so errors can quote it as TLC does.
export const getNumeralValue = (text: string) =>
  text.startsWith("\\")
    ? parseInt(text.slice(2), NUMBER_BASES.get(text[1].toLowerCase()))
    : Number(text);

const MODULE_HEADER = /-{4,}[ \t]*MODULE\b/;

const isIdentifierCharacter = (character: string) => /[A-Za-z0-9_]/.test(character);

interface OperatorMatch {
  text: string;
  length: number;
}

export const matchOperator = (source: string, index: number): OperatorMatch | undefined => {
  const character = source[index];
  if (character === "\\" && /[A-Za-z]/.test(source[index + 1] ?? "")) {
    const word = /^[A-Za-z]+/.exec(source.slice(index + 1))?.[0] ?? "";
    // Like SANY, read the longest operator that the word starts with, so S\used is S \ used.
    const length = { value: word.length };
    while (length.value > 0 && !BACKSLASH_OPERATORS.has(word.slice(0, length.value))) {
      length.value--;
    }
    const operator = BACKSLASH_OPERATORS.get(word.slice(0, length.value));
    return { text: operator ?? "\\", length: operator === undefined ? 1 : length.value + 1 };
  }
  const unicodeOperator = UNICODE_OPERATORS.get(character);
  if (unicodeOperator) return { text: unicodeOperator, length: character.length };
  const symbol = SYMBOL_OPERATORS.find((candidate) => source.startsWith(candidate, index));
  if (symbol) return { text: SYMBOL_ALIASES.get(symbol) ?? symbol, length: symbol.length };
  return character === "\\" ? { text: "\\", length: 1 } : undefined;
};

const isDigit = (character: string | undefined) =>
  character !== undefined && character >= "0" && character <= "9";

export const skipWhile = (
  source: string,
  index: number,
  isMatch: (character: string) => boolean,
) => {
  const end = { value: index };
  while (end.value < source.length && isMatch(source[end.value])) end.value++;
  return end.value;
};

// The length of a step number such as <1>a., <+>, or <2>*., which SANY reads as one token wherever
// it appears.
const matchStep = (source: string, index: number) => {
  if (source[index] !== "<") return 0;
  const isImplicit = source[index + 1] === "+" || source[index + 1] === "*";
  const levelEnd = isImplicit ? index + 2 : skipWhile(source, index + 1, isDigit);
  if (levelEnd === index + 1 || source[levelEnd] !== ">") return 0;
  const nameEnd = skipWhile(source, levelEnd + 1, isIdentifierCharacter);
  const isDash = nameEnd === levelEnd + 1 && (source[nameEnd] === "*" || source[nameEnd] === "-");
  return (
    skipWhile(source, isDash ? nameEnd + 1 : nameEnd, (character) => character === ".") - index
  );
};

const TAB_SIZE = 8;

const getWidthAfter = (width: number, character: string | undefined) =>
  character === "\t" ? width + TAB_SIZE - (width % TAB_SIZE) : width + 1;

export const tokenize = (source: string): Token[] => {
  const headerMatch = MODULE_HEADER.exec(source);
  if (!headerMatch)
    throw new TlaSyntaxError("Expected a module header such as ---- MODULE Name ----");
  const tokens: Token[] = [];
  // Each name is one string object, so looking a name up in a scope compares pointers.
  const names = new Map<string, string>();
  const prefixLines = source.slice(0, headerMatch.index).split("\n");
  const cursor = {
    index: headerMatch.index,
    line: prefixLines.length,
    lineStart: headerMatch.index - prefixLines[prefixLines.length - 1].length,
    moduleDepth: 0,
  };

  const scan = { lineStart: -1, position: 0, width: 0 };
  const getColumn = () => {
    if (scan.lineStart !== cursor.lineStart || scan.position > cursor.index) {
      scan.lineStart = cursor.lineStart;
      scan.position = cursor.lineStart;
      scan.width = 0;
    }
    for (; scan.position < cursor.index; scan.position++) {
      scan.width = getWidthAfter(scan.width, source[scan.position]);
    }
    return getWidthAfter(scan.width, source[cursor.index]);
  };
  const pushToken = (kind: TokenKind, text: string, length: number) => {
    const column = getColumn();
    tokens.push({ kind, text, line: cursor.line, column, endColumn: column + length - 1 });
    cursor.index += length;
  };
  const advanceOver = (length: number) => {
    for (let offset = 0; offset < length; offset++) {
      if (source[cursor.index] === "\n") {
        cursor.line++;
        cursor.lineStart = cursor.index + 1;
      }
      cursor.index++;
    }
  };
  const createError = (message: string) =>
    new TlaSyntaxError(`${message} at line ${cursor.line}, column ${getColumn()}`, undefined, {
      reason: message,
      line: cursor.line,
      column: getColumn(),
      isEnd: cursor.index >= source.length,
    });

  while (cursor.index < source.length) {
    const character = source[cursor.index];

    if (character === "\n" || character === " " || character === "\t" || character === "\r") {
      advanceOver(1);
      continue;
    }
    if (source.startsWith("\\*", cursor.index)) {
      const lineEnd = source.indexOf("\n", cursor.index);
      advanceOver((lineEnd === -1 ? source.length : lineEnd) - cursor.index);
      continue;
    }
    if (source.startsWith("(*", cursor.index)) {
      const depth = { value: 0 };
      do {
        if (cursor.index >= source.length) throw createError("Unterminated comment");
        if (source.startsWith("(*", cursor.index)) {
          depth.value++;
          advanceOver(2);
        } else if (source.startsWith("*)", cursor.index)) {
          depth.value--;
          advanceOver(2);
        } else {
          advanceOver(1);
        }
      } while (depth.value > 0);
      continue;
    }
    if (source.startsWith("----", cursor.index)) {
      const length = skipWhile(source, cursor.index, (next) => next === "-") - cursor.index;
      if (
        source
          .slice(cursor.index + length)
          .trimStart()
          .startsWith("MODULE")
      )
        cursor.moduleDepth++;
      pushToken("Separator", "----", length);
      continue;
    }
    if (source.startsWith("====", cursor.index)) {
      const length = skipWhile(source, cursor.index, (next) => next === "=") - cursor.index;
      pushToken("ModuleEnd", "====", length);
      cursor.moduleDepth--;
      if (cursor.moduleDepth <= 0) break;
      continue;
    }
    if (character === '"') {
      const line = cursor.line;
      const column = getColumn();
      const characters: string[] = [];
      advanceOver(1);
      while (source[cursor.index] !== '"') {
        if (cursor.index >= source.length || source[cursor.index] === "\n") {
          throw createError("Unterminated string");
        }
        if (source[cursor.index] === "\\") {
          const escaped = source[cursor.index + 1];
          characters.push({ n: "\n", t: "\t", r: "\r", f: "\f" }[escaped] ?? escaped);
          advanceOver(2);
          continue;
        }
        characters.push(source[cursor.index]);
        advanceOver(1);
      }
      advanceOver(1);
      tokens.push({
        kind: "String",
        text: characters.join(""),
        line,
        column,
        endColumn: getColumn() - 1,
      });
      continue;
    }
    const basedNumber = BASED_NUMBER.exec(source.slice(cursor.index, cursor.index + 64));
    if (basedNumber) {
      pushToken("Number", basedNumber[0], basedNumber[0].length);
      continue;
    }
    if (isIdentifierCharacter(character)) {
      const word = source.slice(
        cursor.index,
        skipWhile(source, cursor.index, isIdentifierCharacter),
      );
      if (/^\d+$/.test(word)) {
        const number = /^\d+(\.\d+)?/.exec(source.slice(cursor.index))?.[0] ?? word;
        pushToken(number.includes(".") ? "Decimal" : "Number", number, number.length);
        continue;
      }
      if (word.startsWith("WF_") || word.startsWith("SF_")) {
        pushToken("Keyword", word.slice(0, 3), 3);
        continue;
      }
      const name = names.get(word) ?? word;
      names.set(name, name);
      pushToken(KEYWORDS.has(word) ? "Keyword" : "Identifier", name, word.length);
      continue;
    }
    const stepLength = matchStep(source, cursor.index);
    if (stepLength > 0) {
      pushToken("Step", source.slice(cursor.index, cursor.index + stepLength), stepLength);
      continue;
    }
    const operator = matchOperator(source, cursor.index);
    if (operator) {
      pushToken("Operator", operator.text, operator.length);
      continue;
    }
    throw createError(`Unexpected character ${JSON.stringify(character)}`);
  }

  const endColumn = getColumn();
  tokens.push({ kind: "End", text: "", line: cursor.line, column: endColumn, endColumn });
  return tokens;
};
