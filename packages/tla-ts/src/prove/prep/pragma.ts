// Prep.find_meth: the provers that the pragmas an obligation cites select.

import type { Expr, Hyp } from "../../obligation-expression";

// The provers that TLAPS.tla's pragmas select, as tlapm names them.
// Only the definitions with a pragma comment in TLAPS.tla select a prover.
const PRAGMA_PROVERS: Record<string, string> = {
  SMT: "smt",
  SMTT: "smt",
  SimpleArithmetic: "smt",
  Z3: "smt",
  Z3T: "smt",
  AllSMT: "smt",
  AllSMTT: "smt",
  AllProvers: "smt",
  AllProversT: "smt",
  CVC3: "cvc33",
  CVC3T: "cvc33",
  CVC4: "cvc33",
  CVC4T: "cvc33",
  Yices: "yices3",
  YicesT: "yices3",
  veriT: "verit",
  veriTT: "verit",
  Zipper: "zipper",
  ZipperT: "zipper",
  Spass: "spass",
  SpassT: "spass",
  LS4: "ls4",
  LS4T: "ls4",
  PTL: "ls4",
  Zenon: "zenon",
  ZenonT: "zenon",
  SlowZenon: "zenon",
  SlowerZenon: "zenon",
  VerySlowZenon: "zenon",
  SlowestZenon: "zenon",
  Isa: "isabelle",
  IsaT: "isabelle",
  IsaM: "isabelle",
  IsaMT: "isabelle",
  IsaWithSetExtensionality: "isabelle",
  Auto: "isabelle",
  SlowAuto: "isabelle",
  SlowerAuto: "isabelle",
  SlowestAuto: "isabelle",
  Force: "isabelle",
  SlowForce: "isabelle",
  SlowerForce: "isabelle",
  SlowestForce: "isabelle",
  SimplifyAndSolve: "isabelle",
  SlowSimplifyAndSolve: "isabelle",
  SlowerSimplifyAndSolve: "isabelle",
  SlowestSimplifyAndSolve: "isabelle",
  Simplification: "isabelle",
  SlowSimplification: "isabelle",
  SlowerSimplification: "isabelle",
  SlowestSimplification: "isabelle",
  Blast: "isabelle",
  SlowBlast: "isabelle",
  SlowerBlast: "isabelle",
  SlowestBlast: "isabelle",
  AutoBlast: "isabelle",
  AllIsa: "isabelle",
  AllIsaT: "isabelle",
  ExpandENABLED: "expandenabled",
  ExpandCdot: "expandcdot",
  AutoUSE: "autouse",
  Lambdify: "lambdify",
  ENABLEDaxioms: "enabledaxioms",
  LevelComparison: "levelcomparison",
  Trivial: "trivial",
};

// A prover a step cites, named as tlapm names it, with the time it gives the prover, if any.
export interface Method {
  prover: string;
  timeLimitMs: number | undefined;
}

export const getPragmaProver = (hyp: Hyp | undefined) => {
  if (hyp?.kind !== "Defn" || hyp.definition.kind !== "Operator") return undefined;
  // TLAPS's pragmas keep their meaning through an INSTANCE, as in C!SMT, and when tla-ts renames
  // a second copy of one, as in SMT$41.
  const prover = PRAGMA_PROVERS[hyp.definition.name.replace(/^.*!/, "").replace(/\$\d+$/, "")];
  const body = hyp.definition.body;
  const value = body.kind === "Lambda" ? body.body : body;
  return value.kind === "Internal" && value.builtin === "TRUE" ? prover : undefined;
};

const getPragmaMethod = (context: Hyp[], index: number, expression: Expr): Method | undefined => {
  const operator = expression.kind === "Apply" ? expression.operator : expression;
  if (operator.kind !== "Ix") return undefined;
  const prover = getPragmaProver(context[index - operator.index]);
  if (prover === undefined) return undefined;
  const argument = expression.kind === "Apply" ? expression.args.at(-1) : undefined;
  // Prep.compute_meth: SMTT(n) gives the prover n seconds. tla-ts's provers have no resource
  // limit, so SMTT("rN") keeps the default time.
  const timeLimitMs =
    argument?.kind === "Num"
      ? Number(`${argument.integer}.${argument.fraction || "0"}`) * 1000
      : undefined;
  return { prover, timeLimitMs };
};

// Prep.find_meth takes the provers from the pragmas the obligation cites. tla-ts doesn't record
// which BY or USE cited a fact, so the last run of adjacent pragma facts stands for the latest.
export const findMethods = (context: Hyp[]) => {
  const runs = context.reduce<Method[][]>(
    (found, hyp, index) => {
      const method =
        hyp.kind === "Fact" && hyp.visibility === "Visible"
          ? getPragmaMethod(context, index, hyp.expression)
          : undefined;
      if (!method) return found.at(-1)?.length === 0 ? found : [...found, []];
      found.at(-1)?.push(method);
      return found;
    },
    [[]],
  );
  return runs.findLast((run) => run.length > 0) ?? [];
};
