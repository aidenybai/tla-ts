import type { Definition } from "./ast";
import type { ConfigValue, ConstantAssignment, ModelConfig } from "./config";
import {
  TlaConfigError,
  TlaEvaluationError,
  TlaFeatureUnsupportedError,
  TlaModuleError,
  UNEXPECTED_EXCEPTION,
} from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import type { LinkedModule } from "./environment";
import type { Builtin } from "./evaluate";
import { createLocalAlias } from "./instances";
import type { Symbols } from "./resolve";
import { getHashtableOrder, type TlcOrder } from "./tlc/order";
import {
  createEnumeratedSet,
  createModelValue,
  formatValue,
  isTlcInteger,
  markNormalized,
  toFiniteSet,
  valuesEqual,
  type Value,
} from "./values";

export interface CopySource {
  source: string;
  prefix: number;
}

interface ConfigName {
  name: string;
  module?: string;
}

interface ConfigTable extends ConfigName {
  rows: ConstantAssignment[];
}

interface LinkedSpecification {
  root: LinkedModule;
  rootKeys: Map<string, string>;
  moduleSymbols: Map<string, Symbols>;
  definitions: Map<string, Definition>;
  builtins: Map<string, Builtin>;
  copySources: Map<string, CopySource>;
  operatorConstants: Map<string, Value>;
  order: TlcOrder;
}

interface AppliedConfig {
  constants: Map<string, Value>;
  substitutions: Map<string, string>;
}

const toValue = (value: ConfigValue): Value => {
  switch (value.kind) {
    case "Number":
      // Deviation from TLC: ModelConfig#parseValue lets Integer.parseInt fail on a number too big, where tla-ts reports it as TLC reports such a number in a module.
      if (!isTlcInteger(value.value)) {
        throw setExitCode(
          new TlaModuleError(`TLC can't handle a number this big.\n${value.value}`),
          EXIT_STATUS.error,
        );
      }
      return value.value;
    case "String":
    case "Boolean":
      return value.value;
    case "ModelValue":
      return createModelValue(value.name);
    case "Set":
      return toFiniteSet({ kind: "MixedSet", elements: value.elements.map(toValue) });
  }
};

const toConstantValue = (value: ConfigValue) => {
  try {
    return toValue(value);
  } catch (error) {
    if (
      !(error instanceof TlaEvaluationError) ||
      error instanceof TlaModuleError ||
      error instanceof TlaFeatureUnsupportedError
    ) {
      throw error;
    }
    throw setExitCode(
      new TlaEvaluationError(`${UNEXPECTED_EXCEPTION}${error.message}`),
      EXIT_STATUS.error,
    );
  }
};

// TLC normalizes only the value of a constant, and keeps a definition's as written, like a set literal.
const toLiteralValue = (value: ConfigValue): Value =>
  value.kind === "Set" ? createEnumeratedSet(value.elements.map(toLiteralValue)) : toValue(value);

const createOperatorTable = (name: string, arity: number, rows: [Value[], Value][]): Builtin => {
  const getTable = () =>
    `{ ${rows.map((row) => `<${[...row[0], row[1]].map((value) => formatValue(value)).join(", ")}>`).join(", ")}}`;
  return {
    kind: "Builtin",
    name,
    arity,
    evaluate: (args) => {
      const row = rows.find((candidate) => {
        if (candidate[0].length !== args.length) {
          throw new TlaEvaluationError(
            `Attempted to apply the operator ${getTable()}\nwith wrong number of arguments.`,
          );
        }
        return candidate[0].every((value, index) => {
          const argument = args[index];
          return (
            !(typeof argument === "object" && argument.kind === "Operator") &&
            valuesEqual(value, argument)
          );
        });
      });
      if (row) return row[1];
      throw new TlaEvaluationError(
        `Attempted to apply operator:\n${getTable()}\nto arguments (${args.map((argument) => (typeof argument === "object" && argument.kind === "Operator" ? argument.name : formatValue(argument))).join(", ")}), which is undefined.`,
      );
    },
    evaluateUnary: undefined,
    evaluateBinary: undefined,
  };
};

