import type { Node, ThrowStatement } from "@typescript/typescript6";
import type { PreparedModule } from "../tlc/order";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Module } from "../ast";
import {
  MODULE_UNCAUGHT_LOCATION,
  TRACE_UNCAUGHT_HINT,
  UNCAUGHT_EXCEPTION_EXIT_CODE,
  UNHANDLED_REJECTION_LOCATION,
  UNHANDLED_REJECTION_PREFIX,
  UNHANDLED_REJECTION_SUFFIX,
  UNSETTLED_AWAIT_EXIT_CODE,
  UNSETTLED_AWAIT_WARNING,
} from "../exit-codes";
import { getEscoreRuntime } from "../compile";
import { parseModule } from "../parser";

// A spec tla-ts compiled from the TypeScript file at path. specPath is where its module would be
// if it were a file, though tla-ts checks it without writing one.
export interface CompiledInput {
  path: string;
  specPath: string;
  source: Module;
  config: string;
  loadModule: (name: string) => string | undefined;
  preparedModules: PreparedModule[];
  isScript: boolean;
  notes: string[];
}

// Whether a path names a file that Node runs, TypeScript or JavaScript, which tla-ts compiles.
export const isProgramPath = (path: string) => /\.(?:[cm]?[jt]s|[jt]sx)$/.test(path);

// The escapes of a string that TLC prints.
const TLC_ESCAPES = new Map([
  ["n", "\n"],
  ["t", "\t"],
]);

// What Node writes to stderr and the code it exits with, for the script at path whose spec fails an
// Assert with what Node reports: a top-level await that never settles, or a throw or a rejection
// that nothing handles.
export const getNodeExit = (message: string, path: string) => {
  const quoted = message
    .split('The first argument of Assert evaluated to FALSE; the second argument was:\n"')
    .at(1);
  if (quoted === undefined) return undefined;
  const text = quoted
    .slice(0, -1)
    .replace(/\\(.)/g, (_, character: string) => TLC_ESCAPES.get(character) ?? character);
  if (text.startsWith(UNSETTLED_AWAIT_WARNING)) {
    return { code: UNSETTLED_AWAIT_EXIT_CODE, stderr: `Warning: ${text}\n\n\n\n` };
  }
  const realPath = realpathSync(path);
  return [`${realPath}:`, `${pathToFileURL(realPath).href}:`, "node:internal/"].some((prefix) =>
    text.replace(/^\n/, "").startsWith(prefix),
  )
    ? { code: UNCAUGHT_EXCEPTION_EXIT_CODE, stderr: `${text}\n\nNode.js ${process.version}\n` }
    : undefined;
};

// The steps of a script's spec as the CLI checks it on ESCore: where the script leaves an exception
// uncaught, Init fails with what Node prints, as getNodeExit reads it, for a primitive that a throw
// statement of siteTexts throws, that the entry module's evaluation rejects with, or that another
// promise rejects with, and Node's warning where the entry module's top-level await never settles,
// unsettledText, where it has one. It stops at an object, whose stack V8 writes, at a throw that
// Node says it threw in code that siteTexts leaves out, and at an await it can't tell.
const getEscoreScriptSteps = (
  siteTexts: ReadonlyMap<number, string>,
  unsettledText: string | undefined,
) => {
  const getText = (text: string) => JSON.stringify(text);
  const stop = getText("tla-ts can't print what Node prints for this uncaught exception");
  return `VARIABLE programDone
ThrowSiteText(site) ==
  CASE ${[...siteTexts].map(([index, text]) => `site = <<1, ${index}>> -> ${getText(text)}\n    [] `).join("")}OTHER -> Empty
UnitCharacters == <<${Array.from({ length: 95 }, (_, index) => getText(String.fromCharCode(index + 32))).join(", ")}>>
RECURSIVE UnitsToText(_)
UnitsToText(units) ==
  IF units = <<>> THEN "" ELSE (IF Head(units) = 10 THEN "\\n" ELSE UnitCharacters[Head(units) - 31]) \\o UnitsToText(Tail(units))
NodeText(units) ==
  IF \\A i \\in DOMAIN units : units[i] = 10 \\/ (units[i] >= 32 /\\ units[i] <= 126) THEN UnitsToText(units) ELSE Empty
NodeUncaughtText(r) ==
  LET where == r.c.target
      text == IF IsObject(r.c.value) \\/ IsSymbol(r.c.value) THEN Empty ELSE NodeText(PrimitiveToUnits(r.c.value))
  IN CASE where # Empty /\\ where.kind = "unsettled" -> ${unsettledText === undefined ? stop : getText(unsettledText)}
       [] text = Empty \\/ where = Empty -> ${stop}
       [] where.kind = "module" -> ${getText(`\n${MODULE_UNCAUGHT_LOCATION}\n`)} \\o text \\o ${getText(`\n${TRACE_UNCAUGHT_HINT}`)}
       [] where.kind = "rejection" ->
            ${getText(`${UNHANDLED_REJECTION_LOCATION}\n\n${UNHANDLED_REJECTION_PREFIX}"`)} \\o text \\o ${getText(`"${UNHANDLED_REJECTION_SUFFIX}`)}
       [] ThrowSiteText(where.site) # Empty -> ThrowSiteText(where.site) \\o text \\o ${getText(`\n${TRACE_UNCAUGHT_HINT}`)}
       [] OTHER -> ${stop}
Init ==
  LET r == ApplyTo(RunProgram, InitialState) IN
  /\\ IF r.c.type = "throw" THEN Assert(FALSE, NodeUncaughtText(r)) ELSE TRUE
  /\\ programDone = TRUE
Next == UNCHANGED programDone`;
};

