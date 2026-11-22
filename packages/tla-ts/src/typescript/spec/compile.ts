import ts from "@typescript/typescript6";
import { TlaStrippingError, TlaTypeScriptError } from "../../errors";
import { rejectEarlyErrors } from "../early-errors";
import { getJsxText } from "../program";
import { createModuleResolver, getModuleFormat } from "./resolve";
import type { PreparedModule } from "../../tlc/order";
import { foldNames, getCallBuiltin, HOOKS } from "./library";
import { CONFIG, type EscoreRuntime, ROOT, SCRIPT_STEPS } from "./prepare";
import type { HostRealm } from "./realm";
import {
  getHostCalendars,
  getHostDateFormat,
  getHostLocale,
  getHostRealmFacts,
  getHostTimeZone,
  getTlaString,
  getUnitsOf,
  LOCALE_METHODS,
} from "./runtime";
import { parseCommonJs } from "./cjs-lexer";
import { NODE_IMPORT } from "./node-import";
import { getNumber, type ProgramFile, type ProgramRegion, specialize } from "./specialize";
import { stripTypes } from "./strip-types";
import { getHostIntl } from "./intl";
import { suspendDefinitions } from "./suspend";

// Node's files and paths, which only a program of files reads, so that a host without them, such as
// a browser, compiles a script without loading them.
const readFileSync = (path: string, encoding: "utf8") =>
  process.getBuiltinModule("node:fs").readFileSync(path, encoding);
const resolve = (path: string) => process.getBuiltinModule("node:path").resolve(path);
const pathToFileURL = (path: string) => process.getBuiltinModule("node:url").pathToFileURL(path);

export interface EscoreSpec {
  name: string;
  source: string;
  config: string;
  regions: ProgramRegion[];
  loadModule: (name: string) => string | undefined;
  preparedModules: PreparedModule[];
}

export interface EscoreSteps {
  // The steps, or what makes them of the program's files, numbered from 1 as its code numbers them.
  steps: string | ((files: readonly ProgramFile[]) => string);
  entries: readonly string[];
  // The text of other modules the steps extend, whose reads of the runtime the spec keeps.
  reads?: string;
  // Whether the host loads every file of code as an ES module, as test262's does, rather than as
  // Node does.
  isModuleHost?: boolean;
}

interface CodeDefinition {
  name: string;
  arity: number;
  text: string;
}

// The most characters of a program's TLA+ code that a check parses and runs within Node's default
// heap, which Node 26 gives this machine as 4,192 MB (v8.getHeapStatistics().heap_size_limit), so
// that the heap that a check uses stays within 80% of it, 3,354 MB. The CLI's peaks on Effect's
// modules, by the characters of their code, as --trace-gc gives the heap used before each
// collection and the heap left after the largest, at a load of 30 on 16 cores:
//
//                              characters   used       left       resident
//   Effect.ts                  13.9 million  2,649 MB   1,162 MB   3,146 MB
//   Schema.ts                  36.3 million  3,382 MB   2,612 MB   4,400 MB
//   devtools/DevToolsSchema.ts 36.4 million  3,443 MB   2,743 MB   4,349 MB
//
// The heap used grows 35 MB a million characters past Effect.ts's, as DevToolsSchema.ts's does,
// which reaches 3,354 MB at 33.9 million.
const MOST_CODE_CHARACTERS = 33_000_000;

// A program's definitions with each one whose text is another's but for its name and the names of
// definitions merged before it merged into the first, but for the hooks, which the config names,
// and with each literal sequence of numbers, such as a name's code units, a definition of its own,
// so that a check reads each one once. A sequence of the code units of characters that a TLA+
// string can hold is that string's units.
const getStringUnits = (sequence: string) => {
  const text = getTlaString(
    (sequence.match(/\d+/g) ?? []).map((unit) => String.fromCharCode(Number(unit))).join(""),
  );
  return text === undefined ? undefined : `StringUnits(${text})`;
};

