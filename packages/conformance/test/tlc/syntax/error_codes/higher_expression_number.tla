(*---
description: 4270 fires for a number passed as an operator.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_expression_number ----
Ap(F(_)) == F(1)
A == Ap(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 9 to line 9, col 9 of module higher_expression_number
    | An expression appears as argument number 1 (counting from 1) to operator 'Ap', in a position an operator is required.
    | line 9, col 6 to line 9, col 10 of module higher_expression_number
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
