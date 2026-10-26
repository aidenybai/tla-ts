import type { Assumption, Declaration, Definition, Instance, Module } from "./ast";
import type { ConfigValue, ModelConfig } from "./config";
import { TlaConfigError, TlaUnsupportedError } from "./errors";
import { isConstantLevel, type Builtin, type Environment } from "./evaluate";
import { createInstantiation, getEnabledVariableName } from "./instances";
import { parseModule } from "./parser";
import { resolveModule, resolveSubstitutions, type Symbols } from "./resolve";
import { CORE_OPERATORS, getStandardModule } from "./standard-modules";
import { checkInteger, createSet, type Value } from "./values";

export interface EnvironmentOptions {
  loadModule: ((name: string) => string | undefined) | undefined;
  print: (text: string) => void;
}

export interface Specification {
  environment: Environment;
  assumptions: Assumption[];
}

const toValue = (value: ConfigValue): Value => {
  switch (value.kind) {
    case "Number":
      return checkInteger(value.value);
    case "String":
    case "Boolean":
      return value.value;
    case "ModelValue":
      return { kind: "ModelValue", name: value.name };
    case "Set":
      return createSet(value.elements.map(toValue));
  }
};

interface LinkedModule {
  module: Module;
  constants: Declaration[];
  variables: string[];
  visible: Symbols;
  exported: Symbols;
}

const getArity = (definition: Definition) =>
  definition.kind === "Operator" ? definition.params.length : 0;

const getVariableIndex = (variables: string[], declared: string[]) => {
  const index = new Map(variables.map((name, position) => [name, position]));
  new Set(declared).forEach((name) =>
    index.set(getEnabledVariableName(name), index.get(name) ?? index.size),
  );
  return index;
};

