(*---
description: "An operator's parameter may not share the operator's name."
ref: "tla2sany/semantic/Generator.java#processOperator"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE operator_named_as_own_parameter ----
A(A) == A
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 1 to line 8, col 9 of module operator_named_as_own_parameter
    | Operator A already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
