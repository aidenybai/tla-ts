// Runs test262 through the compiler that specializes ESCore, which runs each test with the harness as
// Node runs it, without checking their types. Tests that Node fails or whose syntax TypeScript's
// parser rejects are skipped, not blamed on the compiler.
// Usage: bun scripts/run.ts test262 [--verbose] [test path prefixes]

import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { constants, createContext, runInContext, Script } from "node:vm";
import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../src/errors";
import { check } from "../src/parallel";
import type { CheckResult } from "../src/check";
import { compileToEscore } from "../src/typescript/spec/compile";
import { prepareRuntime, SCRIPT_STEPS } from "../src/typescript/spec/prepare";
import { CONFORMANCE_DIRECTORY, listTest262Files, TEST262_DIRECTORY } from "./corpora";

type Outcome = "pass" | "wrong" | "untranslatable" | "skipped" | "out-of-memory";

interface TestRun {
  id: string;
  outcome: Outcome;
  reason: string;
}

interface Metadata {
  includes: string[];
  flags: string[];
  isNegative: boolean;
  isSyntaxError: boolean;
  // The name of the constructor of the value that a negative test expects its run or its
  // resolution of modules to throw.
  thrownType: string | undefined;
  isModule: boolean;
}

// How Node fails a test: the line it reports, and the name of the constructor of the value that it
// left uncaught, where that value is an object whose constructor has a name.
interface NodeFailure {
  reason: string;
  thrownType: string | undefined;
}

// tla-ts takes local time to be UTC, so Node's Date must too.
process.env.TZ = "UTC";

const HARNESS = readFileSync(join(CONFORMANCE_DIRECTORY, "test262-harness.ts"), "utf8");

// A module that imports or exports, which the corpus pairs with fixture files.
const LINKED_MODULE = /^\s*(?:import|export)\b|\bimport\s*[(.]/m;
// Includes that the harness already defines, as compareArray.js is now part of assert.js.
const HARNESS_INCLUDES = new Set(["compareArray.js"]);
// Includes that tla-ts compiles from a TypeScript port.
const PORTED_INCLUDES = new Map([
  [
    "propertyHelper.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-property-helper.ts"), "utf8"),
  ],
  [
    "asyncHelpers.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-async-helpers.ts"), "utf8"),
  ],
  [
    "isConstructor.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-is-constructor.ts"), "utf8"),
  ],
  [
    "testTypedArray.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-typed-array.ts"), "utf8"),
  ],
  [
    "promiseHelper.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-promise-helper.ts"), "utf8"),
  ],
  [
    "decimalToHexString.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-decimal-to-hex-string.ts"), "utf8"),
  ],
  ["regExpUtils.js", readFileSync(join(CONFORMANCE_DIRECTORY, "test262-reg-exp-utils.ts"), "utf8")],
  [
    "detachArrayBuffer.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-detach-array-buffer.ts"), "utf8"),
  ],
  [
    "resizableArrayBufferUtils.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-resizable-array-buffer-utils.ts"), "utf8"),
  ],
  ["nans.js", readFileSync(join(CONFORMANCE_DIRECTORY, "test262-nans.ts"), "utf8")],
  [
    "dateConstants.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-date-constants.ts"), "utf8"),
  ],
  [
    "assertRelativeDateMs.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-assert-relative-date-ms.ts"), "utf8"),
  ],
  [
    "compareIterator.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-compare-iterator.ts"), "utf8"),
  ],
  [
    "nativeErrors.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-native-errors.ts"), "utf8"),
  ],
  [
    "proxyTrapsHelper.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-proxy-traps-helper.ts"), "utf8"),
  ],
  [
    "fnGlobalObject.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-fn-global-object.ts"), "utf8"),
  ],
  ["tcoHelper.js", readFileSync(join(CONFORMANCE_DIRECTORY, "test262-tco-helper.ts"), "utf8")],
  [
    "byteConversionValues.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-byte-conversion-values.ts"), "utf8"),
  ],
  [
    "nativeFunctionMatcher.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-native-function-matcher.ts"), "utf8"),
  ],
  ["deepEqual.js", readFileSync(join(CONFORMANCE_DIRECTORY, "test262-deep-equal.ts"), "utf8")],
  ["testAtomics.js", readFileSync(join(CONFORMANCE_DIRECTORY, "test262-test-atomics.ts"), "utf8")],
  [
    "temporalHelpers.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-temporal-helpers.ts"), "utf8"),
  ],
  [
    "sm/assertThrowsValue.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-sm-assert-throws-value.ts"), "utf8"),
  ],
  [
    "sm/non262-Reflect-shell.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-sm-reflect-shell.ts"), "utf8"),
  ],
  [
    "sm/non262-generators-shell.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-sm-generators-shell.ts"), "utf8"),
  ],
  [
    "sm/non262-JSON-shell.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-sm-json-shell.ts"), "utf8"),
  ],
  [
    "sm/non262-Math-shell.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-sm-math-shell.ts"), "utf8"),
  ],
  [
    "sm/non262-Set-shell.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-sm-set-shell.ts"), "utf8"),
  ],
  [
    "sm/non262-TypedArray-shell.js",
    readFileSync(join(CONFORMANCE_DIRECTORY, "test262-sm-typed-array-shell.ts"), "utf8"),
  ],
  ["testIntl.js", readFileSync(join(CONFORMANCE_DIRECTORY, "test262-test-intl.ts"), "utf8")],
]);

