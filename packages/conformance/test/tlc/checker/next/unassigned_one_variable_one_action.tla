(*---
description: A successor missing one variable with a single action reports that variable, without an action name, and prints the partial state.
ref: tlc2/tool/ModelChecker.java#doNextSetErr
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE unassigned_one_variable_one_action ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x' = 1
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
    2217:4 2: <Next line 13, col 9 to line 13, col 14 of module unassigned_one_variable_one_action>
    /\ x = 1
    /\ y = null
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
