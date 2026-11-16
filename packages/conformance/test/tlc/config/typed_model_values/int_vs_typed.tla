(*---
description: Comparing an integer with a typed model value is an error too, through modelValueEquals.
ref: tlc2/value/impl/ModelValue.java#modelValueEquals
outcome: assumption-violation
config: |
  CONSTANTS
  A = x_1
  B = x_1
---*)
---- MODULE int_vs_typed ----
CONSTANTS A, B
ASSUME 1 = A
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 12 of module int_vs_typed failed.
    Attempted to check equality of the typed model value x_1 and the non-model value
    1
---*)
