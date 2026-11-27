import ts from "@typescript/typescript6";
import { TlaStrippingError, TlaTypeScriptError } from "../../errors";
import { getNodeParses, rejectEarlyErrors } from "../early-errors";
import { isDeadCode } from "../common-js";
import { getJsxText, getRunSourceFile, parseFile } from "../program";
import { createModuleResolver, getModuleFormat } from "./resolve";
import { getHostSystem, type ProgramSystem } from "../system";
import type { PreparedModule } from "../../tlc/order";
import { foldNames, getCallBuiltin, HOOKS } from "./library";
import { CONFIG, type JsTlaRuntime, ROOT, SCRIPT_STEPS } from "./prepare";
import type { HostRealm } from "./realm";
import {
  getHostCalendars,
  getHostDateFormat,
  getHostLocale,
  getHostRealmFacts,
  getHostTimeZone,
  getUnitsOf,
  LOCALE_METHODS,
} from "./runtime";
import type { Expression } from "../../ast";
import {
  apply,
  type CodeDefinition,
  CodeShapes,
  defineOperator,
  forEachBodyName,
  forEachTextName,
  getCodeLength,
  layOutModule,
  num,
  printCodeExpression,
  ref,
  string,
  tuple,
  walkCode,
} from "./code-tree";
import { getPatchedUnits, isTlaString } from "./units";
import { parseCommonJs } from "./cjs-lexer";
import { NODE_IMPORT } from "./node-import";
import {
  getNumber,
  isHostProcess,
  type ProgramFile,
  type ProgramRegion,
  specialize,
} from "./specialize";
import { stripTypes } from "./strip-types";
import { getHostIntl } from "./intl";
import { suspendDefinitions } from "./suspend";

// The URL of a file's absolute path, as Node's pathToFileURL gives it, where Node runs.
const pathToFileURL = (path: string) =>
  globalThis.process?.getBuiltinModule?.("node:url").pathToFileURL(path) ??
  new URL(path, "file:///");

export interface JsTlaSpec {
  name: string;
  source: string;
  config: string;
  regions: ProgramRegion[];
  loadModule: (name: string) => string | undefined;
  preparedModules: PreparedModule[];
}

export interface JsTlaSteps {
  // The steps, or what makes them of the program's files, numbered from 1 as its code numbers them.
  steps: string | ((files: readonly ProgramFile[]) => string);
  entries: readonly string[];
  // The text of other modules the steps extend, whose reads of the runtime the spec keeps.
  reads?: string;
  // Whether the host is test262's, which loads every file of code as an ES module rather than as
  // Node does, and whose global has $262, which a new context's has none of (DefineContextHost262).
  isTest262Host?: boolean;
  // The files that an import() of a computed string may load, which the program compiles though
  // no literal names them, as test262's fixtures beside a test: an import() of "./" and one's name
  // from a file in its directory loads it, and of a name that no file of the directory has
  // rejects.
  candidates?: readonly string[];
  // The modules besides the runtime that the code extends, and the assumptions after its steps.
  extensions?: readonly string[];
  assumptions?: readonly string[];
}

// The most characters of a program's TLA+ code that a check parses, past which parsing alone would
// pass 80% of Node's default heap, which Node 26 gives this machine as 4,192 MB
// (v8.getHeapStatistics().heap_size_limit), 3,354 MB. A check that runs out of the heap within the
// bound stops with a TlaHeapLimitError (see cli.ts), so the bound only stops early a program whose
// parse would. The heap that compiling Effect's modules and parsing their code use before a
// collection, as --trace-gc gives it, and the heap left after the largest, at a load of 30:
//
//                           characters   used       left
//   Effect.ts               13.9 million    847 MB     618 MB
//   Schema.ts               36.4 million  2,016 MB     982 MB
//   Arbitrary.ts            40.0 million  2,360 MB   1,218 MB
//   Config.ts               44.4 million  2,477 MB   1,476 MB
//   RequestResolver.ts      47.3 million  2,551 MB   1,219 MB
//   index.ts                61.9 million  3,644 MB   3,456 MB
//
// The heap used grows 75 MB a million characters past RequestResolver.ts's, as index.ts's does,
// which reaches 3,354 MB at 58 million.
const MOST_CODE_CHARACTERS = 55_000_000;

// A program's definitions with each one whose text is another's but for its name and the names of
// definitions merged before it merged into the first, but for the hooks, which the config names,
// and with each literal sequence of numbers, such as a name's code units, a definition of its own,
// so that a check reads each one once. A sequence of the code units of characters that a TLA+
// string can hold is that string's units.
const getStringUnits = (units: readonly number[]) => {
  const text = units.map((unit) => String.fromCharCode(unit)).join("");
  return isTlaString(text) ? apply("StringUnits", [string(text)]) : undefined;
};

// A long sequence of code units as runs of consecutive code points, the first of each and the code
// unit where each ends, which CodeUnitsOfRuns makes the units of as a function: a few numbers that
// TLA+ reads in place of a tuple of millions, as a string of every character of a Unicode property
// holds. Each run's code points are all below 65536 or all from there, so that each takes one code
// unit or two; a surrogate pair is one code point and a lone surrogate one code unit, which the
// runs encode back to the units they came from.
const getUnitRuns = (units: readonly number[]) => {
  if (units.length < 4096 || units.some((unit) => unit > 0xffff)) return undefined;
  const starts: number[] = [];
  const ends: number[] = [];
  let position = 0;
  let previous = -2;
  while (position < units.length) {
    const unit = units[position];
    const next = units[position + 1];
    const isPair = unit >= 0xd800 && unit <= 0xdbff && next >= 0xdc00 && next <= 0xdfff;
    const codePoint = isPair ? (unit - 0xd800) * 1024 + (next - 0xdc00) + 0x10000 : unit;
    position += isPair ? 2 : 1;
    if (codePoint === previous + 1 && codePoint !== 0x10000) ends[ends.length - 1] = position;
    else {
      starts.push(codePoint);
      ends.push(position);
    }
    previous = codePoint;
  }
  return starts.length * 16 > units.length
    ? undefined
    : apply("CodeUnitsOfRuns", [tuple(starts.map(num)), tuple(ends.map(num))]);
};

