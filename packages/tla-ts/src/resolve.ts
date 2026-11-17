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
  type UseOrHide,
} from "./ast";
import { formatRange, TlaSyntaxError, type SanyError } from "./errors";
import { resolveSynonym } from "./tlc/jar-data";

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

export interface SelectionArguments {
  operator: string;
  range: SourceRange | undefined;
  args: Expression[];
  params: number[];
}

interface SelectionError {
  applications: SelectionArguments[];
  error: SanyError;
}

interface SelectionState {
  node: Expression | NewSymbol | AssumeProve;
  isGoal: boolean;
  isSufficesOpen: boolean;
}

type Reference = Expression & { kind: "Identifier" | "Apply" | "Subexpression" };

export const LOCAL_RESOLUTION = { kind: "Local" } as const;

export interface NullSelection {
  node: Expression;
  error: SanyError;
}

export const selections = new WeakSet<Expression>();
export const selectionErrors = new WeakMap<Expression, SelectionError>();
export const operatorSelectionErrors = new WeakMap<Expression, SanyError>();
export const factReferences = new WeakMap<Fact[], Fact[]>();
export const nullSelections = new WeakMap<Expression, NullSelection[]>();
const unresolvedExpressions = new WeakSet<Expression>();

const renamedArities = new WeakMap<Expression, number>();

export const KEY_SEPARATOR = "@";

const isKey = (name: string) => {
  const index = name.lastIndexOf(KEY_SEPARATOR);
  return index > 0 && index < name.length - 1;
};

const CORE_SYMBOLS: Symbols = new Map([
  ...["~>", "-+->", "\\cdot", "\\X"].map((name): [string, ModuleSymbol] => [
    name,
    { key: name, arity: 2, kind: "Builtin" },
  ]),
  ["'", { key: "'", arity: 1, kind: "Builtin" }],
]);

export const isBefore = (left: SourceLocation, right: SourceLocation) =>
  left.line < right.line || (left.line === right.line && left.column < right.column);

const compareLocations = (left: SourceLocation, right: SourceLocation) =>
  isBefore(left, right) ? -1 : isBefore(right, left) ? 1 : 0;

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
      message: `Symbol ${resolveSynonym(name)} is a built-in operator, and cannot be redefined.`,
    });
  } else if (
    added.kind === "Parameter" ||
    current.kind !== added.kind ||
    current.arity !== added.arity
  ) {
    unit.errors.push({
      location,
      message: `Multiply-defined symbol '${resolveSynonym(name)}': this definition or declaration conflicts \nwith the one at ${existing}.`,
    });
  } else {
    unit.warnings.push({
      location,
      message: `Multiple declarations or definitions for symbol ${resolveSynonym(name)}.  \nThis duplicates the one at ${existing}.`,
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
      ? definition.isRecursive
      : definition.isRecursive
        ? getModuleBinding(name, unit, undefined) !== undefined
        : isBefore(definition.location, unit.location));
  return isVisible ? definition : undefined;
};

const findSymbol = (name: string, unit: Unit): ModuleSymbol | undefined => {
  const definition = getVisibleDefinition(name, unit);
  if (definition) {
    const declared = definition.isRecursive ? unit.bindings.get(name) : undefined;
    return {
      key: unit.getKey(definition),
      arity: declared?.arity ?? getArity(definition),
      params: declared?.params ?? getParamArities(definition),
      kind: "Definition",
    };
  }
  const binding = getModuleBinding(name, unit, undefined);
  if (binding?.isPending) return { key: name, arity: binding.arity, kind: binding.kind };
  return binding ? unit.imported.get(name) : undefined;
};

const isFact = (name: string, unit: Unit) =>
  unit.facts.has(name) || unit.bindings.get(name)?.kind === "Theorem";

const getGoal = (name: string, unit: Unit) =>
  unit.bindings.get(name)?.kind === "Theorem" ? unit.goals.get(name) : undefined;

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
  if (expression.kind !== "Apply" || expression.argumentsRange) return undefined;
  if (expression.args.length === 2) return "infix";
  if (expression.args.length !== 1) return undefined;
  return isBefore(expression.location, expression.args[0].location) ? "prefix" : "postfix";
};

const BUILTIN_LOCATION = "In module --TLA+ BUILTINS--";

