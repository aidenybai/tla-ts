// V8's scanner (src/parsing/scanner.cc), as Node 26's V8 14.6 tokenizes JavaScript: its tokens in
// V8's order, which the parser's range checks rely on, and the errors and octal positions that it
// records as it scans.

export const TOKEN = {
  TemplateSpan: 0,
  TemplateTail: 1,
  Period: 2,
  LeftBracket: 3,
  QuestionPeriod: 4,
  LeftParen: 5,
  RightParen: 6,
  RightBracket: 7,
  LeftBrace: 8,
  Colon: 9,
  Ellipsis: 10,
  Conditional: 11,
  Semicolon: 12,
  RightBrace: 13,
  Eos: 14,
  Arrow: 15,
  Init: 16,
  Assign: 17,
  AssignNullish: 18,
  AssignOr: 19,
  AssignAnd: 20,
  AssignBitOr: 21,
  AssignBitXor: 22,
  AssignBitAnd: 23,
  AssignShl: 24,
  AssignSar: 25,
  AssignShr: 26,
  AssignMul: 27,
  AssignDiv: 28,
  AssignMod: 29,
  AssignExp: 30,
  AssignAdd: 31,
  AssignSub: 32,
  Comma: 33,
  Nullish: 34,
  Or: 35,
  And: 36,
  BitOr: 37,
  BitXor: 38,
  BitAnd: 39,
  Shl: 40,
  Sar: 41,
  Shr: 42,
  Mul: 43,
  Div: 44,
  Mod: 45,
  Exp: 46,
  Add: 47,
  Sub: 48,
  Not: 49,
  BitNot: 50,
  Delete: 51,
  TypeOf: 52,
  Void: 53,
  Inc: 54,
  Dec: 55,
  Eq: 56,
  EqStrict: 57,
  NotEq: 58,
  NotEqStrict: 59,
  LessThan: 60,
  GreaterThan: 61,
  LessThanEq: 62,
  GreaterThanEq: 63,
  InstanceOf: 64,
  In: 65,
  Break: 66,
  Case: 67,
  Catch: 68,
  Continue: 69,
  Debugger: 70,
  Default: 71,
  Do: 72,
  Else: 73,
  Finally: 74,
  For: 75,
  Function: 76,
  If: 77,
  New: 78,
  Return: 79,
  Switch: 80,
  Throw: 81,
  Try: 82,
  Var: 83,
  While: 84,
  With: 85,
  This: 86,
  NullLiteral: 87,
  TrueLiteral: 88,
  FalseLiteral: 89,
  Number: 90,
  Smi: 91,
  BigInt: 92,
  String: 93,
  Super: 94,
  Identifier: 95,
  Get: 96,
  Set: 97,
  Using: 98,
  Of: 99,
  Accessor: 100,
  Async: 101,
  Await: 102,
  Yield: 103,
  Let: 104,
  Static: 105,
  FutureStrictReservedWord: 106,
  EscapedStrictReservedWord: 107,
  Enum: 108,
  Class: 109,
  Const: 110,
  Export: 111,
  Extends: 112,
  Import: 113,
  PrivateName: 114,
  Illegal: 115,
  EscapedKeyword: 116,
  Whitespace: 117,
  Uninitialized: 118,
  RegExpLiteral: 119,
} as const;

// Each token's text, which V8's message for an unexpected token quotes, and which is undefined for
// a token of no fixed text.
const TOKEN_STRINGS = [
  undefined,
  undefined,
  ".",
  "[",
  "?.",
  "(",
  ")",
  "]",
  "{",
  ":",
  "...",
  "?",
  ";",
  "}",
  "EOS",
  "=>",
  "=init",
  "=",
  "??=",
  "||=",
  "&&=",
  "|=",
  "^=",
  "&=",
  "<<=",
  ">>=",
  ">>>=",
  "*=",
  "/=",
  "%=",
  "**=",
  "+=",
  "-=",
  ",",
  "??",
  "||",
  "&&",
  "|",
  "^",
  "&",
  "<<",
  ">>",
  ">>>",
  "*",
  "/",
  "%",
  "**",
  "+",
  "-",
  "!",
  "~",
  "delete",
  "typeof",
  "void",
  "++",
  "--",
  "==",
  "===",
  "!=",
  "!==",
  "<",
  ">",
  "<=",
  ">=",
  "instanceof",
  "in",
  "break",
  "case",
  "catch",
  "continue",
  "debugger",
  "default",
  "do",
  "else",
  "finally",
  "for",
  "function",
  "if",
  "new",
  "return",
  "switch",
  "throw",
  "try",
  "var",
  "while",
  "with",
  "this",
  "null",
  "true",
  "false",
  undefined,
  undefined,
  undefined,
  undefined,
  "super",
  undefined,
  "get",
  "set",
  "using",
  "of",
  "accessor",
  "async",
  "await",
  "yield",
  "let",
  "static",
  undefined,
  undefined,
  "enum",
  "class",
  "const",
  "export",
  "extends",
  "import",
  undefined,
  "ILLEGAL",
  undefined,
  undefined,
  undefined,
  undefined,
];

export const getTokenString = (token: number) => TOKEN_STRINGS[token];

const BINARY_PRECEDENCES = new Map<number, number>([
  [TOKEN.Comma, 1],
  [TOKEN.Nullish, 3],
  [TOKEN.Or, 4],
  [TOKEN.And, 5],
  [TOKEN.BitOr, 6],
  [TOKEN.BitXor, 7],
  [TOKEN.BitAnd, 8],
  [TOKEN.Shl, 11],
  [TOKEN.Sar, 11],
  [TOKEN.Shr, 11],
  [TOKEN.Mul, 13],
  [TOKEN.Div, 13],
  [TOKEN.Mod, 13],
  [TOKEN.Exp, 14],
  [TOKEN.Add, 12],
  [TOKEN.Sub, 12],
  [TOKEN.Eq, 9],
  [TOKEN.EqStrict, 9],
  [TOKEN.NotEq, 9],
  [TOKEN.NotEqStrict, 9],
  [TOKEN.LessThan, 10],
  [TOKEN.GreaterThan, 10],
  [TOKEN.LessThanEq, 10],
  [TOKEN.GreaterThanEq, 10],
  [TOKEN.InstanceOf, 10],
  [TOKEN.In, 10],
]);

