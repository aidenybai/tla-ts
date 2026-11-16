(*---
description: 4204 fires for TRUE with an argument.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_builtin_true ----
A == TRUE(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 10 to line 8, col 12 of module arity_builtin_true
    | The operator TRUE requires 0 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
