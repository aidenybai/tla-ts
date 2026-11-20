import {
  getChildren,
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
  argParams: Set<string>;
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
  argParams: Set<string>;
}

interface InstancedDefinition extends ModuleLevels {
  source: OperatorLevels;
}

interface ArgumentParam {
  operator: string;
  index: number;
  param: string;
}

interface SubstitutedSource {
  constraints: [string, number][];
  argConstraints: [string, number][];
  argParams: ArgumentParam[];
}

interface SubstitutedBody extends SubstitutedSource {
  level: number;
  isCorrect: boolean;
  params: string[];
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
  getArgParams: () => Set<string>;
  getSubstitutionDefinitions: () => Definition[];
  substitutesCheck: InstanceLevelCheck["substitutesCheck"];
}

export interface InstanceLevels {
  getCopy: (definition: Definition) => InstanceCopy | undefined;
  getSelectedDefinition: (expression: Expression) => SelectedDefinition | undefined;
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
  instances: InstanceLevels;
  recursiveSections: WeakMap<Definition, SectionMember[]>;
  // SANY keeps each node's first level check, though a label checked again, here or in a module it sees, is level-correct.
  checkedNodes?: WeakMap<Expression, boolean>;
  goalSelections?: WeakMap<Expression, Expression>;
  originalNames?: Map<string, string>;
}

export interface InstanceLevelCheck {
  location: SourceLocation;
  check: () => SanyError[];
  substitutes: InstanceSubstitutes;
  substitutesCheck: "Definition" | "Theorem" | "Instance";
}

type ScopeEntry =
  | { kind: "Formal"; arity: number; level: number }
  | { kind: "Let"; definition: Definition; scope: Scope };

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

type ScopeFrame = Definition | LetExpression | string[];

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

export const parseArgumentParamKey = (key: string) => {
  const parts = key.split(SEPARATOR);
  return { operator: parts[0], index: Number(parts[1]), param: parts[2] };
};

const renameArgumentParam = (key: string, rename: (name: string) => string) => {
  const parameter = parseArgumentParamKey(key);
  return {
    operator: rename(parameter.operator),
    index: parameter.index,
    param: rename(parameter.param),
  };
};

const getFormalRenamer = (formals: OperatorParam[], sourceFormals: OperatorParam[]) => {
  const prefix = formals.length - sourceFormals.length;
  const renamed = new Map(
    sourceFormals.map((formal, index) => [formal.name, formals[prefix + index].name]),
  );
  return (name: string) => renamed.get(name) ?? name;
};

const getConditionKey = (operator: number, operand: number, argument: number) =>
  `${operator},${operand},${argument}`;

const createData = (level = 0): LevelData => ({
  level,
  isCorrect: true,
  params: new Set(),
  constraints: new Map(),
  argConstraints: new Map(),
  argParams: new Set(),
});

export const putConstraint = (constraints: Map<string, number>, name: string, level: number) =>
  constraints.set(name, Math.min(level, constraints.get(name) ?? TEMPORAL_LEVEL));

export const putArgConstraint = (constraints: Map<string, number>, key: string, level: number) =>
  constraints.set(key, Math.max(level, constraints.get(key) ?? 0));

const mergeConstraints = (data: LevelData, part: LevelData) => {
  part.constraints.forEach((value, key) => putConstraint(data.constraints, key, value));
  part.argConstraints.forEach((value, key) => putArgConstraint(data.argConstraints, key, value));
  part.argParams.forEach((key) => data.argParams.add(key));
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
  nonLeibniz: new Set(),
});

const getMaxLevel = (operator: OperatorLevels, index: number) =>
  operator.formals.length === 0 && operator.maxLevels.length > 0
    ? operator.maxLevels[Math.min(index, operator.maxLevels.length - 1)]
    : (operator.maxLevels[index] ?? TEMPORAL_LEVEL);

