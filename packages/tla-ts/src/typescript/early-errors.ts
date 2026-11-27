import ts from "@typescript/typescript6";
import { isStackOverflow, TlaTypeScriptError } from "../errors";
import { getV8SyntaxError } from "./v8-syntax/parser";

const reject = (message: string, node: ts.Node): never => {
  throw new TlaTypeScriptError(`SyntaxError: ${message}`, node);
};

// A let or a const that is a with statement's body, which the statement's rewrite would put in a
// block. A compile gives a let that a line break follows there the semicolon that JavaScript reads
// after it, as the name let, before it parses the file.
const rejectLexicalWithBody = (node: ts.Node) => {
  if (
    !ts.isVariableStatement(node) ||
    !ts.isWithStatement(node.parent) ||
    (node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0
  ) {
    return;
  }
  reject("A declaration can't be the body of a statement", node);
};

const getNodeAt = (node: ts.Node, position: number): ts.Node =>
  ts.forEachChild(node, (child) =>
    child.getStart() <= position && position < child.getEnd()
      ? getNodeAt(child, position)
      : undefined,
  ) ?? node;

// The program that Node runs under Bun to parse a script as vm does, which prints what --check
// prints for a module: the line of the SyntaxError, then the error.
const SCRIPT_CHECK = `const vm = require("node:vm");
try {
  new vm.Script(require("node:fs").readFileSync(0, "utf8"), { filename: "[stdin]" });
} catch (error) {
  if (!(error instanceof SyntaxError)) throw error;
  console.error(error.stack.split("\\n")[0]);
  console.error("SyntaxError: " + error.message);
  process.exit(1);
}`;

// Whether V8 accepts a module's text, as vm's SourceTextModule compiles it, as the loader's
// ModuleWrap does, and runs nothing of it.
const IS_ACCEPTED = `const { SourceTextModule } = require("node:vm");
const isAccepted = (text) => {
  try {
    new SourceTextModule(text);
    return true;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return false;
  }
};`;

// The program that a Node on the path runs under Bun to parse modules as its loader does: it reads
// their texts, as JSON, and prints whether V8 accepts each one.
const MODULES_CHECK = `${IS_ACCEPTED}
console.log(JSON.stringify(JSON.parse(require("node:fs").readFileSync(0, "utf8")).map(isAccepted)));`;

// The program of a worker that parses modules as MODULES_CHECK does, for each request of texts,
// which posts whether V8 accepts each one, or nothing where V8 stops on what isn't a SyntaxError,
// as a Node that MODULES_CHECK stops prints nothing.
const MODULES_WORKER = `${IS_ACCEPTED}
require("node:worker_threads").parentPort.on("message", (request) => {
  let accepted = [];
  try {
    accepted = request.texts.map(isAccepted);
  } catch {}
  request.port.postMessage(accepted);
  Atomics.store(request.done, 0, 1);
  Atomics.notify(request.done, 0);
});`;

// Whether a file parses as a script: one of no import or export declaration, which a model's
// file, whose compile reads it as a script, is not.
const isScriptFile = (sourceFile: ts.SourceFile) =>
  sourceFile.impliedNodeFormat !== ts.ModuleKind.ESNext && !ts.isExternalModule(sourceFile);

// V8's parse of a file's JavaScript, as Node parses it as it loads the file, which runs nothing of
// it: the SyntaxError it throws and its line, or none where it accepts the file, or undefined where
// no Node is at hand. A module parses through Node's loader, as vm parses modules only under a
// flag. Bun's vm parses with JavaScriptCore, so under Bun a Node on the path parses the file.
const getNodeParse = (sourceFile: ts.SourceFile) => {
  const host = globalThis.process;
  const vm = host?.getBuiltinModule?.("node:vm");
  if (vm === undefined) return undefined;
  const isBun = host.versions.bun !== undefined;
  const isScript = isScriptFile(sourceFile);
  if (isScript && !isBun) {
    try {
      new vm.Script(sourceFile.text, { filename: sourceFile.fileName });
      return { error: undefined };
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      const line = /:(\d+)$/.exec(error.stack?.split("\n")[0] ?? "")?.[1];
      return { error: { message: error.message, line: Number(line ?? 1) } };
    }
  }
  const run = host
    .getBuiltinModule("node:child_process")
    .spawnSync(
      isBun ? "node" : host.execPath,
      isScript ? ["-e", SCRIPT_CHECK] : ["--input-type=module", "--check"],
      { input: sourceFile.text, encoding: "utf8" },
    );
  if (run.error !== undefined) return undefined;
  if (run.status === 0) return { error: undefined };
  const lines = run.stderr.split("\n");
  const message = lines.find((line) => line.startsWith("SyntaxError: "));
  const line = /:(\d+)$/.exec(lines.find((inner) => /:\d+$/.test(inner)) ?? "")?.[1];
  return message === undefined
    ? undefined
    : { error: { message: message.slice("SyntaxError: ".length), line: Number(line ?? 1) } };
};

// A worker of the Node that runs tla-ts, which parses modules as MODULES_WORKER does while the
// thread that asks it waits, or undefined where Node doesn't run tla-ts, as under Bun, whose vm
// parses with JavaScriptCore.
export const createModulesParser = () => {
  const host = globalThis.process;
  const threads = host?.getBuiltinModule?.("node:worker_threads");
  if (threads === undefined || host.versions.bun !== undefined) return undefined;
  const worker = new threads.Worker(MODULES_WORKER, {
    eval: true,
    execArgv: ["--experimental-vm-modules", "--no-warnings"],
  });
  worker.unref();
  return {
    parse: (texts: readonly string[]) => {
      const channel = new threads.MessageChannel();
      const done = new Int32Array(new SharedArrayBuffer(4));
      worker.postMessage({ texts, port: channel.port2, done }, [channel.port2]);
      Atomics.wait(done, 0, 0);
      const accepted: boolean[] = threads.receiveMessageOnPort(channel.port1)?.message ?? [];
      channel.port1.close();
      return accepted;
    },
    close: () => void worker.terminate(),
  };
};

// V8's parse of each file's JavaScript, as getNodeParse gives it, where parser, or else a Node on
// the path, parses every module at once, rather than one Node each, and only a module that it
// rejects parses again on its own, for its SyntaxError and its line, which Node's loader prints.
export const getNodeParses = (
  sourceFiles: readonly ts.SourceFile[],
  parser: ReturnType<typeof createModulesParser>,
) => {
  const host = globalThis.process;
  const modules = sourceFiles.filter((sourceFile) => !isScriptFile(sourceFile));
  const texts = modules.map((module) => module.text);
  const run =
    parser !== undefined || host?.getBuiltinModule?.("node:vm") === undefined || texts.length === 0
      ? undefined
      : host
          .getBuiltinModule("node:child_process")
          .spawnSync("node", ["--experimental-vm-modules", "--no-warnings", "-e", MODULES_CHECK], {
            input: JSON.stringify(texts),
            encoding: "utf8",
          });
  const accepted: boolean[] =
    parser !== undefined && texts.length > 0
      ? parser.parse(texts)
      : run === undefined || run.error !== undefined || run.status !== 0
        ? []
        : JSON.parse(run.stdout);
  return sourceFiles.map((sourceFile) =>
    accepted[modules.indexOf(sourceFile)] === true
      ? { error: undefined }
      : getNodeParse(sourceFile),
  );
};

// V8's parse of a file's JavaScript where no Node is at hand, as tla-ts's port of V8's parser
// gives it, which a stack too small for the file's nesting stops.
const getPortedParse = (sourceFile: ts.SourceFile) => {
  try {
    return { error: getV8SyntaxError(sourceFile.text, !isScriptFile(sourceFile)) };
  } catch (error) {
    if (!isStackOverflow(error)) throw error;
    throw new TlaTypeScriptError(
      "tla-ts can't tell whether Node rejects a file's syntax without a Node to parse it",
      sourceFile,
    );
  }
};

// Rejects programs that JavaScript rejects as it parses, as V8 does, with Node's V8 where Node is
// at hand and else with tla-ts's port of V8's parser.
export const rejectEarlyErrors = (sourceFile: ts.SourceFile, parse = getNodeParse(sourceFile)) => {
  const error = (parse ?? getPortedParse(sourceFile)).error;
  if (error !== undefined) {
    // V8 gives some errors line 0, as a rest element's initializer, so a line outside the file
    // places the error at its start.
    const lineStarts = sourceFile.getLineStarts();
    reject(error.message, getNodeAt(sourceFile, lineStarts[error.line - 1] ?? 0));
  }
  const visit = (node: ts.Node): void => {
    rejectLexicalWithBody(node);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
};
