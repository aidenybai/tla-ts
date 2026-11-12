import type { Bound, Declaration, Definition, Expression, Instance } from "../ast";
import { TlaSyntaxError } from "../errors";
import { createLevelFields } from "./builtins";
import {
  createContext,
  type ExprNode,
  type ExprOrOpArgNode,
  type FormalParamNode,
  formatSanyLocation,
  getSymbolArity,
  type InstanceNode,
  isAbsent,
  type LabelNode,
  type LetInNode,
  type OpApplNode,
  type OpArgNode,
  type OpDeclNode,
  type OpDefNode,
  type SanyLocation,
  type SymbolNode,
  type ThmOrAssumpDefNode,
} from "./nodes";
import { getSelectorItems, isGeneralId, type SelectorItem } from "./selectors";
import {
  findNameTokens,
  findToken,
  getArgumentSpan,
  getExpressionSpan,
  getMatchingIndex,
  getPreComments,
  getSpanLocation,
  getTokenIndex,
  getTokenLocation,
  getTokenSource,
  isToken,
  type SourceFile,
  type TokenSpan,
} from "./source";
import {
  applyBuiltin,
  createFormalParam,
  createNullNode,
  createOpArg,
  createOpDef,
  createString,
  getBuiltin,
  getLocation,
  type ModuleGeneration,
  popLabels,
  pushLabelScope,
  resolveName,
  resolveSymbol,
  resolveSynonym,
  withContext,
} from "./generation";
import { getOperandSpan } from "./generator-def-entries";
import {
  checkForUndefinedRecursiveOps,
  getDefinitionSpan,
  processFunction,
  processModuleDefinition,
  processOperator,
  processRecursive,
} from "./generator-definitions";

const isIdentifier = (name: string) => /^[A-Za-z0-9_]+$/.test(name);

const isSelector = (name: string) => name !== "!!" && name.includes("!");

interface BoundSymbols {
  bounded: FormalParamNode[][];
  tupleOrs: boolean[];
  ranges: ExprNode[];
}

type LetUnit =
  | { kind: "Recursive"; declarations: Declaration[] }
  | { kind: "Instance"; instance: Instance }
  | { kind: "Definition"; definition: Definition };

const getNumeralDigits = (text: string) =>
  BigInt(text.startsWith("\\") ? `0${text.slice(1).replace(/^h/i, "x")}` : text).toString();

const OPERATOR_ARGUMENT_KINDS = new Set<Expression["kind"]>([
  "Identifier",
  "Subexpression",
  "OperatorReference",
  "Lambda",
]);

const isOperatorArgument = (argument: Expression) => {
  const items = argument.kind === "Apply" ? getSelectorItems(argument) : undefined;
  return OPERATOR_ARGUMENT_KINDS.has(argument.kind) || (items !== undefined && isGeneralId(items));
};

const POSTFIX_OPERATOR_TEXTS = new Set(["'", "^+", "^*", "^#"]);

const getOperatorNodeKind = (
  expression: Expression & { kind: "OperatorReference" | "Lambda" },
  text: string,
) => {
  if (POSTFIX_OPERATOR_TEXTS.has(text)) return "N_GenPostfixOp";
  return expression.kind === "Lambda" || text === "~" || text === "-."
    ? "N_GenNonExpPrefixOp"
    : "N_GenInfixOp";
};

const locateSelectorItems = (file: SourceFile, items: SelectorItem[], span: TokenSpan) => {
  let cursor = span.start;
  return items.map((item): SelectorItem => {
    const text = item.op === "Name" ? item.name : item.op === "Null" ? "(" : String(item.op);
    const index = findToken(file, cursor, span.end, text);
    if (index === -1) return item;
    if (item.op === "Null") {
      const close = getMatchingIndex(file, index);
      cursor = close + 1;
      return { ...item, location: getSpanLocation(file, { start: index, end: close }) };
    }
    cursor = index + 1;
    const location = getTokenLocation(file, index);
    if (item.args === undefined || !isToken(file, index + 1, "(")) return { ...item, location };
    const close = getMatchingIndex(file, index + 1);
    cursor = close + 1;
    return {
      ...item,
      location,
      argsLocation: getSpanLocation(file, { start: index + 1, end: close }),
    };
  });
};

export const generateSelector = (
  generation: ModuleGeneration,
  expression: Expression,
  expectedArity: number,
  isFact: boolean,
  isDef: boolean,
) => {
  const items = getSelectorItems(expression);
  if (items === undefined) throw new TlaSyntaxError(`Expected a name, found ${expression.kind}`);
  return generation.selectorToNode(
    locateSelectorItems(generation.file, items, getExpressionSpan(generation.file, expression)),
    expectedArity,
    isFact,
    isDef,
    getLocation(generation.file, expression),
  );
};

