// Proves a module's obligations with tla-ts's own backends, in tlapm's order, or with tlapm.

import { TlaProverError, TlaUnsupportedError } from "../errors";
import type { Sequent } from "../obligation-expression";
import { getObligations, type PrintedObligation } from "../obligations";
import { solveSmt } from "../smt/solver";
import { processObligation } from "./prep/action";
import { expandDefs } from "./prep/defs";
import { normalizeSequent } from "./prep/elab";
import { expandEnabledCdot } from "./prep/enabled";
import { getFingerprint } from "./prep/fingerprint";
import { encodeIsabelle } from "./isabelle/encode";
import { flatten } from "./prep/flatten";
import { findMethods, type Method } from "./prep/pragma";
import { isTrivial } from "./prep/trivial";
import { decidePtl } from "./ptl/decide";
import { encodePtl } from "./ptl/encode";
import { encodeSmt } from "./smt/encode";
import type { EncodingSession } from "./smt/rewrite";
import { decideZenon } from "./zenon/decide";
import { encodeZenon } from "./zenon/encode";
import type { TlapmResult } from "./tlapm/tlapm";
import { TLAPS_MODULE } from "./tlaps-module";
import type { DecideOptions, Verdict } from "./verdict";

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

// tla-ts runs its own backends, and tlapm runs tlapm on the module.
export const PROVE_BACKENDS = ["tla-ts", "tlapm"] as const;

export type ProveBackend = (typeof PROVE_BACKENDS)[number];

export const isProveBackend = (name: string | undefined): name is ProveBackend =>
  PROVE_BACKENDS.some((backend) => backend === name);

export interface ProveOptions {
  source: string;
  loadModule?: (name: string) => string | undefined;
  backend?: ProveBackend;
  signal?: AbortSignal;
  onObligation?: (obligation: ProofObligation) => void;
}

// What one prover concluded about an obligation, as Fpfile keeps it. Fpfile keeps one Isabelle
// result, which only a method with the same tactic reuses.
interface PriorResult {
  isProved: boolean;
  timeLimitMs: number;
  tactic: string | undefined;
}

// What tlapm keeps across the obligations of one run: the SMT encoder's counters, and what each
// prover concluded for each fingerprint.
interface ProveRun {
  session: EncodingSession;
  results: Map<string, Map<string, PriorResult>>;
}

interface Backend {
  // The text tlapm sends the backend for an obligation after Prep.normalize_expand, through the
  // frontend and Prep.flatten that Prep.ship applies first. It throws a TlaUnsupportedError for
  // what tla-ts can't encode.
  encode: (id: number, sequent: Sequent, method: Method, session: EncodingSession) => string;
  // tla-ts has no Isabelle of its own, so that backend only encodes.
  decide?: (text: string, options: DecideOptions) => Verdict;
}

// Action.process_obligation, the frontend for every backend but LS4, Isabelle included, then
// Prep.flatten.
const shipFirstOrder = (sequent: Sequent) => flatten(processObligation(sequent));

const SMT: Backend = {
  // Prep.gen_smt_solve writes the resource budget before the encoding.
  encode: (_id, sequent, method, session) =>
    (method.rlimit === undefined ? "" : `(set-option :rlimit ${method.rlimit})\n`) +
    encodeSmt(shipFirstOrder(sequent), session),
  decide: solveSmt,
};

// tla-ts's backends, by the prover of the method that selects each.
const BACKENDS: Record<string, Backend> = {
  smt: SMT,
  z3: SMT,
  zenon: {
    encode: (id, sequent) => encodeZenon(id, shipFirstOrder(sequent)),
    decide: decideZenon,
  },
  // tlapm names the theory after its temporary file, and tla-ts after the obligation.
  isabelle: {
    encode: (id, sequent, method) =>
      encodeIsabelle(id, shipFirstOrder(sequent), method.tactic ?? "auto", `tlapm_${id}`),
  },
  // Pltl.process_obligation is LS4's frontend.
  ls4: { encode: (_id, sequent) => encodePtl(sequent), decide: decidePtl },
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
): ProofObligation => ({ ...getBase(obligation), status, reason });

// Prep.normalize_expand: expand_defs, Elab.normalize, then the frontends the step cites.
const normalizeExpand = (sequent: Sequent, frontends: Set<string>) =>
  expandEnabledCdot(normalizeSequent(expandDefs(sequent)), frontends);

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
  return backend.encode(
    obligation.id,
    normalizeExpand(obligation.sequent, methods.frontends),
    method,
    session,
  );
};

