import { PcalError, PcalRuntimeError, PcalBugError } from "./errors";
import {
  clonePcalExpr,
  createPcalBase,
  getElement,
  getPcalLocation,
  getPcalTokenAt,
  normalizePcalExpr,
  PCAL_TOKEN,
  prependPcalExpr,
  stepPcalCoord,
  substitutePcalExpr,
  substitutePcalExprs,
  type PcalAlgorithm,
  type PcalAssign,
  type PcalCall,
  type PcalClause,
  type PcalExpr,
  type PcalLabeledStmt,
  type PcalLabelEither,
  type PcalLabelIf,
  type PcalLhs,
  type PcalMacro,
  type PcalMacroCall,
  type PcalParams,
  type PcalProcedure,
  type PcalProcess,
  type PcalPVarDecl,
  type PcalSingleAssign,
  type PcalStmt,
  type PcalVarDecl,
  type PcalWith,
  createPcalExpr,
  createPcalToken,
} from "./pcal-ast";
import {
  createPcalTokenizerState,
  getPcalAlgorithmToken,
  peekPcalReader,
  tokenizePcalDefineBlock,
  tokenizePcalExpr,
  type PcalCharReader,
  type PcalTokenizerState,
} from "./pcal-tokenize";

// The translator's state that its Java code keeps in static fields, which SANY never resets
// between the modules it validates: the options, the tokenizer's state, ParseAlgorithm's
// lookahead buffer and last token, and whether a macro's parsing was cut short by an error.
export interface PcalSession {
  params: PcalParams;
  tokenizer: PcalTokenizerState;
  lookahead: { tokens: string[]; columns: number[]; lines: number[] };
  lastToken: { column: number; line: number; text: string };
  isInMacro: boolean;
  // ToolIO.out.println, which PcalDebug's reports go to.
  log: (line: string) => void;
}

export const createPcalSession = (
  params: PcalParams,
  log: (line: string) => void,
): PcalSession => ({
  params,
  tokenizer: createPcalTokenizerState(),
  lookahead: {
    tokens: Array.from({ length: 10 }, () => ""),
    columns: Array.from({ length: 10 }, () => 0),
    lines: Array.from({ length: 10 }, () => 0),
  },
  lastToken: { column: 0, line: 0, text: "" },
  isInMacro: false,
  log,
});

// ParseAlgorithm's static fields that Init resets for each algorithm.
interface PcalParserState {
  lookaheadSize: number;
  addedLabels: string[];
  addedLabelsLocs: string[];
  nextLabelNum: number;
  allLabels: Set<string>;
  hasLabel: boolean;
  hasDefaultInitialization: boolean;
  currentProcedure: string | undefined;
  procedures: PcalProcedure[];
  pSyntax: boolean;
  cSyntax: boolean;
  plusLabels: string[];
  minusLabels: string[];
  proceduresCalled: string[];
  gotoUsed: boolean;
  gotoDoneUsed: boolean;
  omitPC: boolean;
  omitStutteringWhenDone: boolean;
}

export interface PcalParseResult {
  ast: PcalAlgorithm;
  omitPC: boolean;
  omitStutteringWhenDone: boolean;
  hasDefaultInitialization: boolean;
}

// PcalParams.DefaultVarInit: the value of a variable declared without one.
const createDefaultVarInit = () => {
  const expr = createPcalExpr([[createPcalToken("defaultInitValue", 0, 0)]]);
  normalizePcalExpr(expr);
  return expr;
};

// ParseAlgorithm.Union.
const getUnion = (first: string[], second: string[]) => [
  ...first,
  ...second.filter((name, index) => !first.includes(name) && second.indexOf(name) === index),
];

// ParseAlgorithm.HasEmptyIntersection.
const isDisjoint = (first: string[], second: string[]) =>
  !second.some((name) => first.includes(name));

// ParseAlgorithm.Copy: replaces the contents of target, which callers share.
const copyInto = (source: string[], target: string[]) => {
  target.splice(0, target.length, ...source);
};

