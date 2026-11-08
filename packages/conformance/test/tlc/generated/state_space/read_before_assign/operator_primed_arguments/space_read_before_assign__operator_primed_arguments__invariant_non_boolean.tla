(*---
description: Explores init read_before_assign and next operator_primed_arguments with check invariant_non_boolean.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE space_read_before_assign__operator_primed_arguments__invariant_non_boolean ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x = y /\ y = 0
Next == x' = x /\ y' = y /\ Same(x', y')
Inv == 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2280:0 In evaluation, the identifier y is either undefined or not an operator.
    line 18, col 13 to line 18, col 13 of module space_read_before_assign__operator_primed_arguments__invariant_non_boolean
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 22 in space_read_before_assign__operator_primed_arguments__invariant_non_boolean
    1. Line 18, column 9 to line 18, column 13 in space_read_before_assign__operator_primed_arguments__invariant_non_boolean
    2. Line 18, column 13 to line 18, column 13 in space_read_before_assign__operator_primed_arguments__invariant_non_boolean
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
