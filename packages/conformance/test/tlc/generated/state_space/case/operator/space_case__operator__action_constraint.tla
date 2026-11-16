(*---
description: Explores init case and next operator with check action_constraint.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  ACTION_CONSTRAINT Con
---*)
---- MODULE space_case__operator__action_constraint ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x = 1 /\ CASE x = 1 -> y = 0 [] OTHER -> y = 1
Next == Assign(x, y)'
Con == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 16, col 17 to line 16, col 17 of module space_case__operator__action_constraint
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 1
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 21 in space_case__operator__action_constraint
    1. Line 19, column 9 to line 19, column 20 in space_case__operator__action_constraint
    2. Line 16, column 17 to line 16, column 30 in space_case__operator__action_constraint
    3. Line 16, column 17 to line 16, column 21 in space_case__operator__action_constraint
    4. Line 16, column 17 to line 16, column 17 in space_case__operator__action_constraint
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
