import { createSanyLexer, getKind, type SanyToken } from "./sany-lexer";

// The report SANY's parser, TLAplusParser, gives for a module it fails to parse. This interprets
// the grammar of javacc/tla+.jj the way the code JavaCC generates from it runs: the productions,
// their lookahead specifications, and the semantic actions that steer parsing or set the
// `expecting` message. TLAplusParser.msgStackToString prints that message, the token the parser
// failed at, and the productions it was in, so the interpreter must fail at the same token, in the
// same productions, and must look as far ahead as JavaCC's jj_rescan_token does.

type Predicate = (state: ParserState) => boolean;

interface TokensUnit {
  type: "tokens";
  kinds: Set<number>;
}

interface CallUnit {
  type: "call";
  name: string;
}

interface SequenceUnit {
  type: "sequence";
  units: Unit[];
}

interface ChoiceUnit {
  type: "choice";
  alternatives: SequenceUnit[];
}

interface RepeatUnit {
  type: "zeroOrMore" | "oneOrMore" | "optional";
  body: SequenceUnit;
}

// Java code in a production, which may throw a ParseException with a message.
interface ActionUnit {
  type: "action";
  run: (state: ParserState) => string | undefined;
}

// A LOOKAHEAD specification. First in a choice's alternative or in a loop's body, it decides
// whether to take that expansion. Elsewhere, JavaCC checks only its semantic part.
interface LookaheadUnit {
  type: "lookahead";
  amount: number;
  expansion: SequenceUnit | undefined;
  semantic: Predicate | undefined;
}

type Unit =
  | TokensUnit
  | CallUnit
  | SequenceUnit
  | ChoiceUnit
  | RepeatUnit
  | ActionUnit
  | LookaheadUnit;

// A token kind in angle brackets, a production's name, or a unit.
type Part = Unit | string;

interface Production {
  // The name TLAplusParser.bpa pushes on the message stack, if the production calls it.
  message: string | undefined;
  body: SequenceUnit;
  // Java code that runs after the production's epa, given the token bpa pushed.
  exit: ((state: ParserState, start: SanyToken) => string | undefined) | undefined;
}

interface Analysis {
  first: Set<number>;
  isNullable: boolean;
  hasSemanticStart: boolean;
}

// A jj_2 call, which jj_rescan_token scans again if it looked past the current token: JJCalls.
interface LookaheadCall {
  generation: number;
  first: SanyToken;
  amount: number;
}

interface ParserState {
  readToken: () => SanyToken;
  isLexicalError: boolean;
  token: SanyToken;
  // jj_gen, which counts consumed tokens, and its value at the last failed jj_ntk switch.
  generation: number;
  failedSwitchGeneration: number;
  scanPosition: SanyToken;
  lastPosition: SanyToken;
  remaining: number;
  isLookingAhead: boolean;
  isRescanning: boolean;
  farthestRescan: number;
  calls: Map<SequenceUnit, LookaheadCall[]>;
  expecting: string;
  messages: { name: string; token: SanyToken }[];
  moduleName: string | undefined;
  junctions: { kind: number; column: number }[];
  // For each Expression being parsed, whether its OperatorStack is empty or has a prefix or
  // infix operator on top: OperatorStack.preInEmptyTop.
  operatorStacks: boolean[];
  proofLevels: number[];
  isTerminalProof: boolean;
  // Whether FairnessHook is set, which it is if the last NoOpExtension ended with arguments.
  isFairnessHooked: boolean;
  isFairnessParenthesized: boolean[];
  report: string | undefined;
}

type ScanResult = "matched" | "failed" | "done";

// JavaCC's amount for a LOOKAHEAD that gives an expansion but no amount.
const UNBOUNDED_AMOUNT = 2147483647;
const EOF = getKind("EOF");
const IDENTIFIER = getKind("IDENTIFIER");
const DEFBREAK = getKind("DEFBREAK");

const getKindRange = (first: string, last: string) =>
  Array.from(
    { length: getKind(last) - getKind(first) + 1 },
    (_, offset) => getKind(first) + offset,
  );

// TLAplusParser.isOp, isInfixOp, isPostfixOp, and isFieldNameToken.
const OPERATOR_KINDS = new Set(getKindRange("op_57", "op_119"));
const INFIX_KINDS = new Set(getKindRange("op_1", "op_119"));
const POSTFIX_KINDS = new Set(getKindRange("op_57", "op_70"));
const FIELD_NAME_KINDS = new Set([
  ...getKindRange("ACTION", "EXCEPT"),
  getKind("EXTENDS"),
  ...getKindRange("IF", "SF"),
  getKind("STATE"),
  ...getKindRange("THEN", "WITH"),
  getKind("US"),
  ...getKindRange("op_112", "op_116"),
]);

const ESCAPES: Record<string, string> = {
  "\0": "",
  "\b": "\\b",
  "\t": "\\t",
  "\n": "\\n",
  "\f": "\\f",
  "\r": "\\r",
  '"': '\\"',
  "'": "\\'",
  "\\": "\\\\",
};

const tokens = (kinds: Iterable<number>): TokensUnit => ({ type: "tokens", kinds: new Set(kinds) });
const toUnit = (part: Part): Unit => {
  if (typeof part !== "string") return part;
  return part.startsWith("<") ? tokens([getKind(part.slice(1, -1))]) : { type: "call", name: part };
};
const sequence = (...parts: Part[]): SequenceUnit => ({
  type: "sequence",
  units: parts.map(toUnit),
});
const choice = (...alternatives: Part[]): ChoiceUnit => ({
  type: "choice",
  alternatives: alternatives.map((alternative) =>
    typeof alternative !== "string" && alternative.type === "sequence"
      ? alternative
      : sequence(alternative),
  ),
});
const zeroOrMore = (...parts: Part[]): RepeatUnit => ({
  type: "zeroOrMore",
  body: sequence(...parts),
});
const oneOrMore = (...parts: Part[]): RepeatUnit => ({
  type: "oneOrMore",
  body: sequence(...parts),
});
const optional = (...parts: Part[]): RepeatUnit => ({ type: "optional", body: sequence(...parts) });
const action = (run: (state: ParserState) => string | undefined | void): ActionUnit => ({
  type: "action",
  run: (state) => run(state) ?? undefined,
});
const expect = (expecting: string) =>
  action((state) => {
    state.expecting = expecting;
  });
const lookahead = (options: {
  amount?: number;
  expansion?: Part[];
  semantic?: Predicate;
}): LookaheadUnit => ({
  type: "lookahead",
  amount: options.amount ?? (options.expansion ? UNBOUNDED_AMOUNT : 0),
  expansion: options.expansion && sequence(...options.expansion),
  semantic: options.semantic,
});

const getNext = (state: ParserState, token: SanyToken) => {
  if (token.next === undefined) token.next = state.readToken();
  return token.next;
};

// TLAplusParser.getToken, which counts from the scan position while a semantic lookahead runs
// during a scan.
const getToken = (state: ParserState, index: number) => {
  let token = state.isLookingAhead ? state.scanPosition : state.token;
  for (let count = 0; count < index; count++) token = getNext(state, token);
  return token;
};

const isNextKind =
  (...names: string[]) =>
  (state: ParserState) =>
    names.some((name) => getToken(state, 1).kind === getKind(name));

// JunctionListContext.isAboveCurrent and isNewBullet for the next token.
const isAboveCurrent = (state: ParserState) => {
  const junction = state.junctions.at(-1);
  return junction === undefined || junction.column < getToken(state, 1).beginColumn;
};

