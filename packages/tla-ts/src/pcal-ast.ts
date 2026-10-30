import { PcalBugError, PcalError, PcalRuntimeError } from "./errors";

// TLAToken's types.
export const PCAL_TOKEN = { builtin: 1, number: 2, string: 3, ident: 4, added: 5 } as const;

export interface PcalToken {
  string: string;
  column: number;
  type: number;
}

// TLAExpr: the tokens of an expression, line by line, and for each line the token of an earlier
// line it is aligned under, with that token's column when the expression was normalized.
export interface PcalExpr {
  tokens: PcalToken[][];
  anchorTokens: (PcalToken | undefined)[] | undefined;
  anchorTokCol: number[] | undefined;
}

// IntPair, as the "Java coordinates" of a token in an expression.
export interface PcalCoord {
  line: number;
  item: number;
}

// PcalParams: the translator's options, which the Java keeps in static fields that SANY never
// resets, so options one module sets carry over to the modules SANY validates after it.
export interface PcalParams {
  labelFlag: boolean;
  reportLabelsFlag: boolean;
  labelRoot: string;
  fairnessOption: string;
  fairAlgorithm: boolean;
  checkTermination: boolean;
  noOld: boolean;
  nocfg: boolean;
  noDoneDisjunct: boolean;
  specOption: boolean;
  myspecOption: boolean;
  specFile: string;
  optionsInFile: boolean;
  inputVersionNumber: number;
}

// PcalParams.versionWeight.
export const PCAL_VERSION_WEIGHT = 1903;

export const createPcalParams = (): PcalParams => ({
  labelFlag: false,
  reportLabelsFlag: false,
  labelRoot: "Lbl_",
  fairnessOption: "",
  fairAlgorithm: false,
  checkTermination: false,
  noOld: false,
  nocfg: false,
  noDoneDisjunct: false,
  specOption: false,
  myspecOption: false,
  specFile: "",
  optionsInFile: false,
  inputVersionNumber: PCAL_VERSION_WEIGHT,
});

// PcalParams.VersionToNumber: "1.5" is 1500, and -1 means a malformed version.
export const getPcalVersionNumber = (text: string) => {
  const state = { result: 0, digitsAfterDecimal: 0, isAfterDecimal: false };
  for (const char of text) {
    if (char === ".") {
      state.isAfterDecimal = true;
      continue;
    }
    if (char < "0" || char > "9") return -1;
    state.result = 10 * state.result + Number(char);
    if (state.isAfterDecimal) state.digitsAfterDecimal += 1;
    if (state.digitsAfterDecimal > 3) return -1;
  }
  return state.result * 10 ** Math.max(0, 3 - state.digitsAfterDecimal);
};

interface PcalBase {
  col: number;
  line: number;
  macroCol: number;
  macroLine: number;
  lbl: string;
}

export interface PcalUniprocess extends PcalBase {
  kind: "Uniprocess";
  name: string;
  decls: PcalVarDecl[];
  defs: PcalExpr;
  macros: PcalMacro[];
  prcds: PcalProcedure[];
  body: PcalStmt[];
}

export interface PcalMultiprocess extends PcalBase {
  kind: "Multiprocess";
  name: string;
  decls: PcalVarDecl[];
  defs: PcalExpr;
  macros: PcalMacro[];
  prcds: PcalProcedure[];
  procs: PcalProcess[];
}

export interface PcalProcedure extends PcalBase {
  kind: "Procedure";
  name: string;
  minusLabels: string[];
  plusLabels: string[];
  proceduresCalled: string[];
  params: PcalPVarDecl[];
  decls: PcalPVarDecl[];
  body: PcalStmt[];
}

// AST.UNFAIR_PROC, WF_PROC and SF_PROC index FairnessString.
export const PCAL_FAIRNESS = ["unfair", "wf", "sf"];

export interface PcalProcess extends PcalBase {
  kind: "Process";
  name: string;
  fairness: number;
  minusLabels: string[];
  plusLabels: string[];
  proceduresCalled: string[];
  isEq: boolean;
  id: PcalExpr;
  decls: PcalVarDecl[];
  body: PcalStmt[];
}

export interface PcalVarDecl extends PcalBase {
  kind: "VarDecl";
  var: string;
  isEq: boolean;
  val: PcalExpr;
}

