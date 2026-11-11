(*---
description: "!>> needs exactly two operands."
ref: "tla2sany/semantic/Generator.java#ArgNum"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE chevron_right_on_three_operands ----
Op == <<1, 2, 3>>
Test == Op!>> = 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 13 of module chevron_right_on_three_operands
    | Nonexistent operand specified by `>>'.
    3002:1 Parsing or semantic analysis failed.
---*)