const isNewBullet = (state: ParserState) => {
  const token = getToken(state, 1);
  const junction = state.junctions.at(-1);
  return junction?.column === token.beginColumn && junction.kind === token.kind;
};

// TLAplusParser.caseSep.
const isCaseSeparator = (state: ParserState) =>
  isNextKind("CASESEP")(state) && isAboveCurrent(state);

// The Java code that lets a keyword name a module or a record field.
const setFieldName = (state: ParserState) => {
  const token = getToken(state, 1);
  if (FIELD_NAME_KINDS.has(token.kind)) token.kind = IDENTIFIER;
};

// SyntaxTreeNode.getLocation for a token, as Location.toString prints it.
const formatLocation = (state: ParserState, token: SanyToken) =>
  `line ${token.beginLine}, col ${token.beginColumn} to line ${token.beginLine}, col ${token.beginColumn + token.image.length - 1} of module ${state.moduleName}`;

// TLAplusParser.belchDEF, which inserts a DEFBREAK token before the left-hand side of the next
// definition. It reverses the links of the tokens it walks over, so that `next` leads back toward
// the definition's start, and restores them when done.
const belchDef = (state: ParserState) => {
  const stops = ["EOF", "THEOREM", "PROPOSITION", "ASSUMPTION", "END_MODULE"].map(getKind);
  const isKind = (token: SanyToken, ...names: string[]) =>
    names.some((name) => token.kind === getKind(name));
  const isOperator = (token: SanyToken | undefined): token is SanyToken =>
    token !== undefined && OPERATOR_KINDS.has(token.kind);
  let previous: SanyToken | undefined = state.token;
  let current = getNext(state, previous);
  previous.next = undefined;
  let next = getNext(state, current);
  current.next = previous;
  while (!stops.includes(next.kind) && !isKind(current, "THEOREM", "PROPOSITION")) {
    if (isKind(current, "DEF")) {
      let head: SanyToken | undefined = previous;
      if (isKind(head, "RBR", "RSB")) {
        let depth = 1;
        while (head.next !== undefined) {
          head = head.next;
          if (isKind(head, "LBR", "LSB") && depth === 1) break;
          if (isKind(head, "LBR", "LSB") && depth > 1) depth--;
          if (isKind(head, "RBR", "RSB")) depth++;
        }
        if (head.next === undefined) head = undefined;
        else if (head.next.kind === IDENTIFIER) head = head.next;
      } else if (head.kind === IDENTIFIER) {
        const operator = head.next;
        if (
          isOperator(operator) &&
          !POSTFIX_KINDS.has(operator.kind) &&
          (!INFIX_KINDS.has(operator.kind) || operator.next?.kind === IDENTIFIER)
        ) {
          if (operator.next?.kind === getKind("SUBSTITUTE")) head = previous;
          else head = INFIX_KINDS.has(operator.kind) ? operator.next : operator;
        }
      } else if (isOperator(head)) head = head.next;
      if (head !== undefined && head.next?.kind !== DEFBREAK) {
        head.next = {
          kind: DEFBREAK,
          image: "Beginning of definition",
          beginLine: head.beginLine,
          beginColumn: head.beginColumn,
          next: head.next,
        };
      }
      break;
    }
    previous = current;
    current = next;
    next = getNext(state, current);
    current.next = previous;
  }
  while (previous !== undefined) {
    current.next = next;
    next = current;
    current = previous;
    previous = current.next;
  }
  current.next = next;
};

// TLAplusParser.matchFcnConst: whether the next tokens are "<< ... >> \in" or a list of
// identifiers followed by \in.
const matchFcnConst = (state: ParserState) => {
  let token = getToken(state, 1);
  if (token.kind === getKind("LAB")) {
    let depth = 1;
    while (depth !== 0) {
      token = getNext(state, token);
      if (token.kind === getKind("LAB")) depth++;
      if (token.kind === getKind("RAB")) depth--;
      if (token.kind === EOF) return false;
    }
    return getNext(state, token).kind === getKind("IN");
  }
  if (token.kind !== IDENTIFIER) return false;
  token = getNext(state, token);
  while (token.kind === getKind("COMMA")) {
    token = getNext(state, token);
    if (token.kind !== IDENTIFIER) return false;
    token = getNext(state, token);
  }
  return token.kind === getKind("IN");
};

// TLAplusParser.levelOfProofStepLexeme: -1 for <*> and -2 for <+>.
const getStepLevel = (token: SanyToken) => {
  if (token.image[1] === "*") return -1;
  return token.image[1] === "+" ? -2 : Number.parseInt(token.image.slice(1));
};

// TLAplusParser.getProofLevel. TLAplusParser's proofDepth is the length of proofLevels less 1.
const getProofLevel = (state: ParserState) => state.proofLevels.at(-1) ?? -1;

const beginsProof = (state: ParserState) => {
  const token = getToken(state, 1);
  if (token.image.length < 2) return false;
  if (token.image[1] === "*") return state.proofLevels.length === 0;
  if (token.image[1] === "+") return true;
  if (
    isNextKind(
      "ProofStepLexeme",
      "BareLevelLexeme",
      "UnnumberedStepLexeme",
      "ProofStepDotLexeme",
    )(state)
  ) {
    if (state.proofLevels.length === 0) return true;
    return getProofLevel(state) >= 0 && getStepLevel(token) > getProofLevel(state);
  }
  return isNextKind("BY", "PROOF", "OBVIOUS", "OMITTED")(state);
};

// TLAplusParser.correctLevel, which also sets the level of a proof from its first step.
const isCorrectLevel = (state: ParserState, token: SanyToken) => {
  const level = getStepLevel(token);
  const depth = state.proofLevels.length - 1;
  const outerLevel = state.proofLevels[depth - 1] ?? -1;
  const isFirstStep = state.proofLevels[depth] < 0;
  if (isFirstStep) state.proofLevels[depth] = level < 0 ? outerLevel + 1 : level;
  if (level === -1) return true;
  if (level === -2) return isFirstStep;
  return isFirstStep ? level > outerLevel : state.proofLevels[depth] === level;
};

const checkStepLevel = (problem: string) =>
  action((state) =>
    isCorrectLevel(state, state.token)
      ? undefined
      : `${formatLocation(state, state.token)}: ${problem}`,
  );

// OperatorStack.pushOnStack, which pushes an operand or an operator on the current stack.
const pushOnStack = (isPrefixOrInfix: boolean) =>
  action((state) => {
    state.operatorStacks[state.operatorStacks.length - 1] = isPrefixOrInfix;
  });

const PREFIX_OPERATOR = tokens(
  [
    "op_26",
    "op_29",
    "op_58",
    "CASESEP",
    "op_61",
    "op_112",
    "op_113",
    "op_114",
    "op_115",
    "op_116",
  ].map(getKind),
);
const NONEXP_PREFIX_OPERATOR = tokens([...PREFIX_OPERATOR.kinds, getKind("op_76")]);
const INFIX_OPERATOR = tokens(INFIX_KINDS);
const POSTFIX_OPERATOR = tokens(POSTFIX_KINDS);
const STEP_START = tokens(
  [
    "ProofStepLexeme",
    "ProofImplicitStepLexeme",
    "ProofStepDotLexeme",
    "BareLevelLexeme",
    "UnnumberedStepLexeme",
  ].map(getKind),
);

