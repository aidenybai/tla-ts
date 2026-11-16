(*---
description: A plain constant cannot be implicitly set by an operator with parameters.
ref: "tla2sany/semantic/Generator.java#checkSubstitutionForCorrectArity"
features: [instance]
outcome: parse-error
---*)
---- MODULE constant_implicit_with_operator_arity ----
---- MODULE I ----
CONSTANT c
====
c(a) == 1
M == INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 1 to line 12, col 15 of module constant_implicit_with_operator_arity
    | Wrong number of arguments (0) given to operator 'c', 
    | which requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