const getWeight = (operator: OperatorLevels, index: number) =>
  operator.formals.length === 0 && operator.weights.length > 0
    ? operator.weights[Math.min(index, operator.weights.length - 1)]
    : (operator.weights[index] ?? 1);

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
    {
      ...createSignature(signature[0], signature[1], [...signature[2]], [...signature[3]]),
      nonLeibniz: new Set(signature[1] > 1 ? [0, 1] : []),
    },
  ]),
);

const PRIME_LEVELS = createSignature("'", 2, [1], [0]);
const UNCHANGED_LEVELS = createSignature("UNCHANGED", 2, [1], [0]);
const ENABLED_LEVELS = createSignature("ENABLED", 1, [2], [0]);
const ALWAYS_LEVELS = createSignature("[]", 3, [3], [0]);
const EVENTUALLY_LEVELS = createSignature("<>", 3, [3], [0]);
const AND_LEVELS = createSignature("$ConjList", 0, [3], [1]);
const OR_LEVELS = createSignature("$DisjList", 0, [3], [1]);
const IF_LEVELS = createSignature("$IfThenElse", 0, [3], [1]);
const CASE_LEVELS = createSignature("$Case", 0, [3], [1]);
const FORALL_LEVELS = createSignature("$BoundedForall", 0, [3], [1]);
const EXISTS_LEVELS = createSignature("$BoundedExists", 0, [3], [1]);
const UNBOUNDED_FORALL_LEVELS = createSignature("$UnboundedForall", 0, [3], [1]);
const UNBOUNDED_EXISTS_LEVELS = createSignature("$UnboundedExists", 0, [3], [1]);
const TEMPORAL_FORALL_LEVELS = createSignature("$TemporalForall", 3, [3], [0]);
const TEMPORAL_EXISTS_LEVELS = createSignature("$TemporalExists", 3, [3], [0]);
const BOUNDED_CHOOSE_LEVELS = createSignature("$BoundedChoose", 0, [2], [1]);
const UNBOUNDED_CHOOSE_LEVELS = createSignature("$UnboundedChoose", 0, [2], [1]);
const SET_ENUMERATE_LEVELS = createSignature("$SetEnumerate", 0, [2], [1]);
const TUPLE_LEVELS = createSignature("$Tuple", 0, [2], [1]);
const SET_OF_FCNS_LEVELS = createSignature("$SetOfFcns", 0, [2], [1]);
const CARTESIAN_PROD_LEVELS = createSignature("$CartesianProd", 0, [2], [1]);
const SUBSET_OF_LEVELS = createSignature("$SubsetOf", 0, [2], [1]);
const SET_OF_ALL_LEVELS = createSignature("$SetOfAll", 0, [2], [1]);
const FCN_CONSTRUCTOR_LEVELS = createSignature("$FcnConstructor", 0, [3], [1]);
const RCD_CONSTRUCTOR_LEVELS = createSignature("$RcdConstructor", 0, [3], [1]);
const SET_OF_RCDS_LEVELS = createSignature("$SetOfRcds", 0, [2], [1]);
const EXCEPT_LEVELS = createSignature("$Except", 0, [2], [1]);
const PAIR_LEVELS = createSignature("$Pair", 0, [3], [1]);
const SEQ_LEVELS = createSignature("$Seq", 0, [2], [1]);
const APPLY_LEVELS = createSignature("$FcnApply", 0, [2, 2], [1, 1]);
const SELECT_LEVELS = createSignature("$RcdSelect", 0, [2, 0], [1, 1]);
const SQUARE_ACT_LEVELS = createSignature("$SquareAct", 2, [2, 1], [0, 0]);
const ANGLE_ACT_LEVELS = createSignature("$AngleAct", 2, [2, 1], [0, 0]);
const WF_LEVELS = createSignature("$WF", 3, [1, 2], [0, 0]);
const SF_LEVELS = createSignature("$SF", 3, [1, 2], [0, 0]);

