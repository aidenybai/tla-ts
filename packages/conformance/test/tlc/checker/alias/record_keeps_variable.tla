(*---
description: A record alias can include fields named as variables.
ref: tlc2/value/impl/RecordValue.java#toState
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
---*)
---- MODULE record_keeps_variable ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
A == [x |-> x, y |-> x + 1]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 1
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module record_keeps_variable>
    /\ x = 1
    /\ y = 2
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module record_keeps_variable>
    /\ x = 2
    /\ y = 3
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
