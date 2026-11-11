import { PcalError, PcalBugError } from "../errors";
import { createNormalizedPcalExpr, createPcalToken, PCAL_TOKEN, type PcalToken } from "./ast";

export interface PcalCharReader {
  lines: string[];
  currentLine: string[] | undefined;
  line: number;
  column: number;
  vcolumn: number;
}

export const createPcalCharReader = (
  lines: string[],
  firstLine: number,
  firstColumn: number,
): PcalCharReader => ({
  lines,
  currentLine: firstLine < lines.length ? Array.from(lines[firstLine]) : undefined,
  line: firstLine,
  column: firstColumn,
  vcolumn: firstLine < lines.length ? Array.from(lines[firstLine].slice(0, firstColumn)).length : 0,
});

const getNextPcalChar = (reader: PcalCharReader) => {
  if (reader.currentLine === undefined) return "\t";
  if (reader.currentLine.length === reader.column) {
    reader.line += 1;
    reader.column = 0;
    reader.vcolumn = 0;
    reader.currentLine =
      reader.line >= reader.lines.length ? undefined : Array.from(reader.lines[reader.line]);
    return "\n";
  }
  const char = reader.currentLine[reader.column];
  reader.column += 1;
  reader.vcolumn += 1;
  return char;
};

const backspacePcalReader = (reader: PcalCharReader) => {
  if (reader.column > 0) {
    reader.column -= 1;
    reader.vcolumn -= 1;
    return;
  }
  if (reader.line === 0) {
    throw new PcalBugError("PcalCharReader.backspace trying to move past beginning of reader");
  }
  reader.line -= 1;
  reader.currentLine = Array.from(reader.lines[reader.line]);
  reader.column = Math.max(reader.currentLine.length - 1, 0);
  reader.vcolumn = reader.column;
};

export const peekPcalReader = (reader: PcalCharReader) => {
  for (;;) {
    const next = getNextPcalChar(reader);
    if (next === "\t") return "\t";
    if (next !== " " && next !== "\n") break;
  }
  backspacePcalReader(reader);
  return `${(reader.currentLine ?? []).slice(reader.column).join("")}\n`;
};

const LEFT_PARENS = new Set(["(", "[", "{", "<<", "⟨"]);
const RIGHT_PARENS = new Set([">>_", "⟩_", "]_", ")", "}", "]", ">>", "⟩"]);

const BUILT_IN_SYMBOLS = new Set([
  ...LEFT_PARENS,
  ...RIGHT_PARENS,
  ..."_ ASSUME ASSUMPTION AXIOM BOOLEAN CASE CONSTANT CONSTANTS EXCEPT EXTENDS FALSE IF INSTANCE LOCAL MODULE OTHER STRING THEOREM TRUE VARIABLE VARIABLES WITH WF_ SF_".split(
    " ",
  ),
  ..."\\A ∀ \\forall \\E ∃ \\exists \\AA \\EE ~ ¬ \\lnot \\neg <> ◇ CHOOSE ENABLED UNCHANGED SUBSET UNION DOMAIN ' ^+ ⁺ ^* ^#".split(
    " ",
  ),
  ..."=> ⇒ \\cdot ⋅ <=> ⇔ \\equiv ≡ ~> ↝ -+-> ⇸ \\subseteq ⊆ \\subset ⊂ \\supset ⊃ \\supseteq ⊇ \\ll ≪ \\gg ≫ \\ \\cap \\intersect ∩ \\cup \\union ∪ /\\ ∧ \\/ ∨ \\land \\lor \\X × - + * / ^ | || ‖ & && ++ -- ** // ^^ |- ⊢ |= ⊨ -| ⊣ =| ⫤ <: :> := ≔ ::= ⩴".split(
    " ",
  ),
  ..."(+) ⊕ (-) ⊖ \\oplus \\ominus (.) ⊙ \\odot (/) ⊘ \\oslash (\\X) ⊗ \\otimes \\uplus ⊎ \\sqcap ⊓ \\sqcup ⊔ \\div ÷ \\star ⋆ \\o ∘ \\circ \\bigcirc ◯ \\bullet ●".split(
    " ",
  ),
  ..."\\in ∈ \\notin ∉ = # /= ≠ < > =< <= ≤ >= ≥ \\prec ≺ \\succ ≻ \\preceq ⪯ \\succeq ⪰ \\sim ∼ \\simeq ≃ \\approx ≈ \\doteq ≐ \\asymp ≍ \\sqsubset ⊏ \\sqsupset ⊐ \\sqsubseteq ⊑ \\sqsupseteq ⊒ \\propto ∝".split(
    " ",
  ),
  ...": -> → |-> ↦ <- ← == ≜ ELSE THEN LET IN [] □ .. ‥ ... … $ $$ ? ?? ⁇ % %% ## @@ !! ‼ \\times \\leq \\geq \\mod \\wr ≀ ≅ ! ; , . -. @".split(
    " ",
  ),
]);

