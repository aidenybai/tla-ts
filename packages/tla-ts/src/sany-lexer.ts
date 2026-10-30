import { TlaError } from "./errors";

// An emulation of the token manager that JavaCC generates for SANY's grammar, javacc/tla+.jj: the
// tokens it produces, their kinds in TLAplusParserConstants order, and their positions.

export interface SanyToken {
  kind: number;
  image: string;
  beginLine: number;
  beginColumn: number;
  next: SanyToken | undefined;
}

// The token kinds, in the order of TLAplusParserConstants, each with the literal images that
// produce it. JavaCC breaks a tie between matches of the same length by this order.
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

// The kind named name. The anonymous infix operators share the name "infix", which no caller
// looks up.
export const getKind = (name: string) => {
  const kind = KIND_NAMES.indexOf(name);
  if (kind === -1) throw new TlaError(`Unknown SANY token kind ${name}`);
  return kind;
};

const LITERALS = new Map(
  KINDS.flatMap((entry, kind) => entry.slice(1).map((image): [string, number] => [image, kind])),
);
const LONGEST_LITERAL = Math.max(...[...LITERALS.keys()].map((image) => image.length));

const BEGIN_MODULE = /----+ *MODULE/y;
const IDENTIFIER_PATTERNS = [
  /_\w*[A-Za-z]\w*/y,
  /[0-9]\w*[A-Za-z]\w*/y,
  /[WS](?:[a-zA-EG-Z_0-9]\w*)?/y,
  /[WS]F(?:[A-Za-z0-9]\w*)?/y,
  /[a-zA-RT-VX-Z]\w*/y,
  /@|ℕ|ℤ|ℝ/y,
];
const junctionPatterns = (junction: string) =>
  [/[0-9][A-Za-z0-9]*/, /[WS][a-zA-EG-Z0-9][A-Za-z0-9]*/, /[a-zA-RT-VX-Z][A-Za-z0-9]*/].map(
    (prefix) => new RegExp(`${prefix.source}${junction}`, "y"),
  );
const STEP = String.raw`<(?:[0-9]+|\+|\*)>`;

// The tokens of the SPEC lexical state that are not literals, with their kinds.
const SPEC_PATTERNS: [string, RegExp[]][] = [
  ["_BM0", [BEGIN_MODULE]],
  ["SEPARATOR", [/----+/y]],
  ["END_MODULE", [/====+/y]],
  ["NUMBER_LITERAL", [/[0-9]+|\\[oO][0-7]+|\\[bB][01]+|\\[hH][0-9a-fA-F]+/y]],
  ["STRING_LITERAL", [/"(?:[^"\n\r\\]|\\[ntrf\\"])*"/y]],
  ["BAND", junctionPatterns(String.raw`\.\/\\`)],
  ["BOR", junctionPatterns(String.raw`\.\\\/`)],
  ["IDENTIFIER", IDENTIFIER_PATTERNS],
  ["ProofStepLexeme", [/<[0-9]+>\w+/y]],
  ["ProofImplicitStepLexeme", [/<[+*]>[A-Za-z0-9]+/y]],
  ["ProofStepDotLexeme", [new RegExp(String.raw`${STEP}\w+\.+`, "y")]],
  ["BareLevelLexeme", [new RegExp(STEP, "y")]],
  ["UnnumberedStepLexeme", [new RegExp(String.raw`${STEP}(?:\*\.*|-\.*|\.+)`, "y")]],
];

// The tokens of the DEFAULT and PRAGMA lexical states, which skip every other character.
const DEFAULT_PATTERNS: [string, RegExp[]][] = [
  ["BEGIN_PRAGMA", [/--->/y]],
  ["_BM1", [BEGIN_MODULE]],
];
const PRAGMA_PATTERNS: [string, RegExp[]][] = [
  ["NUMBER", [/[0-9]+/y]],
  ["_BM2", [BEGIN_MODULE]],
  ["BAND", junctionPatterns(String.raw`\.\/\\`)],
  ["BOR", junctionPatterns(String.raw`\.\\\/`)],
  ["IDENTIFIER", IDENTIFIER_PATTERNS],
];

const getMatchLength = (pattern: RegExp, source: string, offset: number) => {
  pattern.lastIndex = offset;
  return pattern.exec(source)?.[0].length ?? 0;
};

// The longest match at offset, the earliest kind among matches of that length.
const matchPatterns = (patterns: [string, RegExp[]][], source: string, offset: number) =>
  patterns
    .map(([name, regexes]) => ({
      kind: getKind(name),
      length: Math.max(...regexes.map((regex) => getMatchLength(regex, source, offset))),
    }))
    .reduce(
      (best, match) =>
        match.length > best.length || (match.length === best.length && match.kind < best.kind)
          ? match
          : best,
      { kind: -1, length: 0 },
    );

const matchSpecToken = (source: string, offset: number) => {
  const literalLength = [...Array(LONGEST_LITERAL).keys()]
    .map((index) => LONGEST_LITERAL - index)
    .find((length) => LITERALS.has(source.slice(offset, offset + length)));
  const pattern = matchPatterns(SPEC_PATTERNS, source, offset);
  if (literalLength === undefined) return pattern;
  const literal = {
    kind: LITERALS.get(source.slice(offset, offset + literalLength)) ?? -1,
    length: literalLength,
  };
  return literal.length > pattern.length ||
    (literal.length === pattern.length && literal.kind < pattern.kind)
    ? literal
    : pattern;
};

