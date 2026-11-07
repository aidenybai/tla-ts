(*---
description: "!0 is not an operand."
ref: "tla2sany/semantic/Generator.java#ArgNum"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE zero_is_not_an_operand ----
EXTENDS Naturals
Op == 1 + 2
Test == Op!0 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 12 to line 10, col 12 of module zero_is_not_an_operand
    | Nonexistent operand specified by `argument selector 0'.
    3002:1 Parsing or semantic analysis failed.
---*)
