import { join } from "node:path";
import { CONFORMANCE_DIRECTORY } from "./corpora";
import { collapseWhitespace, getDigest } from "./tlapm-digest";

export type BackendVerdict = "unsat" | "sat" | "unknown";

// One backend run: a digest of the input tlapm sent and what the backend answered. tlapm frames an
// obligation as unsat when the backend proves it.
export interface BackendRecord {
  input: string;
  verdict: BackendVerdict;
}

export interface ObligationRecord {
  id: number;
  loc: string;
  status: string;
  prover?: string;
  timeUsed?: number;
  smt?: BackendRecord;
  zenon?: BackendRecord;
}

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

export const getSmtDigest = (text: string) => getDigest(collapseWhitespace(removeComments(text)));

export const getZenonDigest = (text: string) => getDigest(collapseWhitespace(removeComments(text)));

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

export const getZenonVerdict = (output: string): BackendVerdict =>
  output.startsWith("(* PROOF-FOUND *)") ? "unsat" : "unknown";

export const getLs4Verdict = (output: string): BackendVerdict => {
  const answer = output.split("\n").find((line) => /^(UNSAT|SAT)\b/.test(line));
  return answer === undefined ? "unknown" : answer.startsWith("UNSAT") ? "unsat" : "sat";
};
