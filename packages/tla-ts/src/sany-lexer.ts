import { TlaParseError } from "./errors";

// The token kinds of SANY's TLA+ grammar, numbered as in its TLAplusParserConstants.
export const EOF = 0;
export const BEGIN_PRAGMA = 2;
export const _BM1 = 3;
export const NUMBER = 20;
export const _BM2 = 21;
export const _BM0 = 35;
export const SEPARATOR = 36;
export const END_MODULE = 37;
export const ACTION = 38;
export const ASSUME = 39;
export const BOXASSUME = 40;
export const ASSUMPTION = 41;
export const CASE = 42;
export const CHOOSE = 43;
export const CONSTANT = 44;
export const ELSE = 45;
export const EXCEPT = 46;
export const EXISTS = 47;
export const EXTENDS = 48;
export const FORALL = 49;
export const IF = 50;
export const INSTANCE = 51;
export const LET = 52;
export const LETIN = 53;
export const LOCAL = 54;
export const MODULE = 55;
export const NEW = 56;
export const OTHER = 57;
export const PROPOSITION = 58;
export const SF = 59;
export const T_EXISTS = 60;
export const T_FORALL = 61;
export const THEN = 62;
export const BY = 63;
export const ONLY = 64;
export const DEFINE = 65;
export const DF = 66;
export const THEOREM = 67;
export const USE = 68;
export const HIDE = 69;
export const HAVE = 70;
export const OBVIOUS = 71;
export const OMITTED = 72;
export const LAMBDA = 73;
export const TAKE = 74;
export const PROOF = 75;
export const PROVE = 76;
export const BOXPROVE = 77;
export const QED = 78;
export const RECURSIVE = 79;
export const STATE = 80;
export const TEMPORAL = 81;
export const PICK = 82;
export const WITNESS = 83;
export const SUFFICES = 84;
export const VARIABLE = 85;
export const WF = 86;
export const WITH = 87;
export const COMMA = 88;
export const COLON = 89;
export const COLONCOLON = 90;
export const DOT = 91;
export const US = 92;
export const DEF = 93;
export const LBR = 94;
export const RBR = 95;
export const DEFBREAK = 96;
export const LSB = 97;
export const ARSB = 98;
export const RSB = 99;
export const LBC = 100;
export const RBC = 101;
export const LAB = 102;
export const ARAB = 103;
export const RAB = 104;
export const BANG = 105;
export const ARROW = 106;
export const SUBSTITUTE = 107;
export const MAPTO = 108;
export const NUMBER_LITERAL = 109;
export const STRING_LITERAL = 110;
const BAND = 111;
const BOR = 112;
export const PRIME = 113;
export const NEGATIVE = 117;
export const CASESEP = 121;
export const AND = 129;
export const OR = 132;
export const IN = 147;
export const EQUALS = 185;
export const MINUS = 193;
export const IDENTIFIER = 289;
export const PROOF_STEP = 290;
export const PROOF_IMPLICIT_STEP = 291;
export const PROOF_STEP_DOT = 292;
export const BARE_LEVEL = 293;
export const UNNUMBERED_STEP = 294;

export interface SanyToken {
  kind: number;
  image: string;
  beginLine: number;
  beginColumn: number;
  endLine: number;
  endColumn: number;
  next: SanyToken | undefined;
}

export interface SanyLexer {
  getNextToken: () => SanyToken;
}

const enum LexicalState {
  Default,
  Pragma,
  Spec,
  InComment,
  Embedded,
  InEndOfLineComment,
}

const UNICODE_INFIX_OPERATORS = "≈≔≍◯⩴●∩⋅∘≅∪÷≐‥…≡‼≥≫⇔⇒⫤↝≤≪⊣≠∉⊙⊖⊕⊘⊗⇸≺⪯∝⁇⊨⊢∼≃⊓⊔⊏⊑⊐⊒⋆⊂⊆≻⪰⊃⊇×⊎‖≀";