export interface PcalPVarDecl extends PcalBase {
  kind: "PVarDecl";
  var: string;
  val: PcalExpr;
}

export interface PcalLabeledStmt extends PcalBase {
  kind: "LabeledStmt";
  label: string;
  stmts: PcalStmt[];
}

export interface PcalWhile extends PcalBase {
  kind: "While";
  test: PcalExpr;
  unlabDo: PcalStmt[];
  labDo: PcalLabeledStmt[];
}

export interface PcalAssign extends PcalBase {
  kind: "Assign";
  ass: PcalSingleAssign[];
}

export interface PcalSingleAssign extends PcalBase {
  kind: "SingleAssign";
  lhs: PcalLhs;
  rhs: PcalExpr;
}

export interface PcalLhs extends PcalBase {
  kind: "Lhs";
  var: string;
  sub: PcalExpr;
}

export interface PcalIf extends PcalBase {
  kind: "If";
  test: PcalExpr;
  Then: PcalStmt[];
  Else: PcalStmt[];
}

export interface PcalEither extends PcalBase {
  kind: "Either";
  ors: PcalStmt[][];
}

export interface PcalWith extends PcalBase {
  kind: "With";
  var: string;
  isEq: boolean;
  exp: PcalExpr;
  Do: PcalStmt[];
}

export interface PcalWhen extends PcalBase {
  kind: "When";
  exp: PcalExpr;
}

export interface PcalPrintS extends PcalBase {
  kind: "PrintS";
  exp: PcalExpr;
}

export interface PcalAssert extends PcalBase {
  kind: "Assert";
  exp: PcalExpr;
}

export interface PcalSkip extends PcalBase {
  kind: "Skip";
}

export interface PcalLabelIf extends PcalBase {
  kind: "LabelIf";
  test: PcalExpr;
  unlabThen: PcalStmt[];
  labThen: PcalLabeledStmt[];
  unlabElse: PcalStmt[];
  labElse: PcalLabeledStmt[];
}

export interface PcalLabelEither extends PcalBase {
  kind: "LabelEither";
  clauses: PcalClause[];
}

export interface PcalClause extends PcalBase {
  kind: "Clause";
  unlabOr: PcalStmt[];
  labOr: PcalLabeledStmt[];
}

export interface PcalCall extends PcalBase {
  kind: "Call";
  returnTo: string;
  to: string;
  args: PcalExpr[];
}

// A Return or CallReturn outside a procedure has a null from, which Java prints as "null".
export interface PcalReturn extends PcalBase {
  kind: "Return";
  from: string | undefined;
}

export interface PcalCallReturn extends PcalBase {
  kind: "CallReturn";
  from: string | undefined;
  to: string;
  args: PcalExpr[];
}

export interface PcalCallGoto extends PcalBase {
  kind: "CallGoto";
  after: string;
  to: string;
  args: PcalExpr[];
}

export interface PcalGoto extends PcalBase {
  kind: "Goto";
  to: string;
}

export interface PcalMacro extends PcalBase {
  kind: "Macro";
  name: string;
  params: string[];
  body: PcalStmt[];
}

export interface PcalMacroCall extends PcalBase {
  kind: "MacroCall";
  name: string;
  args: PcalExpr[];
}

export type PcalStmt =
  | PcalLabeledStmt
  | PcalWhile
  | PcalAssign
  | PcalIf
  | PcalEither
  | PcalWith
  | PcalWhen
  | PcalPrintS
  | PcalAssert
  | PcalSkip
  | PcalLabelIf
  | PcalLabelEither
  | PcalCall
  | PcalReturn
  | PcalCallReturn
  | PcalCallGoto
  | PcalGoto
  | PcalMacroCall;

export type PcalAlgorithm = PcalUniprocess | PcalMultiprocess;

export type PcalNode =
  | PcalStmt
  | PcalAlgorithm
  | PcalProcedure
  | PcalProcess
  | PcalVarDecl
  | PcalPVarDecl
  | PcalSingleAssign
  | PcalLhs
  | PcalClause
  | PcalMacro;

