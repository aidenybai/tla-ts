import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";
import { isJavaScriptFile } from "./common-js";
import { skipCasts } from "./context";
import { getRegularExpressionError } from "./early-errors";

// TypeScript infers JavaScript's types without checking them, so a JavaScript value may hold
// another type than TypeScript gives it. The errors that TypeScript reports where it checks the
// file show where. tla-ts makes the value at each one any, which its run-time kind checks guard,
// or makes any the declaration whose type a write breaks, and stops at an error it can't.

// A JSDoc cast of a value to a type, which TypeScript reads around a parenthesized expression.
const getCast = (type: string) => `/** @type {${type}} */ (`;

const ANY = "/** @type {any} */ ";

// Errors about types that hold: a comma's operand that gives nothing it uses, which still runs, a
// setter's return of a value, which the write drops, an implicit any, a module that TypeScript
// can't find, or a name that no declaration binds, which tla-ts resolves as Node does, a property
// that the type lacks, which TypeScript reads as any, as it does a class field's computed key that
// it leaves out of the type, and a read before a declaration, which throws as tla-ts follows.
const IGNORED_ERRORS = new Set([
  1166, 1170, 2695, 2304, 2307, 2792, 2408, 2339, 2448, 2449, 2450, 2550, 2551, 2552, 2580, 2581,
  2582, 2583, 2584, 2591, 2592, 2593, 2662, 2663, 2683, 2867, 2868, 7005, 7006, 7008, 7010, 7011,
  7015, 7016, 7017, 7018, 7019, 7022, 7023, 7024, 7025, 7031, 7032, 7033, 7034, 7041, 7052, 7053,
  7055, 7056, 7057,
]);

// A property that the type lacks, which a private name's class declares.
const PRIVATE_NAME_ERRORS = new Set([2339, 2551]);

// A value that may be null or undefined, whose type holds, which tla-ts reads as such, but for one
// that is only null or undefined, which it reads as any value, as the read throws.
const NULLABLE_ERRORS = new Set([2531, 2532, 2533, 2721, 2722, 2723, 18047, 18048, 18049]);

// A value of another type than the declaration, the parameter, or the property that takes it.
const ASSIGNED_ERRORS = new Set([
  2322, 2326, 2345, 2375, 2379, 2412, 2418, 2559, 2739, 2740, 2741, 2769, 4104,
]);

// An object literal's property that the type that takes the object lacks.
const EXCESS_PROPERTY_ERRORS = new Set([2353, 2561]);

// A write to a property that the type makes read-only.
const READ_ONLY_ERROR = 2540;

// A value of a type that an operator, a call, a key, a spread, or an iteration doesn't take, or of
// type unknown.
const OPERAND_ERRORS = new Set([
  2356, 2358, 2359, 2360, 2361, 2362, 2363, 2464, 2469, 2488, 2490, 2504, 2538, 2547, 2548, 2549,
  2556, 2571, 2731, 2767, 18046,
]);

// A binary operator whose operands' types don't go together.
const OPERANDS_ERRORS = new Set([2365, 2367]);

// A callee whose type has no call or construct signature.
const CALLEE_ERRORS = new Set([2348, 2349, 2350, 2351, 7009]);

// A call with more or fewer arguments than its signature declares.
const ARGUMENT_COUNT_ERRORS = new Set([2554, 2555, 2810]);

// Declarations of a variable with two types, and a read of a variable before a write.
const DECLARED_ERRORS = new Set([2403, 2454]);

// A delete of a property that the type gives.
const DELETE_ERRORS = new Set([2704, 2790]);

// The errors of types that may not hold, which tla-ts makes hold.
const FIXED_ERRORS = new Set([
  ...NULLABLE_ERRORS,
  ...ASSIGNED_ERRORS,
  ...EXCESS_PROPERTY_ERRORS,
  READ_ONLY_ERROR,
  ...OPERAND_ERRORS,
  ...OPERANDS_ERRORS,
  ...CALLEE_ERRORS,
  ...ARGUMENT_COUNT_ERRORS,
  ...DECLARED_ERRORS,
  ...DELETE_ERRORS,
]);

