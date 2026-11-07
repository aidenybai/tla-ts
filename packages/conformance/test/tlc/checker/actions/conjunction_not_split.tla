(*---
description: A conjunction with a disjunction inside is one action with the location of the conjunction.
ref: tlc2/tool/impl/Tool.java#getActionsAppl
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE conjunction_not_split ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
A == x' = 1
B == x' = 2
Next == TRUE /\ (A \/ B)
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
    2217:4 2: <Next line 17, col 9 to line 17, col 24 of module conjunction_not_split>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
