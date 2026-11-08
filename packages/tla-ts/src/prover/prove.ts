// Proves a module's obligations with tla-ts's own backends, in tlapm's order, or with tlapm.

import { TlaProverError, TlaUnsupportedError } from "../errors";
import {
  getChildren,
  getLocusPosition,
  mapHyp,
  type Expr,
  type Hyp,
  type Sequent,
} from "../obligations/expression";
import { getObligations, type PrintedObligation } from "../obligations";
import { renderDoc } from "../obligations/format";
import { formatObligation, printSequent, type PrinterOptions } from "../obligations/printer";
import { isWorkerSupported } from "../worker";
import { decide } from "./deciders";
import { createDecidePool, type DecidePool } from "./decide-pool";
import { encodeIsabelle, encodeIsabelleTheory } from "./isabelle/encode";
import { processObligation } from "./prep/action";
import { getFingerprint } from "./prep/fingerprint";
import {
  expandDefs,
  flatten,
  isTrivial,
  normalizeExpand,
  normalizeSequent,
} from "./prep/normalize";
import { findMethods, type Method } from "./prep/methods";
import { encodePtl } from "./ptl/encode";
import { encodeSmt } from "./smt/encode";
import type { EncodingSession } from "./smt/rewrite";
import { encodeZenon } from "./zenon/encode";
import type { TlapmResult } from "./tlapm/tlapm";
import { TLAPS_MODULE } from "./tlaps-module";
import type { Decision } from "./verdict";

interface ObligationBase {
  id: number;
  location: string;
  text: string;
}

export interface ProvedObligation extends ObligationBase {
  status: "proved";
  prover: string;
}

export interface TrivialObligation extends ObligationBase {
  status: "trivial";
}

export interface UnprovedObligation extends ObligationBase {
  status: "failed" | "unsupported";
  reason: string;
}

export type ProofObligation = ProvedObligation | TrivialObligation | UnprovedObligation;

export type ProofStatus = ProofObligation["status"];

export interface ProveResult {
  obligations: ProofObligation[];
  missingProofCount: number;
  omittedProofCount: number;
}

export interface ProveOptions {
  source: string;
  loadModule?: (name: string) => string | undefined;
  backend?: "tla-ts" | "tlapm";
  signal?: AbortSignal;
  onObligation?: (obligation: ProofObligation) => void;
  workers?: number;
}

// What one method concluded about an obligation, as tlapm's toolbox messages report it. proof is
// what tlapm writes in the module's theory, note what it prepends to the obligation, warning what
// Errors.warn prints, and shipped the obligation as a method that prints it gives it.
export interface ProofAttempt {
  method: Method;
  isProved: boolean;
  isReused: boolean;
  reason?: string;
  proof?: string;
  note?: string;
  errorOutput?: string;
  warning?: string;
  shipped?: string;
  timeUsedMs?: number;
}

interface ProofReport {
  obligation: ProofObligation;
  attempts: ProofAttempt[];
}

// Why a method left an obligation unproved: a prover decided so, or tla-ts couldn't try it.
interface MethodFailure {
  reason: string;
  isDecided: boolean;
}

// The SMT encoder numbers the CASE errors it standardizes across the run, so an obligation it
// encodes one in waits for every earlier obligation and starts from the count they leave.
interface ObligationTask {
  done: Promise<void>;
  session: { initial: number; current: EncodingSession } | undefined;
}

// What tlapm keeps across one run's obligations. An obligation waits for the last earlier one with
// its fingerprint, so obligations prove concurrently as they would in turn.
interface ProveRun {
  tasks: ObligationTask[];
  results: Map<string, Map<string, ProofAttempt>>;
  isFingerprinted: (obligation: PrintedObligation) => boolean;
  isProving: boolean;
  lastByFingerprint: Map<string, Promise<void>>;
  decide: DecidePool["decide"];
  settings: ProverSettings;
}

// The version tlapm names in the files it writes.
export const TLAPM_VERSION = "b91fb6c";

// What Prep.ship writes to a backend's temporary file, after Prep.normalize_expand.
interface BackendInput {
  obligation: PrintedObligation;
  sequent: Sequent;
  fingerprint: string;
  method: Method;
  session: EncodingSession;
  name: string;
  settings: ProverSettings;
  write: (text: string) => void;
}

