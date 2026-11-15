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
import { STRING_METHODS } from "../src/typescript/collections";
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
  isModule: boolean;
}

// tla-ts takes local time to be UTC, so Node's Date must too.
process.env.TZ = "UTC";

const TEST_DIRECTORY = join(CORPORA_DIRECTORY, "test262", "test");

const HARNESS = readFileSync(join(CONFORMANCE_DIRECTORY, "test262-harness.ts"), "utf8");

// Compiled TypeScript is a strict mode module.
const SKIPPED_FLAGS = new Set(["noStrict", "raw"]);

// A module that imports or exports, which the corpus pairs with fixture files, and whose exported
// functions tla-ts would read as a spec's actions.
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
]);

// An async test's harness defines $DONE, as doneprintHandle.js does.
const DONE_HARNESS = readFileSync(join(CONFORMANCE_DIRECTORY, "test262-done.ts"), "utf8");

// A test that reads $262 has the host's members that tla-ts can model.
const HOST_HARNESS = readFileSync(join(CONFORMANCE_DIRECTORY, "test262-host.ts"), "utf8");

const getHarness = (metadata: Metadata, source: string) =>
  [
    HARNESS,
    ...(metadata.flags.includes("async") ? [DONE_HARNESS] : []),
    ...(/\$262\b/.test(source) ? [HOST_HARNESS] : []),
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
const getModuleError = (source: string) => {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
  }).outputText;
  const run = spawnSync(process.execPath, ["--input-type=module", "-"], {
    input: output,
    encoding: "utf8",
  });
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

// TypeScript's error for a use of a value of type unknown.
const UNKNOWN_VALUE_ERROR = 18046;
const ARGUMENT_COUNT_ERROR = 2554;