const bindFormals = (scope: Scope, formals: OperatorParam[]) =>
  formals.length === 0
    ? scope
    : new Map([
        ...scope,
        ...formals.map((formal): [string, ScopeEntry] => [
          formal.name,
          { kind: "Formal", arity: formal.arity, level: CONSTANT_LEVEL },
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

const toOperatorLevels = (
  name: string,
  formals: OperatorParam[],
  data: LevelData,
  nonLeibnizNames: Set<string>,
) => {
  const isFormal = (param: string) => formals.some((formal) => formal.name === param);
  const levels: OperatorLevels = {
    ...createData(data.level),
    isCorrect: data.isCorrect,
    name,
    formals,
    nonLeibniz: new Set(
      formals.flatMap((formal, index) => (nonLeibnizNames.has(formal.name) ? [index] : [])),
    ),
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
    if (!isFormal(parseArgumentParamKey(key).operator)) levels.argConstraints.set(key, value);
  });
  data.argParams.forEach((key) => {
    const parameter = parseArgumentParamKey(key);
    if (!isFormal(parameter.operator) || !isFormal(parameter.param)) levels.argParams.add(key);
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
      scope = Array.isArray(frame)
        ? bindFormals(scope, toFormals(frame))
        : frame.kind === "Let"
          ? createLetScope(frame, scope)
          : frame.kind === "Function"
            ? bindFormals(scope, toFormals(getBoundNames(frame.bounds)))
            : bindFormals(scope, frame.params);
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

  const visitChild = (child: Expression, bound: string[]) =>
    bound.length === 0 ? walkExpression(child) : walkInFrame(bound, child);

  const walkExpression = (expression: Expression): void => {
    if (expression.kind !== "Let") return forEachChild(expression, visitChild);
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
  let labelChecks = 0;
  const errors: CodedSanyError[] = [];
  const messages: LevelMessage[] = [];

  const resolve = (name: string, scope: Scope): Resolved => {
    const entry = scope.get(name);
    if (entry?.kind === "Formal") {
      return { kind: "Declared", name, level: entry.level, arity: entry.arity };
    }
    if (entry?.kind === "Let") {
      return { kind: "Defined", levels: analyzeDefinition(entry.definition, entry.scope) };
    }
    const arity = context.constants.get(name);
    if (arity !== undefined) return { kind: "Declared", name, level: 0, arity };
    if (context.variables.has(name)) return { kind: "Declared", name, level: 1, arity: 0 };
    const definition = context.getDefinition(name);
    if (definition) {
      const levels = analyzeDefinition(definition, new Map());
      const qualifiedName = context.getQualifiedName?.(name);
      return {
        kind: "Defined",
        levels: qualifiedName ? { ...levels, name: qualifiedName } : levels,
      };
    }
    const signature = CORE_SIGNATURES.get(name) ?? STANDARD_LEVELS.get(name);
    if (signature) return { kind: "Defined", levels: signature };
    return { kind: "Unknown", name };
  };

  const applyDeclared = (name: string, level: number, operands: Operand[]) => {
    const data = createData(Math.max(level, ...operands.map((operand) => operand.data.level)));
    data.isCorrect = operands.every((operand) => operand.data.isCorrect);
    data.params.add(name);
    operands.forEach((operand, index) => {
      operand.data.params.forEach((param) => {
        data.params.add(param);
        data.argParams.add(getArgumentParamKey(name, index, param));
      });
      putArgConstraint(data.argConstraints, getArgumentKey(name, index), operand.data.level);
      mergeConstraints(data, operand.data);
    });
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
    const data = createData(
      Math.max(
        operator.level,
        ...operands
          .filter((_operand, index) => getWeight(operator, index) === 1)
          .map((operand) => operand.data.level),
        ...ranges.map((range) => range.level),
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
    operator.argParams.forEach((key) => {
      const parameter = parseArgumentParamKey(key);
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
    operator.argParams.forEach((key) => {
      const parameter = parseArgumentParamKey(key);
      const argument = getOperand(parameter.operator);
      if (argument) {
        putArgConstraint(
          data.argConstraints,
          getArgumentKey(parameter.operator, parameter.index),
          argument.data.level,
        );
      }
    });

    operands.forEach((operand) =>
      operand.data.argParams.forEach((key) => {
        if (!isBound(parseArgumentParamKey(key).param)) data.argParams.add(key);
      }),
    );
    ranges.forEach((range) => range.argParams.forEach((key) => data.argParams.add(key)));
    operator.argParams.forEach((key) => {
      const parameter = parseArgumentParamKey(key);
      const argument = getOperand(parameter.operator);
      if (!argument) {
        const value = getOperand(parameter.param);
        if (!value) {
          data.argParams.add(key);
          return;
        }
        value.data.params.forEach((param) =>
          data.argParams.add(getArgumentParamKey(parameter.operator, parameter.index, param)),
        );
        return;
      }
      if (argument.kind === "Declared") {
        data.argParams.add(
          getArgumentParamKey(argument.declared.name, parameter.index, parameter.param),
        );
      }
    });
    operands.forEach((operand, operandIndex) => {
      if (operand.kind !== "Declared") return;
      const declared = operand.declared;
      operands.forEach((other, otherIndex) =>
        Array.from({ length: declared.arity }, (_value, argumentIndex) => {
          if (!hasCondition(operandIndex, otherIndex, argumentIndex)) return;
          other.data.params.forEach((param) =>
            data.argParams.add(getArgumentParamKey(declared.name, argumentIndex, param)),
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
      ...[...instance.getArgParams()].flatMap((key) => {
        const parameter = parseArgumentParamKey(key);
        const operator = operands.get(parameter.operator);
        if (!operator) return [key];
        return operator.kind === "Declared"
          ? [...getParams(parameter.param)].map((param) =>
              getArgumentParamKey(operator.declared.name, parameter.index, param),
            )
          : [];
      }),
      ...[...operands.values()].flatMap((operand) => [...operand.data.argParams]),
    ].filter((key) => {
      const parameter = parseArgumentParamKey(key);
      return instance.params.every(
        (param) => param.name !== parameter.operator && param.name !== parameter.param,
      );
    });
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
        instance
          .getSubstitutionDefinitions()
          .map((definition): [Definition, LetInstance] => [definition, instance]),
      ),
    );
    const analyzeSubstitutes = (instance: LetInstance) =>
      instance
        .getSubstitutionDefinitions()
        .map((definition) => analyzeDefinition(definition, entered.inner));
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
      const instance = substituted.get(definition);
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
      argParams: new Set(body.argParams),
    };
    entered.instances?.forEach((instance) =>
      getInstanceArgParams(instance, entered.inner).forEach((key) => data.argParams.add(key)),
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
      case "ExceptAt":
        return createData();
      case "EnabledVariable":
        return createData(VARIABLE_LEVEL);
      case "Identifier":
        return applyResolved(resolve(expression.name, scope), [], expression, scope);
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
      case "Except":
        return applyDefined(EXCEPT_LEVELS, [
          toOperand(expression.function, scope),
          ...expression.updates.map((update): Operand => ({
            kind: "Value",
            data: applyDefined(PAIR_LEVELS, [
              {
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
              },
              toOperand(update.value, scope),
            ]),
          })),
        ]);
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
        return selection
          ? analyzeGoalSelection(
              selection,
              toOperands(
                expression.selectors.flatMap((selector) =>
                  "args" in selector ? selector.args : [],
                ),
                scope,
              ),
              scope,
            )
          : createData();
      }
    }
  };

  const getNonLeibnizNames = (
    expression: Expression,
    scope: Scope,
    isNonLeibniz = false,
    names = new Set<string>(),
  ): Set<string> => {
    const visit = (child: Expression, isChildNonLeibniz = isNonLeibniz, childScope = scope) =>
      getNonLeibnizNames(child, childScope, isChildNonLeibniz, names);
    const visitOperator = (name: string, args: Expression[]) => {
      const resolved = resolve(name, scope);
      if (resolved.kind !== "Defined") {
        if (isNonLeibniz) names.add(name);
        args.forEach((arg) => visit(arg));
        return;
      }
      args.forEach((arg, index) =>
        visit(arg, isNonLeibniz || resolved.levels.nonLeibniz.has(index)),
      );
    };
    switch (expression.kind) {
      case "Identifier":
        visitOperator(expression.name, []);
        return names;
      case "Apply":
        visitOperator(expression.operator, expression.args);
        return names;
      case "Lambda":
      case "Let":
      case "Selection":
        return names;
      case "Prime":
      case "Unchanged":
      case "Enabled":
      case "Always":
      case "Eventually":
      case "BoxAction":
      case "AngleAction":
      case "WeakFairness":
      case "StrongFairness":
        getChildren(expression).forEach((child) => visit(child, true));
        return names;
      case "UnboundedQuantifier":
        visit(
          expression.body,
          isNonLeibniz || expression.isTemporal === true,
          bindFormals(scope, toFormals(expression.names)),
        );
        return names;
      default:
        forEachChild(expression, (child, bound) =>
          visit(child, isNonLeibniz, bindFormals(scope, toFormals(bound))),
        );
        return names;
    }
  };

  const analyzeOperator = (
    name: string,
    formals: OperatorParam[],
    body: Expression,
    scope: Scope,
  ) => {
    const inner = bindFormals(scope, formals);
    return toOperatorLevels(
      name,
      formals,
      analyze(body, inner),
      getNonLeibnizNames(body.kind === "Selection" ? body.expression : body, inner),
    );
  };

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
      const parameter = parseArgumentParamKey(entry[0]);
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
        data.argParams.add(getArgumentParamKey(target, parameter.index, name)),
      );
    });
  };

  const applySubstitutes = (
    body: SubstitutedBody,
    operands: Map<string, Operand>,
    instanced: ModuleLevels,
  ) => {
    const data = createData(
      Math.max(body.level, ...body.params.map((param) => operands.get(param)?.data.level ?? 0)),
    );
    data.isCorrect =
      body.isCorrect && [...operands.values()].every((operand) => operand.data.isCorrect);
    body.params.forEach((param) =>
      (operands.get(param)?.data.params ?? [param]).forEach((name) => data.params.add(name)),
    );
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
        argParams: [...instanced.argParams].map(parseArgumentParamKey),
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
      if (!isParam(parseArgumentParamKey(key).operator)) data.argConstraints.set(key, level);
    });
    substituted.argParams.forEach((key) => {
      const parameter = parseArgumentParamKey(key);
      if (!isParam(parameter.operator) && !isParam(parameter.param)) data.argParams.add(key);
    });
    return data;
  };

  const analyzeInstanced = (definition: Definition, copy: InstanceCopy, scope: Scope) => {
    const instanced = context.instances.getInstanced(copy);
    const source = instanced.source;
    const formals = getFormals(definition);
    const prefix = formals.length - source.formals.length;
    const rename = getFormalRenamer(formals, source.formals);
    const names = source.formals.map((formal) => rename(formal.name));
    const data = applySubstitutes(
      {
        level: source.level,
        isCorrect: source.isCorrect,
        params: [...source.params, ...names.filter((_name, index) => source.weights[index] === 1)],
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
          ...[...source.argParams].map((key) => renameArgumentParam(key, rename)),
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
    const nonLeibniz = new Set(names.filter((_name, index) => source.nonLeibniz.has(index)));
    if (prefix > 0) {
      const instanceParams = new Set(formals.slice(0, prefix).map((formal) => formal.name));
      getNonLeibnizNames(getDefinitionBody(definition), bindFormals(scope, formals)).forEach(
        (name) => {
          if (instanceParams.has(name)) nonLeibniz.add(name);
        },
      );
    }
    return toOperatorLevels(definition.name, formals, data, nonLeibniz);
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
        const name = context.originalNames?.get(param);
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
        constraints: [...original.constraints].map((entry): [string, number] => [
          rename(entry[0]),
          entry[1],
        ]),
        argConstraints: [...original.argConstraints].map((entry): [string, number] => {
          const parameter = parseArgumentParamKey(entry[0]);
          return [getArgumentKey(rename(parameter.operator), parameter.index), entry[1]];
        }),
        argParams: [...original.argParams].map((key) => renameArgumentParam(key, rename)),
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

  const analyzeDefinition = (definition: Definition, scope: Scope): OperatorLevels => {
    const members = definition.isRecursive && context.recursiveSections.get(definition);
    if (members && !definitionLevels.has(definition)) checkRecursiveSection(members);
    const cached = definitionLevels.get(definition);
    if (cached && !staleDefinitions.delete(definition)) return cached;
    const prior = cached ?? createPlaceholder(definition, TEMPORAL_LEVEL, 0);
    definitionLevels.set(definition, prior);
    const copy = letCopies.get(definition) ?? context.instances.getCopy(definition);
    const levels = copy
      ? analyzeInstanced(definition, copy, scope)
      : analyzeOperator(
          definition.name,
          getFormals(definition),
          getDefinitionBody(definition),
          scope,
        );
    const merged = {
      ...levels,
      level: Math.max(prior.level, levels.level),
      params: new Set([...prior.params, ...levels.params]),
      argParams: new Set([...prior.argParams, ...levels.argParams]),
      maxLevels: levels.maxLevels.map((level, index) => Math.min(level, prior.maxLevels[index])),
      weights: levels.weights.map((weight, index) => Math.max(weight, prior.weights[index])),
      nonLeibniz: new Set([...prior.nonLeibniz, ...levels.nonLeibniz]),
    };
    definitionLevels.set(definition, merged);
    return merged;
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
    if (members.length === 0 || definitionLevels.has(members[0].definition)) return;
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
    const level = Math.max(CONSTANT_LEVEL, ...firstPass.map((levels) => levels.level));
    const params = firstPass.flatMap((levels) => [...levels.params]);
    members.forEach((member) => {
      const levels = analyzeDefinition(member.definition, member.scope);
      definitionLevels.set(member.definition, {
        ...levels,
        level: Math.max(levels.level, level),
        params: new Set([...levels.params, ...params]),
      });
      if (member.isRechecked && !member.definition.isRecursive) {
        staleDefinitions.add(member.definition);
      }
    });
    members.forEach(recheck);
  };

  return {
    analyze,
    analyzeDefinition,
    analyzeInstance,
    analyzeOriginal,
    checkPrimedArguments,
    checkRecursiveSection,
    constants: context.constants,
    getSubstitutes,
    toOperand,
    errors,
  };
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
      mergeLevels(
        data,
        theorem.statement.kind === "AssumeProve"
          ? analyzeAssumeProve(theorem.statement, new Map(), analyzer)
          : analyzer.analyze(theorem.statement, new Map()),
      );
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
  const statementLevels = new Map<Expression | AssumeProve, number>();
  const getStatementLevel = (statement: Expression | AssumeProve) => {
    const cached = statementLevels.get(statement);
    if (cached !== undefined) return cached;
    const level =
      statement.kind === "AssumeProve"
        ? analyzeAssumeProve(statement, new Map(), analyzer).level
        : analyzer.analyze(statement, new Map()).level;
    statementLevels.set(statement, level);
    return level;
  };
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
    sections: sections.map((section) =>
      createCheck(section.location, () => analyzer.checkRecursiveSection(section.members)),
    ),
    check: (isInner: boolean) =>
      [
        (isInner ? sections : []).map((section) =>
          createCheck(section.location, () => analyzer.checkPrimedArguments(section.members)),
        ),
        [
          ...module.definitions
            .filter(
              (definition) =>
                !definition.name.includes("!") && !statementBodies.has(definition.body),
            )
            .map((definition) =>
              createCheck(definition.location, () =>
                analyzer.analyzeDefinition(definition, new Map()),
              ),
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
