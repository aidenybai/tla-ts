(*---
description: 4274 fires for a LAMBDA nested in another LAMBDA.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_lambda_nested_pass ----
Ap(F(_)) == F(1)
Out(G(_)) == 1
A == Out(LAMBDA a : Ap(LAMBDA b, c : 1))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 21 to line 10, col 22 of module higher_lambda_nested_pass
    | Lambda expression with arity 2 used as argument 1 of operator `Ap', 
    | but an operator of arity 1 is required.
    | line 10, col 21 to line 10, col 39 of module higher_lambda_nested_pass
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
