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

// The kinds of symbol SANY tells apart when it binds a name twice. A parameter is also a bound name,
// and a NEW symbol has a kind for each level.
export type SymbolKind =
  | "Builtin"
  | "Constant"
  | "Variable"
  | "Definition"
  | "Instance"
  | "Theorem"
  | "Parameter"
  | `New${NewSymbol["level"]}`;

// range is where SANY reports the symbol, and two symbols at one range are one node to SANY. params
// holds the arity of each parameter of a defined operator.
export interface Binding {
  kind: SymbolKind;
  arity: number;
  params?: number[];
  range?: SourceRange;
}

export interface ModuleSymbol extends Binding {
  key: string;
}

export type Symbols = Map<string, ModuleSymbol>;

// A named theorem or proof step whose parts a name such as foo!lab or <1>2!1 selects. isInProof
// holds while SANY analyzes the proof of the theorem or step.
interface Goal {
  statement: Expression | AssumeProve;
  isSuffices: boolean;
  isInProof: boolean;
}

// isPending holds for an operator a RECURSIVE declaration names until its definition.
interface LocalName extends Binding {
  name: string;
  parent: LocalName | undefined;
  goal?: Goal;
  isPending?: boolean;
}

// A name the module binds, from position on.
interface ModuleBinding extends Binding {
  position: SourceLocation;
  isPending?: boolean;
}

