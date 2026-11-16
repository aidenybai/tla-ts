(*---
description: 4200 fires in the set of a quantifier bound.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_in_bound_set ----
A == \A x \in Missing : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 15 to line 8, col 21 of module undefined_in_bound_set
    | Unknown operator: `Missing'.
    3002:1 Parsing or semantic analysis failed.
---*)
