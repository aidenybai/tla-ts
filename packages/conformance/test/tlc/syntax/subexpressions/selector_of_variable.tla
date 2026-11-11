(*---
description: A variable has no subexpression.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE selector_of_variable ----
VARIABLE v
A == v!1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 6 of module selector_of_variable
    | Cannot take subexpression of `v'.
    3002:1 Parsing or semantic analysis failed.
---*)