// ParseAlgorithm.getAlgorithm: parses the algorithm the reader is at, just after "--algorithm" or
// "--fair", adds the labels it needs, and expands its macros.
export const parsePcalAlgorithm = (
  session: PcalSession,
  reader: PcalCharReader,
  isFairAlgorithm: boolean,
): PcalParseResult => {
  const params = session.params;
  const lookahead = session.lookahead;
  const lastToken = session.lastToken;
  // ParseAlgorithm.Init.
  const state: PcalParserState = {
    lookaheadSize: 0,
    addedLabels: [],
    addedLabelsLocs: [],
    nextLabelNum: 1,
    allLabels: new Set(),
    hasLabel: false,
    hasDefaultInitialization: false,
    currentProcedure: undefined,
    procedures: [],
    pSyntax: false,
    cSyntax: false,
    plusLabels: [],
    minusLabels: [],
    proceduresCalled: [],
    gotoUsed: false,
    gotoDoneUsed: false,
    omitPC: params.inputVersionNumber >= 1500,
    omitStutteringWhenDone: params.inputVersionNumber >= 1500,
  };

  // ParseAlgorithm.ParsingError.
  const parsingError = (message: string): never => {
    throw new PcalError(`${message}\n    line ${lastToken.line}, column ${lastToken.column}`);
  };

  const getAlgToken = () => {
    if (state.lookaheadSize === 0) {
      peekPcalReader(reader);
      lastToken.column = reader.vcolumn + 1;
      lastToken.line = reader.line + 1;
      lastToken.text = getPcalAlgorithmToken(session.tokenizer, reader);
      return lastToken.text;
    }
    lastToken.column = lookahead.columns[0] + 1;
    lastToken.line = lookahead.lines[0] + 1;
    const result = lookahead.tokens[0];
    for (let index = 1; index < state.lookaheadSize; index++) {
      lookahead.tokens[index - 1] = lookahead.tokens[index];
      lookahead.columns[index - 1] = lookahead.columns[index];
      lookahead.lines[index - 1] = lookahead.lines[index];
    }
    state.lookaheadSize -= 1;
    lastToken.text = result;
    return result;
  };

  const peekAtAlgToken = (tokenNumber: number) => {
    while (state.lookaheadSize < tokenNumber) {
      const size = state.lookaheadSize;
      if (peekPcalReader(reader) === "\t") {
        throw new PcalError(
          `Premature end of file, perhaps because of unclosed comment, near\n    line ${lookahead.lines[size] + 1}, column ${lookahead.columns[size] + 1}`,
        );
      }
      lookahead.columns[size] = reader.vcolumn;
      lookahead.lines[size] = reader.line;
      lookahead.tokens[size] = getPcalAlgorithmToken(session.tokenizer, reader);
      state.lookaheadSize += 1;
    }
    return lookahead.tokens[tokenNumber - 1];
  };

  // ParseAlgorithm.PeekPastAlgToken: the rest of the line after the next tokenNumber tokens.
  const peekPastAlgToken = (tokenNumber: number) => {
    if (tokenNumber < state.lookaheadSize) {
      throw new PcalBugError(
        "ParseAlgorithm.PeekPastAlgToken called to peek after a token\n    it has already peeked at",
      );
    }
    while (tokenNumber > state.lookaheadSize) {
      lookahead.tokens[state.lookaheadSize] = getPcalAlgorithmToken(session.tokenizer, reader);
      state.lookaheadSize += 1;
    }
    return peekPcalReader(reader);
  };

  // ParseAlgorithm.getExprInternal: an expression's delimiter becomes the next token.
  const getExpr = (isDefineBlock = false) => {
    if (state.lookaheadSize !== 0) {
      throw new PcalBugError("ParseAlgorithm: GetExpr called after lookahead");
    }
    const result = isDefineBlock
      ? tokenizePcalDefineBlock(session.tokenizer, reader)
      : tokenizePcalExpr(session.tokenizer, reader);
    lookahead.tokens[0] = session.tokenizer.delimiter;
    lookahead.columns[0] = session.tokenizer.delimiterCol;
    lookahead.lines[0] = session.tokenizer.delimiterLine;
    state.lookaheadSize = 1;
    return result;
  };

  // ParseAlgorithm.GobbleThis: a missing ";" is fine before a token that can't start a statement.
  const gobbleThis = (expected: string, alternate?: string) => {
    if (expected === ";") {
      const next = peekAtAlgToken(1);
      const endings = "end begin else elsif or do macro procedure process fair define } {";
      if (endings.split(" ").includes(next)) return;
      const statements = "if either while with call return goto print assert skip";
      if (statements.split(" ").includes(next)) {
        throw new PcalError(
          `Missing \`;' before line ${lookahead.lines[0] + 1}, column ${lookahead.columns[0] + 1}`,
        );
      }
    }
    const token = getAlgToken();
    if (token !== expected && token !== alternate) {
      parsingError(`Expected "${expected}" but found "${token}"`);
    }
  };

  const mustGobbleThis = (expected: string) => {
    const token = getAlgToken();
    if (token !== expected) parsingError(`Expected "${expected}" but found "${token}"`);
  };

  const gobbleEqualOrIf = () => {
    const token = getAlgToken();
    if (token === "=") return true;
    if (token === "\\in" || token === "∈") return false;
    return parsingError(`Expected "=" or "\\in"  but found "${token}"`);
  };

  const gobbleCommaOrSemicolon = () => gobbleThis(peekAtAlgToken(1) === "," ? "," : ";");

  const gobbleBeginOrLeftBrace = () => gobbleThis(state.pSyntax ? "begin" : "{");

  const gobbleEndOrRightBrace = (name: string) => {
    if (state.cSyntax) {
      gobbleThis("}");
      return;
    }
    gobbleThis("end");
    gobbleThis(name);
  };

  const gobbleVariables = () => {
    if (peekAtAlgToken(1) === "variables") mustGobbleThis("variables");
    else gobbleThis("variable");
  };

  const getVarDecl = (): PcalVarDecl => {
    const decl: PcalVarDecl = {
      ...createPcalBase(),
      kind: "VarDecl",
      var: getAlgToken(),
      isEq: true,
      val: createDefaultVarInit(),
    };
    decl.col = lastToken.column;
    decl.line = lastToken.line;
    if (!["=", "\\in", "∈"].includes(peekAtAlgToken(1))) {
      state.hasDefaultInitialization = true;
      return decl;
    }
    decl.isEq = gobbleEqualOrIf();
    decl.val = getExpr();
    // ParseAlgorithm.GetVarDecl takes the end of the value's origin, which an empty value lacks,
    // before checking for one.
    if (decl.val.tokens.length === 0) throw new PcalRuntimeError("NullPointerException");
    return decl;
  };

  const getVarDecls = () => {
    gobbleVariables();
    const result: PcalVarDecl[] = [];
    const ends = ["begin", "{", "procedure", "process", "fair", "define", "macro"];
    while (!ends.includes(peekAtAlgToken(1))) {
      result.push(getVarDecl());
      gobbleCommaOrSemicolon();
    }
    return result;
  };

  const getPVarDecl = (): PcalPVarDecl => {
    const decl: PcalPVarDecl = {
      ...createPcalBase(),
      kind: "PVarDecl",
      var: getAlgToken(),
      val: createDefaultVarInit(),
    };
    decl.col = lastToken.column;
    decl.line = lastToken.line;
    if (peekAtAlgToken(1) !== "=") {
      state.hasDefaultInitialization = true;
      return decl;
    }
    gobbleThis("=");
    decl.val = getExpr();
    if (decl.val.tokens.length === 0) throw new PcalRuntimeError("NullPointerException");
    return decl;
  };

  const getPVarDecls = () => {
    gobbleVariables();
    const result: PcalPVarDecl[] = [];
    while (!(peekAtAlgToken(1) === "begin" || peekAtAlgToken(1) === "{")) {
      result.push(getPVarDecl());
      gobbleCommaOrSemicolon();
    }
    return result;
  };

  // ParseAlgorithm.IsLabelNext: an identifier followed by ":" but not ":=".
  const isLabelNext = () => {
    const keywords =
      "while if assert print else elsif either or end with when await skip call return goto";
    if (keywords.split(" ").includes(peekAtAlgToken(1))) return false;
    const rest = peekPcalReader(reader);
    return rest.length > 0 && rest[0] === ":" && !(rest.length > 1 && rest[1] === "=");
  };

  const getLabel = () => {
    if (!isLabelNext()) return "";
    const label = getAlgToken();
    if (session.isInMacro) parsingError("A label may not appear in a macro.");
    if (label === "Done") parsingError("Cannot use `Done' as a label.");
    if (label === "Error") parsingError("Cannot use `Error' as a label.");
    gobbleThis(":");
    state.hasLabel = true;
    state.allLabels.add(label);
    const modifier = peekAtAlgToken(1);
    if (modifier !== "+" && modifier !== "-") return label;
    gobbleThis(modifier);
    (modifier === "+" ? state.plusLabels : state.minusLabels).push(label);
    state.omitPC = false;
    return label;
  };

  const getStmtSeq = (): PcalStmt[] => {
    const result: PcalStmt[] = [];
    const isEnd = (token: string) =>
      (state.pSyntax && ["end", "else", "elsif", "or"].includes(token)) ||
      (state.cSyntax && token === "}");
    while (!isEnd(peekAtAlgToken(1))) {
      const label = getLabel();
      if (state.cSyntax && peekAtAlgToken(1) === "{") result.push(...getCStmtSeq(label));
      else {
        const stmt = getStmt();
        stmt.lbl = label;
        result.push(stmt);
      }
    }
    if (state.cSyntax && result.length === 0) parsingError("Empty statement list");
    return result;
  };

  const getCStmtSeq = (label: string) => {
    mustGobbleThis("{");
    const result = getStmtSeq();
    gobbleThis("}");
    gobbleThis(";");
    if (label !== "") {
      if (result[0].lbl !== "") throw new PcalError("Duplicate labeling of statement", result[0]);
      result[0].lbl = label;
    }
    return result;
  };

  const getCStmt = () => {
    const label = getLabel();
    if (peekAtAlgToken(1) === "{") return getCStmtSeq(label);
    const stmt = getStmt();
    stmt.lbl = label;
    return [stmt];
  };

  const getStmt = (): PcalStmt => {
    const next = peekAtAlgToken(1);
    if (next === "if") return getIf(0);
    if (next === "either") return getEither();
    if (next === "with") return getWith(0);
    if (next === "when" || next === "await") {
      mustGobbleThis(next);
      const col = lastToken.column;
      const line = lastToken.line;
      const exp = getExpr();
      // ParseAlgorithm.GetWhen takes the end of the expression's origin, which an empty
      // expression lacks, before checking for one.
      if (exp.tokens.length === 0) throw new PcalRuntimeError("NullPointerException");
      gobbleThis(";");
      return { ...createPcalBase(), kind: "When", col, line, exp };
    }
    if (next === "print") {
      mustGobbleThis("print");
      const col = lastToken.column;
      const line = lastToken.line;
      const exp = getExpr();
      if (exp.tokens.length === 0) parsingError("Empty expression in print statement at ");
      gobbleThis(";");
      return { ...createPcalBase(), kind: "PrintS", col, line, exp };
    }
    if (next === "assert") {
      mustGobbleThis("assert");
      const col = lastToken.column;
      const line = lastToken.line;
      const exp = getExpr();
      if (exp.tokens.length === 0) parsingError("Empty expression in assert statement at ");
      gobbleThis(";");
      return { ...createPcalBase(), kind: "Assert", col, line, exp };
    }
    if (next === "skip") {
      mustGobbleThis("skip");
      const skip: PcalStmt = {
        ...createPcalBase(),
        kind: "Skip",
        col: lastToken.column,
        line: lastToken.line,
      };
      gobbleThis(";");
      return skip;
    }
    if (next === "call") return getCallOrCallReturnOrCallGoto();
    if (next === "return") {
      mustGobbleThis("return");
      const result: PcalStmt = {
        ...createPcalBase(),
        kind: "Return",
        col: lastToken.column,
        line: lastToken.line,
        from: state.currentProcedure,
      };
      gobbleThis(";");
      return result;
    }
    if (next === "goto") {
      mustGobbleThis("goto");
      const col = lastToken.column;
      const line = lastToken.line;
      const to = getAlgToken();
      state.gotoUsed = true;
      if (to === "Done" || to === '"Done"') state.gotoDoneUsed = true;
      gobbleThis(";");
      return { ...createPcalBase(), kind: "Goto", col, line, to };
    }
    if (next === "while") return getWhile();
    if (peekPastAlgToken(1)[0] === "(") return getMacroCall();
    return getAssign();
  };

  const getWhile = (): PcalStmt => {
    mustGobbleThis("while");
    const col = lastToken.column;
    const line = lastToken.line;
    if (state.cSyntax) gobbleThis("(");
    const test = getExpr();
    if (state.cSyntax) gobbleThis(")");
    if (test.tokens.length === 0) parsingError("Empty while test at ");
    if (state.pSyntax) gobbleThis("do");
    const unlabDo = state.pSyntax ? getStmtSeq() : getCStmt();
    if (state.pSyntax) {
      gobbleThis("end");
      gobbleThis("while");
      gobbleThis(";");
    }
    if (unlabDo.length === 0) parsingError("Missing body of while statement at");
    return { ...createPcalBase(), kind: "While", col, line, test, unlabDo, labDo: [] };
  };

  const getIf = (depth: number): PcalLabelIf => {
    mustGobbleThis(depth === 0 ? "if" : "elsif");
    const result: PcalLabelIf = {
      ...createPcalBase(),
      kind: "LabelIf",
      col: lastToken.column,
      line: lastToken.line,
      test: createPcalExpr(),
      unlabThen: [],
      labThen: [],
      unlabElse: [],
      labElse: [],
    };
    if (state.cSyntax) gobbleThis("(");
    result.test = getExpr();
    if (state.cSyntax) gobbleThis(")");
    if (result.test.tokens.length === 0) parsingError("Empty if test at ");
    if (state.pSyntax) gobbleThis("then");
    result.unlabThen = state.pSyntax ? getStmtSeq() : getCStmt();
    const next = peekAtAlgToken(1);
    if (next === "else") {
      mustGobbleThis("else");
      result.unlabElse = state.pSyntax ? getStmtSeq() : getCStmt();
    }
    if (state.pSyntax && next === "elsif") result.unlabElse = [getIf(depth + 1)];
    if (state.pSyntax && !["else", "elsif", "end"].includes(next)) {
      parsingError('Expecting "else", "elsif", or "end"');
    }
    if (state.pSyntax && depth === 0) {
      gobbleThis("end");
      gobbleThis("if");
      gobbleThis(";");
    }
    // ParseAlgorithm.GetIf takes the origin of the last statement, which an empty then clause
    // with no else clause doesn't have.
    if (result.unlabElse.length === 0) {
      getElement(result.unlabThen, result.unlabThen.length - 1);
    }
    return result;
  };

  const getEither = (): PcalLabelEither => {
    mustGobbleThis("either");
    const result: PcalLabelEither = {
      ...createPcalBase(),
      kind: "LabelEither",
      col: lastToken.column,
      line: lastToken.line,
      clauses: [],
    };
    for (;;) {
      const clause: PcalClause = {
        ...createPcalBase(),
        kind: "Clause",
        unlabOr: state.pSyntax ? getStmtSeq() : getCStmt(),
        labOr: [],
      };
      if (clause.unlabOr.length === 0) {
        throw new PcalError("`either' statement with empty `or' clause", result);
      }
      result.clauses.push(clause);
      if (peekAtAlgToken(1) !== "or") break;
      mustGobbleThis("or");
    }
    if (state.pSyntax) {
      mustGobbleThis("end");
      gobbleThis("either");
      gobbleThis(";");
    }
    if (result.clauses.length === 1) throw new PcalError("`either' statement has no `or'", result);
    return result;
  };

  // ParseAlgorithm.InnerGetWith: "with x = e, y \in f" nests a with for each variable.
  const getWith = (depth: number): PcalWith => {
    if (depth === 0) {
      gobbleThis("with");
      if (state.cSyntax) gobbleThis("(");
    }
    const result: PcalWith = {
      ...createPcalBase(),
      kind: "With",
      col: lastToken.column,
      line: lastToken.line,
      var: getAlgToken(),
      isEq: true,
      exp: createPcalExpr(),
      Do: [],
    };
    result.isEq = gobbleEqualOrIf();
    result.exp = getExpr();
    if (state.pSyntax || peekAtAlgToken(1) !== ")") gobbleCommaOrSemicolon();
    if (result.exp.tokens.length === 0) parsingError("Empty with expression at ");
    const isBlockBody = state.pSyntax && peekAtAlgToken(1) === "do";
    const isBraceBody = state.cSyntax && peekAtAlgToken(1) === ")";
    if (isBlockBody) gobbleThis("do");
    if (isBraceBody) mustGobbleThis(")");
    result.Do = isBlockBody ? getStmtSeq() : isBraceBody ? getCStmt() : [getWith(depth + 1)];
    if (isBlockBody) {
      gobbleThis("end");
      gobbleThis("with");
      gobbleThis(";");
    }
    if (result.Do.length === 0) throw new PcalError("Missing body of with statement", result);
    return result;
  };

  const getSingleAssign = (): PcalSingleAssign => {
    const col = lookahead.columns[0] + 1;
    const line = lookahead.lines[0] + 1;
    const lhs: PcalLhs = {
      ...createPcalBase(),
      kind: "Lhs",
      col,
      line,
      var: getAlgToken(),
      sub: getExpr(),
    };
    gobbleThis(":=", "≔");
    const rhs = getExpr();
    if (rhs.tokens.length === 0) parsingError("Empty right-hand side of assignment at ");
    return { ...createPcalBase(), kind: "SingleAssign", col, line, lhs, rhs };
  };

  const getAssign = (): PcalAssign => {
    const result: PcalAssign = {
      ...createPcalBase(),
      kind: "Assign",
      col: lookahead.columns[0] + 1,
      line: lookahead.lines[0] + 1,
      ass: [getSingleAssign()],
    };
    while (peekAtAlgToken(1) === "||" || peekAtAlgToken(1) === "‖") {
      getAlgToken();
      // HACK: ParseAlgorithm.GetAssign replaces the error of an assignment after the first with
      // its own.
      try {
        result.ass.push(getSingleAssign());
      } catch (error) {
        if (!(error instanceof PcalError)) throw error;
        parsingError("Bad assignment statement at ");
      }
    }
    gobbleThis(";");
    return result;
  };

  const getCall = (): PcalCall => {
    mustGobbleThis("call");
    const result: PcalCall = {
      ...createPcalBase(),
      kind: "Call",
      col: lastToken.column,
      line: lastToken.line,
      returnTo: "",
      to: getAlgToken(),
      args: [],
    };
    gobbleThis("(");
    const hasMoreArgs = { value: peekPastAlgToken(0)[0] !== ")" };
    while (hasMoreArgs.value) {
      const arg = getExpr();
      result.args.push(arg);
      if (arg.tokens.length === 0) parsingError("Empty argument in call statement at ");
      if (peekAtAlgToken(1) !== ")") gobbleThis(",");
      else hasMoreArgs.value = false;
    }
    gobbleThis(")");
    gobbleThis(";");
    if (!state.proceduresCalled.includes(result.to)) state.proceduresCalled.push(result.to);
    return result;
  };

  const getCallOrCallReturnOrCallGoto = (): PcalStmt => {
    const call = getCall();
    if (peekAtAlgToken(1) === "return") {
      mustGobbleThis("return");
      gobbleThis(";");
      return {
        ...createPcalBase(),
        kind: "CallReturn",
        col: call.col,
        line: call.line,
        to: call.to,
        from: state.currentProcedure,
        args: call.args,
      };
    }
    if (peekAtAlgToken(1) !== "goto") return call;
    mustGobbleThis("goto");
    const result: PcalStmt = {
      ...createPcalBase(),
      kind: "CallGoto",
      col: call.col,
      line: call.line,
      to: call.to,
      after: getAlgToken(),
      args: call.args,
    };
    state.gotoUsed = true;
    if (result.to === "Done" || result.to === '"Done"') state.gotoDoneUsed = true;
    gobbleThis(";");
    return result;
  };

  const getMacroCall = (): PcalMacroCall => {
    const result: PcalMacroCall = {
      ...createPcalBase(),
      kind: "MacroCall",
      name: getAlgToken(),
      args: [],
    };
    result.col = lastToken.column;
    result.line = lastToken.line;
    mustGobbleThis("(");
    const hasMoreArgs = { value: peekPastAlgToken(0)[0] !== ")" };
    while (hasMoreArgs.value) {
      const arg = getExpr();
      result.args.push(arg);
      if (arg.tokens.length === 0) parsingError("Empty argument in call statement at ");
      if (peekAtAlgToken(1) !== ")") gobbleThis(",");
      else hasMoreArgs.value = false;
    }
    gobbleThis(")");
    gobbleThis(";");
    return result;
  };

  const getMacro = (macros: PcalMacro[]): PcalMacro => {
    session.isInMacro = true;
    mustGobbleThis("macro");
    const result: PcalMacro = {
      ...createPcalBase(),
      kind: "Macro",
      col: lastToken.column,
      line: lastToken.line,
      name: getAlgToken(),
      params: [],
      body: [],
    };
    gobbleThis("(");
    while (peekAtAlgToken(1) !== ")") {
      if (result.params.length > 0) gobbleThis(",");
      result.params.push(getAlgToken());
    }
    mustGobbleThis(")");
    gobbleBeginOrLeftBrace();
    result.body = getStmtSeq();
    gobbleEndOrRightBrace("macro");
    if (peekAtAlgToken(1) === ";") getAlgToken();
    expandMacrosInStmtSeq(result.body, macros);
    session.isInMacro = false;
    return result;
  };

  const getProcedure = (): PcalProcedure => {
    gobbleThis("procedure");
    const result: PcalProcedure = {
      ...createPcalBase(),
      kind: "Procedure",
      col: lastToken.column,
      line: lastToken.line,
      name: getAlgToken(),
      minusLabels: [],
      plusLabels: [],
      proceduresCalled: [],
      params: [],
      decls: [],
      body: [],
    };
    state.currentProcedure = result.name;
    state.plusLabels = [];
    state.minusLabels = [];
    state.proceduresCalled = [];
    gobbleThis("(");
    while (peekAtAlgToken(1) !== ")") {
      if (result.params.length > 0) gobbleThis(",");
      result.params.push(getPVarDecl());
    }
    mustGobbleThis(")");
    if (!(peekAtAlgToken(1) === "begin" || peekAtAlgToken(1) === "{")) {
      result.decls = getPVarDecls();
    }
    gobbleBeginOrLeftBrace();
    result.body = getStmtSeq();
    gobbleEndOrRightBrace("procedure");
    if (peekAtAlgToken(1) === ";") getAlgToken();
    state.currentProcedure = undefined;
    result.plusLabels = state.plusLabels;
    result.minusLabels = state.minusLabels;
    result.proceduresCalled = state.proceduresCalled;
    return result;
  };

  const getProcess = (): PcalProcess => {
    gobbleThis("process");
    const col = lastToken.column;
    const line = lastToken.line;
    if (state.cSyntax) gobbleThis("(");
    const name = getAlgToken();
    const isEq = gobbleEqualOrIf();
    const id = getExpr();
    state.plusLabels = [];
    state.minusLabels = [];
    state.proceduresCalled = [];
    if (state.cSyntax) gobbleThis(")");
    if (id.tokens.length === 0) parsingError("Empty process id at ");
    const decls = peekAtAlgToken(1) === "begin" || peekAtAlgToken(1) === "{" ? [] : getVarDecls();
    gobbleBeginOrLeftBrace();
    const body = getStmtSeq();
    gobbleEndOrRightBrace("process");
    if (peekAtAlgToken(1) === ";") getAlgToken();
    return {
      ...createPcalBase(),
      kind: "Process",
      col,
      line,
      name,
      fairness: 0,
      minusLabels: state.minusLabels,
      plusLabels: state.plusLabels,
      proceduresCalled: state.proceduresCalled,
      isEq,
      id,
      decls,
      body,
    };
  };

  // ParseAlgorithm.NeedsLabel: the label root and the next number no label of the algorithm has.
  const getUnusedLabel = (): string => {
    const label = `${params.labelRoot}${state.nextLabelNum}`;
    state.nextLabelNum += 1;
    return state.allLabels.has(label) ? getUnusedLabel() : label;
  };

  const needsLabel = (stmt: PcalStmt) => {
    if (stmt.lbl !== "") return;
    stmt.lbl = getUnusedLabel();
    state.addedLabels.push(stmt.lbl);
    state.addedLabelsLocs.push(getPcalLocation(stmt));
  };

  // ParseAlgorithm.InnerAddLabels: labels the statements that must start a step, tracking the
  // variables assigned since the last label in outAssigned. True when the statement after the
  // sequence needs a label.
  const addLabels = (
    stmts: PcalStmt[],
    isFirstLabeled: boolean,
    isInWith: boolean,
    inAssigned: string[],
    outAssigned: string[],
  ): boolean => {
    copyInto(inAssigned, outAssigned);
    const progress = { isNextLabeled: isFirstLabeled, hasLabel: false };
    const startStep = (stmt: PcalStmt) => {
      needsLabel(stmt);
      progress.hasLabel = true;
      outAssigned.length = 0;
    };
    stmts.forEach((stmt) => {
      if (stmt.lbl !== "") {
        progress.hasLabel = true;
        outAssigned.length = 0;
        if (isInWith) throw new PcalError("Label in `with' statement", stmt);
      }
      if (progress.isNextLabeled) {
        if (isInWith) {
          throw new PcalError(
            "Statement follows `call' or `return' inside a `with' statement.",
            stmt,
          );
        }
        startStep(stmt);
        progress.isNextLabeled = false;
      }
      switch (stmt.kind) {
        case "LabelIf": {
          const thenAssigned: string[] = [];
          const elseAssigned: string[] = [];
          const isThenLabeled = addLabels(
            stmt.unlabThen,
            false,
            isInWith,
            outAssigned,
            thenAssigned,
          );
          progress.isNextLabeled =
            addLabels(stmt.unlabElse, false, isInWith, outAssigned, elseAssigned) || isThenLabeled;
          copyInto(getUnion(thenAssigned, elseAssigned), outAssigned);
          return;
        }
        case "LabelEither": {
          const eitherAssigned: string[] = [];
          stmt.clauses.forEach((clause) => {
            const orAssigned: string[] = [];
            progress.isNextLabeled =
              addLabels(clause.unlabOr, false, isInWith, outAssigned, orAssigned) ||
              progress.isNextLabeled;
            copyInto(getUnion(orAssigned, eitherAssigned), eitherAssigned);
          });
          copyInto(eitherAssigned, outAssigned);
          return;
        }
        case "While":
          if (isInWith) throw new PcalError("`while' inside a `with' statement", stmt);
          startStep(stmt);
          addLabels(stmt.unlabDo, false, false, outAssigned, []);
          progress.isNextLabeled = false;
          return;
        case "With": {
          const withAssigned: string[] = [];
          progress.isNextLabeled = addLabels(
            stmt.Do,
            false,
            true,
            isInWith ? [...inAssigned] : [],
            withAssigned,
          );
          copyInto(withAssigned, outAssigned);
          if (!isInWith && !isDisjoint(inAssigned, outAssigned)) startStep(stmt);
          return;
        }
      }
      // A call or return assigns the stack, and a return or a recursive call the parameters and
      // variables of every procedure. A statement that assigns a variable assigned since the
      // last label starts a new step.
      const isCall = stmt.kind === "Call" || stmt.kind === "CallGoto";
      const isReturn = stmt.kind === "Return" || stmt.kind === "CallReturn";
      const assigned =
        stmt.kind === "Assign"
          ? getUnion(
              [],
              stmt.ass.map((assign) => assign.lhs.var),
            )
          : isCall || isReturn
            ? [
                "stack",
                ...(isReturn || stmt.to === state.currentProcedure
                  ? state.procedures.flatMap((procedure) =>
                      [...procedure.params, ...procedure.decls].map((decl) => decl.var),
                    )
                  : []),
              ]
            : [];
      progress.isNextLabeled = isCall || isReturn || stmt.kind === "Goto";
      if (isDisjoint(outAssigned, assigned)) {
        copyInto(getUnion(outAssigned, assigned), outAssigned);
        return;
      }
      if (isInWith) {
        throw new PcalError(
          stmt.kind === "Assign"
            ? "Second assignment to same variable inside a `with' statement"
            : "Call or return makes second assignment to a variable inside a `with' statement",
          stmt,
        );
      }
      startStep(stmt);
      copyInto(assigned, outAssigned);
    });
    return progress.hasLabel || progress.isNextLabeled;
  };

  const addLabelsToStmtSeq = (stmts: PcalStmt[]) => {
    addLabels(stmts, true, false, [], []);
  };

  // ParseAlgorithm.FixStmtSeq: splits each compound statement's sequences into the statements
  // before their first label and the labeled statements from it on.
  const fixStmtSeq = (stmts: PcalStmt[]) => {
    const split = (sequence: PcalStmt[]) => {
      const index = sequence.findIndex((stmt) => stmt.lbl !== "");
      const unlabeled = index === -1 ? sequence : sequence.slice(0, index);
      fixStmtSeq(unlabeled);
      return { unlabeled, labeled: makeLabeledStmts(index === -1 ? [] : sequence.slice(index)) };
    };
    stmts.forEach((stmt) => {
      switch (stmt.kind) {
        case "LabelIf": {
          const thenParts = split(stmt.unlabThen);
          stmt.unlabThen = thenParts.unlabeled;
          stmt.labThen = thenParts.labeled;
          const elseParts = split(stmt.unlabElse);
          stmt.unlabElse = elseParts.unlabeled;
          stmt.labElse = elseParts.labeled;
          return;
        }
        case "LabelEither":
          stmt.clauses.forEach((clause) => {
            const parts = split(clause.unlabOr);
            clause.unlabOr = parts.unlabeled;
            clause.labOr = parts.labeled;
          });
          return;
        case "While": {
          const parts = split(stmt.unlabDo);
          stmt.unlabDo = parts.unlabeled;
          stmt.labDo = parts.labeled;
        }
      }
    });
  };

  // ParseAlgorithm.InnerMakeLabeledStmtSeq: groups the statements into labeled statements.
  const makeLabeledStmts = (stmts: PcalStmt[]) => {
    const result: PcalLabeledStmt[] = [];
    stmts.forEach((stmt) => {
      if (stmt.lbl === "" && result.length > 0) {
        result[result.length - 1].stmts.push(stmt);
        return;
      }
      if (stmt.lbl === "") {
        throw new PcalBugError("Failure of assertion: Missing Label in MakeLabeledStmtSeq");
      }
      result.push({
        ...createPcalBase(),
        kind: "LabeledStmt",
        col: stmt.col,
        line: stmt.line,
        macroCol: stmt.macroCol,
        macroLine: stmt.macroLine,
        label: stmt.lbl,
        stmts: [stmt],
      });
    });
    result.forEach((labeled) => fixStmtSeq(labeled.stmts));
    return result;
  };

  // ParseAlgorithm.ClassifyStmtSeq for one statement: 0 for one that may have a statement after
  // it in the step, 1 for a call, return or goto, which ends a step, and 2 for one with a labeled
  // statement inside. An if or either without labels inside becomes an If or Either.
  const classifyStmt = (stmts: PcalStmt[], index: number): number => {
    const node = stmts[index];
    switch (node.kind) {
      case "LabelIf": {
        const thenClass = classifyStmtSeq(node.unlabThen);
        node.labThen.forEach((stmt) => classifyStmtSeq(stmt.stmts));
        const elseClass = classifyStmtSeq(node.unlabElse);
        node.labElse.forEach((stmt) => classifyStmtSeq(stmt.stmts));
        const isLabeled = node.labThen.length > 0 || node.labElse.length > 0;
        if (isLabeled || thenClass === 2 || elseClass === 2) return 2;
        stmts[index] = {
          ...createPcalBase(),
          kind: "If",
          test: node.test,
          Then: node.unlabThen,
          Else: node.unlabElse,
        };
        return thenClass + elseClass > 0 ? 1 : 0;
      }
      case "LabelEither": {
        const eitherClass = node.clauses.reduce((result, clause) => {
          const unlabeledClass = Math.max(result, classifyStmtSeq(clause.unlabOr));
          clause.labOr.forEach((stmt) => classifyStmtSeq(stmt.stmts));
          return clause.labOr.length > 0 ? 2 : unlabeledClass;
        }, 0);
        if (eitherClass === 2) return 2;
        stmts[index] = {
          ...createPcalBase(),
          kind: "Either",
          ors: node.clauses.map((clause) => clause.unlabOr),
        };
        return eitherClass;
      }
      case "With": {
        const withClass = classifyStmtSeq(node.Do);
        if (withClass === 2) {
          throw new PcalError(
            `with statement at ${getPcalLocation(node)} contains a labeled statement`,
          );
        }
        return withClass;
      }
      case "While":
        if (index !== 0) {
          throw new PcalBugError(
            "ParseAlgorithm.ClassifyStmtSeq encountered `while' not at beginning of StmtSeq.",
          );
        }
        classifyStmtSeq(node.unlabDo);
        node.labDo.forEach((stmt) => classifyStmtSeq(stmt.stmts));
        return 0;
      case "Call":
        return stmts[index + 1]?.kind === "Return" ? 0 : 1;
      case "Return":
      case "CallReturn":
        if (state.currentProcedure === undefined) {
          throw new PcalError(`return statement not in a procedure at ${getPcalLocation(node)}`);
        }
        return 1;
      case "Goto":
      case "CallGoto":
        return 1;
      case "Assign":
      case "When":
      case "PrintS":
      case "Assert":
      case "Skip":
      case "MacroCall":
        return 0;
      default:
        throw new PcalBugError(
          `ParseAlgorithm.ClassifyStmtSeq encountered the unexpected statement type ${node.kind}`,
        );
    }
  };

  // ParseAlgorithm.ClassifyStmtSeq: a statement that ends a step can only end its sequence.
  const classifyStmtSeq = (stmts: PcalStmt[]): number => {
    for (let index = 0; index < stmts.length; index++) {
      const stmtClass = classifyStmt(stmts, index);
      if (stmtClass === 0) continue;
      if (index === stmts.length - 1) return stmtClass;
      throw new PcalBugError(
        `Translator discovered later than it should have  that\n  Statement at ${getPcalLocation(stmts[index + 1])} must have a label`,
      );
    }
    return 0;
  };

  // ParseAlgorithm.MakeLabeledStmtSeq.
  const makeLabeledStmtSeq = (stmts: PcalStmt[]) => {
    const result = makeLabeledStmts(stmts);
    result.forEach((stmt) => classifyStmtSeq(stmt.stmts));
    return result;
  };

  // ParseAlgorithm.SubstituteInStmt: a copy of a macro's statement with the macro's arguments
  // for its parameters, which records the position of the macro call.
  const substituteInStmt = (
    stmt: PcalStmt,
    args: PcalExpr[],
    names: string[],
    macroLine: number,
    macroCol: number,
  ): PcalStmt => {
    const substitute = (expr: PcalExpr) => {
      const result = clonePcalExpr(expr);
      substitutePcalExpr(result, args, names);
      return result;
    };
    const substituteAll = (stmts: PcalStmt[]) =>
      stmts.map((inner) => substituteInStmt(inner, args, names, macroLine, macroCol));
    const substituteLabeled = (stmts: PcalLabeledStmt[]) =>
      stmts.map((inner): PcalLabeledStmt => ({
        ...createPcalBase(),
        kind: "LabeledStmt",
        label: inner.label,
        stmts: inner.stmts.map((labeled) => substituteInStmt(labeled, args, names, -1, 0)),
      }));
    const base = {
      ...createPcalBase(),
      col: stmt.col,
      line: stmt.line,
      macroCol: macroLine > 0 ? macroCol : stmt.macroCol,
      macroLine: macroLine > 0 ? macroLine : stmt.macroLine,
    };
    switch (stmt.kind) {
      case "Assign":
        return {
          ...base,
          kind: "Assign",
          ass: stmt.ass.map((assign) =>
            substituteInSingleAssign(assign, args, names, macroLine, macroCol),
          ),
        };
      case "If":
        return {
          ...base,
          kind: "If",
          test: substitute(stmt.test),
          Then: substituteAll(stmt.Then),
          Else: substituteAll(stmt.Else),
        };
      case "Either":
        return { ...base, kind: "Either", ors: stmt.ors.map(substituteAll) };
      case "With":
        return {
          ...base,
          kind: "With",
          var: stmt.var,
          isEq: stmt.isEq,
          exp: substitute(stmt.exp),
          Do: substituteAll(stmt.Do),
        };
      case "When":
      case "Assert":
      case "PrintS":
        return { ...base, kind: stmt.kind, exp: substitute(stmt.exp) };
      // SubstituteInStmt doesn't copy a skip's macro position.
      case "Skip":
        return {
          ...base,
          kind: "Skip",
          macroCol: macroLine > 0 ? macroCol : 0,
          macroLine: macroLine > 0 ? macroLine : -1,
        };
      case "While":
        return {
          ...base,
          kind: "While",
          test: substitute(stmt.test),
          unlabDo: substituteAll(stmt.unlabDo),
          labDo: substituteLabeled(stmt.labDo),
        };
      case "LabelIf":
        return {
          ...base,
          kind: "LabelIf",
          test: substitute(stmt.test),
          unlabThen: substituteAll(stmt.unlabThen),
          labThen: substituteLabeled(stmt.labThen),
          unlabElse: substituteAll(stmt.unlabElse),
          labElse: substituteLabeled(stmt.labElse),
        };
      case "LabelEither":
        return {
          ...base,
          kind: "LabelEither",
          clauses: stmt.clauses.map((clause): PcalClause => ({
            ...createPcalBase(),
            kind: "Clause",
            labOr: substituteLabeled(clause.labOr),
            unlabOr: substituteAll(clause.unlabOr),
          })),
        };
      case "Call":
        return {
          ...base,
          kind: "Call",
          to: stmt.to,
          returnTo: stmt.returnTo,
          args: substitutePcalExprs(stmt.args, args, names),
        };
      case "Return":
        return { ...base, kind: "Return", from: stmt.from };
      case "CallReturn":
        return {
          ...base,
          kind: "CallReturn",
          to: stmt.to,
          from: stmt.from,
          args: substitutePcalExprs(stmt.args, args, names),
        };
      case "CallGoto":
        return {
          ...base,
          kind: "CallGoto",
          to: stmt.to,
          after: stmt.after,
          args: substitutePcalExprs(stmt.args, args, names),
        };
      case "Goto":
        return { ...base, kind: "Goto", to: stmt.to };
      default:
        throw new PcalBugError(
          `Found unexpected statement type in macro at${getPcalLocation(stmt)}`,
        );
    }
  };

  // ParseAlgorithm.SubstituteInSingleAssign: a parameter assigned to becomes the variable its
  // argument starts with, and the rest of the argument goes before the subscript.
  const substituteInSingleAssign = (
    assign: PcalSingleAssign,
    args: PcalExpr[],
    names: string[],
    macroLine: number,
    macroCol: number,
  ): PcalSingleAssign => {
    const rhs = clonePcalExpr(assign.rhs);
    substitutePcalExpr(rhs, args, names);
    const lhs: PcalLhs = {
      ...createPcalBase(),
      kind: "Lhs",
      var: assign.lhs.var,
      sub: assign.lhs.sub,
    };
    if (assign.lhs.sub.tokens.length !== 0) {
      lhs.sub = clonePcalExpr(assign.lhs.sub);
      substitutePcalExpr(lhs.sub, args, names);
    }
    const result: PcalSingleAssign = {
      ...createPcalBase(),
      kind: "SingleAssign",
      col: assign.col,
      line: assign.line,
      macroCol: macroLine > 0 ? macroCol : assign.macroCol,
      macroLine: macroLine > 0 ? macroLine : assign.macroLine,
      lhs,
      rhs,
    };
    const index = names.indexOf(lhs.var);
    if (index === -1) return result;
    const argument = args[index];
    const varToken = getPcalTokenAt(argument, { line: 0, item: 0 });
    if (varToken.type !== PCAL_TOKEN.ident) {
      throw new PcalError(
        `Macro expansion substitutes \`${varToken.string}' for assignment variable\n    at ${getPcalLocation(result)}`,
      );
    }
    lhs.var = varToken.string;
    if (stepPcalCoord(argument, { line: 0, item: 0 }, 1) === undefined) return result;
    const copy = clonePcalExpr(argument);
    copy.tokens[0].splice(0, 1);
    normalizePcalExpr(copy);
    if (lhs.sub.tokens.length === 0) lhs.sub = copy;
    else prependPcalExpr(lhs.sub, copy, 0);
    return result;
  };

  // ParseAlgorithm.ExpandMacrosInStmtSeq: replaces each macro call with the macro's body.
  const expandMacrosInStmtSeq = (stmts: PcalStmt[], macros: PcalMacro[]) => {
    const expanded = stmts.flatMap((node) => {
      switch (node.kind) {
        case "LabelIf":
          expandMacrosInStmtSeq(node.unlabThen, macros);
          expandMacrosInStmtSeq(node.unlabElse, macros);
          return [node];
        case "LabelEither":
          node.clauses.forEach((clause) => expandMacrosInStmtSeq(clause.unlabOr, macros));
          return [node];
        case "With":
          expandMacrosInStmtSeq(node.Do, macros);
          return [node];
        case "While":
          expandMacrosInStmtSeq(node.unlabDo, macros);
          return [node];
        case "MacroCall":
          return expandMacroCall(node, macros);
        default:
          return [node];
      }
    });
    stmts.splice(0, stmts.length, ...expanded);
  };

  // ParseAlgorithm.ExpandMacroCall: the last macro of the name wins.
  const expandMacroCall = (call: PcalMacroCall, macros: PcalMacro[]) => {
    const definition = macros.findLast((macro) => macro.name === call.name);
    if (definition === undefined) {
      throw new PcalError(`Macro ${call.name} undefined,\n    at ${getPcalLocation(call)}`);
    }
    if (definition.params.length !== call.args.length) {
      throw new PcalError(
        `Macro ${call.name} called with wrong number of arguments at \n    ${getPcalLocation(call)}`,
      );
    }
    const result = definition.body.map((stmt) =>
      substituteInStmt(stmt, call.args, definition.params, call.line, call.col),
    );
    if (result.length > 0) result[0].lbl = call.lbl;
    return result;
  };

  const checkForDuplicateMacros = (macros: PcalMacro[]) => {
    macros.forEach((macro, index) => {
      if (macros.slice(index + 1).some((other) => other.name === macro.name)) {
        throw new PcalError(`Multiple definitions of macro name \`${macro.name}'`);
      }
    });
  };

  // ParseAlgorithm.checkBody: a body that is a single labeled "while TRUE" without labels inside
  // lets the translation omit pc.
  const checkBody = (body: PcalStmt[]) => {
    if (body.length === 0) return;
    const clear = () => {
      state.omitPC = false;
      state.omitStutteringWhenDone = false;
    };
    const labeled = body[0];
    if (body.length > 1 || labeled.kind !== "LabeledStmt") return clear();
    if (labeled.stmts.length === 0) return;
    const whileStmt = labeled.stmts[0];
    if (labeled.stmts.length > 1 || whileStmt.kind !== "While") return clear();
    const tokens = whileStmt.test.tokens;
    if (tokens.length !== 1 || tokens[0].length !== 1 || tokens[0][0].string !== "TRUE") {
      return clear();
    }
    if (whileStmt.labDo.length > 0) state.omitPC = false;
    const hasLabeled = whileStmt.unlabDo.some((stmt) =>
      ["LabelIf", "LabelEither", "LabeledStmt"].includes(stmt.kind),
    );
    if (hasLabeled) state.omitPC = false;
  };

  // ParseAlgorithm.AddedMessagesError.
  const throwAddedLabels = (): never => {
    const header =
      state.addedLabels.length > 1
        ? "Missing labels at the following locations:"
        : "Missing label at the following location:";
    throw new PcalError([header, ...state.addedLabelsLocs].join("\n     "));
  };

  // ParseAlgorithm.ReportLabels.
  const reportLabels = () => {
    if (!params.reportLabelsFlag) {
      session.log("Labels added.");
      return;
    }
    session.log(
      state.addedLabels.length > 1
        ? "The following labels were added:"
        : "The following label was added:",
    );
    state.addedLabels.forEach((label, index) =>
      session.log(`  ${label} at ${state.addedLabelsLocs[index]}`),
    );
  };

  const parse = (): PcalAlgorithm => {
    if (isFairAlgorithm) {
      if (getAlgToken() !== "algorithm") parsingError("`--fair' not followed by `algorithm'");
      params.fairAlgorithm = true;
    }
    const name = getAlgToken();
    state.cSyntax = peekAtAlgToken(1) === "{";
    state.pSyntax = !state.cSyntax;
    if (state.cSyntax) mustGobbleThis("{");
    const decls =
      peekAtAlgToken(1) === "variable" || peekAtAlgToken(1) === "variables" ? getVarDecls() : [];
    const defs = { value: createPcalExpr() };
    if (peekAtAlgToken(1) === "define") {
      mustGobbleThis("define");
      if (state.cSyntax) gobbleThis("{");
      defs.value = getExpr(true);
      gobbleEndOrRightBrace("define");
      gobbleThis(";");
    }
    const macros: PcalMacro[] = [];
    while (peekAtAlgToken(1) === "macro") macros.push(getMacro(macros));
    while (peekAtAlgToken(1) === "procedure") {
      state.procedures.push(getProcedure());
      state.omitPC = false;
    }
    const isMultiprocess =
      (peekAtAlgToken(1) === "fair" &&
        (peekAtAlgToken(2) === "process" ||
          (peekAtAlgToken(2) === "+" && peekAtAlgToken(3) === "process"))) ||
      peekAtAlgToken(1) === "process";
    if (isMultiprocess) {
      const procs: PcalProcess[] = [];
      while (peekAtAlgToken(1) === "fair" || peekAtAlgToken(1) === "process") {
        const isFair = peekAtAlgToken(1) === "fair";
        if (isFair) mustGobbleThis("fair");
        const isStronglyFair = isFair && peekAtAlgToken(1) === "+";
        if (isStronglyFair) mustGobbleThis("+");
        const fairness =
          isStronglyFair || (!isFair && params.fairnessOption === "sf")
            ? 2
            : isFair || params.fairnessOption === "wf"
              ? 1
              : 0;
        procs.push({ ...getProcess(), fairness });
      }
      gobbleEndOrRightBrace("algorithm");
      checkForDuplicateMacros(macros);
      const omitsStutteringWhenDone = procs.map((proc) => {
        expandMacrosInStmtSeq(proc.body, macros);
        addLabelsToStmtSeq(proc.body);
        proc.body = makeLabeledStmtSeq(proc.body);
        state.omitStutteringWhenDone = true;
        checkBody(proc.body);
        return state.omitStutteringWhenDone;
      });
      state.omitStutteringWhenDone = omitsStutteringWhenDone.includes(true);
      state.procedures.forEach((procedure) => {
        state.currentProcedure = procedure.name;
        expandMacrosInStmtSeq(procedure.body, macros);
        addLabelsToStmtSeq(procedure.body);
        procedure.body = makeLabeledStmtSeq(procedure.body);
      });
      if (state.addedLabels.length > 0) {
        if (!params.labelFlag) throwAddedLabels();
        reportLabels();
      }
      if (state.gotoDoneUsed) {
        state.omitPC = false;
        state.omitStutteringWhenDone = false;
      }
      if (state.gotoUsed) state.omitPC = false;
      return {
        ...createPcalBase(),
        kind: "Multiprocess",
        name,
        decls,
        defs: defs.value,
        macros,
        prcds: state.procedures,
        procs,
      };
    }
    if (params.inputVersionNumber === 1500 && peekAtAlgToken(1) === "fair") {
      gobbleThis("fair");
      if (peekAtAlgToken(1) === "+") gobbleThis("+");
      params.fairnessOption = "wf";
    }
    if (isFairAlgorithm) {
      if (!["", "wf", "wfNext"].includes(params.fairnessOption)) {
        session.log(`Warning: Option \`${params.fairnessOption}' specified for --fair algorithm.`);
      }
      params.fairnessOption = "wf";
    }
    gobbleBeginOrLeftBrace();
    const body = getStmtSeq();
    checkForDuplicateMacros(macros);
    expandMacrosInStmtSeq(body, macros);
    state.procedures.forEach((procedure) => {
      state.currentProcedure = procedure.name;
      expandMacrosInStmtSeq(procedure.body, macros);
      addLabelsToStmtSeq(procedure.body);
      procedure.body = makeLabeledStmtSeq(procedure.body);
    });
    // The first brace ends the body that gobbleBeginOrLeftBrace began.
    if (state.cSyntax) gobbleThis("}");
    gobbleEndOrRightBrace("algorithm");
    addLabelsToStmtSeq(body);
    const labeledBody = makeLabeledStmtSeq(body);
    if (state.addedLabels.length > 0) {
      if (state.hasLabel && !params.labelFlag) throwAddedLabels();
      reportLabels();
    }
    if (state.gotoUsed) state.omitPC = false;
    if (!state.gotoDoneUsed) checkBody(labeledBody);
    if (state.gotoDoneUsed) {
      state.omitPC = false;
      state.omitStutteringWhenDone = false;
    }
    return {
      ...createPcalBase(),
      kind: "Uniprocess",
      name,
      decls,
      defs: defs.value,
      macros,
      prcds: state.procedures,
      body: labeledBody,
    };
  };

  // HACK: ParseAlgorithm.getAlgorithm turns any RuntimeException, such as an index out of bounds
  // on input it doesn't expect, into a parsing error at the last token.
  try {
    const ast = parse();
    return {
      ast,
      omitPC: state.omitPC,
      omitStutteringWhenDone: state.omitStutteringWhenDone,
      hasDefaultInitialization: state.hasDefaultInitialization,
    };
  } catch (error) {
    if (!(error instanceof PcalRuntimeError)) throw error;
    return parsingError("Unknown error at or before");
  }
};
