import { TlaError } from "../errors";

// An emulation of the token manager that JavaCC generates for SANY's grammar, javacc/tla+.jj.

export interface SanyToken {
  kind: number;
  image: string;
  beginLine: number;
  beginColumn: number;
  next: SanyToken | undefined;
}

const KINDS: [string, ...string[]][] = [
  ["EOF"],
  ["BEGIN_PRAGMA", "--->"],
  ["_BM1"],
  ["NUMBER"],
  ["_BM2"],
  ["_BM0"],
  ["SEPARATOR"],
  ["END_MODULE"],
  ["ACTION", "ACTION", "ACTIONS"],
  ["ASSUME", "ASSUME"],
  ["BOXASSUME", "[]ASSUME"],
  ["ASSUMPTION", "ASSUMPTION", "AXIOM"],
  ["CASE", "CASE"],
  ["CHOOSE", "CHOOSE"],
  ["CONSTANT", "CONSTANT", "CONSTANTS"],
  ["ELSE", "ELSE"],
  ["EXCEPT", "EXCEPT"],
  ["EXISTS", "\\E", "\\exists", "∃"],
  ["EXTENDS", "EXTENDS"],
  ["FORALL", "\\A", "\\forall", "∀"],
  ["IF", "IF"],
  ["INSTANCE", "INSTANCE"],
  ["LET", "LET"],
  ["LETIN", "IN"],
  ["LOCAL", "LOCAL"],
  ["MODULE", "MODULE"],
  ["NEW", "NEW"],
  ["OTHER", "OTHER"],
  ["PROPOSITION", "PROPOSITION", "LEMMA", "COROLLARY"],
  ["SF", "SF_"],
  ["T_EXISTS", "\\EE"],
  ["T_FORALL", "\\AA"],
  ["THEN", "THEN"],
  ["BY", "BY"],
  ["ONLY", "ONLY"],
  ["DEFINE", "DEFINE"],
  ["DF", "DEF", "DEFS"],
  ["THEOREM", "THEOREM"],
  ["USE", "USE"],
  ["HIDE", "HIDE"],
  ["HAVE", "HAVE"],
  ["OBVIOUS", "OBVIOUS"],
  ["OMITTED", "OMITTED"],
  ["LAMBDA", "LAMBDA"],
  ["TAKE", "TAKE"],
  ["PROOF", "PROOF"],
  ["PROVE", "PROVE"],
  ["BOXPROVE", "[]PROVE"],
  ["QED", "QED"],
  ["RECURSIVE", "RECURSIVE"],
  ["STATE", "STATE"],
  ["TEMPORAL", "TEMPORAL", "TEMPORALS"],
  ["PICK", "PICK"],
  ["WITNESS", "WITNESS"],
  ["SUFFICES", "SUFFICES"],
  ["VARIABLE", "VARIABLE", "VARIABLES"],
  ["WF", "WF_"],
  ["WITH", "WITH"],
  ["COMMA", ","],
  ["COLON", ":"],
  ["COLONCOLON", "::", "∷"],
  ["DOT", "."],
  ["US", "_"],
  ["DEF", "==", "≜"],
  ["LBR", "("],
  ["RBR", ")"],
  ["DEFBREAK", "-|-"],
  ["LSB", "["],
  ["ARSB", "]_"],
  ["RSB", "]"],
  ["LBC", "{"],
  ["RBC", "}"],
  ["LAB", "<<", "⟨"],
  ["ARAB", ">>_", "⟩_"],
  ["RAB", ">>", "⟩"],
  ["BANG", "!"],
  ["ARROW", "->", "→"],
  ["SUBSTITUTE", "<-", "←"],
  ["MAPTO", "|->", "↦"],
  ["NUMBER_LITERAL"],
  ["STRING_LITERAL"],
  ["BAND"],
  ["BOR"],
  ["op_57", "'"],
  ["op_68", "^+", "⁺"],
  ["op_69", "^*"],
  ["op_70", "^#"],
  ["op_76", "-."],
  ["op_26", "\\lnot", "¬"],
  ["op_29", "\\neg"],
  ["op_58", "~"],
  ["CASESEP", "[]", "□"],
  ["op_61", "<>", "◇"],
  ["op_112", "ENABLED"],
  ["op_113", "UNCHANGED"],
  ["op_114", "SUBSET"],
  ["op_115", "UNION"],
  ["op_116", "DOMAIN"],
  ["op_1", "//"],
  ["AND", "/\\", "∧"],
  ["op_3", "/="],
  ["op_4", "/"],
  ["OR", "\\/", "∨"],
  ...[
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
  ].map((image): [string, string] => ["infix", image]),
  ["IN", "\\in", "∈"],
  ...[
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
  ].map((image): [string, string] => ["infix", image]),
  ["EQUALS", "="],
  ...["##", "#", "^^", "^", "--", "-|", "-+->"].map((image): [string, string] => ["infix", image]),
  ["op_77", "-"],
  ...[
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
    ..."≈≔≍◯⩴●∩⋅∘≅∪÷≐‥…≡‼≥≫⇔⇒⫤↝≤≪⊣≠∉⊙⊖⊕⊘⊗⇸≺⪯∝⁇⊨⊢∼≃⊓⊔⊏⊑⊐⊒⋆⊂⊆≻⪰⊃⊇×⊎‖≀",
    "\\times",
  ].map((image): [string, string] => ["infix", image]),
  ["op_119", "\\X"],
  ["IDENTIFIER"],
  ["ProofStepLexeme"],
  ["ProofImplicitStepLexeme"],
  ["ProofStepDotLexeme"],
  ["BareLevelLexeme"],
  ["UnnumberedStepLexeme"],
];

