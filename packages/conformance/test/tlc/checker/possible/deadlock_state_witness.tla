(*---
description: A state predicate true only in a deadlock state counts.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigPossible
outcome: deadlock
config: |
  INIT Init
  NEXT Next
  _POSSIBLE Pred
---*)
---- MODULE deadlock_state_witness ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 1 /\ x' = x + 1
Pred == x = 1
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module deadlock_state_witness>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
