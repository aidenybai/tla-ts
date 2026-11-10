// Runs test262 through the TypeScript compiler. Tests that Node fails or that aren't valid
// TypeScript are skipped, not blamed on the compiler.
// Usage: bun scripts/run.ts test262 [--verbose] [test path prefixes]

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { runInNewContext, Script } from "node:vm";
import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../src/errors";
import { check } from "../src/parallel";
import { compile } from "../src/typescript/compile";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, listFiles } from "./corpora";

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
}

const TEST_DIRECTORY = join(CORPORA_DIRECTORY, "test262", "test");

const HARNESS = readFileSync(join(CONFORMANCE_DIRECTORY, "test262-harness.ts"), "utf8");

// Compiled TypeScript is a strict mode module.
const SKIPPED_FLAGS = new Set(["noStrict", "raw", "module"]);
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
]);

// An async test's harness defines $DONE, as doneprintHandle.js does.
const DONE_HARNESS = readFileSync(join(CONFORMANCE_DIRECTORY, "test262-done.ts"), "utf8");

const getHarness = (metadata: Metadata) =>
  [
    HARNESS,
    ...(metadata.flags.includes("async") ? [DONE_HARNESS] : []),
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
  return {
    includes: getList("includes"),
    flags: getList("flags"),
    isNegative: /^negative:/m.test(frontmatter),
    isSyntaxError: /^negative:\s*\n\s*phase:\s*(parse|early)\s*\n\s*type:\s*SyntaxError\s*$/m.test(
      frontmatter,
    ),
  };
};

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

// A test may leave a promise rejected with no handler, which JavaScript allows, though Node's
// default would end this script.
process.on("unhandledRejection", () => {});

// Runs a test in Node, with its jobs and then its timers, as an async test checks $DONE in one.
const getNodeError = async (source: string) => {
  const timers: (() => void)[] = [];
  try {
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ESNext,
        moduleDetection: ts.ModuleDetectionKind.Force,
      },
    }).outputText;
    runInNewContext(output, {
      exports: {},
      setTimeout: (callback: () => void) => {
        timers.push(callback);
      },
    });
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    timers.forEach((timer) => timer());
    return undefined;
  } catch (error) {
    return String(error);
  }
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

const PROGRAM_PATH = "/test262.ts";

const file = { text: "", version: 0 };

const service = ts.createLanguageService({
  getCompilationSettings: () => ({
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleDetection: ts.ModuleDetectionKind.Force,
    lib: ["lib.esnext.d.ts"],
    types: [],
  }),
  getScriptFileNames: () => [PROGRAM_PATH],
  getScriptVersion: (path) => (path === PROGRAM_PATH ? String(file.version) : "0"),
  getScriptSnapshot: (path) => {
    const text = path === PROGRAM_PATH ? file.text : ts.sys.readFile(path);
    return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
  },
  getCurrentDirectory: () => "/",
  getDefaultLibFileName: ts.getDefaultLibFilePath,
  fileExists: (path) => path === PROGRAM_PATH || ts.sys.fileExists(path),
  readFile: (path) => (path === PROGRAM_PATH ? file.text : ts.sys.readFile(path)),
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
// descriptor whose attributes aren't booleans, an object that Object.create makes, and a parameter
// or variable with no type to infer. Each only adds types, so Node runs the same program.
const isKeyType = (type: ts.Type) =>
  (type.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike)) !== 0;

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
      ? "unknown[]"
      : `[${elements.join(", ")}]`;
  }
  const properties = name.elements.map((element) => {
    const key = element.propertyName ?? element.name;
    const type = getPatternType(element.name);
    if (element.dotDotDotToken !== undefined || type === undefined) return undefined;
    return ts.isIdentifier(key) || ts.isStringLiteral(key) || ts.isNumericLiteral(key)
      ? `${key.getText()}?: ${type}`
      : undefined;
  });
  return properties.some((property) => property === undefined)
    ? undefined
    : `{ ${properties.join("; ")} }`;
};