// The array methods that write the values they take to the array.
const ARRAY_WRITES = new Set(["push", "unshift", "fill", "splice"]);

interface Edit {
  position: number;
  text: string;
}

// Whether an edit of an earlier round cast a node, or the parentheses around it, or typed a
// declaration as any there, so that an error that stays is one that tla-ts can't fix.
const isCast = (position: number, file: ts.SourceFile) =>
  /\/\*\* @type \{[^}]*\} \*\/ \(?$/.test(file.text.slice(Math.max(0, position - 40), position));
const isTyped = (position: number, file: ts.SourceFile) =>
  file.text.slice(position - ANY.length, position) === ANY;

// The deepest node of a diagnostic's span.
const getDiagnosedNode = (file: ts.SourceFile, diagnostic: ts.Diagnostic) => {
  const start = diagnostic.start ?? 0;
  const end = start + (diagnostic.length ?? 0);
  const visit = (node: ts.Node): ts.Node =>
    ts.forEachChild(node, (child) =>
      child.getStart(file) <= start && end <= child.getEnd() ? visit(child) : undefined,
    ) ?? node;
  return visit(file);
};

const isAssignment = (node: ts.Node): node is ts.BinaryExpression =>
  ts.isBinaryExpression(node) &&
  node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
  node.operatorToken.kind <= ts.SyntaxKind.LastAssignment;

// Whether a node is a target that an assignment, an update, or a for-in or for-of head writes,
// through the patterns that hold it.
const isWritten = (node: ts.Node): boolean => {
  const parent = node.parent;
  if (isAssignment(parent)) return parent.left === node;
  if (ts.isForInStatement(parent) || ts.isForOfStatement(parent)) {
    return parent.initializer === node;
  }
  if (ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent)) {
    return (
      parent.operator === ts.SyntaxKind.PlusPlusToken ||
      parent.operator === ts.SyntaxKind.MinusMinusToken
    );
  }
  return (
    (ts.isParenthesizedExpression(parent) ||
      ts.isArrayLiteralExpression(parent) ||
      ts.isObjectLiteralExpression(parent) ||
      ts.isSpreadElement(parent) ||
      ts.isSpreadAssignment(parent) ||
      (ts.isShorthandPropertyAssignment(parent) && parent.name === node) ||
      (ts.isPropertyAssignment(parent) && parent.initializer === node)) &&
    isWritten(parent)
  );
};

// Whether an identifier names a declaration, a property, or a label rather than reading a value.
const isName = (node: ts.Identifier) => {
  const parent = node.parent;
  return (
    ("name" in parent && parent.name === node && !ts.isShorthandPropertyAssignment(parent)) ||
    ("label" in parent && parent.label === node)
  );
};

// The edits that cast an expression to a type: a cast around it, or, for a shorthand property,
// around the value that it names. A part of an optional chain, a target, a delete's operand, and
// super can't be cast.
const castExpression = (node: ts.Node, file: ts.SourceFile, type = "any"): Edit[] | undefined => {
  const parent = node.parent;
  const start = node.getStart(file);
  if (isCast(start, file)) return undefined;
  if (
    ts.isShorthandPropertyAssignment(parent) &&
    parent.name === node &&
    ts.isObjectLiteralExpression(parent.parent) &&
    !isWritten(parent.parent)
  ) {
    return [
      { position: start, text: `${parent.name.text}: ${getCast(type)}` },
      { position: node.getEnd(), text: ")" },
    ];
  }
  const isChained =
    (ts.isPropertyAccessExpression(parent) ||
      ts.isElementAccessExpression(parent) ||
      ts.isCallExpression(parent)) &&
    parent.expression === node &&
    (parent.flags & ts.NodeFlags.OptionalChain) !== 0 &&
    parent.questionDotToken === undefined;
  return !ts.isExpression(node) ||
    (ts.isIdentifier(node) && isName(node)) ||
    node.kind === ts.SyntaxKind.SuperKeyword ||
    ts.isOmittedExpression(node) ||
    ts.isSpreadElement(node) ||
    isChained ||
    isWritten(node) ||
    (ts.isDeleteExpression(parent) && parent.expression === node)
    ? undefined
    : [
        { position: start, text: getCast(type) },
        { position: node.getEnd(), text: ")" },
      ];
};

