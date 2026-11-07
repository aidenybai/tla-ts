(*---
description: x = x + 1 on an unassigned x evaluates the right side first and fails on the unassigned x.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE eq_self_reference ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x = x + 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 13 to line 13, col 13 of module eq_self_reference
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 13 to line 13, col 13 of module eq_self_reference
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 17 in eq_self_reference
    1. Line 13, column 13 to line 13, column 17 in eq_self_reference
    2. Line 13, column 13 to line 13, column 13 in eq_self_reference
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
