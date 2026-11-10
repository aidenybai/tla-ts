import {
  getChildren,
  type AssumeProve,
  type Bound,
  type Definition,
  type Expression,
  type Fact,
  type Instance,
  type Module,
  type OperatorParam,
  type Proof,
  type Selector,
  type SourceLocation,
  type SourceRange,
  type StepBody,
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

const selectSubexpression = (
  selectors: Selector[],
  lookup: Lookup,
  reference: Expression & SelectingName,
  isOperator: boolean,
): Expression => {
  const location = reference.location;
  const selection: Selection = { params: [], args: [], lets: [], location };
  let selectorIndex = 0;
  let selected: Expression | undefined;
  let isFailed = false;

  const report = (range: SourceRange | undefined, message: string) => {
    if (!range) throw createError(message, location);
    selectionErrors.set(reference, {
      args: selectors
        .slice(0, selectorIndex)
        .flatMap((selector) => ("args" in selector ? selector.args : [])),
      error: { location: formatRange(range), message },
    });
    isFailed = true;
    return undefined;
  };

  const findDefinition = (local: Definition[] | undefined) => {
    const names: string[] = [];
    const args: Expression[] = [];
    while (selectorIndex < selectors.length) {
      const selector = selectors[selectorIndex];
      if (selector.kind !== "Name") throw createError("Expected an operator name", location);
      names.push(selector.name);
      args.push(...selector.args);
      const name = names.join("!");
      const definition = local
        ? local.find((candidate) => getSourceName(candidate) === name)
        : lookup(name);
      if (definition)
        return { definition, name, args, earlier: args.length - selector.args.length };
      selectorIndex++;
    }
    throw createError(`Unknown operator ${names.join("!")}`, location);
  };

  const enterDefinition = (local: Definition[] | undefined) => {
    const found = findDefinition(local);
    const definition = found.definition;
    const arity = getArity(definition);
    const isLast = selectorIndex === selectors.length - 1;
    if (found.args.length !== arity && (!isOperator || found.args.length !== 0)) {
      return report(
        reference.argumentRanges?.[selectorIndex] ?? location.range,
        `The operator ${found.name} requires ${arity - found.earlier} arguments.`,
      );
    }
    if (isLast) return { definition, args: found.args };
    if (definition.kind !== "Operator") {
      throw createError(`Cannot select a subexpression of ${definition.name}`, location);
    }
    selection.params.push(...definition.params);
    selection.args.push(...found.args);
    selected = definition.body;
    selectorIndex++;
    return undefined;
  };

  const followLabels = () => {
    while (selectorIndex < selectors.length && !isFailed) {
      const selector = selectors[selectorIndex];
      if (selector.kind !== "Name") return;
      const range = reference.selectorRanges?.[selectorIndex];
      const found = selected && findLabel(selected, selector.name, []);
      if (!found) return report(range, `Cannot find label \`${selector.name}'.`);
      const params = found.label.params;
      if (!isOperator && selector.args.length !== params.length) {
        return report(range, `Label \`${selector.name}' used with wrong number of arguments.`);
      }
      selection.lets.push(...found.lets);
      selection.params.push(...params.map((name) => ({ name, arity: 0 })));
      selection.args.push(...selector.args);
      selected = found.label.body;
      selectorIndex++;
    }
  };

  const selectOperand = (selector: Selector) => {
    const current = selected;
    if (!current) throw createError("Subexpression selection failed", location);
    if (selector.kind === "Colon") return;
    if (current.kind === "Label") {
      selected = current.body;
      selectOperand(selector);
      return;
    }
    if (current.kind === "Let") {
      if (selector.kind !== "Operand" || getOperandIndex(selector.operand, 1) !== 0) {
        throw createError("A LET/IN expression has only one operand", location);
      }
      selection.lets.push(current.definitions);
      selected = current.body;
      return;
    }
    const binder = getBinder(current);
    if (binder && (selector.kind === "Bound" || selector.kind === "At")) {
      selection.params.push(...binder.names.map((name) => ({ name, arity: 0 })));
      if (selector.kind === "Bound") selection.args.push(...selector.args);
      selected = binder.body;
      return;
    }
    if (current.kind === "Case" && selector.kind === "Operand") {
      const arms = [
        ...current.arms,
        ...(current.other ? [{ condition: undefined, body: current.other }] : []),
      ];
      const arm = arms[getOperandIndex(selector.operand, arms.length)];
      const next = selectors[selectorIndex + 1];
      if (!arm || next?.kind !== "Operand") {
        throw createError("A subexpression of CASE must have the form !i!j", location);
      }
      selectorIndex++;
      const part = getOperandIndex(next.operand, 2);
      const chosen = part === 0 ? arm.condition : part === 1 ? arm.body : undefined;
      if (!chosen) throw createError("Nonexistent CASE operand", location);
      selected = chosen;
      return;
    }
    if (selector.kind !== "Operand")
      throw createError("Unexpected subexpression selector", location);
    const operands = binder ? binder.sets : getOperands(current);
    const operand = operands?.[getOperandIndex(selector.operand, operands.length)];
    if (!operand) throw createError("Nonexistent operand specified by the selector", location);
    selected = operand;
  };

  const first = enterDefinition(undefined);
  if (isFailed) return reference;
  if (first) return applyDefinition(first.definition, { ...selection, args: first.args });
  followLabels();
  while (selectorIndex < selectors.length && !isFailed) {
    const selector = selectors[selectorIndex];
    if (selector.kind === "Name") {
      while (selected?.kind === "Label") selected = selected.body;
      if (selected?.kind !== "Let") {
        throw createError("A name selector here must be from a LET clause", location);
      }
      selection.lets.push(selected.definitions);
      const last = enterDefinition(selected.definitions);
      if (isFailed) return reference;
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
    selectorIndex++;
  }
  if (isFailed) return reference;
  if (!selected) throw createError("Subexpression selection failed", location);
  return createApplication(selection, selected);
};

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

const resolveSubexpressions = (
  expression: Expression,
  lookup: Lookup,
  isGoal: (name: string) => boolean,
  isOperator = false,
): Expression => {
  if (!containsReference(expression)) return expression;
  if (expression.kind === "Let") {
    const local: Lookup = (name) =>
      expression.definitions.find((definition) => definition.name === name) ?? lookup(name);
    const mapped = mapChildren(expression, (child) => resolveSubexpressions(child, local, isGoal));
    return mapped.kind === "Let" && mapped.instances
      ? {
          ...mapped,
          instances: mapped.instances.map((instance) => resolveInstance(instance, local, isGoal)),
        }
      : mapped;
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
              isGoal,
              callee?.kind !== "Operator" || callee.params[index]?.arity !== 0,
            ),
          ),
        }
      : mapChildren(expression, (child) => resolveSubexpressions(child, lookup, isGoal));
  const selectors =
    mapped.kind === "Subexpression"
      ? mapped.selectors
      : mapped.kind === "Identifier"
        ? getQualifiedSelectors(mapped.name, [], undefined, lookup)
        : mapped.kind === "Apply"
          ? getQualifiedSelectors(mapped.operator, mapped.args, mapped.argumentCounts, lookup)
          : undefined;
  const first = selectors?.[0];
  if (!selectors || (first?.kind === "Name" && isGoal(first.name))) return mapped;
  const selected = selectSubexpression(selectors, lookup, mapped, isOperator);
  if (selected !== mapped) selections.add(selected);
  return selected;
};