const loosen = () => {
  const program = service.getProgram();
  const sourceFile = program?.getSourceFile(PROGRAM_PATH);
  if (program === undefined || sourceFile === undefined) return false;
  const checker = program.getTypeChecker();
  const getNode = (position: number) => {
    const visit = (node: ts.Node): ts.Node =>
      ts.forEachChild(node, (child) =>
        child.getStart() <= position && position < child.getEnd() ? visit(child) : undefined,
      ) ?? node;
    return visit(sourceFile);
  };
  const edits = new Map<number, string>();
  service.getSemanticDiagnostics(PROGRAM_PATH).forEach((diagnostic) => {
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
      !ts.isNonNullExpression(nullable.parent)
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
        edits.set(declaration.name.getEnd(), ": { [key: string]: unknown }");
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
      (receiverType.flags & ts.TypeFlags.Object) !== 0 &&
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
      edits.set(receiver.getEnd(), " as unknown as { [key: string]: unknown })");
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
          ? "this: { [key: string]: unknown }"
          : "this: { [key: string]: unknown }, ",
      );
    }
    // A test may call new on a function that isn't a constructor, to check that it throws.
    const created = ts.findAncestor(node, ts.isNewExpression);
    if (diagnostic.code === 7009 && created !== undefined) {
      edits.set(created.expression.getStart(), "(");
      edits.set(
        created.expression.getEnd(),
        " as unknown as new (...args: unknown[]) => { [key: string]: unknown })",
      );
    }
    // A test may call a function with fewer arguments than it declares, which leaves the others
    // undefined, or with more, which only its arguments object holds. A rest parameter takes the
    // extra arguments without changing the function's length.
    const count = /but got (\d+)/.exec(ts.flattenDiagnosticMessageText(diagnostic.messageText, ""));
    const called =
      diagnostic.code === 2554 && count !== null
        ? ts.findAncestor(
            node,
            (ancestor): ancestor is ts.CallExpression | ts.NewExpression =>
              (ts.isCallExpression(ancestor) || ts.isNewExpression(ancestor)) &&
              (ancestor.arguments?.length ?? 0) === Number(count[1]),
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
      const given = called.arguments?.length ?? 0;
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
    const described =
      (diagnostic.code === 2322 || diagnostic.code === 2345) &&
      ts.isIdentifier(node) &&
      (ts.isCallExpression(parent) || ts.isPropertyAssignment(parent))
        ? getDescriptorName(
            parameter === undefined
              ? checker.getContextualType(node)
              : checker.getTypeOfSymbolAtLocation(parameter, node),
          )
        : undefined;
    if (described !== undefined) {
      edits.set(node.getStart(), "(");
      edits.set(node.getEnd(), ` as unknown as ${described})`);
    }
  });
  const visit = (node: ts.Node) => {
    const initializer = ts.isVariableDeclaration(node) ? node.initializer : undefined;
    if (
      ts.isVariableDeclaration(node) &&
      node.type === undefined &&
      initializer !== undefined &&
      ts.isCallExpression(initializer) &&
      initializer.expression.getText() === "Object.create"
    ) {
      edits.set(node.name.getEnd(), ": { [key: string]: unknown }");
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (edits.size > 0) applyEdits(edits);
  return edits.size > 0;
};

// test262 is JavaScript, so its functions and variables have no types. This annotates them as
// TypeScript's "Infer type from usage" fix does, with unknown where it infers any, then loosens
// the types of the objects it describes.
const annotate = (text: string) => {
  setText(text);
  for (;;) {
    const fix = service
      .getSemanticDiagnostics(PROGRAM_PATH)
      .values()
      .filter((diagnostic) => IMPLICIT_ANY_ERRORS.has(diagnostic.code))
      .flatMap((diagnostic) => {
        const start = diagnostic.start ?? 0;
        const end = start + (diagnostic.length ?? 0);
        return service.getCodeFixesAtPosition(PROGRAM_PATH, start, end, [diagnostic.code], {}, {});
      })
      .find((candidate) => candidate.fixName === "inferFromUsage");
    const annotated =
      fix === undefined
        ? file.text
        : fix.changes
            .flatMap((change) => change.textChanges)
            .toSorted((left, right) => right.span.start - left.span.start)
            .reduce(
              (current, change) =>
                current.slice(0, change.span.start) +
                change.newText.replaceAll(/\bany\b/g, "unknown") +
                current.slice(change.span.start + change.span.length),
              file.text,
            );
    if (annotated === file.text) break;
    setText(annotated);
  }
  // A type that one loosening gives can show where another is needed.
  while (loosen());
  return file.text;
};

// TLC stops when a value has no TLA+ form, which only a run finds, rather than giving a different
// answer than Node.
const UNREPRESENTABLE = [
  "Overflow when computing",
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
  2300, 2335, 2337, 2357, 2364, 2392, 2406, 2451, 2462, 2481, 2487, 2523, 2524, 2660, 2777, 2779,
  2804, 2815, 5076, 6188, 6189, 18006, 18011, 18012, 18013, 18016, 18026, 18037, 18041, 18061,
]);

const isEarlyError = (code: number) =>
  (code >= 1000 && code < 2000) || (code >= 17000 && code < 18000) || EARLY_ERRORS.has(code);

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
  const strict = metadata.flags.includes("onlyStrict") ? '"use strict";\n' : "";
  if (!isNodeSyntaxError(`${strict}${source}`)) {
    return { id, outcome: "skipped", reason: "Node accepts it" };
  }
  const program = `${getHarness(metadata)}\n${source}`;
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
  const isModule =
    spawnSync(process.execPath, ["--input-type=module", "--check"], { input: source }).status === 0;
  return isModule
    ? {
        id,
        outcome: "skipped",
        reason: "a SyntaxError only in scripts, and tla-ts compiles modules",
      }
    : { id, outcome: "wrong", reason: "Compiled a program with a SyntaxError" };
};

const runTest = async (path: string): Promise<TestRun> => {
  const id = relative(TEST_DIRECTORY, path);
  const source = readFileSync(path, "utf8");
  const metadata = getMetadata(source);
  const skipReason = NODE_CRASHES.has(id) ? "Node crashes" : getSkipReason(metadata);
  if (skipReason !== undefined) return { id, outcome: "skipped", reason: skipReason };
  if (metadata.isSyntaxError) return runSyntaxTest(id, source, metadata);
  // TypeScript itself fails on some syntax, such as import defer.
  const annotated = (() => {
    try {
      return annotate(`${getHarness(metadata)}\n${source}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Debug Failure.")) return undefined;
      throw error;
    }
  })();
  if (annotated === undefined) return { id, outcome: "skipped", reason: "TypeScript fails" };
  const nodeError = await getNodeError(annotated);
  if (nodeError !== undefined) {
    return { id, outcome: "skipped", reason: `Node fails: ${getFirstLine(nodeError)}` };
  }
  try {
    const result = await check({ ...compile(annotated, "test262.ts"), onPrint: () => {} });
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
const paths = listFiles(TEST_DIRECTORY)
  .filter((path) => path.endsWith(".js") && !path.includes("_FIXTURE"))
  .filter((path) => {
    const id = relative(TEST_DIRECTORY, path);
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
