(*---
description: An operator parameter must get its arity of arguments.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE apply_wrong_arity ----
Op(F(_)) == F(1, 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 14 to line 8, col 19 of module apply_wrong_arity
    | The operator F requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
