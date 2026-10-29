// Compares tla-ts's SMT-LIB encoding of each obligation with the file tlapm sent to its SMT
// solver, as conformance:record-proofs recorded it. An encoding that differs only in the names of
// bound variables and fresh symbols counts as "names", when the recorded input is available.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { encodeObligation } from "../src/obligation-smt";
import { getObligations } from "../src/obligations";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, getLibraryModules } from "./corpora";
import {
  getSmtDigest,
  PROOF_INPUTS_DIRECTORY,
  PROOFS_PATH,
  type ModuleProofRecord,
} from "./proof-records";

type Verdict = "match" | "names" | "mismatch" | "unsupported";

type Sexp = string | Sexp[];

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".smt-encode-results.json");

const libraryModules = getLibraryModules();

// tlapm searches the module's directory, then the -I library, then its own standard library.
const TLAPM_LIBRARY = join(CORPORA_DIRECTORY, "tlapm/library");

const KEYWORDS = new Set([
  "forall",
  "exists",
  "let",
  "!",
  "and",
  "or",
  "not",
  "=>",
  "=",
  "distinct",
  "ite",
  "true",
  "false",
  "Bool",
  "Int",
  "Idv",
  "+",
  "-",
  "*",
  "div",
  "mod",
  "<=",
  "<",
  ">=",
  ">",
  "assert",
  "declare-fun",
  "declare-sort",
  "set-logic",
  "check-sat",
  "exit",
  "UFNIA",
]);

const isFresh = (atom: string) =>
  !KEYWORDS.has(atom) &&
  !atom.startsWith(":") &&
  !/^\d+$/.test(atom) &&
  (!atom.startsWith("smt__TLA____") || /flatnd|Anon__/.test(atom));

const parse = (text: string): Sexp[] => {
  const tokens = text.replace(/;[^\n]*/g, "").match(/\|[^|]*\||[()]|[^\s()|]+/g) ?? [];
  const stack: Sexp[][] = [[]];
  tokens.forEach((token) => {
    if (token === "(") return stack.push([]);
    if (token === ")") {
      const done = stack.pop() ?? [];
      return stack.at(-1)?.push(done);
    }
    stack.at(-1)?.push(token);
  });
  return stack[0];
};

const print = (sexp: Sexp): string =>
  typeof sexp === "string" ? sexp : `(${sexp.map(print).join(" ")})`;

// Renames bound variables by their depth and the other fresh names by first use, and orders the
// declarations, which tlapm and tla-ts may interleave differently.
const canonicalize = (commands: Sexp[]) => {
  const names = new Map<string, string>();
  const state = { isNaming: true };
  const rename = (sexp: Sexp, bound: Map<string, string>): Sexp => {
    if (typeof sexp === "string") {
      if (bound.has(sexp)) return bound.get(sexp) ?? sexp;
      if (!isFresh(sexp)) return sexp;
      if (!names.has(sexp) && state.isNaming) names.set(sexp, `$${names.size + 1}`);
      return names.get(sexp) ?? "$_";
    }
    if ((sexp[0] === "forall" || sexp[0] === "exists") && Array.isArray(sexp[1])) {
      const inner = new Map(bound);
      const binders = sexp[1].map((binder) => {
        if (!Array.isArray(binder) || typeof binder[0] !== "string") return binder;
        const name = `?${inner.size}`;
        inner.set(binder[0], name);
        return [name, ...binder.slice(1)];
      });
      return [sexp[0], binders, ...sexp.slice(2).map((item) => rename(item, inner))];
    }
    return sexp.map((item) => rename(item, bound));
  };
  const isCommand = (command: Sexp, name: string) => Array.isArray(command) && command[0] === name;
  const assertions = commands
    .filter((command) => isCommand(command, "assert"))
    .map((command) => print(rename(command, new Map())));
  state.isNaming = false;
  const declarations = commands
    .filter((command) => isCommand(command, "declare-fun"))
    .map((command) => print(rename(command, new Map())))
    .toSorted();
  return [...declarations, ...assertions];
};