// The fields every AST object starts with.
export const createPcalBase = (): PcalBase => ({
  col: 0,
  line: 0,
  macroCol: 0,
  macroLine: -1,
  lbl: "",
});

// AST.location.
export const getPcalLocation = (node: PcalBase) =>
  node.macroLine < 0
    ? `line ${node.line}, column ${node.col}`
    : `line ${node.line}, column ${node.col} of macro called at line ${node.macroLine}, column ${node.macroCol}`;

// A Java cast of a statement to AST.LabeledStmt.
export const toLabeledStmt = (node: PcalStmt) => {
  if (node.kind !== "LabeledStmt") throw new PcalRuntimeError(`ClassCastException: ${node.kind}`);
  return node;
};

// Vector.elementAt, which throws for an index out of bounds.
export const getElement = <T>(vector: T[], index: number) => {
  if (index < 0 || index >= vector.length) {
    throw new PcalRuntimeError(`ArrayIndexOutOfBoundsException: ${index}`);
  }
  return vector[index];
};

export const createPcalToken = (string: string, column: number, type: number): PcalToken => ({
  string,
  column,
  type,
});

// TLAToken.getWidth: a string token's width counts its quotes.
export const getPcalTokenWidth = (token: PcalToken) =>
  token.type === PCAL_TOKEN.string ? token.string.length + 2 : token.string.length;

export const createPcalExpr = (tokens: PcalToken[][] = []): PcalExpr => ({
  tokens,
  anchorTokens: undefined,
  anchorTokCol: undefined,
});

// TLAExpr.normalize: drops empty first and last lines, shifts the tokens left as far as they go,
// and records the token each line is aligned under.
export const normalizePcalExpr = (expr: PcalExpr) => {
  while (expr.tokens.length > 0 && expr.tokens[0].length === 0) expr.tokens.shift();
  while (expr.tokens.length > 0 && expr.tokens[expr.tokens.length - 1].length === 0) {
    expr.tokens.pop();
  }
  const minColumn = Math.min(
    999999,
    ...expr.tokens.filter((line) => line.length > 0).map((line) => line[0].column),
  );
  expr.tokens.forEach((line) =>
    line.forEach((token) => {
      token.column -= minColumn;
    }),
  );
  const anchorTokens: (PcalToken | undefined)[] = [];
  const anchorTokCol: number[] = [];
  expr.tokens.forEach((line, index) => {
    anchorTokCol.push(0);
    anchorTokens.push(undefined);
    if (line.length === 0) return;
    const firstColumn = line[0].column;
    const anchorLine = expr.tokens
      .slice(0, index)
      .findLast((candidate) => candidate.length > 0 && candidate[0].column <= firstColumn);
    if (anchorLine === undefined) return;
    const stop = anchorLine.findIndex((token, item) => item > 0 && token.column > firstColumn);
    const anchor = anchorLine[(stop === -1 ? anchorLine.length : stop) - 1];
    anchorTokens[index] = anchor;
    anchorTokCol[index] = anchor.column;
  });
  expr.anchorTokens = anchorTokens;
  expr.anchorTokCol = anchorTokCol;
};

// TLAExpr.renormalize: shifts each line right by as much as its anchor token has moved.
const renormalizePcalExpr = (expr: PcalExpr) => {
  const anchorTokens = expr.anchorTokens;
  const anchorTokCol = expr.anchorTokCol;
  if (anchorTokens === undefined || anchorTokCol === undefined) {
    throw new PcalRuntimeError("NullPointerException: TLAExpr.renormalize");
  }
  expr.tokens.forEach((line, index) => {
    const anchor = anchorTokens[index];
    if (anchor === undefined) return;
    const shift = anchor.column - anchorTokCol[index];
    anchorTokCol[index] = anchor.column;
    if (shift < 0) throw new PcalError("TLAExpr.renormalize() found anchor has moved to left.");
    line.forEach((token) => {
      token.column += shift;
    });
  });
};

export const clonePcalExpr = (expr: PcalExpr) => {
  const result = createPcalExpr(
    expr.tokens.map((line) =>
      line.map((token) => createPcalToken(token.string, token.column, token.type)),
    ),
  );
  normalizePcalExpr(result);
  return result;
};