// A long sequence of code units as runs of consecutive code points, the first of each and the code
// unit where each ends, which CodeUnitsOfRuns makes the units of as a function: a few numbers that
// TLA+ reads in place of a tuple of millions, as a string of every character of a Unicode property
// holds. Each run's code points are all below 65536 or all from there, so that each takes one code
// unit or two; a surrogate pair is one code point and a lone surrogate one code unit, which the
// runs encode back to the units they came from.
const getUnitRuns = (sequence: string) => {
  const units = (sequence.match(/\d+/g) ?? []).map(Number);
  if (units.length < 4096 || units.some((unit) => unit > 0xffff)) return undefined;
  const starts: number[] = [];
  const ends: number[] = [];
  let index = 0;
  let previous = -2;
  while (index < units.length) {
    const unit = units[index];
    const next = units[index + 1];
    const isPair = unit >= 0xd800 && unit <= 0xdbff && next >= 0xdc00 && next <= 0xdfff;
    const codePoint = isPair ? (unit - 0xd800) * 1024 + (next - 0xdc00) + 0x10000 : unit;
    index += isPair ? 2 : 1;
    if (codePoint === previous + 1 && codePoint !== 0x10000) ends[ends.length - 1] = index;
    else {
      starts.push(codePoint);
      ends.push(index);
    }
    previous = codePoint;
  }
  return starts.length * 16 > units.length
    ? undefined
    : `CodeUnitsOfRuns(<<${starts.join(", ")}>>, <<${ends.join(", ")}>>)`;
};

const compact = (definitions: readonly CodeDefinition[]) => {
  const merged = new Map<string, string>();
  const firsts = new Map<string, string>();
  const rename = (text: string) =>
    text.replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, (name) => merged.get(name) ?? name);
  for (const definition of definitions) {
    if (HOOKS.has(definition.name.replace(/^Program/, ""))) continue;
    const key = `${definition.arity} ${rename(definition.text).slice(definition.name.length)}`;
    const first = firsts.get(key);
    if (first === undefined) firsts.set(key, definition.name);
    else merged.set(definition.name, first);
  }
  const sequences = new Map<string, string>();
  const kept = definitions
    .filter((definition) => !merged.has(definition.name))
    .map((definition) => ({
      ...definition,
      text: /^SourceText\d+$/.test(definition.name)
        ? definition.text
        : // The parts of a long sequence are split rather than matched by a repeated group,
          // whose backtracking runs out of stack.
          rename(definition.text).replace(/<<[\d, ]+>>/g, (sequence) => {
            if (
              !sequence
                .slice(2, -2)
                .split(", ")
                .every((part) => /^\d+$/.test(part))
            ) {
              return sequence;
            }
            const name = sequences.get(sequence) ?? `Units${sequences.size + 1}`;
            sequences.set(sequence, name);
            return name;
          }),
    }));
  return [
    ...[...sequences].map((entry) => ({
      name: entry[1],
      arity: 0,
      text: `${entry[1]} == ${getStringUnits(entry[0]) ?? getUnitRuns(entry[0]) ?? entry[0]}`,
    })),
    ...kept,
  ];
};

// A program's definitions in an order where each comes after those that it reads, unless they read
// each other, and the names of the ones that a definition reads before they come, which TLA+ needs
// declared RECURSIVE.
const sortDefinitions = (definitions: readonly CodeDefinition[]) => {
  const byName = new Map(definitions.map((definition) => [definition.name, definition]));
  const isVisited = new Map<string, boolean>();
  const sorted: CodeDefinition[] = [];
  const recursive = new Set<string>();
  const visit = (definition: CodeDefinition) => {
    isVisited.set(definition.name, false);
    // A name inside a string, such as SourceText's, is text rather than a read.
    for (const name of definition.text
      .slice(definition.text.indexOf("=="))
      .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, "")
      .match(/\b[A-Z]\w*/g) ?? []) {
      const read = byName.get(name);
      if (read === undefined) continue;
      if (isVisited.get(name) === false) recursive.add(name);
      else if (!isVisited.has(name)) visit(read);
    }
    isVisited.set(definition.name, true);
    sorted.push(definition);
  };
  definitions.forEach((definition) => {
    if (!isVisited.has(definition.name)) visit(definition);
  });
  return { sorted, recursive };
};

// The JavaScript that Node runs of a file: a .ts file's code with its types replaced by whitespace,
// as Node strips them, which keeps its positions and its functions' source texts, and a .js file's
// code as it is. A module is one where it neither imports nor exports too, where await at its top
// level awaits, which its JavaScript marks with an empty export after its code. A CommonJS
// module's JavaScript is in the function that Node wraps it in, where a .js file may return.
const transpile = (source: string, fileName: string, isModule: boolean, wrapper = ["", ""]) => {
  const isTypeScript = /\.[cm]?tsx?$/.test(fileName);
  const transpiled = ts.transpileModule(
    isTypeScript ? source : `${wrapper[0]}${source}${wrapper[1]}`,
    {
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: isModule ? ts.ModuleKind.ESNext : ts.ModuleKind.Preserve,
        moduleDetection: isModule ? ts.ModuleDetectionKind.Force : ts.ModuleDetectionKind.Legacy,
        // A script runs in strict mode only where it says so, which TypeScript 6 deprecates.
        alwaysStrict: false,
        ignoreDeprecations: "6.0",
      },
      // TypeScript fails on a file that imports itself by the name it transpiles under, which
      // keeps only the file's extension.
      fileName: `/tla-ts/transpiled${/\.[^./]*$/.exec(fileName)?.[0] ?? ""}`,
      reportDiagnostics: true,
    },
  );
  const error = transpiled.diagnostics?.find(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (error !== undefined) {
    throw new TlaTypeScriptError(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  }
  const code = isTypeScript
    ? stripTypes(
        ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS),
      )
    : source;
  return `${wrapper[0]}${code}${wrapper[1]}`;
};

