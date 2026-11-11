(*---
description: A parameter is out of scope in the next definition.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_parameter_of_other_operator ----
A(p) == p
B == p
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 6 of module undefined_parameter_of_other_operator
    | Unknown operator: `p'.
    3002:1 Parsing or semantic analysis failed.
---*)
