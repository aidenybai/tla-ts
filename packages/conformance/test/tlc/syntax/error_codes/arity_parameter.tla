(*---
description: 4204 fires for a plain parameter with an argument.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_parameter ----
A(p) == p(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 10 to line 8, col 12 of module arity_parameter
    | The operator p requires 0 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
