(*---
description: A name starting with a digit and underscore is typed, so comparison with an integer is an error.
ref: tlc2/value/impl/ModelValue.java#ModelValue
outcome: assumption-violation
config: |
  CONSTANTS
  A = 1_a
  B = 1_a
---*)
---- MODULE digit_type_vs_int ----
CONSTANTS A, B
ASSUME A = 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 12 of module digit_type_vs_int failed.
    Attempted to check equality of typed model value 1_a and non-model value
    1
---*)