// TLAExpr.prepend: puts prefix in front of the expression, spaces columns before its first token.
export const prependPcalExpr = (expr: PcalExpr, prefix: PcalExpr, spaces: number) => {
  const prefixLines = prefix.tokens.length;
  expr.tokens.splice(0, 0, ...prefix.tokens.slice(0, prefixLines - 1));
  const prefixLine = prefix.tokens[prefixLines - 1];
  const exprLine = expr.tokens[prefixLines - 1];
  const last = prefixLine[prefixLine.length - 1];
  const shift = last.column + getPcalTokenWidth(last) + spaces;
  exprLine.forEach((token) => {
    token.column += shift;
  });
  exprLine.splice(0, 0, ...prefixLine);
  const anchorTokens = [...(prefix.anchorTokens ?? [])];
  const anchorTokCol = [...(prefix.anchorTokCol ?? [])];
  for (let index = prefixLines; index < expr.tokens.length; index++) {
    anchorTokens.push(expr.anchorTokens?.[index - prefixLines + 1]);
    anchorTokCol.push(expr.anchorTokCol?.[index - prefixLines + 1] ?? 0);
  }
  expr.anchorTokens = anchorTokens;
  expr.anchorTokCol = anchorTokCol;
  renormalizePcalExpr(expr);
};

const isEmptyPcalExpr = (expr: PcalExpr) => expr.tokens.length === 0;

export const isOneTokenPcalExpr = (expr: PcalExpr) =>
  expr.tokens.length === 1 && expr.tokens[0].length === 1;

export const getPcalTokenAt = (expr: PcalExpr, coord: PcalCoord) =>
  getElement(getElement(expr.tokens, coord.line), coord.item);

// TLAExpr.stepCoord: the coordinates incr tokens after coord, or undefined past the end.
export const stepPcalCoord = (expr: PcalExpr, coord: PcalCoord, steps: number) => {
  if (expr.tokens.length <= coord.line) {
    throw new PcalBugError("TLAExpr.StepCoord called with line too big");
  }
  if (expr.tokens[coord.line].length <= coord.item) {
    throw new PcalBugError("TLAExpr.StepCoord called with col too big");
  }
  const result = { line: coord.line, item: coord.item };
  for (let step = 0; step < steps; step++) {
    result.item += 1;
    if (expr.tokens[result.line].length === result.item) {
      result.item = 0;
      result.line += 1;
      while (result.line < expr.tokens.length && expr.tokens[result.line].length === 0) {
        result.line += 1;
      }
      if (result.line === expr.tokens.length) return undefined;
    }
  }
  return result;
};

// TLAExpr.findNextInstanceIn: the next token id at or after start that is not a record field
// name, such as the a in r.a, [a |-> 1] or [a : S].
const findNextInstance = (expr: PcalExpr, id: string, start: PcalCoord) => {
  for (let coord = isEmptyPcalExpr(expr) ? undefined : { ...start }; coord !== undefined;) {
    const token = getPcalTokenAt(expr, coord);
    const isString = token.type === PCAL_TOKEN.string;
    // The id is an identifier, so a token that is the id is none of the tokens skipped below.
    if (!isString && token.string === id) return coord;
    const afterNext =
      !isString && (token.string === "[" || token.string === ",")
        ? stepPcalCoord(expr, coord, 2)
        : undefined;
    const fieldEnd = afterNext === undefined ? undefined : getPcalTokenAt(expr, afterNext);
    const isFieldName =
      fieldEnd !== undefined &&
      fieldEnd.type !== PCAL_TOKEN.string &&
      [":", "|->", "↦"].includes(fieldEnd.string);
    const steps = isString ? 1 : token.string === "." ? 2 : isFieldName ? 3 : 1;
    coord = stepPcalCoord(expr, coord, steps);
  }
  return undefined;
};

