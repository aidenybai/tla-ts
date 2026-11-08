// Prep.find_meth and Prep.compute_meth: the methods the pragmas an obligation cites select, each a
// prover with its time limit, or a frontend that rewrites the obligation first. A malformed method
// throws a TlaMethodError, since Prep.ship catches compute_meth's failure and fails only that
// obligation.

import { TlaMethodError, TlapmBugError, TlaProverError } from "../../errors";
import type { Expr, Locus, Sequent } from "../../obligations/expression";
import type { OldMethod, PragmaSetting } from "../../obligations/pragma";

// A method, named after the Method.t constructor tlapm reports it by. A Z3 resource budget turns
// the time limit off.
export interface Method {
  prover: string;
  timeLimitMs: number;
  rlimit?: number;
  tactic?: string;
}

// The methods that rewrite an obligation in Prep.expand_enabled_cdot instead of proving it.
const FRONTENDS = new Set([
  "expandenabled",
  "expandcdot",
  "autouse",
  "lambdify",
  "enabledaxioms",
  "levelcomparison",
]);

// Method.default_*_timeout, in seconds.
const SMT_SECONDS = 5;
const ZENON_SECONDS = 10;
const ISABELLE_SECONDS = 30;
const LS4_SECONDS = 10;

// Method.rlimit_base and Method.max_rlimit.
const RLIMIT_BASE = 3_000_000;
const MAX_RLIMIT = 0xffff_ffff;

// Params.default_method: what tlapm tries when a step cites no prover.
const DEFAULT_METHODS: Method[] = [
  { prover: "smt", timeLimitMs: SMT_SECONDS * 1000 },
  { prover: "zenon", timeLimitMs: ZENON_SECONDS * 1000 },
  { prover: "isabelle", timeLimitMs: ISABELLE_SECONDS * 1000, tactic: "auto" },
];

// compute_meth's names for each prover, and the Method.t constructor and default time each
// selects. The SMT solvers take a resource budget.
const PROVERS: Record<string, { prover: string; seconds: number; isBudgeted?: boolean }> = {
  zenon: { prover: "zenon", seconds: ZENON_SECONDS },
  isabelle: { prover: "isabelle", seconds: ISABELLE_SECONDS },
  yices: { prover: "yices", seconds: 30 },
  ls4: { prover: "ls4", seconds: LS4_SECONDS },
  z3: { prover: "z3", seconds: SMT_SECONDS, isBudgeted: true },
  smt: { prover: "smt", seconds: SMT_SECONDS, isBudgeted: true },
  cvc3: { prover: "cvc3", seconds: SMT_SECONDS },
  cooper: { prover: "cooper", seconds: Infinity },
  fail: { prover: "fail", seconds: Infinity },
  smt2lib: { prover: "smt", seconds: SMT_SECONDS, isBudgeted: true },
  smt2z3: { prover: "z3", seconds: SMT_SECONDS, isBudgeted: true },
  smt3: { prover: "smt", seconds: SMT_SECONDS, isBudgeted: true },
  z33: { prover: "z3", seconds: SMT_SECONDS, isBudgeted: true },
  cvc33: { prover: "cvc3", seconds: SMT_SECONDS },
  yices3: { prover: "yices", seconds: SMT_SECONDS },
  verit: { prover: "verit", seconds: SMT_SECONDS },
  zipper: { prover: "zipper", seconds: 30 },
  spass: { prover: "spass", seconds: SMT_SECONDS },
  tptp: { prover: "tptp", seconds: SMT_SECONDS },
  trivial: { prover: "trivial", seconds: 0 },
  ...Object.fromEntries([...FRONTENDS].map((name) => [name, { prover: name, seconds: 0 }])),
};

const getProverMethod = (
  name: string,
  timeout: number | undefined,
  rlimit: number | undefined,
  tactic: string | undefined,
): Method => {
  const known = PROVERS[name];
  if (!known) throw new TlaProverError(`Unknown prover: ${name}`);
  return {
    prover: known.prover,
    timeLimitMs: rlimit === undefined ? (timeout ?? known.seconds) * 1000 : Infinity,
    ...(rlimit !== undefined && { rlimit }),
    ...(known.prover === "isabelle" && { tactic: tactic ?? "auto" }),
  };
};

