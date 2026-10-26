import type {
  Bound,
  BoundPattern,
  Definition,
  Expression,
  Instance,
  Module,
  OperatorParam,
  Selector,
  SourceLocation,
} from "./ast";
import { TlaSyntaxError } from "./errors";
import { getChildren } from "./evaluate";
import { mapChildren, mapDefinition } from "./instances";

type Lookup = (name: string) => Definition | undefined;

interface FoundLabel {
  label: Expression & { kind: "Label" };
  lets: Definition[][];
}

interface Selection {
  params: OperatorParam[];
  args: Expression[];
  lets: Definition[][];
  location: SourceLocation;
}

const LOCAL_RESOLUTION = { kind: "Local" } as const;

const SELECTION_NAME = "$subexpression";

const describeLocation = (location: SourceLocation) =>
  `line ${location.line}, column ${location.column}`;

const createError = (message: string, location: SourceLocation) =>
  new TlaSyntaxError(`${message} at ${describeLocation(location)}`);

const getPatternNames = (pattern: BoundPattern) =>
  pattern.kind === "Name" ? [pattern.name] : pattern.names;

const getBoundNames = (bounds: Bound[]) =>
  bounds.flatMap((bound) => getPatternNames(bound.pattern));

const getBoundSets = (bounds: Bound[]) =>
  bounds
    .filter((bound, index) => index === 0 || bounds[index - 1].set !== bound.set)
    .map((bound) => bound.set);

const getOperandIndex = (operand: number | "<<" | ">>", count: number) => {
  if (typeof operand === "number") return operand >= 1 && operand <= count ? operand - 1 : -1;
  if (operand === "<<") return count > 0 ? 0 : -1;
  return count === 2 ? 1 : -1;
};

const getOperands = (expression: Expression): Expression[] | undefined => {
  switch (expression.kind) {
    case "Apply":
      return expression.args;
    case "And":
    case "Or":
      return expression.operands;
    case "If":
      return [expression.condition, expression.consequent, expression.alternative];
    case "Tuple":
    case "SetEnumeration":
      return expression.elements;
    case "Record":
    case "RecordSet":
      return expression.fields.map((field) => field.value);
    case "FunctionApplication":
      return [
        expression.function,
        expression.args.length === 1
          ? expression.args[0]
          : { kind: "Tuple", elements: expression.args, location: expression.location },
      ];
    case "FieldAccess":
      return [
        expression.record,
        { kind: "String", value: expression.field, location: expression.location },
      ];
    case "Prime":
    case "Unchanged":
    case "Enabled":
    case "Always":
    case "Eventually":
      return [expression.expression];
    case "BoxAction":
    case "AngleAction":
      return [expression.action, expression.subscript];
    case "WeakFairness":
    case "StrongFairness":
      return [expression.subscript, expression.action];
    case "FunctionSet":
      return [expression.domain, expression.range];
    case "Product":
      return expression.factors;
    case "Except":
      return [expression.function];
    default:
      return undefined;
  }
};

const getBinder = (
  expression: Expression,
): { names: string[]; body: Expression; sets: Expression[] } | undefined => {
  switch (expression.kind) {
    case "Forall":
    case "Exists":
    case "FunctionConstruction":
      return {
        names: getBoundNames(expression.bounds),
        body: expression.body,
        sets: getBoundSets(expression.bounds),
      };
    case "SetMap":
      return {
        names: getBoundNames(expression.bounds),
        body: expression.expression,
        sets: getBoundSets(expression.bounds),
      };
    case "SetFilter":
      return {
        names: getPatternNames(expression.bound.pattern),
        body: expression.predicate,
        sets: [expression.bound.set],
      };
    case "Choose":
      return {
        names: getPatternNames(expression.pattern),
        body: expression.body,
        sets: expression.set ? [expression.set] : [],
      };
    case "UnboundedQuantifier":
    case "Lambda":
      return {
        names: expression.kind === "Lambda" ? expression.params : expression.names,
        body: expression.body,
        sets: [],
      };
    default:
      return undefined;
  }
};

const findLabel = (
  expression: Expression,
  name: string,
  lets: Definition[][],
): FoundLabel | undefined => {
  if (expression.kind === "Label") {
    return expression.name === name ? { label: expression, lets } : undefined;
  }
  if (expression.kind === "Let")
    return findLabel(expression.body, name, [...lets, expression.definitions]);
  if (expression.kind === "Lambda") return undefined;
  for (const child of getChildren(expression)) {
    const found = findLabel(child, name, lets);
    if (found) return found;
  }
  return undefined;
};

const takeArguments = (
  selector: Selector & { kind: "Name" | "Bound" },
  count: number,
  pool: Expression[],
) => (selector.args.length === 0 && pool.length > 0 ? pool.splice(0, count) : selector.args);

const wrapLets = (body: Expression, lets: Definition[][], location: SourceLocation) =>
  lets.reduceRight<Expression>(
    (inner, definitions) => ({ kind: "Let", definitions, body: inner, location }),
    body,
  );

