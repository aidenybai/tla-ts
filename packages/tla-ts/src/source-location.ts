import type { SourceLocation, SourceRange } from "./ast";

// The positions of a module's tokens, by token: the line and column where each starts, as a node's
// location gives them, and the column where each ends.
export interface PositionTable {
  readonly module: string;
  readonly lines: Int32Array;
  readonly columns: Int32Array;
  readonly endColumns: Int32Array;
}

// A node's location, whose range runs from one token of its module to another, which it reads from
// the module's table rather than holding, so that a node holds one object for its position. The
// parser sets the range once it reads the node's last token.
export class TokenLocation implements SourceLocation {
  readonly line: number;
  readonly column: number;
  readonly #table: PositionTable;
  #startToken = -1;
  #endToken = -1;

  constructor(line: number, column: number, table: PositionTable) {
    this.line = line;
    this.column = column;
    this.#table = table;
  }

  get table() {
    return this.#table;
  }

  get startToken() {
    return this.#startToken;
  }

  get endToken() {
    return this.#endToken;
  }

  get range(): SourceRange | undefined {
    const table = this.#table;
    const start = this.#startToken;
    const end = this.#endToken;
    return end < 0
      ? undefined
      : {
          module: table.module,
          start: { line: table.lines[start], column: table.columns[start] },
          end: { line: table.lines[end], column: table.endColumns[end] },
        };
  }

  setRange(startToken: number, endToken: number) {
    this.#startToken = startToken;
    this.#endToken = endToken;
  }

  toJSON() {
    return { line: this.line, column: this.column, range: this.range };
  }
}