const LITERALS: [number, string[]][] = [
  [ACTION, ["ACTION", "ACTIONS"]],
  [ASSUME, ["ASSUME"]],
  [BOXASSUME, ["[]ASSUME"]],
  [ASSUMPTION, ["ASSUMPTION", "AXIOM"]],
  [CASE, ["CASE"]],
  [CHOOSE, ["CHOOSE"]],
  [CONSTANT, ["CONSTANT", "CONSTANTS"]],
  [ELSE, ["ELSE"]],
  [EXCEPT, ["EXCEPT"]],
  [EXISTS, ["\\E", "\\exists", "∃"]],
  [EXTENDS, ["EXTENDS"]],
  [FORALL, ["\\A", "\\forall", "∀"]],
  [IF, ["IF"]],
  [INSTANCE, ["INSTANCE"]],
  [LET, ["LET"]],
  [LETIN, ["IN"]],
  [LOCAL, ["LOCAL"]],
  [MODULE, ["MODULE"]],
  [NEW, ["NEW"]],
  [OTHER, ["OTHER"]],
  [PROPOSITION, ["PROPOSITION", "LEMMA", "COROLLARY"]],
  [SF, ["SF_"]],
  [T_EXISTS, ["\\EE"]],
  [T_FORALL, ["\\AA"]],
  [THEN, ["THEN"]],
  [BY, ["BY"]],
  [ONLY, ["ONLY"]],
  [DEFINE, ["DEFINE"]],
  [DF, ["DEF", "DEFS"]],
  [THEOREM, ["THEOREM"]],
  [USE, ["USE"]],
  [HIDE, ["HIDE"]],
  [HAVE, ["HAVE"]],
  [OBVIOUS, ["OBVIOUS"]],
  [OMITTED, ["OMITTED"]],
  [LAMBDA, ["LAMBDA"]],
  [TAKE, ["TAKE"]],
  [PROOF, ["PROOF"]],
  [PROVE, ["PROVE"]],
  [BOXPROVE, ["[]PROVE"]],
  [QED, ["QED"]],
  [RECURSIVE, ["RECURSIVE"]],
  [STATE, ["STATE"]],
  [TEMPORAL, ["TEMPORAL", "TEMPORALS"]],
  [PICK, ["PICK"]],
  [WITNESS, ["WITNESS"]],
  [SUFFICES, ["SUFFICES"]],
  [VARIABLE, ["VARIABLE", "VARIABLES"]],
  [WF, ["WF_"]],
  [WITH, ["WITH"]],
  [COMMA, [","]],
  [COLON, [":"]],
  [COLONCOLON, ["::", "∷"]],
  [DOT, ["."]],
  [US, ["_"]],
  [DEF, ["==", "≜"]],
  [LBR, ["("]],
  [RBR, [")"]],
  [DEFBREAK, ["-|-"]],
  [LSB, ["["]],
  [ARSB, ["]_"]],
  [RSB, ["]"]],
  [LBC, ["{"]],
  [RBC, ["}"]],
  [LAB, ["<<", "⟨"]],
  [ARAB, [">>_", "⟩_"]],
  [RAB, [">>", "⟩"]],
  [BANG, ["!"]],
  [ARROW, ["->", "→"]],
  [SUBSTITUTE, ["<-", "←"]],
  [MAPTO, ["|->", "↦"]],
  [PRIME, ["'"]],
  [114, ["^+", "⁺"]],
  [115, ["^*"]],
  [116, ["^#"]],
  [NEGATIVE, ["-."]],
  [118, ["\\lnot", "¬"]],
  [119, ["\\neg"]],
  [120, ["~"]],
  [CASESEP, ["[]", "□"]],
  [122, ["<>", "◇"]],
  [123, ["ENABLED"]],
  [124, ["UNCHANGED"]],
  [125, ["SUBSET"]],
  [126, ["UNION"]],
  [127, ["DOMAIN"]],
  ...[
    "//",
    "/\\",
    "/=",
    "/",
    "\\/",
    "\\approx",
    "\\asymp",
    "\\bigcirc",
    "\\bullet",
    "\\cap",
    "\\cdot",
    "\\circ",
    "\\cong",
    "\\cup",
    "\\div",
    "\\doteq",
    "\\equiv",
    "\\geq",
    "\\gg",
    "\\in",
    "\\intersect",
    "\\union",
    "\\land",
    "\\leq",
    "\\ll",
    "\\lor",
    "\\o",
    "\\odot",
    "\\ominus",
    "\\oplus",
    "\\oslash",
    "\\otimes",
    "\\prec",
    "\\preceq",
    "\\propto",
    "\\sim",
    "\\simeq",
    "\\sqcap",
    "\\sqcup",
    "\\sqsubset",
    "\\sqsupset",
    "\\sqsubseteq",
    "\\sqsupseteq",
    "\\star",
    "\\subset",
    "\\subseteq",
    "\\succ",
    "\\succeq",
    "\\supset",
    "\\supseteq",
    "\\uplus",
    "\\wr",
    "\\",
    "~>",
    "=>",
    "=<",
    "=|",
    "=",
    "##",
    "#",
    "^^",
    "^",
    "--",
    "-|",
    "-+->",
    "-",
    "**",
    "*",
    "++",
    "+",
    "<=>",
    "<:",
    "<=",
    "<",
    ">=",
    ">",
    "...",
    "..",
    "||",
    "|",
    "|-",
    "|=",
    "&&",
    "&",
    "$$",
    "$",
    "??",
    "%%",
    "%",
    "@@",
    "!!",
    ":>",
    ":=",
    "::=",
    "(+)",
    "(-)",
    "(.)",
    "(/)",
    "(\\X)",
    "\\notin",
    ...UNICODE_INFIX_OPERATORS,
    "\\times",
    "\\X",
  ].map((operator, index): [number, string[]] => [128 + index, [operator]]),
  [AND, ["∧"]],
  [OR, ["∨"]],
  [IN, ["∈"]],
];