// An encoder throws a TlaUnsupportedError for what tla-ts can't encode.
type Encoder = (input: BackendInput) => void;

// Action.process_obligation, the frontend for every backend but LS4, Isabelle included, then
// Prep.flatten unless --noflatten.
const shipFirstOrder = (sequent: Sequent, isFlattened = true) => {
  const processed = processObligation(sequent);
  return isFlattened ? flatten(processed) : processed;
};

// Util.location ~cap:false.
const getLocation = (obligation: PrintedObligation) =>
  obligation.locus
    ? `file ${JSON.stringify(obligation.locus.file)}, ${getLocusPosition(obligation.locus)}`
    : "<unknown location>";

// Prep.gen_smt_solve: the obligation as comments, the resource budget, then the encoding.
const encodeSmtProblem: Encoder = (input) => {
  const shipped = shipFirstOrder(input.sequent, input.settings.isFlattened);
  const encoding = encodeSmt(shipped, input.session, {
    version: TLAPM_VERSION,
    id: input.obligation.id,
    location: getLocation(input.obligation),
    logic: input.settings.smtLogic,
  });
  input.write(
    `;; Proof obligation:\n${renderDoc(printSequent(shipped)).replace(/^/gm, ";;\t")}\n${
      input.method.rlimit === undefined ? "" : `(set-option :rlimit ${input.method.rlimit})\n`
    }${encoding}`,
  );
};

// Each backend's encoder, and the suffix of the temporary file Prep.mk_temps writes its input to.
const BACKENDS: Record<string, { encode: Encoder; suffix: string }> = {
  smt: { encode: encodeSmtProblem, suffix: ".smt" },
  z3: { encode: encodeSmtProblem, suffix: ".smt2" },
  zenon: {
    encode: (input) =>
      input.write(
        encodeZenon(input.obligation.id, shipFirstOrder(input.sequent, input.settings.isFlattened)),
      ),
    suffix: ".znn",
  },
  isabelle: {
    encode: (input) =>
      encodeIsabelle(
        input.obligation.id,
        shipFirstOrder(input.sequent, input.settings.isFlattened),
        input.method.tactic ?? "auto",
        input.name,
        { location: getLocation(input.obligation), fingerprint: input.fingerprint },
        input.write,
      ),
    suffix: ".thy",
  },
  // Pltl.process_obligation is LS4's frontend.
  ls4: { encode: (input) => input.write(encodePtl(input.sequent)), suffix: ".ls4" },
};

// Filename.open_temp_file names a file tlapm_ and six random hexadecimal digits.
const getTemporaryName = () =>
  `tlapm_${Math.floor(Math.random() * 0x1000000)
    .toString(16)
    .padStart(6, "0")}`;

// Method.Proved: what tlapm writes after the lemma in the module's theory.
const getProof = (method: Method, input: string, decision: Decision) => {
  if (method.prover === "isabelle") return `using assms by ${method.tactic ?? "auto"}\n`;
  if (method.prover !== "zenon") return "";
  return `\n(* BEGIN ZENON INPUT\n;; zenon -p0 -x tla -oisar -max-time 1d\n${input}\nEND ZENON  INPUT *)\n${decision.output ?? ""}`;
};

// Method.Failed: what tlapm prepends to an SMT failure that answered sat or unknown.
const getNote = (method: Method, decision: Decision) =>
  (method.prover === "smt" || method.prover === "z3") &&
  decision.output !== undefined &&
  /^(sat|unknown)/.test(decision.output)
    ? `(* SMT failed with status = ${decision.output} *)\n`
    : undefined;

// The frontends and Prep.flatten add no CASE without OTHER, so the SMT encoder standardizes one
// only in an obligation that has one after Prep.normalize_expand.
const hasIncompleteCase = (expression: Expr): boolean =>
  (expression.kind === "Case" && expression.other === undefined) ||
  getChildren(expression).some(hasIncompleteCase);

const incompleteCaseHyps = new WeakMap<Hyp, boolean>();

