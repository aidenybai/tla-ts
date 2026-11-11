(*---
description: 'A tuple containing a temporal formula is a level error in SANY.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE record_of_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <<<>(x = 2)>>[1]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 9 to line 16, col 21 of module record_of_temporal
    | Level error in applying operator $Tuple:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
