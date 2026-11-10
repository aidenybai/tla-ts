import {
  getChildren,
  isLocallyResolved,
  type AssumeProve,
  type Bound,
  type BoundPattern,
  type Declaration,
  type Definition,
  type Expression,
  type Fact,
  type Instance,
  type LabelExpression,
  type Module,
  type NewSymbol,
  type OperatorParam,
  type Proof,
  type ProofStep,
  type Selector,
  type SourceLocation,
  type SourceRange,
  type Theorem,
} from "./ast";
import { formatRange, TlaSyntaxError, type SanyError } from "./errors";

export type SymbolKind =
  | "Builtin"
  | "Constant"
  | "Variable"
  | "Definition"
  | "Instance"
  | "Theorem"
  | "Parameter"
  | `New${NewSymbol["level"]}`;

interface Binding {
  kind: SymbolKind;
  arity: number;
  params?: number[];
  range?: SourceRange;
}

export interface ModuleSymbol extends Binding {
  key: string;
}

export type Symbols = Map<string, ModuleSymbol>;

interface Goal {
  statement: Expression | AssumeProve;
  isSuffices: boolean;
  isInProof: boolean;
}

interface LocalName extends Binding {
  name: string;
  parent: LocalName | undefined;
  goal?: Goal;
  isPending?: boolean;
  isNonFact?: boolean;
}

interface ModuleBinding extends Binding {
  position: SourceLocation;
  isPending?: boolean;
}

interface Unit {
  imported: Symbols;
  getInstance: (instance: Instance) => InstancedModule;
  definitions: Map<string, Definition>;
  getKey: (definition: Definition) => string;
  location: SourceLocation;
  self: Definition | undefined;
  facts: Set<string>;
  goals: Map<string, Goal>;
  bindings: Map<string, ModuleBinding>;
  errors: SanyError[];
  warnings: SanyError[];
  hasLabelScope: boolean;
  isLabelForbidden: boolean;
  isInExcept: boolean;
  labelParams: string[];
  labels: Set<string>;
  isGenerated: boolean;
}

interface SelectionError {
  args: Expression[];
  error: SanyError;
}

interface SelectionState {
  node: Expression | NewSymbol | AssumeProve;
  isGoal: boolean;
  isSufficesOpen: boolean;
}

type Reference = Expression & { kind: "Identifier" | "Apply" | "Subexpression" };

export const LOCAL_RESOLUTION = { kind: "Local" } as const;

export const selections = new WeakSet<Expression>();
export const selectionErrors = new WeakMap<Expression, SelectionError>();

const renamedArities = new WeakMap<Expression, number>();

export const KEY_SEPARATOR = "@";

const isKey = (name: string) => {
  const index = name.lastIndexOf(KEY_SEPARATOR);
  return index > 0 && index < name.length - 1;
};

const CORE_SYMBOLS: Symbols = new Map(
  ["~>", "-+->", "\\cdot"].map((name) => [name, { key: name, arity: 2, kind: "Builtin" }]),
);

export const isBefore = (left: SourceLocation, right: SourceLocation) =>
  left.line < right.line || (left.line === right.line && left.column < right.column);

export const getArity = (definition: Definition) =>
  definition.kind === "Operator" ? definition.params.length : 0;

export const getParamArities = (definition: Definition) =>
  definition.kind === "Operator" ? definition.params.map((param) => param.arity) : [];

const isInstantiated = (definition: Definition) => definition.name.includes("!");

const lookupLocal = (scope: LocalName | undefined, name: string) => {
  for (let current = scope; current; current = current.parent) {
    if (current.name === name) return current;
  }
  return undefined;
};

const getModuleBinding = (name: string, unit: Unit, range: SourceRange | undefined) => {
  const binding = unit.bindings.get(name);
  return binding &&
    isBefore(binding.position, unit.location) &&
    (!range || isBefore(binding.position, range.start))
    ? binding
    : undefined;
};

const isSameRange = (left: SourceRange | undefined, right: SourceRange | undefined) =>
  left !== undefined && right !== undefined && formatRange(left) === formatRange(right);

const isBindable = (name: string, current: Binding | undefined, added: Binding, unit: Unit) => {
  if (current === undefined) return true;
  if (isSameRange(current.range, added.range)) return false;
  const range = added.range;
  if (range === undefined || unit.isGenerated || (current.kind !== "Builtin" && !current.range)) {
    return true;
  }
  const location = formatRange(range);
  const existing = current.range && formatRange(current.range);
  if (current.kind === "Builtin") {
    unit.errors.push({
      location,
      message: `Symbol ${name} is a built-in operator, and cannot be redefined.`,
    });
  } else if (
    added.kind === "Parameter" ||
    current.kind !== added.kind ||
    current.arity !== added.arity
  ) {
    unit.errors.push({
      location,
      message: `Multiply-defined symbol '${name}': this definition or declaration conflicts \nwith the one at ${existing}.`,
    });
  } else {
    unit.warnings.push({
      location,
      message: `Multiple declarations or definitions for symbol ${name}.  \nThis duplicates the one at ${existing}.`,
    });
  }
  return false;
};

const bindName = (
  scope: LocalName | undefined,
  name: string,
  added: Binding,
  unit: Unit,
): LocalName | undefined =>
  isBindable(
    name,
    lookupLocal(scope, name) ?? getModuleBinding(name, unit, added.range),
    added,
    unit,
  )
    ? { ...added, name, parent: scope }
    : scope;

const bindModuleName = (name: string, added: Binding, unit: Unit) => {
  if (isBindable(name, unit.bindings.get(name), added, unit)) {
    unit.bindings.set(name, { ...added, position: unit.location });
  }
};

const bindNames = (
  scope: LocalName | undefined,
  names: string[],
  ranges: SourceRange[] | undefined,
  unit: Unit,
) =>
  names.reduce(
    (parent, name, index) =>
      bindName(parent, name, { kind: "Parameter", arity: 0, range: ranges?.[index] }, unit),
    scope,
  );

const bindParams = (scope: LocalName | undefined, params: OperatorParam[], unit: Unit) =>
  params.reduce(
    (parent, param) =>
      bindName(
        parent,
        param.name,
        { kind: "Parameter", arity: param.arity, range: param.location?.range },
        unit,
      ),
    scope,
  );

export const getPatternNames = (pattern: BoundPattern) =>
  pattern.kind === "Name" ? [pattern.name] : pattern.names;

export const getBoundNames = (bounds: Bound[]) =>
  bounds.flatMap((bound) => getPatternNames(bound.pattern));

const getVisibleDefinition = (name: string, unit: Unit) => {
  const definition = unit.definitions.get(name);
  const isVisible =
    definition !== undefined &&
    (definition === unit.self
      ? definition.kind === "Function" || definition.isRecursive
      : definition.isRecursive || isBefore(definition.location, unit.location));
  return isVisible ? definition : undefined;
};

