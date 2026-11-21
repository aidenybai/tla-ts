import ts from "@typescript/typescript6";
import { getNumber } from "./specialize";

// The methods LMethod runs, which change the receiver where they're in MUTATORS. ESCore's step
// counts a call of a mutator on what existed before it as a write, as ModelCallBuiltin does.
const METHODS = new Set(["push", "pop", "shift", "includes", "has", "add", "delete", "get", "set"]);
const MUTATORS = new Set(["push", "pop", "shift", "add", "delete", "set"]);

// The order of a comparator (a, b) => a - b, "ascending", or (a, b) => b - a, "descending", which
// read only their parameters and change nothing, or undefined for any other.
const getComparatorOrder = (node: ts.Expression) => {
  if (!ts.isArrowFunction(node) || node.parameters.length !== 2) return undefined;
  const names = node.parameters.map((parameter) =>
    ts.isIdentifier(parameter.name) &&
    parameter.initializer === undefined &&
    parameter.dotDotDotToken === undefined
      ? parameter.name.text
      : undefined,
  );
  const body = node.body;
  if (names.includes(undefined) || names[0] === names[1] || !ts.isBinaryExpression(body)) {
    return undefined;
  }
  if (body.operatorToken.kind !== ts.SyntaxKind.MinusToken) return undefined;
  if (!ts.isIdentifier(body.left) || !ts.isIdentifier(body.right)) return undefined;
  const operands = [body.left.text, body.right.text].join(" ");
  return operands === `${names[0]} ${names[1]}`
    ? "ascending"
    : operands === `${names[1]} ${names[0]}`
      ? "descending"
      : undefined;
};

// The built-in methods that change nothing, whose receiver a read-only parameter may give.
const READING_METHODS = new Set([
  "every",
  "some",
  "map",
  "filter",
  "find",
  "slice",
  "includes",
  "has",
  "get",
  "with",
  "values",
]);

// The binary operators that read their operands and give a new value.
const READING_OPERATORS = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
  ts.SyntaxKind.PlusToken,
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.SlashToken,
  ts.SyntaxKind.PercentToken,
  ts.SyntaxKind.AsteriskAsteriskToken,
]);

// The array methods that call an arrow function on each element, by their operators.
const CALLBACK_METHODS = new Map([
  ["every", "LEvery"],
  ["some", "LSome"],
  ["map", "LMap"],
  ["filter", "LFilter"],
  ["find", "LFind"],
]);

// The methods of a Set that take another Set, and those of them that make a Set.
const SET_METHODS = new Set([
  "union",
  "intersection",
  "difference",
  "symmetricDifference",
  "isSubsetOf",
  "isSupersetOf",
  "isDisjointFrom",
]);
const SET_MAKERS = new Set(["union", "intersection", "difference", "symmetricDifference"]);

// The functions of Math that MathOf gives of one Number.
const MATH_FUNCTIONS = new Set(
  "abs acos acosh asin asinh atan atanh cbrt ceil clz32 cos cosh exp expm1 f16round floor fround log log2 log10 log1p round sign sin sinh sqrt tan tanh trunc".split(
    " ",
  ),
);

const ARITHMETIC = new Map([
  [ts.SyntaxKind.PlusToken, "+"],
  [ts.SyntaxKind.MinusToken, "-"],
  [ts.SyntaxKind.AsteriskToken, "*"],
  [ts.SyntaxKind.SlashToken, "/"],
  [ts.SyntaxKind.PercentToken, "%"],
  [ts.SyntaxKind.AsteriskAsteriskToken, "**"],
]);

const COMPOUND = new Map([
  [ts.SyntaxKind.PlusEqualsToken, "+"],
  [ts.SyntaxKind.MinusEqualsToken, "-"],
  [ts.SyntaxKind.AsteriskEqualsToken, "*"],
  [ts.SyntaxKind.SlashEqualsToken, "/"],
  [ts.SyntaxKind.PercentEqualsToken, "%"],
]);

const RELATIONS = new Map([
  [ts.SyntaxKind.LessThanToken, "<"],
  [ts.SyntaxKind.GreaterThanToken, ">"],
  [ts.SyntaxKind.LessThanEqualsToken, "<="],
  [ts.SyntaxKind.GreaterThanEqualsToken, ">="],
]);

const getUnits = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

// Whether a key names an array index, whose place in an object's keys isn't the order it came in.
export const isIndexKey = (text: string) =>
  /^(?:0|[1-9][0-9]*)$/.test(text) && Number(text) < 2 ** 32 - 1;

interface Scope {
  // The TLA+ expressions of the lowered state and of whether the call wrote, so far.
  m: string;
  w: string;
  // The TLA+ names of the parameters and constants of the function's code, by name.
  locals: ReadonlyMap<string, string>;
  // The function whose code this is.
  body: ts.Node;
  // The TLA+ names of the constants that hold an object or array that nothing else holds.
  fresh: ReadonlySet<string>;
}

interface Value {
  text: string;
  // Whether the value is an object or array that the expression made, which nothing else holds.
  isFresh: boolean;
}

// The text of what follows a statement, given the state and written flag it leaves.
type Rest = (m: string, w: string) => string | undefined;

type FunctionNode = ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression;

interface Compiled {
  operator: string;
  // Whether a call writes nothing, so that an expression may call it.
  isPure: boolean;
  // Whether every return gives a composite that the function's own body just made, which nothing
  // else holds, so that a caller may own the result.
  isFresh: boolean;
}

export interface NativeFunctions {
  definitions: string[];
  // The operator that runs a module function natively, Native(m, w, p1, ..., pn), if it can.
  getOperator: (name: string) => string | undefined;
  // The operator that evaluates an expression of the module natively, as a function of the
  // parameters named would, Native(m, w, p1, ..., pn), if it can.
  getExpressionOperator: (node: ts.Expression, parameters: string[]) => string | undefined;
}