const generateSelectorExpression = (generation: ModuleGeneration, expression: Expression) => {
  const node = generateSelector(generation, expression, 0, false, false);
  if (node.kind !== "OpAppl") throw new TlaSyntaxError("Expected an expression");
  return node;
};

const checkRecursion = (generation: ModuleGeneration, node: ExprNode) => {
  if (node.kind !== "OpAppl") return;
  const recursive = generation.functions.find((entry) => entry.name === node.operator.name);
  if (recursive) recursive.node.operator = getBuiltin(generation, "$RecursiveFcnSpec");
};

const getBoundGroups = (bounds: Bound[]) =>
  bounds.reduce<Bound[][]>((groups, bound) => {
    const last = groups[groups.length - 1];
    const isSameGroup =
      last !== undefined &&
      last[0].set === bound.set &&
      bound.pattern.kind === "Name" &&
      last[0].pattern.kind === "Name";
    if (isSameGroup) last.push(bound);
    else groups.push([bound]);
    return groups;
  }, []);

export const generateBounds = (
  generation: ModuleGeneration,
  bounds: Bound[],
  searchStart: number,
) =>
  generateBoundsWithRanges(
    generation,
    bounds,
    searchStart,
    getBoundGroups(bounds).map((group) => generateExpression(generation, group[0].set)),
  );

export const generateWithParams = (
  generation: ModuleGeneration,
  params: FormalParamNode[],
  expression: Expression,
) => {
  const scope = generation.labelScopes.at(-1);
  scope?.params.push(params);
  const node = generateExpression(generation, expression);
  scope?.params.pop();
  return node;
};

const generateBoundApplication = (
  generation: ModuleGeneration,
  name: string,
  bounds: Bound[],
  searchStart: number,
  body: Expression,
  location: SanyLocation,
) =>
  withContext(generation, createContext(), () => {
    const symbols = generateBounds(generation, bounds, searchStart);
    const operand = generateWithParams(generation, symbols.bounded.flat(), body);
    return applyBuiltin(generation, name, [operand], location, symbols);
  });

const generateLambda = (
  generation: ModuleGeneration,
  expression: Expression & { kind: "Lambda" },
): OpDefNode => {
  const span = getExpressionSpan(generation.file, expression);
  const nameIndexes = findNameTokens(generation.file, span.start, span.end, expression.params);
  return withContext(generation, createContext(), () => {
    const params = expression.params.map((name, index) =>
      createFormalParam(
        generation,
        name,
        0,
        getTokenLocation(generation.file, nameIndexes[index]),
        true,
      ),
    );
    const body = generateWithParams(generation, params, expression.body);
    return createOpDef(generation, {
      name: "LAMBDA",
      params,
      body,
      location: getSpanLocation(generation.file, span),
      preComments: getPreComments(generation.file, span.start),
    });
  });
};

const getOperatorArgumentName = (file: SourceFile, argument: Expression) =>
  argument.kind === "OperatorReference"
    ? argument.operator
    : argument.kind === "Lambda" && argument.body.kind === "Apply"
      ? argument.body.operator
      : file.tokens[getTokenIndex(file, argument.location)].text;

export const generateOperatorArgument = (
  generation: ModuleGeneration,
  argument: Expression,
  target: OpDeclNode,
): OpArgNode | OpApplNode => {
  const location = getLocation(generation.file, argument);
  if (argument.kind === "Lambda") {
    if (argument.location.range !== undefined && argument.operator === undefined)
      return createOpArg(generation, generateLambda(generation, argument), location);
    return createOpArg(
      generation,
      resolveName(generation, getOperatorArgumentName(generation.file, argument), location),
      location,
    );
  }
  if (!isOperatorArgument(argument)) {
    generation.addError(
      location,
      `Arity ${target.arity} operator (not an expression) is expected \nto substitute for CONSTANT '${target.name}'.`,
    );
    return createNullNode(generation);
  }
  if (argument.kind === "OperatorReference") {
    return createOpArg(generation, resolveName(generation, argument.operator, location), location);
  }
  const node = generateSelector(generation, argument, target.arity, false, false);
  if (node.kind === "OpArg" || (node.kind === "OpAppl" && node.nullKind !== undefined)) return node;
  throw new TlaSyntaxError(
    `Expected an operator argument at line ${location.beginLine}, column ${location.beginColumn}`,
  );
};

