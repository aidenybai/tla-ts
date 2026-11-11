import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TlaUnsupportedError } from "../src/errors";
import { decidePtl } from "../src/prover/ptl/decide";
import { encodeForBackend } from "../src/prover/prove";
import { CONFORMANCE_DIRECTORY, CORPORA_DIRECTORY, getOption } from "./corpora";
import {
  getLs4Digest,
  getLs4Verdict,
  getModuleObligations,
  PROOF_INPUTS_DIRECTORY,
  readProofRecords,
} from "./proof-records";

const FIXTURES_DIRECTORY = join(CONFORMANCE_DIRECTORY, "ptl");

const TIME_LIMIT_MS = 10_000;

const listLs4Files = (directory: string): string[] =>
  existsSync(directory)
    ? readdirSync(directory, { recursive: true, encoding: "utf8" })
        .filter((path) => path.endsWith(".ls4"))
        .sort()
        .map((path) => join(directory, path))
    : [];

const isVerbose = process.argv.includes("--verbose");
const filter = getOption("--filter");

const abstraction = { match: 0, mismatch: 0, unsupported: 0, reused: 0, error: 0 };
readProofRecords()
  .filter((record) => record.ls4.length > 0)
  .forEach((record) => {
    const ids = new Set(
      record.obligations
        .filter((obligation) => "prover" in obligation && obligation.prover === "ls4")
        .map((obligation) => obligation.id),
    );
    const outcome = (() => {
      try {
        return getModuleObligations(join(CORPORA_DIRECTORY, record.id));
      } catch (error) {
        return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      }
    })();
    if (typeof outcome === "string") {
      abstraction.error++;
      console.log(`error      ${record.id}\n  ${outcome}`);
      return;
    }
    const encoded = outcome
      .filter((obligation) => ids.has(obligation.id))
      .map((obligation) => {
        try {
          return {
            id: obligation.id,
            text: encodeForBackend(obligation, "ls4", { caseErrors: 0 }),
          };
        } catch (error) {
          if (error instanceof TlaUnsupportedError) return { id: obligation.id, text: undefined };
          throw error;
        }
      });
    const refused = encoded.filter((item) => item.text === undefined).length;
    const printed = encoded.flatMap((item) =>
      item.text === undefined ? [] : [{ id: item.id, text: item.text }],
    );
    const digests = record.ls4.map((run) => run.input);
    const inputs = listLs4Files(join(PROOF_INPUTS_DIRECTORY, record.id)).map((path) =>
      readFileSync(path, "utf8"),
    );
    const getKey = (text: string) => (inputs.length === 0 ? getLs4Digest(text) : text);
    const matching = printed.reduce(
      (state, item) => {
        const index = state.unprinted.indexOf(getKey(item.text));
        return index === -1
          ? { ...state, extra: [...state.extra, item] }
          : { ...state, unprinted: state.unprinted.toSpliced(index, 1) };
      },
      {
        unprinted: inputs.length === 0 ? digests : inputs,
        extra: new Array<(typeof printed)[0]>(),
      },
    );
    const isReused = matching.extra.every((item) => digests.includes(getLs4Digest(item.text)));
    const isRefused = matching.unprinted.length <= refused;
    if (matching.extra.length === 0 && matching.unprinted.length === 0) {
      abstraction.match++;
      return;
    }
    if (isReused && isRefused) {
      if (matching.extra.length > 0) abstraction.reused++;
      else abstraction.unsupported++;
      const reused = matching.extra.map((item) => `#${item.id}`).join(", ");
      console.log(
        matching.extra.length > 0
          ? `reused     ${record.id} (${reused})`
          : `unsupported ${record.id}`,
      );
      return;
    }
    abstraction.mismatch++;
    console.log(`mismatch   ${record.id}`);
    if (!isVerbose) return;
    matching.extra.forEach((item) => console.log(`  tla-ts #${item.id}:\n${item.text}`));
    matching.unprinted.forEach((key) => console.log(`  tlapm:\n${key}`));
  });

const decision = { agree: 0, disagree: 0, unknown: 0, timeout: 0, worstMs: 0, worst: "" };
[
  ...listLs4Files(PROOF_INPUTS_DIRECTORY).filter(
    (path) => filter === undefined || path.includes(filter),
  ),
  ...listLs4Files(FIXTURES_DIRECTORY),
].forEach((path) => {
  const expected = getLs4Verdict(readFileSync(`${path}.out`, "utf8"));
  const started = performance.now();
  const actual = decidePtl(readFileSync(path, "utf8"), { timeLimitMs: TIME_LIMIT_MS });
  const elapsed = performance.now() - started;
  if (elapsed > decision.worstMs) Object.assign(decision, { worstMs: elapsed, worst: path });
  if (expected === "unknown") {
    decision.unknown++;
    console.log(`unknown    ${path} (tla-ts: ${actual})`);
    return;
  }
  if (expected === actual) {
    decision.agree++;
    return;
  }
  if (actual === "unknown") {
    decision.timeout++;
    console.log(`timeout    ${path} (LS4: ${expected})`);
    return;
  }
  decision.disagree++;
  console.log(`disagree   ${path} (LS4: ${expected}, tla-ts: ${actual})`);
});

console.log("");
console.log(
  `abstraction: ${abstraction.match} match, ${abstraction.mismatch} mismatch, ${abstraction.unsupported} unsupported, ${abstraction.reused} reused, ${abstraction.error} error`,
);
console.log(
  `decision: ${decision.agree} agree, ${decision.disagree} disagree, ${decision.timeout} timeout, ${decision.unknown} unknown`,
);
console.log(`slowest decision: ${decision.worstMs.toFixed(0)} ms (${decision.worst})`);
if (abstraction.mismatch + abstraction.error + decision.disagree + decision.timeout > 0)
  process.exitCode = 1;