// Prep.ship: the provers the step cites, or tlapm's default ones when it cites none, each tried in
// turn until one proves the obligation. Prep.already_processed reuses what a prover concluded for
// an earlier obligation with the same fingerprint: a proof, or a failure within at least as much
// time. Unless the first prover's proof is reused, a trivial obligation needs no prover.
const proveWithBackends = (
  obligation: PrintedObligation,
  run: ProveRun,
  signal: AbortSignal | undefined,
): ProofObligation => {
  if (obligation.kind.kind === "Error")
    return getUnproved(obligation, "failed", obligation.kind.message);
  const methods = findMethods(obligation);
  const fingerprint = getFingerprint(obligation.sequent);
  const results = run.results.get(fingerprint) ?? new Map<string, PriorResult>();
  run.results.set(fingerprint, results);
  const getProved = (prover: string): ProofObligation => ({
    ...getBase(obligation),
    status: "proved",
    prover,
  });
  const getPrior = (method: Method) => {
    const prior = results.get(method.prover);
    return prior?.tactic === method.tactic ? prior : undefined;
  };
  const setPrior = (method: Method, isProved: boolean) =>
    results.set(method.prover, {
      isProved,
      timeLimitMs: method.timeLimitMs,
      tactic: method.tactic,
    });
  if (getPrior(methods.provers[0])?.isProved) return getProved(methods.provers[0].prover);
  const sequent = normalizeExpand(obligation.sequent, methods.frontends);
  if (obligation.kind.kind === "Support" && isTrivial(sequent))
    return { ...getBase(obligation), status: "trivial" };
  const reasons: string[] = [];
  const state = { isDecided: false };
  for (const method of methods.provers) {
    const prior = getPrior(method);
    if (prior?.isProved) return getProved(method.prover);
    if (prior && prior.timeLimitMs >= method.timeLimitMs) {
      state.isDecided = true;
      reasons.push(`${method.prover} failed on an obligation with the same fingerprint`);
      continue;
    }
    // Prep.prove_with: the Trivial method proves anything.
    if (method.prover === "trivial") return getProved(method.prover);
    const backend = BACKENDS[method.prover];
    if (!backend?.decide) {
      reasons.push(`tla-ts has no ${method.prover} backend`);
      continue;
    }
    try {
      const text = backend.encode(obligation.id, sequent, method, run.session);
      const verdict = backend.decide(text, { timeLimitMs: method.timeLimitMs, signal });
      setPrior(method, verdict === "unsat");
      if (verdict === "unsat") return getProved(method.prover);
      state.isDecided = true;
      reasons.push(`${method.prover} answered ${verdict}`);
    } catch (error) {
      if (error instanceof TlaProverError) {
        setPrior(method, false);
        state.isDecided = true;
        reasons.push(`${method.prover} failed: ${error.message}`);
        continue;
      }
      if (!(error instanceof TlaUnsupportedError)) throw error;
      reasons.push(`${method.prover} can't encode ${error.message}`);
    }
  }
  return getUnproved(obligation, state.isDecided ? "failed" : "unsupported", reasons.join(", "));
};

// The one place an error becomes a result: what tla-ts can't handle is unsupported, and what tlapm
// refuses, as a frontend's soundness check, fails.
const getResult = (obligation: PrintedObligation, getProved: () => ProofObligation) => {
  try {
    return getProved();
  } catch (error) {
    if (error instanceof TlaUnsupportedError)
      return getUnproved(obligation, "unsupported", error.message);
    if (error instanceof TlaProverError) return getUnproved(obligation, "failed", error.message);
    throw error;
  }
};

const getFromTlapm = (obligation: PrintedObligation, result: TlapmResult | undefined) =>
  result
    ? { ...getBase(obligation), ...result }
    : getUnproved(obligation, "unsupported", "tlapm reported no result");

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
  const proved: ProofObligation[] = [];
  const run = { session: { caseErrors: 0 }, results: new Map() };
  for (const obligation of obligations) {
    options.signal?.throwIfAborted();
    const result = getResult(obligation, () => proveWithBackends(obligation, run, options.signal));
    proved.push(result);
    options.onObligation?.(result);
    // HACK: the backends run synchronously, so yield to the event loop to let an abort land.
    await new Promise((resolve) => setTimeout(resolve));
  }
  return { obligations: proved, ...counts };
};
