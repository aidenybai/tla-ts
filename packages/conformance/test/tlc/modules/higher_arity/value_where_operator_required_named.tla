(*---
description: A named value is not an operator.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE value_where_operator_required_named ----
A == 1
Op(F(_)) == F(1)
Test == Op(A)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 12 to line 10, col 12 of module value_where_operator_required_named
    | Expected arity 1 but found operator of arity 0.
    | line 10, col 9 to line 10, col 13 of module value_where_operator_required_named
    | Argument number 1 to operator 'Op' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
