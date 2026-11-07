(*---
description: The second CASE selector must be 1 or 2.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE case_second_selector_range ----
Op == CASE TRUE -> 1 [] FALSE -> 2
Test == Op!1!3 = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 14 to line 9, col 14 of module case_second_selector_range
    | Second selector for CASE subexpression must specify  one of two operands.
    3002:1 Parsing or semantic analysis failed.
---*)
