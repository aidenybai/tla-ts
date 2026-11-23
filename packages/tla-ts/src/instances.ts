import {
  getChildren,
  getFunctionConstruction,
  getReferencedName,
  isLocallyResolved,
  type Bound,
  type BoundPattern,
  type Definition,
  type Expression,
  type FunctionDefinition,
  type Instance,
  type Module,
  type OperatorDefinition,
  type OperatorParam,
  type SourceLocation,
  type Theorem,
} from "./ast";
import { TlaSyntaxError } from "./errors";
import {
  copyResolution,
  getArity,
  getBoundNames,
  getKeyName,
  getPatternNames,
  hasNoOperands,
  isBefore,
  isInstantiated,
  LOCAL_RESOLUTION,
} from "./resolve";

export const contextualApplications = new WeakSet<Expression>();

export const substitutionFrames = new WeakMap<Expression, Expression[]>();

export interface Substitution {
  frame: Expression;
  replacement: Expression;
}

export const frameSubstitutions = new WeakMap<Expression, () => Substitution[]>();

export const substitutedExpressions = new WeakMap<Expression, Substitution>();

export const isSubstitutionDefinition = (definition: Definition) =>
  substitutedExpressions.has(definition.body) && !substitutionFrames.has(definition.body);

// TLC's Action#pred for an instance's action is the SubstInNode, which SANY locates at the instance's definition.
export const getActionPredicate = (expression: Expression) =>
  substitutionFrames.get(expression)?.find((frame) => frameSubstitutions.has(frame)) ?? expression;

const addFrames = (expression: Expression, frames: Expression[]) => {
  const copy = { ...expression };
  if (contextualApplications.has(expression)) contextualApplications.add(copy);
  substitutionFrames.set(copy, [...frames, ...(substitutionFrames.get(expression) ?? [])]);
  return copy;
};

export const withSubstitutionFrames = (expression: Expression, frames: Expression[]) => {
  if (frames.length === 0) return expression;
  const copy = addFrames(expression, frames);
  copyResolution(expression, copy);
  return copy;
};

// SANY selects into the instanced body, so a substitute's copy keeps the marks of the parameter it replaces, not its own.
const withReplacedFrames = (replacement: Expression, expression: Expression) =>
  addFrames(replacement, [...(substitutionFrames.get(expression) ?? []), expression]);

export const mentionsName = (
  expression: Expression,
  names: ReadonlySet<string> | ReadonlyMap<string, string>,
): boolean => {
  const name = getReferencedName(expression);
  return (
    (name !== undefined && names.has(name)) ||
    getChildren(expression).some((child) => mentionsName(child, names))
  );
};

export const renameLocals = (
  expression: Expression,
  names: Map<string, string>,
  bound = new Set<string>(),
): Expression => {
  if (!mentionsName(expression, names)) return expression;
  const mapped = mapChildren(expression, (child, childBound) =>
    renameLocals(
      child,
      names,
      childBound.length === 0 ? bound : new Set([...bound, ...childBound]),
    ),
  );
  if (mapped.kind === "Identifier" && isLocallyResolved(mapped) && !bound.has(mapped.name)) {
    return { ...mapped, name: names.get(mapped.name) ?? mapped.name };
  }
  if (mapped.kind === "Apply" && isLocallyResolved(mapped) && !bound.has(mapped.operator)) {
    return { ...mapped, operator: names.get(mapped.operator) ?? mapped.operator };
  }
  if (mapped.kind === "OperatorReference" && !bound.has(mapped.operator)) {
    return { ...mapped, operator: names.get(mapped.operator) ?? mapped.operator };
  }
  return mapped;
};

const mapBounds = (bounds: Bound[], map: (child: Expression) => Expression) =>
  bounds.reduce<Bound[]>((mapped, bound, index) => {
    mapped.push({
      pattern: bound.pattern,
      set:
        index > 0 && bounds[index - 1].set === bound.set ? mapped[index - 1].set : map(bound.set),
    });
    return mapped;
  }, []);

const sourceNames = new WeakMap<Definition, string>();

export const getSourceName = (definition: Definition) =>
  sourceNames.get(definition) ?? definition.name;

const withSource = (definition: Definition, source: Definition) => {
  if (getSourceName(source) !== definition.name) sourceNames.set(definition, getSourceName(source));
  return definition;
};

export const mapDefinition = (
  definition: Definition,
  map: (child: Expression, bound: string[]) => Expression,
): Definition => {
  const mapped =
    definition.kind === "Function"
      ? {
          ...definition,
          bounds: mapBounds(definition.bounds, (child) => map(child, [])),
          body: map(definition.body, getBoundNames(definition.bounds)),
        }
      : {
          ...definition,
          body: map(
            definition.body,
            definition.params.map((param) => param.name),
          ),
        };
  const frames = substitutionFrames.get(definition.body);
  if (frames && mapped.body !== definition.body && !substitutionFrames.has(mapped.body)) {
    substitutionFrames.set(mapped.body, frames);
  }
  return withSource(mapped, definition);
};

