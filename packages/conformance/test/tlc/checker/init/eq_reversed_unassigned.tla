(*---
description: e = x does not assign x because only the left side of = is a candidate variable, so evaluating x fails.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE eq_reversed_unassigned ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == 1 = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 13 to line 13, col 13 of module eq_reversed_unassigned
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 13 to line 13, col 13 of module eq_reversed_unassigned
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in eq_reversed_unassigned
    1. Line 13, column 13 to line 13, column 13 in eq_reversed_unassigned
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
