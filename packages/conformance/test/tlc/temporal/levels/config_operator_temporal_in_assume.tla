(*---
description: 'A constant operator replaced by a temporal definition in an ASSUME fails its evaluation with TLC_ENCOUNTERED_FORMULA_IN_PREDICATE, exit 10.'
ref: tlc2/tool/ModelChecker.java#checkAssumptions
features: [liveness, levels]
outcome: assumption-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  CONSTANT Op <- T
---*)
---- MODULE config_operator_temporal_in_assume ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
CONSTANT Op(_)
T(a) == <>(x = 1)
ASSUME Op(1)
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2261:0 TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 18, col 9 to line 18, col 17 of module config_operator_temporal_in_assume
    2261:0 TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 18, col 9 to line 18, col 17 of module config_operator_temporal_in_assume
---*)
