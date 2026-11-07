(*---
description: Explores init set_equality and next toggle with check plain.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE space_set_equality__toggle__plain ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x \in {0} /\ y \in SUBSET {} /\ y = {} 
Next == x' = x /\ y' = IF y = 0 THEN 1 ELSE 0

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
    : Attempted to check equality of the set {} with the value:
    0
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 45 in space_set_equality__toggle__plain
    1. Line 18, column 9 to line 18, column 14 in space_set_equality__toggle__plain
    2. Line 18, column 19 to line 18, column 45 in space_set_equality__toggle__plain
    3. Line 18, column 24 to line 18, column 45 in space_set_equality__toggle__plain
    4. Line 18, column 27 to line 18, column 31 in space_set_equality__toggle__plain
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
