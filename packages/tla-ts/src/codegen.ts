import { getChildren, isLocallyResolved, type Expression } from "./ast";
import {
  bindValue,
  compileArgumentBinder,
  evaluateBuiltinArguments,
  evaluateLocalIdentifier,
  expectBoolean,
  findGlobalName,
  forceThunk,
  lookupScope,
  createCaseConditionError,
  createCaseFailureError,
  createConditionError,
  createJunctionError,
  getDomainOperator,
  getSubsetOperator,
  getEvaluator,
  getFieldSelector,
  getLiteralSet,
  getLiteralValue,
  getMissingArgumentDescriber,
  getQuantifierElements,
  isValueArgument,
  keepLazy,
  resolveGlobalOperator,
  expectFunction,
  toKeepLazyContext,
  createPrimeOutsideActionError,
  createUnassignedError,
  getSortedFields,
  hasDuplicateFields,
  type Binding,
  type Context,
  type Environment,
  type Evaluator,
  type GeneratedBody,
} from "./evaluate";
import {
  applyFunction,
  createEnumeratedSet,
  createSortedRecord,
  createTuple,
  createWrittenRecord,
  isTlcInteger,
  valuesEqual,
  type Value,
} from "./values";

interface Frame {
  context: string;
  // The same context for a reader that brings its own scope, which spares building this one.
  scopelessContext: string;
  state: string;
  next: string;
  isPrimed: boolean;
  locals: Map<string, string>;
  // The variable holding the scope's binding of each name the generated function reads. A generated
  // function's scope never changes, as it keeps its own bound variables in JavaScript locals.
  bindings: Map<string, string>;
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
  "Case",
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

const createGeneratedHelpers = () => ({
  bool: expectBoolean,
  condition: (value: Value, expression: Expression) => {
    if (typeof value !== "boolean") throw createConditionError(expression, value);
    return value;
  },
  caseCondition: (value: Value, condition: Expression) => {
    if (typeof value !== "boolean") throw createCaseConditionError(condition, value);
    return value;
  },
  caseFailure: (expression: Expression): never => {
    throw createCaseFailureError(expression);
  },
  junct: (value: Value, expression: Expression & { kind: "And" | "Or" }, index: number) => {
    if (typeof value !== "boolean") throw createJunctionError(expression, index, value);
    return value;
  },
  apply: applyFunction,
  expectFunction,
  tuple: createTuple,
  set: createEnumeratedSet,
  record: createSortedRecord,
  writtenRecord: createWrittenRecord,
  equal: valuesEqual,
  enumerate: getQuantifierElements,
  lookup: lookupScope,
  force: forceThunk,
  readBinding: evaluateLocalIdentifier,
  unassigned: (name: string, expression: Expression): never => {
    throw createUnassignedError(name, expression);
  },
  primeOutsideAction: (expression: Expression): never => {
    throw createPrimeOutsideActionError(expression);
  },
  prime: (context: Context): Context => ({
    environment: context.environment,
    scope: context.scope,
    state: context.next,
    next: undefined,
    isKeepLazy: context.isKeepLazy,
  }),
  keepLazyContext: toKeepLazyContext,
  builtinArgument: (node: Expression, context: Context) =>
    evaluateBuiltinArguments([node], context)[0],
  // The context an operator body's interpreted parts read: its parameters, and none of the caller's.
  enter: (context: Context, names: string[], bindings: Binding[]): Context => ({
    environment: context.environment,
    scope: names.reduce<Context["scope"]>(
      (scope, name, index) => ({ name, binding: bindings[index], parent: scope }),
      undefined,
    ),
    state: context.state,
    next: context.next,
    isKeepLazy: context.isKeepLazy,
  }),
  extend: (context: Context, names: string[], values: Value[]): Context => ({
    environment: context.environment,
    scope: names.reduce(
      (scope, name, index) => bindValue(scope, name, values[index]),
      context.scope,
    ),
    state: context.state,
    next: context.next,
    isKeepLazy: context.isKeepLazy,
  }),
});

const generatedHelpers = {
  value: undefined as ReturnType<typeof createGeneratedHelpers> | undefined,
};

const codeGeneration = { isAllowed: undefined as boolean | undefined };

// Hosts such as Cloudflare Workers, or a page whose CSP lacks 'unsafe-eval', throw an EvalError.
const getIsCodeGenerationAllowed = () => {
  try {
    return Boolean(new Function(""));
  } catch (error) {
    if (error instanceof EvalError) return false;
    throw error;
  }
};

const addReference = (generator: Generator, value: unknown) => {
  generator.references.push(value);
  return `reference${generator.references.length - 1}`;
};

const createLocal = (generator: Generator) => `local${generator.counter++}`;

const getFreeNames = (expression: Expression, names = new Set<string>()) => {
  if (expression.kind === "Identifier") names.add(expression.name);
  if (expression.kind === "Apply") names.add(expression.operator);
  getChildren(expression).forEach((child) => getFreeNames(child, names));
  return names;
};

const getBinding = (generator: Generator, frame: Frame, name: string) => {
  const binding = frame.bindings.get(name) ?? createLocal(generator);
  frame.bindings.set(name, binding);
  return binding;
};

const getBindingDeclarations = (frame: Frame, parameters: string[] = []) =>
  [...frame.bindings]
    .filter(([, binding]) => !parameters.includes(binding))
    .map(
      ([name, binding]) =>
        `const ${binding} = lookup(${frame.context}.scope, ${JSON.stringify(name)});`,
    )
    .join(" ");

// The context that holds the bound variables an interpreted expression reads.
const getCaptureContext = (generator: Generator, expression: Expression, frame: Frame) => {
  const freeNames = getFreeNames(expression);
  const captured = [...frame.locals].filter(([name]) => freeNames.has(name));
  if (captured.length === 0) return frame.context;
  const names = addReference(
    generator,
    captured.map(([name]) => name),
  );
  return `extend(${frame.context}, ${names}, [${captured.map(([, local]) => local).join(", ")}])`;
};

const generateDelegate = (generator: Generator, expression: Expression, frame: Frame) =>
  `${addReference(generator, getEvaluator(expression, generator.environment))}(${getCaptureContext(generator, expression, frame)})`;

// An argument the callee reads as a plain value, which evaluating it early can't tell apart.
const getValueArgument = (generator: Generator, argument: Expression, frame: Frame) => {
  if (argument.kind === "String") return JSON.stringify(argument.value);
  if (argument.kind === "Number" && isTlcInteger(argument.value)) return String(argument.value);
  if (argument.kind !== "Identifier") return undefined;
  const local = frame.locals.get(argument.name);
  if (local) return local;
  if (isLocallyResolved(argument)) return undefined;
  const global = findGlobalName(argument.name, generator.environment);
  return global?.kind === "Value" ? addReference(generator, global.value) : undefined;
};

const createGenerator = (environment: Environment): Generator => ({
  environment,
  references: [],
  helpers: [],
  counter: 0,
});

const compileGenerated = (generator: Generator, source: string) => {
  const referenceNames = generator.references.map((_, index) => `reference${index}`);
  generatedHelpers.value ??= createGeneratedHelpers();
  const helpers = generatedHelpers.value;
  const factory = new Function(
    ...Object.keys(helpers),
    ...referenceNames,
    `${generator.helpers.join("\n")}\n${source}`,
  );
  return factory(...Object.values(helpers), ...generator.references);
};

// An operator's body as one generated function of the bindings the interpreter would make, shared
// by its callers. As in the interpreter, the body compiles when it's first called: a huge spec
// reaches far more than it runs, and a recursive body calls itself. The scope and the context that
// the interpreter makes for each call exist only if the body delegates.
const getGeneratedBody = (
  environment: Environment,
  body: Expression,
  params: { name: string }[],
  isValueParam: boolean[],
) => {
  const shapes = environment.generatedBodies.get(body) ?? new Map<string, GeneratedBody>();
  environment.generatedBodies.set(body, shapes);
  const key = isValueParam.map((isValue) => (isValue ? "v" : "b")).join("");
  const existing = shapes.get(key);
  if (existing) return existing;
  const generated: GeneratedBody = {
    evaluate: undefined,
    compile: () => {
      const generator = createGenerator(environment);
      const parameters = params.map(() => createLocal(generator));
      const bindingParams = params.flatMap((param, index) =>
        isValueParam[index] ? [] : [{ name: param.name, local: parameters[index] }],
      );
      const names = addReference(
        generator,
        bindingParams.map((param) => param.name),
      );
      const frame: Frame = {
        context: `(scoped ??= enter(context, ${names}, [${bindingParams.map((param) => param.local).join(", ")}]))`,
        scopelessContext: "context",
        state: "state",
        next: "next",
        isPrimed: false,
        locals: new Map(
          params.flatMap((param, index) =>
            isValueParam[index] ? [[param.name, parameters[index]] as const] : [],
          ),
        ),
        bindings: new Map(bindingParams.map((param) => [param.name, param.local])),
      };
      const code = generateExpression(generator, body, frame);
      const evaluate = compileGenerated(
        generator,
        `return function (${["context", "state", "next", ...parameters].join(", ")}) { let primed; let applied; let scoped; ${getBindingDeclarations(frame, parameters)} return ${code}; };`,
      );
      generated.evaluate = evaluate;
      return evaluate;
    },
  };
  shapes.set(key, generated);
  return generated;
};

const generateBodyCall = (
  generator: Generator,
  body: Expression,
  params: { name: string }[],
  args: Expression[],
  frame: Frame,
) => {
  const values = args.map((arg) => getValueArgument(generator, arg, frame));
  const argumentCode = args.map((arg, index) => {
    if (values[index] !== undefined) return values[index];
    const binder = `${addReference(generator, compileArgumentBinder(arg, generator.environment))}(${getCaptureContext(generator, arg, frame)})`;
    if (arg.kind !== "Identifier" || !isLocallyResolved(arg)) return binder;
    // A parameter passed on keeps its binding, so the body needs no scope to find it in.
    const binding = getBinding(generator, frame, arg.name);
    return `(${binding}?.kind === "Value" || ${binding}?.kind === "Thunk" ? ${binding} : ${binder})`;
  });
  const generated = addReference(
    generator,
    getGeneratedBody(
      generator.environment,
      body,
      params,
      values.map((value) => value !== undefined),
    ),
  );
  return `(${generated}.evaluate ?? ${generated}.compile())(${[frame.scopelessContext, frame.state, frame.isPrimed ? "undefined" : frame.next, ...argumentCode].join(", ")})`;
};

const generateQuantifier = (
  generator: Generator,
  expression: Expression & { kind: "Forall" | "Exists" },
  frame: Frame,
) => {
  const isForall = expression.kind === "Forall";
  const description = JSON.stringify(isForall ? "the body of \\A" : "the body of \\E");
  const name = `quantifier${generator.counter++}`;
  const outerLocals = [...frame.locals.values()];
  const bodyFrame = {
    context: "context",
    scopelessContext: "context",
    state: "state",
    next: "next",
    isPrimed: false,
    locals: new Map(frame.locals),
    bindings: new Map<string, string>(),
  };
  const lists = expression.bounds.map(() => createLocal(generator));
  const declarations = expression.bounds.map(
    (bound, index) =>
      `const ${lists[index]} = enumerate(${generateExpression(generator, bound.set, bodyFrame)}, ${addReference(generator, bound.set)}, ${JSON.stringify(generator.environment.runtime.version)});`,
  );
  const elements = expression.bounds.map((bound) => {
    const local = createLocal(generator);
    if (bound.pattern.kind === "Name") bodyFrame.locals.set(bound.pattern.name, local);
    return local;
  });
  const test = `if (bool(${generateExpression(generator, expression.body, bodyFrame)}, ${description}) !== ${isForall}) return ${!isForall};`;
  // enumerate returns an array, or an interval, which has a low end, to step through.
  const loops = elements.reduce((code, element, index) => {
    const position = createLocal(generator);
    const low = createLocal(generator);
    const size = createLocal(generator);
    const list = lists[index];
    return `for (let ${position} = 0, ${low} = ${list}.low, ${size} = ${low} === undefined ? ${list}.length : ${list}.high - ${low} + 1; ${position} < ${size}; ${position}++) { const ${element} = ${low} === undefined ? ${list}[${position}] : ${low} + ${position}; ${code} }`;
  }, test);
  const parameters = outerLocals.map((local) => `, ${local}`).join("");
  generator.helpers.push(
    `function ${name}(context, state, next${parameters}) { let primed; let applied; ${getBindingDeclarations(bodyFrame)} ${declarations.join(" ")} ${loops} return ${isForall}; }`,
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
  if (
    builtin?.kind === "Closure" &&
    builtin.scope === undefined &&
    args.length === builtin.params.length &&
    builtin.params.every((param) => param.arity === 0) &&
    args.every((arg) => isValueArgument(arg, generator.environment))
  ) {
    return generateBodyCall(generator, builtin.body, builtin.params, args, frame);
  }
  if (builtin?.kind !== "Builtin") return generateDelegate(generator, expression, frame);
  if (builtin.name === "DOMAIN") {
    const domain = addReference(generator, getDomainOperator(expression));
    return `${domain}(${generateExpression(generator, args[0], frame)})`;
  }
  if (builtin.name === "TLCEval") return generateDelegate(generator, expression, frame);
  if (builtin.name === "\\subseteq" && args.length === 2) {
    const subset = addReference(generator, getSubsetOperator(expression, builtin));
    return `${subset}(${generateExpression(generator, args[0], frame)}, ${generateExpression(generator, args[1], frame)})`;
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
  if (!builtin.isLazy && args.every((arg) => isValueArgument(arg, environment))) {
    const generated = args.map((arg) => generateBuiltinArgument(generator, arg, frame));
    return `${addReference(generator, builtin)}.evaluate([${generated.join(", ")}], ${frame.context})`;
  }
  return generateDelegate(generator, expression, frame);
};

// A name bound by a parameter may stand for an operator, which a builtin takes as an operator.
const generateBuiltinArgument = (generator: Generator, argument: Expression, frame: Frame) => {
  if (
    argument.kind !== "Identifier" ||
    frame.locals.has(argument.name) ||
    !isLocallyResolved(argument)
  ) {
    return generateExpression(generator, argument, frame);
  }
  const binding = getBinding(generator, frame, argument.name);
  return `(${binding}?.kind === "Value" ? ${binding}.value : ${binding}?.kind === "Thunk" ? force(${binding}, ${frame.scopelessContext}) : builtinArgument(${addReference(generator, argument)}, ${frame.context}))`;
};

// Whether an expression only reads values, so that it constructs no function whatever the control.
const isConstructionFree = (
  expression: Expression,
  frame: Frame,
  environment: Environment,
): boolean => {
  switch (expression.kind) {
    case "Identifier": {
      if (frame.locals.has(expression.name)) return true;
      if (isLocallyResolved(expression)) return false;
      const global = findGlobalName(expression.name, environment);
      return global?.kind === "Variable" || global?.kind === "Value";
    }
    case "Prime":
      return isConstructionFree(expression.expression, frame, environment);
    case "FieldAccess":
      return isConstructionFree(expression.record, frame, environment);
    case "FunctionApplication":
      return [expression.function, ...expression.args].every((child) =>
        isConstructionFree(child, frame, environment),
      );
    default:
      return false;
  }
};

// Whether the generated code evaluates an expression only in the context its frame names. A primed
// expression doesn't, since it shares the generated function's primed context.
const isReadOnly = (expression: Expression): boolean => {
  switch (expression.kind) {
    case "Identifier":
    case "Number":
    case "String":
      return true;
    case "FieldAccess":
      return isReadOnly(expression.record);
    case "FunctionApplication":
      return [expression.function, ...expression.args].every(isReadOnly);
    default:
      return false;
  }
};

const generateExpression = (generator: Generator, expression: Expression, frame: Frame): string => {
  const generate = (node: Expression, nodeFrame = frame) =>
    generateExpression(generator, node, nodeFrame);
  switch (expression.kind) {
    case "Number":
      if (isTlcInteger(expression.value)) {
        return String(expression.value);
      }
      return generateDelegate(generator, expression, frame);
    case "String":
      return JSON.stringify(expression.value);
    case "Identifier": {
      const local = frame.locals.get(expression.name);
      if (local) return local;
      if (isLocallyResolved(expression)) {
        const name = JSON.stringify(expression.name);
        const binding = getBinding(generator, frame, expression.name);
        return `(${binding}?.kind === "Value" ? ${binding}.value : ${binding}?.kind === "Thunk" ? force(${binding}, ${frame.scopelessContext}) : readBinding(${name}, ${addReference(generator, expression)}, ${frame.context}))`;
      }
      const global = findGlobalName(expression.name, generator.environment);
      if (global?.kind === "Variable") {
        const name = JSON.stringify(expression.name);
        const node = addReference(generator, expression);
        return `(${frame.state}?.[${global.index}] ?? unassigned(${name}, ${node}))`;
      }
      if (global?.kind === "Value") return addReference(generator, global.value);
      if (
        global?.kind === "Definition" &&
        global.definition.kind === "Operator" &&
        global.definition.params.length === 0
      ) {
        const environment = generator.environment;
        const id = environment.facts.ids.get(global.definition);
        const call = generateBodyCall(generator, global.definition.body, [], [], frame);
        return id === undefined
          ? call
          : `(${addReference(generator, environment.startupValues)}[${id}] ?? ${call})`;
      }
      return generateDelegate(generator, expression, frame);
    }
    case "Apply":
      return generateApply(generator, expression, frame);
    case "And":
    case "Or": {
      const node = addReference(generator, expression);
      const operator = expression.kind === "And" ? " && " : " || ";
      return `(${expression.operands.map((operand, index) => `junct(${generate(operand)}, ${node}, ${index})`).join(operator)})`;
    }
    case "If":
      return `(condition(${generate(expression.condition)}, ${addReference(generator, expression)}) ? ${generate(expression.consequent)} : ${generate(expression.alternative)})`;
    case "Case": {
      const arms = expression.arms.map(
        (arm) =>
          `caseCondition(${generate(arm.condition)}, ${addReference(generator, arm.condition)}) ? ${generate(arm.body)} : `,
      );
      const other = expression.other
        ? generate(expression.other)
        : `caseFailure(${addReference(generator, expression)})`;
      return `(${arms.join("")}${other})`;
    }
    case "FunctionApplication": {
      keepLazy(expression.function);
      // The interpreter evaluates a function that may construct one with EvalControl.KeepLazy.
      const keepLazyFrame = {
        ...frame,
        context: `keepLazyContext(${frame.context})`,
        scopelessContext: `keepLazyContext(${frame.scopelessContext})`,
      };
      const evaluatedFunction = isConstructionFree(
        expression.function,
        frame,
        generator.environment,
      )
        ? generate(expression.function)
        : isReadOnly(expression.function)
          ? generate(expression.function, keepLazyFrame)
          : generateDelegate(generator, expression.function, keepLazyFrame);
      // Tool#evalAppl checks that it applies a function before it evaluates the argument. The check
      // is written out, as calling expectFunction for each application costs more.
      const functionCode = `(applied = ${evaluatedFunction}, typeof applied === "object" && (applied.kind === "Function" || applied.kind === "LazyFunction") ? applied : expectFunction(applied, ${addReference(generator, expression)}))`;
      const describeMissing = getMissingArgumentDescriber(generator.environment.runtime.version);
      const error = describeMissing ? `, ${addReference(generator, describeMissing)}` : "";
      if (expression.args.length === 1)
        return `apply(${functionCode}, ${generate(expression.args[0])}${error})`;
      return `apply(${functionCode}, tuple([${expression.args.map((arg) => generate(arg)).join(", ")}])${error})`;
    }
    case "FieldAccess":
      return `${addReference(generator, getFieldSelector(expression))}(${generate(expression.record)})`;
    case "Record": {
      const literal = getLiteralValue(expression);
      if (literal !== undefined) return addReference(generator, literal);
      const fields = getSortedFields(expression.fields);
      if (hasDuplicateFields(fields)) return generateDelegate(generator, expression, frame);
      const names = addReference(
        generator,
        fields.map((field) => field.name),
      );
      const values = `[${fields.map((field) => generate(field.value)).join(", ")}]`;
      const writtenNames = expression.fields.map((field) => field.name);
      if (writtenNames.every((name, index) => name === fields[index].name)) {
        return `record(${names}, ${values})`;
      }
      return `writtenRecord(${names}, ${values}, ${addReference(generator, writtenNames)})`;
    }
    case "Tuple": {
      const literal = getLiteralValue(expression);
      if (literal !== undefined) return addReference(generator, literal);
      return `tuple([${expression.elements.map((element) => generate(element)).join(", ")}])`;
    }
    case "SetEnumeration": {
      const literalSet = getLiteralSet(expression);
      if (literalSet) return addReference(generator, literalSet);
      return `set([${expression.elements.map((element) => generate(element)).join(", ")}])`;
    }
    case "Prime": {
      const node = addReference(generator, expression);
      if (frame.isPrimed) return `primeOutsideAction(${node})`;
      const primedContext = `(primed ??= prime(${frame.context}))`;
      const primed = {
        context: primedContext,
        scopelessContext: primedContext,
        state: frame.next,
        next: "undefined",
        isPrimed: true,
        locals: frame.locals,
        bindings: frame.bindings,
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
  codeGeneration.isAllowed ??= getIsCodeGenerationAllowed();
  if (!codeGeneration.isAllowed) return undefined;
  const generator = createGenerator(environment);
  const frame: Frame = {
    context: "context",
    scopelessContext: "context",
    state: "state",
    next: "next",
    isPrimed: false,
    locals: new Map(),
    bindings: new Map(),
  };
  const body = generateExpression(generator, expression, frame);
  return compileGenerated(
    generator,
    `return (context) => { const state = context.state; const next = context.next; let primed; let applied; ${getBindingDeclarations(frame)} return ${body}; };`,
  );
};
