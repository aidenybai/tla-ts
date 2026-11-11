(*---
description: Without -depth, each trace has 100 steps, so the generated count shows the default.
ref: tlc2/TLC.java#TLC
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
---*)
---- MODULE default_depth_100 ----
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
    2209:0 Progress(1) at <date>: 101 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 101 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 101
    Simulation using seed 4 and aril 0
---*)
