(*---
description: -continue stops at a successor with an unassigned variable.
ref: tlc2/tool/ModelChecker.java#doNext
features:
  - tlc-bug
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -continue
correct:
  all:
    exit: 75
    transcript: |-
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2109:1 Successor state is not completely specified by the next-state action. The following variable is not defined: y.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      /\ x = 0
      /\ y = 0
      2217:4 2: <Next line 32, col 9 to line 32, col 14 of module unassigned_stops>
      /\ x = 0
      /\ y = null
      2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 1.
---*)
---- MODULE unassigned_stops ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x' = x
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
    2217:4 2: <Next line 17, col 9 to line 17, col 14 of module unassigned_stops>
    /\ x = 0
    /\ y = null
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.ArrayIndexOutOfBoundsException
    : Index 32767 out of bounds for length 1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <Next line 17, col 9 to line 17, col 14 of module unassigned_stops>
    /\ x = 0
    /\ y = null
    2109:1 Successor state is not completely specified by the next-state action. The following variable is not defined: y.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <Next line 17, col 9 to line 17, col 14 of module unassigned_stops>
    /\ x = 0
    /\ y = null
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
