(*---
description: Explores init disjunction and next operator with check no_deadlock_check.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  CHECK_DEADLOCK FALSE
---*)
---- MODULE space_disjunction__operator__no_deadlock_check ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == (x = 0 \/ x = 1) /\ y = 0
Next == Assign(x, y)'

====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 16, col 17 to line 16, col 17 of module space_disjunction__operator__no_deadlock_check
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 16, col 17 to line 16, col 17 of module space_disjunction__operator__no_deadlock_check
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 21 in space_disjunction__operator__no_deadlock_check
    1. Line 19, column 9 to line 19, column 20 in space_disjunction__operator__no_deadlock_check
    2. Line 16, column 17 to line 16, column 30 in space_disjunction__operator__no_deadlock_check
    3. Line 16, column 17 to line 16, column 21 in space_disjunction__operator__no_deadlock_check
    4. Line 16, column 17 to line 16, column 17 in space_disjunction__operator__no_deadlock_check
    2199:0 2 states generated, 2 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