const findSymbol = (name: string, unit: Unit): ModuleSymbol | undefined => {
  const definition = getVisibleDefinition(name, unit);
  return definition
    ? {
        key: unit.getKey(definition),
        arity: getArity(definition),
        params: getParamArities(definition),
        kind: "Definition",
      }
    : unit.imported.get(name);
};

const findBinding = (name: string, scope: LocalName | undefined, unit: Unit): Binding | undefined =>
  lookupLocal(scope, name) ?? findSymbol(name, unit);

const getNameRange = (location: SourceLocation, name: string): SourceRange => ({
  module: location.range?.module ?? "",
  start: location,
  end: { line: location.line, column: location.column + name.length - 1 },
});

const getSpelledNameRange = (
  expression: Expression & { kind: "Identifier" | "Apply" | "OperatorReference" },
  name: string,
): SourceRange => {
  const selectorRange =
    expression.kind === "OperatorReference" ? undefined : expression.selectorRanges?.at(-1);
  return selectorRange
    ? { module: selectorRange.module, start: expression.location, end: selectorRange.end }
    : getNameRange(expression.location, expression.spelling ?? name);
};

const getFixity = (expression: Expression) => {
  if (expression.kind !== "Apply") return undefined;
  if (expression.args.length === 2) return "infix";
  if (expression.args.length !== 1) return undefined;
  return isBefore(expression.location, expression.args[0].location) ? "prefix" : "postfix";
};

const isOperatorSymbol = (name: string) => !/^[\p{L}\d_]/u.test(name);

const isStepName = (name: string) =>
  name.startsWith("<") && ((name[1] >= "0" && name[1] <= "9") || name[1] === "*");

export const getOperandIndex = (operand: number | "<<" | ">>", count: number) => {
  if (typeof operand === "number") return operand >= 1 && operand <= count ? operand - 1 : -1;
  if (operand === "<<") return count > 0 ? 0 : -1;
  return count === 2 ? 1 : -1;
};

export const getNameSelectors = (
  name: string,
  args: Expression[],
  counts: number[] | undefined,
): Selector[] => {
  const parts = name.split("!");
  const partCounts =
    counts ?? parts.map((_, index) => (index === parts.length - 1 ? args.length : 0));
  return parts.map((part, index) => {
    const start = partCounts.slice(0, index).reduce((sum, count) => sum + count, 0);
    return { kind: "Name", name: part, args: args.slice(start, start + partCounts[index]) };
  });
};

const getSelectors = (reference: Reference): Selector[] =>
  reference.kind === "Subexpression"
    ? reference.selectors
    : reference.kind === "Identifier"
      ? getNameSelectors(reference.name, [], undefined)
      : getNameSelectors(reference.operator, reference.args, reference.argumentCounts);

const getBoundSets = (bounds: Bound[]) =>
  bounds
    .filter((bound, index) => index === 0 || bounds[index - 1].set !== bound.set)
    .map((bound) => bound.set);

