import type { Assumption, Definition, Instance, Module } from "./ast";
import type { ConfigValue, ModelConfig } from "./config";
import { TlaConfigError, TlaUnsupportedError } from "./errors";
import { isConstantLevel, type Builtin, type Environment } from "./evaluate";
import { instantiateModule, withLetInstances, type FlatModule } from "./instances";
import { parseModule } from "./parser";
import { resolveModule, type Symbols } from "./resolve";
import { resolveInstanceSubexpressions, resolveModuleSubexpressions } from "./subexpressions";
import { CORE_OPERATORS, getStandardModule, REALS_SOURCE } from "./standard-modules";
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

export const createEnvironment = (
  root: Module,
  config: ModelConfig,
  options: EnvironmentOptions,
): Specification => {
  const definitions = new Map<string, Definition>();
  const builtins = new Map<string, Builtin>(
    CORE_OPERATORS.map((operator) => [operator.name, operator]),
  );
  const declaredConstants: string[] = [];
  const variables: string[] = [];
  const assumptions: Assumption[] = [];
  const moduleExports = new Map<string, Symbols>();

  const addStandardModule = (name: string) => {
    const standardModule = getStandardModule(name, options.print);
    if (!standardModule) return undefined;
    const exported: Symbols = new Map();
    standardModule.extends.forEach((extended) =>
      addStandardModule(extended)?.forEach((arity, symbol) => exported.set(symbol, arity)),
    );
    standardModule.operators.forEach((operator) => {
      builtins.set(operator.name, operator);
      exported.set(operator.name, operator.arity);
    });
    moduleExports.set(name, exported);
    return exported;
  };

  const nestedModules = new Map<string, Module>();
  const addNestedModules = (module: Module): Module => {
    module.modules.forEach((nested) => {
      if (!nestedModules.has(nested.name)) nestedModules.set(nested.name, addNestedModules(nested));
    });
    return module;
  };
  addNestedModules(root);

  const loadModule = (name: string) => {
    const nested = nestedModules.get(name);
    if (nested) return nested;
    const source = name === "Reals" ? REALS_SOURCE : options.loadModule?.(name);
    if (source === undefined) throw new TlaUnsupportedError(`Module ${name} is not available`);
    return addNestedModules(parseModule(source));
  };

  const flatModules = new Map<string, FlatModule & { symbols: Symbols }>();

  const getArity = (definition: Definition) =>
    definition.kind === "Operator" ? definition.params.length : 0;

  const instantiate = (instance: Instance): { definitions: Definition[]; symbols: Symbols } => {
    const standardSymbols = addStandardModule(instance.module);
    if (standardSymbols) {
      if (instance.name === undefined) return { definitions: [], symbols: standardSymbols };
      const symbols: Symbols = new Map();
      standardSymbols.forEach((arity, symbol) => {
        const builtin = builtins.get(symbol);
        if (!builtin) return;
        const alias = `${instance.name}!${symbol}`;
        builtins.set(alias, { ...builtin, name: alias });
        symbols.set(alias, arity);
      });
      return { definitions: [], symbols };
    }
    const instantiated = instantiateModule(instance, getFlatModule(instance.module));
    return {
      definitions: instantiated,
      symbols: new Map(
        instantiated.map((definition): [string, number] => [definition.name, getArity(definition)]),
      ),
    };
  };

  const addOuterSymbols = (module: Module, imported: Symbols) => {
    module.outer?.extends.forEach((extended) =>
      (addStandardModule(extended) ?? getFlatModule(extended).symbols).forEach((arity, symbol) =>
        imported.set(symbol, arity),
      ),
    );
    module.outer?.symbols.forEach((symbol) => imported.set(symbol.name, symbol.arity));
  };

  const getFlatModule = (name: string): FlatModule & { symbols: Symbols } => {
    const cached = flatModules.get(name);
    if (cached) return cached;
    const loaded = withLetInstances(loadModule(name), getFlatModule);
    const imported: Symbols = new Map(
      CORE_OPERATORS.map((operator) => [operator.name, operator.arity]),
    );
    addOuterSymbols(loaded, imported);
    const flat = {
      name,
      constants: [...loaded.constants],
      variables: [...loaded.variables],
      definitions: [] as Definition[],
      symbols: new Map() as Symbols,
    };
    loaded.extends.forEach((extended) => {
      const standardSymbols = addStandardModule(extended);
      if (standardSymbols) {
        standardSymbols.forEach((arity, symbol) => imported.set(symbol, arity));
        return;
      }
      const inner = getFlatModule(extended);
      flat.constants.push(...inner.constants);
      flat.variables.push(...inner.variables);
      flat.definitions.push(...inner.definitions.filter((definition) => !definition.isLocal));
      inner.symbols.forEach((arity, symbol) => imported.set(symbol, arity));
    });
    loaded.instances.forEach((instance) => {
      const instantiated = instantiate(resolveInstanceSubexpressions(instance, loaded));
      flat.definitions.push(...instantiated.definitions);
      instantiated.symbols.forEach((arity, symbol) => imported.set(symbol, arity));
    });
    const module = resolveModuleSubexpressions(loaded, flat.definitions);
    flat.symbols = resolveModule(module, imported);
    flat.definitions.push(...module.definitions);
    flatModules.set(name, flat);
    return flat;
  };

  const addModule = (parsed: Module, isRoot: boolean): Symbols => {
    const loaded = withLetInstances(parsed, getFlatModule);
    moduleExports.set(loaded.name, new Map());
    const imported: Symbols = new Map(
      CORE_OPERATORS.map((operator) => [operator.name, operator.arity]),
    );
    addOuterSymbols(loaded, imported);
    loaded.extends.forEach((name) =>
      (
        moduleExports.get(name) ??
        addStandardModule(name) ??
        addModule(loadModule(name), false)
      ).forEach((arity, symbol) => imported.set(symbol, arity)),
    );
    const instantiated = loaded.instances.map((instance) =>
      instantiate(resolveInstanceSubexpressions(instance, loaded)),
    );
    instantiated.forEach((item) =>
      item.symbols.forEach((arity, symbol) => imported.set(symbol, arity)),
    );
    const module = resolveModuleSubexpressions(loaded, [
      ...definitions.values(),
      ...instantiated.flatMap((item) => item.definitions),
    ]);
    const exported = resolveModule(module, imported);
    instantiated
      .flatMap((item) => item.definitions)
      .filter((definition) => isRoot || !definition.isLocal)
      .forEach((definition) => {
        definitions.set(definition.name, definition);
        if (!definition.isLocal) exported.set(definition.name, getArity(definition));
      });
    module.definitions
      .filter((definition) => isRoot || !definition.isLocal)
      .forEach((definition) => definitions.set(definition.name, definition));
    declaredConstants.push(...module.constants.map((constant) => constant.name));
    variables.push(...module.variables);
    assumptions.push(...module.assumptions);
    moduleExports.set(module.name, exported);
    return exported;
  };

  addModule(root, true);

  const constants = new Map<string, Value>();
  const isOverride = (item: { name: string; module?: string }) =>
    item.module === undefined ||
    (item.module !== root.name && !declaredConstants.includes(item.name));
  config.constants
    .filter(isOverride)
    .forEach((assignment) => constants.set(assignment.name, toValue(assignment.value)));
  const substitutions = new Map(
    config.substitutions
      .filter(isOverride)
      .map((substitution) => [substitution.name, substitution.target]),
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
    variableIndex: new Map(variables.map((name, index) => [name, index])),
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
