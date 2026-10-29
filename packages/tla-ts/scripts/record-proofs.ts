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
  getLs4Digest,
  getLs4Verdict,
  getSmtDigest,
  getSmtVerdict,
  getZenonDigest,
  getZenonVerdict,
  PROOF_INPUTS_DIRECTORY,
  PROOFS_PATH,
  type BackendRecord,
  type ModuleProofRecord,
  type ObligationRecord,
} from "./proof-records";

const LIBRARY_PATH = join(CONFORMANCE_DIRECTORY, ".library");

// Each tlapm runs its backends on one thread, so a busy machine doesn't push proofs past their
// time limits.
const CONCURRENCY = Math.max(1, Math.floor(availableParallelism() / 2));

const HAS_PROOF = /\b(PROOF|BY|OBVIOUS|OMITTED)\b/;

const OBLIGATION_HEADER = /^;; (?:Proof obligation|obligation) #(\d+)/im;

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
        "--cleanfp",
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

const readOutput = (path: string) =>
  existsSync(`${path}.out`) ? readFileSync(`${path}.out`, "utf8") : "";

const recordModule = async (module: CorpusModule): Promise<ModuleProofRecord> => {
  const cacheDirectory = mkdtempSync(join(tmpdir(), "tlapm-proofs-"));
  const output = await runTlapm(module.path, cacheDirectory);
  const inputsDirectory = join(PROOF_INPUTS_DIRECTORY, module.id);
  rmSync(inputsDirectory, { recursive: true, force: true });
  mkdirSync(inputsDirectory, { recursive: true });

  // tlapm sends a message each time an obligation's status changes, so later fields win.
  const obligations = new Map<number, ObligationRecord>();
  parseMessages(output)
    .filter((fields) => fields.get("type") === "obligation")
    .forEach((fields) => {
      const id = Number(fields.get("id"));
      const previous = obligations.get(id) ?? { id, loc: "", status: "" };
      const timeUsed = fields.get("meth")?.match(/time-used: ([\d.]+)/)?.[1];
      obligations.set(id, {
        ...previous,
        loc: fields.get("loc") ?? previous.loc,
        status: fields.get("status") ?? previous.status,
        ...(fields.has("prover") && { prover: fields.get("prover") }),
        ...(timeUsed !== undefined && { timeUsed: Number(timeUsed) }),
      });
    });

  const files = listFiles(cacheDirectory);
  const getBackendRecords = (
    extension: string,
    getInputDigest: (text: string) => string,
    getVerdict: (output: string) => BackendRecord["verdict"],
  ) =>
    files
      .filter((path) => path.endsWith(extension))
      .map((path) => ({ path, text: readFileSync(path, "utf8") }))
      // tlapm sometimes leaves an empty input behind, which belongs to no obligation.
      .filter((file) => file.text !== "")
      .map((file) => {
        const backendOutput = readOutput(file.path);
        return {
          obligationId: Number(file.text.match(OBLIGATION_HEADER)?.[1] ?? Number.NaN),
          text: file.text,
          backendOutput,
          record: { input: getInputDigest(file.text), verdict: getVerdict(backendOutput) },
        };
      });

  const smtRuns = getBackendRecords(".smt", getSmtDigest, getSmtVerdict);
  const zenonRuns = getBackendRecords(".znn", getZenonDigest, getZenonVerdict);
  const ls4Runs = getBackendRecords(".ls4", getLs4Digest, getLs4Verdict).sort((left, right) =>
    left.record.input < right.record.input ? -1 : 1,
  );
  smtRuns.forEach((run) => {
    const obligation = obligations.get(run.obligationId);
    if (obligation) obligation.smt = run.record;
    writeFileSync(join(inputsDirectory, `${run.obligationId}.smt`), run.text);
    writeFileSync(join(inputsDirectory, `${run.obligationId}.smt.out`), run.backendOutput);
  });
  zenonRuns.forEach((run) => {
    const obligation = obligations.get(run.obligationId);
    if (obligation) obligation.zenon = run.record;
    writeFileSync(join(inputsDirectory, `${run.obligationId}.znn`), run.text);
    writeFileSync(join(inputsDirectory, `${run.obligationId}.znn.out`), run.backendOutput);
  });
  ls4Runs.forEach((run, index) => {
    writeFileSync(join(inputsDirectory, `${index}.ls4`), run.text);
    writeFileSync(join(inputsDirectory, `${index}.ls4.out`), run.backendOutput);
  });
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
const modules = findModules().filter((module) => HAS_PROOF.test(readFileSync(module.path, "utf8")));
const results: ModuleProofRecord[] = [];
const queue = [...modules];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let module = queue.shift(); module; module = queue.shift()) {
      results.push(await recordModule(module));
      console.log(`${results.length}/${modules.length} ${module.id}`);
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
