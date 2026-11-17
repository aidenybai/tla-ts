// Runs test262 through the TypeScript compiler. Tests that Node fails or that aren't valid
// TypeScript are skipped, not blamed on the compiler.
// Usage: bun scripts/run.ts test262 [--verbose] [test path prefixes]

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { constants, createContext, runInContext, Script } from "node:vm";
import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../src/errors";
import { check } from "../src/parallel";
import { STRING_METHODS } from "../src/typescript/collections";
import { getIndexedKind, INDEX_PARAMETERS, SET_LIKE_METHODS } from "../src/typescript/types";
import { compile } from "../src/typescript/compile";
import { CONFORMANCE_DIRECTORY, listTest262Files, TEST262_DIRECTORY } from "./corpora";

type Outcome = "pass" | "wrong" | "untranslatable" | "skipped";

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
  isModule: boolean;
}

// tla-ts takes local time to be UTC, so Node's Date must too.
process.env.TZ = "UTC";

const HARNESS = readFileSync(join(CONFORMANCE_DIRECTORY, "test262-harness.ts"), "utf8");

const SKIPPED_FLAGS = new Set(["raw"]);

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
  if (metadata.isNegative && !metadata.isSyntaxError) return "negative test";
  const flag = metadata.flags.find((candidate) => SKIPPED_FLAGS.has(candidate));
  if (flag !== undefined) return `flag ${flag}`;
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
const getNodeError = async (source: string, isSloppy: boolean) => {
  const timers: (() => void)[] = [];
  try {
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ESNext,
        moduleDetection: isSloppy ? ts.ModuleDetectionKind.Legacy : ts.ModuleDetectionKind.Force,
        alwaysStrict: !isSloppy,
      },
    }).outputText;
    runInContext(
      output,
      Object.assign(createContext(constants.DONT_CONTEXTIFY), {
        exports: {},
        setTimeout: (callback: () => void) => {
          timers.push(callback);
        },
      }),
    );
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    if (rejections.length === 0) timers.forEach((timer) => timer());
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    return rejections.length > 0 ? `Unhandled rejection: ${String(rejections[0])}` : undefined;
  } catch (error) {
    return String(error);
  } finally {
    rejections.length = 0;
  }
};

// Runs a module test in a Node of its own, as a module's body can await. Node reports a rejected
// body as it reports an uncaught error, and a body that never settles with its own exit.
const transpileModule = (source: string) =>
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
  }).outputText;

// Runs a module in Node, from the path of a test that imports fixtures, which Node runs from files.
const getModuleError = (source: string, path?: string) => {
  const output = transpileModule(source);
  if (path !== undefined) writeFileSync(path, output);
  const run =
    path === undefined
      ? spawnSync(process.execPath, ["--input-type=module", "-"], {
          input: output,
          encoding: "utf8",
        })
      : spawnSync(
          process.execPath,
          hasImportCall(source) ? ["--require", TIMERS_PATH, path] : [path],
          { encoding: "utf8" },
        );
  if (run.status === 0) return undefined;
  return run.stderr.split("\n").find((line) => /^\w*Error\b/.test(line)) ?? `exit ${run.status}`;
};

const getFirstLine = (text: string) => text.split("\n")[0];

// TypeScript's errors for a declaration whose type it can't infer, such as an unannotated
// parameter.
const IMPLICIT_ANY_ERRORS = new Set([
  7005, 7006, 7008, 7010, 7019, 7031, 7032, 7033, 7034, 7043, 7044, 7045, 7046, 7047, 7048, 7049,
  7050,
]);

// TypeScript's errors for a value that may be null or undefined.
const NULLABLE_ERRORS = new Set([2531, 2532, 2533, 2721, 2722, 18047, 18048, 18049]);

// TypeScript's errors for a use of a value of type unknown, the second where the value is a
// property's or a call's, such as a String.prototype method that a key stores.
const UNKNOWN_VALUE_ERROR = 18046;
const UNKNOWN_CALLEE_ERROR = 2571;
const ARGUMENT_COUNT_ERROR = 2554;

// The built-ins that tla-ts runs with undefined for each argument that a call leaves out, as
// JavaScript does, where a test calls them, directly or through call, with fewer arguments than
// TypeScript's types take. Each is the interface that declares it and its method's name, with a
// typed array's interface as TypedArray and ReadonlyArray as Array, and a constructor as its
// interface alone. Each needs a
// unit test of such a call, since a translation that follows the signature may read the missing
// arguments wrongly.
const SHORT_CALLED_BUILT_INS = new Set([
  "Array.every",
  "Array.fill",
  "Array.filter",
  "Array.find",
  "Array.findIndex",
  "Array.findLast",
  "Array.findLastIndex",
  "Array.forEach",
  "Array.includes",
  "Array.indexOf",
  "Array.lastIndexOf",
  "Array.map",
  "Array.reduce",
  "Array.reduceRight",
  "Array.some",
  "Array.toSpliced",
  "ArrayBufferConstructor.isView",
  "AsyncGenerator.throw",
  "CallableFunction.bind",
  "DataView.getFloat16",
  "DataView.getFloat32",
  "DataView.getFloat64",
  "DataView.getInt8",
  "DataView.getInt16",
  "DataView.getInt32",
  "DataView.getUint8",
  "DataView.getUint16",
  "DataView.getUint32",
  "DataView.setFloat16",
  "DataView.setFloat32",
  "DataView.setFloat64",
  "DataView.setInt8",
  "DataView.setInt16",
  "DataView.setInt32",
  "DataView.setUint8",
  "DataView.setUint16",
  "DataView.setUint32",
  "DateConstructor.UTC",
  "ErrorConstructor.isError",
  "FinalizationRegistry.register",
  "Function.bind",
  "Generator.throw",
  "IteratorObject.reduce",
  "NumberConstructor.isFinite",
  "NumberConstructor.isInteger",
  "NumberConstructor.isNaN",
  "NumberConstructor.isSafeInteger",
  "PromiseConstructor.all",
  "PromiseConstructor.allSettled",
  "PromiseConstructor.any",
  "PromiseConstructor.race",
  "PromiseConstructor.resolve",
  "PromiseConstructor.try",
  "RegExpConstructor",
  "String.at",
  "String.charAt",
  "String.charCodeAt",
  "String.matchAll",
  "String.padEnd",
  "String.padStart",
  "String.repeat",
  "String.replace",
  "String.replaceAll",
  "String.split",
  "String.substr",
  "String.substring",
  "SuppressedErrorConstructor",
  "TypedArray.at",
  "TypedArray.copyWithin",
  "TypedArray.every",
  "TypedArray.fill",
  "TypedArray.filter",
  "TypedArray.find",
  "TypedArray.findIndex",
  "TypedArray.findLast",
  "TypedArray.findLastIndex",
  "TypedArray.forEach",
  "TypedArray.includes",
  "TypedArray.indexOf",
  "TypedArray.lastIndexOf",
  "TypedArray.map",
  "TypedArray.reduce",
  "TypedArray.reduceRight",
  "TypedArray.some",
  "TypedArray.toLocaleString",
]);

// The built-ins, named as SHORT_CALLED_BUILT_INS names them, whose signatures declare each argument
// that JavaScript reads, so that an argument past them only runs, which no literal or name of a
// declared function shows.
const LONG_CALLED_BUILT_INS = new Set(["CallableFunction.bind", "Promise.then", "WeakMap.has"]);

// The built-ins, named as SHORT_CALLED_BUILT_INS names them, that tla-ts runs on a null or an
// undefined that a call passes for an argument of another type, converting or checking it as
// JavaScript does.
const NULLISH_TAKING_BUILT_INS = new Set([
  "Function.bind",
  "Function.call",
  "ObjectConstructor.create",
  "ObjectConstructor.defineProperty",
  "ObjectConstructor.getOwnPropertyDescriptor",
  "Reflect.getOwnPropertyDescriptor",
  "String.charAt",
  "String.charCodeAt",
  "String.concat",
  "String.indexOf",
  "String.lastIndexOf",
  "String.substring",
  "SymbolConstructor",
  "TypedArray.set",
  "isNaN",
]);

const TYPED_ARRAY_NAME = /^(Big)?(Int|Uint|Float)\d+(Clamped)?Array$/;

const PROGRAM_PATH = "/test262.ts";

// The file that the service annotates, which is a module test's own path where it imports fixtures.
const file = { path: PROGRAM_PATH, text: "", version: 0 };

const service = ts.createLanguageService({
  getCompilationSettings: () => ({
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    moduleDetection: ts.ModuleDetectionKind.Force,
    lib: ["lib.esnext.d.ts"],
    types: [],
  }),
  getScriptFileNames: () => [file.path],
  getScriptVersion: (path) => (path === file.path ? String(file.version) : "0"),
  getScriptSnapshot: (path) => {
    const text = path === file.path ? file.text : ts.sys.readFile(path);
    return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
  },
  getCurrentDirectory: () => "/",
  getDefaultLibFileName: ts.getDefaultLibFilePath,
  fileExists: (path) => path === file.path || ts.sys.fileExists(path),
  readFile: (path) => (path === file.path ? file.text : ts.sys.readFile(path)),
});

const setText = (text: string) => {
  file.text = text;
  file.version += 1;
};

const applyEdits = (edits: Map<number, string>) =>
  setText(
    [...edits]
      .toSorted((left, right) => right[0] - left[0])
      .reduce(
        (current, [position, text]) => current.slice(0, position) + text + current.slice(position),
        file.text,
      ),
  );

// An object that a test passes where a descriptor goes: one of another type, or one, such as Math,
// that has none of a descriptor's properties.
const DESCRIBED_ERRORS = new Set([2322, 2345, 2559]);

const getDescriptorName = (type: ts.Type | undefined) =>
  type === undefined
    ? undefined
    : (type.isIntersection() ? type.types : [type])
        .map((member) => member.getSymbol()?.name)
        .find((name) => name === "PropertyDescriptor" || name === "PropertyDescriptorMap");

const isDescriptor = (type: ts.Type | undefined) =>
  getDescriptorName(type) === "PropertyDescriptor";

// Types for the objects that test262 builds up and describes, which TypeScript can't infer:
// a descriptor that is possibly undefined, an object given properties after it's made, a
// descriptor whose attributes aren't booleans, an object that Object.create or Object.fromEntries
// makes, and a parameter or variable with no type to infer. Each only adds types, so Node runs the same program.
const isKeyType = (type: ts.Type) =>
  (type.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.ESSymbolLike)) !==
  0;

// The loosest type that a binding pattern reads: an element may be missing, and each name may
// hold any value.
const getPatternType = (name: ts.BindingName): string | undefined => {
  if (ts.isIdentifier(name)) return "unknown";
  if (ts.isArrayBindingPattern(name)) {
    const elements = name.elements.map((element) => {
      if (ts.isOmittedExpression(element)) return "unknown?";
      const type = getPatternType(element.name);
      if (type === undefined) return undefined;
      return element.dotDotDotToken === undefined ? `${type}?` : `...${type}[]`;
    });
    if (elements.some((element) => element === undefined)) return undefined;
    return elements.every((element) => element === "unknown?" || element === "...unknown[]")
      ? "Iterable<unknown>"
      : `[${elements.join(", ")}]`;
  }
  // A rest element gathers each other key's value.
  const properties = name.elements.map((element) => {
    if (element.dotDotDotToken !== undefined) return "[key: string | symbol]: unknown";
    const key = element.propertyName ?? element.name;
    const type = getPatternType(element.name);
    if (type === undefined) return undefined;
    return ts.isIdentifier(key) || ts.isStringLiteral(key) || ts.isNumericLiteral(key)
      ? `${key.getText()}?: ${type}`
      : undefined;
  });
  return properties.some((property) => property === undefined)
    ? undefined
    : `{ ${properties.join("; ")} }`;
};

// The writes of a top-level read's variable, which a top-level var statement declares with no value,
// where only functions write it, each with =. tla-ts runs each function where Node does, so the read
// sees the value it writes, and where none ran, a read of a property of undefined stops.
const getCallbackWrites = (checker: ts.TypeChecker, node: ts.Node) => {
  const symbol = checker.getSymbolAtLocation(node);
  const declaration = symbol?.valueDeclaration;
  if (
    declaration === undefined ||
    !ts.isVariableDeclaration(declaration) ||
    declaration.initializer !== undefined ||
    !ts.isSourceFile(declaration.parent.parent.parent) ||
    ts.findAncestor(node, ts.isFunctionLike) !== undefined
  ) {
    return undefined;
  }
  const writes: ts.BinaryExpression[] = [];
  const isWritten = (inner: ts.Node): boolean =>
    ts.isIdentifier(inner) &&
    inner !== declaration.name &&
    checker.getSymbolAtLocation(inner) === symbol &&
    ts.isBinaryExpression(inner.parent) &&
    inner.parent.left === inner;
  const visit = (inner: ts.Node) => {
    if (isWritten(inner) && ts.isBinaryExpression(inner.parent)) writes.push(inner.parent);
    ts.forEachChild(inner, visit);
  };
  visit(declaration.getSourceFile());
  return writes.length > 0 &&
    writes.every(
      (write) =>
        write.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.findAncestor(write, ts.isFunctionLike) !== undefined,
    )
    ? writes
    : undefined;
};

// The values that a variable holds: its initializer's, or where it has none, those that =
// assigns it.
const getHeld = (checker: ts.TypeChecker, declaration: ts.VariableDeclaration) => {
  if (declaration.initializer !== undefined) return [declaration.initializer];
  const symbol = checker.getSymbolAtLocation(declaration.name);
  const assigned: ts.Expression[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(node.left) &&
      checker.getSymbolAtLocation(node.left) === symbol
    ) {
      assigned.push(node.right);
    }
    ts.forEachChild(node, visit);
  };
  if (symbol !== undefined) visit(declaration.getSourceFile());
  return assigned;
};

// A variable that holds only what catches bind holds any value, as they do.
const isCaughtHeld = (checker: ts.TypeChecker, declaration: ts.VariableDeclaration) => {
  const held = getHeld(checker, declaration);
  return (
    held.length > 0 &&
    held.every((value) => {
      const caught = checker.getSymbolAtLocation(value)?.valueDeclaration;
      return (
        caught !== undefined && ts.isVariableDeclaration(caught) && ts.isCatchClause(caught.parent)
      );
    })
  );
};