const isIncompleteCaseHyp = (hyp: Hyp) => {
  const known = incompleteCaseHyps.get(hyp);
  if (known !== undefined) return known;
  const expressions: Expr[] = [];
  mapHyp(
    hyp,
    (inner) => {
      expressions.push(inner);
      return inner;
    },
    "all",
  );
  const isIncomplete = expressions.some(hasIncompleteCase);
  incompleteCaseHyps.set(hyp, isIncomplete);
  return isIncomplete;
};

const getModuleName = (source: string) => /-{4,}\s*MODULE\s+(\w+)/.exec(source)?.[1] ?? "Main";

const getObligationBase = (obligation: PrintedObligation): ObligationBase => ({
  id: obligation.id,
  location: obligation.location,
  text: obligation.text,
});

const getUnprovedReport = (
  obligation: PrintedObligation,
  status: "failed" | "unsupported",
  reason: string,
  attempts: ProofAttempt[] = [],
): ProofReport => ({ obligation: { ...getObligationBase(obligation), status, reason }, attempts });

// A failed obligation as tlapm prints it: Prep.normalize_expand for a new failure, and
// Toolbox.normalize, which keeps pragmas, for a reused one. After a temporal method, it marks the
// facts that hold only now.
export const formatNormalized = (
  obligation: PrintedObligation,
  isReused: boolean,
  options: PrinterOptions,
) =>
  `${formatObligation(
    isReused
      ? normalizeSequent(expandDefs(obligation.sequent, false))
      : normalizeExpand(obligation),
    options,
  )}\n`;

// The theory of the proofs Isabelle and Zenon found.
export const encodeProofTheory = (
  name: string,
  reports: ProofReport[],
  obligations: PrintedObligation[],
) =>
  encodeIsabelleTheory(
    name,
    reports.flatMap((report, index) =>
      report.attempts.flatMap((attempt) =>
        attempt.proof && !attempt.isReused
          ? [
              {
                id: report.obligation.id,
                sequent: shipFirstOrder(normalizeExpand(obligations[index])),
                proof: attempt.proof,
              },
            ]
          : [],
      ),
    ),
  );

// The text one backend receives for an obligation, for comparing with tlapm's.
export const encodeForBackend = (
  obligation: PrintedObligation,
  prover: string,
  session: EncodingSession,
) => {
  const backend = BACKENDS[prover];
  if (!backend) throw new TlaUnsupportedError(`the ${prover} backend`);
  const methods = findMethods(obligation);
  const method = methods.provers.find((candidate) => candidate.prover === prover) ?? {
    prover,
    timeLimitMs: Infinity,
  };
  const chunks: string[] = [];
  backend.encode({
    obligation,
    sequent: normalizeExpand(obligation, methods),
    fingerprint: getFingerprint(obligation.sequent),
    method,
    session,
    name: getTemporaryName(),
    settings: DEFAULT_SETTINGS,
    write: (text) => chunks.push(text),
  });
  return chunks.join("");
};

// The SMT encoder's session for an obligation, from the count of CASE errors every earlier
// obligation leaves.
const getSession = async (run: ProveRun, index: number) => {
  const task = run.tasks[index];
  if (task.session) return task.session.current;
  const earlier = run.tasks.slice(0, index);
  await Promise.all(earlier.map((innerTask) => innerTask.done));
  const initial = earlier.reduce(
    (total, innerTask) =>
      total +
      (innerTask.session ? innerTask.session.current.caseErrors - innerTask.session.initial : 0),
    0,
  );
  task.session = { initial, current: { caseErrors: initial } };
  return task.session.current;
};

