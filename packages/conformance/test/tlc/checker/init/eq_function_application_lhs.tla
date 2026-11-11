(*---
description: x[1] = 2 does not assign x, because the left side is not a variable, so evaluating x fails.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE eq_function_application_lhs ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x[1] = 2
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 9 to line 13, col 9 of module eq_function_application_lhs
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 16 in eq_function_application_lhs
    1. Line 13, column 9 to line 13, column 12 in eq_function_application_lhs
    2. Line 13, column 9 to line 13, column 9 in eq_function_application_lhs
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
