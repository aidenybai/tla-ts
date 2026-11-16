(*---
description: UNCHANGED of one variable leaves the other unassigned, which is reported as unspecified.
ref: tlc2/tool/ModelChecker.java#doNextSetErr
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE partial_unchanged ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 1
Next == UNCHANGED x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2109:1 Successor state is not completely specified by the next-state action. The following variable is not defined: y.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 1
    2217:4 2: <Next line 13, col 9 to line 13, col 19 of module partial_unchanged>
    /\ x = 0
    /\ y = null
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
