(*---
description: "A set map's bound name is not in scope in its own bound set."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_in_set_map_bound ----
A == {x : x \in {x}}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 18 to line 8, col 18 of module undefined_in_set_map_bound
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
