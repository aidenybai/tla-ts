(*---
description: A second x' = e with an incomparable value is an equality error, and it reports the state it was working on.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE second_eq_incomparable ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x' = 1 /\ x' = "a" /\ y' = 1
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
    : Attempted to check equality of integer 1 with non-integer:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 36 in second_eq_incomparable
    1. Line 13, column 9 to line 13, column 26 in second_eq_incomparable
    2. Line 13, column 9 to line 13, column 14 in second_eq_incomparable
    3. Line 13, column 19 to line 13, column 26 in second_eq_incomparable
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
