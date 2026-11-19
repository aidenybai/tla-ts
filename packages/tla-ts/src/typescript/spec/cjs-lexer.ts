// The names a CommonJS module exports and the specifiers it re-exports, as Node's ESM loader finds
// them by reading the module's code, before it runs: a port of merve 1.2.2 (deps/merve/merve.cpp),
// the lexer that Node 26 binds as cjs_lexer, itself a port of cjs-module-lexer. It reads the code's
// UTF-8 bytes, as Node's binding does, and gives no names where it finds a syntax error.

const STACK_DEPTH = 2048;
const MAX_STAR_EXPORTS = 256;
const NO_TEMPLATE = 65535;

const code = (character: string) => character.charCodeAt(0);

const getTable = (isIn: (byte: number) => boolean) =>
  Array.from({ length: 256 }, (_, byte) => isIn(byte));

const isLetter = (byte: number) =>
  (byte >= code("a") && byte <= code("z")) || (byte >= code("A") && byte <= code("Z"));

const PUNCTUATORS = getTable(
  (byte) =>
    [code("!"), code("%"), code("&"), code("["), code("]"), code("^")].includes(byte) ||
    (byte >= 40 && byte < 48) ||
    (byte >= 58 && byte < 64) ||
    (byte >= 123 && byte < 127),
);

const EXPRESSION_PUNCTUATORS = getTable(
  (byte) =>
    [code("!"), code("%"), code("&"), code("["), code("^")].includes(byte) ||
    (byte >= 40 && byte < 47 && byte !== 41) ||
    (byte >= 58 && byte < 64) ||
    (byte >= 123 && byte < 127 && byte !== 125),
);

const IDENTIFIER_STARTS = getTable(
  (byte) => isLetter(byte) || byte === code("_") || byte === code("$") || byte >= 0x80,
);

const IDENTIFIER_CHARACTERS = getTable(
  (byte) => IDENTIFIER_STARTS[byte] || (byte >= code("0") && byte <= code("9")),
);

const BREAKS_OR_SPACES = getTable((byte) => (byte >= 9 && byte < 14) || byte === 32);

const SIMPLE_ESCAPES = new Map([
  [code("n"), 10],
  [code("r"), 13],
  [code("t"), 9],
  [code("b"), 8],
  [code("f"), 12],
  [code("v"), 11],
  [code("0"), 0],
  [code("\\"), code("\\")],
  [code("'"), code("'")],
  [code('"'), code('"')],
]);

const getHexDigit = (byte: number) =>
  byte >= code("0") && byte <= code("9")
    ? byte - code("0")
    : byte >= code("a") && byte <= code("f")
      ? byte - code("a") + 10
      : byte >= code("A") && byte <= code("F")
        ? byte - code("A") + 10
        : -1;

const getUtf8 = (codePoint: number) => [...Buffer.from(String.fromCodePoint(codePoint), "utf8")];

// unescapeJsString: the bytes of a name with its escapes read, or undefined for an invalid one,
// such as a lone surrogate.
const unescape = (bytes: readonly number[]): number[] | undefined => {
  const result: number[] = [];
  const readHex = (from: number, to: number) => {
    let value = 0;
    for (let index = from; index < to; index++) {
      const digit = getHexDigit(bytes[index] ?? 0);
      if (digit < 0) return -1;
      value = value * 16 + digit;
      if (value > 0x10ffff) return -1;
    }
    return value;
  };
  for (let index = 0; index < bytes.length; index++) {
    if (bytes[index] !== code("\\")) {
      result.push(bytes[index]);
      continue;
    }
    if (++index >= bytes.length) return undefined;
    const simple = SIMPLE_ESCAPES.get(bytes[index]);
    if (simple !== undefined) {
      result.push(simple);
      continue;
    }
    if (bytes[index] === code("x")) {
      if (index + 2 >= bytes.length) return undefined;
      const value = readHex(index + 1, index + 3);
      if (value < 0) return undefined;
      result.push(value);
      index += 2;
    } else if (bytes[index] === code("u")) {
      if (index + 1 >= bytes.length) return undefined;
      if (bytes[index + 1] === code("{")) {
        const start = index + 2;
        let endBrace = bytes.indexOf(code("}"), start);
        if (endBrace === -1 || endBrace === start) return undefined;
        let codePoint = readHex(start, endBrace);
        if (codePoint < 0) return undefined;
        if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
          if (
            !(
              endBrace + 3 < bytes.length &&
              bytes[endBrace + 1] === code("\\") &&
              bytes[endBrace + 2] === code("u") &&
              bytes[endBrace + 3] === code("{")
            )
          ) {
            return undefined;
          }
          const lowStart = endBrace + 4;
          const lowEnd = bytes.indexOf(code("}"), lowStart);
          if (lowEnd === -1 || lowEnd <= lowStart) return undefined;
          let low = 0;
          for (let digitIndex = lowStart; digitIndex < lowEnd; digitIndex++) {
            const digit = getHexDigit(bytes[digitIndex]);
            if (digit < 0) return undefined;
            low = (low * 16 + digit) >>> 0;
          }
          if (low < 0xdc00 || low > 0xdfff) return undefined;
          codePoint = 0x10000 + (codePoint - 0xd800) * 1024 + (low - 0xdc00);
          endBrace = lowEnd;
        } else if (codePoint >= 0xdc00 && codePoint <= 0xdfff) {
          return undefined;
        }
        result.push(...getUtf8(codePoint));
        index = endBrace;
      } else {
        if (index + 4 >= bytes.length) return undefined;
        let codePoint = readHex(index + 1, index + 5);
        if (codePoint < 0) return undefined;
        if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
          if (
            !(
              index + 10 < bytes.length &&
              bytes[index + 5] === code("\\") &&
              bytes[index + 6] === code("u")
            )
          ) {
            return undefined;
          }
          const low = readHex(index + 7, index + 11);
          if (low < 0xdc00 || low > 0xdfff) return undefined;
          codePoint = 0x10000 + (codePoint - 0xd800) * 1024 + (low - 0xdc00);
          index += 6;
        } else if (codePoint >= 0xdc00 && codePoint <= 0xdfff) {
          return undefined;
        }
        result.push(...getUtf8(codePoint));
        index += 4;
      }
    } else {
      result.push(bytes[index]);
    }
  }
  return result;
};

