(*---
description: Explores init read_before_assign and next let with check plain.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE space_read_before_assign__let__plain ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x = y /\ y = 0
Next == LET k == x IN x' = k /\ y' = y

====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2280:0 In evaluation, the identifier y is either undefined or not an operator.
    line 17, col 13 to line 17, col 13 of module space_read_before_assign__let__plain
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 22 in space_read_before_assign__let__plain
    1. Line 17, column 9 to line 17, column 13 in space_read_before_assign__let__plain
    2. Line 17, column 13 to line 17, column 13 in space_read_before_assign__let__plain
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