// An async test's harness defines $DONE, as doneprintHandle.js does.
const DONE_HARNESS = readFileSync(join(CONFORMANCE_DIRECTORY, "test262-done.ts"), "utf8");

// A test that reads $262, itself or through an include, has the host's members that tla-ts can
// model.
const HOST_HARNESS = readFileSync(join(CONFORMANCE_DIRECTORY, "test262-host.ts"), "utf8");

const getHarness = (metadata: Metadata, source: string) =>
  [
    HARNESS,
    ...(metadata.flags.includes("async") ? [DONE_HARNESS] : []),
    ...(/\$262\b/.test(source) || metadata.includes.includes("detachArrayBuffer.js")
      ? [HOST_HARNESS]
      : []),
    ...metadata.includes.flatMap((include) => PORTED_INCLUDES.get(include) ?? []),
  ].join("\n");

const getMetadata = (source: string): Metadata => {
  const frontmatter = /\/\*---([\s\S]*?)---\*\//.exec(source)?.[1] ?? "";
  const getList = (key: string) => {
    const inline = new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, "m").exec(frontmatter);
    if (inline !== null) {
      return inline[1]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    const block = new RegExp(`^${key}:\\s*\\n((?:\\s+-.*\\n?)*)`, "m").exec(frontmatter);
    return block === null ? [] : [...block[1].matchAll(/-\s*(\S+)/g)].map((match) => match[1]);
  };
  const flags = getList("flags");
  return {
    includes: getList("includes"),
    flags,
    isNegative: /^negative:/m.test(frontmatter),
    isSyntaxError: /^negative:\s*\n\s*phase:\s*(parse|early)\s*\n\s*type:\s*SyntaxError\s*$/m.test(
      frontmatter,
    ),
    thrownType: /^negative:\s*\n\s*phase:\s*(?:runtime|resolution)\s*\n\s*type:\s*(\w+)\s*$/m.exec(
      frontmatter,
    )?.[1],
    isModule: flags.includes("module"),
  };
};

// A call of regExpUtils.js's buildString, which makes a string of each code point in ranges that
// may reach past a million, more than tla-ts can run a loop over.
const BUILT_STRING = /\bbuildString\(/;

// Tests that end Node itself, such as with a segmentation fault, which would end this script.
const NODE_CRASHES = new Set([
  "language/statements/await-using/syntax/await-using-invalid-assignment-next-expression-for.js",
]);

const getSkipReason = (metadata: Metadata) => {
  if (metadata.isNegative && !metadata.isSyntaxError && metadata.thrownType === undefined) {
    return "negative test";
  }
  const includes = metadata.includes.filter(
    (include) => !HARNESS_INCLUDES.has(include) && !PORTED_INCLUDES.has(include),
  );
  return includes.length > 0 ? `includes ${includes.join(", ")}` : undefined;
};

// A promise that a test leaves rejected with no handler ends the test, as Node's default ends a
// program, though not this script, which runs the tests in turn.
const rejections: unknown[] = [];
process.on("unhandledRejection", (reason) => {
  rejections.push(reason);
});

// Runs a test in Node, with its jobs and then its timers, as an async test checks $DONE in one. The
// global object is an ordinary one, as a script's is. vm's default global intercepts each access, so
// that a global var named __proto__, or a global getter that deletes itself, behaves otherwise.
const getNodeError = (source: string, isSloppy: boolean) =>
  getNodeScriptsError([
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ESNext,
        // A script, as tla-ts compiles it, where await may name a binding.
        moduleDetection: ts.ModuleDetectionKind.Legacy,
        alwaysStrict: !isSloppy,
      },
    }).outputText,
  ]);

const isObject = (value: unknown): value is object =>
  (typeof value === "object" && value !== null) || typeof value === "function";