// Prep.ship: the provers the step cites, or tlapm's default ones when it cites none, each tried in
// turn until one proves the obligation. Prep.already_processed reuses what a prover concluded for
// an earlier obligation with the same fingerprint: a proof, or a failure within at least as much
// time. Unless the first prover's proof is reused, a trivial obligation needs no prover.
const proveWithBackends = async (
  obligation: PrintedObligation,
  index: number,
  run: ProveRun,
  signal: AbortSignal | undefined,
): Promise<ProofReport> => {
  if (obligation.kind.kind === "Error")
    return getUnprovedReport(obligation, "failed", obligation.kind.message);
  const found = findMethods(obligation, run.settings.defaultMethods);
  // Prep.ship scales each prover's time by --stretch.
  const methods = {
    ...found,
    provers: found.provers.map((method) => ({
      ...method,
      timeLimitMs: method.timeLimitMs * run.settings.stretch,
    })),
  };
  const fingerprint = getFingerprint(obligation.sequent);
  const earlier = run.lastByFingerprint.get(fingerprint);
  run.lastByFingerprint.set(fingerprint, run.tasks[index].done);
  await earlier;
  const attempts: ProofAttempt[] = [];
  const failures: MethodFailure[] = [];
  const getProvedReport = (prover: string): ProofReport => ({
    obligation: { ...getObligationBase(obligation), status: "proved", prover },
    attempts,
  });
  // Prep.already_processed, which forgets the fingerprint's results on each call under --nofp.
  const getPrior = (method: Method) => {
    if (!run.isFingerprinted(obligation)) run.results.delete(fingerprint);
    const prior = run.results.get(fingerprint)?.get(method.prover);
    return prior?.method.tactic === method.tactic ? prior : undefined;
  };
  // Fpfile.get_timeout.
  const getBudget = (method: Method) => method.rlimit ?? method.timeLimitMs / 1000;
  const reuse = (prior: ProofAttempt) =>
    attempts.push({ ...prior, isReused: true, timeUsedMs: undefined });
  const record = (attempt: ProofAttempt) => {
    attempts.push(attempt);
    run.results.set(
      fingerprint,
      (run.results.get(fingerprint) ?? new Map()).set(attempt.method.prover, attempt),
    );
  };
  const skip = (method: Method, reason: string) => {
    attempts.push({ method, isProved: false, isReused: false, reason });
    failures.push({ reason, isDecided: false });
  };
  const firstPrior = getPrior(methods.provers[0]);
  if (firstPrior?.isProved) {
    reuse(firstPrior);
    return getProvedReport(firstPrior.method.prover);
  }
  const sequent = normalizeExpand(obligation, methods);
  // Fpfile.fp_writes keeps no trivial result, but adds the fingerprint.
  if (obligation.kind.kind === "Support" && isTrivial(sequent)) {
    run.results.set(fingerprint, run.results.get(fingerprint) ?? new Map());
    return { obligation: { ...getObligationBase(obligation), status: "trivial" }, attempts };
  }
  for (const method of methods.provers) {
    const prior = getPrior(method);
    if (prior?.isProved) {
      reuse(prior);
      return getProvedReport(method.prover);
    }
    if (prior && getBudget(prior.method) >= getBudget(method)) {
      reuse(prior);
      failures.push({
        reason: `${method.prover} failed on an obligation with the same fingerprint`,
        isDecided: true,
      });
      continue;
    }
    if (!run.isProving) continue;
    // Prep.prove_with: the Trivial method proves anything, and the Fail method nothing.
    if (method.prover === "trivial") return getProvedReport(method.prover);
    if (method.prover === "fail") {
      failures.push({ reason: "the fail method", isDecided: true });
      continue;
    }
    // tlapm no longer has Cooper's method, and prints the obligation it would have shipped.
    if (method.prover === "cooper") {
      const warning = "Cooper's method is not available any more.\n";
      record({
        method,
        isProved: false,
        isReused: false,
        warning,
        note: `\\* ${warning}\n`,
        shipped: `${formatObligation(shipFirstOrder(sequent, run.settings.isFlattened))}\n`,
      });
      failures.push({ reason: warning.trim(), isDecided: true });
      continue;
    }
    const backend = BACKENDS[method.prover];
    if (!backend) {
      skip(method, `tla-ts has no ${method.prover} backend`);
      continue;
    }
    try {
      const isCaseNumbered =
        backend.encode === encodeSmtProblem &&
        (sequent.context.some(isIncompleteCaseHyp) || hasIncompleteCase(sequent.active));
      const session = isCaseNumbered ? await getSession(run, index) : { caseErrors: 0 };
      const name = getTemporaryName();
      const file = `${name}${backend.suffix}`;
      const chunks: string[] = [];
      // Prep.mk_temps creates the file before the encoder writes to it, so a failed encoding leaves
      // the file as far as it got.
      try {
        backend.encode({
          obligation,
          sequent,
          fingerprint,
          method,
          session,
          name,
          settings: run.settings,
          write: (text) => chunks.push(text),
        });
      } catch (error) {
        if (!(error instanceof TlaProverError)) throw error;
        record({ method, isProved: false, isReused: false, reason: error.message });
        failures.push({ reason: `${method.prover} failed: ${error.message}`, isDecided: true });
        continue;
      } finally {
        run.settings.onInput?.(file, chunks.join(""));
      }
      const text = chunks.join("");
      const decision =
        method.prover === "smt" && run.settings.solveSmt
          ? await run.settings.solveSmt(file, text, method.timeLimitMs)
          : await run.decide(
              method.prover,
              text,
              { timeLimitMs: method.timeLimitMs, signal },
              index,
            );
      const isProved = decision.verdict === "unsat";
      const isTimedOut = decision.timeUsedMs >= method.timeLimitMs;
      record({
        method,
        isProved,
        isReused: false,
        ...(isProved
          ? { proof: getProof(method, text, decision) }
          : {
              reason: isTimedOut ? "timeout" : "false",
              ...(!isTimedOut && { note: getNote(method, decision) }),
            }),
        ...(decision.errorOutput !== undefined && { errorOutput: decision.errorOutput }),
        timeUsedMs: decision.timeUsedMs,
      });
      if (isProved) return getProvedReport(method.prover);
      failures.push({ reason: `${method.prover} answered ${decision.verdict}`, isDecided: true });
    } catch (error) {
      if (error instanceof TlaProverError) {
        record({ method, isProved: false, isReused: false, reason: "false" });
        failures.push({ reason: `${method.prover} failed: ${error.message}`, isDecided: true });
        continue;
      }
      if (!(error instanceof TlaUnsupportedError)) throw error;
      skip(method, `${method.prover} can't encode ${error.message}`);
    }
  }
  return getUnprovedReport(
    obligation,
    failures.some((failure) => failure.isDecided) ? "failed" : "unsupported",
    failures.map((failure) => failure.reason).join(", "),
    attempts,
  );
};