export const mapChildren = (
  expression: Expression,
  map: (child: Expression, bound: string[]) => Expression,
): Expression => {
  const mapUnbound = (child: Expression) => map(child, []);
  switch (expression.kind) {
    case "Number":
    case "Decimal":
    case "String":
    case "Identifier":
    case "OperatorReference":
    case "ExceptAt":
      return expression;
    case "Apply":
      return { ...expression, args: expression.args.map(mapUnbound) };
    case "Lambda":
      return { ...expression, body: map(expression.body, expression.params) };
    case "EnabledVariable":
      return { ...expression, substitution: mapUnbound(expression.substitution) };
    case "And":
    case "Or":
      return { ...expression, operands: expression.operands.map(mapUnbound) };
    case "Prime":
    case "Unchanged":
    case "Enabled":
    case "Always":
    case "Eventually":
      return { ...expression, expression: mapUnbound(expression.expression) };
    case "If":
      return {
        ...expression,
        condition: mapUnbound(expression.condition),
        consequent: mapUnbound(expression.consequent),
        alternative: mapUnbound(expression.alternative),
      };
    case "Case":
      return {
        ...expression,
        arms: expression.arms.map((arm) => ({
          condition: mapUnbound(arm.condition),
          body: mapUnbound(arm.body),
        })),
        other: expression.other ? mapUnbound(expression.other) : undefined,
      };
    case "Let": {
      const names = expression.definitions.map((definition) => definition.name);
      return {
        ...expression,
        definitions: expression.definitions.map((definition) =>
          mapDefinition(definition, (child, bound) => map(child, [...names, ...bound])),
        ),
        body: map(expression.body, names),
      };
    }
    case "Forall":
    case "Exists":
    case "FunctionConstruction":
      return {
        ...expression,
        bounds: mapBounds(expression.bounds, mapUnbound),
        body: map(expression.body, getBoundNames(expression.bounds)),
      };
    case "UnboundedQuantifier":
      return { ...expression, body: map(expression.body, expression.names) };
    case "Choose":
      return {
        ...expression,
        set: expression.set ? mapUnbound(expression.set) : undefined,
        body: map(expression.body, getPatternNames(expression.pattern)),
      };
    case "SetEnumeration":
    case "Tuple":
      return { ...expression, elements: expression.elements.map(mapUnbound) };
    case "SetFilter":
      return {
        ...expression,
        bound: { pattern: expression.bound.pattern, set: mapUnbound(expression.bound.set) },
        predicate: map(expression.predicate, getPatternNames(expression.bound.pattern)),
      };
    case "SetMap":
      return {
        ...expression,
        bounds: mapBounds(expression.bounds, mapUnbound),
        expression: map(expression.expression, getBoundNames(expression.bounds)),
      };
    case "FunctionSet":
      return {
        ...expression,
        domain: mapUnbound(expression.domain),
        range: mapUnbound(expression.range),
      };
    case "Record":
    case "RecordSet":
      return {
        ...expression,
        fields: expression.fields.map((field) => ({ ...field, value: mapUnbound(field.value) })),
      };
    case "Except":
      return {
        ...expression,
        function: mapUnbound(expression.function),
        updates: expression.updates.map((update) => ({
          ...update,
          path: update.path.map((step) =>
            step.kind === "Index" ? { ...step, args: step.args.map(mapUnbound) } : step,
          ),
          value: mapUnbound(update.value),
        })),
      };
    case "FunctionApplication":
      return {
        ...expression,
        function: mapUnbound(expression.function),
        args: expression.args.map(mapUnbound),
      };
    case "Bracket":
      return { ...expression, args: expression.args.map(mapUnbound) };
    case "FieldAccess":
      return { ...expression, record: mapUnbound(expression.record) };
    case "Product":
      return { ...expression, factors: expression.factors.map(mapUnbound) };
    case "BoxAction":
    case "AngleAction":
      return {
        ...expression,
        action: mapUnbound(expression.action),
        subscript: mapUnbound(expression.subscript),
      };
    case "WeakFairness":
    case "StrongFairness":
      return {
        ...expression,
        subscript: mapUnbound(expression.subscript),
        action: mapUnbound(expression.action),
      };
    case "Label":
      return { ...expression, body: mapUnbound(expression.body) };
    case "Selection":
      return { ...expression, expression: mapUnbound(expression.expression) };
    case "Subexpression":
      return {
        ...expression,
        selectors: expression.selectors.map((selector) =>
          "args" in selector ? { ...selector, args: selector.args.map(mapUnbound) } : selector,
        ),
      };
  }
};

const NO_NAMES: string[] = [];

const visitAll = (children: Expression[], visit: (child: Expression, bound: string[]) => void) => {
  for (let index = 0; index < children.length; index++) visit(children[index], NO_NAMES);
};

const visitBoundSets = (bounds: Bound[], visit: (child: Expression, bound: string[]) => void) => {
  for (let index = 0; index < bounds.length; index++) visit(bounds[index].set, NO_NAMES);
};