const isLetter = (char: string) => /^[A-Za-z_]$/.test(char);
const isDigit = (char: string) => /^[0-9]$/.test(char);
const isSpace = (char: string) => char === " " || char === "\f" || char === "\r";

const BUILT_IN_PREFIXES = new Set(
  [...BUILT_IN_SYMBOLS]
    .filter((symbol) => !isLetter(symbol[0]) && !(symbol[0] === "\\" && isLetter(symbol[1] ?? "")))
    .flatMap((symbol) =>
      Array.from(symbol, (_char, index) => symbol.slice(0, symbol.length - index)),
    ),
);

const STRING_CHARS = new Set(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ~!@#$%^&*()_-+={}[]|:;<,>.?/`'0123456789",
);

const DELIMITERS = new Set(
  "; do then := ≔ begin variable variables || ‖ end else elsif if either or while with call return goto print assert skip procedure define process fair".split(
    " ",
  ),
);

const TOKEN_TYPE = { ...PCAL_TOKEN, dashes: 6, endModule: 7 };

export interface PcalTokenizerState {
  delimiter: string;
  delimiterLine: number;
  delimiterCol: number;
  commentDepth: number;
}

export const createPcalTokenizerState = (): PcalTokenizerState => ({
  delimiter: "",
  delimiterLine: 0,
  delimiterCol: 0,
  commentDepth: 0,
});

