(*---
description: Explores init reversed and next prime_read_before_assign with check plain.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE space_reversed__prime_read_before_assign__plain ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == y = 0 /\ x = y
Next == x' = y' /\ y' = y

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
    2280:0 In evaluation, the identifier y is either undefined or not an operator.
    line 18, col 14 to line 18, col 14 of module space_reversed__prime_read_before_assign__plain
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 25 in space_reversed__prime_read_before_assign__plain
    1. Line 18, column 9 to line 18, column 15 in space_reversed__prime_read_before_assign__plain
    2. Line 18, column 14 to line 18, column 15 in space_reversed__prime_read_before_assign__plain
    3. Line 18, column 14 to line 18, column 14 in space_reversed__prime_read_before_assign__plain
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
