(*---
description: 4271 fires for a built-in infix passed for an arity-1 parameter.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_builtin_to_arity_one ----
Ap(F(_)) == F(1)
A == Ap(\cup)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 6 to line 9, col 7 of module higher_builtin_to_arity_one
    | Operator with incorrect arity passed as argument. 
    | Operator '\union' of arity 2 is argument number 1 (counting from 1) to operator `line 8, col 1 to line 8, col 16 of module higher_builtin_to_arity_one', 
    | but an operator of arity 1 was expected.
    | line 9, col 6 to line 9, col 13 of module higher_builtin_to_arity_one
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