// An error that escapes proveWithBackends: what tla-ts can't handle is unsupported, and what tlapm
// refuses, as a frontend's soundness check, fails.
const getErrorReport = (obligation: PrintedObligation, error: unknown) => {
  if (error instanceof TlaUnsupportedError)
    return getUnprovedReport(obligation, "unsupported", error.message);
  if (error instanceof TlaProverError)
    return getUnprovedReport(obligation, "failed", error.message);
  throw error;
};

// tlapm's options for its backends.
interface ProverSettings {
  // --method.
  defaultMethods?: Method[];
  // --stretch.
  stretch: number;
  // --noflatten clears it.
  isFlattened: boolean;
  // --smt-logic.
  smtLogic: string;
  // Receives each temporary file a backend reads, by name, as tlapm writes it.
  onInput?: (file: string, text: string) => void;
  // --solver: decides the temporary file of the smt method in place of tla-ts's Z3.
  solveSmt?: (file: string, text: string, timeLimitMs: number) => Promise<Decision>;
}

const DEFAULT_SETTINGS: ProverSettings = { stretch: 1, isFlattened: true, smtLogic: "UFNIA" };

interface ObligationsOptions extends Partial<ProverSettings> {
  workers?: number;
  signal?: AbortSignal;
  onReport?: (report: ProofReport, obligation: PrintedObligation) => void;
  results?: Map<string, Map<string, ProofAttempt>>;
  // --nofp and --nofpl.
  isFingerprinted?: (obligation: PrintedObligation) => boolean;
  // --noproving.
  isProving?: boolean;
}

