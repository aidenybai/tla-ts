(*---
description: UNCHANGED {x} isn't decomposed like a tuple, so it fails on the unassigned x'.
ref: tlc2/tool/impl/Tool.java#verifyUnchanged
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE set_enumeration_unassigned ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == UNCHANGED {x}
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
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 20 to line 13, col 20 of module set_enumeration_unassigned
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 20 to line 13, col 20 of module set_enumeration_unassigned
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 21 in set_enumeration_unassigned
    1. Line 13, column 19 to line 13, column 21 in set_enumeration_unassigned
    2. Line 13, column 20 to line 13, column 20 in set_enumeration_unassigned
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
