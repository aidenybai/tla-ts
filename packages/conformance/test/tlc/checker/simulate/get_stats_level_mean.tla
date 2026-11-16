(*---
description: TLCGet("stats") reports the mean and variance of the levels of finished traces.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=3
  - -depth
  - "2"
---*)
---- MODULE get_stats_level_mean ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1 /\ PrintT(<<TLCGet("stats").levelmean, TLCGet("stats").levelvariance>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | <<0, 0>>
    | <<0, 0>>
    | <<2, 0>>
    | <<2, 0>>
    | <<2, 0>>
    | <<2, 0>>
    2209:0 Progress(3) at <date>: 7 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(3) at <date>: 7 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 7
    Simulation using seed 4 and aril 0
---*)
