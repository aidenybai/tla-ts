import type { Expression } from "./ast";
import { TlaEvaluationError } from "./errors";
import {
  bindValue,
  expectBoolean,
  findGlobalName,
  getChildren,
  getEnumeratedElements,
  getConditionError,
  getConjunctError,
  getDomainOperator,
  getEvaluator,
  getFieldError,
  isClosedConstant,
  isLocallyResolved,
  isValueArgument,
  isWorthCaching,
  resolveGlobalOperator,
  type Context,
  type Environment,
  type Evaluator,
} from "./evaluate";
import {
  applyFunction,
  compareValues,
  createSet,
  createSortedFunction,
  createTuple,
  valuesEqual,
  type Value,
} from "./values";

interface Frame {
  context: string;
  state: string;
  next: string;
  isPrimed: boolean;
  locals: Map<string, string>;
}

interface Generator {
  environment: Environment;
  references: unknown[];
  helpers: string[];
  counter: number;
}

const GENERATED_KINDS = new Set([
  "Apply",
  "And",
  "Or",
  "If",
  "FunctionApplication",
  "FieldAccess",
  "Record",
  "Tuple",
  "SetEnumeration",
  "Prime",
  "Unchanged",
  "Forall",
  "Exists",
]);

const describeLocation = (expression: Expression) =>
  `line ${expression.location.line}, column ${expression.location.column}`;

const createRuntime = () => ({
  bool: expectBoolean,
  condition: (value: Value, expression: Expression) => {
    if (typeof value !== "boolean") throw getConditionError(expression, value);
    return value;
  },
  conjunct: (value: Value, expression: Expression & { kind: "And" | "Or" }, index: number) => {
    if (typeof value !== "boolean") throw getConjunctError(expression, index, value);
    return value;
  },
  apply: applyFunction,
  tuple: createTuple,
  set: createSet,
  record: createSortedFunction,
  equal: valuesEqual,
  enumerate: getEnumeratedElements,
  unassigned: (name: string, expression: Expression): never => {
    throw new TlaEvaluationError(
      `The variable ${name} is not assigned at ${describeLocation(expression)}`,
    );
  },
  primeOutsideAction: (expression: Expression): never => {
    throw new TlaEvaluationError(
      `A primed expression appears outside an action at ${describeLocation(expression)}`,
    );
  },
  prime: (context: Context): Context => ({
    environment: context.environment,
    scope: context.scope,
    state: context.next,
    next: undefined,
  }),
  extend: (context: Context, names: string[], values: Value[]): Context => ({
    environment: context.environment,
    scope: names.reduce(
      (scope, name, index) => bindValue(scope, name, values[index]),
      context.scope,
    ),
    state: context.state,
    next: context.next,
  }),
});

const runtime = { value: undefined as ReturnType<typeof createRuntime> | undefined };

const addReference = (generator: Generator, value: unknown) => {
  generator.references.push(value);
  return `reference${generator.references.length - 1}`;
};

const createLocal = (generator: Generator) => `local${generator.counter++}`;

const getFreeNames = (expression: Expression, names = new Set<string>()): Set<string> => {
  if (expression.kind === "Identifier") names.add(expression.name);
  if (expression.kind === "Apply") names.add(expression.operator);
  getChildren(expression).forEach((child) => getFreeNames(child, names));
  return names;
};

const generateDelegate = (generator: Generator, expression: Expression, frame: Frame) => {
  const evaluator = addReference(generator, getEvaluator(expression, generator.environment));
  const freeNames = getFreeNames(expression);
  const captured = [...frame.locals].filter(([name]) => freeNames.has(name));
  if (captured.length === 0) return `${evaluator}(${frame.context})`;
  const names = addReference(
    generator,
    captured.map(([name]) => name),
  );
  return `${evaluator}(extend(${frame.context}, ${names}, [${captured.map(([, local]) => local).join(", ")}]))`;
};