// The prefix operators and the operand that Expression and ExtendableExpr share. Each use is a
// separate lookahead site, as in the generated parser.
const getPrefixOperators = () =>
  zeroOrMore(
    lookahead({ expansion: [choice(PREFIX_OPERATOR, "<op_77>")], semantic: isAboveCurrent }),
    choice(sequence("PrefixOp", pushOnStack(true)), sequence("InfixOp", pushOnStack(true))),
  );
const getOperand = () =>
  choice(
    sequence(
      lookahead({ expansion: ["OpenStart"], semantic: isAboveCurrent }),
      "OpenExpression",
      pushOnStack(false),
    ),
    sequence(lookahead({ semantic: isAboveCurrent }), "ExtendableExpr"),
  );

const getUseItem = () =>
  choice(sequence("<MODULE>", expect("identifier"), "Identifier"), "Expression");

const getAssumeProveItem = () =>
  choice(
    sequence(
      lookahead({
        semantic: (state) =>
          isNextKind("ASSUME", "BOXASSUME")(state) ||
          (getToken(state, 2).kind === getKind("COLONCOLON") &&
            [getKind("ASSUME"), getKind("BOXASSUME")].includes(getToken(state, 3).kind)),
      }),
      "AssumeProve",
    ),
    "NewSymb",
    "Expression",
  );

const getJunctionList = () => [
  "JuncItem",
  zeroOrMore(lookahead({ semantic: isNewBullet }), "JuncItem"),
];

const setFieldNameExpecting = (expecting: string) =>
  action((state) => {
    state.expecting = expecting;
    setFieldName(state);
  });

const setTerminalProof = (isTerminalProof: boolean) =>
  action((state) => {
    state.isTerminalProof = isTerminalProof;
  });

// An alternative of OperatorOrFunctionDefinition: a left-hand side, then "==", then a body.
const definition = (expecting: string, ...parts: Part[]) =>
  sequence(
    ...parts.slice(0, -1),
    expect("=="),
    "<DEF>",
    action((state) => {
      belchDef(state);
      state.expecting = expecting;
    }),
    parts[parts.length - 1],
  );

const production = (
  message: string | undefined,
  parts: Part[],
  exit?: Production["exit"],
): Production => ({
  message,
  body: sequence(...parts),
  exit,
});

