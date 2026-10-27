import ts from "typescript";
import { TsproverError } from "./errors";

export interface CompiledSpec {
  source: string;
  config: string;
}

interface Variable {
  name: string;
  declaration: ts.VariableDeclaration;
}

interface Definition {
  name: string;
  node: ts.SignatureDeclaration;
  body: ts.ConciseBody;
}

interface Scope {
  // The TLA+ expression for each state variable's value at this point in the step.
  values: Map<string, string>;
  locals: Set<string>;
}

const FILE_NAME = "/spec.ts";

const COMPILER_OPTIONS: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleDetection: ts.ModuleDetectionKind.Force,
  lib: ["lib.esnext.d.ts"],
  types: [],
};

const BINARY_OPERATORS = new Map([
  [ts.SyntaxKind.PlusToken, "+"],
  [ts.SyntaxKind.MinusToken, "-"],
  [ts.SyntaxKind.AsteriskToken, "*"],
  [ts.SyntaxKind.EqualsEqualsEqualsToken, "="],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, "#"],
  [ts.SyntaxKind.LessThanToken, "<"],
  [ts.SyntaxKind.LessThanEqualsToken, "<="],
  [ts.SyntaxKind.GreaterThanToken, ">"],
  [ts.SyntaxKind.GreaterThanEqualsToken, ">="],
  [ts.SyntaxKind.AmpersandAmpersandToken, "/\\"],
  [ts.SyntaxKind.BarBarToken, "\\/"],
]);

const ASSIGNMENT_OPERATORS = new Map([
  [ts.SyntaxKind.PlusEqualsToken, "+"],
  [ts.SyntaxKind.MinusEqualsToken, "-"],
  [ts.SyntaxKind.AsteriskEqualsToken, "*"],
]);

const UPDATE_OPERATORS = new Map([
  [ts.SyntaxKind.PlusPlusToken, "+"],
  [ts.SyntaxKind.MinusMinusToken, "-"],
]);

const getLocation = (node: ts.Node) => {
  const position = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart());
  return `${position.line + 1}:${position.character + 1}`;
};

const wrap = (expression: string) => (expression.includes(" ") ? `(${expression})` : expression);

const isExported = (node: ts.Declaration) =>
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;

const isBareReturn = (statement: ts.Statement): boolean =>
  ts.isReturnStatement(statement)
    ? statement.expression === undefined
    : ts.isBlock(statement) &&
      statement.statements.length === 1 &&
      isBareReturn(statement.statements[0]);

// The set of values that a declaration's finite type allows, which TLC chooses from.
const getDomain = (
  declaration: ts.ParameterDeclaration | ts.VariableDeclaration,
  checker: ts.TypeChecker,
) => {
  const type = checker.getTypeAtLocation(declaration.name);
  const members = type.isUnion() ? type.types : [type];
  const values = members.map((member) => {
    if (member.isStringLiteral()) return JSON.stringify(member.value);
    if (member.isNumberLiteral() && Number.isInteger(member.value)) return String(member.value);
    if (member.flags & ts.TypeFlags.BooleanLiteral) {
      return checker.typeToString(member).toUpperCase();
    }
    throw new TsproverError(
      `${getLocation(declaration.name)} ${declaration.name.getText()} needs a finite type, such as a union of literals`,
    );
  });
  return `{${values.join(", ")}}`;
};

const translateExpression = (node: ts.Expression, scope: Scope): string => {
  if (ts.isParenthesizedExpression(node)) return translateExpression(node.expression, scope);
  if (ts.isNumericLiteral(node)) {
    if (!Number.isInteger(Number(node.text))) {
      throw new TsproverError(`${getLocation(node)} Only integers are supported: ${node.text}`);
    }
    return node.text;
  }
  if (ts.isStringLiteral(node)) return JSON.stringify(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return "TRUE";
  if (node.kind === ts.SyntaxKind.FalseKeyword) return "FALSE";
  if (ts.isIdentifier(node)) {
    const value = scope.values.get(node.text);
    if (value !== undefined) return value;
    if (scope.locals.has(node.text)) return node.text;
    throw new TsproverError(`${getLocation(node)} Unknown name: ${node.text}`);
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
    return `~${wrap(translateExpression(node.operand, scope))}`;
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    return `-${wrap(translateExpression(node.operand, scope))}`;
  }
  if (ts.isBinaryExpression(node)) {
    const operator = BINARY_OPERATORS.get(node.operatorToken.kind);
    if (operator === undefined) {
      throw new TsproverError(
        `${getLocation(node.operatorToken)} Unsupported operator: ${node.operatorToken.getText()}`,
      );
    }
    return `${wrap(translateExpression(node.left, scope))} ${operator} ${wrap(translateExpression(node.right, scope))}`;
  }
  if (ts.isConditionalExpression(node)) {
    return `IF ${translateExpression(node.condition, scope)} THEN ${translateExpression(node.whenTrue, scope)} ELSE ${translateExpression(node.whenFalse, scope)}`;
  }
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.expression.getText() === "Math" &&
    ["min", "max"].includes(node.expression.name.text) &&
    node.arguments.length > 0
  ) {
    const comparison = node.expression.name.text === "min" ? "<" : ">";
    return node.arguments
      .map((argument) => wrap(translateExpression(argument, scope)))
      .reduce(
        (result, argument) =>
          `IF ${result} ${comparison} ${argument} THEN ${result} ELSE ${argument}`,
      );
  }
  throw new TsproverError(`${getLocation(node)} Unsupported expression: ${node.getText()}`);
};

