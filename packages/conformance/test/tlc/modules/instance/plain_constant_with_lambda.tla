(*---
description: A plain constant cannot be set to a LAMBDA.
ref: "tla2sany/semantic/Generator.java#generateSubst"
features: [instance]
outcome: parse-error
---*)
---- MODULE plain_constant_with_lambda ----
---- MODULE I ----
CONSTANT c
====
M == INSTANCE I WITH c <- LAMBDA x : x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 27 to line 11, col 38 of module plain_constant_with_lambda
    | LAMBDA expression used where an expression is required.
    3002:1 Parsing or semantic analysis failed.
---*)
