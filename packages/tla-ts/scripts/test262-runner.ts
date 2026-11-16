import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import {
  Agent,
  ContainsArguments,
  FunctionKind,
  ManagedRealm,
  setSurroundingAgent,
  Token,
  wrappedParse,
} from "@engine262/engine262";
import type { Parser } from "@engine262/engine262";
import { parseConfig } from "../src/config";
import { createEnvironment } from "../src/environment";
import { evaluate, bindValue, evaluateStartupDefinitions, getDefinition } from "../src/evaluate";
import { createTlcOrder } from "../src/tlc/order";
import {
  ANY_SET,
  applyFunction,
  createRecord,
  createTuple,
  formatValue,
  getSequenceElements,
  isEnumeratedSet,
  rankString,
  setStringOrder,
} from "../src/values";
import type { LazyFunctionValue, Value } from "../src/values";
import { CORPORA_DIRECTORY } from "./corpora";
import { allowAnnexB } from "./test262-annex-b";
import { createConverter, getCodeUnits } from "./test262-parse-node";

const ECMASCRIPT_DIRECTORY = join(import.meta.dirname, "../ecmascript");
export const TEST262_DIRECTORY = join(CORPORA_DIRECTORY, "test262");

export const getTestId = (path: string) => relative(join(TEST262_DIRECTORY, "test"), path);

interface Metadata {
  includes: string[];
  flags: string[];
  negative: { phase: string; type: string } | undefined;
}

export interface TestRun {
  id: string;
  isPassed: boolean;
  reason: string;
}

const getMetadata = (source: string): Metadata => {
  const frontmatter = /\/\*---([\s\S]*?)---\*\//.exec(source)?.[1] ?? "";
  const getList = (key: string) => {
    const inline = new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, "m").exec(frontmatter);
    if (inline)
      return inline[1]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const block = new RegExp(`^${key}:\\s*\\n((?:\\s+-.*\\n?)*)`, "m").exec(frontmatter);
    return block ? [...block[1].matchAll(/-\s*(\S+)/g)].map((match) => match[1]) : [];
  };
  const negative = /^negative:\s*\n\s+phase:\s*(\S+)\s*\n\s+type:\s*(\S+)/m.exec(frontmatter);
  return {
    includes: getList("includes"),
    flags: getList("flags"),
    negative: negative ? { phase: negative[1], type: negative[2] } : undefined,
  };
};

const getField = (record: Value, name: string) => applyFunction(record, name);

const decodeUnits = (value: Value) =>
  String.fromCharCode(...(getSequenceElements(value) ?? []).map(Number));

