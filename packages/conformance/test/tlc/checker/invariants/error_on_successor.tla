(*---
description: An evaluation error in an invariant on a successor names the invariant and prints the behavior and stack.
ref: tlc2/tool/ModelChecker.java#doNextCheckInvariants
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE error_on_successor ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 1
Next == x' = x - 1
Inv == 1 \div x > 0
====

(*--- recorded
all:
  exit: 76
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 1
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module error_on_successor>
    x = 0
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)
