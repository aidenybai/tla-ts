(*---
description: A non-Boolean constraint on a successor prints the behavior.
ref: tlc2/tool/impl/Tool.java#isInModel
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE nonboolean_state_on_successor ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Con == IF x = 0 THEN TRUE ELSE 1
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
    : @!@!@STARTMSG 2215:0 @!@!@
    TLC expected a boolean value, but did not find one. line 15, col 8 to line 15, col 32 of module nonboolean_state_on_successor
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2215:0 @!@!@
    TLC expected a boolean value, but did not find one. line 15, col 8 to line 15, col 32 of module nonboolean_state_on_successor
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module nonboolean_state_on_successor>
    x = 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