// The declaration that holds a binding element: a variable's or a parameter's.
const getPatternDeclaration = (node: ts.BindingElement): ts.Node =>
  ts.isBindingElement(node.parent.parent)
    ? getPatternDeclaration(node.parent.parent)
    : node.parent.parent;

// The edits that give a declaration a type: the value that it takes is cast where it has one, as
// tla-ts reads a variable's kind from that value too, and else the declaration is typed any.
const widenDeclaration = (
  declaration: ts.Node,
  file: ts.SourceFile,
  type: string,
): Edit[] | undefined => {
  if (declaration.getSourceFile() !== file) return undefined;
  if (ts.isBindingElement(declaration)) {
    return widenDeclaration(getPatternDeclaration(declaration), file, "any");
  }
  const statement = ts.isVariableDeclaration(declaration) ? declaration.parent.parent : undefined;
  if (statement !== undefined && ts.isForOfStatement(statement)) {
    return castExpression(statement.expression, file);
  }
  if (
    (!ts.isVariableDeclaration(declaration) && !ts.isParameter(declaration)) ||
    (statement !== undefined && ts.isForInStatement(statement))
  ) {
    return undefined;
  }
  if (declaration.initializer !== undefined) {
    return castExpression(declaration.initializer, file, type);
  }
  const position = ts.isParameter(declaration)
    ? declaration.getStart(file)
    : declaration.name.getStart(file);
  return (ts.isIdentifier(declaration.name) || ts.isParameter(declaration)) &&
    !isTyped(position, file)
    ? [{ position, text: ANY }]
    : undefined;
};

// JavaScript's expando writes, such as x.length = 2, also declare the variable they write to, and
// the property.
const isExpandoWrite = (declaration: ts.Node) =>
  ts.isIdentifier(declaration) ||
  ts.isPropertyAccessExpression(declaration) ||
  ts.isElementAccessExpression(declaration) ||
  ts.isBinaryExpression(declaration);

// The edits that give a name's variable a type, where each of its declarations can take it.
const widenName = (
  node: ts.Node,
  file: ts.SourceFile,
  checker: ts.TypeChecker,
  type = "any",
): Edit[] | undefined => {
  if (!ts.isIdentifier(node)) return undefined;
  const symbol = ts.isShorthandPropertyAssignment(node.parent)
    ? checker.getShorthandAssignmentValueSymbol(node.parent)
    : checker.getSymbolAtLocation(node);
  const declarations = (symbol?.declarations ?? []).filter(
    (declaration) => !isExpandoWrite(declaration),
  );
  const edits = declarations.map((declaration) => widenDeclaration(declaration, file, type));
  return declarations.length > 0 && edits.every((edit) => edit !== undefined)
    ? edits.flat()
    : undefined;
};

// The edits that make a property any where an object literal, a class's field, or an expando
// write declares it with a value.
const widenProperty = (
  access: ts.PropertyAccessExpression,
  file: ts.SourceFile,
  checker: ts.TypeChecker,
): Edit[] | undefined => {
  const declarations = checker.getSymbolAtLocation(access.name)?.declarations ?? [];
  const edits = declarations.map((declaration) => {
    if (declaration.getSourceFile() !== file) return undefined;
    if (ts.isPropertyAssignment(declaration) || ts.isPropertyDeclaration(declaration)) {
      return declaration.initializer && castExpression(declaration.initializer, file);
    }
    if (ts.isShorthandPropertyAssignment(declaration)) {
      return castExpression(declaration.name, file);
    }
    const write = ts.isBinaryExpression(declaration) ? declaration : declaration.parent;
    return isAssignment(write) && write.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ? castExpression(write.right, file)
      : undefined;
  });
  return edits.length > 0 && edits.every((edit) => edit !== undefined) ? edits.flat() : undefined;
};

