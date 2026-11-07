(*---
description: A bound name of arity zero passed as an operator is rejected.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_expression_bound ----
Ap(F(_)) == F(1)
A == \A x \in {1} : Ap(x)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 24 to line 9, col 24 of module higher_expression_bound
    | Expected arity 1 but found operator of arity 0.
    | line 9, col 21 to line 9, col 25 of module higher_expression_bound
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