// TLAExpr.substituteAt: replaces the token at coord with a copy of replacement, parenthesized when
// isParenthesized and replacement has more than one token, and returns the coordinates of the
// token after it.
const substituteAt = (
  expr: PcalExpr,
  replacement: PcalExpr,
  coord: PcalCoord,
  isParenthesized: boolean,
) => {
  const token = getPcalTokenAt(expr, coord);
  if (isOneTokenPcalExpr(expr)) {
    const cloned = clonePcalExpr(replacement);
    expr.tokens = cloned.tokens;
    expr.anchorTokens = cloned.anchorTokens;
    expr.anchorTokCol = cloned.anchorTokCol;
    return undefined;
  }
  const tokenLine = expr.tokens[coord.line];
  const spaces =
    coord.item + 1 < tokenLine.length
      ? tokenLine[coord.item + 1].column - (token.column + getPcalTokenWidth(token))
      : 0;
  const restOfLine = tokenLine.splice(coord.item + 1);
  // The line the replacement's tokens go on, and how far right they move.
  const cursor = {
    lineIndex: coord.line,
    indent: (isParenthesized ? 1 : 0) + token.column,
    isInserting: !isParenthesized,
  };
  const getLine = () => expr.tokens[cursor.lineIndex];
  if (isOneTokenPcalExpr(replacement)) {
    const replacementToken = replacement.tokens[0][0];
    token.string = replacementToken.string;
    token.type = replacementToken.type;
  } else {
    if (isParenthesized) {
      token.string = "(";
      token.type = PCAL_TOKEN.builtin;
    }
    const newExpr = clonePcalExpr(replacement);
    newExpr.tokens.forEach((replacementLine, index) => {
      replacementLine.forEach((nextToken) => {
        nextToken.column += cursor.indent;
        if (!cursor.isInserting) {
          getLine().push(nextToken);
          return;
        }
        token.string = nextToken.string;
        token.type = nextToken.type;
        cursor.isInserting = false;
      });
      if (index + 1 >= newExpr.tokens.length) return;
      cursor.indent = 0;
      cursor.lineIndex += 1;
      const currentLine = cursor.lineIndex;
      expr.tokens.splice(currentLine, 0, []);
      const oldAnchors = expr.anchorTokens ?? [];
      const oldColumns = expr.anchorTokCol ?? [];
      expr.anchorTokens = expr.tokens.map((_, item) =>
        item < currentLine
          ? oldAnchors[item]
          : item === currentLine
            ? newExpr.anchorTokens?.[index + 1]
            : oldAnchors[item - 1],
      );
      expr.anchorTokCol = expr.tokens.map((_, item) =>
        item < currentLine
          ? oldColumns[item]
          : item === currentLine
            ? (newExpr.anchorTokCol?.[index + 1] ?? 0)
            : oldColumns[item - 1],
      );
    });
    if (isParenthesized) {
      const last = getLine()[getLine().length - 1];
      getLine().push(
        createPcalToken(")", last.column + getPcalTokenWidth(last), PCAL_TOKEN.builtin),
      );
    }
  }
  const line = getLine();
  const result = { line: cursor.lineIndex, item: line.length - 1 };
  if (restOfLine.length > 0) {
    const previous = line[line.length - 1];
    const shift = previous.column + getPcalTokenWidth(previous) + spaces - restOfLine[0].column;
    restOfLine.forEach((oldToken) => {
      oldToken.column += shift;
      line.push(oldToken);
    });
  }
  renormalizePcalExpr(expr);
  return stepPcalCoord(expr, result, 1);
};

// TLAExpr.substituteForAll: replaces each instance of names[i] with exprs[i], in the order the
// instances appear.
export const substitutePcalExpr = (
  expr: PcalExpr,
  exprs: PcalExpr[],
  names: string[],
  isParenthesized = true,
) => {
  const next = names.map((name) => findNextInstance(expr, name, { line: 0, item: 0 }));
  for (;;) {
    const nearest = next.reduce<{ index: number; position: PcalCoord } | undefined>(
      (best, position, index) =>
        position !== undefined &&
        (best === undefined ||
          position.line < best.position.line ||
          (position.line === best.position.line && position.item < best.position.item))
          ? { index, position }
          : best,
      undefined,
    );
    if (nearest === undefined) return;
    const nextIndex = nearest.index;
    const nextPosition = nearest.position;
    const afterNext = stepPcalCoord(expr, nextPosition, 1);
    const newPosition = substituteAt(expr, exprs[nextIndex], nextPosition, isParenthesized);
    next[nextIndex] =
      newPosition === undefined ? undefined : findNextInstance(expr, names[nextIndex], newPosition);
    next.forEach((position, index) => {
      if (index === nextIndex || position === undefined || newPosition === undefined) return;
      // HACK: TLAExpr.substituteForAll dereferences afterNextPos without checking for null, which
      // throws a NullPointerException when the substituted token ends the expression.
      if (afterNext === undefined) {
        throw new PcalRuntimeError("NullPointerException: TLAExpr.substituteForAll");
      }
      if (position.line === nextPosition.line) position.item += newPosition.item - afterNext.item;
      position.line += newPosition.line - afterNext.line;
    });
  }
};

