(*---
description: A selector past the last operand is rejected.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE operand_too_high ----
EXTENDS Naturals
Op(x) == 1 + (2 * x)
Test == Op(5)!3 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 15 to line 10, col 15 of module operand_too_high
    | Nonexistent operand specified by `argument selector 3'.
    3002:1 Parsing or semantic analysis failed.
---*)
