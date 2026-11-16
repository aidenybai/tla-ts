(*---
description: 4205 fires for a primed box-action subscript.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE level_prime_in_subscript ----
VARIABLE v
A == [][TRUE]_(v')
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 8 to line 9, col 18 of module level_prime_in_subscript
    | Level error in applying operator $SquareAct:
    | The level of argument 2 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