export const createRunner = () => {
  const loadModule = (name: string) => {
    try {
      return readFileSync(join(ECMASCRIPT_DIRECTORY, `${name}.tla`), "utf8");
    } catch {
      return undefined;
    }
  };
  const config = parseConfig("CONSTANTS None = None Empty = Empty Absent = Absent");
  const source = "---- MODULE Test262 ----\nEXTENDS ESCore\n====";
  const order = createTlcOrder(source, loadModule);
  setStringOrder(order.getStringOrder(config));
  const specification = createEnvironment(config, {
    source,
    loadModule,
    order,
    print: () => {},
    files: { readFile: undefined, writeFile: undefined, makeDirectory: undefined },
  });
  const environment = specification.environment;
  evaluateStartupDefinitions(specification.startupDefinitions, environment);
  const none = environment.constants.get("None");
  if (none === undefined) throw new Error("ESCore declares no constant None");
  const convert = createConverter(none);
  const callDefinition = (name: string, args: Value[]) => {
    const definition = getDefinition(name, environment);
    if (definition?.kind !== "Operator") throw new Error(`ESCore defines no operator ${name}`);
    const scope = definition.params.reduce<ReturnType<typeof bindValue> | undefined>(
      (current, param, index) => bindValue(current, param.name, args[index]),
      undefined,
    );
    return evaluate(definition.body, { environment, scope, state: undefined, next: undefined });
  };

  const isPatternValid = (pattern: string) =>
    getField(callDefinition("ParsePattern", [getCodeUnits(pattern), false, false]), "ok") === true;

  setSurroundingAgent(new Agent({ features: ["decorators"] }));
  const realm = new ManagedRealm();
  const parse = (source: string, isModule: boolean) => {
    const pop = realm.pushTopContext();
    const result = wrappedParse({ source }, (parser: Parser): unknown =>
      isModule ? parser.parseModule() : allowAnnexB(parser, isPatternValid).parseScript(),
    );
    pop?.();
    return result;
  };

  const parses = new Map<string, Value>();
  const getParse = (request: Value): Value => {
    const goal = getField(request, "goal");
    if (goal === "module") {
      const specifier = decodeUnits(getField(request, "specifier"));
      const type = decodeUnits(getField(request, "type"));
      const path = join(decodeUnits(getField(request, "directory")), specifier);
      const createFailure = (error: string) =>
        createRecord([
          ["ok", false],
          ["error", rankString(error)],
        ]);
      if (specifier === "<module source>" && type === "")
        return createRecord([
          ["ok", true],
          ["id", getCodeUnits(specifier)],
          ["type", getCodeUnits("source")],
        ]);
      if (
        !specifier.startsWith("./") ||
        !existsSync(path) ||
        !["", "json", "text", "bytes"].includes(type)
      )
        return createFailure("TypeError");
      const id = getCodeUnits(`${path}#${type}`);
      if (type === "bytes")
        return createRecord([
          ["ok", true],
          ["id", id],
          ["type", getField(request, "type")],
          ["source", createTuple([...readFileSync(path)])],
        ]);
      const source = readFileSync(path, "utf8");
      if (type !== "")
        return createRecord([
          ["ok", true],
          ["id", id],
          ["type", getField(request, "type")],
          ["source", getCodeUnits(source)],
        ]);
      const tree = parse(source, true);
      return Array.isArray(tree)
        ? createFailure("SyntaxError")
        : createRecord([
            ["ok", true],
            ["id", id],
            ["type", getField(request, "type")],
            ["node", convert(tree)],
          ]);
    }
    if (goal === "script") {
      const script = parse(decodeUnits(getField(request, "source")), false);
      return Array.isArray(script)
        ? createRecord([["ok", false]])
        : createRecord([
            ["ok", true],
            ["node", convert(script)],
          ]);
    }
    if (goal === "eval") {
      const names = getField(request, "privateNames");
      const privateNames = isEnumeratedSet(names) ? names.elements.map(decodeUnits) : [];
      const pop = realm.pushTopContext();
      const script = wrappedParse(
        { source: decodeUnits(getField(request, "source")) },
        (parser: Parser) =>
          parser.scope.with(
            {
              strict: getField(request, "strict") === true,
              newTarget: getField(request, "newTarget") === true,
              superProperty: getField(request, "superProperty") === true,
              superCall: getField(request, "superCall") === true,
              private: privateNames.length > 0,
            },
            () => {
              for (const name of privateNames)
                parser.scope.privateScope?.names.set(name, new Set(["field"]));
              return allowAnnexB(parser, isPatternValid).parseScript();
            },
          ),
      );
      pop?.();
      return Array.isArray(script)
        ? createRecord([["ok", false]])
        : createRecord([
            ["ok", true],
            ["node", convert(script)],
            [
              "containsArguments",
              script.ScriptBody ? Boolean(ContainsArguments(script.ScriptBody)) : false,
            ],
          ]);
    }
    const isAsync = goal === "async" || goal === "asyncGenerator";
    const isGenerator = goal === "generator" || goal === "asyncGenerator";
    const prefix = `${isAsync ? "async " : ""}function${isGenerator ? "*" : ""}`;
    const parameters = decodeUnits(getField(request, "params"));
    const body = `\n${decodeUnits(getField(request, "body"))}\n`;
    const sourceText = `${prefix} anonymous(${parameters}\n) {${body}}`;
    const pop = realm.pushTopContext();
    const parsedParameters = wrappedParse(
      {
        source: `${" ".repeat(prefix.length + 10)}(${parameters}\n)`,
        decoratingSource: sourceText,
      },
      (parser: Parser) => {
        const result = parser.scope.with(
          {
            await: isAsync,
            yield: isGenerator,
            lexical: true,
            variable: true,
            variableFunctions: true,
            newTarget: true,
            return: true,
            label: "boundary",
          },
          () => ({ result: allowAnnexB(parser, isPatternValid).parseFormalParameters() }),
        );
        parser.expect(Token.EOS);
        return result;
      },
    );
    const parsedBody = wrappedParse(
      {
        source: `${" ".repeat(prefix.length + parameters.length + 12)}\n {${body}}`,
        decoratingSource: sourceText,
      },
      (parser: Parser) => {
        const result = parser.scope.with(
          { await: isAsync, yield: isGenerator, lexical: true, variable: true },
          () => allowAnnexB(parser, isPatternValid).parseFunctionBody(isAsync, isGenerator, false),
        );
        parser.expect(Token.EOS);
        return result;
      },
    );
    const expression = wrappedParse({ source: sourceText }, (parser: Parser) => {
      const result = allowAnnexB(parser, isPatternValid).parseFunctionExpression(
        isAsync ? FunctionKind.ASYNC : FunctionKind.NORMAL,
      );
      parser.expect(Token.EOS);
      return result;
    });
    pop?.();
    return Array.isArray(parsedParameters) || Array.isArray(parsedBody) || Array.isArray(expression)
      ? createRecord([["ok", false]])
      : createRecord([
          ["ok", true],
          ["node", convert(expression)],
        ]);
  };
  const parseTable: LazyFunctionValue = {
    kind: "LazyFunction",
    domain: ANY_SET,
    apply: (request) => {
      const key = formatValue(request);
      const known = parses.get(key);
      if (known !== undefined) return known;
      const parsed = getParse(request);
      parses.set(key, parsed);
      return parsed;
    },
  };

  const harnessResults = new Map<string, Value>();
  const getHarnessResult = (includes: string[]): Value => {
    const key = includes.join(",");
    const known = harnessResults.get(key);
    if (known) return known;
    const trees = includes.map((include) => {
      const tree = parse(readFileSync(join(TEST262_DIRECTORY, "harness", include), "utf8"), false);
      if (Array.isArray(tree)) throw new Error(`engine262 can't parse harness/${include}`);
      return convert(tree);
    });
    const result = callDefinition("HarnessResult", [createTuple(trees), parseTable]);
    harnessResults.set(key, result);
    return result;
  };

  const runTest = (includes: string[], name: string, args: Value[]): Value =>
    callDefinition(name, [getHarnessResult(includes), ...args, parseTable]);

  const runMode = (path: string, source: string, metadata: Metadata, isStrict: boolean) => {
    const isAsync = metadata.flags.includes("async");
    const isModule = metadata.flags.includes("module");
    const tree = parse(isStrict && !isModule ? `"use strict";\n${source}` : source, isModule);
    const negative = metadata.negative;
    if (Array.isArray(tree)) {
      return negative?.phase === "parse" && negative.type === "SyntaxError"
        ? undefined
        : `SyntaxError: ${String(tree[0]?.message ?? tree[0])}`;
    }
    if (negative?.phase === "parse") return "expected a parse error";
    const includes = metadata.flags.includes("raw")
      ? []
      : ["assert.js", "sta.js", ...(isAsync ? ["doneprintHandle.js"] : []), ...metadata.includes];
    const directory = getCodeUnits(dirname(path));
    const canSuspend = !metadata.flags.includes("CanBlockIsFalse");
    const result = isModule
      ? runTest(includes, "RunModuleFrom", [
          getCodeUnits(`./${basename(path)}`),
          directory,
          canSuspend,
        ])
      : runTest(includes, "RunFrom", [createTuple([convert(tree)]), directory, canSuspend]);
    const isOk = getField(result, "ok") === true;
    const name = decodeUnits(getField(result, "name"));
    const message = decodeUnits(getField(result, "message"));
    const out = (getSequenceElements(getField(result, "out")) ?? []).map(decodeUnits);
    if (negative) {
      return !isOk && name === negative.type
        ? undefined
        : isOk
          ? `expected ${negative.type}`
          : message;
    }
    if (!isOk) return message || "threw";
    if (isAsync) {
      return out.includes("Test262:AsyncTestComplete")
        ? undefined
        : (out.find((line) => line.startsWith("Test262:AsyncTestFailure")) ?? "never finished");
    }
    return undefined;
  };

  return (path: string): TestRun => {
    const id = getTestId(path);
    const source = readFileSync(path, "utf8");
    const metadata = getMetadata(source);
    const modes = metadata.flags.some((flag) => flag === "onlyStrict" || flag === "module")
      ? [true]
      : metadata.flags.includes("noStrict") || metadata.flags.includes("raw")
        ? [false]
        : [false, true];
    for (const isStrict of modes) {
      try {
        const reason = runMode(path, source, metadata, isStrict);
        if (reason !== undefined)
          return { id, isPassed: false, reason: `${isStrict ? "strict" : "sloppy"}: ${reason}` };
      } catch (error) {
        return {
          id,
          isPassed: false,
          reason: `engine error: ${process.env.TEST262_FULL ? String(error) : String(error).split("\n")[0]}`,
        };
      }
    }
    return { id, isPassed: true, reason: "" };
  };
};
