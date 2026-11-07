(*---
description: 4204 fires for a LET operator without its argument.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_missing_arguments_let ----
A == LET a(x) == 1 IN a
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 23 to line 8, col 23 of module arity_missing_arguments_let
    | The operator a requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
