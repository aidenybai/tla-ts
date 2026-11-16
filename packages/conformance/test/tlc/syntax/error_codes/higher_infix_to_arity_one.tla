(*---
description: 4271 fires for an infix operator passed for an arity-1 parameter.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_infix_to_arity_one ----
EXTENDS Naturals
Ap(F(_)) == F(1)
A == Ap( + )
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 6 to line 10, col 7 of module higher_infix_to_arity_one
    | Operator with incorrect arity passed as argument. 
    | Operator '+' of arity 2 is argument number 1 (counting from 1) to operator `line 9, col 1 to line 9, col 16 of module higher_infix_to_arity_one', 
    | but an operator of arity 1 was expected.
    | line 10, col 6 to line 10, col 12 of module higher_infix_to_arity_one
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