const tokenize = (
  state: PcalTokenizerState,
  reader: PcalCharReader,
  isExpr: boolean,
  isInDefineBlock: boolean,
) => {
  const lines: PcalToken[][] = [];
  let line: PcalToken[] = [];
  let token = "";
  let scanState = "start";
  let column = reader.vcolumn;
  let nextColumn = reader.vcolumn;
  let nextChar = getNextPcalChar(reader);
  let parenDepth = 0;
  let isInQuantifier = false;
  let isExprEnd = false;
  let previousToken = " ";
  const skipNextChar = () => {
    nextColumn = reader.vcolumn;
    nextChar = getNextPcalChar(reader);
  };
  const addNextChar = () => {
    token += nextChar;
    skipNextChar();
  };
  const gotoStart = () => {
    scanState = "start";
    column = nextColumn;
  };
  const startNewLine = () => {
    lines.push(line);
    line = [];
    column = 0;
  };
  const throwTokenizingError = (message: string): never => {
    throw new PcalError(
      `${message} \`${token}' found at\n    line ${reader.line + 1}, column ${column + 1}`,
    );
  };
  const endExpression = () => {
    isExprEnd = true;
    state.delimiter = token;
    state.delimiterCol = column;
    state.delimiterLine = reader.line - (nextChar === "\n" ? 1 : 0);
  };
  const emitToken = (type: number) => {
    if (!isExpr) {
      endExpression();
      token = "";
      return;
    }
    if (type > TOKEN_TYPE.ident) throwTokenizingError("Illegal token in an expression");
    const isDelimiter =
      type !== TOKEN_TYPE.string &&
      ((DELIMITERS.has(token) &&
        !(type === TOKEN_TYPE.ident && [".", "[", ","].includes(previousToken))) ||
        (((token === "," && !isInQuantifier && !isInDefineBlock) ||
          token === ")" ||
          token === "}") &&
          parenDepth === 0));
    if (isDelimiter) {
      if (parenDepth !== 0) {
        throwTokenizingError("Expression with an unmatched (, [, {, or << followed by");
      }
      if (isInQuantifier) {
        throwTokenizingError("Expression with \\A or \\E but no following `:` followed by");
      }
      endExpression();
      if (line.length > 0) startNewLine();
      return;
    }
    if (type === TOKEN_TYPE.builtin && LEFT_PARENS.has(token)) parenDepth += 1;
    if (type === TOKEN_TYPE.builtin && RIGHT_PARENS.has(token)) {
      parenDepth -= 1;
      if (parenDepth < 0) throwTokenizingError("Extra (unmatching)");
    }
    previousToken = type === TOKEN_TYPE.string ? " " : token;
    if (["\\A", "∀", "\\E", "∃"].includes(token) && parenDepth === 0) {
      isInQuantifier = true;
    }
    if (isInQuantifier && token === ":" && parenDepth === 0) {
      isInQuantifier = false;
    }
    if (token !== "" || type === TOKEN_TYPE.string) {
      line.push(createPcalToken(token, column, type));
    }
    token = "";
  };
  const outputToken = (type: number) => {
    emitToken(type);
    gotoStart();
  };
  const addAndGoto = (nextState: string) => {
    addNextChar();
    scanState = nextState;
  };
  const skipAndGoto = (nextState: string) => {
    skipNextChar();
    scanState = nextState;
  };
  const step = (next: string) => {
    switch (scanState) {
      case "start":
        if (isSpace(next)) {
          skipNextChar();
          return gotoStart();
        }
        if (isLetter(next)) return addAndGoto("id");
        if (next === "ℕ" || next === "ℤ" || next === "ℝ") {
          addNextChar();
          return outputToken(TOKEN_TYPE.ident);
        }
        if (isDigit(next)) return addAndGoto("numOrId");
        if (next === "\\") return addAndGoto("bs");
        if (next === "-") return addAndGoto("dash1");
        if (next === "=") return addAndGoto("eq1");
        if (next === "(") return skipAndGoto("leftParen");
        if (next === '"') return skipAndGoto("string");
        if (next === "\n") {
          skipNextChar();
          startNewLine();
          return gotoStart();
        }
        if (BUILT_IN_PREFIXES.has(next)) return addAndGoto("builtIn");
        if (next === "\t") {
          scanState = "done";
          return;
        }
        addNextChar();
        return throwTokenizingError("Illegal lexeme");
      case "id":
        if (token === "WF_" || token === "SF_") return outputToken(TOKEN_TYPE.builtin);
        if (isLetter(next) || isDigit(next)) return addNextChar();
        return outputToken(BUILT_IN_SYMBOLS.has(token) ? TOKEN_TYPE.builtin : TOKEN_TYPE.ident);
      case "numOrId":
        if (isDigit(next)) return addNextChar();
        if (isLetter(next)) return addAndGoto("id");
        return outputToken(TOKEN_TYPE.number);
      case "bs":
        if (["b", "B", "o", "O", "h", "H"].includes(next)) return addAndGoto("numOrBi");
        if (isLetter(next)) {
          scanState = "bsBuiltIn";
          return;
        }
        if (next === "*") {
          skipNextChar();
          token = "";
          scanState = "lineComment";
          return;
        }
        scanState = "builtIn";
        return;
      case "numOrBi":
        scanState = isDigit(next) ? "num" : "bsBuiltIn";
        return;
      case "num":
        if (isDigit(next)) return addNextChar();
        if (!isLetter(next)) return outputToken(TOKEN_TYPE.number);
        addNextChar();
        if (token.startsWith("\\")) throwTokenizingError("Illegal lexeme");
        scanState = "id";
        return;
      case "bsBuiltIn":
        if (isLetter(next) && next !== "_") return addNextChar();
        if (BUILT_IN_SYMBOLS.has(token)) return outputToken(TOKEN_TYPE.builtin);
        return throwTokenizingError("Illegal lexeme ");
      case "builtIn":
        if (BUILT_IN_PREFIXES.has(token + next)) return addNextChar();
        if (!BUILT_IN_SYMBOLS.has(token)) {
          backspacePcalReader(reader);
          while (!BUILT_IN_SYMBOLS.has(token)) {
            backspacePcalReader(reader);
            if (token.length === 0) throwTokenizingError("Illegal lexeme");
            token = Array.from(token).slice(0, -1).join("");
          }
          skipNextChar();
        }
        return outputToken(TOKEN_TYPE.builtin);
      case "dash1":
      case "dash2":
        if (next === "-") return addAndGoto(scanState === "dash1" ? "dash2" : "dash3");
        scanState = "builtIn";
        return;
      case "dash3":
        if (next !== "-") throwTokenizingError("Illegal lexeme");
        return addAndGoto("dashes");
      case "dashes":
        return next === "-" ? addNextChar() : outputToken(TOKEN_TYPE.dashes);
      case "eq1":
      case "eq2":
        if (next === "=") return addAndGoto(scanState === "eq1" ? "eq2" : "eq3");
        scanState = "builtIn";
        return;
      case "eq3":
        if (next !== "=") throwTokenizingError("Illegal lexeme");
        return addAndGoto("eqs");
      case "eqs":
        return next === "=" ? addNextChar() : outputToken(TOKEN_TYPE.endModule);
      case "leftParen":
        if (next === "*") {
          state.commentDepth = 1;
          return skipAndGoto("comment");
        }
        token = "(";
        scanState = "builtIn";
        return;
      case "string":
        if (next === "\\") return addAndGoto("escString");
        if (next === '"') {
          skipNextChar();
          return outputToken(TOKEN_TYPE.string);
        }
        addNextChar();
        if (!STRING_CHARS.has(next)) throwTokenizingError("Illegal character in string");
        return;
      case "escString":
        addNextChar();
        if (!['"', "\\", "t", "n", "f", "r"].includes(next)) {
          throwTokenizingError("Illegal character following \\ in string");
        }
        scanState = "string";
        return;
      case "lineComment":
        if (next === "(") return skipAndGoto("lineComParen");
        if (next === "*" && state.commentDepth > 0) return skipAndGoto("lineComStar");
        if (next === "\n" || next === "\t") {
          token = "";
          state.commentDepth = 0;
          return gotoStart();
        }
        return state.commentDepth === 0 ? addNextChar() : skipNextChar();
      case "lineComParen":
        if (next === "*") {
          state.commentDepth += 1;
          return skipAndGoto("lineComment");
        }
        if (state.commentDepth === 0) token += "(";
        scanState = "lineComment";
        return;
      case "lineComStar":
        if (next === ")") {
          state.commentDepth -= 1;
          if (state.commentDepth < 0) {
            throw new PcalBugError("Failure of assertion: case LINE_COM_STAR");
          }
          return skipAndGoto("lineComment");
        }
        if (state.commentDepth === 0) token += "*";
        scanState = "lineComment";
        return;
      case "comment":
      case "orComment": {
        const isFirstLine = scanState === "comment";
        if (next === "*") return skipAndGoto(isFirstLine ? "commentStar" : "orCommentStar");
        if (next === "(") return skipAndGoto(isFirstLine ? "commentParen" : "orCommentParen");
        if (next === "\n") {
          token = "";
          skipNextChar();
          startNewLine();
          scanState = "orComment";
          return;
        }
        if (next === "\t") {
          throw new PcalError(
            isFirstLine
              ? "Input ended in the middle of a comment"
              : "Input ended in the middle of a multi-line comment",
          );
        }
        return state.commentDepth === 1 ? addNextChar() : skipNextChar();
      }
      case "commentStar":
      case "orCommentStar": {
        const commentState = scanState === "commentStar" ? "comment" : "orComment";
        if (next !== ")") {
          if (state.commentDepth === 1) token += "*";
          scanState = commentState;
          return;
        }
        skipNextChar();
        state.commentDepth -= 1;
        if (commentState === "orComment" && state.commentDepth < 0) {
          throw new PcalBugError("Assertion failure");
        }
        if (state.commentDepth !== 0) {
          scanState = commentState;
          return;
        }
        token = "";
        return gotoStart();
      }
      case "commentParen":
      case "orCommentParen": {
        const commentState = scanState === "commentParen" ? "comment" : "orComment";
        if (next === "*") {
          state.commentDepth += 1;
          return skipAndGoto(commentState);
        }
        if (state.commentDepth === 1) token += "(";
        scanState = commentState;
        return;
      }
    }
  };
  while (scanState !== "done" && !isExprEnd) step(nextChar);
  if (nextChar !== "\n") backspacePcalReader(reader);
  return createNormalizedPcalExpr(lines);
};

export const tokenizePcalExpr = (
  state: PcalTokenizerState,
  reader: PcalCharReader,
  isInDefineBlock: boolean,
) => tokenize(state, reader, true, isInDefineBlock);

export const getPcalAlgorithmToken = (state: PcalTokenizerState, reader: PcalCharReader) => {
  tokenize(state, reader, false, false);
  return state.delimiter;
};