const loosen = () => {
  const program = service.getProgram();
  const sourceFile = program?.getSourceFile(file.path);
  if (program === undefined || sourceFile === undefined) return false;
  const checker = program.getTypeChecker();
  const getNode = (position: number) => {
    const visit = (node: ts.Node): ts.Node =>
      ts.forEachChild(node, (child) =>
        child.getStart() <= position && position < child.getEnd() ? visit(child) : undefined,
      ) ?? node;
    return visit(sourceFile);
  };
  // The untyped variable that a compound assignment around a node assigns. TypeScript keeps the
  // type the variable had before, though the assignment may give it a value of another type, so a
  // variable that one converts is any.
  const getCompoundTarget = (node: ts.Node) => {
    const compound = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.BinaryExpression & { left: ts.Identifier } =>
        ts.isBinaryExpression(ancestor) &&
        COMPOUND_ASSIGNMENTS.has(ancestor.operatorToken.kind) &&
        ts.isIdentifier(ancestor.left),
    );
    const declaration =
      compound === undefined
        ? undefined
        : checker.getSymbolAtLocation(compound.left)?.valueDeclaration;
    return declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      ts.isIdentifier(declaration.name) &&
      declaration.type === undefined &&
      declaration.getSourceFile() === sourceFile
      ? { left: compound?.left, name: declaration.name }
      : undefined;
  };
  const edits = new Map<number, string>();
  service.getSemanticDiagnostics(file.path).forEach((diagnostic) => {
    const node = getNode(diagnostic.start ?? 0);
    const parent = node.parent;
    // A value that may be null or undefined, which the test reads as Node does.
    const nullable = NULLABLE_ERRORS.has(diagnostic.code)
      ? ts.findAncestor(
          node,
          (ancestor) =>
            ancestor.getStart() === diagnostic.start &&
            ancestor.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0),
        )
      : undefined;
    // An assertion that TypeScript still flags can't help, so it isn't repeated. One after an
    // operand such as void 0 would apply to 0 alone, so that operand is put in parentheses.
    if (
      nullable !== undefined &&
      ts.isExpression(nullable) &&
      nullable.kind !== ts.SyntaxKind.SuperKeyword &&
      !ts.isNonNullExpression(nullable) &&
      !ts.isNonNullExpression(nullable.parent) &&
      getCompoundTarget(nullable)?.left !== nullable
    ) {
      const isOperand =
        ts.isIdentifier(nullable) ||
        nullable.kind === ts.SyntaxKind.ThisKeyword ||
        ts.isPropertyAccessExpression(nullable) ||
        ts.isElementAccessExpression(nullable) ||
        ts.isCallExpression(nullable) ||
        ts.isParenthesizedExpression(nullable);
      if (!isOperand) edits.set(nullable.getStart(), "(");
      edits.set(nullable.getEnd(), isOperand ? "!" : ")!");
    }
    // A variable that holds an object literal may get properties that the literal lacks.
    const accessed =
      diagnostic.code === 2339 && ts.isPropertyAccessExpression(parent)
        ? parent
        : diagnostic.code === 7053
          ? ts.findAncestor(node, ts.isElementAccessExpression)
          : undefined;
    if (
      accessed !== undefined &&
      ts.isIdentifier(accessed.expression) &&
      (ts.isPropertyAccessExpression(accessed) ||
        isKeyType(checker.getTypeAtLocation(accessed.argumentExpression)))
    ) {
      const declaration = checker.getSymbolAtLocation(accessed.expression)?.valueDeclaration;
      if (
        declaration !== undefined &&
        ts.isVariableDeclaration(declaration) &&
        declaration.type === undefined &&
        declaration.initializer !== undefined &&
        ts.isObjectLiteralExpression(declaration.initializer)
      ) {
        // An object that the test gives an iterator method is iterable.
        const symbol = checker.getSymbolAtLocation(accessed.expression);
        const isIterable = (node: ts.Node): boolean =>
          (ts.isElementAccessExpression(node) &&
            node.argumentExpression.getText() === "Symbol.iterator" &&
            checker.getSymbolAtLocation(node.expression) === symbol) ||
          (ts.forEachChild(node, (child) => isIterable(child) || undefined) ?? false);
        if (isIterable(sourceFile)) {
          edits.set(
            declaration.initializer.getEnd(),
            " as unknown as { [key: string | symbol]: unknown } & Iterable<unknown>",
          );
        } else {
          edits.set(declaration.name.getEnd(), ": { [key: string | symbol]: unknown }");
        }
      }
    }
    // Any other object, such as a built-in prototype, may get properties that its type lacks. An
    // array keeps its type, since tla-ts compiles it to a sequence.
    const receiver = accessed?.expression;
    const receiverType = receiver === undefined ? undefined : checker.getTypeAtLocation(receiver);
    const receiverDeclaration =
      receiver !== undefined && ts.isIdentifier(receiver)
        ? checker.getSymbolAtLocation(receiver)?.valueDeclaration
        : undefined;
    if (
      accessed !== undefined &&
      ts.isPropertyAccessExpression(accessed) &&
      !ts.isPrivateIdentifier(accessed.name) &&
      receiver !== undefined &&
      receiver.kind !== ts.SyntaxKind.SuperKeyword &&
      !ts.isParenthesizedExpression(receiver) &&
      receiverType !== undefined &&
      (receiverType.flags & (ts.TypeFlags.Object | ts.TypeFlags.NonPrimitive)) !== 0 &&
      !checker.isArrayType(receiverType) &&
      !checker.isTupleType(receiverType) &&
      !(
        receiverDeclaration !== undefined &&
        ts.isVariableDeclaration(receiverDeclaration) &&
        receiverDeclaration.initializer !== undefined &&
        ts.isObjectLiteralExpression(receiverDeclaration.initializer)
      )
    ) {
      edits.set(receiver.getStart(), "(");
      edits.set(receiver.getEnd(), " as unknown as { [key: string | symbol]: unknown })");
    }
    // A parameter or variable whose type inferFromUsage can't infer may hold any value.
    const declared =
      (diagnostic.code === 7006 && ts.isParameter(parent)) ||
      ((diagnostic.code === 7005 || diagnostic.code === 7034) &&
        ts.isVariableDeclaration(parent)) ||
      (diagnostic.code === 7008 && ts.isPropertyDeclaration(parent))
        ? parent
        : undefined;
    if (
      declared !== undefined &&
      declared.type === undefined &&
      (ts.isIdentifier(declared.name) || ts.isPrivateIdentifier(declared.name)) &&
      declared.name === node
    ) {
      const isRest = ts.isParameter(declared) && declared.dotDotDotToken !== undefined;
      const token = ts.isVariableDeclaration(declared) ? undefined : declared.questionToken;
      const end = token === undefined ? declared.name.getEnd() : token.getEnd();
      // An arrow function's lone parameter needs parentheses for its type.
      const arrow = declared.parent;
      const isBare =
        ts.isArrowFunction(arrow) &&
        !arrow.getChildren().some((child) => child.kind === ts.SyntaxKind.OpenParenToken);
      if (isBare) edits.set(declared.getStart(), "(");
      edits.set(end, `${isRest ? ": unknown[]" : ": unknown"}${isBare ? ")" : ""}`);
    }
    // A parameter that destructures takes any value its pattern can read.
    const destructured =
      diagnostic.code === 7031
        ? ts.findAncestor(
            node,
            (ancestor) => ts.isParameter(ancestor) || ts.isFunctionLike(ancestor),
          )
        : undefined;
    const patternType =
      destructured !== undefined && ts.isParameter(destructured) && destructured.type === undefined
        ? getPatternType(destructured.name)
        : undefined;
    if (destructured !== undefined && ts.isParameter(destructured) && patternType !== undefined) {
      const token = destructured.questionToken;
      edits.set(
        token === undefined ? destructured.name.getEnd() : token.getEnd(),
        `: ${destructured.dotDotDotToken === undefined ? patternType : `${patternType}[]`}`,
      );
    }
    // An array pattern's parameter, which TypeScript types as a tuple from the pattern alone, takes
    // any iterable that a call passes, such as a generator object, through its iterator. It takes
    // the argument's type, as tla-ts reads an iterator only where the type says it has one.
    const isErroredArgument = (argument: ts.Expression) =>
      argument.getStart() === diagnostic.start &&
      argument.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0);
    const iteratedCall =
      diagnostic.code === 2345
        ? ts.findAncestor(
            node,
            (ancestor): ancestor is ts.CallExpression | ts.NewExpression =>
              (ts.isCallExpression(ancestor) || ts.isNewExpression(ancestor)) &&
              (ancestor.arguments?.some(isErroredArgument) ?? false),
          )
        : undefined;
    const iteratedArgument = iteratedCall?.arguments?.find(isErroredArgument);
    const iteratedDeclaration =
      iteratedCall && checker.getResolvedSignature(iteratedCall)?.getDeclaration();
    const iteratedParameter =
      iteratedArgument !== undefined &&
      iteratedDeclaration !== undefined &&
      ts.isFunctionLike(iteratedDeclaration)
        ? iteratedDeclaration.parameters.at(
            iteratedCall?.arguments?.indexOf(iteratedArgument) ?? -1,
          )
        : undefined;
    const iteratedType = iteratedArgument && checker.getTypeAtLocation(iteratedArgument);
    if (
      iteratedParameter !== undefined &&
      iteratedType !== undefined &&
      iteratedParameter.getSourceFile() === sourceFile &&
      iteratedParameter.type === undefined &&
      iteratedParameter.dotDotDotToken === undefined &&
      ts.isArrayBindingPattern(iteratedParameter.name) &&
      !checker.isArrayLikeType(iteratedType) &&
      iteratedType.getProperties().some((property) => property.getName().startsWith("__@iterator@"))
    ) {
      edits.set(iteratedParameter.name.getEnd(), `: ${checker.typeToString(iteratedType)}`);
    }
    // A function that reads this may be a constructor, whose instance gets any property.
    const receiving =
      diagnostic.code === 2683
        ? ts.findAncestor(
            node,
            (ancestor) => ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor),
          )
        : undefined;
    if (
      receiving !== undefined &&
      (ts.isFunctionDeclaration(receiving) || ts.isFunctionExpression(receiving))
    ) {
      edits.set(
        receiving.parameters.pos,
        receiving.parameters.length === 0
          ? "this: { [key: string | symbol]: unknown }"
          : "this: { [key: string | symbol]: unknown }, ",
      );
    }
    // A value that a catch binds, which TypeScript types as unknown in strict mode and as any
    // outside it, is any where the test reads it, as a test reads an error's properties, and so is
    // a variable that holds only such values.
    const caught =
      diagnostic.code === UNKNOWN_VALUE_ERROR || diagnostic.code === UNKNOWN_CALLEE_ERROR
        ? checker.getSymbolAtLocation(node)?.valueDeclaration
        : undefined;
    if (
      caught !== undefined &&
      ts.isVariableDeclaration(caught) &&
      ts.isIdentifier(caught.name) &&
      caught.type === undefined &&
      (ts.isCatchClause(caught.parent) || isCaughtHeld(checker, caught))
    ) {
      edits.set(caught.name.getEnd(), ": any");
    }
    // A test may call new on a function that isn't a constructor, to check that it throws.
    const created = ts.findAncestor(node, ts.isNewExpression);
    if (diagnostic.code === 7009 && created !== undefined) {
      edits.set(created.expression.getStart(), "(");
      edits.set(
        created.expression.getEnd(),
        " as unknown as new (...args: unknown[]) => { [key: string | symbol]: unknown })",
      );
    }
    // A test may call a value of an unknown type, such as a built-in method that it stores under a
    // key, which gives a value of an unknown type.
    const unknownCallee =
      diagnostic.code === UNKNOWN_VALUE_ERROR
        ? ts.findAncestor(
            node,
            (ancestor) =>
              ancestor.getStart() === diagnostic.start &&
              ancestor.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0),
          )
        : undefined;
    if (
      unknownCallee !== undefined &&
      ts.isCallExpression(unknownCallee.parent) &&
      unknownCallee.parent.expression === unknownCallee
    ) {
      edits.set(unknownCallee.getStart(), "(");
      edits.set(unknownCallee.getEnd(), " as (...args: unknown[]) => unknown)");
    }
    // A test may call a function with fewer arguments than it declares, which leaves the others
    // undefined, or with more, which only its arguments object holds. A rest parameter takes the
    // extra arguments without changing the function's length. A tag takes the template's strings
    // and then each substitution.
    const getArgumentCount = (
      call: ts.CallExpression | ts.NewExpression | ts.TaggedTemplateExpression,
    ) =>
      ts.isTaggedTemplateExpression(call)
        ? 1 + (ts.isTemplateExpression(call.template) ? call.template.templateSpans.length : 0)
        : (call.arguments?.length ?? 0);
    const count = /but got (\d+)/.exec(ts.flattenDiagnosticMessageText(diagnostic.messageText, ""));
    const called =
      SHORT_CALL_ERRORS.has(diagnostic.code) && count !== null
        ? ts.findAncestor(
            node,
            (
              ancestor,
            ): ancestor is ts.CallExpression | ts.NewExpression | ts.TaggedTemplateExpression =>
              (ts.isCallExpression(ancestor) ||
                ts.isNewExpression(ancestor) ||
                ts.isTaggedTemplateExpression(ancestor)) &&
              getArgumentCount(ancestor) === Number(count[1]),
          )
        : undefined;
    const callee = called && checker.getResolvedSignature(called)?.getDeclaration();
    if (
      called !== undefined &&
      callee !== undefined &&
      ts.isFunctionLike(callee) &&
      callee.getSourceFile() === sourceFile
    ) {
      const parameters = callee.parameters.filter(
        (parameter) => !ts.isIdentifier(parameter.name) || parameter.name.text !== "this",
      );
      const given = getArgumentCount(called);
      parameters.slice(given).forEach((parameter) => {
        if (
          ts.isIdentifier(parameter.name) &&
          parameter.questionToken === undefined &&
          parameter.initializer === undefined &&
          parameter.dotDotDotToken === undefined
        ) {
          edits.set(parameter.name.getEnd(), "?");
        }
      });
      if (
        given > parameters.length &&
        parameters.every((parameter) => parameter.dotDotDotToken === undefined)
      ) {
        edits.set(
          callee.parameters.end,
          callee.parameters.length === 0 || callee.parameters.hasTrailingComma
            ? "...extraArguments: unknown[]"
            : ", ...extraArguments: unknown[]",
        );
      }
    }
    const literal = ts.findAncestor(node, ts.isObjectLiteralExpression);
    if (diagnostic.code === 2322 && literal && isDescriptor(checker.getContextualType(literal))) {
      edits.set(literal.getEnd(), " as unknown as PropertyDescriptor");
    }
    // A test describes properties with an object whose type TypeScript doesn't know.
    // A call whose overloads all fail gives its arguments no contextual type.
    const parameter =
      ts.isCallExpression(parent) && ts.isIdentifier(node)
        ? checker.getResolvedSignature(parent)?.getParameters()[parent.arguments.indexOf(node)]
        : undefined;
    // TypeScript reports a property's value that has none of a descriptor's properties at its name.
    const describedValue =
      ts.isPropertyAssignment(parent) && parent.name === node ? parent.initializer : node;
    const described =
      DESCRIBED_ERRORS.has(diagnostic.code) &&
      ts.isIdentifier(node) &&
      (ts.isCallExpression(parent) || ts.isPropertyAssignment(parent))
        ? getDescriptorName(
            parameter === undefined
              ? checker.getContextualType(describedValue)
              : checker.getTypeOfSymbolAtLocation(parameter, node),
          )
        : undefined;
    if (described !== undefined) {
      edits.set(describedValue.getStart(), "(");
      edits.set(describedValue.getEnd(), ` as unknown as ${described})`);
    }
    const target = OPERAND_TYPE_ERRORS.has(diagnostic.code) ? getCompoundTarget(node) : undefined;
    if (target !== undefined) edits.set(target.name.getEnd(), ": any");
    // A test may assign an accessor's this, which a descriptor types as an object, to a variable
    // that holds a number until then, which then holds any value, as tla-ts stops where a value of
    // another kind goes into a typed variable.
    if (
      diagnostic.code === 2322 &&
      ts.isBinaryExpression(parent) &&
      parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      parent.left === node &&
      parent.right.kind === ts.SyntaxKind.ThisKeyword
    ) {
      const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
      if (
        declaration !== undefined &&
        ts.isVariableDeclaration(declaration) &&
        ts.isIdentifier(declaration.name) &&
        declaration.type === undefined
      ) {
        edits.set(declaration.name.getEnd(), ": any");
      } else {
        edits.set(parent.right.getStart(), "(");
        edits.set(parent.right.getEnd(), " as any)");
      }
    }
    // A function that returns no value, whose return type TypeScript can't infer where its type
    // depends on itself, as a pattern's default that calls it does, returns undefined.
    const returning = RETURN_TYPE_ERRORS.has(diagnostic.code)
      ? ts.findAncestor(node, ts.isFunctionLike)
      : undefined;
    const closeParen = returning
      ?.getChildren()
      .find((child) => child.kind === ts.SyntaxKind.CloseParenToken);
    if (
      returning !== undefined &&
      (ts.isFunctionExpression(returning) || ts.isFunctionDeclaration(returning)) &&
      returning.asteriskToken === undefined &&
      !returning.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) &&
      returning.type === undefined &&
      returning.body !== undefined &&
      !returnsValue(returning.body) &&
      closeParen !== undefined
    ) {
      edits.set(closeParen.getEnd(), ": undefined");
    }
    // A variable that only functions write, which TypeScript reads as any, holds what they write.
    const callbackWrites =
      diagnostic.code === UNASSIGNED_READ_ERROR ? getCallbackWrites(checker, node) : undefined;
    const callbackDeclaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
    const writtenTypes = callbackWrites?.map((write) =>
      getMemberTypes(checker, checker.getTypeAtLocation(write.right)),
    );
    if (
      writtenTypes !== undefined &&
      writtenTypes.every((types) => types !== undefined) &&
      callbackDeclaration !== undefined &&
      ts.isVariableDeclaration(callbackDeclaration) &&
      callbackDeclaration.type === undefined
    ) {
      edits.set(
        callbackDeclaration.name.getEnd(),
        `: ${getUnion(writtenTypes.flatMap((types) => types ?? [])).join(" | ")}`,
      );
    }
    // A function that the test declares, which only throws, as a computed key that calls it in a
    // pattern does, returns never, which TypeScript infers as void.
    const key = ts.findAncestor(node, ts.isComputedPropertyName)?.expression;
    const thrower =
      diagnostic.code === COMPUTED_KEY_ERROR &&
      key !== undefined &&
      ts.isCallExpression(key) &&
      ts.isIdentifier(key.expression)
        ? checker.getSymbolAtLocation(key.expression)?.valueDeclaration
        : undefined;
    const throwerParen = thrower
      ?.getChildren()
      .find((child) => child.kind === ts.SyntaxKind.CloseParenToken);
    if (
      thrower !== undefined &&
      ts.isFunctionDeclaration(thrower) &&
      thrower.getSourceFile() === sourceFile &&
      thrower.asteriskToken === undefined &&
      !thrower.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) &&
      thrower.type === undefined &&
      thrower.body !== undefined &&
      thrower.body.statements.length > 0 &&
      ts.isThrowStatement(thrower.body.statements[thrower.body.statements.length - 1]) &&
      !returns(thrower.body) &&
      throwerParen !== undefined
    ) {
      edits.set(throwerParen.getEnd(), ": never");
    }
  });
  const visit = (node: ts.Node) => {
    const initializer = ts.isVariableDeclaration(node) ? node.initializer : undefined;
    if (
      ts.isVariableDeclaration(node) &&
      node.type === undefined &&
      initializer !== undefined &&
      ts.isCallExpression(initializer) &&
      ["Object.create", "Object.fromEntries", "Reflect.construct"].includes(
        initializer.expression.getText(),
      )
    ) {
      edits.set(node.name.getEnd(), ": { [key: string | symbol]: unknown }");
    }
    // An accessor that a descriptor gives reads this, which ThisType<any> leaves untyped, as the
    // object that it's defined on.
    const isFunction = ts.isMethodDeclaration(node) || ts.isFunctionExpression(node);
    const holder =
      isFunction && ts.isPropertyAssignment(node.parent) ? node.parent.parent : node.parent;
    if (
      isFunction &&
      node.body !== undefined &&
      !node.parameters.some((parameter) => parameter.name.getText() === "this") &&
      readsThis(node.body) &&
      ts.isObjectLiteralExpression(holder) &&
      isDescriptor(checker.getContextualType(holder))
    ) {
      edits.set(
        node.parameters.pos,
        node.parameters.length === 0
          ? "this: { [key: string | symbol]: unknown }"
          : "this: { [key: string | symbol]: unknown }, ",
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (edits.size > 0) applyEdits(edits);
  return edits.size > 0;
};

const isGlobalIterator = (node: ts.Expression, checker: ts.TypeChecker) =>
  ts.isIdentifier(node) &&
  node.text === "Iterator" &&
  (checker.getSymbolAtLocation(node)?.declarations ?? []).every(
    (declaration) => declaration.getSourceFile().isDeclarationFile,
  );

// A class that extends Iterator, whose type takes the type of the values it gives, gives any value.
// It's typed before the fixes that infer types from usage, which would otherwise type its
// callbacks' parameters and results from a base that TypeScript can't type.
const typeIteratorBases = () => {
  const program = service.getProgram();
  const sourceFile = program?.getSourceFile(PROGRAM_PATH);
  if (program === undefined || sourceFile === undefined) return;
  const checker = program.getTypeChecker();
  const edits = new Map<number, string>();
  const visit = (node: ts.Node) => {
    if (
      ts.isExpressionWithTypeArguments(node) &&
      node.typeArguments === undefined &&
      node.parent.token === ts.SyntaxKind.ExtendsKeyword &&
      isGlobalIterator(node.expression, checker)
    ) {
      edits.set(node.expression.getEnd(), "<unknown>");
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (edits.size > 0) applyEdits(edits);
};

// TypeScript's errors for a class member that its base type's member doesn't match: one of another
// type, or an accessor where the base has a method.
const BASE_MEMBER_ERRORS = new Set([2416, 2423]);

// TypeScript's errors for a class that doesn't write an abstract member of its base, in a
// declaration or an expression.
const ABSTRACT_MEMBER_ERRORS = new Set([2515, 2653]);

// TypeScript's errors for a computed key of a class field or a type literal's member whose type
// isn't a literal's, which TypeScript leaves out of the type, so a read of it types as any.
const COMPUTED_MEMBER_ERRORS = new Set([1166, 1170]);

// TypeScript's error for a getter with a path that returns no value. One that never returns a
// value gives undefined, which its type, void, says.
const GETTER_RETURN_ERROR = 2378;

// TypeScript's errors for a function whose return type depends on itself.
const RETURN_TYPE_ERRORS = new Set([7023, 7024]);

// TypeScript's error for a computed key of a type that isn't a key's.
const COMPUTED_KEY_ERROR = 2464;

// Whether a function's body returns, outside the functions it makes.
const returns = (node: ts.Node): boolean =>
  ts.isReturnStatement(node) ||
  (!ts.isFunctionLike(node) &&
    (ts.forEachChild(node, (child) => returns(child) || undefined) ?? false));

// Whether a function's body returns a value, outside the functions it makes.
const returnsValue = (node: ts.Node): boolean =>
  (ts.isReturnStatement(node) && node.expression !== undefined) ||
  (!ts.isFunctionLike(node) &&
    (ts.forEachChild(node, (child) => returnsValue(child) || undefined) ?? false));

const isVoidGetter = (node: ts.GetAccessorDeclaration | undefined) =>
  node?.body !== undefined && !returnsValue(node.body);

// Whether a function's body reads this, outside the functions it makes that have their own.
const readsThis = (node: ts.Node): boolean =>
  node.kind === ts.SyntaxKind.ThisKeyword ||
  (!(ts.isFunctionLike(node) && !ts.isArrowFunction(node)) &&
    (ts.forEachChild(node, (child) => readsThis(child) || undefined) ?? false));

// The operators that compare values of any type.
const COMPARISONS = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
]);

// The array methods that pass the array they visit to their callback.
const ARRAY_CALLBACK_METHODS = new Set([
  "every",
  "filter",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "flatMap",
  "forEach",
  "map",
  "reduce",
  "reduceRight",
  "some",
]);

// A function that a test declares and passes by name, once, takes the parameter types of the
// callback it's passed as, such as an array method's (value, index, array), which usage alone
// doesn't give.
const typeCallbacks = () => {
  const program = service.getProgram();
  const sourceFile = program?.getSourceFile(file.path);
  if (program === undefined || sourceFile === undefined) return;
  const checker = program.getTypeChecker();
  const references = new Map<ts.FunctionDeclaration, ts.Identifier[]>();
  const visit = (node: ts.Node) => {
    const declaration = ts.isIdentifier(node)
      ? checker.getSymbolAtLocation(node)?.valueDeclaration
      : undefined;
    if (
      ts.isIdentifier(node) &&
      declaration !== undefined &&
      ts.isFunctionDeclaration(declaration) &&
      declaration.name !== node
    ) {
      references.set(declaration, [...(references.get(declaration) ?? []), node]);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  const edits = new Map<number, string>();
  references.forEach((identifiers, declaration) => {
    const passed = identifiers[0];
    if (
      identifiers.length !== 1 ||
      !(ts.isCallExpression(passed.parent) || ts.isNewExpression(passed.parent)) ||
      !passed.parent.arguments?.includes(passed)
    ) {
      return;
    }
    // An array method that a test calls on an object passes that object as the callback's array
    // parameter, as reduce's fourth and the others' third, which takes the object's type.
    const call = passed.parent;
    const callee = call.expression;
    const method =
      ts.isCallExpression(call) &&
      call.arguments[1] === passed &&
      ts.isPropertyAccessExpression(callee) &&
      callee.name.text === "call" &&
      ts.isPropertyAccessExpression(callee.expression) &&
      /^(?:Array\.prototype|\[\])$/.test(callee.expression.expression.getText())
        ? callee.expression.name.text
        : undefined;
    const arrayParameter =
      method === undefined || !ARRAY_CALLBACK_METHODS.has(method)
        ? undefined
        : declaration.parameters.at(method.startsWith("reduce") ? 3 : 2);
    const receiver = ts.isCallExpression(call) ? call.arguments[0] : undefined;
    const getUses = (symbol: ts.Symbol | undefined) => {
      const uses: ts.Identifier[] = [];
      const findUses = (node: ts.Node): void => {
        if (ts.isIdentifier(node) && checker.getSymbolAtLocation(node) === symbol) uses.push(node);
        ts.forEachChild(node, findUses);
      };
      if (symbol !== undefined && declaration.body !== undefined) findUses(declaration.body);
      return uses;
    };
    // A callback that only tests the array with instanceof takes it as an object, which the heap
    // holds, where tla-ts keeps a value of the receiver's type, such as an error, outside it.
    const arrayUses =
      arrayParameter === undefined ? [] : getUses(checker.getSymbolAtLocation(arrayParameter.name));
    const isTested =
      arrayUses.length > 0 &&
      arrayUses.every(
        (use) =>
          ts.isBinaryExpression(use.parent) &&
          use.parent.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword &&
          use.parent.left === use,
      );
    const receiverType =
      receiver === undefined
        ? "any"
        : isTested
          ? "object"
          : ts.isIdentifier(receiver) &&
              receiver.text !== "arguments" &&
              declaration.parameters.every(
                (parameter) => parameter.name.getText() !== receiver.text,
              )
            ? `typeof ${receiver.text}`
            : checker
                .typeToString(
                  checker.getTypeAtLocation(receiver),
                  undefined,
                  ts.TypeFormatFlags.NoTruncation,
                )
                // An empty object literal gets properties after it's made.
                .replace(/^\{\}$/, "{ [key: string | symbol]: unknown }");
    if (
      arrayParameter !== undefined &&
      arrayParameter.type === undefined &&
      ts.isIdentifier(arrayParameter.name) &&
      !/\bany\b/.test(receiverType)
    ) {
      edits.set(arrayParameter.name.getEnd(), `: ${receiverType}`);
      // The method's own type takes an array there, which the object isn't.
      edits.set(passed.getEnd(), " as (...args: unknown[]) => unknown");
    }
    // An element may come from a getter or a prototype, whatever the array's own type, so a value
    // parameter that the callback only compares takes any value. So does reduce's accumulator,
    // which takes the initial value, the elements, and what the callback returns.
    const calledMethod =
      method ??
      (ts.isCallExpression(call) &&
      call.arguments[0] === passed &&
      ts.isPropertyAccessExpression(callee)
        ? callee.name.text
        : undefined);
    const valueParameters =
      calledMethod === undefined || !ARRAY_CALLBACK_METHODS.has(calledMethod)
        ? []
        : declaration.parameters.slice(0, calledMethod.startsWith("reduce") ? 2 : 1);
    const isCompared = (use: ts.Node) =>
      ts.isTypeOfExpression(use.parent) ||
      (ts.isBinaryExpression(use.parent) && COMPARISONS.has(use.parent.operatorToken.kind));
    const unknownValues = valueParameters.filter((parameter) => {
      const uses = getUses(checker.getSymbolAtLocation(parameter.name));
      return (
        parameter.type === undefined &&
        ts.isIdentifier(parameter.name) &&
        uses.length > 0 &&
        uses.every(isCompared)
      );
    });
    unknownValues.forEach((parameter) => edits.set(parameter.name.getEnd(), ": unknown"));
    const signatures = checker.getContextualType(passed)?.getCallSignatures() ?? [];
    if (signatures.length !== 1) return;
    declaration.parameters.forEach((parameter, position) => {
      const given = signatures[0].parameters.at(position);
      if (
        unknownValues.includes(parameter) ||
        given === undefined ||
        parameter.type !== undefined ||
        parameter.initializer !== undefined ||
        parameter.dotDotDotToken !== undefined ||
        !ts.isIdentifier(parameter.name)
      ) {
        return;
      }
      const type = checker.typeToString(
        checker.getTypeOfSymbol(given),
        undefined,
        ts.TypeFormatFlags.NoTruncation,
      );
      if (/\b(?:any|this)\b/.test(type)) return;
      edits.set(parameter.name.getEnd(), `: ${type}`);
    });
    // An array method's callback that reads its arguments past its parameters, as arguments[2],
    // reads what the method passes there: the index and the array, which take the callback
    // parameter's type. The value, and reduce's accumulator, stay any.
    if (
      method !== undefined ||
      calledMethod === undefined ||
      !ARRAY_CALLBACK_METHODS.has(calledMethod)
    ) {
      return;
    }
    const valuePosition = calledMethod.startsWith("reduce") ? 1 : 0;
    const findReads = (node: ts.Node): void => {
      const argument = ts.isElementAccessExpression(node) ? node.argumentExpression : undefined;
      const position =
        argument !== undefined && ts.isNumericLiteral(argument) ? Number(argument.text) : undefined;
      const given = position === undefined ? undefined : signatures[0].parameters.at(position);
      const type =
        given === undefined
          ? undefined
          : checker.typeToString(
              checker.getTypeOfSymbol(given),
              undefined,
              ts.TypeFormatFlags.NoTruncation,
            );
      if (
        ts.isElementAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "arguments" &&
        checker.getSymbolAtLocation(node.expression)?.declarations === undefined &&
        position !== undefined &&
        position >= declaration.parameters.length &&
        position > valuePosition &&
        type !== undefined &&
        !/\b(?:any|this)\b/.test(type) &&
        !(ts.isBinaryExpression(node.parent) && node.parent.left === node)
      ) {
        edits.set(node.getStart(), "(");
        edits.set(node.getEnd(), ` as ${type})`);
      }
      // A function other than an arrow has arguments of its own.
      if (!ts.isFunctionLike(node) || ts.isArrowFunction(node)) ts.forEachChild(node, findReads);
    };
    if (declaration.body !== undefined) ts.forEachChild(declaration.body, findReads);
  });
  if (edits.size > 0) applyEdits(edits);
};

// TypeScript's errors for a generator whose yield gives a value, whose type it can't infer.
const GENERATOR_ERRORS = new Set([7023, 7024, 7055, 7057]);

const GENERATOR_ROUNDS = 8;

interface GeneratorTypes {
  yielded: string;
  returned: string;
  sent: string[];
  // What a return call passes, which the generator then returns.
  closed: string[];
  // The yield* operands, by their order in the generator, that TypeScript can't iterate as typed.
  casts: number[];
}

// The generators of a round's program, with what TypeScript reports of them.
interface GeneratorState {
  checker: ts.TypeChecker;
  generators: (ts.FunctionDeclaration | ts.FunctionExpression | ts.MethodDeclaration)[];
  diagnostics: readonly ts.Diagnostic[];
  getNode: (position: number) => ts.Node;
}

// The type of each value that an expression may give, widened as TypeScript infers a generator's
// types, or undefined where one is any.
const getMemberTypes = (checker: ts.TypeChecker, type: ts.Type | undefined) => {
  if (type === undefined) return undefined;
  const members = (type.isUnion() ? type.types : [type]).map((member) =>
    checker.typeToString(
      checker.getBaseTypeOfLiteralType(member),
      undefined,
      ts.TypeFormatFlags.NoTruncation,
    ),
  );
  return members.some((member) => /\b(?:any|this)\b/.test(member))
    ? undefined
    : members.map((member) => (member.includes("=>") ? `(${member})` : member));
};

const getUnion = (members: string[]) =>
  members.length === 0 ? ["never"] : [...new Set(members)].toSorted();

// The yields and returns of a generator's own body.
const getYieldsAndReturns = (generator: ts.FunctionLikeDeclaration) => {
  const yields: ts.YieldExpression[] = [];
  const returns: ts.ReturnStatement[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isYieldExpression(node)) yields.push(node);
    if (ts.isReturnStatement(node)) returns.push(node);
    if (!ts.isFunctionLike(node)) ts.forEachChild(node, visit);
  };
  if (generator.body !== undefined) ts.forEachChild(generator.body, visit);
  return { yields, returns };
};

const getDelegated = (generator: ts.FunctionLikeDeclaration) =>
  getYieldsAndReturns(generator).yields.flatMap((node) =>
    node.asteriskToken !== undefined && node.expression !== undefined ? [node.expression] : [],
  );

// A generator that the test declares, whose yield gives a value or whose return a call passes a
// value TypeScript rejects, takes the types of what it yields, returns, and is sent: each yield's
// operand, each return's, undefined where its end is reachable, each argument that a return call
// passes it, and each argument that a next call passes it, with undefined, which a next with none
// and a loop send. A yield* yields unknown, as what another iterator yields may be anything, and
// one whose operand TypeScript can't iterate, as a test of a broken iterator gives, reads it as an
// iterable of unknown, which tla-ts sees through. Each round types the generators by the round
// before, and TypeScript, which then rejects any other argument for next or return, shows what
// more they're sent, until the types settle.
const typeGenerators = () => {
  const original = file.text;
  const getGenerators = (sourceFile: ts.SourceFile) => {
    const generators: (ts.FunctionDeclaration | ts.FunctionExpression | ts.MethodDeclaration)[] =
      [];
    const visit = (node: ts.Node) => {
      if (
        (ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isMethodDeclaration(node)) &&
        node.asteriskToken !== undefined
      ) {
        generators.push(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return generators;
  };
  const getState = () => {
    const program = service.getProgram();
    const sourceFile = program?.getSourceFile(PROGRAM_PATH);
    if (program === undefined || sourceFile === undefined) return undefined;
    const getNode = (position: number) => {
      const visit = (node: ts.Node): ts.Node =>
        ts.forEachChild(node, (child) =>
          child.getStart() <= position && position < child.getEnd() ? visit(child) : undefined,
        ) ?? node;
      return visit(sourceFile);
    };
    return {
      checker: program.getTypeChecker(),
      generators: getGenerators(sourceFile),
      diagnostics: service.getSemanticDiagnostics(PROGRAM_PATH),
      getNode,
    };
  };
  // The method call whose one argument a diagnostic rejects.
  const getRejectedCall = (state: GeneratorState, diagnostic: ts.Diagnostic) => {
    const start = diagnostic.start ?? 0;
    const call = ts.findAncestor(
      state.getNode(start),
      (ancestor): ancestor is ts.CallExpression =>
        ts.isCallExpression(ancestor) &&
        ancestor.arguments.length === 1 &&
        ancestor.arguments[0].getStart() === start &&
        ancestor.arguments[0].getEnd() === start + (diagnostic.length ?? 0),
    );
    return call !== undefined && ts.isPropertyAccessExpression(call.expression)
      ? { call, receiver: call.expression.expression, method: call.expression.name.text }
      : undefined;
  };
  // The generators whose objects a receiver may hold, by the types that TypeScript infers.
  const getHeldGenerators = (state: GeneratorState, receiver: ts.Expression) => {
    const type = state.checker.getTypeAtLocation(receiver);
    const held = type.isUnion() ? type.types : [type];
    return state.generators.flatMap((generator, position) => {
      const signature = state.checker.getSignatureFromDeclaration(generator);
      return signature !== undefined &&
        held.includes(state.checker.getReturnTypeOfSignature(signature))
        ? [position]
        : [];
    });
  };
  const initial = getState();
  if (initial === undefined) return false;
  const targets = new Set(
    [
      ...initial.diagnostics
        .filter((diagnostic) => GENERATOR_ERRORS.has(diagnostic.code))
        .map((diagnostic) => {
          const node = initial.getNode(diagnostic.start ?? 0);
          // TypeScript names a variable that holds an anonymous generator.
          const holder = node.parent;
          const generator =
            ts.isVariableDeclaration(holder) &&
            holder.name === node &&
            holder.initializer !== undefined
              ? holder.initializer
              : ts.findAncestor(node, ts.isFunctionLike);
          return initial.generators.findIndex((candidate) => candidate === generator);
        }),
      ...initial.diagnostics
        .filter((diagnostic) => CONVERTED_ARGUMENT_ERRORS.has(diagnostic.code))
        .flatMap((diagnostic) => {
          const rejected = getRejectedCall(initial, diagnostic);
          return rejected?.method === "return"
            ? getHeldGenerators(initial, rejected.receiver).filter(
                (position) => getDelegated(initial.generators[position]).length === 0,
              )
            : [];
        }),
    ].filter(
      (position) =>
        position !== -1 &&
        initial.generators[position].type === undefined &&
        initial.generators[position].body !== undefined,
    ),
  );
  if (targets.size === 0) return false;
  const isAsync = (generator: ts.FunctionLikeDeclaration) =>
    generator.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) === true;
  const settle = (types: Map<number, GeneratorTypes>, round: number): boolean => {
    setText(original);
    const before = getState();
    if (before === undefined) return false;
    applyEdits(
      new Map(
        [...types].flatMap(([position, type]) => {
          const generator = before.generators[position];
          const closeParen = generator
            .getChildren()
            .find((child) => child.kind === ts.SyntaxKind.CloseParenToken);
          const iterable = isAsync(generator) ? "AsyncIterable" : "Iterable";
          const delegated = getDelegated(generator);
          return [
            [
              closeParen?.getEnd() ?? generator.parameters.end,
              `: ${isAsync(generator) ? "AsyncGenerator" : "Generator"}<${type.yielded || "never"}, ${type.returned || "never"}, ${type.sent.join(" | ")}>`,
            ] as const,
            ...type.casts.flatMap((cast) => [
              [delegated[cast].getStart(), "("] as const,
              [
                delegated[cast].getEnd(),
                ` as unknown as ${iterable}<unknown, unknown, unknown>)`,
              ] as const,
            ]),
          ];
        }),
      ),
    );
    const state = getState();
    if (state === undefined) return false;
    const checker = state.checker;
    const sent = new Map<number, string[]>();
    const closed = new Map<number, string[]>();
    state.diagnostics
      .filter((diagnostic) => CONVERTED_ARGUMENT_ERRORS.has(diagnostic.code))
      .forEach((diagnostic) => {
        const rejected = getRejectedCall(state, diagnostic);
        if (rejected === undefined || !["next", "return"].includes(rejected.method)) return;
        const receiver = checker.getTypeAtLocation(rejected.receiver);
        const argument = checker.getTypeAtLocation(rejected.call.arguments[0]);
        [...types.keys()].forEach((position) => {
          const generator = state.generators[position];
          const annotation = generator.type;
          if (
            annotation === undefined ||
            !(receiver.isUnion() ? receiver.types : [receiver]).includes(
              checker.getTypeFromTypeNode(annotation),
            )
          ) {
            return;
          }
          // An async generator's return awaits what the call passes.
          const members = getMemberTypes(
            checker,
            rejected.method === "return" && isAsync(generator)
              ? checker.getAwaitedType(argument)
              : argument,
          ) ?? ["any"];
          const found = rejected.method === "next" ? sent : closed;
          found.set(position, [...(found.get(position) ?? []), ...members]);
        });
      });
    const next = new Map<number, GeneratorTypes>();
    [...types].forEach(([position, type]) => {
      const generator = state.generators[position];
      const yieldsAndReturns = getYieldsAndReturns(generator);
      const yields = yieldsAndReturns.yields;
      const returns = yieldsAndReturns.returns;
      const getTypes = (operand: ts.Expression | undefined) => {
        if (operand === undefined) return ["undefined"];
        const value = checker.getTypeAtLocation(operand);
        return getMemberTypes(checker, isAsync(generator) ? checker.getAwaitedType(value) : value);
      };
      const statements =
        generator.body !== undefined && ts.isBlock(generator.body) ? generator.body.statements : [];
      const last = statements.at(-1);
      const isEndReachable =
        last === undefined || !(ts.isReturnStatement(last) || ts.isThrowStatement(last));
      const casts = getDelegated(generator).flatMap((operand, cast) =>
        type.casts.includes(cast) ||
        // The first round yields never, which no operand fits.
        (type.yielded !== "" &&
          state.diagnostics.some(
            (diagnostic) =>
              (diagnostic.start ?? 0) >= operand.getStart() &&
              (diagnostic.start ?? 0) < operand.getEnd(),
          ))
          ? [cast]
          : [],
      );
      const yielded = yields.map((node) =>
        node.asteriskToken === undefined ? getTypes(node.expression) : ["unknown"],
      );
      const closedTypes = [...new Set([...type.closed, ...(closed.get(position) ?? [])])];
      // TypeScript takes a generator that can end without a return only where its return type is
      // undefined or has void.
      const returned = [
        ...returns.map((node) => getTypes(node.expression)),
        ...(isEndReachable ? [[closedTypes.length === 0 ? "undefined" : "void"]] : []),
        closedTypes,
      ];
      const sentTypes = getUnion([...type.sent, ...(sent.get(position) ?? [])]);
      if (sentTypes.includes("any") || closedTypes.includes("any")) return;
      // A round may type a yield's operand as any, where a later one may not.
      const isTyped = [...yielded, ...returned].every((members) => members !== undefined);
      next.set(position, {
        yielded: isTyped ? getUnion(yielded.flatMap((members) => members ?? [])).join(" | ") : "",
        returned: isTyped ? getUnion(returned.flatMap((members) => members ?? [])).join(" | ") : "",
        sent: sentTypes,
        closed: closedTypes,
        casts,
      });
    });
    const isSettled =
      next.size === types.size &&
      [...types].every(([position, type]) => {
        const settled = next.get(position);
        return (
          settled !== undefined &&
          settled.yielded !== "" &&
          settled.yielded === type.yielded &&
          settled.returned === type.returned &&
          settled.sent.join(" | ") === type.sent.join(" | ") &&
          settled.casts.join() === type.casts.join()
        );
      });
    if (isSettled) return true;
    if (round === GENERATOR_ROUNDS || next.size === 0) {
      setText(original);
      return false;
    }
    return settle(next, round + 1);
  };
  return settle(
    new Map(
      [...targets].map((position) => [
        position,
        { yielded: "", returned: "", sent: ["undefined"], closed: [], casts: [] },
      ]),
    ),
    0,
  );
};

// A variable that an empty array literal initializes, and that the test pushes object literals to,
// which getArrayOfUnion types as an array of a union where no push fits each, holds an array of
// objects with each property that a push gives, optional where another push lacks it.
const typePushedArrays = () => {
  const program = service.getProgram();
  const sourceFile = program?.getSourceFile(PROGRAM_PATH);
  if (program === undefined || sourceFile === undefined) return;
  const checker = program.getTypeChecker();
  const replacements: { start: number; end: number; text: string }[] = [];
  const visit = (node: ts.Node) => {
    ts.forEachChild(node, visit);
    if (
      !ts.isVariableDeclaration(node) ||
      !ts.isIdentifier(node.name) ||
      node.type === undefined ||
      !ts.isArrayTypeNode(node.type) ||
      !ts.isParenthesizedTypeNode(node.type.elementType) ||
      !ts.isUnionTypeNode(node.type.elementType.type) ||
      node.initializer === undefined ||
      !ts.isArrayLiteralExpression(node.initializer) ||
      node.initializer.elements.length > 0
    ) {
      return;
    }
    const symbol = checker.getSymbolAtLocation(node.name);
    const pushed: ts.Expression[] = [];
    const findPushes = (inner: ts.Node) => {
      if (
        ts.isCallExpression(inner) &&
        ts.isPropertyAccessExpression(inner.expression) &&
        inner.expression.name.text === "push" &&
        checker.getSymbolAtLocation(inner.expression.expression) === symbol
      ) {
        pushed.push(...inner.arguments);
      }
      ts.forEachChild(inner, findPushes);
    };
    findPushes(sourceFile);
    if (pushed.length === 0 || !pushed.every(ts.isObjectLiteralExpression)) return;
    const types = pushed.map((argument) => checker.getTypeAtLocation(argument));
    const names = [
      ...new Set(types.flatMap((type) => type.getProperties().map((property) => property.name))),
    ];
    const properties = names.map((name) => {
      const found = types.flatMap((type) => type.getProperty(name) ?? []);
      // A property that holds this holds the object a method's call gives, and one that holds an
      // array of any, such as [...arguments], holds an array of any value.
      const members = found.map((property) => {
        const declaration = property.valueDeclaration;
        const type = checker.getTypeOfSymbolAtLocation(property, sourceFile);
        const element = checker.isArrayType(type) ? checker.getTypeArguments(type)[0] : undefined;
        return declaration !== undefined &&
          ts.isPropertyAssignment(declaration) &&
          declaration.initializer.kind === ts.SyntaxKind.ThisKeyword
          ? ["{ [key: string | symbol]: unknown }"]
          : element !== undefined && (element.flags & ts.TypeFlags.Any) !== 0
            ? ["unknown[]"]
            : getMemberTypes(checker, type);
      });
      if (members.some((member) => member === undefined)) return undefined;
      const key = /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
      const union = getUnion(members.flatMap((member) => member ?? [])).join(" | ");
      return `${key}${found.length < types.length ? "?" : ""}: ${union}`;
    });
    if (properties.includes(undefined)) return;
    replacements.push({
      start: node.type.getStart(),
      end: node.type.getEnd(),
      text: `{ ${properties.join("; ")} }[]`,
    });
  };
  visit(sourceFile);
  setText(
    replacements
      .toSorted((left, right) => right.start - left.start)
      .reduce(
        (current, replacement) =>
          current.slice(0, replacement.start) + replacement.text + current.slice(replacement.end),
        file.text,
      ),
  );
};

const REDECLARED_TYPE_ERROR = 2403;

// A var that one declaration declares without a type or a value, which TypeScript types as any, or
// with an empty array of any, as Array() gives, and another declares with a value, as var x; then
// for (var x of [1]), which TypeScript rejects as declarations of two types. The first takes the
// other's type, an array's for an array of any, where each other declaration has the same type.
const typeRedeclaredVars = () => {
  const program = service.getProgram();
  const sourceFile = program?.getSourceFile(file.path);
  if (program === undefined || sourceFile === undefined) return;
  const checker = program.getTypeChecker();
  const getDeclaration = (position: number): ts.VariableDeclaration | undefined => {
    const visit = (node: ts.Node): ts.Node | undefined =>
      ts.forEachChild(node, (child) =>
        child.getStart() <= position && position < child.getEnd()
          ? (visit(child) ?? child)
          : undefined,
      );
    const found = visit(sourceFile);
    return found === undefined ? undefined : ts.findAncestor(found, ts.isVariableDeclaration);
  };
  const isEmptyArray = (value: ts.Expression) =>
    ts.isArrayLiteralExpression(value)
      ? value.elements.length === 0
      : (ts.isCallExpression(value) || ts.isNewExpression(value)) &&
        value.expression.getText() === "Array" &&
        (value.arguments ?? []).length === 0;
  const isLoose = (declaration: ts.Declaration, type: string, other: string) =>
    ts.isVariableDeclaration(declaration) &&
    declaration.type === undefined &&
    !ts.isForInOrOfStatement(declaration.parent.parent) &&
    (declaration.initializer === undefined
      ? type === "any"
      : type === "any[]" && other.endsWith("[]") && isEmptyArray(declaration.initializer));
  const types = Map.groupBy(
    service.getSemanticDiagnostics(file.path).flatMap((diagnostic) => {
      const match =
        diagnostic.code === REDECLARED_TYPE_ERROR
          ? /must be of type '([^']*)', but here has type '([^']*)'\.$/.exec(
              ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
            )
          : null;
      const declaration = getDeclaration(diagnostic.start ?? 0);
      const declarations =
        declaration === undefined
          ? []
          : (checker.getSymbolAtLocation(declaration.name)?.declarations ?? []);
      const first = declarations[0];
      if (match === null || declaration === undefined || first === undefined) return [];
      return first !== declaration && isLoose(first, match[1], match[2])
        ? [{ declaration: first, type: match[2] }]
        : isLoose(declaration, match[2], match[1])
          ? [{ declaration, type: match[1] }]
          : [];
    }),
    (entry) => entry.declaration,
  );
  const edits = new Map(
    [...types].flatMap(([declaration, entries]) => {
      const typeTexts = new Set(entries.map((entry) => entry.type));
      const type = entries[0]?.type;
      return typeTexts.size === 1 &&
        type !== undefined &&
        !type.includes("...") &&
        ts.isVariableDeclaration(declaration)
        ? [[declaration.name.getEnd(), `: ${type}`] as const]
        : [];
    }),
  );
  if (edits.size > 0) applyEdits(edits);
};

// A generator's parameter that the generator only delegates to with yield*, which the fix types as
// unknown where the test calls the generator through a getter, as C.$([1]) calls the private
// method that C's getter returns. It takes the array type of the array literals that each call
// TypeScript resolves to the generator passes it.
const typeDelegatedParameters = () => {
  const program = service.getProgram();
  const sourceFile = program?.getSourceFile(file.path);
  if (program === undefined || sourceFile === undefined) return;
  const checker = program.getTypeChecker();
  const calls: ts.CallExpression[] = [];
  const names: ts.Identifier[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) calls.push(node);
    if (ts.isIdentifier(node)) names.push(node);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  const getCalled = (call: ts.CallExpression) =>
    checker.getResolvedSignature(call)?.getDeclaration();
  const generators = new Set(
    calls
      .map(getCalled)
      .filter(
        (declaration) =>
          declaration !== undefined &&
          (ts.isMethodDeclaration(declaration) || ts.isFunctionExpression(declaration)) &&
          declaration.asteriskToken !== undefined &&
          declaration.getSourceFile() === sourceFile,
      ),
  );
  const replacements = [...generators].flatMap((generator) =>
    (generator?.parameters ?? []).flatMap((parameter, position) => {
      const symbol = checker.getSymbolAtLocation(parameter.name);
      const uses = names.filter(
        (name) => name !== parameter.name && checker.getSymbolAtLocation(name) === symbol,
      );
      const types = new Set(
        calls
          .filter((call) => getCalled(call) === generator)
          .map((call) => {
            const value = call.arguments[position];
            return value !== undefined &&
              ts.isArrayLiteralExpression(value) &&
              !value.elements.some(ts.isSpreadElement)
              ? checker.typeToString(checker.getTypeAtLocation(value))
              : undefined;
          }),
      );
      const type = [...types][0];
      return parameter.type?.kind === ts.SyntaxKind.UnknownKeyword &&
        parameter.dotDotDotToken === undefined &&
        uses.length > 0 &&
        uses.every(
          (use) =>
            ts.isYieldExpression(use.parent) &&
            use.parent.asteriskToken !== undefined &&
            use.parent.expression === use,
        ) &&
        types.size === 1 &&
        type !== undefined
        ? [{ start: parameter.type.getStart(), end: parameter.type.getEnd(), text: type }]
        : [];
    }),
  );
  setText(
    replacements
      .toSorted((left, right) => right.start - left.start)
      .reduce(
        (current, replacement) =>
          current.slice(0, replacement.start) + replacement.text + current.slice(replacement.end),
        file.text,
      ),
  );
};

// test262 is JavaScript, so its functions and variables have no types. This annotates them as
// TypeScript's "Infer type from usage" fix does, with unknown where it infers any, then loosens
// the types of the objects it describes.
// A union of array types that the fix infers for an empty array that the test pushes values of
// several types to, as unknown[][] | IArguments[], whose push takes only what every member's does.
// An array of the union of their elements takes each.
const getArrayOfUnion = (inferred: string) => {
  const sourceFile = ts.createSourceFile(
    PROGRAM_PATH,
    `type Inferred = ${inferred.replace(/^:/, "")};`,
    ts.ScriptTarget.Latest,
  );
  const alias = sourceFile.statements[0];
  const type = alias !== undefined && ts.isTypeAliasDeclaration(alias) ? alias.type : undefined;
  return type !== undefined && ts.isUnionTypeNode(type) && type.types.every(ts.isArrayTypeNode)
    ? `: (${type.types.map((member) => member.elementType.getText(sourceFile)).join(" | ")})[]`
    : inferred;
};

const annotate = (text: string, path = PROGRAM_PATH) => {
  file.path = path;
  setText(text);
  typeIteratorBases();
  typeGenerators();
  typeCallbacks();
  for (;;) {
    const program = service.getProgram();
    const sourceFile = program?.getSourceFile(file.path);
    const checker = program?.getTypeChecker();
    const getDeclaration = (node: ts.Node, position: number): ts.VariableDeclaration | undefined =>
      ts.isVariableDeclaration(node) && node.name.getEnd() === position
        ? node
        : ts.forEachChild(node, (child) => getDeclaration(child, position));
    const fix = service
      .getSemanticDiagnostics(file.path)
      .values()
      .filter((diagnostic) => IMPLICIT_ANY_ERRORS.has(diagnostic.code))
      .flatMap((diagnostic) => {
        const start = diagnostic.start ?? 0;
        const end = start + (diagnostic.length ?? 0);
        return service.getCodeFixesAtPosition(file.path, start, end, [diagnostic.code], {}, {});
      })
      .find((candidate) => candidate.fixName === "inferFromUsage");
    const annotated =
      fix === undefined
        ? file.text
        : fix.changes
            .filter((change) => change.fileName === file.path)
            .flatMap((change) => change.textChanges)
            .toSorted((left, right) => right.span.start - left.span.start)
            .reduce((current, change) => {
              const inferred = change.newText.replaceAll(/\bany\b/g, "unknown");
              const declaration =
                sourceFile === undefined
                  ? undefined
                  : getDeclaration(sourceFile, change.span.start);
              const held =
                declaration === undefined || checker === undefined
                  ? []
                  : getHeld(checker, declaration);
              // A variable that holds only empty array literals holds an array, which the fix
              // infers as unknown where the test only destructures it or fills it in a function.
              const isEmptyArrayHeld =
                held.length > 0 &&
                held.every(
                  (value) => ts.isArrayLiteralExpression(value) && value.elements.length === 0,
                );
              // A variable that only numbers, or only strings, are assigned to, which the fix infers
              // as unknown where a function reads it, holds a number or a string.
              const isHeld = (flags: ts.TypeFlags) =>
                held.length > 0 &&
                held.every(
                  (value) =>
                    checker !== undefined && (checker.getTypeAtLocation(value).flags & flags) !== 0,
                );
              return (
                current.slice(0, change.span.start) +
                (inferred === ": unknown" &&
                checker !== undefined &&
                declaration !== undefined &&
                isCaughtHeld(checker, declaration)
                  ? ": any"
                  : inferred === ": unknown" && isEmptyArrayHeld
                    ? ": unknown[]"
                    : isEmptyArrayHeld
                      ? getArrayOfUnion(inferred)
                      : inferred === ": unknown" && isHeld(ts.TypeFlags.NumberLike)
                        ? ": number"
                        : inferred === ": unknown" && isHeld(ts.TypeFlags.StringLike)
                          ? ": string"
                          : inferred) +
                current.slice(change.span.start + change.span.length)
              );
            }, file.text);
    if (annotated === file.text) break;
    setText(annotated);
  }
  typePushedArrays();
  typeDelegatedParameters();
  typeRedeclaredVars();
  // A type that one loosening gives can show where another is needed.
  while (loosen());
  ignoreSoundErrors();
  return file.text;
};

// TypeScript's errors that leave each expression the type it has: a property or element that an
// object's type lacks, which reads as any, an unused operand of a comma, and a name that no
// declaration binds, whose read tla-ts throws a ReferenceError for.
const MISSING_PROPERTY_ERROR = 2339;
// A value of another type than an assignment's target or a call's parameter.
const UNASSIGNABLE_ERRORS = new Set([2322, 2345]);
// A value of a type that lacks many of the members of an assignment's target or a call's parameter.
const MISSING_MEMBERS_ERROR = 2740;
// An element of an array-like object, such as an array or a typed array, of a key that isn't a
// number.
const NON_NUMBER_INDEX_ERROR = 7015;
const UNTYPED_READ_ERRORS = new Set([
  MISSING_PROPERTY_ERROR,
  2551,
  NON_NUMBER_INDEX_ERROR,
  7017,
  7053,
]);
const UNUSED_OPERAND_ERROR = 2695;
// A delete of a property that the object's type doesn't make optional.
const OPTIONAL_DELETE_ERROR = 2790;
const UNRESOLVED_NAME_ERROR = 2304;
const NOT_ITERABLE_ERROR = 2488;
// A tuple's element past its end.
const MISSING_ELEMENT_ERROR = 2493;

// An argument of a type that a call's signatures don't take, which tla-ts converts where a string's
// method or RegExp takes a primitive or an object.
const NO_OVERLOAD_ERROR = 2769;
const CONVERTED_ARGUMENT_ERRORS = new Set([2345, NO_OVERLOAD_ERROR]);
// A value of another type than a parameter, a property of a type, or a member of a type takes, or
// a property that a type lacks.
const TEMPORAL_ARGUMENT_ERRORS = new Set([2322, 2345, 2353, 2559, 2561, NO_OVERLOAD_ERROR]);
// A using declaration's value that isn't null, undefined, or an object whose type has the dispose
// method that the declaration calls, which tla-ts reads as it runs and throws the TypeError of.
const USING_INITIALIZER_ERRORS = new Set([2850, 2851]);
// The array methods that tla-ts runs a reducer for on the values it gets, not its declared types,
// where a test's reducer returns a type that the method's signatures don't take. Each needs a unit
// test of such a call, since tla-ts reads a value by its declared type.
const REDUCING_METHODS = new Set(["reduce", "reduceRight"]);
// The array methods that tla-ts searches by value for any value, from an index that ToNumber
// converts from a primitive, or for undefined where a call passes no value, also on a typed array.
// Each needs a unit test of such a call.
const SEARCHING_METHODS = new Set(["includes", "indexOf", "lastIndexOf"]);
// The promise combinators, which tla-ts runs on any value a test passes them, not only an iterable.
const PROMISE_COMBINATORS = new Set(["all", "allSettled", "any", "race"]);

// The typed arrays' methods that call a callback for each element, which tla-ts runs on what the
// callback returns: ToBoolean of it for a test, the element type's conversion of it for map, and
// nothing for forEach. Each needs a unit test of a callback that returns another type.
const TYPED_ARRAY_CALLBACK_METHODS = new Set([
  "every",
  "filter",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "forEach",
  "map",
  "some",
]);

// The Date setters, and a DataView's getters and setters, which tla-ts runs on objects that a test
// declares, wrappers, and primitives, converting each in turn as Node does: it runs the objects'
// valueOf and toString, as new DataView does too. Each needs a unit test of such a call.
const DATE_SETTER_NAME =
  /^set(UTC)?(FullYear|Month|Date|Hours|Minutes|Seconds|Milliseconds)$|^setTime$/;
const VIEW_ACCESSOR_NAME = /^(get|set)(Int|Uint|Float|BigInt|BigUint)\d+$/;

// RegExp.prototype's methods under well-known symbols that tla-ts runs as their steps where a test
// calls them through call, on any receiver, or on a regexp with a string, a limit, or a replaceValue
// of another type than their signatures take. Each needs a unit test of such a call.
const PROTOCOL_METHODS = new Set(["match", "search", "split", "replace"]);
// TypeScript's errors for a call with fewer arguments than its signature takes.
const SHORT_CALL_ERRORS = new Set([ARGUMENT_COUNT_ERROR, 2555]);
// A spread argument that TypeScript can't count against a function's parameters, an argument past
// them, or apply's arguments where the function takes none.
const SPREAD_CALL_ERRORS = new Set([ARGUMENT_COUNT_ERROR, 2345, 2556]);

const skipParentheses = (node: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(node) ? skipParentheses(node.expression) : node;
// A call of a method on a union of typed arrays, whose members' signatures TypeScript can't combine.
const UNCALLABLE_ERROR = 2349;
// The typed arrays' methods that tla-ts runs on the elements of any typed array, where a test calls
// them on a union of typed arrays. Each needs a unit test of such a call.
const TYPED_UNION_METHODS = new Set(["findLast", "reduce", "reduceRight"]);

// A call that gives a function no this where the function types one, which tla-ts runs with the this
// that a call by name gives: undefined, or the global object outside strict mode.
const UNTYPED_THIS_ERROR = 2684;

// An operator's operand of a type that the operator doesn't take, or that is null or undefined,
// which tla-ts converts to a primitive where it's an object that the test declares, a wrapper, or a
// primitive.
const OPERAND_TYPE_ERRORS = new Set([2362, 2363, 2365, 18050]);

// The arithmetic operators, which tla-ts takes only numbers for, or strings for +.
const UNKNOWN_ARITHMETIC_OPERATORS = new Set([
  ts.SyntaxKind.PlusToken,
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.AsteriskAsteriskToken,
  ts.SyntaxKind.PercentToken,
  ts.SyntaxKind.SlashToken,
]);

// The operators whose operands tla-ts converts to numbers whatever their types.
const UNKNOWN_UNARY_OPERATORS = new Set([
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.PlusToken,
  ts.SyntaxKind.TildeToken,
]);
const UNKNOWN_BITWISE_OPERATORS = new Set([
  ts.SyntaxKind.AmpersandToken,
  ts.SyntaxKind.BarToken,
  ts.SyntaxKind.CaretToken,
  ts.SyntaxKind.LessThanLessThanToken,
  ts.SyntaxKind.GreaterThanGreaterThanToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
]);

const COMPOUND_ASSIGNMENTS = new Set([
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
]);

// A comparison of types that don't overlap, which only misleads where TypeScript narrows an operand
// by it.
const UNINTENDED_COMPARISON_ERROR = 2367;
// A comparison that TypeScript takes to give one result: of an object literal, which JavaScript
// compares by reference or converts to a primitive, or of NaN, which equals nothing.
const CONSTANT_COMPARISON_ERRORS = new Set([2839, 2845]);
// A read of a variable that TypeScript can't tell is assigned. tla-ts reads a let's or a const's
// type as its value's, so a read of one is sound only where the value is assigned whenever it runs.
const UNASSIGNED_READ_ERROR = 2454;

const EQUALITY_OPERATORS = new Set([
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
]);

const CONDITION_OPERATORS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
]);

// An operand that TypeScript narrows by a comparison, as getReferenceCandidate finds it.
const isReference = (node: ts.Expression): boolean => {
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isTypeOfExpression(node)
  ) {
    return isReference(node.expression);
  }
  if (ts.isBinaryExpression(node)) {
    return node.operatorToken.kind === ts.SyntaxKind.CommaToken
      ? isReference(node.right)
      : ts.isAssignmentOperator(node.operatorToken.kind);
  }
  return (
    ts.isIdentifier(node) ||
    node.kind === ts.SyntaxKind.ThisKeyword ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node)
  );
};

// Whether a comparison decides which code runs next, where TypeScript narrows its operands.
const isCondition = (node: ts.Node): boolean => {
  const parent = node.parent;
  if (ts.isParenthesizedExpression(parent)) return isCondition(parent);
  if (ts.isPrefixUnaryExpression(parent)) {
    return parent.operator === ts.SyntaxKind.ExclamationToken && isCondition(parent);
  }
  if (ts.isBinaryExpression(parent) && CONDITION_OPERATORS.has(parent.operatorToken.kind)) {
    return parent.left === node || isCondition(parent);
  }
  return (
    ((ts.isIfStatement(parent) || ts.isWhileStatement(parent) || ts.isDoStatement(parent)) &&
      parent.expression === node) ||
    (ts.isForStatement(parent) && parent.condition === node) ||
    (ts.isConditionalExpression(parent) && parent.condition === node)
  );
};

// Ignores those errors where the line they're on starts outside a string or template, so that
// // @ts-ignore above it changes nothing that Node runs. A read of a value that isn't an object,
// such as undefined in a pattern, still throws, so its error stays.
const ignoreSoundErrors = () => {
  const program = service.getProgram();
  const sourceFile = program?.getSourceFile(file.path);
  if (program === undefined || sourceFile === undefined) return;
  const checker = program.getTypeChecker();
  const getNode = (position: number) => {
    const visit = (node: ts.Node): ts.Node =>
      ts.forEachChild(node, (child) =>
        child.getStart() <= position && position < child.getEnd() ? visit(child) : undefined,
      ) ?? node;
    return visit(sourceFile);
  };
  // A typed array's element of a key that isn't a number reads as any where the typed array is one
  // of several kinds too, as a test's callback for each kind takes it, and so does a property of a
  // value of type object, as a proxy of a target and a handler that the test types loosely is.
  const isObjectRead = (node: ts.Node, diagnostic: ts.Diagnostic) => {
    const read = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.PropertyAccessExpression | ts.ElementAccessExpression =>
        ts.isPropertyAccessExpression(ancestor) || ts.isElementAccessExpression(ancestor),
    );
    const type = read && checker.getTypeAtLocation(read.expression);
    return (
      type !== undefined &&
      (type.isUnion()
        ? diagnostic.code === NON_NUMBER_INDEX_ERROR &&
          type.types.every((member) => TYPED_ARRAY_NAME.test(member.getSymbol()?.getName() ?? ""))
        : (type.flags & (ts.TypeFlags.Object | ts.TypeFlags.NonPrimitive)) !== 0) &&
      ts.findAncestor(node, ts.isBindingElement) === undefined
    );
  };
  // An object that the test declares and a pattern or a loop iterates, whose iterator tla-ts reads
  // from its properties or refuses to follow. An array assignment pattern's own type is the array
  // literal's, not its value's.
  const isPlainObject = (node: ts.Node) => {
    const type = ts.isArrayLiteralExpression(node)
      ? checker.getTypeOfAssignmentPattern(node)
      : checker.getTypeAtLocation(node);
    const declarations = type.getSymbol()?.declarations ?? [];
    return (
      !type.isUnion() &&
      (type.flags & ts.TypeFlags.Object) !== 0 &&
      type.getCallSignatures().length === 0 &&
      !checker.isArrayLikeType(type) &&
      declarations.length > 0 &&
      declarations.every((declaration) => !declaration.getSourceFile().isDeclarationFile)
    );
  };
  const isPrimitive = (node: ts.Node) =>
    (checker.getTypeAtLocation(node).flags &
      (ts.TypeFlags.NumberLike |
        ts.TypeFlags.StringLike |
        ts.TypeFlags.BooleanLike |
        ts.TypeFlags.Undefined |
        ts.TypeFlags.Null)) !==
    0;
  const isWrapper = (node: ts.Node) => {
    const symbol = checker.getTypeAtLocation(node).getSymbol();
    return (
      symbol !== undefined &&
      ["Boolean", "Number", "String"].includes(symbol.getName()) &&
      (symbol.declarations ?? []).every(
        (declaration) => declaration.getSourceFile().isDeclarationFile,
      )
    );
  };
  // An operation on objects that the test declares, wrappers, and primitives, which tla-ts
  // converts, and on operands of type never, such as a call of a function that only throws, which
  // give no value to convert.
  const isConverted = (node: ts.Node, diagnostic: ts.Diagnostic) => {
    const start = diagnostic.start ?? 0;
    const end = start + (diagnostic.length ?? 0);
    const isSpan = (inner: ts.Node) => inner.getStart() === start && inner.getEnd() === end;
    const operation = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.BinaryExpression =>
        ts.isBinaryExpression(ancestor) &&
        (isSpan(ancestor) || isSpan(ancestor.left) || isSpan(ancestor.right)),
    );
    if (operation === undefined) return false;
    const kind = operation.operatorToken.kind;
    // A compound assignment converts what it reads from a variable of type any.
    const isCompound =
      COMPOUND_ASSIGNMENTS.has(kind) &&
      ts.isIdentifier(operation.left) &&
      (checker.getTypeAtLocation(operation.left).flags & ts.TypeFlags.Any) !== 0;
    const operands = isCompound ? [operation.right] : [operation.left, operation.right];
    return (
      (isCompound ||
        !(kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment)) &&
      operands.every(
        (operand) =>
          isPlainObject(operand) ||
          isWrapper(operand) ||
          isPrimitive(operand) ||
          (checker.getTypeAtLocation(operand).flags & ts.TypeFlags.Never) !== 0,
      )
    );
  };
  // An arithmetic operation on values of type unknown, which tla-ts refuses to compile, so it
  // stops where the operation runs.
  const isUnknownArithmetic = (node: ts.Node) => {
    const operation = node.parent;
    const isUnknown = (operand: ts.Expression): boolean =>
      (checker.getTypeAtLocation(operand).flags & ts.TypeFlags.Unknown) !== 0 ||
      (ts.isBinaryExpression(operand) && isUnknownArithmetic(operand.left));
    return (
      ts.isBinaryExpression(operation) &&
      UNKNOWN_ARITHMETIC_OPERATORS.has(operation.operatorToken.kind) &&
      isUnknown(operation.left) &&
      isUnknown(operation.right)
    );
  };
  // An operand of type unknown of a unary -, +, or ~, or of a bitwise or shift operator, which
  // tla-ts converts as JavaScript does where the value is a primitive, and stops on otherwise.
  const isConvertedUnknown = (node: ts.Node, diagnostic: ts.Diagnostic) => {
    const operand = ts.findAncestor(
      node,
      (ancestor) =>
        ancestor.getStart() === diagnostic.start &&
        ancestor.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0),
    );
    const operation = operand?.parent;
    return (
      operation !== undefined &&
      ((ts.isPrefixUnaryExpression(operation) && UNKNOWN_UNARY_OPERATORS.has(operation.operator)) ||
        (ts.isBinaryExpression(operation) &&
          UNKNOWN_BITWISE_OPERATORS.has(operation.operatorToken.kind)))
    );
  };
  // A read or a write of a property of a value of type unknown, which tla-ts runs through the heap
  // as JavaScript does where the value is an object, an array, a function, or a string, and stops
  // on otherwise. A call of the property's value is left to the rules for calls.
  const isUnknownAccess = (node: ts.Node, diagnostic: ts.Diagnostic) => {
    const operand = ts.findAncestor(
      node,
      (ancestor) =>
        ancestor.getStart() === diagnostic.start &&
        ancestor.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0),
    );
    const access = operand?.parent;
    return (
      access !== undefined &&
      (ts.isPropertyAccessExpression(access) || ts.isElementAccessExpression(access)) &&
      access.expression === operand &&
      !(
        (ts.isCallExpression(access.parent) ||
          ts.isNewExpression(access.parent) ||
          ts.isTaggedTemplateExpression(access.parent)) &&
        ts.skipParentheses(
          ts.isTaggedTemplateExpression(access.parent)
            ? access.parent.tag
            : access.parent.expression,
        ) === access
      )
    );
  };
  const isUnnarrowed = (node: ts.Node, diagnostic: ts.Diagnostic) => {
    const comparison = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.BinaryExpression =>
        ts.isBinaryExpression(ancestor) &&
        EQUALITY_OPERATORS.has(ancestor.operatorToken.kind) &&
        ancestor.getStart() === diagnostic.start &&
        ancestor.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0),
    );
    return (
      comparison !== undefined &&
      !(isCondition(comparison) && (isReference(comparison.left) || isReference(comparison.right)))
    );
  };
  // A comparison of numbers that TypeScript takes to give one result, where it narrows a reference
  // that an earlier assignment or comparison narrowed, though a call that it doesn't follow changed
  // it since. It narrows the reference to never where the result differs, which tla-ts reads as a
  // number, as the value is.
  const isNumberComparison = (node: ts.Node, diagnostic: ts.Diagnostic) => {
    const comparison = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.BinaryExpression =>
        ts.isBinaryExpression(ancestor) &&
        EQUALITY_OPERATORS.has(ancestor.operatorToken.kind) &&
        ancestor.getStart() === diagnostic.start &&
        ancestor.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0),
    );
    return (
      comparison !== undefined &&
      isEveryType(comparison.left, ts.TypeFlags.NumberLike) &&
      isEveryType(comparison.right, ts.TypeFlags.NumberLike)
    );
  };
  // A property that a pattern destructures, which JavaScript reads whatever the value's type, and
  // whose value, where it's null or undefined, throws the TypeError that tla-ts throws too.
  const isPatternRead = (node: ts.Node) => {
    const parent = node.parent;
    const literal = ts.findAncestor(parent, ts.isObjectLiteralExpression);
    const target =
      literal &&
      ts.findAncestor(
        literal.parent,
        (ancestor) =>
          !ts.isObjectLiteralExpression(ancestor) &&
          !ts.isPropertyAssignment(ancestor) &&
          !ts.isArrayLiteralExpression(ancestor),
      );
    return (
      ts.isIdentifier(node) &&
      ((ts.isBindingElement(parent) &&
        ts.isObjectBindingPattern(parent.parent) &&
        (parent.propertyName ?? parent.name) === node) ||
        ((ts.isShorthandPropertyAssignment(parent) || ts.isPropertyAssignment(parent)) &&
          parent.name === node &&
          target !== undefined &&
          ((ts.isBinaryExpression(target) &&
            target.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            target.left.getStart() <= literal.getStart() &&
            literal.getEnd() <= target.left.getEnd()) ||
            ((ts.isForOfStatement(target) || ts.isForInStatement(target)) &&
              target.initializer.getStart() <= literal.getStart() &&
              literal.getEnd() <= target.initializer.getEnd()))))
    );
  };
  // An argument for a parameter that a pattern with no type annotation declares, in a function
  // that the test declares, whose type TypeScript infers from the pattern's defaults alone. The
  // call passes the value whatever its type, and tla-ts destructures it as JavaScript does. An
  // array pattern takes only an array literal, since tla-ts reads another value's iterator only
  // where its type says it has one. A parameter whose type is the loosest its pattern reads takes
  // null, where a nested pattern throws the TypeError that tla-ts throws too.
  const isPatternArgument = (node: ts.Node) => {
    const call = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.CallExpression | ts.NewExpression =>
        ts.isCallExpression(ancestor) || ts.isNewExpression(ancestor),
    );
    const position =
      call?.arguments?.findIndex(
        (argument) => argument.getStart() <= node.getStart() && node.getEnd() <= argument.getEnd(),
      ) ?? -1;
    const declaration = call && checker.getResolvedSignature(call)?.getDeclaration();
    const parameter =
      declaration !== undefined && ts.isFunctionLike(declaration)
        ? declaration.parameters.at(position)
        : undefined;
    return (
      position !== -1 &&
      parameter !== undefined &&
      parameter.getSourceFile() === sourceFile &&
      (parameter.type === undefined ||
        (node.kind === ts.SyntaxKind.NullKeyword &&
          parameter.type.getText() === getPatternType(parameter.name))) &&
      parameter.dotDotDotToken === undefined &&
      (ts.isObjectBindingPattern(parameter.name) ||
        (ts.isArrayBindingPattern(parameter.name) &&
          call?.arguments !== undefined &&
          ts.isArrayLiteralExpression(call.arguments[position])))
    );
  };
  // A nested array pattern whose value's type is an array's, or null or undefined, which
  // TypeScript rejects where the value may be null or undefined. JavaScript then throws the
  // TypeError that tla-ts throws too, and tla-ts reads an array as its type says.
  const isNullableArrayPattern = (node: ts.Node) => {
    if (!ts.isArrayBindingPattern(node)) return false;
    const type = checker.getNonNullableType(checker.getTypeAtLocation(node));
    return (
      (type.flags & ts.TypeFlags.Never) !== 0 ||
      (type.isUnion() ? type.types : [type]).every(
        (member) =>
          checker.isArrayType(member) ||
          checker.isTupleType(member) ||
          member.getSymbol()?.name === "Iterable",
      )
    );
  };
  // An empty object pattern whose value is null or undefined, or an array pattern whose value is
  // one or a primitive other than a string, which has no iterator method. JavaScript throws the
  // TypeError that tla-ts throws too. A call that an expression inlines reads an object pattern's
  // names before the TypeError.
  const isTypeErrorPattern = (node: ts.Node) => {
    const type =
      ts.isArrayLiteralExpression(node) || ts.isObjectLiteralExpression(node)
        ? ts.isBinaryExpression(node.parent) && node.parent.left === node
          ? checker.getTypeAtLocation(node.parent.right)
          : checker.getTypeOfAssignmentPattern(node)
        : ts.isArrayBindingPattern(node) || ts.isObjectBindingPattern(node)
          ? checker.getTypeAtLocation(node)
          : undefined;
    const throwing =
      ts.TypeFlags.Undefined |
      ts.TypeFlags.Null |
      ts.TypeFlags.Never |
      (ts.isArrayLiteralExpression(node) || ts.isArrayBindingPattern(node)
        ? ts.TypeFlags.NumberLike |
          ts.TypeFlags.BooleanLike |
          ts.TypeFlags.ESSymbolLike |
          ts.TypeFlags.BigIntLike
        : 0);
    return (
      type !== undefined &&
      !(ts.isObjectBindingPattern(node) && node.elements.length > 0) &&
      !(ts.isObjectLiteralExpression(node) && node.properties.length > 0) &&
      (type.isUnion() ? type.types : [type]).every((member) => (member.flags & throwing) !== 0)
    );
  };
  // An array pattern that a catch binds, or one nested in it, whose value of type unknown tla-ts
  // destructures as an array where it is one and refuses to otherwise.
  const isCaughtArrayPattern = (node: ts.Node) => {
    const declaration = ts.findAncestor(
      node,
      (ancestor) =>
        !ts.isBindingElement(ancestor) &&
        !ts.isArrayBindingPattern(ancestor) &&
        !ts.isObjectBindingPattern(ancestor),
    );
    return (
      ts.isArrayBindingPattern(node) &&
      (checker.getTypeAtLocation(node).flags & ts.TypeFlags.Unknown) !== 0 &&
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      ts.isCatchClause(declaration.parent)
    );
  };
  // An element of an array pattern that a declaration initializes with an array literal, past the
  // literal's end. JavaScript gives it undefined, as tla-ts does.
  const isMissingElement = (node: ts.Node) => {
    const element = ts.findAncestor(node, ts.isBindingElement);
    const declaration = element?.parent.parent;
    const initializer =
      declaration !== undefined && ts.isVariableDeclaration(declaration)
        ? declaration.initializer
        : undefined;
    return (
      element !== undefined &&
      ts.isArrayBindingPattern(element.parent) &&
      element.dotDotDotToken === undefined &&
      initializer !== undefined &&
      ts.isArrayLiteralExpression(initializer) &&
      !initializer.elements.some(ts.isSpreadElement) &&
      element.parent.elements.indexOf(element) >= initializer.elements.length
    );
  };
  // A read in a catch's block of what the catch binds, which TypeScript can't tell is assigned where
  // a rest element binds it, though the catch binds it before its block runs.
  const isCaughtRead = (node: ts.Node) => {
    const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
    const clause = declaration && ts.findAncestor(declaration, ts.isCatchClause);
    return (
      clause?.variableDeclaration !== undefined &&
      ts.findAncestor(declaration, (ancestor) => ancestor === clause.variableDeclaration) !==
        undefined &&
      ts.findAncestor(node, (ancestor) => ancestor === clause.block) !== undefined
    );
  };
  // A read of a var, which holds undefined until a statement assigns it, as tla-ts reads it.
  const isVarRead = (node: ts.Node) => {
    const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
    return (
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      ts.isVariableDeclarationList(declaration.parent) &&
      (declaration.parent.flags & ts.NodeFlags.BlockScoped) === 0
    );
  };
  // A read in a generator function that the test calls at once, of a variable that a top-level var
  // statement assigns, where the test reads the generator object only in top-level statements after
  // that one. Only the generator object runs the body, so it runs once the variable is assigned.
  const isLaterGeneratorRead = (node: ts.Node) => {
    const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
    const generator = ts.findAncestor(node, ts.isFunctionLike);
    if (
      declaration === undefined ||
      !ts.isVariableDeclaration(declaration) ||
      declaration.initializer === undefined ||
      declaration.parent.parent.parent !== sourceFile ||
      generator === undefined ||
      !ts.isFunctionExpression(generator) ||
      generator.asteriskToken === undefined
    ) {
      return false;
    }
    const call = ts.walkUpParenthesizedExpressions(generator.parent);
    const holder = call.parent;
    if (
      !ts.isCallExpression(call) ||
      ts.skipParentheses(call.expression) !== generator ||
      !ts.isVariableDeclaration(holder) ||
      holder.initializer !== call ||
      !ts.isIdentifier(holder.name)
    ) {
      return false;
    }
    const held = checker.getSymbolAtLocation(holder.name);
    const references: ts.Identifier[] = [];
    const visit = (inner: ts.Node) => {
      if (
        ts.isIdentifier(inner) &&
        inner !== holder.name &&
        checker.getSymbolAtLocation(inner) === held
      ) {
        references.push(inner);
      }
      ts.forEachChild(inner, visit);
    };
    visit(sourceFile);
    return references.every(
      (reference) =>
        reference.getStart() >= declaration.parent.parent.getEnd() &&
        ts.findAncestor(reference, ts.isFunctionLike) === undefined,
    );
  };
  // A call of a script's function through call or apply without arguments, which runs it with this
  // undefined and no arguments, where each of its parameters is optional.
  const isReceiverlessCall = (node: ts.Node) => {
    const call = ts.findAncestor(node, ts.isCallExpression);
    const callee = call && skipParentheses(call.expression);
    const signatures =
      callee !== undefined &&
      ts.isPropertyAccessExpression(callee) &&
      ["apply", "call"].includes(callee.name.text) &&
      call?.arguments.length === 0
        ? checker.getTypeAtLocation(callee.expression).getCallSignatures()
        : [];
    return (
      signatures.length > 0 &&
      signatures.every((signature) => {
        const declaration = signature.getDeclaration();
        return (
          (ts.isFunctionDeclaration(declaration) ||
            ts.isFunctionExpression(declaration) ||
            ts.isArrowFunction(declaration) ||
            ts.isMethodDeclaration(declaration)) &&
          declaration.body !== undefined &&
          declaration.parameters.every(
            (parameter) =>
              (ts.isIdentifier(parameter.name) && parameter.name.text === "this") ||
              parameter.questionToken !== undefined ||
              parameter.initializer !== undefined ||
              parameter.dotDotDotToken !== undefined,
          )
        );
      })
    );
  };
  // A call of a script's function with fewer arguments than it declares, where a parameter left
  // without one is a pattern without a default, whose destructuring of undefined throws a
  // TypeError, and each other is optional.
  const isShortPatternCall = (node: ts.Node) => {
    const call = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.CallExpression | ts.NewExpression =>
        ts.isCallExpression(ancestor) || ts.isNewExpression(ancestor),
    );
    const declaration = call && checker.getResolvedSignature(call)?.getDeclaration();
    const missing =
      call !== undefined &&
      declaration !== undefined &&
      (ts.isFunctionDeclaration(declaration) ||
        ts.isFunctionExpression(declaration) ||
        ts.isArrowFunction(declaration) ||
        ts.isMethodDeclaration(declaration)) &&
      declaration.body !== undefined &&
      !(call.arguments ?? []).some(ts.isSpreadElement)
        ? declaration.parameters
            .filter(
              (parameter) => !ts.isIdentifier(parameter.name) || parameter.name.text !== "this",
            )
            .slice(call.arguments?.length ?? 0)
        : [];
    const isPattern = (parameter: ts.ParameterDeclaration) =>
      !ts.isIdentifier(parameter.name) && parameter.initializer === undefined;
    return (
      missing.some(isPattern) &&
      missing.every(
        (parameter) =>
          isPattern(parameter) ||
          parameter.questionToken !== undefined ||
          parameter.dotDotDotToken !== undefined ||
          parameter.initializer !== undefined,
      )
    );
  };
  // A call of the call method of an array's method that REDUCING_METHODS lists, with a this value
  // and a reducer that the method's signature with no initial value takes. TypeScript checks call
  // against the method's last signature alone, which takes an initial value.
  const isShortReducingCall = (node: ts.Node) => {
    const call = ts.findAncestor(node, ts.isCallExpression);
    const method =
      call !== undefined &&
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.name.text === "call" &&
      ts.isPropertyAccessExpression(call.expression.expression) &&
      REDUCING_METHODS.has(call.expression.expression.name.text)
        ? call.expression.expression
        : undefined;
    const reducer = call?.arguments[1];
    return (
      method !== undefined &&
      reducer !== undefined &&
      call?.arguments.length === 2 &&
      !call.arguments.some(ts.isSpreadElement) &&
      checker
        .getSignaturesOfType(checker.getTypeAtLocation(method), ts.SignatureKind.Call)
        .some((signature) => {
          const declaration = signature.getDeclaration();
          const parameter = signature.parameters[0];
          return (
            declaration.getSourceFile().isDeclarationFile &&
            ts.isInterfaceDeclaration(declaration.parent) &&
            declaration.parent.name.text === "Array" &&
            signature.parameters.length === 1 &&
            parameter !== undefined &&
            checker.isTypeAssignableTo(
              checker.getTypeAtLocation(reducer),
              checker.getTypeOfSymbol(parameter),
            )
          );
        })
    );
  };
  const isEveryType = (node: ts.Node, flags: ts.TypeFlags) => {
    const type = checker.getTypeAtLocation(node);
    return (type.isUnion() ? type.types : [type]).every((member) => (member.flags & flags) !== 0);
  };
  // A primitive that a string's method converts for a parameter: any but a symbol or a BigInt for
  // a string, and a number or undefined, or a string, a boolean, or null, for a number.
  const isPrimitiveArgument = (node: ts.Node, parameter: "number" | "string" | undefined) =>
    parameter === "string"
      ? isEveryType(
          node,
          ts.TypeFlags.StringLike |
            ts.TypeFlags.NumberLike |
            ts.TypeFlags.BooleanLike |
            ts.TypeFlags.Null |
            ts.TypeFlags.Undefined,
        )
      : parameter === "number" &&
        (isEveryType(node, ts.TypeFlags.NumberLike | ts.TypeFlags.Undefined) ||
          isEveryType(
            node,
            ts.TypeFlags.StringLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.Null,
          ));
  const isGlobal = (node: ts.Identifier) =>
    (checker.getSymbolAtLocation(node)?.declarations ?? []).every(
      (declaration) => declaration.getSourceFile().isDeclarationFile,
    );
  // A literal that new RegExp and RegExp read as the text that ToString gives.
  const isPrimitiveLiteral = (node: ts.Expression) =>
    (ts.isIdentifier(node) && node.text === "undefined" && isGlobal(node)) ||
    (ts.isVoidExpression(node) && ts.isLiteralExpression(node.expression)) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword ||
    ts.isNumericLiteral(node);
  // The built-in that a call or a new runs, directly or through call: the interface that declares
  // it and its method's name, with a typed array's interface as TypedArray and ReadonlyArray as
  // Array, a constructor as its interface alone, and a global function as its name, after its
  // namespace's, as Reflect's are.
  const getBuiltInName = (call: ts.CallExpression | ts.NewExpression) => {
    const callee = skipParentheses(call.expression);
    const declaration =
      ts.isCallExpression(call) &&
      ts.isPropertyAccessExpression(callee) &&
      callee.name.text === "call"
        ? checker.getTypeAtLocation(callee.expression).getCallSignatures()[0]?.getDeclaration()
        : checker.getResolvedSignature(call)?.getDeclaration();
    if (
      declaration !== undefined &&
      ts.isFunctionDeclaration(declaration) &&
      declaration.getSourceFile().isDeclarationFile
    ) {
      return [
        ...(ts.isModuleBlock(declaration.parent) ? [declaration.parent.parent.name.text] : []),
        ...(declaration.name === undefined ? [] : [declaration.name.text]),
      ].join(".");
    }
    const owner = declaration?.parent;
    if (
      declaration === undefined ||
      owner === undefined ||
      !ts.isInterfaceDeclaration(owner) ||
      !declaration.getSourceFile().isDeclarationFile
    ) {
      return undefined;
    }
    return [
      TYPED_ARRAY_NAME.test(owner.name.text)
        ? "TypedArray"
        : owner.name.text === "ReadonlyArray"
          ? "Array"
          : owner.name.text,
      ...(declaration.name === undefined ? [] : [declaration.name.getText()]),
    ].join(".");
  };
  // A call or a new of a built-in, directly or through call, with fewer arguments than its type
  // takes, which passes undefined for the others as JavaScript does, where SHORT_CALLED_BUILT_INS
  // lists it, or with more, each a literal or a declared function's name, where
  // LONG_CALLED_BUILT_INS lists it.
  const isMiscountedBuiltInCall = (node: ts.Node, diagnostic: ts.Diagnostic) => {
    const counts = /Expected (at least )?(\d+)(?:-(\d+))? arguments, but got (\d+)/.exec(
      ts.flattenDiagnosticMessageText(diagnostic.messageText, ""),
    );
    if (counts === null) return false;
    const given = Number(counts[4]);
    const call = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.CallExpression | ts.NewExpression =>
        (ts.isCallExpression(ancestor) || ts.isNewExpression(ancestor)) &&
        (ancestor.arguments?.length ?? 0) === given,
    );
    if (call === undefined || (call.arguments ?? []).some(ts.isSpreadElement)) return false;
    const built = getBuiltInName(call);
    if (built === undefined) return false;
    const extra = (call.arguments ?? []).slice(Number(counts[3] ?? counts[2]));
    return given < Number(counts[2])
      ? SHORT_CALLED_BUILT_INS.has(built)
      : counts[1] === undefined &&
          LONG_CALLED_BUILT_INS.has(built) &&
          extra.every(
            (value) =>
              isPrimitiveLiteral(value) ||
              ts.isStringLiteral(value) ||
              (ts.isIdentifier(value) &&
                checker.getSymbolAtLocation(value)?.valueDeclaration?.kind ===
                  ts.SyntaxKind.FunctionDeclaration),
          );
  };
  // A call of a string's method, or of new RegExp or RegExp, whose arguments tla-ts converts: a
  // primitive for a string's method's parameter, an object that the test declares or a wrapper
  // for any but padStart's and padEnd's filler, and a primitive literal for RegExp's pattern and
  // flags. The error is the call's, at an argument or the method's name.
  const isConvertedCall = (diagnostic: ts.Diagnostic) => {
    const start = diagnostic.start ?? 0;
    const end = start + (diagnostic.length ?? 0);
    const isSpan = (inner: ts.Node) => inner.getStart() === start && inner.getEnd() === end;
    const call = ts.findAncestor(
      getNode(start),
      (ancestor): ancestor is ts.CallExpression | ts.NewExpression =>
        (ts.isCallExpression(ancestor) || ts.isNewExpression(ancestor)) &&
        ((ancestor.arguments ?? []).some(isSpan) ||
          (ts.isPropertyAccessExpression(ancestor.expression) && isSpan(ancestor.expression.name))),
    );
    const values = call?.arguments ?? [];
    if (
      call !== undefined &&
      ts.isIdentifier(call.expression) &&
      call.expression.text === "RegExp"
    ) {
      return (
        isGlobal(call.expression) &&
        values.length <= 2 &&
        values.every(
          (value) => isEveryType(value, ts.TypeFlags.StringLike) || isPrimitiveLiteral(value),
        )
      );
    }
    const callee = call?.expression;
    const name =
      callee !== undefined && ts.isPropertyAccessExpression(callee) ? callee.name : undefined;
    const parameters =
      name !== undefined &&
      ts.isPropertyAccessExpression(name.parent) &&
      isEveryType(name.parent.expression, ts.TypeFlags.StringLike)
        ? STRING_METHODS.get(name.text)?.parameters
        : undefined;
    return (
      call !== undefined &&
      ts.isCallExpression(call) &&
      name !== undefined &&
      parameters !== undefined &&
      values.length <= parameters.length &&
      values.every(
        (value, position) =>
          isPrimitiveArgument(value, parameters[position]) ||
          (checker.getTypeAtLocation(value).getSymbol()?.getName() !== "RegExp" &&
            (isPlainObject(value) || isWrapper(value)) &&
            !(name.text.startsWith("pad") && position === 1)),
      )
    );
  };
  // The call that an error is at: at an argument, a function expression's name or keyword, or the
  // method's name.
  const getErroredCall = (diagnostic: ts.Diagnostic) => {
    const start = diagnostic.start ?? 0;
    const end = start + (diagnostic.length ?? 0);
    const isSpan = (inner: ts.Node | undefined) =>
      inner !== undefined && inner.getStart() === start && inner.getEnd() === end;
    return ts.findAncestor(
      getNode(start),
      (ancestor): ancestor is ts.CallExpression | ts.NewExpression =>
        (ts.isCallExpression(ancestor) || ts.isNewExpression(ancestor)) &&
        ((ts.isPropertyAccessExpression(ancestor.expression) && isSpan(ancestor.expression.name)) ||
          (ancestor.arguments ?? []).some(
            (value) =>
              isSpan(value) ||
              (ts.isFunctionExpression(value) &&
                isSpan(
                  value.name ??
                    value
                      .getChildren()
                      .find((child) => child.kind === ts.SyntaxKind.FunctionKeyword),
                )),
          )),
    );
  };
  // A value inside an argument of a call or a new of a Temporal function, outside the functions
  // that the argument makes, as an options object whose strings TypeScript widens past the types it
  // declares. tla-ts's Temporal reads each argument as the function does, whatever its type.
  const isTemporalArgument = (diagnostic: ts.Diagnostic) => {
    const node = getNode(diagnostic.start ?? 0);
    const call = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.CallExpression | ts.NewExpression =>
        (ts.isCallExpression(ancestor) || ts.isNewExpression(ancestor)) &&
        (ancestor.arguments ?? []).some(
          (value) => value.getStart() <= node.getStart() && node.getEnd() <= value.getEnd(),
        ),
    );
    const callee = call === undefined ? undefined : skipParentheses(call.expression);
    const isInFunction =
      ts.findAncestor(node, (ancestor) => ancestor === call || ts.isFunctionLike(ancestor)) !==
      call;
    const symbol =
      callee === undefined
        ? undefined
        : checker.getSymbolAtLocation(ts.isPropertyAccessExpression(callee) ? callee.name : callee);
    const declarations = symbol?.declarations ?? [];
    return (
      call !== undefined &&
      !isInFunction &&
      !(call.arguments ?? []).some(ts.isSpreadElement) &&
      declarations.length > 0 &&
      declarations.every(
        (declaration) =>
          declaration.getSourceFile().isDeclarationFile &&
          ts.findAncestor(
            declaration,
            (ancestor) =>
              ts.isModuleDeclaration(ancestor) && ancestor.name.getText() === "Temporal",
          ) !== undefined,
      )
    );
  };
  // A null or an undefined that a call passes to a built-in that NULLISH_TAKING_BUILT_INS lists,
  // which the error is at.
  const isNullishBuiltInCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    const value = call?.arguments?.find(
      (argument) =>
        argument.getStart() === diagnostic.start &&
        argument.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0),
    );
    return (
      call !== undefined &&
      value !== undefined &&
      !(call.arguments ?? []).some(ts.isSpreadElement) &&
      isEveryType(value, ts.TypeFlags.Null | ts.TypeFlags.Undefined) &&
      NULLISH_TAKING_BUILT_INS.has(getBuiltInName(call) ?? "")
    );
  };
  // A new of a typed array's constructor, which tla-ts runs on its arguments' values: it converts
  // a length, an offset, and an object's elements as the constructor does, reads a
  // SharedArrayBuffer as an ArrayBuffer, and stops where it can't.
  const isTypedArrayNew = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    if (call === undefined || !ts.isNewExpression(call)) return false;
    const type = checker.getTypeAtLocation(call.expression);
    return (
      (call.arguments ?? []).length <= 3 &&
      !(call.arguments ?? []).some(ts.isSpreadElement) &&
      (type.isUnion() ? type.types : [type]).every((member) =>
        /^(Big)?(Int|Uint|Float)\d+(Clamped)?ArrayConstructor$/.test(
          member.getSymbol()?.getName() ?? "",
        ),
      )
    );
  };
  // Object.fromEntries of a name whose type has an iterator, which TypeScript rejects where the
  // iterator's values aren't typed as entries. tla-ts steps the iterator and reads each entry as
  // AddEntriesFromIterable does.
  const isIteratedEntriesCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    const argument = call?.arguments?.[0];
    return (
      call !== undefined &&
      ts.isCallExpression(call) &&
      call.expression.getText() === "Object.fromEntries" &&
      call.arguments.length === 1 &&
      argument !== undefined &&
      ts.isIdentifier(argument) &&
      checker
        .getTypeAtLocation(argument)
        .getProperties()
        .some((property) => property.name.startsWith("__@iterator"))
    );
  };
  // A promise combinator's call of a value other than an iterable, which tla-ts iterates as the
  // combinator does: it rejects the promise where the value isn't an object or its iterator throws.
  // The error is at the value or in it, such as at an object literal's iterator method, where
  // no call is nearer.
  const isCombinedCall = (diagnostic: ts.Diagnostic) => {
    const node = getNode(diagnostic.start ?? 0);
    const nearest = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.CallExpression | ts.NewExpression =>
        ts.isCallExpression(ancestor) || ts.isNewExpression(ancestor),
    );
    const call =
      getErroredCall(diagnostic) ??
      (nearest?.arguments?.some(
        (value) => value.getStart() <= node.getStart() && node.getEnd() <= value.getEnd(),
      )
        ? nearest
        : undefined);
    return (
      call !== undefined &&
      ts.isCallExpression(call) &&
      ts.isPropertyAccessExpression(call.expression) &&
      ts.isIdentifier(call.expression.expression) &&
      call.expression.expression.text === "Promise" &&
      isGlobal(call.expression.expression) &&
      PROMISE_COMBINATORS.has(call.expression.name.text) &&
      call.arguments.length === 1 &&
      !ts.isSpreadElement(call.arguments[0])
    );
  };
  // A call of Atomics' function, which tla-ts runs on its arguments' values as the function does:
  // it throws where the first isn't a typed array of an element type that the function takes,
  // converts the others, and stops where it can't.
  const isAtomicsCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    return (
      call !== undefined &&
      ts.isCallExpression(call) &&
      ts.isPropertyAccessExpression(call.expression) &&
      ts.isIdentifier(call.expression.expression) &&
      call.expression.expression.text === "Atomics" &&
      isGlobal(call.expression.expression) &&
      !call.arguments.some(ts.isSpreadElement)
    );
  };
  // A call of an array's concat of values other than arrays, which tla-ts adds as concat does: it
  // spreads an array or an object that Symbol.isConcatSpreadable marks, and adds any other value.
  const isConcatCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    return (
      call !== undefined &&
      ts.isCallExpression(call) &&
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.name.text === "concat" &&
      checker.isArrayType(checker.getTypeAtLocation(call.expression.expression)) &&
      !call.arguments.some(ts.isSpreadElement)
    );
  };
  // A call of bind, call, or apply on a function that the test declares with a this, which
  // passes null or undefined for the this. tla-ts gives the function that this, or the global
  // object where the function isn't strict, as JavaScript does.
  const isNullThisCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    const callee = call?.expression;
    const thisArgument = call?.arguments?.[0];
    const declarations =
      callee !== undefined && ts.isPropertyAccessExpression(callee)
        ? checker
            .getTypeAtLocation(callee.expression)
            .getCallSignatures()
            .map((signature) => signature.getDeclaration())
        : [];
    return (
      call !== undefined &&
      ts.isCallExpression(call) &&
      callee !== undefined &&
      ts.isPropertyAccessExpression(callee) &&
      ["bind", "call", "apply"].includes(callee.name.text) &&
      thisArgument !== undefined &&
      diagnostic.start === thisArgument.getStart() &&
      (thisArgument.kind === ts.SyntaxKind.NullKeyword ||
        (ts.isIdentifier(thisArgument) &&
          thisArgument.text === "undefined" &&
          isGlobal(thisArgument))) &&
      declarations.length > 0 &&
      declarations.every(
        (declaration) =>
          declaration.getSourceFile() === sourceFile &&
          declaration.parameters[0]?.name.getText() === "this",
      )
    );
  };
  // A call of Object.keys, Object.values, or Object.entries of an object, null, or undefined, which
  // tla-ts reads as the function does: it throws where the value is null or undefined.
  const isOwnKeysCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    const argument = call?.arguments?.[0];
    return (
      call !== undefined &&
      ts.isCallExpression(call) &&
      ts.isPropertyAccessExpression(call.expression) &&
      ts.isIdentifier(call.expression.expression) &&
      call.expression.expression.text === "Object" &&
      isGlobal(call.expression.expression) &&
      ["keys", "values", "entries"].includes(call.expression.name.text) &&
      call.arguments.length === 1 &&
      argument !== undefined &&
      !ts.isSpreadElement(argument) &&
      isEveryType(
        argument,
        ts.TypeFlags.Object |
          ts.TypeFlags.NonPrimitive |
          ts.TypeFlags.Null |
          ts.TypeFlags.Undefined,
      )
    );
  };
  // A call of a typed array's method that TYPED_ARRAY_CALLBACK_METHODS lists, directly or through
  // call, whose callback is a function that the test writes and that takes each value the method
  // passes it, an element, an index, and the array, but returns another type than the method's
  // signature does, or declares a this.
  const isTypedArrayCallback = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    if (call === undefined || !ts.isCallExpression(call)) return false;
    const callee = skipParentheses(call.expression);
    const isCall = ts.isPropertyAccessExpression(callee) && callee.name.text === "call";
    const method = isCall ? skipParentheses(callee.expression) : callee;
    const callback = call.arguments[isCall ? 1 : 0];
    if (callback === undefined || call.arguments.some(ts.isSpreadElement)) return false;
    const declaration = ts.isIdentifier(callback)
      ? checker.getSymbolAtLocation(callback)?.valueDeclaration
      : callback;
    const written =
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer !== undefined
        ? skipParentheses(declaration.initializer)
        : declaration;
    if (
      written === undefined ||
      written.getSourceFile() !== sourceFile ||
      !(
        ts.isFunctionDeclaration(written) ||
        ts.isFunctionExpression(written) ||
        ts.isArrowFunction(written)
      ) ||
      written.parameters.some(
        (parameter) => parameter.dotDotDotToken !== undefined || !ts.isIdentifier(parameter.name),
      )
    ) {
      return false;
    }
    const parameters = written.parameters.filter(
      (parameter) => !(ts.isIdentifier(parameter.name) && parameter.name.text === "this"),
    );
    return checker
      .getSignaturesOfType(checker.getTypeAtLocation(method), ts.SignatureKind.Call)
      .some((signature) => {
        const declared = signature.getDeclaration();
        const taken = signature.parameters[0];
        return (
          declared.getSourceFile().isDeclarationFile &&
          ts.isMethodSignature(declared) &&
          TYPED_ARRAY_CALLBACK_METHODS.has(declared.name.getText()) &&
          ts.isInterfaceDeclaration(declared.parent) &&
          TYPED_ARRAY_NAME.test(declared.parent.name.text) &&
          taken !== undefined &&
          checker
            .getSignaturesOfType(checker.getTypeOfSymbol(taken), ts.SignatureKind.Call)
            .every(
              (passed) =>
                parameters.length <= passed.parameters.length &&
                parameters.every((parameter, position) =>
                  checker.isTypeAssignableTo(
                    checker.getTypeOfSymbol(passed.parameters[position]),
                    checker.getTypeAtLocation(parameter),
                  ),
                ),
            )
        );
      });
  };
  // A call of an array's method that SEARCHING_METHODS lists, of any value to search for and an
  // index to search from that tla-ts converts: a primitive, an object that the test declares, or a
  // wrapper.
  const isSearchingCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    return (
      call !== undefined &&
      ts.isCallExpression(call) &&
      ts.isPropertyAccessExpression(call.expression) &&
      SEARCHING_METHODS.has(call.expression.name.text) &&
      checker.isArrayType(checker.getTypeAtLocation(call.expression.expression)) &&
      call.arguments.length <= 2 &&
      !call.arguments.some(ts.isSpreadElement) &&
      call.arguments
        .slice(1)
        .every(
          (value) =>
            isEveryType(
              value,
              ts.TypeFlags.NumberLike |
                ts.TypeFlags.StringLike |
                ts.TypeFlags.BooleanLike |
                ts.TypeFlags.Null |
                ts.TypeFlags.Undefined,
            ) ||
            isPlainObject(value) ||
            isWrapper(value),
        )
    );
  };
  // A call of a method that SEARCHING_METHODS lists on an array or a typed array, without arguments,
  // which searches for undefined. TypeScript reports it at the method's name.
  const isShortSearchingCall = (node: ts.Node) => {
    const callee = node.parent;
    return (
      ts.isPropertyAccessExpression(callee) &&
      callee.name === node &&
      SEARCHING_METHODS.has(callee.name.text) &&
      ts.isCallExpression(callee.parent) &&
      callee.parent.expression === callee &&
      callee.parent.arguments.length === 0 &&
      ["Array", "TypedArray"].includes(
        getIndexedKind(checker.getTypeAtLocation(callee.expression), checker) ?? "",
      )
    );
  };
  // A call of a method that INDEX_PARAMETERS lists, with a primitive other than a BigInt for an index
  // that it converts, which the error is at. tla-ts throws the TypeError of a symbol where nothing
  // runs before, and stops otherwise.
  const isIndexCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    if (
      call === undefined ||
      !ts.isCallExpression(call) ||
      !ts.isPropertyAccessExpression(call.expression) ||
      call.arguments.some(ts.isSpreadElement)
    ) {
      return false;
    }
    const receiver = checker.getTypeAtLocation(call.expression.expression);
    const kind = getIndexedKind(receiver, checker);
    const positions = kind && INDEX_PARAMETERS.get(kind)?.get(call.expression.name.text);
    const position = call.arguments.findIndex(
      (value) =>
        value.getStart() === diagnostic.start &&
        value.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0),
    );
    // A typed array's search compares a value of another type by SameValueZero or ===, which no
    // element equals.
    const isSearched =
      kind === "TypedArray" && SEARCHING_METHODS.has(call.expression.name.text) && position === 0;
    // A DataView's method converts littleEndian, its last argument, with ToBoolean, which runs
    // nothing, whatever its type.
    const isLittleEndian =
      kind === "DataView" &&
      positions !== undefined &&
      position === (call.expression.name.text.startsWith("get") ? 1 : 2);
    const primitives =
      ts.TypeFlags.NumberLike |
      ts.TypeFlags.StringLike |
      ts.TypeFlags.BooleanLike |
      ts.TypeFlags.Null |
      ts.TypeFlags.Undefined;
    return (
      isLittleEndian ||
      (isSearched && isEveryType(call.arguments[position], primitives)) ||
      (positions !== undefined &&
        positions.includes(position) &&
        isEveryType(call.arguments[position], primitives | ts.TypeFlags.ESSymbolLike))
    );
  };
  // A value that a Date setter or a DataView converts to a number: a primitive, an object that the
  // test declares, or a wrapper.
  const isConvertedNumber = (value: ts.Expression) =>
    isEveryType(
      value,
      ts.TypeFlags.NumberLike |
        ts.TypeFlags.StringLike |
        ts.TypeFlags.BooleanLike |
        ts.TypeFlags.BigIntLike |
        ts.TypeFlags.Null |
        ts.TypeFlags.Undefined,
    ) ||
    isPlainObject(value) ||
    isWrapper(value);
  // A call of a method that DATE_SETTER_NAME or VIEW_ACCESSOR_NAME matches, on a Date or a DataView,
  // or through call on Date.prototype's or DataView.prototype's method, which a statement runs
  // where it's a Date's, whose arguments isConvertedNumber takes, or that passes too few. tla-ts
  // converts them, and undefined for a Date setter called without any, and stops where it can't,
  // such as on a symbol for a Date or a littleEndian that isn't a literal.
  const isNumberConvertingCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    if (
      call === undefined ||
      !ts.isCallExpression(call) ||
      !ts.isPropertyAccessExpression(call.expression) ||
      call.arguments.some(ts.isSpreadElement)
    ) {
      return false;
    }
    const callee = call.expression;
    const isCall = callee.name.text === "call";
    // The method that a call through call runs: Date.prototype's or DataView.prototype's, or a
    // variable's that the test never assigns again.
    const getPrototypeMethod = (node: ts.Expression) => {
      const symbol = ts.isIdentifier(node) ? checker.getSymbolAtLocation(node) : undefined;
      const declaration = symbol?.valueDeclaration;
      const isAssigned = (inner: ts.Node): boolean =>
        (ts.isBinaryExpression(inner) &&
          ts.isAssignmentOperator(inner.operatorToken.kind) &&
          checker.getSymbolAtLocation(skipParentheses(inner.left)) === symbol) ||
        (ts.forEachChild(inner, isAssigned) ?? false);
      const value =
        declaration !== undefined && ts.isVariableDeclaration(declaration)
          ? isAssigned(sourceFile)
            ? undefined
            : declaration.initializer
          : node;
      const match =
        value !== undefined &&
        /^(Date|DataView)\.prototype\.(\w+)$/.exec(skipParentheses(value).getText());
      return match ? { owner: match[1], method: match[2] } : undefined;
    };
    const target = isCall
      ? getPrototypeMethod(callee.expression)
      : {
          owner: checker.getTypeAtLocation(callee.expression).getSymbol()?.getName(),
          method: callee.name.text,
        };
    const values = isCall ? call.arguments.slice(1) : call.arguments;
    return (
      target !== undefined &&
      ((target.owner === "Date" &&
        DATE_SETTER_NAME.test(target.method) &&
        (!isCall || ts.isExpressionStatement(call.parent))) ||
        (target.owner === "DataView" && VIEW_ACCESSOR_NAME.test(target.method))) &&
      values.every(isConvertedNumber)
    );
  };
  // A call of a typed array's subarray, whose begin and end isConvertedNumber takes. tla-ts converts
  // them in turn after it reads the typed array's length, and makes its typed array after them.
  const isSubarrayCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    return (
      call !== undefined &&
      ts.isCallExpression(call) &&
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.name.text === "subarray" &&
      call.arguments.length <= 2 &&
      !call.arguments.some(ts.isSpreadElement) &&
      checker
        .getSignaturesOfType(checker.getTypeAtLocation(call.expression), ts.SignatureKind.Call)
        .every((signature) => {
          const declared = signature.getDeclaration();
          return (
            declared.getSourceFile().isDeclarationFile &&
            ts.isInterfaceDeclaration(declared.parent) &&
            TYPED_ARRAY_NAME.test(declared.parent.name.text)
          );
        }) &&
      call.arguments.every(isConvertedNumber)
    );
  };
  // A new of DataView, at its byteOffset or byteLength, which isConvertedNumber takes. tla-ts
  // converts them in turn with ToIndex, and throws the errors of its buffer between them as Node
  // does.
  const isDataViewNew = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    const values = call?.arguments ?? [];
    const position = values.findIndex(
      (value) =>
        value.getStart() === diagnostic.start &&
        value.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0),
    );
    return (
      call !== undefined &&
      ts.isNewExpression(call) &&
      ts.isIdentifier(call.expression) &&
      call.expression.text === "DataView" &&
      isGlobal(call.expression) &&
      values.length <= 3 &&
      !values.some(ts.isSpreadElement) &&
      position >= 1 &&
      values.slice(1).every(isConvertedNumber)
    );
  };
  // A call of a Set's method that SET_LIKE_METHODS lists, of an array, which the error is at.
  // tla-ts throws GetSetRecord's TypeError where the test gives nothing a size, and stops otherwise.
  const isSetLikeArrayCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    const value = call?.arguments?.[0];
    return (
      call !== undefined &&
      ts.isCallExpression(call) &&
      ts.isPropertyAccessExpression(call.expression) &&
      SET_LIKE_METHODS.has(call.expression.name.text) &&
      checker.getTypeAtLocation(call.expression.expression).getSymbol()?.getName() === "Set" &&
      call.arguments.length === 1 &&
      value !== undefined &&
      value.getStart() === diagnostic.start &&
      checker.isArrayType(checker.getTypeAtLocation(value))
    );
  };
  // An error in the template object of a call of String.raw, which tla-ts reads as it is, as
  // String.raw reads any object, throwing the TypeErrors of its steps and stopping where it would
  // run a getter or convert an object.
  const isRawTemplate = (diagnostic: ts.Diagnostic) => {
    const start = diagnostic.start ?? 0;
    const call = ts.findAncestor(getNode(start), ts.isCallExpression);
    const template = call?.arguments[0];
    return (
      call !== undefined &&
      template !== undefined &&
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.name.text === "raw" &&
      ts.isIdentifier(call.expression.expression) &&
      call.expression.expression.text === "String" &&
      isGlobal(call.expression.expression) &&
      template.getStart() <= start &&
      start + (diagnostic.length ?? 0) <= template.getEnd()
    );
  };
  // A call of a method of RegExp.prototype that PROTOCOL_METHODS lists, on a regexp, as
  // rx[Symbol.search](s), or through call, as RegExp.prototype[Symbol.search].call(rx, s).
  // The method of a protocol call, under the well-known symbol that names it.
  const getProtocolMethod = (node: ts.CallExpression) => {
    const callee = node.expression;
    const isCall = ts.isPropertyAccessExpression(callee) && callee.name.text === "call";
    const method = isCall ? callee.expression : callee;
    if (!ts.isElementAccessExpression(method)) return undefined;
    const owner = method.expression;
    const key = method.argumentExpression;
    const isOwned = isCall
      ? ts.isPropertyAccessExpression(owner) &&
        ts.isIdentifier(owner.expression) &&
        owner.expression.text === "RegExp" &&
        isGlobal(owner.expression) &&
        owner.name.text === "prototype"
      : checker.getTypeAtLocation(owner).getSymbol()?.getName() === "RegExp";
    return isOwned &&
      ts.isPropertyAccessExpression(key) &&
      ts.isIdentifier(key.expression) &&
      key.expression.text === "Symbol" &&
      isGlobal(key.expression) &&
      PROTOCOL_METHODS.has(key.name.text) &&
      !node.arguments.some(ts.isSpreadElement)
      ? key.name.text
      : undefined;
  };
  const isProtocolCall = (node: ts.Node): node is ts.CallExpression =>
    ts.isCallExpression(node) && getProtocolMethod(node) !== undefined;
  // A protocol call that leaves out the receiver, the string, or replace's replaceValue, which are
  // then undefined, as they are in JavaScript. TypeScript reports it at call's name, or at the
  // method of a regexp, which tla-ts runs as its steps where it has no string or no replaceValue.
  const isShortProtocolCall = (node: ts.Node, diagnostic: ts.Diagnostic) => {
    const call = ts.findAncestor(node, ts.isCallExpression);
    const callee = call?.expression;
    const isCall =
      callee !== undefined && ts.isPropertyAccessExpression(callee) && callee.name.text === "call";
    const reported = isCall ? callee.name : callee;
    return (
      call !== undefined &&
      reported !== undefined &&
      reported.getStart() === diagnostic.start &&
      reported.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0) &&
      isProtocolCall(call) &&
      (isCall ||
        call.arguments.length === 0 ||
        (call.arguments.length === 1 && getProtocolMethod(call) === "replace"))
    );
  };
  // A protocol call of a value of another type than the string or the limit: tla-ts converts the
  // string with ToString, running a toString or a Symbol.toPrimitive that the test writes, split's
  // limit with ToUint32, throwing a TypeError on a symbol and stopping on another value that isn't
  // a number, and replace's replaceValue, or what its function returns, with ToString.
  const isConvertedProtocolCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    return call !== undefined && isProtocolCall(call);
  };
  // A function that a test assigns to a regexp's exec, which returns a value of another type than
  // RegExpExecArray or null. tla-ts calls it where a protocol method that PROTOCOL_METHODS lists
  // runs RegExpExec, which throws a TypeError on a result that isn't an object or null and reads
  // the rest through Get, and stops where a built-in method reads a regexp whose exec a script
  // changed. TypeScript reports it at the assignment's target.
  const isWrittenExec = (node: ts.Node, diagnostic: ts.Diagnostic) => {
    const target = ts.findAncestor(node, ts.isPropertyAccessExpression);
    const assignment = target?.parent;
    return (
      target !== undefined &&
      assignment !== undefined &&
      target.getStart() === diagnostic.start &&
      target.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0) &&
      target.name.text === "exec" &&
      checker.getTypeAtLocation(target.expression).getSymbol()?.getName() === "RegExp" &&
      ts.isBinaryExpression(assignment) &&
      assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      assignment.left === target &&
      (ts.isFunctionExpression(assignment.right) || ts.isArrowFunction(assignment.right))
    );
  };
  // A call of an array's method that REDUCING_METHODS lists, whose reducer is a function that the
  // test writes and that takes each value it gets: the initial value, an element, or what it
  // returns as the accumulator, then an element, an index, and the array. The call's result, which
  // may be what the reducer returns, is discarded or taken as unknown.
  const isReducingCall = (diagnostic: ts.Diagnostic) => {
    const call = getErroredCall(diagnostic);
    if (
      call === undefined ||
      !ts.isCallExpression(call) ||
      !ts.isPropertyAccessExpression(call.expression) ||
      !REDUCING_METHODS.has(call.expression.name.text) ||
      call.arguments.length < 1 ||
      call.arguments.length > 2
    ) {
      return false;
    }
    const array = checker.getTypeAtLocation(call.expression.expression);
    const element = checker.getIndexTypeOfType(array, ts.IndexKind.Number);
    const reducer = call.arguments[0];
    const declaration = ts.isIdentifier(reducer)
      ? checker.getSymbolAtLocation(reducer)?.valueDeclaration
      : reducer;
    const signatures = checker.getSignaturesOfType(
      checker.getTypeAtLocation(reducer),
      ts.SignatureKind.Call,
    );
    const contextual = checker.getContextualType(call);
    if (
      !checker.isArrayType(array) ||
      element === undefined ||
      declaration === undefined ||
      declaration.getSourceFile() !== sourceFile ||
      !(
        ts.isFunctionDeclaration(declaration) ||
        ts.isFunctionExpression(declaration) ||
        ts.isArrowFunction(declaration)
      ) ||
      signatures.length !== 1 ||
      !(
        ts.isExpressionStatement(call.parent) ||
        (contextual !== undefined && (contextual.flags & ts.TypeFlags.Unknown) !== 0)
      )
    ) {
      return false;
    }
    const signature = signatures[0];
    const returned = signature.getReturnType();
    const accumulators = [
      (returned.flags & ts.TypeFlags.Void) === 0 ? returned : checker.getUndefinedType(),
      call.arguments.length === 2 ? checker.getTypeAtLocation(call.arguments[1]) : element,
    ];
    const taken = [accumulators, [element], [checker.getNumberType()], [array]];
    return (
      signature.parameters.length <= taken.length &&
      declaration.parameters.every((parameter) => parameter.dotDotDotToken === undefined) &&
      signature.parameters.every((parameter, position) =>
        taken[position].every((type) =>
          checker.isTypeAssignableTo(type, checker.getTypeOfSymbol(parameter)),
        ),
      )
    );
  };
  // A call of a key of type unknown, as (object as unknown as { [key: string]: unknown }).slice(0)
  // calls, where the test stores String.prototype's method of the key's name as a value, writes no
  // function of its own under the key, and passes primitives that the method converts. tla-ts runs
  // the method on the object.
  const isStoredStringCall = (node: ts.Node) => {
    const access = node.parent;
    const call = access.parent;
    if (
      !ts.isPropertyAccessExpression(access) ||
      access.expression !== node ||
      !ts.isCallExpression(call) ||
      call.expression !== access
    ) {
      return false;
    }
    const name = access.name.text;
    const parameters = STRING_METHODS.get(name)?.parameters;
    const nodes: ts.Node[] = [];
    const collect = (inner: ts.Node) => {
      nodes.push(inner);
      ts.forEachChild(inner, collect);
    };
    collect(sourceFile);
    const isStored = nodes.some(
      (inner) =>
        ts.isPropertyAccessExpression(inner) &&
        inner.name.text === name &&
        inner.expression.getText() === "String.prototype" &&
        !(ts.isPropertyAccessExpression(inner.parent) && inner.parent.expression === inner) &&
        !(ts.isCallExpression(inner.parent) && inner.parent.expression === inner),
    );
    const isWritten = nodes.some(
      (inner) =>
        ((ts.isMethodDeclaration(inner) || ts.isPropertyAssignment(inner)) &&
          inner.name.getText() === name) ||
        (ts.isBinaryExpression(inner) &&
          inner.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isPropertyAccessExpression(inner.left) &&
          inner.left.name.text === name &&
          (ts.isFunctionExpression(inner.right) || ts.isArrowFunction(inner.right))),
    );
    return (
      parameters !== undefined &&
      isStored &&
      !isWritten &&
      call.arguments.length <= parameters.length &&
      call.arguments.every((value, position) => isPrimitiveArgument(value, parameters[position]))
    );
  };
  // A write of an object's iterator method that returns what an iterator's type doesn't allow, as
  // an iterator whose next gives no result. tla-ts calls the method as Node does.
  const isIteratorWrite = (node: ts.Node) => {
    const access = ts.findAncestor(node, ts.isElementAccessExpression);
    return (
      access !== undefined &&
      access.argumentExpression.getText() === "Symbol.iterator" &&
      ts.isBinaryExpression(access.parent) &&
      access.parent.left === access &&
      access.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
    );
  };
  // A delete of Array.prototype's iterator method, after which an array pattern's GetIterator
  // throws a TypeError, as tla-ts throws where the method is undefined.
  const isDeletedIterator = (node: ts.Node) => {
    const access = ts.findAncestor(node, ts.isElementAccessExpression);
    return (
      access !== undefined &&
      access.argumentExpression.getText() === "Symbol.iterator" &&
      access.expression.getText() === "Array.prototype" &&
      ts.isDeleteExpression(access.parent)
    );
  };
  // A member of a class that extends Iterator, which the member's own type types, whatever the
  // type of Iterator's member, as an iterator that the test writes to throw or misbehave does.
  const isIteratorMember = (node: ts.Node) => {
    const member = ts.findAncestor(node, ts.isClassElement);
    const heritage = member?.parent.heritageClauses?.[0]?.types[0];
    return (
      member !== undefined &&
      member.name !== undefined &&
      member.name.getStart() <= node.getStart() &&
      node.getEnd() <= member.name.getEnd() &&
      member.parent.heritageClauses?.[0]?.token === ts.SyntaxKind.ExtendsKeyword &&
      heritage !== undefined &&
      isGlobalIterator(heritage.expression, checker)
    );
  };
  // A class that extends Iterator without a next, which Iterator types as abstract but doesn't have.
  const isIteratorClass = (node: ts.Node) => {
    const declaration = ts.findAncestor(node, ts.isClassLike);
    const heritage = declaration?.heritageClauses?.[0];
    return (
      heritage !== undefined &&
      heritage.token === ts.SyntaxKind.ExtendsKeyword &&
      node.getEnd() <= heritage.getStart() &&
      isGlobalIterator(heritage.types[0].expression, checker)
    );
  };
  // A call that spreads arguments into a function or a method that the script declares without
  // parameters, or into a superclass's constructor without them, directly or, for a function
  // expression, through apply. It reads them only through its arguments object, which takes any
  // values.
  const isUntypedSpreadCall = (node: ts.Node) => {
    const call = ts.findAncestor(node, ts.isCallExpression);
    if (call === undefined || node.getStart() < call.arguments.pos) return false;
    const callee = skipParentheses(call.expression);
    const isApply =
      ts.isPropertyAccessExpression(callee) &&
      callee.name.text === "apply" &&
      call.arguments.length === 2;
    const called = isApply ? skipParentheses(callee.expression) : callee;
    const spread = isApply ? call.arguments[1] : call;
    const elements = ts.isArrayLiteralExpression(spread)
      ? spread.elements
      : ts.isCallExpression(spread)
        ? spread.arguments
        : [];
    // super calls the constructor of the class that the class extends.
    const declaration =
      isApply || ts.isFunctionExpression(called)
        ? called
        : checker.getResolvedSignature(call)?.declaration;
    return (
      declaration !== undefined &&
      (ts.isFunctionExpression(declaration) ||
        ts.isFunctionDeclaration(declaration) ||
        ts.isMethodDeclaration(declaration) ||
        ts.isConstructorDeclaration(declaration)) &&
      declaration.body !== undefined &&
      declaration.parameters.length === 0 &&
      elements.some(ts.isSpreadElement)
    );
  };
  // A call of a method that TYPED_UNION_METHODS lists on a union of typed arrays, which TypeScript
  // reports at the method's name.
  const isTypedUnionCall = (node: ts.Node, diagnostic: ts.Diagnostic) => {
    const callee = node.parent;
    const type = ts.isPropertyAccessExpression(callee)
      ? checker.getTypeAtLocation(callee.expression)
      : undefined;
    return (
      ts.isPropertyAccessExpression(callee) &&
      type !== undefined &&
      callee.name === node &&
      node.getStart() === diagnostic.start &&
      node.getEnd() === (diagnostic.start ?? 0) + (diagnostic.length ?? 0) &&
      ts.isCallExpression(callee.parent) &&
      callee.parent.expression === callee &&
      TYPED_UNION_METHODS.has(callee.name.text) &&
      type.isUnion() &&
      type.types.every((member) => TYPED_ARRAY_NAME.test(member.getSymbol()?.getName() ?? ""))
    );
  };
  const isPlainCall = (node: ts.Node) => {
    const callee = ts.findAncestor(
      node,
      (ancestor) => !ts.isParenthesizedExpression(ancestor.parent),
    );
    return (
      callee !== undefined &&
      ts.isCallExpression(callee.parent) &&
      callee.parent.expression === callee &&
      (ts.isIdentifier(ts.skipParentheses(callee)) ||
        ts.isFunctionExpression(ts.skipParentheses(callee)))
    );
  };
  // An assignment of an object literal to a function's or a class's caller or an arguments
  // object's callee, which the test makes to check that it throws. tla-ts throws the TypeError that JavaScript does
  // where the property is %ThrowTypeError% or isn't writable.
  const isRestrictedWrite = (node: ts.Node) => {
    const write = ts.findAncestor(node, ts.isBinaryExpression);
    const target = write?.left;
    return (
      write !== undefined &&
      target !== undefined &&
      ts.isPropertyAccessExpression(target) &&
      target.getStart() === node.getStart() &&
      write.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isObjectLiteralExpression(write.right) &&
      ((target.name.text === "caller" &&
        [ts.SignatureKind.Call, ts.SignatureKind.Construct].some(
          (kind) =>
            checker.getSignaturesOfType(checker.getTypeAtLocation(target.expression), kind).length >
            0,
        )) ||
        (target.name.text === "callee" &&
          checker.getTypeAtLocation(target.expression).getSymbol()?.name === "IArguments"))
    );
  };
  const isSound = (diagnostic: ts.Diagnostic) => {
    const node = getNode(diagnostic.start ?? 0);
    return (
      (diagnostic.code === UNTYPED_THIS_ERROR && isPlainCall(node)) ||
      (SHORT_CALL_ERRORS.has(diagnostic.code) &&
        (isMiscountedBuiltInCall(node, diagnostic) ||
          isReceiverlessCall(node) ||
          isShortPatternCall(node))) ||
      (diagnostic.code === ARGUMENT_COUNT_ERROR &&
        (isShortReducingCall(node) ||
          isShortSearchingCall(node) ||
          isNumberConvertingCall(diagnostic))) ||
      (SHORT_CALL_ERRORS.has(diagnostic.code) && isShortProtocolCall(node, diagnostic)) ||
      (diagnostic.code === MISSING_PROPERTY_ERROR && isPatternRead(node)) ||
      ((diagnostic.code === NOT_ITERABLE_ERROR || NULLABLE_ERRORS.has(diagnostic.code)) &&
        isNullableArrayPattern(node)) ||
      (diagnostic.code === NOT_ITERABLE_ERROR && isCaughtArrayPattern(node)) ||
      (diagnostic.code === MISSING_ELEMENT_ERROR && isMissingElement(node)) ||
      (diagnostic.code === UNASSIGNED_READ_ERROR &&
        (isCaughtRead(node) ||
          isVarRead(node) ||
          isLaterGeneratorRead(node) ||
          getCallbackWrites(checker, node) !== undefined)) ||
      ((diagnostic.code === NOT_ITERABLE_ERROR || NULLABLE_ERRORS.has(diagnostic.code)) &&
        isTypeErrorPattern(node)) ||
      ((UNASSIGNABLE_ERRORS.has(diagnostic.code) || diagnostic.code === MISSING_MEMBERS_ERROR) &&
        isPatternArgument(node)) ||
      (diagnostic.code === 2322 && isIteratorWrite(node)) ||
      (diagnostic.code === MISSING_MEMBERS_ERROR && isRestrictedWrite(node)) ||
      (diagnostic.code === OPTIONAL_DELETE_ERROR && isDeletedIterator(node)) ||
      (diagnostic.code === 2322 && isWrittenExec(node, diagnostic)) ||
      (BASE_MEMBER_ERRORS.has(diagnostic.code) && isIteratorMember(node)) ||
      (ABSTRACT_MEMBER_ERRORS.has(diagnostic.code) && isIteratorClass(node)) ||
      (diagnostic.code === GETTER_RETURN_ERROR &&
        isVoidGetter(ts.findAncestor(node, ts.isGetAccessorDeclaration))) ||
      (COMPUTED_MEMBER_ERRORS.has(diagnostic.code) &&
        ts.findAncestor(node, ts.isComputedPropertyName) !== undefined) ||
      (SPREAD_CALL_ERRORS.has(diagnostic.code) && isUntypedSpreadCall(node)) ||
      (CONVERTED_ARGUMENT_ERRORS.has(diagnostic.code) &&
        (isConvertedCall(diagnostic) ||
          isConvertedProtocolCall(diagnostic) ||
          isReducingCall(diagnostic) ||
          isSearchingCall(diagnostic) ||
          (diagnostic.code === 2769 && isCombinedCall(diagnostic)) ||
          isAtomicsCall(diagnostic) ||
          isOwnKeysCall(diagnostic) ||
          isNullThisCall(diagnostic) ||
          isConcatCall(diagnostic) ||
          isIndexCall(diagnostic) ||
          isNumberConvertingCall(diagnostic) ||
          isDataViewNew(diagnostic) ||
          isSubarrayCall(diagnostic) ||
          isSetLikeArrayCall(diagnostic) ||
          isTypedArrayCallback(diagnostic) ||
          isTypedArrayNew(diagnostic) ||
          isNullishBuiltInCall(diagnostic))) ||
      (diagnostic.code === NO_OVERLOAD_ERROR && isIteratedEntriesCall(diagnostic)) ||
      (TEMPORAL_ARGUMENT_ERRORS.has(diagnostic.code) && isTemporalArgument(diagnostic)) ||
      USING_INITIALIZER_ERRORS.has(diagnostic.code) ||
      ((CONVERTED_ARGUMENT_ERRORS.has(diagnostic.code) || diagnostic.code === 2322) &&
        isRawTemplate(diagnostic)) ||
      (diagnostic.code === UNKNOWN_CALLEE_ERROR && isStoredStringCall(node)) ||
      (diagnostic.code === UNCALLABLE_ERROR && isTypedUnionCall(node, diagnostic)) ||
      diagnostic.code === UNUSED_OPERAND_ERROR ||
      ((diagnostic.code === UNINTENDED_COMPARISON_ERROR ||
        CONSTANT_COMPARISON_ERRORS.has(diagnostic.code)) &&
        isUnnarrowed(node, diagnostic)) ||
      (diagnostic.code === UNINTENDED_COMPARISON_ERROR && isNumberComparison(node, diagnostic)) ||
      (diagnostic.code === UNKNOWN_VALUE_ERROR &&
        (isUnknownArithmetic(node) || isConvertedUnknown(node, diagnostic))) ||
      ((diagnostic.code === UNKNOWN_VALUE_ERROR || diagnostic.code === UNKNOWN_CALLEE_ERROR) &&
        isUnknownAccess(node, diagnostic)) ||
      (UNTYPED_READ_ERRORS.has(diagnostic.code) && isObjectRead(node, diagnostic)) ||
      (diagnostic.code === NOT_ITERABLE_ERROR && isPlainObject(node)) ||
      (OPERAND_TYPE_ERRORS.has(diagnostic.code) && isConverted(node, diagnostic)) ||
      // Node may define a global that TypeScript doesn't know, such as print.
      (diagnostic.code === UNRESOLVED_NAME_ERROR &&
        ts.isIdentifier(node) &&
        !(node.text in globalThis))
    );
  };
  const getLine = (diagnostic: ts.Diagnostic) =>
    sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line;
  const diagnostics = service.getSemanticDiagnostics(file.path);
  // @ts-ignore hides each error on its line, so a line with an error that stays keeps it.
  const kept = new Set(
    diagnostics
      .filter((diagnostic) => !isSound(diagnostic))
      .map((diagnostic) => getLine(diagnostic)),
  );
  const lines = new Set(
    diagnostics
      .filter((diagnostic) => isSound(diagnostic))
      .map((diagnostic) => getLine(diagnostic))
      .filter((line) => !kept.has(line)),
  );
  const starts = [...lines]
    .map((line) => sourceFile.getPositionOfLineAndCharacter(line, 0))
    .filter((start) => {
      const node = getNode(start);
      return !(
        node.getStart() < start &&
        (ts.isStringLiteral(node) ||
          ts.isNoSubstitutionTemplateLiteral(node) ||
          ts.isTemplateLiteralToken(node) ||
          ts.isTemplateExpression(node))
      );
    });
  if (starts.length > 0) {
    applyEdits(new Map(starts.map((start) => [start, "// @ts-ignore\n"])));
  }
};

