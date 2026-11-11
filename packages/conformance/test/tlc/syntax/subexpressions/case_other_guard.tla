(*---
description: An OTHER arm has no guard to select.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE case_other_guard ----
Op == CASE TRUE -> 1 [] OTHER -> 2
Test == Op!2!1 = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 14 to line 9, col 14 of module case_other_guard
    | Selecting OTHER in a CASE statement.
    3002:1 Parsing or semantic analysis failed.
---*)
