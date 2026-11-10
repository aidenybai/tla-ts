(*---
description: ENABLED of [] is rejected by the semantic pass because ENABLED takes an action.
ref: tla2sany/semantic/OpApplNode.java#levelCheck
outcome: parse-error
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE temporal_box ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED ([](x = 0)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 15, col 15 to line 15, col 33 of module temporal_box
    | Level error in applying operator ENABLED:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
