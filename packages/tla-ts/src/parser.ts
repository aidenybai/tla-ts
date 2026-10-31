import type {
  AssumeProve,
  Assumption,
  Bound,
  BoundPattern,
  CaseArm,
  Declaration,
  DefineStep,
  Definition,
  ExceptPathStep,
  Expression,
  Fact,
  Module,
  Instance,
  NewSymbol,
  OperatorParam,
  Proof,
  ProofStep,
  Selector,
  SourceLocation,
  SourceRange,
  StepBody,
  UseOrHide,
} from "./ast";
import { createSanyError, formatRange, TlaSyntaxError } from "./errors";
import { getNumeralValue, tokenize, type Token } from "./lexer";

interface InfixOperator {
  low: number;
  high: number;
  isAssociative: boolean;
}

const createInfix = (low: number, high: number, isAssociative: boolean) => ({
  low,
  high,
  isAssociative,
});

const RELATIONS = [
  "=",
  "#",
  "<",
  ">",
  "<=",
  ">=",
  "\\in",
  "\\notin",
  "\\subseteq",
  "\\subset",
  "\\supseteq",
  "\\supset",
  "\\sqsubseteq",
  "\\sqsupseteq",
  "\\sqsubset",
  "\\sqsupset",
  "\\prec",
  "\\preceq",
  "\\succ",
  "\\succeq",
  "\\sim",
  "\\simeq",
  "\\approx",
  "\\cong",
  "\\asymp",
  "\\doteq",
  "\\propto",
  "\\ll",
  "\\gg",
  "|-",
  "-|",
  "|=",
  "=|",
  ":=",
  "::=",
];

const INFIX_OPERATORS = new Map<string, InfixOperator>([
  ["=>", createInfix(1, 1, false)],
  ["<=>", createInfix(2, 2, false)],
  ["~>", createInfix(2, 2, false)],
  ["-+->", createInfix(2, 2, false)],
  ["/\\", createInfix(3, 3, true)],
  ["\\/", createInfix(3, 3, true)],
  ...RELATIONS.map((relation): [string, InfixOperator] => [relation, createInfix(5, 5, false)]),
  ["\\cdot", createInfix(5, 14, true)],
  ["@@", createInfix(6, 6, true)],
  [":>", createInfix(7, 7, false)],
  ["<:", createInfix(7, 7, false)],
  ["\\cup", createInfix(8, 8, true)],
  ["\\cap", createInfix(8, 8, true)],
  ["\\", createInfix(8, 8, false)],
  ["..", createInfix(9, 9, false)],
  ["...", createInfix(9, 9, false)],
  ["##", createInfix(9, 13, true)],
  ["$", createInfix(9, 13, true)],
  ["$$", createInfix(9, 13, true)],
  ["??", createInfix(9, 13, true)],
  ["!!", createInfix(9, 13, false)],
  ["\\sqcap", createInfix(9, 13, true)],
  ["\\sqcup", createInfix(9, 13, true)],
  ["\\uplus", createInfix(9, 13, true)],
  ["\\wr", createInfix(9, 14, false)],
  ["+", createInfix(10, 10, true)],
  ["++", createInfix(10, 10, true)],
  ["(+)", createInfix(10, 10, true)],
  ["\\oplus", createInfix(10, 10, true)],
  ["%", createInfix(10, 11, false)],
  ["%%", createInfix(10, 11, true)],
  ["|", createInfix(10, 11, true)],
  ["||", createInfix(10, 11, true)],
  ["\\X", createInfix(10, 13, false)],
  ["-", createInfix(11, 11, true)],
  ["--", createInfix(11, 11, true)],
  ["(-)", createInfix(11, 11, true)],
  ["\\ominus", createInfix(11, 11, true)],
  ["*", createInfix(13, 13, true)],
  ["**", createInfix(13, 13, true)],
  ["/", createInfix(13, 13, false)],
  ["//", createInfix(13, 13, false)],
  ["\\div", createInfix(13, 13, false)],
  ["\\o", createInfix(13, 13, true)],
  ["(.)", createInfix(13, 13, true)],
  ["\\odot", createInfix(13, 13, true)],
  ["(/)", createInfix(13, 13, false)],
  ["\\oslash", createInfix(13, 13, false)],
  ["(\\X)", createInfix(13, 13, true)],
  ["\\otimes", createInfix(13, 13, true)],
  ["&", createInfix(13, 13, true)],
  ["&&", createInfix(13, 13, true)],
  ["\\star", createInfix(13, 13, true)],
  ["\\bullet", createInfix(13, 13, true)],
  ["\\bigcirc", createInfix(13, 13, true)],
  ["^", createInfix(14, 14, false)],
  ["^^", createInfix(14, 14, false)],
]);

const NEGATION_PRECEDENCE = 12;

const POSTFIX_OPERATORS = new Set(["^+", "^*", "^#"]);

const PREFIX_OPERATOR_REFERENCES = new Set(["-", "~", "-."]);

const EXPRESSION_PREFIXES = new Set([
  "-",
  "~",
  "/\\",
  "\\/",
  "SUBSET",
  "UNION",
  "DOMAIN",
  "ENABLED",
  "UNCHANGED",
  "[]",
  "<>",
]);

const CIRCLED_OPERATORS = new Set(["+", "-", "/", "\\X"]);

const OPERATOR_ARGUMENTS = new Set([
  "SUBSET",
  "UNION",
  "DOMAIN",
  "ENABLED",
  "UNCHANGED",
  "[]",
  "<>",
  "'",
  ...POSTFIX_OPERATORS,
]);

const isOperatorName = (text: string) =>
  INFIX_OPERATORS.has(text) || POSTFIX_OPERATORS.has(text) || text === "-.";

const getOperatorApplication = (
  operator: string,
  argument: Expression,
  location: SourceLocation,
): Expression => {
  switch (operator) {
    case "ENABLED":
      return { kind: "Enabled", expression: argument, location };
    case "UNCHANGED":
      return { kind: "Unchanged", expression: argument, location };
    case "[]":
      return { kind: "Always", expression: argument, location };
    case "<>":
      return { kind: "Eventually", expression: argument, location };
    case "'":
      return { kind: "Prime", expression: argument, location };
    default:
      return { kind: "Apply", operator, args: [argument], location };
  }
};
const SELECTOR_SYMBOLS = new Set(["<<", ">>", ":", "@", "("]);

const UNIT_KEYWORDS = new Set([
  "ASSUME",
  "ASSUMPTION",
  "AXIOM",
  "CONSTANT",
  "CONSTANTS",
  "COROLLARY",
  "INSTANCE",
  "LEMMA",
  "LOCAL",
  "PROPOSITION",
  "RECURSIVE",
  "THEOREM",
  "VARIABLE",
  "VARIABLES",
]);

const THEOREM_KEYWORDS = new Set(["THEOREM", "LEMMA", "COROLLARY", "PROPOSITION"]);

const PROOF_STARTS = new Set(["BY", "PROOF", "OBVIOUS", "OMITTED"]);

const PROVABLE_STEPS = new Set(["Qed", "Pick", "Case", "Assert"]);

const TLAPM_PUNCTUATION = new Set([
  ",",
  ".",
  "_",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  "<<",
  ">>",
  "]_",
  ">>_",
  "==",
  "!",
  "@",
  ":",
  "::",
  ";",
  "->",
  "<-",
  "|->",
  "\\A",
  "\\AA",
  "\\E",
  "\\EE",
  "\\forall",
  "\\exists",
  "WF_",
  "SF_",
  "(*{",
  "}*)",
]);

const UNNAMED_STEP_LABELS = new Set(["", "*", "-"]);