// The name of the constructor of a thrown value, as ESCore's ThrownName reads it.
const getThrownType = (value: unknown) => {
  const constructor: unknown = isObject(value) ? Reflect.get(value, "constructor") : undefined;
  const name: unknown = isObject(constructor) ? Reflect.get(constructor, "name") : undefined;
  return typeof name === "string" ? name : undefined;
};

// Runs scripts in turn in one global object, as a page runs its scripts.
const getNodeScriptsError = async (
  scripts: readonly string[],
): Promise<NodeFailure | undefined> => {
  const timers: (() => void)[] = [];
  try {
    const global = Object.assign(createContext(constants.DONT_CONTEXTIFY), {
      exports: {},
      setTimeout: (callback: () => void) => {
        timers.push(callback);
      },
    });
    scripts.forEach((script) => runInContext(script, global));
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    if (rejections.length === 0) timers.forEach((timer) => timer());
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    return rejections.length > 0
      ? { reason: `Unhandled rejection: ${String(rejections[0])}`, thrownType: undefined }
      : undefined;
  } catch (error) {
    return { reason: String(error), thrownType: getThrownType(error) };
  } finally {
    rejections.length = 0;
  }
};

// Runs a module test in a Node of its own, as a module's body can await. Node reports a rejected
// body as it reports an uncaught error, and a body that never settles with its own exit. A module
// keeps each import as it's written, as one whose bindings it never reads still links and runs.
const transpileModule = (source: string) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      verbatimModuleSyntax: true,
    },
  }).outputText;

// How a Node of its own failed, from the line of the error it reports and the line that THROWN_PATH
// writes.
const getProcessFailure = (run: SpawnSyncReturns<string>): NodeFailure | undefined => {
  if (run.status === 0) return undefined;
  const lines = run.stderr.split("\n");
  return {
    reason: lines.find((line) => /^\w*Error\b/.test(line)) ?? `exit ${run.status}`,
    thrownType: lines.find((line) => line.startsWith(THROWN_LINE))?.slice(THROWN_LINE.length),
  };
};

// Runs a module in Node, from the path of a test that imports fixtures, which Node runs from files.
const getModuleError = (source: string, path?: string) => {
  const output = transpileModule(source);
  if (path !== undefined) writeFileSync(path, output);
  return getProcessFailure(
    path === undefined
      ? spawnSync(process.execPath, ["--require", THROWN_PATH, "--input-type=module", "-"], {
          input: output,
          encoding: "utf8",
        })
      : spawnSync(
          process.execPath,
          [
            "--require",
            THROWN_PATH,
            ...(hasImportCall(source) ? ["--require", TIMERS_PATH] : []),
            path,
          ],
          { encoding: "utf8" },
        ),
  );
};

const getFirstLine = (text: string) => text.split("\n")[0];

const PROGRAM_PATH = "/test262.ts";

const UNREPRESENTABLE = [
  "Overflow when computing",
  // tla-ts runs a loop as a recursive operator, so thousands of iterations run out of stack.
  "This was a Java StackOverflowError",
  "TLC can't handle a number this big",
  "TLA+ sequences can't have holes",
  "tla-ts can't",
];

const getFailedRun = (id: string, reason: string): TestRun => ({
  id,
  outcome: UNREPRESENTABLE.some((text) => reason.includes(text)) ? "untranslatable" : "wrong",
  reason: reason.replaceAll("\n", " "),
});

// TypeScript's syntax and grammar errors, and its semantic errors that ECMAScript makes early
// errors, such as a redeclared let, of which a compile reports the syntax errors.
const EARLY_ERRORS = new Set([
  2300, 2335, 2337, 2357, 2364, 2392, 2406, 2451, 2462, 2480, 2481, 2487, 2523, 2524, 2660, 2777,
  2779, 2804, 2815, 5076, 6188, 6189, 18006, 18011, 18012, 18013, 18016, 18026, 18037, 18041, 18061,
]);

const isEarlyError = (code: number) =>
  (code >= 1000 && code < 2000) || (code >= 17000 && code < 18000) || EARLY_ERRORS.has(code);

const isModuleSyntaxError = (source: string) =>
  spawnSync(process.execPath, ["--input-type=module", "--check"], { input: source }).status !== 0;

// The first error of TypeScript's parser in a program, parsed as the compiler parses it: by its
// path's extension, and as a module or a script as its module detection decides. TypeScript reports
// some syntax that Node runs, as a private name after ?.
const getParseError = (text: string, path: string, moduleDetection: ts.ModuleDetectionKind) => {
  const program = ts.createProgram({
    rootNames: [path],
    options: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleDetection,
      allowJs: true,
      noLib: true,
      noResolve: true,
      types: [],
    },
    host: {
      ...ts.createCompilerHost({}),
      getSourceFile: (fileName, options) => ts.createSourceFile(fileName, text, options),
    },
  });
  return program.getSyntacticDiagnostics().at(0);
};

