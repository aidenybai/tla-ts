(*---
description: Three traces of depth d generate 3d + 1 states, since the initial states count once.
ref: tlc2/tool/Simulator.java#simulate
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=3
  - -depth
  - "4"
---*)
---- MODULE three_traces_counts ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(3) at <date>: 13 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(3) at <date>: 13 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 13
    Simulation using seed 4 and aril 0
---*)
