import { createSanyError, TlaParseError, TlaSyntaxError } from "./errors";
import { parseModule } from "./parser";
import {
  _BM0,
  _BM1,
  _BM2,
  ACTION,
  AND,
  ARAB,
  ARROW,
  ARSB,
  ASSUME,
  ASSUMPTION,
  BANG,
  BEGIN_PRAGMA,
  BOXASSUME,
  BOXPROVE,
  BY,
  CASE,
  CASESEP,
  CHOOSE,
  COLON,
  COLONCOLON,
  COMMA,
  CONSTANT,
  createSanyLexer,
  DEF,
  DEFBREAK,
  DEFINE,
  DF,
  DOT,
  ELSE,
  END_MODULE,
  EOF,
  EQUALS,
  escapeImage,
  EXCEPT,
  EXISTS,
  EXTENDS,
  FORALL,
  HAVE,
  HIDE,
  IDENTIFIER,
  IF,
  IN,
  INSTANCE,
  LAB,
  LAMBDA,
  LBC,
  LBR,
  LET,
  LETIN,
  LOCAL,
  LSB,
  MAPTO,
  MINUS,
  MODULE,
  NEGATIVE,
  NEW,
  NUMBER,
  NUMBER_LITERAL,
  OBVIOUS,
  OMITTED,
  ONLY,
  OR,
  OTHER,
  PICK,
  PROOF,
  PROOF_IMPLICIT_STEP,
  PROOF_STEP,
  PROPOSITION,
  PROVE,
  QED,
  RAB,
  RBC,
  RBR,
  RECURSIVE,
  RSB,
  SEPARATOR,
  SF,
  STATE,
  STRING_LITERAL,
  SUBSTITUTE,
  SUFFICES,
  T_EXISTS,
  T_FORALL,
  TAKE,
  TEMPORAL,
  THEN,
  THEOREM,
  US,
  USE,
  VARIABLE,
  WF,
  WITH,
  WITNESS,
  type SanyToken,
} from "./sany-lexer";

// A lookahead scan of SANY's grammar. It returns whether the tokens matched.
type Scan = () => boolean;

type ScanItem = number | Scan;

interface SyntaxNode {
  kind: number | string;
  image: string;
  location: number[];
  heirs: SyntaxNode[];
}

interface Operator {
  name: string;
  low: number;
  high: number;
  associativity: "none" | "left" | "right";
  fix: "prefix" | "postfix" | "infix" | "nfix";
}

interface StackElement {
  node: SyntaxNode | undefined;
  operator: Operator | undefined;
}

interface LookaheadCall {
  generation: number;
  first: SanyToken | undefined;
  amount: number;
}

interface Junction {
  isConjunction: boolean;
  column: number;
}

// The state of SANY's parser: the last token it consumed, what its error message would say, and
// the context its productions keep.
interface ParserState {
  token: SanyToken;
  nextKind: number;
  generation: number;
  expectedGeneration: number;
  moduleName: string | undefined;
  expecting: string;
  lastOperator: Operator | undefined;
  fairnessHook: SyntaxNode | undefined;
  proofDepth: number;
  operatorStack: StackElement[] | undefined;
}

// The state of a lookahead scan, and of the rescan that finds the tokens an error message shows.
interface ScannerState {
  scanPosition: SanyToken;
  lastPosition: SanyToken;
  remaining: number;
  isSucceeded: boolean;
  isLookingAhead: boolean;
  isRescanning: boolean;
  endPosition: number;
  longestExpected: number;
}

interface ProductionFrame {
  name: string;
  token: SanyToken;
}

const MAX_INT = 2147483647;

const MIN_INT = -2147483648;

const getRange = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, offset) => from + offset);

const PREFIX_OPERATORS = getRange(118, 127);

const NON_EXPRESSION_PREFIX_OPERATORS = getRange(117, 127);

const INFIX_OPERATORS = getRange(128, 288);

const POSTFIX_OPERATORS = getRange(113, 116);

const STEP_STARTS = getRange(290, 294);

const OPEN_STARTS = [CASE, CHOOSE, EXISTS, FORALL, IF, LET, T_EXISTS, T_FORALL];

const PRIMITIVE_STARTS = new Set(getRange(113, 291));

const BRACKETED_STARTS = new Set([SF, WF, LBR, LSB, LBC, LAB]);

const NEW_SYMBOL_STARTS = new Set([ACTION, CONSTANT, NEW, STATE, TEMPORAL, VARIABLE]);

const OPERATOR_DECLARATION_STARTS = new Set([US, ...NON_EXPRESSION_PREFIX_OPERATORS]);

const FAIRNESS_SUBSCRIPTS = new Set([
  "Tuple",
  "ParenExpr",
  "SetEnumerate",
  "SubsetOf",
  "SetOfAll",
  "SetOfFcns",
  "RcdConstructor",
  "SetOfRcds",
  "Except",
  "FcnConst",
  "ActionExpr",
]);

const OPERATOR_ROWS: [string, number, number, Operator["associativity"], Operator["fix"]][] = [
  ["[", 160, 160, "left", "postfix"],
  [".", 170, 170, "left", "infix"],
  ["'", 150, 150, "none", "postfix"],
  ["^", 140, 140, "none", "infix"],
  ["/", 130, 130, "none", "infix"],
  ["*", 130, 130, "left", "infix"],
  ["-", 110, 110, "left", "infix"],
  ["-.", 120, 120, "none", "prefix"],
  ["+", 100, 100, "left", "infix"],
  ["=", 50, 50, "none", "infix"],
  ["\\lnot", 40, 40, "left", "prefix"],
  ["\\land", 30, 30, "left", "infix"],
  ["\\lor", 30, 30, "left", "infix"],
  ["~>", 20, 20, "none", "infix"],
  ["=>", 10, 10, "none", "infix"],
  ["[]", 40, 150, "none", "prefix"],
  ["<>", 40, 150, "none", "prefix"],
  ["ENABLED", 40, 150, "none", "prefix"],
  ["UNCHANGED", 40, 150, "none", "prefix"],
  ["SUBSET", 100, 130, "none", "prefix"],
  ["UNION", 100, 130, "none", "prefix"],
  ["DOMAIN", 100, 130, "none", "prefix"],
  ["^+", 150, 150, "none", "postfix"],
  ["^*", 150, 150, "none", "postfix"],
  ["^#", 150, 150, "none", "postfix"],
  ["\\cdot", 50, 140, "left", "infix"],
  ["\\equiv", 20, 20, "none", "infix"],
  ["-+->", 20, 20, "none", "infix"],
  ["/=", 50, 50, "none", "infix"],
  ["\\subseteq", 50, 50, "none", "infix"],
  ["\\in", 50, 50, "none", "infix"],
  ["\\notin", 50, 50, "none", "infix"],
  ["<", 50, 50, "none", "infix"],
  ["\\leq", 50, 50, "none", "infix"],
  [">", 50, 50, "none", "infix"],
  ["\\geq", 50, 50, "none", "infix"],
  ["\\times", 100, 130, "left", "nfix"],
  ["\\", 80, 80, "none", "infix"],
  ["\\intersect", 80, 80, "left", "infix"],
  ["\\union", 80, 80, "left", "infix"],
  ["...", 90, 90, "none", "infix"],
  ["..", 90, 90, "none", "infix"],
  ["|", 100, 110, "left", "infix"],
  ["||", 100, 110, "left", "infix"],
  ["&&", 130, 130, "left", "infix"],
  ["&", 130, 130, "left", "infix"],
  ["$$", 90, 130, "left", "infix"],
  ["$", 90, 130, "left", "infix"],
  ["??", 90, 130, "left", "infix"],
  ["%%", 100, 110, "left", "infix"],
  ["%", 100, 110, "none", "infix"],
  ["##", 90, 130, "left", "infix"],
  ["++", 100, 100, "left", "infix"],
  ["--", 110, 110, "left", "infix"],
  ["**", 130, 130, "left", "infix"],
  ["//", 130, 130, "none", "infix"],
  ["^^", 140, 140, "none", "infix"],
  ["@@", 60, 60, "left", "infix"],
  ["!!", 90, 130, "none", "infix"],
  ["|-", 50, 50, "none", "infix"],
  ["|=", 50, 50, "none", "infix"],
  ["-|", 50, 50, "none", "infix"],
  ["=|", 50, 50, "none", "infix"],
  ["<:", 70, 70, "none", "infix"],
  [":>", 70, 70, "none", "infix"],
  [":=", 50, 50, "none", "infix"],
  ["::=", 50, 50, "none", "infix"],
  ["\\oplus", 100, 100, "left", "infix"],
  ["\\ominus", 110, 110, "left", "infix"],
  ["\\odot", 130, 130, "left", "infix"],
  ["\\oslash", 130, 130, "none", "infix"],
  ["\\otimes", 130, 130, "left", "infix"],
  ["\\uplus", 90, 130, "left", "infix"],
  ["\\sqcap", 90, 130, "left", "infix"],
  ["\\sqcup", 90, 130, "left", "infix"],
  ["\\div", 130, 130, "none", "infix"],
  ["\\wr", 90, 140, "none", "infix"],
  ["\\star", 130, 130, "left", "infix"],
  ["\\o", 130, 130, "left", "infix"],
  ["\\bigcirc", 130, 130, "left", "infix"],
  ["\\bullet", 130, 130, "left", "infix"],
  ["\\prec", 50, 50, "none", "infix"],
  ["\\succ", 50, 50, "none", "infix"],
  ["\\preceq", 50, 50, "none", "infix"],
  ["\\succeq", 50, 50, "none", "infix"],
  ["\\sim", 50, 50, "none", "infix"],
  ["\\simeq", 50, 50, "none", "infix"],
  ["\\ll", 50, 50, "none", "infix"],
  ["\\gg", 50, 50, "none", "infix"],
  ["\\asymp", 50, 50, "none", "infix"],
  ["\\subset", 50, 50, "none", "infix"],
  ["\\supset", 50, 50, "none", "infix"],
  ["\\supseteq", 50, 50, "none", "infix"],
  ["\\approx", 50, 50, "none", "infix"],
  ["\\cong", 50, 50, "none", "infix"],
  ["\\sqsubset", 50, 50, "none", "infix"],
  ["\\sqsubseteq", 50, 50, "none", "infix"],
  ["\\sqsupset", 50, 50, "none", "infix"],
  ["\\sqsupseteq", 50, 50, "none", "infix"],
  ["\\doteq", 50, 50, "none", "infix"],
  ["\\propto", 50, 50, "none", "infix"],
];

const OPERATOR_TABLE: Operator[] = OPERATOR_ROWS.map((entry) => ({
  name: entry[0],
  low: entry[1],
  high: entry[2],
  associativity: entry[3],
  fix: entry[4],
}));

const OPERATOR_SYNONYMS = [
  ["\\lnot", "~", "\\neg", "¬"],
  ["[]", "□"],
  ["<>", "◇"],
  ["\\land", "/\\", "∧"],
  ["\\lor", "\\/", "∨"],
  ["\\equiv", "<=>", "≡", "⇔"],
  ["/=", "#", "≠"],
  ["\\leq", "<=", "=<", "≤"],
  ["\\geq", ">=", "≥"],
  ["\\times", "\\X", "×"],
  ["\\intersect", "\\cap", "∩"],
  ["\\union", "\\cup", "∪"],
  ["\\o", "\\circ", "∘"],
  ["\\oplus", "(+)", "⊕"],
  ["\\ominus", "(-)", "⊖"],
  ["\\odot", "(.)", "⊙"],
  ["\\oslash", "(/)", "⊘"],
  ["\\otimes", "(\\X)", "⊗"],
  ["\\approx", "≈"],
  [":=", "≔"],
  ["\\asymp", "≍"],
  ["\\bigcirc", "◯"],
  ["::=", "⩴"],
  ["\\bullet", "●"],
  ["\\cdot", "⋅"],
  ["\\cong", "≅"],
  ["\\div", "÷"],
  ["\\doteq", "≐"],
  ["..", "‥"],
  ["...", "…"],
  ["!!", "‼"],
  ["\\gg", "≫"],
  ["=>", "⇒"],
  ["\\in", "∈"],
  ["=|", "⫤"],
  ["~>", "↝"],
  ["\\ll", "≪"],
  ["-|", "⊣"],
  ["\\notin", "∉"],
  ["-+->", "⇸"],
  ["\\prec", "≺"],
  ["\\preceq", "⪯"],
  ["\\propto", "∝"],
  ["??", "⁇"],
  ["|=", "⊨"],
  ["|-", "⊢"],
  ["\\sim", "∼"],
  ["\\simeq", "≃"],
  ["\\sqcap", "⊓"],
  ["\\sqcup", "⊔"],
  ["\\sqsubset", "⊏"],
  ["\\sqsubseteq", "⊑"],
  ["\\sqsupset", "⊐"],
  ["\\sqsupseteq", "⊒"],
  ["\\star", "⋆"],
  ["\\subset", "⊂"],
  ["\\subseteq", "⊆"],
  ["\\succ", "≻"],
  ["\\succeq", "⪰"],
  ["\\supset", "⊃"],
  ["\\supseteq", "⊇"],
  ["\\uplus", "⊎"],
  ["||", "‖"],
  ["\\wr", "≀"],
  ["^+", "⁺"],
];

const getOperators = () => {
  const operators = new Map(OPERATOR_TABLE.map((operator) => [operator.name, operator]));
  for (const synonyms of OPERATOR_SYNONYMS) {
    const operator = operators.get(synonyms[0]);
    if (operator) for (const synonym of synonyms.slice(1)) operators.set(synonym, operator);
  }
  return operators;
};

const OPERATORS = getOperators();

const FUNCTION_OPERATOR = OPERATORS.get("[");

