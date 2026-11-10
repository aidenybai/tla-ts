(*---
description: A plain constant cannot be set to an operator with parameters.
ref: "tla2sany/semantic/Generator.java#generateSubst"
features: [instance]
outcome: parse-error
---*)
---- MODULE plain_constant_with_operator_name ----
---- MODULE I ----
CONSTANT c
====
G(x) == x
M == INSTANCE I WITH c <- G
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 27 to line 12, col 27 of module plain_constant_with_operator_name
    | The operator G requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
