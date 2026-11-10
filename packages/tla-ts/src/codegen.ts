import { getChildren, isLocallyResolved, type BoundPattern, type Expression } from "./ast";
import { isRepeatable } from "./dependencies";
import { LITERAL_KINDS } from "./tlc/replay";
import {
  bindValue,
  expectBooleanBody,
  expectImplication,
  isEquivalent,
  negate,
  findGlobalName,
  createConditionError,
  createJunctionError,
  createNoChoiceError,
  expectFilterPredicate,
  getChoiceElements,
  getFunctionBuilder,
  getLazyFilter,
  isKeptLazy,
  getDomainOperator,
  getSubsetOperator,
  getEvaluator,
  getFieldSelector,
  getMissingArgumentDescriber,
  getQuantifierElements,
  isValueArgument,
  keepLazy,
  resolveGlobalOperator,
  expectFunction,
  toKeepLazyContext,
  createUnassignedError,
  getSortedFields,
  hasDuplicateFields,
  type Context,
  type Environment,
  type Evaluator,
} from "./evaluate";
import {
  addBoundedElement,
  applyFunction,
  createEnumeratedSet,
  createNormalizedSet,
  createSortedFunction,
  createSortedRecord,
  createTuple,
  createWrittenRecord,
  getCardinality,
  getFunctionDomain,
  isBeyondSetBound,
  isReducibleSet,
  isTlcInteger,
  toFiniteSet,
  valuesEqual,
  type Value,
} from "./values";

interface Frame {
  context: string;
  state: string;
  next: string;
  isPrimed: boolean;
  locals: Map<string, string>;
  loop: Loop | undefined;
}

interface Loop {
  names: string[];
  hoisted: string[];
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
  "Choose",
  "SetFilter",
  "FunctionConstruction",
]);

