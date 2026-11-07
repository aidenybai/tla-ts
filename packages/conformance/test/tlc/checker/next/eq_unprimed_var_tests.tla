(*---
description: "x = e without a prime tests the current state and doesn't assign x', so the action is disabled at x = 1 and TLC deadlocks there."
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch
outcome: deadlock
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE eq_unprimed_var_tests ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x = 0 /\ x' = 1 /\ PrintT(x')
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    | 1
    2217:4 2: <Next line 13, col 9 to line 13, col 37 of module eq_unprimed_var_tests>
    x = 1
    | 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