export const getPrecedence = (token: number, isInAccepted: boolean) =>
  token === TOKEN.In && !isInAccepted ? 0 : (BINARY_PRECEDENCES.get(token) ?? 0);

const isInRange = (token: number, low: number, high: number) => token >= low && token <= high;

export const isAnyIdentifier = (token: number) =>
  isInRange(token, TOKEN.Identifier, TOKEN.EscapedStrictReservedWord);
export const isStrictReservedWord = (token: number) =>
  isInRange(token, TOKEN.Yield, TOKEN.EscapedStrictReservedWord);
export const isLiteral = (token: number) => isInRange(token, TOKEN.NullLiteral, TOKEN.String);
export const isMember = (token: number) => isInRange(token, TOKEN.TemplateSpan, TOKEN.LeftBracket);
export const isProperty = (token: number) => isInRange(token, TOKEN.Period, TOKEN.LeftBracket);
export const isPropertyOrCall = (token: number) =>
  isInRange(token, TOKEN.TemplateSpan, TOKEN.LeftParen);
export const isArrowOrAssignmentOp = (token: number) =>
  isInRange(token, TOKEN.Arrow, TOKEN.AssignSub);
export const isLogicalAssignmentOp = (token: number) =>
  isInRange(token, TOKEN.AssignNullish, TOKEN.AssignAnd);
export const isAutoSemicolon = (token: number) => isInRange(token, TOKEN.Semicolon, TOKEN.Eos);
export const isCallable = (token: number) =>
  isInRange(token, TOKEN.Super, TOKEN.EscapedStrictReservedWord);
export const isUnaryOp = (token: number) => isInRange(token, TOKEN.Add, TOKEN.Void);
export const isCountOp = (token: number) => isInRange(token, TOKEN.Inc, TOKEN.Dec);
export const isUnaryOrCountOp = (token: number) => isInRange(token, TOKEN.Add, TOKEN.Dec);
export const isCompareOp = (token: number) => isInRange(token, TOKEN.Eq, TOKEN.In);
const isKeyword = (token: number) =>
  isInRange(token, TOKEN.Delete, TOKEN.Void) ||
  isInRange(token, TOKEN.InstanceOf, TOKEN.This) ||
  isInRange(token, TOKEN.NullLiteral, TOKEN.FalseLiteral) ||
  token === TOKEN.Super ||
  isInRange(token, TOKEN.Get, TOKEN.Static) ||
  isInRange(token, TOKEN.Enum, TOKEN.Import);
export const isPropertyName = (token: number) =>
  isAnyIdentifier(token) || token === TOKEN.EscapedKeyword || isKeyword(token);

// Whether a token names a binding in code of the given strictness, inside a generator or not, and
// where await is reserved or not.
export const isValidIdentifier = (
  token: number,
  isStrict: boolean,
  isGenerator: boolean,
  isAwaitDisallowed: boolean,
) => {
  if (isInRange(token, TOKEN.Identifier, TOKEN.Async)) return true;
  if (token === TOKEN.Await) return !isAwaitDisallowed;
  if (token === TOKEN.Yield) return !isGenerator && !isStrict;
  return isStrictReservedWord(token) && !isStrict;
};

const KEYWORDS = new Map<string, number>([
  ["async", TOKEN.Async],
  ["await", TOKEN.Await],
  ["break", TOKEN.Break],
  ["case", TOKEN.Case],
  ["catch", TOKEN.Catch],
  ["class", TOKEN.Class],
  ["const", TOKEN.Const],
  ["continue", TOKEN.Continue],
  ["debugger", TOKEN.Debugger],
  ["default", TOKEN.Default],
  ["delete", TOKEN.Delete],
  ["do", TOKEN.Do],
  ["else", TOKEN.Else],
  ["enum", TOKEN.Enum],
  ["export", TOKEN.Export],
  ["extends", TOKEN.Extends],
  ["false", TOKEN.FalseLiteral],
  ["finally", TOKEN.Finally],
  ["for", TOKEN.For],
  ["function", TOKEN.Function],
  ["get", TOKEN.Get],
  ["if", TOKEN.If],
  ["implements", TOKEN.FutureStrictReservedWord],
  ["import", TOKEN.Import],
  ["in", TOKEN.In],
  ["instanceof", TOKEN.InstanceOf],
  ["interface", TOKEN.FutureStrictReservedWord],
  ["let", TOKEN.Let],
  ["new", TOKEN.New],
  ["null", TOKEN.NullLiteral],
  ["of", TOKEN.Of],
  ["package", TOKEN.FutureStrictReservedWord],
  ["private", TOKEN.FutureStrictReservedWord],
  ["protected", TOKEN.FutureStrictReservedWord],
  ["public", TOKEN.FutureStrictReservedWord],
  ["return", TOKEN.Return],
  ["set", TOKEN.Set],
  ["static", TOKEN.Static],
  ["super", TOKEN.Super],
  ["switch", TOKEN.Switch],
  ["this", TOKEN.This],
  ["throw", TOKEN.Throw],
  ["true", TOKEN.TrueLiteral],
  ["try", TOKEN.Try],
  ["typeof", TOKEN.TypeOf],
  ["using", TOKEN.Using],
  ["var", TOKEN.Var],
  ["void", TOKEN.Void],
  ["while", TOKEN.While],
  ["with", TOKEN.With],
  ["yield", TOKEN.Yield],
]);

