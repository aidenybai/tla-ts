(*---
description: A string has no subexpression.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE selector_of_string ----
Op == "abc"
Test == Op!1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module selector_of_string
    | Selecting subexpression of expression that has none.
    3002:1 Parsing or semantic analysis failed.
---*)
