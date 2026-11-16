(*---
description: 4204 fires for an infix constant given one argument.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_constant_infix_declared ----
CONSTANT _ ++ _
A == ++(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 8 to line 9, col 10 of module arity_constant_infix_declared
    | The operator ++ requires 2 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
