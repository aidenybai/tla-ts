(*---
description: A plain parameter passed as an operator is rejected.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_expression_parameter ----
Ap(F(_)) == F(1)
A(x) == Ap(x)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 12 to line 9, col 12 of module higher_expression_parameter
    | Expected arity 1 but found operator of arity 0.
    | line 9, col 9 to line 9, col 13 of module higher_expression_parameter
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