const PRODUCTIONS: Record<string, Production> = {
  CompilationUnit: production(undefined, [action(belchDef), optional("Prelude"), "Module"]),
  Prelude: production(undefined, [
    "<BEGIN_PRAGMA>",
    zeroOrMore(choice("<NUMBER>", "<IDENTIFIER>")),
  ]),
  Module: production("Module definition", [
    expect("---- MODULE"),
    "BeginModule",
    expect("EXTENDS clause or module body"),
    "Extends",
    expect("Module body"),
    "Body",
    expect("==== or more Module body"),
    "EndModule",
  ]),
  BeginModule: production("Begin module", [
    expect("---- MODULE (beginning of module)"),
    choice("<_BM0>", "<_BM1>", "<_BM2>"),
    setFieldNameExpecting("Identifier"),
    "Identifier",
    action((state) => {
      state.moduleName ??= state.token.image;
      state.expecting = "----";
    }),
    "<SEPARATOR>",
  ]),
  EndModule: production(undefined, ["<END_MODULE>"]),
  Extends: production("Extends", [
    optional(
      "<EXTENDS>",
      setFieldNameExpecting("Identifier"),
      "Identifier",
      expect("comma or module body"),
      zeroOrMore("<COMMA>", setFieldNameExpecting("Identifier"), "Identifier"),
    ),
  ]),
  Body: production("Module body", [
    expect("LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"),
    zeroOrMore(
      choice(
        "<SEPARATOR>",
        "VariableDeclaration",
        "ParamDeclaration",
        sequence(lookahead({ amount: 2 }), "OperatorOrFunctionDefinition"),
        "Recursive",
        sequence(lookahead({ amount: 2 }), "Instance"),
        sequence(lookahead({ amount: 2 }), "Assumption"),
        sequence(lookahead({ amount: 2 }), "Theorem"),
        sequence(lookahead({ amount: 1 }), "Module", action(belchDef)),
        sequence(
          lookahead({
            semantic: (state) =>
              (isNextKind("USE")(state) && getToken(state, 2).kind !== getKind("ONLY")) ||
              isNextKind("HIDE")(state),
          }),
          "UseOrHideOrBy",
        ),
      ),
    ),
  ]),
  VariableDeclaration: production("variable declaration", [
    "<VARIABLE>",
    expect("Identifier"),
    "Identifier",
    expect("comma or module body"),
    zeroOrMore("<COMMA>", expect("Identifier"), "Identifier"),
  ]),
  ParamDeclaration: production("Parameter declaration", [
    expect("CONSTANT"),
    "ParamSubDecl",
    expect("Identifier, operator or _"),
    "ConstantDeclarationItems",
    expect(","),
    zeroOrMore("<COMMA>", expect("Identifier, operator or _"), "ConstantDeclarationItems"),
  ]),
  ParamSubDecl: production("Parameter declaration item", ["<CONSTANT>"]),
  Recursive: production("Recursive", [
    expect("RECURSIVE"),
    "<RECURSIVE>",
    expect("Identifier, operator or _"),
    "ConstantDeclarationItems",
    expect(","),
    zeroOrMore(
      "<COMMA>",
      expect("Identifier, operator or _"),
      "ConstantDeclarationItems",
      expect("`,' or `)'"),
    ),
  ]),
  ConstantDeclarationItems: production("Constant declaration items", [
    expect("Identifier, _ or prefix op"),
    choice(
      sequence(
        "Identifier",
        expect("(, comma, or Module Body"),
        optional(
          lookahead({ amount: 2 }),
          "<LBR>",
          expect("_"),
          "<US>",
          expect("comma or )"),
          zeroOrMore("<COMMA>", expect("_"), "<US>", expect("comma or )")),
          "<RBR>",
        ),
      ),
      sequence("NonExpPrefixOp", expect("_"), "<US>"),
      sequence(
        "<US>",
        expect("prefix or postfix operator"),
        choice(sequence("InfixOp", expect("_"), "<US>"), "PostfixOp"),
      ),
    ),
  ]),
  OperatorOrFunctionDefinition: production("Definition", [
    expect("LOCAL, Identifier or Operator Symbol"),
    optional("<LOCAL>"),
    "<DEFBREAK>",
    expect("LOCAL, Identifier or Operator Symbol"),
    choice(
      definition(
        "Expression",
        lookahead({ expansion: ["<IDENTIFIER>", "<LSB>"] }),
        "Identifier",
        expect("["),
        "<LSB>",
        expect("Identifier"),
        "QuantBound",
        expect("COMMA or ]"),
        zeroOrMore("<COMMA>", expect("Identifier"), "QuantBound"),
        "<RSB>",
        "Expression",
      ),
      definition(
        "Expression",
        lookahead({ expansion: ["<IDENTIFIER>", POSTFIX_OPERATOR] }),
        "PostfixLHS",
        "Expression",
      ),
      definition(
        "Expression",
        lookahead({ expansion: ["<IDENTIFIER>", INFIX_OPERATOR] }),
        "InfixLHS",
        "Expression",
      ),
      definition(
        "Expression or Instance",
        lookahead({ expansion: ["<IDENTIFIER>", choice("<LBR>", "<DEF>")] }),
        "IdentLHS",
        choice("Expression", "Instantiation"),
      ),
      definition("Expression", "PrefixLHS", "Expression"),
    ),
  ]),
  IdentifierTuple: production("Identifier tuple", [
    "<LAB>",
    expect("Identifier or >>"),
    optional(
      "Identifier",
      expect("COMMA or >>"),
      zeroOrMore("<COMMA>", expect("COMMA or >>"), "Identifier", expect("COMMA or >>")),
    ),
    "<RAB>",
  ]),
  IdentLHS: production("Identifier LHS", [
    "Identifier",
    expect("( or =="),
    optional(
      "<LBR>",
      expect("Identifier Declaration, prefix op, _ or )"),
      choice("IdentDecl", "SomeFixDecl"),
      expect("COMMA or )"),
      zeroOrMore(
        "<COMMA>",
        expect("Identifier Declaration, prefix op or _"),
        choice("IdentDecl", "SomeFixDecl"),
        expect("COMMA or )"),
      ),
      "<RBR>",
    ),
  ]),
  PrefixLHS: production("Prefix LHS", [NONEXP_PREFIX_OPERATOR, expect("Identifier"), "Identifier"]),
  InfixLHS: production("Infix LHS", ["Identifier", INFIX_OPERATOR, "Identifier"]),
  PostfixLHS: production("Postfix LHS", ["Identifier", POSTFIX_OPERATOR]),
  IdentDecl: production("Identifier Declation", [
    "Identifier",
    expect("( or ..."),
    optional(
      "<LBR>",
      expect("_"),
      "<US>",
      expect("COMMA or )"),
      zeroOrMore("<COMMA>", expect("_"), "<US>", expect("COMMA or )")),
      "<RBR>",
    ),
  ]),
  SomeFixDecl: production("Op. Symbol Declaration", [
    choice(
      sequence("NonExpPrefixOp", expect("_"), "<US>"),
      sequence(
        "<US>",
        expect("infix or postfix operator"),
        choice(sequence("InfixOp", expect("_"), "<US>"), "PostfixOp"),
      ),
    ),
  ]),
  Instance: production("Instance", [
    expect("LOCAL or instance"),
    optional("<LOCAL>"),
    "Instantiation",
    expect("COMMA or Module Body"),
  ]),
  Instantiation: production("NonLocalInstance", [
    "<INSTANCE>",
    setFieldNameExpecting("Module identifier"),
    "Identifier",
    expect("WITH or another definition."),
    optional(
      "<WITH>",
      expect(""),
      "Substitution",
      expect(""),
      zeroOrMore(lookahead({ amount: 3 }), "<COMMA>", expect(""), "Substitution", expect("")),
    ),
  ]),
  Substitution: production("Substitution", [
    choice("Identifier", "NonExpPrefixOp", "InfixOp", "PostfixOp"),
    expect("<-"),
    "<SUBSTITUTE>",
    expect("Expression or Op. Symbol"),
    "OpOrExpr",
  ]),
  PrefixOp: production(undefined, [PREFIX_OPERATOR]),
  NonExpPrefixOp: production(undefined, [NONEXP_PREFIX_OPERATOR]),
  InfixOp: production("Infix Op", [INFIX_OPERATOR]),
  PostfixOp: production(undefined, [POSTFIX_OPERATOR]),
  Identifier: production(undefined, ["<IDENTIFIER>"]),
  Assumption: production("Assumption", [
    expect("ASSUM..."),
    choice("<ASSUMPTION>", "<ASSUME>"),
    optional(lookahead({ amount: 2 }), optional("<DEFBREAK>"), "Identifier", expect("=="), "<DEF>"),
    action((state) => {
      belchDef(state);
      state.expecting = "Expression";
    }),
    "Expression",
  ]),
  // A label returns from AssumeProve after the labeled AssumeProve, which a choice expresses.
  AssumeProve: production("Assume-Prove", [
    choice(
      sequence("Identifier", "<COLONCOLON>", "AssumeProve"),
      sequence(
        choice("<ASSUME>", "<BOXASSUME>"),
        expect("Expression, Declaration, or AssumeProve"),
        getAssumeProveItem(),
        expect("PROVE or `,'"),
        zeroOrMore(
          "<COMMA>",
          expect("Expression, Declaration, or AssumeProve"),
          getAssumeProveItem(),
          expect("PROVE or `,'"),
        ),
        choice("<PROVE>", "<BOXPROVE>"),
        expect("Expression"),
        "Expression",
      ),
    ),
  ]),
  NewSymb: production("NEW symbol declaration", [
    expect("NEW, CONSTANT, VARIABLE, STATE, ACTION, or TEMPORAL"),
    choice(
      sequence(
        lookahead({ amount: 2 }),
        choice(sequence(lookahead({ amount: 2 }), "<NEW>", "<CONSTANT>"), "<NEW>", "<CONSTANT>"),
        expect("Constant declaration"),
        choice(
          sequence(
            lookahead({ amount: 2 }),
            "IdentDecl",
            optional("<IN>", expect("Expression"), "Expression"),
          ),
          "SomeFixDecl",
        ),
      ),
      sequence(
        lookahead({ amount: 2 }),
        optional("<NEW>"),
        "<VARIABLE>",
        expect("Identifier"),
        "Identifier",
      ),
      sequence(
        lookahead({ amount: 2 }),
        optional("<NEW>"),
        choice("<STATE>", "<ACTION>", "<TEMPORAL>"),
        expect("Declaration"),
        choice("IdentDecl", "SomeFixDecl"),
      ),
    ),
  ]),
  MaybeBound: production("Domain binding", [optional("<IN>", expect("Expression"), "Expression")]),
  Theorem: production("Theorem", [
    expect("THEOREM, PROPOSITION"),
    choice("<THEOREM>", "<PROPOSITION>"),
    expect("Identifier, Assume-Prove or Expression"),
    optional(lookahead({ amount: 2 }), "Identifier", expect("=="), "<DEF>"),
    action(belchDef),
    choice(
      sequence(
        lookahead({ amount: 3 }),
        lookahead({ semantic: isNextKind("ASSUME", "BOXASSUME") }),
        "AssumeProve",
      ),
      "Expression",
    ),
    optional(lookahead({ semantic: beginsProof }), "Proof"),
  ]),
  Proof: production("Proof", [
    action((state) => {
      state.proofLevels.push(-1);
    }),
    choice(
      sequence(
        lookahead({
          semantic: (state) => isNextKind("BY")(state) || getToken(state, 2).kind === getKind("BY"),
        }),
        "UseOrHideOrBy",
      ),
      sequence(lookahead({ amount: 2 }), optional("<PROOF>"), choice("<OBVIOUS>", "<OMITTED>")),
      sequence(
        optional(lookahead({ amount: 2 }), "<PROOF>"),
        zeroOrMore(
          lookahead({ semantic: (state) => getToken(state, 2).kind !== getKind("QED") }),
          "Step",
          expect("a proof step"),
        ),
        "QEDStep",
      ),
    ),
    action((state) => {
      state.proofLevels.pop();
    }),
  ]),
  UseOrHideOrBy: production("UseOrHideOrBy", [
    choice(
      sequence(optional("<PROOF>"), "<BY>", setTerminalProof(true), optional("<ONLY>")),
      sequence("<USE>", setTerminalProof(false), optional("<ONLY>")),
      sequence("<HIDE>", setTerminalProof(false)),
    ),
    expect("an expression, `MODULE' or `DEF'"),
    optional(
      getUseItem(),
      zeroOrMore(
        "<COMMA>",
        expect("MODULE or expression"),
        getUseItem(),
        action((state) => {
          state.expecting = state.isTerminalProof
            ? "comma, DEF, or [.]"
            : "comma, DEF, or proof step";
        }),
      ),
    ),
    optional(
      "<DF>",
      expect("MODULE or expression"),
      getUseItem(),
      zeroOrMore(
        "<COMMA>",
        expect("MODULE or expression"),
        getUseItem(),
        action((state) => {
          state.expecting = state.isTerminalProof ? "comma or [.]" : "comma or proof step";
        }),
      ),
    ),
    action((state) => {
      if (state.isTerminalProof) state.expecting = "[.]";
    }),
  ]),
  QEDStep: production("QED step", [
    expect("Step number"),
    STEP_START,
    checkStepLevel("QED step's number has bad level."),
    expect("QED"),
    "<QED>",
    optional(lookahead({ semantic: beginsProof }), "Proof"),
  ]),
  Step: production("Step", [
    expect("Step number"),
    STEP_START,
    checkStepLevel("step's number has bad level."),
    expect("proof step"),
    choice(
      sequence(lookahead({ semantic: isNextKind("USE", "HIDE") }), "UseOrHideOrBy"),
      sequence(lookahead({ semantic: isNextKind("INSTANCE") }), "Instantiation"),
      sequence(lookahead({ semantic: isNextKind("DEFBREAK", "DEFINE") }), "DefStep"),
      "HaveStep",
      "TakeStep",
      "WitnessStep",
      "PickStep",
      "CaseStep",
      "AssertStep",
    ),
    optional(lookahead({ semantic: beginsProof }), "Proof"),
  ]),
  DefStep: production("DefStep", [
    optional("<DEFINE>"),
    oneOrMore(lookahead({ amount: 2 }), "OperatorOrFunctionDefinition"),
  ]),
  HaveStep: production("HaveStep", ["<HAVE>", expect("expression"), "Expression"]),
  TakeStep: production("TakeStep", [
    "<TAKE>",
    expect("identifier"),
    choice(
      sequence(
        lookahead({
          expansion: [
            choice(
              sequence("<IDENTIFIER>", zeroOrMore("<COMMA>", "<IDENTIFIER>"), "<IN>"),
              "<LAB>",
            ),
          ],
        }),
        "QuantBound",
        expect("comma or step"),
        zeroOrMore(
          "<COMMA>",
          expect("identifier or tuple of identifiers"),
          "QuantBound",
          expect("comma or proof step"),
        ),
      ),
      sequence(
        "Identifier",
        expect("comma or proof step"),
        zeroOrMore("<COMMA>", expect("identifier"), "Identifier", expect("comma or proof step")),
      ),
    ),
  ]),
  WitnessStep: production("WitnessStep", [
    "<WITNESS>",
    expect("expression"),
    "Expression",
    zeroOrMore("<COMMA>", expect("expression"), "Expression", expect("comma or colon")),
  ]),
  PickStep: production("PickStep", [
    "<PICK>",
    expect("identifier"),
    choice(
      sequence(
        lookahead({
          expansion: ["<IDENTIFIER>", zeroOrMore("<COMMA>", "<IDENTIFIER>"), "<COLON>"],
        }),
        "Identifier",
        expect("comma, or colon"),
        zeroOrMore("<COMMA>", expect("identifier"), "Identifier", expect("comma or colon")),
      ),
      sequence(
        "QuantBound",
        expect("comma or colon"),
        zeroOrMore(
          "<COMMA>",
          expect("identifier or tuple of identifiers"),
          "QuantBound",
          expect("comma or colon"),
        ),
      ),
    ),
    "<COLON>",
    expect("expression"),
    "Expression",
  ]),
  CaseStep: production("CaseStep", ["<CASE>", expect("expression"), "Expression"]),
  AssertStep: production("AssertStep", [
    optional("<SUFFICES>", expect("expression or ASSUME/PROVE")),
    choice(
      "Expression",
      sequence(lookahead({ semantic: isNextKind("ASSUME", "BOXASSUME") }), "AssumeProve"),
    ),
  ]),
  ParenthesesExpression: production(undefined, [
    choice("ParenExpr", "BraceCases", "SBracketCases", "TupleOrAction", "FairnessExpr"),
  ]),
  OpenExpression: production(undefined, [
    choice("SomeQuant", "SomeTQuant", "IfThenElse", "Case", "LetIn", "UnboundOrBoundChoose"),
  ]),
  String: production("String", ["<STRING_LITERAL>"]),
  Number: production(undefined, [
    "<NUMBER_LITERAL>",
    optional(lookahead({ amount: 2 }), "<DOT>", "<NUMBER_LITERAL>"),
  ]),
  OpArgs: production("Optional Arguments", [
    "<LBR>",
    "OpOrExpr",
    zeroOrMore("<COMMA>", "OpOrExpr"),
    "<RBR>",
  ]),
  OpOrExpr: production(undefined, [
    choice(
      sequence(
        lookahead({
          amount: 2,
          expansion: [
            choice(NONEXP_PREFIX_OPERATOR, INFIX_OPERATOR, POSTFIX_OPERATOR),
            tokens(
              [
                "COMMA",
                "RBR",
                "DEFBREAK",
                "LOCAL",
                "INSTANCE",
                "THEOREM",
                "ASSUME",
                "END_MODULE",
                "SEPARATOR",
                "_BM0",
                "ASSUMPTION",
                "CONSTANT",
                "VARIABLE",
                "RECURSIVE",
              ].map(getKind),
            ),
          ],
          semantic: isAboveCurrent,
        }),
        choice(
          "NonExpPrefixOp",
          sequence(
            "InfixOp",
            action((state) =>
              state.token.image === "\\X" || state.token.image === "\\times"
                ? `${formatLocation(state, state.token)}: \\X may not be used as an infix operator.`
                : undefined,
            ),
          ),
          "PostfixOp",
        ),
      ),
      sequence(lookahead({ expansion: ["<LAMBDA>"], semantic: isAboveCurrent }), "Lambda"),
      "Expression",
    ),
  ]),
  ParenExpr: production(undefined, ["<LBR>", "Expression", "<RBR>"]),
  SomeQuant: production("Quantified form", [
    choice("<EXISTS>", "<FORALL>"),
    choice(
      sequence(
        lookahead({
          expansion: ["<IDENTIFIER>", zeroOrMore("<COMMA>", "<IDENTIFIER>"), "<COLON>"],
        }),
        "Identifier",
        zeroOrMore("<COMMA>", "Identifier"),
      ),
      sequence("QuantBound", zeroOrMore("<COMMA>", "QuantBound")),
    ),
    "<COLON>",
    "Expression",
  ]),
  SomeTQuant: production("Bound Quantified Expression", [
    choice("<T_EXISTS>", "<T_FORALL>"),
    "Identifier",
    zeroOrMore("<COMMA>", "Identifier"),
    "<COLON>",
    "Expression",
  ]),
  QuantBound: production("Quant Bound", [
    choice(
      "IdentifierTuple",
      sequence("Identifier", zeroOrMore("<COMMA>", "Identifier", expect(", or \\in"))),
    ),
    "<IN>",
    "Expression",
  ]),
  BraceCases: production("Some { } form", [
    "<LBC>",
    optional(
      choice(
        sequence(
          lookahead({ semantic: matchFcnConst }),
          choice("IdentifierTuple", "Identifier"),
          expect("\\in"),
          "<IN>",
          "Expression",
          expect("':', ',' or '}'"),
          optional(choice(sequence("<COLON>", "Expression"), oneOrMore("<COMMA>", "Expression"))),
        ),
        sequence(
          lookahead({ expansion: [choice("IdentifierTuple", "<IDENTIFIER>"), "<COMMA>"] }),
          "Expression",
          zeroOrMore("<COMMA>", "Expression"),
        ),
        sequence(
          lookahead({ expansion: [choice("IdentifierTuple", "<IDENTIFIER>"), "<COLON>"] }),
          "Expression",
          "<COLON>",
          "QuantBound",
          zeroOrMore("<COMMA>", "QuantBound"),
        ),
        sequence(
          "Expression",
          optional(
            choice(
              sequence("<COLON>", "QuantBound", zeroOrMore("<COMMA>", "QuantBound")),
              oneOrMore("<COMMA>", "Expression"),
            ),
          ),
        ),
      ),
    ),
    "<RBC>",
  ]),
  SBracketCases: production("Some [] Form", [
    "<LSB>",
    choice(
      sequence(
        lookahead({ semantic: matchFcnConst }),
        "QuantBound",
        zeroOrMore("<COMMA>", "QuantBound"),
        "<MAPTO>",
        "Expression",
        "<RSB>",
      ),
      sequence(
        lookahead({ expansion: ["<IDENTIFIER>", "<MAPTO>"] }),
        "FieldVal",
        zeroOrMore("<COMMA>", "FieldVal"),
        "<RSB>",
      ),
      sequence(
        lookahead({
          semantic: (state) =>
            getToken(state, 2).kind === getKind("MAPTO") &&
            FIELD_NAME_KINDS.has(getToken(state, 1).kind),
        }),
        action((state) => {
          getToken(state, 1).kind = IDENTIFIER;
        }),
        "FieldVal",
        zeroOrMore("<COMMA>", "FieldVal"),
        "<RSB>",
      ),
      sequence(
        lookahead({ expansion: ["<IDENTIFIER>", "<COLON>"] }),
        "FieldSet",
        zeroOrMore("<COMMA>", "FieldSet"),
        "<RSB>",
      ),
      sequence(
        "Expression",
        choice(
          sequence(zeroOrMore("<COMMA>", "Expression"), "<RSB>"),
          sequence("<ARROW>", "Expression", "<RSB>"),
          sequence("<EXCEPT>", "ExceptSpec", zeroOrMore("<COMMA>", "ExceptSpec"), "<RSB>"),
          sequence("<ARSB>", "ReducedExpression"),
        ),
      ),
    ),
  ]),
  FieldVal: production("Field Value", ["Identifier", "<MAPTO>", "Expression"]),
  FieldSet: production("Field Set", ["Identifier", "<COLON>", "Expression"]),
  ExceptSpec: production("Except Spec", [
    "<BANG>",
    oneOrMore("ExceptComponent", expect("= or ,")),
    "<EQUALS>",
    "Expression",
  ]),
  ExceptComponent: production("Except Component", [
    choice(
      sequence("<DOT>", action(setFieldName), "Identifier"),
      sequence("<LSB>", "Expression", zeroOrMore("<COMMA>", "Expression"), "<RSB>"),
    ),
  ]),
  TupleOrAction: production("Some << -- >> or >>_ Form", [
    "<LAB>",
    optional("Expression", zeroOrMore("<COMMA>", "Expression")),
    choice("<RAB>", sequence("<ARAB>", "ReducedExpression")),
  ]),
  // The innermost NoOpExtension sets FairnessHook to its arguments, which end with ")".
  NoOpExtension: production(undefined, [
    "Identifier",
    optional(lookahead({ amount: 2 }), "OpArgs"),
    choice(
      sequence("<BANG>", "NoOpExtension"),
      action((state) => {
        state.isFairnessHooked = state.token.kind === getKind("RBR");
      }),
    ),
  ]),
  ReducedExpression: production("restricted form of expression", [
    choice("NoOpExtension", "ParenExpr", "BraceCases", "SBracketCases", "TupleOrAction"),
  ]),
  FairnessExpr: production(
    "Fairness Expression",
    [
      action((state) => {
        state.isFairnessHooked = false;
        state.isFairnessParenthesized.push(false);
      }),
      choice("<WF>", "<SF>"),
      "ReducedExpression",
      optional(
        lookahead({ amount: 2 }),
        "<LBR>",
        "Expression",
        "<RBR>",
        action((state) => {
          state.isFairnessParenthesized[state.isFairnessParenthesized.length - 1] = true;
        }),
      ),
    ],
    (state, start) =>
      state.isFairnessParenthesized.pop() || state.isFairnessHooked
        ? undefined
        : `Ill-structured fairness expression at line ${start.beginLine}, column ${start.beginColumn}`,
  ),
  IfThenElse: production("IF THEN ELSE", [
    "<IF>",
    "Expression",
    "<THEN>",
    "Expression",
    "<ELSE>",
    "Expression",
  ]),
  Case: production("CASE Expression", [
    "<CASE>",
    "CaseArm",
    zeroOrMore(
      lookahead({
        semantic: (state) => isCaseSeparator(state) && getToken(state, 2).kind !== getKind("OTHER"),
      }),
      "<CASESEP>",
      "CaseArm",
    ),
    optional(lookahead({ semantic: isCaseSeparator }), "<CASESEP>", "OtherArm"),
  ]),
  CaseArm: production("Case Arm", ["Expression", "<ARROW>", "Expression"]),
  OtherArm: production("Case Other Arm", ["<OTHER>", "<ARROW>", "Expression"]),
  LetIn: production("Case Other Arm", ["<LET>", "LetDefinitions", "<LETIN>", "Expression"]),
  LetDefinitions: production("Let Definitions", [
    oneOrMore(choice("OperatorOrFunctionDefinition", "Recursive")),
  ]),
  Junctions: production("AND-OR Junction", [
    action((state) => {
      const token = getToken(state, 1);
      state.junctions.push({ kind: token.kind, column: token.beginColumn });
    }),
    choice(
      sequence(lookahead({ expansion: ["<OR>"] }), ...getJunctionList()),
      sequence(lookahead({ expansion: ["<AND>"] }), ...getJunctionList()),
    ),
    action((state) => {
      state.junctions.pop();
    }),
  ]),
  JuncItem: production("Junction Item", [choice("<OR>", "<AND>"), "Expression"]),
  UnboundOrBoundChoose: production("(Un)Bounded Choose", [
    "<CHOOSE>",
    choice("Identifier", "IdentifierTuple"),
    "MaybeBound",
    "<COLON>",
    "Expression",
  ]),
  Lambda: production("Lambda", [
    "<LAMBDA>",
    expect("Identifier"),
    "Identifier",
    expect("`,' or `:'"),
    zeroOrMore("<COMMA>", expect("Identifier"), "Identifier", expect("`,' or `:'")),
    "<COLON>",
    expect("Expression"),
    "Expression",
  ]),
  Expression: production("Expression", [
    action((state) => {
      state.operatorStacks.push(true);
    }),
    getPrefixOperators(),
    getOperand(),
    action((state) => {
      state.operatorStacks.pop();
    }),
  ]),
  ExtendableExpr: production("ExtendableExpr", [
    choice(
      sequence(
        lookahead({
          expansion: [choice("<AND>", "<OR>")],
          semantic: (state) => state.operatorStacks.at(-1) ?? true,
        }),
        "Junctions",
        pushOnStack(false),
      ),
      sequence("ParenthesesExpression", pushOnStack(false)),
      sequence("PrimitiveExp", pushOnStack(false)),
    ),
    zeroOrMore(
      choice(
        sequence(
          lookahead({ expansion: ["PostfixOp"], semantic: isAboveCurrent }),
          "PostfixOp",
          pushOnStack(false),
        ),
        sequence(
          lookahead({ expansion: ["<DOT>"], semantic: isAboveCurrent }),
          "<DOT>",
          action(setFieldName),
          lookahead({ semantic: isAboveCurrent }),
          "Identifier",
        ),
        sequence(
          lookahead({ expansion: ["<LSB>"], semantic: isAboveCurrent }),
          expect("function argument"),
          "SBracketCases",
          pushOnStack(false),
        ),
      ),
    ),
    optional(
      choice(
        sequence(
          lookahead({ expansion: ["InfixOp"], semantic: isAboveCurrent }),
          "InfixOp",
          pushOnStack(true),
          getPrefixOperators(),
          getOperand(),
        ),
        sequence(
          lookahead({ expansion: ["<COLONCOLON>"], semantic: isAboveCurrent }),
          "<COLONCOLON>",
          "Expression",
          pushOnStack(false),
        ),
      ),
    ),
  ]),
  PrimitiveExp: production("Primitive expression", [
    choice(
      sequence(lookahead({ expansion: ["String"], semantic: isAboveCurrent }), "String"),
      sequence(lookahead({ expansion: ["<NUMBER_LITERAL>"], semantic: isAboveCurrent }), "Number"),
      sequence(
        choice(
          "Identifier",
          sequence(
            choice("<ProofStepLexeme>", "<ProofImplicitStepLexeme>"),
            action((state) => {
              if (getProofLevel(state) < 0 && state.proofLevels.length <= 1)
                return `${formatLocation(state, state.token)}: Step number used outside proof.`;
              return state.token.image[1] === "+"
                ? `${formatLocation(state, state.token)}: <+> step number used in an expression.`
                : undefined;
            }),
          ),
          "InfixOp",
          "PostfixOp",
          sequence(lookahead({ expansion: ["<op_76>"] }), "NonExpPrefixOp"),
        ),
        optional(lookahead({ amount: 2 }), "OpArgs"),
        zeroOrMore("BangExt"),
      ),
    ),
  ]),
  BangExt: production("Bang Extension", [
    "<BANG>",
    choice(
      sequence(
        choice(
          sequence(
            lookahead({
              expansion: ["Identifier"],
              semantic: (state) => getToken(state, 1).image !== "@",
            }),
            "Identifier",
          ),
          "NonExpPrefixOp",
          "InfixOp",
          "PostfixOp",
        ),
        optional(lookahead({ amount: 2 }), "OpArgs"),
      ),
      "OpArgs",
      "StructOp",
    ),
  ]),
  StructOp: production("StructOp", [
    expect("`<<' , `>>' , `:' , `@' , or number"),
    choice(
      "<LAB>",
      "<RAB>",
      "<COLON>",
      "Number",
      sequence(
        lookahead({ semantic: (state) => getToken(state, 1).image === "@" }),
        "<IDENTIFIER>",
      ),
    ),
  ]),
  OpenStart: production(undefined, [
    choice(
      "<CASE>",
      "<CHOOSE>",
      "<EXISTS>",
      "<FORALL>",
      "<IF>",
      "<LET>",
      "<T_EXISTS>",
      "<T_FORALL>",
    ),
  ]),
};

