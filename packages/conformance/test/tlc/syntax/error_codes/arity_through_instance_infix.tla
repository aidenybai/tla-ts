(*---
description: 4204 fires through an instance prefix.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_through_instance_infix ----
M == INSTANCE Naturals
A == M!+(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 9 to line 9, col 11 of module arity_through_instance_infix
    | The operator M!+ requires 2 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
