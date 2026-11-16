(*---
description: 4204 fires at the end of an instance chain.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_through_instance_chain ----
---- MODULE J ----
D(x) == x
====
---- MODULE I ----
N == INSTANCE J
====
M == INSTANCE I
A == M!N!D
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 15, col 6 to line 15, col 10 of module arity_through_instance_chain
    | The operator M!N!D requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