const analyses = new Map<Unit, Analysis>();

// What JavaCC's ParseEngine.genFirstSet and Semanticize.emptyExpansionExists compute: the tokens
// an expansion can start with, whether it can match nothing, and whether its start passes a
// semantic lookahead, which makes JavaCC decide by a jj_2 call instead of a switch (jj2LA).
const analyze = (unit: Unit): Analysis => {
  const cached = analyses.get(unit);
  if (cached) return cached;
  const analysis = { first: new Set<number>(), isNullable: true, hasSemanticStart: false };
  const add = (inner: Unit) => {
    const innerAnalysis = analyze(inner);
    for (const kind of innerAnalysis.first) analysis.first.add(kind);
    analysis.hasSemanticStart ||= innerAnalysis.hasSemanticStart;
    return innerAnalysis.isNullable;
  };
  if (unit.type === "tokens") {
    analysis.first = unit.kinds;
    analysis.isNullable = false;
  } else if (unit.type === "call") {
    Object.assign(analysis, analyze(PRODUCTIONS[unit.name].body));
  } else if (unit.type === "lookahead") {
    analysis.hasSemanticStart = unit.semantic !== undefined;
  } else if (unit.type === "sequence") {
    const head = unit.units[0];
    analysis.hasSemanticStart = head?.type === "lookahead" && head.semantic !== undefined;
    analysis.isNullable = unit.units.every(
      (inner, index) => (index === 0 && inner.type === "lookahead") || add(inner),
    );
  } else if (unit.type === "choice") {
    analysis.isNullable = unit.alternatives.map(add).some(Boolean);
  } else if (unit.type !== "action") {
    analysis.isNullable = add(unit.body) || unit.type !== "oneOrMore";
  }
  analyses.set(unit, analysis);
  return analysis;
};

