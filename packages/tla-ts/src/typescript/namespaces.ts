import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";
import { type Context, findNodes, getAssignedTarget, isWrittenBy } from "./context";
import { useJavaScript } from "./javascript";
import { identifier, number } from "./tla";

// An export of a module's namespace object: the name that a script reads it by, and the name or
// the literal that gives its value, or the module whose namespace object it is.
export interface NamespaceExport {
  name: string;
  value: ts.Expression | ts.SourceFile;
}

// A module whose namespace object a script reads, which takes its exports, in the order of their
// names, once the modules that the script imports have run.
export interface Namespace {
  exports: readonly NamespaceExport[];
}

// A literal, which a default export of runs nothing, as a reader of the export takes the literal.
export const isLiteralValue = (node: ts.Expression) =>
  ts.isLiteralExpression(node) ||
  [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
    node.kind,
  ) ||
  (ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand));

// The ref of the namespace object of a module that a script reads, which the heap holds from the
// start, after the generator prototypes.
export const getNamespaceRef = (file: ts.SourceFile, context: Context) => {
  const position = [...context.namespaces.keys()].indexOf(file);
  if (position === -1) {
    throw new TlaTypeScriptError("tla-ts can't make this module's namespace object", file);
  }
  return useJavaScript(
    ":>",
    [identifier("Ref"), number(context.generatorPrototypes.size + position + 1)],
    context,
  );
};

// The module that a symbol names, through an alias.
const getModule = (symbol: ts.Symbol | undefined, checker: ts.TypeChecker) => {
  const target =
    symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  const declaration = target?.valueDeclaration;
  return declaration !== undefined && ts.isSourceFile(declaration) && target !== undefined
    ? { file: declaration, symbol: target }
    : undefined;
};

// The module whose namespace object a namespace import gives where a script reads it as a value,
// other than to read an export through it.
export const getNamespaceRead = (node: ts.Identifier, checker: ts.TypeChecker) => {
  const parent = node.parent;
  return ts.isNamespaceImport(parent) ||
    ts.isNamespaceExport(parent) ||
    ts.isImportSpecifier(parent) ||
    ts.isImportClause(parent) ||
    ts.isExportSpecifier(parent) ||
    (ts.isPropertyAccessExpression(parent) && parent.expression === node) ||
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    ts.findAncestor(node, ts.isTypeNode) !== undefined
    ? undefined
    : getModule(checker.getSymbolAtLocation(node), checker);
};

// The node whose value an export's binding holds once its module has run: the name that its
// declaration binds, or the literal that a default export gives.
const getBound = (symbol: ts.Symbol, node: ts.Node) => {
  const declaration = symbol.valueDeclaration;
  const name =
    declaration !== undefined &&
    (ts.isVariableDeclaration(declaration) ||
      ts.isBindingElement(declaration) ||
      ts.isFunctionDeclaration(declaration) ||
      ts.isClassDeclaration(declaration))
      ? declaration.name
      : undefined;
  if (name !== undefined && ts.isIdentifier(name)) return name;
  if (
    declaration !== undefined &&
    ts.isExportAssignment(declaration) &&
    isLiteralValue(declaration.expression)
  ) {
    return declaration.expression;
  }
  throw new TlaTypeScriptError(
    "tla-ts can't make a module's namespace object with an export of this kind",
    declaration ?? node,
  );
};

// The modules whose namespace objects a script reads: those that a namespace import gives as a
// value, with the modules that their exports give as namespace objects in turn.
export const findNamespaces = (
  sourceFile: ts.SourceFile,
  files: readonly ts.SourceFile[],
  context: Context,
) => {
  const checker = context.checker;
  // The modules that the model imports run before the namespace objects take their exports, so
  // only the model's code reads them.
  const early = files
    .flatMap((file) => findNodes(file, ts.isIdentifier))
    .find((node) => getNamespaceRead(node, checker) !== undefined);
  if (early !== undefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't read a module's namespace object in a module that the script imports",
      early,
    );
  }
  const roots = findNodes(sourceFile, ts.isIdentifier).flatMap(
    (node) => getNamespaceRead(node, checker) ?? [],
  );
  const modules = new Map<ts.SourceFile, ts.Symbol>();
  const add = (module: { file: ts.SourceFile; symbol: ts.Symbol }): void => {
    if (modules.has(module.file)) return;
    modules.set(module.file, module.symbol);
    checker.getExportsOfModule(module.symbol).forEach((exported) => {
      const nested = getModule(exported, checker);
      if (nested !== undefined) add(nested);
    });
  };
  roots.forEach(add);
  // A binding that a function writes may change after its module has run, which the namespace
  // object wouldn't follow.
  const isChangedLater = (symbol: ts.Symbol) => {
    const file = symbol.valueDeclaration?.getSourceFile();
    return (
      file !== undefined &&
      findNodes(file, (node): node is ts.Node => {
        const target = getAssignedTarget(node);
        return (
          target !== undefined &&
          ts.findAncestor(node, ts.isFunctionLike) !== undefined &&
          isWrittenBy(target, symbol, context)
        );
      }).length > 0
    );
  };
  return new Map(
    [...modules].map(([file, symbol]): [ts.SourceFile, Namespace] => {
      if (file === sourceFile) {
        throw new TlaTypeScriptError(
          "tla-ts can't make the namespace object of a module that hasn't run",
          file,
        );
      }
      const exports = checker
        .getExportsOfModule(symbol)
        .flatMap((exported): NamespaceExport[] => {
          const target =
            exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
          if ((target.flags & ts.SymbolFlags.Value) === 0) return [];
          const nested = getModule(exported, checker);
          if (nested !== undefined) return [{ name: exported.name, value: nested.file }];
          const declaration = target.valueDeclaration;
          if (declaration?.getSourceFile() === sourceFile) {
            throw new TlaTypeScriptError(
              "tla-ts can't make the namespace object of a module that hasn't run",
              declaration,
            );
          }
          if (exported.name === "then") {
            throw new TlaTypeScriptError(
              "tla-ts can't make the namespace object of a module that exports then",
              declaration ?? file,
            );
          }
          if (isChangedLater(target)) {
            throw new TlaTypeScriptError(
              `tla-ts can't make a module's namespace object whose ${exported.name} may change after the module runs`,
              declaration ?? file,
            );
          }
          return [{ name: exported.name, value: getBound(target, file) }];
        })
        .toSorted((left, right) => (left.name < right.name ? -1 : 1));
      return [file, { exports }];
    }),
  );
};
