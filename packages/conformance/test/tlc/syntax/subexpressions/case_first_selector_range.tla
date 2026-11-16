(*---
description: The first CASE selector must name an arm.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE case_first_selector_range ----
Op == CASE TRUE -> 1 [] FALSE -> 2
Test == Op!3!1 = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module case_first_selector_range
    | Nonexistent operand specified by `argument selector 3'.
    3002:1 Parsing or semantic analysis failed.
---*)