const RequireType = { Import: 0, ExportAssign: 1, ExportStar: 2 } as const;

interface StarExportBinding {
  specifier: [number, number] | undefined;
  id: [number, number] | undefined;
}

export interface CommonJsAnalysis {
  exports: string[];
  reexports: string[];
}

// parse_commonjs: the module's export names and re-exported specifiers, as Node's binding turns
// them into strings, or no names where the lexer finds an error.
export const parseCommonJs = (text: string): CommonJsAnalysis => {
  const source = Buffer.from(text, "utf8");
  const end = source.length;
  // The byte at an index, which is 0 outside the source, as the binding's terminated buffer gives.
  const at = (index: number) => (index >= 0 && index < end ? source[index] : 0);
  const matchesAt = (index: number, expected: string) => {
    if (end - index < expected.length) return false;
    for (let offset = 0; offset < expected.length; offset++) {
      if (source[index + offset] !== expected.charCodeAt(offset)) return false;
    }
    return true;
  };
  const matchesBytes = (index: number, range: [number, number]) => {
    const length = range[1] - range[0];
    if (end - index < length) return false;
    for (let offset = 0; offset < length; offset++) {
      if (source[index + offset] !== source[range[0] + offset]) return false;
    }
    return true;
  };
  const isBrOrWsOrPunctuatorNotDot = (byte: number) =>
    BREAKS_OR_SPACES[byte] || (PUNCTUATORS[byte] && byte !== code("."));

  let pos = -1;
  let lastTokenPos = -1;
  let templateStackDepth = 0;
  let openTokenDepth = 0;
  let templateDepth = NO_TEMPLATE;
  let lastSlashWasDivision = false;
  let nextBraceIsClass = false;
  let hasError = false;
  const templateStack: number[] = [];
  const openTokenPosStack: number[] = [];
  const openTokenTypeStack: string[] = [];
  const openClassPosStack: boolean[] = [];
  const starExportStack: StarExportBinding[] = Array.from({ length: MAX_STAR_EXPORTS }, () => ({
    specifier: undefined,
    id: undefined,
  }));
  let starExportIndex = 0;
  const starExportStackEnd = MAX_STAR_EXPORTS - 1;
  const exports: number[][] = [];
  const reexports: number[][] = [];

  const keywordStart = (p: number) => p === 0 || isBrOrWsOrPunctuatorNotDot(at(p - 1));
  const readPrecedingKeyword = (p: number, keyword: string) => {
    const start = p - keyword.length + 1;
    if (start < 0) return false;
    return matchesAt(start, keyword) && (start === 0 || isBrOrWsOrPunctuatorNotDot(at(start - 1)));
  };
  const isExpressionKeyword = (p: number) => {
    switch (String.fromCharCode(at(p))) {
      case "d":
        return at(p - 1) === code("i")
          ? readPrecedingKeyword(p - 2, "vo")
          : at(p - 1) === code("l") && readPrecedingKeyword(p - 2, "yie");
      case "e":
        if (at(p - 1) === code("s")) {
          return at(p - 2) === code("l")
            ? p - 3 >= 0 && at(p - 3) === code("e") && keywordStart(p - 3)
            : at(p - 2) === code("a") &&
                p - 3 >= 0 &&
                at(p - 3) === code("c") &&
                keywordStart(p - 3);
        }
        return at(p - 1) === code("t") && readPrecedingKeyword(p - 2, "dele");
      case "f":
        if (at(p - 1) !== code("o") || at(p - 2) !== code("e")) return false;
        return at(p - 3) === code("c")
          ? readPrecedingKeyword(p - 4, "instan")
          : at(p - 3) === code("p") && readPrecedingKeyword(p - 4, "ty");
      case "n":
        return (
          (p - 1 >= 0 && at(p - 1) === code("i") && keywordStart(p - 1)) ||
          readPrecedingKeyword(p - 1, "retur")
        );
      case "o":
        return p - 1 >= 0 && at(p - 1) === code("d") && keywordStart(p - 1);
      case "r":
        return readPrecedingKeyword(p - 1, "debugge");
      case "t":
        return readPrecedingKeyword(p - 1, "awai");
      case "w":
        return at(p - 1) === code("e")
          ? p - 2 >= 0 && at(p - 2) === code("n") && keywordStart(p - 2)
          : at(p - 1) === code("o") && readPrecedingKeyword(p - 2, "thr");
      default:
        return false;
    }
  };
  const isParenKeyword = (p: number) =>
    readPrecedingKeyword(p, "while") ||
    readPrecedingKeyword(p, "for") ||
    readPrecedingKeyword(p, "if");
  const isExpressionTerminator = (p: number) => {
    switch (String.fromCharCode(at(p))) {
      case ">":
        return at(p - 1) === code("=");
      case ";":
      case ")":
        return true;
      case "h":
        return readPrecedingKeyword(p - 1, "catc");
      case "y":
        return readPrecedingKeyword(p - 1, "finall");
      case "e":
        return readPrecedingKeyword(p - 1, "els");
      default:
        return false;
    }
  };
  const syntaxError = () => {
    hasError = true;
    pos = end + 1;
  };
  const lineComment = () => {
    while (pos++ < end) {
      const ch = at(pos);
      if (ch === 10 || ch === 13) return;
    }
  };
  const blockComment = () => {
    pos++;
    while (pos++ < end) {
      if (at(pos) === code("*") && at(pos + 1) === code("/")) {
        pos++;
        return;
      }
    }
  };
  const commentWhitespace = (): number => {
    let ch = 0;
    do {
      if (pos >= end) return 0;
      ch = at(pos);
      if (ch === code("/")) {
        const next = pos + 1 < end ? at(pos + 1) : 0;
        if (next === code("/")) lineComment();
        else if (next === code("*")) blockComment();
        else return ch;
      } else if (!BREAKS_OR_SPACES[ch]) {
        return ch;
      }
    } while (pos++ < end);
    return ch;
  };
  const stringLiteral = (quote: number) => {
    while (pos++ < end) {
      let ch = at(pos);
      if (ch === quote) return;
      if (ch === code("\\")) {
        if (pos + 1 >= end) break;
        ch = at(++pos);
        if (ch === 13 && at(pos + 1) === 10) pos++;
      } else if (ch === 10 || ch === 13) {
        break;
      }
    }
    syntaxError();
  };
  const regexCharacterClass = () => {
    while (pos++ < end) {
      const ch = at(pos);
      if (ch === code("]")) return;
      if (ch === code("\\")) {
        if (pos + 1 < end) pos++;
      } else if (ch === 10 || ch === 13) {
        break;
      }
    }
    syntaxError();
  };
  const regularExpression = () => {
    while (pos++ < end) {
      const ch = at(pos);
      if (ch === code("/")) return;
      if (ch === code("[")) regexCharacterClass();
      else if (ch === code("\\")) {
        if (pos + 1 < end) pos++;
      } else if (ch === 10 || ch === 13) {
        break;
      }
    }
    syntaxError();
  };
  const templateString = () => {
    while (pos++ < end) {
      const ch = at(pos);
      if (ch === code("$") && at(pos + 1) === code("{")) {
        pos++;
        if (templateStackDepth >= STACK_DEPTH) {
          syntaxError();
          return;
        }
        templateStack[templateStackDepth++] = templateDepth;
        templateDepth = ++openTokenDepth;
        return;
      }
      if (ch === code("`")) return;
      if (ch === code("\\") && pos + 1 < end) pos++;
    }
    syntaxError();
  };
  const identifier = (startCh: number) => {
    if (!IDENTIFIER_STARTS[startCh]) return false;
    pos++;
    while (pos < end && IDENTIFIER_CHARACTERS[at(pos)]) pos++;
    return true;
  };
  const getName = (start: number, finish: number) => {
    const quoted = at(start) === code("'") || at(start) === code('"');
    const bytes = [...source.subarray(quoted ? start + 1 : start, quoted ? finish - 1 : finish)];
    return bytes.includes(code("\\")) ? unescape(bytes) : bytes;
  };
  const addExport = (start: number, finish: number) => {
    const name = getName(start, finish);
    if (name === undefined) return;
    if (
      exports.some(
        (existing) =>
          existing.length === name.length && existing.every((byte, index) => byte === name[index]),
      )
    ) {
      return;
    }
    exports.push(name);
  };
  const addReexport = (start: number, finish: number) => {
    const name = getName(start, finish);
    if (name !== undefined) reexports.push(name);
  };
  const readExportsOrModuleDotExports = (first: number) => {
    let ch = first;
    const revertPos = pos;
    if (ch === code("m") && matchesAt(pos + 1, "odule")) {
      pos += 6;
      ch = commentWhitespace();
      if (ch !== code(".")) {
        pos = revertPos;
        return false;
      }
      pos++;
      ch = commentWhitespace();
    }
    if (ch === code("e") && matchesAt(pos + 1, "xports")) {
      pos += 7;
      return true;
    }
    pos = revertPos;
    return false;
  };
  const tryParseRequire = (requireType: number) => {
    const revertPos = pos;
    if (!matchesAt(pos + 1, "equire")) return false;
    pos += 7;
    let ch = commentWhitespace();
    if (ch === code("(")) {
      pos++;
      ch = commentWhitespace();
      const reexportStart = pos;
      if (ch === code("'") || ch === code('"')) {
        stringLiteral(ch);
        const reexportEnd = ++pos;
        ch = commentWhitespace();
        if (ch === code(")")) {
          if (requireType === RequireType.Import) {
            if (starExportIndex < starExportStackEnd) {
              starExportStack[starExportIndex].specifier = [reexportStart, reexportEnd];
            }
          } else {
            addReexport(reexportStart, reexportEnd);
          }
          return true;
        }
      }
    }
    pos = revertPos;
    return false;
  };
  // tryParsePropertyValue, which gives the character after the value, or undefined for none.
  const tryParsePropertyValue = (ch: number) =>
    (ch === code("r") && tryParseRequire(RequireType.ExportAssign)) || identifier(ch)
      ? at(pos)
      : undefined;
  const tryParseLiteralExports = () => {
    const revertPos = pos - 1;
    while (pos++ < end) {
      let ch = commentWhitespace();
      const startPos = pos;
      if (identifier(ch)) {
        const endPos = pos;
        ch = commentWhitespace();
        if (
          ch !== code(":") &&
          endPos - startPos === 3 &&
          matchesAt(startPos, "get") &&
          identifier(ch)
        ) {
          ch = commentWhitespace();
          if (ch === code("(")) {
            pos = revertPos;
            return;
          }
        }
        if (ch === code(":")) {
          pos++;
          const value = tryParsePropertyValue(commentWhitespace());
          if (value === undefined) {
            pos = revertPos;
            return;
          }
          ch = value;
        }
        addExport(startPos, endPos);
      } else if (ch === code("'") || ch === code('"')) {
        const start = pos;
        stringLiteral(ch);
        const endPos = ++pos;
        ch = commentWhitespace();
        if (ch === code(":")) {
          pos++;
          const value = tryParsePropertyValue(commentWhitespace());
          if (value === undefined) {
            pos = revertPos;
            return;
          }
          ch = value;
          addExport(start, endPos);
        }
      } else if (ch === code(".") && matchesAt(pos + 1, "..")) {
        pos += 3;
        if (pos < end && at(pos) === code("r") && tryParseRequire(RequireType.ExportAssign)) {
          pos++;
        } else if (pos < end && !identifier(at(pos))) {
          pos = revertPos;
          return;
        }
        ch = commentWhitespace();
      } else {
        pos = revertPos;
        return;
      }
      if (ch === code("}")) return;
      if (ch !== code(",")) {
        pos = revertPos;
        return;
      }
    }
  };
  const tryParseExportsDotAssign = (assign: boolean) => {
    pos += 7;
    const revertPos = pos - 1;
    let ch = commentWhitespace();
    if (ch === code(".")) {
      pos++;
      ch = commentWhitespace();
      const startPos = pos;
      if (identifier(ch)) {
        const endPos = pos;
        ch = commentWhitespace();
        if (ch === code("=")) {
          addExport(startPos, endPos);
          return;
        }
      }
    } else if (ch === code("[")) {
      pos++;
      ch = commentWhitespace();
      if (ch === code("'") || ch === code('"')) {
        const startPos = pos;
        stringLiteral(ch);
        const endPos = ++pos;
        ch = commentWhitespace();
        if (ch === code("]")) {
          pos++;
          ch = commentWhitespace();
          if (ch === code("=")) addExport(startPos, endPos);
        }
      }
    } else if (ch === code("=") && assign) {
      reexports.length = 0;
      pos++;
      ch = commentWhitespace();
      if (ch === code("{")) {
        tryParseLiteralExports();
        return;
      }
      if (ch === code("r")) tryParseRequire(RequireType.ExportAssign);
    }
    pos = revertPos;
  };
  const tryParseModuleExportsDotAssign = () => {
    pos += 6;
    const revertPos = pos - 1;
    let ch = commentWhitespace();
    if (ch === code(".")) {
      pos++;
      ch = commentWhitespace();
      if (ch === code("e") && matchesAt(pos + 1, "xports")) {
        tryParseExportsDotAssign(true);
        return;
      }
    }
    pos = revertPos;
  };
  // A sequence of expected tokens, each a character, a keyword the character starts, or a
  // parsing step, which stops at the first that doesn't match.
  const matchIdentifier = (range: [number, number]) => {
    if (!matchesBytes(pos, range)) return false;
    pos += range[1] - range[0];
    return true;
  };
  const tryParseObjectHasOwnProperty = (itId: [number, number]) => {
    let ch = commentWhitespace();
    if (ch !== code("O") || !matchesAt(pos + 1, "bject")) return false;
    pos += 6;
    ch = commentWhitespace();
    if (ch !== code(".")) return false;
    pos++;
    ch = commentWhitespace();
    if (ch === code("p")) {
      if (!matchesAt(pos + 1, "rototype")) return false;
      pos += 9;
      ch = commentWhitespace();
      if (ch !== code(".")) return false;
      pos++;
      ch = commentWhitespace();
    }
    if (ch !== code("h") || !matchesAt(pos + 1, "asOwnProperty")) return false;
    pos += 14;
    ch = commentWhitespace();
    if (ch !== code(".")) return false;
    pos++;
    ch = commentWhitespace();
    if (ch !== code("c") || !matchesAt(pos + 1, "all")) return false;
    pos += 4;
    ch = commentWhitespace();
    if (ch !== code("(")) return false;
    pos++;
    ch = commentWhitespace();
    if (!identifier(ch)) return false;
    ch = commentWhitespace();
    if (ch !== code(",")) return false;
    pos++;
    commentWhitespace();
    if (!matchIdentifier(itId)) return false;
    ch = commentWhitespace();
    if (ch !== code(")")) return false;
    pos++;
    return true;
  };
  // The getter `get: function () { return id.name }`, `get() { return id["name"] }`, and the like,
  // from its key, which tryParseObjectDefineOrKeys reads of Object.defineProperty, with the value
  // read as returnValue parses it. Gives whether it parses.
  const tryParseGetter = (returnValue: () => boolean) => {
    if (!matchesAt(pos + 1, "et")) return false;
    pos += 3;
    let ch = commentWhitespace();
    if (ch === code(":")) {
      pos++;
      ch = commentWhitespace();
      if (ch !== code("f")) return false;
      if (!matchesAt(pos + 1, "unction")) return false;
      pos += 8;
      const lastPos = pos;
      ch = commentWhitespace();
      if (ch !== code("(") && (lastPos === pos || !identifier(ch))) return false;
      ch = commentWhitespace();
    }
    if (ch !== code("(")) return false;
    pos++;
    ch = commentWhitespace();
    if (ch !== code(")")) return false;
    pos++;
    ch = commentWhitespace();
    if (ch !== code("{")) return false;
    pos++;
    ch = commentWhitespace();
    if (ch !== code("r")) return false;
    if (!matchesAt(pos + 1, "eturn")) return false;
    pos += 6;
    commentWhitespace();
    if (!returnValue()) return false;
    ch = commentWhitespace();
    if (ch === code(";")) {
      pos++;
      ch = commentWhitespace();
    }
    if (ch !== code("}")) return false;
    pos++;
    ch = commentWhitespace();
    if (ch === code(",")) {
      pos++;
      ch = commentWhitespace();
    }
    if (ch !== code("}")) return false;
    pos++;
    ch = commentWhitespace();
    return ch === code(")");
  };
  const tryParseObjectDefineOrKeys = (keys: boolean) => {
    pos += 6;
    let revertPos = pos - 1;
    let ch = commentWhitespace();
    if (ch === code(".")) {
      pos++;
      ch = commentWhitespace();
      if (ch === code("d") && matchesAt(pos + 1, "efineProperty")) {
        const parsed = (() => {
          pos += 14;
          revertPos = pos - 1;
          ch = commentWhitespace();
          if (ch !== code("(")) return;
          pos++;
          ch = commentWhitespace();
          if (!readExportsOrModuleDotExports(ch)) return;
          ch = commentWhitespace();
          if (ch !== code(",")) return;
          pos++;
          ch = commentWhitespace();
          if (ch !== code("'") && ch !== code('"')) return;
          const exportStart = pos;
          stringLiteral(ch);
          const exportEnd = ++pos;
          ch = commentWhitespace();
          if (ch !== code(",")) return;
          pos++;
          ch = commentWhitespace();
          if (ch !== code("{")) return;
          pos++;
          ch = commentWhitespace();
          if (ch === code("e")) {
            if (!matchesAt(pos + 1, "numerable")) return;
            pos += 10;
            ch = commentWhitespace();
            if (ch !== code(":")) return;
            pos++;
            ch = commentWhitespace();
            if (ch !== code("t") || !matchesAt(pos + 1, "rue")) return;
            pos += 4;
            ch = commentWhitespace();
            if (ch !== code(",")) return;
            pos++;
            ch = commentWhitespace();
          }
          if (ch === code("v")) {
            if (!matchesAt(pos + 1, "alue")) return;
            pos += 5;
            ch = commentWhitespace();
            if (ch !== code(":")) return;
            addExport(exportStart, exportEnd);
            pos = revertPos;
            return "done";
          }
          if (ch !== code("g")) return;
          const isGetter = tryParseGetter(() => {
            if (!identifier(commentWhitespace())) return false;
            ch = commentWhitespace();
            if (ch === code(".")) {
              pos++;
              if (!identifier(commentWhitespace())) return false;
            } else if (ch === code("[")) {
              pos++;
              ch = commentWhitespace();
              if (ch !== code("'") && ch !== code('"')) return false;
              stringLiteral(ch);
              pos++;
              ch = commentWhitespace();
              if (ch !== code("]")) return false;
              pos++;
            }
            return true;
          });
          if (!isGetter) return;
          addExport(exportStart, exportEnd);
          return "done";
        })();
        if (parsed === "done") return;
      } else if (keys && ch === code("k") && matchesAt(pos + 1, "eys")) {
        const parsed = (() => {
          pos += 4;
          revertPos = pos - 1;
          ch = commentWhitespace();
          if (ch !== code("(")) return;
          pos++;
          ch = commentWhitespace();
          const idPos = pos;
          if (!identifier(ch)) return;
          const id: [number, number] = [idPos, pos];
          ch = commentWhitespace();
          if (ch !== code(")")) return;
          revertPos = pos++;
          ch = commentWhitespace();
          if (ch !== code(".")) return;
          pos++;
          ch = commentWhitespace();
          if (ch !== code("f") || !matchesAt(pos + 1, "orEach")) return;
          pos += 7;
          ch = commentWhitespace();
          revertPos = pos - 1;
          if (ch !== code("(")) return;
          pos++;
          ch = commentWhitespace();
          if (ch !== code("f") || !matchesAt(pos + 1, "unction")) return;
          pos += 8;
          ch = commentWhitespace();
          if (ch !== code("(")) return;
          pos++;
          ch = commentWhitespace();
          const itIdPos = pos;
          if (!identifier(ch)) return;
          const itId: [number, number] = [itIdPos, pos];
          ch = commentWhitespace();
          if (ch !== code(")")) return;
          pos++;
          ch = commentWhitespace();
          if (ch !== code("{")) return;
          pos++;
          ch = commentWhitespace();
          if (ch !== code("i") || at(pos + 1) !== code("f")) return;
          pos += 2;
          ch = commentWhitespace();
          if (ch !== code("(")) return;
          pos++;
          commentWhitespace();
          if (!matchIdentifier(itId)) return;
          ch = commentWhitespace();
          // A string of the quote given, of the text given.
          const readQuoted = (text: string) => {
            if (ch !== code('"') && ch !== code("'")) return false;
            const quote = ch;
            if (!matchesAt(pos + 1, text)) return false;
            pos += text.length + 1;
            ch = commentWhitespace();
            if (ch !== quote) return false;
            pos++;
            ch = commentWhitespace();
            return true;
          };
          const readReturn = () => {
            if (ch !== code("r") || !matchesAt(pos + 1, "eturn")) return false;
            pos += 6;
            ch = commentWhitespace();
            if (ch === code(";")) pos++;
            ch = commentWhitespace();
            return true;
          };
          if (ch === code("=")) {
            if (!matchesAt(pos + 1, "==")) return;
            pos += 3;
            ch = commentWhitespace();
            if (!readQuoted("default")) return;
            if (ch !== code("|") || at(pos + 1) !== code("|")) return;
            pos += 2;
            commentWhitespace();
            if (!matchIdentifier(itId)) return;
            ch = commentWhitespace();
            if (ch !== code("=") || !matchesAt(pos + 1, "==")) return;
            pos += 3;
            ch = commentWhitespace();
            if (!readQuoted("__esModule")) return;
            if (ch !== code(")")) return;
            pos++;
            ch = commentWhitespace();
            if (!readReturn()) return;
            if (ch === code("i") && at(pos + 1) === code("f")) {
              let inIf = true;
              pos += 2;
              ch = commentWhitespace();
              if (ch !== code("(")) return;
              pos++;
              const ifInnerPos = pos;
              if (tryParseObjectHasOwnProperty(itId)) {
                ch = commentWhitespace();
                if (ch !== code(")")) return;
                pos++;
                ch = commentWhitespace();
                if (!readReturn()) return;
                if (ch === code("i") && at(pos + 1) === code("f")) {
                  pos += 2;
                  ch = commentWhitespace();
                  if (ch !== code("(")) return;
                  pos++;
                } else {
                  inIf = false;
                }
              } else {
                pos = ifInnerPos;
              }
              if (inIf) {
                if (!matchIdentifier(itId)) return;
                ch = commentWhitespace();
                if (ch !== code("i") || !matchesAt(pos + 1, "n ")) return;
                pos += 3;
                ch = commentWhitespace();
                if (!readExportsOrModuleDotExports(ch)) return;
                ch = commentWhitespace();
                if (ch !== code("&") || at(pos + 1) !== code("&")) return;
                pos += 2;
                ch = commentWhitespace();
                if (!readExportsOrModuleDotExports(ch)) return;
                ch = commentWhitespace();
                if (ch !== code("[")) return;
                pos++;
                commentWhitespace();
                if (!matchIdentifier(itId)) return;
                ch = commentWhitespace();
                if (ch !== code("]")) return;
                pos++;
                ch = commentWhitespace();
                if (ch !== code("=") || !matchesAt(pos + 1, "==")) return;
                pos += 3;
                commentWhitespace();
                if (!matchIdentifier(id)) return;
                ch = commentWhitespace();
                if (ch !== code("[")) return;
                pos++;
                commentWhitespace();
                if (!matchIdentifier(itId)) return;
                ch = commentWhitespace();
                if (ch !== code("]")) return;
                pos++;
                ch = commentWhitespace();
                if (ch !== code(")")) return;
                pos++;
                ch = commentWhitespace();
                if (!readReturn()) return;
              }
            }
          } else if (ch === code("!")) {
            if (!matchesAt(pos + 1, "==")) return;
            pos += 3;
            ch = commentWhitespace();
            if (!readQuoted("default")) return;
            if (ch === code("&")) {
              if (at(pos + 1) !== code("&")) return;
              pos += 2;
              ch = commentWhitespace();
              if (ch !== code("!")) return;
              pos++;
              ch = commentWhitespace();
              if (ch === code("O") && matchesAt(pos + 1, "bject.")) {
                if (!tryParseObjectHasOwnProperty(itId)) return;
              } else if (identifier(ch)) {
                ch = commentWhitespace();
                if (ch !== code(".")) return;
                pos++;
                ch = commentWhitespace();
                if (ch !== code("h") || !matchesAt(pos + 1, "asOwnProperty")) return;
                pos += 14;
                ch = commentWhitespace();
                if (ch !== code("(")) return;
                pos++;
                commentWhitespace();
                if (!matchIdentifier(itId)) return;
                ch = commentWhitespace();
                if (ch !== code(")")) return;
                pos++;
              }
              ch = commentWhitespace();
            }
            if (ch !== code(")")) return;
            pos++;
            ch = commentWhitespace();
          } else {
            return;
          }
          if (readExportsOrModuleDotExports(ch)) {
            ch = commentWhitespace();
            if (ch !== code("[")) return;
            pos++;
            commentWhitespace();
            if (!matchIdentifier(itId)) return;
            ch = commentWhitespace();
            if (ch !== code("]")) return;
            pos++;
            ch = commentWhitespace();
            if (ch !== code("=")) return;
            pos++;
            commentWhitespace();
            if (!matchIdentifier(id)) return;
            ch = commentWhitespace();
            if (ch !== code("[")) return;
            pos++;
            commentWhitespace();
            if (!matchIdentifier(itId)) return;
            ch = commentWhitespace();
            if (ch !== code("]")) return;
            pos++;
            ch = commentWhitespace();
            if (ch === code(";")) {
              pos++;
              ch = commentWhitespace();
            }
          } else if (ch === code("O")) {
            if (!matchesAt(pos + 1, "bject")) return;
            pos += 6;
            ch = commentWhitespace();
            if (ch !== code(".")) return;
            pos++;
            ch = commentWhitespace();
            if (ch !== code("d") || !matchesAt(pos + 1, "efineProperty")) return;
            pos += 14;
            ch = commentWhitespace();
            if (ch !== code("(")) return;
            pos++;
            ch = commentWhitespace();
            if (!readExportsOrModuleDotExports(ch)) return;
            ch = commentWhitespace();
            if (ch !== code(",")) return;
            pos++;
            commentWhitespace();
            if (!matchIdentifier(itId)) return;
            ch = commentWhitespace();
            if (ch !== code(",")) return;
            pos++;
            ch = commentWhitespace();
            if (ch !== code("{")) return;
            pos++;
            ch = commentWhitespace();
            if (ch !== code("e") || !matchesAt(pos + 1, "numerable")) return;
            pos += 10;
            ch = commentWhitespace();
            if (ch !== code(":")) return;
            pos++;
            ch = commentWhitespace();
            if (ch !== code("t") || !matchesAt(pos + 1, "rue")) return;
            pos += 4;
            ch = commentWhitespace();
            if (ch !== code(",")) return;
            pos++;
            ch = commentWhitespace();
            if (ch !== code("g")) return;
            const isGetter = tryParseGetter(() => {
              if (!matchIdentifier(id)) return false;
              ch = commentWhitespace();
              if (ch !== code("[")) return false;
              pos++;
              commentWhitespace();
              if (!matchIdentifier(itId)) return false;
              ch = commentWhitespace();
              if (ch !== code("]")) return false;
              pos++;
              return true;
            });
            if (!isGetter) return;
            pos++;
            ch = commentWhitespace();
            if (ch === code(";")) {
              pos++;
              ch = commentWhitespace();
            }
          } else {
            return;
          }
          if (ch !== code("}")) return;
          pos++;
          ch = commentWhitespace();
          if (ch !== code(")")) return;
          const binding = starExportStack
            .slice(0, starExportIndex)
            .find(
              (candidate) =>
                candidate.id !== undefined &&
                candidate.id[1] - candidate.id[0] === id[1] - id[0] &&
                matchesBytes(candidate.id[0], id),
            );
          if (binding?.specifier !== undefined) {
            addReexport(binding.specifier[0], binding.specifier[1]);
            pos = revertPos;
          }
          return "done";
        })();
        if (parsed === "done") return;
      }
    }
    pos = revertPos;
  };
  const tryBacktrackAddStarExportBinding = (start: number) => {
    let bPos = start;
    if (bPos < 0) return;
    while (bPos > 0 && at(bPos) === code(" ")) bPos--;
    if (at(bPos) !== code("=")) return;
    if (bPos <= 0) return;
    bPos--;
    while (bPos > 0 && at(bPos) === code(" ")) bPos--;
    const idEnd = bPos;
    let identifierStart = false;
    while (bPos > 0) {
      const ch = at(bPos);
      if (!IDENTIFIER_CHARACTERS[ch]) break;
      identifierStart = IDENTIFIER_STARTS[ch];
      bPos--;
    }
    if (!identifierStart || at(bPos) !== code(" ")) return;
    if (starExportIndex === starExportStackEnd) return;
    starExportStack[starExportIndex].id = [bPos + 1, idEnd + 1];
    while (bPos > 0 && at(bPos) === code(" ")) bPos--;
    if (at(bPos) === code("r")) {
      if (!readPrecedingKeyword(bPos - 1, "va")) return;
    } else if (at(bPos) === code("t")) {
      if (!readPrecedingKeyword(bPos - 1, "le") && !readPrecedingKeyword(bPos - 1, "cons")) return;
    } else {
      return;
    }
    starExportIndex++;
  };
  const throwIfImportStatement = () => {
    const startPos = pos;
    pos += 6;
    let ch = commentWhitespace();
    if (ch === code("(")) {
      openTokenTypeStack[openTokenDepth] = "(";
      openTokenPosStack[openTokenDepth++] = startPos;
      return;
    }
    if (ch === code(".")) {
      pos++;
      ch = commentWhitespace();
      if (ch === code("m") && pos + 4 <= end && matchesAt(pos + 1, "eta")) {
        if (pos + 4 < end && IDENTIFIER_CHARACTERS[at(pos + 4)]) return;
        syntaxError();
      }
      return;
    }
    const isStatementStart = [code('"'), code("'"), code("{"), code("*")].includes(ch);
    if (!isStatementStart && pos === startPos + 6) return;
    if (openTokenDepth !== 0) {
      pos--;
      return;
    }
    syntaxError();
  };
  const throwIfExportStatement = () => {
    pos += 6;
    const curPos = pos;
    const ch = commentWhitespace();
    if (pos === curPos && !PUNCTUATORS[ch]) return;
    syntaxError();
  };

  const isAnalyzed = (() => {
    let ch = 0;
    if (end >= 2 && at(0) === code("#") && at(1) === code("!")) {
      if (end === 2) return true;
      pos += 2;
      while (pos < end) {
        ch = at(pos);
        if (ch === 10 || ch === 13) break;
        pos++;
      }
      lastTokenPos = pos;
    }
    while (pos++ < end) {
      if (openTokenDepth >= STACK_DEPTH) return undefined;
      ch = at(pos);
      if (ch === 32 || (ch < 14 && ch > 8)) continue;
      if (openTokenDepth === 0) {
        if (ch === code("i")) {
          if (pos + 6 < end && matchesAt(pos + 1, "mport") && keywordStart(pos)) {
            throwIfImportStatement();
          }
          lastTokenPos = pos;
          continue;
        }
        if (ch === code("r")) {
          const startPos = pos;
          if (tryParseRequire(RequireType.Import) && keywordStart(startPos)) {
            tryBacktrackAddStarExportBinding(startPos - 1);
          }
          lastTokenPos = pos;
          continue;
        }
        if (ch === code("_")) {
          if (
            pos + 23 < end &&
            matchesAt(pos + 1, "interopRequireWildcard") &&
            (keywordStart(pos) || at(pos - 1) === code("."))
          ) {
            const startPos = pos;
            pos += 23;
            if (at(pos) === code("(")) {
              pos++;
              openTokenTypeStack[openTokenDepth] = "(";
              openTokenPosStack[openTokenDepth++] = lastTokenPos;
              if (tryParseRequire(RequireType.Import) && keywordStart(startPos)) {
                tryBacktrackAddStarExportBinding(startPos - 1);
              }
            }
          } else if (
            pos + 8 < end &&
            matchesAt(pos + 1, "_export") &&
            (keywordStart(pos) || at(pos - 1) === code("."))
          ) {
            pos += 8;
            if (pos + 4 < end && matchesAt(pos, "Star")) pos += 4;
            if (at(pos) === code("(")) {
              openTokenTypeStack[openTokenDepth] = "(";
              openTokenPosStack[openTokenDepth++] = lastTokenPos;
              if (at(pos + 1) === code("r")) {
                pos++;
                tryParseRequire(RequireType.ExportStar);
              }
            }
          }
          lastTokenPos = pos;
          continue;
        }
      }
      switch (String.fromCharCode(ch)) {
        case "e":
          if (pos + 6 < end && matchesAt(pos + 1, "xport") && keywordStart(pos)) {
            if (pos + 7 < end && at(pos + 6) === code("s")) tryParseExportsDotAssign(false);
            else if (openTokenDepth === 0) throwIfExportStatement();
          }
          break;
        case "c":
          if (keywordStart(pos) && matchesAt(pos + 1, "lass") && BREAKS_OR_SPACES[at(pos + 5)]) {
            nextBraceIsClass = true;
          }
          break;
        case "m":
          if (pos + 6 < end && matchesAt(pos + 1, "odule") && keywordStart(pos)) {
            tryParseModuleExportsDotAssign();
          }
          break;
        case "O":
          if (pos + 6 < end && matchesAt(pos + 1, "bject") && keywordStart(pos)) {
            tryParseObjectDefineOrKeys(openTokenDepth === 0);
          }
          break;
        case "(":
          openTokenTypeStack[openTokenDepth] = "(";
          openTokenPosStack[openTokenDepth++] = lastTokenPos;
          break;
        case ")":
          if (openTokenDepth === 0) return undefined;
          openTokenDepth--;
          break;
        case "{":
          openClassPosStack[openTokenDepth] = nextBraceIsClass;
          nextBraceIsClass = false;
          openTokenTypeStack[openTokenDepth] = "{";
          openTokenPosStack[openTokenDepth++] = lastTokenPos;
          break;
        case "}":
          if (openTokenDepth === 0) return undefined;
          if (openTokenDepth-- === templateDepth) {
            templateDepth = templateStack[--templateStackDepth];
            templateString();
          } else if (templateDepth !== NO_TEMPLATE && openTokenDepth < templateDepth) {
            return undefined;
          }
          break;
        case "'":
        case '"':
          stringLiteral(ch);
          break;
        case "/": {
          const next = pos + 1 < end ? at(pos + 1) : 0;
          if (next === code("/")) {
            lineComment();
            continue;
          }
          if (next === code("*")) {
            blockComment();
            continue;
          }
          const isStartOfInput = lastTokenPos < 0;
          const lastToken = isStartOfInput ? 0 : at(lastTokenPos);
          const isDigit = (byte: number) => byte >= code("0") && byte <= code("9");
          const openPos = openTokenPosStack[openTokenDepth] ?? -1;
          const isRegex =
            (EXPRESSION_PUNCTUATORS[lastToken] &&
              !(lastToken === code(".") && lastTokenPos > 0 && isDigit(at(lastTokenPos - 1))) &&
              !(
                lastToken === code("+") &&
                lastTokenPos > 0 &&
                at(lastTokenPos - 1) === code("+")
              ) &&
              !(
                lastToken === code("-") &&
                lastTokenPos > 0 &&
                at(lastTokenPos - 1) === code("-")
              )) ||
            (lastToken === code(")") && isParenKeyword(openPos)) ||
            (lastToken === code("}") &&
              (openPos < 0 ||
                isExpressionTerminator(openPos) ||
                openClassPosStack[openTokenDepth] === true)) ||
            (lastToken === code("/") && lastSlashWasDivision) ||
            (!isStartOfInput && isExpressionKeyword(lastTokenPos)) ||
            lastToken === 0 ||
            isStartOfInput;
          if (isRegex) {
            regularExpression();
            lastSlashWasDivision = false;
          } else {
            lastSlashWasDivision = true;
          }
          break;
        }
        case "`":
          if (templateDepth === NO_TEMPLATE - 1) return undefined;
          templateString();
          break;
        default:
          break;
      }
      lastTokenPos = pos;
    }
    return templateDepth === NO_TEMPLATE && openTokenDepth === 0 && !hasError;
  })();
  const decode = (bytes: number[]) => Buffer.from(bytes).toString("utf8");
  return isAnalyzed === true
    ? { exports: exports.map(decode), reexports: reexports.map(decode) }
    : { exports: [], reexports: [] };
};