const getLiteralsByFirstCharacter = () => {
  const literals = new Map<string, [number, string][]>();
  for (const entry of LITERALS) {
    for (const image of entry[1])
      literals.set(image[0], [...(literals.get(image[0]) ?? []), [entry[0], image]]);
  }
  return literals;
};

const LITERALS_BY_FIRST_CHARACTER = getLiteralsByFirstCharacter();

const BEGIN_MODULE = /-{4,} *MODULE/y;

const BAND_PATTERNS = [
  /[0-9][A-Za-z0-9]*\.\/\\/y,
  /[WS][a-zA-EG-Z0-9][A-Za-z0-9]*\.\/\\/y,
  /[a-zA-RT-VX-Z][A-Za-z0-9]*\.\/\\/y,
];

const BOR_PATTERNS = [
  /[0-9][A-Za-z0-9]*\.\\\//y,
  /[WS][a-zA-EG-Z0-9][A-Za-z0-9]*\.\\\//y,
  /[a-zA-RT-VX-Z][A-Za-z0-9]*\.\\\//y,
];

const IDENTIFIER_PATTERNS = [
  /_[A-Za-z0-9_]*[A-Za-z][A-Za-z0-9_]*/y,
  /[0-9][A-Za-z0-9_]*[A-Za-z][A-Za-z0-9_]*/y,
  /[WS](?:[a-zA-EG-Z_0-9][A-Za-z0-9_]*)?/y,
  /[WS]F(?:[A-Za-z0-9][A-Za-z0-9_]*)?/y,
  /[a-zA-RT-VX-Z][A-Za-z0-9_]*/y,
  /[@ℕℤℝ]/y,
];

const SPEC_PATTERNS: [number, RegExp[]][] = [
  [_BM0, [BEGIN_MODULE]],
  [SEPARATOR, [/-{4,}/y]],
  [END_MODULE, [/={4,}/y]],
  [NUMBER_LITERAL, [/[0-9]+|\\[oO][0-7]+|\\[bB][01]+|\\[hH][0-9a-fA-F]+/y]],
  [STRING_LITERAL, [/"(?:[^"\n\r\\]|\\[ntrf\\"])*"/y]],
  [BAND, BAND_PATTERNS],
  [BOR, BOR_PATTERNS],
  [IDENTIFIER, IDENTIFIER_PATTERNS],
  [PROOF_STEP, [/<[0-9]+>[A-Za-z0-9_]+/y]],
  [PROOF_IMPLICIT_STEP, [/<[+*]>[A-Za-z0-9]+/y]],
  [PROOF_STEP_DOT, [/<(?:[0-9]+|\+|\*)>[A-Za-z0-9_]+\.+/y]],
  [BARE_LEVEL, [/<(?:[0-9]+|\+|\*)>/y]],
  [UNNUMBERED_STEP, [/<(?:[0-9]+|\+|\*)>(?:\*\.*|-\.*|\.+)/y]],
];

const PRAGMA_PATTERNS: [number, RegExp[]][] = [
  [NUMBER, [/[0-9]+/y]],
  [_BM2, [BEGIN_MODULE]],
  [BAND, BAND_PATTERNS],
  [BOR, BOR_PATTERNS],
  [IDENTIFIER, IDENTIFIER_PATTERNS],
];

