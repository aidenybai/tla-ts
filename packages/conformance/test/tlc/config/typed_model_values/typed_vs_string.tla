(*---
description: Comparing a typed model value with the string of its name is an error.
ref: tlc2/value/impl/ModelValue.java#equals
outcome: assumption-violation
config: |
  CONSTANTS
  A = x_1
  B = x_1
---*)
---- MODULE typed_vs_string ----
CONSTANTS A, B
ASSUME A = "x_1"
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 16 of module typed_vs_string failed.
    Attempted to check equality of typed model value x_1 and non-model value
    "x_1"
---*)