// A long sequence of code units as its text's source string and the units that the string holds as
// "?" (see getPatchedUnits), where that's shorter than the sequence.
const getLongUnits = (units: readonly number[], sequence: string) => {
  if (units.length < 4096) return undefined;
  const patched = getPatchedUnits(units.map((unit) => String.fromCharCode(unit)).join(""));
  return printCodeExpression(patched).length < sequence.length ? patched : undefined;
};

// The units of a literal sequence of numbers, as the definition of its own that reads them.
const getUnitsDefinition = (unitsName: string, sequence: string) => {
  const units = (sequence.match(/\d+/g) ?? []).map(Number);
  return defineOperator(
    unitsName,
    [],
    getStringUnits(units) ??
      getUnitRuns(units) ??
      getLongUnits(units, sequence) ??
      tuple(units.map(num)),
  );
};

// A node with the name of a hook, which the program's code takes the place of, as the program's
// own, or a literal N or SV of a string as its units, as foldNames makes them.
const foldNode = (expression: Expression): Expression => {
  if (expression.kind === "Identifier" && HOOKS.has(expression.name)) {
    expression.name = `Program${expression.name}`;
  }
  if (expression.kind !== "Apply") return expression;
  const literal = expression.args[0];
  if (
    (expression.operator === "N" || expression.operator === "SV") &&
    expression.args.length === 1 &&
    literal.kind === "String"
  ) {
    const units = tuple(
      Array.from({ length: literal.value.length }, (_, index) =>
        num(literal.value.charCodeAt(index)),
      ),
    );
    return expression.operator === "N" ? units : apply("Str", [units]);
  }
  if (HOOKS.has(expression.operator)) expression.operator = `Program${expression.operator}`;
  return expression;
};

const HOOK_NAMES = new RegExp(`\\b(?:${[...HOOKS.keys()].join("|")})\\b`, "g");

// Whether an expression is a literal sequence of numbers, which compact makes a definition of its
// own.
const isUnits = (expression: Expression) =>
  expression.kind === "Tuple" &&
  expression.elements.length > 0 &&
  expression.elements.every((element) => element.kind === "Number");

// A definition of the program's code with the capitalized words that name definitions in its text,
// and those of its body outside strings, which it reads.
interface NamedDefinition {
  definition: CodeDefinition;
  names: string[];
  reads: string[];
}

// The words of a definition of a tree whose body walkCode visits.
const getTreeWords = (definition: CodeDefinition) => {
  const named: NamedDefinition = { definition, names: [], reads: [] };
  const tree = definition.tree;
  if (tree === undefined) return named;
  forEachTextName([definition.name, ...tree.params.map((param) => param.name)].join(" "), (name) =>
    named.names.push(name),
  );
  return named;
};

const visitWord = (named: NamedDefinition) => (name: string, isInString: boolean) => {
  named.names.push(name);
  if (!isInString) named.reads.push(name);
};

// The words of a definition of text.
const getTextWords = (definition: CodeDefinition) => {
  const named: NamedDefinition = { definition, names: [], reads: [] };
  forEachTextName(definition.text ?? "", (name) => named.names.push(name));
  forEachBodyName(definition, (name, isInString) => {
    if (!isInString) named.reads.push(name);
  });
  return named;
};

// The program's definitions with their hooks and literals folded, each that reads the same as one
// before it merged into that one, and each literal sequence of numbers made a definition of its own:
// the trees' in one walk to fold, rename and record their shapes, and in another to rename again,
// replace their sequences and read their words.
const compact = (definitions: readonly CodeDefinition[]): NamedDefinition[] => {
  const merged = new Map<string, string>();
  const firsts = new Map<string, string>();
  const shapes = new CodeShapes();
  // The trees that come first with their shape, by its hash, and where their shapes run.
  const firstTrees = new Map<number, { name: string; start: number; end: number }[]>();
  const rename = (text: string) =>
    text.replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, (name) => merged.get(name) ?? name);
  const renameNode = (expression: Expression) => {
    if (expression.kind === "Identifier")
      expression.name = merged.get(expression.name) ?? expression.name;
    if (expression.kind === "Apply") {
      expression.operator = merged.get(expression.operator) ?? expression.operator;
    }
    return expression;
  };
  const foldAndShape = (expression: Expression) => {
    const node = renameNode(foldNode(expression));
    shapes.addNode(node);
    return node;
  };
  const folded = definitions.map((definition): CodeDefinition => {
    const name = HOOKS.has(definition.name) ? `Program${definition.name}` : definition.name;
    if (definition.tree === undefined) {
      const text = foldNames(
        (definition.text ?? "").replace(HOOK_NAMES, (hook) => `Program${hook}`),
      );
      if (!HOOKS.has(name.replace(/^Program/, ""))) {
        const key = `${definition.arity} ${rename(text).slice(name.length)}`;
        const first = firsts.get(key);
        if (first === undefined) firsts.set(key, name);
        else merged.set(name, first);
      }
      return { name, arity: definition.arity, text };
    }
    const tree = { ...definition.tree, name };
    if (HOOKS.has(name.replace(/^Program/, ""))) {
      tree.body = walkCode(tree.body, foldNode);
      return { name, arity: definition.arity, tree };
    }
    const start = shapes.length;
    shapes.addHead(tree);
    tree.body = walkCode(tree.body, foldAndShape);
    const hash = shapes.getHash(start);
    const candidates = firstTrees.get(hash);
    const first = candidates?.find((candidate) =>
      shapes.isSame(candidate.start, candidate.end, start, shapes.length),
    );
    if (first !== undefined) {
      merged.set(name, first.name);
      shapes.length = start;
    } else {
      const shape = { name, start, end: shapes.length };
      if (candidates === undefined) firstTrees.set(hash, [shape]);
      else candidates.push(shape);
    }
    return { name, arity: definition.arity, tree };
  });
  const sequences = new Map<string, string>();
  const getUnitsName = (sequence: string) => {
    const name = sequences.get(sequence) ?? `Units${sequences.size + 1}`;
    sequences.set(sequence, name);
    return name;
  };
  // A node renamed, or, for a literal sequence of numbers, its definition's name.
  const renameUnits = (expression: Expression) =>
    isUnits(expression) && expression.kind === "Tuple"
      ? ref(
          getUnitsName(
            `<<${expression.elements.map((element) => (element.kind === "Number" ? (element.text ?? String(element.value)) : "")).join(", ")}>>`,
          ),
        )
      : renameNode(expression);
  const kept = folded
    .filter((definition) => !merged.has(definition.name))
    .map((definition) => {
      const tree = definition.tree;
      if (tree !== undefined) {
        const named = getTreeWords(definition);
        tree.body = walkCode(tree.body, renameUnits, visitWord(named));
        return named;
      }
      return getTextWords({
        ...definition,
        // The parts of a long sequence are split rather than matched by a repeated group, whose
        // backtracking runs out of stack.
        text: rename(definition.text ?? "").replace(/<<[\d, ]+>>/g, (sequence) =>
          sequence
            .slice(2, -2)
            .split(", ")
            .every((part) => /^\d+$/.test(part))
            ? getUnitsName(sequence)
            : sequence,
        ),
      });
    });
  return [
    ...[...sequences].map((entry) => {
      const tree = getUnitsDefinition(entry[1], entry[0]);
      const named = getTreeWords({ name: entry[1], arity: 0, tree });
      walkCode(tree.body, keepNode, visitWord(named));
      return named;
    }),
    ...kept,
  ];
};

