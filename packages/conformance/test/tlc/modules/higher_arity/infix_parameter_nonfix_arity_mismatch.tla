(*---
description: An infix parameter has arity two.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE infix_parameter_nonfix_arity_mismatch ----
Op(_ ++ _) == ++(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 17 to line 8, col 19 of module infix_parameter_nonfix_arity_mismatch
    | The operator ++ requires 2 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
