(*---
description: 'The invariant level check does not see through a replaced constant operator, so an action invariant passes startup and fails on the first state reading an unbound primed variable, exit 75.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
features: [liveness, levels]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  CONSTANT Op <- T
  INVARIANT Inv
---*)
---- MODULE config_operator_action_in_invariant ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
CONSTANT Op(_)
T(a) == x' = 1
Inv == Op(TRUE)
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 19, col 9 to line 19, col 9 of module config_operator_action_in_invariant
    | While working on the initial state:
    | x = 0
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 19, col 9 to line 19, col 9 of module config_operator_action_in_invariant
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 13 in config_operator_action_in_invariant
    1. Line 20, column 8 to line 20, column 15 in config_operator_action_in_invariant
    2. Line 19, column 9 to line 19, column 14 in config_operator_action_in_invariant
    3. Line 19, column 9 to line 19, column 10 in config_operator_action_in_invariant
    4. Line 19, column 9 to line 19, column 9 in config_operator_action_in_invariant
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
