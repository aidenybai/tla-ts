import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, getLibraryModules } from "./corpora";
import { collapseWhitespace, getDigest } from "./tlapm-digest";

export type BackendVerdict = "unsat" | "sat" | "unknown";

// One backend run: a digest of the input tlapm sent and what the backend answered. tlapm frames an
// obligation as unsat when the backend proves it. Zenon and Isabelle only ever find a proof or give up.
export interface BackendRecord<Verdict extends BackendVerdict = BackendVerdict> {
  input: string;
  verdict: Verdict;
}

// tlapm proves a trivial obligation itself, without a backend.
interface TrivialObligationRecord {
  id: number;
  loc: string;
  status: "trivial";
}

interface DecidedObligationRecord {
  id: number;
  loc: string;
  status: "proved" | "failed";
  prover: string;
  timeUsed?: number;
  smt?: BackendRecord;
  zenon?: BackendRecord<"unsat" | "unknown">;
  isabelle?: BackendRecord<"unsat" | "unknown">;
}

// tlapm stopped before a backend answered.
interface UnfinishedObligationRecord {
  id: number;
  loc: string;
  status: "to be proved" | "being proved" | "interrupted";
}

export type ObligationRecord =
  | TrivialObligationRecord
  | DecidedObligationRecord
  | UnfinishedObligationRecord;

export type ObligationStatus = ObligationRecord["status"];

// LS4 inputs don't name their obligation, so they're kept per module, in the order of their digests.
export interface ModuleProofRecord {
  id: string;
  error?: string;
  obligations: ObligationRecord[];
  ls4: BackendRecord[];
}

export const PROOFS_PATH = join(CONFORMANCE_DIRECTORY, "proofs.json");

// The backend inputs themselves take hundreds of megabytes, so only their digests are committed.
export const PROOF_INPUTS_DIRECTORY = join(CONFORMANCE_DIRECTORY, ".proofs");

// Comments carry tlapm's version and the module's path, which differ between machines.
const removeComments = (text: string) =>
  text
    .split("\n")
    .filter((line) => !line.startsWith(";"))
    .join("\n");

// Digests an SMT-LIB or Zenon input.
export const getInputDigest = (text: string) => getDigest(collapseWhitespace(removeComments(text)));

// Isabelle theories carry the module's path in comments and a hashed theory name.
export const getIsabelleDigest = (text: string) =>
  getDigest(
    collapseWhitespace(
      text.replace(/\(\*[\s\S]*?\*\)/g, "").replace(/\btlapm_[0-9a-f]+\b/g, "tlapm"),
    ),
  );

// tlapm names each atom of a PTL formula with a hash, so atoms are renumbered by first appearance.
export const getLs4Digest = (text: string) => {
  const atoms = new Map<string, string>();
  return getDigest(
    collapseWhitespace(
      text.replace(/\bh[0-9a-f]+\b/g, (atom) => {
        if (!atoms.has(atom)) atoms.set(atom, `atom${atoms.size}`);
        return atoms.get(atom) ?? atom;
      }),
    ),
  );
};

export const getSmtVerdict = (output: string): BackendVerdict => {
  const answer = output.trim().split("\n")[0];
  return answer === "unsat" || answer === "sat" ? answer : "unknown";
};

export const getZenonVerdict = (output: string): "unsat" | "unknown" =>
  output.startsWith("(* PROOF-FOUND *)") ? "unsat" : "unknown";

export const getIsabelleVerdict = (output: string): "unsat" | "unknown" =>
  output.split("\n").some((line) => line.startsWith("((TLAPS SUCCESS))")) ? "unsat" : "unknown";

export const getLs4Verdict = (output: string): BackendVerdict => {
  const answer = output.split("\n").find((line) => /^(UNSAT|SAT)\b/.test(line));
  return answer === undefined ? "unknown" : answer.startsWith("UNSAT") ? "unsat" : "sat";
};

// The records of the modules whose ids contain the --filter argument, or of every module.
export const readProofRecords = (): ModuleProofRecord[] => {
  if (!existsSync(PROOFS_PATH)) {
    console.error("Run conformance:record-proofs first");
    process.exit(1);
  }
  const index = process.argv.indexOf("--filter");
  const filter = index === -1 ? undefined : process.argv[index + 1];
  const records: ModuleProofRecord[] = JSON.parse(readFileSync(PROOFS_PATH, "utf8"));
  return records.filter((record) => filter === undefined || record.id.includes(filter));
};

const libraryModules = getLibraryModules();

const readSource = (path: string | undefined) =>
  path !== undefined && existsSync(path) ? readFileSync(path, "utf8") : undefined;

// Loads a module the corpus module at path uses, where tlapm finds it: in the module's directory,
// then the -I library, then tlapm's own standard library.
export const getModuleLoader = (path: string) => (name: string) =>
  readSource(join(dirname(path), `${name}.tla`)) ??
  readSource(libraryModules.get(name)) ??
  readSource(join(CORPORA_DIRECTORY, "tlapm/library", `${name}.tla`));

// Prints how many results have each verdict, then the ones worth a look, all of them with
// --verbose and otherwise the first 20.
export const printResults = <Result extends { verdict: string }>(
  results: Result[],
  verdicts: readonly Result["verdict"][],
  shown: Result["verdict"][],
  describe: (result: Result) => string,
) => {
  const counts = Map.groupBy(results, (result) => result.verdict);
  console.log(
    verdicts.map((verdict) => `${counts.get(verdict)?.length ?? 0} ${verdict}`).join(", "),
  );
  const listed = results.filter((result) => shown.includes(result.verdict));
  (process.argv.includes("--verbose") ? listed : listed.slice(0, 20)).forEach((result) =>
    console.log(describe(result)),
  );
};
