import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../errors";

const isJsxRoot = (node: ts.Node) =>
  ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);

// The outermost JSX of a node.
const findRoots = (node: ts.Node): ts.Node[] =>
  isJsxRoot(node) ? [node] : node.getChildren().flatMap(findRoots);

// The expressions that JSX holds in braces, which are code rather than JSX.
const findHoles = (node: ts.Node): ts.Expression[] =>
  ts.isJsxExpression(node) || ts.isJsxSpreadAttribute(node)
    ? node.expression === undefined
      ? []
      : [node.expression]
    : node.getChildren().flatMap(findHoles);

const countLines = (text: string) => text.split("\n").length - 1;

// The names that TypeScript's JSX calls could take, which a file's own names of them move.
const findRuntimeNames = (node: ts.Node): string[] =>
  ts.isIdentifier(node) && node.text.startsWith("_")
    ? [node.text]
    : node.getChildren().flatMap(findRuntimeNames);

// HACK: the compiler reads no JSX, so the text gains the calls that TypeScript emits in its place.
// A file's text where each JSX expression is the call that TypeScript emits for it, with the import
// of the functions it calls. TypeScript emits the calls itself, from the JSX alone, where a name
// stands for each expression in braces, whose text then takes the name's place, so that the
// expressions keep their types. The text stays on the same lines.
export const rewriteJsx = (
  fileName: string,
  text: string,
  options: ts.CompilerOptions,
  host: ts.FormatDiagnosticsHost,
) => {
  const file = ts.createSourceFile(fileName, text, ts.ScriptTarget.ESNext, true);
  const roots: ts.Node[] = [];
  const holes: ts.Expression[] = [];
  const collect = (node: ts.Node) => {
    for (const root of findRoots(node)) {
      roots.push(root);
      for (const hole of findHoles(root)) {
        holes.push(hole);
        collect(hole);
      }
    }
  };
  collect(file);
  if (roots.length === 0) return text;
  // Deviation from TypeScript: where the option is preserve, a bundler compiles the JSX, as the
  // calls of the option react-jsx by default, which the development calls differ from only in
  // what they report.
  const compilerOptions: ts.CompilerOptions = {
    jsx: options.jsx === ts.JsxEmit.React ? ts.JsxEmit.React : ts.JsxEmit.ReactJSX,
    jsxFactory: options.jsxFactory,
    jsxFragmentFactory: options.jsxFragmentFactory,
    jsxImportSource: options.jsxImportSource,
    reactNamespace: options.reactNamespace,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
  };
  const syntaxErrors =
    ts.transpileModule(text, { fileName, compilerOptions, reportDiagnostics: true }).diagnostics ??
    [];
  if (syntaxErrors.length > 0) {
    throw new TlaTypeScriptError(ts.formatDiagnostics(syntaxErrors, host));
  }
  const getSkeleton = (root: ts.Node) => {
    const start = root.getStart(file);
    return findHoles(root).reduceRight(
      (current, hole) =>
        current.slice(0, hole.getStart(file) - start) +
        `__tla_ts_jsx_${holes.indexOf(hole)}__` +
        current.slice(hole.end - start),
      text.slice(start, root.end),
    );
  };
  // The file's comments before its code may tell the calls to emit, as @jsxImportSource does.
  const emitted = ts.transpileModule(
    [
      text.slice(0, file.getStart(file)),
      ...roots.map((root) => `(${getSkeleton(root)});`),
      `[${[...new Set(findRuntimeNames(file))].join(", ")}];`,
    ].join("\n"),
    { fileName, compilerOptions },
  );
  const statements = ts.createSourceFile(
    "emitted.ts",
    emitted.outputText,
    ts.ScriptTarget.ESNext,
    true,
  ).statements;
  const imports = statements.filter(ts.isImportDeclaration);
  const calls = statements.flatMap((statement) =>
    ts.isExpressionStatement(statement) && !ts.isStringLiteral(statement.expression)
      ? [statement.expression]
      : [],
  );
  const render = (start: number, node: ts.Node): string =>
    findRoots(node).reduceRight(
      (current, root) =>
        current.slice(0, root.getStart(file) - start) +
        renderRoot(root) +
        current.slice(root.end - start),
      text.slice(start, node.end),
    );
  const renderRoot = (root: ts.Node) => {
    const start = root.getStart(file);
    const call = calls[roots.indexOf(root)]?.getText().replace(/\s*\n\s*/g, " ") ?? "";
    let lineCount = 0;
    const rendered = call.replace(/__tla_ts_jsx_(\d+)__/g, (name, index: string) => {
      const hole = holes[Number(index)];
      if (hole === undefined) return name;
      const holeStart = hole.getStart(file);
      const padding = "\n".repeat(
        Math.max(0, countLines(text.slice(start, holeStart)) - lineCount),
      );
      const expression = render(holeStart, hole);
      lineCount += padding.length + countLines(expression);
      return `${padding}(${expression})`;
    });
    const total = countLines(text.slice(start, root.end));
    return `(${rendered}${"\n".repeat(Math.max(0, total - lineCount))})`;
  };
  const rewritten = render(0, file);
  const importStart = file.getStart(file);
  return (
    rewritten.slice(0, importStart) +
    imports.map((declaration) => `${declaration.getText()} `).join("") +
    rewritten.slice(importStart)
  );
};
