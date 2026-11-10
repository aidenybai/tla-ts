import { writeTest } from "./generate-common";

const INITS = [
  { name: "equal", text: "x = 0 /\\ y = 0" },
  { name: "membership", text: "x \\in 0..1 /\\ y \\in {0}" },
  { name: "disjunction", text: "(x = 0 \\/ x = 1) /\\ y = 0" },
  { name: "whole_disjunction", text: "\\/ x = 0 /\\ y = 0\n        \\/ x = 1 /\\ y = 1" },
  { name: "exists", text: "\\E v \\in 0..1 : x = v /\\ y = v" },
  { name: "if", text: "x = 0 /\\ IF x = 0 THEN y = 1 ELSE y = 2" },
  { name: "case", text: "x = 1 /\\ CASE x = 1 -> y = 0 [] OTHER -> y = 1" },
  { name: "let", text: "LET v == 1 IN x = v /\\ y = v" },
  { name: "guard_first", text: "TRUE /\\ x = 0 /\\ y = 0" },
  { name: "reversed", text: "y = 0 /\\ x = y" },
  { name: "tuple", text: "<<x, y>> = <<0, 1>>" },
  { name: "tuple_membership", text: "<<x, y>> \\in {0, 1} \\X {0}" },
  { name: "set_equality", text: "x \\in {0} /\\ y \\in SUBSET {} /\\ y = {} " },
  { name: "record", text: "x = [a |-> 0] /\\ y = 0" },
  { name: "function", text: "x = [e \\in {1} |-> 0] /\\ y = <<>>" },
  { name: "unassigned", text: "x = 0" },
  { name: "read_before_assign", text: "x = y /\\ y = 0" },
  { name: "unsatisfiable", text: "x = 0 /\\ y = 0 /\\ x = 1" },
  { name: "operator", text: "Assign(0, 0)" },
  { name: "chosen", text: "x = CHOOSE e \\in 0..1 : TRUE /\\ y = 0" },
];

const NEXTS = [
  { name: "increment", text: "x' = x /\\ y' = y" },
  { name: "unchanged_tuple", text: "UNCHANGED <<x, y>>" },
  { name: "unchanged_each", text: "UNCHANGED x /\\ UNCHANGED y" },
  { name: "unchanged_definition", text: "UNCHANGED vars" },
  { name: "membership", text: "x' \\in {x} /\\ y' \\in {y, y}" },
  { name: "disjunction", text: "\\/ x' = x /\\ y' = y\n        \\/ y' = y /\\ x' = x" },
  { name: "exists", text: "\\E v \\in {y} : y' = v /\\ x' = x" },
  { name: "if", text: "IF TRUE THEN x' = x /\\ y' = y ELSE FALSE" },
  { name: "case", text: "CASE TRUE -> x' = x /\\ y' = y [] OTHER -> FALSE" },
  { name: "let", text: "LET k == x IN x' = k /\\ y' = y" },
  { name: "tuple_prime", text: "<<x, y>>' = <<x, y>>" },
  { name: "reversed", text: "y' = y /\\ x' = x" },
  { name: "read_primed", text: "x' = x /\\ y' = x'" },
  { name: "guard_false", text: "FALSE /\\ x' = x /\\ y' = y" },
  { name: "unassigned", text: "x' = x" },
  { name: "prime_read_before_assign", text: "x' = y' /\\ y' = y" },
  { name: "two_actions", text: "(x' = x /\\ y' = y) \\/ (UNCHANGED vars)" },
  { name: "composition", text: "(x' = x /\\ y' = y) \\cdot (x' = x /\\ y' = y)" },
  { name: "enabled_guard", text: "ENABLED (x' = x) /\\ x' = x /\\ y' = y" },
  { name: "operator", text: "Assign(x, y)'" },
  { name: "operator_primed_arguments", text: "x' = x /\\ y' = y /\\ Same(x', y')" },
  { name: "toggle", text: "x' = x /\\ y' = IF y = 0 THEN 1 ELSE 0" },
  { name: "grow", text: "x' = x /\\ y' = y /\\ x = x" },
  { name: "branch", text: "x' \\in {x} /\\ (y' = y \\/ y' = y)" },
  { name: "except", text: "x' = [[z \\in {1} |-> 0] EXCEPT ![1] = 1] /\\ y' = y" },
];

const CHECKS = [
  { name: "plain", config: "", definitions: "" },
  { name: "no_deadlock_check", config: "CHECK_DEADLOCK FALSE\n", definitions: "" },
  { name: "invariant_holds", config: "INVARIANT Inv\n", definitions: "Inv == TRUE" },
  { name: "invariant_fails", config: "INVARIANT Inv\n", definitions: "Inv == FALSE" },
  { name: "invariant_non_boolean", config: "INVARIANT Inv\n", definitions: "Inv == 1" },
  { name: "state_constraint", config: "CONSTRAINT Con\n", definitions: "Con == FALSE" },
  { name: "action_constraint", config: "ACTION_CONSTRAINT Con\n", definitions: "Con == x' = x" },
  { name: "view", config: "VIEW View\n", definitions: "View == 1" },
];

const OPERATORS =
  "vars == <<x, y>>\nAssign(a, b) == x = a /\\ y = b\nSame(a, b) == a = a /\\ b = b";

export const generateCheckerMatrix = () =>
  INITS.forEach((init) =>
    NEXTS.forEach((next) =>
      CHECKS.forEach((check) =>
        writeTest(
          `state_space/${init.name}/${next.name}`,
          {
            description: `Explores init ${init.name} and next ${next.name} with check ${check.name}.`,
            ref: "tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates",
            features: ["state-space"],
            outcome: "any",
            config: `INIT Init\nNEXT Next\n${check.config}`,
          },
          `space_${init.name}__${next.name}__${check.name}`,
          `EXTENDS Integers\nVARIABLES x, y\n${OPERATORS}\nInit == ${init.text}\nNext == ${next.text}\n${check.definitions}`,
        ),
      ),
    ),
  );
