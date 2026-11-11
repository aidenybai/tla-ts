(*---
description: ASSUME is evaluated once before simulation starts.
ref: tlc2/tool/Simulator.java#simulate
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "1"
---*)
---- MODULE assume_runs_once ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
ASSUME PrintT("assume")
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "assume"
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 2
    Simulation using seed 4 and aril 0
---*)