const SELECTABLE_KINDS = new Set<SymbolKind>(["Definition", "Instance", "Theorem"]);

const reportUnselectable = (name: string, range: SourceRange, unit: Unit) =>
  unit.errors.push({
    location: formatRange(range),
    message: `Cannot take subexpression of \`${resolveSynonym(name)}'.`,
  });

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
    counts ?? parts.map((_part, index) => (index === parts.length - 1 ? args.length : 0));
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
    return undefined;
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
        return isLet ? node : report(index - 1, "A name selector here must be from a LET clause.");
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
    if (selector.kind === "Colon") return node;
    const operand =
      selector.kind === "Operand"
        ? getOperandName(selector.operand)
        : selector.kind === "At"
          ? "@"
          : "!(...)";
    const getPosition = (count: number) =>
      selector.kind === "Operand" ? getOperandIndex(selector.operand, count) : -1;
    if (state.isSufficesOpen) {
      if (getPosition(1) !== 0) {
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
    if (node.kind === "NewSymbol") return node;
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
      if (sets && selector.kind !== "Operand") return node;
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
      if (!operands) return node;
      const position = getPosition(operands.length);
      if (position === -1) return report(index, `Nonexistent operand specified by \`${operand}'.`);
      state.node = operands[position];
      state.isGoal = false;
      continue;
    }
    const clauses = [...node.assumptions, node.conclusion];
    const position = getPosition(clauses.length);
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
  if (isFact) return state.node;
  if (state.node.kind === "AssumeProve") {
    return report(undefined, "Selected ASSUME/PROVE instead of expression.");
  }
  if (state.node.kind === "NewSymbol") {
    return report(undefined, "Selected a NEW declaration as an expression or operator.");
  }
  return state.node;
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
      ? (lookupLocal(scope, first.name)?.goal ?? getGoal(first.name, unit))
      : undefined;
  return goal && { node: checkSelection(expression, selectors, goal, scope, unit, isFact) };
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
  const selected =
    prefix === "" ? undefined : (lookupLocal(scope, prefix) ?? findSymbol(prefix, unit));
  if (selected && !SELECTABLE_KINDS.has(selected.kind)) {
    reportUnselectable(
      prefix,
      (expression.kind !== "OperatorReference" && expression.selectorRanges?.[0]) ||
        getSpelledNameRange(expression, name),
      unit,
    );
    return undefined;
  }
  if (selected || (prefix !== "" && isFact(prefix, unit))) {
    return expression.kind === "Apply" ? expression.args.length : 0;
  }
  const fixity = getFixity(expression);
  const isOperatorApplication = expression.kind === "OperatorReference" || fixity !== undefined;
  if (!isOperatorSymbol(name) || isStepName(name) || !isOperatorApplication) {
    unit.errors.push({
      location: formatRange(getSpelledNameRange(expression, name)),
      message: `Unknown operator: \`${resolveSynonym(name)}'.`,
    });
    return undefined;
  }
  const spelling = expression.spelling ?? name;
  unit.errors.push({
    location: formatRange(
      fixity === "prefix" && spelling === "-."
        ? getNameRange(location, "-")
        : getSpelledNameRange(expression, name),
    ),
    message: `Could not find declaration or definition of symbol '${spelling}'.`,
  });
  if (fixity) unresolvedExpressions.add(expression);
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
      `Recursive ${definition.kind === "Function" ? "function" : "operator"} ${resolveSynonym(name)} defined at wrong LET/IN level.`,
    );
  } else if (current && !isDeclared) {
    report(
      definition.kind === "Function"
        ? `Function name \`${name}' already defined or declared.`
        : `Operator ${resolveSynonym(name)} already defined or declared.`,
    );
  } else if (current && definition.kind === "Function" && current.arity > 0) {
    report(`Function ${resolveSynonym(name)} has operator arguments in its RECURSIVE declaration.`);
  } else if (
    current &&
    definition.kind === "Operator" &&
    // Deviation from SANY: Generator#processOperator compares only the last parameter's arity with the RECURSIVE declaration's.
    (current.arity !== definition.params.length ||
      definition.params.some((param) => param.arity > 0))
  ) {
    report(
      `Definition of ${resolveSynonym(name)} has different arity than its RECURSIVE declaration.`,
    );
  }
  if (current && isDeclared && definition.kind === "Operator") {
    current.params = getParamArities(definition);
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
    if (definition.kind === "Operator" || current.arity === 0) {
      current.isPending = false;
      current.range = range;
    }
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
  declarations: Declaration[] = [],
) => {
  const recursive = new Set<Binding>();
  const declared = definitions
    .filter(
      (definition) =>
        definition.isRecursive &&
        declarations.every((declaration) => declaration.name !== definition.name),
    )
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
  const declaredLocals = new Map<Declaration, LocalName | undefined>();
  const bindDeclaration = (parent: LocalName | undefined, declaration: Declaration) => {
    const binding: Binding = {
      kind: "Definition",
      arity: declaration.arity,
      params: Array(declaration.arity).fill(0),
      range: declaration.location.range,
    };
    const local: LocalName | undefined = isBindable(
      declaration.name,
      lookupLocal(parent, declaration.name) ??
        getModuleBinding(declaration.name, unit, binding.range),
      binding,
      unit,
    )
      ? { ...binding, name: declaration.name, parent, isPending: true }
      : undefined;
    if (local) recursive.add(local);
    declaredLocals.set(declaration, local);
    return local ?? parent;
  };
  const pending = [...(unit.isGenerated ? [] : instances), ...declarations].toSorted(
    (left, right) => compareLocations(left.location, right.location),
  );
  const resolvePending = (
    current: LocalName | undefined,
    isDue: (item: Instance | Declaration) => boolean,
  ) => {
    const count = pending.findIndex((item) => !isDue(item));
    return pending
      .splice(0, count === -1 ? pending.length : count)
      .reduce(
        (parent, item) =>
          "kind" in item ? resolveLocalInstance(item, parent, unit) : bindDeclaration(parent, item),
        current,
      );
  };
  const resolved = definitions.reduce<LocalName | undefined>((previous, definition) => {
    const current = isKey(definition.name)
      ? previous
      : resolvePending(previous, (item) => !isBefore(definition.location, item.location));
    const local: LocalName = {
      name: definition.name,
      arity: getArity(definition),
      kind: "Definition",
      range: definition.location.range,
      parent: current,
    };
    if (isInstantiated(definition)) return { ...local, params: getParamArities(definition) };
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
  const resolvedScope = resolvePending(resolved, () => true);
  declaredLocals.forEach((local, declaration) => {
    const range = declaration.location.range;
    if (range && !unit.isGenerated && (!local || local.isPending)) {
      unit.errors.push({
        location: formatRange(range),
        message: `Symbol ${resolveSynonym(declaration.name)} declared in RECURSIVE statement but not defined.`,
      });
    }
  });
  return resolvedScope;
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

const isArgumentCountReported = (
  callee: Binding | undefined,
  name: string,
  count: number,
  range: SourceRange | undefined,
  unit: Unit,
) => {
  const params = callee?.kind === "Definition" ? callee.params : undefined;
  if (!callee || !params || params.length === callee.arity) return false;
  if (range) {
    unit.errors.push({
      location: formatRange(range),
      message: `Wrong number of arguments (${count}) given to operator '${resolveSynonym(name)}', \nwhich requires ${params.length} arguments.`,
    });
  }
  return true;
};

const matchArgument = (
  arg: Expression,
  expected: number,
  index: number,
  operator: string,
  operatorRange: SourceRange | undefined,
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const report = (range: SourceRange | undefined, message: string) => {
    if (range) unit.errors.push({ location: formatRange(range), message });
  };
  const range = arg.location.range;
  if (expected === 0) {
    const selectionError = operatorSelectionErrors.get(arg);
    // Deviation from SANY: SANY names its internal node kind here, where tla-ts words it as for a name.
    if (arg.kind === "Lambda" && arg.operator !== undefined) {
      report(range, `The operator ${resolveSynonym(arg.operator)} requires 1 arguments.`);
    } else if (selectionError) {
      unit.errors.push(selectionError);
    } else if (arg.kind === "Lambda" && range) {
      report(range, "LAMBDA expression used where an expression is required.");
    } else if (arg.kind === "OperatorReference") {
      const argArity = getSymbolArity(arg, arg.operator, scope, unit);
      if (argArity !== undefined) {
        report(
          range,
          `The operator ${resolveSynonym(arg.operator)} requires ${argArity} arguments.`,
        );
      }
    } else resolveExpression(arg, scope, unit);
    return true;
  }
  if (arg.kind === "Lambda") {
    if (selections.has(arg)) resolveExpression(arg, scope, unit);
    else resolveLambda(arg, scope, unit);
    const isMatched = arg.params.length === expected;
    if (!isMatched && selections.has(arg)) {
      report(range, `Expected arity ${expected} but found operator of arity ${arg.params.length}.`);
    } else if (!isMatched && range && arg.operator === undefined) {
      report(
        operatorRange,
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
    const selectorIndex = arg.argumentCounts.findIndex((count) => count > 0);
    report(
      arg.selectorRanges?.[selectorIndex],
      `Selector \`${arg.operator.split("!")[selectorIndex]}' should not have argument(s).`,
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
  // Deviation from SANY: OpDefNode#matchingOpArgOperand reads as many parameters as a RECURSIVE declaration gives and crashes when the definition has fewer.
  return argArity === expected && argParams.every((param) => param === 0);
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
      message: `The operator ${resolveSynonym(operator)} requires ${arity - (findInstance(operator, scope, unit)?.arity ?? 0)} arguments.`,
    });
    return;
  }
  const params =
    callee && (callee.kind === "Definition" ? callee.params : expression.args.map(() => 0));
  if (params === undefined) {
    expression.args.forEach((arg) => resolveArgument(arg, scope, unit));
    return;
  }
  const operatorRange =
    expression.selectorRanges?.at(-1) ?? getSpelledNameRange(expression, operator);
  const matches = expression.args
    .slice(0, params.length)
    .map((arg, index) =>
      matchArgument(arg, params[index], index, operator, operatorRange, scope, unit),
    );
  if (
    isArgumentCountReported(
      callee,
      operator,
      expression.args.length,
      expression.location.range,
      unit,
    )
  ) {
    return;
  }
  matches.forEach((isMatched, index) => {
    if (!isMatched && expression.location.range) {
      unit.errors.push({
        location: formatRange(expression.location.range),
        message: `Argument number ${index + 1} to operator '${operator}' \nshould be a ${params[index]}-parameter operator.`,
      });
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
  failed.applications.forEach((application) =>
    application.args
      .slice(0, application.params.length)
      .forEach((arg, index) =>
        matchArgument(
          arg,
          application.params[index],
          index,
          application.operator,
          application.range,
          scope,
          unit,
        ),
      ),
  );
  unit.errors.push(failed.error);
  return true;
};

const resolveLambda = (
  expression: Expression & { kind: "Lambda" },
  scope: LocalName | undefined,
  unit: Unit,
) =>
  resolveExpression(
    expression.body,
    bindNames(scope, expression.params, expression.paramRanges, unit),
    {
      ...unit,
      labelParams: [...unit.labelParams, ...expression.params],
    },
  );

const resolveExpression = (
  expression: Expression,
  scope: LocalName | undefined,
  unit: Unit,
): void => {
  if (selections.has(expression) && !unit.isGenerated) {
    const failed = nullSelections
      .get(expression)
      ?.find((selection) => unresolvedExpressions.has(selection.node));
    if (failed) unit.errors.push(failed.error);
    else resolveExpression(expression, scope, { ...unit, isGenerated: true });
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
      return;
    case "ExceptAt":
      if (!unit.isInExcept && expression.location.range) {
        unit.errors.push({
          location: formatRange(expression.location.range),
          message: "@ used where its meaning is not defined.",
        });
      }
      return;
    case "Identifier": {
      if (isInstanceArityReported(expression, scope, unit)) return;
      const name = expression.name;
      const arity = getSymbolArity(expression, name, scope, unit);
      if (arity === 0) {
        isArgumentCountReported(
          findBinding(name, scope, unit),
          name,
          0,
          getSpelledNameRange(expression, name),
          unit,
        );
      } else if (arity !== undefined) {
        unit.errors.push({
          location: formatRange(getSpelledNameRange(expression, name)),
          message: `The operator ${resolveSynonym(name)} requires ${arity} arguments.`,
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
      if (selections.has(expression)) resolveLambda(expression, scope, unit);
      else if (expression.location.range) {
        unit.errors.push({
          location: formatRange(expression.location.range),
          message: "LAMBDA expression used where an expression is required.",
        });
      }
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
        resolveDefinitions(
          expression.definitions,
          scope,
          unit,
          expression.instances,
          expression.recursive,
        ),
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
    case "Subexpression":
      isSubexpressionReported(expression, scope, unit);
      return;
  }
};

const isSubexpressionReported = (
  expression: Expression & { kind: "Subexpression" },
  scope: LocalName | undefined,
  unit: Unit,
) => {
  if (isSelectionReported(expression, scope, unit)) return true;
  expression.selectors
    .flatMap((selector) => ("args" in selector ? selector.args : []))
    .forEach((arg) => resolveArgument(arg, scope, unit));
  const selected = checkReference(expression, scope, unit, false);
  if (selected) return selected.node === undefined;
  const head = expression.selectors[0];
  const range = expression.selectorRanges?.[0];
  const nameCount = expression.selectors.findIndex((selector) => selector.kind !== "Name");
  const names = expression.selectors
    .slice(0, nameCount)
    .flatMap((selector) => (selector.kind === "Name" ? [selector.name] : []));
  const symbolIndex = names.findIndex(
    (_name, index) => index > 0 && findSymbol(names.slice(0, index + 1).join("!"), unit),
  );
  const isInstance =
    names.length > 1 &&
    (lookupLocal(scope, names[0]) ?? getModuleBinding(names[0], unit, undefined))?.kind ===
      "Instance";
  const lastRange = expression.selectorRanges?.[nameCount - 1];
  if (isInstance && symbolIndex === -1 && range && lastRange) {
    unit.errors.push({
      location: formatRange({ module: range.module, start: range.start, end: lastRange.end }),
      message: `Unknown operator: \`${resolveSynonym(names.join("!"))}'.`,
    });
    return true;
  }
  const name = names.slice(0, symbolIndex + 1).join("!");
  const symbol = symbolIndex > 0 ? findSymbol(name, unit) : undefined;
  const argumentCount = expression.selectors
    .slice(0, symbolIndex + 1)
    .flatMap((selector) => ("args" in selector ? selector.args : [])).length;
  const argumentRange = expression.argumentRanges?.[symbolIndex] ?? expression.location.range;
  if (symbol && symbol.arity !== argumentCount && argumentRange) {
    unit.errors.push({
      location: formatRange(argumentRange),
      message: `The operator ${resolveSynonym(name)} requires ${symbol.arity} arguments.`,
    });
    return true;
  }
  if (head.kind !== "Name" || expression.selectors[1].kind === "Name" || !range) return false;
  const local = lookupLocal(scope, head.name);
  const binding = local ?? findSymbol(head.name, unit);
  if ((binding === undefined && !isFact(head.name, unit)) || binding?.kind === "Instance") {
    unit.errors.push({
      location: formatRange(range),
      message: `Unknown operator: \`${resolveSynonym(head.name)}'.`,
    });
    return true;
  }
  if (binding && (!SELECTABLE_KINDS.has(binding.kind) || local?.isNonFact)) {
    reportUnselectable(head.name, range, unit);
    return true;
  }
  return false;
};

const checkFact = (fact: Fact, reference: Fact, scope: LocalName | undefined, unit: Unit) => {
  if (fact.kind === "ModuleFact") return undefined;
  if (fact.kind === "ExceptAt" && fact.location.range) {
    unit.errors.push({
      location: formatRange(fact.location.range),
      message: "Unknown operator: `@'.",
    });
    return BUILTIN_LOCATION;
  }
  const hidden = getHiddenExpressionLocation(fact, reference, scope, unit);
  if (isInstanceArityReported(fact, scope, unit)) return hidden;
  const selected = checkReference(fact, scope, unit, true);
  if (selected) {
    const kind = selected.node?.kind;
    if (kind === undefined) return BUILTIN_LOCATION;
    return kind === "AssumeProve" || kind === "NewSymbol"
      ? undefined
      : fact.location.range && formatRange(fact.location.range);
  }
  if (fact.kind === "Subexpression") {
    return isSubexpressionReported(fact, scope, unit) ? BUILTIN_LOCATION : hidden;
  }
  const name = fact.kind === "Identifier" ? fact.name : fact.kind === "Apply" ? fact.operator : "";
  if (fact.kind === "Identifier" && lookupLocal(scope, name)?.isNonFact) {
    unit.errors.push({
      location: formatRange(getSpelledNameRange(fact, name)),
      message: "Step number of non-fact used as a fact",
    });
    return BUILTIN_LOCATION;
  }
  if (!isFact(name, unit)) resolveExpression(fact, scope, unit);
  return hidden;
};

const isDefinitionEntry = (def: Fact, scope: LocalName | undefined, unit: Unit) => {
  const range = def.location.range;
  const name =
    def.kind === "Identifier" ? def.name : def.kind === "OperatorReference" ? def.operator : "";
  if (name === "" || !range) return true;
  const binding =
    lookupLocal(scope, name) ?? findSymbol(name, unit) ?? getModuleBinding(name, unit, range);
  if (binding === undefined && (isFact(name, unit) || isStepName(name))) return true;
  if (binding === undefined) {
    unit.errors.push({
      location: formatRange(range),
      message: `Unknown operator: \`${resolveSynonym(name)}'.`,
    });
  }
  if (binding && SELECTABLE_KINDS.has(binding.kind) && !isStepName(name)) return true;
  unit.errors.push({
    location: formatRange(range),
    message: "DEF clause entry should describe a defined operator.",
  });
  return false;
};

const getHiddenExpressionLocation = (
  fact: Expression,
  reference: Fact,
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const range = fact.location.range && formatRange(fact.location.range);
  if (selections.has(fact)) {
    return reference.location.range && formatRange(reference.location.range);
  }
  if (selectionErrors.has(fact) || fact.kind === "ExceptAt") return BUILTIN_LOCATION;
  switch (fact.kind) {
    case "Number":
    case "String":
    case "Decimal":
    case "Let":
    case "Label":
      return undefined;
    case "Identifier":
    case "Apply":
    case "Subexpression": {
      const first = getSelectors(fact)[0];
      if (fact.kind === "Subexpression" || first.kind !== "Name") return undefined;
      const name = fact.kind === "Identifier" ? fact.name : fact.operator;
      const goal = lookupLocal(scope, first.name)?.goal ?? getGoal(first.name, unit);
      if (isFact(name, unit) || goal || (isStepName(name) && lookupLocal(scope, name))) {
        return undefined;
      }
      const binding = findBinding(name, scope, unit);
      const count = fact.kind === "Apply" ? fact.args.length : 0;
      return binding?.arity === count ? range : BUILTIN_LOCATION;
    }
    default:
      return range;
  }
};

const checkUseOrHide = (
  statement: UseOrHide | Extract<Proof, { kind: "By" }>,
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const references = factReferences.get(statement.facts) ?? statement.facts;
  const hidden = statement.facts.map((fact, index) =>
    checkFact(fact, references[index], scope, unit),
  );
  const defCount = statement.defs.filter((def) => isDefinitionEntry(def, scope, unit)).length;
  hidden.forEach((location) => {
    if (location && statement.kind === "Hide") {
      unit.errors.push({
        location,
        message:
          "The only expression allowed as a fact in a HIDE is \nthe name of a theorem, assumption, or step.",
      });
    }
  });
  const range = statement.location.range;
  if (statement.facts.length + defCount === 0 && range) {
    unit.errors.push({
      location: formatRange(range),
      message: statement.kind === "By" ? "Empty BY" : "Empty USE or HIDE statement.",
    });
  }
};

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
  if (proof?.kind === "By") checkUseOrHide(proof, scope, unit);
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
      checkUseOrHide(body, scope, unit);
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
  const reportArity = (declaration: Declaration, location: string) =>
    unit.errors.push({
      location,
      message: `An operator must be substituted for symbol '${resolveSynonym(declaration.name)}', and it must have arity ${declaration.arity}.`,
    });
  const resolveSubstitute = (declaration: Declaration, expression: Expression) => {
    const range = expression.location.range;
    if (declaration.arity === 0) {
      resolveExpression(expression, scope, unit);
      return;
    }
    if (expression.kind === "Lambda") {
      resolveLambda(expression, scope, unit);
      if (expression.params.length !== declaration.arity && range) {
        reportArity(declaration, formatRange(range));
      }
      return;
    }
    if (expression.kind === "OperatorReference") {
      const arity = getSymbolArity(expression, expression.operator, scope, unit);
      if (arity === undefined) reportArity(declaration, BUILTIN_LOCATION);
      else if (arity !== declaration.arity && range) reportArity(declaration, formatRange(range));
      return;
    }
    if (expression.kind !== "Identifier") {
      if (range) {
        unit.errors.push({
          location: formatRange(range),
          message: `Arity ${declaration.arity} operator (not an expression) is expected \nto substitute for CONSTANT '${resolveSynonym(declaration.name)}'.`,
        });
      }
      reportArity(declaration, BUILTIN_LOCATION);
      return;
    }
    const arity = getSymbolArity(expression, expression.name, scope, unit);
    if (arity !== undefined && arity !== declaration.arity) {
      unit.errors.push({
        location: formatRange(getSpelledNameRange(expression, expression.name)),
        message: `Expected arity ${declaration.arity} but found operator of arity ${arity}.`,
      });
    }
    if (arity !== declaration.arity) reportArity(declaration, BUILTIN_LOCATION);
  };
  const instanceRange = instance.location.range;
  const isFound = (declaration: Declaration) =>
    lookupLocal(scope, declaration.name) !== undefined ||
    findSymbol(declaration.name, unit) !== undefined;
  const implicit = declarations.filter(isFound).map((declaration) => {
    const expression: Expression & { kind: "Identifier" } = {
      kind: "Identifier",
      name: declaration.name,
      location: instance.location,
    };
    return { declaration, expression };
  });
  implicit
    .filter((item) => item.declaration.arity === 0)
    .forEach((item) => {
      const arity = getSymbolArity(item.expression, item.declaration.name, scope, unit);
      if (arity && instanceRange) {
        unit.errors.push({
          location: formatRange(instanceRange),
          message: `Wrong number of arguments (0) given to operator '${resolveSynonym(item.declaration.name)}', \nwhich requires ${arity} arguments.`,
        });
      }
    });
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
  implicit
    .filter((item) => !substitutions.has(item.declaration.name))
    .forEach((item) => {
      const arity =
        item.declaration.arity === 0
          ? 0
          : getSymbolArity(item.expression, item.declaration.name, scope, unit);
      if (arity !== item.declaration.arity && instanceRange) {
        reportArity(item.declaration, formatRange(instanceRange));
      }
      substitutions.set(item.declaration.name, item.expression);
    });
  declarations
    .filter((declaration) => !substitutions.has(declaration.name))
    .forEach((declaration) => {
      const declared = declaration.location.range;
      if (instanceRange && declared) {
        unit.errors.push({
          location: formatRange(instanceRange),
          message: `Substitution missing for symbol ${resolveSynonym(declaration.name)} declared at ${formatRange(declared)} \nand instantiated in module ${instancer}.`,
        });
      }
    });
  return substitutions;
};

const resolveInstance = (instance: Instance, scope: LocalName | undefined, unit: Unit) => {
  const instanced = unit.getInstance(instance);
  checkSubstitutions(instance, instanced.declarations, instanced.instancer, scope, unit);
  return [...instanced.symbols].reduce(
    (parent, entry) => bindName(parent, entry[0], entry[1], unit),
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
  const positions = new Map(
    [...module.constants, ...module.variables].map((declaration) => [
      declaration.name,
      declaration.location,
    ]),
  );
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
      [...imported].map((entry) => [
        entry[0],
        { ...entry[1], position: positions.get(entry[0]) ?? MODULE_START },
      ]),
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

interface SemanticUnit {
  location: SourceLocation;
  check: (reported: SanyError[], warned: SanyError[]) => void;
}

export const collectSemanticErrors = (units: SemanticUnit[], warnings: SanyError[]) => {
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
    .toSorted((left, right) => compareLocations(left.location, right.location))
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
  const goals = new Map(
    module.theorems.flatMap((theorem): [string, Goal][] =>
      theorem.name !== undefined && theorem.statement.kind === "AssumeProve"
        ? [[theorem.name, { statement: theorem.statement, isSuffices: false, isInProof: false }]]
        : [],
    ),
  );
  const bindings = new Map<string, ModuleBinding>(
    [...CORE_SYMBOLS, ...unit.bound].map((entry) => [
      entry[0],
      { ...entry[1], position: MODULE_START },
    ]),
  );
  const recursive = new Set<Binding>();
  const declarations: { declaration: Declaration; binding: ModuleBinding | undefined }[] = [];
  const createCheck = (
    location: SourceLocation,
    self: Definition | undefined,
    hasLabelScope: boolean,
    check: (inner: Unit) => void,
  ): SemanticUnit => ({
    location,
    check: (errors, warnings) =>
      check({
        imported: symbols,
        getInstance: unit.getInstance,
        definitions: unit.definitions,
        getKey: unit.getKey,
        location,
        self,
        facts: unit.facts,
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
      }),
  });
  const bindDeclarations = (declarations: Declaration[], kind: "Constant" | "Variable") =>
    declarations.map((declaration) =>
      createCheck(declaration.location, undefined, false, (inner) =>
        bindModuleName(
          declaration.name,
          { kind, arity: declaration.arity, range: declaration.location.range },
          inner,
        ),
      ),
    );
  return collectSemanticErrors(
    [
      ...module.units.flatMap((item): SemanticUnit[] => {
        const section =
          item.kind === "Variables"
            ? { type: "A VARIABLE declaration", location: item.location }
            : item.kind === "Constants"
              ? { type: "A declaration", location: item.location }
              : item.kind === "Module"
                ? { type: "A MODULE ", location: item.module.location }
                : item.kind === "Theorem"
                  ? { type: "A THEOREM", location: item.theorem.location }
                  : item.kind === "Assumption"
                    ? { type: "An ASSUME", location: item.assumption.location }
                    : item.kind === "Use"
                      ? { type: "A USE or HIDE", location: item.use.location }
                      : undefined;
        const range = section?.location.range;
        if (!section || !range) return [];
        return [
          {
            location: section.location,
            check: (errors) => {
              if (declarations.some((declared) => declared.binding?.isPending)) {
                errors.push({
                  location: formatRange(range),
                  message: `${section.type} may not appear within a recursive definition section.`,
                });
              }
            },
          },
        ];
      }),
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
        .map((declaration) =>
          createCheck(declaration.location, undefined, false, (inner) => {
            const binding: ModuleBinding = {
              kind: "Definition",
              arity: declaration.arity,
              params: Array(declaration.arity).fill(0),
              range: declaration.location.range,
              position: declaration.location,
              isPending: true,
            };
            const isBound = isBindable(
              declaration.name,
              bindings.get(declaration.name),
              binding,
              inner,
            );
            if (isBound) {
              bindings.set(declaration.name, binding);
              recursive.add(binding);
            }
            declarations.push({ declaration, binding: isBound ? binding : undefined });
          }),
        ),
      ...module.definitions.map((definition) =>
        createCheck(definition.location, definition, true, (inner) => {
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
        }),
      ),
      ...module.instances.map((instance) =>
        createCheck(instance.location, undefined, false, (inner) => {
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
        }),
      ),
      ...module.assumptions.map((assumption) =>
        createCheck(assumption.location, undefined, assumption.name !== undefined, (inner) => {
          resolveExpression(assumption.expression, undefined, inner);
          if (assumption.name !== undefined) {
            bindModuleName(
              assumption.name,
              { kind: "Theorem", arity: 0, range: assumption.location.range },
              inner,
            );
          }
        }),
      ),
      ...module.theorems.map((theorem) =>
        createCheck(theorem.location, undefined, theorem.name !== undefined, (inner) =>
          resolveTheorem(theorem, inner),
        ),
      ),
      ...module.uses.map((use) =>
        createCheck(use.location, undefined, false, (inner) =>
          checkUseOrHide(use, undefined, inner),
        ),
      ),
      {
        location: module.location.range?.end ?? module.location,
        check: (errors: SanyError[]) =>
          declarations.forEach((item) => {
            const range = item.declaration.location.range;
            if (range && (!item.binding || item.binding.isPending)) {
              errors.push({
                location: formatRange(range),
                message: `Symbol ${resolveSynonym(item.declaration.name)} declared in RECURSIVE statement but not defined.`,
              });
            }
          }),
      },
    ],
    unit.warnings,
  );
};
