import {
  type AssumeProve,
  type Bound,
  type Definition,
  type Expression,
  type Fact,
  type Instance,
  type LetExpression,
  type Module,
  type ModuleUnit,
  type NewSymbol,
  type OperatorParam,
  type Proof,
  type ProofStep,
  type SourceLocation,
  type SourceRange,
  type Theorem,
} from "./ast";
import { formatRange, TlaSyntaxError, type CodedSanyError, type SanyError } from "./errors";
import { forEachChild, frameSubstitutions, substitutionFrames } from "./instances";
import { parenthesizedRanges } from "./parser";
import {
  collectSemanticErrors,
  compareLocations,
  getBoundNames,
  getPatternNames,
  isBefore,
  SELECTION_NAME,
  type SelectedDefinition,
} from "./resolve";
import { resolveSynonym } from "./tlc/jar-data";
import { STANDARD_LEVELS } from "./standard-definitions";

export interface LevelData {
  level: number;
  isCorrect: boolean;
  params: Set<string>;
  constraints: Map<string, number>;
  argConstraints: Map<string, number>;
  argParams: ArgumentParams;
  allParams: ReadonlySet<string>;
  nonLeibnizParams: ReadonlySet<string>;
  appliedParams: ReadonlySet<string> | undefined;
}

export interface OperatorLevels extends LevelData {
  name: string;
  formals: OperatorParam[];
  maxLevels: number[];
  weights: number[];
  minMaxLevels: number[][];
  conditions: Set<string>;
  nonLeibniz: Set<number>;
}

export interface InstanceSubstitutes {
  params: OperatorParam[];
  substitutions: Map<string, Expression>;
}

export interface InstanceCopy extends InstanceSubstitutes {
  source: Definition;
  module: string;
}

export interface ModuleLevels {
  isConstant: boolean;
  constants: Map<string, number>;
  variables: Set<string>;
  constraints: Map<string, number>;
  argConstraints: Map<string, number>;
  argParams: ArgumentParams;
}

interface InstancedDefinition extends ModuleLevels {
  source: OperatorLevels;
}

export interface ArgumentParam {
  operator: string;
  index: number;
  param: string;
}

// The parameters of an operator's arguments that a definition's level depends on, each by its key,
// operator, index, and parameter, with the parts it was made of, which the analysis reads as it is.
export type ArgumentParams = Map<string, ArgumentParam>;

interface SubstitutedSource {
  constraints: [string, number][];
  argConstraints: [string, number][];
  argParams: ArgumentParam[];
}

interface SubstitutedBody extends SubstitutedSource {
  level: number;
  isCorrect: boolean;
  params: string[];
  allParams: ReadonlySet<string>;
  nonLeibnizParams: ReadonlySet<string>;
  appliedParams: ReadonlySet<string> | undefined;
}

interface Instanced {
  definition: Definition;
  copy: InstanceCopy;
  params: string[];
}

interface FoundOriginal {
  expression: Expression;
  scope: Scope;
  instanced: Instanced | undefined;
}

export interface LetInstance extends InstanceSubstitutes {
  copies: Map<string, InstanceCopy>;
  getArgParams: () => ArgumentParams;
  getSubstitutionNames: () => string[];
  substitutesCheck: InstanceLevelCheck["substitutesCheck"];
}

export interface InstanceLevels {
  getCopy: (definition: Definition) => InstanceCopy | undefined;
  getSelectedDefinition: (expression: Expression) => SelectedDefinition | undefined;
  getOriginalName: (name: string) => string | undefined;
  getLetInstance: (instance: Instance) => LetInstance | undefined;
  getInstanced: (copy: InstanceCopy) => InstancedDefinition;
  getOriginal: (copy: InstanceCopy, target: Expression) => LevelData;
  checkInstantiation: (instance: Instance, instancer: string, scope: Scope) => SanyError[];
  getInstanceDefinitions: (instance: Instance) => Definition[];
  getSubstitutes: (instance: Instance) => InstanceSubstitutes | undefined;
  getModuleLevels: (module: string) => ModuleLevels;
}

interface LevelContext {
  module?: string;
  constants: Map<string, number>;
  variables: Set<string>;
  getDefinition: (name: string) => Definition | undefined;
  getQualifiedName?: (name: string) => string | undefined;
  // The levels of a definition of a prepared module that SANY's checks accepted, which they found
  // when they checked it.
  getPreparedLevels?: (name: string) => OperatorLevels | undefined;
  instances: InstanceLevels;
  recursiveSections: WeakMap<Definition, SectionMember[]>;
  // SANY keeps each node's first level check, though a label checked again, here or in a module it sees, is level-correct.
  checkedNodes?: WeakMap<Expression, boolean>;
  goalSelections?: WeakMap<Expression, Expression>;
  statementLevels?: Map<Expression | AssumeProve, LevelData>;
}

export interface InstanceLevelCheck {
  location: SourceLocation;
  check: () => SanyError[];
  substitutes: InstanceSubstitutes;
  substitutesCheck: "Definition" | "Theorem" | "Instance";
}

// A formal parameter's binder is the definition or LAMBDA whose parameter it is, the same object
// wherever the analysis binds it, and a bound name has none.
type ScopeEntry =
  | { kind: "Formal"; arity: number; level: number; binder?: object }
  | { kind: "Let"; definition: Definition; scope: Scope }
  | { kind: "ExceptAt"; parts: LevelData[] };

const EXCEPT_AT = "@";

export type Scope = Map<string, ScopeEntry>;

type Resolved =
  | { kind: "Declared"; name: string; level: number; arity: number }
  | { kind: "Defined"; levels: OperatorLevels }
  | { kind: "Unknown"; name: string };

export interface SectionMember {
  definition: Definition;
  scope: Scope;
  isRechecked: boolean;
}

interface RecursiveSection {
  location: SourceLocation;
  members: SectionMember[];
}

interface BoundFrame {
  names: string[];
  binder: object | undefined;
}

type ScopeFrame = Definition | LetExpression | BoundFrame;

type Operand =
  | { kind: "Value"; data: LevelData }
  | { kind: "Operator"; data: OperatorLevels }
  | { kind: "Declared"; data: LevelData; declared: OperatorParam };

export const CONSTANT_LEVEL = 0;
export const VARIABLE_LEVEL = 1;
export const ACTION_LEVEL = 2;
export const TEMPORAL_LEVEL = 3;

const NEW_SYMBOL_LEVELS = {
  Constant: CONSTANT_LEVEL,
  Variable: VARIABLE_LEVEL,
  State: VARIABLE_LEVEL,
  Action: ACTION_LEVEL,
  Temporal: TEMPORAL_LEVEL,
} satisfies Record<NewSymbol["level"], number>;

const SEPARATOR = "\u0000";

export const createBoundScope = (bindings: [string, Definition | undefined][]) =>
  bindings.reduce<Scope>(
    (outer, binding) =>
      new Map(outer).set(
        binding[0],
        binding[1]
          ? { kind: "Let", definition: binding[1], scope: outer }
          : { kind: "Formal", arity: 0, level: CONSTANT_LEVEL },
      ),
    new Map(),
  );

export const getArgumentKey = (operator: string, index: number) =>
  `${operator}${SEPARATOR}${index}`;

const getArgumentParamKey = (operator: string, index: number, param: string) =>
  `${operator}${SEPARATOR}${index}${SEPARATOR}${param}`;

// The operator and the index of an argument constraint's key.
export const parseArgumentKey = (key: string) => {
  const parts = key.split(SEPARATOR);
  return { operator: parts[0], index: Number(parts[1]) };
};

export const addArgumentParam = (
  params: ArgumentParams,
  operator: string,
  index: number,
  param: string,
) => {
  const key = getArgumentParamKey(operator, index, param);
  if (!params.has(key)) params.set(key, { operator, index, param });
};

const renameArgumentParam = (parameter: ArgumentParam, rename: (name: string) => string) => ({
  operator: rename(parameter.operator),
  index: parameter.index,
  param: rename(parameter.param),
});

const getFormalRenamer = (formals: OperatorParam[], sourceFormals: OperatorParam[]) => {
  const prefix = formals.length - sourceFormals.length;
  const renamed = new Map(
    sourceFormals.map((formal, index) => [formal.name, formals[prefix + index].name]),
  );
  return (name: string) => renamed.get(name) ?? name;
};

const getConditionKey = (operator: number, operand: number, argument: number) =>
  `${operator},${operand},${argument}`;

const EMPTY_PARAMS: ReadonlySet<string> = new Set();

const addParams = (target: Set<string> | undefined, params: ReadonlySet<string>) => {
  if (params.size === 0) return target;
  const result = target ?? new Set<string>();
  params.forEach((param) => result.add(param));
  return result;
};

// Deviation from SANY: tla-ts counts an operator argument's nonLeibnizParams where the receiving operator uses it, which OpArgNode#levelCheck leaves empty, so SANY accepts F(a) == H(LAMBDA b : a') for H(K(_)) == K(1).
const getNonLeibnizParams = (operand: Operand, isUsed: boolean) =>
  operand.kind === "Operator" && !isUsed ? EMPTY_PARAMS : operand.data.nonLeibnizParams;

const hasAppliedParams = (data: LevelData) => data.appliedParams !== undefined;

const addAppliedParams = (applied: Set<string>, data: LevelData, formals: OperatorParam[]) =>
  (data.appliedParams ?? data.params).forEach((param) => {
    if (!formals.some((formal) => formal.name === param)) applied.add(param);
  });

const addOperandAppliedParams = (applied: Set<string>, operand: Operand) =>
  addAppliedParams(applied, operand.data, operand.kind === "Operator" ? operand.data.formals : []);

const createData = (level = 0): LevelData => ({
  level,
  isCorrect: true,
  params: new Set(),
  constraints: new Map(),
  argConstraints: new Map(),
  argParams: new Map(),
  allParams: EMPTY_PARAMS,
  nonLeibnizParams: EMPTY_PARAMS,
  appliedParams: undefined,
});

export const putConstraint = (constraints: Map<string, number>, name: string, level: number) =>
  constraints.set(name, Math.min(level, constraints.get(name) ?? TEMPORAL_LEVEL));

export const putArgConstraint = (constraints: Map<string, number>, key: string, level: number) =>
  constraints.set(key, Math.max(level, constraints.get(key) ?? 0));

const mergeConstraints = (data: LevelData, part: LevelData) => {
  part.constraints.forEach((value, key) => putConstraint(data.constraints, key, value));
  part.argConstraints.forEach((value, key) => putArgConstraint(data.argConstraints, key, value));
  part.argParams.forEach((parameter, key) => data.argParams.set(key, parameter));
};

const createSignature = (
  name: string,
  level: number,
  maxLevels: number[],
  weights: number[],
): OperatorLevels => ({
  ...createData(level),
  name,
  formals: [],
  maxLevels,
  weights,
  minMaxLevels: [],
  conditions: new Set(),
  nonLeibniz: new Set(weights.flatMap((weight, index) => (weight === 0 ? [index] : []))),
});

export const getMaxLevel = (operator: OperatorLevels, index: number) =>
  operator.formals.length === 0 && operator.maxLevels.length > 0
    ? operator.maxLevels[Math.min(index, operator.maxLevels.length - 1)]
    : (operator.maxLevels[index] ?? TEMPORAL_LEVEL);

export const getWeight = (operator: OperatorLevels, index: number) =>
  operator.formals.length === 0 && operator.weights.length > 0
    ? operator.weights[Math.min(index, operator.weights.length - 1)]
    : (operator.weights[index] ?? 1);

const isApplied = (operator: OperatorLevels, index: number) => {
  const formal = operator.formals[index];
  return formal === undefined || operator.appliedParams === undefined
    ? getWeight(operator, index) === 1
    : operator.appliedParams.has(formal.name);
};

