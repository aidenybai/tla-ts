import type { Declaration, Definition, Expression, SourceLocation, Theorem } from "./ast";
import { createSanyError, formatRange, type SanyError } from "./errors";
import {
  ACTION_LEVEL,
  analyzeAssumeProve,
  createLevelAnalyzer,
  getArgumentKey,
  parseArgumentParamKey,
  putArgConstraint,
  putConstraint,
  TEMPORAL_LEVEL,
  type InstanceLevels,
  type InstanceSubstitutes,
  type OperatorLevels,
  type Scope,
} from "./levels";

export interface InstanceCheck {
  module: string;
  instancer: string;
  lets: Definition[];
  substitutions: Map<string, Expression>;
  location: SourceLocation;
  substitutes?: InstanceSubstitutes;
}

export interface KeyedDeclaration extends Declaration {
  key: string;
}

interface ModuleContext {
  constants: KeyedDeclaration[];
  variables: string[];
  definitions: Definition[];
  assumptions: Expression[];
  theorems: Theorem[];
  getDefinition: (name: string) => Definition | undefined;
}

interface ModuleLevels {
  isConstant: boolean;
  constraints: Map<string, number>;
  argConstraints: Map<string, number>;
  argParams: Set<string>;
}

interface ModuleAnalyzer {
  constants: Set<string>;
  variables: Set<string>;
  analyzer: ReturnType<typeof createLevelAnalyzer>;
}

interface Substituted {
  name: string;
  key: string;
  maximumLevel: number;
  arity: number;
  level: number;
  isCorrect: boolean;
  operator: OperatorLevels | undefined;
  isLeibniz: boolean;
}

const getMaxLevel = (operator: OperatorLevels, index: number) =>
  operator.maxLevels[index] ?? TEMPORAL_LEVEL;

