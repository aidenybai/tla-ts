import { TlaProverError, TlaUnsupportedError } from "../errors";
import { getChildren, mapHyp, type Expr, type Hyp, type Sequent } from "../obligations/expression";
import { getObligations, type PrintedObligation } from "../obligations";
import { formatObligation } from "../obligations/printer";
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
import { isBackend, type Backend, type Verdict } from "./verdict";

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

interface MethodFailure {
  reason: string;
  isDecided: boolean;
}

interface ObligationTask {
  done: Promise<void>;
  session: { initial: number; current: EncodingSession } | undefined;
}

interface ProveRun {
  tasks: ObligationTask[];
  results: Map<string, Map<string, ProofAttempt>>;
  isFingerprinted: (obligation: PrintedObligation) => boolean;
  isProving: boolean;
  lastByFingerprint: Map<string, Promise<void>>;
  decide: DecidePool["decide"];
}

interface Encoder {
  encode: (id: number, sequent: Sequent, method: Method, session: EncodingSession) => string;
  isCaseNumbered: boolean;
}

const shipFirstOrder = (sequent: Sequent) => flatten(processObligation(sequent));

const SMT_ENCODER: Encoder = {
  encode: (_id, sequent, method, session) =>
    (method.rlimit === undefined ? "" : `(set-option :rlimit ${method.rlimit})\n`) +
    encodeSmt(shipFirstOrder(sequent), session),
  isCaseNumbered: true,
};

const ENCODERS: Record<Backend, Encoder> = {
  smt: SMT_ENCODER,
  z3: SMT_ENCODER,
  zenon: {
    encode: (id, sequent) => encodeZenon(id, shipFirstOrder(sequent)),
    isCaseNumbered: false,
  },
  isabelle: {
    encode: (id, sequent, method) =>
      encodeIsabelle(id, shipFirstOrder(sequent), method.tactic ?? "auto"),
    isCaseNumbered: false,
  },
  ls4: { encode: (_id, sequent) => encodePtl(sequent), isCaseNumbered: false },
};

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

export const formatNormalized = (obligation: PrintedObligation, isReused: boolean) =>
  `${formatObligation(
    isReused
      ? normalizeSequent(expandDefs(obligation.sequent, false))
      : normalizeExpand(obligation),
  )}\n`;

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

export const encodeForBackend = (
  obligation: PrintedObligation,
  prover: Backend,
  session: EncodingSession,
) => {
  const methods = findMethods(obligation);
  const method = methods.provers.find((candidate) => candidate.prover === prover) ?? {
    prover,
    timeLimitMs: Infinity,
  };
  return ENCODERS[prover].encode(
    obligation.id,
    normalizeExpand(obligation, methods),
    method,
    session,
  );
};

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

const proveWithBackends = async (
  obligation: PrintedObligation,
  index: number,
  run: ProveRun,
  signal: AbortSignal | undefined,
): Promise<ProofReport> => {
  if (obligation.kind.kind === "Error")
    return getUnprovedReport(obligation, "failed", obligation.kind.message);
  const methods = findMethods(obligation);
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
  const getPrior = (method: Method) => {
    if (!run.isFingerprinted(obligation)) run.results.delete(fingerprint);
    const prior = run.results.get(fingerprint)?.get(method.prover);
    return prior?.method.tactic === method.tactic ? prior : undefined;
  };
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
    if (method.prover === "trivial") return getProvedReport(method.prover);
    if (!isBackend(method.prover)) {
      skip(method, `tla-ts has no ${method.prover} backend`);
      continue;
    }
    try {
      const encoder = ENCODERS[method.prover];
      const isCaseNumbered =
        encoder.isCaseNumbered &&
        (sequent.context.some(isIncompleteCaseHyp) || hasIncompleteCase(sequent.active));
      const session = isCaseNumbered ? await getSession(run, index) : { caseErrors: 0 };
      const text = encoder.encode(obligation.id, sequent, method, session);
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

const getErrorReport = (obligation: PrintedObligation, error: unknown) => {
  if (error instanceof TlaUnsupportedError)
    return getUnprovedReport(obligation, "unsupported", error.message);
  if (error instanceof TlaProverError)
    return getUnprovedReport(obligation, "failed", error.message);
  throw error;
};

interface ObligationsOptions {
  workers?: number;
  signal?: AbortSignal;
  onReport?: (report: ProofReport, obligation: PrintedObligation) => void;
  results?: Map<string, Map<string, ProofAttempt>>;
  isFingerprinted?: (obligation: PrintedObligation) => boolean;
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
  };
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
