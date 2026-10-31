// Compares tla-ts's SMT-LIB encoding of each obligation with the file tlapm sent to its SMT
// solver, as conformance:record-proofs recorded it. An encoding that differs only in the names of
// bound variables and fresh symbols counts as "names", when the recorded input is available. A
// difference where tlapm is wrong counts as a deviation.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TlaUnsupportedError } from "../src";
import { getObligations } from "../src/obligations";
import { encodeForBackend } from "../src/prove/prove";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY } from "./corpora";
import {
  getInputDigest,
  getModuleLoader,
  printResults,
  PROOF_INPUTS_DIRECTORY,
  readProofRecords,
} from "./proof-records";
import { getDeviation } from "./tlapm-deviations";

type Verdict = "match" | "names" | "deviation" | "mismatch" | "unsupported";

type Sexp = string | Sexp[];

const RESULTS_PATH = join(CONFORMANCE_DIRECTORY, ".smt-encode-results.json");

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

interface Result {
  module: string;
  id: number;
  verdict: Verdict;
  reason?: string;
  expected?: string;
  actual?: string;
}

// The encoding, or why tla-ts can't encode the obligation.
const getEncoding = (encode: () => string) => {
  try {
    return { kind: "smt", text: encode() } as const;
  } catch (error) {
    if (!(error instanceof TlaUnsupportedError)) throw error;
    return { kind: "unsupported", reason: error.message } as const;
  }
};

// The first command that differs once names are canonical.
const findDifference = (expected: string, actual: string) => {
  const left = canonicalize(parse(expected));
  const right = canonicalize(parse(actual));
  const index = left.findIndex((command, position) => command !== right[position]);
  if (index === -1 && left.length === right.length) return undefined;
  const position = index === -1 ? left.length : index;
  return { expected: left[position] ?? "", actual: right[position] ?? "" };
};

const results = readProofRecords()
  .filter((record) =>
    record.obligations.some((obligation) => obligation.status !== "trivial" && "smt" in obligation),
  )
  .flatMap((record): Result[] => {
    const path = join(CORPORA_DIRECTORY, record.id);
    const loadModule = getModuleLoader(path);
    const obligations = new Map(
      getObligations([{ file: path, source: readFileSync(path, "utf8") }], (name) => {
        const source = loadModule(name);
        return source === undefined ? undefined : { file: name, source };
      })
        .flatMap((result) => result.obligations)
        .map((obligation) => [obligation.id, obligation]),
    );
    // tlapm counts some names across the obligations it encodes, in order.
    const session = { caseErrors: 0 };
    return record.obligations.flatMap((expected): Result[] => {
      if (expected.status === "trivial" || !("smt" in expected) || !expected.smt) return [];
      const base = { module: record.id, id: expected.id };
      const obligation = obligations.get(expected.id);
      if (!obligation || obligation.kind.kind === "Error")
        return [{ ...base, verdict: "mismatch", reason: "tla-ts has no such obligation" }];
      const encoded = getEncoding(() => encodeForBackend(obligation, "smt", session));
      if (encoded.kind === "unsupported")
        return [{ ...base, verdict: "unsupported", reason: encoded.reason }];
      if (getInputDigest(encoded.text) === expected.smt.input)
        return [{ ...base, verdict: "match" }];
      const deviation = getDeviation(record.id, expected.id);
      if (deviation) return [{ ...base, verdict: "deviation", reason: deviation }];
      const inputPath = join(PROOF_INPUTS_DIRECTORY, record.id, `${expected.id}.smt`);
      if (!existsSync(inputPath)) return [{ ...base, verdict: "mismatch" }];
      const difference = findDifference(readFileSync(inputPath, "utf8"), encoded.text);
      return [
        difference
          ? { ...base, verdict: "mismatch", ...difference }
          : { ...base, verdict: "names" },
      ];
    });
  });

writeFileSync(RESULTS_PATH, `${JSON.stringify(results, null, 2)}\n`);
printResults(
  results,
  ["match", "names", "deviation", "mismatch", "unsupported"],
  ["deviation", "mismatch", "unsupported"],
  (result) =>
    [
      `${result.verdict} ${result.module} #${result.id}${result.reason ? `: ${result.reason}` : ""}`,
      ...(result.expected === undefined ? [] : [`  tlapm:  ${result.expected.slice(0, 300)}`]),
      ...(result.actual === undefined ? [] : [`  tla-ts: ${result.actual.slice(0, 300)}`]),
    ].join("\n"),
);