// A file of Node's wrapper, whose name wrapped records.
const wrap = (sourceFile: ts.SourceFile, wrapped: Set<string>) => {
  wrapped.add(sourceFile.fileName);
  return sourceFile;
};

// Where a let that a line break follows is a with statement's body, which TypeScript's parser reads
// as a declaration, and JavaScript as the name let, with a semicolon after it by ASI: the end of
// each such let.
const findLineBrokenLets = (node: ts.Node): number[] => {
  const name = ts.isVariableStatement(node)
    ? node.declarationList.declarations.at(0)?.name
    : undefined;
  const isLineBroken =
    ts.isVariableStatement(node) &&
    ts.isWithStatement(node.parent) &&
    (node.declarationList.flags & ts.NodeFlags.Let) !== 0 &&
    name !== undefined &&
    !ts.isArrayBindingPattern(name) &&
    node
      .getSourceFile()
      .text.slice(node.declarationList.getStart() + "let".length, name.getStart())
      .includes("\n");
  const found: number[] = [];
  ts.forEachChild(node, (child) => {
    found.push(...findLineBrokenLets(child));
  });
  return isLineBroken ? [node.declarationList.getStart() + "let".length, ...found] : found;
};

const parse = (code: string, fileName: string, isModule: boolean): ts.SourceFile => {
  const name = fileName.replace(/\.[cm]?tsx?$/, ".js");
  const options: ts.CreateSourceFileOptions = {
    languageVersion: ts.ScriptTarget.ESNext,
    impliedNodeFormat: isModule ? ts.ModuleKind.ESNext : ts.ModuleKind.CommonJS,
  };
  const sourceFile = ts.createSourceFile(name, code, options, true, ts.ScriptKind.JS);
  // Each such let takes the semicolon that ASI gives it, in place of the space after it where there
  // is one, so that the code keeps its positions.
  const lets = findLineBrokenLets(sourceFile);
  if (lets.length > 0) {
    return parse(
      lets.reduceRight(
        (text, end) =>
          `${text.slice(0, end)};${text.slice(/[ \t]/.test(text[end]) ? end + 1 : end)}`,
        code,
      ),
      fileName,
      isModule,
    );
  }
  return !isModule || ts.isExternalModule(sourceFile)
    ? sourceFile
    : ts.createSourceFile(name, `${code}\nexport {};\n`, options, true, ts.ScriptKind.JS);
};

// Whether a file's code has an early error, for which Node throws a SyntaxError where it loads the
// file, as tla-ts finds a program's.
const hasEarlyError = (sourceFile: ts.SourceFile) => {
  try {
    rejectEarlyErrors(sourceFile);
    return false;
  } catch (error) {
    if (error instanceof TlaTypeScriptError && / SyntaxError: /.test(error.message)) return true;
    throw error;
  }
};

