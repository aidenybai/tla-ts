(*---
description: A number selector cannot enter a LAMBDA.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE lambda_number_selector ----
Ap(F(_), x) == F(x)
Op == Ap(LAMBDA x : x = 1, 1)
Test == Op!1!1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 14 to line 10, col 14 of module lambda_number_selector
    | Cannot use !N_StructOp to select subexpression of a LAMBDA.
    3002:1 Parsing or semantic analysis failed.
---*)