export const getBinder = (
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

export const getOperands = (expression: Expression): Expression[] | undefined => {
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

const isReference = (expression: Expression): expression is Reference =>
  expression.kind === "Identifier" ||
  expression.kind === "Apply" ||
  expression.kind === "Subexpression";

const isInScopeOfDeclaration = (assumeProve: AssumeProve, clause: number) =>
  assumeProve.assumptions.slice(0, clause).some((assumption) => assumption.kind === "NewSymbol");

const findLabel = (expression: Expression, name: string): LabelExpression | undefined => {
  if (expression.kind === "Label") return expression.name === name ? expression : undefined;
  if (expression.kind === "Lambda") return undefined;
  if (expression.kind === "Let") return findLabel(expression.body, name);
  return getChildren(expression).reduce<LabelExpression | undefined>(
    (found, child) => found ?? findLabel(child, name),
    undefined,
  );
};

const findClauseLabel = (
  clause: Expression | NewSymbol | AssumeProve,
  name: string,
  isForbidden: boolean,
): LabelExpression | undefined => {
  if (clause.kind === "AssumeProve") {
    return [...clause.assumptions, clause.conclusion].reduce<LabelExpression | undefined>(
      (found, inner, index) =>
        found ?? findClauseLabel(inner, name, isForbidden || isInScopeOfDeclaration(clause, index)),
      undefined,
    );
  }
  if (isForbidden) return undefined;
  if (clause.kind === "NewSymbol") return clause.set && findLabel(clause.set, name);
  return findLabel(clause, name);
};

const getLabelBody = (expression: Expression): Expression =>
  expression.kind === "Label" ? getLabelBody(expression.body) : expression;

const getOperandName = (operand: number | "<<" | ">>") =>
  typeof operand === "number" ? `argument selector ${operand}` : operand;

const SCOPE_MESSAGE = "within the scope of a declaration\n from outside that declaration's scope.";

const checkSelection = (
  reference: Reference,
  selectors: Selector[],
  goal: Goal,
  scope: LocalName | undefined,
  unit: Unit,
  isFact: boolean,
) => {
  const report = (index: number | undefined, message: string) => {
    const range =
      (index === undefined ? undefined : reference.selectorRanges?.[index]) ??
      reference.location.range;
    if (range) unit.errors.push({ location: formatRange(range), message });
  };
  const isOutOfScope = goal.isSuffices === goal.isInProof;
  const statement = goal.statement;
  const state: SelectionState = {
    node: statement,
    isGoal: true,
    isSufficesOpen: goal.isSuffices,
  };
  for (const [offset, selector] of selectors.slice(1).entries()) {
    const index = offset + 1;
    const node = state.node;
    if (selector.kind === "Name") {
      if (selectors[index - 1].kind !== "Name") {
        const isLet =
          node.kind !== "NewSymbol" &&
          node.kind !== "AssumeProve" &&
          getLabelBody(node).kind === "Let";
        return isLet
          ? undefined
          : report(index - 1, "A name selector here must be from a LET clause.");
      }
      const clauses =
        statement.kind === "AssumeProve"
          ? [...statement.assumptions, statement.conclusion]
          : [statement];
      const found =
        index === 1
          ? clauses
              .map((clause, position) => ({
                position,
                label: findClauseLabel(clause, selector.name, false),
              }))
              .find((item) => item.label !== undefined)
          : {
              position: 0,
              label: node.kind === "Label" ? findLabel(node.body, selector.name) : undefined,
            };
      if (!found?.label) return report(index, `Cannot find label \`${selector.name}'.`);
      if (
        index === 1 &&
        statement.kind === "AssumeProve" &&
        isInScopeOfDeclaration(statement, found.position) &&
        isOutOfScope
      ) {
        return report(
          1,
          `Accessing subexpression labeled \`${selector.name}' of ASSUME/PROVE clause ${SCOPE_MESSAGE}`,
        );
      }
      if (selector.args.length !== found.label.params.length) {
        return report(index, `Label \`${selector.name}' used with wrong number of arguments.`);
      }
      state.node = found.label;
      state.isGoal = false;
      state.isSufficesOpen = false;
      continue;
    }
    if (selector.kind !== "Operand") return;
    const operand = getOperandName(selector.operand);
    if (state.isSufficesOpen) {
      if (getOperandIndex(selector.operand, 1) !== 0) {
        return report(
          index,
          node.kind === "AssumeProve"
            ? "Accessing non-existent subexpression of a SUFFICES"
            : `Nonexistent operand specified by \`${operand}'.`,
        );
      }
      state.isSufficesOpen = false;
      continue;
    }
    if (node.kind === "NewSymbol") return;
    if (node.kind !== "AssumeProve") {
      const expression = getLabelBody(node);
      if (["Number", "Decimal", "String"].includes(expression.kind)) {
        return report(index, "Selecting subexpression of expression that has none.");
      }
      const kind =
        expression.kind === "Identifier"
          ? findBinding(expression.name, scope, unit)?.kind
          : undefined;
      if (kind === "Variable" || kind?.startsWith("New")) {
        return report(index, `Choosing operand \`${operand}' of subexpression with no operands.`);
      }
      const sets = getBinder(expression)?.sets;
      const operands =
        expression.kind === "Identifier"
          ? []
          : sets
            ? sets.length > 0
              ? sets
              : undefined
            : expression.kind === "Except"
              ? undefined
              : getOperands(expression);
      if (!operands) return;
      const position = getOperandIndex(selector.operand, operands.length);
      if (position === -1) return report(index, `Nonexistent operand specified by \`${operand}'.`);
      state.node = operands[position];
      state.isGoal = false;
      continue;
    }
    const clauses = [...node.assumptions, node.conclusion];
    const position = getOperandIndex(selector.operand, clauses.length);
    if (position === -1) return report(index, `Nonexistent operand specified by \`${operand}'.`);
    if (isInScopeOfDeclaration(node, position) && (!state.isGoal || isOutOfScope)) {
      return report(index, `Accessing ASSUME/PROVE clause ${SCOPE_MESSAGE}`);
    }
    const clause = clauses[position];
    if (clause.kind === "NewSymbol" && index !== selectors.length - 1) {
      return report(index, "Selected a subexpression of a NEW clause of an ASSUME.");
    }
    state.node = clause;
    state.isGoal = false;
  }
  if (isFact) return;
  if (state.node.kind === "AssumeProve") {
    report(undefined, "Selected ASSUME/PROVE instead of expression.");
  }
  if (state.node.kind === "NewSymbol") {
    report(undefined, "Selected a NEW declaration as an expression or operator.");
  }
};

const isLabelReported = (label: LabelExpression, unit: Unit) => {
  const message = unit.isGenerated
    ? undefined
    : !unit.hasLabelScope
      ? "Label not in definition or proof step."
      : unit.isLabelForbidden
        ? "Label not allowed within scope of declaration in nested ASSUME/PROVE."
        : unit.isInExcept
          ? "Labels inside EXCEPT clauses are not yet implemented."
          : undefined;
  if (message === undefined || !label.location.range) return false;
  unit.errors.push({ location: formatRange(label.location.range), message });
  return true;
};

const checkLabel = (label: LabelExpression, scope: LocalName | undefined, unit: Unit) => {
  const range = label.location.range;
  if (!range || unit.isGenerated) return;
  const location = formatRange(range);
  const legal = label.params.filter((param, index) => {
    const isLegal = lookupLocal(scope, param)?.kind === "Parameter";
    const paramRange = label.paramRanges?.[index];
    if (!isLegal && paramRange) {
      unit.errors.push({
        location: formatRange(paramRange),
        message: `Illegal parameter ${param} of label \`${label.name}'.`,
      });
    }
    return isLegal;
  });
  legal
    .filter((param, index) => legal.indexOf(param) !== index)
    .forEach((param) =>
      unit.errors.push({
        location,
        message: `Repeated formal parameter ${param} \nin label \`${label.name}'.`,
      }),
    );
  unit.labelParams
    .filter((param) => !legal.includes(param))
    .forEach((param) =>
      unit.errors.push({
        location,
        message: `Label ${label.name} must contain formal parameter \`${param}'.`,
      }),
    );
  const extra = [
    ...new Set(legal.filter((param) => !unit.labelParams.includes(param))),
    ...label.params.filter((param) => !legal.includes(param)),
  ];
  if (extra.length > 0) {
    unit.errors.push({
      location,
      message: `Label ${label.name} declares extra parameter(s)  ${extra.map((param) => `${param}  `).join("")}`,
    });
  }
  if (unit.labels.has(label.name)) {
    unit.errors.push({ location, message: `Duplicate label \`${label.name}'.` });
  }
  unit.labels.add(label.name);
};

const checkReference = (
  expression: Expression,
  scope: LocalName | undefined,
  unit: Unit,
  isFact: boolean,
) => {
  if (!isReference(expression)) return false;
  const selectors = getSelectors(expression);
  const first = selectors[0];
  const goal =
    selectors.length > 1 && first.kind === "Name"
      ? (lookupLocal(scope, first.name)?.goal ?? unit.goals.get(first.name))
      : undefined;
  if (goal) checkSelection(expression, selectors, goal, scope, unit, isFact);
  return goal !== undefined;
};

const getSymbolArity = (
  expression: Expression & { kind: "Identifier" | "Apply" | "OperatorReference" },
  name: string,
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const location = expression.location;
  if (isSelectionReported(expression, scope, unit)) return undefined;
  const renamed = renamedArities.get(expression);
  if (renamed !== undefined) return renamed;
  if (isKey(name)) return expression.kind === "Apply" ? expression.args.length : 0;
  const local = lookupLocal(scope, name);
  if (local?.isNonFact) {
    unit.errors.push({
      location: formatRange(getSpelledNameRange(expression, name)),
      message: "Step number of non-expression step used as an expression.",
    });
    return undefined;
  }
  if (checkReference(expression, scope, unit, false) || (isStepName(name) && local)) {
    return expression.kind === "Apply" ? expression.args.length : 0;
  }
  if (local && expression.kind !== "OperatorReference") expression.resolution = LOCAL_RESOLUTION;
  if (local) return local.arity;
  const symbol = findSymbol(name, unit);
  if (symbol) {
    if (expression.kind === "Identifier") expression.name = symbol.key;
    else expression.operator = symbol.key;
    renamedArities.set(expression, symbol.arity);
    return symbol.arity;
  }
  const prefix = name.includes("!") ? name.slice(0, name.indexOf("!")) : "";
  const isSelected =
    prefix !== "" &&
    (lookupLocal(scope, prefix) !== undefined ||
      findSymbol(prefix, unit) !== undefined ||
      unit.facts.has(prefix));
  if (isSelected) {
    return expression.kind === "Apply" ? expression.args.length : 0;
  }
  const spelling = (expression.kind === "Identifier" ? undefined : expression.spelling) ?? name;
  const range = formatRange(
    expression.kind === "Apply" && spelling === "-."
      ? getNameRange(location, "-")
      : getSpelledNameRange(expression, name),
  );
  if (!isOperatorSymbol(name) || isStepName(name)) {
    unit.errors.push({ location: range, message: `Unknown operator: \`${name}'.` });
    return undefined;
  }
  unit.errors.push({
    location: range,
    message: `Could not find declaration or definition of symbol '${spelling}'.`,
  });
  const fixity = getFixity(expression);
  if (fixity && location.range) {
    unit.errors.push({
      location: formatRange(location.range),
      message: `Couldn't resolve ${fixity} operator symbol \`${spelling}'.`,
    });
  }
  return undefined;
};

const resolveBounds = (bounds: Bound[], scope: LocalName | undefined, unit: Unit) => {
  bounds.forEach((bound) => resolveExpression(bound.set, scope, unit));
  return bounds.reduce(
    (current, bound) =>
      bindNames(current, getPatternNames(bound.pattern), bound.pattern.ranges, unit),
    scope,
  );
};

const isReferenced = (expression: Expression, name: string): boolean =>
  (expression.kind === "Identifier" && expression.name === name && isLocallyResolved(expression)) ||
  getChildren(expression).some((child) => isReferenced(child, name));

const markRecursiveConstructions = (expression: Expression, name: string): void => {
  if (expression.kind === "FunctionConstruction" && isReferenced(expression.body, name)) {
    expression.isRecursive = true;
  }
  getChildren(expression).forEach((child) => markRecursiveConstructions(child, name));
};

const resolveDefinition = (
  definition: Definition,
  scope: LocalName | undefined,
  outer: Unit,
  recursive: Set<Binding>,
) => {
  const unit = {
    ...outer,
    hasLabelScope: true,
    labelParams: definition.kind === "Function" ? getBoundNames(definition.bounds) : [],
    labels: new Set<string>(),
  };
  const name = definition.name;
  const range = definition.location.range;
  const report = (message: string) => {
    if (range && !unit.isGenerated) unit.errors.push({ location: formatRange(range), message });
  };
  const inner =
    definition.kind === "Function"
      ? resolveBounds(definition.bounds, scope, unit)
      : bindParams(scope, definition.params, unit);
  const current = lookupLocal(inner, name) ?? getModuleBinding(name, unit, range);
  const isDeclared = current?.isPending === true && recursive.has(current);
  if (current?.isPending && !isDeclared) {
    report(
      `Recursive ${definition.kind === "Function" ? "function" : "operator"} ${name} defined at wrong LET/IN level.`,
    );
  } else if (current && !isDeclared) {
    report(
      definition.kind === "Function"
        ? `Function name \`${name}' already defined or declared.`
        : `Operator ${name} already defined or declared.`,
    );
  }
  if (definition.kind === "Function") {
    resolveExpression(
      definition.body,
      { name, kind: "Parameter", arity: 0, range, parent: inner },
      unit,
    );
    markRecursiveConstructions(definition.body, name);
    definition.isSelfReferential = isReferenced(definition.body, name);
  } else resolveExpression(definition.body, inner, unit);
  if (current && isDeclared) {
    current.isPending = false;
    current.range = range;
    return false;
  }
  return definition.kind === "Function"
    ? current === undefined
    : isBindable(
        name,
        lookupLocal(scope, name) ?? getModuleBinding(name, unit, range),
        { kind: "Definition", arity: getArity(definition), range },
        unit,
      );
};

const resolveDefinitions = (
  definitions: Definition[],
  scope: LocalName | undefined,
  unit: Unit,
  instances: Instance[] = [],
) => {
  const recursive = new Set<Binding>();
  const declared = definitions
    .filter((definition) => definition.isRecursive)
    .reduce<LocalName | undefined>((parent, definition) => {
      if (lookupLocal(parent, definition.name)?.isPending) return parent;
      const local: LocalName = {
        name: definition.name,
        arity: getArity(definition),
        params: getParamArities(definition),
        kind: "Definition",
        parent,
        isPending: true,
      };
      recursive.add(local);
      return local;
    }, scope);
  const pending = unit.isGenerated ? [] : [...instances];
  const resolveInstances = (
    current: LocalName | undefined,
    isDue: (instance: Instance) => boolean,
  ) => {
    const count = pending.findIndex((instance) => !isDue(instance));
    return pending
      .splice(0, count === -1 ? pending.length : count)
      .reduce((parent, instance) => resolveLocalInstance(instance, parent, unit), current);
  };
  const resolved = definitions.reduce<LocalName | undefined>((previous, definition) => {
    const current = isKey(definition.name)
      ? previous
      : resolveInstances(previous, (instance) => !isBefore(definition.location, instance.location));
    const local: LocalName = {
      name: definition.name,
      arity: getArity(definition),
      kind: "Definition",
      range: definition.location.range,
      parent: current,
    };
    if (isInstantiated(definition)) return local;
    const isInstanced = instances.some((instance) => instance.location === definition.location);
    const isGenerated = unit.isGenerated || definition.isLocal || isKey(definition.name);
    const inner = isInstanced
      ? { ...unit, isGenerated: true, errors: [], warnings: [] }
      : isGenerated
        ? { ...unit, isGenerated }
        : unit;
    return resolveDefinition(definition, current, inner, recursive)
      ? { ...local, params: getParamArities(definition) }
      : current;
  }, declared);
  return resolveInstances(resolved, () => true);
};

const findInstance = (name: string, scope: LocalName | undefined, unit: Unit) => {
  const prefix = name.split("!")[0];
  const binding =
    prefix === name
      ? undefined
      : (lookupLocal(scope, prefix) ?? getModuleBinding(prefix, unit, undefined));
  return binding?.kind === "Instance" ? { name: prefix, arity: binding.arity } : undefined;
};

const isInstanceArityReported = (
  expression: Expression,
  scope: LocalName | undefined,
  unit: Unit,
) => {
  if (expression.kind !== "Identifier" && expression.kind !== "Apply") return false;
  const instance = findInstance(
    expression.kind === "Identifier" ? expression.name : expression.operator,
    scope,
    unit,
  );
  const count = expression.kind === "Apply" ? (expression.argumentCounts?.[0] ?? 0) : 0;
  if (!instance || count === instance.arity) return false;
  const range =
    (expression.kind === "Apply" ? expression.argumentRanges?.[0] : undefined) ??
    expression.location.range;
  if (range) {
    unit.errors.push({
      location: formatRange(range),
      message: `The operator ${instance.name} requires ${instance.arity} arguments.`,
    });
  }
  return true;
};

const resolveApply = (
  expression: Expression & { kind: "Apply" },
  scope: LocalName | undefined,
  unit: Unit,
) => {
  if (isInstanceArityReported(expression, scope, unit)) return;
  const operator = expression.operator;
  const callee = findBinding(operator, scope, unit);
  const arity = getSymbolArity(expression, operator, scope, unit);
  if (arity === undefined) return;
  if (arity !== expression.args.length) {
    unit.errors.push({
      location: formatRange(expression.argumentsRange ?? getSpelledNameRange(expression, operator)),
      message: `The operator ${operator} requires ${arity - (findInstance(operator, scope, unit)?.arity ?? 0)} arguments.`,
    });
    return;
  }
  const params = callee && (callee.kind === "Definition" ? callee.params : []);
  if (params === undefined) {
    expression.args.forEach((arg) => resolveArgument(arg, scope, unit));
    return;
  }
  const report = (range: SourceRange | undefined, message: string) => {
    if (range) unit.errors.push({ location: formatRange(range), message });
  };
  expression.args
    .map((arg, index) => {
      const expected = params[index] ?? 0;
      const range = arg.location.range;
      if (expected === 0) {
        // SANY fails here with an internal error, so tla-ts words it as it does for a name.
        if (arg.kind === "Lambda" && arg.operator !== undefined) {
          report(range, `The operator ${arg.operator} requires 1 arguments.`);
        } else if (arg.kind === "Lambda" && range) {
          report(range, "LAMBDA expression used where an expression is required.");
        } else if (arg.kind === "OperatorReference") {
          const argArity = getSymbolArity(arg, arg.operator, scope, unit);
          if (argArity !== undefined) {
            report(range, `The operator ${arg.operator} requires ${argArity} arguments.`);
          }
        } else resolveExpression(arg, scope, unit);
        return true;
      }
      if (arg.kind === "Lambda") {
        resolveExpression(arg, scope, unit);
        const isMatched = arg.params.length === expected;
        if (!isMatched && selections.has(arg)) {
          report(
            range,
            `Expected arity ${expected} but found operator of arity ${arg.params.length}.`,
          );
        } else if (!isMatched && range && arg.operator === undefined) {
          report(
            expression.selectorRanges?.at(-1) ?? getSpelledNameRange(expression, operator),
            `Lambda expression with arity ${arg.params.length} used as argument ${index + 1} of operator \`${operator}', \nbut an operator of arity ${expected} is required.`,
          );
        }
        return isMatched;
      }
      if (arg.kind === "Subexpression") {
        resolveExpression(arg, scope, unit);
        return true;
      }
      if (arg.kind === "Apply" && arg.argumentCounts?.at(-1) === 0) {
        const index = arg.argumentCounts.findIndex((count) => count > 0);
        report(
          arg.selectorRanges?.[index],
          `Selector \`${arg.operator.split("!")[index]}' should not have argument(s).`,
        );
        return false;
      }
      if (arg.kind !== "Identifier" && arg.kind !== "OperatorReference") {
        report(
          range,
          `An expression appears as argument number ${index + 1} (counting from 1) to operator '${operator}', in a position an operator is required.`,
        );
        return false;
      }
      const name = arg.kind === "Identifier" ? arg.name : arg.operator;
      const argParams = findBinding(name, scope, unit)?.params ?? [];
      const argArity = getSymbolArity(arg, name, scope, unit);
      if (arg.kind === "Identifier" && argArity !== undefined && argArity !== expected) {
        report(
          getSpelledNameRange(arg, name),
          `Expected arity ${expected} but found operator of arity ${argArity}.`,
        );
      }
      return argArity === expected && argParams.every((param) => param === 0);
    })
    .forEach((isMatched, index) => {
      if (!isMatched) {
        report(
          expression.location.range,
          `Argument number ${index + 1} to operator '${operator}' \nshould be a ${params[index]}-parameter operator.`,
        );
      }
    });
};

const resolveArgument = (arg: Expression, scope: LocalName | undefined, unit: Unit) => {
  if (arg.kind === "Identifier") getSymbolArity(arg, arg.name, scope, unit);
  else resolveExpression(arg, scope, unit);
};

const isSelectionReported = (expression: Expression, scope: LocalName | undefined, unit: Unit) => {
  const failed = selectionErrors.get(expression);
  if (!failed) return false;
  failed.args.forEach((arg) => resolveArgument(arg, scope, unit));
  unit.errors.push(failed.error);
  return true;
};

const resolveExpression = (
  expression: Expression,
  scope: LocalName | undefined,
  unit: Unit,
): void => {
  if (selections.has(expression) && !unit.isGenerated) {
    resolveExpression(expression, scope, { ...unit, isGenerated: true });
    return;
  }
  const resolveAll = (expressions: Expression[]) =>
    expressions.forEach((child) => resolveExpression(child, scope, unit));
  const bindLabelParams = (names: string[]) => ({
    ...unit,
    labelParams: [...unit.labelParams, ...names],
  });
  switch (expression.kind) {
    case "Number":
    case "Decimal":
    case "String":
    case "ExceptAt":
      return;
    case "Identifier": {
      if (isInstanceArityReported(expression, scope, unit)) return;
      const name = expression.name;
      const arity = getSymbolArity(expression, name, scope, unit);
      if (arity !== undefined && arity > 0) {
        unit.errors.push({
          location: formatRange(getSpelledNameRange(expression, name)),
          message: `The operator ${name} requires ${arity} arguments.`,
        });
      }
      return;
    }
    case "OperatorReference":
      getSymbolArity(expression, expression.operator, scope, unit);
      return;
    case "Apply":
      resolveApply(expression, scope, unit);
      return;
    case "Lambda":
      resolveExpression(
        expression.body,
        bindNames(scope, expression.params, expression.paramRanges, unit),
        bindLabelParams(expression.params),
      );
      return;
    case "And":
    case "Or":
      resolveAll(expression.operands);
      return;
    case "Prime":
    case "Unchanged":
    case "Enabled":
    case "Always":
    case "Eventually":
      resolveExpression(expression.expression, scope, unit);
      return;
    case "If":
      resolveAll([expression.condition, expression.consequent, expression.alternative]);
      return;
    case "Case":
      resolveAll(expression.arms.flatMap((arm) => [arm.condition, arm.body]));
      if (expression.other) resolveExpression(expression.other, scope, unit);
      return;
    case "Let":
      resolveExpression(
        expression.body,
        resolveDefinitions(expression.definitions, scope, unit, expression.instances),
        unit,
      );
      return;
    case "Forall":
    case "Exists":
    case "FunctionConstruction":
      resolveExpression(
        expression.body,
        resolveBounds(expression.bounds, scope, unit),
        bindLabelParams(getBoundNames(expression.bounds)),
      );
      return;
    case "UnboundedQuantifier":
      resolveExpression(
        expression.body,
        bindNames(scope, expression.names, expression.nameRanges, unit),
        bindLabelParams(expression.names),
      );
      return;
    case "Choose":
      if (expression.set) resolveExpression(expression.set, scope, unit);
      resolveExpression(
        expression.body,
        bindNames(scope, getPatternNames(expression.pattern), expression.pattern.ranges, unit),
        bindLabelParams(getPatternNames(expression.pattern)),
      );
      return;
    case "SetEnumeration":
    case "Tuple":
      resolveAll(expression.elements);
      return;
    case "SetFilter":
      resolveExpression(
        expression.predicate,
        resolveBounds([expression.bound], scope, unit),
        bindLabelParams(getPatternNames(expression.bound.pattern)),
      );
      return;
    case "SetMap":
      resolveExpression(
        expression.expression,
        resolveBounds(expression.bounds, scope, unit),
        bindLabelParams(getBoundNames(expression.bounds)),
      );
      return;
    case "FunctionSet":
      resolveAll([expression.domain, expression.range]);
      return;
    case "Record":
    case "RecordSet":
      expression.fields.forEach((field, index) => {
        if (expression.fields.slice(0, index).some((earlier) => earlier.name === field.name)) {
          unit.errors.push({
            location: formatRange(field.location.range ?? getNameRange(field.location, field.name)),
            message: "Non-unique fields in constructor.",
          });
        }
        resolveExpression(field.value, scope, unit);
      });
      return;
    case "Except":
      resolveExpression(expression.function, scope, unit);
      expression.updates.forEach((update) => {
        resolveAll(update.path.flatMap((step) => (step.kind === "Index" ? step.args : [])));
        resolveExpression(update.value, scope, { ...unit, isInExcept: true });
      });
      return;
    case "FunctionApplication":
      resolveAll([expression.function, ...expression.args]);
      return;
    case "FieldAccess":
      resolveExpression(expression.record, scope, unit);
      return;
    case "Product":
      resolveAll(expression.factors);
      return;
    case "BoxAction":
    case "AngleAction":
      resolveAll([expression.action, expression.subscript]);
      return;
    case "WeakFairness":
    case "StrongFairness":
      resolveAll([expression.subscript, expression.action]);
      return;
    case "Label":
      if (isLabelReported(expression, unit)) return;
      resolveExpression(expression.body, scope, { ...unit, labelParams: [], labels: new Set() });
      checkLabel(expression, scope, unit);
      return;
    case "Subexpression": {
      if (isSelectionReported(expression, scope, unit)) return;
      expression.selectors
        .flatMap((selector) => ("args" in selector ? selector.args : []))
        .forEach((arg) => resolveArgument(arg, scope, unit));
      checkReference(expression, scope, unit, false);
    }
  }
};

const checkFacts = (facts: Fact[], scope: LocalName | undefined, unit: Unit) =>
  facts.forEach((fact) => {
    if (
      fact.kind === "ModuleFact" ||
      isInstanceArityReported(fact, scope, unit) ||
      checkReference(fact, scope, unit, true)
    ) {
      return;
    }
    const name =
      fact.kind === "Identifier" ? fact.name : fact.kind === "Apply" ? fact.operator : "";
    if (fact.kind === "Identifier" && lookupLocal(scope, name)?.isNonFact) {
      unit.errors.push({
        location: formatRange(getSpelledNameRange(fact, name)),
        message: "Step number of non-fact used as a fact",
      });
    } else if (!unit.facts.has(name)) resolveExpression(fact, scope, unit);
  });

const resolveNewSymbol = (symbol: NewSymbol, scope: LocalName | undefined, unit: Unit) => {
  if (symbol.set) resolveExpression(symbol.set, scope, unit);
  return bindName(
    scope,
    symbol.name,
    { kind: `New${symbol.level}`, arity: symbol.arity, range: symbol.nameRange },
    unit,
  );
};

const resolveAssumeProve = (
  assumeProve: AssumeProve,
  scope: LocalName | undefined,
  unit: Unit,
  isNested = false,
): LocalName | undefined => {
  const assumed = assumeProve.assumptions.reduce(
    (current, assumption) => {
      if (assumption.kind === "NewSymbol") {
        return {
          scope: resolveNewSymbol(assumption, current.scope, current.unit),
          unit: isNested ? { ...current.unit, isLabelForbidden: true } : current.unit,
        };
      }
      if (assumption.kind === "AssumeProve") {
        resolveAssumeProve(assumption, current.scope, current.unit, true);
      } else resolveExpression(assumption, current.scope, current.unit);
      return current;
    },
    { scope, unit },
  );
  resolveExpression(assumeProve.conclusion, assumed.scope, assumed.unit);
  return assumed.scope;
};

const resolveStatement = (
  statement: Expression | AssumeProve,
  scope: LocalName | undefined,
  unit: Unit,
) => {
  if (statement.kind === "AssumeProve") return resolveAssumeProve(statement, scope, unit);
  resolveExpression(statement, scope, unit);
  return scope;
};

const resolveProof = (proof: Proof | undefined, scope: LocalName | undefined, outer: Unit) => {
  const unit = outer.hasLabelScope ? { ...outer, hasLabelScope: false } : outer;
  if (proof?.kind === "By") checkFacts(proof.facts, scope, unit);
  if (proof?.kind !== "Steps") return;
  proof.steps.reduce((current, step) => resolveStep(step, current, unit), scope);
};

const resolveLocalInstance = (instance: Instance, scope: LocalName | undefined, unit: Unit) => {
  const instanced = resolveInstance(instance, scope, unit);
  return instance.name === undefined
    ? instanced
    : bindName(
        instanced,
        instance.name,
        { kind: "Instance", arity: instance.params.length, range: instance.location.range },
        unit,
      );
};

const resolveStep = (
  step: ProofStep,
  scope: LocalName | undefined,
  unit: Unit,
): LocalName | undefined => {
  const body = step.body;
  const stepUnit =
    step.name === undefined
      ? unit
      : { ...unit, hasLabelScope: true, labelParams: [], labels: new Set<string>() };
  const bindStep = (parent: LocalName | undefined): LocalName | undefined =>
    step.name === undefined ? parent : { name: step.name, arity: 0, kind: "Theorem", parent };
  const bindNonFactStep = (parent: LocalName | undefined): LocalName | undefined =>
    step.name === undefined
      ? parent
      : { name: step.name, arity: 0, kind: "Theorem", parent, isNonFact: true };
  switch (body.kind) {
    case "Assert": {
      const assumed = resolveStatement(body.statement, scope, stepUnit);
      const proofScope = body.isSuffices ? scope : assumed;
      const name = step.name;
      if (name === undefined) {
        resolveProof(step.proof, proofScope, unit);
        return body.isSuffices ? assumed : scope;
      }
      const goal = { statement: body.statement, isSuffices: body.isSuffices, isInProof: true };
      resolveProof(step.proof, { name, arity: 0, kind: "Theorem", parent: proofScope, goal }, unit);
      goal.isInProof = false;
      return { name, arity: 0, kind: "Theorem", parent: body.isSuffices ? assumed : scope, goal };
    }
    case "Use":
    case "Hide":
      checkFacts(body.facts, scope, unit);
      return bindNonFactStep(scope);
    case "Instance":
      return bindNonFactStep(resolveLocalInstance(body, scope, stepUnit));
    case "Define":
      return bindNonFactStep(
        body.definitions.reduce(
          (current, definition) =>
            definition.kind === "Instance"
              ? resolveLocalInstance(definition, current, stepUnit)
              : resolveDefinitions([definition], current, unit),
          scope,
        ),
      );
    case "Have":
    case "Case":
      resolveExpression(body.expression, scope, stepUnit);
      resolveProof(step.proof, bindStep(scope), unit);
      return bindStep(scope);
    case "Witness":
      body.expressions.forEach((expression) => resolveExpression(expression, scope, stepUnit));
      return bindStep(scope);
    case "Take":
      return bindStep(
        bindNames(
          resolveBounds(body.bounds, scope, stepUnit),
          body.names,
          body.nameRanges,
          stepUnit,
        ),
      );
    case "Pick": {
      const picked = bindNames(
        resolveBounds(body.bounds, scope, stepUnit),
        body.names,
        body.nameRanges,
        stepUnit,
      );
      resolveExpression(body.body, picked, {
        ...stepUnit,
        labelParams: [...stepUnit.labelParams, ...getBoundNames(body.bounds), ...body.names],
      });
      resolveProof(step.proof, bindStep(scope), unit);
      return bindStep(picked);
    }
    default:
      resolveProof(step.proof, bindStep(scope), unit);
      return bindStep(scope);
  }
};

const resolveTheorem = (theorem: Theorem, unit: Unit) => {
  const isDefinition = theorem.name !== undefined && theorem.statement.kind !== "AssumeProve";
  const scope = isDefinition ? undefined : resolveStatement(theorem.statement, undefined, unit);
  if (theorem.name !== undefined) {
    bindModuleName(
      theorem.name,
      { kind: "Theorem", arity: 0, range: theorem.location.range },
      unit,
    );
  }
  const goal = unit.goals.get(theorem.name ?? "");
  if (goal) goal.isInProof = true;
  resolveProof(theorem.proof, scope, unit);
  if (goal) goal.isInProof = false;
};

interface InstancedModule {
  declarations: Declaration[];
  symbols: Symbols;
  instancer: string;
}

export interface ModuleReport {
  location: SourceLocation;
  errors: SanyError[];
  warnings: SanyError[];
}

export interface ModuleUnit {
  imported: Symbols;
  getInstance: (instance: Instance) => InstancedModule;
  bound: Symbols;
  definitions: Map<string, Definition>;
  getKey: (definition: Definition) => string;
  instanced: Map<Instance, Symbols>;
  facts: Set<string>;
  reports: ModuleReport[];
  warnings: SanyError[];
}

export const MODULE_START: SourceLocation = { line: 0, column: 0 };

export const isTheoremDefinition = (module: Module, definition: Definition) =>
  [...module.theorems, ...module.assumptions].some(
    (item) =>
      item.name === definition.name &&
      item.location.line === definition.location.line &&
      item.location.column === definition.location.column,
  );

const createSymbols = (module: Module, imported: Symbols) => {
  const symbols = new Map([...CORE_SYMBOLS, ...imported]);
  module.constants.forEach((constant) =>
    symbols.set(constant.name, { key: constant.name, arity: constant.arity, kind: "Constant" }),
  );
  module.variables.forEach((variable) =>
    symbols.set(variable.name, { key: variable.name, arity: 0, kind: "Variable" }),
  );
  return symbols;
};

const checkSubstitutions = (
  instance: Instance,
  declarations: Declaration[],
  instancer: string,
  outer: LocalName | undefined,
  unit: Unit,
) => {
  const scope = instance.params.reduce<LocalName | undefined>(
    (parent, param) => ({ name: param.name, arity: param.arity, kind: "Parameter", parent }),
    outer,
  );
  const resolveSubstitute = (declaration: Declaration, expression: Expression) => {
    if (declaration.arity === 0 || expression.kind !== "Identifier") {
      resolveExpression(expression, scope, unit);
      return;
    }
    const arity = getSymbolArity(expression, expression.name, scope, unit);
    if (arity !== undefined && arity !== declaration.arity) {
      throw new TlaSyntaxError(
        `An operator must be substituted for symbol '${declaration.name}', and it must have arity ${declaration.arity} in the instance of ${instance.module} at line ${instance.location.line}, column ${instance.location.column}`,
      );
    }
  };
  const substitutions = new Map<string, Expression>();
  instance.substitutions.forEach((substitution) => {
    const name = substitution.name;
    const declaration = declarations.find((item) => item.name === name);
    if (!declaration) {
      unit.errors.push({
        location: formatRange(substitution.nameRange),
        message: `Identifier '${name}' is not a legal target of a substitution. \nA legal target must be a declared CONSTANT or VARIABLE in the module being instantiated. \n(Also, check for warnings about multiple declarations of this same identifier.)`,
      });
      return;
    }
    const expression = substitution.expression;
    resolveSubstitute(declaration, expression);
    const range = expression.location.range;
    if (!substitutions.has(name)) substitutions.set(name, expression);
    else if (range) {
      unit.errors.push({
        location: formatRange(range),
        message: `Multiple substitutions for symbol '${name}' in substitution.`,
      });
    }
  });
  const implicit = declarations.filter((declaration) => !substitutions.has(declaration.name));
  const isMissing = (declaration: Declaration) =>
    !lookupLocal(scope, declaration.name) && !findSymbol(declaration.name, unit);
  implicit
    .filter((declaration) => !isMissing(declaration))
    .forEach((declaration) => {
      const expression: Expression = {
        kind: "Identifier",
        name: declaration.name,
        location: instance.location,
      };
      resolveSubstitute(declaration, expression);
      substitutions.set(declaration.name, expression);
    });
  implicit.filter(isMissing).forEach((declaration) => {
    const range = instance.location.range;
    const declared = declaration.location.range;
    if (range && declared) {
      unit.errors.push({
        location: formatRange(range),
        message: `Substitution missing for symbol ${declaration.name} declared at ${formatRange(declared)} \nand instantiated in module ${instancer}.`,
      });
    }
  });
  return substitutions;
};

const resolveInstance = (instance: Instance, scope: LocalName | undefined, unit: Unit) => {
  const instanced = unit.getInstance(instance);
  checkSubstitutions(instance, instanced.declarations, instanced.instancer, scope, unit);
  return [...instanced.symbols].reduce(
    (parent, [name, symbol]) => bindName(parent, name, symbol, unit),
    scope,
  );
};

export const resolveSubstitutions = (
  instance: Instance,
  declarations: Declaration[],
  module: Module,
  unit: ModuleUnit,
) => {
  const imported = createSymbols(module, unit.imported);
  const report: ModuleReport = { location: instance.location, errors: [], warnings: [] };
  unit.reports.push(report);
  return checkSubstitutions(instance, declarations, module.name, undefined, {
    imported,
    getInstance: unit.getInstance,
    definitions: unit.definitions,
    getKey: unit.getKey,
    location: instance.location,
    self: undefined,
    facts: new Set(),
    goals: new Map(),
    bindings: new Map(
      [...imported].map(([name, symbol]) => [name, { ...symbol, position: MODULE_START }]),
    ),
    errors: report.errors,
    warnings: report.warnings,
    hasLabelScope: false,
    isLabelForbidden: false,
    isInExcept: false,
    labelParams: [],
    labels: new Set(),
    isGenerated: false,
  });
};

interface SemanticCheck {
  location: SourceLocation;
  check: (reported: SanyError[], warned: SanyError[]) => void;
}

export const collectSemanticErrors = (units: SemanticCheck[], warnings: SanyError[]) => {
  const errors: SanyError[] = [];
  const addUnique = (list: SanyError[], item: SanyError) => {
    if (
      list.every(
        (existing) => existing.location !== item.location || existing.message !== item.message,
      )
    ) {
      list.push(item);
    }
  };
  units
    .toSorted((left, right) =>
      isBefore(left.location, right.location)
        ? -1
        : isBefore(right.location, left.location)
          ? 1
          : 0,
    )
    .forEach((unit) => {
      const reported: SanyError[] = [];
      const warned: SanyError[] = [];
      try {
        unit.check(reported, warned);
      } catch (error) {
        if (!(error instanceof TlaSyntaxError) || (!error.sany && reported.length === 0)) {
          throw error;
        }
        reported.push(...(error.sany?.errors ?? []));
      }
      reported.forEach((item) => addUnique(errors, item));
      warned.forEach((item) => addUnique(warnings, item));
    });
  return errors;
};

export const resolveModule = (module: Module, unit: ModuleUnit) => {
  const symbols = createSymbols(module, unit.imported);
  const facts = new Set([
    ...unit.facts,
    ...[...module.theorems, ...module.assumptions].flatMap((fact) => fact.name ?? []),
  ]);
  const goals = new Map(
    module.theorems.flatMap((theorem): [string, Goal][] =>
      theorem.name !== undefined && theorem.statement.kind === "AssumeProve"
        ? [[theorem.name, { statement: theorem.statement, isSuffices: false, isInProof: false }]]
        : [],
    ),
  );
  const bindings = new Map<string, ModuleBinding>(
    [...CORE_SYMBOLS, ...unit.bound].map(([name, symbol]) => [
      name,
      { ...symbol, position: MODULE_START },
    ]),
  );
  const recursive = new Set<Binding>();
  const declarations: { declaration: Declaration; binding: ModuleBinding | undefined }[] = [];
  const createUnit = (
    location: SourceLocation,
    self: Definition | undefined,
    errors: SanyError[],
    warnings: SanyError[],
    hasLabelScope: boolean,
  ): Unit => ({
    imported: symbols,
    getInstance: unit.getInstance,
    definitions: unit.definitions,
    getKey: unit.getKey,
    location,
    self,
    facts,
    goals,
    bindings,
    errors,
    warnings,
    hasLabelScope,
    isLabelForbidden: false,
    isInExcept: false,
    labelParams: [],
    labels: new Set(),
    isGenerated: false,
  });
  const bindDeclarations = (declarations: Declaration[], kind: "Constant" | "Variable") =>
    declarations.map((declaration) => ({
      location: declaration.location,
      check: (errors: SanyError[], warnings: SanyError[]) =>
        bindModuleName(
          declaration.name,
          { kind, arity: declaration.arity, range: declaration.location.range },
          createUnit(declaration.location, undefined, errors, warnings, false),
        ),
    }));
  return collectSemanticErrors(
    [
      ...unit.reports.map((report) => ({
        location: report.location,
        check: (errors: SanyError[], warnings: SanyError[]) => {
          errors.push(...report.errors);
          warnings.push(...report.warnings);
        },
      })),
      ...bindDeclarations(module.constants, "Constant"),
      ...bindDeclarations(module.variables, "Variable"),
      ...module.units
        .flatMap((item) => (item.kind === "Recursive" ? item.declarations : []))
        .map((declaration) => ({
          location: declaration.location,
          check: (errors: SanyError[], warnings: SanyError[]) => {
            const binding: ModuleBinding = {
              kind: "Definition",
              arity: declaration.arity,
              range: declaration.location.range,
              position: declaration.location,
              isPending: true,
            };
            const isBound = isBindable(
              declaration.name,
              bindings.get(declaration.name),
              binding,
              createUnit(declaration.location, undefined, errors, warnings, false),
            );
            if (isBound) {
              bindings.set(declaration.name, binding);
              recursive.add(binding);
            }
            declarations.push({ declaration, binding: isBound ? binding : undefined });
          },
        })),
      ...module.definitions.map((definition) => ({
        location: definition.location,
        check: (errors: SanyError[], warnings: SanyError[]) => {
          const inner = createUnit(definition.location, definition, errors, warnings, true);
          if (isTheoremDefinition(module, definition)) {
            resolveExpression(definition.body, undefined, inner);
          } else if (resolveDefinition(definition, undefined, inner, recursive)) {
            bindings.set(definition.name, {
              kind: "Definition",
              arity: getArity(definition),
              range: definition.location.range,
              position: definition.location,
            });
          }
        },
      })),
      ...module.instances.map((instance) => ({
        location: instance.location,
        check: (errors: SanyError[], warnings: SanyError[]) => {
          const inner = createUnit(instance.location, undefined, errors, warnings, false);
          bindParams(undefined, instance.params, inner);
          unit.instanced
            .get(instance)
            ?.forEach((symbol, name) => bindModuleName(name, symbol, inner));
          if (instance.name !== undefined) {
            bindModuleName(
              instance.name,
              { kind: "Instance", arity: instance.params.length, range: instance.location.range },
              inner,
            );
          }
        },
      })),
      ...module.assumptions.map((assumption) => ({
        location: assumption.location,
        check: (errors: SanyError[], warnings: SanyError[]) => {
          const inner = createUnit(
            assumption.location,
            undefined,
            errors,
            warnings,
            assumption.name !== undefined,
          );
          resolveExpression(assumption.expression, undefined, inner);
          if (assumption.name !== undefined) {
            bindModuleName(
              assumption.name,
              { kind: "Theorem", arity: 0, range: assumption.location.range },
              inner,
            );
          }
        },
      })),
      ...module.theorems.map((theorem) => ({
        location: theorem.location,
        check: (errors: SanyError[], warnings: SanyError[]) =>
          resolveTheorem(
            theorem,
            createUnit(theorem.location, undefined, errors, warnings, theorem.name !== undefined),
          ),
      })),
      ...module.uses.map((use) => ({
        location: use.location,
        check: (errors: SanyError[], warnings: SanyError[]) =>
          checkFacts(
            use.facts,
            undefined,
            createUnit(use.location, undefined, errors, warnings, false),
          ),
      })),
      {
        location: module.location.range?.end ?? module.location,
        check: (errors: SanyError[]) =>
          declarations.forEach((item) => {
            const range = item.declaration.location.range;
            if (range && (!item.binding || item.binding.isPending)) {
              errors.push({
                location: formatRange(range),
                message: `Symbol ${item.declaration.name} declared in RECURSIVE statement but not defined.`,
              });
            }
          }),
      },
    ],
    unit.warnings,
  );
};
