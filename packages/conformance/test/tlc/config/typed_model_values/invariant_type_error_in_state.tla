(*---
description: An invariant comparing a typed model value in a state with an integer is an invariant evaluation failure.
ref: tlc2/value/impl/ModelValue.java#equals
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  CONSTANT A = x_1
  INVARIANT Inv
---*)
---- MODULE invariant_type_error_in_state ----
CONSTANT A
VARIABLE x
Init == x = A
Next == x' = x
Inv == x # 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of typed model value x_1 and non-model value
    1
    While working on the initial state:
    x = x_1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 13 in invariant_type_error_in_state
    1. Line 16, column 8 to line 16, column 12 in invariant_type_error_in_state
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
