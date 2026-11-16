(*---
description: TLCDefer runs its operator only for the successor that simulation chooses.
ref: tlc2/tool/SimulationWorker.java#simulateRandomTrace
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "2"
---*)
---- MODULE defer_runs_for_chosen_successor ----
EXTENDS Naturals, TLC, TLCExt
VARIABLE x
Init == x = 0
Next == \E i \in 1..2 : x' = i /\ TLCDefer(PrintT(i))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    | 1
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
---*)