export const forEachChild = (
  expression: Expression,
  visit: (child: Expression, bound: string[]) => void,
): void => {
  switch (expression.kind) {
    case "Number":
    case "Decimal":
    case "String":
    case "Identifier":
    case "OperatorReference":
    case "ExceptAt":
      return;
    case "Apply":
    case "Bracket":
      return visitAll(expression.args, visit);
    case "Lambda":
      return visit(expression.body, expression.params);
    case "EnabledVariable":
      return visit(expression.substitution, NO_NAMES);
    case "And":
    case "Or":
      return visitAll(expression.operands, visit);
    case "Prime":
    case "Unchanged":
    case "Enabled":
    case "Always":
    case "Eventually":
    case "Selection":
      return visit(expression.expression, NO_NAMES);
    case "If":
      visit(expression.condition, NO_NAMES);
      visit(expression.consequent, NO_NAMES);
      return visit(expression.alternative, NO_NAMES);
    case "Case":
      for (let index = 0; index < expression.arms.length; index++) {
        visit(expression.arms[index].condition, NO_NAMES);
        visit(expression.arms[index].body, NO_NAMES);
      }
      if (expression.other) visit(expression.other, NO_NAMES);
      return;
    case "Let": {
      const names = expression.definitions.map((definition) => definition.name);
      expression.definitions.forEach((definition) => {
        if (definition.kind === "Function") {
          visitBoundSets(definition.bounds, (child) => visit(child, names));
          visit(definition.body, [...names, ...getBoundNames(definition.bounds)]);
        } else {
          visit(definition.body, [...names, ...definition.params.map((param) => param.name)]);
        }
      });
      return visit(expression.body, names);
    }
    case "Forall":
    case "Exists":
    case "FunctionConstruction":
      visitBoundSets(expression.bounds, visit);
      return visit(expression.body, getBoundNames(expression.bounds));
    case "UnboundedQuantifier":
      return visit(expression.body, expression.names);
    case "Choose":
      if (expression.set) visit(expression.set, NO_NAMES);
      return visit(expression.body, getPatternNames(expression.pattern));
    case "SetEnumeration":
    case "Tuple":
      return visitAll(expression.elements, visit);
    case "SetFilter":
      visit(expression.bound.set, NO_NAMES);
      return visit(expression.predicate, getPatternNames(expression.bound.pattern));
    case "SetMap":
      visitBoundSets(expression.bounds, visit);
      return visit(expression.expression, getBoundNames(expression.bounds));
    case "FunctionSet":
      visit(expression.domain, NO_NAMES);
      return visit(expression.range, NO_NAMES);
    case "Record":
    case "RecordSet":
      for (let index = 0; index < expression.fields.length; index++) {
        visit(expression.fields[index].value, NO_NAMES);
      }
      return;
    case "Except":
      visit(expression.function, NO_NAMES);
      for (let index = 0; index < expression.updates.length; index++) {
        const update = expression.updates[index];
        for (let step = 0; step < update.path.length; step++) {
          const component = update.path[step];
          if (component.kind === "Index") visitAll(component.args, visit);
        }
        visit(update.value, NO_NAMES);
      }
      return;
    case "FunctionApplication":
      visit(expression.function, NO_NAMES);
      return visitAll(expression.args, visit);
    case "FieldAccess":
      return visit(expression.record, NO_NAMES);
    case "Product":
      return visitAll(expression.factors, visit);
    case "BoxAction":
    case "AngleAction":
      visit(expression.action, NO_NAMES);
      return visit(expression.subscript, NO_NAMES);
    case "WeakFairness":
    case "StrongFairness":
      visit(expression.subscript, NO_NAMES);
      return visit(expression.action, NO_NAMES);
    case "Label":
      return visit(expression.body, NO_NAMES);
    case "Subexpression":
      expression.selectors.forEach((selector) => {
        if ("args" in selector) visitAll(selector.args, visit);
      });
  }
};

export interface BoundSubstitutions {
  lets: WeakMap<Expression, Instantiation>;
  references: WeakMap<Expression, Expression>;
  calls: WeakMap<Expression, Instantiation | Instantiation[]>;
}

interface Instantiation {
  params: OperatorParam[];
  substitutions: Map<string, Expression>;
  substitutedVariables: Set<string>;
  enabledSubstitutions: WeakSet<Expression>;
  boundSubstitutions: BoundSubstitutions;
  instanceArguments: WeakSet<Expression>;
  instanceOperators: WeakSet<Expression>;
  getDefinition: (key: string) => Definition | undefined;
  getOuterDefinition: (key: string) => Definition | undefined;
  isSubstitutedConstant: (key: string) => boolean;
  isParameterized: (key: string) => boolean;
  addDefinition: (
    source: string,
    name: string,
    create: (key: string) => Definition,
    reservedKey?: string,
  ) => string;
  createName: (name: string) => string;
  originalNames: Map<string, string>;
  frame?: Expression;
  isLocal?: boolean;
}

const LAMBDA_NAME = "LAMBDA";

type RewriteMode = "Normal" | "Enabled" | "Primed";

interface Rewrite {
  instantiation: Instantiation;
  substitutedNames: Set<string>;
  copies: Map<string, string>;
  mode: RewriteMode;
  modes: Map<RewriteMode, Rewrite>;
  getReachedSubstitutions: (key: string) => [string, Expression][];
  binding?: CopyBinding;
  selections: Map<Expression, Expression>;
}

interface CopyBinding {
  isReaching: boolean;
}

const SUBSTITUTION_SUFFIX = "@SUBSTITUTION";

const getSubstitutionName = (name: string) => `${name}${SUBSTITUTION_SUFFIX}`;

