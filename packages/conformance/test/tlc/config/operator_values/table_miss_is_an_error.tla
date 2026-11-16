(*---
description: Applying the table to an argument it doesn't list is an evaluation error.
ref: tlc2/value/impl/OpRcdValue.java#apply
outcome: assumption-violation
config: |
  CONSTANT F(1) = 2
---*)
---- MODULE table_miss_is_an_error ----
CONSTANT F(_)
ASSUME F(9) = 2
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 15 of module table_miss_is_an_error failed.
    Attempted to apply operator:
    { <1, 2>}
    to arguments (9), which is undefined.
---*)
