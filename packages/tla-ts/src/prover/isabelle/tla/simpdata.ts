// The simplifier as Isabelle/TLA+ sets it up in simplifier_setup.ML and PredicateLogic.thy (BSD
// licensed, see LICENSE): how theorems become rewrite rules, the solvers, the neq simproc, and the
// simpset of the reference heap.
//
// The heap's only looper, "split PredicateLogic.cond", is left out: its rule splitCond has the
// premise isBool(Q(x)), so Splitter.split_tac never composes it with a goal and the looper always
// fails.

import { TlaIsabelleError } from "../../../errors";
import { genAll, reflexiveThm } from "../pure/drule";
import { emptyNet, insertTermNet, type Net } from "../pure/net";
import {
  congKey,
  emptyCongs,
  rulesFromEntries,
  type Procedure,
  type SimpContext,
  type Simpset,
  type Solver,
} from "../pure/raw-simplifier";
import { asmSimpTac, simplify } from "../pure/simplifier";
import { updateTable } from "../pure/table";
import {
  assumeTac,
  eqAssumeTac,
  ematchTac,
  eresolveTac,
  matchTac,
  resolveTac,
} from "../pure/tactic";
import {
  first,
  firstGoal,
  orElse,
  repeatDeterm,
  thenAllNew,
  thenGoal,
  type GoalTactic,
} from "../pure/tactical";
import { aconv, eqTerm, headOf, type Term } from "../pure/term";
import { conclOf, rs, type Thm } from "../pure/thm";
import { trade } from "../pure/variable";
import { getFact } from "./classical-setup";
import type { TlaLogic } from "./logic";

const isConstApp = (name: string, arity: number, term: Term): boolean =>
  arity === 0
    ? term.kind === "Const" && term.name === name
    : term.kind === "App" && isConstApp(name, arity - 1, term.fun);

const catchThm = <Result>(derive: () => Result): Result | undefined => {
  try {
    return derive();
  } catch (error) {
    if (error instanceof TlaIsabelleError && error.exception === "THM") return undefined;
    throw error;
  }
};

const getRewriting = (logic: TlaLogic) => {
  const fact = (name: string) => getFact(logic, `PredicateLogic.${name}`);
  const eqReflection = fact("eq_reflection");
  const eqTrueI = fact("eqTrueI");
  const neqToEqFalse = rs(fact("neq_conv_eq_False"), eqReflection);
  // Simpdata.mk_eq
  const mkEq = (thm: Thm): Thm => {
    const conclusion = conclOf(thm);
    const concl = conclusion.kind === "App" ? conclusion : undefined;
    if (isConstApp("Pure.eq", 2, conclusion)) return thm;
    if (concl !== undefined && isConstApp("PredicateLogic.eq", 2, concl.arg))
      return rs(thm, eqReflection);
    if (
      concl !== undefined &&
      concl.arg.kind === "App" &&
      isConstApp("PredicateLogic.not", 0, concl.arg.fun) &&
      isConstApp("PredicateLogic.eq", 2, concl.arg.arg)
    )
      return rs(thm, neqToEqFalse);
    return rs(rs(thm, eqTrueI), eqReflection);
  };
  // The final Simpdata.mksimps_pairs: the rules that split a premise by its outermost operator,
  // and whether to simplify what they give.
  const pairs = new Map<string, { rules: Thm[]; isSimplified: boolean }>([
    ["PredicateLogic.not", { rules: [fact("boolifyFalseI")], isSimplified: true }],
    ["PredicateLogic.iff", { rules: [fact("iffThenBoolifyEqual")], isSimplified: true }],
    ["PredicateLogic.imp", { rules: [fact("mp")], isSimplified: false }],
    ["PredicateLogic.conj", { rules: [fact("conjD1"), fact("conjD2")], isSimplified: false }],
    ["PredicateLogic.All", { rules: [fact("spec")], isSimplified: false }],
    ["PredicateLogic.TRUE", { rules: [], isSimplified: false }],
    ["PredicateLogic.FALSE", { rules: [], isSimplified: false }],
    [
      "PredicateLogic.cond",
      { rules: [rs(fact("if_bool_equiv_conj"), fact("iffD1"))], isSimplified: false },
    ],
  ]);
  // Simpdata.mk_atomize
  const atoms = (context: SimpContext, thm: Thm): Thm[] => {
    const concl = conclOf(thm);
    if (!(concl.kind === "App" && isConstApp("PredicateLogic.Trueprop", 1, concl))) return [thm];
    const head = headOf(concl.arg);
    const pair = head.kind === "Const" ? pairs.get(head.name) : undefined;
    if (pair === undefined) return [thm];
    const derive = (fixed: Thm) => pair.rules.map((rule) => rs(fixed, rule));
    const split = catchThm(() =>
      (thm.maxidx === -1 ? derive(thm) : trade(derive, thm)).flatMap((result) =>
        atoms(context, result),
      ),
    );
    if (split === undefined) return [thm];
    return pair.isSimplified ? split.map((result) => simplify(context, result)) : split;
  };
  return {
    mk: (thm: Thm, context: SimpContext) =>
      atoms(context, genAll(thm)).flatMap((atom) => {
        const eq = catchThm(() => mkEq(atom));
        return eq === undefined ? [] : [eq];
      }),
    mkEqTrue: (thm: Thm) => catchThm(() => rs(rs(thm, eqTrueI), eqReflection)),
  };
};

