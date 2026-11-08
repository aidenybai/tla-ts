import { TlaEvaluationError } from "./errors";

export interface JsonNumber {
  literal: string;
}

export type JsonElement =
  | null
  | boolean
  | string
  | JsonNumber
  | JsonElement[]
  | Map<string, JsonElement>;

interface Keyword {
  lower: string;
  upper: string;
  token: number;
}

const SCOPE = {
  emptyArray: 1,
  nonemptyArray: 2,
  emptyObject: 3,
  danglingName: 4,
  nonemptyObject: 5,
  emptyDocument: 6,
  nonemptyDocument: 7,
};

const PEEKED = {
  none: 0,
  beginObject: 1,
  endObject: 2,
  beginArray: 3,
  endArray: 4,
  true: 5,
  false: 6,
  null: 7,
  singleQuoted: 8,
  doubleQuoted: 9,
  unquoted: 10,
  singleQuotedName: 12,
  doubleQuotedName: 13,
  unquotedName: 14,
  number: 16,
  eof: 17,
};

const NUMBER_CHAR = {
  none: 0,
  sign: 1,
  digit: 2,
  decimal: 3,
  fractionDigit: 4,
  exponentE: 5,
  exponentSign: 6,
  exponentDigit: 7,
};

const KEYWORDS: Keyword[] = [
  { lower: "true", upper: "TRUE", token: PEEKED.true },
  { lower: "false", upper: "FALSE", token: PEEKED.false },
  { lower: "null", upper: "NULL", token: PEEKED.null },
];

const ESCAPES = new Map([
  ["t", "\t"],
  ["b", "\b"],
  ["n", "\n"],
  ["r", "\r"],
  ["f", "\f"],
]);

const BUFFER_SIZE = 1024;
const NESTING_LIMIT = 255;
const NON_EXECUTE_PREFIX = ")]}'\n";
const MALFORMED_JSON_GUIDE =
  "\nSee https://github.com/google/gson/blob/main/Troubleshooting.md#malformed-json";