const KIND_NAMES = KINDS.map((entry) => entry[0]);
const KIND_INDEXES = new Map(
  KIND_NAMES.map((name, kind): [string, number] => [name, kind]).reverse(),
);

export const getKind = (name: string) => {
  const kind = KIND_INDEXES.get(name);
  if (kind === undefined) throw new TlaError(`Unknown SANY token kind ${name}`);
  return kind;
};

const LITERALS = new Map(
  KINDS.flatMap((entry, kind) => entry.slice(1).map((image): [string, number] => [image, kind])),
);
const LONGEST_LITERAL = Math.max(...[...LITERALS.keys()].map((image) => image.length));
const LITERAL_LENGTHS = Array.from(
  { length: LONGEST_LITERAL },
  (_value, index) => LONGEST_LITERAL - index,
);

const BEGIN_MODULE = /----+ *MODULE/y;
const IDENTIFIER_PATTERNS = [
  /_\w*[A-Za-z]\w*/y,
  /[0-9]\w*[A-Za-z]\w*/y,
  /[WS](?:[a-zA-EG-Z_0-9]\w*)?/y,
  /[WS]F(?:[A-Za-z0-9]\w*)?/y,
  /[a-zA-RT-VX-Z]\w*/y,
  /@|ℕ|ℤ|ℝ/y,
];
const getJunctionPatterns = (junction: string) =>
  [/[0-9][A-Za-z0-9]*/, /[WS][a-zA-EG-Z0-9][A-Za-z0-9]*/, /[a-zA-RT-VX-Z][A-Za-z0-9]*/].map(
    (prefix) => new RegExp(`${prefix.source}${junction}`, "y"),
  );
const BAND_PATTERNS = getJunctionPatterns(String.raw`\.\/\\`);
const BOR_PATTERNS = getJunctionPatterns(String.raw`\.\\\/`);
const STEP = String.raw`<(?:[0-9]+|\+|\*)>`;

const SPEC_PATTERNS: [string, RegExp[]][] = [
  ["_BM0", [BEGIN_MODULE]],
  ["SEPARATOR", [/----+/y]],
  ["END_MODULE", [/====+/y]],
  ["NUMBER_LITERAL", [/[0-9]+|\\[oO][0-7]+|\\[bB][01]+|\\[hH][0-9a-fA-F]+/y]],
  ["STRING_LITERAL", [/"(?:[^"\n\r\\]|\\[ntrf\\"])*"/y]],
  ["BAND", BAND_PATTERNS],
  ["BOR", BOR_PATTERNS],
  ["IDENTIFIER", IDENTIFIER_PATTERNS],
  ["ProofStepLexeme", [/<[0-9]+>\w+/y]],
  ["ProofImplicitStepLexeme", [/<[+*]>[A-Za-z0-9]+/y]],
  ["ProofStepDotLexeme", [new RegExp(String.raw`${STEP}\w+\.+`, "y")]],
  ["BareLevelLexeme", [new RegExp(STEP, "y")]],
  ["UnnumberedStepLexeme", [new RegExp(String.raw`${STEP}(?:\*\.*|-\.*|\.+)`, "y")]],
];

