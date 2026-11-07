(*---
description: "A shared bound group of two takes two arguments, not three."
ref: "tla2sany/semantic/Generator.java#generateExpressionOrLAP"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE function_args_shared_bound_three ----
f[a, b \in {1}] == a
A == f[1, 2, 3]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 15 of module function_args_shared_bound_three
    | Function 'f' is defined with 2 parameters, but is applied to 3 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
