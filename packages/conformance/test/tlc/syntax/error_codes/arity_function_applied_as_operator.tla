(*---
description: 4204 fires for a function applied in parentheses.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_function_applied_as_operator ----
f[x \in {1}] == x
A == f(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 9 of module arity_function_applied_as_operator
    | The operator f requires 0 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
