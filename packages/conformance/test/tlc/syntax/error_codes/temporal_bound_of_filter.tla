(*---
description: A temporal bound in a set filter is rejected.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE temporal_bound_of_filter ----
VARIABLE v
A == {x \in []v : TRUE}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 23 of module temporal_bound_of_filter
    | Level error in applying operator $SubsetOf:
    | The level of the range for the bounded variable line 9, col 7 to line 9, col 7 of module temporal_bound_of_filter 
    | exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