const createApplication = (selection: Selection, body: Expression): Expression => {
  const location = selection.location;
  const wrapped = wrapLets(body, selection.lets, location);
  if (selection.params.length === 0) return wrapped;
  if (selection.args.length === 0) {
    if (selection.params.some((param) => param.arity > 0)) {
      throw createError("Selected an operator with operator parameters as an argument", location);
    }
    return {
      kind: "Lambda",
      params: selection.params.map((param) => param.name),
      body: wrapped,
      location,
    };
  }
  if (selection.args.length !== selection.params.length) {
    throw createError(
      `The subexpression requires ${selection.params.length} arguments but received ${selection.args.length}`,
      location,
    );
  }
  return {
    kind: "Let",
    definitions: [
      {
        kind: "Operator",
        name: SELECTION_NAME,
        params: selection.params,
        body: wrapped,
        isLocal: true,
        isRecursive: false,
        location,
      },
    ],
    body: {
      kind: "Apply",
      operator: SELECTION_NAME,
      args: selection.args,
      location,
      resolution: LOCAL_RESOLUTION,
    },
    location,
  };
};

const applyDefinition = (definition: Definition, selection: Selection): Expression => {
  const location = selection.location;
  const params =
    definition.kind === "Operator"
      ? definition.params.map((param, index) => ({
          name: `${param.name}$${selection.params.length + index}`,
          arity: param.arity,
        }))
      : [];
  const args: Expression[] = params.map((param) => ({
    kind: "Identifier",
    name: param.name,
    location,
    resolution: LOCAL_RESOLUTION,
  }));
  const reference: Expression =
    args.length === 0
      ? { kind: "Identifier", name: definition.name, location, resolution: LOCAL_RESOLUTION }
      : {
          kind: "Apply",
          operator: definition.name,
          args,
          location,
          resolution: LOCAL_RESOLUTION,
        };
  return createApplication({ ...selection, params: [...selection.params, ...params] }, reference);
};

const selectSubexpression = (
  selectors: Selector[],
  lookup: Lookup,
  location: SourceLocation,
  pool: Expression[],
): Expression => {
  const selection: Selection = { params: [], args: [], lets: [], location };
  const state = { index: 0, current: undefined as Expression | undefined };

  const findDefinition = (local: Definition[] | undefined) => {
    const names: string[] = [];
    const args: Expression[] = [];
    while (state.index < selectors.length) {
      const selector = selectors[state.index];
      if (selector.kind !== "Name") throw createError("Expected an operator name", location);
      names.push(selector.name);
      args.push(...selector.args);
      const name = names.join("!");
      const definition = local ? local.find((candidate) => candidate.name === name) : lookup(name);
      if (definition) {
        const arity = definition.kind === "Operator" ? definition.params.length : 0;
        const given = args.length === 0 && pool.length > 0 ? pool.splice(0, arity) : args;
        return { definition, args: given };
      }
      state.index++;
    }
    throw createError(`Unknown operator ${names.join("!")}`, location);
  };

  const enterDefinition = (local: Definition[] | undefined) => {
    const found = findDefinition(local);
    const definition = found.definition;
    const arity = definition.kind === "Operator" ? definition.params.length : 0;
    const isLast = state.index === selectors.length - 1;
    if (found.args.length !== arity && found.args.length !== 0) {
      throw createError(`The operator ${definition.name} requires ${arity} arguments`, location);
    }
    if (isLast) return { definition, args: found.args };
    if (definition.kind !== "Operator") {
      throw createError(`Cannot select a subexpression of ${definition.name}`, location);
    }
    selection.params.push(...definition.params);
    selection.args.push(...found.args);
    state.current = definition.body;
    state.index++;
    return undefined;
  };

  const followLabels = () => {
    while (state.index < selectors.length && selectors[state.index].kind === "Name") {
      const selector = selectors[state.index] as Selector & { kind: "Name" };
      const found = state.current && findLabel(state.current, selector.name, []);
      if (!found) throw createError(`Cannot find label ${selector.name}`, location);
      selection.lets.push(...found.lets);
      selection.params.push(...found.label.params.map((name) => ({ name, arity: 0 })));
      selection.args.push(...takeArguments(selector, found.label.params.length, pool));
      state.current = found.label.body;
      state.index++;
    }
  };

  const selectOperand = (selector: Selector) => {
    const current = state.current;
    if (!current) throw createError("Subexpression selection failed", location);
    if (selector.kind === "Colon") return;
    if (current.kind === "Label") {
      state.current = current.body;
      selectOperand(selector);
      return;
    }
    if (current.kind === "Let") {
      if (selector.kind !== "Operand" || getOperandIndex(selector.operand, 1) !== 0) {
        throw createError("A LET/IN expression has only one operand", location);
      }
      selection.lets.push(current.definitions);
      state.current = current.body;
      return;
    }
    const binder = getBinder(current);
    if (binder && (selector.kind === "Bound" || selector.kind === "At")) {
      selection.params.push(...binder.names.map((name) => ({ name, arity: 0 })));
      if (selector.kind === "Bound") {
        selection.args.push(...takeArguments(selector, binder.names.length, pool));
      }
      state.current = binder.body;
      return;
    }
    if (current.kind === "Case" && selector.kind === "Operand") {
      const arms = [
        ...current.arms,
        ...(current.other ? [{ condition: undefined, body: current.other }] : []),
      ];
      const arm = arms[getOperandIndex(selector.operand, arms.length)];
      const next = selectors[state.index + 1];
      if (!arm || next?.kind !== "Operand") {
        throw createError("A subexpression of CASE must have the form !i!j", location);
      }
      state.index++;
      const part = getOperandIndex(next.operand, 2);
      const chosen = part === 0 ? arm.condition : part === 1 ? arm.body : undefined;
      if (!chosen) throw createError("Nonexistent CASE operand", location);
      state.current = chosen;
      return;
    }
    if (selector.kind !== "Operand")
      throw createError("Unexpected subexpression selector", location);
    const operands = binder ? binder.sets : getOperands(current);
    const operand = operands?.[getOperandIndex(selector.operand, operands.length)];
    if (!operand) throw createError("Nonexistent operand specified by the selector", location);
    state.current = operand;
  };

  const first = enterDefinition(undefined);
  if (first) return applyDefinition(first.definition, { ...selection, args: first.args });
  followLabels();
  while (state.index < selectors.length) {
    const selector = selectors[state.index];
    if (selector.kind === "Name") {
      while (state.current?.kind === "Label") state.current = state.current.body;
      if (state.current?.kind !== "Let") {
        throw createError("A name selector here must be from a LET clause", location);
      }
      selection.lets.push(state.current.definitions);
      const definitions = state.current.definitions;
      const last = enterDefinition(definitions);
      if (last) {
        return applyDefinition(last.definition, {
          ...selection,
          args: [...selection.args, ...last.args],
        });
      }
      followLabels();
      continue;
    }
    selectOperand(selector);
    state.index++;
  }
  if (!state.current) throw createError("Subexpression selection failed", location);
  return createApplication(selection, state.current);
};