const getSolvers = (logic: TlaLogic): { unsafe: Solver; safe: Solver } => {
  const fact = (name: string) => getFact(logic, `PredicateLogic.${name}`);
  const solutions = [
    reflexiveThm,
    fact("trueI"),
    fact("refl"),
    fact("iff_refl"),
    fact("notFalseI"),
  ];
  const contradictions = [fact("falseE"), fact("not_refl_False")];
  const conjI = fact("conjI");
  const simpImpliesI = fact("simp_impliesI");
  const introSimpImplies =
    (context: SimpContext): GoalTactic =>
    (index) =>
      repeatDeterm(matchTac(context.limits, [simpImpliesI])(index));
  return {
    unsafe: {
      name: "PredicateLogic unsafe",
      tactic: (context) => {
        const limits = context.limits;
        const solveTac: GoalTactic = (index) =>
          orElse(
            first([
              resolveTac(limits, [...solutions, ...context.simpset.prems])(index),
              assumeTac(limits)(index),
              eresolveTac(limits, contradictions)(index),
            ]),
            thenAllNew(matchTac(limits, [conjI]), solveTac)(index),
          );
        return thenGoal(introSimpImplies(context), solveTac);
      },
    },
    safe: {
      name: "PredicateLogic safe",
      tactic: (context) =>
        thenGoal(
          introSimpImplies(context),
          firstGoal([
            matchTac(context.limits, [...solutions, ...context.simpset.prems]),
            eqAssumeTac,
            ematchTac(context.limits, contradictions),
          ]),
        ),
    },
  };
};

// PredicateLogic.thy's neq simproc: rewrites x = y to FALSE given y ~= x or (y = x) = FALSE.
const getNeqProc = (logic: TlaLogic) => {
  const fact = (name: string) => getFact(logic, `PredicateLogic.${name}`);
  const eqReflection = fact("eq_reflection");
  const neqToEqFalse = rs(rs(fact("not_sym"), fact("neq_conv_eq_False")), eqReflection);
  const symEqLeft = rs(fact("symEqLeft"), eqReflection);
  const isNeq = (eq: Term, lhs: Term, rhs: Term, thm: Thm) => {
    const prop = thm.prop;
    if (prop.kind !== "App" || prop.arg.kind !== "App") return false;
    const body = prop.arg;
    if (body.arg.kind === "App" && body.arg.fun.kind === "App") {
      const negated = body.arg;
      return (
        isConstApp("PredicateLogic.not", 0, body.fun) &&
        negated.fun.kind === "App" &&
        eqTerm(negated.fun.fun, eq) &&
        aconv(negated.arg, lhs) &&
        aconv(negated.fun.arg, rhs)
      );
    }
    if (body.fun.kind !== "App") return false;
    const equation = body.fun.arg;
    return (
      isConstApp("PredicateLogic.eq", 0, body.fun.fun) &&
      equation.kind === "App" &&
      equation.fun.kind === "App" &&
      isConstApp("PredicateLogic.eq", 0, equation.fun.fun) &&
      isConstApp("PredicateLogic.FALSE", 0, body.arg) &&
      aconv(equation.arg, lhs) &&
      aconv(equation.fun.arg, rhs)
    );
  };
  return (context: SimpContext, term: Term): Thm | undefined => {
    if (term.kind !== "App" || term.fun.kind !== "App") return undefined;
    const eq = term.fun.fun;
    const lhs = term.fun.arg;
    const rhs = term.arg;
    const prem = context.simpset.prems.find((thm) => isNeq(eq, lhs, rhs, thm));
    if (prem === undefined) return undefined;
    return catchThm(() => rs(prem, symEqLeft)) ?? rs(prem, neqToEqFalse);
  };
};

export const getSimpset = (logic: TlaLogic): Simpset => {
  const neq = getNeqProc(logic);
  const solvers = getSolvers(logic);
  const procs = new Map([["PredicateLogic.neq", neq]]);
  return {
    rules: rulesFromEntries(logic.simps),
    prems: [],
    depth: 0,
    congs: logic.congs.reduce(
      (table, cong) => updateTable(table, congKey(cong), cong.rule),
      emptyCongs,
    ),
    weakCongs: logic.weakCongs,
    simprocs: logic.simprocs.reduce<Net<Procedure>>((net, simproc) => {
      const proc = procs.get(simproc.name);
      if (proc === undefined)
        throw new TlaIsabelleError("ERROR", `Undefined simproc: ${simproc.name}`);
      return simproc.lhss.reduce(
        (result, lhs) => insertTermNet(lhs, { name: simproc.name, lhs, proc }, result),
        net,
      );
    }, emptyNet),
    mkRews: getRewriting(logic),
    subgoalTac: asmSimpTac,
    loopTacs: [],
    unsafeSolvers: [solvers.unsafe],
    safeSolvers: [solvers.safe],
  };
};
