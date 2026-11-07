(*---
description: A non-Boolean invariant on a successor reports the invariant evaluation failure and the behavior.
ref: tlc2/tool/ModelChecker.java#doNextCheckInvariants
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE non_boolean_on_successor ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1
Inv == IF x = 0 THEN TRUE ELSE 1
====

(*--- recorded
all:
  exit: 76
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2215:0 TLC expected a boolean value, but did not find one. line 15, col 8 to line 15, col 32 of module non_boolean_on_successor
    2215:0 TLC expected a boolean value, but did not find one. line 15, col 8 to line 15, col 32 of module non_boolean_on_successor
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 14 of module non_boolean_on_successor>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)
