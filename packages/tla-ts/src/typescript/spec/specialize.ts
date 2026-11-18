import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../../errors";
import type { GeneratedDefinition } from "./library";

// Specializes ESCore's evaluation rules to a program: each syntax node gives the TLA+ that ESCore's
// Evaluate rule for its kind leaves once the node is known, with the evaluation of each child in
// place of Evaluate(s, ctx, child). The runtime values still go through ESCore's operators, so
// only what the syntax says folds away.

// TLA+ text of an evaluation in the state and context that the two expressions give, whose result
// is a record [s, c].
interface Code {
  (state: string, context: string): string;
}

interface Scope {
  isStrict: boolean;
  // The code ids of the functions that the scope's code is in, outermost first.
  isClassBody: boolean;
}

interface NamedCode {
  (state: string, context: string, name: string): string;
}

// TLA+ text of binding the value that the third expression gives to a binding's names, in the
// environment the fourth gives, or by assignment where it's NoEnv.
interface BindingCode {
  (state: string, context: string, value: string, env: string): string;
}

// TLA+ text of assigning the value the third expression gives to a destructuring pattern.
interface PatternCode {
  (state: string, context: string, value: string): string;
}

interface FunctionLike {
  node: ts.Node;
  parameters: readonly ts.ParameterDeclaration[];
  body: ts.ConciseBody | undefined;
  kind: "normal" | "arrow" | "method" | "constructor" | "get" | "set" | "staticBlock";
}

interface LexicalDeclaration {
  names: string[];
  isConst: boolean;
  fn: ts.FunctionDeclaration | undefined;
}

export interface SpecializedProgram {
  definitions: GeneratedDefinition[];
  words: Set<string>;
  // The names the program's identifiers resolve, which may be the global object's.
  identifiers: Set<string>;
}

const getUnits = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

const getStr = (text: string) => `Str(${getUnits(text)})`;

const getLimbs = (value: bigint) => {
  const limbs: number[] = [];
  for (let rest = value; rest > 0n; rest >>= 15n) limbs.push(Number(rest & 32767n));
  return `<<${limbs.join(", ")}>>`;
};

const getNumberRecord = (
  kind: string,
  isNegative: boolean,
  integer: number,
  mantissa: bigint,
  exponent: number,
) =>
  `[k |-> "${kind}", neg |-> ${isNegative ? "TRUE" : "FALSE"}, i |-> ${integer}, m |-> ${getLimbs(mantissa)}, e |-> ${exponent}]`;

// A Number as ESNumber's canonical record, as test262-parse-node gives a literal.
export const getNumber = (value: number) => {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  const bits = view.getBigUint64(0);
  const isNegative = bits >> 63n === 1n;
  const biasedExponent = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & ((1n << 52n) - 1n);
  if (biasedExponent === 0x7ff) {
    return fraction === 0n
      ? getNumberRecord("inf", isNegative, 0, 0n, 0)
      : getNumberRecord("nan", false, 0, 0n, 0);
  }
  if (Object.is(value, -0)) return getNumberRecord("nzero", true, 0, 0n, 0);
  if (Number.isInteger(value) && Math.abs(value) < 2 ** 30) {
    return getNumberRecord("int", value < 0, value, 0n, 0);
  }
  const significand = biasedExponent === 0 ? fraction : fraction | (1n << 52n);
  const binary = significand.toString(2);
  const zeros = binary.length - binary.replace(/0+$/, "").length;
  return getNumberRecord(
    "fin",
    isNegative,
    0,
    significand >> BigInt(zeros),
    Math.max(biasedExponent, 1) - 1075 + zeros,
  );
};

const getBool = (value: boolean) => (value ? "TRUE" : "FALSE");

const getSequence = (items: string[]) => `<<${items.join(", ")}>>`;

const BINARY_OPERATORS = new Map([
  [ts.SyntaxKind.PlusToken, "+"],
  [ts.SyntaxKind.MinusToken, "-"],
  [ts.SyntaxKind.AsteriskToken, "*"],
  [ts.SyntaxKind.SlashToken, "/"],
  [ts.SyntaxKind.PercentToken, "%"],
  [ts.SyntaxKind.AsteriskAsteriskToken, "**"],
  [ts.SyntaxKind.LessThanLessThanToken, "<<"],
  [ts.SyntaxKind.GreaterThanGreaterThanToken, ">>"],
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken, ">>>"],
  [ts.SyntaxKind.AmpersandToken, "&"],
  [ts.SyntaxKind.CaretToken, "^"],
  [ts.SyntaxKind.BarToken, "|"],
]);

const COMPOUND_OPERATORS = new Map([
  [ts.SyntaxKind.PlusEqualsToken, "+"],
  [ts.SyntaxKind.MinusEqualsToken, "-"],
  [ts.SyntaxKind.AsteriskEqualsToken, "*"],
  [ts.SyntaxKind.SlashEqualsToken, "/"],
  [ts.SyntaxKind.PercentEqualsToken, "%"],
  [ts.SyntaxKind.AsteriskAsteriskEqualsToken, "**"],
  [ts.SyntaxKind.LessThanLessThanEqualsToken, "<<"],
  [ts.SyntaxKind.GreaterThanGreaterThanEqualsToken, ">>"],
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken, ">>>"],
  [ts.SyntaxKind.AmpersandEqualsToken, "&"],
  [ts.SyntaxKind.CaretEqualsToken, "^"],
  [ts.SyntaxKind.BarEqualsToken, "|"],
]);

const RELATIONAL_OPERATORS = new Map([
  [ts.SyntaxKind.LessThanToken, "<"],
  [ts.SyntaxKind.GreaterThanToken, ">"],
  [ts.SyntaxKind.LessThanEqualsToken, "<="],
  [ts.SyntaxKind.GreaterThanEqualsToken, ">="],
  [ts.SyntaxKind.InstanceOfKeyword, "instanceof"],
  [ts.SyntaxKind.InKeyword, "in"],
]);

const EQUALITY_OPERATORS = new Map([
  [ts.SyntaxKind.EqualsEqualsEqualsToken, "==="],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, "!=="],
  [ts.SyntaxKind.EqualsEqualsToken, "=="],
  [ts.SyntaxKind.ExclamationEqualsToken, "!="],
]);

// The test that decides whether a logical operator, or its assignment, keeps the left value.
const LOGICAL_TESTS = new Map([
  [ts.SyntaxKind.AmpersandAmpersandToken, (value: string) => `~ToBooleanValue(${value})`],
  [ts.SyntaxKind.BarBarToken, (value: string) => `ToBooleanValue(${value})`],
  [ts.SyntaxKind.QuestionQuestionToken, (value: string) => `~IsNullish(${value})`],
  [ts.SyntaxKind.AmpersandAmpersandEqualsToken, (value: string) => `~ToBooleanValue(${value})`],
  [ts.SyntaxKind.BarBarEqualsToken, (value: string) => `ToBooleanValue(${value})`],
  [ts.SyntaxKind.QuestionQuestionEqualsToken, (value: string) => `~IsNullish(${value})`],
]);

const hasUseStrict = (statements: readonly ts.Statement[]) => {
  for (const statement of statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression))
      return false;
    if (statement.expression.getText().slice(1, -1) === "use strict") return true;
  }
  return false;
};

// BoundNames (§8.2.1) of a binding: its name, or the names its pattern binds, in order.
const getBoundNames = (name: ts.BindingName): string[] =>
  ts.isIdentifier(name)
    ? [name.text]
    : name.elements.flatMap((element) =>
        ts.isOmittedExpression(element) ? [] : getBoundNames(element.name),
      );

// The names a declaration list binds, in order.
const getDeclaredNames = (list: ts.VariableDeclarationList) =>
  list.declarations.flatMap((declaration) => getBoundNames(declaration.name));

// Whether a binding holds an initializer or a computed key (ContainsExpression, §8.5.2).
const containsExpression = (node: ts.Node): boolean =>
  ts.isBindingElement(node) &&
  (node.initializer !== undefined ||
    (node.propertyName !== undefined && ts.isComputedPropertyName(node.propertyName)))
    ? true
    : (ts.forEachChild(node, (child) => (containsExpression(child) ? true : undefined)) ?? false);

const isLexical = (list: ts.VariableDeclarationList) =>
  (list.flags & ts.NodeFlags.BlockScoped) !== 0;

const isConst = (list: ts.VariableDeclarationList) =>
  (list.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.Const;

const isUsing = (list: ts.VariableDeclarationList) => {
  const kind = list.flags & ts.NodeFlags.BlockScoped;
  return kind === ts.NodeFlags.Using || kind === ts.NodeFlags.AwaitUsing;
};

// VarScopedDeclarations (§8.2.7) of a function body or script: the var names, and the function
// declarations at its top level, in order.
const getVarScoped = (statements: readonly ts.Statement[]) => {
  const names: string[] = [];
  const functions: ts.FunctionDeclaration[] = [];
  const visitStatement = (statement: ts.Statement, isTopLevel: boolean): void => {
    if (ts.isFunctionDeclaration(statement)) {
      if (isTopLevel) {
        functions.push(statement);
        names.push(statement.name?.text ?? "*default*");
      }
      return;
    }
    if (ts.isLabeledStatement(statement)) return visitStatement(statement.statement, isTopLevel);
    if (ts.isVariableStatement(statement)) {
      if (!isLexical(statement.declarationList))
        names.push(...getDeclaredNames(statement.declarationList));
      return;
    }
    if (
      ts.isForStatement(statement) ||
      ts.isForInStatement(statement) ||
      ts.isForOfStatement(statement)
    ) {
      const initializer = statement.initializer;
      if (
        initializer !== undefined &&
        ts.isVariableDeclarationList(initializer) &&
        !isLexical(initializer)
      ) {
        names.push(...getDeclaredNames(initializer));
      }
      visitStatement(statement.statement, false);
      return;
    }
    if (ts.isClassDeclaration(statement)) return;
    ts.forEachChild(statement, (child) => {
      if (
        ts.isBlock(child) ||
        ts.isCaseBlock(child) ||
        ts.isCaseClause(child) ||
        ts.isDefaultClause(child) ||
        ts.isCatchClause(child)
      ) {
        ts.forEachChild(child, (inner) => {
          if (ts.isStatement(inner)) visitStatement(inner, false);
          else if (ts.isCaseClause(inner) || ts.isDefaultClause(inner) || ts.isBlock(inner)) {
            inner.forEachChild((clauseChild) => {
              if (ts.isStatement(clauseChild)) visitStatement(clauseChild, false);
            });
          }
        });
      } else if (ts.isStatement(child)) visitStatement(child, false);
    });
  };
  statements.forEach((statement) => visitStatement(statement, true));
  return { names, functions };
};

// LexicallyScopedDeclarations (§8.2.5) of a statement list: each let, const, or class declaration,
// with a function declaration too where the list is a block's.
const getLexicalDeclarations = (statements: readonly ts.Statement[], isBlock: boolean) =>
  statements.flatMap((statement): LexicalDeclaration[] => {
    const inner = ts.isLabeledStatement(statement) ? statement.statement : statement;
    if (ts.isVariableStatement(inner) && isLexical(inner.declarationList)) {
      if (isUsing(inner.declarationList)) {
        throw new TlaTypeScriptError(
          "tla-ts can't compile a using declaration to ESCore yet",
          inner,
        );
      }
      return [
        {
          names: getDeclaredNames(inner.declarationList),
          isConst: isConst(inner.declarationList),
          fn: undefined,
        },
      ];
    }
    if (ts.isClassDeclaration(inner) && inner.name !== undefined) {
      return [{ names: [inner.name.text], isConst: false, fn: undefined }];
    }
    if (isBlock && ts.isFunctionDeclaration(inner)) {
      return [{ names: [inner.name?.text ?? "*default*"], isConst: false, fn: inner }];
    }
    return [];
  });

// The function declarations in blocks that Annex B hoists to the var scope of a function body or
// script outside strict mode (HoistableFunctions in ESCore, §B.3.2.1), each one whose name nothing
// around it declares lexically, as replacing it with a var wouldn't be an early error.
const getHoistableFunctions = (statements: readonly ts.Statement[]) => {
  const inList = (
    items: readonly ts.Statement[],
    blocked: ReadonlySet<string>,
  ): ts.FunctionDeclaration[] => {
    const names = getLexicalDeclarations(items, true).flatMap((declaration) => declaration.names);
    const around = new Set([...blocked, ...names]);
    return items.flatMap((item) => {
      if (!ts.isFunctionDeclaration(item)) return inStatement(item, around);
      const name = item.name?.text ?? "*default*";
      return !blocked.has(name) && names.filter((other) => other === name).length === 1
        ? [item]
        : [];
    });
  };
  const inClause = (clause: ts.Statement, blocked: ReadonlySet<string>) =>
    ts.isFunctionDeclaration(clause) ? inList([clause], blocked) : inStatement(clause, blocked);
  const inStatement = (
    node: ts.Statement,
    blocked: ReadonlySet<string>,
  ): ts.FunctionDeclaration[] => {
    if (ts.isBlock(node)) return inList(node.statements, blocked);
    if (ts.isIfStatement(node)) {
      return [
        ...inClause(node.thenStatement, blocked),
        ...(node.elseStatement === undefined ? [] : inClause(node.elseStatement, blocked)),
      ];
    }
    if (ts.isWhileStatement(node) || ts.isDoStatement(node) || ts.isWithStatement(node)) {
      return inStatement(node.statement, blocked);
    }
    if (ts.isLabeledStatement(node)) return inStatement(node.statement, blocked);
    if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) {
      const initializer = node.initializer;
      const names =
        initializer !== undefined &&
        ts.isVariableDeclarationList(initializer) &&
        isLexical(initializer)
          ? getDeclaredNames(initializer)
          : [];
      return inStatement(node.statement, new Set([...blocked, ...names]));
    }
    if (ts.isSwitchStatement(node)) {
      return inList(
        node.caseBlock.clauses.flatMap((clause) => [...clause.statements]),
        blocked,
      );
    }
    if (ts.isTryStatement(node)) {
      const parameter = node.catchClause?.variableDeclaration;
      // §B.3.4: a var may repeat a catch parameter that is a lone identifier.
      const caught =
        parameter === undefined || ts.isIdentifier(parameter.name)
          ? []
          : getBoundNames(parameter.name);
      return [
        ...inList(node.tryBlock.statements, blocked),
        ...(node.catchClause === undefined
          ? []
          : inList(node.catchClause.block.statements, new Set([...blocked, ...caught]))),
        ...(node.finallyBlock === undefined ? [] : inList(node.finallyBlock.statements, blocked)),
      ];
    }
    return [];
  };
  const blocked = new Set(
    getLexicalDeclarations(statements, false).flatMap((declaration) => declaration.names),
  );
  return statements.flatMap((statement) => inStatement(statement, blocked));
};

