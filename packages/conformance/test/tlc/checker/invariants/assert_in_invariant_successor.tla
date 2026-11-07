(*---
description: A failed Assert in an invariant on a successor is the invariant evaluation failure, and it exits with its status, not Assert's.
ref: tlc2/tool/ModelChecker.java#doNextCheckInvariants
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE assert_in_invariant_successor ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1
Inv == Assert(x = 0, "bad")
====

(*--- recorded
all:
  exit: 76
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "bad"
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "bad"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 14 of module assert_in_invariant_successor>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)
