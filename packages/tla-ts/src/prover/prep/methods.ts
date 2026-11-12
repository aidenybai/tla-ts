import { TlapmBugError, TlaProverError } from "../../errors";
import type { Expr, Locus, Sequent } from "../../obligations/expression";
import type { OldMethod, PragmaSetting } from "../../obligations/pragma";
import type { Backend } from "../verdict";

type Prover =
  | Backend
  | "yices"
  | "cvc3"
  | "cooper"
  | "fail"
  | "verit"
  | "zipper"
  | "spass"
  | "tptp"
  | "trivial"
  | "expandenabled"
  | "expandcdot"
  | "autouse"
  | "lambdify"
  | "enabledaxioms"
  | "levelcomparison";

export interface Method {
  prover: Prover;
  timeLimitMs: number;
  rlimit?: number;
  tactic?: string;
}

const FRONTENDS = new Set<Prover>([
  "expandenabled",
  "expandcdot",
  "autouse",
  "lambdify",
  "enabledaxioms",
  "levelcomparison",
]);

const SMT_SECONDS = 5;
const ZENON_SECONDS = 10;
const ISABELLE_SECONDS = 30;
const LS4_SECONDS = 10;

const RLIMIT_BASE = 3_000_000;
const MAX_RLIMIT = 0xffff_ffff;

const DEFAULT_METHODS: Method[] = [
  { prover: "smt", timeLimitMs: SMT_SECONDS * 1000 },
  { prover: "zenon", timeLimitMs: ZENON_SECONDS * 1000 },
  { prover: "isabelle", timeLimitMs: ISABELLE_SECONDS * 1000, tactic: "auto" },
];

const PROVERS: Record<string, { prover: Prover; seconds: number; isBudgeted?: boolean }> = {
  zenon: { prover: "zenon", seconds: ZENON_SECONDS },
  isabelle: { prover: "isabelle", seconds: ISABELLE_SECONDS },
  yices: { prover: "yices", seconds: 30 },
  ls4: { prover: "ls4", seconds: LS4_SECONDS },
  z3: { prover: "z3", seconds: SMT_SECONDS, isBudgeted: true },
  smt: { prover: "smt", seconds: SMT_SECONDS, isBudgeted: true },
  cvc3: { prover: "cvc3", seconds: SMT_SECONDS },
  cooper: { prover: "cooper", seconds: 0 },
  fail: { prover: "fail", seconds: 0 },
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
  if (rlimit !== undefined && !known.isBudgeted)
    throw new TlaProverError(
      'A Z3 rlimit budget ("rN") is only supported by the SMT and Z3 backends.',
    );
  return {
    prover: known.prover,
    timeLimitMs: rlimit === undefined ? (timeout ?? known.seconds) * 1000 : Infinity,
    ...(rlimit !== undefined && { rlimit }),
    ...(known.prover === "isabelle" && { tactic: tactic ?? "auto" }),
  };
};

const getRlimit = (budget: string) => {
  const count = Number.parseFloat(budget.slice(1));
  if (!/^[rR]./.test(budget) || !Number.isFinite(count) || count <= 0)
    throw new TlaProverError(`Invalid SMT budget "${budget}"`);
  return Math.max(1, Math.trunc(Math.min(count * RLIMIT_BASE, MAX_RLIMIT)));
};

const computeMethod = (settings: PragmaSetting[], args: Expr[]): Method => {
  const values = settings.reduce<{
    args: Expr[];
    prover?: string;
    timeout?: number;
    rlimit?: number;
    tactic?: string;
  }>(
    (state, setting) => {
      const value = setting.value;
      const argument = value.kind === "Default" ? state.args[0] : undefined;
      const rest = value.kind === "Default" ? state.args.slice(1) : state.args;
      if (value.kind === "Default" && !argument)
        throw new TlaProverError("Some arguments are missing");
      const text =
        value.kind === "String"
          ? value.value
          : argument?.kind === "String"
            ? argument.value
            : undefined;
      switch (setting.hint) {
        case "prover":
        case "tactic":
          if (text === undefined) throw new TlaProverError(`This argument should be a string`);
          return { ...state, args: rest, [setting.hint]: text };
        case "timeout": {
          if (value.kind === "Float") return { ...state, args: rest, timeout: value.value };
          if (text !== undefined) return { ...state, args: rest, rlimit: getRlimit(text) };
          if (argument?.kind !== "Num")
            throw new TlaProverError("This argument should be a number of seconds");
          return {
            ...state,
            args: rest,
            timeout: Number(`${argument.integer}.${argument.fraction}`),
          };
        }
        default:
          throw new TlaProverError(`Unknown keyword in proof method definition: ${setting.hint}`);
      }
    },
    { args },
  );
  if (values.args.length > 0) throw new TlaProverError("Too many arguments");
  if (values.prover === undefined) throw new TlaProverError("Missing prover name");
  return getProverMethod(values.prover, values.timeout, values.rlimit, values.tactic);
};

const getOldMethod = (method: OldMethod) =>
  getProverMethod(method.name, method.timeout, undefined, method.tactic);

type Cited =
  | { kind: "Premeth"; groups: PragmaSetting[][] }
  | { kind: "Meth"; method: OldMethod }
  | undefined;

const getCitedMethods = (sequent: Sequent) => {
  const cited: Cited[] = [];
  let methods: Method[] = [];
  let useLocation: Locus | undefined | null = null;
  sequent.context.forEach((hyp, index) => {
    const expression = hyp.kind === "Fact" && hyp.visibility === "Visible" && hyp.expression;
    if (expression && expression.kind === "With") {
      methods.push(getOldMethod(expression.method));
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
      if (hyp.useLocation !== useLocation) {
        methods = [];
        useLocation = hyp.useLocation;
      }
      const args = expression.kind === "Apply" ? expression.args : [];
      methods.push(...entry.groups.map((group) => computeMethod(group, args)));
      return;
    }
    if (entry?.kind !== "Meth") return;
    if (expression.kind === "Apply") throw new TlapmBugError();
    methods.push(getOldMethod(entry.method));
  });
  return methods;
};

export const findMethods = (obligation: { sequent: Sequent; method?: OldMethod }) => {
  const methods =
    obligation.method === undefined
      ? getCitedMethods(obligation.sequent)
      : [getOldMethod(obligation.method)];
  const provers = methods.filter((method) => !FRONTENDS.has(method.prover));
  return {
    frontends: new Set(
      methods.flatMap((method) => (FRONTENDS.has(method.prover) ? [method.prover] : [])),
    ),
    provers: provers.length > 0 ? provers : DEFAULT_METHODS,
  };
};
