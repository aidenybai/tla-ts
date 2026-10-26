import type { Assumption, Definition, Module } from "./ast";
import type { ConfigValue, ModelConfig } from "./config";
import { TlaConfigError, TlaUnsupportedError } from "./errors";
import { isConstantLevel, type Builtin, type Environment } from "./evaluate";
import { parseModule } from "./parser";
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
  const visited = new Set<string>();

  const addStandardModule = (name: string) => {
    if (visited.has(name)) return true;
    const standardModule = getStandardModule(name, options.print);
    if (!standardModule) return false;
    visited.add(name);
    standardModule.extends.forEach(addStandardModule);
    standardModule.operators.forEach((operator) => builtins.set(operator.name, operator));
    return true;
  };

  const addModule = (module: Module, isRoot: boolean) => {
    visited.add(module.name);
    module.extends.forEach((name) => {
      if (visited.has(name) || addStandardModule(name)) return;
      const source = options.loadModule?.(name);
      if (source === undefined) throw new TlaUnsupportedError(`Module ${name} is not available`);
      addModule(parseModule(source), false);
    });
    module.definitions
      .filter((definition) => isRoot || !definition.isLocal)
      .forEach((definition) => definitions.set(definition.name, definition));
    declaredConstants.push(...module.constants.map((constant) => constant.name));
    variables.push(...module.variables);
    assumptions.push(...module.assumptions);
  };

  addModule(root, true);

  const constants = new Map<string, Value>();
  config.constants.forEach((assignment) => {
    if (!declaredConstants.includes(assignment.name) && !definitions.has(assignment.name)) {
      throw new TlaConfigError(
        `The configuration assigns ${assignment.name}, which is not declared in the spec`,
      );
    }
    constants.set(assignment.name, toValue(assignment.value));
  });
  const substitutions = new Map(
    config.substitutions.map((substitution) => [substitution.name, substitution.target]),
  );
  declaredConstants.forEach((name) => {
    if (!constants.has(name) && !substitutions.has(name)) {
      throw new TlaConfigError(`The constant ${name} is not assigned a value by the configuration`);
    }
  });

  const environment = {
    definitions,
    builtins,
    constants,
    substitutions,
    variables,
    variableIndex: new Map(variables.map((name, index) => [name, index])),
    definitionValues: new Map(),
    constantLevels: new Map(),
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
