import ts from "@typescript/typescript6";
import { type Expression, getChildren, type OperatorDefinition } from "../../ast";
import { TlaTypeScriptError } from "../../errors";
import { isProcessDeclared } from "../common-js";
import { getLocals, type Locals } from "./locals";
import type { ResolutionFailure } from "./resolve";
import {
  afterBlankLine,
  apply,
  boundIn,
  type CodeDefinition,
  defineOperator,
  dot,
  except,
  exceptAt,
  exists,
  functionOf,
  ifThen,
  letIn,
  num,
  onLine,
  type Operand,
  parenthesized,
  pathTo,
  printCodeExpression,
  recordOf,
  ref,
  setOf,
  string,
  subscript,
  toExpression,
  tuple,
  withInnerLines,
} from "./code-tree";
import { getPatches, getSourceString } from "./units";

// Specializes JS.tla's evaluation rules to a program: each syntax node gives the TLA+ that JS.tla's
// Evaluate rule for its kind leaves once the node is known, with the evaluation of each child in
// place of Evaluate(s, ctx, child). The runtime values still go through JS.tla's operators, so
// only what the syntax says folds away.

// The TLA+ of an evaluation in the state and context that the two operands give, whose result is
// a record [s, c].
interface Code {
  (state: Operand, context: Operand): Expression;
}

// The TLA+ of ArrayAccumulation into an array from an index, in a state and the context ctx, whose
// result is a record [s, c] with the next index.
interface ElementsCode {
  (state: Operand, array: Operand, index: Operand): Expression;
}

interface Scope {
  isStrict: boolean;
  // The code ids of the functions that the scope's code is in, outermost first.
  isClassBody: boolean;
  // Whether the scope's code is an async generator's, whose return awaits its value.
  isAsyncGenerator: boolean;
  // The bindings of the scope's function that its frame holds.
  locals?: Locals;
}

interface NamedCode {
  (state: Operand, context: Operand, name: Operand): Expression;
}

// The TLA+ of binding the value that the third operand gives to a binding's names, in the
// environment the fourth gives, or by assignment where it's NoEnv.
interface BindingCode {
  (state: Operand, context: Operand, value: Operand, env: Operand): Expression;
}

// The TLA+ of assigning the value the third operand gives to a destructuring pattern.
interface PatternCode {
  (state: Operand, context: Operand, value: Operand): Expression;
}

// The TLA+ of a step that goes on with the rest of its operator's steps.
interface Step {
  (rest: Expression): Expression;
}

interface FunctionLike {
  node: ts.Node;
  parameters: readonly ts.ParameterDeclaration[];
  body: ts.ConciseBody | undefined;
  kind: "normal" | "arrow" | "method" | "constructor" | "get" | "set" | "staticBlock";
}

interface LexicalDeclaration {
  names: string[];
  // The identifier that declares each name.
  nodes: ts.Node[];
  isConst: boolean;
  fn: ts.FunctionDeclaration | undefined;
}

// A file of a program at its path: a script, an ES module, or a CommonJS module, whose code is the
// function that Node wraps it in, its only statement. A module's requests and requires load the
// files at the indices of the program's files that targets gives by specifier, starting at 1.
export interface ProgramFile {
  sourceFile: ts.SourceFile;
  path: string;
  // A JSON file's sourceFile is empty, and its text is its JSON, where JSON.parse reads it.
  kind: "script" | "module" | "commonjs" | "json" | "host";
  json?: string;
  targets: ReadonlyMap<string, number>;
  // The error that Node's resolution throws for each specifier of an import that it finds no file
  // for, where the files alone decide it.
  failures?: ReadonlyMap<string, ResolutionFailure>;
  // The specifiers of a CommonJS module's requires that Node's require finds no module for, where
  // the files alone decide it.
  missingRequires?: ReadonlySet<string>;
  // The names that Node's ModuleWrap of a CommonJS module exports, which its lexer finds.
  exportNames: readonly string[];
  // The file of an ES module's facade, which a require of it gives the namespace of.
  facade?: number;
  // Whether the file has an early error, for which Node throws a SyntaxError where it loads it.
  isRejected?: boolean;
  // The names of the files of its directory, where an import() of a computed string may name one
  // of its candidates (JsTlaSteps), and else none.
  names?: readonly string[];
}

// A declaration at the top level of the program's first file, with the definitions of the program's
// code that it compiles to, which a host shows beside it.
export interface ProgramRegion {
  names: string[];
  definitions: string[];
}

export interface SpecializedProgram {
  definitions: CodeDefinition[];
  regions: ProgramRegion[];
  words: Set<string>;
  // The names the program's identifiers resolve, which may be the global object's.
  identifiers: Set<string>;
  // Whether the program has an async function, whose awaits queue jobs.
  isAsync: boolean;
}

const getUnits = (text: string) =>
  tuple(Array.from({ length: text.length }, (_, index) => num(text.charCodeAt(index))));

const getStr = (text: string) => apply("Str", [getUnits(text)]);

// A state that no code names, which a code's text holds where the code reads its state.
const NO_STATE = "NoState";

// Whether an expression names a name, as a word of its text.
const isNaming = (expression: Expression, names: ReadonlySet<string>): boolean =>
  (expression.kind === "Identifier" && names.has(expression.name)) ||
  (expression.kind === "Apply" && names.has(expression.operator)) ||
  (expression.kind === "FieldAccess" && names.has(expression.field)) ||
  ((expression.kind === "Record" || expression.kind === "RecordSet") &&
    expression.fields.some((field) => names.has(field.name))) ||
  getChildren(expression).some((child) => isNaming(child, names));

const CONTEXT_NAMES = new Set([NO_STATE, "ctx"]);

// The value of code that evaluates to the same value in every state, if it does.
const getConstant = (code: Code) => {
  const result = code(NO_STATE, "ctx");
  return result.kind === "Apply" &&
    result.operator === "Ok" &&
    result.args[0].kind === "Identifier" &&
    result.args[0].name === NO_STATE &&
    !isNaming(result.args[1], CONTEXT_NAMES)
    ? result.args[1]
    : undefined;
};

const getLimbs = (value: bigint) => {
  const limbs: number[] = [];
  for (let rest = value; rest > 0n; rest >>= 15n) limbs.push(Number(rest & 32767n));
  return tuple(limbs.map(num));
};

const getNumberRecord = (
  kind: string,
  isNegative: boolean,
  integer: number,
  mantissa: bigint,
  exponent: number,
) =>
  recordOf([
    ["k", string(kind)],
    ["neg", getBool(isNegative)],
    ["i", num(integer)],
    ["m", getLimbs(mantissa)],
    ["e", num(exponent)],
  ]);

// A Number as ESNumber's canonical record, the record that a numeric literal gives.
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

const getBool = (value: boolean) => ref(value ? "TRUE" : "FALSE");

const getCompletion = (type: string, value: Operand, target: Operand) =>
  apply("Completion", [string(type), value, target]);

// A step that names a result, whose abrupt completion ends the steps: LET name == result IN IF
// IsAbrupt(name) THEN abrupt ELSE rest.
const checked = (name: string, result: Operand, rest: Operand, abrupt: Operand = name) =>
  letIn([defineOperator(name, [], result)], ifThen(apply("IsAbrupt", [name]), abrupt, rest));

// A step that names values: LET name == value ... IN rest.
const letStep =
  (...named: (readonly [string, Operand])[]): Step =>
  (rest) =>
    letIn(
      named.map((entry) => defineOperator(entry[0], [], entry[1])),
      rest,
    );

// Steps, each going on with the next on a line of its own at an indent, and then last.
const chain = (steps: readonly Step[], last: Operand, indent = 2) =>
  steps.reduceRight((rest, step) => step(onLine(rest, indent)), toExpression(last));

// An expression that stops the check with a message where it's evaluated.
const getUnreachable = (message: string) => apply("Assert", ["FALSE", string(message)]);

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
// Whether a value is truthy, or falsy.
const isTruthy = (value: Expression) => apply("ToBooleanValue", [value]);
const isFalsy = (value: Expression) => apply("~", [apply("ToBooleanValue", [value])]);
// Whether a value is neither undefined nor null.
const isPresent = (value: Expression) => apply("~", [apply("IsNullish", [value])]);

const LOGICAL_TESTS = new Map([
  [ts.SyntaxKind.AmpersandAmpersandToken, isFalsy],
  [ts.SyntaxKind.BarBarToken, isTruthy],
  [ts.SyntaxKind.QuestionQuestionToken, isPresent],
  [ts.SyntaxKind.AmpersandAmpersandEqualsToken, isFalsy],
  [ts.SyntaxKind.BarBarEqualsToken, isTruthy],
  [ts.SyntaxKind.QuestionQuestionEqualsToken, isPresent],
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

// The identifiers that declare a binding's names, in order.
const getBoundIdentifiers = (name: ts.BindingName): ts.Identifier[] =>
  ts.isIdentifier(name)
    ? [name]
    : name.elements.flatMap((element) =>
        ts.isOmittedExpression(element) ? [] : getBoundIdentifiers(element.name),
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

const isUsing = (list: ts.VariableDeclarationList) => {
  const kind = list.flags & ts.NodeFlags.BlockScoped;
  return kind === ts.NodeFlags.Using || kind === ts.NodeFlags.AwaitUsing;
};

// IsConstantDeclaration (§8.2.4): a const, using, or await using declaration.
const isConst = (list: ts.VariableDeclarationList) =>
  (list.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.Const || isUsing(list);

// The kind of the resources that a declaration's bindings add (DeclarationKind in JS.tla).
const getResourceKind = (list: ts.VariableDeclarationList) =>
  (list.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.AwaitUsing
    ? "async-dispose"
    : isUsing(list)
      ? "sync-dispose"
      : "normal";

// Whether a statement list declares resources in the environment that it runs in (HasUsing in
// JS.tla).
const hasUsing = (statements: readonly ts.Statement[]) =>
  statements.some(
    (statement) => ts.isVariableStatement(statement) && isUsing(statement.declarationList),
  );

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
      return [
        {
          names: getDeclaredNames(inner.declarationList),
          nodes: inner.declarationList.declarations.flatMap((declaration) =>
            getBoundIdentifiers(declaration.name),
          ),
          isConst: isConst(inner.declarationList),
          fn: undefined,
        },
      ];
    }
    if (ts.isClassDeclaration(inner) && inner.name !== undefined) {
      return [{ names: [inner.name.text], nodes: [inner.name], isConst: false, fn: undefined }];
    }
    if (isBlock && ts.isFunctionDeclaration(inner)) {
      return [
        {
          names: [inner.name?.text ?? "*default*"],
          nodes: [inner.name ?? inner],
          isConst: false,
          fn: inner,
        },
      ];
    }
    return [];
  });

// The function declarations in blocks that Annex B hoists to the var scope of a function body or
// script outside strict mode (HoistableFunctions in JS.tla, §B.3.2.1), each one whose name nothing
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

// Whether a declaration has a modifier of the kind given, as export or default.
const hasModifier = (node: ts.Node, kind: ts.SyntaxKind) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ?? false);

const isExported = (node: ts.Node) => hasModifier(node, ts.SyntaxKind.ExportKeyword);

// Syntax that only a module has: an import or export declaration, or a declaration it exports.
const isModuleItem = (node: ts.Statement) =>
  ts.isImportDeclaration(node) ||
  ts.isImportEqualsDeclaration(node) ||
  ts.isExportDeclaration(node) ||
  ts.isExportAssignment(node) ||
  isExported(node);

// The name a module's declaration binds, *default* for a default export without a name.
const getDeclaredName = (node: ts.FunctionDeclaration | ts.ClassDeclaration) =>
  node.name?.text ?? "*default*";

// Whether a module's code awaits outside its functions (HasTopLevelAwait, §16.2.1.7.1), where a
// computed key of a method or a field still runs.
const hasTopLevelAwait = (node: ts.Node): boolean => {
  if (
    ts.isAwaitExpression(node) ||
    (ts.isForOfStatement(node) && node.awaitModifier !== undefined) ||
    (ts.isVariableDeclarationList(node) &&
      (node.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.AwaitUsing)
  )
    return true;
  if (ts.isClassStaticBlockDeclaration(node)) return false;
  if (ts.isFunctionLike(node) || ts.isPropertyDeclaration(node)) {
    return (
      node.name !== undefined && ts.isComputedPropertyName(node.name) && hasTopLevelAwait(node.name)
    );
  }
  return ts.forEachChild(node, (child) => (hasTopLevelAwait(child) ? true : undefined)) ?? false;
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

// The lexical environment of a context that a TLA+ expression gives.
const getLex = (context: Operand) => {
  const expression = typeof context === "string" ? ref(context) : context;
  return dot(
    typeof context === "string" || /^[\w.]+(?:\(.*\))?$/s.test(printCodeExpression(expression))
      ? context
      : parenthesized(expression),
    "lex",
  );
};

// Whether a with statement holds a node, whose object environment may then resolve its names, in
// the functions that close over it too.
const hasWithAround = (node: ts.Node): boolean =>
  node.parent !== undefined && (ts.isWithStatement(node.parent) || hasWithAround(node.parent));

// Whether code reads its function's this value, its home object, or new.target.
const readsThis = (node: ts.Node): boolean =>
  node.kind === ts.SyntaxKind.ThisKeyword ||
  node.kind === ts.SyntaxKind.SuperKeyword ||
  ts.isMetaProperty(node) ||
  (ts.forEachChild(node, (child) => (readsThis(child) ? true : undefined)) ?? false);

// Whether code makes a function or a class, whose closure keeps the environment it runs in.
const hasClosure = (node: ts.Node): boolean =>
  ts.isFunctionDeclaration(node) ||
  ts.isFunctionExpression(node) ||
  ts.isArrowFunction(node) ||
  ts.isMethodDeclaration(node) ||
  ts.isAccessor(node) ||
  ts.isClassLike(node) ||
  (ts.forEachChild(node, (child) => (hasClosure(child) ? true : undefined)) ?? false);

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

// A dispatch on an id from low to high as a balanced tree of comparisons, which TLC and tla-ts
// evaluate in log n steps where a CASE takes n.
const getDispatch = (
  id: string,
  low: number,
  high: number,
  getArm: (id: number) => Operand,
): Operand => {
  if (low === high) return getArm(low);
  const middle = Math.floor((low + high) / 2);
  return ifThen(
    apply("<=", [id, num(middle)]),
    getDispatch(id, low, middle, getArm),
    getDispatch(id, middle + 1, high, getArm),
  );
};

// The name that a function is reached by, other than as a value where it's written: a declaration's
// or method's, or that of the property or variable a function expression initializes. An accessor
// runs wherever its property is read or written, by keys that JS.tla may compute, as an array's
// operators compute indices, so it has none, nor has a function under an index.
const getFunctionKey = (node: ts.Node) => {
  // A module's namespace object reaches what the module exports by any key.
  if (
    isExported(node) ||
    (ts.isVariableDeclaration(node.parent) && isExported(node.parent.parent.parent))
  ) {
    return undefined;
  }
  const named =
    ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)
      ? node.name
      : (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
          (ts.isPropertyAssignment(node.parent) || ts.isVariableDeclaration(node.parent)) &&
          node.parent.initializer === node
        ? node.parent.name
        : undefined;
  return named !== undefined &&
    (ts.isIdentifier(named) || ts.isStringLiteral(named)) &&
    !/^\d/.test(named.text)
    ? named.text
    : undefined;
};

// The reserved words that V8's scanner gives tokens of their own, which, as a callee's last token,
// make a call's position in a stack trace its ( rather than the callee's name.
const RESERVED_WORDS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
]);

// The words that V8's scanner gives tokens of their own among its identifiers, which a tagged
// template's position doesn't take as its tag's name.
const CONTEXTUAL_WORDS = new Set([
  "get",
  "set",
  "using",
  "of",
  "accessor",
  "async",
  "await",
  "yield",
  "let",
  "static",
  "implements",
  "interface",
  "package",
  "private",
  "protected",
  "public",
]);

const isCallableName = (node: ts.Node | undefined): node is ts.Identifier =>
  node !== undefined && ts.isIdentifier(node) && !RESERVED_WORDS.has(node.text);

// The offset that V8 gives a call, new, or tagged template as its position in a stack trace
// (ParserBase::ParseLeftHandSideContinuation): a call's callee's last token where that is an
// identifier or super, and its ( otherwise; a new's new; a tagged template's tag's name where its
// last token is an identifier, and its template otherwise. A tag that calls has none here.
const getCallOffset = (
  node: ts.CallExpression | ts.NewExpression | ts.TaggedTemplateExpression,
): number | undefined => {
  if (ts.isNewExpression(node)) return node.getStart();
  if (ts.isTaggedTemplateExpression(node)) {
    const hasCall = (expression: ts.Expression): boolean =>
      ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression)
        ? hasCall(expression.expression)
        : !ts.isIdentifier(expression) && expression.kind !== ts.SyntaxKind.ThisKeyword;
    if (hasCall(node.tag)) return undefined;
    const name = ts.isPropertyAccessExpression(node.tag) ? node.tag.name : node.tag;
    return isCallableName(name) && !CONTEXTUAL_WORDS.has(name.text)
      ? name.getStart()
      : node.template.getStart();
  }
  const callee = node.expression;
  if (callee.kind === ts.SyntaxKind.SuperKeyword) return callee.getStart();
  const name =
    node.questionDotToken !== undefined
      ? undefined
      : ts.isPropertyAccessExpression(callee)
        ? callee.name
        : callee;
  if (isCallableName(name)) return name.getStart();
  return node
    .getChildren()
    .find((child) => child.kind === ts.SyntaxKind.OpenParenToken && child.pos >= callee.end)
    ?.getStart();
};

// Whether an expression holds syntax at which V8's FuncNameInferrer may name the functions it
// waits on: a function, class, object literal, or assignment.
const hasNamingSyntax = (node: ts.Node): boolean =>
  ts.isFunctionLike(node) ||
  ts.isClassLike(node) ||
  ts.isObjectLiteralExpression(node) ||
  (ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
  ts.forEachChild(node, hasNamingSyntax) === true;

// The names that V8's FuncNameInferrer gathers of an assignment's target, a property path of
// identifiers and this, without prototype, where the target is one.
const getTargetNames = (node: ts.Expression): string[] | undefined => {
  if (ts.isIdentifier(node)) return [node.text];
  if (node.kind === ts.SyntaxKind.ThisKeyword) return [];
  if (ts.isPropertyAccessExpression(node) && node.questionDotToken === undefined) {
    const names = getTargetNames(node.expression);
    return names === undefined || node.name.text === "prototype"
      ? names
      : [...names, node.name.text];
  }
  if (ts.isElementAccessExpression(node) && node.questionDotToken === undefined) {
    const names = getTargetNames(node.expression);
    const key = node.argumentExpression;
    const isName =
      ts.isStringLiteral(key) &&
      !(/^(0|[1-9]\d*)$/.test(key.text) && Number(key.text) < 4294967295);
    return names === undefined ? undefined : [...names, isName ? key.text : "<computed>"];
  }
  return undefined;
};

// The name V8 infers for an anonymous function or class where it's sure (FuncNameInferrer): none
// as a call's callee or argument, which the call takes out of those to name, where no later
// argument names it first, and the target's path where a statement assigns it to a property in
// code that V8 parses on its own, as it does a function that isn't parenthesized, and so not
// called at once.
const getInferredName = (node: ts.Node): string | undefined => {
  const value =
    ts.findAncestor(node, (ancestor) => !ts.isParenthesizedExpression(ancestor.parent)) ?? node;
  const outer = value.parent;
  if (ts.isCallExpression(outer)) {
    const index = outer.arguments.findIndex((argument) => argument === value);
    return outer.arguments.slice(index + 1).some(hasNamingSyntax) ? undefined : "";
  }
  if (
    !ts.isBinaryExpression(outer) ||
    outer.right !== value ||
    !ts.isExpressionStatement(outer.parent) ||
    ![
      ts.SyntaxKind.EqualsToken,
      ts.SyntaxKind.BarBarEqualsToken,
      ts.SyntaxKind.AmpersandAmpersandEqualsToken,
      ts.SyntaxKind.QuestionQuestionEqualsToken,
    ].includes(outer.operatorToken.kind)
  ) {
    return undefined;
  }
  const enclosing = ts.findAncestor(
    outer.parent,
    (ancestor) => ts.isFunctionLike(ancestor) || ts.isClassStaticBlockDeclaration(ancestor),
  );
  if (
    enclosing !== undefined &&
    (ts.isClassStaticBlockDeclaration(enclosing) || ts.isParenthesizedExpression(enclosing.parent))
  ) {
    return undefined;
  }
  return getTargetNames(outer.left)?.join(".");
};

// The name that a function or class has as its literal's in V8, which its syntax gives it, or none,
// and whether a computed key names it as it runs instead.
interface LiteralName {
  name: string | undefined;
  isComputed: boolean;
}

const getKeyName = (name: ts.PropertyName): LiteralName => ({
  name: ts.isComputedPropertyName(name)
    ? undefined
    : ts.isPrivateIdentifier(name)
      ? name.text
      : getLiteralKey(name),
  isComputed: ts.isComputedPropertyName(name),
});

// The name that the context of a function or class gives it as NamedEvaluation does: a binding's,
// a property's, a field's, or default.
const getContextName = (node: ts.Node): LiteralName => {
  const value =
    ts.findAncestor(node, (ancestor) => !ts.isParenthesizedExpression(ancestor.parent)) ?? node;
  const outer = value.parent;
  const named = (name: string | undefined) => ({ name, isComputed: false });
  if (
    (ts.isVariableDeclaration(outer) || ts.isBindingElement(outer) || ts.isParameter(outer)) &&
    outer.initializer === value &&
    ts.isIdentifier(outer.name)
  ) {
    return named(outer.name.text);
  }
  if (
    ts.isBinaryExpression(outer) &&
    outer.right === value &&
    ts.isIdentifier(outer.left) &&
    [
      ts.SyntaxKind.EqualsToken,
      ts.SyntaxKind.BarBarEqualsToken,
      ts.SyntaxKind.AmpersandAmpersandEqualsToken,
      ts.SyntaxKind.QuestionQuestionEqualsToken,
    ].includes(outer.operatorToken.kind)
  ) {
    return named(outer.left.text);
  }
  if (ts.isShorthandPropertyAssignment(outer) && outer.objectAssignmentInitializer === value) {
    return named(outer.name.text);
  }
  if (ts.isPropertyAssignment(outer) && outer.initializer === value) {
    return !ts.isComputedPropertyName(outer.name) && getLiteralKey(outer.name) === "__proto__"
      ? named(undefined)
      : getKeyName(outer.name);
  }
  if (ts.isPropertyDeclaration(outer) && outer.initializer === value) return getKeyName(outer.name);
  return named(ts.isExportAssignment(outer) ? "default" : undefined);
};

// Whether a function is a generator, async, or both, as JS.tla's function kinds name it.
type Flavor = "normal" | "generator" | "async" | "asyncGenerator";

const getFlavor = (
  node: ts.Node & { asteriskToken?: ts.AsteriskToken; modifiers?: ts.NodeArray<ts.ModifierLike> },
): Flavor => {
  const isGenerator = node.asteriskToken !== undefined;
  const isAsync =
    node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) === true;
  return isGenerator ? (isAsync ? "asyncGenerator" : "generator") : isAsync ? "async" : "normal";
};