export const getSubstitutedOccurrence = (
  expression: Expression,
): (Expression & { kind: "Identifier" }) | undefined => {
  const isLocal = expression.kind === "Identifier" && isLocallyResolved(expression);
  const substitution = substitutedExpressions.get(expression);
  const occurrence = (substitution ? substitution.replacement !== expression : isLocal)
    ? substitutionFrames.get(expression)?.find((frame) => !frameSubstitutions.has(frame))
    : undefined;
  return occurrence?.kind === "Identifier" ? occurrence : undefined;
};

export const getSubstitutedName = (expression: Expression) => {
  const occurrence = getSubstitutedOccurrence(expression);
  if (occurrence) return occurrence.name;
  return expression.kind === "Identifier" &&
    isLocallyResolved(expression) &&
    expression.name.endsWith(SUBSTITUTION_SUFFIX)
    ? expression.name.slice(0, -SUBSTITUTION_SUFFIX.length)
    : undefined;
};

const isVariableAlias = (expression: Expression): boolean =>
  expression.kind === "Identifier" ||
  (expression.kind === "Tuple" && expression.elements.every(isVariableAlias));

const isBoundOnce = (replacement: Expression, instantiation: Instantiation) => {
  if (replacement.kind !== "Identifier") {
    return (
      !isVariableAlias(replacement) &&
      replacement.kind !== "OperatorReference" &&
      replacement.kind !== "Lambda" &&
      replacement.kind !== "Number" &&
      replacement.kind !== "String"
    );
  }
  if (isLocallyResolved(replacement)) return false;
  const definition = instantiation.getOuterDefinition(replacement.name);
  // Spec#lookup gives a constant the configuration substitutes its substitute's OpDefNode, which Tool#evalImplSubstInKind binds as a cachable LazyValue.
  return (
    instantiation.isSubstitutedConstant(replacement.name) ||
    (definition?.kind === "Operator" &&
      definition.params.length === 0 &&
      !isVariableAlias(definition.body))
  );
};

const getFreeNames = (expression: Expression, bound = new Set<string>()): string[] => {
  const name = getReferencedName(expression);
  const names = name === undefined || bound.has(name) ? [] : [name];
  forEachChild(expression, (child, childBound) =>
    names.push(
      ...getFreeNames(child, childBound.length === 0 ? bound : new Set([...bound, ...childBound])),
    ),
  );
  return names;
};

const createRenamer = (rewrite: Rewrite) => {
  const renamed = new Map<string, string>();
  return (name: string) => {
    if (!rewrite.substitutedNames.has(name)) return name;
    const fresh = renamed.get(name) ?? rewrite.instantiation.createName(name);
    renamed.set(name, fresh);
    rewrite.instantiation.originalNames.set(fresh, name);
    return fresh;
  };
};

const bindNames = (bound: Map<string, string>, names: string[], rename: (name: string) => string) =>
  new Map([...bound, ...names.map((name): [string, string] => [name, rename(name)])]);

const renamePattern = (pattern: BoundPattern, rename: (name: string) => string): BoundPattern =>
  pattern.kind === "Name"
    ? { kind: "Name", name: rename(pattern.name) }
    : { kind: "Tuple", names: pattern.names.map(rename) };

const renameBounds = (bounds: Bound[], rename: (name: string) => string) =>
  bounds.map((bound) => ({ pattern: renamePattern(bound.pattern, rename), set: bound.set }));

const renameParams = (definition: Definition, rename: (name: string) => string): Definition =>
  definition.kind === "Function"
    ? { ...definition, bounds: renameBounds(definition.bounds, rename) }
    : {
        ...definition,
        params: definition.params.map((param) => ({
          name: rename(param.name),
          arity: param.arity,
        })),
      };

const renameNames = (
  expression: Expression,
  source: Expression,
  bound: Map<string, string>,
  rewrite: Rewrite,
  rename: (name: string) => string,
): Expression => {
  const getBoundName = (name: string) => bound.get(name) ?? name;
  switch (expression.kind) {
    case "Identifier":
      return { ...expression, name: getBoundName(expression.name) };
    case "Apply":
    case "OperatorReference":
      return { ...expression, operator: getBoundName(expression.operator) };
    case "Label":
      return { ...expression, params: expression.params.map(getBoundName) };
    case "Lambda":
      return { ...expression, params: expression.params.map(rename) };
    case "Let": {
      const renamed = {
        ...expression,
        definitions: expression.definitions.map((definition) =>
          withSource(
            { ...renameParams(definition, rename), name: rename(definition.name) },
            definition,
          ),
        ),
      };
      const lets = rewrite.instantiation.boundSubstitutions.lets;
      const owner = rewrite.binding && lets.get(source);
      if (owner) lets.set(renamed, owner);
      return renamed;
    }
    case "Forall":
    case "Exists":
    case "FunctionConstruction":
    case "SetMap":
      return { ...expression, bounds: renameBounds(expression.bounds, rename) };
    case "UnboundedQuantifier":
      return { ...expression, names: expression.names.map(rename) };
    case "Choose":
      return { ...expression, pattern: renamePattern(expression.pattern, rename) };
    case "SetFilter":
      return {
        ...expression,
        bound: {
          pattern: renamePattern(expression.bound.pattern, rename),
          set: expression.bound.set,
        },
      };
    default:
      return expression;
  }
};

