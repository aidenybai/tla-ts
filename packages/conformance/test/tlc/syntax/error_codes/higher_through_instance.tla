(*---
description: 4271 fires for an operator named through an instance.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_through_instance ----
M == INSTANCE Naturals
Ap(F(_)) == F(1)
A == Ap(M!+)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 9 to line 10, col 11 of module higher_through_instance
    | Expected arity 1 but found operator of arity 2.
    | line 10, col 6 to line 10, col 12 of module higher_through_instance
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
