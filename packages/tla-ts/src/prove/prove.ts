// Proves a module's obligations with tla-ts's own backends, in tlapm's order, or with tlapm.

import { TlaUnsupportedError } from "../errors";
import type { Sequent } from "../obligation-expression";
import { getObligations, type PrintedObligation } from "../obligations";
import { processObligation } from "./prep/action";
import { expandDefinitions } from "./prep/defs";
import { expandEnabledCdot, FRONTENDS } from "./prep/enabled";
import { splitFacts } from "./prep/flatten";
import { findMethods } from "./prep/pragma";
import { isTrivial } from "./prep/trivial";
import { encodeSmt } from "./smt/encode";
import type { EncodingSession } from "./smt/rewrite";
import { decideSmt } from "./smt/solver/solver";
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

// What tlapm keeps across the obligations of one run.
interface ProveRun {
  session: EncodingSession;
}

interface Backend {
  name: string;
  // The provers, as tlapm's pragmas name them, that select this backend.
  provers: string[];
  // Method.default_*_timeout.
  timeLimitMs: number;
  // Whether tlapm tries this backend when a step cites no prover, in this table's order.
  isDefault: boolean;
  // The text tlapm sends the backend, after the frontend it applies first. It throws a
  // TlaUnsupportedError for what tla-ts can't encode.
  encode: (sequent: Sequent, run: ProveRun) => string;
  decide: (text: string, options: DecideOptions) => Verdict;
}

// tla-ts's backends, each with the frontend that Prep.ship applies before it.
const BACKENDS: Backend[] = [
  {
    name: "smt",
    provers: ["smt"],
    timeLimitMs: 5000,
    isDefault: true,
    encode: (sequent, run) => encodeSmt(splitFacts(processObligation(sequent)), run.session),
    decide: decideSmt,
  },
];

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

// Prep.find_meth and Prep.normalize_expand: the provers the step cites, and the sequent after
// expand_defs and the frontends it cites.
const prepare = (obligation: PrintedObligation) => {
  const methods = findMethods(obligation.sequent.context);
  const sequent = expandEnabledCdot(
    expandDefinitions(obligation.sequent),
    methods.flatMap((method) => (FRONTENDS.has(method.prover) ? [method.prover] : [])),
  );
  return { provers: methods.filter((method) => !FRONTENDS.has(method.prover)), sequent };
};

// The text one backend receives for an obligation, for comparing with tlapm's.
export const encodeForBackend = (obligation: PrintedObligation, name: string, run: ProveRun) => {
  const backend = BACKENDS.find((candidate) => candidate.name === name);
  if (!backend) throw new TlaUnsupportedError(`the backend ${name}`);
  return backend.encode(prepare(obligation).sequent, run);
};

// Prep.ship: the provers the step cites, or tlapm's default ones when it cites none, each tried in
// turn until one proves the obligation. A trivial obligation needs no prover.
const proveWithBackends = (
  obligation: PrintedObligation,
  run: ProveRun,
  signal: AbortSignal | undefined,
): ProofObligation => {
  if (obligation.kind.kind === "Error")
    return getUnproved(obligation, "failed", obligation.kind.message);
  const prepared = prepare(obligation);
  if (obligation.kind.kind === "Support" && isTrivial(prepared.sequent))
    return { ...getBase(obligation), status: "trivial" };
  const attempts = (
    prepared.provers.length > 0
      ? prepared.provers
      : BACKENDS.filter((backend) => backend.isDefault).map((backend) => ({
          prover: backend.provers[0],
          timeLimitMs: undefined,
        }))
  ).flatMap((method) => {
    const backend = BACKENDS.find((candidate) => candidate.provers.includes(method.prover));
    return backend ? [{ backend, timeLimitMs: method.timeLimitMs ?? backend.timeLimitMs }] : [];
  });
  if (attempts.length === 0) {
    const provers = new Set(prepared.provers.map((method) => method.prover));
    throw new TlaUnsupportedError(`the step is proved by ${[...provers].join(", ")}`);
  }
  const reasons: string[] = [];
  const state = { isDecided: false };
  for (const attempt of attempts) {
    try {
      const text = attempt.backend.encode(prepared.sequent, run);
      const verdict = attempt.backend.decide(text, { timeLimitMs: attempt.timeLimitMs, signal });
      if (verdict === "unsat")
        return { ...getBase(obligation), status: "proved", prover: attempt.backend.name };
      state.isDecided = true;
      reasons.push(`${attempt.backend.name} answered ${verdict}`);
    } catch (error) {
      if (!(error instanceof TlaUnsupportedError)) throw error;
      reasons.push(`${attempt.backend.name} can't encode ${error.message}`);
    }
  }
  return getUnproved(obligation, state.isDecided ? "failed" : "unsupported", reasons.join(", "));
};

// The one place a TlaUnsupportedError becomes a result.
const getUnsupported = (obligation: PrintedObligation, getResult: () => ProofObligation) => {
  try {
    return getResult();
  } catch (error) {
    if (!(error instanceof TlaUnsupportedError)) throw error;
    return getUnproved(obligation, "unsupported", error.message);
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
  const run = { session: { caseErrors: 0 } };
  for (const obligation of obligations) {
    options.signal?.throwIfAborted();
    const result = getUnsupported(obligation, () =>
      proveWithBackends(obligation, run, options.signal),
    );
    proved.push(result);
    options.onObligation?.(result);
    // HACK: the backends run synchronously, so yield to the event loop to let an abort land.
    await new Promise((resolve) => setTimeout(resolve));
  }
  return { obligations: proved, ...counts };
};