const isNodeSyntaxError = (source: string) => {
  try {
    new Script(source);
    return false;
  } catch (error) {
    return error instanceof SyntaxError;
  }
};

// The run of a test that expects a SyntaxError, from what its compile threw, which passes where
// tla-ts rejects the program with one.
const getSyntaxRun = (id: string, error: unknown): TestRun => {
  if (!(error instanceof TlaTypeScriptError)) return getFailedRun(id, String(error));
  const codes = [...error.message.matchAll(/(?:error|message) TS(\d+):/g)].map((match) =>
    Number(match[1]),
  );
  const reason = getFirstLine(error.message);
  return codes.some(isEarlyError) || reason.includes(" SyntaxError: ")
    ? { id, outcome: "pass", reason: "" }
    : { id, outcome: "untranslatable", reason };
};

// A test that expects a SyntaxError passes when tla-ts rejects the program with one.
const runSyntaxTest = (id: string, source: string, metadata: Metadata): TestRun => {
  // A raw test runs as it's written, where a hashbang or a directive must come first.
  const strict =
    !metadata.flags.includes("raw") && (metadata.flags.includes("onlyStrict") || metadata.isModule)
      ? '"use strict";\n'
      : "";
  const isRejected = metadata.isModule
    ? isModuleSyntaxError(source)
    : isNodeSyntaxError(`${strict}${source}`);
  if (!isRejected) {
    return { id, outcome: "skipped", reason: "Node accepts it" };
  }
  // The program as written, as JavaScript, as TypeScript's emit and its type stripping drop some
  // of what V8 rejects, such as a trailing comma after a rest parameter and a getter's parameter,
  // and without the harness, as it compiles and runs nothing.
  const program = `${strict}${source}`;
  try {
    getEmitted(program, metadata.isModule);
    compileToEscore(program, "test262.js", RUNTIME, metadata.isModule);
  } catch (error) {
    return getSyntaxRun(id, error);
  }
  // ESCore's compile accepts a program that Node rejects.
  return { id, outcome: "untranslatable", reason: "tla-ts can't tell this SyntaxError" };
};

// The numbers of an array literal of numeric literals, or undefined for another expression.
const getNumbers = (node: ts.Expression | undefined) =>
  node !== undefined &&
  ts.isArrayLiteralExpression(node) &&
  node.elements.every((element) => ts.isNumericLiteral(element))
    ? node.elements.map((element) => Number(element.getText()))
    : undefined;

// The string that a buildString call makes, written as a literal that escapes each code point
// outside printable ASCII, or undefined where the call passes other than literal arrays.
const getBuiltLiteral = (call: ts.CallExpression) => {
  const [argument] = call.arguments;
  const properties =
    call.arguments.length === 1 && ts.isObjectLiteralExpression(argument)
      ? new Map(
          argument.properties.map((property) => [
            property.name?.getText(),
            ts.isPropertyAssignment(property) ? property.initializer : undefined,
          ]),
        )
      : new Map<string | undefined, ts.Expression | undefined>();
  const lone = getNumbers(properties.get("loneCodePoints"));
  const ranges = properties.get("ranges");
  const spans =
    ranges !== undefined && ts.isArrayLiteralExpression(ranges)
      ? ranges.elements.map(getNumbers)
      : undefined;
  if (
    properties.size !== 2 ||
    lone === undefined ||
    spans === undefined ||
    spans.some((span) => span?.length !== 2)
  ) {
    return undefined;
  }
  const points = [
    ...lone,
    ...spans.flatMap((span) =>
      span === undefined
        ? []
        : Array.from(
            { length: Math.max(span[1] - span[0] + 1, 0) },
            (_, offset) => span[0] + offset,
          ),
    ),
  ];
  if (!points.every((point) => Number.isInteger(point) && point >= 0 && point <= 0x10ffff)) {
    return undefined;
  }
  const escaped = points.map((point) =>
    point >= 0x20 && point <= 0x7e && point !== 0x22 && point !== 0x5c
      ? String.fromCharCode(point)
      : `\\u{${point.toString(16)}}`,
  );
  return `"${escaped.join("")}"`;
};

