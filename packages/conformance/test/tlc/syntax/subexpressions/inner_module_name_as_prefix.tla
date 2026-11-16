(*---
description: "A nested module's name is not a selector prefix."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE inner_module_name_as_prefix ----
---- MODULE I ----
A == 1
====
Test == I!A = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 9 to line 11, col 11 of module inner_module_name_as_prefix
    | Unknown operator: `I!A'.
    3002:1 Parsing or semantic analysis failed.
---*)
