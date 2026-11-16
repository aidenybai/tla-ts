(*---
description: Selecting a later EXCEPT operand is not implemented.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE except_later_operand ----
Op == [<<1>> EXCEPT ![1] = 2]
Test == Op!2 = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module except_later_operand
    | Selecting subexpression of an EXCEPT not yet implemented.
    3002:1 Parsing or semantic analysis failed.
---*)
