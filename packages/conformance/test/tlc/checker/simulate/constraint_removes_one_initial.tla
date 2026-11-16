(*---
description: A state constraint false in one initial state filters it out in simulation.
ref: tlc2/tool/Simulator.java#simulate
outcome: success
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
args:
  - -simulate
  - num=1
  - -depth
  - "2"
---*)
---- MODULE constraint_removes_one_initial ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {0, 1}
Next == x' = x
Con == x > 0
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
---*)