// A test's source with each call of buildString written as the literal of the string it makes,
// which tla-ts reads without running the call's loop, or undefined where a call passes other than
// literal arrays.
const writeBuiltStrings = (source: string) => {
  const sourceFile = ts.createSourceFile(PROGRAM_PATH, source, ts.ScriptTarget.Latest, true);
  const calls: ts.CallExpression[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "buildString"
    ) {
      calls.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  const literals = calls.map(getBuiltLiteral);
  return literals.every((literal) => literal !== undefined)
    ? calls.reduceRight(
        (text, call, index) =>
          `${text.slice(0, call.getStart(sourceFile))}${literals[index]}${text.slice(call.end)}`,
        source,
      )
    : undefined;
};

// A call of import(), import.source(), or import.defer(), which loads a module.
const isImportCallee = (node: ts.Node) =>
  node.kind === ts.SyntaxKind.ImportKeyword ||
  (ts.isMetaProperty(node) &&
    node.keywordToken === ts.SyntaxKind.ImportKeyword &&
    node.name.text !== "meta");

const hasImportCall = (source: string) => {
  const visit = (node: ts.Node): boolean =>
    (ts.isCallExpression(node) && isImportCallee(node.expression)) ||
    ts.forEachChild(node, visit) === true;
  return visit(ts.createSourceFile(PROGRAM_PATH, source, ts.ScriptTarget.Latest));
};

// The directory of the tests that import fixtures, where each file of the corpus is TypeScript
// that tla-ts reads and JavaScript that Node runs.
const MODULE_DIRECTORY = mkdtempSync(join(tmpdir(), "test262-"));
writeFileSync(join(MODULE_DIRECTORY, "package.json"), '{ "type": "module" }');
process.on("exit", () => rmSync(MODULE_DIRECTORY, { recursive: true, force: true }));

// Node loads a module that import() names in later turns of its event loop, after an async test's
// timer, which tla-ts runs once the jobs run out. Node runs the timers once the loop has nothing
// else to do instead.
const TIMERS_PATH = join(MODULE_DIRECTORY, "timers.cjs");
writeFileSync(
  TIMERS_PATH,
  `const timers = [];
globalThis.setTimeout = (callback) => { timers.push(callback); };
process.on("beforeExit", () => { timers.splice(0).forEach((callback) => callback()); });
`,
);

// Writes the name of the constructor of a value that a Node of its own leaves uncaught, as
// getThrownType reads it, which Node then reports as it does without it.
const THROWN_PATH = join(MODULE_DIRECTORY, "thrown.cjs");
const THROWN_LINE = "test262 thrown: ";
writeFileSync(
  THROWN_PATH,
  `const isObject = (value) => (typeof value === "object" && value !== null) || typeof value === "function";
process.on("uncaughtExceptionMonitor", (error) => {
  const constructor = isObject(error) ? error.constructor : undefined;
  const name = isObject(constructor) ? constructor.name : undefined;
  if (typeof name === "string") process.stderr.write(${JSON.stringify(THROWN_LINE)} + name + "\\n");
});
`,
);

// Runs a script that imports in Node, from its path, where import() finds the fixtures, with the
// global object of the modules it loads.
const SCRIPT_RUNNER = `const vm = require("node:vm");
const path = process.argv[1];
vm.runInThisContext(require("node:fs").readFileSync(path, "utf8"), {
  filename: path,
  importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
});`;

// The directory of the files of the test that runs, which holds no other test's, so that what a
// test's Node finds is the same whatever ran before it.
const TEST_DIRECTORY = join(MODULE_DIRECTORY, "test");

const getModulePath = (path: string) => join(TEST_DIRECTORY, relative(TEST262_DIRECTORY, path));

// The fixtures that a test imports, by path, each a JavaScript or JSON file that a static import
// of a relative path or an import() of one names, with or without attributes, which Node and
// tla-ts check, or undefined where a file imports statically another way.
const getFixtures = (path: string, candidates: readonly string[]) => {
  const fixtures = new Map<string, string>();
  const link = (imported: string) => {
    if (imported === path || fixtures.has(imported)) return true;
    const importedText = readFileSync(imported, "utf8");
    fixtures.set(imported, importedText);
    return imported.endsWith(".json") || isLinked(imported, importedText);
  };
  const isLinked = (file: string, text: string): boolean => {
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const getImported = (specifier: ts.Expression) =>
      ts.isStringLiteralLike(specifier) && /^\.\.?\//.test(specifier.text)
        ? join(dirname(file), specifier.text)
        : undefined;
    const isModuleFile = (imported: string) =>
      /\.(js|json)$/.test(imported) && existsSync(imported);
    // An import() of a JavaScript or JSON file that exists links it, and Node rejects any other.
    const linksCalls = (node: ts.Node): boolean => {
      const specifier =
        ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? node.arguments.at(0)
          : undefined;
      const imported = specifier && getImported(specifier);
      return (
        (imported === undefined || !isModuleFile(imported) || link(imported)) &&
        (ts.forEachChild(node, (child) => (linksCalls(child) ? undefined : false)) ?? true)
      );
    };
    return (
      linksCalls(sourceFile) &&
      sourceFile.statements.every((statement) => {
        if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) return true;
        const specifier = statement.moduleSpecifier;
        if (specifier === undefined) return true;
        const imported = getImported(specifier);
        return (
          imported !== undefined &&
          isModuleFile(imported) &&
          !(
            ts.isImportDeclaration(statement) &&
            statement.importClause?.phaseModifier === ts.SyntaxKind.DeferKeyword
          ) &&
          link(imported)
        );
      })
    );
  };
  return isLinked(path, readFileSync(path, "utf8")) && candidates.every(link)
    ? fixtures
    : undefined;
};

