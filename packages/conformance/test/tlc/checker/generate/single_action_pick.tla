(*---
description: -generate splits actions the same way as simulation and picks one of them.
ref: tlc2/tool/SimulationWorker.java#simulateRandomTrace
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
---- MODULE single_action_pick ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
A == x' = 1 /\ PrintT("A")
B == x' = 2 /\ PrintT("B")
Next == A \/ B
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | "A"
    | "A"
    | "A"
    | "B"
    2209:0 Progress(1) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 5
    Simulation using seed 4 and aril 0
---*)