// The native operators of a lowered model's module functions, by the module's top-level
// declarations: its functions, and the bindings that the state lowers, of which let ones are
// mutable.
export const getNativeFunctions = (
  file: ts.SourceFile,
  lowered: readonly string[],
): NativeFunctions => {
  const functions = new Map<string, FunctionNode>();
  const mutable = new Set<string>();
  for (const statement of file.statements) {
    if (
      ts.isVariableStatement(statement) &&
      (statement.declarationList.flags & ts.NodeFlags.Let) !== 0
    ) {
      statement.declarationList.declarations.forEach((declaration) => {
        if (ts.isIdentifier(declaration.name)) mutable.add(declaration.name.text);
      });
    }
    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
      functions.set(statement.name.text, statement);
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const initializer = declaration.initializer;
        if (
          ts.isIdentifier(declaration.name) &&
          initializer !== undefined &&
          (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
        ) {
          functions.set(declaration.name.text, initializer);
        }
      }
    }
  }
  const bindings = new Set(lowered);
  const definitions: string[] = [];
  const compiled = new Map<string, Compiled | undefined>();
  // The functions that compileFunction is compiling, innermost last.
  const compiling: { name: string; operator: string; isRecursive: boolean }[] = [];
  let count = 0;
  // A name of the generated code's own, which no definition of ESCore's takes.
  const fresh = (prefix: string) => {
    count += 1;
    return `${prefix === "Native" ? prefix : `nv${prefix}`}${count}`;
  };
  const isBinding = (name: string, scope: Scope) => !scope.locals.has(name) && bindings.has(name);
  // Whether a function only reads a parameter: each use of it, and of each property or element it
  // reads of it, ends in a comparison, an operation, a condition, an index, the receiver of a method
  // that changes nothing, or a read-only parameter of another module function. A store, a return,
  // an update, a delete, a use in a nested function, `arguments`, or any other use makes it
  // not read-only.
  const isReadOnlyParameter = (
    fn: FunctionNode,
    index: number,
    visiting: Set<FunctionNode> = new Set(),
  ): boolean => {
    const param = fn.parameters[index];
    if (param === undefined || !ts.isIdentifier(param.name) || param.dotDotDotToken !== undefined) {
      return false;
    }
    if (param.initializer !== undefined || fn.body === undefined) return false;
    // A function that calls itself passes the parameter on to a parameter this check reads.
    if (visiting.has(fn)) return true;
    const inner = new Set([...visiting, fn]);
    const name = param.name.text;
    let isReadOnly = true;
    const visit = (node: ts.Node, isNested: boolean) => {
      if (!isReadOnly) return;
      if (ts.isIdentifier(node) && node.text === "arguments") isReadOnly = false;
      const declared =
        ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isBindingElement(node)
          ? node.name
          : undefined;
      // A destructuring, or a declaration of the name, could bind the name again.
      const isRedeclared =
        declared !== undefined &&
        node !== param &&
        (!ts.isIdentifier(declared) || declared.text === name);
      if (isRedeclared) isReadOnly = false;
      if (ts.isIdentifier(node) && node.text === name && node !== param.name && !isNameOnly(node)) {
        if (isNested || !isReadUse(node, inner)) isReadOnly = false;
      }
      ts.forEachChild(node, (child) =>
        visit(
          child,
          isNested ||
            ts.isArrowFunction(child) ||
            ts.isFunctionExpression(child) ||
            ts.isFunctionDeclaration(child),
        ),
      );
    };
    visit(fn.body, false);
    return isReadOnly;
  };
  // An identifier that names a property, not a binding.
  const isNameOnly = (node: ts.Identifier) => {
    const parent = node.parent;
    return (
      (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
      (ts.isPropertyAssignment(parent) && parent.name === node) ||
      (ts.isMethodDeclaration(parent) && parent.name === node)
    );
  };
  // Whether a use of a read-only parameter, followed through the reads it makes, only reads.
  const isReadUse = (node: ts.Expression, visiting: Set<FunctionNode>): boolean => {
    const parent = node.parent;
    if (
      ts.isParenthesizedExpression(parent) ||
      ts.isAsExpression(parent) ||
      ts.isNonNullExpression(parent) ||
      ts.isSatisfiesExpression(parent)
    ) {
      return isReadUse(parent, visiting);
    }
    if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
      const call = parent.parent;
      return ts.isCallExpression(call) && call.expression === parent
        ? READING_METHODS.has(parent.name.text) && isReadUse(call, visiting)
        : isReadUse(parent, visiting);
    }
    if (ts.isElementAccessExpression(parent)) {
      return parent.argumentExpression === node || isReadUse(parent, visiting);
    }
    if (ts.isCallExpression(parent) && parent.expression !== node) {
      const callee = ts.isIdentifier(parent.expression)
        ? functions.get(parent.expression.text)
        : undefined;
      return (
        callee !== undefined &&
        isReadOnlyParameter(callee, parent.arguments.indexOf(node), visiting)
      );
    }
    if (ts.isBinaryExpression(parent)) {
      const kind = parent.operatorToken.kind;
      if (
        kind === ts.SyntaxKind.AmpersandAmpersandToken ||
        kind === ts.SyntaxKind.BarBarToken ||
        kind === ts.SyntaxKind.QuestionQuestionToken
      ) {
        return isReadUse(parent, visiting);
      }
      return READING_OPERATORS.has(kind);
    }
    if (ts.isPrefixUnaryExpression(parent)) {
      return (
        parent.operator !== ts.SyntaxKind.PlusPlusToken &&
        parent.operator !== ts.SyntaxKind.MinusMinusToken
      );
    }
    if (ts.isConditionalExpression(parent)) {
      return parent.condition === node || isReadUse(parent, visiting);
    }
    return (
      ts.isTypeOfExpression(parent) ||
      ((ts.isIfStatement(parent) || ts.isWhileStatement(parent) || ts.isDoStatement(parent)) &&
        parent.expression === node)
    );
  };
  // A literal's value, defined once as a constant of its own, before the code that reads it.
  const constants = new Map<string, string>();
  const getConstant = (text: string) => {
    const known = constants.get(text);
    if (known !== undefined) return known;
    const name = fresh("Constant");
    constants.set(text, name);
    definitions.push(`${name} == ${text}`);
    return name;
  };

  // The function of a call's callee, where it names one of the module's functions.
  const getCallee = (node: ts.Expression, scope: Scope) =>
    ts.isIdentifier(node) && !scope.locals.has(node.text) && !bindings.has(node.text)
      ? compileFunction(node.text)
      : undefined;

  const compileArguments = (
    args: readonly ts.Expression[],
    scope: Scope,
    isOwned: boolean,
  ): string[] | undefined => {
    const values = args.map((arg) => compileExpression(arg, scope));
    return values.some((value) => value === undefined)
      ? undefined
      : values.map((value) =>
          isOwned && value !== undefined && !value.isFresh
            ? `LOwn(${value.text})`
            : (value?.text ?? ""),
        );
  };

  // An arrow function that a method calls on each element and its index, as a TLA+ LAMBDA of
  // them that gives its result, owned where the method keeps it, and writes nothing.
  const compileCallback = (
    node: ts.Expression | undefined,
    scope: Scope,
    isOwned: boolean,
  ): string | undefined => {
    if (
      node === undefined ||
      !ts.isArrowFunction(node) ||
      node.parameters.length > 2 ||
      node.parameters.some(
        (parameter) =>
          !ts.isIdentifier(parameter.name) ||
          parameter.initializer !== undefined ||
          parameter.dotDotDotToken !== undefined,
      ) ||
      (ts.getModifiers(node) ?? []).length > 0
    ) {
      return undefined;
    }
    const params = [fresh("p"), fresh("p")];
    const locals = new Map(scope.locals);
    node.parameters.forEach((parameter, index) =>
      locals.set((parameter.name as ts.Identifier).text, params[index]),
    );
    const inner = { ...scope, locals };
    const state = { isPure: true, isFresh: true };
    const body = ts.isBlock(node.body)
      ? (() => {
          const text = compileStatements(
            node.body.statements,
            inner,
            (m, w) => result(m, w, "Undefined"),
            state,
          );
          return text === undefined ? undefined : { text: `LValue(${text})`, isFresh: false };
        })()
      : compileExpression(node.body, inner);
    return body === undefined || !state.isPure
      ? undefined
      : `LAMBDA ${params.join(", ")} : ${isOwned && !body.isFresh ? `LOwn(${body.text})` : body.text}`;
  };

  // Whether a name is the realm's global, which no local, binding or function of the module takes.
  const isRealmGlobal = (name: string, scope: Scope) =>
    !scope.locals.has(name) && !bindings.has(name) && !functions.has(name);

  // The values an iterator gives, as an array, where it's a Set's or an array's values() or an
  // iterator helper's filter or map of one, which calls its callback on each value and its index in
  // turn, as the iterator that reads it asks.
  const compileIterator = (node: ts.Expression, scope: Scope): Value | undefined => {
    if (
      !ts.isCallExpression(node) ||
      node.questionDotToken !== undefined ||
      !ts.isPropertyAccessExpression(node.expression) ||
      node.expression.questionDotToken !== undefined ||
      !ts.isIdentifier(node.expression.name)
    ) {
      return undefined;
    }
    const method = node.expression.name.text;
    if (method === "values" && node.arguments.length === 0) {
      const receiver = compileExpression(node.expression.expression, scope);
      return receiver === undefined
        ? undefined
        : { text: `LValues(${receiver.text})`, isFresh: false };
    }
    if ((method !== "filter" && method !== "map") || node.arguments.length !== 1) return undefined;
    const iterator = compileIterator(node.expression.expression, scope);
    const callback = compileCallback(node.arguments[0], scope, method === "map");
    return iterator === undefined || callback === undefined
      ? undefined
      : {
          text: `${method === "map" ? "LMap" : "LFilter"}(${iterator.text}, ${callback})`,
          isFresh: false,
        };
  };

  // A call of a module function that writes nothing, whose parameters it's given in order.
  const compileCall = (node: ts.CallExpression, scope: Scope): Value | undefined => {
    const callee = getCallee(node.expression, scope);
    if (callee !== undefined) {
      const fn = functions.get((node.expression as ts.Identifier).text);
      const values = node.arguments.map((arg, index) =>
        ts.isObjectLiteralExpression(arg) && fn !== undefined && isReadOnlyParameter(fn, index)
          ? compileObjectLiteral(arg, scope, true)
          : compileExpression(arg, scope),
      );
      const args = values.some((value) => value === undefined)
        ? undefined
        : values.map((value) => value?.text ?? "");
      if (!callee.isPure || args === undefined || fn === undefined) return undefined;
      if (args.length > fn.parameters.length) return undefined;
      const padded = [...args, ...fn.parameters.slice(args.length).map(() => "Undefined")];
      return {
        text: `LValue(${callee.operator}(${[scope.m, scope.w, ...padded].join(", ")}))`,
        isFresh: callee.isFresh,
      };
    }
    // Array.from({ length }, callback), where Array is the realm's.
    const source = node.arguments[0];
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "Array" &&
      !scope.locals.has("Array") &&
      !bindings.has("Array") &&
      !functions.has("Array") &&
      node.expression.name.text === "from" &&
      node.arguments.length === 2 &&
      source !== undefined &&
      ts.isObjectLiteralExpression(source) &&
      source.properties.length === 1 &&
      ts.isPropertyAssignment(source.properties[0]) &&
      ts.isIdentifier(source.properties[0].name) &&
      source.properties[0].name.text === "length"
    ) {
      const length = compileExpression(source.properties[0].initializer, scope);
      const callback = compileCallback(node.arguments[1], scope, true);
      return length === undefined || callback === undefined
        ? undefined
        : { text: `LFrom(${length.text}, ${callback})`, isFresh: true };
    }
    // Math's functions of one Number, where Math is the realm's, which read only their first
    // argument.
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "Math" &&
      isRealmGlobal("Math", scope) &&
      MATH_FUNCTIONS.has(node.expression.name.text) &&
      node.arguments.length >= 1
    ) {
      const args = compileArguments(node.arguments, scope, false);
      return args === undefined
        ? undefined
        : { text: `LMath("${node.expression.name.text}", ${args[0]})`, isFresh: false };
    }
    // Object.values(o), where Object is the realm's.
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "Object" &&
      isRealmGlobal("Object", scope) &&
      node.expression.name.text === "values" &&
      node.arguments.length === 1
    ) {
      const object = compileExpression(node.arguments[0], scope);
      return object === undefined
        ? undefined
        : { text: `LObjectValues(${object.text})`, isFresh: false };
    }
    if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.name)) {
      const method = node.expression.name.text;
      // A Set's method of another Set, whose Set holds primitives alone, so that nothing else
      // holds what it holds.
      if (SET_METHODS.has(method) && node.arguments.length === 1) {
        const receiver = compileExpression(node.expression.expression, scope);
        const other = compileExpression(node.arguments[0], scope);
        return receiver === undefined || other === undefined
          ? undefined
          : {
              text: `LSetMethod(${receiver.text}, "${method}", ${other.text})`,
              isFresh: SET_MAKERS.has(method),
            };
      }
      const iterating = CALLBACK_METHODS.get(method);
      if (iterating !== undefined || method === "slice") {
        // An iterator's every, some and find give a value, and its filter and map an iterator,
        // which only compileIterator reads.
        const iterator = compileIterator(node.expression.expression, scope);
        if (iterator !== undefined && (method === "filter" || method === "map")) return undefined;
        const receiver = iterator ?? compileExpression(node.expression.expression, scope);
        if (receiver === undefined || (iterator !== undefined && method === "slice")) {
          return undefined;
        }
        if (method === "slice") {
          const args = compileArguments(node.arguments, scope, false);
          return args === undefined || args.length > 2
            ? undefined
            : {
                text: `LSlice(${receiver.text}, ${args[0] ?? "Undefined"}, ${args[1] ?? "Undefined"})`,
                isFresh: false,
              };
        }
        const callback =
          node.arguments.length === 1
            ? compileCallback(node.arguments[0], scope, method === "map")
            : undefined;
        return callback === undefined || iterating === undefined
          ? undefined
          : {
              text: `${iterating}(${receiver.text}, ${callback})`,
              isFresh: method === "map",
            };
      }
      // sort on an array that the expression just made, which nothing else holds, by a comparator
      // that only subtracts its parameters, or by none.
      if (method === "sort") {
        const receiver = compileExpression(node.expression.expression, scope);
        const order =
          node.arguments.length === 0 ? "string" : getComparatorOrder(node.arguments[0]);
        return receiver === undefined ||
          !receiver.isFresh ||
          order === undefined ||
          node.arguments.length > 1
          ? undefined
          : { text: `LSort(${receiver.text}, "${order}")`, isFresh: true };
      }
      if (method === "with") {
        const receiver = compileExpression(node.expression.expression, scope);
        const args = compileArguments(node.arguments, scope, false);
        return receiver === undefined || args?.length !== 2
          ? undefined
          : { text: `LWith(${receiver.text}, ${args[0]}, ${args[1]})`, isFresh: true };
      }
      // A method that doesn't change its receiver, on any lowered value.
      if (!METHODS.has(method) || MUTATORS.has(method)) return undefined;
      const receiver = compileExpression(node.expression.expression, scope);
      const args = compileArguments(node.arguments, scope, false);
      if (receiver === undefined || args === undefined) return undefined;
      return {
        text: `LMethod(${receiver.text}, "${method}", <<${args.join(", ")}>>).v`,
        isFresh: false,
      };
    }
    return undefined;
  };

  // An object literal, which owns each composite it holds unless it's borrowed: passed to a
  // parameter that only reads it, so that no two places can write one object.
  const compileObjectLiteral = (
    node: ts.ObjectLiteralExpression,
    scope: Scope,
    isBorrowed: boolean,
  ): Value | undefined => {
    let text = "LEmptyObject";
    for (const property of node.properties) {
      if (ts.isSpreadAssignment(property)) {
        const value = compileExpression(property.expression, scope);
        if (value === undefined) return undefined;
        text = `LSpread(${text}, ${value.text})`;
        continue;
      }
      const name = property.name;
      const key =
        name !== undefined && (ts.isIdentifier(name) || ts.isStringLiteral(name))
          ? name.text
          : undefined;
      if (key === undefined || key === "__proto__" || isIndexKey(key)) return undefined;
      const value = ts.isPropertyAssignment(property)
        ? compileExpression(property.initializer, scope)
        : ts.isShorthandPropertyAssignment(property) &&
            property.objectAssignmentInitializer === undefined
          ? compileExpression(property.name, scope)
          : undefined;
      if (value === undefined) return undefined;
      text = `LPut(${text}, ${getUnits(key)}, ${value.isFresh || isBorrowed ? value.text : `LOwn(${value.text})`})`;
    }
    return { text, isFresh: true };
  };

  const compileExpression = (node: ts.Expression, scope: Scope): Value | undefined => {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node)
    ) {
      return compileExpression(node.expression, scope);
    }
    if (ts.isNumericLiteral(node)) {
      return { text: getConstant(`Num(${getNumber(Number(node.text))})`), isFresh: false };
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      return { text: getConstant(`Str(${getUnits(node.text)})`), isFresh: false };
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) return { text: "True", isFresh: false };
    if (node.kind === ts.SyntaxKind.FalseKeyword) return { text: "False", isFresh: false };
    if (node.kind === ts.SyntaxKind.NullKeyword) return { text: "Null", isFresh: false };
    if (ts.isIdentifier(node)) {
      const local = scope.locals.get(node.text);
      if (local !== undefined) return { text: local, isFresh: false };
      if (bindings.has(node.text)) return { text: `${scope.m}.${node.text}`, isFresh: false };
      return node.text === "undefined" && !functions.has(node.text)
        ? { text: "Undefined", isFresh: false }
        : undefined;
    }
    if (ts.isPropertyAccessExpression(node)) {
      const object = compileExpression(node.expression, scope);
      return node.questionDotToken !== undefined ||
        !ts.isIdentifier(node.name) ||
        object === undefined
        ? undefined
        : { text: `LGet(${object.text}, ${getUnits(node.name.text)})`, isFresh: false };
    }
    if (ts.isElementAccessExpression(node)) {
      const object = compileExpression(node.expression, scope);
      const key = compileExpression(node.argumentExpression, scope);
      return node.questionDotToken !== undefined || object === undefined || key === undefined
        ? undefined
        : { text: `LIndex(${object.text}, ${key.text})`, isFresh: false };
    }
    if (ts.isPrefixUnaryExpression(node)) {
      const operand = compileExpression(node.operand, scope);
      if (operand === undefined) return undefined;
      const operator = new Map([
        [ts.SyntaxKind.ExclamationToken, "LNot"],
        [ts.SyntaxKind.MinusToken, "LNegate"],
        [ts.SyntaxKind.PlusToken, "LPlus"],
      ]).get(node.operator);
      return operator === undefined
        ? undefined
        : { text: `${operator}(${operand.text})`, isFresh: false };
    }
    if (ts.isConditionalExpression(node)) {
      const condition = compileExpression(node.condition, scope);
      const whenTrue = compileExpression(node.whenTrue, scope);
      const whenFalse = compileExpression(node.whenFalse, scope);
      if (condition === undefined || whenTrue === undefined || whenFalse === undefined)
        return undefined;
      const name = fresh("c");
      return {
        text: `(LET ${name} == ${condition.text} IN IF ${name}.type = "bail" THEN LBail ELSE IF LTruthy(${name}) THEN ${whenTrue.text} ELSE ${whenFalse.text})`,
        isFresh: whenTrue.isFresh && whenFalse.isFresh,
      };
    }
    if (ts.isBinaryExpression(node)) {
      const kind = node.operatorToken.kind;
      const left = compileExpression(node.left, scope);
      const right = compileExpression(node.right, scope);
      if (left === undefined || right === undefined) return undefined;
      const arithmetic = ARITHMETIC.get(kind);
      if (arithmetic !== undefined) {
        return { text: `LArith("${arithmetic}", ${left.text}, ${right.text})`, isFresh: false };
      }
      const relation = RELATIONS.get(kind);
      if (relation !== undefined) {
        return { text: `LRelation("${relation}", ${left.text}, ${right.text})`, isFresh: false };
      }
      const equality = new Map([
        [ts.SyntaxKind.EqualsEqualsEqualsToken, `LStrict(${left.text}, ${right.text})`],
        [ts.SyntaxKind.ExclamationEqualsEqualsToken, `LNot(LStrict(${left.text}, ${right.text}))`],
        [ts.SyntaxKind.EqualsEqualsToken, `LLoose(${left.text}, ${right.text})`],
        [ts.SyntaxKind.ExclamationEqualsToken, `LNot(LLoose(${left.text}, ${right.text}))`],
      ]).get(kind);
      if (equality !== undefined) return { text: equality, isFresh: false };
      const name = fresh("c");
      const isFresh = left.isFresh && right.isFresh;
      if (kind === ts.SyntaxKind.AmpersandAmpersandToken || kind === ts.SyntaxKind.BarBarToken) {
        const isAnd = kind === ts.SyntaxKind.AmpersandAmpersandToken;
        return {
          text: `(LET ${name} == ${left.text} IN IF ${name}.type = "bail" THEN LBail ELSE IF ${isAnd ? "" : "~"}LTruthy(${name}) THEN ${right.text} ELSE ${name})`,
          isFresh,
        };
      }
      if (kind === ts.SyntaxKind.QuestionQuestionToken) {
        return {
          text: `(LET ${name} == ${left.text} IN IF ${name}.type = "bail" THEN LBail ELSE IF ${name}.type \\in {"undefined", "null"} THEN ${right.text} ELSE ${name})`,
          isFresh,
        };
      }
      return undefined;
    }
    if (ts.isObjectLiteralExpression(node)) return compileObjectLiteral(node, scope, false);
    if (ts.isArrayLiteralExpression(node)) {
      if (node.elements.some(ts.isOmittedExpression)) return undefined;
      // A spread of an array or a Set gives its elements, and each run of other elements
      // between spreads gives them.
      const parts: string[] = [];
      for (const [index, element] of node.elements.entries()) {
        if (ts.isSpreadElement(element)) {
          const spread = compileExpression(element.expression, scope);
          if (spread === undefined) return undefined;
          parts.push(`LSpreadElems(${spread.text})`);
        } else if (index === 0 || ts.isSpreadElement(node.elements[index - 1])) {
          const end = node.elements.findIndex(
            (other, at) => at > index && ts.isSpreadElement(other),
          );
          const owned = compileArguments(
            node.elements.slice(index, end === -1 ? undefined : end),
            scope,
            true,
          );
          if (owned === undefined) return undefined;
          parts.push(`<<${owned.join(", ")}>>`);
        }
      }
      return {
        text: `LArray(${parts.length === 0 ? "<<>>" : parts.join(" \\o ")})`,
        isFresh: true,
      };
    }
    if (ts.isCallExpression(node) && node.questionDotToken === undefined)
      return compileCall(node, scope);
    // new Set(iterable), where Set is the realm's, of primitives alone, which nothing else holds.
    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "Set" &&
      isRealmGlobal("Set", scope) &&
      (node.arguments ?? []).length <= 1
    ) {
      const source = node.arguments?.[0];
      const values =
        source === undefined
          ? { text: "Undefined", isFresh: false }
          : (compileIterator(source, scope) ?? compileExpression(source, scope));
      return values === undefined ? undefined : { text: `LNewSet(${values.text})`, isFresh: true };
    }
    return undefined;
  };

  // A path to a value the state holds: a binding the state lowers and the keys from it, which
  // an assignment or a mutator changes. Each step gives the TLA+ of its container and key.
  const getPath = (
    node: ts.Expression,
    scope: Scope,
  ): { root: string; keys: string[] } | undefined => {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isAsExpression(node)
    ) {
      return getPath(node.expression, scope);
    }
    if (ts.isIdentifier(node)) {
      return isBinding(node.text, scope) ? { root: node.text, keys: [] } : undefined;
    }
    if (
      ts.isPropertyAccessExpression(node) &&
      node.questionDotToken === undefined &&
      ts.isIdentifier(node.name)
    ) {
      const base = getPath(node.expression, scope);
      return base === undefined
        ? undefined
        : { root: base.root, keys: [...base.keys, `Str(${getUnits(node.name.text)})`] };
    }
    if (ts.isElementAccessExpression(node) && node.questionDotToken === undefined) {
      const base = getPath(node.expression, scope);
      const key = compileExpression(node.argumentExpression, scope);
      return base === undefined || key === undefined
        ? undefined
        : { root: base.root, keys: [...base.keys, key.text] };
    }
    return undefined;
  };

  // The text that replaces the value at a path with change(value), where change gives the new
  // value's text, or a record [c, v] of it and a result, and continues with rest.
  const updatePath = (
    path: { root: string; keys: string[] },
    scope: Scope,
    change: (value: string) => string,
    rest: (m: string, result: string) => string | undefined,
  ): string | undefined => {
    const names = path.keys.map(() => fresh("k"));
    const containers = [`${scope.m}.${path.root}`, ...path.keys.map(() => fresh("o"))];
    const reads = path.keys.map(
      (key, index) =>
        `${names[index]} == ${key}\n  ${containers[index + 1]} == LIndex(${containers[index]}, ${names[index]})`,
    );
    const changed = fresh("r");
    const rebuilt = path.keys.reduceRight(
      (inner, _, index) => `LAssign(${containers[index]}, ${names[index]}, ${inner})`,
      `${changed}.c`,
    );
    const updated = fresh("u");
    const m = fresh("m");
    const next = rest(m, `${changed}.v`);
    return next === undefined
      ? undefined
      : `LET ${[...reads, `${changed} == ${change(containers.at(-1) ?? "")}`, `${updated} == ${rebuilt}`].join("\n  ")}\n  IN IF ${updated}.type = "bail" THEN LBail ELSE\n  LET ${m} == [${scope.m} EXCEPT !.${path.root} = ${updated}] IN\n  ${next}`;
  };

  // The binding and the depth of the object that an expression's path of properties ends in, or
  // undefined for a path from anything but a name.
  const getPathRoot = (node: ts.Expression): { root: string; depth: number } | undefined => {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isAsExpression(node)
    ) {
      return getPathRoot(node.expression);
    }
    if (ts.isIdentifier(node)) return { root: node.text, depth: 0 };
    if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node))
      return undefined;
    const base = getPathRoot(node.expression);
    return base === undefined ? undefined : { root: base.root, depth: base.depth + 1 };
  };

  // The object that a node changes in place, as the binding and depth of its path, "any" where it
  // may change any, or undefined where it changes none.
  const getChange = (node: ts.Node): { root: string; depth: number } | "any" | undefined => {
    if (
      ts.isBinaryExpression(node) &&
      (node.operatorToken.kind === ts.SyntaxKind.EqualsToken ||
        COMPOUND.has(node.operatorToken.kind))
    ) {
      if (ts.isIdentifier(node.left)) return undefined;
      const target = getPathRoot(node.left);
      return target === undefined ? "any" : { root: target.root, depth: target.depth - 1 };
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken)
    ) {
      if (ts.isIdentifier(node.operand)) return undefined;
      const target = getPathRoot(node.operand);
      return target === undefined ? "any" : { root: target.root, depth: target.depth - 1 };
    }
    if (ts.isDeleteExpression(node)) return "any";
    if (!ts.isCallExpression(node)) return undefined;
    if (ts.isIdentifier(node.expression) && functions.has(node.expression.text)) {
      return compileFunction(node.expression.text)?.isPure === true ? undefined : "any";
    }
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.name) &&
      MUTATORS.has(node.expression.name.text)
    ) {
      return getPathRoot(node.expression.expression) ?? "any";
    }
    return undefined;
  };

  // Whether code after a position in a function may change in place the object at a depth of a
  // binding's path, or one that it holds: a change of a binding's object holds of no deeper one, as
  // no object of the state is held twice.
  const isChangedAfter = (body: ts.Node, position: number, root: string, depth: number) => {
    const isChanged = (node: ts.Node): boolean => {
      if (node.getStart() >= position) {
        const change = getChange(node);
        if (
          change === "any" ||
          (change !== undefined &&
            (!bindings.has(change.root) || (change.root === root && change.depth >= depth)))
        ) {
          return true;
        }
      }
      return ts.forEachChild(node, isChanged) ?? false;
    };
    return isChanged(body);
  };

  // Whether a name is read after a position in a function.
  const isReadAfter = (body: ts.Node, position: number, name: string) => {
    const isRead = (node: ts.Node): boolean =>
      (ts.isIdentifier(node) && node.text === name && node.getStart() >= position) ||
      (ts.forEachChild(node, isRead) ?? false);
    return isRead(body);
  };

  // Whether a function declares a name once, so that each of its reads names that declaration.
  const isDeclaredOnce = (body: ts.Node, name: string) => {
    let count = 0;
    const visit = (node: ts.Node): void => {
      if (
        (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) &&
        ts.isIdentifier(node.name) &&
        node.name.text === name
      ) {
        count += 1;
      }
      ts.forEachChild(node, visit);
    };
    visit(body);
    return count === 1;
  };

  const isExiting = (statement: ts.Statement): boolean =>
    ts.isReturnStatement(statement) ||
    (ts.isBlock(statement) && statement.statements.some(isExiting)) ||
    (ts.isIfStatement(statement) &&
      statement.elseStatement !== undefined &&
      isExiting(statement.thenStatement) &&
      isExiting(statement.elseStatement));

  const result = (m: string, w: string, value: string) =>
    `[type |-> "ok", m |-> ${m}, w |-> ${w}, v |-> ${value}]`;

  // The statements from index on, which a function's code runs in turn, and then rest.
  const compileStatements = (
    statements: readonly ts.Statement[],
    scope: Scope,
    rest: Rest,
    state: { isPure: boolean; isFresh: boolean },
  ): string | undefined => {
    if (statements.length === 0) return rest(scope.m, scope.w);
    const statement = statements[0];
    const after = statements.slice(1);
    const next: Rest = (m, w) => compileStatements(after, { ...scope, m, w }, rest, state);
    if (ts.isEmptyStatement(statement)) return next(scope.m, scope.w);
    if (ts.isReturnStatement(statement)) {
      const value =
        statement.expression === undefined
          ? { text: "Undefined", isFresh: false }
          : compileExpression(statement.expression, scope);
      if (value === undefined) return undefined;
      // A constant that holds what the body just made gives it, as a store of it before the
      // return, which reads it again, owns a copy.
      const local =
        statement.expression !== undefined && ts.isIdentifier(statement.expression)
          ? scope.locals.get(statement.expression.text)
          : undefined;
      if (!value.isFresh && (local === undefined || !scope.fresh.has(local))) state.isFresh = false;
      const name = fresh("v");
      return `LET ${name} == ${value.text} IN IF ${name}.type = "bail" THEN LBail ELSE ${result(scope.m, scope.w, name)}`;
    }
    if (ts.isBlock(statement)) {
      return compileStatements(statement.statements, scope, (m, w) => next(m, w), state);
    }
    if (ts.isVariableStatement(statement)) {
      const isBlockScoped = (statement.declarationList.flags & ts.NodeFlags.BlockScoped) !== 0;
      const declarations = statement.declarationList.declarations;
      if (
        !isBlockScoped ||
        declarations.some(
          (declaration) =>
            !ts.isIdentifier(declaration.name) || declaration.initializer === undefined,
        )
      ) {
        return undefined;
      }
      const locals = new Map(scope.locals);
      const held = new Set(scope.fresh);
      const lines: string[] = [];
      for (const declaration of declarations) {
        const initializer = declaration.initializer as ts.Expression;
        const inner = { ...scope, locals };
        const value = compileExpression(initializer, inner);
        if (value === undefined) return undefined;
        const name = fresh("l");
        const text = (declaration.name as ts.Identifier).text;
        // A constant holds an object that an expression just made, or one that the state holds
        // where nothing that follows changes it in place, and otherwise no object at all.
        const path = value.isFresh ? undefined : getPath(initializer, inner);
        const isHeld =
          value.isFresh ||
          (path !== undefined &&
            !isChangedAfter(scope.body, statement.getEnd(), path.root, path.keys.length));
        lines.push(`${name} == ${isHeld ? value.text : `LOwn(${value.text})`}`);
        if (value.isFresh && isDeclaredOnce(scope.body, text)) held.add(name);
        locals.set(text, name);
      }
      const body = compileStatements(after, { ...scope, locals, fresh: held }, rest, state);
      const names = [...locals.values()].slice(scope.locals.size);
      return body === undefined
        ? undefined
        : `LET ${lines.join("\n      ")}\n  IN IF ${names.map((name) => `${name}.type = "bail"`).join(" \\/ ")} THEN LBail ELSE\n  ${body}`;
    }
    if (ts.isIfStatement(statement)) {
      const condition = compileExpression(statement.expression, scope);
      if (condition === undefined) return undefined;
      const name = fresh("c");
      const isJoined =
        !isExiting(statement.thenStatement) ||
        (statement.elseStatement !== undefined && !isExiting(statement.elseStatement));
      // A branch that may run to its end returns to what follows through a record of its state.
      const joined = fresh("j");
      const branchRest: Rest = isJoined
        ? (m, w) => `[type |-> "next", m |-> ${m}, w |-> ${w}, v |-> Undefined]`
        : next;
      const whenTrue = compileStatements([statement.thenStatement], scope, branchRest, state);
      const whenFalse =
        statement.elseStatement === undefined
          ? branchRest(scope.m, scope.w)
          : compileStatements([statement.elseStatement], scope, branchRest, state);
      if (whenTrue === undefined || whenFalse === undefined) return undefined;
      const choice = `LET ${name} == ${condition.text} IN IF ${name}.type = "bail" THEN LBail ELSE IF LTruthy(${name}) THEN\n  ${whenTrue}\n  ELSE\n  ${whenFalse}`;
      if (!isJoined) return choice;
      const tail = next(`${joined}.m`, `${joined}.w`);
      return tail === undefined
        ? undefined
        : `LET ${joined} == ${choice}\n  IN IF ${joined}.type # "next" THEN ${joined} ELSE\n  ${tail}`;
    }
    if (ts.isExpressionStatement(statement)) {
      return compileEffect(statement.expression, scope, next, state);
    }
    return undefined;
  };

  // An expression statement: an assignment to what the state holds, a call of a mutator on it or
  // of a module function, or an expression whose value the statement drops.
  const compileEffect = (
    node: ts.Expression,
    scope: Scope,
    next: Rest,
    state: { isPure: boolean; isFresh: boolean },
  ): string | undefined => {
    const written = (m: string) => {
      state.isPure = false;
      return next(m, "TRUE");
    };
    if (ts.isParenthesizedExpression(node))
      return compileEffect(node.expression, scope, next, state);
    if (ts.isBinaryExpression(node)) {
      const kind = node.operatorToken.kind;
      const operator = COMPOUND.get(kind);
      if (kind !== ts.SyntaxKind.EqualsToken && operator === undefined) return undefined;
      const value = compileExpression(node.right, scope);
      const target = node.left;
      if (value === undefined) return undefined;
      // A constant that holds what nothing else holds gives it to the state where nothing that
      // follows reads the constant again.
      const local = ts.isIdentifier(node.right) ? scope.locals.get(node.right.text) : undefined;
      const isGiven =
        local !== undefined &&
        scope.fresh.has(local) &&
        !isReadAfter(scope.body, node.getEnd(), (node.right as ts.Identifier).text);
      const owned = value.isFresh || isGiven ? value.text : `LOwn(${value.text})`;
      if (ts.isIdentifier(target)) {
        if (!isBinding(target.text, scope) || !mutable.has(target.text)) return undefined;
        const name = fresh("v");
        const m = fresh("m");
        const assigned =
          operator === undefined
            ? owned
            : `LArith("${operator}", ${scope.m}.${target.text}, ${value.text})`;
        const body = written(m);
        return body === undefined
          ? undefined
          : `LET ${name} == ${assigned} IN IF ${name}.type = "bail" THEN LBail ELSE\n  LET ${m} == [${scope.m} EXCEPT !.${target.text} = ${name}] IN\n  ${body}`;
      }
      const path =
        ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)
          ? getPath(target, scope)
          : undefined;
      if (path === undefined || path.keys.length === 0) return undefined;
      const container = { root: path.root, keys: path.keys.slice(0, -1) };
      const key = fresh("k");
      return updatePath(
        container,
        scope,
        (object) =>
          `LET ${key} == ${path.keys.at(-1)} IN [c |-> LAssign(${object}, ${key}, ${operator === undefined ? owned : `LArith("${operator}", LIndex(${object}, ${key}), ${value.text})`}), v |-> Undefined]`,
        (m) => written(m),
      );
    }
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
      const delta =
        node.operator === ts.SyntaxKind.PlusPlusToken
          ? 1
          : node.operator === ts.SyntaxKind.MinusMinusToken
            ? -1
            : 0;
      if (delta === 0) return undefined;
      const target = node.operand;
      if (ts.isIdentifier(target)) {
        if (!isBinding(target.text, scope) || !mutable.has(target.text)) return undefined;
        const name = fresh("v");
        const m = fresh("m");
        const body = written(m);
        return body === undefined
          ? undefined
          : `LET ${name} == LIncrement(${scope.m}.${target.text}, ${delta}) IN IF ${name}.type = "bail" THEN LBail ELSE\n  LET ${m} == [${scope.m} EXCEPT !.${target.text} = ${name}] IN\n  ${body}`;
      }
      const path = getPath(target, scope);
      if (path === undefined || path.keys.length === 0) return undefined;
      const key = fresh("k");
      return updatePath(
        { root: path.root, keys: path.keys.slice(0, -1) },
        scope,
        (object) =>
          `LET ${key} == ${path.keys.at(-1)} IN [c |-> LAssign(${object}, ${key}, LIncrement(LIndex(${object}, ${key}), ${delta})), v |-> Undefined]`,
        (m) => written(m),
      );
    }
    if (ts.isCallExpression(node) && node.questionDotToken === undefined) {
      const callee = getCallee(node.expression, scope);
      const fn = ts.isIdentifier(node.expression) ? functions.get(node.expression.text) : undefined;
      if (callee !== undefined && fn !== undefined) {
        const args = compileArguments(node.arguments, scope, !callee.isPure);
        if (args === undefined || args.length > fn.parameters.length) return undefined;
        const padded = [...args, ...fn.parameters.slice(args.length).map(() => "Undefined")];
        const name = fresh("r");
        if (!callee.isPure) state.isPure = false;
        const body = next(`${name}.m`, `${name}.w`);
        return body === undefined
          ? undefined
          : `LET ${name} == ${callee.operator}(${[scope.m, scope.w, ...padded].join(", ")}) IN IF ${name}.type = "bail" THEN LBail ELSE\n  ${body}`;
      }
      if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.name)) {
        const method = node.expression.name.text;
        const path = getPath(node.expression.expression, scope);
        const values = node.arguments.map((arg) => compileExpression(arg, scope));
        const args = values.some((value) => value === undefined)
          ? undefined
          : values.map((value) =>
              value === undefined || value.isFresh ? (value?.text ?? "") : `LOwn(${value.text})`,
            );
        // A composite that the expression just made becomes a Map's value or a Set's element,
        // which the collection then owns; a key stays a primitive.
        const owned =
          (method === "set" && values.length === 2 && values[1]?.isFresh === true) ||
          (method === "add" && values.length === 1 && values[0]?.isFresh === true)
            ? `${method}Owned`
            : method;
        if (MUTATORS.has(method) && path !== undefined && args !== undefined) {
          return updatePath(
            path,
            scope,
            (object) => `LMethod(${object}, "${owned}", <<${args.join(", ")}>>)`,
            (m) => written(m),
          );
        }
      }
    }
    const value = compileExpression(node, scope);
    if (value === undefined) return undefined;
    const name = fresh("v");
    const body = next(scope.m, scope.w);
    return body === undefined
      ? undefined
      : `LET ${name} == ${value.text} IN IF ${name}.type = "bail" THEN LBail ELSE\n  ${body}`;
  };

  // A module function's operator, compiled once, or undefined where its code goes beyond what
  // runs natively.
  const compileFunction = (name: string): Compiled | undefined => {
    if (compiled.has(name)) return compiled.get(name);
    // A function that calls itself takes its operator as it compiles, as one that writes nothing,
    // which it must turn out to be; one that another function it calls calls runs on ESCore.
    const innermost = compiling.at(-1);
    if (innermost?.name === name) {
      innermost.isRecursive = true;
      return { operator: innermost.operator, isPure: true, isFresh: false };
    }
    if (compiling.some((entry) => entry.name === name)) return undefined;
    const fn = functions.get(name);
    compiled.set(name, undefined);
    if (
      fn === undefined ||
      fn.asteriskToken !== undefined ||
      (ts.getModifiers(fn) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
    ) {
      return undefined;
    }
    const usesThis = (node: ts.Node): boolean =>
      node.kind === ts.SyntaxKind.ThisKeyword ||
      (ts.isIdentifier(node) && node.text === "arguments") ||
      ((!ts.isFunctionLike(node) || node === fn) && (ts.forEachChild(node, usesThis) ?? false));
    if (
      fn.parameters.some(
        (parameter) =>
          !ts.isIdentifier(parameter.name) ||
          parameter.initializer !== undefined ||
          parameter.dotDotDotToken !== undefined,
      ) ||
      usesThis(fn)
    ) {
      return undefined;
    }
    const params = fn.parameters.map(() => fresh("p"));
    const operator = fresh("Native");
    const entry = { name, operator, isRecursive: false };
    compiled.delete(name);
    compiling.push(entry);
    const scope: Scope = {
      m: "m",
      w: "w",
      body: fn,
      fresh: new Set(),
      locals: new Map(
        fn.parameters.map((parameter, index) => [
          (parameter.name as ts.Identifier).text,
          params[index],
        ]),
      ),
    };
    const state = { isPure: true, isFresh: true };
    const body = fn.body;
    const text =
      body === undefined
        ? undefined
        : ts.isBlock(body)
          ? compileStatements(
              body.statements,
              scope,
              (m, w) => {
                // A path that runs to the end returns undefined, which isn't what the body made.
                state.isFresh = false;
                return result(m, w, "Undefined");
              },
              state,
            )
          : (() => {
              const value = compileExpression(body, scope);
              const v = fresh("v");
              if (value?.isFresh !== true) state.isFresh = false;
              return value === undefined
                ? undefined
                : `LET ${v} == ${value.text} IN IF ${v}.type = "bail" THEN LBail ELSE ${result("m", "w", v)}`;
            })();
    compiling.pop();
    if (text === undefined || (entry.isRecursive && !state.isPure)) {
      compiled.set(name, undefined);
      return undefined;
    }
    const formals = ["m", "w", ...params];
    if (entry.isRecursive)
      definitions.push(`RECURSIVE ${operator}(${formals.map(() => "_").join(", ")})`);
    definitions.push(`${operator}(${formals.join(", ")}) ==\n  ${text}`);
    const done = { operator, isPure: state.isPure, isFresh: state.isFresh && !entry.isRecursive };
    compiled.set(name, done);
    return done;
  };

  const getExpressionOperator = (node: ts.Expression, parameters: string[]) => {
    const params = parameters.map(() => fresh("p"));
    const scope: Scope = {
      m: "m",
      w: "w",
      body: node,
      fresh: new Set(),
      locals: new Map(parameters.map((parameter, index) => [parameter, params[index]])),
    };
    const value = compileExpression(node, scope);
    if (value === undefined) return undefined;
    const operator = fresh("Native");
    const v = fresh("v");
    definitions.push(
      `${operator}(${["m", "w", ...params].join(", ")}) ==\n  LET ${v} == ${value.text} IN IF ${v}.type = "bail" THEN LBail ELSE ${result("m", "w", v)}`,
    );
    return operator;
  };

  return {
    definitions,
    getOperator: (name) => compileFunction(name)?.operator,
    getExpressionOperator,
  };
};
