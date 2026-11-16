(*---
description: 4271 fires for a prefix operator passed for an arity-2 parameter.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_prefix_to_arity_two ----
EXTENDS Integers
Ap(F(_, _)) == F(1, 2)
A == Ap(-.)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 6 to line 10, col 7 of module higher_prefix_to_arity_two
    | Operator with incorrect arity passed as argument. 
    | Operator '-.' of arity 1 is argument number 1 (counting from 1) to operator `line 9, col 1 to line 9, col 22 of module higher_prefix_to_arity_two', 
    | but an operator of arity 2 was expected.
    | line 10, col 6 to line 10, col 11 of module higher_prefix_to_arity_two
    | Argument number 1 to operator 'Ap' 
    | should be a 2-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
