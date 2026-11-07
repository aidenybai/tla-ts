(*---
description: Explores init guard_first and next unassigned with check invariant_non_boolean.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE space_guard_first__unassigned__invariant_non_boolean ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == TRUE /\ x = 0 /\ y = 0
Next == x' = x
Inv == 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. 1
    | While working on the initial state:
    | /\ x = 0
    | /\ y = 0
    2215:0 TLC expected a boolean value, but did not find one. 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 30 in space_guard_first__unassigned__invariant_non_boolean
    1. Line 18, column 9 to line 18, column 21 in space_guard_first__unassigned__invariant_non_boolean
    2. Line 18, column 9 to line 18, column 12 in space_guard_first__unassigned__invariant_non_boolean
    3. Line 18, column 17 to line 18, column 21 in space_guard_first__unassigned__invariant_non_boolean
    4. Line 18, column 26 to line 18, column 30 in space_guard_first__unassigned__invariant_non_boolean
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
