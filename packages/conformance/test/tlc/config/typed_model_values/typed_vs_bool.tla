(*---
description: Comparing a typed model value with a Boolean is an error.
ref: tlc2/value/impl/ModelValue.java#equals
outcome: assumption-violation
config: |
  CONSTANTS
  A = x_1
  B = x_1
---*)
---- MODULE typed_vs_bool ----
CONSTANTS A, B
ASSUME A = TRUE
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 15 of module typed_vs_bool failed.
    Attempted to check equality of typed model value x_1 and non-model value
    TRUE
---*)