export const createEnvironment = (
  root: Module,
  config: ModelConfig,
  options: EnvironmentOptions,
): Specification => {
  const definitions = new Map<string, Definition>();
  const parameterized = new Map<string, boolean>();
  const builtins = new Map<string, Builtin>(
    CORE_OPERATORS.map((operator) => [operator.name, operator]),
  );
  const standardExports = new Map<string, Symbols>();
  const linkedModules = new Map<string, LinkedModule>();
  const copyCount = { value: 0 };

  const addStandardModule = (name: string): Symbols | undefined => {
    const cached = standardExports.get(name);
    if (cached) return cached;
    const standardModule = getStandardModule(name, options.print);
    if (!standardModule) return undefined;
    const exported: Symbols = new Map();
    standardModule.extends.forEach((extended) =>
      addStandardModule(extended)?.forEach((symbol, symbolName) =>
        exported.set(symbolName, symbol),
      ),
    );
    standardModule.operators.forEach((operator) => {
      builtins.set(operator.name, operator);
      exported.set(operator.name, { key: operator.name, arity: operator.arity });
    });
    standardExports.set(name, exported);
    return exported;
  };

  const loadModule = (name: string) => {
    const source = options.loadModule?.(name);
    if (source === undefined) throw new TlaUnsupportedError(`Module ${name} is not available`);
    return parseModule(source);
  };

  const getLinkedModule = (name: string) =>
    linkedModules.get(name) ?? linkModule(loadModule(name), false);

  const instantiate = (
    instance: Instance,
    module: Module,
    unit: {
      imported: Symbols;
      definitions: Map<string, Definition>;
      getKey: (definition: Definition) => string;
    },
    isParameterFree: boolean,
  ): Symbols => {
    const standardSymbols = addStandardModule(instance.module);
    if (standardSymbols) {
      if (instance.name === undefined) return standardSymbols;
      return new Map(
        [...standardSymbols].map(([name, symbol]) => [`${instance.name}!${name}`, symbol]),
      );
    }
    const linked = getLinkedModule(instance.module);
    const declarations = [
      ...linked.constants,
      ...linked.variables.map((variable) => ({ name: variable, arity: 0 })),
    ];
    const instantiation = createInstantiation({
      params: instance.params,
      substitutions: resolveSubstitutions(instance, declarations, module, unit),
      variables: new Set(linked.variables),
      getDefinition: (key) => definitions.get(key),
      isParameterized: (key) => parameterized.get(key) === true,
      addDefinition: (name, create) => {
        const key = `${name}@${module.name}#${copyCount.value++}`;
        definitions.set(key, create(key));
        parameterized.set(key, !isParameterFree);
        return key;
      },
    });
    const declared = new Set(declarations.map((declaration) => declaration.name));
    const symbols: Symbols = new Map();
    linked.exported.forEach((symbol, name) => {
      if (declared.has(name)) return;
      if (instance.name === undefined) {
        symbols.set(name, { key: instantiation.getKey(symbol.key), arity: symbol.arity });
        return;
      }
      symbols.set(`${instance.name}!${name}`, {
        key: instantiation.getQualifiedKey(symbol.key),
        arity: symbol.arity + instance.params.length,
      });
    });
    return symbols;
  };

  const linkModule = (module: Module, isRoot: boolean): LinkedModule => {
    const visible: Symbols = new Map(
      CORE_OPERATORS.map((operator) => [
        operator.name,
        { key: operator.name, arity: operator.arity },
      ]),
    );
    const exported: Symbols = new Map();
    const constants = [...module.constants];
    const variables = [...module.variables];
    const addSymbols = (symbols: Symbols, isExported: boolean) =>
      symbols.forEach((symbol, name) => {
        visible.set(name, symbol);
        if (isExported) exported.set(name, symbol);
      });
    module.extends.forEach((name) => {
      const standardSymbols = addStandardModule(name);
      if (standardSymbols) {
        addSymbols(standardSymbols, true);
        return;
      }
      const linked = getLinkedModule(name);
      constants.push(
        ...linked.constants.filter((constant) =>
          constants.every((existing) => existing.name !== constant.name),
        ),
      );
      variables.push(...linked.variables.filter((variable) => !variables.includes(variable)));
      addSymbols(linked.exported, true);
    });
    module.constants.forEach((constant) =>
      exported.set(constant.name, { key: constant.name, arity: constant.arity }),
    );
    module.variables.forEach((variable) => exported.set(variable, { key: variable, arity: 0 }));
    const isParameterFree = constants.length === 0 && variables.length === 0;
    const getKey = (definition: Definition) =>
      isRoot ? definition.name : `${definition.name}@${module.name}`;
    const unit = {
      imported: visible,
      definitions: new Map(module.definitions.map((definition) => [definition.name, definition])),
      getKey,
    };
    module.instances.forEach((instance) =>
      addSymbols(instantiate(instance, module, unit, isParameterFree), !instance.isLocal),
    );
    resolveModule(module, unit);
    module.definitions.forEach((definition) => {
      const key = getKey(definition);
      definitions.set(key, definition);
      parameterized.set(key, !isParameterFree);
      const symbol = { key, arity: getArity(definition) };
      visible.set(definition.name, symbol);
      if (!definition.isLocal) exported.set(definition.name, symbol);
    });
    const linked = { module, constants, variables, visible, exported };
    linkedModules.set(module.name, linked);
    return linked;
  };

  const linkedRoot = linkModule(root, true);
  const getRootKey = (name: string) => linkedRoot.visible.get(name)?.key ?? name;
  linkedRoot.visible.forEach((symbol, name) => {
    const definition = definitions.get(symbol.key);
    if (definition && symbol.key !== name) definitions.set(name, definition);
  });

  const assumptions: Assumption[] = [];
  const addAssumptions = (module: Module, visited: Set<string>) => {
    if (visited.has(module.name)) return;
    visited.add(module.name);
    module.extends.forEach((name) => {
      const linked = linkedModules.get(name);
      if (linked) addAssumptions(linked.module, visited);
    });
    assumptions.push(...module.assumptions);
  };
  addAssumptions(root, new Set());
  const declaredConstants = linkedRoot.constants.map((constant) => constant.name);
  const variables = linkedRoot.variables;

  const constants = new Map<string, Value>();
  config.constants.forEach((assignment) => {
    const value = toValue(assignment.value);
    constants.set(assignment.name, value);
    constants.set(getRootKey(assignment.name), value);
  });
  const substitutions = new Map(
    config.substitutions.flatMap((substitution): [string, string][] => [
      [substitution.name, getRootKey(substitution.target)],
      [getRootKey(substitution.name), getRootKey(substitution.target)],
    ]),
  );
  declaredConstants.forEach((name) => {
    if (!constants.has(name) && !substitutions.has(name)) {
      throw new TlaConfigError(`The constant ${name} is not assigned a value by the configuration`);
    }
  });

  const environment: Environment = {
    definitions,
    builtins,
    constants,
    substitutions,
    variables,
    variableIndex: getVariableIndex(
      variables,
      [...linkedModules.values()].flatMap((linked) => linked.module.variables),
    ),
    definitionValues: new Map(),
    constantLevels: new Map(),
    evaluators: new WeakMap(),
  };
  substitutions.forEach((target, name) => {
    const definition = definitions.get(target);
    if (
      declaredConstants.includes(name) &&
      definition &&
      !isConstantLevel(definition, environment)
    ) {
      throw new TlaConfigError(
        `The configuration file substitutes constant ${name} with non-constant ${target}`,
      );
    }
  });
  return { environment, assumptions };
};
