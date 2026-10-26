import type {
  Assumption,
  Declaration,
  Definition,
  Expression,
  Instance,
  Module,
  OperatorParam,
  SourceLocation,
} from "./ast";
import { BUNDLED_MODULES } from "./bundled-modules";
import type { ConfigValue, ModelConfig } from "./config";
import type { FileSystem } from "./json";
import { TlaConfigError, TlaEvaluationError, TlaSyntaxError } from "./errors";
import { getChildren, isConstantLevel, type Builtin, type Environment } from "./evaluate";
import {
  createInstantiation,
  getEnabledVariableName,
  renameLocals,
  withLetInstances,
} from "./instances";
import { parseModule } from "./parser";
import { overrideDefinitions } from "./java-overrides";
import { KEY_SEPARATOR, resolveModule, resolveSubstitutions, type Symbols } from "./resolve";
import { createRuntime } from "./runtime";
import { CORE_OPERATORS, getStandardModule } from "./standard-modules";
import { resolveInstanceSubexpressions, resolveModuleSubexpressions } from "./subexpressions";
import {
  checkInteger,
  createModelValue,
  createSet,
  formatValue,
  valuesEqual,
  type Value,
} from "./values";

export interface EnvironmentOptions {
  loadModule: ((name: string) => string | undefined) | undefined;
  loadClass?: (name: string) => Uint8Array | undefined;
  print: (text: string) => void;
  files: FileSystem;
  seed?: bigint;
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
      return createModelValue(value.name);
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

const LOCAL_RESOLUTION = { kind: "Local" } as const;

const createLocalFunction = (definition: Definition, key: string): Definition => ({
  kind: "Operator",
  name: key,
  params: [],
  body: {
    kind: "Let",
    definitions: [definition],
    body: {
      kind: "Identifier",
      name: definition.name,
      location: definition.location,
      resolution: LOCAL_RESOLUTION,
    },
    location: definition.location,
  },
  isLocal: true,
  isRecursive: false,
  location: definition.location,
});

const createOperatorConstant = (name: string, rows: [Value[], Value][]): Builtin => ({
  kind: "Builtin",
  name,
  arity: rows[0][0].length,
  evaluate: (args) => {
    const row = rows.find((candidate) =>
      candidate[0].every((value, index) => {
        const argument = args[index];
        return (
          !(typeof argument === "object" && argument.kind === "Operator") &&
          valuesEqual(value, argument)
        );
      }),
    );
    if (row) return row[1];
    throw new TlaEvaluationError(
      `Attempted to apply operator:\n${name}\nto arguments (${args.map((argument) => (typeof argument === "object" && argument.kind === "Operator" ? argument.name : formatValue(argument))).join(", ")}), which is undefined.`,
    );
  },
  evaluateUnary: undefined,
  evaluateBinary: undefined,
});

const mentionsName = (expression: Expression, names: Set<string>): boolean =>
  (expression.kind === "Identifier" && names.has(expression.name)) ||
  (expression.kind === "Apply" && names.has(expression.operator)) ||
  getChildren(expression).some((child) => mentionsName(child, names));

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
  const runtime = createRuntime(config.checkDeadlock, options.seed);
  const linkedModules = new Map<string, LinkedModule>();
  const copyCount = { value: 0 };