const evaluateSemantic = (state: ParserState, semantic: Predicate) => {
  state.isLookingAhead = true;
  const isPassed = semantic(state);
  state.isLookingAhead = false;
  return isPassed;
};

// jj_scan_token, which also records how far past the current token jj_rescan_token scans, the
// length of the longest token sequence the ParseException expects.
const scanToken = (state: ParserState, kinds: Set<number>): ScanResult => {
  if (state.scanPosition === state.lastPosition) {
    state.remaining--;
    state.lastPosition = getNext(state, state.scanPosition);
  }
  state.scanPosition = getNext(state, state.scanPosition);
  if (state.isRescanning) {
    let position = 0;
    let token: SanyToken | undefined = state.token;
    while (token !== undefined && token !== state.scanPosition) {
      position++;
      token = token.next;
    }
    if (token !== undefined && position < 100)
      state.farthestRescan = Math.max(state.farthestRescan, position);
  }
  if (!kinds.has(state.scanPosition.kind)) return "failed";
  return state.remaining === 0 && state.scanPosition === state.lastPosition ? "done" : "matched";
};

// The jj_3 routines, which match an expansion without running its actions. A loop or option skips
// its body's lookahead, but a choice checks the semantic part of each alternative's.
const scan = (state: ParserState, unit: Unit): ScanResult => {
  if (unit.type === "tokens") return scanToken(state, unit.kinds);
  if (unit.type === "call") return scan(state, PRODUCTIONS[unit.name].body);
  if (unit.type === "action") return "matched";
  if (unit.type === "lookahead") {
    return unit.semantic === undefined || evaluateSemantic(state, unit.semantic)
      ? "matched"
      : "failed";
  }
  if (unit.type === "sequence") {
    for (const [index, inner] of unit.units.entries()) {
      if (index === 0 && inner.type === "lookahead") continue;
      const result = scan(state, inner);
      if (result !== "matched") return result;
    }
    return "matched";
  }
  const start = state.scanPosition;
  if (unit.type === "choice") {
    for (const alternative of unit.alternatives) {
      const head = alternative.units[0];
      const isPassed =
        head?.type !== "lookahead" ||
        head.semantic === undefined ||
        evaluateSemantic(state, head.semantic);
      const result = isPassed ? scan(state, alternative) : "failed";
      if (result !== "failed") return result;
      state.scanPosition = start;
    }
    return "failed";
  }
  const first = scan(state, unit.body);
  if (first === "failed") {
    state.scanPosition = start;
    return unit.type === "oneOrMore" ? "failed" : "matched";
  }
  if (first === "done" || unit.type === "optional") return first;
  for (;;) {
    const iterationStart = state.scanPosition;
    const result = scan(state, unit.body);
    if (result === "done") return result;
    if (result === "failed") {
      state.scanPosition = iterationStart;
      return "matched";
    }
  }
};

