(*---
description: "A label in a LAMBDA must list the LAMBDA's parameters."
ref: "tla2sany/semantic/Generator.java#generateLambda"
features: [labels]
outcome: parse-error
---*)
---- MODULE label_in_lambda_without_parameter ----
Ap(F(_)) == F(1)
Test == Ap(LAMBDA x : l:: x = 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 23 to line 9, col 31 of module label_in_lambda_without_parameter
    | Label l must contain formal parameter `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
