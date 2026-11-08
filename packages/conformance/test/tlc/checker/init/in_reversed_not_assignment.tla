(*---
description: "{x} \\in S doesn't assign x, because the left side of \\in is not a variable."
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE in_reversed_not_assignment ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == {x} \in {{1}}
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 10 to line 13, col 10 of module in_reversed_not_assignment
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 21 in in_reversed_not_assignment
    1. Line 13, column 9 to line 13, column 11 in in_reversed_not_assignment
    2. Line 13, column 10 to line 13, column 10 in in_reversed_not_assignment
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