const CORE_SIGNATURES = new Map(
  (
    [
      ["=", 0, [2, 2], [1, 1]],
      ["#", 0, [2, 2], [1, 1]],
      ["\\in", 0, [2, 2], [1, 1]],
      ["\\notin", 0, [2, 2], [1, 1]],
      ["\\subseteq", 0, [2, 2], [1, 1]],
      ["\\cup", 0, [2, 2], [1, 1]],
      ["\\cap", 0, [2, 2], [1, 1]],
      ["\\", 0, [2, 2], [1, 1]],
      ["=>", 0, [3, 3], [1, 1]],
      ["<=>", 0, [3, 3], [1, 1]],
      ["/\\", 0, [3, 3], [1, 1]],
      ["\\/", 0, [3, 3], [1, 1]],
      ["~", 0, [3], [1]],
      ["SUBSET", 0, [2], [1]],
      ["UNION", 0, [2], [1]],
      ["DOMAIN", 0, [2], [1]],
      ["~>", 3, [3, 3], [0, 0]],
      ["-+->", 3, [3, 3], [0, 0]],
      ["\\cdot", 2, [2, 2], [0, 0]],
      ["TRUE", 0, [], []],
      ["FALSE", 0, [], []],
      ["BOOLEAN", 0, [], []],
      ["STRING", 0, [], []],
    ] as const
  ).map((signature): [string, OperatorLevels] => [
    signature[0],
    createSignature(signature[0], signature[1], [...signature[2]], [...signature[3]]),
  ]),
);

const PRIME_LEVELS = createSignature("'", 2, [1], [0]);
const UNCHANGED_LEVELS = createSignature("UNCHANGED", 2, [1], [0]);
const ENABLED_LEVELS = createSignature("ENABLED", 1, [2], [0]);
const ALWAYS_LEVELS = createSignature("[]", 3, [3], [0]);
const EVENTUALLY_LEVELS = createSignature("<>", 3, [3], [0]);
export const AND_LEVELS = createSignature("$ConjList", 0, [3], [1]);
export const OR_LEVELS = createSignature("$DisjList", 0, [3], [1]);
export const IF_LEVELS = createSignature("$IfThenElse", 0, [3], [1]);
export const CASE_LEVELS = createSignature("$Case", 0, [3], [1]);
export const FORALL_LEVELS = createSignature("$BoundedForall", 0, [3], [1]);
export const EXISTS_LEVELS = createSignature("$BoundedExists", 0, [3], [1]);
const UNBOUNDED_FORALL_LEVELS = createSignature("$UnboundedForall", 0, [3], [1]);
const UNBOUNDED_EXISTS_LEVELS = createSignature("$UnboundedExists", 0, [3], [1]);
const TEMPORAL_FORALL_LEVELS = createSignature("$TemporalForall", 3, [3], [0]);
const TEMPORAL_EXISTS_LEVELS = createSignature("$TemporalExists", 3, [3], [0]);
export const BOUNDED_CHOOSE_LEVELS = createSignature("$BoundedChoose", 0, [2], [1]);
export const UNBOUNDED_CHOOSE_LEVELS = createSignature("$UnboundedChoose", 0, [2], [1]);
export const SET_ENUMERATE_LEVELS = createSignature("$SetEnumerate", 0, [2], [1]);
export const TUPLE_LEVELS = createSignature("$Tuple", 0, [2], [1]);
const SET_OF_FCNS_LEVELS = createSignature("$SetOfFcns", 0, [2], [1]);
const CARTESIAN_PROD_LEVELS = createSignature("$CartesianProd", 0, [2], [1]);
export const SUBSET_OF_LEVELS = createSignature("$SubsetOf", 0, [2], [1]);
export const SET_OF_ALL_LEVELS = createSignature("$SetOfAll", 0, [2], [1]);
export const FCN_CONSTRUCTOR_LEVELS = createSignature("$FcnConstructor", 0, [3], [1]);
export const RCD_CONSTRUCTOR_LEVELS = createSignature("$RcdConstructor", 0, [3], [1]);
const SET_OF_RCDS_LEVELS = createSignature("$SetOfRcds", 0, [2], [1]);
export const EXCEPT_LEVELS = createSignature("$Except", 0, [2], [1]);
const PAIR_LEVELS = createSignature("$Pair", 0, [3], [1]);
const SEQ_LEVELS = createSignature("$Seq", 0, [2], [1]);
export const APPLY_LEVELS = createSignature("$FcnApply", 0, [2, 2], [1, 1]);
export const SELECT_LEVELS = createSignature("$RcdSelect", 0, [2, 0], [1, 1]);
const SQUARE_ACT_LEVELS = createSignature("$SquareAct", 2, [2, 1], [0, 0]);
const ANGLE_ACT_LEVELS = createSignature("$AngleAct", 2, [2, 1], [0, 0]);
const WF_LEVELS = createSignature("$WF", 3, [1, 2], [0, 0]);
const SF_LEVELS = createSignature("$SF", 3, [1, 2], [0, 0]);

// The levels of a builtin operator or a standard module's operator, by name.
export const getSignatureLevels = (name: string) =>
  CORE_SIGNATURES.get(name) ?? STANDARD_LEVELS.get(name);

const bindFormals = (scope: Scope, formals: OperatorParam[], binder?: object) =>
  formals.length === 0
    ? scope
    : new Map([
        ...scope,
        ...formals.map((formal): [string, ScopeEntry] => [
          formal.name,
          { kind: "Formal", arity: formal.arity, level: CONSTANT_LEVEL, binder },
        ]),
      ]);

const toFormals = (names: string[]) => names.map((name) => ({ name, arity: 0 }));

const getFormals = (definition: Definition) =>
  definition.kind === "Operator" ? definition.params : [];

const getSubstituted = (expression: Expression): Expression | undefined =>
  substitutionFrames.has(expression)
    ? expression
    : expression.kind === "Let"
      ? getSubstituted(expression.body)
      : undefined;

const getMissingOriginalError = (expression: Expression) =>
  new TlaSyntaxError(
    `Cannot find the instanced original of a selection at line ${expression.location.line}, column ${expression.location.column}`,
  );

const getDefinitionBody = (definition: Definition): Expression =>
  definition.kind === "Function"
    ? {
        kind: "FunctionConstruction",
        bounds: definition.bounds,
        body: definition.body,
        location: definition.location,
      }
    : definition.body;

const toOperatorLevels = (name: string, formals: OperatorParam[], data: LevelData) => {
  const isFormal = (param: string) => formals.some((formal) => formal.name === param);
  const removeFormals = (params: ReadonlySet<string>) =>
    formals.some((formal) => params.has(formal.name))
      ? new Set([...params].filter((param) => !isFormal(param)))
      : params;
  const levels: OperatorLevels = {
    ...createData(data.level),
    isCorrect: data.isCorrect,
    name,
    formals,
    nonLeibniz: new Set(
      formals.flatMap((formal, index) => (data.nonLeibnizParams.has(formal.name) ? [index] : [])),
    ),
    allParams: removeFormals(data.allParams),
    nonLeibnizParams: removeFormals(data.nonLeibnizParams),
    appliedParams: data.appliedParams,
    maxLevels: formals.map((formal) =>
      Math.min(TEMPORAL_LEVEL, data.constraints.get(formal.name) ?? TEMPORAL_LEVEL),
    ),
    weights: formals.map((formal) => (data.params.has(formal.name) ? 1 : 0)),
    minMaxLevels: formals.map((formal) =>
      Array.from(
        { length: formal.arity },
        (_value, index) => data.argConstraints.get(getArgumentKey(formal.name, index)) ?? 0,
      ),
    ),
    conditions: new Set(
      formals.flatMap((operator, operatorIndex) =>
        formals.flatMap((param, paramIndex) =>
          Array.from({ length: operator.arity }, (_value, argumentIndex) => argumentIndex)
            .filter((argumentIndex) =>
              data.argParams.has(getArgumentParamKey(operator.name, argumentIndex, param.name)),
            )
            .map((argumentIndex) => getConditionKey(operatorIndex, paramIndex, argumentIndex)),
        ),
      ),
    ),
  };
  data.params.forEach((param) => {
    if (!isFormal(param)) levels.params.add(param);
  });
  data.constraints.forEach((value, key) => {
    if (!isFormal(key)) levels.constraints.set(key, value);
  });
  data.argConstraints.forEach((value, key) => {
    if (!isFormal(parseArgumentKey(key).operator)) levels.argConstraints.set(key, value);
  });
  data.argParams.forEach((parameter, key) => {
    if (!isFormal(parameter.operator) || !isFormal(parameter.param)) {
      levels.argParams.set(key, parameter);
    }
  });
  return levels;
};

const addInstanceDefinitions = (instances: InstanceLevels, instance: Instance, scope: Scope) => {
  const definitions = instances.getInstanceDefinitions(instance);
  definitions.forEach((definition) =>
    scope.set(definition.name, { kind: "Let", definition, scope }),
  );
  return definitions;
};

const createLetScope = (expression: LetExpression, scope: Scope) => {
  const inner: Scope = new Map(scope);
  expression.definitions.forEach((definition) =>
    inner.set(definition.name, { kind: "Let", definition, scope: inner }),
  );
  return inner;
};

const createPlaceholder = (definition: Definition, maxLevel: number, weight: number) => {
  const formals = getFormals(definition);
  return {
    ...createData(),
    name: definition.name,
    formals,
    maxLevels: formals.map(() => maxLevel),
    weights: formals.map(() => weight),
    minMaxLevels: formals.map(() => []),
    conditions: new Set<string>(),
    nonLeibniz: new Set<number>(),
  };
};

const getRecursiveSections = (
  base: Scope,
  root: ModuleUnit[] | LetExpression,
  hasRecursiveLet = true,
) => {
  const sections: RecursiveSection[] = [];
  const pending: Set<string>[] = [];
  const frames: ScopeFrame[] = [];
  const scopes: (Scope | undefined)[] = [];
  let pendingCount = 0;
  let depth = 0;

  const getScope = () => {
    let start = frames.length;
    while (start > 0 && scopes[start - 1] === undefined) start--;
    let scope = scopes[start - 1] ?? base;
    for (let index = start; index < frames.length; index++) {
      const frame = frames[index];
      scope =
        "names" in frame
          ? bindFormals(scope, toFormals(frame.names), frame.binder)
          : frame.kind === "Let"
            ? createLetScope(frame, scope)
            : frame.kind === "Function"
              ? bindFormals(scope, toFormals(getBoundNames(frame.bounds)))
              : bindFormals(scope, frame.params, frame);
      scopes[index] = scope;
    }
    return scope;
  };

  const walkInFrame = (frame: ScopeFrame, expression: Expression) => {
    frames.push(frame);
    scopes.push(undefined);
    walkExpression(expression);
    frames.pop();
    scopes.pop();
  };

  const walkExpression = (expression: Expression): void => {
    if (expression.kind !== "Let") {
      return forEachChild(expression, (child, bound) =>
        bound.length === 0
          ? walkExpression(child)
          : walkInFrame(
              { names: bound, binder: expression.kind === "Lambda" ? expression : undefined },
              child,
            ),
      );
    }
    frames.push(expression);
    scopes.push(undefined);
    depth++;
    if (expression.recursive) walkUnits(getLetUnits(expression));
    else {
      for (let index = 0; index < expression.definitions.length; index++) {
        walkDefinition(expression.definitions[index]);
      }
    }
    depth--;
    walkExpression(expression.body);
    frames.pop();
    scopes.pop();
  };

  const walkDefinition = (definition: Definition) => {
    if (definition.kind === "Function") {
      for (let index = 0; index < definition.bounds.length; index++) {
        walkExpression(definition.bounds[index].set);
      }
    }
    walkInFrame(definition, definition.body);
    if (pendingCount === 0) return;
    const names = (pending[depth] ??= new Set());
    if (definition.isRecursive && names.delete(definition.name)) {
      pendingCount--;
      return;
    }
    sections.at(-1)?.members.push({ definition, scope: getScope(), isRechecked: names.size > 0 });
  };

  const declareRecursive = (definitions: Definition[], location: SourceLocation) => {
    if (pendingCount === 0) sections.push({ location, members: [] });
    const names = (pending[depth] ??= new Set());
    definitions.forEach((definition) => {
      if (names.has(definition.name)) return;
      names.add(definition.name);
      pendingCount++;
    });
    definitions.forEach((definition) =>
      sections.at(-1)?.members.push({ definition, scope: getScope(), isRechecked: true }),
    );
  };

  const walkUnits = (units: ModuleUnit[]) => {
    const recursiveDefinitions = new Map<string, Definition[]>();
    units.forEach((unit) => {
      if (unit.kind !== "Definition" || !unit.definition.isRecursive) return;
      const named = recursiveDefinitions.get(unit.definition.name);
      if (named) named.push(unit.definition);
      else recursiveDefinitions.set(unit.definition.name, [unit.definition]);
    });
    units.forEach((unit) => {
      if (unit.kind === "Recursive") {
        declareRecursive(
          unit.declarations.flatMap(
            (declaration) => recursiveDefinitions.get(declaration.name) ?? [],
          ),
          unit.location,
        );
        return;
      }
      if (pendingCount === 0 && !hasRecursiveLet) return;
      if (unit.kind === "Assumption") walkExpression(unit.assumption.expression);
      else if (unit.kind === "Theorem" && unit.theorem.statement.kind !== "AssumeProve") {
        walkExpression(unit.theorem.statement);
      } else if (unit.kind === "Definition") walkDefinition(unit.definition);
    });
  };

  if (Array.isArray(root)) walkUnits(root);
  else walkExpression(root);
  return sections;
};