// The edits that make an array's elements any, where a name's variable holds the array.
const widenElements = (receiver: ts.Expression, file: ts.SourceFile, checker: ts.TypeChecker) => {
  const inner = skipCasts(receiver);
  return checker.isArrayType(checker.getTypeAtLocation(inner))
    ? widenName(inner, file, checker, "any[]")
    : undefined;
};

// The edits for a target that a write gives a value of another type: its variable becomes any, or
// its property, or the elements of the array that it's an element of, and else the value is cast.
const fixWrite = (
  node: ts.Node,
  file: ts.SourceFile,
  checker: ts.TypeChecker,
): Edit[] | undefined => {
  if (ts.isIdentifier(node)) return widenName(node, file, checker);
  const assignment = ts.findAncestor(node, isAssignment);
  const value =
    assignment !== undefined &&
    assignment.left === node &&
    assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ? castExpression(assignment.right, file)
      : undefined;
  if (ts.isPropertyAccessExpression(node)) return widenProperty(node, file, checker) ?? value;
  return ts.isElementAccessExpression(node)
    ? (widenElements(node.expression, file, checker) ?? value)
    : undefined;
};

// The edits for a value of another type than what takes it: a write's target, a declaration's or a
// property's value, an argument, which an array method that writes it makes the array's elements
// any for, or every argument of a call whose signatures take none of them.
const fixAssigned = (
  node: ts.Node,
  file: ts.SourceFile,
  checker: ts.TypeChecker,
): Edit[] | undefined => {
  if (isWritten(node)) return fixWrite(node, file, checker);
  const parent = node.parent;
  const computed = ts.findAncestor(node, ts.isComputedPropertyName)?.parent;
  if (computed !== undefined && ts.isPropertyAssignment(computed)) {
    return castExpression(computed.initializer, file);
  }
  if (
    ts.isIdentifier(node) &&
    (ts.isPropertyAssignment(parent) ||
      ts.isPropertyDeclaration(parent) ||
      ts.isVariableDeclaration(parent)) &&
    parent.name === node
  ) {
    return parent.initializer === undefined ? undefined : castExpression(parent.initializer, file);
  }
  if (ts.isSpreadElement(node)) return castExpression(node.expression, file);
  const call = getCall(node);
  const values = call?.arguments ?? [];
  const callee = call === undefined ? undefined : skipCasts(call.expression);
  const elements =
    callee !== undefined &&
    ts.isPropertyAccessExpression(callee) &&
    ARRAY_WRITES.has(callee.name.text)
      ? widenElements(callee.expression, file, checker)
      : undefined;
  if (elements !== undefined) return elements;
  // A JavaScript function's parameter that the argument doesn't fit, such as a pattern, whose type
  // TypeScript makes of the pattern, becomes any, as the argument may be any value.
  const position = values.findIndex((argument) => argument === node);
  const parameter =
    call === undefined || position === -1
      ? undefined
      : checker.getResolvedSignature(call)?.getDeclaration()?.parameters.at(position);
  const widened =
    parameter !== undefined && parameter.dotDotDotToken === undefined
      ? widenDeclaration(parameter, file, "any")
      : undefined;
  if (widened !== undefined) return widened;
  if (call === undefined || position !== -1) return castExpression(node, file);
  const casts = values.map((argument) =>
    castExpression(ts.isSpreadElement(argument) ? argument.expression : argument, file),
  );
  return casts.length > 0 && casts.every((cast) => cast !== undefined) ? casts.flat() : undefined;
};

// Whether a type holds undefined.
const isUndefinedTaking = (type: ts.Type) =>
  (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Undefined)) !== 0 ||
  (type.isUnion() && type.types.some(isUndefinedTaking));

