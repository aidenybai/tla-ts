(*---
description: <> in an action being evaluated is a temporal formula in a predicate.
ref: tlc2/tool/impl/Tool.java#evalAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  ACTION_CONSTRAINT Prop
---*)
---- MODULE diamond_in_action_constraint ----
EXTENDS Naturals
VARIABLE x
vars == x
A == x' = x
P == x = 0
Init == x = 0
Next == x' = x
Prop == <>P
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
    : @!@!@STARTMSG 2261:0 @!@!@
    TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 18, col 9 to line 18, col 11 of module diamond_in_action_constraint
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2261:0 @!@!@
    TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 18, col 9 to line 18, col 11 of module diamond_in_action_constraint
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 17, col 9 to line 17, col 14 of module diamond_in_action_constraint>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 11 in diamond_in_action_constraint
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
