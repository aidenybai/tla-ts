import {
  getChildren,
  isLocallyResolved,
  type AssumeProve,
  type Bound,
  type BoundPattern,
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
import {
  createSanyError,
  createSemanticError,
  formatRange,
  TlaSyntaxError,
  type SanyError,
} from "./errors";

export interface ModuleSymbol {
  key: string;
  arity: number;
  declaration?: "Constant" | "Variable";
}

export type Symbols = Map<string, ModuleSymbol>;

// A named theorem or proof step whose parts a name such as foo!lab or <1>2!1 selects. isInProof
// holds while SANY analyzes the proof of the theorem or step.
interface Goal {
  statement: Expression | AssumeProve;
  isSuffices: boolean;
  isInProof: boolean;
}

interface LocalName {
  name: string;
  arity: number;
  parent: LocalName | undefined;
  goal?: Goal;
}

// errors collects the errors SANY reports while it goes on analyzing the unit. A label may appear
// where hasLabelScope holds, in a definition, a named theorem, or a numbered step,
// except where isLabelForbidden holds, in the scope of a NEW in a nested ASSUME.
interface Unit {
  imported: Symbols;
  definitions: Map<string, Definition>;
  getKey: (definition: Definition) => string;
  location: SourceLocation;
  self: Definition | undefined;
  facts: Set<string>;
  goals: Map<string, Goal>;
  errors: SanyError[];
  hasLabelScope: boolean;
  isLabelForbidden: boolean;
}

interface SelectionState {
  node: Expression | NewSymbol | AssumeProve;
  isGoal: boolean;
  isSufficesOpen: boolean;
}

type Reference = Expression & { kind: "Identifier" | "Apply" | "Subexpression" };

export const LOCAL_RESOLUTION = { kind: "Local" } as const;

const renamedArities = new WeakMap<Expression, number>();

export const KEY_SEPARATOR = "@";

// A key is a name, the separator, and an id, so the operator @@ is not one.
const isKey = (name: string) => {
  const index = name.lastIndexOf(KEY_SEPARATOR);
  return index > 0 && index < name.length - 1;
};

const CORE_SYMBOLS: Symbols = new Map(
  ["~>", "-+->", "\\cdot"].map((name) => [name, { key: name, arity: 2 }]),
);

export const isBefore = (left: SourceLocation, right: SourceLocation) =>
  left.line < right.line || (left.line === right.line && left.column < right.column);

export const getArity = (definition: Definition) =>
  definition.kind === "Operator" ? definition.params.length : 0;

const isInstantiated = (definition: Definition) => definition.name.includes("!");

const lookupLocal = (scope: LocalName | undefined, name: string) => {
  for (let current = scope; current; current = current.parent) {
    if (current.name === name) return current;
  }
  return undefined;
};

const bindNames = (scope: LocalName | undefined, names: string[], arity = 0) =>
  names.reduce<LocalName | undefined>((parent, name) => ({ name, arity, parent }), scope);

const bindParams = (scope: LocalName | undefined, params: OperatorParam[]) =>
  params.reduce<LocalName | undefined>(
    (parent, param) => ({ name: param.name, arity: param.arity, parent }),
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
    ? { key: unit.getKey(definition), arity: getArity(definition) }
    : unit.imported.get(name);
};

// SANY reports a name at the range of its text.
const getNameRange = (location: SourceLocation, name: string): SourceRange => ({
  module: location.range?.module ?? "",
  start: location,
  end: { line: location.line, column: location.column + name.length - 1 },
});

// SANY reports an operator symbol applied to operands as one it cannot resolve.
const getFixity = (expression: Expression) => {
  if (expression.kind !== "Apply") return undefined;
  if (expression.args.length === 2) return "infix";
  if (expression.args.length !== 1) return undefined;
  return isBefore(expression.location, expression.args[0].location) ? "prefix" : "postfix";
};

// SANY names an undefined operator symbol such as + differently from an undefined identifier.
const isOperatorSymbol = (name: string) =>
  name[0].toLowerCase() === name[0].toUpperCase() &&
  name[0] !== "_" &&
  (name[0] < "0" || name[0] > "9");

const isStepName = (name: string) =>
  name.startsWith("<") && ((name[1] >= "0" && name[1] <= "9") || name[1] === "*");

export const getOperandIndex = (operand: number | "<<" | ">>", count: number) => {
  if (typeof operand === "number") return operand >= 1 && operand <= count ? operand - 1 : -1;
  if (operand === "<<") return count > 0 ? 0 : -1;
  return count === 2 ? 1 : -1;
};

const getSelectors = (reference: Reference): Selector[] =>
  reference.kind === "Subexpression"
    ? reference.selectors
    : (reference.kind === "Identifier" ? reference.name : reference.operator)
        .split("!")
        .map((name) => ({ kind: "Name", name, args: [] }));

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

// SANY drops a label in the scope of a NEW in a nested ASSUME, after it reports the label.
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

const getOperandName = (operand: number | "<<" | ">>") =>
  typeof operand === "number" ? `argument selector ${operand}` : operand;

const SCOPE_MESSAGE = "within the scope of a declaration\n from outside that declaration's scope.";

// Generator.selectorToNode for a name that selects part of a theorem or step. A part in the scope of
// a NEW in its ASSUME may be selected only within the proof of the theorem, or only after the proof
// of a SUFFICES step. A fact may select an ASSUME/PROVE or a NEW clause.
const checkSelection = (
  reference: Reference,
  selectors: Selector[],
  goal: Goal,
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
  const second = selectors[1];
  if (second.kind === "Name") {
    const clauses =
      statement.kind === "AssumeProve"
        ? [...statement.assumptions, statement.conclusion]
        : [statement];
    const found = clauses
      .map((clause, index) => ({ index, label: findClauseLabel(clause, second.name, false) }))
      .find((item) => item.label !== undefined);
    if (!found) return report(1, `Cannot find label \`${second.name}'.`);
    if (
      statement.kind === "AssumeProve" &&
      isInScopeOfDeclaration(statement, found.index) &&
      isOutOfScope
    ) {
      return report(
        1,
        `Accessing subexpression labeled \`${second.name}' of ASSUME/PROVE clause ${SCOPE_MESSAGE}`,
      );
    }
    selectors.slice(2).reduce((label, selector, offset) => {
      if (!label || selector.kind !== "Name") return undefined;
      const inner = findLabel(label.body, selector.name);
      if (!inner) report(offset + 2, `Cannot find label \`${selector.name}'.`);
      return inner;
    }, found.label);
    return;
  }
  const state: SelectionState = {
    node: statement,
    isGoal: true,
    isSufficesOpen: goal.isSuffices,
  };
  for (const [offset, selector] of selectors.slice(1).entries()) {
    const index = offset + 1;
    const node = state.node;
    if (selector.kind !== "Operand") return;
    if (state.isSufficesOpen) {
      if (getOperandIndex(selector.operand, 1) !== 0) {
        return report(
          index,
          node.kind === "AssumeProve"
            ? "Accessing non-existent subexpression of a SUFFICES"
            : `Nonexistent operand specified by \`${getOperandName(selector.operand)}'.`,
        );
      }
      state.isSufficesOpen = false;
      continue;
    }
    if (node.kind !== "AssumeProve") return;
    const clauses = [...node.assumptions, node.conclusion];
    const position = getOperandIndex(selector.operand, clauses.length);
    if (position === -1) {
      return report(
        index,
        `Nonexistent operand specified by \`${getOperandName(selector.operand)}'.`,
      );
    }
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

// Generator.generateLabel reports a label where it may not appear, and skips the label's body.
const isLabelReported = (label: LabelExpression, unit: Unit) => {
  const message = !unit.hasLabelScope
    ? "Label not in definition or proof step."
    : unit.isLabelForbidden
      ? "Label not allowed within scope of declaration in nested ASSUME/PROVE."
      : undefined;
  if (message === undefined || !label.location.range) return false;
  unit.errors.push({ location: formatRange(label.location.range), message });
  return true;
};

// Checks a name that selects part of a theorem or step, and tells whether it is one.
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
  if (goal) checkSelection(expression, selectors, goal, unit, isFact);
  return goal !== undefined;
};

const getSymbolArity = (
  expression: Expression & { kind: "Identifier" | "Apply" | "OperatorReference" },
  name: string,
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const location = expression.location;
  const renamed = renamedArities.get(expression);
  if (renamed !== undefined) return renamed;
  if (isKey(name)) return expression.kind === "Apply" ? expression.args.length : 0;
  if (checkReference(expression, scope, unit, false) || isStepName(name)) {
    return expression.kind === "Apply" ? expression.args.length : 0;
  }
  const local = lookupLocal(scope, name);
  if (local && expression.kind !== "OperatorReference") expression.resolution = LOCAL_RESOLUTION;
  if (local) return local.arity;
  const symbol = findSymbol(name, unit);
  if (symbol) {
    if (expression.kind === "Identifier") expression.name = symbol.key;
    else expression.operator = symbol.key;
    renamedArities.set(expression, symbol.arity);
    return symbol.arity;
  }
  // A name such as Inv!P1 selects the label P1 of a definition or theorem, which takes its own
  // arguments.
  const prefix = name.includes("!") ? name.slice(0, name.indexOf("!")) : "";
  const isSelected =
    prefix !== "" &&
    (lookupLocal(scope, prefix) !== undefined ||
      findSymbol(prefix, unit) !== undefined ||
      unit.facts.has(prefix));
  if (isSelected) {
    return expression.kind === "Apply" ? expression.args.length : 0;
  }
  const range = getNameRange(location, name === "-." ? "-" : name);
  if (!isOperatorSymbol(name)) throw createSemanticError(`Unknown operator: \`${name}'.`, range);
  const missing = {
    location: formatRange(range),
    message: `Could not find declaration or definition of symbol '${name}'.`,
  };
  const fixity = getFixity(expression);
  throw createSanyError(
    fixity && location.range
      ? [
          missing,
          {
            location: formatRange(location.range),
            message: `Couldn't resolve ${fixity} operator symbol \`${name}'.`,
          },
        ]
      : [missing],
  );
};

const resolveBounds = (bounds: Bound[], scope: LocalName | undefined, unit: Unit) => {
  bounds.forEach((bound) => resolveExpression(bound.set, scope, unit));
  return bounds.reduce(
    (current, bound) => bindNames(current, getPatternNames(bound.pattern)),
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

const resolveDefinition = (definition: Definition, scope: LocalName | undefined, outer: Unit) => {
  const unit = outer.hasLabelScope ? outer : { ...outer, hasLabelScope: true };
  const self = bindNames(scope, definition.kind === "Function" ? [definition.name] : []);
  if (definition.kind === "Function") {
    resolveExpression(definition.body, resolveBounds(definition.bounds, self, unit), unit);
    markRecursiveConstructions(definition.body, definition.name);
    return;
  }
  resolveExpression(definition.body, bindParams(self, definition.params), unit);
};

const resolveDefinitions = (
  definitions: Definition[],
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const recursiveScope = definitions
    .filter((definition) => definition.isRecursive)
    .reduce<LocalName | undefined>(
      (parent, definition) => ({ name: definition.name, arity: getArity(definition), parent }),
      scope,
    );
  return definitions.reduce((current, definition) => {
    if (!isInstantiated(definition)) resolveDefinition(definition, current, unit);
    return { name: definition.name, arity: getArity(definition), parent: current };
  }, recursiveScope);
};

// OpDefNode#match: a parameter of arity 0 takes an expression, and a parameter of arity n takes an
// operator of arity n whose own parameters take expressions.
const checkArgument = (
  definition: Definition,
  index: number,
  arg: Expression,
  argArity: number,
  argDefinition: Definition | undefined,
) => {
  const param = definition.kind === "Operator" ? definition.params[index] : undefined;
  const location = arg.location;
  if (param?.arity === 0 && argArity > 0) {
    throw new TlaSyntaxError(
      `Operator used in argument number ${index + 1} has incorrect number of arguments at line ${location.line}, column ${location.column}`,
    );
  }
  const isHigherOrder =
    argDefinition?.kind === "Operator" && argDefinition.params.some((inner) => inner.arity > 0);
  if (param !== undefined && param.arity > 0 && (argArity !== param.arity || isHigherOrder)) {
    throw new TlaSyntaxError(
      `Argument number ${index + 1} to operator '${definition.name}' should be a ${param.arity}-parameter operator at line ${location.line}, column ${location.column}`,
    );
  }
};

const getArgumentName = (arg: Expression) =>
  arg.kind === "Identifier"
    ? arg.name
    : arg.kind === "OperatorReference"
      ? arg.operator
      : undefined;

const resolveApply = (
  expression: Expression & { kind: "Apply" },
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const operator = expression.operator;
  const callee = lookupLocal(scope, operator) ? undefined : getVisibleDefinition(operator, unit);
  const arity = getSymbolArity(expression, operator, scope, unit);
  if (arity !== expression.args.length) {
    throw createSemanticError(
      `The operator ${operator} requires ${arity} arguments.`,
      expression.argumentsRange ?? getNameRange(expression.location, operator),
    );
  }
  expression.args.forEach((arg, index) => {
    const name = getArgumentName(arg);
    const argDefinition =
      name === undefined || lookupLocal(scope, name) ? undefined : getVisibleDefinition(name, unit);
    const argArity = resolveArgument(arg, scope, unit);
    if (callee) checkArgument(callee, index, arg, argArity, argDefinition);
  });
};

// An argument may name an operator that takes arguments of its own.
const resolveArgument = (arg: Expression, scope: LocalName | undefined, unit: Unit) => {
  if (arg.kind === "Identifier") return getSymbolArity(arg, arg.name, scope, unit);
  if (arg.kind === "OperatorReference") return getSymbolArity(arg, arg.operator, scope, unit);
  resolveExpression(arg, scope, unit);
  return arg.kind === "Lambda" ? arg.params.length : 0;
};

const resolveExpression = (
  expression: Expression,
  scope: LocalName | undefined,
  unit: Unit,
): void => {
  const resolveAll = (expressions: Expression[]) =>
    expressions.forEach((child) => resolveExpression(child, scope, unit));
  switch (expression.kind) {
    case "Number":
    case "Decimal":
    case "String":
    case "ExceptAt":
      return;
    case "Identifier": {
      const name = expression.name;
      const arity = getSymbolArity(expression, name, scope, unit);
      if (arity > 0) {
        throw createSemanticError(
          `The operator ${name} requires ${arity} arguments.`,
          getNameRange(expression.location, name),
        );
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
      resolveExpression(expression.body, bindNames(scope, expression.params), unit);
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
        resolveDefinitions(expression.definitions, scope, unit),
        unit,
      );
      return;
    case "Forall":
    case "Exists":
    case "FunctionConstruction":
      resolveExpression(expression.body, resolveBounds(expression.bounds, scope, unit), unit);
      return;
    case "UnboundedQuantifier":
      resolveExpression(expression.body, bindNames(scope, expression.names), unit);
      return;
    case "Choose":
      if (expression.set) resolveExpression(expression.set, scope, unit);
      resolveExpression(
        expression.body,
        bindNames(scope, getPatternNames(expression.pattern)),
        unit,
      );
      return;
    case "SetEnumeration":
    case "Tuple":
      resolveAll(expression.elements);
      return;
    case "SetFilter":
      resolveExpression(expression.predicate, resolveBounds([expression.bound], scope, unit), unit);
      return;
    case "SetMap":
      resolveExpression(expression.expression, resolveBounds(expression.bounds, scope, unit), unit);
      return;
    case "FunctionSet":
      resolveAll([expression.domain, expression.range]);
      return;
    case "Record":
    case "RecordSet": {
      const repeated = expression.fields.filter((field, index) =>
        expression.fields.slice(0, index).some((earlier) => earlier.name === field.name),
      );
      if (repeated.length > 0) {
        throw createSanyError(
          repeated.map((field) => ({
            location: formatRange(field.location.range ?? getNameRange(field.location, field.name)),
            message: "Non-unique fields in constructor.",
          })),
        );
      }
      resolveAll(expression.fields.map((field) => field.value));
      return;
    }
    case "Except":
      resolveAll([
        expression.function,
        ...expression.updates.flatMap((update) => [
          ...update.path.flatMap((step) => (step.kind === "Index" ? step.args : [])),
          update.value,
        ]),
      ]);
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
      if (!isLabelReported(expression, unit)) resolveExpression(expression.body, scope, unit);
      return;
    case "Subexpression": {
      expression.selectors
        .flatMap((selector) => ("args" in selector ? selector.args : []))
        .forEach((arg) => resolveArgument(arg, scope, unit));
      checkReference(expression, scope, unit, false);
    }
  }
};

// SANY analyzes the facts of a proof apart from their names, which may name theorems and modules.
const checkFacts = (facts: Fact[], scope: LocalName | undefined, unit: Unit) => {
  const check = (expression: Expression, isFact: boolean, inner: Unit): void => {
    if (expression.kind === "Label" && isLabelReported(expression, inner)) return;
    checkReference(expression, scope, inner, isFact);
    getChildren(expression).forEach((child) =>
      check(
        child,
        false,
        expression.kind === "Let" && child !== expression.body
          ? { ...inner, hasLabelScope: true }
          : inner,
      ),
    );
  };
  facts.forEach((fact) => {
    if (fact.kind !== "ModuleFact") check(fact, true, { ...unit, hasLabelScope: false });
  });
};

const resolveNewSymbol = (symbol: NewSymbol, scope: LocalName | undefined, unit: Unit) => {
  if (symbol.set) resolveExpression(symbol.set, scope, unit);
  return { name: symbol.name, arity: symbol.arity, parent: scope };
};

// The NEW symbols of an ASSUME stay in scope for its conclusion and the proof that follows. SANY
// forbids a label in the scope of a NEW in a nested ASSUME.
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

// SANY resolves the expressions of a proof, while its facts and DEF clauses may also name
// theorems, assumptions, and modules.
const resolveProof = (proof: Proof | undefined, scope: LocalName | undefined, outer: Unit) => {
  const unit = outer.hasLabelScope ? { ...outer, hasLabelScope: false } : outer;
  if (proof?.kind === "By") checkFacts(proof.facts, scope, unit);
  if (proof?.kind !== "Steps") return;
  proof.steps.reduce((current, step) => resolveStep(step, current, unit), scope);
};

const resolveStep = (
  step: ProofStep,
  scope: LocalName | undefined,
  unit: Unit,
): LocalName | undefined => {
  const body = step.body;
  const stepUnit = step.name === undefined ? unit : { ...unit, hasLabelScope: true };
  switch (body.kind) {
    case "Assert": {
      const assumed = resolveStatement(body.statement, scope, stepUnit);
      const name = step.name;
      if (name === undefined) {
        resolveProof(step.proof, assumed, unit);
        return body.isSuffices ? assumed : scope;
      }
      const goal = { statement: body.statement, isSuffices: body.isSuffices, isInProof: true };
      resolveProof(step.proof, { name, arity: 0, parent: assumed, goal }, unit);
      goal.isInProof = false;
      return { name, arity: 0, parent: body.isSuffices ? assumed : scope, goal };
    }
    case "Use":
    case "Hide":
      checkFacts(body.facts, scope, unit);
      return scope;
    case "Define":
      return resolveDefinitions(
        body.definitions.flatMap((definition) =>
          definition.kind === "Instance" ? [] : [definition],
        ),
        scope,
        unit,
      );
    case "Have":
    case "Case":
      resolveExpression(body.expression, scope, stepUnit);
      resolveProof(step.proof, scope, unit);
      return scope;
    case "Witness":
      body.expressions.forEach((expression) => resolveExpression(expression, scope, stepUnit));
      return scope;
    case "Take":
      return bindNames(resolveBounds(body.bounds, scope, stepUnit), body.names);
    case "Pick": {
      const picked = bindNames(resolveBounds(body.bounds, scope, stepUnit), body.names);
      resolveExpression(body.body, picked, stepUnit);
      resolveProof(step.proof, scope, unit);
      return picked;
    }
    default:
      resolveProof(step.proof, scope, unit);
      return scope;
  }
};

const resolveTheorem = (theorem: Theorem, unit: Unit) => {
  const isDefinition = theorem.name !== undefined && theorem.statement.kind !== "AssumeProve";
  const scope = isDefinition ? undefined : resolveStatement(theorem.statement, undefined, unit);
  const goal = unit.goals.get(theorem.name ?? "");
  if (goal) goal.isInProof = true;
  resolveProof(theorem.proof, scope, unit);
  if (goal) goal.isInProof = false;
};

interface ModuleUnit {
  imported: Symbols;
  importedAt: Map<string, SourceLocation>;
  definitions: Map<string, Definition>;
  getKey: (definition: Definition) => string;
}

interface ModuleName {
  name: string;
  kind: "Definition" | "Constant" | "Variable";
  location: SourceLocation;
  isRecursive: boolean;
}

type IsDefined = (name: string) => boolean;

const createRedefinitionError = (name: string, location: SourceLocation) =>
  new TlaSyntaxError(
    `Multiply-defined symbol '${name}' at line ${location.line}, column ${location.column}`,
  );

const bindUnique = (
  scope: LocalName | undefined,
  names: string[],
  isDefined: IsDefined,
  location: SourceLocation,
) =>
  names.reduce<LocalName | undefined>((parent, name) => {
    if (lookupLocal(parent, name) || isDefined(name)) throw createRedefinitionError(name, location);
    return { name, arity: 0, parent };
  }, scope);

const checkBoundNames = (
  bounds: Bound[],
  scope: LocalName | undefined,
  isDefined: IsDefined,
  location: SourceLocation,
) => {
  bounds.forEach((bound) => checkNames(bound.set, scope, isDefined));
  return bounds.reduce(
    (current, bound) => bindUnique(current, getPatternNames(bound.pattern), isDefined, location),
    scope,
  );
};

const checkDefinitionNames = (
  definition: Definition,
  scope: LocalName | undefined,
  isDefined: IsDefined,
) => {
  if (definition.kind === "Function") {
    const self = bindNames(scope, [definition.name]);
    const bound = checkBoundNames(definition.bounds, self, isDefined, definition.location);
    checkNames(definition.body, bound, isDefined);
    return;
  }
  const params = bindUnique(
    scope,
    definition.params.map((param) => param.name),
    isDefined,
    definition.location,
  );
  checkNames(definition.body, params, isDefined);
};

const checkNames = (
  expression: Expression,
  scope: LocalName | undefined,
  isDefined: IsDefined,
): void => {
  const location = expression.location;
  switch (expression.kind) {
    case "Lambda":
      checkNames(
        expression.body,
        bindUnique(scope, expression.params, isDefined, location),
        isDefined,
      );
      return;
    case "Let": {
      const recursive = expression.definitions
        .filter((definition) => definition.isRecursive)
        .map((definition) => definition.name);
      const inner = expression.definitions.reduce((current, definition) => {
        if (lookupLocal(current, definition.name) || isDefined(definition.name)) {
          throw createRedefinitionError(definition.name, definition.location);
        }
        checkDefinitionNames(definition, bindNames(current, recursive), isDefined);
        return bindNames(current, [definition.name]);
      }, scope);
      checkNames(
        expression.body,
        bindUnique(
          inner,
          (expression.instances ?? []).flatMap((instance) =>
            instance.name === undefined ? [] : [instance.name],
          ),
          isDefined,
          location,
        ),
        isDefined,
      );
      return;
    }
    case "Forall":
    case "Exists":
    case "FunctionConstruction":
      checkNames(
        expression.body,
        checkBoundNames(expression.bounds, scope, isDefined, location),
        isDefined,
      );
      return;
    case "SetFilter":
      checkNames(
        expression.predicate,
        checkBoundNames([expression.bound], scope, isDefined, location),
        isDefined,
      );
      return;
    case "SetMap":
      checkNames(
        expression.expression,
        checkBoundNames(expression.bounds, scope, isDefined, location),
        isDefined,
      );
      return;
    case "UnboundedQuantifier":
      checkNames(
        expression.body,
        bindUnique(scope, expression.names, isDefined, location),
        isDefined,
      );
      return;
    case "Choose":
      if (expression.set) checkNames(expression.set, scope, isDefined);
      checkNames(
        expression.body,
        bindUnique(scope, getPatternNames(expression.pattern), isDefined, location),
        isDefined,
      );
      return;
    default:
      getChildren(expression).forEach((child) => checkNames(child, scope, isDefined));
  }
};

const getModuleNames = (module: Module) => [
  ...module.definitions.map((definition): ModuleName => ({
    name: definition.name,
    kind: "Definition",
    location: definition.location,
    isRecursive: definition.isRecursive,
  })),
  ...module.instances.flatMap((instance): ModuleName[] =>
    instance.name === undefined
      ? []
      : [
          {
            name: instance.name,
            kind: "Definition",
            location: instance.location,
            isRecursive: false,
          },
        ],
  ),
  ...module.constants.map((constant): ModuleName => ({
    name: constant.name,
    kind: "Constant",
    location: constant.location,
    isRecursive: false,
  })),
  ...module.variables.map((variable): ModuleName => ({
    name: variable.name,
    kind: "Variable",
    location: variable.location,
    isRecursive: false,
  })),
];

export const checkRedefinitions = (module: Module, unit: ModuleUnit) => {
  const byName = new Map<string, ModuleName[]>();
  getModuleNames(module)
    .sort((left, right) => (isBefore(left.location, right.location) ? -1 : 1))
    .forEach((entry) => byName.set(entry.name, [...(byName.get(entry.name) ?? []), entry]));
  const isImportedBefore = (name: string, location: SourceLocation) => {
    if (!unit.imported.has(name) && !CORE_SYMBOLS.has(name)) return false;
    const importedAt = unit.importedAt.get(name);
    return importedAt === undefined || isBefore(importedAt, location);
  };
  byName.forEach((entries) =>
    entries.forEach((entry, index) => {
      const isDuplicate = entries
        .slice(0, index)
        .some(
          (earlier) =>
            earlier.kind === "Definition" ||
            entry.kind === "Definition" ||
            earlier.kind !== entry.kind,
        );
      // A module may declare again a constant or variable that it extends or that encloses it.
      const isRedeclared = unit.imported.get(entry.name)?.declaration === entry.kind;
      if (isDuplicate || (!isRedeclared && isImportedBefore(entry.name, entry.location)))
        throw createRedefinitionError(entry.name, entry.location);
    }),
  );
  const getIsDefined =
    (location: SourceLocation): IsDefined =>
    (name) =>
      (byName.get(name) ?? []).some(
        (entry) => entry.isRecursive || isBefore(entry.location, location),
      ) || isImportedBefore(name, location);
  module.definitions.forEach((definition) =>
    checkDefinitionNames(definition, undefined, getIsDefined(definition.location)),
  );
  module.assumptions.forEach((assumption) =>
    checkNames(assumption.expression, undefined, getIsDefined(assumption.location)),
  );
  module.instances.forEach((instance) => {
    const isDefined = getIsDefined(instance.location);
    const params = bindUnique(
      undefined,
      instance.params.map((param) => param.name),
      isDefined,
      instance.location,
    );
    instance.substitutions.forEach((substitution) =>
      checkNames(substitution.expression, params, isDefined),
    );
  });
};

const createSymbols = (module: Module, imported: Symbols) => {
  const symbols = new Map([...CORE_SYMBOLS, ...imported]);
  module.constants.forEach((constant) =>
    symbols.set(constant.name, { key: constant.name, arity: constant.arity }),
  );
  module.variables.forEach((variable) =>
    symbols.set(variable.name, { key: variable.name, arity: 0 }),
  );
  return symbols;
};

export const resolveSubstitutions = (
  instance: Instance,
  declarations: OperatorParam[],
  module: Module,
  unit: ModuleUnit,
) => {
  const scope = bindParams(undefined, instance.params);
  const context: Unit = {
    imported: createSymbols(module, unit.imported),
    definitions: unit.definitions,
    getKey: unit.getKey,
    location: instance.location,
    self: undefined,
    facts: new Set(),
    goals: new Map(),
    errors: [],
    hasLabelScope: true,
    isLabelForbidden: false,
  };
  const explicit = new Map(instance.substitutions.map((item) => [item.name, item.expression]));
  const position = `in the instance of ${instance.module} at line ${instance.location.line}, column ${instance.location.column}`;
  explicit.forEach((_, name) => {
    if (declarations.every((declaration) => declaration.name !== name)) {
      throw new TlaSyntaxError(
        `Identifier '${name}' is not a legal target of a substitution ${position}`,
      );
    }
  });
  return new Map(
    declarations.map((declaration): [string, Expression] => {
      const name = declaration.name;
      if (!explicit.has(name) && !lookupLocal(scope, name) && !findSymbol(name, context)) {
        throw new TlaSyntaxError(`Substitution missing for symbol ${name} ${position}`);
      }
      const expression: Expression = explicit.get(name) ?? {
        kind: "Identifier",
        name,
        location: instance.location,
      };
      if (declaration.arity === 0 || expression.kind !== "Identifier") {
        resolveExpression(expression, scope, context);
        return [name, expression];
      }
      if (getSymbolArity(expression, expression.name, scope, context) !== declaration.arity) {
        throw new TlaSyntaxError(
          `An operator must be substituted for symbol '${name}', and it must have arity ${declaration.arity} ${position}`,
        );
      }
      return [name, expression];
    }),
  );
};

// SANY reports the errors of every unit it checks, in the order of the units in the module. A unit
// reports to its list the errors after which SANY goes on, and throws the one that stops it.
export const collectSemanticErrors = (
  units: { location: SourceLocation; check: (reported: SanyError[]) => void }[],
) => {
  const errors: SanyError[] = [];
  units
    .toSorted((left, right) => (isBefore(left.location, right.location) ? -1 : 1))
    .forEach((unit) => {
      const reported: SanyError[] = [];
      try {
        unit.check(reported);
      } catch (error) {
        if (!(error instanceof TlaSyntaxError) || !error.sany) throw error;
        reported.push(...error.sany.errors);
      }
      reported.forEach((item) => {
        if (
          errors.every(
            (existing) => existing.location !== item.location || existing.message !== item.message,
          )
        ) {
          errors.push(item);
        }
      });
    });
  if (errors.length > 0) throw createSanyError(errors);
};

export const resolveModule = (module: Module, unit: ModuleUnit) => {
  const symbols = createSymbols(module, unit.imported);
  const facts = new Set(
    [...module.theorems, ...module.assumptions].flatMap((fact) => fact.name ?? []),
  );
  const goals = new Map(
    module.theorems.flatMap((theorem): [string, Goal][] =>
      theorem.name !== undefined && theorem.statement.kind === "AssumeProve"
        ? [[theorem.name, { statement: theorem.statement, isSuffices: false, isInProof: false }]]
        : [],
    ),
  );
  const createUnit = (
    location: SourceLocation,
    self: Definition | undefined,
    errors: SanyError[],
    hasLabelScope: boolean,
  ): Unit => ({
    imported: symbols,
    definitions: unit.definitions,
    getKey: unit.getKey,
    location,
    self,
    facts,
    goals,
    errors,
    hasLabelScope,
    isLabelForbidden: false,
  });
  collectSemanticErrors([
    ...module.definitions.map((definition) => ({
      location: definition.location,
      check: (errors: SanyError[]) =>
        resolveDefinition(
          definition,
          undefined,
          createUnit(definition.location, definition, errors, true),
        ),
    })),
    // An assumption holds the subexpressions its references select, labels and all, so its own
    // labels go unchecked.
    ...module.assumptions.map((assumption) => ({
      location: assumption.location,
      check: (errors: SanyError[]) =>
        resolveExpression(
          assumption.expression,
          undefined,
          createUnit(assumption.location, undefined, errors, true),
        ),
    })),
    ...module.theorems.map((theorem) => ({
      location: theorem.location,
      check: (errors: SanyError[]) =>
        resolveTheorem(
          theorem,
          createUnit(theorem.location, undefined, errors, theorem.name !== undefined),
        ),
    })),
    ...module.uses.map((use) => ({
      location: use.location,
      check: (errors: SanyError[]) =>
        checkFacts(use.facts, undefined, createUnit(use.location, undefined, errors, false)),
    })),
  ]);
};
