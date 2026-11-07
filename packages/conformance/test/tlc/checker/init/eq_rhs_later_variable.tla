(*---
description: The right side of x = y is evaluated eagerly, so y must already have a value even if a later conjunct assigns it.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE eq_rhs_later_variable ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == x = y /\ y = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2280:0 In evaluation, the identifier y is either undefined or not an operator.
    line 13, col 13 to line 13, col 13 of module eq_rhs_later_variable
    2280:0 In evaluation, the identifier y is either undefined or not an operator.
    line 13, col 13 to line 13, col 13 of module eq_rhs_later_variable
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 22 in eq_rhs_later_variable
    1. Line 13, column 9 to line 13, column 13 in eq_rhs_later_variable
    2. Line 13, column 13 to line 13, column 13 in eq_rhs_later_variable
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
