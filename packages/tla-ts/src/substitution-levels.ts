import type {
  Declaration,
  Definition,
  Expression,
  Instance,
  SourceLocation,
  Theorem,
  UseOrHide,
} from "./ast";
import { formatRange, type SanyError } from "./errors";
import {
  analyzeAssumption,
  createLevelAnalyzer,
  createProofChecker,
  getArgumentKey,
  parseArgumentParamKey,
  putArgConstraint,
  putConstraint,
  TEMPORAL_LEVEL,
  type InstanceLevels,
  type LevelAnalyzer,
  type LevelData,
  type ModuleLevels,
  type OperatorLevels,
  type Scope,
  type SectionMember,
} from "./levels";

interface InstanceCheck {
  module: string;
  instancer: string;
  scope: Scope;
  substitutions: Map<string, Expression>;
  location: SourceLocation;
}

export interface KeyedDeclaration extends Declaration {
  key: string;
}

export interface EnclosingDeclarations {
  constants: Map<string, number>;
  variables: string[];
}

interface ModuleContext {
  constants: KeyedDeclaration[];
  variables: string[];
  enclosing: EnclosingDeclarations;
  getDefinitions: () => Definition[];
  assumptions: Expression[];
  theorems: Theorem[];
  instances: Instance[];
  uses: UseOrHide[];
  extended: string[];
  getDefinition: (name: string) => Definition | undefined;
  getQualifiedName: (name: string) => string | undefined;
}

interface TopLevel {
  theorems: LevelData[];
  nodes: LevelData[];
}

interface ModuleAnalyzer {
  constants: Map<string, number>;
  variables: Set<string>;
  analyzer: LevelAnalyzer;
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
  copies: Omit<InstanceLevels, "getInstanced" | "getOriginal" | "getModuleLevels">,
  recursiveSections: WeakMap<Definition, SectionMember[]>,
) => {
  const analyzers = new Map<string, ModuleAnalyzer>();
  const getModuleAnalyzer = (name: string) => {
    const cached = analyzers.get(name);
    if (cached) return cached;
    const module = getModule(name);
    const constants = new Map([
      ...module.enclosing.constants,
      ...module.constants.map((constant): [string, number] => [constant.key, constant.arity]),
    ]);
    const variables = new Set([...module.enclosing.variables, ...module.variables]);
    const analyzer: ModuleAnalyzer = {
      constants,
      variables,
      analyzer: createLevelAnalyzer({
        module: name,
        constants,
        variables,
        getDefinition: module.getDefinition,
        getQualifiedName: module.getQualifiedName,
        instances,
        recursiveSections,
      }),
    };
    analyzers.set(name, analyzer);
    return analyzer;
  };
  const getAnalyzer = (name: string) => getModuleAnalyzer(name).analyzer;

  const getTopLevel = (name: string): TopLevel => {
    const module = getModule(name);
    const analyzer = getAnalyzer(name);
    const proofs = createProofChecker(analyzer, instances, name);
    const extended = module.extended.map(getTopLevel);
    return {
      theorems: [
        ...extended.flatMap((other) => other.theorems),
        ...module.theorems.map(proofs.analyzeTheorem),
      ],
      nodes: [
        ...extended.flatMap((other) => other.nodes),
        ...module.assumptions.map((assumption) => analyzeAssumption(assumption, analyzer)),
        ...module.instances.flatMap((instance) => {
          const substitutes = instances.getSubstitutes(instance);
          return substitutes
            ? [analyzer.analyzeInstance(substitutes, getModuleLevels(instance.module), new Map())]
            : [];
        }),
        ...module.uses.map((use) => proofs.getFactData(use.facts, new Map())),
      ],
    };
  };

  const moduleLevels = new Map<string, ModuleLevels>();
  const getModuleLevels = (name: string) => {
    const cached = moduleLevels.get(name);
    if (cached) return cached;
    const module = getModule(name);
    const moduleAnalyzer = getModuleAnalyzer(name);
    const analyzer = moduleAnalyzer.analyzer;
    const definitions = module
      .getDefinitions()
      .map((definition) => analyzer.analyzeDefinition(definition, new Map()));
    const topLevel = getTopLevel(name);
    const levels: ModuleLevels = {
      isConstant:
        module.variables.length === 0 &&
        [...definitions, ...topLevel.theorems].every((data) => data.level === 0),
      constants: moduleAnalyzer.constants,
      variables: moduleAnalyzer.variables,
      constraints: new Map(),
      argConstraints: new Map(),
      argParams: new Set(),
    };
    if (!levels.isConstant) {
      module.constants.forEach((constant) => putConstraint(levels.constraints, constant.key, 0));
    }
    const addLevels = (
      data: Pick<ModuleLevels, "constraints" | "argConstraints" | "argParams">,
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
    [...topLevel.theorems, ...topLevel.nodes].forEach((data) => addLevels(data, () => true));
    moduleLevels.set(name, levels);
    return levels;
  };

  const instances: InstanceLevels = {
    ...copies,
    getInstanced: (copy) => ({
      ...getModuleLevels(copy.module),
      source: getAnalyzer(copy.module).analyzeDefinition(copy.source, new Map()),
    }),
    getOriginal: (copy, target) => getAnalyzer(copy.module).analyzeOriginal(copy.source, target),
    getModuleLevels,
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
    const declarations = [
      ...instancee.constants.map((constant) => ({ ...constant, maximumLevel: 0 })),
      ...instancee.variables.map((variable) => ({
        name: variable,
        key: variable,
        arity: 0,
        maximumLevel: 1,
      })),
    ];
    const substituted = [...check.substitutions].flatMap((entry): Substituted[] => {
      const declaration = declarations.find((item) => item.name === entry[0]);
      if (!declaration) return [];
      const expression = entry[1];
      if (declaration.arity === 0) {
        const data = analyzer.analyze(expression, check.scope);
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
      const operand = analyzer.toOperand(expression, check.scope);
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
    return [...errors.values()];
  };

  return {
    checkInstance,
    instances,
    getArgParams: (name: string) => getModuleLevels(name).argParams,
  };
};
