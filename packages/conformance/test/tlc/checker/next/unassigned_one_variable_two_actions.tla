(*---
description: With several actions, the message for a missing variable names the action.
ref: tlc2/tool/ModelChecker.java#doNextSetErr
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE unassigned_one_variable_two_actions ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
A == x' = 1 /\ y' = 1
B == x' = 2
Next == A \/ B
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2109:1 Successor state is not completely specified by action B of the next-state relation. The following variable is not defined: y.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <B line 14, col 6 to line 14, col 11 of module unassigned_one_variable_two_actions>
    /\ x = 2
    /\ y = null
    2199:0 3 states generated, 2 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
