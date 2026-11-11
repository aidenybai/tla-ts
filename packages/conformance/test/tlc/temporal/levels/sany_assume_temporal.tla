(*---
description: 'SANY rejects a temporal formula in an ASSUME.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness, levels]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE sany_assume_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
ASSUME <>TRUE
Prop == <>(x = 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 1 to line 16, col 13 of module sany_assume_temporal
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 3.
    3002:1 Parsing or semantic analysis failed.
---*)