// SimpleCharStream.UpdateLineColumn: the line and column of each character, with tabs stopping
// at multiples of 8.
const getPositions = (source: string) => {
  const lines: number[] = [];
  const columns: number[] = [];
  const state = { line: 1, column: 0, isAfterCr: false, isAfterLf: false };
  for (const character of source) {
    for (let unit = 0; unit < character.length; unit++) {
      state.column++;
      if (state.isAfterLf) {
        state.isAfterLf = false;
        state.line++;
        state.column = 1;
      } else if (state.isAfterCr) {
        state.isAfterCr = false;
        if (character === "\n") state.isAfterLf = true;
        else {
          state.line++;
          state.column = 1;
        }
      }
      if (character === "\r") state.isAfterCr = true;
      else if (character === "\n") state.isAfterLf = true;
      else if (character === "\t") state.column = state.column - 1 + (8 - ((state.column - 1) % 8));
      lines.push(state.line);
      columns.push(state.column);
    }
  }
  return { lines, columns };
};

// A lazy token stream over source, which returns undefined where JavaCC's token manager throws a
// TokenMgrError: at a character no token starts with, or at the end of the file in a comment.
export const createSanyLexer = (source: string) => {
  const positions = getPositions(source);
  const state = { offset: 0, mode: "DEFAULT" };
  const createToken = (kind: number, start: number, length: number): SanyToken => ({
    kind,
    image: source.slice(start, start + length),
    beginLine: positions.lines[start] ?? 0,
    beginColumn: positions.columns[start] ?? 0,
    next: undefined,
  });
  // JavaCC places the end of the file at the file's last character.
  const getEndOfFile = () => createToken(getKind("EOF"), source.length - 1, 0);
  const skipComment = () => {
    if (source.startsWith("\\*", state.offset)) {
      const end = source.slice(state.offset).search(/[\n\r]/);
      if (end === -1) return false;
      state.offset += end + 1;
      return true;
    }
    const depth = { value: 0 };
    let offset = state.offset;
    while (offset < source.length) {
      if (source.startsWith("(*", offset)) {
        depth.value++;
        offset += 2;
      } else if (source.startsWith("*)", offset)) {
        depth.value--;
        offset += 2;
        if (depth.value === 0) {
          state.offset = offset;
          return true;
        }
      } else offset++;
    }
    return false;
  };
  const getSkippingToken = (patterns: [string, RegExp[]][]): SanyToken => {
    while (state.offset < source.length) {
      const match = matchPatterns(patterns, source, state.offset);
      if (match.length > 0) {
        const token = createToken(match.kind, state.offset, match.length);
        state.offset += match.length;
        if (KIND_NAMES[match.kind].startsWith("_BM")) state.mode = "SPEC";
        if (KIND_NAMES[match.kind] === "BEGIN_PRAGMA") state.mode = "PRAGMA";
        return token;
      }
      state.offset++;
    }
    return getEndOfFile();
  };
  const getNextToken = (): SanyToken | undefined => {
    if (state.mode === "DEFAULT") return getSkippingToken(DEFAULT_PATTERNS);
    if (state.mode === "PRAGMA") return getSkippingToken(PRAGMA_PATTERNS);
    while (state.offset < source.length) {
      if (" \t\n\r".includes(source[state.offset])) state.offset++;
      else if (source.startsWith("(*", state.offset) || source.startsWith("\\*", state.offset)) {
        if (!skipComment()) return undefined;
      } else {
        const match = matchSpecToken(source, state.offset);
        if (match.length === 0) return undefined;
        const token = createToken(match.kind, state.offset, match.length);
        state.offset += match.length;
        return token;
      }
    }
    return getEndOfFile();
  };
  return getNextToken;
};

// JavaCC's TokenMgrError.addEscapes, which escapes the characters of a lexical error's message.
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

const escapeLexeme = (text: string) =>
  text.replace(
    // eslint-disable-next-line no-control-regex
    /[\0-\x1f"'\\\x7f-\uffff]/g,
    (character) =>
      LEXEME_ESCAPES.get(character) ??
      (character === "\0" ? "" : `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`),
  );

// TokenMgrError.LexicalError: the character the lexer stopped at, or the end of the file, and the
// characters of the token it had read.
export const formatLexicalError = (
  line: number,
  column: number,
  character: string | undefined,
  after: string,
) =>
  `Lexical error at line ${line}, column ${column}.  Encountered: ${character === undefined ? "<EOF> " : `"${escapeLexeme(character)}" (${character.charCodeAt(0)}), `}after : "${escapeLexeme(after)}"`;

// TLC 1.7.4's lexer, which JavaCC generated without UNICODE_INPUT, reads a character past U+00FF
// outside a comment by its low byte, and stops at one whose low byte is below 0x80.
export const getSany174LexicalError = (source: string) => {
  const readToken = createSanyLexer(source);
  for (let token = readToken(); token && token.kind !== getKind("EOF"); token = readToken()) {
    const index = token.image.split("").findIndex((character) => {
      const code = character.charCodeAt(0);
      return code > 0xff && (code & 0xff) < 0x80;
    });
    if (index === -1) continue;
    const column = token.image
      .slice(1, index + 1)
      .split("")
      .reduce(
        (previous, character) =>
          character === "\t" ? previous + 8 - (previous % 8) : previous + 1,
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