// The call whose argument a node is, or that it is, or whose callee or callee's method name it is.
const getCall = (node: ts.Node) =>
  (ts.isCallExpression(node.parent) || ts.isNewExpression(node.parent)) &&
  (node.parent.arguments ?? []).some((argument) => argument === node)
    ? node.parent
    : ts.findAncestor(
        node,
        (ancestor): ancestor is ts.CallExpression | ts.NewExpression =>
          (ts.isCallExpression(ancestor) || ts.isNewExpression(ancestor)) &&
          (ancestor === node ||
            ancestor.expression === node ||
            (ts.isPropertyAccessExpression(ancestor.expression) &&
              ancestor.expression.name === node) ||
            (ancestor.arguments ?? []).some((argument) => argument === node)),
      );

// The edits for a diagnostic of a type that may not hold, or undefined where tla-ts can't make it
// hold.
const getEdits = (
  diagnostic: ts.Diagnostic,
  file: ts.SourceFile,
  checker: ts.TypeChecker,
): Edit[] | undefined => {
  const code = diagnostic.code;
  const node = getDiagnosedNode(file, diagnostic);
  if (NULLABLE_ERRORS.has(code)) {
    const flags = checker.getTypeAtLocation(node).flags;
    return (flags & ~(ts.TypeFlags.Null | ts.TypeFlags.Undefined)) === 0
      ? castExpression(node, file)
      : [];
  }
  if (ASSIGNED_ERRORS.has(code)) return fixAssigned(node, file, checker);
  if (EXCESS_PROPERTY_ERRORS.has(code)) {
    const literal = ts.findAncestor(node, ts.isObjectLiteralExpression);
    return literal === undefined ? undefined : castExpression(literal, file);
  }
  if (code === READ_ONLY_ERROR) {
    const access = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.PropertyAccessExpression | ts.ElementAccessExpression =>
        ts.isPropertyAccessExpression(ancestor) || ts.isElementAccessExpression(ancestor),
    );
    return access === undefined ? undefined : castExpression(access.expression, file);
  }
  if (OPERAND_ERRORS.has(code)) {
    if (isWritten(node)) return widenName(node, file, checker);
    return castExpression(
      ts.isSpreadElement(node) || ts.isComputedPropertyName(node) ? node.expression : node,
      file,
    );
  }
  if (OPERANDS_ERRORS.has(code)) {
    if (!ts.isBinaryExpression(node)) return undefined;
    const edits = [
      isWritten(node.left) ? widenName(node.left, file, checker) : castExpression(node.left, file),
      castExpression(node.right, file),
    ];
    return edits.every((edit) => edit !== undefined) ? edits.flat() : undefined;
  }
  if (CALLEE_ERRORS.has(code)) {
    const call =
      (ts.isCallExpression(node.parent) || ts.isNewExpression(node.parent)) &&
      node.parent.expression === node
        ? node.parent
        : getCall(node);
    return call === undefined ? undefined : castExpression(call.expression, file);
  }
  if (ARGUMENT_COUNT_ERRORS.has(code)) {
    const call = ts.isCallExpression(node) || ts.isNewExpression(node) ? node : getCall(node);
    const signature = call === undefined ? undefined : checker.getResolvedSignature(call);
    const callee = signature?.getDeclaration()?.getSourceFile();
    // A parameter that a call leaves out holds undefined, which a JavaScript parameter, any, takes,
    // and a built-in's translation follows. tla-ts runs the arguments past the parameters too.
    const missing = (signature?.getParameters() ?? []).slice(call?.arguments?.length ?? 0);
    return callee !== undefined &&
      (callee.isDeclarationFile ||
        isJavaScriptFile(callee.fileName) ||
        missing.every((parameter) =>
          isUndefinedTaking(checker.getTypeOfSymbolAtLocation(parameter, node)),
        ))
      ? []
      : undefined;
  }
  if (DECLARED_ERRORS.has(code)) return widenName(node, file, checker);
  if (DELETE_ERRORS.has(code)) {
    const operand = skipCasts(
      ts.isDeleteExpression(node) ? node.expression : (node as ts.Expression),
    );
    return ts.isPropertyAccessExpression(operand)
      ? widenProperty(operand, file, checker)
      : ts.isElementAccessExpression(operand)
        ? widenElements(operand.expression, file, checker)
        : undefined;
  }
  return undefined;
};

