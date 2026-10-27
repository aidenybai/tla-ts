import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import {
  CONFORMANCE_DIRECTORY,
  CORPORA_DIRECTORY,
  findModules,
  LIBRARY_DIRECTORIES,
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

export const SANY_PATH = join(CONFORMANCE_DIRECTORY, "sany.json");

const CONCURRENCY = 3;

const jarPath = process.env.TLA2TOOLS_JAR;
if (!jarPath || !existsSync(jarPath)) {
  console.error("Set TLA2TOOLS_JAR to the path of tla2tools.jar");
  process.exit(1);
}

// SANY prints the path of the module it fails on, which differs between machines.
const getError = (output: string) =>
  output
    .replaceAll(`${CORPORA_DIRECTORY}/`, "")
    .split("\n")
    .filter((line) => line !== "ERROR: Failed to parse module.")
    .join("\n")
    .trim();

const runSany = (module: CorpusModule) =>
  new Promise<SanyResult>((resolve) => {
    const child = spawn(
      "java",
      [
        "-Xmx512m",
        "-cp",
        jarPath,
        "tla2sany.xml.XMLExporter",
        "-o",
        "-t",
        "-r",
        ...LIBRARY_DIRECTORIES.flatMap((directory) => ["-I", directory]),
        basename(module.path),
      ],
      { cwd: dirname(module.path) },
    );
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("close", (exitCode) => {
      const output = Buffer.concat(chunks).toString("utf8");
      if (exitCode !== 0) {
        resolve({ id: module.id, status: "error", error: getError(output) });
        return;
      }
      const digest = digestSany(parseXml(output), basename(module.path, ".tla"));
      const isEmpty = digest.units.length === 0 && digest.modules.length === 0;
      resolve({ id: module.id, status: "ok", ...(isEmpty ? {} : { module: digest }) });
    });
  });

const modules = findModules();
const results: SanyResult[] = [];
const queue = [...modules];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let module = queue.shift(); module; module = queue.shift()) {
      results.push(await runSany(module));
      if (results.length % 100 === 0) console.log(`${results.length}/${modules.length}`);
    }
  }),
);
results.sort((left, right) => (left.id < right.id ? -1 : 1));
writeFileSync(SANY_PATH, `[\n${results.map((result) => JSON.stringify(result)).join(",\n")}\n]\n`);
const errors = results.filter((result) => result.status === "error").length;
console.log(`recorded ${results.length} modules, ${errors} rejected by SANY`);
