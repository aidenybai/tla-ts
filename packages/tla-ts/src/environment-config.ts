import type { Definition } from "./ast";
import type { ConfigValue, ModelConfig } from "./config";
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
import type { TlcOrder } from "./tlc/order";
import {
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

interface LinkedSpecification {
  root: LinkedModule;
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

const createOperatorTable = (name: string, arity: number, rows: [Value[], Value][]): Builtin => {
  const table = `{ ${rows.map((row) => `<${[...row[0], row[1]].map((value) => formatValue(value)).join(", ")}>`).join(", ")}}`;
  return {
    kind: "Builtin",
    name,
    arity,
    evaluate: (args) => {
      const row = rows.find((candidate) => {
        if (candidate[0].length !== args.length) {
          throw new TlaEvaluationError(
            `Attempted to apply the operator ${table}\nwith wrong number of arguments.`,
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
        `Attempted to apply operator:\n${table}\nto arguments (${args.map((argument) => (typeof argument === "object" && argument.kind === "Operator" ? argument.name : formatValue(argument))).join(", ")}), which is undefined.`,
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

export const applyConfig = (config: ModelConfig, linked: LinkedSpecification): AppliedConfig => {
  const getRootKey = (name: string) => linked.root.visible.get(name)?.key ?? name;
  const declaredConstants = linked.root.constants.map((constant) => constant.name);
  const variables = linked.root.variables;
  const getScopedSymbol = (item: { name: string; module?: string }) => {
    const symbol = linked.moduleSymbols.get(item.module ?? "")?.get(item.name);
    return symbol?.kind === "Definition" ? symbol : undefined;
  };
  const getSubstitutedKeys = (item: { name: string; module?: string }) => {
    if (item.module === undefined) return [item.name, getRootKey(item.name)];
    const symbol = getScopedSymbol(item);
    return symbol ? [symbol.key] : [];
  };
  const getScopedKeys = (item: { name: string; module?: string }) =>
    item.module === linked.root.module.name ? [] : getSubstitutedKeys(item);
  const getKeyArity = (key: string) => {
    const definition = linked.definitions.get(key);
    return definition?.kind === "Operator"
      ? definition.params.length
      : (linked.root.constants.find((constant) => constant.name === key)?.arity ??
          linked.builtins.get(key)?.arity ??
          0);
  };
  const constants = new Map<string, Value>();
  const operatorKeys = new Set<string>();
  const setOperator = (key: string, operator: Builtin) => {
    linked.builtins.set(key, operator);
    linked.definitions.delete(key);
    constants.delete(key);
    operatorKeys.add(key);
  };
  config.constants
    .filter((assignment) => assignment.args === undefined)
    .forEach((assignment) => {
      const value = toConstantValue(assignment.value);
      markNormalized(value);
      getScopedKeys(assignment).forEach((key) => {
        const arity = getKeyArity(key);
        if (arity === 0) constants.set(key, value);
        else
          setOperator(key, {
            kind: "Builtin",
            name: key,
            arity,
            evaluate: () => value,
            evaluateUnary: undefined,
            evaluateBinary: undefined,
            isLazy: true,
          });
      });
    });
  const tables = new Map<string, { name: string; module?: string; rows: [Value[], Value][] }>();
  config.constants.forEach((assignment) => {
    if (assignment.args === undefined) return;
    const tableKey = `${assignment.module ?? ""}!${assignment.name}`;
    const table = tables.get(tableKey) ?? {
      name: assignment.name,
      module: assignment.module,
      rows: [],
    };
    if (table.rows.length > 0 && table.rows[0][0].length !== assignment.args.length) {
      throw new TlaConfigError(
        `The arity of the operator ${assignment.name} is inconsistent in the configuration file.`,
      );
    }
    table.rows.push([assignment.args.map(toValue), toValue(assignment.value)]);
    tables.set(tableKey, table);
  });
  tables.forEach((table) =>
    getScopedKeys(table).forEach((key) =>
      setOperator(key, createOperatorTable(table.name, getKeyArity(key), table.rows)),
    ),
  );
  const substitutions = new Map(
    config.substitutions.flatMap((substitution) =>
      getSubstitutedKeys(substitution).map((key): [string, string] => [
        key,
        getRootKey(substitution.target),
      ]),
    ),
  );
  [...substitutions.keys()].forEach((key) => constants.delete(key));
  const checkSubstitutionTarget = (name: string, target: string, arity: number | undefined) => {
    const targetKey = getRootKey(target);
    const definition = linked.definitions.get(targetKey);
    const isDefined =
      definition !== undefined ||
      linked.builtins.has(targetKey) ||
      constants.has(targetKey) ||
      declaredConstants.includes(target) ||
      variables.includes(target);
    if (!isDefined) {
      throw new TlaConfigError(
        `The configuration file substitutes for ${name} with the undefined identifier ${target}.`,
      );
    }
    if (definition?.kind === "Operator" && definition.params.length !== arity) {
      throw new TlaConfigError(
        `The configuration file substitutes for ${name} with ${target} of different number of arguments.`,
      );
    }
  };
  config.substitutions
    .filter((substitution) => substitution.module === undefined)
    .forEach((substitution) => {
      const name = substitution.name;
      const target = substitution.target;
      if (!declaredConstants.includes(name) && !linked.root.visible.has(name)) {
        throw new TlaConfigError(
          `In the configuration file, the identifier ${name} does not appear in the specification.`,
        );
      }
      if (config.substitutions.some((other) => other.name === target)) {
        throw createReusedTargetError(target);
      }
      checkSubstitutionTarget(
        name,
        target,
        linked.root.constants.find((constant) => constant.name === name)?.arity ??
          linked.root.visible.get(name)?.arity,
      );
    });
  const scopedSubstitutions = config.substitutions.filter(
    (substitution) => substitution.module !== undefined,
  );
  [...linked.moduleSymbols.keys()].forEach((name) => {
    const inModule = scopedSubstitutions.filter((substitution) => substitution.module === name);
    inModule.forEach((substitution) => {
      const symbol = getScopedSymbol(substitution);
      if (!symbol) return;
      if (inModule.some((other) => other.name === substitution.target)) {
        throw createReusedTargetError(substitution.target);
      }
      checkSubstitutionTarget(substitution.name, substitution.target, symbol.arity);
    });
    const missing = inModule.find((substitution) => !getScopedSymbol(substitution));
    if (missing) {
      throw new TlaConfigError(
        `In the configuration file, the identifier ${missing.name} does not appear in the specification.`,
      );
    }
  });
  const unknownModule = scopedSubstitutions.find(
    (substitution) => !linked.moduleSymbols.has(substitution.module ?? ""),
  );
  if (unknownModule) {
    throw new TlaConfigError(
      `In the configuration file, the module name ${unknownModule.module} is not a module in the specification.`,
    );
  }
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
    linked.root.visible.forEach((symbol, name) => {
      if (symbol.key === key && name !== key) linked.definitions.set(name, alias);
    });
  });
  linked.operatorConstants.forEach((value, name) => constants.set(name, value));
  const unassigned = declaredConstants.filter(
    (name) => !constants.has(name) && !substitutions.has(name) && !operatorKeys.has(name),
  );
  if (unassigned.length > 0) {
    const name =
      linked.order
        .getDeclarationOrder("constant")
        .find((constant) => unassigned.includes(constant)) ?? unassigned[0];
    throw new TlaConfigError(
      `The constant parameter ${name} is not assigned a value by the configuration file.`,
    );
  }
  return { constants, substitutions };
};
