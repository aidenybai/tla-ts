(*---
description: 'SANY rejects a temporal subscript on [A]_v.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness, levels]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE sany_subscript_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == [][x' = 1]_(<>(x = 1))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 11 to line 16, col 30 of module sany_subscript_temporal
    | Level error in applying operator $SquareAct:
    | The level of argument 2 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
