import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import {
  CONFORMANCE_DIRECTORY,
  findModules,
  getLibraryModules,
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

const LIBRARY_PATH = join(CONFORMANCE_DIRECTORY, ".library");

// Each tlapm runs its backends on one thread, so a busy machine doesn't push proofs past their
// time limits.
const CONCURRENCY = Math.max(1, Math.floor(availableParallelism() / 2));

const HAS_PROOF = /\b(PROOF|BY|OBVIOUS|OMITTED)\b/;

const OBLIGATION_HEADER = /^(?:;; (?:Proof obligation|obligation) #|lemma ob')(\d+)/im;

const tlapmPath = process.env.TLAPM;
if (!tlapmPath || !existsSync(tlapmPath)) {
  console.error("Set TLAPM to the path of the tlapm binary");
  process.exit(1);
}

// --debug tempfiles keeps every file tlapm sends to a backend, next to the backend's output.
const runTlapm = (path: string, cacheDirectory: string) =>
  new Promise<string>((resolve) => {
    const child = spawn(
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
        basename(path),
      ],
      { cwd: dirname(path) },
    );
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("close", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });

// The toolbox protocol frames each message in @!!BEGIN and @!!END, one @!!key:value per line.
const parseMessages = (output: string) =>
  output
    .split("@!!BEGIN\n")
    .slice(1)
    .map((block) => {
      const fields = new Map<string, string>();
      block
        .slice(0, block.indexOf("@!!END"))
        .split("\n@!!")
        .map((field, index) => (index === 0 ? field.replace(/^@!!/, "") : field))
        .forEach((field) => {
          const separator = field.indexOf(":");
          fields.set(field.slice(0, separator), field.slice(separator + 1).trim());
        });
      return fields;
    });

const listFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(directory, entry.name)) : [join(directory, entry.name)],
  );

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
  // Later lines of a reason can list this machine's PATH.
  const reason = fields.get("reason")?.split("\n")[0];
  return status === "proved"
    ? { ...decided, status }
    : { ...decided, status, ...(reason !== undefined && { reason }) };
};

const readOutput = (path: string) =>
  existsSync(`${path}.out`) ? readFileSync(`${path}.out`, "utf8") : "";

const recordModule = async (module: CorpusModule): Promise<ModuleProofRecord> => {
  const cacheDirectory = mkdtempSync(join(tmpdir(), "tlapm-proofs-"));
  const output = await runTlapm(module.path, cacheDirectory);
  const inputsDirectory = join(PROOF_INPUTS_DIRECTORY, module.id);
  rmSync(inputsDirectory, { recursive: true, force: true });
  mkdirSync(inputsDirectory, { recursive: true });

  // tlapm sends a message each time an obligation's status changes, so later fields win.
  const fieldsById = new Map<number, Map<string, string>>();
  parseMessages(output)
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
      // tlapm also writes a theory of the whole module, which no backend runs.
      .filter((path) => basename(path).startsWith("tlapm_") && path.endsWith(extension))
      .map((path) => ({ path, text: readFileSync(path, "utf8") }))
      // tlapm sometimes leaves an empty input behind, which belongs to no obligation.
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
  // SMT, Z3, Zenon and Isabelle inputs name their obligation in a header, and LS4 inputs don't.
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

  const error = output
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

rmSync(LIBRARY_PATH, { recursive: true, force: true });
mkdirSync(LIBRARY_PATH);
getLibraryModules().forEach((path, name) => symlinkSync(path, join(LIBRARY_PATH, `${name}.tla`)));
// Module ids on the command line rerecord just those modules into the existing proofs.json.
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
const queue = [...modules];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let module = queue.shift(); module; module = queue.shift()) {
      results.push(await recordModule(module));
      console.log(`${results.length - keptCount}/${modules.length} ${module.id}`);
    }
  }),
);
results.sort((left, right) => (left.id < right.id ? -1 : 1));
writeFileSync(
  PROOFS_PATH,
  `[\n${results.map((result) => JSON.stringify(result)).join(",\n")}\n]\n`,
);
const obligationCount = results.reduce((sum, result) => sum + result.obligations.length, 0);
console.log(`recorded ${results.length} modules, ${obligationCount} obligations`);
