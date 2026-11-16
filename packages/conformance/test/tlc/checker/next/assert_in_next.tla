(*---
description: A failing Assert in Next prints its message, the behavior and the assertion exit status.
ref: tlc2/module/TLC.java#Assert
outcome: assertion-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE assert_in_next ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == Assert(x < 1, "x too big") /\ x' = x + 1
====

(*--- recorded
all:
  exit: 14
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2132:1 The first argument of Assert evaluated to FALSE; the second argument was:
    "x too big"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 13, col 9 to line 13, col 48 of module assert_in_next>
    x = 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 48 in assert_in_next
    1. Line 13, column 9 to line 13, column 34 in assert_in_next
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
