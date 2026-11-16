(*---
description: An EXCEPT selector past the last operand is rejected as nonexistent.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE except_operand_range ----
Op == [<<1>> EXCEPT ![1] = 2]
Test == Op!3 = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module except_operand_range
    | Nonexistent operand specified by `argument selector 3'.
    3002:1 Parsing or semantic analysis failed.
---*)
