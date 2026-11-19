import { readFileSync } from "node:fs";
import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../../errors";
import { createJavaScriptFile, isCommonJsFile } from "../common-js";
import { createFileResolver } from "../program";
import type { PreparedModule } from "../../tlc/order";
import { foldNames, getCallBuiltin, HOOKS } from "./library";
import { CONFIG, type EscoreRuntime, ROOT } from "./prepare";
import { getHostTimeZone, getTlaString, LOCALE_METHODS } from "./runtime";
import { parseCommonJs } from "./cjs-lexer";
import { NODE_IMPORT } from "./node-import";
import { getNumber, type ProgramFile, specialize } from "./specialize";
import { suspendDefinitions } from "./suspend";

export interface EscoreSpec {
  name: string;
  source: string;
  config: string;
  loadModule: (name: string) => string | undefined;
  preparedModules: PreparedModule[];
}

interface CodeDefinition {
  name: string;
  arity: number;
  text: string;
}

// A program's definitions with each one whose text is another's but for its name and the names of
// definitions merged before it merged into the first, and with each literal sequence of numbers,
// such as a name's code units, a definition of its own, so that a check reads each one once. A
// sequence of the code units of characters that a TLA+ string can hold is that string's units.
const getStringUnits = (sequence: string) => {
  const text = getTlaString(String.fromCharCode(...(sequence.match(/\d+/g) ?? []).map(Number)));
  return text === undefined ? undefined : `StringUnits(${text})`;
};