  const addStandardModule = (name: string): Symbols | undefined => {
    const cached = standardExports.get(name);
    if (cached) return cached;
    const standardModule = getStandardModule(name, options.print, runtime, options.files);
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

  const nestedModules = new Map<string, Module>();
  const outerModules = new Map<string, Module>();
  const addNestedModules = (module: Module): Module => {
    module.modules.forEach((nested) => {
      if (nestedModules.has(nested.name)) return;
      outerModules.set(nested.name, module);
      nestedModules.set(nested.name, addNestedModules(nested));
    });
    return module;
  };
  addNestedModules(root);

  const loadModule = (name: string) => {
    const nested = nestedModules.get(name);
    if (nested) return nested;
    const source = options.loadModule?.(name) ?? BUNDLED_MODULES.get(name);
    if (source === undefined)
      throw new TlaSyntaxError(`Cannot find source file for module ${name}`);
    return addNestedModules(parseModule(source));
  };

  const getDefinitionKey = (module: Module, name: string) =>
    module === root ? name : `${name}${KEY_SEPARATOR}${module.name}`;

  const getOuterKey = (module: Module, name: string): string => {
    const outer = outerModules.get(module.name);
    if (!outer || !module.outer) return name;
    if (outer.definitions.some((definition) => definition.name === name)) {
      return getDefinitionKey(outer, name);
    }
    const isDeclared =
      outer.constants.some((constant) => constant.name === name) || outer.variables.includes(name);
    return isDeclared ? name : getOuterKey(outer, name);
  };

  const getLinkedModule = (name: string) => linkedModules.get(name) ?? linkModule(loadModule(name));

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
    const suffix = `#${copyCount.value++}`;
    const renamed = new Map(instance.params.map((param) => [param.name, `${param.name}${suffix}`]));
    const substitutions = resolveSubstitutions(
      resolveInstanceSubexpressions(instance, module),
      declarations,
      module,
      unit,
    );
    const instantiation = createInstantiation({
      params: instance.params.map((param) => ({ ...param, name: `${param.name}${suffix}` })),
      substitutions: new Map(
        [...substitutions].map(([name, expression]) => [name, renameLocals(expression, renamed)]),
      ),
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

  const getLocalArguments = (params: OperatorParam[], location: SourceLocation) =>
    params.map((param): Expression => ({
      kind: "Identifier",
      name: param.name,
      location,
      resolution: LOCAL_RESOLUTION,
    }));

  const createLocalAlias = (
    name: string,
    key: string,
    params: OperatorParam[],
    forwarded: OperatorParam[],
    location: SourceLocation,
  ): Definition => ({
    kind: "Operator",
    name,
    params,
    body:
      forwarded.length === 0
        ? { kind: "Identifier", name: key, location }
        : { kind: "Apply", operator: key, args: getLocalArguments(forwarded, location), location },
    isLocal: true,
    isRecursive: false,
    location,
  });

  const getArguments = (arity: number) =>
    Array.from({ length: arity }, (_, index) => ({ name: `argument${index}`, arity: 0 }));

  const getSubstitutionBody = (
    replacement: Expression,
    declaration: Declaration,
    location: SourceLocation,
  ): { params: OperatorParam[]; body: Expression } => {
    if (declaration.arity === 0) return { params: [], body: replacement };
    if (replacement.kind === "Lambda") {
      return {
        params: replacement.params.map((name) => ({ name, arity: 0 })),
        body: replacement.body,
      };
    }
    const params = getArguments(declaration.arity);
    const operator =
      replacement.kind === "Identifier"
        ? replacement.name
        : replacement.kind === "OperatorReference"
          ? replacement.operator
          : declaration.name;
    return {
      params,
      body: { kind: "Apply", operator, args: getLocalArguments(params, location), location },
    };
  };

  const instantiateLocally = (instance: Instance): Definition[] => {
    const location = instance.location;
    const instanceParams = instance.params;
    const standardSymbols = addStandardModule(instance.module);
    if (standardSymbols) {
      if (instance.name === undefined) return [];
      return [...standardSymbols].map(([name, symbol]) => {
        const forwarded = getArguments(symbol.arity);
        return createLocalAlias(
          `${instance.name}!${name}`,
          symbol.key,
          [...instanceParams, ...forwarded],
          forwarded,
          location,
        );
      });
    }
    const linked = getLinkedModule(instance.module);
    const suffix = `#${copyCount.value++}`;
    const explicit = new Map(instance.substitutions.map((item) => [item.name, item.expression]));
    const declarations = [
      ...linked.constants,
      ...linked.variables.map((variable) => ({ name: variable, arity: 0 })),
    ];
    const getReplacement = (declaration: Declaration): Expression =>
      explicit.get(declaration.name) ?? { kind: "Identifier", name: declaration.name, location };
    const instanceNames = new Set(instanceParams.map((param) => param.name));
    const isParameterDependent = (declaration: Declaration) =>
      mentionsName(getReplacement(declaration), instanceNames);
    const substitutionDefinitions = declarations.map((declaration): Definition => {
      const substitution = getSubstitutionBody(getReplacement(declaration), declaration, location);
      return {
        kind: "Operator",
        name: `${declaration.name}${suffix}`,
        params: [
          ...(isParameterDependent(declaration) ? instanceParams : []),
          ...substitution.params,
        ],
        body: substitution.body,
        isLocal: true,
        isRecursive: false,
        location,
      };
    });
    const copies: Definition[] = [];
    const instantiation = createInstantiation({
      params: instanceParams,
      substitutions: new Map(
        declarations.map((declaration): [string, Expression] => [
          declaration.name,
          !isParameterDependent(declaration)
            ? {
                kind: "Identifier",
                name: `${declaration.name}${suffix}`,
                location,
                resolution: LOCAL_RESOLUTION,
              }
            : {
                kind: "Apply",
                operator: `${declaration.name}${suffix}`,
                args: getLocalArguments(instanceParams, location),
                location,
                resolution: LOCAL_RESOLUTION,
              },
        ]),
      ),
      variables: new Set(linked.variables),
      getDefinition: (key) => definitions.get(key),
      isParameterized: (key) => parameterized.get(key) === true,
      addDefinition: (name, create) => {
        const key = `${name}${KEY_SEPARATOR}${instance.module}${suffix}.${copies.length}`;
        const definition = create(key);
        copies.push(
          definition.kind === "Operator"
            ? { ...definition, name: key }
            : createLocalFunction(definition, key),
        );
        return key;
      },
    });
    const declared = new Set(declarations.map((declaration) => declaration.name));
    const aliases = [...linked.exported]
      .filter(([name]) => !declared.has(name))
      .map(([name, symbol]) => {
        const key = instantiation.getKey(symbol.key);
        const own = getArguments(symbol.arity);
        const params = [...instanceParams, ...own];
        return createLocalAlias(
          instance.name === undefined ? name : `${instance.name}!${name}`,
          key,
          params,
          key === symbol.key ? own : params,
          location,
        );
      });
    return [...substitutionDefinitions, ...copies, ...aliases];
  };

  const getAvailableDefinitions = (visible: Symbols) =>
    [...visible].flatMap(([name, symbol]) => {
      const definition = definitions.get(symbol.key);
      return definition ? [{ ...definition, name }] : [];
    });

  const linkModule = (unlinked: Module): LinkedModule => {
    const parsed = overrideDefinitions(unlinked, options.loadClass?.(unlinked.name));
    const visible: Symbols = new Map(
      CORE_OPERATORS.map((operator) => [
        operator.name,
        { key: operator.name, arity: operator.arity },
      ]),
    );
    const exported: Symbols = new Map();
    const constants = [...parsed.constants];
    const variables = [...parsed.variables];
    const addSymbols = (symbols: Symbols, isExported: boolean) =>
      symbols.forEach((symbol, name) => {
        visible.set(name, symbol);
        if (isExported) exported.set(name, symbol);
      });
    parsed.outer?.extends.forEach((name) =>
      addSymbols(addStandardModule(name) ?? getLinkedModule(name).exported, false),
    );
    parsed.outer?.symbols.forEach((symbol) =>
      visible.set(symbol.name, { key: getOuterKey(parsed, symbol.name), arity: symbol.arity }),
    );
    parsed.extends.forEach((name) => {
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
    parsed.constants.forEach((constant) =>
      exported.set(constant.name, { key: constant.name, arity: constant.arity }),
    );
    parsed.variables.forEach((variable) => exported.set(variable, { key: variable, arity: 0 }));
    const isParameterFree = constants.length === 0 && variables.length === 0;
    const getKey = (definition: Definition) => getDefinitionKey(parsed, definition.name);
    const getUnit = (module: Module) => ({
      imported: visible,
      definitions: new Map(module.definitions.map((definition) => [definition.name, definition])),
      getKey,
    });
    parsed.instances.forEach((instance) =>
      addSymbols(
        instantiate(instance, parsed, getUnit(parsed), isParameterFree),
        !instance.isLocal,
      ),
    );
    const module = resolveModuleSubexpressions(
      withLetInstances(parsed, instantiateLocally),
      getAvailableDefinitions(visible),
    );
    resolveModule(module, getUnit(module));
    module.definitions.forEach((definition) => {
      const key = getKey(definition);
      definitions.set(key, definition);
      parameterized.set(key, !isParameterFree);
      const symbol = { key, arity: getArity(definition) };
      visible.set(definition.name, symbol);
      if (!definition.isLocal) exported.set(definition.name, symbol);
    });
    const linked = { module, constants, variables, visible, exported };
    linkedModules.set(parsed.name, linked);
    return linked;
  };

  const linkedRoot = linkModule(root);
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
  addAssumptions(linkedRoot.module, new Set());
  const declaredConstants = linkedRoot.constants.map((constant) => constant.name);
  const variables = linkedRoot.variables;

  const getScopedKeys = (item: { name: string; module?: string }): string[] => {
    if (item.module === undefined) return [item.name, getRootKey(item.name)];
    if (item.module === root.name || declaredConstants.includes(item.name)) return [];
    return [linkedModules.get(item.module)?.visible.get(item.name)?.key ?? item.name];
  };
  const constants = new Map<string, Value>();
  config.constants
    .filter((assignment) => assignment.args === undefined)
    .forEach((assignment) => {
      const value = toValue(assignment.value);
      getScopedKeys(assignment).forEach((key) => constants.set(key, value));
    });
  const operatorConstants = new Map<string, [Value[], Value][]>();
  config.constants.forEach((assignment) => {
    if (assignment.args === undefined) return;
    const rows = operatorConstants.get(assignment.name) ?? [];
    if (rows.length > 0 && rows[0][0].length !== assignment.args.length) {
      throw new TlaConfigError(
        `The operator ${assignment.name} is assigned values with inconsistent arities`,
      );
    }
    rows.push([assignment.args.map(toValue), toValue(assignment.value)]);
    operatorConstants.set(assignment.name, rows);
  });
  operatorConstants.forEach((rows, name) => {
    builtins.set(name, createOperatorConstant(name, rows));
    constants.delete(name);
  });
  const substitutions = new Map(
    config.substitutions.flatMap((substitution) =>
      getScopedKeys(substitution).map((key): [string, string] => [
        key,
        getRootKey(substitution.target),
      ]),
    ),
  );
  declaredConstants.forEach((name) => {
    if (!constants.has(name) && !substitutions.has(name) && !operatorConstants.has(name)) {
      throw new TlaConfigError(`The constant ${name} is not assigned a value by the configuration`);
    }
  });

  const environment: Environment = {
    runtime,
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