const createGeneratedHelpers = () => ({
  implication: expectImplication,
  negate,
  equivalent: isEquivalent,
  body: expectBooleanBody,
  condition: (value: Value, expression: Expression) => {
    if (typeof value !== "boolean") throw createConditionError(expression, value);
    return value;
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
  choiceElements: getChoiceElements,
  noChoice: (expression: Expression & { kind: "Choose" }): never => {
    throw createNoChoiceError(expression);
  },
  filterPredicate: expectFilterPredicate,
  isReducible: isReducibleSet,
  finiteElements: (set: Value) => toFiniteSet(set).elements,
  addBounded: addBoundedElement,
  normalizedSet: createNormalizedSet,
  isBeyondBound: isBeyondSetBound,
  cardinality: getCardinality,
  functionDomain: getFunctionDomain,
  sortedFunction: createSortedFunction,
  unassigned: (name: string, expression: Expression): never => {
    throw createUnassignedError(name, expression);
  },
  prime: (context: Context): Context => ({
    environment: context.environment,
    scope: context.scope,
    state: context.next,
    next: undefined,
    isKeepLazy: context.isKeepLazy,
  }),
  keepLazyContext: toKeepLazyContext,
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

let generatedHelpers: ReturnType<typeof createGeneratedHelpers> | undefined;

let isCodeGenerationAllowed: boolean | undefined;

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

const getDelegateContext = (generator: Generator, expression: Expression, frame: Frame) => {
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
  `${addReference(generator, getEvaluator(expression, generator.environment))}(${getDelegateContext(generator, expression, frame)})`;

const generateHelper = (
  generator: Generator,
  frame: Frame,
  build: (bodyFrame: Frame) => string,
) => {
  const name = `helper${generator.counter++}`;
  const outerLocals = [...frame.locals.values()];
  const bodyFrame: Frame = {
    context: "context",
    state: "state",
    next: "next",
    isPrimed: false,
    locals: new Map(frame.locals),
    loop: undefined,
  };
  const parameters = outerLocals.map((local) => `, ${local}`).join("");
  generator.helpers.push(
    `function ${name}(context, state, next${parameters}) { let primed; let applied; ${build(bodyFrame)} }`,
  );
  return `${name}(${frame.context}, ${frame.state}, ${frame.isPrimed ? "undefined" : frame.next}${parameters})`;
};

const generateLoop = (generator: Generator, list: string, element: string, code: string) => {
  const position = createLocal(generator);
  const low = createLocal(generator);
  const size = createLocal(generator);
  return `for (let ${position} = 0, ${low} = ${list}.low, ${size} = ${low} === undefined ? ${list}.length : ${list}.high - ${low} + 1; ${position} < ${size}; ${position}++) { const ${element} = ${low} === undefined ? ${list}[${position}] : ${low} + ${position}; ${code} }`;
};

const generateQuantifier = (
  generator: Generator,
  expression: Expression & { kind: "Forall" | "Exists" },
  frame: Frame,
) => {
  const isForall = expression.kind === "Forall";
  return generateHelper(generator, frame, (bodyFrame) => {
    const lists = expression.bounds.map(() => createLocal(generator));
    const declarations = expression.bounds.map((bound, index) =>
      index > 0 && expression.bounds[index - 1].set === bound.set
        ? `const ${lists[index]} = ${lists[index - 1]};`
        : `const ${lists[index]} = enumerate(${generateExpression(generator, bound.set, bodyFrame)}, ${addReference(generator, bound.set)}, ${JSON.stringify(generator.environment.runtime.version)});`,
    );
    const elements = expression.bounds.map((bound) => {
      const local = createLocal(generator);
      if (bound.pattern.kind === "Name") bodyFrame.locals.set(bound.pattern.name, local);
      return local;
    });
    const loop = enterLoop(
      bodyFrame,
      expression.bounds.map((bound) => bound.pattern),
    );
    const test = `if (body(${generateExpression(generator, expression.body, bodyFrame)}, ${addReference(generator, expression)}) !== ${isForall}) return ${!isForall};`;
    const loops = elements.reduce(
      (code, element, index) => generateLoop(generator, lists[index], element, code),
      test,
    );
    return `${declarations.join(" ")} ${declareHoisted(loop)} ${loops} return ${isForall};`;
  });
};

const generateChoose = (
  generator: Generator,
  expression: Expression & { kind: "Choose" },
  set: Expression,
  name: string,
  frame: Frame,
) =>
  generateHelper(generator, frame, (bodyFrame) => {
    const list = createLocal(generator);
    const element = createLocal(generator);
    const node = addReference(generator, expression);
    const elements = `choiceElements(${generateExpression(generator, set, bodyFrame)}, ${node}, ${addReference(generator, set)}, ${JSON.stringify(generator.environment.runtime.version)})`;
    bodyFrame.locals.set(name, element);
    const loop = enterLoop(bodyFrame, [expression.pattern]);
    const test = `if (body(${generateExpression(generator, expression.body, bodyFrame)}, ${node})) return ${element};`;
    return `const ${list} = ${elements}; ${declareHoisted(loop)} ${generateLoop(generator, list, element, test)} return noChoice(${node});`;
  });

const generateSetFilter = (
  generator: Generator,
  expression: Expression & { kind: "SetFilter" },
  name: string,
  frame: Frame,
) =>
  generateHelper(generator, frame, (bodyFrame) => {
    const base = createLocal(generator);
    const list = createLocal(generator);
    const kept = createLocal(generator);
    const element = createLocal(generator);
    const node = addReference(generator, expression);
    const filterLazily = addReference(generator, getLazyFilter(expression, generator.environment));
    const lazy = `if (!isReducible(${base})) return ${filterLazily}(${base}, ${getDelegateContext(generator, expression, bodyFrame)});`;
    const set = generateExpression(generator, expression.bound.set, bodyFrame);
    bodyFrame.locals.set(name, element);
    const loop = enterLoop(bodyFrame, [expression.bound.pattern]);
    const test = `if (filterPredicate(${generateExpression(generator, expression.predicate, bodyFrame)}, ${node})) addBounded(${kept}, ${element});`;
    return `const ${base} = ${set}; ${lazy} const ${list} = ${base}.kind === "Interval" ? ${base} : finiteElements(${base}); const ${kept} = []; ${declareHoisted(loop)} ${generateLoop(generator, list, element, test)} return normalizedSet(${kept});`;
  });

const generateFunctionConstruction = (
  generator: Generator,
  expression: Expression & { kind: "FunctionConstruction" },
  name: string,
  frame: Frame,
) =>
  generateHelper(generator, frame, (bodyFrame) => {
    const domain = createLocal(generator);
    const isBeyond = createLocal(generator);
    const keys = createLocal(generator);
    const values = createLocal(generator);
    const element = createLocal(generator);
    const value = createLocal(generator);
    const builder = addReference(generator, getFunctionBuilder(expression, generator.environment));
    const builtContext = getDelegateContext(generator, expression, bodyFrame);
    const built = `if (context.isKeepLazy || !isReducible(${domain})) return ${builder}.build(${domain}, ${builtContext});`;
    const set = generateExpression(generator, expression.bounds[0].set, bodyFrame);
    bodyFrame.locals.set(name, element);
    const loop = enterLoop(bodyFrame, [expression.bounds[0].pattern]);
    const store = `const ${value} = ${generateExpression(generator, expression.body, bodyFrame)}; if (!${isBeyond}) ${values}.push(${value});`;
    return `const ${domain} = ${set}; ${built} const ${isBeyond} = isBeyondBound(${domain}); const ${keys} = ${isBeyond} ? ${domain} : functionDomain(${domain}); if (${isBeyond}) cardinality(${domain}); const ${values} = []; ${declareHoisted(loop)} ${generateLoop(generator, keys, element, store)} return ${isBeyond} ? ${builder}.createLazy(${domain}, ${builtContext}) : sortedFunction(${keys}, ${values});`;
  });

const generateApply = (
  generator: Generator,
  expression: Expression & { kind: "Apply" },
  frame: Frame,
) => {
  const args = expression.args;
  if (expression.operator === "=>") {
    const left = generateExpression(generator, args[0], frame);
    const right = generateExpression(generator, args[1], frame);
    const reference = addReference(generator, expression);
    return `(implication(${left}, ${reference}, "P") ? implication(${right}, ${reference}, "Q") : true)`;
  }
  if (expression.operator === "~" && args.length === 1) {
    return `negate(${generateExpression(generator, args[0], frame)}, ${addReference(generator, expression)})`;
  }
  if (expression.operator === "<=>") {
    return `equivalent(${generateExpression(generator, args[0], frame)}, ${generateExpression(generator, args[1], frame)}, ${addReference(generator, expression)})`;
  }
  if (isLocallyResolved(expression)) return generateDelegate(generator, expression, frame);
  const builtin = resolveGlobalOperator(expression.operator, generator.environment);
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
  return generateDelegate(generator, expression, frame);
};

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

const getPatternNames = (pattern: BoundPattern) =>
  pattern.kind === "Name" ? [pattern.name] : pattern.names;

const getBinderNames = (expression: Expression) => {
  switch (expression.kind) {
    case "Forall":
    case "Exists":
    case "SetMap":
    case "FunctionConstruction":
      return expression.bounds.flatMap((bound) => getPatternNames(bound.pattern));
    case "SetFilter":
      return getPatternNames(expression.bound.pattern);
    case "Choose":
      return getPatternNames(expression.pattern);
    case "UnboundedQuantifier":
      return expression.names;
    case "Lambda":
      return expression.params;
    case "Let":
      return expression.definitions.flatMap((definition) => [
        definition.name,
        ...(definition.kind === "Operator"
          ? definition.params.map((param) => param.name)
          : definition.bounds.flatMap((bound) => getPatternNames(bound.pattern))),
      ]);
    default:
      return [];
  }
};

const enterLoop = (frame: Frame, patterns: BoundPattern[]) => {
  const loop: Loop = { names: patterns.flatMap(getPatternNames), hoisted: [] };
  frame.loop = loop;
  return loop;
};

const declareHoisted = (loop: Loop) =>
  loop.hoisted.length === 0 ? "" : `let hoisted, ${loop.hoisted.join(", ")};`;

// An expression the scope binds, such as an operator's parameter, may hold an argument that has an
// effect, so only names bound inside the expression, or to a loop's element, are known to be pure.
const isLoopInvariant = (
  expression: Expression,
  frame: Frame,
  loop: Loop,
  environment: Environment,
) => {
  if (LITERAL_KINDS.has(expression.kind)) return false;
  if (expression.kind === "Identifier" && !isLocallyResolved(expression)) {
    const global = findGlobalName(expression.name, environment);
    if (global?.kind === "Variable" || global?.kind === "Value") return false;
  }
  const references: (Expression & { kind: "Identifier" | "Apply" | "OperatorReference" })[] = [];
  const boundNames = new Set<string>();
  const visit = (node: Expression): boolean => {
    if (node.kind === "Subexpression") return false;
    if (node.kind === "Let" && node.instances !== undefined && node.instances.length > 0) {
      return false;
    }
    getBinderNames(node).forEach((name) => boundNames.add(name));
    if (node.kind === "Identifier" || node.kind === "Apply" || node.kind === "OperatorReference") {
      references.push(node);
    }
    return getChildren(node).every(visit);
  };
  if (!visit(expression)) return false;
  const isKnown = references.every((reference) => {
    const name = reference.kind === "Identifier" ? reference.name : reference.operator;
    if (loop.names.includes(name)) return false;
    if (frame.locals.has(name) || boundNames.has(name)) return true;
    if (reference.kind !== "OperatorReference" && isLocallyResolved(reference)) return false;
    return (
      findGlobalName(name, environment) !== undefined ||
      resolveGlobalOperator(name, environment) !== undefined
    );
  });
  return isKnown && isRepeatable(expression, environment);
};

// A loop evaluates an invariant subexpression when its body first reaches it, so an empty domain or
// a short circuit skips it as before. TLC builds a set or function anew at each evaluation and
// normalizes it in place, so the loop keeps only a primitive value.
const generateExpression = (generator: Generator, expression: Expression, frame: Frame): string => {
  const loop = frame.loop;
  if (loop === undefined || !isLoopInvariant(expression, frame, loop, generator.environment)) {
    return generateNode(generator, expression, frame);
  }
  const local = createLocal(generator);
  loop.hoisted.push(local);
  const code = generateNode(generator, expression, { ...frame, loop: undefined });
  return `(${local} ?? (typeof (hoisted = ${code}) === "object" ? hoisted : (${local} = hoisted)))`;
};

const generateNode = (generator: Generator, expression: Expression, frame: Frame): string => {
  const generate = (node: Expression, nodeFrame = frame) =>
    generateExpression(generator, node, nodeFrame);
  switch (expression.kind) {
    case "Number":
      if (isTlcInteger(expression.value)) return String(expression.value);
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
    case "And":
    case "Or": {
      if (expression.operands.length === 0) return String(expression.kind === "And");
      const node = addReference(generator, expression);
      const operator = expression.kind === "And" ? " && " : " || ";
      return `(${expression.operands.map((operand, index) => `junct(${generate(operand)}, ${node}, ${index})`).join(operator)})`;
    }
    case "If":
      return `(condition(${generate(expression.condition)}, ${addReference(generator, expression)}) ? ${generate(expression.consequent)} : ${generate(expression.alternative)})`;
    case "FunctionApplication": {
      keepLazy(expression.function);
      const keepLazyFrame = { ...frame, context: `keepLazyContext(${frame.context})` };
      const evaluatedFunction = isConstructionFree(
        expression.function,
        frame,
        generator.environment,
      )
        ? generate(expression.function)
        : isReadOnly(expression.function)
          ? generate(expression.function, keepLazyFrame)
          : generateDelegate(generator, expression.function, keepLazyFrame);
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
    case "Tuple":
      return `tuple([${expression.elements.map((element) => generate(element)).join(", ")}])`;
    case "SetEnumeration":
      return `set([${expression.elements.map((element) => generate(element)).join(", ")}])`;
    case "Prime":
      if (frame.isPrimed) return generateDelegate(generator, expression, frame);
      return generate(expression.expression, {
        context: `(primed ??= prime(${frame.context}))`,
        state: frame.next,
        next: "undefined",
        isPrimed: true,
        locals: frame.locals,
        loop: frame.loop,
      });
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
    case "Choose":
      if (expression.set && expression.pattern.kind === "Name") {
        return generateChoose(
          generator,
          expression,
          expression.set,
          expression.pattern.name,
          frame,
        );
      }
      return generateDelegate(generator, expression, frame);
    case "FunctionConstruction": {
      const bound = expression.bounds[0];
      if (
        expression.bounds.length === 1 &&
        bound.pattern.kind === "Name" &&
        !expression.isRecursive &&
        !isKeptLazy(expression)
      ) {
        return generateFunctionConstruction(generator, expression, bound.pattern.name, frame);
      }
      return generateDelegate(generator, expression, frame);
    }
    case "SetFilter":
      if (expression.bound.pattern.kind === "Name") {
        return generateSetFilter(generator, expression, expression.bound.pattern.name, frame);
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
  isCodeGenerationAllowed ??= getIsCodeGenerationAllowed();
  if (!isCodeGenerationAllowed) return undefined;
  const generator: Generator = { environment, references: [], helpers: [], counter: 0 };
  const frame: Frame = {
    context: "context",
    state: "state",
    next: "next",
    isPrimed: false,
    locals: new Map(),
    loop: undefined,
  };
  const body = generateExpression(generator, expression, frame);
  const referenceNames = generator.references.map((_reference, index) => `reference${index}`);
  const source = `${generator.helpers.join("\n")}\nreturn (context) => { const state = context.state; const next = context.next; let primed; let applied; return ${body}; };`;
  generatedHelpers ??= createGeneratedHelpers();
  const factory = new Function(...Object.keys(generatedHelpers), ...referenceNames, source);
  return factory(...Object.values(generatedHelpers), ...generator.references);
};
