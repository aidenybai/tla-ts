(*---
description: Testing a typed model value against a set of integers is an error.
ref: tlc2/value/impl/ModelValue.java#modelValueMember
outcome: assumption-violation
config: |
  CONSTANTS
  A = x_1
  B = x_1
---*)
---- MODULE member_of_int_set ----
CONSTANTS A, B
ASSUME A \in {1, 2}
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 19 of module member_of_int_set failed.
    Attempted to check equality of the typed model value x_1 and the non-model value
    1
---*)
