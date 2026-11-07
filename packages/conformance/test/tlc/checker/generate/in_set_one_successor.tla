(*---
description: -generate picks one element of x' \in S at a step.
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
---- MODULE in_set_one_successor ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' \in 0..9 /\ PrintT(x')
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 9
    | 9
    | 4
    | 0
    2209:0 Progress(1) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 5
    Simulation using seed 4 and aril 0
---*)
