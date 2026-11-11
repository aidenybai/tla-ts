(*---
description: '= over parenthesized temporal formulas is a SANY level error.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE equals_of_temporal_parenthesized ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == (<>(x = 1)) = (<>(x = 2))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 16, col 9 to line 16, col 33 of module equals_of_temporal_parenthesized
    | Level error in applying operator =:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    | line 16, col 9 to line 16, col 33 of module equals_of_temporal_parenthesized
    | Level error in applying operator =:
    | The level of argument 2 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
