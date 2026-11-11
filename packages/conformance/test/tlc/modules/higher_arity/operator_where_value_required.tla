(*---
description: An operator with parameters is not a value.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE operator_where_value_required ----
Id(a) == a
Op(x) == x
Test == Op(Id)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 12 to line 10, col 13 of module operator_where_value_required
    | The operator Id requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
