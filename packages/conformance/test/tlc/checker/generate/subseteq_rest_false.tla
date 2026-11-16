(*---
description: -generate tries more subsets until the rest of the action holds.
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
---- MODULE subseteq_rest_false ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = {}
Next == x' \subseteq {1, 2} /\ x' = {1, 2} /\ PrintT(x')
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | {1, 2}
    | {1, 2}
    | {1, 2}
    | {1, 2}
    2209:0 Progress(1) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 5
    Simulation using seed 4 and aril 0
---*)
