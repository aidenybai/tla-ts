(*---
description: The reported depth at a deadlock is the deadlocked state's depth plus any already-found deeper state.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: deadlock
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE depth_counts_deadlock_state ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {0, 10}
Next == \/ x \in {0, 1, 2} /\ x' = x + 1
        \/ x = 3 /\ x' = 3
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 10
    2199:0 3 states generated, 3 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
