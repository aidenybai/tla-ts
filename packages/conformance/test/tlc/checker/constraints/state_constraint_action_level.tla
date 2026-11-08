(*---
description: A CONSTRAINT with a prime fails on the missing next state.
ref: tlc2/tool/impl/Tool.java#isInModel
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE state_constraint_action_level ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Con == x' < 2
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    x = 0
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 15, col 8 to line 15, col 8 of module state_constraint_action_level
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in state_constraint_action_level
    1. Line 15, column 8 to line 15, column 13 in state_constraint_action_level
    2. Line 15, column 8 to line 15, column 9 in state_constraint_action_level
    3. Line 15, column 8 to line 15, column 8 in state_constraint_action_level
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