const getQualifiedSelectors = (name: string, lookup: Lookup): Selector[] | undefined => {
  if (!name.includes("!") || lookup(name)) return undefined;
  const parts = name.split("!");
  const prefix = parts.findIndex((_, index) => lookup(parts.slice(0, index + 1).join("!")));
  if (prefix === -1) return undefined;
  return [
    { kind: "Name", name: parts.slice(0, prefix + 1).join("!"), args: [] },
    ...parts.slice(prefix + 1).map((part): Selector => ({ kind: "Name", name: part, args: [] })),
  ];
};

const containsReference = (expression: Expression): boolean =>
  expression.kind === "Subexpression" ||
  (expression.kind === "Identifier" && expression.name.includes("!")) ||
  (expression.kind === "Apply" && expression.operator.includes("!")) ||
  getChildren(expression).some(containsReference);

export const resolveSubexpressions = (expression: Expression, lookup: Lookup): Expression => {
  if (!containsReference(expression)) return expression;
  if (expression.kind === "Let") {
    const local: Lookup = (name: string) =>
      expression.definitions.find((definition) => definition.name === name) ?? lookup(name);
    return mapChildren(expression, (child) => resolveSubexpressions(child, local));
  }
  const mapped = mapChildren(expression, (child) => resolveSubexpressions(child, lookup));
  if (mapped.kind === "Subexpression") {
    return selectSubexpression(mapped.selectors, lookup, mapped.location, []);
  }
  const name =
    mapped.kind === "Identifier" ? mapped.name : mapped.kind === "Apply" ? mapped.operator : "";
  const selectors = getQualifiedSelectors(name, lookup);
  if (!selectors) return mapped;
  const pool = mapped.kind === "Apply" ? [...mapped.args] : [];
  const resolved = selectSubexpression(selectors, lookup, mapped.location, pool);
  if (pool.length > 0) throw createError(`Too many arguments for ${name}`, mapped.location);
  return resolved;
};

const createLookup = (definitions: Definition[]): Lookup => {
  const byName = new Map(definitions.map((definition) => [definition.name, definition]));
  return (name) => byName.get(name);
};

export const resolveInstanceSubexpressions = (instance: Instance, module: Module): Instance => {
  const lookup = createLookup(module.definitions);
  return {
    ...instance,
    substitutions: instance.substitutions.map((substitution) => ({
      name: substitution.name,
      expression: resolveSubexpressions(substitution.expression, lookup),
    })),
  };
};

export const resolveModuleSubexpressions = (module: Module, available: Definition[]): Module => {
  const lookup = createLookup([...available, ...module.definitions]);
  const isResolved =
    module.definitions.some((definition) => containsReference(definition.body)) ||
    module.assumptions.some((assumption) => containsReference(assumption.expression));
  if (!isResolved) return module;
  return {
    ...module,
    definitions: module.definitions.map((definition) =>
      mapDefinition(definition, (child) => resolveSubexpressions(child, lookup)),
    ),
    assumptions: module.assumptions.map((assumption) => ({
      ...assumption,
      expression: resolveSubexpressions(assumption.expression, lookup),
    })),
  };
};
