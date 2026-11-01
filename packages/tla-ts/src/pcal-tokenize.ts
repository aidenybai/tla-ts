import { PcalError, PcalBugError } from "./errors";
import { createNormalizedPcalExpr, createPcalToken, PCAL_TOKEN, type PcalToken } from "./pcal-ast";

// PcalCharReader: reads the algorithm's characters from the lines between a start and an end
// position, returning "\n" at the end of each line and "\t" at the end of the input. Columns count
// code points, and getColumnNumber counts tabs as reaching the next multiple of 8.
export interface PcalCharReader {
  lines: string[];
  currentLine: string[] | undefined;
  line: number;
  column: number;
  vcolumn: number;
  lastLine: number;
  lastColumn: number;
  isTabToSpaces: boolean;
}

export const createPcalCharReader = (
  lines: string[],
  firstLine: number,
  firstColumn: number,
  lastLine: number,
  lastColumn: number,
): PcalCharReader => ({
  lines,
  currentLine: firstLine < lines.length ? Array.from(lines[firstLine]) : undefined,
  line: firstLine,
  column: firstColumn,
  vcolumn:
    firstLine < lines.length
      ? Array.from(lines[firstLine].slice(0, firstColumn)).reduce(
          (vcolumn, char) => (char === "\t" ? (Math.floor(vcolumn / 8) + 1) * 8 : vcolumn + 1),
          0,
        )
      : 0,
  lastLine,
  lastColumn,
  isTabToSpaces: false,
});

const getNextPcalChar = (reader: PcalCharReader) => {
  if (reader.currentLine === undefined) return "\t";
  if (reader.isTabToSpaces) {
    reader.vcolumn += 1;
    if (reader.vcolumn % 8 === 0) reader.isTabToSpaces = false;
    return " ";
  }
  if (
    reader.line > reader.lastLine ||
    (reader.line === reader.lastLine && reader.column >= reader.lastColumn)
  ) {
    return "\t";
  }
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
  if (char !== "\t") return char;
  if (reader.vcolumn % 8 !== 0) reader.isTabToSpaces = true;
  return " ";
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
  const currentLine = Array.from(reader.lines[reader.line]);
  reader.currentLine = currentLine;
  reader.column = 0;
  reader.vcolumn = 0;
  while (reader.column < currentLine.length - 1) getNextPcalChar(reader);
};

// PcalCharReader.peek: the rest of the line from the next character that is not white space, with
// its "\n", or "\t" at the end of the input.
export const peekPcalReader = (reader: PcalCharReader) => {
  for (;;) {
    const next = getNextPcalChar(reader);
    if (next === "\t") return "\t";
    if (next !== " " && next !== "\n") break;
  }
  backspacePcalReader(reader);
  return `${(reader.currentLine ?? []).slice(reader.column).join("")}\n`;
};

// Symbol.LEFT_PAREN and RIGHT_PAREN of PcalBuiltInSymbols' table.
const LEFT_PARENS = new Set(["(", "[", "{", "<<", "⟨"]);
const RIGHT_PARENS = new Set([">>_", "⟩_", "]_", ")", "}", "]", ">>", "⟩"]);

// PcalBuiltInSymbols.buildHashTable.
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

// tla2tex.Misc.IsLetter, IsDigit and IsSpace, which only accept ASCII.
const isLetter = (char: string) => /^[A-Za-z_]$/.test(char);
const isDigit = (char: string) => /^[0-9]$/.test(char);
const isSpace = (char: string) => char === " " || char === "\f" || char === "\r";

// PcalBuiltInSymbols.buildPrefixHashTable: the prefixes of the symbols that are not words.
const BUILT_IN_PREFIXES = new Set(
  [...BUILT_IN_SYMBOLS]
    .filter((symbol) => !isLetter(symbol[0]) && !(symbol[0] === "\\" && isLetter(symbol[1] ?? "")))
    .flatMap((symbol) => Array.from(symbol, (_, index) => symbol.slice(0, symbol.length - index))),
);

// PcalBuiltInSymbols.buildStringCharTable.
const STRING_CHARS = new Set(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ~!@#$%^&*()_-+={}[]|:;<,>.?/`'0123456789",
);

// Tokenize.IsDelimiter: the words and symbols that end an expression of the algorithm.
const DELIMITERS = new Set(
  "; do then := ≔ begin variable variables || ‖ end else elsif if either or while with call return goto print assert skip procedure define process fair".split(
    " ",
  ),
);

// tla2tex.Token's types, of which an expression allows the ones TLAToken shares.
const TOKEN_TYPE = { ...PCAL_TOKEN, dashes: 6, endModule: 7 };

// Tokenize's static Delimiter fields, the delimiter its last call ended at, and its comment depth,
// which an error in a comment leaves set for the next call.
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

interface PcalScan {
  lines: PcalToken[][];
  line: PcalToken[];
  token: string;
  state: string;
  column: number;
  nextColumn: number;
  nextChar: string;
  parenDepth: number;
  isInQuantifier: boolean;
  isExprEnd: boolean;
  previousToken: string;
}

