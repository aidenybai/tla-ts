(*---
description: A record selector past the last field is rejected.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE record_constructor_range ----
Op == [a |-> 1]
Test == Op!2 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module record_constructor_range
    | Nonexistent operand specified by `argument selector 2'.
    3002:1 Parsing or semantic analysis failed.
---*)