const readModule = (path: string | undefined) =>
  path !== undefined && existsSync(path)
    ? { file: path, source: readFileSync(path, "utf8") }
    : undefined;

interface Result {
  module: string;
  id: number;
  verdict: Verdict;
  reason?: string;
  expected?: string;
  actual?: string;
}

// The first command that differs once names are canonical.
const findDifference = (expected: string, actual: string) => {
  const left = canonicalize(parse(expected));
  const right = canonicalize(parse(actual));
  const index = left.findIndex((command, position) => command !== right[position]);
  if (index === -1 && left.length === right.length) return undefined;
  const position = index === -1 ? left.length : index;
  return { expected: left[position] ?? "", actual: right[position] ?? "" };
};

const filter = process.argv.includes("--filter")
  ? process.argv[process.argv.indexOf("--filter") + 1]
  : undefined;
const isVerbose = process.argv.includes("--verbose");
if (!existsSync(PROOFS_PATH)) {
  console.error("Run conformance:record-proofs first");
  process.exit(1);
}
const records: ModuleProofRecord[] = JSON.parse(readFileSync(PROOFS_PATH, "utf8"));
const results = records
  .filter((record) => filter === undefined || record.id.includes(filter))
  .filter((record) => record.obligations.some((obligation) => obligation.smt))
  .flatMap((record): Result[] => {
    const path = join(CORPORA_DIRECTORY, record.id);
    const obligations = new Map(
      getObligations(
        [{ file: path, source: readFileSync(path, "utf8") }],
        (name) =>
          readModule(join(dirname(path), `${name}.tla`)) ??
          readModule(libraryModules.get(name)) ??
          readModule(join(TLAPM_LIBRARY, `${name}.tla`)),
      )
        .flatMap((result) => result.obligations)
        .map((obligation) => [obligation.id, obligation]),
    );
    // tlapm counts some names across the obligations it encodes, in order.
    const session = { caseErrors: 0 };
    return record.obligations.flatMap((expected): Result[] => {
      if (!expected.smt) return [];
      const base = { module: record.id, id: expected.id };
      const obligation = obligations.get(expected.id);
      if (!obligation || obligation.kind.kind === "Error")
        return [{ ...base, verdict: "mismatch", reason: "tla-ts has no such obligation" }];
      const encoding = encodeObligation(obligation.sequent, obligation.kind, session).encoding;
      if (encoding.kind === "trivial")
        return [{ ...base, verdict: "mismatch", reason: "tla-ts finds it trivial" }];
      if (encoding.kind === "unsupported")
        return [{ ...base, verdict: "unsupported", reason: encoding.reason }];
      if (getSmtDigest(encoding.script) === expected.smt.input)
        return [{ ...base, verdict: "match" }];
      const inputPath = join(PROOF_INPUTS_DIRECTORY, record.id, `${expected.id}.smt`);
      if (!existsSync(inputPath)) return [{ ...base, verdict: "mismatch" }];
      const difference = findDifference(readFileSync(inputPath, "utf8"), encoding.script);
      return [
        difference
          ? { ...base, verdict: "mismatch", ...difference }
          : { ...base, verdict: "names" },
      ];
    });
  });

writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
const counts = Map.groupBy(results, (result) => result.verdict);
console.log(
  (["match", "names", "mismatch", "unsupported"] as const)
    .map((verdict) => `${counts.get(verdict)?.length ?? 0} ${verdict}`)
    .join(", "),
);
const shown = results.filter(
  (result) => result.verdict === "mismatch" || result.verdict === "unsupported",
);
(isVerbose ? shown : shown.slice(0, 20)).forEach((result) => {
  console.log(
    `${result.verdict} ${result.module} #${result.id}${result.reason ? `: ${result.reason}` : ""}`,
  );
  if (result.expected !== undefined) console.log(`  tlapm:  ${result.expected.slice(0, 300)}`);
  if (result.actual !== undefined) console.log(`  tla-ts: ${result.actual.slice(0, 300)}`);
});
