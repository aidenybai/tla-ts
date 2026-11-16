(*---
description: 4204 fires for a LET name with an extra argument.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_let ----
A == LET a == 1 IN a(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 21 to line 8, col 23 of module arity_let
    | The operator a requires 0 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
