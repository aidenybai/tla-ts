(*---
description: "A name in one bound group is not in scope in a later group's bound set."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_first_bound_in_shared_bound ----
A == \A x \in {1}, y \in {x} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 27 to line 8, col 27 of module undefined_first_bound_in_shared_bound
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