const getPatternLength = (patterns: RegExp[], source: string, index: number) =>
  Math.max(
    0,
    ...patterns.map((pattern) => {
      pattern.lastIndex = index;
      return pattern.exec(source)?.[0].length ?? 0;
    }),
  );

// The longest token at index, the lowest kind winning a tie, as JavaCC's token manager picks it.
const matchToken = (
  source: string,
  index: number,
  patterns: [number, RegExp[]][],
  isSpec: boolean,
) => {
  const candidates: [number, number][] = patterns.map(([kind, kindPatterns]) => [
    kind,
    getPatternLength(kindPatterns, source, index),
  ]);
  if (isSpec) {
    for (const [kind, image] of LITERALS_BY_FIRST_CHARACTER.get(source[index]) ?? []) {
      if (source.startsWith(image, index)) candidates.push([kind, image.length]);
    }
  }
  return candidates.reduce<[number, number]>(
    (best, candidate) =>
      candidate[1] > best[1] ||
      (candidate[1] === best[1] && candidate[1] > 0 && candidate[0] < best[0])
        ? candidate
        : best,
    [EOF, 0],
  );
};

// The length of input at index that some token could still begin with, when no token matches it.
const getViablePrefixLength = (source: string, index: number) => {
  if (source[index] === "?") return 1;
  if (source[index] !== '"') return 0;
  const stringPrefix = /"(?:[^"\n\r\\]|\\[ntrf\\"])*\\?/y;
  stringPrefix.lastIndex = index;
  return stringPrefix.exec(source)?.[0].length ?? 0;
};

const ESCAPES = new Map([
  ["\b", "\\b"],
  ["\t", "\\t"],
  ["\n", "\\n"],
  ["\f", "\\f"],
  ["\r", "\\r"],
  ['"', '\\"'],
  ["'", "\\'"],
  ["\\", "\\\\"],
  ["\0", ""],
]);

// Escapes text as JavaCC's error messages print it.
export const escapeImage = (text: string) =>
  text
    .split("")
    .map((unit) => {
      const code = unit.charCodeAt(0);
      return (
        ESCAPES.get(unit) ??
        (code < 0x20 || code > 0x7e ? `\\u${code.toString(16).padStart(4, "0")}` : unit)
      );
    })
    .join("");

