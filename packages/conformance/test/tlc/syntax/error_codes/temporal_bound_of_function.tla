(*---
description: A temporal bound in a function constructor is rejected.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE temporal_bound_of_function ----
VARIABLE v
A == [x \in []v |-> 1]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 22 of module temporal_bound_of_function
    | Level error in applying operator $FcnConstructor:
    | The level of the range for the bounded variable line 9, col 7 to line 9, col 7 of module temporal_bound_of_function 
    | exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