const BUDGET_FORMS =
  'a number of seconds (wall-clock timeout), or a deterministic Z3 rlimit budget of the form "rN" (e.g. "r5")';

// parse_rlimit: "rN" is N times the base resource count, at least 1.
const getRlimit = (budget: string, locus: Locus | undefined) => {
  const count = Number(budget.slice(1));
  if (!/^[rR]./.test(budget) || !Number.isFinite(count) || count <= 0)
    throw new TlaMethodError(
      `Invalid SMT budget ${JSON.stringify(budget)}: expected ${BUDGET_FORMS}.`,
      locus,
    );
  return Math.max(1, Math.trunc(Math.min(count * RLIMIT_BASE, MAX_RLIMIT)));
};

interface MethodValues {
  args: Expr[];
  prover?: string;
  proverLocus?: Locus;
  timeout?: number;
  rlimit?: number;
  tactic?: string;
}

// compute_meth: a group of a pragma's settings, where each @ takes the next argument the pragma is
// applied to at the use.
const computeMethod = (settings: PragmaSetting[], args: Expr[], use: Locus | undefined): Method => {
  const values = settings.reduce<MethodValues>(
    (state, setting) => {
      const value = setting.value;
      const argument = value.kind === "Default" ? state.args[0] : undefined;
      const rest = value.kind === "Default" ? state.args.slice(1) : state.args;
      if (setting.hint !== "prover" && setting.hint !== "tactic" && setting.hint !== "timeout")
        throw new TlaMethodError(
          `Unknown keyword in proof method definition: ${setting.hint}`,
          setting.location,
        );
      if (value.kind === "Default" && !argument)
        throw new TlaMethodError("Some arguments are missing", use);
      if (setting.hint === "timeout") {
        if (value.kind === "Float") return { ...state, timeout: value.value };
        if (value.kind === "String")
          return { ...state, rlimit: getRlimit(value.value, setting.location) };
        if (argument?.kind === "Num")
          return {
            ...state,
            args: rest,
            timeout: Number(`${argument.integer}.${argument.fraction}`),
          };
        if (argument?.kind === "String")
          return { ...state, args: rest, rlimit: getRlimit(argument.value, argument.location) };
        throw new TlaMethodError(`This argument should be ${BUDGET_FORMS}`, argument?.location);
      }
      if (value.kind === "Float")
        throw new TlaMethodError("Argument should be a string or @", setting.location);
      const text =
        value.kind === "String"
          ? value.value
          : argument?.kind === "String"
            ? argument.value
            : undefined;
      if (text === undefined)
        throw new TlaMethodError(
          `This argument should be a string (${setting.hint === "prover" ? "prover name" : "proof tactic"})`,
          argument?.location,
        );
      if (setting.hint === "tactic") return { ...state, args: rest, tactic: text };
      return {
        ...state,
        args: rest,
        prover: text,
        proverLocus: value.kind === "Default" ? use : setting.location,
      };
    },
    { args },
  );
  if (values.args.length > 0) throw new TlaMethodError("Too many arguments", use);
  if (values.prover === undefined)
    throw new TlaMethodError("Missing prover name", settings[0].location);
  const known = PROVERS[values.prover];
  if (!known) throw new TlaMethodError(`Unknown prover: ${values.prover}`, values.proverLocus);
  if (values.rlimit !== undefined && !known.isBudgeted)
    throw new TlaMethodError(
      'A Z3 rlimit budget ("rN") is only supported by the SMT and Z3 backends.',
      use,
    );
  return getProverMethod(values.prover, values.timeout, values.rlimit, values.tactic);
};

// An old-style method, as Method_prs reads it, with its default time unless it names one.
const getOldMethod = (method: OldMethod) =>
  getProverMethod(method.name, method.timeout, undefined, method.tactic);

type Cited =
  | { kind: "Premeth"; groups: PragmaSetting[][] }
  | { kind: "Meth"; method: OldMethod }
  | undefined;

