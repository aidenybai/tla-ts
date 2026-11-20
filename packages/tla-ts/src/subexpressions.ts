import {
  getAssumeProveBody,
  getAssumeProveExpression,
  getChildren,
  getDefinitionExpressions,
  getFunctionConstruction,
  isAssumeProve,
  isNewDeclaration,
  type ApplyExpression,
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
import {
  getSourceName,
  hasLetInstance,
  mapChildren,
  mapDefinition,
  substitutionFrames,
  withSubstitutionFrames,
} from "./instances";
import { defEntryErrors, parenthesizedRanges } from "./parser";
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
  operandApplications,
  operatorSelectionErrors,
  selectionErrors,
  selectionArguments,
  selections,
  SELECTION_NAME,
  factReferences,
  generatedArgumentCounts,
  type NullSelection,
  type SelectionArguments,
} from "./resolve";

type Lookup = (name: string) => Definition | undefined;

interface FoundLabel {
  label: Expression & { kind: "Label" };
  lets: Definition[][];
  applications: Expression[];
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
  applications: Expression[],
): FoundLabel | undefined => {
  if (expression.kind === "Label") {
    return expression.name === name ? { label: expression, lets, applications } : undefined;
  }
  if (expression.kind === "Let")
    return findLabel(expression.body, name, [...lets, expression.definitions], applications);
  if (expression.kind === "Lambda" || expression.kind === "Selection") return undefined;
  const generated = generatedArgumentCounts.get(expression);
  const enclosing =
    (expression.kind === "Apply" && generated === undefined) ||
    expression.kind === "FunctionApplication"
      ? [...applications, expression]
      : applications;
  for (const child of getChildren(expression).slice(0, generated)) {
    const isFunction = expression.kind === "FunctionApplication" && child === expression.function;
    const found = findLabel(child, name, lets, isFunction ? applications : enclosing);
    if (found) return found;
  }
  return undefined;
};

const getHiddenLocation = (location: SourceLocation) => ({
  line: location.line,
  column: location.column,
});

const wrapLets = (body: Expression, lets: Definition[][], location: SourceLocation) =>
  lets.reduceRight<Expression>(
    (inner, definitions) => ({
      kind: "Let",
      definitions,
      body: inner,
      location: getHiddenLocation(location),
    }),
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
    location: getHiddenLocation(location),
  };
};

// SANY expects an operator argument only of a user-defined operator, which a standard module's built-in operators stand for.
const getCalleeParams = (
  expression: Expression & { kind: "Apply" },
  callee: Definition | undefined,
) =>
  callee?.kind === "Operator"
    ? callee.params
    : STANDARD_LEVELS.get(expression.operator.slice(expression.operator.lastIndexOf("!") + 1))
        ?.formals;

const getOperatorArgument = (operand: Expression, arity: number): Expression => {
  if (operand.kind !== "Identifier" && operand.kind !== "OperatorReference") return operand;
  const operator = operand.kind === "Identifier" ? operand.name : operand.operator;
  const params = Array.from({ length: arity }, (_value, index) => `argument${index}`);
  const application: ApplyExpression = {
    kind: "Apply",
    operator,
    args: params.map((name) => ({
      kind: "Identifier",
      name,
      location: operand.location,
      resolution: LOCAL_RESOLUTION,
    })),
    location: operand.location,
    ...(operand.kind === "Identifier" && { resolution: operand.resolution }),
  };
  operandApplications.set(operand, [...(operandApplications.get(operand) ?? []), application]);
  return { kind: "Lambda", params, body: application, operator, location: operand.location };
};

const getDefinitionBody = (definition: Definition) => {
  if (definition.kind === "Function") return getFunctionConstruction(definition);
  const body = definition.body;
  if (body.kind !== "Let" || body.location.range || body.body.kind !== "Identifier") return body;
  const name = body.body.name;
  const recursive = body.definitions.find((local) => local.name === name);
  return recursive?.kind === "Function"
    ? { ...body, body: getFunctionConstruction(recursive) }
    : body;
};