// The intrinsic that a function of each flavor has as its prototype (FunctionPrototypeFor).
const FUNCTION_PROTOTYPES = {
  normal: "FunctionPrototype",
  generator: "GeneratorFunctionPrototype",
  async: "AsyncFunctionPrototype",
  asyncGenerator: "AsyncGeneratorFunctionPrototype",
};

// The productions of a function declaration or expression of each flavor, as JS.tla names them.
const FUNCTION_PRODUCTIONS = {
  normal: "Function",
  generator: "Generator",
  async: "AsyncFunction",
  asyncGenerator: "AsyncGenerator",
};

// The productions of a method of each flavor.
const METHOD_PRODUCTIONS = {
  normal: "MethodDefinition",
  generator: "GeneratorMethod",
  async: "AsyncMethod",
  asyncGenerator: "AsyncGeneratorMethod",
};

// Whether the program's process is Node's, whose env a module's code reads as the constant that the
// system's environment gives, where no file declares process and a module runs in Node's context,
// whose global object has it.
export const isHostProcess = (files: readonly ProgramFile[]) =>
  files[0].kind !== "script" && !files.some((file) => isProcessDeclared(file.sourceFile));

// The range of a file's text that a function's or a class's source text spans, which starts at
// async where the code says it, after the modifiers that ECMAScript's syntax leaves out of it, such
// as static and export, and the ones whose text Node strips, such as private.
const getSourceRange = (node: ts.Node) => {
  const modifiers = ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []) : [];
  const async = modifiers.find((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword);
  const last = modifiers.at(-1);
  const start =
    async?.getStart() ??
    (last === undefined
      ? node.getStart()
      : (node
          .getChildren()
          .find((child) => child.pos >= last.end)
          ?.getStart() ?? node.getStart()));
  return { start, end: node.getEnd() };
};