export const generateArgument = (
  generation: ModuleGeneration,
  operator: SymbolNode,
  index: number,
  argument: Expression,
  operatorLocation: SanyLocation,
): ExprOrOpArgNode => {
  const isDefinition =
    operator.kind === "OpDef" &&
    (operator.defKind === "UserDefined" || operator.defKind === "ModuleInstance");
  const expectedArity = isDefinition ? (operator.params?.[index]?.arity ?? 0) : 0;
  if (expectedArity === 0) return generateExpression(generation, argument);
  const span = getExpressionSpan(generation.file, argument);
  const location = getSpanLocation(generation.file, span);
  const position = `${index + 1} (counting from 1)`;
  const argumentSpan = getArgumentSpan(generation.file, span);
  if (argumentSpan !== span || !isOperatorArgument(argument)) {
    generation.addError(
      getSpanLocation(generation.file, argumentSpan),
      `An expression appears as argument number ${position} to operator '${operator.name}', in a position an operator is required.`,
    );
    return createNullNode(generation);
  }
  if (
    argument.kind === "Identifier" ||
    argument.kind === "Subexpression" ||
    argument.kind === "Apply"
  ) {
    const node = generateSelector(generation, argument, expectedArity, false, false);
    if (node.kind === "OpArg" || node.kind === "OpAppl") return node;
    throw new TlaSyntaxError(`Expected an operator argument at ${formatSanyLocation(location)}`);
  }
  if (
    argument.kind === "Lambda" &&
    argument.location.range !== undefined &&
    argument.operator === undefined
  ) {
    const lambda = generateLambda(generation, argument);
    const arity = getSymbolArity(lambda);
    if (arity === expectedArity) return createOpArg(generation, lambda, location);
    generation.addError(
      operatorLocation,
      `Lambda expression with arity ${arity} used as argument ${index + 1} of operator \`${operator.name}', \nbut an operator of arity ${expectedArity} is required.`,
    );
    return createNullNode(generation);
  }
  const name = getOperatorArgumentName(generation.file, argument);
  const symbol = resolveSymbol(generation.contexts, resolveSynonym(name));
  if (symbol === undefined) {
    generation.addError(location, `Could not find declaration or definition of symbol '${name}'.`);
    return createNullNode(generation);
  }
  const arity = getSymbolArity(symbol);
  if (arity === expectedArity) return createOpArg(generation, symbol, location);
  generation.addError(
    operatorLocation,
    `Operator with incorrect arity passed as argument. \nOperator '${symbol.name}' of arity ${arity} is argument number ${position} to operator \`${formatSanyLocation(operator.location)}', \nbut an operator of arity ${expectedArity} was expected.`,
  );
  return createNullNode(generation);
};

const generateJunction = (
  generation: ModuleGeneration,
  expression: Expression & { kind: "And" | "Or" },
) => {
  const location = getLocation(generation.file, expression);
  if (expression.isBulleted) {
    return applyBuiltin(
      generation,
      expression.kind === "And" ? "$ConjList" : "$DisjList",
      expression.operands.map((operand) => generateExpression(generation, operand)),
      location,
    );
  }
  const span = getExpressionSpan(generation.file, expression);
  const name = expression.kind === "And" ? "\\land" : "\\lor";
  const [first, ...rest] = expression.operands;
  return rest.reduce<ExprNode>(
    (left, operand, index) => {
      const operandSpan = getOperandSpan(generation.file, operand);
      const end = index === rest.length - 1 ? span.end : operandSpan.end;
      return applyBuiltin(
        generation,
        name,
        [left, generateExpression(generation, operand)],
        getSpanLocation(generation.file, { start: span.start, end }),
      );
    },
    generateExpression(generation, first),
  );
};

const generateCase = (generation: ModuleGeneration, expression: Expression & { kind: "Case" }) => {
  const span = getExpressionSpan(generation.file, expression);
  const arms = expression.arms.map((arm, index) => {
    const condition = getOperandSpan(generation.file, arm.condition);
    const isLast = index === expression.arms.length - 1 && expression.other === undefined;
    const body = getOperandSpan(generation.file, arm.body);
    const operands = [
      generateExpression(generation, arm.condition),
      generateExpression(generation, arm.body),
    ];
    return applyBuiltin(
      generation,
      "$Pair",
      operands,
      getSpanLocation(generation.file, {
        start: condition.start,
        end: isLast ? span.end : body.end,
      }),
    );
  });
  const other = expression.other;
  if (other) {
    const body = getOperandSpan(generation.file, other);
    const otherIndex = findTokenBefore(generation.file, body.start, "OTHER");
    arms.push(
      applyBuiltin(
        generation,
        "$Pair",
        [undefined, generateExpression(generation, other)],
        getSpanLocation(generation.file, { start: otherIndex, end: span.end }),
      ),
    );
  }
  return applyBuiltin(generation, "$Case", arms, getSpanLocation(generation.file, span));
};

