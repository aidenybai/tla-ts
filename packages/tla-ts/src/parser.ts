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
  OperatorParam,
  RecordField,
  SourceLocation,
} from "./ast";
import { TlaSyntaxError, TlaUnsupportedError } from "./errors";
import { tokenize, type Token } from "./lexer";

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

const NO_OFFSIDE = -1;

export const parseModule = (source: string): Module => {
  const tokens = tokenize(source);
  const cursor = { index: 0, offsideColumns: [] as number[] };
  const recursiveNames = new Set<string>();

  const getLocation = (token: Token): SourceLocation => ({
    line: token.line,
    column: token.column,
  });

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
    token.kind === "End" ? "end of input" : `${JSON.stringify(token.text)}`;

  const createError = (message: string, token = peekRaw()) =>
    new TlaSyntaxError(`${message} at line ${token.line}, column ${token.column}`);

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
      cursor.index++;
      return { kind: "Identifier", name: token.text, location: getLocation(token) };
    }
    if (isAt("<<") || isAt("(")) return parsePrimary();
    throw createError(`Expected a subscript but found ${describe(token)}`);
  };

  const parseArgument = (): Expression => {
    const token = peek();
    const next = peek(1);
    const isOperatorAlone =
      token.kind === "Operator" &&
      (INFIX_OPERATORS.has(token.text) || PREFIX_OPERATOR_REFERENCES.has(token.text)) &&
      (next.text === "," || next.text === ")");
    if (isOperatorAlone) {
      cursor.index++;
      return { kind: "OperatorReference", operator: token.text, location: getLocation(token) };
    }
    if (isAt("LAMBDA")) {
      advance();
      const params = parseSeparated(expectIdentifier);
      expect(":");
      return { kind: "Lambda", params, body: parseExpression(), location: getLocation(token) };
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
              path.push({ kind: "Field", name: expectIdentifier() });
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
    if (isBoundAhead()) {
      const bounds = parseBounds();
      expect(":");
      return { kind, bounds, body: parseExpression(), location };
    }
    const names = parseSeparated(expectIdentifier);
    expect(":");
    return { kind: "UnboundedQuantifier", names, body: parseExpression(), location };
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

  const parsePrimary = (): Expression => {
    const token = advance();
    const location = getLocation(token);
    if (token.kind === "Number") return { kind: "Number", value: Number(token.text), location };
    if (token.kind === "String") return { kind: "String", value: token.text, location };
    if (token.kind === "Identifier") {
      if (isLabelAhead()) {
        while (!accept("::")) advance();
        return parseExpression();
      }
      if (isAt("("))
        return { kind: "Apply", operator: token.text, args: parseArguments(), location };
      if (isAt("!") && peek(1).kind === "Identifier") {
        throw new TlaUnsupportedError(
          `Instance references such as ${token.text}!${peek(1).text} are not supported yet`,
        );
      }
      return { kind: "Identifier", name: token.text, location };
    }
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
        return parseQuantifier(token);
      case "\\AA":
      case "\\EE":
        throw new TlaUnsupportedError("Temporal quantifiers \\AA and \\EE are not supported");
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
        while (!accept("IN")) {
          if (accept("RECURSIVE")) {
            parseDeclarations().forEach((declaration) => recursiveNames.add(declaration.name));
            continue;
          }
          definitions.push(parseDefinition(false));
        }
        return { kind: "Let", definitions, body: parseExpression(), location };
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
    const state = {
      left: parsePrefix(),
      previous: undefined as (InfixOperator & { text: string }) | undefined,
    };
    while (true) {
      const token = peek();
      if (token.kind !== "Operator") break;
      const location = getLocation(token);
      if (token.text === "'" && minimumPrecedence <= 15) {
        advance();
        state.left = { kind: "Prime", expression: state.left, location };
        continue;
      }
      if (POSTFIX_OPERATORS.has(token.text) && minimumPrecedence <= 15) {
        advance();
        state.left = { kind: "Apply", operator: token.text, args: [state.left], location };
        continue;
      }
      if (token.text === "[") {
        advance();
        const args = withoutOffside(() => parseSeparated(() => parseExpression()));
        withoutOffside(() => expect("]"));
        state.left = { kind: "FunctionApplication", function: state.left, args, location };
        continue;
      }
      if (token.text === "." && peek(1).kind === "Identifier") {
        advance();
        state.left = {
          kind: "FieldAccess",
          record: state.left,
          field: expectIdentifier(),
          location,
        };
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
      state.previous = { ...infix, text: token.text };
    }
    return state.left;
  };

  const parseParams = (): OperatorParam[] => {
    if (!accept("(")) return [];
    const params = parseSeparated((): OperatorParam => {
      const name = expectIdentifier();
      if (!accept("(")) return { name, arity: 0 };
      const placeholders = parseSeparated(() => expect("_"));
      expect(")");
      return { name, arity: placeholders.length };
    });
    expect(")");
    return params;
  };

  const parseDefinition = (isLocal: boolean): Definition => {
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
          body: parseExpression(),
          isLocal,
          isRecursive: recursiveNames.has(operator),
          location,
        };
      }
    }
    if (token.kind === "Operator" && token.text === "-" && isAt(".", 1)) {
      throw new TlaUnsupportedError("Prefix operator definitions are not supported");
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
    if (isAt("INSTANCE")) {
      throw new TlaUnsupportedError(`Named instance ${name} is not supported yet`);
    }
    return {
      kind: "Operator",
      name,
      params,
      body: parseExpression(),
      isLocal,
      isRecursive: recursiveNames.has(name),
      location,
    };
  };

  const parseDeclarations = (): Declaration[] =>
    parseSeparated(() => {
      if (isAt("_") && peek(1).kind === "Operator") {
        advance();
        const operator = advance().text;
        return accept("_") ? { name: operator, arity: 2 } : { name: operator, arity: 1 };
      }
      if (peek().kind === "Operator" && isAt("_", 1)) {
        const operator = advance().text;
        advance();
        return { name: operator === "-" ? "-." : operator, arity: 1 };
      }
      const name = expectIdentifier();
      if (!accept("(")) return { name, arity: 0 };
      const placeholders = parseSeparated(() => expect("_"));
      expect(")");
      return { name, arity: placeholders.length };
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

  const skipTheorem = () => {
    const start = advance();
    while (peekRaw().kind !== "End") {
      const token = peekRaw();
      if (token.line > start.line && isUnitStart(token, peekRaw(1))) return;
      cursor.index++;
    }
  };

  const parseAssumption = (): Assumption => {
    const keyword = advance();
    const location = getLocation(keyword);
    const isAxiom = keyword.text === "AXIOM";
    if (peek().kind === "Identifier" && isAt("==", 1)) {
      const name = expectIdentifier();
      advance();
      return { name, expression: parseExpression(), isAxiom, location };
    }
    return { name: undefined, expression: parseExpression(), isAxiom, location };
  };

  const parseModuleBody = (): Module => {
    expect("----");
    expect("MODULE");
    const name = expectIdentifier();
    expect("----");
    const module: Module = {
      name,
      extends: accept("EXTENDS") ? parseSeparated(expectIdentifier) : [],
      constants: [],
      variables: [],
      definitions: [],
      assumptions: [],
    };
    while (true) {
      const token = peek();
      if (token.kind === "ModuleEnd" || token.kind === "End") return module;
      if (token.kind === "Separator") {
        if (isAt("MODULE", 1))
          throw new TlaUnsupportedError("Nested modules are not supported yet");
        advance();
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
          module.variables.push(...parseSeparated(expectIdentifier));
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
        case "RECURSIVE":
          advance();
          parseDeclarations().forEach((declaration) => recursiveNames.add(declaration.name));
          continue;
        case "INSTANCE":
          throw new TlaUnsupportedError("INSTANCE is not supported yet");
        case "LOCAL":
          advance();
          if (isAt("INSTANCE")) throw new TlaUnsupportedError("INSTANCE is not supported yet");
          module.definitions.push(parseDefinition(true));
          continue;
      }
      if (token.kind === "Keyword" && THEOREM_KEYWORDS.has(token.text)) {
        skipTheorem();
        continue;
      }
      module.definitions.push(parseDefinition(false));
    }
  };

  return parseModuleBody();
};
