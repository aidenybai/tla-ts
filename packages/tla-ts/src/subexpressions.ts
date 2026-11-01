import {
  getChildren,
  type Definition,
  type Expression,
  type Instance,
  type Module,
  type OperatorParam,
  type Selector,
  type SourceLocation,
  type SourceRange,
} from "./ast";
import { formatRange, TlaSyntaxError } from "./errors";
import { getSourceName, mapChildren, mapDefinition } from "./instances";
import {
  getArity,
  getBinder,
  getNameSelectors,
  getOperandIndex,
  getOperands,
  LOCAL_RESOLUTION,
  selectionErrors,
  selections,
} from "./resolve";

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

// A name that selects a subexpression, with the range of each part and of the arguments of each
// part, where SANY reports an error in selecting that part.
interface SelectingName {
  location: SourceLocation;
  selectorRanges?: SourceRange[];
  argumentRanges?: (SourceRange | undefined)[];
}

const SELECTION_NAME = "$subexpression";

const createError = (message: string, location: SourceLocation) =>
  new TlaSyntaxError(`${message} at line ${location.line}, column ${location.column}`);

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

const applyDefinition = (definition: Definition, selection: Selection) => {
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

// Generator.selectorToNode reports the first part of a name that selects nothing, after it analyzes
// the arguments of the parts before, and goes on after the name. An operator or a label must be given
// all its arguments, except in a name that an operator argument may select whole.
const selectSubexpression = (
  selectors: Selector[],
  lookup: Lookup,
  reference: Expression & SelectingName,
  isOperator: boolean,
): Expression => {
  const location = reference.location;
  const selection: Selection = { params: [], args: [], lets: [], location };
  const state = { index: 0, current: undefined as Expression | undefined, isFailed: false };

  const report = (range: SourceRange | undefined, message: string) => {
    if (!range) throw createError(message, location);
    selectionErrors.set(reference, {
      args: selectors
        .slice(0, state.index)
        .flatMap((selector) => ("args" in selector ? selector.args : [])),
      error: { location: formatRange(range), message },
    });
    state.isFailed = true;
    return undefined;
  };

  const findDefinition = (local: Definition[] | undefined) => {
    const names: string[] = [];
    const args: Expression[] = [];
    while (state.index < selectors.length) {
      const selector = selectors[state.index];
      if (selector.kind !== "Name") throw createError("Expected an operator name", location);
      names.push(selector.name);
      args.push(...selector.args);
      const name = names.join("!");
      const definition = local
        ? local.find((candidate) => getSourceName(candidate) === name)
        : lookup(name);
      if (definition)
        return { definition, name, args, earlier: args.length - selector.args.length };
      state.index++;
    }
    throw createError(`Unknown operator ${names.join("!")}`, location);
  };

  const enterDefinition = (local: Definition[] | undefined) => {
    const found = findDefinition(local);
    const definition = found.definition;
    const arity = getArity(definition);
    const isLast = state.index === selectors.length - 1;
    if (found.args.length !== arity && (!isOperator || found.args.length !== 0)) {
      return report(
        reference.argumentRanges?.[state.index] ?? location.range,
        `The operator ${found.name} requires ${arity - found.earlier} arguments.`,
      );
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
    while (state.index < selectors.length && !state.isFailed) {
      const selector = selectors[state.index];
      if (selector.kind !== "Name") return;
      const range = reference.selectorRanges?.[state.index];
      const found = state.current && findLabel(state.current, selector.name, []);
      if (!found) return report(range, `Cannot find label \`${selector.name}'.`);
      const params = found.label.params;
      if (!isOperator && selector.args.length !== params.length) {
        return report(range, `Label \`${selector.name}' used with wrong number of arguments.`);
      }
      selection.lets.push(...found.lets);
      selection.params.push(...params.map((name) => ({ name, arity: 0 })));
      selection.args.push(...selector.args);
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
      if (selector.kind === "Bound") selection.args.push(...selector.args);
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
  if (state.isFailed) return reference;
  if (first) return applyDefinition(first.definition, { ...selection, args: first.args });
  followLabels();
  while (state.index < selectors.length && !state.isFailed) {
    const selector = selectors[state.index];
    if (selector.kind === "Name") {
      while (state.current?.kind === "Label") state.current = state.current.body;
      if (state.current?.kind !== "Let") {
        throw createError("A name selector here must be from a LET clause", location);
      }
      selection.lets.push(state.current.definitions);
      const last = enterDefinition(state.current.definitions);
      if (state.isFailed) return reference;
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
  if (state.isFailed) return reference;
  if (!state.current) throw createError("Subexpression selection failed", location);
  return createApplication(selection, state.current);
};

// A name such as Op(1)!lab(2) whose first parts name a definition selects part of it.
const getQualifiedSelectors = (
  name: string,
  args: Expression[],
  counts: number[] | undefined,
  lookup: Lookup,
) => {
  if (!name.includes("!") || lookup(name)) return undefined;
  const parts = name.split("!");
  if (!parts.some((_, index) => lookup(parts.slice(0, index + 1).join("!")))) return undefined;
  return getNameSelectors(name, args, counts);
};

const containsReference = (expression: Expression): boolean =>
  expression.kind === "Subexpression" ||
  (expression.kind === "Identifier" && expression.name.includes("!")) ||
  (expression.kind === "Apply" && expression.operator.includes("!")) ||
  getChildren(expression).some(containsReference);

// A reference into a theorem whose statement is an ASSUME/PROVE stays for name resolution to check.
// isOperator holds where an operator may be given, as the argument of an operator that may take one.
const resolveSubexpressions = (
  expression: Expression,
  lookup: Lookup,
  goals: ReadonlySet<string>,
  isOperator = false,
): Expression => {
  if (!containsReference(expression)) return expression;
  if (expression.kind === "Let") {
    const local: Lookup = (name) =>
      expression.definitions.find((definition) => definition.name === name) ?? lookup(name);
    return mapChildren(expression, (child) => resolveSubexpressions(child, local, goals));
  }
  const callee = expression.kind === "Apply" ? lookup(expression.operator) : undefined;
  const mapped =
    expression.kind === "Apply"
      ? {
          ...expression,
          args: expression.args.map((arg, index) =>
            resolveSubexpressions(
              arg,
              lookup,
              goals,
              callee?.kind !== "Operator" || callee.params[index]?.arity !== 0,
            ),
          ),
        }
      : mapChildren(expression, (child) => resolveSubexpressions(child, lookup, goals));
  const selectors =
    mapped.kind === "Subexpression"
      ? mapped.selectors
      : mapped.kind === "Identifier"
        ? getQualifiedSelectors(mapped.name, [], undefined, lookup)
        : mapped.kind === "Apply"
          ? getQualifiedSelectors(mapped.operator, mapped.args, mapped.argumentCounts, lookup)
          : undefined;
  const first = selectors?.[0];
  if (!selectors || (first?.kind === "Name" && goals.has(first.name))) return mapped;
  const selected = selectSubexpression(selectors, lookup, mapped, isOperator);
  if (selected !== mapped) selections.add(selected);
  return selected;
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
      ...substitution,
      expression: resolveSubexpressions(substitution.expression, lookup, new Set(), true),
    })),
  };
};

export const resolveModuleSubexpressions = (module: Module, available: Definition[]): Module => {
  const lookup = createLookup([...available, ...module.definitions]);
  const hasReferences =
    module.definitions.some((definition) => containsReference(definition.body)) ||
    module.assumptions.some((assumption) => containsReference(assumption.expression));
  if (!hasReferences) return module;
  const goals = new Set(
    module.theorems.flatMap((theorem) =>
      theorem.name !== undefined && theorem.statement.kind === "AssumeProve" ? [theorem.name] : [],
    ),
  );
  return {
    ...module,
    definitions: module.definitions.map((definition) =>
      mapDefinition(definition, (child) => resolveSubexpressions(child, lookup, goals)),
    ),
    assumptions: module.assumptions.map((assumption) => ({
      ...assumption,
      expression: resolveSubexpressions(assumption.expression, lookup, goals),
    })),
  };
};