// The built-ins that tla-ts compiles from their values, not their declared signatures, where a test
// calls them with fewer arguments than TypeScript's types take. Each needs a unit test of such a
// call, since a translation that follows the signature may read the missing arguments wrongly.
const SHORT_CALLED_BUILT_INS = new Set(["RegExp"]);

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
    // extra arguments without changing the function's length.
    const count = /but got (\d+)/.exec(ts.flattenDiagnosticMessageText(diagnostic.messageText, ""));
    const called =
      diagnostic.code === ARGUMENT_COUNT_ERROR && count !== null
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
    // that holds a number until then.
    if (
      diagnostic.code === 2322 &&
      ts.isBinaryExpression(parent) &&
      parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      parent.left === node &&
      parent.right.kind === ts.SyntaxKind.ThisKeyword
    ) {
      edits.set(parent.right.getStart(), "(");
      edits.set(parent.right.getEnd(), " as any)");
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
  const sourceFile = program?.getSourceFile(PROGRAM_PATH);
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

// test262 is JavaScript, so its functions and variables have no types. This annotates them as
// TypeScript's "Infer type from usage" fix does, with unknown where it infers any, then loosens
// the types of the objects it describes.
const annotate = (text: string) => {
  setText(text);
  typeIteratorBases();
  typeGenerators();
  typeCallbacks();
  for (;;) {
    const sourceFile = service.getProgram()?.getSourceFile(PROGRAM_PATH);
    // A variable that an empty array literal initializes holds an array, which the fix infers as
    // unknown where the test only destructures it.
    const isEmptyArrayName = (node: ts.Node, position: number): boolean =>
      (ts.isVariableDeclaration(node) &&
        node.name.getEnd() === position &&
        node.initializer !== undefined &&
        ts.isArrayLiteralExpression(node.initializer) &&
        node.initializer.elements.length === 0) ||
      (ts.forEachChild(node, (child) => isEmptyArrayName(child, position) || undefined) ?? false);
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
            .reduce((current, change) => {
              const inferred = change.newText.replaceAll(/\bany\b/g, "unknown");
              return (
                current.slice(0, change.span.start) +
                (inferred === ": unknown" &&
                sourceFile !== undefined &&
                isEmptyArrayName(sourceFile, change.span.start)
                  ? ": unknown[]"
                  : inferred) +
                current.slice(change.span.start + change.span.length)
              );
            }, file.text);
    if (annotated === file.text) break;
    setText(annotated);
  }
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
const UNTYPED_READ_ERRORS = new Set([MISSING_PROPERTY_ERROR, 2551, 7017, 7053]);
const UNUSED_OPERAND_ERROR = 2695;
// A delete of a property that the object's type doesn't make optional.
const OPTIONAL_DELETE_ERROR = 2790;
const UNRESOLVED_NAME_ERROR = 2304;
const NOT_ITERABLE_ERROR = 2488;
// A tuple's element past its end.
const MISSING_ELEMENT_ERROR = 2493;

// An argument of a type that a call's signatures don't take, which tla-ts converts where a string's
// method or RegExp takes a primitive or an object.
const CONVERTED_ARGUMENT_ERRORS = new Set([2345, 2769]);
// The array methods that tla-ts runs a reducer for on the values it gets, not its declared types,
// where a test's reducer returns a type that the method's signatures don't take. Each needs a unit
// test of such a call, since tla-ts reads a value by its declared type.
const REDUCING_METHODS = new Set(["reduce", "reduceRight"]);
// The array methods that tla-ts searches by value for any value, from an index that ToNumber
// converts from a primitive. Each needs a unit test of such a call.
const SEARCHING_METHODS = new Set(["includes", "indexOf", "lastIndexOf"]);
// RegExp.prototype's methods under well-known symbols that tla-ts runs as their steps where a test
// calls them through call, on any receiver, or on a regexp with a string, a limit, or a replaceValue
// of another type than their signatures take. Each needs a unit test of such a call.
const PROTOCOL_METHODS = new Set(["match", "search", "split", "replace"]);
// TypeScript's errors for a call with fewer arguments than its signature takes.
const SHORT_CALL_ERRORS = new Set([ARGUMENT_COUNT_ERROR, 2555]);
// A call of a value of type unknown, which tla-ts runs where a key stores a String.prototype method.
const UNKNOWN_CALLEE_ERROR = 2571;
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

// An operator's operand of a type that the operator doesn't take, or that is null or undefined,
// which tla-ts converts to a primitive where it's an object that the test declares, a wrapper, or a
// primitive.
const OPERAND_TYPE_ERRORS = new Set([2362, 2363, 2365, 18050]);

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
// A read of a variable that TypeScript can't tell is assigned. tla-ts reads a var's type as its
// value's, so a read is sound only where the value is assigned whenever it runs.
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
  const sourceFile = program?.getSourceFile(PROGRAM_PATH);
  if (program === undefined || sourceFile === undefined) return;
  const checker = program.getTypeChecker();
  const getNode = (position: number) => {
    const visit = (node: ts.Node): ts.Node =>
      ts.forEachChild(node, (child) =>
        child.getStart() <= position && position < child.getEnd() ? visit(child) : undefined,
      ) ?? node;
    return visit(sourceFile);
  };
  const isObjectRead = (node: ts.Node) => {
    const read = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.PropertyAccessExpression | ts.ElementAccessExpression =>
        ts.isPropertyAccessExpression(ancestor) || ts.isElementAccessExpression(ancestor),
    );
    const type = read && checker.getTypeAtLocation(read.expression);
    return (
      type !== undefined &&
      !type.isUnion() &&
      (type.flags & ts.TypeFlags.Object) !== 0 &&
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
  // converts.
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
        (operand) => isPlainObject(operand) || isWrapper(operand) || isPrimitive(operand),
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
  // where its type says it has one.
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
      parameter.type === undefined &&
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
  // A call of a built-in that SHORT_CALLED_BUILT_INS lists, with fewer arguments than its type
  // takes, which passes undefined for the others as JavaScript does.
  const isShortBuiltInCall = (node: ts.Node) => {
    const call = ts.findAncestor(
      node,
      (ancestor): ancestor is ts.CallExpression | ts.NewExpression =>
        ts.isCallExpression(ancestor) || ts.isNewExpression(ancestor),
    );
    const declaration = call && checker.getResolvedSignature(call)?.getDeclaration();
    return (
      call !== undefined &&
      ts.isIdentifier(call.expression) &&
      SHORT_CALLED_BUILT_INS.has(call.expression.text) &&
      declaration !== undefined &&
      declaration.getSourceFile().isDeclarationFile &&
      (call.arguments?.length ?? 0) <
        declaration.parameters.filter(
          (parameter) =>
            parameter.questionToken === undefined &&
            parameter.initializer === undefined &&
            parameter.dotDotDotToken === undefined,
        ).length
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
  // A call that spreads arguments into a function expression without parameters, directly or through
  // apply. The function reads them only through its arguments object, which takes any values.
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
    return (
      ts.isFunctionExpression(called) &&
      called.parameters.length === 0 &&
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
      type.types.every((member) =>
        /^(Big)?(Int|Uint|Float)\d+(Clamped)?Array$/.test(member.getSymbol()?.getName() ?? ""),
      )
    );
  };
  const isSound = (diagnostic: ts.Diagnostic) => {
    const node = getNode(diagnostic.start ?? 0);
    return (
      (diagnostic.code === ARGUMENT_COUNT_ERROR &&
        (isShortBuiltInCall(node) || isShortReducingCall(node))) ||
      (SHORT_CALL_ERRORS.has(diagnostic.code) && isShortProtocolCall(node, diagnostic)) ||
      (diagnostic.code === MISSING_PROPERTY_ERROR && isPatternRead(node)) ||
      ((diagnostic.code === NOT_ITERABLE_ERROR || NULLABLE_ERRORS.has(diagnostic.code)) &&
        isNullableArrayPattern(node)) ||
      (diagnostic.code === NOT_ITERABLE_ERROR && isCaughtArrayPattern(node)) ||
      (diagnostic.code === MISSING_ELEMENT_ERROR && isMissingElement(node)) ||
      (diagnostic.code === UNASSIGNED_READ_ERROR &&
        (isCaughtRead(node) || isLaterGeneratorRead(node))) ||
      ((diagnostic.code === NOT_ITERABLE_ERROR || NULLABLE_ERRORS.has(diagnostic.code)) &&
        isTypeErrorPattern(node)) ||
      (UNASSIGNABLE_ERRORS.has(diagnostic.code) && isPatternArgument(node)) ||
      (diagnostic.code === 2322 && isIteratorWrite(node)) ||
      (diagnostic.code === OPTIONAL_DELETE_ERROR && isDeletedIterator(node)) ||
      (diagnostic.code === 2322 && isWrittenExec(node, diagnostic)) ||
      (BASE_MEMBER_ERRORS.has(diagnostic.code) && isIteratorMember(node)) ||
      (ABSTRACT_MEMBER_ERRORS.has(diagnostic.code) && isIteratorClass(node)) ||
      (SPREAD_CALL_ERRORS.has(diagnostic.code) && isUntypedSpreadCall(node)) ||
      (CONVERTED_ARGUMENT_ERRORS.has(diagnostic.code) &&
        (isConvertedCall(diagnostic) ||
          isConvertedProtocolCall(diagnostic) ||
          isReducingCall(diagnostic) ||
          isSearchingCall(diagnostic) ||
          isTypedArrayNew(diagnostic))) ||
      (diagnostic.code === UNKNOWN_CALLEE_ERROR && isStoredStringCall(node)) ||
      (diagnostic.code === UNCALLABLE_ERROR && isTypedUnionCall(node, diagnostic)) ||
      diagnostic.code === UNUSED_OPERAND_ERROR ||
      (diagnostic.code === UNINTENDED_COMPARISON_ERROR && isUnnarrowed(node, diagnostic)) ||
      (UNTYPED_READ_ERRORS.has(diagnostic.code) && isObjectRead(node)) ||
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
  const diagnostics = service.getSemanticDiagnostics(PROGRAM_PATH);
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
  2300, 2335, 2337, 2357, 2364, 2392, 2406, 2451, 2462, 2481, 2487, 2523, 2524, 2660, 2777, 2779,
  2804, 2815, 5076, 6188, 6189, 18006, 18011, 18012, 18013, 18016, 18026, 18037, 18041, 18061,
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
  const strict = metadata.flags.includes("onlyStrict") ? '"use strict";\n' : "";
  const isRejected = metadata.isModule
    ? isModuleSyntaxError(source)
    : isNodeSyntaxError(`${strict}${source}`);
  if (!isRejected) {
    return { id, outcome: "skipped", reason: "Node accepts it" };
  }
  const program = `${getHarness(metadata, source)}\n${source}`;
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

// A script's import(), import.source(), or import.defer() loads a module, which Node's vm can't do
// without a linker, and whose fixture files tla-ts doesn't read.
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

const runTest = async (path: string): Promise<TestRun> => {
  const id = relative(TEST_DIRECTORY, path);
  const source = readFileSync(path, "utf8");
  const metadata = getMetadata(source);
  const skipReason = NODE_CRASHES.has(id) ? "Node crashes" : getSkipReason(metadata);
  if (skipReason !== undefined) return { id, outcome: "skipped", reason: skipReason };
  if (metadata.isSyntaxError) return runSyntaxTest(id, source, metadata);
  if (metadata.isModule && LINKED_MODULE.test(source.slice(source.indexOf("---*/")))) {
    return { id, outcome: "skipped", reason: "a module that imports or exports" };
  }
  if (!metadata.isModule && hasImportCall(source)) {
    return { id, outcome: "skipped", reason: "a script that imports a module" };
  }
  // TypeScript itself fails on some syntax, such as import defer.
  const annotated = (() => {
    try {
      return annotate(
        `${getHarness(metadata, source)}\n${metadata.isModule ? source : nameGlobalObject(source)}`,
      );
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Debug Failure.")) return undefined;
      throw error;
    }
  })();
  if (annotated === undefined) return { id, outcome: "skipped", reason: "TypeScript fails" };
  const nodeError = metadata.isModule ? getModuleError(annotated) : await getNodeError(annotated);
  if (nodeError !== undefined) {
    return { id, outcome: "skipped", reason: `Node fails: ${getFirstLine(nodeError)}` };
  }
  try {
    // Node runs the test as a module, which is strict code, so tla-ts compiles it as strict too.
    const strict = `"use strict"; ${annotated}`;
    const result = await check({ ...compile(strict, "test262.ts"), onPrint: () => {} });
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
