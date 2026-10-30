import {
  getChildren,
  type AssumeProve,
  type Definition,
  type Expression,
  type Module,
  type OperatorParam,
  type SourceLocation,
} from "./ast";
import { TlaSyntaxError } from "./errors";
import { mapChildren } from "./instances";
import { getBoundNames, getPatternNames } from "./resolve";
import { STANDARD_LEVELS } from "./standard-levels";

interface LevelData {
  level: number;
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

interface LevelContext {
  constants: Set<string>;
  variables: Set<string>;
  getDefinition: (name: string) => Definition | undefined;
}

type ScopeEntry =
  | { kind: "Formal"; arity: number }
  | { kind: "Let"; definition: Definition; scope: Scope };

export type Scope = Map<string, ScopeEntry>;

type Resolved =
  | { kind: "Declared"; name: string; level: number; arity: number }
  | { kind: "Defined"; levels: OperatorLevels };

interface Operand {
  data: LevelData;
  operator?: OperatorLevels;
  declared?: OperatorParam;
}

export const MAX_LEVEL = 3;

const SEPARATOR = "\u0000";

export const getArgumentKey = (operator: string, index: number) =>
  `${operator}${SEPARATOR}${index}`;

const getArgumentParamKey = (operator: string, index: number, param: string) =>
  `${operator}${SEPARATOR}${index}${SEPARATOR}${param}`;

export const parseArgumentParamKey = (key: string) => {
  const parts = key.split(SEPARATOR);
  return { operator: parts[0], index: Number(parts[1]), param: parts[2] };
};

const getConditionKey = (operator: number, operand: number, argument: number) =>
  `${operator},${operand},${argument}`;

const createData = (level = 0): LevelData => ({
  level,
  params: new Set(),
  constraints: new Map(),
  argConstraints: new Map(),
  argParams: new Set(),
});

export const putConstraint = (constraints: Map<string, number>, name: string, level: number) =>
  constraints.set(name, Math.min(level, constraints.get(name) ?? MAX_LEVEL));

export const putArgConstraint = (constraints: Map<string, number>, key: string, level: number) =>
  constraints.set(key, Math.max(level, constraints.get(key) ?? 0));

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
    : (operator.maxLevels[index] ?? MAX_LEVEL);

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
  ).map(([name, level, maxLevels, weights]): [string, OperatorLevels] => [
    name,
    {
      ...createSignature(name, level, [...maxLevels], [...weights]),
      nonLeibniz: new Set(level > 1 ? [0, 1] : []),
    },
  ]),
);

const SET_LEVELS = createSignature("$Set", 0, [2], [1]);
const JUNCTION_LEVELS = createSignature("$Junction", 0, [3], [1]);
const CHOOSE_LEVELS = createSignature("$Choose", 0, [2], [1]);
const FUNCTION_LEVELS = createSignature("$Function", 0, [3], [1]);
const APPLY_LEVELS = createSignature("$FcnApply", 0, [2, 2], [1, 1]);
const SELECT_LEVELS = createSignature("$RcdSelect", 0, [2, 0], [1, 1]);
const PRIME_LEVELS = createSignature("'", 2, [1], [0]);
const ENABLED_LEVELS = createSignature("ENABLED", 1, [2], [0]);
const TEMPORAL_LEVELS = createSignature("[]", 3, [3], [0]);
const ACTION_LEVELS = createSignature("$SquareAct", 2, [2, 1], [0, 0]);
const FAIRNESS_LEVELS = createSignature("$WF", 3, [1, 2], [0, 0]);
const TEMPORAL_QUANTIFIER_LEVELS = createSignature("$TemporalExists", 3, [3], [0]);

const bindFormals = (scope: Scope, formals: OperatorParam[]) =>
  formals.length === 0
    ? scope
    : new Map([
        ...scope,
        ...formals.map((formal): [string, ScopeEntry] => [
          formal.name,
          { kind: "Formal", arity: formal.arity },
        ]),
      ]);

const toFormals = (names: string[]) => names.map((name) => ({ name, arity: 0 }));

// The levels of tla2sany.semantic.LevelConstants.
export const CONSTANT_LEVEL = 0;
export const VARIABLE_LEVEL = 1;
export const ACTION_LEVEL = 2;
export const TEMPORAL_LEVEL = 3;

