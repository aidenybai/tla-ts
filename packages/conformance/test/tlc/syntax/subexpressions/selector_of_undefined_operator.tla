(*---
description: A selector on an undefined operator symbol reports the selected name.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE selector_of_undefined_operator ----
Test == ^#!x /\ -.!x /\ ^#(1)!x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 8, col 9 to line 8, col 12 of module selector_of_undefined_operator
    | Unknown operator: `^#!x'.
    | line 8, col 17 to line 8, col 20 of module selector_of_undefined_operator
    | Unknown operator: `-.!x'.
    | line 8, col 25 to line 8, col 31 of module selector_of_undefined_operator
    | Unknown operator: `^#!x'.
    3002:1 Parsing or semantic analysis failed.
---*)
