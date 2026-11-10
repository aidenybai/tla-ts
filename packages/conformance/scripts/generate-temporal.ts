import { writeTest } from "./generate-common";

const MACHINES = [
  { name: "stops", init: "x = 0", next: "x < 2 /\\ x' = x + 1" },
  { name: "cycle", init: "x = 0", next: "x' = (x + 1) % 3" },
  {
    name: "choice",
    init: "x = 0",
    next: "\\/ x = 0 /\\ x' \\in {1, 2}\n        \\/ x = 1 /\\ x' = 1\n        \\/ x = 2 /\\ x' = 0",
  },
  { name: "many_starts", init: "x \\in 0..2", next: "x' = (x + 1) % 3" },
  { name: "self_loops", init: "x = 0", next: "x' \\in {x, (x + 1) % 3}" },
  {
    name: "branch_and_sink",
    init: "x = 0",
    next: "\\/ x = 0 /\\ x' \\in {1, 2}\n        \\/ x = 1 /\\ x' = 0\n        \\/ x = 2 /\\ x' = 2",
  },
  {
    name: "two_cycles",
    init: "x = 0",
    next: "\\/ x \\in {0, 1} /\\ x' = 1 - x\n        \\/ x = 1 /\\ x' = 2\n        \\/ x = 2 /\\ x' = 2",
  },
  { name: "one_state", init: "x = 0", next: "x' = x" },
  { name: "dead_end", init: "x = 0", next: "x = 0 /\\ x' = 1" },
  { name: "reset", init: "x = 2", next: "x' = IF x = 0 THEN 2 ELSE x - 1" },
];

const FAIRNESS = [
  { name: "unfair", text: "" },
  { name: "weak", text: " /\\ WF_x(Next)" },
  { name: "strong", text: " /\\ SF_x(Next)" },
  { name: "weak_step", text: " /\\ WF_x(x = 0 /\\ Next)" },
  { name: "strong_step", text: " /\\ SF_x(x = 1 /\\ Next)" },
  { name: "weak_and_strong", text: " /\\ WF_x(x = 0 /\\ Next) /\\ SF_x(x = 1 /\\ Next)" },
  { name: "weak_subscript_tuple", text: " /\\ WF_<<x, x>>(Next)" },
  { name: "strong_subscript_expression", text: " /\\ SF_(x + 1)(Next)" },
  { name: "weak_quantified", text: " /\\ \\A v \\in 0..2 : WF_x(x = v /\\ Next)" },
  { name: "strong_quantified", text: " /\\ \\A v \\in 0..2 : SF_x(x = v /\\ Next)" },
  { name: "weak_disjunction", text: " /\\ WF_x(x = 0 /\\ Next \\/ x = 2 /\\ Next)" },
  { name: "weak_change_to_zero", text: " /\\ WF_x(x' = 0 /\\ Next)" },
];

