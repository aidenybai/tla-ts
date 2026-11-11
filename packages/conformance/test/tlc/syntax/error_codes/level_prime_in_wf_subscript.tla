(*---
description: 4205 fires for a primed fairness subscript.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE level_prime_in_wf_subscript ----
VARIABLE v
A == WF_(v')(TRUE)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 18 of module level_prime_in_wf_subscript
    | Level error in applying operator $WF:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