// Gson's JsonParser.parseReader: a lenient JsonReader reads one element, and the reader, strict
// again, then rejects anything but whitespace after it. An empty document reads as JSON null.
export const readJson = (text: string): JsonElement => {
  const byteOrderMarkLength = text.startsWith("﻿") ? 1 : 0;
  let pos = byteOrderMarkLength;
  let lineNumber = 0;
  let lineStart = byteOrderMarkLength;
  let isLenient = true;
  let peeked = PEEKED.none;
  let peekedNumberLength = 0;
  const stack = [SCOPE.emptyDocument];
  const pathNames: (string | undefined)[] = [undefined];
  const pathIndices = [0];

  const getPath = () =>
    `$${stack
      .map((scope, index) => {
        if (scope === SCOPE.emptyArray || scope === SCOPE.nonemptyArray) {
          return `[${pathIndices[index]}]`;
        }
        return scope === SCOPE.emptyDocument || scope === SCOPE.nonemptyDocument
          ? ""
          : `.${pathNames[index] ?? ""}`;
      })
      .join("")}`;

  const getLocation = () =>
    ` at line ${lineNumber + 1} column ${pos - lineStart + 1} path ${getPath()}`;

  const createSyntaxError = (message: string) =>
    new TlaEvaluationError(
      `com.google.gson.stream.MalformedJsonException: ${message}${getLocation()}${MALFORMED_JSON_GUIDE}`,
    );

  const createEndOfInputError = () =>
    new TlaEvaluationError(`java.io.EOFException: End of input${getLocation()}`);

  const checkLenient = () => {
    if (!isLenient) {
      throw createSyntaxError(
        "Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON",
      );
    }
  };

  const isLiteral = (char: string) => {
    if ("/\\;#=".includes(char)) {
      checkLenient();
      return false;
    }
    return !"{}[]:, \t\f\r\n".includes(char);
  };

  const skipToEndOfLine = () => {
    while (pos < text.length) {
      const char = text[pos++];
      if (char === "\n") {
        lineNumber++;
        lineStart = pos;
        return;
      }
      if (char === "\r") return;
    }
  };

  const skipTo = (target: string) => {
    for (; pos + target.length <= text.length; pos++) {
      if (text[pos] === "\n") {
        lineNumber++;
        lineStart = pos + 1;
      } else if (text.startsWith(target, pos)) {
        return true;
      }
    }
    return false;
  };

  const nextNonWhitespace = () => {
    while (pos < text.length) {
      const char = text[pos++];
      if (char === "\n") {
        lineNumber++;
        lineStart = pos;
      } else if (char === "/") {
        if (pos === text.length) return char;
        checkLenient();
        const next = text[pos];
        if (next !== "*" && next !== "/") return char;
        pos++;
        if (next === "/") skipToEndOfLine();
        else if (skipTo("*/")) pos += 2;
        else throw createSyntaxError("Unterminated comment");
      } else if (char === "#") {
        checkLenient();
        skipToEndOfLine();
      } else if (char !== " " && char !== "\r" && char !== "\t") {
        return char;
      }
    }
    return undefined;
  };

  const nextNonWhitespaceBeforeEnd = () => {
    const char = nextNonWhitespace();
    if (char === undefined) throw createEndOfInputError();
    return char;
  };

  const peekKeyword = () => {
    const keyword = KEYWORDS.find(
      (candidate) => text[pos] === candidate.lower[0] || text[pos] === candidate.upper[0],
    );
    if (!keyword) return PEEKED.none;
    const length = keyword.lower.length;
    for (let index = 0; index < length; index++) {
      const char = text[pos + index];
      if (char !== keyword.lower[index] && char !== keyword.upper[index]) return PEEKED.none;
    }
    if (pos + length < text.length && isLiteral(text[pos + length])) return PEEKED.none;
    pos += length;
    return keyword.token;
  };

  const peekNumber = () => {
    let last = NUMBER_CHAR.none;
    let isLeadingZero = false;
    let index = 0;
    for (; pos + index < text.length; index++) {
      if (index === BUFFER_SIZE) return PEEKED.none;
      const char = text[pos + index];
      if (char === "-") {
        if (last === NUMBER_CHAR.none) last = NUMBER_CHAR.sign;
        else if (last === NUMBER_CHAR.exponentE) last = NUMBER_CHAR.exponentSign;
        else return PEEKED.none;
      } else if (char === "+") {
        if (last !== NUMBER_CHAR.exponentE) return PEEKED.none;
        last = NUMBER_CHAR.exponentSign;
      } else if (char === "e" || char === "E") {
        if (last !== NUMBER_CHAR.digit && last !== NUMBER_CHAR.fractionDigit) return PEEKED.none;
        last = NUMBER_CHAR.exponentE;
      } else if (char === ".") {
        if (last !== NUMBER_CHAR.digit) return PEEKED.none;
        last = NUMBER_CHAR.decimal;
      } else if (char < "0" || char > "9") {
        if (isLiteral(char)) return PEEKED.none;
        break;
      } else if (last === NUMBER_CHAR.sign || last === NUMBER_CHAR.none) {
        isLeadingZero = char === "0";
        last = NUMBER_CHAR.digit;
      } else if (last === NUMBER_CHAR.digit) {
        if (isLeadingZero) return PEEKED.none;
      } else if (last === NUMBER_CHAR.decimal) {
        last = NUMBER_CHAR.fractionDigit;
      } else if (last === NUMBER_CHAR.exponentE || last === NUMBER_CHAR.exponentSign) {
        last = NUMBER_CHAR.exponentDigit;
      }
    }
    if (index === BUFFER_SIZE) return PEEKED.none;
    const isComplete =
      last === NUMBER_CHAR.digit ||
      last === NUMBER_CHAR.fractionDigit ||
      last === NUMBER_CHAR.exponentDigit;
    if (!isComplete) return PEEKED.none;
    peekedNumberLength = index;
    return PEEKED.number;
  };

  const doPeek = () => {
    const top = stack.length - 1;
    const peekStack = stack[top];
    if (peekStack === SCOPE.emptyArray) {
      stack[top] = SCOPE.nonemptyArray;
    } else if (peekStack === SCOPE.nonemptyArray) {
      const char = nextNonWhitespaceBeforeEnd();
      if (char === "]") return PEEKED.endArray;
      if (char === ";") checkLenient();
      else if (char !== ",") throw createSyntaxError("Unterminated array");
    } else if (peekStack === SCOPE.emptyObject || peekStack === SCOPE.nonemptyObject) {
      stack[top] = SCOPE.danglingName;
      if (peekStack === SCOPE.nonemptyObject) {
        const separator = nextNonWhitespaceBeforeEnd();
        if (separator === "}") return PEEKED.endObject;
        if (separator === ";") checkLenient();
        else if (separator !== ",") throw createSyntaxError("Unterminated object");
      }
      const char = nextNonWhitespaceBeforeEnd();
      if (char === '"') return PEEKED.doubleQuotedName;
      if (char === "'") {
        checkLenient();
        return PEEKED.singleQuotedName;
      }
      if (char === "}") {
        if (peekStack !== SCOPE.nonemptyObject) return PEEKED.endObject;
        throw createSyntaxError("Expected name");
      }
      checkLenient();
      pos--;
      if (isLiteral(char)) return PEEKED.unquotedName;
      throw createSyntaxError("Expected name");
    } else if (peekStack === SCOPE.danglingName) {
      stack[top] = SCOPE.nonemptyObject;
      const char = nextNonWhitespaceBeforeEnd();
      if (char === "=") {
        checkLenient();
        if (text[pos] === ">") pos++;
      } else if (char !== ":") {
        throw createSyntaxError("Expected ':'");
      }
    } else if (peekStack === SCOPE.emptyDocument) {
      if (nextNonWhitespace() === undefined) return PEEKED.eof;
      pos--;
      if (text.startsWith(NON_EXECUTE_PREFIX, pos)) pos += NON_EXECUTE_PREFIX.length;
      stack[top] = SCOPE.nonemptyDocument;
    } else if (peekStack === SCOPE.nonemptyDocument) {
      if (nextNonWhitespace() === undefined) return PEEKED.eof;
      checkLenient();
      pos--;
    }

    const char = nextNonWhitespace();
    if (char === undefined) {
      if (peekStack === SCOPE.emptyDocument) return PEEKED.eof;
      throw createEndOfInputError();
    }
    if (char === "]" && peekStack === SCOPE.emptyArray) return PEEKED.endArray;
    if (char === "]" || char === ";" || char === ",") {
      if (peekStack !== SCOPE.emptyArray && peekStack !== SCOPE.nonemptyArray) {
        throw createSyntaxError("Unexpected value");
      }
      checkLenient();
      pos--;
      return PEEKED.null;
    }
    if (char === "'") {
      checkLenient();
      return PEEKED.singleQuoted;
    }
    if (char === '"') return PEEKED.doubleQuoted;
    if (char === "[") return PEEKED.beginArray;
    if (char === "{") return PEEKED.beginObject;
    pos--;
    const keyword = peekKeyword();
    if (keyword !== PEEKED.none) return keyword;
    const number = peekNumber();
    if (number !== PEEKED.none) return number;
    if (!isLiteral(text[pos])) throw createSyntaxError("Expected value");
    checkLenient();
    return PEEKED.unquoted;
  };

  const peek = () => {
    if (peeked === PEEKED.none) peeked = doPeek();
    return peeked;
  };

  const readEscapeCharacter = () => {
    if (pos === text.length) throw createSyntaxError("Unterminated escape sequence");
    const escaped = text[pos++];
    if (escaped === "u") {
      if (pos + 4 > text.length) throw createSyntaxError("Unterminated escape sequence");
      const digits = text.slice(pos, pos + 4);
      if (!/^[\da-fA-F]{4}$/.test(digits)) {
        throw createSyntaxError(`Malformed Unicode escape \\u${digits}`);
      }
      pos += 4;
      return String.fromCharCode(Number.parseInt(digits, 16));
    }
    const replacement = ESCAPES.get(escaped);
    if (replacement !== undefined) return replacement;
    if (escaped === "\n") {
      lineNumber++;
      lineStart = pos;
      return escaped;
    }
    if ("'\"\\/".includes(escaped)) return escaped;
    throw createSyntaxError("Invalid escape sequence");
  };

  const nextQuotedValue = (quote: string) => {
    let result = "";
    let start = pos;
    while (pos < text.length) {
      const char = text[pos++];
      if (char === quote) return result + text.slice(start, pos - 1);
      if (char === "\\") {
        result += text.slice(start, pos - 1) + readEscapeCharacter();
        start = pos;
      } else if (char === "\n") {
        lineNumber++;
        lineStart = pos;
      }
    }
    throw createSyntaxError("Unterminated string");
  };

  const nextUnquotedValue = () => {
    const start = pos;
    while (pos < text.length && isLiteral(text[pos])) pos++;
    return text.slice(start, pos);
  };

  const push = (scope: number) => {
    if (stack.length - 1 >= NESTING_LIMIT) {
      throw new TlaEvaluationError(
        `com.google.gson.stream.MalformedJsonException: Nesting limit ${NESTING_LIMIT} reached${getLocation()}`,
      );
    }
    stack.push(scope);
    pathNames.push(undefined);
    pathIndices.push(0);
    peeked = PEEKED.none;
  };

  const pop = () => {
    stack.pop();
    pathNames.pop();
    pathIndices.pop();
    pathIndices[stack.length - 1]++;
    peeked = PEEKED.none;
  };

  const hasNext = () => {
    const token = peek();
    return token !== PEEKED.endObject && token !== PEEKED.endArray && token !== PEEKED.eof;
  };

  const nextName = () => {
    const token = peek();
    const name =
      token === PEEKED.unquotedName
        ? nextUnquotedValue()
        : nextQuotedValue(token === PEEKED.singleQuotedName ? "'" : '"');
    peeked = PEEKED.none;
    pathNames[stack.length - 1] = name;
    return name;
  };

  const nextTerminal = (token: number): JsonElement => {
    if (token === PEEKED.true || token === PEEKED.false) return token === PEEKED.true;
    if (token === PEEKED.null) return null;
    if (token === PEEKED.number) {
      pos += peekedNumberLength;
      return { literal: text.slice(pos - peekedNumberLength, pos) };
    }
    if (token === PEEKED.unquoted) return nextUnquotedValue();
    return nextQuotedValue(token === PEEKED.singleQuoted ? "'" : '"');
  };

  const readElement = (): JsonElement => {
    const token = peek();
    if (token === PEEKED.beginArray) {
      push(SCOPE.emptyArray);
      const elements: JsonElement[] = [];
      while (hasNext()) elements.push(readElement());
      pop();
      return elements;
    }
    if (token === PEEKED.beginObject) {
      push(SCOPE.emptyObject);
      const members = new Map<string, JsonElement>();
      while (hasNext()) members.set(nextName(), readElement());
      pop();
      return members;
    }
    const element = nextTerminal(token);
    peeked = PEEKED.none;
    pathIndices[stack.length - 1]++;
    return element;
  };

  if (peek() === PEEKED.eof) return null;
  const element = readElement();
  isLenient = false;
  if (element !== null) peek();
  return element;
};