// TLC stops when a value has no TLA+ form, which only a run finds, rather than giving a different
// answer than Node.
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
// errors, such as a redeclared let.
const EARLY_ERRORS = new Set([
  2300, 2335, 2337, 2357, 2364, 2392, 2406, 2451, 2462, 2480, 2481, 2487, 2523, 2524, 2660, 2777,
  2779, 2804, 2815, 5076, 6188, 6189, 18006, 18011, 18012, 18013, 18016, 18026, 18037, 18041, 18061,
]);

const isEarlyError = (code: number) =>
  (code >= 1000 && code < 2000) || (code >= 17000 && code < 18000) || EARLY_ERRORS.has(code);

const isModuleSyntaxError = (source: string) =>
  spawnSync(process.execPath, ["--input-type=module", "--check"], { input: source }).status !== 0;

const isNodeSyntaxError = (source: string) => {
  try {
    new Script(source);
    return false;
  } catch (error) {
    return error instanceof SyntaxError;
  }
};

// A test that expects a SyntaxError passes when tla-ts rejects the program with one.
const runSyntaxTest = (id: string, source: string, metadata: Metadata): TestRun => {
  // A module is strict code, which tla-ts reads only of a file that imports or exports.
  const strict =
    metadata.flags.includes("onlyStrict") || metadata.isModule ? '"use strict";\n' : "";
  const isRejected = metadata.isModule
    ? isModuleSyntaxError(source)
    : isNodeSyntaxError(`${strict}${source}`);
  if (!isRejected) {
    return { id, outcome: "skipped", reason: "Node accepts it" };
  }
  const program = `${strict}${getHarness(metadata, source)}
${source}`;
  try {
    compile(program, "test262.ts");
  } catch (error) {
    if (!(error instanceof TlaTypeScriptError)) return getFailedRun(id, String(error));
    const codes = [...error.message.matchAll(/(?:error|message) TS(\d+):/g)].map((match) =>
      Number(match[1]),
    );
    const reason = getFirstLine(error.message);
    if (codes.some(isEarlyError) || reason.includes(" SyntaxError: ")) {
      return { id, outcome: "pass", reason: "" };
    }
    return codes.length > 0
      ? { id, outcome: "skipped", reason: `type error: ${reason}` }
      : { id, outcome: "untranslatable", reason };
  }
  return metadata.isModule || isModuleSyntaxError(source)
    ? { id, outcome: "wrong", reason: "Compiled a program with a SyntaxError" }
    : {
        id,
        outcome: "skipped",
        reason: "a SyntaxError only in scripts, and tla-ts compiles modules",
      };
};