const FACT_KEYWORDS = new Set([
  "CASE",
  "CHOOSE",
  "DOMAIN",
  "ENABLED",
  "IF",
  "LAMBDA",
  "LET",
  "SF_",
  "SUBSET",
  "UNCHANGED",
  "UNION",
  "WF_",
]);

const NEW_SYMBOL_LEVELS = new Map<string, NewSymbol["level"]>([
  ["CONSTANT", "Constant"],
  ["CONSTANTS", "Constant"],
  ["VARIABLE", "Variable"],
  ["VARIABLES", "Variable"],
  ["STATE", "State"],
  ["ACTION", "Action"],
  ["ACTIONS", "Action"],
  ["TEMPORAL", "Temporal"],
  ["TEMPORALS", "Temporal"],
]);

const NEW_SYMBOL_STARTS = new Set(["NEW", ...NEW_SYMBOL_LEVELS.keys()]);

const OPENING_BRACKETS = new Set(["(", "[", "{", "<<"]);

const CLOSING_BRACKETS = new Set([")", "]", "}", ">>", "]_", ">>_"]);

const BUILTIN_CONSTANTS = new Set(["TRUE", "FALSE", "BOOLEAN", "STRING"]);

const NO_OFFSIDE = -1;

const getModuleHeader = (name: string) => new RegExp(`^-{4,}\\s*MODULE\\s+${name}\\s*-{3,}$`);

// The text of a module that starts on its own line in a file, as TLC's monolith extractor reads
// modules that follow the root module.
export const extractModule = (source: string, name: string) => {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => getModuleHeader(name).test(line));
  if (start === -1) return undefined;
  const end = lines.findIndex((line, index) => index > start && line.startsWith("===="));
  return lines.slice(start, end === -1 ? undefined : end + 1).join("\n");
};

