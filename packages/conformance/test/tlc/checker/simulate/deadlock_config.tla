(*---
description: CHECK_DEADLOCK FALSE makes a state with no successor end the trace in simulation.
ref: tlc2/tool/Simulator.java#Simulator
outcome: success
config: |
  INIT Init
  NEXT Next
  CHECK_DEADLOCK FALSE
args:
  - -simulate
  - num=2
  - -depth
  - "5"
---*)
---- MODULE deadlock_config ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(2) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 5
    Simulation using seed 4 and aril 0
---*)