const translateAction = (
  statements: ts.NodeArray<ts.Statement>,
  variables: Variable[],
  parameters: string[],
) => {
  const scope: Scope = {
    values: new Map(variables.map((variable) => [variable.name, variable.name])),
    locals: new Set(parameters),
  };
  const definitions: string[] = [];
  const guards: string[] = [];
  const assigned = new Set<string>();
  const assign = (target: ts.Expression, getValue: (current: string) => string) => {
    const current = ts.isIdentifier(target) ? scope.values.get(target.text) : undefined;
    if (current === undefined) {
      throw new TsproverError(
        `${getLocation(target)} Only state variables can be assigned: ${target.getText()}`,
      );
    }
    scope.values.set(target.getText(), getValue(current));
    assigned.add(target.getText());
  };

  for (const statement of statements) {
    if (ts.isVariableStatement(statement) && statement.declarationList.flags & ts.NodeFlags.Const) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.initializer === undefined) {
          throw new TsproverError(
            `${getLocation(declaration)} Unsupported declaration: ${declaration.getText()}`,
          );
        }
        if (scope.values.has(declaration.name.text)) {
          throw new TsproverError(
            `${getLocation(declaration.name)} ${declaration.name.text} shadows a state variable`,
          );
        }
        definitions.push(
          `${declaration.name.text} == ${translateExpression(declaration.initializer, scope)}`,
        );
        scope.locals.add(declaration.name.text);
      }
      continue;
    }
    if (
      ts.isIfStatement(statement) &&
      statement.elseStatement === undefined &&
      isBareReturn(statement.thenStatement)
    ) {
      if (assigned.size > 0) {
        throw new TsproverError(
          `${getLocation(statement)} A guard must come before any assignment`,
        );
      }
      guards.push(`~${wrap(translateExpression(statement.expression, scope))}`);
      continue;
    }
    const expression = ts.isExpressionStatement(statement) ? statement.expression : undefined;
    if (expression !== undefined && ts.isBinaryExpression(expression)) {
      const operator = ASSIGNMENT_OPERATORS.get(expression.operatorToken.kind);
      const value = translateExpression(expression.right, scope);
      if (expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        assign(expression.left, () => value);
        continue;
      }
      if (operator !== undefined) {
        assign(expression.left, (current) => `${wrap(current)} ${operator} ${wrap(value)}`);
        continue;
      }
    }
    if (
      expression !== undefined &&
      (ts.isPostfixUnaryExpression(expression) || ts.isPrefixUnaryExpression(expression))
    ) {
      const operator = UPDATE_OPERATORS.get(expression.operator);
      if (operator !== undefined) {
        assign(expression.operand, (current) => `${wrap(current)} ${operator} 1`);
        continue;
      }
    }
    throw new TsproverError(
      `${getLocation(statement)} Unsupported statement: ${statement.getText()}`,
    );
  }

  const unchanged = variables
    .map((variable) => variable.name)
    .filter((name) => scope.values.get(name) === name);
  const conjuncts = [
    ...guards,
    ...variables
      .filter((variable) => !unchanged.includes(variable.name))
      .map((variable) => `${variable.name}' = ${scope.values.get(variable.name)}`),
    ...(unchanged.length > 0 ? [`UNCHANGED <<${unchanged.join(", ")}>>`] : []),
  ];
  const conjunction = conjuncts.length > 0 ? conjuncts : ["TRUE"];
  return definitions.length === 0
    ? conjunction.map((conjunct) => `/\\ ${conjunct}`)
    : [
        ...definitions.map((definition, index) => `${index === 0 ? "LET " : "    "}${definition}`),
        ...conjunction.map((conjunct, index) => `${index === 0 ? "IN  " : "    "}/\\ ${conjunct}`),
      ];
};

