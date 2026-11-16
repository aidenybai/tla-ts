(*---
description: A bound name is out of scope after its quantifier.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_after_scope_of_bound ----
A == (\A x \in {1} : TRUE) /\ x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 31 to line 8, col 31 of module undefined_after_scope_of_bound
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
