import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Context, getUndefined } from "./context";
import { functionFrom, identifier, string } from "./tla";

const TYPE_MODIFIERS = new Set([
  ts.SyntaxKind.PublicKeyword,
  ts.SyntaxKind.PrivateKeyword,
  ts.SyntaxKind.ProtectedKeyword,
  ts.SyntaxKind.ReadonlyKeyword,
  ts.SyntaxKind.OverrideKeyword,
  ts.SyntaxKind.AbstractKeyword,
]);

const hasModifier = (node: ts.Node, kind: ts.SyntaxKind) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ?? false);

const getChildToken = (node: ts.Node, kind: ts.SyntaxKind) =>
  node.getChildren().find((child) => child.kind === kind);

// The ranges of a function's text that only TypeScript reads, which Node's type stripping blanks,
// or undefined where the function holds TypeScript that it can't strip, such as an enum.
const getTypeRanges = (root: ts.Node): [number, number][] | undefined => {
  const ranges: [number, number][] = [];
  // The TypeScript that Node can't strip, such as an enum.
  const unstrippable: ts.Node[] = [];
  const blank = (start: number, end: number) => ranges.push([start, end]);
  const blankNode = (node: ts.Node | undefined) => {
    if (node !== undefined) blank(node.getStart(), node.end);
  };
  // A type annotation, from its colon.
  const blankAnnotation = (node: ts.Node, type: ts.Node | undefined) => {
    const colon = type === undefined ? undefined : getChildToken(node, ts.SyntaxKind.ColonToken);
    if (colon !== undefined && type !== undefined) blank(colon.getStart(), type.end);
  };
  // A list of type parameters or type arguments, with its angle brackets.
  const blankAngles = (node: ts.Node, list: ts.NodeArray<ts.Node> | undefined) => {
    if (list === undefined) return;
    const opening = node
      .getChildren()
      .find((child) => child.kind === ts.SyntaxKind.LessThanToken && child.end <= list.pos);
    const closing = node
      .getChildren()
      .find((child) => child.kind === ts.SyntaxKind.GreaterThanToken && child.pos >= list.end);
    if (opening !== undefined && closing !== undefined) blank(opening.getStart(), closing.end);
  };
  const visit = (node: ts.Node): void => {
    if (
      ts.isEnumDeclaration(node) ||
      (ts.isModuleDeclaration(node) && !hasModifier(node, ts.SyntaxKind.DeclareKeyword)) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isImportEqualsDeclaration(node) ||
      (ts.isParameter(node) &&
        ts.isConstructorDeclaration(node.parent) &&
        (ts.getModifiers(node)?.some((modifier) => TYPE_MODIFIERS.has(modifier.kind)) ?? false))
    ) {
      unstrippable.push(node);
      return;
    }
    if (
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isIndexSignatureDeclaration(node) ||
      hasModifier(node, ts.SyntaxKind.DeclareKeyword) ||
      (ts.isPropertyDeclaration(node) && hasModifier(node, ts.SyntaxKind.AbstractKeyword)) ||
      ((ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isConstructorDeclaration(node)) &&
        node.body === undefined)
    ) {
      blankNode(node);
      return;
    }
    if (ts.isParameter(node) && ts.isIdentifier(node.name) && node.name.text === "this") {
      // A this parameter goes with the comma after it.
      const comma = node.parent
        .getChildren()
        .flatMap((child) => child.getChildren())
        .find((child) => child.kind === ts.SyntaxKind.CommaToken && child.pos >= node.end);
      blank(node.getStart(), comma?.end ?? node.end);
      return;
    }
    if (ts.isHeritageClause(node) && node.token === ts.SyntaxKind.ImplementsKeyword) {
      blankNode(node);
      return;
    }
    if (ts.canHaveModifiers(node)) {
      ts.getModifiers(node)
        ?.filter((modifier) => TYPE_MODIFIERS.has(modifier.kind))
        .forEach(blankNode);
    }
    if (
      ts.isParameter(node) ||
      ts.isVariableDeclaration(node) ||
      ts.isPropertyDeclaration(node) ||
      ts.isFunctionLike(node)
    ) {
      blankAnnotation(node, node.type);
    }
    if (ts.isFunctionLike(node) || ts.isClassLike(node)) blankAngles(node, node.typeParameters);
    if (
      ts.isCallExpression(node) ||
      ts.isNewExpression(node) ||
      ts.isTaggedTemplateExpression(node) ||
      ts.isExpressionWithTypeArguments(node)
    ) {
      blankAngles(node, node.typeArguments);
    }
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
      blank(node.expression.end, node.end);
    }
    if (ts.isNonNullExpression(node)) blank(node.end - 1, node.end);
    if (
      (ts.isParameter(node) || ts.isPropertyDeclaration(node) || ts.isMethodDeclaration(node)) &&
      node.questionToken !== undefined
    ) {
      blankNode(node.questionToken);
    }
    if (
      (ts.isVariableDeclaration(node) || ts.isPropertyDeclaration(node)) &&
      node.exclamationToken !== undefined
    ) {
      blankNode(node.exclamationToken);
    }
    if (!ts.isTypeNode(node) || ts.isExpressionWithTypeArguments(node)) {
      ts.forEachChild(node, visit);
    }
  };
  visit(root);
  return unstrippable.length === 0 ? ranges : undefined;
};

// Where the source text of a function or a class starts: at async or the first token after its
// other modifiers, such as export or static, which aren't part of it.
const getTextStart = (node: ts.Node) => {
  const modifiers = ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []) : [];
  const decorators = ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : [];
  const isAsync = modifiers.find((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword);
  const last = [...modifiers, ...decorators].reduce(
    (latest: ts.Node | undefined, inner) =>
      latest === undefined || inner.end > latest.end ? inner : latest,
    undefined,
  );
  return (
    isAsync ??
    (last === undefined ? node : node.getChildren().find((child) => child.pos >= last.end)) ??
    node
  ).getStart();
};

// The text that Function.prototype.toString gives for a function or a class that a script
// declares: its source text, as Node reads it once it strips the script's types.
const getSourceText = (node: ts.Node) => {
  const ranges = getTypeRanges(node);
  if (ranges === undefined) return undefined;
  const text = node.getSourceFile().text;
  const start = getTextStart(node);
  // Positions count UTF-16 code units, as split gives them.
  return text
    .slice(start, node.end)
    .split("")
    .map((unit, offset) =>
      unit !== "\n" &&
      unit !== "\r" &&
      ranges.some((range) => start + offset >= range[0] && start + offset < range[1])
        ? " "
        : unit,
    )
    .join("")
    .trim();
};

// The source texts of the script's functions and classes, by the model values of their code, with
// undefined for one whose text tla-ts can't tell.
export const translateSourceTexts = (context: Context) =>
  functionFrom(
    [...(context.isSourceTextRead ? context.constructors : [])].flatMap(
      (entry): [Expression, Expression][] => {
        const key = entry[0];
        const declaration = "kind" in key ? key : key.valueDeclaration;
        if (declaration === undefined || declaration.getSourceFile().isDeclarationFile) return [];
        const text =
          ts.isFunctionLike(declaration) || ts.isClassLike(declaration)
            ? getSourceText(declaration)
            : undefined;
        return [[identifier(entry[1]), text === undefined ? getUndefined(context) : string(text)]];
      },
    ),
  );
