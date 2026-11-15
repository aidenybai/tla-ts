import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";
import { DELETED_GLOBAL, findNodes, getImplicitGlobals, isStrictCode, skipCasts } from "./context";

// The globals whose properties on the global object can't be deleted.
const FIXED_GLOBALS = new Set(["NaN", "Infinity", "undefined"]);

const isHostDefined = (declaration: ts.Declaration) =>
  declaration.getSourceFile().isDeclarationFile ||
  (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Ambient) !== 0;

// HACK: TypeScript checks every file as strict code, where delete can't take a name. Outside strict
// mode, the text gains, in place of each delete of a name, what ECMA-262's delete gives
// (§13.5.1.2): false for a binding that a declaration makes, or a fixed global, which can't be
// deleted, and true for a name that nothing binds. A global that a write makes is deleted, so that
// reads throw until a write makes it again. A delete of another global that the host defines stays
// a type error. The text stays on the same lines.
export const rewriteNameDeletes = (file: ts.SourceFile, checker: ts.TypeChecker) => {
  const deletes = findNodes(
    file,
    (node): node is ts.DeleteExpression =>
      ts.isDeleteExpression(node) &&
      ts.isIdentifier(skipCasts(node.expression)) &&
      !isStrictCode(node),
  );
  if (deletes.length === 0) return file.text;
  const text = file.text;
  const resolve = (name: ts.Identifier) =>
    checker.resolveName(name.text, name, ts.SymbolFlags.Value, false);
  const implicitGlobals = getImplicitGlobals(file, resolve);
  const getValue = (name: ts.Identifier) => {
    const declarations = resolve(name)?.declarations;
    // A function's arguments object, which no declaration makes, is a binding of the function.
    if (name.text === "arguments" && declarations === undefined) {
      return ts.findAncestor(
        name.parent,
        (ancestor) => ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor),
      ) === undefined
        ? undefined
        : "false";
    }
    if (declarations !== undefined && !declarations.every(isHostDefined)) return "false";
    if (FIXED_GLOBALS.has(name.text)) return "false";
    if (declarations !== undefined) return undefined;
    if (!implicitGlobals.has(name.text)) return "true";
    if (text.includes(DELETED_GLOBAL)) {
      throw new TlaTypeScriptError(
        `tla-ts can't rewrite a delete in a script that names ${DELETED_GLOBAL}`,
        name,
      );
    }
    return `${name.text} = ${DELETED_GLOBAL}, true`;
  };
  const replacements = deletes.flatMap((node) => {
    const name = skipCasts(node.expression);
    const value = ts.isIdentifier(name) ? getValue(name) : undefined;
    const start = node.getStart(file);
    const lines = "\n".repeat(text.slice(start, node.end).split("\n").length - 1);
    return value === undefined
      ? []
      : [{ start, end: node.end, text: `(${value} as boolean)${lines}` }];
  });
  const rewritten = replacements.reduceRight(
    (current, replacement) =>
      current.slice(0, replacement.start) + replacement.text + current.slice(replacement.end),
    text,
  );
  return rewritten.includes(DELETED_GLOBAL) && !text.includes(DELETED_GLOBAL)
    ? `declare const ${DELETED_GLOBAL}: any; ${rewritten}`
    : rewritten;
};
