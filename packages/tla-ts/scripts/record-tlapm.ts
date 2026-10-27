import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import {
  CONFORMANCE_DIRECTORY,
  CORPORA_DIRECTORY,
  findModules,
  getLibraryModules,
  type CorpusModule,
} from "./corpora";
import {
  collapseWhitespace,
  getDigest,
  TLAPM_PATH,
  TLAPM_TEXT_PATH,
  type TlapmDigest,
  type TlapmResult,
} from "./tlapm-digest";

const LIBRARY_PATH = join(CONFORMANCE_DIRECTORY, ".library");

const CONCURRENCY = 3;

const tlapmPath = process.env.TLAPM;
if (!tlapmPath || !existsSync(tlapmPath)) {
  console.error("Set TLAPM to the path of the tlapm binary");
  process.exit(1);
}

const runTlapm = (path: string) =>
  new Promise<string>((resolve) => {
    const cacheDirectory = mkdtempSync(join(tmpdir(), "tlapm-"));
    const child = spawn(
      tlapmPath,
      [
        "-N",
        "--printallobs",
        "--toolbox",
        "0",
        "0",
        "--cache-dir",
        cacheDirectory,
        "-I",
        LIBRARY_PATH,
        basename(path),
      ],
      { cwd: dirname(path) },
    );
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("close", () => {
      rmSync(cacheDirectory, { recursive: true, force: true });
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
  });

interface Message {
  fields: Map<string, string>;
}

// The toolbox protocol frames each message in @!!BEGIN and @!!END, one @!!key:value per line. A
// value runs until the next field, so an obligation spans several lines.
const parseMessages = (output: string): Message[] =>
  output
    .split("@!!BEGIN\n")
    .slice(1)
    .map((block) => {
      const fields = new Map<string, string>();
      const body = block.slice(0, block.indexOf("@!!END"));
      body
        .split("\n@!!")
        .map((field, index) => (index === 0 ? field.replace(/^@!!/, "") : field))
        .forEach((field) => {
          const separator = field.indexOf(":");
          fields.set(field.slice(0, separator), field.slice(separator + 1));
        });
      return { fields };
    });

// tlapm reports what failed in toolbox warnings and names the failure in its last line. Paths
// differ between machines, so they are made relative.
const getError = (output: string, messages: Message[]) =>
  [
    ...messages
      .filter((message) => ["warning", "error"].includes(message.fields.get("type") ?? ""))
      .map((message) => (message.fields.get("msg") ?? "").trim()),
    output
      .split("\n")
      .find((line) => line.includes("tlapm ending abnormally"))
      ?.trim() ?? "",
  ]
    .filter((line) => line !== "")
    .join("\n")
    .replaceAll(`${CORPORA_DIRECTORY}/`, "")
    .replaceAll(`${LIBRARY_PATH}/`, "");

const recordModule = async (module: CorpusModule): Promise<TlapmResult> => {
  const output = await runTlapm(module.path);
  const messages = parseMessages(output);
  if (output.includes("tlapm ending abnormally")) {
    return { id: module.id, status: "error", error: getError(output, messages) };
  }
  const obligations = messages
    .filter(
      (message) =>
        message.fields.get("type") === "obligation" &&
        message.fields.get("status") === "to be proved",
    )
    .map((message) => {
      return {
        loc: message.fields.get("loc") ?? "",
        text: (message.fields.get("obl") ?? "").trimEnd(),
      };
    });
  return { id: module.id, status: "ok", ...(obligations.length > 0 ? { obligations } : {}) };
};

rmSync(LIBRARY_PATH, { recursive: true, force: true });
mkdirSync(LIBRARY_PATH);
getLibraryModules().forEach((path, name) => symlinkSync(path, join(LIBRARY_PATH, `${name}.tla`)));
const modules = findModules();
const results: TlapmResult[] = [];
const queue = [...modules];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let module = queue.shift(); module; module = queue.shift()) {
      results.push(await recordModule(module));
      if (results.length % 100 === 0) console.log(`${results.length}/${modules.length}`);
    }
  }),
);
results.sort((left, right) => (left.id < right.id ? -1 : 1));
const toLine = (result: TlapmResult | TlapmDigest) => JSON.stringify(result);
writeFileSync(TLAPM_TEXT_PATH, `[\n${results.map(toLine).join(",\n")}\n]\n`);
const digests = results.map((result): TlapmDigest => ({
  ...result,
  ...(result.obligations && {
    obligations: result.obligations.map((obligation) => ({
      loc: obligation.loc,
      text: getDigest(collapseWhitespace(obligation.text)),
      layout: getDigest(obligation.text),
    })),
  }),
}));
writeFileSync(TLAPM_PATH, `[\n${digests.map(toLine).join(",\n")}\n]\n`);
const errors = results.filter((result) => result.status === "error").length;
const obligationCount = results.reduce((sum, result) => sum + (result.obligations?.length ?? 0), 0);
console.log(
  `recorded ${results.length} modules, ${errors} rejected by tlapm, ${obligationCount} obligations`,
);
