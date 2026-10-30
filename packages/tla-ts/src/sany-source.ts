import type { Expression, SourceRange } from "./ast";
import { tokenize, type Token } from "./lexer";
import type { SanyLocation } from "./sany-nodes";

// The tokens of one file, to find the locations SANY gives to names, brackets and parentheses that
// the syntax tree of tla-ts leaves out, and the comments SANY attaches to definitions.
export interface SourceFile {
  name: string;
  source: string;
  tokens: Token[];
  lineOffsets: number[];
  tokenIndexes: Map<string, number>;
}

const OPENERS = new Map([
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
  ["<<", ">>"],
]);

const getPositionKey = (line: number, column: number) => `${line}:${column}`;

export const createSourceFile = (name: string, source: string): SourceFile => {
  const tokens = tokenize(source).filter((token) => token.kind !== "End");
  const lineOffsets = [0, 0];
  for (let index = 0; index < source.length; index++) {
    if (source[index] === "\n") lineOffsets.push(index + 1);
  }
  return {
    name,
    source,
    tokens,
    lineOffsets,
    tokenIndexes: new Map(
      tokens.map((token, index) => [getPositionKey(token.line, token.column), index]),
    ),
  };
};

export const isToken = (file: SourceFile, index: number, text: string) =>
  file.tokens[index] !== undefined &&
  file.tokens[index].text === text &&
  file.tokens[index].kind !== "String";

// The index of the first token at or after a position.
export const getTokenIndex = (file: SourceFile, position: { line: number; column: number }) => {
  const exact = file.tokenIndexes.get(getPositionKey(position.line, position.column));
  if (exact !== undefined) return exact;
  const index = file.tokens.findIndex(
    (token) =>
      token.line > position.line ||
      (token.line === position.line && token.column >= position.column),
  );
  return index === -1 ? file.tokens.length - 1 : index;
};

// The index of the last token at or before a position.
export const getEndTokenIndex = (file: SourceFile, position: { line: number; column: number }) => {
  const index = file.tokens.findLastIndex(
    (token) =>
      token.line < position.line ||
      (token.line === position.line && token.column <= position.column),
  );
  return Math.max(index, 0);
};

export const getMatchingIndex = (file: SourceFile, openIndex: number) => {
  const opener = file.tokens[openIndex].text;
  const closer = OPENERS.get(opener);
  if (closer === undefined) return openIndex;
  let depth = 0;
  for (let index = openIndex; index < file.tokens.length; index++) {
    if (isToken(file, index, opener)) depth++;
    else if (isToken(file, index, closer)) {
      depth--;
      if (depth === 0) return index;
    }
  }
  return openIndex;
};

export interface TokenSpan {
  start: number;
  end: number;
}

export const getRangeSpan = (file: SourceFile, range: SourceRange): TokenSpan => ({
  start: getTokenIndex(file, range.start),
  end: getEndTokenIndex(file, range.end),
});

// The tokens of an expression. Some nodes, such as a tuple in a subscript, have no range, so their
// span runs from their first token to the bracket that closes it.
export const getExpressionSpan = (file: SourceFile, expression: Expression): TokenSpan => {
  const range = expression.location.range;
  if (range) return getRangeSpan(file, range);
  const start = getTokenIndex(file, expression.location);
  return { start, end: getMatchingIndex(file, start) };
};

// The span with the parentheses around it, as SANY locates a parenthesized operand by its
// parentheses.
export const getParenthesizedSpan = (file: SourceFile, span: TokenSpan): TokenSpan => {
  const start = span.start - 1;
  const end = span.end + 1;
  if (
    isToken(file, start, "(") &&
    isToken(file, end, ")") &&
    getMatchingIndex(file, start) === end
  ) {
    return getParenthesizedSpan(file, { start, end });
  }
  return span;
};

export const getSpanLocation = (file: SourceFile, span: TokenSpan): SanyLocation => ({
  file: file.name,
  beginLine: file.tokens[span.start].line,
  beginColumn: file.tokens[span.start].column,
  endLine: file.tokens[span.end].line,
  endColumn: file.tokens[span.end].endColumn,
});

export const getTokenLocation = (file: SourceFile, index: number) =>
  getSpanLocation(file, { start: index, end: index });

const getOffset = (file: SourceFile, line: number, column: number) => {
  const lineStart = file.lineOffsets[line];
  let width = 0;
  let offset = lineStart;
  while (offset < file.source.length) {
    width = file.source[offset] === "\t" ? width + 8 - (width % 8) : width + 1;
    if (width >= column) return offset;
    offset++;
  }
  return offset;
};

// The comments between a token and the one before it, which SANY's parser attaches to the token.
export const getPreComments = (file: SourceFile, index: number) => {
  const previous = file.tokens[index - 1];
  const token = file.tokens[index];
  const start = previous === undefined ? 0 : getOffset(file, previous.line, previous.endColumn) + 1;
  const gap = file.source.slice(start, getOffset(file, token.line, token.column));
  const comments: string[] = [];
  let offset = 0;
  while (offset < gap.length) {
    if (gap.startsWith("\\*", offset)) {
      const lineEnd = gap.indexOf("\n", offset);
      const end = lineEnd === -1 ? gap.length : lineEnd + 1;
      comments.push(gap.slice(offset, end));
      offset = end;
    } else if (gap.startsWith("(*", offset)) {
      // SANY's lexer ends a comment token at each (* and *) nested in a block comment.
      let depth = 1;
      let segmentStart = offset;
      let end = offset + 2;
      while (depth > 0 && end < gap.length) {
        const isOpen = gap.startsWith("(*", end);
        const isClose = gap.startsWith("*)", end);
        if (isOpen || isClose) {
          depth += isOpen ? 1 : -1;
          end += 2;
          comments.push(gap.slice(segmentStart, end));
          segmentStart = end;
        } else end++;
      }
      if (segmentStart < end) comments.push(gap.slice(segmentStart, end));
      offset = end;
    } else offset++;
  }
  return comments;
};

// The identifier tokens with the given names, in order, between two token indexes.
export const findNameTokens = (file: SourceFile, start: number, end: number, names: string[]) => {
  const found: number[] = [];
  for (let index = start; index < end && found.length < names.length; index++) {
    const token = file.tokens[index];
    if (token.kind === "Identifier" && token.text === names[found.length]) found.push(index);
  }
  return found;
};

export const findToken = (file: SourceFile, start: number, end: number, text: string) => {
  for (let index = start; index <= end; index++) {
    if (isToken(file, index, text)) return index;
  }
  return -1;
};
