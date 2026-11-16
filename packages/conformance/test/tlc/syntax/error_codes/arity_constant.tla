(*---
description: 4204 fires for a plain constant with an argument.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_constant ----
CONSTANT c
A == c(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 9 of module arity_constant
    | The operator c requires 0 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
