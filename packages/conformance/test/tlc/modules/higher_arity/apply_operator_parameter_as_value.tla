(*---
description: An operator parameter must be applied to its arguments.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE apply_operator_parameter_as_value ----
Op(F(_)) == F
Test == Op(LAMBDA a : a)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 13 to line 8, col 13 of module apply_operator_parameter_as_value
    | The operator F requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
