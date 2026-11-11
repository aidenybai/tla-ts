(*---
description: An operator parameter in the last position is caught by the arity check.
ref: "tla2sany/semantic/Generator.java#processOperator"
features: [recursive]
outcome: parse-error
---*)
---- MODULE definition_operator_param_last_rejected ----
RECURSIVE F(_, _)
F(y, G(_)) == y
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 15 of module definition_operator_param_last_rejected
    | Definition of F has different arity than its RECURSIVE declaration.
    3002:1 Parsing or semantic analysis failed.
---*)
