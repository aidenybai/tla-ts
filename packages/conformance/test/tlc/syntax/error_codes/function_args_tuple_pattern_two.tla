(*---
description: "A tuple pattern is one parameter of arity one, so two arguments are rejected."
ref: "tla2sany/semantic/Generator.java#generateExpressionOrLAP"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE function_args_tuple_pattern_two ----
f[<<a, b>> \in {<<1, 2>>}] == a
A == f[1, 2]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 12 of module function_args_tuple_pattern_two
    | Function 'f' is defined with 1 parameters, but is applied to 2 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