const VOID_OPERATOR: Operator = {
  name: "$$_void",
  low: 0,
  high: 0,
  associativity: "none",
  fix: "infix",
};

const getMixfix = (operator: Operator) =>
  operator.fix === "prefix" ? operator : OPERATORS.get(`${operator.name}.`);

const isInfix = (operator: Operator) => operator.fix === "infix" || operator.fix === "nfix";

const isSucceeding = (left: Operator, right: Operator) => left.low > right.high;

const isPreceding = (left: Operator, right: Operator) => left.high < right.low;

const isOperatorToken = (token: SanyToken | undefined) =>
  token !== undefined && token.kind >= 113 && token.kind <= 288;

const isInfixToken = (token: SanyToken | undefined) =>
  token !== undefined && token.kind >= 128 && token.kind <= 288;

// SANY's belchDEF: the index of the token that begins the left-hand side of a definition whose
// last token is at end, or 0 when it finds none.
const getDefinitionStart = (tokens: SanyToken[], end: number) => {
  const last = tokens[end];
  if (last.kind === RBR || last.kind === RSB) {
    const bracket = { index: end, depth: 1 };
    while (bracket.index > 0) {
      bracket.index--;
      const kind = tokens[bracket.index].kind;
      const isOpening = kind === LBR || kind === LSB;
      if (isOpening && bracket.depth === 1) break;
      if (isOpening) bracket.depth--;
      if (kind === RBR || kind === RSB) bracket.depth++;
    }
    return bracket.index > 0 && tokens[bracket.index - 1].kind === IDENTIFIER
      ? bracket.index - 1
      : bracket.index;
  }
  if (last.kind === IDENTIFIER) {
    const before = tokens[end - 1];
    const isOperatorLeftSide =
      isOperatorToken(before) &&
      !(before.kind >= 113 && before.kind <= 116) &&
      (!isInfixToken(before) || tokens[end - 2]?.kind === IDENTIFIER);
    return !isOperatorLeftSide || tokens[end - 2]?.kind === SUBSTITUTE
      ? end
      : isInfixToken(before)
        ? end - 2
        : end - 1;
  }
  return isOperatorToken(last) ? end - 1 : end;
};

const isFieldNameToken = (token: SanyToken) =>
  (token.kind >= ACTION && token.kind <= EXCEPT) ||
  token.kind === EXTENDS ||
  (token.kind >= IF && token.kind <= SF) ||
  token.kind === STATE ||
  (token.kind >= THEN && token.kind <= WITH) ||
  token.kind === US ||
  (token.kind >= 123 && token.kind <= 127);

const getLevelOfStep = (token: SanyToken) =>
  token.image[1] === "*"
    ? -1
    : token.image[1] === "+"
      ? -2
      : Number.parseInt(token.image.slice(1, token.image.indexOf(">")));