const createReusedTargetError = (target: string) =>
  new TlaConfigError(
    `In the configuration file, the identifier ${target} appears\non the right-hand side of a <- after already appearing on the\nleft-hand side of one.`,
  );

const createArityError = (name: string, target: string) =>
  new TlaConfigError(
    `The configuration file substitutes for ${name} with ${target} of different number of arguments.`,
  );

const createMissingError = (name: string) =>
  new TlaConfigError(
    `In the configuration file, the identifier ${name} does not appear in the specification.`,
  );

// SANY finishes a module after the modules it extends, and SpecProcessor#processConstantDefns follows that order.
const getModuleOrder = (module: LinkedModule, visited: Set<LinkedModule>): LinkedModule[] => {
  if (visited.has(module)) return [];
  visited.add(module);
  return [...module.extended.flatMap((extended) => getModuleOrder(extended, visited)), module];
};

export const applyConfig = (config: ModelConfig, linked: LinkedSpecification): AppliedConfig => {
  const getRootKey = (name: string) => linked.rootKeys.get(name) ?? name;
  const declaredConstants = new Set(linked.root.constants.map((constant) => constant.name));
  const getScopedSymbol = (item: ConfigName) => {
    const symbol = linked.moduleSymbols.get(item.module ?? "")?.get(item.name);
    return symbol?.kind === "Definition" ? symbol : undefined;
  };
  const getSubstitutedKeys = (item: ConfigName) => {
    if (item.module === undefined) return [getRootKey(item.name)];
    const symbol = getScopedSymbol(item);
    return symbol ? [symbol.key] : [];
  };
  const isDefined = (name: string) => {
    const key = getRootKey(name);
    return linked.definitions.has(key) || linked.builtins.has(key) || declaredConstants.has(name);
  };
  // SpecProcessor#processConstants reads the value of a root name only for a constant or a definition.
  const getScopedKeys = (item: ConfigName) =>
    item.module === linked.root.module.name || (item.module === undefined && !isDefined(item.name))
      ? []
      : getSubstitutedKeys(item);
  const getKeyArity = (key: string) => {
    const definition = linked.definitions.get(key);
    return definition?.kind === "Operator"
      ? definition.params.length
      : (linked.root.constants.find((constant) => constant.key === key)?.arity ??
          linked.builtins.get(key)?.arity ??
          0);
  };
  const tables = new Map<string, ConfigTable>();
  const addRows = (isRoot: boolean) =>
    config.constants.forEach((assignment) => {
      if (assignment.args === undefined || (assignment.module === undefined) !== isRoot) return;
      const tableKey = `${assignment.module ?? ""}!${assignment.name}`;
      const table = tables.get(tableKey) ?? {
        name: assignment.name,
        module: assignment.module,
        rows: [],
      };
      if (table.rows.length > 0 && table.rows[0].args?.length !== assignment.args.length) {
        throw new TlaConfigError(
          `The arity of the operator ${assignment.name} is inconsistent in the configuration file.`,
        );
      }
      table.rows.push(assignment);
      tables.set(tableKey, table);
    });
  addRows(true);
  // SpecProcessor#processConstants looks for an unassigned constant after the root module's tables and before the other modules' tables and every <-.
  const assignedNames = new Set(
    [...config.constants, ...config.substitutions]
      .filter((item) => item.module === undefined)
      .map((item) => item.name),
  );
  const unassigned = linked.root.constants
    .filter(
      (constant) =>
        !linked.operatorConstants.has(constant.key) && !assignedNames.has(constant.name),
    )
    .map((constant) => constant.name);
  if (unassigned.length > 0) {
    const name =
      linked.order
        .getDeclarationOrder("constant")
        .find((constant) => unassigned.includes(constant)) ?? unassigned[0];
    throw new TlaConfigError(
      `The constant parameter ${name} is not assigned a value by the configuration file.`,
    );
  }
  addRows(false);
  // ModelConfig keeps the last <- of a name for each module.
  const lastSubstitutions = [
    ...new Map(
      config.substitutions.map((substitution) => [
        `${substitution.module ?? ""}!${substitution.name}`,
        substitution,
      ]),
    ).values(),
  ];
  // Defns holds the value of a definition the configuration assigns one, so TLC checks no arity against it.
  const getTargetArity = (target: string) => {
    const definition = linked.definitions.get(getRootKey(target));
    const isAssigned = config.constants.some(
      (assignment) => assignment.module === undefined && assignment.name === target,
    );
    if (definition === undefined || isAssigned) return undefined;
    return definition.kind === "Operator" ? definition.params.length : 0;
  };
  const checkTarget = (
    name: string,
    target: string,
    others: Map<string, string>,
    arity: number | undefined,
  ) => {
    if (others.has(target)) throw createReusedTargetError(target);
    if (!isDefined(target)) {
      throw new TlaConfigError(
        `The configuration file substitutes for ${name} with the undefined identifier ${target}.`,
      );
    }
    const targetArity = getTargetArity(target);
    if (arity !== undefined && targetArity !== undefined && targetArity !== arity) {
      throw createArityError(name, target);
    }
  };
  const getOverrides = (module: string | undefined) =>
    new Map(
      lastSubstitutions
        .filter((substitution) => substitution.module === module)
        .map((substitution) => [substitution.name, substitution.target]),
    );
  const overrides = getOverrides(undefined);
  // SpecProcessor#processConstants checks the root module's <- for its constants in SANY's order of constant declarations, then for its definitions in definition order, then the names left in the order of ModelConfig's Hashtable, then each other module's.
  linked.order.getDeclarationOrder("constant").forEach((name) => {
    const target = overrides.get(name);
    if (target !== undefined) checkTarget(name, target, overrides, undefined);
  });
  const rootDefinitions = linked.order
    .getDefinitionOrder(undefined)
    .filter((name) => linked.root.visible.get(name)?.kind === "Definition");
  rootDefinitions.forEach((name) => {
    const target = overrides.get(name);
    if (target !== undefined) {
      checkTarget(name, target, overrides, linked.root.visible.get(name)?.arity);
    }
  });
  const missing = getHashtableOrder([...overrides.keys()]).find(
    (name) => !declaredConstants.has(name) && !rootDefinitions.includes(name),
  );
  if (missing !== undefined) throw createMissingError(missing);
  [...linked.moduleSymbols.keys()].forEach((module) => {
    const moduleOverrides = getOverrides(module);
    if (moduleOverrides.size === 0) return;
    const definitions = linked.order
      .getDefinitionOrder(module === linked.root.module.name ? undefined : module)
      .filter((name) => getScopedSymbol({ name, module }) !== undefined);
    definitions.forEach((name) => {
      const target = moduleOverrides.get(name);
      if (target !== undefined) {
        checkTarget(name, target, moduleOverrides, getScopedSymbol({ name, module })?.arity);
      }
    });
    const moduleMissing = getHashtableOrder([...moduleOverrides.keys()]).find(
      (name) => !definitions.includes(name),
    );
    if (moduleMissing !== undefined) throw createMissingError(moduleMissing);
  });
  const unknownModule = getHashtableOrder(
    config.substitutions.flatMap((substitution) => substitution.module ?? []),
  ).find((module) => !linked.moduleSymbols.has(module));
  if (unknownModule !== undefined) {
    throw new TlaConfigError(
      `In the configuration file, the module name ${unknownModule} is not a module in the specification.`,
    );
  }
  const constants = new Map<string, Value>();
  const setOperator = (key: string, operator: Builtin) => {
    linked.builtins.set(key, operator);
    linked.definitions.delete(key);
    constants.delete(key);
  };
  const constantOrder = new Set(
    getModuleOrder(linked.root, new Set()).flatMap((module) =>
      linked.order.getDeclarationOrder(
        "constant",
        module === linked.root ? undefined : module.module.name,
      ),
    ),
  );
  const isConstant = (item: ConfigName) =>
    item.module === undefined && constantOrder.has(item.name);
  const setValue = (item: ConfigName, configValue: ConfigValue, keys: string[]) => {
    const isNormalized = isConstant(item);
    const value = isNormalized ? toConstantValue(configValue) : toLiteralValue(configValue);
    if (isNormalized) markNormalized(value);
    keys.forEach((key) => {
      const arity = getKeyArity(key);
      if (arity === 0) constants.set(key, value);
      else
        setOperator(key, {
          kind: "Builtin",
          name: item.name,
          arity,
          evaluate: () => value,
          evaluateUnary: undefined,
          evaluateBinary: undefined,
          isLazy: true,
        });
    });
  };
  const setTable = (table: ConfigTable) => {
    const toRowValue = isConstant(table) ? toConstantValue : toLiteralValue;
    const rows = table.rows.map((row): [Value[], Value] => [
      (row.args ?? []).map(toRowValue),
      toRowValue(row.value),
    ]);
    getScopedKeys(table).forEach((key) =>
      setOperator(key, createOperatorTable(table.name, getKeyArity(key), rows)),
    );
  };
  // ModelConfig keeps the last value of a name for each module.
  const values = new Map(
    config.constants
      .filter((assignment) => assignment.args === undefined)
      .map((assignment) => [`${assignment.module ?? ""}!${assignment.name}`, assignment]),
  );
  // SpecProcessor#processConstantDefns then normalizes the value of each constant and checks the arity of a definition substituted for one, module by module.
  constantOrder.forEach((name) => {
    const target = overrides.get(name);
    if (target === undefined) {
      const assignment = values.get(`!${name}`);
      const table = tables.get(`!${name}`);
      if (assignment) setValue(assignment, assignment.value, getScopedKeys(assignment));
      if (table) setTable(table);
      return;
    }
    // Defns holds the value or table the configuration assigns a definition, and a constant substituted with that definition gets it and normalizes it here.
    const forwarded = values.get(`!${target}`);
    if (forwarded) setValue({ name }, forwarded.value, [getRootKey(name)]);
    tables
      .get(`!${target}`)
      ?.rows.forEach((row) => [...(row.args ?? []), row.value].forEach(toConstantValue));
    const targetArity = getTargetArity(target);
    const arity = linked.root.constants.find((constant) => constant.name === name)?.arity;
    if (targetArity !== undefined && targetArity !== arity) throw createArityError(name, target);
  });
  values.forEach((assignment) => {
    if (!isConstant(assignment)) {
      setValue(assignment, assignment.value, getScopedKeys(assignment));
    }
  });
  tables.forEach((table) => {
    if (!isConstant(table)) setTable(table);
  });
  // A definition substituted with such a definition gets its value as written.
  lastSubstitutions.forEach((substitution) => {
    const assignment = values.get(`!${substitution.target}`);
    if (assignment && !isConstant(substitution)) {
      setValue(substitution, assignment.value, getSubstitutedKeys(substitution));
    }
  });
  const substitutions = new Map<string, string>();
  lastSubstitutions
    .filter((substitution) => !values.has(`!${substitution.target}`))
    .forEach((substitution) => {
      const targetKey = getRootKey(substitution.target);
      const builtin = linked.builtins.get(targetKey);
      getSubstitutedKeys(substitution).forEach((key) => {
        // TLC applies the Java override that a <- gives a name of no arguments to none where it evaluates the name.
        if (builtin !== undefined && builtin.arity > 0 && getKeyArity(key) === 0) {
          setOperator(key, { ...builtin, arity: 0, isLazy: true });
        } else substitutions.set(key, targetKey);
      });
    });
  [...substitutions.keys()].forEach((key) => constants.delete(key));
  const scopedKeys = new Set(
    [...config.constants, ...config.substitutions]
      .filter((item) => item.module !== undefined)
      .flatMap(getScopedKeys),
  );
  const getOverride = (
    key: string,
    prefix: number,
  ): { key: string; prefix: number } | undefined => {
    if (scopedKeys.has(key)) return { key, prefix };
    const copy = linked.copySources.get(key);
    return copy && getOverride(copy.source, prefix + copy.prefix);
  };
  linked.copySources.forEach((copy, key) => {
    const override = getOverride(copy.source, copy.prefix);
    const definition = linked.definitions.get(key);
    if (!override || !definition) return;
    const params = definition.kind === "Operator" ? definition.params : [];
    const alias = createLocalAlias(
      key,
      override.key,
      params,
      params.slice(override.prefix),
      definition.location,
    );
    linked.definitions.set(key, alias);
  });
  linked.operatorConstants.forEach((value, name) => constants.set(name, value));
  return { constants, substitutions };
};
