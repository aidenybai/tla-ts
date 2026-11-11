(*---
description: A violation stops the run with the rest of the frontier still on the queue, and the count says so.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE left_on_queue_on_violation ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' \in {1, 2, 3}
Inv == x # 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 24 of module left_on_queue_on_violation>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
