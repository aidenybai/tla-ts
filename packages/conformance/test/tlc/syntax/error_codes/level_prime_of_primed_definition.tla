(*---
description: 4205 fires for a prime around a primed definition.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE level_prime_of_primed_definition ----
VARIABLE v
A == v'
B == A'
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 6 to line 10, col 7 of module level_prime_of_primed_definition
    | Level error in applying operator ':
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
