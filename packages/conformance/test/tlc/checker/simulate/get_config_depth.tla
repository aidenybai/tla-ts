(*---
description: TLCGet("config").depth is the trace depth of -depth.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
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
---- MODULE get_config_depth ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1 /\ PrintT(TLCGet("config").depth)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 3
    | 3
    | 3
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
---*)
