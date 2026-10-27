import type { Declaration, Definition, Expression, SourceLocation } from "./ast";
import { TlaSyntaxError } from "./errors";
import {
  createLevelAnalyzer,
  getArgumentKey,
  MAX_LEVEL,
  parseArgumentParamKey,
  putArgConstraint,
  putConstraint,
  type OperatorLevels,
  type Scope,
} from "./levels";

export interface InstanceCheck {
  module: string;
  instancer: string;
  lets: Definition[];
  substitutions: Map<string, Expression>;
  location: SourceLocation;
}

interface ModuleContext {
  constants: Declaration[];
  variables: string[];
  definitions: Definition[];
  assumptions: Expression[];
  getDefinition: (name: string) => Definition | undefined;
}

interface ModuleLevels {
  isConstant: boolean;
  constraints: Map<string, number>;
  argConstraints: Map<string, number>;
  argParams: Set<string>;
}

interface Substituted {
  name: string;
  maximumLevel: number;
  arity: number;
  level: number;
  operator: OperatorLevels | undefined;
  isLeibniz: boolean;
}

const getMaxLevel = (operator: OperatorLevels, index: number) =>
  operator.maxLevels[index] ?? MAX_LEVEL;

export const checkInstances = (
  checks: InstanceCheck[],
  getModule: (name: string) => ModuleContext,
) => {
  const analyzers = new Map<string, ReturnType<typeof createLevelAnalyzer>>();
  const getAnalyzer = (name: string) => {
    const cached = analyzers.get(name);
    if (cached) return cached;
    const module = getModule(name);
    const analyzer = createLevelAnalyzer({
      constants: new Set(module.constants.map((constant) => constant.name)),
      variables: new Set(module.variables),
      getDefinition: module.getDefinition,
    });
    analyzers.set(name, analyzer);
    return analyzer;
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
      module.constants.forEach((constant) => putConstraint(levels.constraints, constant.name, 0));
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
    module.assumptions.forEach((assumption) =>
      addLevels(analyzer.analyze(assumption, new Map()), () => true),
    );
    moduleLevels.set(name, levels);
    return levels;
  };

  const messages = new Set<string>();
  checks.forEach((check) => {
    const location = `at line ${check.location.line}, column ${check.location.column}`;
    const addMessage = (message: string) => messages.add(`${message} ${location}`);
    const instancee = getModule(check.module);
    const levels = getModuleLevels(check.module);
    const analyzer = getAnalyzer(check.instancer);
    const scope: Scope = new Map();
    check.lets.forEach((definition) =>
      scope.set(definition.name, { kind: "Let", definition, scope }),
    );
    const declarations = [
      ...instancee.constants.map((constant) => ({ ...constant, maximumLevel: 0 })),
      ...instancee.variables.map((variable) => ({ name: variable, arity: 0, maximumLevel: 1 })),
    ];
    const substituted = declarations.flatMap((declaration): Substituted[] => {
      const expression = check.substitutions.get(declaration.name);
      if (!expression) return [];
      if (declaration.arity === 0) {
        const data = analyzer.analyze(expression, scope);
        return [{ ...declaration, level: data.level, operator: undefined, isLeibniz: true }];
      }
      const operand = analyzer.toOperand(expression, scope);
      return [
        {
          ...declaration,
          level: operand.data.level,
          operator: operand.operator,
          isLeibniz: operand.operator === undefined || operand.operator.nonLeibniz.size === 0,
        },
      ];
    });
    const getLevelMessage = (name: string, level: number) =>
      `Level error in instantiating module '${check.module}': the level of the expression or operator substituted for '${name}' must be at most ${level}`;
    substituted.forEach((item) => {
      if (!levels.isConstant && item.level > item.maximumLevel) {
        addMessage(getLevelMessage(item.name, item.maximumLevel));
      }
      if (!item.isLeibniz) {
        addMessage(
          `Error in instantiating module '${check.module}': a non-Leibniz operator substituted for '${item.name}'`,
        );
      }
    });
    substituted.forEach((item) => {
      const maximum = levels.constraints.get(item.name);
      if (maximum !== undefined && item.level > maximum)
        addMessage(getLevelMessage(item.name, maximum));
      const operator = item.operator;
      if (!operator) return;
      Array.from({ length: item.arity }, (_, index) => {
        const minimum = levels.argConstraints.get(getArgumentKey(item.name, index));
        if (minimum !== undefined && getMaxLevel(operator, index) < minimum) {
          addMessage(
            `Level error in instantiating module '${check.module}': the level of the argument ${index + 1} of the operator ${operator.name} must be at least ${minimum}`,
          );
        }
      });
    });
    levels.argParams.forEach((key) => {
      const parameter = parseArgumentParamKey(key);
      const operator = substituted.find((item) => item.name === parameter.operator)?.operator;
      const argument = substituted.find((item) => item.name === parameter.param);
      if (!operator || !argument) return;
      const maximum = getMaxLevel(operator, parameter.index);
      if (argument.level > maximum) {
        addMessage(
          `Level error when instantiating module '${check.module}': the level of the argument ${parameter.index} of the operator ${parameter.operator}' must be at most ${maximum}`,
        );
      }
    });
  });
  if (messages.size > 0) throw new TlaSyntaxError([...messages].join("\n"));
};