const DEFAULT_PATTERNS: [string, RegExp[]][] = [
  ["BEGIN_PRAGMA", [/--->/y]],
  ["_BM1", [BEGIN_MODULE]],
];
const PRAGMA_PATTERNS: [string, RegExp[]][] = [
  ["NUMBER", [/[0-9]+/y]],
  ["_BM2", [BEGIN_MODULE]],
  ["BAND", BAND_PATTERNS],
  ["BOR", BOR_PATTERNS],
  ["IDENTIFIER", IDENTIFIER_PATTERNS],
];

const getMatchLength = (pattern: RegExp, source: string, offset: number) => {
  pattern.lastIndex = offset;
  return pattern.exec(source)?.[0].length ?? 0;
};

interface TokenMatch {
  kind: number;
  length: number;
}

const getLongerMatch = (best: TokenMatch, match: TokenMatch) =>
  match.length > best.length || (match.length === best.length && match.kind < best.kind)
    ? match
    : best;

const matchPatterns = (patterns: [string, RegExp[]][], source: string, offset: number) =>
  patterns
    .map(([name, regexes]) => ({
      kind: getKind(name),
      length: Math.max(...regexes.map((regex) => getMatchLength(regex, source, offset))),
    }))
    .reduce(getLongerMatch, { kind: -1, length: 0 });

const matchSpecToken = (source: string, offset: number) => {
  const literalLength = LITERAL_LENGTHS.find((length) =>
    LITERALS.has(source.slice(offset, offset + length)),
  );
  const pattern = matchPatterns(SPEC_PATTERNS, source, offset);
  return literalLength === undefined
    ? pattern
    : getLongerMatch(pattern, {
        kind: LITERALS.get(source.slice(offset, offset + literalLength)) ?? -1,
        length: literalLength,
      });
};

export const getTabStop = (column: number) => column + 8 - (column % 8);

const getPositions = (source: string) => {
  const lines: number[] = [];
  const columns: number[] = [];
  let line = 1;
  let column = 0;
  let isAfterCr = false;
  let isAfterLf = false;
  for (const character of source) {
    for (let unit = 0; unit < character.length; unit++) {
      column++;
      if (isAfterLf) {
        isAfterLf = false;
        line++;
        column = 1;
      } else if (isAfterCr) {
        isAfterCr = false;
        if (character === "\n") isAfterLf = true;
        else {
          line++;
          column = 1;
        }
      }
      if (character === "\r") isAfterCr = true;
      else if (character === "\n") isAfterLf = true;
      else if (character === "\t") column = getTabStop(column - 1);
      lines.push(line);
      columns.push(column);
    }
  }
  return { lines, columns };
};