// A jj_2 call, which scans expansion with a budget of amount new tokens. It saves the call for
// jj_rescan_token as jj_save does, over a call of the same site that can't be rescanned.
const scanAhead = (state: ParserState, amount: number, expansion: SequenceUnit) => {
  state.remaining = amount;
  state.scanPosition = state.token;
  state.lastPosition = state.token;
  const isMatched = scan(state, expansion) !== "failed";
  const call = {
    generation: state.generation + amount - state.remaining,
    first: state.token,
    amount,
  };
  const chain = state.calls.get(expansion) ?? [];
  const staleIndex = chain.findIndex((saved) => saved.generation <= state.generation);
  if (staleIndex === -1) chain.push(call);
  else chain[staleIndex] = call;
  state.calls.set(expansion, chain);
  return isMatched;
};

// The index of the alternative that the generated code's lookahead checks choose, or -1. As
// ParseEngine.buildLookaheadChecker builds them, a check is the semantic lookahead alone where no
// tokens are needed, a jj_ntk switch where one token decides, and a jj_2 call otherwise.
const decide = (state: ParserState, alternatives: SequenceUnit[]) =>
  alternatives.findIndex((alternative) => {
    const head = alternative.units[0];
    const explicit = head?.type === "lookahead" ? head : undefined;
    const amount = explicit?.amount ?? 1;
    const expansion = explicit?.expansion ?? alternative;
    const semantic = explicit?.semantic;
    if (amount === 0 || analyze(expansion).isNullable)
      return semantic === undefined || semantic(state);
    if (amount === 1 && semantic === undefined && !analyze(expansion).hasSemanticStart) {
      if (analyze(expansion).first.has(getToken(state, 1).kind)) return true;
      state.failedSwitchGeneration = state.generation;
      return false;
    }
    return scanAhead(state, amount, expansion) && (semantic === undefined || semantic(state));
  });

