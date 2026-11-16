(*---
description: The function argument count check also applies to the two-bound form with three arguments.
ref: "tla2sany/semantic/Generator.java#generateExpressionOrLAP"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE function_wrong_argument_count_three ----
f[a \in {1}, b \in {2}] == a
Test == f[1, 2, 3] = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 9 to line 9, col 18 of module function_wrong_argument_count_three
    | Function 'f' is defined with 2 parameters, but is applied to 3 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
