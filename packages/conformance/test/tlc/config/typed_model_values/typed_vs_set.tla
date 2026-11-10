(*---
description: Comparing a typed model value with a set is an error.
ref: tlc2/value/impl/ModelValue.java#equals
outcome: assumption-violation
config: |
  CONSTANTS
  A = x_1
  B = x_1
---*)
---- MODULE typed_vs_set ----
CONSTANTS A, B
ASSUME A = {}
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 13 of module typed_vs_set failed.
    Attempted to check equality of typed model value x_1 and non-model value
    {}
---*)