// Tokenize.InnerTokenize in TLA mode: reads an expression up to the delimiter that ends it when
// isExpr, and otherwise a single token of the algorithm, which becomes state.delimiter. A define
// block's commas at the top level don't end it.
const tokenize = (
  state: PcalTokenizerState,
  reader: PcalCharReader,
  isExpr: boolean,
  isInDefineBlock: boolean,
) => {
  const scan: PcalScan = {
    lines: [],
    line: [],
    token: "",
    state: "start",
    column: reader.vcolumn,
    nextColumn: reader.vcolumn,
    nextChar: getNextPcalChar(reader),
    parenDepth: 0,
    isInQuantifier: false,
    isExprEnd: false,
    previousToken: " ",
  };
  const skipNextChar = () => {
    scan.nextColumn = reader.vcolumn;
    scan.nextChar = getNextPcalChar(reader);
  };
  const addNextChar = () => {
    scan.token += scan.nextChar;
    skipNextChar();
  };
  const gotoStart = () => {
    scan.state = "start";
    scan.column = scan.nextColumn;
  };
  const startNewLine = () => {
    scan.lines.push(scan.line);
    scan.line = [];
    scan.column = 0;
  };
  const throwTokenizingError = (message: string): never => {
    throw new PcalError(
      `${message} \`${scan.token}' found at\n    line ${reader.line + 1}, column ${scan.column + 1}`,
    );
  };
  const endExpression = () => {
    scan.isExprEnd = true;
    state.delimiter = scan.token;
    state.delimiterCol = scan.column;
    state.delimiterLine = reader.line - (scan.nextChar === "\n" ? 1 : 0);
  };
  // Tokenize.TokenOut.
  const tokenOut = (type: number) => {
    if (!isExpr) {
      endExpression();
      scan.token = "";
      return;
    }
    if (type > TOKEN_TYPE.ident) throwTokenizingError("Illegal token in an expression");
    const token = scan.token;
    const isDelimiter =
      type !== TOKEN_TYPE.string &&
      ((DELIMITERS.has(token) &&
        !(type === TOKEN_TYPE.ident && [".", "[", ","].includes(scan.previousToken))) ||
        (((token === "," && !scan.isInQuantifier && !isInDefineBlock) ||
          token === ")" ||
          token === "}") &&
          scan.parenDepth === 0));
    if (isDelimiter) {
      if (scan.parenDepth !== 0) {
        throwTokenizingError("Expression with an unmatched (, [, {, or << followed by");
      }
      if (scan.isInQuantifier) {
        throwTokenizingError("Expression with \\A or \\E but no following `:` followed by");
      }
      endExpression();
      if (scan.line.length > 0) startNewLine();
      return;
    }
    if (type === TOKEN_TYPE.builtin && LEFT_PARENS.has(token)) scan.parenDepth += 1;
    if (type === TOKEN_TYPE.builtin && RIGHT_PARENS.has(token)) {
      scan.parenDepth -= 1;
      if (scan.parenDepth < 0) throwTokenizingError("Extra (unmatching)");
    }
    scan.previousToken = type === TOKEN_TYPE.string ? " " : token;
    if (["\\A", "∀", "\\E", "∃"].includes(token) && scan.parenDepth === 0) {
      scan.isInQuantifier = true;
    }
    if (scan.isInQuantifier && token === ":" && scan.parenDepth === 0) {
      scan.isInQuantifier = false;
    }
    if (token !== "" || type === TOKEN_TYPE.string) {
      scan.line.push(createPcalToken(token, scan.column, type));
    }
    scan.token = "";
  };
  const outputToken = (type: number) => {
    tokenOut(type);
    gotoStart();
  };
  const addAndGoto = (nextState: string) => {
    addNextChar();
    scan.state = nextState;
  };
  const skipAndGoto = (nextState: string) => {
    skipNextChar();
    scan.state = nextState;
  };
  // One transition of the state machine on the next character.
  const step = (next: string) => {
    switch (scan.state) {
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
          scan.state = "done";
          return;
        }
        addNextChar();
        return throwTokenizingError("Illegal lexeme");
      case "id":
        if (scan.token === "WF_" || scan.token === "SF_") return outputToken(TOKEN_TYPE.builtin);
        if (isLetter(next) || isDigit(next)) return addNextChar();
        return outputToken(
          BUILT_IN_SYMBOLS.has(scan.token) ? TOKEN_TYPE.builtin : TOKEN_TYPE.ident,
        );
      case "numOrId":
        if (isDigit(next)) return addNextChar();
        if (isLetter(next)) return addAndGoto("id");
        return outputToken(TOKEN_TYPE.number);
      case "bs":
        if (["b", "B", "o", "O", "h", "H"].includes(next)) return addAndGoto("numOrBi");
        if (isLetter(next)) {
          scan.state = "bsBuiltIn";
          return;
        }
        if (next === "*") {
          skipNextChar();
          scan.token = "";
          scan.state = "lineComment";
          return;
        }
        scan.state = "builtIn";
        return;
      case "numOrBi":
        scan.state = isDigit(next) ? "num" : "bsBuiltIn";
        return;
      case "num":
        if (isDigit(next)) return addNextChar();
        if (!isLetter(next)) return outputToken(TOKEN_TYPE.number);
        addNextChar();
        if (scan.token.startsWith("\\")) throwTokenizingError("Illegal lexeme");
        scan.state = "id";
        return;
      case "bsBuiltIn":
        if (isLetter(next) && next !== "_") return addNextChar();
        if (BUILT_IN_SYMBOLS.has(scan.token)) return outputToken(TOKEN_TYPE.builtin);
        return throwTokenizingError("Illegal lexeme ");
      case "builtIn":
        if (BUILT_IN_PREFIXES.has(scan.token + next)) return addNextChar();
        // A prefix that is no symbol backs up to its longest symbol.
        if (!BUILT_IN_SYMBOLS.has(scan.token)) {
          backspacePcalReader(reader);
          while (!BUILT_IN_SYMBOLS.has(scan.token)) {
            backspacePcalReader(reader);
            if (scan.token.length === 0) throwTokenizingError("Illegal lexeme");
            scan.token = Array.from(scan.token).slice(0, -1).join("");
          }
          skipNextChar();
        }
        return outputToken(TOKEN_TYPE.builtin);
      case "dash1":
      case "dash2":
        if (next === "-") return addAndGoto(scan.state === "dash1" ? "dash2" : "dash3");
        scan.state = "builtIn";
        return;
      case "dash3":
        if (next !== "-") throwTokenizingError("Illegal lexeme");
        return addAndGoto("dashes");
      case "dashes":
        return next === "-" ? addNextChar() : outputToken(TOKEN_TYPE.dashes);
      case "eq1":
      case "eq2":
        if (next === "=") return addAndGoto(scan.state === "eq1" ? "eq2" : "eq3");
        scan.state = "builtIn";
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
        scan.token = "(";
        scan.state = "builtIn";
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
        scan.state = "string";
        return;
      case "lineComment":
        if (next === "(") return skipAndGoto("lineComParen");
        if (next === "*" && state.commentDepth > 0) return skipAndGoto("lineComStar");
        if (next === "\n" || next === "\t") {
          scan.token = "";
          state.commentDepth = 0;
          return gotoStart();
        }
        return state.commentDepth === 0 ? addNextChar() : skipNextChar();
      case "lineComParen":
        if (next === "*") {
          state.commentDepth += 1;
          return skipAndGoto("lineComment");
        }
        if (state.commentDepth === 0) scan.token += "(";
        scan.state = "lineComment";
        return;
      case "lineComStar":
        if (next === ")") {
          state.commentDepth -= 1;
          if (state.commentDepth < 0) {
            throw new PcalBugError("Failure of assertion: case LINE_COM_STAR");
          }
          return skipAndGoto("lineComment");
        }
        if (state.commentDepth === 0) scan.token += "*";
        scan.state = "lineComment";
        return;
      // A comment that continues past its first line is an "or comment".
      case "comment":
      case "orComment": {
        const isFirstLine = scan.state === "comment";
        if (next === "*") return skipAndGoto(isFirstLine ? "commentStar" : "orCommentStar");
        if (next === "(") return skipAndGoto(isFirstLine ? "commentParen" : "orCommentParen");
        if (next === "\n") {
          scan.token = "";
          skipNextChar();
          startNewLine();
          scan.state = "orComment";
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
        const commentState = scan.state === "commentStar" ? "comment" : "orComment";
        if (next !== ")") {
          if (state.commentDepth === 1) scan.token += "*";
          scan.state = commentState;
          return;
        }
        skipNextChar();
        state.commentDepth -= 1;
        if (commentState === "orComment" && state.commentDepth < 0) {
          throw new PcalBugError("Assertion failure");
        }
        if (state.commentDepth !== 0) {
          scan.state = commentState;
          return;
        }
        scan.token = "";
        return gotoStart();
      }
      case "commentParen":
      case "orCommentParen": {
        const commentState = scan.state === "commentParen" ? "comment" : "orComment";
        if (next === "*") {
          state.commentDepth += 1;
          return skipAndGoto(commentState);
        }
        if (state.commentDepth === 1) scan.token += "(";
        scan.state = commentState;
        return;
      }
    }
  };
  while (scan.state !== "done" && !scan.isExprEnd) step(scan.nextChar);
  if (scan.nextChar !== "\n") backspacePcalReader(reader);
  return createNormalizedPcalExpr(scan.lines);
};

// Tokenize.TokenizeExpr and TokenizeDefineBlock.
export const tokenizePcalExpr = (
  state: PcalTokenizerState,
  reader: PcalCharReader,
  isInDefineBlock: boolean,
) => tokenize(state, reader, true, isInDefineBlock);

// Tokenize.GetAlgorithmToken.
export const getPcalAlgorithmToken = (state: PcalTokenizerState, reader: PcalCharReader) => {
  tokenize(state, reader, false, false);
  return state.delimiter;
};