// find_meth: an obligation whose proof names a method keeps it. Otherwise each visible fact that
// cites a pragma, alone or applied to arguments, adds the methods its groups compute, and each that
// cites a theorem or carries an old-style method adds that method. A pragma that a fact from
// another BY or USE cites drops the methods found so far: tlapm compares the USE locations
// physically, as tla-ts compares the objects.
const getCitedMethods = (sequent: Sequent) => {
  const cited: Cited[] = [];
  const state: { methods: Method[]; useLocation: Locus | undefined | null } = {
    methods: [],
    useLocation: null,
  };
  sequent.context.forEach((hyp, index) => {
    const expression = hyp.kind === "Fact" && hyp.visibility === "Visible" && hyp.expression;
    if (expression && expression.kind === "With") {
      state.methods.push(getOldMethod(expression.method));
      cited.push(undefined);
      return;
    }
    if (hyp.kind === "Defn" && hyp.definition.kind === "Bpragma") {
      cited.push({ kind: "Premeth", groups: hyp.definition.methods });
      return;
    }
    if (hyp.kind === "Defn" && hyp.definition.kind === "Operator" && hyp.visibility === "Visible") {
      const body = hyp.definition.body;
      cited.push(body.kind === "With" ? { kind: "Meth", method: body.method } : undefined);
      return;
    }
    cited.push(undefined);
    if (!expression || hyp.kind !== "Fact") return;
    const operator = expression.kind === "Apply" ? expression.operator : expression;
    if (operator.kind !== "Ix") return;
    const entry = cited[index - operator.index];
    if (entry?.kind === "Premeth") {
      if (hyp.useLocation !== state.useLocation) {
        state.methods = [];
        state.useLocation = hyp.useLocation;
      }
      const args = expression.kind === "Apply" ? expression.args : [];
      state.methods.push(
        ...entry.groups.map((group) => computeMethod(group, args, expression.location)),
      );
      return;
    }
    if (entry?.kind !== "Meth") return;
    // find_meth asserts that a theorem with a method is not applied to arguments.
    if (expression.kind === "Apply") throw new TlapmBugError();
    state.methods.push(getOldMethod(entry.method));
  });
  return state.methods;
};

// The methods find_meth selects: the frontends to apply, and the provers to try in order, which
// are tlapm's default ones when the obligation cites only frontends or nothing.
export const findMethods = (
  obligation: { sequent: Sequent; method?: OldMethod },
  defaultMethods = DEFAULT_METHODS,
) => {
  const methods =
    obligation.method === undefined
      ? getCitedMethods(obligation.sequent)
      : [getOldMethod(obligation.method)];
  const provers = methods.filter((method) => !FRONTENDS.has(method.prover));
  return {
    frontends: new Set(
      methods.flatMap((method) => (FRONTENDS.has(method.prover) ? [method.prover] : [])),
    ),
    provers: provers.length > 0 ? provers : defaultMethods,
  };
};

// Params.mk_meth's names, by the name compute_meth gives the same method.
const DEFAULT_METHOD_NAMES: Record<string, string> = {
  zenon: "zenon",
  smt: "smt",
  z3: "z3",
  cvc4: "cvc33",
  yices: "yices3",
  verit: "verit",
  zipper: "zipper",
  spass: "spass",
  tptp: "tptp",
  ls4: "ls4",
};

export const parseDefaultMethods = (text: string) =>
  text.split(",").map((entry): Method => {
    const separator = entry.indexOf(":");
    const name = separator === -1 ? entry : entry.slice(0, separator);
    const seconds = separator === -1 ? undefined : Number.parseFloat(entry.slice(separator + 1));
    if (Number.isNaN(seconds))
      throw new TlaProverError("--method: bad timeout specification: not a number");
    if (name === "auto" || name === "blast" || name === "force")
      return getProverMethod("isabelle", seconds, undefined, name);
    if (name === "fail") return { prover: "fail", timeLimitMs: Infinity };
    const known = DEFAULT_METHOD_NAMES[name];
    if (known === undefined)
      throw new TlaProverError(`--method: unknown method ${JSON.stringify(name)}`);
    return getProverMethod(known, seconds, undefined, undefined);
  });
