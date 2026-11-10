(*---
description: A bulleted list of disjuncts splits like infix \/, and the location is that of the bullet's expression.
ref: tlc2/tool/impl/Tool.java#getActionsAppl
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE bulleted_disjuncts ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
Next == \/ x' = 2
        \/ x' = 1
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
    2217:4 2: <Next line 15, col 12 to line 15, col 17 of module bulleted_disjuncts>
    x = 2
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