// A TypeScript or JavaScript file compiled by specializing ESCore: a script with the steps above,
// and a model as compileModelToEscore compiles one. Node says where a script's throw statement
// threw by the file's URL, as it runs a TypeScript file, and an ES module's at its own code, but
// for a throw in a function, which a timer might have called.
export const compileTypeScriptFile = async (path: string): Promise<CompiledInput> => {
  // The TypeScript compiler takes a while to load, so only a TypeScript or JavaScript input loads
  // it.
  const ts = (await import("@typescript/typescript6")).default;
  const { compileToEscore } = await import("../typescript/spec/compile");
  const { compileModelToEscore } = await import("../typescript/spec/model");
  const { isScript } = await import("../typescript/context");
  const { getNodeLocation, isEsModule } = await import("../typescript/exceptions");
  const runtime = await getEscoreRuntime();
  const source = readFileSync(path, "utf8");
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.ESNext, true);
  const isModule = isEsModule(sourceFile);
  const throws: ThrowStatement[] = [];
  const collect = (node: Node): void => {
    if (ts.isThrowStatement(node)) throws.push(node);
    ts.forEachChild(node, collect);
  };
  collect(sourceFile);
  const siteTexts = new Map(
    throws.flatMap((statement, index) =>
      !isModule
        ? [[index + 1, `\n${getNodeLocation(statement, false)}\n`] as const]
        : ts.findAncestor(statement, ts.isFunctionLike) === undefined
          ? [[index + 1, `\n${MODULE_UNCAUGHT_LOCATION}\n`] as const]
          : [],
    ),
  );
  // Node says where the entry module awaits once nothing is left to run, which tla-ts tells where
  // its top level awaits at one place.
  const awaits: Node[] = [];
  const collectAwaits = (node: Node): void => {
    if (ts.isFunctionLike(node)) return;
    if (
      ts.isAwaitExpression(node) ||
      (ts.isForOfStatement(node) && node.awaitModifier !== undefined) ||
      (ts.isVariableDeclarationList(node) &&
        (node.flags & ts.NodeFlags.AwaitUsing) === ts.NodeFlags.AwaitUsing)
    ) {
      awaits.push(node);
    }
    ts.forEachChild(node, collectAwaits);
  };
  collectAwaits(sourceFile);
  const unsettledText =
    awaits.length === 1
      ? `${UNSETTLED_AWAIT_WARNING}${getNodeLocation(awaits[0], true)}`
      : undefined;
  const isScriptFile = isScript(sourceFile);
  const model = isScriptFile ? undefined : compileModelToEscore(source, path, runtime);
  const spec =
    model ??
    compileToEscore(source, path, runtime, isModule, {
      steps: getEscoreScriptSteps(siteTexts, unsettledText),
      entries: [],
    });
  return {
    path,
    specPath: join(dirname(path), `${spec.name}.tla`),
    source: parseModule(spec.source),
    config: spec.config,
    loadModule: spec.loadModule,
    preparedModules: spec.preparedModules,
    isScript: isScriptFile,
    notes: model?.notes ?? [],
  };
};
