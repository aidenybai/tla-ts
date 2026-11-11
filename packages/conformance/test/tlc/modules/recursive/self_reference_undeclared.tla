(*---
description: "Without RECURSIVE, an operator cannot use itself."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [recursive]
outcome: parse-error
---*)
---- MODULE self_reference_undeclared ----
F(n) == F(n)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 9 of module self_reference_undeclared
    | Unknown operator: `F'.
    3002:1 Parsing or semantic analysis failed.
---*)
