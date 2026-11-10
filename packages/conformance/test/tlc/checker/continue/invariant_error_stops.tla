(*---
description: -continue stops at an evaluation error in an invariant.
ref: tlc2/tool/ModelChecker.java#doNextCheckInvariants
features:
  - tlc-bug
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -continue
correct:
  all:
    exit: 76
    transcript: |-
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2111:1 Evaluating invariant Inv failed.
      2179:0 The second argument of \div is 0.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      x = 0
      2217:4 2: <Next line 33, col 9 to line 33, col 18 of module invariant_error_stops>
      x = 1
      2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 2.
      2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)
---- MODULE invariant_error_stops ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == 1 \div (1 - x) >= 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2111:1 Evaluating invariant Inv failed.
    2179:0 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 33, col 9 to line 33, col 18 of module invariant_error_stops>
    x = 1
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 33, col 9 to line 33, col 18 of module invariant_error_stops>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).
---*)
