(*---
description: A bound name is not in scope in its own bound set.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_bound_in_own_bound ----
A == \A x \in {x} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 16 to line 8, col 16 of module undefined_bound_in_own_bound
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