// The function declarations to initialize (§10.2.11 step 15): the last of each name, in the order
// of the last ones.
const getFunctionsToInitialize = (functions: ts.FunctionDeclaration[]) => {
  const seen = new Set<string>();
  const picked: ts.FunctionDeclaration[] = [];
  for (let index = functions.length - 1; index >= 0; index--) {
    const name = functions[index].name?.text ?? "*default*";
    if (seen.has(name)) continue;
    seen.add(name);
    picked.unshift(functions[index]);
  }
  return picked;
};

const dedupe = (names: string[]) => [...new Set(names)];

// Whether code may read the arguments object: it names arguments, outside a nested function
// that isn't an arrow, or it calls eval.
const getMayUseArguments = (node: ts.Node): boolean => {
  if (ts.isIdentifier(node)) return node.text === "arguments";
  if (
    (ts.isFunctionLike(node) && !ts.isArrowFunction(node)) ||
    ts.isClassStaticBlockDeclaration(node)
  )
    return false;
  if (ts.isPropertyDeclaration(node))
    return (
      node.name !== undefined &&
      ts.isComputedPropertyName(node.name) &&
      getMayUseArguments(node.name)
    );
  return ts.forEachChild(node, (child) => (getMayUseArguments(child) ? true : undefined)) ?? false;
};

const isAnonymousFunctionDefinition = (node: ts.Expression): boolean => {
  const inner = ts.isParenthesizedExpression(node) ? node.expression : node;
  if (ts.isParenthesizedExpression(node)) return isAnonymousFunctionDefinition(inner);
  return (
    ((ts.isFunctionExpression(inner) || ts.isClassExpression(inner)) && inner.name === undefined) ||
    ts.isArrowFunction(inner)
  );
};

const getLiteralKey = (name: ts.PropertyName) => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name))
    return name.text;
  if (ts.isNumericLiteral(name)) return String(Number(name.text));
  if (ts.isBigIntLiteral(name)) return BigInt(name.text.slice(0, -1)).toString();
  return undefined;
};

