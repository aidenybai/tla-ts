(*---
description: A primed argument to an operator that primes its parameter is rejected.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE level_operator_parameter_exceeds ----
VARIABLE v
A(x) == x'
B == A(v')
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 6 to line 10, col 10 of module level_operator_parameter_exceeds
    | Level error in applying operator A:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
