(*---
description: -continue stops at a deadlock.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: deadlock
config: |
  INIT Init
  NEXT Next
args:
  - -continue
---*)
---- MODULE deadlock_stops ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {0, 1}
Next == x = 5 /\ x' = x
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2199:0 2 states generated, 2 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
