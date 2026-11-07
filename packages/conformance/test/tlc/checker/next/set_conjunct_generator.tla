(*---
description: A non-Boolean built-in in the generator path reports the value it found.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE set_conjunct_generator ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x' = 1 /\ {1} /\ y' = 1
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
    : @!@!@STARTMSG 2247:0 @!@!@
    In computing next states, TLC expected a boolean expression,
    but instead found {1}.
    line 13, col 19 to line 13, col 21 of module set_conjunct_generator
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2247:0 @!@!@
    In computing next states, TLC expected a boolean expression,
    but instead found {1}.
    line 13, col 19 to line 13, col 21 of module set_conjunct_generator
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 31 in set_conjunct_generator
    1. Line 13, column 9 to line 13, column 21 in set_conjunct_generator
    2. Line 13, column 9 to line 13, column 14 in set_conjunct_generator
    3. Line 13, column 19 to line 13, column 21 in set_conjunct_generator
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