// The fixtures that an import() of a computed string in a test may load: every JavaScript fixture
// in the test's directory. INTERPRETING.md says only that "they are intended to be referenced by
// test files"; that a test's are in its own directory is the corpus's layout, where each fixture
// that a test names is "./" and its name, and a host that runs a test in place has them all."
const getCandidates = (path: string, source: string) => {
  const visit = (node: ts.Node): boolean =>
    (ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      !(node.arguments.length > 0 && ts.isStringLiteralLike(node.arguments[0]))) ||
    ts.forEachChild(node, visit) === true;
  return visit(ts.createSourceFile(PROGRAM_PATH, source, ts.ScriptTarget.Latest))
    ? readdirSync(dirname(path))
        .filter((name) => name.endsWith("_FIXTURE.js"))
        .map((name) => join(dirname(path), name))
    : [];
};

// Runs a script that imports in Node, which reports an uncaught error or rejection as it ends.
const getScriptError = (source: string, path: string, isSloppy: boolean) => {
  writeFileSync(
    path,
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ESNext,
        moduleDetection: ts.ModuleDetectionKind.Legacy,
        alwaysStrict: !isSloppy,
      },
    }).outputText,
  );
  return getProcessFailure(
    spawnSync(
      process.execPath,
      [
        "--no-warnings",
        "--require",
        THROWN_PATH,
        "--require",
        TIMERS_PATH,
        "--eval",
        SCRIPT_RUNNER,
        path,
      ],
      { encoding: "utf8" },
    ),
  );
};

// ESCore's runtime, which the runner prepares once for every test it compiles. TLA_TS_STATS=1
// prints each check's compile and check time and its module's size.
const RUNTIME = prepareRuntime(join(import.meta.dirname, "../ecmascript"));

// The JavaScript that TypeScript emits for a program, where a syntax error throws with each of
// TypeScript's codes for it.
const getEmitted = (program: string, isModule: boolean) => {
  const transpiled = ts.transpileModule(program, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: isModule ? ts.ModuleKind.ESNext : ts.ModuleKind.Preserve,
      moduleDetection: isModule ? ts.ModuleDetectionKind.Force : ts.ModuleDetectionKind.Legacy,
      verbatimModuleSyntax: isModule,
      alwaysStrict: false,
      ignoreDeprecations: "6.0",
    },
    reportDiagnostics: true,
  });
  const errors = (transpiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length > 0) {
    throw new TlaTypeScriptError(
      errors
        .map(
          (error) =>
            `error TS${error.code}: ${ts.flattenDiagnosticMessageText(error.messageText, "\n")}`,
        )
        .join("\n"),
    );
  }
  return transpiled.outputText;
};

// Compiles a test's program by specializing ESCore. The harness merges namespaces into its
// functions, which Node's type stripping rejects, so the program runs as the JavaScript that
// TypeScript emits for it, as Node runs it here, which a linked test's own file holds too, for an
// import of it.
const compileProgram = (
  program: string,
  path: string,
  isModule: boolean,
  candidates: readonly string[],
) => {
  const emitted = getEmitted(program, isModule);
  if (existsSync(path)) writeFileSync(path, emitted);
  // test262's host loads every file of code as an ES module.
  return compileToEscore(emitted, path, RUNTIME, isModule, {
    steps: SCRIPT_STEPS,
    entries: [],
    isModuleHost: true,
    candidates,
  });
};

// The assertion that fails where a test's script or module throws, after it prints DescribeResult,
// whose name is the code units of the name of the thrown value's constructor, as ThrownName reads
// it, or none.
const THREW = "the script threw an exception";

