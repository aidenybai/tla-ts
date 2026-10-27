import { resolve } from "node:path";
import ts from "typescript";
import { translateAction, writesState } from "./actions";
import { type Context, getSymbol } from "./context";
import { getDomain } from "./domains";
import { TsproverError } from "./errors";
import {
  getDefinition,
  type Scope,
  translateBody,
  translateCondition,
  translateExpression,
} from "./expressions";
import { indent, render, wrap, wrapEquated } from "./formula";
import { createNames } from "./names";

export interface CompiledSpec {
  source: string;
  config: string;
}

type FunctionNode = ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression;

interface Exported {
  name: string;
  node: FunctionNode;
  body: ts.ConciseBody;
  tags: Map<string, string>;
}

interface Variable {
  symbol: ts.Symbol;
  declaration: ts.VariableDeclaration;
}

interface Parameter {
  node: ts.ParameterDeclaration;
  name: string;
  symbol: ts.Symbol | undefined;
}

// The values of a parameter's type, or undefined when the type has no end.
const getFiniteDomain = (parameter: Parameter, context: Context) => {
  try {
    return getDomain(
      context.checker.getTypeAtLocation(parameter.node.name),
      parameter.node,
      context,
    );
  } catch (error) {
    if (error instanceof TsproverError) return undefined;
    throw error;
  }
};

const COMPILER_OPTIONS: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  moduleDetection: ts.ModuleDetectionKind.Force,
  allowImportingTsExtensions: true,
  resolveJsonModule: true,
  lib: ["lib.esnext.d.ts"],
  types: [],
};

const TEMPORAL_OPERATORS = new Map([
  ["eventually", "<>"],
  ["alwaysEventually", "[]<>"],
  ["eventuallyAlways", "<>[]"],
]);

const VALUE_TAGS = new Set([
  ...TEMPORAL_OPERATORS.keys(),
  "initially",
  "always",
  "leadsTo",
  "constraint",
  "actionConstraint",
  "view",
  "assume",
  "postcondition",
]);

const KNOWN_TAGS = new Set([
  ...VALUE_TAGS,
  "fair",
  "strongFair",
  "symmetric",
  "noDeadlock",
  "param",
  "returns",
  "return",
  "example",
  "see",
  "deprecated",
  "remarks",
  "throws",
  "link",
  "description",
]);

const getTags = (node: ts.Node) => {
  const tags = ts.getJSDocTags(node);
  for (const tag of tags) {
    if (!KNOWN_TAGS.has(tag.tagName.text)) {
      throw new TsproverError(`Unknown tag: @${tag.tagName.text}`, tag);
    }
  }
  return new Map(
    tags.map((tag) => [tag.tagName.text, ts.getTextOfJSDocComment(tag.comment)?.trim() ?? ""]),
  );
};

const isExported = (node: ts.Declaration) =>
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;

const createProgram = (source: string, path: string) => {
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.ESNext, true);
  const host = ts.createCompilerHost(COMPILER_OPTIONS);
  const program = ts.createProgram({
    rootNames: [path],
    options: COMPILER_OPTIONS,
    host: {
      ...host,
      getSourceFile: (fileName, languageVersion) =>
        fileName === path ? sourceFile : host.getSourceFile(fileName, languageVersion),
      fileExists: (fileName) => fileName === path || host.fileExists(fileName),
      readFile: (fileName) => (fileName === path ? source : host.readFile(fileName)),
    },
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) throw new TsproverError(ts.formatDiagnostics(diagnostics, host));
  return { sourceFile, checker: program.getTypeChecker() };
};

