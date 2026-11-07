(*---
description: "An Init of state level that reads a variable nothing assigned fails with the undefined identifier message, before a non-Boolean result could be seen."
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE non_boolean_operator_with_state_level ----
EXTENDS Naturals
VARIABLE x
D == x + 1
Init == D
Next == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 12, col 6 to line 12, col 6 of module non_boolean_operator_with_state_level
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 12, col 6 to line 12, col 6 of module non_boolean_operator_with_state_level
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 9 in non_boolean_operator_with_state_level
    1. Line 12, column 6 to line 12, column 10 in non_boolean_operator_with_state_level
    2. Line 12, column 6 to line 12, column 6 in non_boolean_operator_with_state_level
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
