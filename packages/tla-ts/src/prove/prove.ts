// Proves a module's obligations with tla-ts's own backends, in tlapm's order, or with tlapm.

import { TlaProverError, TlaUnsupportedError } from "../errors";
import { getChildren, mapHyp, type Expr, type Hyp, type Sequent } from "../obligations/expression";
import { getObligations, type PrintedObligation } from "../obligations";
import { formatObligation } from "../obligations/printer";
import { isWorkerSupported } from "../worker";
import { decide } from "./deciders";
import { createDecidePool, type DecidePool } from "./decide-pool";
import { encodeIsabelle, encodeIsabelleTheory } from "./isabelle/encode";
import { processObligation } from "./prep/action";
import { expandDefs } from "./prep/defs";
import { normalizeSequent } from "./prep/elab";
import { expandEnabledCdot } from "./prep/enabled";
import { getFingerprint } from "./prep/fingerprint";
import { flatten } from "./prep/flatten";
import { findMethods, type Method } from "./prep/pragma";
import { isTrivial } from "./prep/trivial";
import { encodePtl } from "./ptl/encode";
import { encodeSmt } from "./smt/encode";
import type { EncodingSession } from "./smt/rewrite";
import { encodeZenon } from "./zenon/encode";
import type { TlapmResult } from "./tlapm/tlapm";
import { TLAPS_MODULE } from "./tlaps-module";
import type { Verdict } from "./verdict";

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

export const PROVE_BACKENDS = ["tla-ts", "tlapm"] as const;

type ProveBackend = (typeof PROVE_BACKENDS)[number];

export const isProveBackend = (name: string | undefined): name is ProveBackend =>
  PROVE_BACKENDS.some((backend) => backend === name);

export interface ProveOptions {
  source: string;
  loadModule?: (name: string) => string | undefined;
  backend?: ProveBackend;
  signal?: AbortSignal;
  onObligation?: (obligation: ProofObligation) => void;
  workers?: number;
}

// What one method concluded about an obligation, as tlapm's toolbox messages report it.
export interface ProofAttempt {
  method: Method;
  isProved: boolean;
  isReused: boolean;
  reason?: string;
  verdict?: Verdict;
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
}

interface Backend {
  // The text Prep.ship sends the backend after Prep.normalize_expand. It throws a
  // TlaUnsupportedError for what tla-ts can't encode.
  encode: (id: number, sequent: Sequent, method: Method, session: EncodingSession) => string;
}

// Action.process_obligation, the frontend for every backend but LS4, Isabelle included, then
// Prep.flatten.
const shipFirstOrder = (sequent: Sequent) => flatten(processObligation(sequent));

const SMT: Backend = {
  // Prep.gen_smt_solve writes the resource budget before the encoding.
  encode: (_id, sequent, method, session) =>
    (method.rlimit === undefined ? "" : `(set-option :rlimit ${method.rlimit})\n`) +
    encodeSmt(shipFirstOrder(sequent), session),
};

const BACKENDS: Record<string, Backend> = {
  smt: SMT,
  z3: SMT,
  zenon: { encode: (id, sequent) => encodeZenon(id, shipFirstOrder(sequent)) },
  // tlapm names the theory after its temporary file, and tla-ts after the obligation.
  isabelle: {
    encode: (id, sequent, method) =>
      encodeIsabelle(id, shipFirstOrder(sequent), method.tactic ?? "auto", `tlapm_${id}`),
  },
  // Pltl.process_obligation is LS4's frontend.
  ls4: { encode: (_id, sequent) => encodePtl(sequent) },
};

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

const getBase = (obligation: PrintedObligation): ObligationBase => ({
  id: obligation.id,
  location: obligation.location,
  text: obligation.text,
});

const getUnproved = (
  obligation: PrintedObligation,
  status: "failed" | "unsupported",
  reason: string,
  attempts: ProofAttempt[] = [],
): ProofReport => ({ obligation: { ...getBase(obligation), status, reason }, attempts });

// Prep.normalize_expand: expand_defs, Elab.normalize, then the frontends the step cites.
const normalizeExpand = (obligation: PrintedObligation, methods = findMethods(obligation)) =>
  expandEnabledCdot(normalizeSequent(expandDefs(obligation.sequent)), methods.frontends);