// ParseExceptionExtended.getShortMessage for the ParseException that generateParseException
// builds, which shows as many tokens as the longest token sequence it expects. A rescan that
// finishes its lookahead ends the rescans of its site.
const getEncountered = (state: ParserState) => {
  state.isRescanning = true;
  for (const [expansion, chain] of state.calls) {
    for (const call of chain.filter((saved) => saved.generation > state.generation)) {
      state.remaining = call.amount;
      state.scanPosition = call.first;
      state.lastPosition = call.first;
      if (scan(state, expansion) === "done") break;
    }
  }
  state.isRescanning = false;
  const length = Math.max(
    state.failedSwitchGeneration === state.generation ? 1 : 0,
    state.farthestRescan,
  );
  const images: string[] = [];
  let token = getNext(state, state.token);
  for (let index = 0; index < length; index++) {
    if (token.kind === EOF) {
      images.push("<EOF>");
      break;
    }
    images.push(token.image);
    token = getNext(state, token);
  }
  const next = getNext(state, state.token);
  const image = state.token.image.replace(
    /[\0\b\t\n\f\r"'\\]|[^\x20-\x7e]/g,
    (character) =>
      ESCAPES[character] ?? `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
  return `Encountered "${images.join(" ")}" at line ${next.beginLine}, column ${next.beginColumn} and token "${image}" `;
};

// Records TLAplusParser.msgStackToString's report, without its "***Parse Error***" heading.
const fail = (state: ParserState, message?: string) => {
  const expecting = state.expecting === "" ? "" : `Was expecting "${state.expecting}"\n`;
  const stack = state.messages
    .slice(-5)
    .reverse()
    .map(
      (entry) =>
        `${entry.name} starting at line ${entry.token.beginLine}, column ${entry.token.beginColumn}.\n`,
    )
    .join("");
  state.report = `${expecting}${message ?? getEncountered(state)}\n\nResidual stack trace follows:\n${stack}`;
  return false;
};

const consume = (state: ParserState, kinds: Set<number>) => {
  const next = getNext(state, state.token);
  if (!kinds.has(next.kind)) {
    state.failedSwitchGeneration = state.generation;
    return fail(state);
  }
  state.token = next;
  state.generation++;
  return true;
};

const parseProduction = (state: ParserState, production: Production) => {
  const start = getToken(state, 1);
  if (production.message !== undefined) {
    state.messages.push({ name: production.message, token: start });
    state.expecting = "";
  }
  if (!parse(state, production.body)) return false;
  if (production.message !== undefined) {
    state.messages.pop();
    state.expecting = "";
  }
  const message = production.exit?.(state, start);
  return message === undefined || fail(state, message);
};

// Runs the parse-mode code JavaCC generates for unit. It returns false once a ParseException's
// report is recorded.
const parse = (state: ParserState, unit: Unit): boolean => {
  if (unit.type === "tokens") return consume(state, unit.kinds);
  if (unit.type === "call") return parseProduction(state, PRODUCTIONS[unit.name]);
  if (unit.type === "action") {
    const message = unit.run(state);
    return message === undefined || fail(state, message);
  }
  if (unit.type === "lookahead")
    return unit.semantic === undefined || unit.semantic(state) || fail(state);
  if (unit.type === "sequence") {
    return unit.units.every(
      (inner, index) => (index === 0 && inner.type === "lookahead") || parse(state, inner),
    );
  }
  if (unit.type === "choice") {
    const index = decide(state, unit.alternatives);
    return index === -1 ? fail(state) : parse(state, unit.alternatives[index]);
  }
  if (unit.type === "oneOrMore" && !parse(state, unit.body)) return false;
  if (unit.type === "optional") return decide(state, [unit.body]) === -1 || parse(state, unit.body);
  while (decide(state, [unit.body]) === 0) {
    if (!parse(state, unit.body)) return false;
  }
  return true;
};

// SANY's report of a module its parser fails to parse, or undefined if the parser accepts the
// module or its lexer rejects it.
export const getSanyParseError = (source: string) => {
  const readToken = createSanyLexer(source);
  const start: SanyToken = { kind: EOF, image: "", beginLine: 0, beginColumn: 0, next: undefined };
  const state: ParserState = {
    readToken: () => {
      const token = readToken();
      if (token) return token;
      state.isLexicalError = true;
      return { ...start, next: undefined };
    },
    isLexicalError: false,
    token: start,
    generation: 0,
    failedSwitchGeneration: -1,
    scanPosition: start,
    lastPosition: start,
    remaining: 0,
    isLookingAhead: false,
    isRescanning: false,
    farthestRescan: 0,
    calls: new Map(),
    expecting: "nothing",
    messages: [],
    moduleName: undefined,
    junctions: [],
    operatorStacks: [],
    proofLevels: [],
    isTerminalProof: false,
    isFairnessHooked: false,
    isFairnessParenthesized: [],
    report: undefined,
  };
  const isParsed = parse(state, { type: "call", name: "CompilationUnit" });
  return isParsed || state.isLexicalError ? undefined : state.report;
};