// TLAExpr.SeqSubstituteForAll.
export const substitutePcalExprs = (exprs: PcalExpr[], args: PcalExpr[], params: string[]) =>
  exprs.map((expr) => {
    const result = clonePcalExpr(expr);
    substitutePcalExpr(result, args, params);
    return result;
  });

// TLAExpr.toString.
export const formatPcalExpr = (expr: PcalExpr) => {
  const tokens = expr.tokens.map((line) =>
    line.map((token) => {
      if (token.type === PCAL_TOKEN.string) return `"\\"", "${token.string}", "\\""`;
      if (token.string === "\\/") return `"(col${token.column}) \\\\/"`;
      if (token.string.startsWith("\\")) return `"\\${token.string}"`;
      if (token.string === "/\\") return `"(col${token.column}) /\\\\"`;
      return `"${token.string}"`;
    }),
  );
  const text = tokens
    .map((line, index) => {
      const isAfterToken = tokens.slice(0, index).some((previous) => previous.length > 0);
      return line.map((token, item) => (isAfterToken || item > 0 ? `, ${token}` : token)).join("");
    })
    .join("\n");
  return `<< ${text} >>`;
};

// AST.toString: the TLA+ record that PlusCal.tla uses for the node. Indent, EndIndent and NewLine
// keep a stack of indentation columns as the Java concatenates the record's text left to right.
export const formatPcalNode = (node: PcalNode, inputVersionNumber: number) => {
  const columns = [0];
  const depth = { value: 0 };
  const indent = (text: string) => {
    columns[depth.value + 1] = columns[depth.value] + text.length;
    depth.value += 1;
    return text;
  };
  const endIndent = () => {
    depth.value -= 1;
    return "";
  };
  const newLine = () => `\n${" ".repeat(columns[depth.value])}`;
  const isOldVersion = inputVersionNumber < 1500;
  // The separators' new lines take the indentation the elements before them leave.
  const formatSeq = (vector: (PcalNode | PcalExpr)[]) =>
    `${indent("<<")}${vector
      .map(
        (element, index) =>
          `${index > 0 ? `, ${newLine()}` : ""}${"kind" in element ? format(element) : formatPcalExpr(element)}`,
      )
      .join("")}>>${endIndent()}`;
  const formatQuotedSeq = (vector: string[]) =>
    `${indent("<<")}${vector.map((element) => `"${element}"`).join(", ")}>>${endIndent()}`;
  const formatSeqOfSeqs = (vectors: PcalStmt[][]) =>
    `${indent("<< ")}${vectors
      .map((vector, index) => `${index > 0 ? `, ${newLine()}` : ""}${formatSeq(vector)}`)
      .join("")} >>${endIndent()}`;
  const formatEqOrIn = (isEq: boolean) => (isEq ? '"="' : '"\\\\in"');
  const format = (node: PcalNode): string => {
    switch (node.kind) {
      case "Uniprocess":
        return `${indent("")}[type     |-> "uniprocess", ${newLine()} name  |-> "${node.name}", ${newLine()}${indent(" decls  |-> ")}${formatSeq(node.decls)},${endIndent()}${newLine()}${indent(" defs   |-> ")}${formatPcalExpr(node.defs)},${endIndent()}${newLine()}${indent(" prcds  |-> ")}${formatSeq(node.prcds)},${endIndent()}${newLine()}${indent(" body  |-> ")}${formatSeq(node.body)}]${endIndent()}${endIndent()}`;
      case "Multiprocess":
        return `${indent("")}[type    |-> "multiprocess", ${newLine()} name  |-> "${node.name}", ${newLine()}${indent(" decls |-> ")}${formatSeq(node.decls)},${endIndent()}${newLine()}${indent(" defs  |-> ")}${formatPcalExpr(node.defs)},${endIndent()}${newLine()}${indent(" prcds |-> ")}${formatSeq(node.prcds)},${endIndent()}${newLine()}${indent(" procs |-> ")}${formatSeq(node.procs)}]${endIndent()}${endIndent()}`;
      case "Procedure":
        return isOldVersion
          ? `${indent("")}[name   |-> "${node.name}", ${newLine()}${indent(" params |-> ")}${formatSeq(node.params)},${endIndent()}${newLine()}${indent(" decls  |-> ")}${formatSeq(node.decls)},${endIndent()}${newLine()}${indent(" body   |-> ")}${formatSeq(node.body)}]${endIndent()}${endIndent()}`
          : `${indent("")}[name   |-> "${node.name}", ${newLine()}minusLabels |-> ${formatQuotedSeq(node.minusLabels)}, plusLabels |->${formatQuotedSeq(node.plusLabels)}, proceduresCalled |->${formatQuotedSeq(node.proceduresCalled)},${newLine()}${indent(" params |-> ")}${formatSeq(node.params)},${endIndent()}${newLine()}${indent(" decls  |-> ")}${formatSeq(node.decls)},${endIndent()}${newLine()}${indent(" body   |-> ")}${formatSeq(node.body)}]${endIndent()}${endIndent()}`;
      case "Process":
        return isOldVersion
          ? `${indent("")}[name   |-> "${node.name}", ${newLine()} eqOrIn |-> ${formatEqOrIn(node.isEq)},${newLine()} id     |-> ${formatPcalExpr(node.id)},${newLine()}${indent(" decls  |-> ")}${formatSeq(node.decls)},${endIndent()}${newLine()}${indent(" body   |-> ")}${formatSeq(node.body)}]${endIndent()}${endIndent()}`
          : `${indent("")}[name   |-> "${node.name}",${newLine()} fairness |-> "${PCAL_FAIRNESS[node.fairness]}", minusLabels |-> ${formatQuotedSeq(node.minusLabels)}, plusLabels |->${formatQuotedSeq(node.plusLabels)}, proceduresCalled |->${formatQuotedSeq(node.proceduresCalled)},${newLine()} eqOrIn |-> ${formatEqOrIn(node.isEq)},${newLine()} id     |-> ${formatPcalExpr(node.id)},${newLine()}${indent(" decls  |-> ")}${formatSeq(node.decls)},${endIndent()}${newLine()}${indent(" body   |-> ")}${formatSeq(node.body)}]${endIndent()}${endIndent()}`;
      case "VarDecl":
        return `${indent("")}[var |-> "${node.var}", eqOrIn |-> ${formatEqOrIn(node.isEq)}, val |-> ${formatPcalExpr(node.val)}]${endIndent()}`;
      case "PVarDecl":
        return `${indent("")}[var |-> "${node.var}", eqOrIn |-> "=", val |-> ${formatPcalExpr(node.val)}]${endIndent()}`;
      case "LabeledStmt":
        return `${indent("")}[label |-> "${node.label}",${newLine()}${indent(" stmts |-> ")}${formatSeq(node.stmts)}]${endIndent()}${endIndent()}`;
      case "While":
        return `${indent("")}[type    |-> "while", ${newLine()} test    |-> ${formatPcalExpr(node.test)},${newLine()}${indent(" labDo   |-> ")}${formatSeq(node.labDo)},${endIndent()}${newLine()}${indent(" unlabDo |-> ")}${formatSeq(node.unlabDo)}]${endIndent()}${endIndent()}`;
      case "Assign":
        return `${indent("")}[type |-> "assignment",${newLine()}${indent(" ass  |-> ")}${formatSeq(node.ass)}]${endIndent()}${endIndent()}`;
      case "SingleAssign":
        return `${indent("")}[lhs |-> ${format(node.lhs)},${newLine()} rhs |-> ${formatPcalExpr(node.rhs)}]${endIndent()}`;
      case "Lhs":
        return `[var |-> "${node.var}", sub |-> ${formatPcalExpr(node.sub)}]`;
      case "If":
        return `${indent("")}[type    |-> "if", ${newLine()} test    |-> ${formatPcalExpr(node.test)},${newLine()}${indent(" then |-> ")}${formatSeq(node.Then)},${endIndent()}${newLine()}${indent(" else |-> ")}${formatSeq(node.Else)}]${endIndent()}${endIndent()}`;
      case "Either":
        return `${indent("")}[type |-> "either", ${newLine()}${indent(" ors  |-> ")}${formatSeqOfSeqs(node.ors)}]${endIndent()}${endIndent()}`;
      case "With":
        return `${indent("")}[type   |-> "with", ${newLine()} var    |-> "${node.var}",${newLine()} eqOrIn |-> ${formatEqOrIn(node.isEq)},${newLine()} exp    |-> ${formatPcalExpr(node.exp)},${newLine()}${indent(" do     |-> ")}${formatSeq(node.Do)}]${endIndent()}${endIndent()}`;
      case "When":
        return `${indent("")}[type |-> "when", ${newLine()} exp |-> ${formatPcalExpr(node.exp)}]${endIndent()}`;
      case "PrintS":
        return `${indent("")}[type |-> "print", ${newLine()} exp |-> ${formatPcalExpr(node.exp)}]${endIndent()}`;
      case "Assert":
        return `${indent("")}[type |-> "assert", ${newLine()} exp |-> ${formatPcalExpr(node.exp)}]${endIndent()}`;
      case "Skip":
        return '[type |-> "skip"]';
      case "LabelIf":
        return `${indent("")}[type      |-> "labelIf",${newLine()} test      |-> ${formatPcalExpr(node.test)},${newLine()}${indent(" unlabThen |-> ")}${formatSeq(node.unlabThen)},${endIndent()}${newLine()}${indent(" labThen   |-> ")}${formatSeq(node.labThen)},${endIndent()}${newLine()}${indent(" unlabElse |-> ")}${formatSeq(node.unlabElse)},${endIndent()}${newLine()}${indent(" labElse   |-> ")}${formatSeq(node.labElse)}]${endIndent()}${newLine()}${endIndent()}`;
      case "LabelEither":
        return `${indent("")}[type    |-> "labelEither",${newLine()}${indent(" clauses |-> ")}${formatSeq(node.clauses)}]${endIndent()}${newLine()}${endIndent()}`;
      case "Clause":
        return `${indent("")}${indent("[unlabOr |-> ")}${formatSeq(node.unlabOr)},${endIndent()}${newLine()}${indent(" labOr   |-> ")}${formatSeq(node.labOr)}]${endIndent()}${newLine()}${endIndent()}`;
      case "Call":
        return `${indent("")}[type     |-> "call",${newLine()} returnTo |-> "${node.returnTo}",${newLine()} to       |-> "${node.to}",${newLine()}${indent(" args     |-> ")}${formatSeq(node.args)}]${endIndent()}${endIndent()}`;
      case "Return":
        return `[type |-> "return", from |-> "${node.from ?? "null"}"]`;
      case "CallReturn":
        return `${indent("")}[type     |-> "callReturn",${newLine()} from     |-> "${node.from ?? "null"}",${newLine()} to       |-> "${node.to}",${newLine()}${indent("args     |-> ")}${formatSeq(node.args)}]${newLine()}${endIndent()}${endIndent()}`;
      case "CallGoto":
        return `${indent("")}[type     |-> "callGoto",${newLine()} after    |-> "${node.after}",${newLine()} to       |-> "${node.to}",${newLine()}${indent("args     |-> ")}${formatSeq(node.args)}]${newLine()}${endIndent()}${endIndent()}`;
      case "Goto":
        return `[type |-> "goto",  to |-> "${node.to}"]`;
      case "Macro":
        return `${indent("")}[name   |-> "${node.name}", ${newLine()}${indent(" params |-> ")}${indent("<<")}${node.params.join(`, ${newLine()}`)}>>${endIndent()},${endIndent()}${newLine()}${indent(" body   |-> ")}${formatSeq(node.body)}]${endIndent()}${endIndent()}`;
      case "MacroCall":
        return `${indent("")}[type |-> "macrocall",${newLine()} name |-> "${node.name}",${newLine()}${indent(" args     |-> ")}${formatSeq(node.args)}]${endIndent()}${endIndent()}`;
    }
  };
  return format(node);
};
