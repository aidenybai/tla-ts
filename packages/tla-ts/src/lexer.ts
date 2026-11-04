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

// spelling holds the text of an operator written as a synonym, such as (+) for \oplus.
export interface Token {
  kind: TokenKind;
  text: string;
  spelling?: string;
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

// The Unicode forms of the operators SANY's grammar, javacc/tla+.jj, reads, as their ASCII forms.
const UNICODE_OPERATORS = new Map([
  ["∃", "\\E"],
  ["∀", "\\A"],
  ["∷", "::"],
  ["≜", "=="],
  ["⟨", "<<"],
  ["⟩_", ">>_"],
  ["⟩", ">>"],
  ["→", "->"],
  ["←", "<-"],
  ["↦", "|->"],
  ["⁺", "^+"],
  ["¬", "~"],
  ["□", "[]"],
  ["◇", "<>"],
  ["∧", "/\\"],
  ["∨", "\\/"],
  ["∈", "\\in"],
  ["≈", "\\approx"],
  ["≔", ":="],
  ["≍", "\\asymp"],
  ["◯", "\\bigcirc"],
  ["⩴", "::="],
  ["●", "\\bullet"],
  ["∩", "\\cap"],
  ["⋅", "\\cdot"],
  ["∘", "\\o"],
  ["≅", "\\cong"],
  ["∪", "\\cup"],
  ["÷", "\\div"],
  ["≐", "\\doteq"],
  ["‥", ".."],
  ["…", "..."],
  ["≡", "<=>"],
  ["‼", "!!"],
  ["≥", ">="],
  ["≫", "\\gg"],
  ["⇔", "<=>"],
  ["⇒", "=>"],
  ["⫤", "=|"],
  ["↝", "~>"],
  ["≤", "<="],
  ["≪", "\\ll"],
  ["⊣", "-|"],
  ["≠", "#"],
  ["∉", "\\notin"],
  ["⊙", "\\odot"],
  ["⊖", "\\ominus"],
  ["⊕", "\\oplus"],
  ["⊘", "\\oslash"],
  ["⊗", "\\otimes"],
  ["⇸", "-+->"],
  ["≺", "\\prec"],
  ["⪯", "\\preceq"],
  ["∝", "\\propto"],
  ["⁇", "??"],
  ["⊨", "|="],
  ["⊢", "|-"],
  ["∼", "\\sim"],
  ["≃", "\\simeq"],
  ["⊓", "\\sqcap"],
  ["⊔", "\\sqcup"],
  ["⊏", "\\sqsubset"],
  ["⊑", "\\sqsubseteq"],
  ["⊐", "\\sqsupset"],
  ["⊒", "\\sqsupseteq"],
  ["⋆", "\\star"],
  ["⊂", "\\subset"],
  ["⊆", "\\subseteq"],
  ["≻", "\\succ"],
  ["⪰", "\\succeq"],
  ["⊃", "\\supset"],
  ["⊇", "\\supseteq"],
  ["×", "\\X"],
  ["⊎", "\\uplus"],
  ["‖", "||"],
  ["≀", "\\wr"],
]);

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

const CODE_TAB = 9;
const CODE_NEWLINE = 10;
const CODE_RETURN = 13;
const CODE_SPACE = 32;
const CODE_QUOTE = 34;
const CODE_OPEN_PAREN = 40;
const CODE_STAR = 42;
const CODE_DASH = 45;
const CODE_DOT = 46;
const CODE_LESS_THAN = 60;
const CODE_EQUALS = 61;
const CODE_BACKSLASH = 92;
const CODE_UNDERSCORE = 95;

const DIGIT = 1;
const LETTER = 2;
const UNDERSCORE = 4;
const BINARY_DIGIT = 8;
const OCTAL_DIGIT = 16;
const HEX_DIGIT = 32;
const IDENTIFIER = DIGIT | LETTER | UNDERSCORE;

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";

// The classes each ASCII character belongs to, as a bit each.
const CHARACTER_CLASSES = new Uint8Array(128);
new Map([
  ["0123456789", DIGIT | HEX_DIGIT],
  [LOWERCASE + LOWERCASE.toUpperCase(), LETTER],
  ["_", UNDERSCORE],
  ["01", BINARY_DIGIT],
  ["01234567", OCTAL_DIGIT],
  ["abcdefABCDEF", HEX_DIGIT],
]).forEach((characterClass, characters) => {
  for (const character of characters) {
    CHARACTER_CLASSES[character.charCodeAt(0)] |= characterClass;
  }
});

// charCodeAt past the end of a source gives NaN, which is in no class.
const isInClass = (code: number, characterClass: number) =>
  code < 128 && (CHARACTER_CLASSES[code] & characterClass) !== 0;

const skipClass = (source: string, index: number, characterClass: number) => {
  let end = index;
  while (isInClass(source.charCodeAt(end), characterClass)) end++;
  return end;
};

interface OperatorMatch {
  text: string;
  length: number;
}

// The symbol operators that start with each character, in the order of SYMBOL_OPERATORS, which
// lists a longer operator before the operators it starts with.
const SYMBOL_OPERATORS_BY_START = new Map<number, string[]>();
SYMBOL_OPERATORS.forEach((symbol) => {
  const start = symbol.charCodeAt(0);
  const candidates = SYMBOL_OPERATORS_BY_START.get(start) ?? [];
  candidates.push(symbol);
  SYMBOL_OPERATORS_BY_START.set(start, candidates);
});

const matchSymbolOperator = (source: string, index: number) => {
  const candidates = SYMBOL_OPERATORS_BY_START.get(source.charCodeAt(index));
  if (candidates === undefined) return undefined;
  for (let position = 0; position < candidates.length; position++) {
    if (source.startsWith(candidates[position], index)) return candidates[position];
  }
  return undefined;
};

const matchUnicodeOperator = (source: string, index: number) => {
  if (source.charCodeAt(index) < 128) return undefined;
  const pair = source.slice(index, index + 2);
  if (UNICODE_OPERATORS.has(pair)) return pair;
  const single = source[index];
  return UNICODE_OPERATORS.has(single) ? single : undefined;
};

export const matchOperator = (source: string, index: number): OperatorMatch | undefined => {
  const code = source.charCodeAt(index);
  if (code === CODE_BACKSLASH && isInClass(source.charCodeAt(index + 1), LETTER)) {
    const word = source.slice(index + 1, skipClass(source, index + 1, LETTER));
    // Like SANY, read the longest operator that the word starts with, so S\used is S \ used.
    const length = { value: word.length };
    while (length.value > 0 && !BACKSLASH_OPERATORS.has(word.slice(0, length.value))) {
      length.value--;
    }
    const operator = BACKSLASH_OPERATORS.get(word.slice(0, length.value));
    return { text: operator ?? "\\", length: operator === undefined ? 1 : length.value + 1 };
  }
  const unicodeSymbol = matchUnicodeOperator(source, index);
  if (unicodeSymbol !== undefined) {
    return { text: UNICODE_OPERATORS.get(unicodeSymbol) ?? "", length: unicodeSymbol.length };
  }
  const symbol = matchSymbolOperator(source, index);
  if (symbol) return { text: SYMBOL_ALIASES.get(symbol) ?? symbol, length: symbol.length };
  return code === CODE_BACKSLASH ? { text: "\\", length: 1 } : undefined;
};

// TLC's configuration parser reads its tokens with SANY's lexer, so it reads a Unicode operator, or
// ℕ, ℤ, or ℝ, as one token, which it compares as written with the words it expects.
const UNICODE_NAMES = new Set(["ℕ", "ℤ", "ℝ"]);
export const matchUnicodeToken = (source: string, index: number): OperatorMatch | undefined => {
  const token = [source.slice(index, index + 2), source[index]].find(
    (candidate) => UNICODE_OPERATORS.has(candidate) || UNICODE_NAMES.has(candidate),
  );
  return token === undefined ? undefined : { text: token, length: token.length };
};

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
  const isImplicit = source[index + 1] === "+" || source[index + 1] === "*";
  const levelEnd = isImplicit ? index + 2 : skipClass(source, index + 1, DIGIT);
  if (levelEnd === index + 1 || source[levelEnd] !== ">") return 0;
  const nameEnd = skipClass(source, levelEnd + 1, IDENTIFIER);
  const isDash = nameEnd === levelEnd + 1 && (source[nameEnd] === "*" || source[nameEnd] === "-");
  return (
    skipWhile(source, isDash ? nameEnd + 1 : nameEnd, (character) => character === ".") - index
  );
};

