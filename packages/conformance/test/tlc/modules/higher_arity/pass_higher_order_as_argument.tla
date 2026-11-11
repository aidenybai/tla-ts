(*---
description: An operator with an operator parameter may not be passed where its arity alone looks right.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE pass_higher_order_as_argument ----
In(F(_)) == F(1)
Ho(G(_)) == G(1)
Test == In(Ho)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 9 to line 10, col 14 of module pass_higher_order_as_argument
    | Argument number 1 to operator 'In' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