const getLetUnits = (expression: LetExpression) =>
  [
    ...(expression.recursive ?? []).map((declaration) => ({
      location: declaration.location,
      unit: {
        kind: "Recursive",
        declarations: [declaration],
        location: declaration.location,
      } satisfies ModuleUnit,
    })),
    ...expression.definitions.map((definition) => ({
      location: definition.location,
      unit: { kind: "Definition", definition } satisfies ModuleUnit,
    })),
  ]
    .toSorted((left, right) => (isBefore(left.location, right.location) ? -1 : 1))
    .map((entry) => entry.unit);

interface LevelMessage {
  message: string;
  code?: string;
}

const LOGICAL_OPERATORS = new Set(["/\\", "\\/", "=>", "<=>"]);

const isMixed = (levels: number[]) =>
  levels.includes(ACTION_LEVEL) && levels.includes(TEMPORAL_LEVEL);

const getWrittenRange = (expression: Expression) =>
  parenthesizedRanges.get(expression) ?? expression.location.range;

const isOperatorApplication = (expression: Expression) =>
  expression.kind !== "Let" && expression.kind !== "Label";

const getApplicationError = (operator: OperatorLevels, detail: string) =>
  `Level error in applying operator ${resolveSynonym(operator.name)}:\n${detail}`;

const getExceedingError = (operator: OperatorLevels, index: number) =>
  getApplicationError(
    operator,
    `The level of argument ${index + 1} exceeds the maximum level allowed by the operator`,
  );

