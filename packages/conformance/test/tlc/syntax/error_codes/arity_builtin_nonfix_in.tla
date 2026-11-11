(*---
description: "4204 fires for \\in with one argument in nonfix form."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_builtin_nonfix_in ----
A == \in(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 11 of module arity_builtin_nonfix_in
    | The operator \in requires 2 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
