(*---
description: 'SANY rejects a temporal body in WF_v(A).'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness, levels]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE sany_weak_body_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == WF_x(<>(x = 1))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 9 to line 16, col 23 of module sany_weak_body_temporal
    | Level error in applying operator $WF:
    | The level of argument 2 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
