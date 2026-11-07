(*---
description: Explores init chosen and next composition with check action_constraint.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  ACTION_CONSTRAINT Con
---*)
---- MODULE space_chosen__composition__action_constraint ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x = CHOOSE e \in 0..1 : TRUE /\ y = 0
Next == (x' = x /\ y' = y) \cdot (x' = x /\ y' = y)
Con == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2280:0 In evaluation, the identifier y is either undefined or not an operator.
    line 18, col 41 to line 18, col 41 of module space_chosen__composition__action_constraint
    2280:0 In evaluation, the identifier y is either undefined or not an operator.
    line 18, col 41 to line 18, col 41 of module space_chosen__composition__action_constraint
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 45 in space_chosen__composition__action_constraint
    1. Line 18, column 13 to line 18, column 45 in space_chosen__composition__action_constraint
    2. Line 18, column 33 to line 18, column 45 in space_chosen__composition__action_constraint
    3. Line 18, column 41 to line 18, column 45 in space_chosen__composition__action_constraint
    4. Line 18, column 41 to line 18, column 41 in space_chosen__composition__action_constraint
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
