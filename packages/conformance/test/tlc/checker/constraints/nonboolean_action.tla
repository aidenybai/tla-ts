(*---
description: A non-Boolean action constraint fails with the expected-value message.
ref: tlc2/tool/impl/Tool.java#isInActions
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  ACTION_CONSTRAINT Con
---*)
---- MODULE nonboolean_action ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Con == x' + 1
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
    TLC expected a boolean value, but did not find one. line 15, col 8 to line 15, col 13 of module nonboolean_action
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2215:0 @!@!@
    TLC expected a boolean value, but did not find one. line 15, col 8 to line 15, col 13 of module nonboolean_action
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 14 of module nonboolean_action>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
