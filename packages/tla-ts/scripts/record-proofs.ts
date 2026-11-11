import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import {
  findModules,
  getToolPath,
  LIBRARY_PATH,
  linkLibraryModules,
  listFiles,
  parseToolboxMessages,
  runConcurrently,
  runProcess,
  sortById,
  writeLines,
  type CorpusModule,
} from "./corpora";
import {
  getIsabelleDigest,
  getIsabelleVerdict,
  getLs4Digest,
  getLs4Verdict,
  getInputDigest,
  getSmtVerdict,
  getZenonVerdict,
  PROOF_INPUTS_DIRECTORY,
  PROOFS_PATH,
  type BackendVerdict,
  type ModuleProofRecord,
  type ObligationRecord,
  type ObligationStatus,
} from "./proof-records";

const CONCURRENCY = Math.max(1, Math.floor(availableParallelism() / 2));

const HAS_PROOF = /\b(PROOF|BY|OBVIOUS|OMITTED)\b/;

const OBLIGATION_HEADER = /^(?:;; (?:Proof obligation|obligation) #|lemma ob')(\d+)/im;

const tlapmPath = getToolPath("TLAPM", "the tlapm binary");

const OBLIGATION_STATUSES = new Set<string>([
  "trivial",
  "proved",
  "failed",
  "to be proved",
  "being proved",
  "interrupted",
]);

const isObligationStatus = (status: string): status is ObligationStatus =>
  OBLIGATION_STATUSES.has(status);

const getObligationRecord = (id: number, fields: Map<string, string>): ObligationRecord => {
  const loc = fields.get("loc") ?? "";
  const status = fields.get("status") ?? "";
  if (!isObligationStatus(status)) throw new Error(`tlapm sent unknown status "${status}"`);
  if (status !== "proved" && status !== "failed") return { id, loc, status };
  const timeUsed = fields.get("meth")?.match(/time-used: ([\d.]+)/)?.[1];
  const decided = {
    id,
    loc,
    prover: fields.get("prover") ?? "",
    ...(timeUsed !== undefined && { timeUsed: Number(timeUsed) }),
  };
  const reason = fields.get("reason")?.split("\n")[0];
  return status === "proved"
    ? { ...decided, status }
    : { ...decided, status, ...(reason !== undefined && { reason }) };
};

const readOutput = (path: string) =>
  existsSync(`${path}.out`) ? readFileSync(`${path}.out`, "utf8") : "";

const recordModule = async (module: CorpusModule): Promise<ModuleProofRecord> => {
  const cacheDirectory = mkdtempSync(join(tmpdir(), "tlapm-proofs-"));
  const run = await runProcess(
    tlapmPath,
    [
      "--toolbox",
      "0",
      "0",
      "--threads",
      "1",
      "--nofp",
      "--debug",
      "tempfiles",
      "--cache-dir",
      cacheDirectory,
      "-I",
      LIBRARY_PATH,
      basename(module.path),
    ],
    dirname(module.path),
  );
  const inputsDirectory = join(PROOF_INPUTS_DIRECTORY, module.id);
  rmSync(inputsDirectory, { recursive: true, force: true });
  mkdirSync(inputsDirectory, { recursive: true });

  const fieldsById = new Map<number, Map<string, string>>();
  parseToolboxMessages(run.output)
    .map(
      (fields) =>
        new Map([...fields].map(([name, value]): [string, string] => [name, value.trim()])),
    )
    .filter((fields) => fields.get("type") === "obligation")
    .forEach((fields) => {
      const id = Number(fields.get("id"));
      fieldsById.set(id, new Map([...(fieldsById.get(id) ?? []), ...fields]));
    });
  const obligations = new Map(
    [...fieldsById].map(([id, fields]) => [id, getObligationRecord(id, fields)]),
  );

  const files = listFiles(cacheDirectory);
  const getBackendRecords = <Verdict extends BackendVerdict>(
    extension: string,
    getDigest: (text: string) => string,
    getVerdict: (output: string) => Verdict,
  ) =>
    files
      .filter((path) => basename(path).startsWith("tlapm_") && path.endsWith(extension))
      .map((path) => ({ path, text: readFileSync(path, "utf8") }))
      .filter((file) => file.text !== "")
      .map((file) => {
        const backendOutput = readOutput(file.path);
        return {
          ...file,
          backendOutput,
          record: { input: getDigest(file.text), verdict: getVerdict(backendOutput) },
        };
      });
  const saveRun = (
    name: string,
    extension: string,
    run: { text: string; backendOutput: string },
  ) => {
    writeFileSync(join(inputsDirectory, `${name}${extension}`), run.text);
    writeFileSync(join(inputsDirectory, `${name}${extension}.out`), run.backendOutput);
  };
  const getObligationRuns = <Verdict extends BackendVerdict>(
    extension: string,
    getDigest: (text: string) => string,
    getVerdict: (output: string) => Verdict,
  ) =>
    getBackendRecords(extension, getDigest, getVerdict).map((run) => {
      const header = run.text.match(OBLIGATION_HEADER);
      if (!header) throw new Error(`${run.path} doesn't name its obligation`);
      saveRun(header[1], extension, run);
      const obligation = obligations.get(Number(header[1]));
      return { obligation: obligation && "prover" in obligation ? obligation : undefined, ...run };
    });

  getObligationRuns(".smt", getInputDigest, getSmtVerdict).forEach((run) => {
    if (run.obligation) run.obligation.smt = run.record;
  });
  getObligationRuns(".smt2", getInputDigest, getSmtVerdict).forEach((run) => {
    if (run.obligation) run.obligation.z3 = run.record;
  });
  getObligationRuns(".znn", getInputDigest, getZenonVerdict).forEach((run) => {
    if (run.obligation) run.obligation.zenon = run.record;
  });
  getObligationRuns(".thy", getIsabelleDigest, getIsabelleVerdict).forEach((run) => {
    if (run.obligation) run.obligation.isabelle = run.record;
  });
  const ls4Runs = getBackendRecords(".ls4", getLs4Digest, getLs4Verdict).sort((left, right) =>
    left.record.input < right.record.input ? -1 : 1,
  );
  ls4Runs.forEach((run, index) => saveRun(String(index), ".ls4", run));
  rmSync(cacheDirectory, { recursive: true, force: true });

  const error = run.output
    .split("\n")
    .find((line) => line.includes("tlapm ending abnormally"))
    ?.trim();
  return {
    id: module.id,
    ...(error !== undefined && { error }),
    obligations: [...obligations.values()].sort((left, right) => left.id - right.id),
    ls4: ls4Runs.map((run) => run.record),
  };
};

linkLibraryModules();
const moduleIds = new Set(process.argv.slice(2));
const modules = findModules().filter((module) =>
  moduleIds.size > 0 ? moduleIds.has(module.id) : HAS_PROOF.test(readFileSync(module.path, "utf8")),
);
const results: ModuleProofRecord[] =
  moduleIds.size > 0
    ? JSON.parse(readFileSync(PROOFS_PATH, "utf8")).filter(
        (record: ModuleProofRecord) => !moduleIds.has(record.id),
      )
    : [];
const keptCount = results.length;
await runConcurrently(modules, CONCURRENCY, async (module) => {
  results.push(await recordModule(module));
  console.log(`${results.length - keptCount}/${modules.length} ${module.id}`);
});
writeLines(PROOFS_PATH, sortById(results));
const obligationCount = results.reduce((sum, result) => sum + result.obligations.length, 0);
console.log(`recorded ${results.length} modules, ${obligationCount} obligations`);
