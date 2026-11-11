(*---
description: A deadlock at the initial state prints one-state behavior in simulation.
ref: tlc2/tool/SimulationWorker.java#simulateRandomTrace
outcome: deadlock
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE deadlock_at_initial ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x > 0 /\ x' = x
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 17, col 9 to line 17, col 13 of module deadlock_at_initial>
    x = 0
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 1
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
---*)
