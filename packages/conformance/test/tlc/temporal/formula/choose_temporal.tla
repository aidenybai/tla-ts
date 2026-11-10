(*---
description: 'CHOOSE over temporal bodies is a SANY level error or has no case.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE choose_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == CHOOSE b \in BOOLEAN : b = <>(x = 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 32 to line 16, col 44 of module choose_temporal
    | Level error in applying operator =:
    | The level of argument 2 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