// isTlapm parses as tlapm does for proof obligations, which accepts and rejects some modules that
// SANY does not.
const parse = (source: string, isTlapm: boolean): Module => {
  const tokens = tokenize(source);
  const cursor = { index: 0, offsideColumns: [] as number[] };
  // A RECURSIVE declaration covers the definitions of its own LET or module.
  const recursiveScopes: Set<string>[] = [];
  const factNames = new Set<string>();
  // The NEW, TAKE, and PICK names in scope, which a DEF clause cannot cite.
  const proofScopes: Set<string>[] = [];
  // A fact may cite an operator of a parameterized instance without the instance's arguments.
  const factStart = { index: -1 };
  const openModules: Module[] = [];

  const isRecursiveName = (name: string) => recursiveScopes[recursiveScopes.length - 1].has(name);

  const getLocation = (token: Token): SourceLocation => ({
    line: token.line,
    column: isTlapm && token.kind === "String" ? token.endColumn : token.column,
    range: undefined,
  });

  const tokenStarts: SourceLocation[] = [];
  const tokenEnds: SourceLocation[] = [];
  const tokenRanges: SourceRange[] = [];

  const getRange = (startIndex: number) => {
    const endIndex = cursor.index - 1;
    const cached = startIndex === endIndex ? tokenRanges[startIndex] : undefined;
    if (cached) return cached;
    const last = tokens[endIndex];
    tokenStarts[startIndex] ??= getLocation(tokens[startIndex]);
    tokenEnds[endIndex] ??= { line: last.line, column: last.endColumn };
    const range = {
      module: openModules[openModules.length - 1].name,
      start: tokenStarts[startIndex],
      end: tokenEnds[endIndex],
    };
    if (startIndex === endIndex) tokenRanges[startIndex] = range;
    return range;
  };

  // Each node gets its own location object from getLocation, so the range can be set in place.
  const withRange = <Node extends { location: SourceLocation }>(node: Node, startIndex: number) => {
    node.location.range = getRange(startIndex);
    return node;
  };

  const peekRaw = (offset = 0) => tokens[Math.min(cursor.index + offset, tokens.length - 1)];

  const peek = (offset = 0) => {
    const token = peekRaw(offset);
    const offsideColumn = cursor.offsideColumns[cursor.offsideColumns.length - 1];
    if (offsideColumn === undefined || offsideColumn === NO_OFFSIDE || token.kind === "End") {
      return token;
    }
    return token.column <= offsideColumn ? { ...token, kind: "End" as const, text: "" } : token;
  };

  const describe = (token: Token) =>
    token.kind === "End" ? "end of input" : JSON.stringify(token.text);

  const unitStart = { index: 0 };

  const getDefinitionEnd = (fallback: { line: number; column: number }) => {
    const equals = tokens
      .slice(unitStart.index, cursor.index)
      .find((token) => token.text === "==" && token.kind !== "String");
    return equals ? { line: equals.line, column: equals.endColumn + 1 } : fallback;
  };

  // tlapm reads TRUE, FALSE, BOOLEAN, STRING and the other keywords only as keywords.
  const isTlapmKeyword = (token: Token) =>
    isTlapm && (token.kind === "Keyword" || BUILTIN_CONSTANTS.has(token.text));

  const getPreviousEnd = (position: { line: number; column: number }) => {
    const previous = tokens.findLast(
      (token) =>
        token.kind !== "End" &&
        (token.line < position.line ||
          (token.line === position.line && token.column < position.column)),
    );
    return previous ? { line: previous.line, column: previous.endColumn + 1 } : position;
  };

  const getTlapmName = (token: Token) => {
    if (/^-{4,}$/.test(token.text)) return "----";
    if (/^={4,}$/.test(token.text)) return "====";
    if (TLAPM_PUNCTUATION.has(token.text) || token.kind === "Number" || token.kind === "Decimal")
      return token.text;
    if (token.kind === "String") return JSON.stringify(token.text);
    if (isTlapmKeyword(token)) return `keyword ${token.text}`;
    return token.kind === "Identifier" ? `identifier ${token.text}` : `operator ${token.text}`;
  };

  const createError = (
    message: string,
    token: { line: number; column: number } = peekRaw(),
    unexpected?: Token,
  ) => {
    const end = tokens[tokens.length - 1];
    const isEnd = token.line === end.line && token.column === end.column;
    return new TlaSyntaxError(
      `${message} at line ${token.line}, column ${token.column}`,
      undefined,
      getFailure(message, token, isEnd, unexpected),
    );
  };

  const getFailure = (
    message: string,
    token: { line: number; column: number },
    isEnd: boolean,
    unexpected: Token | undefined,
  ) => {
    if (isTlapm && isEnd) {
      const end = tokens[tokens.length - 1];
      return { reason: "Unexpected EOF", ...getDefinitionEnd(getPreviousEnd(end)), isEnd };
    }
    if (isTlapm && unexpected) {
      return {
        reason: `Unexpected ${getTlapmName(unexpected)}`,
        ...getPreviousEnd(unexpected),
        isEnd,
      };
    }
    return { reason: message, line: token.line, column: token.column, isEnd };
  };

  const createUnexpected = (message: string, token: Token = peekRaw()) =>
    createError(message, token, token);

  const isFieldName = (token: Token) =>
    (token.kind === "Identifier" || token.kind === "Keyword") && !isTlapmKeyword(token);

  const isAt = (text: string, offset = 0) => {
    const token = peek(offset);
    return token.text === text && token.kind !== "String" && token.kind !== "End";
  };

  const advance = () => {
    const token = peek();
    if (token.kind === "End") throw createError("Unexpected end of expression");
    cursor.index++;
    return token;
  };

  const accept = (text: string) => {
    if (!isAt(text)) return false;
    cursor.index++;
    return true;
  };

  const expect = (text: string) => {
    if (!isAt(text))
      throw createUnexpected(`Expected ${JSON.stringify(text)} but found ${describe(peek())}`);
    return advance();
  };

  const expectIdentifier = () => {
    const token = peek();
    if (token.kind !== "Identifier") {
      throw createUnexpected(`Expected an identifier but found ${describe(token)}`);
    }
    if (isTlapmKeyword(token)) throw createUnexpected(`Unexpected keyword ${token.text}`);
    cursor.index++;
    return token.text;
  };

  const withoutOffside = <Result>(parse: () => Result) => {
    cursor.offsideColumns.push(NO_OFFSIDE);
    const result = parse();
    cursor.offsideColumns.pop();
    return result;
  };

  const parseSeparated = <Item>(parseItem: () => Item, separator = ",") => {
    const items = [parseItem()];
    while (accept(separator)) items.push(parseItem());
    return items;
  };

  const isBoundAhead = () => {
    if (isAt("<<")) {
      const offset = { value: 1 };
      while (peek(offset.value).kind === "Identifier" || isAt(",", offset.value)) offset.value++;
      return isAt(">>", offset.value) && isAt("\\in", offset.value + 1);
    }
    const offset = { value: 0 };
    while (peek(offset.value).kind === "Identifier") {
      if (isAt("\\in", offset.value + 1)) return true;
      if (!isAt(",", offset.value + 1)) return false;
      offset.value += 2;
    }
    return false;
  };

  const isLabelAhead = () => {
    if (isAt("::")) return true;
    if (!isAt("(")) return false;
    const offset = { value: 1 };
    while (peek(offset.value).kind === "Identifier" && isAt(",", offset.value + 1))
      offset.value += 2;
    return (
      peek(offset.value).kind === "Identifier" &&
      isAt(")", offset.value + 1) &&
      isAt("::", offset.value + 2)
    );
  };

  const parsePattern = (): BoundPattern => {
    if (!accept("<<")) return { kind: "Name", name: expectIdentifier() };
    const names = parseSeparated(expectIdentifier);
    expect(">>");
    return { kind: "Tuple", names };
  };

  const parseBounds = () =>
    parseSeparated(() => {
      const patterns = parseSeparated(parsePattern);
      expect("\\in");
      const set = parseExpression();
      return patterns.map((pattern) => ({ pattern, set }));
    }).flat();

  const parseSubscript = (): Expression => {
    const token = peek();
    if (token.kind === "Identifier") {
      const start = cursor.index;
      const names = [advance().text];
      while (isAt("!") && peek(1).kind === "Identifier") {
        advance();
        names.push(expectIdentifier());
      }
      return withRange(
        { kind: "Identifier", name: names.join("!"), location: getLocation(token) },
        start,
      );
    }
    if (isAt("<<") || isAt("(")) return parsePrimary();
    throw createUnexpected(`Expected a subscript but found ${describe(token)}`);
  };

  const isDefinitionAhead = (operator: Token) => {
    const token = peek(1);
    const next = peek(2);
    if (token.kind === "Identifier" && next.text === "==") return true;
    if (token.line === operator.line) return false;
    if (token.text === "-.") return true;
    return (
      token.kind === "Identifier" &&
      (next.text === "(" ||
        next.text === "[" ||
        (next.kind === "Operator" && isAt("==", POSTFIX_OPERATORS.has(next.text) ? 3 : 4)))
    );
  };

  const isStandalone = (operator: Token) => {
    if (!EXPRESSION_PREFIXES.has(operator.text)) return true;
    const token = peek(1);
    return (
      token.kind === "End" ||
      token.kind === "ModuleEnd" ||
      token.kind === "Separator" ||
      isAt(",", 1) ||
      isAt(")", 1) ||
      (token.kind === "Keyword" && UNIT_KEYWORDS.has(token.text)) ||
      isDefinitionAhead(operator)
    );
  };

  const parseArgument = (): Expression => {
    const token = peek();
    const isOperatorAlone =
      token.kind === "Operator" &&
      (INFIX_OPERATORS.has(token.text) || PREFIX_OPERATOR_REFERENCES.has(token.text)) &&
      isStandalone(token);
    // tlapm reads a prefix operator as the start of an expression, and (+), (-), (/) and (\X) as
    // the operators \oplus, \ominus, \oslash and \otimes.
    const isTlapmIncomplete =
      isTlapm &&
      token.kind !== "String" &&
      (PREFIX_OPERATOR_REFERENCES.has(token.text) ||
        (OPERATOR_ARGUMENTS.has(token.text) &&
          token.text !== "'" &&
          !POSTFIX_OPERATORS.has(token.text)) ||
        (CIRCLED_OPERATORS.has(token.text) &&
          peek(-1).text === "(" &&
          peek(-1).line === token.line &&
          peek(-1).endColumn + 1 === token.column &&
          peek(1).text === ")" &&
          peek(1).line === token.line &&
          peek(1).column === token.endColumn + 1));
    if (isTlapmIncomplete && isStandalone(token)) throw createError("incomplete expression", token);
    if (isOperatorAlone) {
      cursor.index++;
      return withRange(
        { kind: "OperatorReference", operator: token.text, location: getLocation(token) },
        cursor.index - 1,
      );
    }
    const isPrefixAlone =
      token.kind !== "String" && OPERATOR_ARGUMENTS.has(token.text) && isStandalone(token);
    if (isPrefixAlone) {
      cursor.index++;
      const location = getLocation(token);
      if (POSTFIX_OPERATORS.has(token.text)) {
        return { kind: "OperatorReference", operator: token.text, location };
      }
      const argument: Expression = { kind: "Identifier", name: "argument", location };
      return {
        kind: "Lambda",
        params: [argument.name],
        body: getOperatorApplication(token.text, argument, location),
        location,
      };
    }
    if (isAt("LAMBDA")) {
      const start = cursor.index;
      advance();
      const params = parseSeparated(expectIdentifier);
      expect(":");
      const body = parseExpression();
      return withRange({ kind: "Lambda", params, body, location: getLocation(token) }, start);
    }
    return parseExpression();
  };

  const lastArguments: { range: SourceRange | undefined } = { range: undefined };

  const parseArguments = () =>
    withoutOffside(() => {
      const start = cursor.index;
      expect("(");
      const args = parseSeparated(parseArgument);
      expect(")");
      lastArguments.range = getRange(start);
      return args;
    });

  const parseJunctionList = (): Expression => {
    const bullet = advance();
    cursor.offsideColumns.push(bullet.column);
    const operands = [parseExpression()];
    while (peekRaw().text === bullet.text && peekRaw().column === bullet.column) {
      cursor.index++;
      operands.push(parseExpression());
    }
    cursor.offsideColumns.pop();
    return {
      kind: bullet.text === "/\\" ? "And" : "Or",
      operands,
      isBulleted: true,
      location: getLocation(bullet),
    };
  };

  const parseBracket = (start: Token): Expression =>
    withoutOffside(() => {
      const location = getLocation(start);
      if (peek().kind === "Identifier" && (isAt("|->", 1) || isAt(":", 1))) {
        const kind = isAt("|->", 1) ? "Record" : "RecordSet";
        const fields = parseSeparated(() => {
          const fieldStart = cursor.index;
          const fieldLocation = getLocation(peek());
          const name = expectIdentifier();
          fieldLocation.range = getRange(fieldStart);
          expect(kind === "Record" ? "|->" : ":");
          return { name, value: parseExpression(), location: fieldLocation };
        });
        expect("]");
        return { kind, fields, location };
      }
      if (isBoundAhead()) {
        const bounds = parseBounds();
        expect("|->");
        const body = parseExpression();
        expect("]");
        return { kind: "FunctionConstruction", bounds, body, location };
      }
      const expression = parseExpression();
      if (accept("->")) {
        const range = parseExpression();
        expect("]");
        return { kind: "FunctionSet", domain: expression, range, location };
      }
      if (accept("EXCEPT")) {
        const updates = parseSeparated(() => {
          expect("!");
          const path: ExceptPathStep[] = [];
          while (isAt(".") || isAt("[")) {
            if (accept(".")) {
              if (!isFieldName(peek()))
                throw createUnexpected(`Expected a field name but found ${describe(peek())}`);
              path.push({ kind: "Field", name: advance().text });
              continue;
            }
            expect("[");
            path.push({ kind: "Index", args: parseSeparated(() => parseExpression()) });
            expect("]");
          }
          expect("=");
          return { path, value: parseExpression() };
        });
        expect("]");
        return { kind: "Except", function: expression, updates, location };
      }
      expect("]_");
      return {
        kind: "BoxAction",
        action: expression,
        subscript: parseSubscript(),
        location,
      };
    });

  const parseBrace = (start: Token): Expression =>
    withoutOffside(() => {
      const location = getLocation(start);
      if (accept("}")) return { kind: "SetEnumeration", elements: [], location };
      if (isBoundAhead() && (peek(1).text === "\\in" || isAt("<<"))) {
        const checkpoint = cursor.index;
        const pattern = parsePattern();
        expect("\\in");
        const set = parseExpression();
        if (accept(":")) {
          const predicate = parseExpression();
          expect("}");
          return { kind: "SetFilter", bound: { pattern, set }, predicate, location };
        }
        cursor.index = checkpoint;
      }
      const first = parseExpression();
      if (accept(":")) {
        const bounds = parseBounds();
        expect("}");
        return { kind: "SetMap", expression: first, bounds, location };
      }
      const elements = [first];
      while (accept(",")) elements.push(parseExpression());
      expect("}");
      return { kind: "SetEnumeration", elements, location };
    });

  const parseTuple = (start: Token): Expression => {
    const location = getLocation(start);
    const elements = withoutOffside(() =>
      isAt(">>") || isAt(">>_") ? [] : parseSeparated(() => parseExpression()),
    );
    if (accept(">>_")) {
      if (elements.length !== 1)
        throw createError("Expected a single action inside <<A>>_v", start);
      return { kind: "AngleAction", action: elements[0], subscript: parseSubscript(), location };
    }
    expect(">>");
    return { kind: "Tuple", elements, location };
  };

  const parseQuantifier = (start: Token): Expression => {
    const location = getLocation(start);
    const kind = start.text === "\\A" ? "Forall" : "Exists";
    const isTemporal = start.text === "\\AA" || start.text === "\\EE";
    if (!isTemporal && isBoundAhead()) {
      const bounds = parseBounds();
      expect(":");
      return { kind, bounds, body: parseExpression(), location };
    }
    const names = parseSeparated(expectIdentifier);
    expect(":");
    return {
      kind: "UnboundedQuantifier",
      quantifier: start.text === "\\A" || start.text === "\\AA" ? "Forall" : "Exists",
      names,
      body: parseExpression(),
      isTemporal,
      location,
    };
  };

  const parseCase = (start: Token): Expression => {
    const arms: CaseArm[] = [];
    do {
      if (accept("OTHER")) {
        expect("->");
        return { kind: "Case", arms, other: parseExpression(), location: getLocation(start) };
      }
      const condition = parseExpression();
      expect("->");
      arms.push({ condition, body: parseExpression() });
    } while (accept("[]"));
    return { kind: "Case", arms, other: undefined, location: getLocation(start) };
  };

  const isSelectorAhead = () => {
    const next = peek(1);
    return (
      isAt("!") &&
      (next.kind === "Identifier" ||
        next.kind === "Number" ||
        SELECTOR_SYMBOLS.has(next.text) ||
        (next.kind === "Operator" &&
          (INFIX_OPERATORS.has(next.text) ||
            POSTFIX_OPERATORS.has(next.text) ||
            PREFIX_OPERATOR_REFERENCES.has(next.text))))
    );
  };

  const parseSelector = (): Selector => {
    const token = advance();
    if (token.kind === "Number") return { kind: "Operand", operand: getNumeralValue(token.text) };
    switch (token.text) {
      case "<<":
      case ">>":
        return { kind: "Operand", operand: token.text };
      case ":":
        return { kind: "Colon" };
      case "@":
        return { kind: "At" };
      case "(": {
        cursor.index--;
        return { kind: "Bound", args: parseArguments() };
      }
    }
    return { kind: "Name", name: token.text, args: isAt("(") ? parseArguments() : [] };
  };

  const parsePrimary = (): Expression => {
    const isFactStart = cursor.index === factStart.index;
    const token = advance();
    const location = getLocation(token);
    if (isTlapm && token.kind === "Keyword" && token.text === "LAMBDA") {
      const params = parseSeparated(expectIdentifier);
      expect(":");
      return { kind: "Lambda", params, body: parseExpression(), location };
    }
    if (token.kind === "Number") {
      if (isTlapm && /^\\[BOH]/.test(token.text)) throw createError("incomplete expression", token);
      return { kind: "Number", value: getNumeralValue(token.text), text: token.text, location };
    }
    if (token.kind === "Decimal") return { kind: "Decimal", text: token.text, location };
    if (token.kind === "String") return { kind: "String", value: token.text, location };
    const isStep = token.kind === "Step" && isStepReference(token);
    if (isStep && getProofLevel() < 0 && proofLevels.length <= 1) {
      throw createError("Step number used outside proof", token);
    }
    if (isStep && token.text[1] === "+") {
      throw createError("<+> step number used in an expression", token);
    }
    if (token.kind === "Identifier" || isStep) {
      const name = isStep ? (getStepName(token) ?? token.text) : token.text;
      if (isLabelAhead()) {
        const params = accept("(") ? parseSeparated(expectIdentifier) : [];
        if (params.length > 0) expect(")");
        expect("::");
        return { kind: "Label", name, params, body: parseExpression(), location };
      }
      const hasArguments = isAt("(");
      const args = hasArguments ? parseArguments() : [];
      if (!isSelectorAhead()) {
        return hasArguments
          ? { kind: "Apply", operator: name, args, argumentsRange: lastArguments.range, location }
          : { kind: "Identifier", name, location };
      }
      const instance = openModules
        .flatMap((module) => module.instances)
        .find((candidate) => candidate.name === name);
      if (instance && !isFactStart && !isTlapm && instance.params.length !== args.length) {
        throw createError(
          `The operator ${name} requires ${instance.params.length} arguments`,
          token,
        );
      }
      const selectors: Selector[] = [{ kind: "Name", name, args }];
      while (isSelectorAhead()) {
        advance();
        selectors.push(parseSelector());
      }
      const names = selectors.flatMap((selector) =>
        selector.kind === "Name" ? [selector.name] : [],
      );
      if (names.length < selectors.length) return { kind: "Subexpression", selectors, location };
      const operator = names.join("!");
      const qualifiedArgs = selectors.flatMap((selector) =>
        "args" in selector ? selector.args : [],
      );
      if (qualifiedArgs.length === 0) return { kind: "Identifier", name: operator, location };
      const argumentCounts = selectors.map((selector) =>
        "args" in selector ? selector.args.length : 0,
      );
      const argumentsRange = lastArguments.range;
      return argumentCounts.slice(0, -1).some((count) => count > 0)
        ? { kind: "Apply", operator, args: qualifiedArgs, argumentCounts, argumentsRange, location }
        : { kind: "Apply", operator, args: qualifiedArgs, argumentsRange, location };
    }
    if (token.kind === "Operator" && isOperatorName(token.text) && isAt("("))
      return { kind: "Apply", operator: token.text, args: parseArguments(), location };
    switch (token.text) {
      case "(": {
        const expression = withoutOffside(() => parseExpression());
        expect(")");
        return expression;
      }
      case "[":
        return parseBracket(token);
      case "{":
        return parseBrace(token);
      case "<<":
        return parseTuple(token);
      case "@":
        return { kind: "ExceptAt", location };
      case "\\A":
      case "\\E":
      case "\\AA":
      case "\\EE":
        return parseQuantifier(token);
      case "IF": {
        const condition = parseExpression();
        expect("THEN");
        const consequent = parseExpression();
        expect("ELSE");
        return { kind: "If", condition, consequent, alternative: parseExpression(), location };
      }
      case "CASE":
        return parseCase(token);
      case "LET": {
        const definitions: Definition[] = [];
        const instances: Instance[] = [];
        recursiveScopes.push(new Set());
        while (!accept("IN")) {
          if (isTlapm && isAt("RECURSIVE"))
            throw createError("Unexpected keyword RECURSIVE", getDefinitionEnd(peekRaw()));
          if (accept("RECURSIVE")) {
            declareRecursive();
            continue;
          }
          const unit = parseDefinition(false);
          if (unit.kind === "Instance") instances.push(unit);
          else definitions.push(unit);
        }
        recursiveScopes.pop();
        const body = parseExpression();
        return instances.length === 0
          ? { kind: "Let", definitions, body, location }
          : { kind: "Let", definitions, instances, body, location };
      }
      case "CHOOSE": {
        const pattern = parsePattern();
        const set = accept("\\in") ? parseExpression() : undefined;
        expect(":");
        return { kind: "Choose", pattern, set, body: parseExpression(), location };
      }
      case "WF_":
      case "SF_": {
        const subscript = parseSubscript();
        const action = withoutOffside(() => {
          expect("(");
          const expression = parseExpression();
          expect(")");
          return expression;
        });
        return {
          kind: token.text === "WF_" ? "WeakFairness" : "StrongFairness",
          subscript,
          action,
          location,
        };
      }
    }
    throw createUnexpected(`Unexpected ${describe(token)}`, token);
  };

  const parsePrefix = (): Expression => {
    const token = peek();
    const location = getLocation(token);
    if (token.kind === "Operator" && (token.text === "/\\" || token.text === "\\/")) {
      return parseJunctionList();
    }
    if (token.kind === "Operator" || token.kind === "Keyword") {
      switch (token.text) {
        case "~":
          advance();
          return { kind: "Apply", operator: "~", args: [parseExpression(5)], location };
        case "-":
          advance();
          return {
            kind: "Apply",
            operator: "-.",
            args: [parseExpression(NEGATION_PRECEDENCE + 1)],
            location,
          };
        case "[]":
          advance();
          return { kind: "Always", expression: parseExpression(16), location };
        case "<>":
          advance();
          return { kind: "Eventually", expression: parseExpression(16), location };
        case "ENABLED":
          advance();
          return { kind: "Enabled", expression: parseExpression(16), location };
        case "UNCHANGED":
          advance();
          return { kind: "Unchanged", expression: parseExpression(16), location };
        case "SUBSET":
        case "UNION":
        case "DOMAIN":
          advance();
          return { kind: "Apply", operator: token.text, args: [parseExpression(9)], location };
      }
    }
    return parsePrimary();
  };

  const parseExpression = (minimumPrecedence = 0): Expression => {
    const start = cursor.index;
    const prefix = parsePrefix();
    const state = {
      left: prefix.location.range ? prefix : withRange(prefix, start),
      previous: undefined as (InfixOperator & { text: string }) | undefined,
    };
    while (true) {
      const token = peek();
      if (token.kind !== "Operator") break;
      const location = getLocation(token);
      if (token.text === "'" && minimumPrecedence <= 15) {
        advance();
        state.left = withRange({ kind: "Prime", expression: state.left, location }, start);
        continue;
      }
      if (POSTFIX_OPERATORS.has(token.text) && minimumPrecedence <= 15) {
        advance();
        state.left = withRange(
          { kind: "Apply", operator: token.text, args: [state.left], location },
          start,
        );
        continue;
      }
      if (token.text === "[") {
        advance();
        const args = withoutOffside(() => parseSeparated(() => parseExpression()));
        withoutOffside(() => expect("]"));
        state.left = withRange(
          { kind: "FunctionApplication", function: state.left, args, location },
          start,
        );
        continue;
      }
      if (token.text === "." && isFieldName(peek(1))) {
        advance();
        const field = advance().text;
        state.left = withRange({ kind: "FieldAccess", record: state.left, field, location }, start);
        continue;
      }
      const infix = INFIX_OPERATORS.get(token.text);
      if (!infix || infix.low < minimumPrecedence) break;
      const previous = state.previous;
      if (previous) {
        const isOverlapping = !(previous.low > infix.high || previous.high < infix.low);
        const isChain = previous.text === token.text && infix.isAssociative;
        if (isOverlapping && !isChain && !(previous.text === "\\X" && token.text === "\\X")) {
          throw createError(
            `Precedence conflict between ${previous.text} and ${token.text}`,
            token,
          );
        }
      }
      advance();
      // SANY reads - after an infix operator as prefix -, and rejects it after one that binds tighter.
      if (infix.low > NEGATION_PRECEDENCE && isAt("-")) {
        throw createError(`Precedence conflict between ${token.text} and -`, peek());
      }
      const right = parseExpression(infix.high + 1);
      const left = state.left;
      if (token.text === "/\\" || token.text === "\\/") {
        const kind = token.text === "/\\" ? "And" : "Or";
        state.left =
          left.kind === kind && previous?.text === token.text
            ? { ...left, operands: [...left.operands, right] }
            : { kind, operands: [left, right], location };
      } else if (token.text === "\\X") {
        state.left =
          left.kind === "Product" && previous?.text === "\\X"
            ? { ...left, factors: [...left.factors, right] }
            : { kind: "Product", factors: [left, right], location };
      } else {
        state.left = { kind: "Apply", operator: token.text, args: [left, right], location };
      }
      state.left = withRange(state.left, start);
      state.previous = { ...infix, text: token.text };
    }
    return state.left;
  };

  const parseParams = () => {
    if (!accept("(")) return [];
    const params = parseDeclarations();
    expect(")");
    return params;
  };

  const parseBody = () => {
    const start = getLocation(peek());
    const body = parseExpression();
    const last = tokens[cursor.index - 1];
    const end = { line: last.line, column: last.endColumn };
    return { body, bodyRange: { module: openModules[openModules.length - 1].name, start, end } };
  };

  const parseDefinition = (isLocal: boolean): Definition | Instance => {
    const start = cursor.index;
    return withRange(parseDefinitionUnit(isLocal), start);
  };

  const parseDefinitionUnit = (isLocal: boolean): Definition | Instance => {
    const token = peek();
    const location = getLocation(token);
    const parseOperator = (name: string, params: OperatorParam[]): Definition => ({
      kind: "Operator",
      name,
      params,
      ...parseBody(),
      isLocal,
      isRecursive: isRecursiveName(name),
      location,
    });
    if (
      token.kind === "Identifier" &&
      peek(1).kind === "Operator" &&
      INFIX_OPERATORS.has(peek(1).text) &&
      peek(2).kind === "Identifier" &&
      isAt("==", 3)
    ) {
      const left = expectIdentifier();
      const operator = advance().text;
      const right = expectIdentifier();
      expect("==");
      return parseOperator(operator, [
        { name: left, arity: 0 },
        { name: right, arity: 0 },
      ]);
    }
    const isPrefixDefinition = token.kind === "Operator" && token.text === "-.";
    const isPostfixDefinition =
      token.kind === "Identifier" && POSTFIX_OPERATORS.has(peek(1).text) && isAt("==", 2);
    if (isPrefixDefinition || isPostfixDefinition) {
      const operator = isPrefixDefinition ? token.text : peek(1).text;
      cursor.index += isPrefixDefinition ? 1 : 2;
      const param = isPrefixDefinition ? expectIdentifier() : token.text;
      expect("==");
      return parseOperator(operator, [{ name: param, arity: 0 }]);
    }
    const name = expectIdentifier();
    if (accept("[")) {
      const bounds = withoutOffside(() => parseBounds());
      expect("]");
      expect("==");
      return {
        kind: "Function",
        name,
        bounds,
        body: parseExpression(),
        isLocal,
        isRecursive: isRecursiveName(name),
        location,
      };
    }
    const definitionStart = cursor.index;
    const params = parseParams();
    expect("==");
    if (isAt("INSTANCE")) {
      const instance = parseInstance(name, params, isLocal, location);
      return { ...instance, definitionRange: getRange(definitionStart) };
    }
    return parseOperator(name, params);
  };

  const parseInstance = (
    name: string | undefined,
    params: OperatorParam[],
    isLocal: boolean,
    location: SourceLocation,
  ): Instance => {
    const start = cursor.index;
    expect("INSTANCE");
    const module = expectIdentifier();
    const substitutions = accept("WITH")
      ? parseSeparated(() => {
          const target = advance().text;
          expect("<-");
          return { name: target, expression: parseArgument() };
        })
      : [];
    return {
      kind: "Instance",
      name,
      params,
      module,
      substitutions,
      isLocal,
      location,
      instanceRange: getRange(start),
    };
  };

  const parseDeclaration = (): Declaration => {
    const location = getLocation(peek());
    if (isAt("_") && peek(1).kind === "Operator") {
      advance();
      const name = advance().text;
      return { name, arity: accept("_") ? 2 : 1, location };
    }
    if (peek().kind === "Operator" && isAt("_", 1)) {
      const operator = advance().text;
      advance();
      return { name: operator === "-" ? "-." : operator, arity: 1, location };
    }
    const name = expectIdentifier();
    if (!accept("(")) return { name, arity: 0, location };
    const placeholders = parseSeparated(() => expect("_"));
    expect(")");
    return { name, arity: placeholders.length, location };
  };

  const parseDeclarations = () => parseSeparated(parseDeclaration);

  const declareRecursive = () => {
    const declarations = parseDeclarations();
    declarations.forEach((declaration) =>
      recursiveScopes[recursiveScopes.length - 1].add(declaration.name),
    );
    return declarations;
  };

  const getClosingOffset = (offset: number) => {
    const depth = { value: 0, offset };
    do {
      const token = peek(depth.offset);
      if (token.kind === "End") return depth.offset;
      if (token.kind === "Operator" && OPENING_BRACKETS.has(token.text)) depth.value++;
      if (token.kind === "Operator" && CLOSING_BRACKETS.has(token.text)) depth.value--;
      depth.offset++;
    } while (depth.value > 0);
    return depth.offset;
  };

  // SANY inserts a break before each definition, which ends the fact list or step before it.
  const isDefinitionStart = () => {
    const token = peek();
    const next = peek(1);
    if (token.kind !== "Identifier") {
      return isAt("-.") && next.kind === "Identifier" && isAt("==", 2);
    }
    if (isAt("(", 1) || isAt("[", 1)) return isAt("==", getClosingOffset(1));
    if (next.kind === "Operator" && POSTFIX_OPERATORS.has(next.text)) return isAt("==", 2);
    if (next.kind === "Operator" && INFIX_OPERATORS.has(next.text)) {
      return peek(2).kind === "Identifier" && isAt("==", 3);
    }
    return isAt("==", 1);
  };

  // SANY's proof levels, one for each open proof, which stay -1 until a step sets them.
  const proofLevels: number[] = [];

  const getProofLevel = () => proofLevels[proofLevels.length - 1] ?? -1;

  const getStepLevel = (step: Token) => {
    if (step.text[1] === "*") return -1;
    if (step.text[1] === "+") return -2;
    return Number(step.text.slice(1, step.text.indexOf(">")));
  };

  const getStepLabel = (step: Token) => {
    const label = step.text.slice(step.text.indexOf(">") + 1);
    const end = { value: label.length };
    while (label[end.value - 1] === ".") end.value--;
    return label.slice(0, end.value);
  };

  const isStepReference = (step: Token) =>
    !step.text.endsWith(".") && !UNNAMED_STEP_LABELS.has(getStepLabel(step));

  const getStepName = (step: Token) => {
    const label = getStepLabel(step);
    if (UNNAMED_STEP_LABELS.has(label)) return undefined;
    const level = getStepLevel(step);
    if (level >= 0) return `<${level}>${label}`;
    const current = getProofLevel();
    const outer = proofLevels[proofLevels.length - 2];
    return `<${current < 0 && outer !== undefined ? outer : current}>${label}`;
  };

  const isProofStart = (token: Token) => {
    if (token.kind === "Keyword") return PROOF_STARTS.has(token.text);
    if (token.kind !== "Step") return false;
    if (token.text[1] === "*") return proofLevels.length === 0;
    if (token.text[1] === "+" || proofLevels.length === 0) return true;
    const level = getProofLevel();
    return level >= 0 && getStepLevel(token) > level;
  };

  const isCorrectLevel = (step: Token) => {
    const level = getStepLevel(step);
    const top = proofLevels.length - 1;
    const outer = proofLevels[top - 1] ?? -1;
    const isFirst = proofLevels[top] < 0;
    if (isFirst) proofLevels[top] = level < 0 ? outer + 1 : level;
    if (level === -1) return true;
    if (level === -2) return isFirst;
    return isFirst ? level > outer : proofLevels[top] === level;
  };

  const isDeclared = (name: string) =>
    !factNames.has(name) &&
    openModules.some(
      (module) =>
        module.constants.some((constant) => constant.name === name) ||
        module.variables.some((variable) => variable.name === name) ||
        module.definitions.some((definition) => definition.name === name),
    );

  const isHideFact = (fact: Fact) => {
    if (fact.kind === "ModuleFact" || fact.kind === "Subexpression") return true;
    if (fact.kind === "Apply") return fact.operator.includes("!");
    if (fact.kind !== "Identifier") return false;
    if (fact.name.startsWith("<") || fact.name.includes("!")) return true;
    return !BUILTIN_CONSTANTS.has(fact.name) && !isDeclared(fact.name);
  };

  const isFactAhead = () => {
    const token = peek();
    if (token.kind === "Step") return isStepReference(token);
    if (token.kind === "Keyword") return FACT_KEYWORDS.has(token.text);
    if (token.kind === "End" || token.kind === "ModuleEnd" || token.kind === "Separator") {
      return false;
    }
    return !isDefinitionStart();
  };

  // SANY reads an infix or postfix operator alone as its name, but a prefix operator such as - as the
  // start of an expression.
  const parseFact = (): Fact => {
    const start = cursor.index;
    factStart.index = start;
    const token = peek();
    if (
      token.kind === "Operator" &&
      !EXPRESSION_PREFIXES.has(token.text) &&
      isOperatorName(token.text)
    ) {
      cursor.index++;
      return withRange(
        { kind: "OperatorReference", operator: token.text, location: getLocation(token) },
        start,
      );
    }
    if (!accept("MODULE")) return parseExpression();
    return withRange(
      { kind: "ModuleFact", name: expectIdentifier(), location: getLocation(token) },
      start,
    );
  };

  const declareProofSymbol = (name: string) => proofScopes[proofScopes.length - 1]?.add(name);

  const withProofScope = <Result>(parse: () => Result) => {
    proofScopes.push(new Set());
    const result = parse();
    proofScopes.pop();
    return result;
  };

  const isDeclaredSymbol = (name: string) =>
    proofScopes.some((scope) => scope.has(name)) ||
    openModules.some(
      (module) =>
        module.constants.some((constant) => constant.name === name) ||
        module.variables.some((variable) => variable.name === name),
    );

  // tlapm's definable: names and operators joined by !.
  const parseDefinable = (): Fact => {
    const start = cursor.index;
    const token = peek();
    const parts = parseSeparated(() => {
      const part = peek();
      const isName = part.kind === "Identifier" && !isTlapmKeyword(part);
      if (!isName && part.kind !== "Operator") {
        throw createUnexpected(`Expected a definition name but found ${describe(part)}`, part);
      }
      cursor.index++;
      return part.text;
    }, "!");
    const location = getLocation(token);
    return withRange(
      parts.length === 1 && token.kind === "Operator"
        ? { kind: "OperatorReference", operator: token.text, location }
        : { kind: "Identifier", name: parts.join("!"), location },
      start,
    );
  };

  const parseDefs = () => {
    if (isTlapm) return parseSeparated(parseDefinable);
    const defs = parseSeparated(parseFact);
    const invalid = defs.find((def) => def.kind === "Identifier" && isDeclaredSymbol(def.name));
    if (invalid) {
      throw createError("DEF clause entry should describe a defined operator", invalid.location);
    }
    return defs;
  };

  const parseFacts = () => ({
    facts: isFactAhead() ? parseSeparated(parseFact) : [],
    defs: accept("DEF") || accept("DEFS") ? parseDefs() : [],
  });

  const parseUseOrHide = (): UseOrHide => {
    const start = cursor.index;
    const keyword = advance();
    const isOnly = keyword.text === "USE" && accept("ONLY");
    const keywordRange = getRange(start);
    const use: UseOrHide = {
      kind: keyword.text === "USE" ? "Use" : "Hide",
      isOnly,
      ...parseFacts(),
      keyword: keywordRange,
      location: getLocation(keyword),
    };
    const invalid =
      use.kind === "Hide" && !isTlapm ? use.facts.filter((fact) => !isHideFact(fact)) : [];
    if (invalid.length > 0) {
      throw createSanyError(
        invalid.map((fact) => ({
          location: formatRange(fact.location.range ?? getRange(start)),
          message:
            "The only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.",
        })),
      );
    }
    return withRange(use, start);
  };

  const parseNewSymbol = (): NewSymbol => {
    const start = cursor.index;
    const location = getLocation(peek());
    const isNew = accept("NEW");
    const level = peek().kind === "Keyword" ? NEW_SYMBOL_LEVELS.get(peek().text) : undefined;
    if (!isNew && level === undefined) {
      throw createUnexpected(`Expected a declaration but found ${describe(peek())}`);
    }
    if (level !== undefined) advance();
    if (level === "Variable") {
      const name = expectIdentifier();
      declareProofSymbol(name);
      return withRange(
        { kind: "NewSymbol", name, arity: 0, level, set: undefined, location },
        start,
      );
    }
    const declaration = parseDeclaration();
    declareProofSymbol(declaration.name);
    const isBounded = (level ?? "Constant") === "Constant" && isAt("\\in");
    if (isBounded && declaration.arity > 0) {
      throw createError("declared symbol with arguments before \\in");
    }
    if (isBounded) advance();
    return withRange(
      {
        kind: "NewSymbol",
        name: declaration.name,
        arity: declaration.arity,
        level: level ?? "Constant",
        set: isBounded ? parseExpression() : undefined,
        location,
      },
      start,
    );
  };

  const parseAssumeProve = (): AssumeProve => {
    const start = cursor.index;
    const location = getLocation(expect("ASSUME"));
    const assumptions = parseSeparated(() => {
      if (isAt("ASSUME")) return withProofScope(parseAssumeProve);
      if (peek().kind === "Keyword" && NEW_SYMBOL_STARTS.has(peek().text)) return parseNewSymbol();
      return parseExpression();
    });
    expect("PROVE");
    return withRange(
      { kind: "AssumeProve", assumptions, conclusion: parseExpression(), location },
      start,
    );
  };

  const isNameListAhead = (terminator: string) => {
    const offset = { value: 0 };
    while (peek(offset.value).kind === "Identifier" && isAt(",", offset.value + 1)) {
      offset.value += 2;
    }
    return peek(offset.value).kind === "Identifier" && isAt(terminator, offset.value + 1);
  };

  const declareProofSymbols = (names: string[], bounds: Bound[]) => {
    names.forEach(declareProofSymbol);
    bounds.forEach((bound) =>
      (bound.pattern.kind === "Name" ? [bound.pattern.name] : bound.pattern.names).forEach(
        declareProofSymbol,
      ),
    );
  };

  const parseStepBody = (): StepBody => {
    const token = peek();
    if (isAt("USE") || isAt("HIDE")) return parseUseOrHide();
    if (isAt("INSTANCE")) {
      return withRange(parseInstance(undefined, [], false, getLocation(token)), cursor.index);
    }
    if (isAt("DEFINE") || isDefinitionStart()) {
      const start = cursor.index;
      accept("DEFINE");
      const definitions = [parseDefinition(false)];
      while (isDefinitionStart()) definitions.push(parseDefinition(false));
      const define: DefineStep = { kind: "Define", definitions, location: getLocation(token) };
      return withRange(define, start);
    }
    if (accept("HAVE")) return { kind: "Have", expression: parseExpression() };
    if (accept("TAKE")) {
      const isBounded = isBoundAhead();
      const names = isBounded ? [] : parseSeparated(expectIdentifier);
      const bounds = isBounded ? parseBounds() : [];
      declareProofSymbols(names, bounds);
      return { kind: "Take", names, bounds };
    }
    if (accept("WITNESS")) {
      return { kind: "Witness", expressions: parseSeparated(() => parseExpression()) };
    }
    if (accept("PICK")) {
      const isNames = isNameListAhead(":");
      const names = isNames ? parseSeparated(expectIdentifier) : [];
      const bounds = isNames ? [] : parseBounds();
      declareProofSymbols(names, bounds);
      expect(":");
      return { kind: "Pick", names, bounds, body: parseExpression() };
    }
    if (accept("CASE")) return { kind: "Case", expression: parseExpression() };
    return {
      kind: "Assert",
      isSuffices: accept("SUFFICES"),
      statement: isAt("ASSUME") ? parseAssumeProve() : parseExpression(),
    };
  };

  const parseStepStart = (isQed: boolean) => {
    const step = peek();
    if (step.kind !== "Step") {
      throw createUnexpected(`Expected a step number but found ${describe(step)}`, step);
    }
    if (!isCorrectLevel(step)) {
      throw createError(`${isQed ? "QED step" : "step"}'s number has bad level`, step);
    }
    if (getStepLevel(step) < 0 && getStepName(step) !== undefined) {
      throw createError("<*> and <+> cannot be used for a named step", step);
    }
    cursor.index++;
    return { name: getStepName(step), token: step.text, location: getLocation(step) };
  };

  // The names an assertion assumes stay in its own proof, and other steps declare theirs for the rest
  // of the enclosing proof.
  const parseStep = (): ProofStep => {
    const start = cursor.index;
    const step = parseStepStart(isAt("QED", 1));
    const scope = new Set<string>();
    proofScopes.push(scope);
    const body: StepBody = accept("QED") ? { kind: "Qed" } : parseStepBody();
    const head = getRange(start);
    const hasProof = isProofStart(peek());
    if (hasProof && !PROVABLE_STEPS.has(body.kind)) {
      throw createError("Proof of a step that does not take a proof");
    }
    const proof = hasProof ? parseProof() : undefined;
    proofScopes.pop();
    if (body.kind !== "Assert" || body.isSuffices) scope.forEach(declareProofSymbol);
    return withRange({ ...step, body, head, proof }, start);
  };

  const parseProofBody = (): Proof => {
    const location = getLocation(peek());
    if (isAt("BY") || (isAt("PROOF") && isAt("BY", 1))) {
      accept("PROOF");
      advance();
      const keyword = getRange(cursor.index - 1);
      return { kind: "By", isOnly: accept("ONLY"), ...parseFacts(), keyword, location };
    }
    const terminal = peek(isAt("PROOF") ? 1 : 0);
    if (
      terminal.kind === "Keyword" &&
      (terminal.text === "OBVIOUS" || terminal.text === "OMITTED")
    ) {
      accept("PROOF");
      advance();
      const keyword = getRange(cursor.index - 1);
      return { kind: terminal.text === "OBVIOUS" ? "Obvious" : "Omitted", keyword, location };
    }
    accept("PROOF");
    const steps = [parseStep()];
    while (steps[steps.length - 1].body.kind !== "Qed") steps.push(parseStep());
    return { kind: "Steps", level: getProofLevel(), steps, location };
  };

  const parseProof = (): Proof => {
    const start = cursor.index;
    proofLevels.push(-1);
    const proof = withProofScope(parseProofBody);
    proofLevels.pop();
    return withRange(proof, start);
  };

  const parseTheorem = (module: Module) => {
    const start = cursor.index;
    const keyword = advance();
    const isNamed = peek().kind === "Identifier" && isAt("==", 1);
    const name = isNamed ? expectIdentifier() : undefined;
    if (name !== undefined) {
      factNames.add(name);
      advance();
    }
    const parsed = withProofScope(() => {
      const statement = isAt("ASSUME") ? parseAssumeProve() : parseExpression();
      return { statement, proof: isProofStart(peek()) ? parseProof() : undefined };
    });
    const statement = parsed.statement;
    const theorem = withRange(
      { name, statement, proof: parsed.proof, location: getLocation(keyword) },
      start,
    );
    module.theorems.push(theorem);
    module.units.push({ kind: "Theorem", theorem });
    if (name === undefined || statement.kind === "AssumeProve") return;
    module.definitions.push(
      withRange(
        {
          kind: "Operator",
          name,
          params: [],
          body: statement,
          isLocal: false,
          isRecursive: false,
          location: getLocation(keyword),
        },
        start,
      ),
    );
  };

  const parseAssumption = (): Assumption => {
    const start = cursor.index;
    return withRange(parseAssumptionUnit(), start);
  };

  const parseAssumptionUnit = (): Assumption => {
    const keyword = advance();
    const location = getLocation(keyword);
    const isAxiom = keyword.text === "AXIOM";
    if (peek().kind === "Identifier" && isAt("==", 1)) {
      const name = expectIdentifier();
      factNames.add(name);
      advance();
      return { name, expression: parseExpression(), isAxiom, location };
    }
    return { name: undefined, expression: parseExpression(), isAxiom, location };
  };

  const parseModuleBody = (): Module => {
    const location = getLocation(expect("----"));
    expect("MODULE");
    const name = expectIdentifier();
    expect("----");
    const module: Module = {
      name,
      modules: [],
      extends: [],
      extendsRanges: [],
      constants: [],
      variables: [],
      definitions: [],
      instances: [],
      assumptions: [],
      location,
      theorems: [],
      uses: [],
      units: [],
    };
    openModules.push(module);
    recursiveScopes.push(new Set());
    if (accept("EXTENDS")) {
      parseSeparated(() => {
        const start = cursor.index;
        module.extends.push(expectIdentifier());
        module.extendsRanges.push(getRange(start));
      });
    }
    while (true) {
      const tokenIndex = cursor.index;
      unitStart.index = tokenIndex;
      const token = peek();
      if (token.kind === "ModuleEnd" || token.kind === "End") {
        if (token.kind === "ModuleEnd") {
          location.range = {
            module: name,
            start: { line: location.line, column: location.column },
            end: { line: token.line, column: token.endColumn },
          };
        }
        openModules.pop();
        recursiveScopes.pop();
        return module;
      }
      if (token.kind === "Separator") {
        if (isAt("MODULE", 1)) {
          const submodule = parseModuleBody();
          module.modules.push(submodule);
          module.units.push({ kind: "Module", module: submodule });
          expect("====");
          continue;
        }
        advance();
        continue;
      }
      switch (token.text) {
        case "CONSTANT":
        case "CONSTANTS": {
          advance();
          const declarations = parseDeclarations();
          module.constants.push(...declarations);
          module.units.push({ kind: "Constants", declarations });
          continue;
        }
        case "VARIABLE":
        case "VARIABLES": {
          advance();
          const declarations = parseSeparated(() => {
            const start = cursor.index;
            const location = getLocation(peek());
            return withRange({ name: expectIdentifier(), arity: 0, location }, start);
          });
          module.variables.push(...declarations);
          module.units.push({ kind: "Variables", declarations });
          continue;
        }
        case "ASSUME":
        case "ASSUMPTION":
        case "AXIOM": {
          const assumption = parseAssumption();
          module.assumptions.push(assumption);
          module.units.push({ kind: "Assumption", assumption });
          if (assumption.name !== undefined) {
            module.definitions.push({
              kind: "Operator",
              name: assumption.name,
              params: [],
              body: assumption.expression,
              isLocal: false,
              isRecursive: false,
              location: assumption.location,
            });
          }
          continue;
        }
        case "USE":
        case "HIDE": {
          const use = parseUseOrHide();
          module.uses.push(use);
          module.units.push({ kind: "Use", use });
          continue;
        }
        case "RECURSIVE":
          advance();
          module.units.push({ kind: "Recursive", declarations: declareRecursive() });
          continue;
        case "INSTANCE":
          addDefinitionUnit(
            module,
            withRange(parseInstance(undefined, [], false, getLocation(token)), tokenIndex),
          );
          continue;
        case "LOCAL": {
          advance();
          if (isAt("INSTANCE")) {
            addDefinitionUnit(
              module,
              withRange(parseInstance(undefined, [], true, getLocation(token)), tokenIndex),
            );
            continue;
          }
          addDefinitionUnit(module, parseDefinition(true));
          continue;
        }
      }
      if (token.kind === "Keyword" && THEOREM_KEYWORDS.has(token.text)) {
        parseTheorem(module);
        continue;
      }
      addDefinitionUnit(module, parseDefinition(false));
    }
  };

  const addDefinitionUnit = (module: Module, unit: Definition | Instance) => {
    if (unit.kind === "Instance") {
      module.instances.push(unit);
      module.units.push({ kind: "Instance", instance: unit });
      return;
    }
    module.definitions.push(unit);
    module.units.push({ kind: "Definition", definition: unit });
  };

  return parseModuleBody();
};

export const parseModule = (source: string) => parse(source, false);

export const parseTlapmModule = (source: string) => parse(source, true);