// Specializes JS.tla to a script. A function reached only by a name that the script never writes
// elsewhere, and that JS.tla's own operators don't use as a key, has a body that stops the check,
// as a call to it can only come by reflection.
export const specialize = (
  files: readonly ProgramFile[],
  internalKeys: ReadonlySet<string>,
  // The variables of the environment that the program's process.env holds.
  getEnvironmentVariable: (name: string) => string | undefined,
): SpecializedProgram => {
  // The names of the bindings of the function that Node wraps the entry module in, which the
  // environment holds rather than its frame.
  const keptByWrapper = new Map<ts.Node, ReadonlySet<string>>();
  // How many times the program writes each name, as an identifier or a string.
  const occurrences = new Map<string, number>();
  const countNames = (node: ts.Node): void => {
    if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node) || ts.isStringLiteralLike(node)) {
      occurrences.set(node.text, (occurrences.get(node.text) ?? 0) + 1);
    }
    ts.forEachChild(node, countNames);
  };
  files.forEach((file) => countNames(file.sourceFile));
  const isProcessNode = isHostProcess(files);
  // Each file's number, from 1, and where its text starts in the program's texts, one after
  // another, which makes the sites of the program's nodes distinct.
  const fileNumbers = new Map(files.map((file, index) => [file.sourceFile, index + 1]));
  const fileStarts = new Map(
    files.map((file, index) => [
      file.sourceFile,
      files.slice(0, index).reduce((start, other) => start + other.sourceFile.text.length, 0),
    ]),
  );
  // The segments of each file's text that hold the source text of its functions and classes, each
  // where its text starts in the file's SourceText, which holds them one after another and leaves
  // out the text between them, such as the comments between a module's declarations, which no
  // function's source text holds. A function's or class's text spans one segment.
  const sourceSegments = new Map(
    files.map((file) => {
      const ranges: { start: number; end: number }[] = [];
      const collect = (node: ts.Node): void => {
        if (ts.isFunctionLike(node) || ts.isClassLike(node)) ranges.push(getSourceRange(node));
        ts.forEachChild(node, collect);
      };
      collect(file.sourceFile);
      const segments: { start: number; end: number; at: number }[] = [];
      for (const range of ranges.sort((left, right) => left.start - right.start)) {
        const last = segments.at(-1);
        if (last !== undefined && range.start <= last.end) last.end = Math.max(last.end, range.end);
        else
          segments.push({ ...range, at: last === undefined ? 0 : last.at + last.end - last.start });
      }
      return [file.sourceFile, segments] as const;
    }),
  );
  // Each throw statement's number in its file, from 1, in the order of the file's text, which
  // stays the order of the throws in the file the program was transpiled from.
  const throwIndexes = new Map(
    files.flatMap((file) => {
      const throws: ts.Node[] = [];
      const collect = (node: ts.Node): void => {
        if (ts.isThrowStatement(node)) throws.push(node);
        ts.forEachChild(node, collect);
      };
      collect(file.sourceFile);
      return throws.map((node, index) => [node, index + 1] as const);
    }),
  );
  const definitions: CodeDefinition[] = [];
  const words = new Set<string>();
  const identifiers = new Set<string>();
  const codes: { id: number; definition?: OperatorDefinition }[] = [];
  // The bodies of the generators, which RunBody runs by their number.
  const bodies: Code[] = [];
  let isAsync = false;
  const loops: { id: number; body?: Expression }[] = [];
  let count = 0;
  let templateSites = 0;
  const regions: ProgramRegion[] = [];
  let isInRegion = false;
  // Records the definitions that compiling a declaration at the top of the first file adds.
  const inRegion = <Compiled>(node: ts.Node, compile: () => Compiled): Compiled => {
    const names = ts.isVariableStatement(node)
      ? getDeclaredNames(node.declarationList)
      : (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name !== undefined
        ? [node.name.text]
        : [];
    if (isInRegion || node.parent !== files[0].sourceFile || names.length === 0) return compile();
    isInRegion = true;
    const first = { definition: definitions.length, code: codes.length, loop: loops.length };
    const compiled = compile();
    isInRegion = false;
    const added = [
      ...definitions.slice(first.definition).map((definition) => definition.name),
      ...codes.slice(first.code).map((code) => `Code${code.id}`),
      ...loops.slice(first.loop).map((loop) => `Loop${loop.id}`),
    ];
    // A function declaration compiles where its scope instantiates it, and adds nothing where
    // its statement runs.
    if (added.length > 0) regions.push({ names, definitions: added });
    return compiled;
  };
  // The names that the top level of the module being compiled declares, which its code never
  // resolves to the global object's.
  let moduleNames: ReadonlySet<string> = new Set();

  // A function declaration's site, which the state's hoisted pairs with a var environment: where
  // the declaration starts in the program.
  const getSite = (node: ts.Node) => (fileStarts.get(node.getSourceFile()) ?? 0) + node.getStart();

  // The position V8 gives a call, new, or tagged template in a stack trace, as <<file, line, column>>
  // of its file as Node runs it, or <<>> where tla-ts can't tell it.
  const getCallSite = (
    node: ts.CallExpression | ts.NewExpression | ts.TaggedTemplateExpression,
  ) => {
    const offset = getCallOffset(node);
    return offset === undefined ? tuple([]) : getPosition(node, offset);
  };

  // The position of an offset of a node's file as V8 gives it, whose CommonJS code starts after the
  // function that wraps it here, and which a class's default constructor has as its frame's.
  const getPosition = (node: ts.Node, offset: number) => {
    const sourceFile = node.getSourceFile();
    const file = fileNumbers.get(sourceFile) ?? 1;
    const position = sourceFile.getLineAndCharacterOfPosition(offset);
    const wrapper =
      position.line === 0 && files[file - 1].kind === "commonjs"
        ? sourceFile.text.indexOf("{ ") + 2
        : 0;
    return tuple([num(file), num(position.line + 1), num(position.character + 1 - wrapper)]);
  };

  // A node's source text, as its file's number and the range of the file's text it spans, which
  // SourceUnits makes code units of when a program reads it.
  // The call or new of a callee that V8 names by its source text where the callee isn't callable,
  // as a name or a chain of property names, and otherwise the call that JS.tla's message leaves
  // to the host.
  // The text that V8 prints of an expression in a message, a name or a chain of property names,
  // or undefined for another.
  const getPrintedText = (node: ts.Expression) =>
    /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(node.getText()) &&
    !/^super\b/.test(node.getText())
      ? node.getText()
      : undefined;
  const getNamedCall = (callee: ts.Expression, call: string, args: readonly Operand[]) =>
    getPrintedText(callee) !== undefined
      ? apply(call === "CallArgumentsAt" ? "CallNamedAt" : "NewNamedAt", [
          ...args,
          getUnits(callee.getText()),
        ])
      : apply(call, args);

  // A function's or a class's source text, as its file's number and the range of the file's
  // SourceText it spans, which SourceUnits makes code units of when a program reads it.
  const getSourceText = (node: ts.Node) => {
    const range = getSourceRange(node);
    const segment = sourceSegments
      .get(node.getSourceFile())
      ?.find((candidate) => candidate.start <= range.start && range.end <= candidate.end);
    if (segment === undefined) {
      throw new TlaTypeScriptError("tla-ts can't find the source text of this code", node);
    }
    return tuple([
      num(fileNumbers.get(node.getSourceFile()) ?? 0),
      num(segment.at + range.start - segment.start + 1),
      num(segment.at + range.end - segment.start),
    ]);
  };

  // A function's code record, which the module evaluates once, as it has no parameters.
  // A bare code runs without the environment that a call makes for it (OrdinaryCallRun).
  const defineRecord = (
    id: number,
    isStrict: boolean,
    length: number,
    sourceText: Expression,
    naming: Expression,
    flavor: Flavor = "normal",
    isBare = false,
  ) => {
    addDefinition(
      defineOperator(
        `CodeRecord${id}`,
        [],
        recordOf([
          ["id", num(id)],
          ["strict", getBool(isStrict)],
          ["kind", string(flavor)],
          ["length", num(length)],
          ["sourceText", sourceText],
          ["naming", naming],
          ["bare", getBool(isBare)],
        ]),
      ),
    );
    return `CodeRecord${id}`;
  };

  // How V8 names a function in a stack trace: by the name its literal has (sfi), or, without one,
  // the name its parser infers, Empty where tla-ts can't tell; by the name a computed key gave it
  // as it ran, which its name property holds; and a class's initializers by names of their own.
  const getNaming = (node: ts.Node, kind: string, literal: LiteralName) => {
    if (literal.isComputed) {
      return recordOf([
        ["naming", string("runtime")],
        ["sfi", tuple([])],
        ["inferred", "Empty"],
      ]);
    }
    if (literal.name !== undefined && literal.name !== "") {
      return recordOf([
        ["naming", string(kind)],
        ["sfi", getUnits(literal.name)],
        ["inferred", "Empty"],
      ]);
    }
    const inferred = getInferredName(node);
    return recordOf([
      ["naming", string("anonymous")],
      ["sfi", tuple([])],
      ["inferred", inferred === undefined ? "Empty" : getUnits(inferred)],
    ]);
  };

  const getFunctionNaming = (fn: FunctionLike) => {
    const node = fn.node;
    if (fn.kind === "staticBlock") {
      return getNaming(node, "staticInit", { name: "<static_initializer>", isComputed: false });
    }
    if (
      (fn.kind === "method" || fn.kind === "get" || fn.kind === "set") &&
      (ts.isMethodDeclaration(node) || ts.isAccessor(node) || ts.isConstructorDeclaration(node))
    ) {
      const key = ts.isConstructorDeclaration(node)
        ? { name: "constructor", isComputed: false }
        : getKeyName(node.name);
      return getNaming(node, "static", {
        name: fn.kind === "method" ? key.name : `${fn.kind} ${key.name ?? ""}`,
        isComputed: key.isComputed,
      });
    }
    if (fn.kind === "constructor" && ts.isClassLike(node.parent)) {
      const name = node.parent.name?.text;
      return getNaming(
        node.parent,
        "static",
        name !== undefined || ts.isClassDeclaration(node.parent)
          ? { name: name ?? "default", isComputed: false }
          : getContextName(node.parent),
      );
    }
    return getNaming(
      node,
      "static",
      ts.isFunctionDeclaration(node) || (ts.isFunctionExpression(node) && node.name !== undefined)
        ? { name: node.name?.text ?? "default", isComputed: false }
        : getContextName(node),
    );
  };

  const addDefinition = (definition: OperatorDefinition) => {
    definitions.push({ name: definition.name, arity: definition.params.length, tree: definition });
  };
  // An operator of the next number with the prefix, whose body starts a line of its own.
  const define = (prefix: string, parameters: string[], body: Operand) => {
    count += 1;
    const name = `${prefix}${count}`;
    addDefinition(defineOperator(name, parameters, onLine(toExpression(body), 2)));
    return name;
  };
  const defineCode = (prefix: string, body: Operand): Code => {
    const name = define(prefix, ["s", "ctx"], body);
    return (state, context) => apply(name, [state, context]);
  };

  // The lexical bindings of a scope's declarations, which CreateLexicalDeclarations of the runtime
  // makes in their order, in a loop rather than in calls nested as deep as they are many.
  const createLexicalDeclarations = (
    declarations: readonly { names: readonly string[]; isConst: boolean }[],
    state: Operand,
    environment: Operand,
  ) =>
    declarations.length === 0
      ? state
      : apply("CreateLexicalDeclarations", [
          state,
          environment,
          tuple(
            declarations.map((declaration) =>
              recordOf([
                ["names", tuple(declaration.names.map(getUnits))],
                ["isConst", getBool(declaration.isConst)],
              ]),
            ),
          ),
          num(1),
        ]);

  // The functions that the declarations of a scope instantiate, by the number that
  // InstantiateCode dispatches on, which InstantiateDeclarations of the runtime runs in turn, in a
  // loop rather than a chain of states as deep as the scope's declarations are many.
  const instantiations: Code[] = [];
  const instantiateDeclarations = (
    entries: readonly {
      instantiate: Code;
      mode: "local" | "mutable" | "initialize";
      name: string;
      slot: number;
    }[],
    state: Operand,
    context: Operand,
    environment: Operand,
  ) => {
    if (entries.length === 0) return state;
    const records = entries.map((entry) => {
      instantiations.push(entry.instantiate);
      return recordOf([
        ["code", num(instantiations.length)],
        ["mode", string(entry.mode)],
        ["name", getUnits(entry.name)],
        ["slot", num(entry.slot)],
      ]);
    });
    return apply("InstantiateDeclarations", [state, context, environment, tuple(records), num(1)]);
  };

  // Evaluate (§13): a result whose value may be a Reference Record.
  const reference = (node: ts.Expression, scope: Scope): Code => {
    if (ts.isIdentifier(node)) {
      words.add(node.text);
      if (!moduleNames.has(node.text)) identifiers.add(node.text);
      return nameReference(node, scope);
    }
    if (ts.isParenthesizedExpression(node)) return reference(node.expression, scope);
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      return chainRoot(node, member(node, scope));
    }
    if (ts.isCallExpression(node)) return chainRoot(node, call(node, scope));
    return value(node, scope);
  };

  // The reference of a name, which a local's frame slot holds.
  const nameReference = (node: ts.Identifier, scope: Scope): Code => {
    const slot = scope.locals?.slots.get(node);
    return slot === undefined
      ? (state, context) =>
          apply("ResolveBinding", [state, context, getUnits(node.text), getBool(scope.isStrict)])
      : (state) =>
          apply("Ok", [
            state,
            apply("LocalReference", [
              num(slot),
              getBool(scope.locals?.constant[slot - 1] ?? false),
              getUnits(node.text),
              getBool(scope.isStrict),
            ]),
          ]);
  };

  // The names of those that nodes declare that an environment holds rather than a frame.
  const getBound = (names: readonly string[], nodes: readonly ts.Node[], scope: Scope) =>
    names.filter((_, index) => scope.locals?.slots.get(nodes[index]) === undefined);

  // A state whose frame holds no value yet at slots, as a binding is before its declaration runs.
  const resetSlots = (state: Operand, slots: readonly number[]) =>
    slots.length === 0
      ? state
      : except(
          state,
          slots.map((slot) => [[pathTo("frame"), pathTo([num(slot)])], "Empty"] as const),
        );

  // The frame slots of those that nodes declare.
  const getSlots = (nodes: readonly ts.Node[], scope: Scope) =>
    nodes.flatMap((node) => {
      const slot = scope.locals?.slots.get(node);
      return slot === undefined ? [] : [slot];
    });

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
      letIn(
        [defineOperator("r", [], code("s", "ctx"))],
        ifThen(apply("=", ["r.c.type", string("nullish")]), apply("Ok", ["r.s", "Undefined"]), "r"),
      ),
    );
  };

  // The base of a member access: its value, short-circuiting where the link is ?. and the value
  // is nullish.
  const chainBase = (node: ts.Expression, isOptional: boolean, scope: Scope): Code => {
    const base = value(node, scope);
    if (!isOptional) return base;
    return defineCode(
      "Optional",
      checked(
        "r",
        base("s", "ctx"),
        ifThen(
          apply("IsNullish", [apply("Val", ["r"])]),
          apply("Abrupt", ["r.s", getCompletion("nullish", "Undefined", "Empty")]),
          "r",
        ),
      ),
    );
  };

  // Property accessors (§13.3.2) and super properties (§13.3.7).
  const member = (
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    scope: Scope,
  ): Code => {
    const strict = scope.isStrict;
    if (ts.isPropertyAccessExpression(node) && ts.isPrivateIdentifier(node.name)) {
      const base = chainBase(node.expression, node.questionDotToken !== undefined, scope);
      const name = node.name;
      return defineCode(
        "Member",
        checked(
          "r",
          base("s", "ctx"),
          apply("Ok", [
            "r.s",
            apply("Reference", [
              apply("Val", ["r"]),
              getPrivateName(name, "r.s", "ctx"),
              "TRUE",
              "Empty",
            ]),
          ]),
        ),
      );
    }
    const key = ts.isPropertyAccessExpression(node)
      ? (() => {
          words.add(node.name.text);
          return undefined;
        })()
      : value(node.argumentExpression, scope);
    if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
      const keyCode: Code =
        key === undefined
          ? (state) => apply("Ok", [state, getStr((node as ts.PropertyAccessExpression).name.text)])
          : key;
      return defineCode(
        "Super",
        letIn(
          [
            defineOperator("env", [], apply("GetThisEnvironment", ["s", "ctx.lex"])),
            defineOperator("actualThis", [], apply("GetThisBinding", ["s", "env"])),
          ],
          ifThen(
            apply("IsAbrupt", ["actualThis"]),
            "actualThis",
            apply("SuperKeyThen", [
              "env",
              apply("Val", ["actualThis"]),
              getBool(strict),
              keyCode("actualThis.s", "ctx"),
            ]),
          ),
        ),
      );
    }
    const base = chainBase(node.expression, node.questionDotToken !== undefined, scope);
    if (ts.isPropertyAccessExpression(node)) {
      return defineCode(
        "Member",
        checked(
          "r",
          base("s", "ctx"),
          apply("Ok", [
            "r.s",
            apply("Reference", [
              apply("Val", ["r"]),
              getStr(node.name.text),
              getBool(strict),
              "Empty",
            ]),
          ]),
        ),
      );
    }
    if (key === undefined)
      throw new TlaTypeScriptError("tla-ts can't compile this member access", node);
    return defineCode(
      "Member",
      checked(
        "r",
        base("s", "ctx"),
        apply("MemberKeyThen", [apply("Val", ["r"]), getBool(strict), key("r.s", "ctx")]),
      ),
    );
  };

  // ArgumentListEvaluation (§13.3.8.1): a result whose value is the list of arguments. An
  // argument whose evaluation is a value whatever the state, such as a literal's, is that value in
  // the list, and a list of such arguments needs no definition of its own.
  const argumentList = (args: readonly ts.Expression[], scope: Scope): Code => {
    if (args.length === 0) return (state) => apply("Ok", [state, tuple([])]);
    const steps: Step[] = [];
    let state = "s";
    // The list's parts, each a run of single values or a spread's list.
    const parts: (Expression[] | string)[] = [];
    const addValue = (item: Expression) => {
      const last = parts.at(-1);
      if (last === undefined || typeof last === "string") parts.push([item]);
      else last.push(item);
    };
    args.forEach((argument, index) => {
      const name = `a${index + 1}`;
      if (ts.isSpreadElement(argument)) {
        const spread = value(argument.expression, scope)(state, "ctx");
        steps.push(
          (rest) => checked(name, spread, rest),
          (rest) =>
            checked(
              `${name}i`,
              apply("GetIteratorSpread", [`${name}.s`, apply("Val", [name])]),
              rest,
            ),
          (rest) =>
            checked(
              `${name}l`,
              apply("IteratorToList", [`${name}i.s`, apply("Val", [`${name}i`]), tuple([])]),
              rest,
            ),
        );
        parts.push(`${name}l`);
        state = `${name}l.s`;
        return;
      }
      const code = value(argument, scope);
      const constant = getConstant(code);
      if (constant !== undefined) {
        addValue(constant);
        return;
      }
      const evaluated = code(state, "ctx");
      steps.push((rest) => checked(name, evaluated, rest));
      addValue(apply("Val", [name]));
      state = `${name}.s`;
    });
    // The list, with runs of single values as one sequence.
    const getList = () =>
      parts
        .map((part) => (typeof part === "string" ? apply("Val", [part]) : tuple(part)))
        .reduce((left, right) => apply("\\o", [left, right]));
    if (steps.length === 0) return (current) => apply("Ok", [current, getList()]);
    return defineCode("Arguments", chain(steps, apply("Ok", [state, getList()])));
  };

  // Function calls (§13.3.6) and super calls (§13.3.7.1).
  const call = (node: ts.CallExpression, scope: Scope): Code => {
    const args = argumentList(node.arguments, scope);
    if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
      return defineCode(
        "SuperCall",
        letIn(
          [defineOperator("thisEnv", [], apply("GetThisEnvironment", ["s", "ctx.lex"]))],
          apply("SuperCallAt", [
            getCallSite(node),
            "thisEnv",
            dot(apply("O", ["s", dot(apply("E", ["s", "thisEnv"]), "fn")]), "proto"),
            dot(apply("E", ["s", "thisEnv"]), "newTarget"),
            args("s", "ctx"),
          ]),
        ),
      );
    }
    // EvaluateImportCall (§13.3.10.2), whose specifier and options the host takes, as V8 gives
    // them to Node's import, with the file of the code that calls it as the referrer.
    if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      if (!files.some((file) => file.kind === "host")) {
        throw new TlaTypeScriptError("tla-ts can't compile import() outside a module", node);
      }
      const specifier = value(node.arguments[0], scope);
      const options: Code =
        node.arguments.length > 1
          ? value(node.arguments[1], scope)
          : (state) => apply("Ok", [state, "Undefined"]);
      return defineCode(
        "ImportCall",
        checked(
          "r",
          specifier("s", "ctx"),
          checked(
            "o",
            options("r.s", "ctx"),
            apply("HostImportCall", [
              "o.s",
              num(fileNumbers.get(node.getSourceFile()) ?? 0),
              apply("Val", ["r"]),
              apply("Val", ["o"]),
            ]),
          ),
        ),
      );
    }
    // EvaluateImportCall of an import.source() call, of the source phase imports proposal, whose
    // one argument is the specifier.
    if (
      ts.isMetaProperty(node.expression) &&
      node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
      node.expression.name.text === "source"
    ) {
      const specifier = value(node.arguments[0], scope);
      return defineCode(
        "ImportSourceCall",
        checked(
          "r",
          specifier("s", "ctx"),
          apply("HostImportSourceCall", ["r.s", apply("Val", ["r"])]),
        ),
      );
    }
    const callee = ts.isParenthesizedExpression(node.expression)
      ? node.expression.expression
      : node.expression;
    if (ts.isIdentifier(callee) && callee.text === "eval") {
      throw new TlaTypeScriptError("tla-ts can't run eval", node);
    }
    // A short circuit of an optional call where the callee is nullish.
    const getShortCircuit = (calleeValue: Expression, rest: Expression) =>
      node.questionDotToken === undefined
        ? rest
        : ifThen(
            apply("IsNullish", [calleeValue]),
            apply("Abrupt", ["c.s", getCompletion("nullish", "Undefined", "Empty")]),
            rest,
          );
    // A name's this value is undefined (EvaluateCall, §13.3.6.2) but where a with statement's object
    // environment holds it.
    if (ts.isIdentifier(callee) && !hasWithAround(node)) {
      const fn = value(callee, scope);
      const evaluated = fn("s", "ctx");
      const site = getCallSite(node);
      const list = args("c.s", "ctx");
      return defineCode(
        "Call",
        checked(
          "c",
          evaluated,
          getShortCircuit(
            apply("Val", ["c"]),
            getNamedCall(node.expression, "CallArgumentsAt", [
              site,
              apply("Val", ["c"]),
              "Undefined",
              list,
            ]),
          ),
        ),
      );
    }
    const base = reference(node.expression, scope);
    const evaluated = apply("CalleeThen", [base("s", "ctx")]);
    const site = getCallSite(node);
    const list = args("c.s", "ctx");
    return defineCode(
      "Call",
      checked(
        "c",
        evaluated,
        getShortCircuit(
          dot(apply("Val", ["c"]), "f"),
          getNamedCall(node.expression, "CallArgumentsAt", [
            site,
            dot(apply("Val", ["c"]), "f"),
            dot(apply("Val", ["c"]), "this"),
            list,
          ]),
        ),
      ),
    );
  };

  // NamedEvaluation (§8.4.5) where the node is an anonymous function definition, with the name
  // that the TLA+ expression gives, and otherwise the node's value.
  const named = (node: ts.Expression, scope: Scope, name: Operand): Code => {
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
  ): Operand => {
    if (initializer === undefined) return result;
    const code = ts.isIdentifier(target)
      ? named(initializer, scope, getStr(target.text))
      : value(initializer, scope);
    return ifThen(
      apply("=", [apply("Val", [result]), "Undefined"]),
      code(`${result}.s`, "ctx"),
      result,
    );
  };

  // BindingInitialization (§8.6.2): a result once a binding's names hold the value.
  const binding = (name: ts.BindingName, scope: Scope): BindingCode => {
    const strict = scope.isStrict;
    if (ts.isIdentifier(name)) {
      words.add(name.text);
      const slot = scope.locals?.slots.get(name);
      return slot === undefined
        ? (state, context, bound, env) =>
            apply("InitializeBoundName", [
              state,
              context,
              getUnits(name.text),
              bound,
              env,
              getBool(strict),
            ])
        : (state, _context, bound) => apply("LocalInitialize", [state, num(slot), bound]);
    }
    const steps: Step[] = [];
    let last: Operand;
    if (ts.isObjectBindingPattern(name)) {
      steps.push((rest) => checked("c", apply("RequireObjectCoercible", ["s", "value"]), rest));
      let state = "c.s";
      const keys: Expression[] = [];
      name.elements.forEach((element, index) => {
        const id = index + 1;
        const push = (result: string, step: Operand) => {
          steps.push((rest) => checked(result, step, rest));
          state = `${result}.s`;
        };
        if (element.dotDotDotToken !== undefined) {
          // RestBindingInitialization (§14.3.3.2).
          const units = getBoundNames(element.name)[0];
          push(
            `l${id}`,
            apply("ResolveBindingIn", [state, "ctx", getUnits(units), "env", getBool(strict)]),
          );
          const objectState = state;
          steps.push(
            letStep([
              `o${id}`,
              apply("OrdinaryObjectCreate", [
                objectState,
                apply("Intrinsic", [objectState, string("ObjectPrototype")]),
              ]),
            ]),
          );
          push(
            `r${id}`,
            apply("CopyDataProperties", [
              `o${id}.s`,
              apply("Val", [`o${id}`]),
              "value",
              tuple([...keys]),
            ]),
          );
          push(
            `b${id}`,
            apply("BindReference", [
              state,
              apply("Val", [`l${id}`]),
              apply("Val", [`o${id}`]),
              "env",
            ]),
          );
          return;
        }
        const key: Code =
          element.propertyName === undefined
            ? (current) => apply("Ok", [current, getStr(getBoundNames(element.name)[0])])
            : propertyKey(element.propertyName, scope);
        push(`k${id}`, key(state, "ctx"));
        keys.push(apply("Val", [`k${id}`]));
        // KeyedBindingInitialization (§14.3.3.3).
        if (ts.isIdentifier(element.name)) {
          words.add(element.name.text);
          push(
            `l${id}`,
            apply("ResolveBindingIn", [
              state,
              "ctx",
              getUnits(element.name.text),
              "env",
              getBool(strict),
            ]),
          );
          push(`v${id}`, apply("GetValueProperty", [state, "value", apply("Val", [`k${id}`])]));
          push(`w${id}`, initialized(element.initializer, element.name, scope, `v${id}`));
          push(
            `b${id}`,
            apply("BindReference", [
              state,
              apply("Val", [`l${id}`]),
              apply("Val", [`w${id}`]),
              "env",
            ]),
          );
          return;
        }
        const nested = binding(element.name, scope);
        push(`v${id}`, apply("GetValueProperty", [state, "value", apply("Val", [`k${id}`])]));
        push(`w${id}`, initialized(element.initializer, element.name, scope, `v${id}`));
        push(`b${id}`, nested(state, "ctx", apply("Val", [`w${id}`]), "env"));
      });
      last = apply("Ok", [state, "Empty"]);
    } else {
      // IteratorBindingInitialization (§8.6.4) over the pattern's elements, which closes the
      // iterator that the elements leave undone.
      steps.push(
        (rest) => checked("it", apply("GetIterator", ["s", "value", string("sync")]), rest),
        letStep([
          "e0",
          recordOf([
            ["s", "it.s"],
            ["c", apply("NormalCompletion", ["Empty"])],
            ["it", apply("Val", ["it"])],
          ]),
        ]),
      );
      let previous = "e0";
      name.elements.forEach((element, index) => {
        const id = index + 1;
        const withIt = (result: Operand, it: Operand) => apply("WithIt", [result, it]);
        const step = ((): Expression => {
          if (ts.isOmittedExpression(element)) {
            return checked(
              `n${id}`,
              apply("IteratorNextForBinding", [`${previous}.s`, `${previous}.it`]),
              withIt(apply("Ok", [`n${id}.s`, "Empty"]), `n${id}.it`),
            );
          }
          if (element.dotDotDotToken !== undefined) {
            const collect = (current: string, rest: Expression) =>
              letIn(
                [
                  defineOperator(
                    `a${id}`,
                    [],
                    apply("ArrayCreate", [
                      current,
                      num(0),
                      apply("Intrinsic", [current, string("ArrayPrototype")]),
                    ]),
                  ),
                  defineOperator(
                    `rest${id}`,
                    [],
                    apply("CollectRest", [
                      `a${id}.s`,
                      apply("Val", [`a${id}`]),
                      `${previous}.it`,
                      num(0),
                    ]),
                  ),
                ],
                ifThen(apply("IsAbrupt", [`rest${id}`]), `rest${id}`, rest),
              );
            if (ts.isIdentifier(element.name)) {
              return checked(
                `l${id}`,
                apply("ResolveBindingIn", [
                  `${previous}.s`,
                  "ctx",
                  getUnits(element.name.text),
                  "env",
                  getBool(strict),
                ]),
                collect(
                  `l${id}.s`,
                  withIt(
                    apply("BindReference", [
                      `rest${id}.s`,
                      apply("Val", [`l${id}`]),
                      apply("Val", [`a${id}`]),
                      "env",
                    ]),
                    `rest${id}.it`,
                  ),
                ),
                withIt(`l${id}`, `${previous}.it`),
              );
            }
            return collect(
              `${previous}.s`,
              withIt(
                binding(element.name, scope)(`rest${id}.s`, "ctx", apply("Val", [`a${id}`]), "env"),
                `rest${id}.it`,
              ),
            );
          }
          if (ts.isIdentifier(element.name)) {
            words.add(element.name.text);
            const resolved = apply("ResolveBindingIn", [
              `${previous}.s`,
              "ctx",
              getUnits(element.name.text),
              "env",
              getBool(strict),
            ]);
            const next = apply("IteratorNextForBinding", [`l${id}.s`, `${previous}.it`]);
            const bound = initialized(element.initializer, element.name, scope, `n${id}`);
            return checked(
              `l${id}`,
              resolved,
              checked(
                `n${id}`,
                next,
                apply("IteratorBindThen", [apply("Val", [`l${id}`]), "env", `n${id}.it`, bound]),
              ),
              withIt(`l${id}`, `${previous}.it`),
            );
          }
          const next = apply("IteratorNextForBinding", [`${previous}.s`, `${previous}.it`]);
          const bound = initialized(element.initializer, element.name, scope, `n${id}`);
          const nested = binding(element.name, scope)(
            `w${id}.s`,
            "ctx",
            apply("Val", [`w${id}`]),
            "env",
          );
          return checked(
            `n${id}`,
            next,
            checked(`w${id}`, bound, withIt(nested, `n${id}.it`), withIt(`w${id}`, `n${id}.it`)),
          );
        })();
        steps.push((rest) => checked(`e${id}`, step, rest, apply("IteratorEndThen", [`e${id}`])));
        previous = `e${id}`;
      });
      last = apply("IteratorEndThen", [previous]);
    }
    const operator = define("Pattern", ["s", "ctx", "value", "env"], chain(steps, last));
    return (state, context, bound, env) => apply(operator, [state, context, bound, env]);
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
    const strict = scope.isStrict;
    const evaluateTarget = (target: ReturnType<typeof getTarget>): Code =>
      target.isPattern
        ? (current) => apply("Ok", [current, "Empty"])
        : reference(target.target, scope);
    // AssignTargetThen: a pattern destructures the value, and a reference gets it.
    const assign = (
      target: ReturnType<typeof getTarget>,
      state: string,
      ref: Operand,
      assigned: Operand,
    ) =>
      target.isPattern
        ? destructuring(
            target.inner as ts.ObjectLiteralExpression | ts.ArrayLiteralExpression,
            scope,
          )(state, "ctx", assigned)
        : apply("PutValue", [state, ref, assigned]);
    const steps: Step[] = [];
    let last: Operand;
    if (ts.isObjectLiteralExpression(node)) {
      steps.push((rest) => checked("c", apply("RequireObjectCoercible", ["s", "value"]), rest));
      let state = "c.s";
      const keys: Expression[] = [];
      node.properties.forEach((property, index) => {
        const id = index + 1;
        const push = (result: string, step: Operand) => {
          steps.push((rest) => checked(result, step, rest));
          state = `${result}.s`;
        };
        if (ts.isShorthandPropertyAssignment(property)) {
          const name = property.name.text;
          words.add(name);
          push(`l${id}`, apply("ResolveBinding", [state, "ctx", getUnits(name), getBool(strict)]));
          push(`v${id}`, apply("GetValueProperty", [state, "value", getStr(name)]));
          push(
            `p${id}`,
            apply("PutValueThen", [
              apply("Val", [`l${id}`]),
              initialized(property.objectAssignmentInitializer, property.name, scope, `v${id}`),
            ]),
          );
          keys.push(getStr(name));
          return;
        }
        if (ts.isSpreadAssignment(property)) {
          const target = getTarget(property.expression);
          push(`r${id}`, evaluateTarget(target)(state, "ctx"));
          const objectState = state;
          steps.push(
            letStep([
              `o${id}`,
              apply("OrdinaryObjectCreate", [
                objectState,
                apply("Intrinsic", [objectState, string("ObjectPrototype")]),
              ]),
            ]),
          );
          push(
            `y${id}`,
            apply("CopyDataProperties", [
              `o${id}.s`,
              apply("Val", [`o${id}`]),
              "value",
              tuple([...keys]),
            ]),
          );
          push(
            `p${id}`,
            apply("PutValue", [state, apply("Val", [`r${id}`]), apply("Val", [`o${id}`])]),
          );
          return;
        }
        if (!ts.isPropertyAssignment(property)) {
          throw new TlaTypeScriptError(
            "tla-ts can't compile this destructuring target to JS.tla yet",
            property,
          );
        }
        push(`k${id}`, propertyKey(property.name, scope)(state, "ctx"));
        keys.push(apply("Val", [`k${id}`]));
        // KeyedDestructuringAssignmentEvaluation (§13.15.5.6).
        const target = getTarget(property.initializer);
        push(`r${id}`, evaluateTarget(target)(state, "ctx"));
        push(`v${id}`, apply("GetValueProperty", [state, "value", apply("Val", [`k${id}`])]));
        push(`w${id}`, initialized(target.initializer, target.inner, scope, `v${id}`));
        push(`p${id}`, assign(target, state, apply("Val", [`r${id}`]), apply("Val", [`w${id}`])));
      });
      last = apply("Ok", [state, "Empty"]);
    } else {
      // IteratorDestructuringAssignmentEvaluation (§13.15.5.5).
      steps.push(
        (rest) => checked("it", apply("GetIterator", ["s", "value", string("sync")]), rest),
        letStep([
          "e0",
          recordOf([
            ["s", "it.s"],
            ["c", apply("NormalCompletion", ["Empty"])],
            ["it", apply("Val", ["it"])],
          ]),
        ]),
      );
      let previous = "e0";
      node.elements.forEach((element, index) => {
        const id = index + 1;
        const withIt = (result: Operand, it: Operand) => apply("WithIt", [result, it]);
        const step = ((): Expression => {
          if (ts.isOmittedExpression(element)) {
            return checked(
              `n${id}`,
              apply("IteratorNextForBinding", [`${previous}.s`, `${previous}.it`]),
              withIt(apply("Ok", [`n${id}.s`, "Empty"]), `n${id}.it`),
            );
          }
          if (ts.isSpreadElement(element)) {
            const target = getTarget(element.expression);
            const evaluated = evaluateTarget(target)(`${previous}.s`, "ctx");
            const assigned = assign(
              target,
              `rest${id}.s`,
              apply("Val", [`r${id}`]),
              apply("Val", [`a${id}`]),
            );
            return checked(
              `r${id}`,
              evaluated,
              letIn(
                [
                  defineOperator(
                    `a${id}`,
                    [],
                    apply("ArrayCreate", [
                      `r${id}.s`,
                      num(0),
                      apply("Intrinsic", [`r${id}.s`, string("ArrayPrototype")]),
                    ]),
                  ),
                  defineOperator(
                    `rest${id}`,
                    [],
                    apply("CollectRest", [
                      `a${id}.s`,
                      apply("Val", [`a${id}`]),
                      `${previous}.it`,
                      num(0),
                    ]),
                  ),
                ],
                ifThen(
                  apply("IsAbrupt", [`rest${id}`]),
                  `rest${id}`,
                  withIt(assigned, `rest${id}.it`),
                ),
              ),
              withIt(`r${id}`, `${previous}.it`),
            );
          }
          const target = getTarget(element);
          const evaluated = evaluateTarget(target)(`${previous}.s`, "ctx");
          const bound = initialized(target.initializer, target.inner, scope, `n${id}`);
          const assigned = assign(
            target,
            `w${id}.s`,
            apply("Val", [`r${id}`]),
            apply("Val", [`w${id}`]),
          );
          return checked(
            `r${id}`,
            evaluated,
            checked(
              `n${id}`,
              apply("IteratorNextForBinding", [`r${id}.s`, `${previous}.it`]),
              checked(
                `w${id}`,
                bound,
                withIt(assigned, `n${id}.it`),
                withIt(`w${id}`, `n${id}.it`),
              ),
            ),
            withIt(`r${id}`, `${previous}.it`),
          );
        })();
        steps.push((rest) => checked(`e${id}`, step, rest, apply("IteratorEndThen", [`e${id}`])));
        previous = `e${id}`;
      });
      last = apply("IteratorEndThen", [previous]);
    }
    const operator = define("Destructure", ["s", "ctx", "value"], chain(steps, last));
    return (state, context, assigned) => apply(operator, [state, context, assigned]);
  };

  // The value of an expression (Evaluate, then GetValue).
  const value = (node: ts.Expression, scope: Scope): Code => {
    switch (node.kind) {
      case ts.SyntaxKind.NullKeyword:
        return (state) => apply("Ok", [state, "Null"]);
      case ts.SyntaxKind.TrueKeyword:
        return (state) => apply("Ok", [state, "True"]);
      case ts.SyntaxKind.FalseKeyword:
        return (state) => apply("Ok", [state, "False"]);
      case ts.SyntaxKind.ThisKeyword:
        return (state, context) => apply("ResolveThisBinding", [state, context]);
      default:
        break;
    }
    if (ts.isNumericLiteral(node)) {
      return (state) => apply("Ok", [state, apply("Num", [getNumber(Number(node.text))])]);
    }
    if (ts.isBigIntLiteral(node)) {
      const big = BigInt(node.text.slice(0, -1).replaceAll("_", ""));
      return (state) =>
        apply("Ok", [
          state,
          apply("BigInt", [
            recordOf([
              ["neg", "FALSE"],
              ["mag", getLimbs(big)],
            ]),
          ]),
        ]);
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      words.add(node.text);
      return (state) => apply("Ok", [state, getStr(node.text)]);
    }
    // A read of process.env.NAME, of Node's process, is the environment's value as the program's
    // system has it: the process's that compiles, or none of a host's files.
    if (
      isProcessNode &&
      ts.isPropertyAccessExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "env" &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "process"
    ) {
      const variable = getEnvironmentVariable(node.name.text);
      return (state) =>
        apply("Ok", [state, variable === undefined ? "Undefined" : getStr(variable)]);
    }
    if (ts.isIdentifier(node)) {
      reference(node, scope);
      const slot = scope.locals?.slots.get(node);
      return slot === undefined
        ? (state, context) =>
            apply("IdentifierValue", [
              state,
              getLex(context),
              getUnits(node.text),
              getBool(scope.isStrict),
            ])
        : (state) => apply("LocalValue", [state, num(slot), getUnits(node.text)]);
    }
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const referenced = reference(node, scope);
      return (state, context) => apply("GetValueThen", [referenced(state, context)]);
    }
    if (ts.isCallExpression(node)) {
      const referenced = reference(node, scope);
      return (state, context) => apply("GetValueThen", [referenced(state, context)]);
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
      const evaluated = callee("s", "ctx");
      const site = getCallSite(node);
      const list = args("r.s", "ctx");
      return defineCode(
        "New",
        checked(
          "r",
          evaluated,
          getNamedCall(node.expression, "NewArgumentsAt", [site, apply("Val", ["r"]), list]),
        ),
      );
    }
    if (ts.isMetaProperty(node)) {
      if (node.keywordToken === ts.SyntaxKind.NewKeyword)
        return (state, context) => apply("Ok", [state, apply("GetNewTarget", [state, context])]);
      if (files[(fileNumbers.get(node.getSourceFile()) ?? 1) - 1].kind !== "module") {
        throw new TlaTypeScriptError("tla-ts can't compile import.meta outside a module", node);
      }
      return (state, context) => apply("EvaluateImportMeta", [state, context, "Empty"]);
    }
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
      const operator = node.operator;
      if (operator === ts.SyntaxKind.PlusPlusToken || operator === ts.SyntaxKind.MinusMinusToken) {
        const target = reference(node.operand, scope);
        return defineCode(
          "Update",
          apply("UpdateValueThen", [
            getBool(operator === ts.SyntaxKind.PlusPlusToken),
            getBool(ts.isPostfixUnaryExpression(node)),
            target("s", "ctx"),
          ]),
        );
      }
      const name = {
        [ts.SyntaxKind.ExclamationToken]: "!",
        [ts.SyntaxKind.MinusToken]: "-",
        [ts.SyntaxKind.PlusToken]: "+",
        [ts.SyntaxKind.TildeToken]: "~",
      }[operator];
      const operand = value(node.operand, scope);
      return defineCode("Unary", apply("UnaryThen", [string(name), operand("s", "ctx")]));
    }
    if (ts.isTypeOfExpression(node)) {
      const operand = reference(node.expression, scope);
      return defineCode("Typeof", apply("TypeofThen", [operand("s", "ctx")]));
    }
    if (ts.isDeleteExpression(node)) {
      const operand = reference(node.expression, scope);
      return defineCode("Delete", apply("DeleteThen", [operand("s", "ctx")]));
    }
    if (ts.isVoidExpression(node)) {
      const operand = value(node.expression, scope);
      return defineCode("Void", apply("UnaryThen", [string("void"), operand("s", "ctx")]));
    }
    if (ts.isConditionalExpression(node)) {
      const test = value(node.condition, scope);
      const whenTrue = value(node.whenTrue, scope);
      const whenFalse = value(node.whenFalse, scope);
      const tested = test("s", "ctx");
      const trueValue = whenTrue("r.s", "ctx");
      const falseValue = whenFalse("r.s", "ctx");
      return defineCode(
        "Conditional",
        checked(
          "r",
          tested,
          ifThen(apply("ToBooleanValue", [apply("Val", ["r"])]), trueValue, falseValue),
        ),
      );
    }
    if (ts.isBinaryExpression(node)) return binary(node, scope);
    if (ts.isSpreadElement(node))
      throw new TlaTypeScriptError("tla-ts can't compile a spread here", node);
    // Yield (§15.5.5) and Await (§15.8.5), whose results suspend the body.
    if (ts.isYieldExpression(node)) {
      const operand = node.expression === undefined ? undefined : value(node.expression, scope);
      return defineCode(
        "Yield",
        apply(node.asteriskToken === undefined ? "YieldThen" : "YieldStarThen", [
          "ctx",
          operand === undefined ? apply("Ok", ["s", "Undefined"]) : operand("s", "ctx"),
        ]),
      );
    }
    if (ts.isAwaitExpression(node)) {
      return defineCode("Await", apply("AwaitThen", [value(node.expression, scope)("s", "ctx")]));
    }
    if (ts.isTaggedTemplateExpression(node)) return taggedTemplate(node, scope);
    if (ts.isRegularExpressionLiteral(node)) {
      // RegExpCreateLiteral (§13.2.7.3) of the literal's body and flags, as written.
      const text = node.text;
      const end = text.lastIndexOf("/");
      words.add("RegExp");
      return (state) =>
        apply("RegExpCreate", [state, getStr(text.slice(1, end)), getStr(text.slice(end + 1))]);
    }
    throw new TlaTypeScriptError(
      `tla-ts can't compile ${ts.SyntaxKind[node.kind]} to JS.tla yet`,
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
      const name = node.left;
      return defineCode(
        "PrivateIn",
        checked(
          "r",
          right("s", "ctx"),
          ifThen(
            apply("~", [apply("IsObject", [apply("Val", ["r"])])]),
            apply("ThrowTypeError", ["r.s"]),
            apply("Ok", [
              "r.s",
              apply("Bool", [
                apply("#", [
                  apply("PrivateElementFind", [
                    "r.s",
                    apply("Val", ["r"]),
                    getPrivateName(name, "r.s", "ctx"),
                  ]),
                  "Empty",
                ]),
              ]),
            ]),
          ),
        ),
      );
    }
    const left = value(node.left, scope);
    const right = value(node.right, scope);
    const test = LOGICAL_TESTS.get(operator);
    if (test !== undefined) {
      const evaluated = left("s", "ctx");
      return defineCode(
        "Logical",
        checked("r", evaluated, ifThen(test(apply("Val", ["r"])), "r", right("r.s", "ctx"))),
      );
    }
    if (operator === ts.SyntaxKind.CommaToken) {
      const evaluated = left("s", "ctx");
      return defineCode("Comma", checked("r", evaluated, right("r.s", "ctx")));
    }
    const arithmetic = BINARY_OPERATORS.get(operator);
    const relational = RELATIONAL_OPERATORS.get(operator);
    const equality = EQUALITY_OPERATORS.get(operator);
    const then =
      arithmetic !== undefined
        ? ["BinaryRightThen", arithmetic]
        : relational !== undefined
          ? ["RelationalRightThen", relational]
          : equality !== undefined
            ? ["EqualityRightThen", equality]
            : undefined;
    if (then === undefined) {
      throw new TlaTypeScriptError(
        `tla-ts can't compile the operator ${node.operatorToken.getText()} to JS.tla yet`,
        node,
      );
    }
    const evaluated = left("s", "ctx");
    return defineCode(
      "Binary",
      checked(
        "r",
        evaluated,
        apply(then[0], [apply("Val", ["r"]), string(then[1]), right("r.s", "ctx")]),
      ),
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
      const evaluated = value(node.right, scope)("s", "ctx");
      return defineCode(
        "Assign",
        checked(
          "r",
          evaluated,
          apply("ResultThen", [apply("Val", ["r"]), pattern("r.s", "ctx", apply("Val", ["r"]))]),
        ),
      );
    }
    const left = reference(target, scope);
    const assigned =
      ts.isIdentifier(target) && isAnonymousFunctionDefinition(node.right)
        ? named(node.right, scope, getStr(target.text))
        : value(node.right, scope);
    const evaluated = left("s", "ctx");
    const head = (rest: Expression) =>
      checked(
        "t",
        evaluated,
        ifThen(
          apply("#", [dot(apply("Val", ["t"]), "type"), string("reference")]),
          apply("ThrowError", ["t.s", string("ReferenceError")]),
          rest,
        ),
      );
    if (operator === ts.SyntaxKind.EqualsToken) {
      return defineCode(
        "Assign",
        head(apply("PutValueThen", [apply("Val", ["t"]), assigned("t.s", "ctx")])),
      );
    }
    // GetValue and PutValue each convert the key, as V8 does (§13.15.2).
    const old = (rest: Expression) =>
      checked("old", apply("GetValue", ["t.s", apply("Val", ["t"])]), rest);
    const test = LOGICAL_TESTS.get(operator);
    if (test !== undefined) {
      return defineCode(
        "Assign",
        head(
          old(
            ifThen(
              test(apply("Val", ["old"])),
              "old",
              apply("PutValueThen", [apply("Val", ["t"]), assigned("old.s", "ctx")]),
            ),
          ),
        ),
      );
    }
    const right = value(node.right, scope);
    return defineCode(
      "Assign",
      head(
        old(
          apply("CompoundThen", [
            apply("Val", ["t"]),
            apply("Val", ["old"]),
            string(COMPOUND_OPERATORS.get(operator) ?? ""),
            right("old.s", "ctx"),
          ]),
        ),
      ),
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
      return typeof flags === "number" && (flags & 2048) !== 0 ? ref("None") : getUnits(part.text);
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
    const evaluated = tag("s", "ctx");
    const list = args("object.s", "ctx");
    return defineCode(
      "Tagged",
      chain(
        [
          (rest) => checked("r", evaluated, rest),
          (rest) => checked("f", apply("GetValue", ["r.s", apply("Val", ["r"])]), rest),
          letStep([
            "object",
            apply("GetTemplateObject", [
              "f.s",
              tuple([num(0), num(templateSites)]),
              recordOf([
                ["TemplateCookedList", tuple(cooked)],
                ["TemplateRawList", tuple(raw)],
              ]),
            ]),
          ]),
          (rest) => checked("a", list, rest),
        ],
        apply("CallArgumentsAt", [
          getCallSite(node),
          apply("Val", ["f"]),
          apply("CallThisValue", ["object.s", apply("Val", ["r"])]),
          apply("Ok", [
            "a.s",
            apply("\\o", [tuple([apply("Val", ["object"])]), apply("Val", ["a"])]),
          ]),
        ]),
      ),
    );
  };

  // Template literals (§13.2.8.6).
  const template = (node: ts.TemplateExpression, scope: Scope): Code => {
    const steps: Step[] = [];
    let state = "s";
    let text = getUnits(node.head.text);
    node.templateSpans.forEach((span, index) => {
      const name = `t${index + 1}`;
      const evaluated = value(span.expression, scope)(state, "ctx");
      steps.push(
        (rest) => checked(`${name}v`, evaluated, rest),
        (rest) => checked(name, apply("ToStr", [`${name}v.s`, apply("Val", [`${name}v`])]), rest),
      );
      text = apply("\\o", [
        apply("\\o", [text, dot(apply("Val", [name]), "value")]),
        getUnits(span.literal.text),
      ]);
      state = `${name}.s`;
    });
    return defineCode("Template", chain(steps, apply("Ok", [state, apply("Str", [text])])));
  };

  // Array initializers (§13.2.4).
  const arrayLiteral = (node: ts.ArrayLiteralExpression, scope: Scope): Code =>
    defineCode(
      "Array",
      letIn(
        [
          defineOperator(
            "a",
            [],
            apply("ArrayCreate", [
              "s",
              num(0),
              apply("Intrinsic", ["s", string("ArrayPrototype")]),
            ]),
          ),
        ],
        onLine(
          apply("ArrayLiteralThen", [
            apply("Val", ["a"]),
            arrayElements(node.elements, scope, 0)("a.s", apply("Val", ["a"]), num(0)),
          ]),
          2,
        ),
      ),
    );

  // ArrayAccumulation (§13.2.4.1) of the elements into array from index, whose result is the next
  // index. start is the index when it's known before the code runs. A list of more than 64 runs as
  // its halves, each a list, so that thousands of elements nest log n deep rather than n.
  const arrayElements = (
    elements: readonly ts.Expression[],
    scope: Scope,
    start: number | undefined,
  ): ElementsCode => {
    if (elements.length > 64) {
      const middle = Math.ceil(elements.length / 2);
      const first = arrayElements(elements.slice(0, middle), scope, start);
      const rest = arrayElements(
        elements.slice(middle),
        scope,
        start === undefined || elements.slice(0, middle).some(ts.isSpreadElement)
          ? undefined
          : start + middle,
      );
      const name = define(
        "Elements",
        ["s", "ctx", "array", "i"],
        checked("q", first("s", "array", "i"), rest("q.s", "array", apply("Val", ["q"]))),
      );
      return (state, array, index) => apply(name, [state, "ctx", array, index]);
    }
    return (initialState, array, initialIndex) => {
      const steps: Step[] = [];
      let state = initialState;
      let staticIndex = start;
      let index: Operand = start === undefined ? initialIndex : num(start);
      // The index after one at a known position, or one past the index before.
      const getNext = (before: Operand) =>
        staticIndex === undefined ? apply("+", [before, num(1)]) : num(staticIndex + 1);
      elements.forEach((element, position) => {
        const name = `e${position + 1}`;
        if (ts.isOmittedExpression(element)) {
          index = getNext(index);
          staticIndex = staticIndex === undefined ? undefined : staticIndex + 1;
          return;
        }
        if (ts.isSpreadElement(element)) {
          const evaluated = value(element.expression, scope)(state, "ctx");
          const printed = getPrintedText(element.expression);
          const spreadIndex = index;
          steps.push(
            (rest) => checked(name, evaluated, rest),
            (rest) =>
              checked(
                `${name}i`,
                printed === undefined
                  ? apply("GetIterator", [`${name}.s`, apply("Val", [name]), string("sync")])
                  : apply("GetIteratorNamed", [
                      `${name}.s`,
                      apply("Val", [name]),
                      getUnits(printed),
                    ]),
                rest,
              ),
            (rest) =>
              checked(
                `${name}p`,
                apply("SpreadIntoArray", [
                  `${name}i.s`,
                  array,
                  apply("Val", [`${name}i`]),
                  spreadIndex,
                ]),
                rest,
              ),
          );
          state = `${name}p.s`;
          index = apply("Val", [`${name}p`]);
          staticIndex = undefined;
          return;
        }
        const key =
          staticIndex === undefined
            ? apply("Str", [apply("NumToString", [apply("NumFromInt", [index])])])
            : getStr(String(staticIndex));
        const evaluated = value(element, scope)(state, "ctx");
        steps.push((rest) =>
          checked(name, apply("ArrayElementResult", [array, key, evaluated]), rest),
        );
        state = `${name}.s`;
        index = getNext(index);
        staticIndex = staticIndex === undefined ? undefined : staticIndex + 1;
      });
      return chain(steps, apply("Ok", [state, index]));
    };
  };

  // Object initializers (§13.2.5).
  const objectLiteral = (node: ts.ObjectLiteralExpression, scope: Scope): Code => {
    const steps: Step[] = [
      letStep([
        "o",
        apply("OrdinaryObjectCreate", ["s", apply("Intrinsic", ["s", string("ObjectPrototype")])]),
      ]),
    ];
    let state = "o.s";
    node.properties.forEach((property, position) => {
      const name = `p${position + 1}`;
      const push = (result: Expression) => {
        steps.push((rest) => checked(name, result, rest));
        state = `${name}.s`;
      };
      if (ts.isShorthandPropertyAssignment(property)) {
        if (property.objectAssignmentInitializer !== undefined) {
          push(apply("ThrowError", [state, string("SyntaxError")]));
          return;
        }
        push(
          apply("CreateDataThen", [
            apply("Val", ["o"]),
            getStr(property.name.text),
            value(property.name, scope)(state, "ctx"),
          ]),
        );
        return;
      }
      if (ts.isSpreadAssignment(property)) {
        push(
          apply("CopyDataThen", [
            apply("Val", ["o"]),
            value(property.expression, scope)(state, "ctx"),
          ]),
        );
        return;
      }
      if (ts.isPropertyAssignment(property)) {
        const literal = getLiteralKey(property.name);
        if (literal !== undefined) {
          words.add(literal);
          if (literal === "__proto__" && !ts.isNumericLiteral(property.name)) {
            push(
              apply("ProtoSetterThen", [
                apply("Val", ["o"]),
                value(property.initializer, scope)(state, "ctx"),
              ]),
            );
            return;
          }
          push(
            apply("CreateDataThen", [
              apply("Val", ["o"]),
              getStr(literal),
              named(property.initializer, scope, getStr(literal))(state, "ctx"),
            ]),
          );
          return;
        }
        if (!ts.isComputedPropertyName(property.name)) {
          throw new TlaTypeScriptError(
            "tla-ts can't compile a private name to JS.tla yet",
            property,
          );
        }
        const key = apply("ToPropertyKeyThen", [
          value(property.name.expression, scope)(state, "ctx"),
        ]);
        steps.push((rest) => checked(`${name}k`, key, rest));
        state = `${name}k.s`;
        push(
          apply("CreateDataThen", [
            apply("Val", ["o"]),
            apply("Val", [`${name}k`]),
            named(property.initializer, scope, apply("Val", [`${name}k`]))(state, "ctx"),
          ]),
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
          apply("DefineElementOn", [
            apply("Val", ["o"]),
            classElement(property, scope)(state, "ctx", apply("Val", ["o"])),
            "TRUE",
          ]),
        );
        return;
      }
      throw new TlaTypeScriptError("tla-ts can't compile this property", property);
    });
    return defineCode("Object", chain(steps, apply("Ok", [state, apply("Val", ["o"])])));
  };

  // The property key of a class element or an object literal's method (§13.2.5.4).
  const propertyKey = (name: ts.PropertyName, scope: Scope): Code => {
    const literal = getLiteralKey(name);
    if (literal !== undefined) {
      words.add(literal);
      return (state) => apply("Ok", [state, getStr(literal)]);
    }
    if (ts.isComputedPropertyName(name)) {
      const key = value(name.expression, scope);
      return (state, context) => apply("ToPropertyKeyThen", [key(state, context)]);
    }
    if (ts.isPrivateIdentifier(name)) {
      return (state, context) => apply("Ok", [state, getPrivateName(name, state, context)]);
    }
    throw new TlaTypeScriptError("tla-ts can't compile this property name to JS.tla yet", name);
  };

  // The Private Name of a private identifier in the running private environment
  // (ResolvePrivateIdentifier, §9.2.1.1), whose names JS.tla holds without the #.
  const getPrivateName = (name: ts.PrivateIdentifier, state: Operand, context: Operand) =>
    apply("ResolvePrivateIdentifier", [state, context, getUnits(name.text.slice(1))]);

  // ClassElementEvaluation (§15.7.13) of a method, getter, or setter: its element record, with
  // the closure's home object home. TypeScript parses a static method named constructor as a
  // constructor.
  const classElement = (
    node:
      | ts.MethodDeclaration
      | ts.GetAccessorDeclaration
      | ts.SetAccessorDeclaration
      | ts.ConstructorDeclaration,
    scope: Scope,
  ) => {
    const flavor = getFlavor(node);
    const key: Code = ts.isConstructorDeclaration(node)
      ? (state) => apply("Ok", [state, getStr("constructor")])
      : propertyKey(node.name, scope);
    const kind = ts.isGetAccessorDeclaration(node)
      ? "get"
      : ts.isSetAccessorDeclaration(node)
        ? "set"
        : "method";
    const code = functionCode({ node, parameters: node.parameters, body: node.body, kind }, scope);
    const record = except(
      apply("ElementRecord", [
        string(kind === "method" ? "method" : kind === "get" ? "getter" : "setter"),
        apply("Val", ["k"]),
      ]),
      [[[pathTo(kind === "method" ? "value" : kind)], "f.v"]],
    );
    const prefix = kind === "method" ? tuple([]) : apply("N", [string(kind)]);
    const withName = apply("SetFunctionName", [
      apply("MakeMethod", ["f.s", "f.v", "home"]),
      "f.v",
      apply("Val", ["k"]),
      prefix,
    ]);
    const evaluated = key("s", "ctx");
    const name = define(
      "Element",
      ["s", "ctx", "home"],
      checked(
        "k",
        evaluated,
        letIn(
          [
            defineOperator(
              "f",
              [],
              apply("CodeFunctionCreate", [
                "k.s",
                apply("Intrinsic", ["k.s", string(FUNCTION_PROTOTYPES[flavor])]),
                code,
                "FALSE",
                "ctx.lex",
                "ctx.priv",
              ]),
            ),
          ],
          apply("Ok", [
            flavor === "generator" || flavor === "asyncGenerator"
              ? apply("GiveFunctionPrototype", [
                  withName,
                  string(METHOD_PRODUCTIONS[flavor]),
                  "f.v",
                ])
              : withName,
            record,
          ]),
        ),
      ),
    );
    return (state: Operand, context: Operand, home: Operand) => apply(name, [state, context, home]);
  };

  // ClassFieldDefinitionEvaluation (§15.7.10): a field's element record, with its initializer a
  // method of home whose body gives the initializer's value.
  const classField = (node: ts.PropertyDeclaration, scope: Scope) => {
    if (node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AccessorKeyword)) {
      throw new TlaTypeScriptError("tla-ts can't compile an auto-accessor to JS.tla yet", node);
    }
    const key = propertyKey(node.name, scope);
    const initializer = node.initializer;
    const evaluated = key("s", "ctx");
    const name = define(
      "Field",
      ["s", "ctx", "home"],
      checked(
        "k",
        evaluated,
        initializer === undefined
          ? apply("Ok", ["k.s", apply("ElementRecord", [string("field"), apply("Val", ["k"])])])
          : letIn(
              [
                defineOperator(
                  "f",
                  [],
                  apply("CodeFunctionCreate", [
                    "k.s",
                    apply("Intrinsic", ["k.s", string("FunctionPrototype")]),
                    fieldCode(node, initializer),
                    "FALSE",
                    "ctx.lex",
                    "ctx.priv",
                  ]),
                ),
                defineOperator("s1", [], apply("MakeMethod", ["f.s", "f.v", "home"])),
              ],
              apply("Ok", [
                apply("SetO", [
                  "s1",
                  "f.v",
                  except(apply("O", ["s1", "f.v"]), [
                    [[pathTo("slots"), pathTo("initializerName")], apply("Val", ["k"])],
                  ]),
                ]),
                except(apply("ElementRecord", [string("field"), apply("Val", ["k"])]), [
                  [[pathTo("init")], "f.v"],
                ]),
              ]),
            ),
      ),
    );
    return (state: Operand, context: Operand, home: Operand) => apply(name, [state, context, home]);
  };

  // A field initializer's code, whose body gives the initializer's value, named by the field's
  // key (§15.7.10, EvaluateFieldInitializer).
  const fieldCode = (node: ts.PropertyDeclaration, initializer: ts.Expression) => {
    const id = codes.length + 1;
    codes.push({ id });
    const evaluation = named(
      initializer,
      { isStrict: true, isClassBody: false, isAsyncGenerator: false },
      dot(dot(apply("O", ["s", "f"]), "slots"), "initializerName"),
    );
    codes[id - 1] = {
      id,
      definition: defineOperator(
        `Code${id}`,
        ["s", "f", "ctx", "args"],
        onLine(
          checked(
            "v",
            evaluation("s", "ctx"),
            apply("Abrupt", ["v.s", getCompletion("return", apply("Val", ["v"]), "Empty")]),
          ),
          2,
        ),
      ),
    };
    const isStatic =
      ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) ===
      true;
    return defineRecord(
      id,
      true,
      0,
      getSourceText(node),
      isStatic
        ? getNaming(node, "staticInit", { name: "<static_initializer>", isComputed: false })
        : getNaming(node, "instanceInit", {
            name: "<instance_members_initializer>",
            isComputed: false,
          }),
    );
  };

  // InstantiateOrdinaryFunctionExpression (§15.2.5) and InstantiateArrowFunctionExpression
  // (§15.3.4), with the name that NamedEvaluation gives, or EmptyStr.
  const functionExpression = (
    node: ts.FunctionExpression | ts.ArrowFunction,
    scope: Scope,
  ): NamedCode => {
    const flavor = getFlavor(node);
    const prototype = FUNCTION_PROTOTYPES[flavor];
    const production = `${FUNCTION_PRODUCTIONS[flavor]}Expression`;
    const code = functionCode(
      {
        node,
        parameters: node.parameters,
        body: node.body,
        kind: ts.isArrowFunction(node) ? "arrow" : "normal",
      },
      scope,
    );
    // CodeFunctionCreate of the code in state, its environment env.
    const create = (state: string, isArrow: boolean, env: string) =>
      apply("CodeFunctionCreate", [
        state,
        apply("Intrinsic", [state, string(prototype)]),
        code,
        getBool(isArrow),
        env,
        "ctx.priv",
      ]);
    const name = ts.isArrowFunction(node)
      ? define(
          "Arrow",
          ["s", "ctx", "name"],
          letIn(
            [defineOperator("f", [], create("s", true, "ctx.lex"))],
            apply("Ok", [apply("SetFunctionName", ["f.s", "f.v", "name", tuple([])]), "f.v"]),
          ),
        )
      : node.name !== undefined
        ? define(
            "Closure",
            ["s", "ctx", "name"],
            letIn(
              [
                defineOperator("env", [], apply("NewDeclarativeEnvironment", ["s", "ctx.lex"])),
                defineOperator(
                  "s1",
                  [],
                  dot(
                    apply("CreateImmutableBinding", [
                      "env.s",
                      "env.e",
                      getUnits(node.name.text),
                      "FALSE",
                    ]),
                    "s",
                  ),
                ),
                defineOperator("f", [], create("s1", false, "env.e")),
                defineOperator(
                  "s2",
                  [],
                  apply("GiveFunctionPrototype", [
                    apply("SetFunctionName", ["f.s", "f.v", getStr(node.name.text), tuple([])]),
                    string(production),
                    "f.v",
                  ]),
                ),
              ],
              apply("Ok", [
                dot(
                  apply("InitializeBinding", ["s2", "env.e", getUnits(node.name.text), "f.v"]),
                  "s",
                ),
                "f.v",
              ]),
            ),
          )
        : define(
            "Closure",
            ["s", "ctx", "name"],
            letIn(
              [defineOperator("f", [], create("s", false, "ctx.lex"))],
              apply("Ok", [
                apply("GiveFunctionPrototype", [
                  apply("SetFunctionName", ["f.s", "f.v", "name", tuple([])]),
                  string(production),
                  "f.v",
                ]),
                "f.v",
              ]),
            ),
          );
    return (state, context, functionName) => apply(name, [state, context, functionName]);
  };

  // InstantiateFunctionObject (§15.2.4): a result [s, c] with the function object.
  const instantiateFunction = (node: ts.FunctionDeclaration, scope: Scope): Code =>
    inRegion(node, () => {
      const flavor = getFlavor(node);
      const code = functionCode(
        { node, parameters: node.parameters, body: node.body, kind: "normal" },
        scope,
      );
      return defineCode(
        "Instantiate",
        letIn(
          [
            defineOperator(
              "f",
              [],
              apply("CodeFunctionCreate", [
                "s",
                apply("Intrinsic", ["s", string(FUNCTION_PROTOTYPES[flavor])]),
                code,
                "FALSE",
                "ctx.lex",
                "ctx.priv",
              ]),
            ),
          ],
          apply("Ok", [
            apply("GiveFunctionPrototype", [
              apply("SetFunctionName", [
                "f.s",
                "f.v",
                getStr(node.name?.text ?? "default"),
                tuple([]),
              ]),
              string(`${FUNCTION_PRODUCTIONS[flavor]}Declaration`),
              "f.v",
            ]),
            "f.v",
          ]),
        ),
      );
    });

  // A function's code: the record that its function objects hold as their body, whose id
  // CallCode dispatches on to the body that FunctionDeclarationInstantiation (§10.2.11) and the
  // body's evaluation specialize to.
  const functionCode = (fn: FunctionLike, outer: Scope): string => {
    const node = fn.node;
    const flavor = getFlavor(node);
    if (flavor === "async" || flavor === "asyncGenerator") isAsync = true;
    // The machinery of generators and async functions reaches the promise group's operators.
    if (flavor !== "normal") words.add("Promise");
    const body = fn.body;
    const statements = body !== undefined && ts.isBlock(body) ? body.statements : [];
    const isStrict = outer.isStrict || outer.isClassBody || hasUseStrict(statements);
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
    // An ordinary function's bindings that only its own code reaches are its frame's, which its
    // code makes each time it runs.
    const locals =
      flavor === "normal" &&
      ["normal", "arrow", "method", "get", "set"].includes(fn.kind) &&
      body !== undefined &&
      isSimple &&
      !hasDuplicates &&
      !argumentsNeeded &&
      (isStrict || getHoistableFunctions(statements).length === 0)
        ? getLocals(
            node,
            parameters,
            body,
            [
              { names: dedupe([...parameterNames, ...varScoped.names]), isConst: false },
              ...lexical,
            ],
            (items) => getLexicalDeclarations(items, true),
            keptByWrapper.get(node),
          )
        : undefined;
    const isLocal = (name: string) => (locals?.top.get(name) ?? 0) !== 0;
    const scope: Scope = {
      isStrict,
      isClassBody: false,
      isAsyncGenerator: flavor === "asyncGenerator",
      locals,
    };
    const id = codes.length + 1;
    codes.push({ id });
    // A function whose parameters are names that its body declares nothing beside instantiates
    // through one shared operator, as the steps below fold to the same few for all of them.
    const isPlain =
      isSimple &&
      !hasDuplicates &&
      !argumentsNeeded &&
      varScoped.names.every((name) => parameterNames.includes(name)) &&
      lexical.length === 0 &&
      functions.length === 0 &&
      (isStrict || getHoistableFunctions(statements).length === 0);
    const getSteps = () => {
      const steps: Step[] = [];
      // Step 19-20: the environment that holds the parameters.
      steps.push(
        !isStrict && hasExpressions
          ? letStep(
              ["pe", apply("NewDeclarativeEnvironment", ["s", "ctx.lex"])],
              ["env", "pe.e"],
              [
                "s1",
                apply("CreateBindings", [
                  "pe.s",
                  "env",
                  tuple(parameterNames.map(getUnits)),
                  getBool(isStrict),
                  getBool(hasDuplicates),
                ]),
              ],
            )
          : letStep(
              ["env", "ctx.lex"],
              [
                "s1",
                apply("CreateBindings", [
                  "s",
                  "env",
                  tuple(parameterNames.filter((name) => !isLocal(name)).map(getUnits)),
                  getBool(isStrict),
                  getBool(hasDuplicates),
                ]),
              ],
            ),
      );
      // Step 22: the arguments object.
      if (argumentsNeeded) {
        steps.push(
          letStep([
            "ao",
            isStrict || !isSimple
              ? apply("CreateUnmappedArgumentsObject", ["s1", "args"])
              : apply("CreateMappedArgumentsObjectOf", [
                  "s1",
                  "f",
                  tuple(parameterNames.map(getUnits)),
                  "args",
                  "env",
                ]),
          ]),
          letStep([
            "ab",
            apply(isStrict ? "CreateImmutableBinding" : "CreateMutableBinding", [
              "ao.s",
              "env",
              apply("N", [string("arguments")]),
              "FALSE",
            ]),
          ]),
          letStep([
            "s2",
            dot(
              apply("InitializeBinding", [
                "ab.s",
                "env",
                apply("N", [string("arguments")]),
                "ao.v",
              ]),
              "s",
            ),
          ]),
        );
      }
      // Steps 24-26: each parameter bound to its argument, or its initializer's value.
      const paramContext = () => except("ctx", [[[pathTo("lex")], "env"]]);
      let state = argumentsNeeded ? "s2" : "s1";
      parameters.forEach((parameter, index) => {
        if (
          ts.isIdentifier(parameter.name) &&
          parameter.initializer === undefined &&
          parameter.dotDotDotToken === undefined
        ) {
          const bound = binding(parameter.name, scope)(
            state,
            paramContext(),
            apply("Arg", ["args", num(index + 1)]),
            hasDuplicates ? "NoEnv" : "env",
          );
          steps.push((rest) => checked(`b${index + 1}`, bound, rest));
          state = `b${index + 1}.s`;
          return;
        }
        const argument =
          parameter.dotDotDotToken !== undefined
            ? apply("CreateArrayFromList", [
                state,
                ifThen(
                  apply(">", [num(index + 1), apply("Len", ["args"])]),
                  tuple([]),
                  apply("SubSeq", ["args", num(index + 1), apply("Len", ["args"])]),
                ),
              ])
            : apply("Ok", [
                state,
                ifThen(
                  apply("<=", [num(index + 1), apply("Len", ["args"])]),
                  subscript("args", [num(index + 1)]),
                  "Undefined",
                ),
              ]);
        steps.push(letStep([`v${index + 1}`, argument]));
        const initializer = parameter.initializer;
        const bound: Operand =
          initializer === undefined
            ? `v${index + 1}`
            : ifThen(
                apply("#", [apply("Val", [`v${index + 1}`]), "Undefined"]),
                `v${index + 1}`,
                ts.isIdentifier(parameter.name)
                  ? named(
                      initializer,
                      scope,
                      getStr(parameter.name.text),
                    )(`v${index + 1}.s`, paramContext())
                  : value(initializer, scope)(`v${index + 1}.s`, paramContext()),
              );
        const bindingCode = binding(parameter.name, scope)(
          `w${index + 1}.s`,
          paramContext(),
          apply("Val", [`w${index + 1}`]),
          hasDuplicates ? "NoEnv" : "env",
        );
        steps.push(
          (rest) => checked(`w${index + 1}`, bound, rest),
          (rest) => checked(`b${index + 1}`, bindingCode, rest),
        );
        state = `b${index + 1}.s`;
      });
      // Steps 27-28: the var bindings, in their own environment when parameters have expressions.
      const varNames = dedupe(varScoped.names);
      if (!hasExpressions) {
        steps.push(
          letStep(
            ["varEnv", "env"],
            [
              "s4",
              apply("CreateVarBindings", [
                state,
                "env",
                tuple(
                  varNames
                    .filter((name) => !parameterBindings.includes(name) && !isLocal(name))
                    .map(getUnits),
                ),
                "env",
                "FALSE",
                setOf([]),
              ]),
            ],
          ),
        );
      } else {
        steps.push(
          letStep(
            ["ve", apply("NewDeclarativeEnvironment", [state, "env"])],
            ["varEnv", "ve.e"],
            [
              "s4",
              apply("CreateVarBindings", [
                "ve.s",
                "ve.e",
                tuple(varNames.map(getUnits)),
                "env",
                "TRUE",
                setOf(
                  parameterBindings.filter((name) => !functionNames.includes(name)).map(getUnits),
                ),
              ]),
            ],
          ),
        );
      }
      // Step 32.a (§B.3.2.1): outside strict mode, var bindings for the block functions that no
      // parameter names, and the sites whose evaluation then sets them.
      const hoistable = isStrict ? [] : getHoistableFunctions(statements);
      // JS.tla keeps the earlier editions' reading, where a block function named arguments
      // leaves the arguments object, and Node, as the current edition, makes it the function.
      if (
        argumentsNeeded &&
        hoistable.some((declaration) => declaration.name?.text === "arguments")
      ) {
        throw new TlaTypeScriptError(
          "tla-ts can't tell whether a block function named arguments replaces the arguments object",
          node,
        );
      }
      const hoisted = hoistable.filter(
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
          letStep([
            "s4h",
            apply("CreateVarBindings", [
              "s4",
              "varEnv",
              tuple(hoistedNames.map(getUnits)),
              "varEnv",
              "FALSE",
              setOf([]),
            ]),
          ]),
          letStep([
            "s4a",
            apply("HoldEnvs", [
              except("s4h", [
                [
                  [pathTo("hoisted")],
                  apply("\\cup", [
                    exceptAt(),
                    setOf(
                      hoisted.map((declaration) => tuple(["varEnv", num(getSite(declaration))])),
                    ),
                  ]),
                ],
              ]),
            ]),
          ]),
        );
      }
      const varState = hoisted.length > 0 ? "s4a" : "s4";
      // Steps 30-34: the lexical environment and its bindings.
      if (!isStrict) {
        steps.push(letStep(["le", apply("NewDeclarativeEnvironment", [varState, "varEnv"])]));
      }
      const lexEnv = isStrict ? "varEnv" : "le.e";
      steps.push(
        letStep([
          "bodyCtx",
          except("ctx", [
            [[pathTo("lex")], lexEnv],
            [[pathTo("var")], "varEnv"],
          ]),
        ]),
      );
      if (lexical.length > 0) {
        steps.push(
          letStep([
            "s6",
            createLexicalDeclarations(
              lexical.map((declaration) => ({
                names: getBound(declaration.names, declaration.nodes, scope),
                isConst: declaration.isConst,
              })),
              isStrict ? varState : "le.s",
              lexEnv,
            ),
          ]),
        );
      }
      // Step 36: the functions.
      const functionState = lexical.length > 0 ? "s6" : isStrict ? varState : "le.s";
      const instantiated = instantiateDeclarations(
        functions.map((declaration) => {
          const name = declaration.name?.text ?? "*default*";
          return {
            instantiate: instantiateFunction(declaration, scope),
            mode: isLocal(name) ? ("local" as const) : ("mutable" as const),
            name,
            slot: locals?.top.get(name) ?? 0,
          };
        }),
        functionState,
        "bodyCtx",
        "varEnv",
      );
      if (functions.length > 0) steps.push(letStep(["fs", instantiated]));
      return chain(steps, getEvaluation(functions.length > 0 ? "fs" : functionState, "bodyCtx"));
    };
    const key = getFunctionKey(node);
    const isUnnamed =
      key !== undefined && (occurrences.get(key) ?? 0) <= 1 && !internalKeys.has(key);
    // A generator's code makes the generator, whose body RunBody runs from the context that
    // instantiation gives, and an async function's starts the driver of its body.
    const isGenerator = flavor === "generator" || flavor === "asyncGenerator";
    if (isGenerator && !isUnnamed) {
      bodies.push(statementList(statements, scope));
    }
    const bodyNumber = bodies.length;
    const getEvaluation = (state: string, context: string): Expression =>
      isGenerator
        ? checked(
            "g",
            apply("OrdinaryCreateFromConstructor", [
              state,
              "f",
              string(flavor === "generator" ? "GeneratorPrototype" : "AsyncGeneratorPrototype"),
              string(flavor),
              apply("GeneratorSlots", [context, recordOf([["code", num(bodyNumber)]])]),
            ]),
            apply("Abrupt", ["g.s", getCompletion("return", apply("Val", ["g"]), "Empty")]),
          )
        : body === undefined
          ? apply("Ok", [state, "Empty"])
          : ts.isBlock(body)
            ? statementList(body.statements, scope)(state, context)
            : checked(
                "e",
                value(body, scope)(state, context),
                apply("Abrupt", ["e.s", getCompletion("return", apply("Val", ["e"]), "Empty")]),
              );
    const slotCount = locals?.constant.length ?? 0;
    // Where the frame holds each binding the body declares, its environment would hold none.
    const isFramed =
      slotCount > 0 &&
      [...parameterNames, ...varScoped.names, ...lexicalNames].every((name) => isLocal(name));
    // Each slot's value as the code starts: a parameter's argument where the frame holds them all,
    // undefined for a var or a function, and no value for a lexical declaration's.
    const getFrame = () =>
      tuple(
        Array.from({ length: slotCount }, (_, index) => {
          const name = [...(locals?.top ?? [])].find((entry) => entry[1] === index + 1)?.[0];
          const parameter = name === undefined ? -1 : parameterNames.indexOf(name);
          if (isFramed && parameter !== -1) return apply("Arg", ["args", num(parameter + 1)]);
          return name !== undefined && varScoped.names.includes(name) && parameter === -1
            ? "Undefined"
            : "Empty";
        }),
      );
    const getFramedSteps = () => {
      const steps: Step[] = [letStep(["bodyCtx", except("ctx", [[[pathTo("var")], "ctx.lex"]])])];
      if (functions.length > 0) {
        steps.push(
          letStep([
            "fs",
            instantiateDeclarations(
              functions.map((declaration) => {
                const name = declaration.name?.text ?? "*default*";
                return {
                  instantiate: instantiateFunction(declaration, scope),
                  mode: "local" as const,
                  name,
                  slot: locals?.top.get(name) ?? 0,
                };
              }),
              "s",
              "bodyCtx",
              "ctx.lex",
            ),
          ]),
        );
      }
      return chain(steps, getEvaluation(functions.length === 0 ? "s" : "fs", "bodyCtx"));
    };
    const run = isUnnamed
      ? getUnreachable("tla-ts can't call a function that its script names nowhere else")
      : isFramed
        ? getFramedSteps()
        : isPlain && slotCount === 0
          ? letIn(
              [
                defineOperator(
                  "i",
                  [],
                  apply("PlainInstantiation", [
                    "s",
                    "ctx",
                    tuple(parameterNames.map(getUnits)),
                    "args",
                    getBool(isStrict),
                  ]),
                ),
              ],
              onLine(getEvaluation("i.s", "i.ctx"), 2),
            )
          : getSteps();
    const parameterList = ["s", "f", "ctx", "args"];
    if (slotCount > 0 && !isUnnamed) {
      addDefinition(defineOperator(`Body${id}`, parameterList, onLine(run, 2)));
    }
    if (flavor === "async" && !isUnnamed) {
      addDefinition(defineOperator(`AsyncBody${id}`, parameterList, onLine(run, 2)));
    }
    codes[id - 1] = {
      id,
      definition: defineOperator(
        `Code${id}`,
        parameterList,
        onLine(
          flavor === "async" && !isUnnamed
            ? chain(
                [
                  letStep([
                    "cap",
                    apply("NewPromiseCapability", [
                      "s",
                      apply("Intrinsic", ["s", string("Promise")]),
                    ]),
                  ]),
                  letStep([
                    "started",
                    apply("AsyncFunctionStep", [
                      apply("Val", ["cap"]),
                      apply(`AsyncBody${id}`, ["cap.s", "f", "ctx", "args"]),
                    ]),
                  ]),
                ],
                apply("Abrupt", [
                  "started.s",
                  getCompletion("return", dot(apply("Val", ["cap"]), "promise"), "Empty"),
                ]),
              )
            : slotCount > 0 && !isUnnamed
              ? letIn(
                  [
                    defineOperator(
                      "r",
                      [],
                      apply(`Body${id}`, [
                        except("s", [[[pathTo("frame")], getFrame()]]),
                        "f",
                        "ctx",
                        "args",
                      ]),
                    ),
                  ],
                  except("r", [[[pathTo("s"), pathTo("frame")], "s.frame"]]),
                )
              : run,
          2,
        ),
      ),
    };
    const length = parameters.findIndex(
      (parameter) => parameter.initializer !== undefined || parameter.dotDotDotToken !== undefined,
    );
    // A function whose frame holds all its bindings, which makes no closure and, unless it's an
    // arrow, whose this an arrow would find in an outer function, reads no this, super, or
    // new.target, can't observe the environment a call makes for it, which holds nothing.
    const isBare =
      isFramed &&
      !isUnnamed &&
      body !== undefined &&
      !hasClosure(body) &&
      (fn.kind === "arrow" || !readsThis(body));
    return defineRecord(
      id,
      isStrict,
      length === -1 ? parameters.length : length,
      fn.kind === "staticBlock" ? tuple([]) : getSourceText(node),
      getFunctionNaming(fn),
      flavor,
      isBare,
    );
  };

  // ClassDefinitionEvaluation (§15.7.14) of a class whose elements are methods, accessors,
  // fields, and static blocks: a result with the class's constructor, named by binding or else by
  // the name it's called with.
  const classDefinition = (
    node: ts.ClassLikeDeclaration,
    binding: string | undefined,
  ): NamedCode => {
    const scope: Scope = { isStrict: true, isClassBody: true, isAsyncGenerator: false };
    const heritage = node.heritageClauses?.find(
      (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
    )?.types[0]?.expression;
    // TypeScript parses a static method named constructor as a constructor.
    const isConstructor = (member: ts.ClassElement): member is ts.ConstructorDeclaration =>
      ts.isConstructorDeclaration(member) && !hasModifier(member, ts.SyntaxKind.StaticKeyword);
    const constructor = node.members.find(isConstructor);
    const elements = node.members.filter(
      (member) => !isConstructor(member) && !ts.isSemicolonClassElement(member),
    );
    for (const element of elements) {
      if (ts.canHaveDecorators(element) && ts.getDecorators(element)?.length)
        throw new TlaTypeScriptError("tla-ts can't compile a decorator to JS.tla yet", element);
    }
    if (ts.getDecorators(node)?.length)
      throw new TlaTypeScriptError("tla-ts can't compile a decorator to JS.tla yet", node);
    const getClassName = () => (binding === undefined ? ref("name") : getStr(binding));
    // PrivateBoundIdentifiers (§15.7.3): the class's private names, each once.
    const privateNames = dedupe(
      elements.flatMap((element) =>
        element.name !== undefined && ts.isPrivateIdentifier(element.name)
          ? [element.name.text.slice(1)]
          : [],
      ),
    );
    const heritageValue =
      heritage === undefined
        ? apply("Ok", ["s1", "Empty"])
        : value(heritage, scope)("s1", apply("WithLex", ["ctx", "env.e"]));
    const made =
      constructor === undefined
        ? letIn(
            [
              defineOperator(
                "a",
                [],
                apply("Alloc", [
                  "proto.s",
                  apply("BuiltinObject", [
                    dot(apply("Val", ["parents"]), "ctor"),
                    tuple([string("Class"), string("default")]),
                    num(0),
                    apply("FunctionNameUnits", ["proto.s", getClassName()]),
                    "TRUE",
                    getPosition(node, node.getStart()),
                    "proto.s.realmId",
                  ]),
                ]),
              ),
            ],
            apply("Ok", ["a.s", "a.v"]),
          )
        : letIn(
            [
              defineOperator(
                "m",
                [],
                apply("CodeFunctionCreate", [
                  "proto.s",
                  dot(apply("Val", ["parents"]), "ctor"),
                  functionCode(
                    {
                      node: constructor,
                      parameters: constructor.parameters,
                      body: constructor.body,
                      kind: "constructor",
                    },
                    scope,
                  ),
                  "FALSE",
                  "cctx.lex",
                  "cctx.priv",
                ]),
              ),
            ],
            apply("Ok", [
              apply("SetFunctionName", [
                apply("MakeClassConstructor", [
                  apply("MakeMethod", ["m.s", "m.v", apply("Val", ["proto"])]),
                  "m.v",
                ]),
                "m.v",
                getClassName(),
                tuple([]),
              ]),
              "m.v",
            ]),
          );
    const sourceText = getSourceText(node);
    const steps: Step[] = [
      (rest) =>
        letIn(
          [
            defineOperator("env", [], apply("NewDeclarativeEnvironment", ["s", "ctx.lex"])),
            onLine(
              defineOperator(
                "s0",
                [],
                binding === undefined
                  ? "env.s"
                  : dot(
                      apply("CreateImmutableBinding", [
                        "env.s",
                        "env.e",
                        getUnits(binding),
                        "TRUE",
                      ]),
                      "s",
                    ),
              ),
              6,
            ),
            onLine(
              defineOperator(
                "priv",
                [],
                apply("NewPrivateEnvironment", [
                  "s0",
                  "ctx.priv",
                  tuple(privateNames.map(getUnits)),
                ]),
              ),
              6,
            ),
            onLine(defineOperator("s1", [], "priv.s"), 6),
            onLine(
              defineOperator(
                "cctx",
                [],
                except("ctx", [
                  [[pathTo("lex")], "env.e"],
                  [[pathTo("priv")], "priv.env"],
                ]),
              ),
              6,
            ),
          ],
          rest,
        ),
      // The heritage runs in the class's scope with the outer private environment.
      (rest) => checked("h", heritageValue, rest),
      (rest) =>
        checked(
          "parents",
          heritage === undefined
            ? apply("Ok", [
                "h.s",
                recordOf([
                  ["proto", apply("Intrinsic", ["h.s", string("ObjectPrototype")])],
                  ["ctor", apply("Intrinsic", ["h.s", string("FunctionPrototype")])],
                ]),
              ])
            : apply("ClassParents", ["h.s", apply("Val", ["h"])]),
          rest,
        ),
      letStep([
        "proto",
        apply("OrdinaryObjectCreate", ["parents.s", dot(apply("Val", ["parents"]), "proto")]),
      ]),
      letStep(["made", made]),
      (rest) =>
        letIn(
          [
            defineOperator("F", [], apply("Val", ["made"])),
            onLine(
              defineOperator(
                "s2",
                [],
                apply("MakeConstructor", ["made.s", "F", "FALSE", apply("Val", ["proto"])]),
              ),
              6,
            ),
            onLine(
              defineOperator(
                "s3",
                [],
                apply("SetO", [
                  "s2",
                  "F",
                  except(apply("O", ["s2", "F"]), [
                    [
                      [pathTo("slots")],
                      apply("@@", [
                        recordOf([
                          ["ctorKind", string(heritage === undefined ? "base" : "derived")],
                          ["sourceText", sourceText],
                        ]),
                        exceptAt(),
                      ]),
                    ],
                  ]),
                ]),
              ),
              6,
            ),
            onLine(
              defineOperator(
                "s4",
                [],
                dot(
                  apply("CreateMethodProperty", [
                    "s3",
                    apply("Val", ["proto"]),
                    apply("SV", [string("constructor")]),
                    "F",
                  ]),
                  "s",
                ),
              ),
              6,
            ),
          ],
          rest,
        ),
    ];
    const records = elements.map((element, index) => {
      const isStatic =
        ts.isClassStaticBlockDeclaration(element) ||
        (ts.canHaveModifiers(element) &&
          (ts
            .getModifiers(element)
            ?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) ??
            false));
      const home = isStatic ? "F" : apply("Val", ["proto"]);
      const name = subscript(apply("Val", ["els"]), [num(index + 1)]);
      if (
        ts.isMethodDeclaration(element) ||
        ts.isGetAccessorDeclaration(element) ||
        ts.isSetAccessorDeclaration(element) ||
        ts.isConstructorDeclaration(element)
      ) {
        const code = classElement(element, scope);
        return {
          name,
          isStatic,
          kind: "method",
          getCode: (state: string) => code(state, "cctx", home),
        };
      }
      if (ts.isPropertyDeclaration(element)) {
        const code = classField(element, scope);
        return {
          name,
          isStatic,
          kind: "field",
          getCode: (state: string) => code(state, "cctx", home),
        };
      }
      if (ts.isClassStaticBlockDeclaration(element)) {
        const code = functionCode(
          { node: element, parameters: [], body: element.body, kind: "staticBlock" },
          scope,
        );
        return {
          name,
          isStatic,
          kind: "staticBlock",
          getCode: (state: string) =>
            letIn(
              [
                defineOperator(
                  "f",
                  [],
                  apply("CodeFunctionCreate", [
                    state,
                    apply("Intrinsic", [state, string("FunctionPrototype")]),
                    code,
                    "FALSE",
                    "cctx.lex",
                    "cctx.priv",
                  ]),
                ),
              ],
              apply("Ok", [
                apply("MakeMethod", ["f.s", "f.v", "F"]),
                recordOf([
                  ["kind", string("staticBlock")],
                  ["body", "f.v"],
                ]),
              ]),
            ),
        };
      }
      throw new TlaTypeScriptError(
        "tla-ts can't compile this class element to JS.tla yet",
        element,
      );
    });
    const getRecords = (list: typeof records) => tuple(list.map((record) => record.name));
    // The methods, getters, and setters, static ones first, as DecorateElements defines them.
    const methods = records.filter((record) => record.kind === "method");
    const elementList = classElements(records.map((record) => record.getCode))("s4");
    steps.push(
      (rest) => checked("els", elementList, rest),
      (rest) =>
        checked(
          "ds",
          apply("DefineElementsOn", [
            "els.s",
            "F",
            getRecords(methods.filter((record) => record.isStatic)),
          ]),
          rest,
        ),
      (rest) =>
        checked(
          "di",
          apply("DefineElementsOn", [
            "ds.s",
            apply("Val", ["proto"]),
            getRecords(methods.filter((record) => !record.isStatic)),
          ]),
          rest,
        ),
    );
    const state = "di.s";
    const instanceFields = records.filter((record) => record.kind === "field" && !record.isStatic);
    const statics = records.filter((record) => record.kind !== "method" && record.isStatic);
    // The private methods and accessors go on each instance as it's made, and the static ones on
    // the class now (§15.7.14 steps 30-34).
    steps.push(
      letStep([
        "sf",
        apply("SetO", [
          state,
          "F",
          except(apply("O", [state, "F"]), [
            [
              [pathTo("slots")],
              apply("@@", [
                recordOf([
                  [
                    "privateMethods",
                    apply("PrivateMethodsOf", [
                      getRecords(methods.filter((record) => !record.isStatic)),
                      tuple([]),
                    ]),
                  ],
                  ["fields", getRecords(instanceFields)],
                  ["initializers", "Empty"],
                ]),
                exceptAt(),
              ]),
            ],
          ]),
        ]),
      ]),
      (rest) =>
        checked(
          "sm",
          apply("AddPrivateMethods", [
            "sf",
            "F",
            apply("PrivateMethodsOf", [
              getRecords(methods.filter((record) => record.isStatic)),
              tuple([]),
            ]),
          ]),
          rest,
        ),
      letStep([
        "sb",
        binding === undefined
          ? "sm.s"
          : dot(apply("InitializeBinding", ["sm.s", "env.e", getUnits(binding), "F"]), "s"),
      ]),
    );
    const name = define(
      "Class",
      ["s", "ctx", "name"],
      chain(
        steps,
        checked(
          "st",
          apply("StaticElementsEvaluation", ["sb", "F", getRecords(statics)]),
          apply("Ok", ["st.s", "F"]),
        ),
      ),
    );
    return (current, context, className) => apply(name, [current, context, className]);
  };

  // The records of a class's elements in order, from ClassElementEvaluation (§15.7.14 step 26),
  // as the value of the result, in the class's cctx with its constructor F and prototype proto. A
  // list of more than 64 runs as its halves, each a list, so that thousands of elements nest log n
  // deep rather than n.
  const classElements = (
    elements: ((state: string) => Expression)[],
  ): ((state: string) => Expression) => {
    if (elements.length > 64) {
      const middle = Math.ceil(elements.length / 2);
      const first = classElements(elements.slice(0, middle));
      const rest = classElements(elements.slice(middle));
      const name = define(
        "ClassElements",
        ["s", "cctx", "F", "proto"],
        checked(
          "q",
          first("s"),
          checked(
            "r",
            rest("q.s"),
            apply("Ok", ["r.s", apply("\\o", [apply("Val", ["q"]), apply("Val", ["r"])])]),
          ),
        ),
      );
      return (state) => apply(name, [state, "cctx", "F", "proto"]);
    }
    return (initial) => {
      const steps = elements.map((getCode, index) => {
        const evaluated = getCode(index === 0 ? initial : `c${index}.s`);
        return (rest: Expression) => checked(`c${index + 1}`, evaluated, rest);
      });
      const state = elements.length === 0 ? initial : `c${elements.length}.s`;
      return chain(
        steps,
        apply("Ok", [state, tuple(elements.map((_, index) => apply("Val", [`c${index + 1}`])))]),
      );
    };
  };

  // The completion of a statement (§14).
  const statement = (node: ts.Statement, scope: Scope, labels: string[]): Code =>
    inRegion(node, () => declaredStatement(node, scope, labels));
  const declaredStatement = (node: ts.Statement, scope: Scope, labels: string[]): Code => {
    if (ts.isExpressionStatement(node)) return value(node.expression, scope);
    if (ts.isVariableStatement(node)) return declarationList(node.declarationList, scope);
    if (ts.isFunctionDeclaration(node)) {
      // §B.3.2.1: a block's function that the var scope's instantiation hoisted sets the var
      // binding as its declaration runs.
      if (scope.isStrict) return (state) => apply("Ok", [state, "Empty"]);
      return (state, context) =>
        ifThen(
          apply("\\in", [tuple([dot(context, "var"), num(getSite(node))]), dot(state, "hoisted")]),
          apply("HoistedFunctionEvaluation", [
            state,
            context,
            getUnits(node.name?.text ?? "*default*"),
          ]),
          apply("Ok", [state, "Empty"]),
        );
    }
    if (ts.isClassDeclaration(node)) {
      // BindingClassDeclarationEvaluation (§15.7.15) binds the class in the running context too,
      // and a module's default export of a class without a name binds *default* to the class that
      // it names default (§16.2.3.7).
      const definition = classDefinition(node, node.name?.text);
      const evaluated = definition(
        "s",
        "ctx",
        node.name === undefined ? getStr("default") : "EmptyStr",
      );
      return defineCode(
        "ClassDeclaration",
        checked(
          "r",
          evaluated,
          checked(
            "b",
            node.name !== undefined && scope.locals?.slots.has(node.name)
              ? apply("LocalInitialize", [
                  "r.s",
                  num(scope.locals.slots.get(node.name) ?? 0),
                  apply("Val", ["r"]),
                ])
              : apply("InitializeBinding", [
                  "r.s",
                  "ctx.lex",
                  getUnits(getDeclaredName(node)),
                  apply("Val", ["r"]),
                ]),
            apply("Ok", ["b.s", "Empty"]),
          ),
        ),
      );
    }
    // An import, and an export of names, evaluate to empty (§16.2.2.7, §16.2.3.7).
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      return (state) => apply("Ok", [state, "Empty"]);
    // export default of an expression, which binds *default* (§16.2.3.7).
    if (ts.isExportAssignment(node) && node.isExportEquals !== true) {
      const exported = named(node.expression, scope, getStr("default"));
      return defineCode(
        "ExportDefault",
        apply("ExportDefaultThen", ["ctx", "FALSE", exported("s", "ctx")]),
      );
    }
    if (ts.isEmptyStatement(node) || ts.isDebuggerStatement(node))
      return (state) => apply("Ok", [state, "Empty"]);
    if (ts.isBlock(node)) return block(node.statements, scope);
    if (ts.isIfStatement(node)) {
      const test = value(node.expression, scope);
      // §B.3.4: a function declaration as a clause runs as a block that holds it.
      const getClause = (clause: ts.Statement) =>
        ts.isFunctionDeclaration(clause) ? block([clause], scope) : statement(clause, scope, []);
      const whenTrue = getClause(node.thenStatement);
      const whenFalse =
        node.elseStatement === undefined ? undefined : getClause(node.elseStatement);
      const tested = test("s", "ctx");
      const trueValue = apply("UpdateEmptyThen", ["Undefined", whenTrue("r.s", "ctx")]);
      const falseValue =
        whenFalse === undefined
          ? apply("Ok", ["r.s", "Undefined"])
          : apply("UpdateEmptyThen", ["Undefined", whenFalse("r.s", "ctx")]);
      return defineCode(
        "If",
        checked(
          "r",
          tested,
          ifThen(apply("ToBooleanValue", [apply("Val", ["r"])]), trueValue, falseValue),
        ),
      );
    }
    if (ts.isReturnStatement(node)) {
      if (node.expression === undefined)
        return (state) => apply("Abrupt", [state, getCompletion("return", "Undefined", "Empty")]);
      const result = value(node.expression, scope);
      return (state, context) =>
        scope.isAsyncGenerator
          ? apply("ReturnThen", [context, result(state, context)])
          : apply("ReturnValueThen", [result(state, context)]);
    }
    if (ts.isThrowStatement(node)) {
      const thrown = value(node.expression, scope);
      const site = [fileNumbers.get(node.getSourceFile()) ?? 0, throwIndexes.get(node) ?? 0];
      return (state, context) =>
        apply("ThrowAtThen", [tuple(site.map(num)), thrown(state, context)]);
    }
    if (ts.isBreakStatement(node) || ts.isContinueStatement(node)) {
      const type = ts.isBreakStatement(node) ? "break" : "continue";
      const label = node.label;
      return (state) =>
        apply("Abrupt", [
          state,
          getCompletion(type, "Empty", label === undefined ? "Empty" : getUnits(label.text)),
        ]);
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
      return (state, context) => apply("LabelThen", [getUnits(label), code(state, context)]);
    }
    if (ts.isWhileStatement(node) || ts.isDoStatement(node) || ts.isForStatement(node))
      return loop(node, scope, labels);
    if (ts.isForOfStatement(node) || ts.isForInStatement(node)) return forInOf(node, scope, labels);
    if (ts.isSwitchStatement(node)) return switchStatement(node, scope);
    if (ts.isTryStatement(node)) return tryStatement(node, scope);
    if (ts.isWithStatement(node)) {
      const object = value(node.expression, scope);
      const body = statement(node.statement, scope, []);
      const evaluated = object("s", "ctx");
      return defineCode(
        "With",
        checked(
          "r",
          evaluated,
          checked(
            "o",
            apply("ToObject", ["r.s", apply("Val", ["r"])]),
            letIn(
              [
                defineOperator(
                  "env",
                  [],
                  apply("NewObjectEnvironment", ["o.s", apply("Val", ["o"]), "TRUE", "ctx.lex"]),
                ),
              ],
              apply("UpdateEmptyThen", [
                "Undefined",
                body("env.s", apply("WithLex", ["ctx", "env.e"])),
              ]),
            ),
          ),
        ),
      );
    }
    throw new TlaTypeScriptError(
      `tla-ts can't compile ${ts.SyntaxKind[node.kind]} to JS.tla yet`,
      node,
    );
  };

  // Variable statements (§14.3.2.1) and let and const declarations (§14.3.1.2).
  const declarationList = (list: ts.VariableDeclarationList, scope: Scope): Code => {
    const isLet = isLexical(list);
    const kind = getResourceKind(list);
    // A using declaration reads its values' @@dispose or @@asyncDispose.
    if (kind !== "normal") words.add(kind === "sync-dispose" ? "dispose" : "asyncDispose");
    const steps: Step[] = [];
    let state = "s";
    list.declarations.forEach((declaration, index) => {
      const initializer = declaration.initializer;
      const result = `d${index + 1}`;
      if (!ts.isIdentifier(declaration.name)) {
        // A pattern binds the initializer's value, in the running lexical environment for let
        // and const, and by assignment for var (§14.3.2.1, §14.3.1.2).
        if (initializer === undefined) return;
        const pattern = binding(declaration.name, scope);
        const evaluated = value(initializer, scope)(state, "ctx");
        const bound = pattern(
          `v${index + 1}.s`,
          "ctx",
          apply("Val", [`v${index + 1}`]),
          isLet ? "ctx.lex" : "NoEnv",
        );
        steps.push(
          (rest) => checked(`v${index + 1}`, evaluated, rest),
          (rest) => checked(result, bound, rest),
        );
        state = `${result}.s`;
        return;
      }
      const name = declaration.name.text;
      words.add(name);
      if (initializer === undefined && !isLet) return;
      const lhs = `l${index + 1}`;
      const referenced = nameReference(declaration.name, scope)(state, "ctx");
      steps.push((rest) => checked(lhs, referenced, rest));
      const assigned =
        initializer === undefined
          ? undefined
          : named(initializer, scope, getStr(name))(`${lhs}.s`, "ctx");
      const initialization = isLet
        ? assigned === undefined
          ? apply("InitializeReferencedBinding", [`${lhs}.s`, apply("Val", [lhs]), "Undefined"])
          : kind === "normal"
            ? apply("InitializeReferencedThen", [apply("Val", [lhs]), assigned])
            : apply("InitializeThen", [string(kind), apply("Val", [lhs]), assigned])
        : apply("PutValueThen", [apply("Val", [lhs]), assigned ?? "Undefined"]);
      steps.push((rest) => checked(result, initialization, rest));
      state = `${result}.s`;
    });
    if (steps.length === 0) return (current) => apply("Ok", [current, "Empty"]);
    return defineCode("Declare", chain(steps, apply("Ok", [state, "Empty"])));
  };

  // A statement list's evaluation (§14.2.2): the completion of the last statement that has a
  // value, each statement in its own operator.
  const statementList = (statements: readonly ts.Statement[], scope: Scope): Code => {
    const list = statementSequence(statements, scope);
    // A block's, function body's, or module's resources are disposed of once its statements
    // complete (EvaluateDisposing in JS.tla).
    return hasUsing(statements)
      ? (state, context) => apply("DisposeThen", [dot(context, "lex"), list(state, context)])
      : list;
  };

  // The statements in order, each in an operator of its own. A list of more than 64 runs as its
  // halves, each a list, so that thousands of statements nest log n deep rather than n.
  const statementSequence = (statements: readonly ts.Statement[], scope: Scope): Code => {
    if (statements.length === 0) return (state) => apply("Ok", [state, "Empty"]);
    if (statements.length > 64) {
      const middle = Math.ceil(statements.length / 2);
      const first = statementSequence(statements.slice(0, middle), scope);
      const rest = statementSequence(statements.slice(middle), scope);
      const evaluated = first("s", "ctx");
      return defineCode(
        "Statements",
        checked(
          "q",
          evaluated,
          apply("StatementResult", [rest("q.s", "ctx"), apply("Val", ["q"])]),
        ),
      );
    }
    const statementCodes = statements.map((current) => statement(current, scope, []));
    // Each statement's result, its value Empty's where it has none, of the statement before it.
    const results = statementCodes.map((code, index) =>
      apply("StatementResult", [
        code(index === 0 ? "s" : `q${index}.s`, "ctx"),
        index === 0 ? "Empty" : apply("Val", [`q${index}`]),
      ]),
    );
    const name = define(
      "Statements",
      ["s", "ctx"],
      chain(
        results
          .slice(0, -1)
          .map((result, index) => (rest: Expression) => checked(`q${index + 1}`, result, rest)),
        results[results.length - 1],
      ),
    );
    return (state, context) => apply(name, [state, context]);
  };

  // Blocks (§14.2.2) and BlockDeclarationInstantiation (§14.2.3). A block that declares nothing
  // runs in its context, as a new environment without bindings changes nothing it can observe.
  const block = (statements: readonly ts.Statement[], scope: Scope): Code => {
    const declarations = getLexicalDeclarations(statements, true);
    const list = statementList(statements, scope);
    if (declarations.length === 0) return list;
    const declared = blockDeclarations(declarations, scope);
    if (!hasBound(declarations, scope)) {
      return defineCode("Block", list(declared("s", "ctx"), "ctx"));
    }
    return defineCode(
      "Block",
      letIn(
        [
          defineOperator("env", [], apply("NewDeclarativeEnvironment", ["s", "ctx.lex"])),
          defineOperator("bctx", [], apply("WithLex", ["ctx", "env.e"])),
        ],
        list(declared("env.s", "bctx"), "bctx"),
      ),
    );
  };

  // Whether declarations bind a name that an environment holds rather than a frame.
  const hasBound = (declarations: readonly LexicalDeclaration[], scope: Scope) =>
    declarations.some(
      (declaration) => getBound(declaration.names, declaration.nodes, scope).length > 0,
    );

  // BlockDeclarationInstantiation (§14.2.3, §B.3.2.6): the state once the declarations have their
  // bindings in the environment that the context's lexical environment is, and each function its
  // object.
  const blockDeclarations = (declarations: LexicalDeclaration[], scope: Scope): Code => {
    const steps: Step[] = [];
    let state = "s";
    declarations.forEach((declaration, index) => {
      const bound = getBound(declaration.names, declaration.nodes, scope);
      steps.push(
        letStep([
          `b${index + 1}`,
          resetSlots(
            bound.length === 0
              ? state
              : apply("BlockBindNames", [
                  state,
                  "ctx.lex",
                  tuple(bound.map(getUnits)),
                  getBool(declaration.isConst),
                ]),
            getSlots(declaration.nodes, scope),
          ),
        ]),
      );
      state = `b${index + 1}`;
      if (declaration.fn !== undefined) {
        const instantiate = instantiateFunction(declaration.fn, scope);
        const units = declaration.names[0];
        const slot = scope.locals?.slots.get(declaration.nodes[0]);
        const object = `fo${index + 1}`;
        steps.push(
          letStep([object, instantiate(state, "ctx")]),
          letStep([
            `fb${index + 1}`,
            slot === undefined
              ? ifThen(
                  dot(
                    subscript(dot(apply("E", [`${object}.s`, "ctx.lex"]), "b"), [getUnits(units)]),
                    "init",
                  ),
                  dot(
                    apply("SetMutableBinding", [
                      `${object}.s`,
                      "ctx.lex",
                      getUnits(units),
                      apply("Val", [object]),
                      "FALSE",
                    ]),
                    "s",
                  ),
                  dot(
                    apply("InitializeBinding", [
                      `${object}.s`,
                      "ctx.lex",
                      getUnits(units),
                      apply("Val", [object]),
                    ]),
                    "s",
                  ),
                )
              : dot(
                  apply("LocalInitialize", [`${object}.s`, num(slot), apply("Val", [object])]),
                  "s",
                ),
          ]),
        );
        state = `fb${index + 1}`;
      }
    });
    // A list of no declarations has a line of two spaces before its state, as the steps' text
    // joined to it had.
    const operator = define(
      "Declarations",
      ["s", "ctx"],
      steps.length === 0 ? afterBlankLine(state, 2) : chain(steps, state),
    );
    return (current, context) => apply(operator, [current, context]);
  };

  // The while, do-while, and for statements (§14.7), whose iterations JS.tla's LoopFrom runs: a
  // loop is [id, labels, lets], and LoopIteration runs the iteration of the loop id.
  const loop = (
    node: ts.WhileStatement | ts.DoStatement | ts.ForStatement,
    scope: Scope,
    labels: string[],
  ): Code => {
    const id = loops.length + 1;
    loops.push({ id });
    const getLabels = () => setOf(labels.map(getUnits));
    const getLoop = (lets: Operand) =>
      recordOf([
        ["id", num(id)],
        ["labels", getLabels()],
        ["lets", lets],
      ]);
    const body = statement(node.statement, scope, []);
    // The end of an iteration whose body completed abruptly, or the rest.
    const getIterationEnd = (rest: Expression) =>
      ifThen(
        apply("#", [apply("IterationEnd", ["b", "loop.labels", "v"]), "Empty"]),
        apply("IterationEnd", ["b", "loop.labels", "v"]),
        rest,
      );
    const getLoopFrom = (): Code => (state, context) =>
      apply("BreakTargetThen", [
        apply("LoopFrom", [state, context, getLoop(tuple([])), "Undefined", num(0)]),
      ]);
    if (ts.isWhileStatement(node)) {
      const test = value(node.expression, scope);
      const tested = test("s", "ctx");
      const iterated = body("r.s", "ctx");
      loops[id - 1].body = checked(
        "r",
        tested,
        ifThen(
          apply("~", [apply("ToBooleanValue", [apply("Val", ["r"])])]),
          apply("Ok", ["r.s", "v"]),
          letIn(
            [defineOperator("b", [], iterated)],
            getIterationEnd(
              apply("Iterate", ["b.s", "ctx", apply("NextIterationValue", ["b.c", "v"])]),
            ),
          ),
        ),
      );
      return getLoopFrom();
    }
    if (ts.isDoStatement(node)) {
      const test = value(node.expression, scope);
      const iterated = body("s", "ctx");
      const tested = test("b.s", "ctx");
      loops[id - 1].body = letIn(
        [defineOperator("b", [], iterated)],
        getIterationEnd(
          letIn(
            [
              defineOperator("w", [], apply("NextIterationValue", ["b.c", "v"])),
              defineOperator("r", [], tested),
            ],
            ifThen(
              apply("IsAbrupt", ["r"]),
              "r",
              ifThen(
                apply("~", [apply("ToBooleanValue", [apply("Val", ["r"])])]),
                apply("Ok", ["r.s", "w"]),
                apply("Iterate", ["r.s", "ctx", "w"]),
              ),
            ),
          ),
        ),
      );
      return getLoopFrom();
    }
    const test: Code =
      node.condition === undefined
        ? (state) => apply("Ok", [state, "True"])
        : value(node.condition, scope);
    const increment = node.incrementor === undefined ? undefined : value(node.incrementor, scope);
    const tested = test("s", "ctx");
    const iterated = body("r.s", "ctx");
    const incremented =
      increment === undefined
        ? apply("Ok", ["p.s", "Empty"])
        : increment("p.s", apply("Val", ["p"]));
    loops[id - 1].body = checked(
      "r",
      tested,
      ifThen(
        apply("~", [apply("ToBooleanValue", [apply("Val", ["r"])])]),
        apply("Ok", ["r.s", "v"]),
        letIn(
          [defineOperator("b", [], iterated)],
          getIterationEnd(
            checked(
              "p",
              apply("CreatePerIterationEnvironment", ["b.s", "ctx", "loop.lets"]),
              apply("ForIncrementThen", [
                apply("Val", ["p"]),
                "loop",
                apply("NextIterationValue", ["b.c", "v"]),
                incremented,
              ]),
            ),
          ),
        ),
      ),
    );
    const initializer = node.initializer;
    if (
      initializer !== undefined &&
      ts.isVariableDeclarationList(initializer) &&
      isLexical(initializer)
    ) {
      const nodes = initializer.declarations.flatMap((item) => getBoundIdentifiers(item.name));
      const names = getBound(getDeclaredNames(initializer), nodes, scope);
      const slots = getSlots(nodes, scope);
      // CreatePerIterationEnvironment (§14.7.4.4) copies the let bindings so that each closure an
      // iteration makes keeps its own. Where the statement makes no closure, nothing can tell the
      // copies from the bindings they copy, so the iterations share one environment.
      const lets =
        isConst(initializer) || !hasClosure(node) ? tuple([]) : tuple(names.map(getUnits));
      const declaration = declarationList(initializer, scope);
      if (names.length === 0) {
        return defineCode(
          "For",
          apply("BreakTargetThen", [
            apply("ForDeclarationThen", [
              "ctx",
              getLoop(tuple([])),
              declaration(resetSlots("s", slots), "ctx"),
            ]),
          ]),
        );
      }
      const declared = apply("ForDeclarationThen", [
        "loopCtx",
        getLoop(lets),
        declaration(
          resetSlots(
            apply("BlockBindNames", [
              "env.s",
              "env.e",
              tuple(names.map(getUnits)),
              getBool(isConst(initializer)),
            ]),
            slots,
          ),
          "loopCtx",
        ),
      ]);
      return defineCode(
        "For",
        letIn(
          [
            defineOperator("env", [], apply("NewDeclarativeEnvironment", ["s", "ctx.lex"])),
            defineOperator("loopCtx", [], apply("WithLex", ["ctx", "env.e"])),
          ],
          apply("BreakTargetThen", [
            isUsing(initializer)
              ? apply("DisposeThen", ["env.e", declared])
              : parenthesized(declared),
          ]),
        ),
      );
    }
    const init: Code =
      initializer === undefined
        ? (state) => apply("Ok", [state, "Empty"])
        : ts.isVariableDeclarationList(initializer)
          ? declarationList(initializer, scope)
          : value(initializer, scope);
    return defineCode(
      "For",
      apply("BreakTargetThen", [
        apply("ForDeclarationThen", ["ctx", getLoop(tuple([])), init("s", "ctx")]),
      ]),
    );
  };

  // The for-in and for-of statements (§14.7.5): ForIn/OfHeadEvaluation, then JS.tla's LoopFrom
  // over the iteration LoopIteration gives for the loop's id.
  const forInOf = (
    node: ts.ForInStatement | ts.ForOfStatement,
    scope: Scope,
    labels: string[],
  ): Code => {
    const isEnumerate = ts.isForInStatement(node);
    // A for-await statement awaits each result of its async iterator's next.
    const isAwait = ts.isForOfStatement(node) && node.awaitModifier !== undefined;
    if (isAwait) isAsync = true;
    const id = loops.length + 1;
    loops.push({ id });
    const initializer = node.initializer;
    const body = statement(node.statement, scope, []);
    let bind: Expression;
    let tdz: string[] = [];
    let tdzSlots: number[] = [];
    if (ts.isVariableDeclarationList(initializer) && initializer.declarations.length === 0) {
      // TypeScript parses the identifier let as the head of a for-in statement outside strict
      // mode as a let declaration of no names.
      if (!isEnumerate || scope.isStrict) {
        throw new TlaTypeScriptError("tla-ts can't compile a declaration of no names", node);
      }
      words.add("let");
      if (!moduleNames.has("let")) identifiers.add("let");
      bind = apply("ResultThen", [
        "ctx",
        apply("AssignToThen", [
          apply("Val", ["value"]),
          apply("ResolveBinding", ["value.s", "ctx", getUnits("let"), "FALSE"]),
        ]),
      ]);
    } else if (ts.isVariableDeclarationList(initializer)) {
      const declaration = initializer.declarations[0];
      if (
        declaration.initializer !== undefined &&
        (!isEnumerate ||
          scope.isStrict ||
          isLexical(initializer) ||
          !ts.isIdentifier(declaration.name))
      ) {
        throw new TlaTypeScriptError(
          "tla-ts can't compile an initializer in a for-in head to JS.tla yet",
          node,
        );
      }
      const names = getBoundNames(declaration.name);
      const pattern = binding(declaration.name, scope);
      const slot = scope.locals?.slots.get(declaration.name);
      if (isLexical(initializer) && slot !== undefined) {
        tdzSlots = [slot];
        bind = apply("ResultThen", [
          "ctx",
          apply("LocalInitialize", ["value.s", num(slot), apply("Val", ["value"])]),
        ]);
      } else if (isLexical(initializer)) {
        tdz = names;
        // A using declaration's binding adds its value's resource first (ForInOfBind in JS.tla).
        const kind = getResourceKind(initializer);
        if (kind !== "normal") words.add(kind === "sync-dispose" ? "dispose" : "asyncDispose");
        bind = letIn(
          [
            defineOperator("env", [], apply("NewDeclarativeEnvironment", ["value.s", "ctx.lex"])),
            defineOperator("iterCtx", [], apply("WithLex", ["ctx", "env.e"])),
            defineOperator(
              "s1",
              [],
              apply("BlockBindNames", [
                "env.s",
                "env.e",
                tuple(names.map(getUnits)),
                getBool(isConst(initializer)),
              ]),
            ),
          ],
          apply("ResultThen", [
            "iterCtx",
            kind === "normal"
              ? pattern("s1", "iterCtx", apply("Val", ["value"]), "env.e")
              : checked(
                  "added",
                  apply("AddDisposableResource", [
                    "s1",
                    "env.e",
                    apply("Val", ["value"]),
                    string(kind),
                  ]),
                  pattern("added.s", "iterCtx", apply("Val", ["value"]), "env.e"),
                ),
          ]),
        );
      } else if (ts.isIdentifier(declaration.name)) {
        bind = apply("ResultThen", [
          "ctx",
          apply("AssignToThen", [
            apply("Val", ["value"]),
            nameReference(declaration.name, scope)("value.s", "ctx"),
          ]),
        ]);
      } else {
        bind = apply("ResultThen", [
          "ctx",
          pattern("value.s", "ctx", apply("Val", ["value"]), "NoEnv"),
        ]);
      }
    } else if (
      ts.isObjectLiteralExpression(initializer) ||
      ts.isArrayLiteralExpression(initializer)
    ) {
      bind = apply("ResultThen", [
        "ctx",
        destructuring(initializer, scope)("value.s", "ctx", apply("Val", ["value"])),
      ]);
    } else {
      bind = apply("ResultThen", [
        "ctx",
        apply("AssignToThen", [
          apply("Val", ["value"]),
          reference(initializer, scope)("value.s", "ctx"),
        ]),
      ]);
    }
    const iterated =
      ts.isVariableDeclarationList(initializer) && isUsing(initializer)
        ? apply("DisposeThen", [
            dot(apply("Val", ["bound"]), "lex"),
            body("bound.s", apply("Val", ["bound"])),
          ])
        : body("bound.s", apply("Val", ["bound"]));
    const next = apply("Call", ["s", "it.next", "it.iterator", tuple([])]);
    // The iteration of the iterator it that the loop holds.
    loops[id - 1].body = letIn(
      [defineOperator("it", [], "loop.it")],
      chain(
        [
          (rest) =>
            checked(
              "r",
              isAwait ? apply("AwaitThen", [next]) : next,
              ifThen(
                apply("~", [apply("IsObject", [apply("Val", ["r"])])]),
                apply("ThrowTypeError", ["r.s"]),
                rest,
              ),
            ),
          (rest) =>
            checked(
              "done",
              apply("IteratorComplete", ["r.s", apply("Val", ["r"])]),
              ifThen(apply("Val", ["done"]), apply("Ok", ["done.s", "v"]), rest),
            ),
          (rest) =>
            checked(
              "value",
              apply("Get", ["done.s", apply("Val", ["r"]), apply("SV", [string("value")])]),
              rest,
            ),
          (rest) => checked("bound", bind, rest, apply("ForInOfClose", ["loop", "it", "bound"])),
        ],
        apply("ForInOfStatementThen", ["ctx", "loop", "it", "v", iterated]),
        4,
      ),
    );
    const expression = value(node.expression, scope);
    // §B.3.5: a var's initializer in a for-in head assigns the var before the head's expression.
    const initialized =
      ts.isVariableDeclarationList(initializer) &&
      initializer.declarations[0]?.initializer !== undefined
        ? declarationList(initializer, scope)
        : undefined;
    const head =
      initialized !== undefined
        ? checked("d", initialized("s", "ctx"), expression("d.s", "ctx"))
        : tdz.length === 0
          ? expression(resetSlots("s", tdzSlots), "ctx")
          : letIn(
              [defineOperator("env", [], apply("NewDeclarativeEnvironment", ["s", "ctx.lex"]))],
              expression(
                apply("BlockBindNames", ["env.s", "env.e", tuple(tdz.map(getUnits)), "FALSE"]),
                apply("WithLex", ["ctx", "env.e"]),
              ),
            );
    const printed = getPrintedText(node.expression);
    return defineCode(
      "ForInOf",
      apply("BreakTargetThen", [
        apply("ForInOfHeadThen", [
          "ctx",
          recordOf([
            ["id", num(id)],
            ["labels", setOf(labels.map(getUnits))],
            ["lets", tuple([])],
            ["it", "Empty"],
            [
              "iterationKind",
              string(isEnumerate ? "enumerate" : isAwait ? "async-iterate" : "iterate"),
            ],
            ["iteratorKind", string(isAwait ? "async" : "sync")],
            ["text", isEnumerate || isAwait || printed === undefined ? "Empty" : getUnits(printed)],
          ]),
          head,
        ]),
      ]),
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
          checked(
            "r",
            list("s", "ctx"),
            next === undefined
              ? apply("Ok", ["r.s", apply("NextIterationValue", ["r.c", "v"])])
              : apply(next, ["r.s", "ctx", apply("NextIterationValue", ["r.c", "v"])]),
            apply("Abrupt", ["r.s", apply("UpdateEmpty", ["r.c", "v"])]),
          ),
        ),
      );
    }
    const order = clauses.map((_, index) => index).filter((index) => index !== defaultIndex);
    let search: Expression =
      defaultIndex === -1
        ? apply("Ok", ["s", "Undefined"])
        : apply(runs[defaultIndex], ["s", "ctx", "Undefined"]);
    for (let position = order.length - 1; position >= 0; position--) {
      const index = order[position];
      const clause = clauses[index] as ts.CaseClause;
      const selector = value(clause.expression, scope);
      const rest = define("CaseSearch", ["s", "ctx", "input"], search);
      search = checked(
        "r",
        selector("s", "ctx"),
        ifThen(
          apply("IsStrictlyEqual", ["input", apply("Val", ["r"])]),
          apply(runs[index], ["r.s", "ctx", "Undefined"]),
          apply(rest, ["r.s", "ctx", "input"]),
        ),
      );
    }
    const first = define("CaseSearch", ["s", "ctx", "input"], search);
    const discriminant = value(node.expression, scope);
    const declarations = getLexicalDeclarations(
      clauses.flatMap((clause) => [...clause.statements]),
      true,
    );
    const declared = blockDeclarations(declarations, scope);
    const evaluated = discriminant("s", "ctx");
    if (!hasBound(declarations, scope)) {
      return defineCode(
        "Switch",
        checked(
          "r",
          evaluated,
          apply("BreakTargetThen", [
            apply(first, [declared("r.s", "ctx"), "ctx", apply("Val", ["r"])]),
          ]),
        ),
      );
    }
    return defineCode(
      "Switch",
      checked(
        "r",
        evaluated,
        letIn(
          [defineOperator("env", [], apply("NewDeclarativeEnvironment", ["r.s", "ctx.lex"]))],
          apply("BreakTargetThen", [
            apply(first, [
              declared("env.s", apply("WithLex", ["ctx", "env.e"])),
              apply("WithLex", ["ctx", "env.e"]),
              apply("Val", ["r"]),
            ]),
          ]),
        ),
      ),
    );
  };

  // The try statement (§14.15).
  const tryStatement = (node: ts.TryStatement, scope: Scope): Code => {
    const tryBlock = block(node.tryBlock.statements, scope);
    const clause = node.catchClause;
    const steps: Step[] = [letStep(["r", tryBlock("s", "ctx")])];
    if (clause !== undefined) {
      const catchBlock = block(clause.block.statements, scope);
      const parameter = clause.variableDeclaration;
      const slot = parameter === undefined ? undefined : scope.locals?.slots.get(parameter.name);
      const handler =
        parameter === undefined
          ? catchBlock("r.s", "ctx")
          : slot !== undefined
            ? catchBlock(dot(apply("LocalInitialize", ["r.s", num(slot), "r.c.value"]), "s"), "ctx")
            : letIn(
                [
                  defineOperator("env", [], apply("NewCatchEnvironment", ["r.s", "ctx.lex"])),
                  defineOperator("cctx", [], apply("WithLex", ["ctx", "env.e"])),
                  defineOperator(
                    "b",
                    [],
                    binding(parameter.name, scope)(
                      apply("BlockBindNames", [
                        "env.s",
                        "env.e",
                        tuple(getBoundNames(parameter.name).map(getUnits)),
                        "FALSE",
                      ]),
                      "cctx",
                      "r.c.value",
                      "env.e",
                    ),
                  ),
                ],
                ifThen(apply("IsAbrupt", ["b"]), "b", catchBlock("b.s", "cctx")),
              );
      steps.push(letStep(["c", ifThen(apply("=", ["r.c.type", string("throw")]), handler, "r")]));
    } else steps.push(letStep(["c", "r"]));
    return defineCode(
      "Try",
      chain(
        steps,
        node.finallyBlock === undefined
          ? apply("UpdateEmptyThen", ["Undefined", "c"])
          : apply("TryFinallyThen", [
              "c.c",
              block(node.finallyBlock.statements, scope)("c.s", "ctx"),
            ]),
      ),
    );
  };

  // ScriptEvaluation (§16.1.6) with GlobalDeclarationInstantiation (§16.1.7).
  const script = (sourceFile: ts.SourceFile) => {
    const statements = sourceFile.statements;
    const isStrict = hasUseStrict(statements);
    const scope: Scope = { isStrict, isClassBody: false, isAsyncGenerator: false };
    const item = statements.find(isModuleItem);
    if (item !== undefined) {
      throw new TlaTypeScriptError("tla-ts can't compile a module as a script", item);
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
    const steps: Step[] = [
      letStep(["env", "s.globalEnv"]),
      (rest) =>
        ifThen(
          exists(
            [boundIn("n", setOf([...lexicalNames, ...dedupe(varScoped.names)].map(getUnits)))],
            apply("HasLexicalDeclaration", ["s", "env", "n"]),
          ),
          apply("ThrowError", ["s", string("SyntaxError")]),
          rest,
        ),
      (rest) =>
        checked(
          "restricted",
          apply("AnyRestrictedGlobal", ["s", "env", tuple(lexicalNames.map(getUnits))]),
          ifThen(
            apply("Val", ["restricted"]),
            apply("ThrowError", ["restricted.s", string("SyntaxError")]),
            rest,
          ),
        ),
      (rest) =>
        checked(
          "fnCheck",
          apply("CheckGlobalNames", [
            "restricted.s",
            "env",
            tuple([...functionNames].reverse().map(getUnits)),
            "TRUE",
          ]),
          rest,
        ),
      (rest) =>
        checked(
          "varCheck",
          apply("CheckGlobalNames", [
            "fnCheck.s",
            "env",
            tuple(declaredVarNames.map(getUnits)),
            "FALSE",
          ]),
          rest,
        ),
    ];
    // Step 12 (§B.3.2.2): outside strict mode, var bindings for the block functions that the
    // global object can take.
    const hoisted = isStrict ? [] : getHoistableFunctions(statements);
    if (hoisted.length > 0) {
      steps.push((rest) =>
        checked(
          "hoist",
          apply("HoistGlobalFunctions", [
            "varCheck.s",
            "env",
            tuple(
              hoisted.map((declaration) =>
                recordOf([
                  ["name", getUnits(declaration.name?.text ?? "*default*")],
                  ["site", num(getSite(declaration))],
                ]),
              ),
            ),
            setOf([...functionNames, ...declaredVarNames].map(getUnits)),
          ]),
          rest,
        ),
      );
    }
    let state = hoisted.length > 0 ? "hoist.s" : "varCheck.s";
    lexical.forEach((declaration, index) => {
      const created = apply("CreateGlobalLexicalNames", [
        state,
        "env",
        tuple(declaration.names.map(getUnits)),
        getBool(declaration.isConst),
      ]);
      steps.push((rest) => checked(`x${index + 1}`, created, rest));
      state = `x${index + 1}.s`;
    });
    functions.forEach((declaration, index) => {
      const instantiate = instantiateFunction(declaration, scope);
      const instantiated = instantiate(state, apply("ScriptContext", ["s"]));
      steps.push(letStep([`g${index + 1}`, instantiated]), (rest) =>
        checked(
          `h${index + 1}`,
          apply("CreateGlobalFunctionBinding", [
            `g${index + 1}.s`,
            "env",
            getUnits(declaration.name?.text ?? "default"),
            apply("Val", [`g${index + 1}`]),
            "FALSE",
          ]),
          rest,
        ),
      );
      state = `h${index + 1}.s`;
    });
    const varState = state;
    steps.push((rest) =>
      checked(
        "i",
        apply("CreateGlobalVars", [varState, "env", tuple(declaredVarNames.map(getUnits))]),
        rest,
      ),
    );
    return define(
      "Script",
      ["s"],
      chain(steps, statementList(statements, scope)("i.s", apply("ScriptContext", ["i.s"]))),
    );
  };

  // The files of a module's specifiers, as a function from each specifier's code units.
  const getTargets = (file: ProgramFile) =>
    file.targets.size === 0
      ? tuple([])
      : [...file.targets]
          .map((target) => parenthesized(apply(":>", [getUnits(target[0]), num(target[1])])))
          .reduce((left, right) => apply("@@", [left, right]));
  const getNames = (file: ProgramFile) => setOf((file.names ?? []).map(getUnits));
  // The error that Node's resolution throws for each specifier that only an import() of the file
  // requests, which the host's code for import() throws, as a function from each specifier's code
  // units.
  const getFailures = (file: ProgramFile) => {
    const failures = [...(file.failures ?? [])].filter(
      (failure) => file.targets.get(failure[0]) === 0,
    );
    return failures.length === 0
      ? tuple([])
      : failures
          .map((failure) =>
            parenthesized(
              apply(":>", [
                getUnits(failure[0]),
                recordOf([
                  ["name", getUnits(failure[1].name)],
                  ["code", getUnits(failure[1].code)],
                  ["message", getUnits(failure[1].message)],
                  ["hasUrl", getBool(failure[1].url !== undefined)],
                  ["url", getUnits(failure[1].url ?? "")],
                ]),
              ]),
            ),
          )
          .reduce((left, right) => apply("@@", [left, right]));
  };

  // A Source Text Module Record's fields that ParseModule (§16.2.1.7.1) reads of the module's code,
  // as JS.tla's ImportEntries, ExportEntries, ModuleRequests, and ModuleRequestPhases give them, the
  // file of each request, and the module's body, which RunBody runs; and the declarations that
  // InitializeEnvironment (§16.2.1.7.3.1) instantiates once the module binds its imports.
  const moduleCode = (file: ProgramFile, number: number) => {
    const statements = file.sourceFile.statements;
    const scope: Scope = { isStrict: true, isClassBody: false, isAsyncGenerator: false };
    // ModuleRequest (§16.2.1.4), with the attributes of its with clause (WithClauseToAttributes,
    // §16.2.2.4), a function from each key to its value, and its text, by which requests that
    // read alike are one.
    const getRequest = (node: ts.ImportDeclaration | ts.ExportDeclaration) => {
      const specifier = node.moduleSpecifier;
      if (specifier === undefined || !ts.isStringLiteral(specifier)) return undefined;
      if (!file.targets.has(specifier.text)) {
        throw new TlaTypeScriptError(`tla-ts can't load the module ${specifier.text}`, node);
      }
      const attributes = (node.attributes?.elements ?? []).map((element) =>
        ts.isStringLiteral(element.value)
          ? parenthesized(apply(":>", [getUnits(element.name.text), getUnits(element.value.text)]))
          : undefined,
      );
      if (attributes.some((attribute) => attribute === undefined)) {
        throw new TlaTypeScriptError("tla-ts can't read this import attribute", node);
      }
      const request = recordOf([
        ["specifier", getUnits(specifier.text)],
        [
          "attributes",
          attributes.length === 0
            ? "NoAttributes"
            : attributes
                .flatMap((attribute) => attribute ?? [])
                .reduce((left, right) => apply("@@", [left, right])),
        ],
      ]);
      return { request, text: printCodeExpression(request) };
    };
    const imports: Expression[] = [];
    const importedNames: string[] = [];
    const exports: Expression[] = [];
    const requests: { request: Expression; text: string }[] = [];
    for (const statement of statements) {
      if (
        ts.isImportEqualsDeclaration(statement) ||
        (ts.isExportAssignment(statement) && statement.isExportEquals === true)
      ) {
        throw new TlaTypeScriptError(
          "tla-ts can't compile TypeScript's CommonJS syntax to JS.tla",
          statement,
        );
      }
      const clause = ts.isImportDeclaration(statement) ? statement.importClause : undefined;
      if (ts.isImportDeclaration(statement)) {
        const request = getRequest(statement);
        if (request === undefined) continue;
        requests.push(request);
        if (clause?.phaseModifier !== undefined) {
          throw new TlaTypeScriptError(
            "tla-ts can't import a module's source or defer it yet",
            statement,
          );
        }
        const getEntry = (importName: Expression, localName: string) => {
          importedNames.push(localName);
          return recordOf([
            ["request", request.request],
            ["isNamespace", "FALSE"],
            ["isSource", "FALSE"],
            ["importName", importName],
            ["localName", getUnits(localName)],
          ]);
        };
        if (clause?.name !== undefined)
          imports.push(getEntry(getUnits("default"), clause.name.text));
        const bindings = clause?.namedBindings;
        if (bindings !== undefined && ts.isNamespaceImport(bindings)) {
          importedNames.push(bindings.name.text);
          imports.push(
            recordOf([
              ["request", request.request],
              ["isNamespace", "TRUE"],
              ["isSource", "FALSE"],
              ["isDeferred", "FALSE"],
              ["importName", tuple([])],
              ["localName", getUnits(bindings.name.text)],
            ]),
          );
        }
        if (bindings !== undefined && ts.isNamedImports(bindings)) {
          bindings.elements.forEach((element) =>
            imports.push(
              getEntry(getUnits((element.propertyName ?? element.name).text), element.name.text),
            ),
          );
        }
        continue;
      }
      if (ts.isExportDeclaration(statement)) {
        const request = getRequest(statement);
        if (request !== undefined) requests.push(request);
        const clause = statement.exportClause;
        // An export entry of the request, which a statement with a clause has.
        const getExportEntry = (exportName: Expression, kind: string, importName: Expression) =>
          apply("ExportEntry", [
            exportName,
            request?.request ?? "Empty",
            string(kind),
            importName,
            tuple([]),
          ]);
        if (request === undefined && clause !== undefined && ts.isNamedExports(clause)) {
          clause.elements.forEach((element) =>
            exports.push(
              apply("LocalExport", [
                getUnits(element.name.text),
                getUnits((element.propertyName ?? element.name).text),
              ]),
            ),
          );
        } else if (clause === undefined) {
          exports.push(getExportEntry(tuple([]), "star", tuple([])));
        } else if (ts.isNamespaceExport(clause)) {
          exports.push(getExportEntry(getUnits(clause.name.text), "namespace", tuple([])));
        } else {
          clause.elements.forEach((element) =>
            exports.push(
              getExportEntry(
                getUnits(element.name.text),
                "name",
                getUnits((element.propertyName ?? element.name).text),
              ),
            ),
          );
        }
        continue;
      }
      if (ts.isExportAssignment(statement)) {
        exports.push(apply("LocalExport", [getUnits("default"), getUnits("*default*")]));
        continue;
      }
      if (!isExported(statement)) continue;
      if (ts.isVariableStatement(statement)) {
        getDeclaredNames(statement.declarationList).forEach((name) =>
          exports.push(apply("LocalExport", [getUnits(name), getUnits(name)])),
        );
      } else if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
        const name = getDeclaredName(statement);
        exports.push(
          apply("LocalExport", [
            getUnits(hasModifier(statement, ts.SyntaxKind.DefaultKeyword) ? "default" : name),
            getUnits(name),
          ]),
        );
      } else {
        throw new TlaTypeScriptError(
          `tla-ts can't export ${ts.SyntaxKind[statement.kind]} from a module to JS.tla`,
          statement,
        );
      }
    }
    // LexicallyScopedDeclarations (§16.2.1.4) of the module: its let, const, class, and function
    // declarations, and *default* for a default export of an expression.
    const lexical = statements.flatMap((statement): LexicalDeclaration[] =>
      ts.isFunctionDeclaration(statement)
        ? [
            {
              names: [getDeclaredName(statement)],
              nodes: [statement],
              isConst: false,
              fn: statement,
            },
          ]
        : ts.isClassDeclaration(statement)
          ? [
              {
                names: [getDeclaredName(statement)],
                nodes: [statement],
                isConst: false,
                fn: undefined,
              },
            ]
          : ts.isExportAssignment(statement)
            ? [{ names: ["*default*"], nodes: [statement], isConst: false, fn: undefined }]
            : getLexicalDeclarations([statement], false),
    );
    const varNames = dedupe(
      getVarScoped(statements.filter((statement) => !ts.isFunctionDeclaration(statement))).names,
    );
    moduleNames = new Set([
      ...varNames,
      ...lexical.flatMap((declaration) => declaration.names),
      ...importedNames,
    ]);
    const declared = lexical.flatMap((declaration) =>
      declaration.fn === undefined
        ? []
        : [
            {
              instantiate: instantiateFunction(declaration.fn, scope),
              mode: "initialize" as const,
              name: declaration.names[0],
              slot: 0,
            },
          ],
    );
    const declarations = define(
      "ModuleDeclarations",
      ["s", "ctx"],
      chain(
        [
          letStep(
            ["env", "ctx.lex"],
            [
              "s1",
              apply("CreateVarBindings", [
                "s",
                "env",
                tuple(varNames.map(getUnits)),
                "env",
                "FALSE",
                setOf([]),
              ]),
            ],
          ),
          letStep(["s2", createLexicalDeclarations(lexical, "s1", "env")]),
        ],
        apply("Ok", [instantiateDeclarations(declared, "s2", "ctx", "env"), "Empty"]),
      ),
    );
    bodies.push(statementList(statements, scope));
    const seen = new Set<string>();
    const dedupedRequests = requests.filter((request) => {
      const isNew = !seen.has(request.text);
      seen.add(request.text);
      return isNew;
    });
    addDefinition(
      defineOperator(
        `ModuleNode${number}`,
        [],
        recordOf([
          ["file", num(number)],
          ["kind", string("module")],
          ["facade", num(file.facade ?? 0)],
          ["body", recordOf([["code", num(bodies.length)]])],
          ["hasTopLevelAwait", getBool(hasTopLevelAwait(file.sourceFile))],
          ["imports", tuple(imports)],
          ["exports", tuple(exports)],
          ["requests", tuple(dedupedRequests.map((request) => request.request))],
          [
            "phases",
            tuple(
              dedupedRequests.map((request) =>
                recordOf([
                  ["request", request.request],
                  ["phase", string("evaluation")],
                ]),
              ),
            ),
          ],
          ["targets", getTargets(file)],
          ["names", getNames(file)],
          ["failures", getFailures(file)],
        ]),
      ),
    );
    return declarations;
  };

  // A CommonJS module's code: the function that Node wraps the module's code in, which RequireFile
  // calls with the module's exports, require, module, __filename and __dirname, as Node's loader
  // does (lib/internal/modules/cjs/loader.js). Its code may not read the wrapper's arguments
  // object, whose callee is the runtime's function rather than Node's.
  const commonJsCode = (file: ProgramFile, number: number) => {
    const directory = file.path.slice(0, Math.max(file.path.lastIndexOf("/"), 1));
    const addNode = (code: Operand) =>
      addDefinition(
        defineOperator(
          `ModuleNode${number}`,
          [],
          recordOf([
            ["file", num(number)],
            ["kind", string("commonjs")],
            ["code", code],
            ["filename", getUnits(file.path)],
            ["dirname", getUnits(directory)],
            ["targets", getTargets(file)],
            ["names", getNames(file)],
            ["failures", getFailures(file)],
            ["exportNames", tuple(file.exportNames.map(getUnits))],
            ["missing", setOf([...(file.missingRequires ?? [])].map(getUnits))],
          ]),
        ),
      );
    // A module with an early error has no code, which Node fails to compile where it runs it.
    if (file.isRejected === true) {
      addNode("None");
      return undefined;
    }
    const statement = file.sourceFile.statements[0];
    const wrapper =
      ts.isExpressionStatement(statement) && ts.isParenthesizedExpression(statement.expression)
        ? statement.expression.expression
        : undefined;
    if (wrapper === undefined || !ts.isFunctionExpression(wrapper)) {
      throw new TlaTypeScriptError("tla-ts can't read this CommonJS module", statement);
    }
    if (getMayUseArguments(wrapper.body)) {
      throw new TlaTypeScriptError(
        "tla-ts can't read the arguments of the function that Node wraps a CommonJS module in",
        statement,
      );
    }
    // The entry's bindings that a model's steps read, which its environment holds.
    if (number === 1) keptByWrapper.set(wrapper, internalKeys);
    const code = functionCode(
      { node: wrapper, parameters: wrapper.parameters, body: wrapper.body, kind: "normal" },
      { isStrict: false, isClassBody: false, isAsyncGenerator: false },
    );
    addNode(code);
    return undefined;
  };

  const entry = files[0];
  // A script that calls import() loads the files of its specifiers.
  if (entry.kind === "script" && files.length > 1) {
    addDefinition(
      defineOperator(
        "ModuleNode1",
        [],
        recordOf([
          ["file", num(1)],
          ["kind", string("script")],
          ["targets", getTargets(entry)],
          ["names", getNames(entry)],
          ["failures", getFailures(entry)],
        ]),
      ),
    );
  }
  // A JSON file's node: its text without a byte order mark, which Node strips, where it's valid.
  const jsonCode = (file: ProgramFile, number: number) => {
    addDefinition(
      defineOperator(
        `ModuleNode${number}`,
        [],
        recordOf([
          ["file", num(number)],
          ["kind", string("json")],
          ["isValid", getBool(file.json !== undefined)],
          ["text", getUnits((file.json ?? "").replace(/^\uFEFF/, ""))],
        ]),
      ),
    );
    return undefined;
  };
  // An ES module with an early error, which Node fails to parse where it loads it.
  const rejectedCode = (number: number) => {
    addDefinition(
      defineOperator(
        `ModuleNode${number}`,
        [],
        recordOf([
          ["file", num(number)],
          ["kind", string("rejected")],
        ]),
      ),
    );
    return undefined;
  };
  // The host's code for import(), the function that NODE_IMPORT is, which SetupHostImport calls.
  const hostCode = (file: ProgramFile, number: number) => {
    const statement = file.sourceFile.statements[0];
    const wrapper =
      ts.isExpressionStatement(statement) && ts.isParenthesizedExpression(statement.expression)
        ? statement.expression.expression
        : undefined;
    if (wrapper === undefined || !ts.isFunctionExpression(wrapper)) {
      throw new TlaTypeScriptError("tla-ts can't read the host's code for import()", statement);
    }
    const code = functionCode(
      { node: wrapper, parameters: wrapper.parameters, body: wrapper.body, kind: "normal" },
      { isStrict: true, isClassBody: false, isAsyncGenerator: false },
    );
    addDefinition(
      defineOperator(
        `ModuleNode${number}`,
        [],
        recordOf([
          ["file", num(number)],
          ["kind", string("host")],
          ["code", code],
        ]),
      ),
    );
    return undefined;
  };
  const moduleDeclarations = files.map((file, index) =>
    file.kind === "host"
      ? hostCode(file, index + 1)
      : file.kind === "module"
        ? file.isRejected === true
          ? rejectedCode(index + 1)
          : moduleCode(file, index + 1)
        : file.kind === "commonjs"
          ? commonJsCode(file, index + 1)
          : file.kind === "json"
            ? jsonCode(file, index + 1)
            : undefined,
  );
  const program =
    entry.kind === "module"
      ? apply("RunModuleNode", ["s", apply("ModuleNode", [num(1)])])
      : entry.kind === "commonjs"
        ? apply("RequireFile", ["s", num(1), num(0)])
        : apply(script(entry.sourceFile), ["s"]);
  // A dispatch on an id to its arms, or, where it has none, a stop with the message.
  const defineDispatch = (
    name: string,
    params: string[],
    id: string,
    count: number,
    getArm: (id: number) => Operand,
    message: string,
  ) =>
    addDefinition(
      defineOperator(
        name,
        params,
        onLine(
          toExpression(count === 0 ? getUnreachable(message) : getDispatch(id, 1, count, getArm)),
          2,
        ),
      ),
    );
  defineDispatch(
    "InstantiateCode",
    ["s", "ctx", "id"],
    "id",
    instantiations.length,
    (code) => instantiations[code - 1]("s", "ctx"),
    "tla-ts can't instantiate a function the program doesn't declare",
  );
  defineDispatch(
    "CallCode",
    ["s", "f", "ctx", "args", "id"],
    "id",
    codes.length,
    (code) => apply(`Code${code}`, ["s", "f", "ctx", "args"]),
    "tla-ts can't call a function the program doesn't define",
  );
  defineDispatch(
    "RunBody",
    ["s", "ctx", "body"],
    "body.code",
    bodies.length,
    (number) => bodies[number - 1]("s", "ctx"),
    "tla-ts can't run a generator the program doesn't define",
  );
  codes.forEach((code) => {
    if (code.definition !== undefined) addDefinition(code.definition);
  });
  defineDispatch(
    "LoopIteration",
    ["s", "ctx", "loop", "v"],
    "loop.id",
    loops.length,
    (id) => apply(`Loop${id}`, ["s", "ctx", "loop", "v"]),
    "tla-ts can't run a loop the program doesn't have",
  );
  loops.forEach((current) => {
    if (current.body !== undefined) {
      addDefinition(
        defineOperator(`Loop${current.id}`, ["s", "ctx", "loop", "v"], onLine(current.body, 2)),
      );
    }
  });
  defineDispatch(
    "ModuleNode",
    ["id"],
    "id",
    files.length === 1 && entry.kind === "script" ? 0 : files.length,
    (number) => `ModuleNode${number}`,
    "tla-ts can't load a module the program doesn't have",
  );
  defineDispatch(
    "ModuleDeclarations",
    ["s", "ctx", "node"],
    "node.file",
    moduleDeclarations.length,
    (number) => {
      const declarations = moduleDeclarations[number - 1];
      return declarations === undefined
        ? getUnreachable("tla-ts can't link a module the program doesn't have")
        : apply(declarations, ["s", "ctx"]);
    },
    "",
  );
  addDefinition(defineOperator("Program", ["s"], program));
  const sources = files.map((file) =>
    getSourceString(
      (sourceSegments.get(file.sourceFile) ?? [])
        .map((segment) => file.sourceFile.text.slice(segment.start, segment.end))
        .join(""),
    ),
  );
  // The position in its file of the unit at an offset of the source text that t gives, which TLA+
  // reads as t[2] + (offset - 1), as - binds tighter than +.
  const getSourcePosition = (offset: string) =>
    apply("+", [subscript("t", [num(2)]), apply("-", [offset, num(1)])]);
  const sourceDefinitions = [
    ...sources.map((source, position) =>
      defineOperator(`SourceText${position + 1}`, [], string(source.value)),
    ),
    defineOperator("SourcePatches", [], tuple(sources.map((source) => getPatches(source.patches)))),
    defineOperator(
      "SourceUnits",
      ["t"],
      onLine(
        withInnerLines(
          letIn(
            [
              defineOperator(
                "u",
                [],
                apply("StringUnits", [
                  apply("SubSeq", [
                    subscript(tuple(sources.map((_, position) => `SourceText${position + 1}`)), [
                      subscript("t", [num(1)]),
                    ]),
                    subscript("t", [num(2)]),
                    subscript("t", [num(3)]),
                  ]),
                ]),
              ),
              onLine(
                defineOperator("p", [], subscript("SourcePatches", [subscript("t", [num(1)])])),
                6,
              ),
            ],
            functionOf(
              [boundIn("i", apply("DOMAIN", ["u"]))],
              ifThen(
                apply("\\in", [getSourcePosition("i"), apply("DOMAIN", ["p"])]),
                subscript("p", [getSourcePosition("i")]),
                subscript("u", ["i"]),
              ),
            ),
          ),
          2,
        ),
        2,
      ),
    ),
  ];
  return {
    definitions: [
      ...sourceDefinitions.map((tree) => ({ name: tree.name, arity: tree.params.length, tree })),
      ...definitions,
    ],
    regions,
    words,
    identifiers,
    isAsync,
  };
};
