import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import {
  CORPORA_DIRECTORY,
  findModules,
  getToolPath,
  LIBRARY_PATH,
  linkLibraryModules,
  parseToolboxMessages,
  runConcurrently,
  runProcess,
  sortById,
  writeLines,
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

const CONCURRENCY = 3;

const tlapmPath = getToolPath("TLAPM", "the tlapm binary");

const runTlapm = async (path: string) => {
  const cacheDirectory = mkdtempSync(join(tmpdir(), "tlapm-"));
  const run = await runProcess(
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
    dirname(path),
  );
  rmSync(cacheDirectory, { recursive: true, force: true });
  return run.output;
};

const getError = (output: string, messages: Map<string, string>[]) =>
  [
    ...messages
      .filter((fields) => ["warning", "error"].includes(fields.get("type") ?? ""))
      .map((fields) => (fields.get("msg") ?? "").trim()),
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
  const messages = parseToolboxMessages(output);
  if (output.includes("tlapm ending abnormally")) {
    return { id: module.id, status: "error", error: getError(output, messages) };
  }
  const obligations = messages
    .filter(
      (fields) => fields.get("type") === "obligation" && fields.get("status") === "to be proved",
    )
    .map((fields) => ({ loc: fields.get("loc") ?? "", text: (fields.get("obl") ?? "").trimEnd() }));
  return { id: module.id, status: "ok", ...(obligations.length > 0 ? { obligations } : {}) };
};

linkLibraryModules();
const modules = findModules();
const results: TlapmResult[] = [];
await runConcurrently(modules, CONCURRENCY, async (module) => {
  results.push(await recordModule(module));
  if (results.length % 100 === 0) console.log(`${results.length}/${modules.length}`);
});
writeLines(TLAPM_TEXT_PATH, sortById(results));
writeLines(
  TLAPM_PATH,
  results.map((result): TlapmDigest => ({
    ...result,
    obligations: result.obligations?.map((obligation) => ({
      loc: obligation.loc,
      text: getDigest(collapseWhitespace(obligation.text)),
      layout: getDigest(obligation.text),
    })),
  })),
);
const errors = results.filter((result) => result.status === "error").length;
const obligationCount = results.reduce((sum, result) => sum + (result.obligations?.length ?? 0), 0);
console.log(
  `recorded ${results.length} modules, ${errors} rejected by tlapm, ${obligationCount} obligations`,
);
