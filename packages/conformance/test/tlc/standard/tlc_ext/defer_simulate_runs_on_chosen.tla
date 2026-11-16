(*---
description: In simulation, TLCDefer's expression runs for the chosen successor.
ref: tlc2/tool/SimulationWorker.java#simulateAndReport
features:
  - TLCExt
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "3"
---*)
---- MODULE defer_simulate_runs_on_chosen ----
EXTENDS TLCExt, TLC, Naturals
VARIABLE x
Init == x = 0
Next == /\ x' = (x + 1) % 3
        /\ TLCDefer(PrintT(<<"deferred", x, x'>>))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | <<"deferred", 0, 1>>
    | <<"deferred", 1, 2>>
    | <<"deferred", 2, 0>>
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
---*)
