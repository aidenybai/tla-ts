import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../../errors";
import { isProcessDeclared } from "../common-js";
import type { GeneratedDefinition } from "./library";
import { getLocals, type Locals } from "./locals";
import { getPatches, getSourceString } from "./units";

// Specializes ESCore's evaluation rules to a program: each syntax node gives the TLA+ that ESCore's
// Evaluate rule for its kind leaves once the node is known, with the evaluation of each child in
// place of Evaluate(s, ctx, child). The runtime values still go through ESCore's operators, so
// only what the syntax says folds away.

// TLA+ text of an evaluation in the state and context that the two expressions give, whose result
// is a record [s, c].
interface Code {
  (state: string, context: string): string;
}

// TLA+ text of ArrayAccumulation into an array from an index, in a state and the context ctx,
// whose result is a record [s, c] with the next index.
interface ElementsCode {
  (state: string, array: string, index: string): string;
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
  // The names that Node's ModuleWrap of a CommonJS module exports, which its lexer finds.
  exportNames: readonly string[];
  // The file of an ES module's facade, which a require of it gives the namespace of.
  facade?: number;
  // Whether the file has an early error, for which Node throws a SyntaxError where it loads it.
  isRejected?: boolean;
}

// A declaration at the top level of the program's first file, with the definitions of the program's
// code that it compiles to, which a host shows beside it.
export interface ProgramRegion {
  names: string[];
  definitions: string[];
}

export interface SpecializedProgram {
  definitions: GeneratedDefinition[];
  regions: ProgramRegion[];
  words: Set<string>;
  // The names the program's identifiers resolve, which may be the global object's.
  identifiers: Set<string>;
  // Whether the program has an async function, whose awaits queue jobs.
  isAsync: boolean;
}

const getUnits = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

const getStr = (text: string) => `Str(${getUnits(text)})`;

// A state that no code names, which a code's text holds where the code reads its state.
const NO_STATE = "NoState";

// The value of code that evaluates to the same value in every state, if it does.
const getConstant = (code: Code) => {
  const text = code(NO_STATE, "ctx");
  const match = /^Ok\(NoState, (.*)\)$/s.exec(text);
  return match === null || match[1].includes(NO_STATE) || /\bctx\b/.test(match[1])
    ? undefined
    : match[1];
};

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

// The kind of the resources that a declaration's bindings add (DeclarationKind in ESCore).
const getResourceKind = (list: ts.VariableDeclarationList) =>
  (list.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.AwaitUsing
    ? "async-dispose"
    : isUsing(list)
      ? "sync-dispose"
      : "normal";

// Whether a statement list declares resources in the environment that it runs in (HasUsing in
// ESCore).
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
const getLex = (context: string) =>
  /^[\w.]+(?:\(.*\))?$/s.test(context) ? `${context}.lex` : `(${context}).lex`;

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
  getArm: (id: number) => string,
): string => {
  if (low === high) return getArm(low);
  const middle = Math.floor((low + high) / 2);
  return `IF ${id} <= ${middle} THEN ${getDispatch(id, low, middle, getArm)} ELSE ${getDispatch(id, middle + 1, high, getArm)}`;
};

// The name that a function is reached by, other than as a value where it's written: a declaration's
// or method's, or that of the property or variable a function expression initializes. An accessor
// runs wherever its property is read or written, by keys that ESCore may compute, as an array's
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

// Whether a function is a generator, async, or both, as ESCore's function kinds name it.
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

// The productions of a function declaration or expression of each flavor, as ESCore names them.
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

