import ts from "@typescript/typescript6";
import { getOutermostCast, skipCasts } from "./context";

// The keys that the engine itself gives a value that a script made, such as a prototype's
// constructor, a property descriptor's get, set, and value, sloppy arguments' callee, and a
// settled promise's value and reason.
const ENGINE_KEYS = [
  "constructor",
  "callee",
  "caller",
  "get",
  "set",
  "value",
  "reason",
  "default",
  "then",
];

// The methods that make a key that one of their arguments names, by where the key is: those of any
// object of these names, and Reflect's.
const KEY_MAKERS = new Map([
  ["defineProperty", 1],
  ["fromEntries", -1],
  ["__defineGetter__", 0],
  ["__defineSetter__", 0],
]);

// The objects whose keys hold Object and Reflect, or their methods that make keys.
const GLOBAL_HOLDERS = new Set(["globalThis", "window", "self", "global", "Object", "Reflect"]);

const REFLECT_KEY_MAKERS = new Map([
  ["defineProperty", 1],
  ["set", 1],
]);

// The keys that a script's syntax can make, as one set, or undefined where some key it makes isn't
// a literal, as obj[k] = value does with a string k, or a proxy's traps may give any key. A call
// whose callee reads a key outside the set can't run a function that the script made.
export const findMadeKeys = (
  files: Iterable<ts.SourceFile>,
  checker: ts.TypeChecker,
): ReadonlySet<string> | undefined => {
  const keys = new Set(ENGINE_KEYS);
  let isOpen = false;
  const addName = (name: ts.PropertyName | ts.BindingName | undefined) => {
    if (name === undefined) return;
    if (
      ts.isIdentifier(name) ||
      ts.isStringLiteralLike(name) ||
      ts.isNumericLiteral(name) ||
      ts.isPrivateIdentifier(name)
    ) {
      keys.add(name.text);
      return;
    }
    if (ts.isComputedPropertyName(name)) addKey(name.expression);
  };
  // A key that an expression gives: a literal adds itself, a number or a symbol none that a name
  // can be but NaN and Infinity, and any other leaves the set open.
  const addKey = (key: ts.Expression) => {
    const inner = skipCasts(key);
    if (ts.isStringLiteralLike(inner) || ts.isNumericLiteral(inner)) {
      keys.add(inner.text);
      return;
    }
    const type = checker.getTypeAtLocation(inner);
    if (type.flags & ts.TypeFlags.Any || type.flags & ts.TypeFlags.Unknown) {
      isOpen = true;
      return;
    }
    const isNumberOrSymbol = (part: ts.Type) =>
      (part.flags &
        (ts.TypeFlags.NumberLike | ts.TypeFlags.BigIntLike | ts.TypeFlags.ESSymbolLike)) !==
      0;
    const parts = type.isUnion() ? type.types : [type];
    if (!parts.every((part) => part.isStringLiteral() || isNumberOrSymbol(part))) {
      isOpen = true;
      return;
    }
    parts.forEach((part) => {
      if (part.isStringLiteral()) {
        keys.add(part.value);
      } else {
        keys.add("NaN");
        keys.add("Infinity");
      }
    });
  };
  // A write to a key, as an assignment, a destructuring, an update, or a for-in or for-of makes.
  const addTarget = (target: ts.Expression) => {
    const inner = skipCasts(target);
    if (ts.isPropertyAccessExpression(inner)) {
      keys.add(inner.name.text);
    } else if (ts.isElementAccessExpression(inner)) {
      addKey(inner.argumentExpression);
    } else if (ts.isIdentifier(inner)) {
      // A sloppy write to a name that nothing declares makes a key of the global object.
      keys.add(inner.text);
    } else if (ts.isArrayLiteralExpression(inner)) {
      inner.elements.forEach((element) =>
        addTarget(ts.isSpreadElement(element) ? element.expression : element),
      );
    } else if (ts.isObjectLiteralExpression(inner)) {
      inner.properties.forEach((property) => {
        if (ts.isPropertyAssignment(property)) {
          addTarget(property.initializer);
        } else if (ts.isShorthandPropertyAssignment(property)) {
          keys.add(property.name.text);
        } else if (ts.isSpreadAssignment(property)) {
          addTarget(property.expression);
        }
      });
    } else if (
      ts.isBinaryExpression(inner) &&
      inner.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ) {
      addTarget(inner.left);
    }
  };
  // A use of a method that makes a key, which must call it with a literal key.
  const addKeyMaker = (node: ts.PropertyAccessExpression | ts.ElementAccessExpression) => {
    const name = ts.isPropertyAccessExpression(node)
      ? node.name.text
      : ts.isStringLiteralLike(skipCasts(node.argumentExpression))
        ? (skipCasts(node.argumentExpression) as ts.StringLiteralLike).text
        : undefined;
    const owner = skipCasts(node.expression);
    const isReflect =
      (ts.isIdentifier(owner) && owner.text === "Reflect") ||
      (ts.isPropertyAccessExpression(owner) && owner.name.text === "Reflect");
    const position =
      name === undefined
        ? undefined
        : isReflect
          ? (REFLECT_KEY_MAKERS.get(name) ?? KEY_MAKERS.get(name))
          : KEY_MAKERS.get(name);
    if (position === undefined) return;
    const call = getOutermostCast(node).parent;
    const key =
      position >= 0 &&
      ts.isCallExpression(call) &&
      skipCasts(call.expression) === node &&
      !call.arguments.some(ts.isSpreadElement)
        ? call.arguments.at(position)
        : undefined;
    if (key === undefined) {
      isOpen = true;
      return;
    }
    addKey(key);
  };
  // Reflect as a value, rather than the object whose method a script reads by name, may make any
  // key, as may a method that makes keys that a script reads other than by a property's name.
  const isMakerValue = (node: ts.Node) =>
    ts.isIdentifier(node) &&
    (node.text === "Reflect" || KEY_MAKERS.has(node.text)) &&
    !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) &&
    !(
      node.text === "Reflect" &&
      ts.isPropertyAccessExpression(node.parent) &&
      node.parent.expression === node
    );
  // A key that a script reads by a value from an object whose keys hold the methods that make keys,
  // or the objects that hold those, may read any of them.
  const isOpenRead = (node: ts.ElementAccessExpression) => {
    const owner = skipCasts(node.expression);
    const key = skipCasts(node.argumentExpression);
    return (
      !ts.isStringLiteralLike(key) &&
      !ts.isNumericLiteral(key) &&
      (owner.kind === ts.SyntaxKind.ThisKeyword ||
        (ts.isIdentifier(owner) && GLOBAL_HOLDERS.has(owner.text)))
    );
  };
  const addBindingNames = (name: ts.BindingName) => {
    if (ts.isIdentifier(name)) {
      keys.add(name.text);
      return;
    }
    name.elements.forEach((element) => {
      if (!ts.isOmittedExpression(element)) addBindingNames(element.name);
    });
  };
  const visit = (node: ts.Node): void => {
    if (isOpen) return;
    if (ts.isIdentifier(node) && node.text === "Proxy") {
      isOpen = true;
      return;
    }
    if (ts.isWithStatement(node)) {
      isOpen = true;
      return;
    }
    if (ts.isStringLiteralLike(node)) keys.add(node.text);
    if (
      ts.isPropertyAssignment(node) ||
      ts.isShorthandPropertyAssignment(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node) ||
      ts.isPropertyDeclaration(node) ||
      ts.isPropertySignature(node) ||
      ts.isEnumMember(node)
    ) {
      addName(node.name);
    }
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isVariableDeclaration(node) ||
        ts.isExportSpecifier(node) ||
        ts.isImportSpecifier(node)) &&
      node.name !== undefined
    ) {
      // A declaration of a script's top level, or an export, makes a key of the global object or
      // of a module's namespace.
      if (ts.isVariableDeclaration(node)) {
        addBindingNames(node.name);
      } else {
        addName(node.name);
      }
      if (ts.isExportSpecifier(node) || ts.isImportSpecifier(node)) addName(node.propertyName);
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    ) {
      addTarget(node.left);
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken)
    ) {
      addTarget(node.operand);
    }
    if (
      (ts.isForInStatement(node) || ts.isForOfStatement(node)) &&
      !ts.isVariableDeclarationList(node.initializer)
    ) {
      addTarget(node.initializer);
    }
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      addKeyMaker(node);
    }
    if (
      isMakerValue(node) ||
      (ts.isElementAccessExpression(node) && isOpenRead(node)) ||
      (ts.isStringLiteralLike(node) &&
        (node.text === "Reflect" || KEY_MAKERS.has(node.text)) &&
        !(ts.isPropertyAssignment(node.parent) && node.parent.name === node))
    ) {
      isOpen = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  for (const file of files) visit(file);
  return isOpen ? undefined : keys;
};
