(*---
description: As many initial states as the bound fit.
ref: tlc2/tool/StateVec.java#grow
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -maxSetSize
  - "2"
---*)
---- MODULE simulation_within_bound ----
EXTENDS Naturals
VARIABLE x
Init == x \in 1..2
Next == x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 2 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 102 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 102 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 102
    Simulation using seed 4 and aril 0
---*)
