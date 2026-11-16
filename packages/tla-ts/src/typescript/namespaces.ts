import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";
import {
  type Context,
  findNodes,
  getAssignedTarget,
  getImportedModule,
  isImportCall,
  isInertValue,
  isScript,
  isWrittenBy,
  skipCasts,
} from "./context";
import { NATIVE_ERRORS } from "./exceptions";
import { getBuiltIn } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { isDeclaration } from "./model";
import { identifier, number } from "./tla";

// An export of a module's namespace object: the name that a script reads it by, and the name or
// the literal that gives its value, or the module whose namespace object it is.
export interface NamespaceExport {
  name: string;
  value: ts.Expression | ts.SourceFile;
  // The script's statement that declares the export's let, const, class, or default export, which
  // holds nothing that a read can see until the statement runs.
  declared: ts.Statement | undefined;
}

// A module whose namespace object a script reads, which takes its exports, in the order of their
// names, once the modules that the script imports have run. The script's own namespace object takes
// them again after each of its statements that declares or writes one.
export interface Namespace {
  exports: readonly NamespaceExport[];
  changes: readonly ts.Statement[];
  // The modules that run after the module, before which its namespace object takes its exports.
  following: readonly ts.SourceFile[];
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

// A statement that only declares, which runs the same before a script as where Node runs it.
const isInert = (statement: ts.Statement) =>
  isDeclaration(statement) ||
  ts.isExportDeclaration(statement) ||
  ts.isEmptyStatement(statement) ||
  (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) ||
  (ts.isVariableStatement(statement) &&
    statement.declarationList.declarations.every(
      (declaration) =>
        declaration.initializer === undefined || isInertValue(declaration.initializer),
    )) ||
  (ts.isExportAssignment(statement) && isInertValue(statement.expression));

// The native error of literals that a module throws where its last statement throws it and its
// code only declares before that, which the promise of each import() of it takes. A module that
// imports other modules may throw what they throw first.
export const getModuleThrow = (file: ts.SourceFile, checker: ts.TypeChecker) => {
  const last = file.statements.at(-1);
  const thrown = last !== undefined && ts.isThrowStatement(last) ? last.expression : undefined;
  return thrown !== undefined &&
    ts.isNewExpression(thrown) &&
    NATIVE_ERRORS.has(getBuiltIn(thrown.expression, { checker }) ?? "") &&
    (thrown.arguments ?? []).every(isLiteralValue) &&
    file.statements.slice(0, -1).every(isInert) &&
    !file.statements.some(
      (statement) =>
        (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
        statement.moduleSpecifier !== undefined,
    )
    ? thrown
    : undefined;
};

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

// The modules that a file names in an import() of a string, which load as the script runs, but
// those that throw as they run, which never make their namespace objects.
export const getDynamicImports = (file: ts.SourceFile, checker: ts.TypeChecker) =>
  findNodes(file, isImportCall).flatMap((call) => {
    const module = getImportedModule(call, checker);
    return module === undefined || getModuleThrow(module, checker) !== undefined ? [] : [module];
  });

// tla-ts runs a module that only an import() loads before the script, as it runs the modules that
// the script imports, where Node runs it once the import() loads it. Only a module whose code only
// declares runs the same either way.
export const rejectRunningModules = (files: readonly ts.SourceFile[]) => {
  const running = files.flatMap((file) => file.statements).find((statement) => !isInert(statement));
  if (running !== undefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't run a module that import() loads, as its code does more than declare",
      running,
    );
  }
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

// The module whose namespace object a name gives, as a namespace import does.
export const getNamespaceModule = (node: ts.Identifier, checker: ts.TypeChecker) =>
  getModule(checker.getSymbolAtLocation(node), checker)?.file;

// Whether a read through a module's namespace object reads an export's binding, which the module
// declares by name, rather than a namespace object or a default export of an expression.
export const isBindingRead = (node: ts.PropertyAccessExpression, checker: ts.TypeChecker) => {
  const member = checker.getSymbolAtLocation(node.name);
  const declaration = (
    member !== undefined && member.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(member)
      : member
  )?.valueDeclaration;
  return (
    declaration !== undefined &&
    (ts.isVariableDeclaration(declaration) ||
      ts.isFunctionDeclaration(declaration) ||
      ts.isClassDeclaration(declaration)) &&
    declaration.name !== undefined &&
    ts.isIdentifier(declaration.name)
  );
};

// The module whose namespace object a namespace import gives where a script reads it as a value,
// other than to read an export through it.
export const getNamespaceRead = (node: ts.Identifier, checker: ts.TypeChecker) => {
  const parent = node.parent;
  const getCast = (inner: ts.Node): ts.Node =>
    skipCasts(inner.parent as ts.Expression) === inner.parent ? inner : getCast(inner.parent);
  const cast = getCast(node);
  return ts.isNamespaceImport(parent) ||
    (ts.isPropertyAccessExpression(cast.parent) &&
      cast.parent.expression === cast &&
      ts.isIdentifier(cast.parent.name)) ||
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

// The module whose namespace object a script reads where a namespace import names it.
export const getNamespaceName = (node: ts.Identifier, context: Context) => {
  const module = getModule(context.checker.getSymbolAtLocation(node), context.checker);
  return module !== undefined && context.namespaces.has(module.file) ? module.file : undefined;
};

// The script's statement that a node is in.
const getStatement = (node: ts.Node) =>
  ts.findAncestor(node, (ancestor): ancestor is ts.Statement => ts.isSourceFile(ancestor.parent));

// Whether a statement declares a let, a const, a class, or a default export, whose binding a read
// can't see before the statement runs.
const isLexical = (statement: ts.Statement | undefined) =>
  statement !== undefined &&
  ((ts.isVariableStatement(statement) &&
    (statement.declarationList.flags & ts.NodeFlags.BlockScoped) !== 0) ||
    ts.isClassDeclaration(statement) ||
    ts.isExportAssignment(statement));

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

// The modules that a module's import and export declarations name.
const getImportedModules = (file: ts.SourceFile, checker: ts.TypeChecker) =>
  file.statements.flatMap((statement) => {
    const specifier =
      ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)
        ? statement.moduleSpecifier
        : undefined;
    return (specifier && getModule(checker.getSymbolAtLocation(specifier), checker)?.file) ?? [];
  });

// The modules whose namespace objects a script reads: those that an import() of a string names,
// those that a namespace import in the script or a module it imports gives as a value, and those
// that a namespace import reads another namespace object from, with the modules that their exports
// give as namespace objects in turn. A read of a var or a let through a namespace import reads its
// binding.
export const findNamespaces = (
  sourceFile: ts.SourceFile,
  files: readonly ts.SourceFile[],
  context: Context,
): ReadonlyMap<ts.SourceFile, Namespace> => {
  const checker = context.checker;
  const loaded = new Set(getDynamicImports(sourceFile, checker));
  const roots = [
    ...findNodes(sourceFile, isImportCall).flatMap((call) => {
      const specifier = call.arguments.at(0);
      const module = specifier && getModule(checker.getSymbolAtLocation(specifier), checker);
      return module !== undefined && (loaded.has(module.file) || module.file === sourceFile)
        ? [module]
        : [];
    }),
    ...[sourceFile, ...files].flatMap((file) =>
      findNodes(file, ts.isIdentifier).flatMap((node) => getNamespaceRead(node, checker) ?? []),
    ),
    ...[sourceFile, ...files]
      .flatMap((file) => findNodes(file, ts.isPropertyAccessExpression))
      .flatMap((node) => {
        const module = ts.isIdentifier(node.expression)
          ? getModule(checker.getSymbolAtLocation(node.expression), checker)
          : undefined;
        const member = module && checker.getSymbolAtLocation(node.name);
        const declaration = (
          member !== undefined && member.flags & ts.SymbolFlags.Alias
            ? checker.getAliasedSymbol(member)
            : member
        )?.valueDeclaration;
        return module !== undefined && declaration !== undefined && ts.isSourceFile(declaration)
          ? [module]
          : [];
      }),
  ];
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
  // Only a script, which runs as JavaScript does, holds objects on a heap.
  if (modules.size > 0 && !isScript(sourceFile)) {
    throw new TlaTypeScriptError(
      "tla-ts can't make a module's namespace object outside a script",
      sourceFile,
    );
  }
  // The module whose namespace object a node reads: a namespace import as a value or to read an
  // export, or an import() of a string.
  const getRead = (node: ts.Node) => {
    const module = isImportCall(node)
      ? getModule(checker.getSymbolAtLocation(node.arguments.at(0) ?? node), checker)
      : ts.isIdentifier(node)
        ? (getNamespaceRead(node, checker) ??
          (ts.isPropertyAccessExpression(node.parent) &&
          node.parent.expression === node &&
          !isBindingRead(node.parent, checker)
            ? getModule(checker.getSymbolAtLocation(node), checker)
            : undefined))
        : undefined;
    return module?.file;
  };
  // A module's namespace object takes its exports once the module has run, so a module that the
  // model imports reads it only where the module ran before it, and where no module that ran
  // before it imports it, which could call its functions before it runs.
  const isRunBefore = (module: ts.SourceFile, file: ts.SourceFile) => {
    const position = files.indexOf(file);
    return (
      files.indexOf(module) !== -1 &&
      files.indexOf(module) < position &&
      !files
        .slice(0, position)
        .some((earlier) => getImportedModules(earlier, checker).includes(file))
    );
  };
  const early = files.flatMap((file) =>
    findNodes(file, (node): node is ts.Node => {
      const read = getRead(node);
      return (
        isImportCall(node) || (read !== undefined && modules.has(read) && !isRunBefore(read, file))
      );
    }),
  )[0];
  if (early !== undefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't read a module's namespace object in a module that the script imports",
      early,
    );
  }
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
  const getExports = (file: ts.SourceFile, symbol: ts.Symbol) =>
    checker
      .getExportsOfModule(symbol)
      .flatMap((exported): NamespaceExport[] => {
        const target =
          exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
        if ((target.flags & ts.SymbolFlags.Value) === 0) return [];
        const nested = getModule(exported, checker);
        if (nested !== undefined) {
          return [{ name: exported.name, value: nested.file, declared: undefined }];
        }
        const declaration = target.valueDeclaration;
        if (file !== sourceFile && declaration?.getSourceFile() === sourceFile) {
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
        const value = getBound(target, file);
        const statement = getStatement(value);
        return [
          {
            name: exported.name,
            value,
            declared:
              value.getSourceFile() === sourceFile && isLexical(statement) ? statement : undefined,
          },
        ];
      })
      .toSorted((left, right) => (left.name < right.name ? -1 : 1));
  return new Map(
    [...modules].map(([file, symbol]): [ts.SourceFile, Namespace] => {
      const exports = getExports(file, symbol);
      return [
        file,
        {
          exports,
          changes:
            file === sourceFile
              ? getChanges(sourceFile, exports, (node) => getRead(node) === sourceFile, context)
              : [],
          following:
            file === sourceFile ? [] : [...files.slice(files.indexOf(file) + 1), sourceFile],
        },
      ];
    }),
  );
};

// A statement that only declares, or assigns names values that run nothing, which runs no code that
// might read a namespace object.
const isPlainChange = (statement: ts.Statement) => {
  const isPlainWrite = (node: ts.Expression): boolean =>
    (ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.CommaToken &&
      isPlainWrite(node.left) &&
      isPlainWrite(node.right)) ||
    (ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
      ts.isIdentifier(node.left) &&
      isInertValue(node.right)) ||
    ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      ts.isIdentifier(node.operand));
  return (
    isInert(statement) ||
    (ts.isExpressionStatement(statement) && isPlainWrite(statement.expression))
  );
};

// The script's statements after which its own namespace object takes its exports again: those
// that declare or write one. A read of the namespace object, or an import() of the script, finds
// the exports that it holds where it runs after every statement that declares a let, a const, a
// class, or a default export, in a statement that writes none, and outside a function that a
// declaration hoists. A statement that writes one runs no code that might read it first, and the
// script awaits nothing at its top level, where a job might read it.
const getChanges = (
  sourceFile: ts.SourceFile,
  exports: readonly NamespaceExport[],
  isOwnRead: (node: ts.Node) => boolean,
  context: Context,
) => {
  const symbols = exports.flatMap((exported) =>
    ts.isSourceFile(exported.value) || !ts.isIdentifier(exported.value)
      ? []
      : (context.checker.getSymbolAtLocation(exported.value) ?? []),
  );
  const changes = sourceFile.statements.filter(
    (statement) =>
      exports.some(
        (exported) =>
          !ts.isSourceFile(exported.value) && getStatement(exported.value) === statement,
      ) ||
      findNodes(statement, (node): node is ts.Node => {
        const target = getAssignedTarget(node);
        return (
          target !== undefined && symbols.some((symbol) => isWrittenBy(target, symbol, context))
        );
      }).length > 0,
  );
  const lexicalEnd = Math.max(
    0,
    ...exports.flatMap((exported) =>
      exported.declared === undefined ? [] : [exported.declared.end],
    ),
  );
  const unset = findNodes(sourceFile, (node): node is ts.Node => {
    if (!isOwnRead(node)) return false;
    const statement = getStatement(node);
    return (
      statement === undefined ||
      statement.pos < lexicalEnd ||
      changes.includes(statement) ||
      ts.findAncestor(
        node,
        (ancestor) => ts.isFunctionDeclaration(ancestor) && ts.isSourceFile(ancestor.parent),
      ) !== undefined
    );
  })[0];
  const awaiting = findNodes(
    sourceFile,
    (node): node is ts.Node =>
      (ts.isAwaitExpression(node) ||
        (ts.isForOfStatement(node) && node.awaitModifier !== undefined)) &&
      ts.findAncestor(node.parent, ts.isFunctionLike) === undefined,
  )[0];
  const failed = unset ?? changes.find((change) => !isPlainChange(change)) ?? awaiting;
  if (failed !== undefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't read the script's own namespace object where its exports may not hold their values",
      failed,
    );
  }
  return changes;
};