export const createLevelAnalyzer = (context: LevelContext) => {
  const definitionLevels = new Map<Definition, OperatorLevels>();
  // SANY level-checks a LAMBDA once, so a recursive section's second pass keeps its first levels.
  const lambdaLevels = new Map<Expression, OperatorLevels>();
  const selectionLevels = new Map<Expression, LevelData>();
  const checkedNodes = context.checkedNodes ?? new WeakMap<Expression, boolean>();
  const statementLevels = context.statementLevels ?? new Map<Expression | AssumeProve, LevelData>();
  let labelChecks = 0;
  const errors: CodedSanyError[] = [];
  const messages: LevelMessage[] = [];
  // A recursive section's parameters as SANY's nodes keep them: a formal or bound parameter that
  // one member names reaches another member, and a definition that applies one, under a name of
  // its own, the parameter's name where a scope binds it alike, as its binder's region does.
  const foreignParams = new Map<string, { name: string; binder: object }>();
  const binderNumbers = new Map<object, number>();

  const getForeignName = (name: string, entry: ScopeEntry & { kind: "Formal" }) => {
    const binder = entry.binder ?? entry;
    const number = binderNumbers.get(binder) ?? binderNumbers.size;
    binderNumbers.set(binder, number);
    const foreign = `${name}#${number}`;
    foreignParams.set(foreign, { name, binder });
    return foreign;
  };

  const localizeParams = <Params extends ReadonlySet<string>>(params: Params, scope: Scope) => {
    let local: Set<string> | undefined;
    params.forEach((param) => {
      const foreign = foreignParams.get(param);
      if (foreign === undefined) return;
      const entry = scope.get(foreign.name);
      if (entry?.kind !== "Formal" || entry.binder !== foreign.binder) return;
      local ??= new Set(params);
      local.delete(param);
      local.add(foreign.name);
    });
    return local ?? params;
  };

  const localize = (levels: OperatorLevels, scope: Scope): OperatorLevels => {
    if (foreignParams.size === 0) return levels;
    const params = localizeParams(levels.params, scope);
    const allParams = localizeParams(levels.allParams, scope);
    const nonLeibnizParams = localizeParams(levels.nonLeibnizParams, scope);
    const appliedParams = levels.appliedParams && localizeParams(levels.appliedParams, scope);
    return params === levels.params &&
      allParams === levels.allParams &&
      nonLeibnizParams === levels.nonLeibnizParams &&
      appliedParams === levels.appliedParams
      ? levels
      : { ...levels, params, allParams, nonLeibnizParams, appliedParams };
  };

  const resolve = (name: string, scope: Scope): Resolved => {
    const entry = scope.get(name);
    if (entry?.kind === "Formal") {
      return { kind: "Declared", name, level: entry.level, arity: entry.arity };
    }
    if (entry?.kind === "Let") {
      return {
        kind: "Defined",
        levels: localize(analyzeDefinition(entry.definition, entry.scope), scope),
      };
    }
    const arity = context.constants.get(name);
    if (arity !== undefined) return { kind: "Declared", name, level: 0, arity };
    if (context.variables.has(name)) return { kind: "Declared", name, level: 1, arity: 0 };
    const definition = context.getDefinition(name);
    if (definition) {
      const levels = localize(
        context.getPreparedLevels?.(name) ?? analyzeDefinition(definition, new Map()),
        scope,
      );
      const qualifiedName = context.getQualifiedName?.(name);
      return {
        kind: "Defined",
        levels: qualifiedName ? { ...levels, name: qualifiedName } : levels,
      };
    }
    const signature = getSignatureLevels(name);
    if (signature) return { kind: "Defined", levels: signature };
    return { kind: "Unknown", name };
  };

  const applyDeclared = (name: string, level: number, operands: Operand[]) => {
    let maximum = level;
    for (const operand of operands) maximum = Math.max(maximum, operand.data.level);
    const data = createData(maximum);
    data.isCorrect = operands.every((operand) => operand.data.isCorrect);
    data.params.add(name);
    const allParams = new Set([name]);
    let nonLeibnizParams: Set<string> | undefined;
    operands.forEach((operand, index) => {
      operand.data.params.forEach((param) => {
        data.params.add(param);
        addArgumentParam(data.argParams, name, index, param);
      });
      putArgConstraint(data.argConstraints, getArgumentKey(name, index), operand.data.level);
      mergeConstraints(data, operand.data);
      operand.data.allParams.forEach((param) => allParams.add(param));
      nonLeibnizParams = addParams(nonLeibnizParams, operand.data.nonLeibnizParams);
    });
    data.allParams = allParams;
    data.nonLeibnizParams = nonLeibnizParams ?? EMPTY_PARAMS;
    if (operands.some((operand) => hasAppliedParams(operand.data))) {
      const applied = new Set([name]);
      operands.forEach((operand) => addOperandAppliedParams(applied, operand));
      data.appliedParams = applied;
    }
    return data;
  };

  const applyDefined = (
    operator: OperatorLevels,
    operands: Operand[],
    ranges: LevelData[] = [],
    bound: string[] = [],
  ) => {
    const isBound = (name: string) => bound.includes(name);
    const getOperand = (formal: string) => {
      const index = operator.formals.findIndex((param) => param.name === formal);
      return index === -1 ? undefined : operands[index];
    };
    const hasCondition = (operandIndex: number, otherIndex: number, argumentIndex: number) =>
      operator.conditions.has(getConditionKey(operandIndex, otherIndex, argumentIndex));
    let isLevelCorrect = true;
    for (let index = 0; index < operands.length; index++) {
      const operand = operands[index];
      if (operand.data.level > getMaxLevel(operator, index)) {
        if (operator.isCorrect && operand.data.isCorrect) {
          messages.push({ message: getExceedingError(operator, index) });
        }
        isLevelCorrect = false;
      }
      if (operand.kind !== "Operator") continue;
      const argument = operand.data;
      const arity = operator.formals[index]?.arity ?? 0;
      for (let position = 0; position < arity; position++) {
        const minimum = operator.minMaxLevels[index]?.[position] ?? 0;
        if (getMaxLevel(argument, position) >= minimum) continue;
        if (operator.isCorrect && argument.isCorrect) {
          messages.push({
            message: getApplicationError(
              operator,
              `The permitted level of argument ${position + 1} of the operator argument ${index + 1} \nmust be at least ${minimum}`,
            ),
          });
        }
        isLevelCorrect = false;
      }
      for (let otherIndex = 0; otherIndex < operands.length; otherIndex++) {
        const other = operands[otherIndex];
        for (let position = 0; position < arity; position++) {
          if (
            !hasCondition(index, otherIndex, position) ||
            other.data.level <= getMaxLevel(argument, position)
          ) {
            continue;
          }
          if (argument.isCorrect && other.data.isCorrect) {
            messages.push({
              message: getExceedingError(operator, otherIndex),
              code: "HIGHER_ORDER_OPERATOR_COPARAMETER_LEVEL_CONSTRAINTS_EXCEEDED",
            });
          }
          isLevelCorrect = false;
        }
      }
    }
    // A tuple of a long sequence's units has more operands than a call's arguments can spread.
    const data = createData(
      operands.reduce(
        (level, operand, index) =>
          getWeight(operator, index) === 1 ? Math.max(level, operand.data.level) : level,
        ranges.reduce((level, range) => Math.max(level, range.level), operator.level),
      ),
    );
    data.isCorrect =
      isLevelCorrect &&
      operands.every((operand) => operand.data.isCorrect) &&
      ranges.every((range) => range.isCorrect);
    operator.params.forEach((param) => data.params.add(param));
    operands.forEach((operand, index) => {
      if (getWeight(operator, index) === 1) {
        operand.data.params.forEach((param) => data.params.add(param));
      }
    });
    ranges.forEach((range) => range.params.forEach((param) => data.params.add(param)));
    bound.forEach((name) => data.params.delete(name));
    const appliedOperands = operands.filter((_operand, index) => isApplied(operator, index));
    if (
      hasAppliedParams(operator) ||
      ranges.some(hasAppliedParams) ||
      appliedOperands.some((operand) => hasAppliedParams(operand.data))
    ) {
      const applied = new Set<string>();
      addAppliedParams(applied, operator, operator.formals);
      ranges.forEach((range) => addAppliedParams(applied, range, []));
      appliedOperands.forEach((operand) => addOperandAppliedParams(applied, operand));
      bound.forEach((name) => applied.delete(name));
      data.appliedParams = applied;
    }

    let allParams = addParams(undefined, operator.allParams);
    let nonLeibnizParams = addParams(undefined, operator.nonLeibnizParams);
    operands.forEach((operand, index) => {
      allParams = addParams(allParams, operand.data.allParams);
      nonLeibnizParams = addParams(
        nonLeibnizParams,
        getNonLeibnizParams(operand, isApplied(operator, index)),
      );
      if (operator.nonLeibniz.has(index)) {
        nonLeibnizParams = addParams(nonLeibnizParams, operand.data.allParams);
      }
    });
    ranges.forEach((range) => {
      allParams = addParams(allParams, range.allParams);
      nonLeibnizParams = addParams(nonLeibnizParams, range.nonLeibnizParams);
    });
    bound.forEach((name) => {
      allParams?.delete(name);
      nonLeibnizParams?.delete(name);
    });
    operands.forEach((operand, operandIndex) => {
      if (operand.kind !== "Operator") return;
      operand.data.nonLeibniz.forEach((argumentIndex) =>
        operands.forEach((other, otherIndex) => {
          if (hasCondition(operandIndex, otherIndex, argumentIndex)) {
            nonLeibnizParams = addParams(nonLeibnizParams, other.data.allParams);
          }
        }),
      );
    });
    data.allParams = allParams ?? EMPTY_PARAMS;
    data.nonLeibnizParams = nonLeibnizParams ?? EMPTY_PARAMS;

    operator.constraints.forEach((value, key) => putConstraint(data.constraints, key, value));
    operands.forEach((operand) =>
      operand.data.constraints.forEach((value, key) => {
        if (!isBound(key)) putConstraint(data.constraints, key, value);
      }),
    );
    ranges.forEach((range) =>
      range.constraints.forEach((value, key) => putConstraint(data.constraints, key, value)),
    );
    operands.forEach((operand, index) =>
      operand.data.params.forEach((param) => {
        if (!isBound(param)) putConstraint(data.constraints, param, getMaxLevel(operator, index));
      }),
    );
    operands.forEach((operand, operandIndex) => {
      if (operand.kind !== "Operator") return;
      const argument = operand.data;
      operands.forEach((other, otherIndex) =>
        argument.formals.forEach((_formal, argumentIndex) => {
          if (!hasCondition(operandIndex, otherIndex, argumentIndex)) return;
          other.data.params.forEach((param) =>
            putConstraint(data.constraints, param, getMaxLevel(argument, argumentIndex)),
          );
        }),
      );
    });
    operator.argParams.forEach((parameter) => {
      const argument = getOperand(parameter.operator);
      if (argument?.kind === "Operator") {
        putConstraint(
          data.constraints,
          parameter.param,
          getMaxLevel(argument.data, parameter.index),
        );
      }
    });

    const argConstraints = [
      operator.argConstraints,
      ...operands.map((operand) => operand.data.argConstraints),
      ...ranges.map((range) => range.argConstraints),
    ];
    argConstraints.forEach((constraints) =>
      constraints.forEach((value, key) => putArgConstraint(data.argConstraints, key, value)),
    );
    operands.forEach((operand, operandIndex) => {
      if (operand.kind !== "Declared") return;
      const declared = operand.declared;
      Array.from({ length: declared.arity }, (_value, argumentIndex) =>
        putArgConstraint(
          data.argConstraints,
          getArgumentKey(declared.name, argumentIndex),
          operator.minMaxLevels[operandIndex]?.[argumentIndex] ?? 0,
        ),
      );
      operands.forEach((other, otherIndex) =>
        Array.from({ length: declared.arity }, (_value, argumentIndex) => {
          if (hasCondition(operandIndex, otherIndex, argumentIndex)) {
            putArgConstraint(
              data.argConstraints,
              getArgumentKey(declared.name, argumentIndex),
              other.data.level,
            );
          }
        }),
      );
    });
    operator.argParams.forEach((parameter) => {
      // Deviation from SANY: OpApplNode#levelCheck looks up alp.op here, which drops the level an argument puts on the operator parameter it is passed to, so x'' passes and TLC crashes.
      const argument = getOperand(parameter.param);
      if (argument) {
        putArgConstraint(
          data.argConstraints,
          getArgumentKey(parameter.operator, parameter.index),
          argument.data.level,
        );
      }
    });

    operands.forEach((operand) =>
      operand.data.argParams.forEach((parameter, key) => {
        if (!isBound(parameter.param)) data.argParams.set(key, parameter);
      }),
    );
    ranges.forEach((range) =>
      range.argParams.forEach((parameter, key) => data.argParams.set(key, parameter)),
    );
    operator.argParams.forEach((parameter, key) => {
      const argument = getOperand(parameter.operator);
      if (!argument) {
        const value = getOperand(parameter.param);
        if (!value) {
          data.argParams.set(key, parameter);
          return;
        }
        value.data.params.forEach((param) =>
          addArgumentParam(data.argParams, parameter.operator, parameter.index, param),
        );
        return;
      }
      if (argument.kind === "Declared") {
        addArgumentParam(data.argParams, argument.declared.name, parameter.index, parameter.param);
      }
    });
    operands.forEach((operand, operandIndex) => {
      if (operand.kind !== "Declared") return;
      const declared = operand.declared;
      operands.forEach((other, otherIndex) =>
        Array.from({ length: declared.arity }, (_value, argumentIndex) => {
          if (!hasCondition(operandIndex, otherIndex, argumentIndex)) return;
          other.data.params.forEach((param) =>
            addArgumentParam(data.argParams, declared.name, argumentIndex, param),
          );
        }),
      );
    });
    return data;
  };

  const toOperand = (expression: Expression, scope: Scope): Operand => {
    if (expression.kind === "Lambda") {
      const operator =
        lambdaLevels.get(expression) ??
        analyzeOperator(
          expression.operator ?? "LAMBDA",
          toFormals(expression.params),
          expression.body,
          scope,
          expression,
        );
      lambdaLevels.set(expression, operator);
      return { kind: "Operator", data: operator };
    }
    const name =
      expression.kind === "OperatorReference"
        ? expression.operator
        : expression.kind === "Identifier"
          ? expression.name
          : undefined;
    if (name !== undefined) {
      const resolved = resolve(name, scope);
      if (
        resolved.kind === "Defined" &&
        (resolved.levels.formals.length > 0 || expression.kind === "OperatorReference")
      ) {
        return { kind: "Operator", data: resolved.levels };
      }
      if (resolved.kind === "Declared" && resolved.arity > 0) {
        const data = createData();
        data.params.add(name);
        data.allParams = new Set([name]);
        return { kind: "Declared", data, declared: { name, arity: resolved.arity } };
      }
      if (expression.kind === "OperatorReference") return { kind: "Value", data: createData() };
    }
    return { kind: "Value", data: analyze(expression, scope) };
  };

  const toOperands = (expressions: Expression[], scope: Scope) =>
    expressions.map((expression) => toOperand(expression, scope));

  // SANY level-checks a goal's clause with the goal, so selecting it in the proof reports nothing new.
  const analyzeGoalSelection = (selection: Expression, operands: Operand[], scope: Scope) => {
    const reported = errors.length;
    const pending = messages.length;
    const operand = toOperand(selection, scope);
    errors.splice(reported);
    messages.splice(pending);
    return operand.kind === "Operator" ? applyDefined(operand.data, operands) : operand.data;
  };

  const applyBuiltin = (
    operator: OperatorLevels,
    expressions: Expression[],
    scope: Scope,
    bounds: Bound[] = [],
    bound = getBoundNames(bounds),
  ) => {
    const operands = toOperands(expressions, bindFormals(scope, toFormals(bound)));
    const groups = bounds.filter((range, index) => range.set !== bounds[index - 1]?.set);
    const ranges = groups.map((range) => analyze(range.set, scope));
    const data = applyDefined(operator, operands, ranges, bound);
    ranges.forEach((range, index) => {
      if (range.level <= ACTION_LEVEL) return;
      data.isCorrect = false;
      if (!range.isCorrect) return;
      const pattern = groups[index].pattern;
      const symbol = pattern.ranges?.[0];
      messages.push({
        message: `Level error in applying operator ${operator.name}:\nThe level of the range for the bounded variable ${symbol ? formatRange(symbol) : getPatternNames(pattern)[0]} \nexceeds the maximum level allowed by the operator`,
      });
    });
    return data;
  };

  const applyResolved = (
    resolved: Resolved,
    operands: Operand[],
    reference: Expression,
    scope: Scope,
  ) => {
    if (resolved.kind === "Defined") return applyDefined(resolved.levels, operands);
    if (resolved.kind === "Declared") return applyDeclared(resolved.name, resolved.level, operands);
    const selection = context.goalSelections?.get(reference);
    return selection
      ? analyzeGoalSelection(selection, operands, scope)
      : applyDeclared(resolved.name, 0, operands);
  };

  const checkJunction = (levels: number[], name: string) => {
    if (isMixed(levels)) {
      messages.push({ message: `${name} has both temporal formula and action as arguments` });
    }
  };

  const checkApply = (expression: Expression & { kind: "Apply" }, operands: Operand[]) => {
    const isLeadsTo = expression.operator === "~>" || expression.operator === "-+->";
    if (isLeadsTo && operands.some((operand) => operand.data.level === ACTION_LEVEL)) {
      messages.push({
        message: "Action used where only temporal formula or state predicate allowed",
      });
    }
    if (LOGICAL_OPERATORS.has(expression.operator)) {
      checkJunction(
        operands.map((operand) => operand.data.level),
        resolveSynonym(expression.operator),
      );
    }
  };

  const checkTemporal = (
    expression: Expression & { kind: "Always" | "Eventually" },
    level: number,
  ) => {
    const operand = expression.expression;
    const form = expression.kind === "Always" ? "BoxAction" : "AngleAction";
    if (level !== ACTION_LEVEL || !isOperatorApplication(operand) || operand.kind === form) return;
    messages.push({
      message:
        expression.kind === "Always"
          ? "[] followed by action not of form [A]_v"
          : "<> followed by action not of form <<A>>_v",
    });
  };

  const letCopies = new WeakMap<Definition, InstanceCopy>();

  const getInstanceArgParams = (instance: LetInstance, scope: Scope) => {
    const operands = getSubstitutes(instance, scope);
    const getParams = (param: string) => operands.get(param)?.data.params ?? [param];
    return [
      ...[...instance.getArgParams()].flatMap((entry): [string, ArgumentParam][] => {
        const parameter = entry[1];
        const operator = operands.get(parameter.operator);
        if (!operator) return [entry];
        return operator.kind === "Declared"
          ? [...getParams(parameter.param)].map((param): [string, ArgumentParam] => [
              getArgumentParamKey(operator.declared.name, parameter.index, param),
              { operator: operator.declared.name, index: parameter.index, param },
            ])
          : [];
      }),
      ...[...operands.values()].flatMap((operand) => [...operand.data.argParams]),
    ].filter((entry) =>
      instance.params.every(
        (param) => param.name !== entry[1].operator && param.name !== entry[1].param,
      ),
    );
  };

  const enterLet = (expression: LetExpression, scope: Scope) => {
    const instances = expression.instances?.flatMap(
      (instance) => context.instances.getLetInstance(instance) ?? [],
    );
    instances?.forEach((instance) =>
      expression.definitions.forEach((definition) => {
        const copy = instance.copies.get(definition.name);
        if (copy) letCopies.set(definition, copy);
      }),
    );
    const inner = createLetScope(expression, scope);
    const instanceUnits = expression.instances?.flatMap((instance) =>
      context.instances.getLetInstance(instance)
        ? []
        : [
            {
              location: instance.location,
              definitions: addInstanceDefinitions(context.instances, instance, inner),
            },
          ],
    );
    return { instances, inner, instanceUnits };
  };

  const analyzeLet = (expression: LetExpression, scope: Scope) => {
    const entered = enterLet(expression, scope);
    if (expression.recursive) {
      getRecursiveSections(scope, expression).forEach((section) =>
        checkRecursiveSection(section.members),
      );
    }
    const substituted = new Map(
      entered.instances?.flatMap((instance) =>
        instance.getSubstitutionNames().map((name): [string, LetInstance] => [name, instance]),
      ),
    );
    const analyzeSubstitutes = (instance: LetInstance) =>
      instance.getSubstitutionNames().map((name) => {
        const definition = expression.definitions.find((item) => item.name === name);
        if (!definition)
          throw new TlaSyntaxError(`Cannot find the LET instance's substitute ${name}`);
        return analyzeDefinition(definition, entered.inner);
      });
    const checked = new Set<LetInstance>();
    const ownDefinitions = (
      entered.instanceUnits?.length
        ? [
            ...expression.definitions.map((definition) => ({
              location: definition.location,
              definitions: [definition],
            })),
            ...entered.instanceUnits,
          ]
            .toSorted((left, right) => compareLocations(left.location, right.location))
            .flatMap((unit) => unit.definitions)
        : expression.definitions
    ).flatMap((definition) => {
      const instance = substituted.get(definition.name);
      if (!instance) return [analyzeDefinition(definition, entered.inner)];
      if (instance.substitutesCheck === "Instance" || checked.has(instance)) return [];
      checked.add(instance);
      return analyzeSubstitutes(instance);
    });
    const body = analyze(expression.body, entered.inner);
    const instancer = context.module;
    const instanceChecks = (expression.instances ?? []).map((instance) => {
      const letInstance = context.instances.getLetInstance(instance);
      const substitutes =
        letInstance?.substitutesCheck === "Instance" ? analyzeSubstitutes(letInstance) : [];
      if (instancer === undefined) return { substitutes, errors: [] };
      const instanceSubstitutes = letInstance
        ? undefined
        : context.instances.getSubstitutes(instance);
      if (instanceSubstitutes) getSubstitutes(instanceSubstitutes, entered.inner);
      const instantiation = context.instances.checkInstantiation(
        instance,
        instancer,
        entered.inner,
      );
      instantiation.forEach((error) => errors.push(error));
      return { substitutes, errors: instantiation };
    });
    const definitions = [
      ...ownDefinitions,
      ...instanceChecks.flatMap((check) => check.substitutes),
    ];
    const data = {
      level: body.level,
      isCorrect:
        body.isCorrect &&
        // SANY applies a selection's LAMBDA, and an application's level-correctness leaves out its operator's.
        definitions.every((levels) => levels.isCorrect || levels.name === SELECTION_NAME) &&
        instanceChecks.every((check) => check.errors.length === 0),
      params: new Set(body.params),
      constraints: new Map(body.constraints),
      argConstraints: new Map(body.argConstraints),
      argParams: new Map(body.argParams),
      allParams: body.allParams,
      // Deviation from SANY: tla-ts keeps a LET body's nonLeibnizParams, which LetInNode#levelCheck drops, so SANY accepts F(a) == LET L == 1 IN ENABLED (x' = a) for an operator constant.
      nonLeibnizParams: body.nonLeibnizParams,
      appliedParams: body.appliedParams,
    };
    entered.instances?.forEach((instance) =>
      getInstanceArgParams(instance, entered.inner).forEach((entry) =>
        data.argParams.set(entry[0], entry[1]),
      ),
    );
    definitions.forEach((levels) => mergeConstraints(data, levels));
    return data;
  };

  const reportSince = (start: number, range: SourceRange | undefined, data: LevelData) => {
    if (messages.length === start) return data;
    if (range) {
      messages.splice(start).forEach((item) =>
        errors.push({
          location: formatRange(range),
          message: `${item.message}.`,
          code: item.code,
        }),
      );
    }
    return { ...data, isCorrect: false };
  };

  const reportAt = (range: SourceRange | undefined, getData: () => LevelData) => {
    const start = messages.length;
    return reportSince(start, range, getData());
  };

  const analyze = (expression: Expression, scope: Scope) => {
    const start = messages.length;
    const labels = labelChecks;
    const data = reportSince(start, expression.location.range, analyzeNode(expression, scope));
    if (labelChecks === labels || expression.kind === "Label") return data;
    const isCorrect = checkedNodes.get(expression);
    if (isCorrect === undefined) checkedNodes.set(expression, data.isCorrect);
    return isCorrect === undefined || isCorrect === data.isCorrect ? data : { ...data, isCorrect };
  };

  const analyzeNode = (expression: Expression, scope: Scope): LevelData => {
    switch (expression.kind) {
      case "Number":
      case "Decimal":
      case "String":
        return createData();
      case "ExceptAt": {
        const data = createData();
        const entry = scope.get(EXCEPT_AT);
        if (entry?.kind !== "ExceptAt") return data;
        let allParams: Set<string> | undefined;
        entry.parts.forEach((part) => {
          mergeLevels(data, part);
          allParams = addParams(allParams, part.allParams);
        });
        data.allParams = allParams ?? EMPTY_PARAMS;
        return data;
      }
      case "EnabledVariable":
        return createData(VARIABLE_LEVEL);
      case "Identifier": {
        const selection = context.goalSelections?.get(expression);
        return selection
          ? analyzeSelected(selection, expression.name.split("!"), [], scope)
          : applyResolved(resolve(expression.name, scope), [], expression, scope);
      }
      case "Apply": {
        const operands = toOperands(expression.args, scope);
        checkApply(expression, operands);
        return applyResolved(resolve(expression.operator, scope), operands, expression, scope);
      }
      case "OperatorReference":
      case "Lambda":
        return toOperand(expression, scope).data;
      case "And":
      case "Or": {
        const isAnd = expression.kind === "And";
        if (expression.isBulleted) {
          const operands = toOperands(expression.operands, scope);
          checkJunction(
            operands.map((operand) => operand.data.level),
            `${isAnd ? "Conjunction" : "Disjunction"} list`,
          );
          return applyDefined(isAnd ? AND_LEVELS : OR_LEVELS, operands);
        }
        // SANY nests a chain of infix /\ or \/ to the left, so it checks each prefix of the chain.
        const name = isAnd ? "\\land" : "\\lor";
        const start = getWrittenRange(expression.operands[0]);
        const operands: Operand[] = [];
        let prefixLevel = CONSTANT_LEVEL;
        let isPrefixMixed = false;
        expression.operands.forEach((operand, index) => {
          const analyzed = toOperand(operand, scope);
          operands.push(analyzed);
          const levels = [prefixLevel, analyzed.data.level];
          prefixLevel = Math.max(prefixLevel, analyzed.data.level);
          if (index === 0) return;
          const end = getWrittenRange(operand);
          if (index === expression.operands.length - 1 || !start || !end) {
            checkJunction(levels, name);
            return;
          }
          if (!isMixed(levels)) return;
          errors.push({
            location: formatRange({ ...start, end: end.end }),
            message: `${name} has both temporal formula and action as arguments.`,
          });
          isPrefixMixed = true;
        });
        const data = applyDefined(isAnd ? AND_LEVELS : OR_LEVELS, operands);
        return isPrefixMixed ? { ...data, isCorrect: false } : data;
      }
      case "Prime":
        return applyBuiltin(PRIME_LEVELS, [expression.expression], scope);
      case "Unchanged":
        return applyBuiltin(UNCHANGED_LEVELS, [expression.expression], scope);
      case "Enabled":
        return applyBuiltin(ENABLED_LEVELS, [expression.expression], scope);
      case "Always":
      case "Eventually": {
        const operand = toOperand(expression.expression, scope);
        checkTemporal(expression, operand.data.level);
        return applyDefined(expression.kind === "Always" ? ALWAYS_LEVELS : EVENTUALLY_LEVELS, [
          operand,
        ]);
      }
      case "If":
        return applyBuiltin(
          IF_LEVELS,
          [expression.condition, expression.consequent, expression.alternative],
          scope,
        );
      case "Case":
        return applyBuiltin(
          CASE_LEVELS,
          [
            ...expression.arms.flatMap((arm) => [arm.condition, arm.body]),
            ...(expression.other ? [expression.other] : []),
          ],
          scope,
        );
      case "Let":
        return analyzeLet(expression, scope);
      case "Forall":
      case "Exists": {
        const data = applyBuiltin(
          expression.kind === "Forall" ? FORALL_LEVELS : EXISTS_LEVELS,
          [expression.body],
          scope,
          expression.bounds,
        );
        const actionBound =
          data.level === TEMPORAL_LEVEL
            ? expression.bounds.find((bound) => analyze(bound.set, scope).level === ACTION_LEVEL)
            : undefined;
        const range = actionBound?.set.location.range;
        if (range) {
          errors.push({
            location: formatRange(range),
            message: "Action-level bound of quantified temporal formula.",
          });
        }
        return actionBound ? { ...data, isCorrect: false } : data;
      }
      case "UnboundedQuantifier":
        return applyBuiltin(
          expression.isTemporal
            ? expression.quantifier === "Forall"
              ? TEMPORAL_FORALL_LEVELS
              : TEMPORAL_EXISTS_LEVELS
            : expression.quantifier === "Forall"
              ? UNBOUNDED_FORALL_LEVELS
              : UNBOUNDED_EXISTS_LEVELS,
          [expression.body],
          scope,
          [],
          expression.names,
        );
      case "Choose":
        return applyBuiltin(
          expression.set ? BOUNDED_CHOOSE_LEVELS : UNBOUNDED_CHOOSE_LEVELS,
          [expression.body],
          scope,
          expression.set ? [{ pattern: expression.pattern, set: expression.set }] : [],
          getPatternNames(expression.pattern),
        );
      case "SetEnumeration":
        return applyBuiltin(SET_ENUMERATE_LEVELS, expression.elements, scope);
      case "Tuple":
        return applyBuiltin(TUPLE_LEVELS, expression.elements, scope);
      case "FunctionSet":
        return applyBuiltin(SET_OF_FCNS_LEVELS, [expression.domain, expression.range], scope);
      case "Product":
        return applyBuiltin(CARTESIAN_PROD_LEVELS, expression.factors, scope);
      case "SetFilter":
        return applyBuiltin(SUBSET_OF_LEVELS, [expression.predicate], scope, [expression.bound]);
      case "SetMap":
        return applyBuiltin(SET_OF_ALL_LEVELS, [expression.expression], scope, expression.bounds);
      case "FunctionConstruction":
        return applyBuiltin(FCN_CONSTRUCTOR_LEVELS, [expression.body], scope, expression.bounds);
      case "Record":
        return applyBuiltin(
          RCD_CONSTRUCTOR_LEVELS,
          expression.fields.map((field) => field.value),
          scope,
        );
      case "RecordSet":
        return applyBuiltin(
          SET_OF_RCDS_LEVELS,
          expression.fields.map((field) => field.value),
          scope,
        );
      case "Except": {
        const operands = [toOperand(expression.function, scope)];
        expression.updates.forEach((update) => {
          const path: Operand = {
            kind: "Value",
            data: reportAt(update.range, () =>
              applyDefined(
                SEQ_LEVELS,
                update.path.map((step): Operand =>
                  step.kind === "Field"
                    ? { kind: "Value", data: createData() }
                    : step.args.length === 1
                      ? toOperand(step.args[0], scope)
                      : {
                          kind: "Value",
                          data: reportAt(step.tupleRange, () =>
                            applyBuiltin(TUPLE_LEVELS, step.args, scope),
                          ),
                        },
                ),
              ),
            ),
          };
          const valueScope = new Map(scope).set(EXCEPT_AT, {
            kind: "ExceptAt",
            parts: operands.map((operand) => operand.data),
          });
          operands.push({
            kind: "Value",
            data: applyDefined(PAIR_LEVELS, [path, toOperand(update.value, valueScope)]),
          });
        });
        return applyDefined(EXCEPT_LEVELS, operands);
      }
      case "FunctionApplication":
        return applyDefined(APPLY_LEVELS, [
          toOperand(expression.function, scope),
          expression.args.length === 1
            ? toOperand(expression.args[0], scope)
            : { kind: "Value", data: applyBuiltin(TUPLE_LEVELS, expression.args, scope) },
        ]);
      case "Bracket":
        return createData();
      case "FieldAccess":
        return applyDefined(SELECT_LEVELS, [
          toOperand(expression.record, scope),
          { kind: "Value", data: createData() },
        ]);
      case "BoxAction":
      case "AngleAction":
        return applyBuiltin(
          expression.kind === "BoxAction" ? SQUARE_ACT_LEVELS : ANGLE_ACT_LEVELS,
          [expression.action, expression.subscript],
          scope,
        );
      case "WeakFairness":
      case "StrongFairness":
        return applyBuiltin(
          expression.kind === "WeakFairness" ? WF_LEVELS : SF_LEVELS,
          [expression.subscript, expression.action],
          scope,
        );
      case "Label": {
        labelChecks++;
        // Deviation from SANY: tla-ts keeps a labeled body's nonLeibnizParams, which LabelNode drops, so SANY accepts F(a) == lab :: ENABLED (x' = a) for an operator constant.
        const data = analyze(expression.body, scope);
        if (checkedNodes.has(expression)) return { ...data, isCorrect: true };
        checkedNodes.set(expression, true);
        return data;
      }
      case "Selection": {
        const selected = expression.expression;
        const known = selectionLevels.get(selected);
        if (known) {
          return selected.kind === "Label" && checkedNodes.has(selected)
            ? { ...known, isCorrect: true }
            : known;
        }
        const substituted = getSubstituted(selected);
        const data = substituted
          ? analyzeSubstituted(substituted, getSelectedInstance(substituted), scope)
          : analyze(selected, scope);
        selectionLevels.set(selected, data);
        return data;
      }
      case "Subexpression": {
        const selection = context.goalSelections?.get(expression);
        if (!selection) return createData();
        const nameCount = expression.selectors.findIndex((selector) => selector.kind !== "Name");
        return analyzeSelected(
          selection,
          expression.selectors
            .slice(0, nameCount === -1 ? undefined : nameCount)
            .flatMap((selector) => (selector.kind === "Name" ? [selector.name] : [])),
          expression.selectors.flatMap((selector) => ("args" in selector ? selector.args : [])),
          scope,
        );
      }
    }
  };

  const analyzeOperator = (
    name: string,
    formals: OperatorParam[],
    body: Expression,
    scope: Scope,
    binder: object,
  ) => toOperatorLevels(name, formals, analyze(body, bindFormals(scope, formals, binder)));

  const substitutes = new WeakMap<Map<string, Expression>, Map<string, Operand>>();

  const getSubstitutes = (instance: InstanceSubstitutes, scope: Scope) => {
    const cached = substitutes.get(instance.substitutions);
    if (cached) return cached;
    const inner = bindFormals(scope, instance.params);
    const operands = new Map(
      [...instance.substitutions].map((entry): [string, Operand] => [
        entry[0],
        toOperand(entry[1], inner),
      ]),
    );
    substitutes.set(instance.substitutions, operands);
    return operands;
  };

  const addSubstitutedLevels = (
    data: LevelData,
    source: SubstitutedSource,
    operands: Map<string, Operand>,
    instanced: ModuleLevels,
  ) => {
    const getParams = (param: string) => operands.get(param)?.data.params ?? [param];
    source.constraints.forEach((entry) => {
      const level = instanced.isConstant
        ? entry[1]
        : instanced.constants.has(entry[0])
          ? CONSTANT_LEVEL
          : instanced.variables.has(entry[0])
            ? VARIABLE_LEVEL
            : entry[1];
      getParams(entry[0]).forEach((name) => putConstraint(data.constraints, name, level));
    });
    source.argConstraints.forEach((entry) => {
      const parameter = parseArgumentKey(entry[0]);
      const operator = operands.get(parameter.operator);
      if (!operator) putArgConstraint(data.argConstraints, entry[0], entry[1]);
      else if (operator.kind === "Declared") {
        putArgConstraint(
          data.argConstraints,
          getArgumentKey(operator.declared.name, parameter.index),
          entry[1],
        );
      }
    });
    source.argParams.forEach((parameter) => {
      const operator = operands.get(parameter.operator);
      if (operator?.kind === "Operator") {
        getParams(parameter.param).forEach((name) =>
          putConstraint(data.constraints, name, getMaxLevel(operator.data, parameter.index)),
        );
      }
      const target =
        operator === undefined
          ? parameter.operator
          : operator.kind === "Declared"
            ? operator.declared.name
            : undefined;
      if (target === undefined) return;
      const value = operands.get(parameter.param);
      if (value) {
        putArgConstraint(
          data.argConstraints,
          getArgumentKey(target, parameter.index),
          value.data.level,
        );
      }
      (operator === undefined ? [parameter.param] : getParams(parameter.param)).forEach((name) =>
        addArgumentParam(data.argParams, target, parameter.index, name),
      );
    });
  };

  const applySubstitutes = (
    body: SubstitutedBody,
    operands: Map<string, Operand>,
    instanced: ModuleLevels,
  ) => {
    const data = createData(
      body.params.reduce(
        (level, param) => Math.max(level, operands.get(param)?.data.level ?? 0),
        body.level,
      ),
    );
    data.isCorrect =
      body.isCorrect && [...operands.values()].every((operand) => operand.data.isCorrect);
    body.params.forEach((param) =>
      (operands.get(param)?.data.params ?? [param]).forEach((name) => data.params.add(name)),
    );
    const isBodyApplied = (param: string) =>
      body.appliedParams === undefined
        ? body.params.includes(param)
        : body.appliedParams.has(param);
    if (
      body.appliedParams !== undefined ||
      [...operands.values()].some((operand) => hasAppliedParams(operand.data))
    ) {
      const applied = new Set<string>();
      (body.appliedParams ?? body.params).forEach((param) => {
        if (!operands.has(param)) applied.add(param);
      });
      operands.forEach((operand, param) => {
        if (isBodyApplied(param)) addOperandAppliedParams(applied, operand);
      });
      data.appliedParams = applied;
    }
    let allParams: Set<string> | undefined;
    let nonLeibnizParams: Set<string> | undefined;
    body.allParams.forEach((param) => {
      const operand = operands.get(param);
      const isNonLeibniz = body.nonLeibnizParams.has(param);
      if (!operand) {
        (allParams ??= new Set()).add(param);
        if (isNonLeibniz) (nonLeibnizParams ??= new Set()).add(param);
        return;
      }
      allParams = addParams(allParams, operand.data.allParams);
      nonLeibnizParams = addParams(
        nonLeibnizParams,
        getNonLeibnizParams(operand, isBodyApplied(param)),
      );
      if (isNonLeibniz) nonLeibnizParams = addParams(nonLeibnizParams, operand.data.allParams);
    });
    data.allParams = allParams ?? EMPTY_PARAMS;
    data.nonLeibnizParams = nonLeibnizParams ?? EMPTY_PARAMS;
    addSubstitutedLevels(data, body, operands, instanced);
    return data;
  };

  const analyzeInstance = (
    substitutes: InstanceSubstitutes,
    instanced: ModuleLevels,
    scope: Scope,
  ) => {
    const operands = getSubstitutes(substitutes, scope);
    const substituted = createData();
    addSubstitutedLevels(
      substituted,
      {
        constraints: [...instanced.constraints],
        argConstraints: [...instanced.argConstraints],
        argParams: [...instanced.argParams.values()],
      },
      operands,
      instanced,
    );
    operands.forEach((operand) => mergeConstraints(substituted, operand.data));
    const isParam = (name: string) => substitutes.params.some((param) => param.name === name);
    const data = createData();
    substituted.constraints.forEach((level, name) => {
      if (!isParam(name)) data.constraints.set(name, level);
    });
    substituted.argConstraints.forEach((level, key) => {
      if (!isParam(parseArgumentKey(key).operator)) data.argConstraints.set(key, level);
    });
    substituted.argParams.forEach((parameter, key) => {
      if (!isParam(parameter.operator) && !isParam(parameter.param)) {
        data.argParams.set(key, parameter);
      }
    });
    return data;
  };

  const analyzeInstanced = (definition: Definition, copy: InstanceCopy, scope: Scope) => {
    const instanced = context.instances.getInstanced(copy);
    const source = instanced.source;
    const formals = getFormals(definition);
    const rename = getFormalRenamer(formals, source.formals);
    const names = source.formals.map((formal) => rename(formal.name));
    const nonLeibnizNames = names.filter((_name, index) => source.nonLeibniz.has(index));
    const data = applySubstitutes(
      {
        level: source.level,
        isCorrect: source.isCorrect,
        params: [...source.params, ...names.filter((_name, index) => source.weights[index] === 1)],
        allParams: new Set([...source.allParams, ...nonLeibnizNames]),
        // Deviation from SANY: tla-ts substitutes an instanced theorem's nonLeibnizParams as SubstInNode does, which APSubstInNode omits, so SANY accepts F(a) == I(a)!T for THEOREM T == w' = 0 and w <- a.
        nonLeibnizParams: new Set([...source.nonLeibnizParams, ...nonLeibnizNames]),
        appliedParams: source.appliedParams && new Set([...source.appliedParams].map(rename)),
        constraints: [
          ...source.constraints,
          ...names.map((name, index): [string, number] => [name, source.maxLevels[index]]),
        ],
        argConstraints: [
          ...source.argConstraints,
          ...names.flatMap((name, index) =>
            source.minMaxLevels[index].map((level, position): [string, number] => [
              getArgumentKey(name, position),
              level,
            ]),
          ),
        ],
        argParams: [
          ...[...source.argParams.values()].map((parameter) =>
            renameArgumentParam(parameter, rename),
          ),
          ...names.flatMap((operator, operatorIndex) =>
            names.flatMap((param, paramIndex) =>
              Array.from({ length: source.formals[operatorIndex].arity }, (_value, index) => index)
                .filter((index) =>
                  source.conditions.has(getConditionKey(operatorIndex, paramIndex, index)),
                )
                .map((index) => ({ operator, index, param })),
            ),
          ),
        ],
      },
      getSubstitutes(copy, scope),
      instanced,
    );
    return toOperatorLevels(definition.name, formals, data);
  };

  const getGoalInstanced = (names: string[], scope: Scope): Instanced | undefined => {
    const definition = names
      .map((_name, index) => names.slice(0, names.length - index).join("!"))
      .map((name) => {
        const entry = scope.get(name);
        return entry === undefined
          ? context.getDefinition(name)
          : entry.kind === "Let"
            ? entry.definition
            : undefined;
      })
      .find((candidate) => candidate !== undefined);
    const copy = definition && (letCopies.get(definition) ?? context.instances.getCopy(definition));
    return definition && copy && { definition, copy, params: [] };
  };

  const analyzeSelected = (
    selection: Expression,
    names: string[],
    args: Expression[],
    scope: Scope,
  ) => {
    const instanced = getGoalInstanced(names, scope);
    if (!instanced) return analyzeGoalSelection(selection, toOperands(args, scope), scope);
    if (selection.kind !== "Lambda") return analyzeSubstituted(selection, instanced, scope);
    const formals = instanced.copy.params;
    return applyDefined(
      toOperatorLevels(
        "LAMBDA",
        formals,
        analyzeSubstituted(selection.body, instanced, bindFormals(scope, formals)),
      ),
      toOperands(args, scope),
    );
  };

  const getSelectedInstance = (substituted: Expression): Instanced => {
    const selected = context.instances.getSelectedDefinition(substituted);
    const copy =
      selected &&
      (letCopies.get(selected.definition) ?? context.instances.getCopy(selected.definition));
    if (!selected || !copy) throw getMissingOriginalError(substituted);
    return { definition: selected.definition, copy, params: selected.params };
  };

  const analyzeSubstituted = (target: Expression, instanced: Instanced, scope: Scope) => {
    const copy = instanced.copy;
    // SANY level-checks the instanced module before the selection, so the original keeps that check.
    const instancedLevels = context.instances.getModuleLevels(copy.module);
    const original = context.instances.getOriginal(copy, target);
    const renamed = new Map(
      instanced.params.flatMap((param): [string, string][] => {
        const name = context.instances.getOriginalName(param);
        return name === undefined ? [] : [[name, param]];
      }),
    );
    const renameFormal = getFormalRenamer(
      getFormals(instanced.definition),
      getFormals(copy.source),
    );
    const rename = (name: string) => renamed.get(name) ?? renameFormal(name);
    return applySubstitutes(
      {
        level: original.level,
        isCorrect: original.isCorrect,
        params: [...original.params].map(rename),
        allParams: new Set([...original.allParams].map(rename)),
        nonLeibnizParams: new Set([...original.nonLeibnizParams].map(rename)),
        appliedParams: original.appliedParams && new Set([...original.appliedParams].map(rename)),
        constraints: [...original.constraints].map((entry): [string, number] => [
          rename(entry[0]),
          entry[1],
        ]),
        argConstraints: [...original.argConstraints].map((entry): [string, number] => {
          const parameter = parseArgumentKey(entry[0]);
          return [getArgumentKey(rename(parameter.operator), parameter.index), entry[1]];
        }),
        argParams: [...original.argParams.values()].map((parameter) =>
          renameArgumentParam(parameter, rename),
        ),
      },
      getSubstitutes(copy, scope),
      instancedLevels,
    );
  };

  // A selection's LAMBDA shares its location with the application of it.
  const findOriginal = (
    expression: Expression,
    target: Expression,
    scope: Scope,
    instanced: Instanced | undefined,
  ): FoundOriginal | undefined => {
    if (
      expression.location === target.location &&
      (expression.kind !== "Lambda" || target.kind === "Lambda")
    ) {
      return { expression, scope, instanced };
    }
    if (expression.kind === "Let") {
      const entered = enterLet(expression, scope);
      for (const definition of [
        ...expression.definitions,
        ...(entered.instanceUnits?.flatMap((unit) => unit.definitions) ?? []),
      ]) {
        const found = findInDefinition(definition, target, entered.inner, instanced);
        if (found) return found;
      }
      return findOriginal(expression.body, target, entered.inner, instanced);
    }
    let found: FoundOriginal | undefined;
    forEachChild(expression, (child, bound) => {
      found ??= findOriginal(child, target, bindFormals(scope, toFormals(bound)), instanced);
    });
    return found;
  };

  const findInDefinition = (
    definition: Definition,
    target: Expression,
    scope: Scope,
    instanced: Instanced | undefined,
  ) => {
    const copy = letCopies.get(definition) ?? context.instances.getCopy(definition);
    return findOriginal(
      getDefinitionBody(definition),
      target,
      bindFormals(scope, getFormals(definition)),
      copy ? { definition, copy, params: [] } : instanced,
    );
  };

  const analyzeOriginal = (definition: Definition, target: Expression): LevelData => {
    const found = findInDefinition(definition, target, new Map(), undefined);
    if (!found) {
      const original =
        target.kind === "Let" && !target.location.range
          ? target.body
          : substitutionFrames.get(target)?.findLast((frame) => !frameSubstitutions.has(frame));
      if (!original) throw getMissingOriginalError(target);
      return analyzeOriginal(definition, original);
    }
    return found.instanced
      ? analyzeSubstituted(found.expression, found.instanced, found.scope)
      : analyze(found.expression, found.scope);
  };

  const staleDefinitions = new Set<Definition>();
  const sectionBodies = new Map<Definition, OperatorLevels | undefined>();

  const analyzeStatement = (statement: Expression | AssumeProve): LevelData => {
    const cached = statementLevels.get(statement);
    if (cached) return cached;
    const data =
      statement.kind === "AssumeProve"
        ? analyzeAssumeProve(statement, new Map(), analyzer)
        : analyze(statement, new Map());
    statementLevels.set(statement, data);
    return data;
  };

  const analyzeDefinition = (definition: Definition, scope: Scope): OperatorLevels => {
    const members = context.recursiveSections.get(definition);
    if (members) checkRecursiveSection(members);
    const cached = definitionLevels.get(definition);
    if (cached && !staleDefinitions.delete(definition)) return cached;
    const prior = cached ?? createPlaceholder(definition, TEMPORAL_LEVEL, 0);
    definitionLevels.set(definition, prior);
    const copy = letCopies.get(definition) ?? context.instances.getCopy(definition);
    // Deviation from SANY: ThmOrAssumpDefNode#levelCheck assigns each weight to itself, so SANY levels I(x)!T without x, where tla-ts weighs x as for I(x)!D.
    const levels = copy
      ? analyzeInstanced(definition, copy, scope)
      : "statement" in definition
        ? toOperatorLevels(definition.name, [], analyzeStatement(definition.statement))
        : analyzeOperator(
            definition.name,
            getFormals(definition),
            getDefinitionBody(definition),
            scope,
            definition,
          );
    const isInSection = sectionBodies.has(definition);
    if (isInSection) sectionBodies.set(definition, levels);
    const merged = {
      ...levels,
      level: Math.max(prior.level, levels.level),
      params: new Set([...prior.params, ...levels.params]),
      argParams: new Map([...prior.argParams, ...levels.argParams]),
      maxLevels: levels.maxLevels.map((level, index) => Math.min(level, prior.maxLevels[index])),
      weights: levels.weights.map((weight, index) => Math.max(weight, prior.weights[index])),
      nonLeibniz: new Set([...prior.nonLeibniz, ...levels.nonLeibniz]),
      allParams: new Set([...prior.allParams, ...levels.allParams]),
      nonLeibnizParams: new Set([...prior.nonLeibnizParams, ...levels.nonLeibnizParams]),
      appliedParams: isInSection ? undefined : levels.appliedParams,
    };
    definitionLevels.set(definition, merged);
    return merged;
  };

  const isClosedName = (name: string, bound: string[], scope: Scope) => {
    if (bound.includes(name)) return true;
    const entry = scope.get(name);
    if (entry) return entry.kind === "Formal";
    return (
      context.constants.has(name) ||
      context.variables.has(name) ||
      (!context.getDefinition(name) && CORE_SIGNATURES.has(name))
    );
  };

  const isClosed = (expression: Expression, bound: string[], scope: Scope): boolean => {
    switch (expression.kind) {
      case "Identifier":
        return isClosedName(expression.name, bound, scope);
      case "OperatorReference":
        return isClosedName(expression.operator, bound, scope);
      case "Apply":
        if (!isClosedName(expression.operator, bound, scope)) return false;
        break;
      case "Lambda":
      case "Let":
      case "Selection":
      case "Subexpression":
      case "EnabledVariable":
        return false;
    }
    let isEveryChildClosed = true;
    forEachChild(expression, (child, names) => {
      isEveryChildClosed &&= isClosed(child, [...bound, ...names], scope);
    });
    return isEveryChildClosed;
  };

  const isClosedDefinition = (member: SectionMember) => {
    const definition = member.definition;
    return (
      !("statement" in definition) &&
      !letCopies.has(definition) &&
      !context.instances.getCopy(definition) &&
      isClosed(
        getDefinitionBody(definition),
        getFormals(definition).map((formal) => formal.name),
        member.scope,
      )
    );
  };

  // A member applies another member's parameter where its own scope binds the name alike, or where
  // the name is a constant or variable, as SANY's nodes tell apart two parameters of one name.
  const setSectionAppliedParams = (members: SectionMember[]) => {
    const bindings = new Map<string, (ScopeEntry | undefined)[]>();
    members.forEach((member) =>
      analyzeDefinition(member.definition, member.scope).allParams.forEach((name) => {
        const entry = member.scope.get(name);
        const isBound =
          entry === undefined
            ? context.constants.has(name) || context.variables.has(name)
            : entry.kind === "Formal";
        const entries = bindings.get(name);
        if (!isBound || entries?.includes(entry)) return;
        if (entries) entries.push(entry);
        else bindings.set(name, [entry]);
      }),
    );
    members.forEach((member) => {
      const body = sectionBodies.get(member.definition);
      if (body === undefined) return;
      const stored = analyzeDefinition(member.definition, member.scope);
      if (isClosedDefinition(member)) {
        definitionLevels.set(member.definition, {
          ...stored,
          appliedParams: new Set(
            body.appliedParams ?? [
              ...body.params,
              ...body.formals
                .filter((_formal, index) => body.weights[index] === 1)
                .map((formal) => formal.name),
            ],
          ),
        });
        return;
      }
      const appliedParams = new Set(stored.formals.map((formal) => formal.name));
      bindings.forEach((entries, name) => {
        if (entries.includes(member.scope.get(name))) appliedParams.add(name);
      });
      definitionLevels.set(member.definition, { ...stored, appliedParams });
    });
  };

  const checkPrimedArguments = (members: SectionMember[]) =>
    members.forEach((member) => {
      const range = member.definition.location.range;
      if (!member.definition.isRecursive || !range) return;
      analyzeDefinition(member.definition, member.scope).maxLevels.forEach((level, index) => {
        if (level >= ACTION_LEVEL) return;
        errors.push({
          location: formatRange(range),
          message: `Argument ${index + 1} of recursive operator ${resolveSynonym(member.definition.name)} is primed`,
        });
      });
    });

  const checkRecursiveSection = (members: SectionMember[]) => {
    if (members.some((member) => sectionBodies.has(member.definition))) return;
    members.forEach((member) => sectionBodies.set(member.definition, undefined));
    const recursive = members.filter((member) => member.definition.isRecursive);
    recursive.forEach((member) =>
      definitionLevels.set(
        member.definition,
        createPlaceholder(member.definition, ACTION_LEVEL, 1),
      ),
    );
    const recheck = (member: SectionMember) => {
      if (member.definition.isRecursive) staleDefinitions.add(member.definition);
      return analyzeDefinition(member.definition, member.scope);
    };
    members.forEach((member) => {
      recheck(member);
      checkPrimedArguments([member]);
    });
    const firstPass = recursive.map((member) => analyzeDefinition(member.definition, member.scope));
    const level = firstPass.reduce(
      (maximum, levels) => Math.max(maximum, levels.level),
      CONSTANT_LEVEL,
    );
    // The recursive members' parameters, each with the entry of the scope that binds it, if one
    // does, which a member names as its own where its scope binds the name alike.
    const getBound = (names: (levels: OperatorLevels) => ReadonlySet<string>) =>
      recursive.flatMap((member, index) =>
        [...names(firstPass[index])].map((name) => ({ name, entry: member.scope.get(name) })),
      );
    const params = getBound((levels) => levels.params);
    const allParams = getBound((levels) => levels.allParams);
    const getMemberParams = (
      member: SectionMember,
      own: ReadonlySet<string>,
      bound: typeof params,
    ) => {
      const memberParams = new Set(own);
      bound.forEach((param) => {
        const local = member.scope.get(param.name);
        memberParams.add(
          param.entry?.kind !== "Formal" ||
            local === param.entry ||
            (local?.kind === "Formal" &&
              local.binder !== undefined &&
              local.binder === param.entry.binder)
            ? param.name
            : getForeignName(param.name, param.entry),
        );
      });
      return memberParams;
    };
    members.forEach((member) => {
      const levels = analyzeDefinition(member.definition, member.scope);
      definitionLevels.set(member.definition, {
        ...levels,
        level: Math.max(levels.level, level),
        params: getMemberParams(member, levels.params, params),
        allParams: getMemberParams(member, levels.allParams, allParams),
      });
      if (member.isRechecked && !member.definition.isRecursive) {
        staleDefinitions.add(member.definition);
      }
    });
    members.forEach(recheck);
    setSectionAppliedParams(members);
  };

  const getOperatorLevels = (name: string) => {
    const resolved = resolve(name, new Map());
    return resolved.kind === "Defined" ? resolved.levels : undefined;
  };

  const analyzer = {
    analyze,
    analyzeDefinition,
    analyzeInstance,
    analyzeOriginal,
    analyzeStatement,
    checkPrimedArguments,
    checkRecursiveSection,
    constants: context.constants,
    getSubstitutes,
    toOperand,
    getOperatorLevels,
    errors,
  };
  return analyzer;
};

