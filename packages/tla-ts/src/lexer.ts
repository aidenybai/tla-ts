import { TlaSyntaxError } from "./errors";

export type TokenKind =
  | "Identifier"
  | "Number"
  | "String"
  | "Operator"
  | "Keyword"
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
  "ASSUME",
  "ASSUMPTION",
  "AXIOM",
  "CASE",
  "CHOOSE",
  "CONSTANT",
  "CONSTANTS",
  "COROLLARY",
  "DOMAIN",
  "ELSE",
  "ENABLED",
  "EXCEPT",
  "EXTENDS",
  "IF",
  "IN",
  "INSTANCE",
  "LAMBDA",
  "LEMMA",
  "LET",
  "LOCAL",
  "MODULE",
  "OTHER",
  "PROOF",
  "PROPOSITION",
  "RECURSIVE",
  "SUBSET",
  "THEN",
  "THEOREM",
  "UNCHANGED",
  "UNION",
  "VARIABLE",
  "VARIABLES",
  "WITH",
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
    const operator = BACKSLASH_OPERATORS.get(word);
    return operator === undefined ? undefined : { text: operator, length: word.length + 1 };
  }
  const unicodeOperator = UNICODE_OPERATORS.get(character);
  if (unicodeOperator) return { text: unicodeOperator, length: character.length };
  const symbol = SYMBOL_OPERATORS.find((candidate) => source.startsWith(candidate, index));
  if (symbol) return { text: SYMBOL_ALIASES.get(symbol) ?? symbol, length: symbol.length };
  return character === "\\" ? { text: "\\", length: 1 } : undefined;
};

const TAB_SIZE = 8;

const getWidthAfter = (width: number, character: string | undefined) =>
  character === "\t" ? width + TAB_SIZE - (width % TAB_SIZE) : width + 1;

export const tokenize = (source: string): Token[] => {
  const headerMatch = MODULE_HEADER.exec(source);
  if (!headerMatch)
    throw new TlaSyntaxError("Expected a module header such as ---- MODULE Name ----");
  const tokens: Token[] = [];
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
    new TlaSyntaxError(`${message} at line ${cursor.line}, column ${getColumn()}`);

  while (cursor.index < source.length) {
    const character = source[cursor.index];
    const rest = source.slice(cursor.index, cursor.index + 8);

    if (character === "\n" || character === " " || character === "\t" || character === "\r") {
      advanceOver(1);
      continue;
    }
    if (rest.startsWith("\\*")) {
      const lineEnd = source.indexOf("\n", cursor.index);
      advanceOver((lineEnd === -1 ? source.length : lineEnd) - cursor.index);
      continue;
    }
    if (rest.startsWith("(*")) {
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
    if (rest.startsWith("----")) {
      const length = /^-+/.exec(source.slice(cursor.index))?.[0].length ?? 0;
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
    if (rest.startsWith("====")) {
      const length = /^=+/.exec(source.slice(cursor.index))?.[0].length ?? 0;
      pushToken("ModuleEnd", "====", length);
      cursor.moduleDepth--;
      if (cursor.moduleDepth > 0) continue;
      const nextHeader = MODULE_HEADER.exec(source.slice(cursor.index));
      if (!nextHeader) break;
      advanceOver(nextHeader.index);
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
          const replacement = { n: "\n", t: "\t", r: "\r", f: "\f" }[escaped] ?? escaped;
          characters.push(replacement);
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
      const base = NUMBER_BASES.get(basedNumber[1][0].toLowerCase());
      pushToken("Number", String(parseInt(basedNumber[1].slice(1), base)), basedNumber[0].length);
      continue;
    }
    if (isIdentifierCharacter(character)) {
      const word = /^[A-Za-z0-9_]+/.exec(source.slice(cursor.index))?.[0] ?? "";
      if (/^\d+$/.test(word)) {
        pushToken("Number", word, word.length);
        continue;
      }
      if (word.startsWith("WF_") || word.startsWith("SF_")) {
        pushToken("Keyword", word.slice(0, 3), 3);
        continue;
      }
      pushToken(KEYWORDS.has(word) ? "Keyword" : "Identifier", word, word.length);
      continue;
    }
    const operator = matchOperator(source, cursor.index);
    if (operator) {
      pushToken("Operator", operator.text, operator.length);
      continue;
    }
    if (character === "\\") {
      const word = /^[A-Za-z]+/.exec(source.slice(cursor.index + 1))?.[0] ?? "";
      throw createError(`Unknown operator \\${word}`);
    }
    throw createError(`Unexpected character ${JSON.stringify(character)}`);
  }

  const endColumn = getColumn();
  tokens.push({ kind: "End", text: "", line: cursor.line, column: endColumn, endColumn });
  return tokens;
};