// errors and warnings collect what SANY reports while it goes on analyzing the unit, and bindings
// holds the names the module binds. A label may appear where hasLabelScope holds, in a definition, a
// named theorem, or a numbered step, except where isLabelForbidden holds, in the scope of a NEW in a
// nested ASSUME. isGenerated holds in a definition tla-ts generates for a LET INSTANCE.
interface Unit {
  imported: Symbols;
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
  isGenerated: boolean;
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

// A name the module binds before the unit and before the range, which a copy of a subexpression
// that a reference selects keeps from its definition.
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

// SymbolTable.addSymbol binds a name nothing binds yet. It rejects a built-in operator, a parameter
// or bound name already in use, and a symbol of another kind or arity than the one bound, and warns
// of any other duplicate. tla-ts binds a symbol SANY never sees, such as one it generates. Tells
// whether to bind the added symbol.
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

// Binds the names of a module from the unit on.
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

// Generator.selectorToNode reports an unknown operator and goes on without analyzing its arguments,
// so its arity is undefined. It does the same for an operator given the wrong number of arguments.
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
  const range = formatRange(getNameRange(location, name === "-." ? "-" : name));
  if (!isOperatorSymbol(name)) {
    unit.errors.push({ location: range, message: `Unknown operator: \`${name}'.` });
    return undefined;
  }
  unit.errors.push({
    location: range,
    message: `Could not find declaration or definition of symbol '${name}'.`,
  });
  const fixity = getFixity(expression);
  if (fixity && location.range) {
    unit.errors.push({
      location: formatRange(location.range),
      message: `Couldn't resolve ${fixity} operator symbol \`${name}'.`,
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

// Generator.processOperator binds the parameters, reports a name already bound unless a RECURSIVE
// declaration of this level awaits the definition, analyzes the body, and then binds the name.
// processFunction binds the bound names before it looks up the name, and binds the name only where
// nothing else does. recursive holds the declarations of this level. Tells whether to bind the name.
const resolveDefinition = (
  definition: Definition,
  scope: LocalName | undefined,
  outer: Unit,
  recursive: Set<Binding>,
) => {
  const unit = outer.hasLabelScope ? outer : { ...outer, hasLabelScope: true };
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
  return definitions.reduce<LocalName | undefined>((current, definition) => {
    const local: LocalName = {
      name: definition.name,
      arity: getArity(definition),
      kind: "Definition",
      range: definition.location.range,
      parent: current,
    };
    if (isInstantiated(definition)) return local;
    const isGenerated = unit.isGenerated || definition.isLocal || isKey(definition.name);
    return resolveDefinition(
      definition,
      current,
      isGenerated ? { ...unit, isGenerated } : unit,
      recursive,
    )
      ? { ...local, params: getParamArities(definition) }
      : current;
  }, declared);
};

// Generator.generateExprOrOpArg analyzes an argument as an expression, unless a defined operator
// takes an operator in its place, which a name, a built-in operator, or a LAMBDA of the parameter's
// arity must give. OpDefNode#match then reports each argument that gives no such operator, or one
// whose own parameters take operators. tla-ts lets an operator whose parameters it does not know
// take any argument.
const resolveApply = (
  expression: Expression & { kind: "Apply" },
  scope: LocalName | undefined,
  unit: Unit,
) => {
  const operator = expression.operator;
  const callee = findBinding(operator, scope, unit);
  const arity = getSymbolArity(expression, operator, scope, unit);
  if (arity === undefined) return;
  if (arity !== expression.args.length) {
    unit.errors.push({
      location: formatRange(
        expression.argumentsRange ?? getNameRange(expression.location, operator),
      ),
      message: `The operator ${operator} requires ${arity} arguments.`,
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
      // A prefix operator argument such as SUBSET, which tla-ts reads as a LAMBDA, has no range.
      const range = arg.location.range;
      if (expected === 0) {
        if (arg.kind === "Lambda" && range) {
          report(range, "LAMBDA expression used where an expression is required.");
        } else if (arg.kind === "OperatorReference") {
          // SANY fails here with an internal error, so tla-ts words it as it does for a name.
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
        if (!isMatched && range) {
          report(
            expression.selectorRanges?.at(-1) ?? getNameRange(expression.location, operator),
            `Lambda expression with arity ${arg.params.length} used as argument ${index + 1} of operator \`${operator}', \nbut an operator of arity ${expected} is required.`,
          );
        }
        return isMatched;
      }
      if (arg.kind === "Subexpression") {
        resolveExpression(arg, scope, unit);
        return true;
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
          getNameRange(arg.location, name),
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

// An argument may name an operator that takes arguments of its own.
const resolveArgument = (arg: Expression, scope: LocalName | undefined, unit: Unit) => {
  if (arg.kind === "Identifier") getSymbolArity(arg, arg.name, scope, unit);
  else resolveExpression(arg, scope, unit);
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
      if (arity !== undefined && arity > 0) {
        unit.errors.push({
          location: formatRange(getNameRange(expression.location, name)),
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
        unit,
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
      resolveExpression(
        expression.body,
        bindNames(scope, expression.names, expression.nameRanges, unit),
        unit,
      );
      return;
    case "Choose":
      if (expression.set) resolveExpression(expression.set, scope, unit);
      resolveExpression(
        expression.body,
        bindNames(scope, getPatternNames(expression.pattern), expression.pattern.ranges, unit),
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
  return bindName(
    scope,
    symbol.name,
    { kind: `New${symbol.level}`, arity: symbol.arity, range: symbol.nameRange },
    unit,
  );
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
    // The NEW symbols of a SUFFICES ASSUME are in scope after its proof, and those of any other
    // ASSUME in its proof.
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
      return bindNames(
        resolveBounds(body.bounds, scope, stepUnit),
        body.names,
        body.nameRanges,
        stepUnit,
      );
    case "Pick": {
      const picked = bindNames(
        resolveBounds(body.bounds, scope, stepUnit),
        body.names,
        body.nameRanges,
        stepUnit,
      );
      resolveExpression(body.body, picked, stepUnit);
      resolveProof(step.proof, scope, unit);
      return picked;
    }
    default:
      resolveProof(step.proof, scope, unit);
      return scope;
  }
};

// SANY binds the name of a theorem after its statement and before its proof.
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

// What SANY reports at a location as it links a module, such as a conflict between the modules it
// extends.
export interface ModuleReport {
  location: SourceLocation;
  errors: SanyError[];
  warnings: SanyError[];
}

// bound holds the names in scope where the module starts: the built-in operators, the names of the
// module that encloses it, and those of the modules it extends. instanced holds the names each
// INSTANCE adds, and warnings the warnings SANY reports for the spec.
export interface ModuleUnit {
  imported: Symbols;
  bound: Symbols;
  definitions: Map<string, Definition>;
  getKey: (definition: Definition) => string;
  instanced: Map<Instance, Symbols>;
  reports: ModuleReport[];
  warnings: SanyError[];
}

export const MODULE_START: SourceLocation = { line: 0, column: 0 };

// A named theorem or assumption is linked as a definition too.
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

// Generator.processSubst analyzes the explicit substitutions in the order they appear, then the
// implicit ones, and then reports each declaration left without one. tla-ts reports what SANY goes on
// after with the INSTANCE.
export const resolveSubstitutions = (
  instance: Instance,
  declarations: Declaration[],
  module: Module,
  unit: ModuleUnit,
) => {
  const scope = instance.params.reduce<LocalName | undefined>(
    (parent, param) => ({ name: param.name, arity: param.arity, kind: "Parameter", parent }),
    undefined,
  );
  const imported = createSymbols(module, unit.imported);
  const report: ModuleReport = { location: instance.location, errors: [], warnings: [] };
  unit.reports.push(report);
  const context: Unit = {
    imported,
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
    hasLabelScope: true,
    isLabelForbidden: false,
    isGenerated: false,
  };
  const resolveSubstitute = (declaration: Declaration, expression: Expression) => {
    if (declaration.arity === 0 || expression.kind !== "Identifier") {
      resolveExpression(expression, scope, context);
      return;
    }
    const arity = getSymbolArity(expression, expression.name, scope, context);
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
      report.errors.push({
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
      report.errors.push({
        location: formatRange(range),
        message: `Multiple substitutions for symbol '${name}' in substitution.`,
      });
    }
  });
  const implicit = declarations.filter((declaration) => !substitutions.has(declaration.name));
  const isMissing = (declaration: Declaration) =>
    !lookupLocal(scope, declaration.name) && !findSymbol(declaration.name, context);
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
      report.errors.push({
        location: formatRange(range),
        message: `Substitution missing for symbol ${declaration.name} declared at ${formatRange(declared)} \nand instantiated in module ${module.name}.`,
      });
    }
  });
  return substitutions;
};

// SANY reports the errors of every unit it checks, in the order of the units in the module, after
// the warnings it reports for the spec. A unit reports to its lists what SANY goes on after, and
// throws the error that stops it. An error tla-ts cannot word as SANY does yields to the errors the
// unit reported before it. Returns the errors.
export const collectSemanticErrors = (
  units: {
    location: SourceLocation;
    check: (reported: SanyError[], warned: SanyError[]) => void;
  }[],
  warnings: SanyError[],
) => {
  const errors: SanyError[] = [];
  const add = (list: SanyError[], item: SanyError) => {
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
      reported.forEach((item) => add(errors, item));
      warned.forEach((item) => add(warnings, item));
    });
  return errors;
};

// SANY binds the names of a module in the order of its units, and reports a RECURSIVE declaration
// that no definition follows at the end. Returns the errors.
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
      // An assumption holds the subexpressions its references select, labels and all, so its own
      // labels go unchecked.
      ...module.assumptions.map((assumption) => ({
        location: assumption.location,
        check: (errors: SanyError[], warnings: SanyError[]) => {
          const inner = createUnit(assumption.location, undefined, errors, warnings, true);
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