const ONE_CHAR_TOKENS = new Map<string, number>([
  ["(", TOKEN.LeftParen],
  [")", TOKEN.RightParen],
  ["{", TOKEN.LeftBrace],
  ["}", TOKEN.RightBrace],
  ["[", TOKEN.LeftBracket],
  ["]", TOKEN.RightBracket],
  ["?", TOKEN.Conditional],
  [":", TOKEN.Colon],
  [";", TOKEN.Semicolon],
  [",", TOKEN.Comma],
  [".", TOKEN.Period],
  ["|", TOKEN.BitOr],
  ["&", TOKEN.BitAnd],
  ["^", TOKEN.BitXor],
  ["~", TOKEN.BitNot],
  ["!", TOKEN.Not],
  ["<", TOKEN.LessThan],
  [">", TOKEN.GreaterThan],
  ["%", TOKEN.Mod],
  ["=", TOKEN.Assign],
  ["+", TOKEN.Add],
  ["-", TOKEN.Sub],
  ["*", TOKEN.Mul],
  ["/", TOKEN.Div],
  ["#", TOKEN.PrivateName],
  ['"', TOKEN.String],
  ["'", TOKEN.String],
  ["`", TOKEN.TemplateSpan],
  ["\\", TOKEN.Identifier],
  [" ", TOKEN.Whitespace],
  ["\t", TOKEN.Whitespace],
  ["\v", TOKEN.Whitespace],
  ["\f", TOKEN.Whitespace],
  ["\r", TOKEN.Whitespace],
  ["\n", TOKEN.Whitespace],
]);

const END_OF_INPUT = -1;
// V8's invalid code point, which no predicate accepts.
const INVALID = -2;

const isDecimalDigit = (code: number) => code >= 0x30 && code <= 0x39;
const isOctalDigit = (code: number) => code >= 0x30 && code <= 0x37;
const isNonOctalDecimalDigit = (code: number) => code === 0x38 || code === 0x39;
const isBinaryDigit = (code: number) => code === 0x30 || code === 0x31;
const getHexValue = (code: number) =>
  isDecimalDigit(code)
    ? code - 0x30
    : code >= 0x61 && code <= 0x66
      ? code - 0x61 + 10
      : code >= 0x41 && code <= 0x46
        ? code - 0x41 + 10
        : -1;
const isHexDigit = (code: number) => getHexValue(code) >= 0;
const isAsciiIdentifier = (code: number) =>
  (code >= 0x61 && code <= 0x7a) ||
  (code >= 0x41 && code <= 0x5a) ||
  isDecimalDigit(code) ||
  code === 0x24 ||
  code === 0x5f;
const toLowerAscii = (code: number) => (code >= 0x41 && code <= 0x5a ? code + 0x20 : code);

const ID_START = /\p{ID_Start}/u;
const ID_CONTINUE = /\p{ID_Continue}/u;
const SPACE_SEPARATOR = /\p{Zs}/u;

const isIdentifierStart = (code: number) => {
  if (code < 0) return false;
  if (code < 0x80) return (isAsciiIdentifier(code) && !isDecimalDigit(code)) || code === 0x5c;
  return ID_START.test(String.fromCodePoint(code));
};

const isIdentifierPart = (code: number) => {
  if (code < 0) return false;
  if (code < 0x80) return isAsciiIdentifier(code) || code === 0x5c;
  return code === 0x200c || code === 0x200d || ID_CONTINUE.test(String.fromCodePoint(code));
};

export const isLineTerminator = (code: number) =>
  code === 0x0a || code === 0x0d || code === 0x2028 || code === 0x2029;

const isWhiteSpace = (code: number) =>
  code === 0x09 ||
  code === 0x0b ||
  code === 0x0c ||
  code === 0x20 ||
  code === 0xfeff ||
  (code >= 0x80 && SPACE_SEPARATOR.test(String.fromCodePoint(code)));

const isWhiteSpaceOrLineTerminator = (code: number) =>
  code >= 0 && (isWhiteSpace(code) || isLineTerminator(code));

const isLeadSurrogate = (code: number) => code >= 0xd800 && code <= 0xdbff;
const isTrailSurrogate = (code: number) => code >= 0xdc00 && code <= 0xdfff;

// The regular expression flags that V8 reads, by their letter.
const REGEXP_FLAGS = new Set("dgimsuvy");

const NUMBER_KIND = {
  ImplicitOctal: 0,
  Binary: 1,
  Octal: 2,
  Hex: 3,
  Decimal: 4,
  DecimalWithLeadingZero: 5,
} as const;

const isDecimalNumberKind = (kind: number) =>
  kind === NUMBER_KIND.Decimal || kind === NUMBER_KIND.DecimalWithLeadingZero;
const isValidBigIntKind = (kind: number) =>
  kind === NUMBER_KIND.Binary ||
  kind === NUMBER_KIND.Octal ||
  kind === NUMBER_KIND.Hex ||
  kind === NUMBER_KIND.Decimal;

export interface Location {
  start: number;
  end: number;
}

// An error that the scanner records, by its MessageTemplate's name in V8.
interface ScannerError {
  message: string;
  location: Location;
}

interface TokenDesc {
  token: number;
  start: number;
  end: number;
  isAfterLineTerminator: boolean;
  literal: string;
  invalidTemplateEscape: ScannerError | undefined;
}

const createTokenDesc = (): TokenDesc => ({
  token: TOKEN.Uninitialized,
  start: 0,
  end: 0,
  isAfterLineTerminator: false,
  literal: "",
  invalidTemplateEscape: undefined,
});

