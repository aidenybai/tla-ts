(*---
description: An implicit substitution with the wrong arity is an error.
ref: "tla2sany/semantic/Generator.java#checkSubstitutionForCorrectArity"
features: [instance]
outcome: parse-error
---*)
---- MODULE operator_constant_implicit_wrong_arity ----
---- MODULE I ----
CONSTANT F(_)
====
F(a, b) == 1
M == INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 1 to line 12, col 15 of module operator_constant_implicit_wrong_arity
    | An operator must be substituted for symbol 'F', and it must have arity 1.
    3002:1 Parsing or semantic analysis failed.
---*)