export const proveObligations = async (
  obligations: PrintedObligation[],
  options: ObligationsOptions,
) => {
  const workerCount = options.workers ?? 1;
  const pool =
    workerCount > 1 && isWorkerSupported() ? await createDecidePool(workerCount) : undefined;
  const onAbort = () => pool?.terminate(options.signal?.reason);
  options.signal?.addEventListener("abort", onAbort);
  const run: ProveRun = {
    tasks: [],
    results: options.results ?? new Map(),
    isFingerprinted: options.isFingerprinted ?? (() => true),
    isProving: options.isProving ?? true,
    lastByFingerprint: new Map(),
    decide:
      pool?.decide ?? (async (prover, text, decideOptions) => decide(prover, text, decideOptions)),
    settings: {
      defaultMethods: options.defaultMethods,
      stretch: options.stretch ?? DEFAULT_SETTINGS.stretch,
      isFlattened: options.isFlattened ?? DEFAULT_SETTINGS.isFlattened,
      smtLogic: options.smtLogic ?? DEFAULT_SETTINGS.smtLogic,
      onInput: options.onInput,
      solveSmt: options.solveSmt,
    },
  };
  // A few obligations per worker prove at once, and each reports once every earlier one has.
  const limit = pool ? workerCount * 4 : 1;
  const pending: Promise<ProofReport>[] = [];
  const isSettled: boolean[] = [];
  const running = new Set<Promise<void>>();
  const reports: ProofReport[] = [];
  const reportSettled = async () => {
    while (isSettled[reports.length]) {
      options.signal?.throwIfAborted();
      const report = await pending[reports.length];
      reports.push(report);
      options.onReport?.(report, obligations[reports.length - 1]);
      // HACK: backends on this thread run synchronously, so yield to let an abort land.
      await new Promise((resolve) => setTimeout(resolve));
    }
  };
  try {
    for (const [index, obligation] of obligations.entries()) {
      options.signal?.throwIfAborted();
      const done = Promise.withResolvers<void>();
      run.tasks.push({ done: done.promise, session: undefined });
      const report = proveWithBackends(obligation, index, run, options.signal).catch(
        (error: unknown) => getErrorReport(obligation, error),
      );
      pending.push(report);
      running.add(done.promise);
      const settle = () => {
        isSettled[index] = true;
        running.delete(done.promise);
        done.resolve();
      };
      void report.then(settle, settle);
      if (running.size >= limit) await Promise.race(running);
      await reportSettled();
    }
    await Promise.all(running);
    await reportSettled();
  } finally {
    options.signal?.removeEventListener("abort", onAbort);
    pool?.terminate(new TlaProverError("prove stopped"));
  }
  return reports;
};

const getTlapmObligation = (
  obligation: PrintedObligation,
  result: TlapmResult | undefined,
): ProofObligation => ({
  ...getObligationBase(obligation),
  ...(result ?? { status: "unsupported", reason: "tlapm reported no result" }),
});

export const prove = async (options: ProveOptions): Promise<ProveResult> => {
  const name = getModuleName(options.source);
  const modules = new Map<string, string>();
  const results = getObligations(
    [{ file: `${name}.tla`, source: options.source }],
    (moduleName) => {
      const source = options.loadModule?.(moduleName);
      if (source !== undefined) modules.set(moduleName, source);
      const loaded = source ?? (moduleName === "TLAPS" ? TLAPS_MODULE : undefined);
      return loaded === undefined ? undefined : { file: `${moduleName}.tla`, source: loaded };
    },
  );
  const obligations = results.flatMap((result) => result.obligations);
  const counts = {
    missingProofCount: results.reduce((total, result) => total + result.summary.absent.length, 0),
    omittedProofCount: results.reduce((total, result) => total + result.summary.omitted.length, 0),
  };
  if (options.backend === "tlapm") {
    if (typeof process === "undefined" || process.versions?.node === undefined)
      throw new TlaUnsupportedError("The tlapm backend runs only in Node and Bun.");
    const tlapm = await import("./tlapm/tlapm");
    const byId = new Map(obligations.map((obligation) => [obligation.id, obligation]));
    const reported = await tlapm.proveWithTlapm(
      name,
      new Map([[name, options.source], ...modules]),
      {
        signal: options.signal,
        onResult: (id, result) => {
          const obligation = byId.get(id);
          if (obligation) options.onObligation?.(getTlapmObligation(obligation, result));
        },
      },
    );
    return {
      obligations: obligations.map((obligation) =>
        getTlapmObligation(obligation, reported.get(obligation.id)),
      ),
      ...counts,
    };
  }
  const reports = await proveObligations(obligations, {
    workers: options.workers,
    signal: options.signal,
    onReport: (report) => options.onObligation?.(report.obligation),
  });
  return { obligations: reports.map((report) => report.obligation), ...counts };
};
