(*---
description: Explores init tuple and next branch with check no_deadlock_check.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  CHECK_DEADLOCK FALSE
---*)
---- MODULE space_tuple__branch__no_deadlock_check ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == <<x, y>> = <<0, 1>>
Next == x' \in {x} /\ (y' = y \/ y' = y)

====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 18, col 11 to line 18, col 11 of module space_tuple__branch__no_deadlock_check
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 18, col 11 to line 18, col 11 of module space_tuple__branch__no_deadlock_check
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 27 in space_tuple__branch__no_deadlock_check
    1. Line 18, column 9 to line 18, column 16 in space_tuple__branch__no_deadlock_check
    2. Line 18, column 11 to line 18, column 11 in space_tuple__branch__no_deadlock_check
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