export const compile = (source: string): CompiledSpec => {
  const sourceFile = ts.createSourceFile(FILE_NAME, source, ts.ScriptTarget.ESNext, true);
  const host = ts.createCompilerHost(COMPILER_OPTIONS);
  const program = ts.createProgram({
    rootNames: [FILE_NAME],
    options: COMPILER_OPTIONS,
    host: {
      ...host,
      getSourceFile: (fileName, languageVersion) =>
        fileName === FILE_NAME ? sourceFile : host.getSourceFile(fileName, languageVersion),
      fileExists: (fileName) => fileName === FILE_NAME || host.fileExists(fileName),
      readFile: (fileName) => (fileName === FILE_NAME ? source : host.readFile(fileName)),
    },
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) throw new TsproverError(ts.formatDiagnostics(diagnostics, host));
  const checker = program.getTypeChecker();

  const variables: Variable[] = [];
  const definitions: Definition[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) continue;
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name !== undefined &&
      statement.body !== undefined &&
      isExported(statement)
    ) {
      definitions.push({ name: statement.name.text, node: statement, body: statement.body });
      continue;
    }
    if (!ts.isVariableStatement(statement)) {
      throw new TsproverError(
        `${getLocation(statement)} Unsupported statement: ${statement.getText()}`,
      );
    }
    const isLet = (statement.declarationList.flags & ts.NodeFlags.Let) !== 0;
    for (const declaration of statement.declarationList.declarations) {
      const initializer = declaration.initializer;
      if (isLet && !isExported(declaration) && ts.isIdentifier(declaration.name)) {
        variables.push({ name: declaration.name.text, declaration });
        continue;
      }
      if (
        !isLet &&
        isExported(declaration) &&
        ts.isIdentifier(declaration.name) &&
        initializer !== undefined &&
        (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
      ) {
        definitions.push({
          name: declaration.name.text,
          node: initializer,
          body: initializer.body,
        });
        continue;
      }
      throw new TsproverError(
        `${getLocation(declaration)} Unsupported declaration: ${declaration.getText()}`,
      );
    }
  }

  const scope: Scope = {
    values: new Map(variables.map((variable) => [variable.name, variable.name])),
    locals: new Set(),
  };
  const actions: string[] = [];
  const invariants: string[] = [];
  const operators: string[] = [];
  for (const definition of definitions) {
    const parameters = definition.node.parameters.map((parameter) => {
      if (
        !ts.isIdentifier(parameter.name) ||
        parameter.initializer !== undefined ||
        parameter.questionToken !== undefined ||
        parameter.dotDotDotToken !== undefined
      ) {
        throw new TsproverError(
          `${getLocation(parameter)} Unsupported parameter: ${parameter.getText()}`,
        );
      }
      if (scope.values.has(parameter.name.text)) {
        throw new TsproverError(
          `${getLocation(parameter.name)} ${parameter.name.text} shadows a state variable`,
        );
      }
      return { name: parameter.name.text, domain: getDomain(parameter, checker) };
    });
    const body = definition.body;
    const returned = !ts.isBlock(body)
      ? body
      : body.statements.length === 1 && ts.isReturnStatement(body.statements[0])
        ? body.statements[0].expression
        : undefined;
    if (returned !== undefined && parameters.length > 0) {
      throw new TsproverError(
        `${getLocation(definition.node.parameters[0])} Invariants can't take parameters`,
      );
    }
    if (returned !== undefined) {
      invariants.push(definition.name);
      operators.push(`${definition.name} == ${translateExpression(returned, scope)}`);
      continue;
    }
    if (!ts.isBlock(body)) {
      throw new TsproverError(`${getLocation(body)} Unsupported function body`);
    }
    const lines = translateAction(
      body.statements,
      variables,
      parameters.map((parameter) => parameter.name),
    );
    const bindings = parameters.map((parameter) => `${parameter.name} \\in ${parameter.domain}`);
    const quantified =
      parameters.length === 0
        ? lines
        : [`\\E ${bindings.join(", ")} :`, ...lines.map((line) => `  ${line}`)];
    actions.push(definition.name);
    operators.push(`${definition.name} ==\n${quantified.map((line) => `  ${line}`).join("\n")}`);
  }

  const init = variables.map((variable) =>
    variable.declaration.initializer === undefined
      ? `  /\\ ${variable.name} \\in ${getDomain(variable.declaration, checker)}`
      : `  /\\ ${variable.name} = ${translateExpression(variable.declaration.initializer, scope)}`,
  );
  const next = actions.map((action) => `  \\/ ${action}`);
  return {
    source: [
      "---- MODULE Spec ----",
      "EXTENDS Integers",
      ...(variables.length > 0
        ? [`VARIABLES ${variables.map((variable) => variable.name).join(", ")}`]
        : []),
      `Init ==\n${init.length > 0 ? init.join("\n") : "  TRUE"}`,
      ...operators,
      `Next ==\n${next.length > 0 ? next.join("\n") : "  FALSE"}`,
      "====",
    ].join("\n"),
    config: [
      "INIT Init",
      "NEXT Next",
      ...(invariants.length > 0 ? [`INVARIANTS ${invariants.join(" ")}`] : []),
    ].join("\n"),
  };
};
