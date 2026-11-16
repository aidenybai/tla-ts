(*---
description: -generate returns after the first disjunct that gives a state, in random order.
ref: tlc2/tool/impl/Tool.java#getNextStatesAppl
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -generate
  - num=1
  - -depth
  - "4"
---*)
---- MODULE disjunction_one_successor ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x = x /\ ((x' = 1 /\ PrintT(1)) \/ (x' = 2 /\ PrintT(2)) \/ (x' = 3 /\ PrintT(3)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 3
    | 3
    | 3
    | 1
    2209:0 Progress(1) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 5
    Simulation using seed 4 and aril 0
---*)