export const createInstanceChecker = (
  getModule: (name: string) => ModuleContext,
  copies: Omit<InstanceLevels, "getInstanced">,
) => {
  const analyzers = new Map<string, ModuleAnalyzer>();
  const getModuleAnalyzer = (name: string) => {
    const cached = analyzers.get(name);
    if (cached) return cached;
    const module = getModule(name);
    const constants = new Set(module.constants.map((constant) => constant.key));
    const variables = new Set(module.variables);
    const analyzer: ModuleAnalyzer = {
      constants,
      variables,
      analyzer: createLevelAnalyzer({
        constants,
        variables,
        getDefinition: module.getDefinition,
        instances,
      }),
    };
    analyzers.set(name, analyzer);
    return analyzer;
  };
  const getAnalyzer = (name: string) => getModuleAnalyzer(name).analyzer;

  const instances: InstanceLevels = {
    ...copies,
    getInstanced: (copy) => {
      const module = getModuleAnalyzer(copy.module);
      return {
        source: module.analyzer.analyzeDefinition(copy.source, new Map()),
        constants: module.constants,
        variables: module.variables,
        isConstant: getModuleLevels(copy.module).isConstant,
      };
    },
  };

  const moduleLevels = new Map<string, ModuleLevels>();
  const getModuleLevels = (name: string) => {
    const cached = moduleLevels.get(name);
    if (cached) return cached;
    const module = getModule(name);
    const analyzer = getAnalyzer(name);
    const definitions = module.definitions.map((definition) =>
      analyzer.analyzeDefinition(definition, new Map()),
    );
    const levels: ModuleLevels = {
      isConstant:
        module.variables.length === 0 && definitions.every((definition) => definition.level === 0),
      constraints: new Map(),
      argConstraints: new Map(),
      argParams: new Set(),
    };
    if (!levels.isConstant) {
      module.constants.forEach((constant) => putConstraint(levels.constraints, constant.key, 0));
    }
    const addLevels = (
      data: Omit<ModuleLevels, "isConstant">,
      isKept: (operator: string, param: string) => boolean,
    ) => {
      data.constraints.forEach((value, key) => putConstraint(levels.constraints, key, value));
      data.argConstraints.forEach((value, key) =>
        putArgConstraint(levels.argConstraints, key, value),
      );
      data.argParams.forEach((key) => {
        const parameter = parseArgumentParamKey(key);
        if (isKept(parameter.operator, parameter.param)) levels.argParams.add(key);
      });
    };
    definitions.forEach((definition) =>
      addLevels(definition, (operator, param) =>
        definition.formals.every((formal) => formal.name !== operator && formal.name !== param),
      ),
    );
    const addAssumedLevels = (data: ReturnType<typeof analyzeAssumeProve>) => {
      addLevels(data, () => true);
      module.constants.forEach((constant) => {
        if (data.params.has(constant.key)) {
          putConstraint(levels.constraints, constant.key, ACTION_LEVEL);
        }
      });
    };
    module.assumptions.forEach((assumption) =>
      addAssumedLevels(analyzer.analyze(assumption, new Map())),
    );
    module.theorems.forEach((theorem) =>
      theorem.statement.kind === "AssumeProve"
        ? addAssumedLevels(analyzeAssumeProve(theorem.statement, new Map(), analyzer))
        : addLevels(analyzer.analyze(theorem.statement, new Map()), () => true),
    );
    moduleLevels.set(name, levels);
    return levels;
  };

  const checkInstance = (check: InstanceCheck) => {
    const errors = new Map<string, SanyError>();
    const location = formatRange(
      check.location.range ?? {
        module: check.instancer,
        start: check.location,
        end: check.location,
      },
    );
    const addMessage = (message: string) =>
      errors.set(`${location}\n${message}`, { location, message });
    const instancee = getModule(check.module);
    const levels = getModuleLevels(check.module);
    const analyzer = getAnalyzer(check.instancer);
    const scope: Scope = new Map();
    check.lets.forEach((definition) =>
      scope.set(definition.name, { kind: "Let", definition, scope }),
    );
    const declarations = [
      ...instancee.constants.map((constant) => ({ ...constant, maximumLevel: 0 })),
      ...instancee.variables.map((variable) => ({
        name: variable,
        key: variable,
        arity: 0,
        maximumLevel: 1,
      })),
    ];
    const substituted = declarations.flatMap((declaration): Substituted[] => {
      const expression = check.substitutions.get(declaration.name);
      if (!expression) return [];
      if (declaration.arity === 0) {
        const data = analyzer.analyze(expression, scope);
        return [
          {
            ...declaration,
            level: data.level,
            isCorrect: data.isCorrect,
            operator: undefined,
            isLeibniz: true,
          },
        ];
      }
      const operand = analyzer.toOperand(expression, scope);
      const operator = operand.kind === "Operator" ? operand.data : undefined;
      return [
        {
          ...declaration,
          level: operand.data.level,
          isCorrect: operand.data.isCorrect,
          operator,
          isLeibniz: operator === undefined || operator.nonLeibniz.size === 0,
        },
      ];
    });
    const getLevelMessage = (name: string, level: number) =>
      `Level error in instantiating module '${check.module}':\nThe level of the expression or operator substituted for '${name}' \nmust be at most ${level}.`;
    // SANY reports a level error of a substitute only when the substitute itself is level-correct.
    substituted.forEach((item) => {
      if (!levels.isConstant && item.level > item.maximumLevel && item.isCorrect) {
        addMessage(getLevelMessage(item.name, item.maximumLevel));
      }
      if (!item.isLeibniz) {
        addMessage(
          `Error in instantiating module '${check.module}':\n A non-Leibniz operator substituted for '${item.name}'.`,
        );
      }
    });
    substituted.forEach((item) => {
      const maximum = levels.constraints.get(item.key);
      if (maximum !== undefined && item.level > maximum && item.isCorrect)
        addMessage(getLevelMessage(item.name, maximum));
      const operator = item.operator;
      if (!operator?.isCorrect) return;
      for (let index = 0; index < item.arity; index++) {
        const minimum = levels.argConstraints.get(getArgumentKey(item.key, index));
        if (minimum !== undefined && getMaxLevel(operator, index) < minimum) {
          addMessage(
            `Level error in instantiating module '${check.module}':\nThe level of the argument ${index + 1} of the operator ${operator.name} \nmust be at least ${minimum}.`,
          );
        }
      }
    });
    levels.argParams.forEach((key) => {
      const parameter = parseArgumentParamKey(key);
      const substitute = substituted.find((item) => item.key === parameter.operator);
      const argument = substituted.find((item) => item.key === parameter.param);
      if (!substitute?.operator || !argument) return;
      const maximum = getMaxLevel(substitute.operator, parameter.index);
      if (argument.level > maximum && substitute.operator.isCorrect && argument.isCorrect) {
        addMessage(
          `Level error when instantiating module '${check.module}':\nThe level of the argument ${parameter.index} of the operator ${substitute.name}' \nmust be at most ${maximum}.`,
        );
      }
    });
    if (errors.size > 0) throw createSanyError([...errors.values()]);
  };

  return { checkInstance, instances };
};
