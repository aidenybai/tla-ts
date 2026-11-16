(*---
description: An action passed where the result is primed exceeds the level limit.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_level_primed_operator_argument_result ----
VARIABLE v
Ap(F(_)) == F(v)
B(x) == x'
A == Ap(B)'
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 6 to line 11, col 11 of module higher_level_primed_operator_argument_result
    | Level error in applying operator ':
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
