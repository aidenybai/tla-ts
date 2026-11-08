(*---
description: 'A constant operator replaced by a state-level definition passes SANY''s constant check on an ASSUME, and its evaluation fails on the variable, exit 10.'
ref: tlc2/tool/ModelChecker.java#checkAssumptions
features: [liveness, levels]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  CONSTANT Op <- T
---*)
---- MODULE config_operator_state_in_assume ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
CONSTANT Op(_)
T(a) == x = a
ASSUME Op(1)
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2105:1 Evaluating assumption line 19, col 8 to line 19, col 12 of module config_operator_state_in_assume failed.
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 18, col 9 to line 18, col 9 of module config_operator_state_in_assume
---*)
