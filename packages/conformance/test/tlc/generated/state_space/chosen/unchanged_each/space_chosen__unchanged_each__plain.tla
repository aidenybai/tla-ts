(*---
description: Explores init chosen and next unchanged_each with check plain.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE space_chosen__unchanged_each__plain ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x = CHOOSE e \in 0..1 : TRUE /\ y = 0
Next == UNCHANGED x /\ UNCHANGED y

====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2280:0 In evaluation, the identifier y is either undefined or not an operator.
    line 17, col 41 to line 17, col 41 of module space_chosen__unchanged_each__plain
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 45 in space_chosen__unchanged_each__plain
    1. Line 17, column 13 to line 17, column 45 in space_chosen__unchanged_each__plain
    2. Line 17, column 33 to line 17, column 45 in space_chosen__unchanged_each__plain
    3. Line 17, column 41 to line 17, column 45 in space_chosen__unchanged_each__plain
    4. Line 17, column 41 to line 17, column 41 in space_chosen__unchanged_each__plain
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