const findTokenBefore = (file: SourceFile, index: number, text: string) => {
  for (let current = index; current >= 0; current--) {
    if (isToken(file, current, text)) return current;
  }
  return index;
};

const generateExcept = (
  generation: ModuleGeneration,
  expression: Expression & { kind: "Except" },
) => {
  const span = getExpressionSpan(generation.file, expression);
  const location = getSpanLocation(generation.file, span);
  const operands: ExprOrOpArgNode[] = [generateExpression(generation, expression.function)];
  const exceptNode = applyBuiltin(generation, "$Except", operands, location);
  const functionSpan = getExpressionSpan(generation.file, expression.function);
  let cursor = findToken(generation.file, functionSpan.end + 1, span.end, "EXCEPT") + 1;
  expression.updates.forEach((update) => {
    const bang = findToken(generation.file, cursor, span.end, "!");
    const valueSpan = getOperandSpan(generation.file, update.value);
    const specLocation = getSpanLocation(generation.file, { start: bang, end: valueSpan.end });
    let pathCursor = bang + 1;
    const components = update.path.map((step): ExprNode => {
      if (step.kind === "Field") {
        const nameIndex = findNameOrKeyword(generation.file, pathCursor, step.name);
        pathCursor = nameIndex + 1;
        return createString(generation, step.name, getTokenLocation(generation.file, nameIndex));
      }
      const open = findToken(generation.file, pathCursor, span.end, "[");
      const close = getMatchingIndex(generation.file, open);
      pathCursor = close + 1;
      if (step.args.length === 1) return generateExpression(generation, step.args[0]);
      return applyBuiltin(
        generation,
        "$Tuple",
        step.args.map((innerArgument) => generateExpression(generation, innerArgument)),
        getSpanLocation(generation.file, { start: open, end: close }),
      );
    });
    const sequence = applyBuiltin(generation, "$Seq", components, specLocation);
    const pair = applyBuiltin(generation, "$Pair", [sequence], specLocation);
    generation.exceptSpecStack.push(pair);
    generation.exceptStack.push(exceptNode);
    pair.operands.push(generateExpression(generation, update.value));
    generation.exceptSpecStack.pop();
    generation.exceptStack.pop();
    operands.push(pair);
    cursor = valueSpan.end + 1;
  });
  return exceptNode;
};

export const findNameOrKeyword = (file: SourceFile, start: number, name: string) => {
  for (let index = start; index < file.tokens.length; index++) {
    if (file.tokens[index].text === name && file.tokens[index].kind !== "String") return index;
  }
  return start;
};

const generateRecordFields = (
  generation: ModuleGeneration,
  operator: "$RcdConstructor" | "$SetOfRcds",
  expression: Expression & { kind: "Record" | "RecordSet" },
) => {
  const span = getExpressionSpan(generation.file, expression);
  let cursor = span.start + 1;
  const pairs = expression.fields.map((field, fieldIndex) => {
    const nameIndex = findNameOrKeyword(generation.file, cursor, field.name);
    const valueSpan = getOperandSpan(generation.file, field.value);
    cursor = valueSpan.end + 1;
    if (expression.fields.slice(0, fieldIndex).some((other) => other.name === field.name)) {
      generation.addError(
        getTokenLocation(generation.file, nameIndex),
        "Non-unique fields in constructor.",
      );
    }
    return applyBuiltin(
      generation,
      "$Pair",
      [
        createString(generation, field.name, getTokenLocation(generation.file, nameIndex)),
        generateExpression(generation, field.value),
      ],
      getSpanLocation(generation.file, { start: nameIndex, end: valueSpan.end }),
    );
  });
  const record = applyBuiltin(generation, operator, pairs, getSpanLocation(generation.file, span));
  generation.currentModule.records.push(record);
  return record;
};

const getTokenPosition = (file: SourceFile, index: number) => ({
  line: file.tokens[index].line,
  column: file.tokens[index].column,
});

const getRecursiveDeclarations = (file: SourceFile, start: number) => {
  const declarations: Declaration[] = [];
  let index = start;
  while (file.tokens[index]?.kind === "Identifier") {
    const end = isToken(file, index + 1, "(") ? getMatchingIndex(file, index + 1) : index;
    const arity = file.tokens.slice(index + 1, end).filter((token) => token.text === "_").length;
    declarations.push({
      name: file.tokens[index].text,
      arity,
      location: {
        ...getTokenPosition(file, index),
        range: {
          module: file.name,
          start: getTokenPosition(file, index),
          end: getTokenPosition(file, end),
        },
      },
    });
    if (!isToken(file, end + 1, ",")) break;
    index = end + 2;
  }
  return declarations;
};

