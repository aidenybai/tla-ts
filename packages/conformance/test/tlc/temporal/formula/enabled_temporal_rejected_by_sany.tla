(*---
description: 'ENABLED of a temporal formula is a SANY level error, so TLC_ENABLED_WRONG_FORMULA cannot normally be reached.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE enabled_temporal_rejected_by_sany ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>ENABLED (<>(x = 1))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 11 to line 16, col 29 of module enabled_temporal_rejected_by_sany
    | Level error in applying operator ENABLED:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
