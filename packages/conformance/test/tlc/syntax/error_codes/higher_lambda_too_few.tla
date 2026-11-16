(*---
description: 4274 fires for a LAMBDA with too few parameters.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_lambda_too_few ----
Ap(F(_, _)) == F(1, 2)
A == Ap(LAMBDA a : 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 6 to line 9, col 7 of module higher_lambda_too_few
    | Lambda expression with arity 1 used as argument 1 of operator `Ap', 
    | but an operator of arity 2 is required.
    | line 9, col 6 to line 9, col 21 of module higher_lambda_too_few
    | Argument number 1 to operator 'Ap' 
    | should be a 2-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