export const getEnabledVariableName = (name: string) => `${name}@ENABLED`;

const getMode = (rewrite: Rewrite, mode: RewriteMode) => rewrite.modes.get(mode) ?? rewrite;

const isVariable = (expression: Expression, rewrite: Rewrite, bound: Map<string, string>) =>
  expression.kind === "Identifier" &&
  !bound.has(expression.name) &&
  !isLocallyResolved(expression) &&
  rewrite.instantiation.substitutedVariables.has(expression.name);

const substituteInEnabled = (
  expression: Expression,
  rewrite: Rewrite,
  bound: Map<string, string>,
): Expression | undefined => {
  if (rewrite.mode === "Normal") return undefined;
  if (rewrite.mode === "Primed") {
    return isVariable(expression, rewrite, bound) && expression.kind === "Identifier"
      ? {
          kind: "Identifier",
          name: getEnabledVariableName(expression.name),
          location: expression.location,
        }
      : undefined;
  }
  return expression.kind === "Prime"
    ? {
        ...expression,
        expression: substitute(expression.expression, getMode(rewrite, "Primed"), bound),
      }
    : undefined;
};

export const createLocalIdentifier = (name: string, location: SourceLocation): Expression => ({
  kind: "Identifier",
  name,
  location,
  resolution: LOCAL_RESOLUTION,
});

export const syntheticIdentifiers = new WeakSet<Expression>();

const createSyntheticIdentifier = (name: string, location: SourceLocation) => {
  const identifier = createLocalIdentifier(name, location);
  syntheticIdentifiers.add(identifier);
  return identifier;
};

export const createLocalArguments = (params: OperatorParam[], location: SourceLocation) =>
  params.map((param) => createSyntheticIdentifier(param.name, location));

export const createInstanceArguments = (
  params: OperatorParam[],
  location: SourceLocation,
  instanceArguments: WeakSet<Expression>,
) =>
  createLocalArguments(params, location).map((argument) => {
    instanceArguments.add(argument);
    return argument;
  });

export const createLocalAlias = (
  name: string,
  key: string,
  params: OperatorParam[],
  forwarded: OperatorParam[],
  location: SourceLocation,
): OperatorDefinition => ({
  kind: "Operator",
  name,
  params,
  body:
    forwarded.length === 0
      ? { kind: "Identifier", name: key, location }
      : {
          kind: "Apply",
          operator: key,
          args: createLocalArguments(forwarded, location),
          location,
        },
  isLocal: true,
  isRecursive: false,
  location,
});

export const getInstanceOperator = (
  key: string,
  params: OperatorParam[],
  arity: number,
  location: SourceLocation,
  resolution: typeof LOCAL_RESOLUTION | undefined,
  marks: Pick<Instantiation, "instanceArguments" | "instanceOperators">,
): Expression & { kind: "Lambda" } => {
  const names = Array.from({ length: arity }, (_value, index) => `argument${index}`);
  const operator: Expression & { kind: "Lambda" } = {
    kind: "Lambda",
    params: names,
    body: {
      kind: "Apply",
      operator: key,
      args: [
        ...createInstanceArguments(params, location, marks.instanceArguments),
        ...names.map((name) => createLocalIdentifier(name, location)),
      ],
      location,
      resolution,
    },
    location,
  };
  marks.instanceOperators.add(operator);
  return operator;
};

const getCopy = (rewrite: Rewrite, key: string) =>
  rewrite.instantiation.isParameterized(key) ? copyDefinition(rewrite, key) : undefined;

const markCall = (rewrite: Rewrite, source: Expression, reference: Expression) => {
  if (rewrite.binding) {
    rewrite.binding.isReaching = true;
    const calls = rewrite.instantiation.boundSubstitutions.calls;
    const owners = calls.get(source);
    calls.set(
      reference,
      owners === undefined
        ? rewrite.instantiation
        : [...(Array.isArray(owners) ? owners : [owners]), rewrite.instantiation],
    );
  }
  return reference;
};

const substitute = (
  expression: Expression,
  rewrite: Rewrite,
  bound: Map<string, string>,
): Expression => {
  const substituted = substituteExpression(expression, rewrite, bound);
  if (rewrite.mode === "Enabled") rewrite.instantiation.enabledSubstitutions.add(substituted);
  if (syntheticIdentifiers.has(expression)) syntheticIdentifiers.add(substituted);
  const instanceArguments = rewrite.instantiation.instanceArguments;
  if (instanceArguments.has(expression)) instanceArguments.add(substituted);
  const instanceOperators = rewrite.instantiation.instanceOperators;
  if (instanceOperators.has(expression)) instanceOperators.add(substituted);
  copyResolution(expression, substituted);
  const substitution = substitutedExpressions.get(expression);
  if (!substitution || substituted === expression || substitutedExpressions.has(substituted)) {
    return substituted;
  }
  substitutedExpressions.set(substituted, substitution);
  const frames = substitutionFrames.get(expression);
  if (frames && !substitutionFrames.has(substituted)) substitutionFrames.set(substituted, frames);
  return substituted;
};

