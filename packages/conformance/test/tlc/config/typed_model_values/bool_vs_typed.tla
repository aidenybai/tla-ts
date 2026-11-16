(*---
description: Comparing a Boolean with a typed model value is an error.
ref: tlc2/value/impl/ModelValue.java#modelValueEquals
outcome: assumption-violation
config: |
  CONSTANTS
  A = x_1
  B = x_1
---*)
---- MODULE bool_vs_typed ----
CONSTANTS A, B
ASSUME TRUE = A
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 15 of module bool_vs_typed failed.
    Attempted to check equality of the typed model value x_1 and the non-model value
    TRUE
---*)