export type LevelAnalyzer = ReturnType<typeof createLevelAnalyzer>;

const mergeLevels = (data: LevelData, part: LevelData) => {
  data.level = Math.max(data.level, part.level);
  part.params.forEach((param) => data.params.add(param));
  mergeConstraints(data, part);
};

const constrainConstants = (data: LevelData, analyzer: LevelAnalyzer) =>
  data.params.forEach((param) => {
    if (analyzer.constants.has(param)) putConstraint(data.constraints, param, ACTION_LEVEL);
  });

export const analyzeAssumeProve = (
  assumeProve: AssumeProve,
  scope: Scope,
  analyzer: LevelAnalyzer,
): LevelData => {
  const inner = new Map(scope);
  const data = createData();
  assumeProve.assumptions.forEach((assumption) => {
    if (assumption.kind === "NewSymbol") {
      const set = assumption.set && analyzer.analyze(assumption.set, inner);
      const range = assumption.location.range;
      if (set?.level === TEMPORAL_LEVEL && range) {
        analyzer.errors.push({
          location: formatRange(range),
          message: "Level error:\nTemporal formula used as set.",
        });
      }
      const level = NEW_SYMBOL_LEVELS[assumption.level];
      inner.set(assumption.name, { kind: "Formal", arity: assumption.arity, level });
      mergeLevels(data, set ?? createData(level));
      return;
    }
    mergeLevels(
      data,
      assumption.kind === "AssumeProve"
        ? analyzeAssumeProve(assumption, inner, analyzer)
        : analyzer.analyze(assumption, inner),
    );
  });
  mergeLevels(data, analyzer.analyze(assumeProve.conclusion, inner));
  constrainConstants(data, analyzer);
  return data;
};

