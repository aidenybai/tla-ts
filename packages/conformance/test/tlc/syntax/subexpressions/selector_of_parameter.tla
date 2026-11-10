(*---
description: A parameter has no subexpression.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE selector_of_parameter ----
A(p) == p!1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 9 of module selector_of_parameter
    | Cannot take subexpression of `p'.
    3002:1 Parsing or semantic analysis failed.
---*)
