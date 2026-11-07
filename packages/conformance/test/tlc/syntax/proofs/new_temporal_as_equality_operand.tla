(*---
description: "A NEW TEMPORAL name has temporal level, so it cannot be an operand of =."
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [proofs]
outcome: parse-error
---*)
---- MODULE new_temporal_as_equality_operand ----
THEOREM ASSUME NEW TEMPORAL x PROVE x = x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 37 to line 8, col 41 of module new_temporal_as_equality_operand
    | Level error in applying operator =:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    | line 8, col 37 to line 8, col 41 of module new_temporal_as_equality_operand
    | Level error in applying operator =:
    | The level of argument 2 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
