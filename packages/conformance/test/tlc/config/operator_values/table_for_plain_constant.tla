(*---
description: A table for a constant declared without arguments is accepted, and using the constant then fails because the table is an operator applied to no arguments.
ref: tlc2/tool/impl/SpecProcessor.java#makeConstantTable
outcome: evaluation-failure
config: |
  CONSTANT N(1) = 2
---*)
---- MODULE table_for_plain_constant ----
CONSTANT N
ASSUME N = 2
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 12 of module table_for_plain_constant failed.
    Attempted to apply the operator { <1, 2>}
    with wrong number of arguments.
---*)
