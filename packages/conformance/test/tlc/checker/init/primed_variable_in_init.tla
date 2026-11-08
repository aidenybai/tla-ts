(*---
description: x' = 1 in Init is not an assignment of x, because the primed left side is not a variable, so it fails to evaluate.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE primed_variable_in_init ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x' = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 9 to line 13, col 9 of module primed_variable_in_init
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 14 in primed_variable_in_init
    1. Line 13, column 9 to line 13, column 10 in primed_variable_in_init
    2. Line 13, column 9 to line 13, column 9 in primed_variable_in_init
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
