(*---
description: x \in {y} evaluates its right side before a later conjunct can assign y, so it fails.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE in_rhs_uses_later_variable ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == x \in {y} /\ y = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2280:0 In evaluation, the identifier y is either undefined or not an operator.
    line 13, col 16 to line 13, col 16 of module in_rhs_uses_later_variable
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 26 in in_rhs_uses_later_variable
    1. Line 13, column 9 to line 13, column 17 in in_rhs_uses_later_variable
    2. Line 13, column 15 to line 13, column 17 in in_rhs_uses_later_variable
    3. Line 13, column 16 to line 13, column 16 in in_rhs_uses_later_variable
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
