(*---
description: A plain constant passed as an operator is rejected.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_expression_constant ----
CONSTANT c
Ap(F(_)) == F(1)
A == Ap(c)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 9 to line 10, col 9 of module higher_expression_constant
    | Expected arity 1 but found operator of arity 0.
    | line 10, col 6 to line 10, col 10 of module higher_expression_constant
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
