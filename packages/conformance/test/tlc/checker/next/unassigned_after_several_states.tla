(*---
description: The trace for a missing variable leads to the state where the action fails.
ref: tlc2/tool/ModelChecker.java#doNextSetErr
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE unassigned_after_several_states ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == IF x < 2 THEN x' = x + 1 /\ y' = 0 ELSE x' = 0
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
    /\ y = 0
    2217:4 2: <Next line 13, col 9 to line 13, col 54 of module unassigned_after_several_states>
    /\ x = 1
    /\ y = 0
    2217:4 3: <Next line 13, col 9 to line 13, col 54 of module unassigned_after_several_states>
    /\ x = 2
    /\ y = 0
    2217:4 4: <Next line 13, col 9 to line 13, col 54 of module unassigned_after_several_states>
    /\ x = 0
    /\ y = null
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
