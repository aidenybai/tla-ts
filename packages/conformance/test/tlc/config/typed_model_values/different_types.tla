(*---
description: Comparing model values of different types is an error.
ref: tlc2/value/impl/ModelValue.java#equals
outcome: assumption-violation
config: |
  CONSTANTS
  A = x_1
  B = y_1
---*)
---- MODULE different_types ----
CONSTANTS A, B
ASSUME A = B
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 12 of module different_types failed.
    Attempted to check equality of the differently-typed model values x_1 and y_1
---*)