export const analyzeAssumption = (expression: Expression, analyzer: LevelAnalyzer) => {
  const data = createData();
  mergeLevels(data, analyzer.analyze(expression, new Map()));
  // Deviation from SANY: AssumeNode#levelCheck passes its own empty level fields, so it never constrains the constants.
  constrainConstants(data, analyzer);
  return data;
};

const addNewSymbols = (statement: Expression | AssumeProve, scope: Scope) => {
  if (statement.kind !== "AssumeProve") return scope;
  statement.assumptions.forEach((assumption) => {
    if (assumption.kind !== "NewSymbol") return;
    const level = NEW_SYMBOL_LEVELS[assumption.level];
    scope.set(assumption.name, { kind: "Formal", arity: assumption.arity, level });
  });
  return scope;
};

export const createProofChecker = (
  analyzer: LevelAnalyzer,
  instances: InstanceLevels,
  instancer: string,
) => {
  const getData = (expressions: Expression[], scope: Scope) => {
    const data = createData();
    expressions.forEach((expression) => mergeLevels(data, analyzer.analyze(expression, scope)));
    return data;
  };
  const getStepData = (step: ProofStep, scope: Scope) => {
    const body = step.body;
    if (body.kind === "Have" || body.kind === "Case") return getData([body.expression], scope);
    if (body.kind === "Witness") {
      const data = getData(body.expressions, scope);
      data.params.forEach((param) => putConstraint(data.constraints, param, ACTION_LEVEL));
      return data;
    }
    if (body.kind === "Take")
      return getData(
        body.bounds.map((bound) => bound.set),
        scope,
      );
    if (body.kind === "Pick") {
      return getData([body.body, ...body.bounds.map((bound) => bound.set)], scope);
    }
    if (body.kind !== "Assert") return createData();
    return body.statement.kind === "AssumeProve"
      ? analyzeAssumeProve(body.statement, scope, analyzer)
      : getData([body.statement], scope);
  };
  const getFactData = (facts: Fact[], scope: Scope) =>
    getData(
      facts.flatMap((fact) => (fact.kind === "ModuleFact" ? [] : [fact])),
      scope,
    );
  const stepLevels = new Map<ProofStep, number>();
  // Deviation from SANY: SANY reads a LabelNode's unset level field here, so it skips the proof of a labeled temporal goal.
  const checkTemporalGoal = (proof: Proof | undefined): SanyError[] =>
    proof?.kind !== "Steps"
      ? []
      : proof.steps.flatMap((step) => {
          const location = formatRange(step.statement);
          const isConstant = stepLevels.get(step) === CONSTANT_LEVEL;
          if (
            step.body.kind === "Have" ||
            step.body.kind === "Take" ||
            step.body.kind === "Witness"
          ) {
            return isConstant
              ? []
              : [{ location, message: "Non-constant TAKE, WITNESS, or HAVE for temporal goal." }];
          }
          if (step.body.kind === "Case") {
            return [
              ...(isConstant
                ? []
                : [{ location, message: "Non-constant CASE for temporal goal." }]),
              ...checkTemporalGoal(step.proof),
            ];
          }
          return step.body.kind === "Qed" ? checkTemporalGoal(step.proof) : [];
        });
  const checkProof = (proof: Proof | undefined, scope: Scope, data?: LevelData): SanyError[] => {
    const merge = (part: LevelData) => {
      if (data) mergeLevels(data, part);
    };
    if (proof?.kind === "By") {
      merge(getFactData(proof.facts, scope));
      return analyzer.errors.splice(0);
    }
    if (proof?.kind !== "Steps") return [];
    const inner = new Map(scope);
    const checkInstance = (instance: Instance) => {
      instance.substitutions.forEach((substitution) =>
        analyzer.toOperand(substitution.expression, inner),
      );
      const errors = [
        ...analyzer.errors.splice(0),
        ...instances.checkInstantiation(instance, instancer, inner),
      ];
      const substitutes = data && instances.getSubstitutes(instance);
      if (substitutes) {
        merge(
          analyzer.analyzeInstance(substitutes, instances.getModuleLevels(instance.module), inner),
        );
        analyzer.errors.splice(0);
      }
      return errors;
    };
    // SANY's NonLeafProofNode#levelCheck checks the instances of a proof's definitions after its steps.
    const definedInstances: Instance[] = [];
    const errors = proof.steps.flatMap((step) => {
      const body = step.body;
      if (body.kind === "Use" || body.kind === "Hide") merge(getFactData(body.facts, inner));
      if (body.kind === "Instance") addInstanceDefinitions(instances, body, inner);
      if (body.kind === "Define") {
        body.definitions.forEach((definition) => {
          if (definition.kind === "Instance") {
            definedInstances.push(definition);
            addInstanceDefinitions(instances, definition, inner);
            return;
          }
          inner.set(definition.name, { kind: "Let", definition, scope: inner });
          merge(analyzer.analyzeDefinition(definition, inner));
        });
      }
      const stepData = getStepData(step, inner);
      merge(stepData);
      stepLevels.set(step, stepData.level);
      const isTemporal = stepData.level === TEMPORAL_LEVEL;
      const pickErrors =
        body.kind === "Pick" && body.bounds.length > 0 && isTemporal
          ? body.bounds
              .filter((bound) => analyzer.analyze(bound.set, inner).level !== 0)
              .flatMap((bound) =>
                bound.set.location.range
                  ? [
                      {
                        location: formatRange(bound.set.location.range),
                        message: "Non-constant bound of temporal PICK.",
                      },
                    ]
                  : [],
              )
          : [];
      const isSuffices = body.kind === "Assert" && body.isSuffices;
      const stepErrors = [
        ...analyzer.errors.splice(0),
        ...(body.kind === "Instance" ? checkInstance(body) : []),
        ...checkProof(
          step.proof,
          body.kind === "Assert" && !isSuffices
            ? addNewSymbols(body.statement, new Map(inner))
            : inner,
          data,
        ),
        ...pickErrors,
        ...(step.proof?.kind === "Steps" && isTemporal ? checkTemporalGoal(step.proof) : []),
      ];
      if (isSuffices) addNewSymbols(body.statement, inner);
      return stepErrors;
    });
    return [...errors, ...definedInstances.flatMap(checkInstance)];
  };
  const checkTheoremProof = (theorem: Theorem, data?: LevelData) =>
    checkProof(theorem.proof, addNewSymbols(theorem.statement, new Map()), data);
  return {
    checkTemporalGoal,
    checkTheoremProof,
    getFactData,
    analyzeTheorem: (theorem: Theorem) => {
      const data = createData();
      mergeLevels(data, analyzer.analyzeStatement(theorem.statement));
      checkTheoremProof(theorem, data);
      return data;
    },
  };
};

