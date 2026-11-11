(*---
description: 4271 fires for an operator parameter passed onward at the wrong arity.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_parameter_passed_wrong_arity ----
In(F(_, _)) == F(1, 2)
Out(G(_)) == In(G)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 17 to line 9, col 17 of module higher_parameter_passed_wrong_arity
    | Expected arity 2 but found operator of arity 1.
    | line 9, col 14 to line 9, col 18 of module higher_parameter_passed_wrong_arity
    | Argument number 1 to operator 'In' 
    | should be a 2-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