// SANY's lexer reads @ as an identifier, which stands for the value an EXCEPT changes only alone.
export const readAtAsIdentifier = (token: Token): Token =>
  token.kind === "Operator" && token.text === "@" ? { ...token, kind: "Identifier" } : token;

const TAB_SIZE = 8;

const STRING_ESCAPES: Record<string, string> = { n: "\n", t: "\t", r: "\r", f: "\f" };

const getWidthAfter = (width: number, code: number) =>
  code === CODE_TAB ? width + TAB_SIZE - (width % TAB_SIZE) : width + 1;

const BASED_NUMBER_DIGITS = new Map([
  ["b", BINARY_DIGIT],
  ["o", OCTAL_DIGIT],
  ["h", HEX_DIGIT],
]);

// The length of a based numeral such as \b01 or \hFF at index, or 0.
const matchBasedNumber = (source: string, index: number) => {
  if (source.charCodeAt(index) !== CODE_BACKSLASH) return 0;
  const digits = BASED_NUMBER_DIGITS.get(source.charAt(index + 1).toLowerCase());
  if (digits === undefined) return 0;
  const end = skipClass(source, index + 2, digits);
  return end === index + 2 ? 0 : end - index;
};

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
      scan.width = getWidthAfter(scan.width, source.charCodeAt(scan.position));
    }
    return getWidthAfter(scan.width, source.charCodeAt(cursor.index));
  };
  const pushToken = (kind: TokenKind, text: string, length: number, spelling?: string) => {
    const column = getColumn();
    tokens.push({
      kind,
      text,
      spelling,
      line: cursor.line,
      column,
      endColumn: column + length - 1,
    });
    cursor.index += length;
  };
  const advanceOver = (length: number) => {
    for (let offset = 0; offset < length; offset++) {
      if (source.charCodeAt(cursor.index) === CODE_NEWLINE) {
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
    const code = source.charCodeAt(cursor.index);

    if (code === CODE_NEWLINE || code === CODE_SPACE || code === CODE_TAB || code === CODE_RETURN) {
      advanceOver(1);
      continue;
    }
    if (code === CODE_BACKSLASH && source.charCodeAt(cursor.index + 1) === CODE_STAR) {
      const lineEnd = source.indexOf("\n", cursor.index);
      advanceOver((lineEnd === -1 ? source.length : lineEnd) - cursor.index);
      continue;
    }
    if (code === CODE_OPEN_PAREN && source.charCodeAt(cursor.index + 1) === CODE_STAR) {
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
    if (code === CODE_DASH && source.startsWith("----", cursor.index)) {
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
    if (code === CODE_EQUALS && source.startsWith("====", cursor.index)) {
      const length = skipWhile(source, cursor.index, (next) => next === "=") - cursor.index;
      pushToken("ModuleEnd", "====", length);
      cursor.moduleDepth--;
      if (cursor.moduleDepth <= 0) break;
      continue;
    }
    if (code === CODE_QUOTE) {
      const line = cursor.line;
      const column = getColumn();
      const characters: string[] = [];
      advanceOver(1);
      while (source.charCodeAt(cursor.index) !== CODE_QUOTE) {
        const next = source.charCodeAt(cursor.index);
        if (cursor.index >= source.length || next === CODE_NEWLINE || next === CODE_RETURN) {
          throw createError("Unterminated string");
        }
        if (next === CODE_BACKSLASH) {
          const escaped = source[cursor.index + 1];
          if (escaped === undefined || !'ntrf\\"'.includes(escaped)) {
            throw createError("Invalid escape in string");
          }
          characters.push(STRING_ESCAPES[escaped] ?? escaped);
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
    const basedLength = matchBasedNumber(source, cursor.index);
    if (basedLength > 0) {
      pushToken("Number", source.slice(cursor.index, cursor.index + basedLength), basedLength);
      continue;
    }
    if (isInClass(code, IDENTIFIER)) {
      const wordEnd = skipClass(source, cursor.index, IDENTIFIER);
      const word = source.slice(cursor.index, wordEnd);
      const digitsEnd = skipClass(source, cursor.index, DIGIT);
      if (digitsEnd === wordEnd) {
        const fractionEnd =
          source.charCodeAt(wordEnd) === CODE_DOT ? skipClass(source, wordEnd + 1, DIGIT) : wordEnd;
        const isDecimal = fractionEnd > wordEnd + 1;
        const number = isDecimal ? source.slice(cursor.index, fractionEnd) : word;
        pushToken(isDecimal ? "Decimal" : "Number", number, number.length);
        continue;
      }
      // A word needs a letter to be a name, so SANY reads one without as underscores and numbers.
      if (!/[A-Za-z]/.test(word)) {
        const part = code === CODE_UNDERSCORE ? "_" : source.slice(cursor.index, digitsEnd);
        pushToken(part === "_" ? "Operator" : "Number", part, part.length);
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
    const character = source[cursor.index];
    if (code >= 128 && UNICODE_NAMES.has(character)) {
      pushToken("Identifier", names.get(character) ?? character, 1);
      names.set(character, character);
      continue;
    }
    if (code === CODE_LESS_THAN) {
      const stepLength = matchStep(source, cursor.index);
      if (stepLength > 0) {
        pushToken("Step", source.slice(cursor.index, cursor.index + stepLength), stepLength);
        continue;
      }
    }
    const operator = matchOperator(source, cursor.index);
    if (operator) {
      const spelling = source.slice(cursor.index, cursor.index + operator.length);
      pushToken(
        "Operator",
        operator.text,
        operator.length,
        spelling === operator.text ? undefined : spelling,
      );
      continue;
    }
    throw createError(`Unexpected character ${JSON.stringify(character)}`);
  }

  const endColumn = getColumn();
  tokens.push({ kind: "End", text: "", line: cursor.line, column: endColumn, endColumn });
  return tokens;
};
