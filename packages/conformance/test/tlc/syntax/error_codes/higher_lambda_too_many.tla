(*---
description: 4274 fires for a LAMBDA with too many parameters.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_lambda_too_many ----
Ap(F(_)) == F(1)
A == Ap(LAMBDA a, b : 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 6 to line 9, col 7 of module higher_lambda_too_many
    | Lambda expression with arity 2 used as argument 1 of operator `Ap', 
    | but an operator of arity 1 is required.
    | line 9, col 6 to line 9, col 24 of module higher_lambda_too_many
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