// SANY's message for a module its parser rejects, or undefined when SANY parses it. This ports the
// control flow of SANY's JavaCC parser and token manager, since the message depends on the
// productions and lookaheads the parser was in when it failed.
export const getSanyParseError = (source: string): string | undefined => {
  const lexer = createSanyLexer(source);
  const errors: string[] = [];
  const headToken: SanyToken = {
    kind: EOF,
    image: "",
    beginLine: 0,
    beginColumn: 0,
    endLine: 0,
    endColumn: 0,
    next: undefined,
  };
  const parser: ParserState = {
    token: headToken,
    nextKind: -1,
    generation: 0,
    expectedGeneration: -1,
    moduleName: undefined,
    expecting: "",
    lastOperator: undefined,
    fairnessHook: undefined,
    proofDepth: -1,
    operatorStack: undefined,
  };
  const scanner: ScannerState = {
    scanPosition: headToken,
    lastPosition: headToken,
    remaining: 0,
    isSucceeded: false,
    isLookingAhead: false,
    isRescanning: false,
    endPosition: 0,
    longestExpected: 0,
  };
  const proofLevels: number[] = [];
  const frames: ProductionFrame[] = [];
  const heirStack: (SyntaxNode | undefined)[] = [];
  const junctions: Junction[] = [];
  const operatorStacks: StackElement[][] = [];

  const getNext = (current: SanyToken) => (current.next ??= lexer.getNextToken());

  const getToken = (index: number) =>
    Array.from({ length: index }).reduce<SanyToken>(
      (current) => getNext(current),
      scanner.isLookingAhead ? scanner.scanPosition : parser.token,
    );

  const getNextKind = () =>
    parser.nextKind === -1 ? (parser.nextKind = getNext(parser.token).kind) : parser.nextKind;

  const markExpected = () => {
    parser.expectedGeneration = parser.generation;
    return false;
  };

  const isNextKind = (kind: number) => getNextKind() === kind || markExpected();

  const formatLocation = (node: SyntaxNode) =>
    `line ${node.location[0]}, col ${node.location[1]} to line ${node.location[2]}, col ${node.location[3]} of module ${parser.moduleName ?? "null"}`;

  const getParseError = (message: string) =>
    new TlaParseError(
      `***Parse Error***\n${parser.expecting === "" ? "" : `Was expecting "${parser.expecting}"\n`}${message}\n\nResidual stack trace follows:\n${frames
        .slice(-5)
        .reverse()
        .map(
          (frame) =>
            `${frame.name} starting at line ${frame.token.beginLine}, column ${frame.token.beginColumn}.\n`,
        )
        .join("")}`,
    );

  const addErrorToken = (position: number) => {
    if (position >= 100) return;
    if (position === scanner.endPosition + 1) {
      scanner.endPosition++;
      return;
    }
    if (scanner.endPosition === 0) return;
    scanner.longestExpected = Math.max(scanner.longestExpected, scanner.endPosition);
    if (position !== 0) scanner.endPosition = position;
  };

  // How far the scan has reached past start, while that is within the 100 tokens JavaCC tracks.
  const getScanOffset = (start: SanyToken | undefined, offset: number): number | undefined =>
    start === undefined || offset >= 100
      ? undefined
      : start === scanner.scanPosition
        ? offset
        : getScanOffset(start.next, offset + 1);

  const scanToken = (kinds: ReadonlySet<number>) => {
    if (scanner.scanPosition === scanner.lastPosition) {
      scanner.remaining--;
      scanner.lastPosition = getNext(scanner.scanPosition);
    }
    scanner.scanPosition = getNext(scanner.scanPosition);
    const offset = scanner.isRescanning ? getScanOffset(parser.token, 0) : undefined;
    if (offset !== undefined) addErrorToken(offset);
    if (!kinds.has(scanner.scanPosition.kind)) return false;
    if (scanner.remaining === 0 && scanner.scanPosition === scanner.lastPosition)
      scanner.isSucceeded = true;
    return true;
  };

  const toScan = (item: ScanItem): Scan => {
    if (typeof item !== "number") return item;
    const kinds = new Set([item]);
    return () => scanToken(kinds);
  };

  const oneOf = (...kinds: number[]): Scan => {
    const kindSet = new Set(kinds);
    return () => scanToken(kindSet);
  };

  const sequence = (...items: ScanItem[]): Scan => {
    const scans = items.map(toScan);
    return () => {
      for (const scan of scans) {
        if (!scan()) return false;
        if (scanner.isSucceeded) return true;
      }
      return true;
    };
  };

  const choice = (...items: ScanItem[]): Scan => {
    const scans = items.map(toScan);
    return () => {
      const start = scanner.scanPosition;
      for (const scan of scans) {
        scanner.scanPosition = start;
        if (scan()) return true;
      }
      return false;
    };
  };

  const optional = (item: ScanItem): Scan => {
    const scan = toScan(item);
    return () => {
      const start = scanner.scanPosition;
      if (!scan()) scanner.scanPosition = start;
      return true;
    };
  };

  const repeat = (item: ScanItem): Scan => {
    const scan = toScan(item);
    return () => {
      for (;;) {
        const start = scanner.scanPosition;
        if (!scan()) {
          scanner.scanPosition = start;
          return true;
        }
        if (scanner.isSucceeded) return true;
      }
    };
  };

  const guard = (isAllowed: () => boolean, item: ScanItem): Scan => {
    const scan = toScan(item);
    return () => {
      scanner.isLookingAhead = true;
      const isAllowedHere = isAllowed();
      scanner.isLookingAhead = false;
      return isAllowedHere && scan();
    };
  };

  const isAboveJunction = (column: number) =>
    junctions.length === 0 || junctions[junctions.length - 1].column < column;

  const isNextAboveJunction = () => isAboveJunction(getToken(1).beginColumn);

  const isNewBullet = () => {
    const next = getToken(1);
    const junction = junctions.at(-1);
    return (
      junction !== undefined &&
      (next.kind === AND || next.kind === OR) &&
      junction.column === next.beginColumn &&
      junction.isConjunction === (next.kind === AND)
    );
  };

  const isNextAssume = () => getToken(1).kind === ASSUME || getToken(1).kind === BOXASSUME;

  const isNestedAssume = () =>
    isNextAssume() ||
    (getToken(2).kind === COLONCOLON &&
      (getToken(3).kind === ASSUME || getToken(3).kind === BOXASSUME));

  const isOperandExpected = () => {
    const operator = parser.operatorStack?.at(-1)?.operator;
    return (
      parser.operatorStack === undefined ||
      parser.operatorStack.length === 0 ||
      (operator !== undefined && operator.fix !== "postfix")
    );
  };

  // SANY's matchFcnConst: whether the tokens ahead begin "<< ... >> \in" or "x, y \in".
  const isFunctionBound = () => {
    const first = getNext(scanner.isLookingAhead ? scanner.scanPosition : parser.token);
    if (first.kind === LAB) {
      const tuple = { token: first, depth: 1 };
      while (tuple.depth !== 0) {
        tuple.token = getNext(tuple.token);
        if (tuple.token.kind === LAB) tuple.depth++;
        if (tuple.token.kind === RAB) tuple.depth--;
        if (tuple.token.kind === EOF) return false;
      }
      return getNext(tuple.token).kind === IN;
    }
    if (first.kind !== IDENTIFIER) return false;
    const list = { token: getNext(first) };
    while (list.token.kind === COMMA) {
      const identifier = getNext(list.token);
      if (identifier.kind !== IDENTIFIER) return false;
      list.token = getNext(identifier);
    }
    return list.token.kind === IN;
  };

  const expression: Scan = () => expressionScan();
  const assumeProve: Scan = () => assumeProveScan();
  const identifierTuple = sequence(
    LAB,
    optional(sequence(IDENTIFIER, repeat(sequence(COMMA, IDENTIFIER)))),
    RAB,
  );
  const boundStart = choice(identifierTuple, IDENTIFIER);
  const decimalPart = sequence(DOT, NUMBER_LITERAL);
  const number = sequence(NUMBER_LITERAL, optional(decimalPart));
  const parenthesized = sequence(LBR, expression);
  const setContents = choice(
    guard(isFunctionBound, boundStart),
    expression,
    expression,
    expression,
  );
  const braceCases = sequence(LBC, optional(setContents), RBC);
  const bracketCases = sequence(
    LSB,
    choice(
      guard(isFunctionBound, boundStart),
      IDENTIFIER,
      guard(() => getToken(2).kind === MAPTO && isFieldNameToken(getToken(1)), IDENTIFIER),
      IDENTIFIER,
      expression,
    ),
  );
  const tupleOrAction = sequence(LAB, optional(expression), oneOf(RAB, ARAB));
  const junctionItem = sequence(oneOf(OR, AND), expression);
  const definition = sequence(
    optional(LOCAL),
    DEFBREAK,
    oneOf(IDENTIFIER, ...NON_EXPRESSION_PREFIX_OPERATORS),
  );
  const letDefinition = choice(definition, RECURSIVE);
  const identifierDeclaration = sequence(IDENTIFIER, optional(LBR));
  const operatorDeclaration = oneOf(US, ...NON_EXPRESSION_PREFIX_OPERATORS);
  const operatorArguments = sequence(
    LBR,
    choice(
      guard(
        isNextAboveJunction,
        oneOf(...NON_EXPRESSION_PREFIX_OPERATORS, ...INFIX_OPERATORS, ...POSTFIX_OPERATORS),
      ),
      guard(isNextAboveJunction, LAMBDA),
      expression,
    ),
  );
  const newConstant = sequence(NEW, CONSTANT);
  const constantDeclaration = sequence(identifierDeclaration, optional(IN));
  const constantSymbol = sequence(
    choice(newConstant, NEW, CONSTANT),
    choice(constantDeclaration, operatorDeclaration),
  );
  const variableSymbol = sequence(optional(NEW), VARIABLE, IDENTIFIER);
  const levelSymbol = sequence(
    optional(NEW),
    oneOf(STATE, ACTION, TEMPORAL),
    choice(identifierDeclaration, operatorDeclaration),
  );
  const assumeProveScan = sequence(
    optional(sequence(IDENTIFIER, COLONCOLON, assumeProve)),
    oneOf(ASSUME, BOXASSUME),
    choice(
      guard(isNestedAssume, assumeProve),
      choice(constantSymbol, variableSymbol, levelSymbol),
      expression,
    ),
    repeat(COMMA),
    oneOf(PROVE, BOXPROVE),
  );
  const assumptionName = sequence(optional(DEFBREAK), IDENTIFIER, DEF);
  const theoremName = sequence(IDENTIFIER, DEF);
  const proofKeyword = toScan(PROOF);
  const assertStep = sequence(
    optional(SUFFICES),
    choice(expression, guard(isNextAssume, assumeProve)),
  );
  const primitiveExpression = choice(
    guard(isNextAboveJunction, STRING_LITERAL),
    guard(isNextAboveJunction, number),
    sequence(
      oneOf(
        IDENTIFIER,
        PROOF_STEP,
        PROOF_IMPLICIT_STEP,
        ...INFIX_OPERATORS,
        ...POSTFIX_OPERATORS,
        ...NON_EXPRESSION_PREFIX_OPERATORS,
      ),
      optional(operatorArguments),
      repeat(BANG),
    ),
  );
  const expressionSuffix = choice(
    guard(isNextAboveJunction, oneOf(...POSTFIX_OPERATORS)),
    guard(isNextAboveJunction, DOT),
    guard(isNextAboveJunction, bracketCases),
  );
  const expressionContinuation = choice(
    guard(isNextAboveJunction, oneOf(...INFIX_OPERATORS)),
    guard(isNextAboveJunction, COLONCOLON),
  );
  const expressionScan = sequence(
    repeat(oneOf(...PREFIX_OPERATORS, ...INFIX_OPERATORS)),
    choice(
      guard(
        isNextAboveJunction,
        choice(
          sequence(oneOf(EXISTS, FORALL), choice(IDENTIFIER, boundStart)),
          sequence(oneOf(T_EXISTS, T_FORALL), IDENTIFIER),
          sequence(IF, expression),
          sequence(CASE, expression),
          sequence(LET, letDefinition, repeat(letDefinition)),
          sequence(CHOOSE, choice(IDENTIFIER, identifierTuple)),
        ),
      ),
      guard(
        isNextAboveJunction,
        sequence(
          choice(
            guard(isOperandExpected, choice(junctionItem, junctionItem)),
            choice(
              parenthesized,
              braceCases,
              bracketCases,
              tupleOrAction,
              sequence(
                oneOf(WF, SF),
                choice(IDENTIFIER, parenthesized, braceCases, bracketCases, tupleOrAction),
              ),
            ),
            primitiveExpression,
          ),
          repeat(expressionSuffix),
          optional(expressionContinuation),
        ),
      ),
    ),
  );

  // Each lookahead of SANY's grammar with the number of tokens it may scan, in the order JavaCC
  // numbers them, which is the order it rescans them to find the tokens an error message shows.
  const lookaheads = {
    moduleUnit: [
      choice(
        SEPARATOR,
        VARIABLE,
        CONSTANT,
        definition,
        RECURSIVE,
        sequence(optional(LOCAL), INSTANCE, IDENTIFIER),
        sequence(oneOf(ASSUMPTION, ASSUME), optional(assumptionName), expression),
        sequence(
          oneOf(THEOREM, PROPOSITION),
          optional(theoremName),
          choice(guard(isNextAssume, assumeProve), expression),
        ),
        oneOf(_BM0, _BM1, _BM2),
        guard(
          () =>
            (getToken(1).kind === USE && getToken(2).kind !== ONLY) || getToken(1).kind === HIDE,
          choice(sequence(optional(PROOF), BY), USE, HIDE),
        ),
      ),
      1,
    ],
    unitDefinition: [definition, 2],
    unitInstance: [sequence(optional(LOCAL), INSTANCE, IDENTIFIER), 2],
    unitAssumption: [sequence(oneOf(ASSUMPTION, ASSUME), optional(assumptionName), expression), 2],
    unitTheorem: [
      sequence(
        oneOf(THEOREM, PROPOSITION),
        optional(theoremName),
        choice(guard(isNextAssume, assumeProve), expression),
      ),
      2,
    ],
    constantArguments: [sequence(LBR, US), 2],
    definitionBody: [expression, 1],
    functionDefinition: [sequence(IDENTIFIER, LSB), MAX_INT],
    postfixDefinition: [sequence(IDENTIFIER, oneOf(...POSTFIX_OPERATORS)), MAX_INT],
    infixDefinition: [sequence(IDENTIFIER, oneOf(...INFIX_OPERATORS)), MAX_INT],
    identifierDefinition: [sequence(IDENTIFIER, oneOf(LBR, DEF)), MAX_INT],
    nextSubstitution: [
      sequence(
        COMMA,
        oneOf(
          IDENTIFIER,
          ...NON_EXPRESSION_PREFIX_OPERATORS,
          ...INFIX_OPERATORS,
          ...POSTFIX_OPERATORS,
        ),
        SUBSTITUTE,
      ),
      3,
    ],
    assumptionName: [assumptionName, 2],
    assumeExpression: [expression, 1],
    nextAssumeExpression: [expression, 1],
    newConstant: [newConstant, 2],
    constantDeclaration: [constantDeclaration, 2],
    constantSymbol: [constantSymbol, 2],
    variableSymbol: [variableSymbol, 2],
    levelSymbol: [levelSymbol, 2],
    theoremName: [theoremName, 2],
    theoremAssumeProve: [guard(isNextAssume, assumeProve), 3],
    theoremExpression: [expression, 1],
    proofKeyword: [proofKeyword, 2],
    terminalProof: [sequence(optional(PROOF), oneOf(OBVIOUS, OMITTED)), 2],
    stepProof: [
      sequence(optional(proofKeyword), repeat(oneOf(...STEP_STARTS)), oneOf(...STEP_STARTS)),
      1,
    ],
    usedExpression: [expression, 1],
    nextUsedExpression: [expression, 1],
    usedFacts: [choice(MODULE, expression), 1],
    definedExpression: [expression, 1],
    nextDefinedExpression: [expression, 1],
    assertStep: [assertStep, 1],
    nextDefinition: [definition, 2],
    takeBounds: [
      choice(sequence(IDENTIFIER, repeat(sequence(COMMA, IDENTIFIER)), IN), LAB),
      MAX_INT,
    ],
    pickIdentifiers: [sequence(IDENTIFIER, repeat(sequence(COMMA, IDENTIFIER)), COLON), MAX_INT],
    assertedExpression: [expression, 1],
    decimalPart: [decimalPart, 2],
    operatorArgument: [
      sequence(
        oneOf(...NON_EXPRESSION_PREFIX_OPERATORS, ...INFIX_OPERATORS, ...POSTFIX_OPERATORS),
        oneOf(
          COMMA,
          RBR,
          DEFBREAK,
          LOCAL,
          INSTANCE,
          THEOREM,
          ASSUME,
          END_MODULE,
          SEPARATOR,
          _BM0,
          ASSUMPTION,
          CONSTANT,
          VARIABLE,
          RECURSIVE,
        ),
      ),
      2,
    ],
    lambdaArgument: [toScan(LAMBDA), MAX_INT],
    expressionArgument: [expression, 1],
    unboundQuantifier: [sequence(IDENTIFIER, repeat(sequence(COMMA, IDENTIFIER)), COLON), MAX_INT],
    setEnumeration: [sequence(boundStart, COMMA), MAX_INT],
    setOfAll: [sequence(boundStart, COLON), MAX_INT],
    setExpression: [expression, 1],
    setContents: [setContents, 1],
    recordFields: [sequence(IDENTIFIER, MAPTO), MAX_INT],
    recordSets: [sequence(IDENTIFIER, COLON), MAX_INT],
    bracketExpression: [expression, 1],
    tupleContents: [expression, 1],
    identifierArguments: [operatorArguments, 2],
    fairnessArguments: [sequence(LBR, expression), 2],
    disjunctionList: [toScan(OR), MAX_INT],
    conjunctionList: [toScan(AND), MAX_INT],
    leadingOperator: [oneOf(...PREFIX_OPERATORS, MINUS), MAX_INT],
    openExpression: [oneOf(...OPEN_STARTS), MAX_INT],
    junctionList: [oneOf(AND, OR), MAX_INT],
    primitiveExpression: [primitiveExpression, 1],
    expressionSuffix: [expressionSuffix, 1],
    postfixSuffix: [oneOf(...POSTFIX_OPERATORS), MAX_INT],
    recordSuffix: [toScan(DOT), MAX_INT],
    applicationSuffix: [toScan(LSB), MAX_INT],
    nextLeadingOperator: [oneOf(...PREFIX_OPERATORS, MINUS), MAX_INT],
    nextOpenExpression: [oneOf(...OPEN_STARTS), MAX_INT],
    infixContinuation: [oneOf(...INFIX_OPERATORS), MAX_INT],
    labelContinuation: [toScan(COLONCOLON), MAX_INT],
    expressionContinuation: [expressionContinuation, 1],
    negativeOperator: [toScan(NEGATIVE), MAX_INT],
    primitiveArguments: [operatorArguments, 2],
    stringLiteral: [toScan(STRING_LITERAL), MAX_INT],
    numberLiteral: [toScan(NUMBER_LITERAL), MAX_INT],
    bangIdentifier: [toScan(IDENTIFIER), MAX_INT],
    bangArguments: [operatorArguments, 2],
    bangOperand: [
      choice(
        guard(() => getToken(1).image !== "@", IDENTIFIER),
        oneOf(...NON_EXPRESSION_PREFIX_OPERATORS),
        oneOf(...INFIX_OPERATORS),
        oneOf(...POSTFIX_OPERATORS),
      ),
      1,
    ],
    structureOperator: [
      choice(
        LAB,
        RAB,
        COLON,
        number,
        guard(() => getToken(1).image === "@", IDENTIFIER),
      ),
      1,
    ],
  } satisfies Record<string, [Scan, number]>;

  const lookaheadNames = Object.keys(lookaheads);
  const lookaheadCalls: LookaheadCall[][] = lookaheadNames.map(() => [
    { generation: 0, first: undefined, amount: 0 },
  ]);

  const runLookahead = (scan: Scan, start: SanyToken, amount: number) => {
    scanner.remaining = amount;
    scanner.scanPosition = start;
    scanner.lastPosition = start;
    scanner.isSucceeded = false;
    return scan();
  };

  // JavaCC's jj_2 call: a lookahead whose scan it records so a later error message can rescan it.
  const isLookahead = (name: keyof typeof lookaheads) => {
    const amount = lookaheads[name][1];
    const isMatched = runLookahead(lookaheads[name][0], parser.token, amount);
    const calls = lookaheadCalls[lookaheadNames.indexOf(name)];
    const call =
      calls.find((candidate) => candidate.generation <= parser.generation) ??
      calls[calls.push({ generation: 0, first: undefined, amount: 0 }) - 1];
    call.generation = parser.generation + amount - scanner.remaining;
    call.first = parser.token;
    call.amount = amount;
    return isMatched;
  };

  // The images of count tokens from start, as a parse error shows them, stopping at <EOF>.
  const getImages = (start: SanyToken, count: number): string[] =>
    count === 0
      ? []
      : start.kind === EOF
        ? ["<EOF>"]
        : [start.image, ...getImages(getNext(start), count - 1)];

  // JavaCC's generateParseException: the error shows as many tokens as the longest sequence the
  // lookaheads still pending at this token scanned.
  const getUnexpectedError = (kind = -1) => {
    scanner.longestExpected = kind >= 0 || parser.expectedGeneration === parser.generation ? 1 : 0;
    scanner.endPosition = 0;
    scanner.isRescanning = true;
    Object.values(lookaheads).forEach((lookahead, index) => {
      for (const call of lookaheadCalls[index]) {
        if (call.generation <= parser.generation || call.first === undefined) continue;
        runLookahead(lookahead[0], call.first, call.amount);
        if (scanner.isSucceeded) break;
      }
    });
    scanner.isRescanning = false;
    addErrorToken(0);
    const next = getNext(parser.token);
    return getParseError(
      `Encountered "${getImages(next, scanner.longestExpected).join(" ")}" at line ${next.beginLine}, column ${next.beginColumn} and token "${escapeImage(parser.token.image)}" `,
    );
  };

  const getNextUnexpectedError = () => {
    getNext(parser.token);
    parser.nextKind = -1;
    return getUnexpectedError();
  };

  const consume = (kind: number) => {
    const previous = parser.token;
    parser.token = getNext(parser.token);
    parser.nextKind = -1;
    if (parser.token.kind === kind) {
      parser.generation++;
      return parser.token;
    }
    parser.token = previous;
    throw getUnexpectedError(kind);
  };

  const consumeOneOf = (kinds: readonly number[]) => {
    if (kinds.includes(getNextKind())) return consume(getNextKind());
    markExpected();
    throw getNextUnexpectedError();
  };

  const getTokenNode = (current: SanyToken, kind: number | string = current.kind): SyntaxNode => ({
    kind,
    image: current.image,
    location: [current.beginLine, current.beginColumn, current.endLine, current.endColumn],
    heirs: [],
  });

  const getNode = (
    kind: string,
    ...groups: (SyntaxNode | SyntaxNode[] | undefined)[]
  ): SyntaxNode => {
    const heirs = groups.flatMap((group) => group ?? []);
    const location = [MAX_INT, MAX_INT, MIN_INT, MIN_INT];
    for (const heir of heirs) {
      if (
        heir.location[0] < location[0] ||
        (heir.location[0] === location[0] && heir.location[1] < location[1])
      ) {
        location[0] = heir.location[0];
        location[1] = heir.location[1];
      }
      if (
        heir.location[2] > location[2] ||
        (heir.location[2] === location[2] && heir.location[3] > location[3])
      ) {
        location[2] = heir.location[2];
        location[3] = heir.location[3];
      }
    }
    return { kind, image: kind, location, heirs };
  };

  const getIdPrefix = () => getNode("IdPrefix");

  const addHeir = (node: SyntaxNode) => heirStack.push(node);

  const getLastHeirs = () => {
    const start = heirStack.lastIndexOf(undefined) + 1;
    if (start === heirStack.length) return undefined;
    return heirStack.splice(start).filter((heir) => heir !== undefined);
  };

  const beginProduction = (name: string) => {
    heirStack.push(undefined);
    frames.push({ name, token: getToken(1) });
    parser.expecting = "";
  };

  const endProduction = () => {
    frames.pop();
    heirStack.pop();
    parser.expecting = "";
  };

  const inProduction = <Result>(name: string, parse: () => Result) => {
    beginProduction(name);
    const result = parse();
    endProduction();
    return result;
  };

  // Runs a production that adds its heirs, and makes the node of the kind it returns.
  const parseProduction = (name: string, parseHeirs: () => string) =>
    inProduction(name, () => {
      const kind = parseHeirs();
      return getNode(kind, getLastHeirs());
    });

  const convertFieldName = (current: SanyToken) => {
    if (isFieldNameToken(current)) current.kind = IDENTIFIER;
  };

  // SANY's belchDEF: inserts a DEFBREAK token before the left-hand side of the next definition.
  const insertDefinitionBreak = () => {
    const examined = [parser.token, getNext(parser.token)];
    for (;;) {
      const current = examined[examined.length - 1];
      const nextToken = getNext(current);
      if (
        [EOF, THEOREM, PROPOSITION, ASSUMPTION, END_MODULE].includes(nextToken.kind) ||
        current.kind === THEOREM ||
        current.kind === PROPOSITION
      ) {
        return;
      }
      if (current.kind === DEF) break;
      examined.push(nextToken);
    }
    const start = getDefinitionStart(examined, examined.length - 2);
    if (start <= 0 || examined[start - 1].kind === DEFBREAK) return;
    const target = examined[start];
    examined[start - 1].next = {
      kind: DEFBREAK,
      image: "Beginning of definition",
      beginLine: target.beginLine,
      beginColumn: target.beginColumn,
      endLine: target.endLine,
      endColumn: target.endColumn,
      next: target,
    };
  };

  const pushOperand = (node: SyntaxNode | undefined, operator?: Operator) =>
    parser.operatorStack?.push({ node, operator });

  const getStack = () => parser.operatorStack ?? [];

  const getElementNode = (index: number) => getStack()[index].node ?? getNode("Missing");

  const reduceInfix = (operator: Operator) => {
    const stack = getStack();
    const last = stack.length - 1;
    if (last < 3) return;
    const operatorNode = getElementNode(last - 2);
    const left = getElementNode(last - 3);
    const right = getElementNode(last - 1);
    stack.splice(last - 2, 2);
    const node =
      operator.fix === "nfix" && left.kind === "Times"
        ? getNode("Times", left.heirs, [operatorNode, right])
        : getNode(operator.fix === "nfix" ? "Times" : "InfixExpr", [left, operatorNode, right]);
    stack[last - 3] = { node, operator: undefined };
  };

  const reducePrefix = () => {
    const stack = getStack();
    const last = stack.length - 1;
    if (last < 2) return;
    const node = getNode("PrefixExpr", [getElementNode(last - 2), getElementNode(last - 1)]);
    stack.splice(last - 1, 1);
    stack[last - 2] = { node, operator: undefined };
  };

  const reducePostfix = () => {
    const stack = getStack();
    const last = stack.length - 1;
    if (last < 2) return;
    const operatorNode = getElementNode(last - 1);
    const node =
      stack[last - 1].operator === FUNCTION_OPERATOR
        ? getNode("FcnAppl", [getElementNode(last - 2)], operatorNode.heirs)
        : getNode("PostfixExpr", [getElementNode(last - 2), operatorNode]);
    stack.splice(last - 1, 1);
    stack[last - 2] = { node, operator: undefined };
  };

  // SANY's OperatorStack.reduceStack: reduces the operators on top of the stack as precedence
  // allows, and rejects combinations whose precedence ranges conflict.
  const reduceStack = () => {
    const stack = getStack();
    for (;;) {
      const last = stack.length - 1;
      const right = stack[last];
      const rightOperator = right.operator;
      if (rightOperator === undefined) return;
      const rightLocation = formatLocation(right.node ?? getNode("Missing"));
      if (rightOperator.fix === "postfix") {
        if (last === 0) {
          throw getParseError(
            `\n  Encountered postfix op ${rightOperator.name} in block ${rightLocation} on empty stack`,
          );
        }
        const below = stack[last - 1];
        if (below.operator !== undefined) {
          if (isInfix(below.operator) || below.operator.fix === "prefix") {
            throw getParseError(
              `\n  Encountered postfix op ${rightOperator.name} in block ${rightLocation} following prefix or infix op ${below.operator.name}.`,
            );
          }
          reducePostfix();
        } else {
          if (last <= 1) return;
          const leftOperator = stack[last - 2].operator;
          if (leftOperator === undefined) {
            throw getParseError(
              `Expression at location ${formatLocation(getElementNode(last - 2))} and expression at location ${formatLocation(getElementNode(last - 1))} follow each other without any intervening operator.`,
            );
          }
          if (isSucceeding(leftOperator, rightOperator)) {
            if (isInfix(leftOperator)) reduceInfix(leftOperator);
            else reducePrefix();
          } else if (!isPreceding(leftOperator, rightOperator)) {
            throw getParseError(
              `Precedence conflict between ops ${leftOperator.name} in block ${rightLocation} and ${rightOperator.name}.`,
            );
          } else return;
        }
      } else if (rightOperator.fix === "prefix") {
        if (last === 0) return;
        const below = stack[last - 1];
        if (below.operator === undefined) {
          throw getParseError(
            `\n  Encountered prefix op ${rightOperator.name} in block ${rightLocation} following an expression.`,
          );
        }
        if (below.operator.fix === "postfix") {
          throw getParseError(
            `\n  Encountered prefix op ${rightOperator.name} in block ${rightLocation} following postfix op ${below.operator.name}.`,
          );
        }
        return;
      } else if (last === 0) {
        if (getMixfix(rightOperator) === undefined) {
          throw getParseError(
            `\n  Encountered infix op ${rightOperator.name} in block ${rightLocation} on empty stack.`,
          );
        }
        return;
      } else {
        const below = stack[last - 1];
        if (below.operator !== undefined) {
          const belowOperator = below.operator;
          if (isInfix(belowOperator) || belowOperator.fix === "prefix") {
            const mixfix = getMixfix(rightOperator);
            const belowLocation = formatLocation(getElementNode(last - 1));
            if (mixfix === undefined) {
              throw getParseError(
                rightOperator === VOID_OPERATOR
                  ? `\n  Missing expression in block ${belowLocation} following prefix or infix op ${belowOperator.name}.`
                  : `\n  Encountered infix op ${rightOperator.name} in block ${belowLocation} following prefix or infix op ${belowOperator.name}.`,
              );
            }
            if (
              isSucceeding(belowOperator, mixfix) ||
              (belowOperator === mixfix && belowOperator.associativity === "left")
            ) {
              throw getParseError(
                `\n  Precedence conflict between ops ${belowOperator.name} in block ${belowLocation} and ${mixfix.name}.`,
              );
            }
          } else reducePostfix();
        } else {
          if (last <= 1) return;
          const left = stack[last - 2];
          if (left.operator === undefined) {
            throw getParseError(
              `Expression at location ${formatLocation(getElementNode(last - 2))} and expression at location ${formatLocation(getElementNode(last - 1))} follow each other without any intervening operator.`,
            );
          }
          const mixfix = getMixfix(left.operator);
          const leftOperator =
            mixfix !== undefined && (last === 2 || stack[last - 3].operator !== undefined)
              ? mixfix
              : left.operator;
          const leftLocation = formatLocation(getElementNode(last - 2));
          if (
            isSucceeding(leftOperator, rightOperator) ||
            (leftOperator === rightOperator && leftOperator.associativity === "left")
          ) {
            if (isInfix(leftOperator)) reduceInfix(leftOperator);
            else if (leftOperator.fix === "prefix") reducePrefix();
            else if (
              getElementNode(last - 2).location[0] < getElementNode(last - 1).location[0] &&
              rightOperator.name === "="
            ) {
              throw getParseError(
                `\n  *** Hint *** You may have mistyped ==\n  Illegal combination of operators ${leftOperator.name} in block ${leftLocation} and ${rightOperator.name}.`,
              );
            } else if (rightOperator === VOID_OPERATOR) {
              throw getParseError(
                `\n Error following expression at  ${leftLocation}, missing operator or separator.`,
              );
            } else {
              throw getParseError(
                `\n  Illegal combination of operators ${leftOperator.name} in block ${leftLocation} and ${rightOperator.name}.`,
              );
            }
          } else if (
            !(
              isPreceding(leftOperator, rightOperator) ||
              (leftOperator === rightOperator && leftOperator.associativity === "right")
            )
          ) {
            throw getParseError(
              `\n  Precedence conflict between ops ${leftOperator.name} in block ${leftLocation} and ${rightOperator.name}.`,
            );
          } else return;
        }
      }
      if (last === stack.length - 1) return;
    }
  };

  const finalReduce = () => {
    pushOperand(undefined, VOID_OPERATOR);
    reduceStack();
    const stack = getStack();
    if (stack.length === 2) return stack[0].node;
    errors.push(
      `Couldn't properly parse expression${stack
        .slice(0, Math.max(stack.length - 1, 1))
        .map(
          (_, index) => `-- incomplete expression at ${formatLocation(getElementNode(index))}.\n`,
        )
        .join("")}`,
    );
    return undefined;
  };

  const reduceRecord = (middle: SyntaxNode, right: SyntaxNode) => {
    const stack = getStack();
    const element = stack.at(-1);
    if (element === undefined)
      throw getParseError(`\n    \`\`.'' has no left hand side at ${formatLocation(middle)}.`);
    if (element.operator !== undefined) {
      if (element.operator.fix !== "postfix" || stack[stack.length - 2].operator !== undefined) {
        throw getParseError(
          `\n    \`\`.'' follows operator ${formatLocation(element.node ?? getNode("Missing"))}.`,
        );
      }
      stack.push({ node: undefined, operator: undefined });
      reducePostfix();
      stack.pop();
    }
    const index = stack.length - 1;
    stack[index] = {
      node: getNode("RecordComponent", [getElementNode(index), middle, right]),
      operator: undefined,
    };
  };

  // A call, so TypeScript does not narrow the hook to undefined across the parse that sets it.
  const setFairnessHook = (node: SyntaxNode | undefined) => {
    parser.fairnessHook = node;
  };

  const isLabel = (node: SyntaxNode | undefined) => {
    if (node === undefined) return false;
    if (node.kind === "GeneralId") return node.heirs[0].heirs.length === 0;
    if (node.kind !== "OpApplication") return false;
    return node.heirs[1].heirs
      .filter((_, index) => index % 2 === 1)
      .every((argument) => argument.kind === "GeneralId" && argument.heirs[0].heirs.length === 0);
  };

  const checkIndentation = (node: SyntaxNode, junction: SyntaxNode) => {
    for (const child of node.heirs) {
      if (child.kind === "ConjList" || child.kind === "DisjList") continue;
      if (!isAboveJunction(child.location[1])) {
        throw getParseError(
          `Item at ${formatLocation(child)} is not properly indented inside conjunction or  disjunction list item at ${formatLocation(junction)}`,
        );
      }
      checkIndentation(child, junction);
    }
  };

  const getProofLevel = () =>
    parser.proofDepth < 0 ? parser.proofDepth : proofLevels[parser.proofDepth];

  const isProofStart = (current: SanyToken) => {
    if (current.image.length < 2) return false;
    if (current.image[1] === "*") return parser.proofDepth < 0;
    if (current.image[1] === "+") return true;
    if ([PROOF_STEP, 293, 294, 292].includes(current.kind)) {
      if (parser.proofDepth < 0) return true;
      return (
        proofLevels[parser.proofDepth] >= 0 &&
        getLevelOfStep(current) > proofLevels[parser.proofDepth]
      );
    }
    return [BY, PROOF, OBVIOUS, OMITTED].includes(current.kind);
  };

  const isCorrectLevel = (current: SanyToken) => {
    const level = getLevelOfStep(current);
    const lastLevel = parser.proofDepth > 0 ? proofLevels[parser.proofDepth - 1] : -1;
    if (level === -1) {
      if (proofLevels[parser.proofDepth] < 0) proofLevels[parser.proofDepth] = lastLevel + 1;
      return true;
    }
    if (proofLevels[parser.proofDepth] >= 0)
      return level === -2 ? false : proofLevels[parser.proofDepth] === level;
    proofLevels[parser.proofDepth] = level === -2 ? lastLevel + 1 : level;
    return level === -2 || level > lastLevel;
  };

  const parseIdentifier = () => getTokenNode(consume(IDENTIFIER));

  const addToken = (kind: number) => addHeir(getTokenNode(consume(kind)));

  const parsePrefixOperator = (kinds: readonly number[], kind: string) => {
    const current = consumeOneOf(kinds);
    parser.lastOperator = OPERATORS.get(current.image);
    return getTokenNode(current, kind);
  };

  const parseInfixOperator = () => {
    beginProduction("Infix Op");
    const current = consumeOneOf(INFIX_OPERATORS);
    parser.lastOperator = OPERATORS.get(current.image);
    endProduction();
    return getTokenNode(current, "InfixOp");
  };

  const parsePostfixOperator = () => {
    const current = consumeOneOf(POSTFIX_OPERATORS);
    parser.lastOperator = OPERATORS.get(current.image);
    return getTokenNode(current, "PostfixOp");
  };

  const parseNonExpressionPrefixOperator = () =>
    parsePrefixOperator(NON_EXPRESSION_PREFIX_OPERATORS, "NonExpPrefixOp");

  const parseModuleDefinition = (): SyntaxNode => {
    beginProduction("Module definition");
    parser.expecting = "---- MODULE";
    const begin = parseBeginModule();
    parser.expecting = "EXTENDS clause or module body";
    const extension = parseExtends();
    parser.expecting = "Module body";
    const body = parseBody();
    parser.expecting = "==== or more Module body";
    const end = getNode("EndModule", [getTokenNode(consume(END_MODULE))]);
    endProduction();
    return getNode("Module", [begin, extension, body, end]);
  };

  const parseBeginModule = () => {
    beginProduction("Begin module");
    parser.expecting = "---- MODULE (beginning of module)";
    const begin = getTokenNode(consumeOneOf([_BM0, _BM1, _BM2]));
    parser.expecting = "Identifier";
    convertFieldName(getToken(1));
    const name = parseIdentifier();
    parser.moduleName ??= name.image;
    parser.expecting = "----";
    const separator = getTokenNode(consume(SEPARATOR));
    endProduction();
    return getNode("BeginModule", [begin, name, separator]);
  };

  const parseExtends = () => {
    beginProduction("Extends");
    if (isNextKind(EXTENDS)) {
      addToken(EXTENDS);
      parser.expecting = "Identifier";
      convertFieldName(getToken(1));
      addHeir(parseIdentifier());
      parser.expecting = "comma or module body";
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        parser.expecting = "Identifier";
        convertFieldName(getToken(1));
        addHeir(parseIdentifier());
      }
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode("Extends", heirs);
  };

  const parseBodyUnit = (): SyntaxNode => {
    const kind = getNextKind();
    if (kind === SEPARATOR) return getTokenNode(consume(SEPARATOR));
    if (kind === VARIABLE) return parseVariableDeclaration();
    if (kind === CONSTANT) return parseParameterDeclaration();
    markExpected();
    if (isLookahead("unitDefinition")) return parseDefinition();
    if (getNextKind() === RECURSIVE) return parseRecursive();
    markExpected();
    if (isLookahead("unitInstance")) return parseInstance();
    if (isLookahead("unitAssumption")) return parseAssumption();
    if (isLookahead("unitTheorem")) return parseTheorem();
    if ([_BM0, _BM1, _BM2].includes(getNextKind())) {
      const module = parseModuleDefinition();
      insertDefinitionBreak();
      return module;
    }
    markExpected();
    if ((getToken(1).kind === USE && getToken(2).kind !== ONLY) || getToken(1).kind === HIDE) {
      return parseUseOrHideOrBy();
    }
    throw getNextUnexpectedError();
  };

  const parseBody = () => {
    beginProduction("Module body");
    parser.expecting =
      "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition";
    while (isLookahead("moduleUnit")) addHeir(parseBodyUnit());
    const heirs = getLastHeirs();
    endProduction();
    return getNode("Body", heirs);
  };

  const parseVariableDeclaration = () => {
    beginProduction("variable declaration");
    const keyword = getTokenNode(consume(VARIABLE));
    parser.expecting = "Identifier";
    addHeir(parseIdentifier());
    parser.expecting = "comma or module body";
    while (isNextKind(COMMA)) {
      addToken(COMMA);
      parser.expecting = "Identifier";
      addHeir(parseIdentifier());
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode("VariableDeclaration", keyword, heirs);
  };

  const parseParameterDeclaration = () => {
    beginProduction("Parameter declaration");
    parser.expecting = "CONSTANT";
    beginProduction("Parameter declaration item");
    const keyword = getNode("ConsDecl", [getTokenNode(consume(CONSTANT))]);
    endProduction();
    addHeir(keyword);
    parser.expecting = "Identifier, operator or _";
    addHeir(parseConstantDeclarationItems());
    parser.expecting = ",";
    while (isNextKind(COMMA)) {
      addToken(COMMA);
      parser.expecting = "Identifier, operator or _";
      addHeir(parseConstantDeclarationItems());
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode("ParamDeclaration", heirs);
  };

  const parseRecursive = () => {
    beginProduction("Recursive");
    parser.expecting = "RECURSIVE";
    addToken(RECURSIVE);
    parser.expecting = "Identifier, operator or _";
    addHeir(parseConstantDeclarationItems());
    parser.expecting = ",";
    while (isNextKind(COMMA)) {
      addToken(COMMA);
      parser.expecting = "Identifier, operator or _";
      addHeir(parseConstantDeclarationItems());
      parser.expecting = "`,' or `)'";
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode("Recursive", heirs);
  };

  const parseUnderscores = () => {
    addToken(LBR);
    parser.expecting = "_";
    addToken(US);
    parser.expecting = "comma or )";
    while (isNextKind(COMMA)) {
      addToken(COMMA);
      parser.expecting = "_";
      addToken(US);
      parser.expecting = "comma or )";
    }
    addToken(RBR);
  };

  const parseConstantDeclarationItems = () =>
    parseProduction("Constant declaration items", () => {
      parser.expecting = "Identifier, _ or prefix op";
      const kind = getNextKind();
      if (kind === IDENTIFIER) {
        addHeir(parseIdentifier());
        parser.expecting = "(, comma, or Module Body";
        if (isLookahead("constantArguments")) parseUnderscores();
        return "IdentDecl";
      }
      if (NON_EXPRESSION_PREFIX_OPERATORS.includes(kind)) {
        const operator = parseNonExpressionPrefixOperator();
        parser.expecting = "_";
        addHeir(operator);
        addToken(US);
        return "PrefixDecl";
      }
      if (kind !== US) {
        markExpected();
        throw getNextUnexpectedError();
      }
      const underscore = getTokenNode(consume(US));
      parser.expecting = "prefix or postfix operator";
      const operatorKind = getNextKind();
      if (INFIX_OPERATORS.includes(operatorKind)) {
        const operator = parseInfixOperator();
        parser.expecting = "_";
        addHeir(underscore);
        addHeir(operator);
        addToken(US);
        return "InfixDecl";
      }
      if (POSTFIX_OPERATORS.includes(operatorKind)) {
        const operator = parsePostfixOperator();
        addHeir(underscore);
        addHeir(operator);
        return "PostfixDecl";
      }
      markExpected();
      throw getNextUnexpectedError();
    });

  const parseDefinitionBody = (kind: string) => {
    const definition = getTokenNode(consume(DEF));
    insertDefinitionBreak();
    addHeir(definition);
    parser.expecting = kind;
  };

  const parseDefinition = () =>
    parseProduction("Definition", () => {
      parser.expecting = "LOCAL, Identifier or Operator Symbol";
      if (isNextKind(LOCAL)) addToken(LOCAL);
      consume(DEFBREAK);
      parser.expecting = "LOCAL, Identifier or Operator Symbol";
      if (isLookahead("functionDefinition")) {
        addHeir(parseIdentifier());
        parser.expecting = "[";
        addToken(LSB);
        parser.expecting = "Identifier";
        addHeir(parseQuantifierBound());
        parser.expecting = "COMMA or ]";
        while (isNextKind(COMMA)) {
          addToken(COMMA);
          parser.expecting = "Identifier";
          addHeir(parseQuantifierBound());
        }
        const bracket = getTokenNode(consume(RSB));
        parser.expecting = "==";
        addHeir(bracket);
        parseDefinitionBody("Expression");
        addHeir(parseExpression());
        return "FunctionDefinition";
      }
      if (isLookahead("postfixDefinition")) {
        beginProduction("Postfix LHS");
        const name = parseIdentifier();
        const operator = getTokenNode(consumeOneOf(POSTFIX_OPERATORS));
        endProduction();
        addHeir(getNode("PostfixLHS", [name, operator]));
        parser.expecting = "==";
        parseDefinitionBody("Expression");
        addHeir(parseExpression());
        return "OperatorDefinition";
      }
      if (isLookahead("infixDefinition")) {
        beginProduction("Infix LHS");
        const left = parseIdentifier();
        const operator = getTokenNode(consumeOneOf(INFIX_OPERATORS));
        const right = parseIdentifier();
        endProduction();
        addHeir(getNode("InfixLHS", [left, operator, right]));
        parser.expecting = "==";
        parseDefinitionBody("Expression");
        addHeir(parseExpression());
        return "OperatorDefinition";
      }
      if (isLookahead("identifierDefinition")) {
        addHeir(parseIdentifierLeftSide());
        parser.expecting = "==";
        parseDefinitionBody("Expression or Instance");
        if (isLookahead("definitionBody")) {
          addHeir(parseExpression());
          return "OperatorDefinition";
        }
        if (getNextKind() === INSTANCE) {
          addHeir(parseInstantiation());
          return "ModuleDefinition";
        }
        markExpected();
        throw getNextUnexpectedError();
      }
      if (!NON_EXPRESSION_PREFIX_OPERATORS.includes(getNextKind())) {
        markExpected();
        throw getNextUnexpectedError();
      }
      beginProduction("Prefix LHS");
      const operator = getTokenNode(consumeOneOf(NON_EXPRESSION_PREFIX_OPERATORS));
      parser.expecting = "Identifier";
      const name = parseIdentifier();
      endProduction();
      addHeir(getNode("PrefixLHS", [operator, name]));
      parser.expecting = "==";
      parseDefinitionBody("Expression");
      addHeir(parseExpression());
      return "OperatorDefinition";
    });

  const parseIdentifierTuple = () => {
    beginProduction("Identifier tuple");
    addToken(LAB);
    parser.expecting = "Identifier or >>";
    if (isNextKind(IDENTIFIER)) {
      addHeir(parseIdentifier());
      parser.expecting = "COMMA or >>";
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        parser.expecting = "COMMA or >>";
        addHeir(parseIdentifier());
        parser.expecting = "COMMA or >>";
      }
    }
    addToken(RAB);
    const heirs = getLastHeirs();
    endProduction();
    return getNode("IdentifierTuple", heirs);
  };

  const parseDeclaration = () => {
    const kind = getNextKind();
    if (kind === IDENTIFIER) return parseIdentifierDeclaration();
    if (OPERATOR_DECLARATION_STARTS.has(kind)) return parseOperatorDeclaration();
    markExpected();
    throw getNextUnexpectedError();
  };

  const parseIdentifierLeftSide = () => {
    beginProduction("Identifier LHS");
    addHeir(parseIdentifier());
    parser.expecting = "( or ==";
    if (isNextKind(LBR)) {
      addToken(LBR);
      parser.expecting = "Identifier Declaration, prefix op, _ or )";
      addHeir(parseDeclaration());
      parser.expecting = "COMMA or )";
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        parser.expecting = "Identifier Declaration, prefix op or _";
        addHeir(parseDeclaration());
        parser.expecting = "COMMA or )";
      }
      addToken(RBR);
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode("IdentLHS", heirs);
  };

  const parseIdentifierDeclaration = () => {
    beginProduction("Identifier Declation");
    addHeir(parseIdentifier());
    parser.expecting = "( or ...";
    if (isNextKind(LBR)) {
      addToken(LBR);
      parser.expecting = "_";
      addToken(US);
      parser.expecting = "COMMA or )";
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        parser.expecting = "_";
        addToken(US);
        parser.expecting = "COMMA or )";
      }
      addToken(RBR);
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode("IdentDecl", heirs);
  };

  const parseOperatorDeclaration = () =>
    parseProduction("Op. Symbol Declaration", () => {
      const kind = getNextKind();
      if (NON_EXPRESSION_PREFIX_OPERATORS.includes(kind)) {
        addHeir(parseNonExpressionPrefixOperator());
        parser.expecting = "_";
        addToken(US);
        return "PrefixDecl";
      }
      if (kind !== US) {
        markExpected();
        throw getNextUnexpectedError();
      }
      addToken(US);
      parser.expecting = "infix or postfix operator";
      const operatorKind = getNextKind();
      if (INFIX_OPERATORS.includes(operatorKind)) {
        addHeir(parseInfixOperator());
        parser.expecting = "_";
        addToken(US);
        return "InfixDecl";
      }
      if (POSTFIX_OPERATORS.includes(operatorKind)) {
        addHeir(parsePostfixOperator());
        return "PostfixDecl";
      }
      markExpected();
      throw getNextUnexpectedError();
    });

  const parseInstance = () => {
    beginProduction("Instance");
    parser.expecting = "LOCAL or instance";
    const local = isNextKind(LOCAL) ? getTokenNode(consume(LOCAL)) : undefined;
    addHeir(parseInstantiation());
    parser.expecting = "COMMA or Module Body";
    const heirs = getLastHeirs();
    endProduction();
    return getNode("Instance", local, heirs);
  };

  const parseInstantiation = () => {
    beginProduction("NonLocalInstance");
    addToken(INSTANCE);
    parser.expecting = "Module identifier";
    convertFieldName(getToken(1));
    addHeir(parseIdentifier());
    parser.expecting = "WITH or another definition.";
    if (isNextKind(WITH)) {
      addToken(WITH);
      parser.expecting = "";
      addHeir(parseSubstitution());
      parser.expecting = "";
      while (isLookahead("nextSubstitution")) {
        addToken(COMMA);
        parser.expecting = "";
        addHeir(parseSubstitution());
        parser.expecting = "";
      }
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode("NonLocalInstance", heirs);
  };

  const parseSubstitution = () => {
    beginProduction("Substitution");
    const kind = getNextKind();
    const target =
      kind === IDENTIFIER
        ? parseIdentifier()
        : NON_EXPRESSION_PREFIX_OPERATORS.includes(kind)
          ? parseNonExpressionPrefixOperator()
          : INFIX_OPERATORS.includes(kind)
            ? parseInfixOperator()
            : POSTFIX_OPERATORS.includes(kind)
              ? parsePostfixOperator()
              : undefined;
    if (target === undefined) {
      markExpected();
      throw getNextUnexpectedError();
    }
    parser.expecting = "<-";
    const arrow = getTokenNode(consume(SUBSTITUTE));
    parser.expecting = "Expression or Op. Symbol";
    const value = parseOperatorOrExpression();
    endProduction();
    return getNode("Substitution", [target, arrow, value]);
  };

  const parseAssumption = () => {
    beginProduction("Assumption");
    parser.expecting = "ASSUM...";
    addHeir(getTokenNode(consumeOneOf([ASSUMPTION, ASSUME])));
    if (isLookahead("assumptionName")) {
      if (isNextKind(DEFBREAK)) consume(DEFBREAK);
      addHeir(parseIdentifier());
      parser.expecting = "==";
      addToken(DEF);
    }
    insertDefinitionBreak();
    parser.expecting = "Expression";
    addHeir(parseExpression());
    const heirs = getLastHeirs();
    endProduction();
    return getNode("Assumption", heirs);
  };

  const parseAssumeItem = (lookahead: "assumeExpression" | "nextAssumeExpression") => {
    if (isNestedAssume()) return parseAssumeProve();
    if (NEW_SYMBOL_STARTS.has(getNextKind())) return parseNewSymbol();
    markExpected();
    if (isLookahead(lookahead)) return parseExpression();
    throw getNextUnexpectedError();
  };

  const parseAssumeProve = (): SyntaxNode => {
    beginProduction("Assume-Prove");
    if (isNextKind(IDENTIFIER)) {
      addHeir(getNode("GeneralId", [getIdPrefix(), parseIdentifier()]));
      addToken(COLONCOLON);
      addHeir(parseAssumeProve());
      const heirs = getLastHeirs();
      endProduction();
      return getNode("Label", heirs);
    }
    addHeir(getTokenNode(consumeOneOf([ASSUME, BOXASSUME])));
    parser.expecting = "Expression, Declaration, or AssumeProve";
    addHeir(parseAssumeItem("assumeExpression"));
    parser.expecting = "PROVE or `,'";
    while (isNextKind(COMMA)) {
      addToken(COMMA);
      parser.expecting = "Expression, Declaration, or AssumeProve";
      addHeir(parseAssumeItem("nextAssumeExpression"));
      parser.expecting = "PROVE or `,'";
    }
    addHeir(getTokenNode(consumeOneOf([PROVE, BOXPROVE])));
    parser.expecting = "Expression";
    addHeir(parseExpression());
    const heirs = getLastHeirs();
    endProduction();
    return getNode("AssumeProve", heirs);
  };

  const parseNewSymbol = () => {
    beginProduction("NEW symbol declaration");
    parser.expecting = "NEW, CONSTANT, VARIABLE, STATE, ACTION, or TEMPORAL";
    if (isLookahead("constantSymbol")) {
      if (isLookahead("newConstant")) {
        addToken(NEW);
        addToken(CONSTANT);
      } else addHeir(getTokenNode(consumeOneOf([NEW, CONSTANT])));
      parser.expecting = "Constant declaration";
      if (isLookahead("constantDeclaration")) {
        const declaration = parseIdentifierDeclaration();
        addHeir(declaration);
        if (isNextKind(IN)) {
          const membership = consume(IN);
          if (declaration.heirs.length > 1) {
            throw getParseError(
              `declared symbol with arguments before \\in at ${formatLocation(declaration)}`,
            );
          }
          addHeir(getTokenNode(membership));
          parser.expecting = "Expression";
          addHeir(parseExpression());
        }
      } else if (OPERATOR_DECLARATION_STARTS.has(getNextKind()))
        addHeir(parseOperatorDeclaration());
      else {
        markExpected();
        throw getNextUnexpectedError();
      }
    } else if (isLookahead("variableSymbol")) {
      if (isNextKind(NEW)) addToken(NEW);
      addToken(VARIABLE);
      parser.expecting = "Identifier";
      addHeir(getNode("IdentDecl", [parseIdentifier()]));
    } else if (isLookahead("levelSymbol")) {
      if (isNextKind(NEW)) addToken(NEW);
      addHeir(getTokenNode(consumeOneOf([STATE, ACTION, TEMPORAL])));
      parser.expecting = "Declaration";
      addHeir(parseDeclaration());
    } else throw getNextUnexpectedError();
    const heirs = getLastHeirs();
    endProduction();
    return getNode("NewSymb", heirs);
  };

  const parseTheorem = () => {
    beginProduction("Theorem");
    parser.expecting = "THEOREM, PROPOSITION";
    addHeir(getTokenNode(consumeOneOf([THEOREM, PROPOSITION])));
    parser.expecting = "Identifier, Assume-Prove or Expression";
    if (isLookahead("theoremName")) {
      addHeir(parseIdentifier());
      parser.expecting = "==";
      addToken(DEF);
    }
    insertDefinitionBreak();
    if (isLookahead("theoremAssumeProve")) {
      if (!isNextAssume()) throw getNextUnexpectedError();
      addHeir(parseAssumeProve());
    } else if (isLookahead("theoremExpression")) addHeir(parseExpression());
    else throw getNextUnexpectedError();
    if (isProofStart(getToken(1))) addHeir(parseProof());
    const heirs = getLastHeirs();
    endProduction();
    return getNode("Theorem", heirs);
  };

  const parseProof = (): SyntaxNode => {
    parser.proofDepth++;
    if (parser.proofDepth >= 100) throw getParseError("Proofs nested more than 100deep.");
    proofLevels[parser.proofDepth] = -1;
    const proof = inProduction("Proof", () => {
      if (getToken(1).kind === BY || getToken(2).kind === BY) return parseUseOrHideOrBy();
      if (isLookahead("terminalProof")) {
        const keyword = isNextKind(PROOF) ? getTokenNode(consume(PROOF)) : undefined;
        return getNode("TerminalProof", keyword, [getTokenNode(consumeOneOf([OBVIOUS, OMITTED]))]);
      }
      if (!isLookahead("stepProof")) throw getNextUnexpectedError();
      if (isLookahead("proofKeyword")) addToken(PROOF);
      while (getToken(2).kind !== QED) {
        addHeir(parseStep());
        parser.expecting = "a proof step";
      }
      addHeir(parseQedStep());
      return getNode("Proof", getLastHeirs());
    });
    if (parser.proofDepth < 0) throw getParseError("Parser bug: an extra QED step found.");
    parser.proofDepth--;
    return proof;
  };

  const parseFact = (lookahead: keyof typeof lookaheads) => {
    if (getNextKind() === MODULE) {
      addToken(MODULE);
      parser.expecting = "identifier";
      addHeir(parseIdentifier());
      return;
    }
    markExpected();
    if (!isLookahead(lookahead)) throw getNextUnexpectedError();
    addHeir(parseExpression());
  };

  const parseUseOrHideOrBy = () => {
    beginProduction("UseOrHideOrBy");
    const keyword = getNextKind();
    const kind = keyword === BY || keyword === PROOF ? "TerminalProof" : "UseOrHide";
    if (kind === "TerminalProof") {
      if (isNextKind(PROOF)) addToken(PROOF);
      addToken(BY);
      if (isNextKind(ONLY)) addToken(ONLY);
    } else if (keyword === USE) {
      addToken(USE);
      if (isNextKind(ONLY)) addToken(ONLY);
    } else if (keyword === HIDE) addToken(HIDE);
    else {
      markExpected();
      throw getNextUnexpectedError();
    }
    parser.expecting = "an expression, `MODULE' or `DEF'";
    if (isLookahead("usedFacts")) {
      parseFact("usedExpression");
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        parser.expecting = "MODULE or expression";
        parseFact("nextUsedExpression");
        parser.expecting =
          kind === "TerminalProof" ? "comma, DEF, or [.]" : "comma, DEF, or proof step";
      }
    }
    if (isNextKind(DF)) {
      addToken(DF);
      parser.expecting = "MODULE or expression";
      parseFact("definedExpression");
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        parser.expecting = "MODULE or expression";
        parseFact("nextDefinedExpression");
        parser.expecting = kind === "TerminalProof" ? "comma or [.]" : "comma or proof step";
      }
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode(kind, heirs);
  };

  const parseStepNumber = (message: string) => {
    parser.expecting = "Step number";
    const number = getTokenNode(consumeOneOf(STEP_STARTS));
    if (!isCorrectLevel(parser.token)) throw getParseError(`${formatLocation(number)}: ${message}`);
    addHeir(number);
  };

  const parseQedStep = () => {
    beginProduction("QED step");
    parseStepNumber("QED step's number has bad level.");
    parser.expecting = "QED";
    addHeir(getNode("QEDStep", [getTokenNode(consume(QED))]));
    if (isProofStart(getToken(1))) addHeir(parseProof());
    const heirs = getLastHeirs();
    endProduction();
    return getNode("ProofStep", heirs);
  };

  const parseStepBody = (): [SyntaxNode, boolean] => {
    const next = getToken(1).kind;
    if (next === USE || next === HIDE) return [parseUseOrHideOrBy(), false];
    if (next === INSTANCE) return [parseInstantiation(), false];
    if (next === DEFBREAK || next === DEFINE) return [parseDefinitionStep(), false];
    const kind = getNextKind();
    if (kind === HAVE) return [parseKeywordStep("HaveStep", HAVE), false];
    if (kind === TAKE) return [parseTakeStep(), false];
    if (kind === WITNESS) return [parseWitnessStep(), false];
    if (kind === PICK) return [parsePickStep(), true];
    if (kind === CASE) return [parseKeywordStep("CaseStep", CASE), true];
    markExpected();
    if (isLookahead("assertStep")) return [parseAssertStep(), true];
    throw getNextUnexpectedError();
  };

  const parseStep = () => {
    beginProduction("Step");
    parseStepNumber("step's number has bad level.");
    parser.expecting = "proof step";
    const step = parseStepBody();
    addHeir(step[0]);
    if (isProofStart(getToken(1))) {
      if (!step[1])
        throw getParseError(
          `${formatLocation(step[0])}: proof of step that does not take a proof.`,
        );
      addHeir(parseProof());
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode("ProofStep", heirs);
  };

  const parseDefinitionStep = () => {
    beginProduction("DefStep");
    if (isNextKind(DEFINE)) addToken(DEFINE);
    do addHeir(parseDefinition());
    while (isLookahead("nextDefinition"));
    const heirs = getLastHeirs();
    endProduction();
    return getNode("DefStep", heirs);
  };

  const parseKeywordStep = (name: string, keyword: number) => {
    beginProduction(name);
    addToken(keyword);
    parser.expecting = "expression";
    addHeir(parseExpression());
    const heirs = getLastHeirs();
    endProduction();
    return getNode(name, heirs);
  };

  const parseCommaList = (
    parseItem: () => SyntaxNode,
    first: string,
    item: string,
    after: string,
  ) => {
    addHeir(parseItem());
    parser.expecting = first;
    while (isNextKind(COMMA)) {
      addToken(COMMA);
      parser.expecting = item;
      addHeir(parseItem());
      parser.expecting = after;
    }
  };

  const parseTakeStep = () => {
    beginProduction("TakeStep");
    addToken(TAKE);
    parser.expecting = "identifier";
    if (isLookahead("takeBounds")) {
      parseCommaList(
        parseQuantifierBound,
        "comma or step",
        "identifier or tuple of identifiers",
        "comma or proof step",
      );
    } else if (isNextKind(IDENTIFIER)) {
      parseCommaList(parseIdentifier, "comma or proof step", "identifier", "comma or proof step");
    } else throw getNextUnexpectedError();
    const heirs = getLastHeirs();
    endProduction();
    return getNode("TakeStep", heirs);
  };

  const parseWitnessStep = () => {
    beginProduction("WitnessStep");
    addToken(WITNESS);
    parser.expecting = "expression";
    addHeir(parseExpression());
    while (isNextKind(COMMA)) {
      addToken(COMMA);
      parser.expecting = "expression";
      addHeir(parseExpression());
      parser.expecting = "comma or colon";
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode("WitnessStep", heirs);
  };

  const parsePickStep = () => {
    beginProduction("PickStep");
    addToken(PICK);
    parser.expecting = "identifier";
    if (isLookahead("pickIdentifiers")) {
      parseCommaList(parseIdentifier, "comma, or colon", "identifier", "comma or colon");
    } else if (getNextKind() === LAB || getNextKind() === IDENTIFIER) {
      parseCommaList(
        parseQuantifierBound,
        "comma or colon",
        "identifier or tuple of identifiers",
        "comma or colon",
      );
    } else {
      markExpected();
      throw getNextUnexpectedError();
    }
    addToken(COLON);
    parser.expecting = "expression";
    addHeir(parseExpression());
    const heirs = getLastHeirs();
    endProduction();
    return getNode("PickStep", heirs);
  };

  const parseAssertStep = () => {
    beginProduction("AssertStep");
    if (isNextKind(SUFFICES)) {
      addToken(SUFFICES);
      parser.expecting = "expression or ASSUME/PROVE";
    }
    if (isLookahead("assertedExpression")) addHeir(parseExpression());
    else if (isNextAssume()) addHeir(parseAssumeProve());
    else throw getNextUnexpectedError();
    const heirs = getLastHeirs();
    endProduction();
    return getNode("AssertStep", heirs);
  };

  const parseBracketed = () => {
    const kind = getNextKind();
    if (kind === LBR) return parseParenthesized();
    if (kind === LBC) return parseBraceCases();
    if (kind === LSB) return parseBracketCases();
    if (kind === LAB) return parseTupleOrAction();
    if (kind === SF || kind === WF) return parseFairness();
    markExpected();
    throw getNextUnexpectedError();
  };

  const parseOpenExpression = () => {
    const kind = getNextKind();
    if (kind === EXISTS || kind === FORALL) return parseQuantifier();
    if (kind === T_EXISTS || kind === T_FORALL) return parseTemporalQuantifier();
    if (kind === IF) return parseIfThenElse();
    if (kind === CASE) return parseCase();
    if (kind === LET) return parseLetIn();
    if (kind === CHOOSE) return parseChoose();
    markExpected();
    throw getNextUnexpectedError();
  };

  const parseNumber = () => {
    const whole = getTokenNode(consume(NUMBER_LITERAL));
    if (!isLookahead("decimalPart")) return getNode("Number", [whole]);
    const dot = getTokenNode(consume(DOT));
    return getNode("Real", [whole, dot, getTokenNode(consume(NUMBER_LITERAL))]);
  };

  const parseOperatorArguments = () => {
    beginProduction("Optional Arguments");
    addToken(LBR);
    addHeir(parseOperatorOrExpression());
    while (isNextKind(COMMA)) {
      addToken(COMMA);
      addHeir(parseOperatorOrExpression());
    }
    addToken(RBR);
    const heirs = getLastHeirs();
    endProduction();
    return getNode("OpArgs", heirs);
  };

  const parseOperatorOrExpression = (): SyntaxNode => {
    if (isLookahead("operatorArgument") && isNextAboveJunction()) {
      const kind = getNextKind();
      if (NON_EXPRESSION_PREFIX_OPERATORS.includes(kind)) {
        return getNode("GenNonExpPrefixOp", [getIdPrefix(), parseNonExpressionPrefixOperator()]);
      }
      if (INFIX_OPERATORS.includes(kind)) {
        const operator = parseInfixOperator();
        if (operator.image === "\\X" || operator.image === "\\times") {
          throw getParseError(
            `${formatLocation(operator)}: \\X may not be used as an infix operator.`,
          );
        }
        return getNode("GenInfixOp", [getIdPrefix(), operator]);
      }
      if (POSTFIX_OPERATORS.includes(kind))
        return getNode("GenPostfixOp", [getIdPrefix(), parsePostfixOperator()]);
      markExpected();
      throw getNextUnexpectedError();
    }
    if (isLookahead("lambdaArgument") && isNextAboveJunction()) return parseLambda();
    if (isLookahead("expressionArgument")) return parseExpression();
    throw getNextUnexpectedError();
  };

  const parseParenthesized = () =>
    getNode("ParenExpr", [
      getTokenNode(consume(LBR)),
      parseExpression(),
      getTokenNode(consume(RBR)),
    ]);

  const parseQuantifier = () => {
    beginProduction("Quantified form");
    addHeir(getTokenNode(consumeOneOf([EXISTS, FORALL])));
    const isUnbound = isLookahead("unboundQuantifier");
    if (isUnbound) {
      addHeir(parseIdentifier());
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        addHeir(parseIdentifier());
      }
    } else if (getNextKind() === LAB || getNextKind() === IDENTIFIER) {
      addHeir(parseQuantifierBound());
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        addHeir(parseQuantifierBound());
      }
    } else {
      markExpected();
      throw getNextUnexpectedError();
    }
    addToken(COLON);
    addHeir(parseExpression());
    const heirs = getLastHeirs();
    endProduction();
    return getNode(isUnbound ? "UnboundQuant" : "BoundQuant", heirs);
  };

  const parseTemporalQuantifier = () => {
    beginProduction("Bound Quantified Expression");
    addHeir(getTokenNode(consumeOneOf([T_EXISTS, T_FORALL])));
    addHeir(parseIdentifier());
    while (isNextKind(COMMA)) {
      addToken(COMMA);
      addHeir(parseIdentifier());
    }
    addToken(COLON);
    addHeir(parseExpression());
    const heirs = getLastHeirs();
    endProduction();
    return getNode("UnboundQuant", heirs);
  };

  const parseQuantifierBound = () => {
    beginProduction("Quant Bound");
    const kind = getNextKind();
    if (kind === LAB) addHeir(parseIdentifierTuple());
    else if (kind === IDENTIFIER) {
      addHeir(parseIdentifier());
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        addHeir(parseIdentifier());
        parser.expecting = ", or \\in";
      }
    } else {
      markExpected();
      throw getNextUnexpectedError();
    }
    addToken(IN);
    addHeir(parseExpression());
    const heirs = getLastHeirs();
    endProduction();
    return getNode("QuantBound", heirs);
  };

  const parseBraceCases = () =>
    parseProduction("Some { } form", () => {
      addToken(LBC);
      const kind = isLookahead("setContents") ? parseSetContents() : "SetEnumerate";
      addToken(RBC);
      return kind;
    });

  // The heirs of a set in braces, before its closing brace, and the kind of set they make.
  const parseSetContents = () => {
    if (isFunctionBound()) {
      const nextKind = getNextKind();
      const bound =
        nextKind === LAB
          ? parseIdentifierTuple()
          : nextKind === IDENTIFIER
            ? parseIdentifier()
            : undefined;
      if (bound === undefined) {
        markExpected();
        throw getNextUnexpectedError();
      }
      parser.expecting = "\\in";
      const operator = getTokenNode(consume(IN));
      const set = parseExpression();
      parser.expecting = "':', ',' or '}'";
      if (getNextKind() === COLON) {
        const colon = getTokenNode(consume(COLON));
        addHeir(bound);
        addHeir(operator);
        addHeir(set);
        addHeir(colon);
        addHeir(parseExpression());
        return "SubsetOf";
      }
      addHeir(
        getNode("InfixExpr", [
          getNode("GeneralId", [getIdPrefix(), bound]),
          getNode("GenInfixOp", [getIdPrefix(), operator]),
          set,
        ]),
      );
      if (getNextKind() !== COMMA) {
        markExpected();
        return "SetEnumerate";
      }
      do {
        addToken(COMMA);
        addHeir(parseExpression());
      } while (isNextKind(COMMA));
      return "SetEnumerate";
    }
    if (isLookahead("setEnumeration")) {
      addHeir(parseExpression());
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        addHeir(parseExpression());
      }
      return "SetEnumerate";
    }
    if (isLookahead("setOfAll")) {
      addHeir(parseExpression());
      addToken(COLON);
      addHeir(parseQuantifierBound());
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        addHeir(parseQuantifierBound());
      }
      return "SetOfAll";
    }
    if (!isLookahead("setExpression")) throw getNextUnexpectedError();
    const element = parseExpression();
    addHeir(element);
    const separator = getNextKind();
    if (separator === COLON) {
      const colon = consume(COLON);
      if (
        element.heirs.length > 1 &&
        element.kind === "InfixExpr" &&
        element.heirs[1].heirs[1].image === "\\in"
      ) {
        throw getParseError(
          `Form {a \\in b : c \\in d }, at line ${colon.beginLine}, is not allowed`,
        );
      }
      addHeir(getTokenNode(colon));
      addHeir(parseQuantifierBound());
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        addHeir(parseQuantifierBound());
      }
      return "SetOfAll";
    }
    if (separator !== COMMA) {
      markExpected();
      return "SetEnumerate";
    }
    do {
      addToken(COMMA);
      addHeir(parseExpression());
    } while (isNextKind(COMMA));
    return "SetEnumerate";
  };

  const parseFields = (parseField: () => SyntaxNode) => {
    addHeir(parseField());
    while (isNextKind(COMMA)) {
      addToken(COMMA);
      addHeir(parseField());
    }
    addToken(RSB);
  };

  const parseField = (name: string, kind: string, separator: number) => () => {
    beginProduction(name);
    const field = parseIdentifier();
    const operator = getTokenNode(consume(separator));
    const value = parseExpression();
    endProduction();
    return getNode(kind, [field, operator, value]);
  };

  const parseBracketCases = () =>
    parseProduction("Some [] Form", () => {
      addToken(LSB);
      if (isFunctionBound()) {
        addHeir(parseQuantifierBound());
        while (isNextKind(COMMA)) {
          addToken(COMMA);
          addHeir(parseQuantifierBound());
        }
        addToken(MAPTO);
        addHeir(parseExpression());
        addToken(RSB);
        return "FcnConst";
      }
      if (isLookahead("recordFields")) {
        parseFields(parseField("Field Value", "FieldVal", MAPTO));
        return "RcdConstructor";
      }
      if (getToken(2).kind === MAPTO && isFieldNameToken(getToken(1))) {
        getToken(1).kind = IDENTIFIER;
        parseFields(parseField("Field Value", "FieldVal", MAPTO));
        return "RcdConstructor";
      }
      if (isLookahead("recordSets")) {
        parseFields(parseField("Field Set", "FieldSet", COLON));
        return "SetOfRcds";
      }
      if (!isLookahead("bracketExpression")) throw getNextUnexpectedError();
      addHeir(parseExpression());
      const next = getNextKind();
      if (next === COMMA || next === RSB) {
        while (isNextKind(COMMA)) {
          addToken(COMMA);
          addHeir(parseExpression());
        }
        addToken(RSB);
        parser.lastOperator = FUNCTION_OPERATOR;
        return "FcnAppl";
      }
      if (next === ARROW) {
        addToken(ARROW);
        addHeir(parseExpression());
        addToken(RSB);
        return "SetOfFcns";
      }
      if (next === EXCEPT) {
        addToken(EXCEPT);
        addHeir(parseExceptSpecification());
        while (isNextKind(COMMA)) {
          addToken(COMMA);
          addHeir(parseExceptSpecification());
        }
        addToken(RSB);
        return "Except";
      }
      if (next === ARSB) {
        addToken(ARSB);
        addHeir(parseReducedExpression());
        return "ActionExpr";
      }
      markExpected();
      throw getNextUnexpectedError();
    });

  const parseExceptSpecification = () => {
    beginProduction("Except Spec");
    addToken(BANG);
    do {
      addHeir(parseExceptComponent());
      parser.expecting = "= or ,";
    } while (getNextKind() === DOT || getNextKind() === LSB || markExpected());
    addToken(EQUALS);
    addHeir(parseExpression());
    const heirs = getLastHeirs();
    endProduction();
    return getNode("ExceptSpec", heirs);
  };

  const parseExceptComponent = () => {
    beginProduction("Except Component");
    const kind = getNextKind();
    if (kind === DOT) {
      addToken(DOT);
      convertFieldName(getToken(1));
      const field = parseIdentifier();
      if (field.image === "@") errors.push("@ used in !.@");
      addHeir(field);
    } else if (kind === LSB) {
      addToken(LSB);
      addHeir(parseExpression());
      while (isNextKind(COMMA)) {
        addToken(COMMA);
        addHeir(parseExpression());
      }
      addToken(RSB);
    } else {
      markExpected();
      throw getNextUnexpectedError();
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode("ExceptComponent", heirs);
  };

  const parseTupleOrAction = () =>
    parseProduction("Some << -- >> or >>_ Form", () => {
      addToken(LAB);
      if (isLookahead("tupleContents")) {
        addHeir(parseExpression());
        while (isNextKind(COMMA)) {
          addToken(COMMA);
          addHeir(parseExpression());
        }
      }
      const kind = getNextKind();
      if (kind === RAB) {
        addToken(RAB);
        return "Tuple";
      }
      if (kind === ARAB) {
        addToken(ARAB);
        addHeir(parseReducedExpression());
        return "ActionExpr";
      }
      markExpected();
      throw getNextUnexpectedError();
    });

  const parseNoOperatorExtension = (): SyntaxNode => {
    const name = parseIdentifier();
    const operatorArguments = isLookahead("identifierArguments")
      ? parseOperatorArguments()
      : undefined;
    if (isNextKind(BANG)) {
      const bang = getTokenNode(consume(BANG));
      addHeir(getNode("IdPrefixElement", [name], operatorArguments, [bang]));
      return parseNoOperatorExtension();
    }
    setFairnessHook(operatorArguments);
    return getNode("GeneralId", [getNode("IdPrefix", getLastHeirs()), name]);
  };

  const parseReducedExpression = () => {
    beginProduction("restricted form of expression");
    const kind = getNextKind();
    const expression =
      kind === IDENTIFIER
        ? parseNoOperatorExtension()
        : kind === LBR
          ? parseParenthesized()
          : kind === LBC
            ? parseBraceCases()
            : kind === LSB
              ? parseBracketCases()
              : kind === LAB
                ? parseTupleOrAction()
                : undefined;
    if (expression === undefined) {
      markExpected();
      throw getNextUnexpectedError();
    }
    endProduction();
    return expression;
  };

  const parseFairness = () => {
    setFairnessHook(undefined);
    beginProduction("Fairness Expression");
    const keyword = getTokenNode(consumeOneOf([WF, SF]));
    const expression = parseReducedExpression();
    const position = `${keyword.location[0]}`;
    if (isLookahead("fairnessArguments")) {
      const open = getTokenNode(consume(LBR));
      const argument = parseExpression();
      const close = getTokenNode(consume(RBR));
      endProduction();
      if (expression.kind === "GeneralId" && parser.fairnessHook !== undefined) {
        return getNode("FairnessExpr", [
          keyword,
          getNode("OpApplication", [expression, parser.fairnessHook]),
          open,
          argument,
          close,
        ]);
      }
      if (!FAIRNESS_SUBSCRIPTS.has(String(expression.kind))) {
        errors.push(
          `Error in fairness expression at ${position}: ${keyword.location[1]}: could not link arguments\n`,
        );
        return expression;
      }
      return getNode("FairnessExpr", [keyword, expression, open, argument, close]);
    }
    endProduction();
    if (parser.fairnessHook === undefined) {
      throw getParseError(
        `Ill-structured fairness expression at line ${position}, column ${keyword.location[1]}`,
      );
    }
    const parameters = parser.fairnessHook.heirs;
    if (parameters.length !== 3) {
      errors.push(`Error in fairness expression at ${position}: ${keyword.location[1]}\n`);
      return expression;
    }
    return getNode("FairnessExpr", [keyword, expression, ...parameters]);
  };

  const parseIfThenElse = () => {
    beginProduction("IF THEN ELSE");
    const heirs = [
      getTokenNode(consume(IF)),
      parseExpression(),
      getTokenNode(consume(THEN)),
      parseExpression(),
      getTokenNode(consume(ELSE)),
      parseExpression(),
    ];
    endProduction();
    return getNode("IfThenElse", heirs);
  };

  const isCaseSeparator = () => {
    const next = getToken(1);
    return next.kind === CASESEP && isAboveJunction(next.beginColumn);
  };

  const parseCaseArm = (name: string, kind: string, parseCondition: () => SyntaxNode) => {
    beginProduction(name);
    const heirs = [parseCondition(), getTokenNode(consume(ARROW)), parseExpression()];
    endProduction();
    return getNode(kind, heirs);
  };

  const parseCase = () => {
    beginProduction("CASE Expression");
    addToken(CASE);
    addHeir(parseCaseArm("Case Arm", "CaseArm", parseExpression));
    while (isCaseSeparator() && getToken(2).kind !== OTHER) {
      addToken(CASESEP);
      addHeir(parseCaseArm("Case Arm", "CaseArm", parseExpression));
    }
    if (isCaseSeparator()) {
      addToken(CASESEP);
      addHeir(parseCaseArm("Case Other Arm", "OtherArm", () => getTokenNode(consume(OTHER))));
    }
    const heirs = getLastHeirs();
    endProduction();
    return getNode("Case", heirs);
  };

  const parseLetIn = () => {
    beginProduction("Case Other Arm");
    const heirs = [
      getTokenNode(consume(LET)),
      parseLetDefinitions(),
      getTokenNode(consume(LETIN)),
      parseExpression(),
    ];
    endProduction();
    return getNode("LetIn", heirs);
  };

  const parseLetDefinitions = () => {
    beginProduction("Let Definitions");
    do {
      const kind = getNextKind();
      if (kind === LOCAL || kind === DEFBREAK) addHeir(parseDefinition());
      else if (kind === RECURSIVE) addHeir(parseRecursive());
      else {
        markExpected();
        throw getNextUnexpectedError();
      }
    } while ([LOCAL, RECURSIVE, DEFBREAK].includes(getNextKind()) || markExpected());
    const heirs = getLastHeirs();
    endProduction();
    return getNode("LetDefinitions", heirs);
  };

  const parseJunctionItem = (kind: string) => {
    beginProduction("Junction Item");
    const bullet = getTokenNode(consumeOneOf([OR, AND]));
    const item = parseExpression();
    endProduction();
    const node = getNode(kind, [bullet, item]);
    checkIndentation(item, node);
    return node;
  };

  const parseJunctions = () => {
    const first = getToken(1);
    junctions.push({ isConjunction: first.kind === AND, column: first.beginColumn });
    return parseProduction("AND-OR Junction", () => {
      const kind = isLookahead("disjunctionList")
        ? "DisjList"
        : isLookahead("conjunctionList")
          ? "ConjList"
          : undefined;
      if (kind === undefined) throw getNextUnexpectedError();
      const itemKind = kind === "DisjList" ? "DisjItem" : "ConjItem";
      addHeir(parseJunctionItem(itemKind));
      while (isNewBullet()) addHeir(parseJunctionItem(itemKind));
      junctions.pop();
      return kind;
    });
  };

  const parseChoose = () => {
    beginProduction("(Un)Bounded Choose");
    const keyword = getTokenNode(consume(CHOOSE));
    const kind = getNextKind();
    const bound =
      kind === IDENTIFIER ? parseIdentifier() : kind === LAB ? parseIdentifierTuple() : undefined;
    if (bound === undefined) {
      markExpected();
      throw getNextUnexpectedError();
    }
    beginProduction("Domain binding");
    if (isNextKind(IN)) {
      addToken(IN);
      parser.expecting = "Expression";
      addHeir(parseExpression());
    }
    const domain = getNode("MaybeBound", getLastHeirs());
    endProduction();
    const heirs = [keyword, bound, domain, getTokenNode(consume(COLON)), parseExpression()];
    endProduction();
    return getNode("UnboundOrBoundChoose", heirs);
  };

  const parseLambda = () => {
    beginProduction("Lambda");
    addToken(LAMBDA);
    parser.expecting = "Identifier";
    parseCommaList(parseIdentifier, "`,' or `:'", "Identifier", "`,' or `:'");
    addToken(COLON);
    parser.expecting = "Expression";
    addHeir(parseExpression());
    const heirs = getLastHeirs();
    endProduction();
    return getNode("Lambda", heirs);
  };

  const pushOperator = (kind: string, operator: SyntaxNode) => {
    pushOperand(getNode(kind, [getIdPrefix(), operator]), parser.lastOperator);
    if (getStack().length !== 1) reduceStack();
  };

  const parseLeadingOperator = () => {
    const kind = getNextKind();
    if (PREFIX_OPERATORS.includes(kind)) {
      return pushOperator("GenPrefixOp", parsePrefixOperator(PREFIX_OPERATORS, "PrefixOp"));
    }
    if (INFIX_OPERATORS.includes(kind)) return pushOperator("GenInfixOp", parseInfixOperator());
    markExpected();
    throw getNextUnexpectedError();
  };

  const parseExpression = (): SyntaxNode => {
    beginProduction("Expression");
    parser.operatorStack = [];
    operatorStacks.push(parser.operatorStack);
    while (isLookahead("leadingOperator") && isNextAboveJunction()) parseLeadingOperator();
    if (isLookahead("openExpression") && isNextAboveJunction()) pushOperand(parseOpenExpression());
    else if (isNextAboveJunction()) parseExtendableExpression();
    else throw getNextUnexpectedError();
    endProduction();
    const expression = finalReduce();
    if (expression === undefined) throw getParseError(" Couldn't reduce expression stack.");
    operatorStacks.pop();
    parser.operatorStack = operatorStacks.at(-1);
    return expression;
  };

  const parseExtendableExpression = () => {
    beginProduction("ExtendableExpr");
    if (isLookahead("junctionList") && isOperandExpected()) pushOperand(parseJunctions());
    else if (BRACKETED_STARTS.has(getNextKind())) pushOperand(parseBracketed());
    else {
      markExpected();
      if (!isLookahead("primitiveExpression")) throw getNextUnexpectedError();
      pushOperand(parsePrimitiveExpression());
    }
    while (isLookahead("expressionSuffix")) {
      if (isLookahead("postfixSuffix") && isNextAboveJunction())
        pushOperator("GenPostfixOp", parsePostfixOperator());
      else if (isLookahead("recordSuffix") && isNextAboveJunction()) {
        const dot = getTokenNode(consume(DOT));
        convertFieldName(getToken(1));
        if (!isNextAboveJunction()) throw getNextUnexpectedError();
        reduceRecord(dot, parseIdentifier());
      } else if (isLookahead("applicationSuffix") && isNextAboveJunction()) {
        parser.expecting = "function argument";
        const application = parseBracketCases();
        if (
          ["GenPrefixOp", "GenNonExpPrefixOp", "GenInfixOp", "GenPostfixOp", "FcnAppl"].includes(
            String(application.kind),
          )
        ) {
          pushOperand(application, parser.lastOperator);
          if (getStack().length !== 1) reduceStack();
        } else pushOperand(application);
      } else throw getNextUnexpectedError();
    }
    if (isLookahead("expressionContinuation")) {
      if (isLookahead("infixContinuation") && isNextAboveJunction()) {
        pushOperator("GenInfixOp", parseInfixOperator());
        while (isLookahead("nextLeadingOperator") && isNextAboveJunction()) parseLeadingOperator();
        if (isLookahead("nextOpenExpression") && isNextAboveJunction())
          pushOperand(parseOpenExpression());
        else if (isNextAboveJunction()) parseExtendableExpression();
        else throw getNextUnexpectedError();
      } else if (isLookahead("labelContinuation") && isNextAboveJunction()) {
        const colons = getTokenNode(consume(COLONCOLON));
        const label = getStack().at(-1)?.node;
        if (!isLabel(label))
          throw getParseError(`\`::' at ${formatLocation(colons)} does not follow a label.`);
        getStack().pop();
        const labeled = parseExpression();
        const stackOperator = getStack().at(-1)?.operator;
        if (
          (labeled.kind === "InfixExpr" || labeled.kind === "PostfixExpr") &&
          getStack().length > 0 &&
          stackOperator !== undefined &&
          parser.lastOperator !== undefined &&
          !isPreceding(stackOperator, parser.lastOperator)
        ) {
          throw getParseError(
            `Removing label at ${formatLocation(label ?? getNode("Missing"))} would change expression parsing.`,
          );
        }
        pushOperand(getNode("Label", [label ?? getNode("Missing"), colons, labeled]));
      } else throw getNextUnexpectedError();
    }
    endProduction();
  };

  const parseStepExpression = () => {
    const step = consumeOneOf([PROOF_STEP, PROOF_IMPLICIT_STEP]);
    const node = getTokenNode(step);
    if (getProofLevel() < 0 && parser.proofDepth <= 0)
      throw getParseError(`${formatLocation(node)}: Step number used outside proof.`);
    if (step.image[1] === "+")
      throw getParseError(`${formatLocation(node)}: <+> step number used in an expression.`);
    return node;
  };

  const parsePrimitiveName = () => {
    const kind = getNextKind();
    if (kind === IDENTIFIER) return parseIdentifier();
    if (kind === PROOF_STEP || kind === PROOF_IMPLICIT_STEP) return parseStepExpression();
    if (INFIX_OPERATORS.includes(kind)) return parseInfixOperator();
    if (POSTFIX_OPERATORS.includes(kind)) return parsePostfixOperator();
    markExpected();
    if (!isLookahead("negativeOperator")) throw getNextUnexpectedError();
    return parseNonExpressionPrefixOperator();
  };

  const parsePrimitiveExpression = () =>
    inProduction("Primitive expression", () => {
      if (isLookahead("stringLiteral") && isNextAboveJunction()) {
        return inProduction("String", () => getTokenNode(consume(STRING_LITERAL), "String"));
      }
      if (isLookahead("numberLiteral") && isNextAboveJunction()) return parseNumber();
      if (!PRIMITIVE_STARTS.has(getNextKind())) {
        markExpected();
        throw getNextUnexpectedError();
      }
      const name = parsePrimitiveName();
      const operatorArguments = isLookahead("primitiveArguments")
        ? parseOperatorArguments()
        : undefined;
      while (isNextKind(BANG)) addHeir(parseBangExtension());
      const bangs = getLastHeirs();
      if (bangs === undefined) {
        const identifier = getNode("GeneralId", [getNode("IdPrefix", []), name]);
        return operatorArguments
          ? getNode("OpApplication", [identifier, operatorArguments])
          : identifier;
      }
      const elements = [
        getNode("IdPrefixElement", [name], operatorArguments, [bangs[0].heirs[0]]),
        ...bangs
          .slice(0, -1)
          .map((bang, index) =>
            getNode("IdPrefixElement", bang.heirs.slice(1), [bangs[index + 1].heirs[0]]),
          ),
      ];
      const lastBang = bangs[bangs.length - 1].heirs;
      const identifier = getNode("GeneralId", [getNode("IdPrefix", elements), lastBang[1]]);
      return lastBang.length === 2
        ? identifier
        : getNode("OpApplication", [identifier, lastBang[2]]);
    });

  const parseBangExtension = () => {
    beginProduction("Bang Extension");
    addToken(BANG);
    if (isLookahead("bangOperand")) {
      if (isLookahead("bangIdentifier") && getToken(1).image !== "@") addHeir(parseIdentifier());
      else {
        const kind = getNextKind();
        if (NON_EXPRESSION_PREFIX_OPERATORS.includes(kind))
          addHeir(parseNonExpressionPrefixOperator());
        else if (INFIX_OPERATORS.includes(kind)) addHeir(parseInfixOperator());
        else if (POSTFIX_OPERATORS.includes(kind)) addHeir(parsePostfixOperator());
        else {
          markExpected();
          throw getNextUnexpectedError();
        }
      }
      if (isLookahead("bangArguments")) addHeir(parseOperatorArguments());
    } else if (getNextKind() === LBR) addHeir(parseOperatorArguments());
    else {
      markExpected();
      if (!isLookahead("structureOperator")) throw getNextUnexpectedError();
      addHeir(parseStructureOperator());
    }
    const node = getNode("IdPrefixElement", getLastHeirs());
    endProduction();
    return node;
  };

  const parseStructureOperator = () => {
    const operator = inProduction("StructOp", () => {
      parser.expecting = "`<<' , `>>' , `:' , `@' , or number";
      const kind = getNextKind();
      if (kind === LAB || kind === RAB || kind === COLON) {
        return getTokenNode(consume(kind), "StructOp");
      }
      if (kind === NUMBER_LITERAL) return parseNumber();
      markExpected();
      if (getToken(1).image !== "@") throw getNextUnexpectedError();
      return getTokenNode(consume(IDENTIFIER), "StructOp");
    });
    if (operator.kind === "Real")
      throw getParseError(`Illegal structural term at ${formatLocation(operator)}`);
    return operator.kind === "Number" ? getNode("StructOp", [operator]) : operator;
  };

  const parseCompilationUnit = () => {
    insertDefinitionBreak();
    if (isNextKind(BEGIN_PRAGMA)) {
      consume(BEGIN_PRAGMA);
      for (;;) {
        const kind = getNextKind();
        if (kind !== NUMBER && kind !== IDENTIFIER) {
          markExpected();
          break;
        }
        consume(kind);
      }
    }
    parseModuleDefinition();
  };

  try {
    parseCompilationUnit();
  } catch (error) {
    if (!(error instanceof TlaParseError)) throw error;
    errors.push(error.message);
  }
  return errors.length === 0 ? undefined : errors.join("\n");
};

// Parses the module SANY reads from the file name.tla. A module SANY's parser rejects fails as it
// does in TLC: SANY's message, then a fatal error that names the module.
export const parseModuleFile = (source: string, name: string) => {
  try {
    return parseModule(source);
  } catch (error) {
    if (!(error instanceof TlaSyntaxError)) throw error;
    const parseError = getSanyParseError(source);
    if (parseError === undefined) throw error;
    throw createSanyError(
      [
        {
          location: `In module ${name}`,
          message: `Could not parse module ${name} from file ${name}.tla`,
        },
      ],
      true,
      parseError,
    );
  }
};
