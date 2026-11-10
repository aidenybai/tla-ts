(*---
description: 'A function whose values are temporal is a SANY level error at $FcnApply.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE fcn_apply_temporal_value ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [i \in {1} |-> <>(x = 2)][1]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 9 to line 16, col 36 of module fcn_apply_temporal_value
    | Level error in applying operator $FcnApply:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