// Reads SANY tokens one at a time, so a lexical error surfaces only when the parser reaches it.
export const createSanyLexer = (source: string): SanyLexer => {
  const lines: number[] = [];
  const columns: number[] = [];
  const position = { line: 1, column: 0, isAfterCarriageReturn: false, isAfterLineFeed: false };
  for (const character of source.split("")) {
    position.column++;
    if (position.isAfterLineFeed) {
      position.isAfterLineFeed = false;
      position.line++;
      position.column = 1;
    } else if (position.isAfterCarriageReturn) {
      position.isAfterCarriageReturn = false;
      if (character === "\n") position.isAfterLineFeed = true;
      else {
        position.line++;
        position.column = 1;
      }
    }
    if (character === "\r") position.isAfterCarriageReturn = true;
    if (character === "\n") position.isAfterLineFeed = true;
    if (character === "\t")
      position.column = position.column - 1 + (8 - ((position.column - 1) % 8));
    lines.push(position.line);
    columns.push(position.column);
  }
  const cursor = { state: LexicalState.Default, index: 0, commentDepth: 0 };
  const createToken = (kind: number, begin: number, end: number): SanyToken => ({
    kind,
    image: source.slice(begin, end),
    beginLine: lines[begin],
    beginColumn: columns[begin],
    endLine: lines[end - 1],
    endColumn: columns[end - 1],
    next: undefined,
  });
  const throwLexicalError = (begin: number, after: string, killer: number | undefined) => {
    if (killer !== undefined && killer + 1 < source.length) {
      throw new TlaParseError(
        `Lexical error at line ${lines[killer]}, column ${columns[killer]}.  Encountered: "${escapeImage(source[killer])}" (${source.charCodeAt(killer)}), after : "${escapeImage(after)}"`,
      );
    }
    const last = source.length - 1;
    const isLineEnd = source[last] === "\n" || source[last] === "\r";
    const message = `Lexical error at line ${isLineEnd ? lines[last] + 1 : lines[last]}, column ${isLineEnd ? 0 : columns[last] + 1}.  Encountered: <EOF> after : "${escapeImage(after)}"`;
    throw new TlaParseError(
      lines[begin] === lines[last]
        ? message
        : `Lexical {error: EOF reached, possibly open comment starting around line ${lines[begin]}`,
    );
  };
  const readComment = (begin: number): SanyToken | undefined => {
    for (;;) {
      if (cursor.index >= source.length) return throwLexicalError(begin, "", undefined);
      const opening = source.startsWith("(*.", cursor.index)
        ? 3
        : source.startsWith("(*", cursor.index)
          ? 2
          : 0;
      if (cursor.state === LexicalState.InEndOfLineComment) {
        const lineEnd = source.startsWith("\r\n", cursor.index)
          ? 2
          : source[cursor.index] === "\n" || source[cursor.index] === "\r"
            ? 1
            : 0;
        if (lineEnd > 0) {
          cursor.index += lineEnd;
          cursor.state = LexicalState.Spec;
          return undefined;
        }
      } else if (opening > 0) {
        cursor.index += opening;
        cursor.commentDepth++;
        cursor.state = LexicalState.Embedded;
        return undefined;
      } else if (source.startsWith("*)", cursor.index)) {
        cursor.index += 2;
        if (cursor.state === LexicalState.InComment) cursor.state = LexicalState.Spec;
        else {
          cursor.commentDepth--;
          if (cursor.commentDepth === 0) cursor.state = LexicalState.InComment;
        }
        return undefined;
      }
      cursor.index++;
    }
  };
  const getNextToken = (): SanyToken => {
    for (;;) {
      if (cursor.index >= source.length) {
        const last = source.length - 1;
        return {
          kind: EOF,
          image: "",
          beginLine: lines[last] ?? 0,
          beginColumn: columns[last] ?? 0,
          endLine: lines[last] ?? 0,
          endColumn: columns[last] ?? 0,
          next: undefined,
        };
      }
      const begin = cursor.index;
      if (cursor.state === LexicalState.Default) {
        const pragma = source.startsWith("--->", cursor.index) ? 4 : 0;
        BEGIN_MODULE.lastIndex = cursor.index;
        const module = BEGIN_MODULE.exec(source)?.[0].length ?? 0;
        if (module > 0 && module >= pragma) {
          cursor.index += module;
          cursor.state = LexicalState.Spec;
          return createToken(_BM1, begin, cursor.index);
        }
        if (pragma > 0) {
          cursor.index += pragma;
          cursor.state = LexicalState.Pragma;
          return createToken(BEGIN_PRAGMA, begin, cursor.index);
        }
        cursor.index++;
        continue;
      }
      if (cursor.state === LexicalState.Pragma) {
        const [kind, length] = matchToken(source, cursor.index, PRAGMA_PATTERNS, false);
        if (length === 0) {
          cursor.index++;
          continue;
        }
        cursor.index += length;
        if (kind === _BM2) cursor.state = LexicalState.Spec;
        return createToken(kind, begin, cursor.index);
      }
      if (cursor.state !== LexicalState.Spec) {
        readComment(begin);
        continue;
      }
      if (" \t\n\r".includes(source[cursor.index])) {
        cursor.index++;
        continue;
      }
      if (source.startsWith("(*", cursor.index) || source.startsWith("\\*", cursor.index)) {
        cursor.state =
          source[cursor.index] === "(" ? LexicalState.InComment : LexicalState.InEndOfLineComment;
        cursor.index += source.startsWith("(*.", cursor.index) ? 3 : 2;
        readComment(begin);
        continue;
      }
      const [kind, length] = matchToken(source, cursor.index, SPEC_PATTERNS, true);
      if (length === 0) {
        const viable = getViablePrefixLength(source, cursor.index);
        const killer = cursor.index + viable;
        if (killer < source.length) {
          return throwLexicalError(
            begin,
            killer + 1 < source.length || viable === 0
              ? source.slice(begin, killer)
              : source.slice(begin, killer + 1),
            killer,
          );
        }
        return throwLexicalError(begin, viable <= 1 ? "" : source.slice(begin), undefined);
      }
      cursor.index += length;
      return createToken(kind, begin, cursor.index);
    }
  };
  return { getNextToken };
};
