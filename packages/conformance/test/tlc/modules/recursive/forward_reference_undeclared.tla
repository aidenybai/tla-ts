(*---
description: "Without RECURSIVE, an operator cannot use a later one."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [recursive]
outcome: parse-error
---*)
---- MODULE forward_reference_undeclared ----
G == F
F == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 6 to line 8, col 6 of module forward_reference_undeclared
    | Unknown operator: `F'.
    3002:1 Parsing or semantic analysis failed.
---*)