// A failed obligation as tlapm prints it: Prep.normalize_expand for a new failure, and
// Toolbox.normalize, which keeps pragmas, for a reused one.
export const formatNormalized = (obligation: PrintedObligation, isReused: boolean) =>
  `${formatObligation(
    isReused
      ? normalizeSequent(expandDefs(obligation.sequent, false))
      : normalizeExpand(obligation),
  )}\n`;

// The theory of the proofs Isabelle found. tlapm also writes Zenon's proofs there.
export const encodeProofTheory = (
  name: string,
  reports: ProofReport[],
  obligations: PrintedObligation[],
) =>
  encodeIsabelleTheory(
    name,
    reports.flatMap((report, index) =>
      report.attempts
        .filter(
          (attempt) =>
            attempt.method.prover === "isabelle" && attempt.isProved && !attempt.isReused,
        )
        .map((attempt) => ({
          id: report.obligation.id,
          sequent: shipFirstOrder(normalizeExpand(obligations[index])),
          tactic: attempt.method.tactic ?? "auto",
        })),
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
  return backend.encode(obligation.id, normalizeExpand(obligation, methods), method, session);
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
    return getUnproved(obligation, "failed", obligation.kind.message);
  const methods = findMethods(obligation);
  const fingerprint = getFingerprint(obligation.sequent);
  const earlier = run.lastByFingerprint.get(fingerprint);
  run.lastByFingerprint.set(fingerprint, run.tasks[index].done);
  await earlier;
  const attempts: ProofAttempt[] = [];
  const failures: MethodFailure[] = [];
  const getProved = (prover: string): ProofReport => ({
    obligation: { ...getBase(obligation), status: "proved", prover },
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
    return getProved(firstPrior.method.prover);
  }
  const sequent = normalizeExpand(obligation, methods);
  // Fpfile.fp_writes keeps no trivial result, but adds the fingerprint.
  if (obligation.kind.kind === "Support" && isTrivial(sequent)) {
    run.results.set(fingerprint, run.results.get(fingerprint) ?? new Map());
    return { obligation: { ...getBase(obligation), status: "trivial" }, attempts };
  }
  for (const method of methods.provers) {
    const prior = getPrior(method);
    if (prior?.isProved) {
      reuse(prior);
      return getProved(method.prover);
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
    // Prep.prove_with: the Trivial method proves anything.
    if (method.prover === "trivial") return getProved(method.prover);
    const backend = BACKENDS[method.prover];
    if (!backend) {
      skip(method, `tla-ts has no ${method.prover} backend`);
      continue;
    }
    try {
      const isCaseNumbered =
        backend === SMT &&
        (sequent.context.some(isIncompleteCaseHyp) || hasIncompleteCase(sequent.active));
      const session = isCaseNumbered ? await getSession(run, index) : { caseErrors: 0 };
      const text = backend.encode(obligation.id, sequent, method, session);
      const decision = await run.decide(
        method.prover,
        text,
        { timeLimitMs: method.timeLimitMs, signal },
        index,
      );
      const isProved = decision.verdict === "unsat";
      record({
        method,
        isProved,
        isReused: false,
        ...(!isProved && {
          reason: decision.timeUsedMs >= method.timeLimitMs ? "timeout" : "false",
        }),
        verdict: decision.verdict,
        timeUsedMs: decision.timeUsedMs,
      });
      if (isProved) return getProved(method.prover);
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
  return getUnproved(
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
    return getUnproved(obligation, "unsupported", error.message);
  if (error instanceof TlaProverError) return getUnproved(obligation, "failed", error.message);
  throw error;
};

interface ObligationsOptions {
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
  const count = options.workers ?? 1;
  const pool = count > 1 && isWorkerSupported() ? await createDecidePool(count) : undefined;
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
  };
  // A few obligations per worker prove at once, and each reports once every earlier one has.
  const limit = pool ? count * 4 : 1;
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

const getFromTlapm = (
  obligation: PrintedObligation,
  result: TlapmResult | undefined,
): ProofObligation =>
  result
    ? { ...getBase(obligation), ...result }
    : { ...getBase(obligation), status: "unsupported", reason: "tlapm reported no result" };

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
          if (obligation) options.onObligation?.(getFromTlapm(obligation, result));
        },
      },
    );
    return {
      obligations: obligations.map((obligation) =>
        getFromTlapm(obligation, reported.get(obligation.id)),
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