const createLevelError = (message: string, location: SourceLocation) =>
  new TlaSyntaxError(`${message} at line ${location.line}, column ${location.column}`);

const LOGICAL_OPERATORS = new Set(["/\\", "\\/", "=>", "<=>"]);

// SANY's OpApplNode.levelCheck rejects raw actions inside temporal formulas, but not inside a LET
// or a label.
const isOperatorApplication = (expression: Expression) =>
  expression.kind !== "Let" && expression.kind !== "Label";

export const createLevelAnalyzer = (context: LevelContext) => {
  const definitionLevels = new Map<Definition, OperatorLevels>();

  const resolve = (name: string, scope: Scope): Resolved => {
    const entry = scope.get(name);
    if (entry?.kind === "Formal") {
      return { kind: "Declared", name, level: 0, arity: entry.arity };
    }
    if (entry?.kind === "Let") {
      return { kind: "Defined", levels: analyzeDefinition(entry.definition, entry.scope) };
    }
    if (context.constants.has(name)) return { kind: "Declared", name, level: 0, arity: 0 };
    if (context.variables.has(name)) return { kind: "Declared", name, level: 1, arity: 0 };
    const definition = context.getDefinition(name);
    if (definition) {
      return { kind: "Defined", levels: analyzeDefinition(definition, new Map()) };
    }
    const signature = CORE_SIGNATURES.get(name) ?? STANDARD_LEVELS.get(name);
    if (signature) return { kind: "Defined", levels: signature };
    return { kind: "Declared", name, level: 0, arity: 0 };
  };

  const applyDeclared = (name: string, level: number, operands: Operand[]) => {
    const data = createData(Math.max(level, ...operands.map((operand) => operand.data.level)));
    data.params.add(name);
    operands.forEach((operand, index) => {
      operand.data.params.forEach((param) => {
        data.params.add(param);
        data.argParams.add(getArgumentParamKey(name, index, param));
      });
      operand.data.constraints.forEach((value, key) => putConstraint(data.constraints, key, value));
      putArgConstraint(data.argConstraints, getArgumentKey(name, index), operand.data.level);
      operand.data.argConstraints.forEach((value, key) =>
        putArgConstraint(data.argConstraints, key, value),
      );
      operand.data.argParams.forEach((key) => data.argParams.add(key));
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
    operands.forEach((operand, index) => {
      if (operand.operator || operand.declared) return;
      if (operand.data.level > getMaxLevel(operator, index)) {
        throw new TlaSyntaxError(
          `Level error in applying operator ${operator.name}: The level of argument ${index + 1} exceeds the maximum level allowed by the operator.`,
        );
      }
    });
    if (ranges.some((range) => range.level > ACTION_LEVEL)) {
      throw new TlaSyntaxError(
        `Level error in applying operator ${operator.name}: The level of the range for a bounded variable exceeds the maximum level allowed by the operator.`,
      );
    }
    const getOperand = (formal: string) => {
      const index = operator.formals.findIndex((param) => param.name === formal);
      return index === -1 ? undefined : operands[index];
    };
    const hasCondition = (operandIndex: number, otherIndex: number, argumentIndex: number) =>
      operator.conditions.has(getConditionKey(operandIndex, otherIndex, argumentIndex));
    const data = createData(
      Math.max(
        operator.level,
        ...operands
          .filter((_, index) => getWeight(operator, index) === 1)
          .map((operand) => operand.data.level),
        ...ranges.map((range) => range.level),
      ),
    );
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
      const argument = operand.operator;
      if (!argument) return;
      operands.forEach((other, otherIndex) =>
        argument.formals.forEach((_, argumentIndex) => {
          if (!hasCondition(operandIndex, otherIndex, argumentIndex)) return;
          other.data.params.forEach((param) =>
            putConstraint(data.constraints, param, getMaxLevel(argument, argumentIndex)),
          );
        }),
      );
    });
    operator.argParams.forEach((key) => {
      const parameter = parseArgumentParamKey(key);
      const argument = getOperand(parameter.operator)?.operator;
      if (argument) {
        putConstraint(data.constraints, parameter.param, getMaxLevel(argument, parameter.index));
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
      const declared = operand.declared;
      if (!declared) return;
      Array.from({ length: declared.arity }, (_, argumentIndex) =>
        putArgConstraint(
          data.argConstraints,
          getArgumentKey(declared.name, argumentIndex),
          operator.minMaxLevels[operandIndex]?.[argumentIndex] ?? 0,
        ),
      );
      operands.forEach((other, otherIndex) =>
        Array.from({ length: declared.arity }, (_, argumentIndex) => {
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
      if (argument.declared) {
        data.argParams.add(
          getArgumentParamKey(argument.declared.name, parameter.index, parameter.param),
        );
      }
    });
    operands.forEach((operand, operandIndex) => {
      const declared = operand.declared;
      if (!declared) return;
      operands.forEach((other, otherIndex) =>
        Array.from({ length: declared.arity }, (_, argumentIndex) => {
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
      const operator = analyzeOperator(
        "LAMBDA",
        toFormals(expression.params),
        expression.body,
        scope,
      );
      return { data: operator, operator };
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
        return { data: resolved.levels, operator: resolved.levels };
      }
      if (resolved.kind === "Declared" && resolved.arity > 0) {
        const data = createData();
        data.params.add(name);
        return { data, declared: { name, arity: resolved.arity } };
      }
    }
    return { data: analyze(expression, scope) };
  };

  const toOperands = (expressions: Expression[], scope: Scope) =>
    expressions.map((expression) => toOperand(expression, scope));

  const applyBuiltin = (
    operator: OperatorLevels,
    expressions: Expression[],
    scope: Scope,
    ranges: Expression[] = [],
    bound: string[] = [],
  ) => {
    const inner = bindFormals(scope, toFormals(bound));
    return applyDefined(
      operator,
      toOperands(expressions, inner),
      ranges.map((range) => analyze(range, scope)),
      bound,
    );
  };

  const applyResolved = (resolved: Resolved, operands: Operand[]) =>
    resolved.kind === "Declared"
      ? applyDeclared(resolved.name, resolved.level, operands)
      : applyDefined(resolved.levels, operands);

  const checkJunction = (operands: Operand[], location: SourceLocation) => {
    const levels = operands.map((operand) => operand.data.level);
    if (levels.includes(ACTION_LEVEL) && levels.includes(TEMPORAL_LEVEL)) {
      throw createLevelError("Formula has both temporal formula and action as arguments", location);
    }
  };

  const checkApply = (expression: Expression & { kind: "Apply" }, operands: Operand[]) => {
    const isLeadsTo = expression.operator === "~>" || expression.operator === "-+->";
    if (isLeadsTo && operands.some((operand) => operand.data.level === ACTION_LEVEL)) {
      throw createLevelError(
        "Action used where only temporal formula or state predicate allowed",
        expression.location,
      );
    }
    if (LOGICAL_OPERATORS.has(expression.operator)) checkJunction(operands, expression.location);
  };

  const checkTemporal = (
    expression: Expression & { kind: "Always" | "Eventually" },
    level: number,
  ) => {
    const operand = expression.expression;
    const form = expression.kind === "Always" ? "BoxAction" : "AngleAction";
    if (level !== ACTION_LEVEL || !isOperatorApplication(operand) || operand.kind === form) return;
    throw createLevelError(
      expression.kind === "Always"
        ? "[] followed by action not of form [A]_v"
        : "<> followed by action not of form <<A>>_v",
      expression.location,
    );
  };

  const analyzeLet = (expression: Expression & { kind: "Let" }, scope: Scope) => {
    const inner = new Map(scope);
    expression.definitions.forEach((definition) =>
      inner.set(definition.name, { kind: "Let", definition, scope: inner }),
    );
    const body = analyze(expression.body, inner);
    const data = {
      level: body.level,
      params: new Set(body.params),
      constraints: new Map(body.constraints),
      argConstraints: new Map(body.argConstraints),
      argParams: new Set(body.argParams),
    };
    expression.definitions.forEach((definition) => {
      const levels = analyzeDefinition(definition, inner);
      levels.constraints.forEach((value, key) => putConstraint(data.constraints, key, value));
      levels.argConstraints.forEach((value, key) =>
        putArgConstraint(data.argConstraints, key, value),
      );
      levels.argParams.forEach((key) => data.argParams.add(key));
    });
    return data;
  };

  const analyze = (expression: Expression, scope: Scope): LevelData => {
    switch (expression.kind) {
      case "Number":
      case "Decimal":
      case "String":
      case "ExceptAt":
        return createData();
      case "Identifier":
        return applyResolved(resolve(expression.name, scope), []);
      case "Apply": {
        const operands = toOperands(expression.args, scope);
        checkApply(expression, operands);
        return applyResolved(resolve(expression.operator, scope), operands);
      }
      case "OperatorReference":
      case "Lambda":
        return toOperand(expression, scope).data;
      case "And":
      case "Or": {
        const operands = toOperands(expression.operands, scope);
        checkJunction(operands, expression.location);
        return applyDefined(JUNCTION_LEVELS, operands);
      }
      case "Prime":
      case "Unchanged":
        return applyBuiltin(PRIME_LEVELS, [expression.expression], scope);
      case "Enabled":
        return applyBuiltin(ENABLED_LEVELS, [expression.expression], scope);
      case "Always":
      case "Eventually": {
        const operand = toOperand(expression.expression, scope);
        checkTemporal(expression, operand.data.level);
        return applyDefined(TEMPORAL_LEVELS, [operand]);
      }
      case "If":
        return applyBuiltin(
          JUNCTION_LEVELS,
          [expression.condition, expression.consequent, expression.alternative],
          scope,
        );
      case "Case":
        return applyBuiltin(
          JUNCTION_LEVELS,
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
          JUNCTION_LEVELS,
          [expression.body],
          scope,
          expression.bounds.map((bound) => bound.set),
          getBoundNames(expression.bounds),
        );
        if (
          data.level === TEMPORAL_LEVEL &&
          expression.bounds.some((bound) => analyze(bound.set, scope).level === ACTION_LEVEL)
        ) {
          throw createLevelError(
            "Action-level bound of quantified temporal formula",
            expression.location,
          );
        }
        return data;
      }
      case "UnboundedQuantifier":
        return applyBuiltin(
          expression.isTemporal ? TEMPORAL_QUANTIFIER_LEVELS : JUNCTION_LEVELS,
          [expression.body],
          scope,
          [],
          expression.names,
        );
      case "Choose":
        return applyBuiltin(
          CHOOSE_LEVELS,
          [expression.body],
          scope,
          expression.set ? [expression.set] : [],
          getPatternNames(expression.pattern),
        );
      case "SetEnumeration":
      case "Tuple":
      case "FunctionSet":
      case "Product":
        return applyBuiltin(
          SET_LEVELS,
          expression.kind === "FunctionSet"
            ? [expression.domain, expression.range]
            : expression.kind === "Product"
              ? expression.factors
              : expression.elements,
          scope,
        );
      case "SetFilter":
        return applyBuiltin(
          SET_LEVELS,
          [expression.predicate],
          scope,
          [expression.bound.set],
          getPatternNames(expression.bound.pattern),
        );
      case "SetMap":
        return applyBuiltin(
          SET_LEVELS,
          [expression.expression],
          scope,
          expression.bounds.map((bound) => bound.set),
          getBoundNames(expression.bounds),
        );
      case "FunctionConstruction":
        return applyBuiltin(
          FUNCTION_LEVELS,
          [expression.body],
          scope,
          expression.bounds.map((bound) => bound.set),
          getBoundNames(expression.bounds),
        );
      case "Record":
        return applyBuiltin(
          FUNCTION_LEVELS,
          expression.fields.map((field) => field.value),
          scope,
        );
      case "RecordSet":
        return applyBuiltin(
          SET_LEVELS,
          expression.fields.map((field) => field.value),
          scope,
        );
      case "Except":
        return applyBuiltin(
          SET_LEVELS,
          [
            expression.function,
            ...expression.updates.flatMap((update) => [
              ...update.path.flatMap((step) => (step.kind === "Index" ? step.args : [])),
              update.value,
            ]),
          ],
          scope,
        );
      case "FunctionApplication":
        return applyDefined(APPLY_LEVELS, [
          toOperand(expression.function, scope),
          expression.args.length === 1
            ? toOperand(expression.args[0], scope)
            : { data: applyBuiltin(SET_LEVELS, expression.args, scope) },
        ]);
      // SANY's semantic checker rejects the expression without computing its level.
      case "Bracket":
        return createData();
      case "FieldAccess":
        return applyDefined(SELECT_LEVELS, [
          toOperand(expression.record, scope),
          { data: createData() },
        ]);
      case "BoxAction":
      case "AngleAction":
        return applyBuiltin(ACTION_LEVELS, [expression.action, expression.subscript], scope);
      case "WeakFairness":
      case "StrongFairness":
        return applyBuiltin(FAIRNESS_LEVELS, [expression.subscript, expression.action], scope);
      case "Label":
        return analyze(expression.body, scope);
      case "Subexpression":
        return createData();
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
      if (resolved.kind === "Declared") {
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
      // SANY's LetInNode and OpArgNode don't carry the non-Leibniz parameters of their bodies.
      case "Lambda":
      case "Let":
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
        mapChildren(expression, (child, bound) => {
          visit(child, isNonLeibniz, bindFormals(scope, toFormals(bound)));
          return child;
        });
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
    const data = analyze(body, inner);
    const isFormal = (param: string) => formals.some((formal) => formal.name === param);
    const nonLeibnizNames = getNonLeibnizNames(body, inner);
    const levels: OperatorLevels = {
      ...createData(data.level),
      name,
      formals,
      nonLeibniz: new Set(
        formals.flatMap((formal, index) => (nonLeibnizNames.has(formal.name) ? [index] : [])),
      ),
      maxLevels: formals.map((formal) =>
        Math.min(MAX_LEVEL, data.constraints.get(formal.name) ?? MAX_LEVEL),
      ),
      weights: formals.map((formal) => (data.params.has(formal.name) ? 1 : 0)),
      minMaxLevels: formals.map((formal) =>
        Array.from(
          { length: formal.arity },
          (_, index) => data.argConstraints.get(getArgumentKey(formal.name, index)) ?? 0,
        ),
      ),
      conditions: new Set(
        formals.flatMap((operator, operatorIndex) =>
          formals.flatMap((param, paramIndex) =>
            Array.from({ length: operator.arity }, (_, argumentIndex) => argumentIndex)
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

  const analyzeDefinition = (definition: Definition, scope: Scope): OperatorLevels => {
    const cached = definitionLevels.get(definition);
    if (cached) return cached;
    const formals = definition.kind === "Operator" ? definition.params : [];
    definitionLevels.set(definition, {
      ...createData(),
      name: definition.name,
      formals,
      maxLevels: formals.map(() => MAX_LEVEL),
      weights: formals.map(() => 0),
      minMaxLevels: formals.map(() => []),
      conditions: new Set(),
      nonLeibniz: new Set(),
    });
    const body: Expression =
      definition.kind === "Function"
        ? {
            kind: "FunctionConstruction",
            bounds: definition.bounds,
            body: definition.body,
            location: definition.location,
          }
        : definition.body;
    const levels = analyzeOperator(definition.name, formals, body, scope);
    definitionLevels.set(definition, levels);
    return levels;
  };

  return { analyze, analyzeDefinition, toOperand };
};

const analyzeAssumeProve = (
  assumeProve: AssumeProve,
  scope: Scope,
  analyzer: ReturnType<typeof createLevelAnalyzer>,
) => {
  const inner = new Map(scope);
  assumeProve.assumptions.forEach((assumption) => {
    if (assumption.kind === "NewSymbol") {
      if (assumption.set) analyzer.analyze(assumption.set, inner);
      inner.set(assumption.name, { kind: "Formal", arity: assumption.arity });
      return;
    }
    if (assumption.kind === "AssumeProve") analyzeAssumeProve(assumption, inner, analyzer);
    else analyzer.analyze(assumption, inner);
  });
  analyzer.analyze(assumeProve.conclusion, inner);
};

// SANY checks the level of every definition, assumption, and theorem of a module.
export const checkModuleLevels = (module: Module, context: LevelContext) => {
  const analyzer = createLevelAnalyzer(context);
  module.definitions
    .filter((definition) => !definition.name.includes("!"))
    .forEach((definition) => analyzer.analyzeDefinition(definition, new Map()));
  module.assumptions.forEach((assumption) => analyzer.analyze(assumption.expression, new Map()));
  module.theorems.forEach((theorem) =>
    theorem.statement.kind === "AssumeProve"
      ? analyzeAssumeProve(theorem.statement, new Map(), analyzer)
      : analyzer.analyze(theorem.statement, new Map()),
  );
};
