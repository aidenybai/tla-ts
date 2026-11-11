(*---
description: An instance prefix names only what the module defines.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE bang_with_infix_undefined_in_instance ----
---- MODULE I ----
A == 1
====
M == INSTANCE I
Test == M!B = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 9 to line 12, col 11 of module bang_with_infix_undefined_in_instance
    | Unknown operator: `M!B'.
    3002:1 Parsing or semantic analysis failed.
---*)