const applyDefinition = (definition: Definition, selection: Selection, isOverride: boolean) => {
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
          resolution: isOverride ? undefined : LOCAL_RESOLUTION,
        };
  return createApplication(
    { ...selection, params: [...selection.params, ...params] },
    wrapLets(reference, selection.lets, location),
  );
};

const selectSubexpression = (
  selectors: Selector[],
  lookup: Lookup,
  getStandardDefinition: Lookup,
  reference: Expression & SelectingName,
  isOperator: boolean,
): Expression => {
  const location = reference.location;
  const selection: Selection = { params: [], args: [], lets: [], location };
  let selectorIndex = 0;
  let operatorIndex = -1;
  let current: Expression | undefined;
  let isFailed = false;
  let generatedArguments = 0;
  const nulls: NullSelection[] = [];
  const applications: SelectionArguments[] = [];
  const entered: Definition[] = [];
  let expressionError: SanyError | undefined;
  const deferToExpression = (range: SourceRange | undefined, message: string) => {
    if (!expressionError && range) expressionError = { location: formatRange(range), message };
  };
  const checkNull = (
    node: Expression | undefined,
    message: string,
    isEmpty = false,
    index = selectorIndex,
  ) => {
    const range = reference.selectorRanges?.[index];
    if (node && range) {
      nulls.push({
        node,
        error: { location: formatRange(range), message },
        isEmpty,
        applications: [...applications],
      });
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

  const isLeftToResolver = (selector: Selector | undefined) => {
    const node = current?.kind === "Label" ? current.body : current;
    if (!node || !isAssumeProve(node)) return false;
    if (selector === undefined) return true;
    if (selector.kind === "Colon") return false;
    const clauses = getChildren(node);
    const index =
      selector.kind === "Operand" ? getOperandIndex(selector.operand, clauses.length) : -1;
    return isNewDeclaration(clauses.at(-1)) && (index === -1 || index === clauses.length - 1);
  };

  const findCallee = (name: string) =>
    selection.lets.flat().findLast((definition) => definition.name === name) ?? lookup(name);

  const enterScopes = (node: Expression): Expression => {
    if (node.kind !== "Let" || node.location.range) return node;
    selection.lets.push(node.definitions);
    return enterScopes(node.body);
  };

  const findDefinition = (local: Definition[] | undefined) => {
    const start = reference.selectorRanges?.[selectorIndex];
    const names: string[] = [];
    const args: Expression[] = [];
    while (selectorIndex < selectors.length) {
      const selector = selectors[selectorIndex];
      if (selector.kind !== "Name" && !local) return undefined;
      if (selector.kind === "Name") {
        names.push(selector.name);
        args.push(...selector.args);
        const name = names.join("!");
        const definition = local
          ? local.find((candidate) => getSourceName(candidate) === name)
          : (lookup(name) ??
            (selectorIndex < selectors.length - 1 ? getStandardDefinition(name) : undefined));
        if (definition)
          return { definition, name, args, earlier: args.length - selector.args.length };
      }
      selectorIndex++;
    }
    const end =
      reference.selectorRanges?.[selectors.findLastIndex((selector) => selector.kind === "Name")];
    return report(
      start && end && { ...start, end: end.end },
      `Unknown operator: \`${names.join("!")}'.`,
    );
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
    // TLC evaluates the LAMBDA SANY makes of a whole body selected by !: as the body's Java override.
    const isOverride =
      !local &&
      // Deviation from TLC: TLC passes the arguments of an instance with parameters to the override too, which fails.
      found.earlier === 0 &&
      arity > 0 &&
      selectorIndex === selectors.length - 2 &&
      selectors[selectorIndex + 1].kind === "Colon" &&
      !lookup(found.name);
    if (isLast || isOverride) return { definition, args: found.args, isOverride };
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
    selection.params.push(...(definition.kind === "Operator" ? definition.params : []));
    selection.args.push(...found.args);
    current = getDefinitionBody(definition);
    entered.push(definition);
    operatorIndex = selectorIndex;
    selectorIndex++;
    return undefined;
  };

  const followLabels = () => {
    let owner = current;
    while (selectorIndex < selectors.length && !isFailed) {
      const selector = selectors[selectorIndex];
      if (selector.kind !== "Name") return;
      const range = reference.selectorRanges?.[selectorIndex];
      const found = owner && findLabel(owner, selector.name, [], []);
      const missing = `Cannot find label \`${selector.name}'.`;
      if (!found && isLeftToResolver(selector)) {
        isFailed = true;
        return;
      }
      if (!found) return report(range, missing);
      found.applications.forEach((application) => checkNull(application, missing, true));
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
      const next = selectors[selectorIndex + 1];
      owner = found.label.body;
      current = next === undefined || next.kind === "Name" ? found.label : found.label.body;
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
    if (selections.has(current)) checkNull(current, noOperands, true);
    current = enterScopes(current);
    if (current.kind === "Label") {
      current = current.body;
      // SANY checks the body of a label it passes against the selector before it.
      checkNull(
        current,
        `An unexpected null node specified by '${getSelectorName(selectors[selectorIndex - 1])}'.\nThis is probably due to a previous error.`,
        false,
        selectorIndex - 1,
      );
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
    if (current.kind === "Lambda" && current.operator !== undefined) {
      report(range, "Trying to select subexpression of an operator argument.");
      return;
    }
    if (current.kind === "Lambda" && selector.kind !== "Bound" && selector.kind !== "At") {
      // Deviation from SANY: SANY names a numbered selector here by its syntax node, N_StructOp; tla-ts names it by its number, as the CLI does.
      const name = selector.kind === "Operand" ? selector.operand : getSelectorName(selector);
      report(range, `Cannot use !${name} to select subexpression of a LAMBDA.`);
      return;
    }
    if (
      current.kind === "Lambda" &&
      selector.kind === "Bound" &&
      selector.args.length !== current.params.length
    ) {
      report(
        range,
        `Selector with ${selector.args.length} arguments used for LAMBDA expression taking ${current.params.length} arguments.`,
      );
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
    const index = getOperandIndex(selector.operand, operands?.length ?? 0);
    const operand = operands?.[index];
    if (!operand) {
      report(range, nonexistent);
      return;
    }
    const arity =
      current.kind === "Apply"
        ? (getCalleeParams(current, findCallee(current.operator))?.[index]?.arity ?? 0)
        : 0;
    current = arity > 0 ? getOperatorArgument(operand, arity) : operand;
  };

  const first = enterDefinition(undefined);
  if (isFailed) return reference;
  if (first) {
    return applyDefinition(first.definition, { ...selection, args: first.args }, first.isOverride);
  }
  followLabels();
  while (selectorIndex < selectors.length && !isFailed) {
    const selector = selectors[selectorIndex];
    if (selector.kind === "Name") {
      while (current?.kind === "Label") current = current.body;
      current = current && enterScopes(current);
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
        return applyDefinition(
          last.definition,
          { ...selection, args: [...selection.args, ...last.args] },
          last.isOverride,
        );
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
    if (isLeftToResolver(selector)) return reference;
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
  if (isFailed || isLeftToResolver(undefined)) return reference;
  if (!current) throw createError("Subexpression selection failed", location);
  if (current.kind === "Lambda" && !isOperator) {
    report(location.range, "Selected operator argument when expression expected.");
    return reference;
  }
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
  const frames = entered.flatMap((definition) =>
    definition.kind === "Operator" && definition.body !== current
      ? (substitutionFrames.get(definition.body) ?? [])
      : [],
  );
  const body =
    current.kind === "Lambda"
      ? {
          ...current,
          body: wrapLets(withSubstitutionFrames(current.body, frames), selection.lets, location),
        }
      : wrapLets(withSubstitutionFrames(current, frames), selection.lets, location);
  const share = (expression: Expression): Expression => ({
    kind: "Selection",
    expression,
    // SANY's $Nop, which TLC's call stack shows at the reference, wraps only a selection without parameters.
    location:
      selection.params.length === 0 && body.kind !== "Lambda"
        ? location
        : getHiddenLocation(location),
  });
  // SANY selects a LAMBDA itself rather than wrapping it in $Nop, so the selection keeps its arity.
  const selected = createApplication(
    selection,
    body.kind !== "Lambda"
      ? share(body)
      : { ...body, body: selections.has(current) ? body.body : share(body.body), location },
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
  getStandardDefinition: Lookup,
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
        resolveDefinition(definition, (child) =>
          resolveSubexpressions(child, local, getStandardDefinition, isLocalGoal),
        ),
      ),
    );
    const mapped = {
      ...expression,
      definitions: resolved,
      body: resolveSubexpressions(expression.body, local, getStandardDefinition, isLocalGoal),
    };
    return mapped.instances
      ? {
          ...mapped,
          instances: mapped.instances.map((instance) =>
            resolveInstance(instance, local, getStandardDefinition, isLocalGoal),
          ),
        }
      : mapped;
  }
  const resolveArguments = (args: Expression[], params: OperatorParam[] | undefined) =>
    args.map((arg, index) =>
      resolveSubexpressions(
        arg,
        lookup,
        getStandardDefinition,
        isGoal,
        params !== undefined && params[index]?.arity !== 0,
      ),
    );
  const getSelectorParams = (selectors: Selector[], isLast: boolean) => {
    const name = selectors.every((selector) => selector.kind === "Name")
      ? selectors.map(getSelectorName).join("!")
      : undefined;
    const callee =
      name === undefined
        ? undefined
        : (lookup(name) ?? (isLast ? undefined : getStandardDefinition(name)));
    return callee?.kind === "Operator" ? callee.params : undefined;
  };
  const rebuilt =
    expression.kind === "Apply"
      ? {
          ...expression,
          args: resolveArguments(
            expression.args,
            getCalleeParams(expression, lookup(expression.operator)),
          ),
        }
      : expression.kind === "Subexpression"
        ? {
            ...expression,
            selectors: expression.selectors.map((selector, index) =>
              "args" in selector
                ? {
                    ...selector,
                    args: resolveArguments(
                      selector.args,
                      getSelectorParams(
                        expression.selectors.slice(0, index + 1),
                        index === expression.selectors.length - 1,
                      ),
                    ),
                  }
                : selector,
            ),
          }
        : mapChildren(expression, (child) =>
            resolveSubexpressions(child, lookup, getStandardDefinition, isGoal),
          );
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
  if (
    first?.kind === "Name" &&
    selectors[1].kind !== "Name" &&
    !lookup(first.name) &&
    !getStandardDefinition(first.name)
  ) {
    setGeneratedArguments(0);
    return mapped;
  }
  const selected = selectSubexpression(
    selectors,
    lookup,
    getStandardDefinition,
    mapped,
    isOperator,
  );
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
  getStandardDefinition: Lookup,
  isGoal: (name: string) => boolean,
): Instance => ({
  ...instance,
  substitutions: instance.substitutions.map((substitution) => ({
    ...substitution,
    expression: resolveSubexpressions(
      substitution.expression,
      lookup,
      getStandardDefinition,
      isGoal,
      true,
    ),
  })),
});

export const resolveInstanceSubexpressions = (instance: Instance, module: Module): Instance =>
  resolveInstance(
    instance,
    (name) => module.definitions.find((definition) => definition.name === name),
    () => undefined,
    () => false,
  );

export const createModuleSubexpressions = (
  module: Module,
  expand: ((expression: Expression) => Expression) | undefined,
  getAvailable: Lookup,
  getStandardDefinition: Lookup,
  isBoundBefore: (name: string, location: SourceLocation) => boolean,
) => {
  const createLookup = (definitions: Definition[]): Lookup => {
    const byName = new Map(
      definitions.toReversed().map((definition) => [definition.name, definition]),
    );
    return (name) => {
      const definition = byName.get(name);
      return definition && !isBoundBefore(name, definition.location) ? definition : undefined;
    };
  };
  const goals = new Set(
    module.theorems.flatMap((theorem) =>
      theorem.name !== undefined && theorem.statement.kind === "AssumeProve" ? [theorem.name] : [],
    ),
  );
  const clauses = module.theorems.flatMap((theorem): Definition[] => {
    const statement = theorem.statement;
    if (theorem.name === undefined || statement.kind !== "AssumeProve") return [];
    return [
      {
        kind: "Operator",
        name: theorem.name,
        params: [],
        body: getAssumeProveExpression(statement),
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
  const getExpanded = (expression: Expression) => (expand ? expand(expression) : expression);
  const ordered = [
    ...module.definitions.map((definition) => ({ definition, isClause: false })),
    ...clauses.map((definition) => ({ definition, isClause: true })),
  ].toSorted((left, right) =>
    compareLocations(left.definition.location, right.definition.location),
  );
  const getOwnDefinition = createLookup(module.definitions);
  const getModuleDefinition = createLookup(ordered.map((entry) => entry.definition));
  const proofLookup: Lookup = (name) => {
    const definition = getOwnDefinition(name) ?? getAvailable(name);
    return definition?.kind === "Operator" && getAssumeProveBody(definition.body)
      ? undefined
      : definition;
  };
  const definitionLookup: Lookup = (name) => getModuleDefinition(name) ?? getAvailable(name);
  const resolve = (expression: Expression, location: SourceLocation) =>
    resolveSubexpressions(
      expression,
      getVisibleLookup(definitionLookup, location),
      getStandardDefinition,
      () => false,
    );
  const createProofResolver = (lookup: Lookup) => {
    const isProofGoal = (name: string) => goals.has(name) || !lookup(name);
    const resolveInProof = (expression: Expression) =>
      resolveSubexpressions(expression, lookup, getStandardDefinition, isProofGoal);
    const resolveFacts = (facts: Fact[]) => {
      const resolved = facts.map((fact) =>
        fact.kind === "ModuleFact" ? fact : resolveInProof(fact),
      );
      factReferences.set(resolved, facts);
      return resolved;
    };
    const resolveDefs = (defs: Fact[]) =>
      defs.map((def) => {
        if (def.kind === "ModuleFact") return def;
        const resolved = resolveSubexpressions(
          def,
          lookup,
          getStandardDefinition,
          isProofGoal,
          true,
        );
        const errors = defEntryErrors.get(def);
        if (errors) defEntryErrors.set(resolved, errors);
        return resolved;
      });
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
          return { ...body, facts: resolveFacts(body.facts), defs: resolveDefs(body.defs) };
        case "Instance":
          return resolveInstance(body, lookup, getStandardDefinition, isProofGoal);
        case "Define": {
          const defined: Definition[] = [];
          const local = createProofResolver(
            (name) => defined.find((definition) => definition.name === name) ?? lookup(name),
          );
          return {
            ...body,
            definitions: body.definitions.map((definition) => {
              if (definition.kind === "Instance") {
                return resolveInstance(
                  definition,
                  local.lookup,
                  getStandardDefinition,
                  local.isProofGoal,
                );
              }
              const resolved = resolveDefinition(definition, local.resolveInProof);
              defined.push(resolved);
              return resolved;
            }),
          };
        }
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
      if (proof?.kind === "By") {
        return { ...proof, facts: resolveFacts(proof.facts), defs: resolveDefs(proof.defs) };
      }
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
    return {
      lookup,
      isProofGoal,
      resolveInProof,
      resolveFacts,
      resolveDefs,
      resolveStatement,
      resolveStep,
      resolveProof,
    };
  };
  const isMapped = (expression: Expression) =>
    containsReference(expression) || (expand !== undefined && hasLetInstance(expression));
  let resolvedCount = 0;
  const resolveDefinitionsBefore = (location: SourceLocation | undefined) => {
    for (; resolvedCount < ordered.length; resolvedCount++) {
      const entry = ordered[resolvedCount];
      const definition = entry.definition;
      if (location && !isBefore(definition.location, location)) return;
      if (!getDefinitionExpressions(definition).some(isMapped)) continue;
      resolvedDefinitions.set(
        definition,
        resolveDefinition(definition, (expression) =>
          resolve(entry.isClause ? expression : getExpanded(expression), definition.location),
        ),
      );
    }
  };
  return {
    getAssumeProve: (name: string) => {
      const clause = clauses.find((definition) => definition.name === name);
      return clause && (resolvedDefinitions.get(clause) ?? clause).body;
    },
    getDefinitionsBefore: (location: SourceLocation): Lookup => {
      resolveDefinitionsBefore(location);
      return (name) => {
        const definition = getModuleDefinition(name);
        return definition && isBefore(definition.location, location)
          ? (resolvedDefinitions.get(definition) ?? definition)
          : undefined;
      };
    },
    resolve: (): Module => {
      resolveDefinitionsBefore(undefined);
      // A module with nothing to resolve stays itself, so that a check links a prepared module as it is.
      if (
        resolvedDefinitions.size === 0 &&
        module.theorems.length === 0 &&
        module.uses.length === 0 &&
        !module.assumptions.some((assumption) => isMapped(assumption.expression))
      ) {
        return module;
      }
      const getSharedBody = (statement: Expression | AssumeProve) => {
        const definition = module.definitions.find((candidate) => candidate.body === statement);
        return definition && (resolvedDefinitions.get(definition) ?? definition).body;
      };
      const assumptions = new Map(
        module.assumptions.map((assumption) => {
          const shared = getSharedBody(assumption.expression);
          if (shared) return [assumption, { ...assumption, expression: shared }];
          return [
            assumption,
            isMapped(assumption.expression)
              ? {
                  ...assumption,
                  expression: resolve(getExpanded(assumption.expression), assumption.location),
                }
              : assumption,
          ];
        }),
      );
      const theorems = new Map(
        module.theorems.map((theorem) => {
          const resolver = createProofResolver(getVisibleLookup(proofLookup, theorem.location));
          const statement = theorem.statement;
          return [
            theorem,
            {
              ...theorem,
              statement:
                getSharedBody(statement) ??
                (statement.kind === "AssumeProve"
                  ? resolver.resolveStatement(statement)
                  : resolver.resolveStatement(getExpanded(statement))),
              proof:
                theorem.proof &&
                createProofResolver(
                  getVisibleLookup(proofLookup, theorem.proof.location),
                ).resolveProof(theorem.proof),
            },
          ];
        }),
      );
      return {
        ...module,
        units: module.units.map((unit) => {
          if (unit.kind === "Definition") {
            const definition = resolvedDefinitions.get(unit.definition);
            return definition ? { ...unit, definition } : unit;
          }
          if (unit.kind === "Assumption") {
            return { ...unit, assumption: assumptions.get(unit.assumption) ?? unit.assumption };
          }
          return unit.kind === "Theorem"
            ? { ...unit, theorem: theorems.get(unit.theorem) ?? unit.theorem }
            : unit;
        }),
        definitions: module.definitions.map(
          (definition) => resolvedDefinitions.get(definition) ?? definition,
        ),
        assumptions: [...assumptions.values()],
        theorems: [...theorems.values()],
        uses: module.uses.map((use) => {
          const resolver = createProofResolver(getVisibleLookup(proofLookup, use.location));
          return {
            ...use,
            facts: resolver.resolveFacts(use.facts),
            defs: resolver.resolveDefs(use.defs),
          };
        }),
      };
    },
  };
};
