(*---
description: A \E bound that depends on a state variable can't be enumerated while splitting, so the whole \E is one action.
ref: tlc2/tool/impl/Tool.java#getActionsAppl
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE exists_state_dependent_bound ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
Next == \E i \in {x + 1, x + 2} : x' = i
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
    2217:4 2: <Next line 15, col 9 to line 15, col 40 of module exists_state_dependent_bound>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
