(*---
description: 4315 fires when the temporal bound comes through a definition.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE temporal_bound_named ----
VARIABLE v
Tmp == []v
A == \A x \in Tmp : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 6 to line 10, col 24 of module temporal_bound_named
    | Level error in applying operator $BoundedForall:
    | The level of the range for the bounded variable line 10, col 9 to line 10, col 9 of module temporal_bound_named 
    | exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