// A script's this at its top level, and in the arrow functions there, is the global object, which
// TypeScript types as undefined, as tla-ts compiles each file as a module, so the test names it.
const nameGlobalObject = (source: string) => {
  const sourceFile = ts.createSourceFile(PROGRAM_PATH, source, ts.ScriptTarget.Latest, true);
  const starts: number[] = [];
  const visit = (node: ts.Node) => {
    if (node.kind === ts.SyntaxKind.ThisKeyword) starts.push(node.getStart(sourceFile));
    if ((ts.isFunctionLike(node) && !ts.isArrowFunction(node)) || ts.isClassLike(node)) return;
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return starts.reduceRight(
    (text, start) => `${text.slice(0, start)}globalThis${text.slice(start + "this".length)}`,
    source,
  );
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

// Runs a script that imports in Node, from its path, where import() finds the fixtures, with the
// global object of the modules it loads.
const SCRIPT_RUNNER = `const vm = require("node:vm");
const path = process.argv[1];
vm.runInThisContext(require("node:fs").readFileSync(path, "utf8"), {
  filename: path,
  importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
});`;

const getModulePath = (path: string) =>
  join(MODULE_DIRECTORY, relative(TEST262_DIRECTORY, path)).replace(/\.js$/, ".ts");

// The fixtures that a test imports, by path, each through a static import of a relative path or
// an import() of one, or undefined where a file imports statically another way, such as with
// attributes.
const getFixtures = (path: string) => {
  const fixtures = new Map<string, string>();
  const isLinked = (file: string, text: string): boolean => {
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const getImported = (specifier: ts.Expression) =>
      ts.isStringLiteralLike(specifier) && /^\.\.?\//.test(specifier.text)
        ? join(dirname(file), specifier.text)
        : undefined;
    const link = (imported: string) => {
      if (imported === path || fixtures.has(imported)) return true;
      const importedText = readFileSync(imported, "utf8");
      fixtures.set(imported, importedText);
      return isLinked(imported, importedText);
    };
    // An import() of a JavaScript file that exists links it, and Node rejects any other.
    const linksCalls = (node: ts.Node): boolean => {
      const specifier =
        ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? node.arguments.at(0)
          : undefined;
      const imported = specifier && getImported(specifier);
      return (
        (imported === undefined ||
          !imported.endsWith(".js") ||
          !existsSync(imported) ||
          link(imported)) &&
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
          existsSync(imported) &&
          statement.attributes === undefined &&
          !(
            ts.isImportDeclaration(statement) &&
            statement.importClause?.phaseModifier === ts.SyntaxKind.DeferKeyword
          ) &&
          link(imported)
        );
      })
    );
  };
  return isLinked(path, readFileSync(path, "utf8")) ? fixtures : undefined;
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
  const run = spawnSync(
    process.execPath,
    ["--no-warnings", "--require", TIMERS_PATH, "--eval", SCRIPT_RUNNER, path],
    { encoding: "utf8" },
  );
  if (run.status === 0) return undefined;
  return run.stderr.split("\n").find((line) => /^\w*Error\b/.test(line)) ?? `exit ${run.status}`;
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
  const isImporting = hasImportCall(source);
  const isLinked =
    isImporting || (metadata.isModule && LINKED_MODULE.test(source.slice(source.indexOf("---*/"))));
  const fixtures = isLinked ? getFixtures(path) : new Map<string, string>();
  if (fixtures === undefined) {
    return { id, outcome: "skipped", reason: "a test that imports other than from a fixture" };
  }
  // A fixture is a module, so its code is strict.
  fixtures.forEach((text, fixture) => {
    const modulePath = getModulePath(fixture);
    mkdirSync(dirname(modulePath), { recursive: true });
    writeFileSync(modulePath, `"use strict"; ${text}`);
    writeFileSync(modulePath.replace(/\.ts$/, ".js"), transpileModule(text));
  });
  const programPath = isLinked ? getModulePath(path) : PROGRAM_PATH;
  if (isLinked) mkdirSync(dirname(programPath), { recursive: true });
  // TypeScript itself fails on some syntax, such as import defer, and recurses without end on some
  // types, such as an object's that a generator assigns and names by what it yields.
  const annotated = (() => {
    try {
      return annotate(
        `${getHarness(metadata, source)}\n${metadata.isModule ? source : nameGlobalObject(source)}`,
        programPath,
      );
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Debug Failure.")) return undefined;
      if (error instanceof RangeError) return undefined;
      throw error;
    }
  })();
  if (annotated === undefined) return { id, outcome: "skipped", reason: "TypeScript fails" };
  const isSloppy = metadata.flags.includes("noStrict");
  const nodeError = metadata.isModule
    ? getModuleError(annotated, isLinked ? programPath.replace(/\.ts$/, ".js") : undefined)
    : isImporting
      ? getScriptError(annotated, programPath.replace(/\.ts$/, ".js"), isSloppy)
      : await getNodeError(annotated, isSloppy);
  if (nodeError !== undefined) {
    return { id, outcome: "skipped", reason: `Node fails: ${getFirstLine(nodeError)}` };
  }
  try {
    // A noStrict test runs outside strict mode, as a script, and any other runs in strict mode, as
    // Node runs it as a module.
    const program = isSloppy ? annotated : `"use strict"; ${annotated}`;
    // A linked test's own file is on disk, as its fixtures are, so that TypeScript resolves an
    // import of the test's .js path to the test's code rather than to the .js that Node runs.
    if (isLinked) writeFileSync(programPath, program);
    const result = await check({
      ...compile(program, isLinked ? programPath : "test262.ts"),
      onPrint: () => {},
    });
    if (result.status === "success" || result.status === "deadlock") {
      return { id, outcome: "pass", reason: "" };
    }
    return getFailedRun(id, result.failure?.message ?? result.status);
  } catch (error) {
    // tla-ts compiles each statement inside the one before it, so thousands of statements, as in
    // the tests of Unicode identifiers, run out of stack.
    if (error instanceof RangeError && error.message.includes("Maximum call stack size exceeded")) {
      return { id, outcome: "untranslatable", reason: "Too many statements to compile" };
    }
    if (!(error instanceof TlaTypeScriptError)) {
      return getFailedRun(id, String(error));
    }
    const reason = getFirstLine(error.message);
    return /: (?:error|message) TS\d+: /.test(reason)
      ? { id, outcome: "skipped", reason: `type error: ${reason}` }
      : { id, outcome: "untranslatable", reason };
  }
};

const getReasonKind = (reason: string) =>
  reason
    .replace(/^type error: \S+\(\d+,\d+\): /, "type ")
    .replace(/^\S+:\d+:\d+ /, "")
    .split(": ")[0];

const isVerbose = process.argv.includes("--verbose");
const prefixes = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
const paths = listTest262Files()
  .filter((path) => {
    const id = relative(TEST262_DIRECTORY, path);
    return prefixes.length === 0 || prefixes.some((prefix) => id.startsWith(prefix));
  })
  .sort();

const runs: TestRun[] = [];
for (const path of paths) {
  const run = await runTest(path);
  runs.push(run);
  if (isVerbose || run.outcome === "wrong") {
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
process.exit(runs.some((run) => run.outcome === "wrong") ? 1 : 0);
