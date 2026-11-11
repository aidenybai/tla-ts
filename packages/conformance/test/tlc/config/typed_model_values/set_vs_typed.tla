(*---
description: Comparing a set with a typed model value is an error.
ref: tlc2/value/impl/ModelValue.java#modelValueEquals
outcome: assumption-violation
config: |
  CONSTANTS
  A = x_1
  B = x_1
---*)
---- MODULE set_vs_typed ----
CONSTANTS A, B
ASSUME {} = A
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 13 of module set_vs_typed failed.
    Attempted to check equality of the typed model value x_1 and the non-model value
    {}
---*)