// Whether two edits' spans overlap, so that one round can't make both.
const isOverlapping = (left: Edit[], right: Edit[]) => {
  const getSpan = (edits: Edit[]) => [
    Math.min(...edits.map((edit) => edit.position)),
    Math.max(...edits.map((edit) => edit.position)),
  ];
  const [leftStart, leftEnd] = getSpan(left);
  const [rightStart, rightEnd] = getSpan(right);
  return leftStart <= rightEnd && rightStart <= leftEnd;
};

// A JavaScript file's text where each value or declaration that a type error shows may break its
// type is any, or undefined where TypeScript reports no error that changes it. A round makes the
// edits that don't overlap, and the next round, on the program of its text, makes the others.
// TypeScript's other errors, such as its grammar's, which Node's may be, reject the file, as they
// reject TypeScript.
export const typeJavaScript = (
  file: ts.SourceFile,
  program: ts.Program,
  host: ts.FormatDiagnosticsHost,
  // Whether tla-ts reports an error of TypeScript's, which it doesn't where JavaScript allows it.
  isReported: (diagnostic: ts.Diagnostic) => boolean,
) => {
  const checker = program.getTypeChecker();
  // A private name that no class declares, arguments where no function binds it, as in a field's
  // initializer, and an export of a name that nothing declares are early errors that TypeScript reports as names it can't find.
  const isIgnored = (diagnostic: ts.Diagnostic) => {
    const node = getDiagnosedNode(file, diagnostic);
    return (
      IGNORED_ERRORS.has(diagnostic.code) &&
      !(ts.isPrivateIdentifier(node) && PRIVATE_NAME_ERRORS.has(diagnostic.code)) &&
      !(ts.isIdentifier(node) && node.text === "arguments") &&
      !ts.isExportSpecifier(node.parent)
    );
  };
  // TypeScript's grammar of regular expressions is stricter than Node's, which tla-ts follows.
  const isAcceptedPattern = (diagnostic: ts.Diagnostic) => {
    const literal = ts.findAncestor(
      getDiagnosedNode(file, diagnostic),
      ts.isRegularExpressionLiteral,
    );
    return literal !== undefined && getRegularExpressionError(literal) === undefined;
  };
  const errors = program
    .getSemanticDiagnostics(file)
    .filter(
      (diagnostic) =>
        diagnostic.category === ts.DiagnosticCategory.Error &&
        !isIgnored(diagnostic) &&
        isReported(diagnostic) &&
        !isAcceptedPattern(diagnostic),
    );
  const rejected = errors.filter((diagnostic) => !FIXED_ERRORS.has(diagnostic.code));
  if (rejected.length > 0) throw new TlaTypeScriptError(ts.formatDiagnostics(rejected, host));
  const fixes = errors
    .map((diagnostic) => {
      const edits = getEdits(diagnostic, file, checker);
      if (edits === undefined) {
        throw new TlaTypeScriptError(
          `tla-ts can't run JavaScript whose types TypeScript rejects: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
          getDiagnosedNode(file, diagnostic),
        );
      }
      return edits;
    })
    .filter((edits) => edits.length > 0);
  const chosen = fixes.reduce<Edit[][]>(
    (kept, edits) => (kept.some((other) => isOverlapping(other, edits)) ? kept : [...kept, edits]),
    [],
  );
  return chosen.length === 0
    ? undefined
    : chosen
        .flat()
        .toSorted(
          (left, right) =>
            right.position - left.position ||
            Number(right.text.endsWith("(")) - Number(left.text.endsWith("(")),
        )
        .reduce(
          (text, edit) => text.slice(0, edit.position) + edit.text + text.slice(edit.position),
          file.text,
        );
};
