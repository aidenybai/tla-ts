(*---
description: "A non-Boolean disjunct in Init takes a different path from a conjunct: the general message that the init state relation isn't Boolean."
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE non_boolean_disjunct_in_init ----
VARIABLE x
Init == x = 0 \/ 3
Next == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 The init state relation is not a boolean expression.
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 18 in non_boolean_disjunct_in_init
    1. Line 11, column 18 to line 11, column 18 in non_boolean_disjunct_in_init
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
