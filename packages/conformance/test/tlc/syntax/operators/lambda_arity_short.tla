(*---
description: A LAMBDA with too few parameters is rejected.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
outcome: parse-error
---*)
---- MODULE lambda_arity_short ----
Op(F(_,_)) == F(1, 2)
Test == Op(LAMBDA a : a)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 9 to line 9, col 10 of module lambda_arity_short
    | Lambda expression with arity 1 used as argument 1 of operator `Op', 
    | but an operator of arity 2 is required.
    | line 9, col 9 to line 9, col 24 of module lambda_arity_short
    | Argument number 1 to operator 'Op' 
    | should be a 2-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