const getLetUnits = (file: SourceFile, expression: Expression & { kind: "Let" }) => {
  const units = [
    ...expression.definitions.map((definition) => ({
      unit: { kind: "Definition", definition } satisfies LetUnit,
      span: getDefinitionSpan(file, definition),
    })),
    ...(expression.instances ?? []).map((instance) => ({
      unit: { kind: "Instance", instance } satisfies LetUnit,
      span: getDefinitionSpan(file, instance),
    })),
  ];
  const letStart = getExpressionSpan(file, expression).start;
  const bodyStart = getOperandSpan(file, expression.body).start;
  const recursives: { unit: LetUnit; span: TokenSpan }[] = [];
  for (let index = letStart + 1; index < bodyStart; index++) {
    const isInUnit = units.some((entry) => entry.span.start <= index && index <= entry.span.end);
    if (isToken(file, index, "RECURSIVE") && !isInUnit) {
      recursives.push({
        unit: { kind: "Recursive", declarations: getRecursiveDeclarations(file, index + 1) },
        span: { start: index, end: index },
      });
    }
  }
  return [...units, ...recursives]
    .toSorted((first, second) => first.span.start - second.span.start)
    .map((entry) => entry.unit);
};

const generateLet = (
  generation: ModuleGeneration,
  expression: Expression & { kind: "Let" },
): LetInNode => {
  const context = createContext();
  return withContext(generation, context, () => {
    generation.curLevel++;
    generation.unresolvedCount[generation.curLevel] = 0;
    const opDefs: (OpDefNode | ThmOrAssumpDefNode)[] = [];
    const instances: InstanceNode[] = [];
    getLetUnits(generation.file, expression).forEach((unit) => {
      if (unit.kind === "Recursive") processRecursive(generation, unit.declarations);
      else if (unit.kind === "Instance") {
        processModuleDefinition(generation, unit.instance, opDefs, instances);
      } else if (unit.definition.kind === "Function") {
        processFunction(generation, unit.definition, opDefs);
      } else processOperator(generation, unit.definition, opDefs);
    });
    checkForUndefinedRecursiveOps(generation);
    generation.curLevel = Math.max(generation.curLevel - 1, 0);
    const body = generateExpression(generation, expression.body);
    return {
      ...createLevelFields(generation.getId()),
      kind: "LetIn",
      opDefs,
      instances,
      body,
      context,
      location: getLocation(generation.file, expression),
    };
  });
};

const generateChoose = (
  generation: ModuleGeneration,
  expression: Expression & { kind: "Choose" },
) => {
  const span = getExpressionSpan(generation.file, expression);
  const location = getSpanLocation(generation.file, span);
  return withContext(generation, createContext(), () => {
    const pattern = expression.pattern;
    const names = pattern.kind === "Name" ? [pattern.name] : pattern.names;
    if (expression.set === undefined) {
      const indexes = findNameTokens(generation.file, span.start, span.end, names);
      const params = names.map((name, index) =>
        createFormalParam(
          generation,
          name,
          0,
          getTokenLocation(generation.file, pattern.kind === "Name" ? span.start : indexes[index]),
          true,
        ),
      );
      const body = generateWithParams(generation, params, expression.body);
      return applyBuiltin(generation, "$UnboundedChoose", [body], location, { unbounded: params });
    }
    const range = generateExpression(generation, expression.set);
    const setSpan = getExpressionSpan(generation.file, expression.set);
    const indexes = findNameTokens(generation.file, span.start, setSpan.start, names);
    const params = names.map((name, index) =>
      createFormalParam(
        generation,
        name,
        0,
        getTokenLocation(generation.file, indexes[index]),
        true,
      ),
    );
    const body = generateWithParams(generation, params, expression.body);
    return applyBuiltin(generation, "$BoundedChoose", [body], location, {
      bounded: [params],
      tupleOrs: [pattern.kind === "Tuple"],
      ranges: [range],
    });
  });
};