// The specifier of each import and export of a module, or each require of a string of a CommonJS
// module, with the literal that names it.
const getSpecifiers = (sourceFile: ts.SourceFile, kind: ProgramFile["kind"]) => {
  const specifiers = new Map<string, ts.StringLiteralLike>();
  const visit = (node: ts.Node): void => {
    const literal =
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && kind === "module"
        ? node.moduleSpecifier
        : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? node.arguments[0]
          : ts.isCallExpression(node) &&
              kind === "commonjs" &&
              ts.isIdentifier(node.expression) &&
              node.expression.text === "require" &&
              node.arguments.length === 1
            ? node.arguments[0]
            : undefined;
    if (literal !== undefined && ts.isStringLiteralLike(literal)) {
      specifiers.set(literal.text, literal);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
};

// The function that Node wraps a CommonJS module's code in, as its loader writes it.
const WRAPPER = ["(function (exports, require, module, __filename, __dirname) { ", "\n});"];

// Runs compile, whose stops name where they are in the code that tla-ts parses, as the file's own
// code places them: the entry by the name the compile gives it, and a file that Node wraps, as
// CommonJS, at its own columns, which the wrapper, of the parsed names in wrapped, moves on its
// first line.
const atSourceLocations = <T>(fileName: string, compile: (wrapped: Set<string>) => T): T => {
  const wrapped = new Set<string>();
  try {
    return compile(wrapped);
  } catch (error) {
    // Node's stripping of a file's types reads the file's own code, which its error points into.
    const found =
      error instanceof TlaTypeScriptError && !(error instanceof TlaStrippingError)
        ? /^(.+?):(\d+):(\d+) ([^]*)$/.exec(error.message)
        : null;
    if (found === null) throw error;
    const entry = fileName.replace(/\.[cm]?tsx?$/, ".js");
    const isEntry = ts.sys?.fileExists(fileName) === true && found[1] === resolve(entry);
    const column =
      Number(found[2]) === 1 && wrapped.has(found[1])
        ? Number(found[3]) - WRAPPER[0].length
        : Number(found[3]);
    throw new TlaTypeScriptError(`${isEntry ? entry : found[1]}:${found[2]}:${column} ${found[4]}`);
  }
};

// Whether JSON.parse reads a text, as Node's does where it loads a JSON file.
const isJson = (text: string) => {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

// The names that Node's ModuleWrap of a CommonJS module exports: its lexer's, then default and
// module.exports.
const getWrapperNames = (names: ReadonlySet<string>) => [
  ...names,
  ...["default", "module.exports"].filter((name) => !names.has(name)),
];

// A program's files: the script, or the module and each file that its imports and requires load,
// as the model's resolver finds them, each once, by path. A require of a file that Node reads as
// other than code, such as JSON, loads none.
const loadFiles = (
  source: string,
  fileName: string,
  isModule: boolean,
  host: Pick<EscoreSteps, "isModuleHost">,
  // The names of the parsed files that Node's wrapper holds the code of.
  wrapped: Set<string>,
): ProgramFile[] => {
  // Whether the host loads a file as an ES module or as CommonJS (see getModuleFormat).
  const getKind = (path: string, text: string): ProgramFile["kind"] =>
    host.isModuleHost === true ? "module" : getModuleFormat(path, text);
  // A script loads modules only where it calls import().
  const isScript = !isModule;
  if (isScript && !/\bimport\s*\(/.test(source)) {
    const sourceFile = parse(
      transpile(getJsxText(fileName, source), fileName, false),
      fileName,
      false,
    );
    // Node runs nothing of a script that it fails to parse.
    rejectEarlyErrors(sourceFile);
    return [
      {
        sourceFile,
        path: fileName,
        kind: "script",
        targets: new Map(),
        exportNames: [],
      },
    ];
  }
  const resolveModule = createModuleResolver(fileName);
  // The file that a literal of a file's code loads, as Node loads it: a require's in CommonJS's
  // mode. TypeScript's program reads the types of the file that TypeScript resolves it to, so a
  // literal that the two resolve to different files stops.
  const resolve = (literal: ts.StringLiteralLike) => {
    const resolved = resolveModule(
      literal.text,
      literal.getSourceFile().fileName,
      ts.isCallExpression(literal.parent) &&
        ts.isIdentifier(literal.parent.expression) &&
        literal.parent.expression.text === "require",
    );
    if (
      resolved.file !== undefined &&
      resolved.typeScriptFile !== undefined &&
      getRealPath(resolved.file) !== getRealPath(resolved.typeScriptFile)
    ) {
      throw new TlaTypeScriptError(
        "tla-ts can't read the types of a module that Node loads from another file than TypeScript reads",
        literal,
      );
    }
    return resolved.file;
  };
  const getRealPath = (path: string) => ts.sys.realpath?.(ts.sys.resolvePath(path)) ?? path;
  const entry = ts.sys.fileExists(fileName) ? getRealPath(fileName) : fileName;
  // Each file's number, by its path, in the order the program finds them.
  const numbers = new Map([[entry, 1]]);
  const files: ProgramFile[] = [];
  // cjsPreparseModuleExports of Node's ESM loader: the names that a CommonJS module exports, as its
  // lexer finds them, with those of each module that it re-exports, which a require from it
  // resolves to and Node reads as CommonJS or JavaScript. A module's names are read once, before
  // its re-exports', so that a cycle of re-exports ends, as Node's loader keeps them.
  const preparsed = new Map<string, Set<string>>();
  const preparse = (path: string, text: string): Set<string> => {
    const found = preparsed.get(path);
    if (found !== undefined) return found;
    const analysis = parseCommonJs(text);
    const names = new Set(analysis.exports);
    preparsed.set(path, names);
    for (const reexport of analysis.reexports) {
      const call = ts.createSourceFile(
        path,
        `require(${JSON.stringify(reexport)})`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const statement = call.statements[0];
      const literal =
        ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression)
          ? statement.expression.arguments[0]
          : undefined;
      const resolved =
        literal !== undefined && ts.isStringLiteral(literal) ? resolve(literal) : undefined;
      if (resolved === undefined) continue;
      const target = getRealPath(resolved);
      const targetText = readFileSync(target, "utf8");
      if (getKind(target, targetText) === "commonjs" || target.endsWith(".js")) {
        preparse(target, targetText).forEach((name) => names.add(name));
      }
    }
    return names;
  };
  // The facade of each ES module that a CommonJS module requires, by its path, as Node's
  // createRequiredModuleFacade writes it, whose namespace a require gives where the module exports
  // a default.
  const facades = new Map<string, string>();
  for (const path of numbers.keys()) {
    const original = facades.get(path);
    const text =
      original !== undefined
        ? `export * from ${JSON.stringify(original)};\nexport { default } from ${JSON.stringify(original)};\nexport const __esModule = true;\n`
        : getJsxText(path, path === entry ? source : readFileSync(path, "utf8"));
    if (path.endsWith(".json")) {
      files.push({
        sourceFile: ts.createSourceFile(path, "", ts.ScriptTarget.ESNext),
        path,
        kind: "json",
        targets: new Map(),
        exportNames: [],
        json: isJson(text.replace(/^\uFEFF/, "")) ? text : undefined,
      });
      continue;
    }
    // A module entry that no file holds runs as an ES module, as no package's type or syntax
    // makes it CommonJS for Node.
    const kind =
      path !== entry
        ? getKind(path, text)
        : isScript
          ? "script"
          : ts.sys.fileExists(entry)
            ? getKind(path, text)
            : "module";
    const written = getSpecifiers(
      ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true),
      kind,
    );
    // Node reads a hashbang as a comment.
    const code = text.replace(/^#!.*/, (line) => " ".repeat(line.length));
    const sourceFile =
      kind === "commonjs"
        ? wrap(parse(transpile(code, path, false, WRAPPER), path, false), wrapped)
        : parse(transpile(code, path, kind !== "script"), path, kind !== "script");
    // Node runs nothing of a program whose entry it fails to parse, and loads none of the requests
    // of another file that it fails to parse.
    if (path === entry) rejectEarlyErrors(sourceFile);
    const isRejected = path !== entry && kind !== "script" && hasEarlyError(sourceFile);
    const targets = new Map(
      [...(isRejected ? [] : getSpecifiers(sourceFile, kind).keys())].flatMap((specifier) => {
        const literal = written.get(specifier);
        const found = literal === undefined ? undefined : resolve(literal);
        if (found === undefined || !/\.([cm]?[jt]sx?|json)$/.test(found)) return [];
        const target = getRealPath(found);
        if (!numbers.has(target)) numbers.set(target, numbers.size + 1);
        const facade = `${target}.facade.mjs`;
        if (
          kind === "commonjs" &&
          !target.endsWith(".json") &&
          !facades.has(facade) &&
          getKind(target, readFileSync(target, "utf8")) === "module"
        ) {
          facades.set(facade, target);
          numbers.set(facade, numbers.size + 1);
        }
        return [[specifier, numbers.get(target) ?? 0] as const];
      }),
    );
    files.push({
      sourceFile,
      path,
      kind,
      targets,
      exportNames: kind === "commonjs" ? getWrapperNames(preparse(path, text)) : [],
      isRejected,
    });
  }
  const withFacades = files.map((file) => ({
    ...file,
    facade: numbers.get(`${file.path}.facade.mjs`),
  }));
  // A program that calls import() runs Node's code for it.
  const isImporting = files.some((file) => {
    const visit = (node: ts.Node): boolean =>
      (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) ||
      (ts.forEachChild(node, visit) ?? false);
    return visit(file.sourceFile);
  });
  return isImporting
    ? [
        ...withFacades,
        {
          sourceFile: parse(
            transpile(NODE_IMPORT, "node-import.js", false),
            "node-import.js",
            false,
          ),
          path: "node:internal/modules/esm/import",
          kind: "host" as const,
          targets: new Map(),
          exportNames: [],
        },
      ]
    : withFacades;
};

// The frames of Node 26 below the top level of the ES module it runs as its entry, where V8's stack
// trace ends: the module job that evaluates the module, and the async frames of the loader that
// awaits it.
const ENTRY_MODULE_FRAMES = [
  "ModuleJob.run (node:internal/modules/esm/module_job:569:25)",
  "async node:internal/modules/esm/loader:650:26",
  "async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:105:5)",
];

// Where Node places a file's code in a stack trace: a file URL, but for a JavaScript file that Node
// loads as CommonJS, its path; none for a script, which tla-ts doesn't know how a host runs.
const getHostFileLocation = (file: ProgramFile) =>
  file.kind === "script"
    ? "Empty"
    : getUnitsOf(
        file.kind === "commonjs" && !/\.[cm]?ts$/.test(file.path)
          ? resolve(file.path)
          : pathToFileURL(resolve(file.path)).href,
      );

// The program's HostParseDate, where it names Date: the time value that the host's Date.parse
// gives each string that the program writes between quotes, and an ordinary object's string, for
// those outside ECMA-262's formats, whose reading is the host's own. A host whose realm was
// recorded reads none of them.
const getHostParseDate = (text: string, words: ReadonlySet<string>, realm: HostRealm) => {
  const parseDate = realm.parseDate;
  if (!words.has("Date") || parseDate === undefined) return "HostParseDate(u) == [found |-> FALSE]";
  const strings = new Set([
    ...[...text.matchAll(/(["'`])((?:(?!\1)[^\\\n]){1,100})\1/g)].map((match) => match[2]),
    "[object Object]",
  ]);
  return `HostParseDate(u) ==\n  CASE ${[...strings].map((string) => `u = ${getUnitsOf(string)} -> [found |-> TRUE, time |-> ${getNumber(parseDate(string))}]`).join("\n    [] ")}\n    [] OTHER -> [found |-> FALSE]`;
};

// The groups of ESCore's parts that a module runs on: its loading, linking, and evaluation, the
// promise of its evaluation, and the proxies that stand for what of the host ESCore lacks.
const MODULE_GROUPS = new Set(["79-proxy.tla", "86-promise.tla", "88-modules.tla"]);

// Compiles a TypeScript script or module to a spec whose Init runs it as ESCore runs a script or a
// host its entry module: the realm, then the program, then the jobs it queued. An uncaught exception
// fails Init's assertion. The spec's module ProgramCode holds the program's code and the spec's
// steps, the variables and the definitions of Init and Next, and the runtime's prepared modules
// the rest. A model gives its own steps, and the names of the functions they call, which the
// program may name nowhere else.
export const compileToEscore = (
  source: string,
  fileName: string,
  runtime: EscoreRuntime,
  isModule = false,
  model: EscoreSteps = { steps: SCRIPT_STEPS, entries: [] },
): EscoreSpec => {
  // Node reads a program's file as UTF-8, where a lone surrogate, which a string in memory may
  // hold, is U+FFFD.
  const { files, program } = atSourceLocations(fileName, (wrapped) => {
    const loaded = loadFiles(source.toWellFormed(), fileName, isModule, model, wrapped);
    return {
      files: loaded,
      program: specialize(loaded, new Set([...runtime.internalKeys, ...model.entries])),
    };
  });
  // The runtime's setTimeout gives a script undefined where Node gives a Timeout, so a script may
  // only call it as a statement.
  const findTimerValue = (node: ts.Node): ts.Node | undefined =>
    ts.isIdentifier(node) &&
    node.text === "setTimeout" &&
    !(
      ts.isCallExpression(node.parent) &&
      node.parent.expression === node &&
      ts.isExpressionStatement(node.parent.parent)
    )
      ? node
      : ts.forEachChild(node, findTimerValue);
  const timerValue =
    !isModule && program.identifiers.has("setTimeout")
      ? files.map((file) => findTimerValue(file.sourceFile)).find((node) => node !== undefined)
      : undefined;
  if (timerValue !== undefined) {
    throw new TlaTypeScriptError("tla-ts can't read the value of setTimeout", timerValue);
  }
  // A module program's host globals and built-ins' properties that ESCore's realm lacks stop where
  // its code reaches them, and a script's, where its code names them.
  const hostOnly = isModule
    ? undefined
    : (runtime.realm.scriptGlobals.find((name) => program.identifiers.has(name)) ??
      runtime.realm.builtInProperties.find((property) => program.words.has(property.key))?.key);
  if (hostOnly !== undefined) {
    throw new TlaTypeScriptError(
      `tla-ts can't run the host's ${hostOnly}, which ESCore leaves out`,
    );
  }
  const isQueuing =
    isModule ||
    program.isAsync ||
    program.words.has("Promise") ||
    program.words.has("then") ||
    program.identifiers.has("setTimeout");
  const isIncluded = (gate: EscoreRuntime["gates"][number]) =>
    ((isModule || files.length > 1) && MODULE_GROUPS.has(gate.group)) ||
    // A program that queues jobs runs them, as RunJobs of the promises' group does.
    (isQueuing && gate.group === "86-promise.tla") ||
    // A JSON file's exports are what JSON.parse gives.
    (gate.group === "77-json.tla" && files.some((file) => file.kind === "json")) ||
    // A TextEncoder's encode makes a Uint8Array.
    (isModule && gate.group === "84" && program.words.has("TextEncoder")) ||
    [...gate.triggers].some((word) => program.words.has(word));
  const included = runtime.gates.filter(isIncluded);
  const kept = new Set(included.flatMap((gate) => gate.reached));
  // The operators of the groups that the program names none of the triggers of.
  const leaves = runtime.gates
    .filter((gate) => !isIncluded(gate))
    .flatMap((gate) => gate.stubs)
    .filter((stub) => !kept.has(stub.name));
  const leftOut = new Set(
    runtime.gates.filter((gate) => !isIncluded(gate)).map((gate) => gate.group),
  );
  // The host's globals, then, where the program calls import(), the host's code for it.
  const hostFile = files.findIndex((file) => file.kind === "host") + 1;
  const hostImport =
    hostFile === 0
      ? "DefineHost(s, HostProperties)"
      : `LET g == DefineHost(s, HostProperties) IN IF IsAbrupt(g) THEN g ELSE SetupHostImport(g.s, ${hostFile})`;
  const runJobs =
    "LET j == RunJobs(p.s) IN IF IsAbrupt(j) THEN j ELSE LET u == UnhandledRejection(j.s) IN IF IsAbrupt(u) THEN u ELSE";
  // A host whose realm was recorded answers none of Intl's questions, as if the program asked none.
  const intl = getHostIntl(
    files.map((file) => file.sourceFile),
    runtime.realm.getLocale === undefined ? new Set<string>() : program.words,
  );
  const definitions = compact(
    suspendDefinitions(
      [
        ...program.definitions,
        {
          name: "HostProperties",
          arity: 0,
          text: `HostProperties == <<${(isModule
            ? [
                ...runtime.realm.moduleGlobals.filter((global) => program.words.has(global.name)),
                ...runtime.realm.builtInProperties
                  // Error.stackTraceLimit, which an error's stack reads, is always the host's.
                  .filter(
                    (property) =>
                      program.words.has(property.key) ||
                      (property.owner === "Error" && property.key === "stackTraceLimit"),
                  ),
              ].flatMap((property) => property.record ?? [])
            : []
          ).join(", ")}>>`,
        },
        {
          name: "HostTimeZone",
          arity: 1,
          text: program.words.has("Temporal")
            ? getHostTimeZone(files.map((file) => file.sourceFile.text).join("\n"), runtime.realm)
            : `HostTimeZone(key) == [found |-> "unknown"]`,
        },
        {
          name: "HostDateFormat",
          arity: 1,
          text: getHostDateFormat(program.words, runtime.realm),
        },
        {
          name: "HostRealmFact",
          arity: 1,
          text: getHostRealmFacts(runtime.realm),
        },
        {
          name: "HostParseDate",
          arity: 1,
          text: getHostParseDate(
            files.map((file) => file.sourceFile.text).join("\n"),
            program.words,
            runtime.realm,
          ),
        },
        ...intl.definitions,
        ...getHostCalendars(files.map((file) => file.sourceFile.text).join("\n"), program.words),
        {
          name: "HostLocale",
          arity: 1,
          text: getHostLocale(
            files.map((file) => file.sourceFile.text).join("\n"),
            program.words,
            intl.strings,
            runtime.realm,
          ),
        },
        {
          name: "HostFileLocation",
          arity: 1,
          text: `HostFileLocation(file) ==\n  CASE ${files.map((file, index) => `file = ${index + 1} -> ${getHostFileLocation(file)}`).join("\n    [] ")}`,
        },
        {
          name: "HostFilePath",
          arity: 1,
          // The path of the file that the host loaded each module from, which import.meta gives.
          text: `HostFilePath(file) ==\n  CASE ${files.map((file, index) => `file = ${index + 1} -> ${file.kind === "module" ? getUnitsOf(resolve(file.path)) : "Empty"}`).join("\n    [] ")}`,
        },
        {
          name: "HostDefaultStackTraceLimit",
          arity: 1,
          // A script, whose realm lacks the host's Error.stackTraceLimit, has Node's default.
          text: `HostDefaultStackTraceLimit(file) == ${isModule ? -1 : 10}`,
        },
        {
          name: "HostEntryFrames",
          arity: 1,
          text: `HostEntryFrames(file) == ${files[0].kind === "module" ? `<<${ENTRY_MODULE_FRAMES.map(getUnitsOf).join(", ")}>>` : "Empty"}`,
        },
        {
          name: "RunProgram",
          arity: 1,
          // A host exits with an error where its entry module still awaits once nothing is left
          // to run, which the completion's target marks, and reports the rejection of its entry
          // module's evaluation as an uncaught exception, before any other promise's rejection, as
          // Node does.
          text:
            files[0].kind === "module"
              ? `RunProgram(s) == LET h == ${hostImport} IN IF IsAbrupt(h) THEN h ELSE LET p == Program(h.s) IN IF IsAbrupt(p) THEN p ELSE LET j == RunJobs(p.s) IN IF IsAbrupt(j) THEN j ELSE IF Slots(j.s, Val(p)).state = "rejected" THEN Abrupt(j.s, Completion("throw", Slots(j.s, Val(p)).result, [kind |-> "module"])) ELSE LET u == UnhandledRejection(j.s) IN IF IsAbrupt(u) THEN u ELSE LET t == RunTimers(u.s) IN IF IsAbrupt(t) THEN t ELSE IF Slots(t.s, Val(p)).state = "pending" THEN LET e == ThrowError(t.s, "Error") IN [e EXCEPT !.c.target = [kind |-> "unsettled"]] ELSE t`
              : isModule
                ? `RunProgram(s) == LET h == ${hostImport} IN IF IsAbrupt(h) THEN h ELSE LET p == Program(h.s) IN IF IsAbrupt(p) THEN p ELSE ${runJobs} RunTimers(u.s)`
                : hostFile !== 0
                  ? `RunProgram(s) == LET h == SetupHostImport(s, ${hostFile}) IN IF IsAbrupt(h) THEN h ELSE LET p == Program(h.s) IN IF IsAbrupt(p) THEN p ELSE ${runJobs} RunTimers(u.s)`
                  : isQueuing
                    ? `RunProgram(s) == LET p == Program(s) IN IF IsAbrupt(p) THEN p ELSE ${runJobs} RunTimers(u.s)`
                    : "RunProgram(s) == Program(s)",
        },
        {
          name: "SettleJobs",
          arity: 1,
          // The jobs, the rejections, and the timers that a model's call leaves, which a program
          // that queues none has none of.
          text: isQueuing
            ? `SettleJobs(s) == ${runJobs.replaceAll("p.s", "s")} RunTimers(u.s)`
            : "SettleJobs(s) == Ok(s, Undefined)",
        },
        {
          name: "CallBuiltin",
          arity: 6,
          text: getCallBuiltin(
            "CallBuiltin",
            runtime.families.filter((family) => !leftOut.has(family.group)),
            LOCALE_METHODS,
          ),
        },
      ],
      runtime.resumableSteps,
    ).map((definition) => ({
      name: HOOKS.has(definition.name) ? `Program${definition.name}` : definition.name,
      arity: definition.arity,
      text: foldNames(
        definition.text.replace(
          new RegExp(`\\b(?:${[...HOOKS.keys()].join("|")})\\b`, "g"),
          (name) => `Program${name}`,
        ),
      ),
    })),
  );
  const code = definitions.map((definition) => definition.text).join("\n");
  if (code.length > MOST_CODE_CHARACTERS) {
    throw new TlaTypeScriptError(
      `tla-ts can't check a program whose TLA+ spec has more than ${MOST_CODE_CHARACTERS} characters: this program's has ${code.length}, which a check would parse and run past Node's default heap`,
    );
  }
  const steps = typeof model.steps === "string" ? model.steps : model.steps(files);
  const view = runtime.getView(
    `${code}\n${steps}\n${model.reads ?? ""}\n${ROOT}\n${CONFIG}`,
    leaves.map((leaf) => leaf.name),
  );
  const viewed = new Set(view.module.definitions.map((definition) => definition.name));
  const stubs = leaves.filter((leaf) => viewed.has(leaf.name));
  const ordered = sortDefinitions(definitions);
  const module = [
    "---- MODULE ProgramCode ----",
    "EXTENDS ESRuntime",
    ...ordered.sorted
      .filter((definition) => ordered.recursive.has(definition.name))
      .map(
        (definition) =>
          `RECURSIVE ${definition.name}(${Array.from({ length: definition.arity }, () => "_").join(", ")})`,
      ),
    ...ordered.sorted.map((definition) => definition.text),
    ...stubs.map(
      (stub) =>
        `Stub${stub.name}(${Array.from({ length: stub.arity }, (_, index) => `p${index + 1}`).join(", ")}) == Assert(FALSE, "tla-ts can't run ${stub.name}, which this program's spec leaves out of ESCore")`,
    ),
    steps,
    "====",
    "",
  ].join("\n");
  return {
    name: "Program",
    source: ROOT,
    config: [CONFIG, ...stubs.map((stub) => `CONSTANT ${stub.name} <- Stub${stub.name}`), ""].join(
      "\n",
    ),
    regions: program.regions,
    loadModule: (name) => (name === "ProgramCode" ? module : undefined),
    preparedModules: [...runtime.modules, view],
  };
};
