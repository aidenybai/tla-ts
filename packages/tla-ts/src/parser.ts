import type {
  Assumption,
  Bound,
  BoundPattern,
  CaseArm,
  Declaration,
  Definition,
  ExceptPathStep,
  ExceptUpdate,
  Expression,
  Module,
  Instance,
  InstanceSubstitution,
  OperatorParam,
  RecordField,
  Selector,
  SourceLocation,
  SourceRange,
} from "./ast";
import { TlaSyntaxError } from "./errors";
import { getNumeralValue, tokenize, type Token } from "./lexer";

interface InfixOperator {
  low: number;
  high: number;
  isAssociative: boolean;
}

const createInfix = (low: number, high: number, isAssociative: boolean): InfixOperator => ({
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

const PROOF_WORDS = new Set(["BY", "OBVIOUS", "OMITTED", "QED", "USE", "HIDE"]);

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

export const parseModule = (source: string): Module => {
  const tokens = tokenize(source);
  const cursor = { index: 0, limit: tokens.length, offsideColumns: [] as number[] };
  const recursiveNames = new Set<string>();
  const factNames = new Set<string>();
  const openModules: Module[] = [];

  const getLocation = (token: Token): SourceLocation => ({
    line: token.line,
    column: token.column,
    range: undefined,
  });

  const tokenStarts: SourceLocation[] = [];
  const tokenEnds: SourceLocation[] = [];
  const tokenRanges: SourceRange[] = [];

  const getRange = (startIndex: number): SourceRange => {
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
    const token =
      cursor.index + offset >= cursor.limit
        ? { ...peekRaw(offset), kind: "End" as const, text: "" }
        : peekRaw(offset);
    const offsideColumn = cursor.offsideColumns[cursor.offsideColumns.length - 1];
    if (offsideColumn === undefined || offsideColumn === NO_OFFSIDE || token.kind === "End") {
      return token;
    }
    return token.column <= offsideColumn ? { ...token, kind: "End" as const, text: "" } : token;
  };

  const describe = (token: Token) =>
    token.kind === "End" ? "end of input" : `${JSON.stringify(token.text)}`;

  const createError = (message: string, token = peekRaw()) =>
    new TlaSyntaxError(`${message} at line ${token.line}, column ${token.column}`);

  const isFieldName = (token: Token) => token.kind === "Identifier" || token.kind === "Keyword";

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
      throw createError(`Expected ${JSON.stringify(text)} but found ${describe(peek())}`);
    return advance();
  };

  const expectIdentifier = () => {
    const token = peek();
    if (token.kind !== "Identifier") {
      throw createError(`Expected an identifier but found ${describe(token)}`);
    }
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

  const parseBounds = (): Bound[] =>
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
      const names = [expectIdentifier()];
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
    throw createError(`Expected a subscript but found ${describe(token)}`);
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

  const parseArguments = () =>
    withoutOffside(() => {
      expect("(");
      const args = parseSeparated(parseArgument);
      expect(")");
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
      location: getLocation(bullet),
    };
  };

  const parseBracket = (start: Token): Expression =>
    withoutOffside(() => {
      const location = getLocation(start);
      if (peek().kind === "Identifier" && (isAt("|->", 1) || isAt(":", 1))) {
        const kind = isAt("|->", 1) ? "Record" : "RecordSet";
        const fields = parseSeparated((): RecordField => {
          const name = expectIdentifier();
          expect(kind === "Record" ? "|->" : ":");
          return { name, value: parseExpression() };
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
        const updates = parseSeparated((): ExceptUpdate => {
          expect("!");
          const path: ExceptPathStep[] = [];
          while (isAt(".") || isAt("[")) {
            if (accept(".")) {
              if (!isFieldName(peek()))
                throw createError(`Expected a field name but found ${describe(peek())}`);
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
    const elements = withoutOffside(() => {
      if (isAt(">>") || isAt(">>_")) return [];
      return parseSeparated(() => parseExpression());
    });
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
    return { kind: "UnboundedQuantifier", names, body: parseExpression(), isTemporal, location };
  };

  const parseCase = (start: Token): Expression => {
    const arms: CaseArm[] = [];
    const other = { value: undefined as Expression | undefined };
    do {
      if (accept("OTHER")) {
        expect("->");
        other.value = parseExpression();
        break;
      }
      const condition = parseExpression();
      expect("->");
      arms.push({ condition, body: parseExpression() });
    } while (accept("[]"));
    return { kind: "Case", arms, other: other.value, location: getLocation(start) };
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
    const token = advance();
    const location = getLocation(token);
    if (token.kind === "Number") {
      return { kind: "Number", value: getNumeralValue(token.text), text: token.text, location };
    }
    if (token.kind === "Decimal") return { kind: "Decimal", text: token.text, location };
    if (token.kind === "String") return { kind: "String", value: token.text, location };
    if (token.kind === "Identifier") {
      if (isLabelAhead()) {
        const params = accept("(") ? parseSeparated(expectIdentifier) : [];
        if (params.length > 0) expect(")");
        expect("::");
        return { kind: "Label", name: token.text, params, body: parseExpression(), location };
      }
      const hasArguments = isAt("(");
      const args = hasArguments ? parseArguments() : [];
      if (!isSelectorAhead()) {
        return hasArguments
          ? { kind: "Apply", operator: token.text, args, location }
          : { kind: "Identifier", name: token.text, location };
      }
      const selectors: Selector[] = [{ kind: "Name", name: token.text, args }];
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
      return qualifiedArgs.length > 0
        ? { kind: "Apply", operator, args: qualifiedArgs, location }
        : { kind: "Identifier", name: operator, location };
    }
    const isOperatorName =
      INFIX_OPERATORS.has(token.text) || POSTFIX_OPERATORS.has(token.text) || token.text === "-.";
    if (token.kind === "Operator" && isOperatorName && isAt("("))
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
        while (!accept("IN")) {
          if (accept("RECURSIVE")) {
            parseDeclarations().forEach((declaration) => recursiveNames.add(declaration.name));
            continue;
          }
          const unit = parseDefinition(false);
          if (unit.kind === "Instance") instances.push(unit);
          else definitions.push(unit);
        }
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
    throw createError(`Unexpected ${describe(token)}`, token);
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
          return { kind: "Apply", operator: "-.", args: [parseExpression(13)], location };
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

  const parseParams = (): OperatorParam[] => {
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
    if (
      token.kind === "Identifier" &&
      peek(1).kind === "Operator" &&
      INFIX_OPERATORS.has(peek(1).text)
    ) {
      if (peek(2).kind === "Identifier" && isAt("==", 3)) {
        const left = expectIdentifier();
        const operator = advance().text;
        const right = expectIdentifier();
        expect("==");
        return {
          kind: "Operator",
          name: operator,
          params: [
            { name: left, arity: 0 },
            { name: right, arity: 0 },
          ],
          ...parseBody(),
          isLocal,
          isRecursive: recursiveNames.has(operator),
          location,
        };
      }
    }
    const isPrefixDefinition = token.kind === "Operator" && token.text === "-.";
    const isPostfixDefinition =
      token.kind === "Identifier" && POSTFIX_OPERATORS.has(peek(1).text) && isAt("==", 2);
    if (isPrefixDefinition || isPostfixDefinition) {
      const operator = isPrefixDefinition ? token.text : peek(1).text;
      cursor.index += isPrefixDefinition ? 1 : 2;
      const param = isPrefixDefinition ? expectIdentifier() : token.text;
      expect("==");
      return {
        kind: "Operator",
        name: operator,
        params: [{ name: param, arity: 0 }],
        ...parseBody(),
        isLocal,
        isRecursive: recursiveNames.has(operator),
        location,
      };
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
        isRecursive: recursiveNames.has(name),
        location,
      };
    }
    const params = parseParams();
    expect("==");
    if (isAt("INSTANCE")) return parseInstance(name, params, isLocal, location);
    return {
      kind: "Operator",
      name,
      params,
      ...parseBody(),
      isLocal,
      isRecursive: recursiveNames.has(name),
      location,
    };
  };

  const parseInstance = (
    name: string | undefined,
    params: OperatorParam[],
    isLocal: boolean,
    location: SourceLocation,
  ): Instance => {
    expect("INSTANCE");
    const module = expectIdentifier();
    const substitutions = accept("WITH")
      ? parseSeparated((): InstanceSubstitution => {
          const target = advance().text;
          expect("<-");
          return { name: target, expression: parseArgument() };
        })
      : [];
    return { kind: "Instance", name, params, module, substitutions, isLocal, location };
  };

  const parseDeclarations = (): Declaration[] =>
    parseSeparated(() => {
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
    });

  const isUnitStart = (token: Token, next: Token) => {
    if (token.column !== 1) return false;
    if (token.kind === "Separator" || token.kind === "ModuleEnd" || token.kind === "End")
      return true;
    if (token.kind === "Keyword") return UNIT_KEYWORDS.has(token.text);
    return (
      token.kind === "Identifier" && (next.text === "==" || next.text === "(" || next.text === "[")
    );
  };

  const isStepStart = (index: number) =>
    tokens[index].text === "<" &&
    tokens[index + 1]?.kind === "Number" &&
    tokens[index + 2]?.text === ">";

  const isDeclared = (name: string) =>
    !factNames.has(name) &&
    openModules.some(
      (module) =>
        module.constants.some((constant) => constant.name === name) ||
        module.variables.some((variable) => variable.name === name) ||
        module.definitions.some((definition) => definition.name === name),
    );

  const isHideFact = (fact: Token[]) => {
    if (fact[0].text === "MODULE" || fact[0].text === "<") return true;
    if (fact[0].kind !== "Identifier") return false;
    if (fact.length > 1) return fact[1].text === "!";
    return !BUILTIN_CONSTANTS.has(fact[0].text) && !isDeclared(fact[0].text);
  };

  const checkHideFacts = (hide: number) => {
    const facts: Token[][] = [[]];
    const depth = { value: 0 };
    for (let index = hide + 1; ; index++) {
      const token = tokens[index];
      const previous = tokens[index - 1];
      const isBracket = token.kind !== "String";
      const isEnd =
        depth.value === 0 &&
        (token.kind === "End" ||
          token.kind === "ModuleEnd" ||
          token.kind === "Separator" ||
          token.text === "DEF" ||
          token.text === "DEFS" ||
          (token.line > previous.line && isUnitStart(token, tokens[index + 1])) ||
          (isStepStart(index) && index > hide + 1 && previous.text !== ","));
      if (isEnd) break;
      if (isBracket && ["(", "[", "{", "<<"].includes(token.text)) depth.value++;
      if (isBracket && [")", "]", "}", ">>"].includes(token.text)) depth.value--;
      if (depth.value === 0 && token.text === ",") facts.push([]);
      else facts[facts.length - 1].push(token);
    }
    const invalid = facts.find((fact) => fact.length > 0 && !isHideFact(fact));
    if (invalid) {
      throw createError(
        "The only expression allowed as a fact in a HIDE is the name of a theorem, assumption, or step",
        invalid[0],
      );
    }
  };

  const skipUnit = (start: Token) => {
    while (peekRaw().kind !== "End") {
      const token = peekRaw();
      if (token.line > start.line && isUnitStart(token, peekRaw(1))) return;
      if (token.kind === "Identifier" && token.text === "HIDE") checkHideFacts(cursor.index);
      cursor.index++;
    }
  };

  const isProofStart = (index: number, start: Token) => {
    const token = tokens[index];
    if (token.kind === "End") return true;
    if (token.line > start.line && isUnitStart(token, tokens[index + 1])) return true;
    if (token.text === "PROOF" || PROOF_WORDS.has(token.text)) return true;
    return (
      token.text === "<" && tokens[index + 1]?.kind === "Number" && tokens[index + 2]?.text === ">"
    );
  };

  const parseTheorem = (module: Module) => {
    const start = cursor.index;
    const keyword = advance();
    const isNamed = peek().kind === "Identifier" && isAt("==", 1);
    if (isNamed) factNames.add(peek().text);
    if (isAt("ASSUME", isNamed ? 2 : 0)) {
      skipUnit(keyword);
      return;
    }
    const name = isNamed ? expectIdentifier() : undefined;
    if (isNamed) advance();
    const end = { value: cursor.index };
    while (!isProofStart(end.value, keyword)) end.value++;
    cursor.limit = end.value;
    const body = parseExpression();
    const isComplete = cursor.index === end.value;
    cursor.limit = tokens.length;
    skipUnit(keyword);
    if (!isComplete) return;
    module.theorems.push(body);
    if (name === undefined) return;
    module.definitions.push(
      withRange(
        {
          kind: "Operator",
          name,
          params: [],
          body,
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
      extends: accept("EXTENDS") ? parseSeparated(expectIdentifier) : [],
      constants: [],
      variables: [],
      definitions: [],
      instances: [],
      assumptions: [],
      location,
      theorems: [],
    };
    openModules.push(module);
    while (true) {
      const tokenIndex = cursor.index;
      const token = peek();
      if (token.kind === "ModuleEnd" || token.kind === "End") {
        openModules.pop();
        return module;
      }
      if (token.kind === "Separator") {
        if (isAt("MODULE", 1)) {
          module.modules.push(parseModuleBody());
          expect("====");
        } else advance();
        continue;
      }
      switch (token.text) {
        case "CONSTANT":
        case "CONSTANTS":
          advance();
          module.constants.push(...parseDeclarations());
          continue;
        case "VARIABLE":
        case "VARIABLES":
          advance();
          module.variables.push(
            ...parseSeparated(() => {
              const start = cursor.index;
              const location = getLocation(peek());
              return withRange({ name: expectIdentifier(), arity: 0, location }, start);
            }),
          );
          continue;
        case "ASSUME":
        case "ASSUMPTION":
        case "AXIOM": {
          const assumption = parseAssumption();
          module.assumptions.push(assumption);
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
        case "HIDE":
          skipUnit(token);
          continue;
        case "RECURSIVE":
          advance();
          parseDeclarations().forEach((declaration) => recursiveNames.add(declaration.name));
          continue;
        case "INSTANCE":
          module.instances.push(
            withRange(parseInstance(undefined, [], false, getLocation(token)), tokenIndex),
          );
          continue;
        case "LOCAL": {
          advance();
          if (isAt("INSTANCE")) {
            module.instances.push(
              withRange(parseInstance(undefined, [], true, getLocation(token)), tokenIndex),
            );
            continue;
          }
          const unit = parseDefinition(true);
          if (unit.kind === "Instance") module.instances.push(unit);
          else module.definitions.push(unit);
          continue;
        }
      }
      if (token.kind === "Keyword" && THEOREM_KEYWORDS.has(token.text)) {
        parseTheorem(module);
        continue;
      }
      const unit = parseDefinition(false);
      if (unit.kind === "Instance") module.instances.push(unit);
      else module.definitions.push(unit);
    }
  };

  return parseModuleBody();
};