export const INVALID_LOCATION: Location = { start: -1, end: 0 };

export const createScanner = (source: string, isModule: boolean) => {
  // The code point that the scanner looks at, and the position of its first code unit.
  let lookahead = END_OF_INPUT;
  const getLookahead = () => lookahead;
  let position = -1;
  let isParserError = false;
  let scannerError: ScannerError | undefined;
  let octalLocation = INVALID_LOCATION;
  let octalMessage = "";
  let current = createTokenDesc();
  let next = createTokenDesc();
  let nextNext = createTokenDesc();
  let nextNextNext = createTokenDesc();
  // The token that the scanner fills in.
  let scanning = next;
  let literal: string[] = [];

  const getSourcePosition = () => position;
  const readAt = (index: number) =>
    isParserError || index >= source.length || index < 0 ? END_OF_INPUT : source.charCodeAt(index);
  // The position past getLookahead(), which is two code units past it where getLookahead() is a surrogate pair's.
  let nextIndex = 0;
  const advance = () => {
    position = nextIndex;
    lookahead = readAt(nextIndex);
    nextIndex += 1;
  };
  const peekChar = () => readAt(nextIndex);
  const pushBack = (code: number) => {
    nextIndex -= 1;
    position = nextIndex - 1;
    lookahead = code;
  };
  const combineSurrogatePair = () => {
    if (!isLeadSurrogate(getLookahead())) return false;
    const trail = readAt(nextIndex);
    if (!isTrailSurrogate(trail)) return false;
    lookahead = 0x10000 + ((getLookahead() - 0xd800) << 10) + (trail - 0xdc00);
    position = nextIndex;
    nextIndex += 1;
    return true;
  };
  const addLiteralChar = (code: number) => {
    literal.push(String.fromCodePoint(code));
  };
  const addLiteralCharAdvance = () => {
    addLiteralChar(getLookahead());
    advance();
  };
  const startLiteral = () => {
    literal = [];
  };
  const reportScannerError = (location: Location, message: string) => {
    if (scannerError !== undefined) return;
    scannerError = { message, location };
  };
  const select = (token: number) => {
    advance();
    return token;
  };
  const selectIf = (code: string, then: number, otherwise: number) => {
    advance();
    if (getLookahead() === code.charCodeAt(0)) {
      advance();
      return then;
    }
    return otherwise;
  };

  const scanHexNumber = (expectedLength: number, isUnicode: boolean) => {
    const begin = getSourcePosition() - 2;
    let value = 0;
    for (let index = 0; index < expectedLength; index += 1) {
      const digit = getHexValue(getLookahead());
      if (digit < 0) {
        reportScannerError(
          { start: begin, end: begin + expectedLength + 2 },
          isUnicode ? "kInvalidUnicodeEscapeSequence" : "kInvalidHexEscapeSequence",
        );
        return INVALID;
      }
      value = value * 16 + digit;
      advance();
    }
    return value;
  };

  const scanUnlimitedLengthHexNumber = (maxValue: number, begin: number) => {
    let value = 0;
    let digit = getHexValue(getLookahead());
    if (digit < 0) return INVALID;
    while (digit >= 0) {
      value = value * 16 + digit;
      if (value > maxValue) {
        reportScannerError(
          { start: begin, end: getSourcePosition() + 1 },
          "kUndefinedUnicodeCodePoint",
        );
        return INVALID;
      }
      advance();
      digit = getHexValue(getLookahead());
    }
    return value;
  };

  const scanUnicodeEscape = () => {
    if (getLookahead() === 0x7b) {
      const begin = getSourcePosition() - 2;
      advance();
      const codePoint = scanUnlimitedLengthHexNumber(0x10ffff, begin);
      if (codePoint === INVALID || getLookahead() !== 0x7d) {
        const at = getSourcePosition();
        reportScannerError({ start: at, end: at + 1 }, "kInvalidUnicodeEscapeSequence");
        return INVALID;
      }
      advance();
      return codePoint;
    }
    return scanHexNumber(4, true);
  };

  const scanIdentifierUnicodeEscape = () => {
    advance();
    if (getLookahead() !== 0x75) return INVALID;
    advance();
    return scanUnicodeEscape();
  };

  const scanOctalEscape = (code: number, length: number, isTemplate: boolean) => {
    let value = code - 0x30;
    let index = 0;
    for (; index < length; index += 1) {
      const digit = getLookahead() - 0x30;
      if (digit < 0 || digit > 7) break;
      const nextValue = value * 8 + digit;
      if (nextValue >= 256) break;
      value = nextValue;
      advance();
    }
    if (code !== 0x30 || index > 0 || isNonOctalDecimalDigit(getLookahead())) {
      octalLocation = { start: getSourcePosition() - index - 1, end: getSourcePosition() - 1 };
      octalMessage = isTemplate ? "kTemplateOctalLiteral" : "kStrictOctalEscape";
    }
    return value;
  };

  // Scans an escape sequence after its backslash, adding its character to the literal, and
  // returns whether it is valid.
  const scanEscape = (isTemplate: boolean) => {
    const code = getLookahead();
    advance();
    if (!isTemplate && isLineTerminator(code)) {
      if (code === 0x0d && getLookahead() === 0x0a) advance();
      return true;
    }
    const escaped = ((): number | undefined => {
      switch (code) {
        case 0x62:
          return 0x08;
        case 0x66:
          return 0x0c;
        case 0x6e:
          return 0x0a;
        case 0x72:
          return 0x0d;
        case 0x74:
          return 0x09;
        case 0x76:
          return 0x0b;
        case 0x75: {
          const value = scanUnicodeEscape();
          return value === INVALID ? undefined : value;
        }
        case 0x78: {
          const value = scanHexNumber(2, false);
          return value === INVALID ? undefined : value;
        }
        case 0x30:
        case 0x31:
        case 0x32:
        case 0x33:
        case 0x34:
        case 0x35:
        case 0x36:
        case 0x37:
          return scanOctalEscape(code, 2, isTemplate);
        case 0x38:
        case 0x39:
          octalLocation = { start: getSourcePosition() - 2, end: getSourcePosition() - 1 };
          octalMessage = isTemplate ? "kTemplate8Or9Escape" : "kStrict8Or9Escape";
          return code;
        default:
          return code;
      }
    })();
    if (escaped === undefined) return false;
    addLiteralChar(escaped);
    return true;
  };

  const scanString = () => {
    const quote = getLookahead();
    startLiteral();
    advance();
    for (;;) {
      while (
        getLookahead() >= 0 &&
        getLookahead() !== quote &&
        getLookahead() !== 0x5c &&
        getLookahead() !== 0x0a &&
        getLookahead() !== 0x0d
      ) {
        addLiteralCharAdvance();
      }
      while (getLookahead() === 0x5c) {
        advance();
        if (getLookahead() === END_OF_INPUT || !scanEscape(false)) return TOKEN.Illegal;
      }
      if (getLookahead() === quote) {
        advance();
        return TOKEN.String;
      }
      if (getLookahead() === END_OF_INPUT || getLookahead() === 0x0a || getLookahead() === 0x0d)
        return TOKEN.Illegal;
      if (getLookahead() !== 0x5c) addLiteralCharAdvance();
    }
  };

  // Scans an identifier from its first character, which the caller has seen starts one.
  const scanIdentifierOrKeywordInner = () => {
    const start = literal.length;
    let isEscaped = false;
    for (;;) {
      if (getLookahead() === 0x5c) {
        isEscaped = true;
        const code = scanIdentifierUnicodeEscape();
        const isValid = literal.length === start ? isIdentifierStart(code) : isIdentifierPart(code);
        if (code === 0x5c || !isValid) return TOKEN.Illegal;
        addLiteralChar(code);
      } else if (
        literal.length === start ||
        isIdentifierPart(getLookahead()) ||
        (combineSurrogatePair() && isIdentifierPart(getLookahead()))
      ) {
        addLiteralCharAdvance();
      } else {
        break;
      }
    }
    const keyword = KEYWORDS.get(literal.join(""));
    if (keyword === undefined) return TOKEN.Identifier;
    if (isInRange(keyword, TOKEN.Identifier, TOKEN.Yield)) return keyword;
    if (keyword === TOKEN.FutureStrictReservedWord) {
      return isEscaped ? TOKEN.EscapedStrictReservedWord : keyword;
    }
    if (!isEscaped) return keyword;
    if (isInRange(keyword, TOKEN.Let, TOKEN.Static)) return TOKEN.EscapedStrictReservedWord;
    return TOKEN.EscapedKeyword;
  };

  const scanIdentifierOrKeyword = () => {
    startLiteral();
    return scanIdentifierOrKeywordInner();
  };

  const skipWhiteSpace = () => {
    if (!isWhiteSpaceOrLineTerminator(getLookahead())) return TOKEN.Illegal;
    while (isWhiteSpaceOrLineTerminator(getLookahead())) {
      if (isLineTerminator(getLookahead())) scanning.isAfterLineTerminator = true;
      advance();
    }
    return TOKEN.Whitespace;
  };

  const skipSingleLineComment = () => {
    while (getLookahead() !== END_OF_INPUT && !isLineTerminator(getLookahead())) advance();
    return TOKEN.Whitespace;
  };

  const skipSingleHtmlComment = () => {
    if (isModule) {
      const at = getSourcePosition();
      reportScannerError({ start: at, end: at + 1 }, "kHtmlCommentInModule");
      return TOKEN.Illegal;
    }
    return skipSingleLineComment();
  };

  const skipMultiLineComment = () => {
    advance();
    while (getLookahead() !== END_OF_INPUT) {
      if (isLineTerminator(getLookahead())) scanning.isAfterLineTerminator = true;
      if (getLookahead() === 0x2a) {
        advance();
        if (getLookahead() === 0x2f) {
          advance();
          return TOKEN.Whitespace;
        }
      } else {
        advance();
      }
    }
    return TOKEN.Illegal;
  };

  const scanHtmlComment = () => {
    advance();
    if (getLookahead() !== 0x2d || peekChar() !== 0x2d) {
      pushBack(0x21);
      return TOKEN.LessThan;
    }
    advance();
    return skipSingleHtmlComment();
  };

  const scanPrivateName = () => {
    startLiteral();
    const at = getSourcePosition();
    advance();
    if (
      isIdentifierStart(getLookahead()) ||
      (combineSurrogatePair() && isIdentifierStart(getLookahead()))
    ) {
      addLiteralChar(0x23);
      return scanIdentifierOrKeywordInner() === TOKEN.Illegal ? TOKEN.Illegal : TOKEN.PrivateName;
    }
    reportScannerError({ start: at, end: at + 1 }, "kInvalidOrUnexpectedToken");
    return TOKEN.Illegal;
  };

  const scanDigitsWithNumericSeparators = (
    predicate: (code: number) => boolean,
    isFirstDigitChecked: boolean,
  ) => {
    if (isFirstDigitChecked && !predicate(getLookahead())) return false;
    let isSeparatorSeen = false;
    while (predicate(getLookahead()) || getLookahead() === 0x5f) {
      if (getLookahead() === 0x5f) {
        advance();
        if (getLookahead() === 0x5f) {
          const at = getSourcePosition();
          reportScannerError({ start: at, end: at + 1 }, "kContinuousNumericSeparator");
          return false;
        }
        isSeparatorSeen = true;
        continue;
      }
      isSeparatorSeen = false;
      addLiteralCharAdvance();
    }
    if (isSeparatorSeen) {
      const at = getSourcePosition();
      reportScannerError({ start: at, end: at + 1 }, "kTrailingNumericSeparator");
      return false;
    }
    return true;
  };

  const scanDecimalDigits = (isSeparatorAllowed: boolean) => {
    if (isSeparatorAllowed) return scanDigitsWithNumericSeparators(isDecimalDigit, false);
    while (isDecimalDigit(getLookahead())) addLiteralCharAdvance();
    if (getLookahead() === 0x5f) {
      const at = getSourcePosition();
      reportScannerError({ start: at, end: at + 1 }, "kInvalidOrUnexpectedToken");
      return false;
    }
    return true;
  };

  const scanSignedInteger = () => {
    if (getLookahead() === 0x2b || getLookahead() === 0x2d) addLiteralCharAdvance();
    if (!isDecimalDigit(getLookahead())) return false;
    return scanDecimalDigits(true);
  };

  const scanNumber = (isPeriodSeen: boolean) => {
    let kind: number = NUMBER_KIND.Decimal;
    let isSeenPeriod = isPeriodSeen;
    startLiteral();
    const start = getSourcePosition();
    if (isSeenPeriod) {
      addLiteralChar(0x2e);
      if (getLookahead() === 0x5f) return TOKEN.Illegal;
      if (!scanDecimalDigits(true)) return TOKEN.Illegal;
    } else {
      if (getLookahead() === 0x30) {
        addLiteralCharAdvance();
        const lower = toLowerAscii(getLookahead());
        if (lower === 0x78) {
          addLiteralCharAdvance();
          kind = NUMBER_KIND.Hex;
          if (!scanDigitsWithNumericSeparators(isHexDigit, true)) return TOKEN.Illegal;
        } else if (lower === 0x6f) {
          addLiteralCharAdvance();
          kind = NUMBER_KIND.Octal;
          if (!scanDigitsWithNumericSeparators(isOctalDigit, true)) return TOKEN.Illegal;
        } else if (lower === 0x62) {
          addLiteralCharAdvance();
          kind = NUMBER_KIND.Binary;
          if (!scanDigitsWithNumericSeparators(isBinaryDigit, true)) return TOKEN.Illegal;
        } else if (isOctalDigit(getLookahead())) {
          kind = NUMBER_KIND.ImplicitOctal;
          for (;;) {
            if (isNonOctalDecimalDigit(getLookahead())) {
              kind = NUMBER_KIND.DecimalWithLeadingZero;
              break;
            }
            if (!isOctalDigit(getLookahead())) {
              octalLocation = { start, end: getSourcePosition() };
              octalMessage = "kStrictOctalLiteral";
              break;
            }
            addLiteralCharAdvance();
          }
        } else if (isNonOctalDecimalDigit(getLookahead())) {
          kind = NUMBER_KIND.DecimalWithLeadingZero;
        } else if (getLookahead() === 0x5f) {
          const at = getSourcePosition();
          reportScannerError({ start: at, end: at + 1 }, "kZeroDigitNumericSeparator");
          return TOKEN.Illegal;
        }
      }
      if (isDecimalNumberKind(kind)) {
        if (!scanDecimalDigits(kind !== NUMBER_KIND.DecimalWithLeadingZero)) return TOKEN.Illegal;
        if (getLookahead() === 0x2e) {
          isSeenPeriod = true;
          addLiteralCharAdvance();
          if (getLookahead() === 0x5f) return TOKEN.Illegal;
          if (!scanDecimalDigits(true)) return TOKEN.Illegal;
        }
      }
    }
    let isBigInt = false;
    if (getLookahead() === 0x6e && !isSeenPeriod && isValidBigIntKind(kind)) {
      isBigInt = true;
      advance();
    } else if (toLowerAscii(getLookahead()) === 0x65) {
      if (!isDecimalNumberKind(kind)) return TOKEN.Illegal;
      addLiteralCharAdvance();
      if (!scanSignedInteger()) return TOKEN.Illegal;
    }
    if (isDecimalDigit(getLookahead()) || isIdentifierStart(getLookahead())) return TOKEN.Illegal;
    if (kind === NUMBER_KIND.DecimalWithLeadingZero) {
      octalLocation = { start, end: getSourcePosition() };
      octalMessage = "kStrictDecimalWithLeadingZero";
    }
    return isBigInt ? TOKEN.BigInt : TOKEN.Number;
  };

  const scanTemplateSpan = () => {
    const savedError = scannerError;
    const savedOctalLocation = octalLocation;
    const savedOctalMessage = octalMessage;
    scannerError = undefined;
    octalLocation = INVALID_LOCATION;
    octalMessage = "";
    // Moves an error of an escape into the token, where its first one stays.
    const moveErrors = () => {
      if (scannerError !== undefined) {
        scanning.invalidTemplateEscape ??= scannerError;
        scannerError = undefined;
      }
      if (octalMessage !== "") {
        scanning.invalidTemplateEscape ??= { message: octalMessage, location: octalLocation };
        octalLocation = INVALID_LOCATION;
        octalMessage = "";
      }
    };
    let result: number = TOKEN.TemplateSpan;
    startLiteral();
    for (;;) {
      const code = getLookahead();
      if (code === 0x60) {
        advance();
        result = TOKEN.TemplateTail;
        break;
      }
      if (code === 0x24 && peekChar() === 0x7b) {
        advance();
        advance();
        break;
      }
      if (code === 0x5c) {
        advance();
        if (isLineTerminator(getLookahead())) {
          const last = getLookahead();
          advance();
          if (last === 0x0d && getLookahead() === 0x0a) advance();
        } else {
          scanEscape(true);
          moveErrors();
        }
      } else if (code === END_OF_INPUT) {
        break;
      } else {
        advance();
        if (code === 0x0d && getLookahead() === 0x0a) advance();
      }
    }
    scanning.end = getSourcePosition();
    scanning.token = result;
    scannerError = savedError;
    octalLocation = savedOctalLocation;
    octalMessage = savedOctalMessage;
    return result;
  };

  const scanSingleToken = (): number => {
    for (;;) {
      scanning.start = getSourcePosition();
      const token = ((): number => {
        if (getLookahead() >= 0 && getLookahead() < 0x80) {
          const oneChar = ONE_CHAR_TOKENS.get(String.fromCharCode(getLookahead()));
          const charToken =
            oneChar ??
            (isDecimalDigit(getLookahead())
              ? TOKEN.Number
              : isAsciiIdentifier(getLookahead())
                ? TOKEN.Identifier
                : TOKEN.Illegal);
          switch (charToken) {
            case TOKEN.LeftParen:
            case TOKEN.RightParen:
            case TOKEN.LeftBrace:
            case TOKEN.RightBrace:
            case TOKEN.LeftBracket:
            case TOKEN.RightBracket:
            case TOKEN.Colon:
            case TOKEN.Semicolon:
            case TOKEN.Comma:
            case TOKEN.BitNot:
            case TOKEN.Illegal:
              return select(charToken);
            case TOKEN.Conditional:
              advance();
              if (getLookahead() === 0x2e) {
                advance();
                if (!isDecimalDigit(getLookahead())) return TOKEN.QuestionPeriod;
                pushBack(0x2e);
              } else if (getLookahead() === 0x3f) {
                return selectIf("=", TOKEN.AssignNullish, TOKEN.Nullish);
              }
              return TOKEN.Conditional;
            case TOKEN.String:
              return scanString();
            case TOKEN.LessThan:
              advance();
              if (getLookahead() === 0x3d) return select(TOKEN.LessThanEq);
              if (getLookahead() === 0x3c) return selectIf("=", TOKEN.AssignShl, TOKEN.Shl);
              if (getLookahead() === 0x21) return scanHtmlComment();
              return TOKEN.LessThan;
            case TOKEN.GreaterThan:
              advance();
              if (getLookahead() === 0x3d) return select(TOKEN.GreaterThanEq);
              if (getLookahead() === 0x3e) {
                advance();
                if (getLookahead() === 0x3d) return select(TOKEN.AssignSar);
                if (getLookahead() === 0x3e) return selectIf("=", TOKEN.AssignShr, TOKEN.Shr);
                return TOKEN.Sar;
              }
              return TOKEN.GreaterThan;
            case TOKEN.Assign:
              advance();
              if (getLookahead() === 0x3d) return selectIf("=", TOKEN.EqStrict, TOKEN.Eq);
              if (getLookahead() === 0x3e) return select(TOKEN.Arrow);
              return TOKEN.Assign;
            case TOKEN.Not:
              advance();
              if (getLookahead() === 0x3d) return selectIf("=", TOKEN.NotEqStrict, TOKEN.NotEq);
              return TOKEN.Not;
            case TOKEN.Add:
              advance();
              if (getLookahead() === 0x2b) return select(TOKEN.Inc);
              if (getLookahead() === 0x3d) return select(TOKEN.AssignAdd);
              return TOKEN.Add;
            case TOKEN.Sub:
              advance();
              if (getLookahead() === 0x2d) {
                advance();
                if (getLookahead() === 0x3e && scanning.isAfterLineTerminator)
                  return skipSingleHtmlComment();
                return TOKEN.Dec;
              }
              if (getLookahead() === 0x3d) return select(TOKEN.AssignSub);
              return TOKEN.Sub;
            case TOKEN.Mul:
              advance();
              if (getLookahead() === 0x2a) return selectIf("=", TOKEN.AssignExp, TOKEN.Exp);
              if (getLookahead() === 0x3d) return select(TOKEN.AssignMul);
              return TOKEN.Mul;
            case TOKEN.Mod:
              return selectIf("=", TOKEN.AssignMod, TOKEN.Mod);
            case TOKEN.Div:
              advance();
              if (getLookahead() === 0x2f) return skipSingleLineComment();
              if (getLookahead() === 0x2a) return skipMultiLineComment();
              if (getLookahead() === 0x3d) return select(TOKEN.AssignDiv);
              return TOKEN.Div;
            case TOKEN.BitAnd:
              advance();
              if (getLookahead() === 0x26) return selectIf("=", TOKEN.AssignAnd, TOKEN.And);
              if (getLookahead() === 0x3d) return select(TOKEN.AssignBitAnd);
              return TOKEN.BitAnd;
            case TOKEN.BitOr:
              advance();
              if (getLookahead() === 0x7c) return selectIf("=", TOKEN.AssignOr, TOKEN.Or);
              if (getLookahead() === 0x3d) return select(TOKEN.AssignBitOr);
              return TOKEN.BitOr;
            case TOKEN.BitXor:
              return selectIf("=", TOKEN.AssignBitXor, TOKEN.BitXor);
            case TOKEN.Period:
              advance();
              if (isDecimalDigit(getLookahead())) return scanNumber(true);
              if (getLookahead() === 0x2e && peekChar() === 0x2e) {
                advance();
                advance();
                return TOKEN.Ellipsis;
              }
              return TOKEN.Period;
            case TOKEN.TemplateSpan:
              advance();
              return scanTemplateSpan();
            case TOKEN.PrivateName:
              if (getSourcePosition() === 0 && peekChar() === 0x21) return skipSingleLineComment();
              return scanPrivateName();
            case TOKEN.Whitespace:
              return skipWhiteSpace();
            case TOKEN.Number:
              return scanNumber(false);
            default:
              return scanIdentifierOrKeyword();
          }
        }
        if (
          isIdentifierStart(getLookahead()) ||
          (combineSurrogatePair() && isIdentifierStart(getLookahead()))
        ) {
          return scanIdentifierOrKeyword();
        }
        if (getLookahead() === END_OF_INPUT) return isParserError ? TOKEN.Illegal : TOKEN.Eos;
        return skipWhiteSpace();
      })();
      if (token !== TOKEN.Whitespace) return token;
    }
  };

  const scan = (desc: TokenDesc) => {
    scanning = desc;
    desc.invalidTemplateEscape = undefined;
    literal = [];
    desc.token = scanSingleToken();
    desc.end = getSourcePosition();
    desc.literal = literal.join("");
  };

  const getNext = () => {
    const previous = current;
    current = next;
    if (nextNext.token === TOKEN.Uninitialized) {
      next = previous;
      previous.isAfterLineTerminator = false;
      scan(previous);
    } else {
      next = nextNext;
      if (nextNextNext.token === TOKEN.Uninitialized) {
        nextNext = previous;
      } else {
        nextNext = nextNextNext;
        nextNextNext = previous;
      }
      previous.token = TOKEN.Uninitialized;
    }
    return current.token;
  };

  const peekAhead = () => {
    if (nextNext.token !== TOKEN.Uninitialized) return nextNext.token;
    nextNext.isAfterLineTerminator = false;
    scan(nextNext);
    return nextNext.token;
  };

  const peekAheadAhead = () => {
    if (nextNextNext.token !== TOKEN.Uninitialized) return nextNextNext.token;
    nextNextNext.isAfterLineTerminator = false;
    scan(nextNextNext);
    return nextNextNext.token;
  };

  // Whether a token's literal differs from its source, which an escape makes it.
  const isLiteralEscaped = (desc: TokenDesc) =>
    desc.literal.length !== desc.end - desc.start - (desc.token === TOKEN.String ? 2 : 0);

  advance();
  next.isAfterLineTerminator = true;
  scan(next);

  return {
    source,
    next: getNext,
    peek: () => next.token,
    peekAhead,
    peekAheadAhead,
    getCurrentToken: () => current.token,
    getLocation: (): Location => ({ start: current.start, end: current.end }),
    getPeekLocation: (): Location => ({ start: next.start, end: next.end }),
    getCurrentLiteral: () => current.literal,
    getNextLiteral: () => next.literal,
    isLiteralEscaped: () => isLiteralEscaped(current),
    isNextLiteralEscaped: () => isLiteralEscaped(next),
    // Whether the next token is a string of exactly the text, without escapes.
    isNextLiteralExactly: (text: string) =>
      next.literal === text && next.end - next.start === text.length + 2,
    hasLineTerminatorBeforeNext: () => next.isAfterLineTerminator,
    hasLineTerminatorAfterNext: () => {
      peekAhead();
      return nextNext.isAfterLineTerminator;
    },
    hasLineTerminatorAfterNextNext: () => {
      peekAheadAhead();
      return nextNextNext.isAfterLineTerminator;
    },
    getScannerError: () => scannerError,
    getOctalLocation: () => octalLocation,
    getOctalMessage: () => octalMessage,
    clearOctalPosition: () => {
      octalLocation = INVALID_LOCATION;
      octalMessage = "";
    },
    getInvalidTemplateEscape: () => current.invalidTemplateEscape,
    clearInvalidTemplateEscape: () => {
      current.invalidTemplateEscape = undefined;
    },
    // Puts the scanner in V8's error state, where every token it has scanned and will scan is
    // illegal.
    setParserError: () => {
      if (isParserError) return;
      lookahead = END_OF_INPUT;
      isParserError = true;
      for (const desc of [current, next, nextNext, nextNextNext]) {
        if (desc.token !== TOKEN.Uninitialized) desc.token = TOKEN.Illegal;
      }
    },
    hasParserError: () => isParserError,
    // Scans a regular expression literal's pattern after the next token, its / or its /=, into
    // the next token, and returns whether it ends.
    scanRegExpPattern: () => {
      scanning = next;
      let isInCharacterClass = false;
      startLiteral();
      if (next.token === TOKEN.AssignDiv) addLiteralChar(0x3d);
      while (getLookahead() !== 0x2f || isInCharacterClass) {
        if (getLookahead() === END_OF_INPUT || isLineTerminator(getLookahead())) {
          next.literal = literal.join("");
          return false;
        }
        if (getLookahead() === 0x5c) {
          addLiteralCharAdvance();
          if (getLookahead() === END_OF_INPUT || isLineTerminator(getLookahead())) {
            next.literal = literal.join("");
            return false;
          }
          addLiteralCharAdvance();
        } else {
          if (getLookahead() === 0x5b) isInCharacterClass = true;
          if (getLookahead() === 0x5d) isInCharacterClass = false;
          addLiteralCharAdvance();
        }
      }
      advance();
      next.token = TOKEN.RegExpLiteral;
      next.literal = literal.join("");
      return true;
    },
    // Scans a regular expression literal's flags, and returns them, or undefined where one is
    // invalid or repeated.
    scanRegExpFlags: () => {
      const flags: string[] = [];
      while (isIdentifierPart(getLookahead())) {
        const flag = String.fromCharCode(getLookahead());
        if (!REGEXP_FLAGS.has(flag) || flags.includes(flag)) return undefined;
        flags.push(flag);
        advance();
      }
      next.end = getSourcePosition();
      return flags.join("");
    },
    scanTemplateContinuation: () => {
      scanning = next;
      next.invalidTemplateEscape = undefined;
      const token = scanTemplateSpan();
      next.literal = literal.join("");
      return token;
    },
  };
};
