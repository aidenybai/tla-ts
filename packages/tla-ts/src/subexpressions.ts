import {
  getChildren,
  type AssumeProve,
  type Bound,
  type Declaration,
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
import { formatRange, TlaSyntaxError, type SanyError } from "./errors";
import { getSourceName, mapChildren, mapDefinition } from "./instances";
import { parenthesizedRanges } from "./parser";
import { STANDARD_LEVELS } from "./standard-definitions";
import { resolveSynonym } from "./tlc/jar-data";
import {
  compareLocations,
  getArity,
  getBinder,
  getNameSelectors,
  getOperandIndex,
  getOperands,
  getParamArities,
  isBefore,
  LOCAL_RESOLUTION,
  nullSelections,
  operatorSelectionErrors,
  selectionErrors,
  selectionArguments,
  selections,
  SELECTION_NAME,
  factReferences,
  type NullSelection,
  type SelectionArguments,
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

const declaredArities = new WeakMap<Definition, number>();
const generatedArgumentCounts = new WeakMap<Expression, number>();

const resolveDefinition = (
  definition: Definition,
  resolve: (expression: Expression) => Expression,
) => {
  const resolved = mapDefinition(definition, resolve);
  const arity = declaredArities.get(definition);
  if (arity !== undefined) declaredArities.set(resolved, arity);
  return resolved;
};

const setDeclaredArities = (declarations: Declaration[], definitions: Definition[]) =>
  declarations.forEach((declaration) => {
    const definition = definitions.find(
      (candidate) => candidate.isRecursive && candidate.name === declaration.name,
    );
    if (definition) declaredArities.set(definition, declaration.arity);
  });

const getSelectorName = (selector: Selector) => {
  switch (selector.kind) {
    case "Name":
      return selector.name;
    case "Operand":
      return typeof selector.operand === "number"
        ? `argument selector ${selector.operand}`
        : selector.operand;
    case "Bound":
      return "!(...)";
    case "At":
      return "@";
    case "Colon":
      return ":";
  }
};

const getExpressionArguments = (
  operator: string,
  range: SourceRange | undefined,
  args: Expression[],
): SelectionArguments => ({ operator, range, args, params: args.map(() => 0) });

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
  if (expression.kind === "Lambda" || expression.kind === "Selection") return undefined;
  for (const child of getChildren(expression).slice(0, generatedArgumentCounts.get(expression))) {
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
  if (selection.params.length === 0) return body;
  if (selection.args.length === 0) {
    if (selection.params.some((param) => param.arity > 0)) {
      throw createError("Selected an operator with operator parameters as an argument", location);
    }
    return {
      kind: "Lambda",
      params: selection.params.map((param) => param.name),
      body,
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
        body,
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
  return createApplication(
    { ...selection, params: [...selection.params, ...params] },
    wrapLets(reference, selection.lets, location),
  );
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
  let operatorIndex = -1;
  let current: Expression | undefined;
  let unwrappedSelection: Expression | undefined;
  let isFailed = false;
  let generatedArguments = 0;
  const nulls: NullSelection[] = [];
  const applications: SelectionArguments[] = [];
  let expressionError: SanyError | undefined;
  const deferToExpression = (range: SourceRange | undefined, message: string) => {
    if (!expressionError && range) expressionError = { location: formatRange(range), message };
  };
  const checkNull = (node: Expression | undefined, message: string, isEmpty = false) => {
    const range = reference.selectorRanges?.[selectorIndex];
    if (node && range) {
      nulls.push({ node, error: { location: formatRange(range), message }, isEmpty });
    }
  };

  const report = (range: SourceRange | undefined, message: string) => {
    if (!range) throw createError(message, location);
    selectionErrors.set(reference, {
      applications,
      nulls,
      error: { location: formatRange(range), message },
    });
    generatedArgumentCounts.set(reference, generatedArguments);
    isFailed = true;
    return undefined;
  };

  const findDefinition = (local: Definition[] | undefined) => {
    const names: string[] = [];
    const args: Expression[] = [];
    while (selectorIndex < selectors.length) {
      const selector = selectors[selectorIndex];
      if (selector.kind !== "Name" && !local) return undefined;
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
    if (!found) {
      isFailed = true;
      return undefined;
    }
    const definition = found.definition;
    const arity = declaredArities.get(definition) ?? getArity(definition);
    const isLast = selectorIndex === selectors.length - 1;
    if (found.args.length !== arity) {
      const range = reference.argumentRanges?.[selectorIndex] ?? location.range;
      const message = `The operator ${resolveSynonym(found.name)} requires ${arity - found.earlier} arguments.`;
      if (!isOperator || found.args.length !== 0) {
        generatedArguments += found.earlier;
        return report(range, message);
      }
      deferToExpression(range, message);
    }
    generatedArguments += found.args.length;
    found.args.forEach((arg, index) =>
      selectionArguments.set(arg, {
        operator: found.name,
        index,
        range: reference.selectorRanges?.[selectorIndex],
      }),
    );
    if (isLast) return { definition, args: found.args };
    const range = definition.location.range;
    const isUndefined =
      declaredArities.has(definition) &&
      range?.module === location.range?.module &&
      isBefore(location, definition.location);
    applications.push({
      operator: found.name,
      range: reference.selectorRanges?.[selectorIndex],
      args: found.args,
      params: isUndefined ? Array(arity).fill(0) : getParamArities(definition),
    });
    if (
      definition.isRecursive &&
      range &&
      range.module === location.range?.module &&
      isBefore(location, range.end)
    ) {
      return report(
        reference.selectorRanges?.[selectorIndex],
        `Subexpression of  \`${found.name}' used inside the operator's definition.`,
      );
    }
    if (definition.kind !== "Operator") {
      throw createError(`Cannot select a subexpression of ${definition.name}`, location);
    }
    selection.params.push(...definition.params);
    selection.args.push(...found.args);
    current = definition.body;
    operatorIndex = selectorIndex;
    selectorIndex++;
    return undefined;
  };

  const followLabels = () => {
    while (selectorIndex < selectors.length && !isFailed) {
      const selector = selectors[selectorIndex];
      if (selector.kind !== "Name") return;
      const range = reference.selectorRanges?.[selectorIndex];
      const found = current && findLabel(current, selector.name, []);
      if (!found) return report(range, `Cannot find label \`${selector.name}'.`);
      const params = found.label.params;
      if (selector.args.length !== params.length) {
        const message = `Label \`${selector.name}' used with wrong number of arguments.`;
        if (!isOperator) return report(range, message);
        deferToExpression(range, message);
      }
      generatedArguments += selector.args.length;
      selection.lets.push(...found.lets);
      selection.params.push(...params.map((name) => ({ name, arity: 0 })));
      selection.args.push(...selector.args);
      applications.push(getExpressionArguments(selector.name, range, selector.args));
      current = found.label.body;
      selectorIndex++;
    }
  };

  const selectOperand = (selector: Selector) => {
    if (!current) throw createError("Subexpression selection failed", location);
    if (selector.kind === "Colon") return;
    const range = reference.selectorRanges?.[selectorIndex];
    const noOperands = `Choosing operand \`${getSelectorName(selector)}' of subexpression with no operands.`;
    if (selectionErrors.has(current)) {
      report(range, noOperands);
      return;
    }
    if (selections.has(current) && current.kind !== "Lambda" && current !== unwrappedSelection) {
      checkNull(current, noOperands, true);
      unwrappedSelection = current;
      if (
        current.kind === "Let" &&
        current.body.kind === "Apply" &&
        current.body.operator === SELECTION_NAME
      ) {
        current = current.body;
      } else if (current.kind !== "Selection") {
        // SANY wraps a selection without parameters in $Nop, whose only operand is the selection.
        current = { kind: "Tuple", elements: [current], location: current.location };
      }
    }
    if (current.kind === "Label") {
      current = current.body;
      selectOperand(selector);
      return;
    }
    const nonexistent = `Nonexistent operand specified by \`${getSelectorName(selector)}'.`;
    if (current.kind === "Let") {
      if (selector.kind !== "Operand" || getOperandIndex(selector.operand, 1) !== 0) {
        report(range, "A LET/IN expression has only one operand.");
        return;
      }
      selection.lets.push(current.definitions);
      current = current.body;
      return;
    }
    const binder = getBinder(current);
    if (binder && (selector.kind === "Bound" || selector.kind === "At")) {
      if (selector.kind === "Bound" && selector.args.length !== binder.names.length) {
        report(
          range,
          `Selector with ${selector.args.length} argument(s) used for quantifier with ${binder.names.length} bound identifier(s).`,
        );
        return;
      }
      selection.params.push(...binder.names.map((name) => ({ name, arity: 0 })));
      if (selector.kind === "Bound") {
        generatedArguments += selector.args.length;
        selection.args.push(...selector.args);
        applications.push(getExpressionArguments("", range, selector.args));
      }
      // A selected LAMBDA's body is the node it shares, which SANY selects without a $Nop.
      current =
        selections.has(current) && binder.body.kind === "Selection"
          ? binder.body.expression
          : binder.body;
      return;
    }
    if (current.kind === "Case") {
      const arms = [
        ...current.arms,
        ...(current.other ? [{ condition: undefined, body: current.other }] : []),
      ];
      if (selectorIndex === selectors.length - 1) {
        report(range, "Subexpression of CASE must have form !i!j.");
        return;
      }
      const arm =
        selector.kind === "Operand"
          ? arms[getOperandIndex(selector.operand, arms.length)]
          : undefined;
      if (!arm) {
        report(range, nonexistent);
        return;
      }
      selectorIndex++;
      const next = selectors[selectorIndex];
      const part = next.kind === "Operand" ? getOperandIndex(next.operand, 2) : -1;
      const nextRange = reference.selectorRanges?.[selectorIndex];
      if (part === -1) {
        report(
          nextRange,
          "Second selector for CASE subexpression must specify  one of two operands.",
        );
        return;
      }
      const chosen = part === 0 ? arm.condition : arm.body;
      if (!chosen) {
        report(nextRange, "Selecting OTHER in a CASE statement.");
        return;
      }
      current = chosen;
      return;
    }
    if (
      current.kind === "Except" &&
      selector.kind === "Operand" &&
      getOperandIndex(selector.operand, current.updates.length + 1) > 0
    ) {
      report(range, "Selecting subexpression of an EXCEPT not yet implemented.");
      return;
    }
    const operands = binder ? binder.sets : getOperands(current);
    if (!operands && current.kind !== "Identifier") {
      report(range, "Selecting subexpression of expression that has none.");
      return;
    }
    if (selector.kind !== "Operand") {
      report(range, nonexistent);
      return;
    }
    const operand = operands?.[getOperandIndex(selector.operand, operands.length)];
    if (!operand) {
      report(range, nonexistent);
      return;
    }
    current = operand;
  };

  const first = enterDefinition(undefined);
  if (isFailed) return reference;
  if (first) return applyDefinition(first.definition, { ...selection, args: first.args });
  followLabels();
  while (selectorIndex < selectors.length && !isFailed) {
    const selector = selectors[selectorIndex];
    if (selector.kind === "Name") {
      while (current?.kind === "Label") current = current.body;
      if (current?.kind !== "Let") {
        report(
          reference.selectorRanges?.[selectorIndex - 1],
          "A name selector here must be from a LET clause.",
        );
        return reference;
      }
      selection.lets.push(current.definitions);
      const last = enterDefinition(current.definitions);
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
    if (selector.kind === "Colon" && selectors[selectorIndex - 1].kind !== "Name") {
      report(
        reference.selectorRanges?.[selectorIndex - 1],
        "!: should not follow an operand selector.",
      );
      return reference;
    }
    if (
      selector.kind === "Colon" &&
      selectors[selectorIndex + 1]?.kind !== "Name" &&
      (operatorIndex !== selectorIndex - 1 || selectorIndex !== selectors.length - 1)
    ) {
      report(
        reference.selectorRanges?.[selectorIndex],
        "`!:' can be used only after a name and either at the end after an\noperator name or before an operator name.",
      );
      return reference;
    }
    if (selector.kind !== "Colon") {
      checkNull(
        current,
        "Subexpression selection failed, probably due to an error in the selected expression.",
      );
      checkNull(
        current,
        `Choosing operand \`${getSelectorName(selector)}' of subexpression with no operands.`,
        true,
      );
    }
    selectOperand(selector);
    checkNull(
      current,
      `An unexpected null node specified by '${getSelectorName(selectors[selectorIndex])}'.\nThis is probably due to a previous error.`,
    );
    selectorIndex++;
  }
  if (isFailed) return reference;
  if (!current) throw createError("Subexpression selection failed", location);
  const params = selection.params.length;
  const args = selection.args.length;
  if (params !== args) {
    const message = `Expected ${params} arguments but found ${args}.`;
    if (!isOperator || args > 0) {
      report(location.range, message);
      return reference;
    }
    deferToExpression(location.range, message);
  }
  const body = wrapLets(current, selection.lets, location);
  const share = (expression: Expression): Expression => ({
    kind: "Selection",
    expression,
    location: expression.location,
  });
  // SANY selects a LAMBDA itself rather than wrapping it in $Nop, so the selection keeps its arity.
  const selected = createApplication(
    selection,
    body.kind !== "Lambda"
      ? share(body)
      : { ...body, body: selections.has(body) ? body.body : share(body.body), location },
  );
  nullSelections.set(selected, nulls);
  if (expressionError) operatorSelectionErrors.set(selected, expressionError);
  return selected;
};

const getQualifiedSelectors = (
  name: string,
  args: Expression[],
  counts: number[] | undefined,
  lookup: Lookup,
) => {
  if (!name.includes("!") || lookup(name)) return undefined;
  const parts = name.split("!");
  if (!parts.some((_part, index) => lookup(parts.slice(0, index + 1).join("!")))) return undefined;
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
    if (expression.recursive) setDeclaredArities(expression.recursive, expression.definitions);
    const resolved: Definition[] = [];
    const local: Lookup = (name) =>
      resolved.find((definition) => definition.name === name) ??
      expression.definitions.find((definition) => definition.name === name) ??
      lookup(name);
    const isLocalGoal = (name: string) =>
      !expression.definitions.some((definition) => definition.name === name) && isGoal(name);
    expression.definitions.forEach((definition) =>
      resolved.push(
        resolveDefinition(definition, (child) => resolveSubexpressions(child, local, isLocalGoal)),
      ),
    );
    const mapped = {
      ...expression,
      definitions: resolved,
      body: resolveSubexpressions(expression.body, local, isLocalGoal),
    };
    return mapped.instances
      ? {
          ...mapped,
          instances: mapped.instances.map((instance) =>
            resolveInstance(instance, local, isLocalGoal),
          ),
        }
      : mapped;
  }
  const callee = expression.kind === "Apply" ? lookup(expression.operator) : undefined;
  // SANY expects an operator argument only of a user-defined operator, which a standard module's built-in operators stand for.
  const calleeParams =
    callee?.kind === "Operator"
      ? callee.params
      : expression.kind === "Apply"
        ? STANDARD_LEVELS.get(expression.operator.slice(expression.operator.lastIndexOf("!") + 1))
            ?.formals
        : undefined;
  const rebuilt =
    expression.kind === "Apply"
      ? {
          ...expression,
          args: expression.args.map((arg, index) =>
            resolveSubexpressions(
              arg,
              lookup,
              isGoal,
              calleeParams !== undefined && calleeParams[index]?.arity !== 0,
            ),
          ),
        }
      : mapChildren(expression, (child) => resolveSubexpressions(child, lookup, isGoal));
  const children = getChildren(expression);
  const mapped = getChildren(rebuilt).every((child, index) => child === children[index])
    ? expression
    : rebuilt;
  const selectors =
    mapped.kind === "Subexpression"
      ? mapped.selectors
      : mapped.kind === "Identifier"
        ? getQualifiedSelectors(mapped.name, [], undefined, lookup)
        : mapped.kind === "Apply"
          ? getQualifiedSelectors(mapped.operator, mapped.args, mapped.argumentCounts, lookup)
          : undefined;
  const first = selectors?.[0];
  const setGeneratedArguments = (count: number) => {
    generatedArgumentCounts.set(expression, count);
    generatedArgumentCounts.set(mapped, count);
  };
  if (!selectors) {
    if (mapped.kind === "Apply" && mapped.operator.includes("!") && !lookup(mapped.operator)) {
      setGeneratedArguments(0);
    }
    return mapped;
  }
  const nameCount = selectors.findIndex((selector) => selector.kind !== "Name");
  const names = selectors.slice(0, nameCount === -1 ? selectors.length : nameCount);
  const isQualified = names.some(
    (_name, index) =>
      index > 0 &&
      lookup(
        names
          .slice(0, index + 1)
          .map(getSelectorName)
          .join("!"),
      ),
  );
  if (first?.kind === "Name" && isGoal(first.name) && !isQualified) return mapped;
  if (first?.kind === "Name" && selectors[1].kind !== "Name" && !lookup(first.name)) {
    setGeneratedArguments(0);
    return mapped;
  }
  const selected = selectSubexpression(selectors, lookup, mapped, isOperator);
  const generated = generatedArgumentCounts.get(mapped);
  if (generated !== undefined) setGeneratedArguments(generated);
  const parenthesized = parenthesizedRanges.get(expression);
  if (parenthesized && selected !== mapped) parenthesizedRanges.set(selected, parenthesized);
  if (selected !== mapped) selections.set(selected, mapped);
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
  const goals = new Set(
    module.theorems.flatMap((theorem) =>
      theorem.name !== undefined && theorem.statement.kind === "AssumeProve" ? [theorem.name] : [],
    ),
  );
  const clauses = module.theorems.flatMap((theorem): Definition[] => {
    const statement = theorem.statement;
    if (theorem.name === undefined || statement.kind !== "AssumeProve") return [];
    const assumptions = statement.assumptions.filter(
      (assumption) => assumption.kind !== "NewSymbol" && assumption.kind !== "AssumeProve",
    );
    if (assumptions.length !== statement.assumptions.length) return [];
    return [
      {
        kind: "Operator",
        name: theorem.name,
        params: [],
        body: {
          kind: "Tuple",
          elements: [...assumptions, statement.conclusion],
          location: statement.location,
        },
        isLocal: true,
        isRecursive: false,
        location: theorem.location,
      },
    ];
  });
  const own = new Set([...module.definitions, ...clauses]);
  setDeclaredArities(
    module.units.flatMap((unit) => (unit.kind === "Recursive" ? unit.declarations : [])),
    module.definitions,
  );
  const recursive = new Map(
    module.units.flatMap((unit): [string, SourceLocation][] =>
      unit.kind === "Recursive"
        ? unit.declarations.map((declaration) => [declaration.name, declaration.location])
        : [],
    ),
  );
  const isDeclaredBefore = (definition: Definition, location: SourceLocation) => {
    const declared = recursive.get(definition.name);
    return (
      isBefore(definition.location, location) ||
      (definition.isRecursive && declared !== undefined && isBefore(declared, location))
    );
  };
  const resolvedDefinitions = new Map<Definition, Definition>();
  const getVisibleLookup =
    (lookup: Lookup, location: SourceLocation): Lookup =>
    (name) => {
      const definition = lookup(name);
      if (!definition || (own.has(definition) && !isDeclaredBefore(definition, location))) {
        return undefined;
      }
      return resolvedDefinitions.get(definition) ?? definition;
    };
  const proofLookup = createLookup([...available, ...module.definitions]);
  const isGoal = (name: string) => goals.has(name);
  const definitionLookup = createLookup([...available, ...module.definitions, ...clauses]);
  const resolve = (expression: Expression, location: SourceLocation) =>
    resolveSubexpressions(
      expression,
      getVisibleLookup(definitionLookup, location),
      (name) => isGoal(name) && clauses.every((clause) => clause.name !== name),
    );
  const createProofResolver = (lookup: Lookup) => {
    const isProofGoal = (name: string) => isGoal(name) || !lookup(name);
    const resolveInProof = (expression: Expression) =>
      resolveSubexpressions(expression, lookup, isProofGoal);
    const resolveFacts = (facts: Fact[]) => {
      const resolved = facts.map((fact) =>
        fact.kind === "ModuleFact" ? fact : resolveInProof(fact),
      );
      factReferences.set(resolved, facts);
      return resolved;
    };
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
                : resolveDefinition(definition, resolveInProof),
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
    const resolveProof = (proof: Proof | undefined): Proof | undefined => {
      if (proof?.kind === "By") return { ...proof, facts: resolveFacts(proof.facts) };
      if (proof?.kind !== "Steps") return proof;
      let resolver = { lookup, resolveStep, resolveProof };
      return {
        ...proof,
        steps: proof.steps.map((step) => {
          const resolved = {
            ...step,
            body: resolver.resolveStep(step.body),
            proof: resolver.resolveProof(step.proof),
          };
          if (resolved.body.kind === "Define") {
            const definitions = resolved.body.definitions.flatMap((definition) =>
              definition.kind === "Instance" ? [] : [definition],
            );
            const outer = resolver.lookup;
            resolver = createProofResolver(
              (name) => definitions.find((definition) => definition.name === name) ?? outer(name),
            );
          }
          return resolved;
        }),
      };
    };
    return { lookup, resolveFacts, resolveStatement, resolveStep, resolveProof };
  };
  const hasReferences =
    module.definitions.some((definition) => containsReference(definition.body)) ||
    module.assumptions.some((assumption) => containsReference(assumption.expression));
  if (hasReferences) {
    // A selection shares the nodes it selects, so each definition is resolved before any that selects from it.
    [...module.definitions, ...clauses]
      .toSorted((left, right) => compareLocations(left.location, right.location))
      .forEach((definition) =>
        resolvedDefinitions.set(
          definition,
          resolveDefinition(definition, (expression) => resolve(expression, definition.location)),
        ),
      );
  }
  const resolved = {
    ...module,
    theorems: module.theorems.map((theorem) => {
      const resolver = createProofResolver(getVisibleLookup(proofLookup, theorem.location));
      return {
        ...theorem,
        statement:
          theorem.name !== undefined && theorem.statement.kind !== "AssumeProve"
            ? theorem.statement
            : resolver.resolveStatement(theorem.statement),
        proof:
          theorem.proof &&
          createProofResolver(getVisibleLookup(proofLookup, theorem.proof.location)).resolveProof(
            theorem.proof,
          ),
      };
    }),
    uses: module.uses.map((use) => ({
      ...use,
      facts: createProofResolver(getVisibleLookup(proofLookup, use.location)).resolveFacts(
        use.facts,
      ),
    })),
  };
  if (!hasReferences) return resolved;
  return {
    ...resolved,
    definitions: module.definitions.map(
      (definition) => resolvedDefinitions.get(definition) ?? definition,
    ),
    assumptions: module.assumptions.map((assumption) => ({
      ...assumption,
      expression: resolve(assumption.expression, assumption.location),
    })),
  };
};
