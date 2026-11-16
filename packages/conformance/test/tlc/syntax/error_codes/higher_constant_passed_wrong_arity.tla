(*---
description: 4271 fires for an operator constant passed at the wrong arity.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_constant_passed_wrong_arity ----
CONSTANT C(_)
In(F(_, _)) == F(1, 2)
A == In(C)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 9 to line 10, col 9 of module higher_constant_passed_wrong_arity
    | Expected arity 2 but found operator of arity 1.
    | line 10, col 6 to line 10, col 10 of module higher_constant_passed_wrong_arity
    | Argument number 1 to operator 'In' 
    | should be a 2-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