const substituteExpression = (
  expression: Expression,
  rewrite: Rewrite,
  bound: Map<string, string>,
): Expression => {
  if (hasNoOperands(expression)) return expression;
  const recurse = (node: Expression) => substitute(node, rewrite, bound);
  if (expression.kind === "Selection" && [...bound].every((entry) => entry[0] === entry[1])) {
    const selected = expression.expression;
    const substituted = rewrite.selections.get(selected) ?? recurse(selected);
    rewrite.selections.set(selected, substituted);
    return { ...expression, expression: substituted };
  }
  const instantiation = rewrite.instantiation;
  const params = instantiation.params;
  const resolution = instantiation.isLocal ? LOCAL_RESOLUTION : undefined;
  const isFree = (name: string) => !bound.has(name) && !isLocallyResolved(expression);
  if (expression.kind === "Enabled" && rewrite.mode === "Normal") {
    return {
      ...expression,
      expression: substitute(expression.expression, getMode(rewrite, "Enabled"), bound),
    };
  }
  if (
    (expression.kind === "WeakFairness" || expression.kind === "StrongFairness") &&
    rewrite.mode === "Normal"
  ) {
    return {
      ...expression,
      subscript: recurse(expression.subscript),
      action: recurse(expression.action),
      enabled: substitute(
        expression.enabled ?? {
          kind: "AngleAction",
          action: expression.action,
          subscript: expression.subscript,
          location: expression.location,
        },
        getMode(rewrite, "Enabled"),
        bound,
      ),
    };
  }
  const enabled = substituteInEnabled(expression, rewrite, bound);
  if (enabled) return enabled;
  if (expression.kind === "Identifier" && isFree(expression.name)) {
    const replacement = instantiation.substitutions.get(expression.name);
    const binding = rewrite.binding;
    if (replacement && (!binding || !isBoundOnce(replacement, instantiation))) {
      const copy = withReplacedFrames(replacement, expression);
      const substitution = substitutedExpressions.get(replacement);
      if (substitution) substitutedExpressions.set(copy, substitution);
      return rewrite.mode === "Enabled" && instantiation.substitutedVariables.has(expression.name)
        ? {
            kind: "EnabledVariable",
            name: getEnabledVariableName(expression.name),
            substitution: copy,
            location: expression.location,
          }
        : copy;
    }
    if (replacement && binding) {
      binding.isReaching = true;
      const reference = withSubstitutionFrames(
        createLocalIdentifier(getSubstitutionName(expression.name), expression.location),
        substitutionFrames.get(expression) ?? [],
      );
      instantiation.boundSubstitutions.references.set(reference, replacement);
      return reference;
    }
    const copy = getCopy(rewrite, expression.name);
    if (copy === undefined) return expression;
    if (params.length === 0) {
      return markCall(rewrite, expression, {
        ...expression,
        name: copy,
        resolution,
        writtenKey: expression.writtenKey ?? expression.name,
      });
    }
    const definition = instantiation.getDefinition(expression.name);
    if (definition && getArity(definition) > 0) {
      const operator = getInstanceOperator(
        copy,
        params,
        getArity(definition),
        expression.location,
        resolution,
        instantiation,
      );
      markCall(rewrite, expression, operator.body);
      return operator;
    }
    return markCall(rewrite, expression, {
      kind: "Apply",
      operator: copy,
      args: createInstanceArguments(params, expression.location, instantiation.instanceArguments),
      location: expression.location,
      resolution,
      writtenKey: expression.writtenKey ?? expression.name,
    });
  }
  if (expression.kind === "Apply" && isFree(expression.operator)) {
    const args = expression.args.map(recurse);
    const replacement = instantiation.substitutions.get(expression.operator);
    const isContextual =
      instantiation.substitutions.size > 0 ||
      params.length > 0 ||
      contextualApplications.has(expression);
    const markContextual = (rewritten: Expression) => {
      if (isContextual) contextualApplications.add(rewritten);
      return rewritten;
    };
    if (replacement?.kind === "Identifier" || replacement?.kind === "OperatorReference") {
      const operator = replacement.kind === "Identifier" ? replacement.name : replacement.operator;
      return markContextual({
        ...expression,
        operator,
        args,
        resolution: replacement.kind === "Identifier" ? replacement.resolution : undefined,
      });
    }
    if (
      replacement?.kind === "Lambda" &&
      instantiation.instanceOperators.has(replacement) &&
      replacement.body.kind === "Apply"
    ) {
      return markContextual({
        ...expression,
        operator: replacement.body.operator,
        args: [...replacement.body.args.slice(0, -replacement.params.length), ...args],
        resolution: replacement.body.resolution,
      });
    }
    if (replacement?.kind === "Lambda") {
      return {
        kind: "Let",
        definitions: [
          {
            kind: "Operator",
            name: LAMBDA_NAME,
            params: replacement.params.map((name) => ({ name, arity: 0 })),
            body: replacement.body,
            isLocal: true,
            isRecursive: false,
            location: replacement.location,
          },
        ],
        body: {
          ...expression,
          operator: LAMBDA_NAME,
          args,
          resolution: LOCAL_RESOLUTION,
        },
        location: { line: expression.location.line, column: expression.location.column },
      };
    }
    if (replacement) {
      throw new TlaSyntaxError(
        `The operator ${getKeyName(expression.operator)} can only be substituted by an operator at line ${expression.location.line}, column ${expression.location.column}`,
      );
    }
    const copy = getCopy(rewrite, expression.operator);
    if (copy === undefined) {
      const calls = instantiation.boundSubstitutions.calls;
      const owners = rewrite.binding && calls.get(expression);
      const kept = markContextual({ ...expression, args });
      if (owners) calls.set(kept, owners);
      return kept;
    }
    return markCall(rewrite, expression, {
      ...expression,
      operator: copy,
      args: [
        ...createInstanceArguments(params, expression.location, instantiation.instanceArguments),
        ...args,
      ],
      resolution,
      writtenKey: expression.writtenKey ?? expression.operator,
    });
  }
  if (expression.kind === "OperatorReference" && isFree(expression.operator)) {
    const replacement = instantiation.substitutions.get(expression.operator);
    if (
      replacement?.kind === "Identifier" ||
      replacement?.kind === "OperatorReference" ||
      replacement?.kind === "Lambda"
    ) {
      return withReplacedFrames(replacement, expression);
    }
    const copy = getCopy(rewrite, expression.operator);
    if (copy === undefined) return expression;
    const definition = instantiation.getDefinition(expression.operator);
    if (params.length > 0 && definition) {
      const operator = getInstanceOperator(
        copy,
        params,
        getArity(definition),
        expression.location,
        resolution,
        instantiation,
      );
      markCall(rewrite, expression, operator.body);
      return operator;
    }
    return markCall(rewrite, expression, { ...expression, operator: copy });
  }
  const rename = createRenamer(rewrite);
  const mapped = mapChildren(expression, (child, names) =>
    names.length === 0
      ? recurse(child)
      : substitute(child, rewrite, bindNames(bound, names, rename)),
  );
  return renameNames(mapped, expression, bound, rewrite, rename);
};