const generateQuantifier = (
  generator: Generator,
  expression: Expression & { kind: "Forall" | "Exists" },
  frame: Frame,
) => {
  const isForall = expression.kind === "Forall";
  const description = JSON.stringify(isForall ? "the body of \\A" : "the body of \\E");
  const name = `quantifier${generator.counter++}`;
  const outer = [...frame.locals.values()];
  const inner: Frame = {
    context: "context",
    state: "state",
    next: "next",
    isPrimed: false,
    locals: new Map(frame.locals),
  };
  const lists = expression.bounds.map(() => createLocal(generator));
  const declarations = expression.bounds.map(
    (bound, index) =>
      `const ${lists[index]} = enumerate(${generateExpression(generator, bound.set, inner)}, ${addReference(generator, bound.set)});`,
  );
  const elements = expression.bounds.map((bound) => {
    const local = createLocal(generator);
    if (bound.pattern.kind === "Name") inner.locals.set(bound.pattern.name, local);
    return local;
  });
  const test = `if (bool(${generateExpression(generator, expression.body, inner)}, ${description}) !== ${isForall}) return ${!isForall};`;
  const loops = elements.reduce((code, element, index) => {
    const position = createLocal(generator);
    return `for (let ${position} = 0; ${position} < ${lists[index]}.length; ${position}++) { const ${element} = ${lists[index]}[${position}]; ${code} }`;
  }, test);
  const parameters = outer.map((local) => `, ${local}`).join("");
  generator.helpers.push(
    `function ${name}(context, state, next${parameters}) { let primed; ${declarations.join(" ")} ${loops} return ${isForall}; }`,
  );
  return `${name}(${frame.context}, ${frame.state}, ${frame.isPrimed ? "undefined" : frame.next}${parameters})`;
};

const generateApply = (
  generator: Generator,
  expression: Expression & { kind: "Apply" },
  frame: Frame,
) => {
  const args = expression.args;
  if (expression.operator === "=>") {
    const left = generateExpression(generator, args[0], frame);
    const right = generateExpression(generator, args[1], frame);
    return `(bool(${left}, "the left side of =>") ? bool(${right}, "the right side of =>") : true)`;
  }
  if (isLocallyResolved(expression)) return generateDelegate(generator, expression, frame);
  const builtin = resolveGlobalOperator(expression.operator, generator.environment);
  if (builtin?.kind !== "Builtin") return generateDelegate(generator, expression, frame);
  if (builtin.name === "DOMAIN") {
    const domain = addReference(generator, getDomainOperator(expression));
    return `${domain}(${generateExpression(generator, args[0], frame)})`;
  }
  const environment = generator.environment;
  if (builtin.evaluateUnary && args.length === 1 && isValueArgument(args[0], environment)) {
    const operation = addReference(generator, builtin.evaluateUnary);
    return `${operation}(${generateExpression(generator, args[0], frame)})`;
  }
  const isBinary =
    args.length === 2 &&
    isValueArgument(args[0], environment) &&
    isValueArgument(args[1], environment);
  if (builtin.evaluateBinary && isBinary) {
    const operation = addReference(generator, builtin.evaluateBinary);
    return `${operation}(${generateExpression(generator, args[0], frame)}, ${generateExpression(generator, args[1], frame)})`;
  }
  return generateDelegate(generator, expression, frame);
};

