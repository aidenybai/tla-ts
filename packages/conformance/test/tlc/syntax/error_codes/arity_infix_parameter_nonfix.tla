(*---
description: 4204 fires for an infix parameter given one argument.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_infix_parameter_nonfix ----
A(_ ++ _) == ++(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 16 to line 8, col 18 of module arity_infix_parameter_nonfix
    | The operator ++ requires 2 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