const STRING_PREFIX = /"(?:[^"\n\r\\]|\\[ntrf\\"])*\\?/y;
const LITERAL_PREFIXES = new Set(
  [...LITERALS.keys()].flatMap((image) =>
    Array.from({ length: image.length - 1 }, (_value, index) => image.slice(0, index + 1)),
  ),
);

const getTokenPrefix = (source: string, offset: number) => {
  let length = 0;
  while (LITERAL_PREFIXES.has(source.slice(offset, offset + length + 1))) length++;
  return source.slice(
    offset,
    offset + Math.max(length, getMatchLength(STRING_PREFIX, source, offset)),
  );
};

export const createSanyLexer = (source: string) => {
  const positions = getPositions(source);
  let nextOffset = 0;
  let mode = "DEFAULT";
  const createToken = (kind: number, start: number, length: number): SanyToken => ({
    kind,
    image: source.slice(start, start + length),
    beginLine: positions.lines[start] ?? 0,
    beginColumn: positions.columns[start] ?? 0,
    next: undefined,
  });
  // JavaCC places the end of the file at the file's last character.
  const getEndOfFile = () => createToken(getKind("EOF"), source.length - 1, 0);
  const getLexicalError = (start: number, end: number, after: string) => {
    const index = end - 1;
    const line = positions.lines[index];
    const column = positions.columns[index];
    if (end < source.length) return formatLexicalError(line, column, source[index], after);
    if (positions.lines[start] !== line) {
      return `Lexical {error: EOF reached, possibly open comment starting around line ${positions.lines[start]}`;
    }
    return source[index] === "\n" || source[index] === "\r"
      ? formatLexicalError(line + 1, 0, undefined, after)
      : formatLexicalError(line, column + 1, undefined, after);
  };
  const skipComment = () => {
    const start = nextOffset;
    if (source.startsWith("\\*", start)) {
      const end = source.slice(start).search(/[\n\r]/);
      if (end === -1) return getLexicalError(start, source.length, "");
      nextOffset += end + 1;
      return undefined;
    }
    let depth = 0;
    let chainStart = start;
    let offset = start;
    while (offset < source.length) {
      if (source.startsWith("(*", offset)) {
        depth++;
        offset += 2;
        if (depth > 1) chainStart = offset;
      } else if (source.startsWith("*)", offset)) {
        depth--;
        offset += 2;
        chainStart = offset;
        if (depth === 0) {
          nextOffset = offset;
          return undefined;
        }
      } else offset++;
    }
    nextOffset = offset;
    return chainStart === source.length ? undefined : getLexicalError(chainStart, offset, "");
  };
  const getSkippingToken = (patterns: [string, RegExp[]][]): SanyToken => {
    while (nextOffset < source.length) {
      const match = matchPatterns(patterns, source, nextOffset);
      if (match.length > 0) {
        const token = createToken(match.kind, nextOffset, match.length);
        nextOffset += match.length;
        if (KIND_NAMES[match.kind].startsWith("_BM")) mode = "SPEC";
        if (KIND_NAMES[match.kind] === "BEGIN_PRAGMA") mode = "PRAGMA";
        return token;
      }
      nextOffset++;
    }
    return getEndOfFile();
  };
  const getNextToken = (): SanyToken | string => {
    if (mode === "DEFAULT") return getSkippingToken(DEFAULT_PATTERNS);
    if (mode === "PRAGMA") return getSkippingToken(PRAGMA_PATTERNS);
    while (nextOffset < source.length) {
      const offset = nextOffset;
      if (" \t\n\r".includes(source[offset])) nextOffset++;
      else if (source.startsWith("(*", offset) || source.startsWith("\\*", offset)) {
        const error = skipComment();
        if (error !== undefined) return error;
      } else {
        const match = matchSpecToken(source, offset);
        if (match.length === 0) {
          const prefix = getTokenPrefix(source, offset);
          const end = Math.min(offset + prefix.length + 1, source.length);
          const read = source.slice(offset, end);
          const after = end < source.length ? prefix : read.length > 1 ? read : "";
          return getLexicalError(offset, end, after);
        }
        const token = createToken(match.kind, offset, match.length);
        nextOffset += match.length;
        return token;
      }
    }
    return getEndOfFile();
  };
  return getNextToken;
};

const LEXEME_ESCAPES = new Map([
  ["\b", "\\b"],
  ["\t", "\\t"],
  ["\n", "\\n"],
  ["\f", "\\f"],
  ["\r", "\\r"],
  ['"', '\\"'],
  ["'", "\\'"],
  ["\\", "\\\\"],
]);

export const escapeLexeme = (text: string) =>
  text.replace(
    // eslint-disable-next-line no-control-regex
    /[\0-\x1f"'\\\x7f-\uffff]/g,
    (character) =>
      LEXEME_ESCAPES.get(character) ??
      (character === "\0" ? "" : `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`),
  );

export const formatLexicalError = (
  line: number,
  column: number,
  character: string | undefined,
  after: string,
) =>
  `Lexical error at line ${line}, column ${column}.  Encountered: ${character === undefined ? "<EOF> " : `"${escapeLexeme(character)}" (${character.charCodeAt(0)}), `}after : "${escapeLexeme(after)}"`;

export const getSany174LexicalError = (source: string) => {
  const readToken = createSanyLexer(source);
  for (
    let token = readToken();
    typeof token !== "string" && token.kind !== getKind("EOF");
    token = readToken()
  ) {
    const index = token.image.split("").findIndex((character) => {
      const code = character.charCodeAt(0);
      return code > 0xff && (code & 0xff) < 0x80;
    });
    if (index === -1) continue;
    const column = token.image
      .slice(1, index + 1)
      .split("")
      .reduce(
        (previous, character) => (character === "\t" ? getTabStop(previous) : previous + 1),
        token.beginColumn,
      );
    return formatLexicalError(
      token.beginLine,
      column,
      token.image[index],
      token.image.slice(0, index),
    );
  }
  return undefined;
};
