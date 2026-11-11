import { basename, dirname, join } from "node:path";
import {
  CONFORMANCE_DIRECTORY,
  CORPORA_DIRECTORY,
  findModules,
  getToolPath,
  LIBRARY_PATH,
  linkLibraryModules,
  runConcurrently,
  runProcess,
  sortById,
  writeLines,
  type CorpusModule,
} from "./corpora";
import { digestSany, type ModuleDigest } from "./proof-digest";
import { parseXml } from "./xml";

export interface SanyResult {
  id: string;
  status: "ok" | "error";
  error?: string;
  module?: ModuleDigest;
}

const SANY_PATH = join(CONFORMANCE_DIRECTORY, "sany.json");

const CONCURRENCY = 3;

const UNEXPORTABLE_CHARACTER = "XML 1.0 cannot represent that character";

const jarPath = getToolPath("TLA2TOOLS_JAR", "tla2tools.jar");

const getError = (output: string) =>
  output
    .replaceAll(`${CORPORA_DIRECTORY}/`, "")
    .split("\n")
    .filter((line) => line !== "ERROR: Failed to parse module.")
    .join("\n")
    .trim();

const runJava = (args: string[], directory: string) =>
  runProcess("java", ["-Xmx512m", "-cp", jarPath, ...args], directory);

const runSany = async (module: CorpusModule): Promise<SanyResult> => {
  const directory = dirname(module.path);
  const exported = await runJava(
    ["tla2sany.xml.XMLExporter", "-o", "-t", "-r", "-I", LIBRARY_PATH, basename(module.path)],
    directory,
  );
  if (exported.exitCode === 0) {
    const digest = digestSany(parseXml(exported.output), basename(module.path, ".tla"));
    const isEmpty = digest.units.length === 0 && digest.modules.length === 0;
    return { id: module.id, status: "ok", ...(isEmpty ? {} : { module: digest }) };
  }
  if (!exported.output.includes(UNEXPORTABLE_CHARACTER)) {
    return { id: module.id, status: "error", error: getError(exported.output) };
  }
  const checked = await runJava(
    [`-DTLA-Library=${LIBRARY_PATH}`, "tla2sany.SANY", "-error-codes", basename(module.path)],
    directory,
  );
  return checked.exitCode === 0
    ? { id: module.id, status: "ok" }
    : { id: module.id, status: "error", error: getError(checked.output) };
};

linkLibraryModules();
const modules = findModules();
const results: SanyResult[] = [];
await runConcurrently(modules, CONCURRENCY, async (module) => {
  results.push(await runSany(module));
  if (results.length % 100 === 0) console.log(`${results.length}/${modules.length}`);
});
writeLines(SANY_PATH, sortById(results));
const errors = results.filter((result) => result.status === "error").length;
console.log(`recorded ${results.length} modules, ${errors} rejected by SANY`);