export const checkModuleLevels = (
  module: Module,
  context: LevelContext,
  instances: InstanceLevelCheck[],
  warnings: SanyError[],
) => {
  const analyzer = createLevelAnalyzer(context);
  const proofs = createProofChecker(analyzer, context.instances, module.name);
  const getStatementLevel = (statement: Expression | AssumeProve) =>
    analyzer.analyzeStatement(statement).level;
  const statements = [
    ...module.theorems,
    ...module.assumptions.map((assumption) => ({
      ...assumption,
      statement: assumption.expression,
    })),
  ];
  const statementBodies = new Set(statements.map((statement) => statement.statement));
  const sections = getRecursiveSections(new Map(), module.units, module.hasRecursiveLet);
  sections.forEach((section) =>
    section.members.forEach((member) =>
      context.recursiveSections.set(member.definition, section.members),
    ),
  );
  // The levels of each definition, which a check of a module that extends a prepared module links.
  const levels: (OperatorLevels | undefined)[] = module.definitions.map(() => undefined);
  const createCheck = (location: SourceLocation, run: () => void) => ({
    location,
    check: (reported: SanyError[]) => {
      run();
      reported.push(...analyzer.errors.splice(0));
    },
  });
  const getSubstitutesChecks = (substitutesCheck: InstanceLevelCheck["substitutesCheck"]) =>
    instances
      .filter((instance) => instance.substitutesCheck === substitutesCheck)
      .map((instance) =>
        createCheck(instance.location, () =>
          analyzer.getSubstitutes(instance.substitutes, new Map()),
        ),
      );
  return {
    module,
    levels,
    sections: sections.map((section) =>
      createCheck(section.location, () => analyzer.checkRecursiveSection(section.members)),
    ),
    check: (isInner: boolean) =>
      [
        (isInner ? sections : []).map((section) =>
          createCheck(section.location, () => analyzer.checkPrimedArguments(section.members)),
        ),
        [
          ...module.definitions.flatMap((definition, position) =>
            definition.name.includes("!") || statementBodies.has(definition.body)
              ? []
              : [
                  createCheck(definition.location, () => {
                    levels[position] = analyzer.analyzeDefinition(definition, new Map());
                  }),
                ],
          ),
          ...getSubstitutesChecks("Definition"),
        ],
        [
          ...statements
            .filter((statement) => statement.name !== undefined)
            .map((statement) =>
              createCheck(statement.location, () => getStatementLevel(statement.statement)),
            ),
          ...getSubstitutesChecks("Theorem"),
        ],
        [
          ...module.assumptions.map((assumption) => ({
            location: assumption.location,
            check: (reported: SanyError[]) => {
              const level = getStatementLevel(assumption.expression);
              reported.push(...analyzer.errors.splice(0));
              const range = assumption.location.range;
              if (level !== CONSTANT_LEVEL && range) {
                reported.push({
                  location: formatRange(range),
                  message: `Level error: assumptions must be level 0 (Constant), \nbut this one has level ${level}.`,
                });
              }
            },
          })),
          ...module.theorems.map((theorem) => ({
            location: theorem.location,
            check: (reported: SanyError[]) => {
              const level = getStatementLevel(theorem.statement);
              reported.push(
                ...analyzer.errors.splice(0),
                ...proofs.checkTheoremProof(theorem),
                ...(level === TEMPORAL_LEVEL ? proofs.checkTemporalGoal(theorem.proof) : []),
              );
            },
          })),
          ...module.uses.map((use) =>
            createCheck(use.location, () => proofs.getFactData(use.facts, new Map())),
          ),
          ...instances.map((instance) => ({
            location: instance.location,
            check: (reported: SanyError[]) => {
              if (instance.substitutesCheck === "Instance") {
                analyzer.getSubstitutes(instance.substitutes, new Map());
              }
              reported.push(...analyzer.errors.splice(0), ...instance.check());
            },
          })),
        ],
      ].flatMap((units) => collectSemanticErrors(units, warnings)),
  };
};