const getFunctionBody = (definition: FunctionDefinition): Expression =>
  definition.isSelfReferential
    ? {
        kind: "Let",
        definitions: [definition],
        body: createSyntheticIdentifier(definition.name, definition.location),
        location: { line: definition.location.line, column: definition.location.column },
      }
    : getFunctionConstruction(definition);

export const getOperatorDefinition = (definition: Definition): OperatorDefinition =>
  definition.kind === "Operator"
    ? definition
    : {
        kind: "Operator",
        name: definition.name,
        params: [],
        body: getFunctionBody(definition),
        isLocal: definition.isLocal,
        isRecursive: false,
        location: definition.location,
      };

export const withInstanceParams = (definition: Definition, params: OperatorParam[]): Definition => {
  if (params.length === 0) return { ...definition };
  const operator = getOperatorDefinition(definition);
  return { ...operator, params: [...params, ...operator.params] };
};

const copyDefinition = (rewrite: Rewrite, key: string): string => {
  const cached = rewrite.copies.get(key);
  if (cached !== undefined) return cached;
  const instantiation = rewrite.instantiation;
  const definition = instantiation.getDefinition(key);
  if (!definition) return key;
  return instantiation.addDefinition(key, definition.name, (copyKey) => {
    rewrite.copies.set(key, copyKey);
    const rename = createRenamer(rewrite);
    const unboundRewrite = getMode(rewrite, rewrite.mode);
    const binding =
      definition.kind === "Operator" && rewrite.mode === "Normal"
        ? { isReaching: false }
        : undefined;
    const bodyRewrite = binding
      ? { ...unboundRewrite, binding, selections: new Map<Expression, Expression>() }
      : unboundRewrite;
    const mapped = renameParams(
      mapDefinition(definition, (child, bound) =>
        substitute(child, bodyRewrite, bindNames(new Map(), bound, rename)),
      ),
      rename,
    );
    const bindings = binding?.isReaching ? rewrite.getReachedSubstitutions(key) : [];
    const body: Expression =
      bindings.length === 0
        ? mapped.body
        : {
            kind: "Let",
            definitions: bindings.map((entry): Definition => ({
              kind: "Operator",
              name: getSubstitutionName(entry[0]),
              params: [],
              body: entry[1],
              isLocal: true,
              isRecursive: false,
              location: entry[1].location,
            })),
            body: mapped.body,
            // TLC has no such LET, so the call stack it prints has no position for it.
            location: { line: mapped.body.location.line, column: mapped.body.location.column },
          };
    const lets = instantiation.boundSubstitutions.lets;
    if (body !== mapped.body) lets.set(body, instantiation);
    const copied = withInstanceParams({ ...mapped, body }, instantiation.params);
    const carried =
      definition.body.kind === "Let" && lets.has(definition.body)
        ? substitutionFrames.get(definition.body.body)
        : undefined;
    const frames = [...(substitutionFrames.get(definition.body) ?? []), ...(carried ?? [])];
    if (frames.length > 0 && copied.kind === "Operator") {
      substitutionFrames.set(body === mapped.body ? copied.body : mapped.body, frames);
    }
    return copied;
  });
};

const getDefinitionFreeNames = (definition: Definition) =>
  definition.kind === "Function"
    ? [
        ...definition.bounds.flatMap((bound) => getFreeNames(bound.set)),
        ...getFreeNames(definition.body, new Set(getBoundNames(definition.bounds))),
      ]
    : getFreeNames(definition.body, new Set(definition.params.map((param) => param.name)));