const generateExpression = (generator: Generator, expression: Expression, frame: Frame): string => {
  const generate = (node: Expression, nodeFrame = frame) =>
    generateExpression(generator, node, nodeFrame);
  if (isWorthCaching(expression) && isClosedConstant(expression, generator.environment)) {
    return generateDelegate(generator, expression, frame);
  }
  switch (expression.kind) {
    case "Number":
      if (Number.isInteger(expression.value) && Math.abs(expression.value) <= 2147483647) {
        return String(expression.value);
      }
      return generateDelegate(generator, expression, frame);
    case "String":
      return JSON.stringify(expression.value);
    case "Identifier": {
      const local = frame.locals.get(expression.name);
      if (local) return local;
      if (isLocallyResolved(expression)) return generateDelegate(generator, expression, frame);
      const global = findGlobalName(expression.name, generator.environment);
      if (global?.kind === "Variable") {
        const name = JSON.stringify(expression.name);
        const node = addReference(generator, expression);
        return `(${frame.state}?.[${global.index}] ?? unassigned(${name}, ${node}))`;
      }
      if (global?.kind === "Value") return addReference(generator, global.value);
      return generateDelegate(generator, expression, frame);
    }
    case "Apply":
      return generateApply(generator, expression, frame);
    case "And": {
      const node = addReference(generator, expression);
      return `(${expression.operands.map((operand, index) => `conjunct(${generate(operand)}, ${node}, ${index})`).join(" && ")})`;
    }
    case "Or":
      return `(${expression.operands.map((operand) => `bool(${generate(operand)}, "a disjunct")`).join(" || ")})`;
    case "If":
      return `(condition(${generate(expression.condition)}, ${addReference(generator, expression)}) ? ${generate(expression.consequent)} : ${generate(expression.alternative)})`;
    case "FunctionApplication": {
      const fn = generate(expression.function);
      if (expression.args.length === 1) return `apply(${fn}, ${generate(expression.args[0])})`;
      return `apply(${fn}, tuple([${expression.args.map((arg) => generate(arg)).join(", ")}]))`;
    }
    case "FieldAccess":
      return `apply(${generate(expression.record)}, ${JSON.stringify(expression.field)}, ${addReference(generator, getFieldError(expression))})`;
    case "Record": {
      const fields = [...expression.fields].sort((left, right) =>
        compareValues(left.name, right.name),
      );
      const hasDuplicates = fields.some(
        (field, index) => index > 0 && fields[index - 1].name === field.name,
      );
      if (hasDuplicates) return generateDelegate(generator, expression, frame);
      const names = addReference(
        generator,
        fields.map((field) => field.name),
      );
      return `record(${names}, [${fields.map((field) => generate(field.value)).join(", ")}])`;
    }
    case "Tuple":
      return `tuple([${expression.elements.map((element) => generate(element)).join(", ")}])`;
    case "SetEnumeration":
      return `set([${expression.elements.map((element) => generate(element)).join(", ")}])`;
    case "Prime": {
      const node = addReference(generator, expression);
      if (frame.isPrimed) return `primeOutsideAction(${node})`;
      const primed: Frame = {
        context: `(primed ??= prime(${frame.context}))`,
        state: frame.next,
        next: "undefined",
        isPrimed: true,
        locals: frame.locals,
      };
      return `(${frame.next} === undefined ? primeOutsideAction(${node}) : ${generate(expression.expression, primed)})`;
    }
    case "Unchanged": {
      const primed = generate({
        kind: "Prime",
        expression: expression.expression,
        location: expression.location,
      });
      return `equal(${primed}, ${generate(expression.expression)})`;
    }
    case "Forall":
    case "Exists":
      if (expression.bounds.every((bound) => bound.pattern.kind === "Name")) {
        return generateQuantifier(generator, expression, frame);
      }
      return generateDelegate(generator, expression, frame);
    default:
      return generateDelegate(generator, expression, frame);
  }
};

export const generateEvaluator = (
  expression: Expression,
  environment: Environment,
): Evaluator | undefined => {
  if (!GENERATED_KINDS.has(expression.kind)) return undefined;
  const generator: Generator = { environment, references: [], helpers: [], counter: 0 };
  const frame: Frame = {
    context: "context",
    state: "state",
    next: "next",
    isPrimed: false,
    locals: new Map(),
  };
  const body = generateExpression(generator, expression, frame);
  const referenceNames = generator.references.map((_, index) => `reference${index}`);
  const source = `${generator.helpers.join("\n")}\nreturn (context) => { const state = context.state; const next = context.next; let primed; return ${body}; };`;
  runtime.value ??= createRuntime();
  const helpers = runtime.value;
  const helperNames = Object.keys(helpers);
  const factory = new Function(...helperNames, ...referenceNames, source);
  return factory(...Object.values(helpers), ...generator.references);
};
