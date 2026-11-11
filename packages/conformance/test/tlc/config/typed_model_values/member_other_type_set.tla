(*---
description: Testing membership among model values of another type is an error.
ref: tlc2/value/impl/SetEnumValue.java#member
outcome: assumption-violation
config: |
  CONSTANTS
  A = x_1
  B = y_1
---*)
---- MODULE member_other_type_set ----
CONSTANTS A, B
ASSUME A \in {B}
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 16 of module member_other_type_set failed.
    Attempted to check equality of the differently-typed model values y_1 and x_1
---*)
