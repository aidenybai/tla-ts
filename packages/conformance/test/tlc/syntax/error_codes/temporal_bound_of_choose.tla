(*---
description: A temporal bound in a CHOOSE is rejected.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE temporal_bound_of_choose ----
VARIABLE v
A == CHOOSE x \in []v : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 28 of module temporal_bound_of_choose
    | Level error in applying operator $BoundedChoose:
    | The level of the range for the bounded variable line 9, col 13 to line 9, col 13 of module temporal_bound_of_choose 
    | exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