const compact = (definitions: readonly CodeDefinition[]) => {
  const merged = new Map<string, string>();
  const firsts = new Map<string, string>();
  const rename = (text: string) =>
    text.replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, (name) => merged.get(name) ?? name);
  for (const definition of definitions) {
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
        : rename(definition.text).replace(/<<\d+(?:, \d+)*>>/g, (sequence) => {
            const name = sequences.get(sequence) ?? `Units${sequences.size + 1}`;
            sequences.set(sequence, name);
            return name;
          }),
    }));
  return [
    ...[...sequences].map((entry) => ({
      name: entry[1],
      arity: 0,
      text: `${entry[1]} == ${getStringUnits(entry[0]) ?? entry[0]}`,
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
      .replace(/"(?:[^"\\]|\\.)*"/g, "")
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

// JavaScript of a file of TypeScript's code, which keeps its imports and exports. A module is one
// where it neither imports nor exports too, where await at its top level awaits, which its
// JavaScript marks with an empty export.
const transpile = (source: string, fileName: string, isModule: boolean) => {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: isModule ? ts.ModuleKind.ESNext : ts.ModuleKind.Preserve,
      moduleDetection: isModule ? ts.ModuleDetectionKind.Force : ts.ModuleDetectionKind.Legacy,
      useDefineForClassFields: true,
      // A script runs in strict mode only where it says so, which TypeScript 6 deprecates.
      alwaysStrict: false,
      ignoreDeprecations: "6.0",
    },
    // TypeScript fails on a file that imports itself by the name it transpiles under, which
    // keeps only the file's extension.
    fileName: `/tla-ts/transpiled${/\.[^./]*$/.exec(fileName)?.[0] ?? ""}`,
    reportDiagnostics: true,
  });
  const error = transpiled.diagnostics?.find(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (error !== undefined) {
    throw new TlaTypeScriptError(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  }
  return ts.createSourceFile(
    fileName.replace(/\.[cm]?tsx?$/, ".js"),
    transpiled.outputText,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
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

// Whether Node loads a file as an ES module or as CommonJS: TypeScript's code as a module, as
// tla-ts compiles it, unless it's a .cts file, and JavaScript as its extension, its package's type,
// or its syntax tells.
const getKind = (path: string, text: string): ProgramFile["kind"] =>
  /\.[cm]?tsx?$/.test(path)
    ? path.endsWith(".cts")
      ? "commonjs"
      : "module"
    : isCommonJsFile(createJavaScriptFile(path, text, ts.ScriptTarget.ESNext))
      ? "commonjs"
      : "module";

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
const loadFiles = (source: string, fileName: string, isModule: boolean): ProgramFile[] => {
  if (!isModule) {
    return [
      {
        sourceFile: transpile(source, fileName, false),
        path: fileName,
        kind: "script",
        targets: new Map(),
        exportNames: [],
      },
    ];
  }
  const resolve = createFileResolver(fileName);
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
        : path === entry
          ? source
          : readFileSync(path, "utf8");
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
    const kind = getKind(path, text);
    const written = getSpecifiers(
      ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true),
      kind,
    );
    // Node reads a hashbang as a comment.
    const code = text.replace(/^#!.*/, (line) => " ".repeat(line.length));
    const sourceFile =
      kind === "commonjs"
        ? transpile(`${WRAPPER[0]}${code}${WRAPPER[1]}`, path, false)
        : transpile(code, path, true);
    const targets = new Map(
      [...getSpecifiers(sourceFile, kind).keys()].flatMap((specifier) => {
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
          sourceFile: transpile(NODE_IMPORT, "node-import.js", false),
          path: "node:internal/modules/esm/import",
          kind: "host" as const,
          targets: new Map(),
          exportNames: [],
        },
      ]
    : withFacades;
};

// A property of the host's global object or of one of its built-ins, as the record that DefineHost
// defines it by: its kind, as typeof gives its value, or value for a primitive, or console, which
// the runtime has part of, or accessor for a built-in's accessor, and its attributes. A global's
// getter gives its value, and a property whose value is a symbol or a BigInt is left out.
const getHostProperty = (
  owner: string,
  name: string,
  descriptor: PropertyDescriptor | undefined,
  host: object | undefined,
) => {
  if (descriptor === undefined) return [];
  const isAccessor = !("value" in descriptor);
  const value: unknown = !isAccessor
    ? descriptor.value
    : host === undefined
      ? undefined
      : Reflect.get(host, name);
  const primitive =
    value === undefined
      ? "Undefined"
      : value === null
        ? "Null"
        : typeof value === "boolean"
          ? value
            ? "True"
            : "False"
          : typeof value === "number"
            ? `Num(${getNumber(value)})`
            : typeof value === "string"
              ? `Str(N(${JSON.stringify(value)}))`
              : undefined;
  const kind =
    (name === "console" || name === "process") && host !== undefined
      ? name
      : isAccessor && host === undefined
        ? "accessor"
        : typeof value === "function" || (typeof value === "object" && value !== null)
          ? typeof value
          : value === undefined && isAccessor
            ? "undefined"
            : primitive !== undefined
              ? "value"
              : undefined;
  return kind === undefined
    ? []
    : [
        `[owner |-> "${owner}", name |-> N("${name}"), kind |-> "${kind}", value |-> ${primitive ?? "Undefined"}, isConstructor |-> ${getBoolean(isConstructor(value))}, isQuiet |-> ${getBoolean(owner === "GlobalObject" && QUIET_CONSTRUCTORS.has(name))}, isAccessor |-> ${getBoolean(isAccessor)}, writable |-> ${getBoolean(descriptor.writable === true)}, enumerable |-> ${getBoolean(descriptor.enumerable === true)}, configurable |-> ${getBoolean(descriptor.configurable === true)}]`,
      ];
};

// The host's constructors that make an object quietly, running nothing that a program sees but
// what QuietConstruct converts of their arguments until it uses the object.
const QUIET_CONSTRUCTORS = new Set(["TextEncoder", "TextDecoder"]);

// Whether a value of the host is a constructor, which Reflect.construct tells by throwing where
// it isn't one, without running it.
const isConstructor = (value: unknown) => {
  if (typeof value !== "function") return false;
  try {
    Reflect.construct(String, [], value);
    return true;
  } catch {
    return false;
  }
};

const getBoolean = (value: boolean) => (value ? "TRUE" : "FALSE");

// The groups of ESCore's parts that a module runs on: its loading, linking, and evaluation, the
// promise of its evaluation, and the proxies that stand for what of the host ESCore lacks.
const MODULE_GROUPS = new Set(["79-proxy.tla", "86-promise.tla", "88-modules.tla"]);

// Compiles a TypeScript script or module to a spec whose Init runs it as ESCore runs a script or a
// host its entry module: the realm, then the program, then the jobs it queued. An uncaught exception
// fails Init's assertion. The spec's module ProgramCode holds the program's code, and the
// runtime's prepared modules the rest.
export const compileToEscore = (
  source: string,
  fileName: string,
  runtime: EscoreRuntime,
  isModule = false,
): EscoreSpec => {
  const files = loadFiles(source, fileName, isModule);
  const program = specialize(files, runtime.internalKeys);
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
    : (runtime.hostOnlyGlobals.find((name) => program.identifiers.has(name)) ??
      runtime.hostOnlyProperties.find((property) => program.words.has(property.key))?.key);
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
    (isModule && MODULE_GROUPS.has(gate.group)) ||
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
  // A program's source texts are strings where a TLA+ string can hold each, which a check reads as
  // one token rather than one for each code unit.
  const sourceStrings = files.map((file) => getTlaString(file.sourceFile.text));
  const isStringSource = sourceStrings.every((text) => text !== undefined);
  // The host's globals, then, where the program calls import(), the host's code for it.
  const hostFile = files.findIndex((file) => file.kind === "host") + 1;
  const hostImport =
    hostFile === 0
      ? "DefineHost(s, HostProperties)"
      : `LET g == DefineHost(s, HostProperties) IN IF IsAbrupt(g) THEN g ELSE SetupHostImport(g.s, ${hostFile})`;
  const runJobs =
    "LET j == RunJobs(p.s) IN IF IsAbrupt(j) THEN j ELSE LET u == UnhandledRejection(j.s) IN IF IsAbrupt(u) THEN u ELSE";
  const definitions = compact(
    suspendDefinitions(
      [
        ...program.definitions.map((definition) => {
          const number = /^SourceText(\d+)$/.exec(definition.name)?.[1];
          return number !== undefined && isStringSource
            ? { ...definition, text: `${definition.name} == ${sourceStrings[Number(number) - 1]}` }
            : definition;
        }),
        {
          name: "HostProperties",
          arity: 0,
          text: `HostProperties == <<${(isModule
            ? [
                ...runtime.hostOnlyModuleGlobals
                  .filter((name) => program.words.has(name))
                  .flatMap((name) =>
                    getHostProperty(
                      "GlobalObject",
                      name,
                      Object.getOwnPropertyDescriptor(globalThis, name),
                      globalThis,
                    ),
                  ),
                ...runtime.hostOnlyProperties
                  .filter((property) => program.words.has(property.key))
                  .flatMap((property) =>
                    getHostProperty(property.owner, property.key, property.descriptor, undefined),
                  ),
              ]
            : []
          ).join(", ")}>>`,
        },
        {
          name: "HostTimeZone",
          arity: 1,
          text: program.words.has("Temporal")
            ? getHostTimeZone(files.map((file) => file.sourceFile.text).join("\n"))
            : `HostTimeZone(key) == [found |-> "unknown"]`,
        },
        {
          name: "SourceUnits",
          arity: 1,
          text: isStringSource ? "SourceUnits(t) == StringUnits(t)" : "SourceUnits(t) == t",
        },
        {
          name: "RunProgram",
          arity: 1,
          // A host exits with an error where its entry module still awaits once nothing is left
          // to run, as Node does.
          text:
            files[0].kind === "module"
              ? `RunProgram(s) == LET h == ${hostImport} IN IF IsAbrupt(h) THEN h ELSE LET p == Program(h.s) IN IF IsAbrupt(p) THEN p ELSE ${runJobs} LET t == RunTimers(u.s) IN IF IsAbrupt(t) THEN t ELSE IF Slots(t.s, Val(p)).state = "pending" THEN ThrowError(t.s, "Error") ELSE t`
              : isModule
                ? `RunProgram(s) == LET h == ${hostImport} IN IF IsAbrupt(h) THEN h ELSE LET p == Program(h.s) IN IF IsAbrupt(p) THEN p ELSE ${runJobs} RunTimers(u.s)`
                : isQueuing
                  ? `RunProgram(s) == LET p == Program(s) IN IF IsAbrupt(p) THEN p ELSE ${runJobs} RunTimers(u.s)`
                  : "RunProgram(s) == Program(s)",
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
  const view = runtime.getView(
    `${code}\n${ROOT}\n${CONFIG}`,
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
    "====",
    "",
  ].join("\n");
  return {
    name: "Program",
    source: ROOT,
    config: [CONFIG, ...stubs.map((stub) => `CONSTANT ${stub.name} <- Stub${stub.name}`), ""].join(
      "\n",
    ),
    loadModule: (name) => (name === "ProgramCode" ? module : undefined),
    preparedModules: [...runtime.modules, view],
  };
};