// Compiles a TypeScript model into a TLA+ spec and the config that checks it. Imports resolve
// relative to fileName.
export const compile = (source: string, fileName = "spec.ts"): CompiledSpec => {
  const program = createProgram(source, resolve(fileName).replaceAll("\\", "/"));
  const checker = program.checker;
  const context: Context = {
    checker,
    names: createNames(),
    variables: new Map(),
    definitions: new Map(),
    inProgress: new Set(),
    recursive: new Set(),
    output: [],
    modelValues: new Map(),
    prelude: new Set(),
  };
  const symmetrySets: string[] = [];
  const variables: Variable[] = [];
  const exported: Exported[] = [];
  const topLevel = new Map<string, ts.FunctionDeclaration | ts.VariableDeclaration>();
  const statements = program.sourceFile.statements;
  const isDeadlockChecked = !statements.some((statement) => getTags(statement).has("noDeadlock"));

  for (const statement of statements) {
    if (ts.isTypeAliasDeclaration(statement) && getTags(statement).has("symmetric")) {
      const type = checker.getTypeAtLocation(statement.name);
      const members = type.isUnion() ? type.types : [type];
      const names = members.map((member) => {
        if (!member.isStringLiteral()) {
          throw new TsproverError("A @symmetric type must be a union of strings", statement);
        }
        const name = context.names.getFresh(member.value);
        if (name !== member.value) {
          throw new TsproverError(`"${member.value}" can't name a TLA+ model value`, statement);
        }
        context.modelValues.set(member.value, name);
        return name;
      });
      symmetrySets.push(`{${names.join(", ")}}`);
    }
  }

  for (const statement of statements) {
    if (
      ts.isImportDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    ) {
      continue;
    }
    if (ts.isExportDeclaration(statement) && statement.isTypeOnly) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined && statement.body) {
      if (isExported(statement)) {
        exported.push({
          name: statement.name.text,
          node: statement,
          body: statement.body,
          tags: getTags(statement),
        });
      }
      topLevel.set(statement.name.text, statement);
      continue;
    }
    if (!ts.isVariableStatement(statement)) {
      throw new TsproverError(`Unsupported statement: ${statement.getText()}`, statement);
    }
    const isLet = (statement.declarationList.flags & ts.NodeFlags.Let) !== 0;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) {
        throw new TsproverError("Declare one name at a time", declaration);
      }
      if (isLet) {
        const symbol = getSymbol(declaration.name, checker);
        if (isExported(declaration) || symbol === undefined) {
          throw new TsproverError("State variables can't be exported", declaration);
        }
        variables.push({ symbol, declaration });
        continue;
      }
      if ((statement.declarationList.flags & ts.NodeFlags.Const) === 0) {
        throw new TsproverError("Use let for state and const for everything else", declaration);
      }
      topLevel.set(declaration.name.text, declaration);
      const initializer = declaration.initializer;
      if (
        isExported(declaration) &&
        initializer !== undefined &&
        (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
      ) {
        exported.push({
          name: declaration.name.text,
          node: initializer,
          body: initializer.body,
          tags: getTags(declaration),
        });
      }
    }
  }

  const variableNames = variables.map((variable) => {
    const name = context.names.getFresh(variable.declaration.name.getText());
    context.variables.set(variable.symbol, name);
    return name;
  });
  const names = new Map(
    exported.map((definition) => [definition, context.names.getFresh(definition.name)]),
  );
  const getName = (definition: Exported) => names.get(definition) ?? definition.name;
  const stateScope: Scope = { bindings: new Map(context.variables), previous: undefined };

  const init = variables.map((variable, index) => {
    const initializer = variable.declaration.initializer;
    if (initializer !== undefined) {
      return `${variableNames[index]} = ${indent(wrapEquated(translateBody(initializer, stateScope, context)), "     ")}`;
    }
    const type = checker.getTypeAtLocation(variable.declaration.name);
    return `${variableNames[index]} \\in ${getDomain(type, variable.declaration, context)}`;
  });

  const actions: string[] = [];
  const next: string[] = [];
  const fairness: string[] = [];
  const predicates: string[] = [];
  const temporal: string[] = [];
  const invariants: string[] = [];
  const properties: string[] = [];
  const constraints: string[] = [];
  const actionConstraints: string[] = [];
  const views: string[] = [];
  const postconditions: string[] = [];
  const assumptions: string[] = [];

  const getPreviousScope = (definition: Exported) => {
    const parameter = definition.node.parameters[0];
    if (parameter === undefined) return stateScope;
    if (definition.node.parameters.length > 1 || !ts.isIdentifier(parameter.name)) {
      throw new TsproverError("Take the state before the step as one parameter", parameter);
    }
    return {
      bindings: new Map([...context.variables].map(([symbol, name]) => [symbol, `${name}'`])),
      previous: getSymbol(parameter.name, checker),
    };
  };

  for (const definition of exported) {
    const name = getName(definition);
    const node = definition.node;
    const tags = definition.tags;
    const body = definition.body;
    const valueTag = [...tags.keys()].find((tag) => VALUE_TAGS.has(tag));
    const isPrevious = valueTag === "always" || valueTag === "actionConstraint";
    // A temporal property's parameters hold for every value, as in \A p \in P : []<>Eats(p).
    const isQuantified =
      valueTag !== undefined && (TEMPORAL_OPERATORS.has(valueTag) || valueTag === "leadsTo");
    if (valueTag !== undefined && !isPrevious && !isQuantified && node.parameters.length > 0) {
      throw new TsproverError(`@${valueTag} functions can't take parameters`, node.parameters[0]);
    }
    if (valueTag !== undefined) {
      const quantified = isQuantified
        ? node.parameters.map((parameter) => {
            if (!ts.isIdentifier(parameter.name)) {
              throw new TsproverError("Destructured parameters aren't supported here", parameter);
            }
            return {
              name: context.names.getFresh(parameter.name.text),
              symbol: getSymbol(parameter.name, checker),
              domain: getDomain(checker.getTypeAtLocation(parameter.name), parameter, context),
            };
          })
        : [];
      const scope = isPrevious
        ? getPreviousScope(definition)
        : {
            ...stateScope,
            bindings: new Map([
              ...stateScope.bindings,
              ...quantified.flatMap((parameter): [ts.Symbol, string][] =>
                parameter.symbol ? [[parameter.symbol, parameter.name]] : [],
              ),
            ]),
          };
      const forAll =
        quantified.length === 0
          ? ""
          : `\\A ${quantified.map((parameter) => `${parameter.name} \\in ${parameter.domain}`).join(", ")} : `;
      const value = indent(translateBody(body, scope, context), "  ");
      const operator = TEMPORAL_OPERATORS.get(valueTag);
      if (operator !== undefined) {
        temporal.push(`${name} ==\n  ${forAll}${operator}(${value})`);
        properties.push(name);
      }
      if (valueTag === "leadsTo") {
        const target = topLevel.get(tags.get("leadsTo") ?? "");
        const exportedTarget = exported.find(
          (candidate) =>
            candidate.node === target ||
            (target !== undefined &&
              ts.isVariableDeclaration(target) &&
              candidate.node === target.initializer),
        );
        if (target === undefined) {
          throw new TsproverError(
            `@leadsTo names an unknown function: ${tags.get("leadsTo")}`,
            node,
          );
        }
        const getTargetName = () => {
          if (exportedTarget !== undefined) return getName(exportedTarget);
          const targetDefinition = getDefinition(target, context);
          const targetArguments = quantified
            .slice(0, targetDefinition.parameters.length)
            .map((parameter) => parameter.name);
          return targetArguments.length === 0
            ? targetDefinition.name
            : `${targetDefinition.name}(${targetArguments.join(", ")})`;
        };
        const targetName = getTargetName();
        temporal.push(`${name} ==\n  ${forAll}(${value}) ~> ${targetName}`);
        properties.push(name);
      }
      if (valueTag === "initially") {
        init.push(value);
      }
      if (valueTag === "always") {
        temporal.push(
          node.parameters.length === 0
            ? `${name} ==\n  [](${value})`
            : `${name} ==\n  [][${value}]_vars`,
        );
        properties.push(name);
      }
      const plain: Record<string, string[]> = {
        constraint: constraints,
        actionConstraint: actionConstraints,
        view: views,
        postcondition: postconditions,
        assume: assumptions,
      };
      if (plain[valueTag] !== undefined) {
        predicates.push(`${name} ==\n  ${value}`);
        plain[valueTag].push(name);
      }
      continue;
    }
    const isAction = writesState(body, context, new Set());
    const returnType = checker.getSignatureFromDeclaration(node)?.getReturnType();
    const isVoid =
      returnType === undefined ||
      (returnType.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)) !== 0;
    if (!isAction && !isVoid) {
      if (!(returnType.flags & ts.TypeFlags.BooleanLike)) {
        throw new TsproverError(
          "An exported function that returns a value must return a boolean, or be tagged, such as @view",
          node,
        );
      }
      if (node.parameters.length > 0) {
        throw new TsproverError("Invariants can't take parameters", node.parameters[0]);
      }
      const value = ts.isBlock(body)
        ? translateBody(body, stateScope, context)
        : translateCondition(body, stateScope, context);
      predicates.push(`${name} ==\n  ${indent(value, "  ")}`);
      invariants.push(name);
      continue;
    }

    const parameters = node.parameters.map((parameter) => {
      if (
        !ts.isIdentifier(parameter.name) ||
        parameter.initializer !== undefined ||
        parameter.questionToken !== undefined ||
        parameter.dotDotDotToken !== undefined
      ) {
        throw new TsproverError(`Unsupported parameter: ${parameter.getText()}`, parameter);
      }
      const result: Parameter = {
        node: parameter,
        name: context.names.getFresh(parameter.name.text),
        symbol: getSymbol(parameter.name, checker),
      };
      return result;
    });
    const guardedDomains = new Map<Parameter, { domain: string; isDependent: boolean }>();
    const statementsOfBody = ts.isBlock(body)
      ? [...body.statements]
      : [ts.factory.createExpressionStatement(body)];
    // A leading `if (!set.has(parameter)) return;` chooses the parameter from that set, as
    // `\E parameter \in set` does, so TLC doesn't enumerate the parameter's whole type.
    const isGuardedBy = (statement: ts.Statement) => {
      if (!ts.isIfStatement(statement) || statement.elseStatement !== undefined) return undefined;
      const then = statement.thenStatement;
      const isReturn = ts.isReturnStatement(then)
        ? then.expression === undefined
        : ts.isBlock(then) &&
          then.statements.length === 1 &&
          ts.isReturnStatement(then.statements[0]) &&
          then.statements[0].expression === undefined;
      const condition = statement.expression;
      if (
        !isReturn ||
        !ts.isPrefixUnaryExpression(condition) ||
        condition.operator !== ts.SyntaxKind.ExclamationToken
      )
        return undefined;
      const call = ts.isParenthesizedExpression(condition.operand)
        ? condition.operand.expression
        : condition.operand;
      if (
        !ts.isCallExpression(call) ||
        !ts.isPropertyAccessExpression(call.expression) ||
        call.expression.name.text !== "has" ||
        call.arguments.length !== 1
      )
        return undefined;
      const argument = call.arguments[0];
      const parameter = ts.isIdentifier(argument)
        ? parameters.find((candidate) => candidate.symbol === getSymbol(argument, checker))
        : undefined;
      const set = call.expression.expression;
      // The set may use parameters that earlier guards chose, as in \E a \in A : \E b \in B(a).
      const getUsed = (inner: ts.Node): Parameter[] => [
        ...parameters.filter(
          (candidate) => ts.isIdentifier(inner) && candidate.symbol === getSymbol(inner, checker),
        ),
        ...inner.getChildren().flatMap(getUsed),
      ];
      const used = getUsed(set);
      const isSet = (checker.getTypeAtLocation(set).getSymbol()?.getName() ?? "").endsWith("Set");
      if (
        parameter === undefined ||
        guardedDomains.has(parameter) ||
        !used.every((candidate) => guardedDomains.has(candidate)) ||
        !isSet
      )
        return undefined;
      return { parameter, set, isDependent: used.length > 0 };
    };
    const firstOther = statementsOfBody.findIndex((statement) => {
      const guard = isGuardedBy(statement);
      if (guard === undefined) return true;
      const guardScope = {
        ...stateScope,
        bindings: new Map([
          ...stateScope.bindings,
          ...[...guardedDomains.keys()].flatMap((parameter): [ts.Symbol, string][] =>
            parameter.symbol ? [[parameter.symbol, parameter.name]] : [],
          ),
        ]),
      };
      guardedDomains.set(guard.parameter, {
        domain: translateExpression(guard.set, guardScope, context),
        isDependent: guard.isDependent,
      });
      return false;
    });
    const remaining = firstOther === -1 ? [] : statementsOfBody.slice(firstOther);
    const scope: Scope = {
      bindings: new Map([
        ...context.variables,
        ...parameters.flatMap((parameter): [ts.Symbol, string][] =>
          parameter.symbol ? [[parameter.symbol, parameter.name]] : [],
        ),
      ]),
      previous: undefined,
    };
    const formula = translateAction(remaining, scope, context);
    const head =
      parameters.length === 0
        ? name
        : `${name}(${parameters.map((parameter) => parameter.name).join(", ")})`;
    actions.push(`${head} ==\n  ${indent(render(formula), "  ")}`);
    const domains = parameters.map((parameter) => ({
      ...parameter,
      domain:
        guardedDomains.get(parameter)?.domain ??
        getDomain(checker.getTypeAtLocation(parameter.node.name), parameter.node, context),
      isTyped: !guardedDomains.has(parameter),
      isDependent: guardedDomains.get(parameter)?.isDependent === true,
    }));
    const independent = domains.filter((parameter) => !parameter.isDependent);
    // Guards run in order, so each dependent parameter is chosen after the ones its set uses.
    const dependent = [...guardedDomains]
      .filter((entry) => entry[1].isDependent)
      .map((entry) => `\\E ${entry[0].name} \\in ${entry[1].domain} : `);
    const step =
      parameters.length === 0
        ? name
        : `\\E ${independent.map((parameter) => `${parameter.name} \\in ${parameter.domain}`).join(", ")} : ${dependent.join("")}${head}`;
    next.push(step);
    const fairnessKind = tags.has("strongFair")
      ? "SF_vars"
      : tags.has("fair")
        ? "WF_vars"
        : undefined;
    if (fairnessKind !== undefined) {
      // Fairness holds for each parameter value when every parameter has a finite type, with the
      // guards that chose parameters kept inside the action.
      const typeDomains = domains.map((parameter) =>
        parameter.isTyped ? parameter.domain : getFiniteDomain(parameter, context),
      );
      const guards = domains
        .filter((parameter) => !parameter.isTyped)
        .map((parameter) => `${parameter.name} \\in ${wrap(parameter.domain)}`);
      const forAll = domains
        .map((parameter, index) => `${parameter.name} \\in ${typeDomains[index]}`)
        .join(", ");
      fairness.push(
        parameters.length === 0
          ? `${fairnessKind}(${name})`
          : typeDomains.every((domain) => domain !== undefined)
            ? `\\A ${forAll} : ${fairnessKind}(${[...guards, head].join(" /\\ ")})`
            : `${fairnessKind}(${step})`,
      );
    }
  }

  const recursive = [...context.recursive].map((declaration) => {
    const definition = context.definitions.get(declaration);
    if (definition === undefined || definition.parameters.length === 0) {
      throw new TsproverError("A constant can't refer to itself", declaration);
    }
    return `${definition.name}(${definition.parameters.map(() => "_").join(", ")})`;
  });
  const prelude = context.prelude;
  const constants = [
    ...(prelude.has("Null") ? ["Null"] : []),
    ...(prelude.has("Undefined") ? ["Undefined"] : []),
    ...context.modelValues.values(),
  ];
  const conjunction = (items: string[]) =>
    items.length === 1 ? ` ${items[0]}` : `\n${items.map((item) => `  /\\ ${item}`).join("\n")}`;
  const disjunction = (items: string[]) =>
    items.length === 0
      ? " FALSE"
      : items.length === 1
        ? ` ${items[0]}`
        : `\n${items.map((item) => `  \\/ ${item}`).join("\n")}`;

  const spec = [
    "---- MODULE Spec ----",
    "EXTENDS Integers, Sequences, FiniteSets, TLC",
    ...(constants.length > 0 ? [`CONSTANTS ${constants.join(", ")}`] : []),
    ...(variableNames.length > 0 ? [`VARIABLES ${variableNames.join(", ")}`] : []),
    `vars == <<${variableNames.join(", ")}>>`,
    ...(recursive.length > 0 ? [`RECURSIVE ${recursive.join(", ")}`] : []),
    ...(prelude.has("Rem")
      ? [
          "Rem(a, b) ==\n  LET m == IF b < 0 THEN -b ELSE b\n  IN  IF a >= 0 THEN a % m ELSE -((-a) % m)",
        ]
      : []),
    ...(prelude.has("Quot")
      ? [
          "Quot(a, b) ==\n  LET q == (IF a < 0 THEN -a ELSE a) \\div (IF b < 0 THEN -b ELSE b)\n  IN  IF (a < 0) = (b < 0) THEN q ELSE -q",
        ]
      : []),
    ...context.output,
    `Init ==${conjunction(init.length > 0 ? init : ["TRUE"])}`,
    ...actions,
    `Next ==${disjunction(next)}`,
    `Spec ==${conjunction(["Init", "[][Next]_vars", ...fairness])}`,
    ...predicates,
    ...temporal,
    ...assumptions.map((assumption) => `ASSUME ${assumption}`),
    ...(symmetrySets.length > 0
      ? [`Perms == ${symmetrySets.map((set) => `Permutations(${set})`).join(" \\cup ")}`]
      : []),
    "====",
  ].join("\n");

  const section = (keyword: string, values: string[]) =>
    values.length > 0 ? [`${keyword} ${values.join(" ")}`] : [];
  if (views.length > 1) throw new TsproverError("Tag only one function @view");
  return {
    source: spec,
    config: [
      "SPECIFICATION Spec",
      ...(constants.length > 0
        ? ["CONSTANTS", ...constants.map((constant) => `  ${constant} = ${constant}`)]
        : []),
      ...section("INVARIANTS", invariants),
      ...section("PROPERTIES", properties),
      ...section("CONSTRAINTS", constraints),
      ...section("ACTION_CONSTRAINTS", actionConstraints),
      ...section("VIEW", views),
      ...section("POSTCONDITIONS", postconditions),
      ...(symmetrySets.length > 0 ? ["SYMMETRY Perms"] : []),
      ...(isDeadlockChecked ? [] : ["CHECK_DEADLOCK FALSE"]),
    ].join("\n"),
  };
};