const getUnresolvedOperator = (
  generation: ModuleGeneration,
  expression: Expression & { kind: "Apply" },
) => {
  if (
    isIdentifier(expression.operator) ||
    isSelector(expression.operator) ||
    expression.args.length > 2
  ) {
    return undefined;
  }
  if (resolveSymbol(generation.contexts, resolveSynonym(expression.operator)) !== undefined) {
    return undefined;
  }
  const span = getExpressionSpan(generation.file, expression);
  if (
    generation.file.tokens[span.start].text === expression.operator &&
    isToken(generation.file, span.start + 1, "(")
  ) {
    return undefined;
  }
  const firstSpan = getOperandSpan(generation.file, expression.args[0]);
  const isPrefix = expression.args.length === 1 && firstSpan.start !== span.start;
  const index = isPrefix ? span.start : firstSpan.end + 1;
  const text = getTokenSource(generation.file, index);
  return {
    index,
    name: isPrefix && text === "-" ? "-." : text,
    fixity: isPrefix ? "prefix" : expression.args.length === 2 ? "infix" : "postfix",
  };
};

export const generateExpression = (
  generation: ModuleGeneration,
  expression: Expression,
): ExprNode => {
  const location = getLocation(generation.file, expression);
  switch (expression.kind) {
    case "Number":
      return {
        ...createLevelFields(generation.getId()),
        kind: "Numeral",
        value: getNumeralDigits(expression.text ?? String(expression.value)),
        location,
      };
    case "Decimal": {
      const [integralPart, fractionalPart] = expression.text.split(".");
      const mantissa = BigInt(integralPart + fractionalPart);
      const isLong = mantissa <= 9223372036854775807n;
      return {
        ...createLevelFields(generation.getId()),
        kind: "Decimal",
        mantissa: mantissa.toString(),
        exponent: isLong ? String(-fractionalPart.length) : String(fractionalPart.length),
        integralPart,
        fractionalPart,
        location,
      };
    }
    case "String":
      return createString(generation, expression.value, location);
    case "Identifier": {
      const node = generateSelectorExpression(generation, expression);
      checkRecursion(generation, node);
      return node;
    }
    case "Apply": {
      const unresolved = getUnresolvedOperator(generation, expression);
      if (unresolved !== undefined) {
        generation.addError(
          getTokenLocation(generation.file, unresolved.index),
          `Could not find declaration or definition of symbol '${unresolved.name}'.`,
        );
        generation.addError(
          location,
          `Couldn't resolve ${unresolved.fixity} operator symbol \`${unresolved.name}'.`,
        );
        return { ...createNullNode(generation), nullKind: "absent" };
      }
      const node = generateSelectorExpression(generation, expression);
      if (isSelector(expression.operator) || isIdentifier(expression.operator)) {
        checkRecursion(generation, node);
      }
      return node;
    }
    case "Bracket":
      generation.addError(
        getTokenLocation(generation.file, getExpressionSpan(generation.file, expression).start),
        "Unsupported expression type `['.",
      );
      return { ...createNullNode(generation), nullKind: "absent" };
    case "OperatorReference":
    case "Lambda": {
      const text =
        generation.file.tokens[getExpressionSpan(generation.file, expression).start].text;
      generation.addError(
        location,
        text === "LAMBDA"
          ? "LAMBDA expression used where an expression is required."
          : `Unsupported expression type \`${getOperatorNodeKind(expression, text)}'.`,
      );
      return { ...createNullNode(generation), nullKind: "absent" };
    }
    case "And":
    case "Or":
      return generateJunction(generation, expression);
    case "Prime":
      return applyBuiltin(
        generation,
        "'",
        [generateExpression(generation, expression.expression)],
        location,
      );
    case "Unchanged":
      return applyBuiltin(
        generation,
        "UNCHANGED",
        [generateExpression(generation, expression.expression)],
        location,
      );
    case "Enabled":
      return applyBuiltin(
        generation,
        "ENABLED",
        [generateExpression(generation, expression.expression)],
        location,
      );
    case "Always":
      return applyBuiltin(
        generation,
        "[]",
        [generateExpression(generation, expression.expression)],
        location,
      );
    case "Eventually":
      return applyBuiltin(
        generation,
        "<>",
        [generateExpression(generation, expression.expression)],
        location,
      );
    case "If":
      return applyBuiltin(
        generation,
        "$IfThenElse",
        [
          generateExpression(generation, expression.condition),
          generateExpression(generation, expression.consequent),
          generateExpression(generation, expression.alternative),
        ],
        location,
      );
    case "Case":
      return generateCase(generation, expression);
    case "Let":
      return generateLet(generation, expression);
    case "Forall":
    case "Exists":
      return generateBoundApplication(
        generation,
        expression.kind === "Forall" ? "$BoundedForall" : "$BoundedExists",
        expression.bounds,
        getExpressionSpan(generation.file, expression).start,
        expression.body,
        location,
      );
    case "UnboundedQuantifier": {
      const span = getExpressionSpan(generation.file, expression);
      const bodySpan = getExpressionSpan(generation.file, expression.body);
      const indexes = findNameTokens(generation.file, span.start, bodySpan.start, expression.names);
      const name = expression.isTemporal
        ? expression.quantifier === "Forall"
          ? "$TemporalForall"
          : "$TemporalExists"
        : expression.quantifier === "Forall"
          ? "$UnboundedForall"
          : "$UnboundedExists";
      return withContext(generation, createContext(), () => {
        const params = expression.names.map((paramName, index) =>
          createFormalParam(
            generation,
            paramName,
            0,
            getTokenLocation(generation.file, indexes[index]),
            true,
          ),
        );
        const body = generateWithParams(generation, params, expression.body);
        return applyBuiltin(generation, name, [body], location, { unbounded: params });
      });
    }
    case "Choose":
      return generateChoose(generation, expression);
    case "SetEnumeration":
      return applyBuiltin(
        generation,
        "$SetEnumerate",
        expression.elements.map((element) => generateExpression(generation, element)),
        location,
      );
    case "Tuple":
      return applyBuiltin(
        generation,
        "$Tuple",
        expression.elements.map((element) => generateExpression(generation, element)),
        location,
      );
    case "SetFilter": {
      const range = generateExpression(generation, expression.bound.set);
      const span = getExpressionSpan(generation.file, expression);
      return withContext(generation, createContext(), () => {
        const bounds = generateBoundsWithRanges(generation, [expression.bound], span.start, [
          range,
        ]);
        const body = generateWithParams(generation, bounds.bounded.flat(), expression.predicate);
        return applyBuiltin(generation, "$SubsetOf", [body], location, bounds);
      });
    }
    case "SetMap":
      return generateBoundApplication(
        generation,
        "$SetOfAll",
        expression.bounds,
        getExpressionSpan(generation.file, expression.expression).end + 1,
        expression.expression,
        location,
      );
    case "FunctionConstruction":
      return generateBoundApplication(
        generation,
        "$FcnConstructor",
        expression.bounds,
        getExpressionSpan(generation.file, expression).start,
        expression.body,
        location,
      );
    case "FunctionSet":
      return applyBuiltin(
        generation,
        "$SetOfFcns",
        [
          generateExpression(generation, expression.domain),
          generateExpression(generation, expression.range),
        ],
        location,
      );
    case "Record":
      return generateRecordFields(generation, "$RcdConstructor", expression);
    case "RecordSet":
      return generateRecordFields(generation, "$SetOfRcds", expression);
    case "Except":
      return generateExcept(generation, expression);
    case "ExceptAt": {
      const except = generation.exceptStack[generation.exceptStack.length - 1];
      const component = generation.exceptSpecStack[generation.exceptSpecStack.length - 1];
      if (except === undefined || component === undefined) {
        generation.addError(location, "@ used where its meaning is not defined.");
        return createNullNode(generation);
      }
      return {
        ...createLevelFields(generation.getId()),
        kind: "At",
        except,
        component,
        location: component.location,
      };
    }
    case "FunctionApplication": {
      const functionNode = generateExpression(generation, expression.function);
      if (isAbsent(functionNode)) return functionNode;
      checkRecursion(generation, functionNode);
      const operator = functionNode.kind === "OpAppl" ? functionNode.operator : undefined;
      const body =
        operator?.kind === "OpDef" && operator.defKind === "UserDefined"
          ? operator.body
          : undefined;
      if (
        body?.kind === "OpAppl" &&
        (body.operator.name === "$NonRecursiveFcnSpec" ||
          body.operator.name === "$RecursiveFcnSpec")
      ) {
        const paramCount = (body.bounded ?? []).reduce(
          (count, params, index) => count + (body.tupleOrs?.[index] ? 1 : params.length),
          0,
        );
        if (expression.args.length >= 2 && paramCount !== expression.args.length) {
          generation.addError(
            location,
            `Function '${operator?.name}' is defined with ${paramCount} parameters, but is applied to ${expression.args.length} arguments.`,
          );
          return createNullNode(generation);
        }
      }
      const argument =
        expression.args.length === 1
          ? generateExpression(generation, expression.args[0])
          : applyBuiltin(
              generation,
              "$Tuple",
              expression.args.map((innerArgument) => generateExpression(generation, innerArgument)),
              location,
            );
      return applyBuiltin(generation, "$FcnApply", [functionNode, argument], location);
    }
    case "FieldAccess": {
      const record = generateExpression(generation, expression.record);
      const span = getExpressionSpan(generation.file, expression);
      return applyBuiltin(
        generation,
        "$RcdSelect",
        [
          record,
          createString(generation, expression.field, getTokenLocation(generation.file, span.end)),
        ],
        location,
      );
    }
    case "Product":
      return applyBuiltin(
        generation,
        "$CartesianProd",
        expression.factors.map((factor) => generateExpression(generation, factor)),
        location,
      );
    case "BoxAction":
    case "AngleAction":
      return applyBuiltin(
        generation,
        expression.kind === "BoxAction" ? "$SquareAct" : "$AngleAct",
        [
          generateExpression(generation, expression.action),
          generateExpression(generation, expression.subscript),
        ],
        location,
      );
    case "WeakFairness":
    case "StrongFairness":
      return applyBuiltin(
        generation,
        expression.kind === "WeakFairness" ? "$WF" : "$SF",
        [
          generateExpression(generation, expression.subscript),
          generateExpression(generation, expression.action),
        ],
        location,
      );
    case "Label":
      return generateLabel(generation, expression);
    case "Subexpression":
      return generateSelectorExpression(generation, expression);
  }
};