const FORMULAS = [
  { name: "always", text: "[](x \\in 0..2)" },
  { name: "always_false", text: "[](x = 0)" },
  { name: "eventually", text: "<>(x = 2)" },
  { name: "eventually_one", text: "<>(x = 1)" },
  { name: "eventually_false", text: "<>(x = 9)" },
  { name: "infinitely_often", text: "[]<>(x = 0)" },
  { name: "infinitely_often_two", text: "[]<>(x = 2)" },
  { name: "eventually_always", text: "<>[](x = 1)" },
  { name: "eventually_always_two", text: "<>[](x = 2)" },
  { name: "leads_to", text: "(x = 0) ~> (x = 2)" },
  { name: "leads_to_back", text: "(x = 1) ~> (x = 0)" },
  { name: "leads_to_set", text: "(x \\in {1, 2}) ~> (x = 0)" },
  { name: "leads_to_always", text: "(x = 1) ~> [](x = 1)" },
  { name: "always_leads_to", text: "[]((x = 0) ~> (x = 1))" },
  { name: "always_action", text: "[][x' >= x]_x" },
  { name: "always_action_tuple", text: "[][x' = x + 1]_<<x>>" },
  { name: "always_action_expression", text: "[][x' /= x]_(x * 2)" },
  { name: "eventually_action", text: "<><<x' = x + 1>>_x" },
  { name: "eventually_action_tuple", text: "<><<x' = 1>>_<<x>>" },
  { name: "always_eventually_action", text: "[]<><<x' = 0>>_x" },
  { name: "eventually_always_action", text: "<>[][x' = x]_x" },
  { name: "conjunction", text: "<>(x = 1) /\\ []<>(x = 2)" },
  { name: "disjunction", text: "<>(x = 2) \\/ <>[](x = 1)" },
  { name: "implication", text: "<>(x = 1) => <>(x = 2)" },
  { name: "equivalence", text: "<>(x = 1) <=> <>(x = 2)" },
  { name: "negation", text: "~[](x = 0)" },
  { name: "negated_eventually", text: "~<>(x = 9)" },
  { name: "double_negation", text: "~~<>(x = 1)" },
  { name: "negated_leads_to", text: "~((x = 0) ~> (x = 2))" },
  { name: "enabled", text: "[](ENABLED Next => x < 3)" },
  { name: "enabled_eventually", text: "<>(ENABLED (x' = 0))" },
  { name: "implied_weak", text: "WF_x(Next)" },
  { name: "implied_strong", text: "SF_x(Next)" },
  { name: "implied_weak_step", text: "WF_x(x = 0 /\\ Next)" },
  { name: "implied_strong_step", text: "SF_x(x = 1 /\\ Next)" },
  { name: "quantified_all", text: "\\A v \\in 0..2 : (x = v) ~> (x = 0)" },
  { name: "quantified_exists", text: "\\E v \\in 0..2 : <>[](x = v)" },
  { name: "quantified_empty", text: "\\A v \\in {} : <>(x = v)" },
  { name: "let_formula", text: "LET p == x = 1 IN <>p" },
  { name: "if_formula", text: "IF TRUE THEN <>(x = 1) ELSE <>(x = 2)" },
  { name: "case_formula", text: "CASE TRUE -> <>(x = 1) [] OTHER -> <>(x = 2)" },
  { name: "state_constant", text: "<>TRUE" },
  { name: "state_predicate", text: "x = 0" },
  { name: "action_only", text: "x' = x" },
  { name: "always_conjunction", text: "[](x >= 0 /\\ x <= 2)" },
  { name: "always_of_always", text: "[][](x \\in 0..2)" },
  { name: "eventually_of_eventually", text: "<><>(x = 1)" },
  { name: "nested_alternation", text: "[]<>[]<>(x = 0)" },
  { name: "three_branches", text: "<>(x = 0) \\/ (<>(x = 1) /\\ <>(x = 2))" },
  { name: "mixed_safety_liveness", text: "[](x \\in 0..2) /\\ <>(x = 1) /\\ [][x' >= 0]_x" },
];

const CHECK_REF = "tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java";

const PAIRED_FAIRNESS = ["unfair", "weak"];
const PAIRED_FORMULAS = [
  "eventually",
  "infinitely_often",
  "eventually_always",
  "leads_to",
  "always_eventually_action",
];

const CASES = MACHINES.flatMap((machine) => [
  ...FAIRNESS.filter((fairness) => PAIRED_FAIRNESS.includes(fairness.name)).flatMap((fairness) =>
    FORMULAS.map((formula) => ({ machine, fairness, formula })),
  ),
  ...FAIRNESS.filter((fairness) => !PAIRED_FAIRNESS.includes(fairness.name)).flatMap((fairness) =>
    FORMULAS.filter((formula) => PAIRED_FORMULAS.includes(formula.name)).map((formula) => ({
      machine,
      fairness,
      formula,
    })),
  ),
]);

const TLC_BUG_CASES = ["live_reset__weak__negated_leads_to"];

export const generateTemporalMatrix = () =>
  CASES.forEach(({ machine, fairness, formula }) =>
    writeTest(
      `liveness/${machine.name}/${fairness.name}`,
      {
        description: `Checks ${formula.name} on the ${machine.name} machine under ${fairness.name} fairness.`,
        ref: CHECK_REF,
        features: TLC_BUG_CASES.includes(`live_${machine.name}__${fairness.name}__${formula.name}`)
          ? ["liveness", "tlc-bug"]
          : ["liveness"],
        outcome: "any",
        config: "SPECIFICATION Spec\nPROPERTY Prop\nCHECK_DEADLOCK FALSE\n",
      },
      `live_${machine.name}__${fairness.name}__${formula.name}`,
      `EXTENDS Integers\nVARIABLE x\nNext == ${machine.next}\nSpec == ${machine.init} /\\ [][Next]_x${fairness.text}\nProp == ${formula.text}`,
    ),
  );