const keepNode = (expression: Expression) => expression;

// A program's definitions in an order where each comes after those that it reads, unless they read
// each other, and the names of the ones that a definition reads before they come, which TLA+ needs
// declared RECURSIVE.
const sortDefinitions = (definitions: readonly NamedDefinition[]) => {
  const byName = new Map(definitions.map((named) => [named.definition.name, named]));
  const isVisited = new Map<string, boolean>();
  const sorted: CodeDefinition[] = [];
  const recursive = new Set<string>();
  const visit = (named: NamedDefinition) => {
    isVisited.set(named.definition.name, false);
    // A name inside a string, such as SourceText's, is text rather than a read.
    for (const name of named.reads) {
      const read = byName.get(name);
      if (read === undefined) continue;
      if (isVisited.get(name) === false) recursive.add(name);
      else if (!isVisited.has(name)) visit(read);
    }
    isVisited.set(named.definition.name, true);
    sorted.push(named.definition);
  };
  definitions.forEach((named) => {
    if (!isVisited.has(named.definition.name)) visit(named);
  });
  return { sorted, recursive };
};

// The source file of a file's code as TypeScript parses it to transpile it, as a module where
// isModule, of a program that reads the file alone, or of the run's program of the file, which
// parses every file as a module, and stops at its first syntax error.
const parseCode = (code: string, fileName: string, isModule: boolean) => {
  const run = isModule ? getRunSourceFile(fileName, code) : undefined;
  const program =
    run === undefined
      ? ts.createProgram({
          rootNames: [fileName],
          options: {
            allowJs: true,
            noLib: true,
            noResolve: true,
            types: [],
            target: ts.ScriptTarget.ESNext,
            module: isModule ? ts.ModuleKind.ESNext : ts.ModuleKind.Preserve,
            moduleDetection: isModule
              ? ts.ModuleDetectionKind.Force
              : ts.ModuleDetectionKind.Legacy,
            // A script runs in strict mode only where it says so, which TypeScript 6 deprecates.
            alwaysStrict: false,
            ignoreDeprecations: "6.0",
            // A file of no extension that TypeScript knows, such as Node's async_hooks, parses as
            // TypeScript, as transpileModule parses it.
            allowNonTsExtensions: true,
          },
          // A host of the one file, which needs no file system, so that a browser parses it too.
          host: {
            getSourceFile: (name, languageVersion) =>
              name === fileName
                ? ts.createSourceFile(name, code, languageVersion, true)
                : undefined,
            fileExists: (name) => name === fileName,
            readFile: () => undefined,
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "/",
            getCanonicalFileName: (name) => name,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
          },
        })
      : undefined;
  const sourceFile = run?.file ?? program?.getSourceFile(fileName);
  if (sourceFile === undefined) throw new TlaTypeScriptError(`Can't read ${fileName}`);
  const error = (run?.errors ?? program?.getSyntacticDiagnostics(sourceFile))?.find(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (error !== undefined) {
    throw new TlaTypeScriptError(
      ts.flattenDiagnosticMessageText(error.messageText, "\n"),
      sourceFile,
      error.start,
    );
  }
  return sourceFile;
};

// The JavaScript that Node runs of a file: a .ts file's code with its types replaced by whitespace,
// as Node strips them, which keeps its positions and its functions' source texts, and a .js file's
// code as it is, with the source file of the code that TypeScript parses, which is a .js file's
// code where Node wraps it. A module is one where it neither imports nor exports too, where await
// at its top level awaits, which its JavaScript marks with an empty export after its code. A
// CommonJS module's JavaScript is in the function that Node wraps it in, where a .js file may
// return.
const transpile = (source: string, fileName: string, isModule: boolean, wrapper = ["", ""]) => {
  const isTypeScript = /\.[cm]?ts$/.test(fileName);
  const sourceFile = parseCode(
    isTypeScript ? source : `${wrapper[0]}${source}${wrapper[1]}`,
    fileName,
    isModule,
  );
  return {
    code: `${wrapper[0]}${isTypeScript ? stripTypes(sourceFile) : source}${wrapper[1]}`,
    sourceFile,
  };
};

// The files that tla-ts parses, by the names it parses them under, which name a TypeScript file's
// code as JavaScript's: each one's path, and the names of those whose code Node's wrapper holds.
interface ParsedNames {
  paths: Map<string, string>;
  wrapped: Set<string>;
}

// A parsed file of the file at path, whose name names records, as one that Node wraps where
// isWrapped.
const record = (sourceFile: ts.SourceFile, path: string, names: ParsedNames, isWrapped = false) => {
  names.paths.set(sourceFile.fileName, path);
  if (isWrapped) names.wrapped.add(sourceFile.fileName);
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

// What a call gives, or what it throws, which a load throws once it meets it in its order.
const getOutcome = <T>(run: () => T): { value: T } | { error: unknown } => {
  try {
    return { value: run() };
  } catch (error) {
    return { error };
  }
};

// Whether a file's code has an early error, for which Node throws a SyntaxError where it loads the
// file, as tla-ts finds a program's.
const hasEarlyError = (
  sourceFile: ts.SourceFile,
  nodeParse: ReturnType<typeof getNodeParses>[number],
) => {
  try {
    rejectEarlyErrors(sourceFile, nodeParse);
    return false;
  } catch (error) {
    if (error instanceof TlaTypeScriptError && / SyntaxError: /.test(error.message)) return true;
    throw error;
  }
};

const isImportCall = (node: ts.Node): node is ts.CallExpression =>
  ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword;

// Whether a file requests a specifier only by import(), and not by an import or an export of a
// module, or a require.
const isOnlyImportCalled = (sourceFile: ts.SourceFile, specifier: string) => {
  const isRequested = (node: ts.Node): boolean =>
    ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      node.moduleSpecifier.text === specifier) ||
    (ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require" &&
      node.arguments.some(
        (argument) => ts.isStringLiteralLike(argument) && argument.text === specifier,
      )) ||
    (ts.forEachChild(node, isRequested) ?? false);
  return !isRequested(sourceFile);
};

// The specifier of each import and export of a module, or each require of a string of a CommonJS
// module but those that isSkipped skips, with the literal that names it.
const getSpecifiers = (
  sourceFile: ts.SourceFile,
  kind: ProgramFile["kind"],
  isSkipped = (_call: ts.CallExpression) => false,
) => {
  const specifiers = new Map<string, ts.StringLiteralLike>();
  const visit = (node: ts.Node): void => {
    const literal =
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && kind === "module"
        ? node.moduleSpecifier
        : isImportCall(node)
          ? node.arguments[0]
          : ts.isCallExpression(node) &&
              kind === "commonjs" &&
              ts.isIdentifier(node.expression) &&
              node.expression.text === "require" &&
              node.arguments.length === 1 &&
              !isSkipped(node)
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

// Whether a node runs its children only where something holds, or later, rather than each time it
// runs: a function or a class, a branch of an if, a conditional, a switch or a short-circuiting
// operator, a loop, an optional chain, or a try.
const isConditional = (node: ts.Node) =>
  ts.isFunctionLike(node) ||
  ts.isClassLike(node) ||
  ts.isIfStatement(node) ||
  ts.isConditionalExpression(node) ||
  ts.isSwitchStatement(node) ||
  ts.isIterationStatement(node, false) ||
  ts.isTryStatement(node) ||
  ts.isOptionalChain(node) ||
  (ts.isBinaryExpression(node) &&
    [
      ts.SyntaxKind.AmpersandAmpersandToken,
      ts.SyntaxKind.BarBarToken,
      ts.SyntaxKind.QuestionQuestionToken,
      ts.SyntaxKind.AmpersandAmpersandEqualsToken,
      ts.SyntaxKind.BarBarEqualsToken,
      ts.SyntaxKind.QuestionQuestionEqualsToken,
    ].includes(node.operatorToken.kind));

// The function that Node wraps a CommonJS module's code in, as its loader writes it.
const WRAPPER = ["(function (exports, require, module, __filename, __dirname) { ", "\n});"];

// Runs compile, whose stops name where they are in the code that tla-ts parses, as the file's own
// code places them: in the file by its own name, the entry by the name the compile gives it, and a
// file that Node wraps, as CommonJS, at its own columns, which the wrapper moves on its first line.
const atSourceLocations = <T>(
  fileName: string,
  system: ProgramSystem,
  compile: (names: ParsedNames) => T,
): T => {
  const names: ParsedNames = { paths: new Map(), wrapped: new Set() };
  try {
    return compile(names);
  } catch (error) {
    // Node's stripping of a file's types reads the file's own code, which its error points into.
    const found =
      error instanceof TlaTypeScriptError && !(error instanceof TlaStrippingError)
        ? /^(.+?):(\d+):(\d+) ([^]*)$/.exec(error.message)
        : null;
    if (found === null) throw error;
    const path = names.paths.get(found[1]) ?? found[1];
    const isEntry = system.fileExists(fileName) && path === system.resolvePath(fileName);
    // A place in the wrapper, as the start of a line that V8 names alone, is the line's start.
    const column =
      Number(found[2]) === 1 && names.wrapped.has(found[1])
        ? Math.max(1, Number(found[3]) - WRAPPER[0].length)
        : Number(found[3]);
    throw new TlaTypeScriptError(`${isEntry ? fileName : path}:${found[2]}:${column} ${found[4]}`);
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
// Node's async_hooks as an ES module imports it: the module of the names that tla-ts models, which
// Node's builtin module exports as the properties of the object that process.getBuiltinModule
// gives, and that object as its default export.
const ASYNC_HOOKS = "node:async_hooks";
const ASYNC_HOOKS_NAMES = ["AsyncLocalStorage", "AsyncResource"];
const ASYNC_HOOKS_FACADE = `const hooks = process.getBuiltinModule(${JSON.stringify(ASYNC_HOOKS)});\n${ASYNC_HOOKS_NAMES.map((name) => `export const ${name} = hooks.${name};\n`).join("")}export default hooks;\n`;

// The specifier of Node's async_hooks that an ES module's import or export statement names, which
// stops where the statement reads a name that tla-ts doesn't model, or every name.
const getAsyncHooksSpecifier = (literal: ts.StringLiteralLike) => {
  if (literal.text !== ASYNC_HOOKS && literal.text !== "async_hooks") return undefined;
  const statement = literal.parent;
  const clause = ts.isImportDeclaration(statement) ? statement.importClause : undefined;
  const bindings = clause?.namedBindings;
  const exported = ts.isExportDeclaration(statement) ? statement.exportClause : undefined;
  const names = [
    ...(bindings !== undefined && ts.isNamedImports(bindings) ? bindings.elements : []),
    ...(exported !== undefined && ts.isNamedExports(exported) ? exported.elements : []),
  ].map((element) => (element.propertyName ?? element.name).text);
  const isEvery =
    (bindings !== undefined && ts.isNamespaceImport(bindings)) ||
    (ts.isExportDeclaration(statement) && exported === undefined) ||
    (exported !== undefined && ts.isNamespaceExport(exported));
  const unmodeled = names.find((name) => name !== "default" && !ASYNC_HOOKS_NAMES.includes(name));
  if (isEvery || unmodeled !== undefined) {
    throw new TlaTypeScriptError(
      `tla-ts can't import ${unmodeled ?? "every export"} of ${literal.text}, of which it models ${ASYNC_HOOKS_NAMES.join(" and ")}`,
      literal,
    );
  }
  return ASYNC_HOOKS;
};

const loadFiles = (
  source: string,
  fileName: string,
  isModule: boolean,
  host: Pick<JsTlaSteps, "isTest262Host" | "candidates">,
  names: ParsedNames,
  system: ProgramSystem,
  isPruned: boolean,
): ProgramFile[] => {
  // Whether the host loads a file as an ES module or as CommonJS (see getModuleFormat).
  const getKind = (path: string, text: string): ProgramFile["kind"] =>
    host.isTest262Host === true ? "module" : getModuleFormat(path, text, system);
  // The text of a file that the program loads, which its resolution found.
  const readFile = (path: string) => {
    const text = system.readFile(path);
    if (text === undefined) throw new TlaTypeScriptError(`Can't read ${path}`);
    return text;
  };
  // A script loads modules only where it calls import().
  const isScript = !isModule;
  if (isScript && !/\bimport\s*\(/.test(source)) {
    const sourceFile = record(
      parse(transpile(getJsxText(fileName, source, system), fileName, false).code, fileName, false),
      fileName,
      names,
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
  const resolveModule = createModuleResolver(fileName, system);
  // The file that a literal of a file's code loads, as Node loads it: a require's in CommonJS's
  // mode. TypeScript's program reads the types of the file that TypeScript resolves it to, so a
  // literal that the two resolve to different files stops.
  const resolve = (literal: ts.StringLiteralLike) => {
    const resolved = resolveModule(
      literal,
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
  const getRealPath = (path: string) => system.realpath(system.resolvePath(path));
  const entry = system.fileExists(fileName) ? getRealPath(fileName) : fileName;
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
      const targetText = readFile(target);
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
  // A file as the program loads it, before its requests: a JSON file's text, or another file's
  // kind, the specifiers its code writes, and its code's source file.
  const prepare = (path: string) => {
    const original = facades.get(path);
    const text =
      path === ASYNC_HOOKS
        ? ASYNC_HOOKS_FACADE
        : original !== undefined
          ? `export * from ${JSON.stringify(original)};\nexport { default } from ${JSON.stringify(original)};\nexport const __esModule = true;\n`
          : getJsxText(path, path === entry ? source : readFile(path), system);
    if (path.endsWith(".json")) return { path, text, kind: "json" as const };
    // A module entry that no file holds runs as an ES module, as no package's type or syntax
    // makes it CommonJS for Node, but for a host without a file system, whose one file Node
    // would load by its extension and syntax.
    const kind =
      path === ASYNC_HOOKS
        ? "module"
        : path !== entry
          ? getKind(path, text)
          : isScript
            ? "script"
            : system.fileExists(entry)
              ? getKind(path, text)
              : "module";
    // Node reads a hashbang as a comment.
    const code = text.replace(/^#!.*/, (line) => " ".repeat(line.length));
    const isModule = kind !== "script" && kind !== "commonjs";
    const transpiled = transpile(code, path, isModule, kind === "commonjs" ? WRAPPER : undefined);
    // The specifiers of the code that the file holds, which a JavaScript file that Node wraps parses
    // outside the wrapper.
    const written = getSpecifiers(
      kind === "commonjs" && !/\.[cm]?ts$/.test(path)
        ? parseFile(path, text)
        : transpiled.sourceFile,
      kind,
    );
    const sourceFile = record(
      parse(transpiled.code, path, isModule),
      path,
      names,
      kind === "commonjs",
    );
    return { path, text, kind, written, sourceFile };
  };
  // A prepared file's requests, which number the files it loads, and the file itself.
  const load = (
    file: ReturnType<typeof prepare>,
    nodeParse: ReturnType<typeof getNodeParses>[number],
  ) => {
    const path = file.path;
    if (file.kind === "json") {
      files.push({
        sourceFile: ts.createSourceFile(path, "", ts.ScriptTarget.ESNext),
        path,
        kind: "json",
        targets: new Map(),
        exportNames: [],
        json: isJson(file.text.replace(/^\uFEFF/, "")) ? file.text : undefined,
      });
      return;
    }
    const text = file.text;
    const kind = file.kind;
    const written = file.written;
    const sourceFile = file.sourceFile;
    if (path === entry) rejectEarlyErrors(sourceFile, nodeParse);
    const isRejected = path !== entry && kind !== "script" && hasEarlyError(sourceFile, nodeParse);
    // The candidates of the file's directory, each requested as an import() of "./" and its name
    // would request it, which Node's resolution finds as it finds the file of a literal's.
    const directory = path.slice(0, path.lastIndexOf("/"));
    const candidates = isRejected
      ? []
      : (host.candidates ?? []).flatMap((candidate) => {
          if (candidate.slice(0, candidate.lastIndexOf("/")) !== directory) return [];
          const call = ts.createSourceFile(
            path,
            `import(${JSON.stringify(`./${candidate.slice(directory.length + 1)}`)})`,
            ts.ScriptTarget.ESNext,
            true,
          ).statements[0];
          const literal =
            ts.isExpressionStatement(call) && isImportCall(call.expression)
              ? call.expression.arguments[0]
              : undefined;
          return literal !== undefined && ts.isStringLiteral(literal)
            ? [[literal.text, literal] as const]
            : [];
        });
    const requested = new Map([...written, ...candidates]);
    // A require that never runs, where the files are pruned, loads nothing.
    const isDead = (call: ts.CallExpression) => isPruned && isDeadCode(call, false, system);
    const targets = new Map(
      [...(isRejected ? [] : getSpecifiers(sourceFile, kind, isDead)), ...candidates].flatMap(
        ([specifier, parsed]) => {
          const literal = requested.get(specifier);
          const builtin =
            literal !== undefined && kind === "module" && !ts.isCallExpression(literal.parent)
              ? getAsyncHooksSpecifier(literal)
              : undefined;
          if (builtin !== undefined) {
            if (!numbers.has(builtin)) numbers.set(builtin, numbers.size + 1);
            return [[specifier, numbers.get(builtin) ?? 0] as const];
          }
          const found = literal === undefined ? undefined : resolve(literal);
          // A CommonJS module's require of a file that isn't there stops as an import of one does,
          // where the module's code always requires it as it loads, rather than in a function, a
          // class, a branch, a loop, or a try, which may not run it, at the require in the code that
          // tla-ts parses, which Node's wrapper holds.
          if (
            found === undefined &&
            literal !== undefined &&
            kind === "commonjs" &&
            ts.isCallExpression(literal.parent) &&
            /^\.\.?\//.test(literal.text) &&
            ts.findAncestor(literal, isConditional) === undefined
          ) {
            throw new TlaTypeScriptError(`tla-ts can't load the module ${literal.text}`, parsed);
          }
          // An import() of a string that Node's resolution rejects, which the file requests no
          // other way, has the target 0, at which the host rejects the call as Node does.
          if (
            found === undefined &&
            literal !== undefined &&
            isImportCall(literal.parent) &&
            isOnlyImportCalled(sourceFile, specifier) &&
            resolveModule(literal, false).isMissing
          ) {
            return [[specifier, 0] as const];
          }
          if (found === undefined || !/\.([cm]?[jt]sx?|json)$/.test(found)) return [];
          const target = getRealPath(found);
          if (!numbers.has(target)) numbers.set(target, numbers.size + 1);
          const facade = `${target}.facade.mjs`;
          if (
            kind === "commonjs" &&
            !target.endsWith(".json") &&
            !facades.has(facade) &&
            getKind(target, getJsxText(target, readFile(target), system)) === "module"
          ) {
            facades.set(facade, target);
            numbers.set(facade, numbers.size + 1);
          }
          return [[specifier, numbers.get(target) ?? 0] as const];
        },
      ),
    );
    files.push({
      sourceFile,
      path,
      kind,
      targets,
      exportNames: kind === "commonjs" ? getWrapperNames(preparse(path, text)) : [],
      isRejected,
      names:
        candidates.length === 0 ? [] : process.getBuiltinModule("node:fs").readdirSync(directory),
    });
  };
  // The files in waves, each of the files that the waves before it request: each one prepared,
  // then parsed by V8 at once, as getNodeParses parses them, then its requests loaded in order,
  // which number the next wave's files. A file that fails to prepare stops the program where
  // loading the files before it hasn't stopped it first, as it would one file at a time.
  const loadWave = (start: number): void => {
    const wave = [...numbers.keys()].slice(start);
    if (wave.length === 0) return;
    const outcomes: ReturnType<typeof getOutcome<ReturnType<typeof prepare>>>[] = [];
    for (const path of wave) {
      const outcome = getOutcome(() => prepare(path));
      outcomes.push(outcome);
      if ("error" in outcome) break;
    }
    // V8 parses the entry, which Node runs nothing of where it fails to parse, and each other file
    // but a script, whose requests Node loads none of where it fails to parse.
    const parsed = outcomes.flatMap((outcome) =>
      "value" in outcome &&
      outcome.value.kind !== "json" &&
      (outcome.value.path === entry || outcome.value.kind !== "script")
        ? [outcome.value.sourceFile]
        : [],
    );
    const nodeParses = getNodeParses(parsed);
    for (const outcome of outcomes) {
      if ("error" in outcome) throw outcome.error;
      const file = outcome.value;
      load(file, file.kind === "json" ? undefined : nodeParses[parsed.indexOf(file.sourceFile)]);
    }
    loadWave(start + wave.length);
  };
  loadWave(0);
  const withFacades = files.map((file) => ({
    ...file,
    facade: numbers.get(`${file.path}.facade.mjs`),
  }));
  // A program that calls import() runs Node's code for it.
  const isImporting = files.some((file) => {
    const visit = (node: ts.Node): boolean =>
      isImportCall(node) || (ts.forEachChild(node, visit) ?? false);
    return visit(file.sourceFile);
  });
  return isImporting
    ? [
        ...withFacades,
        {
          sourceFile: parse(
            transpile(NODE_IMPORT, "node-import.js", false).code,
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
const NAME = String.raw`[A-Za-z_][A-Za-z0-9_]*`;

// The names that a spec's text binds below its top level, each where it binds it: a LET's
// definitions and their parameters, an operator's parameters, a quantifier's, CHOOSE's, a set's or
// a function's bound names, and LAMBDA's parameters. A definition at the top level starts its
// line; one in a LET follows LET or an indent.
const getBindings = (text: string) => {
  const list = String.raw`${NAME}(?:\s*,\s*${NAME})*`;
  const patterns = [
    new RegExp(String.raw`(?:\bLET\s+|\n[ \t]+)(${NAME})(?:\(([^()\n]*)\))?\s*==`, "g"),
    new RegExp(String.raw`^${NAME}\(([^()\n]*)\)\s*==`, "gm"),
    new RegExp(String.raw`(?:\\A|\\E|\bCHOOSE)\s+(${list})\s*(?:\\in\b|:)`, "g"),
    new RegExp(String.raw`[{[,]\s*(${NAME})\s*\\in\b`, "g"),
    new RegExp(String.raw`<<(${list})>>\s*\\in\b`, "g"),
    new RegExp(String.raw`\bLAMBDA\s+(${list})\s*:`, "g"),
  ];
  return patterns.flatMap((pattern) =>
    [...text.matchAll(pattern)].flatMap((match) =>
      match
        .slice(1)
        .flatMap((group) => (group ?? "").split(","))
        .flatMap((part) => new RegExp(String.raw`^\s*(${NAME})`).exec(part)?.[1] ?? [])
        .map((name) => ({ name, index: match.index })),
    ),
  );
};

const ENTRY_MODULE_FRAMES = [
  "ModuleJob.run (node:internal/modules/esm/module_job:569:25)",
  "async node:internal/modules/esm/loader:650:26",
  "async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:105:5)",
];

// Where Node places a file's code in a stack trace: a file URL, but for a JavaScript file that Node
// loads as CommonJS, its path; none for a script, which tla-ts doesn't know how a host runs.
const getHostFileLocation = (file: ProgramFile, system: ProgramSystem) =>
  file.kind === "script"
    ? "Empty"
    : getUnitsOf(
        file.kind === "commonjs" && !/\.[cm]?ts$/.test(file.path)
          ? system.resolvePath(file.path)
          : pathToFileURL(system.resolvePath(file.path)).href,
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
  return `HostParseDate(u) ==\n  CASE ${[...strings].map((string) => `u = ${getUnitsOf(string)} -> [found |-> TRUE, time |-> ${printCodeExpression(getNumber(parseDate(string)))}]`).join("\n    [] ")}\n    [] OTHER -> [found |-> FALSE]`;
};

// The groups of JS.tla's parts that a module runs on: its loading, linking, and evaluation, the
// promise of its evaluation, and the proxies that stand for what of the host JS.tla lacks.
const MODULE_GROUPS = new Set(["79-proxy.tla", "86-promise.tla", "88-modules.tla"]);

// Compiles a TypeScript script or module to a spec whose Init runs it as JS.tla runs a script or a
// host its entry module: the realm, then the program, then the jobs it queued. An uncaught exception
// fails Init's assertion. The spec's module ProgramCode holds the program's code and the spec's
// steps, the variables and the definitions of Init and Next, and the runtime's prepared modules
// the rest. A model gives its own steps, and the names of the functions they call, which the
// program may name nowhere else.
export const compileToJsTla = (
  source: string,
  fileName: string,
  runtime: JsTlaRuntime,
  isModule = false,
  model: JsTlaSteps = { steps: SCRIPT_STEPS, entries: [] },
  system = getHostSystem(),
): JsTlaSpec => {
  // Node reads a program's file as UTF-8, where a lone surrogate, which a string in memory may
  // hold, is U+FFFD.
  const { files, program } = atSourceLocations(fileName, system, (names) => {
    const load = (isPruned: boolean) =>
      loadFiles(source.toWellFormed(), fileName, isModule, model, names, system, isPruned);
    // The files that the program loads but those that only a require that never runs loads, where
    // a condition on process.env skips it, as the branch of a package's index for the other
    // NODE_ENV does, which holds where the program's process is Node's, whose env each file's code
    // reads as a constant. Only a CommonJS file requires. A program that fails to load so loads
    // them all, as it did before.
    const pruned = getOutcome(() => load(true));
    const loaded =
      "value" in pruned &&
      (isHostProcess(pruned.value) || !pruned.value.some((file) => file.kind === "commonjs"))
        ? pruned.value
        : load(false);
    return {
      files: loaded,
      program: specialize(
        loaded,
        new Set([...runtime.internalKeys, ...model.entries]),
        system.getEnvironmentVariable,
      ),
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
  // A module program's host globals and built-ins' properties that JS.tla's realm lacks stop where
  // its code reaches them, and a script's, where its code names them.
  const hostOnly = isModule
    ? undefined
    : (runtime.realm.scriptGlobals.find((name) => program.identifiers.has(name)) ??
      runtime.realm.builtInProperties.find((property) => program.words.has(property.key))?.key);
  if (hostOnly !== undefined) {
    throw new TlaTypeScriptError(
      `tla-ts can't run the host's ${hostOnly}, which JS.tla leaves out`,
    );
  }
  const isQueuing =
    isModule ||
    program.isAsync ||
    program.words.has("Promise") ||
    program.words.has("then") ||
    program.identifiers.has("setTimeout");
  const isIncluded = (gate: JsTlaRuntime["gates"][number]) =>
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
  // Node keeps running a program that leaves a MessagePort listening, which a model's steps call
  // on, and a program alone never ends.
  const getEnd = (tasks: string) =>
    model.entries.length === 0 && program.words.has("MessageChannel")
      ? `LET w == ${tasks} IN IF ~IsAbrupt(w) /\\ IsPortListening(w.s) THEN Assert(FALSE, "tla-ts can't end a program whose MessagePort listens, which keeps Node running") ELSE w`
      : tasks;
  // A host exits with an error where its entry module still awaits once nothing is left to run,
  // which the completion's target marks, and reports the rejection of its entry module's
  // evaluation as an uncaught exception, before any other promise's rejection, as Node does.
  const run =
    files[0].kind === "module"
      ? `RunProgram(s) == LET h == ${hostImport} IN IF IsAbrupt(h) THEN h ELSE LET p == Program(h.s) IN IF IsAbrupt(p) THEN p ELSE LET j == RunJobs(p.s) IN IF IsAbrupt(j) THEN j ELSE IF Slots(j.s, Val(p)).state = "rejected" THEN Abrupt(j.s, Completion("throw", Slots(j.s, Val(p)).result, [kind |-> "module"])) ELSE LET u == UnhandledRejection(j.s) IN IF IsAbrupt(u) THEN u ELSE LET t == ${getEnd("RunTasks(u.s)")} IN IF IsAbrupt(t) THEN t ELSE IF Slots(t.s, Val(p)).state = "pending" THEN LET e == ThrowError(t.s, "Error") IN [e EXCEPT !.c.target = [kind |-> "unsettled"]] ELSE t`
      : isModule
        ? `RunProgram(s) == LET h == ${hostImport} IN IF IsAbrupt(h) THEN h ELSE LET p == Program(h.s) IN IF IsAbrupt(p) THEN p ELSE ${runJobs} ${getEnd("RunTasks(u.s)")}`
        : hostFile !== 0
          ? `RunProgram(s) == LET h == SetupHostImport(s, ${hostFile}) IN IF IsAbrupt(h) THEN h ELSE LET p == Program(h.s) IN IF IsAbrupt(p) THEN p ELSE ${runJobs} RunTasks(u.s)`
          : isQueuing
            ? `RunProgram(s) == LET p == Program(s) IN IF IsAbrupt(p) THEN p ELSE ${runJobs} RunTasks(u.s)`
            : "RunProgram(s) == Program(s)";
  // test262's host first gives its global $262.
  const runProgram =
    model.isTest262Host === true
      ? run.replace(
          "RunProgram(s) ==",
          "RunProgram(start) == LET host == DefineContextHost262(start) IN IF IsAbrupt(host) THEN host ELSE LET s == host.s IN",
        )
      : run;
  // A host whose realm was recorded answers none of Intl's questions, as if the program asked none.
  const intl = getHostIntl(
    files.map((file) => file.sourceFile),
    runtime.realm.getLocale === undefined ? new Set<string>() : program.words,
  );
  const named = compact(
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
          // The zones of Temporal's objects and of Intl's timeZone option, which a program's code
          // names and a model's steps may pass, as the strings its parameters take.
          text:
            program.words.has("Temporal") ||
            files.some((file) => /\btimeZone\b/.test(file.sourceFile.text))
              ? getHostTimeZone(
                  [
                    ...files.map((file) => file.sourceFile.text),
                    // Each TLA+ string of the steps, on a line of its own.
                    ...(typeof model.steps === "string"
                      ? [...model.steps.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)].map((found) =>
                          JSON.stringify(found[1]),
                        )
                      : []),
                  ].join("\n"),
                  runtime.realm,
                )
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
            intl.literals,
            runtime.realm,
          ),
        },
        {
          name: "HostFileLocation",
          arity: 1,
          text: `HostFileLocation(file) ==\n  CASE ${files.map((file, index) => `file = ${index + 1} -> ${getHostFileLocation(file, system)}`).join("\n    [] ")}`,
        },
        {
          name: "HostFilePath",
          arity: 1,
          // The path of the file that the host loaded each module from, which import.meta gives.
          text: `HostFilePath(file) ==\n  CASE ${files.map((file, index) => `file = ${index + 1} -> ${file.kind === "module" ? getUnitsOf(system.resolvePath(file.path)) : "Empty"}`).join("\n    [] ")}`,
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
          text: runProgram,
        },
        {
          name: "SettleJobs",
          arity: 1,
          // The jobs, the rejections, and the tasks that a model's call leaves, which a program
          // that queues none has none of.
          text: isQueuing
            ? `SettleJobs(s) == ${runJobs.replaceAll("p.s", "s")} RunTasks(u.s)`
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
    ),
  );
  const definitions = named.map((item) => item.definition);
  const length = definitions.reduce(
    (total, definition) =>
      total +
      1 +
      (definition.tree === undefined
        ? (definition.text ?? "").length
        : getCodeLength(definition.tree)),
    -1,
  );
  if (length > MOST_CODE_CHARACTERS) {
    throw new TlaTypeScriptError(
      `tla-ts can't check a program whose TLA+ spec has more than ${MOST_CODE_CHARACTERS} characters: this program's has ${length}, which a check would parse and run past Node's default heap`,
    );
  }
  const steps = typeof model.steps === "string" ? model.steps : model.steps(files);
  // A name that the program's code and its steps define twice, or that the runtime's modules
  // declare, which TLA+ rejects as multiply defined.
  const seen = new Set<string>();
  const twice = [
    ...definitions.map((definition) => definition.name),
    ...[...steps.matchAll(/^([A-Za-z_][A-Za-z0-9_]*)(?:\([^)\n]*\))? ==/gm)].map(
      (match) => match[1],
    ),
  ].find((name) => {
    const isTwice = seen.has(name) || runtime.names.has(name);
    seen.add(name);
    return isTwice;
  });
  if (twice !== undefined) {
    throw new TlaTypeScriptError(
      `tla-ts can't name ${twice} in TLA+, which the program's spec defines twice or its runtime declares`,
    );
  }
  // A name that the runtime declares, or that the program's code or its steps define before, which
  // a LET, a parameter, or a bound of the steps binds again, as a LET of a step may bind an
  // export's name, which TLA+ rejects too.
  const defined = new Set([...runtime.names, ...definitions.map((definition) => definition.name)]);
  const stepDefinitions = new Map(
    [...steps.matchAll(/^([A-Za-z_][A-Za-z0-9_]*)(?:\([^)\n]*\))? ==/gm)]
      .toReversed()
      .map((match) => [match[1], match.index] as const),
  );
  const rebound = getBindings(steps).find(
    (binding) =>
      defined.has(binding.name) || (stepDefinitions.get(binding.name) ?? Infinity) < binding.index,
  )?.name;
  if (rebound !== undefined) {
    throw new TlaTypeScriptError(
      `tla-ts can't name ${rebound} in TLA+, which the program's spec binds again after it defines it`,
    );
  }
  // The names that the code, its steps, the modules they extend and the root read, of which the
  // runtime's view keeps the definitions.
  const names = new Set<string>();
  const addName = (name: string) => names.add(name);
  named.forEach((item) => item.names.forEach(addName));
  forEachTextName(`${steps}\n${model.reads ?? ""}\n${ROOT}\n${CONFIG}`, addName);
  const view = runtime.getView(
    [...names],
    leaves.map((leaf) => leaf.name),
  );
  const viewed = new Set(view.module.definitions.map((definition) => definition.name));
  const stubs = leaves.filter((leaf) => viewed.has(leaf.name));
  const ordered = sortDefinitions(named);
  // The module's parts in order: its text and the trees of its definitions.
  const parts = [
    "---- MODULE ProgramCode ----",
    `EXTENDS ${["ESRuntime", ...(model.extensions ?? [])].join(", ")}`,
    ...ordered.sorted
      .filter((definition) => ordered.recursive.has(definition.name))
      .map(
        (definition) =>
          `RECURSIVE ${definition.name}(${Array.from({ length: definition.arity }, () => "_").join(", ")})`,
      ),
    ...ordered.sorted.map((definition) => definition.tree ?? definition.text ?? ""),
    ...stubs.map(
      (stub) =>
        `Stub${stub.name}(${Array.from({ length: stub.arity }, (_, index) => `p${index + 1}`).join(", ")}) == Assert(FALSE, "tla-ts can't run ${stub.name}, which this program's spec leaves out of JS.tla")`,
    ),
    steps,
    ...(model.assumptions ?? []),
    "====",
    "",
  ];
  const laidOut = layOutModule("ProgramCode", parts);
  const programCode: PreparedModule = {
    name: "ProgramCode",
    get text() {
      return laidOut.getText();
    },
    tokens: [],
    module: laidOut.module,
    levels: undefined,
    texts: laidOut.texts,
  };
  return {
    name: "Program",
    source: ROOT,
    config: [CONFIG, ...stubs.map((stub) => `CONSTANT ${stub.name} <- Stub${stub.name}`), ""].join(
      "\n",
    ),
    regions: program.regions,
    loadModule: (name) => (name === "ProgramCode" ? laidOut.getText() : undefined),
    preparedModules: [...runtime.modules, view, programCode],
  };
};
