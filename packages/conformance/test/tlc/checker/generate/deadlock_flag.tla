(*---
description: -generate with -deadlock ends a trace at a dead end.
ref: tlc2/tool/SimulationWorker.java#simulateRandomTrace
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -generate
  - num=1
  - -depth
  - "5"
  - -deadlock
---*)
---- MODULE deadlock_flag ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 1 /\ x' = x + 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 2
    Simulation using seed 4 and aril 0
---*)