const resolveInstance = (
  instance: Instance,
  lookup: Lookup,
  isGoal: (name: string) => boolean,
): Instance => ({
  ...instance,
  substitutions: instance.substitutions.map((substitution) => ({
    ...substitution,
    expression: resolveSubexpressions(substitution.expression, lookup, isGoal, true),
  })),
});

const createLookup = (definitions: Definition[]): Lookup => {
  const byName = new Map(definitions.map((definition) => [definition.name, definition]));
  return (name) => byName.get(name);
};

export const resolveInstanceSubexpressions = (instance: Instance, module: Module): Instance =>
  resolveInstance(instance, createLookup(module.definitions), () => false);

export const resolveModuleSubexpressions = (module: Module, available: Definition[]): Module => {
  const lookup = createLookup([...available, ...module.definitions]);
  const goals = new Set(
    module.theorems.flatMap((theorem) =>
      theorem.name !== undefined && theorem.statement.kind === "AssumeProve" ? [theorem.name] : [],
    ),
  );
  const isGoal = (name: string) => goals.has(name);
  const resolve = (expression: Expression) => resolveSubexpressions(expression, lookup, isGoal);
  const isProofGoal = (name: string) => isGoal(name) || !lookup(name);
  const resolveInProof = (expression: Expression) =>
    resolveSubexpressions(expression, lookup, isProofGoal);
  const resolveFacts = (facts: Fact[]) =>
    facts.map((fact) => (fact.kind === "ModuleFact" ? fact : resolveInProof(fact)));
  const resolveBounds = (bounds: Bound[]) =>
    bounds.map((bound) => ({ ...bound, set: resolveInProof(bound.set) }));
  const resolveStatement = (statement: Expression | AssumeProve): Expression | AssumeProve =>
    statement.kind === "AssumeProve"
      ? {
          ...statement,
          assumptions: statement.assumptions.map((assumption) =>
            assumption.kind === "NewSymbol"
              ? { ...assumption, set: assumption.set && resolveInProof(assumption.set) }
              : resolveStatement(assumption),
          ),
          conclusion: resolveInProof(statement.conclusion),
        }
      : resolveInProof(statement);
  const resolveStep = (body: StepBody): StepBody => {
    switch (body.kind) {
      case "Use":
      case "Hide":
        return { ...body, facts: resolveFacts(body.facts) };
      case "Instance":
        return resolveInstance(body, lookup, isProofGoal);
      case "Define":
        return {
          ...body,
          definitions: body.definitions.map((definition) =>
            definition.kind === "Instance"
              ? resolveInstance(definition, lookup, isProofGoal)
              : mapDefinition(definition, resolveInProof),
          ),
        };
      case "Have":
      case "Case":
        return { ...body, expression: resolveInProof(body.expression) };
      case "Witness":
        return { ...body, expressions: body.expressions.map(resolveInProof) };
      case "Take":
        return { ...body, bounds: resolveBounds(body.bounds) };
      case "Pick":
        return { ...body, bounds: resolveBounds(body.bounds), body: resolveInProof(body.body) };
      case "Assert":
        return { ...body, statement: resolveStatement(body.statement) };
      default:
        return body;
    }
  };
  const resolveProof = (proof: Proof | undefined): Proof | undefined =>
    proof?.kind === "By"
      ? { ...proof, facts: resolveFacts(proof.facts) }
      : proof?.kind === "Steps"
        ? {
            ...proof,
            steps: proof.steps.map((step) => ({
              ...step,
              body: resolveStep(step.body),
              proof: resolveProof(step.proof),
            })),
          }
        : proof;
  const resolved = {
    ...module,
    theorems: module.theorems.map((theorem) => ({
      ...theorem,
      statement:
        theorem.name !== undefined && theorem.statement.kind !== "AssumeProve"
          ? theorem.statement
          : resolveStatement(theorem.statement),
      proof: resolveProof(theorem.proof),
    })),
    uses: module.uses.map((use) => ({ ...use, facts: resolveFacts(use.facts) })),
  };
  const hasReferences =
    module.definitions.some((definition) => containsReference(definition.body)) ||
    module.assumptions.some((assumption) => containsReference(assumption.expression));
  if (!hasReferences) return resolved;
  return {
    ...resolved,
    definitions: module.definitions.map((definition) => mapDefinition(definition, resolve)),
    assumptions: module.assumptions.map((assumption) => ({
      ...assumption,
      expression: resolve(assumption.expression),
    })),
  };
};