export const createInstantiation = (instantiation: Instantiation) => {
  const modes = new Map<RewriteMode, Rewrite>();
  const substitutedNames = new Set(
    [...instantiation.substitutions.values()].flatMap((expression) => getFreeNames(expression)),
  );
  let bound: [string, Expression][] | undefined;
  const freeNames = new Map<string, string[]>();
  const getReachedSubstitutions = (key: string) => {
    bound ??= [...instantiation.substitutions].filter((entry) =>
      isBoundOnce(entry[1], instantiation),
    );
    if (bound.length === 0) return bound;
    const reached = new Set<string>();
    const visited = new Set([key]);
    const pending = [key];
    for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
      const definition = instantiation.getDefinition(next);
      const names = freeNames.get(next) ?? (definition ? getDefinitionFreeNames(definition) : []);
      freeNames.set(next, names);
      names.forEach((name) => {
        if (instantiation.substitutions.has(name)) reached.add(name);
        else if (!visited.has(name) && instantiation.isParameterized(name)) {
          visited.add(name);
          pending.push(name);
        }
      });
    }
    return bound.filter((entry) => reached.has(entry[0]));
  };
  const createRewrite = (mode: RewriteMode): Rewrite => {
    const created = {
      instantiation,
      substitutedNames,
      copies: new Map<string, string>(),
      mode,
      modes,
      getReachedSubstitutions,
      selections: new Map<Expression, Expression>(),
    };
    modes.set(mode, created);
    return created;
  };
  const rewrite = createRewrite("Normal");
  createRewrite("Enabled");
  createRewrite("Primed");
  const getEntry = (key: string, copy: string, reservedKey: string | undefined) => {
    const frame = instantiation.frame;
    const definition = instantiation.getDefinition(copy);
    if (!frame || !definition) return copy;
    return instantiation.addDefinition(
      key,
      definition.name,
      () => {
        const operator = getOperatorDefinition(definition);
        const body = withSubstitutionFrames(operator.body, [frame]);
        const lets = instantiation.boundSubstitutions.lets;
        const owner = lets.get(operator.body);
        if (owner) lets.set(body, owner);
        return { ...operator, body };
      },
      reservedKey,
    );
  };
  return {
    getKey: (key: string, reservedKey?: string) => {
      const copy = getCopy(rewrite, key);
      return copy === undefined ? key : getEntry(key, copy, reservedKey);
    },
    getQualifiedKey: (key: string, reservedKey?: string) => {
      const copy = getCopy(rewrite, key);
      if (copy !== undefined) return getEntry(key, copy, reservedKey);
      const definition = instantiation.getDefinition(key);
      if (!definition) return key;
      return instantiation.addDefinition(
        key,
        definition.name,
        () => withInstanceParams(definition, instantiation.params),
        reservedKey,
      );
    },
  };
};

export const hasLetInstance = (expression: Expression): boolean =>
  (expression.kind === "Let" && expression.instances !== undefined) ||
  getChildren(expression).some(hasLetInstance);

const expandLetInstances = (
  expression: Expression,
  instantiate: (instance: Instance, lets: Definition[]) => Definition[],
  lets: Definition[],
  outerInstances: Instance[],
): Expression => {
  const visibleLets = expression.kind === "Let" ? [...lets, ...expression.definitions] : lets;
  const ownInstances = expression.kind === "Let" ? (expression.instances ?? []) : [];
  const mapped = mapChildren(expression, (child) =>
    expandLetInstances(child, instantiate, visibleLets, [
      ...outerInstances,
      ...ownInstances.filter((instance) => isBefore(instance.location, child.location)),
    ]),
  );
  if (mapped.kind !== "Let" || !mapped.instances) {
    const children = getChildren(expression);
    return getChildren(mapped).every((child, index) => child === children[index])
      ? expression
      : mapped;
  }
  const definitions = mapped.instances.reduce((current, instance) => {
    const next = mapped.definitions.find((definition) =>
      isBefore(instance.location, definition.location),
    );
    const index = next === undefined ? current.length : current.indexOf(next);
    const isTaken = outerInstances.some(
      (outer) => outer.name === instance.name && outer.module === instance.module,
    );
    const copies = instantiate(instance, visibleLets).filter(
      (copy) =>
        !isInstantiated(copy) ||
        (!isTaken && current.every((definition) => definition.name !== copy.name)),
    );
    return [...current.slice(0, index), ...copies, ...current.slice(index)];
  }, mapped.definitions);
  return { ...mapped, definitions };
};

const getUnnamedStatement = (theorem: Theorem) =>
  theorem.name === undefined && theorem.statement.kind !== "AssumeProve"
    ? theorem.statement
    : undefined;

export const getLetInstanceExpansion = (
  module: Module,
  instantiate: (instance: Instance, lets: Definition[]) => Definition[],
) => {
  const hasLetInstances =
    module.definitions.some((definition) => hasLetInstance(definition.body)) ||
    module.assumptions.some((assumption) => hasLetInstance(assumption.expression)) ||
    module.theorems.some((theorem) => {
      const statement = getUnnamedStatement(theorem);
      return statement !== undefined && hasLetInstance(statement);
    });
  return hasLetInstances
    ? (expression: Expression) => expandLetInstances(expression, instantiate, [], [])
    : undefined;
};