export const specialize = (sourceFile: ts.SourceFile): SpecializedProgram => {
  const definitions: GeneratedDefinition[] = [];
  const words = new Set<string>();
  const identifiers = new Set<string>();
  const codes: { id: number; body: string }[] = [];
  const loops: { id: number; body: string }[] = [];
  let count = 0;
  let templateSites = 0;

  // A function declaration's site, which the state's hoisted pairs with a var environment: where
  // the declaration starts in the program.
  const getSite = (node: ts.Node) => node.getStart();

  // A node's source text, as a slice of the program's, which SourceText holds once.
  const getSourceText = (node: ts.Node) =>
    `SubSeq(SourceText, ${node.getStart() + 1}, ${node.getEnd()})`;

  // A function's code record, which the module evaluates once, as it has no parameters.
  const defineRecord = (id: number, isStrict: boolean, length: number, sourceText: string) => {
    definitions.push({
      name: `CodeRecord${id}`,
      arity: 0,
      text: `CodeRecord${id} == [id |-> ${id}, strict |-> ${getBool(isStrict)}, kind |-> "normal", length |-> ${length}, sourceText |-> ${sourceText}]`,
    });
    return `CodeRecord${id}`;
  };

  const define = (prefix: string, parameters: string[], body: string) => {
    count += 1;
    const name = `${prefix}${count}`;
    definitions.push({
      name,
      arity: parameters.length,
      text: `${name}(${parameters.join(", ")}) ==\n  ${body}`,
    });
    return name;
  };
  const defineCode = (prefix: string, body: string): Code => {
    const name = define(prefix, ["s", "ctx"], body);
    return (state, context) => `${name}(${state}, ${context})`;
  };

  // Evaluate (§13): a result whose value may be a Reference Record.
  const reference = (node: ts.Expression, scope: Scope): Code => {
    if (ts.isIdentifier(node)) {
      words.add(node.text);
      identifiers.add(node.text);
      return (state, context) =>
        `ResolveBinding(${state}, ${context}, ${getUnits(node.text)}, ${getBool(scope.isStrict)})`;
    }
    if (ts.isParenthesizedExpression(node)) return reference(node.expression, scope);
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      return chainRoot(node, member(node, scope));
    }
    if (ts.isCallExpression(node)) return chainRoot(node, call(node, scope));
    return value(node, scope);
  };

  // A node that ends an optional chain turns the chain's short circuit, a completion of type
  // "nullish", into undefined (§13.3.9.1).
  const chainRoot = (node: ts.Expression, code: Code): Code => {
    const isChain = (node.flags & ts.NodeFlags.OptionalChain) !== 0;
    const parent = node.parent;
    const isInner =
      isChain &&
      (ts.isPropertyAccessExpression(parent) ||
        ts.isElementAccessExpression(parent) ||
        ts.isCallExpression(parent)) &&
      (parent.flags & ts.NodeFlags.OptionalChain) !== 0 &&
      (ts.isCallExpression(parent) ? parent.expression === node : parent.expression === node);
    if (!isChain || isInner) return code;
    return defineCode(
      "Chain",
      `LET r == ${code("s", "ctx")} IN IF r.c.type = "nullish" THEN Ok(r.s, Undefined) ELSE r`,
    );
  };

  // The base of a member access: its value, short-circuiting where the link is ?. and the value
  // is nullish.
  const chainBase = (node: ts.Expression, isOptional: boolean, scope: Scope): Code => {
    const base = value(node, scope);
    if (!isOptional) return base;
    return defineCode(
      "Optional",
      `LET r == ${base("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE IF IsNullish(Val(r)) THEN Abrupt(r.s, Completion("nullish", Undefined, Empty)) ELSE r`,
    );
  };

  // Property accessors (§13.3.2) and super properties (§13.3.7).
  const member = (
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    scope: Scope,
  ): Code => {
    const strict = getBool(scope.isStrict);
    if (ts.isPropertyAccessExpression(node) && ts.isPrivateIdentifier(node.name)) {
      const base = chainBase(node.expression, node.questionDotToken !== undefined, scope);
      return defineCode(
        "Member",
        `LET r == ${base("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, Reference(Val(r), ${getPrivateName(node.name, "r.s", "ctx")}, TRUE, Empty))`,
      );
    }
    const key = ts.isPropertyAccessExpression(node)
      ? (() => {
          words.add(node.name.text);
          return undefined;
        })()
      : value(node.argumentExpression, scope);
    if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
      const keyCode =
        key === undefined
          ? (state: string) =>
              `Ok(${state}, ${getStr((node as ts.PropertyAccessExpression).name.text)})`
          : (state: string, context: string) => key(state, context);
      return defineCode(
        "Super",
        `LET env == GetThisEnvironment(s, ctx.lex) actualThis == GetThisBinding(s, env) IN IF IsAbrupt(actualThis) THEN actualThis ELSE SuperKeyThen(env, Val(actualThis), ${strict}, ${keyCode("actualThis.s", "ctx")})`,
      );
    }
    const base = chainBase(node.expression, node.questionDotToken !== undefined, scope);
    if (ts.isPropertyAccessExpression(node)) {
      return defineCode(
        "Member",
        `LET r == ${base("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, Reference(Val(r), ${getStr(node.name.text)}, ${strict}, Empty))`,
      );
    }
    if (key === undefined)
      throw new TlaTypeScriptError("tla-ts can't compile this member access", node);
    return defineCode(
      "Member",
      `LET r == ${base("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE MemberKeyThen(Val(r), ${strict}, ${key("r.s", "ctx")})`,
    );
  };

  // ArgumentListEvaluation (§13.3.8.1): a result whose value is the list of arguments.
  const argumentList = (args: readonly ts.Expression[], scope: Scope): Code => {
    if (args.length === 0) return (state) => `Ok(${state}, <<>>)`;
    const steps: string[] = [];
    let state = "s";
    let list = "<<>>";
    args.forEach((argument, index) => {
      const name = `a${index + 1}`;
      if (ts.isSpreadElement(argument)) {
        steps.push(
          `LET ${name} == ${value(argument.expression, scope)(state, "ctx")} IN IF IsAbrupt(${name}) THEN ${name} ELSE`,
          `LET ${name}i == GetIterator(${name}.s, Val(${name}), "sync") IN IF IsAbrupt(${name}i) THEN ${name}i ELSE`,
          `LET ${name}l == IteratorToList(${name}i.s, Val(${name}i), <<>>) IN IF IsAbrupt(${name}l) THEN ${name}l ELSE`,
        );
        list = `${list} \\o Val(${name}l)`;
        state = `${name}l.s`;
      } else {
        steps.push(
          `LET ${name} == ${value(argument, scope)(state, "ctx")} IN IF IsAbrupt(${name}) THEN ${name} ELSE`,
        );
        list = list === "<<>>" ? `<<Val(${name})>>` : `Append(${list}, Val(${name}))`;
        state = `${name}.s`;
      }
    });
    return defineCode("Arguments", `${steps.join("\n  ")}\n  Ok(${state}, ${list})`);
  };

  // Function calls (§13.3.6) and super calls (§13.3.7.1).
  const call = (node: ts.CallExpression, scope: Scope): Code => {
    const args = argumentList(node.arguments, scope);
    if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
      return defineCode(
        "SuperCall",
        `LET thisEnv == GetThisEnvironment(s, ctx.lex) IN SuperCallThen(thisEnv, O(s, E(s, thisEnv).fn).proto, E(s, thisEnv).newTarget, ${args("s", "ctx")})`,
      );
    }
    if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      throw new TlaTypeScriptError("tla-ts can't compile import() to ESCore yet", node);
    }
    const callee = ts.isParenthesizedExpression(node.expression)
      ? node.expression.expression
      : node.expression;
    if (ts.isIdentifier(callee) && callee.text === "eval") {
      throw new TlaTypeScriptError("tla-ts can't run eval", node);
    }
    const base = reference(node.expression, scope);
    const shortCircuit =
      node.questionDotToken === undefined
        ? ""
        : `IF IsNullish(Val(f)) THEN Abrupt(f.s, Completion("nullish", Undefined, Empty)) ELSE `;
    return defineCode(
      "Call",
      `LET r == ${base("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE LET f == GetValue(r.s, Val(r)) IN IF IsAbrupt(f) THEN f ELSE ${shortCircuit}CallArgumentsThen(Val(f), CallThisValue(f.s, Val(r)), FALSE, ${args("f.s", "ctx")})`,
    );
  };

  // NamedEvaluation (§8.4.5) where the node is an anonymous function definition, with the name
  // that the TLA+ expression gives, and otherwise the node's value.
  const named = (node: ts.Expression, scope: Scope, name: string): Code => {
    if (ts.isParenthesizedExpression(node)) return named(node.expression, scope, name);
    if (!isAnonymousFunctionDefinition(node)) return value(node, scope);
    const make = ts.isClassExpression(node)
      ? classDefinition(node, undefined)
      : functionExpression(node as ts.FunctionExpression | ts.ArrowFunction, scope);
    return (state, context) => make(state, context, name);
  };

  // The value of an initializer for a binding target where the value v is undefined: named by
  // the target when the target is a single name.
  const initialized = (
    initializer: ts.Expression | undefined,
    target: ts.Node,
    scope: Scope,
    result: string,
  ) => {
    if (initializer === undefined) return result;
    const code = ts.isIdentifier(target)
      ? named(initializer, scope, getStr(target.text))
      : value(initializer, scope);
    return `IF Val(${result}) = Undefined THEN ${code(`${result}.s`, "ctx")} ELSE ${result}`;
  };

  // BindingInitialization (§8.6.2): a result once a binding's names hold the value.
  const binding = (name: ts.BindingName, scope: Scope): BindingCode => {
    const strict = getBool(scope.isStrict);
    if (ts.isIdentifier(name)) {
      words.add(name.text);
      return (state, context, bound, env) =>
        `InitializeBoundName(${state}, ${context}, ${getUnits(name.text)}, ${bound}, ${env}, ${strict})`;
    }
    const steps: string[] = [];
    if (ts.isObjectBindingPattern(name)) {
      steps.push("LET c == RequireObjectCoercible(s, value) IN IF IsAbrupt(c) THEN c ELSE");
      let state = "c.s";
      const keys: string[] = [];
      name.elements.forEach((element, index) => {
        const id = index + 1;
        const push = (step: string, result: string) => {
          steps.push(`LET ${result} == ${step} IN IF IsAbrupt(${result}) THEN ${result} ELSE`);
          state = `${result}.s`;
        };
        if (element.dotDotDotToken !== undefined) {
          // RestBindingInitialization (§14.3.3.2).
          const units = getUnits(getBoundNames(element.name)[0]);
          push(`ResolveBindingIn(${state}, ctx, ${units}, env, ${strict})`, `l${id}`);
          steps.push(
            `LET o${id} == OrdinaryObjectCreate(${state}, Intrinsic(${state}, "ObjectPrototype")) IN`,
          );
          push(`CopyDataProperties(o${id}.s, Val(o${id}), value, ${getSequence(keys)})`, `r${id}`);
          push(`BindReference(${state}, Val(l${id}), Val(o${id}), env)`, `b${id}`);
          return;
        }
        const key =
          element.propertyName === undefined
            ? (current: string) => `Ok(${current}, ${getStr(getBoundNames(element.name)[0])})`
            : propertyKey(element.propertyName, scope);
        push(key(state, "ctx"), `k${id}`);
        keys.push(`Val(k${id})`);
        // KeyedBindingInitialization (§14.3.3.3).
        if (ts.isIdentifier(element.name)) {
          words.add(element.name.text);
          push(
            `ResolveBindingIn(${state}, ctx, ${getUnits(element.name.text)}, env, ${strict})`,
            `l${id}`,
          );
          push(`GetValueProperty(${state}, value, Val(k${id}))`, `v${id}`);
          push(initialized(element.initializer, element.name, scope, `v${id}`), `w${id}`);
          push(`BindReference(${state}, Val(l${id}), Val(w${id}), env)`, `b${id}`);
          return;
        }
        const nested = binding(element.name, scope);
        push(`GetValueProperty(${state}, value, Val(k${id}))`, `v${id}`);
        push(initialized(element.initializer, element.name, scope, `v${id}`), `w${id}`);
        push(nested(state, "ctx", `Val(w${id})`, "env"), `b${id}`);
      });
      steps.push(`Ok(${state}, Empty)`);
    } else {
      // IteratorBindingInitialization (§8.6.4) over the pattern's elements, which closes the
      // iterator that the elements leave undone.
      steps.push(
        `LET it == GetIterator(s, value, "sync") IN IF IsAbrupt(it) THEN it ELSE`,
        "LET e0 == [s |-> it.s, c |-> NormalCompletion(Empty), it |-> Val(it)] IN",
      );
      let previous = "e0";
      name.elements.forEach((element, index) => {
        const id = index + 1;
        const step = (() => {
          if (ts.isOmittedExpression(element)) {
            return `LET n${id} == IteratorNextForBinding(${previous}.s, ${previous}.it) IN IF IsAbrupt(n${id}) THEN n${id} ELSE WithIt(Ok(n${id}.s, Empty), n${id}.it)`;
          }
          if (element.dotDotDotToken !== undefined) {
            const collect = (current: string) =>
              `LET a${id} == ArrayCreate(${current}, 0, Intrinsic(${current}, "ArrayPrototype")) rest${id} == CollectRest(a${id}.s, Val(a${id}), ${previous}.it, 0) IN IF IsAbrupt(rest${id}) THEN rest${id} ELSE`;
            if (ts.isIdentifier(element.name)) {
              return `LET l${id} == ResolveBindingIn(${previous}.s, ctx, ${getUnits(element.name.text)}, env, ${strict}) IN IF IsAbrupt(l${id}) THEN WithIt(l${id}, ${previous}.it) ELSE ${collect(`l${id}.s`)} WithIt(BindReference(rest${id}.s, Val(l${id}), Val(a${id}), env), rest${id}.it)`;
            }
            return `${collect(`${previous}.s`)} WithIt(${binding(element.name, scope)(`rest${id}.s`, "ctx", `Val(a${id})`, "env")}, rest${id}.it)`;
          }
          if (ts.isIdentifier(element.name)) {
            words.add(element.name.text);
            return `LET l${id} == ResolveBindingIn(${previous}.s, ctx, ${getUnits(element.name.text)}, env, ${strict}) IN IF IsAbrupt(l${id}) THEN WithIt(l${id}, ${previous}.it) ELSE LET n${id} == IteratorNextForBinding(l${id}.s, ${previous}.it) IN IF IsAbrupt(n${id}) THEN n${id} ELSE IteratorBindThen(Val(l${id}), env, n${id}.it, ${initialized(element.initializer, element.name, scope, `n${id}`)})`;
          }
          return `LET n${id} == IteratorNextForBinding(${previous}.s, ${previous}.it) IN IF IsAbrupt(n${id}) THEN n${id} ELSE LET w${id} == ${initialized(element.initializer, element.name, scope, `n${id}`)} IN IF IsAbrupt(w${id}) THEN WithIt(w${id}, n${id}.it) ELSE WithIt(${binding(element.name, scope)(`w${id}.s`, "ctx", `Val(w${id})`, "env")}, n${id}.it)`;
        })();
        steps.push(
          `LET e${id} == ${step} IN IF IsAbrupt(e${id}) THEN IteratorEndThen(e${id}) ELSE`,
        );
        previous = `e${id}`;
      });
      steps.push(`IteratorEndThen(${previous})`);
    }
    const operator = define("Pattern", ["s", "ctx", "value", "env"], steps.join("\n  "));
    return (state, context, bound, env) => `${operator}(${state}, ${context}, ${bound}, ${env})`;
  };

  // The target of a destructuring assignment: a pattern, or what its reference evaluates to.
  const getTarget = (node: ts.Expression) => {
    const target =
      ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
        ? node.left
        : node;
    const initializer = target === node ? undefined : (node as ts.BinaryExpression).right;
    const inner = ts.isParenthesizedExpression(target) ? target.expression : target;
    return {
      target,
      initializer,
      isPattern: ts.isObjectLiteralExpression(inner) || ts.isArrayLiteralExpression(inner),
      inner,
    };
  };

  // DestructuringAssignmentEvaluation (§13.15.5.2): a result once the pattern's targets hold
  // the value.
  const destructuring = (
    node: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression,
    scope: Scope,
  ): PatternCode => {
    const strict = getBool(scope.isStrict);
    const evaluateTarget = (target: ReturnType<typeof getTarget>) =>
      target.isPattern
        ? (current: string) => `Ok(${current}, Empty)`
        : reference(target.target, scope);
    // AssignTargetThen: a pattern destructures the value, and a reference gets it.
    const assign = (
      target: ReturnType<typeof getTarget>,
      state: string,
      ref: string,
      assigned: string,
    ) =>
      target.isPattern
        ? destructuring(
            target.inner as ts.ObjectLiteralExpression | ts.ArrayLiteralExpression,
            scope,
          )(state, "ctx", assigned)
        : `PutValue(${state}, ${ref}, ${assigned})`;
    const steps: string[] = [];
    if (ts.isObjectLiteralExpression(node)) {
      steps.push("LET c == RequireObjectCoercible(s, value) IN IF IsAbrupt(c) THEN c ELSE");
      let state = "c.s";
      const keys: string[] = [];
      node.properties.forEach((property, index) => {
        const id = index + 1;
        const push = (step: string, result: string) => {
          steps.push(`LET ${result} == ${step} IN IF IsAbrupt(${result}) THEN ${result} ELSE`);
          state = `${result}.s`;
        };
        if (ts.isShorthandPropertyAssignment(property)) {
          const name = property.name.text;
          words.add(name);
          push(`ResolveBinding(${state}, ctx, ${getUnits(name)}, ${strict})`, `l${id}`);
          push(`GetValueProperty(${state}, value, ${getStr(name)})`, `v${id}`);
          push(
            `PutValueThen(Val(l${id}), ${initialized(property.objectAssignmentInitializer, property.name, scope, `v${id}`)})`,
            `p${id}`,
          );
          keys.push(getStr(name));
          return;
        }
        if (ts.isSpreadAssignment(property)) {
          const target = getTarget(property.expression);
          push(evaluateTarget(target)(state, "ctx"), `r${id}`);
          steps.push(
            `LET o${id} == OrdinaryObjectCreate(${state}, Intrinsic(${state}, "ObjectPrototype")) IN`,
          );
          push(`CopyDataProperties(o${id}.s, Val(o${id}), value, ${getSequence(keys)})`, `y${id}`);
          push(`PutValue(${state}, Val(r${id}), Val(o${id}))`, `p${id}`);
          return;
        }
        if (!ts.isPropertyAssignment(property)) {
          throw new TlaTypeScriptError(
            "tla-ts can't compile this destructuring target to ESCore yet",
            property,
          );
        }
        push(propertyKey(property.name, scope)(state, "ctx"), `k${id}`);
        keys.push(`Val(k${id})`);
        // KeyedDestructuringAssignmentEvaluation (§13.15.5.6).
        const target = getTarget(property.initializer);
        push(evaluateTarget(target)(state, "ctx"), `r${id}`);
        push(`GetValueProperty(${state}, value, Val(k${id}))`, `v${id}`);
        push(initialized(target.initializer, target.inner, scope, `v${id}`), `w${id}`);
        push(assign(target, state, `Val(r${id})`, `Val(w${id})`), `p${id}`);
      });
      steps.push(`Ok(${state}, Empty)`);
    } else {
      // IteratorDestructuringAssignmentEvaluation (§13.15.5.5).
      steps.push(
        `LET it == GetIterator(s, value, "sync") IN IF IsAbrupt(it) THEN it ELSE`,
        "LET e0 == [s |-> it.s, c |-> NormalCompletion(Empty), it |-> Val(it)] IN",
      );
      let previous = "e0";
      node.elements.forEach((element, index) => {
        const id = index + 1;
        const step = (() => {
          if (ts.isOmittedExpression(element)) {
            return `LET n${id} == IteratorNextForBinding(${previous}.s, ${previous}.it) IN IF IsAbrupt(n${id}) THEN n${id} ELSE WithIt(Ok(n${id}.s, Empty), n${id}.it)`;
          }
          if (ts.isSpreadElement(element)) {
            const target = getTarget(element.expression);
            return `LET r${id} == ${evaluateTarget(target)(`${previous}.s`, "ctx")} IN IF IsAbrupt(r${id}) THEN WithIt(r${id}, ${previous}.it) ELSE LET a${id} == ArrayCreate(r${id}.s, 0, Intrinsic(r${id}.s, "ArrayPrototype")) rest${id} == CollectRest(a${id}.s, Val(a${id}), ${previous}.it, 0) IN IF IsAbrupt(rest${id}) THEN rest${id} ELSE WithIt(${assign(target, `rest${id}.s`, `Val(r${id})`, `Val(a${id})`)}, rest${id}.it)`;
          }
          const target = getTarget(element);
          return `LET r${id} == ${evaluateTarget(target)(`${previous}.s`, "ctx")} IN IF IsAbrupt(r${id}) THEN WithIt(r${id}, ${previous}.it) ELSE LET n${id} == IteratorNextForBinding(r${id}.s, ${previous}.it) IN IF IsAbrupt(n${id}) THEN n${id} ELSE LET w${id} == ${initialized(target.initializer, target.inner, scope, `n${id}`)} IN IF IsAbrupt(w${id}) THEN WithIt(w${id}, n${id}.it) ELSE WithIt(${assign(target, `w${id}.s`, `Val(r${id})`, `Val(w${id})`)}, n${id}.it)`;
        })();
        steps.push(
          `LET e${id} == ${step} IN IF IsAbrupt(e${id}) THEN IteratorEndThen(e${id}) ELSE`,
        );
        previous = `e${id}`;
      });
      steps.push(`IteratorEndThen(${previous})`);
    }
    const operator = define("Destructure", ["s", "ctx", "value"], steps.join("\n  "));
    return (state, context, assigned) => `${operator}(${state}, ${context}, ${assigned})`;
  };

  // The value of an expression (Evaluate, then GetValue).
  const value = (node: ts.Expression, scope: Scope): Code => {
    switch (node.kind) {
      case ts.SyntaxKind.NullKeyword:
        return (state) => `Ok(${state}, Null)`;
      case ts.SyntaxKind.TrueKeyword:
        return (state) => `Ok(${state}, True)`;
      case ts.SyntaxKind.FalseKeyword:
        return (state) => `Ok(${state}, False)`;
      case ts.SyntaxKind.ThisKeyword:
        return (state, context) => `ResolveThisBinding(${state}, ${context})`;
      default:
        break;
    }
    if (ts.isNumericLiteral(node)) {
      return (state) => `Ok(${state}, Num(${getNumber(Number(node.text))}))`;
    }
    if (ts.isBigIntLiteral(node)) {
      const big = BigInt(node.text.slice(0, -1).replaceAll("_", ""));
      return (state) => `Ok(${state}, BigInt([neg |-> FALSE, mag |-> ${getLimbs(big)}]))`;
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      words.add(node.text);
      return (state) => `Ok(${state}, ${getStr(node.text)})`;
    }
    if (
      ts.isIdentifier(node) ||
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)
    ) {
      const ref = reference(node, scope);
      return (state, context) => `GetValueThen(${ref(state, context)})`;
    }
    if (ts.isCallExpression(node)) {
      const ref = reference(node, scope);
      return (state, context) => `GetValueThen(${ref(state, context)})`;
    }
    if (ts.isParenthesizedExpression(node)) return value(node.expression, scope);
    if (ts.isTemplateExpression(node)) return template(node, scope);
    if (ts.isArrayLiteralExpression(node)) return arrayLiteral(node, scope);
    if (ts.isObjectLiteralExpression(node)) return objectLiteral(node, scope);
    if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      const make = functionExpression(node, scope);
      return (state, context) => make(state, context, "EmptyStr");
    }
    if (ts.isClassExpression(node)) {
      const make = classDefinition(node, node.name?.text);
      return (state, context) => make(state, context, "EmptyStr");
    }
    if (ts.isNewExpression(node)) {
      const callee = value(node.expression, scope);
      const args = argumentList(node.arguments ?? [], scope);
      return defineCode(
        "New",
        `LET r == ${callee("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE NewArgumentsThen(Val(r), ${args("r.s", "ctx")})`,
      );
    }
    if (ts.isMetaProperty(node)) {
      if (node.keywordToken === ts.SyntaxKind.NewKeyword)
        return (state, context) => `Ok(${state}, GetNewTarget(${state}, ${context}))`;
      throw new TlaTypeScriptError("tla-ts can't compile import.meta to ESCore yet", node);
    }
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
      const operator = node.operator;
      if (operator === ts.SyntaxKind.PlusPlusToken || operator === ts.SyntaxKind.MinusMinusToken) {
        const target = reference(node.operand, scope);
        return defineCode(
          "Update",
          `UpdateValueThen(${getBool(operator === ts.SyntaxKind.PlusPlusToken)}, ${getBool(ts.isPostfixUnaryExpression(node))}, ${target("s", "ctx")})`,
        );
      }
      const name = {
        [ts.SyntaxKind.ExclamationToken]: "!",
        [ts.SyntaxKind.MinusToken]: "-",
        [ts.SyntaxKind.PlusToken]: "+",
        [ts.SyntaxKind.TildeToken]: "~",
      }[operator];
      const operand = value(node.operand, scope);
      return defineCode("Unary", `UnaryThen("${name}", ${operand("s", "ctx")})`);
    }
    if (ts.isTypeOfExpression(node)) {
      const operand = reference(node.expression, scope);
      return defineCode("Typeof", `TypeofThen(${operand("s", "ctx")})`);
    }
    if (ts.isDeleteExpression(node)) {
      const operand = reference(node.expression, scope);
      return defineCode("Delete", `DeleteThen(${operand("s", "ctx")})`);
    }
    if (ts.isVoidExpression(node)) {
      const operand = value(node.expression, scope);
      return defineCode("Void", `UnaryThen("void", ${operand("s", "ctx")})`);
    }
    if (ts.isConditionalExpression(node)) {
      const test = value(node.condition, scope);
      const whenTrue = value(node.whenTrue, scope);
      const whenFalse = value(node.whenFalse, scope);
      return defineCode(
        "Conditional",
        `LET r == ${test("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE IF ToBooleanValue(Val(r)) THEN ${whenTrue("r.s", "ctx")} ELSE ${whenFalse("r.s", "ctx")}`,
      );
    }
    if (ts.isBinaryExpression(node)) return binary(node, scope);
    if (ts.isSpreadElement(node))
      throw new TlaTypeScriptError("tla-ts can't compile a spread here", node);
    if (ts.isYieldExpression(node) || ts.isAwaitExpression(node)) {
      throw new TlaTypeScriptError(
        "tla-ts can't compile a generator or an async function to ESCore yet",
        node,
      );
    }
    if (ts.isTaggedTemplateExpression(node)) return taggedTemplate(node, scope);
    if (ts.isRegularExpressionLiteral(node)) {
      // RegExpCreateLiteral (§13.2.7.3) of the literal's body and flags, as written.
      const text = node.text;
      const end = text.lastIndexOf("/");
      words.add("RegExp");
      return (state) =>
        `RegExpCreate(${state}, ${getStr(text.slice(1, end))}, ${getStr(text.slice(end + 1))})`;
    }
    throw new TlaTypeScriptError(
      `tla-ts can't compile ${ts.SyntaxKind[node.kind]} to ESCore yet`,
      node,
    );
  };

  const binary = (node: ts.BinaryExpression, scope: Scope): Code => {
    const operator = node.operatorToken.kind;
    if (
      operator === ts.SyntaxKind.EqualsToken ||
      COMPOUND_OPERATORS.has(operator) ||
      (LOGICAL_TESTS.has(operator) && operator >= ts.SyntaxKind.FirstAssignment)
    ) {
      return assignment(node, scope);
    }
    if (ts.isPrivateIdentifier(node.left)) {
      // #x in o (§13.10.1), with PrivateInThen's steps.
      const right = value(node.right, scope);
      return defineCode(
        "PrivateIn",
        `LET r == ${right("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s) ELSE Ok(r.s, Bool(PrivateElementFind(r.s, Val(r), ${getPrivateName(node.left, "r.s", "ctx")}) # Empty))`,
      );
    }
    const left = value(node.left, scope);
    const right = value(node.right, scope);
    const test = LOGICAL_TESTS.get(operator);
    if (test !== undefined) {
      return defineCode(
        "Logical",
        `LET r == ${left("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE IF ${test("Val(r)")} THEN r ELSE ${right("r.s", "ctx")}`,
      );
    }
    if (operator === ts.SyntaxKind.CommaToken) {
      return defineCode(
        "Comma",
        `LET r == ${left("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE ${right("r.s", "ctx")}`,
      );
    }
    const arithmetic = BINARY_OPERATORS.get(operator);
    const relational = RELATIONAL_OPERATORS.get(operator);
    const equality = EQUALITY_OPERATORS.get(operator);
    const then =
      arithmetic !== undefined
        ? `BinaryRightThen(Val(r), "${arithmetic}", `
        : relational !== undefined
          ? `RelationalRightThen(Val(r), "${relational}", `
          : equality !== undefined
            ? `EqualityRightThen(Val(r), "${equality}", `
            : undefined;
    if (then === undefined) {
      throw new TlaTypeScriptError(
        `tla-ts can't compile the operator ${node.operatorToken.getText()} to ESCore yet`,
        node,
      );
    }
    return defineCode(
      "Binary",
      `LET r == ${left("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE ${then}${right("r.s", "ctx")})`,
    );
  };

  // Assignment operators (§13.15.2).
  const assignment = (node: ts.BinaryExpression, scope: Scope): Code => {
    const operator = node.operatorToken.kind;
    const target = node.left;
    if (
      operator === ts.SyntaxKind.EqualsToken &&
      (ts.isObjectLiteralExpression(target) || ts.isArrayLiteralExpression(target))
    ) {
      // DestructuringAssignmentEvaluation, whose value is the right side's.
      const pattern = destructuring(target, scope);
      return defineCode(
        "Assign",
        `LET r == ${value(node.right, scope)("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE ResultThen(Val(r), ${pattern("r.s", "ctx", "Val(r)")})`,
      );
    }
    const left = reference(target, scope);
    const assigned =
      ts.isIdentifier(target) && isAnonymousFunctionDefinition(node.right)
        ? named(node.right, scope, getStr(target.text))
        : value(node.right, scope);
    const head = `LET t == ${left("s", "ctx")} IN IF IsAbrupt(t) THEN t ELSE IF Val(t).type # "reference" THEN ThrowError(t.s, "ReferenceError") ELSE`;
    if (operator === ts.SyntaxKind.EqualsToken) {
      return defineCode("Assign", `${head} PutValueThen(Val(t), ${assigned("t.s", "ctx")})`);
    }
    const old = `LET ref == ToKeyedReference(t.s, Val(t)) IN IF IsAbrupt(ref) THEN ref ELSE LET old == GetValue(ref.s, Val(ref)) IN IF IsAbrupt(old) THEN old ELSE`;
    const test = LOGICAL_TESTS.get(operator);
    if (test !== undefined) {
      return defineCode(
        "Assign",
        `${head} ${old} IF ${test("Val(old)")} THEN old ELSE PutValueThen(Val(ref), ${assigned("old.s", "ctx")})`,
      );
    }
    const right = value(node.right, scope);
    return defineCode(
      "Assign",
      `${head} ${old} CompoundThen(Val(ref), Val(old), "${COMPOUND_OPERATORS.get(operator)}", ${right("old.s", "ctx")})`,
    );
  };

  // Tagged templates (§13.3.11): the tag called with its site's template object, which
  // GetTemplateObject makes once per site, and the substitutions, as TagThen does.
  const taggedTemplate = (node: ts.TaggedTemplateExpression, scope: Scope): Code => {
    const tag = reference(node.tag, scope);
    const template = node.template;
    const parts = ts.isNoSubstitutionTemplateLiteral(template)
      ? [template]
      : [template.head, ...template.templateSpans.map((span) => span.literal)];
    // The parser marks a part whose escapes have no cooked value, which TemplateCookedList holds
    // as None (TokenFlags.ContainsInvalidEscape).
    const cooked = parts.map((part) => {
      const flags: unknown = Reflect.get(part, "templateFlags");
      return typeof flags === "number" && (flags & 2048) !== 0 ? "None" : getUnits(part.text);
    });
    const raw = parts.map((part) => {
      const text = part.getText();
      const end = text.endsWith("${") ? text.length - 2 : text.length - 1;
      return getUnits(text.slice(1, end).replace(/\r\n?/g, "\n"));
    });
    templateSites += 1;
    const args = argumentList(
      ts.isNoSubstitutionTemplateLiteral(template)
        ? []
        : template.templateSpans.map((span) => span.expression),
      scope,
    );
    return defineCode(
      "Tagged",
      [
        `LET r == ${tag("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE`,
        "LET f == GetValue(r.s, Val(r)) IN IF IsAbrupt(f) THEN f ELSE",
        `LET object == GetTemplateObject(f.s, <<0, ${templateSites}>>, [TemplateCookedList |-> ${getSequence(cooked)}, TemplateRawList |-> ${getSequence(raw)}]) IN`,
        `LET a == ${args("object.s", "ctx")} IN IF IsAbrupt(a) THEN a ELSE`,
        "CallArgumentsThen(Val(f), CallThisValue(object.s, Val(r)), FALSE, Ok(a.s, <<Val(object)>> \\o Val(a)))",
      ].join("\n  "),
    );
  };

  // Template literals (§13.2.8.6).
  const template = (node: ts.TemplateExpression, scope: Scope): Code => {
    const steps: string[] = [];
    let state = "s";
    let text = getUnits(node.head.text);
    node.templateSpans.forEach((span, index) => {
      const name = `t${index + 1}`;
      steps.push(
        `LET ${name}v == ${value(span.expression, scope)(state, "ctx")} IN IF IsAbrupt(${name}v) THEN ${name}v ELSE`,
        `LET ${name} == ToStr(${name}v.s, Val(${name}v)) IN IF IsAbrupt(${name}) THEN ${name} ELSE`,
      );
      text = `${text} \\o Val(${name}).value \\o ${getUnits(span.literal.text)}`;
      state = `${name}.s`;
    });
    return defineCode("Template", `${steps.join("\n  ")}\n  Ok(${state}, Str(${text}))`);
  };

  // Array initializers (§13.2.4).
  const arrayLiteral = (node: ts.ArrayLiteralExpression, scope: Scope): Code => {
    const steps = [`LET a == ArrayCreate(s, 0, Intrinsic(s, "ArrayPrototype")) IN`];
    let state = "a.s";
    let index = "0";
    let staticIndex: number | undefined = 0;
    node.elements.forEach((element, position) => {
      const name = `e${position + 1}`;
      if (ts.isOmittedExpression(element)) {
        index = staticIndex === undefined ? `${index} + 1` : String(staticIndex + 1);
        staticIndex = staticIndex === undefined ? undefined : staticIndex + 1;
        return;
      }
      if (ts.isSpreadElement(element)) {
        steps.push(
          `LET ${name} == ${value(element.expression, scope)(state, "ctx")} IN IF IsAbrupt(${name}) THEN ${name} ELSE`,
          `LET ${name}i == GetIterator(${name}.s, Val(${name}), "sync") IN IF IsAbrupt(${name}i) THEN ${name}i ELSE`,
          `LET ${name}p == SpreadIntoArray(${name}i.s, Val(a), Val(${name}i), ${index}) IN IF IsAbrupt(${name}p) THEN ${name}p ELSE`,
        );
        state = `${name}p.s`;
        index = `Val(${name}p)`;
        staticIndex = undefined;
        return;
      }
      const key =
        staticIndex === undefined
          ? `Str(NumToString(NumFromInt(${index})))`
          : getStr(String(staticIndex));
      steps.push(
        `LET ${name} == ${value(element, scope)(state, "ctx")} IN IF IsAbrupt(${name}) THEN ${name} ELSE`,
        `LET ${name}c == CreateDataPropertyOrThrow(${name}.s, Val(a), ${key}, Val(${name})) IN IF IsAbrupt(${name}c) THEN ${name}c ELSE`,
      );
      state = `${name}c.s`;
      index = staticIndex === undefined ? `${index} + 1` : String(staticIndex + 1);
      staticIndex = staticIndex === undefined ? undefined : staticIndex + 1;
    });
    return defineCode(
      "Array",
      `${steps.join("\n  ")}\n  ArrayLiteralThen(Val(a), Ok(${state}, ${index}))`,
    );
  };

  // Object initializers (§13.2.5).
  const objectLiteral = (node: ts.ObjectLiteralExpression, scope: Scope): Code => {
    const steps = [`LET o == OrdinaryObjectCreate(s, Intrinsic(s, "ObjectPrototype")) IN`];
    let state = "o.s";
    node.properties.forEach((property, position) => {
      const name = `p${position + 1}`;
      const push = (text: string) => {
        steps.push(`LET ${name} == ${text} IN IF IsAbrupt(${name}) THEN ${name} ELSE`);
        state = `${name}.s`;
      };
      if (ts.isShorthandPropertyAssignment(property)) {
        if (property.objectAssignmentInitializer !== undefined) {
          push(`ThrowError(${state}, "SyntaxError")`);
          return;
        }
        push(
          `CreateDataThen(Val(o), ${getStr(property.name.text)}, ${value(property.name, scope)(state, "ctx")})`,
        );
        return;
      }
      if (ts.isSpreadAssignment(property)) {
        push(`CopyDataThen(Val(o), ${value(property.expression, scope)(state, "ctx")})`);
        return;
      }
      if (ts.isPropertyAssignment(property)) {
        const literal = getLiteralKey(property.name);
        if (literal !== undefined) {
          words.add(literal);
          if (literal === "__proto__" && !ts.isNumericLiteral(property.name)) {
            push(`ProtoSetterThen(Val(o), ${value(property.initializer, scope)(state, "ctx")})`);
            return;
          }
          push(
            `CreateDataThen(Val(o), ${getStr(literal)}, ${named(property.initializer, scope, getStr(literal))(state, "ctx")})`,
          );
          return;
        }
        if (!ts.isComputedPropertyName(property.name)) {
          throw new TlaTypeScriptError(
            "tla-ts can't compile a private name to ESCore yet",
            property,
          );
        }
        steps.push(
          `LET ${name}k == ToPropertyKeyThen(${value(property.name.expression, scope)(state, "ctx")}) IN IF IsAbrupt(${name}k) THEN ${name}k ELSE`,
        );
        state = `${name}k.s`;
        push(
          `CreateDataThen(Val(o), Val(${name}k), ${named(property.initializer, scope, `Val(${name}k)`)(state, "ctx")})`,
        );
        return;
      }
      if (
        ts.isMethodDeclaration(property) ||
        ts.isGetAccessorDeclaration(property) ||
        ts.isSetAccessorDeclaration(property)
      ) {
        // MethodDefinitionEvaluation (§15.4.5), which makes the method an enumerable property.
        push(
          `DefineElementOn(Val(o), ${classElement(property, scope)(state, "ctx", "Val(o)")}, TRUE)`,
        );
        return;
      }
      throw new TlaTypeScriptError("tla-ts can't compile this property", property);
    });
    return defineCode("Object", `${steps.join("\n  ")}\n  Ok(${state}, Val(o))`);
  };

  // The property key of a class element or an object literal's method (§13.2.5.4).
  const propertyKey = (name: ts.PropertyName, scope: Scope): Code => {
    const literal = getLiteralKey(name);
    if (literal !== undefined) {
      words.add(literal);
      return (state) => `Ok(${state}, ${getStr(literal)})`;
    }
    if (ts.isComputedPropertyName(name)) {
      const key = value(name.expression, scope);
      return (state, context) => `ToPropertyKeyThen(${key(state, context)})`;
    }
    if (ts.isPrivateIdentifier(name)) {
      return (state, context) => `Ok(${state}, ${getPrivateName(name, state, context)})`;
    }
    throw new TlaTypeScriptError("tla-ts can't compile this property name to ESCore yet", name);
  };

  // The Private Name of a private identifier in the running private environment
  // (ResolvePrivateIdentifier, §9.2.1.1), whose names ESCore holds without the #.
  const getPrivateName = (name: ts.PrivateIdentifier, state: string, context: string) =>
    `ResolvePrivateIdentifier(${state}, ${context}, ${getUnits(name.text.slice(1))})`;

  const assertPlain = (
    node: ts.Node & { asteriskToken?: ts.AsteriskToken; modifiers?: ts.NodeArray<ts.ModifierLike> },
  ) => {
    if (
      node.asteriskToken !== undefined ||
      node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
    ) {
      throw new TlaTypeScriptError(
        "tla-ts can't compile a generator or an async function to ESCore yet",
        node,
      );
    }
  };

  // ClassElementEvaluation (§15.7.13) of a method, getter, or setter: its element record, with
  // the closure's home object home.
  const classElement = (
    node: ts.MethodDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration,
    scope: Scope,
  ) => {
    assertPlain(node);
    const key = propertyKey(node.name, scope);
    const kind = ts.isGetAccessorDeclaration(node)
      ? "get"
      : ts.isSetAccessorDeclaration(node)
        ? "set"
        : "method";
    const code = functionCode({ node, parameters: node.parameters, body: node.body, kind }, scope);
    const record =
      kind === "method"
        ? `[ElementRecord("method", Val(k)) EXCEPT !.value = f.v]`
        : kind === "get"
          ? `[ElementRecord("getter", Val(k)) EXCEPT !.get = f.v]`
          : `[ElementRecord("setter", Val(k)) EXCEPT !.set = f.v]`;
    const prefix = kind === "method" ? "<<>>" : kind === "get" ? `N("get")` : `N("set")`;
    const name = define(
      "Element",
      ["s", "ctx", "home"],
      `LET k == ${key("s", "ctx")} IN IF IsAbrupt(k) THEN k ELSE LET f == CodeFunctionCreate(k.s, Intrinsic(k.s, "FunctionPrototype"), ${code}, FALSE, ctx.lex, ctx.priv) IN Ok(SetFunctionName(MakeMethod(f.s, f.v, home), f.v, Val(k), ${prefix}), ${record})`,
    );
    return (state: string, context: string, home: string) =>
      `${name}(${state}, ${context}, ${home})`;
  };

  // ClassFieldDefinitionEvaluation (§15.7.10): a field's element record, with its initializer a
  // method of home whose body gives the initializer's value.
  const classField = (node: ts.PropertyDeclaration, scope: Scope) => {
    if (node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AccessorKeyword)) {
      throw new TlaTypeScriptError("tla-ts can't compile an auto-accessor to ESCore yet", node);
    }
    const key = propertyKey(node.name, scope);
    const initializer = node.initializer;
    const name = define(
      "Field",
      ["s", "ctx", "home"],
      initializer === undefined
        ? `LET k == ${key("s", "ctx")} IN IF IsAbrupt(k) THEN k ELSE Ok(k.s, ElementRecord("field", Val(k)))`
        : `LET k == ${key("s", "ctx")} IN IF IsAbrupt(k) THEN k ELSE LET f == CodeFunctionCreate(k.s, Intrinsic(k.s, "FunctionPrototype"), ${fieldCode(node, initializer)}, FALSE, ctx.lex, ctx.priv) s1 == MakeMethod(f.s, f.v, home) IN Ok(SetO(s1, f.v, [O(s1, f.v) EXCEPT !.slots.initializerName = Val(k)]), [ElementRecord("field", Val(k)) EXCEPT !.init = f.v])`,
    );
    return (state: string, context: string, home: string) =>
      `${name}(${state}, ${context}, ${home})`;
  };

  // A field initializer's code, whose body gives the initializer's value, named by the field's
  // key (§15.7.10, EvaluateFieldInitializer).
  const fieldCode = (node: ts.PropertyDeclaration, initializer: ts.Expression) => {
    const id = codes.length + 1;
    codes.push({ id, body: "" });
    const evaluation = named(
      initializer,
      { isStrict: true, isClassBody: false },
      "O(s, f).slots.initializerName",
    );
    codes[id - 1] = {
      id,
      body: `Code${id}(s, f, ctx, args) ==\n  LET v == ${evaluation("s", "ctx")} IN IF IsAbrupt(v) THEN v ELSE Abrupt(v.s, Completion("return", Val(v), Empty))`,
    };
    return defineRecord(id, true, 0, getSourceText(node));
  };

  // InstantiateOrdinaryFunctionExpression (§15.2.5) and InstantiateArrowFunctionExpression
  // (§15.3.4), with the name that NamedEvaluation gives, or EmptyStr.
  const functionExpression = (
    node: ts.FunctionExpression | ts.ArrowFunction,
    scope: Scope,
  ): NamedCode => {
    assertPlain(node);
    const code = functionCode(
      {
        node,
        parameters: node.parameters,
        body: node.body,
        kind: ts.isArrowFunction(node) ? "arrow" : "normal",
      },
      scope,
    );
    const name = ts.isArrowFunction(node)
      ? define(
          "Arrow",
          ["s", "ctx", "name"],
          `LET f == CodeFunctionCreate(s, Intrinsic(s, "FunctionPrototype"), ${code}, TRUE, ctx.lex, ctx.priv) IN Ok(SetFunctionName(f.s, f.v, name, <<>>), f.v)`,
        )
      : node.name !== undefined
        ? define(
            "Closure",
            ["s", "ctx", "name"],
            `LET env == NewDeclarativeEnvironment(s, ctx.lex) s1 == CreateImmutableBinding(env.s, env.e, ${getUnits(node.name.text)}, FALSE).s f == CodeFunctionCreate(s1, Intrinsic(s1, "FunctionPrototype"), ${code}, FALSE, env.e, ctx.priv) s2 == GiveFunctionPrototype(SetFunctionName(f.s, f.v, ${getStr(node.name.text)}, <<>>), "FunctionExpression", f.v) IN Ok(InitializeBinding(s2, env.e, ${getUnits(node.name.text)}, f.v).s, f.v)`,
          )
        : define(
            "Closure",
            ["s", "ctx", "name"],
            `LET f == CodeFunctionCreate(s, Intrinsic(s, "FunctionPrototype"), ${code}, FALSE, ctx.lex, ctx.priv) IN Ok(GiveFunctionPrototype(SetFunctionName(f.s, f.v, name, <<>>), "FunctionExpression", f.v), f.v)`,
          );
    return (state, context, functionName) => `${name}(${state}, ${context}, ${functionName})`;
  };

  // InstantiateFunctionObject (§15.2.4): a result [s, c] with the function object.
  const instantiateFunction = (node: ts.FunctionDeclaration, scope: Scope): Code => {
    assertPlain(node);
    const code = functionCode(
      { node, parameters: node.parameters, body: node.body, kind: "normal" },
      scope,
    );
    return defineCode(
      "Instantiate",
      `LET f == CodeFunctionCreate(s, Intrinsic(s, "FunctionPrototype"), ${code}, FALSE, ctx.lex, ctx.priv) IN Ok(GiveFunctionPrototype(SetFunctionName(f.s, f.v, ${getStr(node.name?.text ?? "default")}, <<>>), "FunctionDeclaration", f.v), f.v)`,
    );
  };

  // A function's code: the record that its function objects hold as their body, whose id
  // CallCode dispatches on to the body that FunctionDeclarationInstantiation (§10.2.11) and the
  // body's evaluation specialize to.
  const functionCode = (fn: FunctionLike, outer: Scope): string => {
    const node = fn.node;
    const body = fn.body;
    const statements = body !== undefined && ts.isBlock(body) ? body.statements : [];
    const isStrict = outer.isStrict || outer.isClassBody || hasUseStrict(statements);
    const scope: Scope = { isStrict, isClassBody: false };
    const parameters = fn.parameters;
    const parameterNames = parameters.flatMap((parameter) => getBoundNames(parameter.name));
    const hasDuplicates = new Set(parameterNames).size < parameterNames.length;
    const isSimple = parameters.every(
      (parameter) =>
        parameter.initializer === undefined &&
        parameter.dotDotDotToken === undefined &&
        ts.isIdentifier(parameter.name),
    );
    const hasExpressions = parameters.some(
      (parameter) => parameter.initializer !== undefined || containsExpression(parameter.name),
    );
    const varScoped = getVarScoped(statements);
    const lexical = getLexicalDeclarations(statements, false);
    const lexicalNames = lexical.flatMap((declaration) => declaration.names);
    const functions = getFunctionsToInitialize(varScoped.functions);
    const functionNames = functions.map((declaration) => declaration.name?.text ?? "*default*");
    const argumentsNeeded =
      fn.kind !== "arrow" &&
      fn.kind !== "staticBlock" &&
      ((body !== undefined && getMayUseArguments(body)) || parameters.some(getMayUseArguments)) &&
      !parameterNames.includes("arguments") &&
      (hasExpressions ||
        (!functionNames.includes("arguments") && !lexicalNames.includes("arguments")));
    const parameterBindings = argumentsNeeded ? [...parameterNames, "arguments"] : parameterNames;
    const id = codes.length + 1;
    codes.push({ id, body: "" });
    const steps: string[] = [];
    // Step 19-20: the environment that holds the parameters.
    steps.push(
      !isStrict && hasExpressions
        ? `LET pe == NewDeclarativeEnvironment(s, ctx.lex) env == pe.e s1 == CreateBindings(pe.s, env, ${getSequence(parameterNames.map(getUnits))}, ${getBool(isStrict)}, ${getBool(hasDuplicates)}) IN`
        : `LET env == ctx.lex s1 == CreateBindings(s, env, ${getSequence(parameterNames.map(getUnits))}, ${getBool(isStrict)}, ${getBool(hasDuplicates)}) IN`,
    );
    // Step 22: the arguments object.
    if (argumentsNeeded) {
      steps.push(
        isStrict || !isSimple
          ? `LET ao == CreateUnmappedArgumentsObject(s1, args) IN`
          : `LET ao == CreateMappedArgumentsObjectOf(s1, f, ${getSequence(parameterNames.map(getUnits))}, args, env) IN`,
        isStrict
          ? `LET ab == CreateImmutableBinding(ao.s, env, N("arguments"), FALSE) IN`
          : `LET ab == CreateMutableBinding(ao.s, env, N("arguments"), FALSE) IN`,
        `LET s2 == InitializeBinding(ab.s, env, N("arguments"), ao.v).s IN`,
      );
    } else steps.push("LET s2 == s1 IN");
    // Steps 24-26: each parameter bound to its argument, or its initializer's value.
    const paramContext = "[ctx EXCEPT !.lex = env]";
    let state = "s2";
    parameters.forEach((parameter, index) => {
      const argument =
        parameter.dotDotDotToken !== undefined
          ? `CreateArrayFromList(${state}, IF ${index + 1} > Len(args) THEN <<>> ELSE SubSeq(args, ${index + 1}, Len(args)))`
          : `Ok(${state}, IF ${index + 1} <= Len(args) THEN args[${index + 1}] ELSE Undefined)`;
      steps.push(`LET v${index + 1} == ${argument} IN`);
      const initializer = parameter.initializer;
      const bound =
        initializer === undefined
          ? `v${index + 1}`
          : `IF Val(v${index + 1}) # Undefined THEN v${index + 1} ELSE ${
              ts.isIdentifier(parameter.name)
                ? named(
                    initializer,
                    scope,
                    getStr(parameter.name.text),
                  )(`v${index + 1}.s`, paramContext)
                : value(initializer, scope)(`v${index + 1}.s`, paramContext)
            }`;
      steps.push(
        `LET w${index + 1} == ${bound} IN IF IsAbrupt(w${index + 1}) THEN w${index + 1} ELSE`,
        `LET b${index + 1} == ${binding(parameter.name, scope)(`w${index + 1}.s`, paramContext, `Val(w${index + 1})`, hasDuplicates ? "NoEnv" : "env")} IN IF IsAbrupt(b${index + 1}) THEN b${index + 1} ELSE`,
      );
      state = `b${index + 1}.s`;
    });
    // Steps 27-28: the var bindings, in their own environment when parameters have expressions.
    const varNames = dedupe(varScoped.names);
    if (!hasExpressions) {
      steps.push(
        `LET varEnv == env s4 == CreateVarBindings(${state}, env, ${getSequence(varNames.filter((name) => !parameterBindings.includes(name)).map(getUnits))}, env, FALSE, {}) IN`,
      );
    } else {
      steps.push(
        `LET ve == NewDeclarativeEnvironment(${state}, env) varEnv == ve.e s4 == CreateVarBindings(ve.s, ve.e, ${getSequence(varNames.map(getUnits))}, env, TRUE, {${parameterBindings
          .filter((name) => !functionNames.includes(name))
          .map(getUnits)
          .join(", ")}}) IN`,
      );
    }
    // Step 32.a (§B.3.2.1): outside strict mode, var bindings for the block functions that no
    // parameter names, and the sites whose evaluation then sets them.
    const hoisted = isStrict
      ? []
      : getHoistableFunctions(statements).filter(
          (declaration) => !parameterBindings.includes(declaration.name?.text ?? "*default*"),
        );
    if (hoisted.length > 0) {
      const hoistedNames = dedupe(
        hoisted.map((declaration) => declaration.name?.text ?? "*default*"),
      ).filter(
        (name) =>
          !varNames.includes(name) && !parameterBindings.includes(name) && name !== "arguments",
      );
      steps.push(
        `LET s4h == CreateVarBindings(s4, varEnv, ${getSequence(hoistedNames.map(getUnits))}, varEnv, FALSE, {}) IN`,
        `LET s4a == HoldEnvs([s4h EXCEPT !.hoisted = @ \\cup {${hoisted.map((declaration) => `<<varEnv, ${getSite(declaration)}>>`).join(", ")}}]) IN`,
      );
    } else steps.push("LET s4a == s4 IN");
    // Steps 30-34: the lexical environment and its bindings.
    steps.push(
      isStrict
        ? "LET lexEnv == varEnv s5 == s4a IN"
        : "LET le == NewDeclarativeEnvironment(s4a, varEnv) lexEnv == le.e s5 == le.s IN",
      `LET bodyCtx == [ctx EXCEPT !.lex = lexEnv, !.var = varEnv] IN`,
      `LET s6 == ${lexical.reduce((current, declaration) => `CreateLexicalNames(${current}, lexEnv, ${getSequence(declaration.names.map(getUnits))}, ${getBool(declaration.isConst)})`, "s5")} IN`,
    );
    // Step 36: the functions.
    let functionState = "s6";
    functions.forEach((declaration, index) => {
      const instantiate = instantiateFunction(declaration, scope);
      steps.push(
        `LET fo${index + 1} == ${instantiate(functionState, "bodyCtx")} IN`,
        `LET fs${index + 1} == SetMutableBinding(fo${index + 1}.s, varEnv, ${getUnits(declaration.name?.text ?? "*default*")}, Val(fo${index + 1}), FALSE).s IN`,
      );
      functionState = `fs${index + 1}`;
    });
    // The body's evaluation.
    const evaluation =
      body === undefined
        ? `Ok(${functionState}, Empty)`
        : ts.isBlock(body)
          ? statementList(body.statements, scope)(functionState, "bodyCtx")
          : `LET e == ${value(body, scope)(functionState, "bodyCtx")} IN IF IsAbrupt(e) THEN e ELSE Abrupt(e.s, Completion("return", Val(e), Empty))`;
    steps.push(evaluation);
    codes[id - 1] = { id, body: `Code${id}(s, f, ctx, args) ==\n  ${steps.join("\n  ")}` };
    const length = parameters.findIndex(
      (parameter) => parameter.initializer !== undefined || parameter.dotDotDotToken !== undefined,
    );
    return defineRecord(
      id,
      isStrict,
      length === -1 ? parameters.length : length,
      fn.kind === "staticBlock" ? "<<>>" : getSourceText(node),
    );
  };

  // ClassDefinitionEvaluation (§15.7.14) of a class whose elements are methods, accessors,
  // fields, and static blocks: a result with the class's constructor, named by binding or else by
  // the name it's called with.
  const classDefinition = (
    node: ts.ClassLikeDeclaration,
    binding: string | undefined,
  ): NamedCode => {
    const scope: Scope = { isStrict: true, isClassBody: true };
    const heritage = node.heritageClauses?.find(
      (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
    )?.types[0]?.expression;
    const constructor = node.members.find(ts.isConstructorDeclaration);
    const elements = node.members.filter(
      (member) => !ts.isConstructorDeclaration(member) && !ts.isSemicolonClassElement(member),
    );
    for (const element of elements) {
      if (ts.canHaveDecorators(element) && ts.getDecorators(element)?.length)
        throw new TlaTypeScriptError("tla-ts can't compile a decorator to ESCore yet", element);
    }
    if (ts.getDecorators(node)?.length)
      throw new TlaTypeScriptError("tla-ts can't compile a decorator to ESCore yet", node);
    const className = binding === undefined ? "name" : getStr(binding);
    // PrivateBoundIdentifiers (§15.7.3): the class's private names, each once.
    const privateNames = dedupe(
      elements.flatMap((element) =>
        element.name !== undefined && ts.isPrivateIdentifier(element.name)
          ? [element.name.text.slice(1)]
          : [],
      ),
    );
    const steps = [
      "LET env == NewDeclarativeEnvironment(s, ctx.lex)",
      `    s0 == ${binding === undefined ? "env.s" : `CreateImmutableBinding(env.s, env.e, ${getUnits(binding)}, TRUE).s`}`,
      `    priv == NewPrivateEnvironment(s0, ctx.priv, ${getSequence(privateNames.map(getUnits))})`,
      "    s1 == priv.s",
      "    cctx == [ctx EXCEPT !.lex = env.e, !.priv = priv.env] IN",
      // The heritage runs in the class's scope with the outer private environment.
      `LET h == ${heritage === undefined ? "Ok(s1, Empty)" : value(heritage, scope)("s1", "WithLex(ctx, env.e)")} IN IF IsAbrupt(h) THEN h ELSE`,
      `LET parents == ${heritage === undefined ? `Ok(h.s, [proto |-> Intrinsic(h.s, "ObjectPrototype"), ctor |-> Intrinsic(h.s, "FunctionPrototype")])` : "ClassParents(h.s, Val(h))"} IN IF IsAbrupt(parents) THEN parents ELSE`,
      "LET proto == OrdinaryObjectCreate(parents.s, Val(parents).proto) IN",
      constructor === undefined
        ? `LET made == LET a == Alloc(proto.s, BuiltinObject(Val(parents).ctor, <<"Class", "default">>, 0, FunctionNameUnits(proto.s, ${className}), TRUE, Empty, proto.s.realmId)) IN Ok(a.s, a.v) IN`
        : `LET made == LET m == CodeFunctionCreate(proto.s, Val(parents).ctor, ${functionCode({ node: constructor, parameters: constructor.parameters, body: constructor.body, kind: "constructor" }, scope)}, FALSE, cctx.lex, cctx.priv) IN Ok(SetFunctionName(MakeClassConstructor(MakeMethod(m.s, m.v, Val(proto)), m.v), m.v, ${className}, <<>>), m.v) IN`,
      "LET F == Val(made)",
      "    s2 == MakeConstructor(made.s, F, FALSE, Val(proto))",
      `    s3 == SetO(s2, F, [O(s2, F) EXCEPT !.slots = [ctorKind |-> "${heritage === undefined ? "base" : "derived"}", sourceText |-> ${getSourceText(node)}] @@ @])`,
      `    s4 == CreateMethodProperty(s3, Val(proto), SV("constructor"), F).s IN`,
    ];
    let state = "s4";
    const records: { name: string; isStatic: boolean; kind: "method" | "field" | "staticBlock" }[] =
      [];
    elements.forEach((element, index) => {
      const isStatic =
        ts.isClassStaticBlockDeclaration(element) ||
        (ts.canHaveModifiers(element) &&
          (ts
            .getModifiers(element)
            ?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) ??
            false));
      const home = isStatic ? "F" : "Val(proto)";
      const recordName = `c${index + 1}`;
      const element_ =
        ts.isMethodDeclaration(element) ||
        ts.isGetAccessorDeclaration(element) ||
        ts.isSetAccessorDeclaration(element)
          ? { kind: "method" as const, text: classElement(element, scope)(state, "cctx", home) }
          : ts.isPropertyDeclaration(element)
            ? { kind: "field" as const, text: classField(element, scope)(state, "cctx", home) }
            : ts.isClassStaticBlockDeclaration(element)
              ? {
                  kind: "staticBlock" as const,
                  text: `LET f == CodeFunctionCreate(${state}, Intrinsic(${state}, "FunctionPrototype"), ${functionCode({ node: element, parameters: [], body: element.body, kind: "staticBlock" }, scope)}, FALSE, cctx.lex, cctx.priv) IN Ok(MakeMethod(f.s, f.v, F), [kind |-> "staticBlock", body |-> f.v])`,
                }
              : undefined;
      if (element_ === undefined)
        throw new TlaTypeScriptError(
          "tla-ts can't compile this class element to ESCore yet",
          element,
        );
      steps.push(
        `LET ${recordName} == ${element_.text} IN IF IsAbrupt(${recordName}) THEN ${recordName} ELSE`,
      );
      state = `${recordName}.s`;
      records.push({ name: recordName, isStatic, kind: element_.kind });
    });
    // The methods, getters, and setters, static ones first, as DecorateElements defines them.
    const methods = records.filter((record) => record.kind === "method");
    [
      ...methods.filter((record) => record.isStatic),
      ...methods.filter((record) => !record.isStatic),
    ].forEach((record) => {
      steps.push(
        `LET ${record.name}d == DefineElementOn(${record.isStatic ? "F" : "Val(proto)"}, Ok(${state}, Val(${record.name})), FALSE) IN IF IsAbrupt(${record.name}d) THEN ${record.name}d ELSE`,
      );
      state = `${record.name}d.s`;
    });
    const instanceFields = records.filter((record) => record.kind === "field" && !record.isStatic);
    const statics = records.filter((record) => record.kind !== "method" && record.isStatic);
    const getRecords = (list: typeof records) =>
      getSequence(list.map((record) => `Val(${record.name})`));
    // The private methods and accessors go on each instance as it's made, and the static ones on
    // the class now (§15.7.14 steps 30-34).
    steps.push(
      `LET sf == SetO(${state}, F, [O(${state}, F) EXCEPT !.slots = [privateMethods |-> PrivateMethodsOf(${getRecords(methods.filter((record) => !record.isStatic))}, <<>>), fields |-> ${getRecords(instanceFields)}, initializers |-> Empty] @@ @]) IN`,
      `LET sm == AddPrivateMethods(sf, F, PrivateMethodsOf(${getRecords(methods.filter((record) => record.isStatic))}, <<>>)) IN IF IsAbrupt(sm) THEN sm ELSE`,
      `LET sb == ${binding === undefined ? "sm.s" : `InitializeBinding(sm.s, env.e, ${getUnits(binding)}, F).s`} IN`,
      `LET st == StaticElementsEvaluation(sb, F, ${getSequence(statics.map((record) => `Val(${record.name})`))}) IN IF IsAbrupt(st) THEN st ELSE Ok(st.s, F)`,
    );
    const name = define("Class", ["s", "ctx", "name"], steps.join("\n  "));
    return (current, context, className_) => `${name}(${current}, ${context}, ${className_})`;
  };

  // The completion of a statement (§14).
  const statement = (node: ts.Statement, scope: Scope, labels: string[]): Code => {
    if (ts.isExpressionStatement(node)) return value(node.expression, scope);
    if (ts.isVariableStatement(node)) return declarationList(node.declarationList, scope);
    if (ts.isFunctionDeclaration(node)) {
      // §B.3.2.1: a block's function that the var scope's instantiation hoisted sets the var
      // binding as its declaration runs.
      if (scope.isStrict) return (state) => `Ok(${state}, Empty)`;
      return (state, context) =>
        `IF <<${context}.var, ${getSite(node)}>> \\in ${state}.hoisted THEN HoistedFunctionEvaluation(${state}, ${context}, ${getUnits(node.name?.text ?? "*default*")}) ELSE Ok(${state}, Empty)`;
    }
    if (ts.isClassDeclaration(node)) {
      // BindingClassDeclarationEvaluation (§15.7.15) binds the class in the running context too.
      const name = node.name?.text ?? "default";
      const definition = classDefinition(node, name);
      return defineCode(
        "ClassDeclaration",
        `LET r == ${definition("s", "ctx", "EmptyStr")} IN IF IsAbrupt(r) THEN r ELSE LET b == InitializeBinding(r.s, ctx.lex, ${getUnits(name)}, Val(r)) IN IF IsAbrupt(b) THEN b ELSE Ok(b.s, Empty)`,
      );
    }
    if (ts.isEmptyStatement(node) || ts.isDebuggerStatement(node))
      return (state) => `Ok(${state}, Empty)`;
    if (ts.isBlock(node)) return block(node.statements, scope);
    if (ts.isIfStatement(node)) {
      const test = value(node.expression, scope);
      // §B.3.4: a function declaration as a clause runs as a block that holds it.
      const getClause = (clause: ts.Statement) =>
        ts.isFunctionDeclaration(clause) ? block([clause], scope) : statement(clause, scope, []);
      const whenTrue = getClause(node.thenStatement);
      const whenFalse =
        node.elseStatement === undefined ? undefined : getClause(node.elseStatement);
      return defineCode(
        "If",
        `LET r == ${test("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE IF ToBooleanValue(Val(r)) THEN UpdateEmptyThen(Undefined, ${whenTrue("r.s", "ctx")}) ELSE ${whenFalse === undefined ? "Ok(r.s, Undefined)" : `UpdateEmptyThen(Undefined, ${whenFalse("r.s", "ctx")})`}`,
      );
    }
    if (ts.isReturnStatement(node)) {
      if (node.expression === undefined)
        return (state) => `Abrupt(${state}, Completion("return", Undefined, Empty))`;
      const result = value(node.expression, scope);
      return (state, context) => `ReturnValueThen(${result(state, context)})`;
    }
    if (ts.isThrowStatement(node)) {
      const thrown = value(node.expression, scope);
      return (state, context) => `ThrowThen(${thrown(state, context)})`;
    }
    if (ts.isBreakStatement(node) || ts.isContinueStatement(node)) {
      const type = ts.isBreakStatement(node) ? "break" : "continue";
      const target = node.label === undefined ? "Empty" : getUnits(node.label.text);
      return (state) => `Abrupt(${state}, Completion("${type}", Empty, ${target}))`;
    }
    if (ts.isLabeledStatement(node)) {
      const label = node.label.text;
      const inner = node.statement;
      const isBreakable =
        ts.isIterationStatement(inner, false) ||
        ts.isSwitchStatement(inner) ||
        ts.isLabeledStatement(inner);
      const code = isBreakable
        ? statement(inner, scope, [...labels, label])
        : statement(inner, scope, []);
      return (state, context) => `LabelThen(${getUnits(label)}, ${code(state, context)})`;
    }
    if (ts.isWhileStatement(node) || ts.isDoStatement(node) || ts.isForStatement(node))
      return loop(node, scope, labels);
    if (ts.isForOfStatement(node) || ts.isForInStatement(node)) return forInOf(node, scope, labels);
    if (ts.isSwitchStatement(node)) return switchStatement(node, scope);
    if (ts.isTryStatement(node)) return tryStatement(node, scope);
    if (ts.isWithStatement(node)) {
      const object = value(node.expression, scope);
      const body = statement(node.statement, scope, []);
      return defineCode(
        "With",
        `LET r == ${object("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE LET o == ToObject(r.s, Val(r)) IN IF IsAbrupt(o) THEN o ELSE LET env == NewObjectEnvironment(o.s, Val(o), TRUE, ctx.lex) IN UpdateEmptyThen(Undefined, ${body("env.s", "WithLex(ctx, env.e)")})`,
      );
    }
    throw new TlaTypeScriptError(
      `tla-ts can't compile ${ts.SyntaxKind[node.kind]} to ESCore yet`,
      node,
    );
  };

  // Variable statements (§14.3.2.1) and let and const declarations (§14.3.1.2).
  const declarationList = (list: ts.VariableDeclarationList, scope: Scope): Code => {
    const isLet = isLexical(list);
    const steps: string[] = [];
    let state = "s";
    list.declarations.forEach((declaration, index) => {
      const initializer = declaration.initializer;
      const result = `d${index + 1}`;
      if (!ts.isIdentifier(declaration.name)) {
        // A pattern binds the initializer's value, in the running lexical environment for let
        // and const, and by assignment for var (§14.3.2.1, §14.3.1.2).
        if (initializer === undefined) return;
        const pattern = binding(declaration.name, scope);
        steps.push(
          `LET v${index + 1} == ${value(initializer, scope)(state, "ctx")} IN IF IsAbrupt(v${index + 1}) THEN v${index + 1} ELSE`,
          `LET ${result} == ${pattern(`v${index + 1}.s`, "ctx", `Val(v${index + 1})`, isLet ? "ctx.lex" : "NoEnv")} IN IF IsAbrupt(${result}) THEN ${result} ELSE`,
        );
        state = `${result}.s`;
        return;
      }
      const name = declaration.name.text;
      words.add(name);
      const units = getUnits(name);
      if (initializer === undefined && !isLet) return;
      const lhs = `l${index + 1}`;
      steps.push(
        `LET ${lhs} == ResolveBinding(${state}, ctx, ${units}, ${getBool(scope.isStrict)}) IN IF IsAbrupt(${lhs}) THEN ${lhs} ELSE`,
      );
      const assigned =
        initializer === undefined
          ? undefined
          : named(initializer, scope, getStr(name))(`${lhs}.s`, "ctx");
      steps.push(
        `LET ${result} == ${
          isLet
            ? assigned === undefined
              ? `InitializeReferencedBinding(${lhs}.s, Val(${lhs}), Undefined)`
              : `InitializeReferencedThen(Val(${lhs}), ${assigned})`
            : `PutValueThen(Val(${lhs}), ${assigned})`
        } IN IF IsAbrupt(${result}) THEN ${result} ELSE`,
      );
      state = `${result}.s`;
    });
    if (steps.length === 0) return (current) => `Ok(${current}, Empty)`;
    return defineCode("Declare", `${steps.join("\n  ")}\n  Ok(${state}, Empty)`);
  };

  // A statement list's evaluation (§14.2.2): the completion of the last statement that has a
  // value, each statement in its own operator.
  const statementList = (statements: readonly ts.Statement[], scope: Scope): Code => {
    if (statements.length === 0) return (state) => `Ok(${state}, Empty)`;
    const codesInOrder = statements.map((current) => statement(current, scope, []));
    let next: string | undefined;
    for (let index = codesInOrder.length - 1; index >= 0; index--) {
      const code = codesInOrder[index];
      const continuation =
        next === undefined
          ? "Ok(r.s, IF Val(r) = Empty THEN last ELSE Val(r))"
          : `${next}(r.s, ctx, IF Val(r) = Empty THEN last ELSE Val(r))`;
      next = define(
        "Statement",
        ["s", "ctx", "last"],
        `LET r == ${code("s", "ctx")} IN IF IsAbrupt(r) THEN Abrupt(r.s, UpdateEmpty(r.c, last)) ELSE ${continuation}`,
      );
    }
    const first = next;
    return (state, context) => `${first}(${state}, ${context}, Empty)`;
  };

  // Blocks (§14.2.2) and BlockDeclarationInstantiation (§14.2.3). A block that declares nothing
  // runs in its context, as a new environment without bindings changes nothing it can observe.
  const block = (statements: readonly ts.Statement[], scope: Scope): Code => {
    const declarations = getLexicalDeclarations(statements, true);
    const list = statementList(statements, scope);
    if (declarations.length === 0) return list;
    const declared = blockDeclarations(declarations, scope);
    return defineCode(
      "Block",
      `LET env == NewDeclarativeEnvironment(s, ctx.lex) bctx == WithLex(ctx, env.e) IN ${list(declared("env.s", "bctx"), "bctx")}`,
    );
  };

  // BlockDeclarationInstantiation (§14.2.3, §B.3.2.6): the state once the declarations have their
  // bindings in the environment that the context's lexical environment is, and each function its
  // object.
  const blockDeclarations = (declarations: LexicalDeclaration[], scope: Scope): Code => {
    const steps: string[] = [];
    let state = "s";
    declarations.forEach((declaration, index) => {
      steps.push(
        `LET b${index + 1} == BlockBindNames(${state}, ctx.lex, ${getSequence(declaration.names.map(getUnits))}, ${getBool(declaration.isConst)}) IN`,
      );
      state = `b${index + 1}`;
      if (declaration.fn !== undefined) {
        const instantiate = instantiateFunction(declaration.fn, scope);
        const units = getUnits(declaration.names[0]);
        steps.push(
          `LET fo${index + 1} == ${instantiate(state, "ctx")} IN`,
          `LET fb${index + 1} == IF E(fo${index + 1}.s, ctx.lex).b[${units}].init THEN SetMutableBinding(fo${index + 1}.s, ctx.lex, ${units}, Val(fo${index + 1}), FALSE).s ELSE InitializeBinding(fo${index + 1}.s, ctx.lex, ${units}, Val(fo${index + 1})).s IN`,
        );
        state = `fb${index + 1}`;
      }
    });
    const operator = define("Declarations", ["s", "ctx"], `${steps.join("\n  ")}\n  ${state}`);
    return (current, context) => `${operator}(${current}, ${context})`;
  };

  // The while, do-while, and for statements (§14.7), whose iterations ESCore's LoopFrom runs: a
  // loop is [id, labels, lets], and LoopIteration runs the iteration of the loop id.
  const loop = (
    node: ts.WhileStatement | ts.DoStatement | ts.ForStatement,
    scope: Scope,
    labels: string[],
  ): Code => {
    const id = loops.length + 1;
    loops.push({ id, body: "" });
    const labelSet = `{${labels.map(getUnits).join(", ")}}`;
    const body = statement(node.statement, scope, []);
    if (ts.isWhileStatement(node)) {
      const test = value(node.expression, scope);
      loops[id - 1].body =
        `LET r == ${test("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE IF ~ToBooleanValue(Val(r)) THEN Ok(r.s, v) ELSE LET b == ${body("r.s", "ctx")} IN IF IterationEnd(b, loop.labels, v) # Empty THEN IterationEnd(b, loop.labels, v) ELSE Iterate(b.s, ctx, NextIterationValue(b.c, v))`;
      return (state, context) =>
        `BreakTargetThen(LoopFrom(${state}, ${context}, [id |-> ${id}, labels |-> ${labelSet}, lets |-> <<>>], Undefined, 0))`;
    }
    if (ts.isDoStatement(node)) {
      const test = value(node.expression, scope);
      loops[id - 1].body =
        `LET b == ${body("s", "ctx")} IN IF IterationEnd(b, loop.labels, v) # Empty THEN IterationEnd(b, loop.labels, v) ELSE LET w == NextIterationValue(b.c, v) r == ${test("b.s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE IF ~ToBooleanValue(Val(r)) THEN Ok(r.s, w) ELSE Iterate(r.s, ctx, w)`;
      return (state, context) =>
        `BreakTargetThen(LoopFrom(${state}, ${context}, [id |-> ${id}, labels |-> ${labelSet}, lets |-> <<>>], Undefined, 0))`;
    }
    const test =
      node.condition === undefined
        ? (state: string) => `Ok(${state}, True)`
        : value(node.condition, scope);
    const increment = node.incrementor === undefined ? undefined : value(node.incrementor, scope);
    loops[id - 1].body =
      `LET r == ${test("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE IF ~ToBooleanValue(Val(r)) THEN Ok(r.s, v) ELSE LET b == ${body("r.s", "ctx")} IN IF IterationEnd(b, loop.labels, v) # Empty THEN IterationEnd(b, loop.labels, v) ELSE LET p == CreatePerIterationEnvironment(b.s, ctx, loop.lets) IN IF IsAbrupt(p) THEN p ELSE ForIncrementThen(Val(p), loop, NextIterationValue(b.c, v), ${increment === undefined ? "Ok(p.s, Empty)" : increment("p.s", "Val(p)")})`;
    const initializer = node.initializer;
    if (
      initializer !== undefined &&
      ts.isVariableDeclarationList(initializer) &&
      isLexical(initializer)
    ) {
      const names = getDeclaredNames(initializer);
      const lets = isConst(initializer) ? "<<>>" : getSequence(names.map(getUnits));
      const declaration = declarationList(initializer, scope);
      return defineCode(
        "For",
        `LET env == NewDeclarativeEnvironment(s, ctx.lex) loopCtx == WithLex(ctx, env.e) IN BreakTargetThen(ForDeclarationThen(loopCtx, [id |-> ${id}, labels |-> ${labelSet}, lets |-> ${lets}], ${declaration(`BlockBindNames(env.s, env.e, ${getSequence(names.map(getUnits))}, ${getBool(isConst(initializer))})`, "loopCtx")}))`,
      );
    }
    const init =
      initializer === undefined
        ? (state: string) => `Ok(${state}, Empty)`
        : ts.isVariableDeclarationList(initializer)
          ? declarationList(initializer, scope)
          : value(initializer, scope);
    return defineCode(
      "For",
      `BreakTargetThen(ForDeclarationThen(ctx, [id |-> ${id}, labels |-> ${labelSet}, lets |-> <<>>], ${init("s", "ctx")}))`,
    );
  };

  // The for-in and for-of statements (§14.7.5): ForIn/OfHeadEvaluation, then ESCore's LoopFrom
  // over the iteration LoopIteration gives for the loop's id.
  const forInOf = (
    node: ts.ForInStatement | ts.ForOfStatement,
    scope: Scope,
    labels: string[],
  ): Code => {
    if (ts.isForOfStatement(node) && node.awaitModifier !== undefined) {
      throw new TlaTypeScriptError(
        "tla-ts can't compile a generator or an async function to ESCore yet",
        node,
      );
    }
    const isEnumerate = ts.isForInStatement(node);
    const id = loops.length + 1;
    loops.push({ id, body: "" });
    const labelSet = `{${labels.map(getUnits).join(", ")}}`;
    const initializer = node.initializer;
    const body = statement(node.statement, scope, []);
    let bind: string;
    let tdz: string[] = [];
    if (ts.isVariableDeclarationList(initializer)) {
      const declaration = initializer.declarations[0];
      if (declaration.initializer !== undefined) {
        throw new TlaTypeScriptError(
          "tla-ts can't compile an initializer in a for-in head to ESCore yet",
          node,
        );
      }
      const names = getBoundNames(declaration.name);
      const pattern = binding(declaration.name, scope);
      if (isLexical(initializer)) {
        tdz = names;
        bind = `LET env == NewDeclarativeEnvironment(value.s, ctx.lex) iterCtx == WithLex(ctx, env.e) s1 == BlockBindNames(env.s, env.e, ${getSequence(names.map(getUnits))}, ${getBool(isConst(initializer))}) IN ResultThen(iterCtx, ${pattern("s1", "iterCtx", "Val(value)", "env.e")})`;
      } else if (ts.isIdentifier(declaration.name)) {
        bind = `ResultThen(ctx, AssignToThen(Val(value), ResolveBinding(value.s, ctx, ${getUnits(declaration.name.text)}, ${getBool(scope.isStrict)})))`;
      } else {
        bind = `ResultThen(ctx, ${pattern("value.s", "ctx", "Val(value)", "NoEnv")})`;
      }
    } else if (
      ts.isObjectLiteralExpression(initializer) ||
      ts.isArrayLiteralExpression(initializer)
    ) {
      bind = `ResultThen(ctx, ${destructuring(initializer, scope)("value.s", "ctx", "Val(value)")})`;
    } else {
      bind = `ResultThen(ctx, AssignToThen(Val(value), ${reference(initializer, scope)("value.s", "ctx")}))`;
    }
    loops[id - 1].body = [
      `LET r == Call(s, it.next, it.iterator, <<>>) IN IF IsAbrupt(r) THEN r ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s) ELSE`,
      "LET done == IteratorComplete(r.s, Val(r)) IN IF IsAbrupt(done) THEN done ELSE IF Val(done) THEN Ok(done.s, v) ELSE",
      `LET value == Get(done.s, Val(r), SV("value")) IN IF IsAbrupt(value) THEN value ELSE`,
      `LET bound == ${bind} IN IF IsAbrupt(bound) THEN ForInOfClose(loop, it, bound) ELSE`,
      `ForInOfStatementThen(ctx, loop, it, v, ${body("bound.s", "Val(bound)")})`,
    ].join("\n    ");
    const expression = value(node.expression, scope);
    const head =
      tdz.length === 0
        ? `${expression("s", "ctx")}`
        : `LET env == NewDeclarativeEnvironment(s, ctx.lex) IN ${expression(`BlockBindNames(env.s, env.e, ${getSequence(tdz.map(getUnits))}, FALSE)`, "WithLex(ctx, env.e)")}`;
    return defineCode(
      "ForInOf",
      `BreakTargetThen(ForInOfHeadThen(ctx, [id |-> ${id}, labels |-> ${labelSet}, lets |-> <<>>, it |-> Empty, iterationKind |-> "${isEnumerate ? "enumerate" : "iterate"}", iteratorKind |-> "sync"], ${head}))`,
    );
  };

  // The switch statement (§14.12): CaseBlockEvaluation searches the clauses before the default,
  // then those after it, and runs every clause from the one that matches, or from the default.
  const switchStatement = (node: ts.SwitchStatement, scope: Scope): Code => {
    const clauses = node.caseBlock.clauses;
    const defaultIndex = clauses.findIndex(ts.isDefaultClause);
    const runs: string[] = [];
    for (let index = clauses.length - 1; index >= 0; index--) {
      const list = statementList(clauses[index].statements, scope);
      const next = runs[0];
      runs.unshift(
        define(
          "CaseRun",
          ["s", "ctx", "v"],
          `LET r == ${list("s", "ctx")} IN IF IsAbrupt(r) THEN Abrupt(r.s, UpdateEmpty(r.c, v)) ELSE ${next === undefined ? "Ok(r.s, NextIterationValue(r.c, v))" : `${next}(r.s, ctx, NextIterationValue(r.c, v))`}`,
        ),
      );
    }
    const order = clauses.map((_, index) => index).filter((index) => index !== defaultIndex);
    let search =
      defaultIndex === -1 ? "Ok(s, Undefined)" : `${runs[defaultIndex]}(s, ctx, Undefined)`;
    for (let position = order.length - 1; position >= 0; position--) {
      const index = order[position];
      const clause = clauses[index] as ts.CaseClause;
      const selector = value(clause.expression, scope);
      const rest = define("CaseSearch", ["s", "ctx", "input"], search);
      search = `LET r == ${selector("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE IF IsStrictlyEqual(input, Val(r)) THEN ${runs[index]}(r.s, ctx, Undefined) ELSE ${rest}(r.s, ctx, input)`;
    }
    const first = define("CaseSearch", ["s", "ctx", "input"], search);
    const discriminant = value(node.expression, scope);
    const declarations = getLexicalDeclarations(
      clauses.flatMap((clause) => [...clause.statements]),
      true,
    );
    const declared = blockDeclarations(declarations, scope);
    return defineCode(
      "Switch",
      `LET r == ${discriminant("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE LET env == NewDeclarativeEnvironment(r.s, ctx.lex) IN BreakTargetThen(${first}(${declared("env.s", "WithLex(ctx, env.e)")}, WithLex(ctx, env.e), Val(r)))`,
    );
  };

  // The try statement (§14.15).
  const tryStatement = (node: ts.TryStatement, scope: Scope): Code => {
    const tryBlock = block(node.tryBlock.statements, scope);
    const clause = node.catchClause;
    const steps = [`LET r == ${tryBlock("s", "ctx")} IN`];
    if (clause !== undefined) {
      const catchBlock = block(clause.block.statements, scope);
      const parameter = clause.variableDeclaration;
      const handler =
        parameter === undefined
          ? catchBlock("r.s", "ctx")
          : `LET env == NewCatchEnvironment(r.s, ctx.lex) cctx == WithLex(ctx, env.e) b == ${binding(parameter.name, scope)(`BlockBindNames(env.s, env.e, ${getSequence(getBoundNames(parameter.name).map(getUnits))}, FALSE)`, "cctx", "r.c.value", "env.e")} IN IF IsAbrupt(b) THEN b ELSE ${catchBlock("b.s", "cctx")}`;
      steps.push(`LET c == IF r.c.type = "throw" THEN ${handler} ELSE r IN`);
    } else steps.push("LET c == r IN");
    if (node.finallyBlock === undefined) steps.push("UpdateEmptyThen(Undefined, c)");
    else
      steps.push(
        `TryFinallyThen(c.c, ${block(node.finallyBlock.statements, scope)("c.s", "ctx")})`,
      );
    return defineCode("Try", steps.join("\n  "));
  };

  // ScriptEvaluation (§16.1.6) with GlobalDeclarationInstantiation (§16.1.7).
  const script = () => {
    const statements = sourceFile.statements;
    const isStrict = hasUseStrict(statements);
    const scope: Scope = { isStrict, isClassBody: false };
    for (const current of statements) {
      if (
        ts.isImportDeclaration(current) ||
        ts.isExportDeclaration(current) ||
        ts.isExportAssignment(current)
      ) {
        throw new TlaTypeScriptError("tla-ts can't compile a module to ESCore yet", current);
      }
    }
    const lexical = getLexicalDeclarations(statements, false);
    const lexicalNames = lexical.flatMap((declaration) => declaration.names);
    const varScoped = getVarScoped(statements);
    const functions = getFunctionsToInitialize(varScoped.functions);
    const functionNames = functions.map((declaration) => declaration.name?.text ?? "default");
    const declaredVarNames = dedupe(varScoped.names).filter(
      (name) =>
        !functionNames.includes(name) &&
        !varScoped.functions.some((declaration) => declaration.name?.text === name),
    );
    const steps = [
      "LET env == s.globalEnv IN",
      `IF \\E n \\in {${[...lexicalNames, ...dedupe(varScoped.names)].map(getUnits).join(", ")}} : HasLexicalDeclaration(s, env, n) THEN ThrowError(s, "SyntaxError") ELSE`,
      `LET restricted == AnyRestrictedGlobal(s, env, ${getSequence(lexicalNames.map(getUnits))}) IN IF IsAbrupt(restricted) THEN restricted ELSE IF Val(restricted) THEN ThrowError(restricted.s, "SyntaxError") ELSE`,
      `LET fnCheck == CheckGlobalNames(restricted.s, env, ${getSequence([...functionNames].reverse().map(getUnits))}, TRUE) IN IF IsAbrupt(fnCheck) THEN fnCheck ELSE`,
      `LET varCheck == CheckGlobalNames(fnCheck.s, env, ${getSequence(declaredVarNames.map(getUnits))}, FALSE) IN IF IsAbrupt(varCheck) THEN varCheck ELSE`,
    ];
    // Step 12 (§B.3.2.2): outside strict mode, var bindings for the block functions that the
    // global object can take.
    const hoisted = isStrict ? [] : getHoistableFunctions(statements);
    if (hoisted.length > 0) {
      steps.push(
        `LET hoist == HoistGlobalFunctions(varCheck.s, env, ${getSequence(hoisted.map((declaration) => `[name |-> ${getUnits(declaration.name?.text ?? "*default*")}, site |-> ${getSite(declaration)}]`))}, {${[...functionNames, ...declaredVarNames].map(getUnits).join(", ")}}) IN IF IsAbrupt(hoist) THEN hoist ELSE`,
      );
    }
    let state = hoisted.length > 0 ? "hoist.s" : "varCheck.s";
    lexical.forEach((declaration, index) => {
      steps.push(
        `LET x${index + 1} == CreateGlobalLexicalNames(${state}, env, ${getSequence(declaration.names.map(getUnits))}, ${getBool(declaration.isConst)}) IN IF IsAbrupt(x${index + 1}) THEN x${index + 1} ELSE`,
      );
      state = `x${index + 1}.s`;
    });
    functions.forEach((declaration, index) => {
      const instantiate = instantiateFunction(declaration, scope);
      steps.push(
        `LET g${index + 1} == ${instantiate(state, "ScriptContext(s)")} IN`,
        `LET h${index + 1} == CreateGlobalFunctionBinding(g${index + 1}.s, env, ${getUnits(declaration.name?.text ?? "default")}, Val(g${index + 1}), FALSE) IN IF IsAbrupt(h${index + 1}) THEN h${index + 1} ELSE`,
      );
      state = `h${index + 1}.s`;
    });
    steps.push(
      `LET i == CreateGlobalVars(${state}, env, ${getSequence(declaredVarNames.map(getUnits))}) IN IF IsAbrupt(i) THEN i ELSE`,
      `${statementList(statements, scope)("i.s", "ScriptContext(i.s)")}`,
    );
    return define("Script", ["s"], steps.join("\n  "));
  };

  const entry = script();
  definitions.push({
    name: "CallCode",
    arity: 5,
    text: [
      "CallCode(s, f, ctx, args, id) ==",
      ...(codes.length === 0
        ? [`  Assert(FALSE, "tla-ts can't call a function the program doesn't define")`]
        : codes.map(
            (code, index) =>
              `  ${index === 0 ? "CASE" : "  []"} id = ${code.id} -> Code${code.id}(s, f, ctx, args)`,
          )),
    ].join("\n"),
  });
  definitions.push(
    ...codes.map((code) => ({ name: `Code${code.id}`, arity: 4, text: code.body })),
    {
      name: "LoopIteration",
      arity: 4,
      text: [
        "LoopIteration(s, ctx, loop, v) ==",
        ...(loops.length === 0
          ? [`  Assert(FALSE, "tla-ts can't run a loop the program doesn't have")`]
          : loops.map(
              (current, index) =>
                `  ${index === 0 ? "CASE" : "  []"} loop.id = ${current.id} -> Loop${current.id}(s, ctx, loop, v)`,
            )),
      ].join("\n"),
    },
    ...loops.map((current) => ({
      name: `Loop${current.id}`,
      arity: 4,
      text: `Loop${current.id}(s, ctx, loop, v) ==\n  ${current.body.includes("it.next") ? "LET it == loop.it IN " : ""}${current.body}`,
    })),
    { name: "Program", arity: 1, text: `Program(s) == ${entry}(s)` },
  );
  return {
    definitions: [
      { name: "SourceText", arity: 0, text: `SourceText == ${getUnits(sourceFile.text)}` },
      ...definitions,
    ],
    words,
    identifiers,
  };
};
