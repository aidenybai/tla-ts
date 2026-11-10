(*---
description: With two initial states, the first dequeued state that deadlocks is the one reported.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: deadlock
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE first_deadlocked_state_in_bfs_order ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {1, 2}
Next == x > 5 /\ x' = x
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