// The run of a negative test, which passes where the program throws a value whose constructor has
// the name that the test expects.
const getThrownRun = (
  id: string,
  thrownType: string,
  isEnded: boolean,
  result: CheckResult,
  prints: readonly string[],
): TestRun => {
  if (isEnded) return { id, outcome: "wrong", reason: `tla-ts throws nothing, not ${thrownType}` };
  const message = result.failure?.message ?? result.status;
  if (!message.includes(THREW)) return getFailedRun(id, message);
  const units = /^\[\s*name \|->\s*<<([^>]*)>>/.exec(prints.at(-1) ?? "")?.[1] ?? "";
  const name = String.fromCharCode(...(units.match(/\d+/g) ?? []).map(Number));
  return name === thrownType
    ? { id, outcome: "pass", reason: "" }
    : name === ""
      ? { id, outcome: "skipped", reason: "tla-ts throws a value of no constructor name" }
      : { id, outcome: "wrong", reason: `tla-ts throws ${name}, not ${thrownType}` };
};

// Compiles a program and checks it.
const checkProgram = async (
  id: string,
  program: string,
  path: string,
  isModule: boolean,
  thrownType?: string,
  candidates: readonly string[] = [],
): Promise<TestRun> => {
  try {
    const start = performance.now();
    const spec = compileProgram(program, path, isModule, candidates);
    const compiled = performance.now();
    const prints: string[] = [];
    const result = await check({
      ...spec,
      onPrint: (text) => {
        prints.push(text);
      },
    });
    if (process.env.TLA_TS_STATS !== undefined) {
      // The spec is its root module and the program's code.
      const size = spec.source.length + (spec.loadModule("ProgramCode")?.length ?? 0);
      console.log(
        `STATS ${id} compile=${Math.round(compiled - start)} check=${Math.round(performance.now() - compiled)} size=${size}`,
      );
    }
    const isEnded = result.status === "success" || result.status === "deadlock";
    if (thrownType !== undefined) return getThrownRun(id, thrownType, isEnded, result, prints);
    if (isEnded) return { id, outcome: "pass", reason: "" };
    return getFailedRun(id, result.failure?.message ?? result.status);
  } catch (error) {
    if (!(error instanceof TlaTypeScriptError)) return getFailedRun(id, String(error));
    return { id, outcome: "untranslatable", reason: getFirstLine(error.message) };
  }
};

// A test whose source, its built strings written out, runs to a million characters, as the
// property escapes' do, runs in a process of its own with the heap that Node gives this one, where
// running out of it is a failure of the test of its own kind rather than the run's.
const LARGE_SOURCE = 1_000_000;
const OUTCOMES: Outcome[] = ["pass", "wrong", "untranslatable", "skipped", "out-of-memory"];
const IS_OWN_PROCESS = process.env.TLA_TS_OWN_PROCESS !== undefined;

const runInOwnProcess = (id: string): TestRun => {
  const run = spawnSync(process.execPath, [...process.execArgv, process.argv[1], "--verbose", id], {
    encoding: "utf8",
    env: { ...process.env, TLA_TS_OWN_PROCESS: "1" },
    maxBuffer: 1 << 26,
  });
  const words = run.stdout
    .split("\n")
    .map((text) => text.split(" "))
    .find((line) => line[1] === id);
  const outcome = OUTCOMES.find((candidate) => candidate.toUpperCase() === words?.[0]);
  if (words !== undefined && outcome !== undefined) {
    return { id, outcome, reason: words.slice(2).join(" ") };
  }
  return run.stderr.includes("heap out of memory")
    ? { id, outcome: "out-of-memory", reason: "" }
    : {
        id,
        outcome: "wrong",
        reason: `the test's process failed: ${getFirstLine(run.stderr || `exit ${run.status}`)}`,
      };
};

const runTest = async (path: string): Promise<TestRun> => {
  const id = relative(TEST262_DIRECTORY, path);
  const read = readFileSync(path, "utf8");
  const metadata = getMetadata(read);
  const skipReason = NODE_CRASHES.has(id) ? "Node crashes" : getSkipReason(metadata);
  if (skipReason !== undefined) return { id, outcome: "skipped", reason: skipReason };
  if (metadata.isSyntaxError) return runSyntaxTest(id, read, metadata);
  const source = BUILT_STRING.test(read) ? writeBuiltStrings(read) : read;
  if (source === undefined) {
    return { id, outcome: "skipped", reason: "a buildString call of other than literal arrays" };
  }
  if (source.length > LARGE_SOURCE && !IS_OWN_PROCESS) return runInOwnProcess(id);
  const isImporting = hasImportCall(source);
  const isLinked =
    isImporting || (metadata.isModule && LINKED_MODULE.test(source.slice(source.indexOf("---*/"))));
  const candidates = isImporting ? getCandidates(path, source) : [];
  const fixtures = isLinked ? getFixtures(path, candidates) : new Map<string, string>();
  if (fixtures === undefined) {
    return { id, outcome: "skipped", reason: "a test that imports other than from a fixture" };
  }
  // A fixture is a module, so its code is strict, and it is the JavaScript that Node loads, which
  // TypeScript reads too.
  if (isLinked) rmSync(TEST_DIRECTORY, { recursive: true, force: true });
  fixtures.forEach((text, fixture) => {
    const modulePath = getModulePath(fixture);
    mkdirSync(dirname(modulePath), { recursive: true });
    writeFileSync(modulePath, fixture.endsWith(".json") ? text : transpileModule(text));
  });
  const programPath = isLinked ? getModulePath(path) : PROGRAM_PATH;
  if (isLinked) mkdirSync(dirname(programPath), { recursive: true });
  // A raw test runs as it's written, without the harness, outside strict mode, where a hashbang
  // or a directive must come first.
  const isRaw = metadata.flags.includes("raw");
  const body = isRaw ? source : `${getHarness(metadata, source)}\n${source}`;
  const isSloppy = isRaw || metadata.flags.includes("noStrict");
  // A noStrict test runs outside strict mode, as a script, and any other runs in strict mode, as
  // Node runs it as a module.
  const program = isSloppy ? body : `"use strict"; ${body}`;
  // A program that TypeScript's parser rejects is one that TypeScript's emitter may fail to print
  // for Node, and that tla-ts doesn't compile. The harness is TypeScript, so it parses as such. A
  // script parses as one, as tla-ts compiles it.
  const parseError = getParseError(
    program,
    isLinked ? programPath.replace(/\.js$/, ".ts") : "test262.ts",
    metadata.isModule || isLinked ? ts.ModuleDetectionKind.Force : ts.ModuleDetectionKind.Legacy,
  );
  if (parseError !== undefined) {
    return {
      id,
      outcome: "skipped",
      reason: `TypeScript rejects its syntax: ${ts.flattenDiagnosticMessageText(parseError.messageText, " ")}`,
    };
  }
  const nodeError = metadata.isModule
    ? getModuleError(body, isLinked ? programPath : undefined)
    : isImporting
      ? getScriptError(body, programPath, isSloppy)
      : await getNodeError(body, isSloppy);
  // A negative test passes where Node throws what it expects, and so does tla-ts.
  if (metadata.thrownType !== undefined && nodeError?.thrownType !== metadata.thrownType) {
    return {
      id,
      outcome: "skipped",
      reason:
        nodeError === undefined
          ? `Node throws nothing, not ${metadata.thrownType}`
          : `Node throws ${nodeError.thrownType ?? "a value of no constructor name"}, not ${metadata.thrownType}`,
    };
  }
  if (nodeError !== undefined && metadata.thrownType === undefined) {
    return { id, outcome: "skipped", reason: `Node fails: ${getFirstLine(nodeError.reason)}` };
  }
  // A test runs as the JavaScript that TypeScript emits, which a linked test's own file holds, as
  // Node loads it, and which type stripping never reads.
  return checkProgram(
    id,
    program,
    isLinked ? programPath : "test262.js",
    metadata.isModule,
    metadata.thrownType,
    candidates.map(getModulePath),
  );
};

const getReasonKind = (reason: string) =>
  reason
    .replace(/^type error: \S+\(\d+,\d+\): /, "type ")
    .replace(/^\S+:\d+:\d+ /, "")
    .split(": ")[0];

const isVerbose = process.argv.includes("--verbose");
const prefixes = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
const paths = listTest262Files(prefixes)
  .filter((path) => {
    const id = relative(TEST262_DIRECTORY, path);
    return prefixes.length === 0 || prefixes.some((prefix) => id.startsWith(prefix));
  })
  .sort();

const runs: TestRun[] = [];
for (const path of paths) {
  const run = await runTest(path);
  runs.push(run);
  if (isVerbose || run.outcome === "wrong" || run.outcome === "out-of-memory") {
    console.log(`${run.outcome.toUpperCase()} ${run.id}${run.reason ? ` ${run.reason}` : ""}`);
  }
}

const countBy = (items: string[]) =>
  [...Map.groupBy(items, (item) => item)].map((entry) => ({
    key: entry[0],
    count: entry[1].length,
  }));

const outcomes = countBy(runs.map((run) => run.outcome));
console.log(
  `${runs.length} tests: ${outcomes.map((entry) => `${entry.count} ${entry.key}`).join(", ")}`,
);
for (const outcome of ["untranslatable", "skipped"]) {
  console.log(`Most common reasons a test is ${outcome}:`);
  countBy(runs.filter((run) => run.outcome === outcome).map((run) => getReasonKind(run.reason)))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10)
    .forEach((entry) => console.log(`  ${entry.count} ${entry.key}`));
}
process.exit(
  runs.some((run) => run.outcome === "wrong" || run.outcome === "out-of-memory") ? 1 : 0,
);