const generateBoundsWithRanges = (
  generation: ModuleGeneration,
  bounds: Bound[],
  searchStart: number,
  ranges: ExprNode[],
): BoundSymbols => {
  const groups = getBoundGroups(bounds);
  let cursor = searchStart;
  const bounded = groups.map((group) => {
    const setSpan = getExpressionSpan(generation.file, group[0].set);
    const names = group.flatMap((bound) =>
      bound.pattern.kind === "Name" ? [bound.pattern.name] : bound.pattern.names,
    );
    const indexes = findNameTokens(generation.file, cursor, setSpan.start, names);
    cursor = setSpan.end + 1;
    return names.map((name, index) =>
      createFormalParam(
        generation,
        name,
        0,
        getTokenLocation(generation.file, indexes[index]),
        true,
      ),
    );
  });
  return {
    bounded,
    tupleOrs: groups.map((group) => group[0].pattern.kind === "Tuple"),
    ranges,
  };
};

const generateLabel = (
  generation: ModuleGeneration,
  expression: Expression & { kind: "Label" },
): LabelNode | OpApplNode => {
  const location = getLocation(generation.file, expression);
  const scope = generation.labelScopes.at(-1);
  if (scope === undefined) {
    generation.addError(location, "Label not in definition or proof step.");
    return createNullNode(generation);
  }
  if (
    generation.assumeProveState.isDeclared
      .slice(2, generation.assumeProveState.depth + 1)
      .some(Boolean)
  ) {
    generation.addError(
      location,
      "Label not allowed within scope of declaration in nested ASSUME/PROVE.",
    );
    return createNullNode(generation);
  }
  if (generation.exceptStack.length > 0 && generation.exceptSpecStack.length > 0) {
    generation.addError(location, "Labels inside EXCEPT clauses are not yet implemented.");
    return createNullNode(generation);
  }
  pushLabelScope(generation);
  const body = generateExpression(generation, expression.body);
  const labels = popLabels(generation);
  const paramIndexes = findNameTokens(
    generation.file,
    getExpressionSpan(generation.file, expression).start,
    getExpressionSpan(generation.file, expression.body).start,
    expression.params,
  );
  const params = expression.params.map((name, index) => {
    const symbol = resolveSymbol(generation.contexts, name);
    if (symbol?.kind === "FormalParam") return symbol;
    const paramLocation = getTokenLocation(generation.file, paramIndexes[index]);
    generation.addError(paramLocation, `Illegal parameter ${name} of label \`${expression.name}'.`);
    return createFormalParam(generation, name, 0, paramLocation, false);
  });
  const label: LabelNode = {
    ...createLevelFields(generation.getId()),
    kind: "Label",
    name: expression.name,
    params,
    body,
    labels,
    isAssumeProve: false,
    location,
  };
  const named = new Set<FormalParamNode>();
  params.forEach((param) => {
    if (named.has(param)) {
      generation.addError(
        location,
        `Repeated formal parameter ${param.name} \nin label \`${label.name}'.`,
      );
    }
    named.add(param);
  });
  scope.params.flat().forEach((param) => {
    if (!named.delete(param)) {
      generation.addError(
        location,
        `Label ${label.name} must contain formal parameter \`${param.name}'.`,
      );
    }
  });
  if (named.size > 0) {
    const extras = [...named].map((param) => `${param.name}  `).join("");
    generation.addError(location, `Label ${label.name} declares extra parameter(s)  ${extras}`);
  }
  if (scope.labels.has(label.name))
    generation.addError(location, `Duplicate label \`${label.name}'.`);
  else scope.labels.set(label.name, label);
  const goal = generation.assumeProveState.goal;
  if (goal)
    generation.labelGoals.set(label, {
      scope: goal,
      clause: generation.assumeProveState.goalClause,
    });
  return label;
};
