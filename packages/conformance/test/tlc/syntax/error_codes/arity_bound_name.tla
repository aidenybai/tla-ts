(*---
description: 4204 fires for a bound name with an argument.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_bound_name ----
A == \A x \in {1} : x(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 22 to line 8, col 24 of module arity_bound_name
    | The operator x requires 0 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