// Specializes ESCore to a script. A function reached only by a name that the script never writes
// elsewhere, and that ESCore's own operators don't use as a key, has a body that stops the check,
// as a call to it can only come by reflection.
export const specialize = (
  files: readonly ProgramFile[],
  internalKeys: ReadonlySet<string>,
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
  // Whether the program's process is Node's, whose env a module's code reads, where no file
  // declares process and a module runs in Node's context, whose global object has it.
  const isHostProcess =
    typeof process !== "undefined" &&
    files[0].kind !== "script" &&
    !files.some((file) => isProcessDeclared(file.sourceFile));
  // Each file's number, from 1, and where its text starts in the program's texts, one after
  // another, which makes the sites of the program's nodes distinct.
  const fileNumbers = new Map(files.map((file, index) => [file.sourceFile, index + 1]));
  const fileStarts = new Map(
    files.map((file, index) => [
      file.sourceFile,
      files.slice(0, index).reduce((start, other) => start + other.sourceFile.text.length, 0),
    ]),
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
  const definitions: GeneratedDefinition[] = [];
  const words = new Set<string>();
  const identifiers = new Set<string>();
  const codes: { id: number; body: string }[] = [];
  // The bodies of the generators, which RunBody runs by their number.
  const bodies: Code[] = [];
  let isAsync = false;
  const loops: { id: number; body: string }[] = [];
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
    return offset === undefined ? "<<>>" : getPosition(node, offset);
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
    return `<<${file}, ${position.line + 1}, ${position.character + 1 - wrapper}>>`;
  };

  // A node's source text, as its file's number and the range of the file's text it spans, which
  // SourceUnits makes code units of when a program reads it.
  // The call or new of a callee that V8 names by its source text where the callee isn't callable,
  // as a name or a chain of property names, and otherwise the call that ESCore's message leaves
  // to the host.
  // The text that V8 prints of an expression in a message, a name or a chain of property names,
  // or undefined for another.
  const getPrintedText = (node: ts.Expression) =>
    /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(node.getText()) &&
    !/^super\b/.test(node.getText())
      ? node.getText()
      : undefined;
  const getNamedCall = (callee: ts.Expression, call: string, args: string) =>
    getPrintedText(callee) !== undefined
      ? `${call === "CallArgumentsAt" ? "CallNamedAt" : "NewNamedAt"}(${args}, ${getUnits(callee.getText())})`
      : `${call}(${args})`;

  // A function's or a class's source text, which starts at async where the code says it, after
  // the modifiers that ECMAScript's syntax leaves out of it, such as static and export, and the
  // ones whose text Node strips, such as private.
  const getSourceText = (node: ts.Node) => {
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
    return `<<${fileNumbers.get(node.getSourceFile())}, ${start + 1}, ${node.getEnd()}>>`;
  };

  // A function's code record, which the module evaluates once, as it has no parameters.
  // A bare code runs without the environment that a call makes for it (OrdinaryCallRun).
  const defineRecord = (
    id: number,
    isStrict: boolean,
    length: number,
    sourceText: string,
    naming: string,
    flavor: Flavor = "normal",
    isBare = false,
  ) => {
    definitions.push({
      name: `CodeRecord${id}`,
      arity: 0,
      text: `CodeRecord${id} == [id |-> ${id}, strict |-> ${getBool(isStrict)}, kind |-> "${flavor}", length |-> ${length}, sourceText |-> ${sourceText}, naming |-> ${naming}, bare |-> ${getBool(isBare)}]`,
    });
    return `CodeRecord${id}`;
  };

  // How V8 names a function in a stack trace: by the name its literal has (sfi), or, without one,
  // the name its parser infers, Empty where tla-ts can't tell; by the name a computed key gave it
  // as it ran, which its name property holds; and a class's initializers by names of their own.
  const getNaming = (node: ts.Node, kind: string, literal: LiteralName) => {
    if (literal.isComputed) return `[naming |-> "runtime", sfi |-> <<>>, inferred |-> Empty]`;
    if (literal.name !== undefined && literal.name !== "") {
      return `[naming |-> "${kind}", sfi |-> ${getUnits(literal.name)}, inferred |-> Empty]`;
    }
    const inferred = getInferredName(node);
    return `[naming |-> "anonymous", sfi |-> <<>>, inferred |-> ${inferred === undefined ? "Empty" : getUnits(inferred)}]`;
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

  // The lexical bindings of a scope's declarations, which CreateLexicalDeclarations of the runtime
  // makes in their order, in a loop rather than in calls nested as deep as they are many.
  const createLexicalDeclarations = (
    declarations: readonly { names: readonly string[]; isConst: boolean }[],
    state: string,
    environment: string,
  ) =>
    declarations.length === 0
      ? state
      : `CreateLexicalDeclarations(${state}, ${environment}, <<${declarations
          .map(
            (declaration) =>
              `[names |-> ${getSequence(declaration.names.map(getUnits))}, isConst |-> ${getBool(declaration.isConst)}]`,
          )
          .join(", ")}>>, 1)`;

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
    state: string,
    context: string,
    environment: string,
  ) => {
    if (entries.length === 0) return state;
    const records = entries.map((entry) => {
      instantiations.push(entry.instantiate);
      return `[code |-> ${instantiations.length}, mode |-> "${entry.mode}", name |-> ${getUnits(entry.name)}, slot |-> ${entry.slot}]`;
    });
    return `InstantiateDeclarations(${state}, ${context}, ${environment}, <<${records.join(", ")}>>, 1)`;
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
          `ResolveBinding(${state}, ${context}, ${getUnits(node.text)}, ${getBool(scope.isStrict)})`
      : (state) =>
          `Ok(${state}, LocalReference(${slot}, ${getBool(scope.locals?.constant[slot - 1] ?? false)}, ${getUnits(node.text)}, ${getBool(scope.isStrict)}))`;
  };

  // The names of those that nodes declare that an environment holds rather than a frame.
  const getBound = (names: readonly string[], nodes: readonly ts.Node[], scope: Scope) =>
    names.filter((_, index) => scope.locals?.slots.get(nodes[index]) === undefined);

  // A state whose frame holds no value yet at slots, as a binding is before its declaration runs.
  const resetSlots = (state: string, slots: readonly number[]) =>
    slots.length === 0
      ? state
      : `[${state} EXCEPT ${slots.map((slot) => `!.frame[${slot}] = Empty`).join(", ")}]`;

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

  // ArgumentListEvaluation (§13.3.8.1): a result whose value is the list of arguments. An
  // argument whose evaluation is a value whatever the state, such as a literal's, is that value in
  // the list, and a list of such arguments needs no definition of its own.
  const argumentList = (args: readonly ts.Expression[], scope: Scope): Code => {
    if (args.length === 0) return (state) => `Ok(${state}, <<>>)`;
    const steps: string[] = [];
    let state = "s";
    const values: string[] = [];
    args.forEach((argument, index) => {
      const name = `a${index + 1}`;
      if (ts.isSpreadElement(argument)) {
        steps.push(
          `LET ${name} == ${value(argument.expression, scope)(state, "ctx")} IN IF IsAbrupt(${name}) THEN ${name} ELSE`,
          `LET ${name}i == GetIteratorSpread(${name}.s, Val(${name})) IN IF IsAbrupt(${name}i) THEN ${name}i ELSE`,
          `LET ${name}l == IteratorToList(${name}i.s, Val(${name}i), <<>>) IN IF IsAbrupt(${name}l) THEN ${name}l ELSE`,
        );
        values.push(`Val(${name}l)`);
        state = `${name}l.s`;
        return;
      }
      const code = value(argument, scope);
      const constant = getConstant(code);
      if (constant !== undefined) {
        values.push(`<<${constant}>>`);
        return;
      }
      steps.push(`LET ${name} == ${code(state, "ctx")} IN IF IsAbrupt(${name}) THEN ${name} ELSE`);
      values.push(`<<Val(${name})>>`);
      state = `${name}.s`;
    });
    // The list, with runs of single values as one sequence.
    const list = values.join(" \\o ").replace(/>> \\o <</g, ", ");
    if (steps.length === 0) return (current) => `Ok(${current}, ${list})`;
    return defineCode("Arguments", `${steps.join("\n  ")}\n  Ok(${state}, ${list})`);
  };

  // Function calls (§13.3.6) and super calls (§13.3.7.1).
  const call = (node: ts.CallExpression, scope: Scope): Code => {
    const args = argumentList(node.arguments, scope);
    if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
      return defineCode(
        "SuperCall",
        `LET thisEnv == GetThisEnvironment(s, ctx.lex) IN SuperCallAt(${getCallSite(node)}, thisEnv, O(s, E(s, thisEnv).fn).proto, E(s, thisEnv).newTarget, ${args("s", "ctx")})`,
      );
    }
    // EvaluateImportCall (§13.3.10.2), whose specifier and options the host takes, as V8 gives
    // them to Node's import, with the file of the code that calls it as the referrer.
    if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      if (!files.some((file) => file.kind === "host")) {
        throw new TlaTypeScriptError("tla-ts can't compile import() outside a module", node);
      }
      const specifier = value(node.arguments[0], scope);
      const options =
        node.arguments.length > 1
          ? value(node.arguments[1], scope)
          : (state: string) => `Ok(${state}, Undefined)`;
      return defineCode(
        "ImportCall",
        `LET r == ${specifier("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE LET o == ${options("r.s", "ctx")} IN IF IsAbrupt(o) THEN o ELSE HostImportCall(o.s, ${fileNumbers.get(node.getSourceFile())}, Val(r), Val(o))`,
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
        `LET r == ${specifier("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE HostImportSourceCall(r.s, Val(r))`,
      );
    }
    const callee = ts.isParenthesizedExpression(node.expression)
      ? node.expression.expression
      : node.expression;
    if (ts.isIdentifier(callee) && callee.text === "eval") {
      throw new TlaTypeScriptError("tla-ts can't run eval", node);
    }
    // A name's this value is undefined (EvaluateCall, §13.3.6.2) but where a with statement's object
    // environment holds it.
    if (ts.isIdentifier(callee) && !hasWithAround(node)) {
      const fn = value(callee, scope);
      const shortCircuit =
        node.questionDotToken === undefined
          ? ""
          : `IF IsNullish(Val(c)) THEN Abrupt(c.s, Completion("nullish", Undefined, Empty)) ELSE `;
      return defineCode(
        "Call",
        `LET c == ${fn("s", "ctx")} IN IF IsAbrupt(c) THEN c ELSE ${shortCircuit}${getNamedCall(node.expression, "CallArgumentsAt", `${getCallSite(node)}, Val(c), Undefined, ${args("c.s", "ctx")}`)}`,
      );
    }
    const base = reference(node.expression, scope);
    const shortCircuit =
      node.questionDotToken === undefined
        ? ""
        : `IF IsNullish(Val(c).f) THEN Abrupt(c.s, Completion("nullish", Undefined, Empty)) ELSE `;
    return defineCode(
      "Call",
      `LET c == CalleeThen(${base("s", "ctx")}) IN IF IsAbrupt(c) THEN c ELSE ${shortCircuit}${getNamedCall(node.expression, "CallArgumentsAt", `${getCallSite(node)}, Val(c).f, Val(c).this, ${args("c.s", "ctx")}`)}`,
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
      const slot = scope.locals?.slots.get(name);
      return slot === undefined
        ? (state, context, bound, env) =>
            `InitializeBoundName(${state}, ${context}, ${getUnits(name.text)}, ${bound}, ${env}, ${strict})`
        : (state, _context, bound) => `LocalInitialize(${state}, ${slot}, ${bound})`;
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
    // A read of process.env.NAME, of Node's process, is the environment's value as the process
    // that compiles has it.
    if (
      isHostProcess &&
      ts.isPropertyAccessExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "env" &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "process"
    ) {
      const variable = process.env[node.name.text];
      return (state) => `Ok(${state}, ${variable === undefined ? "Undefined" : getStr(variable)})`;
    }
    if (ts.isIdentifier(node)) {
      reference(node, scope);
      const slot = scope.locals?.slots.get(node);
      return slot === undefined
        ? (state, context) =>
            `IdentifierValue(${state}, ${getLex(context)}, ${getUnits(node.text)}, ${getBool(scope.isStrict)})`
        : (state) => `LocalValue(${state}, ${slot}, ${getUnits(node.text)})`;
    }
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
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
        `LET r == ${callee("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE ${getNamedCall(node.expression, "NewArgumentsAt", `${getCallSite(node)}, Val(r), ${args("r.s", "ctx")}`)}`,
      );
    }
    if (ts.isMetaProperty(node)) {
      if (node.keywordToken === ts.SyntaxKind.NewKeyword)
        return (state, context) => `Ok(${state}, GetNewTarget(${state}, ${context}))`;
      if (files[(fileNumbers.get(node.getSourceFile()) ?? 1) - 1].kind !== "module") {
        throw new TlaTypeScriptError("tla-ts can't compile import.meta outside a module", node);
      }
      return (state, context) => `EvaluateImportMeta(${state}, ${context}, Empty)`;
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
    // Yield (§15.5.5) and Await (§15.8.5), whose results suspend the body.
    if (ts.isYieldExpression(node)) {
      const operand = node.expression === undefined ? undefined : value(node.expression, scope);
      return defineCode(
        "Yield",
        `${node.asteriskToken === undefined ? "YieldThen" : "YieldStarThen"}(ctx, ${operand === undefined ? "Ok(s, Undefined)" : operand("s", "ctx")})`,
      );
    }
    if (ts.isAwaitExpression(node)) {
      return defineCode("Await", `AwaitThen(${value(node.expression, scope)("s", "ctx")})`);
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
    // GetValue and PutValue each convert the key, as V8 does (§13.15.2).
    const old = `LET old == GetValue(t.s, Val(t)) IN IF IsAbrupt(old) THEN old ELSE`;
    const test = LOGICAL_TESTS.get(operator);
    if (test !== undefined) {
      return defineCode(
        "Assign",
        `${head} ${old} IF ${test("Val(old)")} THEN old ELSE PutValueThen(Val(t), ${assigned("old.s", "ctx")})`,
      );
    }
    const right = value(node.right, scope);
    return defineCode(
      "Assign",
      `${head} ${old} CompoundThen(Val(t), Val(old), "${COMPOUND_OPERATORS.get(operator)}", ${right("old.s", "ctx")})`,
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
        `CallArgumentsAt(${getCallSite(node)}, Val(f), CallThisValue(object.s, Val(r)), Ok(a.s, <<Val(object)>> \\o Val(a)))`,
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
  const arrayLiteral = (node: ts.ArrayLiteralExpression, scope: Scope): Code =>
    defineCode(
      "Array",
      `LET a == ArrayCreate(s, 0, Intrinsic(s, "ArrayPrototype")) IN\n  ArrayLiteralThen(Val(a), ${arrayElements(node.elements, scope, 0)("a.s", "Val(a)", "0")})`,
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
        `LET q == ${first("s", "array", "i")} IN IF IsAbrupt(q) THEN q ELSE ${rest("q.s", "array", "Val(q)")}`,
      );
      return (state, array, index) => `${name}(${state}, ctx, ${array}, ${index})`;
    }
    return (initialState, array, initialIndex) => {
      const steps: string[] = [];
      let state = initialState;
      let staticIndex = start;
      let index = start === undefined ? initialIndex : String(start);
      elements.forEach((element, position) => {
        const name = `e${position + 1}`;
        if (ts.isOmittedExpression(element)) {
          index = staticIndex === undefined ? `${index} + 1` : String(staticIndex + 1);
          staticIndex = staticIndex === undefined ? undefined : staticIndex + 1;
          return;
        }
        if (ts.isSpreadElement(element)) {
          steps.push(
            `LET ${name} == ${value(element.expression, scope)(state, "ctx")} IN IF IsAbrupt(${name}) THEN ${name} ELSE`,
            `LET ${name}i == ${getPrintedText(element.expression) === undefined ? `GetIterator(${name}.s, Val(${name}), "sync")` : `GetIteratorNamed(${name}.s, Val(${name}), ${getUnits(getPrintedText(element.expression) ?? "")})`} IN IF IsAbrupt(${name}i) THEN ${name}i ELSE`,
            `LET ${name}p == SpreadIntoArray(${name}i.s, ${array}, Val(${name}i), ${index}) IN IF IsAbrupt(${name}p) THEN ${name}p ELSE`,
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
          `LET ${name} == ArrayElementResult(${array}, ${key}, ${value(element, scope)(state, "ctx")}) IN IF IsAbrupt(${name}) THEN ${name} ELSE`,
        );
        state = `${name}.s`;
        index = staticIndex === undefined ? `${index} + 1` : String(staticIndex + 1);
        staticIndex = staticIndex === undefined ? undefined : staticIndex + 1;
      });
      return [...steps, `Ok(${state}, ${index})`].join("\n  ");
    };
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
      ? (state) => `Ok(${state}, ${getStr("constructor")})`
      : propertyKey(node.name, scope);
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
      `LET k == ${key("s", "ctx")} IN IF IsAbrupt(k) THEN k ELSE LET f == CodeFunctionCreate(k.s, Intrinsic(k.s, "${FUNCTION_PROTOTYPES[flavor]}"), ${code}, FALSE, ctx.lex, ctx.priv) IN Ok(${flavor === "generator" || flavor === "asyncGenerator" ? `GiveFunctionPrototype(SetFunctionName(MakeMethod(f.s, f.v, home), f.v, Val(k), ${prefix}), "${METHOD_PRODUCTIONS[flavor]}", f.v)` : `SetFunctionName(MakeMethod(f.s, f.v, home), f.v, Val(k), ${prefix})`}, ${record})`,
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
      { isStrict: true, isClassBody: false, isAsyncGenerator: false },
      "O(s, f).slots.initializerName",
    );
    codes[id - 1] = {
      id,
      body: `Code${id}(s, f, ctx, args) ==\n  LET v == ${evaluation("s", "ctx")} IN IF IsAbrupt(v) THEN v ELSE Abrupt(v.s, Completion("return", Val(v), Empty))`,
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
    const name = ts.isArrowFunction(node)
      ? define(
          "Arrow",
          ["s", "ctx", "name"],
          `LET f == CodeFunctionCreate(s, Intrinsic(s, "${prototype}"), ${code}, TRUE, ctx.lex, ctx.priv) IN Ok(SetFunctionName(f.s, f.v, name, <<>>), f.v)`,
        )
      : node.name !== undefined
        ? define(
            "Closure",
            ["s", "ctx", "name"],
            `LET env == NewDeclarativeEnvironment(s, ctx.lex) s1 == CreateImmutableBinding(env.s, env.e, ${getUnits(node.name.text)}, FALSE).s f == CodeFunctionCreate(s1, Intrinsic(s1, "${prototype}"), ${code}, FALSE, env.e, ctx.priv) s2 == GiveFunctionPrototype(SetFunctionName(f.s, f.v, ${getStr(node.name.text)}, <<>>), "${production}", f.v) IN Ok(InitializeBinding(s2, env.e, ${getUnits(node.name.text)}, f.v).s, f.v)`,
          )
        : define(
            "Closure",
            ["s", "ctx", "name"],
            `LET f == CodeFunctionCreate(s, Intrinsic(s, "${prototype}"), ${code}, FALSE, ctx.lex, ctx.priv) IN Ok(GiveFunctionPrototype(SetFunctionName(f.s, f.v, name, <<>>), "${production}", f.v), f.v)`,
          );
    return (state, context, functionName) => `${name}(${state}, ${context}, ${functionName})`;
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
        `LET f == CodeFunctionCreate(s, Intrinsic(s, "${FUNCTION_PROTOTYPES[flavor]}"), ${code}, FALSE, ctx.lex, ctx.priv) IN Ok(GiveFunctionPrototype(SetFunctionName(f.s, f.v, ${getStr(node.name?.text ?? "default")}, <<>>), "${FUNCTION_PRODUCTIONS[flavor]}Declaration", f.v), f.v)`,
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
    codes.push({ id, body: "" });
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
      const steps: string[] = [];
      // Step 19-20: the environment that holds the parameters.
      steps.push(
        !isStrict && hasExpressions
          ? `LET pe == NewDeclarativeEnvironment(s, ctx.lex) env == pe.e s1 == CreateBindings(pe.s, env, ${getSequence(parameterNames.map(getUnits))}, ${getBool(isStrict)}, ${getBool(hasDuplicates)}) IN`
          : `LET env == ctx.lex s1 == CreateBindings(s, env, ${getSequence(parameterNames.filter((name) => !isLocal(name)).map(getUnits))}, ${getBool(isStrict)}, ${getBool(hasDuplicates)}) IN`,
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
      }
      // Steps 24-26: each parameter bound to its argument, or its initializer's value.
      const paramContext = "[ctx EXCEPT !.lex = env]";
      let state = argumentsNeeded ? "s2" : "s1";
      parameters.forEach((parameter, index) => {
        if (
          ts.isIdentifier(parameter.name) &&
          parameter.initializer === undefined &&
          parameter.dotDotDotToken === undefined
        ) {
          steps.push(
            `LET b${index + 1} == ${binding(parameter.name, scope)(state, paramContext, `Arg(args, ${index + 1})`, hasDuplicates ? "NoEnv" : "env")} IN IF IsAbrupt(b${index + 1}) THEN b${index + 1} ELSE`,
          );
          state = `b${index + 1}.s`;
          return;
        }
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
          `LET varEnv == env s4 == CreateVarBindings(${state}, env, ${getSequence(varNames.filter((name) => !parameterBindings.includes(name) && !isLocal(name)).map(getUnits))}, env, FALSE, {}) IN`,
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
      const hoistable = isStrict ? [] : getHoistableFunctions(statements);
      // ESCore keeps the earlier editions' reading, where a block function named arguments
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
          `LET s4h == CreateVarBindings(s4, varEnv, ${getSequence(hoistedNames.map(getUnits))}, varEnv, FALSE, {}) IN`,
          `LET s4a == HoldEnvs([s4h EXCEPT !.hoisted = @ \\cup {${hoisted.map((declaration) => `<<varEnv, ${getSite(declaration)}>>`).join(", ")}}]) IN`,
        );
      }
      const varState = hoisted.length > 0 ? "s4a" : "s4";
      // Steps 30-34: the lexical environment and its bindings.
      if (!isStrict) {
        steps.push(`LET le == NewDeclarativeEnvironment(${varState}, varEnv) IN`);
      }
      const lexEnv = isStrict ? "varEnv" : "le.e";
      steps.push(`LET bodyCtx == [ctx EXCEPT !.lex = ${lexEnv}, !.var = varEnv] IN`);
      if (lexical.length > 0) {
        steps.push(
          `LET s6 == ${createLexicalDeclarations(
            lexical.map((declaration) => ({
              names: getBound(declaration.names, declaration.nodes, scope),
              isConst: declaration.isConst,
            })),
            isStrict ? varState : "le.s",
            lexEnv,
          )} IN`,
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
      if (functions.length > 0) steps.push(`LET fs == ${instantiated} IN`);
      steps.push(getEvaluation(functions.length > 0 ? "fs" : functionState, "bodyCtx"));
      return steps;
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
    const getEvaluation = (state: string, context: string) =>
      isGenerator
        ? `LET g == OrdinaryCreateFromConstructor(${state}, f, "${flavor === "generator" ? "GeneratorPrototype" : "AsyncGeneratorPrototype"}", "${flavor}", GeneratorSlots(${context}, [code |-> ${bodyNumber}])) IN IF IsAbrupt(g) THEN g ELSE Abrupt(g.s, Completion("return", Val(g), Empty))`
        : body === undefined
          ? `Ok(${state}, Empty)`
          : ts.isBlock(body)
            ? statementList(body.statements, scope)(state, context)
            : `LET e == ${value(body, scope)(state, context)} IN IF IsAbrupt(e) THEN e ELSE Abrupt(e.s, Completion("return", Val(e), Empty))`;
    const slotCount = locals?.constant.length ?? 0;
    // Where the frame holds each binding the body declares, its environment would hold none.
    const isFramed =
      slotCount > 0 &&
      [...parameterNames, ...varScoped.names, ...lexicalNames].every((name) => isLocal(name));
    // Each slot's value as the code starts: a parameter's argument where the frame holds them all,
    // undefined for a var or a function, and no value for a lexical declaration's.
    const frame = getSequence(
      Array.from({ length: slotCount }, (_, index) => {
        const name = [...(locals?.top ?? [])].find((entry) => entry[1] === index + 1)?.[0];
        const parameter = name === undefined ? -1 : parameterNames.indexOf(name);
        if (isFramed && parameter !== -1) return `Arg(args, ${parameter + 1})`;
        return name !== undefined && varScoped.names.includes(name) && parameter === -1
          ? "Undefined"
          : "Empty";
      }),
    );
    const getFramedSteps = () => [
      "LET bodyCtx == [ctx EXCEPT !.var = ctx.lex] IN",
      ...(functions.length === 0
        ? []
        : [
            `LET fs == ${instantiateDeclarations(
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
            )} IN`,
          ]),
      getEvaluation(functions.length === 0 ? "s" : "fs", "bodyCtx"),
    ];
    const run = isUnnamed
      ? `Assert(FALSE, "tla-ts can't call a function that its script names nowhere else")`
      : isFramed
        ? getFramedSteps().join("\n  ")
        : isPlain && slotCount === 0
          ? `LET i == PlainInstantiation(s, ctx, ${getSequence(parameterNames.map(getUnits))}, args, ${getBool(isStrict)}) IN\n  ${getEvaluation("i.s", "i.ctx")}`
          : getSteps().join("\n  ");
    if (slotCount > 0 && !isUnnamed) {
      definitions.push({
        name: `Body${id}`,
        arity: 4,
        text: `Body${id}(s, f, ctx, args) ==\n  ${run}`,
      });
    }
    if (flavor === "async" && !isUnnamed) {
      definitions.push({
        name: `AsyncBody${id}`,
        arity: 4,
        text: `AsyncBody${id}(s, f, ctx, args) ==\n  ${run}`,
      });
    }
    codes[id - 1] = {
      id,
      body:
        flavor === "async" && !isUnnamed
          ? `Code${id}(s, f, ctx, args) ==\n  LET cap == NewPromiseCapability(s, Intrinsic(s, "Promise")) IN\n  LET started == AsyncFunctionStep(Val(cap), AsyncBody${id}(cap.s, f, ctx, args)) IN\n  Abrupt(started.s, Completion("return", Val(cap).promise, Empty))`
          : slotCount > 0 && !isUnnamed
            ? `Code${id}(s, f, ctx, args) ==\n  LET r == Body${id}([s EXCEPT !.frame = ${frame}], f, ctx, args) IN [r EXCEPT !.s.frame = s.frame]`
            : `Code${id}(s, f, ctx, args) ==\n  ${run}`,
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
      fn.kind === "staticBlock" ? "<<>>" : getSourceText(node),
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
        ? `LET made == LET a == Alloc(proto.s, BuiltinObject(Val(parents).ctor, <<"Class", "default">>, 0, FunctionNameUnits(proto.s, ${className}), TRUE, ${getPosition(node, node.getStart())}, proto.s.realmId)) IN Ok(a.s, a.v) IN`
        : `LET made == LET m == CodeFunctionCreate(proto.s, Val(parents).ctor, ${functionCode({ node: constructor, parameters: constructor.parameters, body: constructor.body, kind: "constructor" }, scope)}, FALSE, cctx.lex, cctx.priv) IN Ok(SetFunctionName(MakeClassConstructor(MakeMethod(m.s, m.v, Val(proto)), m.v), m.v, ${className}, <<>>), m.v) IN`,
      "LET F == Val(made)",
      "    s2 == MakeConstructor(made.s, F, FALSE, Val(proto))",
      `    s3 == SetO(s2, F, [O(s2, F) EXCEPT !.slots = [ctorKind |-> "${heritage === undefined ? "base" : "derived"}", sourceText |-> ${getSourceText(node)}] @@ @])`,
      `    s4 == CreateMethodProperty(s3, Val(proto), SV("constructor"), F).s IN`,
    ];
    const records = elements.map((element, index) => {
      const isStatic =
        ts.isClassStaticBlockDeclaration(element) ||
        (ts.canHaveModifiers(element) &&
          (ts
            .getModifiers(element)
            ?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) ??
            false));
      const home = isStatic ? "F" : "Val(proto)";
      const name = `Val(els)[${index + 1}]`;
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
          getText: (state: string) => code(state, "cctx", home),
        };
      }
      if (ts.isPropertyDeclaration(element)) {
        const code = classField(element, scope);
        return {
          name,
          isStatic,
          kind: "field",
          getText: (state: string) => code(state, "cctx", home),
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
          getText: (state: string) =>
            `LET f == CodeFunctionCreate(${state}, Intrinsic(${state}, "FunctionPrototype"), ${code}, FALSE, cctx.lex, cctx.priv) IN Ok(MakeMethod(f.s, f.v, F), [kind |-> "staticBlock", body |-> f.v])`,
        };
      }
      throw new TlaTypeScriptError(
        "tla-ts can't compile this class element to ESCore yet",
        element,
      );
    });
    const getRecords = (list: typeof records) => getSequence(list.map((record) => record.name));
    // The methods, getters, and setters, static ones first, as DecorateElements defines them.
    const methods = records.filter((record) => record.kind === "method");
    steps.push(
      `LET els == ${classElements(records.map((record) => record.getText))("s4")} IN IF IsAbrupt(els) THEN els ELSE`,
      `LET ds == DefineElementsOn(els.s, F, ${getRecords(methods.filter((record) => record.isStatic))}) IN IF IsAbrupt(ds) THEN ds ELSE`,
      `LET di == DefineElementsOn(ds.s, Val(proto), ${getRecords(methods.filter((record) => !record.isStatic))}) IN IF IsAbrupt(di) THEN di ELSE`,
    );
    const state = "di.s";
    const instanceFields = records.filter((record) => record.kind === "field" && !record.isStatic);
    const statics = records.filter((record) => record.kind !== "method" && record.isStatic);
    // The private methods and accessors go on each instance as it's made, and the static ones on
    // the class now (§15.7.14 steps 30-34).
    steps.push(
      `LET sf == SetO(${state}, F, [O(${state}, F) EXCEPT !.slots = [privateMethods |-> PrivateMethodsOf(${getRecords(methods.filter((record) => !record.isStatic))}, <<>>), fields |-> ${getRecords(instanceFields)}, initializers |-> Empty] @@ @]) IN`,
      `LET sm == AddPrivateMethods(sf, F, PrivateMethodsOf(${getRecords(methods.filter((record) => record.isStatic))}, <<>>)) IN IF IsAbrupt(sm) THEN sm ELSE`,
      `LET sb == ${binding === undefined ? "sm.s" : `InitializeBinding(sm.s, env.e, ${getUnits(binding)}, F).s`} IN`,
      `LET st == StaticElementsEvaluation(sb, F, ${getRecords(statics)}) IN IF IsAbrupt(st) THEN st ELSE Ok(st.s, F)`,
    );
    const name = define("Class", ["s", "ctx", "name"], steps.join("\n  "));
    return (current, context, className_) => `${name}(${current}, ${context}, ${className_})`;
  };

  // The records of a class's elements in order, from ClassElementEvaluation (§15.7.14 step 26),
  // as the value of the result, in the class's cctx with its constructor F and prototype proto. A
  // list of more than 64 runs as its halves, each a list, so that thousands of elements nest log n
  // deep rather than n.
  const classElements = (elements: ((state: string) => string)[]): ((state: string) => string) => {
    if (elements.length > 64) {
      const middle = Math.ceil(elements.length / 2);
      const first = classElements(elements.slice(0, middle));
      const rest = classElements(elements.slice(middle));
      const name = define(
        "ClassElements",
        ["s", "cctx", "F", "proto"],
        `LET q == ${first("s")} IN IF IsAbrupt(q) THEN q ELSE LET r == ${rest("q.s")} IN IF IsAbrupt(r) THEN r ELSE Ok(r.s, Val(q) \\o Val(r))`,
      );
      return (state) => `${name}(${state}, cctx, F, proto)`;
    }
    return (initial) => {
      const steps = elements.map(
        (getText, index) =>
          `LET c${index + 1} == ${getText(index === 0 ? initial : `c${index}.s`)} IN IF IsAbrupt(c${index + 1}) THEN c${index + 1} ELSE`,
      );
      const state = elements.length === 0 ? initial : `c${elements.length}.s`;
      return [
        ...steps,
        `Ok(${state}, ${getSequence(elements.map((_, index) => `Val(c${index + 1})`))})`,
      ].join("\n  ");
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
      if (scope.isStrict) return (state) => `Ok(${state}, Empty)`;
      return (state, context) =>
        `IF <<${context}.var, ${getSite(node)}>> \\in ${state}.hoisted THEN HoistedFunctionEvaluation(${state}, ${context}, ${getUnits(node.name?.text ?? "*default*")}) ELSE Ok(${state}, Empty)`;
    }
    if (ts.isClassDeclaration(node)) {
      // BindingClassDeclarationEvaluation (§15.7.15) binds the class in the running context too,
      // and a module's default export of a class without a name binds *default* to the class that
      // it names default (§16.2.3.7).
      const definition = classDefinition(node, node.name?.text);
      return defineCode(
        "ClassDeclaration",
        `LET r == ${definition("s", "ctx", node.name === undefined ? getStr("default") : "EmptyStr")} IN IF IsAbrupt(r) THEN r ELSE LET b == ${
          node.name !== undefined && scope.locals?.slots.has(node.name)
            ? `LocalInitialize(r.s, ${scope.locals.slots.get(node.name)}, Val(r))`
            : `InitializeBinding(r.s, ctx.lex, ${getUnits(getDeclaredName(node))}, Val(r))`
        } IN IF IsAbrupt(b) THEN b ELSE Ok(b.s, Empty)`,
      );
    }
    // An import, and an export of names, evaluate to empty (§16.2.2.7, §16.2.3.7).
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      return (state) => `Ok(${state}, Empty)`;
    // export default of an expression, which binds *default* (§16.2.3.7).
    if (ts.isExportAssignment(node) && node.isExportEquals !== true) {
      const exported = named(node.expression, scope, getStr("default"));
      return defineCode("ExportDefault", `ExportDefaultThen(ctx, FALSE, ${exported("s", "ctx")})`);
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
      return (state, context) =>
        scope.isAsyncGenerator
          ? `ReturnThen(${context}, ${result(state, context)})`
          : `ReturnValueThen(${result(state, context)})`;
    }
    if (ts.isThrowStatement(node)) {
      const thrown = value(node.expression, scope);
      const site = `<<${fileNumbers.get(node.getSourceFile()) ?? 0}, ${throwIndexes.get(node) ?? 0}>>`;
      return (state, context) => `ThrowAtThen(${site}, ${thrown(state, context)})`;
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
    const kind = getResourceKind(list);
    // A using declaration reads its values' @@dispose or @@asyncDispose.
    if (kind !== "normal") words.add(kind === "sync-dispose" ? "dispose" : "asyncDispose");
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
      if (initializer === undefined && !isLet) return;
      const lhs = `l${index + 1}`;
      steps.push(
        `LET ${lhs} == ${nameReference(declaration.name, scope)(state, "ctx")} IN IF IsAbrupt(${lhs}) THEN ${lhs} ELSE`,
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
              : kind === "normal"
                ? `InitializeReferencedThen(Val(${lhs}), ${assigned})`
                : `InitializeThen("${kind}", Val(${lhs}), ${assigned})`
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
    const list = statementSequence(statements, scope);
    // A block's, function body's, or module's resources are disposed of once its statements
    // complete (EvaluateDisposing in ESCore).
    return hasUsing(statements)
      ? (state, context) => `DisposeThen(${context}.lex, ${list(state, context)})`
      : list;
  };

  // The statements in order, each in an operator of its own. A list of more than 64 runs as its
  // halves, each a list, so that thousands of statements nest log n deep rather than n.
  const statementSequence = (statements: readonly ts.Statement[], scope: Scope): Code => {
    if (statements.length === 0) return (state) => `Ok(${state}, Empty)`;
    if (statements.length > 64) {
      const middle = Math.ceil(statements.length / 2);
      const first = statementSequence(statements.slice(0, middle), scope);
      const rest = statementSequence(statements.slice(middle), scope);
      return defineCode(
        "Statements",
        `LET q == ${first("s", "ctx")} IN IF IsAbrupt(q) THEN q ELSE StatementResult(${rest("q.s", "ctx")}, Val(q))`,
      );
    }
    const codes = statements.map((current) => statement(current, scope, []));
    // Each statement's result, its value Empty's where it has none, of the statement before it.
    const results = codes.map(
      (code, index) =>
        `StatementResult(${code(index === 0 ? "s" : `q${index}.s`, "ctx")}, ${index === 0 ? "Empty" : `Val(q${index})`})`,
    );
    const name = define(
      "Statements",
      ["s", "ctx"],
      [
        ...results
          .slice(0, -1)
          .map(
            (result, index) =>
              `LET q${index + 1} == ${result} IN IF IsAbrupt(q${index + 1}) THEN q${index + 1} ELSE`,
          ),
        results[results.length - 1],
      ].join("\n  "),
    );
    return (state, context) => `${name}(${state}, ${context})`;
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
      `LET env == NewDeclarativeEnvironment(s, ctx.lex) bctx == WithLex(ctx, env.e) IN ${list(declared("env.s", "bctx"), "bctx")}`,
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
    const steps: string[] = [];
    let state = "s";
    declarations.forEach((declaration, index) => {
      const bound = getBound(declaration.names, declaration.nodes, scope);
      steps.push(
        `LET b${index + 1} == ${resetSlots(
          bound.length === 0
            ? state
            : `BlockBindNames(${state}, ctx.lex, ${getSequence(bound.map(getUnits))}, ${getBool(declaration.isConst)})`,
          getSlots(declaration.nodes, scope),
        )} IN`,
      );
      state = `b${index + 1}`;
      if (declaration.fn !== undefined) {
        const instantiate = instantiateFunction(declaration.fn, scope);
        const units = getUnits(declaration.names[0]);
        const slot = scope.locals?.slots.get(declaration.nodes[0]);
        steps.push(
          `LET fo${index + 1} == ${instantiate(state, "ctx")} IN`,
          slot === undefined
            ? `LET fb${index + 1} == IF E(fo${index + 1}.s, ctx.lex).b[${units}].init THEN SetMutableBinding(fo${index + 1}.s, ctx.lex, ${units}, Val(fo${index + 1}), FALSE).s ELSE InitializeBinding(fo${index + 1}.s, ctx.lex, ${units}, Val(fo${index + 1})).s IN`
            : `LET fb${index + 1} == LocalInitialize(fo${index + 1}.s, ${slot}, Val(fo${index + 1})).s IN`,
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
      const nodes = initializer.declarations.flatMap((item) => getBoundIdentifiers(item.name));
      const names = getBound(getDeclaredNames(initializer), nodes, scope);
      const slots = getSlots(nodes, scope);
      // CreatePerIterationEnvironment (§14.7.4.4) copies the let bindings so that each closure an
      // iteration makes keeps its own. Where the statement makes no closure, nothing can tell the
      // copies from the bindings they copy, so the iterations share one environment.
      const lets =
        isConst(initializer) || !hasClosure(node) ? "<<>>" : getSequence(names.map(getUnits));
      const declaration = declarationList(initializer, scope);
      if (names.length === 0) {
        return defineCode(
          "For",
          `BreakTargetThen(ForDeclarationThen(ctx, [id |-> ${id}, labels |-> ${labelSet}, lets |-> <<>>], ${declaration(resetSlots("s", slots), "ctx")}))`,
        );
      }
      return defineCode(
        "For",
        `LET env == NewDeclarativeEnvironment(s, ctx.lex) loopCtx == WithLex(ctx, env.e) IN BreakTargetThen(${isUsing(initializer) ? "DisposeThen(env.e, " : "("}ForDeclarationThen(loopCtx, [id |-> ${id}, labels |-> ${labelSet}, lets |-> ${lets}], ${declaration(resetSlots(`BlockBindNames(env.s, env.e, ${getSequence(names.map(getUnits))}, ${getBool(isConst(initializer))})`, slots), "loopCtx")})))`,
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
    const isEnumerate = ts.isForInStatement(node);
    // A for-await statement awaits each result of its async iterator's next.
    const isAwait = ts.isForOfStatement(node) && node.awaitModifier !== undefined;
    if (isAwait) isAsync = true;
    const id = loops.length + 1;
    loops.push({ id, body: "" });
    const labelSet = `{${labels.map(getUnits).join(", ")}}`;
    const initializer = node.initializer;
    const body = statement(node.statement, scope, []);
    let bind: string;
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
      bind = `ResultThen(ctx, AssignToThen(Val(value), ResolveBinding(value.s, ctx, ${getUnits("let")}, FALSE)))`;
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
          "tla-ts can't compile an initializer in a for-in head to ESCore yet",
          node,
        );
      }
      const names = getBoundNames(declaration.name);
      const pattern = binding(declaration.name, scope);
      const slot = scope.locals?.slots.get(declaration.name);
      if (isLexical(initializer) && slot !== undefined) {
        tdzSlots = [slot];
        bind = `ResultThen(ctx, LocalInitialize(value.s, ${slot}, Val(value)))`;
      } else if (isLexical(initializer)) {
        tdz = names;
        // A using declaration's binding adds its value's resource first (ForInOfBind in ESCore).
        const kind = getResourceKind(initializer);
        if (kind !== "normal") words.add(kind === "sync-dispose" ? "dispose" : "asyncDispose");
        bind = `LET env == NewDeclarativeEnvironment(value.s, ctx.lex) iterCtx == WithLex(ctx, env.e) s1 == BlockBindNames(env.s, env.e, ${getSequence(names.map(getUnits))}, ${getBool(isConst(initializer))}) IN ResultThen(iterCtx, ${
          kind === "normal"
            ? pattern("s1", "iterCtx", "Val(value)", "env.e")
            : `LET added == AddDisposableResource(s1, env.e, Val(value), "${kind}") IN IF IsAbrupt(added) THEN added ELSE ${pattern("added.s", "iterCtx", "Val(value)", "env.e")}`
        })`;
      } else if (ts.isIdentifier(declaration.name)) {
        bind = `ResultThen(ctx, AssignToThen(Val(value), ${nameReference(declaration.name, scope)("value.s", "ctx")}))`;
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
      isAwait
        ? `LET r == AwaitThen(Call(s, it.next, it.iterator, <<>>)) IN IF IsAbrupt(r) THEN r ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s) ELSE`
        : `LET r == Call(s, it.next, it.iterator, <<>>) IN IF IsAbrupt(r) THEN r ELSE IF ~IsObject(Val(r)) THEN ThrowTypeError(r.s) ELSE`,
      "LET done == IteratorComplete(r.s, Val(r)) IN IF IsAbrupt(done) THEN done ELSE IF Val(done) THEN Ok(done.s, v) ELSE",
      `LET value == Get(done.s, Val(r), SV("value")) IN IF IsAbrupt(value) THEN value ELSE`,
      `LET bound == ${bind} IN IF IsAbrupt(bound) THEN ForInOfClose(loop, it, bound) ELSE`,
      `ForInOfStatementThen(ctx, loop, it, v, ${
        ts.isVariableDeclarationList(initializer) && isUsing(initializer)
          ? `DisposeThen(Val(bound).lex, ${body("bound.s", "Val(bound)")})`
          : body("bound.s", "Val(bound)")
      })`,
    ].join("\n    ");
    const expression = value(node.expression, scope);
    // §B.3.5: a var's initializer in a for-in head assigns the var before the head's expression.
    const initialized =
      ts.isVariableDeclarationList(initializer) &&
      initializer.declarations[0]?.initializer !== undefined
        ? declarationList(initializer, scope)
        : undefined;
    const head =
      initialized !== undefined
        ? `LET d == ${initialized("s", "ctx")} IN IF IsAbrupt(d) THEN d ELSE ${expression("d.s", "ctx")}`
        : tdz.length === 0
          ? `${expression(resetSlots("s", tdzSlots), "ctx")}`
          : `LET env == NewDeclarativeEnvironment(s, ctx.lex) IN ${expression(`BlockBindNames(env.s, env.e, ${getSequence(tdz.map(getUnits))}, FALSE)`, "WithLex(ctx, env.e)")}`;
    return defineCode(
      "ForInOf",
      `BreakTargetThen(ForInOfHeadThen(ctx, [id |-> ${id}, labels |-> ${labelSet}, lets |-> <<>>, it |-> Empty, iterationKind |-> "${isEnumerate ? "enumerate" : isAwait ? "async-iterate" : "iterate"}", iteratorKind |-> "${isAwait ? "async" : "sync"}", text |-> ${isEnumerate || isAwait || getPrintedText(node.expression) === undefined ? "Empty" : getUnits(getPrintedText(node.expression) ?? "")}], ${head}))`,
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
    if (!hasBound(declarations, scope)) {
      return defineCode(
        "Switch",
        `LET r == ${discriminant("s", "ctx")} IN IF IsAbrupt(r) THEN r ELSE BreakTargetThen(${first}(${declared("r.s", "ctx")}, ctx, Val(r)))`,
      );
    }
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
      const slot = parameter === undefined ? undefined : scope.locals?.slots.get(parameter.name);
      const handler =
        parameter === undefined
          ? catchBlock("r.s", "ctx")
          : slot !== undefined
            ? catchBlock(`LocalInitialize(r.s, ${slot}, r.c.value).s`, "ctx")
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

  // The files of a module's specifiers, as a function from each specifier's code units.
  const getTargets = (file: ProgramFile) =>
    file.targets.size === 0
      ? "<<>>"
      : [...file.targets].map((target) => `(${getUnits(target[0])} :> ${target[1]})`).join(" @@ ");

  // A Source Text Module Record's fields that ParseModule (§16.2.1.7.1) reads of the module's code,
  // as ESCore's ImportEntries, ExportEntries, ModuleRequests, and ModuleRequestPhases give them, the
  // file of each request, and the module's body, which RunBody runs; and the declarations that
  // InitializeEnvironment (§16.2.1.7.3.1) instantiates once the module binds its imports.
  const moduleCode = (file: ProgramFile, number: number) => {
    const statements = file.sourceFile.statements;
    const scope: Scope = { isStrict: true, isClassBody: false, isAsyncGenerator: false };
    // ModuleRequest (§16.2.1.4), with the attributes of its with clause (WithClauseToAttributes,
    // §16.2.2.4), a function from each key to its value.
    const getRequest = (node: ts.ImportDeclaration | ts.ExportDeclaration) => {
      const specifier = node.moduleSpecifier;
      if (specifier === undefined || !ts.isStringLiteral(specifier)) return undefined;
      if (!file.targets.has(specifier.text)) {
        throw new TlaTypeScriptError(`tla-ts can't load the module ${specifier.text}`, node);
      }
      const attributes = (node.attributes?.elements ?? []).map((element) =>
        ts.isStringLiteral(element.value)
          ? `(${getUnits(element.name.text)} :> ${getUnits(element.value.text)})`
          : undefined,
      );
      if (attributes.some((attribute) => attribute === undefined)) {
        throw new TlaTypeScriptError("tla-ts can't read this import attribute", node);
      }
      return `[specifier |-> ${getUnits(specifier.text)}, attributes |-> ${attributes.length === 0 ? "NoAttributes" : attributes.join(" @@ ")}]`;
    };
    const imports: string[] = [];
    const importedNames: string[] = [];
    const exports: string[] = [];
    const requests: string[] = [];
    for (const statement of statements) {
      if (
        ts.isImportEqualsDeclaration(statement) ||
        (ts.isExportAssignment(statement) && statement.isExportEquals === true)
      ) {
        throw new TlaTypeScriptError(
          "tla-ts can't compile TypeScript's CommonJS syntax to ESCore",
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
        const getEntry = (importName: string, localName: string) => {
          importedNames.push(localName);
          return `[request |-> ${request}, isNamespace |-> FALSE, isSource |-> FALSE, importName |-> ${importName}, localName |-> ${getUnits(localName)}]`;
        };
        if (clause?.name !== undefined)
          imports.push(getEntry(getUnits("default"), clause.name.text));
        const bindings = clause?.namedBindings;
        if (bindings !== undefined && ts.isNamespaceImport(bindings)) {
          importedNames.push(bindings.name.text);
          imports.push(
            `[request |-> ${request}, isNamespace |-> TRUE, isSource |-> FALSE, isDeferred |-> FALSE, importName |-> <<>>, localName |-> ${getUnits(bindings.name.text)}]`,
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
        if (request === undefined && clause !== undefined && ts.isNamedExports(clause)) {
          clause.elements.forEach((element) =>
            exports.push(
              `LocalExport(${getUnits(element.name.text)}, ${getUnits((element.propertyName ?? element.name).text)})`,
            ),
          );
        } else if (clause === undefined) {
          exports.push(`ExportEntry(<<>>, ${request}, "star", <<>>, <<>>)`);
        } else if (ts.isNamespaceExport(clause)) {
          exports.push(
            `ExportEntry(${getUnits(clause.name.text)}, ${request}, "namespace", <<>>, <<>>)`,
          );
        } else {
          clause.elements.forEach((element) =>
            exports.push(
              `ExportEntry(${getUnits(element.name.text)}, ${request}, "name", ${getUnits((element.propertyName ?? element.name).text)}, <<>>)`,
            ),
          );
        }
        continue;
      }
      if (ts.isExportAssignment(statement)) {
        exports.push(`LocalExport(${getUnits("default")}, ${getUnits("*default*")})`);
        continue;
      }
      if (!isExported(statement)) continue;
      if (ts.isVariableStatement(statement)) {
        getDeclaredNames(statement.declarationList).forEach((name) =>
          exports.push(`LocalExport(${getUnits(name)}, ${getUnits(name)})`),
        );
      } else if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
        const name = getDeclaredName(statement);
        exports.push(
          `LocalExport(${getUnits(hasModifier(statement, ts.SyntaxKind.DefaultKeyword) ? "default" : name)}, ${getUnits(name)})`,
        );
      } else {
        throw new TlaTypeScriptError(
          `tla-ts can't export ${ts.SyntaxKind[statement.kind]} from a module to ESCore`,
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
    const steps = [
      `LET env == ctx.lex s1 == CreateVarBindings(s, env, ${getSequence(varNames.map(getUnits))}, env, FALSE, {}) IN`,
      `LET s2 == ${createLexicalDeclarations(lexical, "s1", "env")} IN`,
    ];
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
    steps.push(`Ok(${instantiateDeclarations(declared, "s2", "ctx", "env")}, Empty)`);
    const declarations = define("ModuleDeclarations", ["s", "ctx"], steps.join("\n  "));
    bodies.push(statementList(statements, scope));
    const dedupedRequests = dedupe(requests);
    definitions.push({
      name: `ModuleNode${number}`,
      arity: 0,
      text: `ModuleNode${number} == [file |-> ${number}, kind |-> "module", facade |-> ${file.facade ?? 0}, body |-> [code |-> ${bodies.length}], hasTopLevelAwait |-> ${getBool(hasTopLevelAwait(file.sourceFile))}, imports |-> ${getSequence(imports)}, exports |-> ${getSequence(exports)}, requests |-> ${getSequence(dedupedRequests)}, phases |-> ${getSequence(dedupedRequests.map((request) => `[request |-> ${request}, phase |-> "evaluation"]`))}, targets |-> ${getTargets(file)}]`,
    });
    return declarations;
  };

  // A CommonJS module's code: the function that Node wraps the module's code in, which RequireFile
  // calls with the module's exports, require, module, __filename and __dirname, as Node's loader
  // does (lib/internal/modules/cjs/loader.js). Its code may not read the wrapper's arguments
  // object, whose callee is the runtime's function rather than Node's.
  const commonJsCode = (file: ProgramFile, number: number) => {
    const directory = file.path.slice(0, Math.max(file.path.lastIndexOf("/"), 1));
    const getNode = (code: string) =>
      `ModuleNode${number} == [file |-> ${number}, kind |-> "commonjs", code |-> ${code}, filename |-> ${getUnits(file.path)}, dirname |-> ${getUnits(directory)}, targets |-> ${getTargets(file)}, exportNames |-> ${getSequence(file.exportNames.map(getUnits))}]`;
    // A module with an early error has no code, which Node fails to compile where it runs it.
    if (file.isRejected === true) {
      definitions.push({ name: `ModuleNode${number}`, arity: 0, text: getNode("None") });
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
    definitions.push({ name: `ModuleNode${number}`, arity: 0, text: getNode(code) });
    return undefined;
  };

  const entry = files[0];
  // A script that calls import() loads the files of its specifiers.
  if (entry.kind === "script" && files.length > 1) {
    definitions.push({
      name: "ModuleNode1",
      arity: 0,
      text: `ModuleNode1 == [file |-> 1, kind |-> "script", targets |-> ${getTargets(entry)}]`,
    });
  }
  // A JSON file's node: its text without a byte order mark, which Node strips, where it's valid.
  const jsonCode = (file: ProgramFile, number: number) => {
    definitions.push({
      name: `ModuleNode${number}`,
      arity: 0,
      text: `ModuleNode${number} == [file |-> ${number}, kind |-> "json", isValid |-> ${getBool(file.json !== undefined)}, text |-> ${getUnits((file.json ?? "").replace(/^\uFEFF/, ""))}]`,
    });
    return undefined;
  };
  // An ES module with an early error, which Node fails to parse where it loads it.
  const rejectedCode = (number: number) => {
    definitions.push({
      name: `ModuleNode${number}`,
      arity: 0,
      text: `ModuleNode${number} == [file |-> ${number}, kind |-> "rejected"]`,
    });
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
    definitions.push({
      name: `ModuleNode${number}`,
      arity: 0,
      text: `ModuleNode${number} == [file |-> ${number}, kind |-> "host", code |-> ${code}]`,
    });
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
      ? "RunModuleNode(s, ModuleNode(1))"
      : entry.kind === "commonjs"
        ? "RequireFile(s, 1)"
        : `${script(entry.sourceFile)}(s)`;
  definitions.push({
    name: "InstantiateCode",
    arity: 3,
    text: [
      "InstantiateCode(s, ctx, id) ==",
      instantiations.length === 0
        ? `  Assert(FALSE, "tla-ts can't instantiate a function the program doesn't declare")`
        : `  ${getDispatch("id", 1, instantiations.length, (code) => instantiations[code - 1]("s", "ctx"))}`,
    ].join("\n"),
  });
  definitions.push({
    name: "CallCode",
    arity: 5,
    text: [
      "CallCode(s, f, ctx, args, id) ==",
      codes.length === 0
        ? `  Assert(FALSE, "tla-ts can't call a function the program doesn't define")`
        : `  ${getDispatch("id", 1, codes.length, (code) => `Code${code}(s, f, ctx, args)`)}`,
    ].join("\n"),
  });
  definitions.push({
    name: "RunBody",
    arity: 3,
    text: [
      "RunBody(s, ctx, body) ==",
      bodies.length === 0
        ? `  Assert(FALSE, "tla-ts can't run a generator the program doesn't define")`
        : `  ${getDispatch("body.code", 1, bodies.length, (number) => bodies[number - 1]("s", "ctx"))}`,
    ].join("\n"),
  });
  definitions.push(
    ...codes.map((code) => ({ name: `Code${code.id}`, arity: 4, text: code.body })),
    {
      name: "LoopIteration",
      arity: 4,
      text: [
        "LoopIteration(s, ctx, loop, v) ==",
        loops.length === 0
          ? `  Assert(FALSE, "tla-ts can't run a loop the program doesn't have")`
          : `  ${getDispatch("loop.id", 1, loops.length, (loop) => `Loop${loop}(s, ctx, loop, v)`)}`,
      ].join("\n"),
    },
    ...loops.map((current) => ({
      name: `Loop${current.id}`,
      arity: 4,
      text: `Loop${current.id}(s, ctx, loop, v) ==\n  ${current.body.includes("it.next") ? "LET it == loop.it IN " : ""}${current.body}`,
    })),
    {
      name: "ModuleNode",
      arity: 1,
      text: `ModuleNode(id) ==\n  ${files.length === 1 && entry.kind === "script" ? `Assert(FALSE, "tla-ts can't load a module the program doesn't have")` : getDispatch("id", 1, files.length, (number) => `ModuleNode${number}`)}`,
    },
    {
      name: "ModuleDeclarations",
      arity: 3,
      text: `ModuleDeclarations(s, ctx, node) ==\n  ${getDispatch(
        "node.file",
        1,
        moduleDeclarations.length,
        (number) => {
          const declarations = moduleDeclarations[number - 1];
          return declarations === undefined
            ? `Assert(FALSE, "tla-ts can't link a module the program doesn't have")`
            : `${declarations}(s, ctx)`;
        },
      )}`,
    },
    { name: "Program", arity: 1, text: `Program(s) == ${program}` },
  );
  const sources = files.map((file) => getSourceString(file.sourceFile.text));
  return {
    definitions: [
      ...sources.map((source, index) => ({
        name: `SourceText${index + 1}`,
        arity: 0,
        text: `SourceText${index + 1} == ${source.text}`,
      })),
      {
        name: "SourcePatches",
        arity: 0,
        text: `SourcePatches == <<${sources.map((source) => getPatches(source.patches)).join(", ")}>>`,
      },
      {
        name: "SourceUnits",
        arity: 1,
        text: `SourceUnits(t) ==
  LET u == StringUnits(SubSeq(<<${sources.map((_, index) => `SourceText${index + 1}`).join(", ")}>>[t[1]], t[2], t[3]))
      p == SourcePatches[t[1]]
  IN [i \\in DOMAIN u |-> IF t[2] + i - 1 \\in DOMAIN p THEN p[t[2] + i - 1] ELSE u[i]]`,
      },
      ...definitions,
    ],
    regions,
    words,
    identifiers,
    isAsync,
  };
};
